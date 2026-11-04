// Shared parts for the discord-* mods (Discord's dark look). Mods cannot import
// across folders, so each discord-* mod has a copy as kit.js: edit here, then copy.
import { View, div, svg, image } from "gpui-kit";
import { h_flex } from "gpui-base";
import { panes, terminals, agents, shared } from "herdr";

export const C = {
  rail: "#1e1f22", side: "#2b2d31", chat: "#313338", input: "#383a40", hover: "#35373c", selected: "#404249",
  text: "#dbdee1", header: "#f2f3f5", muted: "#949ba4", dim: "#6d6f78", border: "#1f2023",
  blurple: "#5865f2", green: "#23a55a", red: "#f23f43", yellow: "#f0b232", gray: "#80848e", link: "#00a8fc",
};
const AVATAR = ["#5865f2", "#3ba55c", "#faa61a", "#ed4245", "#eb459e", "#747f8d"];

export const icon = (n, s, c) => svg(`mods/discord-kit/icons/${n}.svg`).size(s).flex_none().text_color(c);

export function initials(name) {
  const w = (name ?? "?").replace(/[^\p{L}\p{N} _.-]/gu, "").split(/[\s_.-]+/).filter(Boolean);
  return ((w[0]?.[0] ?? "?") + (w[1]?.[0] ?? "")).toUpperCase();
}

// Discord presence from agent status: online, idle, do not disturb, offline.
export function presence(status) {
  if (status === "working") return { color: C.green, word: "Online", activity: "Working" };
  if (status === "blocked") return { color: C.red, word: "Do Not Disturb", activity: "Needs you" };
  if (status === "done") return { color: C.green, word: "Online", activity: "Finished" };
  if (status === "idle") return { color: C.yellow, word: "Idle", activity: null };
  // Running, but its program reports no status (Claude Code started from a shell).
  if (status === "online") return { color: C.green, word: "Online", activity: null };
  return { color: C.gray, word: "Offline", activity: null };
}

// Round avatar: the program's icon on its tile, else colored initials; with an
// optional status dot cut out of the background around it.
export function avatar(name, size, program, status, ring = C.side) {
  let h = 0;
  for (const c of name ?? "") h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const base = div().relative().size(size).flex_none().rounded_full().flex().items_center().justify_center();
  let el;
  if (program?.icon) {
    const g = Math.round(size * 0.6);
    el = base.bg(program.tile ?? C.selected)
      .child(program.tint ? svg(program.icon).size(g).text_color(program.color ?? C.text) : image(program.icon).w(g).h(g));
  } else el = base.bg(AVATAR[h % AVATAR.length]).text_color("#ffffff").text_size(size * 0.4).font_semibold().child(initials(name));
  if (status === undefined) return el;
  const p = presence(status), d = Math.max(10, Math.round(size * 0.375));
  return el.child(div().absolute().right(-2).bottom(-2).size(d).rounded_full().border(3).border_color(ring).bg(p.color));
}

export function channel(tab) {
  const ps = panes().filter((p) => p.tab === tab.id);
  const lead = ps.find((p) => p.program?.agent) ?? ps[0];
  const raw = /^\d+$/.test(tab.name) || /^tb\d+$/.test(tab.name) ? lead?.program?.name ?? "terminal" : tab.name;
  return { name: raw.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "general", lead, panes: ps };
}

const ENDED = new Set(["finished", "exited", "ended", "dead", "lost"]);
export function subAgents(parents) {
  const all = terminals().filter((t) => t.parent && !ENDED.has(t.state));
  const out = [];
  const walk = (a) => { for (const t of all.filter((x) => x.parent === a)) { out.push(t); walk(t.address); } };
  for (const a of parents) walk(a);
  return out;
}

// The server's people. Agents are kittens: each gets an anime kitten of its
// agent's picture (mods/discord-kit/avatars/kitten-<agent>.png, anime catgirl art,
// credits in avatars/CREDITS.txt) and a kitten name.
// You're the Kitten Herder (avatars/herder.png, the captain).
export const ME = { name: "dylandy", pic: "mods/discord-kit/avatars/herder.png" };
export const ROLES = {
  owner: { name: "Kitten Herder", color: "#f1c40f" },
  head: { name: "Head Kittens", color: "#ff73fa" },
  kitten: { name: "Kittens", color: "#5dade2" },
};
const KITTENS = { claude: "Claude", pi: "Pi", codex: "Codex", copilot: "Copilot" };

function kittenKey(program, fallback) {
  const k = `${program?.key ?? ""} ${program?.name ?? ""} ${fallback ?? ""}`.toLowerCase();
  return Object.keys(KITTENS).find((x) => k.includes(x)) ?? "default";
}

export function kittenName(program, subName) {
  if (subName) return `${subName} kitten`;
  const key = kittenKey(program);
  return `${KITTENS[key] ?? program?.name ?? "Stray"} Kitten`;
}

export const kittenPic = (program, fallback) => `mods/discord-kit/avatars/kitten-${kittenKey(program, fallback)}.png`;

