// The channel header: # name, the agent's terminal title as the topic, and the
// toolbar: Live terminal toggle, notifications, pins, member list, search.
import { View, div } from "gpui-kit";
import { h_flex } from "gpui-base";
import { run, spaces, layout } from "herdr";
import { C, icon, channel, herd, typing } from "./kit.js";

function find(n, id) { if (n?.id === id) return n; for (const c of n?.children ?? []) { const f = find(c, id); if (f) return f; } return null; }

export default class Header extends View {
  // In the forum: its icon, name and a topic counting the runs.
  forum() {
    const { top, subs } = herd(), all = [...top, ...subs];
    const busy = all.filter((m) => typing(m)).length, need = all.filter((m) => m.status === "blocked").length;
    const topic = [`${top.length} run${top.length === 1 ? "" : "s"}`, `${subs.length} in threads`, busy && `${busy} typing`, need && `${need} need${need === 1 ? "s" : ""} you`].filter(Boolean).join(" · ");
    return h_flex().id("root").size_full().bg(C.chat).px(16).gap(8).items_center().border_b(1).border_color(C.border)
      .child(icon("forum", 22, C.dim))
      .child(div().text_size(16).font_semibold().text_color(C.header).child("agents"))
      .child(div().w(1).h(24).mx(4).bg(C.selected))
      .child(div().flex_1().min_w(0).truncate().text_size(14).text_color(C.muted).child(topic))
      .child(div().id("back").h(26).px(8).flex().items_center().rounded(4).cursor_pointer().hover((x) => x.bg(C.hover))
        .on_click(() => run("layout.select", { stack: "convo-stack", child: "output" }))
        .child(div().text_size(13).text_color(C.muted).child("Back to channel")));
  }

  render() {
    const s = spaces().find((x) => x.active), t = s?.tabs.find((x) => x.active);
    const c = t ? channel(t) : null;
    const active = find(layout(), "convo-stack")?.active ?? "output";
    const live = active === "live";
    if (active === "forum") return this.forum();
    const membersOn = !(find(layout(), "members")?.hidden ?? false);
    const tool = (id, ic, on, action) => div().id(id).size(28).flex().items_center().justify_center().rounded(4).cursor_pointer()
      .on_click(action).child(icon(ic, 22, on ? C.header : C.muted));
    return h_flex().id("root").size_full().bg(C.chat).px(16).gap(8).items_center().border_b(1).border_color(C.border)
      .child(icon("hash", 22, C.dim))
      .child(div().text_size(16).font_semibold().text_color(C.header).child(c?.name ?? ""))
      .when(Boolean(c?.lead?.title), (el) => el.child(div().w(1).h(24).mx(4).bg(C.selected))
        .child(div().flex_1().min_w(0).truncate().text_size(14).text_color(C.muted).child(c.lead.title)))
      .when(!c?.lead?.title, (el) => el.child(div().flex_1()))
      .child(h_flex().id("live").h(26).px(8).gap(6).items_center().rounded(4).cursor_pointer()
        .bg(live ? C.blurple : C.chat).hover((x) => x.bg(live ? C.blurple : C.hover))
        .on_click(() => run("layout.select", { stack: "convo-stack", child: live ? "output" : "live" }))
        .child(icon("terminal", 16, live ? "#ffffff" : C.muted))
        .child(div().text_size(13).font_medium().text_color(live ? "#ffffff" : C.muted).child(live ? "Live terminal" : "Show terminal")))
      .child(tool("bell", "bell", false, () => {}))
      .child(tool("pins", "pin", false, () => {}))
      .child(tool("members-t", "members", membersOn, () => run("layout.toggle", { id: "members" })))
      .child(h_flex().id("search").w(150).h(24).px(6).items_center().rounded(4).bg(C.rail).text_size(13).text_color(C.dim).cursor_pointer()
        .on_click(() => run("app.palette")).child(div().flex_1().child("Search")).child(icon("search", 14, C.dim)));
  }
}
