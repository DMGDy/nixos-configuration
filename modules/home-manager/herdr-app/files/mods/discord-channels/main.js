// The channel list: the server name, the #agents forum (every agent run as a
// post), TEXT CHANNELS (one per tab, unread ones bold, a red badge when its
// agent needs you, typing dots while it works), the Agents voice channel (who's
// working right now: a green speaking ring while typing, a raised hand when one
// needs you), and the user panel.
import { View, div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { run, spaces, layout } from "herdr";
import { C, icon, picture, channel, herd, typing, dots, smooth, livePill, streaming, watch, watching, stopWatching, borrowed, isShell, chatSub, openSub, closeSub, ME, ROLES } from "./kit.js";

function find(n, id) { if (n?.id === id) return n; for (const c of n?.children ?? []) { const f = find(c, id); if (f) return f; } return null; }
const view = (child) => run("layout.select", { stack: "convo-stack", child });

export default class Channels extends View {
  render() {
    const s = spaces().find((x) => x.active);
    const name = s ? (s.name === "~" ? "Home" : s.name) : "";
    const forum = (find(layout(), "convo-stack")?.active ?? "output") === "forum";
    const stack = find(layout(), "convo-stack")?.active ?? "output";
    const live = watching(stack);
    // The sub-agent open now: watched in a borrowed pane, or its chat.
    const watched = live ? borrowed() : stack === "output" ? chatSub() : null;
    const { top, subs } = herd();
    const everyone = [...top, ...subs];
    const rows = [];
    // The forum sits above the text channels, like a server's pinned forum.
    const busyCount = everyone.filter((m) => typing(m)).length, needCount = everyone.filter((m) => m.status === "blocked").length;
    rows.push(smooth(this, h_flex().id("ch-forum").mx(8).mt(12).h(34).px(8).gap(6).items_center().rounded(4).cursor_pointer()
      .bg(forum ? C.selected : C.clear), "ch-forum", forum ? C.selected : C.hover)
      .on_click(() => view(forum ? "output" : "forum"))
      .child(icon("forum", 20, forum ? C.header : C.dim))
      .child(div().flex_1().min_w(0).truncate().text_size(16).text_color(forum ? C.header : C.muted).when(forum, (x) => x.font_semibold()).child("agents"))
      .when(busyCount > 0, (el) => el.child(div().px(6).h(16).rounded(8).bg("#23a55a33").flex().items_center().text_size(11).font_bold().text_color(C.green).child(`${busyCount} live`)))
      .when(needCount > 0, (el) => el.child(div().min_w(16).h(16).px(4).rounded(8).bg(C.red).flex().items_center().justify_center()
        .text_size(11).font_bold().text_color("#ffffff").child(String(needCount)))));
    rows.push(h_flex().h(28).px(8).pt(16).gap(2).items_center().text_size(12).font_semibold().text_color(C.muted)
      .child(icon("chev", 12, C.muted)).child("TEXT CHANNELS").child(div().flex_1())
      .child(div().id("new-ch").cursor_pointer().on_click(() => run("tab.new")).child(icon("plus", 16, C.muted))));
    for (const t of s?.tabs ?? []) {
      const c = channel(t), on = t.active && !forum && !watched, unread = t.status === "done" || t.status === "blocked";
      const here = everyone.filter((m) => m.tab === t.id);
      const busy = here.some((m) => typing(m));
      const shell = isShell(t);
      rows.push(smooth(this, h_flex().id(`ch-${t.id}`).mx(8).h(34).px(8).gap(6).items_center().rounded(4).cursor_pointer()
        .bg(on ? C.selected : C.clear), `ch-${t.id}`, on ? C.selected : C.hover)
        // Right-click or double-click: rename the channel (its tab).
        .on_mouse_down("right", () => run("tab.rename", { id: t.id }))
        .on_click((e) => {
          if (e?.click_count === 2) return run("tab.rename", { id: t.id });
          closeSub();
          run("tab.select", { id: t.id });
          // A shell channel has no one to chat with: open its terminal.
          if (shell) watch(null); else if (forum || live) stopWatching();
        })
        .when(unread && !on, (el) => el.child(div().absolute().left(-8).top(13).w(4).h(8).rounded_tr(4).rounded_br(4).bg("#ffffff")))
        .child(icon(shell ? "terminal" : "hash", shell ? 18 : 20, on || unread ? C.header : C.dim))
        .child(div().flex_1().min_w(0).truncate().text_size(16).text_color(on || unread ? C.header : C.muted).when(unread || on, (x) => x.font_semibold()).child(c.name))
        .when(busy, (el) => el.child(dots(4, on ? C.header : C.muted)))
        // Discord's "Edit Channel" gear, while hovered or selected: rename.
        .when(on || this.hot === `ch-${t.id}`, (el) => el.child(div().id(`edit-${t.id}`).size(18).flex_none().flex().items_center().justify_center().cursor_pointer()
          .on_mouse_down("left", (_e, cx) => cx.stop_propagation())
          .on_click((_e, cx) => { cx.stop_propagation(); run("tab.rename", { id: t.id }); })
          .child(icon("gear", 14, C.muted))))
        .when(t.status === "blocked", (el) => el.child(div().min_w(16).h(16).px(4).rounded(8).bg(C.red).flex().items_center().justify_center()
          .text_size(11).font_bold().text_color("#ffffff").child("1"))));
      // Its sub-agents, as threads under the channel (like Discord's sidebar
      // threads): clicking one watches its terminal, since it has no pane.
      for (const k of subs.filter((x) => x.tab === t.id)) {
        const sel = watched === k.address, id = `th-${k.address}`;
        rows.push(smooth(this, h_flex().id(id).ml(28).mr(8).h(28).px(6).gap(6).items_center().rounded(4).cursor_pointer()
          .bg(sel ? C.selected : C.clear), id, sel ? C.selected : C.hover)
          .on_click(() => openSub(k))
          .child(icon(k.agent ? "thread" : "terminal", 14, C.dim))
          .child(div().flex_1().min_w(0).truncate().text_size(14).text_color(sel ? C.header : C.muted).child(k.name))
          .when(typing(k), (el) => el.child(dots(3, C.muted)))
          .when(k.status === "blocked", (el) => el.child(icon("hand", 12, C.yellow))));
      }
    }
    // Voice: whoever is working right now is "in the call"; typing lights the
    // speaking ring, needing you raises a hand.
    const inCall = everyone.filter((m) => typing(m) || m.status === "blocked");
    rows.push(h_flex().h(28).px(8).pt(16).gap(2).items_center().text_size(12).font_semibold().text_color(C.muted)
      .child(icon("chev", 12, C.muted)).child("VOICE CHANNELS"));
    rows.push(h_flex().mx(8).h(34).px(8).gap(6).items_center().rounded(4).text_size(16).text_color(inCall.length ? C.header : C.muted)
      .child(icon("speaker", 20, inCall.length ? C.green : C.dim)).child(div().flex_1().child("Agents"))
      .when(inCall.length > 0, (el) => el.child(div().text_size(11).text_color(C.dim).child(`${inCall.length} in call`))));
    for (const a of inCall) {
      const talking = typing(a), hand = a.status === "blocked";
      rows.push(smooth(this, h_flex().id(`va-${a.address}`).mx(8).pl(36).h(30).gap(8).items_center().rounded(4).cursor_pointer(),
        `va-${a.address}`, C.hover).on_click(() => watch(a.address))
        .child(div().rounded_full().border(2).border_color(talking ? C.green : hand ? C.red : C.side)
          .when(talking, (x) => x.loop("opacity", { from: 0.55, to: 1, period: 700 })).child(picture(a.pic, 24)))
        .child(div().flex_1().min_w(0).truncate().text_size(14).text_color(talking ? C.header : C.muted).child(a.name))
        .when(streaming(a), (el) => el.child(livePill(9)))
        .when(hand, (el) => el.child(icon("hand", 14, C.yellow)))
        .when(talking && !hand, (el) => el.child(icon("mic", 14, C.green))));
    }
    if (!inCall.length) rows.push(div().pl(44).h(24).text_size(12).text_color(C.dim).child("Everyone's napping"));
    const ubtn = (id, ic, action) => smooth(this, div().id(id).size(32).rounded(4).flex().items_center().justify_center().cursor_pointer(), id, C.selected).on_click(action).child(icon(ic, 18, C.muted));
    return v_flex().id("root").size_full().bg(C.side)
      // The server name is the space's: click to rename it (Herdr asks for the name).
      .child(smooth(this, h_flex().id("server").h(48).px(16).items_center().border_b(1).border_color(C.border).text_size(16).font_semibold().text_color(C.header).cursor_pointer(),
        "server", C.hover, { radius: 0 })
        .on_click(() => run("space.rename", { id: s?.id }))
        .child(div().flex_1().truncate().child(name))
        .child(this.hot === "server" ? icon("gear", 16, C.header) : icon("chev", 16, C.header)))
      .child(v_flex().id("chs").flex_1().min_h(0).overflow_y_scrollbar().pb(8).children(rows))
      .child(h_flex().h(52).px(8).gap(8).items_center().bg(C.panel)
        .child(picture(ME.pic, 32, "done", C.card))
        .child(v_flex().flex_1().min_w(0)
          .child(div().truncate().text_size(14).font_semibold().text_color(ROLES.owner.color).child(ME.name))
          .child(div().truncate().text_size(12).text_color(C.muted).child("Herding kittens")))
        .child(ubtn("u-mic", "mic", () => {})).child(ubtn("u-head", "headset", () => {})).child(ubtn("u-gear", "gear", () => run("app.settings"))));
  }
}
