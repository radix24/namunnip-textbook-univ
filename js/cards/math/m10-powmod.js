/* 수학10 탐구: aᵏ mod n 의 수열 — 주기(위수), φ(n), 페르마 판정 a^(n−1) mod n */
(() => {
  "use strict";
  const S = MKit.setup("card-m10-powmod", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const gcd = (x, y) => { while (y) [x, y] = [y, x % y]; return x; };
  const pw = (a, e, n) => { let r = 1 % n, b = a % n; while (e > 0) { if (e & 1) r = (r * b) % n; b = (b * b) % n; e >>= 1; } return r; };
  function draw() {
    const c = QSim.col(), a = k.val("a"), n = k.val("n"), K = Math.min(80, 2 * n + 4);
    let phi = 0; for (let i = 1; i <= n; i++) if (gcd(i, n) === 1) phi++;
    const isPrime = n > 1 && Array.from({ length: Math.floor(Math.sqrt(n)) - 1 }, (_, i) => i + 2).every((d) => n % d !== 0);
    const seq = []; let x = 1 % n; for (let e = 0; e <= K; e++) { seq.push(x); x = (x * a) % n; }
    let ord = 0; if (gcd(a, n) === 1) { let y = a % n; ord = 1; while (y !== 1 % n) { y = (y * a) % n; ord++; if (ord > n) break; } }
    const F = QSim.frame(v, { x0: -0.5, x1: K + 0.5, y0: -0.5, y1: n - 0.5, pad: 28, xl: "지수 k", yl: "aᵏ mod n" });
    F.axes({ noGrid: true });
    F.path(seq.map((y, e) => [e, y]), c.soft, 1);
    seq.forEach((y, e) => F.dot(e, y, ord && e % ord === 0 ? c.warn : c.main, ord && e % ord === 0 ? 5 : 3.5));
    const ft = pw(a, n - 1, n);
    k.out(`a = ${a}, n = ${n}${isPrime ? " (소수)" : " (합성수)"} · φ(n) = ${phi} · ${ord ? `위수 ${ord} (φ(n)의 약수: ${phi % ord === 0 ? "예" : "아니오"}) · 빨간 점은 aᵏ ≡ 1` : `gcd(a, n) = ${gcd(a, n)} ≠ 1이라 1로 돌아오지 않음`}\n페르마 판정: a^(n−1) mod n = ${ft}${ft === 1 && !isPrime ? " → 합성수인데 통과 (유사소수)" : ft !== 1 ? " → 합성수임이 드러남" : ""}`);
  }
  S.redraw();
})();
