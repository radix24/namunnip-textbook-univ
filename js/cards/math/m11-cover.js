/* 수학11 탐구: 연속함수의 그래프를 n개의 직사각형으로 덮기 — 넓이 합 → 0, 영역은 그렇지 않음 */
(() => {
  "use strict";
  const S = MKit.setup("card-m11-cover", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const FN = {
    sin: { name: "그래프 y = 0.8 sin 6x", g: (x) => 0.8 * Math.sin(6 * x), region: false },
    osc: { name: "그래프 y = x sin(1/x) (x = 0에서 0)", g: (x) => (x === 0 ? 0 : x * Math.sin(1 / x)), region: false },
    reg: { name: "영역 0 ≤ y ≤ 0.5 + 0.3 sin 6x", g: (x) => 0.5 + 0.3 * Math.sin(6 * x), region: true },
  };
  function draw() {
    const c = QSim.col(), F = FN[k.val("f")], n = k.val("n");
    const P = QSim.frame(v, { x0: -0.02, x1: 1.02, y0: -1, y1: 1, pad: 24, xl: "x", yl: "y" });
    P.axes();
    let area = 0;
    const g = v.g;
    g.save(); g.fillStyle = c.main; g.strokeStyle = c.main; g.lineWidth = 1;
    for (let i = 0; i < n; i++) {
      const a = i / n, b = (i + 1) / n;
      let lo = Infinity, hi = -Infinity;
      for (let j = 0; j <= 60; j++) { const y = F.g(a + ((b - a) * j) / 60); lo = Math.min(lo, y); hi = Math.max(hi, y); }
      if (F.region) lo = Math.min(lo, 0);
      area += (b - a) * (hi - lo);
      const X0 = P.X(a), X1 = P.X(b), Y0 = P.Y(lo), Y1 = P.Y(hi);
      g.globalAlpha = 0.18; g.fillRect(X0, Y1, X1 - X0, Math.max(1, Y0 - Y1));
      g.globalAlpha = n <= 100 ? 0.6 : 0.25; g.strokeRect(X0, Y1, X1 - X0, Math.max(1, Y0 - Y1));
    }
    g.restore();
    P.fn(F.g, c.warn, 1.6, null, 800);
    if (F.region) P.path([[0, 0], [1, 0]], c.warn, 1.6);
    const exact = F.region ? 0.5 + (0.3 * (1 - Math.cos(6))) / 6 : null;
    k.out(`${F.name} · 직사각형 ${n}개의 넓이 합 ${area < 0.01 ? area.toPrecision(3) : fmt(area, 4)}` + (F.region ? ` · 영역의 넓이(적분) ${fmt(exact, 4)}` : ` · n × 넓이 합 = ${fmt(n * area, 3)}`));
  }
  S.redraw();
})();
