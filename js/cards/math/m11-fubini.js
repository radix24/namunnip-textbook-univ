/* 수학11 탐구: 반복적분의 단면 — 두 순서가 같은 경우와 다른 경우(±π/4) */
(() => {
  "use strict";
  const S = MKit.setup("card-m11-fubini", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const simpson = (f, a, b, n = 200) => { if (b <= a) return 0; const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h); return (s * h) / 3; };
  const CASES = {
    nice: {
      name: "xy², y = x²과 y = √x 사이",
      // order "x": x를 고정한 단면(세로선), order "y": y를 고정한 단면(가로선)
      inner: (o, s) => (o === "x" ? simpson((y) => s * y * y, s * s, Math.sqrt(s)) : simpson((x) => x * s * s, s * s, Math.sqrt(s))),
      seg: (o, s) => (o === "x" ? [[s, s * s], [s, Math.sqrt(s)]] : [[s * s, s], [Math.sqrt(s), s]]),
      region: true, ymax: 0.14, ymin: -0.02,
    },
    bad: {
      name: "(x² − y²)/(x² + y²)², [0, 1]²",
      inner: (o, s) => (o === "x" ? 1 / (1 + s * s) : -1 / (1 + s * s)),
      seg: (o, s) => (o === "x" ? [[s, 0], [s, 1]] : [[0, s], [1, s]]),
      region: false, ymax: 1.2, ymin: -1.2,
    },
  };
  function draw() {
    const c = QSim.col(), C = CASES[k.val("f")], o = k.val("o"), s = k.val("s");
    const W = v.W, H = v.H, g = v.g, half = W / 2;
    const L = QSim.frame({ g, W: half, H }, { x0: -0.1, x1: 1.1, y0: -0.1, y1: 1.1, pad: 22, equal: true, xl: "x", yl: "y" });
    L.axes({ noGrid: true });
    if (C.region) {
      const top = [], bot = [];
      for (let i = 0; i <= 100; i++) { const x = i / 100; top.push([x, Math.sqrt(x)]); bot.push([x, x * x]); }
      L.path(top, c.ink2, 1.5); L.path(bot, c.ink2, 1.5);
    } else {
      L.path([[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]], c.ink2, 1.5);
      L.dot(0, 0, c.warn, 4);
    }
    L.path(C.seg(o, s), c.main, 3);
    g.save(); g.translate(half, 0);
    const R = QSim.frame({ g, W: half, H }, { x0: 0, x1: 1, y0: C.ymin, y1: C.ymax, pad: 26, xl: o === "x" ? "x (바깥 변수)" : "y (바깥 변수)", yl: "안쪽 적분" });
    R.axes();
    const ptsX = [], ptsY = [];
    for (let i = 1; i <= 100; i++) { const t = i / 100; ptsX.push([t, C.inner("x", t)]); ptsY.push([t, C.inner("y", t)]); }
    R.path(ptsX, o === "x" ? c.main : c.ink3, o === "x" ? 2 : 1, o === "x" ? null : [4, 4]);
    R.path(ptsY, o === "y" ? c.main : c.ink3, o === "y" ? 2 : 1, o === "y" ? null : [4, 4]);
    R.dot(s, C.inner(o, s), c.warn, 5);
    g.restore();
    const Ix = simpson((t) => C.inner("x", t), 0, 1, 200), Iy = simpson((t) => C.inner("y", t), 0, 1, 200);
    k.out(`${C.name} · ${o === "x" ? "x" : "y"} = ${fmt(s, 2)}의 단면 적분 ${fmt(C.inner(o, s), 5)}\n반복적분: dy 먼저 ${fmt(Ix, 6)}, dx 먼저 ${fmt(Iy, 6)}${C.region ? " (정확한 값 3/56 ≈ 0.053571)" : " (정확한 값 ±π/4 ≈ ±0.785398)"}`);
  }
  S.redraw();
})();
