/* 공통4 실습: LC(및 RLC) 진동과 에너지 (07-03) */
(() => {
  "use strict";
  const S = QSim.card("lab-c4-lc"); if (!S) return;
  const [c1, c2] = S.$$("canvas"), Q0 = 10e-6;
  let st = [Q0, 0], t = 0, hist = [], heat = 0;
  const P = () => { const L = S.val("L") * 1e-3, C = S.val("C") * 1e-6, R = S.val("R"); const w0 = 1 / Math.sqrt(L * C); return { L, C, R, w0, T: (2 * Math.PI) / w0 }; };
  const reset = () => { st = [Q0, 0]; t = 0; hist = []; heat = 0; };
  function draw() {
    const Cc = QSim.col(), p = P(), q = st[0], i = st[1];
    const Ue = (q * q) / (2 * p.C), Um = 0.5 * p.L * i * i, U0 = (Q0 * Q0) / (2 * p.C);
    // 에너지 막대
    let v = QSim.view(c1, 0.32), f = QSim.frame(v, { x0: 0, x1: 3, y0: 0, y1: 1.15, pad: 18 });
    const bar = (x, val, col, lab) => { const g = v.g; g.fillStyle = col; g.fillRect(f.X(x - 0.3), f.Y(val), f.X(x + 0.3) - f.X(x - 0.3), f.Y(0) - f.Y(val)); f.text(lab, x, -0.12 + 0.02, Cc.ink2, "center"); };
    f.path([[0, 1], [3, 1]], Cc.rule, 1, [3, 3]);
    bar(0.5, Ue / U0, Cc.warn, "전기 q²/2C"); bar(1.5, Um / U0, Cc.main, "자기 ½Li²"); bar(2.5, Math.min(1, heat / U0), Cc.ink3, "열 (R)");
    // q(t)
    v = QSim.view(c2, 0.42); const span = 3 * p.T;
    f = QSim.frame(v, { x0: Math.max(0, t - span) / p.T, x1: Math.max(span, t) / p.T, y0: -1.1, y1: 1.1, xl: "t / T₀" }); f.axes();
    f.path(hist.map((h) => [h[0] / p.T, h[1] / Q0]), Cc.warn, 2.2);
    f.path(hist.map((h) => [h[0] / p.T, (h[2] * p.T) / (2 * Math.PI * Q0)]), Cc.main, 1.6, [5, 3]);
    const crit = 2 * Math.sqrt(p.L / p.C);
    S.out(`ω₀ = 1/√(LC) = ${p.w0.toPrecision(3)} rad/s, f₀ = ${(p.w0 / 2 / Math.PI).toPrecision(3)} Hz, T₀ = ${(p.T * 1e3).toPrecision(3)} ms (화면은 T₀가 약 2초)\n` +
      `전기 ${(100 * Ue / U0).toFixed(0)}% + 자기 ${(100 * Um / U0).toFixed(0)}% + 열 ${(100 * heat / U0).toFixed(0)}% = ${(100 * (Ue + Um + heat) / U0).toFixed(0)}%\n` +
      (p.R > 0 ? `R = ${p.R} Ω: 감쇠 진동${p.R >= crit ? " 없음(과감쇠, R ≥ 2√(L/C) = " + crit.toFixed(1) + " Ω)" : " (진동이 멈추는 경계 2√(L/C) = " + crit.toFixed(1) + " Ω)"}` : "R = 0: 에너지가 전기와 자기 사이를 끝없이 오간다") +
      `\n주황: q/Q₀, 파란 점선: 전류(크기 맞춤)`);
  }
  const Lp = QSim.loop((dt) => {
    const p = P(), sim = dt * (p.T / 2), n = 60, h = sim / n;
    for (let k = 0; k < n; k++) { const i0 = st[1]; st = QSim.rk4((_, y) => [y[1], -y[0] / (p.L * p.C) - (p.R / p.L) * y[1]], 0, st, h); heat += p.R * ((i0 + st[1]) / 2) ** 2 * h; t += h; }
    hist.push([t, st[0], st[1]]); if (hist.length > 1200) hist.shift(); draw();
  }).watch(S.root);
  const setBtn = QSim.playButton(S.$(".play"), Lp);
  S.$(".reset").addEventListener("click", () => { reset(); draw(); });
  S.on(() => { reset(); if (!Lp.running) draw(); });
  QSim.redrawOn(draw); draw();
})();
