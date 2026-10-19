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

/* 기계10 3단원: 습공기 선도 위의 냉각 제습과 재열 (03-02) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-psychro"); if (!S) return;
  const [cv] = S.$$("canvas");
  const P = 101.325;
  const Pg = (T) => 0.61094 * Math.exp((17.625 * T) / (T + 243.04)); // kPa, Magnus 근사 (0~50 °C)
  const Tdp = (pv) => { const x = Math.log(pv / 0.61094); return (243.04 * x) / (17.625 - x); };
  const W = (pv) => (0.622 * pv) / (P - pv);
  const H = (T, w) => 1.005 * T + w * (2501 + 1.82 * T);
  const PvOf = (w) => (w * P) / (0.622 + w);
  function draw() {
    const c = QSim.col(), T1 = S.val("T1"), RH = S.val("RH") / 100, T2 = S.val("T2"), T3 = Math.max(S.val("T3"), T2);
    const pv1 = RH * Pg(T1), w1 = W(pv1), d1 = Tdp(pv1), h1 = H(T1, w1);
    const wet = T2 < d1, w2 = wet ? W(Pg(T2)) : w1, h2 = H(T2, w2), dw = w1 - w2;
    const q12 = h1 - h2 - dw * 4.186 * T2, h3 = H(T3, w2), q23 = h3 - h2, rh3 = PvOf(w2) / Pg(T3);
    const v = QSim.view(cv, 0.6), f = QSim.frame(v, { x0: 0, x1: 45, y0: 0, y1: 30, xl: "건구 온도 (°C)", yl: "ω (g/kg 건공기)", pad: 34 });
    f.axes();
    [0.2, 0.4, 0.6, 0.8, 1].forEach((r) => { f.fn((T) => { const w = W(r * Pg(T)) * 1000; return w <= 30 ? w : NaN; }, r === 1 ? c.ink : c.ink3, r === 1 ? 2 : 1, r === 1 ? null : [3, 3]); });
    // 과정 1 → (이슬점) → 2 → 3
    const path12 = [[T1, w1 * 1000]];
    if (wet) { path12.push([d1, w1 * 1000]); for (let T = d1; T >= T2; T -= 0.25) path12.push([T, W(Pg(T)) * 1000]); }
    path12.push([T2, w2 * 1000]);
    f.path(path12, c.main, 2.5); f.path([[T2, w2 * 1000], [T3, w2 * 1000]], c.warn, 2.5);
    f.dot(T1, w1 * 1000, c.main, 6); f.text("1", T1 + 0.6, w1 * 1000 + 0.6, c.main);
    f.dot(T2, w2 * 1000, c.acc, 6); f.text("2", T2 - 1.4, w2 * 1000 + 0.6, c.acc);
    f.dot(T3, w2 * 1000, c.warn, 6); f.text("3", T3 + 0.6, w2 * 1000 + 0.6, c.warn);
    if (wet) f.dot(d1, w1 * 1000, c.ink2, 4);
    S.out(`1: ${T1} °C, 상대습도 ${(RH * 100).toFixed(0)}%, ω = ${(w1 * 1000).toFixed(1)} g/kg, 이슬점 ${d1.toFixed(1)} °C, h = ${h1.toFixed(1)} kJ/kg 건공기\n2: 코일 출구 ${T2} °C ${wet ? `(이슬점 아래: 포화, 물 ${(dw * 1000).toFixed(1)} g/kg 응축)` : "(이슬점 위: 물이 빠지지 않음)"}, ω = ${(w2 * 1000).toFixed(1)} g/kg, 상대습도 ${((PvOf(w2) / Pg(T2)) * 100).toFixed(0)}%\n코일 냉각량 ${q12.toFixed(1)} kJ/kg ${wet ? `(현열 약 ${((1.005 + 1.82 * w1) * (T1 - T2)).toFixed(1)}, 나머지는 물을 응축시킨 잠열)` : "(모두 현열)"}\n3: 재열 ${T3} °C, 재열량 ${q23.toFixed(1)} kJ/kg, 공급 공기 상대습도 ${(rh3 * 100).toFixed(0)}%`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();
