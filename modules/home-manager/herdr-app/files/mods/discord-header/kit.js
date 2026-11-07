// Shared parts for the discord-* mods (Discord's dark look). Mods cannot import
// across folders, so each discord-* mod has a copy as kit.js: edit here, then copy.
import { View, div, svg, image } from "gpui-kit";
import { h_flex } from "gpui-base";
import { panes, terminals, agents, shared, setShared, run, openOverlay, layout, spaces } from "herdr";

// Discord's dusk gradient theme: the window is the gradient (the layout's
// background, backgrounds/dusk.png from dusk.svg) and the panels are dark
// tints over it, darkest on the server rail. Tints add up, so a row inside a
// panel is clear (not the panel's color again). Popups sit over everything, so
// theirs are solid: card, cardInner. icon: a server icon's resting circle.
export const C = {
  rail: "#0000005c", side: "#00000038", chat: "#00000012", input: "#00000040", hover: "#ffffff0d", selected: "#ffffff17",
  panel: "#0000004d", clear: "#00000000", icon: "#ffffff17", card: "#1c1030", cardInner: "#120a20", cardRaised: "#2a1f3d",
  text: "#dbdee1", header: "#f2f3f5", muted: "#a8a4b8", dim: "#7d7891", border: "#ffffff12",
  blurple: "#5865f2", green: "#23a55a", red: "#f23f43", yellow: "#f0b232", gray: "#80848e", link: "#00a8fc",
};
const AVATAR = ["#5865f2", "#3ba55c", "#faa61a", "#ed4245", "#eb459e", "#747f8d"];

export const icon = (n, s, c) => svg(`mods/discord-kit/icons/${n}.svg`).size(s).flex_none().text_color(c);

export function initials(name) {
  const w = (name ?? "?").replace(/[^\p{L}\p{N} _.-]/gu, "").split(/[\s_.-]+/).filter(Boolean);
  return ((w[0]?.[0] ?? "?") + (w[1]?.[0] ?? "")).toUpperCase();
}

// Discord presence from agent status: online, idle (moon), do not disturb,
// streaming (watched live), offline (ring). shape: its dot, status/<shape>.svg.
export function presence(status) {
  if (status === "streaming") return { color: "#593695", word: "Streaming", activity: "Live", shape: "streaming" };
  if (status === "working") return { color: C.green, word: "Online", activity: "Working", shape: "online" };
  if (status === "blocked") return { color: C.red, word: "Do Not Disturb", activity: "Needs you", shape: "dnd" };
  if (status === "done") return { color: C.green, word: "Online", activity: "Finished", shape: "online" };
  if (status === "idle") return { color: C.yellow, word: "Idle", activity: null, shape: "idle" };
  // Running, but its program reports no status (Claude Code started from a shell).
  if (status === "online") return { color: C.green, word: "Online", activity: null, shape: "online" };
  return { color: C.gray, word: "Offline", activity: null, shape: "offline" };
}

// The status dot on an avatar's corner, cut out of what's behind it (ring).
const statusDot = (status, size, ring) => {
  const d = Math.max(10, Math.round(size * 0.375));
  return div().absolute().right(-2).bottom(-2).size(d + 2).rounded_full().bg(ring).flex().items_center().justify_center()
    .child(image(`mods/discord-kit/status/${presence(status).shape}.svg`).size(d - 2));
};

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
  return el.child(statusDot(status, size, ring));
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

// The server's people. Agents are kittens: each gets a catgirl of its own
// (portrait(), below) and a kitten name; kittenPic() is its kind's picture
// (avatars/kitten-<agent>.png), for agents not started yet. Credits in avatars.nix.
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

// Each agent's own name, bio, pronouns and treat, made up from what its
// session is about (discord-members asks a small model, see its lore.js):
// shared "discord.lore" = { "<address>[@<created_ms>]": { name, bio, pronouns, treat, turn } }.
// A terminal's turn count starts over with it, so lore made at a later turn
// than the terminal has belongs to an earlier terminal at that address.
export const loreKey = (t) => t?.address ? (t.created_ms ? `${t.address}@${t.created_ms}` : t.address) : null;
export const loreFor = (t, L = shared("discord.lore") ?? {}) => {
  const x = L[loreKey(t)];
  return x && (x.turn ?? 0) <= (t.turn ?? 0) && !/herder/i.test(x.name) ? x : null; // "Kitten Herder" is you
};
export const lore = (address) => loreFor(terminals().find((x) => x.address === address));

export const kittenPic = (program, fallback) => `mods/discord-kit/avatars/kitten-${kittenKey(program, fallback)}.png`;

