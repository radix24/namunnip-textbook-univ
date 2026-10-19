/* 기계2 고체역학 6단원: 굽힘·비틀림·축하중을 함께 받는 막대의 한 점 (06-03) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-combined"); if (!S) return;
  const [c1, c2] = S.$$("canvas");
  // 고정단 단면의 둘레 각 φ(0 = 맨 위)에서의 응력. 단위 N, mm, MPa
  function stressAt(phi) {
    const d = S.val("d"), r = d / 2, A = Math.PI * r * r, I = Math.PI * d ** 4 / 64, J = 2 * I;
    const P = S.val("P") * 1000, L = S.val("L"), a = S.val("a"), N = S.val("N") * 1000;
    const M = P * L, T = P * a, V = P;
    const y = r * Math.cos(phi), s = Math.sin(phi);
    const sx = N / A + (M * y) / I; // 외팔보: 위(y > 0)가 인장
    // 비틀림 전단 + 전단력에 의한 전단(둘레의 접선 방향, 근사 4V/3A·(1 - y²/r²)). 한쪽 옆에서는 더해지고 반대쪽에서는 빼진다
    const tau = (T * r) / J + Math.sign(s) * (4 * V / (3 * A)) * (1 - (y * y) / (r * r));
    const C = sx / 2, R = Math.hypot(sx / 2, tau);
    return { sx, tau, s1: C + R, s2: C - R, R, M, T, V, N, A, I, J };
  }
  function draw() {
    const c = QSim.col(), phi = (S.val("phi") * Math.PI) / 180, st = stressAt(phi);
    // 단면과 점
    let v = QSim.view(c1, 0.42), g = v.g, W = v.W, H = v.H;
    const cx = W * 0.22, cy = H / 2, R0 = H * 0.36;
    g.fillStyle = c.soft; g.strokeStyle = c.ink2; g.beginPath(); g.arc(cx, cy, R0, 0, 7); g.fill(); g.stroke();
    g.setLineDash([4, 3]); g.strokeStyle = c.ink3; g.beginPath(); g.moveTo(cx - R0 - 6, cy); g.lineTo(cx + R0 + 6, cy); g.stroke(); g.setLineDash([]);
    const px = cx + R0 * Math.sin(phi), py = cy - R0 * Math.cos(phi);
    g.fillStyle = c.warn; g.beginPath(); g.arc(px, py, 6, 0, 7); g.fill();
    g.fillStyle = c.ink3; g.font = "11px " + getComputedStyle(document.documentElement).getPropertyValue("--f-mono");
    g.fillText("고정단 단면 (위 = 인장 쪽)", 8, H - 6);
    // 응력 요소
    const ex = W * 0.62, ey = H / 2, es = H * 0.22, sc = es * 0.9 / Math.max(20, Math.abs(st.sx), Math.abs(st.tau));
    g.fillStyle = c.soft; g.strokeStyle = c.ink2; g.fillRect(ex - es / 2, ey - es / 2, es, es); g.strokeRect(ex - es / 2, ey - es / 2, es, es);
    const arr = (x1, y1, x2, y2, col) => { g.strokeStyle = g.fillStyle = col; g.lineWidth = 2; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); const a = Math.atan2(y2 - y1, x2 - x1); g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - 7 * Math.cos(a - 0.4), y2 - 7 * Math.sin(a - 0.4)); g.lineTo(x2 - 7 * Math.cos(a + 0.4), y2 - 7 * Math.sin(a + 0.4)); g.fill(); g.lineWidth = 1; };
    const n = st.sx * sc, t = st.tau * sc;
    if (Math.abs(n) > 2) { const o = es / 2 + 4; arr(ex + o + (n < 0 ? -n : 0), ey, ex + o + (n > 0 ? n : 0), ey, c.main); arr(ex - o - (n < 0 ? -n : 0), ey, ex - o - (n > 0 ? n : 0), ey, c.main); }
    if (Math.abs(t) > 2) { const o = es / 2 + 9; arr(ex + o, ey + t / 2, ex + o, ey - t / 2, c.acc); arr(ex - o, ey - t / 2, ex - o, ey + t / 2, c.acc); arr(ex - t / 2, ey - o, ex + t / 2, ey - o, c.acc); arr(ex + t / 2, ey + o, ex - t / 2, ey + o, c.acc); }
    g.fillStyle = c.ink3; g.fillText("점의 응력 요소 (x = 막대 축)", W * 0.45, H - 6);
    // Mohr 원
    const M = Math.max(20, Math.abs(st.s1), Math.abs(st.s2)) * 1.15;
    v = QSim.view(c2, 0.5); const f = QSim.frame(v, { x0: -M, x1: M, y0: -M * 0.5 / 1, y1: M * 0.5, equal: true, xl: "σ (MPa)", yl: "τ (아래가 +)", pad: 30 }); f.axes();
    const pts = []; for (let i = 0; i <= 100; i++) { const q = (i / 100) * 2 * Math.PI; pts.push([st.sx / 2 + st.R * Math.cos(q), st.R * Math.sin(q)]); }
    f.path(pts, c.main, 2); f.path([[st.sx, -st.tau], [0, st.tau]], c.ink3, 1, [4, 3]);
    f.dot(st.s1, 0, c.warn, 4); f.dot(st.s2, 0, c.warn, 4); f.dot(st.sx, -st.tau, c.acc, 4);
    // 둘레 전체에서 가장 위험한 점
    let worst = { s1: -1e9, at: 0 }, worstT = { R: -1, at: 0 };
    for (let k = 0; k < 360; k++) { const q = stressAt((k * Math.PI) / 180); if (q.s1 > worst.s1) worst = { s1: q.s1, at: k }; if (q.R > worstT.R) worstT = { R: q.R, at: k }; }
    S.out(`고정단 내력: M = ${(st.M / 1e6).toFixed(3)} kN·m, T = ${(st.T / 1e6).toFixed(3)} kN·m, V = ${(st.V / 1000).toFixed(2)} kN, N = ${(st.N / 1000).toFixed(1)} kN\nφ = ${S.val("phi")}°의 점: σx = ${st.sx.toFixed(1)} MPa, τ = ${st.tau.toFixed(1)} MPa → σ₁ = ${st.s1.toFixed(1)}, σ₂ = ${st.s2.toFixed(1)}, 최대 면내 전단 ${st.R.toFixed(1)} MPa\n둘레 전체에서 σ₁ 최대: φ = ${worst.at}°에서 ${worst.s1.toFixed(1)} MPa, 최대 전단: φ = ${worstT.at}°에서 ${worstT.R.toFixed(1)} MPa`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();
