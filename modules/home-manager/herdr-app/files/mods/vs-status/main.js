// The status bar: purple when nothing runs, blue while agents build, orange
// (Visual Studio's debugging color) when an agent needs you.
import { View, div } from "gpui-kit";
import { h_flex } from "gpui-base";
import { run, spaces, agents, focused, terminals } from "herdr";
import { C, icon, spinner, live } from "./kit.js";

export default class Status extends View {
  render() {
    const all = [...agents(), ...terminals().filter((t) => t.parent && live(t))];
    const blocked = all.filter((a) => a.status === "blocked").length, working = all.filter((a) => a.status === "working").length;
    const bg = blocked ? C.orange : working ? C.blue : C.purple;
    const space = spaces().find((s) => s.active), f = focused();
    const item = (id, child, action) => h_flex().id(id).h_full().px(8).gap(5).items_center().hover((s) => s.bg("#ffffff26")).on_click(action ?? (() => {})).child(child);
    return h_flex().id("root").size_full().bg(bg).text_size(12).text_color("#ffffff").items_center()
      .child(item("st-state", blocked ? `${blocked} agent${blocked === 1 ? "" : "s"} need input` : working ? "Building…" : "Ready",
        () => blocked && run("agent.next")))
      .when(working > 0, (el) => el.child(h_flex().gap(5).items_center().child(spinner(11, "#ffffff")).child(`${working} running`)))
      .child(div().flex_1())
      .child(item("st-term", f?.terminal ? `Terminal ${f.terminal}` : ""))
      .child(item("st-up", "↑ 0  ✎ 0"))
      .when(Boolean(space?.branch), (el) => el.child(item("st-branch", h_flex().gap(5).items_center().child(icon("branch", 12, "#ffffff")).child(space.branch))))
      .child(item("st-repo", space ? (space.name === "~" ? "Home" : space.name) : ""));
  }
}
