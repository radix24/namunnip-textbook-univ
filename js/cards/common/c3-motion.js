/* 공통3 실습: 직선 운동 그래프 (02-01) */
(() => {
  "use strict";
  const S = QSim.card("lab-c3-motion"); if (!S) return;
  const [c1, c2, c3] = S.$$("canvas");
  let t = 0; const TMAX = 6;
  const L = QSim.loop((dt) => { t += dt; if (t >= TMAX) { t = TMAX; draw(); return false; } draw(); }).watch(S.root);
  const pos = (tt) => S.val("x0") + S.val("v0") * tt + 0.5 * S.val("a") * tt * tt;
  const vel = (tt) => S.val("v0") + S.val("a") * tt;
  function draw() {
    const C = QSim.col();
    let lo = 0, hi = 0; for (let i = 0; i <= 60; i++) { const x = pos((i / 60) * TMAX); lo = Math.min(lo, x); hi = Math.max(hi, x); }
    lo = Math.floor(lo - 1); hi = Math.ceil(hi + 1);
    // 트랙
    let v = QSim.view(c1, 0.2), f = QSim.frame(v, { x0: lo, x1: hi, y0: -1, y1: 1, pad: 14 });
    f.path([[lo, 0], [hi, 0]], C.ink3, 1);
    for (let x = Math.ceil(lo); x <= hi; x += Math.max(1, Math.round((hi - lo) / 10))) f.text(String(x), x, -0.85, C.ink3, "center");
    const x = pos(t); v.g.fillStyle = C.main; v.g.fillRect(f.X(x) - 10, f.Y(0.55), 20, f.Y(0) - f.Y(0.55));
    f.arrow(x, 0.75, vel(t) * (hi - lo) / 40, 0, C.acc, "v");
    // x-t
    v = QSim.view(c2, 0.42); f = QSim.frame(v, { x0: 0, x1: TMAX, y0: lo, y1: hi, xl: "t (s)", yl: "x (m)" }); f.axes();
    f.fn(pos, C.rule, 1.5, [4, 4]); const pts = []; for (let i = 0; i <= 200; i++) { const tt = (i / 200) * t; pts.push([tt, pos(tt)]); } f.path(pts, C.main, 2.5); f.dot(t, x, C.main);
    // 접선 (기울기 = 속도)
    f.path([[t - 0.8, x - 0.8 * vel(t)], [t + 0.8, x + 0.8 * vel(t)]], C.acc, 1.5);
    // v-t
    const vs = [vel(0), vel(TMAX)], vlo = Math.min(-1, ...vs) - 0.5, vhi = Math.max(1, ...vs) + 0.5;
    v = QSim.view(c3, 0.42); f = QSim.frame(v, { x0: 0, x1: TMAX, y0: vlo, y1: vhi, xl: "t (s)", yl: "v (m/s)" }); f.axes();
    const g = v.g; g.save(); g.fillStyle = C.soft; g.globalAlpha = 0.55; g.beginPath(); g.moveTo(f.X(0), f.Y(0));
    for (let i = 0; i <= 100; i++) { const tt = (i / 100) * t; g.lineTo(f.X(tt), f.Y(vel(tt))); } g.lineTo(f.X(t), f.Y(0)); g.closePath(); g.fill(); g.restore();
    f.fn(vel, C.rule, 1.5, [4, 4]); f.path([[0, vel(0)], [t, vel(t)]], C.main, 2.5); f.dot(t, vel(t), C.main);
    S.out(`t = ${t.toFixed(2)} s   x = ${x.toFixed(2)} m   v = ${vel(t).toFixed(2)} m/s   a = ${S.val("a").toFixed(1)} m/s²\n` +
      `색칠한 넓이(부호 포함) = ${(x - S.val("x0")).toFixed(2)} m = 변위 x(t) − x(0)`);
  }
  QSim.playButton(S.$(".play"), L, () => { if (t >= TMAX) t = 0; });
  S.$(".reset").addEventListener("click", () => { L.stop(); t = 0; draw(); S.$(".play").textContent = "재생"; });
  S.on(() => { if (!L.running) draw(); });
  QSim.redrawOn(draw); draw();
})();
