// The thin top bar: the current server name in the middle, inbox and window buttons.
import { View, div } from "gpui-kit";
import { h_flex } from "gpui-base";
import { run, spaces, window } from "herdr";
import { C, icon } from "./kit.js";

export default class TitleBar extends View {
  render() {
    const s = spaces().find((x) => x.active), w = window(), stop = (_e, cx) => cx.stop_propagation();
    const btn = (id, label, action, danger) => h_flex().id(id).w(36).h_full().justify_center().items_center().text_size(12).text_color(C.muted)
      .hover((x) => x.bg(danger ? C.red : C.hover).text_color("#ffffff")).on_mouse_down("left", stop).on_click(action).child(label);
    return h_flex().id("root").size_full().bg(C.rail).items_center()
      .child(div().flex_1())
      .child(div().text_size(13).font_semibold().text_color(C.muted).child(s ? (s.name === "~" ? "Home" : s.name) : ""))
      .child(div().flex_1())
      .child(h_flex().id("inbox").px(10).h_full().items_center().on_mouse_down("left", stop).on_click(() => run("app.palette")).child(icon("inbox", 16, C.muted)))
      .when(Boolean(w?.buttons), (el) => el.child(btn("min", "—", () => run("window.minimize"))).child(btn("max", "▢", () => run("window.maximize")))
        .child(btn("close", "✕", () => run("window.close"), true)));
  }
}
