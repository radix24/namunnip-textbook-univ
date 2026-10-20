/* 기계11 5단원: 비에너지 선도와 도수 (05-01) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-jump"); if (!S) return;
  const [cv] = S.$$("canvas");
  const g = 9.81;
  function draw() {
    const c = QSim.col(), q = S.val("q"), y1 = S.val("y1");
    const E = (y) => y + (q * q) / (2 * g * y * y), yc = Math.cbrt((q * q) / g), Emin = 1.5 * yc;
    const Fr1 = q / y1 / Math.sqrt(g * y1);
    const ymax = Math.max(3, yc * 3), Emax = Math.max(4, E(y1) * 1.2);
    const v = QSim.view(cv, 0.7), f = QSim.frame(v, { x0: 0, x1: Emax, y0: 0, y1: ymax, xl: "비에너지 E (m)", yl: "수심 y (m)", pad: 34, equal: true });
    f.axes();
    f.path([[0, 0], [ymax, ymax]], c.ink3, 1, [3, 3]); // E = y (속도 0)
    const pts = []; for (let i = 1; i <= 400; i++) { const y = (ymax * i) / 400; const e = E(y); if (e <= Emax) pts.push([e, y]); }
    f.path(pts, c.main, 2.5);
    f.dot(Emin, yc, c.ink2, 5); f.text("한계", Emin + 0.08, yc, c.ink2);
    f.dot(E(y1), y1, c.warn, 6);
    let msg;
    if (Fr1 > 1) {
      const y2 = (y1 / 2) * (Math.sqrt(1 + 8 * Fr1 * Fr1) - 1), dE = (y2 - y1) ** 3 / (4 * y1 * y2);
      let lo = yc, hi = 50; for (let i = 0; i < 100; i++) { const m = (lo + hi) / 2; if (E(m) < E(y1)) lo = m; else hi = m; }
      f.dot(E(y2), y2, c.acc, 6); f.dot(E(lo), lo, c.ink3, 4);
      f.path([[E(y1), y1], [E(y2), y2]], c.acc, 1.5, [5, 4]);
      msg = `사류 (Fr₁ = ${Fr1.toFixed(2)}) → 도수 후 수심 y₂ = ${y2.toFixed(3)} m (초록), Fr₂ = ${(q / y2 / Math.sqrt(g * y2)).toFixed(2)}\n에너지 손실 ΔE = ${dE.toFixed(3)} m (처음의 ${((dE / E(y1)) * 100).toFixed(0)}%), 손실 동력 ${((1000 * g * q * dE) / 1000).toFixed(1)} kW/m 폭, 같은 E의 교대 수심 ${lo.toFixed(3)} m (회색 점)${Fr1 < 1.7 ? "\n약한 도수(물결 도수)" : Fr1 > 4.5 ? "\n강한 도수: 손실이 큼" : ""}`;
    } else msg = `상류 (Fr₁ = ${Fr1.toFixed(2)}): 도수가 생기지 않음. 수심을 한계 수심보다 작게 해 보세요.`;
    S.out(`폭 1 m당 유량 q = ${q} m²/s, 한계 수심 y_c = ${yc.toFixed(3)} m, 최소 비에너지 ${Emin.toFixed(3)} m\n도수 전 점(빨강): 수심 ${y1} m, 속도 ${(q / y1).toFixed(2)} m/s, E = ${E(y1).toFixed(3)} m\n${msg}`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();
