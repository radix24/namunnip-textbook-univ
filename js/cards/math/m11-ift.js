/* 수학11 탐구: 역함수정리의 축소사상 φ_y(x) = x + A⁻¹(y − f(x)) 를 반복해 f(x) = y 풀기 (f = z²) */
(() => {
  "use strict";
  const S = MKit.setup("card-m11-ift", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const a = [1, 0.5];
  const f = (p) => [p[0] * p[0] - p[1] * p[1], 2 * p[0] * p[1]];
  const b = f(a);
  // A = f'(a) 는 복소수 2a 의 곱셈. A⁻¹ w = w / (2a)
  const A2 = [2 * a[0], 2 * a[1]], n2 = A2[0] * A2[0] + A2[1] * A2[1];
  const Ainv = (w) => [(w[0] * A2[0] + w[1] * A2[1]) / n2, (w[1] * A2[0] - w[0] * A2[1]) / n2];
  const rU = Math.sqrt(5) / 4;
  function draw() {
    const c = QSim.col(), d = k.val("d"), th = (k.val("th") * Math.PI) / 180, N = k.val("n");
    const y = [b[0] + d * Math.cos(th), b[1] + d * Math.sin(th)];
    const its = [a.slice()];
    let x = a.slice(), div = false;
    for (let i = 0; i < N; i++) { const r = f(x), s = Ainv([y[0] - r[0], y[1] - r[1]]); x = [x[0] + s[0], x[1] + s[1]]; if (!isFinite(x[0]) || Math.hypot(x[0], x[1]) > 1e3) { div = true; break; } its.push(x); }
    const W = v.W, H = v.H, g = v.g, half = W / 2;
    const L = QSim.frame({ g, W: half, H }, { x0: -0.6, x1: 2.6, y0: -0.6, y1: 1.6, pad: 20, equal: true });
    L.axes({ noGrid: true });
    const circ = (cx, cy, r) => Array.from({ length: 121 }, (_, i) => [cx + r * Math.cos((i / 120) * 2 * Math.PI), cy + r * Math.sin((i / 120) * 2 * Math.PI)]);
    const U = circ(a[0], a[1], rU);
    L.path(U, c.acc, 1.5, [5, 4]);
    L.path(its.map((p) => [Math.max(-1, Math.min(3, p[0])), Math.max(-1, Math.min(2, p[1]))]), c.main, 1.2);
    its.slice(0, 40).forEach((p, i) => { if (Math.abs(p[0]) < 3 && Math.abs(p[1]) < 2) L.dot(p[0], p[1], i ? c.main : c.warn, i ? 3 : 4.5); });
    L.text("정의역: U(점선), 반복점", -0.55, 1.5, c.ink3);
    g.save(); g.translate(half, 0);
    const R = QSim.frame({ g, W: half, H }, { x0: -1.6, x1: 3.1, y0: -0.6, y1: 2.6, pad: 20, equal: true });
    R.axes({ noGrid: true });
    R.path(U.map(f), c.acc, 1.5, [5, 4]);
    R.dot(b[0], b[1], c.warn, 4.5); R.dot(y[0], y[1], c.ink, 5);
    R.text("치역: f(U)(점선), b(빨강), 목표 y(검정)", -1.55, 2.5, c.ink3);
    g.restore();
    const fx = f(x), res = Math.hypot(fx[0] - y[0], fx[1] - y[1]), dist = Math.hypot(x[0] - a[0], x[1] - a[1]);
    const ok = isFinite(res) && res < 1e-10;
    k.out(`|y − b| = ${fmt(d, 2)} (증명이 해를 보장하는 범위: |y − b| < λ·r = (√5/2)(√5/4) = 0.625) · ${its.length - 1}번 반복\n` +
      (!div ? `x ≈ (${fmt(x[0], 5)}, ${fmt(x[1], 5)}), |f(x) − y| = ${res.toExponential(1)}, |x − a| = ${fmt(dist, 3)}${ok ? (dist < rU ? " → U 안의 해" : " → 해이지만 U 밖") : " → 아직 수렴하지 않음"}` : `${its.length}번째에 |x| > 1000: 발산`));
  }
  S.redraw();
})();
