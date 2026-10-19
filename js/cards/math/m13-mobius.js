/* 수학13 탐구: 뫼비우스 띠 중심선을 따라 법벡터를 연속으로 옮기기 — 한 바퀴 뒤 반대 방향 */
(() => {
  "use strict";
  const S = MKit.setup("card-m13-mobius", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const M = window.M13;
  const PI = Math.PI;
  function draw() {
    const c = QSim.col(), tw = k.val("tw") === "half" ? 0.5 : 1, s = (k.val("s") / 100) * 4 * PI, yaw = (k.val("yaw") * PI) / 180;
    // tw = 0.5: 반 바퀴(뫼비우스), tw = 1: 한 바퀴 비튼 띠
    const X = (u, w) => { const a = tw * u; return [(1 + w * Math.cos(a)) * Math.cos(u), (1 + w * Math.cos(a)) * Math.sin(u), w * Math.sin(a)]; };
    const Nf = (u) => { const a = tw * u, xu = [-Math.sin(u), Math.cos(u), 0], xv = [Math.cos(a) * Math.cos(u), Math.cos(a) * Math.sin(u), Math.sin(a)]; return M.unit(M.cross(xu, xv)); };
    const P = M.view(yaw, 0.6);
    const F = QSim.frame(v, { x0: -2.3, x1: 2.3, y0: -1.45, y1: 1.45, pad: 8, equal: true });
    for (let j = 0; j <= 6; j++) { const w = -0.4 + (0.8 * j) / 6, A = []; for (let i = 0; i <= 160; i++) A.push(X((i / 160) * 2 * PI, w)); M.path(F, P, A, j === 3 ? c.ink3 : c.rule, j === 3 ? 1.4 : 1, j === 3 ? [4, 3] : null); }
    for (let i = 0; i < 48; i++) { const u = (i / 48) * 2 * PI; M.path(F, P, [X(u, -0.4), X(u, 0.4)], c.rule, 1); }
    // 지나온 경로의 법벡터 자취
    const steps = Math.max(1, Math.round((s / (4 * PI)) * 64));
    for (let i = 0; i <= steps; i++) { const u = (i / steps) * s; M.arrow(F, P, X(u, 0), M.mul(0.32, Nf(u)), i === steps ? c.acc : c.soft); }
    const N0 = Nf(0), Ns = Nf(s);
    M.arrow(F, P, X(0, 0), M.mul(0.32, N0), c.warn, "처음");
    const loops = s / (2 * PI);
    k.out(`${tw === 0.5 ? "뫼비우스 띠(반 바퀴 비틀기)" : "한 바퀴 비튼 띠"} · 중심선을 따라 ${fmt(loops, 2)}바퀴 이동\n지금의 법벡터 N = (${fmt(Ns[0], 3)}, ${fmt(Ns[1], 3)}, ${fmt(Ns[2], 3)}) · 출발점에서의 N(0) = (${fmt(N0[0], 3)}, ${fmt(N0[1], 3)}, ${fmt(N0[2], 3)})${Math.abs(loops - Math.round(loops)) < 0.01 ? ` · 같은 점으로 돌아옴: N·N(0) = ${fmt(M.dot(Ns, N0), 3)}` : ""}`);
  }
  S.redraw();
})();
