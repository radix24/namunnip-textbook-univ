/* 공통4 실습: RLC 직렬 회로의 공명 곡선 (08-01) */
(() => {
  "use strict";
  const S = QSim.card("lab-c4-rlc"); if (!S) return;
  const [c1, c2] = S.$$("canvas"), Vrms = 120;
  const P = () => ({ R: S.val("R"), L: S.val("L"), C: S.val("C") * 1e-6, f: S.val("f") });
  const calc = (p, f) => { const w = 2 * Math.PI * f, XL = w * p.L, XC = 1 / (w * p.C), Z = Math.hypot(p.R, XL - XC); return { w, XL, XC, Z, I: Vrms / Z, phi: Math.atan2(XL - XC, p.R) }; };
  function draw() {
    const Cc = QSim.col(), p = P(), o = calc(p, p.f), f0 = 1 / (2 * Math.PI * Math.sqrt(p.L * p.C)), Imax = Vrms / p.R;
    let v = QSim.view(c1, 0.5), fr = QSim.frame(v, { x0: 0, x1: 300, y0: 0, y1: Math.max(1.3, Imax * 1.1), xl: "f (Hz)", yl: "I_rms (A)" }); fr.axes();
    fr.fn((f) => calc(p, Math.max(f, 0.5)).I, Cc.main, 2.5);
    fr.path([[f0, 0], [f0, Imax]], Cc.ink3, 1, [3, 3]); fr.text("f₀", f0 + 3, Imax * 0.95, Cc.ink3);
    fr.dot(p.f, o.I, Cc.acc, 6);
    // 페이저: 전류 기준(수평), 전압 VR, VL-VC
    v = QSim.view(c2, 0.42); const m = Math.max(o.I * p.R, Math.abs(o.I * (o.XL - o.XC)), 1) * 1.15;
    fr = QSim.frame(v, { x0: -0.2 * m, x1: 1.6 * m, y0: -m, y1: m, equal: true, pad: 4 });
    fr.path([[-0.2 * m, 0], [1.6 * m, 0]], Cc.rule, 1);
    fr.arrow(0, 0, o.I * p.R, 0, Cc.ink2, "V_R");
    fr.arrow(o.I * p.R, 0, 0, o.I * (o.XL - o.XC), Cc.main, "V_L − V_C");
    fr.arrow(0, 0, o.I * p.R, o.I * (o.XL - o.XC), Cc.acc, "V");
    S.out(`f = ${p.f} Hz: X_L = ωL = ${o.XL.toFixed(1)} Ω, X_C = 1/ωC = ${o.XC.toFixed(1)} Ω, Z = ${o.Z.toFixed(1)} Ω\n` +
      `I_rms = ${o.I.toFixed(3)} A, 위상차 φ = ${(o.phi * 180 / Math.PI).toFixed(1)}° (${o.phi > 0.01 ? "전압이 앞섬, 유도성" : o.phi < -0.01 ? "전류가 앞섬, 용량성" : "같은 위상, 공명"}), 평균 전력 ${(o.I * o.I * p.R).toFixed(1)} W\n` +
      `공명 진동수 f₀ = 1/(2π√(LC)) = ${f0.toFixed(1)} Hz, 공명 때 전류 ${Imax.toFixed(2)} A (전원 120 V 실효)`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();
