/* 수학5 탐구: 중심극한정리의 증명 — ln M_{Z_n}(t) = n ln M_Y(t/√n) 가 t²/2 로 수렴 */
(() => {
  "use strict";
  const S = MKit.setup("card-m5-cltmgf", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const Y = {
    coin: { name: "동전 ±1", lnM: (s) => Math.log(Math.cosh(s)) },
    unif: { name: "균등(표준화)", lnM: (s) => (Math.abs(s) < 1e-8 ? 0 : Math.log(Math.sinh(Math.sqrt(3) * s) / (Math.sqrt(3) * s))) },
    exp: { name: "지수 − 1", lnM: (s) => (s < 1 ? -s - Math.log(1 - s) : Infinity) },
  };
  function draw() {
    const c = QSim.col(), y = Y[k.val("y")], n = k.val("n"), t0 = k.val("t");
    const lnMz = (t) => n * y.lnM(t / Math.sqrt(n));
    const F = QSim.frame(v, { x0: -2.2, x1: 2.2, y0: -0.2, y1: 3.2, pad: 30, xl: "t", yl: "ln M(t)" });
    F.axes();
    F.fn((t) => (t * t) / 2, c.warn, 2.4, [6, 4]);
    [1, 2, 4].forEach((m, i) => { if (m < n) F.fn((t) => { const r = m * y.lnM(t / Math.sqrt(m)); return r > 3.2 ? NaN : r; }, c.ink3, 1); });
    F.fn((t) => { const r = lnMz(t); return r > 3.2 ? NaN : r; }, c.main, 2.4);
    const val = lnMz(t0);
    F.dot(t0, Math.min(3.2, val), c.main, 5); F.dot(t0, (t0 * t0) / 2, c.warn, 4);
    k.out(`${y.name} · n = ${n} · t = ${fmt(t0, 2)}에서 ln M_Zn(t) = ${isFinite(val) ? fmt(val, 4) : "∞ (적률생성함수가 없음)"}, t²/2 = ${fmt((t0 * t0) / 2, 4)}\n파랑: 현재 n, 회색: n = 1, 2, 4, 빨간 점선: 표준정규의 t²/2`);
  }
  S.redraw();
})();
