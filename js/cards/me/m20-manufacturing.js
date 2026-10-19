/* 기계20 생산공학: Taylor 공구 수명과 절삭 속도의 경제성 (03-02) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-taylor"); if (!S) return;
  const [cv] = S.$$("canvas");
  const K = 125.66, TH = 1; // 절삭 경로 길이(m): 지름 50 mm, 길이 200 mm, 이송 0.25 mm/rev / 취급 시간(min)
  function draw() {
    const c = QSim.col(), n = S.val("n"), C = S.val("C"), M = S.val("M"), tc = S.val("tc"), Ct = S.val("Ct") * 1000;
    const T = (V) => (C / V) ** (1 / n), tm = (V) => K / V;
    const cost = (V) => M * (TH + tm(V)) + (tm(V) / T(V)) * (M * tc + Ct);
    const time = (V) => TH + tm(V) + (tm(V) / T(V)) * tc;
    const Tc = (1 / n - 1) * (tc + Ct / M), Vc = C / Tc ** n; // 최소 원가
    const Tp = (1 / n - 1) * tc, Vp = C / Tp ** n; // 최대 생산율
    const x0 = 0.3 * Vc, x1 = Math.min(1.8 * Vp, 0.98 * C);
    const cmin = cost(Vc), ymax = cmin * 2;
    const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0, x1, y0: 0, y1: ymax, xl: "절삭 속도 V (m/min)", yl: "부품당 원가 (원)", pad: 46 });
    f.axes();
    f.fn((V) => Math.min(ymax, cost(V)), c.main, 2.5, null, 300);
    f.fn((V) => Math.min(ymax, M * (TH + tm(V))), c.ink3, 1.2, [4, 3], 200);
    f.fn((V) => Math.min(ymax, (tm(V) / T(V)) * (M * tc + Ct)), c.acc, 1.2, [4, 3], 200);
    f.dot(Vc, cmin, c.warn, 5);
    if (Vp < x1) f.path([[Vp, 0], [Vp, ymax]], c.ink2, 1, [2, 3]);
    f.text("기계 비용", x0 + 0.02 * (x1 - x0), Math.min(ymax * 0.95, M * (TH + tm(x0))) - ymax * 0.05, c.ink3);
    S.out(`n = ${n}, C = ${C} m/min, 기계·인건비 ${M}원/min, 공구 교환 ${tc} min, 공구 날 하나 ${Ct.toLocaleString()}원\n최소 원가: V = ${Vc.toFixed(0)} m/min, 공구 수명 ${Tc.toFixed(1)} min, 부품당 ${Math.round(cmin).toLocaleString()}원, 부품당 ${time(Vc).toFixed(2)} min\n최대 생산율: V = ${Vp.toFixed(0)} m/min, 공구 수명 ${Tp.toFixed(1)} min, 부품당 ${time(Vp).toFixed(2)} min, 원가 ${Math.round(cost(Vp)).toLocaleString()}원`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();
