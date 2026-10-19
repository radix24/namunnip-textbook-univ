/* 전전8 전자회로(1) 탐구 카드 묶음
   1 다이오드 부하선과 네 모델(01-01)  2 제너 조정기의 최악 조건(01-03) */
(() => {
  "use strict";
  if (!window.QSim) return;
  const C = () => QSim.col();
  const f2 = (x, d = 3) => (Math.abs(x) < 5e-13 ? 0 : x).toFixed(d);
  const VT = 0.025;

  /* 1. 다이오드 부하선: 지수 모델, CVD, 이상 모델 */
  (() => {
    const S = QSim.card("exp-e8-diode"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), Vdd = S.val("vdd"), R = S.val("r") * 1e3, V1 = S.val("v1");   // V1: 1 mA에서의 전압
      const Is = 1e-3 / Math.exp(V1 / VT), id = (v) => Is * (Math.exp(v / VT) - 1);
      let V = V1, I = 0; for (let k = 0; k < 80; k++) { I = Math.max((Vdd - V) / R, 1e-15); V = VT * Math.log(I / Is + 1); }
      const Icvd = Math.max(0, (Vdd - 0.7) / R), Iid = Vdd / R;
      const Imax = Math.max(Iid, I) * 1.15 * 1e3, Vmax = Math.max(1, Math.min(Vdd, 1.2));
      const v = QSim.view(cv, 0.5), fr = QSim.frame(v, { x0: 0, x1: Vmax, y0: 0, y1: Imax, xl: "v_D (V)", yl: "i_D (mA)" }); fr.axes();
      fr.fn((x) => Math.min(Imax, id(x) * 1e3), c.main, 2.5, undefined, 800);
      fr.fn((x) => (Vdd - x) / R * 1e3, c.acc, 2, [6, 3]);
      fr.dot(V, I * 1e3, c.warn, 6);
      if (Icvd > 0) fr.dot(0.7, Icvd * 1e3, c.ink3, 4);
      const rd = VT / I;
      S.out(`V_DD = ${Vdd} V, R = ${S.val("r")} kΩ, 다이오드: 1 mA에서 ${V1} V (I_S = ${Is.toExponential(2)} A)\n` +
        `지수 모델(교점): V_D = ${f2(V, 4)} V, I_D = ${f2(I * 1e3, 3)} mA. CVD(0.7 V): ${f2(Icvd * 1e3, 3)} mA (${f2((Icvd - I) / I * 100, 1)}%), 이상: ${f2(Iid * 1e3, 3)} mA (${f2((Iid - I) / I * 100, 1)}%)\n` +
        `동작점의 소신호 저항 r_d = V_T/I_D = ${f2(rd, 1)} Ω, 직류 저항 V_D/I_D = ${f2(V / I, 1)} Ω. 파랑: 다이오드 곡선, 주황 점선: 부하선, 빨간 점: 동작점, 회색 점: CVD 결과`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 제너 조정기 (V_Z = V_Z0 + r_z I_Z) */
  (() => {
    const S = QSim.card("exp-e8-zener"); if (!S) return;
    const cv = S.$("canvas");
    const Vz0 = 6.8, rz = 5, Izmin = 5e-3;
    // 마디 식: (Vs − Vo)/R = Iz + IL, Iz = (Vo − Vz0)/rz (Vo > Vz0일 때), 아니면 Iz = 0, Vo = Vs − IL R (단, 0 이상)
    const solve = (Vs, IL, R) => {
      const Vo = (Vs / R - IL + Vz0 / rz) / (1 / R + 1 / rz), Iz = (Vo - Vz0) / rz;
      if (Iz > 0) return { Vo, Iz };
      return { Vo: Math.max(0, Vs - IL * R), Iz: 0 };
    };
    function draw() {
      const c = C(), Vs = S.val("vs"), IL = S.val("il") * 1e-3, R = S.val("r");
      const op = solve(Vs, IL, R);
      const v = QSim.view(cv, 0.42), fr = QSim.frame(v, { x0: 0, x1: 30, y0: 0, y1: 8, xl: "부하 전류 I_L (mA)", yl: "V_O (V)" }); fr.axes();
      [13.5, 15, 16.5].forEach((vs, i) => fr.fn((ma) => solve(vs, ma * 1e-3, R).Vo, [c.warn, c.main, c.acc][i], 1.8, i === 1 ? undefined : [5, 3], 300));
      fr.dot(IL * 1e3, op.Vo, c.ink, 6);
      const worst = (13.5 - Vz0) / R - 0.02, pmax = (() => { const o = solve(16.5, 0, R); return o.Vo * o.Iz; })();
      S.out(`V_S = ${f2(Vs, 1)} V, I_L = ${f2(IL * 1e3, 1)} mA, R = ${R} Ω → V_O = ${f2(op.Vo, 3)} V, I_Z = ${f2(op.Iz * 1e3, 1)} mA` +
        (op.Iz <= 0 ? " → 제너가 꺼져 조정 실패" : op.Iz < Izmin ? ` → I_Z가 최소 ${Izmin * 1e3} mA보다 작음(무릎 근처)` : " → 정상 조정") + `\n` +
        `설계 점검(입력 13.5~16.5 V, 부하 0~20 mA): 최악 I_Z ≈ ${f2(worst * 1e3, 1)} mA${worst >= Izmin ? " (통과)" : " (부족: R을 줄이세요)"}, 무부하·최대 입력에서 제너 전력 ${f2(pmax, 3)} W\n` +
        `그래프: 입력 13.5 V(빨강 점선), 15 V(파랑), 16.5 V(주황 점선)에서 부하 전류에 따른 출력. 곡선이 꺾여 떨어지는 곳이 제너가 꺼지는 점입니다.`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
  /* NMOS 드레인 전류 (제곱 법칙, λ 포함). 단위: mA, V, mA/V² */
  const nmos = (k, Vt, lam, vgs, vds) => {
    const ov = vgs - Vt; if (ov <= 0 || vds <= 0) return 0;
    return vds < ov ? k * (ov * vds - vds * vds / 2) * (1 + lam * vds) : 0.5 * k * ov * ov * (1 + lam * vds);
  };
  /* 단조 감소 함수 g의 근을 이분법으로 (g(lo) > 0 > g(hi)) */
  const bisect = (g, lo, hi) => { for (let i = 0; i < 100; i++) { const m = (lo + hi) / 2; if (g(m) > 0) lo = m; else hi = m; } return (lo + hi) / 2; };

  /* 3. MOSFET 출력 특성과 부하선 (02-01) */
  (() => {
    const S = QSim.card("exp-e8-mosiv"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), k = 2, Vt = 0.5, Vdd = 3, vgs = S.val("vgs"), Rd = S.val("rd"), lam = S.val("lam");
      const Imax = 1.0, v = QSim.view(cv, 0.55), fr = QSim.frame(v, { x0: 0, x1: Vdd, y0: 0, y1: Imax, xl: "v_DS (V)", yl: "i_D (mA)" }); fr.axes();
      [0.7, 0.8, 0.9, 1.0, 1.1, 1.2].forEach((g) => fr.fn((x) => Math.min(Imax, nmos(k, Vt, lam, g, x)), Math.abs(g - vgs) < 1e-6 ? c.main : c.rule, Math.abs(g - vgs) < 1e-6 ? 2.6 : 1.2, undefined, 400));
      fr.fn((x) => Math.max(0, x - Vt) ** 2 * k / 2, c.ink3, 1, [2, 3], 400);   // 경계 v_DS = v_OV
      fr.fn((x) => (Vdd - x) / Rd, c.acc, 2, [6, 3]);
      const Vds = bisect((x) => (Vdd - x) / Rd - nmos(k, Vt, lam, vgs, x), 0, Vdd), Id = (Vdd - Vds) / Rd, ov = vgs - Vt;
      fr.dot(Vds, Id, c.warn, 6);
      const reg = ov <= 0 ? "차단" : Vds < ov ? "트라이오드" : "포화";
      S.out(`k_n = 2 mA/V², V_t = 0.5 V, V_DD = 3 V, λ = ${lam} V⁻¹. v_GS = ${f2(vgs, 2)} V (v_OV = ${f2(ov, 2)} V), R_D = ${f2(Rd, 1)} kΩ\n` +
        `동작점: V_DS = ${f2(Vds, 3)} V, I_D = ${f2(Id, 4)} mA → ${reg} (경계 v_DS = v_OV = ${f2(Math.max(ov, 0), 2)} V)\n` +
        `회색 곡선: v_GS = 0.7~1.2 V, 파랑: 현재 v_GS, 점선 포물선: 트라이오드-포화 경계, 주황 점선: 부하선`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 바이어스와 문턱 전압 편차 (02-02) */
  (() => {
    const S = QSim.card("exp-e8-bias"); if (!S) return;
    const cv = S.$("canvas");
    // V_G와 R_S가 주어지면 I_D = ½k(V_G − I_D R_S − V_t)² 를 푼다. 목표: V_t = 0.5에서 I_D = 0.25 mA가 되도록 V_G를 맞춘다.
    const k = 2, Itarget = 0.25, ov0 = Math.sqrt(2 * Itarget / k);
    const solve = (VG, Rs, Vt) => { if (Rs === 0) return 0.5 * k * Math.max(0, VG - Vt) ** 2; const x = bisect((ov) => VG - Vt - ov - 0.5 * k * ov * ov * Rs, 0, Math.max(VG - Vt, 0)); return 0.5 * k * x * x; };
    function draw() {
      const c = C(), Rs = S.val("rs"), dv = S.val("dvt") / 1000;
      const VG = 0.5 + ov0 + Itarget * Rs;   // V_t = 0.5 V에서 목표 전류
      const v = QSim.view(cv, 0.42), fr = QSim.frame(v, { x0: 0.5 - 0.15, x1: 0.5 + 0.15, y0: 0, y1: 0.5, xl: "문턱 전압 V_t (V)", yl: "I_D (mA)" }); fr.axes();
      fr.fn((vt) => solve(0.5 + ov0, 0, vt), c.warn, 1.8, [5, 3], 300);
      fr.fn((vt) => solve(VG, Rs, vt), c.main, 2.6, undefined, 300);
      fr.path([[0.5 - dv, 0], [0.5 - dv, 0.5]], c.rule, 1, [2, 3]); fr.path([[0.5 + dv, 0], [0.5 + dv, 0.5]], c.rule, 1, [2, 3]);
      const lo = solve(VG, Rs, 0.5 + dv), hi = solve(VG, Rs, 0.5 - dv), flo = solve(0.5 + ov0, 0, 0.5 + dv), fhi = solve(0.5 + ov0, 0, 0.5 - dv);
      S.out(`목표 I_D = 0.25 mA (V_t = 0.5 V). R_S = ${f2(Rs, 1)} kΩ → V_G = ${f2(VG, 3)} V, 소스 전압 ${f2(Itarget * Rs, 3)} V\n` +
        `V_t가 ±${S.val("dvt")} mV 흔들리면: 소스 저항 바이어스 ${f2(lo, 3)} ~ ${f2(hi, 3)} mA (폭 ${f2((hi - lo) / Itarget * 100, 1)}%), 고정 V_GS ${f2(flo, 3)} ~ ${f2(fhi, 3)} mA (폭 ${f2((fhi - flo) / Itarget * 100, 1)}%)\n` +
        `빨간 점선: 고정 V_GS = 1.0 V, 파랑: 소스 저항 바이어스. R_S를 키울수록 곡선이 평평해집니다(대가: 소스 전압 ${f2(Itarget * Rs, 2)} V만큼 전원 여유 감소).`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
  /* 5. BJT 네 저항 바이어스와 β 편차 (03-01) */
  (() => {
    const S = QSim.card("exp-e8-bjtbias"); if (!S) return;
    const cv = S.$("canvas");
    const Vcc = 12, R1 = 100, R2 = 50, Rc = 4.7;   // kΩ
    function draw() {
      const c = C(), Re = S.val("re"), sc = S.val("sc"), beta = S.val("beta");
      const r1 = R1 * sc, r2 = R2 * sc, Vbb = Vcc * r2 / (r1 + r2), Rb = r1 * r2 / (r1 + r2);
      // 활성 가정 → V_CE < 0.2 이면 포화로 다시 (V_CE = 0.2 V, 두 고리 연립)
      const op = (b) => {
        const Ie = (Vbb - 0.7) / (Re + Rb / (b + 1)), Ic = b / (b + 1) * Ie, Vce = Vcc - Ic * Rc - Ie * Re;
        if (Vce >= 0.2) return { Ic, Vce, sat: false };
        // 포화: Vbb = Ib Rb + 0.7 + (Ib + Ic) Re, Vcc = Ic Rc + 0.2 + (Ib + Ic) Re
        const a11 = Rb + Re, a12 = Re, a21 = Re, a22 = Rc + Re, b1 = Vbb - 0.7, b2 = Vcc - 0.2, det = a11 * a22 - a12 * a21;
        const Ib = (b1 * a22 - a12 * b2) / det, Ic2 = (a11 * b2 - a21 * b1) / det;
        return { Ic: Ic2, Vce: 0.2, sat: true, forced: Ic2 / Ib };
      };
      const v = QSim.view(cv, 0.42), fr = QSim.frame(v, { x0: 20, x1: 400, y0: 0, y1: 2.5, xl: "β", yl: "I_C (mA)" }); fr.axes();
      fr.fn((b) => op(b).Ic, c.main, 2.6, undefined, 300);
      const Ib0 = 0.9 / 100, fixed = (b) => Math.min(b * Ib0, (Vcc - 0.2) / Rc);   // β = 100에서 0.9 mA가 되는 고정 바이어스
      fr.fn(fixed, c.warn, 1.8, [5, 3], 300);
      const o = op(beta); fr.dot(beta, o.Ic, c.ink, 6);
      const lo = op(50).Ic, hi = op(200).Ic;
      S.out(`V_CC = 12 V, R_1 = ${f2(r1, 0)} kΩ, R_2 = ${f2(r2, 0)} kΩ (V_BB = ${f2(Vbb, 2)} V, R_B = ${f2(Rb, 1)} kΩ), R_E = ${f2(Re, 1)} kΩ, R_C = 4.7 kΩ\n` +
        `β = ${beta}: I_C = ${f2(o.Ic, 3)} mA, V_CE = ${f2(o.Vce, 2)} V → ${o.sat ? `포화 (I_C/I_B = ${f2(o.forced, 1)} < β)` : "활성"}. 조건 R_B/(β+1) = ${f2(Rb / (beta + 1), 2)} kΩ 대 R_E = ${f2(Re, 1)} kΩ\n` +
        `β = 50 ~ 200에서 I_C ${f2(lo, 3)} ~ ${f2(hi, 3)} mA (비 ${f2(hi / lo, 2)}). 빨간 점선: 고정 바이어스(β = 100에서 0.9 mA, 비 4)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
/*__MORE__*/
})();
