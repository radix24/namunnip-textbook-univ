/* 수학3 탐구: T(n) = aT(n/b) + n^d 의 재귀 나무 — 층별 비용 a^j (n/b^j)^d 막대 */
(() => {
  "use strict";
  const S = MKit.setup("card-m3-master", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  function draw() {
    const c = QSim.col(), a = k.val("a"), b = k.val("b"), d = k.val("d"), E = k.val("E"), n = Math.pow(b, E);
    const levels = []; for (let j = 0; j <= E; j++) levels.push(Math.pow(a, j) * Math.pow(n / Math.pow(b, j), d));
    const total = levels.reduce((s, x) => s + x, 0), top = Math.max(...levels) * 1.1;
    const f = QSim.frame(v, { x0: -0.6, x1: E + 0.6, y0: 0, y1: top, pad: 40, xl: "층 j", yl: "비용" });
    f.axes();
    const q = a / Math.pow(b, d);
    levels.forEach((x, j) => f.path([[j, 0], [j, x]], j === 0 ? c.acc : j === E ? c.warn : c.main, Math.max(4, Math.min(30, f.sx * 0.6))));
    const crit = Math.log(a) / Math.log(b);
    const cas = Math.abs(q - 1) < 1e-9 ? `경우 2 (a = b^d): Θ(n^${fmt(d, 2)} log n)` : q < 1 ? `경우 1 (a < b^d): Θ(n^${fmt(d, 2)}) — 맨 위층(노랑)이 지배` : `경우 3 (a > b^d): Θ(n^log_b a) = Θ(n^${fmt(crit, 3)}) — 잎(빨강)이 지배`;
    k.out(`T(n) = ${a}T(n/${b}) + n^${fmt(d, 2)}, n = ${b}^${E} = ${fmt(n, 0)} · 층 비용의 공비 a/b^d = ${fmt(q, 3)}\n${cas} · 층 합계 ${total.toExponential(3)}`);
  }
  S.redraw();
})();
