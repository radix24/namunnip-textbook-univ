/* 전전5 전기전자재료공학 탐구 카드 묶음
   1 광전 효과(01-01)  2 무한 우물 준위(02-01)  3 장벽 투과(02-02)  4 FD와 MB(03-01)
   5 진성 운반자 농도(03-02)  6 도핑과 Fermi 준위(04-01)  7 띠 간격과 색(05-02) */
(() => {
  "use strict";
  if (!window.QSim) return;
  const C = () => QSim.col();
  const f2 = (x, d = 3) => (Math.abs(x) < 5e-13 ? 0 : x).toFixed(d);
  const ex = (x, d = 2) => x.toExponential(d);
  const kB = 8.617e-5;   // eV/K

  /* 진성 운반자 농도 모형: 300 K 값과 띠 간격에서 n_i(T) = n_i300 (T/300)^1.5 exp(−Eg/2k (1/T − 1/300)) */
  const MAT = {
    Si: { Eg: 1.12, ni300: 1e10, name: "Si" },
    Ge: { Eg: 0.66, ni300: 2e13, name: "Ge" },
    GaAs: { Eg: 1.42, ni300: 2e6, name: "GaAs" }
  };
  const ni = (m, T) => m.ni300 * Math.pow(T / 300, 1.5) * Math.exp(-m.Eg / (2 * kB) * (1 / T - 1 / 300));

  /* 3. 사각 장벽 투과 (정확한 식과 지수 근사) */
  (() => {
    const S = QSim.card("exp-e5-tunnel"); if (!S) return;
    const cv = S.$("canvas");
    const Tx = (E, V0, d, ms) => {
      const k = 5.123 * Math.sqrt(ms * (V0 - E)), s = Math.sinh(k * d);
      return 1 / (1 + V0 * V0 * s * s / (4 * E * (V0 - E)));
    };
    function draw() {
      const c = C(), V0 = S.val("v0"), E = S.val("e") * V0, d = S.val("d"), ms = +S.val("mass");
      const k = 5.123 * Math.sqrt(ms * (V0 - E));
      const v = QSim.view(cv, 0.5), fr = QSim.frame(v, { x0: 0, x1: 3, y0: -16, y1: 0, xl: "장벽 두께 d (nm)", yl: "log₁₀ T", pad: 34 }); fr.axes();
      fr.fn((x) => Math.log10(Tx(E, V0, x, ms)), c.main, 2.5);
      fr.fn((x) => Math.log10(16 * (E / V0) * (1 - E / V0) * Math.exp(-2 * k * x)), c.acc, 1.6, [6, 3]);
      const T = Tx(E, V0, d, ms);
      fr.dot(d, Math.max(-16, Math.log10(T)), c.warn, 6);
      S.out(`장벽 높이 V₀ = ${f2(V0, 2)} eV, 전자 에너지 E = ${f2(E, 2)} eV, m* = ${ms} m₀ → κ = √(2m*(V₀ − E))/ħ = ${f2(k, 2)} nm⁻¹\n` +
        `d = ${f2(d, 2)} nm: 투과 확률 T = ${ex(T, 2)} (정확한 식), 근사 16(E/V₀)(1 − E/V₀)e^(−2κd) = ${ex(16 * (E / V0) * (1 - E / V0) * Math.exp(-2 * k * d), 2)}\n` +
        `두께가 0.1 nm 늘 때마다 약 ${f2(Math.exp(0.2 * k), 2)}배씩 줄어듭니다(e^(0.2κ)). 파랑: 정확한 식, 주황 점선: 지수 근사. 얇은 장벽(κd < 1)에서는 근사가 맞지 않습니다.`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. Fermi-Dirac와 Maxwell-Boltzmann */
  (() => {
    const S = QSim.card("exp-e5-fermi"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), T = S.val("T"), dE = S.val("de"), kT = kB * T;
      const fd = (x) => 1 / (1 + Math.exp(x / kT)), mb = (x) => Math.exp(-x / kT);
      const v = QSim.view(cv, 0.5), fr = QSim.frame(v, { x0: -0.3, x1: 0.3, y0: 0, y1: 1.1, xl: "E − E_F (eV)", yl: "점유 확률" }); fr.axes();
      fr.path([[-0.3, 1], [0, 1], [0, 0], [0.3, 0]], c.ink3, 1.2, [2, 3]);
      fr.fn((x) => (mb(x) <= 1.1 ? mb(x) : NaN), c.acc, 2, [6, 3]);
      fr.fn(fd, c.main, 2.6);
      fr.path([[dE, 0], [dE, 1.1]], c.rule, 1);
      fr.dot(dE, fd(dE), c.warn, 6);
      const a = fd(dE), b = mb(dE);
      S.out(`T = ${T} K, kT = ${f2(kT * 1e3, 2)} meV. E − E_F = ${f2(dE, 3)} eV = ${f2(dE / kT, 2)} kT\n` +
        `FD f = ${a < 1e-3 ? ex(a, 3) : f2(a, 4)}, MB e^(−(E−E_F)/kT) = ${b < 1e-3 ? ex(b, 3) : b > 1e3 ? ex(b, 2) : f2(b, 4)}, MB/FD = ${f2(b / a, 4)}` +
        (dE < 0 ? " (E_F 아래에서는 MB가 1을 넘어 확률이 될 수 없음)" : b / a < 1.01 ? " (MB 근사 1% 안)" : "") +
        `\n빈 확률 1 − f = ${(1 - a) < 1e-3 ? ex(1 - a, 3) : f2(1 - a, 4)}. 파랑: FD, 주황 점선: MB, 회색 점선: 0 K 계단.`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 6. 도핑과 Fermi 준위 (Si, 완전 이온화) */
  (() => {
    const S = QSim.card("exp-e5-doping"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), typ = S.val("type"), N = Math.pow(10, S.val("n")), T = S.val("T"), kT = kB * T, Eg = MAT.Si.Eg;
      const n_i = ni(MAT.Si, T), net = typ === "n" ? N : -N;
      const n = net / 2 + Math.sqrt(net * net / 4 + n_i * n_i), p = n_i * n_i / n;
      const EF = kT * Math.log(n / n_i);   // E_i 기준
      const v = QSim.view(cv, 0.45), fr = QSim.frame(v, { x0: 0, x1: 10, y0: -0.75, y1: 0.75, yl: "E − E_i (eV)", pad: 40 }); fr.axes({ noGrid: true });
      fr.path([[0, Eg / 2], [7, Eg / 2]], c.ink, 2.5); fr.text("E_c", 7.2, Eg / 2 - 0.02, c.ink);
      fr.path([[0, -Eg / 2], [7, -Eg / 2]], c.ink, 2.5); fr.text("E_v", 7.2, -Eg / 2 - 0.02, c.ink);
      fr.path([[0, 0], [7, 0]], c.ink3, 1.2, [3, 3]); fr.text("E_i", 7.2, -0.02, c.ink3);
      fr.path([[0, EF], [7, EF]], c.warn, 2.2, [7, 3]); fr.text("E_F", 7.2, EF - 0.02, c.warn);
      S.out(`Si, ${typ === "n" ? "도너 N_D" : "억셉터 N_A"} = ${ex(N, 1)} cm⁻³, T = ${T} K, n_i = ${ex(n_i)} cm⁻³\n` +
        `n = ${ex(n)}, p = ${ex(p)} cm⁻³ (np = n_i² 확인: ${ex(n * p)}). 다수 운반자 ${typ === "n" ? "전자" : "정공"}, ` +
        `${N > 10 * n_i ? "외인성(도핑이 지배)" : N > 0.1 * n_i ? "도핑과 열 생성이 비슷" : "사실상 진성"}\n` +
        `E_F − E_i = kT ln(n/n_i) = ${f2(EF, 3)} eV, E_c − E_F ≈ ${f2(Eg / 2 - EF, 3)} eV (E_i를 띠 간격 가운데로 근사). ` +
        `${Eg / 2 - Math.abs(EF) < 3 * kT ? "E_F가 띠 끝에서 3kT 안: MB 근사와 완전 이온화 가정이 맞지 않는 영역입니다(축퇴)." : "도너·억셉터는 모두 이온화되었다고 가정했습니다."}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

})();
