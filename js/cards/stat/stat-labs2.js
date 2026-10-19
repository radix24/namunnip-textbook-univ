/* 응용통계 실습 카드 묶음 2 (모든 자료는 가상: 컴퓨터가 만든 난수 또는 정해 둔 예시 값)
   테일러 근사, 대칭행렬과 타원, R 히스토그램 계급, 근 찾기, 확률변수 변환, 추정량의 평균제곱오차,
   교호작용 그림, 평균과 중앙값의 표본분포, 상자그림과 이상값, 로지스틱 곡선, 주성분 */
(() => {
  "use strict";
  const C = () => QSim.col();
  /* 선형합동 난수 (seed·1664525 + 1013904223) mod 2³². Math.imul로 같은 수열을 빠르게 */
  const rng = (seed) => () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return (seed + 0.5) / 4294967296; };
  const gauss = (r) => Math.sqrt(-2 * Math.log(r())) * Math.cos(2 * Math.PI * r());
  const phi = (z) => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
  const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  const sd = (a) => { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };
  const sorted = (a) => [...a].sort((x, y) => x - y);
  const quant = (s, p) => { const h = (s.length - 1) * p, i = Math.floor(h); return s[i] + (h - i) * ((s[i + 1] ?? s[i]) - s[i]); };
  const median = (a) => quant(sorted(a), 0.5);
  const hist = (xs, lo, hi, k) => { const w = (hi - lo) / k, c = Array(k).fill(0); xs.forEach((x) => { const i = Math.floor((x - lo) / w); if (i >= 0 && i < k) c[i]++; }); return c.map((n) => n / (xs.length * w)); };
  const bars = (f, g, h, lo, hi, col, alpha = 1) => { const k = h.length, w = (hi - lo) / k; g.save(); g.globalAlpha = alpha; g.fillStyle = col; h.forEach((d, i) => { const x0 = f.X(lo + i * w), x1 = f.X(lo + (i + 1) * w); g.fillRect(x0, f.Y(d), Math.max(1, x1 - x0 - 1), f.Y(0) - f.Y(d)); }); g.restore(); };
  const vline = (f, x, y0, y1, col, w = 1.5, dash = [5, 4]) => f.path([[x, y0], [x, y1]], col, w, dash);
  const fact = (k) => { let s = 1; for (let i = 2; i <= k; i++) s *= i; return s; };
  const fivenum = (a) => { const s = sorted(a), n = s.length, n4 = Math.floor((n + 3) / 2) / 2, at = (d) => 0.5 * (s[Math.floor(d) - 1] + s[Math.ceil(d) - 1]); return [s[0], at(n4), at((n + 1) / 2), at(n + 1 - n4), s[n - 1]]; };

  /* 1. 테일러 다항식과 오차 (응통1-02-03) */
  (() => {
    const S = QSim.card("lab-s1-taylor"); if (!S) return;
    const cv = S.$("canvas");
    const FN = {
      exp: { n: "e^x", f: Math.exp, c: (k) => 1 / fact(k), lo: -3, hi: 3, ylo: -2, yhi: 12 },
      log: { n: "ln(1 + x)", f: (x) => (x > -1 ? Math.log(1 + x) : NaN), c: (k) => (k === 0 ? 0 : (k % 2 ? 1 : -1) / k), lo: -0.95, hi: 2, ylo: -3, yhi: 2 },
      sin: { n: "sin x", f: Math.sin, c: (k) => (k % 2 === 0 ? 0 : ((k - 1) / 2) % 2 ? -1 / fact(k) : 1 / fact(k)), lo: -7, hi: 7, ylo: -2, yhi: 2 }
    };
    function draw() {
      const c = C(), F = FN[S.val("fn")], n = S.val("deg"), x = S.val("x");
      const T = (t) => { let s = 0; for (let k = 0; k <= n; k++) s += F.c(k) * t ** k; return s; };
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: F.lo, x1: F.hi, y0: F.ylo, y1: F.yhi, xl: "x", yl: "y" }); f.axes();
      f.fn(F.f, c.ink2, 2.5); f.fn((t) => { const y = T(t); return y < F.ylo - 5 || y > F.yhi + 5 ? NaN : y; }, c.main, 2, [6, 4]);
      const fx = F.f(x), tx = T(x), err = Math.abs(fx - tx);
      if (x >= F.lo && x <= F.hi) { if (isFinite(fx)) f.dot(x, Math.max(F.ylo, Math.min(F.yhi, fx)), c.ink, 4); f.dot(x, Math.max(F.ylo, Math.min(F.yhi, tx)), c.warn, 4); }
      let bound = "";
      if (S.val("fn") === "exp") bound = `라그랑주 오차 상한 e^max(0,x)·|x|^${n + 1}/${n + 1}! = ${(Math.exp(Math.max(0, x)) * Math.abs(x) ** (n + 1) / fact(n + 1)).toPrecision(4)}`;
      else if (S.val("fn") === "sin") bound = `라그랑주 오차 상한 |x|^${n + 1}/${n + 1}! = ${(Math.abs(x) ** (n + 1) / fact(n + 1)).toPrecision(4)}`;
      else bound = Math.abs(x) < 1 ? "|x| < 1: 차수를 높이면 오차가 줄어든다 (수렴 반지름 1)" : "|x| ≥ 1: 급수가 수렴하지 않아 차수를 높여도 나아지지 않는다";
      S.out(`f(x) = ${F.n}, 0 둘레 ${n}차 테일러 다항식 (파란 점선)\nx = ${x.toFixed(2)}에서 f(x) = ${isFinite(fx) ? fx.toFixed(6) : "정의 안 됨"},  T_${n}(x) = ${tx.toFixed(6)},  실제 오차 ${isFinite(err) ? err.toPrecision(4) : "-"}\n${bound}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 대칭행렬이 단위원을 타원으로 보낸다 (응통2-04-02) */
  (() => {
    const S = QSim.card("lab-s2-eigen"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), a = S.val("a"), b = S.val("b"), d = S.val("d");
      const m = (a + d) / 2, r = Math.hypot((a - d) / 2, b), l1 = m + r, l2 = m - r;
      const th = 0.5 * Math.atan2(2 * b, a - d), e1 = [Math.cos(th), Math.sin(th)], e2 = [-Math.sin(th), Math.cos(th)];
      const R = Math.max(1.5, Math.abs(l1), Math.abs(l2)) * 1.15;
      const v = QSim.view(cv, 0.75), f = QSim.frame(v, { x0: -R, x1: R, y0: -R, y1: R, equal: true, xl: "x₁", yl: "x₂" }); f.axes();
      const circ = [], img = [];
      for (let i = 0; i <= 120; i++) { const t = 2 * Math.PI * i / 120, x = Math.cos(t), y = Math.sin(t); circ.push([x, y]); img.push([a * x + b * y, b * x + d * y]); }
      f.path(circ, c.ink3, 1.5, [4, 4]); f.path(img, c.main, 2.5);
      f.arrow(0, 0, l1 * e1[0], l1 * e1[1], c.warn, "λ₁e₁"); f.arrow(0, 0, l2 * e2[0], l2 * e2[1], c.acc, "λ₂e₂");
      const t0 = Math.PI / 6, p = [Math.cos(t0), Math.sin(t0)], q = [a * p[0] + b * p[1], b * p[0] + d * p[1]];
      f.dot(p[0], p[1], c.ink2, 4); f.dot(q[0], q[1], c.ink, 4);
      const kind = l2 > 1e-9 ? "양정치 (모든 고유값 > 0)" : l2 > -1e-9 ? "양의 준정치 (고유값 하나가 0)" : l1 > 1e-9 ? "부정치 (부호가 다른 고유값)" : "음(준)정치";
      S.out(`A = [[${a.toFixed(1)}, ${b.toFixed(1)}], [${b.toFixed(1)}, ${d.toFixed(1)}]]\n고유값 λ₁ = ${l1.toFixed(3)}, λ₂ = ${l2.toFixed(3)}   대각합 ${(a + d).toFixed(3)} = λ₁ + λ₂,  행렬식 ${(a * d - b * b).toFixed(3)} = λ₁λ₂\n고유벡터 e₁ = (${e1[0].toFixed(3)}, ${e1[1].toFixed(3)}),  e₂ = (${e2[0].toFixed(3)}, ${e2[1].toFixed(3)})  → ${kind}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 히스토그램 계급 수가 모양을 바꾼다 (응통3-03-01) */
  (() => {
    const S = QSim.card("lab-s3-hist"); if (!S) return;
    const cv = S.$("canvas"), u = rng(321);
    const DATA = Array.from({ length: 200 }, () => (u() < 0.55 ? 20 : 30) + 3 * gauss(u)).map((x) => Math.round(x * 10) / 10); /* 가상: 두 무리가 섞인 대기 시간(분) */
    const s = sorted(DATA), lo = Math.floor(s[0]) - 1, hi = Math.ceil(s[s.length - 1]) + 1, n = DATA.length;
    function draw() {
      const c = C(), k = S.val("k"), h = hist(DATA, lo, hi, k), top = Math.max(...h) * 1.2;
      const v = QSim.view(cv, 0.45), f = QSim.frame(v, { x0: lo, x1: hi, y0: 0, y1: top, xl: "대기 시간 (분)", yl: "밀도" }); f.axes({ noGrid: true });
      bars(f, v.g, h, lo, hi, c.soft);
      if (S.val("rug")) DATA.forEach((x) => f.path([[x, 0], [x, top * 0.04]], c.ink3, 1));
      const iqr = quant(s, 0.75) - quant(s, 0.25), fd = 2 * iqr / Math.cbrt(n), sturges = Math.ceil(Math.log2(n) + 1);
      S.out(`가상 자료 ${n}개, 범위 [${lo}, ${hi}], 계급 ${k}개 → 계급 폭 ${((hi - lo) / k).toFixed(2)}분\n참고: 스터지스 규칙 ${sturges}개,  프리드먼-다이아코니스 폭 2·IQR/n^(1/3) = ${fd.toFixed(2)}분 (약 ${Math.round((hi - lo) / fd)}개)\nR: hist(x, breaks = seq(${lo}, ${hi}, length.out = ${k + 1}))`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 이분법과 뉴턴 방법 (응통4-04-01) */
  (() => {
    const S = QSim.card("lab-s4-root"); if (!S) return;
    const cv = S.$("canvas");
    const FN = {
      cubic: { n: "x³ + x − 1", f: (x) => x ** 3 + x - 1, d: (x) => 3 * x * x + 1, root: 0.6823278038280193 },
      cos: { n: "cos x − x", f: (x) => Math.cos(x) - x, d: (x) => -Math.sin(x) - 1, root: 0.7390851332151607 }
    };
    function draw() {
      const c = C(), F = FN[S.val("fn")], meth = S.val("meth"), K = S.val("k"), x0 = S.val("x0"), it = [];
      if (meth === "bis") { let a = 0, b = 1; for (let i = 0; i < K; i++) { const m = (a + b) / 2; it.push([m, a, b]); if (F.f(a) * F.f(m) <= 0) b = m; else a = m; } }
      else { let x = x0; for (let i = 0; i < K; i++) { x = x - F.f(x) / F.d(x); it.push([x]); } }
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: -0.5, x1: 2, y0: -2, y1: 3, xl: "x", yl: "f(x)" }); f.axes();
      f.fn(F.f, c.ink2, 2.2); vline(f, F.root, -2, 3, c.ink3, 1, [3, 3]);
      if (meth === "new") { let x = x0; for (let i = 0; i < Math.min(K, 4); i++) { const y = F.f(x), nx = x - y / F.d(x); if (Math.abs(x) < 50) { f.path([[x, 0], [x, y]], c.acc, 1, [3, 3]); f.path([[x, y], [nx, 0]], c.warn, 1.5); } x = nx; } f.dot(x0, 0, c.ink, 4); }
      it.forEach((p, i) => { if (p[0] > -0.5 && p[0] < 2) f.dot(p[0], 0, i === it.length - 1 ? c.warn : c.main, 3.5); });
      const rows = it.slice(-6).map((p, j) => { const i = it.length - Math.min(6, it.length) + j + 1; return `${String(i).padStart(2)}  x = ${p[0].toFixed(10)}  오차 ${Math.abs(p[0] - F.root).toExponential(2)}`; });
      S.out(`f(x) = ${F.n},  참 근 ${F.root.toFixed(10)} (회색 점선)\n${meth === "bis" ? "이분법, 처음 구간 [0, 1], 중점을 근사값으로" : `뉴턴 방법, 시작값 ${x0.toFixed(2)}`}, 반복 ${K}번 (마지막 6번)\n${rows.join("\n")}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 5. 균일 난수의 변환 (응통6-02-02) */
  (() => {
    const S = QSim.card("lab-s6-transform"); if (!S) return;
    const cv = S.$("canvas"); let seed = 17;
    const G = {
      exp: { n: "Y = −ln X", g: (x) => -Math.log(x), dens: (y) => (y > 0 ? Math.exp(-y) : 0), lo: 0, hi: 6, mu: 1, nm: "지수분포 Exp(1)" },
      sq: { n: "Y = X²", g: (x) => x * x, dens: (y) => (y > 0 && y < 1 ? 1 / (2 * Math.sqrt(y)) : 0), lo: 0, hi: 1, mu: 1 / 3, nm: "밀도 1/(2√y)" },
      sqrt: { n: "Y = √X", g: (x) => Math.sqrt(x), dens: (y) => (y > 0 && y < 1 ? 2 * y : 0), lo: 0, hi: 1, mu: 2 / 3, nm: "밀도 2y" },
      cauchy: { n: "Y = tan(π(X − 1/2))", g: (x) => Math.tan(Math.PI * (x - 0.5)), dens: (y) => 1 / (Math.PI * (1 + y * y)), lo: -8, hi: 8, mu: NaN, nm: "코시 분포 (평균 없음)" }
    };
    function draw() {
      const c = C(), T = G[S.val("g")], N = S.val("N"), u = rng(seed), ys = Array.from({ length: N }, () => T.g(u()));
      const h = hist(ys, T.lo, T.hi, 40), top = Math.min(Math.max(...h, T.dens((T.lo + T.hi) / 2)) * 1.2, 4);
      const v = QSim.view(cv, 0.45), f = QSim.frame(v, { x0: T.lo, x1: T.hi, y0: 0, y1: top, xl: "y", yl: "밀도" }); f.axes({ noGrid: true });
      bars(f, v.g, h.map((d) => Math.min(d, top)), T.lo, T.hi, c.soft); f.fn((y) => Math.min(T.dens(y), top), c.warn, 2.2, null, 600);
      const inRange = ys.filter((y) => y >= T.lo && y < T.hi).length;
      S.out(`X ~ U(0, 1)에서 ${T.n}, 난수 ${N}개 (가상).  이론: ${T.nm} (빨강)\n표본 평균 ${mean(ys).toFixed(3)}${isFinite(T.mu) ? ` (이론 ${T.mu.toFixed(3)})` : " (코시 분포는 평균이 없어 값이 크게 흔들림)"},  표본 중앙값 ${median(ys).toFixed(3)}\n그림 범위 안의 값 ${inRange}개 (${(100 * inRange / N).toFixed(1)}%)`);
    }
    S.$(".new").addEventListener("click", () => { seed = (seed * 31 + 7) % 99991; draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 6. U(0, θ)의 세 추정량 비교 (응통7-01-02) */
  (() => {
    const S = QSim.card("lab-s7-mse"); if (!S) return;
    const cv = S.$("canvas"); let seed = 7;
    const TH = 10, R = 2000;
    const theo = (n) => [TH / Math.sqrt(3 * n), TH * Math.sqrt(2 / ((n + 1) * (n + 2))), TH / Math.sqrt(n * (n + 2))];
    function draw() {
      const c = C(), n = S.val("n"), u = rng(seed), est = [[], [], []];
      for (let r = 0; r < R; r++) { let s = 0, m = 0; for (let i = 0; i < n; i++) { const x = TH * u(); s += x; if (x > m) m = x; } est[0].push(2 * s / n); est[1].push(m); est[2].push((n + 1) / n * m); }
      const v = QSim.view(cv, 0.45), f = QSim.frame(v, { x0: 2, x1: 50, y0: 0, y1: 4.5, xl: "표본 크기 n", yl: "√MSE" }); f.axes();
      const cols = [c.ink3, c.warn, c.main];
      [0, 1, 2].forEach((j) => { const pts = []; for (let k = 2; k <= 50; k++) pts.push([k, theo(k)[j]]); f.path(pts, cols[j], 2); });
      const st = est.map((e) => { const m = mean(e), mse = e.reduce((a, x) => a + (x - TH) ** 2, 0) / R; return { m, bias: m - TH, rm: Math.sqrt(mse) }; });
      st.forEach((s, j) => f.dot(n, s.rm, cols[j], 5)); vline(f, n, 0, 4.5, c.ink3, 1, [3, 3]);
      const name = ["2X̄ (적률법)", "X₍ₙ₎ (최대가능도)", "(n+1)/n·X₍ₙ₎ (불편)"], th = theo(n);
      S.out(`θ = ${TH}, n = ${n}, 반복 ${R}번 (가상).  선은 이론 √MSE, 점은 모의실험 값\n${st.map((s, j) => `${name[j]}: 평균 ${s.m.toFixed(3)} (편향 ${s.bias >= 0 ? "+" : ""}${s.bias.toFixed(3)}),  √MSE ${s.rm.toFixed(3)} (이론 ${th[j].toFixed(3)})`).join("\n")}`);
    }
    S.$(".new").addEventListener("click", () => { seed = (seed * 31 + 7) % 99991; draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 7. 2×2 요인실험의 교호작용 그림 (응통13-04-02) */
  (() => {
    const S = QSim.card("lab-s13-inter"); if (!S) return;
    const cv = S.$("canvas"); let seed = 41;
    const NR = 4, FCRIT = 4.747; /* F(1, 12)의 95% 분위수 */
    function draw() {
      const c = C(), A = S.val("A"), B = S.val("B"), AB = S.val("AB"), sg = S.val("sg"), u = rng(seed);
      const mu = (i, j) => 20 + (i ? 1 : -1) * A / 2 + (j ? 1 : -1) * B / 2 + ((i ^ j) ? -1 : 1) * AB / 2;
      const cell = [[[], []], [[], []]];
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let r = 0; r < NR; r++) cell[i][j].push(mu(i, j) + sg * gauss(u));
      const m = cell.map((row) => row.map(mean));
      const eA = (m[1][0] + m[1][1] - m[0][0] - m[0][1]) / 2, eB = (m[0][1] + m[1][1] - m[0][0] - m[1][0]) / 2, eAB = (m[0][0] + m[1][1] - m[0][1] - m[1][0]) / 2;
      let sse = 0; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) cell[i][j].forEach((y) => { sse += (y - m[i][j]) ** 2; });
      const mse = sse / (4 * (NR - 1)), F = [eA, eB, eAB].map((e) => NR * e * e / mse);
      const all = cell.flat(2), ylo = Math.min(...all) - 2, yhi = Math.max(...all) + 2;
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: -0.4, x1: 1.4, y0: ylo, y1: yhi, xl: "요인 A (낮음 → 높음)", yl: "반응" }); f.axes({ noGrid: true });
      const cols = [c.main, c.warn];
      for (let j = 0; j < 2; j++) { for (let i = 0; i < 2; i++) cell[i][j].forEach((y, r) => f.dot(i + (j ? 0.04 : -0.04) + (r - 1.5) * 0.015, y, cols[j], 2.5)); f.path([[0, m[0][j]], [1, m[1][j]]], cols[j], 2.5); f.text(j ? "B 높음" : "B 낮음", 1.05, m[1][j], cols[j]); }
      const judge = (x) => (x > FCRIT ? "유의" : "유의하지 않음");
      S.out(`참 효과: A ${A}, B ${B}, AB ${AB}, 오차 표준편차 ${sg} (칸마다 ${NR}회, 가상)\n칸 평균: A낮B낮 ${m[0][0].toFixed(2)}, A낮B높 ${m[0][1].toFixed(2)}, A높B낮 ${m[1][0].toFixed(2)}, A높B높 ${m[1][1].toFixed(2)}\n추정 효과 A ${eA.toFixed(2)}, B ${eB.toFixed(2)}, AB ${eAB.toFixed(2)}   (오차 평균제곱 ${mse.toFixed(2)}, 자유도 12)\nF: A ${F[0].toFixed(2)} ${judge(F[0])}, B ${F[1].toFixed(2)} ${judge(F[1])}, AB ${F[2].toFixed(2)} ${judge(F[2])}  (5% 임계값 ${FCRIT})`);
    }
    S.$(".new").addEventListener("click", () => { seed = (seed * 31 + 7) % 99991; draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 8. 평균과 중앙값의 표본분포 (응통14-01-02) */
  (() => {
    const S = QSim.card("lab-s14-meanmed"); if (!S) return;
    const cv = S.$("canvas"); let seed = 23;
    const POP = {
      norm: { n: "정규분포 N(0, 1)", r: (u) => gauss(u) },
      t3: { n: "t 분포 (자유도 3, 꼬리 두꺼움)", r: (u) => { const z = gauss(u), w = gauss(u) ** 2 + gauss(u) ** 2 + gauss(u) ** 2; return z / Math.sqrt(w / 3); } },
      cont: { n: "오염 정규 (95% N(0,1) + 5% N(0,10²))", r: (u) => (u() < 0.05 ? 10 : 1) * gauss(u) }
    };
    function draw() {
      const c = C(), P = POP[S.val("pop")], n = S.val("n"), R = 3000, u = rng(seed), mm = [], md = [];
      for (let r = 0; r < R; r++) { const x = Array.from({ length: n }, () => P.r(u)); mm.push(mean(x)); md.push(median(x)); }
      const sm = sd(mm), sdd = sd(md), L = 4 * Math.max(Math.min(sm, 3 * sdd), sdd);
      const h1 = hist(mm, -L, L, 50), h2 = hist(md, -L, L, 50), top = Math.max(...h1, ...h2) * 1.15;
      const v = QSim.view(cv, 0.45), f = QSim.frame(v, { x0: -L, x1: L, y0: 0, y1: top, xl: "추정값", yl: "밀도" }); f.axes({ noGrid: true });
      bars(f, v.g, h1, -L, L, c.ink3, 0.45); bars(f, v.g, h2, -L, L, c.main, 0.45);
      S.out(`${P.n}에서 크기 ${n}인 표본 ${R}개 (가상).  회색: 표본평균, 파랑: 표본중앙값\n표본평균의 표준편차 ${sm.toFixed(4)},  표본중앙값의 표준편차 ${sdd.toFixed(4)}\n분산 비 Var(중앙값)/Var(평균) = ${(sdd * sdd / (sm * sm)).toFixed(3)}  (1보다 크면 평균이, 작으면 중앙값이 더 정밀)`);
    }
    S.$(".new").addEventListener("click", () => { seed = (seed * 31 + 7) % 99991; draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 9. 상자그림과 이상값: 값 하나를 옮겨 보기 (응통17-02-03) */
  (() => {
    const S = QSim.card("lab-s17-box"); if (!S) return;
    const cv = S.$("canvas"), BASE = [3, 5, 6, 7, 7, 8, 9, 10, 11, 12, 13];
    function draw() {
      const c = C(), vv = S.val("v"), x = [...BASE, vv], s = sorted(x), [mn, h1, md, h2, mx] = fivenum(x), H = h2 - h1;
      const lf = h1 - 1.5 * H, uf = h2 + 1.5 * H, out = s.filter((t) => t < lf || t > uf), inn = s.filter((t) => t >= lf && t <= uf);
      const k = 1, tm = mean(s.slice(k, s.length - k)), mad = 1.4826 * median(x.map((t) => Math.abs(t - md)));
      const v = QSim.view(cv, 0.35), f = QSim.frame(v, { x0: -2, x1: 62, y0: 0, y1: 3, xl: "값", yl: "" }); f.axes({ noGrid: true });
      const g = v.g; g.strokeStyle = c.main; g.lineWidth = 2; g.strokeRect(f.X(h1), f.Y(2.2), f.X(h2) - f.X(h1), f.Y(1.4) - f.Y(2.2));
      f.path([[md, 1.4], [md, 2.2]], c.main, 3); f.path([[inn[0], 1.8], [h1, 1.8]], c.main, 1.5); f.path([[h2, 1.8], [inn[inn.length - 1], 1.8]], c.main, 1.5);
      vline(f, uf, 1.2, 2.4, c.acc, 1, [3, 3]); vline(f, lf, 1.2, 2.4, c.acc, 1, [3, 3]);
      out.forEach((t) => f.dot(t, 1.8, c.warn, 4));
      x.forEach((t, i) => f.dot(t, 0.6, i === x.length - 1 ? c.warn : c.ink3, 3.5));
      f.path([[mean(x), 0.3], [mean(x), 0.9]], c.ink, 2); f.text("평균", mean(x), 0.95, c.ink, "center");
      S.out(`자료 12개 (가상): ${s.join(", ")}  (빨간 점이 옮기는 값 ${vv})\n다섯 숫자 (튜키 경첩): ${[mn, h1, md, h2, mx].join(", ")},  경첩 간격 ${H}\n울타리 [${lf}, ${uf}] (주황 점선),  이상값: ${out.length ? out.join(", ") : "없음"}\n평균 ${mean(x).toFixed(2)},  중앙값 ${md},  절사평균(양쪽 1개) ${tm.toFixed(2)},  표준편차 ${sd(x).toFixed(2)},  MAD×1.4826 ${mad.toFixed(2)}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 10. 로지스틱 곡선과 오즈비 (응통18-03-01) */
  (() => {
    const S = QSim.card("lab-s18-logit"); if (!S) return;
    const cv = S.$("canvas"), u0 = rng(55);
    const XS = Array.from({ length: 40 }, () => 10 * u0()), US = XS.map(() => u0()); /* 가상 자료용 고정 난수 */
    function draw() {
      const c = C(), b0 = S.val("b0"), b1 = S.val("b1"), x = S.val("x"), p = (t) => 1 / (1 + Math.exp(-(b0 + b1 * t)));
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: 10, y0: -0.05, y1: 1.05, xl: "x", yl: "P(Y = 1)" }); f.axes();
      if (S.val("pts")) XS.forEach((t, i) => f.dot(t, US[i] < p(t) ? 1 : 0, c.ink3, 3));
      f.fn(p, c.main, 2.6);
      const px = p(x), odds = px / (1 - px), x50 = b1 !== 0 ? -b0 / b1 : NaN;
      vline(f, x, -0.05, 1.05, c.acc, 1.2); f.dot(x, px, c.warn, 5);
      if (isFinite(x50) && x50 >= 0 && x50 <= 10) { vline(f, x50, -0.05, 0.5, c.ink3, 1, [3, 3]); f.path([[0, 0.5], [x50, 0.5]], c.ink3, 1, [3, 3]); }
      const px1 = p(x + 1), odds1 = px1 / (1 - px1);
      S.out(`logit P(Y = 1) = ${b0.toFixed(1)} + ${b1.toFixed(2)}x\nx = ${x.toFixed(1)}: 확률 ${px.toFixed(4)}, 오즈 ${odds.toFixed(4)};   x = ${(x + 1).toFixed(1)}: 확률 ${px1.toFixed(4)}, 오즈 ${odds1.toFixed(4)}\n오즈비 (x가 1 늘 때) = e^β₁ = ${Math.exp(b1).toFixed(4)} = ${(odds1 / odds).toFixed(4)},  확률 증가 ${(px1 - px).toFixed(4)} (x에 따라 다름)\n확률 0.5가 되는 x = −β₀/β₁ = ${isFinite(x50) ? x50.toFixed(3) : "없음"},  그곳의 기울기 β₁/4 = ${(b1 / 4).toFixed(4)}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 11. 주성분: 공분산 행렬과 상관 행렬 (응통19-03-01) */
  (() => {
    const S = QSim.card("lab-s19-pca"); if (!S) return;
    const cv = S.$("canvas"); let seed = 61;
    const eig2 = (a, b, d) => { const m = (a + d) / 2, r = Math.hypot((a - d) / 2, b), th = 0.5 * Math.atan2(2 * b, a - d); return { l1: m + r, l2: m - r, e1: [Math.cos(th), Math.sin(th)] }; };
    function draw() {
      const c = C(), rho = S.val("rho"), s2 = S.val("s2"), std = S.val("std"), n = 200, u = rng(seed);
      let X = [], Y = [];
      for (let i = 0; i < n; i++) { const z1 = gauss(u), z2 = gauss(u); X.push(z1); Y.push(s2 * (rho * z1 + Math.sqrt(1 - rho * rho) * z2)); }
      const mx = mean(X), my = mean(Y); X = X.map((t) => t - mx); Y = Y.map((t) => t - my);
      if (std) { const sx = sd(X), sy = sd(Y); X = X.map((t) => t / sx); Y = Y.map((t) => t / sy); }
      const sxx = X.reduce((a, t) => a + t * t, 0) / (n - 1), syy = Y.reduce((a, t) => a + t * t, 0) / (n - 1), sxy = X.reduce((a, t, i) => a + t * Y[i], 0) / (n - 1);
      const E = eig2(sxx, sxy, syy), T = std ? eig2(1, rho, 1) : eig2(1, rho * s2, s2 * s2);
      const R = 3.5 * Math.max(1, std ? 1 : s2);
      const v = QSim.view(cv, 0.75), f = QSim.frame(v, { x0: -R, x1: R, y0: -R, y1: R, equal: true, xl: std ? "x₁ (표준화)" : "x₁", yl: std ? "x₂ (표준화)" : "x₂" }); f.axes();
      X.forEach((t, i) => f.dot(t, Y[i], c.soft, 2.5));
      const a1 = 2 * Math.sqrt(E.l1), a2 = 2 * Math.sqrt(Math.max(E.l2, 0)), e2 = [-E.e1[1], E.e1[0]];
      f.arrow(0, 0, a1 * E.e1[0], a1 * E.e1[1], c.warn, "PC1"); f.arrow(0, 0, a2 * e2[0], a2 * e2[1], c.acc, "PC2");
      const tot = E.l1 + E.l2;
      S.out(`가상 자료 ${n}개: 표준편차 1과 ${s2.toFixed(2)}, 상관 ${rho.toFixed(2)}.  ${std ? "상관 행렬(표준화 후)" : "공분산 행렬"}로 주성분분석\n표본 고유값 ${E.l1.toFixed(3)}, ${E.l2.toFixed(3)} (이론 ${T.l1.toFixed(3)}, ${T.l2.toFixed(3)})\nPC1 방향 (${E.e1[0].toFixed(3)}, ${E.e1[1].toFixed(3)}),  PC1이 설명하는 분산 비율 ${(100 * E.l1 / tot).toFixed(1)}% (이론 ${(100 * T.l1 / (T.l1 + T.l2)).toFixed(1)}%)`);
    }
    S.$(".new").addEventListener("click", () => { seed = (seed * 31 + 7) % 99991; draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
