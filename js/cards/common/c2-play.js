/* 공통2 체험 카드 묶음 2: 외적과 평행사변형, 극좌표 이중적분. */
(() => {
  "use strict";
  const C = () => QSim.col();

  /* 1. 외적: 두 벡터에 수직인 벡터와 넓이 (01-01) */
  (() => {
    const S = QSim.card("lab-c2-cross"); if (!S) return;
    const cv = S.$("canvas");
    const P = (x, y, z) => [y - 0.55 * x, z - 0.4 * x]; /* 비스듬히 본 그림: x축은 앞(왼쪽 아래), y축은 오른쪽, z축은 위 */
    function draw() {
      const c = C(), th = (S.val("th") * Math.PI) / 180, bl = S.val("b"), bz = S.val("bz");
      const a = [2, 0, 0], b = [bl * Math.cos(th), bl * Math.sin(th), bz];
      const n = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
      const v = QSim.view(cv, 0.62), F = QSim.frame(v, { x0: -2.6, x1: 3.4, y0: -2, y1: 4, equal: true });
      const g = v.g, L = (p, q, col, w = 1.5, d) => { const A = P(...p), B = P(...q); F.path([A, B], col, w, d); };
      L([0, 0, 0], [3.2, 0, 0], c.ink3, 1, [3, 3]); L([0, 0, 0], [0, 3, 0], c.ink3, 1, [3, 3]); L([0, 0, 0], [0, 0, 3.6], c.ink3, 1, [3, 3]);
      F.text("x", ...P(3.4, 0, 0), c.ink3); F.text("y", ...P(0, 3.15, 0), c.ink3); F.text("z", ...P(0, 0, 3.75), c.ink3);
      const q = [[0, 0, 0], a, [a[0] + b[0], a[1] + b[1], a[2] + b[2]], b].map((p) => P(...p));
      g.save(); g.fillStyle = c.soft; g.globalAlpha = 0.6; g.beginPath(); q.forEach(([x, y], i) => (i ? g.lineTo(F.X(x), F.Y(y)) : g.moveTo(F.X(x), F.Y(y)))); g.closePath(); g.fill(); g.restore();
      const ar = (p, col, lab) => { const [x, y] = P(...p); F.arrow(0, 0, x, y, col, lab); };
      ar(a, c.main, "a"); ar(b, c.main, "b");
      const nl = Math.hypot(...n), s = nl > 3.2 ? 3.2 / nl : 1;
      ar(n.map((t) => t * s), c.acc, s < 1 ? "a×b (줄여 그림)" : "a×b");
      const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2], na = 2, nb = Math.hypot(...b);
      S.out(`a = (2, 0, 0),  b = (${b.map((t) => t.toFixed(2)).join(", ")})\n` +
        `a × b = (${n.map((t) => t.toFixed(2)).join(", ")}),  |a × b| = ${nl.toFixed(3)} = 평행사변형의 넓이\n` +
        `(a × b)·a = ${(n[0] * a[0] + n[1] * a[1] + n[2] * a[2]).toFixed(3)},  (a × b)·b = ${(n[0] * b[0] + n[1] * b[1] + n[2] * b[2]).toFixed(3)}  (둘 다 0: 수직)\n` +
        `확인: |a×b|² + (a·b)² = ${(nl * nl + dot * dot).toFixed(3)},  |a|²|b|² = ${(na * na * nb * nb).toFixed(3)}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 극좌표로 바꾼 이중적분 (06-03) */
  (() => {
    const S = QSim.card("lab-c2-polar"); if (!S) return;
    const cv = S.$("canvas");
    const f = (x, y) => Math.exp(-(x * x + y * y));
    function draw() {
      const c = C(), R = S.val("R"), n = S.val("n"), polar = S.val("m") === "polar";
      const v = QSim.view(cv, 0.8), F = QSim.frame(v, { x0: -R - 0.2, x1: R + 0.2, y0: -R - 0.2, y1: R + 0.2, equal: true, xl: "x", yl: "y" });
      const g = v.g; let sum = 0;
      const shade = (val) => { g.fillStyle = c.main; g.globalAlpha = 0.08 + 0.75 * val; };
      g.save();
      if (polar) {
        const dr = R / n, m = 4 * n, dt = (2 * Math.PI) / m;
        for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
          const r = (i + 0.5) * dr, t = (j + 0.5) * dt, val = Math.exp(-r * r);
          sum += val * r * dr * dt; shade(val);
          g.beginPath(); g.arc(F.X(0), F.Y(0), (i + 1) * dr * F.sx, -(j + 1) * dt, -j * dt); g.arc(F.X(0), F.Y(0), i * dr * F.sx, -j * dt, -(j + 1) * dt, true); g.closePath(); g.fill();
          g.globalAlpha = 0.5; g.strokeStyle = c.card; g.stroke();
        }
      } else {
        const h = (2 * R) / n;
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
          const x = -R + (i + 0.5) * h, y = -R + (j + 0.5) * h;
          if (x * x + y * y > R * R) continue;
          const val = f(x, y); sum += val * h * h; shade(val);
          g.fillRect(F.X(x - h / 2), F.Y(y + h / 2), h * F.sx, h * F.sy); g.globalAlpha = 0.5; g.strokeStyle = c.card; g.strokeRect(F.X(x - h / 2), F.Y(y + h / 2), h * F.sx, h * F.sy);
        }
      }
      g.restore();
      g.save(); g.strokeStyle = c.acc; g.lineWidth = 2; g.beginPath(); g.arc(F.X(0), F.Y(0), R * F.sx, 0, 7); g.stroke(); g.restore();
      const ex = Math.PI * (1 - Math.exp(-R * R));
      S.out(`∬ e^(−x²−y²) dA,  영역: 반지름 ${R.toFixed(1)}인 원판\n` +
        (polar ? `극좌표 조각 ${n}×${4 * n}개: Σ e^(−r²) r Δr Δθ = ${sum.toFixed(5)}` : `정사각형 조각(중심이 원 안인 것): Σ f Δx Δy = ${sum.toFixed(5)}`) +
        `\n정확한 값 π(1 − e^(−R²)) = ${ex.toFixed(5)},  오차 ${(sum - ex).toExponential(2)},  R → ∞이면 π = 3.14159`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
