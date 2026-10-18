/* 공통3 실습: 퍼텐셜 에너지 그래프와 운동 범위 (04-04) */
(() => {
  "use strict";
  const S = QSim.card("lab-c3-energy"); if (!S) return;
  const cv = S.$("canvas");
  const P = {
    dw: { U: (x) => x ** 4 - 2 * x * x, dU: (x) => 4 * x ** 3 - 4 * x, box: [-1.9, 1.9, -1.3, 2.2], Emin: -0.95, Emax: 2, name: "U = x⁴ − 2x²" },
    sp: { U: (x) => x * x, dU: (x) => 2 * x, box: [-1.9, 1.9, -0.3, 3.2], Emin: 0.05, Emax: 3, name: "U = x² (용수철)" }
  };
  let st = [0, 0], tr = [];
  const pot = () => P[S.val("pot")];
  const E = () => { const p = pot(); return p.Emin + (S.val("e") / 100) * (p.Emax - p.Emin); };
  const turning = () => {
    const p = pot(), e = E();
    if (S.val("pot") === "sp") { const r = Math.sqrt(e); return [-r, r]; }
    const r2 = 1 + Math.sqrt(1 + e), r1 = 1 - Math.sqrt(1 + e);
    return e < 0 ? [Math.sqrt(r1), Math.sqrt(r2)] : [-Math.sqrt(r2), Math.sqrt(r2)];
  };
  const reset = () => { const [, b] = turning(); st = [b - 1e-6, 0]; tr = []; S.$(".ev").textContent = E().toFixed(2); };
  function draw() {
    const C = QSim.col(), v = QSim.view(cv, 0.62), p = pot(), [x0, x1, y0, y1] = p.box;
    const f = QSim.frame(v, { x0, x1, y0, y1, xl: "x (m)", yl: "U (J)" }); f.axes();
    const e = E(), [a, b] = turning();
    const g = v.g; g.save(); g.fillStyle = C.soft; g.globalAlpha = 0.45; g.fillRect(f.X(a), f.Y(y1), f.X(b) - f.X(a), f.Y(y0) - f.Y(y1)); g.restore();
    f.fn(p.U, C.main, 2.5);
    f.path([[x0, e], [x1, e]], C.acc, 2, [6, 4]); f.text("E", x1 - 0.12, e + 0.08, C.acc);
    [a, b].forEach((x) => f.path([[x, y0], [x, e]], C.ink3, 1, [3, 3]));
    const x = st[0], u = p.U(x);
    f.path([[x, u], [x, e]], C.warn, 4); f.dot(x, u, C.ink, 6);
    f.arrow(x, y0 + 0.25, -p.dU(x) * 0.12, 0, C.main, "F");
    S.out(`${p.name}   E = ${e.toFixed(2)} J\n운동 범위 ${a.toFixed(2)} ≤ x ≤ ${b.toFixed(2)} m (색칠한 띠)\n지금 x = ${x.toFixed(2)}: U = ${u.toFixed(2)}, K = E − U = ${Math.max(0, e - u).toFixed(2)} (빨간 막대), F = −dU/dx = ${(-p.dU(x)).toFixed(2)} N`);
  }
  const L = QSim.loop((dt) => {
    const p = pot(), n = 20, h = dt / n;
    for (let i = 0; i < n; i++) st = QSim.rk4((_, s) => [s[1], -p.dU(s[0])], 0, st, h);
    draw();
  }).watch(S.root);
  const setBtn = QSim.playButton(S.$(".play"), L);
  S.on(() => { reset(); draw(); });
  QSim.redrawOn(draw); reset(); draw();
})();
