/* 수학9 탐구: U(0, θ = 10)의 세 추정량 2X̄, max, (n+1)/n·max — 모의 분포와 편향·분산·MSE */
(() => {
  "use strict";
  const S = MKit.setup("card-m9-uniformest", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const TH = 10, R = 4000;
  function draw() {
    const c = QSim.col(), n = k.val("n"), g = v.g;
    const { u } = M9.rng(777 + n);
    const est = [[], [], []];
    for (let r = 0; r < R; r++) { let s = 0, m = 0; for (let i = 0; i < n; i++) { const x = TH * u(); s += x; if (x > m) m = x; } est[0].push((2 * s) / n); est[1].push(m); est[2].push(((n + 1) / n) * m); }
    const stat = (a) => { const mu = a.reduce((x, y) => x + y, 0) / R, va = a.reduce((x, y) => x + (y - mu) ** 2, 0) / R; return { bias: mu - TH, va, mse: va + (mu - TH) ** 2 }; };
    const st = est.map(stat), theo = [TH * TH / (3 * n), (2 * TH * TH) / ((n + 1) * (n + 2)), (TH * TH) / (n * (n + 2))];
    const lo = 0, hi = 20, B = 50, bw = (hi - lo) / B, cols = [c.ink3, c.warn, c.main];
    const hs = est.map((a) => { const h = new Array(B).fill(0); a.forEach((x) => { const j = Math.floor((x - lo) / bw); if (j >= 0 && j < B) h[j]++; }); return h.map((m) => m / (R * bw)); });
    const ym = Math.max(...hs.flat()) * 1.1;
    const F = QSim.frame(v, { x0: lo, x1: hi, y0: 0, y1: ym, pad: 28, xl: "추정값", yl: "밀도" });
    F.axes();
    hs.forEach((h, t) => F.path(h.flatMap((y, j) => [[lo + j * bw, y], [lo + (j + 1) * bw, y]]), cols[t], t === 2 ? 2.4 : 1.8));
    F.path([[TH, 0], [TH, ym]], c.ink, 1, [4, 4]);
    const names = ["2X̄", "max", "(n+1)/n·max"];
    k.out(`n = ${n}, θ = 10, 모의 ${R}번 · ${names.map((nm, t) => `${nm}: 편향 ${fmt(st[t].bias, 3)}, MSE ${fmt(st[t].mse, 3)} (이론 ${fmt(theo[t], 3)})`).join(" · ")}\n회색 2X̄, 빨강 max, 파랑 (n+1)/n·max, 점선 참값 θ`);
  }
  S.redraw();
})();
