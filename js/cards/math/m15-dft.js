/* 수학15 탐구: 표본 cos(2πan/N)의 DFT 크기 — 정수 진동수는 두 막대, 아니면 누출, N − a와의 겹침 */
(() => {
  "use strict";
  const S = MKit.setup("card-m15-dft", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  function draw() {
    const c = QSim.col(), N = k.val("N"), a = k.val("a");
    const f = []; for (let n = 0; n < N; n++) f.push(Math.cos((2 * Math.PI * a * n) / N));
    const m = [];
    for (let kk = 0; kk < N; kk++) {
      let re = 0, im = 0;
      for (let n = 0; n < N; n++) { const th = (-2 * Math.PI * kk * n) / N; re += f[n] * Math.cos(th); im += f[n] * Math.sin(th); }
      m.push(Math.hypot(re, im) / N);
    }
    const F = QSim.frame(v, { x0: -0.5, x1: N - 0.5, y0: 0, y1: 0.6, pad: 26, xl: "k", yl: "|f̂(k)|" });
    F.axes({ noGrid: true });
    for (let kk = 0; kk < N; kk++) F.path([[kk, 0], [kk, m[kk]]], c.main, Math.max(2, Math.min(8, 300 / N)));
    F.path([[-0.5, 0.5], [N - 0.5, 0.5]], c.acc, 1, [5, 4]);
    const ord = m.map((x, i) => [x, i]).sort((p, q) => q[0] - p[0]);
    const big = m.filter((x) => x > 0.01).length;
    const ms = f.reduce((s, x) => s + x * x, 0) / N, ps = m.reduce((s, x) => s + x * x, 0);
    const rr = a % N, low = Math.min(rr, N - rr);
    const alias = Number.isInteger(a) && low !== a ? ` · 진동수 a = ${a}인 파동은 표본에서 진동수 ${low}인 파동과 구별되지 않음(겹침)` : "";
    k.out(`N = ${N}, a = ${fmt(a, 2)} · 큰 계수 k = ${ord[0][1]} (${fmt(ord[0][0], 4)}), k = ${ord[1][1]} (${fmt(ord[1][0], 4)}) · 0.01보다 큰 계수 ${big}개${alias}\n파서벌: (1/N)Σ|f(n)|² = ${fmt(ms, 4)}, Σ|f̂(k)|² = ${fmt(ps, 4)}`);
  }
  S.redraw();
})();
