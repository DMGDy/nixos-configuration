// The compose bar: + on the left, the "iMessage" field, and the blue send arrow
// once there's text. The field wraps long messages and grows up to six lines
// (the bar resizes itself to fit). Enter sends to the conversation's agent
// (hc send) and keeps the text in shared "imsg.sent"; Shift+Enter or a pasted
// line break keeps the newline.
import { View, div } from "gpui-kit";
import { h_flex, TextareaState, Textarea } from "gpui-base";
import { focused, hc, notify, run, shared, setShared, openOverlay, spaces, panes } from "herdr";
import { C, icon } from "./kit.js";

export default class Compose extends View {
  init(_props, cx) {
    this.text = "";
    this.shift = false;
    this.h = null;
    this.input = TextareaState.new({ placeholder: "iMessage", value: "" });
    this.input.set_soft_wrap(true);
    this.input.set_auto_grow(1, 6);
    this.input.on("change", (_e, cx) => {
      const v = this.input.value(), prev = this.text;
      // One newline typed at the end, without Shift: that's Enter, so send.
      if (!this.shift && v.length === prev.length + 1 && v.endsWith("\n") && v.slice(0, -1) === prev) {
        this.text = prev;
        this.send();
      } else this.text = v;
      cx.notify();
    });
    this.input.on("submit", () => this.send());
  }

  target() {
    const tab = spaces().find((s) => s.active)?.tabs.find((t) => t.active);
    const ps = panes().filter((p) => p.tab === tab?.id && p.terminal);
    const f = focused()?.terminal;
    return ps.find((p) => p.terminal === f)?.terminal ?? ps.find((p) => p.program?.agent)?.terminal ?? ps[0]?.terminal ?? f;
  }

  send() {
    const text = this.text.trim(), term = this.target();
    if (!text) { this.input.set_value(""); this.text = ""; return; }
    if (!term) { notify({ title: "Not Delivered", body: "Open a conversation first.", level: "warning" }); return; }
    this.input.set_value("");
    this.text = "";
    const sent = { ...(shared("imsg.sent") ?? {}) };
    sent[term] = [...(sent[term] ?? []), { text, at: Date.now() }].slice(-30);
    setShared("imsg.sent", sent);
    hc(["send", term, text]);
  }

  fit(height) {
    const want = Math.max(58, Math.min(200, Math.ceil(height) + 20));
    if (this.h !== null && Math.abs(want - this.h) < 2) return;
    this.h = want;
    run("layout.resize", { id: "compose", px: want });
  }

  render() {
    const has = this.text.trim().length > 0;
    return h_flex().id("root").size_full().bg(C.white).px(14).gap(10).items_end().pb(11)
      .on_key_down((e) => { this.shift = Boolean(e.modifiers?.shift); })
      .on_key_up(() => { this.shift = false; })
      .child(div().id("plus").size(34).flex_none().rounded_full().bg(C.fill).flex().items_center().justify_center().cursor_pointer()
        .on_click(() => openOverlay({ mod: "new-menu", kind: "popup", width: 250, height: 512 })).child(icon("plus", 20, C.secondary)))
      .child(h_flex().id("field").flex_1().min_w(0).min_h(36).pl(14).pr(3).py(3).items_end().rounded(18).border(1).border_color(C.tertiary)
        .on_size_change((size) => this.fit(size.height))
        .child(div().flex_1().min_w(0).py(3).child(Textarea.new(this.input).w_full().text_size(16).text_color(C.label)))
        .child(has
          ? div().id("send").size(30).flex_none().rounded_full().bg(C.blue).flex().items_center().justify_center().cursor_pointer()
              .on_click(() => this.send()).child(icon("up", 18, C.white))
          : div().size(30).flex_none().flex().items_center().justify_center().child(icon("mic", 18, C.secondary))));
  }
}
