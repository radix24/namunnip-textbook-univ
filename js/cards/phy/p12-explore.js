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
})();
