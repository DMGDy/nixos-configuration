// Claude Code keeps each conversation as JSONL in ~/.claude/projects/<folder>/<session>.jsonl,
// and says which session a process has in ~/.claude/sessions/<pid>.json. Its
// screen only gives history by being scrolled, and not while it works, so a
// Claude channel reads the session file: every message, at any time, with times.
import { hc, exec } from "herdr";

const machineOf = (term) => term.includes("/") ? term.slice(0, term.lastIndexOf("/")) : null;

// A session's entries after line k, numbered. Tool calls, their results,
// thinking and the app's own notes are big and only link the conversation, so
// they come as a stub: whether it was a tool call, its uuid and its parent's.
// Pasted images keep their place in your message but not their data.
const READ = `awk -v k="$2" 'NR > k {
  gsub(/"data":"[^"]*"/, "\\"data\\":\\"\\"");
  u = ""; p = "";
  if (match($0, /"uuid":"[^"]*","timestamp"/)) u = substr($0, RSTART, RLENGTH);
  if (match($0, /^\\{"parentUuid":"[^"]*"/)) p = substr($0, RSTART, RLENGTH);
  if ($0 ~ /"content":\\[\\{"type":"tool_use"/) print NR "\\tSTUB tool " u " " p;
  else if ($0 ~ /"content":\\[\\{("tool_use_id":"[^"]*",)?"type":"(tool_result|thinking|redacted_thinking)"/) print NR "\\tSTUB skip " u " " p;
  else if ($0 ~ /"type":"attachment"/ && $0 !~ /"type":"queued_command"/) print NR "\\tSTUB skip " u " " p;
  else print NR "\\t" $0
}' "$1"`;

const SESSION = `cat "$HOME/.claude/sessions/$1.json"`;
const FILE = `ls -t "$HOME"/.claude/projects/*/"$1".jsonl 2>/dev/null | head -n 1`;

const run = async (script, args, on) => {
  const r = await exec("sh", ["-c", script, "sh", ...args], { on });
  if (r.code !== 0) throw new Error(r.stderr || `exit ${r.code}`);
  return r.stdout;
};

// Adds numbered lines to the session's entries. A line Claude is still
// writing doesn't parse yet: stop there and read it again next time.
function take(s, stdout) {
  let added = false;
  for (const raw of stdout.split("\n")) {
    const tab = raw.indexOf("\t");
    if (tab < 0) continue;
    const n = Number(raw.slice(0, tab)), body = raw.slice(tab + 1);
    let e;
    if (body.startsWith("STUB")) {
      e = { uuid: body.match(/"uuid":"([^"]*)"/)?.[1], parentUuid: body.match(/"parentUuid":"([^"]*)"/)?.[1] ?? null, stub: body.startsWith("STUB tool") ? "tool" : "skip" };
    } else { try { e = JSON.parse(body); } catch (_e) { break; } }
    s.line = n;
    if (!e?.uuid || e.isSidechain) continue;
    s.byId.set(e.uuid, e);
    s.leaf = e.uuid;
    added = true;
  }
  return added;
}

// The conversation as it stands: from the newest entry back to the start
// (rewinding branches it; a compaction links back through logicalParentUuid).
function chain(s) {
  const out = [], seen = new Set();
  for (let e = s.byId.get(s.leaf); e && !seen.has(e.uuid);) {
    seen.add(e.uuid);
    out.push(e);
    const up = e.parentUuid ?? e.logicalParentUuid;
    e = up ? s.byId.get(up) : null;
  }
  return out.reverse();
}

