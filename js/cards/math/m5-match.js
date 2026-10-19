/* 수학5 탐구: 모자 짝 맞추기 — 포함배제 부분합의 진동과 1 − 1/e, 무작위 순열 실험 */
(() => {
  "use strict";
  const S = MKit.setup("card-m5-match", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const fact = (m) => { let r = 1; for (let i = 2; i <= m; i++) r *= i; return r; };
  function simulate(n, T) {
    let s = 12345, hit = 0;
    const rnd = () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const p = Array.from({ length: n }, (_, i) => i);
    for (let t = 0; t < T; t++) {
      for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
      if (p.some((x, i) => x === i)) hit++;
    }
    return hit / T;
  }
  function draw() {
    const c = QSim.col(), n = k.val("n"), g = v.g, W = v.W, H = v.H;
    const ks = k.$('[name="k"]'); if (+ks.max !== n) { ks.max = n; MKit.setVal(k, "k", Math.min(+ks.value, n)); }
    const kk = Math.min(k.val("k"), n);
    const ps = []; let sum = 0;
    for (let r = 1; r <= n; r++) { sum += (r % 2 ? 1 : -1) / fact(r); ps.push(sum); }
    const exact = ps[n - 1], lim = 1 - Math.exp(-1);
    const F = QSim.frame(v, { x0: 0.5, x1: 12.5, y0: 0.4, y1: 1.05, pad: 30, xl: "항 수 r", yl: "부분합" });
    F.axes();
    F.path([[0.5, lim], [12.5, lim]], c.ink3, 1, [5, 4]);
    F.path([[0.5, exact], [12.5, exact]], c.acc, 1.5);
    F.path(ps.map((p, i) => [i + 1, p]), c.main, 1.5);
    ps.forEach((p, i) => F.dot(i + 1, p, i + 1 === kk ? c.warn : c.main, i + 1 === kk ? 7 : 4));
    F.text("정확한 p_n", 10.3, exact + 0.025, c.acc);
    const sim = simulate(n, 20000);
    k.out(`n = ${n} · 앞 ${kk}항까지 합 ${fmt(ps[kk - 1], 4)} (${kk === n ? "정확한 값" : kk % 2 ? "정확한 값보다 큼" : "정확한 값보다 작음"}) · 정확한 p_n = ${fmt(exact, 4)} · 1 − 1/e ≈ ${fmt(lim, 4)}\n무작위 순열 20000번 실험: 적어도 한 명이 자기 모자 ${fmt(sim, 4)}`);
  }
  S.redraw();
})();
