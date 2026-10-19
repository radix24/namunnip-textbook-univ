/* 수학4 탐구: 선형회귀를 경사하강법으로 — 표준화가 학습률과 반복 횟수를 바꾼다 */
(() => {
  "use strict";
  const S = MKit.setup("card-m4-linreg-gd", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const X = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], Y = [52, 55, 61, 60, 68, 71, 75, 74, 82, 86], n = X.length;
  const mx = 5.5, sd = Math.sqrt(8.25);
  const W0 = 304 / 82.5, B0 = 68.4 - W0 * mx;
  const mse = (w, b) => X.reduce((a, x, i) => a + (w * x + b - Y[i]) ** 2, 0) / n;
  const best = mse(W0, B0);
  function draw() {
    const c = QSim.col(), std = k.val("std") === "on", eta = Math.pow(10, k.val("le")), N = k.val("n");
    const xs = std ? X.map((x) => (x - mx) / sd) : X;
    let w = 0, b = 0, div = false, hit = -1;
    for (let it = 1; it <= N; it++) {
      let gw = 0, gb = 0;
      for (let i = 0; i < n; i++) { const e = w * xs[i] + b - Y[i]; gw += (2 * e * xs[i]) / n; gb += (2 * e) / n; }
      w -= eta * gw; b -= eta * gb;
      if (!isFinite(w) || Math.abs(w) > 1e8) { div = true; break; }
      const wr = std ? w / sd : w, br = std ? b - (w * mx) / sd : b;
      if (hit < 0 && mse(wr, br) - best < 1e-6) hit = it;
    }
    const wr = std ? w / sd : w, br = std ? b - (w * mx) / sd : b;
    const P = QSim.frame(v, { x0: 0, x1: 11, y0: 0, y1: 100, pad: 28, xl: "공부 시간", yl: "점수" });
    P.axes();
    P.fn((x) => W0 * x + B0, c.ink3, 1.2, [4, 4]);
    if (!div) P.fn((x) => Math.max(-50, Math.min(150, wr * x + br)), c.main, 2.2);
    X.forEach((x, i) => P.dot(x, Y[i], c.warn, 4));
    const H = std ? "2·I (곡률 2, 2)" : "곡률 약 78.6과 0.42 (비 약 187)";
    const lim = std ? 1 : 0.02545;
    k.out(`${std ? "표준화한 x" : "원래 x"} · η = ${eta < 0.01 ? eta.toExponential(1) : fmt(eta, 3)} · 손실의 헤세 행렬: ${H} → 수렴 조건 η < ${lim}\n` +
      (div ? `${N}번 안에 발산` : `${N}번 뒤: 기울기 ${fmt(wr, 4)}, 절편 ${fmt(br, 4)}, MSE ${fmt(mse(wr, br), 4)} (최소 ${fmt(best, 4)})${hit > 0 ? ` · 최소와의 차가 10⁻⁶ 미만이 된 것은 ${hit}번째` : ""}`));
  }
  S.redraw();
})();
