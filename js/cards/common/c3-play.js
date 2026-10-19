/* 공통3 체험 카드 묶음 2: 연속 방정식과 베르누이 방정식, 각운동량 보존(회전하는 사람). */
(() => {
  "use strict";
  const C = () => QSim.col();

  /* 1. 굵기가 변하는 관 속의 물 (07-03, 07-04) */
  (() => {
    const S = QSim.card("lab-c3-bernoulli"); if (!S) return;
    const cv = S.$("canvas"), rho = 1000, g0 = 9.8, P1 = 150000;
    let phase = 0;
    function draw() {
      const c = C(), v1 = S.val("v1"), k = S.val("k"), hh = S.val("h");
      const v2 = v1 * k, P2 = P1 + 0.5 * rho * (v1 * v1 - v2 * v2) - rho * g0 * hh;
      const v = QSim.view(cv, 0.5), F = QSim.frame(v, { x0: 0, x1: 10, y0: -1.5, y1: 6.5 });
      const g = v.g, r1 = 1, r2 = 1 / Math.sqrt(k);
      const yc = (x) => (x < 4 ? 0 : x > 6 ? hh * 0.8 : (hh * 0.8 * (x - 4)) / 2);
      const rr = (x) => (x < 4 ? r1 : x > 6 ? r2 : r1 + ((r2 - r1) * (x - 4)) / 2);
      const top = [], bot = []; for (let x = 0; x <= 10; x += 0.1) { top.push([x, yc(x) + rr(x) * 0.6]); bot.push([x, yc(x) - rr(x) * 0.6]); }
      g.save(); g.fillStyle = c.soft; g.globalAlpha = 0.5; g.beginPath(); top.forEach(([x, y], i) => (i ? g.lineTo(F.X(x), F.Y(y)) : g.moveTo(F.X(x), F.Y(y)))); bot.reverse().forEach(([x, y]) => g.lineTo(F.X(x), F.Y(y))); g.closePath(); g.fill(); g.restore();
      F.path(top, c.ink3, 2); F.path(bot.reverse(), c.ink3, 2);
      /* 물 알갱이: 알갱이 사이의 물의 부피가 일정하도록 놓고 같은 빠르기로 부피를 밀어낸다.
         그러면 좁은 곳에서는 간격이 벌어지고 빨리 움직인다 (연속 방정식) */
      const U = [0]; for (let i = 1; i <= 200; i++) { const x = (10 * (i - 0.5)) / 200; U.push(U[i - 1] + (rr(x) / r1) ** 2 * 0.05); }
      const Ut = U[200], du = Ut / 14;
      for (let j = 0; j < 3; j++) for (let i = 0; i < 14; i++) {
        const u = (i * du + phase * v1 * 0.6 + j * du * 0.33) % Ut;
        let lo = 0; while (lo < 199 && U[lo + 1] < u) lo++;
        const x = (lo + (u - U[lo]) / (U[lo + 1] - U[lo] || 1)) * 0.05;
        F.dot(x, yc(x) + (j - 1) * rr(x) * 0.35, c.main, 2.5);
      }
      const gauge = (x, P, lab) => { const H = Math.max(0, P / 50000); const y0 = yc(x) + rr(x) * 0.6; F.path([[x, y0], [x, y0 + H]], c.acc, 6); F.text(lab, x + 0.15, y0 + H + 0.1, c.ink2); };
      gauge(1.5, P1, "P₁"); gauge(8.5, Math.max(0, P2), "P₂");
      S.out(`넓은 곳 v₁ = ${v1.toFixed(2)} m/s, 단면적 비 A₁/A₂ = ${k.toFixed(1)}, 높이 차 h = ${hh.toFixed(1)} m (물, ρ = 1000 kg/m³)\n` +
        `연속 방정식 A₁v₁ = A₂v₂:  v₂ = ${v2.toFixed(2)} m/s\n베르누이: P₂ = P₁ + ½ρ(v₁² − v₂²) − ρgh = ${(P1 / 1000).toFixed(1)} kPa ${P2 >= P1 ? "+" : "−"} ${(Math.abs(P2 - P1) / 1000).toFixed(2)} kPa = ${(P2 / 1000).toFixed(2)} kPa` +
        (P2 < 0 ? "\n압력이 음수: 이 조건은 불가능하다. 실제로는 물이 끓듯 기포가 생긴다(공동 현상)" : ""));
    }
    const L = QSim.loop((dt) => { phase += dt * 1.5; draw(); }).watch(cv);
    if (!QSim.reduce) L.start();
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 팔을 오므리면 왜 빨리 돌까 (06-04) */
  (() => {
    const S = QSim.card("lab-c3-skater"); if (!S) return;
    const cv = S.$("canvas"), I0 = 1.2, m = 4, r0 = 0.8;
    let ang = 0;
    function state() {
      const w0 = S.val("w0"), r = S.val("r"), Ia = I0 + 2 * m * r0 * r0, Ib = I0 + 2 * m * r * r, Lm = Ia * w0, w = Lm / Ib;
      return { w0, r, Ia, Ib, Lm, w };
    }
    function draw() {
      const c = C(), s = state();
      const v = QSim.view(cv, 0.55), F = QSim.frame(v, { x0: -1.2, x1: 1.2, y0: -1.1, y1: 1.1, equal: true });
      const g = v.g;
      g.save(); g.strokeStyle = c.rule; g.setLineDash([3, 4]); g.beginPath(); g.arc(F.X(0), F.Y(0), s.r * F.sx, 0, 7); g.stroke(); g.restore();
      F.dot(0, 0, c.main, 0.22 * F.sx);
      [0, Math.PI].forEach((d) => { const x = s.r * Math.cos(ang + d), y = s.r * Math.sin(ang + d); F.path([[0, 0], [x, y]], c.main, 5); F.dot(x, y, c.acc, 9); });
      const K0 = 0.5 * s.Ia * s.w0 * s.w0, K = 0.5 * s.Ib * s.w * s.w;
      S.out(`몸통 I₀ = 1.2 kg·m², 양손에 든 아령 4 kg씩, 처음 팔 길이 0.80 m, 처음 ω₀ = ${s.w0.toFixed(2)} rad/s\n` +
        `지금 팔 길이 r = ${s.r.toFixed(2)} m:  I = I₀ + 2mr² = ${s.Ib.toFixed(3)} kg·m²  (처음 ${s.Ia.toFixed(3)})\n` +
        `각운동량 L = Iω = ${s.Lm.toFixed(3)} kg·m²/s (보존)  →  ω = ${s.w.toFixed(3)} rad/s = ${(s.w / (2 * Math.PI)).toFixed(3)}바퀴/s\n` +
        `회전 운동 에너지 ½Iω²: 처음 ${K0.toFixed(2)} J → 지금 ${K.toFixed(2)} J (${(K / K0).toFixed(3)}배)`);
    }
    const L = QSim.loop((dt) => { ang += state().w * dt; draw(); }).watch(cv);
    QSim.playButton(S.$(".play"), L);
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
  /* 3. 여러 번 재면 왜 더 정확해질까: 표준오차 (11-01) */
  (() => {
    const S = QSim.card("lab-c3-measure"); if (!S) return;
    const cv = S.$("canvas"); let seed = 7;
    const rng = (sd) => () => { sd |= 0; sd = (sd + 0x6d2b79f5) | 0; let t = Math.imul(sd ^ (sd >>> 15), 1 | sd); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const T0 = 2 * Math.PI * Math.sqrt(1 / 9.8);  /* 길이 1 m 진자의 주기 */
    function draw() {
      const c = C(), n = Math.round(S.val("n")), sg = S.val("sg"), u = rng(seed);
      const gauss = () => Math.sqrt(-2 * Math.log(u() + 1e-12)) * Math.cos(2 * Math.PI * u());
      const xs = Array.from({ length: n }, () => T0 + sg * gauss());
      const m = xs.reduce((a, b) => a + b, 0) / n, s = n > 1 ? Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (n - 1)) : NaN, se = s / Math.sqrt(n);
      const v = QSim.view(cv, 0.42), F = QSim.frame(v, { x0: T0 - 0.5, x1: T0 + 0.5, y0: 0, y1: 3, xl: "주기 (s)", pad: 30 }); F.axes({ noGrid: true });
      F.path([[T0, 0], [T0, 3]], c.acc, 2, [5, 4]); F.text("참값", T0, 2.85, c.acc, "center");
      xs.forEach((x, i) => F.dot(x, 0.4 + ((i * 0.618) % 1) * 1.2, c.soft, 4));
      if (n > 1) { F.path([[m - 2 * se, 2.2], [m + 2 * se, 2.2]], c.main, 4); F.dot(m, 2.2, c.main, 6); F.path([[m - s, 1.95], [m + s, 1.95]], c.ink3, 1.5); }
      S.out(`가상 측정 ${seed}번째 묶음: 길이 1 m 진자의 주기를 ${n}번 잼 (참값 ${T0.toFixed(4)} s, 한 번 잴 때 오차 크기 ${sg.toFixed(2)} s)\n` +
        (n > 1 ? `평균 ${m.toFixed(4)} s,  표준편차 s = ${s.toFixed(4)} s (회색 선: 한 번 잰 값이 흩어지는 폭)\n평균의 표준오차 s/√n = ${se.toFixed(4)} s → 결과 ${m.toFixed(3)} ± ${(2 * se).toFixed(3)} s (보라 선, 약 95%)  ${Math.abs(m - T0) <= 2 * se ? "참값이 구간 안" : "참값이 구간 밖"}`
          : `한 번만 재면 흩어짐의 크기를 알 수 없습니다. 두 번 이상 재 보세요.`));
    }
    S.on(draw); QSim.redrawOn(draw); draw();
    S.$(".reroll").addEventListener("click", () => { seed++; draw(); });
  })();
})();
