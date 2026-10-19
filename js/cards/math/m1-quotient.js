/* 수학1 탐구: 상공간 ℝ²/W — 잉여류(평행한 직선)끼리 더하기. 대표를 바꿔도 결과 직선은 그대로 */
(() => {
  "use strict";
  let f;
  const P = [[1.2, -0.6], [-0.4, 1.0]];
  const S = MKit.setup("card-m1-quotient", 0.8, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  function draw() {
    const c = QSim.col(), th = (k.val("th") * Math.PI) / 180, s = k.val("s"), t = k.val("t");
    const d = [Math.cos(th), Math.sin(th)], n = [-d[1], d[0]];
    f = QSim.frame(v, { x0: -3.2, x1: 3.2, y0: -3.2, y1: 3.2, equal: true, pad: 22 });
    f.axes();
    const line = (p, col, w, dash) => f.path([[p[0] - 6 * d[0], p[1] - 6 * d[1]], [p[0] + 6 * d[0], p[1] + 6 * d[1]]], col, w, dash);
    // 잉여류 몇 개를 옅게
    for (let j = -4; j <= 4; j++) line([j * 0.8 * n[0], j * 0.8 * n[1]], c.rule, 1);
    line([0, 0], c.ink3, 2.5);
    const [u, w] = P;
    // 대표를 W 방향으로 s, t만큼 옮긴 것
    const u2 = [u[0] + s * d[0], u[1] + s * d[1]], w2 = [w[0] + t * d[0], w[1] + t * d[1]];
    const sum = [u2[0] + w2[0], u2[1] + w2[1]];
    line(u, c.main, 2); line(w, c.acc, 2); line(sum, c.warn, 2.5);
    f.arrow(0, 0, u2[0], u2[1], c.main, "u′"); f.arrow(0, 0, w2[0], w2[1], c.acc, "v′");
    f.arrow(0, 0, sum[0], sum[1], c.warn, "u′+v′");
    f.dot(u[0], u[1], c.ink, 6); f.dot(w[0], w[1], c.ink, 6);
    // 잉여류의 "이름": 법선 방향 성분(W에 수직인 좌표)
    const key = (p) => p[0] * n[0] + p[1] * n[1];
    k.out(`W 방향 각 ${k.val("th")}° · 잉여류는 W에 평행한 직선이고, 직선마다 수직 좌표 하나로 구별됩니다\n` +
      `u + W의 좌표 ${fmt(key(u), 3)}, v + W의 좌표 ${fmt(key(w), 3)}, 합의 좌표 ${fmt(key(sum), 3)} (= ${fmt(key(u) + key(w), 3)}) · 대표를 옮겨도 그대로`);
  }
  MKit.drag(S.cv, () => f, () => P, (i, x, y) => { P[i] = [x, y]; S.redraw(); });
  S.redraw();
})();
