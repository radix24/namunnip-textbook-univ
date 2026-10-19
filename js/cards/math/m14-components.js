/* 수학14 탐구: 영역 {f > c}의 연결 성분을 세기 (격자 위 너비 우선 탐색) */
(() => {
  "use strict";
  const S = MKit.setup("card-m14-components", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const bumps = [[-1.3, 0.1, 1.0, 0.5], [0.9, 0.35, 0.8, 0.45], [0.25, -0.55, 0.62, 0.35], [1.6, -0.6, 0.45, 0.3]];
  const f = (x, y) => bumps.reduce((s, [a, b, h, w]) => s + h * Math.exp(-((x - a) ** 2 + (y - b) ** 2) / (2 * w * w)), 0);
  const NX = 200, NY = 100, X0 = -2.6, X1 = 2.6, Y0 = -1.3, Y1 = 1.3;
  const vals = [];
  for (let j = 0; j < NY; j++) { vals.push([]); for (let i = 0; i < NX; i++) vals[j].push(f(X0 + ((i + 0.5) * (X1 - X0)) / NX, Y0 + ((j + 0.5) * (Y1 - Y0)) / NY)); }
  function draw() {
    const c = QSim.col(), cut = k.val("c");
    const lab = vals.map((r) => r.map(() => 0));
    let n = 0; const sizes = [];
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      if (vals[j][i] <= cut || lab[j][i]) continue;
      n++; let sz = 0; const q = [[i, j]]; lab[j][i] = n;
      while (q.length) { const [a, b] = q.pop(); sz++; for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = a + da, y = b + db; if (x >= 0 && x < NX && y >= 0 && y < NY && !lab[y][x] && vals[y][x] > cut) { lab[y][x] = n; q.push([x, y]); } } }
      sizes.push(sz);
    }
    const F = QSim.frame(v, { x0: X0, x1: X1, y0: Y0, y1: Y1, pad: 6, equal: true });
    const g = v.g, cw = (F.X(X1) - F.X(X0)) / NX, ch = (F.Y(Y0) - F.Y(Y1)) / NY;
    const pal = [c.main, c.warn, c.acc, c.ink2, c.soft];
    g.save();
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const L = lab[j][i];
      g.fillStyle = L ? pal[(L - 1) % pal.length] : c.card; g.globalAlpha = L ? 0.55 : 0.0;
      if (L) g.fillRect(F.X(X0 + (i * (X1 - X0)) / NX), F.Y(Y0 + ((j + 1) * (Y1 - Y0)) / NY), cw + 0.6, ch + 0.6);
    }
    g.restore();
    const cellA = ((X1 - X0) / NX) * ((Y1 - Y0) / NY);
    k.out(`c = ${fmt(cut, 2)} · 영역 {f > c}의 연결 성분 ${n}개${n ? ` (넓이 ${sizes.map((s) => fmt(s * cellA, 2)).join(", ")})` : ""}\nf는 높이 1.0, 0.8, 0.62, 0.45인 봉우리 넷의 합 · c를 내리면 봉우리 둘레의 섬들이 커지다가 이어진다`);
  }
  S.redraw();
})();
