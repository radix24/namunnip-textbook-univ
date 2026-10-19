/* 수학5 탐구: 균등 난수를 변환한 히스토그램과 공식의 밀도 */
(() => {
  "use strict";
  const S = MKit.setup("card-m5-transform", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const G = {
    sq: { name: "Y = U²", lo: 0, hi: 1, ymax: 4, gen: (u) => u() ** 2, f: (y) => 1 / (2 * Math.sqrt(y)), ev: (y) => y <= 0.25, evn: "P(Y ≤ 0.25)", ex: 0.5 },
    sqrt: { name: "Y = √U", lo: 0, hi: 1, ymax: 2.3, gen: (u) => Math.sqrt(u()), f: (y) => 2 * y, ev: (y) => y <= 0.5, evn: "P(Y ≤ 0.5)", ex: 0.25 },
    exp: { name: "Y = −ln U (Exp(1))", lo: 0, hi: 5, ymax: 1.15, gen: (u) => -Math.log(u()), f: (y) => Math.exp(-y), ev: (y) => y <= 1, evn: "P(Y ≤ 1)", ex: 1 - Math.exp(-1) },
    chi: { name: "Y = Z² (Z는 박스-뮬러 정규)", lo: 0, hi: 4, ymax: 2, gen: (u) => { const z = Math.sqrt(-2 * Math.log(u())) * Math.cos(2 * Math.PI * u()); return z * z; }, f: (y) => Math.exp(-y / 2) / Math.sqrt(2 * Math.PI * y), ev: (y) => y <= 1, evn: "P(Y ≤ 1)", ex: 0.6827 },
    cauchy: { name: "Y = tan(π(U − ½)) (코시)", lo: -5, hi: 5, ymax: 0.4, gen: (u) => Math.tan(Math.PI * (u() - 0.5)), f: (y) => 1 / (Math.PI * (1 + y * y)), ev: (y) => Math.abs(y) <= 1, evn: "P(|Y| ≤ 1)", ex: 0.5 },
  };
  function draw() {
    const c = QSim.col(), t = G[k.val("g")], N = k.val("N"), B = k.val("b");
    let s = 20261019; const u = () => { s = (s + 0x6d2b79f5) | 0; let r = Math.imul(s ^ (s >>> 15), 1 | s); r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r; return (((r ^ (r >>> 14)) >>> 0) + 0.5) / 4294967296; };
    const cnt = new Array(B).fill(0), bw = (t.hi - t.lo) / B; let hit = 0;
    for (let i = 0; i < N; i++) { const y = t.gen(u); if (t.ev(y)) hit++; const j = Math.floor((y - t.lo) / bw); if (j >= 0 && j < B) cnt[j]++; }
    const F = QSim.frame(v, { x0: t.lo, x1: t.hi, y0: 0, y1: t.ymax, pad: 30, xl: "y", yl: "밀도" });
    F.axes();
    const g = v.g; g.fillStyle = c.soft; g.strokeStyle = c.main; g.lineWidth = 1;
    cnt.forEach((m, j) => { const h = Math.min(t.ymax, m / (N * bw)), X0 = F.X(t.lo + j * bw), X1 = F.X(t.lo + (j + 1) * bw); g.fillRect(X0, F.Y(h), X1 - X0, F.Y(0) - F.Y(h)); g.strokeRect(X0, F.Y(h), X1 - X0, F.Y(0) - F.Y(h)); });
    F.fn((y) => Math.min(t.ymax, t.f(y)), c.warn, 2.2);
    k.out(`${t.name} · 표본 ${N}개, 막대 ${B}개 · 빨간 곡선은 변환 공식으로 구한 밀도\n${t.evn}: 표본 비율 ${fmt(hit / N, 4)}, 공식 ${fmt(t.ex, 4)}`);
  }
  S.redraw();
})();
