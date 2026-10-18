/* 수학과 선형대수 탐구 카드: 고유벡터 찾기, 최소제곱 직선, 특이값 분해 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const { fmt } = MKit;

  /* 2×2 행렬의 고유값 (실수면 [λ1, λ2], 복소면 null) */
  const eig2 = (a, b, c, d) => {
    const tr = a + d, det = a * d - b * c, disc = tr * tr - 4 * det;
    if (disc < -1e-12) return { tr, det, disc, re: tr / 2, im: Math.sqrt(-disc) / 2, real: null };
    const s = Math.sqrt(Math.max(0, disc));
    return { tr, det, disc, real: [(tr + s) / 2, (tr - s) / 2] };
  };
  const evec = (a, b, c, d, l) => {
    let v;
    if (Math.abs(b) > 1e-9) v = [b, l - a];
    else if (Math.abs(c) > 1e-9) v = [l - d, c];
    else v = Math.abs(a - l) < 1e-9 ? [1, 0] : [0, 1];
    const n = Math.hypot(v[0], v[1]); return [v[0] / n, v[1] / n];
  };

  /* ── 1. 고유벡터: 방향이 바뀌지 않는 벡터 찾기 ── */
  (() => {
    let f;
    const S = MKit.setup("card-m1-eigen", 0.8, draw);
    if (!S) return;
    const { k, v } = S;
    function draw() {
      const c = C(), g = v.g;
      const a = k.val("a"), b = k.val("b"), cc = k.val("c"), d = k.val("d"), th = (k.val("th") * Math.PI) / 180;
      f = QSim.frame(v, { x0: -3.2, x1: 3.2, y0: -3.2, y1: 3.2, equal: true, pad: 24 });
      f.axes();
      // 단위정사각형과 그 상(평행사변형)
      f.path([[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]], c.ink3, 1, [3, 3]);
      g.save(); g.fillStyle = c.soft; g.globalAlpha = 0.45; g.beginPath();
      [[0, 0], [a, cc], [a + b, cc + d], [b, d]].forEach(([x, y], i) => (i ? g.lineTo(f.X(x), f.Y(y)) : g.moveTo(f.X(x), f.Y(y))));
      g.closePath(); g.fill(); g.restore();
      const E = eig2(a, b, cc, d);
      if (E.real) E.real.forEach((l) => { const [p, q] = evec(a, b, cc, d, l); f.path([[-4 * p, -4 * q], [4 * p, 4 * q]], c.acc, 1.5, [6, 4]); });
      f.arrow(0, 0, a, cc, c.ink2, "Ae₁"); f.arrow(0, 0, b, d, c.ink2, "Ae₂");
      f.dot(a, cc, c.ink2, 6); f.dot(b, d, c.ink2, 6);
      // 시험 벡터 v와 Av
      const vx = Math.cos(th), vy = Math.sin(th), ax = a * vx + b * vy, ay = cc * vx + d * vy;
      const cross = vx * ay - vy * ax, par = Math.abs(cross) < 0.03 * Math.max(1e-9, Math.hypot(ax, ay));
      f.path(Array.from({ length: 73 }, (_, i) => [Math.cos(i * Math.PI / 36), Math.sin(i * Math.PI / 36)]), c.rule, 1);
      f.arrow(0, 0, vx, vy, c.main, "v");
      f.arrow(0, 0, ax, ay, par ? c.acc : c.warn, "Av");
      const lam = par ? (ax * vx + ay * vy) : NaN;
      const ev = E.real ? `고유값 ${fmt(E.real[0])}, ${fmt(E.real[1])}` : `고유값 ${fmt(E.re)} ± ${fmt(E.im)}i (실수 고유벡터 없음)`;
      k.out(`대각합 ${fmt(E.tr)} · 행렬식 ${fmt(E.det)} (색칠한 넓이) · ${ev}\n` +
        (par ? `Av가 v와 같은 직선 위에 있습니다: Av = ${fmt(lam)}·v` : `Av와 v 사이의 각 ${fmt(Math.abs(Math.atan2(cross, ax * vx + ay * vy)) * 180 / Math.PI, 1)}°`));
    }
    MKit.drag(S.cv, () => f, () => [[k.val("a"), k.val("c")], [k.val("b"), k.val("d")]], (i, x, y) => {
      const r = (t) => Math.round(Math.max(-3, Math.min(3, t)) * 10) / 10;
      if (i === 0) { MKit.setVal(k, "a", r(x)); MKit.setVal(k, "c", r(y)); } else { MKit.setVal(k, "b", r(x)); MKit.setVal(k, "d", r(y)); }
      S.redraw();
    });
    S.redraw();
  })();

  /* ── 2. 최소제곱 직선 ── */
  (() => {
    let f;
    const P = [[-2.4, -1.2], [-1.5, -0.2], [-0.6, -0.6], [0.4, 0.9], [1.3, 0.6], [2.3, 1.9]];
    const S = MKit.setup("card-m1-leastsq", 0.7, draw);
    if (!S) return;
    const { k, v } = S;
    const best = () => {
      const n = P.length, sx = P.reduce((s, p) => s + p[0], 0), sy = P.reduce((s, p) => s + p[1], 0);
      const sxx = P.reduce((s, p) => s + p[0] * p[0], 0), sxy = P.reduce((s, p) => s + p[0] * p[1], 0);
      const D = n * sxx - sx * sx;
      if (Math.abs(D) < 1e-12) return null;
      const m = (n * sxy - sx * sy) / D; return [m, (sy - m * sx) / n];
    };
    const sse = (m, b) => P.reduce((s, [x, y]) => s + (y - m * x - b) ** 2, 0);
    function draw() {
      const c = C(), g = v.g;
      f = QSim.frame(v, { x0: -3, x1: 3, y0: -2.5, y1: 2.5, equal: true, pad: 24, xl: "x", yl: "y" });
      f.axes();
      const m = k.val("m"), b = k.val("b"), B = best();
      // 내 직선의 잔차(세로 선분)와 그 제곱(정사각형)
      P.forEach(([x, y]) => {
        const yh = m * x + b, r = y - yh;
        g.save(); g.fillStyle = c.warn; g.globalAlpha = 0.12;
        const s = Math.abs(r) * f.sx; g.fillRect(f.X(x), Math.min(f.Y(y), f.Y(yh)), s, s); g.restore();
        f.path([[x, y], [x, yh]], c.warn, 1.5);
      });
      f.fn((x) => m * x + b, c.warn, 2);
      if (B && k.val("show")) f.fn((x) => B[0] * x + B[1], c.main, 2, [6, 4]);
      P.forEach(([x, y]) => f.dot(x, y, c.ink, 6));
      const e1 = sse(m, b), e0 = B ? sse(B[0], B[1]) : NaN;
      k.out(`내 직선 y = ${fmt(m, 2)}x + ${fmt(b, 2)} · 잔차 제곱합 ${fmt(e1)}\n` +
        (B ? `최소제곱 직선 y = ${fmt(B[0])}x + ${fmt(B[1])} · 잔차 제곱합 ${fmt(e0)} (내 직선과의 차 ${fmt(e1 - e0)})` : "점들의 x좌표가 모두 같아 직선이 하나로 정해지지 않습니다"));
    }
    MKit.drag(S.cv, () => f, () => P, (i, x, y) => { P[i] = [x, y]; S.redraw(); });
    k.$(".fit").addEventListener("click", () => { const B = best(); if (B) { MKit.setVal(k, "m", Math.round(B[0] * 100) / 100); MKit.setVal(k, "b", Math.round(B[1] * 100) / 100); S.redraw(); } });
    S.redraw();
  })();

  /* ── 3. 특이값 분해: 원이 타원으로 ── */
  (() => {
    const S = MKit.setup("card-m8-svd", 0.5, draw);
    if (!S) return;
    const { k, v } = S;
    const svd = (a, b, c, d) => {
      // AᵀA = [[p, q], [q, r]]의 고유값이 σ²
      const p = a * a + c * c, q = a * b + c * d, r = b * b + d * d;
      const m = (p + r) / 2, h = Math.hypot((p - r) / 2, q);
      const s1 = Math.sqrt(m + h), s2 = Math.sqrt(Math.max(0, m - h));
      let v1 = Math.abs(q) > 1e-12 ? [q, m + h - p] : (p >= r ? [1, 0] : [0, 1]);
      const n = Math.hypot(v1[0], v1[1]); v1 = [v1[0] / n, v1[1] / n];
      const v2 = [-v1[1], v1[0]];
      return { s1, s2, v1, v2 };
    };
    function draw() {
      const c = C(), g = v.g;
      const a = k.val("a"), b = k.val("b"), cc = k.val("c"), d = k.val("d");
      const A = ([x, y]) => [a * x + b * y, cc * x + d * y];
      const { s1, s2, v1, v2 } = svd(a, b, cc, d);
      const W = v.W, half = W / 2;
      const draw1 = (off, title, pts, arrows) => {
        g.save(); g.translate(off, 0);
        const vv = { g, W: half, H: v.H };
        const f = QSim.frame(vv, { x0: -3, x1: 3, y0: -3, y1: 3, equal: true, pad: 16 });
        f.axes({ noGrid: true });
        f.path(pts, c.main, 2);
        arrows.forEach(([p, col, lab]) => f.arrow(0, 0, p[0], p[1], col, lab));
        g.fillStyle = c.ink2; g.font = "12px sans-serif"; g.fillText(title, 20, 14);
        g.restore();
      };
      const circ = Array.from({ length: 121 }, (_, i) => [Math.cos(i * Math.PI / 60), Math.sin(i * Math.PI / 60)]);
      draw1(0, "단위원과 v₁, v₂", circ, [[v1, c.acc, "v₁"], [v2, c.warn, "v₂"]]);
      draw1(half, "A를 곱한 뒤: 타원", circ.map(A), [[A(v1), c.acc, "σ₁u₁"], [A(v2), c.warn, "σ₂u₂"]]);
      g.strokeStyle = c.rule; g.beginPath(); g.moveTo(half, 6); g.lineTo(half, v.H - 6); g.stroke();
      k.out(`σ₁ = ${fmt(s1)} (가장 긴 반지름) · σ₂ = ${fmt(s2)} (가장 짧은 반지름) · σ₁σ₂ = ${fmt(s1 * s2)} = |det A| = ${fmt(Math.abs(a * d - b * cc))}\n` +
        `v₁ = (${fmt(v1[0])}, ${fmt(v1[1])}) · 계수 1 근사 σ₁u₁v₁ᵀ의 오차(작용소 노름) = σ₂ = ${fmt(s2)}`);
    }
    S.redraw();
  })();
})();
