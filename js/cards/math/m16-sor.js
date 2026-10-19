/* 수학16 탐구: SOR 완화 인자 ω에 따른 반복 횟수 — tridiag(−1, 2, −1) 모형 문제 */
(() => {
  "use strict";
  const S = MKit.setup("card-m16-sor", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const TOL = 1e-8, MAXIT = 5000;
  const cache = new Map();
  // Ax = 1 (A = tridiag(−1, 2, −1))의 정확한 해: x_i = i(n + 1 − i)/2 (i = 1..n)
  function iters(n, w) {
    const key = n + ":" + w.toFixed(3);
    if (cache.has(key)) return cache.get(key);
    const xs = []; for (let i = 1; i <= n; i++) xs.push((i * (n + 1 - i)) / 2);
    const nx = Math.max(...xs), x = new Float64Array(n);
    let res = null;
    for (let it = 1; it <= MAXIT; it++) {
      let err = 0;
      for (let i = 0; i < n; i++) { const gs = (1 + (i > 0 ? x[i - 1] : 0) + (i < n - 1 ? x[i + 1] : 0)) / 2; x[i] = (1 - w) * x[i] + w * gs; }
      for (let i = 0; i < n; i++) err = Math.max(err, Math.abs(x[i] - xs[i]));
      if (!isFinite(err)) break;
      if (err / nx < TOL) { res = it; break; }
    }
    cache.set(key, res);
    return res;
  }
  function draw() {
    const c = QSim.col(), n = k.val("n"), w = k.val("w");
    const mu = Math.cos(Math.PI / (n + 1)), wopt = 2 / (1 + Math.sqrt(1 - mu * mu));
    const pts = [];
    for (let ww = 0.5; ww <= 1.99 + 1e-9; ww += 0.02) { const r = iters(n, ww); if (r) pts.push([ww, Math.log10(r)]); }
    const G = QSim.frame(v, { x0: 0.5, x1: 2, y0: 0, y1: 3.8, pad: 28, xl: "ω", yl: "log₁₀(반복 횟수)" });
    G.axes();
    G.path(pts, c.main, 2);
    G.path([[wopt, 0], [wopt, 3.8]], c.acc, 1, [4, 4]);
    const r = iters(n, w);
    if (r) G.dot(w, Math.log10(r), c.warn, 6);
    k.out(`n = ${n} · ρ(T_J) = ${fmt(mu, 4)}, 가우스-자이델(ω = 1) ${iters(n, 1) ?? `${MAXIT}번 초과`}번\nω = ${fmt(w, 2)}: ${r ? r + "번" : `${MAXIT}번 안에 수렴하지 않음`} · 최적 ω = ${fmt(wopt, 3)}에서 ${iters(n, Math.round(wopt * 1000) / 1000) ?? "-"}번 (ρ = ${fmt(wopt - 1, 3)})`);
  }
  S.redraw();
})();
