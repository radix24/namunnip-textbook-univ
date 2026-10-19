/* 전전23~33 탐구 카드: 벅 컨버터 리플(24-03-02), Fabry-Perot 공진기(28-01-04), TCP 혼잡 창(29-03-02), CMOS 인버터 VTC(30-01-01) */
(() => {
  "use strict";
  if (!window.QSim) return;
  const C = () => QSim.col();
  const f2 = (x, d = 3) => (Math.abs(x) < 5e-13 ? 0 : x).toFixed(d);

  /* 1. 벅 컨버터의 인덕터 전류 */
  (() => {
    const S = QSim.card("exp-e24-buck"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), vin = S.val("vin"), D = S.val("d"), L = S.val("l") * 1e-6, fs = S.val("f") * 1e3, io = S.val("io");
      const vo = D * vin, T = 1 / fs, dI = (vin - vo) * D * T / L, imax = io + dI / 2, imin = io - dI / 2;
      const dcm = imin < 0;
      const iL = (t) => { const u = (t % T) / T; return u < D ? imin + dI * u / D : imax - dI * (u - D) / (1 - D); };
      const v = QSim.view(cv, 0.45), top = Math.max(imax, io) * 1.25 + 0.1, bot = Math.min(0, imin) - 0.1;
      const fr = QSim.frame(v, { x0: 0, x1: 3, y0: bot, y1: top, xl: "t / T (주기)", yl: "i_L (A)" }); fr.axes();
      fr.path([[0, io], [3, io]], c.ink3, 1, [4, 3]);
      fr.path([[0, 0], [3, 0]], c.rule, 1);
      fr.fn((x) => iL(x * T), dcm ? c.warn : c.main, 2.4, undefined, 600);
      S.out(`V_in = ${f2(vin, 1)} V, D = ${f2(D, 2)} → V_o = D·V_in = ${f2(vo, 3)} V (연속 전도 가정)\n` +
        `ΔI_L = (V_in − V_o)D/(L f_s) = ${f2(dI, 4)} A (부하 전류의 ${f2(100 * dI / io, 1)}%), 최대 ${f2(imax, 4)} A, 최소 ${f2(imin, 4)} A\n` +
        (dcm ? `최소 전류가 0보다 작아집니다: 실제로는 불연속 전도(DCM)가 되어 V_o = D·V_in 식이 맞지 않습니다. 경계 부하 전류 ΔI/2 = ${f2(dI / 2, 4)} A.`
             : `연속 전도(CCM). 부하 전류를 ΔI/2 = ${f2(dI / 2, 4)} A 아래로 줄이면 불연속 전도가 됩니다.`));
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. Fabry-Perot 공진기의 투과 스펙트럼 */
  (() => {
    const S = QSim.card("exp-e28-fp"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), R = S.val("r"), Lm = S.val("lm") * 1e-3, n = S.val("n"), cl = 2.998e8, nu0 = 193.4e12;
      const fsr = cl / (2 * n * Lm), F = Math.PI * Math.sqrt(R) / (1 - R), dnu = fsr / F, coef = 4 * R / ((1 - R) * (1 - R));
      const Tn = (x) => 1 / (1 + coef * Math.sin(Math.PI * x) ** 2); // x = 주파수 / FSR
      const v = QSim.view(cv, 0.45), fr = QSim.frame(v, { x0: 0, x1: 3, y0: 0, y1: 1.1, xl: "주파수 / FSR", yl: "투과율" }); fr.axes();
      fr.fn(Tn, c.main, 2.2, undefined, 2400);
      fr.path([[0, 0.5], [3, 0.5]], c.ink3, 1, [4, 3]);
      S.out(`R = ${f2(R, 2)}, L = ${f2(Lm * 1e3, 2)} mm, n = ${f2(n, 2)}\n` +
        `자유 스펙트럼 범위 FSR = c/(2nL) = ${f2(fsr / 1e9, 1)} GHz, 미세도 F = π√R/(1 − R) = ${f2(F, 1)}\n` +
        `투과 봉우리 반치폭 δν = FSR/F = ${f2(dnu / 1e9, 3)} GHz, 1550 nm(193.4 THz)에서 Q = ν/δν = ${(nu0 / dnu).toExponential(3)}, 최소 투과율 ${f2(1 / (1 + coef), 4)}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. TCP 혼잡 창 */
  (() => {
    const S = QSim.card("exp-e29-tcp"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), ss0 = S.val("ss"), lr = S.val("lr"), ev = S.val("ev"), alg = S.val("alg"), N = 30;
      let cw = 1, ss = ss0, tot = 0, atLoss = 0, newSs = 0; const pts = [];
      for (let r = 0; r < N; r++) {
        pts.push([r, cw]); tot += cw;
        if (r === lr) { atLoss = cw; ss = Math.max(Math.floor(cw / 2), 2); newSs = ss; cw = (alg === "reno" && ev === "dup") ? ss : 1; continue; }
        cw = cw < ss ? Math.min(cw * 2, ss) : cw + 1;
      }
      const ymax = Math.max(...pts.map((p) => p[1])) * 1.15 + 1;
      const v = QSim.view(cv, 0.5), fr = QSim.frame(v, { x0: 0, x1: N - 1, y0: 0, y1: ymax, xl: "전송 라운드(RTT)", yl: "혼잡 창 (세그먼트)" }); fr.axes();
      fr.path([[0, ss0], [lr, ss0]], c.ink3, 1, [4, 3]); fr.path([[lr, newSs], [N - 1, newSs]], c.ink3, 1, [4, 3]);
      fr.path(pts, c.main, 2); pts.forEach(([x, y]) => fr.dot(x, y, x === lr ? c.warn : c.main, x === lr ? 5 : 2.5));
      S.out(`${alg === "reno" ? "TCP Reno" : "TCP Tahoe"}, 처음 ssthresh = ${ss0}, 라운드 ${lr}에서 ${ev === "dup" ? "중복 ACK 3개" : "타임아웃"}\n` +
        `손실 때 혼잡 창 ${atLoss} → ssthresh = ${newSs}, 다음 혼잡 창 ${(alg === "reno" && ev === "dup") ? newSs + "(빠른 회복, 선형 증가로 바로 들어감)" : "1(느린 시작부터 다시)"}\n` +
        `30라운드 동안 보낸 세그먼트 합 ${tot}개, 마지막 혼잡 창 ${pts[N - 1][1]}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. CMOS 인버터의 전압 전달 특성 */
  (() => {
    const S = QSim.card("exp-e30-vtc"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), vdd = S.val("vdd"), vt = S.val("vt"), ratio = S.val("ratio"), lam = 0.05, kn = 1, kp = ratio;
      const id = (k, vgs, vds) => { if (vgs <= vt) return 0; const ov = vgs - vt; return vds < ov ? k * (ov * vds - vds * vds / 2) : k * ov * ov / 2 * (1 + lam * vds); };
      const vout = (vin) => { let lo = 0, hi = vdd; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (id(kn, vin, m) - id(kp, vdd - vin, vdd - m) > 0) hi = m; else lo = m; } return (lo + hi) / 2; };
      const M = 3000, xs = [], ys = [];
      for (let i = 0; i <= M; i++) { const x = vdd * i / M; xs.push(x); ys.push(vout(x)); }
      let vm = 0, vil = null, vih = null, voh = 0, vol = 0;
      for (let i = 1; i <= M; i++) {
        if (ys[i - 1] >= xs[i - 1] && ys[i] < xs[i]) vm = xs[i];
        const g = (ys[i] - ys[i - 1]) / (xs[i] - xs[i - 1]);
        if (vil === null && g <= -1) { vil = xs[i]; voh = ys[i]; }
        if (vil !== null && g <= -1) { vih = xs[i]; vol = ys[i]; }
      }
      const v = QSim.view(cv, 0.8), fr = QSim.frame(v, { x0: 0, x1: vdd, y0: 0, y1: vdd, xl: "V_in (V)", yl: "V_out (V)", equal: true }); fr.axes();
      fr.path([[0, 0], [vdd, vdd]], c.rule, 1, [4, 3]);
      fr.path(xs.map((x, i) => [x, ys[i]]), c.main, 2.4);
      fr.dot(vm, vm, c.warn, 5); if (vil !== null) { fr.dot(vil, voh, c.acc, 4); fr.dot(vih, vol, c.acc, 4); }
      S.out(`V_DD = ${f2(vdd, 2)} V, |V_T| = ${f2(vt, 2)} V, k_p/k_n = ${f2(ratio, 2)} (긴 채널 제곱 법칙, λ = 0.05/V)\n` +
        `스위칭 문턱 V_M = ${f2(vm, 3)} V (빨간 점, 공식 (V_T + r(V_DD − V_T))/(1 + r), r = √(k_p/k_n): ${f2((vt + Math.sqrt(ratio) * (vdd - vt)) / (1 + Math.sqrt(ratio)), 3)} V)\n` +
        (vil === null ? "이득이 1보다 작아 잡음 여유를 정의할 수 없습니다." :
          `기울기 −1인 점: V_IL = ${f2(vil, 3)} V (V_OH = ${f2(voh, 3)} V), V_IH = ${f2(vih, 3)} V (V_OL = ${f2(vol, 3)} V) → NM_L = V_IL − V_OL = ${f2(vil - vol, 3)} V, NM_H = V_OH − V_IH = ${f2(voh - vih, 3)} V`));
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

})();
