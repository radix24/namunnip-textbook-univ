/* 기계5 유체역학 7단원: 떨어지는 구의 종단 속도와 항력계수 (07-02) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-terminal"); if (!S) return;
  const [cv] = S.$$("canvas");
  const OBJ = {
    steel: { name: "강철 공 5 mm", d: 5e-3, rho: 7800 },
    glass: { name: "유리 구슬 3 mm", d: 3e-3, rho: 2500 },
    rain: { name: "빗방울 2 mm", d: 2e-3, rho: 1000 },
    pong: { name: "탁구공 40 mm (2.7 g)", d: 0.04, rho: 2.7e-3 / ((Math.PI * 0.04 ** 3) / 6) },
    dust: { name: "먼지 20 μm", d: 20e-6, rho: 2500 }
  };
  const FL = { air: { name: "공기", rho: 1.2, mu: 1.8e-5 }, water: { name: "물", rho: 1000, mu: 1e-3 }, gly: { name: "글리세린", rho: 1260, mu: 1.41 } };
  // 구의 항력계수 근사식 (White): 24/Re + 6/(1+√Re) + 0.4, Re < 2×10⁵에서 ±10%
  const Cd = (Re) => 24 / Math.max(Re, 1e-12) + 6 / (1 + Math.sqrt(Re)) + 0.4;
  function draw() {
    const c = QSim.col(), o = OBJ[S.val("o")], fl = FL[S.val("fl")];
    const dr = o.rho - fl.rho, sgn = Math.sign(dr), ge = (9.81 * Math.abs(dr)) / o.rho; // 부력을 뺀 가속도
    if (Math.abs(dr) < 1e-6 * fl.rho) { // 밀도가 같으면 뜨지도 가라앉지도 않는다
      const v = QSim.view(cv, 0.55); QSim.frame(v, { x0: 0, x1: 1, y0: 0, y1: 1, xl: "t (s)", yl: "V (m/s)", pad: 40 }).axes();
      S.out(`${o.name}와 ${fl.name}의 밀도가 같아(${fl.rho} kg/m³) 무게와 부력이 같다 → 뜨지도 가라앉지도 않고 제자리에 머문다 (중성 부력)`); return;
    }
    const k = (V) => (3 * fl.rho * Cd((fl.rho * V * o.d) / fl.mu) * V * V) / (4 * o.rho * o.d);
    // 종단 속도: 무게 − 부력 = 항력 (고정점 반복)
    let Vt = 1e-6;
    for (let i = 0; i < 300; i++) { const Re = (fl.rho * Vt * o.d) / fl.mu; Vt = 0.5 * Vt + 0.5 * Math.sqrt((4 * Math.abs(dr) * 9.81 * o.d) / (3 * fl.rho * Cd(Re))); }
    const Re = (fl.rho * Vt * o.d) / fl.mu, Vs = (Math.abs(dr) * 9.81 * o.d ** 2) / (18 * fl.mu);
    // 정지에서 출발한 속도 V(t) (부가 질량 무시)
    const tau = Vt / ge, dt = tau / 400, pts = [[0, 0]];
    let V = 0, t = 0, t95 = null, n = 0;
    while (t < 5 * tau) { const f = (_, y) => [ge - k(y[0])]; V = QSim.rk4(f, t, [V], dt)[0]; t += dt; if (t95 === null && V >= 0.95 * Vt) t95 = t; if (++n % 4 === 0) pts.push([t, V]); }
    pts.push([t, V]);
    const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: 0, x1: 5 * tau, y0: 0, y1: Vt * 1.25, xl: "t (s)", yl: "V (m/s)", pad: 40 });
    f.axes();
    f.path([[0, Vt], [5 * tau, Vt]], c.ink3, 1, [5, 4]);
    if (Vs < Vt * 1.2) f.path([[0, Vs], [5 * tau, Vs]], c.acc, 1.5, [2, 3]);
    f.path(pts, c.main, 2.5);
    if (t95) f.dot(t95, 0.95 * Vt, c.warn, 5);
    const regime = Re < 1 ? "Stokes 영역 (Re < 1): C_D ≈ 24/Re" : Re < 1000 ? "중간 영역 (1 < Re < 1000)" : "C_D ≈ 0.4~0.5로 거의 일정한 영역";
    const dir = sgn > 0 ? "아래로 떨어진다" : "떠오른다 (밀도가 유체보다 작음)";
    S.out(`${o.name} (밀도 ${o.rho.toFixed(0)} kg/m³)가 ${fl.name} (밀도 ${fl.rho}, 점도 ${fl.mu} Pa·s) 속에서 ${dir}\n종단 속도 V_t = ${Vt.toPrecision(3)} m/s, Re = ${Re.toPrecision(3)}, C_D = ${Cd(Re).toFixed(3)} → ${regime}\nStokes 식 Δρ g D²/(18μ) = ${Vs.toPrecision(3)} m/s (${Re < 1 ? "맞음" : "Re가 커서 맞지 않음"})\nV_t의 95%에 이르는 시간(빨간 점) ${t95 ? t95.toPrecision(3) : "-"} s`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();
