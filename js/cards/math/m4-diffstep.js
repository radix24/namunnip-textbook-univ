/* 수학4 탐구: 차분으로 구한 도함수의 오차 — 절단 오차와 반올림 오차의 줄다리기 */
(() => {
  "use strict";
  const S = MKit.setup("card-m4-diffstep", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const FN = {
    sin: { name: "sin x, x = 1", f: Math.sin, x: 1, d: Math.cos(1) },
    exp: { name: "eˣ, x = 0", f: Math.exp, x: 0, d: 1 },
    cube: { name: "x³, x = 2", f: (t) => t * t * t, x: 2, d: 12 },
  };
  const fwd = (F, h) => (F.f(F.x + h) - F.f(F.x)) / h;
  const cen = (F, h) => (F.f(F.x + h) - F.f(F.x - h)) / (2 * h);
  const lg = (e) => (e > 0 ? Math.max(-17, Math.log10(e)) : -17);
  function draw() {
    const c = QSim.col(), F = FN[k.val("f")], e = k.val("e"), h = Math.pow(10, e);
    const P = QSim.frame(v, { x0: -16, x1: 0, y0: -17, y1: 1, pad: 30, xl: "log₁₀ h", yl: "log₁₀ 오차" });
    P.axes();
    const pf = [], pc = [];
    let bf = [Infinity, 0], bc = [Infinity, 0];
    for (let i = 0; i <= 64; i++) {
      const t = -16 + i / 4, hh = Math.pow(10, t), ef = Math.abs(fwd(F, hh) - F.d), ec = Math.abs(cen(F, hh) - F.d);
      pf.push([t, lg(ef)]); pc.push([t, lg(ec)]);
      if (ef < bf[0]) bf = [ef, t];
      if (ec < bc[0]) bc = [ec, t];
    }
    P.path(pf, c.main, 2); P.path(pc, c.acc, 2);
    P.path([[e, -17], [e, 1]], c.ink3, 1, [3, 4]);
    const ef = Math.abs(fwd(F, h) - F.d), ec = Math.abs(cen(F, h) - F.d);
    P.dot(e, lg(ef), c.main, 5); P.dot(e, lg(ec), c.acc, 5);
    P.text("전진 차분", -3.5, lg(Math.abs(fwd(F, 0.1) - F.d)) + 1.2, c.main);
    P.text("중심 차분", -3.5, lg(Math.abs(cen(F, 0.1) - F.d)) - 1.4, c.acc);
    const ex = (z) => (z > 0 ? z.toExponential(1) : "0");
    k.out(`${F.name}, h = 10^${e}: 전진 차분 오차 ${ex(ef)}, 중심 차분 오차 ${ex(ec)}\n가장 작은 오차: 전진 ${ex(bf[0])} (h ≈ 10^${bf[1]}), 중심 ${ex(bc[0])} (h ≈ 10^${bc[1]})`);
  }
  S.redraw();
})();
