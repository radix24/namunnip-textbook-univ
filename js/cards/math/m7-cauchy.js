/* 수학7 탐구: 코시 조건 — N 이후의 항들이 모두 좁은 띠 안에 모이는가 (Σ1/k² 와 Σ1/k 비교) */
(() => {
  "use strict";
  const S = MKit.setup("card-m7-cauchy", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const SER = {
    sq: { a: (j) => 1 / (j * j), tex: "sₙ = Σ 1/k²" },
    harm: { a: (j) => 1 / j, tex: "sₙ = Σ 1/k" },
    alt: { a: (j) => (j % 2 ? 1 : -1) / j, tex: "sₙ = Σ (−1)^(k+1)/k" },
    geo: { a: (j) => Math.pow(0.8, j), tex: "sₙ = Σ 0.8^k" },
  };
  function draw() {
    const c = QSim.col(), g = v.g, Sr = SER[k.val("ser")], N = k.val("N"), M = 4 * N;
    const s = [0]; for (let j = 1; j <= Math.max(M, 400); j++) s.push(s[j - 1] + Sr.a(j));
    const shown = Math.max(M, 60);
    let lo = Infinity, hi = -Infinity; for (let j = 1; j <= shown; j++) { lo = Math.min(lo, s[j]); hi = Math.max(hi, s[j]); }
    const pad = (hi - lo) * 0.08 + 0.02;
    const f = QSim.frame(v, { x0: 0, x1: shown + 1, y0: lo - pad, y1: hi + pad, pad: 32, xl: "n" });
    f.axes();
    let tlo = Infinity, thi = -Infinity; for (let j = N; j <= M; j++) { tlo = Math.min(tlo, s[j]); thi = Math.max(thi, s[j]); }
    g.save(); g.fillStyle = c.acc; g.globalAlpha = 0.22; g.fillRect(f.X(N), f.Y(thi), f.X(M) - f.X(N), Math.max(2, f.Y(tlo) - f.Y(thi))); g.restore();
    f.path([[N, lo - pad], [N, hi + pad]], c.ink3, 1, [4, 3]);
    const r = shown > 200 ? 1.6 : 2.6;
    for (let j = 1; j <= shown; j++) f.dot(j, s[j], j >= N && j <= M ? c.main : c.ink3, r);
    k.out(`${Sr.tex} · N = ${N}부터 4N = ${M}까지 항들의 폭(가장 큰 것 − 가장 작은 것) = ${fmt(thi - tlo, 5)}\n` +
      `N을 2배로 하면 이 폭이 ${k.val("ser") === "harm" ? "줄지 않습니다(약 ln 4 ≈ 1.386 그대로)" : "줄어듭니다"}`);
  }
  S.redraw();
})();
