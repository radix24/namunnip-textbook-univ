/* 수학14 탐구: 정사각형의 변을 붙여 만드는 원기둥, 뫼비우스 띠, 원환면 (클라인 병, 사영평면은 그림만) */
(() => {
  "use strict";
  const S = MKit.setup("card-m14-glue", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const M = window.M13;
  const PI = Math.PI;
  const TYPES = {
    cyl: { name: "원기둥", lr: 1, tb: 0, fin: (x, y) => [Math.cos(2 * PI * x), Math.sin(2 * PI * x), 1.6 * (y - 0.5)] },
    mob: { name: "뫼비우스 띠", lr: -1, tb: 0, fin: (x, y) => { const u = 2 * PI * x, w = 0.8 * (y - 0.5); return [(1 + w * Math.cos(u / 2)) * Math.cos(u), (1 + w * Math.cos(u / 2)) * Math.sin(u), w * Math.sin(u / 2)]; } },
    tor: { name: "원환면", lr: 1, tb: 1, fin: (x, y) => { const u = 2 * PI * x, w = 2 * PI * y; return [(1.3 + 0.5 * Math.cos(w)) * Math.cos(u), (1.3 + 0.5 * Math.cos(w)) * Math.sin(u), 0.5 * Math.sin(w)]; } },
    kle: { name: "클라인 병", lr: 1, tb: -1, fin: null },
    rp2: { name: "사영평면", lr: -1, tb: -1, fin: null },
  };
  function arrowSeg(F, a, b, col, dbl) {
    F.path([a, b], col, 3);
    const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], d = [b[0] - a[0], b[1] - a[1]], L = Math.hypot(d[0], d[1]), u = [d[0] / L, d[1] / L], n = [-u[1], u[0]];
    const tip = (o) => { const t = [m[0] + u[0] * (0.06 + o), m[1] + u[1] * (0.06 + o)]; F.path([[t[0] - u[0] * 0.07 + n[0] * 0.05, t[1] - u[1] * 0.07 + n[1] * 0.05], t, [t[0] - u[0] * 0.07 - n[0] * 0.05, t[1] - u[1] * 0.07 - n[1] * 0.05]], col, 2); };
    tip(0); if (dbl) tip(-0.08);
  }
  function draw() {
    const c = QSim.col(), T = TYPES[k.val("t")], s = k.val("s") / 100, yaw = (k.val("yaw") * PI) / 180;
    const W = v.W, H = v.H, g = v.g, half = W * 0.42;
    const L = QSim.frame({ g, W: half, H }, { x0: -0.2, x1: 1.2, y0: -0.2, y1: 1.2, pad: 10, equal: true });
    // 왼쪽·오른쪽 변 (빨강, 화살표 하나), 아래·위 변 (파랑, 화살표 둘)
    arrowSeg(L, [0, 0], [0, 1], c.warn, false);
    arrowSeg(L, T.lr === 1 ? [1, 0] : [1, 1], T.lr === 1 ? [1, 1] : [1, 0], c.warn, false);
    if (T.tb !== 0) {
      arrowSeg(L, [0, 0], [1, 0], c.main, true);
      arrowSeg(L, T.tb === 1 ? [0, 1] : [1, 1], T.tb === 1 ? [1, 1] : [0, 1], c.main, true);
    } else { L.path([[0, 0], [1, 0]], c.ink3, 1.5); L.path([[0, 1], [1, 1]], c.ink3, 1.5); }
    g.save(); g.translate(half, 0);
    const R = QSim.frame({ g, W: W - half, H }, { x0: -2.1, x1: 2.1, y0: -1.3, y1: 1.3, pad: 8, equal: true });
    if (T.fin) {
      const P = M.view(yaw, 0.5);
      const flat = (x, y) => [3.2 * (x - 0.5), 1.6 * (y - 0.5), 0];
      const X = (x, y) => { const a = flat(x, y), b = T.fin(x, y); return [a[0] + s * (b[0] - a[0]), a[1] + s * (b[1] - a[1]), a[2] + s * (b[2] - a[2])]; };
      for (let i = 0; i <= 12; i++) { const A = [], B = []; for (let j = 0; j <= 60; j++) { A.push(X(i / 12, j / 60)); B.push(X(j / 60, i / 12)); } M.path(R, P, A, c.rule, 1); M.path(R, P, B, c.rule, 1); }
      const edge = (f) => Array.from({ length: 61 }, (_, j) => f(j / 60));
      M.path(R, P, edge((t) => X(0, t)), c.warn, 2.6); M.path(R, P, edge((t) => X(1, t)), c.warn, 2.6, [5, 4]);
      if (T.tb) { M.path(R, P, edge((t) => X(t, 0)), c.main, 2.6); M.path(R, P, edge((t) => X(t, 1)), c.main, 2.6, [5, 4]); }
    } else {
      R.text(`${T.name}은 3차원 공간에 자기 교차 없이`, -2.4, 0.3, c.ink2);
      R.text("들어가지 않습니다(상공간으로만 정의).", -2.4, -0.1, c.ink2);
    }
    g.restore();
    const rule = { cyl: "(0, y) ~ (1, y)", mob: "(0, y) ~ (1, 1 − y)", tor: "(0, y) ~ (1, y), (x, 0) ~ (x, 1)", kle: "(0, y) ~ (1, y), (x, 0) ~ (1 − x, 1)", rp2: "(0, y) ~ (1, 1 − y), (x, 0) ~ (1 − x, 1)" }[k.val("t")];
    k.out(`${T.name}: ${rule} · 같은 색·같은 화살표의 변끼리 화살표 방향을 맞춰 붙인다${T.fin ? ` · 붙이는 정도 ${Math.round(s * 100)}%` : ""}`);
  }
  S.redraw();
})();
