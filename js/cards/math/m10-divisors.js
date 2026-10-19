/* 수학10 탐구: n의 약수 격자(소수 거듭제곱의 곱), τ, σ, φ와 곱셈성, Σφ(d) = n */
(() => {
  "use strict";
  const S = MKit.setup("card-m10-divisors", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const fac = (n) => { const f = []; for (let p = 2; p * p <= n; p++) if (n % p === 0) { let e = 0; while (n % p === 0) { n /= p; e++; } f.push([p, e]); } if (n > 1) f.push([n, 1]); return f; };
  const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };
  const phi = (n) => fac(n).reduce((r, [p, e]) => r * (p - 1) * Math.pow(p, e - 1), 1);
  function draw() {
    const c = QSim.col(), n = k.val("n"), g = v.g, W = v.W, H = v.H, f = fac(n);
    const divs = []; for (let d = 1; d <= n; d++) if (n % d === 0) divs.push(d);
    const tau = divs.length, sigma = divs.reduce((a, b) => a + b, 0), ph = phi(n);
    // 격자: 첫 두 소수를 가로·세로, 셋째 이상은 층으로
    const [p1, e1] = f[0] || [1, 0], [p2, e2] = f[1] || [1, 0], rest = f.slice(2);
    const layers = rest.reduce((a, [, e]) => a * (e + 1), 1);
    const cw = Math.min(46, (W - 40) / ((e1 + 1) * layers + layers)), ch = Math.min(34, (H - 50) / (e2 + 1));
    g.save(); g.font = "11px monospace"; g.textAlign = "center"; g.textBaseline = "middle";
    let L = 0;
    const restCombos = rest.reduce((acc, [p, e]) => acc.flatMap((m) => Array.from({ length: e + 1 }, (_, j) => m * Math.pow(p, j))), [1]);
    restCombos.forEach((rm, li) => {
      const ox = 20 + li * ((e1 + 1) * cw + cw);
      for (let i = 0; i <= e1; i++) for (let j = 0; j <= e2; j++) {
        const d = Math.pow(p1, i) * Math.pow(p2, j) * rm, X = ox + i * cw + cw / 2, Y = H - 30 - j * ch - ch / 2;
        if (i < e1) { g.strokeStyle = c.rule; g.beginPath(); g.moveTo(X + 12, Y); g.lineTo(X + cw - 12, Y); g.stroke(); }
        if (j < e2) { g.strokeStyle = c.rule; g.beginPath(); g.moveTo(X, Y - 9); g.lineTo(X, Y - ch + 9); g.stroke(); }
        g.fillStyle = gcd(d, n) === d && d === n ? c.warn : c.main; g.fillText(String(d), X, Y);
      }
      L++;
    });
    g.restore();
    const sumPhi = divs.reduce((a, d) => a + phi(d), 0);
    k.out(`n = ${n} = ${f.map(([p, e]) => (e > 1 ? `${p}^${e}` : `${p}`)).join("·") || "1"} · τ = ${f.map(([, e]) => e + 1).join("·") || 1} = ${tau} · σ = ${sigma} · φ = ${ph}\nΣφ(d) (d | n) = ${sumPhi} · σ(n)/n = ${(sigma / n).toFixed(3)}${sigma === 2 * n ? " → 완전수" : ""}${p1 > 1 ? ` · 격자의 가로는 ${p1}의 지수` : ""}${p2 > 1 ? `, 세로는 ${p2}의 지수` : ""}${rest.length ? ", 나머지 소인수는 여러 판" : ""}`);
  }
  S.redraw();
})();
