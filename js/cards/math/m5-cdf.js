/* 수학5 탐구: 분포함수 읽기 — 구간 확률 F(b) − F(a)와 점프 높이 */
(() => {
  "use strict";
  const S = MKit.setup("card-m5-cdf", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const erf = (x) => { const s = Math.sign(x), a = Math.abs(x), t = 1 / (1 + 0.3275911 * a); return s * (1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a)); };
  const D = {
    mixed: { name: "혼합(0에서 0.3, 나머지 Exp(1))", F: (x) => (x < 0 ? 0 : 0.3 + 0.7 * (1 - Math.exp(-x))), jumps: [0] },
    die: { name: "주사위 눈", F: (x) => Math.min(6, Math.max(0, Math.floor(x))) / 6, jumps: [1, 2, 3, 4, 5, 6] },
    exp: { name: "지수분포 Exp(1)", F: (x) => (x < 0 ? 0 : 1 - Math.exp(-x)), jumps: [] },
    norm: { name: "정규분포 N(3, 1)", F: (x) => 0.5 * (1 + erf((x - 3) / Math.SQRT2)), jumps: [] },
  };
  function draw() {
    const c = QSim.col(), d = D[k.val("d")], a = k.val("a"), b = k.val("b");
    const x0 = -1, x1 = 7, F = QSim.frame(v, { x0, x1, y0: -0.05, y1: 1.08, pad: 30, xl: "x", yl: "F(x)" });
    F.axes();
    const cuts = [x0, ...d.jumps.filter((j) => j > x0 && j < x1), x1];
    for (let i = 0; i + 1 < cuts.length; i++) {
      const pts = []; const L = cuts[i], R = cuts[i + 1];
      for (let j = 0; j <= 120; j++) { const x = L + ((R - L) * j) / 120; pts.push([x, d.F(j === 120 ? R - 1e-9 : x)]); }
      F.path(pts, c.main, 2.2);
    }
    d.jumps.forEach((j) => { const lo = d.F(j - 1e-9), hi = d.F(j); F.path([[j, lo], [j, hi]], c.ink3, 1, [3, 3]); F.dot(j, hi, c.main, 4); g0(j, lo); });
    function g0(x, y) { const g = v.g; g.save(); g.strokeStyle = c.main; g.fillStyle = c.card; g.lineWidth = 1.5; g.beginPath(); g.arc(F.X(x), F.Y(y), 4, 0, 7); g.fill(); g.stroke(); g.restore(); }
    const lo = Math.min(a, b), hi = Math.max(a, b), Fa = d.F(lo), Fb = d.F(hi);
    F.path([[lo, 0], [lo, Fa]], c.acc, 1.2, [4, 3]); F.path([[hi, 0], [hi, Fb]], c.warn, 1.2, [4, 3]);
    F.path([[x0, Fa], [lo, Fa]], c.acc, 1, [2, 3]); F.path([[x0, Fb], [hi, Fb]], c.warn, 1, [2, 3]);
    F.path([[x0 + 0.15, Fa], [x0 + 0.15, Fb]], c.warn, 4);
    const jb = d.F(hi) - d.F(hi - 1e-9);
    k.out(`${d.name} · F(${fmt(lo, 2)}) = ${fmt(Fa, 4)}, F(${fmt(hi, 2)}) = ${fmt(Fb, 4)}\nP(${fmt(lo, 2)} < X ≤ ${fmt(hi, 2)}) = ${fmt(Fb - Fa, 4)} (왼쪽 굵은 막대) · P(X = ${fmt(hi, 2)}) = ${fmt(jb, 4)}`);
  }
  S.redraw();
})();
