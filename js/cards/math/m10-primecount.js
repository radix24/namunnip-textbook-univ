/* 수학10 탐구: 에라토스테네스의 체로 π(x) — x/ln x, ∫₂ˣ dt/ln t 와 비교 */
(() => {
  "use strict";
  const S = MKit.setup("card-m10-primecount", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const N = 1000000, sv = new Uint8Array(N + 1).fill(1); sv[0] = sv[1] = 0;
  for (let i = 2; i * i <= N; i++) if (sv[i]) for (let j = i * i; j <= N; j += i) sv[j] = 0;
  const pi = new Int32Array(N + 1); for (let i = 1; i <= N; i++) pi[i] = pi[i - 1] + sv[i];
  const li = (x) => { if (x <= 2) return 0; const a = Math.log(2), b = Math.log(x), n = 2000, h = (b - a) / n, f = (u) => Math.exp(u) / u; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h); return (s * h) / 3; };
  function draw() {
    const c = QSim.col(), e = k.val("e"), mode = k.val("m"), X = Math.round(Math.pow(10, e));
    const pts = []; for (let i = 0; i <= 300; i++) { const t = Math.max(3, Math.round(Math.pow(10, 1 + ((e - 1) * i) / 300))); pts.push(t); }
    if (mode === "count") {
      const F = QSim.frame(v, { x0: 0, x1: X, y0: 0, y1: pi[X] * 1.15, pad: 34, xl: "x", yl: "개수" });
      F.axes();
      const lin = []; for (let i = 0; i <= 300; i++) lin.push(Math.max(3, Math.round((X * i) / 300)));
      F.path(lin.map((t) => [t, pi[t]]), c.main, 2.2);
      F.path(lin.map((t) => [t, t / Math.log(t)]), c.warn, 1.6, [5, 4]);
      F.path(lin.filter((_, i) => i % 6 === 0).map((t) => [t, li(t)]), c.acc, 1.6);
    } else {
      const F = QSim.frame(v, { x0: 1, x1: e, y0: 0.9, y1: 1.4, pad: 34, xl: "log₁₀ x", yl: "비" });
      F.axes();
      F.path(pts.map((t) => [Math.log10(t), pi[t] / (t / Math.log(t))]), c.warn, 2);
      F.path(pts.filter((_, i) => i % 5 === 0).map((t) => [Math.log10(t), pi[t] / li(t)]), c.acc, 2);
      F.path([[1, 1], [e, 1]], c.ink3, 1, [4, 4]);
    }
    k.out(`x = ${X.toLocaleString("en-US")} · π(x) = ${pi[X]} · x/ln x = ${fmt(X / Math.log(X), 1)} (비 ${fmt(pi[X] / (X / Math.log(X)), 4)}) · ∫₂ˣ dt/ln t = ${fmt(li(X), 1)} (비 ${fmt(pi[X] / li(X), 4)})\n파랑 π(x), 빨간 점선 x/ln x, 노랑 적분 근사`);
  }
  S.redraw();
})();
