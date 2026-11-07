// The member list, grouped by role like a Discord server: the Kitten Herder
// (you, with the owner's crown), Head Kittens (the agents you started), Kittens
// (agents they started), then everyone offline. Names wear their role's color.
// It lists the current channel's kittens (everyone, in the forum), shows
// "typing…" under the ones mid-turn, and runs the peek that tells every
// discord-* mod who's typing.
// Hovering someone pops their profile card (discord-profile) out to the left.
// It also names every agent after its session (lore.js).
import { View, div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { run, spaces, layout, hc, shared, setShared, openOverlay, closeOverlay, machines, terminals, appHome, exec, readTextFile } from "herdr";
import { C, icon, picture, presence, channel, herd, typing, dots, smooth, slide, livePill, streaming, watch, openSub, closeSub, loreKey, GIFS, hashOf, SPIN, ME, ROLES } from "./kit.js";
import { ask, askServer, answer } from "./lore.js";

function find(n, id) { if (n?.id === id) return n; for (const c of n?.children ?? []) { const f = find(c, id); if (f) return f; } return null; }

const CARD = { width: 300, height: 640 };

export default class Members extends View {
  // The hovered member (this.want) and the open card (this.pop, for this.shown).
  // The first card waits a beat so sweeping past doesn't flash one; once one is
  // open, moving to another row swaps it at once, like Discord.
  hoverMove(m, key, e, cx) {
    this.rect = e.bounds;
    if (this.want === key) return;
    this.want = key;
    if (this.pop) return this.show(m, key);
    cx.timer.after(180, () => { if (this.want === key && this.shown !== key) this.show(m, key); });
  }

  hoverEnd(key, cx) {
    if (this.want !== key) return;
    this.want = null;
    cx.timer.after(100, () => { if (!this.want) this.hide(); });
  }

  show(m, key) {
    const r = this.rect, area = this.area;
    const bottom = area ? area.y + area.height : r.y + CARD.height;
    const y = Math.max(8, Math.min(r.y - 12, bottom - CARD.height - 8));
    this.hide();
    this.pop = openOverlay({ mod: "discord-profile", kind: "popup", frame: "none", ...CARD,
      at: { x: r.x - CARD.width - 16, y }, props: { m, herd: this.herd } });
    this.shown = key;
  }

  hide() {
    if (this.pop) closeOverlay(this.pop);
    this.pop = this.shown = null;
  }

  async close() { this.hide(); }

  // Peek at every running agent's screen every 2s for a spinner or "esc to
  // interrupt" (their own status can say idle mid-turn), plus the last line
  // they said, and share it as "discord.peek" for the chat, forum and voice.
  init(_props, cx) {
    this.loreFail = {};
    // The icon sets a server picture can come from (built by Nix, icons.nix):
    // Simple Icons' brands (slug -> { title, hex }) and Lucide's names.
    this.icons = null;
    cx.spawn(async () => {
      try {
        const brands = JSON.parse(await readTextFile(`${appHome()}/mods/discord-kit/brands/index.json`));
        const lucide = new Set(JSON.parse(await readTextFile(`${appHome()}/mods/discord-kit/lucide/index.json`)));
        this.icons = { brands, lucide };
      } catch (_e) { /* not installed yet: servers keep their initials */ }
    });
    // Answers nobody collected (the mod reloaded while one was out) go after 10 minutes.
    exec("sh", ["-c", `find "$1" -type f -mmin +10 -delete 2>/dev/null; true`, "sh", `${appHome()}/data/discord-lore`]).catch(() => {});
    cx.timer.every(2000, (cx) => this.peekAll(cx));
    cx.timer.every(5000, (cx) => this.nameOne(cx));
    this.peekAll(cx);
  }

  // Names one agent at a time: a new one from its folder and title, again once
  // it has finished a turn, then every 5 turns as its work moves on. The model answers into a file, checked here
  // every 5 s; no answer in 2 minutes, or a bad one, waits 5 minutes to retry.
  // Names of terminals that are gone are dropped (the newest 300 are kept).
  nameOne(cx) {
    this.giveLooks();
    if (this.naming) return;
    if (this.asking) return this.collect(cx);
    if (this.lookOne(cx)) return;
    const L = shared("discord.lore") ?? {}, all = terminals(), { top, subs } = herd();
    const next = [...top, ...subs.filter((m) => m.agent)].map((m) => {
      const t = all.find((x) => x.address === m.address), key = loreKey(t);
      return { m, t, key, turn: t?.turn ?? 0 };
    }).find(({ key, turn }) => key && (!L[key] || /herder/i.test(L[key].name) || turn < (L[key].turn ?? 0)
      || (L[key].turn === 0 && turn >= 1) || turn - (L[key].turn ?? 0) >= 5)
      && Date.now() - (this.loreFail[key] ?? 0) > 300000);
    if (!next) return;
    this.naming = true;
    const file = `${appHome()}/data/discord-lore/${next.key.replace(/[^\w.-]+/g, "_")}.json`;
    cx.spawn(async () => {
      try {
        await ask(next.m, next.t, file);
        this.asking = { key: next.key, turn: next.turn, file, since: Date.now() };
      } catch (_e) { this.loreFail[next.key] = Date.now(); }
      finally { this.naming = false; }
    });
  }

  // Gives each kitten a GIF of its own (picture and animated portrait): the
  // least used one, so none share while there are enough. Kittens that are
  // gone give theirs back.
  giveLooks() {
    const looks = shared("discord.looks") ?? {}, all = terminals(), { top, subs } = herd();
    const keys = [...top, ...subs].map((m) => loreKey(all.find((x) => x.address === m.address))).filter(Boolean);
    const next = Object.fromEntries(keys.filter((k) => GIFS.includes(looks[k])).map((k) => [k, looks[k]]));
    let changed = Object.keys(next).length !== Object.keys(looks).length;
    for (const k of keys) {
      if (next[k]) continue;
      const used = {};
      for (const v of Object.values(next)) used[v] = (used[v] ?? 0) + 1;
      // Ties go by a hash, so kittens don't take the list in order.
      const rank = (g) => (used[g] ?? 0) * 2 ** 32 + hashOf(k + g);
      next[k] = GIFS.reduce((best, g) => (rank(g) < rank(best) ? g : best));
      changed = true;
    }
    if (changed) setShared("discord.looks", next);
  }

  // A server (space) without its look, or renamed or moved since: asks for one
  // (an emoji and two colors, for its rail icon) in the same queue as names.
  // shared "discord.servers" = { <space id>: { emoji, colors, sig } }. True
  // when it started one.
  lookOne(cx) {
    if (!this.icons) return false;
    const looks = shared("discord.servers") ?? {}, { top, subs } = herd();
    const space = spaces().find((s) => {
      const sig = `${s.name}|${s.folder}|${s.machine ?? ""}`;
      return (!looks[s.id]?.icon || looks[s.id].sig !== sig) && Date.now() - (this.loreFail[`server:${s.id}`] ?? 0) > 300000;
    });
    if (!space) return false;
    const tabs = new Set(space.tabs.map((t) => t.id));
    const kittens = [...top, ...subs].filter((m) => tabs.has(m.tab)).slice(0, 8)
      .map((m) => `- ${m.name}: ${m.title ?? ""}${m.lore?.bio ? ` (${m.lore.bio})` : ""}`);
    const about = [`Server name: ${space.name === "~" ? "Home" : space.name}.`, `Folder: ${space.folder || "~"}${space.machine ? ` on ${space.machine}` : ""}.`,
      `Channels: ${space.tabs.map((t) => t.name).join(", ")}.`, kittens.length ? `Agents:\n${kittens.join("\n")}` : "No agents yet."].join("\n");
    const key = `server:${space.id}`, file = `${appHome()}/data/discord-lore/${key.replace(/[^\w.-]+/g, "_")}.json`;
    this.naming = true;
    cx.spawn(async () => {
      try {
        await askServer(about, file);
        this.asking = { key, server: space.id, sig: `${space.name}|${space.folder}|${space.machine ?? ""}`, file, since: Date.now() };
      } catch (_e) { this.loreFail[key] = Date.now(); }
      finally { this.naming = false; }
    });
    return true;
  }

  collect(cx) {
    const job = this.asking;
    this.naming = true;
    cx.spawn(async () => {
      try {
        const got = await answer(job.file, Boolean(job.server));
        if (got === undefined && Date.now() - job.since < 120000) return; // still thinking
        this.asking = null;
        if (!got) { this.loreFail[job.key] = Date.now(); return; }
        if (job.server) {
          // A brand logo on its brand's color (a near-black one on the first
          // color picked), else a Lucide icon on the first color; the icon is
          // white, or dark on a light color.
          const brand = this.icons?.brands[got.icon];
          if (!brand && !this.icons?.lucide.has(got.icon)) { this.loreFail[job.key] = Date.now(); return; }
          const lum = (c) => { const n = parseInt(c.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
          const color = brand && lum(`#${brand.hex}`) > 0.12 ? `#${brand.hex}` : got.colors[0];
          const look = { icon: got.icon, kind: brand ? "brands" : "lucide", title: brand?.title ?? null, color,
            glow: got.colors[brand ? 0 : 1] === color ? got.colors[1] : got.colors[brand ? 0 : 1], tint: lum(color) > 0.62 ? "#1e1f22" : "#ffffff" };
          const alive = new Set(spaces().map((s) => s.id));
          const kept = Object.entries(shared("discord.servers") ?? {}).filter(([k]) => alive.has(k));
          setShared("discord.servers", { ...Object.fromEntries(kept), [job.server]: { ...look, sig: job.sig } });
          return;
        }
        const alive = new Set(terminals().map(loreKey).filter(Boolean));
        const kept = Object.entries(shared("discord.lore") ?? {}).filter(([k]) => alive.has(k)).slice(-299);
        setShared("discord.lore", { ...Object.fromEntries(kept), [job.key]: { ...got, turn: job.turn, at: Date.now() } });
      } catch (_e) { this.asking = null; this.loreFail[job.key] = Date.now(); }
      finally { this.naming = false; }
    });
  }

  peekAll(cx) {
    if (this.peeking) return;
    this.peeking = true;
    const { top, subs } = herd();
    // A machine that can't be reached would hold every read up (ssh timeouts):
    // its agents keep what was last seen until it's back.
    const down = new Set(machines().filter((x) => x.layout === "unavailable").map((x) => x.name));
    const before = shared("discord.peek") ?? {};
    cx.spawn(async () => {
      try {
        const out = {};
        for (const m of [...top, ...subs]) {
          const at = m.address.includes("/") ? m.address.slice(0, m.address.lastIndexOf("/")) : null;
          if (at && down.has(at)) { if (before[m.address]) out[m.address] = before[m.address]; continue; }
          try {
            const d = JSON.parse((await hc(["read", m.address, "--json"])).stdout);
            const lines = String(d.text ?? "").split("\n");
            const tail = lines.slice(-14);
            const busy = tail.some((l) => /esc to interrupt/i.test(l)) || tail.some((l) => SPIN.test(l));
            const said = [...lines].reverse().find((l) => /^\s*[⏺●]\s+\S/.test(l) && !SPIN.test(l));
            out[m.address] = { typing: busy, line: said ? said.replace(/^\s*[⏺●]\s+/, "").trim() : null };
          } catch (_e) { /* gone or restarting */ }
        }
        if (JSON.stringify(out) !== JSON.stringify(shared("discord.peek") ?? {})) setShared("discord.peek", out);
      } finally { this.peeking = false; }
    });
  }

  render() {
    // Like Discord, the list shows who's in the channel you're looking at: the
    // agents in this tab and what they started. The forum is server-wide, so
    // there it shows everyone.
    const forum = (find(layout(), "convo-stack")?.active ?? "output") === "forum";
    const space = spaces().find((x) => x.active), tab = space?.tabs.find((t) => t.active);
    const { top, subs } = herd(forum ? null : tab?.id);
    const me = { address: null, name: ME.name, pic: ME.pic, status: "done", role: "owner", owner: true, activity: "Herding kittens" };
    const everyone = [...top, ...subs];
    this.herd = herd().top.length + herd().subs.length;
    const on = everyone.filter((m) => m.status);
    const off = everyone.filter((m) => !m.status);
    // A row as Discord's member list has it: picture with its status shape,
    // the name in its role's color, the APP tag (agents) and a server tag (its
    // folder), then what it's doing (an icon and its task) or its custom status.
    const row = (m, dim) => {
      const role = ROLES[m.role], busy = typing(m), live = !dim && streaming(m);
      const working = m.status === "working" || busy;
      const status = m.owner ? m.activity : working ? m.title || "Working" : m.lore?.bio ?? m.title ?? null;
      const folder = (m.cwd ?? "").split("/").filter(Boolean).pop();
      const key = `mem-${m.address ?? "me"}`;
      // Fades its hover color in, brightens if offline, and eases its content right.
      const hot = this.hot === key;
      return smooth(this, h_flex().id(key).mx(8).h(42).px(8).items_center().rounded(4).cursor_pointer()
        .opacity(dim && !hot ? 0.35 : 1).transition("opacity", { duration: 140, easing: "ease-out" }),
        key, C.hover, { onHover: (hovered, cx) => { if (!hovered) this.hoverEnd(key, cx); } })
        .on_mouse_move((e, cx) => this.hoverMove(m, key, e, cx))
        // A sub-agent has no channel of its own: watch its terminal instead.
        .on_click(() => { this.hide(); !m.address ? run("app.settings") : m.parent ? openSub(m) : (closeSub(), run("agent.focus", { terminal: m.address })); })
        .child(slide(this, key, h_flex().flex_1().min_w(0).gap(12).items_center())
        .child(picture(m.pic, 32, live ? "streaming" : busy ? "working" : m.status ?? null))
        .child(v_flex().flex_1().min_w(0)
          .child(h_flex().gap(4).items_center()
            .child(div().truncate().text_size(15).font_medium().text_color(dim ? C.muted : role.color).child(m.name))
            .when(Boolean(m.owner), (el) => el.child(icon("crown", 14, "#f1c40f")))
            .when(!m.owner, (el) => el.child(h_flex().flex_none().gap(2).px(4).h(16).rounded(4).bg(C.blurple).items_center()
              .child(icon("check", 10, "#ffffff")).child(div().text_size(10).font_bold().text_color("#ffffff").child("APP"))))
            .when(!m.owner && Boolean(folder), (el) => el.child(h_flex().flex_none().gap(3).px(4).h(16).rounded(4).bg("#ffffff14").items_center()
              .child(icon("paw", 10, ROLES[m.role]?.color ?? C.muted))
              .child(div().text_size(10).font_bold().text_color(C.text).child(folder.replace(/^\./, "").slice(0, 4).toUpperCase()))))
            .when(live, (el) => el.child(div().id(`${key}-live`).cursor_pointer()
              .on_click((_e, cx) => { cx.stop_propagation(); this.hide(); watch(m.address); }).child(livePill(9)))))
          .when(busy && !dim, (el) => el.child(h_flex().gap(6).items_center().child(dots(4, C.muted))
            .child(div().truncate().text_size(12).text_color(C.muted).child("typing…"))))
          .when(!busy && Boolean(status) && !dim, (el) => el.child(h_flex().min_w(0).gap(4).items_center()
            .when(working && !m.owner, (x) => x.child(icon("terminal", 12, C.green)))
            .child(div().flex_1().min_w(0).truncate().text_size(12).text_color(C.muted).child(status))))));
    };
    const group = (label, list, dim) => list.length
      ? [div().px(16).pt(20).pb(4).text_size(12).font_semibold().text_color(C.muted).child(`${label} — ${list.length}`), ...list.map((m) => row(m, dim))] : [];
    const where = forum ? null : channel(tab ?? { id: null, name: "" }).name;
    return v_flex().id("root").size_full().bg(C.side).overflow_y_scrollbar().pb(8)
      .on_mouse_move((e) => { this.area = e.bounds; })
      .children([
        ...group(ROLES.owner.name, [me]),
        ...group(ROLES.head.name, on.filter((m) => m.role === "head")),
        ...group(ROLES.kitten.name, on.filter((m) => m.role === "kitten")),
        ...group("Offline", off, true),
      ])
      .when(!everyone.length, (el) => el.child(v_flex().px(16).pt(24).gap(8).items_center()
        .child(icon("paw", 28, C.dim))
        .child(div().text_size(13).text_color(C.muted).child(`No kittens in #${where}`))
        .child(div().text_size(12).text_color(C.dim).child("They're all napping in other channels."))));
  }
}
