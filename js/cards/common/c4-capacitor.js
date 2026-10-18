/* 공통4 실습: 평행판 축전기와 유전체 (04-01, 04-02) */
(() => {
  "use strict";
  const S = QSim.card("lab-c4-capacitor"); if (!S) return;
  const cv = S.$("canvas"), E0 = 8.85e-12;
  let Qfix = null; // 전지를 떼는 순간의 전하
  const vals = () => {
    const A = S.val("A") * 1e-4, d = S.val("d") * 1e-3, K = S.val("K"), V0 = S.val("V");
    const C = (K * E0 * A) / d;
    let Q, V;
    if (S.val("bat")) { V = V0; Q = C * V; Qfix = null; }
    else { if (Qfix === null) Qfix = C * V0; Q = Qfix; V = Q / C; }
    return { A, d, K, C, Q, V, E: V / d, U: 0.5 * C * V * V };
  };
  const fmt = (x, u) => { const p = [["p", 1e-12], ["n", 1e-9], ["μ", 1e-6], ["m", 1e-3], ["", 1]]; let s = p[0]; for (const q of p) if (Math.abs(x) >= q[1]) s = q; return (x / s[1]).toPrecision(3) + " " + s[0] + u; };
  function draw() {
    const Cc = QSim.col(), v = QSim.view(cv, 0.5), o = vals();
    const f = QSim.frame(v, { x0: 0, x1: 10, y0: 0, y1: 5, pad: 6 });
    const w = 1 + Math.sqrt(S.val("A")) / 2.2, gap = 0.4 + S.val("d") * 0.45, cx = 5, top = 2.5 + gap / 2, bot = 2.5 - gap / 2;
    const g = v.g;
    if (o.K > 1.001) { g.fillStyle = Cc.soft; g.globalAlpha = Math.min(0.8, 0.15 + (o.K - 1) / 12); g.fillRect(f.X(cx - w / 2), f.Y(top), f.X(cx + w / 2) - f.X(cx - w / 2), f.Y(bot) - f.Y(top)); g.globalAlpha = 1; }
    g.fillStyle = Cc.warn; g.fillRect(f.X(cx - w / 2), f.Y(top + 0.15), f.X(cx + w / 2) - f.X(cx - w / 2), f.Y(top) - f.Y(top + 0.15));
    g.fillStyle = Cc.main; g.fillRect(f.X(cx - w / 2), f.Y(bot), f.X(cx + w / 2) - f.X(cx - w / 2), f.Y(bot - 0.15) - f.Y(bot));
    const n = Math.max(2, Math.min(14, Math.round(Math.log10(o.Q * 1e12 + 1) * 3)));
    for (let i = 0; i < n; i++) { const x = cx - w / 2 + (w * (i + 0.5)) / n; f.text("+", x, top + 0.3, Cc.warn, "center"); f.text("−", x, bot - 0.5, Cc.main, "center"); }
    const ne = Math.max(1, Math.min(9, Math.round(o.E / 2000)));
    for (let i = 0; i < ne; i++) { const x = cx - w / 2 + (w * (i + 0.5)) / ne; f.arrow(x, top - 0.05, 0, -(gap - 0.1), Cc.ink3); }
    // 전지
    f.path([[cx - w / 2 - 0.2, top + 0.07], [1.2, top + 0.07], [1.2, 3.4]], Cc.ink2, 1.5);
    f.path([[cx - w / 2 - 0.2, bot - 0.07], [1.2, bot - 0.07], [1.2, 1.6]], Cc.ink2, 1.5);
    if (S.val("bat")) { f.path([[0.8, 3.4], [1.6, 3.4]], Cc.ink, 3); f.path([[1.0, 3.2], [1.4, 3.2]], Cc.ink, 3); f.path([[1.2, 3.2], [1.2, 1.6]], Cc.ink2, 1.5); f.text(`${S.val("V")} V`, 1.8, 3.2, Cc.ink2); }
    else { f.text("전지 분리", 0.3, 2.5, Cc.ink3); }
    S.out(`C = Kε₀A/d = ${fmt(o.C, "F")}   Q = ${fmt(o.Q, "C")}   V = ${o.V.toPrecision(3)} V\n판 사이 전기장 E = V/d = ${o.E.toPrecision(3)} V/m   저장 에너지 U = ½CV² = ${fmt(o.U, "J")}` +
      (S.val("bat") ? "\n전지 연결: V 일정" : "\n전지 분리: Q 일정 (뗀 순간의 전하 유지)"));
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();
