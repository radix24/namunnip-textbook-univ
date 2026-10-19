/* 기계16 공학수치해석: 이분법·Newton·할선법 비교 (02-01) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-roots"); if (!S) return;
  const [cv] = S.$$("canvas");
  const FN = {
    cole: { n: "Colebrook (x = 1/√f, Re = 10⁵, ε/D = 0.001)", f: (x) => x + 2 * Math.log10(0.001 / 3.7 + (2.51 * x) / 1e5), d: (x) => 1 + (2 / Math.LN10) * (2.51e-5 / (0.001 / 3.7 + 2.51e-5 * x)), a: 1, b: 20, x0: 5, x1: 6, view: [0, 20, -10, 15] },
    sqrt2: { n: "x² − 2", f: (x) => x * x - 2, d: (x) => 2 * x, a: 0, b: 2, x0: 1, x1: 2, view: [-0.5, 2.5, -3, 4] },
    cyc: { n: "x³ − 2x + 2", f: (x) => x ** 3 - 2 * x + 2, d: (x) => 3 * x * x - 2, a: -3, b: 0, x0: 0, x1: 0.5, view: [-3, 2, -10, 10] },
  };
  function run(F, m) {
    const it = []; let a = F.a, b = F.b, x = F.x0, xp = F.x1;
    for (let k = 1; k <= 40; k++) {
      let xn;
      if (m === "bis") { const c = (a + b) / 2; if (F.f(a) * F.f(c) <= 0) b = c; else a = c; xn = (a + b) / 2; }
      else if (m === "newton") { const d = F.d(x); if (Math.abs(d) < 1e-14) break; xn = x - F.f(x) / d; }
      else { const fx = F.f(x), fp = F.f(xp); if (Math.abs(fx - fp) < 1e-300) break; xn = x - (fx * (x - xp)) / (fx - fp); xp = x; }
      it.push(xn);
      if (!isFinite(xn)) break;
      if (Math.abs(xn - x) < 1e-12 * Math.max(1, Math.abs(xn)) && m !== "bis") { x = xn; break; }
      if (m === "bis" && b - a < 1e-12) break;
      x = xn;
    }
    return it;
  }
  function draw() {
    const c = QSim.col(), F = FN[S.val("fn")], m = S.val("m");
    const it = run(F, m), xs = it[it.length - 1];
    const [x0, x1, y0, y1] = F.view, v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0, x1, y0, y1, xl: "x", yl: "f(x)", pad: 32 });
    f.axes(); f.path([[x0, 0], [x1, 0]], c.ink3, 1);
    f.fn(F.f, c.main, 2);
    it.slice(0, 8).forEach((x, i) => { if (x >= x0 && x <= x1) f.dot(x, 0, i === it.length - 1 ? c.warn : c.acc, 4); });
    const errs = it.slice(0, 8).map((x, i) => `${i + 1}: ${x.toPrecision(9)}`).join(", ");
    const conv = it.length && isFinite(xs) && Math.abs(F.f(xs)) < 1e-8;
    const name = { bis: "이분법", newton: "Newton 방법", sec: "할선법" }[m];
    S.out(`${F.n}, ${name}${m === "bis" ? ` (구간 [${F.a}, ${F.b}])` : m === "newton" ? ` (x₀ = ${F.x0})` : ` (x₀ = ${F.x0}, x₁ = ${F.x1})`}\n반복 ${it.length}회 → ${conv ? `근 x = ${xs.toPrecision(10)}${F === FN.cole ? `, f = 1/x² = ${(1 / (xs * xs)).toPrecision(6)}` : ""}` : "수렴하지 않음"}\n처음 반복값: ${errs}`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();

/* 기계16 6단원: Euler와 RK4로 푼 진동자 (06-01) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-rk"); if (!S) return;
  const [cv] = S.$$("canvas");
  function draw() {
    const c = QSim.col(), h = S.val("h"), z = S.val("z"), m = S.val("m"), T = 10 * Math.PI;
    const f = (x, v) => [v, -x - 2 * z * v]; // ωn = 1
    const exact = (t) => { if (z >= 1) return NaN; const wd = Math.sqrt(1 - z * z); return Math.exp(-z * t) * (Math.cos(wd * t) + (z / wd) * Math.sin(wd * t)); };
    let x = 1, v = 0; const pts = [[0, 1]]; let blow = false;
    const n = Math.round(T / h);
    for (let i = 0; i < n; i++) {
      if (m === "euler") { const [a, b] = f(x, v); x += h * a; v += h * b; }
      else { const k1 = f(x, v), k2 = f(x + (h / 2) * k1[0], v + (h / 2) * k1[1]), k3 = f(x + (h / 2) * k2[0], v + (h / 2) * k2[1]), k4 = f(x + h * k3[0], v + h * k3[1]); x += (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); v += (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]); }
      pts.push([(i + 1) * h, x]);
      if (Math.abs(x) > 1e6) { blow = true; break; }
    }
    const yr = Math.min(Math.max(1.5, ...pts.map((p) => Math.abs(p[1]))) * 1.1, 10);
    const view = QSim.view(cv, 0.5), fr = QSim.frame(view, { x0: 0, x1: T, y0: -yr, y1: yr, xl: "t", yl: "x", pad: 32 });
    fr.axes();
    fr.fn(exact, c.ink3, 1.5, [4, 3], 1200);
    fr.path(pts.filter((p) => Math.abs(p[1]) <= yr), c.main, 2);
    if (n <= 200) pts.forEach((p) => { if (Math.abs(p[1]) <= yr) fr.dot(p[0], p[1], c.main, 2.5); });
    const E = x * x + v * v, Eex = z < 1 ? exact(n * h) ** 2 : NaN;
    S.out(`${m === "euler" ? "Euler" : "RK4"}, 간격 h = ${h} (주기 2π의 1/${(2 * Math.PI / h).toFixed(0)}), 감쇠비 ${z}, 걸음 ${n}회 (함수 계산 ${m === "euler" ? n : 4 * n}회)\n${blow ? "발산함 (수치 불안정)" : `t = 10π에서 x = ${x.toFixed(5)}, 참값 ${exact(n * h).toFixed(5)}, 오차 ${Math.abs(x - exact(n * h)).toExponential(2)}`}\n${z === 0 && !blow ? `에너지 x² + ẋ² = ${E.toPrecision(6)} (참값 1)` : ""}`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();
/* 기계16 7단원: 막대 열전도의 양적·음적 방법 (07-02) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-heat1d"); if (!S) return;
  const [cv] = S.$$("canvas");
  const N = 20, dx = 1 / N, TEND = 0.1;
  const exact = (x, t) => { let s = 100; for (let n = 1; n < 400; n += 2) s -= (400 / (n * Math.PI)) * Math.sin(n * Math.PI * x) * Math.exp(-((n * Math.PI) ** 2) * t); return s; };
  function step(u, r, imp) {
    if (!imp) { const w = u.slice(); for (let i = 1; i < N; i++) w[i] = u[i] + r * (u[i - 1] - 2 * u[i] + u[i + 1]); return w; }
    const m = N - 1, b = new Array(m).fill(1 + 2 * r), d = u.slice(1, N);
    d[0] += r * u[0]; d[m - 1] += r * u[N];
    for (let i = 1; i < m; i++) { const w = -r / b[i - 1]; b[i] -= w * -r; d[i] -= w * d[i - 1]; }
    const x = new Array(m); x[m - 1] = d[m - 1] / b[m - 1];
    for (let i = m - 2; i >= 0; i--) x[i] = (d[i] + r * x[i + 1]) / b[i];
    return [u[0], ...x, u[N]];
  }
  function draw() {
    const c = QSim.col(), m = S.val("m"), imp = m === "imp";
    const r = S.val("r") * (imp ? +S.val("k") : 1);
    const dt = r * dx * dx, n = Math.max(1, Math.round(TEND / dt));
    let u = new Array(N + 1).fill(0); u[0] = u[N] = 100;
    const snaps = [], marks = [1, 2, 3, 4].map((k) => Math.max(1, Math.round((k * n) / 4)));
    let blow = false;
    for (let k = 1; k <= n; k++) {
      u = step(u, r, imp);
      if (marks.includes(k)) snaps.push([k, u.slice()]);
      if (!u.every((v) => Math.abs(v) < 1e12)) { blow = true; snaps.push([k, u.slice()]); break; }
    }
    const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: 1, y0: -50, y1: 150, xl: "x / L", yl: "T (°C)", pad: 32 });
    f.axes();
    const cols = [c.soft, c.acc, c.main, c.warn];
    marks.forEach((k) => f.fn((x) => exact(x, k * dt), c.ink3, 1.2, [4, 3], 200));
    snaps.forEach(([k, s], j) => {
      const pts = s.map((y, i) => [i * dx, Math.max(-50, Math.min(150, y))]);
      f.path(pts, cols[j % 4], 2); pts.forEach((p) => f.dot(p[0], p[1], cols[j % 4], 2.5));
    });
    const last = snaps[snaps.length - 1], uc = last[1][N / 2], ex = exact(0.5, last[0] * dt);
    const mx = Math.max(...last[1].map(Math.abs));
    S.out(`${imp ? "음적" : "양적"} 방법, r = ${r.toFixed(2)}${!imp && +S.val("k") > 1 ? " (배율은 음적 방법에만 적용)" : ""}, 걸음 ${n}회\n${blow ? `발산함: ${last[0]}걸음에서 |T| > 10¹²` : `무차원 시간 ${(n * dt).toFixed(4)}에서 중앙 온도 ${uc.toFixed(2)} °C (정확한 해 ${ex.toFixed(2)} °C)${mx > 100.01 ? `, 최대 |T| ${mx.toExponential(2)} °C (톱니 오차가 자람)` : ""}`}\n${imp ? "음적 방법은 어떤 r에서도 안정" : r <= 0.5 ? "r ≤ 0.5: 안정 조건 만족" : `r > 0.5: 톱니 오차가 걸음마다 ${Math.abs(1 - 4 * r).toFixed(2)}배`}`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();
