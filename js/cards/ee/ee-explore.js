/* 전기전자 이론 과목의 탐구 카드 묶음
   1 RLC 페이저(전전3)  2 보드선도 만들기(전전3)  3 그래프로 하는 컨볼루션(전전6)  4 표본화와 에일리어싱(전전6)
   5 전송선로의 정재파(전전10)  6 AM과 포락선 검파(전전12)  7 디지털 변조 성상도와 오류율(전전21)  8 근궤적과 계단 응답(전전22) */
(() => {
  "use strict";
  if (!window.QSim) return;
  const C = () => QSim.col();
  const mono = () => getComputedStyle(document.documentElement).getPropertyValue("--f-mono") || "monospace";
  const rng = (s) => () => { s = (s * 1664525 + 1013904223) % 4294967296; return (s + 0.5) / 4294967296; };
  const gauss = (r) => Math.sqrt(-2 * Math.log(r())) * Math.cos(2 * Math.PI * r());
  const PRE = [[1e9, "G"], [1e6, "M"], [1e3, "k"], [1, ""], [1e-3, "m"], [1e-6, "μ"], [1e-9, "n"], [1e-12, "p"]];
  const eng = (x, u, d = 3) => { if (!isFinite(x)) return "∞ " + u; if (x === 0) return "0 " + u; const a = Math.abs(x), p = PRE.find(([k]) => a >= k * 0.9995) || PRE[PRE.length - 1]; return `${+(x / p[0]).toPrecision(d)} ${p[1]}${u}`; };
  // 복소수
  const cx = (re, im = 0) => ({ re, im });
  const add = (a, b) => cx(a.re + b.re, a.im + b.im), sub = (a, b) => cx(a.re - b.re, a.im - b.im);
  const mul = (a, b) => cx(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
  const div = (a, b) => { const d = b.re * b.re + b.im * b.im; return cx((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); };
  const abs = (a) => Math.hypot(a.re, a.im), arg = (a) => Math.atan2(a.im, a.re), deg = 180 / Math.PI;
  const Qf = (x) => 0.5 * erfc(x / Math.SQRT2);
  function erfc(x) { const z = Math.abs(x), t = 1 / (1 + 0.5 * z); const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277))))))))); return x >= 0 ? r : 2 - r; }

  /* 1. 직렬 RLC의 페이저 (전전3-07-01) */
  (() => {
    const S = QSim.card("exp-e3-phasor"); if (!S) return;
    const [cvP, cvT] = S.$$("canvas"); let th = 0;
    function draw() {
      const c = C(), R = S.val("R"), L = S.val("L") * 1e-3, Cc = S.val("C") * 1e-6, f = S.val("f"), w = 2 * Math.PI * f, Vs = cx(10);
      const Z = cx(R, w * L - 1 / (w * Cc)), I = div(Vs, Z), VR = mul(I, cx(R)), VL = mul(I, cx(0, w * L)), VC = mul(I, cx(0, -1 / (w * Cc)));
      const rot = (a) => mul(a, cx(Math.cos(th), Math.sin(th)));
      const M = Math.max(10, abs(VL), abs(VC)) * 1.1;
      const v = QSim.view(cvP, 0.62), fr = QSim.frame(v, { x0: -M, x1: M, y0: -M, y1: M, equal: true, pad: 10 }); fr.axes({ noGrid: true });
      const arr = (z, col, lab, from = cx(0)) => { const a = rot(z), o = rot(from); fr.arrow(o.re, o.im, a.re, a.im, col, lab); };
      arr(VR, c.main, "V_R"); arr(VL, c.acc, "V_L", VR); arr(VC, c.warn, "V_C", add(VR, VL)); arr(Vs, c.ink, "V_s");
      const Is = mul(I, cx(M / 2 / Math.max(abs(I), 1e-9))); arr(Is, c.ink3, "I (크기 맞춤)");
      // 시간 파형 (두 주기)
      const vt = QSim.view(cvT, 0.32), ft = QSim.frame(vt, { x0: 0, x1: 2, y0: -M, y1: M, xl: "주기", yl: "V" }); ft.axes({ noGrid: true });
      const wave = (z, col, wd, dash) => ft.fn((x) => abs(z) * Math.cos(2 * Math.PI * x + arg(z)), col, wd, dash);
      wave(Vs, c.ink, 2); wave(VR, c.main, 1.5); wave(VL, c.acc, 1.5, [5, 3]); wave(VC, c.warn, 1.5, [2, 3]);
      ft.path([[th / (2 * Math.PI) % 2, -M], [th / (2 * Math.PI) % 2, M]], c.rule, 1);
      const f0 = 1 / (2 * Math.PI * Math.sqrt(L * Cc));
      S.out(`f = ${eng(f, "Hz")}, ωL = ${(w * L).toFixed(1)} Ω, 1/(ωC) = ${(1 / (w * Cc)).toFixed(1)} Ω → Z = ${R} ${Z.im >= 0 ? "+" : "−"} j${Math.abs(Z.im).toFixed(1)} Ω, |Z| = ${abs(Z).toFixed(1)} Ω, ∠${(arg(Z) * deg).toFixed(1)}°\n` +
        `전원 10 V(진폭) → 전류 ${(abs(I) * 1e3).toFixed(1)} mA, 전원보다 ${Math.abs(arg(I) * deg).toFixed(1)}° ${arg(I) < 0 ? "늦음(유도성)" : "앞섬(용량성)"}\n` +
        `|V_R| = ${abs(VR).toFixed(2)} V, |V_L| = ${abs(VL).toFixed(2)} V, |V_C| = ${abs(VC).toFixed(2)} V. 세 페이저를 이어 붙이면 V_s가 됩니다. 공진 주파수 ${eng(f0, "Hz")}`);
    }
    const L = QSim.loop((dt) => { th += dt * 1.2; draw(); }).watch(S.root);
    QSim.playButton(S.$(".play"), L);
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 보드선도 만들기: 극점·영점과 직선 근사 (전전3-08-02) */
  (() => {
    const S = QSim.card("exp-e3-bode"); if (!S) return;
    const [cvM, cvP] = S.$$("canvas");
    function draw() {
      const c = C(), K = 10 ** (S.val("kdb") / 20), useZ = S.val("zon"), fz = 10 ** S.val("lz"), f1 = 10 ** S.val("lp1"), f2 = 10 ** S.val("lp2");
      const H = (f) => { let h = cx(K); if (useZ) h = mul(h, cx(1, f / fz)); h = div(h, cx(1, f / f1)); h = div(h, cx(1, f / f2)); return h; };
      const asym = (f) => { let d = 20 * Math.log10(K); const up = (fc) => (f > fc ? 20 * Math.log10(f / fc) : 0); if (useZ) d += up(fz); d -= up(f1) + up(f2); return d; };
      const aph = (f) => { const one = (fc) => (f <= fc / 10 ? 0 : f >= fc * 10 ? 90 : 45 * (1 + Math.log10(f / fc))); return (useZ ? one(fz) : 0) - one(f1) - one(f2); };
      const vm = QSim.view(cvM, 0.45), fm = QSim.frame(vm, { x0: 0, x1: 6, y0: -60, y1: 40, xl: "log₁₀ f (Hz)", yl: "dB" }); fm.axes();
      fm.fn((x) => asym(10 ** x), c.acc, 1.5, [6, 4]); fm.fn((x) => 20 * Math.log10(abs(H(10 ** x))), c.main, 2.5);
      const vp = QSim.view(cvP, 0.35), fp = QSim.frame(vp, { x0: 0, x1: 6, y0: -190, y1: 100, xl: "log₁₀ f (Hz)", yl: "위상 (°)" }); fp.axes();
      fp.fn((x) => aph(10 ** x), c.acc, 1.5, [6, 4]); fp.fn((x) => arg(H(10 ** x)) * deg, c.main, 2.5);
      const corners = [[f1, "극점 1"], [f2, "극점 2"]].concat(useZ ? [[fz, "영점"]] : []);
      corners.forEach(([f]) => { fm.path([[Math.log10(f), -60], [Math.log10(f), 40]], c.rule, 1, [2, 3]); });
      const diff = corners.map(([f, n]) => `${n} ${eng(f, "Hz")}: 실제 − 직선 = ${(20 * Math.log10(abs(H(f))) - asym(f)).toFixed(2)} dB`).join(", ");
      S.out(`H(f) = K${useZ ? "(1 + jf/f_z)" : ""} / ((1 + jf/f_p1)(1 + jf/f_p2)), K = ${S.val("kdb")} dB\n` +
        `파랑: 정확한 곡선, 주황 점선: 직선 근사(꺾이는 점마다 기울기 ±20 dB/decade, 위상은 꺾이는 점 앞뒤 10배 구간에서 ±45°/decade)\n${diff}\n` +
        `높은 주파수 기울기 ${(useZ ? 20 : 0) - 40} dB/decade, 위상은 ${(useZ ? 90 : 0) - 180}°로 갑니다.`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 그래프로 하는 컨볼루션 (전전6-02-01) */
  (() => {
    const S = QSim.card("exp-e6-conv"); if (!S) return;
    const [cvA, cvB] = S.$$("canvas"); const dt = 0.01, T0 = -1, T1 = 5;
    const SIG = { rect: (t) => (t >= 0 && t < 1 ? 1 : 0), exp: (t) => (t >= 0 ? Math.exp(-t) : 0), tri: (t) => (t >= 0 && t < 1 ? 1 - t : 0), rect2: (t) => (t >= 0 && t < 2 ? 0.5 : 0) };
    let tNow = -0.5;
    const yAt = (t, x, h) => { let s = 0; for (let u = T0; u <= T1; u += dt) s += x(u) * h(t - u) * dt; return s; };
    let cache = null;
    function curve(x, h, key) { if (cache && cache.key === key) return cache.pts; const pts = []; for (let t = T0; t <= T1 + 1e-9; t += 0.02) pts.push([t, yAt(t, x, h)]); cache = { key, pts }; return pts; }
    function draw() {
      const c = C(), x = SIG[S.val("x")], h = SIG[S.val("h")], key = S.val("x") + S.val("h"), t = S.val("auto") ? tNow : S.val("t");
      const va = QSim.view(cvA, 0.38), fa = QSim.frame(va, { x0: T0, x1: T1, y0: -0.1, y1: 1.2, xl: "τ", yl: "" }); fa.axes({ noGrid: true });
      const g = va.g; g.save(); g.fillStyle = c.soft; g.globalAlpha = 0.7;
      for (let u = T0; u < T1; u += dt) { const p = x(u) * h(t - u); if (p > 0) g.fillRect(fa.X(u), fa.Y(p), Math.max(1, fa.sx * dt), fa.Y(0) - fa.Y(p)); }
      g.restore();
      fa.fn(x, c.main, 2.5); fa.fn((u) => h(t - u), c.acc, 2, [6, 3]);
      fa.path([[t, -0.1], [t, 1.2]], c.warn, 1, [2, 3]); fa.text(`t = ${t.toFixed(2)}`, t + 0.05, 1.1, c.warn);
      const pts = curve(x, h, key), ymax = Math.max(0.2, ...pts.map((p) => p[1])) * 1.15;
      const vb = QSim.view(cvB, 0.32), fb = QSim.frame(vb, { x0: T0, x1: T1, y0: -0.05, y1: ymax, xl: "t", yl: "y(t)" }); fb.axes({ noGrid: true });
      fb.path(pts, c.rule, 1.5, [4, 3]); fb.path(pts.filter((p) => p[0] <= t), c.main, 2.5);
      const yt = yAt(t, x, h); fb.dot(t, yt, c.warn, 5);
      S.out(`위: x(τ)(파랑)와 뒤집어 t만큼 민 h(t − τ)(주황 점선). 칠한 넓이 = 두 함수 곱의 적분 = y(t)\n지금 t = ${t.toFixed(2)}: y(t) = ∫x(τ)h(t − τ)dτ ≈ ${yt.toFixed(4)}  (아래 그래프의 빨간 점)`);
    }
    const L = QSim.loop((d) => { tNow += d * 0.8; if (tNow > T1) tNow = T0; draw(); }).watch(S.root);
    QSim.playButton(S.$(".play"), L, () => { S.$('[name="auto"]').checked = true; });
    S.on(() => { if (!S.val("auto")) tNow = S.val("t"); draw(); }); QSim.redrawOn(draw); draw();
  })();

  /* 4. 표본화와 에일리어싱 (전전6-06-01, 06-02) */
  (() => {
    const S = QSim.card("exp-e6-alias"); if (!S) return;
    const [cvT, cvF] = S.$$("canvas");
    function draw() {
      const c = C(), f0 = S.val("f0"), fs = S.val("fs"), Tw = 0.25;
      let fa = f0 % fs; if (fa > fs / 2) fa = fs - fa;          // [0, fs/2]로 접힌 주파수
      const flip = (f0 % fs) > fs / 2;                          // 접히면 sin의 부호가 바뀐다
      const v = QSim.view(cvT, 0.42), f = QSim.frame(v, { x0: 0, x1: Tw, y0: -1.3, y1: 1.3, xl: "t (s)", yl: "" }); f.axes({ noGrid: true });
      f.fn((t) => Math.sin(2 * Math.PI * f0 * t), c.ink3, 1.2, null, 1500);
      f.fn((t) => (flip ? -1 : 1) * Math.sin(2 * Math.PI * fa * t), c.warn, 2, [6, 3], 800);
      for (let k = 0; k * (1 / fs) <= Tw + 1e-9; k++) { const t = k / fs; f.path([[t, 0], [t, Math.sin(2 * Math.PI * f0 * t)]], c.main, 1); f.dot(t, Math.sin(2 * Math.PI * f0 * t), c.main, 3.5); }
      const vf = QSim.view(cvF, 0.3), F = Math.max(2.2 * fs, 1.2 * f0), g = QSim.frame(vf, { x0: -F, x1: F, y0: 0, y1: 1.3, xl: "f (Hz)", yl: "" }); g.axes({ noGrid: true });
      const gg = vf.g; gg.save(); gg.fillStyle = c.soft; gg.globalAlpha = 0.5; gg.fillRect(g.X(-fs / 2), g.Y(1.3), g.X(fs / 2) - g.X(-fs / 2), g.Y(0) - g.Y(1.3)); gg.restore();
      for (let k = -6; k <= 6; k++) [f0, -f0].forEach((ff) => { const x = ff + k * fs; if (Math.abs(x) <= F) { const main = k === 0; g.path([[x, 0], [x, main ? 1 : 0.7]], main ? c.ink : c.main, main ? 2.5 : 1.5); } });
      g.path([[fa, 0], [fa, 1.15]], c.warn, 1, [3, 3]); g.path([[-fa, 0], [-fa, 1.15]], c.warn, 1, [3, 3]);
      S.out(`신호 ${f0} Hz, 표본화 ${fs} Hz (나이퀴스트 주파수 f_s/2 = ${fs / 2} Hz)\n` +
        (f0 < fs / 2 ? `f₀ < f_s/2: 표본으로 원래 신호를 되살릴 수 있습니다.` : f0 === fs / 2 ? `f₀ = f_s/2: 경계. 위상에 따라 표본이 모두 0이 될 수도 있습니다.` : `f₀ > f_s/2: 에일리어싱. 표본만 보면 ${fa.toFixed(1)} Hz${flip ? "(부호가 뒤집힌)" : ""} 신호와 구별할 수 없습니다.`) +
        `\n접힌 주파수 f_a = |f₀ − k·f_s| 중 0~f_s/2 안의 값 = ${fa.toFixed(1)} Hz (빨간 점선). 아래: 표본화한 신호의 스펙트럼은 ±f₀가 f_s마다 되풀이됨(칠한 띠가 −f_s/2~f_s/2)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 5. 전송선로의 정재파 (전전10-04-02) */
  (() => {
    const S = QSim.card("exp-e10-tline"); if (!S) return;
    const [cvV, cvG] = S.$$("canvas"); let wt = 0; const Z0 = 50;
    function load() {
      const k = S.val("kind");
      if (k === "short") return cx(0); if (k === "open") return cx(1e12); if (k === "match") return cx(50);
      return cx(S.val("RL"), S.val("XL"));
    }
    function draw() {
      const c = C(), ZL = load(), G = div(sub(ZL, cx(Z0)), add(ZL, cx(Z0))), Gm = abs(G), vswr = Gm < 0.9999 ? (1 + Gm) / (1 - Gm) : Infinity, dl = S.val("d");
      // d: 부하에서 거슬러 잰 거리(파장 단위). V(d) = e^{jβd} + Γe^{−jβd}
      const V = (d) => { const b = 2 * Math.PI * d; return add(cx(Math.cos(b), Math.sin(b)), mul(G, cx(Math.cos(-b), Math.sin(-b)))); };
      const v = QSim.view(cvV, 0.42), f = QSim.frame(v, { x0: -1.5, x1: 0, y0: -2.2, y1: 2.2, xl: "부하로부터의 위치 (파장)", yl: "V" }); f.axes({ noGrid: true });
      f.fn((x) => abs(V(-x)), c.main, 2.5); f.fn((x) => -abs(V(-x)), c.main, 1, [3, 3]);
      f.fn((x) => { const z = mul(V(-x), cx(Math.cos(wt), Math.sin(wt))); return z.re; }, c.acc, 1.8);
      f.path([[-dl, -2.2], [-dl, 2.2]], c.warn, 1, [3, 3]);
      const b = 2 * Math.PI * dl, t = Math.tan(b), Zin = Math.abs(Math.cos(b)) < 1e-9 ? (abs(ZL) < 1e-9 ? cx(1e12) : div(cx(Z0 * Z0), ZL)) : mul(cx(Z0), div(add(ZL, cx(0, Z0 * t)), add(cx(Z0), mul(ZL, cx(0, t)))));
      // 반사 계수 평면
      const vg = QSim.view(cvG, 0.5), fg = QSim.frame(vg, { x0: -1.15, x1: 1.15, y0: -1.15, y1: 1.15, equal: true, pad: 8 }); fg.axes({ noGrid: true });
      const gg = vg.g; gg.save(); gg.strokeStyle = c.ink3; gg.lineWidth = 1.2; gg.beginPath(); gg.arc(fg.X(0), fg.Y(0), fg.sx, 0, 7); gg.stroke(); gg.setLineDash([3, 3]); gg.beginPath(); gg.arc(fg.X(0), fg.Y(0), fg.sx * Gm, 0, 7); gg.stroke(); gg.restore();
      fg.dot(G.re, G.im, c.main, 5); const Gd = mul(G, cx(Math.cos(-2 * b), Math.sin(-2 * b))); fg.dot(Gd.re, Gd.im, c.warn, 5);
      fg.text("Γ_L", G.re + 0.05, G.im + 0.05, c.main); fg.text("Γ(d)", Gd.re + 0.05, Gd.im - 0.12, c.warn);
      const zs = (z) => (abs(z) > 1e9 ? "∞" : `${z.re.toFixed(1)} ${z.im >= 0 ? "+" : "−"} j${Math.abs(z.im).toFixed(1)}`);
      S.out(`Z₀ = 50 Ω, 부하 Z_L = ${zs(ZL)} Ω → Γ_L = ${Gm.toFixed(3)}∠${(arg(G) * deg).toFixed(1)}°, 정재파비 VSWR = ${isFinite(vswr) ? vswr.toFixed(2) : "∞"}\n` +
        `파랑: 전압 진폭 |V| (최대 ${(1 + Gm).toFixed(2)}, 최소 ${(1 - Gm).toFixed(2)}, 입사파 진폭 1). 주황: 어느 순간의 전압. 최소점 사이 간격은 반 파장\n` +
        `부하에서 ${dl.toFixed(3)} λ 떨어진 곳(빨간 점선)의 입력 임피던스 Z_in = ${zs(Zin)} Ω. 오른쪽: Γ(d) = Γ_L e^(−j2βd)는 반지름 |Γ_L|인 원 위를 돈다(반 파장에 한 바퀴)`);
    }
    const L = QSim.loop((dt) => { wt += dt * 3; draw(); }).watch(S.root);
    QSim.playButton(S.$(".play"), L);
    const sync = () => { const u = S.val("kind") === "user"; S.$$(".only-user").forEach((e) => (e.style.display = u ? "" : "none")); };
    S.on(() => { sync(); draw(); }); sync(); QSim.redrawOn(draw); draw();
  })();

  /* 6. AM 변조와 포락선 검파 (전전12-02-01, 02-02) */
  (() => {
    const S = QSim.card("exp-e12-am"); if (!S) return;
    const [cvT, cvF] = S.$$("canvas");
    function draw() {
      const c = C(), m = S.val("m"), fc = 20, fm = 1, tau = S.val("tau"), N = 6000, T = 2;   // 시간 단위: 메시지 주기
      const s = (t) => (1 + m * Math.cos(2 * Math.PI * fm * t)) * Math.cos(2 * Math.PI * fc * t);
      const v = QSim.view(cvT, 0.45), lim = 1 + Math.max(1, m) * 1.05, f = QSim.frame(v, { x0: 0, x1: T, y0: -lim, y1: lim, xl: "t (메시지 주기)", yl: "" }); f.axes({ noGrid: true });
      f.fn(s, c.ink3, 1, null, 3000);
      f.fn((t) => 1 + m * Math.cos(2 * Math.PI * fm * t), c.acc, 1.5, [5, 3]);
      // 포락선 검파기: 이상 다이오드 + RC. 입력이 축전기보다 크면 따라가고, 아니면 τ로 방전
      let vd = 0, clip = 0; const det = [];
      for (let i = 0; i <= N; i++) {
        const t = T * i / N, x = s(t); if (x > vd) vd = x; else vd *= Math.exp(-(T / N) / tau); det.push([t, vd]);
        // 반송파 봉우리 순간(cos = 1)에 검파 출력이 포락선보다 높게 남아 있으면 따라가지 못한 것(사선 클리핑)
        if (t > 0.5 && Math.abs(t * fc - Math.round(t * fc)) < 0.5 * fc * T / N) clip = Math.max(clip, vd - Math.abs(1 + m * Math.cos(2 * Math.PI * fm * t)));
      }
      f.path(det, c.main, 2.2);
      const vf = QSim.view(cvF, 0.28), g = QSim.frame(vf, { x0: fc - 4, x1: fc + 4, y0: 0, y1: 1.15, xl: "f (메시지 주파수 단위)", yl: "" }); g.axes({ noGrid: true });
      g.path([[fc, 0], [fc, 1]], c.ink, 2.5); [-1, 1].forEach((k) => g.path([[fc + k * fm, 0], [fc + k * fm, m / 2]], c.main, 2.5));
      const eta = m * m / (2 + m * m);
      S.out(`변조 지수 m = ${m.toFixed(2)}${m > 1 ? " (과변조: 포락선이 0 아래로 내려가 뒤집힘)" : ""}. 반송파 f_c = 20 f_m\n` +
        `스펙트럼: 반송파 1, 옆띠 f_c ± f_m 각 m/2 = ${(m / 2).toFixed(2)}. 전력 효율 η = m²/(2 + m²) = ${(100 * eta).toFixed(1)}%\n` +
        `포락선 검파기 RC = ${tau.toFixed(3)} (메시지 주기 단위). 파랑 검파 출력, 주황 점선 이상 포락선
` +
        `톱니: 반송파 한 주기(${(1 / fc).toFixed(3)}) 동안 1 − e^(−T_c/RC) = ${(100 * (1 - Math.exp(-1 / fc / tau))).toFixed(1)}% 방전. 사선 클리핑: 포락선보다 최대 ${Math.max(0, clip).toFixed(3)} 높게 남음` +
        (m > 0 && m < 1 ? ` (따라가려면 RC ≤ √(1 − m²)/(2πf_m·m) = ${(Math.sqrt(1 - m * m) / (2 * Math.PI * m)).toFixed(3)})` : ""));
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 7. 디지털 변조의 성상도와 오류율 (전전21-04-01) */
  (() => {
    const S = QSim.card("exp-e21-const"); if (!S) return;
    const cv = S.$("canvas"); let seed = 3;
    const pam = (lv, b) => lv[b];   // 그레이 부호 순서의 레벨
    function draw() {
      const c = C(), mod = S.val("mod"), ebn0 = 10 ** (S.val("eb") / 10), r = rng(seed), Nsym = 4000;
      const k = { bpsk: 1, qpsk: 2, qam16: 4 }[mod], N0 = 1 / (k * ebn0), sg = Math.sqrt(N0 / 2);   // 평균 심볼 에너지 1
      const L4 = [-3, -1, 1, 3].map((x) => x / Math.sqrt(10)), G4 = [0, 1, 3, 2];   // 16QAM 축마다 그레이: 00 01 11 10
      let bitErr = 0, symErr = 0; const pts = [];
      for (let n = 0; n < Nsym; n++) {
        let tx, bits, rx, dec;
        if (mod === "bpsk") { bits = [r() < 0.5 ? 0 : 1]; tx = cx(bits[0] ? 1 : -1); rx = add(tx, cx(sg * gauss(r), sg * gauss(r))); dec = [rx.re > 0 ? 1 : 0]; }
        else if (mod === "qpsk") { bits = [r() < 0.5 ? 0 : 1, r() < 0.5 ? 0 : 1]; tx = cx((bits[0] ? 1 : -1) / Math.SQRT2, (bits[1] ? 1 : -1) / Math.SQRT2); rx = add(tx, cx(sg * gauss(r), sg * gauss(r))); dec = [rx.re > 0 ? 1 : 0, rx.im > 0 ? 1 : 0]; }
        else {
          const iI = Math.floor(r() * 4), iQ = Math.floor(r() * 4); tx = cx(pam(L4, iI), pam(L4, iQ)); bits = [G4[iI] >> 1, G4[iI] & 1, G4[iQ] >> 1, G4[iQ] & 1];
          rx = add(tx, cx(sg * gauss(r), sg * gauss(r)));
          const q = (x) => { const y = x * Math.sqrt(10); return y < -2 ? 0 : y < 0 ? 1 : y < 2 ? 2 : 3; }, dI = q(rx.re), dQ = q(rx.im); dec = [G4[dI] >> 1, G4[dI] & 1, G4[dQ] >> 1, G4[dQ] & 1];
        }
        const e = bits.reduce((a, b, i) => a + (b !== dec[i] ? 1 : 0), 0); bitErr += e; if (e) symErr++;
        if (n < 1500) pts.push([rx.re, rx.im, e > 0]);
      }
      const v = QSim.view(cv, 0.8), lim = 1.6, f = QSim.frame(v, { x0: -lim, x1: lim, y0: -lim, y1: lim, equal: true, pad: 10, xl: "I", yl: "Q" }); f.axes({ noGrid: true });
      const g = v.g; pts.forEach(([x, y, bad]) => { g.fillStyle = bad ? c.warn : c.main; g.globalAlpha = bad ? 0.9 : 0.35; g.fillRect(f.X(x) - 1, f.Y(y) - 1, 2.4, 2.4); }); g.globalAlpha = 1;
      const ideal = mod === "bpsk" ? [[-1, 0], [1, 0]] : mod === "qpsk" ? [[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, b]) => [a / Math.SQRT2, b / Math.SQRT2]) : L4.flatMap((a) => L4.map((b) => [a, b]));
      ideal.forEach(([x, y]) => f.dot(x, y, c.ink, 3.5));
      if (mod === "qam16") [-2, 0, 2].forEach((t) => { f.path([[t / Math.sqrt(10), -lim], [t / Math.sqrt(10), lim]], c.ink3, 1, [3, 3]); f.path([[-lim, t / Math.sqrt(10)], [lim, t / Math.sqrt(10)]], c.ink3, 1, [3, 3]); });
      else { f.path([[0, -lim], [0, lim]], c.ink3, 1, [3, 3]); if (mod === "qpsk") f.path([[-lim, 0], [lim, 0]], c.ink3, 1, [3, 3]); }
      const th = mod === "qam16" ? 0.75 * Qf(Math.sqrt(0.8 * ebn0)) * (1 - 0) : Qf(Math.sqrt(2 * ebn0));
      S.out(`${{ bpsk: "BPSK", qpsk: "QPSK", qam16: "16QAM" }[mod]} (심볼당 ${k}비트), E_b/N₀ = ${S.val("eb")} dB, 심볼 ${Nsym}개 가상 전송 (점 1500개 표시, 빨강은 틀린 심볼)\n` +
        `가상 측정 비트 오류율 ${(bitErr / (Nsym * k)).toExponential(2)}, 심볼 오류율 ${(symErr / Nsym).toExponential(2)}\n` +
        `이론 비트 오류율 ${mod === "qam16" ? "≈ (3/4)·Q(√(0.8·E_b/N₀))" : "Q(√(2E_b/N₀))"} = ${th.toExponential(2)}${bitErr === 0 ? " (오류가 너무 드물어 4000심볼로는 잡히지 않을 수 있음)" : ""}`);
    }
    S.$(".again").addEventListener("click", () => { seed = (seed * 48271) % 2147483647; draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 8. 근궤적과 계단 응답 (전전22-04-01, 02-01) */
  (() => {
    const S = QSim.card("exp-e22-rlocus"); if (!S) return;
    const [cvL, cvS] = S.$$("canvas");
    function roots3(a2, a1, a0) {   // s³ + a2 s² + a1 s + a0 = 0 (뒤랑-케르너)
      let z = [cx(0.4, 0.9), cx(-0.65, 0.72), cx(-0.3, -1.1)].map((q) => mul(q, cx(1 + Math.abs(a2) + Math.abs(a1) + Math.abs(a0))));
      const p = (s) => add(mul(add(mul(add(s, cx(a2)), s), cx(a1)), s), cx(a0));
      for (let it = 0; it < 200; it++) z = z.map((zi, i) => { let d = cx(1); z.forEach((zj, j) => { if (i !== j) d = mul(d, sub(zi, zj)); }); return sub(zi, div(p(zi), d)); });
      return z;
    }
    function draw() {
      const c = C(), a = S.val("a"), b = S.val("b"), Kc = a * b * (a + b), K = Kc * 10 ** S.val("lk");
      const vl = QSim.view(cvL, 0.62), X0 = -(a + b) - 2, f = QSim.frame(vl, { x0: X0, x1: 2, y0: -(a + b + 2) * 0.62, y1: (a + b + 2) * 0.62, equal: true, xl: "실수부", yl: "허수부", pad: 18 }); f.axes();
      for (let e = -4; e <= 1.2; e += 0.01) { const r = roots3(a + b, a * b, Kc * 10 ** e); r.forEach((z) => { if (z.re > X0 && z.re < 2) f.dot(z.re, z.im, c.rule, 1.2); }); }
      [0, -a, -b].forEach((p) => { const g = vl.g; g.strokeStyle = c.ink; g.lineWidth = 2; const x = f.X(p), y = f.Y(0); g.beginPath(); g.moveTo(x - 5, y - 5); g.lineTo(x + 5, y + 5); g.moveTo(x + 5, y - 5); g.lineTo(x - 5, y + 5); g.stroke(); });
      const r = roots3(a + b, a * b, K); r.forEach((z) => f.dot(z.re, z.im, z.re > 1e-9 ? c.warn : c.main, 6));
      // 닫힌 루프 계단 응답: y''' + (a+b)y'' + ab y' + K y = K
      const dom = r.reduce((m, z) => (z.re > m.re ? z : m), r[0]), sig = Math.max(0.05, Math.abs(dom.re));
      const tEnd = Math.min(60, Math.max(3, 8 / sig)), N = 3000, h = tEnd / N; let y = [0, 0, 0]; const pts = [];
      for (let i = 0; i <= N; i++) { pts.push([i * h, y[0]]); y = QSim.rk4((t, s) => [s[1], s[2], K - K * s[0] - a * b * s[1] - (a + b) * s[2]], 0, y, h); if (!isFinite(y[0]) || Math.abs(y[0]) > 1e3) break; }
      const ymax = Math.max(1.2, ...pts.map((p) => p[1])), ymin = Math.min(-0.2, ...pts.map((p) => p[1]));
      const vs = QSim.view(cvS, 0.32), g = QSim.frame(vs, { x0: 0, x1: tEnd, y0: Math.max(ymin, -3), y1: Math.min(ymax * 1.05, 4), xl: "t (s)", yl: "y" }); g.axes();
      g.path(pts.map(([t, v]) => [t, Math.max(-3, Math.min(4, v))]), c.main, 2.2); g.path([[0, 1], [tEnd, 1]], c.ink3, 1, [3, 3]);
      const stable = r.every((z) => z.re < -1e-9);
      let os = NaN, ts = NaN; if (stable) { os = Math.max(0, 100 * (Math.max(...pts.map((p) => p[1])) - 1)); for (let i = pts.length - 1; i >= 0; i--) if (Math.abs(pts[i][1] - 1) > 0.02) { ts = i === pts.length - 1 ? Infinity : pts[i][0]; break; } }
      const z = Math.abs(dom.im) > 1e-6 ? -dom.re / abs(dom) : 1;
      S.out(`G(s) = K / (s(s + ${a})(s + ${b})), 단위 되먹임. 회색 점: K를 바꿀 때 닫힌 루프 극점이 지나는 길(근궤적), ×: 열린 루프 극점\n` +
        `K = ${K.toPrecision(4)} (안정 한계 K = ab(a + b) = ${Kc.toFixed(2)}의 ${(K / Kc).toFixed(3)}배) → 극점 ${r.map((q) => `${q.re.toFixed(2)}${q.im >= 0 ? "+" : "−"}j${Math.abs(q.im).toFixed(2)}`).join(", ")}\n` +
        (stable ? `안정. 가장 느린(우세) 극점의 감쇠비 ζ ≈ ${z.toFixed(2)}, 넘침 ${os.toFixed(1)}%, 2% 정착 시간 ${ts === Infinity ? `${tEnd.toFixed(0)} s 넘음` : isFinite(ts) ? ts.toFixed(2) + " s" : "-"}` : `불안정 또는 한계: 극점이 허수축 위나 오른쪽에 있어 응답이 줄지 않습니다.`));
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
