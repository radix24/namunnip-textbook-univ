/* 공통4 실습: 회전하는 코일의 유도 기전력 (07-01) */
(() => {
  "use strict";
  const S = QSim.card("lab-c4-generator"); if (!S) return;
  const [c1, c2] = S.$$("canvas");
  let t = 0, hist = [];
  const P = () => ({ N: S.val("N"), B: S.val("B"), A: S.val("A") * 1e-4, f: S.val("f") });
  function draw() {
    const C = QSim.col(), p = P(), w = 2 * Math.PI * p.f, th = w * t;
    // 코일 모습: 위에서 본 각, 옆에서 본 투영
    let v = QSim.view(c1, 0.42), fr = QSim.frame(v, { x0: -2.4, x1: 2.4, y0: -1, y1: 1, equal: true, pad: 4 });
    for (let y = -0.8; y <= 0.81; y += 0.4) fr.arrow(-2.3, y, 4.5, 0, C.rule);
    fr.text("B", 2.15, 0.88, C.ink3);
    const hw = 0.9 * Math.abs(Math.cos(th)) + 0.02, g = v.g;
    g.strokeStyle = C.main; g.lineWidth = 3; g.strokeRect(fr.X(-hw), fr.Y(0.7), fr.X(hw) - fr.X(-hw), fr.Y(-0.7) - fr.Y(0.7));
    fr.text(`θ = ${((th * 180 / Math.PI) % 360).toFixed(0)}°`, -2.3, -0.95, C.ink2);
    // 그래프
    const Phi = p.B * p.A * Math.cos(th), emf = p.N * p.B * p.A * w * Math.sin(th), emax = p.N * p.B * p.A * w;
    v = QSim.view(c2, 0.45); const T = 1 / p.f;
    fr = QSim.frame(v, { x0: Math.max(0, t - 2 * T), x1: Math.max(2 * T, t), y0: -1.15, y1: 1.15, xl: "t (s)" }); fr.axes();
    fr.path(hist.map((h) => [h[0], h[1]]), C.ink3, 2, [5, 3]);
    fr.path(hist.map((h) => [h[0], h[2]]), C.acc, 2.5);
    S.out(`최대 기전력 NBAω = ${emax.toPrecision(3)} V (ω = 2πf = ${w.toFixed(2)} rad/s)\n지금 선속 Φ = BA cosθ = ${(Phi * 1e3).toPrecision(3)} mWb, 기전력 ε = NBAω sinθ = ${emf.toPrecision(3)} V\n그래프: 회색 점선 Φ/Φmax, 주황 ε/εmax. 선속이 가장 빨리 변할 때(코일이 B와 나란할 때) ε가 최대`);
    return { Phi: Phi / (p.B * p.A), emf: emf / emax };
  }
  const L = QSim.loop((dt) => { t += dt; const p = P(), th = 2 * Math.PI * p.f * t; hist.push([t, Math.cos(th), Math.sin(th)]); if (hist.length > 1500) hist.shift(); draw(); }).watch(S.root);
  QSim.playButton(S.$(".play"), L);
  S.on(() => { hist = []; t = 0; if (!L.running) draw(); });
  QSim.redrawOn(draw); draw();
})();
