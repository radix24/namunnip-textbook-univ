/* 수학11 탐구: 임계점 근처 f ≈ f(p) + (a x² + b xy + c y²)/2 + 고차항 — 등고선으로 보는 판정 */
(() => {
  "use strict";
  const S = MKit.setup("card-m11-quadform", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  function draw() {
    const col = QSim.col(), a = k.val("a"), b = k.val("b"), c = k.val("c"), e = k.val("e");
    const f = (x, y) => 0.5 * (a * x * x + 2 * b * x * y + c * y * y) + e * y * y * y * y + (k.val("cub") === "on" ? 0.5 * x * x * x : 0);
    const W = v.W, H = v.H, g = v.g;
    const F = QSim.frame(v, { x0: -2.4, x1: 2.4, y0: -1.2, y1: 1.2, pad: 14, equal: true });
    // 격자에서 값을 구해 부호로 칠하고 등고선을 그린다
    const nx = 96, ny = 48, vals = [];
    for (let j = 0; j <= ny; j++) { vals.push([]); for (let i = 0; i <= nx; i++) vals[j].push(f(-2.4 + (4.8 * i) / nx, -1.2 + (2.4 * j) / ny)); }
    const cw = (F.X(2.4) - F.X(-2.4)) / nx, ch = (F.Y(-1.2) - F.Y(1.2)) / ny;
    g.save();
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const m = (vals[j][i] + vals[j][i + 1] + vals[j + 1][i] + vals[j + 1][i + 1]) / 4;
      g.fillStyle = m > 0 ? col.acc : col.main; g.globalAlpha = Math.min(0.35, 0.08 + Math.abs(m) * 0.25);
      g.fillRect(F.X(-2.4 + (4.8 * i) / nx), F.Y(-1.2 + (2.4 * (j + 1)) / ny), cw + 0.5, ch + 0.5);
    }
    g.restore();
    // 등고선: 마칭 스퀘어(선분만)
    const levels = [-1, -0.5, -0.2, -0.05, 0, 0.05, 0.2, 0.5, 1];
    g.save(); g.lineWidth = 1;
    for (const L of levels) {
      g.strokeStyle = L === 0 ? col.ink : col.ink3; g.globalAlpha = L === 0 ? 0.9 : 0.6; g.beginPath();
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const x0 = -2.4 + (4.8 * i) / nx, y0 = -1.2 + (2.4 * j) / ny, dx = 4.8 / nx, dy = 2.4 / ny;
        const q = [[x0, y0, vals[j][i]], [x0 + dx, y0, vals[j][i + 1]], [x0 + dx, y0 + dy, vals[j + 1][i + 1]], [x0, y0 + dy, vals[j + 1][i]]];
        const cr = [];
        for (let t = 0; t < 4; t++) { const P = q[t], Q = q[(t + 1) % 4]; if ((P[2] - L) * (Q[2] - L) < 0) { const s = (L - P[2]) / (Q[2] - P[2]); cr.push([P[0] + s * (Q[0] - P[0]), P[1] + s * (Q[1] - P[1])]); } }
        if (cr.length >= 2) { g.moveTo(F.X(cr[0][0]), F.Y(cr[0][1])); g.lineTo(F.X(cr[1][0]), F.Y(cr[1][1])); if (cr.length === 4) { g.moveTo(F.X(cr[2][0]), F.Y(cr[2][1])); g.lineTo(F.X(cr[3][0]), F.Y(cr[3][1])); } }
      }
      g.stroke();
    }
    g.restore();
    F.dot(0, 0, col.warn, 4);
    const tr = a + c, det = a * c - b * b, disc = Math.sqrt(Math.max(0, (a - c) * (a - c) / 4 + b * b));
    const l1 = tr / 2 - disc, l2 = tr / 2 + disc;
    let kind;
    if (Math.abs(det) < 1e-9) kind = "퇴화(D = 0): 2차 항만으로 판정 불가";
    else if (det > 0) kind = a > 0 ? "D > 0, a > 0: 극소" : "D > 0, a < 0: 극대";
    else kind = "D < 0: 안장점";
    k.out(`헤세 행렬 [[${fmt(a, 2)}, ${fmt(b, 2)}], [${fmt(b, 2)}, ${fmt(c, 2)}]] · 고유값 ${fmt(l1, 3)}, ${fmt(l2, 3)} · D = ${fmt(det, 3)} → ${kind}\n고차항: ${[e ? `${fmt(e, 2)}y⁴` : "", k.val("cub") === "on" ? "x³/2" : ""].filter(Boolean).join(" + ") || "없음"} · 주황 = 양수, 파랑 = 음수, 굵은 선 = 0의 등고선`);
  }
  S.redraw();
})();
