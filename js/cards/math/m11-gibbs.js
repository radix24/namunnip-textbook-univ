/* 수학11 탐구: 사각파 부분합의 깁스 현상 — 넘침의 높이는 남고 위치만 불연속점으로 */
(() => {
  "use strict";
  const S = MKit.setup("card-m11-gibbs", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const PI = Math.PI;
  const SN = (N, x) => { let s = 0; for (let n = 1; n <= N; n += 2) s += (4 / (PI * n)) * Math.sin(n * x); return s; };
  const FS = (N, x) => { let s = 0; for (let n = 1; n <= N; n += 2) s += (1 - n / (N + 1)) * (4 / (PI * n)) * Math.sin(n * x); return s; };
  function draw() {
    const c = QSim.col(), N = k.val("n"), zoom = k.val("z") === "on", x0 = k.val("x");
    const xr = zoom ? 0.6 : PI;
    const P = QSim.frame(v, { x0: -xr, x1: xr, y0: -1.4, y1: 1.4, pad: 24, xl: "x", yl: "" });
    P.axes();
    P.path([[-xr, -1], [0, -1]], c.ink3, 1.4, [4, 4]); P.path([[0, 1], [xr, 1]], c.ink3, 1.4, [4, 4]);
    P.path([[-xr, 1.17898], [xr, 1.17898]], c.warn, 1, [2, 4]);
    P.fn((x) => FS(N, x), c.acc, 1.3, null, 1200);
    P.fn((x) => SN(N, x), c.main, 2, null, 1600);
    // 첫 봉우리: x = π/(N+1) 근처에서 최댓값 탐색
    let best = -Infinity, bx = 0;
    const x1 = PI / (N + 1);
    for (let i = 0; i <= 400; i++) { const x = x1 * (0.5 + i / 400); const y = SN(N, x); if (y > best) { best = y; bx = x; } }
    if (Math.abs(bx) <= xr) P.dot(bx, best, c.warn, 4.5);
    const xv = Math.max(-xr, Math.min(xr, x0));
    P.dot(xv, SN(N, xv), c.ink, 4);
    k.out(`N = ${N} · 부분합의 최댓값 ${fmt(best, 5)} (x ≈ ${fmt(bx, 4)}), 넘침 = 점프 2의 ${fmt(((best - 1) / 2) * 100, 2)}% · 극한 (2/π)Si(π) ≈ 1.17898\nS_N(${fmt(xv, 3)}) = ${fmt(SN(N, xv), 5)}, 체사로 평균(주황) = ${fmt(FS(N, xv), 5)} · S_N(0) = 0 = (f(0⁺) + f(0⁻))/2`);
  }
  S.redraw();
})();
