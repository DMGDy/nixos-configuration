// The Error List: every agent and sub-agent as a row. Blocked agents are
// errors, finished ones warnings, working and idle ones messages. Click a row
// to show that agent; the severity buttons filter like Visual Studio's.
import { View, div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { run, spaces, agents, terminals } from "herdr";
import { C, MONO, icon, severity, since, live, doc } from "./kit.js";

export default class ErrorList extends View {
  init(_props, cx) {
    this.show = { error: true, warning: true, message: true };
    cx.timer.every(1000, (cx) => { if (agents().some((a) => a.status === "working")) cx.notify(); });
  }

  items() {
    const tabs = new Map(spaces().flatMap((s) => s.tabs.map((t) => [t.id, t])));
    const top = agents().map((a) => ({
      address: a.address, status: a.status, desc: a.title || a.program?.name || a.address,
      project: a.space_name === "~" ? "Home" : a.space_name, file: tabs.get(a.tab) ? doc(tabs.get(a.tab)).name : a.tab_name,
      time: a.status === "working" && tabs.get(a.tab)?.working_since ? since(tabs.get(a.tab).working_since) : "",
      who: a.program?.name ?? a.app ?? "agent",
    }));
    const subs = terminals().filter((t) => t.parent && live(t)).map((t) => ({
      address: t.address, status: t.status, desc: t.name ?? t.address,
      project: ((t.where ?? "").split(" / ")[0] || "~").replace(/^~$/, "Home"), file: `sub-agent of ${t.parent}`,
      time: "", who: t.program?.name ?? t.agent ?? "agent",
    }));
    return [...top, ...subs];
  }

  render() {
    const items = this.items().map((i) => ({ ...i, sev: severity(i.status) }));
    const count = (k) => items.filter((i) => i.sev.kind === k).length;
    const filt = (k, ic, color, label) => h_flex().id(`f-${k}`).h(22).px(6).gap(5).items_center().rounded(2).text_size(12)
      .text_color(C.text).bg(this.show[k] ? "#3e3e42" : C.env).border(1).border_color(this.show[k] ? C.border : C.env)
      .hover((s) => s.bg(C.hover)).on_click((_e, cx) => { this.show[k] = !this.show[k]; cx.notify(); })
      .child(icon(ic, 13, color)).child(`${count(k)} ${label}${count(k) === 1 ? "" : "s"}`);
    const cols = [["", 26], ["Code", 64], ["Description", 0], ["Project", 130], ["File", 170], ["Time", 70]];
    const cell = (w, child, color = C.text) => (w ? div().w(w).flex_none() : div().flex_1().min_w(0)).px(6).truncate().text_color(color).child(child);
    const header = h_flex().h(22).items_center().bg(C.env).border_b(1).border_color(C.border).text_size(12)
      .children(cols.map(([n, w]) => cell(w, n, C.muted).border_r(1).border_color(C.border)));
    const rows = items.filter((i) => this.show[i.sev.kind]).map((i, n) => h_flex().id(`err-${i.address}`).h(22).items_center().text_size(12)
      .bg(n % 2 ? "#2a2a2c" : C.tool).hover((s) => s.bg(C.select)).on_click(() => run("agent.focus", { terminal: i.address }))
      .child(h_flex().w(26).flex_none().justify_center().child(icon(i.sev.icon, 13, i.sev.color)))
      .child(cell(64, i.address, C.info).font_family(MONO))
      .child(cell(0, `${i.who}: ${i.sev.text}${i.status === "working" ? ` · ${i.desc}` : i.desc ? ` (${i.desc})` : ""}`))
      .child(cell(130, i.project))
      .child(cell(170, i.file))
      .child(cell(70, i.time, C.muted)));
    return v_flex().id("root").size_full().bg(C.tool)
      .child(h_flex().h(26).px(8).items_center().bg(C.env).text_size(12).text_color(C.text)
        .child(div().flex_1().child("Error List")).child(icon("chev", 11, C.muted)).child(div().w(6)).child(icon("close", 10, C.muted)))
      .child(h_flex().h(30).px(6).gap(6).items_center().bg(C.env).border_b(1).border_color(C.border)
        .child(h_flex().h(22).w(130).px(6).items_center().bg(C.field).border(1).border_color(C.border).text_size(12).text_color(C.text)
          .child(div().flex_1().child("Entire Solution")).child(icon("chev", 11, C.muted)))
        .child(filt("error", "error", C.error, "Error"))
        .child(filt("warning", "warning", C.warn, "Warning"))
        .child(filt("message", "info", C.info, "Message"))
        .child(div().flex_1())
        .child(h_flex().h(22).w(200).px(6).items_center().bg(C.field).border(1).border_color(C.border).text_size(12).text_color(C.dim)
          .child(div().flex_1().child("Search Error List")).child(icon("search", 12, C.muted))))
      .child(header)
      .child(v_flex().id("err-rows").flex_1().min_h(0).overflow_y_scrollbar().children(rows))
      .child(h_flex().h(24).bg(C.env).border_t(1).border_color(C.border).text_size(12)
        .child(div().px(10).h_full().flex().items_center().bg(C.tool).text_color(C.blueHover).border_t(2).border_color(C.blue).child("Error List"))
        .child(div().px(10).h_full().flex().items_center().text_color(C.muted).child("Output"))
        .child(div().px(10).h_full().flex().items_center().text_color(C.muted).child("Terminal")));
  }
}
