/* 물리4 실습 카드 묶음: 위상 공간 부피, 연성 진동자, 중간축 정리 */
(() => {
  "use strict";
  const C = () => QSim.col();

  /* 1. 진자의 위상 공간과 리우빌 정리 (03-02) */
  (() => {
    const S = QSim.card("lab-p4-liouville"); if (!S) return;
    const cv = S.$("canvas"); let ring, t = 0;
    const flow = (b) => (_, s) => [s[1], -Math.sin(s[0]) - b * s[1]];
    const area = (r) => { let s = 0; for (let i = 0; i < r.length; i++) { const [x1, y1] = r[i], [x2, y2] = r[(i + 1) % r.length]; s += x1 * y2 - x2 * y1; } return Math.abs(s) / 2; };
    function reset() { const q0 = S.val("q0"), p0 = S.val("p0"), r = S.val("r"); ring = Array.from({ length: 400 }, (_, i) => [q0 + r * Math.cos(2 * Math.PI * i / 400), p0 + r * Math.sin(2 * Math.PI * i / 400)]); ring.a0 = area(ring); t = 0; draw(); }
    function step(dt) {
      const b = S.val("fric") ? 0.15 : 0, F = flow(b);
      for (let k = 0; k < 5; k++) { ring = ring.map((s) => QSim.rk4(F, 0, s, dt / 5)); }
      // 늘어난 고리에 점 보충
      const nr = []; for (let i = 0; i < ring.length; i++) { const a = ring[i], c2 = ring[(i + 1) % ring.length]; nr.push(a); if (Math.hypot(a[0] - c2[0], a[1] - c2[1]) > 0.05 && ring.length + nr.length < 6000) nr.push([(a[0] + c2[0]) / 2, (a[1] + c2[1]) / 2]); }
      nr.a0 = ring.a0; ring = nr; t += dt; draw(); return t < 40;
    }
    function draw() {
      const c = C(), v = QSim.view(cv, 0.6), f = QSim.frame(v, { x0: -Math.PI * 1.15, x1: Math.PI * 1.15, y0: -3, y1: 3, xl: "θ", yl: "p" }); f.axes({ noGrid: true });
      for (const E of [-0.8, -0.5, 0, 0.5, 1, 1.5, 2.5]) { f.fn((q) => { const v2 = 2 * (E + Math.cos(q)); return v2 >= 0 ? Math.sqrt(v2) : NaN; }, c.rule, 1); f.fn((q) => { const v2 = 2 * (E + Math.cos(q)); return v2 >= 0 ? -Math.sqrt(v2) : NaN; }, c.rule, 1); }
      f.fn((q) => 2 * Math.cos(q / 2), c.ink3, 1.2, [4, 3]); f.fn((q) => -2 * Math.cos(q / 2), c.ink3, 1.2, [4, 3]);
      const g = v.g; g.fillStyle = "rgba(90,100,230,0.35)"; g.beginPath(); ring.forEach(([q, p], i) => (i ? g.lineTo(f.X(q), f.Y(p)) : g.moveTo(f.X(q), f.Y(p)))); g.closePath(); g.fill(); f.path(ring.concat([ring[0]]), c.main, 1.2);
      const A = area(ring);
      S.out(`진자 H = p²/2 − cos θ의 위상 공간 (회색: 에너지 등고선, 점선: 분리선)\nt = ${t.toFixed(1)}, 처음 넓이 ${ring.a0.toFixed(4)}, 지금 넓이 ${A.toFixed(4)} (비 ${(A / ring.a0).toFixed(3)})${S.val("fric") ? "\n마찰이 있으면 해밀턴 계가 아니라 넓이가 줄어든다" : "\n모양은 늘어나 휘지만 넓이는 그대로다 (리우빌 정리)"}`);
    }
    const L = QSim.loop(step).watch(S.root);
    QSim.playButton(S.$(".play"), L, () => { if (t >= 40) reset(); });
    S.$(".reset").addEventListener("click", () => { L.stop(); S.$(".play").textContent = "재생"; reset(); });
    S.on(() => { L.stop(); S.$(".play").textContent = "재생"; reset(); }); QSim.redrawOn(draw); reset();
  })();

  /* 2. 연성 진동자: 정규 모드와 맥놀이 (04-01, 04-02) */
  (() => {
    const S = QSim.card("lab-p4-coupled"); if (!S) return;
    const [cvM, cvT] = S.$$("canvas");
    let s, t, hist;
    const f = (kp) => (_, y) => [y[2], y[3], -y[0] - kp * (y[0] - y[1]), -y[1] - kp * (y[1] - y[0])];
    function reset() { const st = S.val("init"); s = st === "one" ? [1, 0, 0, 0] : st === "m1" ? [1, 1, 0, 0] : [1, -1, 0, 0]; t = 0; hist = []; draw(); }
    function step(dt) { const kp = S.val("kp"); for (let i = 0; i < 10; i++) { s = QSim.rk4(f(kp), t, s, dt * 2 / 10); t += dt * 2 / 10; } hist.push([t, s[0], s[1], 0.5 * (s[2] ** 2 + s[0] ** 2), 0.5 * (s[3] ** 2 + s[1] ** 2)]); if (hist.length > 3000) hist.shift(); draw(); }
    function draw() {
      const c = C(), kp = S.val("kp"), w1 = 1, w2 = Math.sqrt(1 + 2 * kp);
      const vm = QSim.view(cvM, 0.2), fm = QSim.frame(vm, { x0: -0.5, x1: 6.5, y0: -1, y1: 1 }); const g = vm.g;
      const x1 = 2 + 0.6 * s[0], x2 = 4 + 0.6 * s[1];
      const spring = (a, b, col) => { const pts = []; for (let i = 0; i <= 24; i++) { const x = a + (b - a) * i / 24; pts.push([x, i % 2 ? 0.25 : -0.25]); } pts[0][1] = 0; pts[24][1] = 0; fm.path(pts, col, 1.5); };
      spring(0, x1 - 0.3, c.ink3); spring(x1 + 0.3, x2 - 0.3, c.acc); spring(x2 + 0.3, 6, c.ink3);
      g.fillStyle = c.main; [x1, x2].forEach((x) => g.fillRect(fm.X(x - 0.3), fm.Y(0.45), fm.sx * 0.6, fm.Y(-0.45) - fm.Y(0.45)));
      g.fillStyle = c.ink; g.fillRect(fm.X(-0.1), fm.Y(0.8), 3, fm.Y(-0.8) - fm.Y(0.8)); g.fillRect(fm.X(6), fm.Y(0.8), 3, fm.Y(-0.8) - fm.Y(0.8));
      const vt = QSim.view(cvT, 0.42), t0 = Math.max(0, t - 60), ft = QSim.frame(vt, { x0: t0, x1: t0 + 60, y0: -1.3, y1: 1.3, xl: "t (√(m/k) 단위)" }); ft.axes({ noGrid: true });
      if (hist.length > 1) { ft.path(hist.map((h) => [h[0], h[1]]), c.main, 1.5); ft.path(hist.map((h) => [h[0], h[2]]), c.warn, 1.5); }
      const Tb = Math.PI / (w2 - w1);
      S.out(`k = m = 1 단위, 가운데 용수철 k' = ${kp.toFixed(2)}\n정규 모드: ω₁ = ${w1.toFixed(3)} (같은 방향), ω₂ = √(1 + 2k') = ${w2.toFixed(3)} (반대 방향)\n${S.val("init") === "one" ? `1번만 당기면 두 모드가 반반 섞여, 에너지가 반 맥놀이 주기 π/(ω₂−ω₁) = ${Tb.toFixed(1)}마다 넘어간다` : "정규 모드 하나만 들뜨면 모양을 유지한 채 한 진동수로 진동한다"} (파랑: x₁, 빨강: x₂)`);
    }
    const L = QSim.loop((dt) => { step(dt); }).watch(S.root);
    QSim.playButton(S.$(".play"), L);
    S.$(".reset").addEventListener("click", () => { reset(); });
    S.on(() => { reset(); }); QSim.redrawOn(draw); reset();
  })();

  /* 3. 중간축 정리 (05-04) */
  (() => {
    const S = QSim.card("lab-p4-tennis"); if (!S) return;
    const cv = S.$("canvas"), I = [1, 2, 3];
    function draw() {
      const c = C(), ax = +S.val("axis"), eps = 10 ** S.val("le"), T = 100;
      let w = [eps, eps, eps]; w[ax - 1] = 1;
      const f = (_, q) => [(I[1] - I[2]) * q[1] * q[2] / I[0], (I[2] - I[0]) * q[2] * q[0] / I[1], (I[0] - I[1]) * q[0] * q[1] / I[2]];
      const pts = [[], [], []]; let t = 0, h = 0.01;
      for (let i = 0; i <= T / h; i++) { pts.forEach((p, k) => p.push([t, w[k]])); w = QSim.rk4(f, t, w, h); t += h; }
      const v = QSim.view(cv, 0.5), fr = QSim.frame(v, { x0: 0, x1: T, y0: -1.15, y1: 1.15, xl: "t (1/ω 단위)", yl: "ω_i" }); fr.axes();
      [c.main, c.warn, c.acc].forEach((col, k) => fr.path(pts[k], col, k === ax - 1 ? 2.5 : 1.5));
      const flips = (() => { let n = 0; const p = pts[ax - 1]; for (let i = 1; i < p.length; i++) if (p[i - 1][1] * p[i][1] < 0) n++; return n; })();
      S.out(`주관성 모멘트 λ = (1, 2, 3), 축 ${ax} 둘레로 ω = 1, 다른 성분에 작은 흔들림 ${eps.toExponential(0)}\n${ax === 2 ? `불안정: 흔들림이 지수적으로 커져 회전축이 뒤집힌다 (ω₂ 부호가 ${flips}번 바뀜)` : "안정: 흔들림이 작은 진동으로 머문다"}\n파랑 ω₁, 빨강 ω₂, 주황 ω₃ (굵은 선이 처음 회전축)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
