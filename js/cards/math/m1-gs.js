/* 수학1 탐구: 그람-슈미트 — w₂에서 v₁ 방향 정사영을 빼면 v₂ ⊥ v₁ */
(() => {
  "use strict";
  let f;
  const W = [[2, 0.6], [1.0, 1.8]];
  const S = MKit.setup("card-m1-gs", 0.8, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  function draw() {
    const c = QSim.col(), step = k.val("step"), [w1, w2] = W;
    f = QSim.frame(v, { x0: -1.5, x1: 3.5, y0: -1.5, y1: 3, equal: true, pad: 22 });
    f.axes();
    const n1 = w1[0] ** 2 + w1[1] ** 2, coef = n1 > 1e-9 ? (w2[0] * w1[0] + w2[1] * w1[1]) / n1 : 0;
    const proj = [coef * w1[0], coef * w1[1]], v2 = [w2[0] - proj[0], w2[1] - proj[1]];
    f.path([[-3 * w1[0], -3 * w1[1]], [4 * w1[0], 4 * w1[1]]], c.rule, 1);
    f.arrow(0, 0, w1[0], w1[1], c.main, "w₁ = v₁");
    f.arrow(0, 0, w2[0], w2[1], c.ink2, "w₂");
    if (step >= 1) { f.arrow(0, 0, proj[0], proj[1], c.acc, "정사영"); f.path([proj, w2], c.acc, 1.5, [4, 3]); }
    if (step >= 2) f.arrow(0, 0, v2[0], v2[1], c.warn, "v₂");
    if (step >= 3) {
      const a = Math.hypot(...w1), b = Math.hypot(...v2);
      if (a > 1e-9) f.arrow(0, 0, w1[0] / a, w1[1] / a, c.main, "u₁");
      if (b > 1e-9) f.arrow(0, 0, v2[0] / b, v2[1] / b, c.warn, "u₂");
      f.path(Array.from({ length: 91 }, (_, i) => [Math.cos(i * Math.PI / 45), Math.sin(i * Math.PI / 45)]), c.rule, 1, [2, 3]);
    }
    f.dot(w1[0], w1[1], c.ink, 6); f.dot(w2[0], w2[1], c.ink, 6);
    const dot12 = v2[0] * w1[0] + v2[1] * w1[1];
    const msg = ["1단계: v₁ = w₁로 둡니다.", `2단계: w₂의 v₁ 방향 정사영 = (⟨w₂,v₁⟩/‖v₁‖²)v₁ = ${fmt(coef, 3)}·v₁`, `3단계: v₂ = w₂ − 정사영 = (${fmt(v2[0], 3)}, ${fmt(v2[1], 3)}) · ⟨v₂, v₁⟩ = ${fmt(dot12, 6)}`, "4단계: 길이로 나누면 정규직교기저 u₁, u₂ (점선은 단위원)"][step];
    k.out(msg + (Math.hypot(...v2) < 1e-6 ? "\nw₁, w₂가 평행해서 v₂ = 0입니다. 일차독립이 아니면 과정이 멈춥니다." : ""));
  }
  MKit.drag(S.cv, () => f, () => W, (i, x, y) => { W[i] = [x, y]; S.redraw(); });
  S.redraw();
})();
