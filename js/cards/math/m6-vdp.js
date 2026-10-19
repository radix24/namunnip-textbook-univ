/* 수학6 탐구: 반데르폴 방정식 x'' − μ(1 − x²)x' + x = 0 — 안팎의 궤적이 한 극한 순환으로 모인다 */
(() => {
  "use strict";
  let f, X0 = [0.1, 0];
  const S = MKit.setup("card-m6-vdp", 0.5, draw);
  if (!S) return;
  const { k, v, cv } = S;
  const { fmt } = MKit;
  function draw() {
    const c = QSim.col(), mu = k.val("mu"), g = v.g, W = v.W, H = v.H;
    const F = (t, s) => [s[1], mu * (1 - s[0] * s[0]) * s[1] - s[0]];
    const T = Math.max(40, Math.round(12 / mu)), h = 0.005, n = Math.round(T / h);
    let s = X0.slice(), t = 0; const pts = [s], xs = [[0, s[0]]];
    for (let i = 0; i < n; i++) { s = QSim.rk4(F, t, s, h); t += h; pts.push(s); if (i % 4 === 0) xs.push([t, s[0]]); }
    const ylim = Math.max(3.2, ...pts.map((p) => Math.abs(p[1]))) * 1.05;
    f = QSim.frame({ g, W: W * 0.5, H }, { x0: -3.2, x1: 3.2, y0: -ylim, y1: ylim, pad: 22, xl: "x", yl: "x'" });
    f.axes({ noGrid: true });
    // 바깥에서 출발한 비교 궤적
    let s2 = [3, 3], t2 = 0; const out = [s2];
    for (let i = 0; i < n; i++) { s2 = QSim.rk4(F, t2, s2, h); t2 += h; out.push(s2); }
    f.path(out, c.soft, 1.4);
    f.path(pts, c.main, 1.6); f.dot(X0[0], X0[1], c.warn, 6);
    g.save(); g.translate(W * 0.52, 0);
    const R = QSim.frame({ g, W: W * 0.48, H }, { x0: 0, x1: T, y0: -3, y1: 3, pad: 22, xl: "t", yl: "x" });
    R.axes(); R.path(xs, c.main, 1.4);
    g.restore();
    // 진폭과 주기: 마지막 절반에서 극대값과 위로 0을 지나는 시각
    const half = Math.floor(pts.length / 2), amp = Math.max(...pts.slice(half).map((p) => Math.abs(p[0])));
    const cross = []; for (let i = half + 1; i < pts.length; i++) if (pts[i - 1][0] < 0 && pts[i][0] >= 0) cross.push(i * h);
    const per = cross.length > 1 ? (cross[cross.length - 1] - cross[0]) / (cross.length - 1) : NaN;
    k.out(`μ = ${fmt(mu, 2)} · 원점: τ = ${fmt(mu, 2)}, Δ = 1 → 불안정 · 극한 순환의 진폭 ≈ ${fmt(amp, 3)}, 주기 ≈ ${isFinite(per) ? fmt(per, 3) : "-"} (2π ≈ 6.283)\n`
      + `파랑 = 빨간 점(끌 수 있음)에서 출발한 궤적, 연보라 = (3, 3)에서 출발한 궤적. 안팎에서 같은 고리로 모인다`);
  }
  MKit.drag(cv, () => f, () => [X0], (i, x, y) => { X0 = [x, y]; S.redraw(); });
  S.redraw();
})();
