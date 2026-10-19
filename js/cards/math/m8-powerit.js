/* 수학8 탐구: 대칭 행렬 [[2, b], [b, d]]에 거듭제곱법 — 벡터의 수렴과 레일리 몫 오차 */
(() => {
  "use strict";
  const S = MKit.setup("card-m8-powerit", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  function draw() {
    const c = QSim.col(), b = k.val("b"), d = k.val("d"), K = k.val("k"), g = v.g, W = v.W, H = v.H;
    const a = 2, tr = a + d, disc = Math.sqrt(((a - d) / 2) ** 2 + b * b), L1 = tr / 2 + disc, L2 = tr / 2 - disc;
    const big = Math.abs(L1) >= Math.abs(L2) ? L1 : L2, small = big === L1 ? L2 : L1;
    let x = [1, 0]; const xs = [x.slice()], errs = [];
    for (let i = 0; i < 40; i++) { const y = [a * x[0] + b * x[1], b * x[0] + d * x[1]], n = Math.hypot(y[0], y[1]) || 1; x = [y[0] / n, y[1] / n]; xs.push(x.slice()); const rq = x[0] * (a * x[0] + b * x[1]) + x[1] * (b * x[0] + d * x[1]); errs.push(Math.abs(rq - big)); }
    const L = QSim.frame({ g, W: W * 0.42, H }, { x0: -1.3, x1: 1.3, y0: -1.3, y1: 1.3, pad: 16 });
    const circ = []; for (let i = 0; i <= 80; i++) circ.push([Math.cos((2 * Math.PI * i) / 80), Math.sin((2 * Math.PI * i) / 80)]);
    L.path(circ, c.ink3, 1, [3, 3]);
    let ev = Math.abs(b) > 1e-12 ? [b, big - a] : Math.abs(big - a) < 1e-12 ? [1, 0] : [0, 1]; const r = Math.hypot(ev[0], ev[1]); ev = [ev[0] / r, ev[1] / r];
    L.path([[-1.3 * ev[0], -1.3 * ev[1]], [1.3 * ev[0], 1.3 * ev[1]]], c.warn, 1.6);
    for (let i = 0; i <= K; i++) { L.path([[0, 0], xs[i]], i === K ? c.main : c.soft, i === K ? 2.4 : 1); }
    g.save(); g.translate(W * 0.45, 0);
    const R = QSim.frame({ g, W: W * 0.55, H }, { x0: 0, x1: 40, y0: -16, y1: 1, pad: 28, xl: "k", yl: "log₁₀ |μₖ − λ₁|" });
    R.axes();
    R.path(errs.map((e, i) => [i + 1, Math.max(-16, Math.log10(Math.max(e, 1e-16)))]), c.main, 2);
    const q = Math.abs(small / big);
    if (q > 0) R.fn((t) => Math.max(-16, Math.log10(errs[0] || 1) + 2 * (t - 1) * Math.log10(q)), c.warn, 1.2, [5, 4]);
    R.dot(K, Math.max(-16, Math.log10(Math.max(errs[K - 1] || 1e-16, 1e-16))), c.acc, 5);
    g.restore();
    k.out(`A = [[2, ${fmt(b, 2)}], [${fmt(b, 2)}, ${fmt(d, 2)}]] · 고유값 ${fmt(L1, 4)}, ${fmt(L2, 4)} · 비 |λ₂/λ₁| = ${fmt(q, 4)}\n${K}단계: 레일리 몫 ${fmt(xs[K][0] * (a * xs[K][0] + b * xs[K][1]) + xs[K][1] * (b * xs[K][0] + d * xs[K][1]), 8)}, 오차 ${(errs[K - 1] ?? 0).toExponential(2)} · 점선: 기울기 (비)² 의 예측`);
  }
  S.redraw();
})();
