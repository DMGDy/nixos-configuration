// The member list, grouped by role like a Discord server: the Kitten Herder
// (you, with the owner's crown), Head Kittens (the agents you started), Kittens
// (agents they started), then everyone offline. Names wear their role's color.
// It lists the current channel's kittens (everyone, in the forum), shows
// "typing…" under the ones mid-turn, and runs the peek that tells every
// discord-* mod who's typing.
// Hovering someone pops their profile card (discord-profile) out to the left.
import { View, div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { run, spaces, layout, hc, shared, setShared, openOverlay, closeOverlay } from "herdr";
import { C, icon, picture, presence, channel, herd, typing, dots, SPIN, ME, ROLES } from "./kit.js";

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
    cx.timer.every(2000, (cx) => this.peekAll(cx));
    this.peekAll(cx);
  }

  peekAll(cx) {
    if (this.peeking) return;
    this.peeking = true;
    const { top, subs } = herd();
    cx.spawn(async () => {
      const out = {};
      for (const m of [...top, ...subs]) {
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
      this.peeking = false;
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
    const row = (m, dim) => {
      const p = presence(m.status), role = ROLES[m.role], busy = typing(m);
      const activity = m.activity ?? (p.activity ? `${p.activity}${m.what ? ` · ${m.what}` : ""}` : null);
      const key = `mem-${m.address ?? "me"}`;
      return h_flex().id(key).mx(8).h(44).px(8).gap(12).items_center().rounded(4).cursor_pointer()
        .opacity(dim ? 0.35 : 1).hover((x) => x.bg(C.hover).opacity(1))
        .on_mouse_move((e, cx) => this.hoverMove(m, key, e, cx))
        .on_hover((hovered, cx) => { if (!hovered) this.hoverEnd(key, cx); })
        .on_click(() => { this.hide(); m.address ? run("agent.focus", { terminal: m.address }) : run("app.settings"); })
        .child(picture(m.pic, 32, busy ? "working" : m.status ?? null))
        .child(v_flex().flex_1().min_w(0)
          .child(h_flex().gap(4).items_center()
            .child(div().truncate().text_size(15).font_medium().text_color(dim ? C.muted : role.color).child(m.name))
            .when(Boolean(m.owner), (el) => el.child(icon("crown", 14, "#f1c40f")))
            .when(!m.owner, (el) => el.child(div().px(4).h(15).rounded(3).bg(C.blurple).flex().items_center().text_size(10).font_bold().text_color("#ffffff").child("BOT"))))
          .when(busy && !dim, (el) => el.child(h_flex().gap(6).items_center().child(dots(4, C.muted))
            .child(div().truncate().text_size(12).text_color(C.muted).child("typing…"))))
          .when(!busy && Boolean(activity) && !dim, (el) => el.child(div().truncate().text_size(12).text_color(C.muted).child(activity))));
    };
    const group = (label, list, dim) => list.length
      ? [div().px(16).pt(20).pb(4).text_size(12).font_semibold().text_color(C.muted).child(`${label.toUpperCase()} — ${list.length}`), ...list.map((m) => row(m, dim))] : [];
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
