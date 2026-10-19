/* 천우3 실습 카드: 가상 스펙트럼의 시선속도 측정, 위성 궤도 자료로 행성 질량 구하기, 목성 공명과 소행성 이심률 수치 모의실험 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const fx = (x, n = 2) => (+x).toFixed(n);
  const rng = (s) => () => { s = (s * 1664525 + 1013904223) % 4294967296; return (s + 0.5) / 4294967296; };
  const gauss = (r) => Math.sqrt(-2 * Math.log(r())) * Math.cos(2 * Math.PI * r());

  /* 1. 가상 스펙트럼에서 시선속도 재기 (06-01) */
  (() => {
    const S = QSim.card("lab-a3-rv"); if (!S) return;
    const cv = S.$("canvas"), c0 = 299792.458;
    const LINES = [[486.13, 0.45, 0.35], [434.05, 0.40, 0.30], [410.17, 0.35, 0.28], [438.36, 0.20, 0.06], [430.79, 0.25, 0.08], [466.81, 0.15, 0.05], [452.86, 0.15, 0.05], [492.05, 0.18, 0.06]];   // [정지 파장 nm, 깊이, 폭 nm]: 수소 Balmer 3개와 금속선(가상 세기)
    const model = (l, v) => { let f = 1; const z = 1 + v / c0; for (const [l0, d, w] of LINES) { const u = (l - l0 * z) / w; if (u > -6 && u < 6) f -= d * Math.exp(-0.5 * u * u); } return f; };
    let seed = 7, vTrue = 0, data = [];
    const grid = []; for (let l = 405; l <= 495; l += 0.05) grid.push(l);
    let cc = [], vb = 0;
    const ccf = (v) => { let s = 0; for (let i = 0; i < grid.length; i++) s += (1 - data[i]) * (1 - model(grid[i], v)); return s; };
    function make() {
      const r = rng(seed); vTrue = Math.round((r() * 2 - 1) * 250 * 10) / 10; const sn = S.val("sn"); data = grid.map((l) => model(l, vTrue) + gauss(r) / sn);
      cc = []; let best = -1e9; for (let t = -300; t <= 300; t += 2) { const q = ccf(t); cc.push([t, q]); if (q > best) { best = q; vb = t; } }
      for (let t = vb - 2; t <= vb + 2; t += 0.1) { const q = ccf(t); if (q > best) { best = q; vb = t; } }
      cc = cc.map(([t, q]) => [t, q / best]);
    }
    function draw() {
      const c = C(), v = S.val("v"), zoom = S.val("zoom");
      const vw = QSim.view(cv, 0.6), g = vw.g, H = vw.H, top = H * 0.62;
      const l0 = zoom ? 482 : 405, l1 = zoom ? 490 : 495;
      const f = QSim.frame({ g, W: vw.W, H: top, cv }, { x0: l0, x1: l1, y0: 0.3, y1: 1.15, xl: "파장 (nm)", yl: "규격화 세기" }); f.axes();
      const obs = []; for (let i = 0; i < grid.length; i++) if (grid[i] >= l0 && grid[i] <= l1) obs.push([grid[i], data[i]]); f.path(obs, c.ink3, 1);
      f.fn((l) => model(l, v), c.main, 2, null, 900);
      if (zoom) { f.path([[486.13, 0.3], [486.13, 1.15]], c.acc, 1, [3, 3]); f.text("정지 Hβ", 486.2, 1.08, c.acc); }
      // 아래: 교차상관 함수
      g.save(); g.translate(0, top); const f2 = QSim.frame({ g, W: vw.W, H: H - top, cv }, { x0: -300, x1: 300, y0: 0, y1: 1.1, xl: "시험 속도 (km/s)", yl: "교차상관", pad: 22 }); f2.axes({ noGrid: true });
      f2.path(cc, c.main, 1.8); f2.path([[v, 0], [v, 1.1]], c.warn, 1.5); g.restore();
      const reveal = S.val("show");
      S.out(`시험 속도 ${fx(v, 0)} km/s의 모형(파란 선)을 가상 관측 자료(회색)에 겹쳤습니다. 신호 대 잡음비 ${S.val("sn")}\n교차상관이 가장 큰 속도: ${fx(vb, 1)} km/s → Hβ 관측 파장 ${fx(486.13 * (1 + vb / c0), 3)} nm${reveal ? `\n가상 자료를 만들 때 넣은 참 속도: ${fx(vTrue, 1)} km/s (차이 ${fx(vb - vTrue, 1)} km/s)` : "\n참 속도는 '정답 보기'를 켜면 나옵니다"}`);
    }
    S.$(".btns .new").addEventListener("click", () => { seed += 1; make(); draw(); });
    let snNow = S.val("sn");
    S.on(() => { if (snNow !== S.val("sn")) { snNow = S.val("sn"); make(); } draw(); });
    make(); QSim.redrawOn(draw); draw();
  })();

  /* 2. 위성 궤도 자료로 행성 질량 구하기 (06-02) */
  (() => {
    const S = QSim.card("lab-a3-moons"); if (!S) return;
    const cv = S.$("canvas"), G = 6.674e-11, day = 86400;
    const SETS = {   // [이름, 긴반지름 (10³ km), 주기 (일)]
      jup: { name: "목성", unit: 1.898e27, list: [["이오", 421.7, 1.769], ["유로파", 671.0, 3.551], ["가니메데", 1070.4, 7.155], ["칼리스토", 1882.7, 16.689]] },
      sat: { name: "토성", unit: 5.683e26, list: [["미마스", 185.5, 0.942], ["엔켈라두스", 238.0, 1.370], ["테티스", 294.7, 1.888], ["디오네", 377.4, 2.737], ["레아", 527.1, 4.518], ["타이탄", 1221.9, 15.945]] },
      ura: { name: "천왕성", unit: 8.681e25, list: [["미란다", 129.9, 1.413], ["아리엘", 190.9, 2.520], ["움브리엘", 266.0, 4.144], ["티타니아", 436.3, 8.706], ["오베론", 583.5, 13.463]] },
    };
    function draw() {
      const c = C(), key = S.val("set"), D = SETS[key], lm = S.val("lm"), Mtry = Math.pow(10, lm);
      const pts = D.list.map(([n, a, P]) => [n, Math.log10(a * 1e6), Math.log10(P * day)]);
      // log a³ = log(GM/4π²) + log P²  → 직선 맞춤 (기울기 1 고정)으로 GM
      const yv = pts.map(([, la, lp]) => 3 * la - 2 * lp), mean = yv.reduce((s, x) => s + x, 0) / yv.length;
      const Mfit = Math.pow(10, mean) * 4 * Math.PI * Math.PI / G;
      const sd = Math.sqrt(yv.reduce((s, x) => s + (x - mean) ** 2, 0) / Math.max(1, yv.length - 1));
      const xs = pts.map((p) => 2 * p[2]), ys = pts.map((p) => 3 * p[1]);
      const x0 = Math.min(...xs) - 0.4, x1 = Math.max(...xs) + 0.4;
      const v = QSim.view(cv, 0.6), f = QSim.frame(v, { x0, x1, y0: Math.min(...ys) - 0.5, y1: Math.max(...ys) + 0.5, xl: "log P² (s²)", yl: "log a³ (m³)" }); f.axes();
      const k = Math.log10(G * Mtry / (4 * Math.PI * Math.PI));
      f.path([[x0, x0 + k], [x1, x1 + k]], c.warn, 1.6, [6, 3]);
      pts.forEach(([n, la, lp]) => { f.dot(2 * lp, 3 * la, c.main, 5); f.text(n, 2 * lp + 0.05, 3 * la - 0.15, c.ink3); });
      const res = Math.sqrt(yv.reduce((s, x) => s + (x - Math.log10(G * Mtry / (4 * Math.PI * Math.PI))) ** 2, 0) / yv.length);
      S.out(`${D.name}의 위성 ${D.list.length}개 (실제 궤도 자료). 빨간 점선: 시험 질량 ${Mtry.toExponential(3)} kg으로 그린 P² ∝ a³ 직선, 점과의 평균 어긋남 ${fx(res, 3)} (log 단위)\n모든 점에서 GM = 4π²a³/P²를 구해 평균한 값: M = ${Mfit.toExponential(3)} kg (위성마다 구한 값의 흩어짐 약 ${fx((Math.pow(10, sd) - 1) * 100, 2)}%)\n참고 값(교과서): ${D.unit.toExponential(3)} kg, 지구 질량의 ${fx(Mfit / 5.972e24, 1)}배`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 목성 공명과 소행성의 이심률 (06-03) */
  (() => {
    const S = QSim.card("lab-a3-reson"); if (!S) return;
    const cv = S.$("canvas"), GM = 4 * Math.PI * Math.PI, aJ = 5.2026, PJ = Math.pow(aJ, 1.5);
    let st = null, hist = [], t = 0;
    function reset() {
      const a = S.val("a"), mJ = S.val("mj") * 9.546e-4;
      // 소행성: 근점에서 출발, 이심률 0.05. 목성: 원 궤도
      const e0 = 0.05, r = a * (1 - e0), vv = Math.sqrt(GM * (1 + e0) / (a * (1 - e0)));
      st = { x: r, y: 0, vx: 0, vy: vv, mJ, a0: a }; hist = []; t = 0;
    }
    function jup(tt) { const th = 2 * Math.PI * tt / PJ; return [aJ * Math.cos(th + 1.0), aJ * Math.sin(th + 1.0)]; }
    function acc(x, y, tt) {   // 태양 중심 좌표: 태양 + 목성 직접항 + 간접항
      const r3 = Math.pow(x * x + y * y, 1.5), [jx, jy] = jup(tt), dx = x - jx, dy = y - jy, d3 = Math.pow(dx * dx + dy * dy, 1.5), rj3 = aJ * aJ * aJ;
      const m = GM * st.mJ;
      return [-GM * x / r3 - m * dx / d3 - m * jx / rj3, -GM * y / r3 - m * dy / d3 - m * jy / rj3];
    }
    const elems = () => { const r = Math.hypot(st.x, st.y), v2 = st.vx * st.vx + st.vy * st.vy, eps = v2 / 2 - GM / r, a = -GM / (2 * eps), h = st.x * st.vy - st.y * st.vx, e = Math.sqrt(Math.max(0, 1 - h * h / (GM * a))); return [a, e]; };
    function step(n) { const dt = 0.004; for (let i = 0; i < n; i++) { let [ax, ay] = acc(st.x, st.y, t); st.vx += ax * dt / 2; st.vy += ay * dt / 2; st.x += st.vx * dt; st.y += st.vy * dt; t += dt; [ax, ay] = acc(st.x, st.y, t); st.vx += ax * dt / 2; st.vy += ay * dt / 2; } }
    function draw() {
      const c = C(), v = QSim.view(cv, 0.6), g = v.g, W = v.W, H = v.H, half = W * 0.42;
      const f1 = QSim.frame({ g, W: half, H, cv }, { x0: -6, x1: 6, y0: -6, y1: 6, equal: true, pad: 6 });
      const ring = (r, col) => { const p = []; for (let i = 0; i <= 120; i++) { const th = 2 * Math.PI * i / 120; p.push([r * Math.cos(th), r * Math.sin(th)]); } f1.path(p, col, 1, [3, 3]); };
      ring(aJ, c.acc); ring(2.5, c.ink3);
      f1.dot(0, 0, c.warn, 5); const [jx, jy] = jup(t); f1.dot(jx, jy, c.acc, 5); f1.dot(st.x, st.y, c.main, 3.5);
      g.save(); g.translate(half, 0);
      const tmax = Math.max(50, hist.length ? hist[hist.length - 1][0] : 50);
      const f2 = QSim.frame({ g, W: W - half, H, cv }, { x0: 0, x1: tmax, y0: 0, y1: Math.max(0.3, ...hist.map((q) => q[1] * 1.15)), xl: "시간 (목성 공전 횟수)", yl: "이심률" }); f2.axes();
      f2.path(hist, c.main, 1.5); g.restore();
      const [a, e] = elems(), em = hist.length ? Math.max(...hist.map((q) => q[1])) : e;
      S.out(`처음 긴반지름 ${fx(st.a0, 3)} AU → 목성과의 주기 비 ${fx(PJ / Math.pow(st.a0, 1.5), 3)} : 1 (3 : 1 공명은 2.502 AU)\n목성 질량 배수 ${S.val("mj")} (×1이 실제 값. 크게 하면 같은 효과가 더 빨리 나타남)\n지금 시각 목성 ${fx(t / PJ, 1)}바퀴, 긴반지름 ${fx(a, 3)} AU, 이심률 ${fx(e, 3)}, 지금까지 최대 이심률 ${fx(em, 3)}${em * a > 0 && a * (1 + em) > 4.0 ? " (원일점이 목성 궤도 쪽으로 크게 늘어남)" : ""}\n왼쪽: 태양(빨강), 목성(주황), 소행성(파랑), 회색 점선은 2.5 AU`);
    }
    const L = QSim.loop(() => { step(400); hist.push([t / PJ, elems()[1]]); draw(); if (t / PJ > 400) return false; }).watch(cv);
    const btn = S.$(".btns .play"); QSim.playButton(btn, L);
    S.$(".btns .reset").addEventListener("click", () => { L.stop(); reset(); draw(); btn.textContent = "재생"; });
    S.on(() => { L.stop(); btn.textContent = "재생"; reset(); draw(); });
    reset(); QSim.redrawOn(draw); draw();
    S.root.runTo = (orbits) => { L.stop(); reset(); while (t / PJ < orbits) { step(400); hist.push([t / PJ, elems()[1]]); } draw(); return S.$(".out").textContent; };   // 확인용
  })();
})();
