/* 공통12 실습 카드 묶음: 무기억성, 상관과 합의 분산, 변환 난수, 공차 누적 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const erf = (x) => { const s = Math.sign(x); x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x); const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return s * y; };
  const Phi = (z) => 0.5 * (1 + erf(z / Math.SQRT2));
  const rng = (seed) => () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return (seed + 0.5) / 4294967296; };
  const gauss = (r) => Math.sqrt(-2 * Math.log(r())) * Math.cos(2 * Math.PI * r());
  const hist = (xs, lo, hi, k) => { const w = (hi - lo) / k, c = Array(k).fill(0); xs.forEach((x) => { const i = Math.floor((x - lo) / w); if (i >= 0 && i < k) c[i]++; }); return c.map((n) => n / (xs.length * w)); };
  const bars = (f, g, h, lo, hi, col) => { const k = h.length, w = (hi - lo) / k; g.fillStyle = col; h.forEach((d, i) => { const x0 = f.X(lo + i * w), x1 = f.X(lo + (i + 1) * w); g.fillRect(x0, f.Y(d), Math.max(1, x1 - x0 - 1), f.Y(0) - f.Y(d)); }); };

  /* 2. 무기억성: 살아남은 부품의 남은 수명 (04-02) */
  (() => {
    const S = QSim.card("lab-c12-memory"); if (!S) return;
    const cv = S.$("canvas"), N = 20000;
    const gen = (kind) => { const r = rng(17); return Array.from({ length: N }, () => { const u = r(); if (kind === "exp") return -1000 * Math.log(u); if (kind === "weib") return 1120 * Math.pow(-Math.log(u), 1 / 3); return 2000 * u; }); };
    const cache = {};
    function draw() {
      const c = C(), kind = S.val("kind"), s = S.val("s"), T = cache[kind] || (cache[kind] = gen(kind));
      const surv = T.filter((t) => t > s).map((t) => t - s);
      const v = QSim.view(cv, 0.48), f = QSim.frame(v, { x0: 0, x1: 3000, y0: 0, y1: 0.0016, xl: "시간 (h)", yl: "밀도" }); f.axes({ noGrid: true });
      const hn = hist(T, 0, 3000, 30); f.path(hn.flatMap((d, i) => [[i * 100, d], [(i + 1) * 100, d]]), c.ink3, 1.5);
      if (surv.length > 50) bars(f, v.g, hist(surv, 0, 3000, 30), 0, 3000, "rgba(90,100,230,0.45)");
      const p0 = T.filter((t) => t > 500).length / N, p1 = surv.length ? surv.filter((t) => t > 500).length / surv.length : NaN;
      const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
      const name = { exp: "지수분포 (평균 1000 h)", weib: "와이블 형상 3 (마모, 평균 약 1000 h)", unif: "균일 U(0, 2000)" }[kind];
      S.out(`${name}, 부품 ${N}개, 이미 ${s} h 작동한 것 ${surv.length}개 남음\n새 부품: P(T > 500) = ${p0.toFixed(3)}, 평균 수명 ${mean(T).toFixed(0)} h (회색 선)\n살아남은 부품: P(500 h 더 감) = ${isFinite(p1) ? p1.toFixed(3) : "-"}, 평균 남은 수명 ${surv.length ? mean(surv).toFixed(0) : "-"} h (파란 막대)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 상관계수와 합의 분산 (05-03) */
  (() => {
    const S = QSim.card("lab-c12-corr"); if (!S) return;
    const cv = S.$("canvas"); let seed = 5;
    function draw() {
      const c = C(), rho = S.val("rho"), sy = S.val("sy"), n = 300, r = rng(seed), X = [], Y = [];
      for (let i = 0; i < n; i++) { const z1 = gauss(r), z2 = gauss(r); X.push(z1); Y.push(sy * (rho * z1 + Math.sqrt(1 - rho * rho) * z2)); }
      const m = (a) => a.reduce((p, q) => p + q, 0) / a.length, mx = m(X), my = m(Y);
      let sxy = 0, sxx = 0, syy = 0; X.forEach((x, i) => { sxy += (x - mx) * (Y[i] - my); sxx += (x - mx) ** 2; syy += (Y[i] - my) ** 2; });
      const rr = sxy / Math.sqrt(sxx * syy), vs = (sxx + syy + 2 * sxy) / (n - 1), vd = (sxx + syy - 2 * sxy) / (n - 1);
      const L = Math.max(3.5, 3.5 * sy);
      const v = QSim.view(cv, 0.6), f = QSim.frame(v, { x0: -L, x1: L, y0: -L, y1: L, xl: "X", yl: "Y", equal: true }); f.axes();
      X.forEach((x, i) => f.dot(x, Y[i], c.main, 2.2));
      f.fn((x) => rho * sy * x, c.warn, 1.5, [5, 4]);
      S.out(`ρ = ${rho.toFixed(2)}, σX = 1, σY = ${sy.toFixed(1)}, 점 ${n}개\n표본 상관계수 r = ${rr.toFixed(3)}, 표본 공분산 ${(sxy / (n - 1)).toFixed(3)} (이론 ${(rho * sy).toFixed(3)})\nVar(X + Y): 이론 ${(1 + sy * sy + 2 * rho * sy).toFixed(3)}, 표본 ${vs.toFixed(3)}   Var(X − Y): 이론 ${(1 + sy * sy - 2 * rho * sy).toFixed(3)}, 표본 ${vd.toFixed(3)}`);
    }
    S.$(".new").addEventListener("click", () => { seed = (seed * 31 + 7) % 99991; draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 균일 난수의 변환 (06-01) */
  (() => {
    const S = QSim.card("lab-c12-transform"); if (!S) return;
    const cv = S.$("canvas"), N = 20000;
    const G = {
      sq: { n: "Y = X²", g: (x) => x * x, lo: 0, hi: 1, top: 6, f: (y) => (y > 0 && y <= 1 ? 1 / (2 * Math.sqrt(y)) : 0), fs: "f(y) = 1/(2√y), 0 < y ≤ 1" },
      sqrt: { n: "Y = √X", g: Math.sqrt, lo: 0, hi: 1, top: 2.4, f: (y) => (y >= 0 && y <= 1 ? 2 * y : 0), fs: "f(y) = 2y, 0 ≤ y ≤ 1" },
      exp: { n: "Y = −ln X", g: (x) => -Math.log(x), lo: 0, hi: 6, top: 1.15, f: (y) => (y >= 0 ? Math.exp(-y) : 0), fs: "f(y) = e^(−y): 지수분포 λ = 1" },
      lin: { n: "Y = 3X + 1", g: (x) => 3 * x + 1, lo: 0, hi: 5, top: 0.5, f: (y) => (y >= 1 && y <= 4 ? 1 / 3 : 0), fs: "f(y) = 1/3, 1 ≤ y ≤ 4 (균일, 폭이 3배라 밀도는 1/3)" }
    };
    const r = rng(23), U = Array.from({ length: N }, () => r());
    function draw() {
      const c = C(), q = G[S.val("g")], k = S.val("bins"), Y = U.map(q.g);
      const h = hist(Y, q.lo, q.hi, k), top = Math.min(q.top, Math.max(...h) * 1.15);
      const v = QSim.view(cv, 0.48), f = QSim.frame(v, { x0: q.lo, x1: q.hi, y0: 0, y1: top, xl: "y", yl: "밀도" }); f.axes();
      bars(f, v.g, h.map((d) => Math.min(d, top)), q.lo, q.hi, c.soft);
      f.fn((y) => Math.min(q.f(y), top * 1.5), c.warn, 2.5, null, 600);
      const m = Y.reduce((a, b) => a + b, 0) / N;
      S.out(`X ~ U(0, 1) 난수 ${N}개를 ${q.n}로 변환 (막대: 히스토그램, 빨간 선: 이론)\n${q.fs}\n표본 평균 ${m.toFixed(4)}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 5. 공차 누적: 최악 조건과 RSS (06-02) */
  (() => {
    const S = QSim.card("lab-c12-tol"); if (!S) return;
    const cv = S.$("canvas"), M = 20000;
    function draw() {
      const c = C(), n = S.val("n"), t = S.val("t"), kind = S.val("kind"), r = rng(41), sum = [];
      const one = () => (kind === "norm" ? (t / 3) * gauss(r) : t * (2 * r() - 1));
      for (let j = 0; j < M; j++) { let s = 0; for (let i = 0; i < n; i++) s += one(); sum.push(s); }
      const sd1 = kind === "norm" ? t / 3 : t / Math.sqrt(3), sdS = sd1 * Math.sqrt(n), rss = t * Math.sqrt(n), wc = n * t;
      const lo = -wc * 1.05, hi = wc * 1.05, h = hist(sum, lo, hi, 60), top = Math.max(...h) * 1.15;
      const v = QSim.view(cv, 0.45), f = QSim.frame(v, { x0: lo, x1: hi, y0: 0, y1: top, xl: "전체 길이 − 목표 (mm)", yl: "밀도" }); f.axes({ noGrid: true });
      bars(f, v.g, h, lo, hi, c.soft);
      f.fn((x) => Math.exp(-((x / sdS) ** 2) / 2) / (sdS * Math.sqrt(2 * Math.PI)), c.main, 2);
      [[-wc, c.warn], [wc, c.warn], [-rss, c.acc], [rss, c.acc]].forEach(([x, col]) => f.path([[x, 0], [x, top]], col, 2, [5, 4]));
      const out = sum.filter((s) => Math.abs(s) > rss).length / M, mx = Math.max(...sum.map(Math.abs));
      S.out(`부품 ${n}개, 각 ±${t.toFixed(3)} mm (${kind === "norm" ? "정규, 공차 = 3σ" : "균일, 공차 = 반폭"})\n최악 조건 ±${wc.toFixed(3)} (빨강), RSS ±${rss.toFixed(3)} (주황), 실제 σ합 = ${sdS.toFixed(4)}\n${M}번 조립 중 RSS를 벗어난 비율 ${(100 * out).toFixed(2)}%, 실제 최대 편차 ${mx.toFixed(3)} (최악의 ${(100 * mx / wc).toFixed(0)}%)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
