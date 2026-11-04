// The Messages list: large title, search, pinned conversations as circles
// (agents that are busy or need you), then every tab as a conversation and
// sub-agents as conversations started by their parent.
import { View, div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { run, spaces, terminals } from "herdr";
import { C, icon, avatar, typing, chat, subAgents, clock } from "./kit.js";

export default class List extends View {
  init(_props, cx) {
    cx.timer.every(1000, (cx) => { if (spaces().some((s) => s.tabs.some((t) => t.status === "working"))) cx.notify(); });
  }

  pinned(c) {
    return v_flex().id(`pin-${c.id}`).w(96).items_center().gap(6).cursor_pointer().relative()
      .on_click(() => { run("space.select", { id: c.space.id }); run("tab.select", { id: c.id }); })
      .when(c.status === "working", (el) => el.child(div().absolute().top(-6).right(4).child(typing(0.7))))
      .when(c.status === "blocked" || c.status === "done", (el) => el.child(div().absolute().top(2).left(10).size(12).rounded_full().bg(C.blue)))
      .child(avatar(c.name, 72, c.program))
      .child(div().max_w(92).truncate().text_size(12).text_color(c.space.active && c.tab.active ? C.blue : C.secondary).child(c.name));
  }

  row(key, name, program, preview, time, unread, active, action) {
    return h_flex().id(key).h(76).pl(6).gap(8).items_center().cursor_pointer().rounded(10).mx(8)
      .bg(active ? C.blue : C.white).hover((s) => s.bg(active ? C.blue : "#f2f2f7")).on_click(action)
      .child(div().w(10).flex_none().child(unread ? div().size(10).rounded_full().bg(active ? C.white : C.blue) : div()))
      .child(avatar(name, 48, program))
      .child(v_flex().flex_1().min_w(0).h_full().justify_center().pr(10).gap(1).border_b(active ? 0 : 1).border_color("#e5e5ea")
        .child(h_flex().gap(6).items_center()
          .child(div().flex_1().min_w(0).truncate().text_size(16).font_semibold().text_color(active ? C.white : C.label).child(name))
          .child(div().flex_none().text_size(14).text_color(active ? "#ffffffcc" : C.secondary).child(time))
          .child(icon("chev", 14, active ? "#ffffffcc" : C.tertiary)))
        .child(div().truncate().text_size(14.5).text_color(active ? "#ffffffdd" : C.secondary).child(preview)));
  }

  render() {
    const chats = spaces().flatMap((s) => s.tabs.map((t) => chat(t, s)));
    const pins = chats.filter((c) => c.status === "working" || c.status === "blocked");
    const rows = [];
    for (const c of chats) {
      const active = c.space.active && c.tab.active;
      const preview = c.status === "working" ? "typing…" : c.status === "blocked" ? "Needs your reply" : c.title || "No messages";
      rows.push(this.row(`c-${c.id}`, c.name, c.program, preview, clock(c.tab.changed_at),
        c.status === "blocked" || c.status === "done", active,
        () => { run("space.select", { id: c.space.id }); run("tab.select", { id: c.id }); }));
      for (const t of subAgents(c.panes.map((p) => p.terminal).filter(Boolean))) {
        const word = t.status === "working" ? "typing…" : t.status === "blocked" ? "Needs your reply" : "Seen";
        rows.push(this.row(`s-${t.address}`, t.name ?? t.address, t.program, `${c.name} added them · ${word}`, t.address,
          t.status === "blocked", false, () => run("agent.focus", { terminal: t.address })));
      }
    }
    return v_flex().id("root").size_full().bg(C.white)
      .child(h_flex().h(44).px(18).items_center()
        .child(div().id("edit").text_size(17).text_color(C.blue).cursor_pointer().on_click(() => run("app.palette")).child("Edit"))
        .child(div().flex_1())
        .child(div().id("compose").cursor_pointer().on_click(() => run("tab.new")).child(icon("compose", 22, C.blue))))
      .child(div().px(18).pb(8).text_size(34).font_bold().text_color(C.label).child("Messages"))
      .child(h_flex().id("search").mx(16).mb(10).h(36).px(10).gap(6).items_center().rounded(10).bg(C.fill)
        .text_size(17).text_color(C.secondary).cursor_pointer().on_click(() => run("app.palette"))
        .child(icon("search", 16, C.secondary)).child("Search"))
      .child(v_flex().id("list").flex_1().min_h(0).overflow_y_scrollbar()
        .when(pins.length > 0, (el) => el.child(h_flex().flex_wrap().justify_center().gap(10).px(12).pt(12).pb(14).children(pins.map((c) => this.pinned(c)))))
        .children(rows));
  }
}
