/* 공통7(통계학입문) 본문 카드의 조작 그림 (js/lib/qfig.js의 NMQ를 쓴다). 그림마다 NMQ.def("이름", …). */
(() => {
  "use strict";
  const Q = window.NMQ;
  if (!Q) return;
  const { el, clear, txt, num } = Q;
  const PI = Math.PI;
  const rect = (g, F, x0, y0, x1, y1, cls) => el("rect", { x: Math.min(F.x(x0), F.x(x1)), y: Math.min(F.y(y0), F.y(y1)), width: Math.abs(F.x(x1) - F.x(x0)), height: Math.abs(F.y(y1) - F.y(y0)), class: cls }, g);
  const poly = (g, F, pts, cls, open) => el("path", { d: pts.map((p, i) => (i ? "L" : "M") + F.x(p[0]).toFixed(1) + " " + F.y(p[1]).toFixed(1)).join("") + (open ? "" : "Z"), class: cls }, g);
  // 가로축만 있는 축: 눈금 값 목록과 이름
  const xax = (g, F, xt, xs, y0) => {
    const y = y0 == null ? 0 : y0;
    Q.line(g, F.X0, F.y(y), F.X1, F.y(y), "ax");
    xt.forEach((v) => { Q.line(g, F.x(v), F.y(y), F.x(v), F.y(y) + 4, "ax"); txt(g, F.x(v), F.y(y) + 16, num(v), "s", "middle"); });
    if (xs) txt(g, F.X1 - 4, F.y(y) - 6, xs, "i", "end");
  };
  // 축과 눈금 글자: xt, yt는 눈금 값 목록
  const axl = (g, F, xt, yt, xs, ys) => {
    Q.axes(g, F, { grid: false, label: false });
    xt.forEach((v) => txt(g, F.x(v), F.y(0) + 14, num(v), "s", "middle"));
    yt.forEach((v) => txt(g, F.x(0) - 5, F.y(v) + 4, num(v), "s", "end"));
    txt(g, F.X1 - 4, F.y(0) - 6, xs, "i", "end"); txt(g, F.x(0) + 6, F.Y0 + 14, ys, "i");
  };
  // 씨앗이 같으면 늘 같은 난수열
  const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const gauss = (R) => { const u = 1 - R(), v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * PI * v); };
  const phi = (z) => Math.exp(-z * z / 2) / Math.sqrt(2 * PI);
  const Phi = (z) => { const t = 1 / (1 + 0.2316419 * Math.abs(z)), d = phi(z) * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429)))); return z >= 0 ? 1 - d : d; };
  const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
  const sd = (a) => { const m = mean(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1)); };
  const quant = (a, p) => { const s = [...a].sort((x, y) => x - y), h = (s.length - 1) * p, i = Math.floor(h); return s[i] + (h - i) * ((s[Math.min(i + 1, s.length - 1)]) - s[i]); };
  // 가로 상자그림: y 픽셀 높이 cy에 그린다 (1.5 IQR 바깥은 점)
  const boxplot = (g, F, a, cy, h, cls) => {
    const q1 = quant(a, 0.25), md = quant(a, 0.5), q3 = quant(a, 0.75), iqr = q3 - q1, lo = q1 - 1.5 * iqr, hi = q3 + 1.5 * iqr;
    const inn = a.filter((v) => v >= lo && v <= hi), wl = Math.min(...inn), wh = Math.max(...inn);
    Q.line(g, F.x(wl), cy, F.x(q1), cy, "k"); Q.line(g, F.x(q3), cy, F.x(wh), cy, "k");
    Q.line(g, F.x(wl), cy - h / 4, F.x(wl), cy + h / 4, "k"); Q.line(g, F.x(wh), cy - h / 4, F.x(wh), cy + h / 4, "k");
    el("rect", { x: F.x(q1), y: cy - h / 2, width: F.x(q3) - F.x(q1), height: h, class: cls || "la" }, g);
    Q.line(g, F.x(md), cy - h / 2, F.x(md), cy + h / 2, "k").setAttribute("style", "stroke-width:2.5");
    a.filter((v) => v < lo || v > hi).forEach((v) => el("circle", { cx: F.x(v), cy, r: 4, class: "fd" }, g));
    return { q1, md, q3, iqr, lo, hi };
  };

  // 1.1 모집단 400명과 표본: 표본평균은 표본마다 달라진다
  Q.def("c7-sample", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const R0 = rng(7), pop = Array.from({ length: 400 }, () => Math.max(3.5, Math.min(10, 6.6 + 1.1 * gauss(R0))));
    const mu = mean(pop);
    Q.bind(fig, ({ n, s }) => {
      clear(g);
      const R = rng(100 + s), idx = new Set();
      while (idx.size < n) idx.add(Math.floor(R() * 400));
      pop.forEach((v, i) => { const x = 22 + (i % 25) * 11, y = 22 + Math.floor(i / 25) * 11; el("rect", { x: x - 4, y: y - 4, width: 8, height: 8, class: idx.has(i) ? "fa" : "lk" }, g); });
      txt(g, 160, 210, "모집단: 학생 400명", "s", "middle");
      const smp = [...idx].map((i) => pop[i]), xb = mean(smp);
      const F = Q.frame(5.5, 7.7, 0, 1, 310, 505, 40, 200), cl = (v) => Math.max(5.5, Math.min(7.7, v));
      xax(g, F, [6, 6.5, 7, 7.5], "수면 시간", 0);
      Q.line(g, F.x(mu), F.y(0), F.x(mu), F.y(0.95), "d").setAttribute("style", "stroke-width:2");
      txt(g, F.x(mu), F.y(0.95) - 6, "μ (모수)", "td", "middle");
      Q.arrow(g, F.x(cl(xb)), F.y(0.55), F.x(cl(xb)), F.y(0.05), "a", "fa"); txt(g, F.x(cl(xb)), F.y(0.55) - 6, "x̄ (통계량)", "ta", "middle");
      read.textContent = `표본 ${n}명의 평균 x̄ = ${num(xb, 2)}시간, 모집단 평균 μ = ${num(mu, 2)}시간. 표본을 다시 뽑으면 x̄는 바뀌지만 μ는 그대로이다.`;
    });
  });

  // 1.2 계급 폭에 따라 달라지는 히스토그램
  Q.def("c7-hist", (fig, svg) => {
    const F = Q.frame(40, 100, 0, 9, 50, 490, 15, 240), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const D = [45, 52, 58, 61, 63, 65, 67, 68, 70, 71, 72, 74, 75, 77, 78, 81, 84, 88, 92, 96];
    Q.bind(fig, ({ w }) => {
      clear(g);
      const cnt = [];
      for (let a = 40; a < 100; a += w) cnt.push([a, D.filter((v) => v >= a && v < a + w).length]);
      const top = Math.max(...cnt.map((c) => c[1]));
      const G = Q.frame(40, 100, 0, Math.max(9, top + 1), 50, 490, 15, 240);
      Q.line(g, G.x(40), G.y(0), G.x(100), G.y(0), "ax");
      for (let a = 40; a <= 100; a += 10) txt(g, G.x(a), G.y(0) + 14, a, "s", "middle");
      cnt.forEach(([a, c]) => { if (c) { rect(g, G, a, 0, a + w, c, "la"); txt(g, G.x(a + w / 2), G.y(c) - 4, c, "s", "middle"); } });
      txt(g, G.x(100) - 4, G.y(0) - 6, "점수", "i", "end");
      read.textContent = `계급 폭 ${w}점, 계급 ${cnt.length}개. ` + (w <= 5 ? "막대가 들쭉날쭉해 모양이 잘 안 보인다." : w >= 20 ? "막대가 셋뿐이라 모양이 뭉개진다." : "√20 ≈ 4.5와 비슷한 계급 수라 70점대 봉우리와 왼쪽 꼬리가 잘 보인다.");
    });
  });

  // 1.3 편향은 표본을 키워도 사라지지 않는다
  Q.def("c7-bias", (fig, svg) => {
    const F = Q.frame(0, 2000, 0.3, 0.7, 60, 490, 15, 240), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    // 모집단 찬성률 0.55, 명단에 오른 층(30%)의 찬성률 0.40
    const est = (n, biased, seed) => { const R = rng(seed); let k = 0; for (let i = 0; i < n; i++) { const p = biased ? 0.4 : 0.55; if (R() < p) k++; } return k / n; };
    const ns = [25, 50, 100, 200, 400, 700, 1000, 1500, 2000];
    Q.bind(fig, ({ n }) => {
      clear(g);
      Q.line(g, F.x(0), F.y(0.3), F.x(2000), F.y(0.3), "ax"); Q.line(g, F.x(0), F.y(0.3), F.x(0), F.y(0.7), "ax");
      [0.4, 0.5, 0.6, 0.7].forEach((v) => txt(g, F.x(0) - 5, F.y(v) + 4, v, "s", "end"));
      [500, 1000, 1500, 2000].forEach((v) => txt(g, F.x(v), F.y(0.3) + 14, v, "s", "middle"));
      txt(g, F.x(2000) - 4, F.y(0.3) - 6, "표본 크기", "i", "end"); txt(g, F.x(0) + 6, F.y(0.7) + 12, "표본 찬성 비율", "i");
      Q.line(g, F.x(0), F.y(0.55), F.x(2000), F.y(0.55), "d dsh"); txt(g, F.x(2000) - 4, F.y(0.55) - 6, "참값 0.55", "td", "end");
      [[false, "a", "fa", 11], [true, "c", "fc", 23]].forEach(([b, cl, fc, sd0]) => {
        const pts = ns.map((m) => [m, est(m, b, sd0 + m)]);
        poly(g, F, pts, cl, true).setAttribute("style", "fill:none");
        pts.forEach(([m, v]) => Q.dot(g, F.x(m), F.y(v), fc, 3));
      });
      const a = est(n, false, 11 + n), b = est(n, true, 23 + n);
      Q.line(g, F.x(n), F.y(0.3), F.x(n), F.y(0.7), "gd dsh");
      read.textContent = `n = ${n}: 무작위 추출(파랑) ${num(a, 3)}, 치우친 명단(주황) ${num(b, 3)}. n이 커지면 파랑은 0.55로, 주황은 0.40으로 모인다.`;
    });
  });

  // 2.1 이상값 하나가 평균·표준편차·중앙값에 주는 영향
  Q.def("c7-outlier", (fig, svg) => {
    const F = Q.frame(0, 42, 0, 1, 40, 500, 20, 250), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ v }) => {
      clear(g);
      const D = [2, 4, 4, 5, 7, 8, v], m = mean(D), s = sd(D), md = quant(D, 0.5);
      xax(g, F, [0, 10, 20, 30, 40], "", 0.35);
      const seen = {};
      D.forEach((x) => { seen[x] = (seen[x] || 0) + 1; el("circle", { cx: F.x(x), cy: F.y(0.35) - 8 - (seen[x] - 1) * 12, r: 5, class: x === v ? "fd" : "fa" }, g); });
      Q.line(g, F.x(m), F.y(0.35), F.x(m), F.y(0.85), "c").setAttribute("style", "stroke-width:2"); txt(g, F.x(m) + 4, F.y(0.85) + 2, `평균 ${num(m, 1)}`, "tc", "start");
      Q.line(g, F.x(md), F.y(0.35), F.x(md), F.y(0.7), "b").setAttribute("style", "stroke-width:2"); txt(g, F.x(md) + 4, F.y(0.7) + 2, `중앙값 ${num(md, 1)}`, "tb", "start");
      el("rect", { x: F.x(m - s), y: F.y(0.97), width: F.x(m + s) - F.x(m - s), height: 8, class: "lc" }, g); txt(g, F.x(m + s) + 4, F.y(0.97) + 8, "평균 ± 표준편차", "s", "start");
      boxplot(g, F, D, F.y(0.13), 18, "lb");
      read.textContent = `자료 2, 4, 4, 5, 7, 8, ${v}: 평균 ${num(m, 2)}, 중앙값 ${num(md, 1)}, 표준편차 ${num(s, 2)}`;
    });
  });

  // 2.2 68-95-99.7 법칙과 체비쇼프 부등식
  Q.def("c7-rule", (fig, svg) => {
    const F = Q.frame(-4, 4, 0, 0.45, 40, 500, 15, 230), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ k }) => {
      clear(g);
      const pts = []; for (let x = -k; x <= k + 1e-9; x += k / 60) pts.push([x, phi(x)]);
      poly(g, F, [[-k, 0], ...pts, [k, 0]], "la");
      Q.plot(g, F, phi, "a", -4, 4, 200);
      Q.line(g, F.x(-4), F.y(0), F.x(4), F.y(0), "ax");
      [-3, -2, -1, 0, 1, 2, 3].forEach((z) => txt(g, F.x(z), F.y(0) + 14, z === 0 ? "평균" : `${z > 0 ? "+" : "−"}${Math.abs(z)}s`, "s", "middle"));
      const p = 2 * Phi(k) - 1, ch = k > 1 ? 1 - 1 / (k * k) : 0;
      txt(g, F.x(0), F.y(0.12), `${num(p * 100, 1)}%`, "s", "middle").setAttribute("style", "font-size:16px");
      read.textContent = `평균 ± ${num(k, 1)}표준편차 안: 종 모양이면 ${num(p * 100, 1)}%, 어떤 분포든 체비쇼프 하한 ${num(ch * 100, 1)}% 이상`;
    });
  });

  // 2.3 R의 summary와 boxplot이 보여 주는 것
  Q.def("c7-summary", (fig, svg) => {
    const F = Q.frame(40, 100, 0, 1, 50, 490, 20, 250), g = el("g", {}, svg);
    const D = [45, 52, 58, 61, 63, 65, 67, 68, 70, 71, 72, 74, 75, 77, 78, 81, 84, 88, 92, 96];
    xax(g, F, [40, 50, 60, 70, 80, 90, 100], "점수", 0.12);
    const b = boxplot(g, F, D, F.y(0.45), 40, "la");
    const lab = [["최솟값", 45], ["Q1", b.q1], ["중앙값", b.md], ["Q3", b.q3], ["최댓값", 96]];
    lab.forEach(([s, v], i) => { const y = F.y(0.45) - 30 - (i % 2) * 18; Q.line(g, F.x(v), y + 4, F.x(v), F.y(0.45) - 22, "gd"); txt(g, F.x(v), y, `${s} ${num(v, 2)}`, "s", "middle"); });
    const m = mean(D); Q.dot(g, F.x(m), F.y(0.45) + 34, "fd", 5); txt(g, F.x(m) + 8, F.y(0.45) + 38, `평균 ${num(m, 2)}`, "td", "start");
    D.forEach((v) => Q.dot(g, F.x(v), F.y(0.2), "fb", 3));
  });

  // 3.1 상대도수는 확률에 다가간다: 주사위 네 번 중 6이 적어도 한 번
  Q.def("c7-freq", (fig, svg) => {
    const F = Q.frame(0, 2000, 0.3, 0.75, 60, 490, 15, 240), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ n, s }) => {
      clear(g);
      Q.line(g, F.x(0), F.y(0.3), F.x(2000), F.y(0.3), "ax"); Q.line(g, F.x(0), F.y(0.3), F.x(0), F.y(0.75), "ax");
      [0.4, 0.5, 0.6, 0.7].forEach((v) => txt(g, F.x(0) - 5, F.y(v) + 4, v, "s", "end"));
      [500, 1000, 1500, 2000].forEach((v) => txt(g, F.x(v), F.y(0.3) + 14, v, "s", "middle"));
      txt(g, F.x(2000) - 4, F.y(0.3) - 6, "되풀이한 횟수", "i", "end"); txt(g, F.x(0) + 6, F.y(0.75) + 12, "상대도수", "i");
      const p = 1 - (5 / 6) ** 4; Q.line(g, F.x(0), F.y(p), F.x(2000), F.y(p), "d dsh"); txt(g, F.x(2000) - 4, F.y(p) - 6, `1 − (5/6)⁴ = ${num(p, 3)}`, "td", "end");
      const R = rng(s * 977 + 3); let k = 0; const pts = [];
      for (let i = 1; i <= n; i++) { let hit = false; for (let j = 0; j < 4; j++) if (R() < 1 / 6) hit = true; if (hit) k++; if (i >= 5) pts.push([i, Math.max(0.3, Math.min(0.75, k / i))]); }
      if (pts.length > 1) poly(g, F, pts, "a", true).setAttribute("style", "fill:none");
      read.textContent = `${n}번 되풀이: 6이 적어도 한 번 나온 비율 ${k}/${n} = ${num(k / n, 3)} (확률 ${num(p, 3)})`;
    });
  });

  // 3.2 베이즈 정리: 가상의 1만 명을 넓이로
  Q.def("c7-bayes", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ p, sp }) => {
      clear(g);
      const prev = p / 100, sens = 0.99, fpr = 1 - sp / 100, X0 = 30, W = 300, Y0 = 20, H = 220;
      const wd = Math.max(W * prev, 3);
      el("rect", { x: X0, y: Y0, width: wd, height: H, class: "lk" }, g); el("rect", { x: X0 + wd, y: Y0, width: W - wd, height: H, class: "lk" }, g);
      el("rect", { x: X0, y: Y0, width: wd, height: H * sens, class: "fd" }, g);
      el("rect", { x: X0 + wd, y: Y0, width: W - wd, height: H * fpr, class: "fc" }, g);
      Q.line(g, X0 + wd, Y0, X0 + wd, Y0 + H, "k");
      txt(g, X0 + wd + 4, Y0 + H + 16, "병 없음 →", "s", "start"); txt(g, X0, Y0 + H + 16, "병 있음", "td", "start");
      const N = 10000, tp = N * prev * sens, fp = N * (1 - prev) * fpr, ppv = tp / (tp + fp);
      txt(g, 350, 60, `진양성 ${num(tp, 0)}명`, "td", "start"); txt(g, 350, 85, `위양성 ${num(fp, 0)}명`, "tc", "start");
      txt(g, 350, 120, "양성일 때 병이 있을 확률", "s", "start"); txt(g, 350, 145, `${num(tp, 0)} / ${num(tp + fp, 0)} = ${num(ppv, 3)}`, "s", "start").setAttribute("style", "font-size:16px");
      read.textContent = `1만 명 중 유병률 ${p}%, 민감도 99%, 특이도 ${sp}%: 양성 ${num(tp + fp, 0)}명 중 실제 환자 ${num(tp, 0)}명 → P(병|양성) = ${num(ppv, 3)}`;
    });
  });

  // 이항·포아송 확률 (로그로 계산해 큰 n에서도 넘치지 않게)
  const lfact = (n) => { let s = 0; for (let i = 2; i <= n; i++) s += Math.log(i); return s; };
  const dbinom = (k, n, p) => (k < 0 || k > n ? 0 : p === 0 ? (k === 0 ? 1 : 0) : p === 1 ? (k === n ? 1 : 0) : Math.exp(lfact(n) - lfact(k) - lfact(n - k) + k * Math.log(p) + (n - k) * Math.log(1 - p)));
  const dpois = (k, l) => Math.exp(-l + k * Math.log(l) - lfact(k));
  // 막대 확률분포: P[k]를 k마다 막대로, hl(k)가 참이면 진하게
  const pmfBars = (g, F, P, hl, w) => P.forEach((p, k) => rect(g, F, k - w / 2, 0, k + w / 2, p, hl(k) ? "fa" : "la"));
  const yax = (g, F, yt, ys) => { Q.line(g, F.X0, F.Y1, F.X0, F.Y0, "ax"); yt.forEach((v) => txt(g, F.X0 - 5, F.y(v) + 4, num(v), "s", "end")); if (ys) txt(g, F.X0 + 6, F.Y0 + 12, ys, "i"); };

  // 4.1 동전 n번의 앞면 수: 기댓값은 무게중심, 분산은 n에 비례
  Q.def("c7-ev", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ n }) => {
      clear(g);
      const F = Q.frame(-0.7, 6.7, 0, 0.55, 50, 490, 15, 225);
      const P = Array.from({ length: n + 1 }, (_, k) => dbinom(k, n, 0.5));
      pmfBars(g, F, P, () => false, 0.6);
      P.forEach((p, k) => txt(g, F.x(k), F.y(p) - 5, num(p, 3), "s", "middle"));
      xax(g, F, Array.from({ length: 7 }, (_, k) => k), "앞면의 수 x", 0); yax(g, F, [0.25, 0.5], "P(X = x)");
      const mu = n / 2, sg = Math.sqrt(n / 4);
      el("path", { d: `M${F.x(mu)} ${F.y(0) + 2}l-9 16h18z`, class: "fd" }, g);
      rect(g, F, mu - sg, 0.52, mu + sg, 0.5, "lc"); txt(g, F.x(mu + sg) + 4, F.y(0.5) - 1, "μ ± σ", "tc", "start");
      read.textContent = `동전 ${n}번: E(X) = ${num(mu, 2)} (빨간 받침점), Var(X) = ${num(n / 4, 2)}, σ = ${num(sg, 3)}. 한 번의 분산 0.25가 ${n}번 더해진다.`;
    });
  });

  // 4.2 이항분포 B(n, p)
  Q.def("c7-binom", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ n, p, k }) => {
      clear(g);
      const P = Array.from({ length: n + 1 }, (_, i) => dbinom(i, n, p)), top = Math.max(...P);
      const F = Q.frame(-0.7, n + 0.7, 0, Math.max(0.1, top * 1.15), 50, 490, 15, 225);
      pmfBars(g, F, P, (i) => i <= k, 0.7);
      rect(g, F, k - 0.35, 0, k + 0.35, P[k], "fd");
      const step = n <= 12 ? 1 : n <= 30 ? 5 : 10;
      xax(g, F, Array.from({ length: Math.floor(n / step) + 1 }, (_, i) => i * step), "성공 횟수", 0);
      yax(g, F, [num(top / 2, 2), num(top, 2)].map(Number), "확률");
      const cum = P.slice(0, Math.min(k, n) + 1).reduce((s, v) => s + v, 0);
      read.textContent = `B(${n}, ${p}): P(X = ${k}) = ${num(P[k] || 0, 3)}(빨강), P(X ≤ ${k}) = ${num(cum, 3)}(파랑 전체), 평균 np = ${num(n * p, 2)}, 표준편차 ${num(Math.sqrt(n * p * (1 - p)), 3)}`;
    });
  });

  // 4.3 이항분포가 포아송 분포로 다가간다 (λ = np 고정)
  Q.def("c7-pois", (fig, svg) => {
    const F = Q.frame(-0.7, 10.7, 0, 0.42, 50, 490, 15, 225), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ l, n }) => {
      clear(g);
      const p = l / n;
      for (let k = 0; k <= 10; k++) { rect(g, F, k - 0.32, 0, k, dbinom(k, n, p), "la"); rect(g, F, k, 0, k + 0.32, dpois(k, l), "lc"); }
      xax(g, F, [0, 2, 4, 6, 8, 10], "횟수 k", 0); yax(g, F, [0.2, 0.4], "확률");
      el("rect", { x: 330, y: 22, width: 12, height: 12, class: "la" }, g); txt(g, 348, 32, `이항 B(${n}, ${num(p, 4)})`, "s", "start");
      el("rect", { x: 330, y: 42, width: 12, height: 12, class: "lc" }, g); txt(g, 348, 52, `포아송 λ = ${l}`, "s", "start");
      read.textContent = `P(X = 0): 이항 ${num(dbinom(0, n, p), 4)}, 포아송 e^(−${l}) = ${num(dpois(0, l), 4)}. n이 커지고 p = λ/n이 작아질수록 두 막대가 같아진다.`;
    });
  });

  // 5.1 균일분포: 확률은 넓이
  Q.def("c7-unif", (fig, svg) => {
    const F = Q.frame(-1, 11, 0, 0.16, 50, 490, 15, 225), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ c, d }) => {
      clear(g);
      const lo = Math.min(c, d), hi = Math.max(c, d);
      rect(g, F, 0, 0, 10, 0.1, "lk");
      rect(g, F, lo, 0, hi, 0.1, "la");
      Q.line(g, F.x(0), F.y(0.1), F.x(10), F.y(0.1), "a").setAttribute("style", "stroke-width:2.5");
      xax(g, F, [0, 2, 4, 6, 8, 10], "대기 시간 (분)", 0); yax(g, F, [0.1], "밀도 f(x)");
      txt(g, F.x((lo + hi) / 2), F.y(0.05), `넓이 ${num((hi - lo) / 10, 2)}`, "s", "middle");
      Q.line(g, F.x(5), F.y(0), F.x(5), F.y(0.13), "d dsh"); txt(g, F.x(5), F.y(0.13) - 4, "μ = 5", "td", "middle");
      read.textContent = `P(${lo} ≤ X ≤ ${hi}) = (${hi} − ${lo}) / 10 = ${num((hi - lo) / 10, 2)}. 밀도의 높이 0.1 자체는 확률이 아니다.`;
    });
  });

  // 5.2 정규분포 N(170, 6²)에서 x보다 클 확률
  Q.def("c7-normal", (fig, svg) => {
    const F = Q.frame(146, 194, 0, 0.075, 50, 490, 15, 225), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const f = (x) => phi((x - 170) / 6) / 6;
    Q.bind(fig, ({ x }) => {
      clear(g);
      const pts = []; for (let t = x; t <= 194; t += 0.5) pts.push([t, f(t)]);
      poly(g, F, [[x, 0], ...pts, [194, 0]], "la");
      Q.plot(g, F, f, "a", 146, 194, 200);
      xax(g, F, [152, 158, 164, 170, 176, 182, 188], "키 (cm)", 0);
      [-3, -2, -1, 1, 2, 3].forEach((z) => txt(g, F.x(170 + 6 * z), F.y(0) + 30, `${z > 0 ? "+" : ""}${z}σ`, "s", "middle"));
      Q.line(g, F.x(x), F.y(0), F.x(x), F.y(f(x)) - 20, "d"); const z = (x - 170) / 6;
      txt(g, F.x(x) + 4, F.y(f(x)) - 22, `z = ${num(z, 2)}`, "td", "start");
      read.textContent = `P(X > ${x}) = P(Z > ${num(z, 2)}) = ${num(1 - Phi(z), 4)} (색칠한 넓이)`;
    });
  });

  // 5.3 지수분포와 무기억성
  Q.def("c7-expo", (fig, svg) => {
    const F = Q.frame(0, 10, 0, 1.05, 50, 490, 15, 225), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ l, s, t }) => {
      clear(g);
      const f = (x) => l * Math.exp(-l * x), pts = []; for (let u = s + t; u <= 10; u += 0.05) pts.push([u, f(u)]);
      if (s > 0) { const q = []; for (let u = s; u <= s + t; u += 0.05) q.push([u, f(u)]); poly(g, F, [[s, 0], ...q, [s + t, 0]], "lk"); }
      poly(g, F, [[s + t, 0], ...pts, [10, 0]], "la");
      Q.plot(g, F, f, "a", 0, 10, 200);
      xax(g, F, [0, 2, 4, 6, 8, 10], "기다린 시간 (분)", 0); yax(g, F, [0.5, 1], "밀도");
      if (s > 0) { Q.line(g, F.x(s), F.y(0), F.x(s), F.y(f(s)), "c"); txt(g, F.x(s), F.y(f(s)) - 6, "이미 기다림", "tc", "middle"); }
      const cond = Math.exp(-l * (s + t)) / Math.exp(-l * s);
      read.textContent = `λ = ${l}/분: P(X > ${s + t} | X > ${s}) = e^(−${l}·${s + t}) / e^(−${l}·${s}) = ${num(cond, 3)} = P(X > ${t}). 이미 ${s}분 기다린 것은 앞으로에 영향이 없다.`;
    });
  });

  // 6.1 표본평균의 분포: 개별 값보다 좁고, 폭은 σ/√n
  Q.def("c7-se", (fig, svg) => {
    const F = Q.frame(20, 80, 0, 0.21, 50, 490, 15, 225), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ n }) => {
      clear(g);
      const se = 10 / Math.sqrt(n), f1 = (x) => phi((x - 50) / 10) / 10, fn = (x) => phi((x - 50) / se) / se;
      const tail = []; for (let x = 53; x <= 80; x += 0.25) tail.push([x, Math.min(fn(x), 0.21)]);
      poly(g, F, [[53, 0], ...tail, [80, 0]], "la");
      Q.plot(g, F, f1, "k", 20, 80, 200);
      Q.plot(g, F, (x) => Math.min(fn(x), 0.21), "a", 20, 80, 400);
      xax(g, F, [20, 30, 40, 50, 60, 70, 80], "", 0);
      Q.line(g, F.x(53), F.y(0), F.x(53), F.y(0.2), "d dsh"); txt(g, F.x(53) + 4, F.y(0.2) + 4, "53", "td", "start");
      txt(g, F.x(30), F.y(0.035) - 6, "개별 값 X", "s", "middle"); txt(g, F.x(50) - 8, F.y(Math.min(fn(50), 0.21)) + 14, "표본평균 X̄", "ta", "end");
      read.textContent = `n = ${n}: SE = 10/√${n} = ${num(se, 2)}, P(X̄ > 53) = P(Z > ${num(3 / se, 2)}) = ${num(1 - Phi(3 / se), 3)}. 개별 값이 53보다 클 확률은 ${num(1 - Phi(0.3), 3)}이다.`;
    });
  });

  // 6.2 중심극한정리: 지수 모집단에서 뽑은 표본평균의 히스토그램
  Q.def("c7-clt", (fig, svg) => {
    const F = Q.frame(0, 3, 0, 1, 50, 490, 15, 225), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ n }) => {
      clear(g);
      const R = rng(31 + n), M = 3000, bins = new Array(60).fill(0);
      for (let r = 0; r < M; r++) { let s = 0; for (let i = 0; i < n; i++) s += -Math.log(1 - R()); const m = s / n, b = Math.floor(m / 0.05); if (b < 60) bins[b]++; }
      const dens = bins.map((c) => c / M / 0.05), top = Math.max(...dens, 1), se = 1 / Math.sqrt(n);
      const G = Q.frame(0, 3, 0, Math.max(top, phi(0) / se) * 1.08, 50, 490, 15, 225);
      dens.forEach((d, b) => { if (d > 0) rect(g, G, b * 0.05, 0, b * 0.05 + 0.05, d, "la"); });
      Q.plot(g, G, (x) => phi((x - 1) / se) / se, "d", 0, 3, 300);
      if (n === 1) Q.plot(g, G, (x) => Math.exp(-x), "c", 0, 3, 200);
      xax(g, G, [0, 0.5, 1, 1.5, 2, 2.5, 3], "표본평균 (천 시간)", 0);
      read.textContent = `지수분포(평균 1, 표준편차 1)에서 n = ${n}개씩 3000번 뽑은 평균의 분포는 ` + (n >= 30 ? `빨간 곡선 N(1, 1/${n})과 거의 겹친다.` : n >= 8 ? "빨간 곡선에 가까워졌지만 오른쪽 꼬리가 아직 길다." : "아직 오른쪽으로 치우쳐 빨간 곡선과 다르다.");
    });
  });

  // 7.1 신뢰구간: 신뢰수준과 표본 크기에 따른 폭
  Q.def("c7-ci", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const zs = { 90: 1.645, 95: 1.96, 99: 2.576 };
    Q.bind(fig, ({ c, n }) => {
      clear(g);
      const F = Q.frame(46, 58, 0, 1, 40, 500, 15, 230);
      xax(g, F, [46, 48, 50, 52, 54, 56, 58], "", 0);
      const se = 8 / Math.sqrt(n), z = zs[c], E = z * se;
      [[90, "lb"], [95, "la"], [99, "lc"]].forEach(([cc, cl], i) => { const e = zs[cc] * se, y = 0.75 - i * 0.2; el("rect", { x: F.x(52.3 - e), y: F.y(y) - 7, width: F.x(52.3 + e) - F.x(52.3 - e), height: 14, class: cc === c ? cl.replace("l", "f") : cl }, g); txt(g, F.x(46) + 2, F.y(y) + 4, `${cc}%`, "s", "start"); });
      Q.line(g, F.x(52.3), F.y(0), F.x(52.3), F.y(0.9), "k"); txt(g, F.x(52.3), F.y(0.9) - 6, "x̄ = 52.3", "s", "middle");
      read.textContent = `n = ${n}, s = 8: SE = ${num(se, 2)}, ${c}% 구간 52.3 ± ${num(z, 3)}×${num(se, 2)} = [${num(52.3 - E, 1)}, ${num(52.3 + E, 1)}] (오차 한계 ${num(E, 2)})`;
    });
  });

  // 7.2 같은 방법으로 만든 구간 50개: 몇 개가 μ를 포함하는가
  Q.def("c7-cimean", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const zs = { 80: 1.2816, 90: 1.645, 95: 1.96, 99: 2.576 };
    Q.bind(fig, ({ c, s }) => {
      clear(g);
      const F = Q.frame(40, 60, 0, 51, 40, 500, 10, 250), R = rng(s * 131 + 7), n = 25, se = 10 / 5, z = zs[c];
      Q.line(g, F.x(50), F.y(0), F.x(50), F.y(51), "d").setAttribute("style", "stroke-width:2"); txt(g, F.x(50) + 4, F.y(51) + 10, "μ = 50", "td", "start");
      let hit = 0;
      for (let i = 0; i < 50; i++) {
        const xb = 50 + se * gauss(R), lo = xb - z * se, hi = xb + z * se, ok = lo <= 50 && 50 <= hi; if (ok) hit++;
        const y = F.y(i + 0.5); Q.line(g, F.x(lo), y, F.x(hi), y, ok ? "a" : "c").setAttribute("style", "stroke-width:2.5"); Q.dot(g, F.x(xb), y, ok ? "fa" : "fc", 2);
      }
      [40, 45, 50, 55, 60].forEach((v) => txt(g, F.x(v), F.y(0) + 14, v, "s", "middle"));
      read.textContent = `${c}% 신뢰구간 50개 가운데 ${hit}개(파랑)가 μ를 포함하고 ${50 - hit}개(주황)는 놓쳤다. 기대 개수는 ${num(0.5 * c, 1)}개이다.`;
    });
  });

  // 8.1 p값: H₀ 아래 표본평균 분포에서 관측값보다 극단적인 넓이
  Q.def("c7-pval", (fig, svg) => {
    const F = Q.frame(492, 508, 0, 0.23, 50, 490, 15, 225), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const f = (x) => phi((x - 500) / 2) / 2;
    Q.bind(fig, ({ xb, side }) => {
      clear(g);
      const z = (xb - 500) / 2, d = Math.abs(xb - 500);
      const shade = (a, b) => { const pts = []; for (let x = a; x <= b + 1e-9; x += 0.1) pts.push([x, f(x)]); poly(g, F, [[a, 0], ...pts, [b, 0]], "fc").setAttribute("style", "opacity:.55"); };
      if (side == 0) { shade(492, 500 - d); shade(500 + d, 508); } else shade(492, Math.min(xb, 500));
      Q.plot(g, F, f, "a", 492, 508, 200);
      xax(g, F, [492, 494, 496, 498, 500, 502, 504, 506, 508], "표본평균 x̄ (g)", 0);
      Q.line(g, F.x(xb), F.y(0), F.x(xb), F.y(0.2), "d").setAttribute("style", "stroke-width:2"); txt(g, F.x(xb), F.y(0.2) - 4, `x̄ = ${xb}`, "td", "middle");
      txt(g, F.x(500), F.y(f(500)) - 6, "H₀: μ = 500일 때", "ta", "middle");
      const p = side == 0 ? 2 * (1 - Phi(Math.abs(z))) : Phi(z);
      read.textContent = `z = (${xb} − 500)/2 = ${num(z, 2)}, ${side == 0 ? "양측" : "단측(μ < 500)"} p값 = ${num(p, 3)} → 유의수준 0.05에서 ` + (p <= 0.05 ? "H₀ 기각" : "H₀ 기각 못 함");
    });
  });

  // 8.2 두 오류와 검정력: H₀ 분포와 실제 분포
  Q.def("c7-power", (fig, svg) => {
    const F = Q.frame(486, 508, 0, 0.42, 50, 490, 15, 225), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ m, n }) => {
      clear(g);
      const se = 12 / Math.sqrt(n), lo = 500 - 1.96 * se, hi = 500 + 1.96 * se;
      const f0 = (x) => phi((x - 500) / se) / se, f1 = (x) => phi((x - m) / se) / se;
      const shade = (f, a, b, cls) => { if (b <= a) return; const pts = []; for (let x = a; x <= b + 1e-9; x += 0.05) pts.push([x, Math.min(f(x), 0.42)]); poly(g, F, [[a, 0], ...pts, [b, 0]], cls); };
      shade(f1, 486, Math.min(lo, 508), "la");
      shade(f0, 486, lo, "fc"); shade(f0, hi, 508, "fc");
      Q.plot(g, F, (x) => Math.min(f0(x), 0.42), "k", 486, 508, 300);
      Q.plot(g, F, (x) => Math.min(f1(x), 0.42), "a", 486, 508, 300);
      Q.line(g, F.x(lo), F.y(0), F.x(lo), F.y(0.4), "d dsh"); txt(g, F.x(lo) - 4, F.y(0.4) + 4, "기각 ←", "td", "end");
      xax(g, F, [486, 490, 494, 498, 502, 506], "표본평균 x̄ (g)", 0);
      txt(g, F.x(500) + 4, F.y(Math.min(f0(500), 0.42)) - 4, "H₀: 500", "s", "start"); txt(g, F.x(m), F.y(Math.min(f1(m), 0.42)) - 6, `실제: ${m}`, "ta", "middle");
      const pw = Phi((lo - m) / se) + 1 - Phi((hi - m) / se);
      read.textContent = `n = ${n}, SE = ${num(se, 2)}: 기각역 x̄ < ${num(lo, 2)} 또는 > ${num(hi, 2)}. α = 0.05(주황), 검정력 = ${num(pw, 3)}(파랑), β = ${num(1 - pw, 3)}`;
    });
  });

  // 8.3 같은 0.3점 차이라도 표본이 크면 유의해진다
  Q.def("c7-bign", (fig, svg) => {
    const F = Q.frame(1, 5, 0, 1, 60, 490, 15, 225), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const pv = (n) => 2 * (1 - Phi(0.3 / (10 / Math.sqrt(n))));
    Q.bind(fig, ({ e }) => {
      clear(g);
      const n = Math.round(10 ** e);
      Q.line(g, F.x(1), F.y(0), F.x(5), F.y(0), "ax"); Q.line(g, F.x(1), F.y(0), F.x(1), F.y(1), "ax");
      [1, 2, 3, 4, 5].forEach((k) => txt(g, F.x(k), F.y(0) + 14, `${10 ** k}`, "s", "middle"));
      [0.05, 0.25, 0.5, 0.75, 1].forEach((v) => txt(g, F.x(1) - 5, F.y(v) + 4, v, "s", "end"));
      txt(g, F.x(5) - 4, F.y(0) - 6, "표본 크기 n (로그 눈금)", "i", "end"); txt(g, F.x(1) + 6, F.y(1) + 12, "p값", "i");
      rect(g, F, 1, 0, 5, 0.05, "lc"); txt(g, F.x(1.05), F.y(0.05) - 4, "유의수준 0.05", "tc", "start");
      Q.plot(g, F, (t) => pv(10 ** t), "a", 1, 5, 300);
      Q.dot(g, F.x(e), F.y(pv(n)), "fd", 5);
      read.textContent = `차이 0.3점, σ = 10, n = ${n}: SE = ${num(10 / Math.sqrt(n), 3)}, z = ${num(0.3 / (10 / Math.sqrt(n)), 2)}, p값 = ${num(pv(n), 4)}. 효과 크기는 n과 상관없이 0.03이다.`;
    });
  });

  // H₀ 아래 정규분포에서 |z| 바깥(양측)을 칠하고 관측값을 표시
  const nullPlot = (g, F, se, obs, lab) => {
    const f = (x) => phi(x / se) / se, d = Math.abs(obs), sh = (a, b) => { if (b <= a) return; const pts = []; for (let x = a; x <= b + 1e-9; x += (F.x1 - F.x0) / 300) pts.push([x, Math.min(f(x), F.y1)]); poly(g, F, [[a, 0], ...pts, [b, 0]], "fc").setAttribute("style", "opacity:.55"); };
    sh(F.x0, -d); sh(d, F.x1);
    Q.plot(g, F, (x) => Math.min(f(x), F.y1), "a", F.x0, F.x1, 300);
    Q.line(g, F.x(obs), F.y(0), F.x(obs), F.y(F.y1 * 0.92), "d").setAttribute("style", "stroke-width:2");
    txt(g, F.x(obs) + 4, F.y(F.y1 * 0.92) + 4, lab, "td", "start");
  };

  // 9.1 두 평균의 차이: 표본 크기에 따라 SE와 p값이 바뀐다
  Q.def("c7-twomean", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ k }) => {
      clear(g);
      const n1 = Math.round(40 * k / 4), n2 = Math.floor(50 * k / 4), se = Math.sqrt(100 / n1 + 144 / n2), z = 5 / se, p = 2 * (1 - Phi(z));
      const F = Q.frame(-14, 14, 0, 0.22, 50, 490, 15, 205);
      nullPlot(g, F, se, 5, "관측 차이 5");
      xax(g, F, [-12, -8, -4, 0, 4, 8, 12], "x̄₁ − x̄₂ (점)", 0);
      const lo = 5 - 1.96 * se, hi = 5 + 1.96 * se, y = 238;
      Q.line(g, F.x(Math.max(lo, -14)), y, F.x(Math.min(hi, 14)), y, "b").setAttribute("style", "stroke-width:4"); Q.dot(g, F.x(5), y, "fb", 4);
      txt(g, F.x(Math.min(hi, 14)) + 6, y + 4, "95% 신뢰구간", "tb", "start");
      read.textContent = `A반 ${n1}명, B반 ${n2}명: SE = ${num(se, 2)}, z = ${num(z, 2)}, 양측 p값 = ${num(p, 3)}, 구간 [${num(lo, 2)}, ${num(hi, 2)}] → ` + (p <= 0.05 ? "기각(구간이 0을 포함하지 않음)" : "기각 못 함(구간이 0을 포함)");
    });
  });

  // 9.2 두 비율의 차이: 같은 30% 대 20%라도 표본이 작으면 유의하지 않다
  Q.def("c7-twoprop", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ n }) => {
      clear(g);
      const p1 = 0.3, p2 = 0.2, pp = 0.25, se0 = Math.sqrt(pp * (1 - pp) * (2 / n)), z = 0.1 / se0, pv = 2 * (1 - Phi(z));
      const F = Q.frame(0, 4, 0, 0.5, 50, 260, 15, 225);
      [[1, p1, "fa", "새 약"], [3, p2, "fc", "위약"]].forEach(([x, p, cl, lab]) => {
        rect(g, F, x - 0.5, 0, x + 0.5, p, cl.replace("f", "l"));
        const e = 1.96 * Math.sqrt(p * (1 - p) / n);
        Q.line(g, F.x(x), F.y(p - e), F.x(x), F.y(p + e), "k").setAttribute("style", "stroke-width:2");
        Q.line(g, F.x(x) - 8, F.y(p - e), F.x(x) + 8, F.y(p - e), "k"); Q.line(g, F.x(x) - 8, F.y(p + e), F.x(x) + 8, F.y(p + e), "k");
        txt(g, F.x(x), F.y(0) + 14, lab, "s", "middle");
      });
      Q.line(g, F.X0, F.y(0), F.X1, F.y(0), "ax"); [0.1, 0.2, 0.3, 0.4].forEach((v) => txt(g, F.X0 - 4, F.y(v) + 4, v, "s", "end"));
      txt(g, F.X0 + 4, F.Y0 + 8, "호전 비율 (±95% 오차 막대)", "i", "start");
      txt(g, 300, 70, `각 집단 ${n}명`, "s", "start").setAttribute("style", "font-size:15px");
      txt(g, 300, 100, `합친 비율 p̂ = 0.25`, "s", "start"); txt(g, 300, 125, `SE = ${num(se0, 4)}`, "s", "start");
      txt(g, 300, 150, `z = ${num(z, 2)}, p값 = ${num(pv, 3)}`, pv <= 0.05 ? "td" : "s", "start");
      read.textContent = `호전 비율 0.30 대 0.20, 각 ${n}명: z = ${num(z, 2)}, 양측 p값 ${num(pv, 3)} → ` + (pv <= 0.05 ? "유의수준 5%에서 차이가 있다." : "차이를 보이기에 증거가 부족하다.");
    });
  });

  // 9.3 짝지은 자료: 같은 자료를 독립 두 집단으로 보면 개인차가 SE에 들어간다
  Q.def("c7-paired", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const B = [72, 85, 64, 90, 78, 69, 95, 81], D = [2, 3, 1, 4, 0, 2, 3, 1], A = B.map((b, i) => b - D[i]);
    Q.bind(fig, ({ m }) => {
      clear(g);
      const F = Q.frame(-0.3, 1.3, 58, 98, 60, 280, 15, 235);
      Q.line(g, F.X0, F.Y1, F.X0, F.Y0, "ax"); [60, 70, 80, 90].forEach((v) => txt(g, F.X0 - 4, F.y(v) + 4, v, "s", "end"));
      txt(g, F.x(0), F.y(58) + 14, "전", "s", "middle"); txt(g, F.x(1), F.y(58) + 14, "후", "s", "middle"); txt(g, F.X0 + 4, F.Y0 + 8, "체중 (kg)", "i", "start");
      B.forEach((b, i) => { if (m == 0) Q.line(g, F.x(0), F.y(b), F.x(1), F.y(A[i]), "gd"); Q.dot(g, F.x(0), F.y(b), "fa", 4); Q.dot(g, F.x(1), F.y(A[i]), "fc", 4); });
      const dbar = mean(D), sdd = sd(D), seP = sdd / Math.sqrt(8), seI = Math.sqrt(sd(B) ** 2 / 8 + sd(A) ** 2 / 8);
      const se = m == 0 ? seP : seI, t = dbar / se;
      txt(g, 310, 60, m == 0 ? "짝지은 분석" : "독립 두 집단으로 잘못 분석", "s", "start").setAttribute("style", "font-size:15px");
      txt(g, 310, 90, `평균 차이 ${num(dbar, 2)} kg`, "s", "start"); txt(g, 310, 115, `SE = ${num(se, 3)}`, "s", "start");
      txt(g, 310, 140, `t = ${num(t, 2)} (기준 2.365)`, t > 2.365 ? "td" : "s", "start");
      read.textContent = m == 0 ? `차이 d만 보면 개인차가 지워져 SE = ${num(seP, 3)}, t = ${num(t, 2)} → 기각.` : `전과 후를 따로 보면 사람마다 다른 체중(약 ${num(sd(B), 1)} kg의 퍼짐)이 SE에 들어가 SE = ${num(seI, 2)}, t = ${num(t, 2)} → 같은 효과를 못 찾는다.`;
    });
  });

  // 10.1 상관계수: 평균점 기준 사분면과 이상값 하나의 영향
  Q.def("c7-corr", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ k, oy }) => {
      clear(g);
      const X = [1, 2, 3, 4, 5], Y = [2, 4, 5, 4, 5];
      if (k == 1) { X.push(12); Y.push(oy); }
      const mx = mean(X), my = mean(Y), sxy = X.reduce((s, x, i) => s + (x - mx) * (Y[i] - my), 0), sxx = X.reduce((s, x) => s + (x - mx) ** 2, 0), syy = Y.reduce((s, y) => s + (y - my) ** 2, 0), r = sxy / Math.sqrt(sxx * syy);
      const F = Q.frame(0, 13, 0, 13, 50, 300, 15, 245);
      axl(g, F, [2, 4, 6, 8, 10, 12], [2, 4, 6, 8, 10, 12], "x", "y");
      Q.line(g, F.x(mx), F.y(0), F.x(mx), F.y(13), "gd dsh"); Q.line(g, F.x(0), F.y(my), F.x(13), F.y(my), "gd dsh");
      X.forEach((x, i) => Q.dot(g, F.x(x), F.y(Y[i]), (x - mx) * (Y[i] - my) >= 0 ? "fa" : "fc", 5));
      txt(g, 330, 70, `r = ${num(r, 3)}`, "s", "start").setAttribute("style", "font-size:18px");
      txt(g, 330, 100, "파랑: 곱이 양수인 점", "ta", "start"); txt(g, 330, 122, "주황: 곱이 음수인 점", "tc", "start");
      txt(g, 330, 150, `평균점 (${num(mx, 2)}, ${num(my, 2)})`, "s", "start");
      read.textContent = k == 1 ? `점 (12, ${oy})를 더하면 r = ${num(r, 3)}. 멀리 떨어진 점 하나의 편차 곱이 합을 좌우한다.` : `x = 1, …, 5, y = 2, 4, 5, 4, 5: 곱의 합 6, r = 6/√60 = ${num(r, 3)}`;
    });
  });

  // 10.2 회귀 직선과 외삽
  Q.def("c7-reg", (fig, svg) => {
    const F = Q.frame(0, 21, 40, 140, 50, 490, 15, 235), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const X = [1, 2, 3, 4, 5, 6], Y = [52, 55, 61, 64, 70, 72], mx = mean(X), my = mean(Y);
    const b = X.reduce((s, x, i) => s + (x - mx) * (Y[i] - my), 0) / X.reduce((s, x) => s + (x - mx) ** 2, 0), a = my - b * mx;
    Q.bind(fig, ({ x }) => {
      clear(g);
      Q.line(g, F.x(0), F.y(40), F.x(21), F.y(40), "ax"); Q.line(g, F.x(0), F.y(40), F.x(0), F.y(140), "ax");
      [0, 5, 10, 15, 20].forEach((v) => txt(g, F.x(v), F.y(40) + 14, v, "s", "middle")); [60, 80, 100, 120, 140].forEach((v) => txt(g, F.x(0) - 5, F.y(v) + 4, v, "s", "end"));
      txt(g, F.x(21) - 4, F.y(40) - 6, "공부 시간 (시간)", "i", "end"); txt(g, F.x(0) + 6, F.y(140) + 12, "점수", "i");
      rect(g, F, 1, 40, 6, 140, "lk").setAttribute("style", "opacity:.5"); txt(g, F.x(3.5), F.y(135), "자료 범위", "s", "middle");
      Q.line(g, F.x(0), F.y(100), F.x(21), F.y(100), "d dsh"); txt(g, F.x(21) - 4, F.y(100) - 5, "만점 100", "td", "end");
      Q.line(g, F.x(1), F.y(a + b), F.x(6), F.y(a + 6 * b), "a").setAttribute("style", "stroke-width:2.5");
      Q.line(g, F.x(6), F.y(a + 6 * b), F.x(21), F.y(a + 21 * b), "a dsh");
      X.forEach((xx, i) => Q.dot(g, F.x(xx), F.y(Y[i]), "fb", 4));
      const yh = a + b * x; Q.dot(g, F.x(x), F.y(Math.min(yh, 140)), x > 6 || x < 1 ? "fc" : "fd", 6);
      read.textContent = `ŷ = ${num(a, 1)} + ${num(b, 2)}×${x} = ${num(yh, 1)}점` + (x > 6 || x < 1 ? " (자료 범위 밖의 외삽이라 믿을 수 없다)" : "");
    });
  });

  // ── 새 그림은 이 위에 ──
})();
