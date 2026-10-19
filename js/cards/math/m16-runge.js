/* 수학16 탐구: 룽게 현상 — 등간격 점과 체비쇼프 점의 보간 비교 */
(() => {
  "use strict";
  const S = MKit.setup("card-m16-runge", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const FN = {
    runge: { name: "1/(1 + 25x²)", f: (x) => 1 / (1 + 25 * x * x) },
    abs: { name: "|x|", f: Math.abs },
    exp: { name: "eˣ", f: Math.exp },
  };
  // 무게중심 라그랑주 보간 (안정적인 계산)
  function interp(xs, ys) {
    const n = xs.length, w = xs.map((xi, i) => { let p = 1; for (let j = 0; j < n; j++) if (j !== i) p *= xi - xs[j]; return 1 / p; });
    return (x) => { let num = 0, den = 0; for (let i = 0; i < n; i++) { const d = x - xs[i]; if (d === 0) return ys[i]; const t = w[i] / d; num += t * ys[i]; den += t; } return num / den; };
  }
  function draw() {
    const c = QSim.col(), F = FN[k.val("f")], n = k.val("n"), pts = k.val("p");
    const xs = [];
    for (let i = 0; i <= n; i++) xs.push(pts === "eq" ? -1 + (2 * i) / n : Math.cos(((2 * i + 1) * Math.PI) / (2 * (n + 1))));
    const ys = xs.map(F.f), p = interp(xs, ys);
    let mx = 0, at = 0;
    for (let i = 0; i <= 4000; i++) { const x = -1 + i / 2000, e = Math.abs(p(x) - F.f(x)); if (e > mx) { mx = e; at = x; } }
    const lo = F === FN.exp ? 0 : -0.6, hi = F === FN.exp ? 3 : 1.6;
    const G = QSim.frame(v, { x0: -1, x1: 1, y0: lo, y1: hi, pad: 26, xl: "x", yl: "" });
    G.axes();
    G.fn(F.f, c.ink3, 1.4, [5, 4], 800);
    G.fn((x) => Math.max(lo - 1, Math.min(hi + 1, p(x))), pts === "eq" ? c.warn : c.main, 2, null, 1600);
    xs.forEach((x, i) => G.dot(x, ys[i], c.ink, 3));
    k.out(`f(x) = ${F.name}, ${pts === "eq" ? "등간격" : "체비쇼프"} 점 ${n + 1}개(${n}차 보간)\n최대 오차 ${mx < 1e-3 || mx >= 1e4 ? mx.toExponential(2) : fmt(mx, 4)} (x ≈ ${fmt(at, 3)}에서)`);
  }
  S.redraw();
})();
