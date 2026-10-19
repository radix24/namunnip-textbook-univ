/* 공통5·6 체험 카드 묶음 3: 반데르발스 기체, 에너지 분포와 활성화 에너지 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const sci = (x, d = 2) => { if (x === 0) return "0"; const e = Math.floor(Math.log10(Math.abs(x))); return e >= -2 && e < 4 ? x.toFixed(Math.max(0, d - e)) : (x / 10 ** e).toFixed(d) + "×10^" + e; };

  /* 3. 반데르발스 기체의 등온선 (공통5 10-03) */
  (() => {
    const S = QSim.card("lab-c5-vdw"); if (!S) return;
    const cv = S.$("canvas");
    const G = { CO2: ["CO₂", 3.640, 0.04267], N2: ["N₂", 1.370, 0.0387], He: ["He", 0.0346, 0.0238] }, R = 0.08314;
    function draw() {
      const c = C(), [nm, a, b] = G[S.val("gas")], T = S.val("T"), Vm = S.val("V");
      const Pv = (V) => R * T / (V - b) - a / (V * V), Pi = (V) => R * T / V;
      const Tc = 8 * a / (27 * R * b), Pc = a / (27 * b * b), Vc = 3 * b;
      const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: 0, x1: 1, y0: 0, y1: 200, xl: "Vm (L/mol)", yl: "P (bar)" }); f.axes();
      f.fn((V) => (V > 0.02 ? Pi(V) : NaN), c.ink3, 1.5, [5, 4], 400);
      f.fn((V) => (V > b * 1.02 ? Pv(V) : NaN), c.main, 2.5, null, 800);
      if (Vc < 1 && Pc < 200) f.dot(Vc, Pc, c.acc, 4);
      const P1 = Pv(Vm), P0 = Pi(Vm); if (P1 > 0 && P1 < 200) f.dot(Vm, P1, c.warn, 6);
      const Z = P1 * Vm / (R * T);
      S.out(`${nm}: a = ${a} L²·bar/mol², b = ${b} L/mol, 임계 온도 Tc = 8a/(27Rb) = ${Tc.toFixed(1)} K, Pc = ${Pc.toFixed(1)} bar\n${T} K, Vm = ${Vm.toFixed(3)} L/mol: 이상 기체 ${P0.toFixed(1)} bar, 반데르발스 ${P1.toFixed(1)} bar, 압축 인자 Z = PV/RT = ${Z.toFixed(3)}\n${Z < 0.995 ? "Z < 1: 분자 사이 끌림이 압력을 낮춘다" : Z > 1.005 ? "Z > 1: 분자 자체의 부피가 압력을 높인다" : "거의 이상 기체"}${T < Tc ? "\nT < Tc: 곡선이 오르내린다. 실제로는 이 구간에서 기체가 액화하며 압력이 일정한 수평선이 된다" : ""}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 에너지 분포와 활성화 에너지 (공통6 02-03) */
  (() => {
    const S = QSim.card("lab-c6-boltz"); if (!S) return;
    const cv = S.$("canvas");
    const erfc = (x) => { const t = 1 / (1 + 0.5 * x), y = t * Math.exp(-x * x - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277))))))))); return y; };
    const frac = (x) => 2 * Math.sqrt(x / Math.PI) * Math.exp(-x) + erfc(Math.sqrt(x));
    const R = 8.314e-3;
    function draw() {
      const c = C(), T = S.val("T"), Ea0 = S.val("Ea"), cat = S.val("cat"), Ea = Math.max(1, Ea0 - cat);
      const dens = (E, TT) => 2 * Math.sqrt(E / Math.PI) * Math.pow(1 / (R * TT), 1.5) * Math.exp(-E / (R * TT));
      const xmax = Math.max(Ea0, 20) * 1.25;
      const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: 0, x1: xmax, y0: -14, y1: 0, xl: "E (kJ/mol)", yl: "log₁₀ 분포" }); f.axes();
      const lg = (E, TT) => Math.log10(Math.max(1e-30, dens(E, TT)));
      const g = v.g; g.save(); g.fillStyle = c.soft; g.globalAlpha = 0.6; g.beginPath(); g.moveTo(f.X(Ea), f.Y(-14));
      for (let i = 0; i <= 100; i++) { const E = Ea + (xmax - Ea) * i / 100; g.lineTo(f.X(E), f.Y(Math.max(-14, lg(E, T)))); }
      g.lineTo(f.X(xmax), f.Y(-14)); g.fill(); g.restore();
      f.fn((E) => (E > 0.01 ? Math.max(-14, lg(E, T)) : NaN), c.main, 2.5, null, 400);
      f.fn((E) => (E > 0.01 ? Math.max(-14, lg(E, T + 10)) : NaN), c.warn, 1.8, [5, 4], 400);
      f.path([[Ea0, -14], [Ea0, 0]], c.ink3, 1.5, [3, 3]); if (cat) f.path([[Ea, -14], [Ea, 0]], c.acc, 2);
      const p1 = frac(Ea / (R * T)), p2 = frac(Ea / (R * (T + 10))), p0 = frac(Ea0 / (R * T));
      S.out(`T = ${T} K, RT = ${(R * T).toFixed(2)} kJ/mol, Ea = ${Ea.toFixed(0)} kJ/mol${cat ? " (촉매로 " + cat + " kJ/mol 낮춤)" : ""}\nEa보다 큰 에너지를 가진 분자 비율 ${sci(p1, 2)}  (색칠한 꼬리)\n${T + 10} K에서는 ${sci(p2, 2)} → ${(p2 / p1).toFixed(2)}배${cat ? "\n촉매 없을 때 " + sci(p0, 2) + " → 촉매가 " + sci(p1 / p0, 2) + "배로 늘림" : ""}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
