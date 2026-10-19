/* 수학16 탐구: 거의 평행한 두 직선 — 오른쪽 변을 조금 바꾸면 교점이 크게 움직임 (조건수) */
(() => {
  "use strict";
  const S = MKit.setup("card-m16-cond", 0.6, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  function draw() {
    const c = QSim.col(), t = Math.pow(10, k.val("lt")), db = k.val("db");
    // A = [[1, 1], [1, 1 + t]], b = [2, 2 + t + db] → 해 (1, 1)에서 출발
    const a = 1, b = 1, cc = 1, d = 1 + t, b1 = 2, b2 = 2 + t + db, det = a * d - b * cc;
    const x = (b1 * d - b * b2) / det, y = (a * b2 - cc * b1) / det;
    const nA = Math.max(a + b, cc + d), nI = Math.max(Math.abs(d) + Math.abs(b), Math.abs(cc) + Math.abs(a)) / Math.abs(det), kap = nA * nI;
    const F = QSim.frame(v, { x0: -2, x1: 4, y0: -1, y1: 3, pad: 26, equal: true, xl: "x", yl: "y" });
    F.axes();
    F.fn((s) => b1 - s, c.main, 2, null, 50);
    F.fn((s) => (b2 - s) / d, c.warn, 2, null, 50);
    F.fn((s) => (2 + t - s) / d, c.ink3, 1, [4, 4], 50);
    F.dot(1, 1, c.ink3, 4);
    if (x > -2 && x < 4 && y > -1 && y < 3) F.dot(x, y, c.acc, 6);
    const relb = Math.abs(db) / (2 + t), relx = Math.max(Math.abs(x - 1), Math.abs(y - 1));
    k.out(`A = [[1, 1], [1, 1 + ${t >= 0.01 ? fmt(t, 2) : t.toExponential(0)}]] · 조건수 κ∞ ≈ ${kap.toExponential(2)}\nb₂를 ${db >= 0 ? "+" : ""}${fmt(db, 4)} 바꿈(상대 ${relb.toExponential(1)}) → 해 (${fmt(x, 4)}, ${fmt(y, 4)}), 해의 상대 변화 ${relx.toExponential(1)} = ${relb > 0 ? fmt(relx / relb, 3) : "-"}배 (상한 κ)`);
  }
  S.redraw();
})();
