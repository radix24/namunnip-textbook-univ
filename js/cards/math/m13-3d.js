/* 수학13 공용: R³ 벡터 연산과 정사영(회전한 뒤 화면에 투영) — window.M13 */
(() => {
  "use strict";
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const mul = (s, a) => [s * a[0], s * a[1], s * a[2]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (a) => Math.sqrt(dot(a, a));
  const unit = (a) => { const n = norm(a) || 1; return mul(1 / n, a); };
  // yaw: z축 둘레 회전, pitch: 위에서 내려다보는 각. 반환 [화면 x, 화면 y, 깊이(클수록 앞)]
  const view = (yaw, pitch) => {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    return (p) => { const x = cy * p[0] - sy * p[1], y = sy * p[0] + cy * p[1], z = p[2]; return [x, cp * z - sp * y, sp * z + cp * y]; };
  };
  // QSim 틀 F 위에 3D 축을 그린다
  const axes = (F, P, L, col) => {
    const o = P([0, 0, 0]);
    [["x", [L, 0, 0]], ["y", [0, L, 0]], ["z", [0, 0, L]]].forEach(([nm, e]) => { const q = P(e); F.path([[o[0], o[1]], [q[0], q[1]]], col, 1, [3, 3]); F.text(nm, q[0], q[1], col); });
  };
  const path = (F, P, pts, col, w, dash) => F.path(pts.map((p) => { const q = P(p); return [q[0], q[1]]; }), col, w, dash);
  const arrow = (F, P, p, v, col, label) => { const a = P(p), b = P(add(p, v)); F.arrow(a[0], a[1], b[0] - a[0], b[1] - a[1], col, label); };
  const dotp = (F, P, p, col, r) => { const a = P(p); F.dot(a[0], a[1], col, r); };
  window.M13 = { add, sub, mul, dot, cross, norm, unit, view, axes, path, arrow, dotp };
})();
