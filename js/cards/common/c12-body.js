/* 공통12(확률통계) 본문 카드의 조작 그림 (js/lib/qfig.js의 NMQ를 쓴다). 그림마다 NMQ.def("이름", …). */
(() => {
  "use strict";
  const Q = window.NMQ;
  if (!Q) return;
  const { el, clear, txt, num } = Q;
  const rect = (g, F, x0, y0, x1, y1, cls) => el("rect", { x: Math.min(F.x(x0), F.x(x1)), y: Math.min(F.y(y0), F.y(y1)), width: Math.abs(F.x(x1) - F.x(x0)), height: Math.abs(F.y(y1) - F.y(y0)), class: cls }, g);
  const poly = (g, F, pts, cls, open) => el("path", { d: pts.map((p, i) => (i ? "L" : "M") + F.x(p[0]).toFixed(1) + " " + F.y(p[1]).toFixed(1)).join("") + (open ? "" : "Z"), class: cls }, g);
  const line = (g, F, pts, cls) => { if (pts.length > 1) poly(g, F, pts, cls, true).setAttribute("style", "fill:none"); };
  const area = (g, F, f, a, b, cls, n) => { const N = n || 80, pts = [[a, 0]]; for (let i = 0; i <= N; i++) { const x = a + (b - a) * i / N; pts.push([x, f(x)]); } pts.push([b, 0]); poly(g, F, pts, cls); };
  const axl = (g, F, xt, yt, xs, ys, xf, yf) => {
    Q.line(g, F.X0, F.Y1, F.X1, F.Y1, "ax"); Q.line(g, F.X0, F.Y1, F.X0, F.Y0, "ax");
    xt.forEach((v) => txt(g, F.x(v), F.Y1 + 14, xf ? xf(v) : num(v), "s", "middle"));
    yt.forEach((v) => txt(g, F.X0 - 5, F.y(v) + 4, yf ? yf(v) : num(v), "s", "end"));
    if (xs) txt(g, F.X1 - 4, F.Y1 - 6, xs, "i", "end");
    if (ys) txt(g, F.X0 + 6, F.Y0 + 12, ys, "i");
  };
  const bars = (g, F, xs, ps, cls, w, dx) => xs.forEach((x, i) => rect(g, F, x - w / 2 + (dx || 0), 0, x + w / 2 + (dx || 0), ps[i], cls));
  // 표준정규 누적분포함수 (오차 약 1e-7)
  const Phi = (z) => { const t = 1 / (1 + 0.2316419 * Math.abs(z)), d = 0.3989422804 * Math.exp(-z * z / 2), p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return z >= 0 ? 1 - p : p; };
  const npdf = (x, m, s) => Math.exp(-((x - m) ** 2) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI));
  const lfact = (n) => { let s = 0; for (let i = 2; i <= n; i++) s += Math.log(i); return s; };
  const comb = (n, k) => (k < 0 || k > n ? 0 : Math.exp(lfact(n) - lfact(k) - lfact(n - k)));
  const binom = (n, p, k) => comb(n, k) * p ** k * (1 - p) ** (n - k);
  const pois = (l, k) => Math.exp(-l + k * Math.log(l) - lfact(k));
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const gauss = (R) => () => Math.sqrt(-2 * Math.log(1 - R())) * Math.cos(2 * Math.PI * R());
  const pct = (p, d) => `${num(100 * p, d == null ? 1 : d)}%`;

  // 1.1 사건의 연산과 합사건의 확률
  Q.def("c12-venn", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const ID = "c12v" + Math.random().toString(36).slice(2, 7);
    const defs = el("defs", {}, svg);
    el("circle", { cx: 200, cy: 115, r: 80 }, el("clipPath", { id: ID + "a" }, defs));
    el("circle", { cx: 300, cy: 115, r: 70 }, el("clipPath", { id: ID + "b" }, defs));
    const S = [
      ["A ∪ B (적어도 하나)", 0.17, "0.12 + 0.08 − 0.03 = 0.17"],
      ["A ∩ B (둘 다)", 0.03, "0.03"],
      ["(A ∪ B)ᶜ (결함 없음)", 0.83, "1 − 0.17 = 0.83"],
      ["A ∩ Bᶜ (긁힘만)", 0.09, "0.12 − 0.03 = 0.09"],
    ];
    Q.bind(fig, ({ e }) => {
      clear(g);
      const sq = el("rect", { x: 40, y: 15, width: 440, height: 200, class: e == 2 ? "la" : "lk" }, g);
      const ca = el("circle", { cx: 200, cy: 115, r: 80, class: e == 0 || e == 3 ? "la" : "lk" }, g);
      const cb = el("circle", { cx: 300, cy: 115, r: 70, class: e == 0 ? "la" : "lk" }, g);
      if (e == 3) el("circle", { cx: 300, cy: 115, r: 70, class: "lk" }, g);
      if (e == 1) el("circle", { cx: 300, cy: 115, r: 70, class: "la", "clip-path": `url(#${ID}a)` }, g);
      el("circle", { cx: 200, cy: 115, r: 80, class: "k" }, g).setAttribute("style", "fill:none");
      el("circle", { cx: 300, cy: 115, r: 70, class: "k" }, g).setAttribute("style", "fill:none");
      sq.setAttribute("stroke-width", "1"); void ca; void cb;
      txt(g, 52, 34, "S", "i", "start");
      txt(g, 150, 70, "A 긁힘 0.12", "s", "middle"); txt(g, 345, 70, "B 치수 0.08", "s", "middle");
      txt(g, 160, 120, "0.09", "s", "middle"); txt(g, 252, 120, "0.03", "s", "middle"); txt(g, 330, 120, "0.05", "s", "middle"); txt(g, 440, 200, "0.83", "s", "middle");
      read.textContent = `${S[e][0]}: P = ${S[e][2]}. 파랑으로 칠한 영역의 넓이가 그 사건의 확률이다.`;
    });
  });

  // 1.2 베이즈 정리: 1000개 가운데 경보가 울린 것
  Q.def("c12-bayes", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ p }) => {
      clear(g);
      const prev = p / 100, sens = 0.95, fpr = 0.03, N = 1000, W = 10.5;
      const nD = Math.round(N * prev), tp = Math.round(nD * sens), fp = Math.round((N - nD) * fpr);
      for (let i = 0; i < N; i++) {
        const r = Math.floor(i / 40), c = i % 40;
        const cls = i < tp ? "fd" : i < nD ? "fb" : i < nD + fp ? "fc" : "lk";
        el("rect", { x: 20 + c * W, y: 15 + r * W, width: W - 1.5, height: W - 1.5, class: cls }, g);
      }
      const post = (prev * sens) / (prev * sens + (1 - prev) * fpr);
      txt(g, 450, 40, `결함 ${nD}개`, "s", "start");
      el("rect", { x: 450, y: 55, width: 10, height: 10, class: "fd" }, g); txt(g, 465, 64, `경보 ${tp}`, "td", "start");
      el("rect", { x: 450, y: 75, width: 10, height: 10, class: "fb" }, g); txt(g, 465, 84, `놓침 ${nD - tp}`, "tb", "start");
      txt(g, 450, 120, `정상 ${N - nD}개`, "s", "start");
      el("rect", { x: 450, y: 135, width: 10, height: 10, class: "fc" }, g); txt(g, 465, 144, `헛경보 ${fp}`, "tc", "start");
      txt(g, 450, 190, `P(D | +)`, "s", "start"); txt(g, 450, 210, `≈ ${num(post, 3)}`, "s", "start");
      read.textContent = `결함 비율 ${num(p, 1)}%: 1000개 가운데 경보가 울린 것은 결함 ${tp}개(빨강)와 헛경보 ${fp}개(주황)이다. 그래서 경보가 울렸을 때 실제로 결함일 확률은 약 ${num(post, 3)}이다.`;
    });
  });

  // 1.3 직렬과 병렬: 펌프 여분과 신뢰도
  Q.def("c12-rel", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ k, r }) => {
      clear(g);
      const rp = r / 100, rv = 0.95, par = 1 - (1 - rp) ** k, R = par * rv;
      const y0 = 110 - (k - 1) * 30;
      Q.line(g, 30, 110, 110, 110, "k");
      for (let i = 0; i < k; i++) {
        const y = y0 + i * 60;
        Q.line(g, 110, 110, 110, y, "k"); Q.line(g, 110, y, 140, y, "k");
        el("rect", { x: 140, y: y - 18, width: 80, height: 36, class: "la" }, g); txt(g, 180, y + 5, `펌프 ${num(rp, 2)}`, "s", "middle");
        Q.line(g, 220, y, 250, y, "k"); Q.line(g, 250, y, 250, 110, "k");
      }
      Q.line(g, 250, 110, 290, 110, "k");
      el("rect", { x: 290, y: 92, width: 90, height: 36, class: "lb" }, g); txt(g, 335, 115, "밸브 0.95", "s", "middle");
      Q.line(g, 380, 110, 420, 110, "k");
      txt(g, 430, 105, "R =", "s", "start"); txt(g, 430, 125, num(R, 4), "s", "start");
      read.textContent = `펌프 ${k}대 병렬: 1 − ${num(1 - rp, 2)}^${k} = ${num(par, 4)}. 밸브와 직렬이므로 R = ${num(par, 4)} × 0.95 = ${num(R, 4)}. 펌프가 모두 독립으로 고장 난다고 가정했다.`;
    });
  });

  // 1.4 초기하분포와 이항분포
  Q.def("c12-hyper", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(-0.6, 4.6, 0, 0.75, 60, 500, 15, 210);
    Q.bind(fig, ({ n }) => {
      clear(g);
      const N = 20, K = 3, p = K / N, xs = [0, 1, 2, 3, 4];
      const hy = xs.map((k) => (k <= n ? comb(K, k) * comb(N - K, n - k) / comb(N, n) : 0)), bi = xs.map((k) => (k <= n ? binom(n, p, k) : 0));
      axl(g, F, xs, [0, 0.25, 0.5, 0.75], "불량 수 k", "P(X = k)");
      bars(g, F, xs, hy, "la", 0.36, -0.19); bars(g, F, xs, bi, "lc", 0.36, 0.19);
      el("rect", { x: 380, y: 30, width: 10, height: 10, class: "la" }, g); txt(g, 395, 39, "되돌려 놓지 않음", "ta", "start");
      el("rect", { x: 380, y: 50, width: 10, height: 10, class: "lc" }, g); txt(g, 395, 59, "되돌려 놓음(이항)", "tc", "start");
      read.textContent = `부품 20개 가운데 불량 3개에서 ${n}개를 검사: 불량이 하나도 안 나올 확률은 되돌려 놓지 않으면 ${num(hy[0], 3)}, 되돌려 놓으면 0.85^${n} = ${num(bi[0], 3)}이다. 평균 불량 수는 둘 다 ${num(n * p, 2)}개이다.`;
    });
  });

  // 2.1 pmf 막대와 cdf 계단
  Q.def("c12-cdf", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(-0.8, 3.8, 0, 1.05, 60, 270, 20, 210), G = Q.frame(-0.8, 3.8, 0, 1.05, 300, 505, 20, 210);
    const p = [0.729, 0.243, 0.027, 0.001], c = [0.729, 0.972, 0.999, 1];
    Q.bind(fig, ({ x }) => {
      clear(g);
      axl(g, F, [0, 1, 2, 3], [0, 0.5, 1], "x", "p(x)"); axl(g, G, [0, 1, 2, 3], [0, 0.5, 1], "x", "F(x)");
      bars(g, F, [0, 1, 2, 3], p, "la", 0.5);
      [0, 1, 2, 3].forEach((k) => { if (k <= x) rect(g, F, k - 0.25, 0, k + 0.25, p[k], "lc"); });
      line(g, G, [[-0.8, 0], [0, 0]], "a");
      [0, 1, 2, 3].forEach((k) => { line(g, G, [[k, c[k]], [k < 3 ? k + 1 : 3.8, c[k]]], "a"); Q.dot(g, G.x(k), G.y(c[k]), "fa", 3); });
      const Fx = x < 0 ? 0 : c[Math.min(3, Math.floor(x))];
      Q.line(g, G.x(x), G.Y1, G.x(x), G.y(Fx), "c dsh"); Q.dot(g, G.x(x), G.y(Fx), "fc");
      read.textContent = `F(${num(x, 1)}) = P(X ≤ ${num(x, 1)}) = ${num(Fx, 3)}. 왼쪽에서 주황 막대(x 이하인 값)를 모두 더한 값이고, 계단은 각 정수에서 p(x)만큼 뛴다.`;
    });
  });

  // 2.2 확률은 넓이
  Q.def("c12-pdfarea", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(-0.2, 2.3, 0, 1.6, 60, 500, 15, 210), f = (x) => (x >= 0 && x <= 2 ? 0.375 * x * x : 0);
    Q.bind(fig, ({ a, b }) => {
      clear(g);
      const lo = Math.min(a, b), hi = Math.max(a, b), P = (hi ** 3 - lo ** 3) / 8;
      axl(g, F, [0, 0.5, 1, 1.5, 2], [0, 0.5, 1, 1.5], "x", "f(x)");
      area(g, F, f, lo, hi, "la");
      Q.plot(g, F, f, "a", -0.2, 2.3, 300);
      const m = Math.cbrt(4); Q.line(g, F.x(m), F.Y1, F.x(m), F.y(f(m)), "d dsh"); txt(g, F.x(m), F.y(f(m)) - 6, "중앙값", "td", "middle");
      read.textContent = `P(${num(lo, 2)} ≤ X ≤ ${num(hi, 2)}) = F(${num(hi, 2)}) − F(${num(lo, 2)}) = (${num(hi, 2)}³ − ${num(lo, 2)}³)/8 = ${num(P, 4)}. 밀도 f(2) = 1.5처럼 1을 넘는 곳이 있어도 넓이는 1을 넘지 않는다.`;
    });
  });

  // 3.1 무게중심과 체비쇼프
  Q.def("c12-cheb", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ d, k }) => {
      clear(g);
      if (d == 0) {
        const F = Q.frame(0.3, 6.7, 0, 0.3, 60, 500, 15, 200), mu = 3.5, sd = Math.sqrt(35 / 12);
        axl(g, F, [1, 2, 3, 4, 5, 6], [0, 0.1, 0.2], "x", "p(x)");
        [1, 2, 3, 4, 5, 6].forEach((x) => rect(g, F, x - 0.3, 0, x + 0.3, 1 / 6, Math.abs(x - mu) >= k * sd ? "lc" : "la"));
        const out = [1, 2, 3, 4, 5, 6].filter((x) => Math.abs(x - mu) >= k * sd).length / 6;
        el("path", { d: `M${F.x(mu)} ${F.Y1}l-8 14h16z`, class: "fk" }, g); txt(g, F.x(mu), F.Y1 + 28, "μ = 3.5", "s", "middle");
        [-1, 1].forEach((s) => Q.line(g, F.x(mu + s * k * sd), F.Y0, F.x(mu + s * k * sd), F.Y1, "d dsh"));
        read.textContent = `주사위: μ = 3.5, σ = ${num(sd, 3)}. |X − μ| ≥ ${num(k, 1)}σ인 확률은 ${num(out, 3)}(주황)이고, 체비쇼프 한계 1/k² = ${num(Math.min(1, 1 / (k * k)), 3)}보다 작거나 같다.`;
      } else {
        const F = Q.frame(-0.1, 2.2, 0, 1.6, 60, 500, 15, 200), f = (x) => (x >= 0 && x <= 2 ? 0.375 * x * x : 0), mu = 1.5, sd = Math.sqrt(0.15);
        axl(g, F, [0, 0.5, 1, 1.5, 2], [0, 0.5, 1, 1.5], "x", "f(x)");
        const a = mu - k * sd, b = mu + k * sd;
        if (a > 0) area(g, F, f, 0, a, "lc"); if (b < 2) area(g, F, f, b, 2, "lc");
        Q.plot(g, F, f, "a", -0.1, 2.2, 300);
        const out = (Math.max(0, Math.min(2, a)) ** 3) / 8 + (b < 2 ? 1 - b ** 3 / 8 : 0);
        el("path", { d: `M${F.x(mu)} ${F.Y1}l-8 14h16z`, class: "fk" }, g); txt(g, F.x(mu), F.Y1 + 28, "μ = 1.5", "s", "middle");
        [a, b].forEach((v) => Q.line(g, F.x(v), F.Y0, F.x(v), F.Y1, "d dsh"));
        read.textContent = `f(x) = 3x²/8: μ = 1.5, σ = ${num(sd, 3)}. |X − μ| ≥ ${num(k, 1)}σ인 확률은 ${num(out, 3)}(주황)이고, 체비쇼프 한계 ${num(Math.min(1, 1 / (k * k)), 3)}보다 작거나 같다.`;
      }
    });
  });

  // 3.2 적률생성함수: 0에서의 기울기와 휨
  Q.def("c12-mgf", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(-1, 1, 0, 4, 60, 500, 15, 210);
    Q.bind(fig, ({ l }) => {
      clear(g);
      const M = (t) => (t < l ? l / (l - t) : NaN);
      axl(g, F, [-1, -0.5, 0, 0.5, 1], [1, 2, 3, 4], "t", "M(t)");
      Q.line(g, F.x(0), F.Y0, F.x(0), F.Y1, "gd");
      Q.plot(g, F, M, "a", -1, Math.min(1, l - 0.01), 300);
      Q.plot(g, F, (t) => 1 + t / l, "c", -1, 1, 2);
      Q.dot(g, F.x(0), F.y(1), "fk");
      txt(g, F.x(0.95), F.y(1 + 0.95 / l) + 16, "기울기 M′(0)", "tc", "end");
      read.textContent = `λ = ${num(l, 2)}: M(t) = λ/(λ − t). 평균은 0에서의 기울기 M′(0) = 1/λ = ${num(1 / l, 3)}, 분산은 M″(0) − M′(0)² = ${num(2 / l / l, 3)} − ${num(1 / l / l, 3)} = ${num(1 / l / l, 3)}이다. t가 λ에 다가가면 M(t)는 무한히 커진다.`;
    });
  });

  // 4.1 이항분포와 포아송 근사
  Q.def("c12-binpois", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ n, l }) => {
      clear(g);
      const lam = l / 10, p = lam / n, K = Math.max(8, Math.ceil(lam + 4 * Math.sqrt(lam))), xs = Array.from({ length: K + 1 }, (_, i) => i);
      const B = xs.map((k) => (k <= n ? binom(n, p, k) : 0)), P = xs.map((k) => pois(lam, k));
      const top = Math.max(...B, ...P) * 1.15, F = Q.frame(-0.7, K + 0.7, 0, top, 60, 500, 15, 210);
      axl(g, F, xs.filter((k) => k % Math.ceil(K / 10) === 0), [0, num(top / 2, 2)].map(Number), "k", "P");
      bars(g, F, xs, B, "la", 0.6);
      xs.forEach((k) => Q.dot(g, F.x(k), F.y(P[k]), "fc", 3.5));
      const d = Math.max(...xs.map((k) => Math.abs(B[k] - P[k])));
      read.textContent = `이항 B(${n}, ${num(p, 4)}) 막대(파랑)와 포아송 λ = np = ${num(lam, 1)} 점(주황). 가장 큰 차이 ${num(d, 4)}. n이 크고 p가 작을수록 두 분포가 겹친다.`;
    });
  });

  // 4.2 지수분포의 무기억성
  Q.def("c12-memless", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(0, 3000, 0, 1.05, 60, 500, 15, 210), S = (t) => Math.exp(-t / 1000);
    Q.bind(fig, ({ s }) => {
      clear(g);
      axl(g, F, [0, 1000, 2000, 3000], [0, 0.5, 1], "t (시간)", "P(T > t)");
      Q.plot(g, F, S, "a", 0, 3000, 200);
      Q.plot(g, F, (t) => (t >= s ? S(t) / S(s) : NaN), "c", s, 3000, 200);
      Q.line(g, F.x(s), F.Y1, F.x(s), F.y(1), "c dsh");
      const t = 500;
      Q.dot(g, F.x(t), F.y(S(t)), "fa"); Q.dot(g, F.x(s + t), F.y(S(s + t) / S(s)), "fc");
      txt(g, F.x(s) + 4, F.y(1) + 14, `s = ${s}시간 살아남음`, "tc", "start");
      read.textContent = `이미 ${s}시간 작동한 부품이 500시간 더 갈 확률 P(T > ${s + 500} | T > ${s}) = e^(−${num((s + 500) / 1000, 2)})/e^(−${num(s / 1000, 2)}) = ${num(S(s + t) / S(s), 3)}. 새 부품의 P(T > 500) = ${num(S(t), 3)}과 같다. 주황 곡선은 파랑 곡선을 옆으로 옮긴 것이다.`;
    });
  });

  // 4.3 정규분포와 규격
  Q.def("c12-spec", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(24.92, 25.08, 0, 42, 60, 500, 15, 210);
    Q.bind(fig, ({ s }) => {
      clear(g);
      const sd = s / 1000, f = (x) => npdf(x, 25, sd), z = 0.03 / sd, bad = 2 * (1 - Phi(z));
      axl(g, F, [24.94, 24.97, 25, 25.03, 25.06], [0, 20, 40], "지름 (mm)", "f");
      area(g, F, f, 24.92, 24.97, "lc", 60); area(g, F, f, 25.03, 25.08, "lc", 60); area(g, F, f, 24.97, 25.03, "la", 80);
      Q.plot(g, F, f, "a", 24.92, 25.08, 300);
      [24.97, 25.03].forEach((v) => Q.line(g, F.x(v), F.Y0, F.x(v), F.Y1, "d dsh"));
      txt(g, F.x(25.03) + 4, F.Y0 + 14, "규격 한계", "td", "start");
      read.textContent = `σ = ${num(sd, 4)} mm: 규격 ±0.03은 ±${num(z, 2)}σ이다. 규격 안 ${num(1 - bad, 3)}, 불량 ${pct(bad, 2)}. 불량을 1% 이하로 하려면 0.03/σ ≥ 2.576, 곧 σ ≤ 0.0116 mm이다.`;
    });
  });

  // 5.1 결합분포에서 주변분포와 조건부분포
  Q.def("c12-joint", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const P = [[0.10, 0.20, 0.10], [0.15, 0.25, 0.20]], px = [0.4, 0.6], py = [0.25, 0.45, 0.30];
    Q.bind(fig, ({ c }) => {
      clear(g);
      const W = 70, H = 40, X = 90, Y = 40;
      ["Y = 0", "Y = 1", "Y = 2", "p_X"].forEach((s, j) => txt(g, X + j * W + W / 2, Y - 8, s, "s", "middle"));
      ["X = 0", "X = 1", "p_Y"].forEach((s, i) => txt(g, X - 10, Y + i * H + 25, s, "s", "end"));
      for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) { el("rect", { x: X + j * W, y: Y + i * H, width: W - 4, height: H - 4, class: c - 1 === i ? "lc" : c == 0 ? "la" : "lk" }, g); txt(g, X + j * W + W / 2 - 2, Y + i * H + 24, num(P[i][j], 2), "s", "middle"); }
      px.forEach((v, i) => { el("rect", { x: X + 3 * W, y: Y + i * H, width: W - 4, height: H - 4, class: c - 1 === i ? "lc" : "lb" }, g); txt(g, X + 3 * W + W / 2 - 2, Y + i * H + 24, num(v, 2), "s", "middle"); });
      py.forEach((v, j) => { el("rect", { x: X + j * W, y: Y + 2 * H, width: W - 4, height: H - 4, class: c == 0 ? "lb" : "lk" }, g); txt(g, X + j * W + W / 2 - 2, Y + 2 * H + 24, num(v, 2), "s", "middle"); });
      const G = Q.frame(-0.6, 2.6, 0, 0.6, 420, 510, 40, 160), d = c == 0 ? py : P[c - 1].map((v) => v / px[c - 1]);
      bars(g, G, [0, 1, 2], d, c == 0 ? "lb" : "lc", 0.6); Q.line(g, G.X0, G.Y1, G.X1, G.Y1, "ax");
      [0, 1, 2].forEach((k) => txt(g, G.x(k), G.Y1 + 14, k, "s", "middle"));
      txt(g, 465, 30, c == 0 ? "p_Y(y)" : `p(y | X = ${c - 1})`, "s", "middle");
      const m = d.reduce((s, v, k) => s + k * v, 0);
      read.textContent = c == 0 ? "주변분포는 표의 가장자리 합이다. Y의 주변분포는 0.25, 0.45, 0.30이고 평균은 1.05이다." : `X = ${c - 1}인 행만 남기고 그 행의 합(${num(px[c - 1], 2)})으로 나누면 조건부분포가 된다. 조건부 확률은 차례로 ${d.map((v) => num(v, 3)).join(", ")}, 조건부 평균은 ${num(m, 3)}이다.`;
    });
  });

  // 5.2 결합 = 주변의 곱인가
  Q.def("c12-prod", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const A = [[0.10, 0.20, 0.10], [0.15, 0.25, 0.20]], px = [0.4, 0.6], py = [0.25, 0.45, 0.30], I = px.map((a) => py.map((b) => a * b));
    Q.bind(fig, ({ t }) => {
      clear(g);
      const P = t == 0 ? A : I, F = Q.frame(-0.5, 5.5, 0, 0.3, 60, 500, 25, 200);
      axl(g, F, [], [0, 0.1, 0.2, 0.3], "", "확률");
      let bad = 0;
      for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) {
        const k = i * 3 + j, prod = px[i] * py[j], same = Math.abs(P[i][j] - prod) < 1e-9; if (!same) bad++;
        rect(g, F, k - 0.35, 0, k, P[i][j], same ? "la" : "lc"); rect(g, F, k, 0, k + 0.35, prod, "lb");
        txt(g, F.x(k), F.Y1 + 14, `(${i},${j})`, "s", "middle");
      }
      el("rect", { x: 330, y: 12, width: 10, height: 10, class: "la" }, g); txt(g, 345, 21, "p(x, y)", "s", "start");
      el("rect", { x: 410, y: 12, width: 10, height: 10, class: "lb" }, g); txt(g, 425, 21, "p_X(x)·p_Y(y)", "s", "start");
      read.textContent = t == 0 ? `5.1절의 표: 여섯 칸 가운데 ${bad}칸에서 결합 확률(주황)이 주변의 곱과 다르다. 한 칸이라도 다르면 독립이 아니다.` : "주변분포는 같게 두고 각 칸을 주변의 곱으로 바꾼 표이다. 모든 칸에서 두 막대가 같으므로 X와 Y는 독립이다.";
    });
  });

  // 5.3 상관계수와 산점도
  Q.def("c12-corr", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const R = rng(7), N = gauss(R), Z = Array.from({ length: 200 }, () => [N(), N()]);
    const F = Q.frame(-3.2, 3.2, -3.2, 3.2, 140, 380, 10, 250);
    Q.bind(fig, ({ r }) => {
      clear(g);
      const rho = r / 100, pts = Z.map(([a, b]) => [a, rho * a + Math.sqrt(1 - rho * rho) * b]);
      Q.line(g, F.X0, F.y(0), F.X1, F.y(0), "gd"); Q.line(g, F.x(0), F.Y0, F.x(0), F.Y1, "gd");
      txt(g, F.X1 - 2, F.y(0) - 5, "X", "i", "end"); txt(g, F.x(0) + 5, F.Y0 + 12, "Y", "i");
      pts.forEach(([x, y]) => Q.dot(g, F.x(x), F.y(y), "fa", 2.2));
      const mx = pts.reduce((s, p) => s + p[0], 0) / 200, my = pts.reduce((s, p) => s + p[1], 0) / 200;
      let sxy = 0, sxx = 0, syy = 0; pts.forEach(([x, y]) => { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2; });
      txt(g, 395, 60, `ρ = ${num(rho, 2)}`, "s", "start"); txt(g, 395, 85, `표본 r = ${num(sxy / Math.sqrt(sxx * syy), 2)}`, "ta", "start");
      txt(g, 395, 125, "Var(X + Y)", "s", "start"); txt(g, 395, 145, `= 1 + 1 + 2ρ = ${num(2 + 2 * rho, 2)}`, "s", "start");
      read.textContent = `σ_X = σ_Y = 1이고 상관계수 ρ = ${num(rho, 2)}인 점 200개. ρ가 1에 가까울수록 점이 직선에 모이고, X + Y의 분산은 2 + 2ρ = ${num(2 + 2 * rho, 2)}가 된다.`;
    });
  });

  // 6.1 변환 Y = X²: 구간이 줄면 밀도가 높아진다
  Q.def("c12-transform", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(0, 1, 0, 1, 60, 250, 20, 210), G = Q.frame(0, 1, 0, 4, 300, 500, 20, 210);
    Q.bind(fig, ({ a }) => {
      clear(g);
      const y = a / 100, x = Math.sqrt(y);
      axl(g, F, [0, 0.5, 1], [0, 0.5, 1], "x", "y = x²");
      rect(g, F, 0, 0, x, 0.06, "lc"); rect(g, F, 0, 0, 0.06, y, "la");
      Q.plot(g, F, (t) => t * t, "a", 0, 1, 100);
      Q.line(g, F.X0, F.y(y), F.x(x), F.y(y), "d dsh"); Q.line(g, F.x(x), F.y(y), F.x(x), F.Y1, "d dsh");
      axl(g, G, [0, 0.5, 1], [0, 2, 4], "y", "Y의 밀도");
      area(g, G, (t) => 1 / (2 * Math.sqrt(t)), Math.max(0.0025, 0), y, "la", 80);
      Q.plot(g, G, (t) => (t > 0 ? 1 / (2 * Math.sqrt(t)) : NaN), "a", 0.004, 1, 200);
      read.textContent = `P(Y ≤ ${num(y, 2)}) = P(X ≤ √${num(y, 2)}) = ${num(x, 3)}. X의 구간 [0, ${num(x, 3)}](주황)이 Y의 더 짧은 구간 [0, ${num(y, 2)}](파랑)으로 눌리므로, 0 근처에서 Y의 밀도 1/(2√y)가 커진다.`;
    });
  });

  // 6.2 공차 누적: 최악 조건과 통계적 방법
  Q.def("c12-stack", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ n }) => {
      clear(g);
      const wc = 0.03 * n, sd = 0.01 * Math.sqrt(n), rss = 3 * sd, L = 10 * n;
      const F = Q.frame(-0.4 * 1.05, 0.4 * 1.05, 0, 1 / (sd * Math.sqrt(2 * Math.PI)) * 1.15, 60, 500, 20, 200);
      Q.line(g, F.X0, F.Y1, F.X1, F.Y1, "ax");
      [-0.3, -0.15, 0, 0.15, 0.3].forEach((v) => txt(g, F.x(v), F.Y1 + 14, (v > 0 ? "+" : v < 0 ? "−" : "") + num(Math.abs(v), 2), "s", "middle"));
      txt(g, F.X1 - 4, F.Y1 - 6, `전체 길이 − ${L} (mm)`, "i", "end");
      area(g, F, (x) => npdf(x, 0, sd), -rss, rss, "la", 80);
      Q.plot(g, F, (x) => npdf(x, 0, sd), "a", F.x0, F.x1, 300);
      [-wc, wc].forEach((v) => Q.line(g, F.x(v), F.Y0, F.x(v), F.Y1, "c dsh"));
      [-rss, rss].forEach((v) => Q.line(g, F.x(v), F.Y0 + 30, F.x(v), F.Y1, "a"));
      txt(g, F.x(wc) + 4, F.Y0 + 12, `최악 ±${num(wc, 2)}`, "tc", "start");
      txt(g, F.x(rss) + 4, F.Y0 + 44, `±3σ = ±${num(rss, 3)}`, "ta", "start");
      read.textContent = `블록 ${n}개: 최악 조건 공차 ±0.03 × ${n} = ±${num(wc, 2)} mm, 통계적 공차 ±3 × 0.01√${n} = ±${num(rss, 3)} mm. 비율은 1/√${n} = ${num(1 / Math.sqrt(n), 2)}로, 블록이 많을수록 차이가 커진다.`;
    });
  });

  // 6.3 지수분포 평균의 분포와 정규 근사
  Q.def("c12-clt", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(0, 2.5, 0, 4.2, 60, 500, 15, 210);
    Q.bind(fig, ({ n }) => {
      clear(g);
      const ln = lfact(n - 1), f = (x) => (x > 0 ? Math.exp(n * Math.log(n) + (n - 1) * Math.log(x) - n * x - ln) : 0), s = 1 / Math.sqrt(n);
      axl(g, F, [0, 0.5, 1, 1.5, 2, 2.5], [0, 2, 4], "표본평균", "밀도");
      Q.plot(g, F, f, "a", 0.001, 2.5, 400); Q.plot(g, F, (x) => npdf(x, 1, s), "c", 0, 2.5, 400);
      let ex = 0; const h = 0.0005; for (let x = 1.2; x < 6; x += h) ex += f(x + h / 2) * h;
      const nz = 1 - Phi(0.2 * Math.sqrt(n));
      txt(g, F.x(2.45), F.Y0 + 14, "평균의 실제 분포", "ta", "end"); txt(g, F.x(2.45), F.Y0 + 32, "정규 근사 N(1, 1/n)", "tc", "end");
      read.textContent = `Exp(1) ${n}개의 평균: 실제 분포(파랑)와 정규 근사(주황). P(평균 > 1.2)는 실제 ${num(ex, 4)}, 정규 근사 ${num(nz, 4)}이다. n이 커질수록 치우침이 사라지고 두 곡선이 겹친다.`;
    });
  });

  // 6.4 직렬과 병렬 시스템의 생존 곡선
  Q.def("c12-minmax", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(0, 4000, 0, 1.05, 60, 500, 15, 210);
    Q.bind(fig, ({ n, t }) => {
      clear(g);
      const S = (x) => Math.exp(-x / 1000), ser = (x) => S(x) ** n, par = (x) => 1 - (1 - S(x)) ** n;
      axl(g, F, [0, 1000, 2000, 3000, 4000], [0, 0.5, 1], "t (시간)", "작동 확률");
      Q.plot(g, F, S, "gd", 0, 4000, 200); Q.plot(g, F, ser, "c", 0, 4000, 200); Q.plot(g, F, par, "a", 0, 4000, 200);
      Q.line(g, F.x(t), F.Y0, F.x(t), F.Y1, "k dsh");
      Q.dot(g, F.x(t), F.y(ser(t)), "fc"); Q.dot(g, F.x(t), F.y(par(t)), "fa");
      let H = 0; for (let i = 1; i <= n; i++) H += 1 / i;
      txt(g, F.x(2300), F.y(par(2300)) - 10, "병렬 (최댓값)", "ta", "start"); txt(g, F.x(600), F.y(0.08), "직렬 (최솟값)", "tc", "start");
      read.textContent = `부품 ${n}개, t = ${t}시간: 직렬 e^(−${n}t/1000) = ${num(ser(t), 4)}, 병렬 1 − (1 − e^(−t/1000))^${n} = ${num(par(t), 4)}. 평균 수명은 직렬 ${num(1000 / n, 0)}시간, 병렬 ${num(1000 * H, 0)}시간이다.`;
    });
  });

  // 7.1 신뢰구간 20개 가운데 몇 개가 μ를 덮는가
  Q.def("c12-ci", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(11.6, 13.0, 0, 21, 60, 500, 15, 220), mu = 12.3, sd = 0.5;
    Q.bind(fig, ({ k, n }) => {
      clear(g);
      const R = rng(100 + k), N = gauss(R), z = 1.96;
      axl(g, F, [11.8, 12.1, 12.3, 12.5, 12.8], [], "강도 (kN)");
      Q.line(g, F.x(mu), F.Y0, F.x(mu), F.Y1, "k dsh"); txt(g, F.x(mu), F.Y0 + 8, "μ", "i", "middle");
      let hit = 0;
      for (let i = 0; i < 20; i++) {
        let s = 0; for (let j = 0; j < n; j++) s += mu + sd * N();
        const m = s / n, e = z * sd / Math.sqrt(n), ok = m - e <= mu && mu <= m + e; if (ok) hit++;
        const y = F.y(i + 1);
        Q.line(g, F.x(m - e), y, F.x(m + e), y, ok ? "a" : "d").setAttribute("style", "stroke-width:2.5");
        Q.dot(g, F.x(m), y, ok ? "fa" : "fd", 2.5);
      }
      read.textContent = `n = ${n}인 표본 20번으로 만든 95% 신뢰구간 가운데 ${hit}개가 μ = 12.3을 덮었다(빨강은 놓친 것). 구간의 반폭은 1.96 × 0.5/√${n} = ${num(z * sd / Math.sqrt(n), 3)} kN이다. 무리를 바꿔 보면 평균적으로 20개 가운데 19개쯤이 μ를 덮는다.`;
    });
  });

  // 7.2 z 검정과 p-값
  Q.def("c12-ztest", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(-4, 4, 0, 0.45, 60, 500, 15, 210);
    Q.bind(fig, ({ m }) => {
      clear(g);
      const xb = m / 10, z = (xb - 500) / 1, p = 2 * (1 - Phi(Math.abs(z))), f = (x) => npdf(x, 0, 1);
      axl(g, F, [-3, -1.96, 0, 1.96, 3], [], "z", "", (v) => num(v, 2));
      const a = Math.abs(z); if (a < 4) { area(g, F, f, -4, -a, "lc", 60); area(g, F, f, a, 4, "lc", 60); }
      Q.plot(g, F, f, "a", -4, 4, 300);
      [-1.96, 1.96].forEach((v) => Q.line(g, F.x(v), F.Y0 + 40, F.x(v), F.Y1, "d dsh"));
      Q.line(g, F.x(Math.max(-4, Math.min(4, z))), F.Y0, F.x(Math.max(-4, Math.min(4, z))), F.Y1, "c");
      txt(g, F.x(Math.max(-3.8, Math.min(3.8, z))), F.Y0 + 12, `z = ${num(z, 2)}`, "tc", "middle");
      read.textContent = `x̄ = ${num(xb, 1)} mL: z = (${num(xb, 1)} − 500)/(6/√36) = ${num(z, 2)}, 양쪽 p-값 ${num(p, 4)}. ` + (p <= 0.05 ? "0.05 이하이므로 H₀(μ = 500)을 기각한다." : "0.05보다 크므로 H₀을 기각하지 못한다.");
    });
  });

  // 7.3 잔차 그림
  Q.def("c12-resid", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const D = [
      [[20, 0.52], [40, 0.71], [60, 0.95], [80, 1.12], [100, 1.38]],
      [[20, 0.40], [40, 0.62], [60, 0.95], [80, 1.38], [100, 1.92]],
    ];
    Q.bind(fig, ({ d }) => {
      clear(g);
      const P = D[d], n = P.length, mx = P.reduce((s, p) => s + p[0], 0) / n, my = P.reduce((s, p) => s + p[1], 0) / n;
      let sxy = 0, sxx = 0, syy = 0; P.forEach(([x, y]) => { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2; });
      const b1 = sxy / sxx, b0 = my - b1 * mx, e = P.map(([x, y]) => y - b0 - b1 * x), R2 = 1 - e.reduce((s, v) => s + v * v, 0) / syy;
      const F = Q.frame(10, 110, 0.2, 2.1, 60, 260, 20, 200), G = Q.frame(10, 110, -0.12, 0.12, 310, 505, 20, 200);
      axl(g, F, [20, 60, 100], [0.5, 1, 1.5, 2], "x (°C)", "y (mm)");
      Q.plot(g, F, (x) => b0 + b1 * x, "c", 10, 110, 2); P.forEach(([x, y]) => Q.dot(g, F.x(x), F.y(y), "fa"));
      axl(g, G, [20, 60, 100], [-0.1, 0, 0.1], "x", "잔차");
      Q.line(g, G.X0, G.y(0), G.X1, G.y(0), "k dsh"); P.forEach(([x], i) => Q.dot(g, G.x(x), G.y(e[i]), "fd"));
      read.textContent = `직선 ŷ = ${num(b0, 3)} + ${num(b1, 5)}x, R² = ${num(R2, 3)}. 잔차 ${e.map((v) => num(v, 3)).join(", ")}. ` + (d == 0 ? "부호가 번갈아 바뀌고 무늬가 없어 직선 모형이 알맞아 보인다." : "R²가 높아도 잔차가 양 끝은 양수, 가운데는 음수인 U자라 곡선 관계이다.");
    });
  });

  // ── 새 그림은 이 위에 ──
})();
