/* 수학7 탐구: 상합과 하합 — 분할 수를 늘리면 U − L이 0으로 가는가 (연속, 계단, 토매, 디리클레) */
(() => {
  "use strict";
  const S = MKit.setup("card-m7-darboux", 0.6, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  /* 각 함수는 구간 [p, q]에서의 sup, inf를 정확히 또는 충분히 촘촘한 표본으로 준다 */
  const FN = {
    sin: { tex: "sin(3x) + x (연속)", f: (x) => Math.sin(3 * x) + x, range: (p, q, f) => { let M = -Infinity, m = Infinity; for (let i = 0; i <= 40; i++) { const y = f(p + ((q - p) * i) / 40); M = Math.max(M, y); m = Math.min(m, y); } return [M, m]; } },
    step: { tex: "계단: x < 0.4이면 0, 아니면 1", f: (x) => (x < 0.4 ? 0 : 1), range: (p, q) => [q >= 0.4 ? 1 : 0, p < 0.4 ? 0 : 1] },
    thomae: { tex: "토매 함수 (유리수 p/q에서 1/q)", f: null, range: (p, q) => {
      // [p, q] 안의 가장 작은 분모를 가진 유리수의 1/분모가 sup, inf는 0
      for (let d = 1; d <= 400; d++) { const n0 = Math.ceil(p * d - 1e-12); if (n0 / d <= q + 1e-12) return [1 / d, 0]; }
      return [1 / 400, 0];
    } },
    dirichlet: { tex: "디리클레 (유리수 1, 무리수 0)", f: null, range: () => [1, 0] },
  };
  function draw() {
    const c = QSim.col(), g = v.g, F = FN[k.val("fn")], n = k.val("n");
    const f = QSim.frame(v, { x0: 0, x1: 1, y0: -0.2, y1: 2.1, pad: 28, xl: "x" });
    f.axes();
    let U = 0, L = 0;
    for (let i = 0; i < n; i++) {
      const p = i / n, q = (i + 1) / n, [M, m] = F.range(p, q, F.f);
      U += M / n; L += m / n;
      g.fillStyle = c.warn; g.globalAlpha = 0.18; g.fillRect(f.X(p), f.Y(M), f.X(q) - f.X(p), f.Y(m) - f.Y(M)); g.globalAlpha = 1;
      g.fillStyle = c.soft; g.globalAlpha = 0.5; g.fillRect(f.X(p), f.Y(Math.max(0, m)), f.X(q) - f.X(p), f.Y(Math.min(0, m)) - f.Y(Math.max(0, m))); g.globalAlpha = 1;
      g.strokeStyle = c.ink3; g.lineWidth = 1; g.strokeRect(f.X(p), f.Y(M), f.X(q) - f.X(p), f.Y(Math.min(0, m)) - f.Y(M));
    }
    if (F.f) f.fn(F.f, c.ink, 2, null, 600);
    else if (k.val("fn") === "thomae") { for (let d = 1; d <= 40; d++) for (let a = 0; a <= d; a++) if (gcd(a, d) === 1) f.dot(a / d, 1 / d, c.ink, 2); f.path([[0, 0], [1, 0]], c.ink, 1.5); }
    else { f.path([[0, 1], [1, 1]], c.ink, 1.5, [2, 3]); f.path([[0, 0], [1, 0]], c.ink, 1.5, [2, 3]); }
    k.out(`${F.tex}, 등분할 ${n}개\n상합 U = ${fmt(U, 5)} · 하합 L = ${fmt(L, 5)} · U − L = ${fmt(U - L, 5)}`);
  }
  S.redraw();
})();
