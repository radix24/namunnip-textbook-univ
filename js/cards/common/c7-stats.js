/* 공통7 실습 카드 묶음: 히스토그램, 이상값, 베이즈, 이항·포아송, 정규분포, 신뢰구간, 검정력, 회귀 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const erf = (x) => { const s = Math.sign(x); x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x); const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return s * y; };
  const Phi = (z) => 0.5 * (1 + erf(z / Math.SQRT2));
  const invPhi = (p) => { let lo = -8, hi = 8; for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (Phi(m) < p) lo = m; else hi = m; } return (lo + hi) / 2; };
  const phi = (z) => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
  // 재현 가능한 난수 (씨앗 고정)
  const rng = (seed) => () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  const gauss = (r) => { let u = 0; while (!u) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); };
  const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  const sd = (a) => { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };
  const quant = (a, q) => { const b = a.slice().sort((x, y) => x - y), h = (b.length - 1) * q, l = Math.floor(h); return b[l] + (h - l) * ((b[l + 1] ?? b[l]) - b[l]); };
  const posOf = (cv, f, e) => { const r = cv.getBoundingClientRect(); return [f.x0 + (e.clientX - r.left - f.X(f.x0)) / f.sx, f.y0 + (f.Y(f.y0) - (e.clientY - r.top)) / f.sy]; };

  /* 1. 히스토그램과 계급 폭 (01-02) */
  (() => {
    const S = QSim.card("lab-c7-hist"); if (!S) return;
    const cv = S.$("canvas");
    const r = rng(7), D = {
      score: { n: "시험 점수 200명", x: Array.from({ length: 200 }, () => Math.min(100, Math.max(20, 72 + 11 * gauss(r)))), lo: 20, hi: 100, u: "점" },
      income: { n: "월 소득 200명 (만 원)", x: Array.from({ length: 200 }, () => 120 + 280 * Math.exp(0.7 * gauss(r))), lo: 0, hi: 1600, u: "만 원" },
      height: { n: "남녀 섞인 키 200명", x: Array.from({ length: 200 }, (_, i) => (i % 2 ? 173 : 160) + 5.5 * gauss(r)), lo: 140, hi: 195, u: "cm" }
    };
    function draw() {
      const c = C(), d = D[S.val("ds")], k = S.val("k"), w = (d.hi - d.lo) / k, cnt = Array(k).fill(0);
      d.x.forEach((x) => { const i = Math.min(k - 1, Math.max(0, Math.floor((x - d.lo) / w))); cnt[i]++; });
      const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: d.lo, x1: d.hi, y0: 0, y1: Math.max(...cnt) * 1.15, xl: d.u, yl: "도수" }); f.axes();
      const g = v.g; cnt.forEach((n, i) => { g.fillStyle = c.soft; g.fillRect(f.X(d.lo + i * w), f.Y(n), f.X(d.lo + (i + 1) * w) - f.X(d.lo + i * w), f.Y(0) - f.Y(n)); g.strokeStyle = c.main; g.strokeRect(f.X(d.lo + i * w), f.Y(n), f.X(d.lo + (i + 1) * w) - f.X(d.lo + i * w), f.Y(0) - f.Y(n)); });
      const m = mean(d.x), md = quant(d.x, 0.5), top = Math.max(...cnt) * 1.1;
      f.path([[m, 0], [m, top]], c.warn, 2); f.path([[md, 0], [md, top]], c.acc, 2, [5, 3]);
      S.out(`${d.n}, 계급 ${k}개 (폭 ${w.toFixed(1)} ${d.u})\n평균 ${m.toFixed(1)} (빨강), 중앙값 ${md.toFixed(1)} (주황 점선), 표준편차 ${sd(d.x).toFixed(1)}\n√n ≈ ${Math.round(Math.sqrt(d.x.length))}개가 대략의 기준`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 이상값과 요약값 (02-01) */
  (() => {
    const S = QSim.card("lab-c7-outlier"); if (!S) return;
    const cv = S.$("canvas"); const base = [2, 4, 4, 5, 7, 8];
    function draw() {
      const c = C(), x = base.concat([S.val("o")]), m = mean(x), md = quant(x, 0.5), q1 = quant(x, 0.25), q3 = quant(x, 0.75), iqr = q3 - q1;
      const v = QSim.view(cv, 0.45), f = QSim.frame(v, { x0: 0, x1: 60, y0: -2.2, y1: 2.2, pad: 10, xl: "값" }); f.axes({ noGrid: true });
      x.forEach((t, i) => f.dot(t, 1.2 + (i === 6 ? 0.4 : 0), i === 6 ? c.warn : c.main, 6));
      const g = v.g; g.strokeStyle = c.ink; g.lineWidth = 1.5;
      const lw = Math.min(...x.filter((t) => t >= q1 - 1.5 * iqr)), uw = Math.max(...x.filter((t) => t <= q3 + 1.5 * iqr));
      g.strokeRect(f.X(q1), f.Y(-0.6), f.X(q3) - f.X(q1), f.Y(-1.6) - f.Y(-0.6)); f.path([[md, -0.6], [md, -1.6]], c.ink, 2.5);
      f.path([[lw, -1.1], [q1, -1.1]], c.ink, 1.5); f.path([[q3, -1.1], [uw, -1.1]], c.ink, 1.5);
      x.filter((t) => t < q1 - 1.5 * iqr || t > q3 + 1.5 * iqr).forEach((t) => f.dot(t, -1.1, c.warn, 4));
      f.path([[m, -2], [m, 2]], c.warn, 1.5, [4, 3]);
      S.out(`자료 ${x.join(", ")}\n평균 ${m.toFixed(2)} (빨간 점선), 중앙값 ${md}, 표준편차 ${sd(x).toFixed(2)}, IQR ${iqr.toFixed(2)}\n${S.val("o") > q3 + 1.5 * iqr ? "빨간 점은 Q3 + 1.5 IQR = " + (q3 + 1.5 * iqr).toFixed(1) + "보다 커서 상자그림에서 이상값으로 표시된다" : "이상값 아님"}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 베이즈: 1만 명 그림 (03-02) */
  (() => {
    const S = QSim.card("lab-c7-bayes"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), pr = S.val("prev") / 100, se = S.val("sens") / 100, sp = S.val("spec") / 100, N = 10000;
      const D = Math.round(N * pr), TP = Math.round(D * se), FN = D - TP, FP = Math.round((N - D) * (1 - sp)), TN = N - D - FP;
      const v = QSim.view(cv, 0.5), g = v.g, cols = 100, rows = 100, cw = v.W / cols, ch = v.H / rows;
      const kinds = [[TP, c.warn], [FN, "#e8b4b2"], [FP, c.acc], [TN, c.rule]]; let k = 0;
      kinds.forEach(([n, col]) => { g.fillStyle = col; for (let i = 0; i < n; i++, k++) { const x = Math.floor(k / rows), y = k % rows; g.fillRect(x * cw, y * ch, Math.max(1, cw - 0.3), Math.max(1, ch - 0.3)); } });
      const post = TP / Math.max(1, TP + FP);
      S.out(`1만 명 가운데: 병 있음 ${D}명 (양성 ${TP} 빨강, 음성 ${FN} 분홍) · 병 없음 ${N - D}명 (양성 ${FP} 주황, 음성 ${TN} 회색)\n양성 ${TP + FP}명 중 실제 환자 ${TP}명 → P(병 | 양성) = ${(100 * post).toFixed(1)}%\n음성 ${FN + TN}명 중 환자 ${FN}명 → P(병 | 음성) = ${(100 * FN / Math.max(1, FN + TN)).toFixed(2)}%`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 이항분포와 포아송, 정규 근사 (04-02) */
  (() => {
    const S = QSim.card("lab-c7-binom"); if (!S) return;
    const cv = S.$("canvas");
    const lgam = (n) => { let s = 0; for (let i = 2; i <= n; i++) s += Math.log(i); return s; };
    function draw() {
      const c = C(), n = S.val("n"), p = S.val("p"), lam = n * p, mu = n * p, sg = Math.sqrt(n * p * (1 - p));
      const B = (k) => Math.exp(lgam(n) - lgam(k) - lgam(n - k) + k * Math.log(p) + (n - k) * Math.log(1 - p));
      const P = (k) => Math.exp(-lam + k * Math.log(lam) - lgam(k));
      const xmax = Math.min(n, Math.ceil(mu + 4.5 * sg + 3)), xmin = Math.max(0, Math.floor(mu - 4.5 * sg - 2));
      let top = 0; for (let k = xmin; k <= xmax; k++) top = Math.max(top, B(k));
      const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: xmin - 0.8, x1: xmax + 0.8, y0: 0, y1: top * 1.2, xl: "k", yl: "P(X = k)" }); f.axes();
      const a = S.val("a"), g = v.g, bw = Math.min(16, (f.X(1) - f.X(0)) * 0.7);
      let sum = 0; for (let k = xmin; k <= xmax; k++) { const y = B(k); g.fillStyle = k <= a ? c.main : c.soft; g.fillRect(f.X(k) - bw / 2, f.Y(y), bw, f.Y(0) - f.Y(y)); if (k <= a) sum += y; }
      for (let k = 0; k < xmin; k++) if (k <= a) sum += B(k);
      if (S.val("poi")) for (let k = xmin; k <= xmax; k++) f.dot(k, P(k), c.acc, 3.5);
      if (S.val("nor")) f.fn((x) => phi((x - mu) / sg) / sg, c.warn, 2);
      const zc = (a + 0.5 - mu) / sg;
      S.out(`B(${n}, ${p}): 평균 np = ${mu.toFixed(2)}, 분산 np(1−p) = ${(sg * sg).toFixed(2)}\nP(X ≤ ${a}) = ${sum.toFixed(4)} (진한 막대)` +
        (S.val("nor") ? `, 정규 근사(연속성 보정) ${Phi(zc).toFixed(4)}` : "") + (S.val("poi") ? `\n주황 점: 포아송(λ = ${lam.toFixed(2)}). n이 크고 p가 작을수록 막대와 겹친다` : ""));
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 5. 정규분포의 넓이 (05-02) */
  (() => {
    const S = QSim.card("lab-c7-normal"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), mu = S.val("mu"), sg = S.val("sg"); let a = S.val("a"), b = S.val("b"); if (b < a) [a, b] = [b, a];
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 130, x1: 210, y0: 0, y1: 0.09, xl: "x (cm)" }); f.axes();
      const pdf = (x) => phi((x - mu) / sg) / sg, g = v.g;
      g.fillStyle = c.soft; g.beginPath(); g.moveTo(f.X(a), f.Y(0)); for (let i = 0; i <= 100; i++) { const x = a + ((b - a) * i) / 100; g.lineTo(f.X(x), f.Y(pdf(x))); } g.lineTo(f.X(b), f.Y(0)); g.closePath(); g.fill();
      f.fn(pdf, c.main, 2.5, null, 600);
      [-3, -2, -1, 1, 2, 3].forEach((k) => f.path([[mu + k * sg, 0], [mu + k * sg, pdf(mu + k * sg)]], c.rule, 1, [2, 3]));
      const za = (a - mu) / sg, zb = (b - mu) / sg, P = Phi(zb) - Phi(za);
      S.out(`N(${mu}, ${sg}²)에서 P(${a} ≤ X ≤ ${b}) = Φ(${zb.toFixed(2)}) − Φ(${za.toFixed(2)}) = ${P.toFixed(4)}\n표준화: z = (x − μ)/σ. 회색 점선은 μ ± 1, 2, 3σ\n상위 10%의 경계 μ + 1.2816σ = ${(mu + 1.2816 * sg).toFixed(1)} cm`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 6. 신뢰구간 100개 (07-02) */
  (() => {
    const S = QSim.card("lab-c7-ci"); if (!S) return;
    const cv = S.$("canvas"); let seed = 11, ivs = [], tot = 0, hit = 0;
    const MU = 50, SG = 10;
    const make = (k) => { const r = rng(seed++), n = S.val("n"), z = invPhi(1 - (1 - S.val("lv") / 100) / 2); for (let j = 0; j < k; j++) { const x = Array.from({ length: n }, () => MU + SG * gauss(r)), m = mean(x), s = sd(x), e = (z * s) / Math.sqrt(n); const ok = m - e <= MU && MU <= m + e; ivs.push([m - e, m + e, ok]); tot++; if (ok) hit++; } if (ivs.length > 100) ivs = ivs.slice(-100); };
    function draw() {
      const c = C(), v = QSim.view(cv, 0.8), f = QSim.frame(v, { x0: 38, x1: 62, y0: 0, y1: 101, pad: 18, xl: "구간" });
      f.path([[MU, 0], [MU, 101]], c.ink, 1.5); f.text("μ = 50", MU + 0.3, 99, c.ink2);
      ivs.forEach(([l, u, ok], i) => f.path([[Math.max(38, l), i + 1], [Math.min(62, u), i + 1]], ok ? c.main : c.warn, ok ? 1.4 : 2.4));
      S.out(`모집단 N(50, 10²), 표본 크기 n = ${S.val("n")}, 신뢰수준 ${S.val("lv")}% (σ 대신 s 사용)\n최근 ${ivs.length}개 중 μ를 놓친 구간 ${ivs.filter((q) => !q[2]).length}개 (빨강)\n지금까지 만든 ${tot}개 중 μ를 포함한 비율 ${(100 * hit / Math.max(1, tot)).toFixed(1)}%`);
    }
    S.$(".more").addEventListener("click", () => { make(100); draw(); });
    S.$(".one").addEventListener("click", () => { make(1); draw(); });
    S.on(() => { ivs = []; tot = 0; hit = 0; make(100); draw(); }); QSim.redrawOn(draw); make(100); draw();
  })();

  /* 7. 오류와 검정력 (08-02) */
  (() => {
    const S = QSim.card("lab-c7-power"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), n = S.val("n"), sg = 12, d = S.val("d"), al = S.val("al") / 100, two = S.val("side") === "two", se = sg / Math.sqrt(n), m0 = 500, m1 = 500 - d;
      const zc = invPhi(two ? 1 - al / 2 : 1 - al), lo = m0 - zc * se, hi = two ? m0 + zc * se : Infinity;
      const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: 485, x1: 512, y0: 0, y1: phi(0) / se * 1.15, xl: "표본평균 x̄ (g)" }); f.axes();
      const p0 = (x) => phi((x - m0) / se) / se, p1 = (x) => phi((x - m1) / se) / se, g = v.g;
      const shade = (fn, a, b, col) => { a = Math.max(a, 485); b = Math.min(b, 512); if (b <= a) return; g.fillStyle = col; g.globalAlpha = 0.45; g.beginPath(); g.moveTo(f.X(a), f.Y(0)); for (let i = 0; i <= 120; i++) { const x = a + ((b - a) * i) / 120; g.lineTo(f.X(x), f.Y(fn(x))); } g.lineTo(f.X(b), f.Y(0)); g.closePath(); g.fill(); g.globalAlpha = 1; };
      shade(p1, 485, lo, c.main); if (two) shade(p1, hi, 512, c.main);
      shade(p1, lo, two ? hi : 512, c.ink3);
      shade(p0, 485, lo, c.warn); if (two) shade(p0, hi, 512, c.warn);
      f.fn(p0, c.warn, 2.2); f.fn(p1, c.main, 2.2);
      f.path([[lo, 0], [lo, phi(0) / se]], c.ink, 1.5, [4, 3]); if (two) f.path([[hi, 0], [hi, phi(0) / se]], c.ink, 1.5, [4, 3]);
      const power = Phi((lo - m1) / se) + (two ? 1 - Phi((hi - m1) / se) : 0);
      S.out(`H₀: μ = 500 (빨간 곡선), 실제 μ = ${m1} (파란 곡선), σ = 12, n = ${n}, 표준오차 ${se.toFixed(2)}\n기각역: x̄ < ${lo.toFixed(2)}${two ? ` 또는 x̄ > ${hi.toFixed(2)}` : ""} (점선)\n제1종 오류 α = ${(al * 100).toFixed(0)}% (빨간 칠), 제2종 오류 β = ${(100 * (1 - power)).toFixed(1)}% (회색 칠), 검정력 ${(100 * power).toFixed(1)}% (파란 칠)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 8. 회귀 직선 놀이 (10-02) */
  (() => {
    const S = QSim.card("lab-c7-reg"); if (!S) return;
    const cv = S.$("canvas"); let pts = [[1, 52], [2, 55], [3, 61], [4, 64], [5, 70], [6, 72]], fr = null, drag = -1;
    function draw() {
      const c = C(), v = QSim.view(cv, 0.65); fr = QSim.frame(v, { x0: 0, x1: 12, y0: 30, y1: 110, xl: "공부 시간", yl: "점수" }); fr.axes();
      const n = pts.length;
      if (n >= 2) {
        const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]), mx = mean(xs), my = mean(ys);
        const sxy = pts.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0), sxx = xs.reduce((s, x) => s + (x - mx) ** 2, 0), syy = ys.reduce((s, y) => s + (y - my) ** 2, 0);
        const b = sxy / sxx, a = my - b * mx, r = sxy / Math.sqrt(sxx * syy);
        fr.fn((x) => a + b * x, c.acc, 2.2);
        if (S.val("res")) pts.forEach(([x, y]) => fr.path([[x, y], [x, a + b * x]], c.warn, 1.2, [3, 2]));
        fr.dot(mx, my, c.ink, 3);
        S.out(`점 ${n}개 (그림을 눌러 추가, 점을 끌어 이동, 두 번 연속 누르면 삭제)\nŷ = ${a.toFixed(2)} + ${b.toFixed(2)}x, r = ${r.toFixed(3)}, r² = ${(r * r).toFixed(3)}\n10시간 예측 ${(a + b * 10).toFixed(1)}점 (자료 범위 밖 예측은 조심)`);
      } else S.out("점이 두 개 이상 있어야 직선을 그릴 수 있다");
      pts.forEach(([x, y]) => fr.dot(x, y, c.main, 5));
    }
    let last = 0;
    cv.addEventListener("pointerdown", (e) => {
      const [x, y] = posOf(cv, fr, e), i = pts.findIndex((p) => Math.hypot((p[0] - x) * fr.sx, (p[1] - y) * fr.sy) < 12);
      const now = performance.now();
      if (i >= 0 && now - last < 350) { pts.splice(i, 1); drag = -1; draw(); last = 0; return; }
      last = now;
      if (i >= 0) drag = i; else { pts.push([x, y]); drag = pts.length - 1; }
      cv.setPointerCapture(e.pointerId); draw();
    });
    cv.addEventListener("pointermove", (e) => { if (drag < 0) return; const [x, y] = posOf(cv, fr, e); pts[drag] = [Math.max(0, Math.min(12, x)), Math.max(30, Math.min(110, y))]; draw(); });
    cv.addEventListener("pointerup", () => { drag = -1; });
    S.$(".reset").addEventListener("click", () => { pts = [[1, 52], [2, 55], [3, 61], [4, 64], [5, 70], [6, 72]]; draw(); });
    S.$(".outl").addEventListener("click", () => { pts.push([11, 40]); draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
