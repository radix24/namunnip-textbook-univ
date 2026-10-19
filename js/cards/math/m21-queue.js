/* 수학21 탐구: M/M/1 대기행렬 시뮬레이션 — 인원 경로, 시간 평균 L, 손님별 체류 시간 W, 리틀 공식 */
(() => {
  "use strict";
  const S = MKit.setup("card-m21-queue", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const rng = (seed) => { let s = seed | 0; return () => { s = (s + 0x6d2b79f5) | 0; let r = Math.imul(s ^ (s >>> 15), 1 | s); r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r; return (((r ^ (r >>> 14)) >>> 0) + 0.5) / 4294967296; }; };
  const SHOW = 200;
  function simulate(lam, mu, T, seed) {
    const u = rng(seed * 7919 + 13), ex = (a) => -Math.log(u()) / a;
    let t = 0, n = 0, area = 0, nmax = 0, done = 0, wsum = 0;
    const q = [], path = [[0, 0]];
    while (t < T) {
      const rate = lam + (n > 0 ? mu : 0), dt = ex(rate), t1 = Math.min(T, t + dt);
      area += n * (t1 - t); t = t1; if (t >= T) break;
      if (u() < lam / rate) { n++; q.push(t); } else { n--; wsum += t - q.shift(); done++; }
      if (n > nmax) nmax = n;
      if (t <= SHOW) path.push([t, n]);
    }
    return { L: area / T, W: done ? wsum / done : 0, done, nmax, path };
  }
  function draw() {
    const c = QSim.col(), rho = k.val("rho"), T = Number(k.val("T")), seed = k.val("seed"), mu = 1, lam = rho * mu;
    const R = simulate(lam, mu, T, seed);
    const top = Math.max(5, ...R.path.map((p) => p[1])) + 1;
    const F = QSim.frame(v, { x0: 0, x1: SHOW, y0: 0, y1: top, pad: 34, xl: "시간", yl: "인원" });
    F.axes({});
    const pts = [];
    for (let i = 0; i < R.path.length; i++) { const [t, n] = R.path[i]; if (i) pts.push([t, R.path[i - 1][1]]); pts.push([t, n]); }
    pts.push([SHOW, R.path[R.path.length - 1][1]]);
    F.path(pts, c.main, 1.4);
    const Lth = rho / (1 - rho);
    if (Lth < top) { F.path([[0, Lth], [SHOW, Lth]], c.acc, 1.5, [6, 4]); F.text("이론 L", 4, Lth, c.acc, "left"); }
    k.out(`ρ = λ/μ = ${fmt(rho, 2)} (μ = 1, λ = ${fmt(lam, 2)}) · 시간 ${T} 동안 시뮬레이션 (그림은 처음 ${SHOW})\n` +
      `시간 평균 인원 L = ${fmt(R.L, 3)} · 이론 ρ/(1−ρ) = ${fmt(Lth, 3)} · 최대 인원 ${R.nmax}\n` +
      `떠난 손님 ${R.done}명의 평균 체류 W = ${fmt(R.W, 3)} · 이론 1/(μ−λ) = ${fmt(1 / (mu - lam), 3)} · 리틀: λW = ${fmt(lam * R.W, 3)}`);
  }
  S.redraw();
})();
