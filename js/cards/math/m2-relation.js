/* 수학2 탐구: 관계의 행렬 — 반사·대칭·추이를 판정하고, 동치관계이면 분할을 보인다 */
(() => {
  "use strict";
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const REL = {
    mod: { f: (a, b, k) => (a - b) % k === 0, tex: (k) => `a ≡ b (mod ${k})` },
    near: { f: (a, b) => Math.abs(a - b) <= 1, tex: () => "|a − b| ≤ 1" },
    div: { f: (a, b) => b % a === 0, tex: () => "a | b (a가 b를 나눔)" },
    le: { f: (a, b) => a <= b, tex: () => "a ≤ b" },
    gcd: { f: (a, b) => gcd(a, b) > 1, tex: () => "gcd(a, b) > 1" },
    par: { f: (a, b, k) => Math.floor((a - 1) / k) === Math.floor((b - 1) / k), tex: (k) => `⌈a/${k}⌉ = ⌈b/${k}⌉ (${k}개씩 묶음)` },
  };
  const S = MKit.setup("card-m2-relation", 0.62, draw);
  if (!S) return;
  const { k, v } = S;
  function draw() {
    const c = QSim.col(), n = k.val("n"), K = k.val("k"), R = REL[k.val("r")], E = [...Array(n).keys()].map((i) => i + 1);
    const rel = (a, b) => R.f(a, b, K);
    let refl = null, sym = null, tr = null, anti = null;
    for (const a of E) if (!rel(a, a) && !refl) refl = [a, a];
    for (const a of E) for (const b of E) if (rel(a, b) && !rel(b, a) && !sym) sym = [a, b];
    for (const a of E) for (const b of E) if (a !== b && rel(a, b) && rel(b, a) && !anti) anti = [a, b];
    outer: for (const a of E) for (const b of E) if (rel(a, b)) for (const d of E) if (rel(b, d) && !rel(a, d)) { tr = [a, b, d]; break outer; }
    const g = v.g, W = v.W, H = v.H, sz = Math.min((W * 0.55 - 30) / n, (H - 30) / n), x0 = 28, y0 = 22;
    const bad = new Set([refl, sym, tr && [tr[0], tr[2]]].filter(Boolean).map(([a, b]) => a + "," + b));
    g.save(); g.textAlign = "center"; g.textBaseline = "middle"; g.font = `${Math.max(9, Math.min(12, sz * 0.5))}px monospace`;
    for (const a of E) for (const b of E) {
      const X = x0 + (b - 1) * sz, Y = y0 + (a - 1) * sz, on = rel(a, b);
      g.fillStyle = on ? c.main : c.rule; g.globalAlpha = on ? 0.7 : 0.3; g.fillRect(X + 1, Y + 1, sz - 2, sz - 2); g.globalAlpha = 1;
      if (bad.has(a + "," + b)) { g.strokeStyle = c.warn; g.lineWidth = 2.5; g.strokeRect(X + 2, Y + 2, sz - 4, sz - 4); }
    }
    g.fillStyle = c.ink2; for (const a of E) { g.fillText(String(a), x0 + (a - 0.5) * sz, y0 - 9); g.fillText(String(a), 14, y0 + (a - 0.5) * sz); }
    g.restore();
    const lines = [
      `반사: ${refl ? `아니오 (${refl[0]} ≁ ${refl[0]})` : "예"}`,
      `대칭: ${sym ? `아니오 (${sym[0]} ~ ${sym[1]}인데 ${sym[1]} ≁ ${sym[0]})` : "예"}`,
      `추이: ${tr ? `아니오 (${tr[0]} ~ ${tr[1]}, ${tr[1]} ~ ${tr[2]}인데 ${tr[0]} ≁ ${tr[2]})` : "예"}`,
      `반대칭: ${anti ? `아니오 (${anti[0]} ~ ${anti[1]}, ${anti[1]} ~ ${anti[0]})` : "예"}`,
    ];
    let tail;
    if (!refl && !sym && !tr) {
      const seen = new Set(), cls = [];
      for (const a of E) if (!seen.has(a)) { const cl = E.filter((b) => rel(a, b)); cl.forEach((b) => seen.add(b)); cls.push(`{${cl.join(",")}}`); }
      tail = `→ 동치관계, 동치류 ${cls.length}개: ${cls.join(" ")}`;
    } else if (!refl && !anti && !tr) tail = "→ 부분 순서";
    else tail = "→ 동치관계도 부분 순서도 아님";
    k.out(`관계 ${R.tex(K)} (집합 {1, …, ${n}}, 행 a, 열 b, 파랑 = a ~ b, 빨간 테 = 성질을 깨는 칸)\n${lines.join(" · ")}\n${tail}`);
  }
  S.redraw();
})();
