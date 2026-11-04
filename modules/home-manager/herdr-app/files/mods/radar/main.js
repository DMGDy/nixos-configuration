// Agent Radar: a floating drawer of every agent in every space. Peeking, it is
// a strip of status dots on the edge; hovered, it slides out with names, and
// a click shows that agent. Working dots breathe, blocked ones pulse fast.

import { View, div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { agents, placement, run, spaces, theme } from "herdr";

function since(ms) {
  const s = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  return s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${Math.floor(s / 3600)}h ${Math.floor(s / 60) % 60}m`;
}

const WORDS = { working: "working", blocked: "needs you", done: "finished", idle: "idle" };
const ORDER = { blocked: 0, done: 1, working: 2, idle: 3 };

export default class Radar extends View {
  init(_props, cx) {
    // Ticks the working timers; idle radars skip the redraw.
    cx.timer.every(1000, (cx) => { if (agents().some((a) => a.status === "working")) cx.notify(); });
  }

  dot(t, a) {
    const d = div().w(10).h(10).rounded(5).flex_none().bg(t[a.status] ?? t.unknown);
    if (a.status === "working") return d.loop("opacity", { from: 0.35, to: 1, period: 1400 });
    if (a.status === "blocked") return d.loop("opacity", { from: 0.2, to: 1, period: 500 });
    return d;
  }

  timer(a) {
    if (a.status !== "working") return "";
    const tab = spaces().flatMap((p) => p.tabs).find((x) => x.id === a.tab);
    return tab?.working_since ? ` ${since(tab.working_since)}` : "";
  }

  row(t, a, right) {
    const label = v_flex()
      .flex_1()
      .min_w(0)
      .child(div().truncate().text_size(13).text_color(a.focused ? t.foreground : t.muted)
        .child(a.program?.name ?? a.app ?? a.address))
      .child(div().truncate().text_size(11).text_color(t.dim)
        .child(`${a.space_name} · ${a.tab_name || "tab " + a.tab_index} · ${WORDS[a.status] ?? a.status}${this.timer(a)}`));
    const dot = h_flex().w(24).justify_center().child(this.dot(t, a));
    return h_flex()
      .id(`radar-${a.address}`)
      .w_full()
      .gap(6)
      .py(6)
      .px(4)
      .items_center()
      .rounded(6)
      .cursor_pointer()
      .when(a.focused, (s) => s.bg(t.selected))
      .hover((s) => s.bg(t.hover))
      .on_click(() => run("agent.focus", { terminal: a.address }))
      .children(right ? [label, dot] : [dot, label]);
  }

  render() {
    const t = theme();
    const right = placement() ? placement().edge === "right" : true;
    const list = [...agents()].sort((x, y) => (ORDER[x.status] ?? 9) - (ORDER[y.status] ?? 9) || y.seq - x.seq);
    const busy = list.filter((a) => a.status === "working").length;
    const need = list.filter((a) => a.status === "blocked").length;
    const head = h_flex()
      .w_full()
      .px(4)
      .pb(4)
      .items_center()
      .gap(6)
      .text_size(11)
      .text_color(t.dim)
      .child(div().flex_1().child(`RADAR · ${busy} working${need ? ` · ${need} need you` : ""}`))
      .child(h_flex().w(24).justify_center().child(div().text_color(t.accent).child("◉")));
    return v_flex()
      .id("root")
      .size_full()
      .when(!placement(), (s) => s.bg(theme().surface).px(8).pt(10))
      .py(4)
      .px(2)
      .overflow_y_scrollbar()
      .child(head)
      .children(list.length ? list.map((a) => this.row(t, a, right))
        : [div().w_full().p(6).text_size(12).text_color(t.dim).child("no agents")]);
  }
}
