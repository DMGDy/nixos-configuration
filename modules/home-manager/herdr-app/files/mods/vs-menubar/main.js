// Title + menu bar: menus (each opens the command palette), the search box,
// the solution (space) name chip, and window buttons.
import { View, div } from "gpui-kit";
import { h_flex } from "gpui-base";
import { run, spaces, window } from "herdr";
import { C, icon } from "./kit.js";

const MENUS = ["File", "Edit", "View", "Git", "Project", "Build", "Debug", "Test", "Analyze", "Tools", "Extensions", "Window", "Help"];

export default class MenuBar extends View {
  render() {
    const w = window(), stop = (_e, cx) => cx.stop_propagation();
    const space = spaces().find((s) => s.active);
    const sol = space ? (space.name === "~" ? "Home" : space.name) : "No solution";
    const winBtn = (id, label, action, danger) => h_flex().id(id).w(46).h_full().justify_center().items_center()
      .text_size(13).text_color(C.text).hover((s) => s.bg(danger ? "#e81123" : C.hover)).on_mouse_down("left", stop).on_click(action).child(label);
    return h_flex().id("root").size_full().bg(C.title).items_center().text_size(13).text_color(C.text)
      .child(h_flex().w(40).h_full().justify_center().items_center()
        .child(div().size(20).rounded(3).bg(C.purple).flex().items_center().justify_center().text_size(12).font_bold().text_color("#ffffff").child("◆")))
      .children(MENUS.map((m) => div().id(`menu-${m}`).px(8).h(24).flex().items_center().rounded(2)
        .hover((s) => s.bg(C.hover)).on_mouse_down("left", stop).on_click(() => run("app.palette")).child(m)))
      .child(h_flex().id("vs-search").ml(10).w(230).h(22).px(6).gap(6).items_center().bg(C.field).border(1).border_color(C.border)
        .text_size(12).text_color(C.muted).hover((s) => s.border_color(C.blue)).on_mouse_down("left", stop).on_click(() => run("app.palette"))
        .child(icon("search", 13, C.muted)).child("Search (Ctrl+Shift+P)"))
      .child(div().ml(10).px(10).h(22).flex().items_center().bg("#3e3e42").text_size(12).text_color(C.text).child(sol))
      .child(div().flex_1())
      .when(Boolean(w?.buttons), (el) => el
        .child(winBtn("min", "—", () => run("window.minimize")))
        .child(winBtn("max", "▢", () => run("window.maximize")))
        .child(winBtn("close", "✕", () => run("window.close"), true)));
  }
}
