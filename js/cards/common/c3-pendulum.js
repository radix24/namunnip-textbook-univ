/* 공통3 실습: 진폭이 큰 진자 (09-01) */
(() => {
  "use strict";
  const S = QSim.card("lab-c3-pendulum"); if (!S) return;
  const [c1, c2] = S.$$("canvas"), G = 9.8;
  let a = [0, 0], b = [0, 0], t = 0, hist = [], Tex = 0;
  const w2 = () => G / S.val("L");
  const exactPeriod = () => { // 정지 상태에서 놓아 처음으로 θ = 0이 될 때까지 = T/4
    let s = [(S.val("th") * Math.PI) / 180, 0], tt = 0; const h = 0.0005 * Math.sqrt(S.val("L"));
    while (s[0] > 0 && tt < 60) { const n = QSim.rk4((_, y) => [y[1], -w2() * Math.sin(y[0])], 0, s, h); if (n[0] <= 0) { tt += h * (s[0] / (s[0] - n[0])); break; } s = n; tt += h; }
    return 4 * tt;
  };
  const reset = () => { const q = (S.val("th") * Math.PI) / 180; a = [q, 0]; b = [q, 0]; t = 0; hist = []; Tex = exactPeriod(); };
  function draw() {
    const C = QSim.col(), Lm = S.val("L");
    let v = QSim.view(c1, 0.55), f = QSim.frame(v, { x0: -2.2, x1: 2.2, y0: -2.2, y1: 0.3, equal: true, pad: 6 });
    f.path([[-0.4, 0], [0.4, 0]], C.ink3, 3);
    const bob = (q, col, dash) => { const x = Lm * Math.sin(q), y = -Lm * Math.cos(q); f.path([[0, 0], [x, y]], col, 1.5, dash); f.dot(x, y, col, 9); };
    if (S.val("ghost")) bob(b[0], C.ink3, [4, 3]);
    bob(a[0], C.main);
    const A = S.val("th");
    v = QSim.view(c2, 0.36); f = QSim.frame(v, { x0: Math.max(0, t - 10), x1: Math.max(10, t), y0: -Math.max(10, A) * 1.15, y1: Math.max(10, A) * 1.15, xl: "t (s)", yl: "θ (°)" }); f.axes();
    if (S.val("ghost")) f.path(hist.map((p) => [p[0], p[2]]), C.ink3, 1.5, [4, 3]);
    f.path(hist.map((p) => [p[0], p[1]]), C.main, 2);
    const T0 = 2 * Math.PI * Math.sqrt(Lm / G), q0 = (A * Math.PI) / 180;
    S.out(`진폭 ${A}°, 길이 ${Lm.toFixed(2)} m\n실제 주기(수치 계산) ${Tex.toFixed(3)} s   작은 진폭 공식 2π√(L/g) = ${T0.toFixed(3)} s   비 ${(Tex / T0).toFixed(3)}\n근사식 1 + θ₀²/16 = ${(1 + q0 * q0 / 16).toFixed(3)}`);
  }
  const L = QSim.loop((dt) => {
    const n = 20, h = dt / n;
    for (let i = 0; i < n; i++) {
      a = QSim.rk4((_, y) => [y[1], -w2() * Math.sin(y[0])], 0, a, h);
      b = QSim.rk4((_, y) => [y[1], -w2() * y[0]], 0, b, h);
    }
    t += dt; hist.push([t, (a[0] * 180) / Math.PI, (b[0] * 180) / Math.PI]); if (hist.length > 900) hist.shift();
    draw();
  }).watch(S.root);
  const setBtn = QSim.playButton(S.$(".play"), L);
  S.$(".reset").addEventListener("click", () => { L.stop(); setBtn(); reset(); draw(); });
  S.on(() => { L.stop(); setBtn(); reset(); draw(); });
  QSim.redrawOn(draw); reset(); draw();
})();
