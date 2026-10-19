/* 수학7 탐구: 꼬리의 상한 sₙ = sup_{k≥n} a_k와 꼬리의 하한이 상극한·하극한으로 내려오고 올라오는 모습 */
(() => {
  "use strict";
  const S = MKit.setup("card-m7-limsup", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const SEQ = {
    alt: { a: (n) => (n % 2 ? -1 : 1) * (1 + 1 / n), tex: "(−1)ⁿ(1 + 1/n)", ls: 1, li: -1 },
    sin: { a: (n) => Math.sin(n), tex: "sin n", ls: 1, li: -1 },
    cos3: { a: (n) => (n / (n + 1)) * Math.cos((2 * n * Math.PI) / 3), tex: "n/(n+1)·cos(2nπ/3)", ls: 1, li: -0.5 },
    damp: { a: (n) => Math.pow(-1, n) / Math.sqrt(n) + 0.5, tex: "0.5 + (−1)ⁿ/√n", ls: 0.5, li: 0.5 },
  };
  const NMAX = 3000;
  function draw() {
    const c = QSim.col(), Sq = SEQ[k.val("seq")], n0 = k.val("n"), shown = k.val("view");
    const a = [NaN]; for (let j = 1; j <= NMAX; j++) a.push(Sq.a(j));
    // 꼬리 상한·하한 (끝에서부터 누적)
    const sup = new Array(NMAX + 2).fill(-Infinity), inf = new Array(NMAX + 2).fill(Infinity);
    for (let j = NMAX; j >= 1; j--) { sup[j] = Math.max(a[j], sup[j + 1]); inf[j] = Math.min(a[j], inf[j + 1]); }
    const f = QSim.frame(v, { x0: 0, x1: shown + 1, y0: -1.7, y1: 1.7, pad: 30, xl: "n" });
    f.axes();
    const r = shown > 150 ? 1.6 : 2.6;
    for (let j = 1; j <= shown; j++) f.dot(j, a[j], j >= n0 ? c.main : c.ink3, r);
    f.path(Array.from({ length: shown }, (_, i) => [i + 1, sup[i + 1]]), c.warn, 2);
    f.path(Array.from({ length: shown }, (_, i) => [i + 1, inf[i + 1]]), c.acc, 2);
    f.path([[0, Sq.ls], [shown + 1, Sq.ls]], c.warn, 1, [5, 4]);
    f.path([[0, Sq.li], [shown + 1, Sq.li]], c.acc, 1, [5, 4]);
    f.path([[n0, -1.7], [n0, 1.7]], c.ink3, 1, [3, 3]);
    k.out(`aₙ = ${Sq.tex}\nn = ${n0}에서 꼬리 상한 sup_{k≥n} a_k ≈ ${fmt(sup[n0], 4)} (→ 상극한 ${Sq.ls}) · 꼬리 하한 ≈ ${fmt(inf[n0], 4)} (→ 하극한 ${Sq.li})` +
      (Sq.ls === Sq.li ? "\n두 값이 같으므로 수열이 수렴합니다" : ""));
  }
  S.redraw();
})();
