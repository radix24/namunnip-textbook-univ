/* 수학8 탐구: 점을 끌어 최소제곱 직선 맞추기 — 잔차, 정규방정식, 잔차 ⊥ 열공간 */
(() => {
  "use strict";
  const S = MKit.setup("card-m8-lsq", 0.55, draw);
  if (!S) return;
  const { k, v, cv } = S;
  const { fmt } = MKit;
  const pts = [[0, 1], [1, 2], [2, 2], [3, 4], [4.5, 3.2]];
  let F = null;
  function draw() {
    const c = QSim.col(), n = k.val("n"), P = pts.slice(0, n);
    F = QSim.frame(v, { x0: -0.5, x1: 5.5, y0: -0.5, y1: 5.5, pad: 28, xl: "x", yl: "y" });
    F.axes();
    let sx = 0, sxx = 0, sy = 0, sxy = 0;
    P.forEach(([x, y]) => { sx += x; sxx += x * x; sy += y; sxy += x * y; });
    const det = n * sxx - sx * sx;
    let c0 = NaN, c1 = NaN;
    if (Math.abs(det) > 1e-9) { c0 = (sxx * sy - sx * sxy) / det; c1 = (n * sxy - sx * sy) / det; }
    let sse = 0, r1 = 0, rx = 0;
    if (isFinite(c0)) {
      F.fn((x) => c0 + c1 * x, c.main, 2.2);
      P.forEach(([x, y]) => { const r = y - c0 - c1 * x; sse += r * r; r1 += r; rx += x * r; F.path([[x, y], [x, c0 + c1 * x]], c.warn, 1.6); });
    }
    P.forEach(([x, y]) => F.dot(x, y, c.acc, 6));
    k.out(isFinite(c0)
      ? `AᵀA = [[${n}, ${fmt(sx, 2)}], [${fmt(sx, 2)}, ${fmt(sxx, 2)}]], Aᵀb = (${fmt(sy, 2)}, ${fmt(sxy, 2)})\n직선 y = ${fmt(c0, 3)} + ${fmt(c1, 3)}x · 잔차 제곱합 ${fmt(sse, 3)} · Σr = ${fmt(r1, 6)}, Σx·r = ${fmt(rx, 6)} (잔차 ⊥ 두 열)`
      : "모든 점의 x가 같아 두 열이 일차종속: AᵀA가 가역이 아니고 직선이 하나로 정해지지 않습니다");
  }
  MKit.drag(cv, () => F, () => pts.slice(0, k.val("n")), (i, x, y) => { pts[i] = [x, y]; draw(); });
  S.redraw();
})();
