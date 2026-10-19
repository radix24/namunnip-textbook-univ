/* 수학22 탐구: 단위 구 위의 측지 삼각형 — 내각 합 − π와 넓이(입체각 공식)가 같음(가우스-보네) */
(() => {
  "use strict";
  const S = MKit.setup("card-m22-sphtri", 0.8, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const D = Math.PI / 180;
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const scl = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const nrm = (a) => scl(a, 1 / Math.hypot(...a));
  const pt = (lat, lon) => [Math.cos(lat * D) * Math.cos(lon * D), Math.cos(lat * D) * Math.sin(lon * D), Math.sin(lat * D)];
  function angleAt(P, Q, R) {
    const tq = nrm(sub(Q, scl(P, dot(P, Q)))), tr = nrm(sub(R, scl(P, dot(P, R))));
    return Math.acos(Math.max(-1, Math.min(1, dot(tq, tr))));
  }
  function arc(P, Q, n = 60) {
    const w = Math.acos(Math.max(-1, Math.min(1, dot(P, Q)))), s = Math.sin(w), out = [];
    for (let i = 0; i <= n; i++) { const t = i / n; out.push(s < 1e-9 ? P : [0, 1, 2].map((j) => (Math.sin((1 - t) * w) * P[j] + Math.sin(t * w) * Q[j]) / s)); }
    return out;
  }
  function draw() {
    const c = QSim.col(), latB = k.val("latB"), latC = k.val("latC"), lon = k.val("lon"), yaw = k.val("yaw") * D, tilt = 20 * D;
    const A = [0, 0, 1], B = pt(latB, 0), C = pt(latC, lon);
    const view = (p) => { const x = p[0] * Math.cos(yaw) + p[1] * Math.sin(yaw), y = -p[0] * Math.sin(yaw) + p[1] * Math.cos(yaw); return [y, p[2] * Math.cos(tilt) - x * Math.sin(tilt), p[2] * Math.sin(tilt) + x * Math.cos(tilt)]; };
    const F = QSim.frame(v, { x0: -1.25, x1: 1.25, y0: -1.15, y1: 1.15, pad: 4, equal: true, xl: "", yl: "" });
    const seg = (pts, color, w) => {
      let run = [], front = null;
      const flush = () => { if (run.length > 1) F.path(run, color, w, front ? null : [3, 4]); run = []; };
      pts.forEach((p) => { const q = view(p), f = q[2] >= 0; if (front !== null && f !== front) { flush(); } front = f; run.push([q[0], q[1]]); });
      flush();
    };
    const circ = []; for (let i = 0; i <= 120; i++) circ.push([Math.cos((2 * Math.PI * i) / 120), Math.sin((2 * Math.PI * i) / 120)]);
    F.path(circ, c.ink3, 1.2);
    for (let m = 0; m < 360; m += 30) { const pts = []; for (let la = -90; la <= 90; la += 5) pts.push(pt(la, m)); seg(pts, c.rule, 0.8); }
    for (let la = -60; la <= 60; la += 30) { const pts = []; for (let lo = 0; lo <= 360; lo += 5) pts.push(pt(la, lo)); seg(pts, c.rule, 0.8); }
    [[A, B], [B, C], [C, A]].forEach(([P, Q]) => seg(arc(P, Q), c.main, 2.2));
    [[A, "A"], [B, "B"], [C, "C"]].forEach(([P, name]) => { const q = view(P); F.dot(q[0], q[1], q[2] >= 0 ? c.acc : c.ink3, 4); F.text(name, q[0] + 0.05, q[1] + 0.05, c.ink, "left"); });
    const a = angleAt(A, B, C), b = angleAt(B, C, A), g = angleAt(C, A, B), sum = a + b + g;
    const area = 2 * Math.atan2(Math.abs(dot(A, cross(B, C))), 1 + dot(A, B) + dot(B, C) + dot(C, A));
    k.out(`내각 A = ${fmt(a / D, 2)}°, B = ${fmt(b / D, 2)}°, C = ${fmt(g / D, 2)}° · 합 ${fmt(sum / D, 2)}°\n` +
      `내각 합 − π = ${fmt(sum - Math.PI, 4)} · 삼각형 넓이(입체각 공식) = ${fmt(area, 4)} · 구 전체 넓이 4π의 ${fmt((100 * area) / (4 * Math.PI), 2)}%`);
  }
  S.redraw();
})();
