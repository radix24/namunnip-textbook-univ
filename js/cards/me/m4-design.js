/* 기계4 컴퓨터응용기계설계: 브래킷 파라미터 연구 (04-01) */
(() => {
  "use strict";

  /* ── 외팔보 브래킷: δ = 4FL³/(E b t³), 질량 = ρ b t L ── */
  (() => {
    const S = QSim.card("lab-me-param"); if (!S) return;
    const [cv] = S.$$("canvas");
    const MAT = { steel: { n: "강", E: 200000, rho: 7.85 }, al: { n: "알루미늄", E: 70000, rho: 2.7 }, abs: { n: "ABS 플라스틱", E: 2300, rho: 1.05 } };
    const F = 200, LIM = 1.0;
    function draw() {
      const c = QSim.col(), m = MAT[S.val("m")], t = S.val("t"), b = S.val("b"), L = S.val("L");
      const d = (tt) => (4 * F * L ** 3) / (m.E * b * tt ** 3), mass = (tt) => m.rho * (b * tt * L) / 1000; // g (mm³ × g/cm³ / 1000)
      const tmin = Math.cbrt((4 * F * L ** 3) / (m.E * b * LIM));
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 2, x1: 30, y0: 0, y1: 5, xl: "두께 t (mm)", yl: "끝 처짐 δ (mm)", pad: 34 });
      f.axes();
      f.path([[2, LIM], [30, LIM]], c.warn, 1.5, [5, 4]);
      f.fn((x) => Math.min(d(x), 6), c.main, 2.5);
      if (tmin <= 30) f.dot(tmin, LIM, c.acc, 5);
      f.dot(t, Math.min(d(t), 5), d(t) <= LIM ? c.main : c.warn, 6);
      const ok = d(t) <= LIM ? "요구 만족" : "요구 불만족";
      S.out(`${m.n} (E = ${m.E / 1000} GPa, 밀도 ${m.rho} g/cm³), 하중 200 N, 길이 ${L} mm, 폭 ${b} mm, 두께 ${t} mm\n끝 처짐 δ = 4FL³/(E b t³) = ${d(t).toFixed(3)} mm → ${ok} (요구 1.0 mm 이하, 빨간 점선)\n질량 ${mass(t).toFixed(1)} g\n요구를 만족하는 최소 두께 ${tmin.toFixed(2)} mm (초록 점), 그때 질량 ${mass(tmin).toFixed(1)} g`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
