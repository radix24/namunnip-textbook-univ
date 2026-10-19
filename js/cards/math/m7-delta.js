/* 수학7 탐구: 점마다 통하는 가장 큰 δ(x)를 그려, 그 하한이 0보다 큰지(균등연속) 본다 */
(() => {
  "use strict";
  const S = MKit.setup("card-m7-delta", 0.6, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const FN = {
    sq: { f: (x) => x * x, a: 0, b: 3, tex: "x², [0, 3]" },
    sqR: { f: (x) => x * x, a: 0, b: 12, tex: "x², [0, 12]" },
    inv: { f: (x) => 1 / x, a: 0.05, b: 1, tex: "1/x, [0.05, 1] (0으로 갈수록)" },
    sqrt: { f: (x) => Math.sqrt(x), a: 0, b: 2, tex: "√x, [0, 2]" },
  };
  function draw() {
    const c = QSim.col(), F = FN[k.val("fn")], eps = k.val("e") / 10, a = F.a, b = F.b;
    const ok = (x, d) => { for (let i = 1; i <= 120; i++) { const t = (i / 120) * d; for (const y of [x + t, x - t]) if (y >= a && y <= b && Math.abs(F.f(y) - F.f(x)) >= eps) return false; } return true; };
    const M = 160, pts = []; let inf = Infinity, at = a;
    for (let i = 0; i <= M; i++) {
      const x = a + ((b - a) * i) / M;
      let lo = 0, hi = b - a; if (ok(x, hi)) { pts.push([x, hi]); if (hi < inf) { inf = hi; at = x; } continue; }
      for (let j = 0; j < 30; j++) { const m = (lo + hi) / 2; if (ok(x, m)) lo = m; else hi = m; }
      pts.push([x, lo]); if (lo < inf) { inf = lo; at = x; }
    }
    const ymax = Math.max(...pts.map((p) => p[1])) * 1.1 || 1;
    const f = QSim.frame(v, { x0: a, x1: b, y0: 0, y1: ymax, pad: 34, xl: "x", yl: "δ(x)" });
    f.axes();
    f.path(pts, c.main, 2);
    f.path([[a, inf], [b, inf]], c.warn, 1.5, [5, 4]);
    f.dot(at, inf, c.warn, 5);
    k.out(`f = ${F.tex}, ε = ${eps}\n점마다 통하는 가장 큰 δ(x)의 최솟값 ≈ ${fmt(inf, 5)} (x ≈ ${fmt(at, 3)}) · 이 δ 하나가 구간의 모든 점에 통합니다`);
  }
  S.redraw();
})();
