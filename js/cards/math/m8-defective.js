/* 수학8 탐구: A = [[2, a], [0, 2 + b]] — 고유값이 겹치면 고유 방향이 하나로 합쳐지고 극소다항식에 중근이 생긴다 */
(() => {
  "use strict";
  const S = MKit.setup("card-m8-defective", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  function draw() {
    const c = QSim.col(), a = k.val("a"), b = k.val("b");
    const F = QSim.frame(v, { x0: -2.6, x1: 2.6, y0: -1.3, y1: 1.3, pad: 20, xl: "x", yl: "y" });
    F.axes({ noGrid: true });
    const l1 = 2, l2 = 2 + b, e1 = [1, 0];
    let e2 = null;
    if (Math.abs(b) > 1e-9) { const r = Math.hypot(a, b); e2 = [a / r, b / r]; }
    else if (Math.abs(a) < 1e-9) e2 = [0, 1];
    F.path([[-3 * e1[0], -3 * e1[1]], [3 * e1[0], 3 * e1[1]]], c.acc, 2.4);
    if (e2) F.path([[-3 * e2[0], -3 * e2[1]], [3 * e2[0], 3 * e2[1]]], c.warn, 2.4);
    // 단위원과 그 상 (A − 2I 대신 A/2.5로 축소해 모양만)
    const P = [], Q = []; for (let i = 0; i <= 120; i++) { const t = (2 * Math.PI * i) / 120, x = Math.cos(t), y = Math.sin(t); P.push([x, y]); Q.push([(2 * x + a * y) / 2.5, ((2 + b) * y) / 2.5]); }
    F.path(P, c.ink3, 1, [3, 3]); F.path(Q, c.main, 1.4);
    let mp, diag, ang = "";
    if (Math.abs(b) > 1e-9) { mp = `(λ − 2)(λ − ${fmt(l2, 2)})`; diag = "대각화 가능 (고유값이 다름)"; const t = (Math.acos(Math.abs(e2[0])) * 180) / Math.PI; ang = ` · 두 고유 방향 사이 각 ${fmt(t, 1)}°`; }
    else if (Math.abs(a) < 1e-9) { mp = "(λ − 2)"; diag = "대각화 가능 (A = 2I)"; }
    else { mp = "(λ − 2)²"; diag = "대각화 불가: 고유 방향이 하나뿐, 조르당 블록 J₂(2)"; }
    k.out(`A = [[2, ${fmt(a, 2)}], [0, ${fmt(2 + b, 2)}]] · 특성다항식 (λ − 2)(λ − ${fmt(l2, 2)}) · 극소다항식 ${mp}\n${diag}${ang}`);
  }
  S.redraw();
})();
