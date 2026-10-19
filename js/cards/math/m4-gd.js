/* 수학4 탐구: f = (x² + κy²)/2 위의 경사하강법 경로 — 학습률과 조건수 */
(() => {
  "use strict";
  const S = MKit.setup("card-m4-gd", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  function draw() {
    const c = QSim.col(), K = k.val("k"), eta = k.val("eta"), N = k.val("n");
    const F = QSim.frame(v, { x0: -5, x1: 5, y0: -2.5, y1: 2.5, pad: 24, xl: "x", yl: "y" });
    F.axes({ noGrid: true });
    for (const lv of [0.05, 0.3, 1, 2.5, 5, 9, 14]) {
      const pts = [];
      for (let i = 0; i <= 120; i++) { const t = (i / 120) * 2 * Math.PI; pts.push([Math.sqrt(2 * lv) * Math.cos(t), Math.sqrt((2 * lv) / K) * Math.sin(t)]); }
      F.path(pts, c.rule, 1);
    }
    const f = (x, y) => 0.5 * (x * x + K * y * y);
    let x = -4, y = 1.5, hit = -1;
    const path = [[x, y]];
    for (let i = 1; i <= N; i++) {
      x -= eta * x; y -= eta * K * y;
      path.push([x, y]);
      if (hit < 0 && f(x, y) < 1e-6) hit = i;
    }
    const clip = (p) => [Math.max(-6, Math.min(6, p[0])), Math.max(-3, Math.min(3, p[1]))];
    F.path(path.map(clip), c.main, 1.8);
    path.forEach((p, i) => { if (i <= 60 && Math.abs(p[0]) < 6 && Math.abs(p[1]) < 3) F.dot(p[0], p[1], i ? c.main : c.warn, i ? 2.5 : 5); });
    F.dot(0, 0, c.acc, 4);
    const rx = Math.abs(1 - eta), ry = Math.abs(1 - K * eta), r = Math.max(rx, ry), fn = f(x, y);
    const state = r < 1 - 1e-9 ? "수렴" : r < 1 + 1e-9 ? "진동(수렴 안 함)" : "발산";
    k.out(`η = ${fmt(eta, 3)}, κ = ${K}: 수축률 x 방향 |1 − η| = ${fmt(rx, 3)}, y 방향 |1 − κη| = ${fmt(ry, 3)} → ${state}\n${N}번 뒤 f = ${fn > 1e6 ? fn.toExponential(1) : fn < 1e-4 ? fn.toExponential(1) : fmt(fn, 4)}${hit > 0 ? ` · f < 10⁻⁶ 도달: ${hit}번째` : ""} · 수렴 조건 η < ${fmt(2 / K, 3)}, 가장 빠른 η = 2/(1 + κ) = ${fmt(2 / (1 + K), 3)}`);
  }
  S.redraw();
})();
