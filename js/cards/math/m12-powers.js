/* 수학12 탐구: U(n)의 거듭제곱표 — φ(n)번째 열은 모두 1 (오일러), 1이 처음 나오는 곳이 위수 */
(() => {
  "use strict";
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const S = MKit.setup("card-m12-powers", 0.75, draw);
  if (!S) return;
  const { k, v } = S;
  function draw() {
    const c = QSim.col(), n = k.val("n"), U = []; for (let a = 1; a < n; a++) if (gcd(a, n) === 1) U.push(a);
    const phi = U.length, K = phi; // 열: a^1 … a^φ(n)
    const ord = U.map((a) => { let x = a % n, t = 1; while (x !== 1 % n) { x = (x * a) % n; t++; } return t; });
    const gg = v.g, W = v.W, H = v.H, cw = Math.min((W - 34) / K, 40), ch = Math.min((H - 22) / U.length, 26), x0 = 30, y0 = 18;
    gg.save(); gg.textAlign = "center"; gg.textBaseline = "middle"; gg.font = `${Math.max(7, Math.min(12, Math.min(cw, ch) * 0.45))}px monospace`;
    U.forEach((a, i) => {
      let x = 1;
      for (let j = 1; j <= K; j++) {
        x = (x * a) % n;
        const X = x0 + (j - 1) * cw, Y = y0 + i * ch, one = x === 1;
        gg.globalAlpha = one ? 0.9 : 0.4; gg.fillStyle = one ? (j === ord[i] ? c.acc : c.main) : `hsl(${(x * 360) / n}, 55%, 60%)`;
        gg.fillRect(X + 0.5, Y + 0.5, cw - 1, ch - 1); gg.globalAlpha = 1;
        if (cw > 15 && ch > 11) { gg.fillStyle = one ? c.card : c.ink; gg.fillText(String(x), X + cw / 2, Y + ch / 2); }
      }
      gg.fillStyle = c.ink2; gg.fillText(String(a), 14, y0 + (i + 0.5) * ch);
    });
    if (cw > 9) for (let j = 1; j <= K; j++) { gg.fillStyle = c.ink3; gg.fillText(String(j), x0 + (j - 0.5) * cw, 8); }
    gg.restore();
    const lam = ord.reduce((s, t) => (s * t) / gcd(s, t), 1), prim = U.filter((_, i) => ord[i] === phi);
    k.out(`U(${n}): φ(${n}) = ${phi}개 · 행 a, 열 k에 a^k mod ${n} · 마지막 열(k = φ(n))은 모두 1 (오일러 정리)\n`
      + `노란 칸 = 처음 1이 되는 곳(위수) · 위수의 최댓값 ${lam}` + (prim.length ? ` = φ(n): 원시근 ${prim.slice(0, 8).join(", ")}${prim.length > 8 ? " …" : ""}, U(${n})은 순환군` : ` < φ(n): 원시근이 없어 U(${n})은 순환군이 아님`));
  }
  S.redraw();
})();
