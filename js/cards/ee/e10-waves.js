/* 전전10 전자장및응용 탐구 카드 묶음
   1 표피 깊이(01-02)  2 편광(01-03)  3 Fresnel 반사(03-02)  4 반사 도표(04-04)  5 도파관 모드(05-01) */
(() => {
  "use strict";
  if (!window.QSim) return;
  const C = () => QSim.col();
  const f2 = (x, d = 3) => (Math.abs(x) < 5e-13 ? 0 : x).toFixed(d);
  const c0 = 2.998e8, mu0 = 4e-7 * Math.PI, e0 = 8.854e-12;
  const eng = (x, u) => { const a = Math.abs(x); return a >= 1 ? f2(x, 3) + " " + u : a >= 1e-3 ? f2(x * 1e3, 3) + " m" + u : f2(x * 1e6, 3) + " μ" + u; };

  /* 2. 편광: 전계 끝의 궤적 */
  (() => {
    const S = QSim.card("exp-e10-pol"); if (!S) return;
    const cv = S.$("canvas");
    let t = 0;
    function draw() {
      const c = C(), ax = S.val("ax"), ay = S.val("ay"), ph = S.val("ph") * Math.PI / 180;
      const Ex = (tt) => ax * Math.cos(2 * Math.PI * tt), Ey = (tt) => ay * Math.cos(2 * Math.PI * tt + ph);
      const v = QSim.view(cv, 0.6), fr = QSim.frame(v, { x0: -1.3, x1: 1.3, y0: -1.3, y1: 1.3, xl: "Ex", yl: "Ey", equal: true }); fr.axes();
      const pts = []; for (let i = 0; i <= 200; i++) pts.push([Ex(i / 200), Ey(i / 200)]);
      fr.path(pts, c.main, 2.2);
      fr.arrow(0, 0, Ex(t), Ey(t), c.warn);
      fr.dot(Ex(t), Ey(t), c.warn, 5);
      const s = Math.sin(ph), kind = (ax < 1e-9 || ay < 1e-9 || Math.abs(s) < 1e-9) ? "선형 편광" : (Math.abs(ax - ay) < 1e-9 && Math.abs(Math.abs(s) - 1) < 1e-9) ? "원형 편광" : "타원 편광";
      const rot = Math.abs(s) < 1e-9 || ax < 1e-9 || ay < 1e-9 ? "회전 없음" : s > 0 ? "시계 방향" : "반시계 방향";
      S.out(`E = x̂ ${f2(ax, 2)}cos(ωt − kz) + ŷ ${f2(ay, 2)}cos(ωt − kz ${S.val("ph") >= 0 ? "+" : "−"} ${Math.abs(S.val("ph"))}°), z = 0 평면에서 본 전계 끝의 궤적\n` +
        `${kind}, 시간이 흐를 때 ${rot}(Ex 가로, Ey 세로 축으로 본 회전). 파가 +z로 진행할 때의 오른손·왼손 이름은 관례에 따라 다르므로(IEEE와 광학), 축과 방향을 함께 밝혀 씁니다.`);
    }
    const L = QSim.loop((dt) => { t = (t + dt * 0.25) % 1; draw(); }).watch(S.root);
    QSim.playButton(S.$(".play"), L);
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 비스듬한 입사: Fresnel 반사 계수 */
  (() => {
    const S = QSim.card("exp-e10-fresnel"); if (!S) return;
    const cv = S.$("canvas");
    const coef = (n1, n2, th) => {
      const s2 = n1 * Math.sin(th) / n2; if (s2 >= 1) return [1, 1, true];
      const ct = Math.cos(th), c2 = Math.sqrt(1 - s2 * s2);
      const rs = (n1 * ct - n2 * c2) / (n1 * ct + n2 * c2), rp = (n2 * ct - n1 * c2) / (n2 * ct + n1 * c2);
      return [rs, rp, false];
    };
    function draw() {
      const c = C(), n1 = Math.sqrt(S.val("e1")), n2 = Math.sqrt(S.val("e2")), thd = S.val("th"), th = thd * Math.PI / 180;
      const v = QSim.view(cv, 0.45), fr = QSim.frame(v, { x0: 0, x1: 90, y0: 0, y1: 1.05, xl: "입사각 (°)", yl: "|Γ|" }); fr.axes();
      fr.fn((d) => Math.abs(coef(n1, n2, d * Math.PI / 180)[0]), c.main, 2.4, undefined, 600);
      fr.fn((d) => Math.abs(coef(n1, n2, d * Math.PI / 180)[1]), c.acc, 2.4, [6, 3], 600);
      const thB = Math.atan(n2 / n1) * 180 / Math.PI, thC = n1 > n2 ? Math.asin(n2 / n1) * 180 / Math.PI : null;
      fr.path([[thB, 0], [thB, 1.05]], c.ink3, 1, [2, 3]);
      if (thC) fr.path([[thC, 0], [thC, 1.05]], c.warn, 1, [2, 3]);
      const [rs, rp, tir] = coef(n1, n2, th);
      fr.dot(thd, Math.abs(rs), c.main, 5); fr.dot(thd, Math.abs(rp), c.acc, 5);
      S.out(`n₁ = ${f2(n1, 3)}, n₂ = ${f2(n2, 3)} (비자성, n = √ε_r). 입사각 ${thd}°\n` +
        (tir ? `전반사: n₁ sinθ > n₂라 투과파가 없고 |Γ⊥| = |Γ∥| = 1` : `Γ⊥(수직 편광, 파랑) = ${f2(rs, 4)}, Γ∥(평행 편광, 주황 점선) = ${f2(rp, 4)}, 반사 전력 비 ${f2(rs * rs, 4)}, ${f2(rp * rp, 4)}`) +
        `\nBrewster 각 arctan(n₂/n₁) = ${f2(thB, 2)}° (회색 선, Γ∥ = 0)` + (thC ? `, 임계각 arcsin(n₂/n₁) = ${f2(thC, 2)}° (빨간 선)` : ", 임계각 없음(n₁ < n₂)"));
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 계단 전압의 반사 도표 */
  (() => {
    const S = QSim.card("exp-e10-bounce"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), Vs = 10, Rs = S.val("rs"), RL = S.val("rl"), Z0 = 50, N = 8;
      const gL = (RL - Z0) / (RL + Z0), gS = (Rs - Z0) / (Rs + Z0), V1 = Vs * Z0 / (Rs + Z0);
      // 부하 전압: 시각 (2k+1)T에서 바뀜. 송신단 전압: 0과 2kT에서 바뀜
      const load = [], src = [];
      let wave = V1, vL = 0, vS = V1;
      src.push([0, vS]);
      for (let k = 0; k < N; k++) {
        vL += wave * (1 + gL); load.push([2 * k + 1, vL]);
        const back = wave * gL; vS += back * (1 + gS); src.push([2 * k + 2, vS]);
        wave = back * gS;
      }
      const vinf = Vs * RL / (Rs + RL);
      const step = (arr, t0) => { const pts = [[0, t0 === 0 ? arr[0][1] : 0]]; let prev = pts[0][1]; arr.forEach(([t, v]) => { pts.push([t, prev], [t, v]); prev = v; }); pts.push([2 * N + 1, prev]); return pts; };
      const ymax = Math.max(12, ...load.map((p) => Math.abs(p[1])), ...src.map((p) => Math.abs(p[1]))) * 1.05;
      const v = QSim.view(cv, 0.45), fr = QSim.frame(v, { x0: 0, x1: 2 * N + 1, y0: 0, y1: ymax, xl: "t / T", yl: "V" }); fr.axes();
      fr.path([[0, vinf], [2 * N + 1, vinf]], c.ink3, 1, [4, 3]);
      fr.path(step(src, 0), c.acc, 2, [6, 3]);
      fr.path(step(load, 1), c.main, 2.4);
      S.out(`10 V 계단, R_s = ${Rs} Ω, Z₀ = 50 Ω, R_L = ${RL} Ω, 한쪽 지연 T. Γ_L = ${f2(gL, 3)}, Γ_s = ${f2(gS, 3)}, 처음 들어가는 파 V⁺ = ${f2(V1, 3)} V\n` +
        `부하 전압(파랑): ${load.slice(0, 4).map(([t, vv]) => `${t}T ${f2(vv, 3)}`).join(", ")} … → 최종 ${f2(vinf, 3)} V(회색 점선 = 직류 분압)\n` +
        `송신단 전압(주황 점선): ${src.slice(0, 4).map(([t, vv]) => `${t}T ${f2(vv, 3)}`).join(", ")}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 5. 직사각형 도파관의 모드와 분산 */
  (() => {
    const S = QSim.card("exp-e10-guide"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), a = S.val("a") / 1000, b = S.val("b") / 1000, f = S.val("f") * 1e9;
      const modes = [];
      for (let m = 0; m <= 3; m++) for (let n = 0; n <= 3; n++) { if (m === 0 && n === 0) continue; modes.push([`TE${m}${n}`, c0 / 2 * Math.hypot(m / a, n / b)]); if (m > 0 && n > 0) modes.push([`TM${m}${n}`, c0 / 2 * Math.hypot(m / a, n / b)]); }
      modes.sort((p, q) => p[1] - q[1]);
      const fc = modes[0][1], fmax = 20e9;
      const v = QSim.view(cv, 0.45), fr = QSim.frame(v, { x0: 0, x1: 600, y0: 0, y1: fmax / 1e9, xl: "β (rad/m)", yl: "f (GHz)" }); fr.axes();
      fr.fn((bb) => bb * c0 / (2 * Math.PI) / 1e9, c.ink3, 1.2, [4, 3]);   // 빛선
      modes.slice(0, 4).forEach(([nm, fcm], i) => fr.fn((bb) => Math.sqrt(fcm * fcm + (bb * c0 / (2 * Math.PI)) ** 2) / 1e9, [c.main, c.acc, c.warn, c.ink2][i], i ? 1.4 : 2.4));
      fr.path([[0, f / 1e9], [600, f / 1e9]], c.rule, 1);
      const prop = modes.filter((m) => m[1] < f).map((m) => m[0]);
      let msg = `a = ${f2(a * 1000, 2)} mm, b = ${f2(b * 1000, 2)} mm. 차단 주파수: ${modes.slice(0, 4).map(([nm, x]) => `${nm} ${f2(x / 1e9, 2)} GHz`).join(", ")}\n`;
      if (f > fc) {
        const r = Math.sqrt(1 - (fc / f) ** 2), lam0 = c0 / f;
        msg += `f = ${f2(f / 1e9, 2)} GHz에서 전파되는 모드: ${prop.join(", ")}. TE10: 관내 파장 λg = λ₀/√(1 − (fc/f)²) = ${f2(lam0 / r * 1000, 2)} mm (λ₀ = ${f2(lam0 * 1000, 2)} mm), 위상 속도 ${f2(c0 / r / 1e8, 3)}×10⁸, 군속도 ${f2(c0 * r / 1e8, 3)}×10⁸ m/s (곱 = c²)`;
      } else msg += `f = ${f2(f / 1e9, 2)} GHz는 가장 낮은 차단 주파수보다 낮아 어떤 모드도 전파되지 않습니다(감쇠).`;
      S.out(msg + `\n곡선: 아래부터 네 모드의 f–β 관계, 점선: 빛선 f = cβ/2π. 곡선 기울기(군속도)는 언제나 빛선보다 완만합니다.`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
