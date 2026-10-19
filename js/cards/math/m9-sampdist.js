/* 수학9 탐구: N(50, 4²) 표본 3000개 — 표본평균과 (n−1)S²/σ²의 히스토그램, 이론 분포 */
(() => {
  "use strict";
  const S = MKit.setup("card-m9-sampdist", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const MU = 50, SD = 4, R = 3000;
  function draw() {
    const c = QSim.col(), st = k.val("s"), n = k.val("n"), g = v.g;
    const { n: rn } = M9.rng(1234 + n);
    const vals = []; let hit = 0;
    for (let r = 0; r < R; r++) {
      let s1 = 0, s2 = 0; const xs = [];
      for (let i = 0; i < n; i++) { const x = MU + SD * rn(); xs.push(x); s1 += x; }
      const m = s1 / n; xs.forEach((x) => (s2 += (x - m) ** 2)); const s2v = s2 / (n - 1);
      if (st === "mean") { vals.push(m); if (m > 52) hit++; } else { vals.push(((n - 1) * s2v) / (SD * SD)); if (s2v > 27.5) hit++; }
    }
    let lo, hi, pdf, theo, ev;
    if (st === "mean") { const se = SD / Math.sqrt(n); lo = MU - 4 * se; hi = MU + 4 * se; pdf = (x) => M9.normPdf((x - MU) / se) / se; theo = 1 - M9.normCdf(2 / se); ev = "P(X̄ > 52)"; }
    else { lo = 0; hi = Math.max(10, n - 1 + 5 * Math.sqrt(2 * (n - 1))); pdf = (x) => M9.chi2Pdf(x, n - 1); theo = 1 - M9.chi2Cdf(((n - 1) * 27.5) / 16, n - 1); ev = "P(S² > 27.5)"; }
    const B = 40, bw = (hi - lo) / B, cnt = new Array(B).fill(0);
    vals.forEach((x) => { const j = Math.floor((x - lo) / bw); if (j >= 0 && j < B) cnt[j]++; });
    let ym = 0; cnt.forEach((m) => (ym = Math.max(ym, m / (R * bw)))); for (let i = 0; i <= 100; i++) ym = Math.max(ym, Math.min(pdf(lo + ((hi - lo) * (i + 0.5)) / 100), 5));
    const F = QSim.frame(v, { x0: lo, x1: hi, y0: 0, y1: ym * 1.1, pad: 30, xl: st === "mean" ? "x̄" : "(n−1)s²/σ²", yl: "밀도" });
    F.axes();
    g.fillStyle = c.soft; g.strokeStyle = c.main; g.lineWidth = 1;
    cnt.forEach((m, j) => { const h = m / (R * bw), X0 = F.X(lo + j * bw), X1 = F.X(lo + (j + 1) * bw); g.fillRect(X0, F.Y(h), X1 - X0, F.Y(0) - F.Y(h)); g.strokeRect(X0, F.Y(h), X1 - X0, F.Y(0) - F.Y(h)); });
    F.fn((x) => Math.min(pdf(x), ym * 1.1), c.warn, 2.2);
    k.out(`N(50, 4²)에서 크기 ${n}인 표본 ${R}개 · ${st === "mean" ? `X̄의 이론 분포 N(50, ${fmt(16 / n, 3)})` : `(n−1)S²/σ²의 이론 분포 χ²(${n - 1})`}\n${ev}: 모의실험 ${fmt(hit / R, 4)}, 이론 ${fmt(theo, 4)}`);
  }
  S.redraw();
})();
