/* 기계6 동역학 2단원: 경사진 커브의 힘 (02-01), 반발계수와 정면 충돌 (02-03) */
(() => {
  "use strict";
  const g = 9.81;

  /* ── 경사진 커브: 필요한 마찰과 속도 범위 ── */
  (() => {
    const S = QSim.card("lab-me-bank"); if (!S) return;
    const [cv] = S.$$("canvas");
    function draw() {
      const c = QSim.col(), R = S.val("R"), th = (S.val("th") * Math.PI) / 180, mu = S.val("mu"), v = S.val("v") / 3.6;
      const an = (v * v) / R, sn = Math.sin(th), cs = Math.cos(th);
      // 단위 질량당: 수직항력 N, 마찰 f (경사면을 따라 커브 중심 쪽 아래가 +)
      const N = g * cs + an * sn, f = an * cs - g * sn, need = Math.abs(f) / N;
      const vd = Math.sqrt(g * R * Math.tan(th));
      const vmaxD = cs - mu * sn, vmax = vmaxD > 0 ? Math.sqrt((g * R * (sn + mu * cs)) / vmaxD) : Infinity;
      const vminN = sn - mu * cs, vmin = vminN > 0 ? Math.sqrt((g * R * vminN) / (cs + mu * sn)) : 0;
      const vw = QSim.view(cv, 0.55), F = QSim.frame(vw, { x0: -3.2, x1: 3.2, y0: -1.3, y1: 2.4, equal: true, pad: 4 }), G = vw.g;
      // 도로 단면: 왼쪽이 커브 중심 쪽(낮음)
      const L = 2.6, road = [[-L * cs, -L * sn], [L * cs, L * sn]];
      F.path(road, c.ink3, 4);
      F.text("← 커브 중심", -3.1, 2.15, c.ink2);
      // 자동차 (경사면 위 상자)
      const box = [[-0.5, 0], [0.5, 0], [0.5, 0.45], [-0.5, 0.45]].map(([x, y]) => [x * cs - y * sn, x * sn + y * cs]);
      G.fillStyle = "rgba(201,140,70,.6)"; G.beginPath(); box.forEach(([x, y], i) => (i ? G.lineTo(F.X(x), F.Y(y)) : G.moveTo(F.X(x), F.Y(y)))); G.closePath(); G.fill();
      const cx = -0.225 * sn, cy = 0.225 * cs, s = 0.12; // 힘 화살표 축척: 1 m/s² → 0.12
      F.arrow(cx, cy, 0, -g * s, c.ink2, "mg");
      F.arrow(0, 0, -sn * N * s, cs * N * s, c.main, "N");
      if (Math.abs(f) > 0.05) F.arrow(0, 0, (-cs * f * s) / 1, (-sn * f * s) / 1, need > mu ? c.warn : c.acc, "f");
      F.arrow(cx, cy + 1.3, -an * s, 0, c.warn, "a_n");
      const dir = f > 0.05 ? "경사 아래(안쪽)로 — 차가 바깥으로 미끄러지려 함" : f < -0.05 ? "경사 위(바깥)로 — 차가 안쪽으로 미끄러지려 함" : "필요 없음 (설계 속도)";
      const ok = need <= mu ? "미끄러지지 않음" : "미끄러짐!";
      S.out(`반지름 ${R} m, 경사 ${S.val("th")}°, μs = ${mu.toFixed(2)}, 속력 ${S.val("v")} km/h (${v.toFixed(1)} m/s) → a_n = ${an.toFixed(2)} m/s²\n질량 1 kg당 수직항력 ${N.toFixed(2)} N, 필요한 마찰 ${Math.abs(f).toFixed(2)} N, 방향: ${dir}\n필요한 마찰계수 ${need.toFixed(3)} → ${ok}\n설계 속도(마찰 0) ${(vd * 3.6).toFixed(1)} km/h, 안전 범위 ${(vmin * 3.6).toFixed(1)} ~ ${isFinite(vmax) ? (vmax * 3.6).toFixed(1) : "∞"} km/h`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

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
