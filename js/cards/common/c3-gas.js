/* 공통3 실습: 2차원 이상 기체 상자 (10-02). 단위: k = m = 1, 상자 높이 1 */
(() => {
  "use strict";
  const S = QSim.card("lab-c3-gas"); if (!S) return;
  const cv = S.$("canvas");
  let P = [], Tcur = 1, imp = 0, tacc = 0, pMeas = NaN, hist = [];
  const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const init = () => {
    const N = S.val("N"), w = S.val("w"), T = S.val("T"); Tcur = T;
    P = Array.from({ length: N }, () => ({ x: Math.random() * w, y: Math.random(), vx: gauss() * Math.sqrt(T), vy: gauss() * Math.sqrt(T) }));
    imp = 0; tacc = 0; pMeas = NaN; hist = [];
  };
  const retemp = () => { const T = S.val("T"), s = Math.sqrt(T / Tcur); P.forEach((p) => { p.vx *= s; p.vy *= s; }); Tcur = T; imp = 0; tacc = 0; hist = []; };
  function step(dt) {
    const w = S.val("w");
    P.forEach((p) => {
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.x < 0) { p.x = -p.x; p.vx = -p.vx; imp += 2 * Math.abs(p.vx); }
      if (p.x > w) { p.x = 2 * w - p.x; p.vx = -Math.abs(p.vx); imp += 2 * Math.abs(p.vx); }
      if (p.y < 0) { p.y = -p.y; p.vy = -p.vy; imp += 2 * Math.abs(p.vy); }
      if (p.y > 1) { p.y = 2 - p.y; p.vy = -Math.abs(p.vy); imp += 2 * Math.abs(p.vy); }
    });
    tacc += dt;
    if (tacc > 0.5) { hist.push(imp / (tacc * 2 * (w + 1))); if (hist.length > 12) hist.shift(); pMeas = hist.reduce((a, b) => a + b, 0) / hist.length; imp = 0; tacc = 0; }
  }
  function draw() {
    const C = QSim.col(), v = QSim.view(cv, 0.62), w = S.val("w");
    const f = QSim.frame(v, { x0: -0.05, x1: 1.65, y0: -0.05, y1: 1.05, equal: true, pad: 6 });
    const g = v.g; g.strokeStyle = C.ink2; g.lineWidth = 2; g.strokeRect(f.X(0), f.Y(1), f.X(w) - f.X(0), f.Y(0) - f.Y(1));
    g.fillStyle = C.ink3; g.fillRect(f.X(w), f.Y(1), 6, f.Y(0) - f.Y(1));
    const vt = Math.sqrt(2 * Tcur);
    P.forEach((p) => { const sp = Math.hypot(p.vx, p.vy); g.fillStyle = sp > 1.5 * vt ? C.warn : sp > vt ? C.acc : C.main; g.beginPath(); g.arc(f.X(p.x), f.Y(p.y), 2.6, 0, 7); g.fill(); });
    const N = S.val("N"), A = w * 1, th = (N * Tcur) / A;
    let ke = 0; P.forEach((p) => { ke += 0.5 * (p.vx * p.vx + p.vy * p.vy); });
    S.out(`분자 수 N = ${N}, 온도 T = ${Tcur.toFixed(1)}, 넓이 A = ${A.toFixed(2)}\n분자 하나의 평균 운동 에너지 = ${(ke / N).toFixed(2)} (2차원 이론 kT = ${Tcur.toFixed(2)})\n` +
      (isNaN(pMeas) ? "압력을 재는 중… (재생하면 벽에 부딪힌 충격량을 모아 계산)" : `잰 압력 p = ${pMeas.toFixed(1)}   이론 NkT/A = ${th.toFixed(1)}   비 ${(pMeas / th).toFixed(2)}`));
  }
  const L = QSim.loop((dt) => { const n = 4; for (let i = 0; i < n; i++) step(dt / n); draw(); }).watch(S.root);
  QSim.playButton(S.$(".play"), L);
  S.$("[name=N]").addEventListener("input", () => { init(); });
  S.$("[name=T]").addEventListener("input", retemp);
  S.$("[name=w]").addEventListener("input", () => { const w = S.val("w"); P.forEach((p) => { if (p.x > w) p.x = w * Math.random(); }); imp = 0; tacc = 0; hist = []; pMeas = NaN; });
  S.on(() => { if (!L.running) draw(); });
  QSim.redrawOn(draw); init(); draw();
})();
