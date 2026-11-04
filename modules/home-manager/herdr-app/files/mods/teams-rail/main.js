// The dark app rail. Activity, Chat and Teams switch what the list shows
// (shared "teams.view"); Calls splits a new terminal; Files opens the files panel.
import { View, div } from "gpui-kit";
import { v_flex } from "gpui-base";
import { run, shared, setShared, spaces, layout } from "herdr";
import { RAIL, icon } from "./kit.js";

function find(n, id) { if (n?.id === id) return n; for (const c of n?.children ?? []) { const f = find(c, id); if (f) return f; } return null; }

export default class Rail extends View {
  render() {
    const view = shared("teams.view") ?? "chat";
    const tabs = spaces().flatMap((s) => s.tabs);
    const pings = tabs.filter((t) => t.status === "blocked" || t.status === "done").length;
    const panel = find(layout(), "panel"), body = find(layout(), "panel-body");
    const filesOn = panel && !panel.hidden && body?.active === "files";
    const item = (id, label, ic, active, action, badge) => v_flex().id(`rail-${id}`).relative().w_full().h(56).items_center().justify_center().gap(3)
      .cursor_pointer().text_size(10.5).text_color(active ? "#ffffff" : "#c8c6e6").hover((s) => s.bg("#ffffff14").text_color("#ffffff"))
      .on_click(action)
      .when(active, (el) => el.child(div().absolute().left(0).top(8).bottom(8).w(3).rounded(2).bg("#ffffff")))
      .child(icon(ic, 22, active ? "#ffffff" : "#c8c6e6"))
      .child(label)
      .when(Boolean(badge), (el) => el.child(div().absolute().top(6).right(14).min_w(16).h(16).px(4).rounded_full().bg("#c4314b")
        .flex().items_center().justify_center().text_size(10).font_bold().text_color("#ffffff").child(String(badge))));
    const pick = (v) => () => { setShared("teams.view", v); run("layout.show", { id: "sidebar" }); };
    return v_flex().id("root").size_full().bg(RAIL).pt(4)
      .child(item("activity", "Activity", "bell", view === "activity", pick("activity"), pings))
      .child(item("chat", "Chat", "chat", view === "chat", pick("chat")))
      .child(item("teams", "Teams", "teams", view === "teams", pick("teams")))
      .child(item("calendar", "Calendar", "calendar", false, () => run("app.whats_new")))
      .child(item("calls", "Calls", "calls", false, () => run("pane.split", { direction: "right" })))
      .child(item("files", "Files", "files", filesOn, () => {
        if (filesOn) run("layout.hide", { id: "panel" });
        else { run("layout.select", { stack: "panel-body", child: "files" }); run("layout.show", { id: "panel" }); }
      }))
      .child(item("apps", "Apps", "more", false, () => run("app.palette")))
      .child(div().flex_1())
      .child(item("help", "Help", "help", false, () => run("app.help")));
  }
}
