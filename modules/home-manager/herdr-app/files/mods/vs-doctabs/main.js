// The document well's tab strip: one tab per herdr tab, blue when active,
// with the program's icon, a spinner while its agent works, and a close button.
import { View, div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { run, spaces, openOverlay } from "herdr";
import { C, icon, prog, spinner, doc } from "./kit.js";

export default class DocTabs extends View {
  init() { this.hover = null; }
  render() {
    const space = spaces().find((s) => s.active);
    const tabs = space?.tabs ?? [];
    const tab = (t) => {
      const d = doc(t), on = t.active;
      return h_flex().id(`doc-${t.id}`).h(24).pl(8).pr(4).gap(6).items_center().flex_none().max_w(240)
        .bg(on ? C.blue : C.env).text_size(12).text_color(on ? "#ffffff" : C.text)
        .hover((s) => s.bg(on ? C.blue : C.blueHover).text_color("#ffffff"))
        .on_hover((h, cx) => { this.hover = h ? t.id : this.hover === t.id ? null : this.hover; cx.notify(); })
        .on_click(() => run("tab.select", { id: t.id }))
        .on_mouse_down("middle", () => run("tab.close", { id: t.id }))
        .child(prog(d.lead?.program, 14, on ? "#ffffff" : C.muted))
        .child(div().truncate().child(t.zoomed ? `${d.name} [zoomed]` : d.name))
        .when(t.status === "working", (el) => el.child(spinner(11, on ? "#ffffff" : C.blueHover)))
        .when(t.status === "blocked", (el) => el.child(icon("error", 11, C.error)))
        .when(t.status === "done", (el) => el.child(icon("warning", 11, C.warn)))
        .child(h_flex().id(`docx-${t.id}`).size(16).justify_center().items_center().rounded(2)
          .hover((s) => s.bg(on ? C.blueHover : "#52b0ef"))
          .on_click((_e, cx) => { cx.stop_propagation(); run("tab.close", { id: t.id }); })
          .child(on || this.hover === t.id ? icon("close", 10, "#ffffff") : div().size(10)));
    };
    return v_flex().id("root").size_full().bg(C.env)
      .child(h_flex().h(24).items_end().gap(1).min_w(0)
        .child(h_flex().id("doc-scroll").flex_1().min_w(0).h_full().items_end().gap(1).overflow_x_scrollbar().children(tabs.map(tab)))
        .child(h_flex().id("doc-new").size(22).justify_center().items_center().hover((s) => s.bg(C.hover))
          .on_click(() => openOverlay({ mod: "new-menu", kind: "popup", width: 250, height: 512 })).child(icon("plus", 13, C.muted)))
        .child(h_flex().id("doc-menu").size(22).justify_center().items_center().hover((s) => s.bg(C.hover))
          .on_click(() => run("app.palette")).child(icon("chev", 13, C.muted))))
      .child(div().h(2).w_full().bg(C.blue));
  }
}
