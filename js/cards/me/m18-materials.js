/* 기계18 공학재료: 철-탄소 상태도의 지렛대 법칙 (04-01) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-lever"); if (!S) return;
  const [cv] = S.$$("canvas");
  // 강 영역을 직선으로 단순화한 철-탄소 상태도 (wt% C, °C)
  const EU = { c: 0.76, T: 727 }, CA = 0.022, CEM = 6.7;
  const cAlpha = (T) => (CA * (912 - T)) / 185; // α 고용 한도
  const cA3 = (T) => (EU.c * (912 - T)) / 185; // A3선
  const cAcm = (T) => EU.c + ((2.14 - EU.c) * (T - EU.T)) / (1147 - EU.T); // Acm선
  function region(C, T) {
    if (T >= EU.T) {
      if (T < 912 && C < cAlpha(T)) return { name: "α (페라이트)", one: true };
      if (T < 912 && C < cA3(T)) return { name: "α + γ", lo: ["α", cAlpha(T)], hi: ["γ", cA3(T)] };
      if (C <= cAcm(T)) return { name: "γ (오스테나이트)", one: true };
      return { name: "γ + Fe₃C", lo: ["γ", cAcm(T)], hi: ["Fe₃C", CEM] };
    }
    return { name: "α + Fe₃C", lo: ["α", CA], hi: ["Fe₃C", CEM], below: true };
  }
  function draw() {
    const c = QSim.col(), C = S.val("c"), T = S.val("t");
    const v = QSim.view(cv, 0.62), f = QSim.frame(v, { x0: 0, x1: 2, y0: 600, y1: 1000, xl: "탄소 (wt%)", yl: "온도 (°C)", pad: 36 });
    f.axes();
    f.path([[0, 912], [EU.c, EU.T]], c.ink, 2); // A3
    f.path([[EU.c, EU.T], [2, cAcmInv(2)]], c.ink, 2); // Acm
    f.path([[0, 912], [CA, EU.T]], c.ink, 2); // α 한계
    f.path([[CA, EU.T], [2, EU.T]], c.ink, 2); // 공석선
    f.text("γ", 0.95, 920, c.ink2); f.text("α + γ", 0.08, 760, c.ink2); f.text("γ + Fe₃C", 1.45, 800, c.ink2);
    f.text("α + Fe₃C", 0.9, 650, c.ink2); f.text("공석 0.76%, 727 °C", 0.8, 712, c.ink3);
    const R = region(C, T);
    if (!R.one) {
      const x1 = Math.min(2, R.hi[1]);
      f.path([[R.lo[1], T], [x1, T]], c.acc, 2.5);
      f.dot(R.lo[1], T, c.acc, 4); if (R.hi[1] <= 2) f.dot(R.hi[1], T, c.acc, 4);
    }
    f.dot(C, T, c.warn, 6);
    const lines = [`조성 ${C.toFixed(2)}% C, ${T} °C: ${R.name}`];
    if (R.one) lines.push("단상: 상의 조성 = 합금 조성, 분율 100%");
    else {
      const [a, ca] = R.lo, [b, cb] = R.hi, wb = (C - ca) / (cb - ca);
      lines.push(`연결선 양 끝: ${a} ${ca.toFixed(ca < 0.1 ? 3 : 2)}%, ${b} ${cb.toFixed(2)}%`);
      lines.push(`지렛대 법칙: ${a} ${(100 * (1 - wb)).toFixed(1)}%, ${b} ${(100 * wb).toFixed(1)}%`);
    }
    if (R.below) {
      if (Math.abs(C - EU.c) < 0.005) lines.push("조직: 펄라이트 100% (공석강)");
      else if (C < EU.c) { const wp = (EU.c - C) / (EU.c - CA); lines.push(`조직: 초석 페라이트 ${(100 * wp).toFixed(1)}%, 펄라이트 ${(100 * (1 - wp)).toFixed(1)}% (아공석강)`); }
      else { const wc = (C - EU.c) / (CEM - EU.c); lines.push(`조직: 초석 시멘타이트 ${(100 * wc).toFixed(1)}%, 펄라이트 ${(100 * (1 - wc)).toFixed(1)}% (과공석강)`); }
    }
    S.out(lines.join("\n"));
  }
  function cAcmInv(C) { return EU.T + ((C - EU.c) * (1147 - EU.T)) / (2.14 - EU.c); }
  S.on(draw); QSim.redrawOn(draw); draw();
})();
