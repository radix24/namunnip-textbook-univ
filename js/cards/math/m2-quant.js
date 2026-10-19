/* 수학2 탐구: 한정기호 게임 — 관계표 P(x, y)를 눌러 바꾸며 ∀∃, ∃∀ 등의 참거짓과 증인·반례를 본다 */
(() => {
  "use strict";
  const S = MKit.setup("card-m2-quant", 0.62, draw);
  if (!S) return;
  const { k, v, cv } = S;
  // 처음 표: y = x (대각선)만 참 — ∀x∃y는 참, ∃y∀x는 거짓
  let P = Array.from({ length: 6 }, (_, i) => Array.from({ length: 6 }, (_, j) => i === j));
  let geo = null;
  function draw() {
    const c = QSim.col(), m = k.val("m"), n = k.val("n"), g = v.g, W = v.W, H = v.H;
    const sz = Math.min((W * 0.5 - 30) / n, (H - 40) / m), x0 = 30, y0 = 28;
    geo = { x0, y0, sz, m, n };
    g.save(); g.textAlign = "center"; g.textBaseline = "middle"; g.font = "12px monospace";
    for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) {
      g.fillStyle = P[i][j] ? c.main : c.rule; g.globalAlpha = P[i][j] ? 0.75 : 0.4;
      g.fillRect(x0 + j * sz + 1, y0 + i * sz + 1, sz - 2, sz - 2); g.globalAlpha = 1;
      g.fillStyle = P[i][j] ? c.card : c.ink3; g.fillText(P[i][j] ? "T" : "F", x0 + (j + 0.5) * sz, y0 + (i + 0.5) * sz);
    }
    g.fillStyle = c.ink2;
    for (let j = 0; j < n; j++) g.fillText(`y${j + 1}`, x0 + (j + 0.5) * sz, y0 - 10);
    for (let i = 0; i < m; i++) g.fillText(`x${i + 1}`, 14, y0 + (i + 0.5) * sz);
    // 오른쪽: 네 명제의 참거짓
    const X = [...Array(m).keys()], Y = [...Array(n).keys()];
    const rows = [
      ["∀x ∃y P", X.every((i) => Y.some((j) => P[i][j])), () => { const i = X.find((i) => !Y.some((j) => P[i][j])); return `반례 x${i + 1}: 어떤 y도 안 됨`; }, () => `각 x에 맞는 y: ${X.map((i) => `x${i + 1}→y${Y.find((j) => P[i][j]) + 1}`).join(", ")}`],
      ["∃y ∀x P", Y.some((j) => X.every((i) => P[i][j])), () => "모든 x에 통하는 y가 없음", () => `증인 y${Y.find((j) => X.every((i) => P[i][j])) + 1}`],
      ["∃x ∀y P", X.some((i) => Y.every((j) => P[i][j])), () => "모든 y에 대해 참인 x가 없음", () => `증인 x${X.find((i) => Y.every((j) => P[i][j])) + 1}`],
      ["∀y ∃x P", Y.every((j) => X.some((i) => P[i][j])), () => { const j = Y.find((j) => !X.some((i) => P[i][j])); return `반례 y${j + 1}: 열 전체가 F`; }, () => "모든 열에 T가 있음"],
    ];
    const tx = W * 0.56;
    rows.forEach(([name, val, no, yes], r) => {
      const y = y0 + 10 + r * 34;
      g.textAlign = "left"; g.font = "14px monospace"; g.fillStyle = val ? c.main : c.warn;
      g.fillText(`${name}: ${val ? "참" : "거짓"}`, tx, y);
      g.font = "11px monospace"; g.fillStyle = c.ink2;
      const s = val ? yes() : no(); g.fillText(s.length > 34 ? s.slice(0, 33) + "…" : s, tx, y + 15);
    });
    g.restore();
    k.out(rows.map(([name, val, no, yes]) => `${name}: ${val ? "참" : "거짓"} (${val ? yes() : no()})`).join("\n") + "\n칸을 누르면 P(x, y)의 참(T)·거짓(F)이 바뀝니다. 행 = x, 열 = y");
  }
  cv.addEventListener("pointerdown", (e) => {
    if (!geo) return;
    const r = cv.getBoundingClientRect(), j = Math.floor((e.clientX - r.left - geo.x0) / geo.sz), i = Math.floor((e.clientY - r.top - geo.y0) / geo.sz);
    if (i >= 0 && i < geo.m && j >= 0 && j < geo.n) { P[i][j] = !P[i][j]; S.redraw(); }
  });
  S.redraw();
})();
