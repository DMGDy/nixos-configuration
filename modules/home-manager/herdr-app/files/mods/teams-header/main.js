// The chat header: who you're talking to, the Chat / Files / Changes tabs,
// and the Meet button (a new terminal beside this one).
import { View, div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { run, spaces, layout, openOverlay } from "herdr";
import { BRAND, icon, avatar, presence, chat } from "./kit.js";

function find(n, id) { if (n?.id === id) return n; for (const c of n?.children ?? []) { const f = find(c, id); if (f) return f; } return null; }

export default class Header extends View {
  render() {
    const space = spaces().find((s) => s.active);
    const tab = space?.tabs.find((t) => t.active);
    if (!tab) return h_flex().id("root").size_full().bg("#ffffff");
    const c = chat(tab, space), p = presence(c.status ?? null);
    const panel = find(layout(), "panel"), body = find(layout(), "panel-body");
    const shown = panel && !panel.hidden ? body?.active : "chat";
    const tabBtn = (id, label) => {
      const on = shown === id;
      return v_flex().id(`ht-${id}`).h_full().px(10).justify_center().relative().cursor_pointer()
        .text_size(14).text_color(on ? "#242424" : "#616161").when(on, (s) => s.font_semibold()).hover((s) => s.text_color("#242424"))
        .on_click(() => {
          if (id === "chat") run("layout.hide", { id: "panel" });
          else { run("layout.select", { stack: "panel-body", child: id }); run("layout.show", { id: "panel" }); }
        })
        .child(label)
        .when(on, (el) => el.child(div().absolute().left(10).right(10).bottom(0).h(3).rounded(2).bg(BRAND)));
    };
    const ghost = (id, ic, action, label) => h_flex().id(id).h(32).when(Boolean(label), (s) => s.px(10)).when(!label, (s) => s.w(32)).gap(6).justify_center()
      .items_center().rounded(4).text_size(13).text_color("#424242").hover((s) => s.bg("#f0f0f0")).on_click(action)
      .child(icon(ic, 18, "#424242")).when(Boolean(label), (el) => el.child(label));
    return h_flex().id("root").size_full().bg("#ffffff").border_b(1).border_color("#e0e0e0").pl(20).pr(16).gap(12).items_center()
      .child(avatar(c.name, 32, c.status ?? null, "#ffffff", c.program))
      .child(v_flex().flex_none().max_w(320)
        .child(div().truncate().text_size(15).font_bold().text_color("#242424").child(c.name))
        .child(div().truncate().text_size(11.5).text_color("#616161").child(`${p.word} · ${space.name === "~" ? "Home" : space.name}${c.subs.length ? ` · ${c.subs.length} agents` : ""}`)))
      .child(h_flex().h_full().pl(8).items_center().child(tabBtn("chat", "Chat")).child(tabBtn("files", "Files")).child(tabBtn("changes", "Changes"))
        .child(h_flex().id("ht-add").size(28).justify_center().items_center().rounded(4).hover((s) => s.bg("#f0f0f0"))
          .on_click(() => openOverlay({ mod: "new-menu", kind: "popup", width: 250, height: 512 })).child(icon("plus", 16, "#616161"))))
      .child(div().flex_1())
      .child(ghost("people", "people", () => run("pane.zoom"), String(c.panes.length)))
      .child(h_flex().id("meet").h(32).px(12).gap(6).items_center().rounded(4).bg(BRAND).text_color("#ffffff").text_size(13.5).font_semibold()
        .cursor_pointer().hover((s) => s.bg("#4f52b2")).on_click(() => run("pane.split", { direction: "right" }))
        .child(icon("video", 18, "#ffffff")).child("Meet"))
      .child(ghost("hmore", "more", () => run("app.palette")));
  }
}
