/* 수학6 탐구: 강제 감쇠 진동 y'' + 2ζy' + y = cos ωt — 진폭 곡선과 시간 그래프, 공명 */
(() => {
  "use strict";
  const S = MKit.setup("card-m6-resonance", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const amp = (z, w) => 1 / Math.hypot(1 - w * w, 2 * z * w);
  function draw() {
    const c = QSim.col(), z = k.val("z"), w = k.val("w"), g = v.g, W = v.W, H = v.H;
    const A = amp(z, w), top = Math.min(12, Math.max(3, amp(z, Math.sqrt(Math.max(0, 1 - 2 * z * z))) * 1.15));
    const L = QSim.frame({ g, W: W * 0.38, H }, { x0: 0, x1: 2.2, y0: 0, y1: top, pad: 26, xl: "ω", yl: "진폭" });
    L.axes(); L.fn((x) => Math.min(top * 1.5, amp(z, x)), c.main, 2, null, 300); L.dot(w, Math.min(top, A), c.warn, 6);
    // 시간 그래프 (RK4, 정지 상태에서 출발)
    const T = 60, n = 3000, h = T / n; let y = [0, 0], t = 0; const pts = [[0, 0]];
    for (let i = 0; i < n; i++) { y = QSim.rk4((tt, s) => [s[1], Math.cos(w * tt) - 2 * z * s[1] - s[0]], t, y, h); t += h; pts.push([t, y[0]]); }
    const ymax = Math.max(1, ...pts.map((p) => Math.abs(p[1]))) * 1.1;
    g.save(); g.translate(W * 0.4, 0);
    const R = QSim.frame({ g, W: W * 0.6, H }, { x0: 0, x1: T, y0: -ymax, y1: ymax, pad: 28, xl: "t", yl: "y" });
    R.axes(); R.path(pts, c.main, 1.4);
    if (isFinite(A) && A < ymax) { R.path([[0, A], [T, A]], c.warn, 1, [4, 4]); R.path([[0, -A], [T, -A]], c.warn, 1, [4, 4]); }
    g.restore();
    const last = Math.max(...pts.slice(-600).map((p) => Math.abs(p[1])));
    k.out(`ζ = ${fmt(z, 2)}, ω = ${fmt(w, 2)} · 정상상태 진폭 1/√((1 − ω²)² + (2ζω)²) = ${isFinite(A) ? fmt(A, 3) : "∞"} (빨간 점선)\n`
      + `t ∈ [48, 60]에서 관측한 최대 |y| = ${fmt(last, 3)}` + (z === 0 && Math.abs(w - 1) < 1e-9 ? " · 공명: 진폭이 t/2로 끝없이 자란다" : ""));
  }
  S.redraw();
})();
