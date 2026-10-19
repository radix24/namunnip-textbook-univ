/* 수학15 탐구: 디리클레 핵, 페예르 핵, 푸아송 핵의 모양과 절대적분 — 좋은 핵인가 */
(() => {
  "use strict";
  const S = MKit.setup("card-m15-kernels", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const PI = Math.PI;
  const D = (N, x) => (Math.abs(Math.sin(x / 2)) < 1e-12 ? 2 * N + 1 : Math.sin((N + 0.5) * x) / Math.sin(x / 2));
  const Fj = (N, x) => (Math.abs(Math.sin(x / 2)) < 1e-12 ? N : Math.sin((N * x) / 2) ** 2 / (N * Math.sin(x / 2) ** 2));
  const P = (r, x) => (1 - r * r) / (1 - 2 * r * Math.cos(x) + r * r);
  function draw() {
    const c = QSim.col(), N = k.val("N"), which = k.val("k"), r = 1 - 1 / (N + 1);
    const K = which === "d" ? (x) => D(N, x) : which === "f" ? (x) => Fj(N, x) : (x) => P(r, x);
    const top = which === "d" ? 2 * N + 1 : which === "f" ? N : (1 + r) / (1 - r);
    const F = QSim.frame(v, { x0: -PI, x1: PI, y0: -0.3 * top, y1: 1.08 * top, pad: 26, xl: "x", yl: "" });
    F.axes();
    F.fn(K, which === "d" ? c.warn : which === "f" ? c.main : c.acc, 1.6, null, 2000);
    // 절대적분과 |x| ≥ 0.3 밖의 무게
    const M = 20000; let a = 0, out = 0, neg = 0;
    for (let i = 0; i < M; i++) { const x = -PI + ((i + 0.5) * 2 * PI) / M, y = K(x), w = (2 * PI) / M / (2 * PI); a += Math.abs(y) * w; if (Math.abs(x) >= 0.3) out += Math.abs(y) * w; if (y < 0) neg += -y * w; }
    const nm = which === "d" ? `디리클레 D_${N}` : which === "f" ? `페예르 F_${N}` : `푸아송 P_r (r = ${fmt(r, 4)})`;
    k.out(`${nm} · 적분 1 · 절대적분 (1/2π)∫|K| = ${fmt(a, 4)}${which === "d" ? ` (참고: 큰 N에서 (4/π²)ln N + 1.27 ≈ ${fmt((4 / PI / PI) * Math.log(N) + 1.27, 3)})` : ""} · 음수 부분의 무게 ${fmt(neg, 4)}\n|x| ≥ 0.3 바깥의 무게 (1/2π)∫|K| = ${fmt(out, 4)} → ${which === "d" ? "N을 키워도 0으로 가지 않음: 좋은 핵 아님" : "N을 키우면 0으로: 좋은 핵"}`);
  }
  S.redraw();
})();
