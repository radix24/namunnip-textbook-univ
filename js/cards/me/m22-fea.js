/* 기계22 컴퓨터해석기반설계: 테이퍼 막대의 격자 수렴 (03-01) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-meshconv"); if (!S) return;
  const [cv] = S.$$("canvas");
  // 무차원: 길이 L = 1, 뿌리 넓이 A0 = 1, 탄성계수 E = 1, 끝 하중 P = 1
  function draw() {
    const c = QSim.col(), N = Math.round(S.val("n")), r = S.val("r"), k = 1 - r;
    const A = (x) => 1 - k * x;
    const uEx = (x) => (k < 1e-9 ? x : -Math.log(1 - k * x) / k), sEx = (x) => 1 / A(x);
    // 선형 막대 요소를 직렬로 조립: 요소 강성 E·A(중점)/h, 고정단에서 하중 P가 모든 요소를 지남
    const h = 1 / N, nodes = [[0, 0]], els = [];
    let u = 0;
    for (let e = 0; e < N; e++) { const Am = A((e + 0.5) * h); u += h / Am; nodes.push([(e + 1) * h, u]); els.push([e * h, (e + 1) * h, 1 / Am]); }
    const uE = uEx(1), sE = sEx(1), sF = Math.max(...els.map((q) => q[2]));
    const us = 0.9 / uE, ss = 0.9 / sE;
    const v = QSim.view(cv, 0.6), f = QSim.frame(v, { x0: 0, x1: 1, y0: 0, y1: 2.1, xl: "x / L", pad: 30 });
    f.axes({ noGrid: true });
    f.path([[0, 1.05], [1, 1.05]], c.rule, 1);
    f.text("변위 u", 0.01, 2.02, c.main); f.text("응력 σ", 0.01, 0.97, c.warn);
    f.fn((x) => 1.1 + uEx(x) * us, c.ink3, 1.5, [4, 3], 200);
    f.path(nodes.map(([x, y]) => [x, 1.1 + y * us]), c.main, 2);
    if (N <= 32) nodes.forEach(([x, y]) => f.dot(x, 1.1 + y * us, c.main, 3));
    f.fn((x) => sEx(x) * ss, c.ink3, 1.5, [4, 3], 200);
    els.forEach(([a, b, s]) => f.path([[a, s * ss], [b, s * ss]], c.warn, 2.5));
    const eu = ((u - uE) / uE) * 100, es = ((sF - sE) / sE) * 100;
    S.out(`요소 ${N}개, 끝 넓이/뿌리 넓이 = ${r.toFixed(2)} (무차원 P = E = A₀ = L = 1)\n끝 변위: 유한요소 ${u.toFixed(5)}, 정확한 값 ${uE.toFixed(5)}, 오차 ${eu.toFixed(3)}%\n최대 응력: 유한요소 ${sF.toFixed(4)} (마지막 요소 평균), 정확한 값 ${sE.toFixed(4)} (끝), 오차 ${es.toFixed(2)}%`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();
