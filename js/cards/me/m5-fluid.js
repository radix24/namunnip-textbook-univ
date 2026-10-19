/* 기계5 유체역학: 벤투리관과 Bernoulli 식 (03-02) / 기계11 응용유체역학: 관 마찰과 Moody 선도 (01-01) */
(() => {
  "use strict";
  const rho = 1000, g = 9.81;

  /* ── 벤투리관 ── */
  (() => {
    const S = QSim.card("lab-me-venturi"); if (!S) return;
    const [cv] = S.$$("canvas"), D = 0.1;
    let parts = [];
    for (let i = 0; i < 70; i++) parts.push([Math.random(), Math.random() * 2 - 1]);
    // 관 지름 분포: x ∈ [0,1], 가운데 0.45~0.55가 목
    const dia = (x, d) => { if (x < 0.25 || x > 0.85) return D; if (x < 0.45) return D + (d - D) * (0.5 - 0.5 * Math.cos(Math.PI * (x - 0.25) / 0.2)); if (x < 0.55) return d; return d + (D - d) * (0.5 - 0.5 * Math.cos(Math.PI * (x - 0.55) / 0.3)); };
    function state() {
      const Q = S.val("Q") / 1000, d = S.val("d") / 1000, Cd = S.val("ideal") ? 1 : 0.98;
      const A1 = Math.PI * D * D / 4, A2 = Math.PI * d * d / 4, V1 = Q / A1, V2 = Q / A2;
      const dp = 0.5 * rho * (V2 * V2 - V1 * V1);
      return { Q, d, A1, A2, V1, V2, dp, Cd };
    }
    function draw() {
      const c = QSim.col(), s = state();
      const v = QSim.view(cv, 0.62), G = v.g, W = v.W, H = v.H;
      const X = (x) => 20 + x * (W - 40), axisY = H * 0.72, sc = (H * 0.32) / D;
      // 관벽
      G.fillStyle = c.soft; G.beginPath();
      for (let i = 0; i <= 100; i++) { const x = i / 100; G.lineTo(X(x), axisY - dia(x, s.d) * sc / 2); }
      for (let i = 100; i >= 0; i--) { const x = i / 100; G.lineTo(X(x), axisY + dia(x, s.d) * sc / 2); }
      G.fill(); G.strokeStyle = c.ink2; G.stroke();
      // 입자 (속도는 지름의 제곱에 반비례)
      G.fillStyle = c.main;
      parts.forEach(([x, y]) => { const r = dia(x, s.d) * sc / 2; G.beginPath(); G.arc(X(x), axisY + y * r * 0.85, 2.2, 0, 7); G.fill(); });
      // 피에조미터: 입구(x=0.15), 목(x=0.5), 출구(x=0.95)
      const pRef = 1.2 * s.dp + 20000; // 입구의 계기압 (보기 좋게 정함)
      const pAt = (x) => { const A = Math.PI * dia(x, s.d) ** 2 / 4, V = s.Q / A; return pRef + 0.5 * rho * (s.V1 * s.V1 - V * V); };
      const hmax = pRef / (rho * g), hs = (axisY - 30 - D * sc / 2) / hmax;
      [[0.15, "1"], [0.5, "2"], [0.95, "3"]].forEach(([x, lb]) => {
        const h = pAt(x) / (rho * g), top = axisY - dia(x, s.d) * sc / 2, y = top - h * hs;
        G.fillStyle = c.card; G.strokeStyle = c.ink3; G.fillRect(X(x) - 5, 22, 10, top - 22); G.strokeRect(X(x) - 5, 22, 10, top - 22);
        G.fillStyle = c.main; G.globalAlpha = 0.55; G.fillRect(X(x) - 5, y, 10, top - y); G.globalAlpha = 1;
        G.fillStyle = c.ink2; G.font = "12px " + getComputedStyle(document.documentElement).getPropertyValue("--f-mono"); G.fillText(lb, X(x) - 3, 16);
      });
      G.fillStyle = c.ink3; G.fillText("유리관의 물 높이 = 그 자리의 압력 수두 p/ρg", 8, H - 6);
      // 가상 측정: 마노미터 높이 차로 유량을 거꾸로 계산
      // 실제 관은 입구와 목 사이 마찰 손실 때문에 높이 차가 이론보다 크다 (유량계수 Cd 가정, 가상 값)
      const dh = s.dp / (rho * g), dhRead = s.Cd < 1 ? Math.round((dh / (s.Cd * s.Cd)) * 1000) / 1000 : dh;
      const Qth = s.A2 * Math.sqrt(2 * g * dhRead / (1 - (s.A2 / s.A1) ** 2));
      S.out(`입구 V₁ = ${s.V1.toFixed(2)} m/s, 목 V₂ = ${s.V2.toFixed(2)} m/s (V₂/V₁ = (D/d)² = ${(s.V2 / s.V1).toFixed(2)})\nBernoulli 압력 차 p₁ − p₂ = ½ρ(V₂² − V₁²) = ${(s.dp / 1000).toFixed(2)} kPa = 물기둥 ${dh.toFixed(3)} m\n${s.Cd < 1 ? `가상 측정 높이 차 ${dhRead.toFixed(3)} m (마찰 손실 때문에 이론보다 크게 읽힘, 가상)\n` : ""}높이 차로 계산한 이상 유량 Q = A₂√(2gΔh/(1 − (A₂/A₁)²)) = ${(Qth * 1000).toFixed(2)} L/s, 실제 ${(s.Q * 1000).toFixed(2)} L/s, 유량계수 Cd = 실제/계산 = ${(s.Q / Qth).toFixed(3)}`);
    }
    const L = QSim.loop((dt) => {
      const s = state(), scale = 0.06 / Math.max(s.V1, 0.01) * Math.min(s.V1, 3);
      parts = parts.map(([x, y]) => { const A = Math.PI * dia(x, s.d) ** 2 / 4; let nx = x + dt * (s.Q / A) * scale; if (nx > 1) nx -= 1; return [nx, y]; });
      draw();
    }).watch(S.root);
    QSim.playButton(S.$(".play"), L);
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* ── Moody 선도 ── */
  (() => {
    const S = QSim.card("lab-me-moody"); if (!S) return;
    const [cv] = S.$$("canvas"), nu = 1.0e-6, Dp = 0.05, Lp = 100;
    const colebrook = (Re, e) => { let f = 0.02; for (let i = 0; i < 50; i++) { const r = -2 * Math.log10(e / 3.7 + 2.51 / (Re * Math.sqrt(f))); f = 1 / (r * r); } return f; };
    const fOf = (Re, e) => (Re < 2300 ? 64 / Re : colebrook(Re, e));
    function draw() {
      const c = QSim.col(), lRe = S.val("lre"), Re = Math.pow(10, lRe), e = Math.pow(10, S.val("le"));
      const v = QSim.view(cv, 0.62), f = QSim.frame(v, { x0: 3, x1: 8, y0: Math.log10(0.008), y1: Math.log10(0.1), pad: 36, noGrid: true });
      const G = v.g; G.save(); G.strokeStyle = c.rule; G.fillStyle = c.ink3; G.font = "11px " + getComputedStyle(document.documentElement).getPropertyValue("--f-mono");
      for (let k = 3; k <= 8; k++) { G.beginPath(); G.moveTo(f.X(k), f.Y(f.y0)); G.lineTo(f.X(k), f.Y(f.y1)); G.stroke(); G.fillText("10^" + k, f.X(k) - (k === 8 ? 30 : 12), v.H - 20); }
      [0.01, 0.02, 0.03, 0.05, 0.1].forEach((y) => { const Y = f.Y(Math.log10(y)); G.beginPath(); G.moveTo(f.X(3), Y); G.lineTo(f.X(8), Y); G.stroke(); G.fillText(String(y), 2, Y + 4); });
      G.fillText("Re", v.W - 22, v.H - 6); G.fillText("f", f.X(3) + 6, 12); G.restore();
      // 층류선
      f.path([[3, Math.log10(64 / 1000)], [Math.log10(2300), Math.log10(64 / 2300)]], c.ink2, 2);
      // 여러 상대 조도의 Colebrook 곡선
      [0, 1e-5, 1e-4, 1e-3, 5e-3, 0.02, 0.05].forEach((ee) => {
        const pts = []; for (let x = Math.log10(4000); x <= 8; x += 0.05) pts.push([x, Math.log10(colebrook(Math.pow(10, x), ee))]);
        f.path(pts, c.ink3, 1);
      });
      const cur = []; for (let x = Math.log10(4000); x <= 8; x += 0.05) cur.push([x, Math.log10(colebrook(Math.pow(10, x), e))]);
      f.path(cur, c.acc, 2.5);
      const fv = fOf(Re, e); f.dot(lRe, Math.log10(fv), c.warn, 5);
      const V = (Re * nu) / Dp, dp = fv * (Lp / Dp) * rho * V * V / 2, hL = dp / (rho * g), Qv = V * Math.PI * Dp * Dp / 4;
      const regime = Re < 2300 ? "층류 (f = 64/Re)" : Re < 4000 ? "천이 구간 (값이 불확실, 여기서는 Colebrook으로 계산)" : "난류 (Colebrook 식)";
      S.out(`Re = ${Re.toExponential(2)}, 상대 조도 ε/D = ${e.toExponential(1)}: ${regime}\n마찰계수 f = ${fv.toFixed(4)}${Re >= 4000 ? `   (매끈한 관이면 ${colebrook(Re, 0).toFixed(4)})` : ""}\n지름 50 mm, 길이 100 m 물 배관: V = ${V.toFixed(3)} m/s, Q = ${(Qv * 1000).toFixed(3)} L/s\n압력 손실 Δp = f(L/D)ρV²/2 = ${(dp / 1000).toFixed(2)} kPa, 손실 수두 h_L = ${hL.toFixed(3)} m`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
