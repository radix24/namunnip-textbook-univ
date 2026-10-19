/* 수학11 탐구: 타원 x² + 4y² = c 위에서 f = x + y — 접할 때 ∇f ∥ ∇g, 승수 λ = dV/dc */
(() => {
  "use strict";
  const S = MKit.setup("card-m11-lagrange", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  function draw() {
    const col = QSim.col(), c = k.val("c"), th = (k.val("th") * Math.PI) / 180;
    const sc = Math.sqrt(c), x = sc * Math.cos(th), y = (sc / 2) * Math.sin(th);
    const F = QSim.frame(v, { x0: -4, x1: 4, y0: -2, y1: 2, pad: 20, equal: true, xl: "x", yl: "y" });
    F.axes({ noGrid: true });
    const ell = (cc) => Array.from({ length: 181 }, (_, i) => { const t = (i / 180) * 2 * Math.PI; return [Math.sqrt(cc) * Math.cos(t), (Math.sqrt(cc) / 2) * Math.sin(t)]; });
    F.path(ell(c), col.ink2, 2);
    const fv = x + y;
    F.path([[-4, fv + 4], [4, fv - 4]], col.acc, 1.4, [5, 4]);
    // 그래디언트(방향만, 길이 0.9로 맞춤)
    const gx = 2 * x, gy = 8 * y, gn = Math.hypot(gx, gy) || 1;
    F.arrow(x, y, 0.9 / Math.SQRT2, 0.9 / Math.SQRT2, col.acc, "∇f");
    F.arrow(x, y, (0.9 * gx) / gn, (0.9 * gy) / gn, col.main, "∇g");
    F.dot(x, y, col.warn, 5);
    const lam = Math.sqrt(5 / (16 * c)), V = Math.sqrt(5 * c) / 2, xs = 1 / (2 * lam), ys = 1 / (8 * lam);
    F.dot(xs, ys, col.ink3, 3.5);
    // 두 그래디언트 사이의 각
    const cosang = (gx + gy) / (Math.SQRT2 * gn), ang = (Math.acos(Math.max(-1, Math.min(1, cosang))) * 180) / Math.PI;
    const d = 1e-4, Vd = Math.sqrt(5 * (c + d)) / 2;
    k.out(`c = ${fmt(c, 2)}, 점 (${fmt(x, 3)}, ${fmt(y, 3)}): f = ${fmt(fv, 4)}, ∇f와 ∇g 사이의 각 ${fmt(ang, 1)}°\n최댓값 V(c) = √(5c)/2 = ${fmt(V, 4)} (점 (${fmt(xs, 4)}, ${fmt(ys, 4)})), 승수 λ = ${fmt(lam, 4)} · 수치 미분 [V(c + 10⁻⁴) − V(c)]/10⁻⁴ = ${fmt((Vd - V) / d, 4)}`);
  }
  S.redraw();
})();
