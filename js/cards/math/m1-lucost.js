/* 수학1 탐구: 우변이 k개일 때 매번 소거 vs LU 한 번 + 대입 — 곱셈 횟수 비교 */
(() => {
  "use strict";
  const S = MKit.setup("card-m1-lucost", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const fmtN = (x) => (x >= 1e9 ? (x / 1e9).toFixed(2) + "×10⁹" : x >= 1e6 ? (x / 1e6).toFixed(2) + "×10⁶" : x >= 1e3 ? (x / 1e3).toFixed(1) + "×10³" : Math.round(x) + "");
  function draw() {
    const c = QSim.col(), g = v.g;
    const n = Math.round(Math.pow(10, k.val("ln"))), r = k.val("r");
    k.$(".nv").textContent = n;
    // 곱셈·나눗셈 횟수의 주요 항: 소거 n³/3, 대입 한 번(전진+후진) n²
    const elim = r * (n ** 3 / 3 + n ** 2);
    const lu = n ** 3 / 3 + r * n ** 2;
    const W = v.W, H = v.H, x0 = 120, bw = W - x0 - 20, m = Math.max(elim, lu);
    const bar = (y, val, col, lab) => {
      g.fillStyle = col; g.fillRect(x0, y, (bw * val) / m, 30);
      g.fillStyle = c.ink; g.font = "13px sans-serif"; g.fillText(lab, 8, y + 20);
      g.font = "12px " + getComputedStyle(document.documentElement).getPropertyValue("--f-mono"); g.fillText(fmtN(val), x0 + Math.min(bw - 70, (bw * val) / m + 6), y + 20);
    };
    bar(H * 0.2, elim, c.warn, "매번 소거");
    bar(H * 0.55, lu, c.main, "LU + 대입");
    k.out(`n = ${n}, 우변 ${r}개\n매번 소거: 약 ${fmtN(elim)}번 · LU 한 번 + 대입 ${r}번: 약 ${fmtN(lu)}번 · 비 ${(elim / lu).toFixed(1)}배`);
  }
  S.redraw();
})();
