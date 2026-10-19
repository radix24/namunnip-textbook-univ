/* 기계7 기계공학실험(1) 5단원: 연산증폭기 증폭단의 이득, 포화, 대역폭, 오프셋 (05-01) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-amp"); if (!S) return;
  const [cv] = S.$$("canvas");
  const GBW = 1e6, Vsat = 11, Vos = 50e-6; // 이득-대역폭 1 MHz, ±12 V 전원 → 출력 ±11 V, 입력 오프셋 50 μV (가상 사양)
  function draw() {
    const c = QSim.col(), cfg = S.val("cfg"), R1 = S.val("R1") * 1000, R2 = S.val("R2") * 1000, amp = S.val("amp") / 1000, fq = S.val("fq");
    let G;
    if (cfg === "inv") G = -R2 / R1; else if (cfg === "non") G = 1 + R2 / R1; else G = 1 + (2 * 50000) / R1;
    const ag = Math.abs(G), fc = GBW / ag, att = 1 / Math.sqrt(1 + (fq / fc) ** 2), ph = -Math.atan(fq / fc);
    const off = Vos * ag * Math.sign(G || 1);
    const Tw = 2 / fq, vin = (t) => amp * Math.sin(2 * Math.PI * fq * t);
    const vout = (t) => Math.max(-Vsat, Math.min(Vsat, G * att * amp * Math.sin(2 * Math.PI * fq * t + ph) + off));
    const peak = ag * att * amp + Math.abs(off), clip = peak > Vsat;
    const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: Tw * 1000, y0: -12.5, y1: 12.5, xl: "t (ms)", yl: "V", pad: 30 });
    f.axes();
    f.path([[0, Vsat], [Tw * 1000, Vsat]], c.ink3, 1, [4, 3]); f.path([[0, -Vsat], [Tw * 1000, -Vsat]], c.ink3, 1, [4, 3]);
    f.fn((tm) => vin(tm / 1000) * 100, c.acc, 1.5, [2, 3]);
    f.fn((tm) => vout(tm / 1000), c.main, 2.5);
    const name = cfg === "inv" ? "반전 증폭기 −R_f/R_in" : cfg === "non" ? "비반전 증폭기 1 + R_f/R_g" : "계측 증폭기 1 + 2(50 kΩ)/R_g";
    S.out(`${name}: 이상 이득 ${G.toFixed(1)}, 대역폭 ≈ GBW/|G| = ${fc >= 1000 ? (fc / 1000).toFixed(1) + " kHz" : fc.toFixed(0) + " Hz"}\n입력 진폭 ${(amp * 1000).toFixed(2)} mV, ${fq} Hz → 이득 감쇠 ${(att * 100).toFixed(1)}%, 출력 진폭 ${(ag * att * amp).toFixed(3)} V, 출력 오프셋 ${(off * 1000).toFixed(1)} mV\n${clip ? "출력이 ±11 V에서 잘림 (포화)! 이득이나 입력을 줄이세요" : "포화 없음"} (초록 점선: 입력 × 100)`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();
