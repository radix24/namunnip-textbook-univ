/* 공통3 실습: 줄의 정상파 (09-03). 줄 길이 1 m */
(() => {
  "use strict";
  const S = QSim.card("lab-c3-standing"); if (!S) return;
  const cv = S.$("canvas"), LEN = 1;
  let ph = 0;
  function draw() {
    const C = QSim.col(), v = QSim.view(cv, 0.45), n = S.val("n"), T = S.val("T"), mu = S.val("mu") / 1000;
    const vel = Math.sqrt(T / mu), lam = (2 * LEN) / n, fr = vel / lam;
    const f = QSim.frame(v, { x0: 0, x1: LEN, y0: -1.25, y1: 1.25, pad: 14, xl: "x (m)" }); f.axes({ noGrid: true });
    const k = (2 * Math.PI) / lam, A = 0.5;
    f.fn((x) => 2 * A * Math.sin(k * x), C.rule, 1, [3, 3]); f.fn((x) => -2 * A * Math.sin(k * x), C.rule, 1, [3, 3]);
    if (S.val("trav")) {
      f.fn((x) => A * Math.sin(k * x - ph), C.acc, 1.5, [6, 4]);
      f.fn((x) => A * Math.sin(k * x + ph), C.ink3, 1.5, [6, 4]);
    }
    f.fn((x) => 2 * A * Math.sin(k * x) * Math.cos(ph), C.main, 3);
    for (let j = 0; j <= n; j++) f.dot((j * LEN) / n, 0, C.warn, 4);
    S.out(`파동 속력 v = √(T/μ) = ${vel.toFixed(1)} m/s   파장 λ = 2L/n = ${lam.toFixed(3)} m\n진동수 f = n·v/(2L) = ${fr.toFixed(1)} Hz (기본 진동수 ${(vel / 2).toFixed(1)} Hz의 ${n}배)   마디 ${n + 1}개 (빨간 점)\n화면의 진동은 실제보다 매우 느리게 보여 줍니다.`);
  }
  const L = QSim.loop((dt) => { ph += dt * 2 * Math.PI * 0.6; draw(); }).watch(S.root);
  QSim.playButton(S.$(".play"), L);
  S.on(() => { if (!L.running) draw(); });
  QSim.redrawOn(draw); draw();
  if (!QSim.reduce) { L.start(); S.$(".play").textContent = "멈춤"; }
})();
