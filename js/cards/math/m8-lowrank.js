/* 수학8 탐구: 32×32 그림의 계수 k 근사 — 한쪽 야코비 특이값 분해, 에카르트-영 오차 */
(() => {
  "use strict";
  const S = MKit.setup("card-m8-lowrank", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const N = 32;
  const IMG = {
    face: (x, y) => { const r = Math.hypot(x, y); let f = Math.abs(r - 0.8) < 0.08 ? 1 : 0; if (Math.hypot(x - 0.3, y - 0.3) < 0.12 || Math.hypot(x + 0.3, y - 0.3) < 0.12) f = 1; if (y < -0.15 && Math.abs(Math.hypot(x, y) - 0.5) < 0.07) f = 1; return f; },
    cross: (x, y) => (Math.abs(x) < 0.2 || Math.abs(y) < 0.2 ? 1 : 0),
    stripes: (x, y) => 0.5 + 0.5 * Math.sin(6 * x) * Math.cos(4 * y),
    disk: (x, y) => (x * x + y * y < 0.6 ? 1 : 0),
  };
  const cache = {};
  function svd(A) {
    const m = A.length, n = A[0].length, U = A.map((r) => r.slice()), V = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
    for (let sweep = 0; sweep < 60; sweep++) {
      let rot = 0;
      for (let p = 0; p < n - 1; p++) for (let q = p + 1; q < n; q++) {
        let al = 0, be = 0, ga = 0;
        for (let i = 0; i < m; i++) { al += U[i][p] * U[i][p]; be += U[i][q] * U[i][q]; ga += U[i][p] * U[i][q]; }
        if (Math.abs(ga) <= 1e-12 * Math.sqrt(al * be) || Math.abs(ga) < 1e-300) continue;
        rot++;
        const ze = (be - al) / (2 * ga), t = Math.sign(ze || 1) / (Math.abs(ze) + Math.sqrt(1 + ze * ze)), c = 1 / Math.sqrt(1 + t * t), s = c * t;
        for (let i = 0; i < m; i++) { const a = U[i][p], b = U[i][q]; U[i][p] = c * a - s * b; U[i][q] = s * a + c * b; }
        for (let i = 0; i < n; i++) { const a = V[i][p], b = V[i][q]; V[i][p] = c * a - s * b; V[i][q] = s * a + c * b; }
      }
      if (!rot) break;
    }
    const sig = Array.from({ length: n }, (_, j) => Math.sqrt(U.reduce((s, r) => s + r[j] * r[j], 0)));
    const ord = sig.map((x, j) => j).sort((a, b) => sig[b] - sig[a]);
    return { sig: ord.map((j) => sig[j]), u: ord.map((j) => U.map((r) => (sig[j] > 1e-12 ? r[j] / sig[j] : 0))), v: ord.map((j) => V.map((r) => r[j])) };
  }
  function draw() {
    const c = QSim.col(), key = k.val("img"), kk = k.val("k"), g = v.g, W = v.W, H = v.H;
    if (!cache[key]) {
      const A = Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => IMG[key]((2 * (j + 0.5)) / N - 1, 1 - (2 * (i + 0.5)) / N)));
      cache[key] = { A, ...svd(A) };
    }
    const { A, sig, u, v: vv } = cache[key];
    const B = Array.from({ length: N }, () => new Array(N).fill(0));
    for (let t = 0; t < kk; t++) for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) B[i][j] += sig[t] * u[t][i] * vv[t][j];
    const cs = Math.min((W * 0.3) / N, (H - 20) / N), x1 = 10, x2 = x1 + N * cs + 16, y0 = 10;
    const gray = (val) => { const z = Math.round(255 * (1 - Math.max(0, Math.min(1, val)))); return `rgb(${z},${z},${z})`; };
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { g.fillStyle = gray(A[i][j]); g.fillRect(x1 + j * cs, y0 + i * cs, cs + 0.5, cs + 0.5); g.fillStyle = gray(B[i][j]); g.fillRect(x2 + j * cs, y0 + i * cs, cs + 0.5, cs + 0.5); }
    g.strokeStyle = c.rule; g.strokeRect(x1, y0, N * cs, N * cs); g.strokeRect(x2, y0, N * cs, N * cs);
    g.save(); g.translate(x2 + N * cs + 16, 0);
    const Wb = W - (x2 + N * cs + 16) - 6, F = QSim.frame({ g, W: Wb, H }, { x0: 0.5, x1: 16.5, y0: 0, y1: sig[0] * 1.1, pad: 22, xl: "i", yl: "σᵢ" });
    F.axes({ noGrid: true });
    for (let i = 0; i < 16; i++) { g.fillStyle = i < kk ? c.main : c.soft; const X0 = F.X(i + 0.6), X1 = F.X(i + 1.4); g.fillRect(X0, F.Y(sig[i]), X1 - X0, F.Y(0) - F.Y(sig[i])); }
    g.restore();
    const tot = sig.reduce((s, x) => s + x * x, 0), rest = sig.slice(kk).reduce((s, x) => s + x * x, 0), rank = sig.filter((x) => x > 1e-8 * sig[0]).length;
    k.out(`계수 ${rank}인 32×32 그림 · σ₁..σ₅ = ${sig.slice(0, 5).map((x) => fmt(x, 3)).join(", ")}\nk = ${kk}: 상대 오차 ‖A − A_k‖_F/‖A‖_F = ${fmt(Math.sqrt(rest / tot), 4)}, 작용소 노름 오차 σ_${kk + 1} = ${fmt(sig[kk] || 0, 3)} · 저장 ${kk * 65}개 / ${N * N}개`);
  }
  S.redraw();
})();
