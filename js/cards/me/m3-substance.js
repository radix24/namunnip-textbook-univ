/* 기계3 열역학 3단원: 증기표로 상태 찾기 (03-01), 반데르발스 기체의 압축성 인자 (03-02) */
(() => {
  "use strict";
  const mono = () => "11px " + (getComputedStyle(document.documentElement).getPropertyValue("--f-mono") || "monospace");

  /* ── 물의 상태 찾기: 압력 기준 포화표 몇 줄 (Çengel 표 A-5) ── */
  (() => {
    const S = QSim.card("lab-me-steamtab"); if (!S) return;
    const [cv] = S.$$("canvas");
    // P kPa, Tsat °C, vf, vg (m³/kg), hf, hfg (kJ/kg)
    const TAB = {
      10: [45.81, 0.001010, 14.670, 191.81, 2392.1], 50: [81.32, 0.001030, 3.2403, 340.54, 2304.7],
      100: [99.61, 0.001043, 1.6941, 417.51, 2257.5], 200: [120.21, 0.001061, 0.88578, 504.70, 2201.6],
      500: [151.83, 0.001093, 0.37483, 640.09, 2108.0], 1000: [179.88, 0.001127, 0.19436, 762.51, 2014.6],
      2000: [212.38, 0.001177, 0.09959, 908.47, 1889.8], 5000: [263.94, 0.001286, 0.03945, 1154.5, 1640.0],
    };
    function draw() {
      const c = QSim.col(), P = +S.val("P"), [Ts, vf, vg, hf, hfg] = TAB[P], lv = S.val("lv"), v = Math.pow(10, lv);
      // T-v 선도 (로그 v): 표의 포화점들로 돔을 그린다
      const vv = QSim.view(cv, 0.6), f = QSim.frame(vv, { x0: -3.2, x1: 1.4, y0: 0, y1: 400, xl: "log₁₀ v (m³/kg)", yl: "T (°C)", pad: 36 }); f.axes();
      const keys = Object.keys(TAB).map(Number).sort((a, b) => a - b);
      f.path(keys.map((k) => [Math.log10(TAB[k][1]), TAB[k][0]]).concat([[Math.log10(0.003106), 373.95]]), c.ink2, 2);
      f.path([[Math.log10(0.003106), 373.95]].concat(keys.slice().reverse().map((k) => [Math.log10(TAB[k][2]), TAB[k][0]])), c.ink2, 2);
      f.path([[Math.log10(vf), Ts], [Math.log10(vg), Ts]], c.acc, 2, [5, 4]);
      let region, T, x = NaN, h = NaN;
      if (v < vf) { region = "압축액 (같은 온도의 포화액 값으로 근사)"; T = Ts - 20 * (Math.log10(vf) - lv); }
      else if (v <= vg) { region = "포화 혼합물"; T = Ts; x = (v - vf) / (vg - vf); h = hf + x * hfg; }
      else { region = "과열 증기 (과열 증기표에서 T를 찾음)"; T = Ts + 60 * (lv - Math.log10(vg)); }
      f.dot(lv, Math.min(395, T), c.warn, 6);
      const g = vv.g; g.font = mono(); g.fillStyle = c.ink3; g.fillText("임계점", f.X(Math.log10(0.003106)) - 16, f.Y(380));
      S.out(`P = ${P} kPa: T_sat = ${Ts} °C, v_f = ${vf}, v_g = ${vg} m³/kg\n지금 v = ${v.toPrecision(4)} m³/kg → ${region}${isNaN(x) ? "" : `\n건도 x = (v − v_f)/(v_g − v_f) = ${x.toFixed(3)}, h = h_f + x h_fg = ${h.toFixed(1)} kJ/kg, 증기의 부피 비율 ${((x * vg) / v * 100).toFixed(1)}%`}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* ── 반데르발스 CO₂의 등온선과 Z ── */
  (() => {
    const S = QSim.card("lab-me-vdw"); if (!S) return;
    const [cv] = S.$$("canvas");
    const R = 0.18892, Tc = 304.1, Pc = 7380, a = (27 * R * R * Tc * Tc) / (64 * Pc), b = (R * Tc) / (8 * Pc);
    const Pv = (v, T) => (R * T) / (v - b) - a / (v * v);
    // 주어진 P, T에서 기체 쪽(가장 큰) 근
    function vGas(P, T) {
      const hi = ((R * T) / P) * 5, lo = b * 1.0001, n = 20000; let root = null;
      for (let i = n; i > 0; i--) { const v1 = lo + ((hi - lo) * (i - 1)) / n, v2 = lo + ((hi - lo) * i) / n; if ((Pv(v1, T) - P) * (Pv(v2, T) - P) <= 0) { root = [v1, v2]; break; } }
      if (!root) return NaN; let [l, h] = root; for (let k = 0; k < 60; k++) { const m = (l + h) / 2; if ((Pv(l, T) - P) * (Pv(m, T) - P) <= 0) h = m; else l = m; } return (l + h) / 2;
    }
    function draw() {
      const c = QSim.col(), T = S.val("T"), P = S.val("P") * 1000;
      const v = QSim.view(cv, 0.6), f = QSim.frame(v, { x0: Math.log10(0.0012), x1: Math.log10(0.2), y0: 0, y1: 16, xl: "log₁₀ v (m³/kg)", yl: "P (MPa)", pad: 36 }); f.axes();
      [260, 280, 304.1, 330, 380].forEach((TT) => {
        const pts = []; for (let i = 0; i <= 300; i++) { const lv = Math.log10(0.0012) + (i / 300) * (Math.log10(0.2) - Math.log10(0.0012)); const p = Pv(Math.pow(10, lv), TT) / 1000; if (p > -2 && p < 17) pts.push([lv, p]); }
        f.path(pts, Math.abs(TT - 304.1) < 0.1 ? c.ink2 : c.rule, Math.abs(TT - 304.1) < 0.1 ? 1.5 : 1);
      });
      const cur = [], ideal = []; for (let i = 0; i <= 300; i++) { const lv = Math.log10(0.0012) + (i / 300) * (Math.log10(0.2) - Math.log10(0.0012)), vv = Math.pow(10, lv), p = Pv(vv, T) / 1000; if (p > -2 && p < 17) cur.push([lv, p]); const pi = (R * T) / vv / 1000; if (pi < 17) ideal.push([lv, pi]); }
      f.path(ideal, c.ink3, 1.5, [5, 4]); f.path(cur, c.main, 2.5);
      const vg = vGas(P, T), Z = (P * vg) / (R * T);
      if (isFinite(vg)) f.dot(Math.log10(vg), P / 1000, c.warn, 6);
      S.out(`CO₂ 반데르발스 모형 (T_cr = 304.1 K, P_cr = 7.38 MPa): a = ${a.toFixed(4)} kPa·m⁶/kg², b = ${b.toExponential(3)} m³/kg\nT = ${T} K (T_R = ${(T / Tc).toFixed(2)}), P = ${(P / 1000).toFixed(1)} MPa (P_R = ${(P / Pc).toFixed(2)})\n기체 쪽 해 v = ${isFinite(vg) ? vg.toFixed(5) : "-"} m³/kg, 이상기체 v = RT/P = ${((R * T) / P).toFixed(5)} m³/kg, Z = ${isFinite(Z) ? Z.toFixed(3) : "-"}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
