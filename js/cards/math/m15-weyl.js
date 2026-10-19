/* 수학15 탐구: ⟨nγ⟩의 분포 — 무리수면 칸마다 고르게, 유리수면 몇 칸에만 */
(() => {
  "use strict";
  const S = MKit.setup("card-m15-weyl", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const G = { s2: ["√2", Math.SQRT2], gold: ["황금비 (1 + √5)/2", (1 + Math.sqrt(5)) / 2], pi: ["π", Math.PI], r: ["유리수 3/7", 3 / 7] };
  function draw() {
    const c = QSim.col(), [nm, g] = G[k.val("g")], N = k.val("N"), B = k.val("b");
    const cnt = new Array(B).fill(0);
    let re = 0, im = 0;
    for (let n = 1; n <= N; n++) {
      const x = n * g - Math.floor(n * g);
      cnt[Math.min(B - 1, Math.floor(x * B))]++;
      re += Math.cos(2 * Math.PI * x); im += Math.sin(2 * Math.PI * x);
    }
    const F = QSim.frame(v, { x0: 0, x1: 1, y0: 0, y1: 2.6, pad: 26, xl: "⟨nγ⟩", yl: "칸 비율 ÷ 칸 너비" });
    F.axes({ noGrid: true });
    for (let i = 0; i < B; i++) { const h = (cnt[i] / N) * B; F.path([[i / B, 0], [i / B, h], [(i + 1) / B, h], [(i + 1) / B, 0]], c.main, 1.4); }
    F.path([[0, 1], [1, 1]], c.acc, 1.4, [5, 4]);
    let dev = 0; for (let i = 0; i < B; i++) dev = Math.max(dev, Math.abs(cnt[i] / N - 1 / B));
    k.out(`γ = ${nm}, N = ${N}, 칸 ${B}개 · 칸별 비율과 1/${B}의 최대 차이 ${fmt(dev, 5)}\n바일 합 |1/N Σ e^(2πi nγ)| = ${fmt(Math.hypot(re, im) / N, 5)} (등분포면 N → ∞에서 0)`);
  }
  S.redraw();
})();
