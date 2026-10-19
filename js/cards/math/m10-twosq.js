/* 수학10 탐구: 원 x² + y² = n 위의 격자점 — r₂(n) = 4(d₁ − d₃), 소수 p ≡ 1 (mod 4) 의 분해 */
(() => {
  "use strict";
  const S = MKit.setup("card-m10-twosq", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  function draw() {
    const c = QSim.col(), n = k.val("n"), r = Math.sqrt(n), lim = Math.ceil(r) + 1;
    const F = QSim.frame(v, { x0: -lim, x1: lim, y0: -lim, y1: lim, pad: 20 });
    F.axes({ noGrid: true });
    for (let x = -lim; x <= lim; x++) for (let y = -lim; y <= lim; y++) if (lim <= 16) F.dot(x, y, c.rule, 1.2);
    const circ = []; for (let i = 0; i <= 200; i++) circ.push([r * Math.cos((2 * Math.PI * i) / 200), r * Math.sin((2 * Math.PI * i) / 200)]);
    F.path(circ, c.main, 1.4);
    const pts = []; for (let x = -lim; x <= lim; x++) { const y2 = n - x * x; if (y2 < 0) continue; const y = Math.round(Math.sqrt(y2)); if (y * y === y2) { pts.push([x, y]); if (y) pts.push([x, -y]); } }
    pts.forEach(([x, y]) => F.dot(x, y, c.warn, 5));
    let d1 = 0, d3 = 0; for (let d = 1; d <= n; d++) if (n % d === 0) { if (d % 4 === 1) d1++; else if (d % 4 === 3) d3++; }
    const fac = []; let m = n; for (let p = 2; p * p <= m; p++) if (m % p === 0) { let e = 0; while (m % p === 0) { m /= p; e++; } fac.push([p, e]); } if (m > 1) fac.push([m, 1]);
    const bad = fac.filter(([p, e]) => p % 4 === 3 && e % 2 === 1);
    const rep = pts.filter(([x, y]) => x >= 0 && y >= x).map(([x, y]) => `${x}² + ${y}²`);
    k.out(`n = ${n} = ${fac.map(([p, e]) => (e > 1 ? `${p}^${e}` : p)).join("·")} · 격자점 ${pts.length}개, 4(d₁ − d₃) = 4(${d1} − ${d3}) = ${4 * (d1 - d3)}\n${pts.length ? `두 제곱수의 합: ${rep.join(", ")}` : `두 제곱수의 합이 아님: 4k+3 꼴 소수 ${bad.map(([p]) => p).join(", ")}의 지수가 홀수`}`);
  }
  S.redraw();
})();
