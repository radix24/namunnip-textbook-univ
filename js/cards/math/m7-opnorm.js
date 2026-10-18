/* 수학7 탐구: 작용소 노름 — 단위원을 행렬로 보낸 타원의 가장 긴 반지름 */
(() => {
  "use strict";
  let f, th = 0.6;
  const S = MKit.setup("card-m7-opnorm", 0.8, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const M = () => [k.val("a"), k.val("b"), k.val("c"), k.val("d")];
  const app = ([a, b, c, d], x, y) => [a * x + b * y, c * x + d * y];
  function norm([a, b, c, d]) {
    // A^T A = [[p, q], [q, r]]의 가장 큰 고유값과 그 고유벡터 방향
    const p = a * a + c * c, q = a * b + c * d, r = b * b + d * d;
    const lam = (p + r) / 2 + Math.hypot((p - r) / 2, q);
    return { n: Math.sqrt(lam), phi: 0.5 * Math.atan2(2 * q, p - r) };
  }
  function draw() {
    const c = QSim.col(), A = M(), { n, phi } = norm(A);
    const R = Math.max(1.3, n * 1.12);
    f = QSim.frame(v, { x0: -R, x1: R, y0: -R, y1: R, equal: true, pad: 26 });
    f.axes();
    const circ = [], ell = [];
    for (let i = 0; i <= 240; i++) { const t = (i / 240) * 2 * Math.PI; circ.push([Math.cos(t), Math.sin(t)]); ell.push(app(A, Math.cos(t), Math.sin(t))); }
    f.path(circ, c.ink3, 1.5, [4, 4]);
    f.path(ell, c.main, 2);
    // 가장 많이 늘어나는 방향과 그 상
    const [ux, uy] = [Math.cos(phi), Math.sin(phi)], [mx, my] = app(A, ux, uy);
    f.path([[-ux, -uy], [ux, uy]], c.ink3, 1, [2, 4]);
    f.path([[-mx, -my], [mx, my]], c.main, 1, [2, 4]);
    // 끌 수 있는 단위벡터 x와 Ax
    const x = Math.cos(th), y = Math.sin(th), [ax, ay] = app(A, x, y);
    f.arrow(0, 0, x, y, c.ink2, "x");
    f.arrow(0, 0, ax, ay, c.warn, "Ax");
    f.dot(x, y, c.ink2, 6);
    const [a, b, cc, d] = A, fro = Math.hypot(a, b, cc, d), mxe = Math.max(...A.map(Math.abs)), det = a * d - b * cc;
    k.out(`|x| = 1, |Ax| = ${fmt(Math.hypot(ax, ay), 3)} · ‖A‖ = ${fmt(n, 3)} (점선 방향에서 최대)\n`
      + `프로베니우스 √(Σa²) = ${fmt(fro, 3)} · 성분 최댓값 = ${fmt(mxe, 3)} · det A = ${fmt(det, 3)}`
      + (Math.abs(det) > 1e-9 ? ` · 가장 짧은 반지름 1/‖A⁻¹‖ = ${fmt(Math.abs(det) / n, 3)}` : " · 가역이 아님 (타원이 선분으로 납작해짐)"));
  }
  MKit.drag(S.cv, () => f, () => [[Math.cos(th), Math.sin(th)]], (i, x, y) => { th = Math.atan2(y, x); S.redraw(); });
  S.redraw();
})();