// A round picture from a file, with the same status dot as avatar().
export function picture(path, size, status, ring = C.side) {
  const el = div().relative().size(size).flex_none().child(image(path).size(size).rounded_full());
  if (status === undefined) return el;
  const p = presence(status), d = Math.max(10, Math.round(size * 0.375));
  return el.child(div().absolute().right(-2).bottom(-2).size(d).rounded_full().border(3).border_color(ring).bg(p.color));
}

// Everyone in the server, as the member list, forum and voice channel see them:
// top-level agents (ones reporting a status, or recognized by the program in
// their pane), what they started (subs, with parent), and finished runs (ended).
// tab: only agents in that tab, and what they started.
export function herd(tab) {
  const all = terminals();
  const live = new Map(all.filter((t) => !ENDED.has(t.state)).map((t) => [t.address, t]));
  const seen = new Set(), top = [];
  const paneOf = new Map(panes().filter((p) => p.terminal).map((p) => [p.terminal, p]));
  for (const a of agents()) {
    seen.add(a.address);
    top.push({ address: a.address, name: kittenName(a.program), pic: kittenPic(a.program, a.app), status: a.status ?? "online", role: "head",
      what: a.title, title: a.title, tab: a.tab, seq: a.seq ?? 0, cwd: paneOf.get(a.address)?.cwd, turn: live.get(a.address)?.turn ?? 0 });
  }
  for (const p of panes()) {
    if (!p.terminal || seen.has(p.terminal) || !p.program?.agent || !live.has(p.terminal) || live.get(p.terminal).parent) continue;
    seen.add(p.terminal);
    top.push({ address: p.terminal, name: kittenName(p.program), pic: kittenPic(p.program, p.app), status: p.status ?? "online", role: "head",
      what: p.title, title: p.title, tab: p.tab, seq: 0, cwd: p.cwd, turn: live.get(p.terminal)?.turn ?? 0 });
  }
  const sub = (t) => ({ address: t.address, name: kittenName(t.program, t.name ?? t.address), pic: kittenPic(t.program, t.agent),
    status: ENDED.has(t.state) ? null : t.status ?? "online", role: "kitten", parent: t.parent, what: `started by ${t.parent}`,
    title: t.name ?? t.argv?.join(" ") ?? t.agent, cwd: t.cwd, turn: t.turn ?? 0, ended: ENDED.has(t.state), exit: t.exit_code });
  const tabOf = new Map(top.map((m) => [m.address, m.tab]));
  const rootTab = (t) => { let x = t; for (let i = 0; x?.parent && i < 20; i++) { if (tabOf.has(x.parent)) return tabOf.get(x.parent); x = all.find((y) => y.address === x.parent); } return paneOf.get(t.address)?.tab; };
  let subs = [...live.values()].filter((t) => t.parent && !seen.has(t.address)).map((t) => ({ ...sub(t), tab: rootTab(t) }));
  const ended = all.filter((t) => ENDED.has(t.state)).map((t) => ({ ...sub(t), role: t.parent ? "kitten" : "head", tab: rootTab(t) }));
  const scoped = (list) => tab ? list.filter((m) => m.tab === tab) : list;
  const out = { top: scoped(top), subs: scoped(subs), ended: scoped(ended) };
  // Several agents of one kind: number the repeats ("Pi Kitten", "Pi Kitten 2").
  const count = {};
  for (const m of [...out.top, ...out.subs]) { count[m.name] = (count[m.name] ?? 0) + 1; if (count[m.name] > 1) m.name = `${m.name} ${count[m.name]}`; }
  return out;
}

// Whether an agent is mid-turn. Agents' own status can lag (Claude Code started
// from a shell says idle while it works), so discord-members also peeks at each
// agent's screen for a spinner or "esc to interrupt" and shares what it sees as
// "discord.peek": { [address]: { typing, line } }.
export const peek = (address) => (shared("discord.peek") ?? {})[address] ?? {};
export const typing = (m) => m?.status === "working" || Boolean(peek(m?.address).typing);
export const SPIN = /^\s*[✻✽✶✳✢·*⏺◐◑◒◓]\s+\S.*(…|\.\.\.)/;

// Discord's three bouncing typing dots.
export const dots = (size = 6, color = C.text) => h_flex().gap(2).items_center().flex_none()
  .children([0, 1, 2].map((i) => div().size(size).rounded_full().bg(color).loop("opacity", { from: 0.25, to: 1, period: 900 + i * 200 })));

// The forum's post tags, one per status.
export const TAGS = {
  working: { name: "Working", color: C.green, icon: "sparkle" },
  blocked: { name: "Needs you", color: C.red, icon: "hand" },
  done: { name: "Done", color: C.blurple, icon: "fish" },
  idle: { name: "Napping", color: C.yellow, icon: "yarn" },
};
export const tagOf = (m) => m.ended ? null : typing(m) ? "working" : m.status === "blocked" ? "blocked" : m.status === "done" ? "done" : "idle";

export default class Kit extends View {
  render() { return div(); }
}
