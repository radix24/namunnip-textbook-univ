/* 수학6 탐구: 방향장과 해 곡선 — 점을 누르면 그 점을 지나는 해를 RK4로 앞뒤로 그린다 */
(() => {
  "use strict";
  const EQ = {
    logi: { f: (t, y) => y * (1 - y), box: [0, 8, -0.5, 1.6], tex: "y' = y(1 − y) (로지스틱)" },
    lin: { f: (t, y) => -2 * y + Math.exp(-t), box: [0, 5, -1, 1.5], tex: "y' = −2y + e^(−t) (선형)" },
    ric: { f: (t, y) => t * t + y * y, box: [-2, 2, -2, 2], tex: "y' = t² + y² (공식 해 없음)" },
    cube: { f: (t, y) => 3 * Math.cbrt(y * y), box: [-2, 2, -2, 4], tex: "y' = 3y^(2/3) (유일성 실패)" },
  };
  let f, seeds = [[0, 0.1]], lastEq = "";
  const S = MKit.setup("card-m6-slope", 0.65, draw);
  if (!S) return;
  const { k, v, cv } = S;
  function curve(E, t0, y0, dir) {
    const [a, b, c0, d] = E.box, pts = [[t0, y0]], h = 0.01 * dir;
    let t = t0, y = [y0];
    for (let i = 0; i < 2000; i++) {
      y = QSim.rk4((tt, yy) => [E.f(tt, yy[0])], t, y, h); t += h;
      if (!isFinite(y[0]) || t < a || t > b || y[0] < c0 - 2 || y[0] > d + 2) break;
      pts.push([t, y[0]]);
    }
    return pts;
  }
  function draw() {
    const c = QSim.col(), key = k.val("eq"), E = EQ[key];
    if (key !== lastEq) { seeds = key === "logi" ? [[0, 0.1]] : key === "lin" ? [[0, 0]] : key === "cube" ? [[0, 0]] : [[0, 0]]; lastEq = key; }
    const [a, b, c0, d] = E.box;
    f = QSim.frame(v, { x0: a, x1: b, y0: c0, y1: d, pad: 26, xl: "t", yl: "y" });
    f.axes();
    const nx = 22, ny = 14, g = v.g;
    g.save(); g.strokeStyle = c.ink3; g.lineWidth = 1;
    for (let i = 0; i <= nx; i++) for (let j = 0; j <= ny; j++) {
      const t = a + ((b - a) * i) / nx, y = c0 + ((d - c0) * j) / ny, s = E.f(t, y);
      const dx = 1, dy = s * f.sy / f.sx, L = Math.hypot(dx, dy), len = 7;
      g.beginPath(); g.moveTo(f.X(t) - (len * dx) / L, f.Y(y) + (len * dy) / L); g.lineTo(f.X(t) + (len * dx) / L, f.Y(y) - (len * dy) / L); g.stroke();
    }
    g.restore();
    seeds.forEach(([t0, y0], i) => {
      const col = i === seeds.length - 1 ? c.warn : c.main;
      f.path(curve(E, t0, y0, 1), col, 2); f.path(curve(E, t0, y0, -1), col, 2); f.dot(t0, y0, col, 5);
    });
    const [t0, y0] = seeds[seeds.length - 1];
    k.out(`${E.tex} · 마지막으로 찍은 점 (${MKit.fmt(t0, 2)}, ${MKit.fmt(y0, 2)}) · 그 점의 기울기 ${MKit.fmt(E.f(t0, y0), 3)}\n그림을 누르면 그 점을 지나는 해 곡선이 더해집니다 (최근 6개)`);
  }
  cv.addEventListener("pointerdown", (e) => { if (!f) return; const [t, y] = MKit.posOf(cv, f, e); seeds.push([t, y]); if (seeds.length > 6) seeds.shift(); S.redraw(); });
  S.redraw();
})();
