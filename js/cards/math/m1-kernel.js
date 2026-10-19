/* 수학1 탐구: 2×2 행렬의 핵과 상 — 정의역의 격자가 어디로 가는지, 무엇이 0으로 눌리는지 */
(() => {
  "use strict";
  const S = MKit.setup("card-m1-kernel", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  function draw() {
    const c = QSim.col(), g = v.g, half = v.W / 2;
    const a = k.val("a"), b = k.val("b"), cc = k.val("c"), d = k.val("d");
    const T = ([x, y]) => [a * x + b * y, cc * x + d * y];
    const det = a * d - b * cc, zero = Math.abs(a) + Math.abs(b) + Math.abs(cc) + Math.abs(d) < 1e-9;
    const rank = zero ? 0 : Math.abs(det) > 1e-9 ? 2 : 1;
    // 핵의 방향(rank 1일 때): 0이 아닌 행 (p, q)에 수직인 (−q, p)
    let ker = null;
    if (rank === 1) { const r = Math.abs(a) + Math.abs(b) > 1e-9 ? [a, b] : [cc, d]; const n = Math.hypot(r[0], r[1]); ker = [-r[1] / n, r[0] / n]; }
    // 상의 방향(rank 1일 때): 0이 아닌 열
    let img = null;
    if (rank === 1) { const col = Math.abs(a) + Math.abs(cc) > 1e-9 ? [a, cc] : [b, d]; const n = Math.hypot(col[0], col[1]); img = [col[0] / n, col[1] / n]; }
    const panel = (off, title, map, extra) => {
      g.save(); g.translate(off, 0);
      const f = QSim.frame({ g, W: half, H: v.H }, { x0: -3, x1: 3, y0: -3, y1: 3, equal: true, pad: 14 });
      f.axes({ noGrid: true });
      for (let i = -2; i <= 2; i++) {
        f.path([map([i, -2]), map([i, 2])], c.rule, 1);
        f.path([map([-2, i]), map([2, i])], c.rule, 1);
      }
      extra(f);
      g.fillStyle = c.ink2; g.font = "12px sans-serif"; g.fillText(title, 18, 14);
      g.restore();
    };
    const sq = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]];
    panel(0, "정의역 V = ℝ²", (p) => p, (f) => {
      f.path(sq, c.main, 2);
      if (ker) f.path([[-4 * ker[0], -4 * ker[1]], [4 * ker[0], 4 * ker[1]]], c.warn, 3);
      if (rank === 0) { g.save(); g.fillStyle = c.warn; g.globalAlpha = 0.15; g.fillRect(f.X(-3), f.Y(3), f.X(3) - f.X(-3), f.Y(-3) - f.Y(3)); g.restore(); }
      f.dot(1, 0, c.ink2, 4); f.dot(0, 1, c.ink2, 4);
    });
    panel(half, "공역 W = ℝ², 색은 상 R(T)", T, (f) => {
      if (rank === 2) { g.save(); g.fillStyle = c.soft; g.globalAlpha = 0.35; g.fillRect(f.X(-3), f.Y(3), f.X(3) - f.X(-3), f.Y(-3) - f.Y(3)); g.restore(); }
      if (img) f.path([[-4 * img[0], -4 * img[1]], [4 * img[0], 4 * img[1]]], c.main, 3);
      f.path(sq.map(T), c.main, 2);
      f.dot(0, 0, c.acc, 5);
    });
    g.strokeStyle = c.rule; g.beginPath(); g.moveTo(half, 6); g.lineTo(half, v.H - 6); g.stroke();
    const desc = rank === 2 ? "핵 = {0}, 상 = 평면 전체" : rank === 1 ? `핵 = 빨간 직선 (방향 (${fmt(ker[0], 2)}, ${fmt(ker[1], 2)})), 상 = 파란 직선` : "핵 = 평면 전체, 상 = {0}";
    k.out(`det = ${fmt(det, 3)} · nullity ${2 - rank} + rank ${rank} = 2\n${desc}`);
  }
  S.redraw();
})();
