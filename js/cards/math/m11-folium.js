/* 수학11 탐구: 엽선 x³ + y³ = 3xy 위의 점에서 음함수정리의 조건 F_y ≠ 0, F_x ≠ 0 */
(() => {
  "use strict";
  const S = MKit.setup("card-m11-folium", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const P = (t) => [(3 * t) / (1 + t * t * t), (3 * t * t) / (1 + t * t * t)];
  function draw() {
    const c = QSim.col(), t = k.val("t");
    const F = QSim.frame(v, { x0: -3.2, x1: 3.2, y0: -1.6, y1: 2.6, pad: 22, xl: "x", yl: "y" });
    F.axes();
    F.path([[-3.2, 2.2], [1.6, -2.6]], c.rule, 1, [4, 4]);
    const arc = (t0, t1) => { const pts = []; for (let i = 0; i <= 400; i++) { const s = t0 + ((t1 - t0) * i) / 400; const p = P(s); if (Math.abs(p[0]) < 4 && Math.abs(p[1]) < 4) pts.push(p); } return pts; };
    F.path(arc(-0.95, 40), c.ink2, 1.6); F.path(arc(-40, -1.05), c.ink2, 1.6);
    const [x, y] = P(t), Fx = 3 * x * x - 3 * y, Fy = 3 * y * y - 3 * x;
    F.path(arc(Math.max(-0.95, t - 0.12), t + 0.12), c.main, 3.2);
    const L = 1.2, nrm = Math.hypot(Fx, Fy);
    if (nrm > 1e-9) { const tx = -Fy / nrm, ty = Fx / nrm; F.path([[x - L * tx, y - L * ty], [x + L * tx, y + L * ty]], c.acc, 1.5); }
    F.dot(x, y, c.warn, 5);
    F.dot(Math.pow(2, 2 / 3), Math.pow(2, 1 / 3), c.ink3, 3); F.dot(Math.pow(2, 1 / 3), Math.pow(2, 2 / 3), c.ink3, 3);
    const eps = Math.max(1e-3, 2e-3 * nrm); // 슬라이더 간격 때문에 정확히 0이 되지 않으므로 상대 기준
    const sy = Math.abs(Fy) > eps ? `y = g(x)로 풀림, dy/dx = −F_x/F_y = ${fmt(-Fx / Fy, 4)}` : "F_y ≈ 0: y를 x로 풀 수 없음(수직 접선)";
    const sx = Math.abs(Fx) > eps ? "x = h(y)로도 풀림" : "F_x ≈ 0: x를 y로 풀 수 없음(수평 접선)";
    k.out(`매개변수 t = ${fmt(t, 3)}, 점 (${fmt(x, 4)}, ${fmt(y, 4)}) · F_x = ${fmt(Fx, 4)}, F_y = ${fmt(Fy, 4)}\n${nrm < 1e-3 ? "F_x = F_y = 0: 특이점(곡선이 스스로 교차)" : `${sy} · ${sx}`}`);
  }
  S.redraw();
})();
