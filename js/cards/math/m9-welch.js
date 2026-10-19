/* 수학9 탐구: 두 평균 차의 95% 구간 — 합동 t와 웰치의 실제 포함 비율 (분산비, 표본 크기) */
(() => {
  "use strict";
  const S = MKit.setup("card-m9-welch", 0.42, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const R = 3000;
  function draw() {
    const c = QSim.col(), n1 = k.val("n1"), n2 = k.val("n2"), ratio = k.val("r"), g = v.g, W = v.W, H = v.H;
    const s1 = ratio, s2 = 1, { n: rn } = M9.rng(99 + n1 * 100 + n2 + Math.round(ratio * 1000));
    const tq = {}; const tquant = (df) => { const key = Math.round(df * 100); if (!(key in tq)) tq[key] = M9.quant((x) => M9.tCdf(x, df), 0.975, 0, 1000); return tq[key]; };
    const tp = tquant(n1 + n2 - 2);
    let cp = 0, cw = 0, wp = 0, ww = 0;
    for (let r = 0; r < R; r++) {
      let a = 0, b = 0; const xa = [], xb = [];
      for (let i = 0; i < n1; i++) { const x = s1 * rn(); xa.push(x); a += x; }
      for (let i = 0; i < n2; i++) { const x = s2 * rn(); xb.push(x); b += x; }
      const ma = a / n1, mb = b / n2, va = xa.reduce((s, x) => s + (x - ma) ** 2, 0) / (n1 - 1), vb = xb.reduce((s, x) => s + (x - mb) ** 2, 0) / (n2 - 1);
      const d = ma - mb, sp = Math.sqrt(((n1 - 1) * va + (n2 - 1) * vb) / (n1 + n2 - 2)), hp = tp * sp * Math.sqrt(1 / n1 + 1 / n2);
      const q1 = va / n1, q2 = vb / n2, nu = (q1 + q2) ** 2 / ((q1 * q1) / (n1 - 1) + (q2 * q2) / (n2 - 1)), hw = tquant(Math.max(1, Math.round(nu * 4) / 4)) * Math.sqrt(q1 + q2);
      if (Math.abs(d) <= hp) cp++; if (Math.abs(d) <= hw) cw++; wp += 2 * hp; ww += 2 * hw;
    }
    const bars = [[cp / R, c.warn, "합동 t"], [cw / R, c.main, "웰치"]];
    const F = QSim.frame(v, { x0: 0, x1: 3, y0: 0.6, y1: 1, pad: 28, xl: "", yl: "포함 비율" });
    F.axes({ noGrid: true });
    F.path([[0, 0.95], [3, 0.95]], c.ink, 1.2, [5, 4]);
    bars.forEach(([p, col, lab], i) => { g.fillStyle = col; const X0 = F.X(i + 0.65), X1 = F.X(i + 1.35); g.fillRect(X0, F.Y(Math.max(0.6, p)), X1 - X0, F.Y(0.6) - F.Y(Math.max(0.6, p))); F.text(lab, i + 0.75, Math.max(0.62, p) + 0.015, c.ink2); });
    k.out(`n₁ = ${n1} (σ₁ = ${fmt(s1, 2)}), n₂ = ${n2} (σ₂ = 1), 모의 ${R}번 · 목표 포함 비율 0.95 (점선)\n합동 t: ${fmt(cp / R, 4)} (평균 폭 ${fmt(wp / R, 3)}) · 웰치: ${fmt(cw / R, 4)} (평균 폭 ${fmt(ww / R, 3)})`);
  }
  S.redraw();
})();
