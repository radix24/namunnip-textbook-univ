/* 수학과 해석학 탐구 카드: ε-N, 균등수렴, 번스타인 다항식, p-거리의 공, 페예르 평균, 룽게 현상 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const { fmt } = MKit;
  const EPS = [0.5, 0.3, 0.2, 0.1, 0.05, 0.03, 0.02, 0.01];

  /* ── 1. 수열의 ε-N ── */
  (() => {
    const SEQ = {
      inv: { a: (n) => 1 / n, L: 0, tex: "1/n", rule: (e) => Math.floor(1 / e) + 1 },
      alt: { a: (n) => (n % 2 ? -1 : 1) / Math.sqrt(n), L: 0, tex: "(−1)ⁿ/√n", rule: (e) => Math.floor(1 / (e * e)) + 1 },
      sin: { a: (n) => Math.sin(n) / n, L: 0, tex: "sin n / n", rule: (e) => Math.floor(1 / e) + 1 },
      e: { a: (n) => Math.pow(1 + 1 / n, n), L: Math.E, tex: "(1+1/n)ⁿ", rule: (e) => Math.floor(Math.E / (2 * e)) + 1 },
      osc: { a: (n) => (n % 2 ? -1 : 1), L: 0, tex: "(−1)ⁿ", rule: null },
    };
    const S = MKit.setup("card-m7-epsN", 0.6, draw);
    if (!S) return;
    const { k, v } = S;
    const NMAX = 20000;
    /* 끝까지 띠 안에 머무는 첫 N (NMAX까지 검사). 없으면 null */
    const firstN = (s, e, L) => { let N = null; for (let n = NMAX; n >= 1; n--) { if (Math.abs(s.a(n) - L) >= e) return n === NMAX ? null : n + 1; N = n; } return N; };
    function draw() {
      const c = C(), s = SEQ[k.val("seq")], e = EPS[k.val("e")], L = s.L + k.val("dl");
      k.$(".ev").textContent = e;
      const N = firstN(s, e, L);
      const nmax = Math.min(400, Math.max(40, Math.ceil((N || 30) * 1.5)));
      const vals = Array.from({ length: nmax }, (_, i) => s.a(i + 1));
      const lo = Math.min(L - e, ...vals), hi = Math.max(L + e, ...vals), pad = (hi - lo) * 0.08 + 0.05;
      const f = QSim.frame(v, { x0: 0, x1: nmax + 1, y0: lo - pad, y1: hi + pad, pad: 30, xl: "n" });
      f.axes();
      const g = v.g;
      g.save(); g.fillStyle = c.acc; g.globalAlpha = 0.18; g.fillRect(f.X(0), f.Y(L + e), f.X(nmax + 1) - f.X(0), f.Y(L - e) - f.Y(L + e)); g.restore();
      f.path([[0, L], [nmax + 1, L]], c.ink3, 1, [5, 4]);
      if (N) f.path([[N - 0.5, lo - pad], [N - 0.5, hi + pad]], c.main, 2, [4, 3]);
      const r = nmax > 150 ? 2 : 3.5;
      vals.forEach((y, i) => f.dot(i + 1, y, Math.abs(y - L) < e ? c.main : c.warn, r));
      const rule = s.rule && Math.abs(L - s.L) < 1e-12 ? ` · 증명에서 쓰는 N = ${s.rule(e)}` : "";
      k.out(`aₙ = ${s.tex}, L = ${fmt(L, 4)}, ε = ${e}\n` + (N ? `n ≥ ${N}이면 (n = ${NMAX}까지 확인) 모두 띠 안에 있습니다${rule}` : `n = ${NMAX}까지 보아도 띠를 벗어나는 항이 계속 나옵니다. 이 L로는 ε = ${e}에 답할 N이 없습니다`));
    }
    S.redraw();
  })();

  /* ── 2. 점별수렴과 균등수렴 ── */
  (() => {
    const FN = {
      pow: { f: (x, n) => Math.pow(x, n), lim: (x) => (x < 1 ? 0 : 1), x0: 0, x1: 1, y0: -0.1, y1: 1.2, tex: "xⁿ, [0, 1]" },
      pow9: { f: (x, n) => Math.pow(x, n), lim: () => 0, x0: 0, x1: 0.9, y0: -0.1, y1: 1.0, tex: "xⁿ, [0, 0.9]" },
      bump: { f: (x, n) => n * x * Math.exp(-n * x), lim: () => 0, x0: 0, x1: 3, y0: -0.1, y1: 0.5, tex: "nx·e^(−nx), [0, 3]" },
      tame: { f: (x, n) => x / (1 + n * x * x), lim: () => 0, x0: 0, x1: 3, y0: -0.1, y1: 0.6, tex: "x/(1+nx²), [0, 3]" },
    };
    const S = MKit.setup("card-m7-uniform", 0.6, draw);
    if (!S) return;
    const { k, v } = S;
    function draw() {
      const c = C(), F = FN[k.val("fn")], n = k.val("n"), e = EPS[k.val("e")];
      k.$(".ev").textContent = e;
      const f = QSim.frame(v, { x0: F.x0, x1: F.x1, y0: F.y0, y1: F.y1, pad: 30, xl: "x" });
      f.axes();
      const g = v.g, M = 1200;
      // 극한함수 주위의 ε 관
      g.save(); g.fillStyle = c.acc; g.globalAlpha = 0.18; g.beginPath();
      for (let i = 0; i <= M; i++) { const x = F.x0 + (i / M) * (F.x1 - F.x0); const y = F.lim(x) + e; i ? g.lineTo(f.X(x), f.Y(y)) : g.moveTo(f.X(x), f.Y(y)); }
      for (let i = M; i >= 0; i--) { const x = F.x0 + (i / M) * (F.x1 - F.x0); g.lineTo(f.X(x), f.Y(F.lim(x) - e)); }
      g.fill(); g.restore();
      f.fn(F.lim, c.ink3, 1.5, [5, 4], M);
      let sup = 0, at = F.x0;
      const pts = [];
      for (let i = 0; i <= M; i++) {
        const x = F.x0 + (i / M) * (F.x1 - F.x0), y = F.f(x, n);
        pts.push([x, y]);
        const d = Math.abs(y - F.lim(x)); if (d > sup) { sup = d; at = x; }
      }
      // 끝점 x = 1에서 극한함수가 뛰는 경우, 바로 왼쪽까지의 상한을 본다
      if (k.val("fn") === "pow") { const x = 1 - 1e-9; sup = Math.max(sup, Math.pow(x, n)); }
      f.path(pts, sup < e ? c.main : c.warn, 2);
      if (sup >= e) f.dot(at, F.f(at, n), c.warn, 5);
      k.out(`fₙ = ${F.tex}, n = ${n}\nsup |fₙ − f| = ${fmt(sup, 4)} ${sup < e ? "< ε: 그래프 전체가 관 안에 있습니다" : "≥ ε: 관을 벗어나는 곳이 있습니다"}`);
    }
    S.redraw();
  })();

  /* ── 3. 번스타인 다항식 (바이어슈트라스 근사) ── */
  (() => {
    const FN = {
      abs: { f: (x) => Math.abs(x - 0.5), tex: "|x − 1/2|" },
      sin: { f: (x) => Math.sin(2 * Math.PI * x), tex: "sin 2πx" },
      ramp: { f: (x) => Math.min(1, Math.max(0, (x - 0.4) * 8)), tex: "가파른 경사" },
    };
    const S = MKit.setup("card-m7-bernstein", 0.6, draw);
    if (!S) return;
    const { k, v } = S;
    /* Bₙf(x) = Σ f(k/n) C(n,k) xᵏ(1−x)ⁿ⁻ᵏ, 이항 확률을 점화식으로 */
    const B = (fn, n, x) => {
      if (x <= 0) return fn(0); if (x >= 1) return fn(1);
      let p = Math.pow(1 - x, n), s = 0; const r = x / (1 - x);
      for (let j = 0; j <= n; j++) { s += fn(j / n) * p; p *= ((n - j) / (j + 1)) * r; }
      return s;
    };
    function draw() {
      const c = C(), F = FN[k.val("fn")], n = k.val("n");
      const f = QSim.frame(v, { x0: 0, x1: 1, y0: -1.2, y1: 1.2, pad: 30, xl: "x" });
      f.axes();
      f.fn(F.f, c.ink3, 2, [5, 4], 600);
      let err = 0; const pts = [];
      for (let i = 0; i <= 600; i++) { const x = i / 600, y = B(F.f, n, x); pts.push([x, y]); err = Math.max(err, Math.abs(y - F.f(x))); }
      f.path(pts, c.main, 2);
      if (n <= 40) for (let j = 0; j <= n; j++) f.dot(j / n, F.f(j / n), c.acc, 3);
      k.out(`f = ${F.tex}, n = ${n}\n최대 오차 ${fmt(err, 4)} · 오차 × √n = ${fmt(err * Math.sqrt(n), 3)} · 오차 × n = ${fmt(err * n, 3)}`);
    }
    S.redraw();
  })();

  /* ── 4. p-거리의 단위공 ── */
  (() => {
    let f;
    const Q = [[0.55, 0.35]];
    const S = MKit.setup("card-m7-pballs", 0.8, draw);
    if (!S) return;
    const { k, v } = S;
    const pv = () => { const t = k.val("p"); return t >= 41 ? Infinity : 1 + (t - 1) * 0.25; };
    const norm = (x, y, p) => (p === Infinity ? Math.max(Math.abs(x), Math.abs(y)) : Math.pow(Math.pow(Math.abs(x), p) + Math.pow(Math.abs(y), p), 1 / p));
    const ball = (p, r) => Array.from({ length: 361 }, (_, i) => { const t = (i * Math.PI) / 180, x = Math.cos(t), y = Math.sin(t), s = r / norm(x, y, p); return [x * s, y * s]; });
    function draw() {
      const c = C(), p = pv();
      k.$(".pv").textContent = p === Infinity ? "∞" : fmt(p, 2);
      f = QSim.frame(v, { x0: -1.6, x1: 1.6, y0: -1.3, y1: 1.3, equal: true, pad: 22 });
      f.axes();
      [1, 2, Infinity].forEach((q) => f.path(ball(q, 1), c.rule, 1));
      // ‖·‖∞ ≤ ‖·‖ₚ ≤ 2^(1/p)‖·‖∞ 이므로 p-공은 두 정사각형 사이에 있다
      const s = p === Infinity ? 1 : Math.pow(2, -1 / p);
      f.path([[-s, -s], [s, -s], [s, s], [-s, s], [-s, -s]], c.acc, 1.5, [5, 4]);
      f.path(ball(p, 1), c.main, 2.5);
      const [x, y] = Q[0];
      f.dot(x, y, c.ink, 6);
      const inside = norm(x, y, p) < 1;
      k.out(`p = ${p === Infinity ? "∞" : fmt(p, 2)} · 끌어 놓은 점 (${fmt(x, 2)}, ${fmt(y, 2)})\n` +
        `d₁ = ${fmt(norm(x, y, 1))}, d₂ = ${fmt(norm(x, y, 2))}, dₚ = ${fmt(norm(x, y, p))}, d∞ = ${fmt(norm(x, y, Infinity))} · ${inside ? "p-단위공 안" : "p-단위공 밖"}\n` +
        `반지름 ${fmt(s)}인 ∞-공(점선 정사각형)은 늘 p-단위공 안에 들어갑니다`);
    }
    MKit.drag(S.cv, () => f, () => Q, (i, x, y) => { Q[0] = [x, y]; S.redraw(); });
    S.redraw();
  })();

  /* ── 5. 푸리에 부분합과 페예르 평균 ── */
  (() => {
    const FN = {
      sq: { f: (x) => (x > 0 ? 1 : x < 0 ? -1 : 0), b: (j) => (j % 2 ? 4 / (Math.PI * j) : 0), tex: "사각파", top: 1 },
      saw: { f: (x) => x, b: (j) => (2 * (j % 2 ? 1 : -1)) / j, tex: "톱니파 f(x) = x", top: Math.PI },
    };
    const S = MKit.setup("card-m15-fejer", 0.6, draw);
    if (!S) return;
    const { k, v } = S;
    const part = (F, N, x, fej) => { let s = 0; for (let j = 1; j <= N; j++) s += (fej ? 1 - j / (N + 1) : 1) * F.b(j) * Math.sin(j * x); return s; };
    function draw() {
      const c = C(), F = FN[k.val("fn")], N = k.val("n"), showF = k.val("fej");
      const T = F.top * 1.35;
      const f = QSim.frame(v, { x0: -Math.PI, x1: Math.PI, y0: -T, y1: T, pad: 30, xl: "x" });
      f.axes();
      f.fn(F.f, c.ink3, 1.5, [5, 4], 800);
      let mS = -Infinity, mF = -Infinity; const pS = [], pF = [];
      for (let i = 0; i <= 1200; i++) {
        const x = -Math.PI + (2 * Math.PI * i) / 1200, a = part(F, N, x, false), b = part(F, N, x, true);
        pS.push([x, a]); pF.push([x, b]); mS = Math.max(mS, a); mF = Math.max(mF, b);
      }
      f.path(pS, c.main, 2);
      if (showF) f.path(pF, c.acc, 2.5);
      const jump = 2 * F.top;
      k.out(`${F.tex}, N = ${N}\n부분합 Sₙ의 최댓값 ${fmt(mS, 4)} (넘친 양 점프의 ${fmt(((mS - F.top) / jump) * 100, 2)}%)` +
        (showF ? `\n페예르 평균 σₙ의 최댓값 ${fmt(mF, 4)} (원래 함수의 최댓값 ${fmt(F.top, 4)}를 넘지 않음)` : ""));
    }
    S.redraw();
  })();

  /* ── 6. 룽게 현상과 체비쇼프 점 ── */
  (() => {
    const FN = {
      runge: { f: (x) => 1 / (1 + 25 * x * x), tex: "1/(1+25x²)" },
      abs: { f: (x) => Math.abs(x), tex: "|x|" },
      sin: { f: (x) => Math.sin(Math.PI * x), tex: "sin πx" },
    };
    const S = MKit.setup("card-m24-runge", 0.6, draw);
    if (!S) return;
    const { k, v } = S;
    const nodes = (n, cheb) => Array.from({ length: n + 1 }, (_, j) => (cheb ? Math.cos(((2 * j + 1) * Math.PI) / (2 * n + 2)) : -1 + (2 * j) / n));
    /* 무게중심 보간 공식 */
    const interp = (xs, ys) => {
      const w = xs.map((xj, j) => 1 / xs.reduce((p, xi, i) => (i === j ? p : p * (xj - xi)), 1));
      return (x) => {
        let num = 0, den = 0;
        for (let j = 0; j < xs.length; j++) { const d = x - xs[j]; if (Math.abs(d) < 1e-14) return ys[j]; const t = w[j] / d; num += t * ys[j]; den += t; }
        return num / den;
      };
    };
    function draw() {
      const c = C(), F = FN[k.val("fn")], n = k.val("n"), cheb = k.val("nodes") === "cheb";
      const xs = nodes(n, cheb), ys = xs.map(F.f), p = interp(xs, ys);
      let err = 0; const pts = [];
      for (let i = 0; i <= 2000; i++) { const x = -1 + i / 1000, y = p(x); pts.push([x, y]); err = Math.max(err, Math.abs(y - F.f(x))); }
      const f = QSim.frame(v, { x0: -1, x1: 1, y0: -1.2, y1: 2.2, pad: 30, xl: "x" });
      f.axes();
      f.fn(F.f, c.ink3, 2, [5, 4], 600);
      v.g.save(); v.g.beginPath(); v.g.rect(f.X(-1), f.Y(2.2), f.X(1) - f.X(-1), f.Y(-1.2) - f.Y(2.2)); v.g.clip();
      f.path(pts, c.main, 2); v.g.restore();
      xs.forEach((x, j) => f.dot(x, ys[j], c.acc, 4));
      k.out(`f = ${F.tex}, ${cheb ? "체비쇼프 점" : "등간격 점"} ${n + 1}개 (차수 ${n})\n최대 오차 max|f − pₙ| = ${err < 1e-3 ? err.toExponential(2) : fmt(err, 4)}`);
    }
    S.redraw();
  })();
})();
