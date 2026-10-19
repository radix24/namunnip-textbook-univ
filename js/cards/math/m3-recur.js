/* 수학3 탐구: a_n = c1 a_{n−1} + c2 a_{n−2} — 수열, 특성근, 비 a_{n+1}/a_n 의 수렴 */
(() => {
  "use strict";
  const S = MKit.setup("card-m3-recur", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  function draw() {
    const c = QSim.col(), c1 = k.val("c1"), c2 = k.val("c2"), a0 = k.val("a0"), a1 = k.val("a1"), N = 20, g = v.g, W = v.W, H = v.H;
    const a = [a0, a1]; for (let n = 2; n <= N; n++) a.push(c1 * a[n - 1] + c2 * a[n - 2]);
    const D = c1 * c1 + 4 * c2;
    const roots = D >= 0 ? [(c1 + Math.sqrt(D)) / 2, (c1 - Math.sqrt(D)) / 2] : null;
    const lim = Math.max(1, ...a.map((x) => Math.abs(x)).filter(isFinite));
    const sgnlog = (x) => Math.sign(x) * Math.log10(1 + Math.abs(x));
    const L = QSim.frame({ g, W: W * 0.58, H }, { x0: -0.5, x1: N + 0.5, y0: -sgnlog(lim) * 1.05 - 0.1, y1: sgnlog(lim) * 1.05 + 0.1, pad: 30, xl: "n", yl: "부호×log(1+|a|)" });
    L.axes({ noGrid: true });
    a.forEach((x, n) => { L.path([[n, 0], [n, sgnlog(x)]], x >= 0 ? c.main : c.warn, 3); });
    g.save(); g.translate(W * 0.6, 0);
    const R = QSim.frame({ g, W: W * 0.4, H }, { x0: 0, x1: N, y0: -3, y1: 3, pad: 26, xl: "n", yl: "비" });
    R.axes();
    const ratio = []; for (let n = 1; n < N; n++) if (a[n] !== 0) ratio.push([n, Math.max(-3.2, Math.min(3.2, a[n + 1] / a[n]))]);
    R.path(ratio, c.acc, 1.8);
    if (roots) { const dom = Math.abs(roots[0]) >= Math.abs(roots[1]) ? roots[0] : roots[1]; if (Math.abs(dom) < 3) R.path([[0, dom], [N, dom]], c.ink3, 1, [4, 4]); }
    g.restore();
    const rt = roots ? (Math.abs(roots[0] - roots[1]) < 1e-9 ? `중근 ${fmt(roots[0], 4)}` : `${fmt(roots[0], 4)}, ${fmt(roots[1], 4)}`) : `${fmt(c1 / 2, 3)} ± ${fmt(Math.sqrt(-D) / 2, 3)}i (복소근, 절댓값 ${fmt(Math.sqrt(-c2), 3)})`;
    k.out(`특성방정식 r² = ${c1}r + ${c2} · 근 ${rt}\na_0..a_10 = ${a.slice(0, 11).map((x) => fmt(x, 2)).join(", ")} · 오른쪽: 비 a_(n+1)/a_n (노랑), 절댓값이 큰 근(점선)`);
  }
  S.redraw();
})();