// A prompt as you typed it: a slash command as "/name args", pasted text
// without its wrapper; the app's own notes (command output, interruptions) are none.
function promptText(m) {
  const raw = typeof m.content === "string" ? m.content
    : Array.isArray(m.content) ? m.content.filter((c) => c?.type === "text").map((c) => c.text ?? "").join("\n") : "";
  // Images pasted into Claude Code itself: their data isn't kept here, so a picture sign for each.
  const pics = Array.isArray(m.content) ? m.content.filter((c) => c?.type === "image").length : 0;
  const text = [raw.trim(), "🖼".repeat(pics)].filter(Boolean).join(" ");
  if (!text || /^<local-command-|^\[Request interrupted/.test(text)) return null;
  const cmd = text.match(/<command-name>([^<]*)<\/command-name>/);
  if (cmd) return `${cmd[1]} ${text.match(/<command-args>([^<]*)<\/command-args>/)?.[1] ?? ""}`.trim();
  return text.replace(/<\/?pasted_content[^>]*>/g, "").trim();
}

// Your messages and, for each turn, its reply: the text after its last tool
// call, once the turn is over. Messages you sent mid-turn come where they
// arrived. A turn still going has no reply yet (the typing indicator covers it).
export function conversation(s) {
  const out = [];
  let turn = null;
  const close = (ended) => {
    if (!turn) return;
    let k = turn.length;
    while (k > 0 && !turn[k - 1].tool) k--;
    const said = turn.slice(k).filter((x) => x.text);
    const done = ended || turn.slice(k).some((x) => x.end);
    if (done && said.length) out.push({ who: "agent", text: said.map((x) => x.text).join("\n\n"), at: said[said.length - 1].at });
    else if (ended && !said.length) {
      const last = [...turn].reverse().find((x) => x.text);
      if (last) out.push({ who: "agent", text: last.text, at: last.at, cut: true });
    }
    turn = done ? null : turn;
  };
  for (const e of chain(s)) {
    const at = Date.parse(e.timestamp) || null;
    if (e.stub) { if (e.stub === "tool") (turn ??= []).push({ tool: true }); continue; }
    if (e.type === "user" && !e.isMeta) {
      const text = promptText(e.message ?? {});
      if (text === null) { if (/^\[Request interrupted/.test(String(e.message?.content?.[0]?.text ?? e.message?.content ?? ""))) close(true); continue; }
      close(true);
      out.push({ who: "you", text, at });
      turn = [];
    } else if (e.type === "attachment" && e.attachment?.type === "queued_command" && e.attachment.prompt) {
      out.push({ who: "you", text: String(e.attachment.prompt), at });
    } else if (e.type === "assistant") {
      const m = e.message ?? {};
      const text = (Array.isArray(m.content) ? m.content : []).filter((c) => c?.type === "text").map((c) => c.text ?? "").join("\n").trim();
      (turn ??= []).push({ text, at, end: m.stop_reason === "end_turn" });
    } else if (e.type === "system" && e.subtype === "turn_duration") close(true);
  }
  close(false);
  return out;
}

// The terminal's Claude Code and its session file, from the session record
// Claude keeps for its process. Null when the terminal isn't running Claude Code.
export async function locate(term) {
  const fg = JSON.parse((await hc(["get", term])).stdout).foreground;
  if (!fg?.pid || !/claude/i.test(`${fg.name} ${fg.argv?.[0] ?? ""}`)) return null;
  const on = machineOf(term);
  const sid = JSON.parse(await run(SESSION, [String(fg.pid)], on)).sessionId;
  const file = sid ? (await run(FILE, [sid], on)).trim() : "";
  return file ? { term, on, file, pid: fg.pid, sid } : null;
}

export const open = (found) => ({ ...found, byId: new Map(), leaf: null, line: 0 });

// Reads what Claude added since last time. True when the conversation changed.
export async function update(s) {
  return take(s, await run(READ, [s.file, String(s.line)], s.on));
}

// Still that process and that session? (/clear and /resume start another.)
export async function stillThere(s) {
  const fg = JSON.parse((await hc(["get", s.term])).stdout).foreground;
  if (fg?.pid !== s.pid) return false;
  try { return JSON.parse(await run(SESSION, [String(s.pid)], s.on)).sessionId === s.sid; } catch (_e) { return false; }
}
