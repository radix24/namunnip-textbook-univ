/* 수학8 탐구: 조르당 블록 크기 ↔ 점 도표 ↔ rank(A − λI)^k 수열 */
(() => {
  "use strict";
  const S = MKit.setup("card-m8-jordanranks", 0.42, draw);
  if (!S) return;
  const { k, v } = S;
  function draw() {
    const c = QSim.col(), g = v.g, W = v.W, H = v.H;
    const sizes = [k.val("b1"), k.val("b2"), k.val("b3")].filter((s) => s > 0).sort((x, y) => y - x);
    const n = sizes.reduce((s, x) => s + x, 0), mx = Math.max(...sizes);
    const r = []; for (let j = 0; j <= mx + 1; j++) r.push(sizes.reduce((s, x) => s + Math.max(0, x - j), 0));
    const cell = Math.min(34, (H - 40) / Math.max(mx, 1)), x0 = 30, y0 = 26;
    g.save(); g.font = "12px monospace"; g.textBaseline = "middle"; g.textAlign = "center";
    sizes.forEach((s, i) => {
      for (let j = 0; j < s; j++) { g.fillStyle = c.main; g.beginPath(); g.arc(x0 + i * cell * 1.3 + cell / 2, y0 + j * cell + cell / 2, cell * 0.28, 0, 7); g.fill(); }
      g.fillStyle = c.ink2; g.fillText(`J${s}`, x0 + i * cell * 1.3 + cell / 2, y0 - 12);
    });
    g.textAlign = "right"; for (let j = 0; j < mx; j++) { g.fillStyle = c.ink3; g.fillText(`${j + 1}행`, x0 - 4, y0 + j * cell + cell / 2); }
    // 계수 막대
    const bx = W * 0.45, bw = (W - bx - 20) / (mx + 2), sc = (H - 50) / n;
    g.textAlign = "center";
    for (let j = 0; j <= mx + 1; j++) {
      const X = bx + j * bw; g.fillStyle = j === 0 ? c.ink3 : c.acc; g.fillRect(X + 4, H - 24 - r[j] * sc, bw - 8, r[j] * sc);
      g.fillStyle = c.ink2; g.fillText(`r${j}=${r[j]}`, X + bw / 2, H - 12);
    }
    g.restore();
    const diffs = r.slice(0, -1).map((x, j) => x - r[j + 1]);
    k.out(`블록 ${sizes.map((s) => `J${s}(λ)`).join(" ⊕ ")} · n = ${n}\nrank(A − λI)^k: ${r.join(", ")} · 차 r(k−1) − r(k) = ${diffs.join(", ")} (점 도표 각 행의 점 개수 = 크기 k 이상인 블록 수)`);
  }
  S.redraw();
})();
