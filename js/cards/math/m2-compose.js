/* 수학2 탐구: 화살표로 본 합성 — f, g의 단사·전사가 g∘f에 어떻게 이어지는가 */
(() => {
  "use strict";
  const S = MKit.setup("card-m2-compose", 0.55, draw);
  if (!S) return;
  const { k, v, cv } = S;
  let f = [0, 1, 2, 0, 1], g = [0, 1, 0, 1, 0], geo = null;
  const inj = (h, n) => new Set(h.slice(0, n)).size === n;
  const surj = (h, n, m) => new Set(h.slice(0, n)).size === m;
  function draw() {
    const c = QSim.col(), nx = k.val("x"), ny = k.val("y"), nz = k.val("z");
    f = f.map((t) => t % ny); g = g.map((t) => t % nz);
    const W = v.W, H = v.H, xs = [W * 0.12, W * 0.5, W * 0.88];
    const pos = (col, i, cnt) => [xs[col], 30 + ((H - 50) * (i + 0.5)) / cnt];
    geo = { nx, ny, nz, pos };
    const gg = v.g; gg.save();
    const arrow = (p, q, color) => {
      const a = Math.atan2(q[1] - p[1], q[0] - p[0]), x1 = p[0] + 10 * Math.cos(a), y1 = p[1] + 10 * Math.sin(a), x2 = q[0] - 12 * Math.cos(a), y2 = q[1] - 12 * Math.sin(a);
      gg.strokeStyle = gg.fillStyle = color; gg.lineWidth = 1.8; gg.beginPath(); gg.moveTo(x1, y1); gg.lineTo(x2, y2); gg.stroke();
      gg.beginPath(); gg.moveTo(x2, y2); gg.lineTo(x2 - 8 * Math.cos(a - 0.4), y2 - 8 * Math.sin(a - 0.4)); gg.lineTo(x2 - 8 * Math.cos(a + 0.4), y2 - 8 * Math.sin(a + 0.4)); gg.fill();
    };
    for (let i = 0; i < nx; i++) arrow(pos(0, i, nx), pos(1, f[i], ny), c.main);
    for (let j = 0; j < ny; j++) arrow(pos(1, j, ny), pos(2, g[j], nz), c.acc);
    const lab = [["1", "2", "3", "4", "5"], ["a", "b", "c", "d", "e"], ["p", "q", "r", "s", "t"]];
    [nx, ny, nz].forEach((cnt, col) => { for (let i = 0; i < cnt; i++) { const [x, y] = pos(col, i, cnt); gg.fillStyle = c.card; gg.strokeStyle = c.ink2; gg.lineWidth = 1.5; gg.beginPath(); gg.arc(x, y, 10, 0, 7); gg.fill(); gg.stroke(); gg.fillStyle = c.ink; gg.font = "12px monospace"; gg.textAlign = "center"; gg.textBaseline = "middle"; gg.fillText(lab[col][i], x, y); } });
    gg.font = "13px monospace"; gg.fillStyle = c.ink2; gg.fillText("X", xs[0], 12); gg.fillText("Y", xs[1], 12); gg.fillText("Z", xs[2], 12);
    gg.fillStyle = c.main; gg.fillText("f", (xs[0] + xs[1]) / 2, 12); gg.fillStyle = c.acc; gg.fillText("g", (xs[1] + xs[2]) / 2, 12);
    gg.restore();
    const gf = f.slice(0, nx).map((t) => g[t]);
    const d = (h, n, m) => `${inj(h, n) ? "단사" : "단사 아님"}, ${surj(h, n, m) ? "전사" : "전사 아님"}`;
    k.out(`f: ${d(f, nx, ny)} · g: ${d(g, ny, nz)} · g∘f: ${d(gf, nx, nz)}\n`
      + `점을 누르면 그 점에서 나가는 화살표의 도착점이 바뀝니다 (X의 점은 f, Y의 점은 g)`);
  }
  cv.addEventListener("pointerdown", (e) => {
    if (!geo) return;
    const r = cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
    for (let i = 0; i < geo.nx; i++) { const [x, y] = geo.pos(0, i, geo.nx); if (Math.hypot(px - x, py - y) < 16) { f[i] = (f[i] + 1) % geo.ny; S.redraw(); return; } }
    for (let j = 0; j < geo.ny; j++) { const [x, y] = geo.pos(1, j, geo.ny); if (Math.hypot(px - x, py - y) < 16) { g[j] = (g[j] + 1) % geo.nz; S.redraw(); return; } }
  });
  S.redraw();
})();
