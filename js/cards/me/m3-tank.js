/* 기계3 열역학 5단원: 단열 탱크 충전 — 압력이 오르는 동안 탱크 속 온도 (05-02) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-tankfill"); if (!S) return;
  const [cv] = S.$$("canvas");
  const GAS = { air: { n: "공기", R: 0.287, cv: 0.718, cp: 1.005 }, he: { n: "헬륨", R: 2.0769, cv: 3.1156, cp: 5.1926 }, co2: { n: "CO₂(이상기체 근사)", R: 0.1889, cv: 0.657, cp: 0.846 } };
  // 압력 P까지 채웠을 때: m(P) = m1 + cv(PV/R − m1T1)/(cp Tin), T = PV/(R m)
  function at(P, g, V, P1, T1, Tin) {
    const m1 = (P1 * V) / (g.R * T1), m = m1 + (g.cv * ((P * V) / g.R - m1 * T1)) / (g.cp * Tin);
    return { m, T: (P * V) / (g.R * m), m1 };
  }
  function draw() {
    const c = QSim.col(), g = GAS[S.val("gas")], V = 1, Tin = S.val("Tin"), P1 = S.val("P1"), T1 = S.val("T1"), Pl = S.val("Pl");
    const Pend = Math.max(Pl, P1 + 1), k = g.cp / g.cv, Tmax = Math.max(k * Tin, T1, Tin) * 1.15;
    const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: 0, x1: Pend, y0: 0, y1: Tmax, xl: "탱크 압력 P (kPa)", yl: "T (K)", pad: 38 }); f.axes();
    f.path([[0, k * Tin], [Pend, k * Tin]], c.acc, 1.5, [6, 4]); f.path([[0, Tin], [Pend, Tin]], c.ink3, 1, [3, 3]);
    const pts = []; for (let i = 0; i <= 200; i++) { const P = P1 + ((Pend - P1) * i) / 200; if (P <= 0) continue; pts.push([P, at(P, g, V, P1, T1, Tin).T]); }
    f.path(pts, c.main, 2.5);
    const e = at(Pend, g, V, P1, T1, Tin); f.dot(Pend, e.T, c.warn, 5);
    S.out(`${g.n}, 비열비 k = ${k.toFixed(3)}, 공급관 ${Tin} K, 탱크 1 m³ (단열)\n처음 ${P1} kPa, ${T1} K (질량 ${e.m1.toFixed(3)} kg) → 끝 ${Pend} kPa: 온도 ${e.T.toFixed(1)} K, 질량 ${e.m.toFixed(3)} kg (들어온 ${(e.m - e.m1).toFixed(3)} kg)\n노란 점선 kT_공급 = ${(k * Tin).toFixed(1)} K: 진공에서 채울 때의 끝 온도`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();
