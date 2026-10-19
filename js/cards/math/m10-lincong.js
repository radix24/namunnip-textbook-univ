/* 수학10 탐구: ax ≡ b (mod m) — 나머지 원 위에서 a의 배수(⟨d⟩), b, 해 */
(() => {
  "use strict";
  const S = MKit.setup("card-m10-lincong", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  const gcd = (x, y) => { x = Math.abs(x); y = Math.abs(y); while (y) [x, y] = [y, x % y]; return x; };
  function draw() {
    const c = QSim.col(), a = k.val("a"), b = k.val("b"), m = k.val("m"), g = v.g, W = v.W, H = v.H;
    const d = gcd(a, m), img = new Set(), sols = [];
    for (let x = 0; x < m; x++) { const y = (a * x) % m; img.add(y); if (y === b % m) sols.push(x); }
    const cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.4;
    g.save(); g.strokeStyle = c.rule; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke();
    g.font = "11px monospace"; g.textAlign = "center"; g.textBaseline = "middle";
    for (let r = 0; r < m; r++) {
      const t = -Math.PI / 2 + (2 * Math.PI * r) / m, X = cx + R * Math.cos(t), Y = cy + R * Math.sin(t);
      const isImg = img.has(r), isB = r === b % m, isSol = sols.includes(r);
      g.fillStyle = isImg ? c.main : c.soft; g.beginPath(); g.arc(X, Y, isImg ? 6 : 4, 0, 7); g.fill();
      if (isB) { g.strokeStyle = c.warn; g.lineWidth = 2.5; g.beginPath(); g.arc(X, Y, 10, 0, 7); g.stroke(); }
      if (isSol) { g.fillStyle = c.acc; g.beginPath(); g.arc(X, Y, 3.5, 0, 7); g.fill(); }
      if (m <= 40) { g.fillStyle = c.ink2; g.fillText(String(r), cx + (R + 18) * Math.cos(t), cy + (R + 18) * Math.sin(t)); }
    }
    g.restore();
    k.out(`${a}x ≡ ${b} (mod ${m}) · d = gcd(${a}, ${m}) = ${d} · a의 배수가 닿는 칸(파랑) = d의 배수 ${img.size}개\n${sols.length ? `${d} | ${b}: 해 ${sols.length}개 x ≡ ${sols.join(", ")} (노랑 점), 간격 m/d = ${m / d}` : `${d} ∤ ${b}: 빨간 고리(b)가 파란 칸이 아니라 해가 없음`}`);
  }
  S.redraw();
})();
