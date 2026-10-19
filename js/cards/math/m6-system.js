/* 수학6 탐구: x' = Ax 의 해 e^{tA}x0 — 상평면 궤적(고유벡터 방향)과 성분 그래프 */
(() => {
  "use strict";
  let f, X0 = [1, 0];
  const S = MKit.setup("card-m6-system", 0.5, draw);
  if (!S) return;
  const { k, v, cv } = S;
  const { fmt } = MKit;
  function draw() {
    const c = QSim.col(), a = k.val("a"), b = k.val("b"), cc = k.val("c"), d = k.val("d"), g = v.g, W = v.W, H = v.H;
    const F = (t, x) => [a * x[0] + b * x[1], cc * x[0] + d * x[1]];
    f = QSim.frame({ g, W: W * 0.5, H }, { x0: -3, x1: 3, y0: -3, y1: 3, equal: true, pad: 22, xl: "x₁", yl: "x₂" });
    f.axes();
    const tr = a + d, det = a * d - b * cc, disc = tr * tr - 4 * det;
    const evs = [];
    if (disc >= 0) {
      for (const s of [1, -1]) {
        const lam = (tr + s * Math.sqrt(disc)) / 2;
        let vx = b, vy = lam - a; if (Math.abs(vx) + Math.abs(vy) < 1e-9) { vx = lam - d; vy = cc; } if (Math.abs(vx) + Math.abs(vy) < 1e-9) { vx = s > 0 ? 1 : 0; vy = s > 0 ? 0 : 1; }
        const L = Math.hypot(vx, vy); evs.push([lam, vx / L, vy / L]);
        f.path([[-4 * vx / L, -4 * vy / L], [4 * vx / L, 4 * vy / L]], c.ink3, 1, [5, 4]);
      }
    }
    // 궤적: 앞으로(진하게) 뒤로(옅게)
    const run = (dir, T) => { const pts = [X0.slice()]; let x = X0.slice(), t = 0; const h = 0.01 * dir; for (let i = 0; i < T; i++) { x = QSim.rk4(F, t, x, h); t += h; if (Math.abs(x[0]) > 6 || Math.abs(x[1]) > 6) break; pts.push(x); } return pts; };
    f.path(run(-1, 400), c.soft, 1.5); const fw = run(1, 400); f.path(fw, c.main, 2.2); f.dot(X0[0], X0[1], c.warn, 6);
    // 성분 그래프
    g.save(); g.translate(W * 0.52, 0);
    const R = QSim.frame({ g, W: W * 0.48, H }, { x0: 0, x1: 4, y0: -3, y1: 3, pad: 24, xl: "t" });
    R.axes();
    const comp = (j) => fw.map((x, i) => [i * 0.01, Math.max(-3.5, Math.min(3.5, x[j]))]);
    R.path(comp(0), c.main, 1.8); R.path(comp(1), c.acc, 1.8);
    g.restore();
    const evtxt = disc >= 0 ? evs.map(([l, x, y]) => `λ = ${fmt(l, 3)}, 방향 (${fmt(x, 2)}, ${fmt(y, 2)})`).join(" · ") : `λ = ${fmt(tr / 2, 3)} ± ${fmt(Math.sqrt(-disc) / 2, 3)}i (회전, 고유벡터 실수 방향 없음)`;
    k.out(`A = [[${a}, ${b}], [${cc}, ${d}]] · ${evtxt}\nx(0) = (${fmt(X0[0], 2)}, ${fmt(X0[1], 2)}) · 오른쪽: x₁(t) 파랑, x₂(t) 노랑 · 빨간 점을 끌어 초기값을 바꾸세요`);
  }
  MKit.drag(cv, () => f, () => [X0], (i, x, y) => { X0 = [x, y]; S.redraw(); });
  S.redraw();
})();
