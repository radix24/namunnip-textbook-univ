/* 수학8 탐구: x + y = 2, x + (1+δ)y = 2 + δ + η — 거의 평행한 두 직선의 교점과 조건수 */
(() => {
  "use strict";
  const S = MKit.setup("card-m8-condlines", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  function draw() {
    const c = QSim.col(), p = k.val("p"), eta = k.val("e"), delta = Math.pow(10, -p);
    // 해: y = 1 + η/δ, x = 2 − y
    const y = 1 + eta / delta, x = 2 - y;
    const disc = Math.sqrt(delta * delta + 4), l1 = (2 + delta + disc) / 2, l2 = (2 + delta - disc) / 2, kap = l1 / l2;
    const F = QSim.frame(v, { x0: -3, x1: 5, y0: -2, y1: 4, pad: 26, xl: "x", yl: "y" });
    F.axes();
    F.fn((t) => 2 - t, c.main, 2);
    F.fn((t) => (2 + delta + eta - t) / (1 + delta), c.warn, 2);
    F.dot(1, 1, c.ink3, 5);
    if (Math.abs(x) < 50 && Math.abs(y) < 50) F.dot(x, y, c.acc, 7);
    const bn = Math.hypot(2, 2 + delta), rb = Math.abs(eta) / bn, rx = Math.hypot(x - 1, y - 1) / Math.SQRT2;
    k.out(`δ = 10^-${p} · 조건수 κ₂ = ${kap.toExponential(2)} · η = ${fmt(eta, 4)}만큼 둘째 우변을 바꿈\n해 (${fmt(x, 4)}, ${fmt(y, 4)}) (원래 (1, 1)) · 상대 오차: 우변 ${rb.toExponential(2)} → 해 ${rx.toExponential(2)}, 확대율 ${eta === 0 ? "-" : fmt(rx / rb, 1)}`);
  }
  S.redraw();
})();
