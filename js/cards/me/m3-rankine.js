/* 기계3 열역학 7단원: Rankine 사이클의 에너지 흐름과 장치 효율 (07-01) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-rankine"); if (!S) return;
  const [cv] = S.$$("canvas");
  // 4 MPa, 400 °C → 10 kPa (Çengel 증기표 값)
  const h1 = 191.81, v1 = 0.00101, P1 = 10, P2 = 4000, h3 = 3214.5, s3 = 6.7714, sf = 0.6492, sfg = 7.4996, hfg = 2392.1;
  function draw() {
    const c = QSim.col(), eT = S.val("eT") / 100, eP = S.val("eP") / 100, MW = S.val("MW");
    const wps = v1 * (P2 - P1), wp = wps / eP, h2 = h1 + wp;
    const x4s = (s3 - sf) / sfg, h4s = h1 + x4s * hfg, wt = eT * (h3 - h4s), h4 = h3 - wt, x4 = (h4 - h1) / hfg;
    const qin = h3 - h2, qout = h4 - h1, wnet = wt - wp, eta = wnet / qin, mdot = (MW * 1000) / wnet;
    // 에너지 흐름 막대
    const v = QSim.view(cv, 0.42), g = v.g, W = v.W, H = v.H, x0 = 16, x1 = W - 16, sc = (x1 - x0) / qin;
    const bar = (y, h, parts) => { let x = x0; parts.forEach(([val, col, lab]) => { const w = val * sc; g.fillStyle = col; g.fillRect(x, y, w, h); g.fillStyle = c.card; g.font = "12px " + getComputedStyle(document.documentElement).getPropertyValue("--f-mono"); if (w > 70) g.fillText(lab, x + 6, y + h / 2 + 4); x += w; }); };
    g.fillStyle = c.ink2; g.font = "12px " + getComputedStyle(document.documentElement).getPropertyValue("--f-mono");
    g.fillText(`보일러 공급 열 ${qin.toFixed(0)} kJ/kg`, x0, 20); bar(28, 30, [[qin, c.ink3, "q_in"]]);
    g.fillStyle = c.ink2; g.fillText("어디로 가나", x0, 84); bar(92, 30, [[wnet, c.main, `순일 ${wnet.toFixed(0)}`], [qout, c.warn, `복수기 ${qout.toFixed(0)}`]]);
    g.fillStyle = c.ink3; g.fillText(`펌프 일 ${wp.toFixed(1)} kJ/kg는 너무 작아 막대에 거의 보이지 않음`, x0, H - 8);
    S.out(`터빈 효율 ${(eT * 100).toFixed(0)}%: 터빈 일 ${wt.toFixed(1)} kJ/kg, 출구 h₄ = ${h4.toFixed(1)}, 건도 ${x4.toFixed(3)}${x4 < 0.88 ? " (0.88 미만: 날개 침식 위험)" : ""}\n펌프 효율 ${(eP * 100).toFixed(0)}%: 펌프 일 ${wp.toFixed(2)} kJ/kg / 공급 열 ${qin.toFixed(1)}, 방열 ${qout.toFixed(1)} kJ/kg\n열효율 η = ${(eta * 100).toFixed(1)}%, ${MW} MW에 필요한 증기 유량 ${mdot.toFixed(1)} kg/s`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();