// Nitro, purely for looks: each kitten's animated portrait (gifs/<name>/, its
// frames and frames.json, built by Nix from avatars.nix; frame 00 is its
// picture everywhere), avatar decoration (drawn by discord-profile), profile effect and
// theme colors, picked from its address so they stay put through renames. You
// (the owner) get the crown. discord-members gives each kitten a GIF of its
// own while there are enough: shared "discord.looks" = { <loreKey>: "058" }.
export const GIFS = ["004", "018", "021", "049", "057", "058", "061", "064", "081", "083", "090", "091", "095", "109"];
const DECOS = ["ears", "halo", "flowers", "hearts"];
const EFFECTS = [{ icon: "sparkle", color: "#ffe08a" }, { icon: "heart", color: "#ff73fa" }, { icon: "paw", color: "#ffffff" }, { icon: "fish", color: "#5dade2" }];
const THEMES = [["#5865f2", "#eb459e"], ["#57f287", "#5865f2"], ["#f0b232", "#eb459e"], ["#00a8fc", "#57f287"], ["#eb459e", "#9b84ee"]];
export const hashOf = (s) => { let h = 0; for (const c of String(s ?? "")) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
export function nitro(address, owner = false) {
  const h = hashOf(address);
  const pick = (list, salt) => list[(h >>> salt) % list.length];
  const mine = owner ? null : (shared("discord.looks") ?? {})[loreKey(terminals().find((x) => x.address === address))];
  return {
    gif: owner ? null : `mods/discord-kit/gifs/kitten-${mine ?? pick(GIFS, 0)}`,
    deco: owner ? "crown" : pick(DECOS, 4),
    effect: owner ? EFFECTS[0] : pick(EFFECTS, 8),
    theme: owner ? ["#f1c40f", "#ff73fa"] : pick(THEMES, 12),
  };
}

// A kitten's picture: its portrait GIF's first frame, the same in every list,
// the chat and its profile card (which plays the rest).
export const portrait = (address) => `${nitro(address).gif}/00.png`;

// A round picture from a file, with the same status dot as avatar().
export function picture(path, size, status, ring = C.side) {
  const el = div().relative().size(size).flex_none().child(image(path).size(size).rounded_full());
  if (status === undefined) return el;
  return el.child(statusDot(status, size, ring));
}

// Everyone in the server, as the member list, forum and voice channel see them:
// top-level agents (ones reporting a status, or recognized by the program in
// their pane), what they started (subs, with parent), and finished runs (ended).
// tab: only agents in that tab, and what they started.
export function herd(tab) {
  const all = terminals();
  const live = new Map(all.filter((t) => !ENDED.has(t.state)).map((t) => [t.address, t]));
  const L = shared("discord.lore") ?? {}, byAddr = new Map(all.map((t) => [t.address, t]));
  const loreOf = (address) => byAddr.has(address) ? loreFor(byAddr.get(address), L) : null;
  const seen = new Set(), top = [];
  const paneOf = new Map(panes().filter((p) => p.terminal).map((p) => [p.terminal, p]));
  for (const a of agents()) {
    seen.add(a.address);
    top.push({ address: a.address, name: loreOf(a.address)?.name ?? kittenName(a.program), lore: loreOf(a.address), pic: portrait(a.address), status: a.status ?? "online", role: "head",
      what: a.title, title: a.title, tab: a.tab, seq: a.seq ?? 0, cwd: paneOf.get(a.address)?.cwd, turn: live.get(a.address)?.turn ?? 0 });
  }
  for (const p of panes()) {
    if (!p.terminal || seen.has(p.terminal) || !p.program?.agent || !live.has(p.terminal) || live.get(p.terminal).parent) continue;
    seen.add(p.terminal);
    top.push({ address: p.terminal, name: loreOf(p.terminal)?.name ?? kittenName(p.program), lore: loreOf(p.terminal), pic: portrait(p.terminal), status: p.status ?? "online", role: "head",
      what: p.title, title: p.title, tab: p.tab, seq: 0, cwd: p.cwd, turn: live.get(p.terminal)?.turn ?? 0 });
  }
  const sub = (t) => ({ address: t.address, name: loreOf(t.address)?.name ?? kittenName(t.program, t.name ?? t.address), lore: loreOf(t.address), pic: portrait(t.address),
    status: ENDED.has(t.state) ? null : t.status ?? "online", role: "kitten", parent: t.parent, what: `started by ${t.parent}`,
    title: t.name ?? t.argv?.join(" ") ?? t.agent, cwd: t.cwd, turn: t.turn ?? 0, ended: ENDED.has(t.state), exit: t.exit_code,
    // An agent (it reports a status) has a conversation; a plain program (tio, a shell) only a screen.
    agent: Boolean(t.status) || Boolean(t.program?.agent), created: t.created_ms ?? null, program: t.program, label: t.name });
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
// A spinner line: "✢ Enchanting… (2m 9s · ↓ 11.9k tokens)". A short phrase that
// ends in the ellipsis (and its timer), so a reply's "* item..." or "⏺ text…"
// doesn't count.
export const SPIN = /^\s*[✻✽✶✳✢·*◐◑◒◓]\s+[A-Z][^.!?…\n]{0,60}?(…|\.\.\.)(\s*\(.*\))?\s*$/;

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

// Smooth hover. GPUI can't animate colors, only opacity/size/position, so the
// hover color is a layer under the content that fades in and out. Call it on
// the bare element, before adding children, so the layer stays underneath:
//   smooth(this, h_flex().id("x")..., "x", C.hover).child(...)
// `view.hot` holds the hovered id (one per mod; render reads it). Options:
// radius (match the element's), ms, onHover (another handler; GPUI keeps one),
// slide (px the content's `inner` wrapper moves right while hovered, see slide()).
export function smooth(view, el, id, color, { radius = 4, ms = 140, onHover } = {}) {
  const on = view.hot === id;
  return el.relative()
    .on_hover((hovered, cx) => {
      if (hovered) view.hot = id; else if (view.hot === id) view.hot = null;
      onHover?.(hovered, cx);
      cx.notify();
    })
    .child(div().id(`${id}-hl`).absolute().top(0).left(0).right(0).bottom(0).rounded(radius).bg(color)
      .opacity(on ? 1 : 0).transition("opacity", { duration: ms, easing: "ease-out" }));
}

// Content that eases a few px right while its row is hovered (rows, posts).
export const slide = (view, id, el, px = 3) => el.relative().left(view.hot === id ? px : 0)
  .transition("left", { duration: 160, easing: "ease-out" });

// Go Live: a working (or asking) agent "streams" its terminal. Watching opens
// the stream (the convo-stack's live view); Pop Out floats it in a window.
export const streaming = (m) => !m?.ended && (typing(m) || m?.status === "blocked");

// Shows the stream in the live view, with no thread panel (one terminal
// can't show in two places). A terminal without a pane (a sub-agent or helper
// an agent started) borrows its parent's pane for now (terminal.show), so the
// parent's tab shows it; unshow() gives the pane back. why: a line the stream bar shows.
export function watch(address, why = null) {
  unshow();
  closeThread();
  const ps = panes();
  let pane = null;
  if (address && !ps.some((p) => p.terminal === address)) {
    const all = terminals();
    let up = all.find((t) => t.address === address)?.parent;
    for (let i = 0; up && i < 20 && !pane; i++) {
      pane = ps.find((p) => p.terminal === up)?.pane ?? null;
      if (!pane) up = all.find((t) => t.address === up)?.parent;
    }
    if (pane) {
      run("agent.focus", { terminal: up });
      run("terminal.show", { terminal: address, pane });
    }
  } else if (address) run("agent.focus", { terminal: address });
  setShared("discord.stream", { address, why, pane });
  run("layout.select", { stack: "convo-stack", child: "live" });
  syncCompose(true);
}

// A node of the shown layout, by id.
export function node(id, n = layout()) {
  if (n?.id === id) return n;
  for (const c of n?.children ?? []) { const f = node(id, c); if (f) return f; }
  return null;
}

// Watch Stream with chat: the stream's own chat column (stream-chat, with its
// own message box) docks on the right, as Discord's "Show Chat" does; the
// message box under the channel's chat steps aside while it's open.
export const streamChatOn = () => node("stream-chat") ? !node("stream-chat").hidden : false;
export function syncCompose(live = node("convo-stack")?.active === "live") {
  run(live && streamChatOn() ? "layout.hide" : "layout.show", { id: "compose" });
}
export function toggleStreamChat(on = !streamChatOn()) {
  run(on ? "layout.show" : "layout.hide", { id: "stream-chat" });
  run(on ? "layout.hide" : "layout.show", { id: "compose" });
}

// Gives a borrowed pane back to its own terminal.
export function unshow() {
  const s = shared("discord.stream");
  if (s?.pane) { run("terminal.show", { pane: s.pane }); setShared("discord.stream", { ...s, pane: null }); }
}

// Watching a stream right now.
export const watching = (active) => active === "live";
// The sub-agent being watched in a borrowed pane, if any.
export const borrowed = () => shared("discord.stream")?.pane ? shared("discord.stream").address : null;

// Gives a sub-agent its own channel (a tab with its terminal), and shows it.
export function keepAsChannel(address) {
  unshow();
  setShared("discord.stream", null);
  run("terminal.keep", { terminal: address, place: "tab" });
  run("layout.select", { stack: "convo-stack", child: "live" });
  syncCompose(true);
}

export function stopWatching() {
  unshow();
  setShared("discord.stream", null);
  run("layout.select", { stack: "convo-stack", child: "output" });
  syncCompose(false);
  restoreSplit();
}

// The stream in its own window (remembers where you drop it).
export function popOut(address, name) {
  openOverlay({ kind: "window", key: `stream-${address}`, width: 900, height: 560, layout: { type: "column", children: [
    { type: "block", size: { px: 40 }, content: { mod: "discord-stream", props: { terminal: address, name, popout: true } } },
    { type: "block", content: { terminal: address } },
  ] } });
}

// The thread side panel: the agent's terminal beside the chat, in the member
// list's place (Discord opens threads there).
// The thread panel shows the channel's terminals (its tab's panes): the
// agent, and its shell when it has one (openShell).
export function openThread(address) {
  if (address) run("agent.focus", { terminal: address });
  run("layout.hide", { id: "members" });
  run("layout.show", { id: "thread" });
}
export function closeThread() {
  run("layout.hide", { id: "thread" });
  run("layout.show", { id: "members" });
}

// Split view: the thread panel (the channel's agent's terminal beside its
// chat), remembered per channel in shared "discord.split" = { <tab id>: true };
// its width is the layout's own (dragging the divider sticks).
const activeTab = () => spaces().find((s) => s.active)?.tabs.find((t) => t.active)?.id ?? null;
export const splitOn = (tab = activeTab()) => Boolean((shared("discord.split") ?? {})[tab]);
export function setSplit(on, tab = activeTab()) {
  if (!tab) return;
  setShared("discord.split", { ...(shared("discord.split") ?? {}), [tab]: on });
  restoreSplit(tab);
}
// A channel's shell: a pane split under its agent (same folder, same
// machine), in the split view beside the chat. It stays with the channel
// (it's the tab's pane); exit it (Ctrl+D) to close it.
export const channelShell = (tab = activeTab()) => panes().find((p) => p.tab === tab && p.terminal && !p.program?.agent) ?? null;
export function openShell(tab = activeTab()) {
  if (!tab) return;
  const sh = channelShell(tab);
  if (sh) run("pane.focus", { pane: sh.pane });
  else {
    const agent = panes().find((p) => p.tab === tab && p.program?.agent);
    run("pane.split", { direction: "down", ...(agent ? { pane: agent.pane } : {}) });
  }
  setShared("discord.split", { ...(shared("discord.split") ?? {}), [tab]: true });
  openThread(null);
}

// Opens or closes the panel as the channel had it.
export function restoreSplit(tab = activeTab()) {
  const open = node("thread") ? !node("thread").hidden : false;
  if (splitOn(tab)) {
    const { top, subs } = herd(tab), agent = top[0] ?? subs[0];
    if (agent) openThread(agent.address); else if (open) closeThread();
  } else if (open) closeThread();
}

// A tab with no agent in it is a shell channel: it opens straight into its terminal.
export const isShell = (tab) => !channel(tab).panes.some((p) => p.program?.agent);

// A sub-agent's own chat: shared "discord.chat" = { address } while it's open
// in the chat view (the message box sends to it too); null = the channel's agent.
export const chatSub = () => shared("discord.chat")?.address ?? null;

// Opens a sub-agent: an agent's chat, or a plain program's screen (it has no
// conversation). Its parent's channel is shown first.
export function openSub(m) {
  if (!m?.address) return;
  if (!m.agent) return watch(m.address);
  unshow();
  setShared("discord.stream", null);
  closeThread();
  const all = terminals();
  let up = m.parent;
  for (let i = 0; up && i < 20 && !panes().some((p) => p.terminal === up); i++) up = all.find((t) => t.address === up)?.parent;
  if (up) run("agent.focus", { terminal: up });
  setShared("discord.chat", { address: m.address });
  run("layout.select", { stack: "convo-stack", child: "output" });
}
export const closeSub = () => setShared("discord.chat", null);

// Merged chat: a channel's agent and its sub-agents as one conversation.
// shared "discord.merge" = { [tab id]: true }.
export const merged = (tab) => Boolean((shared("discord.merge") ?? {})[tab]);
export const setMerged = (tab, on) => setShared("discord.merge", { ...(shared("discord.merge") ?? {}), [tab]: on });

// Everything an agent started, at any depth.
export function descendants(address, list) {
  const out = [], walk = (a) => { for (const m of list.filter((x) => x.parent === a)) { out.push(m); walk(m.address); } };
  walk(address);
  return out;
}

// Discord's red LIVE pill.
export const livePill = (size = 10) => div().flex_none().px(4).h(size + 6).rounded(4).bg(C.red).flex().items_center()
  .text_size(size).font_bold().text_color("#ffffff").child("LIVE");

export default class Kit extends View {
  render() { return div(); }
}
