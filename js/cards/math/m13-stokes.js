/* 수학13 탐구: 경계가 같은 곡면들(높이 H인 돔)에서 회전의 선속 = 경계의 선적분 */
(() => {
  "use strict";
  const S = MKit.setup("card-m13-stokes", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const M = window.M13;
  const PI = Math.PI;
  const FIELDS = {
    rot: { name: "F = (−y, x, 0)", F: (x, y, z) => [-y, x, 0], curl: () => [0, 0, 2] },
    mix: { name: "F = (z − y, x + z², xy)", F: (x, y, z) => [z - y, x + z * z, x * y], curl: (x, y, z) => [x - 2 * z, 1 - y, 2] },
    grad: { name: "F = ∇(xyz) = (yz, xz, xy)", F: (x, y, z) => [y * z, x * z, x * y], curl: () => [0, 0, 0] },
  };
  const simpson2 = (f, a, b, c, d, n) => {
    const hx = (b - a) / n, hy = (d - c) / n; let s = 0;
    for (let i = 0; i <= n; i++) { const wi = i === 0 || i === n ? 1 : i % 2 ? 4 : 2; for (let j = 0; j <= n; j++) { const wj = j === 0 || j === n ? 1 : j % 2 ? 4 : 2; s += wi * wj * f(a + i * hx, c + j * hy); } }
    return (s * hx * hy) / 9;
  };
  function draw() {
    const c = QSim.col(), Fd = FIELDS[k.val("f")], H = k.val("H"), flip = k.val("o") === "down", yaw = (k.val("yaw") * PI) / 180;
    const X = (ph, th) => [Math.sin(ph) * Math.cos(th), Math.sin(ph) * Math.sin(th), H * Math.cos(ph)];
    const crossv = (ph, th) => [H * Math.sin(ph) ** 2 * Math.cos(th), H * Math.sin(ph) ** 2 * Math.sin(th), Math.sin(ph) * Math.cos(ph)];
    const sgn = flip ? -1 : 1;
    const flux = sgn * simpson2((ph, th) => { const p = X(ph, th); return M.dot(Fd.curl(...p), crossv(ph, th)); }, 0, PI / 2, 0, 2 * PI, 80);
    // 경계: 단위원. 위쪽 방향이면 반시계
    let line = 0; const N = 2000;
    for (let i = 0; i < N; i++) { const t = ((i + 0.5) / N) * 2 * PI, p = [Math.cos(t), Math.sin(t), 0], d = [-Math.sin(t), Math.cos(t), 0]; line += M.dot(Fd.F(...p), d) * ((2 * PI) / N); }
    line *= sgn;
    const P = M.view(yaw, 0.55);
    const Fr = QSim.frame(v, { x0: -2.4, x1: 2.4, y0: -1.5, y1: 1.5, pad: 10, equal: true });
    M.axes(Fr, P, 1.3, c.rule);
    for (let i = 0; i <= 8; i++) { const ph = (i / 8) * (PI / 2), A = []; for (let j = 0; j <= 60; j++) A.push(X(ph, (j / 60) * 2 * PI)); M.path(Fr, P, A, c.rule, 1); }
    for (let j = 0; j < 12; j++) { const th = (j / 12) * 2 * PI, B = []; for (let i = 0; i <= 30; i++) B.push(X((i / 30) * (PI / 2), th)); M.path(Fr, P, B, c.rule, 1); }
    const circ = Array.from({ length: 121 }, (_, i) => [Math.cos((i / 120) * 2 * PI), Math.sin((i / 120) * 2 * PI), 0]);
    M.path(Fr, P, circ, c.main, 2.2);
    for (let q = 0; q < 4; q++) { const t = (q / 4) * 2 * PI + 0.4, d = M.mul(0.35 * sgn, [-Math.sin(t), Math.cos(t), 0]); M.arrow(Fr, P, [Math.cos(t), Math.sin(t), 0], d, c.main); }
    const top = X(0, 0); M.arrow(Fr, P, top, [0, 0, 0.6 * sgn], c.acc, "U");
    k.out(`${Fd.name} · 곡면: 경계가 단위원인 돔 (높이 H = ${fmt(H, 2)}, H = 0이면 원판), 법벡터 ${flip ? "아래쪽" : "위쪽"}\n∬ (∇ × F)·U dA = ${fmt(flux, 6)} · 경계의 ∮ F·dr = ${fmt(line, 6)}`);
  }
  S.redraw();
})();
