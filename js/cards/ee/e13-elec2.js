/* 전전13 전자회로(2) 탐구 카드 묶음
   1 Miller 근사와 정확한 응답(01-02)  2 위상 여유와 주극점 보상(02-02)  3 B급·AB급 출력(03-02)
   4 필터 차수(04-01)  5 Wien 브리지 발진(05-01)  6 SAR ADC와 R-2R(06-02) */
(() => {
  "use strict";
  if (!window.QSim) return;
  const C = () => QSim.col();
  const f2 = (x, d = 3) => (Math.abs(x) < 5e-13 ? 0 : x).toFixed(d);
  const cx = (re, im = 0) => ({ re, im });
  const mul = (a, b) => cx(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
  const div = (a, b) => { const d = b.re * b.re + b.im * b.im; return cx((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); };
  const abs = (a) => Math.hypot(a.re, a.im), arg = (a) => Math.atan2(a.im, a.re);
  const fmtf = (f) => f >= 1e9 ? f2(f / 1e9, 3) + " GHz" : f >= 1e6 ? f2(f / 1e6, 3) + " MHz" : f >= 1e3 ? f2(f / 1e3, 3) + " kHz" : f2(f, 1) + " Hz";

  /* 1. 공통 소스 증폭기의 고주파 응답: Miller 근사 vs 정확한 2극점 식 */
  (() => {
    const S = QSim.card("exp-e13-miller"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), Rs = S.val("rs") * 1e3, Cgd = S.val("cgd") * 1e-12, gm = 4e-3, RL = 5e3, Cgs = 2e-12, CL = 1e-12, A0 = gm * RL;
      const b1 = Rs * (Cgs + Cgd * (1 + gm * RL)) + RL * (CL + Cgd), b2 = Rs * RL * (Cgs * Cgd + Cgs * CL + Cgd * CL);
      const H = (f) => { const w = 2 * Math.PI * f; return div(cx(-A0, A0 * w * Cgd / gm), cx(1 - w * w * b2, w * b1)); };
      const fM = 1 / (2 * Math.PI * Rs * (Cgs + Cgd * (1 + A0)));
      const HM = (f) => A0 / Math.hypot(1, f / fM);
      let lo = 1e3, hi = 1e10; for (let i = 0; i < 100; i++) { const m = Math.sqrt(lo * hi); if (abs(H(m)) > A0 / Math.SQRT2) lo = m; else hi = m; }
      const disc = b1 * b1 - 4 * b2, p2 = (b1 + Math.sqrt(disc)) / (2 * b2) / (2 * Math.PI);
      const v = QSim.view(cv, 0.45), fr = QSim.frame(v, { x0: 4, x1: 10, y0: -20, y1: 30, xl: "log₁₀ f (Hz)", yl: "|A| (dB)" }); fr.axes();
      fr.fn((lf) => 20 * Math.log10(abs(H(10 ** lf))), c.main, 2.4, undefined, 500);
      fr.fn((lf) => 20 * Math.log10(HM(10 ** lf)), c.acc, 1.8, [6, 3], 500);
      S.out(`g_m = 4 mA/V, R_L' = 5 kΩ(중간 대역 이득 −${A0}), C_gs = 2 pF, C_L = 1 pF, R_sig = ${f2(Rs / 1e3, 1)} kΩ, C_gd = ${f2(Cgd * 1e12, 2)} pF\n` +
        `Miller 입력 용량 C_gs + C_gd(1 + g_mR_L') = ${f2((Cgs + Cgd * (1 + A0)) * 1e12, 2)} pF → 극점 ${fmtf(fM)} (주황 점선). 정확한 −3 dB ${fmtf(lo)} (파랑)\n` +
        `정확한 둘째 극점 ${fmtf(p2)}, 영점 g_m/(2πC_gd) = ${fmtf(gm / (2 * Math.PI * Cgd))}. 주극점은 Miller 근사가 잘 맞고, 둘째 극점은 근사(출력 극점 1/(2πR_L'(C_L + C_gd)) = ${fmtf(1 / (2 * Math.PI * RL * (CL + Cgd)))})보다 훨씬 높습니다(극점 분리).`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 루프 이득의 위상 여유 */
  (() => {
    const S = QSim.card("exp-e13-pm"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), beta = 10 ** S.val("lb"), comp = S.val("comp"), A0 = 1000;
      const ps = comp ? [1e3, 1e7, 1e8] : [1e6, 1e7, 1e8];
      const L = (f) => { let v = cx(A0 * beta); ps.forEach((p) => { v = div(v, cx(1, f / p)); }); return v; };
      let lo = 1, hi = 1e12; for (let i = 0; i < 200; i++) { const m = Math.sqrt(lo * hi); if (abs(L(m)) > 1) lo = m; else hi = m; }
      const fu = A0 * beta > 1 ? lo : null;
      let ph = fu ? arg(L(fu)) * 180 / Math.PI : null; if (ph !== null && ph > 0) ph -= 360;
      const pm = fu ? 180 + ph : null;
      // 위상이 −180°가 되는 주파수와 이득 여유
      let a = 1, b = 1e12; const phase = (f) => -ps.reduce((s, p) => s + Math.atan(f / p), 0) * 180 / Math.PI;
      for (let i = 0; i < 200; i++) { const m = Math.sqrt(a * b); if (phase(m) > -180) a = m; else b = m; }
      const gmDb = -20 * Math.log10(abs(L(a)));
      const v = QSim.view(cv, 0.5), fr = QSim.frame(v, { x0: 2, x1: 10, y0: -80, y1: 60, xl: "log₁₀ f", yl: "|Aβ| dB" }); fr.axes();
      fr.fn((lf) => 20 * Math.log10(abs(L(10 ** lf))), c.main, 2.4, undefined, 500);
      fr.fn((lf) => phase(10 ** lf) / 180 * 40 + 0, c.acc, 1.6, [6, 3], 500);
      if (fu) fr.path([[Math.log10(fu), -80], [Math.log10(fu), 60]], c.ink3, 1, [2, 3]);
      S.out(`A₀ = 1000(60 dB), 극점 ${ps.map(fmtf).join(", ")}${comp ? " (주극점을 1 kHz로 낮춤)" : ""}, β = ${f2(beta, 3)} → 폐루프 이득 약 ${f2(A0 / (1 + A0 * beta), 2)}\n` +
        (fu ? `루프 이득 교차 주파수 ${fmtf(fu)}, 위상 여유 ${f2(pm, 1)}°${pm <= 0 ? " → 불안정(발진)" : pm < 45 ? " → 안정하지만 계단 응답이 크게 출렁임" : " → 충분히 안정"}` : `루프 이득이 1보다 작아 교차점이 없음`) +
        `, 이득 여유 ${f2(gmDb, 1)} dB(위상 −180°인 ${fmtf(a)}에서). 파랑: |Aβ|, 주황 점선: 위상(−180°가 아래 −40 눈금)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. B급·AB급 푸시풀 출력과 교차 왜곡 */
  (() => {
    const S = QSim.card("exp-e13-classb"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), Vp = S.val("vp"), Vbb = S.val("vbb"), VCC = 10, Von = 0.6;
      // 각 트랜지스터는 베이스-이미터 전압 0.6 V가 넘어야 켜진다고 근사. AB급은 Vbb/2씩 미리 걸어 줌
      const vo = (vi) => { const dz = Math.max(0, Von - Vbb / 2); const o = vi > dz ? vi - dz : vi < -dz ? vi + dz : 0; return Math.max(-VCC + 0.3, Math.min(VCC - 0.3, o)); };
      const M = 2000; let p1 = 0, pt = 0;
      const pts = []; for (let i = 0; i <= M; i++) { const t = i / M, vi = Vp * Math.sin(2 * Math.PI * t), o = vo(vi); pts.push([t, o]); }
      // 기본파 성분과 THD
      let a1 = 0; for (let i = 0; i < M; i++) a1 += pts[i][1] * Math.sin(2 * Math.PI * i / M); a1 *= 2 / M;
      for (let i = 0; i < M; i++) { pt += pts[i][1] ** 2; } pt /= M; p1 = a1 * a1 / 2;
      const thd = Math.sqrt(Math.max(0, pt - p1) / p1);
      const eff = Math.PI / 4 * Math.min(Math.abs(a1), VCC) / VCC;
      const v = QSim.view(cv, 0.45), fr = QSim.frame(v, { x0: 0, x1: 1, y0: -10.5, y1: 10.5, xl: "t (주기)", yl: "V" }); fr.axes();
      fr.fn((t) => Vp * Math.sin(2 * Math.PI * t), c.ink3, 1.2, [5, 3]);
      fr.path(pts, c.main, 2.4);
      S.out(`입력 진폭 ${f2(Vp, 1)} V, 바이어스 V_BB = ${f2(Vbb, 2)} V(트랜지스터마다 ${f2(Vbb / 2, 2)} V), 켜짐 전압 0.6 V로 근사, V_CC = ±10 V\n` +
        `출력 기본파 진폭 ${f2(a1, 2)} V, 전고조파 왜곡(THD) ${f2(thd * 100, 2)}%. ${Vbb >= 1.2 ? "AB급: 두 트랜지스터가 0 근처에서 함께 켜져 데드 존이 없음" : `B급 쪽: |v_in| < ${f2(Math.max(0, 0.6 - Vbb / 2), 2)} V 구간에서 출력 0(교차 왜곡)`}\n` +
        `이상적 B급 효율 (π/4)(V_p/V_CC) = ${f2(eff * 100, 1)}% (출력 진폭 기준). 회색 점선: 입력, 파랑: 출력`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 사양에서 필터 차수 정하기: 버터워스와 체비셰프 */
  (() => {
    const S = QSim.card("exp-e13-order"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), fs = S.val("fs"), As = S.val("as"), rip = S.val("rip");   // fp = 1 kHz, Ap = 3 dB(버터) / rip dB(체비)
      const nB = Math.ceil(Math.log10(10 ** (As / 10) - 1) / (2 * Math.log10(fs)));
      const eps = Math.sqrt(10 ** (rip / 10) - 1);
      const nC = Math.ceil(Math.acosh(Math.sqrt((10 ** (As / 10) - 1)) / eps) / Math.acosh(fs));
      const butter = (f) => -10 * Math.log10(1 + f ** (2 * nB));
      const cheb = (f) => { const x = f <= 1 ? Math.cos(nC * Math.acos(f)) : Math.cosh(nC * Math.acosh(f)); return -10 * Math.log10(1 + eps * eps * x * x); };
      const v = QSim.view(cv, 0.45), fr = QSim.frame(v, { x0: 0, x1: 5, y0: -80, y1: 5, xl: "f (kHz)", yl: "dB" }); fr.axes();
      fr.path([[fs, -As], [5, -As]], c.warn, 1.6); fr.path([[fs, 5], [fs, -As]], c.warn, 1, [3, 3]);
      fr.fn(butter, c.main, 2.4, undefined, 600); fr.fn(cheb, c.acc, 2, [6, 3], 600);
      S.out(`통과 대역 끝 1 kHz, 저지 대역 ${f2(fs, 1)} kHz에서 ${As} dB 이상 감쇠(빨간 선)\n` +
        `버터워스(통과 끝 −3 dB): 차수 N ≥ log(10^(A_s/10) − 1)/(2 log(f_s/f_p)) → ${nB}차(파랑), ${f2(fs, 1)} kHz에서 ${f2(-butter(fs), 1)} dB\n` +
        `체비셰프(통과 대역 리플 ${rip} dB): ${nC}차(주황 점선), ${f2(fs, 1)} kHz에서 ${f2(-cheb(fs), 1)} dB. 리플을 허용하면 차수가 줄어듭니다.`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 5. Wien 브리지 발진기: 이득에 따른 진폭 성장 */
  (() => {
    const S = QSim.card("exp-e13-wien"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), A = S.val("a"), R = 10e3, Cc = S.val("cn") * 1e-9, w0 = 1 / (R * Cc), f0 = w0 / (2 * Math.PI);
      const sigma = (A - 3) * w0 / 2, wd = Math.sqrt(Math.max(0, w0 * w0 - sigma * sigma));
      const T0 = 1 / f0, tmax = 10 * T0;
      const x = (t) => Math.exp(sigma * t) * Math.sin(wd * t);
      const xmax = Math.max(1.2, Math.min(50, Math.exp(sigma * tmax) * 1.1));
      const v = QSim.view(cv, 0.45), fr = QSim.frame(v, { x0: 0, x1: 10, y0: -xmax, y1: xmax, xl: "t / T₀" }); fr.axes();
      fr.fn((u) => Math.max(-xmax, Math.min(xmax, x(u * T0))), c.main, 2, undefined, 1500);
      S.out(`R = 10 kΩ, C = ${f2(Cc * 1e9, 1)} nF → f₀ = 1/(2πRC) = ${fmtf(f0)}. 귀환망 이득 β(f₀) = 1/3, 위상 0°\n` +
        `증폭기 이득 A = ${f2(A, 2)}: 루프 이득 Aβ = ${f2(A / 3, 3)} → 진폭이 주기마다 ${f2(Math.exp(sigma * T0), 3)}배 ${A > 3 ? "커짐(발진 시작)" : A < 3 ? "작아짐(꺼짐)" : "유지"}\n` +
        `Barkhausen 조건: Aβ = 1(크기)과 위상 0°. 실제 회로는 A를 3보다 조금 크게 두어 시작시키고, 진폭이 커지면 이득을 줄이는 비선형 소자로 3에 머물게 합니다.`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 6. SAR ADC의 이진 탐색과 R-2R DAC */
  (() => {
    const S = QSim.card("exp-e13-sar"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), vin = S.val("vin"), Vref = 5, N = 8;
      let code = 0; const steps = [];
      for (let b = N - 1; b >= 0; b--) { const trial = code | (1 << b), vd = Vref * trial / 2 ** N, keep = vin >= vd; steps.push([trial, vd, keep]); if (keep) code = trial; }
      const v = QSim.view(cv, 0.45), fr = QSim.frame(v, { x0: 0, x1: N + 0.5, y0: 0, y1: Vref, xl: "단계", yl: "V" }); fr.axes();
      fr.path([[0, vin], [N + 0.5, vin]], c.warn, 1.6, [6, 3]);
      const pts = [[0, 0]]; steps.forEach(([tr, vd], i) => { pts.push([i + 0.5, vd]); });
      fr.path(pts.slice(1).flatMap(([x, y]) => [[x - 0.35, y], [x + 0.35, y]]), c.main, 2.4);
      steps.forEach(([tr, vd, keep], i) => fr.dot(i + 0.5, vd, keep ? c.main : c.ink3, 4));
      S.out(`V_ref = 5 V, 8비트. 입력 ${f2(vin, 3)} V(빨간 점선)\n` +
        steps.map(([tr, vd, keep], i) => `${i + 1}: ${tr.toString(2).padStart(8, "0")}→${f2(vd, 3)} V ${keep ? "유지" : "버림"}`).join(", ") + `\n` +
        `결과 ${code.toString(2).padStart(8, "0")} = ${code}, R-2R DAC 출력 5 × ${code}/256 = ${f2(Vref * code / 256, 4)} V, 양자화 오차 ${f2((vin - Vref * code / 256) * 1000, 2)} mV(1 LSB = 19.53 mV)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
