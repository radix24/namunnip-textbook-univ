/* 수학11 탐구: 푸리에 부분합 S_N f 와 평균제곱오차 ‖f − S_N f‖² = ‖f‖² − Σ(계수²) */
(() => {
  "use strict";
  const S = MKit.setup("card-m11-bessel", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const PI = Math.PI;
  const FN = {
    sq: { name: "사각파 sgn x", f: (x) => Math.sign(x), a0: 0, a: () => 0, b: (n) => (n % 2 ? 4 / (PI * n) : 0), norm2: 2 },
    saw: { name: "톱니파 x", f: (x) => x, a0: 0, a: () => 0, b: (n) => (2 * (n % 2 ? 1 : -1)) / n, norm2: (2 * PI * PI) / 3 },
    abs: { name: "삼각파 |x|", f: (x) => Math.abs(x), a0: PI, a: (n) => (n % 2 ? -4 / (PI * n * n) : 0), b: () => 0, norm2: (2 * PI * PI) / 3 },
  };
  function draw() {
    const c = QSim.col(), F = FN[k.val("f")], N = k.val("n"), dg = k.val("dg");
    const SN = (x) => { let s = F.a0 / 2; for (let n = 1; n <= N; n++) s += F.a(n) * Math.cos(n * x) + F.b(n) * Math.sin(n * x); return s; };
    // 비교용: 첫째 계수를 일부러 dg만큼 틀리게 한 근사
    const Gn = (x) => SN(x) + dg * (F.b(1) ? Math.sin(x) : Math.cos(x));
    const P = QSim.frame(v, { x0: -PI, x1: PI, y0: -3.6, y1: 3.6, pad: 24, xl: "x", yl: "" });
    P.axes();
    P.fn(F.f, c.ink3, 1.6, [4, 4], 600);
    if (dg !== 0 && N >= 1) P.fn(Gn, c.acc, 1.4, null, 600);
    P.fn(SN, c.main, 2, null, 800);
    let sum = F.a0 * F.a0 / 2;
    for (let n = 1; n <= N; n++) sum += F.a(n) ** 2 + F.b(n) ** 2;
    const err = F.norm2 - sum;
    k.out(`${F.name}, N = ${N} · ‖f‖² = ${fmt(F.norm2, 5)}, Σ 계수² = ${fmt(sum, 5)} (베셀: ≤ ‖f‖²)\n‖f − S_N f‖² = ${err < 1e-4 ? err.toExponential(2) : fmt(err, 5)}${dg !== 0 && N >= 1 ? ` · 첫째 계수를 ${fmt(dg, 2)}만큼 바꾼 근사(주황)의 오차 = ${fmt(err + dg * dg, 5)} = 최소 + ${fmt(dg * dg, 4)}` : ""}`);
  }
  S.redraw();
})();
