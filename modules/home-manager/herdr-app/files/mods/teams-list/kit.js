// Shared parts for the teams-* mods (avatars, presence, names). Mods cannot import
// across folders, so each teams-* mod has a copy as kit.js: edit here, then copy.
import { View, div, svg, image } from "gpui-kit";
import { panes, spaces, terminals } from "herdr";

export const PURPLE = "#464775", RAIL = "#33344a", BRAND = "#5b5fc7";
const AVATAR = ["#ca5010", "#038387", "#8764b8", "#c239b3", "#0078d4", "#498205", "#986f0b", "#4f6bed", "#e3008c", "#00b7c3"];

export const icon = (name, size, color) => svg(`mods/teams-kit/icons/${name}.svg`).size(size).flex_none().text_color(color);

// Presence from agent status, Teams style.
export function presence(status) {
  switch (status) {
    case "working": return { color: "#c4314b", word: "Busy" };
    case "blocked": return { color: "#c4314b", word: "Do not disturb", dnd: true };
    case "done": return { color: "#13a10e", word: "Available" };
    case "idle": return { color: "#f8d22a", word: "Away" };
    default: return { color: "#8a8886", word: "Offline", ring: true };
  }
}

export function initials(name) {
  const w = (name ?? "?").replace(/[^\p{L}\p{N} _.-]/gu, "").split(/[\s_.-]+/).filter(Boolean);
  return ((w[0]?.[0] ?? "?") + (w[1]?.[0] ?? w[0]?.[1] ?? "")).toUpperCase();
}

// The profile picture: the program's icon on its tile when it has one
// (Claude, Pi, Codex, nvim, ...), else colored initials. Plus a presence dot.
export function avatar(name, size, status, ring = "#ffffff", program = null) {
  let h = 0;
  for (const c of name ?? "") h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const base = div().relative().size(size).flex_none().rounded_full().flex().items_center().justify_center();
  let el;
  if (program?.icon) {
    const g = Math.round(size * 0.58);
    el = base.bg(program.tile ?? "#ebebeb")
      .child(program.tint ? svg(program.icon).size(g).text_color(program.color ?? "#424242") : image(program.icon).w(g).h(g));
  } else {
    el = base.bg(AVATAR[h % AVATAR.length]).text_color("#ffffff").text_size(size * 0.38).font_semibold().child(initials(name));
  }
  if (status === undefined) return el;
  const p = presence(status), d = Math.max(10, Math.round(size * 0.32));
  const dot = div().absolute().right(-2).bottom(-2).size(d).rounded_full().border(2).border_color(ring)
    .bg(p.ring ? ring : p.color).when(Boolean(p.ring), (s) => s.border_color(p.color));
  if (p.dnd) dot.flex().items_center().justify_center().child(div().w(d - 8).h(2).bg("#ffffff"));
  return el.child(dot);
}

const ENDED = new Set(["finished", "exited", "ended", "dead", "lost"]);

// Agents another agent started (no pane of their own), each with its depth,
// under the given terminals, depth first.
export function subAgents(parents, depth = 1) {
  const live = terminals().filter((t) => t.parent && !ENDED.has(t.state));
  const out = [];
  const walk = (addr, d) => {
    for (const t of live.filter((x) => x.parent === addr)) { out.push({ t, depth: d }); walk(t.address, d + 1); }
  };
  for (const a of parents) walk(a, depth);
  return out;
}

// Sub-agents whose parent is not in any pane (their parent ended or was parked).
export function orphanAgents() {
  const shown = new Set(panes().map((p) => p.terminal).filter(Boolean));
  const all = terminals();
  const byAddr = new Map(all.map((t) => [t.address, t]));
  const rooted = (t) => { for (let x = t, n = 0; x?.parent && n < 20; x = byAddr.get(x.parent), n++) if (shown.has(x.parent)) return true; return false; };
  return all.filter((t) => t.parent && !ENDED.has(t.state) && !rooted(t));
}

// A tab as a "chat": who's in it and what it says.
export function chat(tab, space) {
  const ps = panes().filter((p) => p.tab === tab.id);
  const lead = ps.find((p) => p.program?.agent) ?? ps[0];
  const fallback = lead?.program?.name ?? "Terminal";
  const name = /^\d+$/.test(tab.name) || /^tb\d+$/.test(tab.name) ? fallback : tab.name;
  const subs = subAgents(ps.map((p) => p.terminal).filter(Boolean));
  return { id: tab.id, space, tab, name, title: lead?.title ?? "", cwd: lead?.cwd, panes: ps, program: lead?.program, status: tab.status, subs };
}

export function allChats() {
  return spaces().flatMap((s) => s.tabs.map((t) => chat(t, s)));
}

export function since(ms) {
  const s = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  return s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s / 60)}m` : `${Math.floor(s / 3600)}h ${Math.floor(s / 60) % 60}m`;
}

export function clock(ms) {
  if (!ms) return "";
  const d = new Date(ms), now = new Date();
  if (d.toDateString() !== now.toDateString()) return `${d.getMonth() + 1}/${d.getDate()}`;
  const h = d.getHours() % 12 || 12, m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m} ${d.getHours() < 12 ? "AM" : "PM"}`;
}

export default class Kit extends View {
  render() { return div(); }
}
