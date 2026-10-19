/* 수학4 탐구: fib(n)의 재귀 호출 나무 — 순진한 재귀 vs 메모이제이션 */
(() => {
  "use strict";
  const S = MKit.setup("card-m4-calltree", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  function draw() {
    const c = QSim.col(), n = k.val("n"), memo = k.val("m") === "memo", g = v.g, W = v.W, H = v.H;
    const nodes = []; // [depth, x, val, parentIndex, cached]
    const seen = new Set();
    let leafX = 0;
    function rec(m, depth, parent) {
      const id = nodes.length; nodes.push({ m, depth, x: 0, parent, cached: false });
      if (memo && seen.has(m)) { nodes[id].cached = true; nodes[id].x = leafX++; return; }
      if (m < 2) { seen.add(m); nodes[id].x = leafX++; return; }
      const a = nodes.length; rec(m - 1, depth + 1, id); const b = nodes.length; rec(m - 2, depth + 1, id);
      seen.add(m); nodes[id].x = (nodes[a].x + nodes[b].x) / 2;
    }
    rec(n, 0, -1);
    const maxD = Math.max(...nodes.map((t) => t.depth)), sx = (W - 30) / Math.max(1, leafX - 1 || 1), sy = (H - 30) / Math.max(1, maxD);
    const P = (t) => [15 + t.x * (leafX > 1 ? sx : 0) + (leafX > 1 ? 0 : W / 2 - 15), 15 + t.depth * sy];
    g.save(); g.strokeStyle = c.rule; g.lineWidth = 1;
    nodes.forEach((t) => { if (t.parent >= 0) { const [x1, y1] = P(t), [x0, y0] = P(nodes[t.parent]); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); } });
    const r = Math.max(1.5, Math.min(9, sx * 0.4, sy * 0.3));
    g.font = `${Math.max(8, Math.min(12, r * 1.4))}px monospace`; g.textAlign = "center"; g.textBaseline = "middle";
    nodes.forEach((t) => { const [x, y] = P(t); g.fillStyle = t.cached ? c.acc : t.m < 2 ? c.soft : c.main; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); if (r >= 6) { g.fillStyle = t.cached || t.m < 2 ? c.ink : c.card; g.fillText(String(t.m), x, y); } });
    g.restore();
    const fib = (m) => { let a = 0, b = 1; for (let i = 0; i < m; i++) [a, b] = [b, a + b]; return a; };
    k.out(`fib(${n}) = ${fib(n)} · 호출 ${nodes.length}번 ${memo ? `(메모이제이션: 노랑은 저장된 값을 꺼낸 호출, 대략 2n − 1)` : `(순진한 재귀: 2F(n+1) − 1 = ${2 * fib(n + 1) - 1})`}\n파랑: 계산한 호출, 옅은 색: 기저 사례 fib(0), fib(1)`);
  }
  S.redraw();
})();
