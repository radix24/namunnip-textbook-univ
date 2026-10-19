/* 수학8 탐구: 이차형식 q = ax² + 2bxy + cy² — 부호 지도, q = ±1 곡선, 주소행렬식·숄레스키·고유값 판정 */
(() => {
  "use strict";
  const S = MKit.setup("card-m8-posdef", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  function draw() {
    const c = QSim.col(), a = k.val("a"), b = k.val("b"), cc = k.val("c"), g = v.g;
    const F = QSim.frame(v, { x0: -3, x1: 3, y0: -1.6, y1: 1.6, pad: 20, xl: "x", yl: "y" });
    const nx = 120, ny = 64, dx = 6 / nx, dy = 3.2 / ny;
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
      const x = -3 + (i + 0.5) * dx, y = -1.6 + (j + 0.5) * dy, q = a * x * x + 2 * b * x * y + cc * y * y;
      const t = Math.min(1, Math.abs(q) / 4) * 0.55;
      g.globalAlpha = t; g.fillStyle = q >= 0 ? c.main : c.warn;
      g.fillRect(F.X(x - dx / 2), F.Y(y + dy / 2), F.X(x + dx / 2) - F.X(x - dx / 2) + 0.5, F.Y(y - dy / 2) - F.Y(y + dy / 2) + 0.5);
    }
    g.globalAlpha = 1;
    F.axes({ noGrid: true });
    const tr = a + cc, disc = Math.sqrt(((a - cc) / 2) ** 2 + b * b), l1 = tr / 2 + disc, l2 = tr / 2 - disc;
    let q1 = Math.abs(b) > 1e-12 ? [b, l1 - a] : a >= cc ? [1, 0] : [0, 1];
    const r = Math.hypot(q1[0], q1[1]); q1 = [q1[0] / r, q1[1] / r]; const q2 = [-q1[1], q1[0]];
    const pt = (u, w) => [u * q1[0] + w * q2[0], u * q1[1] + w * q2[1]];
    [1, -1].forEach((L) => {
      // λ1 u² + λ2 w² = L 를 매개화
      const s1 = Math.sign(l1 * L), s2 = Math.sign(l2 * L), A1 = Math.sqrt(Math.abs(L / (l1 || 1e-12))), A2 = Math.sqrt(Math.abs(L / (l2 || 1e-12)));
      const col = L > 0 ? c.main : c.warn;
      if (s1 > 0 && s2 > 0) { const P = []; for (let i = 0; i <= 160; i++) { const t = (2 * Math.PI * i) / 160; P.push(pt(A1 * Math.cos(t), A2 * Math.sin(t))); } F.path(P, col, 2); }
      else if (s1 > 0 && s2 < 0) [1, -1].forEach((sg) => { const P = []; for (let i = -60; i <= 60; i++) { const t = i / 20; P.push(pt(sg * A1 * Math.cosh(t), A2 * Math.sinh(t))); } F.path(P, col, 2); });
      else if (s1 < 0 && s2 > 0) [1, -1].forEach((sg) => { const P = []; for (let i = -60; i <= 60; i++) { const t = i / 20; P.push(pt(A1 * Math.sinh(t), sg * A2 * Math.cosh(t))); } F.path(P, col, 2); });
    });
    const d1 = a, d2 = a * cc - b * b;
    let chol;
    if (a <= 0) chol = "r₁₁² = a ≤ 0에서 실패";
    else { const r11 = Math.sqrt(a), r12 = b / r11, r22s = cc - r12 * r12; chol = r22s > 0 ? `R = [[${fmt(r11, 3)}, ${fmt(r12, 3)}], [0, ${fmt(Math.sqrt(r22s), 3)}]]` : `r₂₂² = ${fmt(r22s, 3)} ≤ 0에서 실패`; }
    const kind = l2 > 1e-9 ? "양정치 (그릇)" : l1 < -1e-9 ? "음정치 (뒤집힌 그릇)" : l1 > 1e-9 && l2 < -1e-9 ? "부정치 (안장)" : "준정치 (골짜기, 고유값 0 있음)";
    const term = (x, t, first) => (Math.abs(x) < 1e-12 ? "" : (x < 0 ? (first ? "−" : " − ") : first ? "" : " + ") + (Math.abs(Math.abs(x) - 1) < 1e-12 ? "" : fmt(Math.abs(x), 2)) + t);
    const qs = (term(a, "x²", true) + term(2 * b, "xy", !a) + term(cc, "y²", !a && !b)).trim() || "0";
    k.out(`q = ${qs} · ${kind}\n주소행렬식 ${fmt(d1, 3)}, ${fmt(d2, 3)} · 고유값 ${fmt(l1, 3)}, ${fmt(l2, 3)} · 숄레스키 ${chol}`);
  }
  S.redraw();
})();
