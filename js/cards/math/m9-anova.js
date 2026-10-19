/* 수학9 탐구: 세 집단 × 6개 — 집단 차이와 집단 안 산포에 따른 SSB, SSW, F, p */
(() => {
  "use strict";
  const S = MKit.setup("card-m9-anova", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const { n: rn } = M9.rng(31415);
  const Z = Array.from({ length: 3 }, () => Array.from({ length: 6 }, () => rn()));
  function draw() {
    const c = QSim.col(), d = k.val("d"), s = k.val("s"), g = v.g, W = v.W, H = v.H;
    const mus = [20 - d, 20, 20 + d], G = Z.map((zs, i) => zs.map((z) => mus[i] + s * z));
    const all = G.flat(), N = all.length, gm = all.reduce((a, b) => a + b, 0) / N, means = G.map((gr) => gr.reduce((a, b) => a + b, 0) / gr.length);
    const SSB = G.reduce((a, gr, i) => a + gr.length * (means[i] - gm) ** 2, 0), SSW = G.reduce((a, gr, i) => a + gr.reduce((b, x) => b + (x - means[i]) ** 2, 0), 0), SST = SSB + SSW;
    const F = (SSB / 2) / (SSW / (N - 3)), p = 1 - M9.fCdf(F, 2, N - 3);
    const P = QSim.frame({ g, W: W * 0.62, H }, { x0: 0.3, x1: 3.7, y0: 10, y1: 30, pad: 26, xl: "집단", yl: "값" });
    P.axes({ noGrid: true });
    const cols = [c.main, c.acc, c.warn];
    G.forEach((gr, i) => { gr.forEach((x, j) => P.dot(i + 1 + (j - 2.5) * 0.06, x, cols[i], 4)); P.path([[i + 0.7, means[i]], [i + 1.3, means[i]]], cols[i], 2.4); });
    P.path([[0.3, gm], [3.7, gm]], c.ink3, 1, [4, 3]);
    g.save(); g.translate(W * 0.66, 0);
    const bw = W * 0.1, top = 20, h = H - 50, sc = h / Math.max(SST, 1e-9);
    g.fillStyle = c.acc; g.fillRect(10, top + h - SSW * sc - SSB * sc, bw, SSB * sc);
    g.fillStyle = c.soft; g.fillRect(10, top + h - SSW * sc, bw, SSW * sc);
    g.fillStyle = c.ink2; g.font = "12px monospace"; g.textBaseline = "middle";
    g.fillText("SSB", 14 + bw, top + h - SSW * sc - (SSB * sc) / 2); g.fillText("SSW", 14 + bw, top + h - (SSW * sc) / 2);
    g.restore();
    k.out(`집단 평균 ${means.map((m) => fmt(m, 2)).join(", ")} · SST ${fmt(SST, 2)} = SSB ${fmt(SSB, 2)} + SSW ${fmt(SSW, 2)}\nF = ${fmt(SSB / 2, 2)} / ${fmt(SSW / (N - 3), 3)} = ${fmt(F, 3)} (자유도 2, ${N - 3}) · p ${p < 1e-4 ? "< 0.0001" : "= " + fmt(p, 4)}${p < 0.05 ? " → 5%에서 기각" : " → 기각하지 못함"}`);
  }
  S.redraw();
})();
