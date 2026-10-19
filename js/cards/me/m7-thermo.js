/* 기계7 기계공학실험(1) 3단원: K형 열전대의 기준 접점 보상 (03-01) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-tc"); if (!S) return;
  const [cv] = S.$$("canvas");
  // K형 표의 대표값 (기준 접점 0 °C, mV), 사이는 직선 보간
  const TAB = [[-50, -1.889], [0, 0], [20, 0.798], [50, 2.023], [100, 4.096], [200, 8.138], [300, 12.209], [400, 16.397]];
  const E = (T) => { for (let i = 1; i < TAB.length; i++) if (T <= TAB[i][0] || i === TAB.length - 1) { const [t0, e0] = TAB[i - 1], [t1, e1] = TAB[i]; return e0 + ((T - t0) * (e1 - e0)) / (t1 - t0); } };
  const Tof = (e) => { for (let i = 1; i < TAB.length; i++) if (e <= TAB[i][1] || i === TAB.length - 1) { const [t0, e0] = TAB[i - 1], [t1, e1] = TAB[i]; return t0 + ((e - e0) * (t1 - t0)) / (e1 - e0); } };
  function draw() {
    const c = QSim.col(), Th = S.val("Th"), Tr = S.val("Tr"), mode = S.val("mode");
    const V = E(Th) - E(Tr);
    const Tnaive = Tof(V), Tcomp = Tof(V + E(Tr));
    const Tread = mode === "comp" ? Tcomp : Tnaive;
    const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: -50, x1: 400, y0: -2.5, y1: 17, xl: "온도 (°C)", yl: "E (mV, 기준 0 °C)", pad: 36 });
    f.axes();
    f.path(TAB.map(([t, e]) => [t, e]), c.main, 2);
    f.dot(Tr, E(Tr), c.acc, 5); f.dot(Th, E(Th), c.warn, 6);
    f.arrow(Tr, E(Tr), 0, V, c.ink2, "V 측정");
    if (mode !== "comp") { f.path([[-50, V], [Tnaive, V]], c.ink3, 1, [4, 3]); f.dot(Tnaive, V, c.ink2, 5); }
    S.out(`측정 접점 ${Th} °C, 기준 접점 ${Tr} °C → 열전대 전압 V = E(${Th}) − E(${Tr}) = ${E(Th).toFixed(3)} − ${E(Tr).toFixed(3)} = ${V.toFixed(3)} mV\n보상 없이 V를 표에서 바로 읽으면 ${Tnaive.toFixed(1)} °C (오차 ${(Tnaive - Th).toFixed(1)} °C)\n기준 접점 보상: E = V + E(${Tr}) = ${(V + E(Tr)).toFixed(3)} mV → ${Tcomp.toFixed(1)} °C\n계기 표시값 (${mode === "comp" ? "보상 켬" : "보상 끔"}): ${Tread.toFixed(1)} °C`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();
