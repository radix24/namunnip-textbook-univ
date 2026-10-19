/* 수학13 탐구: 구면·원환면의 격자 분할과 오일러 지표 V − E + F */
(() => {
  "use strict";
  const S = MKit.setup("card-m13-euler", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  const M = window.M13;
  const PI = Math.PI;
  function draw() {
    const c = QSim.col(), sf = k.val("s"), n = k.val("n"), m = k.val("m"), tri = k.val("t") === "on", yaw = (k.val("yaw") * PI) / 180;
    const P = M.view(yaw, 0.5);
    let V, E, F, X, R;
    if (sf === "sph") {
      X = (i, j) => { const u = -PI / 2 + (j / m) * PI, w = (i / n) * 2 * PI; return [Math.cos(u) * Math.cos(w), Math.cos(u) * Math.sin(w), Math.sin(u)]; };
      V = n * (m - 1) + 2; E = n * (m - 1) + n * m; F = n * m; R = 1.4;
      if (tri) { const quads = n * (m - 2); E += quads; F += quads; } // 극 띠는 이미 삼각형
    } else {
      X = (i, j) => { const u = (j / m) * 2 * PI, w = (i / n) * 2 * PI; return [(2 + 0.8 * Math.cos(u)) * Math.cos(w), (2 + 0.8 * Math.cos(u)) * Math.sin(w), 0.8 * Math.sin(u)]; };
      V = n * m; E = 2 * n * m; F = n * m; R = 3.2;
      if (tri) { E += n * m; F += n * m; }
    }
    const Fr = QSim.frame(v, { x0: -R * 1.6, x1: R * 1.6, y0: -R, y1: R, pad: 8, equal: true });
    const jmax = sf === "sph" ? m : m;
    for (let j = sf === "sph" ? 1 : 0; j < (sf === "sph" ? m : m); j++) { const A = []; for (let i = 0; i <= n * 6; i++) A.push(X(i / 6, j)); M.path(Fr, P, A, c.ink3, 1.2); }
    for (let i = 0; i < n; i++) { const B = []; for (let j = 0; j <= jmax * 6; j++) B.push(X(i, j / 6)); M.path(Fr, P, B, c.ink3, 1.2); }
    if (tri) for (let i = 0; i < n; i++) for (let j = sf === "sph" ? 1 : 0; j < (sf === "sph" ? m - 1 : m); j++) M.path(Fr, P, [X(i, j), X(i + 1, j + 1)], c.acc, 1);
    for (let i = 0; i < n; i++) for (let j = sf === "sph" ? 1 : 0; j < (sf === "sph" ? m : m); j++) M.dotp(Fr, P, X(i, j), c.main, 2.5);
    if (sf === "sph") { M.dotp(Fr, P, X(0, 0), c.main, 3); M.dotp(Fr, P, X(0, m), c.main, 3); }
    k.out(`${sf === "sph" ? `구면: 경선 ${n}개, 띠 ${m}개${tri ? ", 사각형을 대각선으로 나눔" : ""}` : `원환면: ${n} × ${m} 격자${tri ? ", 대각선으로 삼각형 분할" : ""}`}\nV = ${V}, E = ${E}, F = ${F} → χ = V − E + F = ${V - E + F}`);
  }
  S.redraw();
})();
