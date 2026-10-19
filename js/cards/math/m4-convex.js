/* 수학4 탐구: 볼록 함수와 볼록이 아닌 함수에서 경사하강법이 도착하는 곳 */
(() => {
  "use strict";
  const S = MKit.setup("card-m4-convex", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const FN = {
    cvx: { name: "eˣ − 2x (볼록)", f: (x) => Math.exp(x) - 2 * x, g: (x) => Math.exp(x) - 2, y0: -0.5, y1: 8, mins: [[Math.LN2, "유일한 최솟점(전역)"]] },
    ncv: { name: "x⁴ − 3x² + x (볼록 아님)", f: (x) => x ** 4 - 3 * x * x + x, g: (x) => 4 * x ** 3 - 6 * x + 1, y0: -4.5, y1: 8, mins: [[-1.3008395659, "전역 최솟점"], [1.1309011226, "국소 최솟점(전역 아님)"]] },
  };
  function draw() {
    const c = QSim.col(), F = FN[k.val("f")], x0 = k.val("x0"), eta = k.val("eta");
    const P = QSim.frame(v, { x0: -2.4, x1: 2.4, y0: F.y0, y1: F.y1, pad: 26, xl: "x", yl: "f(x)" });
    P.axes();
    P.fn((x) => Math.max(F.y0 - 1, Math.min(F.y1 + 1, F.f(x))), c.ink2, 1.8);
    let x = x0, div = false;
    const it = [x];
    for (let i = 0; i < 200; i++) { x -= eta * F.g(x); if (!isFinite(x) || Math.abs(x) > 1e6) { div = true; break; } it.push(x); }
    for (let i = 0; i + 1 < Math.min(it.length, 40); i++) {
      const a = it[i], b = it[i + 1];
      if (Math.abs(a) < 2.4 && Math.abs(b) < 2.4) P.path([[a, F.f(a)], [b, F.f(b)]], c.main, 1, [3, 3]);
    }
    it.slice(0, 40).forEach((t, i) => { if (Math.abs(t) < 2.4) P.dot(t, F.f(t), i ? c.main : c.warn, i ? 3 : 5); });
    F.mins.forEach(([m]) => P.dot(m, F.f(m), c.acc, 4));
    let msg;
    if (div || Math.abs(x) > 3) msg = "발산 (학습률이 너무 큼)";
    else {
      const hit = F.mins.find(([m]) => Math.abs(m - x) < 1e-3);
      msg = hit ? `x ≈ ${fmt(x, 4)}, f ≈ ${fmt(F.f(x), 4)}: ${hit[1]}` : `x ≈ ${fmt(x, 4)}, f'(x) = ${fmt(F.g(x), 3)} (200번 안에 수렴하지 않음: 진동하거나 느림)`;
    }
    k.out(`${F.name} · 출발 x₀ = ${fmt(x0, 2)}, η = ${fmt(eta, 2)}, 200번 반복\n도착: ${msg}`);
  }
  S.redraw();
})();
