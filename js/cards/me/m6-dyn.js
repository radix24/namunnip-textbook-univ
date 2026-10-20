/* 기계6 동역학 2단원: 반발계수와 정면 충돌 (02-03) */
(() => {
  "use strict";
  const g = 9.81;

  /* ── 정면 충돌: 반발계수 ── */
  (() => {
    const S = QSim.card("lab-me-collide"); if (!S) return;
    const [cv] = S.$$("canvas"), [play] = S.$$(".play");
    let t = 0;
    function state() {
      const mA = S.val("mA"), mB = S.val("mB"), vA = S.val("vA"), vB = S.val("vB"), e = S.val("e");
      const P = mA * vA + mB * vB, uA = (P - mB * e * (vA - vB)) / (mA + mB), uB = (P + mA * e * (vA - vB)) / (mA + mB);
      return { mA, mB, vA, vB, e, uA, uB, P };
    }
    function draw() {
      const c = QSim.col(), s = state(), w = (m) => 0.25 + 0.12 * Math.sqrt(m);
      const xA0 = -2.5, xB0 = 0.5, gap = xB0 - w(s.mB) / 2 - (xA0 + w(s.mA) / 2), closing = s.vA - s.vB;
      const tc = closing > 0 ? gap / closing : Infinity;
      const pos = (x0, v, u) => (t < tc ? x0 + v * t : x0 + v * tc + u * (t - tc));
      const xA = pos(xA0, s.vA, s.uA), xB = pos(xB0, s.vB, s.uB);
      const vw = QSim.view(cv, 0.3), F = QSim.frame(vw, { x0: -4, x1: 6, y0: -0.3, y1: 1.2, equal: true, pad: 4 }), G = vw.g;
      F.path([[-4, 0], [6, 0]], c.ink3, 2);
      const blk = (x, m, col, lb) => { const h = w(m); G.fillStyle = col; G.fillRect(F.X(x - h / 2), F.Y(h), h * F.sx, h * F.sx); F.text(lb, x, h + 0.12, c.ink2, "center"); };
      blk(xA, s.mA, "rgba(75,79,224,.7)", "A"); blk(xB, s.mB, "rgba(201,140,70,.75)", "B");
      const TA = 0.5 * s.mA * s.vA ** 2 + 0.5 * s.mB * s.vB ** 2, TB = 0.5 * s.mA * s.uA ** 2 + 0.5 * s.mB * s.uB ** 2;
      S.out(`충돌 전: v_A = ${s.vA.toFixed(2)}, v_B = ${s.vB.toFixed(2)} m/s, 운동량 ${s.P.toFixed(2)} kg·m/s, 운동 에너지 ${TA.toFixed(2)} J\n충돌 후: v'_A = ${s.uA.toFixed(2)}, v'_B = ${s.uB.toFixed(2)} m/s, 운동량 ${(s.mA * s.uA + s.mB * s.uB).toFixed(2)} kg·m/s, 운동 에너지 ${TB.toFixed(2)} J\n떨어지는 상대 속도 ${(s.uB - s.uA).toFixed(2)} = e × 다가오는 상대 속도 ${(s.vA - s.vB).toFixed(2)}, 에너지 손실 ${TA > 0 ? ((100 * (TA - TB)) / TA).toFixed(1) : "0.0"}%${closing <= 0 ? "\n(A가 B를 따라잡지 못해 충돌하지 않음)" : ""}`);
      return Math.max(Math.abs(xA), Math.abs(xB)) < 7 && t < 20;
    }
    const L = QSim.loop((dt) => { t += dt; return draw(); }).watch(cv);
    QSim.playButton(play, L, () => { t = 0; });
    S.$(".reset").addEventListener("click", () => { L.stop(); t = 0; draw(); });
    S.on(() => { t = 0; draw(); }); QSim.redrawOn(draw); draw();
  })();
})();
