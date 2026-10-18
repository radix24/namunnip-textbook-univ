/* 물리11 실습 카드 묶음: 이원자 기체 열용량, 아인슈타인 고체 열 교환, 열기관 순환, 판데르발스 등온선, 평균장 자화 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const lgam = (n) => {   // ln Γ(n) (스털링 급수, n ≥ 1에서 충분히 정확)
    if (n < 7) { let p = 1; while (n < 7) { p *= n; n += 1; } return lgam(n) - Math.log(p); }
    return (n - 0.5) * Math.log(n) - n + 0.5 * Math.log(2 * Math.PI) + 1 / (12 * n) - 1 / (360 * n ** 3) + 1 / (1260 * n ** 5);
  };
  const lnOmega = (N, q) => lgam(q + N) - lgam(q + 1) - lgam(N);   // ln C(q+N−1, q)

  /* 1. 이원자 기체의 열용량 계단 (01-02) */
  (() => {
    const S = QSim.card("lab-p11-cv"); if (!S) return;
    const cv = S.$("canvas");
    const crot = (T, th) => { let z = 0, e1 = 0, e2 = 0; for (let l = 0; l < 200; l++) { const E = l * (l + 1) * th, w = (2 * l + 1) * Math.exp(-E / T); z += w; e1 += E * w; e2 += E * E * w; if (E / T > 50) break; } e1 /= z; e2 /= z; return (e2 - e1 * e1) / (T * T); };
    const cvib = (T, th) => { const x = th / T; if (x > 100) return 0; const ex = Math.exp(x); return x * x * ex / (ex - 1) ** 2; };
    function draw() {
      const c = C(), thr = S.val("thr"), thv = S.val("thv"), lT = S.val("lt"), T = 10 ** lT;
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 1, x1: 4, y0: 0, y1: 4, xl: "log₁₀ T (K)", yl: "C_V/Nk" }); f.axes();
      f.fn((x) => 1.5, c.ink3, 1, [3, 3]); f.fn((x) => 1.5 + crot(10 ** x, thr), c.acc, 1.5, [4, 3], 300);
      f.fn((x) => 1.5 + crot(10 ** x, thr) + cvib(10 ** x, thv), c.main, 2.5, null, 600);
      [1.5, 2.5, 3.5].forEach((y) => f.text(y.toFixed(1), 1.02, y + 0.08, c.ink3));
      const r = crot(T, thr), vb = cvib(T, thv), tot = 1.5 + r + vb; f.dot(lT, tot, c.warn, 5);
      S.out(`Θ_rot = ${thr} K, Θ_vib = ${thv} K, T = ${T.toFixed(0)} K\nC_V/Nk = 병진 1.50 + 회전 ${r.toFixed(3)} + 진동 ${vb.toFixed(3)} = ${tot.toFixed(3)} (고전 등분배라면 3.5)\n주황 점선: 병진+회전, 파랑: 전체. 계단은 T ≈ Θ 근처에서 오른다`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 두 아인슈타인 고체의 에너지 나눔 (03-02) */
  (() => {
    const S = QSim.card("lab-p11-einstein"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), NA = S.val("na"), NB = S.val("nb"), q = S.val("q");
      const lw = []; for (let a = 0; a <= q; a++) lw.push(lnOmega(NA, a) + lnOmega(NB, q - a));
      const mx = Math.max(...lw), w = lw.map((x) => Math.exp(x - mx)), Z = w.reduce((s, x) => s + x, 0), p = w.map((x) => x / Z);
      let mean = 0, m2 = 0, best = 0; p.forEach((x, a) => { mean += a * x; m2 += a * a * x; if (x > p[best]) best = a; }); const sd = Math.sqrt(Math.max(0, m2 - mean * mean));
      const lnTot = lnOmega(NA + NB, q), pAll = Math.exp(lw[q] - lnTot);
      const v = QSim.view(cv, 0.45), f = QSim.frame(v, { x0: 0, x1: q, y0: 0, y1: Math.max(...p) * 1.15, xl: "q_A (고체 A의 에너지 양자 수)", yl: "확률" }); f.axes();
      const g = v.g, bw = Math.max(1, f.sx * 0.9); p.forEach((x, a) => { g.fillStyle = a === best ? c.warn : c.main; g.fillRect(f.X(a) - bw / 2, f.Y(x), bw, f.Y(0) - f.Y(x)); });
      const fair = q * NA / (NA + NB); f.path([[fair, 0], [fair, Math.max(...p) * 1.15]], c.ink3, 1, [4, 3]);
      S.out(`N_A = ${NA}, N_B = ${NB}, q = ${q}. 전체 미시 상태 수 Ω = e^${lnTot.toFixed(1)} ≈ 10^${(lnTot / Math.LN10).toFixed(1)}\n가장 그럴듯한 q_A = ${best} (진동자당 같은 몫이면 ${fair.toFixed(1)}, 점선), 평균 ${mean.toFixed(1)}, 표준편차 ${sd.toFixed(1)} (상대 폭 ${(100 * sd / Math.max(mean, 1e-9)).toFixed(1)}%)\n에너지가 모두 A에 있을 확률 ${pAll < 1e-4 ? pAll.toExponential(2) : pAll.toFixed(4)}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 카르노 순환과 오토 순환 (03-03) */
  (() => {
    const S = QSim.card("lab-p11-cycle"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), kind = S.val("kind"), r = S.val("r"), tr = S.val("tr"), g = Number(S.val("gamma")), f = 2 / (g - 1);
      // 단위: Nk = 1, T_c = 1, V_1 = 1
      const pts = [], seg = (fn, a, b) => { for (let i = 0; i <= 80; i++) { const V = a + (b - a) * i / 80; pts.push([V, fn(V)]); } };
      let e, ec, W, Qh, ok = true, note = "";
      const Tc = 1, Th = tr;
      if (kind === "carnot") {
        // 1: (V1, Th) 등온 팽창 → 2: (V2 = r V1) → 단열 → 3: T = Tc → 등온 압축 → 4 → 단열 → 1
        const V1 = 1, V2 = r, V3 = V2 * (Th / Tc) ** (f / 2), V4 = V1 * (Th / Tc) ** (f / 2);
        seg((V) => Th / V, V1, V2); seg((V) => Th * (V2 / V) ** g / V2, V2, V3); seg((V) => Tc / V, V3, V4); seg((V) => Tc * (V4 / V) ** g / V4, V4, V1);
        Qh = Th * Math.log(r); const Qc = Tc * Math.log(V3 / V4); W = Qh - Qc; e = W / Qh; ec = 1 - Tc / Th;
      } else {
        // 오토: 1 (Vmax = r, Tc) 단열 압축 → 2 (V = 1) → 등적 가열 → 3 (T = Th) → 단열 팽창 → 4 → 등적 냉각
        const T2 = Tc * r ** (g - 1); if (Th <= T2) { ok = false; note = ` 최고 온도가 압축 뒤 온도 ${T2.toFixed(2)}T_c보다 낮아 가열할 수 없음: 온도 비를 키우거나 압축비를 줄이세요.`; }
        const T3 = Math.max(Th, T2 * 1.0001), T4 = T3 * r ** (1 - g);
        seg((V) => Tc * r ** g / V ** g / r * 1, r, 1); pts.push([1, T3 / 1]); seg((V) => T3 / V ** g, 1, r); pts.push([r, Tc / r]);
        Qh = (f / 2) * (T3 - T2); const Qc = (f / 2) * (T4 - Tc); W = Qh - Qc; e = 1 - r ** (1 - g); ec = 1 - Tc / T3;
      }
      const Vmax = Math.max(...pts.map((p) => p[0])), Pmax = Math.max(...pts.map((p) => p[1]));
      const v = QSim.view(cv, 0.55), fr = QSim.frame(v, { x0: 0, x1: Vmax * 1.08, y0: 0, y1: Pmax * 1.1, xl: "V (V₁ 단위)", yl: "P (NkT_c/V₁ 단위)" }); fr.axes();
      fr.path(pts, c.main, 2.5);
      S.out(`${kind === "carnot" ? "카르노 순환" : "오토 순환"}, γ = ${g}, ${kind === "carnot" ? "등온 팽창 부피 비" : "압축비"} ${r.toFixed(1)}, 최고/최저 온도 비 ${tr.toFixed(2)}\n${ok ? `효율 ${(100 * e).toFixed(1)}%, 같은 최고·최저 온도의 카르노 효율 ${(100 * ec).toFixed(1)}%. 한 순환의 일 ${W.toFixed(3)} NkT_c, 흡수 열 ${Qh.toFixed(3)} NkT_c` : "계산할 수 없음."}${note}\n${kind === "otto" && ok ? "오토 효율 1 − r^(1−γ)는 최고 온도와 무관하다" : ""}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 판데르발스 등온선과 맥스웰 작도 (05-01, 06-03) */
  (() => {
    const S = QSim.card("lab-p11-vdw"); if (!S) return;
    const cv = S.$("canvas");
    const P = (v, t) => 8 * t / (3 * v - 1) - 3 / (v * v), I = (v, t) => (8 * t / 3) * Math.log(3 * v - 1) + 3 / v;   // ∫P dv
    const bis = (fn, a, b) => { let fa = fn(a); for (let i = 0; i < 100; i++) { const m = (a + b) / 2, fm = fn(m); if ((fm > 0) === (fa > 0)) { a = m; fa = fm; } else b = m; } return (a + b) / 2; };
    function draw() {
      const c = C(), t = S.val("t"), v0 = 0.36, v1 = 6;
const v = QSim.view(cv, 0.55);
      const fv = QSim.frame(v, { x0: Math.log10(v0), x1: Math.log10(v1), y0: -0.6, y1: 2.2, xl: "log₁₀(V/V_c)", yl: "P/P_c" }); fv.axes();
      for (const tt of [0.85, 0.9, 0.95, 1.0, 1.05, 1.1]) if (Math.abs(tt - t) > 1e-6) fv.fn((x) => P(10 ** x, tt), c.soft, 1, null, 500);
      fv.fn((x) => P(10 ** x, t), c.main, 2.5, null, 800);
      let msg = "";
      if (t < 1) {
        // 극값(스피노달): dP/dv = 0
        const dP = (vv) => -24 * t / (3 * vv - 1) ** 2 + 6 / vv ** 3;
        const vmin = bis(dP, 0.4, 1), vmax = bis(dP, 1, 30);
        const pmin = P(vmin, t), pmax = P(vmax, t);
        const roots = (ps) => [bis((vv) => P(vv, t) - ps, 0.34, vmin), bis((vv) => P(vv, t) - ps, vmax, 1e4)];
        const area = (ps) => { const [a, b] = roots(ps); return I(b, t) - I(a, t) - ps * (b - a); };
        const ps = bis(area, Math.max(pmin, 1e-6), pmax), [vl, vg] = roots(ps);
        fv.path([[Math.log10(vl), ps], [Math.log10(vg), ps]], c.warn, 2);
        fv.dot(Math.log10(vmin), pmin, c.acc, 4); fv.dot(Math.log10(vmax), pmax, c.acc, 4);
        msg = `증기압(맥스웰 작도) P = ${ps.toFixed(4)} P_c, 액체 V = ${vl.toFixed(3)} V_c, 기체 V = ${vg.toFixed(3)} V_c (밀도 비 ${(vg / vl).toFixed(2)})\n주황 점: 스피노달(∂P/∂V = 0, V = ${vmin.toFixed(3)}, ${vmax.toFixed(3)}). 그 사이는 불안정, 공존선과 스피노달 사이는 준안정(과열 액체·과냉 기체)`;
      } else msg = `T ≥ T_c: 등온선이 단조 감소해 기체와 액체의 구별이 없다${Math.abs(t - 1) < 1e-6 ? ". 임계 등온선: V = V_c에서 수평 변곡점" : ""}\n`;
      S.out(`환산 온도 T/T_c = ${t.toFixed(3)} (파랑), 연한 선은 다른 온도들\n${msg}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 5. 평균장(퀴리-바이스) 자화와 임계 지수 (06-02) */
  (() => {
    const S = QSim.card("lab-p11-meanfield"); if (!S) return;
    const [cvM, cvL] = S.$$("canvas");
    const mag = (tau, h) => {   // m − tanh((m + h)/τ) = 0의 양의 해 (뉴턴법, h는 kT_c 단위)
      let m = 1; for (let i = 0; i < 300; i++) { const th = Math.tanh((m + h) / tau), F = m - th, dF = 1 - (1 - th * th) / tau; let step = F / (Math.abs(dF) < 1e-12 ? 1e-12 : dF); if (m - step < 0) step = m / 2; m -= step; if (Math.abs(step) < 1e-15) break; } return Math.max(0, m);
    };
    function draw() {
      const c = C(), h = S.val("h"), tau = S.val("tau");
      const v = QSim.view(cvM, 0.42), f = QSim.frame(v, { x0: 0, x1: 1.6, y0: 0, y1: 1.05, xl: "T/T_c", yl: "m" }); f.axes();
      f.fn((x) => (x < 0.005 ? NaN : mag(x, 0)), c.ink3, 1.5, [4, 3], 400);
      if (h > 0) f.fn((x) => (x < 0.005 ? NaN : mag(x, h)), c.main, 2.5, null, 400);
      const m = mag(tau, h); f.dot(tau, m, c.warn, 5);
      const ts = [], ms = []; for (let k = 0; k < 12; k++) { const d = 10 ** (-3 + 2 * k / 11); ts.push(Math.log10(d)); ms.push(Math.log10(mag(1 - d, 0))); }
      const n = ts.length, mx = ts.reduce((s, x) => s + x, 0) / n, my = ms.reduce((s, x) => s + x, 0) / n;
      const beta = ts.reduce((s, x, i) => s + (x - mx) * (ms[i] - my), 0) / ts.reduce((s, x) => s + (x - mx) ** 2, 0);
      const vl = QSim.view(cvL, 0.32), fl = QSim.frame(vl, { x0: -3.1, x1: -0.9, y0: -2, y1: 0.2, xl: "log₁₀(1 − T/T_c)", yl: "log₁₀ m" }); fl.axes();
      ts.forEach((x, i) => fl.dot(x, ms[i], c.acc, 4)); fl.fn((x) => my + beta * (x - mx), c.acc, 1.2, [4, 3]);
      const dh = 1e-5, chi = (mag(tau, h + dh) - mag(tau, Math.max(0, h - dh))) / (h > dh ? 2 * dh : dh);
      S.out(`평균장 m = tanh((m + h)/(T/T_c)), h = ${h.toFixed(3)} kT_c. 회색 점선: h = 0${h > 0 ? ", 파랑: h > 0" : ""}\nT/T_c = ${tau.toFixed(3)}: m = ${m.toFixed(4)}, 감수율 ∂m/∂h ≈ ${chi.toFixed(2)}${h === 0 && tau < 1 ? `, 근사식 √(3(1 − T/T_c)) = ${Math.sqrt(3 * (1 - tau)).toFixed(4)}` : ""}\n아래: T_c 바로 아래 log m–log(1 − T/T_c)의 기울기 β ≈ ${beta.toFixed(3)} (평균장 이론값 0.5, 3차원 실제 약 0.33)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
