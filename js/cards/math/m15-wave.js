/* 수학15 탐구: 파동(달랑베르)과 열(열핵)의 퍼짐 비교 — 유한 속도와 무한 속도 */
(() => {
  "use strict";
  const S = MKit.setup("card-m15-wave", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const b = (x) => (Math.abs(x) >= 1 ? 0 : (1 - x * x) ** 2);
  // G(x) = ∫_{-1}^x b, 전체 16/15
  const G = (x) => (x <= -1 ? 0 : x >= 1 ? 16 / 15 : x - (2 * x ** 3) / 3 + x ** 5 / 5 + 8 / 15);
  const heat = (x, t) => {
    if (t <= 0) return b(x);
    const M = 400; let s = 0;
    for (let i = 0; i < M; i++) { const y = -1 + ((i + 0.5) * 2) / M; s += b(y) * Math.exp(-((x - y) ** 2) / (4 * t)); }
    return (s * (2 / M)) / Math.sqrt(4 * Math.PI * t);
  };
  const MODE = {
    wd: { name: "파동: 처음 모양 f = 혹, 처음 속도 0", u: (x, t) => (b(x + t) + b(x - t)) / 2, f: b },
    wv: { name: "파동: 처음 모양 0, 처음 속도 g = 혹", u: (x, t) => (G(x + t) - G(x - t)) / 2, f: () => 0 },
    h: { name: "열: 처음 온도 f = 혹", u: heat, f: b },
  };
  function draw() {
    const c = QSim.col(), m = MODE[k.val("m")], t = k.val("t");
    const F = QSim.frame(v, { x0: -6, x1: 6, y0: -0.15, y1: 1.15, pad: 26, xl: "x", yl: "u" });
    F.axes();
    F.fn(m.f, c.rule, 1, [3, 3], 600);
    if (m !== MODE.h) { F.path([[-1 - t, -0.12], [-1 - t, 1.12]], c.acc, 1, [4, 4]); F.path([[1 + t, -0.12], [1 + t, 1.12]], c.acc, 1, [4, 4]); }
    F.fn((x) => m.u(x, t), m === MODE.h ? c.warn : c.main, 2.2, null, m === MODE.h ? 300 : 900);
    const u4 = m.u(4, t);
    const tail = m === MODE.h ? `x = 4의 값 ${u4 === 0 ? "0" : u4 < 1e-3 ? u4.toExponential(2) : fmt(u4, 4)} (t > 0이면 0이 아님: 무한 전파)` : `x = 4의 값 ${fmt(u4, 4)} · 0이 아닌 범위는 [−1 − t, 1 + t] = [${fmt(-1 - t, 2)}, ${fmt(1 + t, 2)}] 안 (t > 3이 되어야 x = 4에 닿음)`;
    k.out(`${m.name} · t = ${fmt(t, 2)} · u(0, t) = ${fmt(m.u(0, t), 4)}\n${tail}`);
  }
  S.redraw();
})();
