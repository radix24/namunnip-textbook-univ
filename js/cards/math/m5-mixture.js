/* 수학5 탐구: 두 집단의 혼합 — 집단 안 분산 + 집단 사이 분산 = 전체 분산 */
(() => {
  "use strict";
  const S = MKit.setup("card-m5-mixture", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const phi = (z) => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
  function draw() {
    const c = QSim.col(), p = k.val("p"), d = k.val("d"), sd = k.val("s"), g = v.g, W = v.W, H = v.H;
    const m1 = 160, m2 = 160 + d, mean = p * m1 + (1 - p) * m2, within = sd * sd, between = p * (1 - p) * d * d, tot = within + between;
    const fA = (x) => (p * phi((x - m1) / sd)) / sd, fB = (x) => ((1 - p) * phi((x - m2) / sd)) / sd;
    let ym = 0; for (let x = 130; x <= 210; x += 0.5) ym = Math.max(ym, fA(x) + fB(x));
    const F = QSim.frame({ g, W: W * 0.68, H }, { x0: 130, x1: 210, y0: 0, y1: ym * 1.15, pad: 30, xl: "키", yl: "밀도" });
    F.axes({ noGrid: true });
    F.fn(fA, c.main, 1.4, [4, 3]); F.fn(fB, c.acc, 1.4, [4, 3]); F.fn((x) => fA(x) + fB(x), c.warn, 2.4);
    F.path([[mean, 0], [mean, ym * 1.1]], c.ink3, 1);
    g.save(); g.translate(W * 0.72, 0);
    const bw = W * 0.12, x0 = 10, top = 24, h = H - 60, sc = h / Math.max(tot, 1);
    g.fillStyle = c.main; g.fillRect(x0, top + h - within * sc, bw, within * sc);
    g.fillStyle = c.acc; g.fillRect(x0, top + h - tot * sc, bw, between * sc);
    g.fillStyle = c.ink2; g.font = "12px monospace"; g.textBaseline = "middle";
    g.fillText("안", x0 + bw + 6, top + h - (within * sc) / 2); g.fillText("사이", x0 + bw + 6, top + h - within * sc - (between * sc) / 2);
    g.restore();
    k.out(`A ${fmt(p * 100, 0)}% 평균 ${m1}, B ${fmt(100 - p * 100, 0)}% 평균 ${m2}, 집단 안 표준편차 ${sd}\n전체 분산 ${fmt(tot, 2)} = 집단 안 ${fmt(within, 2)} + 집단 사이 ${fmt(between, 2)} (사이의 비율 ${fmt((100 * between) / tot, 1)}%) · 전체 표준편차 ${fmt(Math.sqrt(tot), 2)}`);
  }
  S.redraw();
})();
