/* 수학23 탐구: 단체 복합체의 경계 행렬과 베티 수 — 유리수 계수와 Z/2 계수 비교 */
(() => {
  "use strict";
  const S = MKit.setup("card-m23-homology", 0.62, draw);
  if (!S) return;
  const { k, v } = S;
  const comb3 = (n) => { const t = []; for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) for (let c = b + 1; c < n; c++) t.push([a, b, c]); return t; };
  function torus() { const t = []; for (let i = 0; i < 7; i++) { t.push([i, (i + 1) % 7, (i + 3) % 7], [i, (i + 2) % 7, (i + 3) % 7]); } return t; }
  function klein() {
    const n = 3, m = 3, id = (i, j) => { if (i === n) { i = 0; j = (m - j) % m; } return i * m + (((j % m) + m) % m); }, t = [];
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { const a = id(i, j), b = id(i + 1, j), c = id(i + 1, j + 1), d = id(i, j + 1); t.push([a, b, c], [a, c, d]); }
    return t;
  }
  const RP2 = [[0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 5], [0, 5, 1], [1, 2, 4], [2, 3, 5], [3, 4, 1], [4, 5, 2], [5, 1, 3]];
  const CX = {
    circle: { name: "원 (속이 빈 삼각형)", edges: [[0, 1], [1, 2], [0, 2]], tris: [] },
    eight: { name: "8자 (삼각형 둘레 두 개)", edges: [[0, 1], [1, 2], [0, 2], [0, 3], [3, 4], [0, 4]], tris: [] },
    disk: { name: "원판 (속이 찬 삼각형)", tris: [[0, 1, 2]] },
    sphere: { name: "구면 (사면체 겉면)", tris: comb3(4) },
    torus: { name: "원환면 (7꼭짓점)", tris: torus() },
    rp2: { name: "사영평면 (6꼭짓점)", tris: RP2 },
    klein: { name: "클라인 병 (9꼭짓점)", tris: klein() },
  };
  function build(c) {
    const T = c.tris.map((t) => t.slice().sort((a, b) => a - b));
    const es = new Map(), vs = new Set();
    const addE = (a, b) => { const key = a < b ? `${a},${b}` : `${b},${a}`; if (!es.has(key)) es.set(key, a < b ? [a, b] : [b, a]); };
    (c.edges || []).forEach(([a, b]) => { addE(a, b); vs.add(a); vs.add(b); });
    T.forEach(([a, b, d]) => { addE(a, b); addE(b, d); addE(a, d); vs.add(a); vs.add(b); vs.add(d); });
    const V = [...vs].sort((a, b) => a - b), E = [...es.values()].sort((p, q) => p[0] - q[0] || p[1] - q[1]);
    const ei = new Map(E.map((e, i) => [`${e[0]},${e[1]}`, i]));
    const d1 = V.map(() => E.map(() => 0));
    E.forEach(([a, b], j) => { d1[V.indexOf(a)][j] = -1; d1[V.indexOf(b)][j] = 1; });
    const d2 = E.map(() => T.map(() => 0));
    T.forEach(([a, b, d], j) => { d2[ei.get(`${b},${d}`)][j] = 1; d2[ei.get(`${a},${d}`)][j] = -1; d2[ei.get(`${a},${b}`)][j] = 1; });
    return { V, E, T, d1, d2 };
  }
  function rank(M, mod2) {
    if (!M.length || !M[0].length) return 0;
    const A = M.map((r) => r.map((x) => (mod2 ? ((x % 2) + 2) % 2 : x)));
    let r = 0;
    for (let c = 0; c < A[0].length && r < A.length; c++) {
      let p = -1; for (let i = r; i < A.length; i++) if (Math.abs(A[i][c]) > 1e-9) { p = i; break; }
      if (p < 0) continue;
      [A[r], A[p]] = [A[p], A[r]];
      for (let i = 0; i < A.length; i++) {
        if (i === r || Math.abs(A[i][c]) < 1e-9) continue;
        if (mod2) A[i] = A[i].map((x, j) => (x + A[r][j]) % 2);
        else { const f = A[i][c] / A[r][c]; A[i] = A[i].map((x, j) => x - f * A[r][j]); }
      }
      r++;
    }
    return r;
  }
  function grid(F, M, x0, y0, w, h, c, label) {
    const rows = M.length, cols = rows ? M[0].length : 0;
    F.text(label, x0, y0 + h + 0.02, c.ink, "left");
    if (!rows || !cols) { F.text("(비어 있음)", x0, y0 + h / 2, c.ink3, "left"); return; }
    const cw = w / cols, ch = h / rows, g = v.g;
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
      const val = M[i][j], X0 = F.X(x0 + j * cw), X1 = F.X(x0 + (j + 1) * cw), Y0 = F.Y(y0 + h - i * ch), Y1 = F.Y(y0 + h - (i + 1) * ch);
      g.fillStyle = val > 0 ? c.main : val < 0 ? c.warn : c.soft;
      g.fillRect(Math.min(X0, X1), Math.min(Y0, Y1), Math.abs(X1 - X0) - 0.5, Math.abs(Y1 - Y0) - 0.5);
    }
  }
  function draw() {
    const c = QSim.col(), key = k.val("cx"), mod2 = k.val("field") === "z2", B = build(CX[key]);
    const r1 = rank(B.d1, mod2), r2 = rank(B.d2, mod2);
    const b0 = B.V.length - r1, b1 = B.E.length - r1 - r2, b2 = B.T.length - r2;
    const F = QSim.frame(v, { x0: 0, x1: 1, y0: 0, y1: 1, pad: 8, xl: "", yl: "" });
    const asp = (M) => (M.length && M[0].length ? M[0].length / M.length : 1);
    const w1 = 0.44, w2 = 0.44, h = 0.8;
    grid(F, B.d1, 0.02, 0.1, w1, Math.min(h, (w1 / asp(B.d1)) * 1.6), c, `∂₁ (꼭짓점 ${B.V.length} × 변 ${B.E.length})`);
    grid(F, B.d2, 0.52, 0.1, w2, Math.min(h, (w2 / asp(B.d2)) * 1.6), c, `∂₂ (변 ${B.E.length} × 면 ${B.T.length})`);
    const chi = B.V.length - B.E.length + B.T.length;
    k.out(`${CX[key].name} · 계수 ${mod2 ? "Z/2" : "유리수 Q"} · 파랑 +1, 빨강 −1(Z/2에서는 같은 1)\n` +
      `rank ∂₁ = ${r1}, rank ∂₂ = ${r2} → 베티 수 (β₀, β₁, β₂) = (${b0}, ${b1}, ${b2})\n` +
      `χ = V − E + F = ${B.V.length} − ${B.E.length} + ${B.T.length} = ${chi} · β₀ − β₁ + β₂ = ${b0 - b1 + b2}`);
  }
  S.redraw();
})();
