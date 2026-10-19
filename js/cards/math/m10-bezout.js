/* 수학10 탐구: 확장 유클리드 호제법의 표와 ax + by = gcd 의 모든 정수해(격자 위의 직선) */
(() => {
  "use strict";
  const S = MKit.setup("card-m10-bezout", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  function ext(a, b) {
    const rows = [[a, 1, 0, null], [b, 0, 1, null]];
    while (rows[rows.length - 1][0] !== 0) {
      const [r0, x0, y0] = rows[rows.length - 2], [r1, x1, y1] = rows[rows.length - 1], q = Math.floor(r0 / r1);
      rows.push([r0 - q * r1, x0 - q * x1, y0 - q * y1, q]);
    }
    return rows;
  }
  function draw() {
    const c = QSim.col(), a = k.val("a"), b = k.val("b"), g = v.g, W = v.W, H = v.H;
    const rows = ext(a, b), last = rows[rows.length - 2], d = last[0], x0 = last[1], y0 = last[2];
    // 표
    g.save(); g.font = "12px monospace"; g.fillStyle = c.ink2; g.textBaseline = "top";
    g.fillText("  몫q    나머지r      x      y", 8, 6);
    rows.forEach(([r, x, y, q], i) => { g.fillStyle = i === rows.length - 2 ? c.warn : c.ink; g.fillText(`${(q === null ? "" : q).toString().padStart(4)} ${r.toString().padStart(9)} ${x.toString().padStart(6)} ${y.toString().padStart(6)}`, 8, 24 + i * 16); });
    g.restore();
    // 해의 직선
    g.save(); g.translate(W * 0.45, 0);
    const F = QSim.frame({ g, W: W * 0.55, H }, { x0: -12, x1: 12, y0: -12, y1: 12, pad: 20, xl: "x", yl: "y" });
    F.axes({ noGrid: true });
    for (let i = -12; i <= 12; i++) for (let j = -12; j <= 12; j++) F.dot(i, j, c.rule, 1.2);
    F.fn((x) => (d - a * x) / b, c.main, 1.4);
    const sx = b / d, sy = a / d;
    for (let t = -30; t <= 30; t++) { const X = x0 + sx * t, Y = y0 - sy * t; if (Math.abs(X) <= 12 && Math.abs(Y) <= 12) F.dot(X, Y, t === 0 ? c.warn : c.acc, t === 0 ? 6 : 4); }
    g.restore();
    k.out(`gcd(${a}, ${b}) = ${d} = ${a}·(${x0}) + ${b}·(${y0}) · 호제법 ${rows.length - 2}단계\n모든 정수해: x = ${x0} + ${sx}t, y = ${y0} − ${sy}t (오른쪽: 직선 ${a}x + ${b}y = ${d} 위의 격자점)`);
  }
  S.redraw();
})();
