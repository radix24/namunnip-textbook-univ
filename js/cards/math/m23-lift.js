/* 수학23 탐구: 원점을 뺀 평면의 고리와 그 각도 올림 — 올림의 끝값 = 감김수, 고리를 줄이면 원점을 지날 때만 바뀜 */
(() => {
  "use strict";
  const S = MKit.setup("card-m23-lift", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const N = 800;
  function loop(s, kk, cx, wob, t) {
    const a = 2 * Math.PI * s, x = cx + Math.cos(kk * a) + wob * Math.cos(5 * a), y = Math.sin(kk * a) + wob * Math.sin(3 * a), bx = cx + 1 + wob;
    return [bx + (1 - t) * (x - bx), (1 - t) * y];
  }
  function draw() {
    const c = QSim.col(), kk = k.val("k"), cx = k.val("cx"), wob = k.val("wob"), t = k.val("t");
    const F = QSim.frame(v, { x0: -3.2, x1: 6, y0: -2.4, y1: 2.4, pad: 4, equal: true, xl: "", yl: "" });
    const pts = []; let dmin = Infinity;
    for (let i = 0; i <= N; i++) { const p = loop(i / N, kk, cx, wob, t); pts.push(p); dmin = Math.min(dmin, Math.hypot(p[0], p[1])); }
    F.path([[-3, 0], [1.7, 0]], c.rule, 1); F.path([[0, -2.2], [0, 2.2]], c.rule, 1);
    F.path(pts, c.main, 2);
    F.dot(0, 0, c.warn, 5); F.text("0", 0.08, -0.25, c.warn, "left");
    F.dot(pts[0][0], pts[0][1], c.acc, 4);
    const lift = [0]; let ang = Math.atan2(pts[0][1], pts[0][0]);
    for (let i = 1; i <= N; i++) { const a2 = Math.atan2(pts[i][1], pts[i][0]); let d = a2 - ang; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; lift.push(lift[i - 1] + d / (2 * Math.PI)); ang = a2; }
    const gx = (s) => 2.2 + 3.6 * s, gy = (u) => 0.55 * u;
    F.path([[gx(0), gy(-3.6)], [gx(0), gy(3.6)]], c.ink3, 1);
    F.path([[gx(0), 0], [gx(1), 0]], c.ink3, 1);
    for (let u = -3; u <= 3; u++) { F.path([[gx(0), gy(u)], [gx(1), gy(u)]], c.soft, 0.8); F.text(String(u), gx(0) - 0.1, gy(u), c.ink3, "right"); }
    F.path(lift.map((u, i) => [gx(i / N), gy(Math.max(-3.8, Math.min(3.8, u)))]), c.acc, 2);
    F.text("올림 θ̃(s)/2π", gx(0.02), gy(3.9), c.ink, "left");
    const w = lift[N], bad = dmin < 0.03;
    k.out(`고리: ${kk}번 감음, 중심 (${fmt(cx, 2)}, 0), 흔들림 ${fmt(wob, 2)}, 줄인 정도 t = ${fmt(t, 2)} · 원점까지 최소 거리 ${fmt(dmin, 3)}\n` +
      (bad ? "고리가 원점을 지나거나 거의 닿아 올림(각도)이 정의되지 않습니다." : `올림의 끝값 = ${fmt(w, 3)} → 감김수(차수) ${Math.round(w)}`));
  }
  S.redraw();
})();
