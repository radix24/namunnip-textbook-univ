/* 수학1 탐구: 행렬식 = 부호 있는 넓이. 한 행의 배수 더하기(층밀림)는 넓이를 바꾸지 않고, 상수배는 그 배만큼, 교환은 부호를 바꾼다 */
(() => {
  "use strict";
  let f;
  const R = [[2, 0.5], [0.6, 1.5]];
  const S = MKit.setup("card-m1-det", 0.8, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  function draw() {
    const c = QSim.col(), g = v.g, kk = k.val("k"), m = k.val("m"), sw = k.val("sw");
    // r1' = k(r1 + m r2), r2' = r2, 교환이면 순서를 바꿈
    const r1 = [kk * (R[0][0] + m * R[1][0]), kk * (R[0][1] + m * R[1][1])], r2 = R[1];
    const [p, q] = sw ? [r2, r1] : [r1, r2];
    const det = p[0] * q[1] - p[1] * q[0], det0 = R[0][0] * R[1][1] - R[0][1] * R[1][0];
    f = QSim.frame(v, { x0: -3.5, x1: 4.5, y0: -2.5, y1: 4, equal: true, pad: 22 });
    f.axes();
    // 원래 평행사변형(점선)과 바뀐 평행사변형(색: 양수 파랑, 음수 빨강)
    f.path([[0, 0], R[0], [R[0][0] + R[1][0], R[0][1] + R[1][1]], R[1], [0, 0]], c.ink3, 1, [4, 4]);
    g.save(); g.fillStyle = det >= 0 ? c.soft : c.warn; g.globalAlpha = det >= 0 ? 0.55 : 0.2; g.beginPath();
    [[0, 0], p, [p[0] + q[0], p[1] + q[1]], q].forEach(([x, y], i) => (i ? g.lineTo(f.X(x), f.Y(y)) : g.moveTo(f.X(x), f.Y(y))));
    g.closePath(); g.fill(); g.restore();
    f.arrow(0, 0, p[0], p[1], c.main, "1행"); f.arrow(0, 0, q[0], q[1], c.acc, "2행");
    f.dot(R[0][0], R[0][1], c.ink, 6); f.dot(R[1][0], R[1][1], c.ink, 6);
    k.out(`원래 행렬식 ${fmt(det0, 3)} · 바뀐 행렬식 ${fmt(det, 3)}\n` +
      `예상: ${kk === 1 ? "" : `${fmt(kk, 2)}배(상수배) `}${m === 0 ? "" : "× 1(배수 더하기는 불변) "}${sw ? "× (−1)(교환) " : ""}= ${fmt(det0 * kk * (sw ? -1 : 1), 3)}`);
  }
  MKit.drag(S.cv, () => f, () => R, (i, x, y) => { R[i] = [Math.round(x * 10) / 10, Math.round(y * 10) / 10]; S.redraw(); });
  S.redraw();
})();
