/* 수학6 탐구: y'' + 2ζy' + y = g(t), 정지에서 출발 — 충격 반응 h와 합성곱 y = h * g */
(() => {
  "use strict";
  const S = MKit.setup("card-m6-impulse", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const T = 20, N = 2000, dt = T / N;
  function hfun(z, t) {
    if (t < 0) return 0;
    if (z < 1) { const wd = Math.sqrt(1 - z * z); return Math.exp(-z * t) * Math.sin(wd * t) / wd; }
    if (z === 1) return t * Math.exp(-t);
    const r = Math.sqrt(z * z - 1); return (Math.exp((-z + r) * t) - Math.exp((-z - r) * t)) / (2 * r);
  }
  function draw() {
    const c = QSim.col(), z = k.val("z"), inp = k.val("g");
    const gfun = { imp: null, step: (t) => (t >= 1 ? 1 : 0), pulse: (t) => (t >= 1 && t < 3 ? 1 : 0), sine: (t) => Math.sin(0.5 * t) }[inp];
    const ts = [...Array(N + 1).keys()].map((i) => i * dt);
    let y;
    if (inp === "imp") y = ts.map((t) => hfun(z, t - 1)); // 충격 δ(t − 1)
    else { const gv = ts.map(gfun), hv = ts.map((t) => hfun(z, t)); y = ts.map((_, i) => { let s = 0; for (let j = 0; j <= i; j++) s += hv[i - j] * gv[j]; return s * dt; }); }
    const ymax = Math.max(1.1, ...y.map(Math.abs)) * 1.1;
    const f = QSim.frame(v, { x0: 0, x1: T, y0: -ymax, y1: ymax, pad: 28, xl: "t" });
    f.axes();
    if (inp === "imp") f.arrow(1, 0, 0, ymax * 0.8, c.ink3, "δ(t−1)");
    else f.path(ts.map((t, i) => [t, gfun(t)]), c.ink3, 1.5, [4, 4]);
    f.path(ts.map((t, i) => [t, y[i]]), c.main, 2.2);
    const last = y[N], peak = Math.max(...y);
    k.out(`ζ = ${fmt(z, 2)} · 입력 ${{ imp: "충격 δ(t − 1)", step: "계단 u₁(t)", pulse: "펄스 (1 ≤ t < 3)", sine: "sin(0.5t)" }[inp]} (회색) · 출력 y(t) (파랑)\n`
      + `최댓값 ${fmt(peak, 3)} · t = 20에서 ${fmt(last, 3)} · 충격 반응 h(t) = ${z < 1 ? `e^(−${fmt(z, 2)}t) sin(${fmt(Math.sqrt(1 - z * z), 3)}t)/${fmt(Math.sqrt(1 - z * z), 3)}` : z === 1 ? "t e^(−t)" : "두 지수의 차"}, y = h * g`);
  }
  S.redraw();
})();
