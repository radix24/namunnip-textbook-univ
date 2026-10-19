/* 수학5 탐구: 쿠폰 수집 — 기하분포의 합 nH_n과 시뮬레이션 히스토그램 */
(() => {
  "use strict";
  const S = MKit.setup("card-m5-coupon", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  function draw() {
    const c = QSim.col(), n = k.val("n"), R = k.val("R"), g = v.g, W = v.W, H = v.H;
    let s = 777; const u = () => { s = (s + 0x6d2b79f5) | 0; let r = Math.imul(s ^ (s >>> 15), 1 | s); r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r; return ((r ^ (r >>> 14)) >>> 0) / 4294967296; };
    let Hn = 0, V = 0; for (let i = 1; i <= n; i++) { Hn += 1 / i; const p = i / n; V += (1 - p) / (p * p); }
    const mean = n * Hn, sd = Math.sqrt(V), Ts = [];
    for (let r = 0; r < R; r++) { const got = new Uint8Array(n); let have = 0, t = 0; while (have < n) { t++; const j = Math.floor(u() * n); if (!got[j]) { got[j] = 1; have++; } } Ts.push(t); }
    const smean = Ts.reduce((a, b) => a + b, 0) / R, xmax = Math.ceil(mean + 4 * sd), B = 30, bw = Math.max(1, Math.ceil((xmax - n) / B));
    const cnt = new Array(B + 1).fill(0); Ts.forEach((t) => { cnt[Math.min(B, Math.floor((t - n) / bw))]++; });
    const ymax = Math.max(...cnt) / R * 1.15;
    const F = QSim.frame({ g, W: W * 0.62, H }, { x0: n, x1: n + bw * (B + 1), y0: 0, y1: ymax, pad: 30, xl: "상자 수", yl: "비율" });
    F.axes({ noGrid: true });
    g.fillStyle = c.soft; g.strokeStyle = c.main; g.lineWidth = 1;
    cnt.forEach((m, j) => { const X0 = F.X(n + j * bw), X1 = F.X(n + (j + 1) * bw), h = m / R; g.fillRect(X0, F.Y(h), X1 - X0, F.Y(0) - F.Y(h)); g.strokeRect(X0, F.Y(h), X1 - X0, F.Y(0) - F.Y(h)); });
    F.path([[mean, 0], [mean, ymax]], c.warn, 2);
    g.save(); g.translate(W * 0.65, 0);
    const G = QSim.frame({ g, W: W * 0.35, H }, { x0: 0.5, x1: n + 0.5, y0: 0, y1: n * 1.08, pad: 26, xl: "i", yl: "E[T_i]" });
    G.axes({ noGrid: true });
    for (let i = 1; i <= n; i++) { const e = n / (n - i + 1), X0 = G.X(i - 0.4), X1 = G.X(i + 0.4); g.fillStyle = i === n ? c.warn : c.main; g.fillRect(X0, G.Y(e), Math.max(1, X1 - X0), G.Y(0) - G.Y(e)); }
    g.restore();
    k.out(`종류 n = ${n} · 이론 평균 nH_n = ${fmt(mean, 2)}, 표준편차 ${fmt(sd, 2)} · ${R}번 실험 평균 ${fmt(smean, 2)}\n오른쪽: 단계별 평균 대기 n/(n − i + 1). 마지막 한 종류에 평균 ${n}상자, 전체의 ${fmt(100 / Hn, 1)}%`);
  }
  S.redraw();
})();
