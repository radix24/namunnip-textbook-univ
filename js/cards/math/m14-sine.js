/* 수학14 탐구: 위상수학자의 사인 곡선을 원점 근처로 확대 — 연결이지만 경로로 건널 수 없음 */
(() => {
  "use strict";
  const S = MKit.setup("card-m14-sine", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  function draw() {
    const c = QSim.col(), z = k.val("z"), w = Math.pow(10, -z), y0 = k.val("y");
    const F = QSim.frame(v, { x0: -0.08 * w, x1: w, y0: -1.25, y1: 1.25, pad: 22, xl: "x", yl: "y" });
    F.axes();
    F.path([[0, -1], [0, 1]], c.warn, 3);
    // 곡선: x를 1/x 균등 간격으로 샘플(진동을 고르게)
    const pts = [];
    const u0 = 1 / w, u1 = Math.min(u0 * 400, 1e7);
    const N = 6000;
    for (let i = 0; i <= N; i++) { const u = u0 + ((u1 - u0) * i) / N; pts.push([1 / u, Math.sin(u)]); }
    F.path(pts, c.main, 1.2);
    F.dot(0, y0, c.ink, 5);
    // 화면 안의 진동 횟수(대략): x가 [w/400, w]일 때 1/x의 범위 / 2π
    const osc = (u1 - u0) / (2 * Math.PI);
    // (0, y0) 근방 반지름 r 안에 곡선이 들어오는가
    const r = 0.05;
    const xk = 1 / (Math.asin(Math.max(-1, Math.min(1, y0))) + 2 * Math.PI * Math.ceil((1 / (r) - Math.asin(y0)) / (2 * Math.PI)));
    k.out(`확대 배율 10^${z} (가로 [0, ${w.toExponential(0)}]) · 화면 안의 진동 약 ${osc > 1e4 ? osc.toExponential(1) : fmt(osc, 0)}번 (더 작은 x에서는 무한히 계속)\n세로 선분 위의 점 (0, ${fmt(y0, 2)})에서 거리 0.05 안에 곡선의 점이 있다: 예 x ≈ ${xk.toExponential(3)}에서 sin(1/x) = ${fmt(Math.sin(1 / xk), 4)}`);
  }
  S.redraw();
})();
