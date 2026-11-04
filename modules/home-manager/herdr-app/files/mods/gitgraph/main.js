// Git Graph: the commit graph of the repo the focused terminal is in, with its
// branch and how dirty the tree is. Follows focus; refreshes every 5 seconds.

import { View, div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { exec, focused, home, settings, theme } from "herdr";

// Shown when the focused terminal is not in a repo.
const FALLBACK = "nixos";

const LANES = ["ansi1", "ansi2", "ansi3", "ansi4", "ansi5", "ansi6"];

export default class GitGraph extends View {
  init(_props, cx) {
    this.cwd = null;
    this.lines = [];
    this.head = null;
    this.dirty = 0;
    cx.timer.every(5000, (cx) => this.refresh(cx, true));
    this.refresh(cx, true);
  }

  refresh(cx, force) {
    const cwd = focused()?.cwd ?? null;
    if (!force && cwd === this.cwd) return;
    this.cwd = cwd;
    cx.spawn(async (cx) => {
      const toplevel = async (dir) => {
        const r = await exec("git", ["-C", dir, "rev-parse", "--show-toplevel"]).catch(() => null);
        return r && r.code === 0 ? r.stdout.trim() : null;
      };
      let repo = cwd ? await toplevel(cwd) : null;
      this.fallback = !repo;
      repo ??= await toplevel(`${home()}/${FALLBACK}`);
      if (!repo) { this.repo = null; this.lines = []; cx.notify(); return; }
      this.repo = repo;
      const [log, st] = await Promise.all([
        exec("git", ["-C", this.repo, "log", "--graph", "--all", "--color=never", "-n", "80",
          "--format=%x1f%h%x1f%d%x1f%s%x1f%cr"]),
        exec("git", ["-C", this.repo, "status", "--porcelain=v1", "-b"]),
      ]);
      this.lines = log.stdout.split("\n").filter(Boolean).map((l) => {
        const [graph, hash, refs, subject, when] = l.split("\x1f");
        return { graph: graph ?? l, hash, refs: refs?.trim().replace(/^\(|\)$/g, ""), subject, when };
      });
      const st_lines = st.stdout.split("\n").filter(Boolean);
      this.head = st_lines[0]?.replace(/^## /, "") ?? null;
      this.dirty = st_lines.length - 1;
      cx.notify();
    });
  }

  render(cx) {
    this.refresh(cx, false);
    const t = theme();
    const mono = settings().font_family ?? "Cascadia Mono NF";
    const name = this.repo ? this.repo.split("/").pop() : null;
    const header = v_flex().px(12).pt(10).pb(8).gap(2).border_b(1).border_color(t.border)
      .child(h_flex().gap(6).items_center().text_size(11).text_color(t.dim)
        .child(this.fallback ? "GIT GRAPH · fallback" : "GIT GRAPH").child(div().flex_1())
        .when(this.dirty > 0, (e) => e.child(div().px(6).rounded(4).bg(t.raised).text_color(t.blocked).child(`${this.dirty} changed`))))
      .child(div().truncate().text_size(14).font_semibold().text_color(t.foreground).child(name ?? "not a git repo"))
      .when(Boolean(this.head), (e) => e.child(div().truncate().text_size(11.5).text_color(t.muted).child(this.head)));
    const row = (l, i) => {
      const graph = h_flex().flex_none().font_family(mono).text_size(12);
      [...l.graph].forEach((ch, j) => graph.child(div().text_color(ch === "*" ? t.accent : t[LANES[Math.floor(j / 2) % LANES.length]])
        .child(ch === "*" ? "●" : ch === " " ? " " : ch)));
      return h_flex().id(`g-${i}`).px(12).h(20).gap(6).items_center().min_w(0).hover((s) => s.bg(t.hover))
        .child(graph)
        .when(Boolean(l.hash), (e) => e
          .child(div().flex_none().font_family(mono).text_size(11.5).text_color(t.dim).child(l.hash))
          .when(Boolean(l.refs), (e) => e.child(div().flex_none().max_w(120).truncate().px(5).rounded(4).text_size(10.5)
            .bg(t.selected).text_color(t.foreground).child(l.refs)))
          .child(div().flex_1().min_w(0).truncate().text_size(12).text_color(t.foreground).child(l.subject ?? ""))
          .child(div().flex_none().text_size(10.5).text_color(t.dim).child((l.when ?? "").replace(" ago", ""))));
    };
    return v_flex().id("root").size_full().bg(t.surface).child(header)
      .child(v_flex().id("graph").flex_1().min_h(0).py(4).overflow_y_scrollbar().children(this.lines.map(row)));
  }
}
