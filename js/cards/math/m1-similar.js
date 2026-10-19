/* 수학1 탐구: 기저를 끌면 같은 변환의 행렬표현 Q⁻¹AQ가 어떻게 바뀌나 (대각합·행렬식은 그대로) */
(() => {
  "use strict";
  let f;
  const B = [[1, 0.2], [0.3, 1]];
  const S = MKit.setup("card-m1-similar", 0.8, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const MAT = { sym: [[2, 1], [1, 2]], shear: [[1, 1], [0, 1]], rot: [[0, -1], [1, 0]], proj: [[0.2, 0.4], [0.4, 0.8]] };
  function draw() {
    const c = QSim.col(), g = v.g, A = MAT[k.val("mat")];
    const [b1, b2] = B;
    const Q = [[b1[0], b2[0]], [b1[1], b2[1]]], dq = Q[0][0] * Q[1][1] - Q[0][1] * Q[1][0];
    f = QSim.frame(v, { x0: -3.2, x1: 3.2, y0: -3.2, y1: 3.2, equal: true, pad: 22 });
    f.axes();
    const T = (p) => [A[0][0] * p[0] + A[0][1] * p[1], A[1][0] * p[0] + A[1][1] * p[1]];
    // 새 기저의 격자
    for (let i = -3; i <= 3; i++) {
      f.path([[i * b1[0] - 3 * b2[0], i * b1[1] - 3 * b2[1]], [i * b1[0] + 3 * b2[0], i * b1[1] + 3 * b2[1]]], c.rule, 1);
      f.path([[i * b2[0] - 3 * b1[0], i * b2[1] - 3 * b1[1]], [i * b2[0] + 3 * b1[0], i * b2[1] + 3 * b1[1]]], c.rule, 1);
    }
    const Tb1 = T(b1), Tb2 = T(b2);
    f.arrow(0, 0, Tb1[0], Tb1[1], c.main, "T b₁"); f.arrow(0, 0, Tb2[0], Tb2[1], c.acc, "T b₂");
    f.arrow(0, 0, b1[0], b1[1], c.ink, "b₁"); f.arrow(0, 0, b2[0], b2[1], c.ink2, "b₂");
    f.dot(b1[0], b1[1], c.ink, 6); f.dot(b2[0], b2[1], c.ink2, 6);
    if (Math.abs(dq) < 0.05) { k.out("b₁, b₂가 거의 평행해서 기저가 아닙니다. 하나를 옮겨 주세요."); return; }
    // 새 기저에 대한 행렬 = Q⁻¹AQ: 열은 T b_j의 새 좌표
    const inv = [[Q[1][1] / dq, -Q[0][1] / dq], [-Q[1][0] / dq, Q[0][0] / dq]];
    const co = (w) => [inv[0][0] * w[0] + inv[0][1] * w[1], inv[1][0] * w[0] + inv[1][1] * w[1]];
    const c1 = co(Tb1), c2 = co(Tb2);
    const M = [[c1[0], c2[0]], [c1[1], c2[1]]];
    const tr = M[0][0] + M[1][1], de = M[0][0] * M[1][1] - M[0][1] * M[1][0];
    const diag = Math.abs(M[0][1]) < 0.05 && Math.abs(M[1][0]) < 0.05;
    k.out(`새 기저에 대한 행렬 Q⁻¹AQ = [[${fmt(M[0][0], 2)}, ${fmt(M[0][1], 2)}], [${fmt(M[1][0], 2)}, ${fmt(M[1][1], 2)}]]` + (diag ? " ← 거의 대각행렬!" : "") +
      `\n대각합 ${fmt(tr, 3)} (A: ${fmt(A[0][0] + A[1][1], 3)}) · 행렬식 ${fmt(de, 3)} (A: ${fmt(A[0][0] * A[1][1] - A[0][1] * A[1][0], 3)})`);
  }
  MKit.drag(S.cv, () => f, () => B, (i, x, y) => { B[i] = [Math.round(x * 20) / 20, Math.round(y * 20) / 20]; S.redraw(); });
  S.redraw();
})();
