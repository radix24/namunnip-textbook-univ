/* 기계7 기계공학실험(1) 6단원: 최소제곱 직선, 기울기 불확도, 잔차 (06-01) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-fit"); if (!S) return;
  const [cv] = S.$$("canvas");
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const gauss = (r) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const TT = [12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201, 2.179, 2.160, 2.145, 2.131, 2.120, 2.110, 2.101, 2.093, 2.086, 2.080, 2.074, 2.069, 2.064, 2.060, 2.056, 2.052, 2.048];
  const tval = (df) => (df <= 28 ? TT[df - 1] : 1.96 + 2.4 / df);
  let seed = 3;
  const B = 4.0, A = 0.2, XMAX = 5; // 참 기울기 4.0 mm/N, 절편 0.2 mm (가상 용수철)
  function draw() {
    const c = QSim.col(), n = S.val("n"), sig = S.val("sig"), curv = S.val("cv"), out = S.val("out") === "on";
    const r = rng(seed * 6007), xs = [], ys = [];
    for (let i = 0; i < n; i++) { const x = (XMAX * i) / (n - 1); xs.push(x); ys.push(A + B * x + curv * x * x + sig * gauss(r)); }
    if (out) ys[Math.floor(n / 2)] += 2.0; // 한 점을 잘못 읽음
    const xm = xs.reduce((p, q) => p + q, 0) / n, ym = ys.reduce((p, q) => p + q, 0) / n;
    let Sxx = 0, Sxy = 0, Syy = 0; xs.forEach((x, i) => { Sxx += (x - xm) ** 2; Sxy += (x - xm) * (ys[i] - ym); Syy += (ys[i] - ym) ** 2; });
    const b = Sxy / Sxx, a = ym - b * xm, res = xs.map((x, i) => ys[i] - (a + b * x)), SSE = res.reduce((p, q) => p + q * q, 0);
    const sy = Math.sqrt(SSE / (n - 2)), ub = sy / Math.sqrt(Sxx), t = tval(n - 2), R2 = 1 - SSE / Syy, hit = Math.abs(b - B) <= t * ub;
    const v = QSim.view(cv, 0.65), G = v.g, H = v.H;
    const f = QSim.frame(v, { x0: -0.2, x1: XMAX + 0.2, y0: -1, y1: A + B * XMAX + curv * XMAX * XMAX + 3, xl: "하중 F (N)", yl: "늘음 (mm)", pad: 34 });
    f.axes();
    f.fn((x) => a + b * x, c.acc, 2);
    xs.forEach((x, i) => f.dot(x, ys[i], c.main, 4));
    // 잔차 그림 (오른쪽 아래 작은 칸)
    const ox = v.W * 0.58, oy = H * 0.52, w = v.W * 0.38, h = H * 0.3, rmax = Math.max(0.3, ...res.map(Math.abs)) * 1.2;
    G.save(); G.fillStyle = "rgba(127,127,127,.06)"; G.fillRect(ox, oy, w, h); G.strokeStyle = c.rule; G.strokeRect(ox, oy, w, h);
    G.beginPath(); G.moveTo(ox, oy + h / 2); G.lineTo(ox + w, oy + h / 2); G.stroke();
    res.forEach((e, i) => { G.fillStyle = c.warn; G.beginPath(); G.arc(ox + (xs[i] / XMAX) * w, oy + h / 2 - (e / rmax) * (h / 2), 3, 0, 7); G.fill(); });
    G.fillStyle = c.ink2; G.font = "11px monospace"; G.fillText("잔차", ox + 4, oy + 12); G.restore();
    S.out(`점 ${n}개, 잡음 σ = ${sig.toFixed(2)} mm, 곡률 ${curv.toFixed(2)} mm/N², 잘못 읽은 점 ${out ? "있음" : "없음"} (참 기울기 4.00 mm/N)\n맞춤: 기울기 b = ${b.toFixed(3)} ± ${(t * ub).toFixed(3)} mm/N (95%, u_b = ${ub.toFixed(4)}), 절편 ${a.toFixed(3)} mm\ns_y = ${sy.toFixed(3)} mm, R² = ${R2.toFixed(5)} → 구간이 참 기울기를 ${hit ? "품음" : "놓침"}`);
  }
  S.$(".reset").addEventListener("click", () => { seed++; draw(); });
  S.on(draw); QSim.redrawOn(draw); draw();
})();
