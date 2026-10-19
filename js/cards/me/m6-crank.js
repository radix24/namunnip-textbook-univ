/* 기계6 동역학 4단원: 크랭크-슬라이더의 순간 중심, 피스톤 속도·가속도 (04-01, 04-02) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-crank"); if (!S) return;
  const [cv] = S.$$("canvas"), [play] = S.$$(".play");
  const deg = Math.PI / 180;
  let th = 60 * deg;
  // 위치 x_B(θ), 속도·가속도는 크랭크 각속도 ω 일정으로 θ에 대해 미분
  const geo = (t, r, l) => {
    const s = r * Math.sin(t), c = r * Math.cos(t), q = Math.sqrt(l * l - s * s);
    const xB = c + q, dx = -s - (s * c) / q; // dx_B/dθ
    const h = 1e-4, x = (tt) => r * Math.cos(tt) + Math.sqrt(l * l - (r * Math.sin(tt)) ** 2);
    const d2 = (x(t + h) - 2 * x(t) + x(t - h)) / (h * h);
    const phi = Math.asin(-s / l); // 로드가 수평과 이루는 각 (B에서 A를 볼 때 부호 반대)
    const dphi = (-c / l) / Math.cos(phi); // dφ/dθ
    return { xB, dx, d2, phi, dphi, A: [c, s] };
  };
  function draw() {
    const c = QSim.col(), r = S.val("r"), l = S.val("l"), w = S.val("w");
    if (!L.running) th = S.val("th") * deg;
    const G0 = geo(th, r, l), vB = G0.dx * w, aB = G0.d2 * w * w, wAB = G0.dphi * w;
    const vw = QSim.view(cv, 0.62), G = vw.g;
    // 위: 기구 그림, 아래: v_B(θ), a_B(θ)
    const f = QSim.frame(vw, { x0: -0.2, x1: 1.2, y0: -0.12, y1: 0.75, equal: true, pad: 4 });
    const [Ax, Ay] = G0.A, Bx = G0.xB;
    f.path([[-0.05, 0], [0.7, 0]], c.ink3, 1);
    f.path([[0, 0], [Ax, Ay]], c.main, 5); f.path([[Ax, Ay], [Bx, 0]], c.ink2, 4);
    G.fillStyle = "rgba(201,140,70,.7)"; G.fillRect(f.X(Bx - 0.03), f.Y(0.025), 0.06 * f.sx, 0.05 * f.sx);
    f.dot(0, 0, c.ink, 4); f.dot(Ax, Ay, c.ink, 4);
    // 순간 중심: 직선 OA 연장과 B의 연직선의 교점
    if (Math.abs(Ax) > 1e-6) { const icy = (Ay / Ax) * Bx; if (Math.abs(icy) < 0.7) { f.dot(Bx, icy, c.warn, 5); f.path([[0, 0], [Bx, icy]], c.warn, 1, [3, 3]); f.path([[Bx, 0], [Bx, icy]], c.warn, 1, [3, 3]); f.text("IC", Bx + 0.01, icy, c.warn); } }
    const sv = 0.008; f.arrow(Ax, Ay, -Ay * w * sv, Ax * w * sv, c.main, "v_A"); f.arrow(Bx, 0.05, vB * sv, 0, c.acc, "v_B");
    // 작은 그래프: 크랭크 한 바퀴 동안 v_B
    const ox = vw.W * 0.62, oy = vw.H * 0.08, gw = vw.W * 0.36, gh = vw.H * 0.34;
    const X = (d) => ox + (d / 360) * gw, Y = (v) => oy + gh / 2 - (v / (1.8 * r * w)) * (gh / 2);
    G.save(); G.strokeStyle = c.rule; G.strokeRect(ox, oy, gw, gh); G.beginPath(); G.moveTo(ox, Y(0)); G.lineTo(ox + gw, Y(0)); G.stroke();
    G.strokeStyle = c.acc; G.lineWidth = 2; G.beginPath();
    for (let d = 0; d <= 360; d += 2) { const v = geo(d * deg, r, l).dx * w; d ? G.lineTo(X(d), Y(v)) : G.moveTo(X(d), Y(v)); }
    G.stroke(); const dd = (((th / deg) % 360) + 360) % 360; G.fillStyle = c.warn; G.beginPath(); G.arc(X(dd), Y(vB), 4, 0, 7); G.fill();
    G.fillStyle = c.ink2; G.font = "11px monospace"; G.fillText("v_B (크랭크 한 바퀴)", ox + 4, oy + 12); G.restore();
    S.out(`크랭크 ${r} m, 로드 ${l} m (l/r = ${(l / r).toFixed(1)}), ω = ${w} rad/s, 크랭크 각 ${dd.toFixed(0)}°\n로드 각속도 ω_AB = ${Math.abs(wAB).toFixed(2)} rad/s (${wAB < 0 ? "시계" : "반시계"}), 피스톤 위치 x_B = ${Bx.toFixed(4)} m\n피스톤 속도 v_B = ${vB.toFixed(2)} m/s, 가속도 a_B = ${aB.toFixed(1)} m/s² (${(aB / 9.81).toFixed(1)} g)\n크랭크 끝 속도 rω = ${(r * w).toFixed(2)} m/s, 최대 피스톤 가속도(0°) ${(r * w * w * (1 + r / l)).toFixed(0)} m/s²`);
  }
  const L = QSim.loop((dt) => { th += S.val("w") * dt * 0.05; draw(); }).watch(cv);
  QSim.playButton(play, L);
  S.on(draw); QSim.redrawOn(draw); draw();
})();
