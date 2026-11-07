// The profile popout the member list opens while you hover someone: a kitten's
// banner (sparkles, a bobbing ball of yarn), its portrait, a thought bubble of
// what it's up to, and its stats: nine lives, treats (turns), a purr-o-meter.
// Purely cosmetic: it shows props().m from discord-members and reads the live
// terminal for its folder and turn count. Every kitten has Nitro: an animated
// portrait, an avatar decoration, a profile effect and theme (the kit's nitro()).
import { View, div, image } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { props, terminals, home, appHome, readTextFile } from "herdr";
import { C, icon, picture, presence, nitro, herd as everyone, typing, ROLES, ME } from "./kit.js";

const CARD = C.card, INNER = C.cardInner;

// Who each kind of kitten is: pronouns, a bio and a favorite treat. Its banner
// is mods/discord-kit/banners/<kind>.svg (mods paint flat colors only).
const LORE = {
  claude: { pronouns: "mew/mrrp", treat: "tuna sashimi",
    bio: "Knocks your semicolons off the table, then writes a 400-line apology. Will refactor the couch if left unsupervised." },
  pi: { pronouns: "π/π", treat: "pie, obviously",
    bio: "Purrs at exactly 3.14159 Hz. Small, fast, and irrational about laser pointers." },
  codex: { pronouns: "meow/0x6d6577", treat: "warm server racks",
    bio: "Sleeps on the keyboard because it's warm. Has strong opinions about your lockfile." },
  copilot: { pronouns: "tab/tab", treat: "your autocomplete",
    bio: "Finishes your sentences. Also your sandwich. Also the sandwich after that." },
  default: { pronouns: "hiss/$?", treat: "stdout",
    bio: "A stray that wandered in from $SHELL. Doesn't talk much, just stares at the cursor." },
  herder: { pronouns: "boss/human", treat: "coffee",
    bio: "Professional kitten herder. Has been scratched by every model on this list and keeps coming back." },
};

// The thought bubble: what it's doing, as a cat would put it.
const MOOD = {
  working: { frames: ["kneading the code", "kneading the code ·", "kneading the code · ·", "kneading the code · · ·"], ms: 380 },
  blocked: { frames: ["needs pets", "needs pets!", "needs pets!!", "NEEDS PETS!!!"], ms: 300 },
  idle: { frames: ["napping z", "napping zZ", "napping zZz", "napping zZzZ"], ms: 600 },
  done: { frames: ["left a dead mouse on your desk (done)"], ms: 1000 },
  online: { frames: ["staring at a wall", "staring at a wall", "staring at you"], ms: 1400 },
  offline: { frames: ["gone outside"], ms: 1000 },
};

// Avatar decorations: a ring in a color, and an icon set at those angles
// (degrees from the top) in those sizes and colors.
const DECOR = {
  ears: { ring: "#ff73fa", icon: "cat", at: [0], size: [30], colors: ["#ffd1f7"] },
  halo: { ring: "#f0b232", icon: "sparkle", at: [0, 72, 144, 216, 288], size: [16, 12], colors: ["#ffe08a", "#ffffff"] },
  flowers: { ring: "#57f287", icon: "flower", at: [-60, -30, 0, 30, 60], size: [14, 16, 18, 16, 14], colors: ["#ff9ad5", "#ffffff", "#9b84ee"] },
  hearts: { ring: "#f23f43", icon: "heart", at: [0, 72, 144, 216, 288], size: [14, 12], colors: ["#f23f43", "#ff73fa"] },
  crown: { ring: "#f1c40f", icon: "crown", at: [0], size: [30], colors: ["#f1c40f"] },
};

// Which kind of kitten: from the program its terminal runs (its picture is its own now).
const kindOf = (m, t) => m.owner ? "herder"
  : ["claude", "pi", "codex", "copilot"].find((k) => `${t?.program?.key ?? ""} ${t?.program?.name ?? ""} ${t?.agent ?? ""}`.toLowerCase().includes(k)) ?? "default";

export default class Profile extends View {
  // Its animated portrait: the frames in turn, each for its own time, while
  // the card is open (Herdr draws a GIF's first frame only).
  init(_props, cx) {
    this.k = 0;
    this.frames = null;
    const m = (props() ?? {}).m;
    const gif = m ? nitro(m.address ?? "you", Boolean(m.owner)).gif : null;
    if (!gif) return;
    cx.spawn(async (cx) => {
      try { this.frames = JSON.parse((await readTextFile(`${appHome()}/${gif}/frames.json`)) ?? "null"); } catch (_e) { this.frames = null; }
      if (!this.frames?.length) return;
      const next = (cx) => {
        this.k = (this.k + 1) % this.frames.length;
        if (this.k === 0) this.warm = true; // every frame has been drawn once: loaded
        cx.notify();
        cx.timer.after(this.frames[this.k].ms, next);
      };
      cx.timer.after(this.frames[0].ms, next);
    });
  }

