/* 기계6 동역학 5단원: 경사면 구르기 경주 (05-02) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-roll"); if (!S) return;
  const [cv] = S.$$("canvas"), [play] = S.$$(".play");
  const g = 9.81, D = 2, R = 0.08; // 경사면 길이 2 m, 반지름 8 cm (결과는 반지름과 무관)
  const SH = [
    { name: "마찰 없는 상자", beta: 0, box: true },
    { name: "속이 찬 구", beta: 0.4 },
    { name: "원기둥", beta: 0.5 },
    { name: "속 빈 구", beta: 2 / 3 },
    { name: "고리", beta: 1 }
  ];
  let t = 0;
  function model(th, mu) {
    return SH.map((s) => {
      if (s.box) return { ...s, a: g * Math.sin(th), roll: false, slip: false, alpha: 0 };
      const need = (s.beta / (1 + s.beta)) * Math.tan(th);
      if (mu >= need) { const a = (g * Math.sin(th)) / (1 + s.beta); return { ...s, a, roll: true, need, alpha: a / R }; }
      // 미끄러지며 구름: 병진은 운동 마찰(μ로 둠)로 감속, 회전은 마찰 모멘트로 가속
      const a = g * (Math.sin(th) - mu * Math.cos(th)), alpha = (mu * g * Math.cos(th)) / (s.beta * R);
      return { ...s, a, roll: false, slip: true, need, alpha };
    });
  }
  function draw() {
    const c = QSim.col(), th = (S.val("th") * Math.PI) / 180, mu = S.val("mu"), M = model(th, mu);
    const vw = QSim.view(cv, 0.5), f = QSim.frame(vw, { x0: -0.6, x1: D + 0.15, y0: -0.2, y1: SH.length * 0.4, pad: 4 }), G = vw.g;
    f.path([[D, -0.1], [D, SH.length * 0.4 - 0.1]], c.warn, 2, [4, 3]);
    M.forEach((s, i) => {
      const y = (SH.length - 1 - i) * 0.4 + 0.1, tf = Math.sqrt((2 * D) / s.a), tt = Math.min(t, tf), x = 0.5 * s.a * tt * tt, ang = 0.5 * s.alpha * tt * tt;
      f.path([[0, y - 0.09], [D, y - 0.09]], c.rule, 1);
      f.text(s.name, -0.58, y - 0.03, c.ink2);
      const X = f.X(x), Y = f.Y(y), rp = Math.max(6, 0.07 * f.sx);
      if (s.box) { G.fillStyle = "rgba(201,140,70,.75)"; G.fillRect(X - rp, Y - rp, 2 * rp, 2 * rp); }
      else {
        G.strokeStyle = s.slip ? c.warn : c.main; G.lineWidth = s.beta === 1 ? 3 : 2; G.fillStyle = s.beta === 1 || s.beta === 2 / 3 ? "transparent" : "rgba(75,79,224,.25)";
        G.beginPath(); G.arc(X, Y, rp, 0, 7); G.fill(); G.stroke();
        G.beginPath(); G.moveTo(X, Y); G.lineTo(X + rp * Math.sin(ang), Y - rp * Math.cos(ang)); G.stroke();
      }
    });
    const lines = M.map((s) => `${s.name}: 가속도 ${s.a.toFixed(2)} m/s², 2 m 도착 ${Math.sqrt((2 * D) / s.a).toFixed(3)} s, 끝 속도 ${Math.sqrt(2 * s.a * D).toFixed(2)} m/s${s.box ? "" : s.roll ? ` (구름, 필요 μ ${s.need.toFixed(3)})` : ` (미끄러짐! 필요 μ ${s.need.toFixed(3)})`}`);
    S.out(`경사 ${S.val("th")}°, μ = ${mu.toFixed(2)}, 경사면 길이 2 m\n${lines.join("\n")}`);
    return t < 6;
  }
  const L = QSim.loop((dt) => { t += dt; return draw(); }).watch(cv);
  QSim.playButton(play, L, () => { t = 0; });
  S.$(".reset").addEventListener("click", () => { L.stop(); t = 0; draw(); });
  S.on(() => { t = 0; draw(); }); QSim.redrawOn(draw); draw();
})();
