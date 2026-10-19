/* 물리14 실습 카드 묶음: 반도체 전도도의 온도 의존성, 광탄성 굽힘 보, 살렌-키 필터, 잠금 증폭기 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const rng = (s) => () => { s = (s * 1664525 + 1013904223) % 4294967296; return (s + 0.5) / 4294967296; };
  const gauss = (r) => Math.sqrt(-2 * Math.log(r())) * Math.cos(2 * Math.PI * r());
  const e = 1.602176634e-19, kB = 1.380649e-23, kEV = 8.617333e-5, h = 6.62607e-34, me = 9.10938e-31;
  const fitLine = (xs, ys) => { const n = xs.length, mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n; let sxy = 0, sxx = 0; xs.forEach((x, i) => { sxy += (x - mx) * (ys[i] - my); sxx += (x - mx) ** 2; }); const b = sxy / sxx; return { a: my - b * mx, b }; };

  /* 1. 반도체 전도도와 온도 (01-02) */
  (() => {
    const S = QSim.card("lab-p14-semicond"); if (!S) return;
    const cv = S.$("canvas");
    const Nc = (T) => 2 * Math.pow(2 * Math.PI * me * kB * T / (h * h), 1.5);
    function carriers(T, Eg, Nd, Ed) {   // n형: 전하 중성 n = Nd⁺ + p, np = ni²
      const ni = Nc(T) * Math.exp(-Eg / (2 * kEV * T));
      const f = (ln) => { const n = Math.exp(ln), p = ni * ni / n, Ndp = Nd / (1 + 2 * (n / Nc(T)) * Math.exp(Ed / (kEV * T))); return n - p - Ndp; };
      let lo = Math.log(1e-30 + Math.max(ni, 1) * 1e-3), hi = Math.log(Nd + ni * 10 + 1e10); for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (f(m) > 0) hi = m; else lo = m; }
      const n = Math.exp((lo + hi) / 2); return { n, p: ni * ni / n, ni };
    }
    const sigma = (T, Eg, Nd, Ed) => { const q = carriers(T, Eg, Nd, Ed), s = Math.pow(T / 300, -1.5); return e * (q.n * 0.39 * s + q.p * 0.19 * s); };
    function draw() {
      const c = C(), Eg = S.val("eg"), Nd = 10 ** S.val("lnd"), Ed = S.val("ed"), T = S.val("T");
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 1, x1: 15, y0: -8, y1: 6, xl: "1000/T (1/K)", yl: "log₁₀ σ (S/m)" }); f.axes();
      f.fn((x) => Math.log10(sigma(1000 / x, Eg, Nd, Ed)), c.main, 2.5, null, 300);
      f.fn((x) => Math.log10(e * Nc(1000 / x) * Math.exp(-Eg / (2 * kEV * 1000 / x)) * 0.58 * Math.pow(1000 / x / 300, -1.5)), c.acc, 1.3, [4, 3], 300);
      const sT = sigma(T, Eg, Nd, Ed), q = carriers(T, Eg, Nd, Ed); f.dot(1000 / T, Math.log10(sT), c.warn, 5);
      // 고온 영역 기울기
      const xs = [1.3, 1.5, 1.7], ys = xs.map((x) => Math.log(sigma(1000 / x, Eg, Nd, Ed))), fit = fitLine(xs.map((x) => x / 1000), ys);
      const regime = q.n < 0.5 * Nd && q.ni < Nd ? "얼어붙음(도너가 덜 이온화)" : q.ni > Nd ? "진성" : "포화(n ≈ N_d)";
      S.out(`E_g = ${Eg.toFixed(2)} eV, N_d = ${Nd.toExponential(1)} m⁻³, 도너 준위 깊이 ${(Ed * 1000).toFixed(0)} meV (이동도 ∝ T^−1.5 가정)\nT = ${T} K: n = ${q.n.toExponential(2)}, p = ${q.p.toExponential(2)}, n_i = ${q.ni.toExponential(2)} m⁻³, σ = ${sT.toExponential(2)} S/m → ${regime}\n고온(1000/T = 1.3~1.7) 기울기로 어림한 띠 간격 ${(-2 * kEV * fit.b).toFixed(3)} eV (주황 점선: 진성만 있을 때)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 광탄성: 4점 굽힘 보 (03-02) */
  (() => {
    const S = QSim.card("lab-p14-photo"); if (!S) return;
    const cv = S.$("canvas");
    const L = 0.16, a = 0.04, H = 0.02, T = 0.006;   // 받침 간격, 하중점까지 거리, 높이, 두께 (m)
    function draw() {
      const c = C(), P = S.val("P"), fs = S.val("fs") * 1000, pol = S.val("pol");
      const M = (x) => { const xx = Math.min(x, L - x); return P / 2 * Math.min(xx, a); };   // 굽힘 모멘트 (전단 응력 무시)
      const Nf = (x, y) => 12 * M(x) * Math.abs(y) / (H ** 3 * fs);   // 무늬 차수 (y는 중립축에서)
      const v = QSim.view(cv, 0.42), g = v.g, W = v.W, Hh = v.H, x0 = 20, x1 = W - 20, bh = Math.min(Hh - 50, (x1 - x0) * H / L * 1.6), y0 = (Hh - bh) / 2;
      const img = g.createImageData(Math.round(x1 - x0), Math.round(bh));
      for (let j = 0; j < img.height; j++) for (let i = 0; i < img.width; i++) {
        const x = L * i / img.width, y = H * (0.5 - j / img.height), N = Nf(x, y);
        let I = Math.sin(Math.PI * N) ** 2;
        if (pol === "plane") { const phi = 0.3; I *= Math.sin(2 * phi) ** 2 * 1.2; }   // 주응력 방향이 수평(σ_x)이라 φ는 편광판 각
        const k = 4 * (j * img.width + i), val = Math.round(255 * Math.min(1, I));
        img.data[k] = val; img.data[k + 1] = val; img.data[k + 2] = Math.round(val * 0.9); img.data[k + 3] = 255;
      }
      g.putImageData(img, x0, y0);
      g.strokeStyle = c.ink; g.strokeRect(x0, y0, x1 - x0, bh);
      const tri = (x, up) => { g.fillStyle = c.ink; g.beginPath(); const X = x0 + (x1 - x0) * x / L, Y = up ? y0 - 2 : y0 + bh + 2; g.moveTo(X, Y); g.lineTo(X - 7, Y + (up ? -12 : 12)); g.lineTo(X + 7, Y + (up ? -12 : 12)); g.closePath(); g.fill(); };
      tri(0, false); tri(L, false); tri(a, true); tri(L - a, true);
      const Mmax = P / 2 * a, smax = 6 * Mmax / (T * H * H), Nmax = Nf(L / 2, H / 2);
      S.out(`4점 굽힘: 받침 간격 16 cm, 하중점 4 cm 안쪽, 보 높이 2 cm, 두께 6 mm, 전체 하중 ${P} N, 재료 무늬값 ${S.val("fs")} kN/m\n가운데 구간 최대 굽힘 응력(위·아래 가장자리) ${(smax / 1e6).toFixed(2)} MPa, 무늬 차수 ${Nmax.toFixed(2)}. 가운데 구간은 모멘트가 일정해 무늬가 수평 줄무늬\n${pol === "plane" ? "평면 편광기: 세기에 sin²(2φ)가 곱해짐(여기서는 주응력이 수평이라 무늬 전체가 같은 비율로 어두워짐)" : "원 편광기: 등색선만 보임"}. 중립축(가운데 선)은 응력 0이라 늘 어둡다`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 살렌-키 저역 통과 필터 (04-01) */
  (() => {
    const S = QSim.card("lab-p14-sallen"); if (!S) return;
    const [cvM, cvP] = S.$$("canvas");
    function draw() {
      const c = C(), K = S.val("K"), Q = 1 / (3 - K), fc = 1 / (2 * Math.PI * S.val("R") * 1e3 * S.val("C") * 1e-9);
      const Hc = (w) => { const re = 1 - w * w, im = w / Q, d = re * re + im * im; return { mag: K / Math.sqrt(d), ph: -Math.atan2(im, re) }; };   // w = f/f0
      const vm = QSim.view(cvM, 0.4), fm = QSim.frame(vm, { x0: -2, x1: 2, y0: -60, y1: 30, xl: "log₁₀(f/f₀)", yl: "이득 (dB)" }); fm.axes();
      for (const q of [0.5, 0.707]) fm.fn((x) => 20 * Math.log10(1 / Math.sqrt((1 - 10 ** (2 * x)) ** 2 + (10 ** x / q) ** 2)), c.soft, 1, [3, 3], 300);
      fm.fn((x) => 20 * Math.log10(Hc(10 ** x).mag), c.main, 2.5, null, 400);
      const vp = QSim.view(cvP, 0.3), fp = QSim.frame(vp, { x0: -2, x1: 2, y0: -190, y1: 10, xl: "log₁₀(f/f₀)", yl: "위상 (°)" }); fp.axes();
      fp.fn((x) => Hc(10 ** x).ph * 180 / Math.PI, c.acc, 2.2, null, 400);
      let pk = 0, pw = 0; for (let i = 0; i <= 2000; i++) { const w = 10 ** (-2 + 4 * i / 2000), m = Hc(w).mag; if (m > pk) { pk = m; pw = w; } }
      let w3 = 0; for (let i = 0; i <= 4000; i++) { const w = 10 ** (-2 + 4 * i / 4000); if (Hc(w).mag >= K / Math.SQRT2) w3 = w; }
      const name = Math.abs(Q - 0.707) < 0.02 ? " (버터워스)" : Math.abs(Q - 0.5) < 0.01 ? " (버퍼 이득)" : "";
      S.out(`같은 값 R = ${S.val("R")} kΩ, C = ${S.val("C")} nF → f₀ = 1/(2πRC) = ${fc >= 1000 ? (fc / 1000).toFixed(3) + " kHz" : fc.toFixed(1) + " Hz"}, 증폭기 이득 K = ${K.toFixed(3)} → Q = 1/(3 − K) = ${Q.toFixed(3)}${name}\n통과 대역 이득 ${(20 * Math.log10(K)).toFixed(2)} dB, 최대 이득 ${(20 * Math.log10(pk)).toFixed(2)} dB (f = ${pw.toFixed(3)}f₀), 통과 이득보다 3 dB 낮아지는 곳 ${w3.toFixed(3)}f₀\n연한 점선: Q = 0.5, 0.707 기준(이득 1로 맞춤). K → 3이면 Q → ∞ (발진)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 잠금 증폭기 (04-02) */
  (() => {
    const S = QSim.card("lab-p14-lockin"); if (!S) return;
    const [cvS, cvX] = S.$$("canvas"); let seed = 9;
    function draw() {
      const c = C(), A = 10 ** S.val("la"), tau = 10 ** S.val("lt"), th = S.val("th") * Math.PI / 180, r = rng(seed);
      const fs = 20000, fr = 1000, dur = 6 * tau, N = Math.round(fs * dur), dt = 1 / fs, k = dt / tau;
      let X = 0, Y = 0; const tr = [], step = Math.max(1, Math.floor(N / 600)); const snip = [];
      for (let i = 0; i < N; i++) {
        const t = i * dt, s = A * Math.cos(2 * Math.PI * fr * t + th) + gauss(r);   // 잡음 표준편차 1
        if (i < 200) snip.push([t * 1000, s]);
        X += (s * Math.cos(2 * Math.PI * fr * t) - X) * k; Y += (s * Math.sin(2 * Math.PI * fr * t) * -1 - Y) * k;   // 1차 저역 통과
        if (i % step === 0) tr.push([t, 2 * X, 2 * Y]);
      }
      const R = 2 * Math.hypot(X, Y), phase = Math.atan2(2 * Y, 2 * X) * 180 / Math.PI;
      const enbw = 1 / (4 * tau), sigX = Math.sqrt(1 / (fs * tau));   // 2X의 잡음 표준편차: 지수 가중 평균의 분산 σ²·dt/(4τ)에서
      const vs = QSim.view(cvS, 0.3), fsn = QSim.frame(vs, { x0: 0, x1: 10, y0: -4, y1: 4, xl: "시간 (ms)", yl: "입력" }); fsn.axes();
      fsn.path(snip, c.soft, 1); fsn.fn((tm) => A * Math.cos(2 * Math.PI * fr * tm / 1000 + th), c.warn, 2, null, 400);
      const ymax = Math.max(A * 1.6, 3 * sigX, 1e-4);
      const vx = QSim.view(cvX, 0.36), fx = QSim.frame(vx, { x0: 0, x1: dur, y0: -ymax, y1: ymax, xl: "시간 (s)", yl: "출력 2X, 2Y" }); fx.axes();
      fx.path(tr.map(([t, x]) => [t, x]), c.main, 2); fx.path(tr.map(([t, , y]) => [t, y]), c.acc, 1.5);
      fx.path([[0, A * Math.cos(th)], [dur, A * Math.cos(th)]], c.ink3, 1, [4, 3]);
      S.out(`신호 진폭 ${A.toPrecision(3)} (잡음 표준편차 1, 신호 대 잡음 ${(A / Math.SQRT2).toPrecision(3)} rms 비), 기준 1 kHz, 위상 ${S.val("th")}°, 시간 상수 τ = ${tau.toPrecision(3)} s (6τ 동안 측정)\n결과: 진폭 R = ${R.toPrecision(4)}, 위상 ${phase.toFixed(1)}°. 출력 잡음 어림 ±${sigX.toPrecision(2)} (잡음 대역폭 1/(4τ) = ${enbw.toPrecision(3)} Hz)\n위: 입력(연한 선)과 묻힌 신호(빨강), 아래: 2X(파랑, 회색 점선 = A cos θ)와 2Y(주황)`);
    }
    S.$(".new").addEventListener("click", () => { seed = (seed * 59 + 13) % 99991; draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
