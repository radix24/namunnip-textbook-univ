/* 수학10 탐구: 아이젠슈타인 격자점 — 직사각형 (p−1)/2 × (q−1)/2 를 대각선 y = (q/p)x 위·아래로 나누어 세기 */
(() => {
  "use strict";
  const S = MKit.setup("card-m10-lattice", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  const PR = [3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43];
  const pw = (a, e, n) => { let r = 1, b = a % n; while (e > 0) { if (e & 1) r = (r * b) % n; b = (b * b) % n; e >>= 1; } return r; };
  const leg = (a, p) => (pw(a, (p - 1) / 2, p) === 1 ? 1 : -1);
  function draw() {
    const c = QSim.col(), p = PR[k.val("p")], q = PR[k.val("q")], m = (p - 1) / 2, n = (q - 1) / 2;
    if (p === q) { k.out("서로 다른 두 소수를 고르세요"); return; }
    const F = QSim.frame(v, { x0: 0, x1: p / 2 + 0.5, y0: 0, y1: q / 2 + 0.5, pad: 26, xl: "x", yl: "y" });
    F.axes({ noGrid: true });
    F.path([[0, 0], [p / 2, 0], [p / 2, q / 2], [0, q / 2], [0, 0]], c.ink3, 1, [4, 3]);
    F.path([[0, 0], [p / 2, q / 2]], c.ink, 1.5);
    let below = 0, above = 0;
    for (let x = 1; x <= m; x++) for (let y = 1; y <= n; y++) { const b = y * p < q * x; if (b) below++; else above++; F.dot(x, y, b ? c.main : c.warn, Math.max(2, Math.min(5, 60 / Math.max(m, n)))); }
    const s1 = Array.from({ length: m }, (_, i) => Math.floor(((i + 1) * q) / p)).reduce((a, b) => a + b, 0), s2 = Array.from({ length: n }, (_, i) => Math.floor(((i + 1) * p) / q)).reduce((a, b) => a + b, 0);
    k.out(`p = ${p}, q = ${q} · 아래 ${below} = Σ⌊kq/p⌋ = ${s1} (파랑) · 위 ${above} = Σ⌊kp/q⌋ = ${s2} (빨강) · 합 ${below + above} = ${m}·${n}\n(q/p) = (−1)^${s1} = ${leg(q, p)}, (p/q) = (−1)^${s2} = ${leg(p, q)} · 곱 ${leg(q, p) * leg(p, q)} = (−1)^${m * n}`);
  }
  S.redraw();
})();
