// Under the terminal bubble: the typing bubble while the agent works, then
// what you sent from the compose box as blue bubbles, marked Delivered. The
// block resizes itself to fit them, so the terminal bubble never covers one.
import { View, div, svg } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { shared, spaces, panes, run, layout } from "herdr";

function find(n, id) { if (n?.id === id) return n; for (const c of n?.children ?? []) { const f = find(c, id); if (f) return f; } return null; }
const norm = (x) => x.replace(/\s+/g, " ").trim();
import { C, typing, clock } from "./kit.js";

const MIN = 12, MAX = 320;

export default class Thread extends View {
  init(_props, cx) {
    this.h = null;
    cx.timer.every(15000, (cx) => cx.notify());
  }

  fit(height) {
    const want = Math.max(MIN, Math.min(MAX, Math.ceil(height) + 8));
    if (this.h !== null && Math.abs(want - this.h) < 2) return;
    this.h = want;
    run("layout.resize", { id: "thread", px: want });
  }

  render() {
    const space = spaces().find((s) => s.active), tab = space?.tabs.find((t) => t.active);
    const terms = panes().filter((p) => p.tab === tab?.id).map((p) => p.terminal).filter(Boolean);
    const sent = shared("imsg.sent") ?? {};
    // In the output view your messages are already in the conversation; only
    // ones the agent hasn't shown yet wait here.
    const output = (find(layout(), "convo-stack")?.active ?? "output") === "output";
    // A message waits here at most 3 minutes: by then it's in the conversation, or
    // it scrolled out of the agent's history and won't appear there anyway.
    const inline = shared("imsg.inline") ?? {};
    const PENDING_MS = 3 * 60 * 1000;
    const all = terms.flatMap((t) => (sent[t] ?? []).map((m) => ({ ...m, term: t }))).sort((a, b) => a.at - b.at);
    const shownIn = (m) => (inline[m.term] ?? []).map(norm)
      .some((x) => x.startsWith(norm(m.text).slice(0, 40)) || norm(m.text).startsWith(x.slice(0, 40)));
    const mine = (output ? all.filter((m) => Date.now() - m.at < PENDING_MS && !shownIn(m)) : all).slice(-2);
    const last = mine[mine.length - 1];
    const content = v_flex().id("content").flex_none().w_full().gap(4)
      .on_size_change((size) => this.fit(size.height))
      .when(!output && tab?.status === "working", (el) => el.child(h_flex().child(typing())))
      .children(mine.map((m) => h_flex().justify_end()
        .child(div().relative().max_w(560).px(14).py(7).rounded_tl(18).rounded_tr(18).rounded_bl(18).rounded_br(6)
          .bg(C.blue).text_size(16).text_color(C.white).child(m.text)
          .child(svg("mods/imsg-kit/icons/tail-right.svg").w(14).h(20).absolute().bottom(0).right(-6).text_color(C.blue)))))
      .when(Boolean(last), (el) => el.child(h_flex().justify_end().text_size(11).text_color(C.secondary)
        .child(`Delivered ${clock(last.at)}`)));
    return v_flex().id("root").size_full().bg(C.white).pl(18).pr(24).pb(4).justify_end().child(content);
  }
}
