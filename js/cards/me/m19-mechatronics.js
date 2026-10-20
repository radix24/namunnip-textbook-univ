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
