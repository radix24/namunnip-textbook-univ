/* 수학2 탐구: 약수의 하세 도표에서 사슬, 상계, 극대 원소 고르기 */
(() => {
  "use strict";
  const S = MKit.setup("card-m2-hasse", 0.62, draw);
  if (!S) return;
  const { k, v, cv } = S;
  let sel = new Set([1, 2, 4]), nodes = [];
  const omega = (n) => { let c = 0; for (let p = 2; p * p <= n; p++) while (n % p === 0) { n /= p; c++; } return c + (n > 1 ? 1 : 0); };
  function draw() {
    const c = QSim.col(), N = k.val("N"), drop = k.val("drop") === "yes", g = v.g, W = v.W, H = v.H;
    let E = []; for (let d = 1; d <= N; d++) if (N % d === 0) E.push(d);
    if (drop) E = E.filter((d) => d !== N);
    sel = new Set([...sel].filter((d) => E.includes(d)));
    const lv = Math.max(...E.map(omega));
    const byL = {}; E.forEach((d) => { (byL[omega(d)] ||= []).push(d); });
    nodes = E.map((d) => { const L = omega(d), row = byL[L], i = row.indexOf(d); return { d, x: W * (i + 1) / (row.length + 1), y: H - 26 - (H - 52) * (lv ? L / lv : 0) }; });
    const P = (d) => nodes.find((o) => o.d === d);
    const le = (a, b) => b % a === 0;
    g.save();
    // 덮개 관계(바로 위) 선
    for (const a of E) for (const b of E) if (a !== b && le(a, b) && !E.some((m) => m !== a && m !== b && le(a, m) && le(m, b))) {
      const A = P(a), B = P(b); g.strokeStyle = sel.has(a) && sel.has(b) ? c.main : c.rule; g.lineWidth = sel.has(a) && sel.has(b) ? 3 : 1.5; g.beginPath(); g.moveTo(A.x, A.y); g.lineTo(B.x, B.y); g.stroke();
    }
    const arr = [...sel];
    const chain = arr.every((a) => arr.every((b) => le(a, b) || le(b, a)));
    const ub = E.filter((u) => arr.every((a) => le(a, u)));
    const maxi = E.filter((m) => !E.some((x) => x !== m && le(m, x)));
    for (const o of nodes) {
      g.fillStyle = sel.has(o.d) ? c.main : c.card; g.strokeStyle = maxi.includes(o.d) ? c.warn : ub.includes(o.d) ? c.acc : c.ink2; g.lineWidth = maxi.includes(o.d) || ub.includes(o.d) ? 3 : 1.5;
      g.beginPath(); g.arc(o.x, o.y, 15, 0, 7); g.fill(); g.stroke();
      g.fillStyle = sel.has(o.d) ? c.card : c.ink; g.font = "12px monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(String(o.d), o.x, o.y);
    }
    g.restore();
    k.out(`고른 집합 {${arr.sort((a, b) => a - b).join(", ")}}: ${arr.length < 2 ? "사슬(원소 1개 이하)" : chain ? "사슬입니다" : "사슬이 아님 (나눗셈으로 비교 안 되는 쌍이 있음)"}\n`
      + `상계(노란 테): ${ub.length ? ub.join(", ") : "없음"} · 극대 원소(빨간 테): ${maxi.join(", ")}${maxi.length > 1 ? " (최대 원소는 없음)" : " (= 최대 원소)"}`);
  }
  cv.addEventListener("pointerdown", (e) => {
    const r = cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
    const o = nodes.find((o) => Math.hypot(o.x - px, o.y - py) < 18);
    if (o) { sel.has(o.d) ? sel.delete(o.d) : sel.add(o.d); S.redraw(); }
  });
  S.redraw();
})();
