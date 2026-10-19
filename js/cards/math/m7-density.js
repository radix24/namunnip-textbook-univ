/* 수학7 탐구: 유리수의 조밀성 증명을 눈금으로 — 간격 1/n이 b − a보다 짧으면 눈금 m/n 하나가 (a, b) 안에 떨어진다 */
(() => {
  "use strict";
  const S = MKit.setup("card-m7-density", 0.42, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  function draw() {
    const c = QSim.col(), g = v.g;
    const a = Math.SQRT2, w = Math.pow(10, -k.val("lw")), b = a + w;
    const n = Math.floor(1 / w) + 1, m = Math.floor(n * a) + 1;
    k.$(".wv").textContent = w.toExponential(1);
    // 보이는 범위: 구간을 가운데에 두고 눈금 몇 개가 보이게
    const span = Math.max(w * 3, 4 / n), x0 = a - span * 0.4, x1 = x0 + span;
    const f = QSim.frame(v, { x0, x1, y0: -1, y1: 1, pad: 18 });
    const Y = f.Y(0);
    g.strokeStyle = c.ink3; g.lineWidth = 1; g.beginPath(); g.moveTo(f.X(x0), Y); g.lineTo(f.X(x1), Y); g.stroke();
    // 구간 (a, b)
    g.save(); g.fillStyle = c.acc; g.globalAlpha = 0.3; g.fillRect(f.X(a), Y - 18, f.X(b) - f.X(a), 36); g.restore();
    // 눈금 j/n
    const j0 = Math.ceil(x0 * n), j1 = Math.floor(x1 * n);
    if (j1 - j0 < 400) for (let j = j0; j <= j1; j++) {
      const x = j / n, hit = j === m;
      g.strokeStyle = hit ? c.warn : c.main; g.lineWidth = hit ? 3 : 1.2;
      g.beginPath(); g.moveTo(f.X(x), Y - (hit ? 26 : 12)); g.lineTo(f.X(x), Y + (hit ? 26 : 12)); g.stroke();
    }
    g.fillStyle = c.ink; g.font = "12px " + getComputedStyle(document.documentElement).getPropertyValue("--f-mono");
    g.textAlign = "center"; g.fillText("a = √2", f.X(a), Y + 44); g.fillText("b", f.X(b), Y - 30); g.textAlign = "left";
    k.out(`구간 (√2, √2 + ${w.toExponential(1)}) · 1/n < b − a인 n = ${n} · m = ⌊na⌋ + 1 = ${m}\n` +
      `m/n = ${m}/${n} ≈ ${fmt(m / n, 12)} (a < m/n < b: ${a < m / n && m / n < b ? "예" : "아니오"})`);
  }
  S.redraw();
})();
