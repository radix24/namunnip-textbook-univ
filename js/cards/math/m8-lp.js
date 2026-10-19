/* 수학8 탐구: 공장 문제의 실행 가능 영역과 목적함수 방향 — 최적 꼭짓점 */
(() => {
  "use strict";
  const S = MKit.setup("card-m8-lp", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const V = [[0, 0], [4, 0], [4, 3], [2, 6], [0, 6]];
  function draw() {
    const c = QSim.col(), c1 = k.val("c1"), c2 = k.val("c2"), g = v.g;
    const F = QSim.frame(v, { x0: -0.5, x1: 7.5, y0: -0.5, y1: 8, pad: 26, xl: "x (A)", yl: "y (B)" });
    F.axes();
    g.fillStyle = c.soft; g.beginPath(); V.forEach(([x, y], i) => (i ? g.lineTo(F.X(x), F.Y(y)) : g.moveTo(F.X(x), F.Y(y)))); g.closePath(); g.fill();
    F.path([[4, -0.5], [4, 8]], c.ink3, 1, [3, 3]); F.path([[-0.5, 6], [7.5, 6]], c.ink3, 1, [3, 3]); F.path([[0, 9], [6, 0]], c.ink3, 1, [3, 3]);
    F.text("x ≤ 4", 4.1, 7.6, c.ink3); F.text("2y ≤ 12", 5.6, 6.2, c.ink3); F.text("3x + 2y ≤ 18", 4.9, 1.6, c.ink3);
    const vals = V.map(([x, y]) => c1 * x + c2 * y), best = Math.max(...vals), opt = V.filter((p, i) => Math.abs(vals[i] - best) < 1e-9);
    if (Math.abs(c2) > 1e-9) F.fn((x) => (best - c1 * x) / c2, c.warn, 2);
    else if (Math.abs(c1) > 1e-9) F.path([[best / c1, -0.5], [best / c1, 8]], c.warn, 2);
    V.forEach(([x, y], i) => F.dot(x, y, opt.some((p) => p[0] === x && p[1] === y) ? c.warn : c.main, 5));
    const n = Math.hypot(c1, c2) || 1; F.arrow(1, 1, (1.2 * c1) / n, (1.2 * c2) / n, c.acc, "c");
    k.out(`목적함수 ${fmt(c1, 1)}x + ${fmt(c2, 1)}y · 꼭짓점 값: ${V.map(([x, y], i) => `(${x}, ${y}) ${fmt(vals[i], 2)}`).join(", ")}\n최댓값 ${fmt(best, 2)} · 최적 꼭짓점 ${opt.map(([x, y]) => `(${x}, ${y})`).join(", ")}${opt.length > 1 ? " (그 사이 모서리 전체가 최적)" : ""}`);
  }
  S.redraw();
})();
