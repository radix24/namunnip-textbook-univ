/* 수학13 탐구: 등장사상으로 옮긴 나선 — 곡률은 그대로, 반사하면 열률의 부호가 바뀐다 */
(() => {
  "use strict";
  const S = MKit.setup("card-m13-isometry", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const M = window.M13;
  const helix = (t) => [2 * Math.cos(t), 2 * Math.sin(t), 0.8 * t];
  function kt(r, t) {
    const h = 1e-3, p = r(t);
    const d1 = M.mul(1 / (2 * h), M.sub(r(t + h), r(t - h)));
    const d2 = M.mul(1 / (h * h), M.add(M.sub(r(t + h), M.mul(2, p)), r(t - h)));
    const d3 = M.mul(1 / (2 * h * h * h), M.add(M.sub(r(t + 2 * h), M.mul(2, r(t + h))), M.sub(M.mul(2, r(t - h)), r(t - 2 * h))));
    const c = M.cross(d1, d2), n = M.norm(c);
    return [n / M.norm(d1) ** 3, M.dot(c, d3) / (n * n)];
  }
  function draw() {
    const c = QSim.col(), ang = (k.val("a") * Math.PI) / 180, refl = k.val("r") === "on", sh = k.val("sh"), yaw = (k.val("yaw") * Math.PI) / 180;
    // F = 평행이동 ∘ (x축 둘레 회전) ∘ (반사: y → −y)
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const A = (p) => { const q = refl ? [p[0], -p[1], p[2]] : p; return [q[0], ca * q[1] - sa * q[2], sa * q[1] + ca * q[2]]; };
    const Fm = (p) => M.add(A(p), [sh, 0, 0]);
    const img = (t) => Fm(helix(t));
    const P = M.view(yaw, 0.4);
    const F = QSim.frame(v, { x0: -9, x1: 9, y0: -5.5, y1: 5.5, pad: 10, equal: true });
    M.axes(F, P, 2.5, c.rule);
    const N = 500, t0 = -6, t1 = 6;
    const orig = [], im = [];
    for (let i = 0; i <= N; i++) { const t = t0 + ((t1 - t0) * i) / N; orig.push(helix(t)); im.push(img(t)); }
    M.path(F, P, orig, c.ink3, 1.4, [4, 3]);
    M.path(F, P, im, c.main, 2);
    const [k1, t1v] = kt(helix, 0.5), [k2, t2v] = kt(img, 0.5);
    const det = refl ? -1 : 1;
    k.out(`F = 평행이동 (${fmt(sh, 1)}, 0, 0) ∘ x축 둘레 ${k.val("a")}° 회전${refl ? " ∘ 반사 (y → −y)" : ""} · det A = ${det}\n원래 곡선: κ = ${fmt(k1, 4)}, τ = ${fmt(t1v, 4)} · 옮긴 곡선: κ = ${fmt(k2, 4)}, τ = ${fmt(t2v, 4)} (${refl ? "열률 부호 반전: 오른나사 → 왼나사" : "둘 다 보존"})`);
  }
  S.redraw();
})();
