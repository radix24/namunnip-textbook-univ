/* 수학9 탐구: 신뢰구간 100개 — 참값 μ = 50을 포함하는 비율 (z·σ, t·s, 잘못된 z·s) */
(() => {
  "use strict";
  const S = MKit.setup("card-m9-coverage", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const MU = 50, SD = 10;
  function draw() {
    const c = QSim.col(), meth = k.val("m"), n = k.val("n"), lvl = k.val("c") / 100, g = v.g;
    const z = M9.quant(M9.normCdf, 1 - (1 - lvl) / 2, 0, 10), t = M9.quant((x) => M9.tCdf(x, n - 1), 1 - (1 - lvl) / 2, 0, 1000);
    const { n: rn } = M9.rng(4321 + n);
    const ints = []; let hit = 0, hitBig = 0;
    for (let r = 0; r < 2000; r++) {
      let s1 = 0; const xs = []; for (let i = 0; i < n; i++) { const x = MU + SD * rn(); xs.push(x); s1 += x; }
      const m = s1 / n, s = Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (n - 1));
      const h = meth === "z" ? (z * SD) / Math.sqrt(n) : meth === "t" ? (t * s) / Math.sqrt(n) : (z * s) / Math.sqrt(n);
      const ok = m - h <= MU && MU <= m + h; if (ok) hitBig++; if (r < 100) { ints.push([m - h, m + h, ok]); if (ok) hit++; }
    }
    const w = Math.max(...ints.map(([a, b]) => b - a)) * 0.65 + 2;
    const F = QSim.frame(v, { x0: MU - w, x1: MU + w, y0: 0, y1: 101, pad: 24, xl: "μ", yl: "" });
    F.axes({ noGrid: true });
    ints.forEach(([a, b, ok], i) => F.path([[a, i + 1], [b, i + 1]], ok ? c.main : c.warn, ok ? 1.4 : 2.4));
    F.path([[MU, 0], [MU, 101]], c.ink, 1.2, [4, 3]);
    const name = meth === "z" ? `x̄ ± z·σ/√n (σ = 10을 앎)` : meth === "t" ? `x̄ ± t·s/√n` : `x̄ ± z·s/√n (잘못: 소표본에 z)`;
    k.out(`${name} · n = ${n}, 신뢰수준 ${fmt(lvl * 100, 0)}% · 그림의 구간 100개 중 μ 포함 ${hit}개 (빨강이 놓친 구간)\n같은 방법으로 2000개: 포함 비율 ${fmt(hitBig / 2000, 4)} · z = ${fmt(z, 3)}, t = ${fmt(t, 3)}`);
  }
  S.redraw();
})();
