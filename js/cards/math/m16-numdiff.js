/* 수학16 탐구: 수치 미분 오차의 V자 — 절단 오차와 반올림 오차의 균형 */
(() => {
  "use strict";
  const S = MKit.setup("card-m16-numdiff", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const FN = {
    exp: { name: "eˣ, x = 1", f: Math.exp, d: Math.E, x: 1 },
    sin: { name: "sin x, x = 1", f: Math.sin, d: Math.cos(1), x: 1 },
    sqrt: { name: "√x, x = 100", f: Math.sqrt, d: 0.05, x: 100 },
  };
  const FLOOR = 1e-17;
  const fwd = (F, h) => Math.max(Math.abs((F.f(F.x + h) - F.f(F.x)) / h - F.d), FLOOR);
  const cen = (F, h) => Math.max(Math.abs((F.f(F.x + h) - F.f(F.x - h)) / (2 * h) - F.d), FLOOR);
  function draw() {
    const c = QSim.col(), F = FN[k.val("f")], lh = k.val("lh"), h = Math.pow(10, lh);
    const G = QSim.frame(v, { x0: -14, x1: 0, y0: -14, y1: 1, pad: 28, xl: "log₁₀ h", yl: "log₁₀|오차|" });
    G.axes();
    const pts = (fn) => { const a = []; for (let t = -14; t <= 0.0001; t += 0.05) a.push([t, Math.max(-14, Math.log10(fn(F, Math.pow(10, t))))]); return a; };
    G.path(pts(fwd), c.warn, 1.6);
    G.path(pts(cen), c.main, 1.6);
    G.path([[lh, -14], [lh, 1]], c.acc, 1, [4, 4]);
    let bf = [Infinity, 0], bc = [Infinity, 0];
    for (let t = -14; t <= 0; t += 0.05) { const hh = Math.pow(10, t), a = fwd(F, hh), b = cen(F, hh); if (a < bf[0]) bf = [a, hh]; if (b < bc[0]) bc = [b, hh]; }
    const e = (x) => x.toExponential(2);
    k.out(`${F.name} · h = ${e(h)}: 전진 차분 오차 ${e(fwd(F, h))}, 중심 차분 오차 ${e(cen(F, h))}\n가장 작은 오차: 전진 ${e(bf[0])} (h ≈ ${e(bf[1])}), 중심 ${e(bc[0])} (h ≈ ${e(bc[1])})`);
  }
  S.redraw();
})();
