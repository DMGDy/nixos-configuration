// Shared parts for the vs-* mods (Visual Studio 2022 dark look). Mods cannot
// import across folders, so each vs-* mod has a copy as kit.js: edit here, then copy.
import { View, div, svg, image } from "gpui-kit";
import { panes, terminals } from "herdr";

export const C = {
  title: "#1f1f1f", env: "#2d2d30", tool: "#252526", editor: "#1e1e1e", border: "#3f3f46",
  text: "#f1f1f1", muted: "#999999", dim: "#717171", hover: "#3e3e40", field: "#333337",
  blue: "#007acc", blueHover: "#1c97ea", purple: "#68217a", orange: "#ca5100", select: "#094771",
  error: "#f14c4c", warn: "#cca700", info: "#75beff", green: "#89d185", folder: "#dcb67a",
};
export const MONO = "Cascadia Mono NF";

export const icon = (n, s, c) => svg(`mods/vs-kit/icons/${n}.svg`).size(s).flex_none().text_color(c);
export const spinner = (s, c) => svg("mods/workspace-chrome/spinner.svg").size(s).flex_none().text_color(c).spin(900);

// A program's own icon (Claude, Pi, nvim, ...), else a file.
export function prog(program, size, fallback = C.muted) {
  if (program?.icon) return program.tint ? svg(program.icon).size(size).flex_none().text_color(program.color ?? fallback)
    : image(program.icon).w(size).h(size).flex_none();
  return icon("file", size, fallback);
}

export function find(n, id) {
  if (n?.id === id) return n;
  for (const c of n?.children ?? []) { const f = find(c, id); if (f) return f; }
  return null;
}

export function since(ms) {
  const s = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  return s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${Math.floor(s / 3600)}h ${Math.floor(s / 60) % 60}m`;
}

// A tab as a document: its name and lead program.
export function doc(tab) {
  const ps = panes().filter((p) => p.tab === tab.id);
  const lead = ps.find((p) => p.program?.agent) ?? ps[0];
  const name = /^\d+$/.test(tab.name) || /^tb\d+$/.test(tab.name) ? lead?.program?.name ?? "Terminal" : tab.name;
  return { name, lead, panes: ps };
}

const ENDED = new Set(["finished", "exited", "ended", "dead", "lost"]);
export const live = (t) => !ENDED.has(t.state);

// Sub-agents (terminals with a parent, no pane) under the given terminals, depth first.
export function subAgents(parents, depth = 1) {
  const all = terminals().filter((t) => t.parent && live(t));
  const out = [];
  const walk = (a, d) => { for (const t of all.filter((x) => x.parent === a)) { out.push({ t, depth: d }); walk(t.address, d + 1); } };
  for (const a of parents) walk(a, depth);
  return out;
}

// Error List severity for an agent status.
export function severity(status) {
  if (status === "blocked") return { kind: "error", icon: "error", color: C.error, text: "Agent is waiting for your input" };
  if (status === "done") return { kind: "warning", icon: "warning", color: C.warn, text: "Agent finished; review its output" };
  if (status === "working") return { kind: "message", icon: "info", color: C.info, text: "Running" };
  return { kind: "message", icon: "info", color: C.dim, text: "Idle" };
}

export default class Kit extends View {
  render() { return div(); }
}
