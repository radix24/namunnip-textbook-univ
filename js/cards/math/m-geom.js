/* 수학과 기하 탐구 카드: 곡률과 접촉원, 푸앵카레 원판의 쌍곡 삼각형 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const { fmt } = MKit;

  /* ── 1. 평면곡선의 곡률과 접촉원 ── */
  (() => {
    const CV = {
      ell: { r: (t) => [2 * Math.cos(t), Math.sin(t)], t0: 0, t1: 2 * Math.PI, box: [-3.2, 3.2, -2.2, 2.2], tex: "타원 (2cos t, sin t)" },
      par: { r: (t) => [t, (t * t) / 2], t0: -2.2, t1: 2.2, box: [-3.2, 3.2, -0.8, 3.2], tex: "포물선 (t, t²/2)" },
      cyc: { r: (t) => [t - Math.sin(t), 1 - Math.cos(t)], t0: 0.05, t1: 2 * Math.PI - 0.05, box: [-0.5, 6.8, -2.5, 3.2], tex: "사이클로이드 (t − sin t, 1 − cos t)" },
      lem: { r: (t) => [(2 * Math.cos(t)) / (1 + Math.sin(t) ** 2), (2 * Math.sin(t) * Math.cos(t)) / (1 + Math.sin(t) ** 2)], t0: 0, t1: 2 * Math.PI, box: [-2.6, 2.6, -1.4, 1.4], tex: "렘니스케이트" },
    };
    const S = MKit.setup("card-m13-curvature", 0.62, draw);
    if (!S) return;
    const { k, v } = S;
    function draw() {
      const c = C(), Cu = CV[k.val("cv")], s = k.val("t") / 1000;
      const t = Cu.t0 + s * (Cu.t1 - Cu.t0), h = 1e-4;
      const p = Cu.r(t), pp = Cu.r(t + h), pm = Cu.r(t - h);
      const d1 = [(pp[0] - pm[0]) / (2 * h), (pp[1] - pm[1]) / (2 * h)];
      const d2 = [(pp[0] - 2 * p[0] + pm[0]) / (h * h), (pp[1] - 2 * p[1] + pm[1]) / (h * h)];
      const sp = Math.hypot(d1[0], d1[1]);
      const kap = (d1[0] * d2[1] - d1[1] * d2[0]) / sp ** 3; // 부호 있는 곡률
      const T = [d1[0] / sp, d1[1] / sp], N = [-T[1], T[0]];
      const [x0, x1, y0, y1] = Cu.box;
      const f = QSim.frame(v, { x0, x1, y0, y1, equal: true, pad: 22 });
      f.axes();
      const pts = []; for (let i = 0; i <= 600; i++) pts.push(Cu.r(Cu.t0 + (i / 600) * (Cu.t1 - Cu.t0)));
      f.path(pts, c.ink2, 2);
      if (Math.abs(kap) > 1e-3) {
        const R = 1 / kap, ctr = [p[0] + R * N[0], p[1] + R * N[1]];
        f.path(Array.from({ length: 181 }, (_, i) => [ctr[0] + Math.abs(R) * Math.cos((i * Math.PI) / 90), ctr[1] + Math.abs(R) * Math.sin((i * Math.PI) / 90)]), c.acc, 1.5, [5, 4]);
        f.dot(ctr[0], ctr[1], c.acc, 3);
        f.path([p, ctr], c.acc, 1, [2, 3]);
      }
      f.arrow(p[0], p[1], T[0], T[1], c.main, "T");
      f.arrow(p[0], p[1], N[0] * 0.8, N[1] * 0.8, c.warn, "N");
      f.dot(p[0], p[1], c.ink, 5);
      k.out(`${Cu.tex}, t = ${fmt(t, 3)}\n곡률 κ = ${fmt(kap, 4)}` + (Math.abs(kap) > 1e-3 ? ` · 접촉원 반지름 1/|κ| = ${fmt(1 / Math.abs(kap), 3)}` : " · 거의 직선이라 접촉원이 매우 큽니다") + ` · 속력 |r′| = ${fmt(sp, 3)}`);
    }
    S.redraw();
  })();

  /* ── 2. 푸앵카레 원판의 쌍곡 삼각형 ── */
  (() => {
    let f;
    const P = [[-0.45, -0.35], [0.55, -0.25], [0.05, 0.55]];
    const S = MKit.setup("card-m25-poincare", 0.8, draw);
    if (!S) return;
    const { k, v } = S;
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1]], dot = (a, b) => a[0] * b[0] + a[1] * b[1], crs = (a, b) => a[0] * b[1] - a[1] * b[0];
    /* p, q를 지나는 쌍곡 직선: 단위원에 수직인 원(중심 c, 반지름 r) 또는 지름(null) */
    const geo = (p, q) => {
      if (Math.abs(crs(p, q)) < 1e-6) return null;
      const n2 = dot(p, p), ps = [p[0] / n2, p[1] / n2];
      // p, q, p*를 지나는 원의 중심(외심)
      const ax = p[0], ay = p[1], bx = q[0], by = q[1], cx = ps[0], cy = ps[1];
      const D = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
      const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / D;
      const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / D;
      return { c: [ux, uy], r: Math.hypot(ax - ux, ay - uy) };
    };
    /* p에서 q 쪽으로 가는 접선의 단위벡터 */
    const tangent = (p, q) => {
      const G = geo(p, q);
      if (!G) { const d = sub(q, p), n = Math.hypot(d[0], d[1]); return [d[0] / n, d[1] / n]; }
      const rp = sub(p, G.c), rq = sub(q, G.c), s = crs(rp, rq) > 0 ? 1 : -1;
      const t = [-rp[1] * s, rp[0] * s], n = Math.hypot(t[0], t[1]); return [t[0] / n, t[1] / n];
    };
    const arc = (p, q) => {
      const G = geo(p, q);
      if (!G) return [p, q];
      const a0 = Math.atan2(p[1] - G.c[1], p[0] - G.c[0]); let a1 = Math.atan2(q[1] - G.c[1], q[0] - G.c[0]);
      const s = crs(sub(p, G.c), sub(q, G.c)) > 0 ? 1 : -1;
      let da = a1 - a0; if (s > 0 && da < 0) da += 2 * Math.PI; if (s < 0 && da > 0) da -= 2 * Math.PI;
      return Array.from({ length: 81 }, (_, i) => [G.c[0] + G.r * Math.cos(a0 + (da * i) / 80), G.c[1] + G.r * Math.sin(a0 + (da * i) / 80)]);
    };
    const hdist = (p, q) => { const d = sub(p, q); return Math.acosh(1 + (2 * dot(d, d)) / ((1 - dot(p, p)) * (1 - dot(q, q)))); };
    function draw() {
      const c = C();
      f = QSim.frame(v, { x0: -1.15, x1: 1.15, y0: -1.05, y1: 1.05, equal: true, pad: 8 });
      const g = v.g;
      g.save(); g.fillStyle = c.card; g.strokeStyle = c.ink3; g.lineWidth = 1.5; g.beginPath(); g.arc(f.X(0), f.Y(0), f.sx, 0, 7); g.fill(); g.stroke(); g.restore();
      if (k.val("euc")) f.path([P[0], P[1], P[2], P[0]], c.rule, 1, [4, 4]);
      // 꼭짓점을 지나는 쌍곡 직선 전체(경계까지)도 흐리게
      [[0, 1], [1, 2], [2, 0]].forEach(([i, j]) => {
        const G = geo(P[i], P[j]);
        if (G) {
          g.save(); g.beginPath(); g.arc(f.X(0), f.Y(0), f.sx, 0, 7); g.clip();
          g.strokeStyle = c.rule; g.lineWidth = 1; g.beginPath(); g.arc(f.X(G.c[0]), f.Y(G.c[1]), G.r * f.sx, 0, 7); g.stroke(); g.restore();
        }
        f.path(arc(P[i], P[j]), c.main, 2.5);
      });
      const ang = P.map((p, i) => { const a = tangent(p, P[(i + 1) % 3]), b = tangent(p, P[(i + 2) % 3]); return Math.acos(Math.max(-1, Math.min(1, dot(a, b)))); });
      P.forEach((p, i) => { f.dot(p[0], p[1], c.acc, 7); f.text("ABC"[i], p[0] + 0.04, p[1] + 0.05, c.ink); });
      const sum = ang[0] + ang[1] + ang[2], deg = (x) => fmt((x * 180) / Math.PI, 1);
      k.out(`각 A ${deg(ang[0])}°, B ${deg(ang[1])}°, C ${deg(ang[2])}° · 합 ${deg(sum)}°\n` +
        `넓이 = π − (각의 합) = ${fmt(Math.PI - sum, 4)} · 변의 쌍곡 길이 ${fmt(hdist(P[0], P[1]), 2)}, ${fmt(hdist(P[1], P[2]), 2)}, ${fmt(hdist(P[2], P[0]), 2)}`);
    }
    MKit.drag(S.cv, () => f, () => P, (i, x, y) => { const r = Math.hypot(x, y), m = 0.97; P[i] = r > m ? [(x / r) * m, (y / r) * m] : [x, y]; S.redraw(); });
    S.redraw();
  })();
})();
