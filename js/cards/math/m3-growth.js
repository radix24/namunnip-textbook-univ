/* 수학3 탐구: 두 함수의 증가율 비교 — log₁₀ 눈금으로 그려 교차점과 비를 본다 */
(() => {
  "use strict";
  const LN10 = Math.log(10);
  const lgamma = (x) => { // 스털링 급수 (x ≥ 1)
    if (x < 7) { let p = 1; while (x < 7) { p *= x; x += 1; } return lgamma(x) - Math.log(p); }
    return (x - 0.5) * Math.log(x) - x + 0.5 * Math.log(2 * Math.PI) + 1 / (12 * x) - 1 / (360 * x ** 3);
  };
  const F = {
    log: { l: (n) => Math.log10(Math.log2(n)), tex: "log₂ n" },
    sqrt: { l: (n) => 0.5 * Math.log10(n), tex: "√n" },
    n: { l: (n) => Math.log10(n), tex: "n" },
    nlog: { l: (n) => Math.log10(n * Math.log2(n)), tex: "n log₂ n" },
    n2: { l: (n) => 2 * Math.log10(n), tex: "n²" },
    n3: { l: (n) => 3 * Math.log10(n), tex: "n³" },
    n10: { l: (n) => 10 * Math.log10(n), tex: "n¹⁰" },
    n100: { l: (n) => 100 * Math.log10(n), tex: "n¹⁰⁰" },
    e101: { l: (n) => n * Math.log10(1.01), tex: "1.01ⁿ" },
    e2: { l: (n) => n * Math.log10(2), tex: "2ⁿ" },
    fact: { l: (n) => lgamma(n + 1) / LN10, tex: "n!" },
  };
  const S = MKit.setup("card-m3-growth", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  function draw() {
    const c = QSim.col(), A = F[k.val("f")], B = F[k.val("g")], E = k.val("E"), N = Math.pow(10, E);
    const xs = []; for (let i = 0; i <= 400; i++) xs.push(2 + (N - 2) * (i / 400) ** 2);
    const ya = xs.map(A.l), yb = xs.map(B.l), top = Math.max(...ya, ...yb, 1) * 1.08, bot = Math.min(0, ...ya, ...yb);
    const f = QSim.frame(v, { x0: 0, x1: N, y0: bot, y1: top, pad: 34, xl: "n", yl: "log₁₀" });
    f.axes();
    f.path(xs.map((x, i) => [x, ya[i]]), c.main, 2); f.path(xs.map((x, i) => [x, yb[i]]), c.acc, 2);
    // 교차점 (마지막 부호 변화)
    let cross = null; for (let i = 1; i < xs.length; i++) if ((ya[i - 1] - yb[i - 1]) * (ya[i] - yb[i]) < 0) { let lo = xs[i - 1], hi = xs[i]; const d0 = A.l(lo) - B.l(lo); for (let j = 0; j < 60; j++) { const m = (lo + hi) / 2; ((A.l(m) - B.l(m)) * d0 > 0) ? (lo = m) : (hi = m); } cross = lo; }
    if (cross) f.path([[cross, bot], [cross, top]], c.warn, 1, [4, 4]);
    const d = A.l(N) - B.l(N);
    k.out(`파랑 ${A.tex}, 노랑 ${B.tex} (세로축은 log₁₀ 값) · n = ${fmt(N, 0)}에서 ${A.tex} / ${B.tex} = 10^${fmt(d, 2)}`
      + (cross ? `\n그림 범위 안의 교차점 n ≈ ${fmt(cross, 0)} (빨간 점선) — 그 뒤로는 ${d > 0 ? A.tex : B.tex}가 앞선다` : `\n그림 범위 안에서는 ${d > 0 ? A.tex : B.tex}가 계속 앞선다. 범위를 넓혀 보세요`));
  }
  S.redraw();
})();
