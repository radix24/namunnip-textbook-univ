/* 천우10 실습 카드: N체 적분기 비교, 확산 방정식의 안정 조건, MCMC 직선 맞춤, Lomb-Scargle 주기도 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const fx = (x, n = 2) => (+x).toFixed(n);
  const rng = (s) => () => { s = (s * 1664525 + 1013904223) % 4294967296; return (s + 0.5) / 4294967296; };
  const gauss = (r) => Math.sqrt(-2 * Math.log(r())) * Math.cos(2 * Math.PI * r());

  /* 1. 두 천체 궤도로 적분기 비교 (03-02, 03-03) */
  (() => {
    const S = QSim.card("lab-a10-nbody"); if (!S) return;
    const cv = S.$("canvas");
    function run(meth, e, dt, eps, norb) {
      // 단위 G(m1+m2) = 1, a = 1, 주기 2π. 원일점에서 출발
      let x = 1 + e, y = 0, vx = 0, vy = Math.sqrt((1 - e) / (1 + e));
      const acc = (x, y) => { const q = Math.pow(x * x + y * y + eps * eps, -1.5); return [-x * q, -y * q]; };
      const En = (x, y, vx, vy) => 0.5 * (vx * vx + vy * vy) - 1 / Math.sqrt(x * x + y * y + eps * eps);
      const E0 = En(x, y, vx, vy), n = Math.round(norb * 2 * Math.PI / dt), every = Math.max(1, Math.floor(n / 3000)), pts = [[x, y]];
      let dmax = 0;
      for (let i = 0; i < n; i++) {
        if (meth === "euler") { const [ax, ay] = acc(x, y); x += dt * vx; y += dt * vy; vx += dt * ax; vy += dt * ay; }
        else if (meth === "leap") { let [ax, ay] = acc(x, y); vx += 0.5 * dt * ax; vy += 0.5 * dt * ay; x += dt * vx; y += dt * vy; [ax, ay] = acc(x, y); vx += 0.5 * dt * ax; vy += 0.5 * dt * ay; }
        else { const f = (s) => { const [ax, ay] = acc(s[0], s[1]); return [s[2], s[3], ax, ay]; }, s0 = [x, y, vx, vy];
          const k1 = f(s0), k2 = f(s0.map((v, j) => v + dt / 2 * k1[j])), k3 = f(s0.map((v, j) => v + dt / 2 * k2[j])), k4 = f(s0.map((v, j) => v + dt * k3[j]));
          [x, y, vx, vy] = s0.map((v, j) => v + dt / 6 * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j])); }
        const d = Math.abs((En(x, y, vx, vy) - E0) / E0); if (d > dmax) dmax = d;
        if (i % every === 0) pts.push([x, y]);
        if (!isFinite(x) || x * x + y * y > 400) break;
      }
      return { pts, n, dE: Math.abs((En(x, y, vx, vy) - E0) / E0), dmax, ang: Math.atan2(y, x) * 180 / Math.PI };
    }
    function draw() {
      const c = C(), meth = S.val("meth"), e = S.val("e"), dt = Math.pow(10, S.val("ldt")), eps = S.val("eps");
      const R = run(meth, e, dt, eps, 10), L = 2.4;
      const v = QSim.view(cv, 0.62), f = QSim.frame(v, { x0: -L * 1.45, x1: L * 1.45, y0: -L, y1: L, xl: "x (궤도 긴반지름 단위)", yl: "y" }); f.axes();
      f.path(R.pts, c.main, 1.1); f.dot(0, 0, c.warn, 4); f.dot(1 + e, 0, c.acc, 4);
      const name = { euler: "오일러", leap: "leapfrog(KDK)", rk4: "4차 Runge-Kutta" }[meth];
      S.out(`${name}, 이심률 ${fx(e, 2)}, Δt = ${dt.toExponential(1)}, 연화 길이 ε = ${fx(eps, 3)}: 10바퀴에 ${R.n}걸음 (힘 계산 ${meth === "rk4" ? 4 * R.n : R.n}번)\n상대 에너지 오차: 끝 ${R.dE.toExponential(2)}, 최대 ${R.dmax.toExponential(2)}\n마지막 위치의 방위각 ${fx(R.ang, 1)}° (정확한 해는 출발점 0°로 돌아옴)\n파란 선: 궤도, 빨간 점: 질량 중심, 주황 점: 출발점(원일점)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 확산 방정식의 명시적·암시적 차분 (04-01) */
  (() => {
    const S = QSim.card("lab-a10-ftcs"); if (!S) return;
    const cv = S.$("canvas"), N = 50;
    function draw() {
      const c = C(), meth = S.val("meth"), r = S.val("r"), steps = S.val("steps");
      let u = new Float64Array(N + 1); for (let i = 0; i <= N; i++) u[i] = (i >= 20 && i <= 30) ? 1 : 0;
      const u0 = Array.from(u);
      for (let s = 0; s < steps; s++) {
        const w = new Float64Array(N + 1);
        if (meth === "ex") { for (let i = 1; i < N; i++) w[i] = u[i] + r * (u[i + 1] - 2 * u[i] + u[i - 1]); }
        else { // 암시적(BTCS): −r w[i−1] + (1+2r) w[i] − r w[i+1] = u[i], 토마스 알고리즘
          const cp = new Float64Array(N + 1), dp = new Float64Array(N + 1); cp[0] = 0; dp[0] = 0;
          for (let i = 1; i < N; i++) { const m = (1 + 2 * r) + r * cp[i - 1]; cp[i] = -r / m; dp[i] = (u[i] + r * dp[i - 1]) / m; }
          for (let i = N - 1; i >= 1; i--) w[i] = dp[i] - cp[i] * w[i + 1];
        }
        u = w;
      }
      let mx = 0, sum = 0; for (let i = 0; i <= N; i++) { mx = Math.max(mx, Math.abs(u[i])); sum += u[i]; }
      const ym = Math.min(Math.max(1.1, mx * 1.1), 1e6);
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: 1, y0: -ym, y1: ym, xl: "x", yl: "u" }); f.axes();
      f.path(u0.map((y, i) => [i / N, y]), c.ink3, 1.2, [4, 3]);
      f.path(Array.from(u).map((y, i) => [i / N, Math.max(-ym, Math.min(ym, y))]), c.main, 2);
      Array.from(u).forEach((y, i) => f.dot(i / N, Math.max(-ym, Math.min(ym, y)), c.main, 2));
      const t = steps * r / (N * N);
      S.out(`${meth === "ex" ? "명시적(FTCS)" : "암시적(BTCS)"}, r = DΔt/Δx² = ${fx(r, 2)}, ${steps}걸음 (무차원 시간 Dt = ${fx(t, 4)})\n최대 |u| = ${mx < 1e5 ? fx(mx, 4) : mx.toExponential(2)}, 합(열의 양) Σu = ${Math.abs(sum) < 1e5 ? fx(sum, 3) : sum.toExponential(2)} (처음 11)\n${meth === "ex" && r > 0.5 ? "r > 0.5: 가장 짧은 파장 성분이 한 걸음에 |1 − 4r| = " + fx(Math.abs(1 - 4 * r), 2) + "배씩 자라 불안정하다" : "안정: 짧은 파장 성분이 줄어든다"}\n회색 점선: 처음 상태(가운데 사각형), 파란 선: 현재`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. MCMC로 직선 매개변수의 불확도 (05-02) */
  (() => {
    const S = QSim.card("lab-a10-mcmc"); if (!S) return;
    const cv = S.$("canvas");
    // 가상 자료: y = 2x + 1 + 잡음(σ = 1), x = 0, 0.5, …, 9.5 (20개)
    const dat = (() => { const r = rng(10), d = []; for (let i = 0; i < 20; i++) { const x = i * 0.5; d.push([x, 2 * x + 1 + gauss(r)]); } return d; })();
    const chi2 = (a, b) => dat.reduce((s, [x, y]) => s + (y - a * x - b) ** 2, 0);
    // 최소제곱 해석해
    const n = dat.length, Sx = dat.reduce((s, p) => s + p[0], 0), Sy = dat.reduce((s, p) => s + p[1], 0), Sxx = dat.reduce((s, p) => s + p[0] * p[0], 0), Sxy = dat.reduce((s, p) => s + p[0] * p[1], 0);
    const Dt = n * Sxx - Sx * Sx, aL = (n * Sxy - Sx * Sy) / Dt, bL = (Sxx * Sy - Sx * Sxy) / Dt, sa = Math.sqrt(n / Dt), sb = Math.sqrt(Sxx / Dt);
    function draw() {
      const c = C(), step = S.val("step"), N = S.val("nst"), seed = S.val("seed");
      const r = rng(seed * 7919 + 1); let a = 0, b = 0, L = -chi2(a, b) / 2, acc = 0; const ch = [];
      for (let i = 0; i < N; i++) {
        const a2 = a + step * gauss(r), b2 = b + step * gauss(r), L2 = -chi2(a2, b2) / 2;
        if (Math.log(r()) < L2 - L) { a = a2; b = b2; L = L2; acc++; }
        ch.push([a, b]);
      }
      const burn = Math.floor(N / 5), post = ch.slice(burn);
      const m = (k) => post.reduce((s, p) => s + p[k], 0) / post.length, ma = m(0), mb = m(1);
      const sd = (k, mu) => Math.sqrt(post.reduce((s, p) => s + (p[k] - mu) ** 2, 0) / (post.length - 1));
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: N, y0: 0, y1: 3, xl: "걸음", yl: "기울기 a" }); f.axes();
      const ev = Math.max(1, Math.floor(N / 1500)); f.path(ch.filter((_, i) => i % ev === 0).map((p, i) => [i * ev, p[0]]), c.main, 1);
      f.path([[burn, 0], [burn, 3]], c.warn, 1, [4, 3]); f.path([[0, aL], [N, aL]], c.acc, 1, [2, 3]);
      S.out(`걸음 크기 ${fx(step, 3)}, ${N}걸음(앞 20% 버림), 씨앗 ${seed}: 받아들인 비율 ${fx(100 * acc / N, 1)}%\nMCMC: a = ${fx(ma, 3)} ± ${fx(sd(0, ma), 3)}, b = ${fx(mb, 3)} ± ${fx(sd(1, mb), 3)}\n최소제곱 해석해: a = ${fx(aL, 3)} ± ${fx(sa, 3)}, b = ${fx(bL, 3)} ± ${fx(sb, 3)}\n파란 선: 기울기 a의 사슬, 빨간 점선: 버리는 구간의 끝, 주황 점선: 최소제곱 값. 자료는 가상(참값 a = 2, b = 1)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. Lomb-Scargle 주기도 (05-03) */
  (() => {
    const S = QSim.card("lab-a10-ls"); if (!S) return;
    const cv = S.$("canvas"), P0 = 0.537;
    function draw() {
      const c = C(), N = S.val("np"), sig = S.val("sig"), r = rng(21), t = [], y = [];
      // 가상 변광성: 30일 동안 밤(하루 중 0.3일)에만 관측
      for (let i = 0; i < N; i++) { const d = Math.floor(r() * 30), tt = d + 0.35 * r(); t.push(tt); y.push(Math.sin(2 * Math.PI * tt / P0) + sig * gauss(r)); }
      const my = y.reduce((s, v) => s + v, 0) / N, yy = y.map((v) => v - my), var_ = yy.reduce((s, v) => s + v * v, 0) / (N - 1);
      const pts = []; let best = [0, 0];
      for (let k = 0; k <= 2000; k++) {
        const fq = 0.05 + k * (4.95 / 2000), w = 2 * Math.PI * fq;
        let s2 = 0, c2 = 0; for (let i = 0; i < N; i++) { s2 += Math.sin(2 * w * t[i]); c2 += Math.cos(2 * w * t[i]); }
        const tau = Math.atan2(s2, c2) / (2 * w);
        let yc = 0, ys = 0, cc = 0, ss = 0;
        for (let i = 0; i < N; i++) { const a = w * (t[i] - tau), co = Math.cos(a), si = Math.sin(a); yc += yy[i] * co; ys += yy[i] * si; cc += co * co; ss += si * si; }
        const p = (yc * yc / cc + ys * ys / ss) / (2 * var_); pts.push([fq, p]); if (p > best[1]) best = [fq, p];
      }
      const pm = Math.max(...pts.map((p) => p[1]));
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: 5, y0: 0, y1: pm * 1.1, xl: "진동수 (주기/일)", yl: "Lomb-Scargle 세기" }); f.axes();
      f.path(pts, c.main, 1.2); f.path([[1 / P0, 0], [1 / P0, pm * 1.1]], c.acc, 1, [3, 3]);
      f.dot(best[0], best[1], c.warn, 4);
      S.out(`가상 변광성(참 주기 ${P0}일, 진폭 1), 관측 ${N}번, 잡음 σ = ${fx(sig, 2)}\n가장 높은 봉우리: 진동수 ${fx(best[0], 4)} /일 → 주기 ${fx(1 / best[0], 4)}일 (세기 ${fx(best[1], 1)})\n${Math.abs(1 / best[0] - P0) < 0.005 ? "참 주기를 찾았다" : (Math.abs(Math.abs(best[0] - 1 / P0) - 1) < 0.02 ? "참 주기가 아니다: 하루 간격 관측이 만든 1일 앨리어스(1/P ± 1)이다" : "참 주기가 아니다: 잡음이 만든 가짜 봉우리이다")}. 1일 앨리어스 위치 ${fx(1 / P0 - 1, 3)}, ${fx(1 / P0 + 1, 3)} /일\n주황 점선: 참 진동수 ${fx(1 / P0, 3)} /일, 빨간 점: 가장 높은 봉우리`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
