/* 공통3 실습: 구르기 경주 (06-03) */
(() => {
  "use strict";
  const S = QSim.card("lab-c3-rolling"); if (!S) return;
  const cv = S.$("canvas"), G = 9.8, LEN = 2, R = 0.09;
  const objs = [
    { n: "미끄러지는 상자 (마찰 없음)", c: 0, box: true },
    { n: "꽉 찬 구", c: 2 / 5 },
    { n: "원판", c: 1 / 2 },
    { n: "속이 빈 구", c: 2 / 3 },
    { n: "고리", c: 1 }
  ];
  let t = 0;
  const acc = (o) => (G * Math.sin((S.val("th") * Math.PI) / 180)) / (1 + o.c);
  const tEnd = (o) => Math.sqrt((2 * LEN) / acc(o));
  function draw() {
    const C = QSim.col(), v = QSim.view(cv, 0.62);
    const f = QSim.frame(v, { x0: -0.1, x1: LEN + 0.15, y0: -0.2, y1: objs.length * 0.36, pad: 12 });
    const g = v.g;
    f.path([[LEN, -0.1], [LEN, objs.length * 0.36 - 0.1]], C.warn, 1.5, [4, 3]);
    objs.forEach((o, i) => {
      const y = (objs.length - 1 - i) * 0.36, s = Math.min(LEN, 0.5 * acc(o) * t * t);
      f.path([[0, y], [LEN, y]], C.rule, 1);
      const col = o.box ? C.ink3 : i % 2 ? C.main : C.acc;
      if (o.box) { g.fillStyle = col; g.fillRect(f.X(s - R), f.Y(y + 2 * R), f.X(s + R) - f.X(s - R), f.Y(y) - f.Y(y + 2 * R)); }
      else {
        const cx = f.X(s), cy = f.Y(y + R), r = f.X(R) - f.X(0), ang = -s / R;
        g.save(); g.strokeStyle = col; g.lineWidth = o.c === 1 ? 3 : 2; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke();
        if (o.c < 1) { g.globalAlpha = o.c === 2 / 3 ? 0.25 : 0.6; g.fillStyle = col; g.fill(); g.globalAlpha = 1; }
        g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + r * Math.cos(ang), cy + r * Math.sin(ang)); g.strokeStyle = C.ink; g.lineWidth = 1.5; g.stroke(); g.restore();
      }
      f.text(o.n, 0.02, y + 0.26, C.ink2);
    });
    S.out(`경사각 ${S.val("th")}°, 경사면 길이 ${LEN} m. 도착 시간 t = √(2L/a), a = g sinθ / (1 + I/MR²)\n` +
      objs.map((o) => `${o.n}: I/MR² = ${o.c === 0 ? "0" : o.c.toFixed(2)} → ${tEnd(o).toFixed(3)} s`).join("\n"));
  }
  const L = QSim.loop((dt) => { t += dt * 0.5; const T = Math.max(...objs.map(tEnd)); if (t >= T) { t = T; draw(); return false; } draw(); }).watch(S.root);
  const setBtn = QSim.playButton(S.$(".play"), L, () => { if (t >= Math.max(...objs.map(tEnd)) - 1e-9) t = 0; });
  S.on(() => { L.stop(); setBtn(); t = 0; draw(); });
  QSim.redrawOn(draw); draw();
})();
