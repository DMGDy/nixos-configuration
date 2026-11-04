// The purple title bar: back/forward, the search box (opens the command palette),
// and the person's avatar and window buttons.
import { View, div } from "gpui-kit";
import { h_flex } from "gpui-base";
import { run, window, focused } from "herdr";
import { PURPLE, icon, avatar } from "./kit.js";

export default class Top extends View {
  render() {
    const w = window(), stop = (_e, cx) => cx.stop_propagation();
    const btn = (id, child, action, wide) => h_flex().id(id).h(32).w(wide ?? 32).justify_center().items_center().rounded(4)
      .text_color("#ffffff").hover((s) => s.bg("#ffffff26")).on_mouse_down("left", stop).on_click(action).child(child);
    return h_flex().id("root").size_full().bg(PURPLE).px(8).gap(4).items_center()
      .child(h_flex().w(320).gap(2).items_center()
        .child(btn("apps", icon("apps", 18, "#ffffff"), () => run("app.palette")))
        .child(div().w(6))
        .child(btn("back", icon("back", 18, "#ffffff"), () => run("tab.prev")))
        .child(btn("fwd", icon("fwd", 18, "#ffffff"), () => run("tab.next"))))
      .child(div().flex_1())
      .child(h_flex().id("search").w(560).h(32).px(10).gap(8).items_center().rounded(4).bg("#ffffffe6")
        .text_size(13.5).text_color("#616161").cursor_pointer().hover((s) => s.bg("#ffffff"))
        .on_mouse_down("left", stop).on_click(() => run("app.palette"))
        .child(icon("search", 16, "#616161")).child("Search").child(div().flex_1())
        .child(div().text_size(11).text_color("#8a8886").child("Ctrl+Shift+P")))
      .child(div().flex_1())
      .child(h_flex().gap(6).items_center()
        .child(btn("more", icon("more", 18, "#ffffff"), () => run("app.settings")))
        .child(avatar(process?.env?.USER ?? "dylandy", 32, focused()?.agent ? "working" : "done", PURPLE))
        .child(div().w(8))
        .when(Boolean(w?.buttons), (el) => el
          .child(btn("min", "—", () => run("window.minimize"), 40))
          .child(btn("max", "▢", () => run("window.maximize"), 40))
          .child(btn("close", "✕", () => run("window.close"), 40))));
  }
}
