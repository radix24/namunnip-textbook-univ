/* 물리13 실습 카드 묶음: 맥스웰 속력 분포, 2준위계·상자성체, 페르미 기체, 디바이·아인슈타인 열용량, 2차원 이징 몬테카를로 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const rng = (s) => () => { s = (s * 1664525 + 1013904223) % 4294967296; return (s + 0.5) / 4294967296; };
  const gauss = (r) => Math.sqrt(-2 * Math.log(r())) * Math.cos(2 * Math.PI * r());
  const kB = 1.380649e-23, U = 1.66054e-27;
  const simpson = (f, a, b, n = 400) => { const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h); return s * h / 3; };

  /* 1. 맥스웰 속력 분포와 표본 (01-01) */
  (() => {
    const S = QSim.card("lab-p13-mb"); if (!S) return;
    const cv = S.$("canvas"); let seed = 13;
    function draw() {
      const c = C(), m = Number(S.val("gas")) * U, T = S.val("T"), N = S.val("n"), r = rng(seed), s = Math.sqrt(kB * T / m);
      const D = (v) => 4 * Math.PI * Math.pow(m / (2 * Math.PI * kB * T), 1.5) * v * v * Math.exp(-m * v * v / (2 * kB * T));
      const vmax = 4.5 * s * Math.SQRT2, bins = 40, h = Array(bins).fill(0); let sum = 0, sum2 = 0;
      for (let i = 0; i < N; i++) { const v = s * Math.hypot(gauss(r), gauss(r), gauss(r)); sum += v; sum2 += v * v; const b = Math.floor(v / vmax * bins); if (b < bins) h[b]++; }
      const dv = vmax / bins, peak = D(Math.SQRT2 * s);
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: vmax, y0: 0, y1: peak * 1.3 * 1000, xl: "속력 v (m/s)", yl: "분포 (10⁻³ s/m)" }); f.axes();
      const g = v.g; h.forEach((cnt, i) => { const y = cnt / (N * dv) * 1000; g.fillStyle = c.soft; g.fillRect(f.X(i * dv), f.Y(y), f.sx * dv - 1, f.Y(0) - f.Y(y)); });
      f.fn((x) => D(x) * 1000, c.main, 2.5, null, 300);
      const vp = Math.SQRT2 * s, vb = Math.sqrt(8 / Math.PI) * s, vr = Math.sqrt(3) * s;
      [[vp, c.warn], [vb, c.acc], [vr, c.ink]].forEach(([x, col]) => f.path([[x, 0], [x, peak * 1.25 * 1000]], col, 1.2, [4, 3]));
      S.out(`질량 ${S.val("gas")} u, T = ${T} K, 표본 ${N}개 (막대)\n이론: v_p = ${vp.toFixed(0)} (빨강), v̄ = ${vb.toFixed(0)} (주황), v_rms = ${vr.toFixed(0)} m/s (검정)\n표본: 평균 ${(sum / N).toFixed(0)} m/s, rms ${Math.sqrt(sum2 / N).toFixed(0)} m/s`);
    }
    S.$(".new").addEventListener("click", () => { seed = (seed * 37 + 11) % 99991; draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 2준위계의 쇼트키 열용량과 상자성 자화 (03-02) */
  (() => {
    const S = QSim.card("lab-p13-twostate"); if (!S) return;
    const [cvC, cvM] = S.$$("canvas");
    function draw() {
      const c = C(), t = S.val("t"), x = 1 / t;   // t = kT/ε
      const Cn = (tt) => { const y = 1 / tt; return y * y * Math.exp(y) / (Math.exp(y) + 1) ** 2; };
      const Sn = (tt) => { const y = 1 / tt; return Math.log(1 + Math.exp(-y)) + y / (Math.exp(y) + 1); };
      const En = (tt) => 1 / (Math.exp(1 / tt) + 1);
      const vc = QSim.view(cvC, 0.42), fc = QSim.frame(vc, { x0: 0, x1: 2.5, y0: 0, y1: 0.75, xl: "kT/ε", yl: "C/Nk, S/Nk, E/Nε" }); fc.axes();
      fc.fn((tt) => (tt < 0.02 ? 0 : Cn(tt)), c.main, 2.5, null, 400); fc.fn((tt) => (tt < 0.02 ? 0 : Sn(tt)), c.acc, 1.8, [5, 3], 400); fc.fn((tt) => (tt < 0.02 ? 0 : En(tt)), c.ink3, 1.5, [2, 3], 400);
      fc.path([[0, Math.LN2], [2.5, Math.LN2]], c.soft, 1, [2, 4]); fc.dot(t, Cn(t), c.warn, 5);
      const bt = S.val("bt");   // μB/kT
      const vm = QSim.view(cvM, 0.36), fm = QSim.frame(vm, { x0: 0, x1: 4, y0: 0, y1: 1.08, xl: "μB/kT", yl: "M/Nμ" }); fm.axes();
      fm.fn(Math.tanh, c.main, 2.5, null, 300); fm.fn((y) => (y < 1.08 ? y : NaN), c.ink3, 1.2, [4, 3], 300); fm.dot(bt, Math.tanh(bt), c.warn, 5);
      let best = 0, bc = 0; for (let i = 1; i <= 3000; i++) { const tt = 2.5 * i / 3000, v = Cn(tt); if (v > bc) { bc = v; best = tt; } }
      S.out(`2준위계 kT/ε = ${t.toFixed(3)}: C/Nk = ${Cn(t).toFixed(4)}, S/Nk = ${Sn(t).toFixed(4)} (최대 ln 2 = 0.693), 위 준위 비율 ${En(t).toFixed(4)}\n쇼트키 봉우리: kT/ε = ${best.toFixed(3)}에서 C/Nk = ${bc.toFixed(4)} (파랑: C, 주황 점선: S, 회색 점선: E)\n상자성체 μB/kT = ${bt.toFixed(2)}: M/Nμ = tanh = ${Math.tanh(bt).toFixed(4)}, 퀴리 근사(회색 점선) ${bt.toFixed(4)}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 페르미 기체: 점유수, μ(T), 열용량 (05-01, 05-02) */
  (() => {
    const S = QSim.card("lab-p13-fermi"); if (!S) return;
    const [cvN, cvC] = S.$$("canvas");
    // 단위: E_F = 1, g(ε) = (3/2)√ε (N = 1로 규격화)
    const fd = (e, mu, t) => 1 / (Math.exp((e - mu) / t) + 1);
    const Nof = (mu, t) => simpson((e) => 1.5 * Math.sqrt(e) * fd(e, mu, t), 0, Math.max(mu, 0) + 40 * t, 800);
    const muOf = (t) => { if (t < 1e-4) return 1; let lo = -20 * t - 2, hi = 1.5; for (let i = 0; i < 70; i++) { const m = (lo + hi) / 2; if (Nof(m, t) > 1) hi = m; else lo = m; } return (lo + hi) / 2; };
    const Eof = (t) => { const mu = muOf(t); return simpson((e) => 1.5 * Math.pow(e, 1.5) * fd(e, mu, t), 0, Math.max(mu, 0) + 40 * t, 800); };
    const cache = {};
    function draw() {
      const c = C(), t = S.val("t"), mu = muOf(t);
      const vn = QSim.view(cvN, 0.42), fn = QSim.frame(vn, { x0: 0, x1: 2, y0: 0, y1: 1.7, xl: "ε/E_F", yl: "g(ε)·f(ε)" }); fn.axes();
      fn.fn((e) => 1.5 * Math.sqrt(e), c.soft, 1.2, [4, 3], 300); fn.fn((e) => 1.5 * Math.sqrt(e) * fd(e, mu, Math.max(t, 1e-4)), c.main, 2.5, null, 500);
      fn.fn((e) => fd(e, mu, Math.max(t, 1e-4)), c.acc, 1.5, [2, 3], 500); fn.path([[mu, 0], [mu, 1.7]], c.warn, 1, [3, 3]);
      const dt = Math.max(0.002, t * 0.02), Cn = t < 0.002 ? 0 : (Eof(t + dt) - Eof(t - dt)) / (2 * dt);
      const vc = QSim.view(cvC, 0.34), fc = QSim.frame(vc, { x0: 0, x1: 1, y0: 0, y1: 1.6, xl: "T/T_F", yl: "C/Nk" }); fc.axes();
      if (!cache.c) { cache.c = []; for (let i = 1; i <= 25; i++) { const tt = i / 25, d = tt * 0.02; cache.c.push([tt, (Eof(tt + d) - Eof(tt - d)) / (2 * d)]); } }
      fc.path([[0, 0], ...cache.c], c.main, 2.2); fc.fn((tt) => Math.PI * Math.PI / 2 * tt, c.acc, 1.4, [5, 3]); fc.path([[0, 1.5], [1, 1.5]], c.ink3, 1, [2, 3]); fc.dot(t, Cn, c.warn, 5);
      const muS = 1 - Math.PI * Math.PI / 12 * t * t;
      S.out(`T/T_F = ${t.toFixed(3)}: 화학 퍼텐셜 μ/E_F = ${mu.toFixed(4)} (조머펠트 근사 ${muS.toFixed(4)}), 빨간 점선\n열용량 C/Nk = ${Cn.toFixed(4)} (조머펠트 (π²/2)T/T_F = ${(Math.PI * Math.PI / 2 * t).toFixed(4)}, 고전 극한 1.5)\n위: 상태 밀도(연한 점선)와 채워진 상태(파랑), 점유수 f(ε)(주황 점선)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 디바이와 아인슈타인 열용량 (06-02, 03-03) */
  (() => {
    const S = QSim.card("lab-p13-debye"); if (!S) return;
    const cv = S.$("canvas");
    const deb = (t) => { if (t < 1e-4) return 0; const xD = 1 / t; return 9 * t ** 3 * simpson((x) => (x < 1e-8 ? 0 : x ** 4 * Math.exp(x) / (Math.exp(x) - 1) ** 2), 1e-8, Math.min(xD, 200), 600); };
    const ein = (t, r) => { const x = r / t; if (x > 300) return 0; return 3 * x * x * Math.exp(x) / (Math.exp(x) - 1) ** 2; };   // Θ_E = r·Θ_D
    function draw() {
      const c = C(), t = S.val("t"), r = S.val("r"), log = S.val("log");
      const v = QSim.view(cv, 0.5);
      if (!log) {
        const f = QSim.frame(v, { x0: 0, x1: 1.5, y0: 0, y1: 3.3, xl: "T/Θ_D", yl: "C_V/Nk" }); f.axes();
        f.fn(deb, c.main, 2.5, null, 300); f.fn((x) => ein(x, r), c.acc, 2, [5, 3], 300); f.path([[0, 3], [1.5, 3]], c.ink3, 1, [2, 3]); f.dot(t, deb(t), c.warn, 5);
      } else {
        const f = QSim.frame(v, { x0: -2.5, x1: 0.2, y0: -6, y1: 0.7, xl: "log₁₀(T/Θ_D)", yl: "log₁₀(C_V/Nk)" }); f.axes();
        f.fn((x) => Math.log10(deb(10 ** x)), c.main, 2.5, null, 300); f.fn((x) => { const e = ein(10 ** x, r); return e > 0 ? Math.log10(e) : NaN; }, c.acc, 2, [5, 3], 300);
        f.fn((x) => Math.log10(12 * Math.PI ** 4 / 5) + 3 * x, c.ink3, 1.2, [2, 3], 300); f.dot(Math.log10(t), Math.log10(Math.max(deb(t), 1e-9)), c.warn, 5);
      }
      const low = 12 * Math.PI ** 4 / 5 * t ** 3;
      S.out(`T/Θ_D = ${t.toFixed(3)}: 디바이 C_V/Nk = ${deb(t).toFixed(4)}, 저온 근사 (12π⁴/5)(T/Θ_D)³ = ${low.toFixed(4)}, 아인슈타인(Θ_E = ${r.toFixed(2)}Θ_D) ${ein(t, r).toFixed(4)}\n파랑: 디바이, 주황 점선: 아인슈타인, 회색: 뒬롱-프티 3${log ? " / 로그 그래프의 회색 점선은 T³ 법칙" : ""}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 5. 2차원 이징 모형 메트로폴리스 (07-02, 07-01) */
  (() => {
    const S = QSim.card("lab-p13-ising"); if (!S) return;
    const cv = S.$("canvas"); let seed = 7, Lsz = 0, s = null, r = null, swept = 0, lastT = null, stats = null;
    const init = () => { Lsz = S.val("L"); r = rng(seed); s = new Int8Array(Lsz * Lsz); for (let i = 0; i < s.length; i++) s[i] = r() < 0.5 ? 1 : -1; swept = 0; stats = null; };
    const sweep = (T, n) => {
      const L = Lsz, w4 = Math.exp(-4 / T), w8 = Math.exp(-8 / T);
      for (let k = 0; k < n; k++) for (let it = 0; it < L * L; it++) {
        const i = Math.floor(r() * L * L), x = i % L, y = (i - x) / L;
        const nb = s[y * L + (x + 1) % L] + s[y * L + (x + L - 1) % L] + s[((y + 1) % L) * L + x] + s[((y + L - 1) % L) * L + x];
        const dE = 2 * s[i] * nb;   // J = 1
        if (dE <= 0 || (dE === 4 && r() < w4) || (dE === 8 && r() < w8)) s[i] = -s[i];
      }
      swept += n;
    };
    const measure = () => { const L = Lsz; let M = 0, E = 0; for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) { const v = s[y * L + x]; M += v; E -= v * (s[y * L + (x + 1) % L] + s[((y + 1) % L) * L + x]); } return { m: Math.abs(M) / (L * L), e: E / (L * L) }; };
    function run(more) {
      const T = S.val("T");
      if (!s || S.val("L") !== Lsz) init();
      if (lastT !== T) { stats = null; lastT = T; }
      sweep(T, more ? 200 : 300);
      // 측정: 200 스윕 동안 2 스윕마다
      const ms = [], es = []; for (let k = 0; k < 100; k++) { sweep(T, 2); const q = measure(); ms.push(q.m); es.push(q.e); }
      const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length, mbar = avg(ms), ebar = avg(es);
      const N = Lsz * Lsz, Cv = N * (avg(es.map((e) => e * e)) - ebar * ebar) / (T * T);
      stats = { mbar, ebar, Cv, T };
      draw();
    }
    function draw() {
      const c = C(), v = QSim.view(cv, 0.6), g = v.g, L = Lsz, side = Math.min(v.H - 10, v.W * 0.5), px = side / L;
      for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) { g.fillStyle = s[y * L + x] > 0 ? c.main : "#f2f2f2"; g.fillRect(5 + x * px, 5 + y * px, Math.ceil(px), Math.ceil(px)); }
      g.strokeStyle = c.ink3; g.strokeRect(5, 5, side, side);
      if (!stats) return;
      const T = stats.T, Tc = 2 / Math.log(1 + Math.SQRT2), ons = T < Tc ? Math.pow(1 - Math.pow(Math.sinh(2 / T), -4), 1 / 8) : 0;
      let mf = 1; for (let i = 0; i < 2000; i++) mf = Math.tanh(4 * mf / T); if (T >= 4) mf = 0;
      S.out(`L = ${L} (스핀 ${L * L}개), kT/J = ${T.toFixed(2)}, 지금까지 ${swept} 스윕 (파란 칸: 위 스핀)\n|m| = ${stats.mbar.toFixed(3)}, 에너지/스핀 = ${stats.ebar.toFixed(3)}J, 열용량/스핀 ≈ ${stats.Cv.toFixed(3)}k (요동에서)\n비교: 온사거 정확값(무한 격자) ${ons.toFixed(3)}, 평균장 ${mf.toFixed(3)}. 정확한 kT_c/J = ${Tc.toFixed(3)}, 평균장 4`);
    }
    S.$(".new").addEventListener("click", () => { seed = (seed * 53 + 17) % 99991; init(); run(false); });
    S.$(".more").addEventListener("click", () => run(true));
    S.on(() => run(false)); QSim.redrawOn(draw); init(); run(false);
  })();
})();
