/* 공통4 실습: RC 회로의 충전과 방전 (05-03) */
(() => {
  "use strict";
  const S = QSim.card("lab-c4-rc"); if (!S) return;
  const cv = S.$("canvas");
  let q = 0, t = 0, mode = "charge", hist = [], q0 = 0;
  const P = () => { const R = S.val("R") * 1e3, C = S.val("C") * 1e-6, eps = S.val("eps"); return { R, C, eps, tau: R * C }; };
  function draw() {
    const Cc = QSim.col(), v = QSim.view(cv, 0.55), p = P();
    const f = QSim.frame(v, { x0: 0, x1: 6, y0: -0.05, y1: 1.08, xl: "t / τ", yl: "" }); f.axes();
    f.fn((x) => 1 - Math.exp(-x), Cc.rule, 1, [4, 4]); f.fn((x) => Math.exp(-x), Cc.rule, 1, [4, 4]);
    f.path(hist.map((h) => [h[0] / p.tau, h[1] / (p.C * p.eps)]), Cc.main, 2.5);
    f.path(hist.map((h) => [h[0] / p.tau, Math.abs(h[2]) / (p.eps / p.R)]), Cc.acc, 2);
    f.path([[1, -0.05], [1, 1.05]], Cc.ink3, 1, [2, 3]); f.text("τ", 1.05, 1.0, Cc.ink3);
    const Vc = q / p.C, i = mode === "charge" ? (p.eps - Vc) / p.R : -Vc / p.R;
    S.out(`τ = RC = ${p.tau.toPrecision(3)} s   (화면은 τ가 약 1.5초가 되도록 빠르기를 맞춤)\n` +
      `${mode === "charge" ? "충전" : "방전"} 중  t = ${t.toPrecision(3)} s = ${(t / p.tau).toFixed(2)}τ\n` +
      `축전기 전압 ${Vc.toFixed(2)} V (${(100 * Vc / p.eps).toFixed(1)}%)   전류 ${(Math.abs(i) * 1e3).toPrecision(3)} mA\n` +
      `파란 선: 축전기 전압/ε, 주황 선: 전류/(ε/R), 점선: 이론 1 − e^(−t/τ), e^(−t/τ)`);
  }
  const L = QSim.loop((dt) => {
    const p = P(), sim = dt * (p.tau / 1.5), n = 20, h = sim / n;
    for (let k = 0; k < n; k++) { const i = mode === "charge" ? (p.eps - q / p.C) / p.R : -(q / p.C) / p.R; q += i * h; t += h; }
    const i = mode === "charge" ? (p.eps - q / p.C) / p.R : -(q / p.C) / p.R;
    hist.push([t, q, i]); draw();
    if (t > 6 * p.tau) return false;
  }).watch(S.root);
  const setBtn = QSim.playButton(S.$(".play"), L);
  const start = (m) => { mode = m; t = 0; hist = []; q0 = q; if (m === "charge") q = 0; else q = P().C * P().eps; L.stop(); L.start(); setBtn(); };
  S.$(".chg").addEventListener("click", () => start("charge"));
  S.$(".dis").addEventListener("click", () => start("discharge"));
  S.on(() => { L.stop(); setBtn(); q = 0; t = 0; hist = []; mode = "charge"; draw(); });
  QSim.redrawOn(draw); draw();
})();
