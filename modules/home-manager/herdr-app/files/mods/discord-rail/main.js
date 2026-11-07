// The server rail: Home, then every space as a server icon (round, squircle on
// hover or when selected, with the white pill on the left), a red mention badge
// when an agent there needs you, then Add a Server and Explore. Hovering eases
// in like Discord's: the icon morphs and the pill grows.
import { View, div, svg } from "gpui-kit";
import { v_flex } from "gpui-base";
import { run, spaces, shared } from "herdr";
import { C, icon, initials } from "./kit.js";

const EASE = { duration: 170, easing: "ease-out" };

export default class Rail extends View {
  init() { this.hover = null; }

  // GPUI animates opacity, size and position, not colors or corners: the round
  // icon and the lit squircle are two layers that cross-fade, which reads as
  // the morph.
  // glow: a second color, a soft blob in the lit icon's corner (panels take
  // only flat colors, so this stands in for a gradient).
  morph(id, lit, color, rest, shine, glow = null, restBg = C.icon) {
    const layer = (key, radius, bg, on, content) => div().id(`${id}-${key}`).absolute().top(0).left(0).size(48).rounded(radius).bg(bg)
      .overflow_hidden().flex().items_center().justify_center().opacity(on ? 1 : 0).transition("opacity", EASE)
      .when(Boolean(glow) && key === "lit", (el) => el.child(div().absolute().right(-26).bottom(-26).size(60).rounded_full().bg(`${glow}8c`)))
      .child(content);
    return div().relative().size(48).flex_none()
      .child(layer("rest", 24, restBg, !lit, rest))
      .child(layer("lit", 16, color, lit, shine));
  }

  hoverable(id, el) {
    return el.on_hover((h, cx) => { this.hover = h ? id : this.hover === id ? null : this.hover; cx.notify(); });
  }

  render() {
    const server = (s) => {
      const id = `srv-${s.id}`, on = s.active, hov = this.hover === id;
      const name = s.name === "~" ? "Home" : s.name;
      const needs = s.tabs.filter((t) => t.status === "blocked").length;
      const unread = s.tabs.some((t) => t.status === "done");
      // The pill: tall for the open server, half for a hovered one, a dot for unread.
      const pill = on ? 40 : hov ? 20 : unread ? 8 : 0;
      // Its picture: a brand logo (Simple Icons) or icon (Lucide) on its color,
      // picked to fit it by discord-members; else its initials.
      const look = (shared("discord.servers") ?? {})[s.id];
      const pic = Boolean(look?.icon && look.kind);
      const letters = (color) => pic ? svg(`mods/discord-kit/${look.kind}/${look.icon}.svg`).size(26).flex_none().text_color(look.tint)
        : div().text_size(16).font_semibold().text_color(color).child(initials(name));
      return this.hoverable(id, div().id(id).relative().w_full().h(56).flex().items_center().justify_center().cursor_pointer())
        .on_click(() => run("space.select", { id: s.id }))
        .child(div().id(`${id}-pill`).absolute().left(0).top(28 - pill / 2).w(4).h(pill).rounded_tr(4).rounded_br(4).bg("#ffffff")
          .transition("height", EASE).transition("top", EASE))
        .child(this.morph(id, on || hov, pic ? look.color : C.blurple, letters(C.text), letters("#ffffff"), pic ? look.glow : null, pic ? look.color : C.icon))
        .when(needs > 0, (el) => el.child(div().absolute().right(10).bottom(6).min_w(18).h(18).px(5).rounded(9).bg(C.red).border(3).border_color(C.rail)
          .flex().items_center().justify_center().text_size(11).font_bold().text_color("#ffffff").child(String(needs))));
    };
    const tool = (id, ic, action) => this.hoverable(id, div().id(id).relative().w_full().h(56).flex().items_center().justify_center().cursor_pointer())
      .on_click(action)
      .child(this.morph(id, this.hover === id, C.green, icon(ic, 22, C.green), icon(ic, 22, "#ffffff")));
    return v_flex().id("root").size_full().bg(C.rail).pt(12).overflow_y_scrollbar()
      .child(div().id("home").w_full().h(56).flex().items_center().justify_center()
        .child(div().size(48).rounded(16).bg(C.blurple).flex().items_center().justify_center().child(icon("home", 26, "#ffffff"))))
      .child(div().mx(20).my(4).h(2).rounded(1).bg(C.selected))
      .children(spaces().map(server))
      .child(tool("add", "plus", () => run("space.new")))
      .child(tool("explore", "compass", () => run("app.palette")));
  }
}
