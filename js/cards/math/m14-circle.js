/* 수학14 탐구: f(t) = (cos 2πt, sin 2πt), [0,1) → S¹ 는 연속 전단사지만 역이 (1,0)에서 불연속 */
(() => {
  "use strict";
  const S = MKit.setup("card-m14-circle", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const TAU = 2 * Math.PI;
  function draw() {
    const c = QSim.col(), th = (k.val("a") * Math.PI) / 180, r = k.val("r") / 100;
    const W = v.W, H = v.H, g = v.g, half = W / 2;
    // 왼쪽: [0, 1) 구간
    const L = QSim.frame({ g, W: half, H }, { x0: -0.1, x1: 1.1, y0: -1, y1: 1, pad: 18 });
    L.path([[0, 0], [1, 0]], c.ink3, 2);
    L.dot(0, 0, c.ink3, 4); L.dot(1, 0, c.card, 4);
    L.text("0", -0.02, -0.3, c.ink3); L.text("1 (빠짐)", 0.9, -0.3, c.ink3);
    // 오른쪽: 원
    g.save(); g.translate(half, 0);
    const R = QSim.frame({ g, W: half, H }, { x0: -1.5, x1: 1.5, y0: -1.3, y1: 1.3, pad: 14, equal: true });
    R.path(Array.from({ length: 181 }, (_, i) => [Math.cos((i / 180) * TAU), Math.sin((i / 180) * TAU)]), c.ink3, 2);
    // 원 위의 점 p와 그 둘레 호(근방), 각 [th − r·π, th + r·π]
    const p = [Math.cos(th), Math.sin(th)], w = r * Math.PI;
    R.path(Array.from({ length: 61 }, (_, i) => { const a = th - w + (2 * w * i) / 60; return [Math.cos(a), Math.sin(a)]; }), c.acc, 5);
    R.dot(p[0], p[1], c.warn, 5);
    R.dot(1, 0, c.ink, 3);
    g.restore();
    // 근방(호)의 역상: t = 각/(2π) mod 1
    const pieces = [];
    const a0 = th - w, a1 = th + w;
    const t0 = a0 / TAU, t1 = a1 / TAU;
    const f0 = t0 - Math.floor(t0), f1 = t1 - Math.floor(t1);
    if (Math.floor(t0) === Math.floor(t1)) pieces.push([f0, f1]); else { pieces.push([f0, 1]); pieces.push([0, f1]); }
    g.save();
    pieces.forEach(([s0, s1]) => L.path([[s0, 0.35], [Math.min(s1, 0.999), 0.35]], c.acc, 5));
    g.restore();
    const tp = ((th / TAU) % 1 + 1) % 1;
    L.dot(tp, 0, c.warn, 5);
    k.out(`원 위의 점 p = (${fmt(p[0], 3)}, ${fmt(p[1], 3)}), 역상 f⁻¹(p) = t = ${fmt(tp, 4)} · 둘레 호(주황)의 역상: ${pieces.length === 1 ? `구간 하나 [${fmt(pieces[0][0], 3)}, ${fmt(pieces[0][1], 3)}]` : `두 조각 [${fmt(pieces[0][0], 3)}, 1) ∪ [0, ${fmt(pieces[1][1], 3)}] — 0 근처와 1 근처로 갈라짐`}`);
  }
  S.redraw();
})();
