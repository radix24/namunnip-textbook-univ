/* 공통8 체험 카드 묶음 2: 두 탱크의 혼합, 르장드르 다항식, 충격(델타 함수) 응답. */
(() => {
  "use strict";
  const C = () => QSim.col();

  /* 1. 두 탱크의 소금물 혼합 (03-02) */
  (() => {
    const S = QSim.card("lab-c8-tanks"); if (!S) return;
    const cv = S.$("canvas");
    /* 탱크 1, 2 모두 부피 V L. 탱크 1 → 2로 q L/min, 2 → 1로 q L/min 순환 (닫힌 계).
       y1' = −(q/V) y1 + (q/V) y2,  y2' = (q/V) y1 − (q/V) y2 */
    function draw() {
      const c = C(), V = S.val("V"), q = S.val("q"), y10 = S.val("y1"), T = 60;
      const k = q / V, avg = (y10 + 0) / 2;
      const y1 = (t) => avg + (y10 - avg) * Math.exp(-2 * k * t), y2 = (t) => avg - (y10 - avg) * Math.exp(-2 * k * t);
      const v = QSim.view(cv, 0.55), F = QSim.frame(v, { x0: 0, x1: T, y0: 0, y1: Math.max(10, y10 * 1.1), xl: "t (분)", yl: "소금 (kg)" }); F.axes();
      F.fn(y1, c.main, 2.5); F.fn(y2, c.acc, 2.5);
      F.path([[0, avg], [T, avg]], c.ink3, 1, [4, 4]);
      const th = Math.log(2) / (2 * k);
      S.out(`부피 각 ${V} L, 순환 흐름 ${q} L/분, 처음 소금: 탱크 1 ${y10} kg, 탱크 2 0 kg\n` +
        `y₁′ = −(q/V)y₁ + (q/V)y₂,  y₂′ = (q/V)y₁ − (q/V)y₂,  q/V = ${k.toFixed(3)}/분\n` +
        `고유값 0과 −2q/V = ${(-2 * k).toFixed(3)}:  y₁ = ${avg.toFixed(1)} + ${(y10 - avg).toFixed(1)}e^(${(-2 * k).toFixed(3)}t),  y₂ = ${avg.toFixed(1)} − ${(y10 - avg).toFixed(1)}e^(${(-2 * k).toFixed(3)}t)\n` +
        `t = 10분: y₁ = ${y1(10).toFixed(2)}, y₂ = ${y2(10).toFixed(2)} kg.  두 탱크의 차가 절반이 되는 시간 ${th.toFixed(2)}분`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 르장드르 다항식과 직교성 (04-02) */
  (() => {
    const S = QSim.card("lab-c8-legendre"); if (!S) return;
    const cv = S.$("canvas");
    /* 점화식 (n+1)P_{n+1} = (2n+1) x P_n − n P_{n−1} */
    const Pn = (n, x) => { let a = 1, b = x; if (n === 0) return 1; for (let k = 1; k < n; k++) { const c2 = ((2 * k + 1) * x * b - k * a) / (k + 1); a = b; b = c2; } return b; };
    const integ = (f) => { const N = 2000, h = 2 / N; let s = f(-1) + f(1); for (let i = 1; i < N; i++) s += (i % 2 ? 4 : 2) * f(-1 + i * h); return (s * h) / 3; };
    function draw() {
      const c = C(), n = S.val("n"), m = S.val("m");
      const v = QSim.view(cv, 0.6), F = QSim.frame(v, { x0: -1, x1: 1, y0: -1.2, y1: 1.2, xl: "x" }); F.axes();
      for (let k = 0; k <= 5; k++) if (k !== n && k !== m) F.fn((x) => Pn(k, x), c.rule, 1);
      F.fn((x) => Pn(m, x), c.acc, 2); F.fn((x) => Pn(n, x), c.main, 2.5);
      const I = integ((x) => Pn(n, x) * Pn(m, x)), zeros = [];
      let prev = Pn(n, -1);
      for (let i = 1; i <= 4000; i++) { const x = -1 + i / 2000, y = Pn(n, x); if (Math.abs(y) < 1e-12 && i < 4000) zeros.push(x); else if (prev * y < 0) zeros.push(x - (1 / 2000) * (y / (y - prev))); prev = y; }
      S.out(`Pₙ (보라) n = ${n},  Pₘ (주황) m = ${m}\n∫₋₁¹ Pₙ(x)Pₘ(x) dx = ${Math.abs(I) < 1e-10 ? "0" : I.toFixed(6)}` + (n === m ? `  (= 2/(2n + 1) = ${(2 / (2 * n + 1)).toFixed(6)})` : "  (n ≠ m이면 0: 직교)") +
        `\nPₙ(1) = ${Pn(n, 1).toFixed(3)},  [−1, 1] 안의 근 ${zeros.length}개: ${zeros.map((z) => z.toFixed(4)).join(", ") || "없음"}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 망치로 친 용수철: 델타 함수와 짧은 사각 펄스 (05-04) */
  (() => {
    const S = QSim.card("lab-c8-impulse"); if (!S) return;
    const cv = S.$("canvas");
    /* y'' + 2ζ y' + y = (사각 펄스: 높이 A/ε, 폭 ε, t = a부터) 를 RK4로, 델타 응답은 식으로 */
    function draw() {
      const c = C(), a = S.val("a"), eps = S.val("eps"), zeta = S.val("z"), A = 1, T = 20;
      const wd = Math.sqrt(Math.max(1e-9, 1 - zeta * zeta));
      const yd = (t) => (t < a ? 0 : (A / wd) * Math.exp(-zeta * (t - a)) * Math.sin(wd * (t - a)));
      const f = (t, y) => [y[1], (t >= a && t < a + eps ? A / eps : 0) - 2 * zeta * y[1] - y[0]];
      const pts = []; let y = [0, 0], t = 0; const h = Math.min(0.01, eps / 20);
      let maxdiff = 0;
      while (t < T) { pts.push([t, y[0]]); maxdiff = Math.max(maxdiff, Math.abs(y[0] - yd(t))); y = QSim.rk4(f, t, y, h); t += h; }
      const v = QSim.view(cv, 0.55), F = QSim.frame(v, { x0: 0, x1: T, y0: -1.2, y1: 1.2, xl: "t" }); F.axes();
      F.fn(yd, c.main, 2.5, null, 800); F.path(pts.filter((_, i) => i % 4 === 0), c.acc, 2, [5, 3]);
      const g = v.g; g.save(); g.fillStyle = c.warn; g.globalAlpha = 0.25; g.fillRect(F.X(a), F.Y(1.2), Math.max(2, F.X(a + eps) - F.X(a)), F.Y(-1.2) - F.Y(1.2)); g.restore();
      S.out(`y″ + 2ζy′ + y = 충격,  ζ = ${zeta.toFixed(2)},  충격 시각 a = ${a.toFixed(1)},  충격량 1\n` +
        `보라: 델타 함수 δ(t − a)의 응답 y = u(t − a)·e^(−ζ(t − a)) sin(ω_d(t − a))/ω_d,  ω_d = ${wd.toFixed(3)}\n` +
        `주황 점선: 폭 ε = ${eps.toFixed(2)}, 높이 1/ε인 사각 펄스의 응답 (수치해),  두 곡선의 최대 차이 ${maxdiff.toFixed(4)}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
