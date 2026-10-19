/* 수학10 탐구: ax + by = n 의 음이 아닌 해 — 직선 위 격자점, 만들 수 있는 금액, 프로베니우스 수 */
(() => {
  "use strict";
  const S = MKit.setup("card-m10-coin", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const gcd = (x, y) => { while (y) [x, y] = [y, x % y]; return x; };
  function draw() {
    const c = QSim.col(), a = k.val("a"), b = k.val("b"), n = k.val("n"), g = v.g, W = v.W, H = v.H, d = gcd(a, b);
    const sols = []; for (let x = 0; x * a <= n; x++) if ((n - a * x) % b === 0) sols.push([x, (n - a * x) / b]);
    const L = QSim.frame({ g, W: W * 0.5, H }, { x0: -0.5, x1: n / a + 1, y0: -0.5, y1: n / b + 1, pad: 24, xl: "x", yl: "y" });
    L.axes({ noGrid: true });
    L.path([[0, n / b], [n / a, 0]], c.main, 1.5);
    sols.forEach(([x, y]) => L.dot(x, y, c.warn, 5));
    // 오른쪽: 0..N 금액 띠
    g.save(); g.translate(W * 0.52, 0);
    const N = Math.min(80, Math.max(30, a * b + 5)), cols = 10, cw = (W * 0.46) / cols, ch = Math.min(18, (H - 30) / Math.ceil((N + 1) / cols));
    const ok = new Array(N + 1).fill(false); ok[0] = true; for (let m = 1; m <= N; m++) ok[m] = (m >= a && ok[m - a]) || (m >= b && ok[m - b]);
    g.font = "10px monospace"; g.textAlign = "center"; g.textBaseline = "middle";
    for (let m = 0; m <= N; m++) { const X = (m % cols) * cw, Y = 14 + Math.floor(m / cols) * ch; g.fillStyle = ok[m] ? c.soft : c.warn; g.globalAlpha = ok[m] ? 1 : 0.5; g.fillRect(X + 1, Y, cw - 2, ch - 2); g.globalAlpha = 1; g.fillStyle = c.ink; g.fillText(String(m), X + cw / 2, Y + ch / 2 - 1); }
    g.restore();
    const frob = d === 1 ? a * b - a - b : null, miss = []; for (let m = 1; m <= N; m++) if (!ok[m]) miss.push(m);
    k.out(`${a}x + ${b}y = ${n}: gcd = ${d}${n % d ? "이 n을 나누지 않아 해 없음" : ""} · 음이 아닌 해 ${sols.length}개 ${sols.map(([x, y]) => `(${x}, ${y})`).join(" ")}\n${frob !== null ? `만들 수 없는 금액(빨강) ${miss.length}개, 가장 큰 것 ${Math.max(0, ...miss)} = ab − a − b = ${frob}` : `gcd > 1이라 ${d}의 배수만 만들 수 있음`}`);
  }
  S.redraw();
})();
