/* 기계5 유체역학 3단원: 정상 속도장의 유선, 입자 운동, 대류 가속도 (03-01) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-field"); if (!S) return;
  const [cv] = S.$$("canvas");
  // 속도장과 편도함수 (정상 유동)
  const FIELDS = {
    stag: { n: "정체점 유동 u = kx, v = −ky", V: (x, y, k) => [k * x, -k * y], J: (x, y, k) => [[k, 0], [0, -k]] },
    rot: { n: "강체 회전 u = −ky, v = kx", V: (x, y, k) => [-k * y, k * x], J: (x, y, k) => [[0, -k], [k, 0]] },
    shear: { n: "전단 유동 u = ky, v = 0", V: (x, y, k) => [k * y, 0], J: (x, y, k) => [[0, k], [0, 0]] },
    noz: { n: "수렴 유동 u = k(1 + x), v = −ky", V: (x, y, k) => [k * (1 + x), -k * y], J: (x, y, k) => [[k, 0], [0, -k]] },
  };
  let parts = [];
  const seed = () => { parts = []; for (let i = 0; i < 60; i++) parts.push([Math.random() * 4 - 2, Math.random() * 4 - 2]); };
  function draw() {
    const c = QSim.col(), F = FIELDS[S.val("f")], k = S.val("k"), x0 = S.val("x"), y0 = S.val("y");
    const v = QSim.view(cv, 0.8), f = QSim.frame(v, { x0: -2, x1: 2, y0: -2, y1: 2, equal: true, pad: 20 }); f.axes({ noGrid: true });
    // 속도 화살표 격자
    for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) {
      const x = i * 0.45, y = j * 0.45, [u, w] = F.V(x, y, k), sp = Math.hypot(u, w), L = Math.min(0.35, 0.12 * sp);
      if (sp > 1e-6) f.arrow(x, y, (u / sp) * L, (w / sp) * L, c.rule);
    }
    parts.forEach(([x, y]) => f.dot(x, y, c.main, 2.5));
    // 고른 점의 속도와 가속도
    const [u, w] = F.V(x0, y0, k), J = F.J(x0, y0, k);
    const ax = u * J[0][0] + w * J[0][1], ay = u * J[1][0] + w * J[1][1];
    f.dot(x0, y0, c.ink, 5);
    f.arrow(x0, y0, u * 0.15, w * 0.15, c.acc, "V");
    f.arrow(x0, y0, ax * 0.05, ay * 0.05, c.warn, "a");
    S.out(`${F.n}, k = ${k} s⁻¹\n점 (${x0}, ${y0}) m: 속도 (u, v) = (${u.toFixed(2)}, ${w.toFixed(2)}) m/s, 속력 ${Math.hypot(u, w).toFixed(2)} m/s\n국소 가속도 0 (정상), 대류 가속도 (a_x, a_y) = (${ax.toFixed(2)}, ${ay.toFixed(2)}) m/s², 크기 ${Math.hypot(ax, ay).toFixed(2)} m/s²`);
  }
  const L = QSim.loop((dt) => {
    const F = FIELDS[S.val("f")], k = S.val("k");
    parts = parts.map(([x, y]) => { const n = 4, h = dt / n; for (let i = 0; i < n; i++) { const [u, w] = F.V(x, y, k); x += u * h * 0.5; y += w * h * 0.5; } return Math.abs(x) > 2.2 || Math.abs(y) > 2.2 ? [Math.random() * 4 - 2, Math.random() * 4 - 2] : [x, y]; });
    draw();
  }).watch(S.root);
  QSim.playButton(S.$(".play"), L);
  S.on(() => { seed(); draw(); }); QSim.redrawOn(draw); seed(); draw();
})();
