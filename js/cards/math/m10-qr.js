/* 수학10 탐구: 법 p의 이차 잉여 — 제곱이 떨어지는 칸, a^((p−1)/2), −1과 2의 판정 */
(() => {
  "use strict";
  const S = MKit.setup("card-m10-qr", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  const PR = [3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
  const pw = (a, e, n) => { let r = 1, b = a % n; while (e > 0) { if (e & 1) r = (r * b) % n; b = (b * b) % n; e >>= 1; } return r; };
  function draw() {
    const c = QSim.col(), p = PR[k.val("i")], aa = Math.min(k.val("a"), p - 1), g = v.g, W = v.W, H = v.H;
    const as = k.$('[name="a"]'); if (+as.max !== p - 1) { as.max = p - 1; MKit.setVal(k, "a", Math.min(+as.value, p - 1)); }
    const sq = new Set(); for (let x = 1; x <= (p - 1) / 2; x++) sq.add((x * x) % p);
    const cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.4;
    g.save(); g.strokeStyle = c.rule; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke();
    g.font = "10px monospace"; g.textAlign = "center"; g.textBaseline = "middle";
    for (let r = 1; r < p; r++) {
      const t = -Math.PI / 2 + (2 * Math.PI * r) / p, X = cx + R * Math.cos(t), Y = cy + R * Math.sin(t);
      g.fillStyle = sq.has(r) ? c.main : c.soft; g.beginPath(); g.arc(X, Y, sq.has(r) ? 6 : 4, 0, 7); g.fill();
      if (r === aa) { g.strokeStyle = c.warn; g.lineWidth = 2.5; g.beginPath(); g.arc(X, Y, 10, 0, 7); g.stroke(); }
      if (p <= 41) { g.fillStyle = c.ink2; g.fillText(String(r), cx + (R + 16) * Math.cos(t), cy + (R + 16) * Math.sin(t)); }
    }
    g.restore();
    const e = pw(aa, (p - 1) / 2, p), leg = e === 1 ? 1 : -1, root = []; for (let x = 1; x < p; x++) if ((x * x) % p === aa) root.push(x);
    k.out(`p = ${p} · 이차 잉여 ${sq.size}개 = (p−1)/2 (파랑) · −1(≡ ${p - 1}): ${sq.has(p - 1) ? "잉여" : "비잉여"} (p mod 4 = ${p % 4}) · 2: ${sq.has(2) ? "잉여" : "비잉여"} (p mod 8 = ${p % 8})\na = ${aa}: a^((p−1)/2) ≡ ${e === p - 1 ? "−1" : e} → (a/p) = ${leg}${root.length ? ` · x² ≡ a의 해 x = ${root.join(", ")}` : ""}`);
  }
  S.redraw();
})();
