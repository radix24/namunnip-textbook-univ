/* 물리8 탐구 카드 묶음: 조화 진동자 고유함수, 고유함수 전개와 완비성 */
(() => {
  "use strict";
  const C = () => QSim.col();

  /* 1. 조화 진동자 고유함수와 고전 확률 (02-04). ξ = x/√(ħ/mω) */
  (() => {
    const S = QSim.card("lab-p8-ladder"); if (!S) return;
    const cv = S.$("canvas");
    function psi(n, x) {   // 정규화된 Hermite 함수, 점화식
      let p0 = Math.pow(Math.PI, -0.25) * Math.exp(-x * x / 2); if (n === 0) return p0;
      let p1 = Math.SQRT2 * x * p0;
      for (let k = 2; k <= n; k++) { const p2 = Math.sqrt(2 / k) * x * p1 - Math.sqrt((k - 1) / k) * p0; p0 = p1; p1 = p2; }
      return p1;
    }
    function draw() {
      const c = C(), n = S.val("n"), A = Math.sqrt(2 * n + 1), L = Math.max(4, A + 2.5);
      const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: -L, x1: L, y0: -0.8, y1: 0.8, xl: "ξ", yl: "" }); f.axes();
      f.path([[-A, -0.8], [-A, 0.8]], c.ink3, 1, [3, 4]); f.path([[A, -0.8], [A, 0.8]], c.ink3, 1, [3, 4]);
      f.fn((x) => Math.abs(x) < A * 0.999 ? 1 / (Math.PI * Math.sqrt(A * A - x * x)) : NaN, c.acc, 1.8, [6, 4], 800);
      f.fn((x) => psi(n, x), c.soft, 1.3, null, 800);
      f.fn((x) => psi(n, x) ** 2, c.main, 2.4, null, 800);
      let out = 0, nodes = 0, prev = psi(n, -L), h = 0.002;   // 고전 금지 영역 확률, 마디 수
      for (let x = -L - 6; x < L + 6; x += h) { const p = psi(n, x); if (Math.abs(x) > A) out += p * p * h; }
      for (let x = -L + h; x <= L; x += h) { const p = psi(n, x); if (p * prev < 0) nodes++; prev = p; }
      S.out(`n = ${n}: 에너지 E = (n + ½)ħω = ${(n + 0.5).toFixed(1)} ħω, 고전 되돌이점 ξ = ±${A.toFixed(3)} (세로 점선)\n마디 수 ${nodes}, 고전적으로 금지된 |ξ| > ${A.toFixed(2)}에서 찾을 확률 ${(out * 100).toFixed(1)}%\n파랑: |ψₙ|², 옅은 선: ψₙ, 주황 점선: 고전 진동자의 확률 밀도 1/(π√(2n+1−ξ²))`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 무한 우물 고유함수로 함수 전개하기: 완비성 (03-01). L = 1 */
  (() => {
    const S = QSim.card("lab-p8-complete"); if (!S) return;
    const [cv1, cv2] = S.$$("canvas");
    const F = {   // 규격화 전의 모양
      tri: (x) => x < 0.5 ? x : 1 - x,
      par: (x) => x * (1 - x),
      box: (x) => x > 0.25 && x < 0.75 ? 1 : 0,
      off: (x) => x < 0.5 ? 1 : 0,
    };
    const M = 2000;
    function draw() {
      const c = C(), kind = S.val("fn"), N = S.val("N"), f0 = F[kind];
      let nrm = 0; for (let i = 0; i < M; i++) { const x = (i + 0.5) / M; nrm += f0(x) ** 2 / M; } nrm = Math.sqrt(nrm);
      const f = (x) => f0(x) / nrm, ph = (n, x) => Math.SQRT2 * Math.sin(n * Math.PI * x);
      const cn = []; for (let n = 1; n <= 40; n++) { let s = 0; for (let i = 0; i < M; i++) { const x = (i + 0.5) / M; s += ph(n, x) * f(x) / M; } cn.push(s); }
      const part = (x) => { let s = 0; for (let n = 1; n <= N; n++) s += cn[n - 1] * ph(n, x); return s; };
      const ymax = Math.max(...Array.from({ length: 101 }, (_, i) => Math.abs(f(i / 100)))) * 1.3;
      const v = QSim.view(cv1, 0.45), g = QSim.frame(v, { x0: 0, x1: 1, y0: -0.3 * ymax, y1: ymax, xl: "x/L", yl: "ψ" }); g.axes();
      g.fn(f, c.ink3, 1.6, [5, 4], 800); g.fn(part, c.main, 2.2, null, 800);
      const v2 = QSim.view(cv2, 0.32), h = QSim.frame(v2, { x0: 0.3, x1: 12.7, y0: 0, y1: 1.05, xl: "n", yl: "|cₙ|²" }); h.axes({ noGrid: true });
      for (let n = 1; n <= 12; n++) h.path([[n, 0], [n, cn[n - 1] ** 2]], n <= N ? c.main : c.ink3, 10);
      let sum = 0; for (let n = 1; n <= N; n++) sum += cn[n - 1] ** 2;
      let err = 0; for (let i = 0; i < M; i++) { const x = (i + 0.5) / M; err += (f(x) - part(x)) ** 2 / M; }
      S.out(`항 수 N = ${N}: 계수 c₁, c₂, c₃ = ${cn.slice(0, 3).map((x) => x.toFixed(4)).join(", ")}\n합 Σ|cₙ|² (n ≤ N) = ${sum.toFixed(5)}  ← N이 커지면 1로 (완비성)\n남은 오차 ∫|ψ − 부분합|²dx = ${err.toExponential(2)} (= 1 − Σ|cₙ|²)\n회색 점선: 원래 함수, 파랑: N항까지 더한 것`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
