/* 수학3 탐구: 워셜 알고리즘 — k번째 꼭짓점을 경유지로 허락할 때마다 도달 가능한 쌍이 늘어난다 */
(() => {
  "use strict";
  const S = MKit.setup("card-m3-warshall", 0.5, draw);
  if (!S) return;
  const { k, v, cv } = S;
  let n = 5, E = new Set(["0,1", "1,2", "2,3", "3,1", "4,0"]), pick = -1, nodes = [];
  function closure(steps) {
    const W = [...Array(n)].map((_, i) => [...Array(n)].map((_, j) => E.has(i + "," + j)));
    const added = [];
    for (let kk = 0; kk < steps; kk++) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (!W[i][j] && W[i][kk] && W[kk][j]) { W[i][j] = true; added.push([i, j, kk]); }
    return { W, added };
  }
  function draw() {
    const c = QSim.col(), g = v.g, Wd = v.W, H = v.H, nn = k.val("n");
    if (nn !== n) { n = nn; E = new Set([...E].filter((e) => e.split(",").every((x) => +x < n))); pick = -1; }
    const ks = k.$('[name="k"]'); if (+ks.max !== n) { ks.max = n; MKit.setVal(k, "k", Math.min(+ks.value, n)); }
    const steps = k.val("k"), { W, added } = closure(steps);
    const cx = Wd * 0.25, cy = H / 2, R = Math.min(Wd * 0.2, H * 0.38);
    nodes = [...Array(n)].map((_, i) => [cx + R * Math.cos(-Math.PI / 2 + (2 * Math.PI * i) / n), cy + R * Math.sin(-Math.PI / 2 + (2 * Math.PI * i) / n)]);
    g.save();
    const arrow = (i, j, col, dash, w) => {
      const [x1, y1] = nodes[i], [x2, y2] = nodes[j]; g.strokeStyle = g.fillStyle = col; g.lineWidth = w; g.setLineDash(dash || []);
      if (i === j) { g.beginPath(); g.arc(x1, y1 - 18, 9, 0, 7); g.stroke(); g.setLineDash([]); return; }
      const a = Math.atan2(y2 - y1, x2 - x1), off = 0.12, sx = x1 + 15 * Math.cos(a + off), sy = y1 + 15 * Math.sin(a + off), ex = x2 - 15 * Math.cos(a - off), ey = y2 - 15 * Math.sin(a - off);
      g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.stroke(); g.setLineDash([]);
      g.beginPath(); g.moveTo(ex, ey); g.lineTo(ex - 8 * Math.cos(a - 0.4), ey - 8 * Math.sin(a - 0.4)); g.lineTo(ex - 8 * Math.cos(a + 0.4), ey - 8 * Math.sin(a + 0.4)); g.fill();
    };
    added.forEach(([i, j]) => arrow(i, j, c.acc, [5, 4], 1.6));
    E.forEach((e) => { const [i, j] = e.split(",").map(Number); arrow(i, j, c.main, null, 2); });
    nodes.forEach(([x, y], i) => { g.fillStyle = i === pick ? c.warn : i < steps ? c.soft : c.card; g.strokeStyle = c.ink2; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, 14, 0, 7); g.fill(); g.stroke(); g.fillStyle = c.ink; g.font = "13px monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(String(i + 1), x, y); });
    // 행렬
    const x0 = Wd * 0.55, sz = Math.min((Wd * 0.42) / (n + 1), (H - 20) / (n + 1));
    g.font = `${Math.max(10, sz * 0.45)}px monospace`;
    for (let i = 0; i < n; i++) { g.fillStyle = c.ink2; g.fillText(String(i + 1), x0 + (i + 1.5) * sz, 10 + sz / 2); g.fillText(String(i + 1), x0 + sz / 2, 10 + (i + 1.5) * sz); }
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const isNew = added.some(([a, b]) => a === i && b === j), X = x0 + (j + 1) * sz, Y = 10 + (i + 1) * sz;
      g.fillStyle = isNew ? c.acc : W[i][j] ? c.main : c.rule; g.globalAlpha = W[i][j] ? 0.75 : 0.3; g.fillRect(X + 1, Y + 1, sz - 2, sz - 2); g.globalAlpha = 1;
      g.fillStyle = c.ink; g.fillText(W[i][j] ? "1" : "0", X + sz / 2, Y + sz / 2);
    }
    g.restore();
    const last = added.filter(([, , kk]) => kk === steps - 1).map(([i, j]) => `(${i + 1},${j + 1})`);
    k.out(`${steps ? `경유지로 꼭짓점 1…${steps}까지 허락` : "경유지 없음, 원래 관계"} (W_${steps}) · 원래 간선 ${E.size}개, 추가된 쌍 ${added.length}개 (노란 점선)`
      + (steps ? `\n이번 단계(경유지 ${steps})에서 새로 생긴 쌍: ${last.length ? last.join(" ") : "없음"}` : "\n꼭짓점을 차례로 눌러 화살표를 넣거나 뺍니다 (첫 번째 → 두 번째)"));
  }
  cv.addEventListener("pointerdown", (e) => {
    const r = cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
    const i = nodes.findIndex(([x, y]) => Math.hypot(px - x, py - y) < 16);
    if (i < 0) return;
    if (pick < 0) pick = i; else { const key = pick + "," + i; E.has(key) ? E.delete(key) : E.add(key); pick = -1; }
    S.redraw();
  });
  S.redraw();
})();
