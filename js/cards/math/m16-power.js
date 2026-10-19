/* 수학16 탐구: 2×2 대칭 행렬의 거듭제곱법 — 벡터가 주 고유벡터 방향으로 돌아감 */
(() => {
  "use strict";
  const S = MKit.setup("card-m16-power", 0.62, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  function draw() {
    const c = QSim.col(), d = k.val("d"), steps = k.val("k"), th = (k.val("th") * Math.PI) / 180;
    // A = [[2, 1], [1, 2 + d]] (대칭), 고윳값과 고유벡터
    const a = 2, b = 1, e = 2 + d, tr = a + e, det = a * e - b * b, disc = Math.sqrt(tr * tr / 4 - det);
    const l1 = tr / 2 + disc, l2 = tr / 2 - disc;
    let v1 = [b, l1 - a]; const n1 = Math.hypot(...v1); v1 = [v1[0] / n1, v1[1] / n1];
    const F = QSim.frame(v, { x0: -1.3, x1: 1.3, y0: -1.3, y1: 1.3, pad: 22, equal: true, xl: "", yl: "" });
    F.axes();
    F.path([[-1.2 * v1[0], -1.2 * v1[1]], [1.2 * v1[0], 1.2 * v1[1]]], c.acc, 1.4, [5, 4]);
    let x = [Math.cos(th), Math.sin(th)], mu = 0, ang = 0;
    const pts = [x.slice()];
    for (let i = 0; i < steps; i++) { const y = [a * x[0] + b * x[1], b * x[0] + e * x[1]], ny = Math.hypot(...y); x = [y[0] / ny, y[1] / ny]; pts.push(x.slice()); }
    pts.forEach((p, i) => { F.arrow(0, 0, p[0], p[1], i === pts.length - 1 ? c.warn : c.soft, i === 0 ? "x₀" : i === pts.length - 1 ? "x" + "ₖ" : ""); });
    mu = x[0] * (a * x[0] + b * x[1]) + x[1] * (b * x[0] + e * x[1]);
    ang = (Math.acos(Math.min(1, Math.abs(x[0] * v1[0] + x[1] * v1[1]))) * 180) / Math.PI;
    k.out(`A = [[2, 1], [1, ${fmt(e, 2)}]] · 고윳값 λ₁ = ${fmt(l1, 4)}, λ₂ = ${fmt(l2, 4)}, |λ₂/λ₁| = ${fmt(Math.abs(l2 / l1), 3)}\n${steps}단계 뒤: 주 고유벡터와의 각 ${ang < 1e-3 ? ang.toExponential(1) : fmt(ang, 3)}° · 레일리 몫 ${fmt(mu, 6)} (오차 ${Math.abs(mu - l1).toExponential(1)})`);
  }
  S.redraw();
})();
