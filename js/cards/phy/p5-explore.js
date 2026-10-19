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

  /* 2. 대칭 분포의 Gauss 법칙 (02-02). k = 1, 전체 전하 1, 반지름 R = 1 */
  (() => {
    const S = QSim.card("lab-p5-gauss"); if (!S) return;
    const [cv1, cv2] = S.$$("canvas");
    const Qin = {   // 반지름 r 안의 전하 (선전하는 길이 1당)
      ball: (r) => r < 1 ? r ** 3 : 1,
      shell: (r) => r < 1 ? 0 : 1,
      dense: (r) => r < 1 ? 4 * r ** 3 - 3 * r ** 4 : 1,
      line: () => 1,
    };
    const NAME = { ball: "균일하게 대전된 공", shell: "얇은 구 껍질", dense: "가운데가 짙은 공 (ρ ∝ 1 − r/R)", line: "무한히 긴 선전하 (길이당 전하 1)" };
    function draw() {
      const c = C(), kind = S.val("kind"), r = S.val("r"), q = Qin[kind](r), cyl = kind === "line";
      const E = (s) => cyl ? 2 * Qin.line(s) / s : Qin[kind](s) / (s * s);
      const v = QSim.view(cv1, 0.5), W = v.W, H = v.H, g = v.g, sc = Math.min(W, H) / 7, cx = W / 2, cy = H / 2;
      if (cyl) { g.strokeStyle = c.warn; g.lineWidth = 4; g.beginPath(); g.moveTo(cx, 6); g.lineTo(cx, H - 6); g.stroke(); g.strokeStyle = c.main; g.setLineDash([5, 4]); g.lineWidth = 2; g.strokeRect(cx - r * sc, cy - sc, 2 * r * sc, 2 * sc); g.setLineDash([]); }
      else {
        for (let k = 40; k >= 1; k--) { const s = k / 40; const rho = kind === "ball" ? 1 : kind === "dense" ? 1 - s : 0; if (!rho) continue; g.fillStyle = `rgba(217,83,79,${(0.06 + 0.5 * rho / 40 * 8).toFixed(3)})`; g.beginPath(); g.arc(cx, cy, s * sc, 0, 7); g.fill(); }
        if (kind === "shell") { g.strokeStyle = c.warn; g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, sc, 0, 7); g.stroke(); }
        g.strokeStyle = c.main; g.setLineDash([5, 4]); g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, r * sc, 0, 7); g.stroke(); g.setLineDash([]);
      }
      g.fillStyle = c.ink2; g.font = "12px sans-serif"; g.fillText(`파란 점선: Gauss ${cyl ? "원통" : "구면"} (r = ${r})`, 6, 16);
      const v2 = QSim.view(cv2, 0.42), Em = cyl ? 4 : kind === "dense" ? 1.6 : 1.2, f = QSim.frame(v2, { x0: 0, x1: 3, y0: 0, y1: Em, xl: "r/R", yl: "E" }); f.axes();
      f.fn((s) => s < 0.02 ? NaN : Math.min(E(s), Em * 2), c.main, 2.4, null, 600); f.dot(r, Math.min(E(r), Em), c.acc, 5);
      const flux = cyl ? E(r) * 2 * Math.PI * r : E(r) * 4 * Math.PI * r * r;
      S.out(`${NAME[kind]}, Gauss 면 반지름 r = ${r} R\n면 안의 전하 Q_안 = ${q.toFixed(4)}${cyl ? " (길이 1당)" : " (전체의 비율)"}\n전기장 E = ${E(r).toFixed(4)}  (k = 1/4πε₀ = 1 단위)\n선속 ∮E·dA = ${flux.toFixed(4)}, Q_안/ε₀ = 4πQ_안 = ${(4 * Math.PI * q).toFixed(4)} ← Gauss 법칙`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
