/* 수학14 탐구: 우리손 보조정리의 열린집합 사다리 U_r (r = k/2ⁿ)과 계단 함수 f_n → 연속함수 */
(() => {
  "use strict";
  const S = MKit.setup("card-m14-urysohn", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  // 닫힌집합 A: 원판, B: 고리 모양(오른쪽) — 사다리는 g = dA/(dA + dB)의 아래 등위집합으로 만든다
  const dA = (x, y) => Math.max(0, Math.hypot(x + 1.2, y) - 0.45);
  const dB = (x, y) => { const r = Math.hypot(x - 1.1, y - 0.1); return Math.max(0, Math.abs(r - 0.6) - 0.12); };
  const g = (x, y) => { const a = dA(x, y), b = dB(x, y); return a + b === 0 ? 0 : a / (a + b); };
  // U_r = {g < c(r)}, c(r) = 0.04 + 0.92 r  (r < s 이면 닫힘(U_r) ⊆ U_s)
  const c = (r) => 0.04 + 0.92 * r;
  function draw() {
    const col = QSim.col(), n = k.val("n"), px = k.val("x"), py = k.val("y");
    const F = QSim.frame(v, { x0: -2.6, x1: 2.6, y0: -1.3, y1: 1.3, pad: 6, equal: true });
    const G = v.g, NX = 208, NY = 104;
    const step = (x, y) => { const val = g(x, y), N = 1 << n; for (let j = 0; j <= N; j++) { const r = j / N; if (val < c(r)) return r; } return 1; };
    const cw = (F.X(2.6) - F.X(-2.6)) / NX, ch = (F.Y(-1.3) - F.Y(1.3)) / NY;
    G.save();
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const x = -2.6 + ((i + 0.5) * 5.2) / NX, y = -1.3 + ((j + 0.5) * 2.6) / NY, fv = step(x, y);
      const t = Math.round(255 * fv);
      G.fillStyle = `rgb(${60 + Math.round(0.6 * t)}, ${110 + Math.round(0.25 * t)}, ${230 - Math.round(0.6 * t)})`;
      G.globalAlpha = 0.55; G.fillRect(F.X(x) - cw / 2, F.Y(y) - ch / 2, cw + 0.6, ch + 0.6);
    }
    G.restore();
    // A와 B의 경계
    F.path(Array.from({ length: 121 }, (_, i) => [-1.2 + 0.45 * Math.cos((i / 120) * 2 * Math.PI), 0.45 * Math.sin((i / 120) * 2 * Math.PI)]), col.ink, 2);
    [0.48, 0.72].forEach((R) => F.path(Array.from({ length: 121 }, (_, i) => [1.1 + R * Math.cos((i / 120) * 2 * Math.PI), 0.1 + R * Math.sin((i / 120) * 2 * Math.PI)]), col.ink, 2));
    F.text("A", -1.25, 0.02, col.ink); F.text("B", 1.62, 0.7, col.ink);
    F.dot(px, py, col.warn, 5);
    const fn = step(px, py), finf = Math.min(1, Math.max(0, (g(px, py) - 0.04) / 0.92));
    k.out(`${n}단계: 사다리 ${n === 0 ? "U₀ ⊂ U₁" : `U₀ ⊂ U_{1/${1 << n}} ⊂ … ⊂ U₁`} (${(1 << n) + 1}개) · 점 (${fmt(px, 2)}, ${fmt(py, 2)})에서 f_${n} = inf{r : x ∈ U_r} = ${fmt(fn, 4)}\n단계를 끝없이 늘린 극한 f = ${fmt(finf, 4)} · 차이 ${fmt(Math.abs(fn - finf), 4)} (최대 1/2^${n} = ${fmt(1 / (1 << n), 4)}) · A에서 0, B에서 1`);
  }
  S.redraw();
})();
