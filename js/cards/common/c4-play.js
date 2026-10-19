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
})();
