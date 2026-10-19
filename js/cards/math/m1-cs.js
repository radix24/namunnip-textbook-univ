/* 수학1 탐구: 코시-슈바르츠 — q(t) = ‖u − tv‖²는 늘 0 이상인 포물선, 그 최솟값이 ‖u‖² − ⟨u,v⟩²/‖v‖² */
(() => {
  "use strict";
  let fl;
  const P = [[2, 1], [1.2, 1.6]]; // u, v
  const S = MKit.setup("card-m1-cs", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  function draw() {
    const c = QSim.col(), g = v.g, half = v.W / 2, [u, w] = P, tc = k.val("t");
    const uv = u[0] * w[0] + u[1] * w[1], uu = u[0] ** 2 + u[1] ** 2, vv = w[0] ** 2 + w[1] ** 2;
    const tStar = vv > 1e-9 ? uv / vv : 0, qmin = uu - (vv > 1e-9 ? uv * uv / vv : 0);
    g.save();
    fl = QSim.frame({ g, W: half, H: v.H }, { x0: -1, x1: 3, y0: -1, y1: 3, equal: true, pad: 14 });
    fl.axes({ noGrid: true });
    const tv = [tc * w[0], tc * w[1]], ts = [tStar * w[0], tStar * w[1]];
    fl.path([[-3 * w[0], -3 * w[1]], [5 * w[0], 5 * w[1]]], c.rule, 1);
    fl.path([ts, u], c.acc, 2, [4, 3]);
    fl.path([tv, u], c.warn, 2);
    fl.arrow(0, 0, u[0], u[1], c.ink, "u"); fl.arrow(0, 0, w[0], w[1], c.main, "v");
    fl.dot(tv[0], tv[1], c.warn, 5); fl.dot(ts[0], ts[1], c.acc, 4);
    fl.dot(u[0], u[1], c.ink, 6); fl.dot(w[0], w[1], c.main, 6);
    g.fillStyle = c.ink2; g.font = "12px sans-serif"; g.fillText("빨간 선분의 길이² = q(t)", 18, 14);
    g.restore();
    g.save(); g.translate(half, 0);
    const q = (t) => uu - 2 * t * uv + t * t * vv;
    const ymax = Math.max(4, q(-1), q(3)) * 1.05;
    const fr = QSim.frame({ g, W: half, H: v.H }, { x0: -1, x1: 3, y0: -0.5, y1: ymax, pad: 26, xl: "t", yl: "q(t)" });
    fr.axes();
    fr.fn(q, c.main, 2);
    fr.dot(tc, q(tc), c.warn, 5); fr.dot(tStar, qmin, c.acc, 5);
    g.restore();
    g.strokeStyle = c.rule; g.beginPath(); g.moveTo(half, 6); g.lineTo(half, v.H - 6); g.stroke();
    k.out(`⟨u,v⟩ = ${fmt(uv, 3)}, ‖u‖‖v‖ = ${fmt(Math.sqrt(uu * vv), 3)} · |⟨u,v⟩| ≤ ‖u‖‖v‖\n` +
      `q(t)의 최솟값 ${fmt(qmin, 4)} (t* = ⟨u,v⟩/‖v‖² = ${fmt(tStar, 3)}) · 판별식/4 = ⟨u,v⟩² − ‖u‖²‖v‖² = ${fmt(uv * uv - uu * vv, 4)} ≤ 0`);
  }
  MKit.drag(S.cv, () => fl, () => P, (i, x, y) => { P[i] = [x, y]; S.redraw(); });
  S.redraw();
})();
