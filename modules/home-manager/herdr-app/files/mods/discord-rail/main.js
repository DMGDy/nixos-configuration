// The server rail: Home, then every space as a server icon (round, squircle on
// hover or when selected, with the white pill on the left), a red mention badge
// when an agent there needs you, then Add a Server and Explore.
import { View, div } from "gpui-kit";
import { v_flex } from "gpui-base";
import { run, spaces } from "herdr";
import { C, icon, initials } from "./kit.js";

export default class Rail extends View {
  init() { this.hover = null; }
  render() {
    const all = spaces();
    const server = (s) => {
      const on = s.active, hov = this.hover === s.id;
      const name = s.name === "~" ? "Home" : s.name;
      const needs = s.tabs.filter((t) => t.status === "blocked").length;
      const unread = s.tabs.some((t) => t.status === "done");
      return div().id(`srv-${s.id}`).relative().w_full().h(56).flex().items_center().justify_center()
        .on_hover((h, cx) => { this.hover = h ? s.id : this.hover === s.id ? null : this.hover; cx.notify(); })
        .on_click(() => run("space.select", { id: s.id }))
        .child(div().absolute().left(0).top(on ? 8 : hov ? 18 : 24).w(4).h(on ? 40 : hov ? 20 : unread ? 8 : 0).rounded_tr(4).rounded_br(4).bg("#ffffff"))
        .child(div().size(48).rounded(on || hov ? 16 : 24).bg(on || hov ? C.blurple : C.chat).flex().items_center().justify_center()
          .text_size(16).font_semibold().text_color(on || hov ? "#ffffff" : C.text).child(initials(name)))
        .when(needs > 0, (el) => el.child(div().absolute().right(10).bottom(6).min_w(18).h(18).px(5).rounded(9).bg(C.red).border(3).border_color(C.rail)
          .flex().items_center().justify_center().text_size(11).font_bold().text_color("#ffffff").child(String(needs))));
    };
    const tool = (id, ic, color, action) => div().id(id).w_full().h(56).flex().items_center().justify_center()
      .child(div().id(`${id}-b`).size(48).rounded(24).bg(C.chat).flex().items_center().justify_center().hover((s) => s.bg(color).rounded(16))
        .on_click(action).child(icon(ic, 22, color === C.green ? C.green : C.text)));
    return v_flex().id("root").size_full().bg(C.rail).pt(12).overflow_y_scrollbar()
      .child(div().id("home").w_full().h(56).flex().items_center().justify_center()
        .child(div().size(48).rounded(16).bg(C.blurple).flex().items_center().justify_center().child(icon("home", 26, "#ffffff"))))
      .child(div().mx(20).my(4).h(2).rounded(1).bg(C.selected))
      .children(all.map(server))
      .child(tool("add", "plus", C.green, () => run("space.new")))
      .child(tool("explore", "compass", C.green, () => run("app.palette")));
  }
}
