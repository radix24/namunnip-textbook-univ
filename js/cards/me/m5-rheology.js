/* 기계5 유체역학 1단원: 유동 곡선(뉴턴·멱법칙·빙햄)과 겉보기 점성 (01-02) */
(() => {
  "use strict";
  const S = QSim.card("card-me-rheology"); if (!S) return;
  const [c1, c2] = S.$$("canvas");
  const gmax = 100; // 1/s
  function draw() {
    const c = QSim.col(), K = S.val("K"), n = S.val("n"), ty = S.val("ty"), gr = S.val("g");
    const tau = (g) => (g <= 0 ? 0 : ty + K * Math.pow(g, n));
    const tmax = Math.max(tau(gmax), 1) * 1.1;
    let v = QSim.view(c1, 0.55), f = QSim.frame(v, { x0: 0, x1: gmax, y0: 0, y1: tmax, xl: "du/dy (1/s)", yl: "τ (Pa)", pad: 38 }); f.axes();
    f.fn((g) => K * g, c.ink3, 1.5, [5, 4]); // 같은 K의 뉴턴 유체
    const pts = [[0, ty]]; for (let i = 1; i <= 200; i++) { const g = (gmax * i) / 200; pts.push([g, tau(g)]); } f.path(pts, c.main, 2.5);
    f.dot(gr, tau(gr), c.warn, 5);
    // 겉보기 점성 τ/(du/dy)
    const mu = (g) => tau(g) / g, mmax = Math.max(...[1, 2, 5, 10, 50, 100].map(mu)) * 1.1;
    v = QSim.view(c2, 0.4); f = QSim.frame(v, { x0: 0, x1: gmax, y0: 0, y1: Math.min(mmax, 50 * K + ty), xl: "du/dy (1/s)", yl: "μ겉보기 (Pa·s)", pad: 38 }); f.axes();
    const mp = []; for (let i = 1; i <= 200; i++) { const g = (gmax * i) / 200; const m = mu(g); if (m < 1e6) mp.push([g, m]); } f.path(mp, c.acc, 2);
    f.dot(gr, mu(gr), c.warn, 5);
    const kind = ty > 0 ? (n === 1 ? "빙햄 유체 (항복 응력 뒤 직선)" : "항복 응력이 있는 멱법칙 유체 (허셜-버클리)") : n < 1 ? "전단 박화 (n < 1)" : n > 1 ? "전단 농화 (n > 1)" : "뉴턴 유체 (n = 1, 겉보기 점성 일정)";
    S.out(`${kind}\n변형률 속도 ${gr} 1/s에서 τ = ${tau(gr).toFixed(2)} Pa, 겉보기 점성 τ/(du/dy) = ${mu(gr).toFixed(3)} Pa·s\n변형률 속도 10배(${(gr * 10 > gmax ? gmax : gr * 10)})일 때 겉보기 점성 ${mu(Math.min(gmax, gr * 10)).toFixed(3)} Pa·s`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();
