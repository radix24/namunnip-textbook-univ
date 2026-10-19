/* 수학12 탐구: 가우스 정수의 나눗셈 — β의 배수 격자에서 α에 가장 가까운 점이 몫, 나머지는 원 안에 */
(() => {
  "use strict";
  let f, A = [11, 3], B = [1, 2];
  const S = MKit.setup("card-m12-gauss", 0.8, draw);
  if (!S) return;
  const { k, v } = S;
  const mul = ([a, b], [c, d]) => [a * c - b * d, a * d + b * c];
  const N = ([a, b]) => a * a + b * b;
  function draw() {
    const c = QSim.col(), R = 14;
    f = QSim.frame(v, { x0: -R, x1: R, y0: -R * 0.8, y1: R * 0.8, equal: true, pad: 22 });
    f.axes({ noGrid: true });
    // 정수 격자(옅게)와 β의 배수 격자
    for (let x = -R; x <= R; x++) for (let y = -R; y <= R; y++) if (Math.abs(y) <= R * 0.8) f.dot(x, y, c.rule, 1.3);
    const lines = [];
    for (let t = -30; t <= 30; t++) {
      const p = mul([t, -30], B), q = mul([t, 30], B), p2 = mul([-30, t], B), q2 = mul([30, t], B);
      lines.push([p, q], [p2, q2]);
    }
    lines.forEach(([p, q]) => f.path([p, q], c.soft, 1));
    // 몫: α/β에 가장 가까운 격자점
    const nb = N(B), z = [(A[0] * B[0] + A[1] * B[1]) / nb, (A[1] * B[0] - A[0] * B[1]) / nb];
    const qt = [Math.round(z[0]), Math.round(z[1])], qb = mul(qt, B), r = [A[0] - qb[0], A[1] - qb[1]];
    const circ = []; for (let i = 0; i <= 120; i++) { const t = (i / 120) * 2 * Math.PI, rad = Math.sqrt(nb / 2); circ.push([qb[0] + rad * Math.cos(t), qb[1] + rad * Math.sin(t)]); }
    f.path(circ, c.ink3, 1, [4, 4]);
    f.arrow(0, 0, B[0], B[1], c.main, "β");
    f.arrow(qb[0], qb[1], r[0], r[1], c.warn, "r");
    f.dot(qb[0], qb[1], c.acc, 6);
    f.dot(A[0], A[1], c.ink, 7); f.text("α", A[0] + 0.4, A[1] + 0.4, c.ink);
    f.dot(B[0], B[1], c.main, 6);
    const s = ([a, b]) => `${a}${b < 0 ? " − " : " + "}${Math.abs(b)}i`;
    k.out(`α = ${s(A)}, β = ${s(B)} · α/β = ${MKit.fmt(z[0], 3)} ${z[1] < 0 ? "−" : "+"} ${MKit.fmt(Math.abs(z[1]), 3)}i → 가장 가까운 격자점 q = ${s(qt)}\n`
      + `r = α − qβ = ${s(r)} · N(r) = ${N(r)} ≤ N(β)/2 = ${nb / 2} < N(β) = ${nb}`);
  }
  const snap = (x, y) => [Math.round(x), Math.round(y)];
  MKit.drag(S.cv, () => f, () => [A, B], (i, x, y) => {
    const p = snap(x, y);
    if (i === 0) A = p; else if (p[0] || p[1]) B = p;
    S.redraw();
  });
  S.redraw();
})();
