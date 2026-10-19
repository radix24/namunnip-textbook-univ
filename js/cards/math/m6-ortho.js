/* 수학6 탐구: 르장드르 다항식과 베셀 함수의 직교성 — 곱의 넓이(가중)가 0이 되는가 */
(() => {
  "use strict";
  const P = (n, t) => { let a = 1, b = t; if (n === 0) return 1; for (let k = 1; k < n; k++) { const c = ((2 * k + 1) * t * b - k * a) / (k + 1); a = b; b = c; } return b; };
  const J0 = (t) => { let s = 0, term = 1; for (let k = 0; k < 60; k++) { s += term; term *= -((t / 2) ** 2) / ((k + 1) * (k + 1)); } return s; };
  const zeros = []; { let a = 0.5; while (zeros.length < 6) { const b = a + 0.1; if (J0(a) * J0(b) < 0) { let lo = a, hi = b; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; J0(lo) * J0(m) <= 0 ? (hi = m) : (lo = m); } zeros.push((lo + hi) / 2); } a = b; } }
  const S = MKit.setup("card-m6-ortho", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  function draw() {
    const c = QSim.col(), mode = k.val("mode"), m = k.val("m"), n = k.val("n");
    let f1, f2, w, a0, a1, lab;
    if (mode === "leg") { f1 = (t) => P(m, t); f2 = (t) => P(n, t); w = () => 1; a0 = -1; a1 = 1; lab = [`P_${m}`, `P_${n}`]; }
    else { const jm = zeros[m - 1], jn = zeros[n - 1]; f1 = (r) => J0(jm * r); f2 = (r) => J0(jn * r); w = (r) => r; a0 = 0; a1 = 1; lab = [`J₀(${fmt(jm, 3)}r)`, `J₀(${fmt(jn, 3)}r)`]; }
    const f = QSim.frame(v, { x0: a0, x1: a1, y0: -1.2, y1: 1.2, pad: 26, xl: mode === "leg" ? "t" : "r" });
    f.axes();
    // 가중 곱의 넓이 칠하기
    const g = v.g, N = 400; let I = 0, I2 = 0;
    g.save();
    for (let i = 0; i < N; i++) {
      const x = a0 + ((a1 - a0) * (i + 0.5)) / N, y = w(x) * f1(x) * f2(x), dx = (a1 - a0) / N;
      I += y * dx; I2 += w(x) * f1(x) ** 2 * dx;
      g.fillStyle = y >= 0 ? c.main : c.warn; g.globalAlpha = 0.25; g.fillRect(f.X(x - dx / 2), Math.min(f.Y(0), f.Y(y)), f.sx * dx + 0.5, Math.abs(f.Y(y) - f.Y(0)));
    }
    g.restore();
    // 심프슨 공식으로 정확히 다시 적분
    const simp = (h) => { const M = 2000, d = (a1 - a0) / M; let s = h(a0) + h(a1); for (let i = 1; i < M; i++) s += (i % 2 ? 4 : 2) * h(a0 + i * d); return (s * d) / 3; };
    I = simp((x) => w(x) * f1(x) * f2(x)); I2 = simp((x) => w(x) * f1(x) ** 2);
    f.fn(f1, c.main, 2); f.fn(f2, c.acc, 2);
    k.out(`${lab[0]}(파랑), ${lab[1]}(노랑) · 칠한 넓이 = ${mode === "leg" ? "∫ P_m P_n dt" : "∫ r·J₀J₀ dr"} = ${Math.abs(I) < 1e-6 ? "0" : fmt(I, 5)}`
      + (m === n ? ` · m = n이면 ${mode === "leg" ? `2/(2n+1) = ${fmt(2 / (2 * n + 1), 5)}` : `${fmt(I2, 5)} (양수)`}` : " · m ≠ n이면 0 (직교)")
      + (mode === "bes" ? `\nJ₀의 영점: ${zeros.slice(0, 4).map((z) => fmt(z, 3)).join(", ")}, …` : ""));
  }
  S.redraw();
})();
