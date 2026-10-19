/* 수학4 탐구: 2차원 자료의 로지스틱 회귀 — 경사하강법으로 찾는 결정 경계와 확률 */
(() => {
  "use strict";
  const S = MKit.setup("card-m4-logistic", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  let s = 11; const u = () => { s = (s + 0x6d2b79f5) | 0; let r = Math.imul(s ^ (s >>> 15), 1 | s); r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r; return (((r ^ (r >>> 14)) >>> 0) + 0.5) / 4294967296; };
  const gauss = () => Math.sqrt(-2 * Math.log(u())) * Math.cos(2 * Math.PI * u());
  const Z = Array.from({ length: 60 }, (_, i) => ({ a: gauss(), b: gauss(), y: i < 30 ? 0 : 1 }));
  const sig = (t) => 1 / (1 + Math.exp(-t));
  function draw() {
    const c = QSim.col(), d = k.val("d"), eta = k.val("eta"), N = k.val("n");
    const ux = 0.8, uy = 0.6;
    const P = Z.map((z) => { const sgn = z.y ? 1 : -1; return { x: z.a + (sgn * d * ux) / 2, y: z.b + (sgn * d * uy) / 2, t: z.y }; });
    let w1 = 0, w2 = 0, b = 0;
    for (let it = 0; it < N; it++) {
      let g1 = 0, g2 = 0, gb = 0;
      for (const p of P) { const e = sig(w1 * p.x + w2 * p.y + b) - p.t; g1 += e * p.x; g2 += e * p.y; gb += e; }
      w1 -= (eta * g1) / P.length; w2 -= (eta * g2) / P.length; b -= (eta * gb) / P.length;
    }
    let loss = 0, acc = 0;
    for (const p of P) {
      const q = Math.min(1 - 1e-15, Math.max(1e-15, sig(w1 * p.x + w2 * p.y + b)));
      loss -= p.t ? Math.log(q) : Math.log(1 - q);
      if ((q >= 0.5 ? 1 : 0) === p.t) acc++;
    }
    loss /= P.length;
    const F = QSim.frame(v, { x0: -6, x1: 6, y0: -3, y1: 3, pad: 22, xl: "x₁", yl: "x₂" });
    F.axes({ noGrid: true });
    const line = (lv, col, wd, dash) => {
      // w1 x + w2 y + b = lv 를 그린다
      if (Math.abs(w2) > Math.abs(w1)) F.path([[-6, (lv - b + 6 * w1) / w2], [6, (lv - b - 6 * w1) / w2]], col, wd, dash);
      else if (Math.abs(w1) > 1e-12) F.path([[(lv - b + 3 * w2) / w1, -3], [(lv - b - 3 * w2) / w1, 3]], col, wd, dash);
    };
    const L9 = Math.log(9);
    line(0, c.main, 2.2); line(L9, c.ink3, 1, [4, 4]); line(-L9, c.ink3, 1, [4, 4]);
    P.forEach((p) => F.dot(p.x, p.y, p.t ? c.acc : c.warn, 4));
    const nw = Math.hypot(w1, w2);
    k.out(`평균 사이 거리 ${fmt(d, 1)} · η = ${fmt(eta, 2)} · ${N}번 뒤: 손실(평균 교차 엔트로피) ${loss < 1e-3 ? loss.toExponential(1) : fmt(loss, 4)}, 정확도 ${acc}/60\n결정 경계(실선) ${fmt(w1, 3)}x₁ ${w2 < 0 ? "−" : "+"} ${fmt(Math.abs(w2), 3)}x₂ ${b < 0 ? "−" : "+"} ${fmt(Math.abs(b), 3)} = 0 · 점선은 확률 0.1과 0.9 · ‖w‖ = ${fmt(nw, 3)}`);
  }
  S.redraw();
})();
