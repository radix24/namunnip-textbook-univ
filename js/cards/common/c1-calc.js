/* 공통1 실습 카드 묶음: 접선, Newton 방법, 리만 합, 기본정리, 극곡선, 급수, 테일러 다항식.
   카드마다 id가 다르고, 이 페이지에 있는 카드만 실행된다. */
(() => {
  "use strict";
  const F = {
    sq: { n: "x²", f: (x) => x * x, d: (x) => 2 * x },
    cu: { n: "x³ − 3x", f: (x) => x ** 3 - 3 * x, d: (x) => 3 * x * x - 3 },
    sin: { n: "sin x", f: Math.sin, d: Math.cos },
    exp: { n: "eˣ", f: Math.exp, d: Math.exp },
    sqrt: { n: "√x", f: (x) => (x >= 0 ? Math.sqrt(x) : NaN), d: (x) => (x > 0 ? 0.5 / Math.sqrt(x) : NaN) },
    abs: { n: "|x|", f: Math.abs, d: (x) => (x > 0 ? 1 : x < 0 ? -1 : NaN) }
  };
  const C = () => QSim.col();

  /* 1. 할선에서 접선으로 (02-01) */
  (() => {
    const S = QSim.card("lab-c1-tangent"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), fn = F[S.val("fn")], a = S.val("a"), h = (S.val("left") ? -1 : 1) * Math.pow(10, S.val("h"));
      const v = QSim.view(cv, 0.62), f = QSim.frame(v, { x0: -3, x1: 3, y0: -3, y1: 5, xl: "x", yl: "y" }); f.axes();
      f.fn(fn.f, c.main, 2.5, null, 600);
      const fa = fn.f(a), fb = fn.f(a + h), ms = (fb - fa) / h, mt = fn.d(a);
      if (isFinite(ms)) f.fn((x) => fa + ms * (x - a), c.acc, 2);
      if (isFinite(mt)) f.fn((x) => fa + mt * (x - a), c.ink3, 1.5, [5, 4]);
      f.dot(a, fa, c.ink, 5); if (isFinite(fb)) f.dot(a + h, fb, c.acc, 5);
      S.out(`f(x) = ${fn.n}, a = ${a.toFixed(2)}, h = ${h.toPrecision(3)}\n할선 기울기 [f(a+h) − f(a)]/h = ${isFinite(ms) ? ms.toFixed(6) : "정의 안 됨"}\n` +
        `접선 기울기 f'(a) = ${isFinite(mt) ? mt.toFixed(6) : "없음 (미분 불가능)"}` + (isFinite(ms) && isFinite(mt) ? `   차이 ${Math.abs(ms - mt).toExponential(2)}` : ""));
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. Newton 방법: 접선의 x절편을 되풀이 (02-05) */
  (() => {
    const S = QSim.card("lab-c1-newton"); if (!S) return;
    const cv = S.$("canvas");
    const N = {
      cub: { n: "x³ − 2x − 5", f: (x) => x ** 3 - 2 * x - 5, d: (x) => 3 * x * x - 2, box: [0.5, 3.5, -8, 20], r: 2.0945514815423265 },
      sq2: { n: "x² − 2", f: (x) => x * x - 2, d: (x) => 2 * x, box: [-3, 3, -3, 7], r: Math.SQRT2 },
      cos: { n: "cos x − x", f: (x) => Math.cos(x) - x, d: (x) => -Math.sin(x) - 1, box: [-2, 3, -3.5, 3], r: 0.7390851332151607 },
      atan: { n: "arctan x", f: Math.atan, d: (x) => 1 / (1 + x * x), box: [-6, 6, -2, 2], r: 0 },
      cbrt: { n: "∛x", f: Math.cbrt, d: (x) => (x === 0 ? NaN : 1 / (3 * Math.cbrt(x) ** 2)), box: [-4, 4, -2, 2], r: 0 }
    };
    function draw() {
      const c = C(), fn = N[S.val("fn")], x0 = S.val("x0"), n = S.val("n");
      const [a, b, lo, hi] = fn.box;
      const v = QSim.view(cv, 0.62), f = QSim.frame(v, { x0: a, x1: b, y0: lo, y1: hi, xl: "x", yl: "y" }); f.axes();
      f.fn(fn.f, c.main, 2.5, null, 600);
      const xs = [x0]; let note = "";
      for (let k = 0; k < n; k++) {
        const x = xs[k], y = fn.f(x), m = fn.d(x);
        if (!isFinite(m) || Math.abs(m) < 1e-12) { note = `x${k}에서 f'(x) = 0이라 접선이 x축과 만나지 않습니다.`; break; }
        const nx = x - y / m;
        f.path([[x, 0], [x, y]], c.ink3, 1, [3, 3]);
        f.path([[x, y], [nx, 0]], c.acc, 2);
        f.dot(x, y, c.acc, 4);
        xs.push(nx);
        if (!isFinite(nx) || Math.abs(nx) > 1e6) { note = "값이 한없이 커져 발산합니다."; break; }
      }
      xs.forEach((x, k) => { if (x >= a && x <= b) f.dot(x, 0, k === xs.length - 1 ? c.warn : c.ink, k === xs.length - 1 ? 5 : 3); });
      const rows = xs.map((x, k) => `x${k} = ${x.toFixed(10)}   |x${k} − r| = ${Math.abs(x - fn.r).toExponential(2)}`);
      S.out(`f(x) = ${fn.n}, 근 r = ${fn.r.toFixed(10)}\n` + rows.join("\n") + (note ? "\n" + note : ""));
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 리만 합 (04-01) */
  (() => {
    const S = QSim.card("lab-c1-riemann"); if (!S) return;
    const cv = S.$("canvas");
    const R = { sq: [0, 2, (x) => x * x, 8 / 3, "x², [0, 2]"], sin: [0, Math.PI, Math.sin, 2, "sin x, [0, π]"], exp: [0, 1, Math.exp, Math.E - 1, "eˣ, [0, 1]"], inv: [1, 3, (x) => 1 / x, Math.log(3), "1/x, [1, 3]"], cub: [-1, 2, (x) => x ** 3 - x, 2.25, "x³ − x, [−1, 2]"] };
    const sum = (fn, a, b, n, m) => { const dx = (b - a) / n; let s = 0; for (let i = 0; i < n; i++) { const l = a + i * dx; s += m === "trap" ? (fn(l) + fn(l + dx)) / 2 : fn(m === "left" ? l : m === "right" ? l + dx : l + dx / 2); } return s * dx; };
    function draw() {
      const c = C(), [a, b, fn, ex, nm] = R[S.val("fn")], n = S.val("n"), m = S.val("m");
      let lo = 0, hi = 0; for (let i = 0; i <= 100; i++) { const y = fn(a + ((b - a) * i) / 100); lo = Math.min(lo, y); hi = Math.max(hi, y); }
      const v = QSim.view(cv, 0.58), f = QSim.frame(v, { x0: a - 0.1 * (b - a), x1: b + 0.1 * (b - a), y0: lo - 0.1 * (hi - lo) - 0.01, y1: hi + 0.15 * (hi - lo), xl: "x" }); f.axes();
      const g = v.g, dx = (b - a) / n;
      for (let i = 0; i < n; i++) {
        const l = a + i * dx;
        g.fillStyle = c.soft; g.strokeStyle = c.main; g.globalAlpha = 0.6; g.lineWidth = 1;
        if (m === "trap") { g.beginPath(); g.moveTo(f.X(l), f.Y(0)); g.lineTo(f.X(l), f.Y(fn(l))); g.lineTo(f.X(l + dx), f.Y(fn(l + dx))); g.lineTo(f.X(l + dx), f.Y(0)); g.closePath(); g.fill(); g.globalAlpha = 1; g.stroke(); }
        else { const h = fn(m === "left" ? l : m === "right" ? l + dx : l + dx / 2); g.fillRect(f.X(l), Math.min(f.Y(h), f.Y(0)), f.X(l + dx) - f.X(l), Math.abs(f.Y(h) - f.Y(0))); g.globalAlpha = 1; g.strokeRect(f.X(l), Math.min(f.Y(h), f.Y(0)), f.X(l + dx) - f.X(l), Math.abs(f.Y(h) - f.Y(0))); }
      }
      g.globalAlpha = 1; f.fn(fn, c.acc, 2.5);
      const s = sum(fn, a, b, n, m), s2 = sum(fn, a, b, 2 * n, m);
      S.out(`${nm}: n = ${n}, ${{ left: "왼쪽 끝", right: "오른쪽 끝", mid: "가운데", trap: "사다리꼴" }[m]}\n합 = ${s.toFixed(6)}, 정확한 값 ${ex.toFixed(6)}, 오차 ${(s - ex).toExponential(3)}\nn을 두 배로 하면 오차가 ${(Math.abs(s - ex) / Math.max(1e-15, Math.abs(s2 - ex))).toFixed(2)}분의 1로 줄어든다`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 미적분의 기본정리 (04-02) */
  (() => {
    const S = QSim.card("lab-c1-ftc"); if (!S) return;
    const [c1, c2] = S.$$("canvas");
    const G = { sin: [(t) => Math.sin(t), "sin t"], par: [(t) => t * t / 4 - 1, "t²/4 − 1"], cos2: [(t) => Math.cos(2 * t) + 0.3, "cos 2t + 0.3"] };
    const area = (fn, x) => { const n = 400, h = x / n; let s = 0; for (let i = 0; i < n; i++) s += fn((i + 0.5) * h); return s * h; };
    function draw() {
      const c = C(), [fn, nm] = G[S.val("fn")], x = S.val("x");
      let v = QSim.view(c1, 0.45), f = QSim.frame(v, { x0: 0, x1: 6.3, y0: -1.6, y1: 1.6, xl: "t", yl: "f(t)" }); f.axes();
      const g = v.g; g.fillStyle = c.soft; g.globalAlpha = 0.7;
      for (let i = 0; i < 300; i++) { const t0 = (x * i) / 300, t1 = (x * (i + 1)) / 300, y = fn((t0 + t1) / 2); g.fillStyle = y >= 0 ? c.soft : "#f3c2c0"; g.fillRect(f.X(t0), Math.min(f.Y(y), f.Y(0)), f.X(t1) - f.X(t0) + 0.5, Math.abs(f.Y(y) - f.Y(0))); }
      g.globalAlpha = 1; f.fn(fn, c.main, 2.5); f.path([[x, -1.6], [x, 1.6]], c.ink3, 1, [3, 3]);
      const A = area(fn, x);
      v = QSim.view(c2, 0.45); let lo = 0, hi = 0; for (let i = 0; i <= 60; i++) { const y = area(fn, (6.3 * i) / 60); lo = Math.min(lo, y); hi = Math.max(hi, y); }
      f = QSim.frame(v, { x0: 0, x1: 6.3, y0: lo - 0.3, y1: hi + 0.3, xl: "x", yl: "A(x)" }); f.axes();
      f.fn((t) => area(fn, t), c.acc, 2.5, null, 200);
      f.path([[x - 0.8, A - 0.8 * fn(x)], [x + 0.8, A + 0.8 * fn(x)]], c.ink, 1.5); f.dot(x, A, c.acc, 5);
      S.out(`f(t) = ${nm}, A(x) = ∫₀ˣ f(t) dt\nx = ${x.toFixed(2)}: A(x) = ${A.toFixed(4)} (파랑은 더하고 빨강은 빼는 넓이)\nA의 접선 기울기 ≈ ${((area(fn, x + 1e-3) - area(fn, x - 1e-3)) / 2e-3).toFixed(4)}, f(x) = ${fn(x).toFixed(4)} → A'(x) = f(x)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 5. 극곡선 (07-03) */
  (() => {
    const S = QSim.card("lab-c1-polar"); if (!S) return;
    const cv = S.$("canvas"); let th = 0;
    const P = { rose: (q, k) => Math.cos(k * q), card: (q) => 1 + Math.cos(q), lima: (q, k, a) => a + Math.cos(q), spir: (q) => q / (2 * Math.PI) };
    const span = () => ({ rose: S.val("k") % 2 ? Math.PI : 2 * Math.PI, card: 2 * Math.PI, lima: 2 * Math.PI, spir: 6 * Math.PI })[S.val("cv")];
    function draw() {
      const c = C(), k = S.val("k"), a = S.val("a"), r = (q) => P[S.val("cv")](q, k, a), T = span();
      const v = QSim.view(cv, 0.8), R = S.val("cv") === "spir" ? 3.2 : S.val("cv") === "lima" ? a + 1.2 : 2.2;
      const f = QSim.frame(v, { x0: -R, x1: R, y0: -R * 0.8, y1: R * 0.8, equal: true }); f.axes({ noGrid: false });
      const pts = []; for (let i = 0; i <= 800; i++) { const q = (T * i) / 800; pts.push([r(q) * Math.cos(q), r(q) * Math.sin(q)]); } f.path(pts, c.rule, 1.2);
      const now = Math.min(th, T), drawn = []; for (let i = 0; i <= 400; i++) { const q = (now * i) / 400; drawn.push([r(q) * Math.cos(q), r(q) * Math.sin(q)]); } f.path(drawn, c.main, 2.5);
      const rx = r(now) * Math.cos(now), ry = r(now) * Math.sin(now);
      f.path([[0, 0], [Math.cos(now) * R * 2, Math.sin(now) * R * 2]], c.ink3, 1, [3, 3]); f.path([[0, 0], [rx, ry]], c.acc, 2); f.dot(rx, ry, c.acc, 5);
      let A = 0; const n = 2000; for (let i = 0; i < n; i++) { const q = (T * (i + 0.5)) / n; A += 0.5 * r(q) ** 2 * (T / n); }
      S.out(`θ = ${(now / Math.PI).toFixed(2)}π, r = ${r(now).toFixed(3)} (주황: 반지름, r < 0이면 반대 방향에 점이 찍힌다)\n한 바퀴 그리는 데 θ가 0부터 ${(T / Math.PI).toFixed(0)}π까지 필요\n½∫r² dθ (겹친 부분은 두 번 셈) = ${A.toFixed(4)}` + (S.val("cv") === "card" ? ` = 3π/2` : ""));
    }
    const L = QSim.loop((dt) => { th += dt * 1.2; if (th >= span()) { th = span(); draw(); return false; } draw(); }).watch(S.root);
    QSim.playButton(S.$(".play"), L, () => { if (th >= span()) th = 0; });
    S.on(() => { th = span(); if (!L.running) draw(); });
    QSim.redrawOn(draw); th = span(); draw();
  })();

  /* 6. 급수의 부분합 (08-04) */
  (() => {
    const S = QSim.card("lab-c1-series"); if (!S) return;
    const cv = S.$("canvas");
    const Ser = {
      geo: { n: "Σ rⁿ (n ≥ 0)", a: (n, r) => Math.pow(r, n), lim: (r) => (Math.abs(r) < 1 ? 1 / (1 - r) : NaN), z: 0 },
      harm: { n: "Σ 1/n", a: (n) => 1 / n, lim: () => Infinity, z: 1 },
      alt: { n: "Σ (−1)ⁿ⁺¹/n", a: (n) => (n % 2 ? 1 : -1) / n, lim: () => Math.log(2), z: 1, alt: true },
      p2: { n: "Σ 1/n²", a: (n) => 1 / (n * n), lim: () => (Math.PI ** 2) / 6, z: 1 },
      fact: { n: "Σ 1/n! (n ≥ 0)", a: (n) => { let p = 1; for (let i = 2; i <= n; i++) p *= i; return 1 / p; }, lim: () => Math.E, z: 0 }
    };
    function draw() {
      const c = C(), s = Ser[S.val("s")], N = S.val("N"), r = S.val("r");
      const ps = []; let t = 0; for (let n = s.z; n < s.z + N; n++) { t += s.a(n, r); ps.push(t); }
      const L = s.lim(r), finite = isFinite(L);
      const lo = Math.min(0, ...ps, finite ? L : 0), hi = Math.max(...ps, finite ? L : 0) * 1.1 + 0.1;
      const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: 0, x1: N + 1, y0: lo, y1: hi, xl: "N", yl: "S_N" }); f.axes();
      const g = v.g, w = Math.max(1, (f.X(1) - f.X(0)) * 0.7);
      ps.forEach((p, i) => { g.fillStyle = c.main; g.globalAlpha = 0.75; g.fillRect(f.X(i + 1) - w / 2, Math.min(f.Y(p), f.Y(0)), w, Math.abs(f.Y(p) - f.Y(0))); }); g.globalAlpha = 1;
      if (finite) f.path([[0, L], [N + 1, L]], c.acc, 2, [6, 4]);
      const SN = ps[ps.length - 1];
      S.out(`${s.n}${S.val("s") === "geo" ? ` (r = ${r})` : ""}: S_${N} = ${SN.toFixed(6)}\n` +
        (finite ? `극한 ${L.toFixed(6)} (주황 점선), 남은 오차 ${Math.abs(L - SN).toExponential(3)}` : (S.val("s") === "geo" ? "|r| ≥ 1: 발산" : "발산: 항은 0으로 가지만 부분합은 끝없이 커진다 (ln N 정도로 느리게)")) +
        (s.alt ? `\n교대급수 오차 한계 |a_${N + 1}| = ${(1 / (N + 1)).toExponential(3)}` : ""));
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 7. 테일러 다항식 (08-08) */
  (() => {
    const S = QSim.card("lab-c1-taylor"); if (!S) return;
    const cv = S.$("canvas");
    const fact = (k) => { let p = 1; for (let i = 2; i <= k; i++) p *= i; return p; };
    const T = {
      exp: { n: "eˣ", f: Math.exp, d: (k, a) => Math.exp(a), R: Infinity },
      sin: { n: "sin x", f: Math.sin, d: (k, a) => Math.sin(a + (k * Math.PI) / 2), R: Infinity },
      cos: { n: "cos x", f: Math.cos, d: (k, a) => Math.cos(a + (k * Math.PI) / 2), R: Infinity },
      ln: { n: "ln(1 + x)", f: (x) => (x > -1 ? Math.log(1 + x) : NaN), d: (k, a) => (k === 0 ? Math.log(1 + a) : ((k % 2 ? 1 : -1) * fact(k - 1)) / Math.pow(1 + a, k)), R: (a) => 1 + a },
      geo: { n: "1/(1 − x)", f: (x) => 1 / (1 - x), d: (k, a) => fact(k) / Math.pow(1 - a, k + 1), R: (a) => Math.abs(1 - a) }
    };
    function draw() {
      const c = C(), t = T[S.val("fn")], n = S.val("n"); let a = S.val("a");
      if (S.val("fn") === "ln" && a <= -0.9) a = -0.9; if (S.val("fn") === "geo" && Math.abs(a - 1) < 0.1) a = 0.9;
      const co = []; for (let k = 0; k <= n; k++) co.push(t.d(k, a) / fact(k));
      const P = (x) => { let s = 0, p = 1; for (let k = 0; k <= n; k++) { s += co[k] * p; p *= x - a; } return s; };
      const v = QSim.view(cv, 0.62), f = QSim.frame(v, { x0: -6, x1: 6, y0: -4, y1: 6, xl: "x" }); f.axes();
      const R = typeof t.R === "function" ? t.R(a) : Infinity;
      if (isFinite(R)) { const g = v.g; g.fillStyle = c.soft; g.globalAlpha = 0.35; g.fillRect(f.X(a - R), f.Y(6), f.X(a + R) - f.X(a - R), f.Y(-4) - f.Y(6)); g.globalAlpha = 1; }
      f.fn(t.f, c.main, 2.5, null, 800); f.fn((x) => { const y = P(x); return Math.abs(y) < 100 ? y : NaN; }, c.acc, 2, null, 800); f.dot(a, t.f(a), c.ink, 4);
      const x = S.val("x"), err = Math.abs(t.f(x) - P(x));
      S.out(`f(x) = ${t.n}, 중심 a = ${a}, 차수 n = ${n}\nx = ${x}: f(x) = ${t.f(x).toFixed(6)}, P_n(x) = ${P(x).toFixed(6)}, 오차 ${err.toExponential(2)}\n` +
        (isFinite(R) ? `수렴 반지름 ${R.toFixed(2)} (보라색 띠): 띠 밖에서는 n을 늘려도 맞지 않는다` : "모든 x에서 수렴: n을 늘리면 맞는 구간이 넓어진다"));
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
