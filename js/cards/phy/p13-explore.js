/* 물리13 탐구 카드: 정준 앙상블의 점유와 비열 */
(() => {
  "use strict";
  const C = () => QSim.col();

  /* 1. 정준 앙상블: 준위 점유, Z, U, C (02-02). 에너지 단위 ε */
  (() => {
    const S = QSim.card("lab-p13-canonical"); if (!S) return;
    const [cv1, cv2] = S.$$("canvas");
    const levels = (model) => {
      if (model === "two") return [[0, 1], [1, 1]];
      if (model === "ho") return Array.from({ length: 400 }, (_, n) => [n, 1]);
      return Array.from({ length: 200 }, (_, l) => [l * (l + 1), 2 * l + 1]);
    };
    function thermo(model, T) {
      const L = levels(model); let Z = 0, U = 0, U2 = 0;
      L.forEach(([E, g]) => { const w = g * Math.exp(-E / T); Z += w; U += E * w; U2 += E * E * w; });
      U /= Z; U2 /= Z; return { Z, U, C: (U2 - U * U) / (T * T), S: Math.log(Z) + U / T, L };
    }
    function draw() {
      const c = C(), model = S.val("model"), T = S.val("T"), r = thermo(model, T);
      const v = QSim.view(cv1, 0.4), show = r.L.slice(0, 8), f = QSim.frame(v, { x0: -0.5, x1: 7.5, y0: 0, y1: 1.05, xl: "준위", yl: "점유 확률" }); f.axes({ noGrid: true });
      show.forEach(([E, g], i) => { const p = g * Math.exp(-E / T) / r.Z; f.path([[i, 0], [i, p]], c.main, 18); f.text(`${E}ε`, i - 0.25, -0.0, c.ink2); });
      const v2 = QSim.view(cv2, 0.42), Tm = 5, h = QSim.frame(v2, { x0: 0, x1: Tm, y0: 0, y1: model === "two" ? 0.5 : 1.25, xl: "kT/ε", yl: "C/k" }); h.axes();
      h.fn((t) => t < 0.02 ? 0 : thermo(model, t).C, c.main, 2.2, null, 250);
      h.path([[0, 1], [Tm, 1]], c.ink3, 1, [5, 4]);
      h.dot(T, r.C, c.acc, 5);
      S.out(`kT = ${T} ε: 분배함수 Z = ${r.Z.toFixed(4)}\n평균 에너지 U = ${r.U.toFixed(4)} ε, 비열 C = ${r.C.toFixed(4)} k, 엔트로피 S = ${r.S.toFixed(4)} k\n위: 준위별 점유 확률(g e^{−E/kT}/Z), 아래: 온도에 따른 비열(점선 C = k는 고온 등분배 값)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
