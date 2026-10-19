/* 수학6 탐구: 사격법 — −y'' = λ w(x) y, y(0) = 0, y'(0) = 1로 쏘아 y(π) = 0이 되는 λ(고유값)를 찾는다 */
(() => {
  "use strict";
  const WF = { one: { w: () => 1, tex: "w = 1" }, lin: { w: (x) => 1 + x, tex: "w = 1 + x" } };
  const S = MKit.setup("card-m6-shoot", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const L = Math.PI, N = 600, h = L / N;
  function shoot(lam, w, keep) {
    let y = [0, 1], x = 0; const pts = keep ? [[0, 0]] : null;
    for (let i = 0; i < N; i++) { y = QSim.rk4((t, s) => [s[1], -lam * w(t) * s[0]], x, y, h); x += h; if (keep) pts.push([x, y[0]]); }
    return keep ? pts : y[0];
  }
  const eigCache = {};
  function eigs(key) {
    if (eigCache[key]) return eigCache[key];
    const w = WF[key].w, out = []; let a = 0.01, fa = shoot(a, w);
    for (let lam = 0.05; lam < 40 && out.length < 5; lam += 0.05) {
      const fl = shoot(lam, w);
      if (fa * fl < 0) { let lo = lam - 0.05, hi = lam; for (let j = 0; j < 40; j++) { const m = (lo + hi) / 2; shoot(lo, w) * shoot(m, w) <= 0 ? (hi = m) : (lo = m); } out.push((lo + hi) / 2); }
      fa = fl;
    }
    return (eigCache[key] = out);
  }
  function draw() {
    const c = QSim.col(), key = k.val("w"), lam = k.val("lam"), w = WF[key].w;
    const pts = shoot(lam, w, true), end = pts[pts.length - 1][1];
    const ymax = Math.max(1.2, ...pts.map((p) => Math.abs(p[1]))) * 1.1;
    const f = QSim.frame(v, { x0: 0, x1: L, y0: -ymax, y1: ymax, pad: 28, xl: "x" });
    f.axes();
    f.path(pts, c.main, 2.2);
    f.dot(L, end, Math.abs(end) < 0.02 * ymax ? c.main : c.warn, 7);
    let zeros = 0; for (let i = 1; i < pts.length - 1; i++) if (pts[i - 1][1] * pts[i][1] < 0) zeros++;
    const E = eigs(key);
    k.out(`${WF[key].tex}, λ = ${fmt(lam, 3)} · y(π) = ${fmt(end, 4)} (빨간 점이 0에 닿으면 고유값) · 구간 안의 영점 ${zeros}개\n`
      + `고유값(사격법으로 계산): ${E.map((e) => fmt(e, 3)).join(", ")}${key === "one" ? " (= n²)" : ""}`);
  }
  S.redraw();
})();
