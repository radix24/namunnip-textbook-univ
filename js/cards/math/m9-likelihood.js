/* 수학9 탐구: 베르누이 가능도 — 앞면 k번/n번에서 L(p), 로그가능도, 최댓점과 곡률(표준오차) */
(() => {
  "use strict";
  const S = MKit.setup("card-m9-likelihood", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  function draw() {
    const c = QSim.col(), n = k.val("n"), kk = Math.min(k.val("k"), n), mode = k.val("m");
    const ks = k.$('[name="k"]'); if (+ks.max !== n) { ks.max = n; MKit.setVal(k, "k", Math.min(+ks.value, n)); }
    const ph = kk / n, ll = (p) => (kk ? kk * Math.log(p) : 0) + (n - kk ? (n - kk) * Math.log(1 - p) : 0), lmax = ll(Math.min(Math.max(ph, 1e-9), 1 - 1e-9));
    const se = Math.sqrt((ph * (1 - ph)) / n);
    if (mode === "L") {
      const F = QSim.frame(v, { x0: 0, x1: 1, y0: 0, y1: 1.1, pad: 28, xl: "p", yl: "L(p)/L(p̂)" });
      F.axes(); F.fn((p) => Math.exp(ll(p) - lmax), c.main, 2.4, null, 600);
      F.path([[ph, 0], [ph, 1]], c.warn, 1.5);
      if (se > 0) F.path([[ph - 1.96 * se, Math.exp(-1.92)], [ph + 1.96 * se, Math.exp(-1.92)]], c.acc, 3);
    } else {
      const F = QSim.frame(v, { x0: 0, x1: 1, y0: -8, y1: 0.5, pad: 28, xl: "p", yl: "ℓ(p) − ℓ(p̂)" });
      F.axes(); F.fn((p) => Math.max(-8, ll(p) - lmax), c.main, 2.4, null, 600);
      if (se > 0) F.fn((p) => Math.max(-8, -((p - ph) ** 2) / (2 * se * se)), c.ink3, 1.4, [5, 4]);
      F.path([[0, -1.92], [1, -1.92]], c.acc, 1, [3, 3]);
      F.path([[ph, -8], [ph, 0.5]], c.warn, 1.5);
    }
    k.out(`n = ${n}번 중 앞면 ${kk}번 · MLE p̂ = ${fmt(ph, 4)} · 곡률로 구한 표준오차 √(p̂(1−p̂)/n) = ${fmt(se, 4)}\n로그가능도가 최대에서 1.92 이내인 범위(노랑) ≈ p̂ ± 1.96·표준오차 = [${fmt(ph - 1.96 * se, 3)}, ${fmt(ph + 1.96 * se, 3)}]`);
  }
  S.redraw();
})();
