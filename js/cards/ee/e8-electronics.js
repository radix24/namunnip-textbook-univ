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
  /* 6. 공통 소스 증폭기의 큰 신호 파형: 이득, 왜곡, 잘림 (04-01) */
  (() => {
    const S = QSim.card("exp-e8-cs"); if (!S) return;
    const [cvT, cvK] = S.$$("canvas");
    const k = 2, Vt = 0.5, Vdd = 3, Id0 = 0.25;   // 동작점: I_D = 0.25 mA (V_OV = 0.5 V)
    function draw() {
      const c = C(), Rd = S.val("rd"), Rs = S.val("rs"), Vp = S.val("vp");
      const VG = Vt + 0.5 + Id0 * Rs;   // R_S가 있어도 같은 동작점
      // 순간값: i = nmos(v_G − i R_S, V_DD − i(R_D + R_S))를 만족하는 i
      const iOf = (vg) => bisect((i) => nmos(k, Vt, 0, vg - i * Rs, Vdd - i * (Rd + Rs)) - i, 0, Vdd / (Rd + Rs));
      const N = 256, vd = [];
      let tri = false, cut = false;
      for (let n = 0; n < N; n++) {
        const vg = VG + Vp * Math.sin(2 * Math.PI * n / N), i = iOf(vg), vs = i * Rs, d = Vdd - i * Rd;
        vd.push(d); if (vg - vs - Vt <= 1e-6) cut = true; else if (d - vs < vg - vs - Vt) tri = true;
      }
      const Vd0 = Vdd - iOf(VG) * Rd;
      const harm = (h) => { let re = 0, im = 0; vd.forEach((x, n) => { re += x * Math.cos(2 * Math.PI * h * n / N); im -= x * Math.sin(2 * Math.PI * h * n / N); }); return 2 * Math.hypot(re, im) / N; };
      const A1 = harm(1), A2 = harm(2), A3 = harm(3);
      const vt = QSim.view(cvT, 0.42), ft = QSim.frame(vt, { x0: 0, x1: 2, y0: 0, y1: Vdd, xl: "주기", yl: "v_D (V)" }); ft.axes({ noGrid: true });
      ft.path(Array.from({ length: 2 * N + 1 }, (_, n) => [n / N, vd[n % N]]), c.main, 2.2);
      ft.fn((x) => Vd0 - Vp * (Rd / (1 / (k * 0.5) + Rs)) * Math.sin(2 * Math.PI * x), c.ink3, 1.2, [5, 3], 400);
      ft.path([[0, Vd0], [2, Vd0]], c.rule, 1, [2, 3]);
      const vk = QSim.view(cvK, 0.26), fk = QSim.frame(vk, { x0: 0, x1: 4, y0: 0, y1: Math.max(0.1, A1 * 1.15), xl: "고조파 번호", yl: "진폭 (V)" }); fk.axes({ noGrid: true });
      const g = vk.g; g.save(); g.strokeStyle = c.main; g.lineWidth = 6; [[1, A1], [2, A2], [3, A3]].forEach(([h, a]) => { g.beginPath(); g.moveTo(fk.X(h), fk.Y(0)); g.lineTo(fk.X(h), fk.Y(a)); g.stroke(); }); g.restore();
      const gm = k * 0.5, Asmall = gm * Rd / (1 + gm * Rs), vmin = Math.min(...vd), vmax = Math.max(...vd);
      const clip = [tri ? "출력 아래쪽이 트라이오드로 들어감" : "", cut ? "출력 위쪽이 차단으로 잘림" : ""].filter(Boolean).join(", ") || "포화 영역 유지(잘림 없음)";
      S.out(`k_n = 2 mA/V², V_t = 0.5 V, V_DD = 3 V, 동작점 I_D = 0.25 mA (g_m = 1 mA/V), R_D = ${Rd} kΩ, R_S = ${Rs} kΩ, 입력 첨두 ${Vp * 1000} mV\n` +
        `직류 V_D = ${f2(Vd0, 3)} V. 출력 ${f2(vmin, 3)} ~ ${f2(vmax, 3)} V, 기본파 진폭 ${f2(A1, 3)} V → 이득 ${f2(A1 / Vp, 2)} (소신호 식 g_mR_D/(1 + g_mR_S) = ${f2(Asmall, 2)})\n` +
        `2차 고조파 ${f2(A2 / A1 * 100, 2)}%, 3차 ${f2(A3 / A1 * 100, 2)}%. ${clip}. 회색 점선: 소신호 모델의 예측`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
  /* 7. 전류 거울: 단순 거울과 캐스코드의 출력 특성 (05-01) */
  (() => {
    const S = QSim.card("exp-e8-mirror"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), lam = S.val("lam"), ratio = S.val("ratio"), Iref = 100, Vt = 0.5, Vov = 0.3, Vgs = Vt + Vov;   // μA, V
      const k1 = 2 * Iref / (Vov * Vov * (1 + lam * Vgs)), k2 = k1 * ratio;   // μA/V²
      const simple = (vo) => nmos(k2, Vt, lam, Vgs, vo);
      // 캐스코드: 아래 Q2(게이트 V_GS), 위 Q4(게이트 2V_GS, 소스 v_x). Q2 전류 = Q4 전류가 되는 v_x
      const casc = (vo) => { if (vo <= 0) return 0; const vx = bisect((x) => nmos(k2, Vt, lam, 2 * Vgs - x, vo - x) - nmos(k2, Vt, lam, Vgs, x), 0, Math.min(vo, 2 * Vgs)); return nmos(k2, Vt, lam, Vgs, vx); };
      const top = Iref * ratio * 1.5, v = QSim.view(cv, 0.5), fr = QSim.frame(v, { x0: 0, x1: 3, y0: 0, y1: top, xl: "출력 전압 V_O (V)", yl: "I_O (μA)" }); fr.axes();
      fr.path([[0, Iref * ratio], [3, Iref * ratio]], c.rule, 1, [3, 3]);
      fr.fn(simple, c.warn, 2.2, undefined, 600); fr.fn(casc, c.main, 2.6, undefined, 600);
      const ro = (f, a, b) => (b - a) / (f(b) - f(a)) * 1e3;   // kΩ (μA 단위라 ×1e3)
      const Rs = ro(simple, 1.5, 2.5), Rc = ro(casc, 1.5, 2.5);
      S.out(`I_REF = 100 μA, V_GS = 0.8 V (V_OV = 0.3 V), λ = ${f2(lam, 2)} V⁻¹, 크기 비 ${ratio} → 목표 ${Iref * ratio} μA\n` +
        `단순 거울(빨강): V_O = 0.8 V에서 ${f2(simple(0.8), 1)} μA, 2 V에서 ${f2(simple(2), 1)} μA, 출력 저항 ${Rs > 1e5 ? "매우 큼" : f2(Rs, 0) + " kΩ"}, 최소 출력 약 0.3 V\n` +
        `캐스코드(파랑): 2 V에서 ${f2(casc(2), 1)} μA, 출력 저항 ${Rc > 1e6 ? "매우 큼" : f2(Rc / 1000, 2) + " MΩ"}, 1.1 V(= 2V_GS − V_t) 아래에서는 위 트랜지스터가 포화를 벗어나 곡선이 기울어짐`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
  /* 8. MOS 차동 쌍의 전달 특성 (06-01) */
  (() => {
    const S = QSim.card("exp-e8-diffpair"); if (!S) return;
    const [cvI, cvT] = S.$$("canvas");
    function draw() {
      const c = C(), I = S.val("itail"), Vov = S.val("vov"), Rd = 5, vid0 = S.val("vid") / 1000;   // mA, V, kΩ
      const lim = Math.SQRT2 * Vov;
      const id1 = (v) => { if (v >= lim) return I; if (v <= -lim) return 0; const x = v / 2 / Vov; return I / 2 + (I / Vov) * (v / 2) * Math.sqrt(1 - x * x); };
      const id2 = (v) => I - id1(v), gm = I / Vov;
      const X = 0.6, vi = QSim.view(cvI, 0.4), fi = QSim.frame(vi, { x0: -X, x1: X, y0: 0, y1: 1.05 * Math.max(I, 0.4), xl: "v_id (V)", yl: "i_D (mA)" }); fi.axes();
      fi.fn(id1, c.main, 2.4, undefined, 600); fi.fn(id2, c.acc, 2.4, undefined, 600);
      fi.fn((v) => I / 2 + gm * v / 2, c.ink3, 1, [5, 3], 200);
      [lim, -lim].forEach((x) => fi.path([[x, 0], [x, I]], c.rule, 1, [2, 3]));
      fi.dot(vid0, id1(vid0), c.warn, 5); fi.dot(vid0, id2(vid0), c.warn, 5);
      // 시간 파형: v_id = vid0 sin, 차동 출력 v_od = (i_D1 − i_D2) R_D
      const vt = QSim.view(cvT, 0.3), Y = I * Rd * 1.1, ft = QSim.frame(vt, { x0: 0, x1: 2, y0: -Y, y1: Y, xl: "주기", yl: "v_od (V)" }); ft.axes({ noGrid: true });
      ft.fn((t) => (id1(vid0 * Math.sin(2 * Math.PI * t)) - id2(vid0 * Math.sin(2 * Math.PI * t))) * Rd, c.main, 2.2, undefined, 600);
      ft.fn((t) => gm * Rd * vid0 * Math.sin(2 * Math.PI * t), c.ink3, 1.2, [5, 3], 400);
      const out = (id1(vid0) - id2(vid0)) * Rd;
      S.out(`꼬리 전류 I = ${f2(I, 2)} mA, V_OV = ${f2(Vov, 2)} V → k_n = I/V_OV² = ${f2(I / Vov / Vov, 1)} mA/V², g_m = I/V_OV = ${f2(gm, 2)} mA/V, R_D = 5 kΩ\n` +
        `선형 범위 끝 √2·V_OV = ${f2(lim, 3)} V (세로 점선). v_id = ${f2(vid0 * 1000, 0)} mV에서 i_D1 = ${f2(id1(vid0), 4)}, i_D2 = ${f2(id2(vid0), 4)} mA\n` +
        `차동 출력 첨두 ${f2(out, 3)} V, 소신호 예측 g_mR_D·v_id = ${f2(gm * Rd * vid0, 3)} V (${f2((out / (gm * Rd * vid0) - 1) * 100, 1)}%). 위: 파랑 i_D1, 주황 i_D2, 회색 점선 소신호 직선. 아래: 사인파 입력의 차동 출력`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
/*__MORE__*/
})();
