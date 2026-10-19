/* 수학9 탐구: t분포와 정규분포 — 꼬리 확률, 2.5% 분위수, ±1.96 구간의 실제 포함 확률 */
(() => {
  "use strict";
  const S = MKit.setup("card-m9-tdist", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  function draw() {
    const col = QSim.col(), df = k.val("k"), cc = k.val("c"), g = v.g;
    const F = QSim.frame(v, { x0: -5, x1: 5, y0: 0, y1: 0.45, pad: 28, xl: "t", yl: "밀도" });
    F.axes();
    g.fillStyle = col.warn; g.globalAlpha = 0.25;
    [[-5, -cc], [cc, 5]].forEach(([a, b]) => { g.beginPath(); g.moveTo(F.X(a), F.Y(0)); for (let i = 0; i <= 60; i++) { const x = a + ((b - a) * i) / 60; g.lineTo(F.X(x), F.Y(M9.tPdf(x, df))); } g.lineTo(F.X(b), F.Y(0)); g.fill(); });
    g.globalAlpha = 1;
    F.fn((x) => M9.normPdf(x), col.ink3, 1.6, [5, 4]);
    F.fn((x) => M9.tPdf(x, df), col.main, 2.4);
    const pt = 2 * (1 - M9.tCdf(cc, df)), pz = 2 * (1 - M9.normCdf(cc)), q = M9.quant((t) => M9.tCdf(t, df), 0.975, 0, 1000), cov = 2 * M9.tCdf(1.96, df) - 1;
    k.out(`자유도 ${df} · P(|T| > ${fmt(cc, 2)}) = ${fmt(pt, 4)} (정규 ${fmt(pz, 4)}) · t₀.₀₂₅ = ${fmt(q, 3)} (정규 1.96)\n표본 크기 ${df + 1}에서 ±1.96을 쓰면 실제 포함 확률 ${fmt(cov, 4)}`);
  }
  S.redraw();
})();
