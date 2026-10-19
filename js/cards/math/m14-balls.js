/* 수학14 탐구: p-거리의 단위 공과 그 안팎의 정사각형 공 — 위상동치 */
(() => {
  "use strict";
  const S = MKit.setup("card-m14-balls", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  function draw() {
    const c = QSim.col(), lp = k.val("p"), p = lp >= 20 ? Infinity : lp, cx = k.val("x"), cy = k.val("y");
    const F = QSim.frame(v, { x0: -2.6, x1: 2.6, y0: -1.3, y1: 1.3, pad: 14, equal: true });
    F.axes({ noGrid: true });
    const ball = (q, r, ox, oy) => {
      const pts = [];
      for (let i = 0; i <= 360; i++) {
        const t = (i / 360) * 2 * Math.PI, ct = Math.cos(t), st = Math.sin(t);
        const n = q === Infinity ? Math.max(Math.abs(ct), Math.abs(st)) : Math.pow(Math.pow(Math.abs(ct), q) + Math.pow(Math.abs(st), q), 1 / q);
        pts.push([ox + (r * ct) / n, oy + (r * st) / n]);
      }
      return pts;
    };
    F.path(ball(1, 1, 0, 0), c.rule, 1, [3, 3]); F.path(ball(2, 1, 0, 0), c.rule, 1, [3, 3]); F.path(ball(Infinity, 1, 0, 0), c.rule, 1, [3, 3]);
    const inner = p === Infinity ? 1 : Math.pow(2, -1 / p);
    F.path(ball(Infinity, 1, 0, 0), c.acc, 1.4);
    F.path(ball(Infinity, inner, 0, 0), c.acc, 1.4);
    F.path(ball(p, 1, 0, 0), c.main, 2.4);
    // 점 (cx, cy)가 B_p(0,1) 안이면 그 점을 중심으로 안에 들어가는 정사각형 공
    const dp = p === Infinity ? Math.max(Math.abs(cx), Math.abs(cy)) : Math.pow(Math.pow(Math.abs(cx), p) + Math.pow(Math.abs(cy), p), 1 / p);
    const inside = dp < 1;
    if (inside) { const r = (1 - dp) * inner; F.path(ball(Infinity, r, cx, cy), c.warn, 1.5); }
    F.dot(cx, cy, inside ? c.warn : c.ink3, 4);
    k.out(`p = ${p === Infinity ? "∞" : fmt(p, 2)} · d∞ ≤ d_p ≤ 2^(1/p)·d∞ 이므로 B∞(${fmt(inner, 4)}) ⊆ B_p(1) ⊆ B∞(1) (주황 정사각형 두 개)\n점 (${fmt(cx, 2)}, ${fmt(cy, 2)})의 d_p = ${fmt(dp, 4)} → ${inside ? `B_p(1) 안: 그 점 둘레 반지름 ${fmt((1 - dp) * inner, 4)}인 정사각형 공(빨강)이 B_p(1) 안에 들어감` : "B_p(1) 밖"}`);
  }
  S.redraw();
})();
