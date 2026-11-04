// The message box: "Message #channel" with + on the left and Discord's gift,
// sticker and emoji buttons on the right. It wraps and grows up to six lines
// (the bar resizes itself). Enter sends to the channel's agent (hc send) and
// keeps the text in shared "imsg.sent" for the chat; Shift+Enter or a pasted
// line break keeps the newline.
import { View, div } from "gpui-kit";
import { h_flex, TextareaState, Textarea } from "gpui-base";
import { focused, hc, notify, run, shared, setShared, openOverlay, spaces, panes } from "herdr";
import { C, icon, channel } from "./kit.js";

export default class Compose extends View {
  init(_props, cx) {
    this.text = "";
    this.shift = false;
    this.h = null;
    this.input = TextareaState.new({ placeholder: "", value: "" });
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
    const want = Math.max(68, Math.min(210, Math.ceil(height) + 24));
    if (this.h !== null && Math.abs(want - this.h) < 2) return;
    this.h = want;
    run("layout.resize", { id: "compose", px: want });
  }

  render() {
    const tab = spaces().find((s) => s.active)?.tabs.find((t) => t.active);
    const name = tab ? channel(tab).name : "general";
    const tool = (id, ic) => div().id(id).size(32).flex_none().flex().items_center().justify_center().child(icon(ic, 22, C.muted));
    return h_flex().id("root").size_full().bg(C.chat).px(16).pb(22).items_end()
      .on_key_down((e) => { this.shift = Boolean(e.modifiers?.shift); })
      .on_key_up(() => { this.shift = false; })
      .child(h_flex().id("field").flex_1().min_w(0).min_h(44).pl(6).pr(8).py(4).gap(4).items_start().rounded(8).bg(C.input)
        .on_size_change((size) => this.fit(size.height))
        .child(div().id("plus").mt(2).size(32).flex_none().flex().items_center().justify_center().cursor_pointer()
          .on_click(() => openOverlay({ mod: "new-menu", kind: "popup", width: 250, height: 512 }))
          .child(div().size(22).rounded_full().bg(C.muted).flex().items_center().justify_center().child(icon("plus", 15, C.input))))
        .child(div().flex_1().min_w(0).py(7).relative()
          .child(Textarea.new(this.input).w_full().text_size(16).text_color(C.text))
          .when(!this.text, (el) => el.child(div().id("ph").absolute().top(7).left(0).text_size(16).text_color(C.dim).on_click(() => this.input.focus()).child(`Message #${name}`))))
        .child(h_flex().mt(2).gap(2).child(tool("gift", "gift")).child(tool("sticker", "sticker")).child(tool("emoji", "smile"))));
  }
}
