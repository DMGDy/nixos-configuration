// Shared parts for the imsg-* mods (iMessage on iOS). Mods cannot import across
// folders, so each imsg-* mod has a copy as kit.js: edit here, then copy.
import { View, div, svg, image } from "gpui-kit";
import { panes, spaces, terminals } from "herdr";

export const C = {
  blue: "#007aff", green: "#34c759", red: "#ff3b30", gray: "#e9e9eb", label: "#000000",
  secondary: "#8e8e93", tertiary: "#c7c7cc", sep: "#d1d1d6", bar: "#f9f9f9", fill: "#eeeef0", white: "#ffffff",
};

export const icon = (n, s, c) => svg(`mods/imsg-kit/icons/${n}.svg`).size(s).flex_none().text_color(c);

export function initials(name) {
  const w = (name ?? "?").replace(/[^\p{L}\p{N} _.-]/gu, "").split(/[\s_.-]+/).filter(Boolean);
  return ((w[0]?.[0] ?? "?") + (w[1]?.[0] ?? "")).toUpperCase();
}

// Contact photo: the program's icon on its tile, else iOS's gray initials circle.
export function avatar(name, size, program) {
  const base = div().size(size).flex_none().rounded_full().flex().items_center().justify_center();
  if (program?.icon) {
    const g = Math.round(size * 0.56);
    return base.bg(program.tile ?? "#d1d1d6")
      .child(program.tint ? svg(program.icon).size(g).text_color(program.color ?? "#3a3a3c") : image(program.icon).w(g).h(g));
  }
  return base.bg("#a2a7b1").text_color(C.white).text_size(size * 0.4).font_semibold().child(initials(name));
}

// The typing bubble: three gray dots that pulse.
export function typing(scale = 1) {
  const dot = (p) => div().size(8 * scale).rounded_full().bg("#8e8e93").loop("opacity", { from: 0.25, to: 1, period: p });
  return div().flex().items_center().gap(4 * scale).px(12 * scale).h(34 * scale).rounded(17 * scale).bg(C.gray)
    .child(dot(900)).child(dot(1100)).child(dot(1300));
}

export function chat(tab, space) {
  const ps = panes().filter((p) => p.tab === tab.id);
  const lead = ps.find((p) => p.program?.agent) ?? ps[0];
  const name = /^\d+$/.test(tab.name) || /^tb\d+$/.test(tab.name) ? lead?.program?.name ?? "Terminal" : tab.name;
  return { id: tab.id, tab, space, name, lead, panes: ps, program: lead?.program, status: tab.status, title: lead?.title ?? "" };
}

const ENDED = new Set(["finished", "exited", "ended", "dead", "lost"]);
export function subAgents(parents) {
  const all = terminals().filter((t) => t.parent && !ENDED.has(t.state));
  const out = [];
  const walk = (a) => { for (const t of all.filter((x) => x.parent === a)) { out.push(t); walk(t.address); } };
  for (const a of parents) walk(a);
  return out;
}

export function clock(ms) {
  if (!ms) return "";
  const d = new Date(ms), now = new Date();
  if (d.toDateString() !== now.toDateString()) return "Yesterday";
  const h = d.getHours() % 12 || 12, m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m} ${d.getHours() < 12 ? "AM" : "PM"}`;
}

export default class Kit extends View {
  render() { return div(); }
}
