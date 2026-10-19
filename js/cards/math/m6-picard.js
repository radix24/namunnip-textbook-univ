/* 수학6 탐구: 피카르 반복 y_{n+1}(t) = y0 + ∫ f(s, y_n(s)) ds 를 수치 적분으로 되풀이 */
(() => {
  "use strict";
  const EQ = {
    exp: { f: (t, y) => y, y0: 1, T: 2, ymax: 8, tex: "y' = y, y(0) = 1 (해 eᵗ)" },
    gauss: { f: (t, y) => 2 * t * (1 + y), y0: 0, T: 1.5, ymax: 9, tex: "y' = 2t(1 + y), y(0) = 0 (해 e^(t²) − 1)" },
    ric: { f: (t, y) => t + y * y, y0: 0, T: 1.4, ymax: 3, tex: "y' = t + y², y(0) = 0 (공식 해 없음)" },
  };
  const S = MKit.setup("card-m6-picard", 0.62, draw);
  if (!S) return;
  const { k, v } = S;
  const M = 600;
  function draw() {
    const c = QSim.col(), E = EQ[k.val("eq")], n = k.val("n"), dt = E.T / M;
    const ts = [...Array(M + 1).keys()].map((i) => i * dt);
    // 기준해: RK4
    const ex = [E.y0]; let y = [E.y0];
    for (let i = 0; i < M; i++) { y = QSim.rk4((t, yy) => [E.f(t, yy[0])], ts[i], y, dt); ex.push(y[0]); }
    // 피카르 반복
    const its = [ts.map(() => E.y0)];
    for (let j = 0; j < n; j++) {
      const prev = its[its.length - 1], next = [E.y0];
      let acc = 0;
      for (let i = 1; i <= M; i++) { acc += 0.5 * dt * (E.f(ts[i - 1], prev[i - 1]) + E.f(ts[i], prev[i])); next.push(E.y0 + acc); }
      its.push(next);
    }
    const f = QSim.frame(v, { x0: 0, x1: E.T, y0: Math.min(0, E.y0) - 0.2, y1: E.ymax, pad: 28, xl: "t", yl: "y" });
    f.axes();
    const clip = (arr) => ts.map((t, i) => [t, Math.min(E.ymax * 1.2, arr[i])]);
    its.forEach((arr, j) => f.path(clip(arr), j === its.length - 1 ? c.warn : c.ink3, j === its.length - 1 ? 2.2 : 1));
    f.path(clip(ex), c.main, 1.6, [5, 4]);
    const err = Math.max(...its[its.length - 1].map((val, i) => Math.abs(val - ex[i])));
    const errHalf = Math.max(...its[its.length - 1].slice(0, M / 2 + 1).map((val, i) => Math.abs(val - ex[i])));
    k.out(`${E.tex} · 반복 ${n}번 (빨강 = y_${n}, 회색 = 앞의 반복, 파란 점선 = 실제 해)\n`
      + `구간 [0, ${E.T}]에서 최대 오차 ${err.toExponential(2)} · 앞 절반 [0, ${E.T / 2}]에서 ${errHalf.toExponential(2)}`);
  }
  S.redraw();
})();
