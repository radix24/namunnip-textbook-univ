/* 수학13 탐구: (u, v) 평면의 선분을 곡면에 옮긴 곡선의 길이 — E, F, G 적분 vs 3차원에서 직접 */
(() => {
  "use strict";
  const S = MKit.setup("card-m13-fff", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const M = window.M13;
  const PI = Math.PI;
  const SURF = {
    sph: { name: "단위구면 (위도 u, 경도 v)", x: (u, w) => [Math.cos(u) * Math.cos(w), Math.cos(u) * Math.sin(w), Math.sin(u)], EFG: (u) => [1, 0, Math.cos(u) ** 2], ur: [-PI / 2, PI / 2], vr: [-PI, PI], R: 1.4 },
    tor: { name: "원환면 R = 2, r = 0.7", x: (u, w) => [(2 + 0.7 * Math.cos(u)) * Math.cos(w), (2 + 0.7 * Math.cos(u)) * Math.sin(w), 0.7 * Math.sin(u)], EFG: (u) => [0.49, 0, (2 + 0.7 * Math.cos(u)) ** 2], ur: [-PI, PI], vr: [-PI, PI], R: 3.1 },
    hel: { name: "나선면 (u cos v, u sin v, v)", x: (u, w) => [u * Math.cos(w), u * Math.sin(w), w], EFG: (u) => [1, 0, 1 + u * u], ur: [-1.5, 1.5], vr: [-PI, PI], R: 3.4 },
    cyl: { name: "원기둥 (cos v, sin v, u)", x: (u, w) => [Math.cos(w), Math.sin(w), u], EFG: () => [1, 0, 1], ur: [-1.5, 1.5], vr: [-PI, PI], R: 1.8 },
  };
  function draw() {
    const c = QSim.col(), Sf = SURF[k.val("s")], phi = (k.val("phi") * PI) / 180, len = k.val("len"), yaw = (k.val("yaw") * PI) / 180;
    const u0 = (Sf.ur[0] + Sf.ur[1]) / 2 - 0.2, v0 = -1;
    const du = Math.cos(phi), dv = Math.sin(phi);
    const curve = (t) => [u0 + t * du, v0 + t * dv];
    // E, F, G 적분(심프슨)
    const n = 400, h = len / n;
    let L1 = 0;
    for (let i = 0; i <= n; i++) { const [u] = curve(i * h), [E, F, G] = Sf.EFG(u); const f = Math.sqrt(E * du * du + 2 * F * du * dv + G * dv * dv); L1 += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * f; }
    L1 *= h / 3;
    // 3차원 꺾은선
    const pts = []; let L2 = 0;
    for (let i = 0; i <= 4000; i++) { const [u, w] = curve((i / 4000) * len); pts.push(Sf.x(u, w)); if (i) L2 += M.norm(M.sub(pts[i], pts[i - 1])); }
    const P = M.view(yaw, 0.5);
    const Fr = QSim.frame(v, { x0: -Sf.R * 1.6, x1: Sf.R * 1.6, y0: -Sf.R, y1: Sf.R, pad: 10, equal: true });
    const m = 14;
    for (let i = 0; i <= m; i++) {
      const uu = Sf.ur[0] + (i / m) * (Sf.ur[1] - Sf.ur[0]), vv = Sf.vr[0] + (i / m) * (Sf.vr[1] - Sf.vr[0]);
      const A = [], B = [];
      for (let j = 0; j <= 50; j++) { A.push(Sf.x(uu, Sf.vr[0] + (j / 50) * (Sf.vr[1] - Sf.vr[0]))); B.push(Sf.x(Sf.ur[0] + (j / 50) * (Sf.ur[1] - Sf.ur[0]), vv)); }
      M.path(Fr, P, A, c.rule, 1); M.path(Fr, P, B, c.rule, 1);
    }
    M.path(Fr, P, pts, c.main, 2.4);
    M.dotp(Fr, P, pts[0], c.warn, 4.5);
    k.out(`${Sf.name} · (u, v) 평면에서 (${fmt(u0, 2)}, ${fmt(v0, 2)})부터 방향 ${k.val("phi")}°로 길이 ${fmt(len, 2)}의 선분\n곡면 위 길이: ∫√(Eu′² + 2Fu′v′ + Gv′²) dt = ${fmt(L1, 5)} · 3차원 꺾은선으로 잰 값 ${fmt(L2, 5)}`);
  }
  S.redraw();
})();
