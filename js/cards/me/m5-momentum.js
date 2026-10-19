/* 기계5 유체역학 4단원: 분류가 움직이는 날개에 주는 힘과 일률 (04-02) */
(() => {
  "use strict";
  const rho = 1000;

  (() => {
    const S = QSim.card("lab-me-vane"); if (!S) return;
    const [cv] = S.$$("canvas");
    // r = u/V. 날개 하나: 닿는 유량 ρA(V-u). 날개 열(펠턴): 분류 전체 ρAV
    const eta = (r, k, wheel) => 2 * r * (1 - r) * (wheel ? 1 : 1 - r) * k;
    function draw() {
      const c = QSim.col(), V = S.val("V"), D = S.val("D") / 100, r = S.val("r"), th = (S.val("th") * Math.PI) / 180, wheel = S.val("m") === "wheel";
      const A = (Math.PI * D * D) / 4, u = r * V, k = 1 - Math.cos(th), mrel = rho * A * (wheel ? V : V - u);
      const Fx = mrel * (V - u) * k, Fy = mrel * (V - u) * Math.sin(th), P = Fx * u, Pjet = 0.5 * rho * A * V ** 3;
      const v = QSim.view(cv, 0.6), f = QSim.frame(v, { x0: 0, x1: 1, y0: 0, y1: 1, xl: "u/V", yl: "효율 η", pad: 30 });
      f.axes();
      f.fn((x) => eta(x, k, true), wheel ? c.main : c.ink3, wheel ? 2.5 : 1.5, wheel ? null : [5, 4]);
      f.fn((x) => eta(x, k, false), wheel ? c.ink3 : c.acc, wheel ? 1.5 : 2.5, wheel ? [5, 4] : null);
      f.dot(r, P / Pjet, c.warn, 6);
      f.text("날개 열(펠턴)", 0.5, eta(0.5, k, true) + 0.04, wheel ? c.main : c.ink3, "center");
      f.text("날개 하나", 1 / 3, eta(1 / 3, k, false) + 0.04, wheel ? c.ink3 : c.acc, "center");
      const best = wheel ? `u = V/2에서 최대 η = ${(k / 2).toFixed(3)}` : `u = V/3에서 최대 η = ${((8 / 27) * k).toFixed(3)}`;
      S.out(`분류 ${V} m/s, 지름 ${(D * 100).toFixed(1)} cm → 질량 유량 ${(rho * A * V).toFixed(2)} kg/s, 분류 운동 에너지 ${(Pjet / 1000).toFixed(2)} kW\n날개 속도 u = ${u.toFixed(2)} m/s, 상대 속도 ${(V - u).toFixed(2)} m/s, 날개에 닿는 유량 ${mrel.toFixed(2)} kg/s\n힘 F_x = ${Fx.toFixed(1)} N, F_y = ${Fy.toFixed(1)} N, 일률 F_x·u = ${(P / 1000).toFixed(3)} kW, 효율 η = ${(P / Pjet).toFixed(3)}\n${best}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
