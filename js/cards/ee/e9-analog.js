/* 전전9 아날로그실험 카드 묶음 (모든 측정값은 가상)
   1 오실로스코프  2 측정기 부하  3 RC 필터 주파수 응답  4 계단 응답  5 RLC 공진  6 정류·평활
   7 다이오드 특성  8 공통 이미터 증폭기  9 연산증폭기의 한계  10 비교기·슈미트 트리거·발진기
   11 2차 능동 저역 통과 필터  12 고장 진단 */
(() => {
  "use strict";
  if (!window.QSim) return;
  const C = () => QSim.col();
  const VT = 0.025852;   // 열전압 (300 K)
  const rng = (s) => () => { s = (s * 1664525 + 1013904223) % 4294967296; return (s + 0.5) / 4294967296; };
  const gauss = (r) => Math.sqrt(-2 * Math.log(r())) * Math.cos(2 * Math.PI * r());
  const PRE = [[1e9, "G"], [1e6, "M"], [1e3, "k"], [1, ""], [1e-3, "m"], [1e-6, "μ"], [1e-9, "n"], [1e-12, "p"], [1e-15, "f"], [1e-18, "a"]];
  const eng = (x, u, d = 3) => {
    if (!isFinite(x)) return "∞ " + u;
    if (x === 0) return "0 " + u;
    const a = Math.abs(x); const p = PRE.find(([k]) => a >= k * 0.9995) || PRE[PRE.length - 1];
    return `${+(x / p[0]).toPrecision(d)} ${p[1]}${u}`;
  };
  const par = (a, b) => (a * b) / (a + b);
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  /* 오실로스코프 화면: 10×8 눈금. tr(x)는 화면 가로 칸(0~10) → 시간 */
  function scopeGrid(v) {
    const c = C(), g = v.g, W = v.W, H = v.H, px = W / 10, py = H / 8;
    g.save(); g.strokeStyle = c.rule; g.lineWidth = 1;
    for (let i = 0; i <= 10; i++) { g.globalAlpha = i === 5 ? 0.9 : 0.45; g.beginPath(); g.moveTo(i * px, 0); g.lineTo(i * px, H); g.stroke(); }
    for (let j = 0; j <= 8; j++) { g.globalAlpha = j === 4 ? 0.9 : 0.45; g.beginPath(); g.moveTo(0, j * py); g.lineTo(W, j * py); g.stroke(); }
    g.restore();
    return { X: (d) => d * px, Y: (d) => H / 2 - d * py, px, py };
  }
  function trace(v, sc, pts, color, w = 2) {
    const g = v.g; g.save(); g.strokeStyle = color; g.lineWidth = w; g.beginPath();
    pts.forEach(([x, y], i) => { const yy = sc.Y(clamp(y, -4.2, 4.2)); i ? g.lineTo(sc.X(x), yy) : g.moveTo(sc.X(x), yy); });
    g.stroke(); g.restore();
  }

  /* 1. 오실로스코프로 진폭, 주기, 위상차 재기 (01-01) */
  (() => {
    const S = QSim.card("lab-e9-scope"); if (!S) return;
    const cv = S.$("canvas"), R = 1e3, Cap = 100e-9, fc = 1 / (2 * Math.PI * R * Cap);
    function draw() {
      const c = C(), f = 10 ** S.val("lf"), A = S.val("vpp") / 2, tdiv = +S.val("tdiv"), d1 = +S.val("v1"), d2 = +S.val("v2");
      const x = f / fc, g = 1 / Math.sqrt(1 + x * x), ph = -Math.atan(x), r = rng(7);
      const v = QSim.view(cv, 0.62), sc = scopeGrid(v), n = 600, p1 = [], p2 = [], s1 = [], s2 = [];
      for (let i = 0; i <= n; i++) {
        const div = (10 * i) / n, t = (div - 5) * tdiv;   // 화면 가운데가 트리거 점(CH1 상승 0 V)
        const y1 = A * Math.sin(2 * Math.PI * f * t) + 0.004 * A * gauss(r) + 0.003 * gauss(r);
        const y2 = g * A * Math.sin(2 * Math.PI * f * t + ph) + 0.004 * A * gauss(r) + 0.003 * gauss(r);
        p1.push([div, y1 / d1]); p2.push([div, y2 / d2]); s1.push(y1); s2.push(y2);
      }
      trace(v, sc, p1, c.acc, 2); trace(v, sc, p2, c.main, 2);
      const c1 = S.val("c1"), c2 = S.val("c2"), gg = v.g;
      gg.save(); gg.setLineDash([4, 3]); gg.strokeStyle = c.warn; gg.lineWidth = 1.2;
      [c1, c2].forEach((k) => { gg.beginPath(); gg.moveTo(sc.X(k), 0); gg.lineTo(sc.X(k), v.H); gg.stroke(); });
      gg.restore();
      gg.save(); gg.fillStyle = c.ink2; gg.font = "11px " + (getComputedStyle(document.documentElement).getPropertyValue("--f-mono") || "monospace");
      gg.fillText(`CH1 ${d1} V/div  CH2 ${d2} V/div  ${eng(tdiv, "s")}/div`, 6, 14); gg.restore();
      // 한 주기 이상 보일 때만 진폭 자동 측정을 믿을 수 있다
      const seen = (10 * tdiv * f) >= 1, pp = (a) => Math.max(...a) - Math.min(...a);
      const dt = (c2 - c1) * tdiv;
      let s = `가상 장치: 함수 발생기 → CH1, RC 저역 통과(R = 1 kΩ, C = 100 nF) 출력 → CH2. 트리거: CH1 상승, 0 V, 화면 가운데\n`;
      s += `발생기 ${eng(f, "Hz", 4)}, ${S.val("vpp")} Vpp\n`;
      s += seen ? `자동 측정(가상): CH1 ${pp(s1).toFixed(3)} Vpp, CH2 ${pp(s2).toFixed(3)} Vpp, 비 ${(pp(s2) / pp(s1)).toFixed(3)}\n` : `화면에 한 주기가 다 들어오지 않아 자동 측정을 믿을 수 없음. 시간 눈금을 키우세요.\n`;
      s += `커서(빨간 점선) Δt = ${eng(dt, "s", 4)}  →  1/Δt = ${dt ? eng(1 / Math.abs(dt), "Hz", 4) : "-"},  360°·f·Δt = ${(360 * f * dt).toFixed(1)}°`;
      if (S.val("ans")) s += `\n이론: 이득 ${g.toFixed(3)}, 위상 ${(ph * 180 / Math.PI).toFixed(1)}° (CH2가 Δt = ${eng(-ph / (2 * Math.PI * f), "s", 3)} 늦음), 차단 주파수 ${eng(fc, "Hz", 4)}`;
      S.out(s);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 측정기의 입력 임피던스가 읽은 값을 바꾼다 (01-02) */
  (() => {
    const S = QSim.card("lab-e9-loading"); if (!S) return;
    const [cvE, cvB] = S.$$("canvas");
    const INST = { dmm: { name: "디지털 멀티미터", R: 10e6, C: 0 }, x1: { name: "오실로스코프 ×1 프로브", R: 1e6, C: 100e-12 }, x10: { name: "오실로스코프 ×10 프로브", R: 10e6, C: 12e-12 } };
    const read = (R, I) => 5 * I.R / (I.R + R / 2);
    const bw = (R, I) => 1 / (2 * Math.PI * par(R / 2, I.R) * I.C);
    function draw() {
      const c = C(), lr = S.val("lr"), R = 10 ** lr, I = INST[S.val("inst")];
      const v = QSim.view(cvE, 0.45), f = QSim.frame(v, { x0: 3, x1: 7, y0: -60, y1: 2, xl: "log₁₀ R (Ω)", yl: "읽은 값의 오차 (%)" }); f.axes();
      const col = { dmm: c.main, x1: c.warn, x10: c.acc };
      Object.entries(INST).forEach(([k, J]) => f.fn((x) => 100 * (read(10 ** x, J) - 5) / 5, col[k], k === S.val("inst") ? 2.5 : 1.2, k === "x10" ? [6, 4] : null));
      const e = 100 * (read(R, I) - 5) / 5; f.dot(lr, e, col[S.val("inst")], 5);
      const v2 = QSim.view(cvB, 0.4), f2 = QSim.frame(v2, { x0: 3, x1: 7, y0: 2, y1: 9, xl: "log₁₀ R (Ω)", yl: "log₁₀ 대역폭 (Hz)" }); f2.axes();
      f2.fn((x) => Math.log10(bw(10 ** x, INST.x1)), c.warn, 2); f2.fn((x) => Math.log10(bw(10 ** x, INST.x10)), c.acc, 2, [6, 4]);
      if (I.C) f2.dot(lr, Math.log10(bw(R, I)), col[S.val("inst")], 5);
      S.out(`10 V를 같은 저항 R = ${eng(R, "Ω")} 두 개로 나눈 가운데 마디(참값 5 V, 테브난 저항 R/2 = ${eng(R / 2, "Ω")})\n` +
        `${I.name}: 입력 저항 ${eng(I.R, "Ω")}${I.C ? `, 입력 용량 ${eng(I.C, "F")}` : ""} → 읽은 값 ${read(R, I).toFixed(3)} V (오차 ${e.toFixed(2)}%)\n` +
        (I.C ? `이 마디에서 측정할 수 있는 주파수 상한(−3 dB) ≈ 1/(2π(R/2 ∥ R_in)C_in) = ${eng(bw(R, I), "Hz")}` : `멀티미터는 직류만 잰다고 보고 대역폭은 그리지 않음`) +
        `\n위: 파랑 멀티미터, 빨강 ×1, 주황 점선 ×10 (멀티미터와 겹침). 아래: 빨강 ×1, 주황 점선 ×10의 대역폭`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. RC 필터의 주파수 응답을 재서 차단 주파수 찾기 (02-01) */
  (() => {
    const S = QSim.card("lab-e9-rcbode"); if (!S) return;
    const [cvM, cvP] = S.$$("canvas");
    let rec = [], seed = 3;
    const parts = () => { const r = rng(seed * 97 + 11); return { kr: 1 + 0.01 * (2 * r() - 1), kc: 1 + 0.05 * (2 * r() - 1) }; };   // 저항 ±1%, 축전기 ±5%
    const H = (f, fc, hp) => { const x = f / fc; return hp ? [x / Math.hypot(1, x), 90 - Math.atan(x) * 180 / Math.PI] : [1 / Math.hypot(1, x), -Math.atan(x) * 180 / Math.PI]; };
    function nom() { const R = 10 ** S.val("lr"), Cc = +S.val("cap") * 1e-9; return { R, Cc, fc: 1 / (2 * Math.PI * R * Cc), hp: S.val("type") === "hp" }; }
    function measure(f) {
      const p = nom(), k = parts(), fcA = p.fc / (k.kr * k.kc), r = rng(seed + Math.round(f * 13) % 100000);
      const [g, ph] = H(f, fcA, p.hp); return { f, g: g * (1 + 0.01 * gauss(r)), ph: ph + 0.8 * gauss(r) };
    }
    function estimate() {   // 이득이 1/√2를 지나는 두 점 사이를 log f로 보간
      const a = [...rec].sort((x, y) => x.f - y.f), t = 1 / Math.SQRT2;
      for (let i = 0; i + 1 < a.length; i++) {
        const p = a[i], q = a[i + 1];
        if ((p.g - t) * (q.g - t) <= 0 && p.g !== q.g) { const u = (t - p.g) / (q.g - p.g); return 10 ** (Math.log10(p.f) + u * (Math.log10(q.f) - Math.log10(p.f))); }
      }
      return NaN;
    }
    function draw() {
      const c = C(), p = nom(), fm = 10 ** S.val("lf");
      const v = QSim.view(cvM, 0.45), fr = QSim.frame(v, { x0: 1, x1: 6, y0: -40, y1: 5, xl: "log₁₀ f (Hz)", yl: "이득 (dB)" }); fr.axes();
      fr.fn((x) => 20 * Math.log10(H(10 ** x, p.fc, p.hp)[0]), c.ink3, 1.5, [5, 4]);
      fr.path([[1, -3.01], [6, -3.01]], c.rule, 1, [2, 3]);
      rec.forEach((m) => fr.dot(Math.log10(m.f), 20 * Math.log10(m.g), c.main, 4));
      fr.path([[Math.log10(fm), -40], [Math.log10(fm), 5]], c.warn, 1, [3, 3]);
      const v2 = QSim.view(cvP, 0.3), fp = QSim.frame(v2, { x0: 1, x1: 6, y0: -95, y1: 95, xl: "log₁₀ f (Hz)", yl: "위상 (°)" }); fp.axes({ noGrid: true });
      fp.fn((x) => H(10 ** x, p.fc, p.hp)[1], c.ink3, 1.5, [5, 4]);
      rec.forEach((m) => fp.dot(Math.log10(m.f), m.ph, c.acc, 3.5));
      const est = estimate(), k = parts();
      // 각 점에서 이득 식을 거꾸로 풀어 f_c를 구하고 기하 평균 (이득 0.25~0.8인 점만: 1에 가까우면 잡음에 매우 민감)
      const use = rec.filter((m) => m.g > 0.25 && m.g < 0.8), each = use.map((m) => (p.hp ? m.f * Math.sqrt(1 / (m.g * m.g) - 1) : m.f / Math.sqrt(1 / (m.g * m.g) - 1)));
      const gm = each.length ? Math.exp(each.reduce((s, x) => s + Math.log(x), 0) / each.length) : NaN;
      S.out(`${p.hp ? "고역" : "저역"} 통과, 공칭값 R = ${eng(p.R, "Ω")}, C = ${eng(p.Cc, "F")} → 공칭 f_c = ${eng(p.fc, "Hz")} (회색 점선이 공칭 곡선)\n` +
        `측정 주파수 ${eng(fm, "Hz")} (빨간 점선). 기록 ${rec.length}점 (파랑: 이득, 주황: 위상, 모두 가상 측정)\n` +
        (isFinite(est) ? `−3 dB 선을 사이에 둔 두 점을 직선 보간한 f_c ≈ ${eng(est, "Hz")} (공칭값과 ${(100 * (est / p.fc - 1)).toFixed(1)}% 차이)` : `−3 dB 선을 사이에 둔 두 점을 기록하면 f_c를 보간합니다.`) +
        (isFinite(gm) ? `\n이득 식을 거꾸로 푼 값 ${p.hp ? "f·√(1/g²−1)" : "f/√(1/g²−1)"}의 평균(${each.length}점) f_c ≈ ${eng(gm, "Hz")} (공칭값과 ${(100 * (gm / p.fc - 1)).toFixed(1)}% 차이)` : "") +
        (S.val("ans") ? `\n이 부품의 실제 값: R ${(100 * (k.kr - 1)).toFixed(2)}%, C ${(100 * (k.kc - 1)).toFixed(2)}% 벗어남 → 실제 f_c = ${eng(p.fc / (k.kr * k.kc), "Hz")}` : ""));
    }
    S.$(".rec").addEventListener("click", () => { rec.push(measure(10 ** S.val("lf"))); draw(); });
    S.$(".sweep").addEventListener("click", () => { const p = nom(); rec = []; for (let i = -20; i <= 20; i++) rec.push(measure(p.fc * 10 ** (i / 10))); draw(); });
    S.$(".clear").addEventListener("click", () => { rec = []; draw(); });
    S.$(".newpart").addEventListener("click", () => { seed = (seed * 31 + 7) % 9973; rec = []; draw(); });
    let key = ""; S.on(() => { const k = [S.val("lr"), S.val("cap"), S.val("type")].join(); if (k !== key) { key = k; rec = []; } draw(); }); key = [S.val("lr"), S.val("cap"), S.val("type")].join();
    QSim.redrawOn(draw); draw();
  })();

  /* 4. 구형파로 RC, RLC의 계단 응답 보기 (02-02) */
  (() => {
    const S = QSim.card("lab-e9-step"); if (!S) return;
    const cv = S.$("canvas");
    function sim() {
      const rlc = S.val("ckt") === "rlc", R = 10 ** S.val("lr"), L = S.val("L") * 1e-3, Cc = 10 ** S.val("lc") * 1e-9, fsq = 10 ** S.val("lf"), T = 1 / fsq;
      const tau = rlc ? Math.min(Math.sqrt(L * Cc), L / R, R * Cc) : R * Cc;
      const tEnd = 2 * T, N = Math.min(60000, Math.max(4000, Math.ceil(tEnd / (tau / 40))));
      const h = tEnd / N, vin = (t) => ((t % T) < T / 2 ? 1 : 0);
      let y = rlc ? [0, 0] : [0]; const pts = [], pin = [];
      const fn = rlc ? (t, s) => [s[1] / Cc, (vin(t) - R * s[1] - s[0]) / L] : (t, s) => [(vin(t) - s[0]) / (R * Cc)];   // RLC: s = [v_C, i]
      for (let i = 0; i <= N; i++) { const t = i * h; pts.push([t, y[0]]); pin.push([t, vin(t)]); y = QSim.rk4(fn, t, y, h); }
      return { rlc, R, L, Cc, T, pts, pin, tEnd };
    }
    function draw() {
      const c = C(), s = sim(), v = QSim.view(cv, 0.5), sc = s.tEnd >= 1e-3 ? 1e3 : 1e6, un = sc === 1e3 ? "ms" : "μs";
      const ymax = Math.max(1.2, ...s.pts.map((p) => p[1])) * 1.05, ymin = Math.min(-0.1, ...s.pts.map((p) => p[1])) * 1.05;
      const f = QSim.frame(v, { x0: 0, x1: s.tEnd * sc, y0: ymin, y1: ymax, xl: `t (${un})`, yl: "V" }); f.axes();
      f.path(s.pin.map(([t, y]) => [t * sc, y]), c.ink3, 1.2, [4, 3]); f.path(s.pts.map(([t, y]) => [t * sc, y]), c.main, 2.5);
      // 첫 상승 구간에서 가상 측정
      const half = s.pts.filter(([t]) => t < s.T / 2), vEnd = half[half.length - 1][1];
      const t63 = (half.find(([, y]) => y >= 0.632) || [NaN])[0], peak = Math.max(...half.map((p) => p[1]));
      let o = "";
      if (!s.rlc) {
        const tau = s.R * s.Cc;
        o = `RC 회로, τ = RC = ${eng(tau, "s")}. 반 주기 ${eng(s.T / 2, "s")} = ${(s.T / 2 / tau).toFixed(1)}τ\n` +
          `가상 측정: 63.2%에 닿는 시간 ${isFinite(t63) ? eng(t63, "s") : "반 주기 안에 닿지 않음"}, 반 주기 끝 전압 ${vEnd.toFixed(3)} V (이론 ${(1 - Math.exp(-s.T / 2 / tau)).toFixed(3)} V)`;
        f.path([[0, 0.632], [s.tEnd * sc, 0.632]], c.acc, 1, [2, 3]);
      } else {
        const a = s.R / (2 * s.L), w0 = 1 / Math.sqrt(s.L * s.Cc), z = a / w0;
        const kind = z < 0.98 ? "부족감쇠" : z > 1.02 ? "과감쇠" : "임계감쇠(근처)";
        o = `직렬 RLC, 출력은 축전기 전압. α = R/(2L) = ${eng(a, "s⁻¹")}, ω₀ = 1/√(LC) = ${eng(w0, "rad/s")}, ζ = α/ω₀ = ${z.toFixed(3)} → ${kind}\n`;
        if (z < 1) {
          const os = Math.exp(-Math.PI * z / Math.sqrt(1 - z * z)), wd = w0 * Math.sqrt(1 - z * z);
          o += `이론: 넘침 ${(100 * os).toFixed(1)}%, 감쇠 진동 주기 2π/ω_d = ${eng(2 * Math.PI / wd, "s")}\n가상 측정: 첫 봉우리 ${peak.toFixed(3)} V → 넘침 ${(100 * (peak - 1)).toFixed(1)}%`;
        } else o += `넘침 없이 다가갑니다. 가상 측정: 63.2% 도달 ${isFinite(t63) ? eng(t63, "s") : "반 주기 안에 닿지 않음"}`;
      }
      S.out(o + `\n회색 점선: 입력 구형파 0~1 V, 파랑: 출력`);
    }
    const sync = () => { const r = S.val("ckt") === "rlc"; S.$$(".only-rlc").forEach((e) => (e.style.display = r ? "" : "none")); };
    S.on(() => { sync(); draw(); }); sync(); QSim.redrawOn(draw); draw();
  })();

  /* 5. 직렬 RLC 공진 곡선에서 Q 재기 (02-03) */
  (() => {
    const S = QSim.card("lab-e9-res"); if (!S) return;
    const cv = S.$("canvas"); let rec = [], seed = 5;
    const P = () => { const R = S.val("R"), L = S.val("L") * 1e-3, Cc = S.val("C") * 1e-9; const f0 = 1 / (2 * Math.PI * Math.sqrt(L * Cc)); return { R, L, Cc, f0, Q: Math.sqrt(L / Cc) / R }; };
    const I = (f, p) => { const w = 2 * Math.PI * f; return 1 / Math.hypot(p.R, w * p.L - 1 / (w * p.Cc)); };
    function draw() {
      const c = C(), p = P(), Imax = 1 / p.R, l0 = Math.log10(p.f0);
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: l0 - 1, x1: l0 + 1, y0: 0, y1: Imax * 1e3 * 1.1, xl: "log₁₀ f (Hz)", yl: "전류 진폭 (mA)" }); f.axes();
      f.fn((x) => I(10 ** x, p) * 1e3, c.ink3, 1.5, [5, 4]);
      f.path([[l0 - 1, Imax * 1e3 / Math.SQRT2], [l0 + 1, Imax * 1e3 / Math.SQRT2]], c.rule, 1, [2, 3]);
      rec.forEach((m) => f.dot(Math.log10(m.f), m.i * 1e3, c.main, 3.5));
      let est = "";
      if (rec.length > 4) {   // 기록에서 봉우리와 반전력 폭 찾기
        const a = [...rec].sort((x, y) => x.f - y.f), k = a.reduce((b, m, i) => (m.i > a[b].i ? i : b), 0), t = a[k].i / Math.SQRT2;
        const cross = (i0, step) => { for (let i = i0; i + step >= 0 && i + step < a.length; i += step) { const p1 = a[i], q = a[i + step]; if (q.i <= t) { const u = (p1.i - t) / (p1.i - q.i); return 10 ** (Math.log10(p1.f) + u * (Math.log10(q.f) - Math.log10(p1.f))); } } return NaN; };
        const f1 = cross(k, -1), f2 = cross(k, 1);
        est = isFinite(f1) && isFinite(f2) ? `기록에서: 봉우리 ${eng(a[k].f, "Hz")}, 반전력 주파수 ${eng(f1, "Hz")} ~ ${eng(f2, "Hz")}, 대역폭 ${eng(f2 - f1, "Hz")} → Q ≈ ${(Math.sqrt(f1 * f2) / (f2 - f1)).toFixed(2)}` : "기록이 반전력 선(점선) 아래까지 양쪽으로 내려가야 대역폭을 잴 수 있습니다.";
      }
      S.out(`입력 1 V 진폭, R = ${p.R} Ω, L = ${S.val("L")} mH, C = ${S.val("C")} nF\n이론: f₀ = ${eng(p.f0, "Hz")}, Q = √(L/C)/R = ${p.Q.toFixed(2)}, 대역폭 f₀/Q = ${eng(p.f0 / p.Q, "Hz")}\n${est || "\"가상 스윕\"을 누르면 41점을 잽니다."}`);
    }
    S.$(".sweep").addEventListener("click", () => { const p = P(), r = rng(seed++); rec = []; for (let i = -20; i <= 20; i++) { const fq = p.f0 * 10 ** (i / 20); rec.push({ f: fq, i: I(fq, p) * (1 + 0.01 * gauss(r)) }); } draw(); });
    // 봉우리 근처만 촘촘히: f₀(1 ± 1.5/Q) 사이 41점
    S.$(".fine").addEventListener("click", () => { const p = P(), r = rng(seed++); rec = []; for (let i = -20; i <= 20; i++) { const fq = p.f0 * (1 + (1.5 / p.Q) * i / 20); if (fq > 0) rec.push({ f: fq, i: I(fq, p) * (1 + 0.01 * gauss(r)) }); } draw(); });
    S.$(".clear").addEventListener("click", () => { rec = []; draw(); });
    S.on(() => { rec = []; draw(); }); QSim.redrawOn(draw); draw();
  })();

  /* 6. 정류·평활: 리플과 다이오드 전류 (03-01) */
  (() => {
    const S = QSim.card("lab-e9-rect"); if (!S) return;
    const [cvV, cvI] = S.$$("canvas");
    function draw() {
      const c = C(), full = S.val("mode") === "full", Vp = S.val("vp"), Cc = +S.val("cap") * 1e-6, RL = S.val("rl"), Rs = S.val("rs"), f = 60, Vd = full ? 1.4 : 0.7;
      const cyc = 10, N = 60000, h = cyc / f / N; let vc = Vp - Vd;   // 정상 상태에 빨리 닿도록 봉우리 전압에서 출발
      const pv = [], ps = [], pi = []; let mn = 1e9, mx = -1e9, ipk = 0, on = 0, sum = 0, cnt = 0;
      for (let k = 0; k <= N; k++) {
        const t = k * h, s = Vp * Math.sin(2 * Math.PI * f * t), e = (full ? Math.abs(s) : s) - Vd;
        const i = e > vc ? (e - vc) / Rs : 0;          // 다이오드가 켜지면 전원 저항 Rs를 거쳐 충전
        vc += h * (i - vc / RL) / Cc;
        if (t >= (cyc - 2) / f) { pv.push([t, vc]); ps.push([t, Math.max(0, e)]); pi.push([t, i]); mn = Math.min(mn, vc); mx = Math.max(mx, vc); ipk = Math.max(ipk, i); if (i > 0) on++; sum += vc; cnt++; }
      }
      const t0 = (cyc - 2) / f, ms = (p) => p.map(([t, y]) => [(t - t0) * 1e3, y]);
      const v = QSim.view(cvV, 0.45), fr = QSim.frame(v, { x0: 0, x1: 2000 / f, y0: 0, y1: Vp * 1.05, xl: "t (ms)", yl: "V" }); fr.axes();
      fr.path(ms(ps), c.ink3, 1.2, [3, 3]); fr.path(ms(pv), c.main, 2.5);
      const v2 = QSim.view(cvI, 0.3), f2 = QSim.frame(v2, { x0: 0, x1: 2000 / f, y0: 0, y1: Math.max(ipk, 1e-3) * 1.1, xl: "t (ms)", yl: "다이오드 전류 (A)" }); f2.axes();
      f2.path(ms(pi), c.acc, 2);
      const avg = sum / cnt, IL = avg / RL, fr2 = full ? 120 : 60;
      S.out(`${full ? "브리지 전파" : "반파"} 정류, 진폭 ${Vp} V (60 Hz), 다이오드 강하 ${Vd} V, 전원 저항 ${Rs} Ω, C = ${eng(Cc, "F")}, 부하 ${RL} Ω\n` +
        `가상 측정: 출력 평균 ${avg.toFixed(2)} V, 리플 ${(mx - mn).toFixed(3)} Vpp, 부하 전류 ${(IL * 1e3).toFixed(1)} mA\n` +
        `어림식 리플 ≈ I/(f_r·C) = ${(IL / (fr2 * Cc)).toFixed(3)} V (f_r = ${fr2} Hz)\n` +
        `다이오드 전류 봉우리 ${ipk.toFixed(2)} A (부하 전류의 ${(ipk / IL).toFixed(1)}배), 한 주기 중 켜진 시간 ${(100 * on / cnt).toFixed(1)}%`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 7. 다이오드의 전류-전압 특성 재기 (03-02) */
  (() => {
    const S = QSim.card("lab-e9-diode"); if (!S) return;
    const [cvL, cvG] = S.$$("canvas");
    const PART = { d4148: { name: "1N4148 (실리콘 신호용)", Is: 4.35e-9, n: 1.91, Rs: 0.65 }, d4001: { name: "1N4001 (실리콘 정류용)", Is: 14.1e-9, n: 1.98, Rs: 0.034 },
      led: { name: "적색 LED", Is: 7.6e-18, n: 2.0, Rs: 2.0 }, sch: { name: "1N5817 (쇼트키)", Is: 31.7e-6, n: 1.37, Rs: 0.05 } };
    let rec = [], seed = 9;
    function solve(Vs, R, d) {   // Vs = I R + V_D(I), V_D = nV_T ln(I/Is + 1) + I Rs  → I를 이분법으로
      let lo = 0, hi = Vs / R;
      for (let k = 0; k < 100; k++) { const I = (lo + hi) / 2, g = Vs - I * R - (d.n * VT * Math.log(I / d.Is + 1) + I * d.Rs); if (g > 0) lo = I; else hi = I; }
      const I = (lo + hi) / 2; return { I, V: Vs - I * R };
    }
    function fit() {
      const pts = rec.filter((m) => m.I >= 1e-6 && m.I <= 2e-3); if (pts.length < 2) return null;
      const xs = pts.map((m) => m.V), ys = pts.map((m) => Math.log(m.I)), n = xs.length, mx = xs.reduce((a, b) => a + b) / n, my = ys.reduce((a, b) => a + b) / n;
      let sxy = 0, sxx = 0; xs.forEach((x, i) => { sxy += (x - mx) * (ys[i] - my); sxx += (x - mx) ** 2; });
      if (!sxx) return null; const b = sxy / sxx, a = my - b * mx; return { n: 1 / (b * VT), Is: Math.exp(a), k: pts.length };
    }
    function draw() {
      const c = C(), d = PART[S.val("part")], R = +S.val("R"), Vs = S.val("vs"), now = solve(Vs, R, d);
      const v = QSim.view(cvL, 0.45), f = QSim.frame(v, { x0: 0, x1: 2.2, y0: 0, y1: 20, xl: "V_D (V)", yl: "I (mA)" }); f.axes();
      const curve = []; for (let i = -12; i <= -1.3; i += 0.02) { const I = 10 ** i; curve.push([d.n * VT * Math.log(I / d.Is + 1) + I * d.Rs, I * 1e3]); }
      f.path(curve.filter(([x, y]) => x <= 2.2 && y <= 20), c.ink3, 1.2, [4, 3]);
      rec.forEach((m) => f.dot(m.V, m.I * 1e3, c.main, 3.5)); f.dot(now.V, now.I * 1e3, c.warn, 5);
      const v2 = QSim.view(cvG, 0.4), g = QSim.frame(v2, { x0: 0, x1: 2.2, y0: -9, y1: -1, xl: "V_D (V)", yl: "log₁₀ I (A)" }); g.axes();
      g.path(curve.filter(([x]) => x <= 2.2).map(([x, y]) => [x, Math.log10(y / 1e3)]), c.ink3, 1.2, [4, 3]);
      rec.forEach((m) => { if (m.I > 1e-9) g.dot(m.V, Math.log10(m.I), c.main, 3.5); });
      const F = fit();
      if (F) g.fn((x) => Math.log10(F.Is * Math.exp(x / (F.n * VT))), c.acc, 1.5);
      S.out(`${d.name}, 직렬 저항 ${eng(R, "Ω")}, 전원 ${Vs.toFixed(2)} V → 지금 V_D = ${now.V.toFixed(3)} V, I = ${eng(now.I, "A")} (빨간 점)\n` +
        `기록 ${rec.length}점 (가상: 전압계 ±1 mV, 전류 ±0.5%)\n` +
        (F ? `1 μA~2 mA 기록 ${F.k}점의 직선 맞춤: 이상 계수 n ≈ ${F.n.toFixed(2)}, 포화 전류 I_s ≈ ${eng(F.Is, "A")} (주황 직선)` : "1 μA~2 mA 사이 점을 둘 이상 기록하면 ln I-V 직선을 맞춥니다.") +
        (S.val("ans") ? `\n모형의 참값: n = ${d.n}, I_s = ${eng(d.Is, "A")}, 직렬 저항 ${d.Rs} Ω` : ""));
    }
    function take(Vs) { const d = PART[S.val("part")], R = +S.val("R"), m = solve(Vs, R, d), r = rng(seed = (seed * 17 + 3) % 99991); return { V: m.V + 0.001 * gauss(r), I: m.I * (1 + 0.005 * gauss(r)) }; }
    S.$(".rec").addEventListener("click", () => { rec.push(take(S.val("vs"))); draw(); });
    S.$(".sweep").addEventListener("click", () => { rec = []; for (let k = 1; k <= 25; k++) rec.push(take(0.2 * k)); draw(); });
    S.$(".clear").addEventListener("click", () => { rec = []; draw(); });
    let key = S.val("part") + S.val("R"); S.on(() => { const k = S.val("part") + S.val("R"); if (k !== key) { key = k; rec = []; } draw(); });
    QSim.redrawOn(draw); draw();
  })();

  /* 8. 공통 이미터 증폭기: 동작점, 이득, 잘림, 부품 오차 (04-01, 04-02) */
  function ceBias(p) {   // 전압 분배 바이어스. 활성/포화/차단 판정
    const VTH = p.VCC * p.R2 / (p.R1 + p.R2), RTH = par(p.R1, p.R2), RE = p.RE1 + p.RE2, VBE = 0.65;
    let IB = (VTH - VBE) / (RTH + (p.b + 1) * RE);
    if (IB <= 0) return { mode: "차단", IB: 0, IC: 0, IE: 0, VB: VTH, VE: 0, VC: p.VCC, VTH, RTH };
    let IC = p.b * IB, IE = IC + IB, VE = IE * RE, VC = p.VCC - IC * p.RC;
    if (VC - VE >= 0.2) return { mode: "활성", IB, IC, IE, VB: VE + VBE, VE, VC, VTH, RTH };
    // 포화: V_CE = 0.2 V 로 놓고 I_E 를 푼다
    IE = (VTH - VBE + RTH * (p.VCC - 0.2) / p.RC) / (RE + RTH + RTH * RE / p.RC);
    VE = IE * RE; VC = VE + 0.2; IC = (p.VCC - VC) / p.RC; IB = IE - IC;
    return { mode: "포화", IB, IC, IE, VB: VE + VBE, VE, VC, VTH, RTH };
  }
  (() => {
    const S = QSim.card("lab-e9-ce"); if (!S) return;
    const [cvW, cvL] = S.$$("canvas"); let seed = 1;
    const design = () => ({ VCC: 12, R1: S.val("r1") * 1e3, R2: S.val("r2") * 1e3, RC: S.val("rc") * 1e3, RE1: S.val("re1"), RE2: S.val("re2"), b: S.val("beta"), RL: 10e3 });
    function actual(p) {
      if (!S.val("real")) return p;
      const r = rng((seed * 2654435761) % 4294967296); r(); r(); const t = () => 1 + 0.05 * (2 * r() - 1);
      return { ...p, R1: p.R1 * t(), R2: p.R2 * t(), RC: p.RC * t(), RE1: p.RE1 * t(), RE2: p.RE2 * t(), b: 100 + 250 * r() };
    }
    function small(p, q) { const re = VT / q.IE, rpi = (p.b + 1) * re, RLp = par(p.RC, p.RL); return { re, rpi, Av: -p.b * RLp / (rpi + (p.b + 1) * p.RE1), Rin: par(par(p.R1, p.R2), rpi + (p.b + 1) * p.RE1), RLp }; }
    function wave(p, q, vin) {   // 큰 신호: v_in = V_T ln(i_E/I_E) + (i_E − I_E)·R_E1 를 풀고, 교류 부하선으로 출력
      const RLp = par(p.RC, p.RL), a = p.b / (p.b + 1), out = [];
      for (let k = 0; k <= 400; k++) {
        const th = 2 * Math.PI * 2 * k / 400, vb = vin * Math.sin(th);
        let lo = 1e-12, hi = q.IE * 1e3 + 1;
        for (let j = 0; j < 80; j++) { const ie = Math.sqrt(lo * hi), g = VT * Math.log(ie / q.IE) + (ie - q.IE) * p.RE1 - vb; if (g > 0) hi = ie; else lo = ie; }
        const ie = Math.sqrt(lo * hi), ic = a * ie;
        let vc = q.VC - (ic - q.IC) * RLp; const floor = q.VE + (ie - q.IE) * p.RE1 + 0.2;
        if (vc < floor) vc = floor;
        out.push([k / 200, vc - q.VC]);
      }
      return out;
    }
    function draw() {
      const c = C(), d = design(), p = actual(d), qd = ceBias(d), q = ceBias(p), vin = S.val("vin") * 1e-3;
      const sd = small(d, qd), s = q.mode === "활성" ? small(p, q) : null;
      const w = q.mode === "활성" ? wave(p, q, vin) : Array.from({ length: 401 }, (_, k) => [k / 200, 0]);
      const top = Math.max(...w.map((x) => x[1])), bot = Math.min(...w.map((x) => x[1])), lim = Math.max(1, Math.abs(sd.Av) * vin * 1.3, top, -bot);
      const v = QSim.view(cvW, 0.45), f = QSim.frame(v, { x0: 0, x1: 2, y0: -lim, y1: lim, xl: "주기", yl: "출력 교류 성분 (V)" }); f.axes();
      f.fn((x) => sd.Av * vin * Math.sin(2 * Math.PI * x), c.ink3, 1.2, [4, 3]); f.path(w, c.main, 2.5);
      // 직류 부하선과 동작점
      const v2 = QSim.view(cvL, 0.38), RE = p.RE1 + p.RE2, Imax = p.VCC / (p.RC + RE) * 1e3, g = QSim.frame(v2, { x0: 0, x1: 12.5, y0: 0, y1: Imax * 1.15, xl: "V_CE (V)", yl: "I_C (mA)" }); g.axes();
      g.path([[0, Imax], [p.VCC, 0]], c.ink3, 1.5); g.dot(q.VC - q.VE, q.IC * 1e3, q.mode === "활성" ? c.main : c.warn, 6);
      let o = `설계값: I_C = ${eng(qd.IC, "A")}, V_CE = ${(qd.VC - qd.VE).toFixed(2)} V, 이득 A_v = ${sd.Av.toFixed(1)} (회색 점선), 입력 저항 ${eng(sd.Rin, "Ω")}\n`;
      if (S.val("real")) o += `실제 부품(가상, 저항 ±5%, β = ${p.b.toFixed(0)}): I_C = ${eng(q.IC, "A")}, V_CE = ${(q.VC - q.VE).toFixed(2)} V, ${q.mode}${s ? `, 소신호 이득 ${s.Av.toFixed(1)}` : ""}\n`;
      o += q.mode !== "활성" ? `트랜지스터가 ${q.mode} 상태라 증폭하지 않습니다.` :
        `가상 측정: 출력 봉우리 +${top.toFixed(2)} V / ${bot.toFixed(2)} V → 측정 이득 ${(-(top - bot) / (2 * vin)).toFixed(1)}${(top + bot) / (top - bot) > 0.05 || (top + bot) / (top - bot) < -0.05 ? " (위아래가 다름: 일그러짐)" : ""}`;
      S.out(o + `\n부하 R_L = 10 kΩ, V_CC = 12 V. 아래: 직류 부하선과 동작점`);
    }
    S.$(".newpart").addEventListener("click", () => { seed++; draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 9. 연산증폭기의 이득-대역폭 곱, 슬루율, 포화 (05-02) */
  (() => {
    const S = QSim.card("lab-e9-opamp"); if (!S) return;
    const cv = S.$("canvas");
    const OA = { u741: { name: "741", gbw: 1e6, sr: 0.5e6 }, tl072: { name: "TL072", gbw: 3e6, sr: 13e6 }, lm358: { name: "LM358", gbw: 1e6, sr: 0.3e6 } };
    function draw() {
      const c = C(), a = OA[S.val("part")], inv = S.val("cfg") === "inv", k = S.val("k"), Vp = 10 ** S.val("lv"), f = 10 ** S.val("lf"), Vsat = 10.5;
      const beta = inv ? 1 / (1 + k) : 1 / k, G = inv ? -k : k;   // 비반전: 이득 k = 1 + R2/R1. 반전: 이득 −k = −R2/R1
      const wu = 2 * Math.PI * a.gbw, tau = 1 / (wu * beta), T = 1 / f, per = 4, N = 4000, h = per * T / N;
      let vo = 0; const pts = [], ide = [];
      for (let i = 0; i <= N; i++) {
        const t = i * h, target = G * Vp * Math.sin(2 * Math.PI * f * t);
        let nv = target + (vo - target) * Math.exp(-h / tau);       // 한 극점 모형: 목표값으로 τ 시간상수로 다가감
        nv = vo + clamp(nv - vo, -a.sr * h, a.sr * h);              // 슬루율 제한
        vo = clamp(nv, -Vsat, Vsat);                                // 출력 포화
        if (t >= 2 * T) { pts.push([(t - 2 * T) / T, vo]); ide.push([(t - 2 * T) / T, target]); }
      }
      const lim = Math.min(12, Math.max(Math.abs(G * Vp), ...pts.map((p) => Math.abs(p[1])), 0.01) * 1.15);
      const v = QSim.view(cv, 0.5), fr = QSim.frame(v, { x0: 0, x1: 2, y0: -lim, y1: lim, xl: "주기", yl: "출력 (V)" }); fr.axes();
      fr.path(ide.map(([x, y]) => [x, clamp(y, -lim, lim)]), c.ink3, 1.2, [4, 3]); fr.path(pts, c.main, 2.5);
      const amp = (Math.max(...pts.map((p) => p[1])) - Math.min(...pts.map((p) => p[1]))) / 2, fcl = a.gbw * beta, need = 2 * Math.PI * f * Math.abs(G) * Vp;
      const lim1 = need > a.sr ? "슬루율" : Math.abs(G) * Vp > Vsat ? "출력 포화" : f > fcl / 3 ? "대역폭" : "없음";
      S.out(`${a.name}: 이득-대역폭 곱 ${eng(a.gbw, "Hz")}, 슬루율 ${(a.sr / 1e6).toFixed(1)} V/μs, 출력 한계 ±${Vsat} V (전원 ±12 V)\n` +
        `${inv ? "반전" : "비반전"} 증폭기, 이상 이득 ${G.toFixed(0)} → 닫힌 루프 대역폭 ≈ GBW·β = ${eng(fcl, "Hz")} (β = ${beta.toFixed(3)})\n` +
        `입력 ${eng(Vp, "V")} 진폭, ${eng(f, "Hz")}: 가상 측정 출력 진폭 ${amp.toFixed(3)} V (이상 ${Math.abs(G * Vp).toFixed(3)} V, 비 ${(amp / Math.abs(G * Vp)).toFixed(3)})\n` +
        `이 출력에 필요한 최대 기울기 2πf·V_out = ${(need / 1e6).toFixed(3)} V/μs. 지금 주된 한계: ${lim1}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 10. 비교기와 슈미트 트리거, 구형파 발진기 (05-03) */
  (() => {
    const S = QSim.card("lab-e9-schmitt"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), osc = S.val("mode") === "osc", Vs = 10, b = S.val("b"), v = QSim.view(cv, 0.55);
      if (!osc) {
        const nA = S.val("noise"), r = rng(4), N = 2000, th = b * Vs;
        let y1 = -Vs, y2 = -Vs, n1 = 0, n2 = 0; const pin = [], p1 = [], p2 = [];
        for (let i = 0; i <= N; i++) {
          const x = 2 * i / N, s = Math.sin(2 * Math.PI * x) + nA * gauss(r);
          const a1 = s > 0 ? Vs : -Vs; if (a1 !== y1 && i) n1++; y1 = a1;
          const a2 = y2 > 0 ? (s < -th ? -Vs : Vs) : (s > th ? Vs : -Vs); if (a2 !== y2 && i) n2++; y2 = a2;   // 문턱 ±βV_sat
          pin.push([x, s]); p1.push([x, y1 / Vs * 1.4 + 3.6]); p2.push([x, y2 / Vs * 1.4 - 3.6]);
        }
        const f = QSim.frame(v, { x0: 0, x1: 2, y0: -5.3, y1: 5.3, xl: "주기", yl: "" }); f.axes({ noGrid: true });
        f.path(pin, c.ink3, 1.2); f.path([[0, th], [2, th]], c.acc, 1, [3, 3]); f.path([[0, -th], [2, -th]], c.acc, 1, [3, 3]);
        f.path(p1, c.warn, 1.8); f.path(p2, c.main, 2.2);
        f.text("비교기 출력", 0.02, 4.9, c.warn); f.text("슈미트 트리거 출력", 0.02, -1.9, c.main);
        S.out(`입력: 1 V 진폭 사인파 + 잡음(표준편차 ${nA.toFixed(2)} V), 회색\n비교기(문턱 0 V): 두 주기에 출력이 ${n1}번 바뀜 (빨강)\n` +
          `슈미트 트리거: 문턱 ±β·V_sat = ±${th.toFixed(2)} V (주황 점선), 출력이 ${n2}번 바뀜 (파랑). 깨끗하면 두 주기에 4번\n` +
          (2 * th < 6 * nA - 1e-9 ? `히스테리시스 폭 ${(2 * th).toFixed(2)} V가 잡음의 봉우리-봉우리(약 6σ = ${(6 * nA).toFixed(2)} V)보다 좁아 아직 떨림이 남을 수 있음` : `히스테리시스 폭 ${(2 * th).toFixed(2)} V가 잡음의 봉우리-봉우리(약 6σ = ${(6 * nA).toFixed(2)} V)보다 넓음`));
      } else {
        const R = S.val("R") * 1e3, Cc = S.val("C") * 1e-9, tau = R * Cc, T0 = 2 * tau * Math.log((1 + b) / (1 - b));
        const tEnd = 4 * T0, N = 6000, h = tEnd / N; let vc = 0, vo = Vs, last = null, per = []; const pc = [], po = [];
        for (let i = 0; i <= N; i++) {
          const t = i * h; vc += h * (vo - vc) / tau;
          if (vo > 0 && vc >= b * Vs) { vo = -Vs; } else if (vo < 0 && vc <= -b * Vs) { vo = Vs; if (last !== null) per.push(t - last); last = t; }
          pc.push([t * 1e3, vc]); po.push([t * 1e3, vo]);
        }
        const f = QSim.frame(v, { x0: 0, x1: tEnd * 1e3, y0: -11, y1: 11, xl: "t (ms)", yl: "V" }); f.axes();
        f.path(po, c.ink3, 1.5); f.path(pc, c.main, 2.5);
        const Tm = per.length ? per[per.length - 1] : NaN;
        S.out(`이완 발진기: R = ${eng(R, "Ω")}, C = ${eng(Cc, "F")}, β = R₁/(R₁+R₂) = ${b.toFixed(2)}, 출력 ±${Vs} V\n` +
          `이론 주기 T = 2RC·ln((1+β)/(1−β)) = ${eng(T0, "s")}, 주파수 ${eng(1 / T0, "Hz")}\n가상 측정(시뮬레이션) 주기 ${isFinite(Tm) ? eng(Tm, "s") : "-"}. 파랑: 축전기 전압, 회색: 출력. 첫 주기는 0 V에서 출발해 더 깁니다.`);
      }
    }
    const sync = () => { const o = S.val("mode") === "osc"; S.$$(".only-osc").forEach((e) => (e.style.display = o ? "" : "none")); S.$$(".only-cmp").forEach((e) => (e.style.display = o ? "none" : "")); };
    S.on(() => { sync(); draw(); }); sync(); QSim.redrawOn(draw); draw();
  })();

  /* 11. 살렌-키 2차 저역 통과 필터 (05-01) */
  (() => {
    const S = QSim.card("lab-e9-sallen"); if (!S) return;
    const [cvM, cvS] = S.$$("canvas");
    function draw() {
      const c = C(), R = S.val("R") * 1e3, C1 = S.val("c1") * 1e-9, C2 = S.val("c2") * 1e-9;
      const w0 = 1 / (R * Math.sqrt(C1 * C2)), Q = 0.5 * Math.sqrt(C1 / C2), f0 = w0 / (2 * Math.PI);   // 같은 R, 이득 1. C1은 출력으로 되먹이는 축전기
      const H = (f) => { const x = f / f0; return 1 / Math.sqrt((1 - x * x) ** 2 + (x / Q) ** 2); };
      const l0 = Math.log10(f0), v = QSim.view(cvM, 0.45), fr = QSim.frame(v, { x0: l0 - 1.5, x1: l0 + 1.5, y0: -50, y1: 15, xl: "log₁₀ f (Hz)", yl: "이득 (dB)" }); fr.axes();
      fr.fn((x) => 20 * Math.log10(1 / Math.sqrt(1 + (10 ** x / f0) ** 4)), c.ink3, 1.2, [4, 3]);   // 같은 f₀의 버터워스
      fr.fn((x) => 20 * Math.log10(1 / Math.hypot(1, 10 ** x / f0)), c.rule, 1.2, [2, 3]);           // 1차 RC
      fr.fn((x) => 20 * Math.log10(H(10 ** x)), c.main, 2.5);
      let f3 = NaN; for (let i = 0; i < 3000; i++) { const f = f0 * 10 ** (-1.5 + 3 * i / 3000); if (H(f) < 1 / Math.SQRT2) { f3 = f; break; } }
      const pk = Q > 1 / Math.SQRT2 ? Q / Math.sqrt(1 - 1 / (4 * Q * Q)) : 1;
      // 계단 응답
      const z = 1 / (2 * Q), tEnd = 12 / w0, N = 1500, h = tEnd / N; let y = [0, 0]; const st = [];
      for (let i = 0; i <= N; i++) { st.push([i * h * w0 / (2 * Math.PI), y[0]]); y = QSim.rk4((t, s) => [s[1], w0 * w0 * (1 - s[0]) - 2 * z * w0 * s[1]], 0, y, h); }
      const v2 = QSim.view(cvS, 0.32), g = QSim.frame(v2, { x0: 0, x1: tEnd * w0 / (2 * Math.PI), y0: 0, y1: Math.max(1.2, ...st.map((p) => p[1])) * 1.05, xl: "t·f₀", yl: "계단 응답" }); g.axes();
      g.path(st, c.acc, 2);
      S.out(`R₁ = R₂ = ${eng(R, "Ω")}, C₁ = ${eng(C1, "F")} (되먹임), C₂ = ${eng(C2, "F")}, 이득 1\n` +
        `f₀ = 1/(2πR√(C₁C₂)) = ${eng(f0, "Hz")}, Q = ½√(C₁/C₂) = ${Q.toFixed(3)}${Math.abs(Q - 0.7071) < 0.02 ? " (버터워스)" : ""}\n` +
        `−3 dB 주파수 ${eng(f3, "Hz")}, 최대 이득 ${(20 * Math.log10(pk)).toFixed(2)} dB, 계단 응답 넘침 ${(100 * (Math.max(...st.map((p) => p[1])) - 1)).toFixed(1)}%\n파랑: 이 필터, 회색 점선: 버터워스, 연한 점선: 1차 RC`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 12. 고장 진단: 공통 이미터 증폭기에서 숨은 고장 찾기 (06-01) */
  (() => {
    const S = QSim.card("lab-e9-debug"); if (!S) return;
    const cv = S.$("canvas");
    const base = { VCC: 12, R1: 47e3, R2: 10e3, RC: 4.7e3, RE1: 0, RE2: 1e3, b: 150, RL: 10e3 };
    const FAULT = {
      ok: "고장 없음", r1: "R1(위쪽 바이어스 저항) 끊어짐", r2: "R2(아래쪽 바이어스 저항) 끊어짐", rc: "R_C 끊어짐", re: "R_E 끊어짐",
      be: "트랜지스터 베이스-이미터 끊어짐", ce: "트랜지스터 컬렉터-이미터 단락", cbyp: "이미터 바이패스 축전기 끊어짐(빠짐)", cin: "입력 결합 축전기 끊어짐"
    };
    const keys = Object.keys(FAULT); let fault = "ok", seed = 12, log = [], verdict = "";
    function node() {   // 각 고장에서 측정기로 읽을 직류 전압과 출력 진폭(입력 10 mV)
      const p = { ...base }; let VB, VE, VC, out;
      const gainOk = (q, byp) => { const re = VT / q.IE, RLp = par(p.RC, p.RL); return p.b * RLp / ((p.b + 1) * (re + (byp ? 0 : p.RE2))); };
      if (fault === "r1" || fault === "r2" || fault === "ok" || fault === "cbyp" || fault === "cin") {
        if (fault === "r1") p.R1 = 1e15; if (fault === "r2") p.R2 = 1e15;
        const q = ceBias(p); VB = q.VB; VE = q.VE; VC = q.VC;
        if (q.mode === "차단") { VB = q.VTH; VE = 0; }
        out = q.mode !== "활성" ? 0 : fault === "cin" ? 0 : 0.01 * gainOk(q, fault !== "cbyp");
        if (q.mode === "포화") out = 0.001;
      } else if (fault === "rc") {   // 컬렉터 전류가 흐를 길이 없음: 베이스 전류가 모두 이미터로
        const VTH = 12 * 10 / 57, RTH = par(47e3, 10e3), IE = (VTH - 0.65) / (RTH + 1e3); VE = IE * 1e3; VB = VE + 0.65; VC = VB - 0.55; out = 0;   // 측정기 쪽으로 B-C 다이오드가 켜짐
      } else if (fault === "re") { VB = 12 * 10 / 57; VE = VB - 0.55; VC = 12; out = 0; }
      else if (fault === "be") { VB = 12 * 10 / 57; VE = 0; VC = 12; out = 0; }
      else if (fault === "ce") { VE = 12 * 1e3 / (4.7e3 + 1e3); VC = VE; const VTH = 12 * 10 / 57; VB = VTH > VE + 0.65 ? VE + 0.65 : VTH; out = 0; }
      return { VB, VE, VC, out };
    }
    function draw() {
      const c = C(), v = QSim.view(cv, 0.5), g = v.g, W = v.W, H = v.H, s = Math.min(W / 12, H / 8);
      const X = (x) => W / 2 + (x - 6) * s, Y = (y) => H / 2 + (y - 4) * s;
      g.save(); g.strokeStyle = c.ink2; g.fillStyle = c.ink2; g.lineWidth = 1.6; g.font = "12px " + (getComputedStyle(document.documentElement).getPropertyValue("--f-mono") || "monospace");
      const line = (pts) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)))); g.stroke(); };
      const res = (x, y0, y1, lab) => { line([[x, y0], [x, y0 + 0.3]]); g.strokeRect(X(x - 0.22), Y(y0 + 0.3), 0.44 * s, (y1 - y0 - 0.6) * s); line([[x, y1 - 0.3], [x, y1]]); g.fillText(lab, X(x + 0.35), Y((y0 + y1) / 2) + 4); };
      line([[2, 0.6], [9, 0.6]]); g.fillText("V_CC = 12 V", X(9.2), Y(0.6) + 4);
      res(3, 0.6, 3.6, "R1 47k"); res(3, 4.4, 7.4, "R2 10k"); line([[2, 7.4], [9, 7.4]]); g.fillText("접지", X(9.2), Y(7.4) + 4);
      line([[3, 3.6], [3, 4.4]]); line([[3, 4], [5.4, 4]]); res(7, 0.6, 3.0, "R_C 4.7k"); res(7, 5.0, 7.4, "R_E 1k");
      line([[5.4, 3.4], [5.4, 4.6]]); line([[5.4, 3.7], [7, 3.0]]); line([[5.4, 4.3], [7, 5.0]]);   // 트랜지스터
      g.beginPath(); g.arc(X(6), Y(4), 0.95 * s, 0, 7); g.stroke();
      line([[7, 5.8], [8.4, 5.8]]); line([[8.4, 5.8], [8.4, 6.25]]); line([[8.1, 6.25], [8.7, 6.25]]); line([[8.1, 6.45], [8.7, 6.45]]); line([[8.4, 6.45], [8.4, 7.4]]); g.fillText("C_E", X(8.8), Y(6.4) + 4);
      line([[1, 4], [1.6, 4]]); line([[1.6, 3.7], [1.6, 4.3]]); line([[1.8, 3.7], [1.8, 4.3]]); line([[1.8, 4], [3, 4]]); g.fillText("입력", X(0.2), Y(3.6)); g.fillText("C_in", X(1.3), Y(3.4));
      line([[7, 3.0], [9.6, 3.0]]); g.fillText("출력", X(9.8), Y(3.0) + 4);
      g.fillStyle = c.warn; [["B", 3.3, 3.75], ["C", 7.25, 3.35], ["E", 7.25, 4.8]].forEach(([t, x, y]) => g.fillText(t, X(x), Y(y)));
      g.restore();
      S.out(`측정 기록 (가상, 멀티미터 10 MΩ, 출력은 입력 10 mV 사인파일 때 진폭)\n${log.length ? log.join("\n") : "아직 잰 것이 없음"}${verdict ? "\n" + verdict : ""}`);
    }
    const meas = (k) => { const n = node(), r = rng(seed + log.length * 31), e = (x) => x + 0.005 * gauss(r);
      log.push(k === "out" ? `출력 진폭: ${(Math.max(0, n.out * (1 + 0.02 * gauss(r))) * 1e3).toFixed(0)} mV` : `V_${k} = ${e(n["V" + k]).toFixed(2)} V`); verdict = ""; draw(); };
    S.$$(".m").forEach((b) => b.addEventListener("click", () => meas(b.dataset.k)));
    S.$(".check").addEventListener("click", () => { const g = S.val("guess"); verdict = g === fault ? `정답: ${FAULT[fault]}. 측정 ${log.length}번` : `아닙니다. 더 재 보거나 다시 추정하세요. (지금 추정: ${FAULT[g]})`; draw(); });
    S.$(".reveal").addEventListener("click", () => { verdict = `숨은 고장: ${FAULT[fault]}`; draw(); });
    S.$(".new").addEventListener("click", () => { seed = (seed * 48271) % 2147483647; fault = keys[Math.floor(rng(seed)() * keys.length)]; log = []; verdict = "새 회로를 받았습니다."; draw(); });
    QSim.redrawOn(draw); draw();
  })();
})();
