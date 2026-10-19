/* 수학2 탐구: 양의 유리수 세기 — p/q 표를 대각선으로 훑고, 약분되는 칸은 건너뛴다 */
(() => {
  "use strict";
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const S = MKit.setup("card-m2-qenum", 0.75, draw);
  if (!S) return;
  const { k, v } = S;
  const M = 8; // 표 크기 M × M
  function draw() {
    const c = QSim.col(), N = k.val("N"), g = v.g, W = v.W, H = v.H;
    const sz = Math.min((W - 40) / M, (H - 40) / M), x0 = 34, y0 = 26;
    // 대각선 순서로 (p, q) 늘어놓기, 기약분수만 번호
    const order = []; let num = 0;
    for (let s = 2; order.length < M * M && s <= 2 * M; s++) for (let p = 1; p < s; p++) { const q = s - p; if (p <= M && q <= M) { const red = gcd(p, q) === 1; order.push({ p, q, red, idx: red ? ++num : 0 }); } }
    const shown = []; let path = [];
    for (const o of order) { if (shown.length >= N) break; path.push(o); if (o.red) shown.push(o); }
    const C = (o) => [x0 + (o.q - 0.5) * sz, y0 + (o.p - 0.5) * sz];
    g.save(); g.textAlign = "center"; g.textBaseline = "middle";
    g.font = `${Math.max(9, Math.min(13, sz * 0.32))}px monospace`;
    for (const o of order) {
      const [x, y] = C(o), done = path.includes(o);
      g.globalAlpha = done ? (o.red ? 0.75 : 0.3) : 0.12; g.fillStyle = o.red ? c.main : c.ink3;
      g.fillRect(x - sz / 2 + 1, y - sz / 2 + 1, sz - 2, sz - 2); g.globalAlpha = 1;
      g.fillStyle = done && o.red ? c.card : c.ink2; g.fillText(`${o.p}/${o.q}`, x, y - (done && o.red ? 6 : 0));
      if (done && o.red) { g.font = `${Math.max(8, Math.min(11, sz * 0.26))}px monospace`; g.fillText(`#${o.idx}`, x, y + 8); g.font = `${Math.max(9, Math.min(13, sz * 0.32))}px monospace`; }
    }
    g.strokeStyle = c.warn; g.lineWidth = 1.5; g.beginPath();
    path.forEach((o, i) => { const [x, y] = C(o); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
    g.fillStyle = c.ink3; g.fillText("q →", x0 + M * sz / 2, 10); g.save(); g.translate(12, y0 + M * sz / 2); g.rotate(-Math.PI / 2); g.fillText("p →", 0, 0); g.restore();
    g.restore();
    const last = shown[shown.length - 1];
    k.out(`처음 ${shown.length}개의 양의 유리수: ${shown.map((o) => `${o.p}/${o.q}`).join(", ")}\n`
      + `건너뛴(약분되는) 칸 ${path.length - shown.length}개 · ${last ? `${last.p}/${last.q}의 번호 ${last.idx}` : ""} · 대각선 p + q = s를 차례로 훑으면 어떤 분수든 유한 번 만에 나온다`);
  }
  S.redraw();
})();
