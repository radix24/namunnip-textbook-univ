/* 수학14 탐구: [0,1]의 유리수를 하나씩 피하는 축소 구간 — 베르 범주 정리의 증명을 따라가기 */
(() => {
  "use strict";
  const S = MKit.setup("card-m14-baire", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  // 분모 순으로 [0,1]의 유리수 나열 (기약분수만)
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const Q = [[0, 1], [1, 1]];
  for (let q = 2; Q.length < 400; q++) for (let p = 1; p < q; p++) if (gcd(p, q) === 1) Q.push([p, q]);
  function draw() {
    const c = QSim.col(), n = k.val("n");
    // 정확한 계산: 구간 [A/D, B/D], D = 3^i (정수, 3^30 < 2^53)
    let A = 0, B = 1, D = 1;
    const hist = [[0, 1]];
    for (let i = 0; i < n; i++) {
      A *= 3; B *= 3; D *= 3;
      const L = (B - A) / 3, [p, q] = Q[i];
      // p/q 가 왼쪽 1/3 [A, A + L] (분모 D) 안에 있는가: A·q ≤ p·D ≤ (A + L)·q
      const inLeft = A * q <= p * D && p * D <= (A + L) * q;
      if (!inLeft) B = A + L; else A = B - L;
      hist.push([A / D, B / D]);
    }
    const a = A / D, b = B / D;
    const W = v.W, H = v.H, g = v.g;
    // 위: [0,1] 전체
    const top = QSim.frame({ g, W, H: H / 2 }, { x0: -0.02, x1: 1.02, y0: -1, y1: 1, pad: 18 });
    top.path([[0, 0], [1, 0]], c.ink3, 1.5);
    Q.slice(0, n).forEach(([p, q]) => top.dot(p / q, 0, c.warn, 2.5));
    hist.forEach(([x0, x1], i) => { if (i) top.path([[x0, 0.25 + 0.05 * Math.min(i, 12)], [x1, 0.25 + 0.05 * Math.min(i, 12)]], c.main, 2); });
    top.text("[0, 1] 전체: 빨간 점 = 지금까지 피한 유리수", 0, -0.7, c.ink3);
    // 아래: 현재 구간 확대 (바로 앞 구간 기준)
    const [pa, pb] = hist[Math.max(0, hist.length - 2)];
    g.save(); g.translate(0, H / 2);
    const bot = QSim.frame({ g, W, H: H / 2 }, { x0: pa - (pb - pa) * 0.05, x1: pb + (pb - pa) * 0.05, y0: -1, y1: 1, pad: 18 });
    bot.path([[pa, 0], [pb, 0]], c.ink3, 1.5);
    bot.path([[a, 0.3], [b, 0.3]], c.main, 3);
    Q.slice(0, n).forEach(([p, q]) => { const x = p / q; if (x >= pa && x <= pb) bot.dot(x, 0, c.warn, 4); });
    bot.text("직전 구간을 확대: 파란 선분 = 새로 고른 구간(직전의 왼쪽 또는 오른쪽 1/3)", pa, -0.7, c.ink3);
    g.restore();
    const mid = (a + b) / 2;
    const lastQ = n ? `q${n} = ${Q[n - 1][0]}/${Q[n - 1][1]}` : "없음";
    k.out(`${n}단계 · 피한 유리수 ${n}개 (마지막 ${lastQ}) · 구간 [${a.toFixed(10)}, ${b.toFixed(10)}], 길이 3^(−${n}) ≈ ${((B - A) / D).toExponential(2)}\n구간들이 줄어드는 극한점 ≈ ${mid.toFixed(Math.min(15, 2 + Math.floor(n * 0.48)))} · 이 점은 q₁, …, q${n}과 모두 다르다`);
  }
  S.redraw();
})();
