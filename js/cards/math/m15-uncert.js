/* 수학15 탐구: f와 f̂의 퍼짐 — 폭을 바꿔도 16π²AB ≥ 1, 가우스에서 등호 */
(() => {
  "use strict";
  const S = MKit.setup("card-m15-uncert", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const PI = Math.PI;
  const sinc = (u) => (Math.abs(u) < 1e-9 ? 1 : Math.sin(PI * u) / (PI * u));
  // f, f', f̂ (모두 실수 짝함수라 f̂도 실수)
  const SHAPE = {
    g: { name: "가우스 e^(−πx²/s²)", f: (x, s) => Math.exp((-PI * x * x) / (s * s)), df: (x, s) => ((-2 * PI * x) / (s * s)) * Math.exp((-PI * x * x) / (s * s)), F: (u, s) => s * Math.exp(-PI * s * s * u * u) },
    t: { name: "삼각형 max(0, 1 − |x|/s)", f: (x, s) => Math.max(0, 1 - Math.abs(x) / s), df: (x, s) => (Math.abs(x) >= s ? 0 : -Math.sign(x) / s), F: (u, s) => s * sinc(s * u) ** 2 },
    h: { name: "두 봉우리 e^(−π(x−s)²) + e^(−π(x+s)²)", f: (x, s) => Math.exp(-PI * (x - s) ** 2) + Math.exp(-PI * (x + s) ** 2), df: (x, s) => -2 * PI * (x - s) * Math.exp(-PI * (x - s) ** 2) - 2 * PI * (x + s) * Math.exp(-PI * (x + s) ** 2), F: (u, s) => 2 * Math.cos(2 * PI * s * u) * Math.exp(-PI * u * u) },
  };
  function draw() {
    const c = QSim.col(), sh = SHAPE[k.val("f")], s = k.val("s");
    const top = Math.max(1, sh.F(0, s), sh.f(0, s), sh === SHAPE.h ? 1.05 : 0);
    const F = QSim.frame(v, { x0: -4, x1: 4, y0: -0.35 * top, y1: 1.1 * top, pad: 26, xl: "x 또는 ξ", yl: "" });
    F.axes();
    F.fn((x) => sh.f(x, s), c.main, 2, null, 1200);
    F.fn((u) => sh.F(u, s), c.warn, 2, [6, 4], 1200);
    // A = ∫x²f²/∫f², B = ∫|f'|²/(4π²∫f²) (플랑셰렐로 ∫ξ²f̂² = ∫|f'|²/4π²)
    const L = 14 + 2 * s, M = 40000, h = (2 * L) / M;
    let A = 0, N = 0, D = 0;
    for (let i = 0; i <= M; i++) { const x = -L + i * h, y = sh.f(x, s), d = sh.df(x, s); A += x * x * y * y; N += y * y; D += d * d; }
    A /= N; const B = D / (4 * PI * PI * N);
    k.out(`${sh.name}, s = ${fmt(s, 2)}\nf의 퍼짐 A = ${fmt(A, 4)} · f̂의 퍼짐 B = ${fmt(B, 4)} · 16π²AB = ${fmt(16 * PI * PI * A * B, 4)} (≥ 1, 가우스면 등호)`);
  }
  S.redraw();
})();
