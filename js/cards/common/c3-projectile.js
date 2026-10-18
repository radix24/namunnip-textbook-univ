/* 공통3 실습: 포물선 운동과 공기 저항 (02-03) */
(() => {
  "use strict";
  const S = QSim.card("lab-c3-projectile"); if (!S) return;
  const cv = S.$("canvas"), G = 9.8;
  let runs = [], t = 0;
  const sim = (v0, deg, k) => {
    const th = (deg * Math.PI) / 180, h = 0.002;
    const f = (_, s) => { const sp = Math.hypot(s[2], s[3]); return [s[2], s[3], -k * sp * s[2], -G - k * sp * s[3]]; };
    let y = [0, 0, v0 * Math.cos(th), v0 * Math.sin(th)], tt = 0, H = 0; const pts = [[0, 0, 0]];
    for (let i = 1; tt < 30; i++) {
      const n = QSim.rk4(f, tt, y, h);
      if (n[1] < 0) { const fr = y[1] / (y[1] - n[1]); pts.push([y[0] + fr * (n[0] - y[0]), 0, tt + fr * h]); break; }
      y = n; tt += h; H = Math.max(H, y[1]); if (i % 10 === 0) pts.push([y[0], y[1], tt]);
    }
    const e = pts[pts.length - 1]; return { pts, H, R: e[0], T: e[2] };
  };
  const at = (r, tt) => { const p = r.pts; if (tt >= r.T) return p[p.length - 1]; let i = Math.min(p.length - 1, Math.floor((tt / r.T) * (p.length - 1))); while (i > 0 && p[i][2] > tt) i--; while (i < p.length - 1 && p[i + 1][2] <= tt) i++; return p[i]; };
  function compute() {
    const v0 = S.val("v0"), d = S.val("deg"), k = S.val("k") / 1000;
    runs = [{ r: sim(v0, d, k), main: true, name: `${d}°` }];
    if (k > 0) runs.push({ r: sim(v0, d, 0), name: "저항 없음", dash: [5, 4] });
    if (S.val("cmp")) runs.push({ r: sim(v0, 45, k), name: "45°", acc: true });
    t = 0;
  }
  function draw() {
    const C = QSim.col(), v = QSim.view(cv, 0.55);
    const R = Math.max(10, ...runs.map((o) => o.r.R)) * 1.08, H = Math.max(3, ...runs.map((o) => o.r.H)) * 1.25;
    const f = QSim.frame(v, { x0: 0, x1: R, y0: 0, y1: Math.max(H, R * 0.2), equal: true, xl: "x (m)", yl: "y (m)" }); f.axes();
    runs.forEach((o) => {
      const col = o.main ? C.main : o.acc ? C.acc : C.ink3;
      f.path(o.r.pts.map((p) => [p[0], p[1]]), col, o.main ? 2.5 : 1.5, o.dash);
      const p = at(o.r, t); f.dot(p[0], p[1], col, o.main ? 6 : 4);
    });
    const m = runs[0].r, v0 = S.val("v0"), d = S.val("deg");
    const theo = (v0 * v0 * Math.sin((2 * d * Math.PI) / 180)) / G;
    let s = `${d}°: 도달 거리 ${m.R.toFixed(1)} m · 최고 높이 ${m.H.toFixed(1)} m · 비행 시간 ${m.T.toFixed(2)} s`;
    if (S.val("k") === 0) s += `\n이론값 R = v₀² sin2θ / g = ${theo.toFixed(1)} m`;
    else s += `\n공기 저항이 없을 때 ${runs[1].r.R.toFixed(1)} m → 저항으로 ${(100 * (1 - m.R / runs[1].r.R)).toFixed(0)}% 줄어듦`;
    const c45 = runs.find((o) => o.acc); if (c45) s += `\n같은 조건의 45°: ${c45.r.R.toFixed(1)} m`;
    S.out(s);
  }
  const L = QSim.loop((dt) => { t += dt; const T = Math.max(...runs.map((o) => o.r.T)); if (t >= T) { t = T; draw(); return false; } draw(); }).watch(S.root);
  const setBtn = QSim.playButton(S.$(".play"), L, () => { if (t >= Math.max(...runs.map((o) => o.r.T))) t = 0; });
  S.on(() => { L.stop(); setBtn(); compute(); t = 1e9; draw(); });
  QSim.redrawOn(draw); compute(); t = 1e9; draw();
})();
