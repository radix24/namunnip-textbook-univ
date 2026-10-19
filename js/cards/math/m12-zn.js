/* 수학12 탐구: Z_n에서 "a 곱하기" 함수 — 가역원이면 전단사, 영인자이면 겹친다 */
(() => {
  "use strict";
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const S = MKit.setup("card-m12-zn", 0.62, draw);
  if (!S) return;
  const { k, v } = S;
  function draw() {
    const n = k.val("n"), as = k.$('[name="a"]');
    if (+as.max !== n - 1) { as.max = n - 1; MKit.setVal(k, "a", Math.min(+as.value, n - 1)); }
    const c = QSim.col(), a = k.val("a") % n, g = v.g, W = v.W, H = v.H;
    const xl = W * 0.22, xr = W * 0.78, top = 22, step = (H - top - 12) / Math.max(1, n - 1);
    const Y = (i) => top + i * (n === 1 ? 0 : step);
    const img = new Map(); for (let x = 0; x < n; x++) { const y = (a * x) % n; img.set(y, (img.get(y) || 0) + 1); }
    const kind = (x) => (x === 0 ? "zero" : gcd(x, n) === 1 ? "unit" : "zd");
    const colr = { zero: c.ink3, unit: c.main, zd: c.warn };
    g.save(); g.lineWidth = 1.2;
    for (let x = 0; x < n; x++) {
      const y = (a * x) % n;
      g.strokeStyle = y === 1 ? c.acc : img.get(y) > 1 ? c.warn : c.ink3; g.globalAlpha = y === 1 ? 1 : 0.6;
      g.lineWidth = y === 1 ? 2.5 : 1.2;
      g.beginPath(); g.moveTo(xl + 8, Y(x)); g.lineTo(xr - 8, Y(y)); g.stroke();
    }
    g.globalAlpha = 1;
    const fs = Math.max(9, Math.min(13, step * 0.8));
    g.font = `${fs}px monospace`; g.textBaseline = "middle";
    for (let i = 0; i < n; i++) {
      g.fillStyle = colr[kind(i)];
      g.beginPath(); g.arc(xl, Y(i), 4, 0, 7); g.fill();
      g.fillStyle = img.has(i) ? colr[kind(i)] : c.rule; g.beginPath(); g.arc(xr, Y(i), 4, 0, 7); g.fill();
      if (step > 9 || i % 2 === 0) { g.fillStyle = c.ink2; g.textAlign = "right"; g.fillText(String(i), xl - 8, Y(i)); g.textAlign = "left"; g.fillText(String(i), xr + 8, Y(i)); }
    }
    g.fillStyle = c.ink; g.textAlign = "center"; g.fillText("x", xl, 9); g.fillText(`${a}·x`, xr, 9);
    g.restore();
    const units = [], zds = []; for (let x = 1; x < n; x++) (gcd(x, n) === 1 ? units : zds).push(x);
    const inv = [...Array(n).keys()].find((x) => (a * x) % n === 1);
    let msg = `Z_${n}: 가역원 ${units.length}개 (파랑) · 영인자 ${zds.length}개 (빨강)${zds.length === 0 ? " → 체입니다" : ""}\n`;
    if (a === 0) msg += "a = 0: 모든 x가 0으로 갑니다";
    else if (inv !== undefined) msg += `a = ${a}는 가역원: x ↦ ${a}x가 전단사, ${a}·${inv} ≡ 1 (노란 선)이라 역원 ${inv}`;
    else { const z = [...Array(n).keys()].find((x) => x > 0 && (a * x) % n === 0); msg += `a = ${a}는 영인자: ${a}·${z} ≡ 0 · 겹치는 상(빨간 선)이 생겨 단사가 아니고, 상 ${img.size}개에 1이 없어 역원이 없습니다`; }
    k.out(msg);
  }
  S.redraw();
})();
