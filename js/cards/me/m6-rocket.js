/* 기계6 동역학 3단원: 연직으로 오르는 로켓 (03-02) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-rocket"); if (!S) return;
  const [cv] = S.$$("canvas");
  const g0 = 9.81, m0 = 1e5;
  function draw() {
    const c = QSim.col(), u = S.val("u"), fr = S.val("fr") / 100, tb = S.val("tb"), grav = S.val("g") === "on" ? g0 : 0;
    const mf = m0 * (1 - fr), md = (m0 * fr) / tb, T = u * md;
    // dv/dt = T/m − g, 지면에서 출발 (추력이 무게보다 작으면 뜨지 못함). 한 걸음마다 Δv = u ln(m/m') − g Δt
    const pts = [], N = 600, dt = tb / N; let v = 0, h = 0, t = 0, amax = 0;
    for (let i = 0; i <= N; i++) {
      const m = m0 - md * t; pts.push([t, v]);
      if (i === N) break;
      const m2 = m - md * dt, onGround = v <= 0 && T / m2 < grav;
      if (!onGround) { amax = Math.max(amax, T / m2 - grav); const v2 = v + u * Math.log(m / m2) - grav * dt; h += 0.5 * (v + v2) * dt; v = v2; } // 한 걸음 동안 정확한 적분
      t += dt;
    }
    const ideal = u * Math.log(m0 / mf), withG = ideal - grav * tb;
    const vw = QSim.view(cv, 0.55), ymax = Math.max(ideal, 100) * 1.1;
    const f = QSim.frame(vw, { x0: 0, x1: tb, y0: 0, y1: ymax, xl: "t (s)", yl: "v (m/s)", pad: 44 });
    f.axes();
    f.path([[0, ideal], [tb, ideal]], c.ink3, 1, [5, 4]);
    f.fn((tt) => u * Math.log(m0 / (m0 - md * tt)), c.acc, 1.5, [2, 3]);
    f.path(pts, c.main, 2.5);
    const lift = T > m0 * grav || grav === 0 ? "" : `\n추력 ${(T / 1e6).toFixed(2)} MN이 처음 무게 ${((m0 * grav) / 1e6).toFixed(2)} MN보다 작아 연료가 줄어 가벼워질 때까지 뜨지 못한다`;
    S.out(`처음 질량 100 t, 연료 ${(fr * 100).toFixed(0)}% (${(m0 * fr / 1000).toFixed(0)} t), 배출 속도 ${u} m/s, 연소 ${tb} s → 유량 ${md.toFixed(0)} kg/s, 추력 ${(T / 1e6).toFixed(2)} MN\n질량비 m0/mf = ${(m0 / mf).toFixed(2)}, Tsiolkovsky Δv = u ln(m0/mf) = ${ideal.toFixed(0)} m/s (점선)\n${grav ? `연직 비행: 연소 종료 속도 ${v.toFixed(0)} m/s (식 ${Math.max(withG, 0).toFixed(0)} m/s), 중력 손실 ${(ideal - v).toFixed(0)} m/s, 고도 ${(h / 1000).toFixed(1)} km` : `우주 공간: 연소 종료 속도 ${v.toFixed(0)} m/s`}\n최대 가속도 ${amax.toFixed(1)} m/s² (${(amax / g0).toFixed(1)} g, 연소 끝 무렵)${lift}`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();
