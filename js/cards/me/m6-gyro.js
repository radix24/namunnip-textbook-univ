/* 기계6 동역학 6단원: 축 한 끝을 매단 회전 바퀴의 정상 세차 (06-02) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-gyro"); if (!S) return;
  const [cv] = S.$$("canvas"), [play] = S.$$(".play");
  const g = 9.81, m = 2, r = 0.3, Is = m * r * r; // 자전거 바퀴(고리로 근사)
  let phi = 0, spinAng = 0;
  // 사선 투영: 연직 z, 수평 (x, y)
  const P = (x, y, z) => [x + 0.45 * y, z + 0.3 * y];
  function draw() {
    const c = QSim.col(), ws = S.val("ws"), d = S.val("d"), M = m * g * d, Om = ws > 0 ? M / (Is * ws) : Infinity, ratio = Om / ws;
    const vw = QSim.view(cv, 0.6), f = QSim.frame(vw, { x0: -0.8, x1: 0.8, y0: -0.55, y1: 0.55, equal: true, pad: 4 }), G = vw.g;
    // 줄과 매단 점(원점), 축 방향 (cosφ, sinφ, 0)
    const ux = Math.cos(phi), uy = Math.sin(phi), C = [d * ux, d * uy, 0];
    f.path([P(0, 0, 0.5), P(0, 0, 0)], c.ink3, 1.5);
    f.path([P(0, 0, 0), P(C[0], C[1], 0)], c.ink, 3);
    // 바퀴: 축에 수직인 원 (축 u, 수직 벡터 v=(-uy,ux,0), w=(0,0,1))
    const pts = []; for (let i = 0; i <= 60; i++) { const a = (i / 60) * 2 * Math.PI, ca = Math.cos(a) * r, sa = Math.sin(a) * r; pts.push(P(C[0] - uy * ca, C[1] + ux * ca, sa)); }
    f.path(pts, c.main, 3);
    const sp = [C[0] - uy * Math.cos(spinAng) * r, C[1] + ux * Math.cos(spinAng) * r, Math.sin(spinAng) * r];
    f.path([P(...C), P(...sp)], c.main, 1.5);
    // 벡터: H(축 방향), M(무게 모멘트, 수평이고 축에 수직), Ω(연직)
    const k = 0.25;
    const hEnd = P(C[0] + ux * k * 1.6, C[1] + uy * k * 1.6, 0), o = P(...C);
    f.arrow(o[0], o[1], hEnd[0] - o[0], hEnd[1] - o[1], c.acc, "H");
    const mEnd = P(C[0] - uy * k, C[1] + ux * k, 0); f.arrow(o[0], o[1], mEnd[0] - o[0], mEnd[1] - o[1], c.warn, "M");
    f.arrow(-0.2, 0.3, 0, 0.15, c.ink2, "Ω");
    const ok = ratio < 0.2 ? "스핀이 세차보다 충분히 빨라 근사가 맞음" : "스핀이 느려 근사가 맞지 않음 (실제로는 축이 크게 처지며 비틀거림)";
    S.out(`바퀴 2 kg, 반지름 0.3 m (I_s = ${Is.toFixed(2)} kg·m²), 스핀 ω_s = ${ws} rad/s, 매단 점에서 중심까지 ${d.toFixed(2)} m\n무게 모멘트 M = mgd = ${M.toFixed(2)} N·m\n세차 Ω = M/(I_s ω_s) = ${isFinite(Om) ? Om.toFixed(3) : "∞"} rad/s, 한 바퀴 ${isFinite(Om) ? ((2 * Math.PI) / Om).toFixed(1) : "-"} s, Ω/ω_s = ${isFinite(ratio) ? ratio.toFixed(3) : "-"}\n${ok}`);
    return Om;
  }
  const L = QSim.loop((dt) => { const Om = draw(); if (!isFinite(Om) || Om > 20) return false; phi += Om * dt; spinAng += Math.min(S.val("ws"), 30) * dt; }).watch(cv);
  QSim.playButton(play, L);
  S.on(draw); QSim.redrawOn(draw); draw();
})();
