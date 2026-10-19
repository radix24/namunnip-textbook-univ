/* 수학8 탐구: A = [[λ, 1], [ε, λ]]의 거듭제곱 ‖Aⁿx‖ — 조르당 블록의 일시적 증가 */
(() => {
  "use strict";
  const S = MKit.setup("card-m8-jordanpow", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  function draw() {
    const c = QSim.col(), lam = k.val("l"), eps = k.val("e"), Nn = 60;
    let x = [0, 1]; const pts = [[0, 0]]; let best = 1, bn = 0;
    for (let n = 1; n <= Nn; n++) { x = [lam * x[0] + x[1], eps * x[0] + lam * x[1]]; const m = Math.hypot(x[0], x[1]); pts.push([n, Math.log10(m)]); if (m > best) { best = m; bn = n; } }
    const rho = eps >= 0 ? Math.abs(lam) + Math.sqrt(eps) : Math.hypot(lam, Math.sqrt(-eps));
    const ymin = Math.min(-2, ...pts.map((p) => p[1])), ymax = Math.max(1.5, ...pts.map((p) => p[1]));
    const F = QSim.frame(v, { x0: 0, x1: Nn, y0: Math.max(-6, ymin), y1: Math.min(8, ymax) + 0.2, pad: 30, xl: "n", yl: "log₁₀‖Aⁿx‖" });
    F.axes();
    F.path(pts.map(([n, y]) => [n, Math.max(-6, Math.min(8, y))]), c.main, 2.2);
    F.fn((n) => n * Math.log10(rho), c.warn, 1.4, [5, 4]);
    F.dot(bn, Math.log10(best), c.acc, 5);
    const eig = eps >= 0 ? `${fmt(lam + Math.sqrt(eps), 3)}, ${fmt(lam - Math.sqrt(eps), 3)}` : `${fmt(lam, 3)} ± ${fmt(Math.sqrt(-eps), 3)}i`;
    k.out(`A = [[${fmt(lam, 2)}, 1], [${fmt(eps, 3)}, ${fmt(lam, 2)}]] · 고유값 ${eig} · 스펙트럼 반지름 ${fmt(rho, 3)}\nx = (0, 1)에서 ‖Aⁿx‖의 최댓값 ${fmt(best, 3)} (n = ${bn}) · ‖A⁶⁰x‖ = ${fmt(Math.pow(10, pts[Nn][1]), 4)} · 빨간 점선: (스펙트럼 반지름)ⁿ`);
  }
  S.redraw();
})();
