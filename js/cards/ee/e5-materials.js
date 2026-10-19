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

  /* 1. 광전 효과 */
  (() => {
    const S = QSim.card("exp-e5-photo"); if (!S) return;
    const cv = S.$("canvas");
    const W = { Cs: 2.1, Na: 2.3, Zn: 4.3, Cu: 4.7 };
    function draw() {
      const c = C(), lam = S.val("lam"), m = S.val("metal"), phi = W[m], E = 1240 / lam, K = E - phi;
      const v = QSim.view(cv, 0.5), fr = QSim.frame(v, { x0: 0, x1: 8, y0: 0, y1: 4, xl: "광자 에너지 (eV)", yl: "K_max (eV)" }); fr.axes();
      Object.keys(W).forEach((k) => fr.fn((x) => (x > W[k] ? x - W[k] : NaN), k === m ? c.main : c.rule, k === m ? 2.6 : 1.4));
      Object.keys(W).forEach((k) => fr.text(k, W[k], 0.15, k === m ? c.main : c.ink3, "center"));
      fr.dot(Math.min(E, 8), Math.max(0, Math.min(K, 4)), K > 0 ? c.warn : c.ink3, 6);
      S.out(`λ = ${lam} nm → 광자 에너지 E = 1240/λ = ${f2(E, 2)} eV, 금속 ${m}의 일함수 φ = ${phi} eV(대표값)\n` +
        (K > 0 ? `K_max = E − φ = ${f2(K, 2)} eV, 저지 전압 ${f2(K, 2)} V, 가장 빠른 전자의 속력 ${ex(Math.sqrt(2 * K * 1.602e-19 / 9.109e-31), 2)} m/s`
               : `E < φ: 전자가 나오지 않습니다(빛의 세기와 무관)`) +
        `\n문턱 파장 1240/φ = ${f2(1240 / phi, 0)} nm. 직선의 기울기는 모든 금속에서 1(가로축을 진동수로 바꾸면 기울기 h), 가로축 절편이 일함수입니다.`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 무한 우물: E_n = 0.376 n² /(m* L²) eV, L은 nm */
  (() => {
    const S = QSim.card("exp-e5-well"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), L = S.val("L"), ms = +S.val("mass"), E1 = 0.376 / (ms * L * L);
      const En = [1, 2, 3, 4].map((n) => n * n * E1), top = En[3] * 1.18;
      const v = QSim.view(cv, 0.6), fr = QSim.frame(v, { x0: -0.15 * L, x1: 1.15 * L, y0: 0, y1: top, xl: "x (nm)", yl: "E (eV)", pad: 40 }); fr.axes({ noGrid: true });
      fr.path([[0, top], [0, 0], [L, 0], [L, top]], c.ink, 2.5);
      const amp = E1 * 0.9;
      En.forEach((E, i) => {
        fr.path([[0, E], [L, E]], c.rule, 1, [4, 3]);
        fr.fn((x) => (x >= 0 && x <= L ? E + amp * Math.sin((i + 1) * Math.PI * x / L) ** 2 : NaN), [c.main, c.acc, c.warn, c.ink2][i], 2, undefined, 300);
        fr.text(`n=${i + 1}  ${E >= 0.1 ? f2(E, 3) + " eV" : f2(E * 1e3, 1) + " meV"}`, 1.02 * L, E, c.ink2);
      });
      const d21 = En[1] - En[0];
      S.out(`L = ${f2(L, 1)} nm, m* = ${ms} m₀ → E₁ = ${f2(E1 * 1e3, 2)} meV, E₂ = ${f2(En[1] * 1e3, 1)} meV, E₃ = ${f2(En[2] * 1e3, 1)} meV, E₄ = ${f2(En[3] * 1e3, 1)} meV\n` +
        `E₂ − E₁ = ${f2(d21 * 1e3, 1)} meV → 이 전이의 광자 파장 ${d21 > 0 ? f2(1240 / d21 / 1000, 2) + " μm" : "-"}. 실온 kT = 25.9 meV와 비교하면 간격이 ${d21 > 0.0259 * 3 ? "충분히 커 준위가 뚜렷합니다" : "열에너지와 비슷하거나 작아 준위가 열로 섞입니다"}.\n` +
        `곡선은 각 준위의 확률 밀도 |ψ|² = (2/L)sin²(nπx/L)을 그 에너지 높이에 그린 것입니다(크기는 보기 좋게 맞춤). 마디 수는 n − 1.`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

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

  /* 5. 진성 운반자 농도와 온도 */
  (() => {
    const S = QSim.card("exp-e5-ni"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), T = S.val("T"), Nd = Math.pow(10, S.val("nd"));
      const v = QSim.view(cv, 0.55), fr = QSim.frame(v, { x0: 200, x1: 700, y0: 0, y1: 18, xl: "T (K)", yl: "log₁₀ n_i (cm⁻³)", pad: 34 }); fr.axes();
      const cols = { Ge: c.acc, Si: c.main, GaAs: c.warn };
      Object.keys(MAT).forEach((k) => fr.fn((t) => Math.log10(ni(MAT[k], t)), cols[k], 2.4));
      fr.path([[200, Math.log10(Nd)], [700, Math.log10(Nd)]], c.ink3, 1.4, [6, 3]);
      fr.path([[T, 0], [T, 18]], c.rule, 1);
      Object.keys(MAT).forEach((k) => fr.dot(T, Math.log10(ni(MAT[k], T)), cols[k], 5));
      // n_i = N_D가 되는 온도(이분법)
      const cross = (m) => { let lo = 200, hi = 2000; if (ni(m, lo) >= Nd) return lo; for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (ni(m, mid) < Nd) lo = mid; else hi = mid; } return (lo + hi) / 2; };
      S.out(`T = ${T} K: n_i(Ge) = ${ex(ni(MAT.Ge, T))}, n_i(Si) = ${ex(ni(MAT.Si, T))}, n_i(GaAs) = ${ex(ni(MAT.GaAs, T))} cm⁻³\n` +
        `도핑 ${ex(Nd, 0)} cm⁻³(회색 점선)과 n_i가 같아지는 온도: Ge ${f2(cross(MAT.Ge), 0)} K, Si ${f2(cross(MAT.Si), 0)} K, GaAs ${f2(cross(MAT.GaAs), 0)} K. 이보다 뜨거우면 도핑보다 열로 생긴 운반자가 많아집니다.\n` +
        `모형: 300 K 값(Ge 2×10¹³, Si 10¹⁰, GaAs 2×10⁶, 확인 필요)과 띠 간격(0.66, 1.12, 1.42 eV, 온도 변화 무시)으로 n_i ∝ T^1.5 e^(−Eg/2kT). 주황: Ge, 파랑: Si, 빨강: GaAs.`);
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

  /* 7. 띠 간격, 양자점 크기와 색 */
  (() => {
    const S = QSim.card("exp-e5-color"); if (!S) return;
    const cv = S.$("canvas");
    /* 파장(nm) → 대략의 sRGB (가시광 근사 공식) */
    const rgb = (w) => {
      let r = 0, g = 0, b = 0;
      if (w >= 380 && w < 440) { r = (440 - w) / 60; b = 1; } else if (w < 490) { g = (w - 440) / 50; b = 1; }
      else if (w < 510) { g = 1; b = (510 - w) / 20; } else if (w < 580) { r = (w - 510) / 70; g = 1; }
      else if (w < 645) { r = 1; g = (645 - w) / 65; } else if (w <= 780) { r = 1; }
      const a = w < 380 || w > 780 ? 0 : w < 420 ? 0.3 + 0.7 * (w - 380) / 40 : w > 700 ? 0.3 + 0.7 * (780 - w) / 80 : 1;
      return `rgb(${Math.round(255 * r * a)},${Math.round(255 * g * a)},${Math.round(255 * b * a)})`;
    };
    const name = (w) => w < 380 ? "자외선" : w < 430 ? "보라" : w < 490 ? "파랑" : w < 560 ? "초록" : w < 590 ? "노랑" : w < 620 ? "주황" : w <= 780 ? "빨강" : "적외선";
    function draw() {
      const c = C(), mode = S.val("mode");
      let E, info;
      if (mode === "eg") { E = S.val("eg"); info = `띠 간격 E_g = ${f2(E, 2)} eV인 직접 띠 간격 반도체의 띠 끝 발광`; }
      else {
        const R = S.val("r"), conf = 0.376 / (R * R) * (1 / 0.13 + 1 / 0.45);
        E = 1.74 + conf; info = `양자점 반지름 R = ${f2(R, 1)} nm: E = 1.74 + 0.376/R² × (1/0.13 + 1/0.45) = 1.74 + ${f2(conf, 3)} = ${f2(E, 3)} eV (5.2절 단순 모형)`;
      }
      const lam = 1240 / E, sig = 12;
      const v = QSim.view(cv, 0.45), fr = QSim.frame(v, { x0: 300, x1: 900, y0: -0.25, y1: 1.1, xl: "파장 (nm)", pad: 30 }); fr.axes({ noGrid: true });
      const g = v.g;
      for (let w = 380; w < 780; w += 2) { g.fillStyle = rgb(w); g.fillRect(fr.X(w), fr.Y(-0.05), fr.X(w + 2) - fr.X(w) + 0.5, fr.Y(-0.22) - fr.Y(-0.05)); }
      fr.fn((w) => Math.exp(-((w - lam) ** 2) / (2 * sig * sig)), c.ink, 2.4, undefined, 600);
      if (lam >= 380 && lam <= 780) { g.fillStyle = rgb(lam); g.fillRect(fr.X(820), fr.Y(1.0), 40, 40); }
      fr.text(`${f2(lam, 0)} nm`, Math.min(Math.max(lam, 330), 860), 1.04, c.ink2, "center");
      S.out(`${info}\n발광 파장 λ = 1240/E = ${f2(lam, 0)} nm → ${name(lam)}. 아래 띠는 가시광(약 380~780 nm), 곡선은 폭을 가정한 발광 스펙트럼(표준편차 12 nm, 실제 폭은 소재마다 다름)입니다.`);
      S.$$("[data-mode]").forEach((el) => { el.style.display = el.dataset.mode === mode ? "" : "none"; });
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
