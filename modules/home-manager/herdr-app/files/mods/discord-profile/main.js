// The profile popout the member list opens while you hover someone: a kitten's
// banner (sparkles, a bobbing ball of yarn), its portrait, a thought bubble of
// what it's up to, and its stats: nine lives, treats (turns), a purr-o-meter.
// Purely cosmetic: it shows props().m from discord-members and reads the live
// terminal for its folder and turn count.
import { View, div, image } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { props, terminals, home } from "herdr";
import { C, icon, picture, presence, peek, ROLES, ME } from "./kit.js";

const CARD = "#232428", INNER = "#111214";

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

const kindOf = (pic) => pic?.includes("herder") ? "herder" : /kitten-(\w+)\.\w+$/.exec(pic ?? "")?.[1] ?? "default";

export default class Profile extends View {
  render() {
    // Opened bare (herdr-app check, a preview): show yours.
    const { m = { ...ME, address: null, status: "done", role: "owner", owner: true }, herd = 0 } = props() ?? {};
    const kind = kindOf(m.pic), lore = LORE[kind] ?? LORE.default;
    const t = m.address ? terminals().find((x) => x.address === m.address) : null;
    // Mid-turn counts as working even when the agent's own status says idle.
    const status = peek(m.address).typing ? "working" : t?.status ?? m.status ?? "offline";
    const p = presence(m.owner ? "done" : status), role = ROLES[m.role];
    const mood = MOOD[m.owner ? "online" : status] ?? MOOD.online;
    const turn = t?.turn ?? 0;
    const lives = m.owner ? 9 : Math.max(1, 9 - Math.floor(turn / 3));
    const cwd = (t?.cwd ?? "").replace(home(), "~") || (m.owner ? "~ (everywhere at once)" : "a cardboard box");
    const handle = `${m.name.toLowerCase().replace(/\s+/g, ".")}${m.address ? `#${m.address}` : ""}`;

    const label = (s) => div().text_size(11).font_bold().text_color(C.header).child(s.toUpperCase());
    const section = (title, body) => v_flex().gap(6).child(label(title)).child(body);

    // The banner: a gradient in the kitten's colors, twinkling sparkles, a paw trail and a yarn ball that bobs.
    const sparkle = (x, y, s, period) => div().absolute().left(x).top(y)
      .loop("opacity", { from: 0.15, to: 0.95, period }).child(icon("sparkle", s, "#ffffff"));
    const paws = [[150, 70, -1], [178, 56, 1], [206, 66, -1], [234, 50, 1]].map(([x, y], i) =>
      div().absolute().left(x).top(y).opacity(0.12 + i * 0.07).child(icon("paw", 14, "#ffffff")));
    const banner = div().relative().h(108).w_full().rounded_t(8).overflow_hidden()
      .child(image(`mods/discord-kit/banners/${LORE[kind] ? kind : "default"}.svg`).absolute().left(0).top(0).w(300).h(108))
      .child(sparkle(30, 16, 12, 1700)).child(sparkle(120, 28, 9, 1100)).child(sparkle(266, 12, 14, 2300))
      .child(sparkle(220, 84, 8, 1500)).children(paws)
      .child(div().absolute().right(18).top(30).loop("top", { from: 22, to: 40, period: 1300 })
        .child(icon("yarn", 30, "#ffffffcc")));

    // Portrait, cut out of the card like Discord's.
    const portrait = div().absolute().left(14).top(62).p(6).rounded_full().bg(CARD)
      .child(picture(m.pic, 80, m.owner ? "done" : status, CARD));

    // Badges, top-right under the banner.
    const badge = (n, c) => div().size(22).rounded(4).flex().items_center().justify_center().child(icon(n, 16, c));
    const badges = h_flex().absolute().right(12).top(116).gap(2).p(3).rounded(8).bg(INNER)
      .child(badge("paw", "#ff73fa")).child(badge("fish", "#5dade2")).child(badge("yarn", "#f0b232"))
      .when(Boolean(m.owner), (el) => el.child(badge("crown", "#f1c40f")));

    // A thought bubble trailing off the portrait.
    const bubble = h_flex().gap(6).items_center()
      .child(v_flex().gap(2).child(div().size(6).rounded_full().bg(INNER)).child(div().ml(5).size(9).rounded_full().bg(INNER)))
      .child(div().px(10).py(6).rounded(12).bg(INNER).text_size(13).text_color(C.text).frames(mood.frames, mood.ms));

    const hearts = h_flex().gap(3).children(Array.from({ length: 9 }, (_, i) =>
      i < lives
        ? (lives <= 3 ? div().loop("opacity", { from: 0.4, to: 1, period: 700 }) : div()).child(icon("heart", 14, C.red))
        : div().child(icon("heart", 14, "#3a3c42"))));

    // Purr-o-meter: loud and wobbly while working, a red alarm when blocked, a quiet rumble when napping.
    const meterW = 260;
    const level = { working: null, blocked: 1, done: 1, idle: 0.22, online: 0.4, offline: 0.05 }[m.owner ? "done" : status] ?? 0.3;
    const meterColor = status === "blocked" && !m.owner ? C.red : role?.color ?? C.blurple;
    let fill = div().h_full().rounded_full().bg(meterColor);
    fill = level === null ? fill.loop("width", { from: meterW * 0.55, to: meterW, period: 650 }) : fill.w(meterW * level);
    if (status === "blocked" && !m.owner) fill = fill.loop("opacity", { from: 0.35, to: 1, period: 400 });
    const meter = div().w(meterW).h(8).rounded_full().bg("#2e3035").overflow_hidden().child(fill);

    const chip = (c, text) => h_flex().gap(4).items_center().px(6).h(22).rounded(4).bg("#2b2d31")
      .child(div().size(10).rounded_full().bg(c)).child(div().text_size(12).text_color(C.text).child(text));
    const roles = h_flex().flex_wrap().gap(4)
      .child(chip(role?.color ?? C.gray, role?.name ?? "Stray"))
      .child(chip(p.color, p.word))
      .when(!m.owner, (el) => el.child(chip(C.blurple, "BOT")))
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

    return v_flex().id("root").size_full().rounded(8).bg(CARD).border(1).border_color("#ffffff10").overflow_hidden()
      // Fixed-height header (banner + portrait hanging off it): never let a long card squeeze it under the name.
      .child(div().relative().flex_none().w_full().h(160).child(banner).child(portrait).child(badges))
      .child(v_flex().flex_none().px(16).pt(2).pb(10).gap(1)
        .child(h_flex().gap(6).items_center()
          .child(div().text_size(20).font_bold().text_color(C.header).child(m.name))
          .when(Boolean(m.owner), (el) => el.child(icon("crown", 16, "#f1c40f"))))
        .child(h_flex().gap(6).text_size(13).text_color(C.muted)
          .child(div().child(handle)).child(div().child("•")).child(div().child(lore.pronouns))))
      .child(div().flex_none().px(16).pb(10).child(bubble))
      .child(inner)
      .child(h_flex().flex_none().px(16).py(10).gap(6).items_center().text_size(12).text_color(C.dim)
        .child(icon("paw", 12, C.dim))
        .child(div().child(`Favorite treat: ${lore.treat} · click to pet`)));
  }
}
