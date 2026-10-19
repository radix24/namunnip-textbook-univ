/* 수학10 탐구: 점 (−1, 0)에서 기울기 n/m의 직선 — 단위원의 유리점과 피타고라스 세 수 */
(() => {
  "use strict";
  const S = MKit.setup("card-m10-ratcircle", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const gcd = (x, y) => { while (y) [x, y] = [y, x % y]; return x; };
  function draw() {
    const c = QSim.col(), m = k.val("m"), n = Math.min(k.val("n"), m - 1), g = v.g, W = v.W, H = v.H;
    const ns = k.$('[name="n"]'); if (+ns.max !== m - 1) { ns.max = m - 1; MKit.setVal(k, "n", Math.min(+ns.value, m - 1)); }
    const t = n / m, X = (1 - t * t) / (1 + t * t), Y = (2 * t) / (1 + t * t);
    const L = QSim.frame({ g, W: W * 0.5, H }, { x0: -1.3, x1: 1.3, y0: -1.3, y1: 1.3, pad: 16 });
    L.axes({ noGrid: true });
    const circ = []; for (let i = 0; i <= 120; i++) circ.push([Math.cos((2 * Math.PI * i) / 120), Math.sin((2 * Math.PI * i) / 120)]);
    L.path(circ, c.ink3, 1.2);
    L.path([[-1.3, t * -0.3], [1.3, t * 2.3]], c.acc, 1.4);
    L.dot(-1, 0, c.ink, 4); L.dot(X, Y, c.warn, 6);
    // 오른쪽: 원시 세 수 산점도
    g.save(); g.translate(W * 0.52, 0);
    const R = QSim.frame({ g, W: W * 0.48, H }, { x0: 0, x1: 210, y0: 0, y1: 210, pad: 24, xl: "x", yl: "y" });
    R.axes({ noGrid: true });
    for (let p = 2; p < 15; p++) for (let q = 1; q < p; q++) if (gcd(p, q) === 1 && (p - q) % 2 === 1) { const A = p * p - q * q, B = 2 * p * q; if (A <= 210 && B <= 210) { R.dot(A, B, p === m && q === n ? c.warn : c.main, p === m && q === n ? 5 : 2.5); R.dot(B, A, c.soft, 2); } }
    g.restore();
    const A = m * m - n * n, B = 2 * m * n, C = m * m + n * n, prim = gcd(m, n) === 1 && (m - n) % 2 === 1, G = gcd(gcd(A, B), C);
    k.out(`기울기 t = ${n}/${m} → 유리점 (${A}/${C}, ${B}/${C}) ≈ (${fmt(X, 4)}, ${fmt(Y, 4)})\n세 수 (${A}, ${B}, ${C}): ${A}² + ${B}² = ${C}² · ${prim ? "원시" : `원시 아님 (공약수 ${G}, 원시는 (${A / G}, ${B / G}, ${C / G}))`}`);
  }
  S.redraw();
})();
