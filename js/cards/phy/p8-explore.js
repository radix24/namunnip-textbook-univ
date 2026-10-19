/* 물리8 탐구 카드 묶음: 자유 파동 묶음과 Ehrenfest, 조화 진동자 고유함수, 측정과 붕괴 */
(() => {
  "use strict";
  const C = () => QSim.col();

  /* 1. 자유 파동 묶음: 기대값은 고전 궤도를 따르고 폭은 퍼진다 (01-03). ħ = m = 1 */
  (() => {
    const S = QSim.card("lab-p8-ehrenfest"); if (!S) return;
    const cv = S.$("canvas");
    function psi(x, t, s0, k0) {   // 복소 파동함수 (re, im)
      const a = 1 / (4 * s0 * s0), br = 1, bi = t / (2 * s0 * s0);   // 1 + i t/(2σ²)
      const den = br * br + bi * bi, ir = br / den, ii = -bi / den;    // 1/(1 + i t/2σ²)
      const u = x - k0 * t;
      const er = -a * u * u * ir, ei = -a * u * u * ii + k0 * x - k0 * k0 * t / 2;   // 지수의 실수부, 허수부
      const m = Math.pow(2 * Math.PI * s0 * s0, -0.25) * Math.pow(den, -0.25), ph = -0.5 * Math.atan2(bi, br);
      const amp = m * Math.exp(er);
      return [amp * Math.cos(ei + ph), amp * Math.sin(ei + ph)];
    }
    function draw() {
      const c = C(), s0 = S.val("s0"), k0 = S.val("k0"), t = S.val("t");
      const st = s0 * Math.sqrt(1 + (t / (2 * s0 * s0)) ** 2), xc = k0 * t;
      const x0 = Math.min(-4 * s0, xc - 4 * st) - 1, x1 = Math.max(4 * s0, xc + 4 * st) + 1;
      const pk = 1 / Math.sqrt(2 * Math.PI) / s0;
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0, x1, y0: -0.75 * Math.sqrt(pk), y1: 1.15 * Math.max(pk, Math.sqrt(pk)), xl: "x", yl: "|Ψ|²" }); f.axes();
      f.fn((x) => Math.exp(-x * x / (2 * s0 * s0)) / Math.sqrt(2 * Math.PI) / s0, c.ink3, 1.2, [5, 4], 600);
      f.fn((x) => psi(x, t, s0, k0)[0], c.soft, 1.2, null, 1500);
      f.fn((x) => { const [r, i] = psi(x, t, s0, k0); return r * r + i * i; }, c.main, 2.4, null, 800);
      f.path([[xc, 0], [xc, 1.05 * Math.exp(0) / Math.sqrt(2 * Math.PI) / st]], c.acc, 2, [4, 3]);
      f.dot(k0 * t, 0, c.warn, 5);
      const dp = 1 / (2 * s0);
      S.out(`t = ${t}: 기대값 ⟨x⟩ = ${xc.toFixed(3)} (고전 입자 x = p₀t/m = ${(k0 * t).toFixed(3)}, 빨간 점)\n폭 Δx = ${st.toFixed(3)} (처음 ${s0.toFixed(3)}), Δp = ${dp.toFixed(3)} (시간에 따라 일정)\nΔx·Δp = ${(st * dp).toFixed(3)} (≥ 0.5, t = 0에서만 0.5)\n회색 점선: t = 0의 |Ψ|², 옅은 선: Re Ψ (파장 2π/k₀ = ${k0 > 0 ? (2 * Math.PI / k0).toFixed(3) : "∞"})`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 조화 진동자 고유함수와 고전 확률 (02-04). ξ = x/√(ħ/mω) */
  (() => {
    const S = QSim.card("lab-p8-ladder"); if (!S) return;
    const cv = S.$("canvas");
    function psi(n, x) {   // 정규화된 Hermite 함수, 점화식
      let p0 = Math.pow(Math.PI, -0.25) * Math.exp(-x * x / 2); if (n === 0) return p0;
      let p1 = Math.SQRT2 * x * p0;
      for (let k = 2; k <= n; k++) { const p2 = Math.sqrt(2 / k) * x * p1 - Math.sqrt((k - 1) / k) * p0; p0 = p1; p1 = p2; }
      return p1;
    }
    function draw() {
      const c = C(), n = S.val("n"), A = Math.sqrt(2 * n + 1), L = Math.max(4, A + 2.5);
      const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: -L, x1: L, y0: -0.8, y1: 0.8, xl: "ξ", yl: "" }); f.axes();
      f.path([[-A, -0.8], [-A, 0.8]], c.ink3, 1, [3, 4]); f.path([[A, -0.8], [A, 0.8]], c.ink3, 1, [3, 4]);
      f.fn((x) => Math.abs(x) < A * 0.999 ? 1 / (Math.PI * Math.sqrt(A * A - x * x)) : NaN, c.acc, 1.8, [6, 4], 800);
      f.fn((x) => psi(n, x), c.soft, 1.3, null, 800);
      f.fn((x) => psi(n, x) ** 2, c.main, 2.4, null, 800);
      let out = 0, nodes = 0, prev = psi(n, -L), h = 0.002;   // 고전 금지 영역 확률, 마디 수
      for (let x = -L - 6; x < L + 6; x += h) { const p = psi(n, x); if (Math.abs(x) > A) out += p * p * h; }
      for (let x = -L + h; x <= L; x += h) { const p = psi(n, x); if (p * prev < 0) nodes++; prev = p; }
      S.out(`n = ${n}: 에너지 E = (n + ½)ħω = ${(n + 0.5).toFixed(1)} ħω, 고전 되돌이점 ξ = ±${A.toFixed(3)} (세로 점선)\n마디 수 ${nodes}, 고전적으로 금지된 |ξ| > ${A.toFixed(2)}에서 찾을 확률 ${(out * 100).toFixed(1)}%\n파랑: |ψₙ|², 옅은 선: ψₙ, 주황 점선: 고전 진동자의 확률 밀도 1/(π√(2n+1−ξ²))`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 무한 우물 세 상태의 겹침과 측정 (03-02) */
  (() => {
    const S = QSim.card("lab-p8-measure"); if (!S) return;
    const [cv1, cv2] = S.$$("canvas");
    let counts = [0, 0, 0], collapsed = 0;
    const probs = () => { const a = [S.val("c1"), S.val("c2"), S.val("c3")].map((x) => x * x), s = a[0] + a[1] + a[2]; return s > 0 ? a.map((x) => x / s) : [1, 0, 0]; };
    function measure(k) { const p = probs(); for (let i = 0; i < k; i++) { const r = Math.random(); const n = r < p[0] ? 0 : r < p[0] + p[1] ? 1 : 2; counts[n]++; collapsed = n + 1; } draw(); }
    function draw() {
      const c = C(), p = probs(), amp = p.map(Math.sqrt);
      const v = QSim.view(cv1, 0.42), f = QSim.frame(v, { x0: 0, x1: 1, y0: 0, y1: 4.2, xl: "x/L", yl: "|ψ|²" }); f.axes();
      const ph = (x) => collapsed ? 2 * Math.sin(collapsed * Math.PI * x) ** 2 : NaN;
      f.fn((x) => { const s = amp.reduce((a, A, i) => a + A * Math.SQRT2 * Math.sin((i + 1) * Math.PI * x), 0); return s * s; }, c.main, 2.4);
      f.fn(ph, c.acc, 2, [6, 4]);
      const v2 = QSim.view(cv2, 0.36), g = QSim.frame(v2, { x0: 0.4, x1: 3.6, y0: 0, y1: 1.05, xl: "n", yl: "확률" }); g.axes({ noGrid: true });
      const N = counts[0] + counts[1] + counts[2];
      for (let i = 0; i < 3; i++) {
        const x = i + 1; g.path([[x - 0.15, 0], [x - 0.15, p[i]]], c.main, 16);
        if (N) g.path([[x + 0.15, 0], [x + 0.15, counts[i] / N]], c.acc, 16);
        g.text(`n=${x}`, x - 0.1, -0.0, c.ink2);
      }
      const E = p[0] + 4 * p[1] + 9 * p[2], E2 = p[0] + 16 * p[1] + 81 * p[2];
      S.out(`확률 |c₁|², |c₂|², |c₃|² = ${p.map((x) => x.toFixed(3)).join(", ")} (파란 막대)\n⟨E⟩ = ${E.toFixed(3)} E₁, ΔE = ${Math.sqrt(Math.max(0, E2 - E * E)).toFixed(3)} E₁\n측정 ${N}번: 결과 비율 ${N ? counts.map((x) => (x / N).toFixed(3)).join(", ") : "-"} (주황 막대)${collapsed ? `\n마지막 측정 결과 n = ${collapsed}, 에너지 ${collapsed * collapsed} E₁: 측정 직후 상태는 ψ${collapsed} (주황 점선)` : ""}`);
    }
    S.$(".m1").addEventListener("click", () => measure(1));
    S.$(".m100").addEventListener("click", () => measure(100));
    S.$(".reset").addEventListener("click", () => { counts = [0, 0, 0]; collapsed = 0; draw(); });
    S.on(() => { counts = [0, 0, 0]; collapsed = 0; draw(); }); QSim.redrawOn(draw); draw();
  })();
})();
