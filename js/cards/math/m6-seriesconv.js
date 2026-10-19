/* 수학6 탐구: 멱급수해의 부분합 — 수렴 반지름 안에서만 해에 붙는다 (에어리, arctan, 르장드르 Q₁) */
(() => {
  "use strict";
  const coefAiry = (N) => { const a = [1, 0, 0]; for (let n = 1; n + 2 <= N; n++) a[n + 2] = a[n - 1] / ((n + 2) * (n + 1)); return a; };
  const EQ = {
    airy: { tex: "y'' − ty = 0, y(0) = 1, y'(0) = 0", R: Infinity, sing: "특이점 없음",
      coef: coefAiry, exact: null, ylim: [-3, 6] },
    atan: { tex: "(1 + t²)y'' + 2ty' = 0, y = arctan t", R: 1, sing: "복소 특이점 ±i",
      coef: (N) => [...Array(N + 1).keys()].map((n) => (n % 2 ? ((n - 1) / 2) % 2 ? -1 / n : 1 / n : 0)), exact: Math.atan, ylim: [-2.5, 2.5] },
    leg: { tex: "(1 − t²)y'' − 2ty' + 2y = 0, y = (t/2)ln((1+t)/(1−t)) − 1", R: 1, sing: "실수 특이점 ±1",
      coef: (N) => [...Array(N + 1).keys()].map((n) => (n === 0 ? -1 : n % 2 ? 0 : 1 / (n - 1))), exact: (t) => (Math.abs(t) < 1 ? (t / 2) * Math.log((1 + t) / (1 - t)) - 1 : NaN), ylim: [-2, 4] },
  };
  const S = MKit.setup("card-m6-seriesconv", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  function airyExact(t) { // RK4 from 0
    let y = [1, 0], s = 0; const n = 400, h = t / n;
    for (let i = 0; i < n; i++) { y = QSim.rk4((tt, w) => [w[1], tt * w[0]], s, y, h); s += h; }
    return y[0];
  }
  function draw() {
    const c = QSim.col(), E = EQ[k.val("eq")], N = k.val("N"), a = E.coef(N);
    const P = (t) => { let s = 0, p = 1; for (let n = 0; n <= N; n++) { s += (a[n] || 0) * p; p *= t; } return s; };
    const ex = E.exact || airyExact;
    const f = QSim.frame(v, { x0: -2.5, x1: 2.5, y0: E.ylim[0], y1: E.ylim[1], pad: 26, xl: "t", yl: "y" });
    f.axes();
    if (isFinite(E.R)) { f.path([[-E.R, E.ylim[0]], [-E.R, E.ylim[1]]], c.warn, 1, [4, 4]); f.path([[E.R, E.ylim[0]], [E.R, E.ylim[1]]], c.warn, 1, [4, 4]); }
    const pts = []; for (let i = 0; i <= 300; i++) { const t = -2.5 + (5 * i) / 300; const y = ex(t); if (isFinite(y)) pts.push([t, y]); }
    f.path(pts.filter((p) => p[1] > E.ylim[0] - 1 && p[1] < E.ylim[1] + 1), c.main, 2.4, [6, 4]);
    f.fn((t) => Math.max(E.ylim[0] - 1, Math.min(E.ylim[1] + 1, P(t))), c.acc, 2);
    const e1 = Math.abs(P(0.5) - ex(0.5)), e2 = Math.abs(P(1.5) - ex(1.5));
    k.out(`${E.tex} · ${E.sing}, 수렴 반지름 ${isFinite(E.R) ? E.R : "∞"} (빨간 점선)\n${N}차까지의 부분합(노랑) vs 해(파란 점선): t = 0.5에서 오차 ${e1.toExponential(2)} · t = 1.5에서 ${isFinite(e2) ? e2.toExponential(2) : "해가 정의되지 않음"}`);
  }
  S.redraw();
})();
