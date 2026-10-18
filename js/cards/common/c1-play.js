/* 공통1 체험 카드 묶음 2: 방향장과 오일러 방법, 로지스틱 성장, 심프슨 공식, 수치 미분의 오차,
   회전체의 부피(원판·원통껍질), 매개변수 곡선, 거듭제곱급수의 수렴 반지름.
   카드마다 id가 다르고, 이 페이지에 있는 카드만 실행된다. */
(() => {
  "use strict";
  const C = () => QSim.col();

  /* 1. 방향장과 오일러 방법 (10-01) */
  (() => {
    const S = QSim.card("lab-c1-dfield"); if (!S) return;
    const cv = S.$("canvas"), X1 = 4;
    const E = {
      exp: { n: "y' = 0.5y", f: (x, y) => 0.5 * y, y: (x, y0) => y0 * Math.exp(0.5 * x) },
      logi: { n: "y' = 0.5y(1 − y/6)", f: (x, y) => 0.5 * y * (1 - y / 6), y: (x, y0) => (y0 === 0 ? 0 : 6 / (1 + (6 / y0 - 1) * Math.exp(-0.5 * x))) },
      cool: { n: "y' = −1.5(y − 3)", f: (x, y) => -1.5 * (y - 3), y: (x, y0) => 3 + (y0 - 3) * Math.exp(-1.5 * x) },
      xy: { n: "y' = x − y", f: (x, y) => x - y, y: (x, y0) => x - 1 + (y0 + 1) * Math.exp(-x) }
    };
    function draw() {
      const c = C(), e = E[S.val("eq")], y0 = S.val("y0"), h = +S.val("h");
      const v = QSim.view(cv, 0.66), F = QSim.frame(v, { x0: 0, x1: X1, y0: -2, y1: 8, xl: "x", yl: "y" }); F.axes();
      const g = v.g;
      g.save(); g.strokeStyle = c.ink3; g.lineWidth = 1.2;
      for (let x = 0.2; x < X1; x += 0.4) for (let y = -1.6; y < 8; y += 0.6) {
        const m = e.f(x, y), L = 0.13, dx = L / Math.hypot(1, m * F.sy / F.sx), dy = m * dx;
        g.beginPath(); g.moveTo(F.X(x - dx), F.Y(y - dy)); g.lineTo(F.X(x + dx), F.Y(y + dy)); g.stroke();
      }
      g.restore();
      F.fn((x) => e.y(x, y0), c.main, 2.5);
      const pts = [[0, y0]]; let x = 0, y = y0;
      while (x < X1 - 1e-9) { y += h * e.f(x, y); x += h; pts.push([x, y]); }
      F.path(pts, c.acc, 2); pts.forEach(([a, b]) => F.dot(a, b, c.acc, 3));
      F.dot(0, y0, c.ink, 5);
      const ex = e.y(X1, y0), eu = y;
      S.out(`${e.n},  y(0) = ${y0.toFixed(1)}\n해 곡선(보라)의 y(${X1}) = ${ex.toFixed(4)}\n오일러 방법(주황, h = ${h})의 y(${X1}) = ${eu.toFixed(4)},  오차 ${(eu - ex).toFixed(4)},  ${Math.round(X1 / h)}걸음`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 지수 성장과 로지스틱 성장 (10-02) */
  (() => {
    const S = QSim.card("lab-c1-logistic"); if (!S) return;
    const cv = S.$("canvas");
    /* 가상 자료: K = 120, r = 0.6, P0 = 5인 로지스틱 곡선에 정해 둔 잡음을 더한 값 */
    const NOISE = [0.4, -0.6, 1.1, -1.8, 2.5, -3.0, 2.2, -1.5, 3.1, -2.4, 1.6, -2.7, 2.0, -1.2, 0.8, -1.0];
    const DATA = NOISE.map((z, i) => { const t = i; return [t, +(120 / (1 + 23 * Math.exp(-0.6 * t)) + z).toFixed(1)]; });
    function draw() {
      const c = C(), r = S.val("r"), K = S.val("K"), P0 = S.val("P0");
      const lg = (t) => K / (1 + (K / P0 - 1) * Math.exp(-r * t)), ex = (t) => P0 * Math.exp(r * t);
      const v = QSim.view(cv, 0.6), F = QSim.frame(v, { x0: 0, x1: 16, y0: 0, y1: 200, xl: "t (시간)", yl: "개체 수" }); F.axes();
      F.fn(ex, c.ink3, 1.5, [5, 4]);
      F.fn(lg, c.main, 2.5);
      F.path([[0, K], [16, K]], c.acc, 1.2, [3, 3]); F.text("K", 15.6, K + 4, c.acc);
      if (S.val("data")) DATA.forEach(([t, p]) => F.dot(t, p, c.warn, 3.5));
      const sse = DATA.reduce((s, [t, p]) => s + (lg(t) - p) ** 2, 0);
      const th = P0 < K ? Math.log(K / P0 - 1) / r : NaN;
      S.out(`로지스틱 P(t) = K / (1 + (K/P0 − 1)e^(−rt)),  r = ${r.toFixed(2)}, K = ${K}, P0 = ${P0}\n` +
        `P(5) = ${lg(5).toFixed(1)} (지수 성장이면 ${ex(5).toFixed(1)}),  P(15) = ${lg(15).toFixed(1)} (지수 성장이면 ${ex(15).toFixed(0)})\n` +
        `K/2에 이르는 시각 ${isFinite(th) ? th.toFixed(2) : "-"}, 그때 증가 속도가 가장 크다: rK/4 = ${(r * K / 4).toFixed(1)}\n` +
        (S.val("data") ? `가상 자료 16개와의 오차 제곱합 ${sse.toFixed(0)}` : ""));
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 사다리꼴 공식과 심프슨 공식 (05-06) */
  (() => {
    const S = QSim.card("lab-c1-simpson"); if (!S) return;
    const cv = S.$("canvas");
    const R = { sin: [0, Math.PI, Math.sin, 2, "sin x, [0, π]"], exp: [0, 1, Math.exp, Math.E - 1, "eˣ, [0, 1]"],
      atan: [0, 1, (x) => 1 / (1 + x * x), Math.PI / 4, "1/(1+x²), [0, 1]"], sqrt: [0, 1, Math.sqrt, 2 / 3, "√x, [0, 1]"] };
    const T = (f, a, b, n) => { const h = (b - a) / n; let s = (f(a) + f(b)) / 2; for (let i = 1; i < n; i++) s += f(a + i * h); return s * h; };
    const Sm = (f, a, b, n) => { const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h); return (s * h) / 3; };
    function draw() {
      const c = C(), [a, b, f, ex, nm] = R[S.val("fn")], n = S.val("n");
      let hi = 0; for (let i = 0; i <= 100; i++) hi = Math.max(hi, f(a + ((b - a) * i) / 100));
      const v = QSim.view(cv, 0.55), F = QSim.frame(v, { x0: a, x1: b, y0: 0, y1: hi * 1.15, xl: "x" }); F.axes();
      const g = v.g, h = (b - a) / n;
      g.save(); g.fillStyle = c.soft; g.globalAlpha = 0.55;
      for (let i = 0; i < n; i++) { const l = a + i * h; g.beginPath(); g.moveTo(F.X(l), F.Y(0)); g.lineTo(F.X(l), F.Y(f(l))); g.lineTo(F.X(l + h), F.Y(f(l + h))); g.lineTo(F.X(l + h), F.Y(0)); g.closePath(); g.fill(); }
      g.restore();
      for (let i = 0; i < n; i += 2) {
        const x0 = a + i * h, x1 = x0 + h, x2 = x0 + 2 * h, y0 = f(x0), y1 = f(x1), y2 = f(x2);
        const P = (x) => y0 * ((x - x1) * (x - x2)) / (2 * h * h) - y1 * ((x - x0) * (x - x2)) / (h * h) + y2 * ((x - x0) * (x - x1)) / (2 * h * h);
        const pts = []; for (let k = 0; k <= 30; k++) { const x = x0 + (2 * h * k) / 30; pts.push([x, P(x)]); }
        F.path(pts, c.acc, 2, [5, 3]);
      }
      F.fn(f, c.main, 2.5);
      const t1 = T(f, a, b, n), t2 = T(f, a, b, 2 * n), s1 = Sm(f, a, b, n), s2 = Sm(f, a, b, 2 * n);
      const rt = Math.abs(t1 - ex) / Math.abs(t2 - ex), rs = Math.abs(s1 - ex) / Math.max(1e-16, Math.abs(s2 - ex));
      S.out(`${nm}, 정확한 값 ${ex.toFixed(8)}, n = ${n}\n사다리꼴 T = ${t1.toFixed(8)}, 오차 ${(t1 - ex).toExponential(2)}, n을 두 배로 하면 ${rt.toFixed(1)}분의 1\n` +
        `심프슨   S = ${s1.toFixed(8)}, 오차 ${(s1 - ex).toExponential(2)}, n을 두 배로 하면 ${Math.abs(s2 - ex) < 1e-13 ? "반올림 오차 수준이라 비율이 의미 없음" : rs.toFixed(1) + "분의 1"}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 컴퓨터로 도함수 어림하기: 간격 h와 오차 (04-04) */
  (() => {
    const S = QSim.card("lab-c1-numdiff"); if (!S) return;
    const cv = S.$("canvas");
    const R = { sin: [Math.sin, 1, Math.cos(1), "sin x, x = 1"], exp: [Math.exp, 0, 1, "eˣ, x = 0"], log: [Math.log, 2, 0.5, "ln x, x = 2"] };
    const fw = (f, a, h) => (f(a + h) - f(a)) / h, ce = (f, a, h) => (f(a + h) - f(a - h)) / (2 * h);
    const lg = (e) => Math.log10(Math.max(1e-17, Math.abs(e)));
    function draw() {
      const c = C(), [f, a, d, nm] = R[S.val("fn")], k = S.val("k"), h = Math.pow(10, -k);
      const v = QSim.view(cv, 0.6), F = QSim.frame(v, { x0: -16, x1: 0, y0: -17, y1: 1, xl: "log₁₀ h", yl: "log₁₀ |오차|" }); F.axes();
      const A = [], B = [];
      for (let t = 0.25; t <= 16; t += 0.25) { const hh = Math.pow(10, -t); A.push([-t, lg(fw(f, a, hh) - d)]); B.push([-t, lg(ce(f, a, hh) - d)]); }
      F.path(A, c.main, 2); F.path(B, c.acc, 2);
      const e1 = fw(f, a, h) - d, e2 = ce(f, a, h) - d;
      F.path([[-k, -17], [-k, 1]], c.ink3, 1, [4, 4]); F.dot(-k, lg(e1), c.main, 5); F.dot(-k, lg(e2), c.acc, 5);
      S.out(`${nm}, 참값 f'(a) = ${d.toFixed(12)},  h = 1e-${k}\n앞쪽 차분 (f(a+h) − f(a))/h      = ${fw(f, a, h).toFixed(12)},  오차 ${e1.toExponential(2)}  (보라)\n` +
        `가운데 차분 (f(a+h) − f(a−h))/(2h) = ${ce(f, a, h).toFixed(12)},  오차 ${e2.toExponential(2)}  (주황)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 5. 회전체의 부피: 원판과 원통껍질 (06-01, 06-02) */
  (() => {
    const S = QSim.card("lab-c1-volume"); if (!S) return;
    const cv = S.$("canvas");
    const R = {
      sqrt: { n: "y = √x, 0 ≤ x ≤ 4", a: 0, b: 4, f: Math.sqrt, disk: 8 * Math.PI, shell: (128 * Math.PI) / 5 },
      para: { n: "y = x(3 − x), 0 ≤ x ≤ 3", a: 0, b: 3, f: (x) => x * (3 - x), disk: 8.1 * Math.PI, shell: 13.5 * Math.PI }
    };
    function draw() {
      const c = C(), r = R[S.val("fn")], m = S.val("m"), n = S.val("n"), dx = (r.b - r.a) / n;
      const disk = m === "disk";
      const box = disk ? { x0: -0.3, x1: r.b + 0.3, y0: -2.6, y1: 2.6 } : { x0: -r.b - 0.3, x1: r.b + 0.3, y0: -0.3, y1: 2.6 };
      const v = QSim.view(cv, 0.6), F = QSim.frame(v, { ...box, equal: true, xl: "x", yl: "y" }); F.axes({ noGrid: true });
      const g = v.g; let V = 0;
      for (let i = 0; i < n; i++) {
        const xm = r.a + (i + 0.5) * dx, h = r.f(xm);
        g.save(); g.fillStyle = c.soft; g.strokeStyle = c.main; g.globalAlpha = 0.55;
        if (disk) {
          V += Math.PI * h * h * dx;
          g.fillRect(F.X(xm - dx / 2), F.Y(h), F.X(xm + dx / 2) - F.X(xm - dx / 2), F.Y(-h) - F.Y(h));
          g.globalAlpha = 1; g.beginPath(); g.ellipse(F.X(xm), F.Y(0), Math.max(1, (F.X(xm + dx / 2) - F.X(xm - dx / 2)) * 0.5), F.Y(-h) - F.Y(0), 0, 0, 7); g.stroke();
        } else {
          V += 2 * Math.PI * xm * h * dx;
          [xm, -xm].forEach((x) => g.fillRect(F.X(x - dx / 2), F.Y(h), F.X(x + dx / 2) - F.X(x - dx / 2), F.Y(0) - F.Y(h)));
          g.globalAlpha = 0.9; g.beginPath(); g.ellipse(F.X(0), F.Y(h), F.X(xm) - F.X(0), Math.max(2, (F.X(xm) - F.X(0)) * 0.18), 0, 0, 7); g.stroke();
        }
        g.restore();
      }
      F.fn(r.f, c.acc, 2.5, null, 300);
      if (disk) F.fn((x) => (x >= r.a && x <= r.b ? -r.f(x) : NaN), c.acc, 1.5, [4, 3], 300);
      else F.fn((x) => (x <= -r.a && x >= -r.b ? r.f(-x) : NaN), c.acc, 1.5, [4, 3], 300);
      const ex = disk ? r.disk : r.shell;
      S.out(`${r.n} 영역을 ${disk ? "x축 둘레로 (원판)" : "y축 둘레로 (원통껍질)"} 회전,  조각 n = ${n}\n` +
        (disk ? "조각 하나의 부피 π f(xᵢ)² Δx" : "조각 하나의 부피 2π xᵢ f(xᵢ) Δx") + `,  합 = ${V.toFixed(4)}\n` +
        `적분으로 구한 부피 = ${ex.toFixed(4)} (${(ex / Math.PI).toFixed(2)}π),  오차 ${(V - ex).toExponential(2)}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 6. 매개변수 곡선: 점의 움직임, 접선, 길이 (07-01, 07-02) */
  (() => {
    const S = QSim.card("lab-c1-cycloid"); if (!S) return;
    const cv = S.$("canvas"), TP = 2 * Math.PI;
    const R = {
      cyc: { n: "사이클로이드 x = t − sin t, y = 1 − cos t", p: (t) => [t - Math.sin(t), 1 - Math.cos(t)], d: (t) => [1 - Math.cos(t), Math.sin(t)], box: { x0: -0.3, x1: 6.6, y0: -0.3, y1: 2.6 } },
      circ: { n: "원 x = 2cos t, y = 2sin t", p: (t) => [2 * Math.cos(t), 2 * Math.sin(t)], d: (t) => [-2 * Math.sin(t), 2 * Math.cos(t)], box: { x0: -2.6, x1: 2.6, y0: -2.6, y1: 2.6 } },
      lis: { n: "리사주 곡선 x = sin 2t, y = sin 3t", p: (t) => [Math.sin(2 * t), Math.sin(3 * t)], d: (t) => [2 * Math.cos(2 * t), 3 * Math.cos(3 * t)], box: { x0: -1.3, x1: 1.3, y0: -1.3, y1: 1.3 } }
    };
    function draw() {
      const c = C(), r = R[S.val("cv")], t = (S.val("t") / 360) * TP;
      const v = QSim.view(cv, 0.55), F = QSim.frame(v, { ...r.box, equal: true, xl: "x", yl: "y" }); F.axes();
      const all = [], done = []; let L = 0, prev = r.p(0);
      for (let k = 0; k <= 720; k++) { const s = (TP * k) / 720; all.push(r.p(s)); }
      for (let k = 0; k <= 600; k++) { const s = (t * k) / 600, q = r.p(s); done.push(q); if (k) L += Math.hypot(q[0] - prev[0], q[1] - prev[1]); prev = q; }
      F.path(all, c.soft, 2); F.path(done, c.main, 2.5);
      const [x, y] = r.p(t), [dx, dy] = r.d(t);
      if (S.val("cv") === "cyc") { const g = v.g; g.save(); g.strokeStyle = c.ink3; g.beginPath(); g.arc(F.X(t), F.Y(1), F.sx, 0, 7); g.stroke(); g.restore(); F.path([[t, 1], [x, y]], c.ink3, 1); }
      F.arrow(x, y, dx * 0.5, dy * 0.5, c.acc, "속도");
      F.dot(x, y, c.ink, 5);
      const slope = Math.abs(dx) < 1e-9 ? "없음 (세로 접선 또는 뾰족점)" : (dy / dx).toFixed(4);
      S.out(`${r.n},  t = ${t.toFixed(4)}\n점 (${x.toFixed(4)}, ${y.toFixed(4)}),  dx/dt = ${dx.toFixed(4)}, dy/dt = ${dy.toFixed(4)}\n` +
        `접선의 기울기 dy/dx = (dy/dt)/(dx/dt) = ${slope}\n0부터 t까지 곡선의 길이 ≈ ${L.toFixed(4)}` + (S.val("cv") === "cyc" ? `  (공식 4(1 − cos(t/2)) = ${(4 * (1 - Math.cos(t / 2))).toFixed(4)})` : ""));
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 7. 거듭제곱급수와 수렴 반지름 (08-06, 08-07) */
  (() => {
    const S = QSim.card("lab-c1-radius"); if (!S) return;
    const cv = S.$("canvas");
    const R = {
      geo: { n: "1/(1 − x) = 1 + x + x² + …", f: (x) => 1 / (1 - x), t: (k, x) => Math.pow(x, k), k0: 0, R: "1 (−1 < x < 1)" },
      log: { n: "ln(1 + x) = x − x²/2 + x³/3 − …", f: (x) => (x > -1 ? Math.log(1 + x) : NaN), t: (k, x) => ((k % 2 ? 1 : -1) * Math.pow(x, k)) / k, k0: 1, R: "1 (−1 < x ≤ 1)" },
      atan: { n: "arctan x = x − x³/3 + x⁵/5 − …", f: Math.atan, t: (k, x) => ((k % 2 ? 1 : -1) * Math.pow(x, 2 * k - 1)) / (2 * k - 1), k0: 1, R: "1 (−1 ≤ x ≤ 1)" },
      exp: { n: "eˣ = 1 + x + x²/2! + …", f: Math.exp, t: (k, x) => { let p = 1; for (let i = 1; i <= k; i++) p *= x / i; return p; }, k0: 0, R: "∞ (모든 실수)" }
    };
    const part = (r, N, x) => { let s = 0; for (let k = r.k0; k < r.k0 + N; k++) s += r.t(k, x); return s; };
    function draw() {
      const c = C(), r = R[S.val("s")], N = S.val("N"), x0 = S.val("x");
      const v = QSim.view(cv, 0.6), F = QSim.frame(v, { x0: -2, x1: 2, y0: -3, y1: 6, xl: "x", yl: "y" }); F.axes();
      if (S.val("s") !== "exp") { const g = v.g; g.save(); g.fillStyle = c.soft; g.globalAlpha = 0.35; g.fillRect(F.X(-1), F.Y(6), F.X(1) - F.X(-1), F.Y(-3) - F.Y(6)); g.restore(); }
      F.fn((x) => { const y = r.f(x); return Math.abs(y) < 50 ? y : NaN; }, c.main, 2.5, null, 600);
      F.fn((x) => { const y = part(r, N, x); return Math.abs(y) < 50 ? y : NaN; }, c.acc, 2, null, 600);
      F.path([[x0, -3], [x0, 6]], c.ink3, 1, [4, 4]);
      const sN = part(r, N, x0), ex = r.f(x0);
      S.out(`${r.n},  수렴 반지름 ${r.R}\nx = ${x0.toFixed(2)}에서 앞의 ${N}개 항의 합 = ${isFinite(sN) ? sN.toPrecision(8) : "발산"},  함숫값 = ${isFinite(ex) ? ex.toPrecision(8) : "정의되지 않음"}` +
        (isFinite(ex) && isFinite(sN) ? `,  차이 ${(sN - ex).toExponential(2)}` : ""));
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
