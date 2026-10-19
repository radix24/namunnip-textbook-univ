/* 천우6 실습 카드: 유한 차분 오차, 근 찾기(Kepler 방정식), 보간과 Runge 현상, 수치 적분 수렴, 궤도 적분 방법 비교, 최소제곱 맞춤, Monte Carlo */
(() => {
  "use strict";
  const C = () => QSim.col();
  const fx = (x, n = 2) => (+x).toFixed(n);
  const ex = (x, n = 1) => (+x).toExponential(n);
  const rng = (s) => () => { s = (s * 1664525 + 1013904223) % 4294967296; return (s + 0.5) / 4294967296; };
  const gauss = (r) => Math.sqrt(-2 * Math.log(r())) * Math.cos(2 * Math.PI * r());

  /* 1. 유한 차분의 오차와 간격 (02-02, 04-01) */
  (() => {
    const S = QSim.card("lab-a6-fd"); if (!S) return;
    const cv = S.$("canvas");
    const FN = { sin: [Math.sin, Math.cos, "sin x"], exp: [Math.exp, Math.exp, "e^x"], cube: [(x) => x * x * x, (x) => 3 * x * x, "x³"] };
    function draw() {
      const c = C(), [f, df, name] = FN[S.val("fn")], x = S.val("x"), k = S.val("k"), h = Math.pow(10, -k), exact = df(x);
      const fwd = (hh) => Math.abs((f(x + hh) - f(x)) / hh - exact), cen = (hh) => Math.abs((f(x + hh) - f(x - hh)) / (2 * hh) - exact);
      const v = QSim.view(cv, 0.56), fr = QSim.frame(v, { x0: -16, x1: 0, y0: -17, y1: 1, xl: "log₁₀ h", yl: "log₁₀ 오차" }); fr.axes();
      const lg = (e) => Math.log10(Math.max(e, 1e-17));
      fr.fn((t) => lg(fwd(Math.pow(10, t))), c.main, 2, null, 320);
      fr.fn((t) => lg(cen(Math.pow(10, t))), c.warn, 2, null, 320);
      fr.path([[-k, -17], [-k, 1]], c.ink3, 1, [3, 3]);
      let bf = 1, bfh = 0, bc = 1, bch = 0; for (let t = -16; t <= 0; t += 0.05) { const hh = Math.pow(10, t), a = fwd(hh), b = cen(hh); if (a < bf) { bf = a; bfh = t; } if (b < bc) { bc = b; bch = t; } }
      S.out(`f(x) = ${name}, x = ${fx(x, 2)}, 참 도함수 ${exact.toPrecision(10)}\nh = 1e−${k}: 전진 차분 오차 ${ex(fwd(h))}, 중앙 차분 오차 ${ex(cen(h))}\n가장 작은 오차: 전진 ${ex(bf)} (h ≈ 1e${fx(bfh, 1)}), 중앙 ${ex(bc)} (h ≈ 1e${fx(bch, 1)})\n파란 선: 전진 차분, 빨간 선: 중앙 차분, 점선: 지금 고른 h`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 이분법과 Newton 방법으로 Kepler 방정식 풀기 (03-01) */
  (() => {
    const S = QSim.card("lab-a6-root"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), M = S.val("M"), e = S.val("e"), start = S.val("start");
      const f = (E) => E - e * Math.sin(E) - M, d = (E) => 1 - e * Math.cos(E);
      const v = QSim.view(cv, 0.56), fr = QSim.frame(v, { x0: 0, x1: 2 * Math.PI, y0: -M - 1, y1: 2 * Math.PI - M + 1, xl: "E (rad)", yl: "f(E) = E − e sin E − M" }); fr.axes();
      fr.fn(f, c.main, 2.5);
      let E = start === "pi" ? Math.PI : M, it = [];
      for (let n = 0; n < 30; n++) {
        const fE = f(E), E2 = E - fE / d(E);
        if (n < 6) { fr.path([[E, 0], [E, fE]], c.ink3, 1, [2, 2]); fr.path([[E, fE], [E2, 0]], c.warn, 1.5); fr.dot(E, fE, c.warn, 3); }
        it.push(E2); if (Math.abs(E2 - E) < 1e-12 || !isFinite(E2)) { E = E2; break; } E = E2;
      }
      let lo = 0, hi = 2 * Math.PI, nb = 0; while (hi - lo > 1e-12 && nb < 100) { const mid = (lo + hi) / 2; if (f(lo) * f(mid) <= 0) hi = mid; else lo = mid; nb++; }
      const ok = isFinite(E) && Math.abs(f(E)) < 1e-9;
      S.out(`M = ${fx(M, 3)}, e = ${fx(e, 3)}, 처음 값 E₀ = ${start === "pi" ? "π" : "M"}\nNewton: ${ok ? `${it.length}번 만에 E = ${E.toFixed(12)}` : "수렴하지 않음 (처음 값을 π로 바꿔 보세요)"}\n처음 다섯 단계: ${it.slice(0, 5).map((x) => x.toFixed(6)).join(" → ")}\n이분법(구간 0~2π, 허용 오차 1e−12): ${nb}번 만에 E = ${((lo + hi) / 2).toFixed(12)}\n빨간 선: Newton 방법의 접선. 접선이 가로축과 만나는 곳이 다음 추정값`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 다항식 보간과 3차 스플라인 (03-02) */
  (() => {
    const S = QSim.card("lab-a6-interp"); if (!S) return;
    const cv = S.$("canvas");
    const FN = { runge: [(x) => 1 / (1 + 25 * x * x), "1/(1 + 25x²)"], sin: [(x) => Math.sin(Math.PI * x), "sin πx"], abs: [(x) => Math.abs(x), "|x|"] };
    function spline(xs, ys) {   // 자연 3차 스플라인: 2차 도함수 M_i를 삼중대각 연립방정식으로
      const n = xs.length - 1, h = [], al = [], l = [1], mu = [0], z = [0], Mi = new Array(n + 1).fill(0);
      for (let i = 0; i < n; i++) h.push(xs[i + 1] - xs[i]);
      for (let i = 1; i < n; i++) al[i] = 3 / h[i] * (ys[i + 1] - ys[i]) - 3 / h[i - 1] * (ys[i] - ys[i - 1]);
      for (let i = 1; i < n; i++) { l[i] = 2 * (xs[i + 1] - xs[i - 1]) - h[i - 1] * mu[i - 1]; mu[i] = h[i] / l[i]; z[i] = (al[i] - h[i - 1] * z[i - 1]) / l[i]; }
      const cc = new Array(n + 1).fill(0), b = [], d = [];
      for (let j = n - 1; j >= 0; j--) { cc[j] = z[j] - mu[j] * cc[j + 1]; b[j] = (ys[j + 1] - ys[j]) / h[j] - h[j] * (cc[j + 1] + 2 * cc[j]) / 3; d[j] = (cc[j + 1] - cc[j]) / (3 * h[j]); }
      void Mi;
      return (x) => { let j = Math.min(n - 1, Math.max(0, Math.floor((x - xs[0]) / h[0]))); const t = x - xs[j]; return ys[j] + b[j] * t + cc[j] * t * t + d[j] * t * t * t; };
    }
    function draw() {
      const c = C(), [f, name] = FN[S.val("fn")], N = S.val("n");
      const xs = [], ys = []; for (let i = 0; i < N; i++) { const x = -1 + 2 * i / (N - 1); xs.push(x); ys.push(f(x)); }
      const lag = (x) => { let s = 0; for (let i = 0; i < N; i++) { let L = 1; for (let j = 0; j < N; j++) if (j !== i) L *= (x - xs[j]) / (xs[i] - xs[j]); s += ys[i] * L; } return s; };
      const sp = spline(xs, ys);
      let ep = 0, es = 0; for (let k = 0; k <= 2000; k++) { const x = -1 + 2 * k / 2000; ep = Math.max(ep, Math.abs(lag(x) - f(x))); es = Math.max(es, Math.abs(sp(x) - f(x))); }
      const v = QSim.view(cv, 0.56), fr = QSim.frame(v, { x0: -1, x1: 1, y0: -1.2, y1: 2.0, xl: "x", yl: "y" }); fr.axes();
      fr.fn(f, c.ink3, 1.5, [4, 3], 400); fr.fn((x) => Math.max(-1.2, Math.min(2.0, lag(x))), c.warn, 1.8, null, 800); fr.fn(sp, c.main, 2.2, null, 800);
      xs.forEach((x, i) => fr.dot(x, ys[i], c.ink, 3.5));
      S.out(`f(x) = ${name}, 고르게 놓인 점 ${N}개\n다항식 보간(${N - 1}차, 빨간 선)의 최대 오차 ${ex(ep, 2)}\n자연 3차 스플라인(파란 선)의 최대 오차 ${ex(es, 2)}\n회색 점선: 참 함수`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 사다리꼴과 Simpson 공식의 수렴 (04-02, 04-03) */
  (() => {
    const S = QSim.card("lab-a6-quad"); if (!S) return;
    const cv = S.$("canvas");
    const FN = {
      sin: [Math.sin, 0, Math.PI, 2, "∫₀^π sin x dx = 2"],
      planck: [(x) => (x > 0 ? x * x * x / Math.expm1(x) : 0), 0, 50, Math.pow(Math.PI, 4) / 15, "∫₀^50 x³/(eˣ − 1) dx ≈ π⁴/15"],
      sqrt: [Math.sqrt, 0, 1, 2 / 3, "∫₀¹ √x dx = 2/3 (x = 0에서 기울기 무한대)"],
    };
    const trap = (f, a, b, n) => { const h = (b - a) / n; let s = 0.5 * (f(a) + f(b)); for (let i = 1; i < n; i++) s += f(a + i * h); return s * h; };
    const simp = (f, a, b, n) => { const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h); return s * h / 3; };
    function draw() {
      const c = C(), [f, a, b, I, name] = FN[S.val("fn")], k = S.val("k"), n = Math.pow(2, k);
      const v = QSim.view(cv, 0.56), fr = QSim.frame(v, { x0: 1, x1: 12, y0: -16, y1: 1, xl: "log₂ n (구간 수)", yl: "log₁₀ 오차" }); fr.axes();
      const pt = [], ps = []; for (let j = 1; j <= 12; j++) { const m = Math.pow(2, j); pt.push([j, Math.log10(Math.max(1e-17, Math.abs(trap(f, a, b, m) - I)))]); ps.push([j, Math.log10(Math.max(1e-17, Math.abs(simp(f, a, b, m) - I)))]); }
      fr.path(pt, c.main, 2); fr.path(ps, c.warn, 2); pt.forEach((p) => fr.dot(p[0], p[1], c.main, 3)); ps.forEach((p) => fr.dot(p[0], p[1], c.warn, 3));
      fr.path([[k, -16], [k, 1]], c.ink3, 1, [3, 3]);
      const et = Math.abs(trap(f, a, b, n) - I), es = Math.abs(simp(f, a, b, n) - I), et2 = Math.abs(trap(f, a, b, 2 * n) - I), es2 = Math.abs(simp(f, a, b, 2 * n) - I);
      S.out(`${name}\n구간 수 n = ${n}: 사다리꼴 오차 ${ex(et, 2)}, Simpson 오차 ${ex(es, 2)}\nn을 2배로 하면 오차가 줄어드는 배수: 사다리꼴 ${fx(et / et2, 1)}배, Simpson ${fx(es / es2, 1)}배 (이론 4배, 16배)\n파란 선: 사다리꼴, 빨간 선: Simpson`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 5. Euler, RK4, 도약 개구리의 궤도와 에너지 (05-01, 05-02) */
  (() => {
    const S = QSim.card("lab-a6-orbit"); if (!S) return;
    const cv = S.$("canvas"), GM = 4 * Math.PI * Math.PI;
    const acc = (x, y) => { const r3 = Math.pow(x * x + y * y, 1.5); return [-GM * x / r3, -GM * y / r3]; };
    const en = (s) => 0.5 * (s[2] * s[2] + s[3] * s[3]) - GM / Math.hypot(s[0], s[1]);
    const stepE = (s, dt) => { const [ax, ay] = acc(s[0], s[1]); return [s[0] + s[2] * dt, s[1] + s[3] * dt, s[2] + ax * dt, s[3] + ay * dt]; };
    const fdot = (s) => { const [ax, ay] = acc(s[0], s[1]); return [s[2], s[3], ax, ay]; };
    const stepR = (s, dt) => { const k1 = fdot(s), k2 = fdot(s.map((v, i) => v + dt / 2 * k1[i])), k3 = fdot(s.map((v, i) => v + dt / 2 * k2[i])), k4 = fdot(s.map((v, i) => v + dt * k3[i])); return s.map((v, i) => v + dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])); };
    const stepL = (s, dt) => { let [ax, ay] = acc(s[0], s[1]); const vx = s[2] + ax * dt / 2, vy = s[3] + ay * dt / 2, x = s[0] + vx * dt, y = s[1] + vy * dt; [ax, ay] = acc(x, y); return [x, y, vx + ax * dt / 2, vy + ay * dt / 2]; };
    function run(step, dt, orbits, e) {
      let s = [1 - e, 0, 0, 2 * Math.PI * Math.sqrt((1 + e) / (1 - e))]; const E0 = en(s), P = 1, n = Math.round(orbits * P / dt), every = Math.max(1, Math.floor(n / 1500));
      const path = [[s[0], s[1]]], err = [[0, 0]]; let emax = 0;
      for (let i = 1; i <= n; i++) { s = step(s, dt); if (i % every === 0 || i === n) { path.push([s[0], s[1]]); const de = Math.abs((en(s) - E0) / E0); emax = Math.max(emax, de); err.push([i * dt, de]); } if (!isFinite(s[0]) || Math.hypot(s[0], s[1]) > 50) break; }
      return { path, err, final: Math.abs((en(s) - E0) / E0), emax };
    }
    function draw() {
      const c = C(), dt = Math.pow(10, -S.val("k")), orbits = S.val("orb"), e = S.val("e");
      const R = { E: run(stepE, dt, orbits, e), R: run(stepR, dt, orbits, e), L: run(stepL, dt, orbits, e) };
      const v = QSim.view(cv, 0.56), g = v.g, half = v.W * 0.48;
      const span = 2.6 * (1 + e) / (1 + 0) ;
      const f1 = QSim.frame({ g, W: half, H: v.H, cv }, { x0: -span, x1: span * 0.6, y0: -span * 0.7, y1: span * 0.7, equal: true, pad: 6 });
      f1.path(R.E.path, c.ink3, 1); f1.path(R.L.path, c.acc, 1.5); f1.path(R.R.path, c.main, 1.5, [4, 3]); f1.dot(0, 0, c.warn, 4);
      g.save(); g.translate(half, 0);
      const f2 = QSim.frame({ g, W: v.W - half, H: v.H, cv }, { x0: 0, x1: orbits, y0: -14, y1: 1, xl: "시간 (년)", yl: "log 상대 에너지 오차" }); f2.axes();
      const lg = (arr) => arr.filter((p) => p[1] > 0).map(([t, d]) => [t, Math.max(-14, Math.log10(d))]);
      f2.path(lg(R.E.err), c.ink3, 1.5); f2.path(lg(R.R.err), c.main, 1.5); f2.path(lg(R.L.err), c.acc, 1.5); g.restore();
      S.out(`이심률 ${fx(e, 2)} 궤도(주기 1년), 시간 간격 Δt = ${ex(dt, 0)}년, ${orbits}바퀴 = ${Math.round(orbits / dt)}걸음\n마지막 상대 에너지 오차: Euler ${ex(R.E.final, 2)}, RK4 ${ex(R.R.final, 2)}, 도약 개구리 ${ex(R.L.final, 2)}\n도중 최대: Euler ${ex(R.E.emax, 2)}, RK4 ${ex(R.R.emax, 2)}, 도약 개구리 ${ex(R.L.emax, 2)}\n회색: Euler, 파란 점선: RK4, 주황: 도약 개구리`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 6. 최소제곱 직선 맞춤 (06-01) */
  (() => {
    const S = QSim.card("lab-a6-fit"); if (!S) return;
    const cv = S.$("canvas"); let seed = 11;
    function draw() {
      const c = C(), H = S.val("h0"), sig = S.val("sig"), N = S.val("n"), r = rng(seed);
      const d = [], vv = []; for (let i = 0; i < N; i++) { const x = 5 + 145 * r(); d.push(x); vv.push(H * x + sig * gauss(r)); }
      const sx = d.reduce((a, b) => a + b, 0), sy = vv.reduce((a, b) => a + b, 0), sxx = d.reduce((a, x) => a + x * x, 0), sxy = d.reduce((a, x, i) => a + x * vv[i], 0);
      const b = (N * sxy - sx * sy) / (N * sxx - sx * sx), a = (sy - b * sx) / N, b0 = sxy / sxx;
      const res = d.map((x, i) => vv[i] - (a + b * x)), s = Math.sqrt(res.reduce((q, z) => q + z * z, 0) / (N - 2)), sb = s * Math.sqrt(N / (N * sxx - sx * sx));
      const v = QSim.view(cv, 0.56), fr = QSim.frame(v, { x0: 0, x1: 160, y0: -1500, y1: 13000, xl: "거리 (Mpc)", yl: "후퇴 속도 (km/s)" }); fr.axes();
      fr.path([[0, 0], [160, 160 * H]], c.ink3, 1, [4, 3]); fr.path([[0, a], [160, a + 160 * b]], c.warn, 2);
      d.forEach((x, i) => fr.dot(x, vv[i], c.main, 3.5));
      S.out(`가상 자료 ${N}개: 참 H₀ = ${H} km/s/Mpc, 속도 잡음 σ = ${sig} km/s\n최소제곱 직선: 기울기 b = ${fx(b, 1)} ± ${fx(sb, 1)} km/s/Mpc, 절편 a = ${fx(a, 0)} km/s\n원점을 지나는 직선: H₀ = ${fx(b0, 1)} km/s/Mpc. 잔차 표준편차 s = ${fx(s, 0)} km/s\n빨간 선: 맞춘 직선, 회색 점선: 참 직선`);
    }
    S.$(".btns .new").addEventListener("click", () => { seed += 1; draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 7. Monte Carlo로 π 어림 (06-02) */
  (() => {
    const S = QSim.card("lab-a6-mc"); if (!S) return;
    const cv = S.$("canvas"); let seed = 5;
    function draw() {
      const c = C(), N = Math.round(Math.pow(10, S.val("ln"))), r = rng(seed);
      const v = QSim.view(cv, 0.56), g = v.g, half = Math.min(v.H, v.W * 0.48);
      const f1 = QSim.frame({ g, W: half, H: v.H, cv }, { x0: 0, x1: 1, y0: 0, y1: 1, equal: true, pad: 8 });
      let inside = 0; const hist = [];
      for (let i = 1; i <= N; i++) {
        const x = r(), y = r(), ok = x * x + y * y < 1; if (ok) inside++;
        if (i <= 3000) { g.fillStyle = ok ? c.main : c.warn; g.fillRect(f1.X(x) - 1, f1.Y(y) - 1, 2, 2); }
        if (Number.isInteger(Math.log10(i) * 4)) hist.push([Math.log10(i), Math.log10(Math.abs(4 * inside / i - Math.PI) + 1e-9)]);
      }
      const arc = []; for (let i = 0; i <= 60; i++) { const t = Math.PI / 2 * i / 60; arc.push([Math.cos(t), Math.sin(t)]); } f1.path(arc, c.ink, 1.5);
      g.save(); g.translate(half, 0);
      const f2 = QSim.frame({ g, W: v.W - half, H: v.H, cv }, { x0: 0, x1: 7, y0: -5, y1: 0.5, xl: "log₁₀ N", yl: "log₁₀ |오차|" }); f2.axes();
      f2.fn((t) => Math.log10(1.642 / Math.sqrt(Math.pow(10, t))), c.ink3, 1, [4, 3]); hist.forEach((p) => f2.dot(p[0], p[1], c.main, 3)); g.restore();
      const est = 4 * inside / N;
      S.out(`점 N = ${N}개 (그림에는 처음 3,000개까지), 사분원 안 ${inside}개\nπ 어림 = 4 × ${inside}/${N} = ${est.toFixed(5)}, 참값과의 차 ${Math.abs(est - Math.PI).toFixed(5)}\n예상 오차(표준편차) 1.64/√N = ${(1.642 / Math.sqrt(N)).toFixed(5)}\n오른쪽: N에 따른 실제 오차(점)와 1.64/√N(점선)`);
    }
    S.$(".btns .new").addEventListener("click", () => { seed += 1; draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
