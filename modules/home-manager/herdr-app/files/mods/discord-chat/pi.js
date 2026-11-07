// pi keeps each conversation as JSONL in ~/.pi/agent/sessions/<its folder>/:
// your messages, its replies and their times, exactly. Its screen can't tell
// your words from its thinking (both are plain indented text), so a pi channel
// reads the session file instead, once it can tell which file is the terminal's.
import { hc, exec } from "herdr";

const machineOf = (term) => term.includes("/") ? term.slice(0, term.lastIndexOf("/")) : null;

// pi names a session folder after the folder it started in: /home/me/kas -> --home-me-kas--.
const folderOf = (cwd) => `--${cwd.replace(/^\/+|\/+$/g, "").replace(/\//g, "-")}--`;

// Text compared without spacing or markdown, as the screen shows it rendered and wrapped.
const bare = (s) => s.replace(/[\s*_`#>|│┃─━┌┐└┘├┤┬┴┼•●\-]/g, "");

// A session's entries after line k, numbered. Tool results can be big and only
// link the conversation, so they come as their id and parent alone.
const READ = `awk -v k="$2" 'NR > k {
  if ($0 ~ /^\\{"type":"message"[^{]*"message":\\{"role":"toolResult"/) {
    i = ""; p = "";
    if (match($0, /"id":"[^"]*"/)) i = substr($0, RSTART, RLENGTH);
    if (match($0, /"parentId":"[^"]*"/)) p = substr($0, RSTART, RLENGTH);
    print NR "\\tSTUB " i " " p
  } else print NR "\\t" $0
}' "$HOME/.pi/agent/sessions/$1"`;

// The last lines of a session, for telling which file is a terminal's.
const TAIL = `tail -n 60 "$HOME/.pi/agent/sessions/$1"`;
const LIST = `cd "$HOME/.pi/agent/sessions/$1" 2>/dev/null && ls -t -- *.jsonl 2>/dev/null | head -n 8`;

const run = async (script, args, on) => {
  const r = await exec("sh", ["-c", script, "sh", ...args], { on });
  if (r.code !== 0) throw new Error(r.stderr || `exit ${r.code}`);
  return r.stdout;
};

function textOf(m) {
  const parts = Array.isArray(m.content) ? m.content : [{ type: "text", text: String(m.content ?? "") }];
  return parts.filter((c) => c?.type === "text").map((c) => c.text ?? "").join("\n").trim();
}
const usesTools = (m) => Array.isArray(m.content) && m.content.some((c) => c?.type === "toolCall");

// Adds numbered lines to the session's entries. A line pi is still writing
// doesn't parse yet: stop there and read it again next time.
function take(s, stdout) {
  let added = false;
  for (const raw of stdout.split("\n")) {
    const tab = raw.indexOf("\t");
    if (tab < 0) continue;
    const n = Number(raw.slice(0, tab)), body = raw.slice(tab + 1);
    let e;
    if (body.startsWith("STUB")) e = { id: body.match(/"id":"([^"]*)"/)?.[1], parentId: body.match(/"parentId":"([^"]*)"/)?.[1] ?? null };
    else { try { e = JSON.parse(body); } catch (_e) { break; } }
    s.line = n;
    if (!e?.id) continue;
    s.byId.set(e.id, e);
    s.leaf = e.id;
    added = true;
  }
  return added;
}

// The conversation as it stands: from the newest entry back to the start (a
// session branches when you go back and change something; only this branch counts).
function chain(s) {
  const out = [], seen = new Set();
  for (let e = s.byId.get(s.leaf); e && !seen.has(e.id); e = e.parentId ? s.byId.get(e.parentId) : null) {
    seen.add(e.id);
    out.push(e);
  }
  return out.reverse();
}

// Your messages and, for each, the reply that ended the turn: the agent's last
// text, not its thinking, commands or the notes between them. A turn still
// going has no reply yet (the typing indicator covers it).
export function conversation(s) {
  const out = [];
  let turn = null;
  const close = (ended) => {
    if (!turn?.length) return;
    const last = turn[turn.length - 1];
    if (last.stop === "stop" || (ended && last.stop !== "toolUse")) {
      if (last.text) out.push({ who: "agent", text: last.text, at: last.at });
    } else if (ended) {
      // Cut off (you interrupted, or it failed): what it said last, if anything.
      const said = [...turn].reverse().find((x) => x.text);
      if (said) out.push({ who: "agent", text: said.text, at: said.at, cut: true });
    }
    if (last.stop === "error" && last.error) out.push({ who: "agent", text: `⚠ ${last.error}`, at: last.at, cut: true });
    turn = null;
  };
  for (const e of chain(s)) {
    const m = e.message;
    if (!m) continue;
    const at = Date.parse(e.timestamp) || null;
    if (m.role === "user") { close(true); out.push({ who: "you", text: textOf(m), at }); turn = []; }
    else if (m.role === "assistant") (turn ??= []).push({ text: textOf(m), at, stop: m.stopReason ?? (usesTools(m) ? "toolUse" : "stop"), error: m.errorMessage });
  }
  close(false);
  return out;
}

// Which session file is this terminal's: in the folder pi started in, the
// newest one whose last words are on the terminal's screen (or in its history).
// The terminal's text is `seen` (read here when empty). Null when it isn't pi,
// or no file matches yet.
export async function locate(term, seen) {
  const info = JSON.parse((await hc(["get", term])).stdout);
  const fg = info.foreground;
  if (fg?.name !== "pi" || !fg.cwd) return null;
  // Nothing read from it yet: read its screen and history here.
  if (!seen) seen = String(JSON.parse((await hc(["read", term, "--json", "--lines", "1500"])).stdout).text ?? "");
  const on = machineOf(term), folder = folderOf(fg.cwd);
  const files = (await run(LIST, [folder], on)).split("\n").map((x) => x.trim()).filter(Boolean);
  const screen = bare(seen);
  for (const f of files) {
    const s = { byId: new Map(), leaf: null, line: 0 };
    let tail;
    try { tail = await run(TAIL, [`${folder}/${f}`], on); } catch (_e) { continue; }
    take(s, tail.split("\n").map((l, k) => `${k + 1}\t${l}`).join("\n"));
    const words = [...s.byId.values()].filter((e) => e.message && (e.message.role === "assistant" || e.message.role === "user"))
      .map((e) => textOf(e.message)).filter((x) => bare(x).length >= 24).slice(-3);
    // A few stretches of what it said last, so wrapping and markdown don't matter.
    const hit = words.some((w) => {
      const b = bare(w);
      return [0.2, 0.5, 0.8].some((at) => { const k = Math.floor((b.length - 24) * at); return screen.includes(b.slice(k, k + 24)); });
    });
    if (hit) return { term, on, file: `${folder}/${f}`, pid: fg.pid };
  }
  return null;
}

// A located session, read so far.
export const open = (found) => ({ ...found, byId: new Map(), leaf: null, line: 0 });

// Reads what pi added since last time. True when the conversation changed.
export async function update(s) {
  return take(s, await run(READ, [s.file, String(s.line)], s.on));
}

// Still that terminal's pi? (It can quit, or another program can take over.)
export async function stillThere(s) {
  const info = JSON.parse((await hc(["get", s.term])).stdout);
  return info.foreground?.name === "pi" && info.foreground?.pid === s.pid;
}
