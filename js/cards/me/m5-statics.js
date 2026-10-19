/* 기계5 유체역학 2단원: 기울어진 수문의 압력 분포 (02-02), 떠 있는 상자의 안정성 (02-03) */
(() => {
  "use strict";
  const g = 9.81, rho = 1000;

  /* ── 수문: 압력 분포, 합력, 압력 중심 ── */
  (() => {
    const S = QSim.card("lab-me-gate"); if (!S) return;
    const [cv] = S.$$("canvas");
    function draw() {
      const c = QSim.col(), th = (S.val("th") * Math.PI) / 180, d = S.val("d"), L = S.val("L"), b = 2;
      const yc = d / Math.sin(th) + L / 2, hc = yc * Math.sin(th), A = b * L, F = rho * g * hc * A, Ic = (b * L ** 3) / 12, yp = yc + Ic / (yc * A);
      const y0 = d / Math.sin(th), dp = yp - y0; // 윗변 경첩에서 압력 중심까지(면을 따라)
      const R = (F * dp) / L; // 아랫변에서 막는 힘
      const v = QSim.view(cv, 0.62), D = d + L * Math.sin(th);
      const f = QSim.frame(v, { x0: -0.5, x1: Math.max(L * Math.cos(th) + 4, 6), y0: -D - 0.5, y1: 1, equal: true, pad: 4 }), G = v.g;
      // 물
      G.fillStyle = "rgba(75,79,224,.12)"; G.fillRect(f.X(-0.5), f.Y(0), f.X(f.x1) - f.X(-0.5), f.Y(-D - 0.5) - f.Y(0));
      f.path([[-0.5, 0], [f.x1, 0]], c.main, 1.5);
      // 수문 (윗끝 (0, -d)에서 아래 오른쪽으로)
      const P = (s) => [s * Math.cos(th), -d - s * Math.sin(th)];
      f.path([P(0), P(L)], c.ink, 5);
      // 압력 화살표 (면에 수직, 깊이에 비례)
      const nx = Math.sin(th), ny = Math.cos(th), pmax = rho * g * D, sc = 2.5 / pmax;
      // 물은 수문 위쪽(법선 (sin θ, cos θ) 쪽)에 있으므로 화살표가 그쪽에서 수문을 향한다
      for (let i = 0; i <= 8; i++) { const s = (L * i) / 8, [x, y] = P(s), len = rho * g * (-y) * sc; f.arrow(x + nx * len, y + ny * len, -nx * len * 0.97, -ny * len * 0.97, c.ink3); }
      // 합력과 압력 중심
      const sp = dp, [px, py] = P(sp); f.dot(px, py, c.warn, 6);
      const [cx, cy] = P(L / 2); f.dot(cx, cy, c.ink2, 4);
      f.text("경첩", P(0)[0] + 0.15, P(0)[1] + 0.2, c.ink2);
      S.out(`수문 폭 2 m, 길이 ${L} m, 수평과 ${S.val("th")}°, 윗변 깊이 ${d} m\n도심 깊이 h_c = ${hc.toFixed(3)} m, 합력 F = ρg h_c A = ${(F / 1000).toFixed(1)} kN\n압력 중심(빨간 점): 면을 따라 경첩에서 ${dp.toFixed(3)} m (도심 ${(L / 2).toFixed(3)} m보다 ${(dp - L / 2).toFixed(3)} m 깊은 쪽), 아랫변에서 막는 힘 ${(R / 1000).toFixed(1)} kN`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* ── 떠 있는 직육면체: 흘수, B, G, M ── */
  (() => {
    const S = QSim.card("lab-me-float"); if (!S) return;
    const [cv] = S.$$("canvas");
    function draw() {
      const c = QSim.col(), w = S.val("w"), h = S.val("h"), s = S.val("s"), tilt = (S.val("tilt") * Math.PI) / 180, Lb = 2;
      const draft = s * h, B = draft / 2, Gz = h / 2, V = w * Lb * draft, I = (Lb * w ** 3) / 12, BM = I / V, GM = BM - (Gz - B);
      const v = QSim.view(cv, 0.62), f = QSim.frame(v, { x0: -1.2, x1: 1.2, y0: -1.0, y1: 1.0, equal: true, pad: 4 }), G = v.g;
      G.fillStyle = "rgba(75,79,224,.12)"; G.fillRect(f.X(-1.2), f.Y(0), f.X(1.2) - f.X(-1.2), f.Y(-1) - f.Y(0)); f.path([[-1.2, 0], [1.2, 0]], c.main, 1.5);
      // 상자: 바닥 가운데를 (0, -draft)로 두고 tilt만큼 돌림 (작은 각 근사 그림)
      const rot = ([x, y]) => [x * Math.cos(tilt) - y * Math.sin(tilt), x * Math.sin(tilt) + y * Math.cos(tilt)];
      const off = (p) => { const [x, y] = rot(p); return [x, y - draft]; };
      const box = [[-w / 2, 0], [w / 2, 0], [w / 2, h], [-w / 2, h]].map(off);
      G.fillStyle = "rgba(201,140,70,.55)"; G.strokeStyle = c.ink2; G.beginPath(); box.forEach(([x, y], i) => (i ? G.lineTo(f.X(x), f.Y(y)) : G.moveTo(f.X(x), f.Y(y)))); G.closePath(); G.fill(); G.stroke();
      const Gp = off([0, Gz]), Mp = off([0, B + BM]);
      // 기울어진 뒤 부심: 메타센터에서 연직 아래로 BM 떨어진 곳 (작은 각 근사)
      const Bx = Mp[0], By = Mp[1] - BM;
      f.dot(Gp[0], Gp[1], c.warn, 5); f.text("G", Gp[0] + 0.04, Gp[1], c.warn);
      f.dot(Bx, By, c.main, 5); f.text("B", Bx + 0.04, By - 0.04, c.main);
      if (BM < 3) { f.dot(Mp[0], Mp[1], c.acc, 5); f.text("M", Mp[0] + 0.04, Mp[1] + 0.03, c.acc); }
      f.arrow(Gp[0], Gp[1], 0, -0.3, c.warn); f.arrow(Bx, By, 0, 0.3, c.main);
      const torque = GM > 0 ? "되돌리는 쪽 (안정)" : "더 넘어뜨리는 쪽 (불안정)";
      S.out(`상자 폭 ${w} m × 높이 ${h} m × 길이 2 m, 밀도비 ${s.toFixed(2)} → 흘수 ${draft.toFixed(3)} m\n부심 B = ${B.toFixed(3)} m, 무게 중심 G = ${Gz.toFixed(3)} m (바닥에서), BM = I/V = ${BM.toFixed(3)} m\nGM = BM − BG = ${GM.toFixed(3)} m → 기울면 짝힘이 ${torque}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
