/* 기계10 응용열역학: Clausius-Clapeyron 직선으로 증발 잠열 추정 (02-02) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-clapeyron"); if (!S) return;
  const [cv] = S.$$("canvas");
  // 물의 포화 압력 (kPa)과 증발 잠열 (kJ/kg), 증기표 값
  const TAB = [[20, 2.339, 2453.5], [30, 4.247, 2429.8], [40, 7.385, 2406.0], [50, 12.35, 2382.0], [60, 19.95, 2357.7], [70, 31.20, 2333.0], [80, 47.42, 2308.0], [90, 70.18, 2282.5], [100, 101.42, 2256.4], [110, 143.38, 2229.7], [120, 198.67, 2202.1], [130, 270.28, 2173.7], [140, 361.53, 2144.3], [150, 476.16, 2113.8], [160, 618.23, 2082.0], [170, 792.18, 2048.8], [180, 1002.8, 2014.2], [190, 1255.2, 1977.9], [200, 1554.9, 1939.8]];
  const R = 0.4615, K = 273.15;
  const at = (T) => TAB.find((r) => r[0] === T);
  function draw() {
    const c = QSim.col(), T1 = S.val("T1"), T2 = S.val("T2"), Tq = S.val("Tq");
    const [a, b] = T1 < T2 ? [T1, T2] : [T2, T1];
    const v = QSim.view(cv, 0.55);
    const f = QSim.frame(v, { x0: 1000 / (200 + K) - 0.05, x1: 1000 / (20 + K) + 0.05, y0: 0, y1: 8, xl: "1000/T (1/K)", yl: "ln P (P: kPa)", pad: 34 });
    f.axes();
    TAB.forEach(([T, P]) => f.dot(1000 / (T + K), Math.log(P), T === a || T === b ? c.warn : c.ink3, T === a || T === b ? 6 : 4));
    if (a === b) { S.out("두 기준 온도를 다르게 고르세요."); return; }
    const p1 = at(a), p2 = at(b);
    const hfg = (R * Math.log(p2[1] / p1[1])) / (1 / (a + K) - 1 / (b + K));
    const lnP = (T) => Math.log(p1[1]) + (hfg / R) * (1 / (a + K) - 1 / (T + K));
    f.fn((x) => lnP(1000 / x - K), c.main, 2);
    const q = at(Tq), Pq = Math.exp(lnP(Tq)), href = (p1[2] + p2[2]) / 2;
    f.dot(1000 / (Tq + K), lnP(Tq), c.acc, 6);
    S.out(`기준 두 점 ${a} °C (${p1[1]} kPa), ${b} °C (${p2[1]} kPa)를 지나는 직선 (빨간 점, 파란 선)\n기울기로 구한 h_fg = ${hfg.toFixed(0)} kJ/kg, 두 온도의 증기표 h_fg 평균 ${href.toFixed(0)} kJ/kg (차이 ${(((hfg - href) / href) * 100).toFixed(1)}%)\n${Tq} °C 포화 압력 추정 ${Pq.toPrecision(4)} kPa, 증기표 ${q[1]} kPa (오차 ${(((Pq - q[1]) / q[1]) * 100).toFixed(1)}%) (초록 점)`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();
