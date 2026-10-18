/* 화학과 유기화학실험 탐구 카드 묶음 (화학7 유기화학실험)
   재결정 회수율, TLC */
(() => {
  "use strict";
  const C = () => QSim.col();
  const RED = "#b5562a";

  /* 1. 재결정: 용매량, 식히는 온도, 불순물 (화학7-01-02) */
  (() => {
    const S = QSim.card("lab-ch7-recryst"); if (!S) return;
    const cv = S.$("canvas");
    // 물에 대한 용해도 (g/100 mL): 0 °C와 100 °C 값을 지수 함수로 잇는 단순 모형
    const CMP = { bz: { n: "벤조산", s0: 0.17, s100: 5.9 }, ac: { n: "아세트아닐라이드", s0: 0.53, s100: 5.5 } };
    const sol = (s0, s100, T) => s0 * Math.exp(Math.log(s100 / s0) * T / 100);
    const imp = (T) => 0.5 * Math.exp(0.02 * T);   // 가상의 불순물 X: 0 °C에서 0.50 g/100 mL
    function draw() {
      const c = C(), k = CMP[S.val("cmp")], m = S.val("m"), mult = S.val("mult"), Tc = S.val("Tc"), mi = S.val("imp");
      const s = (T) => sol(k.s0, k.s100, T);
      const Vmin = m / k.s100 * 100, V = mult * Vmin;
      const dis = Math.min(m, k.s100 * V / 100), undis = m - dis;
      const left = Math.min(dis, s(Tc) * V / 100), rec = dis - left;
      const ix = Math.max(0, mi - imp(Tc) * V / 100), pur = rec + ix > 0 ? 100 * rec / (rec + ix) : 0;
      // 그래프: 이 용매 부피에 녹을 수 있는 양(g)과 온도
      const top = Math.max(m * 1.6, 1);
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: 100, y0: 0, y1: top, xl: "온도 (°C)", yl: `이 용매(${V.toFixed(1)} mL)에 녹는 양 (g)`, pad: 36 });
      f.axes();
      f.fn((T) => s(T) * V / 100, c.main, 2.5);
      f.fn((T) => imp(T) * V / 100, RED, 2);
      f.fn(() => m, c.main, 1, [5, 4]);
      f.fn(() => mi, RED, 1, [5, 4]);
      f.dot(Tc, s(Tc) * V / 100, c.warn, 6);
      f.text(k.n, 70, Math.min(top * 0.95, s(70) * V / 100 + top * 0.04), c.main);
      f.text("불순물 X (가상)", 70, Math.min(top * 0.9, imp(70) * V / 100 + top * 0.04), RED);
      let t = `${k.n} ${m.toFixed(2)} g, 물 ${V.toFixed(1)} mL (최소량 ${Vmin.toFixed(1)} mL의 ${mult.toFixed(1)}배), ${Tc} °C까지 식힘\n`;
      if (undis > 1e-9) t += `끓여도 ${undis.toFixed(3)} g이 녹지 않음 → 뜨거운 여과로 걸러 내면 그만큼 잃는다\n`;
      t += `모액에 녹아 남는 양 ${left.toFixed(3)} g → 결정 ${rec.toFixed(3)} g, 회수율 ${(100 * rec / m).toFixed(1)}%\n`;
      t += ix > 0 ? `불순물 X ${ix.toFixed(3)} g이 함께 석출 → 결정 순도 ${pur.toFixed(1)}%` : `불순물 X ${mi.toFixed(2)} g은 모두 모액에 남음 → 결정 순도 100%`;
      S.out(t);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
