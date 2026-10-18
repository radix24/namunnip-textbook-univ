/* 수학7 탐구: 어디서도 미분 불가능한 함수 f = Σ (3/4)ⁿ φ(4ⁿx) — 확대해도 매끄러워지지 않는다 */
(() => {
  "use strict";
  const S = MKit.setup("card-m7-nowhere", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const phi = (x) => Math.abs(x - Math.round(x));
  const F = (x, N) => { let s = 0, a = 1, b = 1; for (let n = 0; n <= N; n++) { s += a * phi(b * x); a *= 0.75; b *= 4; } return s; };
  function draw() {
    const c = QSim.col(), N = k.val("N"), z = Math.pow(4, k.val("z")), cx = 0.3;
    const w = 0.5 / z, x0 = cx - w, x1 = cx + w;
    const pts = []; let lo = Infinity, hi = -Infinity;
    for (let i = 0; i <= 1200; i++) { const x = x0 + ((x1 - x0) * i) / 1200, y = F(x, N); pts.push([x, y]); lo = Math.min(lo, y); hi = Math.max(hi, y); }
    const pad = (hi - lo) * 0.1 + 1e-9;
    const f = QSim.frame(v, { x0, x1, y0: lo - pad, y1: hi + pad, pad: 40 });
    f.axes({ noGrid: true });
    f.path(pts, c.main, 1.4);
    // 차분몫: x = 0.3 에서 δ_m = ±½·4^{-m}
    const m = Math.min(N, k.val("z") + 2);
    let best = 0;
    for (const sgn of [1, -1]) { const d = sgn * 0.5 * Math.pow(4, -m); best = Math.max(best, Math.abs((F(cx + d, N) - F(cx, N)) / d)); }
    f.dot(cx, F(cx, N), c.warn, 4);
    k.out(`항 ${N + 1}개까지 더함 · 확대 ${z}배 (가로 폭 ${w.toExponential(1)}) · 세로 폭 ${fmt(hi - lo, 4)}\n` +
      `x = 0.3에서 δ = ±½·4^(−${m})의 차분몫 크기 ≈ ${fmt(best, 1)} (증명의 하한 (3^${m} + 1)/2 = ${(Math.pow(3, m) + 1) / 2})`);
  }
  S.redraw();
})();
