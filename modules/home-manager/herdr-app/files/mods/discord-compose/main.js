// The message box: "Message #channel" with + on the left and Discord's gift,
// sticker and emoji buttons on the right. It wraps and grows up to six lines
// (the bar resizes itself). Enter sends to the channel's agent (hc send) and
// keeps the text in shared "imsg.sent" for the chat; Shift+Enter or a pasted
// line break keeps the newline. Files (images too) come along like Discord's
// attachments: paste an image (Ctrl+V), drop files on the box, or pick them
// with +. Each goes beside the agent's terminal (hc put, on its machine) and
// its path rides along with the message; images get a thumbnail here and in
// the chat (shared "discord.uploads" = { <file name>: { thumb, w, h } }).
// A second copy (props.block "stream-compose") sits under the stream's chat
// and talks to the agent being watched.
import { View, div, image } from "gpui-kit";
import { h_flex, v_flex, TextareaState, Textarea } from "gpui-base";
import { focused, hc, notify, run, shared, setShared, openOverlay, spaces, panes, nextCommand, exec, appHome, readTextFile, props } from "herdr";
import { C, icon, channel, chatSub, herd } from "./kit.js";

// hc's reason, from its JSON error or its first line of output.
function failure(r) {
  if (!r) return "Couldn't reach herdr-core.";
  const out = (r.stderr || r.stdout || "").trim();
  try { const e = JSON.parse(out).error; if (e?.message) return e.message; } catch (_e) { /* not JSON */ }
  return out.split("\n")[0] || `hc send exited with ${r.code}`;
}

const IMAGE = /\.(png|jpe?g|gif|webp|bmp)$/i;

// Copies a file into data/discord-uploads under a unique name (a thumbnail
// beside it for an image), so the agent gets its own copy and the chat can
// show it. Prints: name, thumbnail width, height.
const KEEP = `set -e; mkdir -p "$1"; n="$(date +%s%N)-$(printf %s "$(basename "$2")" | tr -c 'A-Za-z0-9._-' '_')"; cp -- "$2" "$1/$n"
case "$n" in *.png|*.PNG|*.jpg|*.JPG|*.jpeg|*.JPEG|*.gif|*.GIF|*.webp|*.WEBP|*.bmp|*.BMP)
  magick "$1/$n[0]" -thumbnail "400x220>" "$1/$n.thumb.png"; echo "$n $(magick identify -format '%w %h' "$1/$n.thumb.png")";;
*) echo "$n 0 0";; esac`;
// The clipboard's image, saved as a file to keep (Wayland, else X11).
const PASTE = `t="$(mktemp -p "$1" pasted-XXXXXX.png)"; (wl-paste --type image/png 2>/dev/null || xclip -selection clipboard -t image/png -o 2>/dev/null) > "$t" && [ -s "$t" ] && echo "$t" || rm -f "$t"`;
const HAS_IMAGE = `(wl-paste --list-types 2>/dev/null || xclip -selection clipboard -t TARGETS -o 2>/dev/null) | grep -q '^image/'`;
// The file picker, detached (it can stay open longer than a command may run);
// its choice lands in $1.
const PICK = `rm -f "$1"; setsid -f sh -c 'zenity --file-selection --multiple --separator="\n" --title="Upload a file" > "$1.part" 2>/dev/null; mv -f "$1.part" "$1"' sh "$1" < /dev/null > /dev/null 2>&1`;

export default class Compose extends View {
  init(_props, cx) {
    this.text = "";
    this.shift = false;
    this.h = null;
    this.input = TextareaState.new({ placeholder: "", value: "" });
    this.input.set_soft_wrap(true);
    this.input.set_auto_grow(1, 6);
    this.input.on("change", (_e, cx) => {
      const v = this.input.value(), prev = this.text;
      // One newline typed without Shift, anywhere in the text: that's Enter, so send.
      let i = 0;
      while (i < prev.length && v[i] === prev[i]) i++;
      if (!this.shift && v.length === prev.length + 1 && v[i] === "\n" && v.slice(i + 1) === prev.slice(i)) {
        this.text = prev;
        this.send(cx);
      } else this.text = v;
      cx.notify();
    });
    this.input.on("submit", (_e, cx) => this.send(cx));
    this.files = [];        // attachments: { name, path (here), thumb, w, h }
    this.block = props()?.block ?? "compose";
    this.dir = `${appHome()}/data/discord-uploads`;
    // Typing in the chat lands here (discord-chat shares the key and runs
    // discord-compose.type), as typing anywhere in Discord does.
    cx.spawn(async (cx) => {
      for (;;) {
        if (await nextCommand() !== "type") continue;
        if ((shared("discord.typed")?.to ?? "compose") !== this.block) continue;
        const typed = shared("discord.typed")?.text ?? "";
        this.text += typed;
        this.input.set_value(this.text);
        this.input.focus();
        cx.notify();
      }
    });
  }

