/* 수학9 탐구: 예제 자료의 회귀직선, 평균 반응 신뢰띠와 예측띠 */
(() => {
  "use strict";
  const S = MKit.setup("card-m9-predband", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const X = [1, 2, 3, 4, 5, 6, 7, 8], Y = [2.8, 3.1, 4.9, 4.0, 6.2, 5.5, 7.9, 6.6], n = 8;
  const mx = 4.5, my = Y.reduce((a, b) => a + b, 0) / n, Sxx = 42, Sxy = X.reduce((a, x, i) => a + (x - mx) * (Y[i] - my), 0);
  const b1 = Sxy / Sxx, b0 = my - b1 * mx, SSE = X.reduce((a, x, i) => a + (Y[i] - b0 - b1 * x) ** 2, 0), s = Math.sqrt(SSE / (n - 2));
  function draw() {
    const c = QSim.col(), x0 = k.val("x"), lvl = k.val("c") / 100, g = v.g;
    const t = M9.quant((q) => M9.tCdf(q, n - 2), 1 - (1 - lvl) / 2, 0, 1000);
    const hm = (x) => t * s * Math.sqrt(1 / n + (x - mx) ** 2 / Sxx), hp = (x) => t * s * Math.sqrt(1 + 1 / n + (x - mx) ** 2 / Sxx), yh = (x) => b0 + b1 * x;
    const F = QSim.frame(v, { x0: -2, x1: 12, y0: -2, y1: 14, pad: 26, xl: "x", yl: "y" });
    F.axes();
    const band = (h, col, al) => { g.fillStyle = col; g.globalAlpha = al; g.beginPath(); for (let i = 0; i <= 100; i++) { const x = -2 + (14 * i) / 100; const p = [F.X(x), F.Y(yh(x) + h(x))]; i ? g.lineTo(...p) : g.moveTo(...p); } for (let i = 100; i >= 0; i--) { const x = -2 + (14 * i) / 100; g.lineTo(F.X(x), F.Y(yh(x) - h(x))); } g.fill(); g.globalAlpha = 1; };
    band(hp, c.acc, 0.22); band(hm, c.main, 0.3);
    F.fn(yh, c.main, 2);
    X.forEach((x, i) => F.dot(x, Y[i], c.ink, 4));
    F.path([[x0, -2], [x0, 14]], c.warn, 1.2, [4, 3]);
    F.path([[1, -2], [1, 14]], c.ink3, 0.8, [2, 4]); F.path([[8, -2], [8, 14]], c.ink3, 0.8, [2, 4]);
    const y0 = yh(x0);
    k.out(`ŷ = ${fmt(b0, 3)} + ${fmt(b1, 3)}x, σ̂ = ${fmt(s, 4)} · x₀ = ${fmt(x0, 1)}에서 ŷ₀ = ${fmt(y0, 3)}, t = ${fmt(t, 3)}${x0 < 1 || x0 > 8 ? " (자료 범위 밖: 외삽)" : ""}\n평균 반응 ${fmt(lvl * 100, 0)}% 신뢰구간 [${fmt(y0 - hm(x0), 2)}, ${fmt(y0 + hm(x0), 2)}] · 예측구간 [${fmt(y0 - hp(x0), 2)}, ${fmt(y0 + hp(x0), 2)}]`);
  }
  S.redraw();
})();
