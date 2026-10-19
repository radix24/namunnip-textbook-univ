/* 수학8 탐구: 실대칭 2×2 행렬의 스펙트럼 분해 — x를 고유축 성분으로 나누고 각자 λ배 */
(() => {
  "use strict";
  const S = MKit.setup("card-m8-specdecomp", 0.55, draw);
  if (!S) return;
  const { k, v, cv } = S;
  const { fmt } = MKit;
  const sg = (x) => (x < -1e-12 ? " − " + fmt(-x, 3) : " + " + fmt(x, 3));
  let X = [1, 0], F = null;
  function draw() {
    const c = QSim.col(), a = k.val("a"), b = k.val("b"), d = k.val("d");
    F = QSim.frame(v, { x0: -4.2, x1: 4.2, y0: -3, y1: 3, pad: 24, xl: "x", yl: "y" });
    F.axes({ noGrid: true });
    const tr = a + d, disc = Math.sqrt(((a - d) / 2) ** 2 + b * b), l1 = tr / 2 + disc, l2 = tr / 2 - disc;
    let q1 = Math.abs(b) > 1e-12 ? [b, l1 - a] : a >= d ? [1, 0] : [0, 1];
    const r = Math.hypot(q1[0], q1[1]); q1 = [q1[0] / r, q1[1] / r];
    const q2 = [-q1[1], q1[0]];
    F.path([[-5 * q1[0], -5 * q1[1]], [5 * q1[0], 5 * q1[1]]], c.acc, 1, [5, 4]);
    F.path([[-5 * q2[0], -5 * q2[1]], [5 * q2[0], 5 * q2[1]]], c.warn, 1, [5, 4]);
    const c1 = q1[0] * X[0] + q1[1] * X[1], c2 = q2[0] * X[0] + q2[1] * X[1];
    const P1 = [c1 * q1[0], c1 * q1[1]], P2 = [c2 * q2[0], c2 * q2[1]];
    const A1 = [l1 * P1[0], l1 * P1[1]], A2 = [l2 * P2[0], l2 * P2[1]], AX = [A1[0] + A2[0], A1[1] + A2[1]];
    F.path([[0, 0], P1], c.acc, 2); F.path([[0, 0], P2], c.warn, 2);
    F.path([[0, 0], A1], c.acc, 4); F.path([[0, 0], A2], c.warn, 4);
    F.path([A1, AX], c.ink3, 1, [3, 3]); F.path([A2, AX], c.ink3, 1, [3, 3]);
    F.arrow(0, 0, X[0], X[1], c.ink, "x");
    F.arrow(0, 0, AX[0], AX[1], c.main, "Ax");
    F.dot(X[0], X[1], c.ink, 6);
    k.out(`λ₁ = ${fmt(l1, 3)} (q₁ = (${fmt(q1[0], 3)}, ${fmt(q1[1], 3)})), λ₂ = ${fmt(l2, 3)} (q₂ = (${fmt(q2[0], 3)}, ${fmt(q2[1], 3)}))\nx = ${fmt(c1, 3)}q₁${sg(c2)}q₂ → Ax = ${fmt(l1 * c1, 3)}q₁${sg(l2 * c2)}q₂ = (${fmt(AX[0], 3)}, ${fmt(AX[1], 3)})`);
  }
  MKit.drag(cv, () => F, () => [X], (i, x, y) => { X = [x, y]; draw(); });
  S.redraw();
})();
