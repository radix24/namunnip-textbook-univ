/* 수학4 탐구: 수열의 오차 |a_n − L| 를 로그 눈금으로 — 1/n, 기하급수, 이차 수렴 비교 */
(() => {
  "use strict";
  const S = MKit.setup("card-m4-converge", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const SEQ = {
    e: { name: "(1 + 1/n)ⁿ → e", L: Math.E, a: (n) => Math.pow(1 + 1 / n, n), kind: "1/n" },
    basel: { name: "Σ1/k² → π²/6", L: Math.PI * Math.PI / 6, a: (n) => { let s = 0; for (let k = 1; k <= n; k++) s += 1 / (k * k); return s; }, kind: "1/n" },
    leib: { name: "라이프니츠 4Σ(−1)ᵏ/(2k+1) → π", L: Math.PI, a: (n) => { let s = 0; for (let k = 0; k < n; k++) s += (k % 2 ? -1 : 1) / (2 * k + 1); return 4 * s; }, kind: "1/n" },
    cos: { name: "xₙ₊₁ = cos xₙ → 0.739…", L: 0.7390851332151607, a: (n) => { let x = 1; for (let i = 0; i < n; i++) x = Math.cos(x); return x; }, kind: "기하급수" },
    newton: { name: "xₙ₊₁ = xₙ/2 + 1/xₙ → √2", L: Math.SQRT2, a: (n) => { let x = 1; for (let i = 0; i < n; i++) x = x / 2 + 1 / x; return x; }, kind: "이차" },
  };
  function draw() {
    const c = QSim.col(), s = SEQ[k.val("s")], N = k.val("n"), scale = k.val("x");
    const pts = []; for (let n = 1; n <= N; n++) { const e = Math.abs(s.a(n) - s.L); pts.push([n, e]); }
    const lx = scale === "loglog";
    const F = QSim.frame(v, { x0: lx ? 0 : 0, x1: lx ? Math.log10(N) : N, y0: -17, y1: 1, pad: 30, xl: lx ? "log₁₀ n" : "n", yl: "log₁₀ 오차" });
    F.axes();
    F.path([[F.x0 ?? 0, -15.65], [lx ? Math.log10(N) : N, -15.65]], c.ink3, 1, [3, 4]);
    pts.forEach(([n, e]) => F.dot(lx ? Math.log10(n) : n, e > 0 ? Math.max(-17, Math.log10(e)) : -17, c.main, 2.5));
    const last = pts[pts.length - 1][1];
    k.out(`${s.name} · 수렴 유형: ${s.kind} · n = ${N}에서 오차 ${last > 0 ? last.toExponential(2) : "0 (배정밀도 한계 아래)"}\n${lx ? "loglog 눈금: 1/n 수렴은 기울기 −1의 직선" : "semilog 눈금: 기하급수 수렴은 직선, 이차 수렴은 급강하"} · 점선 ≈ 배정밀도 한계`);
  }
  S.redraw();
})();
