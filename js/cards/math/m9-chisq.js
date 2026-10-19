/* 수학9 탐구: 2×2 분할표의 독립성 검정 — 기대도수, 칸별 기여, X², p, 모자이크 그림 */
(() => {
  "use strict";
  const S = MKit.setup("card-m9-chisq", 0.45, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  function draw() {
    const c = QSim.col(), O = [[k.val("a"), k.val("b")], [k.val("c"), k.val("d")]], g = v.g, W = v.W, H = v.H;
    const R = O.map((r) => r[0] + r[1]), C = [O[0][0] + O[1][0], O[0][1] + O[1][1]], n = R[0] + R[1];
    if (n === 0 || R.includes(0) || C.includes(0)) { k.out("행 합이나 열 합이 0이면 검정할 수 없습니다"); return; }
    const E = R.map((r) => C.map((cc) => (r * cc) / n));
    const contrib = O.map((r, i) => r.map((o, j) => (o - E[i][j]) ** 2 / E[i][j]));
    const X2 = contrib.flat().reduce((a, b) => a + b, 0), p = 1 - M9.chi2Cdf(X2, 1);
    // 모자이크: 가로 = 행 비율, 세로 = 행 안의 열 비율
    const x0 = 20, w = W * 0.5, y0 = 16, h = H - 40, cols = [c.main, c.warn];
    let xx = x0;
    R.forEach((r, i) => { const ww = (w * r) / n; let yy = y0; O[i].forEach((o, j) => { const hh = (h * o) / r; g.fillStyle = cols[j]; g.globalAlpha = 0.75; g.fillRect(xx + 1, yy + 1, ww - 2, hh - 2); g.globalAlpha = 1; yy += hh; }); g.fillStyle = c.ink2; g.font = "12px monospace"; g.fillText(`행 ${i + 1}`, xx + ww / 2 - 14, H - 10); xx += ww; });
    g.strokeStyle = c.ink; g.setLineDash([4, 3]); const yy = y0 + (h * C[0]) / n; g.beginPath(); g.moveTo(x0, yy); g.lineTo(x0 + w, yy); g.stroke(); g.setLineDash([]);
    g.fillStyle = c.ink2; g.font = "12px monospace";
    const tx = x0 + w + 20; ["기대도수 (독립일 때)", `[${fmt(E[0][0], 2)}, ${fmt(E[0][1], 2)}]`, `[${fmt(E[1][0], 2)}, ${fmt(E[1][1], 2)}]`, "칸별 (O−E)²/E", `[${fmt(contrib[0][0], 3)}, ${fmt(contrib[0][1], 3)}]`, `[${fmt(contrib[1][0], 3)}, ${fmt(contrib[1][1], 3)}]`].forEach((t, i) => g.fillText(t, tx, 26 + i * 18));
    k.out(`관측 [[${O[0].join(", ")}], [${O[1].join(", ")}]] · n = ${n}\nX² = ${fmt(X2, 3)} (자유도 1) · p = ${fmt(p, 4)} · 점선: 독립일 때의 열 1 비율${Math.min(...E.flat()) < 5 ? " · 기대도수 5 미만 칸이 있어 근사가 부정확" : ""}`);
  }
  S.redraw();
})();
