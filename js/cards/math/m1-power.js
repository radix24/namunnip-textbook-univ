/* 수학1 탐구: x_{k+1} = A x_k를 반복하면 점들이 가장 큰 고유값의 고유벡터 방향으로 돌아선다 */
(() => {
  "use strict";
  let f;
  const X0 = [[0.4, -0.9]];
  const MAT = { fib: [[1, 1], [1, 0]], pop: [[0.9, 0.2], [0.1, 0.8]], ex: [[4, -2], [1, 1]], rot: [[0.8, -0.6], [0.6, 0.8]], neg: [[0.5, 1], [1, 0.5]] };
  const S = MKit.setup("card-m1-power", 0.8, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const eig = (A) => {
    const [[a, b], [c, d]] = A, tr = a + d, det = a * d - b * c, disc = tr * tr - 4 * det;
    if (disc < 0) return null;
    const ls = [(tr + Math.sqrt(disc)) / 2, (tr - Math.sqrt(disc)) / 2].sort((x, y) => Math.abs(y) - Math.abs(x));
    return ls.map((l) => { let w = Math.abs(b) > 1e-12 ? [b, l - a] : Math.abs(c) > 1e-12 ? [l - d, c] : (Math.abs(a - l) < 1e-12 ? [1, 0] : [0, 1]); const n = Math.hypot(...w); return { l, v: [w[0] / n, w[1] / n] }; });
  };
  function draw() {
    const c = QSim.col(), A = MAT[k.val("mat")], K = k.val("k"), norm = k.val("norm");
    f = QSim.frame(v, { x0: -2, x1: 2, y0: -2, y1: 2, equal: true, pad: 22 });
    f.axes();
    const E = eig(A);
    if (E) E.forEach((e, i) => f.path([[-3 * e.v[0], -3 * e.v[1]], [3 * e.v[0], 3 * e.v[1]]], i === 0 ? c.acc : c.rule, i === 0 ? 2.5 : 1.5, [6, 4]));
    let x = X0[0].slice(); const pts = [x];
    let ratio = NaN;
    for (let j = 0; j < K; j++) {
      const y = [A[0][0] * x[0] + A[0][1] * x[1], A[1][0] * x[0] + A[1][1] * x[1]];
      const n0 = Math.hypot(...x), n1 = Math.hypot(...y);
      ratio = n1 / n0;
      x = norm ? [y[0] / n1, y[1] / n1] : y; pts.push(x);
    }
    pts.forEach((p, j) => { const t = j / Math.max(1, K); f.dot(Math.max(-2, Math.min(2, p[0])), Math.max(-2, Math.min(2, p[1])), j === 0 ? c.ink : `rgba(75,79,224,${0.25 + 0.75 * t})`, j === pts.length - 1 ? 6 : 3.5); });
    f.path(pts.map((p) => [Math.max(-2, Math.min(2, p[0])), Math.max(-2, Math.min(2, p[1]))]), c.main, 1);
    const last = pts[pts.length - 1], ang = (p) => (Math.atan2(p[1], p[0]) * 180) / Math.PI;
    const desc = E ? `고유값 ${E.map((e) => fmt(e.l, 3)).join(", ")} · 노란 점선이 절댓값이 큰 고유값 ${fmt(E[0].l, 3)}의 방향` : "실수 고유값이 없습니다(회전 성분): 방향이 한 곳으로 모이지 않습니다";
    k.out(`${desc}\n${K}번 곱한 뒤 방향 ${fmt(ang(last), 1)}°` + (E ? ` (고유벡터 방향 ${fmt(ang(E[0].v), 1)}° 또는 반대)` : "") + ` · 마지막 한 번의 길이 배율 ${fmt(ratio, 4)}`);
  }
  MKit.drag(S.cv, () => f, () => X0, (i, x, y) => { X0[0] = [x, y]; S.redraw(); });
  S.redraw();
})();
