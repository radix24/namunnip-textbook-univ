/* 물리13 탐구 카드 묶음: 정준 앙상블의 점유와 비열, 세 가지 분포 비교 */
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

  /* 2. Fermi-Dirac, Bose-Einstein, Maxwell-Boltzmann 점유 수 (04-01) */
  (() => {
    const S = QSim.card("lab-p13-qstat"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), T = S.val("T"), mu = S.val("mu"), E0 = S.val("E");
      const fd = (E) => 1 / (Math.exp((E - mu) / T) + 1), be = (E) => E > mu ? 1 / (Math.exp((E - mu) / T) - 1) : NaN, mb = (E) => Math.exp(-(E - mu) / T);
      const v = QSim.view(cv, 0.52), f = QSim.frame(v, { x0: 0, x1: 6, y0: 0, y1: 2.2, xl: "E", yl: "평균 점유 수" }); f.axes();
      f.path([[mu, 0], [mu, 2.2]], c.ink3, 1, [3, 4]);
      f.fn(mb, c.ink2, 1.8, [6, 4], 600); f.fn(be, c.acc, 2.2, null, 600); f.fn(fd, c.main, 2.4, null, 600);
      f.path([[E0, 0], [E0, 2.2]], c.warn, 1, [2, 3]);
      const x = (E0 - mu) / T, a = fd(E0), b = be(E0), m = mb(E0);
      S.out(`kT = ${T}, μ = ${mu}, 고른 에너지 E = ${E0} → (E − μ)/kT = ${x.toFixed(3)}\nFermi-Dirac ${a.toFixed(4)} (파랑), Bose-Einstein ${isFinite(b) ? b.toFixed(4) : "정의 안 됨 (E ≤ μ)"} (주황), Maxwell-Boltzmann ${m.toFixed(4)} (회색 점선)\n${isFinite(b) && Math.abs(b - a) / m < 0.05 ? "세 분포가 5% 안으로 같다: 고전 극한" : "세 분포가 뚜렷이 다르다: 양자 통계가 필요"}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 맞닿은 두 Einstein 고체: 다중도의 곱과 열평형 (02-01) */
  (() => {
    const S = QSim.card("lab-p13-einstein"); if (!S) return;
    const cv = S.$("canvas");
    const lgam = (z) => {   // ln Γ(z), Lanczos
      const g = 7, p = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
      if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgam(1 - z);
      z -= 1; let x = p[0]; for (let i = 1; i < g + 2; i++) x += p[i] / (z + i); const t = z + g + 0.5;
      return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
    };
    const lnOm = (N, q) => lgam(q + N) - lgam(q + 1) - lgam(N);   // ln C(q+N−1, q)
    function draw() {
      const c = C(), NA = S.val("NA"), NB = S.val("NB"), q = S.val("q");
      const L = []; let mx = -Infinity;
      for (let a = 0; a <= q; a++) { const s = lnOm(NA, a) + lnOm(NB, q - a); L.push(s); mx = Math.max(mx, s); }
      const P = L.map((s) => Math.exp(s - mx)), Z = P.reduce((x, y) => x + y, 0), pr = P.map((x) => x / Z);
      let best = 0; pr.forEach((x, i) => { if (x > pr[best]) best = i; });
      let mean = 0, m2 = 0; pr.forEach((x, i) => { mean += i * x; m2 += i * i * x; }); const sd = Math.sqrt(m2 - mean * mean);
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: q, y0: 0, y1: pr[best] * 1.15, xl: "고체 A의 에너지 양자 수 q_A", yl: "확률" }); f.axes();
      f.path(pr.map((x, i) => [i, x]), c.main, 2.2); f.dot(best, pr[best], c.acc, 5);
      const Stot = (mx + Math.log(Z)) / Math.LN10;
      S.out(`N_A = ${NA}, N_B = ${NB}, 전체 양자 q = ${q}\n가장 가능성 큰 q_A = ${best} (q_A/N_A = ${(best / NA).toFixed(3)}, q_B/N_B = ${((q - best) / NB).toFixed(3)}: 진동자당 에너지가 같아짐 = 온도가 같음)\n분포의 폭(표준편차) ${sd.toFixed(2)}, 상대 폭 ${(sd / mean * 100).toFixed(1)}%\n전체 미시 상태 수 약 10^${Stot.toFixed(1)}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
