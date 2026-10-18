/* 기계3 열역학 2·4단원: 피스톤-실린더 속 공기의 과정, 경계일과 제1법칙 (02-01, 04-01) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-piston"); if (!S) return;
  const [cv] = S.$$("canvas");
  const R = 0.287, cvv = 0.718, m = 0.01; // 공기 kJ/kg·K, 질량 10 g
  function state() {
    const P1 = S.val("P1"), T1 = 300, V1 = (m * R * T1) / P1, r = S.val("r"), proc = S.val("proc"), n = S.val("n");
    const V2 = proc === "v" ? V1 : V1 * r;
    const N = proc === "p" ? 0 : proc === "t" ? 1 : proc === "v" ? Infinity : n;
    let P2, W;
    if (proc === "v") { P2 = P1 * S.val("heat"); W = 0; }
    else if (N === 1) { P2 = P1 * V1 / V2; W = P1 * V1 * Math.log(V2 / V1); }
    else { P2 = P1 * Math.pow(V1 / V2, N); W = N === 0 ? P1 * (V2 - V1) : (P2 * V2 - P1 * V1) / (1 - N); }
    const T2 = (P2 * V2) / (m * R), dU = m * cvv * (T2 - T1), Q = dU + W;
    const curve = []; for (let i = 0; i <= 80; i++) { const V = V1 + (V2 - V1) * (i / 80);
      const P = proc === "v" ? P1 + (P2 - P1) * (i / 80) : N === 1 ? P1 * V1 / V : P1 * Math.pow(V1 / V, N); curve.push([V * 1000, P]); }
    return { P1, T1, V1, V2, P2, T2, W, dU, Q, curve, proc };
  }
  function draw() {
    const c = QSim.col(), s = state();
    const Vmax = Math.max(s.V1, s.V2) * 1000 * 1.15, Pmax = Math.max(s.P1, s.P2) * 1.2;
    const v = QSim.view(cv, 0.6), f = QSim.frame(v, { x0: 0, x1: Vmax, y0: 0, y1: Pmax, xl: "V (L)", yl: "P (kPa)", pad: 38 }); f.axes();
    // 곡선 아래 넓이 칠하기 (= 경계일)
    const g = v.g; g.fillStyle = s.W >= 0 ? c.soft : "rgba(217,83,79,.25)"; g.beginPath(); g.moveTo(f.X(s.curve[0][0]), f.Y(0));
    s.curve.forEach(([x, y]) => g.lineTo(f.X(x), f.Y(y))); g.lineTo(f.X(s.curve[s.curve.length - 1][0]), f.Y(0)); g.closePath(); g.fill();
    f.path(s.curve, c.main, 2.5); f.dot(s.curve[0][0], s.curve[0][1], c.ink, 4); f.dot(s.curve[80][0], s.curve[80][1], c.warn, 5);
    f.text("1", s.curve[0][0] + Vmax * 0.01, s.curve[0][1] + Pmax * 0.03, c.ink); f.text("2", s.curve[80][0] + Vmax * 0.01, s.curve[80][1] + Pmax * 0.03, c.warn);
    S.out(`공기 10 g, 상태 1: ${s.P1} kPa, 300 K, V₁ = ${(s.V1 * 1000).toFixed(2)} L\n상태 2: ${s.P2.toFixed(1)} kPa, ${s.T2.toFixed(1)} K, V₂ = ${(s.V2 * 1000).toFixed(2)} L\n경계일 W_b = ∫P dV = ${(s.W * 1000).toFixed(1)} J (칠한 넓이, ${s.W >= 0 ? "계가 일을 함" : "계가 일을 받음"})\nΔU = m c_v ΔT = ${(s.dU * 1000).toFixed(1)} J, 열 Q = ΔU + W = ${(s.Q * 1000).toFixed(1)} J (${s.Q >= 0 ? "들어옴" : "나감"})`);
    S.$$("[data-for]").forEach((e) => { e.hidden = !e.dataset.for.split(" ").includes(s.proc); });
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();
