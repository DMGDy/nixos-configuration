// "Type a message": Enter sends the text to the focused terminal (hc send),
// so you can talk to an agent from the compose box.
import { View, div } from "gpui-kit";
import { h_flex, v_flex, InputState, Input } from "gpui-base";
import { focused, hc, notify, run } from "herdr";
import { BRAND, icon } from "./kit.js";

export default class Compose extends View {
  init() {
    this.input = InputState.new({ value: "", placeholder: "Type a message" });
    this.focusedIn = false;
    this.input.on("submit", () => this.send());
    this.input.on("focus", (_e, cx) => { this.focusedIn = true; cx.notify(); });
    this.input.on("blur", (_e, cx) => { this.focusedIn = false; cx.notify(); });
  }

  send() {
    const text = this.input.value().trim(), term = focused()?.terminal;
    if (!text) return;
    if (!term) { notify({ title: "No one to send to", body: "Focus a terminal first.", level: "warning" }); return; }
    this.input.set_value("");
    hc(["send", term, text]).then(() => run("pane.focus", { terminal: term }));
  }

  render() {
    const tool = (id, ic, action) => h_flex().id(id).size(30).justify_center().items_center().rounded(4)
      .hover((s) => s.bg("#f0f0f0")).on_click(action).child(icon(ic, 18, "#616161"));
    return v_flex().id("root").size_full().bg("#ffffff").px(20).py(10).justify_center()
      .child(h_flex().h(52).pl(14).pr(6).gap(4).items_center().rounded(4).bg("#ffffff").border(1)
        .border_color("#e0e0e0").border_b(2).border_color(this.focusedIn ? BRAND : "#d1d1d1").shadow_sm()
        .child(div().flex_1().min_w(0).child(Input.new(this.input).w_full().h(36).text_size(14).text_color("#242424")))
        .child(tool("emoji", "smile", () => {}))
        .child(tool("attach", "paperclip", () => run("terminal.paste_image")))
        .child(tool("plus2", "plus", () => run("tab.new")))
        .child(h_flex().id("send").size(32).justify_center().items_center().rounded(4).hover((s) => s.bg("#f0f0f0"))
          .on_click(() => this.send()).child(icon("send", 18, BRAND))));
  }
}
