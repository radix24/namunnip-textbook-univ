/* 전전16 전기전자선형대수 탐구 카드: 2×2 행렬이 원을 타원으로(고유벡터와 특이값, 04-02·05-01) */
(() => {
  "use strict";
  if (!window.QSim) return;
  const f2 = (x, d = 3) => (Math.abs(x) < 5e-13 ? 0 : x).toFixed(d);
  const S = QSim.card("exp-e16-transform"); if (!S) return;
  const cv = S.$("canvas");
  function draw() {
    const c = QSim.col(), a = S.val("a"), b = S.val("b"), cc = S.val("c"), d = S.val("d");
    const v = QSim.view(cv, 0.7), fr = QSim.frame(v, { x0: -4, x1: 4, y0: -4, y1: 4, equal: true }); fr.axes();
    const circ = [], ell = [];
    for (let i = 0; i <= 200; i++) { const t = 2 * Math.PI * i / 200, x = Math.cos(t), y = Math.sin(t); circ.push([x, y]); ell.push([a * x + b * y, cc * x + d * y]); }
    fr.path(circ, c.rule, 1.4, [4, 3]); fr.path(ell, c.main, 2.4);
    // 고유값: λ² − (a + d)λ + (ad − bc) = 0
    const tr = a + d, det = a * d - b * cc, disc = tr * tr - 4 * det;
    let eig = "";
    if (disc >= 0) {
      const l1 = (tr + Math.sqrt(disc)) / 2, l2 = (tr - Math.sqrt(disc)) / 2;
      const vec = (l) => { let x, y; if (Math.abs(b) > 1e-9) { x = b; y = l - a; } else if (Math.abs(cc) > 1e-9) { x = l - d; y = cc; } else { x = Math.abs(l - a) < 1e-9 ? 1 : 0; y = 1 - x; } const n = Math.hypot(x, y); return [x / n, y / n]; };
      [[l1, c.warn], [l2, c.acc]].forEach(([l, col]) => { const [x, y] = vec(l); fr.path([[-3.8 * x, -3.8 * y], [3.8 * x, 3.8 * y]], col, 1, [2, 3]); fr.arrow(0, 0, l * x, l * y, col); });
      eig = `고유값 ${f2(l1, 3)}, ${f2(l2, 3)} (빨강·주황 화살표 = λ × 고유벡터, 방향이 바뀌지 않는 직선)`;
    } else eig = `고유값이 복소수(${f2(tr / 2, 3)} ± ${f2(Math.sqrt(-disc) / 2, 3)}j): 실수 고유벡터가 없음(회전 성분)`;
    // 특이값: AᵀA의 고유값의 제곱근
    const p = a * a + cc * cc, q = a * b + cc * d, r = b * b + d * d, tt = p + r, dd = p * r - q * q;
    const s1 = Math.sqrt((tt + Math.sqrt(Math.max(0, tt * tt - 4 * dd))) / 2), s2 = Math.sqrt(Math.max(0, (tt - Math.sqrt(Math.max(0, tt * tt - 4 * dd))) / 2));
    S.out(`A = [[${a}, ${b}], [${cc}, ${d}]], det A = ${f2(det, 3)}(넓이 배율), trace = ${f2(tr, 3)}\n${eig}\n` +
      `특이값 σ₁ = ${f2(s1, 3)}, σ₂ = ${f2(s2, 3)}: 파란 타원의 긴 반지름과 짧은 반지름. σ₁σ₂ = |det A| = ${f2(s1 * s2, 3)}. ${Math.abs(det) < 1e-9 ? "det = 0: 원이 선분으로 납작해짐(가역이 아님)" : ""}`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();
