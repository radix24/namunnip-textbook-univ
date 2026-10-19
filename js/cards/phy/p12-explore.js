/* 물리12 탐구 카드: 두 동일 입자의 결합 확률 밀도와 교환 효과 */
(() => {
  "use strict";
  const C = () => QSim.col();

  /* 1. 무한 우물 속 두 입자: 구별 가능, 보손, 페르미온 (01-01). L = 1 */
  (() => {
    const S = QSim.card("lab-p12-exchange"); if (!S) return;
    const cv = S.$("canvas");
    const ph = (n, x) => Math.SQRT2 * Math.sin(n * Math.PI * x);
    function draw() {
      const c = C(), a = +S.val("a"), b = +S.val("b"), st = S.val("st");
      const P = (x1, x2) => {
        const d = ph(a, x1) * ph(b, x2), e = ph(b, x1) * ph(a, x2);
        if (st === "dist") return d * d;
        if (a === b) return st === "bos" ? d * d : 0;
        const s = st === "bos" ? (d + e) / Math.SQRT2 : (d - e) / Math.SQRT2; return s * s;
      };
      const N = 80; let mx = 1e-12, s2 = 0, tot = 0, near = 0;
      const G = [];
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const x1 = (i + 0.5) / N, x2 = (j + 0.5) / N, p = P(x1, x2); G.push(p); mx = Math.max(mx, p); tot += p; s2 += p * (x1 - x2) ** 2; if (Math.abs(x1 - x2) < 0.1) near += p; }
      const v = QSim.view(cv, 0.62), W = v.W, H = v.H, g = v.g, sz = Math.min(H - 40, W * 0.6), x0 = 34, y0 = 10, cs = sz / N;
      G.forEach((p, k) => { const i = Math.floor(k / N), j = k % N; g.fillStyle = `rgba(75,79,224,${(p / mx * 0.9).toFixed(3)})`; g.fillRect(x0 + i * cs, y0 + sz - (j + 1) * cs, cs + 0.5, cs + 0.5); });
      g.strokeStyle = c.ink; g.lineWidth = 1.5; g.strokeRect(x0, y0, sz, sz);
      g.strokeStyle = c.acc; g.setLineDash([5, 4]); g.beginPath(); g.moveTo(x0, y0 + sz); g.lineTo(x0 + sz, y0); g.stroke(); g.setLineDash([]);
      g.fillStyle = c.ink2; g.font = "12px sans-serif"; g.fillText("x₁ →", x0 + sz - 30, y0 + sz + 16); g.fillText("x₂", 8, y0 + 12);
      g.fillText("주황 점선: x₁ = x₂ (두 입자가 같은 자리)", x0 + sz + 14, y0 + 16);
      const lab = { dist: "구별 가능한 입자", bos: "보손 (대칭)", fer: "페르미온 (반대칭)" }[st];
      S.out(tot < 1e-9 ? `${lab}, 상태 ${a}, ${b}: 파동함수가 0입니다. 두 페르미온은 같은 상태에 있을 수 없습니다(파울리 원리).` : `${lab}, 한 입자 상태 n = ${a}, ${b}\n두 입자 거리 제곱의 기대값 ⟨(x₁ − x₂)²⟩ = ${(s2 / tot).toFixed(4)} L²\n두 입자가 0.1 L 안에 함께 있을 확률 ${(near / tot * 100).toFixed(1)}%`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 1차 섭동 전이 확률과 Fermi 황금률 (04-02). ħ = 1, 결합 |V| = 0.01 */
  (() => {
    const S = QSim.card("lab-p12-golden"); if (!S) return;
    const cv = S.$("canvas");
    const V = 0.01;
    const P = (d, t) => Math.abs(d) < 1e-9 ? V * V * t * t : V * V * (Math.sin(d * t / 2) / (d / 2)) ** 2;
    function draw() {
      const c = C(), t = S.val("t");
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: -3, x1: 3, y0: 0, y1: V * V * t * t * 1.12, xl: "어긋남 Δ = ω − ω₀", yl: "P(t)" }); f.axes();
      f.fn((d) => P(d, t), c.main, 2.4, null, 1200);
      f.fn((d) => P(d, t / 2), c.ink3, 1.2, [5, 4], 1200);
      let area = 0; const h = 0.002; for (let d = -200; d <= 200; d += h) area += P(d, t) * h;
      S.out(`시각 t = ${t} (ħ = 1, |V| = ${V})\n봉우리 높이 P(Δ = 0) = |V|²t² = ${(V * V * t * t).toExponential(3)}, 첫 0점 Δ = 2π/t = ${(2 * Math.PI / t).toFixed(3)}\n곡선 아래 넓이(모든 Δ에 대한 합) = ${area.toExponential(4)}, 이론 2π|V|²t = ${(2 * Math.PI * V * V * t).toExponential(4)}\n넓이 ÷ t = ${(area / t).toExponential(4)}: 시간에 무관한 전이율 → 황금률 (회색 점선: t/2일 때)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. Yukawa 퍼텐셜의 Born 근사 산란 (05-03). ħ = m = 1, 세기 β = 1 */
  (() => {
    const S = QSim.card("lab-p12-born"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), k = S.val("k"), mu = S.val("mu");
      const dsig = (th) => { const q2 = 4 * k * k * Math.sin(th / 2) ** 2; return (2 / (mu * mu + q2)) ** 2; };
      const lg = (x) => Math.log10(x);
      const top = lg(dsig(0)), bot = Math.min(lg(dsig(Math.PI)), top - 1) - 0.3;
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: 180, y0: bot, y1: top + 0.3, xl: "θ (도)", yl: "log₁₀ dσ/dΩ" }); f.axes();
      f.fn((d) => lg(dsig(d * Math.PI / 180)), c.main, 2.4, null, 600);
      f.fn((d) => { const s = Math.sin(d * Math.PI / 360); return d < 1 ? NaN : lg(1 / (4 * k ** 4 * s ** 4)); }, c.ink3, 1.2, [5, 4], 600);
      let tot = 0; const n = 4000; for (let i = 0; i < n; i++) { const th = Math.PI * (i + 0.5) / n; tot += dsig(th) * 2 * Math.PI * Math.sin(th) * Math.PI / n; }
      S.out(`k = ${k}, 차폐 μ = ${mu} (퍼텐셜 −e^{−μr}/r)\ndσ/dΩ: θ = 0에서 ${dsig(0).toFixed(4)}, 90°에서 ${dsig(Math.PI / 2).toFixed(4)}, 180°에서 ${dsig(Math.PI).toFixed(4)}\n전체 단면적 σ = ${tot.toFixed(4)} (이론 16π/(μ²(μ² + 4k²)) = ${(16 * Math.PI / (mu * mu * (mu * mu + 4 * k * k))).toFixed(4)})\n회색 점선: μ = 0의 Rutherford 공식 1/(4k⁴sin⁴(θ/2))`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
