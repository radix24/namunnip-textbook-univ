/* 수학16 탐구: f = (x² + κy²)/2에서 경사하강법(간격 α)과 뉴턴 방법의 경로 */
(() => {
  "use strict";
  const S = MKit.setup("card-m16-gd", 0.6, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const X0 = [1.6, 0.9];
  function draw() {
    const c = QSim.col(), kap = Number(k.val("kap")), a = k.val("a") / kap; // α = (슬라이더 값)/L, L = κ
    const F = QSim.frame(v, { x0: -2, x1: 2, y0: -1.2, y1: 1.2, pad: 22, equal: true, xl: "x", yl: "y" });
    F.axes();
    // 등고선 x² + κy² = c
    for (const lv of [0.05, 0.2, 0.6, 1.4, 2.6, 4.2]) { const p = []; for (let t = 0; t <= 2 * Math.PI + 1e-9; t += Math.PI / 60) p.push([Math.sqrt(lv) * Math.cos(t), (Math.sqrt(lv) / Math.sqrt(kap)) * Math.sin(t)]); F.path(p, c.rule, 1); }
    let x = X0[0], y = X0[1], it = null, blew = false;
    const path = [[x, y]];
    for (let i = 1; i <= 5000; i++) {
      x -= a * x; y -= a * kap * y;
      if (i <= 60) path.push([x, y]);
      if (Math.hypot(x, y) < 1e-6) { it = i; break; }
      if (Math.abs(x) > 1e6 || Math.abs(y) > 1e6) { blew = true; break; }
    }
    F.path(path.map(([p, q]) => [Math.max(-2, Math.min(2, p)), Math.max(-1.2, Math.min(1.2, q))]), c.warn, 1.6);
    path.slice(0, 30).forEach(([p, q]) => { if (Math.abs(p) <= 2 && Math.abs(q) <= 1.2) F.dot(p, q, c.warn, 2.5); });
    F.path([X0, [0, 0]], c.main, 2, [6, 4]);
    F.dot(0, 0, c.main, 4);
    const rate = Math.max(Math.abs(1 - a), Math.abs(1 - a * kap));
    k.out(`κ = ${kap}, α = ${fmt(k.val("a"), 2)}/L (L = κ) · 수렴 비 max|1 − αλ| = ${fmt(rate, 4)}\n경사하강법: ${blew ? "발산" : it ? `${it}번에 ‖x‖ < 10⁻⁶` : "5000번 안에 못 미침"} · 뉴턴 방법: 1번(파랑 점선, 이차함수라 한 번에 최솟점) · 최적 α = 2/(1 + κ) = ${fmt(2 / (1 + kap), 4)}`);
  }
  S.redraw();
})();