  render() {
    // Opened bare (herdr-app check, a preview): show yours.
    const { m = { ...ME, address: null, status: "done", role: "owner", owner: true }, herd = 0 } = props() ?? {};
    // Its own lore (made up from its session, see discord-members' lore.js), else its kind's.
    const t = m.address ? terminals().find((x) => x.address === m.address) : null;
    const kind = kindOf(m, t), lore = { ...(LORE[kind] ?? LORE.default), ...(m.lore ?? {}) };
    // Its status as the member list shows it, live (not as it was when the card
    // opened): the app's view of it (done until you've looked), mid-turn
    // counting as working even when the agent's own report says idle.
    const all = everyone(), now = m.address ? [...all.top, ...all.subs].find((x) => x.address === m.address) : null;
    const status = typing(now ?? m) ? "working" : now?.status ?? (now || m.owner ? m.status : "offline") ?? "offline";
    const p = presence(m.owner ? "done" : status), role = ROLES[m.role];
    const mood = MOOD[m.owner ? "online" : status] ?? MOOD.online;
    const turn = t?.turn ?? 0;
    const lives = m.owner ? 9 : Math.max(1, 9 - Math.floor(turn / 3));
    const cwd = (t?.cwd ?? "").replace(home(), "~") || (m.owner ? "~ (everywhere at once)" : "a cardboard box");
    const handle = `${m.name.toLowerCase().replace(/\s+/g, ".")}${m.address ? `#${m.address}` : ""}`;
    const n = nitro(m.address ?? "you", Boolean(m.owner)), [main, accent] = n.theme;
    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const since = new Date(t?.created_ms ?? Date.now());

    const label = (s) => div().text_size(11).font_bold().text_color(C.header).child(s.toUpperCase());
    const section = (title, body) => v_flex().gap(6).child(label(title)).child(body);

    // The banner: a gradient in the kitten's colors, twinkling sparkles, a paw trail and a yarn ball that bobs.
    const sparkle = (x, y, s, period) => div().absolute().left(x).top(y)
      .loop("opacity", { from: 0.15, to: 0.95, period }).child(icon("sparkle", s, "#ffffff"));
    const paws = [[150, 70, -1], [178, 56, 1], [206, 66, -1], [234, 50, 1]].map(([x, y], i) =>
      div().absolute().left(x).top(y).opacity(0.12 + i * 0.07).child(icon("paw", 14, "#ffffff")));
    const banner = div().relative().h(108).w_full().rounded_t(8).overflow_hidden()
      .child(image(`mods/discord-kit/banners/${LORE[kind] ? kind : "default"}.svg`).absolute().left(0).top(0).w(300).h(108))
      // Its Nitro theme, washed over the banner.
      .child(div().absolute().left(0).top(0).w(300).h(108).bg(`${accent}40`))
      .child(sparkle(30, 16, 12, 1700)).child(sparkle(120, 28, 9, 1100)).child(sparkle(266, 12, 14, 2300))
      .child(sparkle(220, 84, 8, 1500)).children(paws)
      .child(div().absolute().right(18).top(30).loop("top", { from: 22, to: 40, period: 1300 })
        .child(icon("yarn", 30, "#ffffffcc")));

    // Portrait, cut out of the card like Discord's: animated (Nitro), with its
    // avatar decoration over it, shimmering.
    // Until it has played once, every frame is drawn under the shown one, so
    // each is loaded before its turn (a first load would stutter).
    const frame = (f) => `${n.gif}/${f}`;
    const portrait = div().absolute().left(14).top(62).p(6).rounded_full().bg(CARD)
      .child(div().relative().size(80)
        .when(Boolean(n.gif && this.frames && !this.warm), (el) => el.children(this.frames.map((f) =>
          div().absolute().top(0).left(0).child(image(frame(f.file)).size(80).rounded_full()))))
        .child(div().absolute().top(0).left(0)
          .child(picture(n.gif ? frame(this.frames?.[this.k]?.file ?? "00.png") : m.pic, 80, m.owner ? "done" : status, CARD))));
    // Its avatar decoration: a ring with icons set around it (Lucide's: cat,
    // sparkles, flowers, hearts, or your crown), shimmering.
    const deco = DECOR[n.deco] ?? DECOR.halo;
    const decoration = div().absolute().left(0).top(48).size(120).loop("opacity", { from: 0.8, to: 1, period: 1800 })
      .child(div().absolute().left(8).top(8).size(104).rounded_full().border(3).border_color(deco.ring))
      .children(deco.at.map((deg, i) => {
        const r = (deg - 90) * Math.PI / 180, s = deco.size[i % deco.size.length];
        return div().absolute().left(60 + 52 * Math.cos(r) - s / 2).top(60 + 52 * Math.sin(r) - s / 2)
          .child(icon(deco.icon, s, deco.colors[i % deco.colors.length]));
      }));

    // The profile effect: its particles drifting up the whole card.
    const effect = div().absolute().top(0).left(0).size_full().children([24, 62, 110, 150, 196, 236, 272].map((x, i) =>
      div().absolute().left(x).loop("top", { from: 640, to: 90 + (i % 3) * 30, period: 4200 + i * 650 })
        .child(div().loop("opacity", { from: 0, to: 0.7, period: 2100 + i * 325 }).child(icon(n.effect.icon, 10 + (i % 3) * 3, n.effect.color)))));

    // Badges, top-right under the banner.
    const badge = (n, c) => div().size(22).rounded(4).flex().items_center().justify_center().child(icon(n, 16, c));
    const badges = h_flex().absolute().right(12).top(116).gap(2).p(3).rounded(8).bg(INNER)
      .child(div().size(22).rounded(4).flex().items_center().justify_center().child(icon("nitro", 16, "#ff73fa")))
      .child(badge("paw", "#ff73fa")).child(badge("fish", "#5dade2")).child(badge("yarn", "#f0b232"))
      .when(Boolean(m.owner), (el) => el.child(badge("crown", "#f1c40f")));

    // A thought bubble trailing off the portrait.
    const bubble = h_flex().gap(6).items_center()
      .child(v_flex().gap(2).child(div().size(6).rounded_full().bg(INNER)).child(div().ml(5).size(9).rounded_full().bg(INNER)))
      .child(div().px(10).py(6).rounded(12).bg(INNER).text_size(13).text_color(C.text).frames(mood.frames, mood.ms));

    const hearts = h_flex().gap(3).children(Array.from({ length: 9 }, (_, i) =>
      i < lives
        ? (lives <= 3 ? div().loop("opacity", { from: 0.4, to: 1, period: 700 }) : div()).child(icon("heart", 14, C.red))
        : div().child(icon("heart", 14, C.cardRaised))));

    // Purr-o-meter: loud and wobbly while working, a red alarm when blocked, a quiet rumble when napping.
    const meterW = 260;
    const level = { working: null, blocked: 1, done: 1, idle: 0.22, online: 0.4, offline: 0.05 }[m.owner ? "done" : status] ?? 0.3;
    const meterColor = status === "blocked" && !m.owner ? C.red : main;
    let fill = div().h_full().rounded_full().bg(meterColor);
    fill = level === null ? fill.loop("width", { from: meterW * 0.55, to: meterW, period: 650 }) : fill.w(meterW * level);
    if (status === "blocked" && !m.owner) fill = fill.loop("opacity", { from: 0.35, to: 1, period: 400 });
    const meter = div().w(meterW).h(8).rounded_full().bg(C.cardRaised).overflow_hidden().child(fill);

    const chip = (c, text) => h_flex().gap(4).items_center().px(6).h(22).rounded(4).bg(C.cardRaised)
      .child(div().size(10).rounded_full().bg(c)).child(div().text_size(12).text_color(C.text).child(text));
    const roles = h_flex().flex_wrap().gap(4)
      .child(chip(role?.color ?? C.gray, role?.name ?? "Stray"))
      .child(chip(p.color, p.word))
      .when(!m.owner, (el) => el.child(chip(C.blurple, "APP")))
      .when(Boolean(m.owner), (el) => el.child(chip("#ff73fa", `Herds ${herd} kitten${herd === 1 ? "" : "s"}`)));

    const inner = v_flex().flex_none().mx(12).p(12).gap(12).rounded(8).bg(INNER)
      .child(section("About me", div().text_size(13).text_color(C.text).child(lore.bio)))
      .child(section("Curled up in", div().truncate().text_size(12).font_family("Cascadia Mono NF").text_color(C.muted).child(cwd)))
      .child(h_flex().justify_between().items_end()
        .child(section("Nine lives", hearts))
        .child(v_flex().items_end().gap(6).child(label("Treats"))
          .child(h_flex().gap(4).items_center().child(icon("fish", 14, "#5dade2"))
            .child(div().text_size(13).font_semibold().text_color(C.header).child(m.owner ? "∞" : String(turn))))))
      .child(section("Purr-o-meter", meter))
      .child(section("Roles", roles));

    return v_flex().id("root").relative().size_full().rounded(8).bg(CARD).border(2).border_color(main).overflow_hidden()
      // Fixed-height header (banner + portrait hanging off it): never let a long card squeeze it under the name.
      .child(div().relative().flex_none().w_full().h(160).child(banner).child(portrait).child(decoration).child(badges))
      .child(v_flex().flex_none().px(16).pt(2).pb(10).gap(1)
        .child(h_flex().gap(6).items_center()
          .child(div().text_size(20).font_bold().text_color(C.header).child(m.name))
          .when(Boolean(m.owner), (el) => el.child(icon("crown", 16, "#f1c40f"))))
        .child(h_flex().gap(6).text_size(13).text_color(C.muted)
          .child(div().child(handle)).child(div().child("•")).child(div().child(lore.pronouns)))
        .child(h_flex().gap(5).items_center().pt(2).text_size(12).text_color(accent)
          .child(icon("nitro", 12, accent))
          .child(div().child(`Nitro since ${MONTHS[since.getMonth()]} ${since.getDate()}, ${since.getFullYear()}`))))
      .child(div().flex_none().px(16).pb(10).child(bubble))
      .child(inner)
      .child(h_flex().flex_none().px(16).py(10).gap(6).items_center().text_size(12).text_color(C.dim)
        .child(icon("paw", 12, C.dim))
        .child(div().child(`Favorite treat: ${lore.treat} · click to pet`)))
      .child(effect);
  }
}
