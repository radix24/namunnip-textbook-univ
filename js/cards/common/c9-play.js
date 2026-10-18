/* 공통9 체험 카드 묶음 2: 복소수의 극형식, 거듭제곱과 거듭제곱근. */
(() => {
  "use strict";
  const C = () => QSim.col();

  /* 1. 극형식으로 본 z^n과 n제곱근 (03-02) */
  (() => {
    const S = QSim.card("lab-c9-roots"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), r = S.val("r"), thd = S.val("th"), n = S.val("n"), th = (thd * Math.PI) / 180;
      const v = QSim.view(cv, 0.8), F = QSim.frame(v, { x0: -2.4, x1: 2.4, y0: -2.4, y1: 2.4, equal: true, xl: "Re", yl: "Im" }); F.axes();
      const g = v.g; g.save(); g.strokeStyle = c.rule; g.setLineDash([4, 4]); g.beginPath(); g.arc(F.X(0), F.Y(0), F.sx, 0, 7); g.stroke(); g.restore();
      const zr = r * Math.cos(th), zi = r * Math.sin(th), Rn = Math.pow(r, n), tn = n * th;
      F.arrow(0, 0, zr, zi, c.main, "z");
      const wr = Rn * Math.cos(tn), wi = Rn * Math.sin(tn), sc = Rn > 2.3 ? 2.3 / Rn : 1;
      F.arrow(0, 0, wr * sc, wi * sc, c.acc, `z^${n}` + (sc < 1 ? " (줄여 그림)" : ""));
      const rr = Math.pow(r, 1 / n), roots = [];
      for (let k = 0; k < n; k++) { const a = (th + 2 * Math.PI * k) / n; roots.push([rr * Math.cos(a), rr * Math.sin(a), a]); }
      F.path([...roots.map(([x, y]) => [x, y]), [roots[0][0], roots[0][1]]], c.ink3, 1, [3, 3]);
      roots.forEach(([x, y], k) => { F.dot(x, y, c.warn, 5); F.text(`w${k}`, x + 0.08, y + 0.08, c.warn); });
      const deg = (a) => ((((a * 180) / Math.PI) % 360) + 360) % 360;
      S.out(`z = ${r.toFixed(2)}(cos ${thd}° + i sin ${thd}°) = ${zr.toFixed(3)} ${zi < 0 ? "−" : "+"} ${Math.abs(zi).toFixed(3)}i\n` +
        `드무아브르: z^${n} = ${r.toFixed(2)}^${n}(cos ${(n * thd).toFixed(0)}° + i sin ${(n * thd).toFixed(0)}°),  크기 ${Rn.toFixed(3)}, 각 ${deg(tn).toFixed(1)}°\n` +
        `w^${n} = z인 w (빨간 점) ${n}개: 크기 ${rr.toFixed(4)}, 각 ${roots.map((q) => deg(q[2]).toFixed(1) + "°").join(", ")}  (원 위에 ${(360 / n).toFixed(1)}°씩 고르게 놓임)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
