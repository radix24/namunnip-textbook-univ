/* 수학3 탐구: 카르노 맵 — 칸을 눌러 1을 정하면 가장 짧은 곱의 합과 묶음을 보여 준다 */
(() => {
  "use strict";
  const GRAY = [0, 1, 3, 2];
  const S = MKit.setup("card-m3-kmap", 0.55, draw);
  if (!S) return;
  const { k, v, cv } = S;
  let nv = 3, ones = new Set([1, 3, 5, 7, 6]), geo = null;
  const VN = ["x", "y", "z", "w"];
  // 큐브: [값, 마스크(1이면 그 변수 고정)]
  function allCubes(n) { const out = []; for (let mask = 0; mask < 1 << n; mask++) for (let val = 0; val < 1 << n; val++) if ((val & ~mask) === 0) out.push([val, mask]); return out; }
  const covers = ([val, mask], m) => (m & mask) === val;
  function minimize(n) {
    if (!ones.size) return [];
    const cubes = allCubes(n).filter((cb) => { for (let m = 0; m < 1 << n; m++) if (covers(cb, m) && !ones.has(m)) return false; return true; });
    const bits = (x) => x.toString(2).split("1").length - 1;
    // 더 큰(고정 변수가 더 적은) 유효 큐브에 포함되지 않는 것이 주항
    const inside = (a, b) => b[1] !== a[1] && (b[1] & a[1]) === b[1] && (a[0] & b[1]) === b[0];
    const primes = cubes.filter((a) => !cubes.some((b) => inside(a, b)));
    const M = [...ones];
    let best = null;
    const rec = (i, chosen, left) => {
      if (best && chosen.length >= best.length) return;
      if (!left.length) { best = chosen.slice(); return; }
      const m = left[0];
      for (const p of primes.filter((p) => covers(p, m))) { chosen.push(p); rec(i + 1, chosen, left.filter((x) => !covers(p, x))); chosen.pop(); }
    };
    rec(0, [], M);
    return best.sort((a, b) => bits(a[1]) - bits(b[1]));
  }
  const term = ([val, mask], n) => { let s = ""; for (let i = 0; i < n; i++) { const bit = 1 << (n - 1 - i); if (mask & bit) s += (val & bit ? "" : "¬") + VN[i]; } return s || "1"; };
  function draw() {
    const c = QSim.col(), n = k.val("n"), g = v.g, W = v.W, H = v.H;
    if (n !== nv) { nv = n; ones = new Set(n === 3 ? [1, 3, 5, 7, 6] : [0, 2, 8, 10, 5, 7, 13, 15]); }
    const rows = n === 3 ? 2 : 4, cols = 4, sz = Math.min((W - 60) / cols, (H - 50) / rows), x0 = (W - sz * cols) / 2 + 10, y0 = 34;
    const cellM = (r, cc) => (n === 3 ? (r << 2) | GRAY[cc] : (GRAY[r] << 2) | GRAY[cc]);
    geo = { x0, y0, sz, rows, cols, cellM };
    const sol = minimize(n), hues = [210, 10, 130, 45, 280, 170, 330, 90];
    g.save(); g.textAlign = "center"; g.textBaseline = "middle"; g.font = "14px monospace";
    for (let cc = 0; cc < cols; cc++) { g.fillStyle = c.ink2; g.fillText(GRAY[cc].toString(2).padStart(2, "0"), x0 + (cc + 0.5) * sz, y0 - 12); }
    for (let r = 0; r < rows; r++) { g.fillStyle = c.ink2; g.fillText(n === 3 ? String(r) : GRAY[r].toString(2).padStart(2, "0"), x0 - 18, y0 + (r + 0.5) * sz); }
    g.fillText(n === 3 ? "x \\ yz" : "xy \\ zw", x0 - 10, 12);
    for (let r = 0; r < rows; r++) for (let cc = 0; cc < cols; cc++) {
      const m = cellM(r, cc), X = x0 + cc * sz, Y = y0 + r * sz, on = ones.has(m);
      g.strokeStyle = c.rule; g.lineWidth = 1; g.strokeRect(X, Y, sz, sz);
      sol.forEach((p, pi) => { if (covers(p, m)) { g.fillStyle = `hsla(${hues[pi % hues.length]}, 70%, 55%, 0.22)`; const ins = 4 + 4 * pi; g.fillRect(X + ins % (sz / 3), Y + ins % (sz / 3), sz - 2 * (ins % (sz / 3)), sz - 2 * (ins % (sz / 3))); } });
      g.fillStyle = on ? c.ink : c.ink3; g.font = on ? "bold 18px monospace" : "14px monospace"; g.fillText(on ? "1" : "0", X + sz / 2, Y + sz / 2);
    }
    g.restore();
    const expr = !ones.size ? "0" : ones.size === 1 << n ? "1" : sol.map((p) => term(p, n)).join(" + ");
    const sopLen = ones.size;
    k.out(`가장 짧은 곱의 합: f = ${expr}  (묶음 ${sol.length}개, 색으로 표시)\n표준형이면 최소항 ${sopLen}개(각 ${n}변수) · 칸을 누르면 0과 1이 바뀝니다 · 가장자리끼리도 이웃(감싸기)`);
  }
  cv.addEventListener("pointerdown", (e) => {
    if (!geo) return;
    const r = cv.getBoundingClientRect(), cc = Math.floor((e.clientX - r.left - geo.x0) / geo.sz), rr = Math.floor((e.clientY - r.top - geo.y0) / geo.sz);
    if (cc < 0 || cc >= geo.cols || rr < 0 || rr >= geo.rows) return;
    const m = geo.cellM(rr, cc); ones.has(m) ? ones.delete(m) : ones.add(m); S.redraw();
  });
  S.redraw();
})();