  target() {
    const tab = spaces().find((s) => s.active)?.tabs.find((t) => t.active);
    // A sub-agent's chat is open (or, beside a stream, it's being watched): talk to it.
    const sub = (this.block !== "compose" ? shared("discord.stream")?.address : null) ?? chatSub();
    if (sub && herd(tab?.id).subs.some((m) => m.address === sub)) return sub;
    const ps = panes().filter((p) => p.tab === tab?.id && p.terminal);
    const f = focused()?.terminal;
    // The focused agent, else the channel's agent (not its shell).
    return (ps.find((p) => p.terminal === f && p.program?.agent) ?? ps.find((p) => p.program?.agent) ?? ps.find((p) => p.terminal === f) ?? ps[0])?.terminal ?? f;
  }

  // Attaches files (paths on this computer).
  attach(paths, cx) {
    cx.spawn(async (cx) => {
      for (const p of paths) {
        try {
          const r = await exec("sh", ["-c", KEEP, "sh", this.dir, p]);
          const [name, w, h] = r.stdout.trim().split(" ");
          if (r.code !== 0 || !name) throw new Error(r.stderr);
          const file = { name, path: `${this.dir}/${name}`, thumb: Number(w) ? `data/discord-uploads/${name}.thumb.png` : null, w: Number(w), h: Number(h) };
          this.files.push(file);
          if (file.thumb) setShared("discord.uploads", { ...Object.fromEntries(Object.entries(shared("discord.uploads") ?? {}).slice(-199)), [name]: { thumb: file.thumb, w: file.w, h: file.h } });
        } catch (_e) { notify({ title: "Couldn't attach", body: p.split("/").pop(), level: "warning" }); }
      }
      cx.notify();
    });
  }

  // Ctrl+V with an image on the clipboard: attach it (text pastes as usual).
  pasteImage(cx) {
    cx.spawn(async (cx) => {
      try {
        if ((await exec("sh", ["-c", HAS_IMAGE])).code !== 0) return;
        await exec("mkdir", ["-p", this.dir]);
        const p = (await exec("sh", ["-c", PASTE, "sh", this.dir])).stdout.trim();
        if (p) { this.attach([p], cx); exec("sh", ["-c", `sleep 5; rm -f "$1"`, "sh", p]); }
      } catch (_e) { /* no clipboard tool */ }
    });
  }

  // + : the file picker; its choice is checked for twice a second, for 5 minutes.
  pick(cx) {
    const out = `${this.dir}/.picked`;
    cx.spawn(async (cx) => {
      try {
        await exec("mkdir", ["-p", this.dir]);
        await exec("sh", ["-c", PICK, "sh", out]);
        for (let k = 0; k < 600; k++) {
          await cx.sleep(500);
          const got = await readTextFile(out);
          if (got === null) continue;
          exec("rm", ["-f", out]);
          const paths = got.split("\n").map((x) => x.trim()).filter(Boolean);
          if (paths.length) this.attach(paths, cx);
          return;
        }
      } catch (_e) { notify({ title: "No file picker", body: "zenity isn't available.", level: "warning" }); }
    });
  }

  // The chat's record of what you sent each terminal (shared "imsg.sent").
  remember(term, edit) {
    const sent = { ...(shared("imsg.sent") ?? {}) };
    sent[term] = edit(sent[term] ?? []).slice(-30);
    setShared("imsg.sent", sent);
  }

  send(cx) {
    const words = this.text.trim(), term = this.target(), files = this.files;
    if (!words && !files.length) { this.input.set_value(""); this.text = ""; return; }
    if (!term) { notify({ title: "Not Delivered", body: "Open a conversation first.", level: "warning" }); return; }
    this.input.set_value("");
    this.text = "";
    this.files = [];
    const at = Date.now();
    cx.spawn(async (cx) => {
      // Each file beside the agent's terminal (on its machine); its path goes
      // under the words.
      const landed = [];
      let r = null, put = true;
      for (const f of files) {
        try {
          r = await hc(["put", term, f.path, "--json"]);
          const path = r.code === 0 ? JSON.parse(r.stdout).path : null;
          if (!path) throw new Error("not put");
          landed.push(path);
        } catch (_e) { if (!r?.code) r = null; put = false; break; }
      }
      const text = put ? [words, landed.join(" ")].filter(Boolean).join("\n") : null;
      if (text) {
        this.remember(term, (list) => [...list, { text, at }]);
        r = null;
        try { r = await hc(["send", term, text]); } catch (_e) { /* hc couldn't run */ }
        if (r?.code === 0) return;
        this.remember(term, (list) => list.filter((m) => !(m.at === at && m.text === text)));
      }
      // Not delivered (it's waiting on a question, or its machine is away): give
      // the words and files back if the box is empty.
      if (!this.text && !this.files.length) { this.input.set_value(words); this.text = words; this.files = files; }
      notify({ title: "Not Delivered", body: failure(r), level: "warning" });
      cx.notify();
    });
  }

