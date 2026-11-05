// The bar over a stream (an agent's live terminal), like Discord's Go Live
// viewer: who's streaming, a red LIVE tag, why it started (when the chat
// switched to it), 1 watching (you), and Pop Out / Stop Watching. A shell
// channel's terminal gets a plain SHELL bar instead. With props.popout it's the
// title bar of a popped-out stream window: drag it, Pop In, or close.
import { View, div } from "gpui-kit";
import { h_flex } from "gpui-base";
import { props, spaces, shared, closeOverlay } from "herdr";
import { C, icon, picture, channel, herd, typing, smooth, livePill, streaming, watch, stopWatching, popOut, keepAsChannel, borrowed, ROLES } from "./kit.js";

export default class Stream extends View {
  // What's on screen: the popped-out terminal, else the shown tab's agent (or shell).
  target() {
    const pr = props() ?? {};
    const tab = spaces().find((s) => s.active)?.tabs.find((t) => t.active);
    const c = tab ? channel(tab) : null;
    // A sub-agent watched in its parent's borrowed pane, else the tab's agent (or shell).
    const address = pr.terminal ?? borrowed()
      ?? (c?.panes.find((p) => p.program?.agent) ?? c?.lead)?.terminal ?? null;
    const { top, subs } = herd();
    const m = [...top, ...subs].find((x) => x.address === address);
    const pane = c?.panes.find((p) => p.terminal === address);
    return { address, m, shell: !m, label: m?.name ?? pane?.program?.name ?? c?.name ?? "terminal", title: pane?.title ?? m?.title ?? "" };
  }

  render() {
    const pr = props() ?? {};
    const { address, m, shell, label, title } = this.target();
    const why = (shared("discord.stream") ?? {}).address === address ? shared("discord.stream")?.why : null;
    const live = m && streaming(m);
    const btn = (id, ic, text, action, color = C.text, bg = "#ffffff0f") => smooth(this,
      h_flex().id(id).flex_none().h(28).px(10).gap(6).items_center().rounded(4).bg(bg).cursor_pointer(), id, "#ffffff1a")
      .on_mouse_down("left", (_e, cx) => cx.stop_propagation())
      .on_click(action)
      .child(icon(ic, 15, color)).child(div().text_size(13).font_medium().text_color(color).child(text));

    return h_flex().id("root").size_full().px(12).gap(10).items_center().bg(pr.popout ? C.rail : C.chat)
      .when(!pr.popout, (el) => el.border_b(1).border_color(C.border))
      .child(shell
        ? div().size(26).flex_none().rounded_full().bg(C.selected).flex().items_center().justify_center().child(icon("terminal", 15, C.muted))
        : m ? picture(m.pic, 26, typing(m) ? "working" : m.status, pr.popout ? C.rail : C.chat)
        : div().size(26).flex_none().rounded_full().bg(C.selected))
      .child(div().flex_none().text_size(15).font_semibold().text_color(shell || !m ? C.header : ROLES[m.role]?.color ?? C.header)
        .child(shell ? label : `${label}'s screen`))
      .child(live ? livePill(11)
        : div().flex_none().px(4).h(17).rounded(4).bg(C.selected).flex().items_center().text_size(11).font_bold().text_color(C.muted).child(shell ? "SHELL" : "PAUSED"))
      .child(div().flex_1().min_w(0).truncate().text_size(13).text_color(C.muted)
        .child(why ? `started streaming: ${why}` : live && typing(m) ? "typing away…" : title))
      .when(!shell, (el) => el.child(h_flex().flex_none().gap(4).items_center().text_size(12).text_color(C.dim)
        .child(icon("eye", 14, C.dim)).child("1 watching")))
      .when(Boolean(pr.popout), (el) => el
        .child(btn("pop-in", "screen", "Pop In", () => { closeOverlay(pr.overlay); watch(address); }))
        .child(smooth(this, div().id("close").size(28).flex_none().rounded(4).flex().items_center().justify_center().cursor_pointer(), "close", C.red)
          .on_mouse_down("left", (_e, cx) => cx.stop_propagation())
          .on_click(() => closeOverlay(pr.overlay)).child(icon("x", 14, C.text))))
      .when(!pr.popout && Boolean(address), (el) => el
        // A sub-agent lives in no channel: offer it one.
        .when(Boolean(!pr.popout && m?.parent), (x) => x.child(btn("keep", "hash", "Keep as channel", () => keepAsChannel(address))))
        .child(btn("pop-out", "popout", "Pop Out", () => { popOut(address, label); stopWatching(); }))
        .child(btn("stop", "x", shell ? "Back to chat" : "Stop Watching", () => stopWatching(), "#ffffff", C.red)));
  }
}
