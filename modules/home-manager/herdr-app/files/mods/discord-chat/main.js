// The Discord chat: the agent's transcript as messages. Your prompts and the
// agent's final replies (not its commands or thinking; those stay in Live)
// under avatars and names, with Claude's "done 3:47 PM" as the reply's time.
// Everything from the iMessage output view still works here: typing goes to the
// message box, menu keys to the agent, click and drag (or Shift+click) selects lines, Ctrl+C copies them,
// double-click copies a line, Ctrl+Shift+C copies the selection or last reply,
// Ctrl+F searches, and questions switch to the live terminal by themselves.
// A sub-agent's chat opens here too (shared "discord.chat"): its prompts came
// from its parent, so they show under the parent's name. Merged (the header's
// toggle, per channel) shows the agent and everything it started as one
// conversation; see merge() for how messages from different terminals are ordered.
// A second copy (props.side) is the chat beside a watched stream (Watch Stream
// with chat): it follows the streamed agent and leaves the background work
// (other channels, timings) to the first.
// A pi or Claude Code channel reads the agent's own session file (pi.js,
// claude.js): every message at any time, with exact times; everything else
// reads the terminal's text.
import { View, div, image } from "gpui-kit";
import { h_flex, v_flex, InputState, Input } from "gpui-base";
import { hc, run, spaces, panes, terminals, focused, layout, notify, settings, nextCommand, shared, setShared, appHome, exec, props } from "herdr";
import * as fs from "fs/promises";
import * as piSession from "./pi.js";
import * as claudeSession from "./claude.js";
import { C, icon, avatar, picture, dots, peek, watch, stopWatching, openThread, closeThread, splitOn, node, streamChatOn, chatSub, openSub, merged, herd, descendants, typing, ME, ROLES, kittenName, portrait, lore } from "./kit.js";

const ROW = 20, CHAR = 7.85, FONT = 13, YOU_CHAR = 8.1, YOU_ROW = 21;
const SAMPLE = "the quick brown fox jumps over the lazy dog, then checks whether the build passed or failed. ";
const DONE = /^\s*✻\s.*\bdone\s+(\d{1,2}:\d{2}\s?[AP]M)/;
const CLAUDE_YOU = /^\s*❯\s(\S.*)$/;
const norm = (x) => x.replace(/\s+/g, " ").trim();
const RULE = /^\s*[─━═]{20,}\s*$/;
// Code, commands and drawn tables: shown in the mono font, never reflowed.
const CODE = (l) => /^\s{4,}\S/.test(l) || /^\s*\$\s/.test(l) || /[─━│┃┌┐└┘├┤┬┴┼╭╮╰╯═║]/.test(l) || /^\s*\|.*\|\s*$/.test(l);

// A markdown table's rows laid out in columns, with a rule under the header
// (in place of its |---| line).
const TABLE_ROW = /^\s*\|.*\|\s*$/;
function table(rows) {
  const cells = rows.map((x) => x.l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim().replace(/\*\*(.*?)\*\*/g, "$1")));
  const rule = (r) => r.every((c) => /^:?-{2,}:?$/.test(c));
  const body = cells.filter((r) => !rule(r));
  const n = Math.max(...body.map((r) => r.length)), w = Array.from({ length: n }, (_, k) => Math.max(...body.map((r) => (r[k] ?? "").length)));
  const line = (r) => r.length ? ` ${w.map((wk, k) => (r[k] ?? "").padEnd(wk)).join(" │ ")} ` : "";
  const out = [];
  cells.forEach((r, k) => {
    if (rule(r)) out.push({ ...rows[k], l: `─${w.map((wk) => "─".repeat(wk)).join("─┼─")}─`, code: true });
    else out.push({ ...rows[k], l: line(r), code: true });
  });
  return out;
}

