/* 수학13 탐구: 작은 정사각형 밖으로 나가는 선속 / 넓이 → 발산 (d η_V 의 계수) */
(() => {
  "use strict";
  const S = MKit.setup("card-m13-flux", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const FIELDS = {
    rad: { name: "V = xU₁ + yU₂ (솟아남)", P: (x, y) => x, Q: (x, y) => y, div: () => 2 },
    rot: { name: "V = −yU₁ + xU₂ (회전)", P: (x, y) => -y, Q: (x, y) => x, div: () => 0 },
    cub: { name: "V = x³U₁ + y³U₂", P: (x, y) => x * x * x, Q: (x, y) => y * y * y, div: (x, y) => 3 * x * x + 3 * y * y },
    sh: { name: "V = y²U₁ + xyU₂", P: (x, y) => y * y, Q: (x, y) => x * y, div: (x) => x },
  };
  const gl = [-0.906179845938664, -0.538469310105683, 0, 0.538469310105683, 0.906179845938664], gw = [0.236926885056189, 0.478628670499366, 0.568888888888889, 0.478628670499366, 0.236926885056189];
  // 선분 a→b를 따라 바깥 법선 방향 선속: ∫ (P dy − Q dx) (반시계로 돌 때 바깥 법선)
  const fluxSeg = (F, ax, ay, bx, by) => { let s = 0; for (let i = 0; i < 5; i++) { const t = (gl[i] + 1) / 2, x = ax + t * (bx - ax), y = ay + t * (by - ay); s += (gw[i] / 2) * (F.P(x, y) * (by - ay) - F.Q(x, y) * (bx - ax)); } return s; };
  function draw() {
    const c = QSim.col(), F = FIELDS[k.val("w")], a = k.val("a"), b = k.val("b"), h = Math.pow(10, k.val("lh"));
    const P = QSim.frame(v, { x0: -2.2, x1: 2.2, y0: -1.1, y1: 1.1, pad: 18, equal: true });
    P.axes({ noGrid: true });
    for (let i = -8; i <= 8; i++) for (let j = -4; j <= 4; j++) {
      const x = i * 0.26, y = j * 0.26, px = F.P(x, y), qy = F.Q(x, y), n = Math.hypot(px, qy);
      if (n < 1e-9) continue; const L = (0.11 * Math.min(1, n)) / n;
      P.path([[x, y], [x + px * L, y + qy * L]], c.ink3, 1);
    }
    const hs = Math.max(h, 0.02) / 2;
    P.path([[a - hs, b - hs], [a + hs, b - hs], [a + hs, b + hs], [a - hs, b + hs], [a - hs, b - hs]], c.main, 2);
    P.dot(a, b, c.warn, 4);
    const r = h / 2;
    const flux = fluxSeg(F, a - r, b - r, a + r, b - r) + fluxSeg(F, a + r, b - r, a + r, b + r) + fluxSeg(F, a + r, b + r, a - r, b + r) + fluxSeg(F, a - r, b + r, a - r, b - r);
    const ratio = flux / (h * h), dv = F.div(a, b);
    k.out(`${F.name}, 중심 (${fmt(a, 2)}, ${fmt(b, 2)}), 한 변 h = ${h < 0.01 ? h.toExponential(0) : fmt(h, 3)}\n나가는 선속 ${flux.toExponential(3)} · 선속 / h² = ${fmt(ratio, 6)} · 발산 ∇·V = ${fmt(dv, 6)} · 차 ${Math.abs(ratio - dv).toExponential(1)}`);
  }
  S.redraw();
})();
