/* 수학16 탐구: 강성 문제 y′ = −λ(y − cos t) − sin t — 양적 오일러는 hλ > 2에서 폭발, 음적 오일러는 안정 */
(() => {
  "use strict";
  const S = MKit.setup("card-m16-stiff", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const T = 2;
  function solve(L, h, method) {
    const f = (t, y) => -L * (y - Math.cos(t)) - Math.sin(t);
    const pts = [[0, 2]];
    let t = 0, y = 2, err = 0, blew = false;
    while (t < T - 1e-12) {
      const hh = Math.min(h, T - t);
      if (method === "fe") y = y + hh * f(t, y);
      else if (method === "be") { const tn = t + hh; y = (y + hh * (L * Math.cos(tn) - Math.sin(tn))) / (1 + hh * L); }
      else { const k1 = f(t, y), k2 = f(t + hh / 2, y + (hh / 2) * k1), k3 = f(t + hh / 2, y + (hh / 2) * k2), k4 = f(t + hh, y + hh * k3); y += (hh / 6) * (k1 + 2 * k2 + 2 * k3 + k4); }
      t += hh;
      if (!isFinite(y) || Math.abs(y) > 1e6) { blew = true; break; }
      pts.push([t, y]);
      if (t >= 0.5) err = Math.max(err, Math.abs(y - (Math.cos(t) + Math.exp(-L * t))));
    }
    return { pts, err, blew };
  }
  function draw() {
    const c = QSim.col(), L = Number(k.val("L")), h = k.val("h");
    const F = QSim.frame(v, { x0: 0, x1: T, y0: -1.5, y1: 2.5, pad: 26, xl: "t", yl: "y" });
    F.axes();
    F.fn((t) => Math.cos(t) + Math.exp(-L * t), c.ink3, 1.4, [5, 4], 600);
    const R = { fe: solve(L, h, "fe"), be: solve(L, h, "be"), rk: solve(L, h, "rk") };
    const clip = (p) => p.map(([t, y]) => [t, Math.max(-1.5, Math.min(2.5, y))]);
    F.path(clip(R.fe.pts), c.warn, 1.8);
    F.path(clip(R.rk.pts), c.acc, 1.4);
    F.path(clip(R.be.pts), c.main, 2);
    const d = (r) => (r.blew ? "발산" : `t ≥ 0.5의 최대 오차 ${r.err < 1e-3 ? r.err.toExponential(1) : fmt(r.err, 4)}`);
    k.out(`λ = ${L}, h = ${fmt(h, 3)}, hλ = ${fmt(h * L, 3)} (양적 오일러의 안정 조건 hλ ≤ 2, RK4는 hλ ≤ 2.79)\n양적 오일러: ${d(R.fe)} · RK4: ${d(R.rk)} · 음적 오일러: ${d(R.be)}`);
  }
  S.redraw();
})();
