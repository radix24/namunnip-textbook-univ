/* 응용통계 실습 카드 묶음 4: 모의실험이 이해를 크게 돕는 절 (모든 자료는 가상: 컴퓨터가 만든 난수)
   이변량 정규의 조건부분포, MLE의 점근 정규성, 집락추출 설계 효과, 포아송 과정, 랜덤워크에서 브라운 운동으로,
   순열 검정, 중요도 표집, 국소 회귀 span, k-평균 */
(() => {
  "use strict";
  const C = () => QSim.col();
  /* mulberry32: 정수 연산만 써서 빠른 시드 난수 */
  const rng = (seed) => () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return (((t ^ (t >>> 14)) >>> 0) + 0.5) / 4294967296; };
  const gauss = (r) => Math.sqrt(-2 * Math.log(r())) * Math.cos(2 * Math.PI * r());
  const phi = (z) => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
  const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  const vari = (a) => { const m = mean(a); return a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1); };
  const sd = (a) => Math.sqrt(vari(a));
  const hist = (xs, lo, hi, k) => { const w = (hi - lo) / k, c = Array(k).fill(0); xs.forEach((x) => { const i = Math.floor((x - lo) / w); if (i >= 0 && i < k) c[i]++; }); return c.map((n) => n / (xs.length * w)); };
  const bars = (f, g, h, lo, hi, col, alpha = 1) => { const k = h.length, w = (hi - lo) / k; g.save(); g.globalAlpha = alpha; g.fillStyle = col; h.forEach((d, i) => { const x0 = f.X(lo + i * w), x1 = f.X(lo + (i + 1) * w); g.fillRect(x0, f.Y(d), Math.max(1, x1 - x0 - 1), f.Y(0) - f.Y(d)); }); g.restore(); };
  const vline = (f, x, y0, y1, col, w = 1.5, dash = [5, 4]) => f.path([[x, y0], [x, y1]], col, w, dash);
  const pct = (x) => (100 * x).toFixed(1) + "%";
  const newSeed = (s) => (s * 31 + 7) % 99991;
  /* 로그 감마 (Lanczos) 와 t 분포 양측 p값 (심프슨 적분) */
  const lgamma = (x) => { const g = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5]; let y = x, t = x + 5.5; t -= (x + 0.5) * Math.log(t); let s = 1.000000000190015; for (let j = 0; j < 6; j++) s += g[j] / ++y; return -t + Math.log(2.5066282746310005 * s / x); };
  const pt2 = (t, v) => { const a = Math.min(Math.abs(t), 60), k = Math.exp(lgamma((v + 1) / 2) - lgamma(v / 2)) / Math.sqrt(v * Math.PI), f = (x) => k * (1 + x * x / v) ** (-(v + 1) / 2), N = 2000, h = a / N; let s = f(0) + f(a); for (let i = 1; i < N; i++) s += (i % 2 ? 4 : 2) * f(i * h); return Math.max(0, 1 - 2 * s * h / 3); };
  /* 표준정규 위꼬리 확률 Q(c) = P(Z > c): 꼬리까지 정확하게 (심프슨 적분) */
  const Qn = (c) => { const a = c, b = c + 12, N = 4000, h = (b - a) / N; let s = phi(a) + phi(b); for (let i = 1; i < N; i++) s += (i % 2 ? 4 : 2) * phi(a + i * h); return s * h / 3; };

  /* 1. 이변량 정규분포: 조건부분포와 평균으로의 회귀 (응통6-05-03) */
  (() => {
    const S = QSim.card("lab-s6-mvn"); if (!S) return;
    const [cvA, cvB] = S.$$("canvas"); let seed = 5;
    const MU = 172, SG = 6, N = 4000, HW = 1.5, LO = 148, HI = 196;
    function draw() {
      const c = C(), rho = S.val("rho"), x0 = S.val("x0"), u = rng(seed), P = [];
      for (let i = 0; i < N; i++) { const z1 = gauss(u), z2 = gauss(u); P.push([MU + SG * z1, MU + SG * (rho * z1 + Math.sqrt(1 - rho * rho) * z2)]); }
      const v1 = QSim.view(cvA, 0.8), f1 = QSim.frame(v1, { x0: LO, x1: HI, y0: LO, y1: HI, equal: true, xl: "아버지 X₁", yl: "아들 X₂" });
      v1.g.fillStyle = "rgba(242,179,61,0.28)"; v1.g.fillRect(f1.X(x0 - HW), f1.Y(HI), f1.X(x0 + HW) - f1.X(x0 - HW), f1.Y(LO) - f1.Y(HI));
      f1.axes();
      const sel = [];
      P.forEach(([a, b]) => { const inB = Math.abs(a - x0) < HW; if (inB) sel.push(b); if (a > LO && a < HI && b > LO && b < HI) f1.dot(a, b, inB ? c.warn : c.soft, inB ? 2.2 : 1.6); });
      f1.path([[LO, LO], [HI, HI]], c.ink3, 1.2, [5, 4]);
      f1.path([[LO, MU + rho * (LO - MU)], [HI, MU + rho * (HI - MU)]], c.main, 2.2);
      const mc = MU + rho * (x0 - MU), sc = SG * Math.sqrt(1 - rho * rho);
      const v2 = QSim.view(cvB, 0.42), h = sel.length ? hist(sel, LO, HI, 24) : Array(24).fill(0), top = Math.max(...h, phi(0) / sc) * 1.15;
      const f2 = QSim.frame(v2, { x0: LO, x1: HI, y0: 0, y1: top, xl: "", yl: "아들 키의 밀도" }); f2.axes();
      bars(f2, v2.g, h, LO, HI, c.warn, 0.45);
      f2.fn((y) => phi((y - MU) / SG) / SG, c.ink3, 1.6, [5, 4]);
      f2.fn((y) => phi((y - mc) / sc) / sc, c.main, 2.2);
      vline(f2, x0, 0, top, c.acc, 1.4);
      const ok = sel.length >= 5;
      S.out(`가상 자료 ${N}쌍: 평균 ${MU}, 표준편차 ${SG}, 상관 ρ = ${rho.toFixed(2)}.  파란 직선은 E(X₂ | X₁) = ${MU} + ρ(X₁ − ${MU}), 회색 점선은 X₂ = X₁\n아버지 키 ${x0} ± ${HW} 띠(주황) 안의 점 ${sel.length}개: 아들 키 평균 ${ok ? mean(sel).toFixed(2) : "-"}, 표준편차 ${ok ? sd(sel).toFixed(2) : "-"}\n이론 조건부분포 N(${mc.toFixed(2)}, ${sc.toFixed(2)}²) (아래 파란 곡선),  주변분포 N(${MU}, ${SG}²) (회색 점선),  아버지와의 차이 ${(x0 - MU).toFixed(0)} → 아들 기대값의 차이 ${(mc - MU).toFixed(2)}`);
    }
    S.$(".new").addEventListener("click", () => { seed = newSeed(seed); draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. MLE의 표본분포와 점근 정규 근사 (응통7-03-02) */
  (() => {
    const S = QSim.card("lab-s7-asymp"); if (!S) return;
    const cv = S.$("canvas"); let seed = 13;
    const LAM = 0.4, R = 4000;
    function draw() {
      const c = C(), n = S.val("n"), u = rng(seed), est = [], z = 1.96, rn = Math.sqrt(n);
      let cw = 0, cl = 0;
      for (let r = 0; r < R; r++) {
        let s = 0; for (let i = 0; i < n; i++) s -= Math.log(u()) / LAM;
        const lh = n / s; est.push(lh);
        if (Math.abs(lh - LAM) <= z * lh / rn) cw++;
        if (Math.abs(1 / lh - 1 / LAM) <= z / (lh * rn)) cl++; /* 평균 μ = 1/λ의 Wald 구간 x̄ ± 1.96x̄/√n */
      }
      const se = LAM / rn, lo = Math.max(0, LAM - 4.5 * se), hi = LAM + 6 * se;
      const h = hist(est, lo, hi, 50), top = Math.max(...h, phi(0) / se) * 1.15;
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: lo, x1: hi, y0: 0, y1: top, xl: "λ̂", yl: "밀도" }); f.axes();
      bars(f, v.g, h, lo, hi, c.soft);
      f.fn((x) => phi((x - LAM) / se) / se, c.warn, 2.2, null, 400);
      vline(f, LAM, 0, top, c.ink, 1.4, null);
      const m = mean(est), s = sd(est), sk = est.reduce((a, x) => a + ((x - m) / s) ** 3, 0) / R;
      S.out(`지수분포(참값 λ = ${LAM}, 세로선)에서 크기 n = ${n}인 표본 ${R}개 (가상).  MLE λ̂ = 1/x̄의 히스토그램과 점근 근사 N(λ, λ²/n) (빨강)\nλ̂의 평균 ${m.toFixed(4)} (정확한 값 nλ/(n − 1) = ${(n * LAM / (n - 1)).toFixed(4)}),  표준편차 ${s.toFixed(4)} (점근 근사 λ/√n = ${se.toFixed(4)}),  왜도 ${sk.toFixed(2)} (정규는 0)\n근사 95% Wald 구간이 참값을 덮은 비율: λ에 대해 λ̂ ± 1.96λ̂/√n → ${pct(cw / R)},  같은 자료로 평균 μ = 1/λ에 대해 x̄ ± 1.96x̄/√n → ${pct(cl / R)}`);
    }
    S.$(".new").addEventListener("click", () => { seed = newSeed(seed); draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 집락추출의 설계 효과 (응통8-05-01) */
  (() => {
    const S = QSim.card("lab-s8-cluster"); if (!S) return;
    const cv = S.$("canvas"); let seed = 29;
    const TOT = 600, R = 2000;
    function draw() {
      const c = C(), M = +S.val("M"), rho = S.val("rho"), nc = TOT / M, u = rng(seed), cm = [], sr = [];
      const sa = Math.sqrt(rho), se = Math.sqrt((1 - rho) / M);
      for (let r = 0; r < R; r++) {
        let s = 0; for (let i = 0; i < nc; i++) s += sa * gauss(u) + se * gauss(u); /* 집락 효과 + 집락 안 M개 오차의 평균 */
        cm.push(s / nc); sr.push(gauss(u) / Math.sqrt(TOT)); /* 독립인 600개 단위의 평균 */
      }
      const vC = vari(cm), vS = vari(sr), dT = 1 + (M - 1) * rho, L = 4.2 * Math.sqrt(Math.max(dT, 1) / TOT);
      const hC = hist(cm, -L, L, 50), hS = hist(sr, -L, L, 50), top = Math.max(...hC, ...hS) * 1.15;
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: -L, x1: L, y0: 0, y1: top, xl: "", yl: "밀도" }); f.axes();
      bars(f, v.g, hS, -L, L, c.ink3, 0.45); bars(f, v.g, hC, -L, L, c.main, 0.45);
      const d = vC * TOT; /* 단순임의추출의 분산은 정확히 1/TOT */
      S.out(`조사 단위 ${TOT}개 = 집락 ${nc}개 × 집락 크기 M = ${M},  집락 내 상관 ρ = ${rho.toFixed(2)} (가상, 단위 하나의 분산 1),  반복 ${R}번\n회색: 단위 ${TOT}개를 따로따로 뽑은 단순임의추출 평균, 분산 ${vS.toExponential(3)} (이론 1/${TOT} = ${(1 / TOT).toExponential(3)})\n파랑: 집락추출 평균, 분산 ${vC.toExponential(3)}  →  설계 효과 = 분산 ÷ (1/${TOT}) = ${d.toFixed(2)} (이론 1 + (M − 1)ρ = ${dT.toFixed(2)})\n유효 표본 크기 ${TOT}/deff ≈ ${Math.round(TOT / d)},  95% 오차 한계: 단순임의추출 ±${(1.96 * Math.sqrt(vS)).toFixed(3)}, 집락추출 ±${(1.96 * Math.sqrt(vC)).toFixed(3)} (σ 단위)`);
    }
    S.$(".new").addEventListener("click", () => { seed = newSeed(seed); draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 포아송 과정: 계단 경로, 지수 도착 간격, 구간별 사건 수 (응통9-05-01) */
  (() => {
    const S = QSim.card("lab-s9-poisson"); if (!S) return;
    const [cvP, cvH] = S.$$("canvas"); let seed = 37;
    const T = 10, K = 5000;
    function draw() {
      const c = C(), lam = S.val("lam"), u = rng(seed);
      const arr = []; let t = 0; while (true) { t -= Math.log(u()) / lam; if (t > T) break; arr.push(t); }
      const gaps = [], times = []; let s = 0; for (let i = 0; i < K; i++) { const g = -Math.log(u()) / lam; gaps.push(g); s += g; times.push(s); }
      const units = Math.floor(s), cnt = Array(units).fill(0); times.forEach((x) => { const i = Math.floor(x); if (i < units) cnt[i]++; });
      const yTop = Math.max(arr.length, lam * T) * 1.15 + 1;
      const v1 = QSim.view(cvP, 0.42), f1 = QSim.frame(v1, { x0: 0, x1: T, y0: 0, y1: yTop, xl: "시각 t", yl: "N(t)" }); f1.axes();
      f1.path([[0, 0], [T, lam * T]], c.ink3, 1.2, [5, 4]);
      const st = [[0, 0]]; arr.forEach((a, i) => { st.push([a, i]); st.push([a, i + 1]); }); st.push([T, arr.length]); f1.path(st, c.main, 2.2);
      arr.forEach((a) => f1.path([[a, 0], [a, yTop * 0.04]], c.warn, 1.5));
      const hi = 5 / lam, h = hist(gaps, 0, hi, 40), top = Math.max(...h, lam) * 1.12;
      const v2 = QSim.view(cvH, 0.42), f2 = QSim.frame(v2, { x0: 0, x1: hi, y0: 0, y1: top, xl: "도착 간격", yl: "밀도" }); f2.axes();
      bars(f2, v2.g, h, 0, hi, c.soft); f2.fn((x) => lam * Math.exp(-lam * x), c.warn, 2.2);
      const pOver = gaps.filter((g) => g > 1).length / K;
      S.out(`비율 λ = ${lam.toFixed(1)} (단위 시간당 평균 ${lam.toFixed(1)}번), 가상 자료\n위: 시각 ${T}까지의 경로 한 개. 사건 ${arr.length}번 (기댓값 λ·${T} = ${(lam * T).toFixed(0)}, 회색 점선은 λt)\n아래: 도착 간격 ${K}개. 평균 ${mean(gaps).toFixed(3)} (이론 1/λ = ${(1 / lam).toFixed(3)}),  P(간격 > 1) ${pOver.toFixed(3)} (이론 e^(−λ) = ${Math.exp(-lam).toFixed(3)})\n같은 자료를 길이 1인 구간 ${units}개로 나눠 센 사건 수: 평균 ${mean(cnt).toFixed(3)}, 분산 ${vari(cnt).toFixed(3)} (포아송이면 둘 다 λ)`);
    }
    S.$(".new").addEventListener("click", () => { seed = newSeed(seed); draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 5. 랜덤워크의 극한: 걸음 크기를 어떻게 줄여야 하나 (응통9-06-01) */
  (() => {
    const S = QSim.card("lab-s9-bm"); if (!S) return;
    const [cvP, cvH] = S.$$("canvas"); let seed = 43;
    const R = 1000, NP = 12, Y = 3.5;
    function draw() {
      const c = C(), dt = +S.val("dt"), sc = S.val("sc"), K = Math.round(1 / dt), u = rng(seed);
      const dx = sc === "sqrt" ? Math.sqrt(dt) : sc === "lin" ? dt : 1;
      const end = [], half = [], paths = [], every = Math.max(1, Math.floor(K / 400));
      for (let r = 0; r < R; r++) {
        let x = 0; const p = r < NP ? [[0, 0]] : null;
        for (let k = 1; k <= K; k++) { x += u() < 0.5 ? dx : -dx; if (k === Math.round(K / 2)) half.push(x); if (p && (k % every === 0 || k === K)) p.push([k * dt, Math.max(-Y, Math.min(Y, x))]); }
        end.push(x); if (p) paths.push(p);
      }
      const v1 = QSim.view(cvP, 0.5), f1 = QSim.frame(v1, { x0: 0, x1: 1, y0: -Y, y1: Y, xl: "시각 t", yl: "X(t)" }); f1.axes();
      const cols = [c.main, c.warn, c.acc, c.ink2];
      paths.forEach((p, i) => f1.path(p, cols[i % 4], 1.2));
      /* X(1)은 간격 2Δx인 격자 위의 값만 가지므로, 계급 폭을 격자 간격의 배수로 하고 격자점을 계급 가운데에 둔다 */
      const st = 2 * dx, w = st * Math.max(1, Math.round(0.2 / st)), off = (K % 2) * dx, mB = Math.ceil(4 / w), hlo = off - (mB + 0.5) * w, hhi = off + (mB + 0.5) * w;
      const h = hist(end, hlo, hhi, 2 * mB + 1), top = Math.max(0.5, Math.min(Math.max(...h) * 1.1, 3));
      const v2 = QSim.view(cvH, 0.38), f2 = QSim.frame(v2, { x0: -4, x1: 4, y0: 0, y1: top, xl: "X(1)", yl: "밀도" }); f2.axes();
      v2.g.save(); v2.g.beginPath(); v2.g.rect(f2.X(-4), 0, f2.X(4) - f2.X(-4), v2.H); v2.g.clip();
      bars(f2, v2.g, h.map((d) => Math.min(d, top)), hlo, hhi, c.soft); v2.g.restore(); f2.fn((x) => phi(x), c.warn, 2);
      const vE = vari(end), mh = mean(half), me = mean(end);
      let cov = 0; for (let i = 0; i < R; i++) cov += (half[i] - mh) * (end[i] - me); cov /= R - 1;
      const th = dx * dx / dt, out = end.filter((x) => Math.abs(x) > 4).length;
      S.out(`Δt = ${dt} (시각 1까지 ${K}걸음),  한 걸음 ±Δx, Δx = ${sc === "sqrt" ? "√Δt" : sc === "lin" ? "Δt" : "1"} = ${dx.toPrecision(3)},  경로 ${R}개 (가상, 위 그림은 그중 ${NP}개)\nX(1)의 분산 ${vE.toPrecision(4)} (이론 (Δx)²/Δt = ${th.toPrecision(4)}, 브라운 운동이면 1)${out ? `,  그림 범위 ±4 밖 ${out}개` : ""}\nCov(X(0.5), X(1)) ${cov.toPrecision(4)} (이론 0.5 × (Δx)²/Δt = ${(0.5 * th).toPrecision(4)}, 브라운 운동이면 min(0.5, 1) = 0.5)`);
    }
    S.$(".new").addEventListener("click", () => { seed = newSeed(seed); draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 6. 순열 검정: 이름표를 섞어 만든 귀무분포 (응통12-06-01) */
  (() => {
    const S = QSim.card("lab-s12-perm"); if (!S) return;
    const [cvD, cvH] = S.$$("canvas"); let seed = 53;
    const m = 8, B = 5000;
    function draw() {
      const c = C(), d = S.val("d"), pop = S.val("pop"), u = rng(seed);
      const e = () => (pop === "exp" ? -Math.log(u()) - 1 : gauss(u));
      const x = Array.from({ length: m }, e), y = Array.from({ length: m }, () => e() + d), z = [...x, ...y];
      const Tobs = mean(y) - mean(x), sum = z.reduce((a, b) => a + b, 0), up = rng(seed + 101), Tp = [];
      for (let b = 0; b < B; b++) { const w = [...z]; let sy = 0; for (let i = 0; i < m; i++) { const j = i + Math.floor(up() * (2 * m - i)); [w[i], w[j]] = [w[j], w[i]]; sy += w[i]; } Tp.push(sy / m - (sum - sy) / m); }
      const p = Tp.filter((t) => Math.abs(t) >= Math.abs(Tobs) - 1e-9).length / B;
      const sp = Math.sqrt(((m - 1) * vari(x) + (m - 1) * vari(y)) / (2 * m - 2)), tv = Tobs / (sp * Math.sqrt(2 / m)), pT = pt2(tv, 2 * m - 2);
      const hi = Math.max(...z) + 0.3, lo = Math.min(...z) - 0.3 - 0.22 * (hi - Math.min(...z)); /* 왼쪽에 집단 이름 자리 */
      const v1 = QSim.view(cvD, 0.28), f1 = QSim.frame(v1, { x0: lo, x1: hi, y0: 0.4, y1: 2.6, xl: "", yl: "" }); f1.axes({ noGrid: true });
      x.forEach((t) => f1.dot(t, 1, c.ink2, 4)); y.forEach((t) => f1.dot(t, 2, c.warn, 4));
      f1.path([[mean(x), 0.65], [mean(x), 1.35]], c.ink2, 2.5); f1.path([[mean(y), 1.65], [mean(y), 2.35]], c.warn, 2.5);
      f1.text("대조", lo, 0.9, c.ink2); f1.text("처리", lo, 1.9, c.warn);
      const L = Math.max(Math.abs(Tobs) * 1.25, 4 * sd(Tp)), h = hist(Tp, -L, L, 41), top = Math.max(...h) * 1.15;
      const v2 = QSim.view(cvH, 0.42), f2 = QSim.frame(v2, { x0: -L, x1: L, y0: 0, y1: top, xl: "", yl: "" }); f2.axes();
      const g = v2.g, w = 2 * L / 41;
      h.forEach((dd, i) => { const a = -L + i * w, mid = a + w / 2; g.fillStyle = Math.abs(mid) >= Math.abs(Tobs) ? "rgba(217,83,79,0.75)" : c.soft; g.fillRect(f2.X(a), f2.Y(dd), Math.max(1, f2.X(a + w) - f2.X(a) - 1), f2.Y(0) - f2.Y(dd)); });
      vline(f2, Tobs, 0, top, c.ink, 1.6, null); vline(f2, -Tobs, 0, top, c.ink3, 1.2);
      S.out(`가상 자료: 대조 ${m}개, 처리 ${m}개 (모집단 ${pop === "exp" ? "지수분포에서 1을 뺀 오른쪽 꼬리 분포" : "표준정규"}, 처리군에만 d = ${d.toFixed(1)}을 더함)\n관측 평균 차 T = ${Tobs.toFixed(3)} (검은 세로선).  이름표를 ${B}번 섞어 구한 평균 차의 분포 (아래), 빨간 막대는 |T| 이상인 곳\n순열 p값 (양측) ${p.toFixed(4)},  비교: 합동 t 검정 t = ${tv.toFixed(3)}, p값 ${pT.toFixed(4)} (자유도 ${2 * m - 2})\n가능한 배치는 C(16, 8) = 12870가지. ${B}번 섞기는 그 무작위 근사입니다.`);
    }
    S.$(".new").addEventListener("click", () => { seed = newSeed(seed); draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 7. 드문 사건의 확률: 보통 몬테카를로와 중요도 표집 (응통15-04-03) */
  (() => {
    const S = QSim.card("lab-s15-is"); if (!S) return;
    const cv = S.$("canvas"); let seed = 71;
    const RP = 200, XM = 3;
    function draw() {
      const c = C(), cc = S.val("c"), n = +S.val("n"), u = rng(seed), p = Qn(cc), nv = [], iv = [];
      let spare = NaN; const g2 = () => { if (spare === spare) { const t = spare; spare = NaN; return t; } const a = Math.sqrt(-2 * Math.log(u())), b = 2 * Math.PI * u(); spare = a * Math.sin(b); return a * Math.cos(b); }; /* 박스-뮬러의 두 값을 모두 씀 */
      for (let r = 0; r < RP; r++) {
        let k = 0; for (let i = 0; i < n; i++) if (g2() > cc) k++;
        nv.push(k / n);
        let s = 0; for (let i = 0; i < n; i++) { const z = g2(); if (z > 0) s += Math.exp(-cc * (cc + z) + cc * cc / 2); }
        iv.push(s / n);
      }
      const v = QSim.view(cv, 0.42), f = QSim.frame(v, { x0: -0.75, x1: XM, y0: -0.6, y1: 2.6, xl: "", yl: "" }); f.axes({ noGrid: true });
      vline(f, 1, 0, 2.6, c.ink, 1.4, null);
      for (let t = 0; t <= XM; t++) f.text(t + "", t, -0.45, c.ink3, "center");
      f.text("추정값 ÷ 참값", XM, 2.4, c.ink3, "right");
      const ju = rng(5);
      nv.forEach((t) => f.dot(Math.min(t / p, XM), 1.8 + 0.4 * (ju() - 0.5), c.ink3, 2.4));
      iv.forEach((t) => f.dot(Math.min(t / p, XM), 0.7 + 0.4 * (ju() - 0.5), c.main, 2.4));
      f.text("보통", -0.72, 1.72, c.ink2); f.text("중요도", -0.72, 0.62, c.main);
      const rN = sd(nv) / p, rI = sd(iv) / p, rTh = Math.sqrt((1 - p) / (n * p)), zero = nv.filter((t) => t === 0).length, over = nv.filter((t) => t / p > XM).length;
      S.out(`P(Z > ${cc.toFixed(1)}) 참값 ${p.toExponential(3)} (세로선 = 1),  표본 n = ${n},  각 방법으로 ${RP}번 추정 (가상)\n회색, 보통 몬테카를로 (Z를 n개 뽑아 c를 넘는 비율): 상대 표준편차 ${pct(rN)} (이론 √((1 − p)/(np)) = ${pct(rTh)}),  추정값 0인 경우 ${zero}번${over ? `, ${XM}배를 넘어 오른쪽 끝에 붙은 점 ${over}개` : ""}\n파랑, 중요도 표집 (N(c, 1)에서 n개, 가중치 e^(−cy + c²/2)): 상대 표준편차 ${pct(rI)}\n보통 방법으로 같은 정확도를 얻으려면 표본이 약 ${Math.round((rTh / rI) ** 2).toLocaleString("ko-KR")}배 필요합니다.`);
    }
    S.$(".new").addEventListener("click", () => { seed = newSeed(seed); draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 8. 국소 회귀(loess)의 span: 치우침과 분산 (응통17-05-03) */
  (() => {
    const S = QSim.card("lab-s17-loess"); if (!S) return;
    const [cvF, cvE] = S.$$("canvas"); let seed = 83;
    const n = 120, truth = (x) => Math.sin(x) + 0.2 * x, GX = Array.from({ length: 101 }, (_, i) => i / 10);
    let X = [], Yv = [];
    const gen = () => { /* x 순서로 정렬해 두면 가까운 q개는 언제나 연속한 구간이 된다 */
      const u = rng(seed), P = []; for (let i = 0; i < n; i++) { const x = 10 * u(); P.push([x, truth(x) + 0.4 * gauss(u)]); }
      P.sort((a, b) => a[0] - b[0]); X = P.map((p) => p[0]); Yv = P.map((p) => p[1]);
    };
    const loess = (x0, span, deg) => {
      const q = Math.min(n, Math.max(deg + 2, Math.ceil(span * n - 1e-9)));
      let lo = 0, hi = n; while (lo < hi) { const m = (lo + hi) >> 1; if (X[m] < x0) lo = m + 1; else hi = m; }
      let L = lo - 1, R = lo, hh = 0; /* 구간 [L+1, R-1]을 가까운 쪽으로 넓힘 */
      for (let k = 0; k < q; k++) { const dl = L >= 0 ? x0 - X[L] : Infinity, dr = R < n ? X[R] - x0 : Infinity; if (dl <= dr) { hh = dl; L--; } else { hh = dr; R++; } }
      hh *= 1.0001;
      let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, t0 = 0, t1 = 0, t2 = 0;
      for (let i = L + 1; i < R; i++) { const t = X[i] - x0, r = Math.abs(t) / hh, w = (1 - r * r * r) ** 3, y = Yv[i]; s0 += w; s1 += w * t; s2 += w * t * t; s3 += w * t ** 3; s4 += w * t ** 4; t0 += w * y; t1 += w * t * y; t2 += w * t * t * y; }
      if (deg === 1) { const D = s0 * s2 - s1 * s1; return (t0 * s2 - s1 * t1) / D; }
      /* 3×3 정규방정식을 크라메르 공식으로: 절편만 필요 */
      const det = (a, b, c, d, e, f, g, h, i) => a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
      return det(t0, s1, s2, t1, s2, s3, t2, s3, s4) / det(s0, s1, s2, s1, s2, s3, s2, s3, s4);
    };
    const mse = (span, deg) => mean(GX.map((x) => (loess(x, span, deg) - truth(x)) ** 2));
    let curve = [], curDeg = null;
    function draw() {
      const c = C(), span = S.val("span"), deg = +S.val("deg");
      if (curDeg !== deg || !curve.length) { curve = []; for (let k = 1; k <= 20; k++) curve.push([k / 20, mse(k / 20, deg)]); curDeg = deg; }
      const v1 = QSim.view(cvF, 0.5), f1 = QSim.frame(v1, { x0: 0, x1: 10, y0: -2, y1: 4, xl: "x", yl: "y" }); f1.axes();
      X.forEach((x, i) => f1.dot(x, Yv[i], c.soft, 2.6));
      f1.fn(truth, c.ink3, 1.6, [5, 4]);
      f1.path(GX.map((x) => [x, loess(x, span, deg)]), c.main, 2.4);
      const best = curve.reduce((a, b) => (b[1] < a[1] ? b : a)), cur = (curve.find((t) => Math.abs(t[0] - span) < 1e-6) || [0, mse(span, deg)])[1], yT = Math.max(...curve.map((t) => t[1])) * 1.1;
      const v2 = QSim.view(cvE, 0.5), f2 = QSim.frame(v2, { x0: 0, x1: 1.02, y0: 0, y1: yT, xl: "span", yl: "참 곡선과의 평균제곱 차" }); f2.axes();
      f2.path(curve, c.ink2, 2); f2.dot(span, cur, c.warn, 5);
      S.out(`가상 자료 ${n}개: y = sin x + 0.2x + 잡음(표준편차 0.4), 회색 점선이 참 곡선\nspan = ${span.toFixed(2)}: 점마다 가까운 ${Math.min(n, Math.max(deg + 2, Math.ceil(span * n - 1e-9)))}개 점에 삼중 세제곱 가중치를 주고 ${deg}차 다항식을 맞춤 (파란 선)\n참 곡선과의 평균제곱 차 ${cur.toFixed(4)},  이 자료에서 가장 작은 곳은 span ${best[0].toFixed(2)} (${best[1].toFixed(4)})`);
    }
    S.$(".new").addEventListener("click", () => { seed = newSeed(seed); gen(); curve = []; draw(); });
    gen(); S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 9. k-평균 군집: 배정과 중심 갱신을 한 단계씩 (응통19-06-01) */
  (() => {
    const S = QSim.card("lab-s19-kmeans"); if (!S) return;
    const cv = S.$("canvas"); let dseed = 91, iseed = 224, lastSg = NaN;
    const CEN = [[-2, -0.5], [2, 0], [0.2, 2.8]], PER = 50;
    let P = [], cen = [], lab = [], it = 0, phase = "init", done = false, elbow = "";
    const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
    const assign = (pts, cs) => pts.map((p) => { let bi = 0; cs.forEach((q, j) => { if (d2(p, q) < d2(p, cs[bi])) bi = j; }); return bi; });
    const update = (pts, lb, cs) => cs.map((q, j) => { const mine = pts.filter((_, i) => lb[i] === j); return mine.length ? [mean(mine.map((p) => p[0])), mean(mine.map((p) => p[1]))] : q; });
    const wss = (pts, lb, cs) => pts.reduce((s, p, i) => s + d2(p, cs[lb[i]]), 0);
    const pick = (pts, k, u) => { const idx = []; while (idx.length < k) { const i = Math.floor(u() * pts.length); if (!idx.includes(i)) idx.push(i); } return idx.map((i) => [...pts[i]]); };
    const run = (pts, k, u) => { let cs = pick(pts, k, u), lb = assign(pts, cs); for (let t = 0; t < 100; t++) { cs = update(pts, lb, cs); const nl = assign(pts, cs); if (nl.every((a, i) => a === lb[i])) break; lb = nl; } return wss(pts, lb, cs); };
    const gen = () => {
      const u = rng(dseed), sg = S.val("sg"); P = []; lastSg = sg;
      CEN.forEach(([a, b]) => { for (let i = 0; i < PER; i++) P.push([a + sg * gauss(u), b + sg * gauss(u)]); });
      const ue = rng(dseed + 3), best = [];
      for (let k = 1; k <= 6; k++) { let w = Infinity; for (let r = 0; r < 20; r++) w = Math.min(w, run(P, k, ue)); best.push(`k=${k} ${w.toFixed(0)}`); }
      elbow = best.join(", ");
    };
    const init = () => { cen = pick(P, S.val("k"), rng(iseed)); lab = P.map(() => -1); it = 0; phase = "init"; done = false; };
    const step = () => {
      if (done) return;
      if (phase === "update" || phase === "init") { const nl = assign(P, cen); if (phase !== "init" && nl.every((a, i) => a === lab[i])) { done = true; return; } lab = nl; phase = "assign"; it++; }
      else { cen = update(P, lab, cen); phase = "update"; }
    };
    function draw() {
      const c = C(), cols = [c.main, c.warn, c.acc, "#2a9d8f", "#9b59b6", c.ink2];
      const v = QSim.view(cv, 0.85), f = QSim.frame(v, { x0: -5.5, x1: 5.5, y0: -3.5, y1: 6, equal: true, xl: "x₁", yl: "x₂" }); f.axes();
      P.forEach((p, i) => f.dot(p[0], p[1], lab[i] < 0 ? c.ink3 : cols[lab[i]], 3));
      const g = v.g;
      cen.forEach((q, j) => { const X = f.X(q[0]), Y = f.Y(q[1]); g.save(); g.fillStyle = cols[j]; g.strokeStyle = c.ink; g.lineWidth = 2; g.fillRect(X - 7, Y - 7, 14, 14); g.strokeRect(X - 7, Y - 7, 14, 14); g.restore(); });
      const state = done ? "수렴 (배정이 더 바뀌지 않음)" : phase === "init" ? "초기 중심만 고름 (아직 배정 전)" : phase === "assign" ? "방금 각 점을 가장 가까운 중심에 배정함" : "방금 중심을 군집 평균으로 옮김";
      const w = phase === "init" ? NaN : wss(P, lab, cen);
      S.out(`가상 자료 ${P.length}개 (실제로는 무리 3개, 무리 안 표준편차 ${S.val("sg").toFixed(1)}),  k = ${S.val("k")},  반복 ${it}회\n상태: ${state}\n군집 내 제곱합 WSS = ${isFinite(w) ? w.toFixed(1) : "-"}\n참고: 초기값 20번 중 가장 작은 WSS  ${elbow}`);
    }
    S.$(".step").addEventListener("click", () => { step(); draw(); });
    S.$(".all").addEventListener("click", () => { for (let t = 0; t < 200 && !done; t++) step(); draw(); });
    S.$(".init").addEventListener("click", () => { iseed = newSeed(iseed); init(); draw(); });
    S.$(".new").addEventListener("click", () => { dseed = newSeed(dseed); gen(); init(); draw(); });
    S.on(() => { if (S.val("sg") !== lastSg) gen(); init(); draw(); });
    QSim.redrawOn(draw); gen(); init(); draw();
  })();
})();
