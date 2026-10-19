/* 수학5 탐구: 이변량 정규분포 — 등고선, 표본, X = x에서 자른 조건부분포 */
(() => {
  "use strict";
  const S = MKit.setup("card-m5-joint", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const erf = (x) => { const s = Math.sign(x), a = Math.abs(x), t = 1 / (1 + 0.3275911 * a); return s * (1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a)); };
  const Phi = (z) => 0.5 * (1 + erf(z / Math.SQRT2));
  const phi = (z) => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
  function draw() {
    const c = QSim.col(), rho = k.val("r"), x0 = k.val("x"), g = v.g, W = v.W, H = v.H, sd = Math.sqrt(1 - rho * rho);
    const L = QSim.frame({ g, W: W * 0.5, H }, { x0: -3.2, x1: 3.2, y0: -3.2, y1: 3.2, pad: 26, xl: "x", yl: "y" });
    L.axes({ noGrid: true });
    let s = 99; const u = () => { s = (s + 0x6d2b79f5) | 0; let r = Math.imul(s ^ (s >>> 15), 1 | s); r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r; return (((r ^ (r >>> 14)) >>> 0) + 0.5) / 4294967296; };
    g.fillStyle = c.ink3; g.globalAlpha = 0.45;
    for (let i = 0; i < 700; i++) { const R = Math.sqrt(-2 * Math.log(u())), th = 2 * Math.PI * u(), z1 = R * Math.cos(th), z2 = R * Math.sin(th), X = z1, Y = rho * z1 + sd * z2; g.fillRect(L.X(X) - 1, L.Y(Y) - 1, 2, 2); }
    g.globalAlpha = 1;
    [1, 2].forEach((r) => { const a = Math.sqrt(1 + rho) * r, b = Math.sqrt(1 - rho) * r, pts = []; for (let i = 0; i <= 120; i++) { const t = (2 * Math.PI * i) / 120; pts.push([(a * Math.cos(t) + b * Math.sin(t)) / Math.SQRT2, (a * Math.cos(t) - b * Math.sin(t)) / Math.SQRT2]); } L.path(pts, c.main, 1.5); });
    L.path([[-3.2, -3.2 * rho], [3.2, 3.2 * rho]], c.acc, 2);
    L.path([[-3.2, -3.2], [3.2, 3.2]], c.ink3, 1, [4, 4]);
    L.path([[x0, -3.2], [x0, 3.2]], c.warn, 1.5);
    L.dot(x0, rho * x0, c.warn, 5);
    g.save(); g.translate(W * 0.52, 0);
    const R = QSim.frame({ g, W: W * 0.48, H }, { x0: -3.2, x1: 3.2, y0: 0, y1: Math.max(0.45, 1 / (sd * Math.sqrt(2 * Math.PI))) * 1.1, pad: 26, xl: "y", yl: "밀도" });
    R.axes({ noGrid: true });
    R.fn((y) => phi(y), c.ink3, 1.5, [4, 4]);
    R.fn((y) => phi((y - rho * x0) / sd) / sd, c.warn, 2.2);
    g.restore();
    const above = 1 - Phi((x0 - rho * x0) / sd);
    k.out(`ρ = ${fmt(rho, 2)}, x = ${fmt(x0, 2)} · Y | X = x ~ N(${fmt(rho * x0, 3)}, ${fmt(1 - rho * rho, 3)}), 조건부 표준편차 ${fmt(sd, 3)}\n노랑: 회귀 직선 y = ρx, 점선: y = x · P(Y > x | X = x) = ${fmt(above, 4)}`);
  }
  S.redraw();
})();
