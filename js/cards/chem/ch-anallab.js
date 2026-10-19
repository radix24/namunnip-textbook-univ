/* 화학과 분석화학 실습 카드 (화학8 분석화학2)
   스펙트럼을 여러 번 더할 때 신호 대 잡음비 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const RED = "#b5562a";


  /* 1. 신호 평균으로 잡음 줄이기 (화학8-06-02) */
  (() => {
    const S = QSim.card("lab-ch8-snr"); if (!S) return;
    const cv = S.$("canvas");
    const NP = 200, X = Array.from({ length: NP }, (_, i) => i);
    const TRUE = X.map((x) => Math.exp(-((x - 100) ** 2) / (2 * 36)));   // 봉우리 높이 1, 표준 편차 6점
    const BASE = X.filter((x) => x < 60 || x >= 140);                      // 잡음을 재는 바탕 구간
    const getSeed = QChem.seedButton(S, () => draw());
    function draw() {
      const c = C(), n = Math.pow(2, S.val("lk")), sig = S.val("sig"), r = QChem.rng(1000 + getSeed());
      const avg = new Array(NP).fill(0);
      for (let k = 0; k < n; k++) for (let i = 0; i < NP; i++) avg[i] += TRUE[i] + sig * QChem.gauss(r);
      for (let i = 0; i < NP; i++) avg[i] /= n;
      const noise = QChem.sd(BASE.map((i) => avg[i])), snr = 1 / noise, theo = Math.sqrt(n) / sig;
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: NP - 1, y0: -1.6, y1: 2.4, xl: "측정 점 (파장 또는 시간)", yl: "신호", pad: 34 });
      f.axes({ noGrid: true });
      f.path(X.map((x) => [x, avg[x]]), c.ink3, 1.2);
      f.path(X.map((x) => [x, TRUE[x]]), RED, 2);
      S.out(`평균한 횟수 n = ${n}, 한 번 측정의 잡음 σ = ${sig.toFixed(2)} (봉우리 높이 1)\n바탕 구간에서 잰 잡음 ${noise.toFixed(3)} → S/N = ${snr.toFixed(1)}\n이론 S/N = √n/σ = ${theo.toFixed(1)}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
