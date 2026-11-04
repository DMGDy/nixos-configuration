// The standard toolbar: navigation, configuration dropdowns, the green Start
// button (start a terminal or agent) and pane layout buttons.
import { View, div } from "gpui-kit";
import { h_flex } from "gpui-base";
import { run, openOverlay, focused, agents } from "herdr";
import { C, icon } from "./kit.js";

export default class Toolbar extends View {
  render() {
    const btn = (id, ic, action, color = C.text) => h_flex().id(id).size(24).justify_center().items_center().rounded(2)
      .hover((s) => s.bg(C.hover)).on_click(action).child(icon(ic, 15, color));
    const sep = () => div().w(1).h(18).mx(4).bg(C.border);
    const combo = (id, label, w, action) => h_flex().id(id).w(w).h(22).px(6).gap(4).items_center().bg(C.field).border(1).border_color(C.border)
      .text_size(12).text_color(C.text).hover((s) => s.border_color(C.blue)).on_click(action)
      .child(div().flex_1().truncate().child(label)).child(icon("chev", 12, C.muted));
    const busy = agents().filter((a) => a.status === "working").length;
    return h_flex().id("root").size_full().bg(C.env).px(6).gap(2).items_center().border_b(1).border_color(C.border)
      .child(btn("back", "back", () => run("tab.prev"), C.info))
      .child(btn("fwd", "fwd", () => run("tab.next"), C.info))
      .child(sep())
      .child(btn("new", "plus", () => openOverlay({ mod: "new-menu", kind: "popup", width: 250, height: 512 })))
      .child(btn("save", "save", () => run("app.palette"), C.info))
      .child(btn("undo", "undo", () => run("tab.prev")))
      .child(sep())
      .child(combo("config", "Debug", 90, () => run("app.palette")))
      .child(combo("platform", "Any CPU", 90, () => run("app.palette")))
      .child(h_flex().id("start").ml(4).h(22).px(6).gap(6).items_center().rounded(2).text_size(12).text_color(C.text)
        .hover((s) => s.bg(C.hover)).on_click(() => openOverlay({ mod: "new-menu", kind: "popup", width: 250, height: 512 }))
        .child(icon("play", 14, "#8bd17c")).child("Start"))
      .child(btn("startnd", "playo", () => run("pane.split", { direction: "right" }), "#8bd17c"))
      .child(sep())
      .child(btn("split", "split", () => run("pane.split", { direction: "right" })))
      .child(btn("splitdown", "splitdown", () => run("pane.split", { direction: "down" })))
      .child(btn("zoom", "zoom", () => run("pane.zoom")))
      .child(btn("closepane", "close", () => run("pane.close")))
      .child(div().flex_1())
      .child(h_flex().gap(6).px(8).items_center().text_size(12).text_color(C.muted)
        .child(icon("agent", 14, busy ? C.blueHover : C.muted))
        .child(`${busy} agent${busy === 1 ? "" : "s"} running`)
        .child(div().text_color(C.dim).child(focused()?.terminal ?? "")));
  }
}
