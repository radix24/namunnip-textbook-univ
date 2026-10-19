/* 수학8 탐구: [[ε, 1], [1, 1]]x = [1, 2]를 유효숫자 d자리로 — 피벗팅 유무에 따른 오차 */
(() => {
  "use strict";
  const S = MKit.setup("card-m8-pivot", 0.4, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  function solve(eps, d, piv) {
    const fl = (x) => (x === 0 ? 0 : Number(x.toPrecision(d)));
    let A = [[fl(eps), 1], [1, 1]], b = [1, 2], swapped = false;
    if (piv && Math.abs(A[1][0]) > Math.abs(A[0][0])) { A = [A[1], A[0]]; b = [b[1], b[0]]; swapped = true; }
    const l = fl(A[1][0] / A[0][0]);
    const u22 = fl(A[1][1] - fl(l * A[0][1])), b2 = fl(b[1] - fl(l * b[0]));
    const y = fl(b2 / u22), x = fl(fl(b[0] - fl(A[0][1] * y)) / A[0][0]);
    return { x, y, l, swapped };
  }
  function draw() {
    const c = QSim.col(), p = k.val("p"), d = k.val("d"), eps = Math.pow(10, -p), g = v.g, W = v.W, H = v.H;
    const ex = 1 / (1 - eps), ey = (1 - 2 * eps) / (1 - eps);
    const A = solve(eps, d, false), B = solve(eps, d, true);
    const errA = Math.hypot(A.x - ex, A.y - ey), errB = Math.hypot(B.x - ex, B.y - ey);
    const F = QSim.frame(v, { x0: 0, x1: 3, y0: -17, y1: 1, pad: 28, xl: "", yl: "log₁₀ 오차" });
    F.axes({ noGrid: true });
    const bar = (i, e, col, lab) => { const yv = Math.max(-17, Math.log10(Math.max(e, 1e-17))); g.fillStyle = col; const X0 = F.X(i - 0.3), X1 = F.X(i + 0.3); g.fillRect(X0, F.Y(Math.max(yv, -17)), X1 - X0, F.Y(-17) - F.Y(yv)); F.text(lab, i - 0.28, Math.min(0.5, yv + 1), c.ink2); };
    bar(1, errA, c.warn, "피벗팅 없음"); bar(2, errB, c.main, "부분 피벗팅");
    k.out(`ε = 10^-${p}, 유효숫자 ${d}자리 · 정확한 해 (${fmt(ex, 6)}, ${fmt(ey, 6)})\n피벗팅 없음: 승수 ${fmt(A.l, 3)}, 해 (${A.x}, ${A.y}), 오차 ${errA.toExponential(1)} · 부분 피벗팅: 승수 ${fmt(B.l, 6)}, 해 (${B.x}, ${B.y}), 오차 ${errB.toExponential(1)}`);
  }
  S.redraw();
})();
