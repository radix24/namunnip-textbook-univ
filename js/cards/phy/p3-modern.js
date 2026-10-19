/* 물리3 실습 카드 묶음: 시공간 도표, 흑체복사, 파동 묶음, 장벽 투과 */
(() => {
  "use strict";
  const C = () => QSim.col();
  // 복소수
  const cx = (re, im = 0) => ({ re, im }), add = (a, b) => cx(a.re + b.re, a.im + b.im), mul = (a, b) => cx(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
  const div = (a, b) => { const d = b.re * b.re + b.im * b.im; return cx((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); };
  const cexp = (a) => { const m = Math.exp(a.re); return cx(m * Math.cos(a.im), m * Math.sin(a.im)); };
  const csqrt = (a) => { const r = Math.hypot(a.re, a.im), t = Math.atan2(a.im, a.re) / 2; return cx(Math.sqrt(r) * Math.cos(t), Math.sqrt(r) * Math.sin(t)); };

  /* 1. 시공간 도표와 동시성 (01-02) */
  (() => {
    const S = QSim.card("lab-p3-spacetime"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), b = S.val("beta"), g = 1 / Math.sqrt(1 - b * b), dx = S.val("dx");
      const v = QSim.view(cv, 0.8), f = QSim.frame(v, { x0: -3, x1: 3, y0: -0.5, y1: 4, xl: "x", yl: "ct", equal: true }); f.axes({ noGrid: true });
      f.path([[-0.5, -0.5], [3, 3]], c.acc, 1.2, [4, 4]); f.path([[0.5, -0.5], [-3, 3]], c.acc, 1.2, [4, 4]);
      f.path([[0, 0], [4 * b, 4]], c.main, 2); f.path([[-3, -3 * b], [3, 3 * b]], c.main, 2);
      for (let k = 1; k <= 3; k++) f.path([[-3, k / g - 3 * b], [3, k / g + 3 * b]], c.soft, 1);   // S'의 동시선 ct' = k: ct = k/γ + βx
      const A = [-dx / 2, 2], B = [dx / 2, 2];
      f.dot(A[0], A[1], c.warn, 5); f.dot(B[0], B[1], c.warn, 5);
      f.text("A", A[0] - 0.2, A[1] + 0.15, c.warn); f.text("B", B[0] + 0.1, B[1] + 0.15, c.warn);
      f.text("ct'", 3.6 * b + 0.1, 3.7, c.main); f.text("x'", 2.6, 2.6 * b + 0.15, c.main);
      const tA = g * (A[1] - b * A[0]), tB = g * (B[1] - b * B[0]);
      S.out(`β = ${b.toFixed(2)}, γ = ${g.toFixed(3)}. 파란 선: S'의 ct'축(기울기 1/β)과 x'축(기울기 β), 주황 점선: 빛\nS에서 동시인 두 사건 A, B (같은 ct = 2, 간격 Δx = ${dx.toFixed(1)})\nS'에서: ct'_A = ${tA.toFixed(3)}, ct'_B = ${tB.toFixed(3)} → c·Δt' = ${(tB - tA).toFixed(3)} = −γβΔx${Math.abs(b) < 1e-6 ? "" : (tB < tA ? " (B가 먼저)" : " (A가 먼저)")}\n연한 선: S'에서 동시인 선들(x'축에 나란함)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 흑체복사: 플랑크와 레일리-진스 (02-01) */
  (() => {
    const S = QSim.card("lab-p3-blackbody"); if (!S) return;
    const cv = S.$("canvas"), h = 6.626e-34, c0 = 2.998e8, k = 1.381e-23;
    const planck = (lam, T) => 2 * h * c0 * c0 / lam ** 5 / (Math.exp(h * c0 / (lam * k * T)) - 1);
    const rj = (lam, T) => 2 * c0 * k * T / lam ** 4;
    function draw() {
      const c = C(), T = S.val("T"), T2 = S.val("T2"), lmax = 2.898e-3 / T, peak = planck(lmax, T), top = peak * 1.3;
      const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: 0, x1: 3000, y0: 0, y1: top / 1e12, xl: "λ (nm)", yl: "세기 (상대)" }); f.axes({ noGrid: true });
      const g = v.g; const bands = [[380, 450, "#8a5cf5"], [450, 495, "#3b7dd8"], [495, 570, "#3fae5a"], [570, 590, "#e2c83a"], [590, 620, "#f08a2c"], [620, 750, "#d9483b"]];
      bands.forEach(([a, b2, col]) => { g.fillStyle = col; g.globalAlpha = 0.18; g.fillRect(f.X(a), f.Y(top / 1e12), f.X(b2) - f.X(a), f.Y(0) - f.Y(top / 1e12)); g.globalAlpha = 1; });
      f.fn((l) => Math.min(rj(l * 1e-9, T), top * 2) / 1e12, c.ink3, 1.5, [5, 4]);
      f.fn((l) => planck(l * 1e-9, T2) / 1e12, c.acc, 1.5);
      f.fn((l) => planck(l * 1e-9, T) / 1e12, c.main, 2.5);
      f.path([[lmax * 1e9, 0], [lmax * 1e9, peak / 1e12]], c.warn, 1, [3, 3]);
      const P = 5.67e-8 * T ** 4;
      S.out(`T = ${T} K: λ_max = 2.898 mm·K / T = ${(lmax * 1e9).toFixed(0)} nm, 단위 넓이당 일률 σT⁴ = ${P.toExponential(2)} W/m²\n파랑: 플랑크, 회색 점선: 레일리-진스(같은 T), 주황: 플랑크(T₂ = ${T2} K)\nT₂/T의 일률 비 (T₂/T)⁴ = ${((T2 / T) ** 4).toFixed(2)}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 가우스 파동 묶음의 진행과 퍼짐 (03-02) */
  (() => {
    const S = QSim.card("lab-p3-packet"); if (!S) return;
    const cv = S.$("canvas"); let t = 0;
    const psi = (x, t, s0, k0) => {  // ħ = m = 1
      const a = cx(1, t / (2 * s0 * s0)), pre = div(cx(Math.pow(2 * Math.PI * s0 * s0, -0.25)), csqrt(a));
      const u = x - k0 * t, ex = add(div(cx(-u * u / (4 * s0 * s0)), a), cx(0, k0 * (x - k0 * t / 2)));
      return mul(pre, cexp(ex));
    };
    function draw() {
      const c = C(), s0 = S.val("s0"), k0 = S.val("k0");
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: -10, x1: 40, y0: -0.7, y1: 0.7, xl: "x" }); f.axes({ noGrid: true });
      const pts = [], pr = []; for (let i = 0; i <= 1200; i++) { const x = -10 + 50 * i / 1200, p = psi(x, t, s0, k0); pts.push([x, p.re]); pr.push([x, (p.re * p.re + p.im * p.im)]); }
      f.path(pts, c.ink3, 1); f.path(pr.map(([x, y]) => [x, y * 1.2]), c.main, 2.5);
      const st = s0 * Math.sqrt(1 + (t / (2 * s0 * s0)) ** 2);
      S.out(`ħ = m = 1 단위. 처음 폭 σ₀ = ${s0.toFixed(2)}, 중심 파수 k₀ = ${k0.toFixed(1)}, 시간 t = ${t.toFixed(1)}\n위치 폭 σ(t) = σ₀√(1 + (t/2σ₀²)²) = ${st.toFixed(2)}, 운동량 폭 σ_p = 1/(2σ₀) = ${(1 / (2 * s0)).toFixed(3)} (시간에 따라 일정)\nσ₀σ_p = 0.5 (최소 불확정), 중심은 군속도 k₀ = ${k0.toFixed(1)}로 움직인다 (회색: Re ψ, 파랑: |ψ|²)`);
    }
    const L = QSim.loop((dt) => { t += dt * 2; if (t > 25) return false; draw(); }).watch(S.root);
    QSim.playButton(S.$(".play"), L, () => { if (t > 25) t = 0; });
    S.$(".reset").addEventListener("click", () => { t = 0; draw(); });
    S.on(() => { t = 0; draw(); }); QSim.redrawOn(draw); draw();
  })();

  /* 4. 사각 장벽 투과 확률 (04-03) */
  (() => {
    const S = QSim.card("lab-p3-tunnel"); if (!S) return;
    const cv = S.$("canvas"), hc = 197.327, mc2 = 0.511e6;   // ħc (eV·nm), 전자 mc² (eV)
    const Texact = (E, U, L) => {
      if (Math.abs(E - U) < 1e-9) E += 1e-9;
      if (E < U) { const ka = Math.sqrt(2 * mc2 * (U - E)) / hc, s = Math.sinh(ka * L); return 1 / (1 + U * U * s * s / (4 * E * (U - E))); }
      const k2 = Math.sqrt(2 * mc2 * (E - U)) / hc, s = Math.sin(k2 * L); return 1 / (1 + U * U * s * s / (4 * E * (E - U)));
    };
    function draw() {
      const c = C(), E = S.val("E"), U = S.val("U"), L = S.val("L");
      const v = QSim.view(cv, 0.5), Emax = 3 * U, f = QSim.frame(v, { x0: 0, x1: Emax, y0: -12, y1: 0.5, xl: "E (eV)", yl: "log₁₀ T" }); f.axes();
      f.fn((e) => (e > 0 ? Math.log10(Texact(e, U, L)) : NaN), c.main, 2.5, null, 800);
      f.path([[U, -12], [U, 0.5]], c.ink3, 1, [4, 4]);
      const T = Texact(E, U, L); f.dot(E, Math.max(-12, Math.log10(T)), c.warn, 6);
      let approx = "";
      if (E < U) { const ka = Math.sqrt(2 * mc2 * (U - E)) / hc; approx = `κ = ${ka.toFixed(2)} nm⁻¹, 침투 깊이 1/κ = ${(1 / ka).toFixed(3)} nm, 근사 16(E/U)(1−E/U)e^(−2κL) = ${(16 * E / U * (1 - E / U) * Math.exp(-2 * ka * L)).toExponential(2)}`; }
      else approx = "E > U₀: 고전적으로는 늘 통과하지만 반사가 있다. T = 1이 되는 공명 에너지가 있다 (k₂L = nπ)";
      S.out(`전자, 장벽 높이 U₀ = ${U} eV, 두께 L = ${L} nm, 에너지 E = ${E} eV\n투과 확률 T = ${T < 1e-3 ? T.toExponential(3) : T.toFixed(4)}, 반사 확률 ${(1 - T).toFixed(4)}\n${approx}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
