/* 수학10 탐구: 여러 실수의 연분수와 수렴분수 — 오차 |x − p/q| 와 1/q² */
(() => {
  "use strict";
  const S = MKit.setup("card-m10-cf", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const sq = (n) => { const a0 = Math.floor(Math.sqrt(n)); let m = 0, d = 1, a = a0; const r = [a0]; for (let i = 0; i < 14; i++) { m = d * a - m; d = (n - m * m) / d; a = Math.floor((a0 + m) / d); r.push(a); } return r; };
  const X = {
    pi: { name: "π", val: Math.PI, cf: [3, 7, 15, 1, 292, 1, 1, 1, 2, 1, 3, 1] },
    e: { name: "e", val: Math.E, cf: [2, 1, 2, 1, 1, 4, 1, 1, 6, 1, 1, 8] },
    r2: { name: "√2", val: Math.SQRT2, cf: sq(2) },
    r7: { name: "√7", val: Math.sqrt(7), cf: sq(7) },
    phi: { name: "황금비", val: (1 + Math.sqrt(5)) / 2, cf: Array(13).fill(1) },
    q: { name: "67/29", val: 67 / 29, cf: [2, 3, 4, 2] },
  };
  function draw() {
    const c = QSim.col(), x = X[k.val("x")], N = Math.min(k.val("n"), x.cf.length);
    const conv = []; let h0 = 1, h1 = x.cf[0], k0 = 0, k1 = 1; conv.push([h1, k1]);
    for (let i = 1; i < N; i++) { const a = x.cf[i]; [h0, h1] = [h1, a * h1 + h0]; [k0, k1] = [k1, a * k1 + k0]; conv.push([h1, k1]); }
    const err = conv.map(([p, q]) => Math.abs(x.val - p / q));
    const F = QSim.frame(v, { x0: -0.5, x1: 12.5, y0: -16, y1: 0.5, pad: 30, xl: "n", yl: "log₁₀ 오차" });
    F.axes();
    F.path(conv.map(([, q], i) => [i, -2 * Math.log10(q)]), c.ink3, 1.2, [5, 4]);
    conv.forEach(([p, q], i) => { const e = err[i]; if (e > 1e-16) F.dot(i, Math.log10(e), (x.val - p / q) > 0 ? c.main : c.warn, 5); else F.dot(i, -15.8, c.acc, 5); });
    const last = conv[N - 1];
    k.out(`${x.name} = [${x.cf[0]}; ${x.cf.slice(1, N).join(", ")}${N < x.cf.length ? ", …" : ""}] · 수렴분수 ${conv.map(([p, q]) => (q === 1 ? p : `${p}/${q}`)).join(", ")}\n${N}번째 ${last[0]}/${last[1]}: 오차 ${err[N - 1] < 1e-15 ? "0 (정확히 같음)" : err[N - 1].toExponential(2)}, 1/q² = ${(1 / (last[1] * last[1])).toExponential(2)} · 파랑은 x보다 작음, 빨강은 큼, 점선은 1/q²`);
  }
  S.redraw();
})();
