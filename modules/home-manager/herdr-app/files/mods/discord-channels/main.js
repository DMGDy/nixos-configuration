// The channel list: the server name, the #agents forum (every agent run as a
// post), TEXT CHANNELS (one per tab, unread ones bold, a red badge when its
// agent needs you, typing dots while it works), the Agents voice channel (who's
// working right now: a green speaking ring while typing, a raised hand when one
// needs you), and the user panel.
import { View, div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { run, spaces, layout } from "herdr";
import { C, icon, picture, channel, herd, typing, dots, ME, ROLES } from "./kit.js";

function find(n, id) { if (n?.id === id) return n; for (const c of n?.children ?? []) { const f = find(c, id); if (f) return f; } return null; }
const view = (child) => run("layout.select", { stack: "convo-stack", child });

export default class Channels extends View {
  render() {
    const s = spaces().find((x) => x.active);
    const name = s ? (s.name === "~" ? "Home" : s.name) : "";
    const forum = (find(layout(), "convo-stack")?.active ?? "output") === "forum";
    const { top, subs } = herd();
    const everyone = [...top, ...subs];
    const rows = [];
    // The forum sits above the text channels, like a server's pinned forum.
    const busyCount = everyone.filter((m) => typing(m)).length, needCount = everyone.filter((m) => m.status === "blocked").length;
    rows.push(h_flex().id("ch-forum").mx(8).mt(12).h(34).px(8).gap(6).items_center().rounded(4).cursor_pointer()
      .bg(forum ? C.selected : C.side).hover((x) => x.bg(forum ? C.selected : C.hover))
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
      const c = channel(t), on = t.active && !forum, unread = t.status === "done" || t.status === "blocked";
      const here = everyone.filter((m) => m.tab === t.id);
      const busy = here.some((m) => typing(m));
      rows.push(h_flex().id(`ch-${t.id}`).relative().mx(8).h(34).px(8).gap(6).items_center().rounded(4).cursor_pointer()
        .bg(on ? C.selected : C.side).hover((x) => x.bg(on ? C.selected : C.hover))
        .on_click(() => { run("tab.select", { id: t.id }); if (forum) view("output"); })
        .when(unread && !on, (el) => el.child(div().absolute().left(-8).top(13).w(4).h(8).rounded_tr(4).rounded_br(4).bg("#ffffff")))
        .child(icon("hash", 20, on || unread ? C.header : C.dim))
        .child(div().flex_1().min_w(0).truncate().text_size(16).text_color(on || unread ? C.header : C.muted).when(unread || on, (x) => x.font_semibold()).child(c.name))
        .when(busy, (el) => el.child(dots(4, on ? C.header : C.muted)))
        .when(t.status === "blocked", (el) => el.child(div().min_w(16).h(16).px(4).rounded(8).bg(C.red).flex().items_center().justify_center()
          .text_size(11).font_bold().text_color("#ffffff").child("1"))));
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
      rows.push(h_flex().id(`va-${a.address}`).mx(8).pl(36).h(30).gap(8).items_center().rounded(4).cursor_pointer()
        .hover((x) => x.bg(C.hover)).on_click(() => { run("agent.focus", { terminal: a.address }); if (forum) view("output"); })
        .child(div().rounded_full().border(2).border_color(talking ? C.green : hand ? C.red : C.side)
          .when(talking, (x) => x.loop("opacity", { from: 0.55, to: 1, period: 700 })).child(picture(a.pic, 24)))
        .child(div().flex_1().min_w(0).truncate().text_size(14).text_color(talking ? C.header : C.muted).child(a.name))
        .when(hand, (el) => el.child(icon("hand", 14, C.yellow)))
        .when(talking && !hand, (el) => el.child(icon("mic", 14, C.green))));
    }
    if (!inCall.length) rows.push(div().pl(44).h(24).text_size(12).text_color(C.dim).child("Everyone's napping"));
    const ubtn = (id, ic, action) => div().id(id).size(32).rounded(4).flex().items_center().justify_center().hover((x) => x.bg(C.selected)).on_click(action).child(icon(ic, 18, C.muted));
    return v_flex().id("root").size_full().bg(C.side)
      .child(h_flex().h(48).px(16).items_center().border_b(1).border_color(C.border).text_size(16).font_semibold().text_color(C.header)
        .child(div().flex_1().truncate().child(name)).child(icon("chev", 16, C.header)))
      .child(v_flex().id("chs").flex_1().min_h(0).overflow_y_scrollbar().pb(8).children(rows))
      .child(h_flex().h(52).px(8).gap(8).items_center().bg("#232428")
        .child(picture(ME.pic, 32, "done", "#232428"))
        .child(v_flex().flex_1().min_w(0)
          .child(div().truncate().text_size(14).font_semibold().text_color(ROLES.owner.color).child(ME.name))
          .child(div().truncate().text_size(12).text_color(C.muted).child("Herding kittens")))
        .child(ubtn("u-mic", "mic", () => {})).child(ubtn("u-head", "headset", () => {})).child(ubtn("u-gear", "gear", () => run("app.settings"))));
  }
}
