/* 공통4 체험 카드 묶음 2: 막대 전하의 전기장을 조각의 합으로 구하기. */
(() => {
  "use strict";
  const C = () => QSim.col();
  const k = 8.988e9;

  /* 1. 막대 전하의 전기장 (01-02) */
  (() => {
    const S = QSim.card("lab-c4-linecharge"); if (!S) return;
    const cv = S.$("canvas"), L = 2;
    function draw() {
      const c = C(), Q = S.val("Q") * 1e-9, d = S.val("d"), n = S.val("n");
      const v = QSim.view(cv, 0.6), F = QSim.frame(v, { x0: -1.6, x1: 1.6, y0: -0.3, y1: 3.4, equal: true, xl: "x (m)", yl: "y (m)" }); F.axes({ noGrid: true });
      F.path([[-L / 2, 0], [L / 2, 0]], c.soft, 8);
      let Ex = 0, Ey = 0; const parts = [];
      for (let i = 0; i < n; i++) {
        const x = -L / 2 + ((i + 0.5) * L) / n, q = Q / n, r2 = x * x + d * d, r = Math.sqrt(r2), E = (k * q) / r2;
        const ex = (E * -x) / r, ey = (E * d) / r; Ex += ex; Ey += ey; parts.push([x, ex, ey]);
        F.dot(x, 0, c.main, 3);
      }
      const Eex = (k * Q) / (d * Math.sqrt(d * d + (L / 2) ** 2));
      const sc = 1.2 / Math.max(Ey, 1e-30);
      if (n <= 30) parts.forEach(([x, ex, ey]) => { F.path([[x, 0], [0, d]], c.rule, 0.8, [2, 3]); F.arrow(0, d, ex * sc, ey * sc, c.ink3); });
      F.arrow(0, d, Ex * sc, Ey * sc, c.acc, "E");
      F.dot(0, d, c.ink, 5); F.text("P", 0.08, d - 0.18, c.ink);
      S.out(`막대 길이 2 m, 전체 전하 Q = ${S.val("Q")} nC, P는 막대 가운데에서 위로 d = ${d.toFixed(2)} m\n` +
        `점전하 ${n}개로 나눠 더한 E = (${Math.abs(Ex) < 1e-9 * Math.abs(Ey) ? "0" : Ex.toExponential(2)}, ${Ey.toFixed(2)}) N/C  (가로 성분은 대칭으로 지워짐)\n` +
        `적분으로 구한 E = kQ / (d√(d² + (L/2)²)) = ${Eex.toFixed(2)} N/C,  차이 ${(((Ey - Eex) / Eex) * 100).toFixed(3)}%\n` +
        `비교: 점전하로 본 kQ/d² = ${((k * Q) / (d * d)).toFixed(2)},  무한 직선으로 본 2kλ/d = ${((2 * k * Q) / L / d).toFixed(2)} N/C`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
  /* 2. 전지의 내부 저항과 전달 전력 (05-01) */
  (() => {
    const S = QSim.card("lab-c4-power"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), E = S.val("E"), r = S.val("r"), R = S.val("R");
      const P = (x) => (E * E * x) / ((x + r) * (x + r));
      const Pmax = (E * E) / (4 * r);
      const v = QSim.view(cv, 0.55), F = QSim.frame(v, { x0: 0, x1: 10, y0: 0, y1: Pmax * 1.25, xl: "부하 저항 R (Ω)", yl: "P (W)" }); F.axes();
      F.fn(P, c.main, 2.5, null, 400);
      F.path([[r, 0], [r, Pmax]], c.ink3, 1, [4, 4]);
      F.dot(R, P(R), c.acc, 6);
      const I = E / (R + r), V = I * R;
      S.out(`기전력 ε = ${E.toFixed(1)} V, 내부 저항 r = ${r.toFixed(2)} Ω, 부하 R = ${R.toFixed(2)} Ω\n` +
        `전류 I = ε/(R + r) = ${I.toFixed(3)} A,  단자 전압 V = IR = ε − Ir = ${V.toFixed(3)} V\n` +
        `부하 전력 P = I²R = ${P(R).toFixed(3)} W,  전지 안에서 열로 잃는 전력 I²r = ${(I * I * r).toFixed(3)} W,  효율 ${((100 * R) / (R + r)).toFixed(1)}%\n` +
        `P가 가장 큰 것은 R = r = ${r.toFixed(2)} Ω일 때이고 그때 P = ε²/(4r) = ${Pmax.toFixed(3)} W (효율 50%)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
  /* 3. 가우스 곡면을 지나는 선속을 직접 더해 보기 (02-01) */
  (() => {
    const S = QSim.card("lab-c4-gauss"); if (!S) return;
    const cv = S.$("canvas");
    /* 원점이 중심인 반지름 R인 구면을 위도·경도 조각으로 나누고, 조각마다 E·n dA를 더한다.
       단위: 전하는 q, 선속은 q/ε0 단위로 나타낸다 (ε0Φ = Σ q_i/(4π) ∮ (r - r_i)·n / |r - r_i|³ dA). */
    function flux(R, Q) {
      const nt = 120, np = 120; let sum = 0;
      for (let i = 0; i < nt; i++) {
        const th = ((i + 0.5) / nt) * Math.PI, st = Math.sin(th), ct = Math.cos(th);
        const dA = R * R * st * (Math.PI / nt) * ((2 * Math.PI) / np);
        for (let j = 0; j < np; j++) {
          const ph = ((j + 0.5) / np) * 2 * Math.PI, nx = st * Math.cos(ph), ny = st * Math.sin(ph), nz = ct;
          const px = R * nx, py = R * ny, pz = R * nz;
          for (const [q, x, y] of Q) { const dx = px - x, dy = py - y, dz = pz, r3 = Math.pow(dx * dx + dy * dy + dz * dz, 1.5); sum += (q * (dx * nx + dy * ny + dz * nz) * dA) / r3; }
        }
      }
      return sum / (4 * Math.PI);
    }
    function draw() {
      const c = C(), R = S.val("R"), x1 = S.val("x1"), q2 = S.val("q2"), x2 = S.val("x2");
      const Q = [[1, x1, 0], [q2, x2, 0.6]];
      const v = QSim.view(cv, 0.62), F = QSim.frame(v, { x0: -3.2, x1: 3.2, y0: -2, y1: 2, equal: true }); F.axes({ noGrid: true });
      /* 전기장 화살표: 방향만 보이도록 길이를 줄여서 */
      for (let gx = -3; gx <= 3.01; gx += 0.4) for (let gy = -1.8; gy <= 1.81; gy += 0.4) {
        let ex = 0, ey = 0, near = false;
        for (const [q, x, y] of Q) { const dx = gx - x, dy = gy - y, r2 = dx * dx + dy * dy; if (r2 < 0.04) near = true; const r3 = Math.pow(r2, 1.5); ex += (q * dx) / r3; ey += (q * dy) / r3; }
        const m = Math.hypot(ex, ey); if (near || m < 1e-9) continue;
        const L = 0.12 + 0.18 * Math.min(1, m / 2);
        F.arrow(gx - (ex / m) * L / 2, gy - (ey / m) * L / 2, (ex / m) * L, (ey / m) * L, c.rule);
      }
      const circ = []; for (let k = 0; k <= 120; k++) { const a = (k / 120) * 2 * Math.PI; circ.push([R * Math.cos(a), R * Math.sin(a)]); }
      F.path(circ, c.main, 2.5);
      Q.forEach(([q, x, y], i) => { if (Math.abs(q) < 1e-9) return; F.dot(x, y, q > 0 ? c.warn : c.main, 7); F.text((q > 0 ? "+" : "") + q.toFixed(1) + "q", x + 0.12, y + 0.22, c.ink); });
      const inside = Q.filter(([q, x, y]) => Math.hypot(x, y) < R).reduce((s, [q]) => s + q, 0);
      const Phi = flux(R, Q);
      const st = Q.map(([q, x, y], i) => `전하 ${i + 1} (${(q > 0 ? "+" : "") + q.toFixed(1)}q): 중심에서 ${Math.hypot(x, y).toFixed(2)}, ${Math.hypot(x, y) < R ? "안" : "밖"}`).join(",  ");
      S.out(`가우스 곡면: 반지름 ${R.toFixed(2)}인 구면 (그림은 가운데 단면)\n${st}\n조각 14400개로 더한 선속 ε₀Φ = ${Phi.toFixed(3)} q,  안에 든 전하의 합 = ${inside.toFixed(3)} q`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
  /* 4. 전자기파: 전기장과 자기장의 진동, 세기와 복사압 (09-02) */
  (() => {
    const S = QSim.card("lab-c4-wave"); if (!S) return;
    const cv = S.$("canvas"), c0 = 2.998e8, e0 = 8.854e-12;
    function draw() {
      const c = C(), E = S.val("E"), ph = (S.val("t") / 360) * 2 * Math.PI, refl = S.val("r");
      const v = QSim.view(cv, 0.5), F = QSim.frame(v, { x0: -0.3, x1: 4.3, y0: -1.5, y1: 1.5, equal: false, pad: 20 });
      /* 진행 방향 x는 오른쪽, 전기장 y는 위, 자기장 z는 비스듬히 아래(빗금으로 깊이를 나타냄) */
      const zx = 0.28, zy = -0.45;
      F.path([[0, 0], [4.2, 0]], c.ink3, 1.5); F.text("진행 방향 x", 4.1, 0.15, c.ink, "right");
      const Ep = [], Bp = [];
      for (let k = 0; k <= 200; k++) {
        const x = (k / 200) * 4, s = Math.sin(2 * Math.PI * (x / 2) - ph);
        Ep.push([x, s]); Bp.push([x + zx * s, zy * s]);
        if (k % 8 === 0) { F.path([[x, 0], [x, s]], c.main, 1); F.path([[x, 0], [x + zx * s, zy * s]], c.warn, 1); }
      }
      F.path(Ep, c.main, 2.5); F.path(Bp, c.warn, 2.5);
      F.text("E", 0.5, 1.25, c.main, "center"); F.text("B", 0.62, -0.75, c.warn, "center");
      const B = E / c0, I = 0.5 * c0 * e0 * E * E, P = (refl ? 2 : 1) * I / c0;
      S.out(`전기장 최댓값 E = ${E.toFixed(0)} V/m → 자기장 최댓값 B = E/c = ${(B * 1e6).toFixed(3)} μT\n` +
        `세기(시간 평균) I = ½cε₀E² = ${I.toFixed(1)} W/m²\n` +
        `복사압 = ${refl ? "2I/c (완전 반사)" : "I/c (완전 흡수)"} = ${P.toExponential(2)} Pa,  1 m²에 미는 힘 ${(P * 1e6).toFixed(2)} μN`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
