// The Discord chat: the agent's transcript as messages. Your prompts and the
// agent's final replies (not its commands or thinking; those stay in Live)
// under avatars and names, with Claude's "done 3:47 PM" as the reply's time.
// Everything from the iMessage output view still works here: keys pass to the
// agent, click/Shift+click selects, double-click copies, Ctrl+Shift+C copies,
// Ctrl+F searches, and questions switch to the live terminal by themselves.
import { View, div } from "gpui-kit";
import { h_flex, v_flex, InputState, Input } from "gpui-base";
import { hc, run, spaces, panes, focused, layout, notify, settings, nextCommand, shared, setShared } from "herdr";
import { C, icon, avatar, picture, dots, peek, ME, ROLES, kittenName, kittenPic } from "./kit.js";

const ROW = 20, CHAR = 7.85, FONT = 13, YOU_CHAR = 8.1, YOU_ROW = 21;
const SAMPLE = "the quick brown fox jumps over the lazy dog, then checks whether the build passed or failed. ";
const DONE = /^\s*✻\s.*\bdone\s+(\d{1,2}:\d{2}\s?[AP]M)/;
const CLAUDE_YOU = /^\s*❯\s(\S.*)$/;
const norm = (x) => x.replace(/\s+/g, " ").trim();
const RULE = /^\s*[─━═]{20,}\s*$/;
const SPIN = /^\s*[✻✽✶✳✢·*⏺◐◑◒◓]\s+\S.*(…|\.\.\.)/;
const ASK = /(Do you want to|Would you like to|\(y\/n\)|\[y\/N\]|\[Y\/n\]|Press Enter to|❯\s*\d+\.\s|^\s*\d+\.\s.*\(recommended\))/i;

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
const PI_TOOL = /^\s?(\$\s|Took \d|edit\s+[~\/]|read\s+[~\/]|write\s+[~\/])/;
const PI_OUT = /^\s{2,}\d+\s|^\s+\.\.\.\s*$|\(\d+ earlier lines/;
const THINK = /^\s*(∴|✻|✽|✶|✳|✢|·)\s|^\s*⎿\s+Tip:/;
export function finalReply(lines, idx) {
  const claude = lines.some((l) => PROSE_STEP.test(l) || TOOL_STEP.test(l));
  let start = 0;
  if (claude) {
    let lastTool = -1;
    lines.forEach((l, k) => { if (TOOL_STEP.test(l)) lastTool = k; });
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
    out.push(lines[k]); ids.push(idx[k]);
  }
  while (out.length && !out[0].trim()) { out.shift(); ids.shift(); }
  while (out.length && !out[out.length - 1].trim()) { out.pop(); ids.pop(); }
  return { lines: out, idx: ids };
}

// The terminal wrapped prose at its own width; join those pieces back into
// paragraphs (a line that reached the terminal's width continues on the next).
function reflow(lines) {
  const width = Math.max(...lines.map((x) => x.l.replace(/\s+$/, "").length), 0);
  const out = [];
  for (const x of lines) {
    const prev = out[out.length - 1], text = x.l.replace(/\s+$/, "");
    const starts = !text.trim() || /^\s*([●•⏺]|[-*]\s|\d+\.\s|#)/.test(text);
    if (prev && prev.l.trim() && !starts && prev.full) {
      prev.l = `${prev.l} ${text.trim()}`;
      prev.full = text.length >= width - 12;
    } else out.push({ l: text, i: x.i, full: text.length >= width - 12 });
  }
  return out;
}

// Word-wrap a line to `per` characters, keeping its indent on every row.
function wrapWords(line, per) {
  const indent = line.match(/^\s*([●•⏺]\s|[-*]\s|\d+\.\s)?/)[0].replace(/\S/g, " ");
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
    this.term = null;
    this.lines = [];        // logical lines of the transcript body
    this.draft = [];
    this.footer = [];
    this.follow = true;
    this.history = {};      // terminal -> false once a read wasn't plain history
    this.sel = null;        // [start, end] logical lines
    this.width = 800;
    this.auto = false;      // switched to Live by itself
    this.asking = false;
    this.offset = 0;        // rows scrolled up from the bottom
    this.viewH = 400;
    this.charW = CHAR;      // measured from a hidden sample once drawn
    this.youCharW = YOU_CHAR;
    this.handle = cx.focus_handle();
    this.search = InputState.new({ value: "", placeholder: "Search transcript" });
    this.query = "";
    this.search.on("change", (_e, cx) => { this.query = this.search.value(); cx.notify(); });
    this.search.on("submit", () => { this.handle.focus(); });
    cx.timer.every(1000, (cx) => this.tick(cx));
    this.tick(cx);
    cx.spawn(async (cx) => { for (;;) { const c = await nextCommand(); if (c === "focus") this.handle.focus(); } });
  }

  target() {
    const space = spaces().find((s) => s.active), tab = space?.tabs.find((t) => t.active);
    const ps = panes().filter((p) => p.tab === tab?.id && p.terminal);
    const f = focused()?.terminal;
    const pick = ps.find((p) => p.terminal === f) ?? ps.find((p) => p.program?.agent) ?? ps[0];
    return { term: pick?.terminal ?? null, status: pick?.status ?? tab?.status ?? null, name: pick?.program?.name ?? "Agent", program: pick?.program ?? null };
  }

  shown() { return (find(layout(), "convo-stack")?.active ?? "output") === "output"; }

  tick(cx) {
    const t = this.target();
    if (t.term !== this.term) { this.term = t.term; this.lines = []; this.sel = null; this.follow = true; }
    const needs = t.status === "blocked" || this.asking;
    // Questions and menus need the live terminal: go there, and come back after.
    if (needs && this.shown()) { this.auto = true; run("layout.select", { stack: "convo-stack", child: "live" }); }
    else if (!needs && this.auto && !this.shown()) { this.auto = false; run("layout.select", { stack: "convo-stack", child: "output" }); }
    if (!this.term || this.busy) return;
    if (!this.shown() && !this.auto) return;
    this.busy = true;
    const term = this.term, deep = this.history[term] !== false;
    cx.spawn(async (cx) => {
      try {
        const r = await hc(["read", term, "--json", "--lines", deep ? "1500" : "0"]);
        const d = JSON.parse(r.stdout);
        if (d.how && d.how !== "history" && d.how !== "screen") this.history[term] = false;
        const parts = splitPrompt(String(d.text ?? "").split("\n"));
        // An agent asking a question replaces its input box with the menu, so a
        // question on screen only counts when the normal box is gone.
        this.asking = !parts.box && ASK.test(parts.body.slice(-10).join("\n"));
        let body = parts.body;
        if (d.complete === false && this.lines.length) {
          // A busy agent returns only its screen: keep the history we have and
          // replace the overlapping tail.
          const first = body.find((l) => l.trim());
          const at = first ? this.lines.lastIndexOf(first) : -1;
          body = at >= 0 ? [...this.lines.slice(0, at), ...body.slice(body.indexOf(first))] : [...this.lines, ...body];
        }
        const changed = body.length !== this.lines.length || body[body.length - 1] !== this.lines[this.lines.length - 1]
          || parts.draft.join() !== this.draft.join() || parts.footer.join() !== this.footer.join();
        this.lines = body; this.draft = parts.draft; this.footer = parts.footer;
        if (changed) cx.notify();
      } catch (_e) { /* the terminal went away or is restarting */ }
      this.busy = false;
    });
  }

  // The transcript as a conversation: your prompts (Claude's "❯ " lines, or
  // text matching what you sent from the iMessage box) and the agent's replies
  // between them, plus Claude's "done 3:47 PM" lines as timestamps.
  turns() {
    const sent = ((shared("imsg.sent") ?? {})[this.term] ?? []).map((m) => norm(m.text)).filter((x) => x.length >= 4);
    const out = [];
    let agent = null;
    const push = (t) => { out.push(t); agent = null; };
    const L = this.lines;
    for (let i = 0; i < L.length; i++) {
      const line = L[i];
      const claude = line.match(CLAUDE_YOU);
      const flat = norm(line);
      const mine = !claude && flat.length >= 4 && sent.find((m) => m.startsWith(flat.slice(0, Math.min(flat.length, 40))) && flat.length >= Math.min(12, m.length));
      if (claude || mine) {
        const parts = [claude ? claude[1] : flat], idx = [i];
        // Wrapped continuation lines until a blank line or the agent's next mark.
        while (i + 1 < L.length && L[i + 1].trim() && !/^\s*[●•⏺⎿✻]/.test(L[i + 1]) && (claude ? /^\s{2}/.test(L[i + 1]) : true)) {
          i++; parts.push(norm(L[i])); idx.push(i);
          if (!claude && norm(parts.join(" ")).length >= (mine?.length ?? 0)) break;
        }
        push({ who: "you", text: norm(parts.join(" ")), idx });
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
    const shownYou = out.filter((t) => t.who === "you").map((t) => t.text);
    const mins = (txt) => { const m = txt.match(/(\d{1,2}):(\d{2})\s?([AP])M/); return m ? (Number(m[1]) % 12 + (m[3] === "P" ? 12 : 0)) * 60 + Number(m[2]) : null; };
    for (const m of ((shared("imsg.sent") ?? {})[this.term] ?? [])) {
      const text = norm(m.text);
      if (shownYou.some((x) => x.startsWith(text.slice(0, 40)) || text.startsWith(x.slice(0, 40)))) continue;
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

  // Discord rows: a header (avatar, name, BOT tag, time) and the message's lines.
  rows() {
    const q = this.query.trim().toLowerCase();
    const textW = Math.max(240, this.width - 72 - 24);
    const per = Math.max(20, Math.floor(textW / this.youCharW)), perMono = Math.max(20, Math.floor((textW - 24) / this.charW));
    const t = this.target(), me = ME.name;
    const turns = this.turns();
    const out = [];
    const sentAt = new Map(((shared("imsg.sent") ?? {})[this.term] ?? []).map((m) => [norm(m.text).slice(0, 40), m.at]));
    const clockOf = (ms) => { const d = new Date(ms), h = d.getHours() % 12 || 12; return `Today at ${h}:${String(d.getMinutes()).padStart(2, "0")} ${d.getHours() < 12 ? "AM" : "PM"}`; };
    const code = (l) => /^\s{4,}\S/.test(l) || /^\s*\$\s/.test(l) || /[─│┌└├]/.test(l);
    turns.forEach((turn, k) => {
      if (turn.who === "time") return;
      const lines = turn.who === "you" ? [{ l: turn.text, i: turn.idx[0] }]
        : reflow(turn.reply.lines.map((l, j) => ({ l, i: turn.reply.idx[j] })));
      const hits = lines.filter((x) => !q || x.l.toLowerCase().includes(q));
      if (!hits.length) return;
      const next = turns[k + 1];
      const time = turn.who === "agent" ? (next?.who === "time" ? next.text.replace("Today", "Today at") : "")
        : sentAt.has(turn.text.slice(0, 40)) ? clockOf(sentAt.get(turn.text.slice(0, 40))) : "";
      // Same author as the message just before, with no timestamp between: Discord
      // continues the group without repeating the avatar and name.
      const prevTurn = turns.slice(0, k).reverse().find((x) => x.who !== "agent" || x.reply.lines.length);
      const grouped = prevTurn && prevTurn.who === turn.who && turn.who === "you";
      if (grouped) out.push({ kind: "gap", h: 4 });
      else {
        out.push({ kind: "gap", h: 17 });
        out.push({ kind: "head", h: 22, who: turn.who, name: turn.who === "you" ? me : kittenName(t.program), pic: turn.who === "you" ? ME.pic : kittenPic(t.program, t.name), time, i: hits[0].i });
      }
      for (const { l, i } of hits) {
        if (!l.trim()) { out.push({ kind: "text", text: "", h: 10, i }); continue; }
        if (turn.who === "agent" && code(l)) wrapWords(l, perMono).forEach((c) => out.push({ kind: "code", text: c, h: 20, i }));
        else wrapWords(l.replace(/^\s*[●⏺]\s?/, ""), per).forEach((c, j) => out.push({ kind: "text", text: c, h: 22, i, s: turn.who === "agent" ? style(l) : {}, first: j === 0 }));
      }
    });
    // Messages you sent that haven't shown up yet: grayed, as Discord shows a
    // message still sending.
    const found = turns.filter((x) => x.who === "you").map((x) => x.text);
    for (const m of ((shared("imsg.sent") ?? {})[this.term] ?? [])) {
      const text = norm(m.text);
      if (Date.now() - m.at > 3 * 60 * 1000 || found.some((x) => x.startsWith(text.slice(0, 40)) || text.startsWith(x.slice(0, 40)))) continue;
      out.push({ kind: "gap", h: 17 });
      out.push({ kind: "head", h: 22, who: "you", name: me, pic: ME.pic, time: clockOf(m.at) });
      wrapWords(text, per).forEach((c) => out.push({ kind: "text", text: c, h: 22, pending: true }));
    }
    out.push({ kind: "gap", h: 8 });
    return out;
  }

  copy(cx, text, what) {
    cx.write_to_clipboard(text);
    notify({ title: "Copied", body: what, level: "info", timeout: 1500 });
  }

  selectedText() {
    if (!this.sel) return "";
    const [a, b] = this.sel[0] <= this.sel[1] ? this.sel : [this.sel[1], this.sel[0]];
    return this.lines.slice(a, b + 1).join("\n");
  }

  lastReply() {
    const t = this.turns().filter((x) => x.who === "agent").pop();
    return t ? t.reply.lines.join("\n").trim() : "";
  }

  key(e, cx) {
    const m = e.modifiers ?? {};
    if (e.key === "escape" && (this.searching || this.query)) { this.searching = false; this.query = ""; this.search.set_value(""); this.handle.focus(); cx.notify(); return; }
    if (m.control && m.shift && e.key === "c") { const t = this.selectedText() || this.lastReply(); this.copy(cx, t, this.sel ? "Selected lines" : "Last reply"); return; }
    if (m.control && e.key === "f") { this.searching = true; this.search.focus(); cx.notify(); return; }
    if (!this.term) return;
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
      if (this.query) {
        const target = r.i; this.query = ""; this.search.set_value(""); this.sel = [target, target];
        const all = this.rows(), idx = all.findIndex((x) => x.i === target);
        this.follow = false; this.offset = Math.max(0, all.length - idx - 8); cx.notify(); return;
      }
      if (e.click_count === 2) { this.copy(cx, this.lines[r.i] ?? r.text, "Message"); return; }
      this.sel = e.modifiers?.shift && this.sel ? [this.sel[0], r.i] : [r.i, r.i];
      this.handle.focus(); cx.notify();
    };
    const row = h_flex().id(`r-${n}`).relative().h(r.h).flex_none().pl(72).pr(16).items_center().on_click(select)
      .bg(on ? "#5865f21f" : "#00000000").hover((s) => s.bg(on ? "#5865f22e" : "#00000014"));
    if (r.kind === "head") {
      const you = r.who === "you";
      return row.child(h_flex().gap(6).items_center()
          .child(div().text_size(16).font_medium().text_color(you ? ROLES.owner.color : ROLES.head.color).child(r.name))
          .when(!you, (el) => el.child(div().px(4).h(15).rounded(3).bg(C.blurple).flex().items_center().text_size(10).font_bold().text_color("#ffffff").child("✓ BOT")))
          .when(Boolean(r.time), (el) => el.child(div().text_size(12).text_color(C.muted).child(r.time))))
        .child(div().absolute().left(16).top(2).child(picture(r.pic, 40)));
    }
    if (r.kind === "code") return row.child(h_flex().w_full().h_full().px(8).items_center().bg("#2b2d31").border_l(1).border_r(1).border_color("#1e1f22")
      .child(div().font_family(mono).text_size(FONT).whitespace_nowrap().text_color(C.text).child(r.text || " ")));
    const s = r.s ?? {};
    return row.child(div().text_size(15.5).whitespace_nowrap()
      .text_color(r.pending ? C.dim : s.color && s.color !== "#0040dd" ? discordColor(s.color) : C.text)
      .when(Boolean(s.bold), (x) => x.font_semibold()).when(Boolean(s.italic), (x) => x.italic())
      .child(r.text || " "));
  }

  render(cx) {
    const t = this.target();
    const mono = settings().font_family ?? "Cascadia Mono NF";
    const rows = this.rows();
    const [sa, sb] = this.sel ? (this.sel[0] <= this.sel[1] ? this.sel : [this.sel[1], this.sel[0]]) : [-1, -2];
    const spin = [...this.lines].reverse().slice(0, 6).find((l) => SPIN.test(l));
    const busy = t.status === "working" || Boolean(spin) || this.footer.some((l) => /esc to interrupt/i.test(l)) || Boolean(peek(t.term).typing);
    if (this.follow) this.offset = 0;
    this.offset = Math.max(0, Math.min(this.offset, Math.max(0, rows.length - 1)));
    const end = rows.length - this.offset;
    let from = end, used = 0;
    while (from > 0 && used + rows[from - 1].h <= this.viewH) { from--; used += rows[from].h; }
    const shown = rows.slice(from, end);
    const maxOff = Math.max(1, rows.length - (end - from));
    const thumbH = rows.length > shown.length ? Math.max(24, this.viewH * shown.length / rows.length) : 0;
    const thumbTop = (this.viewH - thumbH) * (1 - Math.min(1, this.offset / maxOff));
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
        .on_scroll_wheel((e, cx) => {
          const step = Math.round(e.delta.y / ROW) || Math.sign(e.delta.y);
          if (!step) return;
          this.offset = Math.max(0, this.offset + step);
          this.follow = this.offset === 0;
          cx.notify();
        })
        .child(this.term
          ? v_flex().absolute().top(0).bottom(0).left(0).right(0).justify_end().overflow_hidden()
              .children(shown.map((r, k) => this.rowEl(r, from + k, mono, sa, sb)))
          : div().p(20).text_size(15).text_color(C.muted).child("No terminal in this channel."))
        .when(thumbH > 0, (el) => el.child(div().absolute().right(3).top(thumbTop).w(8).h(thumbH).rounded(4).bg("#1a1b1e")))
        .when(!this.follow, (el) => el.child(h_flex().absolute().bottom(0).left(16).right(16).h(28).px(12).rounded_t(8).bg(C.blurple)
          .items_center().text_size(13).text_color("#ffffff").cursor_pointer()
          .on_click((_e, cx) => { this.follow = true; this.offset = 0; cx.notify(); })
          .child(div().flex_1().child("You're viewing older messages")).child(div().font_semibold().child("Jump To Present")))))
      .child(h_flex().h(24).px(16).gap(6).items_center()
        // Mid-turn: a spinner, "esc to interrupt" in the footer, or the shared peek.
        // Not the status alone: Claude Code started from a shell says idle while it works.
        .when(busy, (el) => el
          .child(dots(6, C.text))
          .child(div().text_size(12.5).text_color(C.text).child(h_flex().gap(4).child(div().font_bold().child(kittenName(t.program))).child(div().child("is typing…"))))
          .when(Boolean(spin), (x) => x.child(div().truncate().max_w(360).text_size(12).text_color(C.dim).child(spin?.trim() ?? ""))))
        .child(div().flex_1())
        .child(div().truncate().max_w(560).text_size(11.5).text_color(C.dim).child(this.footer.map((l) => l.trim()).filter(Boolean).join("  ·  ")))
        .child(tbtn("copy-reply", "Copy last reply", (_e, cx) => this.copy(cx, this.lastReply(), "Last reply")))
        .child(tbtn("copy-all", "Copy all", (_e, cx) => this.copy(cx, this.lines.join("\n"), "Whole transcript"))));
  }
}

// iMessage-tuned colors, mapped onto Discord's dark palette.
function discordColor(c) {
  return { "#6c6c70": "#949ba4", "#248a3d": "#57f287", "#d70015": "#f23f43", "#a05a00": "#f0b232", "#8e8e93": "#949ba4" }[c] ?? c;
}
