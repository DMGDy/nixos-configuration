// Solution Explorer: the solution is herdr, each space a project, each tab a
// file, and sub-agents nested under the tab whose agent started them.
import { View, div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { run, spaces } from "herdr";
import { C, icon, prog, spinner, doc, subAgents } from "./kit.js";

export default class Solution extends View {
  init() { this.open = {}; this.selected = null; }

  row(id, depth, chevron, iconEl, label, extra, on, action, toggle) {
    return h_flex().id(id).h(22).pl(6 + depth * 16).pr(8).gap(5).items_center().text_size(12.5)
      .bg(on ? C.select : C.tool).text_color(C.text).hover((s) => s.bg(on ? C.select : C.hover))
      .on_click(action)
      .child(h_flex().id(`${id}-chev`).w(12).justify_center().text_size(9).text_color(C.muted)
        .on_click((e, cx) => { if (toggle) { cx.stop_propagation(); toggle(cx); } })
        .child(chevron === null ? "" : chevron ? "▼" : "▶"))
      .child(iconEl)
      .child(div().flex_1().min_w(0).truncate().child(label))
      .when(Boolean(extra), (el) => el.child(extra));
  }

  render() {
    const all = spaces();
    const rows = [this.row("sol", 0, true, icon("solution", 15, "#c586c0"),
      `Solution 'herdr' (${all.length} of ${all.length} projects)`, null, false, () => {}, null)];
    for (const s of all) {
      const open = this.open[s.id] ?? true;
      const name = s.name === "~" ? "Home" : s.name;
      rows.push(this.row(`proj-${s.id}`, 1, open, icon("project", 15, "#4ec9b0"), name,
        s.branch ? div().text_size(11).text_color(C.dim).child(s.branch) : null, false,
        () => run("space.select", { id: s.id }), (cx) => { this.open[s.id] = !open; cx.notify(); }));
      if (!open) continue;
      for (const t of s.tabs) {
        const d = doc(t), subs = subAgents(d.panes.map((p) => p.terminal).filter(Boolean));
        const topen = this.open[t.id] ?? true;
        const mark = t.status === "working" ? spinner(11, C.blueHover) : t.status === "blocked" ? icon("error", 11, C.error)
          : t.status === "done" ? icon("warning", 11, C.warn) : null;
        rows.push(this.row(`file-${t.id}`, 2, subs.length ? topen : null, prog(d.lead?.program, 14, C.muted), d.name, mark,
          s.active && t.active, () => { run("space.select", { id: s.id }); run("tab.select", { id: t.id }); },
          subs.length ? (cx) => { this.open[t.id] = !topen; cx.notify(); } : null));
        if (subs.length && topen) for (const { t: a, depth } of subs) {
          const st = a.status === "working" ? spinner(11, C.blueHover) : a.status === "blocked" ? icon("error", 11, C.error) : null;
          rows.push(this.row(`sub-${a.address}`, 2 + depth, null, prog(a.program, 14, C.muted),
            a.name ?? a.address, h_flex().gap(6).items_center().child(st ?? div()).child(div().text_size(11).text_color(C.dim).child(a.address)),
            this.selected === a.address, () => { this.selected = a.address; run("agent.focus", { terminal: a.address }); }, null));
        }
      }
    }
    const tbtn = (id, ic, action) => h_flex().id(id).size(22).justify_center().items_center().rounded(2).hover((s) => s.bg(C.hover)).on_click(action).child(icon(ic, 14, C.text));
    return v_flex().id("root").size_full().bg(C.tool)
      .child(h_flex().h(26).px(8).items_center().bg(C.env).text_size(12).text_color(C.text)
        .child(div().flex_1().child("Solution Explorer")).child(icon("chev", 11, C.muted)).child(div().w(6)).child(icon("close", 10, C.muted)))
      .child(h_flex().h(26).px(4).gap(2).items_center().bg(C.env).border_b(1).border_color(C.border)
        .child(tbtn("se-back", "back", () => run("tab.prev"))).child(tbtn("se-fwd", "fwd", () => run("tab.next")))
        .child(tbtn("se-home", "home", () => run("space.select", { id: all[0]?.id })))
        .child(tbtn("se-refresh", "refresh", (_e, cx) => cx.notify()))
        .child(tbtn("se-collapse", "collapse", (_e, cx) => { for (const s of all) this.open[s.id] = false; cx.notify(); })))
      .child(h_flex().id("se-search").h(24).mx(4).my(4).px(6).gap(6).items_center().bg(C.field).border(1).border_color(C.border)
        .text_size(12).text_color(C.dim).on_click(() => run("app.palette"))
        .child(div().flex_1().child("Search Solution Explorer (Ctrl+;)")).child(icon("search", 12, C.muted)))
      .child(v_flex().id("se-tree").flex_1().min_h(0).overflow_y_scrollbar().children(rows));
  }
}
