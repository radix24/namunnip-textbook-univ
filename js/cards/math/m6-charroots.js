/* 수학6 탐구: y'' + by' + cy = 0 — 특성근의 위치(복소평면)와 해의 모양(과감쇠·임계·감쇠진동) */
(() => {
  "use strict";
  const S = MKit.setup("card-m6-charroots", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  function sol(b, c, t) {
    // y(0) = 1, y'(0) = 0
    const D = b * b - 4 * c;
    if (D > 1e-9) { const r1 = (-b + Math.sqrt(D)) / 2, r2 = (-b - Math.sqrt(D)) / 2, c2 = -r1 / (r2 - r1), c1 = 1 - c2; return c1 * Math.exp(r1 * t) + c2 * Math.exp(r2 * t); }
    if (D < -1e-9) { const al = -b / 2, be = Math.sqrt(-D) / 2; return Math.exp(al * t) * (Math.cos(be * t) - (al / be) * Math.sin(be * t)); }
    const r = -b / 2; return (1 - r * t) * Math.exp(r * t);
  }
  function draw() {
    const c = QSim.col(), b = k.val("b"), cc = k.val("c"), D = b * b - 4 * cc, g = v.g, W = v.W, H = v.H;
    // 왼쪽: 복소평면의 근
    const L = QSim.frame({ g, W: W * 0.32, H }, { x0: -4.2, x1: 1.2, y0: -2.8, y1: 2.8, equal: true, pad: 22, xl: "Re", yl: "Im" });
    L.axes();
    const roots = D >= 0 ? [[(-b + Math.sqrt(D)) / 2, 0], [(-b - Math.sqrt(D)) / 2, 0]] : [[-b / 2, Math.sqrt(-D) / 2], [-b / 2, -Math.sqrt(-D) / 2]];
    roots.forEach(([x, y]) => L.dot(x, y, c.warn, 6));
    // 오른쪽: y(t)
    g.save(); g.translate(W * 0.34, 0);
    const R = QSim.frame({ g, W: W * 0.66, H }, { x0: 0, x1: 12, y0: -1.1, y1: 1.1, pad: 26, xl: "t", yl: "y" });
    R.axes(); R.fn((t) => sol(b, cc, t), c.main, 2);
    if (D < 0) { const al = -b / 2; R.fn((t) => Math.exp(al * t) * Math.hypot(1, al / (Math.sqrt(-D) / 2)), c.ink3, 1, [4, 4]); }
    g.restore();
    const kind = Math.abs(D) < 1e-9 ? "중근: 임계 감쇠, (1 − rt)e^(rt)" : D > 0 ? "서로 다른 실근: 과감쇠(진동 없이 수렴)" : b === 0 ? "순허근: 감쇠 없는 진동(중심)" : "복소근: 감쇠 진동";
    const rs = roots.map(([x, y]) => (y ? `${fmt(x, 3)} ${y > 0 ? "+" : "−"} ${fmt(Math.abs(y), 3)}i` : fmt(x, 3))).join(", ");
    k.out(`r² + ${b}r + ${cc} = 0 · 판별식 ${fmt(D, 3)} · 근 ${rs}\n${kind}${D < 0 && b > 0 ? ` · 진동 주기 ${fmt((2 * Math.PI) / (Math.sqrt(-D) / 2), 3)}, 진폭은 e^(${fmt(-b / 2, 2)}t)로 줄어듦(점선)` : ""}`);
  }
  S.redraw();
})();
