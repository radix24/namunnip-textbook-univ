/* 화학과 분석화학 실습 카드 묶음 (화학1 분석화학1, 화학3 분석화학실험, 화학8 분석화학2)
   t 검정, 검량선과 표준물 첨가, 다양성자산, 일양성자산 적정과 지시약, EDTA 적정, 산화환원 적정, 적정 불확도, 전위차 적정 종말점,
   van Deemter와 분리능, 순환 전압전류 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const Q = window.QChem;
  const { sci, mean, sd, tcrit, linfit, bisect } = Q;
  const Kw = 1e-14;
  const RED = "#b5562a", GRN = "#2f8f5b";

  /* 1. 두 분석법 비교: 신뢰구간과 t 검정 (화학1-01-02, 01-03) */
  (() => {
    const S = QSim.card("lab-ch1-ttest"); if (!S) return;
    const cv = S.$("canvas");
    let seed;
    function data() {
      const r = Q.rng(seed() * 7919), n = S.val("n"), s = S.val("s"), d = S.val("d");
      const A = [], B = [];
      for (let i = 0; i < n; i++) A.push(10 + s * Q.gauss(r));
      for (let i = 0; i < n; i++) B.push(10 + d + s * Q.gauss(r));
      return { A, B, n };
    }
    function draw() {
      const c = C(), { A, B, n } = data();
      const mA = mean(A), mB = mean(B), sA = sd(A), sB = sd(B);
      const t1 = tcrit(n - 1), ciA = t1 * sA / Math.sqrt(n), ciB = t1 * sB / Math.sqrt(n);
      const sp = Math.sqrt(((n - 1) * sA * sA + (n - 1) * sB * sB) / (2 * n - 2));
      const tc = Math.abs(mA - mB) / (sp * Math.sqrt(2 / n)), tt = tcrit(2 * n - 2);
      const lo = Math.min(...A, ...B, mA - ciA, mB - ciB), hi = Math.max(...A, ...B, mA + ciA, mB + ciB), pad = (hi - lo) * 0.15 + 0.02;
      const v = QSim.view(cv, 0.48), f = QSim.frame(v, { x0: 0, x1: 3, y0: lo - pad, y1: hi + pad, yl: "Fe 함량 (mg/g)", pad: 46, noGrid: false });
      f.axes();
      const col = [c.main, RED];
      [[A, mA, ciA, 1], [B, mB, ciB, 2]].forEach(([D, m, ci, x], k) => {
        D.forEach((y, i) => f.dot(x - 0.25 + 0.5 * (i + 0.5) / D.length, y, col[k], 3.5));
        f.path([[x - 0.35, m], [x + 0.35, m]], col[k], 3);
        f.path([[x + 0.42, m - ci], [x + 0.42, m + ci]], col[k], 2);
        f.path([[x + 0.37, m - ci], [x + 0.47, m - ci]], col[k], 2); f.path([[x + 0.37, m + ci], [x + 0.47, m + ci]], col[k], 2);
      });
      f.text("방법 A (기준법)", 1, hi + pad * 0.55, c.main, "center"); f.text("방법 B (새 방법)", 2, hi + pad * 0.55, RED, "center");
      f.path([[0, 10], [3, 10]], c.ink3, 1, [4, 4]);
      const same = tc < tt;
      S.out(`가상 자료 ${seed()}번, 각 ${n}회 측정 (참값: A 10.000, B ${(10 + S.val("d")).toFixed(3)} mg/g)\n`
        + `A: 평균 ${mA.toFixed(3)}, s ${sA.toFixed(3)}, 95% 신뢰구간 ±${ciA.toFixed(3)}\n`
        + `B: 평균 ${mB.toFixed(3)}, s ${sB.toFixed(3)}, 95% 신뢰구간 ±${ciB.toFixed(3)}\n`
        + `합동 표준편차 ${sp.toFixed(3)}, t 계산값 ${tc.toFixed(2)}, t 표값(자유도 ${2 * n - 2}, 95%) ${tt.toFixed(3)}\n`
        + (same ? "t 계산값 < t 표값: 두 평균의 차이가 우연 오차로 설명된다 (다르다고 말할 근거 없음)" : "t 계산값 > t 표값: 95% 수준에서 두 방법의 평균이 다르다 (계통 오차 의심)"));
    }
    seed = Q.seedButton(S, draw);
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 검량선과 표준물 첨가법 (화학1-01-04, 화학3-04-01, 화학3-04-02) */
  (() => {
    const S = QSim.card("lab-ch1-calib"); if (!S) return;
    const cv = S.$("canvas");
    const m0 = 0.0500, b0 = 0.010, XS = [0, 2, 4, 6, 8, 10];
    let seed;
    function draw() {
      const c = C(), r = Q.rng(seed() * 104729), noise = S.val("noise"), cx = S.val("cx"), k = S.val("k"), fm = S.val("mat"), add = S.val("mode") === "add";
      const v = QSim.view(cv, 0.55);
      if (!add) {
        const ys = XS.map((x) => b0 + m0 * x + noise * Q.gauss(r));
        const L = linfit(XS, ys);
        const yu = []; for (let i = 0; i < k; i++) yu.push(b0 + fm * m0 * cx + noise * Q.gauss(r));
        const ybar = mean(yu), xu = (ybar - L.b) / L.m;
        const sx = (L.sy / Math.abs(L.m)) * Math.sqrt(1 / k + 1 / L.n + (ybar - L.my) ** 2 / (L.m * L.m * L.sxx));
        const f = QSim.frame(v, { x0: -0.5, x1: 12.5, y0: 0, y1: 0.7, xl: "농도 (ppm)", yl: "흡광도", pad: 40 }); f.axes();
        f.fn((x) => L.m * x + L.b, c.main, 2);
        XS.forEach((x, i) => f.dot(x, ys[i], c.main, 4.5));
        f.path([[-0.5, ybar], [xu, ybar], [xu, 0]], RED, 1.5, [4, 3]);
        f.path([[xu - 2 * sx, 0.02], [xu + 2 * sx, 0.02]], RED, 4);
        yu.forEach((y) => f.dot(xu, y, RED, 3));
        S.out(`가상 자료 ${seed()}번 · 외부 검량선 (표준 6개, 미지 ${k}회 측정)\n`
          + `기울기 ${L.m.toFixed(5)} ± ${L.sm.toFixed(5)} /ppm, 절편 ${L.b.toFixed(4)} ± ${L.sb.toFixed(4)}, s_y ${L.sy.toFixed(4)}, R² ${L.r2.toFixed(5)}\n`
          + `미지 평균 흡광도 ${ybar.toFixed(4)} → 농도 ${xu.toFixed(3)} ± ${sx.toFixed(3)} ppm (표준 불확도 s_x)\n`
          + `참값 ${cx.toFixed(2)} ppm${fm < 0.999 ? `. 매트릭스가 감도를 ${(fm * 100).toFixed(0)}%로 낮춰 결과가 ${((xu / cx - 1) * 100).toFixed(1)}% 치우쳤다. 표준물 첨가법으로 바꿔 보세요` : ""}`);
      } else {
        const AD = [0, 2, 4, 6, 8];
        const ys = AD.map((a) => fm * m0 * (cx + a) + noise * Q.gauss(r));
        const L = linfit(AD, ys), xu = L.b / L.m;
        const sx = (L.sy / Math.abs(L.m)) * Math.sqrt(1 / L.n + L.my * L.my / (L.m * L.m * L.sxx));
        const x0 = -Math.max(cx * 1.3, 3);
        const f = QSim.frame(v, { x0, x1: 9, y0: 0, y1: Math.max(0.4, fm * m0 * (cx + 9) * 1.1), xl: "첨가한 표준 (ppm)", yl: "흡광도 (바탕 보정)", pad: 40 }); f.axes();
        f.fn((x) => L.m * x + L.b, c.main, 2); f.fn((x) => L.m * x + L.b, c.main, 1, [4, 4]);
        AD.forEach((a, i) => f.dot(a, ys[i], c.main, 4.5));
        f.dot(-xu, 0, RED, 6);
        S.out(`가상 자료 ${seed()}번 · 표준물 첨가법 (시료에 표준 0, 2, 4, 6, 8 ppm 첨가)\n`
          + `기울기 ${L.m.toFixed(5)} /ppm (매트릭스 속 감도), 절편 ${L.b.toFixed(4)}\n`
          + `x절편 −${xu.toFixed(3)} → 시료 농도 ${xu.toFixed(3)} ± ${sx.toFixed(3)} ppm (참값 ${cx.toFixed(2)})\n`
          + (fm < 0.999 ? `매트릭스 감도 ${(fm * 100).toFixed(0)}%: 기울기를 시료 안에서 재므로 감도가 낮아져도 치우치지 않는다` : "매트릭스 영향 없음: 외부 검량선과 같은 답을 주지만 불확도는 더 크다"));
      }
    }
    seed = Q.seedButton(S, draw);
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 다양성자산: 분율 조성과 적정 곡선 (화학1-03-02, 03-03) */
  (() => {
    const S = QSim.card("lab-ch1-polyprotic"); if (!S) return;
    const cv = S.$("canvas");
    const ACIDS = {
      h3po4: { n: "인산 H₃PO₄", pk: [2.15, 7.20, 12.35], sp: ["H₃PO₄", "H₂PO₄⁻", "HPO₄²⁻", "PO₄³⁻"] },
      h2co3: { n: "탄산 H₂CO₃", pk: [6.35, 10.33], sp: ["H₂CO₃", "HCO₃⁻", "CO₃²⁻"] },
      cit: { n: "시트르산 H₃Cit", pk: [3.13, 4.76, 6.40], sp: ["H₃Cit", "H₂Cit⁻", "HCit²⁻", "Cit³⁻"] },
      gly: { n: "글라이신 염산염 H₂Gly⁺", pk: [2.34, 9.60], sp: ["H₂Gly⁺", "HGly", "Gly⁻"] }
    };
    const COL = ["#4b4fe0", RED, GRN, "#9b59b6"];
    const alphas = (pk, h) => {
      const K = pk.map((p) => 10 ** -p), n = K.length, t = [];
      let prod = 1;
      for (let i = 0; i <= n; i++) { t.push(h ** (n - i) * prod); if (i < n) prod *= K[i]; }
      const D = t.reduce((a, b) => a + b, 0); return t.map((x) => x / D);
    };
    const pHof = (pk, Ca, Va, Cb, Vb) => {
      const V = Va + Vb, CT = Ca * Va / V, Na = Cb * Vb / V;
      const F = (lh) => { const h = 10 ** lh, a = alphas(pk, h); let q = 0; a.forEach((x, i) => { q += i * x; }); return h + Na - Kw / h - CT * q; };
      return -bisect(F, -14.5, 1);
    };
    function draw() {
      const c = C(), A = ACIDS[S.val("acid")], Ca = S.val("ca"), Cb = 0.1, Va = 25, mode = S.val("plot");
      const v = QSim.view(cv, 0.55);
      if (mode === "frac") {
        const p = S.val("ph"), f = QSim.frame(v, { x0: 0, x1: 14, y0: 0, y1: 1.05, xl: "pH", yl: "분율 α" }); f.axes();
        A.sp.forEach((_, i) => f.fn((x) => alphas(A.pk, 10 ** -x)[i], COL[i], 2.5));
        A.pk.forEach((pk) => f.path([[pk, 0], [pk, 1]], c.ink3, 1, [3, 4]));
        f.path([[p, 0], [p, 1.05]], c.warn, 1.5);
        const a = alphas(A.pk, 10 ** -p);
        A.sp.forEach((s, i) => f.text(s, 0.3 + i * 3.3, 1.0, COL[i]));
        const top = a.indexOf(Math.max(...a));
        S.out(`${A.n}, pKa = ${A.pk.join(", ")}\npH ${p.toFixed(2)}: ` + A.sp.map((s, i) => `${s} ${(a[i] * 100).toFixed(1)}%`).join(", ")
          + `\n가장 많은 화학종: ${A.sp[top]}. 점선(pH = pKa)에서 이웃한 두 화학종이 50%씩이다`);
      } else {
        const nP = A.pk.length, Ve1 = Ca * Va / Cb, vb = S.val("vb"), vmax = Math.min(60, Ve1 * (nP + 0.6));
        const f = QSim.frame(v, { x0: 0, x1: vmax, y0: 0, y1: 14, xl: "NaOH 0.100 M (mL)", yl: "pH" }); f.axes();
        f.fn((u) => pHof(A.pk, Ca, Va, Cb, u), c.main, 2.5, null, 300);
        const eqs = []; for (let j = 1; j <= nP; j++) if (Ve1 * j <= vmax) { f.path([[Ve1 * j, 0], [Ve1 * j, 14]], c.ink3, 1, [4, 4]); eqs.push(`${j}차 ${(Ve1 * j).toFixed(2)} mL, pH ${pHof(A.pk, Ca, Va, Cb, Ve1 * j).toFixed(2)}`); }
        const p = pHof(A.pk, Ca, Va, Cb, vb); f.dot(vb, p, c.warn, 6);
        S.out(`${A.n} ${Ca.toFixed(3)} M 25.0 mL를 NaOH 0.100 M로 적정\n넣은 부피 ${vb.toFixed(2)} mL → pH ${p.toFixed(2)}\n당량점: ${eqs.join(" · ")}\n반당량점 ${(Ve1 / 2).toFixed(2)} mL의 pH ${pHof(A.pk, Ca, Va, Cb, Ve1 / 2).toFixed(2)} (pKa1 ${A.pk[0]}와 비교)`);
      }
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. EDTA 적정: 조건부 형성 상수 (화학1-04-01, 04-02) */
  (() => {
    const S = QSim.card("lab-ch1-edta"); if (!S) return;
    const cv = S.$("canvas");
    const PK = [0.0, 1.5, 2.00, 2.69, 6.13, 10.37];   // H6Y2+ … HY3- (Harris)
    const MET = { ca: ["Ca²⁺", 10.65], mg: ["Mg²⁺", 8.79], zn: ["Zn²⁺", 16.5], fe: ["Fe³⁺", 25.1] };
    const alphaY = (pH) => {
      const h = 10 ** -pH, K = PK.map((p) => 10 ** -p); let prod = 1; const t = [];
      for (let i = 0; i <= 6; i++) { t.push(h ** (6 - i) * prod); if (i < 6) prod *= K[i]; }
      return t[6] / t.reduce((a, b) => a + b, 0);
    };
    const VM = 50.0, CM0 = 0.0400, CY0 = 0.0800, Ve = VM * CM0 / CY0;
    const pM = (Kp, V) => {
      const Vt = VM + V, CM = CM0 * VM / Vt, CY = CY0 * V / Vt;
      const a = Kp, b = Kp * (CY - CM) + 1, cc = -CM;
      const m = (-b + Math.sqrt(b * b - 4 * a * cc)) / (2 * a);
      return -Math.log10(Math.max(m, 1e-30));
    };
    function draw() {
      const c = C(), [mn, lk] = MET[S.val("met")], pH = S.val("ph"), aY = alphaY(pH), Kp = 10 ** lk * aY, v1 = S.val("v");
      const v = QSim.view(cv, 0.55), top = Math.max(12, Math.log10(Kp) / 2 + 6);
      const f = QSim.frame(v, { x0: 0, x1: 50, y0: 0, y1: top, xl: "EDTA 0.0800 M (mL)", yl: "pM" }); f.axes();
      f.fn((x) => pM(Kp, x), c.main, 2.5, null, 400);
      f.path([[Ve, 0], [Ve, top]], c.ink3, 1, [4, 4]);
      const p = pM(Kp, v1); f.dot(v1, p, c.warn, 6);
      const jump = pM(Kp, Ve * 1.02) - pM(Kp, Ve * 0.98);
      const ok = Math.log10(Kp) >= 8 ? "조건부 형성 상수 ≥ 10⁸: 당량점에서 pM이 크게 뛰어 적정할 수 있다" : "조건부 형성 상수 < 10⁸: 당량점의 변화가 작아 이 pH에서는 적정이 어렵다";
      S.out(`${mn} 0.0400 M 50.0 mL, pH ${pH.toFixed(1)} 완충 용액\nα(Y⁴⁻) = ${sci(aY, 2)}, log Kf = ${lk}, log Kf′ = ${Math.log10(Kp).toFixed(2)}\n${v1.toFixed(2)} mL에서 pM ${p.toFixed(2)}, 당량점(25.00 mL) pM ${pM(Kp, Ve).toFixed(2)}, 당량점 ±2% 사이 pM 변화 ${jump.toFixed(2)}\n${ok}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 5. 산화환원 적정 곡선 (화학1-05-01, 05-02) */
  (() => {
    const S = QSim.card("lab-ch1-redox"); if (!S) return;
    const cv = S.$("canvas");
    const k = 0.05916, E1 = 0.767, F0 = 0.0500, VF = 50.0;
    const TIT = { ce: { n: "Ce⁴⁺ 0.100 M", E2: 1.70, z: 1, C: 0.100 }, mn: { n: "MnO₄⁻ 0.0200 M", E2: 1.507, z: 5, C: 0.0200 } };
    const Eof = (t, V, pH) => {
      const Vt = VF + V, F = F0 * VF / Vt, T = t.C * V / Vt, h = 10 ** -pH;
      const g = (E) => {
        const r1 = 10 ** ((E - E1) / k), fe3 = F * r1 / (1 + r1);
        let red;
        if (t.z === 1) { const r2 = 10 ** ((E - t.E2) / k); red = T / (1 + r2); }
        else { const q = 10 ** (5 * (E - t.E2) / k) / h ** 8; red = 5 * T / (1 + q); }
        return fe3 - red;
      };
      return bisect(g, 0.2, 2.0, 80);
    };
    function draw() {
      const c = C(), t = TIT[S.val("tit")], pH = S.val("ph"), V = S.val("v"), sce = S.val("ref") === "sce";
      const off = sce ? 0.241 : 0, Ve = 25.0;
      const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: 0, x1: 50, y0: 0.4 - off, y1: 1.8 - off, xl: "적정액 (mL)", yl: sce ? "E (V, SCE 기준)" : "E (V, SHE 기준)" }); f.axes();
      f.fn((x) => Eof(t, Math.max(x, 0.05), pH) - off, c.main, 2.5, null, 300);
      f.path([[Ve, 0.4 - off], [Ve, 1.8 - off]], c.ink3, 1, [4, 4]);
      const E = Eof(t, Math.max(V, 0.05), pH); f.dot(V, E - off, c.warn, 6);
      const Eeq = Eof(t, Ve, pH);
      const theo = t.z === 1 ? (E1 + t.E2) / 2 : (E1 + 5 * t.E2) / 6 - (8 * k / 6) * pH;
      S.out(`Fe²⁺ 0.0500 M 50.0 mL를 ${t.n}로 적정${t.z === 5 ? `, pH ${pH.toFixed(1)}` : ""}\n${V.toFixed(2)} mL에서 E = ${(E - off).toFixed(3)} V\n반당량점 12.50 mL: E = ${(Eof(t, 12.5, pH) - off).toFixed(3)} V (Fe³⁺/Fe²⁺의 E° ${(E1 - off).toFixed(3)} V)\n당량점 25.00 mL: 수치 계산 ${(Eeq - off).toFixed(3)} V, 공식 ${(theo - off).toFixed(3)} V`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 6. 일양성자산 적정 곡선과 지시약 고르기 (화학1-03-03) */
  (() => {
    const S = QSim.card("lab-ch1-titration"); if (!S) return;
    const cv = S.$("canvas");
    const IND = {
      mo: { n: "메틸 오렌지", lo: 3.1, hi: 4.4, c0: "#d9412b", c1: "#e8b81e" },
      mr: { n: "메틸 레드", lo: 4.4, hi: 6.2, c0: "#d9412b", c1: "#e8b81e" },
      btb: { n: "브로모티몰 블루", lo: 6.0, hi: 7.6, c0: "#e8b81e", c1: "#2f6fd0" },
      pp: { n: "페놀프탈레인", lo: 8.2, hi: 10.0, c0: "#cfcfcf", c1: "#d63d9a" }
    };
    const Va = 25;
    /* 전하 균형 [H⁺] + [Na⁺] = [OH⁻] + [A⁻]를 넣은 부피에 대해 풀면 닫힌 꼴이 된다 */
    const volAt = (pH, Ca, Ka) => { const h = 10 ** -pH, a = Ka / (h + Ka), d = Kw / h - h; return Va * (Ca * a + d) / (Ca - d); };
    /* NaOH 농도가 산과 같으므로 pH는 14 + log Ca를 넘지 못한다(그때 필요한 부피가 무한대) */
    const pMax = (Ca) => 14 + Math.log10(Ca) - 1e-4;
    const pHat = (Vb, Ca, Ka) => bisect((p) => volAt(p, Ca, Ka) - Vb, 0, pMax(Ca));
    function draw() {
      const c = C(), strong = S.val("acid") === "strong", pKa = S.val("pka"), Ka = strong ? 1e8 : 10 ** -pKa;
      const Ca = +S.val("ca"), I = IND[S.val("ind")], Vb = S.val("vb");
      const v = QSim.view(cv, 0.6), f = QSim.frame(v, { x0: 0, x1: 50, y0: 0, y1: 14, xl: "NaOH (mL)", yl: "pH", pad: 30 });
      const g = v.g;
      const grad = g.createLinearGradient(0, f.Y(I.lo), 0, f.Y(I.hi));
      grad.addColorStop(0, I.c0); grad.addColorStop(1, I.c1);
      g.save(); g.globalAlpha = 0.28; g.fillStyle = grad; g.fillRect(f.X(0), f.Y(I.hi), f.X(50) - f.X(0), f.Y(I.lo) - f.Y(I.hi)); g.restore();
      f.axes();
      const curve = (K) => { const pts = []; for (let p = 0.02; p < pMax(Ca); p += 0.01) { const V = volAt(p, Ca, K); if (V >= 0 && V <= 50) pts.push([V, p]); } return pts; };
      if (!strong) f.path(curve(1e8), c.ink3, 1.5, [5, 4]);
      f.path(curve(Ka), c.main, 2.5);
      f.path([[25, 0], [25, 14]], c.ink3, 1, [3, 4]);
      const p = pHat(Math.max(Vb, 1e-6), Ca, Ka); f.dot(Vb, p, c.warn, 6);
      const pEq = pHat(25, Ca, Ka), pHalf = pHat(12.5, Ca, Ka);
      const v1 = volAt(I.lo, Ca, Ka), v2 = volAt(I.hi, Ca, Ka), vm = volAt((I.lo + I.hi) / 2, Ca, Ka);
      const jump = pHat(25.05, Ca, Ka) - pHat(24.95, Ca, Ka);
      const err = Math.abs(vm - 25) < 5e-4 ? 0 : (vm - 25) / 25 * 100;
      const ok = v1 >= 0 && Math.abs(err) < 0.5;
      f.text(I.n, 49, (I.lo + I.hi) / 2 - 0.2, c.ink2, "right");
      S.out(`${strong ? "강산 HCl" : `약산 HA (pKa ${pKa.toFixed(2)})`} ${Ca.toFixed(Ca < 0.01 ? 4 : 3)} M 25.00 mL를 같은 농도의 NaOH로 적정, 당량점 25.00 mL\n`
        + `넣은 부피 ${Vb.toFixed(2)} mL → pH ${p.toFixed(2)}\n`
        + `반당량점 12.50 mL: pH ${pHalf.toFixed(2)}${strong ? "" : ` (pKa ${pKa.toFixed(2)}와 비교)`} · 당량점: pH ${pEq.toFixed(2)} · 24.95→25.05 mL 사이 pH 변화 ${jump.toFixed(2)}\n`
        + `${I.n}(pH ${I.lo.toFixed(1)}~${I.hi.toFixed(1)}): ` + (v1 < 0 ? `적정 시작 전부터 이미 변색 범위 위에 있음` : `${v1.toFixed(2)}~${v2.toFixed(2)} mL에서 색이 바뀜, 중간색 ${vm.toFixed(2)} mL (적정 오차 ${err >= 0 ? "+" : ""}${err.toFixed(2)}%)`)
        + `\n판정: ${ok ? "알맞음. 변색이 급변 구간 안에 있다" : "알맞지 않음. 색이 당량점에서 떨어진 곳이나 넓은 부피에 걸쳐 바뀐다"}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 7. 표정 결과의 불확도: 반복성과 불확도 예산 (화학3-02-02, 화학1-01-02) */
  (() => {
    const S = QSim.card("lab-ch3-titrunc"); if (!S) return;
    const cv = S.$("canvas");
    const MW = 204.221, cTrue = 0.1000;
    let seed;
    function draw() {
      const c = C(), r = Q.rng(seed() * 31337), n = S.val("n"), sr = S.val("sr"), ub = S.val("ubur"), out = S.val("outlier");
      const rows = [];
      for (let i = 0; i < n; i++) {
        const m = 0.40 + 0.05 * r();                          // KHP 질량 (g)
        let V = m / MW / cTrue * 1000;                         // 참 부피 (mL)
        V += 0.02 * Q.gauss(r) + V * sr / 100 * Q.gauss(r);    // 읽기·종말점 판단 흔들림
        if (out && i === n - 1) V += 0.35;                     // 종말점 지나침
        rows.push({ m, V, c: m / MW / (V / 1000) });
      }
      const cs = rows.map((x) => x.c), cm = mean(cs), s = sd(cs);
      // Q 검정 (90%): 가장 벗어난 값
      const srt = [...cs].sort((a, b) => a - b), range = srt[n - 1] - srt[0];
      const gapLo = (srt[1] - srt[0]) / range, gapHi = (srt[n - 1] - srt[n - 2]) / range;
      const QT = { 3: 0.94, 4: 0.76, 5: 0.64, 6: 0.56, 7: 0.51, 8: 0.47 }[n], Qc = Math.max(gapLo, gapHi);
      // 불확도 예산 (상대 표준 불확도)
      const mm = mean(rows.map((x) => x.m)), Vm = mean(rows.map((x) => x.V));
      const um = Math.sqrt(2) * 0.0001 / Math.sqrt(3) / mm;    // 두 번 칭량, 저울 ±0.1 mg 직사각 분포
      const uV = Math.sqrt((ub / Math.sqrt(3)) ** 2 + 2 * 0.02 ** 2) / Vm;
      const uMW = 0.0038 / MW, uP = 0.0002 / Math.sqrt(3);     // KHP 순도 99.98~100.02%
      const uRep = s / Math.sqrt(n) / cm;
      const parts = [["질량", um], ["뷰렛 부피", uV], ["몰질량", uMW], ["순도", uP], ["반복성", uRep]];
      const uc = Math.sqrt(parts.reduce((a, [, u]) => a + u * u, 0));
      const v = QSim.view(cv, 0.45), f = QSim.frame(v, { x0: -0.5, x1: 4.5, y0: 0, y1: Math.max(...parts.map(([, u]) => u * u / (uc * uc))) * 105, yl: "분산 기여 (%)", pad: 40, noGrid: true }); f.axes({ noGrid: true });
      const g = v.g;
      parts.forEach(([nm, u], i) => { const p = u * u / (uc * uc) * 100; g.fillStyle = i === 4 ? RED : c.main; const x0 = f.X(i - 0.3), x1 = f.X(i + 0.3); g.fillRect(x0, f.Y(p), x1 - x0, f.Y(0) - f.Y(p)); f.text(nm, i, -f.y1 * 0.07, c.ink2, "center"); f.text(p.toFixed(0) + "%", i, p + f.y1 * 0.04, c.ink2, "center"); });
      S.out(`가상 자료 ${seed()}번 · KHP로 NaOH 표정 ${n}회 (참 농도 0.1000 M)\n`
        + rows.map((x, i) => `${i + 1}: KHP ${x.m.toFixed(4)} g, ${x.V.toFixed(2)} mL → ${x.c.toFixed(5)} M`).join("\n")
        + `\n평균 ${cm.toFixed(5)} M, s ${s.toFixed(5)}, 평균의 표준 불확도 s/√n ${(s / Math.sqrt(n)).toFixed(5)}\n`
        + `Q 검정: Q = ${Qc.toFixed(2)}, 90% 기준 ${QT} → ${Qc > QT ? "가장 벗어난 값을 버릴 수 있다" : "버릴 근거 없음"}\n`
        + `합성 표준 불확도 ${(uc * cm).toFixed(5)} M (상대 ${(uc * 100).toFixed(3)}%), 확장 불확도(k = 2) ±${(2 * uc * cm).toFixed(5)} M\n`
        + `결과: c(NaOH) = ${cm.toFixed(4)} ± ${(2 * uc * cm).toFixed(4)} M`);
    }
    seed = Q.seedButton(S, draw);
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 8. 전위차 적정의 종말점: 1·2차 미분과 Gran 도시 (화학3-03-01) */
  (() => {
    const S = QSim.card("lab-ch3-potentio"); if (!S) return;
    const cv = S.$("canvas");
    const Ka = 10 ** -4.76, Ca = 0.100, Va = 25.0, Cb = 0.1000, Ve = 25.0;
    const pHtrue = (Vb) => { const V = Va + Vb, CT = Ca * Va / V, Na = Cb * Vb / V; return -bisect((lh) => { const h = 10 ** lh; return h + Na - Kw / h - CT * Ka / (Ka + h); }, -14.5, 1); };
    let seed;
    function draw() {
      const c = C(), r = Q.rng(seed() * 7717), noise = S.val("noise"), step = S.val("step"), mode = S.val("plot");
      const Vs = []; for (let x = 0; x < 22; x += 1) Vs.push(x); for (let x = 22; x <= 28 + 1e-9; x += step) Vs.push(+x.toFixed(3)); for (let x = 29; x <= 35; x += 1) Vs.push(x);
      const pts = Vs.map((x) => [x, pHtrue(x) + noise * Q.gauss(r)]);
      const d1 = [], d2 = [];
      for (let i = 0; i < pts.length - 1; i++) d1.push([(pts[i][0] + pts[i + 1][0]) / 2, (pts[i + 1][1] - pts[i][1]) / (pts[i + 1][0] - pts[i][0])]);
      for (let i = 0; i < d1.length - 1; i++) d2.push([(d1[i][0] + d1[i + 1][0]) / 2, (d1[i + 1][1] - d1[i][1]) / (d1[i + 1][0] - d1[i][0])]);
      const imax = d1.reduce((b, p, i) => (p[1] > d1[b][1] ? i : b), 0), e1 = d1[imax][0];
      let e2 = NaN, best = 0; for (let i = 0; i < d2.length - 1; i++) { const drop = d2[i][1] - d2[i + 1][1]; if (d2[i][1] > 0 && d2[i + 1][1] <= 0 && drop > best) { best = drop; e2 = d2[i][0] + (d2[i + 1][0] - d2[i][0]) * d2[i][1] / drop; } }   // 가장 가파르게 + → − 로 바뀌는 곳
      const gp = pts.filter(([x]) => x >= 10 && x <= 23).map(([x, p]) => [x, x * 10 ** -p]);
      const G = linfit(gp.map((q) => q[0]), gp.map((q) => q[1])), eg = -G.b / G.m;
      const v = QSim.view(cv, 0.55);
      if (mode === "ph") { const f = QSim.frame(v, { x0: 0, x1: 35, y0: 2, y1: 13, xl: "NaOH (mL)", yl: "pH" }); f.axes(); f.path(pts, c.main, 1.5); pts.forEach(([x, y]) => f.dot(x, y, c.main, 2.5)); f.path([[e1, 2], [e1, 13]], RED, 1, [4, 4]); }
      else if (mode === "d1") { const near = d1.filter(([x]) => x > 20 && x < 30), top = Math.max(...near.map((q) => q[1])) * 1.1; const f = QSim.frame(v, { x0: 20, x1: 30, y0: Math.min(0, ...near.map((q) => q[1])), y1: top, xl: "NaOH (mL)", yl: "ΔpH/ΔV" }); f.axes(); f.path(near, c.main, 2); near.forEach(([x, y]) => f.dot(x, y, c.main, 3)); }
      else if (mode === "d2") { const near = d2.filter(([x]) => x > 22 && x < 28), m = Math.max(...near.map((q) => Math.abs(q[1]))) * 1.1; const f = QSim.frame(v, { x0: 22, x1: 28, y0: -m, y1: m, xl: "NaOH (mL)", yl: "Δ²pH/ΔV²" }); f.axes(); f.path(near, c.main, 2); near.forEach(([x, y]) => f.dot(x, y, c.main, 3)); if (isFinite(e2)) f.dot(e2, 0, RED, 5); }
      else { const f = QSim.frame(v, { x0: 0, x1: 30, y0: 0, y1: Math.max(...gp.map((q) => q[1])) * 1.2, xl: "NaOH (mL)", yl: "V·10^(−pH)" }); f.axes(); gp.forEach(([x, y]) => f.dot(x, y, c.main, 3.5)); f.fn((x) => G.m * x + G.b, RED, 1.5, [5, 4]); f.dot(eg, 0, RED, 5); }
      S.out(`가상 자료 ${seed()}번 · 아세트산 0.100 M 25.0 mL를 NaOH 0.1000 M로 적정 (참 당량점 25.00 mL)\npH 측정 잡음 ±${noise.toFixed(3)}, 당량점 근처 간격 ${step.toFixed(2)} mL\n1차 미분 최대: ${e1.toFixed(3)} mL · 2차 미분 0 지점: ${isFinite(e2) ? e2.toFixed(3) + " mL" : "찾지 못함 (잡음 때문)"} · Gran 도시 x절편: ${eg.toFixed(3)} mL (10~23 mL 자료)\nGran 도시에서 구한 Ka = −기울기 = ${sci(-G.m, 2)} (참값 1.74×10^-5)`);
    }
    seed = Q.seedButton(S, draw);
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 9. van Deemter 식과 분리능 (화학8-04-01, 04-02, 화학3-05-01) */
  (() => {
    const S = QSim.card("lab-ch8-vandeemter"); if (!S) return;
    const [cv1, cv2] = S.$$("canvas");
    function draw() {
      const c = C(), A = S.val("A"), B = S.val("B"), Cc = S.val("Cc"), u = S.val("u"), L = S.val("L"), al = S.val("al"), k1 = 2.0;
      const H = (x) => A + B / x + Cc * x, uo = Math.sqrt(B / Cc), Hmin = A + 2 * Math.sqrt(B * Cc);
      const v = QSim.view(cv1, 0.42), f = QSim.frame(v, { x0: 0, x1: 5, y0: 0, y1: 40, xl: "선속도 u (mm/s)", yl: "H (µm)" }); f.axes();
      f.fn((x) => A, c.ink3, 1, [3, 3]); f.fn((x) => A + B / x, GRN, 1, [3, 3]); f.fn((x) => A + Cc * x, RED, 1, [3, 3]); f.fn(H, c.main, 2.5);
      f.dot(uo, Hmin, c.acc, 5); f.dot(u, H(u), c.warn, 6);
      const N = L * 1000 / H(u), t0 = L / u, k2 = al * k1, t1 = t0 * (1 + k1), t2 = t0 * (1 + k2), s1 = t1 / Math.sqrt(N), s2 = t2 / Math.sqrt(N);
      const Rs = (t2 - t1) / (0.5 * (4 * s1 + 4 * s2)), Rp = Math.sqrt(N) / 4 * (al - 1) / al * k2 / (1 + k2);
      const w = QSim.view(cv2, 0.32), tmax = t2 * 1.25, g = QSim.frame(w, { x0: t0 * 0.8, x1: tmax, y0: 0, y1: 1.15, xl: "시간 (s)", yl: "신호" }); g.axes({ noGrid: true });
      const pk = (t, m, s) => Math.exp(-((t - m) ** 2) / (2 * s * s));
      g.fn((t) => pk(t, t1, s1) + pk(t, t2, s2), c.main, 2, null, 600);
      g.path([[t0, 0], [t0, 0.15]], c.ink3, 1.5);
      S.out(`H = A + B/u + C·u = ${A.toFixed(1)} + ${B.toFixed(1)}/u + ${Cc.toFixed(1)}·u (µm)\n최적 선속도 √(B/C) = ${uo.toFixed(2)} mm/s, 최소 단 높이 ${Hmin.toFixed(2)} µm\nu = ${u.toFixed(2)} mm/s: H = ${H(u).toFixed(2)} µm, 관 ${L} mm의 단 수 N = ${Math.round(N)}\nt₀ ${t0.toFixed(0)} s, 봉우리 ${t1.toFixed(0)} s와 ${t2.toFixed(0)} s (k = ${k1.toFixed(1)}, ${k2.toFixed(2)}, α = ${al.toFixed(3)})\n분리능 Rs = ${Rs.toFixed(2)} (Purnell 식 ${Rp.toFixed(2)}) → ${Rs >= 1.5 ? "기준선 분리 (Rs ≥ 1.5)" : Rs >= 1 ? "거의 분리 (1 ≤ Rs < 1.5)" : "겹침 (Rs < 1)"}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 10. 순환 전압전류법: 전자 이동 속도와 가역성 (화학8-02-02) */
  (() => {
    const S = QSim.card("lab-ch8-cv"); if (!S) return;
    const cv = S.$("canvas");
    const Fc = 96485, R = 8.314, T = 298.15, f = Fc / (R * T), D = 1e-5, Cb = 1e-6, A = 0.0707, al = 0.5;   // C: mol/cm³ (1 mM)
    /* 반적분(convolution) 방법: 전극 표면 농도를 지금까지 흐른 전류의 반적분으로 나타낸다.
       C_O(0,t) = C* − m(t)/(FA√D), C_R(0,t) = m(t)/(FA√D), m(t) = (1/√π)∫ i(τ)/√(t−τ) dτ.
       각 시간 칸에서 전류가 일정하다고 보고, 버틀러-볼머 식과 함께 i를 바로 푼다. */
    function sim(k0, nu) {
      const Ei = 0.4, Ev = -0.4, Ns = 500, dt = (Ei - Ev) / nu / Ns, N = 2 * Ns;
      const FA = Fc * A, a = 1 / (FA * Math.sqrt(D)), q = 2 * Math.sqrt(dt / Math.PI);
      const I = new Float64Array(N + 1), w = new Float64Array(N + 1);
      for (let k = 0; k <= N; k++) w[k] = Math.sqrt(k + 1) - Math.sqrt(k);
      const out = [];
      for (let n = 1; n <= N; n++) {
        const E = n <= Ns ? Ei - nu * dt * n : Ev + nu * dt * (n - Ns);
        let P = 0; for (let j = 1; j < n; j++) P += I[j] * w[n - j];
        P *= q;
        const kf = k0 * Math.exp(-al * f * (E + nu * dt / 2 * (n <= Ns ? 1 : -1))), kb = kf * Math.exp(f * (E + nu * dt / 2 * (n <= Ns ? 1 : -1)));
        I[n] = (kf * Cb - (kf + kb) * a * P) / (1 / FA + (kf + kb) * a * q);
        out.push([E, -I[n] * 1e6]);    // µA, 환원 전류를 음수로
      }
      return out;
    }
    function draw() {
      const c = C(), k0 = 10 ** S.val("lk"), nu = S.val("nu");
      const d = sim(k0, nu), fw = d.slice(0, d.length / 2), bw = d.slice(d.length / 2);
      const pc = fw.reduce((b, p) => (p[1] < b[1] ? p : b)), pa = bw.reduce((b, p) => (p[1] > b[1] ? p : b));
      const ipRS = 0.4463 * Fc * A * Cb * Math.sqrt(f * nu * D) * 1e6;
      const Lam = k0 / Math.sqrt(D * f * nu);
      const cls = Lam >= 15 ? "가역 (Λ ≥ 15)" : Lam > 0.01 * (1 + al) ? "준가역" : "비가역";
      const top = Math.max(...d.map((p) => Math.abs(p[1]))) * 1.15;
      const v = QSim.view(cv, 0.6), fr = QSim.frame(v, { x0: -0.4, x1: 0.4, y0: -top, y1: top, xl: "E − E°′ (V)", yl: "전류 (µA)", pad: 40 }); fr.axes();
      fr.path(fw, c.main, 2.5); fr.path(bw, RED, 2.5);
      fr.dot(pc[0], pc[1], c.acc, 5); fr.dot(pa[0], pa[1], c.acc, 5);
      S.out(`k° = ${sci(k0, 2)} cm/s, 주사 속도 ${nu.toFixed(3)} V/s (D = 1.0×10^-5 cm²/s, 1.00 mM, 전극 0.0707 cm²)\n환원 봉우리 ${(pc[0] * 1000).toFixed(0)} mV, ${pc[1].toFixed(1)} µA · 산화 봉우리 ${(pa[0] * 1000).toFixed(0)} mV, ${pa[1].toFixed(1)} µA\nΔEp = ${((pa[0] - pc[0]) * 1000).toFixed(0)} mV (가역이면 약 57~59 mV)\n가역일 때의 Randles-Sevcik 봉우리 전류 ${ipRS.toFixed(1)} µA, 시뮬레이션 ${Math.abs(pc[1]).toFixed(1)} µA\nΛ = k°/√(D·f·ν) = ${sci(Lam, 2)} → ${cls}`);
    }
    let tm = 0; const later = () => { clearTimeout(tm); tm = setTimeout(draw, 80); };   // 계산이 무거워 조절기를 끄는 동안은 기다린다
    S.on(later); QSim.redrawOn(later); draw();
  })();
})();
