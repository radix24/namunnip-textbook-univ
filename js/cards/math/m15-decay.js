/* 수학15 탐구: 푸리에 계수의 감쇠 |f̂(n)| (로그-로그) — 점프는 1/n, 꺾임은 1/n², 매끄러우면 더 빠름 */
(() => {
  "use strict";
  const S = MKit.setup("card-m15-decay", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const PI = Math.PI;
  // 계수의 크기(정확한 식)
  const FN = {
    sq: { name: "사각파 sgn θ (점프)", f: (t) => Math.sign(t), c: (n) => (n % 2 ? 2 / (PI * n) : 0), slope: -1 },
    tri: { name: "삼각파 |θ| (꺾임)", f: (t) => Math.abs(t), c: (n) => (n % 2 ? 2 / (PI * n * n) : 0), slope: -2 },
    cub: { name: "θ(π² − θ²) (2계 도함수가 점프)", f: (t) => t * (PI * PI - t * t), c: (n) => 6 / (n * n * n), slope: -3 },
    exp: { name: "e^(cos θ) (무한히 매끄러움)", f: (t) => Math.exp(Math.cos(t)), c: (n) => { let s = 0, term = 1 / 2 ** n / fact(n); for (let m = 0; m < 30; m++) { s += term; term *= 0.25 / ((m + 1) * (m + n + 1)); } return s; }, slope: null },
  };
  function fact(n) { let p = 1; for (let i = 2; i <= n; i++) p *= i; return p; }
  function draw() {
    const c = QSim.col(), F = FN[k.val("f")], Nmax = k.val("N");
    const W = v.W, H = v.H, g = v.g, half = W * 0.4;
    const L = QSim.frame({ g, W: half, H }, { x0: -PI, x1: PI, y0: F.f === FN.cub.f ? -12 : -1.4, y1: F.f === FN.cub.f ? 12 : F.f === FN.exp.f ? 3 : 3.4, pad: 20, xl: "θ", yl: "" });
    L.axes({ noGrid: true });
    L.fn(F.f, c.main, 2, null, 600);
    g.save(); g.translate(half, 0);
    const R = QSim.frame({ g, W: W - half, H }, { x0: 0, x1: Math.log10(Nmax), y0: -16, y1: 1, pad: 28, xl: "log₁₀ n", yl: "log₁₀ |f̂(n)|" });
    R.axes();
    const pts = [];
    for (let n = 1; n <= Nmax; n++) { const a = Math.abs(F.c(n)); if (a > 1e-300) pts.push([Math.log10(n), Math.max(-16, Math.log10(a))]); }
    pts.forEach((p) => R.dot(p[0], p[1], c.main, 2.2));
    if (F.slope) { const a = Math.log10(Math.abs(F.c(1))); R.path([[0, a], [Math.log10(Nmax), a + F.slope * Math.log10(Nmax)]], c.acc, 1.4, [5, 4]); }
    g.restore();
    const n0 = F.f === FN.exp.f ? 10 : Nmax % 2 ? Nmax : Nmax - 1;
    k.out(`${F.name} · ${F.slope ? `점선의 기울기 ${F.slope}: |f̂(n)| ∝ n^${F.slope}` : "어떤 기울기의 직선보다도 빨리 내려감(지수보다 빠른 감쇠)"}\n|f̂(${n0})| = ${Math.abs(F.c(n0)).toExponential(3)}`);
  }
  S.redraw();
})();
