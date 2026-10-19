/* 기계5 유체역학 5단원: 퍼텐셜 유동의 유선 (05-01), Couette-Poiseuille 속도 분포 (05-02) */
(() => {
  "use strict";

  /* ── 기본 흐름의 겹침: 유동함수 등고선 ── */
  (() => {
    const S = QSim.card("lab-me-potential"); if (!S) return;
    const [cv] = S.$$("canvas");
    const X0 = -3, X1 = 3, Y0 = -1.8, Y1 = 1.8, NX = 150, NY = 90;
    // 등고선(marching squares). jump보다 크게 튀는 칸(가지 자름, 특이점)은 건너뛴다
    function contour(f, psi, mask, levels, color, w, jump) {
      const dx = (X1 - X0) / NX, dy = (Y1 - Y0) / NY, P = [], M = [];
      for (let j = 0; j <= NY; j++) { P.push([]); M.push([]); for (let i = 0; i <= NX; i++) { const x = X0 + i * dx, y = Y0 + j * dy; P[j].push(psi(x, y)); M[j].push(mask(x, y)); } }
      const segs = [];
      for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
        if (M[j][i] || M[j][i + 1] || M[j + 1][i] || M[j + 1][i + 1]) continue;
        const a = P[j][i], b = P[j][i + 1], c = P[j + 1][i + 1], d = P[j + 1][i];
        if (Math.max(a, b, c, d) - Math.min(a, b, c, d) > jump) continue;
        const x = X0 + i * dx, y = Y0 + j * dy;
        for (const L of levels) {
          const pts = [];
          const e = (p, q, x1, y1, x2, y2) => { if ((p - L) * (q - L) < 0) { const t = (L - p) / (q - p); pts.push([x1 + t * (x2 - x1), y1 + t * (y2 - y1)]); } };
          e(a, b, x, y, x + dx, y); e(b, c, x + dx, y, x + dx, y + dy); e(c, d, x + dx, y + dy, x, y + dy); e(d, a, x, y + dy, x, y);
          if (pts.length >= 2) segs.push([pts[0], pts[1]]);
          if (pts.length === 4) segs.push([pts[2], pts[3]]);
        }
      }
      segs.forEach((s) => f.path(s, color, w));
    }
    function draw() {
      const c = QSim.col(), kind = S.val("f"), p = S.val("p"), v = QSim.view(cv, 0.6);
      const f = QSim.frame(v, { x0: X0, x1: X1, y0: Y0, y1: Y1, equal: true, pad: 4 }), G = v.g;
      const levels = []; for (let L = -3; L <= 3.001; L += 0.2) levels.push(+L.toFixed(2));
      let psi, mask = () => false, jump = 1e9, msg = "";
      if (kind === "half") {
        const m = p; psi = (x, y) => y + (m / (2 * Math.PI)) * Math.atan2(y, x); jump = m > 0 ? m / 2 : 1e9;
        contour(f, psi, mask, levels, c.ink3, 1.2, jump);
        contour(f, psi, mask, [m / 2 - 1e-6, -m / 2 + 1e-6], c.acc, 2.5, jump);
        const xs = -m / (2 * Math.PI); f.dot(xs, 0, c.warn, 5);
        msg = `균일 흐름 U = 1 m/s + 원점의 원천 m = ${m.toFixed(1)} m²/s (깊이당 유량)\n정체점(빨강) x = −m/(2πU) = ${xs.toFixed(3)} m\n몸체 경계(굵은 선)는 ψ = ±m/2인 유선, 하류 멀리 폭 m/U = ${m.toFixed(2)} m\n원천에서 나온 유체는 경계 안에만 머물고, 바깥 흐름은 경계를 고체 벽처럼 비켜 간다`;
      } else if (kind === "cyl") {
        const Gm = p; psi = (x, y) => { const r2 = x * x + y * y; return y * (1 - 1 / r2) + (Gm / (2 * Math.PI)) * 0.5 * Math.log(r2); };
        mask = (x, y) => x * x + y * y < 0.98;
        contour(f, psi, mask, levels, c.ink3, 1.2, 1e9);
        G.fillStyle = "rgba(201,140,70,.55)"; G.beginPath(); G.arc(f.X(0), f.Y(0), f.sx, 0, 7); G.fill();
        const s = -Gm / (4 * Math.PI), top = 2 + Gm / (2 * Math.PI), bot = Math.abs(2 - Gm / (2 * Math.PI));
        let st;
        if (Math.abs(s) <= 1) { const t = Math.asin(s); [[Math.cos(t), s], [-Math.cos(t), s]].forEach(([x, y]) => f.dot(x, y, c.warn, 5)); st = `표면 정체점 각 θ = ${((t * 180) / Math.PI).toFixed(1)}°, ${(-180 - (t * 180) / Math.PI).toFixed(1)}°`; }
        else { st = "정체점이 원주를 떠나 흐름 속(아래쪽)으로 나간다 (Γ > 4πUa)"; }
        msg = `균일 흐름 U = 1 m/s + 이중극(반지름 a = 1 m 원주) + 시계 방향 순환 Γ = ${Gm.toFixed(1)} m²/s\n${st}\n윗면 속도 ${top.toFixed(3)} U, 아랫면 속도 ${bot.toFixed(3)} U → 압력계수 C_p 윗면 ${(1 - top * top).toFixed(2)}, 아랫면 ${(1 - bot * bot).toFixed(2)}\n양력(공기 1.2 kg/m³) L' = ρUΓ = ${(1.2 * Gm).toFixed(2)} N/m, 항력 0 (d'Alembert 역설)`;
      } else {
        const k = p; psi = (x, y) => k * x * y;
        contour(f, psi, mask, levels.map((L) => L * 1), c.ink3, 1.2, 1e9);
        f.dot(0, 0, c.warn, 5);
        msg = `정체점 유동 ψ = kxy, k = ${k.toFixed(1)} s⁻¹: u = kx, v = −ky\n유선 xy = 일정(쌍곡선), 원점이 정체점, 와도 0\n유선 간격 0.2 m²/s: 원점에서 멀수록 유선이 촘촘해져 빠르다`;
      }
      S.out(msg);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* ── Couette-Poiseuille: 움직이는 윗판 + 압력 기울기 ── */
  (() => {
    const S = QSim.card("lab-me-couette"); if (!S) return;
    const [cv] = S.$$("canvas");
    function draw() {
      const c = QSim.col(), U = S.val("U"), G = S.val("G"), mu = S.val("mu") / 1000, h = S.val("h") / 1000;
      // u(y) = U y/h + (G/2μ) y(h−y), G = −dP/dx
      const u = (y) => (U * y) / h + (G / (2 * mu)) * y * (h - y);
      const q = (U * h) / 2 + (G * h ** 3) / (12 * mu), tau0 = mu * (U / h + (G * h) / (2 * mu)), tauh = mu * (U / h - (G * h) / (2 * mu));
      let umin = 0, umax = Math.max(U, 0.01); for (let i = 0; i <= 100; i++) { const w = u((h * i) / 100); umin = Math.min(umin, w); umax = Math.max(umax, w); }
      const span = Math.max(umax - umin, 0.01), v = QSim.view(cv, 0.6);
      const f = QSim.frame(v, { x0: umin - 0.1 * span, x1: umax + 0.25 * span, y0: 0, y1: h * 1000 * 1.08, xl: "u (m/s)", yl: "y (mm)", pad: 34 });
      f.axes();
      f.path([[f.x0, h * 1000], [f.x1, h * 1000]], c.ink2, 3);
      f.path([[f.x0, 0], [f.x1, 0]], c.ink2, 3);
      const pts = []; for (let i = 0; i <= 100; i++) { const y = (h * i) / 100; pts.push([u(y), y * 1000]); }
      f.path(pts, c.main, 2.5);
      for (let i = 1; i < 10; i++) { const y = (h * i) / 10, w = u(y); f.arrow(0, y * 1000, w, 0, c.ink3); }
      if (U) f.arrow(0, h * 1000 * 1.04, U, 0, c.acc, "U");
      const back = umin < -1e-9 ? `역류 있음 (최소 속도 ${umin.toFixed(4)} m/s)` : "역류 없음";
      S.out(`윗판 속도 U = ${U} m/s, −dP/dx = ${G} Pa/m, μ = ${(mu * 1000).toFixed(0)} mPa·s, 간격 h = ${(h * 1000).toFixed(1)} mm
유량 q = Uh/2 + (−dP/dx)h³/(12μ) = ${(q * 1000).toFixed(4)} L/s (깊이 1 m당)
벽 전단 응력 μ du/dy: 아랫벽 ${tau0.toFixed(3)} Pa, 윗벽 ${tauh.toFixed(3)} Pa
${back}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
