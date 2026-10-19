/* 물리5 탐구 카드: 두 점전하의 전위와 전기장, E = −∇V 확인 */
(() => {
  "use strict";
  const C = () => QSim.col();

  /* 1. 두 점전하의 등전위선과 전기장 (02-03). k = 1 단위 */
  (() => {
    const S = QSim.card("lab-p5-potential"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), q1 = S.val("q1"), q2 = S.val("q2"), d = S.val("d"), px = S.val("px"), py = S.val("py");
      const Q = [[-d / 2, 0, q1], [d / 2, 0, q2]];
      const V = (x, y) => Q.reduce((s, [a, b, q]) => s + q / Math.max(0.05, Math.hypot(x - a, y - b)), 0);
      const E = (x, y) => Q.reduce(([ex, ey], [a, b, q]) => { const r = Math.max(0.05, Math.hypot(x - a, y - b)); return [ex + q * (x - a) / r ** 3, ey + q * (y - b) / r ** 3]; }, [0, 0]);
      const v = QSim.view(cv, 0.62), f = QSim.frame(v, { x0: -3, x1: 3, y0: -2, y1: 2, equal: true }); const g = v.g;
      const N = 120, M = 80, dx = 6 / N, dy = 4 / M;
      for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) {
        const x = -3 + (i + 0.5) * dx, y = -2 + (j + 0.5) * dy, u = V(x, y);
        const band = Math.floor(u * 4), a = Math.min(0.55, Math.abs(u) * 0.25);   // 0.25 간격의 띠 = 등전위선
        g.fillStyle = u >= 0 ? `rgba(217,83,79,${(a * (band % 2 ? 1 : 0.6)).toFixed(3)})` : `rgba(75,79,224,${(a * (band % 2 ? 1 : 0.6)).toFixed(3)})`;
        g.fillRect(f.X(x - dx / 2), f.Y(y + dy / 2), dx * f.sx + 0.6, dy * f.sy + 0.6);
      }
      for (let x = -2.75; x <= 2.76; x += 0.5) for (let y = -1.75; y <= 1.76; y += 0.5) {
        const [ex, ey] = E(x, y), m = Math.hypot(ex, ey); if (m < 1e-6) continue;
        const s = 0.35 * Math.min(1, Math.sqrt(m)) / m; f.arrow(x - ex * s / 2, y - ey * s / 2, ex * s, ey * s, c.ink2);
      }
      Q.forEach(([a, b, q]) => { if (q) { f.dot(a, b, q > 0 ? c.warn : c.main, 7); f.text(q > 0 ? `+${q}` : `${q}`, a + 0.12, b + 0.15, c.ink); } });
      f.dot(px, py, c.acc, 5);
      const h = 1e-4, Ed = E(px, py), Eg = [-(V(px + h, py) - V(px - h, py)) / (2 * h), -(V(px, py + h) - V(px, py - h)) / (2 * h)];
      f.arrow(px, py, Ed[0] * 0.4 / Math.max(0.4, Math.hypot(...Ed)), Ed[1] * 0.4 / Math.max(0.4, Math.hypot(...Ed)), c.acc, "E");
      S.out(`탐침 (${px}, ${py})에서 V = ${V(px, py).toFixed(4)}\nCoulomb 법칙으로 더한 E = (${Ed[0].toFixed(4)}, ${Ed[1].toFixed(4)}), 크기 ${Math.hypot(...Ed).toFixed(4)}\n−(V의 기울기)로 구한 E = (${Eg[0].toFixed(4)}, ${Eg[1].toFixed(4)})  ← 둘이 같다: E = −∇V\n빨강: V > 0, 파랑: V < 0, 색 띠의 경계가 등전위선(간격 0.25)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
