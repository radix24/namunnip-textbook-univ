/* 공통2 실습 카드 묶음: 일차변환, 등위선, 기울기 벡터, 라그랑주 승수, 선적분, 그린 정리 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const FX = {
    bowl: { n: "x² + y²", f: (x, y) => x * x + y * y, g: (x, y) => [2 * x, 2 * y] },
    saddle: { n: "x² − y²", f: (x, y) => x * x - y * y, g: (x, y) => [2 * x, -2 * y] },
    hill: { n: "e^(−(x²+y²))", f: (x, y) => Math.exp(-(x * x + y * y)), g: (x, y) => { const e = Math.exp(-(x * x + y * y)); return [-2 * x * e, -2 * y * e]; } },
    wave: { n: "sin x · cos y", f: (x, y) => Math.sin(x) * Math.cos(y), g: (x, y) => [Math.cos(x) * Math.cos(y), -Math.sin(x) * Math.sin(y)] },
    monkey: { n: "x³ − 3xy²", f: (x, y) => x ** 3 - 3 * x * y * y, g: (x, y) => [3 * x * x - 3 * y * y, -6 * x * y] },
    ell: { n: "x² + 2y²", f: (x, y) => x * x + 2 * y * y, g: (x, y) => [2 * x, 4 * y] },
    lin: { n: "x + y", f: (x, y) => x + y, g: () => [1, 1] },
    prod: { n: "xy", f: (x, y) => x * y, g: (x, y) => [y, x] }
  };
  /* 등위선 지도: 셀 색 + 등위선(값의 칸이 바뀌는 점) */
  function contour(v, f, fn, levels = 14) {
    const c = C(), g = v.g, W = v.W, H = v.H, step = 5;
    let lo = Infinity, hi = -Infinity;
    for (let px = 0; px < W; px += 10) for (let py = 0; py < H; py += 10) { const x = f.x0 + (px - f.X(f.x0)) / f.sx, y = f.y0 + (f.Y(f.y0) - py) / f.sy, z = fn(x, y); if (isFinite(z)) { lo = Math.min(lo, z); hi = Math.max(hi, z); } }
    const span = hi - lo || 1, dz = span / levels;
    for (let px = 0; px < W; px += step) for (let py = 0; py < H; py += step) {
      const x = f.x0 + (px + step / 2 - f.X(f.x0)) / f.sx, y = f.y0 + (f.Y(f.y0) - py - step / 2) / f.sy, t = (fn(x, y) - lo) / span;
      g.fillStyle = t > 0.5 ? c.acc : c.main; g.globalAlpha = 0.08 + 0.32 * Math.abs(t - 0.5) * 2; g.fillRect(px, py, step, step);
    }
    g.globalAlpha = 1; g.fillStyle = c.ink2;
    for (let px = 0; px < W; px += 2) for (let py = 0; py < H; py += 2) {
      const x = f.x0 + (px - f.X(f.x0)) / f.sx, y = f.y0 + (f.Y(f.y0) - py) / f.sy;
      const a = Math.floor((fn(x, y) - lo) / dz), b = Math.floor((fn(x + 2 / f.sx, y) - lo) / dz), d = Math.floor((fn(x, y - 2 / f.sy) - lo) / dz);
      if (a !== b || a !== d) g.fillRect(px, py, 1.3, 1.3);
    }
    return { lo, hi, dz };
  }
  const drag = (cv, fr, pts, onMove) => {
    let d = null;
    const pos = (e) => { const r = cv.getBoundingClientRect(), f = fr(); return { x: f.x0 + (e.clientX - r.left - f.X(f.x0)) / f.sx, y: f.y0 + (f.Y(f.y0) - (e.clientY - r.top)) / f.sy }; };
    cv.addEventListener("pointerdown", (e) => { const p = pos(e); d = pts().find((q) => Math.hypot(q.x - p.x, q.y - p.y) < 0.35) || pts()[0]; d.x = p.x; d.y = p.y; cv.setPointerCapture(e.pointerId); onMove(); });
    cv.addEventListener("pointermove", (e) => { if (!d) return; const p = pos(e); d.x = p.x; d.y = p.y; onMove(); });
    cv.addEventListener("pointerup", () => { d = null; });
  };

  /* 1. 일차변환 (02-03) */
  (() => {
    const S = QSim.card("lab-c2-linmap"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), t = S.val("t"), A = [S.val("a"), S.val("b"), S.val("c"), S.val("d")];
      const M = [1 + t * (A[0] - 1), t * A[1], t * A[2], 1 + t * (A[3] - 1)], T = (x, y) => [M[0] * x + M[1] * y, M[2] * x + M[3] * y];
      const v = QSim.view(cv, 0.8), f = QSim.frame(v, { x0: -4, x1: 4, y0: -3.2, y1: 3.2, equal: true }); f.axes({ noGrid: true });
      for (let k = -4; k <= 4; k++) { f.path([T(k, -4), T(k, 4)], c.rule, 1); f.path([T(-4, k), T(4, k)], c.rule, 1); }
      const sq = [T(0, 0), T(1, 0), T(1, 1), T(0, 1), T(0, 0)], g = v.g;
      g.fillStyle = c.soft; g.globalAlpha = 0.6; g.beginPath(); sq.forEach(([x, y], i) => (i ? g.lineTo(f.X(x), f.Y(y)) : g.moveTo(f.X(x), f.Y(y)))); g.fill(); g.globalAlpha = 1;
      f.arrow(0, 0, ...T(1, 0), c.main, "Ai"); f.arrow(0, 0, ...T(0, 1), c.acc, "Aj");
      const det = A[0] * A[3] - A[1] * A[2], tr = A[0] + A[3], disc = tr * tr - 4 * det;
      let eig = "실수 고유값 없음 (회전 성분)";
      if (disc >= 0) {
        const l1 = (tr + Math.sqrt(disc)) / 2, l2 = (tr - Math.sqrt(disc)) / 2;
        const vec = (l) => (Math.abs(A[1]) > 1e-9 ? [A[1], l - A[0]] : Math.abs(A[2]) > 1e-9 ? [l - A[3], A[2]] : l === A[0] ? [1, 0] : [0, 1]);
        [l1, l2].forEach((l) => { const [p, q] = vec(l), n = Math.hypot(p, q) || 1; f.path([[-5 * p / n, -5 * q / n], [5 * p / n, 5 * q / n]], c.warn, 1.2, [5, 4]); });
        eig = `고유값 ${l1.toFixed(3)}, ${l2.toFixed(3)} (빨간 점선: 고유벡터 방향, 변환해도 방향이 그대로)`;
      }
      S.out(`A = [[${A[0]}, ${A[1]}], [${A[2]}, ${A[3]}]]   변환 진행 ${Math.round(t * 100)}%\n행렬식 det A = ${det.toFixed(3)} → 넓이 ${Math.abs(det).toFixed(3)}배${det < 0 ? ", 방향(시계/반시계)이 뒤집힘" : det === 0 ? ", 평면이 직선으로 눌림" : ""}\n${eig}`);
    }
    S.$$(".preset").forEach((b) => b.addEventListener("click", () => { b.dataset.m.split(",").forEach((x, i) => { S.$(`[name=${"abcd"[i]}]`).value = x; }); S.$("[name=t]").value = 1; S.show(); draw(); }));
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 등위선과 단면 (04-01) */
  (() => {
    const S = QSim.card("lab-c2-contour"); if (!S) return;
    const [c1, c2] = S.$$("canvas"); const p = { x: 0.6, y: 0.4 }; let fr = null;
    function draw() {
      const c = C(), F = FX[S.val("fn")], yc = S.val("yc");
      const v = QSim.view(c1, 0.75); fr = QSim.frame(v, { x0: -2, x1: 2, y0: -1.5, y1: 1.5, equal: true, pad: 4 });
      contour(v, fr, F.f); fr.path([[-2, yc], [2, yc]], c.warn, 1.5, [5, 3]);
      fr.dot(p.x, p.y, c.ink, 5);
      const v2 = QSim.view(c2, 0.4); let lo = Infinity, hi = -Infinity; for (let i = 0; i <= 100; i++) { const z = F.f(-2 + i * 0.04, yc); lo = Math.min(lo, z); hi = Math.max(hi, z); }
      const f2 = QSim.frame(v2, { x0: -2, x1: 2, y0: lo - 0.1 * (hi - lo + 0.1), y1: hi + 0.1 * (hi - lo + 0.1), xl: "x", yl: `f(x, ${yc})` }); f2.axes();
      f2.fn((x) => F.f(x, yc), c.warn, 2.5);
      const [gx, gy] = F.g(p.x, p.y);
      S.out(`f(x, y) = ${F.n}\n검은 점 (${p.x.toFixed(2)}, ${p.y.toFixed(2)}): f = ${F.f(p.x, p.y).toFixed(4)}, f_x = ${gx.toFixed(4)}, f_y = ${gy.toFixed(4)}\n아래 그래프: 빨간 점선 y = ${yc}로 자른 단면. 그 기울기가 f_x이다. (점은 끌어 옮길 수 있다)`);
    }
    drag(c1, () => fr, () => [p], draw);
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 방향도함수와 기울기 벡터 (04-05) */
  (() => {
    const S = QSim.card("lab-c2-gradient"); if (!S) return;
    const [c1, c2] = S.$$("canvas"); const p = { x: 0.8, y: 0.5 }; let fr = null;
    function draw() {
      const c = C(), F = FX[S.val("fn")], th = (S.val("th") * Math.PI) / 180;
      const v = QSim.view(c1, 0.75); fr = QSim.frame(v, { x0: -2, x1: 2, y0: -1.5, y1: 1.5, equal: true, pad: 4 });
      contour(v, fr, F.f);
      const [gx, gy] = F.g(p.x, p.y), m = Math.hypot(gx, gy), s = 0.5 / Math.max(m, 1e-9);
      fr.dot(p.x, p.y, c.ink, 5);
      fr.arrow(p.x, p.y, gx * s * Math.min(m, 2), gy * s * Math.min(m, 2), c.warn, "∇f");
      fr.arrow(p.x, p.y, 0.5 * Math.cos(th), 0.5 * Math.sin(th), c.main, "u");
      const D = gx * Math.cos(th) + gy * Math.sin(th);
      const v2 = QSim.view(c2, 0.35), f2 = QSim.frame(v2, { x0: 0, x1: 360, y0: -Math.max(m, 0.1) * 1.2, y1: Math.max(m, 0.1) * 1.2, xl: "방향 각 (°)", yl: "D_u f" }); f2.axes();
      f2.fn((d) => gx * Math.cos((d * Math.PI) / 180) + gy * Math.sin((d * Math.PI) / 180), c.main, 2); f2.dot(S.val("th"), D, c.acc, 5);
      S.out(`f = ${F.n}, 점 (${p.x.toFixed(2)}, ${p.y.toFixed(2)}): ∇f = (${gx.toFixed(3)}, ${gy.toFixed(3)}), |∇f| = ${m.toFixed(3)}\n방향 ${S.val("th")}°의 방향도함수 D_u f = ∇f·u = ${D.toFixed(3)}\n가장 큰 값 ${m.toFixed(3)}은 ∇f 방향(${(Math.atan2(gy, gx) * 180 / Math.PI).toFixed(0)}°), 0이 되는 방향은 등위선을 따라가는 방향`);
    }
    drag(c1, () => fr, () => [p], draw);
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 라그랑주 승수 (05-03) */
  (() => {
    const S = QSim.card("lab-c2-lagrange"); if (!S) return;
    const [c1, c2] = S.$$("canvas");
    const G = { circ: { n: "x² + y² = 1", p: (t) => [Math.cos(t), Math.sin(t)], g: (x, y) => [2 * x, 2 * y] }, ell: { n: "x²/4 + y² = 1", p: (t) => [2 * Math.cos(t), Math.sin(t)], g: (x, y) => [x / 2, 2 * y] } };
    function draw() {
      const c = C(), F = FX[S.val("fn")], g = G[S.val("con")], t = (S.val("t") * Math.PI) / 180;
      const v = QSim.view(c1, 0.75), f = QSim.frame(v, { x0: -2.6, x1: 2.6, y0: -1.9, y1: 1.9, equal: true, pad: 4 });
      contour(v, f, F.f, 16);
      const pts = []; for (let i = 0; i <= 200; i++) pts.push(g.p((2 * Math.PI * i) / 200)); f.path(pts, c.ink, 2.5);
      const [x, y] = g.p(t), [fx, fy] = F.g(x, y), [gx, gy] = g.g(x, y);
      const nf = Math.hypot(fx, fy) || 1, ng = Math.hypot(gx, gy) || 1;
      f.dot(x, y, c.acc, 6); f.arrow(x, y, (0.6 * fx) / nf, (0.6 * fy) / nf, c.warn, "∇f"); f.arrow(x, y, (0.6 * gx) / ng, (0.6 * gy) / ng, c.main, "∇g");
      const cross = (fx * gy - fy * gx) / (nf * ng), ang = (Math.acos(Math.max(-1, Math.min(1, (fx * gx + fy * gy) / (nf * ng)))) * 180) / Math.PI;
      const vals = []; for (let i = 0; i <= 360; i++) { const [a, b] = g.p((i * Math.PI) / 180); vals.push([i, F.f(a, b)]); }
      const lo = Math.min(...vals.map((q) => q[1])), hi = Math.max(...vals.map((q) => q[1]));
      const v2 = QSim.view(c2, 0.35), f2 = QSim.frame(v2, { x0: 0, x1: 360, y0: lo - 0.1 * (hi - lo + 0.1), y1: hi + 0.1 * (hi - lo + 0.1), xl: "조건 곡선 위 위치 t (°)", yl: "f" }); f2.axes();
      f2.path(vals, c.acc, 2); f2.dot(S.val("t"), F.f(x, y), c.ink, 5);
      S.out(`f = ${F.n}, 조건 ${g.n}\n점 (${x.toFixed(3)}, ${y.toFixed(3)}): f = ${F.f(x, y).toFixed(4)}, ∇f와 ∇g 사이 각 ${ang.toFixed(1)}°\n` +
        (Math.abs(cross) < 0.02 ? "두 기울기 벡터가 평행: ∇f = λ∇g. 이 점에서 f가 조건 위의 최댓값 또는 최솟값을 가진다" : "평행하지 않음: 조건을 따라 움직이면 f를 더 키우거나 줄일 수 있다") +
        `\n조건 위 최댓값 ${hi.toFixed(4)}, 최솟값 ${lo.toFixed(4)} (아래 그래프)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 5. 벡터장과 선적분 (07-02) */
  (() => {
    const S = QSim.card("lab-c2-lineint"); if (!S) return;
    const [c1, c2] = S.$$("canvas"); let s = 0;
    const VF = { rot: { n: "⟨−y, x⟩", F: (x, y) => [-y, x] }, rad: { n: "⟨x, y⟩", F: (x, y) => [x, y] }, shear: { n: "⟨y, 0⟩", F: (x, y) => [y, 0] }, grad: { n: "∇(x²y) = ⟨2xy, x²⟩", F: (x, y) => [2 * x * y, x * x] } };
    const PA = { arc: { n: "위쪽 반원 (1,0)→(−1,0)", r: (u) => [Math.cos(Math.PI * u), Math.sin(Math.PI * u)], d: (u) => [-Math.PI * Math.sin(Math.PI * u), Math.PI * Math.cos(Math.PI * u)] }, seg: { n: "선분 (1,0)→(−1,0)", r: (u) => [1 - 2 * u, 0], d: () => [-2, 0] }, low: { n: "아래쪽 반원 (1,0)→(−1,0)", r: (u) => [Math.cos(Math.PI * u), -Math.sin(Math.PI * u)], d: (u) => [-Math.PI * Math.sin(Math.PI * u), -Math.PI * Math.cos(Math.PI * u)] }, circ: { n: "단위원 한 바퀴 (반시계)", r: (u) => [Math.cos(2 * Math.PI * u), Math.sin(2 * Math.PI * u)], d: (u) => [-2 * Math.PI * Math.sin(2 * Math.PI * u), 2 * Math.PI * Math.cos(2 * Math.PI * u)] } };
    const work = (F, P, upto) => { const n = 800; let W = 0; const out = [[0, 0]]; for (let i = 0; i < n; i++) { const u = ((i + 0.5) / n) * upto, [x, y] = P.r(u), [dx, dy] = P.d(u), [a, b] = F(x, y); W += (a * dx + b * dy) * (upto / n); if (i % 8 === 7) out.push([((i + 1) / n) * upto, W]); } return { W, out }; };
    function draw() {
      const c = C(), V = VF[S.val("vf")], P = PA[S.val("path")];
      const v = QSim.view(c1, 0.7), f = QSim.frame(v, { x0: -1.8, x1: 1.8, y0: -1.3, y1: 1.3, equal: true, pad: 4 }); f.axes({ noGrid: true });
      for (let x = -1.6; x <= 1.61; x += 0.4) for (let y = -1.2; y <= 1.21; y += 0.4) { const [a, b] = V.F(x, y), m = Math.hypot(a, b); if (m > 1e-6) f.arrow(x, y, (0.16 * a) / Math.max(m, 0.6), (0.16 * b) / Math.max(m, 0.6), c.ink3); }
      const pts = []; for (let i = 0; i <= 200; i++) pts.push(P.r(i / 200)); f.path(pts, c.main, 2.5);
      const [x, y] = P.r(s), [a, b] = V.F(x, y), [dx, dy] = P.d(s), nd = Math.hypot(dx, dy) || 1;
      f.dot(x, y, c.acc, 6); f.arrow(x, y, 0.3 * a, 0.3 * b, c.warn, "F"); f.arrow(x, y, (0.3 * dx) / nd, (0.3 * dy) / nd, c.main);
      const tot = work(V.F, P, 1), now = work(V.F, P, s);
      const v2 = QSim.view(c2, 0.35), lo = Math.min(0, ...tot.out.map((q) => q[1])), hi = Math.max(0.1, ...tot.out.map((q) => q[1]));
      const f2 = QSim.frame(v2, { x0: 0, x1: 1, y0: lo - 0.2, y1: hi + 0.2, xl: "경로 진행", yl: "누적 일" }); f2.axes();
      f2.path(tot.out, c.rule, 1.5, [4, 3]); f2.path(now.out, c.acc, 2.5);
      S.out(`F = ${V.n}, 경로: ${P.n}\n지금까지 한 일 ${now.W.toFixed(4)}, 전체 ∫F·dr = ${tot.W.toFixed(4)}\n${S.val("vf") === "grad" ? "보존장: 끝점이 같으면 어느 경로든 같은 값(퍼텐셜 차 f(−1,0) − f(1,0) = 0)" : "경로를 바꿔 같은 두 끝점 사이의 값이 같은지 비교해 보세요"}`);
    }
    const L = QSim.loop((dt) => { s += dt * 0.25; if (s >= 1) { s = 1; draw(); return false; } draw(); }).watch(S.root);
    QSim.playButton(S.$(".play"), L, () => { if (s >= 1) s = 0; });
    S.on(() => { s = 1; if (!L.running) draw(); });
    QSim.redrawOn(draw); s = 1; draw();
  })();

  /* 6. 그린 정리 (07-04) */
  (() => {
    const S = QSim.card("lab-c2-green"); if (!S) return;
    const cv = S.$("canvas"); const ctr = { x: 0.3, y: 0.2 }; let fr = null;
    const VF = {
      rot: { n: "⟨−y, x⟩", F: (x, y) => [-y, x], curl: () => 2 },
      cub: { n: "⟨−y³, x³⟩", F: (x, y) => [-(y ** 3), x ** 3], curl: (x, y) => 3 * x * x + 3 * y * y },
      mix: { n: "⟨sin y, x²⟩", F: (x, y) => [Math.sin(y), x * x], curl: (x, y) => 2 * x - Math.cos(y) },
      rad: { n: "⟨x, y⟩", F: (x, y) => [x, y], curl: () => 0 },
      sh: { n: "⟨x²y, x⟩", F: (x, y) => [x * x * y, x], curl: (x) => 1 - x * x }
    };
    function draw() {
      const c = C(), V = VF[S.val("vf")], r = S.val("r");
      const v = QSim.view(cv, 0.75); fr = QSim.frame(v, { x0: -2, x1: 2, y0: -1.5, y1: 1.5, equal: true, pad: 4 });
      const g = v.g, step = 6;
      let cm = 0.01; for (let x = -2; x <= 2; x += 0.2) for (let y = -1.5; y <= 1.5; y += 0.2) cm = Math.max(cm, Math.abs(V.curl(x, y)));
      for (let px = 0; px < v.W; px += step) for (let py = 0; py < v.H; py += step) { const x = -2 + (px - fr.X(-2)) / fr.sx, y = -1.5 + (fr.Y(-1.5) - py) / fr.sy, k = V.curl(x, y); g.fillStyle = k > 0 ? c.acc : c.main; g.globalAlpha = (0.4 * Math.abs(k)) / cm; g.fillRect(px, py, step, step); }
      g.globalAlpha = 1;
      for (let x = -1.8; x <= 1.81; x += 0.3) for (let y = -1.35; y <= 1.36; y += 0.3) { const [a, b] = V.F(x, y), m = Math.hypot(a, b); if (m > 1e-6) fr.arrow(x, y, (0.13 * a) / Math.max(m, 0.8), (0.13 * b) / Math.max(m, 0.8), c.ink3); }
      const pts = []; for (let i = 0; i <= 200; i++) { const q = (2 * Math.PI * i) / 200; pts.push([ctr.x + r * Math.cos(q), ctr.y + r * Math.sin(q)]); } fr.path(pts, c.ink, 2.5); fr.dot(ctr.x, ctr.y, c.ink, 4);
      let circ = 0; const n = 2000; for (let i = 0; i < n; i++) { const q = (2 * Math.PI * (i + 0.5)) / n, x = ctr.x + r * Math.cos(q), y = ctr.y + r * Math.sin(q), [a, b] = V.F(x, y); circ += (a * -r * Math.sin(q) + b * r * Math.cos(q)) * ((2 * Math.PI) / n); }
      let dbl = 0; const m = 120; for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) { const rr = (r * (i + 0.5)) / m, q = (2 * Math.PI * (j + 0.5)) / m; dbl += V.curl(ctr.x + rr * Math.cos(q), ctr.y + rr * Math.sin(q)) * rr * (r / m) * ((2 * Math.PI) / m); }
      S.out(`F = ${V.n}, 회전(스칼라) Q_x − P_y의 색: 주황 양수(반시계 소용돌이), 파랑 음수\n원 둘레의 순환 ∮F·dr = ${circ.toFixed(4)}\n원 안의 ∬(Q_x − P_y) dA = ${dbl.toFixed(4)}   (그린 정리: 두 값이 같다. 중심은 끌어 옮길 수 있다)`);
    }
    drag(cv, () => fr, () => [ctr], draw);
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
