/* 화학과 물리화학실험 카드 묶음 (화학15)
   동적 NMR: 두 자리 교환의 선 모양과 융합, 2차원 레너드-존스 분자동력학 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const Q = window.QChem;
  const RED = "#b5562a", GRN = "#2f8f5b";
  const kB = 1.380649e-23, h = 6.62607e-34, Rg = 8.314;

  /* 1. 동적 NMR: 아마이드 C−N 회전의 선 모양 (화학15-04-02) */
  (() => {
    const S = QSim.card("lab-ch15-dnmr"); if (!S) return;
    const cv = S.$("canvas");
    const T2 = 0.3;   // s, 교환이 없을 때 선폭 1/(πT₂) ≈ 1.1 Hz
    // 같은 양의 두 자리 A, B 사이 교환(속도 상수 k)의 선 모양: G(ν) = Re[1ᵀ M⁻¹ p], M = [[i2π(νA−ν) + 1/T₂ + k, −k], [−k, i2π(νB−ν) + 1/T₂ + k]]
    function shape(nu, nA, nB, k) {
      const a = { re: 1 / T2 + k, im: 2 * Math.PI * (nA - nu) }, b = { re: 1 / T2 + k, im: 2 * Math.PI * (nB - nu) };
      // det = a·b − k², M⁻¹·[½, ½]의 두 성분 합 = (a + b + 2k)/(2 det)
      const det = { re: a.re * b.re - a.im * b.im - k * k, im: a.re * b.im + a.im * b.re };
      const num = { re: a.re + b.re + 2 * k, im: a.im + b.im };
      const d2 = det.re * det.re + det.im * det.im;
      return (num.re * det.re + num.im * det.im) / (2 * d2);
    }
    function draw() {
      const c = C(), T = S.val("T"), dG = S.val("dG"), dnu = S.val("dnu");
      const k = kB * T / h * Math.exp(-dG * 1000 / (Rg * T));
      const kc = Math.PI * dnu / Math.SQRT2;
      const Tc = Q.bisect((x) => kB * x / h * Math.exp(-dG * 1000 / (Rg * x)) - kc, 200, 600);
      const nA = -dnu / 2, nB = dnu / 2, span = Math.max(3 * dnu, 40);
      const N = 600, xs = [], ys = [];
      for (let i = 0; i <= N; i++) { const nu = -span + 2 * span * i / N; xs.push(nu); ys.push(shape(nu, nA, nB, k)); }
      const ym = Math.max(...ys);
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: -span, x1: span, y0: 0, y1: 1.1, xl: "진동수 (Hz, 두 신호의 가운데 = 0)", yl: "세기 (최대 = 1)", pad: 40 }); f.axes();
      f.path(xs.map((x, i) => [x, ys[i] / ym]), c.main, 2.2);
      f.dot(nA, 0, RED, 4); f.dot(nB, 0, RED, 4);
      const regime = k < kc / 3 ? "느린 교환: 두 신호가 따로 보임" : k < kc * 0.9 ? "융합 직전: 두 신호가 넓어지며 가운데로 다가감" : k < kc * 1.1 ? "융합점 근처: 두 신호가 하나의 평평한 봉우리로" : k < kc * 10 ? "융합 뒤: 넓은 한 봉우리" : "빠른 교환: 평균 위치의 날카로운 한 봉우리";
      S.out(`${T} K, ΔG‡ = ${dG} kJ/mol → k = (k_BT/h)e^(−ΔG‡/RT) = ${Q.sci(k, 2)} s⁻¹\n두 신호 간격 Δν = ${dnu} Hz → 융합점의 속도 상수 k_c = πΔν/√2 = ${kc.toFixed(1)} s⁻¹, 융합 온도 T_c = ${Tc.toFixed(1)} K\n${regime}\n융합 온도에서 거꾸로 구한 ΔG‡ = RT_c[22.96 + ln(T_c/Δν)] = ${(Rg * Tc * (22.96 + Math.log(Tc / dnu)) / 1000).toFixed(1)} kJ/mol`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 2차원 레너드-존스 분자동력학 (화학15-05-02) */
  (() => {
    const S = QSim.card("lab-ch15-md"); if (!S) return;
    const [cv1, cv2] = S.$$("canvas");
    const n1 = 6, N = n1 * n1, STEPS = 2000, rc = 2.5, rc2 = rc * rc;
    const ec = 4 * (1 / rc2 ** 6 - 1 / rc2 ** 3);   // 자름 거리에서 에너지가 0이 되도록 이동
    function run(T0, dt, rho, seed) {
      const L = Math.sqrt(N / rho), r = Q.rng(seed * 7919 + 13);
      const x = new Float64Array(N), y = new Float64Array(N), vx = new Float64Array(N), vy = new Float64Array(N), fx = new Float64Array(N), fy = new Float64Array(N);
      for (let i = 0; i < N; i++) { x[i] = (i % n1 + 0.5) * L / n1; y[i] = (Math.floor(i / n1) + 0.5) * L / n1; vx[i] = Q.gauss(r); vy[i] = Q.gauss(r); }
      let mx = 0, my = 0; for (let i = 0; i < N; i++) { mx += vx[i]; my += vy[i]; }
      mx /= N; my /= N; let ke = 0;
      for (let i = 0; i < N; i++) { vx[i] -= mx; vy[i] -= my; ke += 0.5 * (vx[i] ** 2 + vy[i] ** 2); }
      const sc = Math.sqrt(T0 * (N - 1) / ke); for (let i = 0; i < N; i++) { vx[i] *= sc; vy[i] *= sc; }
      const force = () => {
        fx.fill(0); fy.fill(0); let pe = 0;
        for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
          let dx = x[i] - x[j], dy = y[i] - y[j];
          dx -= L * Math.round(dx / L); dy -= L * Math.round(dy / L);
          const d2 = dx * dx + dy * dy; if (d2 > rc2) continue;
          const i2 = 1 / d2, i6 = i2 * i2 * i2, ff = 24 * i2 * i6 * (2 * i6 - 1);
          fx[i] += ff * dx; fy[i] += ff * dy; fx[j] -= ff * dx; fy[j] -= ff * dy;
          pe += 4 * i6 * (i6 - 1) - ec;
        }
        return pe;
      };
      let pe = force();
      const tE = [], tT = [], gr = new Float64Array(60), dr = L / 2 / 60; let ng = 0;
      for (let s = 0; s <= STEPS; s++) {
        if (s % 10 === 0) {
          let k = 0; for (let i = 0; i < N; i++) k += 0.5 * (vx[i] ** 2 + vy[i] ** 2);
          tE.push((k + pe) / N); tT.push(k / (N - 1));
          if (s >= STEPS / 2 && s % 50 === 0) {   // 뒤쪽 절반에서 지름 분포 함수 쌓기
            ng++;
            for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
              let dx = x[i] - x[j], dy = y[i] - y[j]; dx -= L * Math.round(dx / L); dy -= L * Math.round(dy / L);
              const b = Math.floor(Math.sqrt(dx * dx + dy * dy) / dr); if (b < 60) gr[b] += 2;
            }
          }
        }
        if (s === STEPS) break;
        for (let i = 0; i < N; i++) { vx[i] += 0.5 * dt * fx[i]; vy[i] += 0.5 * dt * fy[i]; x[i] = ((x[i] + dt * vx[i]) % L + L) % L; y[i] = ((y[i] + dt * vy[i]) % L + L) % L; }
        pe = force();
        for (let i = 0; i < N; i++) { vx[i] += 0.5 * dt * fx[i]; vy[i] += 0.5 * dt * fy[i]; }
      }
      const g = Array.from(gr, (cnt, b) => cnt / (ng * N * rho * Math.PI * ((b + 1) ** 2 - b ** 2) * dr * dr));
      return { tE, tT, g, dr, L };
    }
    let seed;
    function draw() {
      const c = C(), T0 = S.val("T0"), dt = S.val("dt"), rho = S.val("rho");
      const R = run(T0, dt, rho, seed());
      const n = R.tE.length, t = R.tE.map((_, i) => i * 10 * dt), half = Math.floor(n / 2);
      const Tm = Q.mean(R.tT.slice(half)), E0 = R.tE[0], Em = Q.mean(R.tE), drift = Math.max(...R.tE.map((e) => Math.abs(e - E0)));
      const lo = Math.min(...R.tE, 0) - 0.2, hi = Math.max(...R.tT, ...R.tE) + 0.3;
      const v1 = QSim.view(cv1, 0.45), f1 = QSim.frame(v1, { x0: 0, x1: t[n - 1], y0: lo, y1: hi, xl: "시간 (환산 단위)", yl: "입자당 에너지, 온도", pad: 44 }); f1.axes();
      f1.path(t.map((x, i) => [x, R.tE[i]]), c.main, 2); f1.path(t.map((x, i) => [x, R.tT[i]]), RED, 1.5);
      const gmax = Math.max(...R.g, 1) * 1.1, rmax = R.dr * 60;
      const v2 = QSim.view(cv2, 0.45), f2 = QSim.frame(v2, { x0: 0, x1: rmax, y0: 0, y1: gmax, xl: "거리 r (σ)", yl: "지름 분포 함수 g(r)", pad: 44 }); f2.axes();
      f2.path(R.g.map((gv, b) => [(b + 0.5) * R.dr, gv]), GRN, 2); f2.path([[0, 1], [rmax, 1]], c.ink3, 1, [4, 4]);
      let bp = 0; R.g.forEach((gv, b) => { if (gv > R.g[bp]) bp = b; });
      S.out(`입자 36개, 밀도 ρ = ${rho}, 상자 ${R.L.toFixed(2)}σ, 시간 간격 Δt = ${dt}, ${STEPS}걸음 (가상 자료 ${seed()}번)\n뒤쪽 절반 평균 온도 T = ${Tm.toFixed(3)} (처음 ${T0}) · 입자당 총에너지 평균 ${Em.toFixed(3)}, 처음 값에서 가장 크게 벗어난 양 ${drift.toFixed(4)}\ng(r)의 첫 봉우리: r = ${((bp + 0.5) * R.dr).toFixed(2)}σ, 높이 ${R.g[bp].toFixed(2)} (레너드-존스 최저점 2^(1/6)σ = 1.12σ)`);
    }
    seed = Q.seedButton(S, draw);
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
