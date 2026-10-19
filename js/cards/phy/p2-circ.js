/* 물리2 실습 카드 묶음: 보드 도표, 정류와 평활, 공통 이미터 증폭기 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const eng = (x, u) => { const a = Math.abs(x); const p = [[1e6, "M"], [1e3, "k"], [1, ""], [1e-3, "m"], [1e-6, "μ"], [1e-9, "n"]].find(([v]) => a >= v * 0.9999) || [1e-9, "n"]; return +(x / p[0]).toPrecision(3) + " " + p[1] + u; };

  /* 1. RC 필터의 보드 도표 (03-03) */
  (() => {
    const S = QSim.card("lab-p2-bode"); if (!S) return;
    const [cvB, cvT] = S.$$("canvas");
    function draw() {
      const c = C(), R = 10 ** S.val("lr"), Cc = 10 ** S.val("lc") * 1e-9, hp = S.val("type") === "hp", fc = 1 / (2 * Math.PI * R * Cc), fm = 10 ** S.val("lf");
      const H = (f) => { const x = f / fc; return hp ? [x / Math.sqrt(1 + x * x), 90 - Math.atan(x) * 180 / Math.PI] : [1 / Math.sqrt(1 + x * x), -Math.atan(x) * 180 / Math.PI]; };
      const v = QSim.view(cvB, 0.5), f = QSim.frame(v, { x0: 1, x1: 6, y0: -60, y1: 10, xl: "log₁₀ f (Hz)", yl: "이득 (dB)" }); f.axes();
      f.fn((x) => 20 * Math.log10(H(10 ** x)[0]), c.main, 2.5);
      f.fn((x) => H(10 ** x)[1] / 90 * 30 - 25, c.acc, 1.5, [5, 4]);
      f.path([[Math.log10(fc), -60], [Math.log10(fc), 10]], c.ink3, 1, [3, 3]);
      const [g, ph] = H(fm); f.dot(Math.log10(fm), 20 * Math.log10(g), c.warn, 6);
      const vt = QSim.view(cvT, 0.3), T = 2 / fm, ft = QSim.frame(vt, { x0: 0, x1: T * 1000, y0: -1.2, y1: 1.2, xl: "t (ms)", yl: "V" }); ft.axes({ noGrid: true });
      ft.fn((t) => Math.sin(2 * Math.PI * fm * t / 1000), c.ink3, 1.5); ft.fn((t) => g * Math.sin(2 * Math.PI * fm * t / 1000 + ph * Math.PI / 180), c.main, 2);
      S.out(`${hp ? "고역" : "저역"} 통과 RC 필터, R = ${eng(R, "Ω")}, C = ${eng(Cc, "F")} → f_c = 1/(2πRC) = ${eng(fc, "Hz")} (점선)\n입력 ${eng(fm, "Hz")}: 이득 ${g.toFixed(3)} (${(20 * Math.log10(g)).toFixed(1)} dB), 위상 ${ph.toFixed(1)}° (주황 점선: 위상, 가운데가 0°, 위아래 끝이 ±90°)\n아래: 입력(회색)과 출력(파랑) 파형 두 주기`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 정류와 평활 축전기의 리플 (04-02) */
  (() => {
    const S = QSim.card("lab-p2-rect"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), Vp = S.val("vp"), Cc = S.val("cap") * 1e-6, RL = S.val("rl"), full = S.val("mode") === "full", f = 60, nd = full ? 2 : 1;
      const src = (t) => { const s = Vp * Math.sin(2 * Math.PI * f * t); return full ? Math.abs(s) - 1.4 : Math.max(0, s - 0.7); };
      const T = 3 / f, n = 3000, dt = T / n; let vc = 0; const pin = [], pout = []; let mn = 1e9, mx = -1e9;
      for (let i = 0; i <= n; i++) { const t = i * dt, s = src(t); if (s > vc) vc = s; else vc -= vc / (RL * Cc) * dt; pin.push([t * 1000, s]); pout.push([t * 1000, vc]); if (t > T / 3) { mn = Math.min(mn, vc); mx = Math.max(mx, vc); } }
      const v = QSim.view(cv, 0.5), fr = QSim.frame(v, { x0: 0, x1: T * 1000, y0: 0, y1: Vp * 1.1, xl: "t (ms)", yl: "V" }); fr.axes();
      fr.path(pin, c.ink3, 1.2, [3, 3]); fr.path(pout, c.main, 2.5);
      const I = (mx + mn) / 2 / RL, est = I / (f * nd * Cc);
      S.out(`${full ? "브리지 전파" : "반파"} 정류, 2차 전압 진폭 ${Vp} V, C = ${S.val("cap")} μF, 부하 ${RL} Ω (60 Hz)\n출력 봉우리 ${mx.toFixed(2)} V, 골짜기 ${mn.toFixed(2)} V, 리플 ${(mx - mn).toFixed(3)} V, 평균 전류 ${(I * 1000).toFixed(1)} mA\n어림식 I/(f_r C) = ${est.toFixed(3)} V (f_r = ${60 * nd} Hz)${mn < 7 ? "\n골짜기가 7 V 아래라 7805(5 V 조정기)의 입력으로는 모자랄 수 있다" : ""}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 공통 이미터 증폭기: 동작점과 잘림 (05-02) */
  (() => {
    const S = QSim.card("lab-p2-ce"); if (!S) return;
    const [cvL, cvW] = S.$$("canvas");
    function draw() {
      const c = C(), Vcc = 15, R1 = S.val("r1"), R2 = S.val("r2"), RE = S.val("re"), RC = S.val("rc"), vin = S.val("vin") / 1000;
      const VB = Vcc * R2 / (R1 + R2), VE = Math.max(0, VB - 0.65), IC = VE / RE, VC = Vcc - IC * RC;  // kΩ, mA
      const sat = VC - VE < 0.2, Av = -RC / RE;
      const vl = QSim.view(cvL, 0.42), Imax = Vcc / (RC + RE), fl = QSim.frame(vl, { x0: 0, x1: Vcc, y0: 0, y1: Imax * 1.2, xl: "V_CE (V)", yl: "I_C (mA)" }); fl.axes();
      fl.path([[0, Imax], [Vcc, 0]], c.main, 2);
      if (!sat) fl.dot(VC - VE, IC, c.warn, 6); else fl.dot(0.2, Imax * 0.98, c.warn, 6);
      const lo = VE + 0.2, hi = Vcc;
      const vw = QSim.view(cvW, 0.32), fw = QSim.frame(vw, { x0: 0, x1: 2, y0: 0, y1: Vcc, xl: "주기", yl: "V_C (V)" }); fw.axes({ noGrid: true });
      const out = (t) => Math.min(hi, Math.max(lo, (sat ? lo : VC) + Av * vin * Math.sin(2 * Math.PI * t)));
      fw.fn((t) => (sat ? lo : VC) + Av * vin * Math.sin(2 * Math.PI * t), c.ink3, 1, [4, 4]); fw.fn(out, c.main, 2.2);
      const clip = (sat ? true : VC + Math.abs(Av) * vin > hi || VC - Math.abs(Av) * vin < lo);
      S.out(`V_B = ${VB.toFixed(2)} V, V_E = ${VE.toFixed(2)} V, I_C ≈ ${IC.toFixed(2)} mA, V_C = ${sat ? "포화" : VC.toFixed(2) + " V"}, V_CE = ${sat ? "≈ 0.2" : (VC - VE).toFixed(2)} V\n이득 ≈ −R_C/R_E = ${Av.toFixed(1)}, 입력 진폭 ${S.val("vin")} mV → 출력 진폭 ${(Math.abs(Av) * vin).toFixed(2)} V\n${sat ? "포화: 동작점이 부하선 위쪽 끝에 붙어 증폭이 안 된다" : clip ? "출력이 잘린다 (위: 전원 15 V, 아래: 포화 V_E + 0.2 V). 입력을 줄이거나 V_C를 가운데로 옮긴다" : "잘림 없이 증폭된다"}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

})();
