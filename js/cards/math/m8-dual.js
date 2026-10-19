/* 수학8 탐구: 쌍대 가중치 u로 제약을 섞어 목적함수의 상한 만들기 — 약쌍대성 */
(() => {
  "use strict";
  const S = MKit.setup("card-m8-dual", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  function draw() {
    const c = QSim.col(), u1 = k.val("u1"), u2 = k.val("u2"), u3 = k.val("u3"), g = v.g;
    const a = u1 + 3 * u3, b = 2 * u2 + 2 * u3, bound = 4 * u1 + 12 * u2 + 18 * u3, feas = a >= 3 - 1e-9 && b >= 5 - 1e-9;
    const F = QSim.frame(v, { x0: -0.5, x1: 9, y0: -0.5, y1: 9, pad: 26, xl: "x", yl: "y" });
    F.axes();
    const V = [[0, 0], [4, 0], [4, 3], [2, 6], [0, 6]];
    g.fillStyle = c.soft; g.beginPath(); V.forEach(([x, y], i) => (i ? g.lineTo(F.X(x), F.Y(y)) : g.moveTo(F.X(x), F.Y(y)))); g.closePath(); g.fill();
    F.fn((x) => (36 - 3 * x) / 5, c.warn, 1.6, [5, 4]);
    if (b > 1e-9) F.fn((x) => (bound - a * x) / b, c.main, 2.2); else if (a > 1e-9) F.path([[bound / a, -0.5], [bound / a, 9]], c.main, 2.2);
    F.dot(2, 6, c.warn, 5);
    k.out(`u = (${fmt(u1, 2)}, ${fmt(u2, 2)}, ${fmt(u3, 2)}) → 섞은 부등식 ${fmt(a, 2)}x + ${fmt(b, 2)}y ≤ ${fmt(bound, 2)} (파랑)\n${feas ? `쌍대 실행 가능 (${fmt(a, 2)} ≥ 3, ${fmt(b, 2)} ≥ 5): 상한 3x + 5y ≤ ${fmt(bound, 2)} 보장 · 최댓값 36과의 차 ${fmt(bound - 36, 2)}` : `쌍대 실행 불가능 (${a < 3 - 1e-9 ? `x 계수 ${fmt(a, 2)} < 3` : ""}${a < 3 - 1e-9 && b < 5 - 1e-9 ? ", " : ""}${b < 5 - 1e-9 ? `y 계수 ${fmt(b, 2)} < 5` : ""}): 상한이 되지 않음`}`);
  }
  S.redraw();
})();
