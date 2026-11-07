// The thread panel's header: the agent's live terminal opened beside the chat
// (in the member list's place), like a Discord thread. Shows whose terminal,
// LIVE while it works, and Watch fullscreen / Pop Out / close.
import { View, div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { focused, agents, spaces, panes } from "herdr";
import { C, icon, picture, herd, typing, smooth, livePill, streaming, watch, popOut, closeThread, setSplit, channelShell, openShell, ROLES } from "./kit.js";

export default class Thread extends View {
  render() {
    // The block below shows the channel's terminals (its tab): its agent, and
    // its shell when it has one.
    const tab = spaces().find((s) => s.active)?.tabs.find((x) => x.active)?.id;
    const lead = panes().find((p) => p.tab === tab && p.program?.agent);
    const address = lead?.terminal ?? focused()?.agent ?? agents().find((a) => a.focused)?.address;
    const shell = channelShell(tab);
    const { top, subs } = herd();
    const m = [...top, ...subs].find((x) => x.address === address);
    const tool = (id, ic, action, hover = "#ffffff1a") => smooth(this,
      div().id(id).size(28).flex_none().rounded(4).flex().items_center().justify_center().cursor_pointer(), id, hover)
      .on_click(action).child(icon(ic, 16, C.muted));
    return h_flex().id("root").size_full().px(12).gap(8).items_center().bg(C.chat).border_b(1).border_color(C.border)
      .border_l(1)
      .child(icon("thread", 18, C.dim))
      .child(v_flex().flex_1().min_w(0)
        .child(h_flex().gap(6).items_center()
          .child(div().truncate().text_size(15).font_semibold().text_color(C.header).child(m ? `${m.name}'s terminal${shell ? " + your shell" : ""}` : "Terminal"))
          .when(Boolean(m && streaming(m)), (el) => el.child(livePill(10))))
        .when(Boolean(m), (el) => el.child(h_flex().gap(4).items_center()
          .child(picture(m.pic, 14))
          .child(div().truncate().text_size(12).text_color(ROLES[m.role]?.color ?? C.muted).child(typing(m) ? "typing…" : m.title ?? "")))))
      .child(tool("t-shell", "terminal", () => openShell(tab)))
      .when(Boolean(address), (el) => el
        .child(tool("t-watch", "screen", () => watch(address)))
        .child(tool("t-pop", "popout", () => { popOut(address, m?.name ?? "Terminal"); setSplit(false); })))
      .child(tool("t-close", "x", () => setSplit(false), "#f23f4366"));
  }
}
