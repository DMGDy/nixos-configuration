// Every agent gets a name, bio, pronouns and favorite treat that play on what
// its session is about, kitten included ("Purr-mote Kitten"): a small model
// (Haiku, through this computer's `claude`, with no tools, settings or saved
// session) reads its title, folder and the text on its screen, once it has
// said something and again every few turns. The model can take from seconds to
// over half a minute, so it runs detached and writes its answer to a file that
// discord-members picks up. Kept in shared "discord.lore" (see the kit's
// lore()); a failed or slow call keeps the plain name.
import { exec, hc, readTextFile } from "herdr";

const SYSTEM = `You name AI coding agents in a Discord server where every agent is a kitten.
The human who runs the server is the "Kitten Herder": never use "Herder" in a name.
Reply with only a JSON object, no code fence:
{"name": a 2-3 word pun on what this session is about that includes the word "Kitten" (at most 24 characters),
 "bio": one funny sentence about this kitten and its work (at most 140 characters),
 "pronouns": a cat pun like "mew/mrrp" (at most 14 characters),
 "treat": its favorite treat, tied to its work (at most 30 characters)}`;

const clip = (s, n) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);

// What the session is about, in a couple of KB: title, folder, and the screen's
// words (Claude Code's screen only: reading its history would scroll it).
async function about(m, t) {
  const full = /claude/i.test(`${t.program?.key ?? ""} ${t.agent ?? ""}`);
  let text = "";
  try { text = String(JSON.parse((await hc(["read", m.address, "--json", "--lines", full ? "0" : "300"])).stdout).text ?? ""); } catch (_e) { /* no screen: the title will do */ }
  const words = text.split("\n").filter((l) => l.trim() && !/[─━│┃┌┐└┘├┤┬┴┼╭╮╰╯═║]/.test(l)).join("\n").slice(-2500);
  return [`Agent: ${t.program?.name ?? t.agent ?? "agent"}${m.parent ? ` (a helper started by another agent${m.label ? `, named "${m.label}"` : ""})` : ""}.`,
    `Folder: ${t.cwd ?? m.cwd ?? "?"}.`, `Title: ${m.title ?? t.title ?? ""}.`,
    (t.turn ?? 0) < 1 ? "It was just started and hasn't been given any work yet: a name for a new kitten waiting by that folder." : "Recent conversation:", words].join("\n");
}

// Starts asking for the agent's lore in its own session (setsid), so it
// outlives this command; the answer lands in `file` (written whole: under
// another name first, then moved).
const ASK = `mkdir -p "$(dirname "$1")" && setsid -f sh -c 'cd /tmp && claude -p --model haiku --no-session-persistence --tools "" \
  --setting-sources "" --strict-mcp-config --system-prompt "$2" "$3" > "$1.part" 2>/dev/null; mv -f "$1.part" "$1"' sh "$@" < /dev/null > /dev/null 2>&1`;
export async function ask(m, t, file) {
  const r = await exec("sh", ["-c", ASK, "sh", file, SYSTEM, await about(m, t)]);
  if (r.code !== 0) throw new Error(r.stderr || `exit ${r.code}`);
}

// A server's look (a space's): a real icon for what it's for (a Simple Icons
// brand logo, else a Lucide icon) and two colors, as its picture in the rail.
// `about` is its name, folder, channels and what its agents are up to.
const SERVER = `You pick Discord server pictures for coding workspaces.
Reply with only a JSON object, no code fence:
{"icon": the Simple Icons slug (simpleicons.org) of the logo of this project's main technology or product, e.g. "nixos", "rust", "python", "linux", "git", "jira";
   or, when no logo fits, a Lucide icon name (lucide.dev) for its subject, e.g. "memory-stick", "flask-conical", "chart-line", "server", "folder-git-2",
 "colors": [two vivid, saturated hex colors that suit it and keep a white icon readable, e.g. "#5865f2", "#eb459e"]}`;
export async function askServer(about, file) {
  const r = await exec("sh", ["-c", ASK, "sh", file, SERVER, about]);
  if (r.code !== 0) throw new Error(r.stderr || `exit ${r.code}`);
}

// The answer, once it's there: the lore (or, for a server, its look), or null
// when it didn't work out. Undefined while still waiting.
export async function answer(file, server = false) {
  const text = await readTextFile(file);
  if (text === null) return undefined;
  exec("rm", ["-f", file]);
  return server ? parseServer(text) : parse(text);
}

function parseServer(text) {
  let x;
  try { x = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? ""); } catch (_e) { return null; }
  const icon = String(x?.icon ?? "").trim().toLowerCase();
  const colors = (Array.isArray(x?.colors) ? x.colors : []).filter((c) => /^#[0-9a-f]{6}$/i.test(c));
  if (!/^[a-z0-9][a-z0-9-]*$/.test(icon) || colors.length < 2) return null;
  return { icon, colors: colors.slice(0, 2) };
}

function parse(text) {
  const json = text.match(/\{[\s\S]*\}/)?.[0];
  if (!json) return null;
  let x;
  try { x = JSON.parse(json); } catch (_e) { return null; }
  let name = clip(x.name, 28);
  if (!name || /herder/i.test(name)) return null; // that's you
  if (!/kit/i.test(name)) name = `${name} Kitten`;
  return { name, bio: clip(x.bio, 160), pronouns: clip(x.pronouns, 16), treat: clip(x.treat, 36) };
}