// A reply's markdown (pi's and Claude's own text): fenced blocks are code, the
// fences go, tables line up, headings lose their #s and are bold, and **bold**
// marks come off.
function markdown(lines) {
  const out = [];
  let fence = false;
  for (let k = 0; k < lines.length; k++) {
    const x = lines[k];
    if (/^\s*```/.test(x.l)) { fence = !fence; continue; }
    if (fence) { out.push({ ...x, code: true }); continue; }
    if (TABLE_ROW.test(x.l)) {
      let e = k;
      while (e + 1 < lines.length && TABLE_ROW.test(lines[e + 1].l)) e++;
      out.push(...table(lines.slice(k, e + 1)));
      k = e;
      continue;
    }
    const head = x.l.match(/^\s*#{1,6}\s+(.*)$/);
    const l = (head ? head[1] : x.l).replace(/\*\*(\S(?:.*?\S)?)\*\*/g, "$1");
    out.push(head ? { ...x, l, bold: true } : { ...x, l });
  }
  return out;
}

// Claude's spinner ("✢ Enchanting… (2m 9s · ↓ 11.9k tokens)"), as the kit's SPIN.
const SPIN = /^\s*[✻✽✶✳✢·*◐◑◒◓]\s+[A-Z][^.!?…\n]{0,60}?(…|\.\.\.)(\s*\(.*\))?\s*$/;
const ASK = /(Do you want to|Would you like to|\(y\/n\)|\[y\/N\]|\[Y\/n\]|Press Enter to|❯\s*\d+\.\s|^\s*\d+\.\s.*\(recommended\))/i;

// Files the message box sent (shared "discord.uploads", by file name) out of a
// message's text: their paths go, their thumbnails come back as pictures.
function attachments(text) {
  const uploads = shared("discord.uploads") ?? {}, pics = [];
  const rest = text.replace(/(^|\s)(\/\S*\/([^\s/]+))(?=\s|$)/g, (all, lead, _path, name) => {
    const u = uploads[name];
    if (!u) return all;
    pics.push({ ...u, file: `${appHome()}/data/discord-uploads/${name}` });
    return lead;
  });
  return { text: rest.trim(), pics };
}

// A prompt line's text: one from another agent arrives as <hc from="t1">…</hc>,
// and a queued one carries Claude's send-now hint.
function prompt(text) {
  const from = text.match(/^<hc from="([^"]+)">/)?.[1] ?? null;
  return { from, text: text.replace(/^<hc from="[^"]*">\s*/, "").replace(/\s*<\/hc>\s*$/, "").replace(/\s*ctrl\+enter to send now\s*$/i, "") };
}

// The agents whose session files the chat reads, by the app they report.
const SESSIONS = { pi: piSession, claude: claudeSession };
const sessionKind = (app, program) => app === "pi" || program?.key === "pi" ? "pi"
  : app === "claude-code" || program?.key === "claude" ? "claude" : null;

// A prompt in the transcript is a message you sent: the same start, or (long
// enough not to be chance) after stray keys already in the agent's input box.
function sameMessage(shown, sent) {
  const p = sent.slice(0, 40);
  return shown.startsWith(p) || sent.startsWith(shown.slice(0, 40)) || (p.length >= 8 && shown.includes(p));
}

function find(n, id) { if (n?.id === id) return n; for (const c of n?.children ?? []) { const f = find(c, id); if (f) return f; } return null; }

// The agent's own input box sits between the last two full-width rules; below
// them is its footer (mode, tokens, hints). A ╭─╮ box or a bare prompt line works too.
export function splitPrompt(lines) {
  let end = lines.length;
  while (end > 0 && !lines[end - 1].trim()) end--;
  const tail = Math.max(0, end - 16);
  const rules = [];
  for (let i = tail; i < end; i++) if (RULE.test(lines[i])) rules.push(i);
  if (rules.length >= 2) {
    const a = rules[rules.length - 2], b = rules[rules.length - 1];
    return { body: lines.slice(0, a), draft: lines.slice(a + 1, b), footer: lines.slice(b + 1, end), box: true };
  }
  for (let i = end - 1; i >= tail; i--) if (/^\s*╭/.test(lines[i])) {
    const close = lines.findIndex((l, j) => j > i && /^\s*╰/.test(l));
    return { body: lines.slice(0, i), draft: lines.slice(i + 1, close < 0 ? end : close), footer: close < 0 ? [] : lines.slice(close + 1, end), box: true };
  }
  for (let i = end - 1; i >= Math.max(0, end - 6); i--) if (/^\s*[›❯>]\s?/.test(lines[i])) {
    return { body: lines.slice(0, i), draft: [lines[i]], footer: lines.slice(i + 1, end), box: true };
  }
  return { body: lines.slice(0, end), draft: [], footer: [], box: false };
}

// The agent's final message in a turn: the prose after its last command.
// Claude Code starts every step with a "●" at the left edge; tool steps are
// "● Name(…)" or summaries like "Read 1 file (ctrl+o to expand)". Pi ends each
// command with "Took 0.0s". Thinking and spinner lines never count.
const TOOL_STEP = /^[●⏺]\s+[A-Z][A-Za-z]*(\(|\s*$)|^\s{0,2}(Read|Searched|Listed|Wrote|Updated|Edited|Ran|Fetched|Found|Called|Loaded)\s+\d+\s|^\s{0,2}(Read|Searched|Listed|Wrote)\b.*ctrl\+o/;
const PROSE_STEP = /^[●⏺]\s+\S/;
// A step still running: "  Running hc read t1 …" after a blank line, with its
// "⎿" output under it or cut short with "…" (done, it folds into "Ran 1 …").
const RUNNING = /^\s{2}(Running|Reading|Searching|Listing|Writing|Updating|Editing|Fetching|Calling|Loading)\s/;
const running = (lines, k) => RUNNING.test(lines[k]) && !lines[k - 1]?.trim() && (/^\s*⎿/.test(lines[k + 1] ?? "") || /…\s*$/.test(lines[k]));
const PI_TOOL = /^\s?(\$\s|Took \d|edit\s+[~\/]|read\s+[~\/]|write\s+[~\/])/;
const PI_OUT = /^\s{2,}\d+\s|^\s+\.\.\.\s*$|\(\d+ earlier lines/;
const THINK = /^\s*(∴|✻|✽|✶|✳|✢|·)\s|^\s*⎿\s+Tip:/;
export function finalReply(lines, idx) {
  const claude = lines.some((l) => PROSE_STEP.test(l) || TOOL_STEP.test(l));
  let start = 0;
  if (claude) {
    let lastTool = -1;
    lines.forEach((l, k) => { if (TOOL_STEP.test(l) || running(lines, k)) lastTool = k; });
    start = lines.findIndex((l, k) => k > lastTool && PROSE_STEP.test(l) && !TOOL_STEP.test(l));
    if (start < 0) return { lines: [], idx: [] };
  } else {
    // A "$ command" runs until its "Took …" line; one still running means the
    // agent hasn't written its reply yet. Numbered diff lines and "(N earlier
    // lines…)" folds are command output too.
    let open = false;
    lines.forEach((l, k) => {
      if (/^\s?\$\s/.test(l)) open = true;
      if (/^\s?Took \d/.test(l)) open = false;
      if (PI_TOOL.test(l) || PI_OUT.test(l)) start = k + 1;
    });
    if (open) return { lines: [], idx: [] };
  }
  const out = [], ids = [];
  for (let k = start; k < lines.length; k++) {
    if (THINK.test(lines[k])) continue;
    // Tool output that landed after the reply began (a background command's).
    if (claude && /^\s*⎿|^\s*… \+\d+ lines/.test(lines[k])) continue;
    out.push(lines[k]); ids.push(idx[k]);
  }
  while (out.length && !out[0].trim()) { out.shift(); ids.shift(); }
  while (out.length && !out[out.length - 1].trim()) { out.pop(); ids.pop(); }
  return { lines: out, idx: ids };
}

// The terminal wrapped prose at its own width; join those pieces back into
// paragraphs (a line that reached the terminal's width continues on the next).
// Table rows and code reach the width too, but are their own lines.
function reflow(lines) {
  const width = Math.max(...lines.map((x) => x.l.replace(/\s+$/, "").length), 0);
  const out = [];
  for (const x of lines) {
    const prev = out[out.length - 1], text = x.l.replace(/\s+$/, "");
    const starts = !text.trim() || /^\s*([●•⏺]|[-*]\s|\d+\.\s|#)/.test(text);
    if (prev && prev.l.trim() && !starts && prev.full && !CODE(prev.l) && !CODE(text)) {
      prev.l = `${prev.l} ${text.trim()}`;
      prev.full = text.length >= width - 12;
    } else out.push({ l: text, i: x.i, full: text.length >= width - 12 });
  }
  return out;
}

// Word-wrap a line to `per` characters, keeping its indent on every row.
function wrapWords(line, per) {
  // An indent as wide as the row would never shrink, so it's capped.
  const indent = line.match(/^\s*([●•⏺]\s|[-*]\s|\d+\.\s)?/)[0].replace(/\S/g, " ").slice(0, Math.floor(per / 2));
  const rows = [];
  let cur = "";
  for (const w of line.trim().split(/\s+/)) {
    const lead = rows.length || cur ? indent : line.match(/^\s*/)[0];
    const next = cur ? `${cur} ${w}` : `${rows.length ? indent : line.match(/^\s*/)[0]}${w}`;
    if (next.length > per && cur) { rows.push(cur); cur = `${indent}${w}`; } else cur = next;
    while (cur.length > per) { rows.push(cur.slice(0, per)); cur = indent + cur.slice(per); }
  }
  if (cur) rows.push(cur);
  return rows.length ? rows : [""];
}

// Code and tables keep their spacing (word wrap would squeeze the columns):
// a long line is cut into rows as it is.
function wrapCode(line, per) {
  const rows = [];
  for (let k = 0; k < line.length; k += per) rows.push(line.slice(k, k + per));
  return rows.length ? rows : [""];
}

function style(line) {
  if (/^\s*[❯>]\s\S/.test(line)) return { kind: "you" };
  if (/^\s*[●•⏺]\s+(Bash|Read|Write|Edit|Update|Search|Grep|Glob|Agent|Task|Fetch|WebFetch|WebSearch|Ran|Explored|Edited)\b/.test(line)) return { bullet: true, bold: true };
  if (/^\s*[●•⏺]\s/.test(line)) return { bullet: true };
  if (/^\s*(⎿|└|L\s|│)/.test(line)) return { color: "#6c6c70" };
  if (/^\s*\d*\s*\+(\s|$)/.test(line)) return { color: "#248a3d", bg: "#34c75922" };
  if (/^\s*\d*\s*-(\s|$)/.test(line) && !/^\s*-\s+\S/.test(line)) return { color: "#d70015", bg: "#ff3b301f" };
  if (/^\s*#{1,6}\s/.test(line)) return { bold: true };
  if (/^\s*(⚠|warning:)/i.test(line)) return { color: "#a05a00" };
  if (/^\s*(✗|✘|error:|Error:)/.test(line)) return { color: "#d70015" };
  if (SPIN.test(line)) return { color: "#8e8e93", italic: true };
  return {};
}

export default class Output extends View {
  init(_props, cx) {
    this.side = Boolean(props()?.side);
    this.term = null;
    this.lines = [];        // logical lines of the transcript body
    this.draft = [];
    this.footer = [];
    this.follow = true;
    this.history = {};      // terminal -> false once a read wasn't plain history (a full-screen app)
    this.stitch = {};       // full-screen app -> true while one scrolled read of its history is wanted
    this.status = {};       // terminal -> its status last tick
    this.kept = {};         // terminal -> its lines, kept while another channel is shown
    this.seen = {};         // terminal -> the turn last marked seen here
    this.sess = {};         // pi/Claude terminal -> its session file and the conversation in it
    this.sel = null;        // [start, end] logical lines
    this.width = 800;
    this.auto = false;      // opened the split view by itself (for a question)
    this.asking = false;
    this.offset = 0;        // rows scrolled up from the bottom
    this.subs = {};         // merged: sub-agent address -> { lines, history }
    this.seenSrc = new Set(); // terminals read at least once this session
    this.backfill = new Set(); // messages already there on that first read (no time known)
    try { this.stamps = JSON.parse(localStorage.getItem("discord.stamps") ?? "{}"); } catch (_e) { this.stamps = {}; }
    this.tickN = 0;
    this.rev = 0;           // bumped when lines or subs change: rows() is cached on it
    this.rowCache = new Map(); // a message's laid-out rows, by what they're made from
    this.viewH = 400;
    this.charW = CHAR;      // measured from a hidden sample once drawn
    this.youCharW = YOU_CHAR;
    this.handle = cx.focus_handle();
    this.search = InputState.new({ value: "", placeholder: "Search transcript" });
    this.query = "";
    this.search.on("change", (_e, cx) => { this.query = this.search.value(); cx.notify(); });
    this.search.on("submit", () => { this.handle.focus(); });
    this.warmSig = {};      // terminal -> its turn and status when last read in the background
    this.warmFail = {};     // terminal -> when a background read last failed
    // How long things take here, in ms (the last 60 of each), written to
    // data/discord-perf.json every 10 s while something changed.
    this.perf = { build: [], render: [], read: [], session: [], open: [] };
    if (!this.side) cx.timer.every(10000, (cx) => this.writePerf(cx));
    cx.timer.every(1000, (cx) => { this.tick(cx); if (!this.side) this.warm(cx); });
    this.tick(cx);
    cx.spawn(async (cx) => { for (;;) { const c = await nextCommand(); if (c === "focus") this.handle.focus(); } });
  }

  target() {
    const space = spaces().find((s) => s.active), tab = space?.tabs.find((t) => t.active);
    // A sub-agent's chat, while it's open and still in this channel (beside a
    // stream: the sub-agent being watched).
    const watched = this.side ? shared("discord.stream")?.address : null;
    const subAddr = watched ?? chatSub();
    const sub = subAddr ? herd(tab?.id).subs.find((m) => m.address === subAddr) : null;
    if (sub) {
      const parent = terminals().find((x) => x.address === sub.parent);
      return { term: sub.address, status: sub.status, name: sub.program?.name ?? "Agent", program: sub.program, tab: tab?.id,
        sub, label: sub.name, pic: sub.pic, parentLabel: parent ? lore(parent.address)?.name ?? kittenName(parent.program, parent.parent ? parent.name ?? parent.address : null) : "parent",
        parentPic: parent ? portrait(parent.address) : ME.pic };
    }
    const ps = panes().filter((p) => p.tab === tab?.id && p.terminal);
    const f = focused()?.terminal;
    // The focused agent, else the channel's agent: its shell (split view) is
    // never the conversation.
    const pick = ps.find((p) => p.terminal === f && p.program?.agent) ?? ps.find((p) => p.program?.agent) ?? ps.find((p) => p.terminal === f) ?? ps[0];
    return { term: pick?.terminal ?? null, status: pick?.status ?? tab?.status ?? null, name: pick?.program?.name ?? "Agent", program: pick?.program ?? null, app: pick?.app ?? null,
      tab: tab?.id, sub: null, label: lore(pick?.terminal)?.name ?? kittenName(pick?.program), pic: pick?.terminal ? portrait(pick.terminal) : ME.pic };
  }

  // Merged view on, for the channel's own agent (not inside a sub-agent's chat).
  mergeOn(t = this.target()) { return !t.sub && Boolean(t.tab) && merged(t.tab); }

  // Reads a terminal's transcript body. A screen-only read (a busy agent's,
  // complete: false, or one we asked for) keeps the history we had and
  // replaces the overlapping tail.
  async readBody(term, prev, deep) {
    const r = await hc(["read", term, "--json", "--lines", deep ? "1500" : "0"]);
    const d = JSON.parse(r.stdout);
    const parts = splitPrompt(String(d.text ?? "").split("\n"));
    let body = parts.body;
    if ((d.complete === false || !deep) && prev.length) {
      // Where the screen's top already is in what we had: its first lines in a
      // row (one line, like "Took 0.0s", repeats), latest match first; else
      // its first line alone (the screen is short, or its bottom changed).
      const s = body.findIndex((l) => l.trim());
      let at = -1;
      if (s >= 0) for (let k = prev.length - 1; k >= Math.max(0, prev.length - 600) && at < 0; k--) {
        let j = 0;
        while (j < 3 && s + j < body.length && k + j < prev.length && prev[k + j] === body[s + j]) j++;
        if (j === 3) at = k;
      }
      if (s >= 0 && at < 0) at = prev.lastIndexOf(body[s]);
      body = at >= 0 ? [...prev.slice(0, at), ...body.slice(s)] : [...prev, ...body];
    }
    // A busy agent's screens add up; keep what a full read would give.
    if (body.length > 3000) body = body.slice(-3000);
    return { d, parts, body };
  }

  // On screen: the channel's chat, or (the side copy) the stream's open chat.
  shown() {
    const stack = find(layout(), "convo-stack")?.active ?? "output";
    return this.side ? stack === "live" && streamChatOn() : stack === "output";
  }

  // Another channel: show what's kept for it at once, then read it fresh.
  switchTo(t) {
    if (this.term && this.lines.length) {
      this.kept[this.term] = this.lines;
      const ks = Object.keys(this.kept);
      if (ks.length > 20) delete this.kept[ks[0]];
    }
    this.term = t.term; this.lines = this.kept[t.term] ?? []; this.sel = null; this.follow = true; this.subs = {}; this.rev++;
    if (!t.term) return;
    this.stitch[t.term] = true;
    const p = this.sess[t.term];
    if (p && !p.s) p.tried = 0;
    this.opening = { term: t.term, at: Date.now() };
    if (this.lines.length || p?.conv) this.opened(0);
  }

  // The time from a switch to the first messages on screen.
  opened(ms) {
    if (!this.opening) return;
    this.mark("open", ms ?? Date.now() - this.opening.at);
    this.opening = null;
  }

  mark(what, ms) {
    const list = this.perf[what];
    list.push(Math.round(ms));
    if (list.length > 60) list.shift();
    this.perfDirty = true;
  }

  writePerf(cx) {
    if (!this.perfDirty) return;
    this.perfDirty = false;
    const sum = (l) => { const x = [...l].sort((a, b) => a - b); return x.length ? { n: x.length, median: x[x.length >> 1], p90: x[Math.floor(x.length * 0.9)], max: x[x.length - 1] } : null; };
    const out = { at: new Date().toISOString(), lines: this.lines.length, rows: this.rowsMemo?.length ?? 0, term: this.term,
      ...Object.fromEntries(Object.entries(this.perf).map(([k, v]) => [k, sum(v)])) };
    cx.spawn(async () => { try { await fs.writeFile(`${appHome()}/data/discord-perf.json`, JSON.stringify(out, null, 1)); } catch (_e) { /* no write: no numbers */ } });
  }

  tick(cx) {
    const t = this.target();
    if (t.term !== this.term) this.switchTo(t);
    // A full-screen app (Claude Code) gives its history only by being scrolled,
    // and only while it isn't working; otherwise just its screen, which is
    // added to what we have. So it's scrolled once on opening its channel,
    // once after each turn, and when you scroll past the top, not every second.
    if (t.term && t.status !== this.status[t.term]) {
      if (this.status[t.term] === "working") this.stitch[t.term] = true;
      this.status[t.term] = t.status;
    }
    this.tickN++;
    if (this.mergeOn(t) && this.shown() && this.tickN % 2 === 0) this.readSubs(t, cx);
    const needs = t.status === "blocked" || this.asking;
    // Questions and menus: the agent's terminal opens beside the chat (split
    // view) so you can answer there, once per question, and closes after
    // unless the channel keeps its split open.
    // A sub-agent has no pane in the channel's split view: it's watched instead.
    if (!this.side && needs && this.shown() && this.autoFor !== this.term) {
      this.autoFor = this.term;
      this.autoSub = Boolean(t.sub);
      this.auto = this.autoSub || !(node("thread") && !node("thread").hidden);
      if (t.sub) watch(this.term, this.asking ? "asking you something" : "needs your answer"); else openThread(this.term);
    } else if (!needs && this.autoFor) {
      if (this.auto && this.autoSub) stopWatching();
      else if (this.auto && !splitOn()) closeThread();
      this.autoFor = null; this.auto = false;
    }
    if (!this.term) return;
    if (!this.shown() && !(this.auto && this.autoSub)) return; // watching its question: keep reading
    // Its reply is on screen here: that's looking at it, so it's no longer
    // "done" (finished while you weren't looking) but idle, as when its
    // terminal is shown. Herdr keeps that as the turn seen (herdr.seen).
    if (this.shown() && t.status === "done") {
      const turn = terminals().find((y) => y.address === this.term)?.turn;
      if (turn && this.seen[this.term] !== turn) { this.seen[this.term] = turn; hc(["label", this.term, `herdr.seen=${turn}`]).catch(() => {}); }
    }
    const kind = t.sub ? null : sessionKind(t.app, t.program);
    if (kind) this.sessTick(cx, this.term, kind);
    // One read at a time per channel; a slow one for the channel you left
    // doesn't hold up this one (its result is dropped).
    if (this.busy === this.term) return;
    this.busy = this.term;
    // A pi or Claude channel has its session file for history: the screen is
    // only for the box, footer and questions, so Claude Code isn't scrolled for
    // it (unless no file could be found).
    const sess = this.sess[this.term], noFile = !kind || (sess?.tried && !sess.s);
    const term = this.term, deep = noFile && !sess?.conv && (this.history[term] !== false || Boolean(this.stitch[term]));
    cx.spawn(async (cx) => {
      try {
        const t0 = Date.now();
        const { d, parts, body } = await this.readBody(term, this.lines, deep);
        this.mark("read", Date.now() - t0);
        if (term !== this.term) throw new Error("switched while reading");
        if (d.how && d.how !== "history" && d.how !== "screen") this.history[term] = false;
        if (deep && d.complete !== false) this.stitch[term] = false;
        // An agent asking a question replaces its input box with the menu, so a
        // question on screen only counts when the normal box is gone.
        this.asking = !parts.box && ASK.test(parts.body.slice(-10).join("\n"));
        const changed = body.length !== this.lines.length || body[body.length - 1] !== this.lines[this.lines.length - 1] || body[0] !== this.lines[0]
          || parts.draft.join() !== this.draft.join() || parts.footer.join() !== this.footer.join();
        if (body.length !== this.lines.length || body.some((l, k) => l !== this.lines[k])) {
          if (body[0] !== this.lines[0]) this.sel = null; // the lines moved under it
          this.lines = body; this.rev++;
        }
        this.draft = parts.draft; this.footer = parts.footer;
        if (this.opening?.term === term && this.lines.length) this.opened();
        if (changed) cx.notify();
      } catch (_e) { /* the terminal went away or is restarting */ }
      if (this.busy === term) this.busy = null;
    });
  }

  // A pi or Claude channel: find the terminal's session file, then read what
  // the agent adds to it. Every 30 s it checks it's still that agent and that
  // file (/new, /clear and /resume start another).
  sessTick(cx, term, kind) {
    const mod = SESSIONS[kind];
    let p = this.sess[term];
    if (!p || p.kind !== kind) p = this.sess[term] = { kind, s: null, conv: null, tried: 0, checked: 0, busy: false };
    if (p.busy || (!p.s && Date.now() - p.tried < 10000)) return;
    p.busy = true;
    const seen = (term === this.term ? this.lines : this.kept[term] ?? []).join("\n");
    cx.spawn(async (cx) => {
      try {
        if (!p.s) {
          p.tried = Date.now();
          const found = await mod.locate(term, seen);
          if (found) { p.s = mod.open(found); p.checked = Date.now(); }
        } else if (Date.now() - p.checked > 30000) {
          p.checked = Date.now();
          if (!(await mod.stillThere(p.s))) { p.s = null; p.conv = null; p.tried = 0; if (term === this.term) { this.rev++; cx.notify(); } return; }
          // pi's file is found by its words: a newer match means /new or /resume.
          const again = kind === "pi" ? await mod.locate(term, seen) : null;
          if (again && again.file !== p.s.file) p.s = mod.open(again);
        }
        const t0 = Date.now();
        if (p.s && await mod.update(p.s)) {
          this.mark("session", Date.now() - t0);
          // Mid-turn it mostly adds tool calls and thinking, which the chat
          // doesn't show: redraw only when the messages changed.
          const conv = mod.conversation(p.s), was = p.conv;
          const same = was && conv.length === was.length && conv.every((m, k) => m.text === was[k].text && m.at === was[k].at);
          if (!same) {
            p.conv = conv;
            if (term === this.term) { this.rev++; if (this.opening?.term === term) this.opened(); cx.notify(); }
          }
        }
      } catch (_e) { /* its machine is away, or the agent moved its files: the screen still works */ }
      finally { p.busy = false; }
    });
  }

  // The other agent channels in this server stay loaded, so switching to one
  // shows its messages at once. Each is read again only when its turn or
  // status changes, one at a time (a full-screen app is scrolled once per
  // turn, as when you open its channel).
  warm(cx) {
    if (this.warming) return;
    const tabs = new Set((spaces().find((x) => x.active)?.tabs ?? []).map((x) => x.id)), all = terminals();
    const next = panes().filter((p) => tabs.has(p.tab) && p.terminal && p.terminal !== this.term && (p.program?.agent || p.status))
      .map((p) => { const x = all.find((y) => y.address === p.terminal); return { term: p.terminal, kind: sessionKind(p.app, p.program), status: x?.status ?? p.status, sig: `${x?.turn ?? ""}|${x?.status ?? p.status ?? ""}` }; })
      .find((c) => this.warmSig[c.term] !== c.sig && !(Date.now() - (this.warmFail[c.term] ?? 0) < 30000));
    if (!next) return;
    const { term, sig } = next;
    this.warmSig[term] = sig;
    if (next.kind) this.sessTick(cx, term, next.kind);
    if (this.sess[term]?.conv) return; // its session file has it all
    this.warming = true;
    cx.spawn(async () => {
      try {
        const deep = this.history[term] !== false || next.status !== "working";
        const { d, body } = await this.readBody(term, this.kept[term] ?? [], deep);
        if (d.how && d.how !== "history" && d.how !== "screen") this.history[term] = false;
        if (term !== this.term) this.kept[term] = body; // shown meanwhile: its own read has it
      } catch (_e) { this.warmSig[term] = null; this.warmFail[term] = Date.now(); /* gone, or its machine is away: again in 30 s */ }
      finally { this.warming = false; }
    });
  }

  // A session file's conversation as turns, with its own lines to select and copy.
  sessTurns(term) {
    const p = this.sess[term];
    if (p.turnsFor === p.conv) return p.turns;
    const lines = [], out = [];
    for (const m of p.conv) {
      const start = lines.length;
      if (m.who === "you") {
        const q = prompt(norm(m.text));
        lines.push(q.text);
        out.push({ who: "you", text: q.text, from: q.from, idx: [start], at: m.at, exact: true });
      } else {
        const body = m.text.split("\n"), idx = body.map((_, k) => start + k);
        lines.push(...body);
        out.push({ who: "agent", lines: body, idx, reply: { lines: body, idx }, at: m.at, exact: true });
      }
    }
    p.lines = lines; p.turns = out; p.turnsFor = p.conv;
    return out;
  }

  // The lines the shown conversation is made of: the session file's, else the screen's.
  viewLines() {
    const p = this.sess[this.term];
    return p?.conv && p.lines ? p.lines : this.lines;
  }

  // Merged: reads every sub-agent of the channel's agent (at any depth), every
  // other tick. Plain programs keep only their last lines (they become one post).
  readSubs(t, cx) {
    if (this.subBusy) return;
    const list = descendants(t.term, herd(t.tab).subs);
    this.subBusy = true;
    cx.spawn(async (cx) => {
      let changed = false;
      const next = {};
      for (const m of list) {
        const prev = this.subs[m.address] ?? { lines: [], history: true };
        try {
          const { d, body } = await this.readBody(m.address, prev.lines, prev.history);
          const lines = m.agent ? body : body.filter((l) => l.trim()).slice(-400);
          if (lines.length !== prev.lines.length || lines[lines.length - 1] !== prev.lines[prev.lines.length - 1]) changed = true;
          next[m.address] = { lines, history: !(d.how && d.how !== "history" && d.how !== "screen"), m };
        } catch (_e) { if (this.subs[m.address]) next[m.address] = this.subs[m.address]; }
      }
      if (Object.keys(next).length !== Object.keys(this.subs).length) changed = true;
      this.subs = next;
      this.subBusy = false;
      if (changed) { this.rev++; cx.notify(); }
    });
  }

  // What you sent this terminal from the message box since it started (an
  // address can come back after herdr-core restarts, for another program).
  sentTo(term) {
    const born = terminals().find((x) => x.address === term)?.created_ms ?? 0;
    return ((shared("imsg.sent") ?? {})[term] ?? []).filter((m) => m.at >= born - 5000);
  }

  // The transcript as a conversation: your prompts (Claude's "❯ " lines, or
  // text matching what you sent from the iMessage box) and the agent's replies
  // between them, plus Claude's "done 3:47 PM" lines as timestamps.
  // L/term: another terminal's transcript (merged view); main: the shown one.
  turns(L = this.lines, term = this.term, main = true) {
    if (main && this.sess[term]?.conv) return this.sessTurns(term);
    // Claude marks your prompts with "❯" (and its steps with "●"; a "❯" in
    // another agent's command output isn't a prompt). Agents that don't (pi)
    // get them matched against what you sent, each message once, so a reply
    // quoting you doesn't become a message from you.
    const marked = L.some((l) => PROSE_STEP.test(l)) && L.some((l) => CLAUDE_YOU.test(l));
    const sent = marked ? [] : this.sentTo(term).map((m) => norm(m.text)).filter((x) => x.length >= 4);
    const used = new Set();
    const out = [];
    let agent = null;
    const push = (t) => { out.push(t); agent = null; };
    for (let i = 0; i < L.length; i++) {
      const line = L[i];
      const claude = marked ? line.match(CLAUDE_YOU) : null;
      const flat = norm(line);
      const j = claude || flat.length < 4 ? -1
        : sent.findIndex((m, n) => !used.has(n) && m.startsWith(flat.slice(0, Math.min(flat.length, 40))) && flat.length >= Math.min(12, m.length));
      const mine = j >= 0 ? sent[j] : null;
      if (mine) used.add(j);
      if (claude || mine) {
        const parts = [claude ? claude[1] : flat], idx = [i];
        // Wrapped continuation lines until a blank line or the agent's next mark.
        while (i + 1 < L.length && L[i + 1].trim() && !/^\s*[●•⏺⎿✻]/.test(L[i + 1]) && (claude ? /^\s{2}/.test(L[i + 1]) : true)) {
          i++; parts.push(norm(L[i])); idx.push(i);
          if (!claude && norm(parts.join(" ")).length >= (mine?.length ?? 0)) break;
        }
        const p = prompt(norm(parts.join(" ")));
        push({ who: "you", text: p.text, from: p.from, idx });
        continue;
      }
      const done = line.match(DONE);
      if (done) { push({ who: "time", text: `Today ${done[1]}`, idx: [i] }); continue; }
      if (!agent) { if (!line.trim()) continue; agent = { who: "agent", lines: [], idx: [] }; out.push(agent); }
      agent.lines.push(line); agent.idx.push(i);
    }
    for (const t of out) if (t.who === "agent") {
      while (t.lines.length && !t.lines[t.lines.length - 1].trim()) { t.lines.pop(); t.idx.pop(); }
      while (t.lines.length && /^\s*[●•⏺]?\s*$/.test(t.lines[0])) { t.lines.shift(); t.idx.shift(); }
    }
    // Messages you sent that the transcript doesn't show (an agent can drop a
    // prompt line): place each after the last timestamp before it was sent.
    if (!main) {
      for (const t of out) if (t.who === "agent") t.reply = finalReply(t.lines, t.idx);
      return out.filter((t) => t.who !== "agent" || t.reply.lines.length);
    }
    const shownYou = out.filter((t) => t.who === "you").map((t) => t.text);
    const mins = (txt) => { const m = txt.match(/(\d{1,2}):(\d{2})\s?([AP])M/); return m ? (Number(m[1]) % 12 + (m[3] === "P" ? 12 : 0)) * 60 + Number(m[2]) : null; };
    for (const m of this.sentTo(this.term)) {
      const text = norm(m.text);
      if (shownYou.some((x) => sameMessage(x, text))) continue;
      const d = new Date(m.at), at = d.getHours() * 60 + d.getMinutes();
      let k = -1;
      out.forEach((t, j) => { if (t.who === "time" && mins(t.text) !== null && mins(t.text) <= at) k = j; });
      const later = out.some((t, j) => j > k && t.who === "time");
      if (k < 0 || !later) continue; // still pending: the strip under the conversation shows it
      out.splice(k + 1, 0, { who: "you", text, idx: [out[k].idx[0]] });
      shownYou.push(text);
    }
    const found = out.filter((t) => t.who === "you").map((t) => t.text);
    const key = `${this.term}:${found.length}:${found[found.length - 1] ?? ""}`;
    if (key !== this.inlineKey) {
      this.inlineKey = key;
      const prev = shared("imsg.inline") ?? {};
      // Per agent: which of your messages the conversation already shows.
      setShared("imsg.inline", { ...(prev.term ? {} : prev), [this.term]: found.slice(-30) });
    }
    for (const t of out) if (t.who === "agent") t.reply = finalReply(t.lines, t.idx);
    return out.filter((t) => t.who !== "agent" || t.reply.lines.length);
  }

  // Merged: the agent's messages and its sub-agents' as one conversation, in
  // time order. A transcript has no times, so each message gets one: when this
  // view first saw it (kept in localStorage, so it survives restarts), or, for
  // history already there on the first read, a place from where it sits. The
  // agent's old messages keep their order; a sub-agent's old messages go right
  // after the agent's message that started it (the first one naming it or its
  // address), else at the time it was created. A plain program (tio, a shell)
  // is a single post with its last lines, kept where it started.
  merge(main, t) {
    const now = Date.now(), all = terminals();
    const created = (a) => all.find((x) => x.address === a)?.created_ms ?? 0;
    const textOf = (tu) => tu.who === "you" ? tu.text : (tu.lines ?? []).join("\n");
    let dirty = false;
    const stamp = (addr, turns, base, step) => {
      const first = !this.seenSrc.has(addr), count = {};
      this.seenSrc.add(addr);
      turns.forEach((tu, i) => {
        if (tu.exact && tu.at) { tu.live = true; return; }
        const k0 = `${tu.who}|${norm(tu.who === "you" ? tu.text : tu.lines?.[0] ?? "").slice(0, 80)}`;
        count[k0] = (count[k0] ?? 0) + 1;
        const k = `${addr}|${k0}|${count[k0]}`;
        if (this.stamps[k]) { tu.at = this.stamps[k]; tu.live = true; }
        else if (first || this.backfill.has(k)) { this.backfill.add(k); tu.at = base + i * step; }
        else { this.stamps[k] = now; tu.at = now + i * 0.001; tu.live = true; dirty = true; }
      });
    };
    stamp(t.term, main, created(t.term), 1);
    const out = [...main];
    for (const [addr, s] of Object.entries(this.subs)) {
      const m = s.m, word = new RegExp(`(^|[^\\w-])(${[m.label, addr].filter(Boolean).map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})([^\\w-]|$)`);
      const anchor = main.find((tu) => tu.who !== "time" && word.test(textOf(tu)));
      const base = anchor ? anchor.at + 0.01 : created(addr);
      const src = { address: addr, m };
      if (!m.agent) {
        out.push({ who: "post", src, at: base, lines: s.lines.slice(-4), count: s.lines.length });
        continue;
      }
      const turns = this.turns(s.lines, addr, false).filter((x) => x.who !== "time");
      stamp(addr, turns, base, 0.001);
      for (const tu of turns) out.push({ ...tu, src });
    }
    if (dirty) {
      const keys = Object.keys(this.stamps);
      if (keys.length > 3000) for (const k of keys.slice(0, keys.length - 3000)) delete this.stamps[k];
      try { localStorage.setItem("discord.stamps", JSON.stringify(this.stamps)); } catch (_e) { /* no storage: times last this session */ }
    }
    return out.sort((a, b) => a.at - b.at);
  }

  // Discord rows, cached: render runs on every scroll step, and building them
  // walks the whole transcript (1500 lines of a remote agent's history).
  rows() {
    const t = this.target(), mergeOn = this.mergeOn(t);
    const subs = mergeOn || t.sub ? herd(t.tab).subs : [];
    const key = [this.rev, this.query, this.width, this.charW, this.youCharW, t.term, t.sub?.address, t.label, t.pic, mergeOn,
      JSON.stringify((shared("imsg.sent") ?? {})[this.term] ?? []), subs.map((m) => `${m.address}:${m.name}:${m.pic}`).join(),
      Math.floor(Date.now() / 30000)].join("|");
    if (key !== this.rowsKey) {
      const t0 = Date.now();
      this.rowsKey = key; this.rowsMemo = this.buildRows(t, mergeOn, subs);
      this.mark("build", Date.now() - t0);
    }
    return this.rowsMemo;
  }

  // Discord rows: a header (avatar, name, BOT tag, time) and the message's lines.
  buildRows(t, mergeOn, allSubs) {
    const q = this.query.trim().toLowerCase();
    const textW = Math.max(240, this.width - 72 - 24);
    const per = Math.max(20, Math.floor(textW / this.youCharW)), perMono = Math.max(20, Math.floor((textW - 24) / this.charW));
    const me = ME.name;
    const turns = mergeOn ? this.merge(this.turns(), t) : this.turns();
    // Who says a message: you, the agent, or (merged) a sub-agent. A prompt in a
    // sub-agent's transcript you didn't send came from the agent that started it.
    const labelOf = (addr) => addr === t.term && !t.sub ? { name: t.label, pic: t.pic, color: ROLES.head.color }
      : (() => { const m = allSubs.find((x) => x.address === addr); return m ? { name: m.name, pic: m.pic, color: ROLES.kitten.color } : { name: t.parentLabel ?? "agent", pic: t.parentPic ?? ME.pic, color: ROLES.head.color }; })();
    // A message another agent sent with hc: "t1" is on the same machine as the
    // terminal that got it.
    const fromAgent = (from, to) => {
      const addr = !from.includes("/") && to?.includes("/") ? `${to.slice(0, to.lastIndexOf("/"))}/${from}` : from;
      const x = terminals().find((y) => y.address === addr);
      if (!x) return null; // not a terminal: the app itself sent it for you
      return { name: lore(x.address)?.name ?? kittenName(x.program, x.parent ? x.name ?? x.address : null), pic: portrait(addr),
        color: x.parent ? ROLES.kitten.color : ROLES.head.color, bot: true, key: `from-${addr}` };
    };
    const speaker = (turn) => {
      const src = turn.src?.m ?? t.sub;
      const other = turn.who === "you" && turn.from ? fromAgent(turn.from, turn.src?.address ?? t.term) : null;
      if (other) return other;
      if (turn.who === "you") {
        if (!src || sentAt.has((turn.text ?? "").slice(0, 40))) return { name: me, pic: ME.pic, color: ROLES.owner.color, you: true };
        const from = labelOf(src.parent);
        return { name: `${from.name} → ${src.name}`, pic: from.pic, color: from.color, bot: true, key: `p-${src.address}` };
      }
      if (turn.src) return { name: turn.src.m.name, pic: turn.src.m.pic, color: ROLES.kitten.color, bot: true, thread: turn.src.m, key: turn.src.address };
      return { name: t.label, pic: t.pic, color: t.sub ? ROLES.kitten.color : ROLES.head.color, bot: true, key: "main" };
    };
    const out = [];
    const sentAt = new Map(this.sentTo(this.term).map((m) => [norm(m.text).slice(0, 40), m.at]));
    const clockOf = (ms) => {
      const d = new Date(ms), hm = `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")} ${d.getHours() < 12 ? "AM" : "PM"}`;
      const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
      const ago = Math.round((day(new Date()) - day(d)) / 86400000);
      return ago === 0 ? `Today at ${hm}` : ago === 1 ? `Yesterday at ${hm}` : `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()} ${hm}`;
    };
    let last = null;
    turns.forEach((turn, k) => {
      if (turn.who === "time") return;
      const prevTurn = last;
      last = turn;
      // A plain program's post: its name, its last lines, a way to its screen.
      if (turn.who === "post") {
        const m = turn.src.m, open = () => watch(m.address);
        out.push({ kind: "gap", h: 17 });
        out.push({ kind: "head", h: 22, who: "agent", name: m.name, pic: m.pic, color: ROLES.kitten.color, bot: true, thread: m, time: "", open });
        for (const l of turn.lines) out.push({ kind: "code", text: l.slice(0, perMono), h: 20, open });
        out.push({ kind: "text", text: `${turn.count} lines · click to watch its screen`, h: 22, s: { color: "#8e8e93", italic: true }, open });
        return;
      }
      const own = !turn.src;
      // A message's own rows, cached by everything they're made from: a rebuild
      // lays out only the messages that are new or changed.
      const ck = turn.who === "you" ? `y|${per}|${q}|${own ? turn.idx[0] : ""}|${turn.text}`
        : `a|${per}|${perMono}|${q}|${turn.exact ? 1 : 0}|${own ? turn.reply.idx.join(",") : ""}|${turn.reply.lines.join("\n")}`;
      let body = this.rowCache.get(ck);
      if (!body) {
        // Files sent from the message box: their paths become their pictures.
        const { text: said, pics } = turn.who === "you" ? attachments(turn.text) : { text: "", pics: [] };
        const lines = turn.who === "you" ? (said ? [{ l: said, i: own ? turn.idx[0] : undefined }] : [])
          : turn.exact ? markdown(turn.reply.lines.map((l, j) => ({ l, i: own ? turn.reply.idx[j] : undefined })))
          : reflow(turn.reply.lines.map((l, j) => ({ l, i: own ? turn.reply.idx[j] : undefined })));
        const hits = lines.filter((x) => !q || x.l.toLowerCase().includes(q));
        body = { first: hits[0]?.i, rows: [] };
        for (const { l, i, code, bold } of hits) {
          if (!l.trim()) { body.rows.push({ kind: "text", text: "", h: 10, i }); continue; }
          if (turn.who === "agent" && (code || CODE(l))) wrapCode(l, perMono).forEach((c) => body.rows.push({ kind: "code", text: c, h: 20, i }));
          else wrapWords(l.replace(/^\s*[●⏺]\s?/, ""), per).forEach((c, j) => body.rows.push({ kind: "text", text: c, h: 22, i, s: bold ? { bold: true } : turn.who === "agent" ? style(l) : {}, first: j === 0 }));
        }
        for (const p of pics) body.rows.push({ kind: "image", h: p.h + 8, w: p.w, src: p.thumb, i: own ? turn.idx[0] : undefined, open: () => exec("xdg-open", [p.file]).catch(() => {}) });
        if (body.first === undefined && pics.length) body.first = own ? turn.idx[0] : undefined;
        if (this.rowCache.size > 4000) this.rowCache.clear();
        this.rowCache.set(ck, body);
      }
      if (!body.rows.length) return;
      const next = turns[k + 1];
      const time = turn.live || turn.exact ? (turn.at ? clockOf(turn.at) : "")
        : turn.who === "agent" ? (next?.who === "time" ? next.text.replace("Today", "Today at") : "")
        : sentAt.has(turn.text.slice(0, 40)) ? clockOf(sentAt.get(turn.text.slice(0, 40))) : "";
      const who = speaker(turn);
      // Same author as the message just before, with no timestamp between: Discord
      // continues the group without repeating the avatar and name.
      const grouped = prevTurn && prevTurn.who === turn.who && prevTurn.who !== "post" && speaker(prevTurn).name === who.name;
      if (grouped) out.push({ kind: "gap", h: 4 });
      else {
        out.push({ kind: "gap", h: 17 });
        out.push({ kind: "head", h: 22, who: turn.who, name: who.name, pic: who.pic, color: who.color, bot: who.bot, thread: who.thread, time, i: body.first });
      }
      out.push(...body.rows);
    });
    // Messages you sent that haven't shown up yet: grayed, as Discord shows a
    // message still sending.
    const found = turns.filter((x) => x.who === "you").map((x) => x.text);
    // A busy agent queues it until its turn ends, so give it ten minutes.
    for (const m of this.sentTo(this.term)) {
      const text = norm(m.text);
      if (Date.now() - m.at > 10 * 60 * 1000 || found.some((x) => sameMessage(x, text))) continue;
      out.push({ kind: "gap", h: 17 });
      out.push({ kind: "head", h: 22, who: "you", name: me, pic: ME.pic, time: clockOf(m.at) });
      const { text: said, pics } = attachments(text);
      if (said) wrapWords(said, per).forEach((c) => out.push({ kind: "text", text: c, h: 22, pending: true }));
      for (const p of pics) out.push({ kind: "image", h: p.h + 8, w: p.w, src: p.thumb, pending: true });
    }
    out.push({ kind: "gap", h: 8 });
    return out;
  }

  // Scrolls so the scrollbar's thumb sits at `top` px.
  scrollTo(top, cx) {
    const { h, max } = this.bar ?? {};
    if (!max) return;
    const span = Math.max(1, this.viewH - h);
    this.offset = Math.round(max * (1 - Math.max(0, Math.min(1, top / span))));
    this.follow = this.offset === 0;
    this.anchor = null;
    cx.notify();
  }

  copy(cx, text, what) {
    cx.write_to_clipboard(text);
    notify({ title: "Copied", body: what, level: "info", timeout: 1500 });
  }

  selectedText() {
    if (!this.sel) return "";
    const [a, b] = this.sel[0] <= this.sel[1] ? this.sel : [this.sel[1], this.sel[0]];
    return this.viewLines().slice(a, b + 1).join("\n");
  }

  lastReply() {
    const t = this.turns().filter((x) => x.who === "agent").pop();
    return t ? t.reply.lines.join("\n").trim() : "";
  }

  key(e, cx) {
    const m = e.modifiers ?? {};
    if (e.key === "escape" && this.sel && !this.query) { this.sel = null; cx.notify(); return; }
    if (e.key === "escape" && (this.searching || this.query)) { this.searching = false; this.query = ""; this.search.set_value(""); this.handle.focus(); cx.notify(); return; }
    if (m.control && !m.shift && e.key === "c" && this.sel) { this.copy(cx, this.selectedText(), "Selected lines"); return; }
    if (m.control && m.shift && e.key === "c") { const t = this.selectedText() || this.lastReply(); this.copy(cx, t, this.sel ? "Selected lines" : "Last reply"); return; }
    if (m.control && e.key === "f") { this.searching = true; this.search.focus(); cx.notify(); return; }
    if (!this.term) return;
    // Typing here goes to the message box, as in Discord (sent to the agent it
    // would wait unseen in its input box); Page Up/Down scroll the chat. Keys
    // that answer a menu (arrows, Enter, Esc, Tab, Ctrl+…) still go to the agent.
    if (!m.control && !m.alt && (e.key.length === 1 || e.key === "space")) {
      cx.stop_propagation();
      setShared("discord.typed", { text: e.key_char ?? (e.key === "space" ? " " : e.key), at: Date.now(), to: this.side ? "stream-compose" : "compose" });
      run("discord-compose.type");
      return;
    }
    if (e.key === "backspace") return;
    if (e.key === "pageup" || e.key === "pagedown") {
      cx.stop_propagation();
      const page = Math.max(1, Math.floor(this.viewH / 22) - 2);
      this.offset = Math.max(0, this.offset + (e.key === "pageup" ? page : -page));
      this.follow = this.offset === 0; this.anchor = null; cx.notify();
      return;
    }
    const names = { escape: "esc", enter: "enter", tab: "tab", up: "up", down: "down", left: "left", right: "right", backspace: "backspace", space: "space", pageup: "pageup", pagedown: "pagedown" };
    let k = names[e.key] ?? (e.key.length === 1 ? e.key : null);
    if (!k) return;
    if (m.alt) k = `alt+${k}`;
    if (m.control) k = `ctrl+${k}`;
    else if (m.shift && names[e.key]) k = `shift+${k}`;
    cx.stop_propagation();
    hc(["keys", this.term, k]);
  }

  rowEl(r, n, mono, sa, sb) {
    if (r.kind === "gap") return div().id(`r-${n}`).h(r.h).flex_none();
    const on = r.i !== undefined && r.i >= sa && r.i <= sb;
    const select = (e, cx) => {
      if (r.open) { r.open(); return; }
      if (r.i === undefined) return;
      if (this.query) {
        const target = r.i; this.query = ""; this.search.set_value(""); this.sel = [target, target];
        const all = this.rows(), idx = all.findIndex((x) => x.i === target);
        this.follow = false; this.anchor = null; this.offset = Math.max(0, all.length - idx - 8); cx.notify(); return;
      }
      if (e.click_count === 2) { this.copy(cx, this.viewLines()[r.i] ?? r.text, "Message"); return; }
    };
    // Selecting: press on a line and drag over others (Shift+press extends);
    // Ctrl+C copies.
    const press = (e, cx) => {
      if (r.open || r.i === undefined || this.query || e.click_count === 2) return;
      this.selecting = true;
      this.sel = e.modifiers?.shift && this.sel ? [this.sel[0], r.i] : [r.i, r.i];
      this.handle.focus(); cx.notify();
    };
    const over = (_e, cx) => {
      if (!this.selecting || r.i === undefined || !this.sel || this.sel[1] === r.i) return;
      this.sel = [this.sel[0], r.i]; cx.notify();
    };
    const row = h_flex().id(`r-${n}`).relative().h(r.h).flex_none().pl(72).pr(16).items_center().on_click(select)
      .on_mouse_down("left", press).on_mouse_move(over)
      .bg(on ? "#5865f21f" : "#00000000").hover((s) => s.bg(on ? "#5865f22e" : "#00000014"));
    if (r.kind === "head") {
      const you = r.who === "you";
      const sub = r.thread ?? null;
      return row.child(h_flex().gap(6).items_center()
          .child(div().text_size(16).font_medium().text_color(r.color ?? (you ? ROLES.owner.color : ROLES.head.color)).child(r.name))
          .when(r.bot ?? !you, (el) => el.child(h_flex().flex_none().gap(2).px(4).h(16).rounded(4).bg(C.blurple).items_center()
            .child(icon("check", 10, "#ffffff")).child(div().text_size(10).font_bold().text_color("#ffffff").child("APP"))))
          // Merged: a sub-agent's message links to its own chat (or screen).
          .when(Boolean(sub), (el) => el.child(h_flex().id(`thr-${n}`).gap(3).px(5).h(17).rounded(3).bg("#ffffff0f").items_center().cursor_pointer()
            .hover((s) => s.bg("#ffffff1f"))
            .on_click((_e, cx) => { cx.stop_propagation(); openSub(sub); })
            .child(icon("thread", 11, C.link)).child(div().text_size(11).text_color(C.link).child("thread"))))
          .when(Boolean(r.time), (el) => el.child(div().text_size(12).text_color(C.muted).child(r.time))))
        .child(div().absolute().left(16).top(2).child(picture(r.pic, 40)));
    }
    if (r.kind === "image") return row.child(image(r.src).w(r.w).h(r.h - 8).rounded(8).opacity(r.pending ? 0.5 : 1));
    if (r.kind === "code") return row.child(h_flex().w_full().h_full().px(8).items_center().bg(C.panel).border_l(1).border_r(1).border_color(C.input)
      .child(div().font_family(mono).text_size(FONT).whitespace_nowrap().text_color(C.text).child(r.text || " ")));
    const s = r.s ?? {};
    return row.child(div().text_size(15.5).whitespace_nowrap()
      .text_color(r.pending ? C.dim : s.color && s.color !== "#0040dd" ? discordColor(s.color) : C.text)
      .when(Boolean(s.bold), (x) => x.font_semibold()).when(Boolean(s.italic), (x) => x.italic())
      .child(r.text || " "));
  }

  // Herdr redraws this view when tabs, focus or terminals change, so a switch
  // or a finished turn is noticed here at once and read right away, not on
  // the next one-second tick.
  render(cx) {
    const t0 = Date.now(), t = this.target();
    const x = t.term ? terminals().find((y) => y.address === t.term) : null;
    const sig = `${t.term}|${x?.turn ?? ""}|${x?.status ?? t.status ?? ""}`;
    if (t.term !== this.term) this.switchTo(t);
    if (sig !== this.shownSig) {
      this.shownSig = sig;
      try { cx.timer.after(0, (cx) => this.tick(cx)); } catch (_e) { /* the next tick reads it */ }
    }
    const el = this.draw(cx, t);
    this.mark("render", Date.now() - t0);
    return el;
  }

  draw(cx, t) {
    const mono = settings().font_family ?? "Cascadia Mono NF";
    const rows = this.rows();
    const [sa, sb] = this.sel ? (this.sel[0] <= this.sel[1] ? this.sel : [this.sel[1], this.sel[0]]) : [-1, -2];
    const spin = [...this.lines].reverse().slice(0, 6).find((l) => SPIN.test(l));
    const busy = t.status === "working" || Boolean(spin) || this.footer.some((l) => /esc to interrupt/i.test(l)) || Boolean(peek(t.term).typing);
    // Who's typing: the agent, and (merged) its sub-agents, as Discord words it.
    const typers = [...(busy ? [t.label] : []),
      ...(this.mergeOn(t) ? Object.values(this.subs).map((s) => s.m).filter((m) => m.agent && typing(m)).map((m) => m.name) : [])];
    const typingText = typers.length > 2 ? "Several kittens are typing…"
      : typers.length === 2 ? `${typers[0]} and ${typers[1]} are typing…` : `${typers[0]} is typing…`;
    if (this.follow) this.offset = 0;
    // Scrolled back: keep the same row at the bottom while output arrives (the
    // transcript grows, or slides once it's longer than one read).
    else if (this.anchor && rows !== this.anchor.rows) {
      const want = this.anchor.at + rows.length - this.anchor.rows.length;
      let best = -1;
      for (let k = 0; k < rows.length; k++) if (rowKey(rows[k]) === this.anchor.key && (best < 0 || Math.abs(k - want) < Math.abs(best - want))) best = k;
      if (best >= 0) this.offset = rows.length - 1 - best;
    }
    // Up to where the first page fills the view, so the top never floats.
    let topEnd = 0;
    for (let fill = 0; topEnd < rows.length && fill < this.viewH; topEnd++) fill += rows[topEnd].h;
    const maxOff = Math.max(0, rows.length - topEnd);
    this.maxOff = maxOff;
    this.offset = Math.max(0, Math.min(this.offset, maxOff));
    const end = rows.length - this.offset;
    let from = end, used = 0;
    while (from > 0 && used + rows[from - 1].h <= this.viewH) { from--; used += rows[from].h; }
    const shown = rows.slice(from, end);
    this.anchor = end > 0 ? { rows, at: end - 1, key: rowKey(rows[end - 1]) } : null;
    const thumbH = rows.length > shown.length ? Math.max(24, this.viewH * shown.length / rows.length) : 0;
    const thumbTop = (this.viewH - thumbH) * (1 - Math.min(1, this.offset / Math.max(1, maxOff)));
    this.bar = { top: thumbTop, h: thumbH, max: maxOff };
    const tbtn = (id, label, action) => div().id(id).px(8).h(24).flex().items_center().rounded(4).text_size(12.5).text_color(C.muted)
      .cursor_pointer().hover((s) => s.bg(C.hover).text_color(C.text)).on_click(action).child(label);
    return v_flex().id("root").relative().size_full().bg(C.chat).track_focus(this.handle).on_key_down((e, cx) => this.key(e, cx))
      .on_size_change((size, cx) => { if (Math.abs(size.width - this.width) > 4) { this.width = size.width; cx.notify(); } })
      .child(div().absolute().top(0).left(0).opacity(0).child(div().flex_none().font_family(mono).text_size(FONT).whitespace_nowrap()
        .on_size_change((size, cx) => { const w = size.width / 100; if (w > 3 && Math.abs(w - this.charW) > 0.05) { this.charW = w; cx.notify(); } })
        .child("0123456789".repeat(10))))
      .child(div().absolute().top(0).left(0).opacity(0).child(div().flex_none().text_size(15.5).whitespace_nowrap()
        .on_size_change((size, cx) => { const w = size.width / SAMPLE.length * 1.04; if (w > 3 && Math.abs(w - this.youCharW) > 0.05) { this.youCharW = w; cx.notify(); } })
        .child(SAMPLE)))
      .when(this.searching || Boolean(this.query), (el) => el.child(h_flex().h(40).px(16).gap(8).items_center().border_b(1).border_color(C.border)
        .child(div().text_size(12).font_semibold().text_color(C.muted).child("SEARCH"))
        .child(div().flex_1().h(28).px(8).rounded(4).bg(C.rail).flex().items_center()
          .child(Input.new(this.search).w_full().h(24).text_size(14).text_color(C.text)))
        .child(div().text_size(12).text_color(C.dim).child("Esc to close"))))
      .child(div().id("thread").relative().flex_1().min_h(0).w_full()
        .on_size_change((size, cx) => { if (Math.abs(size.height - this.viewH) > 2) { this.viewH = size.height; cx.notify(); } })
        // Dragging the scrollbar: followed anywhere over the chat (moves only
        // arrive while the pointer is over it), and let go on release or on leaving.
        // Selecting by dragging past the top or bottom edge scrolls.
        .on_mouse_move((e, cx) => {
          if (this.drag) this.scrollTo(this.drag.top + e.position.y - this.drag.y, cx);
          else if (this.selecting && e.local_position) {
            const y = e.local_position.y, step = y < 24 ? 1 : y > this.viewH - 24 ? -1 : 0;
            if (step) { this.offset = Math.max(0, this.offset + step); this.follow = this.offset === 0; this.anchor = null; cx.notify(); }
          }
        })
        .on_mouse_up("left", (_e, cx) => { this.selecting = false; if (this.drag) { this.drag = null; cx.notify(); } })
        .on_hover((hovered, cx) => { if (!hovered) { this.selecting = false; if (this.drag) { this.drag = null; cx.notify(); } } })
        .on_scroll_wheel((e, cx) => {
          // A wheel reports lines; a touchpad, small pixel steps that add up.
          let step;
          if (e.delta_lines?.y) step = Math.round(e.delta_lines.y) || Math.sign(e.delta_lines.y);
          else { this.wheel = (this.wheel ?? 0) + e.delta.y / ROW; step = Math.trunc(this.wheel); this.wheel -= step; }
          if (!step) return;
          this.offset = Math.max(0, this.offset + step);
          this.follow = this.offset === 0;
          this.anchor = null; // the wheel moved it, not new output
          if (step > 0 && this.offset >= this.maxOff && Date.now() - (this.stitchAt ?? 0) > 10000) { this.stitchAt = Date.now(); this.stitch[this.term] = true; }
          cx.notify();
        })
        .child(this.term
          ? v_flex().absolute().top(0).bottom(0).left(0).right(0).justify_end().overflow_hidden()
              .children(shown.map((r, k) => this.rowEl(r, from + k, mono, sa, sb)))
          : div().p(20).text_size(15).text_color(C.muted).child("No terminal in this channel."))
        // The scrollbar: drag the thumb, or press the track to jump there.
        .when(thumbH > 0, (el) => el.child(div().id("track").absolute().top(0).bottom(0).right(0).w(14).cursor_pointer()
          .on_mouse_down("left", (e, cx) => {
            cx.stop_propagation();
            const y = e.local_position?.y;
            const top = y !== undefined && (y < thumbTop || y > thumbTop + thumbH) ? y - thumbH / 2 : thumbTop;
            this.drag = { y: e.position.y, top };
            this.scrollTo(top, cx);
          })
          // Discord's: a dark thumb on a lighter rounded track.
          .child(div().absolute().right(3).top(2).bottom(2).w(8).rounded(4).bg(C.panel))
          .child(div().id("thumb").absolute().right(3).top(thumbTop).w(8).h(thumbH).rounded(4)
            .bg(this.drag ? "#ffffff40" : "#00000080").hover((x) => x.bg("#ffffff40")))))
        .when(!this.follow, (el) => el.child(h_flex().absolute().bottom(0).left(16).right(16).h(28).px(12).rounded_t(8).bg(C.blurple)
          .items_center().text_size(13).text_color("#ffffff").cursor_pointer()
          .on_click((_e, cx) => { this.follow = true; this.offset = 0; cx.notify(); })
          .child(div().flex_1().child("You're viewing older messages")).child(div().font_semibold().child("Jump To Present")))))
      .child(h_flex().h(24).px(16).gap(6).items_center()
        // Mid-turn: a spinner, "esc to interrupt" in the footer, or the shared peek.
        // Not the status alone: Claude Code started from a shell says idle while it works.
        .when(typers.length > 0, (el) => el
          .child(dots(6, C.text))
          .child(div().text_size(12.5).font_semibold().text_color(C.text).child(typingText))
          .when(busy && Boolean(spin), (x) => x.child(div().truncate().max_w(360).text_size(12).text_color(C.dim).child(spin?.trim() ?? ""))))
        .child(div().flex_1())
        .child(div().truncate().max_w(560).text_size(11.5).text_color(C.dim).child(this.footer.map((l) => l.trim()).filter(Boolean).join("  ·  ")))
        .child(this.sel
          ? tbtn("copy-sel", "Copy selection", (_e, cx) => this.copy(cx, this.selectedText(), "Selected lines"))
          : tbtn("copy-reply", "Copy last reply", (_e, cx) => this.copy(cx, this.lastReply(), "Last reply")))
        .child(tbtn("copy-all", "Copy all", (_e, cx) => this.copy(cx, this.viewLines().join("\n"), "Whole transcript"))));
  }
}

// What a row shows, to find it again after the rows are rebuilt.
const rowKey = (r) => `${r.kind}|${r.text ?? r.name ?? ""}`;

// iMessage-tuned colors, mapped onto Discord's dark palette.
function discordColor(c) {
  return { "#6c6c70": "#949ba4", "#248a3d": "#57f287", "#d70015": "#f23f43", "#a05a00": "#f0b232", "#8e8e93": "#949ba4" }[c] ?? c;
}
