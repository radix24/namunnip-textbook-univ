/* 수학5 탐구: 독립 확률변수 n개의 합 — 정확한 분포와 같은 평균·분산의 정규분포 */
(() => {
  "use strict";
  const S = MKit.setup("card-m5-conv", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const erf = (x) => { const s = Math.sign(x), a = Math.abs(x), t = 1 / (1 + 0.3275911 * a); return s * (1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a)); };
  const Phi = (z) => 0.5 * (1 + erf(z / Math.SQRT2));
  const fact = (m) => { let r = 1; for (let i = 2; i <= m; i++) r *= i; return r; };
  const binom = (n, j) => fact(n) / (fact(j) * fact(n - j));
  const B = {
    unif: { name: "U(0, 1)", mu: 0.5, v: 1 / 12, hi: (n) => n,
      f: (n, s) => { if (s <= 0 || s >= n) return 0; let t = 0; for (let j = 0; j <= Math.floor(s); j++) t += (j % 2 ? -1 : 1) * binom(n, j) * Math.pow(s - j, n - 1); return t / fact(n - 1); },
      F: (n, s) => { if (s <= 0) return 0; if (s >= n) return 1; let t = 0; for (let j = 0; j <= Math.floor(s); j++) t += (j % 2 ? -1 : 1) * binom(n, j) * Math.pow(s - j, n); return t / fact(n); } },
    exp: { name: "Exp(1)", mu: 1, v: 1, hi: (n) => n + 5 * Math.sqrt(n) + 2,
      f: (n, s) => (s <= 0 ? 0 : Math.exp((n - 1) * Math.log(s) - s) / fact(n - 1)),
      F: (n, s) => { if (s <= 0) return 0; let t = 0, term = 1; for (let j = 0; j < n; j++) { t += term; term *= s / (j + 1); } return 1 - Math.exp(-s) * t; } },
    die: { name: "주사위", mu: 3.5, v: 35 / 12, hi: (n) => 6 * n, disc: true },
  };
  function diePmf(n) { let p = [1]; for (let i = 0; i < n; i++) { const q = new Array(p.length + 6).fill(0); p.forEach((x, j) => { for (let f = 1; f <= 6; f++) q[j + f] += x / 6; }); p = q; } return p; }
  function draw() {
    const c = QSim.col(), b = B[k.val("b")], n = k.val("n"), mu = n * b.mu, va = n * b.v, sd = Math.sqrt(va), hi = b.hi(n);
    const ss = k.$('[name="s"]'); if (+ss.max !== Math.ceil(hi)) { ss.max = Math.ceil(hi); MKit.setVal(k, "s", Math.min(+ss.value, Math.ceil(hi))); }
    const s = k.val("s"), nd = (x) => Math.exp(-((x - mu) ** 2) / (2 * va)) / (sd * Math.sqrt(2 * Math.PI));
    const pm = b.disc ? diePmf(n) : null;
    const ymax = (b.disc ? Math.max(...pm) : Math.max(nd(mu), ...Array.from({ length: 200 }, (_, i) => b.f(n, (hi * (i + 0.5)) / 200)))) * 1.15;
    const F = QSim.frame(v, { x0: 0, x1: hi, y0: 0, y1: ymax, pad: 30, xl: "합 s", yl: b.disc ? "확률" : "밀도" });
    F.axes();
    const g = v.g;
    if (b.disc) {
      const w = Math.max(1.5, (F.X(1) - F.X(0)) * 0.7);
      pm.forEach((p, j) => { g.fillStyle = j <= s ? c.main : c.soft; g.fillRect(F.X(j) - w / 2, F.Y(p), w, F.Y(0) - F.Y(p)); });
    } else {
      const pts = [[0, 0]]; for (let i = 0; i <= 400; i++) { const x = (hi * i) / 400; pts.push([x, b.f(n, x)]); }
      const shade = pts.filter(([x]) => x <= s); shade.push([s, 0]);
      g.fillStyle = c.soft; g.beginPath(); shade.forEach(([x, y], i) => (i ? g.lineTo(F.X(x), F.Y(y)) : g.moveTo(F.X(x), F.Y(y)))); g.fill();
      F.path(pts, c.main, 2.2);
    }
    F.fn(nd, c.warn, 1.8, [6, 4]);
    F.path([[s, 0], [s, ymax]], c.ink3, 1);
    const exact = b.disc ? pm.slice(0, Math.floor(s) + 1).reduce((a, x) => a + x, 0) : b.F(n, s);
    const approx = Phi(((b.disc ? Math.floor(s) + 0.5 : s) - mu) / sd);
    k.out(`${b.name} ${n}개의 합 · 평균 ${fmt(mu, 3)}, 분산 ${fmt(va, 3)}\nP(S ≤ ${fmt(s, 2)}) 정확한 값 ${fmt(exact, 4)}, 정규 근사 ${fmt(approx, 4)}${b.disc ? " (연속성 보정)" : ""} · 빨간 점선: 같은 평균·분산의 정규`);
  }
  S.redraw();
})();
