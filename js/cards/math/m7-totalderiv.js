/* 수학7 탐구: 전미분 — 오차 |f(p + h) − f(p) − Ah| / |h| 가 모든 방향에서 함께 0으로 가는가 */
(() => {
  "use strict";
  const FN = {
    smooth: { f: (x, y) => x * x * y, p: [1, 2], A: [4, 1], tex: "f = x²y, p = (1, 2), A = (4, 1)" },
    cont: { f: (x, y) => (x || y ? (x * x * y) / (x * x + y * y) : 0), p: [0, 0], A: [0, 0], tex: "f = x²y/(x² + y²), p = 0, A = (0, 0)" },
    sqrt: { f: (x, y) => Math.sqrt(Math.abs(x * y)), p: [0, 0], A: [0, 0], tex: "f = √|xy|, p = 0, A = (0, 0)" },
    disc: { f: (x, y) => (x || y ? (x * y) / (x * x + y * y) : 0), p: [0, 0], A: [0, 0], tex: "f = xy/(x² + y²), p = 0, A = (0, 0)" },
  };
  const S = MKit.setup("card-m7-totalderiv", 0.6, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  function ratio(F, t, th) {
    const [px, py] = F.p, u = t * Math.cos(th), w = t * Math.sin(th);
    return Math.abs(F.f(px + u, py + w) - F.f(px, py) - F.A[0] * u - F.A[1] * w) / t;
  }
  function draw() {
    const c = QSim.col(), F = FN[k.val("fn")], s = k.val("s"), t = Math.pow(10, -s);
    const f = QSim.frame(v, { x0: 0, x1: 2 * Math.PI, y0: 0, y1: 1.2, pad: 28, xl: "θ" });
    f.axes();
    // 큰 |h|(0.5)에서의 곡선을 옅게, 지금 |h|에서의 곡선을 진하게
    const cur = (tt) => { const pts = []; for (let i = 0; i <= 720; i++) { const th = (i / 720) * 2 * Math.PI; pts.push([th, Math.min(1.25, ratio(F, tt, th))]); } return pts; };
    f.path(cur(0.5), c.ink3, 1, [4, 4]);
    f.path(cur(t), c.warn, 2);
    let mx = 0; for (let i = 0; i < 3600; i++) mx = Math.max(mx, ratio(F, t, (i / 3600) * 2 * Math.PI));
    k.out(`${F.tex}\n|h| = ${t < 0.001 ? t.toExponential(1) : fmt(t, 4)} · 모든 방향 θ에서 오차 비율의 최댓값 = ${mx > 1e4 ? mx.toExponential(2) : fmt(mx, 4)}`
      + (mx > 1.2 ? " (그림 위로 넘침)" : ""));
  }
  S.redraw();
})();
