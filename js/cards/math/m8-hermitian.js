/* 수학8 탐구: 2×2 복소 행렬 [[a, z], [w, d]] — w = conj(z)·e^{iθ}. θ = 0(에르미트)이면 고유값이 실수 */
(() => {
  "use strict";
  const S = MKit.setup("card-m8-hermitian", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const csqrt = (re, im) => { const r = Math.hypot(re, im), s = Math.sqrt((r + re) / 2), t = Math.sign(im || 1) * Math.sqrt(Math.max(0, (r - re) / 2)); return [s, t]; };
  const im1 = (x) => (Math.abs(x - 1) < 1e-9 ? "" : fmt(x, 3));
  const cs = (re, im) => `${fmt(re, 3)}${im < -1e-9 ? " − " + im1(-im) + "i" : im > 1e-9 ? " + " + im1(im) + "i" : ""}`;
  function draw() {
    const c = QSim.col(), a = k.val("a"), d = k.val("d"), zr = k.val("x"), zi = k.val("y"), th = (k.val("t") * Math.PI) / 180;
    const wr = zr * Math.cos(th) + zi * Math.sin(th), wi = -zi * Math.cos(th) + zr * Math.sin(th);
    const pr = zr * wr - zi * wi, pi = zr * wi + zi * wr, h = (a - d) / 2;
    const [sr, si] = csqrt(h * h + pr, pi), m = (a + d) / 2;
    const L1 = [m + sr, si], L2 = [m - sr, -si];
    const F = QSim.frame(v, { x0: -5, x1: 5, y0: -2.5, y1: 2.5, pad: 28, xl: "Re", yl: "Im" });
    F.axes();
    F.path([[-5, 0], [5, 0]], c.acc, 3);
    F.dot(L1[0], L1[1], c.main, 7); F.dot(L2[0], L2[1], c.warn, 7);
    F.dot(a, 0, c.ink3, 3); F.dot(d, 0, c.ink3, 3);
    const herm = Math.abs(th) < 1e-9;
    k.out(`A = [[${fmt(a, 2)}, ${cs(zr, zi)}], [${cs(wr, wi)}, ${fmt(d, 2)}]] · ${herm ? "에르미트 (A* = A)" : `에르미트에서 θ = ${k.val("t")}° 벗어남`}\n고유값 λ₁ = ${cs(L1[0], L1[1])}, λ₂ = ${cs(L2[0], L2[1])} · 판별식 ((a−d)/2)² + zw = ${cs(h * h + pr, pi)}`);
  }
  S.redraw();
})();
