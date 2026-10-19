/* 수학4 탐구: 다항식 차수에 따른 훈련 오차와 검증 오차 — 과적합의 진단 */
(() => {
  "use strict";
  const S = MKit.setup("card-m4-overfit", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  let s = 23; const u = () => { s = (s + 0x6d2b79f5) | 0; let r = Math.imul(s ^ (s >>> 15), 1 | s); r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r; return (((r ^ (r >>> 14)) >>> 0) + 0.5) / 4294967296; };
  const gauss = () => Math.sqrt(-2 * Math.log(u())) * Math.cos(2 * Math.PI * u());
  const truth = (x) => Math.sin(2 * Math.PI * x);
  // [흔들림, 잡음]: 훈련·검증 자료의 x는 고른 격자에서 조금씩 흔든 값
  const all = Array.from({ length: 60 }, () => [u(), gauss()]);
  const pts = (lo, m) => all.slice(lo, lo + m).map(([j, z], i) => { const x = (i + 0.1 + 0.8 * j) / m; return [x, truth(x), z]; });
  function lstsq(X, Y, d) {
    // t = 2x − 1 위의 단항식 기저, 수정 그람-슈미트 QR
    const m = X.length, n = d + 1;
    const Q = X.map((x) => Array.from({ length: n }, (_, j) => Math.pow(2 * x - 1, j))), R = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < j; i++) { let dt = 0; for (let r = 0; r < m; r++) dt += Q[r][i] * Q[r][j]; R[i][j] = dt; for (let r = 0; r < m; r++) Q[r][j] -= dt * Q[r][i]; }
      let nr = 0; for (let r = 0; r < m; r++) nr += Q[r][j] ** 2; nr = Math.sqrt(nr); R[j][j] = nr; for (let r = 0; r < m; r++) Q[r][j] /= nr || 1;
    }
    const qy = Array.from({ length: n }, (_, j) => Q.reduce((a, row, i) => a + row[j] * Y[i], 0)), c = new Array(n).fill(0);
    for (let j = n - 1; j >= 0; j--) { let t = qy[j]; for (let l = j + 1; l < n; l++) t -= R[j][l] * c[l]; c[j] = R[j][j] > 1e-12 ? t / R[j][j] : 0; }
    return (x) => c.reduce((a, cj, j) => a + cj * Math.pow(2 * x - 1, j), 0);
  }
  function draw() {
    const col = QSim.col(), sg = k.val("sg"), nt = k.val("nt");
    let d = k.val("d");
    const tr = pts(0, nt), va = pts(30, 30);
    const ty = tr.map((p) => p[1] + sg * p[2]), vy = va.map((p) => p[1] + sg * p[2]);
    const mseFor = (dd) => { const p = lstsq(tr.map((q) => q[0]), ty, dd); return [tr.reduce((a, q, i) => a + (p(q[0]) - ty[i]) ** 2, 0) / nt, va.reduce((a, q, i) => a + (p(q[0]) - vy[i]) ** 2, 0) / 30]; };
    const maxD = Math.min(12, nt - 1);
    const dd = k.$('[name="d"]'); if (+dd.max !== maxD) { dd.max = maxD; if (d > maxD) { d = maxD; MKit.setVal(k, "d", maxD); } }
    const curve = []; for (let j = 0; j <= maxD; j++) curve.push(mseFor(j));
    let bestD = 0; curve.forEach((e, j) => { if (e[1] < curve[bestD][1]) bestD = j; });
    const W = v.W, H = v.H, g = v.g, half = W / 2;
    // 왼쪽: 자료와 맞춘 곡선
    const L = QSim.frame({ g, W: half, H }, { x0: 0, x1: 1, y0: -2.2, y1: 2.2, pad: 24, xl: "x", yl: "y" });
    L.axes();
    L.fn(truth, col.ink3, 1.2, [4, 4]);
    const p = lstsq(tr.map((q) => q[0]), ty, d);
    L.fn((x) => Math.max(-3, Math.min(3, p(x))), col.main, 2);
    va.forEach((q, i) => L.dot(q[0], vy[i], col.ink3, 3));
    tr.forEach((q, i) => L.dot(q[0], ty[i], col.warn, 4));
    // 오른쪽: 차수별 오차(로그)
    g.save(); g.translate(half, 0);
    const R = QSim.frame({ g, W: half, H }, { x0: 0, x1: maxD, y0: -4, y1: 1, pad: 24, xl: "차수", yl: "log₁₀ MSE" });
    R.axes();
    const lg = (e) => Math.max(-4, Math.min(1, Math.log10(Math.max(e, 1e-12))));
    R.path(curve.map((e, j) => [j, lg(e[0])]), col.warn, 2);
    R.path(curve.map((e, j) => [j, lg(e[1])]), col.main, 2);
    R.path([[d, -4], [d, 1]], col.ink3, 1, [3, 4]);
    R.text("훈련", maxD * 0.75, lg(curve[Math.round(maxD * 0.75)][0]) - 0.35, col.warn);
    R.text("검증", maxD * 0.75, lg(curve[Math.round(maxD * 0.75)][1]) + 0.35, col.main);
    g.restore();
    const [et, ev] = curve[d], show = (e) => (e < 1e-4 ? e.toExponential(1) : fmt(e, 4));
    k.out(`${d}차 · 훈련 자료 ${nt}개, 검증 자료 30개, 잡음 표준편차 ${fmt(sg, 2)}\n훈련 MSE ${show(et)} · 검증 MSE ${show(ev)} · 검증 오차가 가장 작은 차수: ${bestD} (검증 MSE ${show(curve[bestD][1])})`);
  }
  S.redraw();
})();
