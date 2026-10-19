/* 기계19 메카트로닉스: 표본화와 에일리어싱 (03-01) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-alias"); if (!S) return;
  const [cv] = S.$$("canvas");
  function draw() {
    const c = QSim.col(), f = S.val("f"), fs = S.val("fs");
    // 표본화된 신호가 보이는 주파수: f를 fs의 배수만큼 옮겨 0 ~ fs/2로 접음
    let fa = f % fs; if (fa > fs / 2) fa = fs - fa;
    const Tw = 0.02, v = QSim.view(cv, 0.5), fr = QSim.frame(v, { x0: 0, x1: Tw * 1000, y0: -1.3, y1: 1.3, xl: "시간 (ms)", yl: "신호", pad: 32 });
    fr.axes();
    fr.fn((tm) => Math.sin(2 * Math.PI * f * tm / 1000), c.ink3, 1.2, null, 2000);
    const n = Math.floor(Tw * fs), pts = [];
    for (let k = 0; k <= n; k++) { const t = k / fs; pts.push([t * 1000, Math.sin(2 * Math.PI * f * t)]); }
    // 표본을 지나는 가장 낮은 주파수 사인(에일리어스)
    const sgn = f % fs > fs / 2 ? -1 : 1;
    fr.fn((tm) => sgn * Math.sin(2 * Math.PI * fa * tm / 1000), c.warn, 2, [5, 3], 800);
    pts.forEach(([x, y]) => fr.dot(x, y, c.main, 3.5));
    const ok = fs > 2 * f;
    S.out(`신호 ${f} Hz, 표본화 ${fs} Hz (Nyquist 주파수 ${fs / 2} Hz), 20 ms 동안 표본 ${n + 1}개\n${ok ? `fs > 2f: 표본으로 원래 주파수 ${f} Hz를 되살릴 수 있음` : `fs ≤ 2f: 에일리어싱. 표본은 ${fa.toFixed(0)} Hz 신호와 구별되지 않음`}\n빨간 점선 = 표본을 지나는 가장 낮은 주파수 사인 (${fa.toFixed(0)} Hz)`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();

/* 기계19 5단원: 표본화 주기와 디지털 위치 제어 (05-02) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-dsample"); if (!S) return;
  const [cv] = S.$$("canvas");
  const tau = 0.05, K = 10, Kd = 0.04, TEND = 2;
  function sim(T, Kp) {
    let th = 0, w = 0, u = 0, prev = 0, t = 0, nextS = 0, first = true;
    const dt = 0.0002, ys = [[0, 0]], us = [];
    const f = (a, b) => [b, (-b + K * u) / tau];
    while (t < TEND - 1e-12) {
      if (t >= nextS - 1e-12) {
        const e = 1 - th, vel = first ? 0 : (th - prev) / T; first = false;
        u = Math.max(-12, Math.min(12, Kp * e - Kd * vel)); prev = th; nextS += T; us.push([t, u]);
      }
      const k1 = f(th, w), k2 = f(th + (dt / 2) * k1[0], w + (dt / 2) * k1[1]), k3 = f(th + (dt / 2) * k2[0], w + (dt / 2) * k2[1]), k4 = f(th + dt * k3[0], w + dt * k3[1]);
      th += (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); w += (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]); t += dt;
      ys.push([t, th]);
    }
    return { ys, us };
  }
  function draw() {
    const c = QSim.col(), Tms = S.val("T"), Kp = S.val("kp"), T = Tms / 1000;
    const { ys, us } = sim(T, Kp), ref = sim(0.0005, Kp).ys;
    const v = QSim.view(cv, 0.55), fr = QSim.frame(v, { x0: 0, x1: TEND, y0: -0.2, y1: 2, xl: "시간 (s)", yl: "위치 (rad)", pad: 32 });
    fr.axes();
    fr.path([[0, 1], [TEND, 1]], c.ink3, 1, [4, 3]);
    fr.path(ref.filter((_, i) => i % 10 === 0), c.ink3, 1.5);
    fr.path(ys.filter((_, i) => i % 5 === 0).map(([x, y]) => [x, Math.max(-0.2, Math.min(2, y))]), c.main, 2);
    if (us.length <= 200) us.forEach(([x]) => { const y = ys[Math.min(ys.length - 1, Math.round(x / 0.0002))][1]; if (y > -0.2 && y < 2) fr.dot(x, y, c.acc, 2.5); });
    const peak = Math.max(...ys.map((p) => p[1]));
    let ts = null; for (let i = ys.length - 1; i >= 0; i--) if (Math.abs(ys[i][1] - 1) > 0.02) { ts = ys[i][0]; break; }
    const late = Math.max(...ys.filter((p) => p[0] > TEND - 0.5).map((p) => Math.abs(p[1] - 1)));
    // 연속 시간 루프 L(jω) = K(Kp + jωKd)/(jω(1 + jωτ))의 교차 주파수
    const mag = (w) => (K * Math.hypot(Kp, w * Kd)) / (w * Math.hypot(1, w * tau));
    let lo = 0.1, hi = 1000; for (let i = 0; i < 60; i++) { const m = Math.sqrt(lo * hi); if (mag(m) > 1) lo = m; else hi = m; }
    const wc = lo, lag = (wc * T / 2) * (180 / Math.PI);
    S.out(`표본화 주기 ${Tms} ms (${(1000 / Tms).toFixed(0)} Hz), Kp = ${Kp} V/rad, Kd = ${Kd} V·s/rad\n오버슈트 ${((peak - 1) * 100).toFixed(1)}%, ${late > 0.02 ? `2초 안에 정착하지 못함 (마지막 0.5초 최대 오차 ${late.toFixed(3)} rad)` : `2% 정착 시간 ${ts.toFixed(2)} s`}\n표본화·유지에 의한 지연 T/2 = ${(Tms / 2).toFixed(1)} ms → 교차 주파수 ${wc.toFixed(1)} rad/s에서 위상 지연 ${lag.toFixed(1)}°`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();
