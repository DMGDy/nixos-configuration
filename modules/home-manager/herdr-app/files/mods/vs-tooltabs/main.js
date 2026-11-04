// Tool window tabs under the right dock: Solution Explorer, Git Changes, Files.
import { View, div } from "gpui-kit";
import { h_flex } from "gpui-base";
import { run, layout } from "herdr";
import { C, find } from "./kit.js";

const TABS = [["solution", "Solution Explorer"], ["git-changes", "Git Changes"], ["files", "Files"]];

export default class ToolTabs extends View {
  render() {
    const active = find(layout(), "dock")?.active ?? "solution";
    return h_flex().id("root").size_full().bg(C.env).border_t(1).border_color(C.border).text_size(12)
      .children(TABS.map(([id, label]) => {
        const on = id === active;
        return div().id(`tt-${id}`).px(10).h_full().flex().items_center().cursor_pointer()
          .bg(on ? C.tool : C.env).text_color(on ? C.blueHover : C.muted).when(on, (s) => s.border_t(2).border_color(C.blue))
          .hover((s) => s.text_color(on ? C.blueHover : C.text))
          .on_click(() => run("layout.select", { stack: "dock", child: id })).child(label);
      }));
  }
}
