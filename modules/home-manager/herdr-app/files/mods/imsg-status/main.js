// The iOS status bar: the time on the left; signal, Wi-Fi and battery on the right.
import { View, div } from "gpui-kit";
import { h_flex } from "gpui-base";
import { run, window } from "herdr";
import { C, icon } from "./kit.js";

export default class StatusBar extends View {
  init(_props, cx) {
    this.battery = 100;
    cx.timer.every(30000, (cx) => { this.read(cx); cx.notify(); });
    this.read(cx);
  }
  read(cx) {
    cx.spawn(async (cx) => {
      const r = await exec_safe();
      if (r !== null) { this.battery = r; cx.notify(); }
    });
  }
  render() {
    const now = new Date(), h = now.getHours() % 12 || 12, m = String(now.getMinutes()).padStart(2, "0");
    const w = window(), stop = (_e, cx) => cx.stop_propagation();
    const bars = h_flex().gap(2).items_end().children([5, 7, 9, 11].map((x) => div().w(3).h(x).rounded(1).bg(C.label)));
    const b = this.battery;
    const battery = h_flex().items_center().gap(1)
      .child(div().w(25).h(12).rounded(4).border(1).border_color("#00000066").p(2)
        .child(div().h_full().w(Math.max(2, Math.round(19 * b / 100))).rounded(2).bg(b <= 20 ? C.red : C.label)))
      .child(div().w(2).h(4).rounded(1).bg("#00000066"));
    const btn = (id, label, action) => div().id(id).px(10).h_full().flex().items_center().text_size(12).text_color(C.secondary)
      .hover((s) => s.text_color(C.label)).on_mouse_down("left", stop).on_click(action).child(label);
    return h_flex().id("root").size_full().bg(C.white).px(28).items_center()
      .child(div().text_size(15).font_semibold().text_color(C.label).child(`${h}:${m}`))
      .child(div().flex_1())
      .child(h_flex().gap(6).items_center().child(bars).child(icon("wifi", 15, C.label)).child(battery))
      .when(Boolean(w?.buttons), (el) => el.child(div().w(16))
        .child(btn("min", "—", () => run("window.minimize")))
        .child(btn("max", "▢", () => run("window.maximize")))
        .child(btn("close", "✕", () => run("window.close"))));
  }
}

// The desktop has no battery; a laptop's is used when there is one.
import { exec } from "herdr";
async function exec_safe() {
  const r = await exec("sh", ["-c", "cat /sys/class/power_supply/BAT*/capacity 2>/dev/null | head -1"]).catch(() => null);
  const n = Number(r?.stdout?.trim());
  return Number.isFinite(n) && n > 0 ? n : null;
}
