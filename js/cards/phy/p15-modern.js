/* 물리15 실습 카드: 은하 회전 곡선 */
(() => {
  "use strict";
  const C = () => QSim.col();

  /* 1. 은하 회전 곡선과 암흑물질 헤일로 (01-02) */
  (() => {
    const S = QSim.card("lab-p15-rotation"); if (!S) return;
    const cv = S.$("canvas");
    const G = 4.30e-6, Md = 6e10, Rd = 3;   // kpc (km/s)^2 / 태양질량
    const Mvis = (r) => Md * (1 - (1 + r / Rd) * Math.exp(-r / Rd));
    const Mhalo = (r, rho, rc) => 4 * Math.PI * rho * rc * rc * (r - rc * Math.atan(r / rc));
    const v = (M, r) => Math.sqrt(Math.max(0, G * M / r));
    let s = 11; const rnd = () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
    const data = []; for (let r = 2; r <= 30; r += 2) { const u = Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd()); data.push([r, v(Mvis(r) + Mhalo(r, 1.5e7, 5), r) + 5 * u]); }
    function draw() {
      const c = C(), rho = S.val("rho") * 1e7, rc = S.val("rc");
      const vv = QSim.view(cv, 0.55), f = QSim.frame(vv, { x0: 0, x1: 32, y0: 0, y1: 260, xl: "r (kpc)", yl: "v (km/s)" }); f.axes();
      f.fn((r) => v(Mvis(r), r), c.acc, 2, [6, 4]);
      f.fn((r) => v(Mhalo(r, rho, rc), r), c.ink3, 2, [3, 3]);
      f.fn((r) => v(Mvis(r) + Mhalo(r, rho, rc), r), c.main, 2.5);
      f.fn((r) => v(Md, r), c.warn, 1.2, [2, 4]);
      data.forEach(([r, y]) => f.dot(r, y, c.ink, 4));
      const chi = data.reduce((a, [r, y]) => a + ((y - v(Mvis(r) + Mhalo(r, rho, rc), r)) / 5) ** 2, 0) / data.length;
      const mt = Mvis(30) + Mhalo(30, rho, rc);
      S.out(`헤일로 중심 밀도 ${(rho / 1e7).toFixed(2)}×10⁷ 태양질량/kpc³, 핵 반지름 ${rc.toFixed(1)} kpc\n30 kpc 안의 질량: 보이는 물질 ${(Mvis(30) / 1e10).toFixed(1)}×10¹⁰, 헤일로 ${(Mhalo(30, rho, rc) / 1e10).toFixed(1)}×10¹⁰ 태양질량 (헤일로 ${(100 * Mhalo(30, rho, rc) / mt).toFixed(0)}%)\n관측점과의 어긋남(평균 제곱, 1이면 잡음 수준): ${chi.toFixed(2)}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
