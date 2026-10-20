/* 기계5 유체역학 6단원: 펌프 회전 속도 제어와 상사 법칙 (06-02) */
(() => {
  "use strict";

  /* ── 펌프 회전 속도 제어: 상사 법칙과 배관 곡선 ── */
  (() => {
    const S = QSim.card("lab-me-affinity"); if (!S) return;
    const [cv] = S.$$("canvas");
    const N0 = 1750, H0 = 70, k = 5600, eta = 0.75, rg = 9810;
    function draw() {
      const c = QSim.col(), N = S.val("N"), Hs = S.val("Hs"), cs = (H0 - 5600 * 0.0025 - Hs) / 0.0025; // 1750 rpm에서 0.05 m³/s를 지나도록
      const r = N / N0, pump = (Q, rr) => H0 * rr * rr - k * Q * Q, sys = (Q) => Hs + cs * Q * Q;
      const Q = Math.sqrt(Math.max(H0 * r * r - Hs, 0) / (k + cs)), H = sys(Q), Pw = (rg * Q * H) / eta;
      const v = QSim.view(cv, 0.6), f = QSim.frame(v, { x0: 0, x1: 0.1, y0: 0, y1: 100, xl: "Q (m³/s)", yl: "H (m)", pad: 34 });
      f.axes();
      f.fn((x) => pump(x, 1), c.ink3, 1.5, [5, 4]);
      f.fn((x) => pump(x, r), c.main, 2.5);
      f.fn(sys, c.acc, 2);
      f.dot(Q, H, c.warn, 6);
      f.text("배관", 0.085, sys(0.085) - 6, c.acc); f.text(`펌프 ${N} rpm`, 0.005, pump(0, r) + 3, c.main);
      let tail = "";
      const Q0 = 0.05;
      if (Q > 1e-4 && Q < Q0 - 1e-6) {
        const Ht = pump(Q, 1), Pt = (rg * Q * Ht) / eta;
        f.dot(Q, Ht, c.ink2, 5);
        tail = `\n같은 유량을 1750 rpm에서 밸브로 조이면: 양정 ${Ht.toFixed(1)} m, 동력 ${(Pt / 1000).toFixed(2)} kW → 회전 속도 제어가 ${(100 * (1 - Pw / Pt)).toFixed(0)}% 절약`;
      }
      const aff = `상사 법칙만 쓰면(정수두 0일 때) 유량 ×${r.toFixed(3)}, 양정 ×${(r * r).toFixed(3)}, 동력 ×${(r ** 3).toFixed(3)}`;
      S.out(Q > 1e-4
        ? `회전 속도 ${N} rpm (1750의 ${r.toFixed(3)}배), 정수두(높이 차) ${Hs} m\n운전점(빨강): 유량 ${Q.toFixed(4)} m³/s, 양정 ${H.toFixed(1)} m, 축동력(효율 75%) ${(Pw / 1000).toFixed(2)} kW\n${aff}${tail}`
        : `회전 속도 ${N} rpm: 체절 양정 ${(H0 * r * r).toFixed(1)} m가 높이 차 ${Hs} m보다 낮아 물이 올라가지 않는다`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
