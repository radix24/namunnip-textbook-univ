/* 수학3 탐구: 확장 유클리드 호제법의 표 — 각 행의 나머지를 a, b의 일차결합 r = sa + tb로 기록 */
(() => {
  "use strict";
  const S = MKit.setup("card-m3-euclid", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  function draw() {
    const c = QSim.col(), a = k.val("a"), b = k.val("b"), g = v.g, W = v.W, H = v.H;
    // 행: (r, s, t, q)
    const rows = [[a, 1, 0, null], [b, 0, 1, null]];
    while (rows[rows.length - 1][0] !== 0) {
      const [r0, s0, t0] = rows[rows.length - 2], [r1, s1, t1] = rows[rows.length - 1], q = Math.floor(r0 / r1);
      rows[rows.length - 1][3] = q;
      rows.push([r0 - q * r1, s0 - q * s1, t0 - q * t1, null]);
    }
    const gcdRow = rows[rows.length - 2], [gg, s, t] = gcdRow;
    const cols = ["단계", "나머지 r", "s", "t", "몫 q", "확인 sa + tb"], cw = Math.min(110, (W - 10) / cols.length), rh = Math.min(26, (H - 30) / (rows.length + 1)), x0 = (W - cw * cols.length) / 2;
    g.save(); g.font = `${Math.max(10, Math.min(13, rh * 0.55))}px monospace`; g.textAlign = "center"; g.textBaseline = "middle";
    cols.forEach((h, j) => { g.fillStyle = c.ink; g.fillText(h, x0 + (j + 0.5) * cw, 14); });
    rows.forEach((row, i) => {
      const y = 28 + i * rh, hit = row === gcdRow;
      if (hit) { g.fillStyle = c.acc; g.globalAlpha = 0.3; g.fillRect(x0, y, cw * cols.length, rh - 2); g.globalAlpha = 1; }
      const vals = [i, row[0], row[1], row[2], row[3] === null ? "" : row[3], `${row[1] * a + row[2] * b}`];
      vals.forEach((val, j) => { g.fillStyle = j === 5 ? c.ink3 : c.ink; g.fillText(String(val), x0 + (j + 0.5) * cw, y + rh / 2); });
    });
    g.restore();
    const inv = gg === 1 ? ((t % a) + a) % a : null;
    k.out(`gcd(${a}, ${b}) = ${gg} = (${s})·${a} + (${t})·${b} · 나눗셈 ${rows.length - 2}번 (노란 행)\n`
      + (inv !== null ? `gcd가 1이므로 ${b}⁻¹ mod ${a} = ${t} ≡ ${inv} (검산 ${b}·${inv} = ${b * inv} ≡ ${(b * inv) % a})` : `gcd가 1이 아니므로 mod ${a}에서 ${b}의 역원이 없다`));
  }
  S.redraw();
})();
