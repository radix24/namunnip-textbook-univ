/* 전전23~33 탐구 카드: 벅 컨버터(24-03-02), Fabry-Perot(28-01-04), TCP 혼잡 창(29-03-02), CMOS VTC(30-01-01), 편향-분산(23-01-02), pn 공핍(27-05-01), 페이지 교체(31-04-01) */
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

  /* 5. 편향-분산: 다항식 차수와 학습·검증 오차 */
  (() => {
    const S = QSim.card("exp-e23-biasvar"); if (!S) return;
    const cv = S.$("canvas");
    let seed = 12345;
    const rnd = () => { seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff; return (seed + 1) / 2147483649; };
    const gauss = () => { const u1 = rnd(), u2 = rnd(); return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2); };
    const NT = 12, NV = 60;
    const xt = [], nt = [], xv = [], nv = [];
    for (let i = 0; i < NT; i++) { xt.push((i + 0.5) / NT); nt.push(gauss()); }
    for (let j = 0; j < NV; j++) { xv.push((j + 0.5) / NV); nv.push(gauss()); }
    const truef = (x) => Math.sin(2 * Math.PI * x);
    function fit(d, ys, lam) {
      const n = d + 1, A = [], b = [];
      for (let r = 0; r < n; r++) { A.push(new Array(n).fill(0)); b.push(0); }
      for (let i = 0; i < NT; i++) {
        const t = 2 * xt[i] - 1, p = [1]; for (let k = 1; k < n; k++) p.push(p[k - 1] * t);
        for (let r = 0; r < n; r++) { b[r] += p[r] * ys[i]; for (let c = 0; c < n; c++) A[r][c] += p[r] * p[c]; }
      }
      for (let r = 0; r < n; r++) A[r][r] += lam;
      for (let k = 0; k < n; k++) {
        let piv = k; for (let r = k + 1; r < n; r++) if (Math.abs(A[r][k]) > Math.abs(A[piv][k])) piv = r;
        [A[k], A[piv]] = [A[piv], A[k]]; [b[k], b[piv]] = [b[piv], b[k]];
        for (let r = k + 1; r < n; r++) { const m = A[r][k] / A[k][k]; for (let c = k; c < n; c++) A[r][c] -= m * A[k][c]; b[r] -= m * b[k]; }
      }
      const w = new Array(n).fill(0);
      for (let k = n - 1; k >= 0; k--) { let s = b[k]; for (let c = k + 1; c < n; c++) s -= A[k][c] * w[c]; w[k] = s / A[k][k]; }
      return (x) => { const t = 2 * x - 1; let s = 0; for (let k = n - 1; k >= 0; k--) s = s * t + w[k]; return s; };
    }
    function draw() {
      const c = C(), d = S.val("d"), sig = S.val("s"), lam = +S.val("lam");
      const yt = xt.map((x, i) => truef(x) + sig * nt[i]), yv = xv.map((x, j) => truef(x) + sig * nv[j]);
      const mse = (f) => [xt.reduce((a, x, i) => a + (f(x) - yt[i]) ** 2, 0) / NT, xv.reduce((a, x, j) => a + (f(x) - yv[j]) ** 2, 0) / NV];
      const f = fit(d, yt, lam), [tr, va] = mse(f);
      let best = 0, bestv = Infinity; const list = [];
      for (let k = 0; k <= 9; k++) { const v = mse(fit(k, yt, lam))[1]; list.push(f2(v, 3)); if (v < bestv) { bestv = v; best = k; } }
      const v = QSim.view(cv, 0.55), fr = QSim.frame(v, { x0: 0, x1: 1, y0: -2, y1: 2, xl: "x", yl: "y" }); fr.axes();
      fr.fn(truef, c.ink3, 1.4, [5, 4]);
      fr.fn((x) => Math.max(-2, Math.min(2, f(x))), c.main, 2.4, undefined, 600);
      xv.forEach((x, j) => fr.dot(x, Math.max(-2, Math.min(2, yv[j])), c.rule, 2));
      xt.forEach((x, i) => fr.dot(x, Math.max(-2, Math.min(2, yt[i])), c.warn, 4.5));
      S.out(`학습 점 12개(빨강), 검증 점 60개(회색), 참 곡선 sin 2πx(점선), 잡음 σ = ${f2(sig, 2)}, λ = ${lam}\n` +
        `${d}차 다항식: 학습 MSE ${f2(tr, 4)}, 검증 MSE ${f2(va, 4)}\n` +
        `차수 0~9의 검증 MSE: ${list.join(", ")} → 가장 작은 차수 ${best}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 6. pn 접합의 공핍 근사: 전하, 전계, 전위 */
  (() => {
    const S = QSim.card("exp-e27-pn"); if (!S) return;
    const cv = S.$("canvas");
    const q = 1.602e-19, es = 11.7 * 8.854e-14, kT = 0.02585, ni = 1e10;
    function draw() {
      const c = C(), NA = 10 ** S.val("na"), ND = 10 ** S.val("nd"), V = S.val("v");
      const vbi = kT * Math.log(NA * ND / (ni * ni)), vt = vbi - V;
      const v = QSim.view(cv, 0.55);
      if (vt <= 0.02) { const fr = QSim.frame(v, { x0: -1, x1: 1, y0: -1, y1: 1 }); fr.text("순방향 전압이 V_bi에 너무 가까워 공핍 근사가 맞지 않습니다", 0, 0, c.warn, "center"); S.out(`V_bi = ${f2(vbi, 3)} V, V = ${f2(V, 2)} V: V_bi − V가 너무 작습니다.`); return; }
      const W = Math.sqrt(2 * es * vt / q * (1 / NA + 1 / ND)), xn = W * NA / (NA + ND), xp = W * ND / (NA + ND), Em = q * ND * xn / es;
      const um = 1e4, L = Math.max(xn, xp) * um * 1.25;
      const fr = QSim.frame(v, { x0: -L, x1: L, y0: -1.15, y1: 1.15, xl: "x (μm)", yl: "정규화한 값" }); fr.axes();
      const m = Math.max(NA, ND), a = -xp * um, b = xn * um;
      fr.path([[-L, 0], [a, 0], [a, -NA / m], [0, -NA / m], [0, ND / m], [b, ND / m], [b, 0], [L, 0]], c.ink3, 1.4, [4, 3]);
      fr.path([[-L, 0], [a, 0], [0, 1], [b, 0], [L, 0]], c.main, 2.4);
      const pot = (x) => { if (x <= a) return 0; if (x >= b) return 1; const xc = x / um; const vv = x < 0 ? q * NA * (xc + xp) ** 2 / (2 * es) : vt - q * ND * (xn - xc) ** 2 / (2 * es); return vv / vt; };
      fr.fn(pot, c.warn, 2.2, undefined, 600);
      S.out(`N_A = ${NA.toExponential(1)}, N_D = ${ND.toExponential(1)} cm⁻³, 바이어스 V = ${f2(V, 2)} V → V_bi = ${f2(vbi, 3)} V, 걸린 전위차 V_bi − V = ${f2(vt, 3)} V\n` +
        `공핍 폭 W = ${f2(W * um, 3)} μm (p쪽 x_p = ${f2(xp * um, 3)}, n쪽 x_n = ${f2(xn * um, 3)} μm), 최대 전계 ${f2(Em / 1e3, 1)} kV/cm\n` +
        `점선: 전하 밀도(최대 도핑으로 나눔), 파랑: 전계 크기 |E|/E_max, 주황: 전위 (p쪽 0 → n쪽 V_bi − V)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 7. 페이지 교체 알고리즘 */
  (() => {
    const S = QSim.card("exp-e31-page"); if (!S) return;
    const cv = S.$("canvas");
    const REF = { a: [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1], b: [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5] };
    function run(r, n, alg) {
      const fr = [], hist = [], fault = [], last = {}, ins = {};
      r.forEach((p, i) => {
        let f = false;
        if (!fr.includes(p)) {
          f = true;
          if (fr.length < n) fr.push(p);
          else {
            let vic;
            if (alg === "fifo") vic = fr.reduce((u, x) => (ins[x] < ins[u] ? x : u));
            else if (alg === "lru") vic = fr.reduce((u, x) => (last[x] < last[u] ? x : u));
            else vic = fr.reduce((u, x) => { const nx = r.indexOf(x, i + 1), nu = r.indexOf(u, i + 1); const dx = nx < 0 ? 1e9 : nx, du = nu < 0 ? 1e9 : nu; return dx > du ? x : u; });
            fr[fr.indexOf(vic)] = p;
          }
          ins[p] = i;
        }
        last[p] = i; hist.push(fr.slice()); fault.push(f);
      });
      return { hist, fault, count: fault.filter(Boolean).length };
    }
    function draw() {
      const c = C(), key = S.val("ref"), n = S.val("n"), alg = S.val("alg"), r = REF[key], R = run(r, n, alg);
      const v = QSim.view(cv, 0.42 + 0.06 * n), fr = QSim.frame(v, { x0: -1.2, x1: r.length, y0: -n - 1, y1: 1.2, pad: 6 });
      fr.text("참조", -1.1, 0.35, c.ink3);
      r.forEach((p, i) => {
        fr.text(String(p), i + 0.5, 0.35, c.ink, "center");
        R.hist[i].forEach((x, k) => fr.text(String(x), i + 0.5, -k - 0.65, R.fault[i] && x === p ? c.warn : c.ink2, "center"));
        if (R.fault[i]) fr.dot(i + 0.5, -n - 0.55, c.warn, 4);
      });
      for (let k = 0; k <= n; k++) fr.path([[0, -k], [r.length, -k]], c.rule, 1);
      const cnt = ["fifo", "lru", "opt"].map((a) => run(r, n, a).count);
      S.out(`참조열 ${r.join(", ")} (${r.length}개), 프레임 ${n}개, ${alg.toUpperCase()}: 페이지 부재 ${R.count}번(아래 빨간 점, 새로 들어온 페이지는 빨간 글자)\n` +
        `같은 조건 비교: FIFO ${cnt[0]}, LRU ${cnt[1]}, OPT ${cnt[2]}` +
        (key === "b" && alg === "fifo" ? `\nBelady 이상: FIFO는 프레임 3개에서 ${run(r, 3, "fifo").count}번, 4개에서 ${run(r, 4, "fifo").count}번` : ""));
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

})();
