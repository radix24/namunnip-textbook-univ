/* 수학12 탐구: 목걸이 색칠의 궤도와 안정자 — 구슬을 눌러 색을 바꾸면 |궤도| × |안정자| = |G| */
(() => {
  "use strict";
  const S = MKit.setup("card-m12-orbit", 0.55, draw);
  if (!S) return;
  const { k, v, cv } = S;
  let col = [0, 0, 1, 0, 0, 1], geo = null;
  const md = (x, n) => ((x % n) + n) % n;
  // 군의 원소: [j, f] — f = 0이면 j칸 회전, f = 1이면 반사 i ↦ j − i
  const act = ([j, f], c) => c.map((_, i) => c[f ? md(j - i, c.length) : md(i - j, c.length)]);
  const gname = ([j, f], n) => (f ? `반사(i ↦ ${j} − i)` : j ? `${j}칸 회전` : "e");
  function draw() {
    const c = QSim.col(), n = k.val("n"), K = k.val("k"), dih = k.val("g") === "dih";
    if (col.length !== n) col = Array.from({ length: n }, (_, i) => col[i] ?? 0);
    col = col.map((x) => x % K);
    const pal = ["hsl(210, 70%, 55%)", "hsl(10, 75%, 58%)", "hsl(45, 85%, 55%)"];
    const G = []; for (let f = 0; f < (dih ? 2 : 1); f++) for (let j = 0; j < n; j++) G.push([j, f]);
    const orbit = new Map(), stab = [];
    for (const g of G) { const y = act(g, col); orbit.set(y.join(""), y); if (y.join("") === col.join("")) stab.push(g); }
    const g = v.g, W = v.W, H = v.H, cx = W * 0.22, cy = H * 0.5, R = Math.min(W * 0.17, H * 0.36), br = Math.max(9, R * 0.22);
    geo = { cx, cy, R, n };
    g.save();
    g.strokeStyle = c.rule; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke();
    for (let i = 0; i < n; i++) {
      const t = -Math.PI / 2 + (2 * Math.PI * i) / n, x = cx + R * Math.cos(t), y = cy + R * Math.sin(t);
      g.fillStyle = pal[col[i]]; g.beginPath(); g.arc(x, y, br, 0, 7); g.fill();
      g.fillStyle = c.ink2; g.font = "11px monospace"; g.textAlign = "center"; g.fillText(String(i), cx + (R + br + 9) * Math.cos(t), cy + (R + br + 9) * Math.sin(t) + 4);
    }
    // 궤도의 원소들을 작게
    const list = [...orbit.values()], cols = Math.ceil(Math.sqrt(list.length * 1.6)), rows = Math.ceil(list.length / cols);
    const x0 = W * 0.47, cw = (W - x0 - 6) / cols, ch = Math.min((H - 24) / rows, cw), r = Math.min(cw, ch) * 0.36;
    g.fillStyle = c.ink2; g.font = "12px monospace"; g.textAlign = "left"; g.fillText(`궤도 (${list.length}개)`, x0, 14);
    list.forEach((y, idx) => {
      const ox = x0 + (idx % cols + 0.5) * cw, oy = 22 + (Math.floor(idx / cols) + 0.5) * ch;
      for (let i = 0; i < n; i++) { const t = -Math.PI / 2 + (2 * Math.PI * i) / n; g.fillStyle = pal[y[i]]; g.beginPath(); g.arc(ox + r * Math.cos(t), oy + r * Math.sin(t), Math.max(2, r * 0.28), 0, 7); g.fill(); }
      if (y.join("") === col.join("")) { g.strokeStyle = c.ink; g.lineWidth = 1.5; g.beginPath(); g.arc(ox, oy, r * 1.45, 0, 7); g.stroke(); }
    });
    g.restore();
    k.out(`G = ${dih ? "D" : "C"}_${n} (원소 ${G.length}개)가 색칠에 작용 · 궤도 ${orbit.size}개 × 안정자 ${stab.length}개 = ${orbit.size * stab.length}\n`
      + `안정자: ${stab.map((s) => gname(s, n)).join(", ")}`);
  }
  cv.addEventListener("pointerdown", (e) => {
    if (!geo) return;
    const r = cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
    for (let i = 0; i < geo.n; i++) {
      const t = -Math.PI / 2 + (2 * Math.PI * i) / geo.n;
      if (Math.hypot(px - geo.cx - geo.R * Math.cos(t), py - geo.cy - geo.R * Math.sin(t)) < Math.max(14, geo.R * 0.25)) { col[i] = (col[i] + 1) % k.val("k"); S.redraw(); return; }
    }
  });
  S.redraw();
})();
