// Activities (the rocket by the message box): start something. A new shell
// channel, a scratch terminal popped out in its own window, or any agent the
// app knows how to start (installed ones), each in a new channel.
import { View, div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { props, run, hc, home, knownAgents, closeOverlay, openOverlay } from "herdr";
import { C, icon, picture, smooth, kittenName, kittenPic } from "./kit.js";

export default class Activities extends View {
  init(_props, cx) {
    this.agents = null;
    cx.spawn(async (cx) => {
      try { this.agents = (await knownAgents()).filter((a) => a.installed); } catch (_e) { this.agents = []; }
      cx.notify();
    });
  }

  done() { closeOverlay((props() ?? {}).overlay); }

  // A shell with no parent or tab, floating in a window you can drag around.
  scratch(cx) {
    cx.spawn(async () => {
      const r = await hc(["run", "--bg", "--json", "--no-parent", "--cwd", home(), "--name", `scratch-${Date.now() % 100000}`]);
      const t = JSON.parse(r.stdout);
      const address = t.address ?? t.terminal?.address;
      if (!address) return;
      openOverlay({ kind: "window", key: `scratch-${address}`, width: 760, height: 460, layout: { type: "column", children: [
        { type: "block", size: { px: 40 }, content: { mod: "discord-stream", props: { terminal: address, popout: true } } },
        { type: "block", content: { terminal: address } },
      ] } });
    });
  }

  card(id, art, title, sub, action) {
    return smooth(this, h_flex().id(id).h(52).px(10).gap(12).items_center().rounded(8).cursor_pointer(), id, C.hover, { radius: 8 })
      .on_click((e, cx) => { action(e, cx); this.done(); })
      .child(art)
      .child(v_flex().flex_1().min_w(0)
        .child(div().truncate().text_size(14).font_semibold().text_color(C.header).child(title))
        .child(div().truncate().text_size(12).text_color(C.muted).child(sub)));
  }

  render() {
    const tile = (ic, bg) => div().size(36).flex_none().rounded(10).bg(bg).flex().items_center().justify_center().child(icon(ic, 20, "#ffffff"));
    const label = (s) => div().px(10).pt(10).pb(4).text_size(11).font_bold().text_color(C.muted).child(s);
    return v_flex().id("root").size_full().p(8).gap(2).rounded(8).bg("#232428").border(1).border_color("#ffffff10").overflow_y_scrollbar()
      .child(h_flex().px(10).pt(6).pb(4).gap(8).items_center()
        .child(icon("rocket", 18, C.blurple)).child(div().text_size(16).font_bold().text_color(C.header).child("Activities")))
      .child(label("TERMINALS"))
      .child(this.card("a-shell", tile("terminal", C.green), "New shell channel", "A terminal in its own channel",
        () => { run("terminal.open", { place: "tab" }); run("layout.select", { stack: "convo-stack", child: "live" }); }))
      .child(this.card("a-scratch", tile("popout", C.blurple), "Scratch terminal", "A shell in a window you can drag around",
        (_e, cx) => this.scratch(cx)))
      .child(label("START A KITTEN"))
      .when(this.agents === null, (el) => el.child(div().px(10).h(52).flex().items_center().text_size(13).text_color(C.dim).child("Rounding up kittens…")))
      .when(Array.isArray(this.agents) && !this.agents.length, (el) => el.child(div().px(10).text_size(13).text_color(C.dim).child("No agents installed")))
      .children((this.agents ?? []).map((a, i) => this.card(`a-agent-${i}`,
        picture(kittenPic(a), 36), kittenName(a), a.run.join(" "),
        () => run("terminal.open", { argv: a.run, place: "tab" }))));
  }
}
