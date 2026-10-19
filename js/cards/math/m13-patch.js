/* 수학13 탐구: 좌표조각의 격자, x_u, x_v, 법벡터 — 정칙성과 특이점 */
(() => {
  "use strict";
  const S = MKit.setup("card-m13-patch", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const M = window.M13;
  const PI = Math.PI;
  const SURF = {
    sph: { name: "구면 (지리 좌표)", x: (u, w) => [Math.cos(u) * Math.cos(w), Math.cos(u) * Math.sin(w), Math.sin(u)], u0: -PI / 2, u1: PI / 2, v0: -PI, v1: PI, R: 1.5, un: "위도 u", vn: "경도 v" },
    tor: { name: "원환면 R = 2, r = 0.7", x: (u, w) => [(2 + 0.7 * Math.cos(u)) * Math.cos(w), (2 + 0.7 * Math.cos(u)) * Math.sin(w), 0.7 * Math.sin(u)], u0: -PI, u1: PI, v0: -PI, v1: PI, R: 3.2, un: "u", vn: "v" },
    cone: { name: "원뿔 (u cos v, u sin v, u)", x: (u, w) => [u * Math.cos(w), u * Math.sin(w), u], u0: -1.2, u1: 1.2, v0: -PI, v1: PI, R: 1.8, un: "u", vn: "v" },
    hel: { name: "나선면 (u cos v, u sin v, v/2)", x: (u, w) => [u * Math.cos(w), u * Math.sin(w), 0.5 * w], u0: -1.2, u1: 1.2, v0: -PI, v1: PI, R: 2, un: "u", vn: "v" },
  };
  function draw() {
    const c = QSim.col(), Sf = SURF[k.val("s")], a = k.val("u") / 100, b = k.val("v") / 100, yaw = (k.val("yaw") * Math.PI) / 180;
    const u = Sf.u0 + a * (Sf.u1 - Sf.u0), w = Sf.v0 + b * (Sf.v1 - Sf.v0);
    const P = M.view(yaw, 0.5);
    const F = QSim.frame(v, { x0: -Sf.R * 1.6, x1: Sf.R * 1.6, y0: -Sf.R, y1: Sf.R, pad: 10, equal: true });
    const n = 16;
    for (let i = 0; i <= n; i++) {
      const uu = Sf.u0 + (i / n) * (Sf.u1 - Sf.u0), vv = Sf.v0 + (i / n) * (Sf.v1 - Sf.v0);
      const A = [], B = [];
      for (let j = 0; j <= 60; j++) { A.push(Sf.x(uu, Sf.v0 + (j / 60) * (Sf.v1 - Sf.v0))); B.push(Sf.x(Sf.u0 + (j / 60) * (Sf.u1 - Sf.u0), vv)); }
      M.path(F, P, A, c.rule, 1); M.path(F, P, B, c.rule, 1);
    }
    const h = 1e-5, p = Sf.x(u, w);
    const xu = M.mul(1 / (2 * h), M.sub(Sf.x(u + h, w), Sf.x(u - h, w))), xv = M.mul(1 / (2 * h), M.sub(Sf.x(u, w + h), Sf.x(u, w - h)));
    const cr = M.cross(xu, xv), ncr = M.norm(cr), L = Sf.R * 0.35;
    const sc = (x) => M.mul(L / Math.max(M.norm(x), 1e-9) * Math.min(1, M.norm(x)), x);
    M.arrow(F, P, p, sc(xu), c.main, "xᵤ");
    M.arrow(F, P, p, sc(xv), c.warn, "xᵥ");
    if (ncr > 1e-6) M.arrow(F, P, p, M.mul(L / ncr, cr), c.acc, "U");
    M.dotp(F, P, p, c.ink, 4.5);
    k.out(`${Sf.name}, ${Sf.un} = ${fmt(u, 3)}, ${Sf.vn} = ${fmt(w, 3)} · 점 (${fmt(p[0], 3)}, ${fmt(p[1], 3)}, ${fmt(p[2], 3)})\n|xᵤ| = ${fmt(M.norm(xu), 3)}, |xᵥ| = ${fmt(M.norm(xv), 3)}, |xᵤ × xᵥ| = ${fmt(ncr, 4)} → ${ncr > 1e-6 ? "정칙: 접평면과 법벡터 U가 정해짐" : "특이점: xᵤ, xᵥ가 일차종속"}`);
  }
  S.redraw();
})();
