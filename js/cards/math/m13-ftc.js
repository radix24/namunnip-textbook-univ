/* 수학13 탐구: κ(s), τ(s)를 정하고 프레네 방정식을 RK4로 풀어 곡선을 만든다 (곡선의 기본정리) */
(() => {
  "use strict";
  const S = MKit.setup("card-m13-ftc", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const M = window.M13;
  function solve(kap, tau, L, n) {
    // 상태: [β(3), T(3), N(3), B(3)]
    let y = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1];
    const f = (s, y) => {
      const K = kap(s), Ta = tau(s);
      const T = y.slice(3, 6), N = y.slice(6, 9), B = y.slice(9, 12);
      return [...T, ...M.mul(K, N), ...M.add(M.mul(-K, T), M.mul(Ta, B)), ...M.mul(-Ta, N)];
    };
    const h = L / n, pts = [y.slice(0, 3)];
    for (let i = 0; i < n; i++) {
      const s = i * h;
      const k1 = f(s, y), k2 = f(s + h / 2, y.map((a, j) => a + (h / 2) * k1[j])), k3 = f(s + h / 2, y.map((a, j) => a + (h / 2) * k2[j])), k4 = f(s + h, y.map((a, j) => a + h * k3[j]));
      y = y.map((a, j) => a + (h / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
      pts.push(y.slice(0, 3));
    }
    return { pts, y };
  }
  function draw() {
    const c = QSim.col(), k0 = k.val("k0"), t0 = k.val("t0"), mode = k.val("m"), L = k.val("L"), yaw = (k.val("yaw") * Math.PI) / 180;
    const kap = mode === "lin" ? (s) => k0 * s : mode === "per" ? (s) => k0 * (1 + 0.6 * Math.sin(s)) : () => k0;
    const tau = () => t0;
    const { pts, y } = solve(kap, tau, L, Math.max(200, Math.round(L * 40 * Math.max(1, k0 * (mode === "lin" ? L : 1.6)))));
    let lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    pts.forEach((p) => { for (let i = 0; i < 3; i++) { lo[i] = Math.min(lo[i], p[i]); hi[i] = Math.max(hi[i], p[i]); } });
    const ctr = lo.map((a, i) => (a + hi[i]) / 2), R = Math.max(1, ...hi.map((a, i) => (a - lo[i]) / 2)) * 1.2;
    const P0 = M.view(yaw, 0.45), P = (p) => P0(M.sub(p, ctr));
    const F = QSim.frame(v, { x0: -R * 1.6, x1: R * 1.6, y0: -R, y1: R, pad: 10, equal: true });
    M.path(F, P, pts, c.main, 2);
    M.dotp(F, P, pts[0], c.warn, 5); M.dotp(F, P, pts[pts.length - 1], c.ink, 4);
    const T = y.slice(3, 6), N = y.slice(6, 9), B = y.slice(9, 12);
    const orth = Math.max(Math.abs(M.dot(T, T) - 1), Math.abs(M.dot(N, N) - 1), Math.abs(M.dot(B, B) - 1), Math.abs(M.dot(T, N)), Math.abs(M.dot(N, B)), Math.abs(M.dot(T, B)));
    const gap = M.norm(M.sub(pts[pts.length - 1], pts[0]));
    const nm = mode === "lin" ? `κ(s) = ${fmt(k0, 2)}s` : mode === "per" ? `κ(s) = ${fmt(k0, 2)}(1 + 0.6 sin s)` : `κ = ${fmt(k0, 2)}`;
    k.out(`${nm}, τ = ${fmt(t0, 2)}, 길이 ${fmt(L, 1)} · 시작(빨강)에서 끝(검정)까지 거리 ${fmt(gap, 4)}\n틀의 정규직교성 오차 ${orth.toExponential(1)}${mode === "const" && Math.abs(t0) > 1e-9 ? ` · 나선 반지름 κ/(κ² + τ²) = ${fmt(k0 / (k0 * k0 + t0 * t0), 4)}` : mode === "const" ? ` · 원의 반지름 1/κ = ${fmt(1 / k0, 4)}` : ""}`);
  }
  S.redraw();
})();
