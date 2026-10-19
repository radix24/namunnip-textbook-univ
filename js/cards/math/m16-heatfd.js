/* 수학16 탐구: 열방정식 양적·음적·크랭크-니콜슨 방법 — r = k/h²에 따른 안정성 */
(() => {
  "use strict";
  const S = MKit.setup("card-m16-heatfd", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const N = 20, T = 0.1, H = 1 / N;
  const u0 = (x) => 1 - Math.abs(2 * x - 1);
  const exact = (x, t) => { let s = 0; for (let m = 1; m < 400; m += 2) s += ((8 / (Math.PI * m) ** 2) * (((m - 1) / 2) % 2 ? -1 : 1)) * Math.exp(-((Math.PI * m) ** 2) * t) * Math.sin(Math.PI * m * x); return s; };
  function thomas(a, d, c, b) {
    const n = d.length, cp = new Float64Array(n), dp = new Float64Array(n);
    cp[0] = c / d[0]; dp[0] = b[0] / d[0];
    for (let i = 1; i < n; i++) { const m = d[i] - a * cp[i - 1]; cp[i] = c / m; dp[i] = (b[i] - a * dp[i - 1]) / m; }
    const x = new Float64Array(n); x[n - 1] = dp[n - 1];
    for (let i = n - 2; i >= 0; i--) x[i] = dp[i] - cp[i] * x[i + 1];
    return x;
  }
  function run(r0, sch) {
    const steps = Math.max(1, Math.round(T / (r0 * H * H))), r = T / steps / (H * H);
    let u = []; for (let i = 0; i <= N; i++) u.push(u0(i * H));
    let blew = false;
    for (let s = 0; s < steps; s++) {
      if (sch === "ex") { const w = [0]; for (let i = 1; i < N; i++) w.push(u[i] + r * (u[i - 1] - 2 * u[i] + u[i + 1])); w.push(0); u = w; }
      else {
        const th = sch === "im" ? 1 : 0.5, m = N - 1, d = new Float64Array(m).fill(1 + 2 * th * r), rhs = new Float64Array(m);
        for (let i = 1; i < N; i++) rhs[i - 1] = u[i] + (1 - th) * r * (u[i - 1] - 2 * u[i] + u[i + 1]);
        const x = thomas(-th * r, d, -th * r, rhs); u = [0, ...x, 0];
      }
      if (Math.max(...u.map(Math.abs)) > 1e3) { blew = true; break; }
    }
    return { u, r, steps, blew };
  }
  function draw() {
    const c = QSim.col(), sch = k.val("s"), r0 = k.val("r");
    const R = run(r0, sch);
    const F = QSim.frame(v, { x0: 0, x1: 1, y0: -0.6, y1: 1.1, pad: 26, xl: "x", yl: "u" });
    F.axes();
    F.fn(u0, c.ink3, 1, [3, 3], 200);
    F.fn((x) => exact(x, T), c.acc, 1.6, [5, 4], 200);
    F.path(R.u.map((y, i) => [i * H, Math.max(-0.6, Math.min(1.1, y))]), sch === "ex" ? c.warn : c.main, 2);
    R.u.forEach((y, i) => F.dot(i * H, Math.max(-0.6, Math.min(1.1, y)), sch === "ex" ? c.warn : c.main, 2.5));
    let err = 0; R.u.forEach((y, i) => { err = Math.max(err, Math.abs(y - exact(i * H, T))); });
    const nm = { ex: "양적(FTCS)", im: "음적(후진 오일러)", cn: "크랭크-니콜슨" }[sch];
    k.out(`${nm}, h = 1/${N}, r = k/h² = ${fmt(R.r, 3)} (k = ${(R.r * H * H).toExponential(2)}), t = ${T}까지 ${R.steps}걸음\n${R.blew ? "폭발함(값이 1000을 넘음)" : `최대 오차 ${err < 1e-3 ? err.toExponential(2) : fmt(err, 4)}`}${sch === "ex" ? (R.r <= 0.5 ? " · r ≤ 1/2: 안정" : " · r > 1/2: 불안정") : " · 모든 r에서 안정"}`);
  }
  S.redraw();
})();