  fit(height) {
    const want = Math.max(68, Math.min(this.files.length ? 420 : 210, Math.ceil(height) + 24));
    if (this.h !== null && Math.abs(want - this.h) < 2) return;
    this.h = want;
    run("layout.resize", { id: this.block, px: want });
  }

  render() {
    const tab = spaces().find((s) => s.active)?.tabs.find((t) => t.active);
    const { top, subs } = herd(tab?.id);
    const streamed = this.block !== "compose" ? shared("discord.stream")?.address : null;
    const watched = streamed ? [...top, ...subs].find((m) => m.address === streamed) : null;
    const sub = chatSub() ? subs.find((m) => m.address === chatSub()) : null;
    const name = watched ? `@${watched.name}` : sub ? sub.name : tab ? `#${channel(tab).name}` : "#general";
    const tool = (id, ic) => div().id(id).size(32).flex_none().flex().items_center().justify_center().child(icon(ic, 22, C.muted));
    // An attachment: its thumbnail (or a file card) with its name, and an X.
    const card = (f, k) => v_flex().id(`file-${k}`).relative().flex_none().w(f.thumb ? Math.max(120, f.w / 2) : 180).p(6).gap(4).rounded(6).bg(C.panel)
      .child(f.thumb ? image(f.thumb).w(f.w / 2).h(f.h / 2).rounded(4)
        : h_flex().h(48).gap(6).items_center().child(icon("inbox", 22, C.muted)).child(div().text_size(12).text_color(C.muted).child("file")))
      .child(div().truncate().text_size(12).text_color(C.muted).child(f.name.replace(/^\d+-/, "")))
      .child(div().id(`unfile-${k}`).absolute().top(-6).right(-6).size(22).rounded_full().bg(C.card).flex().items_center().justify_center().cursor_pointer()
        .hover((x) => x.bg(C.red)).on_click((_e, cx) => { this.files.splice(k, 1); cx.notify(); })
        .child(icon("x", 12, C.text)));
    return h_flex().id("root").size_full().bg(C.chat).px(16).pb(22).items_end()
      .on_key_down((e, cx) => {
        this.shift = Boolean(e.modifiers?.shift);
        if (e.modifiers?.control && !e.modifiers?.shift && e.key === "v") this.pasteImage(cx);
      })
      .on_key_up(() => { this.shift = false; })
      .on_drop((e, cx) => this.attach(e.paths ?? [], cx))
      .child(v_flex().id("field").flex_1().min_w(0).min_h(44).rounded(8).bg(C.input)
        .on_size_change((size) => this.fit(size.height))
        .when(this.files.length > 0, (el) => el.child(h_flex().id("files").gap(12).px(12).pt(14).pb(6).overflow_x_scroll().children(this.files.map(card))))
        .child(h_flex().w_full().pl(6).pr(8).py(4).gap(4).items_start()
        .child(div().id("plus").mt(2).size(32).flex_none().flex().items_center().justify_center().cursor_pointer()
          .on_click((_e, cx) => this.pick(cx))
          .child(div().size(22).rounded_full().bg(C.muted).flex().items_center().justify_center().child(icon("plus", 15, C.card))))
        .child(div().flex_1().min_w(0).py(7).relative()
          .child(Textarea.new(this.input).w_full().text_size(16).text_color(C.text))
          .when(!this.text, (el) => el.child(div().id("ph").absolute().top(7).left(0).right(0).truncate().text_size(16).text_color(C.dim).on_click(() => this.input.focus()).child(`Message ${name}`))))
        .child(h_flex().mt(2).gap(2)
          .child(div().id("rocket").cursor_pointer().on_click(() => openOverlay({ mod: "discord-activities", kind: "popup", frame: "none", width: 320, height: 420 }))
            .child(tool("rocket-i", "rocket")))
          .child(tool("gift", "gift")).child(tool("sticker", "sticker")).child(tool("emoji", "smile")))));
  }
}
