/* 응용통계 실습 카드 묶음 (모든 자료는 가상: 컴퓨터가 만든 난수)
   표본분포, 신뢰구간 덮임률, 검정력, 회귀 잔차, 영향점, 붓스트랩, 층화추출, Markov 연쇄, 베타-이항 사후분포, AR(1), Metropolis */
(() => {
  "use strict";
  const C = () => QSim.col();
  /* 선형합동 난수 (seed·1664525 + 1013904223) mod 2³². Math.imul로 같은 수열을 빠르게 */
  const rng = (seed) => () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return (seed + 0.5) / 4294967296; };
  const gauss = (r) => Math.sqrt(-2 * Math.log(r())) * Math.cos(2 * Math.PI * r());
  const erf = (x) => { const s = Math.sign(x); x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x); const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return s * y; };
  const Phi = (z) => 0.5 * (1 + erf(z / Math.SQRT2));
  const phi = (z) => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
  /* 표준정규 분위수 (Acklam 근사, 오차 1e-9 수준) */
  const qnorm = (p) => {
    const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
    const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
    const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
    const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
    const pl = 0.02425;
    if (p < pl) { const q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    if (p > 1 - pl) return -qnorm(1 - p);
    const q = p - 0.5, r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  };
  /* t 분위수: 코니시-피셔 전개 (자유도 4 이상에서 소수 둘째 자리까지 맞음) */
  const qt = (p, v) => { const z = qnorm(p), z3 = z ** 3, z5 = z ** 5, z7 = z ** 7; return z + (z3 + z) / (4 * v) + (5 * z5 + 16 * z3 + 3 * z) / (96 * v * v) + (3 * z7 + 19 * z5 + 17 * z3 - 15 * z) / (384 * v ** 3); };
  const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  const sd = (a) => { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };
  const sorted = (a) => [...a].sort((x, y) => x - y);
  const quant = (s, p) => { const h = (s.length - 1) * p, i = Math.floor(h); return s[i] + (h - i) * ((s[i + 1] ?? s[i]) - s[i]); };
  const hist = (xs, lo, hi, k) => { const w = (hi - lo) / k, c = Array(k).fill(0); xs.forEach((x) => { const i = Math.floor((x - lo) / w); if (i >= 0 && i < k) c[i]++; }); return c.map((n) => n / (xs.length * w)); };
  const bars = (f, g, h, lo, hi, col) => { const k = h.length, w = (hi - lo) / k; g.fillStyle = col; h.forEach((d, i) => { const x0 = f.X(lo + i * w), x1 = f.X(lo + (i + 1) * w); g.fillRect(x0, f.Y(d), Math.max(1, x1 - x0 - 1), f.Y(0) - f.Y(d)); }); };
  const vline = (f, x, y0, y1, col, w = 1.5, dash = [5, 4]) => f.path([[x, y0], [x, y1]], col, w, dash);
  const f3 = (x) => (Math.abs(x) < 1e-12 ? "0.000" : x.toFixed(3));
  const pct = (x) => (100 * x).toFixed(1) + "%";
  const ols = (X, Y) => {
    const mx = mean(X), my = mean(Y); let sxy = 0, sxx = 0;
    X.forEach((x, i) => { sxy += (x - mx) * (Y[i] - my); sxx += (x - mx) ** 2; });
    const b1 = sxy / sxx, b0 = my - b1 * mx, fit = X.map((x) => b0 + b1 * x), res = Y.map((y, i) => y - fit[i]);
    const sse = res.reduce((s, e) => s + e * e, 0), sst = Y.reduce((s, y) => s + (y - my) ** 2, 0);
    return { b0, b1, fit, res, sse, r2: 1 - sse / sst, mx, sxx, s: Math.sqrt(sse / (X.length - 2)) };
  };

  /* 1. 표본평균의 분포와 중심극한정리 (응통5-03-01) */
  (() => {
    const S = QSim.card("lab-s5-clt"); if (!S) return;
    const [cvP, cvM] = S.$$("canvas"); let seed = 11;
    const POP = {
      unif: { n: "균일분포 U(0, 1)", mu: 0.5, sg: Math.sqrt(1 / 12), lo: -0.1, hi: 1.1, f: (x) => (x >= 0 && x <= 1 ? 1 : 0), r: (u) => u() },
      exp: { n: "지수분포 (평균 1, 오른쪽으로 긴 꼬리)", mu: 1, sg: 1, lo: 0, hi: 5, f: (x) => (x >= 0 ? Math.exp(-x) : 0), r: (u) => -Math.log(u()) },
      bimod: { n: "봉우리 두 개 (0.2와 0.8 근처)", mu: 0.5, sg: Math.sqrt(0.0064 + 0.09), lo: -0.2, hi: 1.2, f: (x) => 0.5 * (phi((x - 0.2) / 0.08) + phi((x - 0.8) / 0.08)) / 0.08, r: (u) => (u() < 0.5 ? 0.2 : 0.8) + 0.08 * gauss(u) },
      bern: { n: "베르누이 p = 0.1 (0 또는 1)", mu: 0.1, sg: Math.sqrt(0.09), lo: -0.2, hi: 1.2, f: null, r: (u) => (u() < 0.1 ? 1 : 0) }
    };
    function draw() {
      const c = C(), p = POP[S.val("pop")], n = S.val("n"), M = 2000, u = rng(seed);
      const means = Array.from({ length: M }, () => { let s = 0; for (let i = 0; i < n; i++) s += p.r(u); return s / n; });
      const v1 = QSim.view(cvP, 0.28);
      if (p.f) { let top = 0; for (let i = 0; i <= 200; i++) top = Math.max(top, p.f(p.lo + (p.hi - p.lo) * i / 200)); const f1 = QSim.frame(v1, { x0: p.lo, x1: p.hi, y0: 0, y1: top * 1.2, xl: "x", yl: "모집단" }); f1.axes({ noGrid: true }); f1.fn(p.f, c.ink2, 2, null, 500); vline(f1, p.mu, 0, top * 1.2, c.warn); }
      else { const f1 = QSim.frame(v1, { x0: p.lo, x1: p.hi, y0: 0, y1: 1.05, xl: "x", yl: "모집단" }); f1.axes({ noGrid: true }); f1.path([[0, 0], [0, 0.9]], c.ink2, 6); f1.path([[1, 0], [1, 0.1]], c.ink2, 6); vline(f1, p.mu, 0, 1.05, c.warn); }
      const se = p.sg / Math.sqrt(n), lo = p.mu - 4.5 * se, hi = p.mu + 4.5 * se;
      const h = hist(means, lo, hi, 45), top = Math.max(...h, phi(0) / se) * 1.15;
      const v2 = QSim.view(cvM, 0.45), f2 = QSim.frame(v2, { x0: lo, x1: hi, y0: 0, y1: top, xl: "표본평균", yl: "밀도" }); f2.axes({ noGrid: true });
      bars(f2, v2.g, h, lo, hi, c.soft);
      f2.fn((x) => phi((x - p.mu) / se) / se, c.warn, 2, null, 400);
      const m = mean(means), s = sd(means), sk = means.reduce((a, x) => a + ((x - m) / s) ** 3, 0) / M;
      const inside = means.filter((x) => Math.abs(x - p.mu) <= 1.96 * se).length / M;
      S.out(`${p.n}, μ = ${p.mu.toFixed(3)}, σ = ${p.sg.toFixed(3)}   표본 크기 n = ${n}, 표본 ${M}개 (가상)\n표본평균들의 평균 ${m.toFixed(4)} (이론 μ = ${p.mu.toFixed(4)}),  표준편차 ${s.toFixed(4)} (이론 σ/√n = ${se.toFixed(4)})\n치우침(왜도) ${sk.toFixed(2)} (정규분포는 0),  μ ± 1.96σ/√n 안에 든 비율 ${pct(inside)} (정규 근사라면 95.0%)`);
    }
    S.$(".new").addEventListener("click", () => { seed = (seed * 31 + 7) % 99991; draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 신뢰구간의 덮임률 (응통5-03-02) */
  (() => {
    const S = QSim.card("lab-s5-ci"); if (!S) return;
    const cv = S.$("canvas"); let seed = 3, tot = 0, hit = 0, last = [];
    const MU = 50, SG = 10;
    function batch() {
      const n = S.val("n"), cl = S.val("cl") / 100, meth = S.val("meth"), pop = S.val("pop"), u = rng(seed);
      const q = meth === "t" ? qt(1 - (1 - cl) / 2, n - 1) : qnorm(1 - (1 - cl) / 2);
      last = [];
      for (let j = 0; j < 100; j++) {
        const x = Array.from({ length: n }, () => (pop === "norm" ? MU + SG * gauss(u) : MU - SG + SG * -Math.log(u())));
        const m = mean(x), s = sd(x), e = q * s / Math.sqrt(n);
        last.push([m - e, m + e]);
      }
      const h = last.filter(([a, b]) => a <= MU && MU <= b).length; tot += 100; hit += h;
      return { h, q, n, cl, meth };
    }
    function draw(info) {
      const c = C(), v = QSim.view(cv, 0.62), f = QSim.frame(v, { x0: MU - 22, x1: MU + 22, y0: 0, y1: 101, xl: "구간", yl: "" }); f.axes({ noGrid: true });
      vline(f, MU, 0, 101, c.ink, 1.5, null);
      last.forEach(([a, b], i) => { const ok = a <= MU && MU <= b; f.path([[Math.max(a, MU - 22), i + 1], [Math.min(b, MU + 22), i + 1]], ok ? c.main : c.warn, ok ? 1.5 : 2.5); });
      const w = mean(last.map(([a, b]) => b - a));
      S.out(`모집단 평균 μ = ${MU} (세로선), n = ${info.n}, 신뢰수준 ${pct(info.cl)}, 곱하는 값 ${info.q.toFixed(3)} (${info.meth === "t" ? "t 분포" : "정규분포 z: 작은 n에서는 잘못"})\n이번 100개 중 μ를 덮은 구간 ${info.h}개 (빨강은 못 덮음), 평균 너비 ${w.toFixed(2)}\n지금까지 ${tot}개 중 ${hit}개 = 덮임률 ${pct(hit / tot)}`);
    }
    const reset = () => { tot = 0; hit = 0; draw(batch()); };
    S.$(".new").addEventListener("click", () => { seed = (seed * 31 + 7) % 99991; draw(batch()); });
    S.on(reset); QSim.redrawOn(() => draw({ h: last.filter(([a, b]) => a <= MU && MU <= b).length, q: S.val("meth") === "t" ? qt(1 - (1 - S.val("cl") / 100) / 2, S.val("n") - 1) : qnorm(1 - (1 - S.val("cl") / 100) / 2), n: S.val("n"), cl: S.val("cl") / 100, meth: S.val("meth") })); reset();
  })();

  /* 3. 검정력: 효과 크기, 표본 크기, 유의수준 (응통5-04-01) */
  (() => {
    const S = QSim.card("lab-s5-power"); if (!S) return;
    const cv = S.$("canvas"); let simTxt = "";
    const calc = () => { const d = S.val("d"), n = S.val("n"), a = S.val("a"), za = qnorm(1 - a / 2), m = d * Math.sqrt(n); return { d, n, a, za, m, pw: 1 - Phi(za - m) + Phi(-za - m) }; };
    function draw() {
      const c = C(), { d, n, a, za, m, pw } = calc(), x0 = -4, x1 = Math.max(6, m + 4);
      const v = QSim.view(cv, 0.45), f = QSim.frame(v, { x0, x1, y0: 0, y1: 0.48, xl: "검정통계량 Z", yl: "밀도" }); f.axes({ noGrid: true });
      const g = v.g, fill = (lo, hi, fn, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(f.X(lo), f.Y(0)); for (let i = 0; i <= 80; i++) { const x = lo + (hi - lo) * i / 80; g.lineTo(f.X(x), f.Y(fn(x))); } g.lineTo(f.X(hi), f.Y(0)); g.closePath(); g.fill(); };
      const h1 = (x) => phi(x - m);
      fill(za, x1, h1, "rgba(90,100,230,0.30)"); fill(x0, -za, h1, "rgba(90,100,230,0.30)");
      fill(za, x1, phi, "rgba(217,83,79,0.45)"); fill(x0, -za, phi, "rgba(217,83,79,0.45)");
      f.fn(phi, c.ink2, 2); f.fn(h1, c.main, 2.5);
      vline(f, za, 0, 0.48, c.warn); vline(f, -za, 0, 0.48, c.warn);
      f.text("H0 아래", 0, 0.43, c.ink2, "center"); if (m > 1.2) f.text("H1 아래", m, 0.43, c.main, "center");
      let n80 = 2; while (n80 < 100000 && 1 - Phi(za - d * Math.sqrt(n80)) + Phi(-za - d * Math.sqrt(n80)) < 0.8) n80++;
      S.out(`양측 z 검정, σ = 1, 효과 크기 δ = ${d.toFixed(2)}, n = ${n}, α = ${a}\n기각 경계 ±${za.toFixed(3)} (빨간 점선).  H1이 맞을 때 Z의 중심 δ√n = ${m.toFixed(3)}\n검정력 = P(기각 | H1) = ${pw.toFixed(4)} (파란 넓이),  제2종 오류 β = ${(1 - pw).toFixed(4)}\n검정력 0.8에 필요한 n: ${d > 0 ? n80 : "δ = 0이면 없음"}${simTxt ? "\n" + simTxt : ""}`);
    }
    S.$(".new").addEventListener("click", () => {
      const { d, n, za } = calc(), u = rng(Math.floor(Math.random() * 1e6) + 1); let rej = 0;
      for (let j = 0; j < 2000; j++) { let s = 0; for (let i = 0; i < n; i++) s += d + gauss(u); if (Math.abs(s / Math.sqrt(n)) > za) rej++; }
      simTxt = `모의실험 2000번 (가상 자료): 기각 ${rej}번 = ${pct(rej / 2000)}`; draw();
    });
    S.on(() => { simTxt = ""; draw(); }); QSim.redrawOn(draw); draw();
  })();

  /* 4. 회귀 잔차 그림 (응통10-04-01) */
  (() => {
    const S = QSim.card("lab-s10-resid"); if (!S) return;
    const [cvA, cvB] = S.$$("canvas"); let seed = 21;
    function gen() {
      const kind = S.val("kind"), n = S.val("n"), sg = S.val("sg"), u = rng(seed), X = [], Y = [];
      for (let i = 0; i < n; i++) {
        const x = 10 * u(); let y;
        if (kind === "lin") y = 2 + 0.8 * x + sg * gauss(u);
        else if (kind === "quad") y = 1 + 0.1 * (x - 2) ** 2 + sg * gauss(u);
        else if (kind === "het") y = 2 + 0.8 * x + sg * (0.15 + 0.25 * x) * gauss(u);
        else y = 2 + 0.8 * x + sg * gauss(u);
        X.push(x); Y.push(y);
      }
      if (kind === "out") { X.push(5); Y.push(2 + 0.8 * 5 + 8 * Math.max(sg, 0.5)); }
      return { kind, X, Y };
    }
    function draw() {
      const c = C(), { kind, X, Y } = gen(), r = ols(X, Y);
      const ylo = Math.min(...Y, 0) - 1, yhi = Math.max(...Y) + 1;
      const v1 = QSim.view(cvA, 0.5), f1 = QSim.frame(v1, { x0: 0, x1: 10, y0: ylo, y1: yhi, xl: "x", yl: "y" }); f1.axes();
      X.forEach((x, i) => f1.dot(x, Y[i], c.main, 3)); f1.fn((x) => r.b0 + r.b1 * x, c.warn, 2);
      const R = Math.max(...r.res.map(Math.abs)) * 1.15, flo = Math.min(...r.fit), fhi = Math.max(...r.fit);
      const v2 = QSim.view(cvB, 0.42), f2 = QSim.frame(v2, { x0: flo - 0.5, x1: fhi + 0.5, y0: -R, y1: R, xl: "적합값 ŷ", yl: "잔차 e" }); f2.axes();
      vline(f2, 0, 0, 0, c.ink3); f2.path([[flo - 0.5, 0], [fhi + 0.5, 0]], c.ink2, 1.5);
      f2.path([[flo - 0.5, 2 * r.s], [fhi + 0.5, 2 * r.s]], c.acc, 1.2, [4, 4]); f2.path([[flo - 0.5, -2 * r.s], [fhi + 0.5, -2 * r.s]], c.acc, 1.2, [4, 4]);
      r.fit.forEach((y, i) => f2.dot(y, r.res[i], c.main, 3));
      const big = r.res.filter((e) => Math.abs(e) > 2 * r.s).length;
      const name = { lin: "참 모형이 직선 (가정 만족)", quad: "참 모형이 곡선 (선형성 위반)", het: "x가 클수록 오차가 커짐 (등분산 위반)", out: "직선 + 이상점 하나 (x = 5)" }[kind];
      S.out(`${name}, 가상 자료 ${X.length}개\n적합 직선 ŷ = ${r.b0.toFixed(3)} + ${r.b1.toFixed(3)}x  (참 기울기 ${kind === "quad" ? "없음: 곡선" : "0.800"}),  R² = ${r.r2.toFixed(3)},  잔차 표준오차 s = ${r.s.toFixed(3)}\n|잔차| > 2s 인 점 ${big}개 (주황 점선 밖)`);
    }
    S.$(".new").addEventListener("click", () => { seed = (seed * 31 + 7) % 99991; draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 5. 지렛값과 Cook 거리: 점 하나를 옮겨 보기 (응통10-04-02) */
  (() => {
    const S = QSim.card("lab-s10-influence"); if (!S) return;
    const cv = S.$("canvas"), u = rng(77), BX = [], BY = [];
    for (let i = 0; i < 20; i++) { const x = 1 + 5 * u(); BX.push(x); BY.push(1 + 0.5 * x + 0.4 * gauss(u)); }
    const base = ols(BX, BY);
    function draw() {
      const c = C(), px = S.val("px"), py = S.val("py"), X = [...BX, px], Y = [...BY, py], r = ols(X, Y), n = X.length;
      const h = 1 / n + (px - r.mx) ** 2 / r.sxx, e = r.res[n - 1], mse = r.sse / (n - 2), D = (e * e / (2 * mse)) * h / (1 - h) ** 2;
      const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: 0, x1: 12, y0: -1, y1: 9, xl: "x", yl: "y" }); f.axes();
      BX.forEach((x, i) => f.dot(x, BY[i], c.main, 3.5));
      f.fn((x) => base.b0 + base.b1 * x, c.ink3, 1.5, [5, 4]); f.fn((x) => r.b0 + r.b1 * x, c.warn, 2.2);
      f.dot(px, py, D > 1 ? c.warn : D > 4 / n ? c.acc : c.ink, 6);
      S.out(`가상 자료 20개 + 옮기는 점 (${px.toFixed(1)}, ${py.toFixed(1)})\n기울기: 점 없이 ${base.b1.toFixed(3)} (회색 점선) → 점 포함 ${r.b1.toFixed(3)} (빨강)\n지렛값 h = ${h.toFixed(3)} (평균 2/n = ${(2 / n).toFixed(3)}, 2배 기준 ${(4 / n).toFixed(3)}),  잔차 ${e.toFixed(3)},  Cook 거리 D = ${D.toFixed(3)}${D > 1 ? "  → 영향이 매우 큼 (D > 1)" : D > 4 / n ? "  → 살펴볼 만함 (D > 4/n)" : ""}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 6. 붓스트랩 표준오차와 신뢰구간 (응통12-06-02) */
  (() => {
    const S = QSim.card("lab-s12-boot"); if (!S) return;
    const cv = S.$("canvas"), u0 = rng(2024);
    const DATA = Array.from({ length: 25 }, () => Math.round(Math.exp(5.6 + 0.6 * gauss(u0)))); /* 가상: 25가구의 월 지출(만 원) */
    let seed = 5;
    const STAT = {
      mean: { n: "평균", f: mean },
      med: { n: "중앙값", f: (a) => quant(sorted(a), 0.5) },
      trim: { n: "10% 절사평균", f: (a) => { const s = sorted(a), k = Math.floor(a.length * 0.1); return mean(s.slice(k, s.length - k)); } }
    };
    function draw() {
      const c = C(), st = STAT[S.val("stat")], B = S.val("B"), u = rng(seed), n = DATA.length;
      const est = st.f(DATA), boot = [];
      for (let b = 0; b < B; b++) { const s = Array.from({ length: n }, () => DATA[Math.floor(u() * n)]); boot.push(st.f(s)); }
      const bs = sorted(boot), se = sd(boot), lo = quant(bs, 0.025), hi = quant(bs, 0.975);
      const x0 = Math.min(bs[0], est - 4 * se), x1 = Math.max(bs[bs.length - 1], est + 4 * se), hh = hist(boot, x0, x1, 40), top = Math.max(...hh) * 1.2;
      const v = QSim.view(cv, 0.45), f = QSim.frame(v, { x0, x1, y0: 0, y1: top, xl: st.n + " (만 원)", yl: "밀도" }); f.axes({ noGrid: true });
      bars(f, v.g, hh, x0, x1, c.soft); vline(f, est, 0, top, c.ink, 2, null); vline(f, lo, 0, top, c.warn); vline(f, hi, 0, top, c.warn);
      const formula = sd(DATA) / Math.sqrt(n);
      S.out(`가상 자료: 25가구 월 지출, 표본 ${st.n} = ${est.toFixed(1)} (검은 선)\n붓스트랩 ${B}번: 표준오차 ${se.toFixed(2)}${S.val("stat") === "mean" ? ` (공식 s/√n = ${formula.toFixed(2)})` : ""}\n백분위수 95% 구간 [${lo.toFixed(1)}, ${hi.toFixed(1)}] (빨간 점선)`);
    }
    S.$(".new").addEventListener("click", () => { seed = (seed * 31 + 7) % 99991; draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 7. 층화추출의 배분: 단순임의, 비례, Neyman (응통8-03-02) */
  (() => {
    const S = QSim.card("lab-s8-strat"); if (!S) return;
    const cv = S.$("canvas");
    const NH = [6000, 3000, 1000], MH = [200, 350, 800];
    function draw() {
      const c = C(), n = S.val("n"), s3 = S.val("s3"), SH = [40, 80, s3], N = NH.reduce((a, b) => a + b, 0);
      const W = NH.map((x) => x / N), mu = W.reduce((a, w, h) => a + w * MH[h], 0);
      const Sall2 = W.reduce((a, w, h) => a + w * (SH[h] ** 2 + (MH[h] - mu) ** 2), 0);
      const vSRS = (1 - n / N) * Sall2 / n;
      const vStrat = (nh) => W.reduce((a, w, h) => a + w * w * (1 - nh[h] / NH[h]) * SH[h] ** 2 / nh[h], 0);
      const round = (raw) => { const r = raw.map((x) => Math.max(2, Math.round(x))); r[0] += n - r.reduce((a, b) => a + b, 0); return r; };
      const prop = round(W.map((w) => n * w)), tot = W.reduce((a, w, h) => a + w * SH[h], 0), ney = round(W.map((w, h) => n * w * SH[h] / tot));
      const se = [Math.sqrt(vSRS), Math.sqrt(vStrat(prop)), Math.sqrt(vStrat(ney))], lab = ["단순임의", "비례 배분", "Neyman 배분"];
      const v = QSim.view(cv, 0.42), top = Math.max(...se) * 1.25, f = QSim.frame(v, { x0: 0, x1: 3, y0: 0, y1: top, xl: "", yl: "평균 추정의 표준오차" }); f.axes({ noGrid: true });
      const g = v.g; [c.ink3, c.main, c.warn].forEach((col, i) => { g.fillStyle = col; g.fillRect(f.X(i + 0.2), f.Y(se[i]), f.X(i + 0.8) - f.X(i + 0.2), f.Y(0) - f.Y(se[i])); f.text(lab[i], i + 0.5, se[i] + top * 0.04, c.ink, "center"); f.text(se[i].toFixed(2), i + 0.5, se[i] / 2, c.card, "center"); });
      S.out(`가상 모집단: 층 1·2·3의 크기 ${NH.join(", ")}, 층 평균 ${MH.join(", ")}, 층 표준편차 ${SH.join(", ")}  (전체 평균 ${mu.toFixed(1)})\n표본 n = ${n}.  비례 배분 (${prop.join(", ")}),  Neyman 배분 (${ney.join(", ")})\n표준오차: 단순임의 ${se[0].toFixed(2)}, 비례 ${se[1].toFixed(2)}, Neyman ${se[2].toFixed(2)}  → 단순임의 대비 분산 비 ${(se[1] ** 2 / se[0] ** 2).toFixed(3)}, ${(se[2] ** 2 / se[0] ** 2).toFixed(3)}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 8. Markov 연쇄의 정상분포 (응통9-03-04) */
  (() => {
    const S = QSim.card("lab-s9-markov"); if (!S) return;
    const cv = S.$("canvas"), NAMES = ["맑음", "흐림", "비"];
    const P = () => { const a = S.val("a"), b = S.val("b"), cc = S.val("c"); return [[a, (1 - a) * 0.7, (1 - a) * 0.3], [(1 - b) / 2, b, (1 - b) / 2], [(1 - cc) * 0.3, (1 - cc) * 0.7, cc]]; };
    const step = (p, M) => [0, 1, 2].map((j) => p.reduce((s, pi, i) => s + pi * M[i][j], 0));
    function draw() {
      const c = C(), M = P(), T = S.val("t"), st = +S.val("s0");
      let p = [0, 0, 0]; p[st] = 1; const path = [p];
      for (let t = 0; t < 30; t++) { p = step(p, M); path.push(p); }
      let pi = [1 / 3, 1 / 3, 1 / 3]; for (let t = 0; t < 2000; t++) pi = step(pi, M);
      const v = QSim.view(cv, 0.45), f = QSim.frame(v, { x0: 0, x1: 30, y0: 0, y1: 1, xl: "단계 t", yl: "확률" }); f.axes();
      const cols = [c.acc, c.ink3, c.main];
      [0, 1, 2].forEach((j) => { f.path(path.map((q, t) => [t, q[j]]), cols[j], 2.2); f.path([[0, pi[j]], [30, pi[j]]], cols[j], 1, [4, 4]); });
      vline(f, T, 0, 1, c.warn, 1.5);
      const u = rng(9); let s = st; const cnt = [0, 0, 0];
      for (let t = 0; t < 5000; t++) { const r = u(); s = r < M[s][0] ? 0 : r < M[s][0] + M[s][1] ? 1 : 2; cnt[s]++; }
      const fmt = (q) => q.map((x, j) => `${NAMES[j]} ${x.toFixed(3)}`).join(", ");
      S.out(`전이행렬 행(오늘 → 내일): ${M.map((r, i) => NAMES[i] + " [" + r.map((x) => x.toFixed(2)).join(" ") + "]").join("  ")}\n${NAMES[st]}에서 출발해 ${T}단계 뒤 분포: ${fmt(path[T])}\n정상분포 π: ${fmt(pi)} (점선)\n한 번 5000일 걸어 본 비율 (가상): ${fmt(cnt.map((x) => x / 5000))}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 9. 베타 사전분포와 이항 자료의 사후분포 (응통21-01-01) */
  (() => {
    const S = QSim.card("lab-s21-beta"); if (!S) return;
    const cv = S.$("canvas"), G = 600, xs = Array.from({ length: G + 1 }, (_, i) => i / G);
    const norm = (f) => { const v = xs.map((x) => (x <= 0 || x >= 1 ? 0 : f(x))); const s = v.reduce((a, b) => a + b, 0) / G; return v.map((y) => y / s); };
    const lbeta = (a, b) => (x) => Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x));
    function draw() {
      const c = C(), a = S.val("a"), b = S.val("b"), n = S.val("n"), k = Math.min(S.val("k"), n);
      const pr = norm(lbeta(a, b)), lk = norm(lbeta(k + 1, n - k + 1)), po = norm(lbeta(a + k, b + n - k));
      const top = Math.min(Math.max(...pr, ...lk, ...po) * 1.1, 30);
      const v = QSim.view(cv, 0.45), f = QSim.frame(v, { x0: 0, x1: 1, y0: 0, y1: top, xl: "p", yl: "밀도" }); f.axes();
      const line = (ys, col, w, dash) => f.path(xs.map((x, i) => [x, Math.min(ys[i], top)]), col, w, dash);
      line(pr, c.ink3, 2, [5, 4]); line(lk, c.acc, 2); line(po, c.main, 2.8);
      let cum = 0, lo = 0, hi = 1, med = 0.5; po.forEach((y, i) => { const prev = cum; cum += y / G; if (prev < 0.025 && cum >= 0.025) lo = xs[i]; if (prev < 0.5 && cum >= 0.5) med = xs[i]; if (prev < 0.975 && cum >= 0.975) hi = xs[i]; });
      vline(f, lo, 0, top, c.main, 1, [3, 3]); vline(f, hi, 0, top, c.main, 1, [3, 3]);
      const pm = (a + k) / (a + b + n), w = (a + b) / (a + b + n);
      S.out(`사전분포 Beta(${a}, ${b}) (회색 점선, 평균 ${(a / (a + b)).toFixed(3)}),  자료 n = ${n}번 중 성공 ${k}번 (주황: 가능도, 표본비율 ${(n ? k / n : 0).toFixed(3)})\n사후분포 Beta(${a + k}, ${b + n - k}) (파랑): 평균 ${pm.toFixed(3)} = ${w.toFixed(2)}×사전 평균 + ${(1 - w).toFixed(2)}×표본비율\n95% 신용구간 약 [${lo.toFixed(3)}, ${hi.toFixed(3)}],  사후 중앙값 약 ${med.toFixed(3)}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 10. AR(1) 과정과 자기상관함수 (응통20-02-02) */
  (() => {
    const S = QSim.card("lab-s20-ar"); if (!S) return;
    const [cvA, cvB] = S.$$("canvas"); let seed = 13;
    function draw() {
      const c = C(), ph = S.val("phi"), n = S.val("n"), u = rng(seed), x = [];
      let prev = ph === 1 ? 0 : gauss(u) / Math.sqrt(1 - ph * ph);
      for (let t = 0; t < n; t++) { prev = ph * prev + gauss(u); x.push(prev); }
      const R = Math.max(3, ...x.map(Math.abs)) * 1.1;
      const v1 = QSim.view(cvA, 0.35), f1 = QSim.frame(v1, { x0: 0, x1: n, y0: -R, y1: R, xl: "t", yl: "x_t" }); f1.axes({ noGrid: true });
      f1.path(x.map((y, t) => [t, y]), c.main, 1.4);
      const m = mean(x), c0 = x.reduce((s, y) => s + (y - m) ** 2, 0), K = 20, acf = [];
      for (let k = 0; k <= K; k++) { let s = 0; for (let t = k; t < n; t++) s += (x[t] - m) * (x[t - k] - m); acf.push(s / c0); }
      const v2 = QSim.view(cvB, 0.35), f2 = QSim.frame(v2, { x0: -0.5, x1: K + 0.5, y0: -1, y1: 1, xl: "시차 k", yl: "자기상관" }); f2.axes({ noGrid: true });
      const band = 2 / Math.sqrt(n); f2.path([[-0.5, band], [K + 0.5, band]], c.acc, 1, [4, 4]); f2.path([[-0.5, -band], [K + 0.5, -band]], c.acc, 1, [4, 4]);
      acf.forEach((r, k) => f2.path([[k, 0], [k, r]], c.main, 4));
      f2.fn((k) => (k < 0 ? NaN : ph ** k), c.warn, 1.8, [5, 3]);
      S.out(`x_t = ${ph.toFixed(2)}·x_(t−1) + e_t,  e_t ~ N(0, 1) (가상), 길이 ${n}${ph === 1 ? "  → φ = 1: 랜덤워크 (정상 아님)" : ""}\n표본 자기상관 r1 = ${acf[1].toFixed(3)}, r2 = ${acf[2].toFixed(3)}, r5 = ${acf[5].toFixed(3)}   이론 φ^k: ${ph.toFixed(3)}, ${(ph ** 2).toFixed(3)}, ${(ph ** 5).toFixed(3)} (빨간 점선)\n주황 점선 ±2/√n = ±${band.toFixed(3)}: 백색잡음이면 막대 대부분이 이 안에 든다`);
    }
    S.$(".new").addEventListener("click", () => { seed = (seed * 31 + 7) % 99991; draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 11. Metropolis 알고리즘: 제안 폭과 수용률 (응통15-05-01) */
  (() => {
    const S = QSim.card("lab-s15-mh"); if (!S) return;
    const [cvA, cvB] = S.$$("canvas"); let seed = 31;
    const target = (x) => 0.3 * phi((x + 2) / 0.7) / 0.7 + 0.7 * phi((x - 2) / 1) / 1; /* 목표: 정규분포 두 개를 섞은 것 */
    function draw() {
      const c = C(), w = S.val("w"), N = S.val("N"), u = rng(seed), xs = []; let x = 0, acc = 0;
      for (let i = 0; i < N; i++) { const y = x + w * gauss(u); if (u() < target(y) / target(x)) { x = y; acc++; } xs.push(x); }
      const v1 = QSim.view(cvA, 0.3), f1 = QSim.frame(v1, { x0: 0, x1: N, y0: -6, y1: 7, xl: "반복", yl: "x" }); f1.axes({ noGrid: true });
      f1.path(xs.map((y, i) => [i, y]), c.main, 1);
      const h = hist(xs, -6, 7, 52), top = Math.max(...h, 0.3) * 1.15;
      const v2 = QSim.view(cvB, 0.4), f2 = QSim.frame(v2, { x0: -6, x1: 7, y0: 0, y1: top, xl: "x", yl: "밀도" }); f2.axes({ noGrid: true });
      bars(f2, v2.g, h, -6, 7, c.soft); f2.fn(target, c.warn, 2.2);
      const m = mean(xs), left = xs.filter((y) => y < 0).length / N;
      S.out(`목표분포: 0.3·N(−2, 0.7²) + 0.7·N(2, 1²) (빨강, 평균 0.800, x < 0일 확률 약 0.315)\n제안 폭 ${w.toFixed(2)}, 반복 ${N}번: 수용률 ${pct(acc / N)}\n표본 평균 ${m.toFixed(3)},  x < 0 비율 ${left.toFixed(3)}`);
    }
    S.$(".new").addEventListener("click", () => { seed = (seed * 31 + 7) % 99991; draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
