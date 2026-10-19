/* 수학17 탐구: 닫힌 곡선을 따라 ∮ dθ/2π — 원점을 감는 횟수 (H¹_dR(ℝ²∖0) = ℝ) */
(() => {
  "use strict";
  const S = MKit.setup("card-m17-winding", 0.62, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const N = 2000;
  const CURVES = {
    circ: { name: "원", p: (t, cx, cy, r) => [cx + r * Math.cos(t), cy + r * Math.sin(t)] },
    twice: { name: "두 번 도는 원", p: (t, cx, cy, r) => [cx + r * Math.cos(2 * t), cy + r * Math.sin(2 * t)] },
    eight: { name: "8자 곡선", p: (t, cx, cy, r) => [cx + r * Math.sin(t), cy + 0.6 * r * Math.sin(2 * t)] },
    lima: { name: "안쪽 고리가 있는 곡선", p: (t, cx, cy, r) => { const rr = r * (0.4 + Math.cos(t)); return [cx + rr * Math.cos(t), cy + rr * Math.sin(t)]; } },
  };
  function draw() {
    const c = QSim.col(), C = CURVES[k.val("c")], cx = k.val("cx"), cy = k.val("cy"), r = k.val("r");
    const F = QSim.frame(v, { x0: -3, x1: 3, y0: -2, y1: 2, pad: 22, equal: true, xl: "x", yl: "y" });
    F.axes();
    const pts = []; for (let i = 0; i <= N; i++) pts.push(C.p((2 * Math.PI * i) / N, cx, cy, r));
    F.path(pts, c.main, 2);
    for (let i = 0; i < N; i += N / 8) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 5]; F.arrow(x0, y0, (x1 - x0) * 8, (y1 - y0) * 8, c.main); }
    F.dot(0, 0, c.warn, 6);
    // ∮ ω = Σ (각도 변화), 원점을 지나면 정의 안 됨
    let tot = 0, mind = Infinity;
    for (let i = 0; i < N; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      mind = Math.min(mind, Math.hypot(x0, y0));
      let d = Math.atan2(y1, x1) - Math.atan2(y0, x0);
      if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI;
      tot += d;
    }
    const bad = mind < 0.03;
    k.out(`${C.name}, 중심 (${fmt(cx, 2)}, ${fmt(cy, 2)}), 크기 ${fmt(r, 2)}\n${bad ? "곡선이 원점(빨강)을 지나 ω가 정의되지 않음" : `∮ω = ${fmt(tot, 4)} = ${fmt(tot / (2 * Math.PI), 4)} × 2π → 원점을 감는 횟수 ${Math.round(tot / (2 * Math.PI))}`}`);
  }
  S.redraw();
})();
