/* 수학5 탐구: 이항 꼬리 P(X ≥ na) — 정확한 값, 체비쇼프, 호프딩, 체르노프를 로그 눈금으로 비교 */
(() => {
  "use strict";
  const S = MKit.setup("card-m5-chernoff", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const sci = (x) => (x >= 0.01 ? (+x.toFixed(4)).toString() : x.toExponential(2).replace("e-", "×10^-"));
  function draw() {
    const c = QSim.col(), n = k.val("n"), p = k.val("p");
    const as = k.$('[name="a"]'); if (+as.min !== +(p + 0.01).toFixed(2)) { as.min = (p + 0.01).toFixed(2); if (+as.value < +as.min) MKit.setVal(k, "a", +as.min); }
    const a = Math.max(k.val("a"), p + 0.01);
    const lf = [0]; for (let i = 1; i <= n; i++) lf.push(lf[i - 1] + Math.log(i));
    const lpmf = (j) => lf[n] - lf[j] - lf[n - j] + j * Math.log(p) + (n - j) * Math.log(1 - p);
    const ltail = (aa) => { const k0 = Math.ceil(n * aa - 1e-9); if (k0 > n) return -Infinity; let m = -Infinity; const ls = []; for (let j = k0; j <= n; j++) { const l = lpmf(j); ls.push(l); if (l > m) m = l; } return m + Math.log(ls.reduce((s, l) => s + Math.exp(l - m), 0)); };
    const D = (aa) => (aa >= 1 ? Math.log(1 / p) : aa * Math.log(aa / p) + (1 - aa) * Math.log((1 - aa) / (1 - p)));
    const L10 = Math.LN10, lo = -14;
    const curves = {
      exact: (aa) => ltail(aa) / L10,
      cher: (aa) => (-n * D(aa)) / L10,
      hoef: (aa) => (-2 * n * (aa - p) ** 2) / L10,
      cheb: (aa) => Math.min(0, Math.log((p * (1 - p)) / (n * (aa - p) ** 2)) / L10),
    };
    const F = QSim.frame(v, { x0: p, x1: 1, y0: lo, y1: 0.3, pad: 30, xl: "a (비율 기준)", yl: "log₁₀ 확률" });
    F.axes();
    const cl = (y) => Math.max(lo, Math.min(0.3, y));
    [["cheb", c.ink3], ["hoef", c.acc], ["cher", c.main], ["exact", c.warn]].forEach(([key, col]) => {
      const pts = []; for (let i = 1; i <= 240; i++) { const x = p + ((1 - p) * i) / 240; const y = curves[key](x); if (isFinite(y)) pts.push([x, cl(y)]); }
      F.path(pts, col, key === "exact" ? 2.6 : 1.8, key === "cheb" ? [5, 4] : undefined);
    });
    F.path([[a, lo], [a, 0.3]], c.ink3, 1);
    const ex = Math.exp(ltail(a)), ch = Math.exp(-n * D(a)), ho = Math.exp(-2 * n * (a - p) ** 2), cb = Math.min(1, (p * (1 - p)) / (n * (a - p) ** 2));
    k.out(`B(${n}, ${p}) · P(X ≥ ${Math.ceil(n * a - 1e-9)}) (a = ${a.toFixed(2)})\n정확한 값 ${sci(ex)} (빨강) · 체르노프 ${sci(ch)} (파랑) · 호프딩 ${sci(ho)} (노랑) · 체비쇼프 ${sci(cb)} (점선)`);
  }
  S.redraw();
})();
