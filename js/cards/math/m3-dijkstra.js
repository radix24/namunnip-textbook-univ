/* 수학3 탐구: 다익스트라를 한 단계씩 — 확정, 완화, 직전 꼭짓점으로 최단 경로 되짚기 */
(() => {
  "use strict";
  const N = ["A", "B", "C", "D", "E"], PTS = [[0.08, 0.5], [0.4, 0.88], [0.4, 0.12], [0.75, 0.6], [0.95, 0.2]];
  const E = [[0, 1, 4], [0, 2, 2], [1, 2, 1], [1, 3, 5], [2, 3, 8], [2, 4, 10], [3, 4, 2]];
  const S = MKit.setup("card-m3-dijkstra", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  function run(src, steps) {
    const n = N.length, d = new Array(n).fill(Infinity), prev = new Array(n).fill(-1), done = new Array(n).fill(false); d[src] = 0;
    const log = [];
    for (let s = 0; s < steps; s++) {
      let u = -1; for (let i = 0; i < n; i++) if (!done[i] && (u < 0 || d[i] < d[u])) u = i;
      if (u < 0 || d[u] === Infinity) break;
      done[u] = true; const ch = [];
      E.forEach(([a, b, w]) => { const vv = a === u ? b : b === u ? a : -1; if (vv >= 0 && !done[vv] && d[u] + w < d[vv]) { d[vv] = d[u] + w; prev[vv] = u; ch.push(`${N[vv]} → ${d[vv]}`); } });
      log.push(`${N[u]} 확정(${d[u]})${ch.length ? ", 완화: " + ch.join(", ") : ""}`);
    }
    return { d, prev, done, log };
  }
  function draw() {
    const c = QSim.col(), src = N.indexOf(k.val("src")), step = k.val("s"), g = v.g, W = v.W, H = v.H;
    const { d, prev, done, log } = run(src, step);
    const P = ([x, y]) => [30 + x * (W - 60), H - 24 - y * (H - 48)];
    g.save(); g.font = "12px monospace"; g.textAlign = "center"; g.textBaseline = "middle";
    E.forEach(([a, b, w]) => {
      const tree = prev[b] === a || prev[a] === b, [x1, y1] = P(PTS[a]), [x2, y2] = P(PTS[b]);
      g.strokeStyle = tree ? c.main : c.rule; g.lineWidth = tree ? 3.5 : 1.5; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
      g.fillStyle = c.card; g.fillRect((x1 + x2) / 2 - 9, (y1 + y2) / 2 - 8, 18, 16); g.fillStyle = c.ink2; g.fillText(String(w), (x1 + x2) / 2, (y1 + y2) / 2);
    });
    PTS.forEach((p, i) => {
      const [x, y] = P(p); g.fillStyle = done[i] ? c.main : c.card; g.strokeStyle = c.ink2; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, 15, 0, 7); g.fill(); g.stroke();
      g.fillStyle = done[i] ? c.card : c.ink; g.fillText(N[i], x, y); g.fillStyle = c.warn; g.fillText(d[i] === Infinity ? "∞" : String(d[i]), x, y - 24);
    });
    g.restore();
    const pathTo = (t) => { const p = []; for (let x = t; x >= 0; x = prev[x]) p.unshift(N[x]); return p.join("–"); };
    k.out(`출발 ${N[src]} · ${step}단계 (파랑 = 확정, 빨간 숫자 = 현재 d, 굵은 선 = 직전 꼭짓점 관계)\n${log.length ? log[log.length - 1] : "아직 시작 전: d(출발) = 0, 나머지 ∞"}${done.every(Boolean) ? " · 끝. 최단 경로: " + N.map((_, i) => `${N[i]} ${pathTo(i)}`).filter((_, i) => i !== src).join(", ") : ""}`);
  }
  S.redraw();
})();
