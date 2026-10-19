/* 수학13 탐구: 공간곡선을 따라 움직이는 프레네 틀 (T, N, B) 와 곡률·열률 */
(() => {
  "use strict";
  const S = MKit.setup("card-m13-frenet", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const M = window.M13;
  const CURVES = {
    helix: { name: "나선 (2 cos t, 2 sin t, t)", r: (t) => [2 * Math.cos(t), 2 * Math.sin(t), t], t0: -3.5, t1: 3.5, sc: 4 },
    cubic: { name: "꼬인 삼차곡선 (t, t², t³)", r: (t) => [t, t * t, t * t * t], t0: -1.3, t1: 1.3, sc: 1.6 },
    trefoil: { name: "세잎 매듭", r: (t) => [Math.sin(t) + 2 * Math.sin(2 * t), Math.cos(t) - 2 * Math.cos(2 * t), -Math.sin(3 * t)], t0: 0, t1: 2 * Math.PI, sc: 3 },
    plane: { name: "평면곡선 (t, sin t, 0)", r: (t) => [t, Math.sin(t), 0], t0: -4, t1: 4, sc: 3.5 },
  };
  function draw() {
    const c = QSim.col(), C = CURVES[k.val("c")], s = k.val("s") / 1000, yaw = (k.val("yaw") * Math.PI) / 180;
    const t = C.t0 + s * (C.t1 - C.t0), h = 1e-3;
    const r = C.r, p = r(t);
    const d1 = M.mul(1 / (2 * h), M.sub(r(t + h), r(t - h)));
    const d2 = M.mul(1 / (h * h), M.add(M.sub(r(t + h), M.mul(2, p)), r(t - h)));
    const d3 = M.mul(1 / (2 * h * h * h), M.add(M.sub(r(t + 2 * h), M.mul(2, r(t + h))), M.sub(M.mul(2, r(t - h)), r(t - 2 * h))));
    const cr = M.cross(d1, d2), ncr = M.norm(cr), vv = M.norm(d1);
    const kap = ncr / vv ** 3, tau = ncr > 1e-9 ? M.dot(cr, d3) / (ncr * ncr) : 0;
    const T = M.unit(d1), B = ncr > 1e-9 ? M.unit(cr) : [0, 0, 0], N = M.cross(B, T);
    const P = M.view(yaw, 0.45);
    const F = QSim.frame(v, { x0: -C.sc * 1.6, x1: C.sc * 1.6, y0: -C.sc, y1: C.sc, pad: 12, equal: true });
    M.axes(F, P, C.sc * 0.5, c.rule);
    const pts = []; for (let i = 0; i <= 600; i++) pts.push(r(C.t0 + (i / 600) * (C.t1 - C.t0)));
    M.path(F, P, pts, c.ink2, 1.6);
    const L = C.sc * 0.35;
    // 접촉평면 조각
    if (ncr > 1e-9) { const q = [M.add(p, M.add(M.mul(L, T), M.mul(L, N))), M.add(p, M.sub(M.mul(L, T), M.mul(L, N))), M.sub(p, M.add(M.mul(L, T), M.mul(L, N))), M.add(p, M.sub(M.mul(L, N), M.mul(L, T)))]; M.path(F, P, [...q, q[0]], c.soft, 1, [3, 3]); }
    M.arrow(F, P, p, M.mul(L, T), c.main, "T");
    if (ncr > 1e-9) { M.arrow(F, P, p, M.mul(L, N), c.warn, "N"); M.arrow(F, P, p, M.mul(L, B), c.acc, "B"); }
    M.dotp(F, P, p, c.ink, 4);
    k.out(`${C.name}, t = ${fmt(t, 3)} · 속력 ${fmt(vv, 4)}\n곡률 κ = ${fmt(kap, 4)}, 열률 τ = ${ncr > 1e-9 ? fmt(tau, 4) : "정의 안 됨(κ = 0)"} · 틀의 회전 속도 √(κ² + τ²) = ${fmt(Math.hypot(kap, tau), 4)} (단위 호의 길이당)`);
  }
  S.redraw();
})();
