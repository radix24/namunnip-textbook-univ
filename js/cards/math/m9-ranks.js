/* 수학9 탐구: 이상값 하나와 두 검정 — 합동 t 검정 vs 윌콕슨 순위합 정확 검정 (6 대 6) */
(() => {
  "use strict";
  const S = MKit.setup("card-m9-ranks", 0.45, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const A0 = [12.1, 13.4, 11.8, 14.0, 12.9, 13.1], B0 = [10.2, 11.5, 10.9, 12.0, 11.1, 10.6];
  const sums = []; (function rec(start, left, s) { if (!left) { sums.push(s); return; } for (let r = start; r <= 12; r++) rec(r + 1, left - 1, s + r); })(1, 6, 0);
  function draw() {
    const c = QSim.col(), out = k.val("x"), shift = k.val("d");
    const A = A0.slice(); A[3] = out; const B = B0.map((x) => x + shift);
    const all = A.map((x) => [x, 0]).concat(B.map((x) => [x, 1])).sort((p, q) => p[0] - q[0]);
    const W = all.reduce((s, [x, gidx], i) => s + (gidx === 0 ? i + 1 : 0), 0), mu = 39;
    const pw = sums.filter((s) => Math.abs(s - mu) >= Math.abs(W - mu) - 1e-9).length / sums.length;
    const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length, va = (a) => { const m = mean(a); return a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1); };
    const sp = Math.sqrt((5 * va(A) + 5 * va(B)) / 10), t = (mean(A) - mean(B)) / (sp * Math.sqrt(1 / 3)), pt = 2 * (1 - M9.tCdf(Math.abs(t), 10));
    const lo = Math.min(...all.map((p) => p[0])) - 1, hi = Math.max(...all.map((p) => p[0])) + 1;
    const F = QSim.frame(v, { x0: lo, x1: hi, y0: 0, y1: 3, pad: 24, xl: "값", yl: "" });
    F.axes({ noGrid: true });
    all.forEach(([x, gi], i) => { F.dot(x, gi === 0 ? 2 : 1, gi === 0 ? c.main : c.warn, 6); F.text(String(i + 1), x - 0.08 * (hi - lo) / 20, gi === 0 ? 2.35 : 0.55, c.ink2); });
    F.text("A", lo + 0.1, 2, c.main); F.text("B", lo + 0.1, 1, c.warn);
    k.out(`A의 넷째 값 ${fmt(out, 1)}, B 전체를 ${fmt(shift, 2)}만큼 이동 · 숫자는 합친 순위\nt 검정: t = ${fmt(t, 3)}, p = ${fmt(pt, 4)} · 윌콕슨: W = ${W} (귀무 평균 39), 정확 p = ${fmt(pw, 4)}`);
  }
  S.redraw();
})();
