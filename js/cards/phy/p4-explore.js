/* 물리4 탐구 카드: 직육면체의 관성 텐서와 주축 */
(() => {
  "use strict";
  const C = () => QSim.col();

  /* 1. 꼭짓점을 원점으로 한 균일한 직육면체의 관성 텐서 (05-01). 질량 1 */
  (() => {
    const S = QSim.card("lab-p4-inertia"); if (!S) return;
    const cv = S.$("canvas");
    const mv = (M, v) => M.map((r) => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
    function eig(M) {   // 3×3 대칭 행렬, Jacobi 회전
      let A = M.map((r) => r.slice()), V = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
      for (let s = 0; s < 50; s++) {
        let p = 0, q = 1; for (const [i, j] of [[0, 1], [0, 2], [1, 2]]) if (Math.abs(A[i][j]) > Math.abs(A[p][q])) { p = i; q = j; }
        if (Math.abs(A[p][q]) < 1e-12) break;
        const th = 0.5 * Math.atan2(2 * A[p][q], A[q][q] - A[p][p]), cs = Math.cos(th), sn = Math.sin(th);
        for (let k = 0; k < 3; k++) { const a = A[k][p], b = A[k][q]; A[k][p] = cs * a - sn * b; A[k][q] = sn * a + cs * b; }
        for (let k = 0; k < 3; k++) { const a = A[p][k], b = A[q][k]; A[p][k] = cs * a - sn * b; A[q][k] = sn * a + cs * b; }
        for (let k = 0; k < 3; k++) { const a = V[k][p], b = V[k][q]; V[k][p] = cs * a - sn * b; V[k][q] = sn * a + cs * b; }
      }
      return [0, 1, 2].map((i) => A[i][i]).sort((x, y) => x - y);
    }
    function draw() {
      const c = C(), a = S.val("a"), b = S.val("b"), d = S.val("d"), th = S.val("th") * Math.PI / 180, ph = S.val("ph") * Math.PI / 180, cen = S.val("org") === "cen";
      // 꼭짓점 원점: 대각 (b²+d²)/3, 관성곱 −ab/4 등. 질량 중심 원점: 대각 (b²+d²)/12, 관성곱 0
      const s = cen ? 0 : 1, k = cen ? 12 : 3;
      const I = [[(b * b + d * d) / k, -s * a * b / 4, -s * a * d / 4],
                 [-s * a * b / 4, (a * a + d * d) / k, -s * b * d / 4],
                 [-s * a * d / 4, -s * b * d / 4, (a * a + b * b) / k]];
      const w = [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)], L = mv(I, w);
      const Ln = Math.hypot(...L), ang = Math.acos(Math.min(1, (L[0] * w[0] + L[1] * w[1] + L[2] * w[2]) / Ln)) * 180 / Math.PI;
      const ev = eig(I), T = 0.5 * (w[0] * L[0] + w[1] * L[1] + w[2] * L[2]);
      // 그림: 비스듬히 본 상자와 ω(파랑), L(주황)
      const v = QSim.view(cv, 0.55), W = v.W, H = v.H, g = v.g, sc = Math.min(W, H) / 4.2;
      const P = ([x, y, z]) => { const o = cen ? [a / 2, b / 2, d / 2] : [0, 0, 0]; x -= o[0]; y -= o[1]; z -= o[2]; return [W / 2 + sc * (x - 0.5 * y), H * 0.62 - sc * (z - 0.35 * y)]; };
      const Pv = ([x, y, z]) => [W / 2 + sc * (x - 0.5 * y), H * 0.62 - sc * (z - 0.35 * y)];
      const corners = []; for (const x of [0, a]) for (const y of [0, b]) for (const z of [0, d]) corners.push([x, y, z]);
      g.strokeStyle = c.ink3; g.lineWidth = 1;
      for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) { const p = corners[i], q = corners[j]; if ((p[0] !== q[0]) + (p[1] !== q[1]) + (p[2] !== q[2]) === 1) { const A = P(p), B = P(q); g.beginPath(); g.moveTo(...A); g.lineTo(...B); g.stroke(); } }
      const arrow = (vec, col, lab) => { const O = Pv([0, 0, 0]), E = Pv(vec); g.strokeStyle = g.fillStyle = col; g.lineWidth = 3; g.beginPath(); g.moveTo(...O); g.lineTo(...E); g.stroke(); g.font = "13px sans-serif"; g.fillText(lab, E[0] + 4, E[1] - 4); };
      arrow(w.map((x) => x * 1.6), c.main, "ω"); arrow(L.map((x) => x * 1.6 / Ln), c.acc, "L");
      g.fillStyle = c.warn; const O = Pv([0, 0, 0]); g.beginPath(); g.arc(O[0], O[1], 4, 0, 7); g.fill();
      S.out(`상자 ${a} × ${b} × ${d}, 질량 1, 원점: ${cen ? "질량 중심" : "꼭짓점 (빨간 점)"}\n관성 텐서 대각 ${I.map((r, i) => r[i].toFixed(4)).join(", ")}, 관성곱 I_xy ${I[0][1].toFixed(4)}, I_xz ${I[0][2].toFixed(4)}, I_yz ${I[1][2].toFixed(4)}\n단위 ω = (${w.map((x) => x.toFixed(3)).join(", ")}) → L = Iω = (${L.map((x) => x.toFixed(4)).join(", ")}), L과 ω의 각 ${ang.toFixed(1)}°\n주관성 모멘트(고유값) ${ev.map((x) => x.toFixed(4)).join(", ")}, 회전 에너지 ½ω·Iω = ${T.toFixed(4)}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
