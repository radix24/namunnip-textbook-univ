/* 수학11 탐구: 작은 정사각형을 도는 ∮(P dx + Q dy) / 넓이 → Q_x − P_y (dω의 계수) */
(() => {
  "use strict";
  const S = MKit.setup("card-m11-circ", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const FORMS = {
    rot: { name: "−y dx + x dy", P: (x, y) => -y, Q: (x, y) => x, curl: () => 2 },
    cub: { name: "−y³ dx + x³ dy", P: (x, y) => -y * y * y, Q: (x, y) => x * x * x, curl: (x, y) => 3 * x * x + 3 * y * y },
    sh: { name: "y² dx", P: (x, y) => y * y, Q: () => 0, curl: (x, y) => -2 * y },
    ex: { name: "e^x sin y dx + e^x cos y dy (= d(e^x sin y))", P: (x, y) => Math.exp(x) * Math.sin(y), Q: (x, y) => Math.exp(x) * Math.cos(y), curl: () => 0 },
  };
  const gl = [-0.906179845938664, -0.538469310105683, 0, 0.538469310105683, 0.906179845938664], gw = [0.236926885056189, 0.478628670499366, 0.568888888888889, 0.478628670499366, 0.236926885056189];
  const lineInt = (Fm, ax, ay, bx, by) => { let s = 0; for (let i = 0; i < 5; i++) { const t = (gl[i] + 1) / 2, x = ax + t * (bx - ax), y = ay + t * (by - ay); s += (gw[i] / 2) * (Fm.P(x, y) * (bx - ax) + Fm.Q(x, y) * (by - ay)); } return s; };
  function draw() {
    const c = QSim.col(), Fm = FORMS[k.val("w")], a = k.val("a"), b = k.val("b"), h = Math.pow(10, k.val("lh"));
    const P = QSim.frame(v, { x0: -2.2, x1: 2.2, y0: -1.1, y1: 1.1, pad: 18, equal: true });
    P.axes({ noGrid: true });
    // 벡터장 (P, Q) 화살표
    for (let i = -8; i <= 8; i++) for (let j = -4; j <= 4; j++) {
      const x = i * 0.26, y = j * 0.26, px = Fm.P(x, y), qy = Fm.Q(x, y), n = Math.hypot(px, qy);
      if (n < 1e-9) continue; const L = 0.11 * Math.min(1, n) / n;
      P.path([[x, y], [x + px * L, y + qy * L]], c.ink3, 1);
    }
    const hs = Math.max(h, 0.02) / 2;
    P.path([[a - hs, b - hs], [a + hs, b - hs], [a + hs, b + hs], [a - hs, b + hs], [a - hs, b - hs]], c.main, 2);
    P.dot(a, b, c.warn, 4);
    const half = h / 2;
    const circ = lineInt(Fm, a - half, b - half, a + half, b - half) + lineInt(Fm, a + half, b - half, a + half, b + half) + lineInt(Fm, a + half, b + half, a - half, b + half) + lineInt(Fm, a - half, b + half, a - half, b - half);
    const ratio = circ / (h * h), cu = Fm.curl(a, b);
    k.out(`ω = ${Fm.name}, 중심 (${fmt(a, 2)}, ${fmt(b, 2)}), 한 변 h = ${h < 0.01 ? h.toExponential(0) : fmt(h, 3)}\n∮ω = ${circ.toExponential(3)} · ∮ω / h² = ${fmt(ratio, 6)} · dω의 계수 Q_x − P_y = ${fmt(cu, 6)} · 차 ${Math.abs(ratio - cu).toExponential(1)}`);
  }
  S.redraw();
})();
