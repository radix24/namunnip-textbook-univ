/* 수학9 탐구: 참 직선 y = 2 + 0.65x에서 자료를 반복 생성 — 맞춘 직선 40개와 β̂₁의 표준편차 σ/√Sxx */
(() => {
  "use strict";
  const S = MKit.setup("card-m9-regsim", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const DES = { even: [1, 2, 3, 4, 5, 6, 7, 8], ends: [1, 1, 1, 1, 8, 8, 8, 8], mid: [4, 4, 4.5, 4.5, 4.5, 4.5, 5, 5] };
  function draw() {
    const c = QSim.col(), d = k.val("d"), sig = k.val("s"), xs = DES[d], n = xs.length;
    const { n: rn } = M9.rng(2024 + Math.round(sig * 100) + d.length);
    const mx = xs.reduce((a, b) => a + b, 0) / n, Sxx = xs.reduce((a, x) => a + (x - mx) ** 2, 0);
    const F = QSim.frame(v, { x0: 0, x1: 9, y0: -2, y1: 12, pad: 26, xl: "x", yl: "y" });
    F.axes();
    const b1s = []; let firstPts = null;
    for (let r = 0; r < 2000; r++) {
      const ys = xs.map((x) => 2 + 0.65 * x + sig * rn()), my = ys.reduce((a, b) => a + b, 0) / n;
      const b1 = xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0) / Sxx, b0 = my - b1 * mx; b1s.push(b1);
      if (r < 40) F.path([[0, b0], [9, b0 + 9 * b1]], c.soft, 1);
      if (r === 0) firstPts = xs.map((x, i) => [x, ys[i]]);
    }
    F.path([[0, 2], [9, 2 + 0.65 * 9]], c.warn, 2.2);
    firstPts.forEach(([x, y]) => F.dot(x, y, c.main, 4));
    const m = b1s.reduce((a, b) => a + b, 0) / b1s.length, sd = Math.sqrt(b1s.reduce((a, b) => a + (b - m) ** 2, 0) / (b1s.length - 1));
    k.out(`설계 x = ${xs.join(", ")} · Sxx = ${fmt(Sxx, 2)}, σ = ${fmt(sig, 2)} · 회색: 맞춘 직선 40개, 빨강: 참 직선\nβ̂₁ 2000번: 평균 ${fmt(m, 4)} (참값 0.65), 표준편차 ${fmt(sd, 4)} · 이론 σ/√Sxx = ${fmt(sig / Math.sqrt(Sxx), 4)}`);
  }
  S.redraw();
})();
