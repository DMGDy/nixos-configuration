// The conversation's nav bar: ‹ back (shows or hides the list), the contact's
// photo and name in the middle, FaceTime (a new terminal beside) on the right.
import { View, div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { run, spaces, layout } from "herdr";

function find(n, id) { if (n?.id === id) return n; for (const c of n?.children ?? []) { const f = find(c, id); if (f) return f; } return null; }
import { C, icon, avatar, chat, subAgents } from "./kit.js";

export default class Nav extends View {
  // iOS segmented control: the transcript without the prompt box, or the live terminal.
  segment() {
    const on = find(layout(), "convo-stack")?.active ?? "output";
    const seg = (id, label) => div().id(`seg-${id}`).px(12).h(24).flex().items_center().rounded(7).text_size(13).cursor_pointer()
      .bg(on === id ? C.white : "#00000000").text_color(C.label).when(on === id, (s) => s.shadow_sm().font_semibold())
      .on_click(() => run("layout.select", { stack: "convo-stack", child: id })).child(label);
    return h_flex().p(2).rounded(9).bg("#7676801f").child(seg("output", "Output")).child(seg("live", "Live"));
  }

  render() {
    const space = spaces().find((s) => s.active), tab = space?.tabs.find((t) => t.active);
    const c = tab ? chat(tab, space) : null;
    const subs = c ? subAgents(c.panes.map((p) => p.terminal).filter(Boolean)).length : 0;
    const unread = spaces().flatMap((s) => s.tabs).filter((t) => t.status === "blocked" || t.status === "done").length;
    return h_flex().id("root").size_full().bg(C.bar).border_b(1).border_color(C.sep).px(12).items_center()
      .child(h_flex().id("back").w(120).gap(2).items_center().cursor_pointer().on_click(() => run("layout.toggle", { id: "sidebar" }))
        .child(icon("back", 26, C.blue))
        .when(unread > 0, (el) => el.child(div().min_w(22).h(22).px(6).rounded_full().bg(C.blue).flex().items_center().justify_center()
          .text_size(13).font_semibold().text_color(C.white).child(String(unread)))))
      .child(div().flex_1())
      .child(c ? v_flex().items_center().gap(3)
        .child(avatar(c.name, 44, c.program))
        .child(h_flex().gap(2).items_center()
          .child(div().text_size(12).text_color(C.label).child(subs ? `${c.name} & ${subs} more` : c.name))
          .child(icon("chev", 10, C.secondary))) : div())
      .child(div().flex_1())
      .child(h_flex().w(220).gap(14).justify_end().items_center()
        .child(this.segment())
        .child(div().id("facetime").cursor_pointer().on_click(() => run("pane.split", { direction: "right" })).child(icon("video", 26, C.blue))));
  }
}
