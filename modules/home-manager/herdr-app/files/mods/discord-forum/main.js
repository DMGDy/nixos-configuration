// The #agents forum channel: every agent run is a post. Its kitten is the
// author, its terminal title the post title, its status the post's tag
// (Working, Needs you, Done, Napping), its turn count the replies, and what it
// last said the preview. Sub-agents are a thread under their parent's post.
// Finished runs are archived at the bottom. Tags filter; the newest activity
// is on top; clicking a post opens its channel.
import { View, div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { run, home } from "herdr";
import { C, icon, picture, herd, typing, peek, dots, TAGS, tagOf, ROLES } from "./kit.js";

const open = (address) => { run("agent.focus", { terminal: address }); run("layout.select", { stack: "convo-stack", child: "output" }); };

export default class Forum extends View {
  init() {
    this.filter = null;
    this.archived = false;
    this.threads = {};
  }

  tag(key, small) {
    const t = TAGS[key];
    return h_flex().flex_none().gap(4).items_center().px(small ? 5 : 6).h(small ? 18 : 20).rounded(small ? 4 : 10).bg("#ffffff0d")
      .child(icon(t.icon, small ? 11 : 12, t.color))
      .child(div().text_size(small ? 11 : 12).font_medium().text_color(C.text).child(t.name));
  }

  post(m, subs) {
    const key = tagOf(m), busy = typing(m), said = peek(m.address).line;
    const kids = subs.filter((s) => s.parent === m.address);
    const showThread = this.threads[m.address] ?? kids.some((k) => typing(k) || k.status === "blocked");
    const where = (m.cwd ?? "").replace(home(), "~");
    return v_flex().id(`post-${m.address}`).flex_none().mx(16).p(14).gap(8).rounded(8).bg(C.side).cursor_pointer()
      .border(1).border_color(key === "blocked" ? "#f23f4366" : C.side)
      .hover((x) => x.bg("#2e3035").border_color(key === "blocked" ? C.red : "#3f4147"))
      .on_click(() => open(m.address))
      .child(h_flex().gap(8).items_center()
        .child(this.tag(key, true))
        .child(div().flex_1().min_w(0).truncate().text_size(16).font_semibold().text_color(C.header).child(m.title || `${m.name}'s run`)))
      .child(h_flex().gap(6).items_center().min_w(0)
        .child(picture(m.pic, 18))
        .child(div().flex_none().text_size(13).font_semibold().text_color(ROLES[m.role]?.color ?? C.text).child(`${m.name}:`))
        .child(busy
          ? h_flex().gap(6).items_center().child(dots(5, C.muted)).child(div().text_size(13).text_color(C.muted).child("is typing…"))
          : div().flex_1().min_w(0).truncate().text_size(13).text_color(C.muted).child(said ?? (key === "blocked" ? "needs you to answer something" : "…"))))
      .child(h_flex().gap(14).items_center().text_size(12).text_color(C.dim)
        .child(h_flex().gap(4).items_center().child(icon("forum", 14, C.dim)).child(`${m.turn ?? 0} ${m.turn === 1 ? "reply" : "replies"}`))
        .when(Boolean(where), (el) => el.child(div().truncate().max_w(280).child(where)))
        .child(div().flex_1())
        .when(kids.length > 0, (el) => el.child(h_flex().id(`th-${m.address}`).gap(6).items_center().px(6).h(22).rounded(4).hover((x) => x.bg(C.selected))
          .on_click((_e, cx) => { cx.stop_propagation(); this.threads[m.address] = !showThread; cx.notify(); })
          .child(h_flex().children(kids.slice(0, 3).map((k, i) => div().ml(i ? -6 : 0).rounded_full().border(2).border_color(C.side).child(picture(k.pic, 16)))))
          .child(div().text_color(C.link).child(`${kids.length} in thread`)))))
      .when(showThread && kids.length > 0, (el) => el.child(v_flex().gap(2).pl(4).children(kids.map((k) => this.threadRow(k)))));
  }

  threadRow(k) {
    const key = tagOf(k), busy = typing(k);
    return h_flex().id(`reply-${k.address}`).gap(8).items_center().h(28).px(6).rounded(4).hover((x) => x.bg(C.selected))
      .on_click((_e, cx) => { cx.stop_propagation(); open(k.address); })
      .child(icon("thread", 14, C.dim))
      .child(picture(k.pic, 18, busy ? "working" : k.status, C.side))
      .child(div().flex_none().text_size(13).font_medium().text_color(ROLES.kitten.color).child(k.name))
      .child(busy ? dots(4, C.muted) : div().flex_1().min_w(0).truncate().text_size(12).text_color(C.dim).child(k.title ?? ""))
      .child(div().flex_1())
      .when(Boolean(key), (el) => el.child(this.tag(key, true)));
  }

  render(cx) {
    const { top, subs, ended } = herd();
    // Newest activity first: typing, then needs-you, then by the app's change order.
    const rank = (m) => (typing(m) ? 2e9 : 0) + (m.status === "blocked" ? 1e9 : 0) + (m.seq ?? 0);
    const posts = [...top].sort((a, b) => rank(b) - rank(a));
    const count = (k) => posts.filter((m) => tagOf(m) === k).length;
    const shown = this.filter ? posts.filter((m) => tagOf(m) === this.filter) : posts;
    const archived = ended.filter((m) => !m.parent);

    const chip = (k) => {
      const on = this.filter === k, t = TAGS[k];
      return h_flex().id(`f-${k ?? "all"}`).gap(5).items_center().px(10).h(28).rounded(14).cursor_pointer()
        .bg(on ? C.blurple : C.side).hover((x) => x.bg(on ? C.blurple : C.selected))
        .on_click((_e, cx) => { this.filter = on ? null : k; cx.notify(); })
        .when(Boolean(t), (el) => el.child(icon(t?.icon ?? "paw", 13, on ? "#ffffff" : t?.color)))
        .child(div().text_size(13).font_medium().text_color(on ? "#ffffff" : C.text).child(t ? t.name : "All"))
        .child(div().text_size(12).text_color(on ? "#ffffffaa" : C.dim).child(String(k ? count(k) : posts.length)));
    };

    const empty = v_flex().flex_none().items_center().gap(8).py(48)
      .child(icon("yarn", 40, C.dim))
      .child(div().text_size(16).font_semibold().text_color(C.header).child(this.filter ? `No ${TAGS[this.filter].name.toLowerCase()} posts` : "No posts yet"))
      .child(div().text_size(13).text_color(C.muted).child("Start an agent and it shows up here as a post."));

    return v_flex().id("root").size_full().bg(C.chat)
      .child(v_flex().flex_none().px(16).pt(16).pb(12).gap(12)
        .child(h_flex().h(40).px(12).gap(8).items_center().rounded(8).bg(C.rail).text_size(14).text_color(C.dim)
          .child(icon("search", 16, C.dim)).child(div().flex_1().child("Search or start a run…"))
          .child(h_flex().id("new-post").h(28).px(10).gap(4).items_center().rounded(4).bg(C.blurple).cursor_pointer()
            .on_click(() => run("tab.new")).child(icon("plus", 14, "#ffffff"))
            .child(div().text_size(13).font_medium().text_color("#ffffff").child("New Post"))))
        .child(h_flex().gap(6).items_center().flex_wrap()
          .child(chip(null)).child(chip("working")).child(chip("blocked")).child(chip("done")).child(chip("idle"))
          .child(div().flex_1())
          .child(div().text_size(12).text_color(C.dim).child("Sort: Recent activity"))))
      .child(v_flex().id("posts").flex_1().min_h(0).overflow_y_scrollbar().gap(8).pb(16)
        .children(shown.map((m) => this.post(m, subs)))
        .when(!shown.length, (el) => el.child(empty))
        .when(archived.length > 0 && !this.filter, (el) => el
          .child(h_flex().id("arch").flex_none().mx(16).mt(8).h(32).gap(8).items_center().cursor_pointer()
            .on_click((_e, cx) => { this.archived = !this.archived; cx.notify(); })
            .child(icon("archive", 16, C.muted))
            .child(div().text_size(12).font_semibold().text_color(C.muted).child(`ARCHIVED POSTS — ${archived.length}`))
            .child(div().h(1).flex_1().bg(C.selected))
            .child(div().text_size(12).text_color(C.link).child(this.archived ? "Hide" : "Show")))
          .when(this.archived, (el) => el.children(archived.map((m) => h_flex().flex_none().mx(16).px(14).h(40).gap(10).items_center()
            .rounded(8).bg("#2b2d3180").opacity(0.7)
            .child(icon("archive", 14, C.dim))
            .child(picture(m.pic, 20))
            .child(div().flex_1().min_w(0).truncate().text_size(14).text_color(C.muted).child(m.title || m.name))
            .child(div().text_size(12).text_color(m.exit ? C.red : C.dim).child(m.exit ? `exit ${m.exit}` : "finished")))))));
  }
}
