/* 수학8 탐구: 공장 문제의 단체법 — 피벗 규칙에 따라 지나는 꼭짓점과 단체표 */
(() => {
  "use strict";
  const S = MKit.setup("card-m8-simplexpath", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const NAMES = ["x", "y", "s₁", "s₂", "s₃"];
  function simplex(rule) {
    // 행: [x, y, s1, s2, s3 | b], 목적행: z = 3x + 5y → 계수 행 c, 값 z0
    let T = [[1, 0, 1, 0, 0, 4], [0, 2, 0, 1, 0, 12], [3, 2, 0, 0, 1, 18]], obj = [3, 5, 0, 0, 0, 0], basis = [2, 3, 4];
    const states = [];
    const snap = (note) => { const x = new Array(5).fill(0); basis.forEach((b, i) => (x[b] = T[i][5])); states.push({ x: x[0], y: x[1], z: obj[5], basis: basis.slice(), obj: obj.slice(), T: T.map((r) => r.slice()), note }); };
    snap("시작: 기저 s₁, s₂, s₃");
    for (let it = 0; it < 6; it++) {
      let e = -1;
      if (rule === "big") { let m = 1e-12; obj.slice(0, 5).forEach((cj, j) => { if (cj > m) { m = cj; e = j; } }); }
      else e = obj.slice(0, 5).findIndex((cj) => cj > 1e-12);
      if (e < 0) { states[states.length - 1].note += " → 목적식 계수가 모두 0 이하: 최적"; break; }
      let r = -1, best = Infinity;
      T.forEach((row, i) => { if (row[e] > 1e-12) { const q = row[5] / row[e]; if (q < best - 1e-12) { best = q; r = i; } } });
      const leave = basis[r], p = T[r][e];
      T[r] = T[r].map((a) => a / p);
      T = T.map((row, i) => (i === r ? row : row.map((a, j) => a - row[e] * T[r][j])));
      const f = obj[e]; obj = obj.map((a, j) => (j === 5 ? a + f * T[r][5] : a - f * T[r][j]));
      basis[r] = e;
      snap(`${NAMES[e]} 들어감, ${NAMES[leave]} 나감 (최소비 ${fmt(best, 3)})`);
    }
    return states;
  }
  function draw() {
    const c = QSim.col(), rule = k.val("r"), g = v.g;
    const st = simplex(rule), ss = k.$('[name="s"]');
    if (+ss.max !== st.length - 1) { ss.max = st.length - 1; MKit.setVal(k, "s", Math.min(+ss.value, st.length - 1)); }
    const s = Math.min(k.val("s"), st.length - 1), cur = st[s];
    const F = QSim.frame(v, { x0: -0.5, x1: 7.5, y0: -0.5, y1: 8, pad: 26, xl: "x", yl: "y" });
    F.axes();
    const V = [[0, 0], [4, 0], [4, 3], [2, 6], [0, 6]];
    g.fillStyle = c.soft; g.beginPath(); V.forEach(([x, y], i) => (i ? g.lineTo(F.X(x), F.Y(y)) : g.moveTo(F.X(x), F.Y(y)))); g.closePath(); g.fill();
    V.forEach(([x, y]) => F.dot(x, y, c.ink3, 4));
    F.path(st.slice(0, s + 1).map((q) => [q.x, q.y]), c.warn, 3);
    F.dot(cur.x, cur.y, c.warn, 7);
    const zrow = "z = " + fmt(cur.obj[5], 3) + cur.obj.slice(0, 5).map((a, j) => (Math.abs(a) < 1e-12 || cur.basis.includes(j) ? "" : (a > 0 ? " + " : " − ") + (Math.abs(Math.abs(a) - 1) < 1e-12 ? "" : fmt(Math.abs(a), 3)) + NAMES[j])).join("");
    k.out(`${s}단계: ${cur.note}\n꼭짓점 (${fmt(cur.x, 3)}, ${fmt(cur.y, 3)}) · ${zrow} · 기저 ${cur.basis.map((b) => NAMES[b]).join(", ")}`);
  }
  S.redraw();
})();
