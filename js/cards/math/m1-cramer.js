/* 수학1 탐구: 크라머 공식 = 넓이의 비. x₁ = det(b, a₂)/det(a₁, a₂) — b의 a₁ 방향 성분은 a₂에 평행한 층밀림으로 읽힌다 */
(() => {
  "use strict";
  let f;
  const P = [[2, 0.5], [0.5, 1.5], [3, 2.5]]; // a₁, a₂, b
  const S = MKit.setup("card-m1-cramer", 0.8, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const det = (p, q) => p[0] * q[1] - p[1] * q[0];
  function draw() {
    const c = QSim.col(), g = v.g, [a1, a2, b] = P, which = k.val("which");
    f = QSim.frame(v, { x0: -1.5, x1: 5, y0: -1.5, y1: 4, equal: true, pad: 22 });
    f.axes();
    const D = det(a1, a2);
    const para = (p, q, col, alpha) => {
      g.save(); g.fillStyle = col; g.globalAlpha = alpha; g.beginPath();
      [[0, 0], p, [p[0] + q[0], p[1] + q[1]], q].forEach(([x, y], i) => (i ? g.lineTo(f.X(x), f.Y(y)) : g.moveTo(f.X(x), f.Y(y))));
      g.closePath(); g.fill(); g.restore();
    };
    // (a₁, a₂) 평행사변형과, x₁이면 (b, a₂), x₂이면 (a₁, b)
    para(a1, a2, c.soft, 0.5);
    if (which === "x1") para(b, a2, c.acc, 0.3); else para(a1, b, c.acc, 0.3);
    if (Math.abs(D) > 1e-6) {
      const x1 = det(b, a2) / D, x2 = det(a1, b) / D;
      // 해의 분해 b = x₁a₁ + x₂a₂
      f.path([[0, 0], [x1 * a1[0], x1 * a1[1]], b], c.ink3, 1.5, [4, 3]);
      f.arrow(0, 0, a1[0], a1[1], c.main, "a₁"); f.arrow(0, 0, a2[0], a2[1], c.main, "a₂"); f.arrow(0, 0, b[0], b[1], c.warn, "b");
      P.forEach((p) => f.dot(p[0], p[1], c.ink, 5));
      k.out(`det(a₁, a₂) = ${fmt(D, 3)} (파란 넓이) · det(${which === "x1" ? "b, a₂" : "a₁, b"}) = ${fmt(which === "x1" ? det(b, a2) : det(a1, b), 3)} (노란 넓이)\n` +
        `x₁ = ${fmt(x1, 3)}, x₂ = ${fmt(x2, 3)} · 검산 x₁a₁ + x₂a₂ = (${fmt(x1 * a1[0] + x2 * a2[0], 3)}, ${fmt(x1 * a1[1] + x2 * a2[1], 3)}) = b`);
    } else {
      f.arrow(0, 0, a1[0], a1[1], c.main, "a₁"); f.arrow(0, 0, a2[0], a2[1], c.main, "a₂"); f.arrow(0, 0, b[0], b[1], c.warn, "b");
      P.forEach((p) => f.dot(p[0], p[1], c.ink, 5));
      k.out("det(a₁, a₂) = 0: 두 열이 평행해 크라머 공식을 쓸 수 없습니다(해가 없거나 무수히 많음).");
    }
  }
  MKit.drag(S.cv, () => f, () => P, (i, x, y) => { P[i] = [Math.round(x * 10) / 10, Math.round(y * 10) / 10]; S.redraw(); });
  S.redraw();
})();
