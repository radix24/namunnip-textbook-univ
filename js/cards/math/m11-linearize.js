/* 수학11 탐구: 작은 원의 상과 일차 근사(야코비 행렬)의 상 — 오차/반지름이 0으로 */
(() => {
  "use strict";
  const S = MKit.setup("card-m11-linearize", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const MAPS = {
    sq: { name: "F(x, y) = (x² − y², 2xy)", F: (x, y) => [x * x - y * y, 2 * x * y], J: (x, y) => [[2 * x, -2 * y], [2 * y, 2 * x]] },
    pol: { name: "극좌표 (r, θ) ↦ (r cos θ, r sin θ)", F: (r, t) => [r * Math.cos(t), r * Math.sin(t)], J: (r, t) => [[Math.cos(t), -r * Math.sin(t)], [Math.sin(t), r * Math.cos(t)]] },
    sh: { name: "F(x, y) = (x + 0.5 sin y, y + 0.5 sin x)", F: (x, y) => [x + 0.5 * Math.sin(y), y + 0.5 * Math.sin(x)], J: (x, y) => [[1, 0.5 * Math.cos(y)], [0.5 * Math.cos(x), 1]] },
  };
  function draw() {
    const c = QSim.col(), M = MAPS[k.val("m")], px = k.val("px"), py = k.val("py"), r = Math.pow(10, k.val("lr"));
    const [fx, fy] = M.F(px, py), J = M.J(px, py);
    const W = v.W, H = v.H, g = v.g, half = W / 2;
    const N = 120, dom = [], img = [], lin = [];
    let emax = 0;
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * 2 * Math.PI, hx = r * Math.cos(t), hy = r * Math.sin(t);
      dom.push([px + hx, py + hy]);
      const q = M.F(px + hx, py + hy), l = [fx + J[0][0] * hx + J[0][1] * hy, fy + J[1][0] * hx + J[1][1] * hy];
      img.push(q); lin.push(l);
      emax = Math.max(emax, Math.hypot(q[0] - l[0], q[1] - l[1]));
    }
    // 화면 반경: 원과 상이 보이도록 자동 확대
    const sc = (pts, cx, cy) => Math.max(...pts.map((p) => Math.max(Math.abs(p[0] - cx), Math.abs(p[1] - cy)))) * 1.3 + 1e-12;
    const s1 = sc(dom, px, py), s2 = sc(img.concat(lin), fx, fy);
    const L = QSim.frame({ g, W: half, H }, { x0: px - s1 * 1.6, x1: px + s1 * 1.6, y0: py - s1, y1: py + s1, pad: 18, equal: true });
    L.axes({ noGrid: true });
    L.path(dom, c.ink2, 1.8); L.dot(px, py, c.warn, 4);
    L.text("정의역의 원", px - s1 * 1.5, py + s1 * 0.85, c.ink3);
    g.save(); g.translate(half, 0);
    const R = QSim.frame({ g, W: half, H }, { x0: fx - s2 * 1.6, x1: fx + s2 * 1.6, y0: fy - s2, y1: fy + s2, pad: 18, equal: true });
    R.axes({ noGrid: true });
    R.path(lin, c.acc, 1.4, [4, 3]); R.path(img, c.main, 2); R.dot(fx, fy, c.warn, 4);
    R.text("상 F(원)과 일차 근사(점선)", fx - s2 * 1.5, fy + s2 * 0.85, c.ink3);
    g.restore();
    const det = J[0][0] * J[1][1] - J[0][1] * J[1][0];
    k.out(`${M.name}, p = (${fmt(px, 2)}, ${fmt(py, 2)}), 반지름 r = ${r < 0.01 ? r.toExponential(0) : fmt(r, 3)}\n야코비 행렬 [[${fmt(J[0][0], 3)}, ${fmt(J[0][1], 3)}], [${fmt(J[1][0], 3)}, ${fmt(J[1][1], 3)}]], 행렬식 ${fmt(det, 3)} · 최대 오차/r = ${(emax / r).toExponential(2)}`);
  }
  S.redraw();
})();
