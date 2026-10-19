/* 기계6 동역학 4단원: 돌아가는 원판 위의 공 — 땅에서 본 경로와 원판에서 본 경로 (04-03) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-carousel"); if (!S) return;
  const [cv] = S.$$("canvas"), [play] = S.$$(".play");
  const R = 1; // 원판 반지름 1 m
  let t = 0;
  function draw() {
    const c = QSim.col(), w = S.val("w"), v = S.val("v"), tEnd = R / v, tt = Math.min(t, tEnd);
    const vw = QSim.view(cv, 0.5), G = vw.g, W = vw.W, H = vw.H;
    // 두 칸: 왼쪽 땅, 오른쪽 원판
    const panel = (ox, title, frameRot) => {
      const cx = ox + W / 4, cy = H / 2 + 8, s = Math.min(W / 4, H / 2) * 0.82;
      const P = (x, y) => [cx + x * s, cy - y * s];
      G.save();
      G.strokeStyle = c.ink3; G.lineWidth = 1.5; G.beginPath(); G.arc(cx, cy, R * s, 0, 7); G.stroke();
      // 원판에 그린 기준선 (원판과 함께 돈다)
      const ang = frameRot ? 0 : w * tt;
      G.strokeStyle = c.acc; G.lineWidth = 2; G.beginPath(); G.moveTo(...P(0, 0)); G.lineTo(...P(R * Math.cos(ang), R * Math.sin(ang))); G.stroke();
      // 공의 경로: 땅에서는 x축을 따라 직선 (x = v t, y = 0), 원판에서는 −ωt만큼 돌려 본다
      G.strokeStyle = c.main; G.lineWidth = 2.5; G.beginPath();
      for (let i = 0; i <= 120; i++) {
        const q = (tt * i) / 120, x = v * q, a = frameRot ? -w * q : 0;
        const [px, py] = P(x * Math.cos(a), x * Math.sin(a)); i ? G.lineTo(px, py) : G.moveTo(px, py);
      }
      G.stroke();
      const a = frameRot ? -w * tt : 0, [bx, by] = P(v * tt * Math.cos(a), v * tt * Math.sin(a));
      G.fillStyle = c.warn; G.beginPath(); G.arc(bx, by, 6, 0, 7); G.fill();
      G.fillStyle = c.ink2; G.font = "12px sans-serif"; G.textAlign = "center"; G.fillText(title, cx, 14);
      G.restore();
    };
    panel(0, "땅에서 본 모습 (원판이 돈다)", false);
    panel(W / 2, "원판 위에서 본 모습", true);
    const drift = (w * tEnd * 180) / Math.PI;
    S.out(`원판 ${w.toFixed(1)} rad/s (반시계), 공은 중심에서 ${v.toFixed(1)} m/s로 출발해 땅에서 보면 곧게 간다\n가장자리(1 m)까지 ${tEnd.toFixed(2)} s, 그동안 원판은 ${drift.toFixed(0)}° 돈다 → 원판 위에서는 공이 시계 방향(진행 방향의 오른쪽)으로 휘어 보인다\n원판에서 본 출발 직후의 겉보기 가속도(Coriolis) 2ωv = ${(2 * w * v).toFixed(2)} m/s²`);
    return t < tEnd;
  }
  const L = QSim.loop((dt) => { t += dt; return draw(); }).watch(cv);
  QSim.playButton(play, L, () => { t = 0; });
  S.on(() => { t = 1e9; draw(); }); QSim.redrawOn(draw);
  t = 1e9; draw();
})();
