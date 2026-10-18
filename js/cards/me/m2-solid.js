/* 기계2 고체역학: 단순보의 전단력·굽힘 모멘트 선도 (05-01), 모어 원 (06-01) */
(() => {
  "use strict";
  const C = () => QSim.col();

  /* ── 단순보: 집중 하중 P(위치 a) + 등분포 하중 w ── */
  (() => {
    const S = QSim.card("lab-me-beam"); if (!S) return;
    const [c1, c2, c3] = S.$$("canvas"), L = 4, b = 0.06;
    function calc() {
      const P = S.val("P"), a = S.val("a"), w = S.val("w");
      const RB = (P * a + (w * L * L) / 2) / L, RA = P + w * L - RB;
      const V = (x) => RA - w * x - (x > a ? P : 0);
      const M = (x) => RA * x - (w * x * x) / 2 - (x > a ? P * (x - a) : 0);
      let xm = 0, Mm = 0;
      for (let i = 0; i <= 800; i++) { const x = (L * i) / 800, m = M(x); if (Math.abs(m) > Math.abs(Mm)) { Mm = m; xm = x; } }
      if (Math.abs(M(a)) >= Math.abs(Mm)) { Mm = M(a); xm = a; }
      return { P, a, w, RA, RB, V, M, xm, Mm };
    }
    function draw() {
      const c = C(), r = calc(), h = S.val("h") / 1000;
      // 보와 하중
      let v = QSim.view(c1, 0.32), f = QSim.frame(v, { x0: -0.3, x1: L + 0.3, y0: -1.1, y1: 1.6, pad: 6 });
      v.g.fillStyle = c.soft; v.g.fillRect(f.X(0), f.Y(0.12), f.X(L) - f.X(0), f.Y(-0.12) - f.Y(0.12));
      v.g.strokeStyle = c.ink2; v.g.strokeRect(f.X(0), f.Y(0.12), f.X(L) - f.X(0), f.Y(-0.12) - f.Y(0.12));
      const tri = (x) => { const g = v.g; g.fillStyle = c.ink3; g.beginPath(); g.moveTo(f.X(x), f.Y(-0.12)); g.lineTo(f.X(x) - 9, f.Y(-0.12) + 14); g.lineTo(f.X(x) + 9, f.Y(-0.12) + 14); g.fill(); };
      tri(0); tri(L);
      if (r.w > 0) { const n = 9, hw = 0.25 + 0.5 * (r.w / 20); for (let i = 0; i <= n; i++) f.arrow((L * i) / n, 0.12 + hw, 0, -hw, c.ink3); f.path([[0, 0.12 + hw], [L, 0.12 + hw]], c.ink3, 1); }
      if (r.P > 0) { const hp = 0.4 + 1.0 * (r.P / 50); f.arrow(r.a, 0.14 + hp, 0, -hp, c.warn, "P"); }
      f.arrow(0, -1.05, 0, 0.75, c.main, "R_A"); f.arrow(L, -1.05, 0, 0.75, c.main, "R_B");
      // 전단력 선도
      const Vmax = Math.max(5, ...[0, r.a - 1e-6, r.a + 1e-6, L].map((x) => Math.abs(r.V(x)))) * 1.2;
      v = QSim.view(c2, 0.34); f = QSim.frame(v, { x0: 0, x1: L, y0: -Vmax, y1: Vmax, xl: "x (m)", yl: "V (kN)", pad: 34 }); f.axes();
      const pv = []; for (let i = 0; i <= 400; i++) { const x = (L * i) / 400; if (Math.abs(x - r.a) < L / 400) { pv.push([r.a, r.V(r.a - 1e-9)]); pv.push([r.a, r.V(r.a + 1e-9)]); } pv.push([x, r.V(x)]); }
      f.path(pv, c.main, 2);
      // 굽힘 모멘트 선도
      const Mmax = Math.max(5, Math.abs(r.Mm)) * 1.2;
      v = QSim.view(c3, 0.34); f = QSim.frame(v, { x0: 0, x1: L, y0: -Mmax * 0.15, y1: Mmax, xl: "x (m)", yl: "M (kN·m)", pad: 34 }); f.axes();
      f.fn(r.M, c.acc, 2.5); f.dot(r.xm, r.Mm, c.warn, 4);
      const sig = (6 * Math.abs(r.Mm) * 1e3) / (b * h * h) / 1e6;
      S.out(`반력 R_A = ${r.RA.toFixed(2)} kN, R_B = ${r.RB.toFixed(2)} kN (합 ${(r.RA + r.RB).toFixed(2)} = P + wL)\n최대 굽힘 모멘트 ${r.Mm.toFixed(2)} kN·m (x = ${r.xm.toFixed(2)} m, 전단력이 부호를 바꾸는 곳)\n단면 폭 60 mm × 높이 ${S.val("h")} mm: I = bh³/12, 최대 굽힘 응력 σ = Mc/I = ${sig.toFixed(1)} MPa`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* ── 모어 원: 평면 응력 변환 ── */
  (() => {
    const S = QSim.card("card-me-mohr"); if (!S) return;
    const [c1, c2] = S.$$("canvas");
    function draw() {
      const c = C(), sx = S.val("sx"), sy = S.val("sy"), t = S.val("txy"), th = (S.val("th") * Math.PI) / 180;
      const cen = (sx + sy) / 2, d = (sx - sy) / 2, R = Math.hypot(d, t);
      const sxp = cen + d * Math.cos(2 * th) + t * Math.sin(2 * th), txp = -d * Math.sin(2 * th) + t * Math.cos(2 * th);
      const syp = 2 * cen - sxp;
      const thp = (0.5 * Math.atan2(t, d) * 180) / Math.PI;
      // 원: 가로 σ, 세로는 τ를 아래쪽이 + 로 그린다 (그림 y = -τ)
      const M = Math.max(40, Math.abs(cen) + R) * 1.15;
      let v = QSim.view(c1, 0.62), f = QSim.frame(v, { x0: -M, x1: M, y0: -M * 0.62 / 1, y1: M * 0.62, equal: true, pad: 30, xl: "σ (MPa)", yl: "τ (아래가 +)" }); f.axes();
      const pts = []; for (let i = 0; i <= 120; i++) { const a = (i / 120) * 2 * Math.PI; pts.push([cen + R * Math.cos(a), R * Math.sin(a)]); }
      f.path(pts, c.main, 2);
      f.path([[sx, -t], [sy, t]], c.ink3, 1, [4, 3]);
      f.dot(sx, -t, c.ink3, 4); f.text("X", sx, -t + M * 0.05, c.ink3);
      f.path([[sxp, -txp], [syp, txp]], c.acc, 2);
      f.dot(sxp, -txp, c.warn, 5); f.text("X'", sxp, -txp + M * 0.05, c.warn);
      f.dot(cen + R, 0, c.main, 4); f.dot(cen - R, 0, c.main, 4);
      f.text("σ₁", cen + R, M * 0.06, c.main, "center"); f.text("σ₂", cen - R, M * 0.06, c.main, "center");
      // 회전한 요소
      v = QSim.view(c2, 0.5); const g = v.g, cx = v.W / 2, cy = v.H / 2, s = Math.min(v.W, v.H) * 0.22;
      g.save(); g.translate(cx, cy); g.rotate(-th);
      g.fillStyle = c.soft; g.strokeStyle = c.ink2; g.fillRect(-s / 2, -s / 2, s, s); g.strokeRect(-s / 2, -s / 2, s, s);
      const arr = (x1, y1, x2, y2, col) => { g.strokeStyle = g.fillStyle = col; g.lineWidth = 2; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); const a = Math.atan2(y2 - y1, x2 - x1); g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - 8 * Math.cos(a - 0.4), y2 - 8 * Math.sin(a - 0.4)); g.lineTo(x2 - 8 * Math.cos(a + 0.4), y2 - 8 * Math.sin(a + 0.4)); g.fill(); };
      const sc = (x) => Math.sign(x) * Math.min(1, Math.abs(x) / 100) * s * 0.9;
      const nx = sc(sxp), ny = sc(syp), tq = sc(txp) * 0.8;
      if (Math.abs(nx) > 2) { arr(s / 2 + (nx < 0 ? -nx : 0) + 4, 0, s / 2 + (nx > 0 ? nx : 0) + 4, 0, c.warn); arr(-s / 2 - (nx < 0 ? -nx : 0) - 4, 0, -s / 2 - (nx > 0 ? nx : 0) - 4, 0, c.warn); }
      if (Math.abs(ny) > 2) { arr(0, -s / 2 - (ny < 0 ? -ny : 0) - 4, 0, -s / 2 - (ny > 0 ? ny : 0) - 4, c.main); arr(0, s / 2 + (ny < 0 ? -ny : 0) + 4, 0, s / 2 + (ny > 0 ? ny : 0) + 4, c.main); }
      if (Math.abs(tq) > 2) { arr(s / 2 + 10, tq / 2, s / 2 + 10, -tq / 2, c.acc); arr(-s / 2 - 10, -tq / 2, -s / 2 - 10, tq / 2, c.acc); arr(-tq / 2, -s / 2 - 10, tq / 2, -s / 2 - 10, c.acc); arr(tq / 2, s / 2 + 10, -tq / 2, s / 2 + 10, c.acc); }
      g.restore();
      g.fillStyle = c.ink3; g.font = "12px " + getComputedStyle(document.documentElement).getPropertyValue("--f-mono");
      g.fillText(`요소를 ${S.val("th")}° 돌린 모습 (빨강 σx', 파랑 σy', 노랑 τx'y')`, 8, v.H - 8);
      S.out(`중심 C = (σx+σy)/2 = ${cen.toFixed(1)} MPa, 반지름 R = ${R.toFixed(1)} MPa\nθ = ${S.val("th")}°: σx' = ${sxp.toFixed(1)}, σy' = ${syp.toFixed(1)}, τx'y' = ${txp.toFixed(1)} MPa (원 위에서 2θ = ${2 * S.val("th")}° 돈 점)\n주응력 σ₁ = ${(cen + R).toFixed(1)}, σ₂ = ${(cen - R).toFixed(1)} MPa, 주방향 θp = ${thp.toFixed(1)}°, 최대 면내 전단 응력 = ${R.toFixed(1)} MPa`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
