/* 수학5 탐구: 이항분포 B(n, λ/n)와 포아송분포 Pois(λ) — 막대 비교와 전변동 거리 */
(() => {
  "use strict";
  const S = MKit.setup("card-m5-binpois", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const lgam = (m) => { let s = 0; for (let i = 2; i <= m; i++) s += Math.log(i); return s; };
  function draw() {
    const c = QSim.col(), n = k.val("n"), lam = k.val("l"), p = Math.min(1, lam / n);
    const binom = (j) => (j > n ? 0 : p === 1 ? (j === n ? 1 : 0) : Math.exp(lgam(n) - lgam(j) - lgam(n - j) + j * Math.log(p) + (n - j) * Math.log(1 - p)));
    const pois = (j) => Math.exp(-lam + j * Math.log(lam) - lgam(j));
    const K = Math.max(12, Math.ceil(lam + 4 * Math.sqrt(lam)) + 1);
    let tv = 0, ps = 0; for (let j = 0; j <= n; j++) { tv += Math.abs(binom(j) - pois(j)); ps += pois(j); }
    tv = 0.5 * (tv + (1 - ps));
    let ymax = 0; for (let j = 0; j <= K; j++) ymax = Math.max(ymax, binom(j), pois(j));
    const F = QSim.frame(v, { x0: -0.7, x1: K + 0.7, y0: 0, y1: ymax * 1.15, pad: 30, xl: "k", yl: "확률" });
    F.axes();
    const g = v.g, w = Math.max(2, (F.X(1) - F.X(0)) * 0.36);
    for (let j = 0; j <= K; j++) {
      g.fillStyle = c.main; g.fillRect(F.X(j) - w, F.Y(binom(j)), w, F.Y(0) - F.Y(binom(j)));
      g.fillStyle = c.acc; g.fillRect(F.X(j), F.Y(pois(j)), w, F.Y(0) - F.Y(pois(j)));
    }
    F.text("■ 이항 B(n, λ/n)", K * 0.62, ymax * 1.08, c.main);
    F.text("■ 포아송 Pois(λ)", K * 0.62, ymax * 0.98, c.acc);
    k.out(`n = ${n}, λ = ${fmt(lam, 2)}, p = λ/n = ${fmt(p, 4)} · P(X = 0): 이항 ${fmt(binom(0), 4)}, 포아송 ${fmt(pois(0), 4)}\n전변동 거리 ½Σ|차이| = ${fmt(tv, 4)}`);
  }
  S.redraw();
})();
