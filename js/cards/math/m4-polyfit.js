/* 수학4 탐구: 잡음 섞인 점 10개에 d차 다항식 최소제곱 — 잔차 제곱합과 곡선의 출렁임 */
(() => {
  "use strict";
  const S = MKit.setup("card-m4-polyfit", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  let s = 7; const u = () => { s = (s + 0x6d2b79f5) | 0; let r = Math.imul(s ^ (s >>> 15), 1 | s); r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r; return (((r ^ (r >>> 14)) >>> 0) + 0.5) / 4294967296; };
  const gauss = () => Math.sqrt(-2 * Math.log(u())) * Math.cos(2 * Math.PI * u());
  const X = Array.from({ length: 10 }, (_, i) => i / 9), Y = X.map((x) => Math.sin(2 * Math.PI * x) + 0.25 * gauss());
  function lstsq(d) {
    // 정규화한 t = 2x − 1 위에서 QR(수정 그람-슈미트)
    const m = X.length, n = d + 1, A = X.map((x) => Array.from({ length: n }, (_, j) => Math.pow(2 * x - 1, j)));
    const Q = A.map((r) => r.slice()), R = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < j; i++) { let dot = 0; for (let r = 0; r < m; r++) dot += Q[r][i] * Q[r][j]; R[i][j] = dot; for (let r = 0; r < m; r++) Q[r][j] -= dot * Q[r][i]; }
      let nr = 0; for (let r = 0; r < m; r++) nr += Q[r][j] * Q[r][j]; nr = Math.sqrt(nr); R[j][j] = nr; for (let r = 0; r < m; r++) Q[r][j] /= nr || 1;
    }
    const qty = Array.from({ length: n }, (_, j) => Q.reduce((a, r, i) => a + r[j] * Y[i], 0)), c = new Array(n).fill(0);
    for (let j = n - 1; j >= 0; j--) { let t = qty[j]; for (let l = j + 1; l < n; l++) t -= R[j][l] * c[l]; c[j] = R[j][j] > 1e-12 ? t / R[j][j] : 0; }
    return c;
  }
  function draw() {
    const col = QSim.col(), d = k.val("d");
    const c = lstsq(d), p = (x) => c.reduce((a, cj, j) => a + cj * Math.pow(2 * x - 1, j), 0);
    const sse = X.reduce((a, x, i) => a + (Y[i] - p(x)) ** 2, 0);
    const F = QSim.frame(v, { x0: -0.1, x1: 1.1, y0: -2.5, y1: 2.5, pad: 26, xl: "x", yl: "y" });
    F.axes();
    F.fn((x) => Math.sin(2 * Math.PI * x), col.ink3, 1.2, [4, 4]);
    F.fn((x) => Math.max(-3, Math.min(3, p(x))), col.main, 2.2);
    X.forEach((x, i) => F.dot(x, Y[i], col.warn, 5));
    const outside = Math.abs(p(1.08));
    k.out(`${d}차 다항식 · 잔차 제곱합 ${sse < 1e-12 ? "0 (모든 점을 지남)" : fmt(sse, 4)} · 자유도(점 수 − 계수 수) ${10 - d - 1}\n범위 밖 x = 1.08에서 |p| = ${fmt(outside, 2)} · 점선: 자료를 만든 참 곡선 sin 2πx`);
  }
  S.redraw();
})();
