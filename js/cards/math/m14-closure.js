/* 수학14 탐구: 위상(표준·하한·여유한)에 따라 달라지는 근방, 극한점, 닫힘 */
(() => {
  "use strict";
  const S = MKit.setup("card-m14-closure", 0.42, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const eq = (a, b) => Math.abs(a - b) < 1e-12;
  // meets(lo, hi, loClosed, x): A∖{x} 와 구간이 만나는가
  const SETS = {
    o01: { name: "(0, 1)", has: (x) => x > 0 && x < 1, meets: (lo, hi) => Math.max(lo, 0) < Math.min(hi, 1) - 1e-12, draw: (P, c) => P.path([[0, 0], [1, 0]], c.main, 4) },
    h01: { name: "[0, 1)", has: (x) => x >= 0 && x < 1, meets: (lo, hi) => Math.max(lo, 0) < Math.min(hi, 1) - 1e-12, draw: (P, c) => { P.path([[0, 0], [1, 0]], c.main, 4); P.dot(0, 0, c.main, 4); } },
    inv: { name: "{1/n}", has: (x) => x > 0 && eq(1 / Math.round(1 / x), x), meets: (lo, hi, lc, x) => { if (hi <= 0) return false; let n = Math.max(1, Math.floor(1 / hi)); for (let t = 0; t < 4; t++, n++) { const y = 1 / n; if (y < hi && (y > lo || (lc && eq(y, lo))) && !eq(y, x)) return true; } return false; }, draw: (P, c) => { for (let n = 1; n <= 60; n++) P.dot(1 / n, 0, c.main, 3); } },
    ninv: { name: "{−1/n}", has: (x) => x < 0 && eq(-1 / Math.round(-1 / x), x), meets: (lo, hi, lc, x) => { if (lo >= 0) return false; let n = Math.max(1, Math.floor(-1 / lo)); for (let t = 0; t < 4; t++, n++) { const y = -1 / n; if ((y > lo || (lc && eq(y, lo))) && y < hi && !eq(y, x)) return true; } return false; }, draw: (P, c) => { for (let n = 1; n <= 60; n++) P.dot(-1 / n, 0, c.main, 3); } },
    Z: { name: "ℤ", has: (x) => eq(x, Math.round(x)), meets: (lo, hi, lc, x) => { for (let m = Math.ceil(lo - 1e-12); m < hi; m++) if ((m > lo || (lc && eq(m, lo))) && !eq(m, x)) return true; return false; }, draw: (P, c) => { for (let m = -2; m <= 2; m++) P.dot(m, 0, c.main, 4); } },
  };
  function draw() {
    const c = QSim.col(), top = k.val("t"), A = SETS[k.val("a")], x = k.val("x"), eps = Math.pow(10, k.val("le"));
    const P = QSim.frame(v, { x0: -1.6, x1: 1.6, y0: -1, y1: 1, pad: 16 });
    P.path([[-1.6, 0], [1.6, 0]], c.rule, 1);
    for (let m = -1; m <= 1; m++) P.text(String(m), m - 0.02, -0.35, c.ink3);
    A.draw(P, c);
    // 근방 그리기
    let lo, hi, lc;
    if (top === "std") { lo = x - eps; hi = x + eps; lc = false; P.path([[lo, 0.45], [hi, 0.45]], c.acc, 3); }
    else if (top === "low") { lo = x; hi = x + eps; lc = true; P.path([[lo, 0.45], [hi, 0.45]], c.acc, 3); P.dot(lo, 0.45, c.acc, 4); }
    else { P.path([[-1.6, 0.45], [1.6, 0.45]], c.acc, 3); [x - 0.4, x + 0.3, x + 0.7].forEach((h) => { if (Math.abs(h) < 1.6) P.dot(h, 0.45, c.card, 4); }); }
    P.dot(x, 0, c.warn, 5);
    let meetNow, isLimit;
    if (top === "cof") { meetNow = true; isLimit = true; }
    else {
      meetNow = A.meets(lo, hi, lc, x);
      isLimit = true;
      for (let kk = 1; kk <= 9; kk++) { const e = Math.pow(10, -kk); const L = top === "std" ? x - e : x, Hh = x + e; if (!A.meets(L, Hh, top === "low", x)) { isLimit = false; break; } }
    }
    const inA = A.has(x), inCl = inA || isLimit;
    const tn = top === "std" ? "표준위상 (x − ε, x + ε)" : top === "low" ? "하한위상 [x, x + ε)" : "여유한위상 (유한 개를 뺀 ℝ)";
    k.out(`A = ${A.name}, ${tn}, x = ${fmt(x, 2)}${top === "cof" ? "" : `, ε = ${eps < 0.01 ? eps.toExponential(0) : fmt(eps, 3)}`}\n지금 근방이 A∖{x}와 ${meetNow ? "만남" : "만나지 않음"} · x ${inA ? "∈" : "∉"} A · x는 A의 극한점${isLimit ? "임" : "이 아님"} → x ${inCl ? "∈" : "∉"} 닫힘 Ā`);
  }
  S.redraw();
})();
