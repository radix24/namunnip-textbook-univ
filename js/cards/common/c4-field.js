/* 공통4 실습: 점전하의 전기장(01-01)과 전위(03-01). 같은 스크립트를 두 카드가 쓴다.
   단위: 길이 m, 전하 nC → kq = 8.99 q (N·m²/C) */
(() => {
  "use strict";
  const K = 8.99;
  ["lab-c4-field", "lab-c4-potential"].forEach((id) => {
    const S = QSim.card(id); if (!S) return;
    const mode = S.root.dataset.mode || "field";
    const cv = S.$("canvas");
    let Q = mode === "field" ? [{ x: -0.6, y: 0, q: 2 }, { x: 0.6, y: 0, q: -2 }] : [{ x: -0.6, y: 0, q: 2 }, { x: 0.6, y: 0, q: 2 }];
    let probe = { x: 0, y: 0.7 }, drag = null, fr = null;
    const B = { x0: -2, x1: 2, y0: -1.5, y1: 1.5, equal: true, pad: 4 };
    const E = (x, y) => { let ex = 0, ey = 0; for (const c of Q) { const dx = x - c.x, dy = y - c.y, r2 = dx * dx + dy * dy, r = Math.sqrt(r2); if (r < 1e-3) continue; const s = (K * c.q) / (r2 * r); ex += s * dx; ey += s * dy; } return [ex, ey]; };
    const V = (x, y) => { let v = 0; for (const c of Q) { const r = Math.hypot(x - c.x, y - c.y); v += (K * c.q) / Math.max(r, 0.02); } return v; };
    function lines(f, C) {
      const per = 16;
      Q.filter((c) => c.q > 0 || Q.every((d) => d.q < 0)).forEach((c) => {
        const sgn = c.q > 0 ? 1 : -1;
        for (let k = 0; k < per * Math.min(3, Math.abs(c.q) / 2 + 0.5); k++) {
          const a = (2 * Math.PI * k) / (per * Math.min(3, Math.abs(c.q) / 2 + 0.5));
          let x = c.x + 0.06 * Math.cos(a), y = c.y + 0.06 * Math.sin(a); const pts = [[x, y]];
          for (let i = 0; i < 600; i++) {
            const [ex, ey] = E(x, y), m = Math.hypot(ex, ey); if (m < 1e-9) break;
            x += (sgn * 0.012 * ex) / m; y += (sgn * 0.012 * ey) / m; pts.push([x, y]);
            if (x < B.x0 - 0.3 || x > B.x1 + 0.3 || y < B.y0 - 0.3 || y > B.y1 + 0.3) break;
            if (Q.some((d) => d !== c && Math.hypot(x - d.x, y - d.y) < 0.05)) break;
          }
          f.path(pts, C.ink3, 1.1);
        }
      });
    }
    function draw() {
      const C = QSim.col(), v = QSim.view(cv, 0.75); fr = QSim.frame(v, B); const f = fr, g = v.g;
      if (mode === "potential") {
        const step = 6, W = v.W, H = v.H, Vs = S.val("step");
        for (let px = 0; px < W; px += step) for (let py = 0; py < H; py += step) {
          const x = B.x0 + ((px + step / 2 - f.X(B.x0)) / f.sx), y = B.y0 + ((f.Y(B.y0) - py - step / 2) / f.sy);
          const val = V(x, y), a = Math.min(0.55, Math.abs(Math.tanh(val / 60)) * 0.55);
          g.fillStyle = val > 0 ? C.warn : C.main; g.globalAlpha = a; g.fillRect(px, py, step, step);
        }
        g.globalAlpha = 1;
        // 등전위선: 셀 경계에서 부호가 바뀌는 곳에 점
        g.fillStyle = C.ink;
        for (let px = 0; px < W; px += 3) for (let py = 0; py < H; py += 3) {
          const x = B.x0 + (px - f.X(B.x0)) / f.sx, y = B.y0 + (f.Y(B.y0) - py) / f.sy;
          const a = Math.floor(V(x, y) / Vs), b = Math.floor(V(x + 3 / f.sx, y) / Vs), c = Math.floor(V(x, y - 3 / f.sy) / Vs);
          if (a !== b || a !== c) g.fillRect(px, py, 1.6, 1.6);
        }
        lines(f, C);
      } else {
        lines(f, C);
        if (S.val("arrows")) for (let x = -1.9; x <= 1.9; x += 0.25) for (let y = -1.4; y <= 1.4; y += 0.25) {
          const [ex, ey] = E(x, y), m = Math.hypot(ex, ey); if (m < 1e-6) continue;
          const L = 0.18 * Math.min(1, Math.log10(1 + m) / 3);
          f.arrow(x, y, (L * ex) / m, (L * ey) / m, C.main);
        }
      }
      Q.forEach((c) => { g.fillStyle = c.q > 0 ? C.warn : C.main; g.beginPath(); g.arc(f.X(c.x), f.Y(c.y), 10, 0, 7); g.fill(); g.fillStyle = "#fff"; g.font = "bold 13px sans-serif"; g.textAlign = "center"; g.fillText(c.q > 0 ? "+" : "−", f.X(c.x), f.Y(c.y) + 4.5); });
      const [ex, ey] = E(probe.x, probe.y), m = Math.hypot(ex, ey);
      f.dot(probe.x, probe.y, C.acc, 6);
      if (m > 1e-9) f.arrow(probe.x, probe.y, (0.35 * ex) / m, (0.35 * ey) / m, C.acc, "E");
      const ang = (Math.atan2(ey, ex) * 180) / Math.PI;
      S.out(`전하 ${Q.length}개: ${Q.map((c) => (c.q > 0 ? "+" : "") + c.q + " nC").join(", ")}\n` +
        `노란 점 (${probe.x.toFixed(2)}, ${probe.y.toFixed(2)}) m: E = ${m.toFixed(1)} N/C, 방향 ${ang.toFixed(0)}°` +
        (mode === "potential" ? `, V = ${V(probe.x, probe.y).toFixed(1)} V (등전위선 간격 ${S.val("step")} V)` : "") +
        `\n전하나 노란 점을 끌어 옮길 수 있습니다.`);
    }
    const pos = (e) => { const r = cv.getBoundingClientRect(); return { x: B.x0 + (e.clientX - r.left - fr.X(B.x0)) / fr.sx, y: B.y0 + (fr.Y(B.y0) - (e.clientY - r.top)) / fr.sy }; };
    cv.addEventListener("pointerdown", (e) => {
      const p = pos(e); const near = (o) => Math.hypot(o.x - p.x, o.y - p.y) < 0.15;
      drag = near(probe) ? probe : Q.find(near) || null;
      if (!drag) { probe.x = p.x; probe.y = p.y; drag = probe; draw(); }
      cv.setPointerCapture(e.pointerId);
    });
    cv.addEventListener("pointermove", (e) => { if (!drag) return; const p = pos(e); drag.x = Math.max(B.x0, Math.min(B.x1, p.x)); drag.y = Math.max(B.y0, Math.min(B.y1, p.y)); draw(); });
    cv.addEventListener("pointerup", () => { drag = null; });
    const add = (q) => { if (Q.length >= 6) return; Q.push({ x: (Math.random() - 0.5) * 2.4, y: (Math.random() - 0.5) * 1.8, q }); draw(); };
    S.$(".addp").addEventListener("click", () => add(S.val("qv")));
    S.$(".addn").addEventListener("click", () => add(-S.val("qv")));
    S.$(".clear").addEventListener("click", () => { Q = [{ x: 0, y: 0, q: S.val("qv") }]; draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  });
})();
