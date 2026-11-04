// Meters: CPU, memory and load for this machine, each with a 60-second
// history drawn as a bar sparkline. Samples once a second.

import { View, div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { exec, theme } from "herdr";

const N = 60;

export default class Meters extends View {
  init(_props, cx) {
    this.prev = null;
    this.cpu = [];
    this.mem = [];
    this.memText = "";
    this.load = "";
    this.cores = 1;
    cx.timer.every(1000, (cx) => this.sample(cx));
    this.sample(cx);
  }

  sample(cx) {
    cx.spawn(async (cx) => {
      const r = await exec("cat", ["/proc/stat", "/proc/meminfo", "/proc/loadavg"]).catch(() => null);
      if (!r) return;
      const out = r.stdout;
      const f = out.split("\n")[0].trim().split(/\s+/).slice(1).map(Number);
      const idle = f[3] + (f[4] ?? 0), total = f.reduce((a, b) => a + b, 0);
      if (this.prev) {
        const dt = total - this.prev.total, di = idle - this.prev.idle;
        this.push(this.cpu, dt > 0 ? 1 - di / dt : 0);
      }
      this.prev = { idle, total };
      this.cores = (out.match(/^cpu\d+ /gm) ?? [1]).length;
      const kb = (k) => Number(out.match(new RegExp(`^${k}:\\s+(\\d+)`, "m"))?.[1] ?? 0);
      const tot = kb("MemTotal"), avail = kb("MemAvailable");
      this.push(this.mem, tot ? 1 - avail / tot : 0);
      this.memText = `${((tot - avail) / 1048576).toFixed(1)} / ${(tot / 1048576).toFixed(0)} GB`;
      this.load = out.trim().split("\n").pop().split(" ").slice(0, 3).join("  ");
      cx.notify();
    });
  }

  push(arr, v) {
    arr.push(Math.max(0, Math.min(1, v)));
    if (arr.length > N) arr.shift();
  }

  meter(t, label, values, color, detail) {
    const now = values[values.length - 1] ?? 0;
    const bars = h_flex().h(28).gap(1).items_end().flex_1();
    const pad = N - values.length;
    for (let i = 0; i < N; i++) {
      const v = i < pad ? 0 : values[i - pad];
      bars.child(div().flex_1().h(Math.max(1, Math.round(v * 28))).rounded(1).bg(color).opacity(i < pad ? 0.15 : 0.35 + 0.65 * (i / N)));
    }
    return v_flex().gap(4)
      .child(h_flex().items_center().text_size(11).gap(6)
        .child(div().text_color(t.dim).child(label))
        .child(div().flex_1())
        .child(div().text_color(t.muted).child(detail))
        .child(div().w(38).text_color(t.foreground).font_semibold().child(`${Math.round(now * 100)}%`)))
      .child(bars);
  }

  render() {
    const t = theme();
    return v_flex().id("root").size_full().bg(t.surface).px(12).py(10).gap(10)
      .child(h_flex().text_size(11).text_color(t.dim).child("MACHINE").child(div().flex_1())
        .child(div().text_color(t.muted).child(`load ${this.load}`)))
      .child(this.meter(t, "CPU", this.cpu, t.working, `${this.cores} threads`))
      .child(this.meter(t, "MEM", this.mem, t.accent, this.memText));
  }
}
