/* 공통2 체험 카드 묶음 2: 외적과 평행사변형, 극좌표 이중적분. */
(() => {
  "use strict";
  const C = () => QSim.col();

  /* 1. 외적: 두 벡터에 수직인 벡터와 넓이 (01-01) */
  (() => {
    const S = QSim.card("lab-c2-cross"); if (!S) return;
    const cv = S.$("canvas");
    const P = (x, y, z) => [y - 0.55 * x, z - 0.4 * x]; /* 비스듬히 본 그림: x축은 앞(왼쪽 아래), y축은 오른쪽, z축은 위 */
    function draw() {
      const c = C(), th = (S.val("th") * Math.PI) / 180, bl = S.val("b"), bz = S.val("bz");
      const a = [2, 0, 0], b = [bl * Math.cos(th), bl * Math.sin(th), bz];
      const n = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
      const v = QSim.view(cv, 0.62), F = QSim.frame(v, { x0: -2.6, x1: 3.4, y0: -2, y1: 4, equal: true });
      const g = v.g, L = (p, q, col, w = 1.5, d) => { const A = P(...p), B = P(...q); F.path([A, B], col, w, d); };
      L([0, 0, 0], [3.2, 0, 0], c.ink3, 1, [3, 3]); L([0, 0, 0], [0, 3, 0], c.ink3, 1, [3, 3]); L([0, 0, 0], [0, 0, 3.6], c.ink3, 1, [3, 3]);
      F.text("x", ...P(3.4, 0, 0), c.ink3); F.text("y", ...P(0, 3.15, 0), c.ink3); F.text("z", ...P(0, 0, 3.75), c.ink3);
      const q = [[0, 0, 0], a, [a[0] + b[0], a[1] + b[1], a[2] + b[2]], b].map((p) => P(...p));
      g.save(); g.fillStyle = c.soft; g.globalAlpha = 0.6; g.beginPath(); q.forEach(([x, y], i) => (i ? g.lineTo(F.X(x), F.Y(y)) : g.moveTo(F.X(x), F.Y(y)))); g.closePath(); g.fill(); g.restore();
      const ar = (p, col, lab) => { const [x, y] = P(...p); F.arrow(0, 0, x, y, col, lab); };
      ar(a, c.main, "a"); ar(b, c.main, "b");
      const nl = Math.hypot(...n), s = nl > 3.2 ? 3.2 / nl : 1;
      ar(n.map((t) => t * s), c.acc, s < 1 ? "a×b (줄여 그림)" : "a×b");
      const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2], na = 2, nb = Math.hypot(...b);
      S.out(`a = (2, 0, 0),  b = (${b.map((t) => t.toFixed(2)).join(", ")})\n` +
        `a × b = (${n.map((t) => t.toFixed(2)).join(", ")}),  |a × b| = ${nl.toFixed(3)} = 평행사변형의 넓이\n` +
        `(a × b)·a = ${(n[0] * a[0] + n[1] * a[1] + n[2] * a[2]).toFixed(3)},  (a × b)·b = ${(n[0] * b[0] + n[1] * b[1] + n[2] * b[2]).toFixed(3)}  (둘 다 0: 수직)\n` +
        `확인: |a×b|² + (a·b)² = ${(nl * nl + dot * dot).toFixed(3)},  |a|²|b|² = ${(na * na * nb * nb).toFixed(3)}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 극좌표로 바꾼 이중적분 (06-03) */
  (() => {
    const S = QSim.card("lab-c2-polar"); if (!S) return;
    const cv = S.$("canvas");
    const f = (x, y) => Math.exp(-(x * x + y * y));
    function draw() {
      const c = C(), R = S.val("R"), n = S.val("n"), polar = S.val("m") === "polar";
      const v = QSim.view(cv, 0.8), F = QSim.frame(v, { x0: -R - 0.2, x1: R + 0.2, y0: -R - 0.2, y1: R + 0.2, equal: true, xl: "x", yl: "y" });
      const g = v.g; let sum = 0;
      const shade = (val) => { g.fillStyle = c.main; g.globalAlpha = 0.08 + 0.75 * val; };
      g.save();
      if (polar) {
        const dr = R / n, m = 4 * n, dt = (2 * Math.PI) / m;
        for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
          const r = (i + 0.5) * dr, t = (j + 0.5) * dt, val = Math.exp(-r * r);
          sum += val * r * dr * dt; shade(val);
          g.beginPath(); g.arc(F.X(0), F.Y(0), (i + 1) * dr * F.sx, -(j + 1) * dt, -j * dt); g.arc(F.X(0), F.Y(0), i * dr * F.sx, -j * dt, -(j + 1) * dt, true); g.closePath(); g.fill();
          g.globalAlpha = 0.5; g.strokeStyle = c.card; g.stroke();
        }
      } else {
        const h = (2 * R) / n;
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
          const x = -R + (i + 0.5) * h, y = -R + (j + 0.5) * h;
          if (x * x + y * y > R * R) continue;
          const val = f(x, y); sum += val * h * h; shade(val);
          g.fillRect(F.X(x - h / 2), F.Y(y + h / 2), h * F.sx, h * F.sy); g.globalAlpha = 0.5; g.strokeStyle = c.card; g.strokeRect(F.X(x - h / 2), F.Y(y + h / 2), h * F.sx, h * F.sy);
        }
      }
      g.restore();
      g.save(); g.strokeStyle = c.acc; g.lineWidth = 2; g.beginPath(); g.arc(F.X(0), F.Y(0), R * F.sx, 0, 7); g.stroke(); g.restore();
      const ex = Math.PI * (1 - Math.exp(-R * R));
      S.out(`∬ e^(−x²−y²) dA,  영역: 반지름 ${R.toFixed(1)}인 원판\n` +
        (polar ? `극좌표 조각 ${n}×${4 * n}개: Σ e^(−r²) r Δr Δθ = ${sum.toFixed(5)}` : `정사각형 조각(중심이 원 안인 것): Σ f Δx Δy = ${sum.toFixed(5)}`) +
        `\n정확한 값 π(1 − e^(−R²)) = ${ex.toFixed(5)},  오차 ${(sum - ex).toExponential(2)},  R → ∞이면 π = 3.14159`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
  /* 3. 이차곡면을 평면으로 잘라 보기 (01-03) */
  (() => {
    const S = QSim.card("lab-c2-quadric"); if (!S) return;
    const [c1, c2] = S.$$("canvas");
    /* 각 곡면: g(x, y, z) = 0. 자른 곡선은 격자에서 부호가 바뀌는 곳을 점으로 찍어 그린다 */
    const Q = {
      ell: { n: "타원면 x²/4 + y² + z² = 1", g: (x, y, z) => x * x / 4 + y * y + z * z - 1 },
      hyp1: { n: "일엽쌍곡면 x²/4 + y² − z² = 1", g: (x, y, z) => x * x / 4 + y * y - z * z - 1 },
      hyp2: { n: "이엽쌍곡면 −x²/4 − y² + z² = 1", g: (x, y, z) => -x * x / 4 - y * y + z * z - 1 },
      par: { n: "타원포물면 z = x²/4 + y²", g: (x, y, z) => x * x / 4 + y * y - z },
      sad: { n: "쌍곡포물면 z = x²/4 − y²", g: (x, y, z) => x * x / 4 - y * y - z },
      cone: { n: "원뿔 z² = x²/4 + y²", g: (x, y, z) => x * x / 4 + y * y - z * z }
    };
    /* 부호가 바뀌는 격자 칸을 모아 한 번에 칠한다 (점을 하나씩 그리면 느림) */
    const level = (F, g, fn, col) => {
      const N = 160; let hit = false;
      const hx = (F.x1 - F.x0) / N, hy = (F.y1 - F.y0) / N;
      g.beginPath();
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const x = F.x0 + hx * i, y = F.y0 + hy * j;
        const a = fn(x, y), b = fn(x + hx, y), d = fn(x, y + hy);
        if (a * b <= 0 || a * d <= 0) { g.rect(F.X(x + hx / 2) - 1.2, F.Y(y + hy / 2) - 1.2, 2.4, 2.4); hit = true; }
      }
      g.fillStyle = col; g.fill();
      return hit;
    };
    function draw() {
      const c = C(), q = Q[S.val("q")], k = S.val("k");
      const v1 = QSim.view(c1, 0.75), F1 = QSim.frame(v1, { x0: -3.2, x1: 3.2, y0: -2.4, y1: 2.4, equal: true, xl: "x", yl: "y" }); F1.axes();
      const any = level(F1, v1.g, (x, y) => q.g(x, y, k), c.main);
      F1.text(`z = ${k.toFixed(1)}로 자른 곡선`, -3.1, 2.15, c.ink2);
      const v2 = QSim.view(c2, 0.75), F2 = QSim.frame(v2, { x0: -3.2, x1: 3.2, y0: -2.4, y1: 2.4, equal: true, xl: "x", yl: "z" }); F2.axes();
      level(F2, v2.g, (x, z) => q.g(x, 0, z), c.acc);
      F2.path([[-3.2, k], [3.2, k]], c.ink3, 1, [4, 4]);
      F2.text("y = 0으로 자른 곡선", -3.1, 2.15, c.ink2);
      S.out(`${q.n}\n위: 높이 z = ${k.toFixed(1)}인 수평면으로 자른 자취 ${any ? "" : "(이 높이에서는 곡면과 만나지 않음)"}\n아래: xz평면(y = 0)으로 자른 자취, 점선은 지금 높이`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 나선: 공간곡선의 속도, 길이, 곡률 (03-01) */
  (() => {
    const S = QSim.card("lab-c2-helix"); if (!S) return;
    const cv = S.$("canvas");
    const P = (x, y, z) => [y - 0.55 * x, z - 0.4 * x];
    function draw() {
      const c = C(), t = (S.val("t") * Math.PI) / 180, cc = S.val("c");
      const top = 4 * Math.PI * cc;
      const v = QSim.view(cv, 0.75), F = QSim.frame(v, { x0: -2.4, x1: 2.4, y0: -1.6, y1: Math.max(2, top + 0.6), equal: true });
      const L = (p, q, col, w, d) => F.path([P(...p), P(...q)], col, w, d);
      L([0, 0, 0], [1.8, 0, 0], c.ink3, 1, [3, 3]); L([0, 0, 0], [0, 1.6, 0], c.ink3, 1, [3, 3]); L([0, 0, 0], [0, 0, Math.max(1.4, top)], c.ink3, 1, [3, 3]);
      const all = [], done = [];
      for (let k = 0; k <= 600; k++) { const s = (4 * Math.PI * k) / 600; all.push(P(Math.cos(s), Math.sin(s), cc * s)); }
      for (let k = 0; k <= 400; k++) { const s = (t * k) / 400; done.push(P(Math.cos(s), Math.sin(s), cc * s)); }
      F.path(all, c.soft, 2); F.path(done, c.main, 2.5);
      const r = [Math.cos(t), Math.sin(t), cc * t], vel = [-Math.sin(t), Math.cos(t), cc];
      const [x, y] = P(...r), [ex, ey] = P(r[0] + vel[0], r[1] + vel[1], r[2] + vel[2]);
      F.arrow(x, y, ex - x, ey - y, c.acc, "r′(t)"); F.dot(x, y, c.ink, 5);
      const sp = Math.sqrt(1 + cc * cc);
      S.out(`r(t) = (cos t, sin t, ct),  c = ${cc.toFixed(2)} (한 바퀴에 2πc = ${(2 * Math.PI * cc).toFixed(3)}만큼 올라감),  t = ${t.toFixed(3)}\n` +
        `r′(t) = (−sin t, cos t, c),  속력 |r′| = √(1 + c²) = ${sp.toFixed(4)} (t와 상관없이 일정)\n` +
        `0부터 t까지의 길이 = t√(1 + c²) = ${(t * sp).toFixed(4)},  곡률 κ = 1/(1 + c²) = ${(1 / (1 + cc * cc)).toFixed(4)}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 5. 접평면과 선형근사 (04-03) */
  (() => {
    const S = QSim.card("lab-c2-tangent"); if (!S) return;
    const cv = S.$("canvas");
    const R = {
      a: { n: "f(x, y) = x² + 3y²", f: (x, y) => x * x + 3 * y * y, fx: (x) => 2 * x, fy: (x, y) => 6 * y },
      b: { n: "f(x, y) = √(x² + y²)", f: (x, y) => Math.hypot(x, y), fx: (x, y) => x / Math.hypot(x, y), fy: (x, y) => y / Math.hypot(x, y) },
      c: { n: "f(x, y) = x eʸ", f: (x, y) => x * Math.exp(y), fx: (x, y) => Math.exp(y), fy: (x, y) => x * Math.exp(y) }
    };
    function draw() {
      const c = C(), r = R[S.val("fn")], a = S.val("a"), b = S.val("b"), h = S.val("h");
      const v = QSim.view(cv, 0.7), F = QSim.frame(v, { x0: -2, x1: 2, y0: -1.5, y1: 1.5, equal: true, xl: "x", yl: "y" });
      const g = v.g, N = 64;
      let lo = Infinity, hi = -Infinity; const vals = [];
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const x = -2 + (4 * (i + 0.5)) / N, y = -1.5 + (3 * (j + 0.5)) / N, z = r.f(x, y); vals.push([x, y, z]); lo = Math.min(lo, z); hi = Math.max(hi, z); }
      /* 색 지도는 N×N 픽셀 그림 한 장으로 만들어 늘려 그린다 (사각형을 하나씩 그리면 느림) */
      const off = document.createElement("canvas"); off.width = N; off.height = N;
      const og = off.getContext("2d"), img = og.createImageData(N, N), m = /^#?([0-9a-f]{6})$/i.exec(c.main.trim());
      const [cr, cg, cb] = m ? [0, 2, 4].map((k) => parseInt(m[1].slice(k, k + 2), 16)) : [75, 79, 224];
      vals.forEach(([x, y, z], idx) => { const i = Math.floor(idx / N), j = idx % N, p = 4 * ((N - 1 - j) * N + i); img.data[p] = cr; img.data[p + 1] = cg; img.data[p + 2] = cb; img.data[p + 3] = Math.round(255 * (0.05 + (0.6 * (z - lo)) / (hi - lo || 1))); });
      og.putImageData(img, 0, 0);
      g.imageSmoothingEnabled = true; g.drawImage(off, F.X(-2), F.Y(1.5), F.X(2) - F.X(-2), F.Y(-1.5) - F.Y(1.5));
      F.axes({ noGrid: true });
      const fa = r.f(a, b), fx = r.fx(a, b), fy = r.fy(a, b), dx = h * Math.cos(Math.PI / 6), dy = h * Math.sin(Math.PI / 6);
      F.dot(a, b, c.ink, 5); F.path([[a, b], [a + dx, b + dy]], c.acc, 2); F.dot(a + dx, b + dy, c.acc, 4);
      const L = fa + fx * dx + fy * dy, ex = r.f(a + dx, b + dy);
      S.out(`${r.n},  점 (${a.toFixed(2)}, ${b.toFixed(2)}),  f = ${fa.toFixed(4)},  fₓ = ${isFinite(fx) ? fx.toFixed(4) : "없음"},  f_y = ${isFinite(fy) ? fy.toFixed(4) : "없음"}\n` +
        `접평면 z = f(a, b) + fₓ(x − a) + f_y(y − b)\n(${(a + dx).toFixed(3)}, ${(b + dy).toFixed(3)})로 움직이면:  실제 f = ${ex.toFixed(5)},  선형근사 L = ${isFinite(L) ? L.toFixed(5) : "쓸 수 없음 (원점에서 미분 불가능)"}` +
        (isFinite(L) ? `,  오차 ${(ex - L).toExponential(2)}` : ""));
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 6. 벡터장 그리기, 발산과 회전 (07-01) */
  (() => {
    const S = QSim.card("lab-c2-vfield"); if (!S) return;
    const cv = S.$("canvas");
    const V = {
      rot: { n: "F = (−y, x)", F: (x, y) => [-y, x], div: () => 0, curl: () => 2, pot: null },
      src: { n: "F = (x, y)", F: (x, y) => [x, y], div: () => 2, curl: () => 0, pot: "φ = (x² + y²)/2" },
      sad: { n: "F = (y, x)", F: (x, y) => [y, x], div: () => 0, curl: () => 0, pot: "φ = xy" },
      shear: { n: "F = (y, 0)", F: (x, y) => [y, 0], div: () => 0, curl: () => -1, pot: null },
      vort: { n: "F = (−y, x)/(x² + y²)", F: (x, y) => { const r = x * x + y * y; return [-y / r, x / r]; }, div: (x, y) => (x * x + y * y > 1e-12 ? 0 : "정의 안 됨"), curl: (x, y) => (x * x + y * y > 1e-12 ? 0 : NaN), pot: null, potmsg: "원점을 뺀 영역 전체에서는 아니오. 원점을 감싸지 않는 작은 영역에서만 φ = θ(극좌표의 각)가 퍼텐셜이고, 원점을 한 바퀴 도는 선적분은 2π" }
    };
    function draw() {
      const c = C(), f = V[S.val("f")], px = S.val("px"), py = S.val("py");
      const v = QSim.view(cv, 0.8), F = QSim.frame(v, { x0: -2.2, x1: 2.2, y0: -2.2, y1: 2.2, equal: true, xl: "x", yl: "y" }); F.axes();
      for (let x = -2; x <= 2.001; x += 0.4) for (let y = -2; y <= 2.001; y += 0.4) {
        const [u, w] = f.F(x, y), m = Math.hypot(u, w); if (!isFinite(m) || m < 1e-9) continue;
        const s = (0.32 * Math.min(1, m)) / m; F.arrow(x, y, u * s, w * s, c.ink3);
      }
      const [u, w] = f.F(px, py);
      if (isFinite(u)) F.arrow(px, py, u * 0.4, w * 0.4, c.acc, "F");
      F.dot(px, py, c.ink, 5);
      const cu = f.curl(px, py);
      S.out(`${f.n}\n점 (${px.toFixed(1)}, ${py.toFixed(1)})에서 F = (${isFinite(u) ? u.toFixed(3) : "정의 안 됨"}, ${isFinite(w) ? w.toFixed(3) : "정의 안 됨"})\n` +
        `발산 ∂P/∂x + ∂Q/∂y = ${f.div(px, py)},  회전 ∂Q/∂x − ∂P/∂y = ${isFinite(cu) ? cu : "정의 안 됨 (원점)"}\n` +
        `기울기 벡터장인가: ${f.potmsg || (f.pot ? "예, " + f.pot : "아니오 (회전이 0이 아님)")}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
  /* 7. 스토크스 정리: 경계가 같으면 어떤 곡면이든 회전의 선속이 같다 (08-03) */
  (() => {
    const S = QSim.card("lab-c2-stokes"); if (!S) return;
    const cv = S.$("canvas");
    /* F = (−y + z², x, xy), curl F = (x, 2z − y, 2). 경계: 단위원 (z = 0, 반시계).
       곡면: z = h(1 − x² − y²) (h = 0이면 평평한 원판). 위쪽 법선 N = (2hx, 2hy, 1) dA */
    function draw() {
      const c = C(), h = S.val("h"), az = (S.val("view") * Math.PI) / 180;
      /* 비스듬히 본 그림: (x, y, z) → 화면 (x cos az − y sin az, (x sin az + y cos az)·0.35 + z) */
      const P = (x, y, z) => [x * Math.cos(az) - y * Math.sin(az), (x * Math.sin(az) + y * Math.cos(az)) * 0.35 + z];
      const v = QSim.view(cv, 0.6), F = QSim.frame(v, { x0: -1.8, x1: 1.8, y0: -1.0, y1: 1.9, equal: true, pad: 16 });
      for (let i = 1; i <= 5; i++) { const r = i / 5, pts = []; for (let k = 0; k <= 60; k++) { const t = (k / 60) * 2 * Math.PI; pts.push(P(r * Math.cos(t), r * Math.sin(t), h * (1 - r * r))); } F.path(pts, c.soft, 1); }
      for (let k = 0; k < 12; k++) { const t = (k / 12) * 2 * Math.PI, pts = []; for (let i = 0; i <= 20; i++) { const r = i / 20; pts.push(P(r * Math.cos(t), r * Math.sin(t), h * (1 - r * r))); } F.path(pts, c.soft, 1); }
      const ring = []; for (let k = 0; k <= 120; k++) { const t = (k / 120) * 2 * Math.PI; ring.push(P(Math.cos(t), Math.sin(t), 0)); }
      F.path(ring, c.main, 3);
      for (let k = 0; k < 4; k++) { const t = (k / 4) * 2 * Math.PI + 0.3, a = P(Math.cos(t), Math.sin(t), 0), b = P(Math.cos(t + 0.25), Math.sin(t + 0.25), 0); F.arrow(a[0], a[1], b[0] - a[0], b[1] - a[1], c.main); }
      /* 경계를 따른 선적분 */
      let circ = 0; const M = 2000;
      for (let k = 0; k < M; k++) { const t = ((k + 0.5) / M) * 2 * Math.PI, x = Math.cos(t), y = Math.sin(t), dx = -Math.sin(t), dy = Math.cos(t); circ += (-y * dx + x * dy) * ((2 * Math.PI) / M); }
      /* 곡면 위에서 curl F · N 을 항목별로 더한다 */
      let s1 = 0, s2 = 0, s3 = 0; const nr = 80, nt = 160;
      for (let i = 0; i < nr; i++) { const r = (i + 0.5) / nr; for (let j = 0; j < nt; j++) {
        const t = ((j + 0.5) / nt) * 2 * Math.PI, x = r * Math.cos(t), y = r * Math.sin(t), z = h * (1 - r * r), dA = r * (1 / nr) * ((2 * Math.PI) / nt);
        s1 += x * 2 * h * x * dA; s2 += (2 * z - y) * 2 * h * y * dA; s3 += 2 * dA; } }
      const flux = s1 + s2 + s3;
      S.out(`곡면 z = ${h.toFixed(2)}(1 − x² − y²) ${Math.abs(h) < 1e-9 ? "(평평한 원판)" : h > 0 ? "(위로 볼록)" : "(아래로 오목)"}\n` +
        `경계 원을 따라 잰 순환 ∮F·dr = ${circ.toFixed(4)}  (2π = ${(2 * Math.PI).toFixed(4)})\n` +
        `곡면을 지나는 회전의 선속 = x 성분 몫 ${s1.toFixed(4)} + y 성분 몫 ${s2.toFixed(4)} + z 성분 몫 ${s3.toFixed(4)} = ${flux.toFixed(4)}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
