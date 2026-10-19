/* 수학13 탐구: 방향도함수 v_p[f] = d/dt f(p + t v)|₀ = ∇f(p)·v — 등고선과 단면 그래프 */
(() => {
  "use strict";
  const S = MKit.setup("card-m13-dirderiv", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const FN = {
    sad: { name: "f = x² − y²", f: (x, y) => x * x - y * y, g: (x, y) => [2 * x, -2 * y] },
    bump: { name: "f = e^(−x² − y²)", f: (x, y) => Math.exp(-x * x - y * y), g: (x, y) => { const e = Math.exp(-x * x - y * y); return [-2 * x * e, -2 * y * e]; } },
    lin: { name: "f = x + 2y", f: (x, y) => x + 2 * y, g: () => [1, 2] },
  };
  function contours(F, fr, f, x0, x1, y0, y1, levels, col) {
    const nx = 60, ny = 60, vals = [];
    for (let j = 0; j <= ny; j++) { vals.push([]); for (let i = 0; i <= nx; i++) vals[j].push(f(x0 + ((x1 - x0) * i) / nx, y0 + ((y1 - y0) * j) / ny)); }
    const g = fr.g; g.save(); g.strokeStyle = col; g.lineWidth = 1; g.globalAlpha = 0.7; g.beginPath();
    for (const L of levels) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const xa = x0 + ((x1 - x0) * i) / nx, ya = y0 + ((y1 - y0) * j) / ny, dx = (x1 - x0) / nx, dy = (y1 - y0) / ny;
      const q = [[xa, ya, vals[j][i]], [xa + dx, ya, vals[j][i + 1]], [xa + dx, ya + dy, vals[j + 1][i + 1]], [xa, ya + dy, vals[j + 1][i]]], cr = [];
      for (let t = 0; t < 4; t++) { const P = q[t], Q = q[(t + 1) % 4]; if ((P[2] - L) * (Q[2] - L) < 0) { const s = (L - P[2]) / (Q[2] - P[2]); cr.push([P[0] + s * (Q[0] - P[0]), P[1] + s * (Q[1] - P[1])]); } }
      if (cr.length >= 2) { g.moveTo(F.X(cr[0][0]), F.Y(cr[0][1])); g.lineTo(F.X(cr[1][0]), F.Y(cr[1][1])); }
    }
    g.stroke(); g.restore();
  }
  function draw() {
    const c = QSim.col(), Fn = FN[k.val("f")], px = k.val("px"), py = k.val("py"), th = (k.val("th") * Math.PI) / 180, L = k.val("L");
    const vx = L * Math.cos(th), vy = L * Math.sin(th);
    const W = v.W, H = v.H, g = v.g, half = W / 2;
    const Lf = QSim.frame({ g, W: half, H }, { x0: -2, x1: 2, y0: -2, y1: 2, pad: 18, equal: true });
    Lf.axes({ noGrid: true });
    const lv = Fn.f === FN.lin.f ? [-4, -3, -2, -1, 0, 1, 2, 3, 4] : Fn.f === FN.bump.f ? [0.1, 0.3, 0.5, 0.7, 0.9] : [-3, -2, -1, -0.5, 0, 0.5, 1, 2, 3];
    contours(Lf, { g }, Fn.f, -2, 2, -2, 2, lv, c.ink3);
    Lf.path([[px - 3 * vx, py - 3 * vy], [px + 3 * vx, py + 3 * vy]], c.acc, 1, [4, 4]);
    const gr = Fn.g(px, py);
    Lf.arrow(px, py, gr[0] * 0.3, gr[1] * 0.3, c.ink2, "∇f/3");
    Lf.arrow(px, py, vx, vy, c.main, "v");
    Lf.dot(px, py, c.warn, 4.5);
    g.save(); g.translate(half, 0);
    const gt = (t) => Fn.f(px + t * vx, py + t * vy);
    let lo = Infinity, hi = -Infinity; for (let i = 0; i <= 100; i++) { const y = gt(-1 + i / 50); lo = Math.min(lo, y); hi = Math.max(hi, y); }
    const pad = (hi - lo) * 0.15 + 0.1;
    const R = QSim.frame({ g, W: half, H }, { x0: -1, x1: 1, y0: lo - pad, y1: hi + pad, pad: 26, xl: "t", yl: "f(p + tv)" });
    R.axes();
    R.fn(gt, c.main, 2);
    const dd = gr[0] * vx + gr[1] * vy;
    R.path([[-1, gt(0) - dd], [1, gt(0) + dd]], c.acc, 1.4, [5, 4]);
    R.dot(0, gt(0), c.warn, 4.5);
    g.restore();
    const h = 1e-5, num = (gt(h) - gt(-h)) / (2 * h);
    k.out(`${Fn.name}, p = (${fmt(px, 2)}, ${fmt(py, 2)}), v = (${fmt(vx, 3)}, ${fmt(vy, 3)}) (|v| = ${fmt(L, 2)})\n∇f(p) = (${fmt(gr[0], 4)}, ${fmt(gr[1], 4)}) · v_p[f] = ∇f·v = ${fmt(dd, 5)} · 단면의 기울기(수치) ${fmt(num, 5)}`);
  }
  S.redraw();
})();
