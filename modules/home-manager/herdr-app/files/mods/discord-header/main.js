// The channel header: # name, the agent's terminal title as the topic, and the
// toolbar: Live terminal toggle, notifications, pins, member list, search.
import { View, div } from "gpui-kit";
import { h_flex } from "gpui-base";
import { run, spaces, layout } from "herdr";
import { C, icon, channel, herd, typing, smooth, livePill, streaming, watch, watching, stopWatching, openThread, closeThread, isShell, chatSub, closeSub, merged, setMerged, descendants } from "./kit.js";

function find(n, id) { if (n?.id === id) return n; for (const c of n?.children ?? []) { const f = find(c, id); if (f) return f; } return null; }

export default class Header extends View {
  // In the forum: its icon, name and a topic counting the runs.
  forum() {
    const { top, subs } = herd(), all = [...top, ...subs];
    const busy = all.filter((m) => typing(m)).length, need = all.filter((m) => m.status === "blocked").length;
    const topic = [`${top.length} run${top.length === 1 ? "" : "s"}`, `${subs.length} in threads`, busy && `${busy} typing`, need && `${need} need${need === 1 ? "s" : ""} you`].filter(Boolean).join(" · ");
    return h_flex().id("root").size_full().bg(C.chat).px(16).gap(8).items_center().border_b(1).border_color(C.border)
      .child(icon("forum", 22, C.dim))
      .child(div().text_size(16).font_semibold().text_color(C.header).child("agents"))
      .child(div().w(1).h(24).mx(4).bg(C.selected))
      .child(div().flex_1().min_w(0).truncate().text_size(14).text_color(C.muted).child(topic))
      .child(smooth(this, div().id("back").h(26).px(8).flex().items_center().rounded(4).cursor_pointer(), "back", C.hover)
        .on_click(() => run("layout.select", { stack: "convo-stack", child: "output" }))
        .child(div().text_size(13).text_color(C.muted).child("Back to channel")));
  }

  render() {
    const s = spaces().find((x) => x.active), t = s?.tabs.find((x) => x.active);
    const c = t ? channel(t) : null;
    const active = find(layout(), "convo-stack")?.active ?? "output";
    const live = watching(active);
    if (active === "forum") return this.forum();
    const membersOn = !(find(layout(), "members")?.hidden ?? false);
    const threadOn = !(find(layout(), "thread")?.hidden ?? true);
    const shell = t ? isShell(t) : false;
    const { top, subs } = herd(t?.id);
    const agent = top[0] ?? subs[0] ?? null;
    const sub = active === "output" && chatSub() ? subs.find((m) => m.address === chatSub()) : null;
    const kids = agent ? descendants(agent.address, subs) : [];
    const mergeOn = Boolean(t && merged(t.id));
    const tool = (id, ic, on, action) => smooth(this, div().id(id).size(28).flex().items_center().justify_center().rounded(4).cursor_pointer(), id, C.hover)
      .on_click(action).child(icon(ic, 22, on ? C.header : C.muted));
    return h_flex().id("root").size_full().bg(C.chat).px(16).gap(8).items_center().border_b(1).border_color(C.border)
      .child(icon("hash", 22, C.dim))
      .child(smooth(this, div().id("ch-name").px(4).rounded(4).cursor_pointer(), "ch-name", sub ? C.hover : "#00000000")
        .on_click(() => closeSub()).child(div().text_size(16).font_semibold().text_color(sub ? C.muted : C.header).child(c?.name ?? "")))
      // A sub-agent's chat: # channel › thread name, with the way back.
      .when(Boolean(sub), (el) => el.child(icon("chev", 14, C.dim))
        .child(icon("thread", 18, C.dim))
        .child(div().text_size(16).font_semibold().text_color(C.header).child(sub.name))
        .child(div().px(5).h(18).rounded(4).bg("#ffffff0f").flex().items_center().text_size(11).text_color(C.muted)
          .child(sub.agent ? "SUB-AGENT" : "PROGRAM")))
      .when(Boolean(c?.lead?.title) && !sub, (el) => el.child(div().w(1).h(24).mx(4).bg(C.selected))
        .child(div().flex_1().min_w(0).truncate().text_size(14).text_color(C.muted).child(c.lead.title)))
      .when(!c?.lead?.title || Boolean(sub), (el) => el.child(div().flex_1()))
      .when(Boolean(sub), (el) => el.child(smooth(this, h_flex().id("sub-back").h(26).px(8).gap(6).items_center().rounded(4).cursor_pointer(), "sub-back", C.hover)
        .on_click(() => closeSub()).child(div().text_size(13).text_color(C.muted).child(`Back to #${c?.name ?? ""}`))))
      // Merge threads: this agent and what it started, as one conversation.
      .when(!live && !sub && kids.length > 0, (el) => el.child(smooth(this, h_flex().id("merge").h(26).px(8).gap(6).items_center().rounded(4).cursor_pointer()
          .bg(mergeOn ? C.blurple : C.chat), "merge", mergeOn ? "#4752c4" : C.hover)
        .on_click(() => setMerged(t.id, !mergeOn))
        .child(icon("merge", 16, mergeOn ? "#ffffff" : C.muted))
        .child(div().text_size(13).font_medium().text_color(mergeOn ? "#ffffff" : C.muted).child(mergeOn ? `Merged · ${kids.length + 1}` : "Merge threads"))))
      // Go Live: watch the channel's agent's stream (its terminal), or stop.
      .child(smooth(this, h_flex().id("live").h(26).px(8).gap(6).items_center().rounded(4).cursor_pointer()
        .bg(live ? C.blurple : C.chat), "live", live ? "#4752c4" : C.hover)
        .on_click(() => live ? stopWatching() : watch(agent?.address ?? c?.lead?.terminal))
        .child(icon("screen", 16, live ? "#ffffff" : C.muted))
        .child(div().text_size(13).font_medium().text_color(live ? "#ffffff" : C.muted)
          .child(live ? "Watching" : shell ? "Open terminal" : "Watch Stream"))
        .when(!live && Boolean(agent && streaming(agent)), (el) => el.child(livePill(9))))
      // A thread: the agent's terminal beside the chat.
      .when(!live && Boolean(agent), (el) => el.child(tool("thread-t", "thread", threadOn,
        () => threadOn ? closeThread() : openThread(agent.address))))
      .child(tool("bell", "bell", false, () => {}))
      .child(tool("pins", "pin", false, () => {}))
      .child(tool("members-t", "members", membersOn, () => run("layout.toggle", { id: "members" })))
      .child(smooth(this, h_flex().id("search").w(150).h(24).px(6).items_center().rounded(4).bg(C.rail).text_size(13).text_color(C.dim).cursor_pointer(), "search", "#ffffff0d")
        .on_click(() => run("app.palette")).child(div().flex_1().child("Search")).child(icon("search", 14, C.dim)));
  }
}
