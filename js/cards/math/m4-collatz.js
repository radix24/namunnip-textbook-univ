/* 수학4 탐구: 콜라츠 수열 — n의 궤적(로그 눈금)과 1..N의 단계 수 산점도 */
(() => {
  "use strict";
  const S = MKit.setup("card-m4-collatz", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const steps = (n) => { let s = 0; while (n !== 1 && s < 10000) { n = n % 2 ? 3 * n + 1 : n / 2; s++; } return s; };
  const ST = new Int32Array(10001); for (let n = 1; n <= 10000; n++) ST[n] = steps(n);
  function draw() {
    const c = QSim.col(), n0 = k.val("n"), N = k.val("N"), g = v.g, W = v.W, H = v.H;
    const seq = [n0]; let x = n0; while (x !== 1 && seq.length < 2000) { x = x % 2 ? 3 * x + 1 : x / 2; seq.push(x); }
    const mx = Math.max(...seq);
    const L = QSim.frame({ g, W: W * 0.5, H }, { x0: 0, x1: Math.max(10, seq.length - 1), y0: 0, y1: Math.log10(mx) * 1.08 + 0.1, pad: 28, xl: "단계", yl: "log₁₀ 값" });
    L.axes({ noGrid: true });
    L.path(seq.map((y, i) => [i, Math.log10(y)]), c.main, 1.4);
    seq.forEach((y, i) => { if (y % 2) L.dot(i, Math.log10(y), c.warn, 2); });
    g.save(); g.translate(W * 0.52, 0);
    const smax = Math.max(...Array.from(ST.slice(1, N + 1)));
    const R = QSim.frame({ g, W: W * 0.48, H }, { x0: 0, x1: N, y0: 0, y1: smax * 1.08, pad: 28, xl: "n", yl: "단계 수" });
    R.axes({ noGrid: true });
    g.fillStyle = c.acc; for (let n = 1; n <= N; n++) { g.fillRect(R.X(n) - 0.6, R.Y(ST[n]) - 0.6, 1.4, 1.4); }
    if (n0 <= N) R.dot(n0, ST[n0], c.warn, 5);
    g.restore();
    let best = 1; for (let n = 1; n <= N; n++) if (ST[n] > ST[best]) best = n;
    const avg = Array.from(ST.slice(1, N + 1)).reduce((a, b) => a + b, 0) / N;
    k.out(`n = ${n0}: ${seq.length - 1}단계, 최댓값 ${mx} · 왼쪽: 궤적(빨간 점은 홀수 단계)\n1..${N}: 가장 오래 걸리는 n = ${best} (${ST[best]}단계), 평균 ${avg.toFixed(2)}단계 · 오른쪽: 단계 수 산점도`);
  }
  S.redraw();
})();
