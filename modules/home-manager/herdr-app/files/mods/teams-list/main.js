// The list column: every tab as a chat (Chat), spaces as teams with tabs as
// channels (Teams), or agents' news as a feed (Activity).
import { View, div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { run, shared, spaces, agents, terminals } from "herdr";
import { BRAND, icon, avatar, presence, allChats, since, clock, orphanAgents } from "./kit.js";

const NEWS = { blocked: "is waiting for your reply", done: "finished and sent you a message", working: "is typing…", idle: "was here" };

export default class List extends View {
  init(_props, cx) {
    this.open = {};
    cx.timer.every(1000, (cx) => { if (spaces().some((s) => s.tabs.some((t) => t.working_since))) cx.notify(); });
  }

  header(title, buttons) {
    return h_flex().h(56).px(16).items_center().gap(4).flex_none()
      .child(div().flex_1().text_size(18).font_bold().text_color("#242424").child(title))
      .children(buttons.map(([id, ic, action]) => h_flex().id(id).size(32).justify_center().items_center().rounded(4)
        .hover((s) => s.bg("#e0e0e0")).on_click(action).child(icon(ic, 18, "#424242"))));
  }

  section(label) {
    return div().px(16).pt(12).pb(4).text_size(12).text_color("#616161").child(`▾ ${label}`);
  }

  subName(t) {
    return t.name ?? t.program?.name ?? t.address;
  }

  subRow(t, depth, key) {
    const p = presence(t.status ?? null), name = this.subName(t);
    const what = typeof t.report === "string" ? t.report : t.report?.title ?? t.report?.message ?? "";
    return h_flex().id(`${key}-${t.address}`).mx(8).h(40).pl(22 + depth * 18).pr(10).gap(8).items_center().rounded(4).cursor_pointer()
      .hover((s) => s.bg("#e8e8e8")).on_click(() => run("agent.focus", { terminal: t.address }))
      .child(div().w(10).h(20).flex_none().border_l(2).border_b(2).border_color("#d1d1d1").rounded(2))
      .child(avatar(name, 26, t.status ?? null, "#f0f0f0", t.program))
      .child(v_flex().flex_1().min_w(0)
        .child(h_flex().gap(6).items_center()
          .child(div().flex_1().min_w(0).truncate().text_size(13).text_color("#242424").child(name))
          .child(div().flex_none().text_size(11).text_color("#8a8886").child(t.address)))
        .child(div().truncate().text_size(11.5).text_color(t.status === "working" ? BRAND : "#616161")
          .child(what ? `${p.word} · ${what}` : `${p.word} · ${t.program?.name ?? t.agent ?? ""}`)));
  }

  thread(c) {
    if (!c.subs.length) return [];
    const open = this.open[`thread-${c.id}`] ?? true;
    const busy = c.subs.filter((s) => s.t.status === "working").length;
    const toggle = h_flex().id(`thread-${c.id}`).mx(8).h(26).pl(56).gap(6).items_center().rounded(4).cursor_pointer()
      .text_size(12).text_color(BRAND).font_semibold().hover((s) => s.bg("#e8e8e8"))
      .on_click((_e, cx) => { this.open[`thread-${c.id}`] = !open; cx.notify(); })
      .child(`${open ? "▾" : "▸"} ${c.subs.length} ${c.subs.length === 1 ? "agent" : "agents"} in this chat${busy ? ` · ${busy} busy` : ""}`);
    return [toggle, ...(open ? c.subs.map(({ t, depth }) => this.subRow(t, depth, `sub-${c.id}`)) : [])];
  }

  chatRow(c) {
    const active = c.space.active && c.tab.active;
    const preview = c.tab.status === "working" && c.tab.working_since ? `typing… ${since(c.tab.working_since)}`
      : c.title || c.cwd || "No messages yet";
    const unread = c.status === "blocked" || c.status === "done";
    return h_flex().id(`chat-${c.id}`).mx(8).h(56).px(10).gap(10).items_center().rounded(4).cursor_pointer()
      .bg(active ? "#ffffff" : "#00000000").when(active, (s) => s.shadow_sm())
      .hover((s) => s.bg(active ? "#ffffff" : "#e8e8e8"))
      .on_click(() => { run("space.select", { id: c.space.id }); run("tab.select", { id: c.id }); })
      .child(avatar(c.name, 36, c.status ?? null, active ? "#ffffff" : "#f0f0f0", c.program))
      .child(v_flex().flex_1().min_w(0).gap(1)
        .child(h_flex().gap(6).items_center()
          .child(div().flex_1().min_w(0).truncate().text_size(14).text_color("#242424").when(unread, (s) => s.font_bold()).child(c.name))
          .child(div().flex_none().text_size(11.5).text_color("#616161").child(clock(c.tab.changed_at))))
        .child(h_flex().gap(6).items_center()
          .child(div().flex_1().min_w(0).truncate().text_size(12.5).text_color(c.tab.status === "working" ? BRAND : "#616161")
            .when(unread, (s) => s.font_semibold().text_color("#242424")).child(preview))
          .when(unread, (el) => el.child(div().size(8).flex_none().rounded_full().bg(c.status === "blocked" ? "#c4314b" : BRAND)))));
  }

  chats() {
    const all = allChats();
    const orphans = orphanAgents();
    const pinned = all.filter((c) => c.status === "blocked" || c.status === "working");
    const recent = all.filter((c) => !pinned.includes(c)).sort((a, b) => (b.tab.changed_at ?? 0) - (a.tab.changed_at ?? 0));
    return [
      this.header("Chat", [["filter", "filter", () => run("app.palette")], ["new", "edit", () => run("tab.new")]]),
      ...(pinned.length ? [this.section("Pinned"), ...pinned.flatMap((c) => [this.chatRow(c), ...this.thread(c)])] : []),
      this.section("Recent"), ...recent.flatMap((c) => [this.chatRow(c), ...this.thread(c)]),
      ...(orphans.length ? [this.section("Other agents"), ...orphans.map((t) => this.subRow(t, 0, "orphan"))] : []),
    ];
  }

  teams() {
    const rows = [this.header("Teams", [["new-team", "plus", () => run("space.new")]]), this.section("Your teams")];
    for (const s of spaces()) {
      const open = this.open[s.id] ?? s.active;
      rows.push(h_flex().id(`team-${s.id}`).mx(8).h(44).px(8).gap(10).items_center().rounded(4).cursor_pointer()
        .hover((x) => x.bg("#e8e8e8")).on_click((_e, cx) => { this.open[s.id] = !open; cx.notify(); })
        .child(div().w(10).text_size(10).text_color("#616161").child(open ? "▾" : "▸"))
        .child(div().size(32).rounded(6).bg(BRAND).flex().items_center().justify_center().text_color("#ffffff")
          .text_size(13).font_bold().child((s.name || "~").replace(/^~$/, "Home").slice(0, 2).toUpperCase()))
        .child(v_flex().flex_1().min_w(0)
          .child(div().truncate().text_size(14).font_semibold().text_color("#242424").child(s.name === "~" ? "Home" : s.name))
          .when(Boolean(s.branch), (el) => el.child(div().truncate().text_size(11.5).text_color("#616161").child(s.branch)))));
      if (open) s.tabs.forEach((t, i) => {
        const on = s.active && t.active, p = presence(t.status);
        rows.push(h_flex().id(`chan-${t.id}`).mx(8).h(32).pl(58).pr(10).gap(8).items_center().rounded(4).cursor_pointer()
          .bg(on ? "#ffffff" : "#00000000").hover((x) => x.bg(on ? "#ffffff" : "#e8e8e8"))
          .on_click(() => { run("space.select", { id: s.id }); run("tab.select", { id: t.id }); })
          .child(div().flex_1().truncate().text_size(13.5).text_color(on ? "#242424" : "#424242").when(on, (x) => x.font_semibold())
            .child(i === 0 ? "General" : (/^\d+$/.test(t.name) ? `Channel ${t.name}` : t.name)))
          .when(Boolean(t.status), (el) => el.child(div().size(8).rounded_full().bg(p.color))));
      });
    }
    return rows;
  }

  activity() {
    const subs = terminals().filter((t) => t.parent && t.status && !["finished", "exited", "ended"].includes(t.state))
      .map((t) => ({ address: t.address, status: t.status, program: t.program, app: t.agent, title: typeof t.report === "string" ? t.report : "",
        tab_name: `started by ${t.parent}`, space_name: (t.where ?? "").split(" / ")[0] || "~", name: t.name, seq: -1 }));
    const list = [...agents().sort((a, b) => b.seq - a.seq), ...subs];
    const rows = [this.header("Feed", [["feed-filter", "filter", () => run("app.palette")]])];
    if (!list.length) rows.push(div().p(16).text_size(13).text_color("#616161").child("You're all caught up."));
    for (const a of list) {
      const name = a.name ?? a.program?.name ?? a.app ?? a.address;
      rows.push(h_flex().id(`act-${a.address}`).mx(8).py(10).px(10).gap(10).items_start().rounded(4).cursor_pointer()
        .hover((x) => x.bg("#e8e8e8")).on_click(() => run("agent.focus", { terminal: a.address }))
        .child(avatar(name, 36, a.status, "#f0f0f0", a.program))
        .child(v_flex().flex_1().min_w(0).gap(2)
          .child(div().text_size(13).text_color("#242424").child(`${name} ${NEWS[a.status] ?? ""}`))
          .child(div().truncate().text_size(12).text_color("#616161").child(a.title || a.tab_name))
          .child(div().text_size(11).text_color("#8a8886").child(`${a.space_name === "~" ? "Home" : a.space_name} › ${a.tab_name || "General"}`))));
    }
    return rows;
  }

  render() {
    const view = shared("teams.view") ?? "chat";
    const rows = view === "teams" ? this.teams() : view === "activity" ? this.activity() : this.chats();
    return v_flex().id("root").size_full().bg("#f0f0f0").overflow_y_scrollbar().pb(8).children(rows);
  }
}
