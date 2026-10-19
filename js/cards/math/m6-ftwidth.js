/* 수학6 탐구: 폭을 바꾸면 푸리에 변환의 폭이 반대로 바뀐다 (가우스, 상자) */
(() => {
  "use strict";
  const S = MKit.setup("card-m6-ftwidth", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  function draw() {
    const c = QSim.col(), s = k.val("s"), sh = k.val("sh"), g = v.g, W = v.W, H = v.H;
    const fn = sh === "gauss" ? (t) => Math.exp(-(t * t) / (2 * s * s)) : (t) => (Math.abs(t) <= s ? 1 : 0);
    const ft = sh === "gauss" ? (w) => s * Math.sqrt(2 * Math.PI) * Math.exp(-(s * s * w * w) / 2) : (w) => (Math.abs(w) < 1e-9 ? 2 * s : (2 * Math.sin(s * w)) / w);
    const L = QSim.frame({ g, W: W * 0.48, H }, { x0: -4, x1: 4, y0: -0.2, y1: 1.2, pad: 24, xl: "t" });
    L.axes(); L.fn(fn, c.main, 2, null, 800);
    const top = sh === "gauss" ? s * Math.sqrt(2 * Math.PI) : 2 * s;
    g.save(); g.translate(W * 0.52, 0);
    const R = QSim.frame({ g, W: W * 0.48, H }, { x0: -10, x1: 10, y0: -top * 0.3, y1: top * 1.15, pad: 24, xl: "ω" });
    R.axes(); R.fn(ft, c.acc, 2, null, 800);
    g.restore();
    const wt = sh === "gauss" ? s : s, ww = sh === "gauss" ? 1 / s : Math.PI / s;
    k.out(`${sh === "gauss" ? `가우스 e^(−t²/(2σ²)), σ = ${fmt(s, 2)}` : `상자 |t| ≤ a, a = ${fmt(s, 2)}`} (왼쪽) → 변환 ${sh === "gauss" ? `σ√(2π) e^(−σ²ω²/2)` : "2 sin(aω)/ω"} (오른쪽)\n`
      + `시간 폭 ${fmt(wt, 2)} × 진동수 폭 ${fmt(ww, 3)} = ${fmt(wt * ww, 3)} ${sh === "gauss" ? "(표준편차의 곱, 늘 1)" : "(상자 반폭 × 첫 영점, 늘 π)"}`);
  }
  S.redraw();
})();
