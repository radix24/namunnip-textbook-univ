/* 수학9 탐구: 단측 z 검정의 α, β, 검정력 — H₀: μ = 100, σ = 10 */
(() => {
  "use strict";
  const S = MKit.setup("card-m9-power", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  function draw() {
    const c = QSim.col(), n = k.val("n"), mu1 = k.val("m"), alpha = k.val("a") / 100, g = v.g;
    const se = 10 / Math.sqrt(n), z = M9.quant(M9.normCdf, 1 - alpha, -10, 10), crit = 100 + z * se;
    const f0 = (x) => M9.normPdf((x - 100) / se) / se, f1 = (x) => M9.normPdf((x - mu1) / se) / se;
    const lo = 100 - 4 * se, hi = Math.max(mu1, 100) + 4 * se, ym = (1 / (se * Math.sqrt(2 * Math.PI))) * 1.15;
    const F = QSim.frame(v, { x0: lo, x1: hi, y0: 0, y1: ym, pad: 28, xl: "x̄", yl: "밀도" });
    F.axes();
    const shade = (f, a, b, col) => { g.fillStyle = col; g.globalAlpha = 0.3; g.beginPath(); g.moveTo(F.X(a), F.Y(0)); for (let i = 0; i <= 80; i++) { const x = a + ((b - a) * i) / 80; g.lineTo(F.X(x), F.Y(f(x))); } g.lineTo(F.X(b), F.Y(0)); g.fill(); g.globalAlpha = 1; };
    shade(f0, crit, hi, c.warn); shade(f1, lo, crit, c.acc);
    F.fn(f0, c.ink3, 2); F.fn(f1, c.main, 2.4);
    F.path([[crit, 0], [crit, ym]], c.ink, 1.2, [4, 3]);
    const power = 1 - M9.normCdf((crit - mu1) / se);
    k.out(`n = ${n}, σ/√n = ${fmt(se, 3)} · 기각역 x̄ > ${fmt(crit, 3)} (점선) · α = ${fmt(alpha, 3)} (빨강)\nμ = ${fmt(mu1, 1)}일 때 β = ${fmt(1 - power, 4)} (노랑), 검정력 1 − β = ${fmt(power, 4)}`);
  }
  S.redraw();
})();
