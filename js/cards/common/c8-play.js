/* 공통8 체험 카드 묶음 2: 충격(델타 함수) 응답. */
(() => {
  "use strict";
  const C = () => QSim.col();

  /* 3. 망치로 친 용수철: 델타 함수와 짧은 사각 펄스 (05-04) */
  (() => {
    const S = QSim.card("lab-c8-impulse"); if (!S) return;
    const cv = S.$("canvas");
    /* y'' + 2ζ y' + y = (사각 펄스: 높이 A/ε, 폭 ε, t = a부터) 를 RK4로, 델타 응답은 식으로 */
    function draw() {
      const c = C(), a = S.val("a"), eps = S.val("eps"), zeta = S.val("z"), A = 1, T = 20;
      const wd = Math.sqrt(Math.max(1e-9, 1 - zeta * zeta));
      const yd = (t) => (t < a ? 0 : (A / wd) * Math.exp(-zeta * (t - a)) * Math.sin(wd * (t - a)));
      const f = (t, y) => [y[1], (t >= a && t < a + eps ? A / eps : 0) - 2 * zeta * y[1] - y[0]];
      const pts = []; let y = [0, 0], t = 0; const h = Math.min(0.01, eps / 20);
      let maxdiff = 0;
      while (t < T) { pts.push([t, y[0]]); maxdiff = Math.max(maxdiff, Math.abs(y[0] - yd(t))); y = QSim.rk4(f, t, y, h); t += h; }
      const v = QSim.view(cv, 0.55), F = QSim.frame(v, { x0: 0, x1: T, y0: -1.2, y1: 1.2, xl: "t" }); F.axes();
      F.fn(yd, c.main, 2.5, null, 800); F.path(pts.filter((_, i) => i % 4 === 0), c.acc, 2, [5, 3]);
      const g = v.g; g.save(); g.fillStyle = c.warn; g.globalAlpha = 0.25; g.fillRect(F.X(a), F.Y(1.2), Math.max(2, F.X(a + eps) - F.X(a)), F.Y(-1.2) - F.Y(1.2)); g.restore();
      S.out(`y″ + 2ζy′ + y = 충격,  ζ = ${zeta.toFixed(2)},  충격 시각 a = ${a.toFixed(1)},  충격량 1\n` +
        `보라: 델타 함수 δ(t − a)의 응답 y = u(t − a)·e^(−ζ(t − a)) sin(ω_d(t − a))/ω_d,  ω_d = ${wd.toFixed(3)}\n` +
        `주황 점선: 폭 ε = ${eps.toFixed(2)}, 높이 1/ε인 사각 펄스의 응답 (수치해),  두 곡선의 최대 차이 ${maxdiff.toFixed(4)}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
