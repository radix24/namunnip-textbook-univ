/* 수학11 탐구: 격자 칸의 상의 넓이 ≈ |det g'| × 칸의 넓이 — 변수변환 공식의 국소적 근거 */
(() => {
  "use strict";
  const S = MKit.setup("card-m11-jacobian", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const MAPS = {
    pol: { name: "극좌표 (r, θ) ∈ [0.2, 1] × [0, π]", u0: 0.2, u1: 1, v0: 0, v1: Math.PI, g: (r, t) => [r * Math.cos(t), r * Math.sin(t)], det: (r) => r, exact: (Math.PI / 2) * (1 - 0.04), box: [-1.1, 1.1, -0.1, 1.1] },
    lin: { name: "선형 (u, v) ↦ (2u + v, u + v), [0, 1]²", u0: 0, u1: 1, v0: 0, v1: 1, g: (u, w) => [2 * u + w, u + w], det: () => 1, exact: 1, box: [-0.1, 3.1, -0.1, 2.1] },
    sh: { name: "(u, v) ↦ (u, (v + u²)(1 + v/2)), [0, 1]²", u0: 0, u1: 1, v0: 0, v1: 1, g: (u, w) => [u, (w + u * u) * (1 + w / 2)], det: (u, w) => 1 + w + u * u / 2, exact: 1 + 0.5 + 1 / 6, box: [-0.1, 1.1, -0.1, 3.1] },
  };
  const polyArea = (P) => { let s = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; };
  function draw() {
    const c = QSim.col(), M = MAPS[k.val("m")], N = k.val("n");
    const du = (M.u1 - M.u0) / N, dv = (M.v1 - M.v0) / N;
    const F = QSim.frame(v, { x0: M.box[0], x1: M.box[1], y0: M.box[2], y1: M.box[3], pad: 20, equal: true });
    F.axes({ noGrid: true });
    let tot = 0, approx = 0, maxRel = 0;
    const sub = 8;
    const g = v.g;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const ua = M.u0 + i * du, va = M.v0 + j * dv, P = [];
      for (let s = 0; s < sub; s++) P.push(M.g(ua + (du * s) / sub, va));
      for (let s = 0; s < sub; s++) P.push(M.g(ua + du, va + (dv * s) / sub));
      for (let s = 0; s < sub; s++) P.push(M.g(ua + du - (du * s) / sub, va + dv));
      for (let s = 0; s < sub; s++) P.push(M.g(ua, va + dv - (dv * s) / sub));
      const A = polyArea(P), B = Math.abs(M.det(ua + du / 2, va + dv / 2)) * du * dv;
      tot += A; approx += B; maxRel = Math.max(maxRel, Math.abs(A - B) / A);
      g.save(); g.globalAlpha = 0.12 + 0.5 * Math.min(1, B / (du * dv) / 3); g.fillStyle = c.main;
      g.beginPath(); P.forEach((p, q) => (q ? g.lineTo(F.X(p[0]), F.Y(p[1])) : g.moveTo(F.X(p[0]), F.Y(p[1])))); g.closePath(); g.fill();
      g.globalAlpha = 0.7; g.strokeStyle = c.ink3; g.lineWidth = 0.7; g.stroke(); g.restore();
    }
    k.out(`${M.name}, 격자 ${N}×${N}\n칸의 상의 넓이 합 ${fmt(tot, 5)} · Σ|det g′(칸 중심)|·Δu·Δv = ${fmt(approx, 5)} · 정확한 넓이 ∫|det g′| = ${fmt(M.exact, 5)} · 칸별 상대오차 최대 ${maxRel < 1e-4 ? maxRel.toExponential(1) : fmt(maxRel, 4)}`);
  }
  S.redraw();
})();
