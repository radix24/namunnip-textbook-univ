/* 수학3 탐구: 한 붓 그리기 — 차수의 짝홀로 오일러 회로·트레일을 판정하고, 히르홀저 알고리즘의 경로를 한 변씩 */
(() => {
  "use strict";
  const GS = {
    kb: { name: "쾨니히스베르크", pts: [[0.5, 0.9], [0.15, 0.5], [0.5, 0.1], [0.85, 0.5]], E: [[0, 1], [0, 1], [1, 2], [1, 2], [0, 3], [1, 3], [2, 3]] },
    house: { name: "봉투(집)", pts: [[0.2, 0.15], [0.8, 0.15], [0.8, 0.6], [0.2, 0.6], [0.5, 0.9]], E: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2], [1, 3], [3, 4], [4, 2]] },
    k5: { name: "K₅", pts: [...Array(5)].map((_, i) => [0.5 + 0.38 * Math.cos(Math.PI / 2 + (2 * Math.PI * i) / 5), 0.5 + 0.38 * Math.sin(Math.PI / 2 + (2 * Math.PI * i) / 5)]), E: [[0, 1], [0, 2], [0, 3], [0, 4], [1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4]] },
    bow: { name: "나비넥타이", pts: [[0.15, 0.2], [0.15, 0.8], [0.5, 0.5], [0.85, 0.2], [0.85, 0.8]], E: [[0, 1], [1, 2], [2, 0], [2, 3], [3, 4], [4, 2]] },
    k4: { name: "K₄", pts: [[0.2, 0.2], [0.8, 0.2], [0.8, 0.8], [0.2, 0.8]], E: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2], [1, 3]] },
  };
  const S = MKit.setup("card-m3-eulerpath", 0.6, draw);
  if (!S) return;
  const { k, v } = S;
  function hierholzer(n, E, start) {
    const adj = [...Array(n)].map(() => []); E.forEach(([a, b], i) => { adj[a].push([b, i]); adj[b].push([a, i]); });
    const used = new Array(E.length).fill(false), stack = [[start, -1]], path = [];
    while (stack.length) {
      const [u] = stack[stack.length - 1];
      while (adj[u].length && used[adj[u][adj[u].length - 1][1]]) adj[u].pop();
      if (!adj[u].length) path.push(stack.pop()); else { const [w, i] = adj[u].pop(); used[i] = true; stack.push([w, i]); }
    }
    return path.reverse(); // [[vertex, edgeIdx]...]
  }
  function draw() {
    const c = QSim.col(), G = GS[k.val("g")], n = G.pts.length, g = v.g, W = v.W, H = v.H;
    const deg = new Array(n).fill(0); G.E.forEach(([a, b]) => { deg[a]++; deg[b]++; });
    const odd = deg.map((d, i) => (d % 2 ? i : -1)).filter((i) => i >= 0);
    const ok = odd.length === 0 || odd.length === 2, path = ok ? hierholzer(n, G.E, odd.length ? odd[0] : 0) : [];
    const ss = k.$('[name="s"]'); if (+ss.max !== G.E.length) { ss.max = G.E.length; MKit.setVal(k, "s", Math.min(+ss.value, G.E.length)); }
    const step = k.val("s");
    const P = ([x, y]) => [30 + x * (W - 60), H - 20 - y * (H - 40)];
    // 같은 두 점 사이의 여러 변은 휘어서
    const seen = {};
    const order = {}; path.slice(1, step + 1).forEach(([, ei], t) => { order[ei] = t + 1; });
    g.save();
    G.E.forEach(([a, b], i) => {
      const key = Math.min(a, b) + "," + Math.max(a, b), m = (seen[key] = (seen[key] || 0) + 1) - 1;
      const [x1, y1] = P(G.pts[a]), [x2, y2] = P(G.pts[b]), mx = (x1 + x2) / 2, my = (y1 + y2) / 2, nx = -(y2 - y1), ny = x2 - x1, L = Math.hypot(nx, ny) || 1, off = (m % 2 ? -1 : 1) * Math.ceil(m / 2) * 28;
      const cx = mx + (nx / L) * off, cy = my + (ny / L) * off;
      g.strokeStyle = order[i] ? c.main : c.rule; g.lineWidth = order[i] ? 3 : 2;
      g.beginPath(); g.moveTo(x1, y1); g.quadraticCurveTo(cx, cy, x2, y2); g.stroke();
      if (order[i]) { g.fillStyle = c.main; g.font = "12px monospace"; g.textAlign = "center"; g.fillText(String(order[i]), (x1 + 2 * cx + x2) / 4 + 8, (y1 + 2 * cy + y2) / 4 - 6); }
    });
    G.pts.forEach((p, i) => { const [x, y] = P(p); g.fillStyle = deg[i] % 2 ? c.warn : c.card; g.strokeStyle = c.ink2; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, 13, 0, 7); g.fill(); g.stroke(); g.fillStyle = deg[i] % 2 ? c.card : c.ink; g.font = "12px monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(String(deg[i]), x, y); });
    g.restore();
    const verdict = odd.length === 0 ? "모든 차수가 짝수 → 오일러 회로가 있다" : odd.length === 2 ? "홀수 차수 2개 → 오일러 트레일(홀수 점에서 출발, 다른 홀수 점에서 끝)" : `홀수 차수 꼭짓점 ${odd.length}개 → 한 붓 그리기 불가능`;
    k.out(`${G.name}: 꼭짓점 ${n}, 변 ${G.E.length}, 차수 합 ${deg.reduce((s, x) => s + x, 0)} = 2 × ${G.E.length} (꼭짓점 안의 숫자 = 차수, 빨강 = 홀수)\n${verdict}${ok ? ` · 경로를 ${step}번째 변까지 표시` : ""}`);
  }
  S.redraw();
})();
