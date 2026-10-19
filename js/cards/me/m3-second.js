/* 기계3 열역학 6단원: Carnot 한계 (06-01), 압축기·터빈의 T-s 선도와 등엔트로피 효율 (06-03) */
(() => {
  "use strict";

  /* ── Carnot 한계: 열기관 효율과 냉동기·열펌프 COP ── */
  (() => {
    const S = QSim.card("card-me-carnot"); if (!S) return;
    const [cv] = S.$$("canvas");
    function draw() {
      const c = QSim.col(), TH = S.val("TH") + 273.15, TL = S.val("TL") + 273.15, claim = S.val("claim") / 100;
      if (TH <= TL) { QSim.view(cv, 0.55); S.out("고온 T_H가 저온 T_L보다 높아야 합니다."); return; }
      const eta = 1 - TL / TH, copR = TL / (TH - TL), copHP = TH / (TH - TL);
      const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: 0, x1: 1500, y0: 0, y1: 1, xl: "T_H (°C)", yl: "η_max", pad: 34 }); f.axes();
      f.fn((t) => (t + 273.15 > TL ? 1 - TL / (t + 273.15) : NaN), c.main, 2.5);
      f.dot(S.val("TH"), eta, c.warn, 5);
      f.path([[0, claim], [1500, claim]], claim > eta ? c.warn : c.acc, 1.5, [5, 4]);
      f.text(`주장 ${(claim * 100).toFixed(0)}%`, 1480, claim + 0.03, claim > eta ? c.warn : c.acc, "right");
      S.out(`T_H = ${TH.toFixed(1)} K, T_L = ${TL.toFixed(1)} K (켈빈으로 바꿔 계산)\nCarnot 효율 1 − T_L/T_H = ${(eta * 100).toFixed(1)}% → 주장된 효율 ${(claim * 100).toFixed(0)}%는 ${claim > eta ? "불가능 (제2법칙 위반)" : "가능 (한계 이하)"}\n같은 두 온도 사이의 최대 COP: 냉동기 ${copR.toFixed(2)}, 열펌프 ${copHP.toFixed(2)} (COP_HP = COP_R + 1)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* ── 압축기와 터빈: 등엔트로피 대 실제 (공기, 비열 일정) ── */
  (() => {
    const S = QSim.card("lab-me-isen"); if (!S) return;
    const [cv] = S.$$("canvas");
    const cp = 1.005, R = 0.287, k = 1.4;
    function draw() {
      const c = QSim.col(), dev = S.val("dev"), rp = S.val("rp"), eff = S.val("eff") / 100;
      const T1 = dev === "comp" ? 300 : 1200, P1 = dev === "comp" ? 100 : 100 * rp, P2 = dev === "comp" ? 100 * rp : 100;
      const T2s = T1 * Math.pow(P2 / P1, (k - 1) / k);
      const T2a = dev === "comp" ? T1 + (T2s - T1) / eff : T1 - eff * (T1 - T2s);
      const s = (T, P) => cp * Math.log(T / 300) - R * Math.log(P / 100);
      const ws = cp * Math.abs(T2s - T1), wa = cp * Math.abs(T2a - T1), sgen = s(T2a, P2) - s(T1, P1);
      const ss = [s(T1, P1), s(T2a, P2)], smin = Math.min(...ss) - 0.15, smax = Math.max(...ss) + 0.25, Tmax = Math.max(T1, T2a) * 1.15;
      const v = QSim.view(cv, 0.6), f = QSim.frame(v, { x0: smin, x1: smax, y0: 0, y1: Tmax, xl: "s (kJ/kg·K)", yl: "T (K)", pad: 36 }); f.axes();
      // 두 등압선
      [P1, P2].forEach((P) => { const pts = []; for (let i = 0; i <= 60; i++) { const T = 150 + (Tmax - 150) * (i / 60); pts.push([s(T, P), T]); } f.path(pts, c.rule, 1); });
      f.path([[s(T1, P1), T1], [s(T2s, P2), T2s]], c.ink3, 2, [5, 4]);
      f.path([[s(T1, P1), T1], [s(T2a, P2), T2a]], c.main, 2.5);
      f.dot(s(T1, P1), T1, c.ink, 4); f.dot(s(T2s, P2), T2s, c.ink3, 4); f.dot(s(T2a, P2), T2a, c.warn, 5);
      f.text("1", s(T1, P1) + 0.01, T1 + Tmax * 0.03, c.ink); f.text("2s", s(T2s, P2) - 0.06, T2s + Tmax * 0.03, c.ink3); f.text("2a", s(T2a, P2) + 0.01, T2a + Tmax * 0.03, c.warn);
      S.out(`${dev === "comp" ? "압축기" : "터빈"}: ${P1.toFixed(0)} kPa, ${T1} K → ${P2.toFixed(0)} kPa\n등엔트로피 출구 ${T2s.toFixed(1)} K, 일 ${ws.toFixed(1)} kJ/kg / 실제 출구 ${T2a.toFixed(1)} K, 일 ${wa.toFixed(1)} kJ/kg (효율 ${(eff * 100).toFixed(0)}%)\n엔트로피 생성 s₂ₐ − s₁ = ${sgen.toFixed(4)} kJ/kg·K${dev === "comp" ? `, 추가로 드는 일 ${(wa - ws).toFixed(1)} kJ/kg` : `, 잃은 일 ${(ws - wa).toFixed(1)} kJ/kg`}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
