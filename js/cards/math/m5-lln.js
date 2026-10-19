/* 수학5 탐구: 대수의 법칙 — 표본평균 경로 20개, ε 띠, 체비쇼프 한계, 코시분포의 실패 */
(() => {
  "use strict";
  const S = MKit.setup("card-m5-lln", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const D = {
    die: { name: "주사위", mu: 3.5, v: 35 / 12, r: 1.6, gen: (u) => 1 + Math.floor(u() * 6) },
    coin: { name: "동전(앞면 1)", mu: 0.5, v: 0.25, r: 0.5, gen: (u) => (u() < 0.5 ? 1 : 0) },
    exp: { name: "Exp(1)", mu: 1, v: 1, r: 1, gen: (u) => -Math.log(u()) },
    cauchy: { name: "코시(중앙값 0)", mu: 0, v: Infinity, r: 3, gen: (u) => Math.tan(Math.PI * (u() - 0.5)) },
  };
  function draw() {
    const c = QSim.col(), d = D[k.val("d")], N = k.val("n"), eps = k.val("e");
    let s = 4242; const u = () => { s = (s + 0x6d2b79f5) | 0; let r = Math.imul(s ^ (s >>> 15), 1 | s); r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r; return (((r ^ (r >>> 14)) >>> 0) + 0.5) / 4294967296; };
    const F = QSim.frame(v, { x0: 0, x1: Math.log10(N), y0: d.mu - d.r, y1: d.mu + d.r, pad: 30, xl: "log₁₀ n", yl: "표본평균" });
    F.axes();
    const g = v.g; g.fillStyle = c.soft; g.fillRect(F.X(0), F.Y(d.mu + eps), F.X(Math.log10(N)) - F.X(0), F.Y(d.mu - eps) - F.Y(d.mu + eps));
    F.path([[0, d.mu], [Math.log10(N), d.mu]], c.ink3, 1, [4, 4]);
    let out = 0;
    for (let p = 0; p < 20; p++) {
      let sum = 0; const pts = [];
      for (let i = 1; i <= N; i++) { sum += d.gen(u); if (i < 50 || i % Math.max(1, Math.floor(N / 400)) === 0 || i === N) pts.push([Math.log10(i), Math.max(d.mu - d.r, Math.min(d.mu + d.r, sum / i))]); }
      if (Math.abs(sum / N - d.mu) >= eps) out++;
      F.path(pts, p === 0 ? c.warn : c.main, p === 0 ? 1.8 : 1);
    }
    const cheb = isFinite(d.v) ? `체비쇼프 한계 σ²/(nε²) = ${fmt(Math.min(1, d.v / (N * eps * eps)), 4)}` : "분산(평균)이 없어 체비쇼프를 쓸 수 없음";
    k.out(`${d.name} · n = ${N}, ε = ${fmt(eps, 2)} · n번째에서 띠 밖에 있는 경로 ${out}/20\n${cheb}`);
  }
  S.redraw();
})();
