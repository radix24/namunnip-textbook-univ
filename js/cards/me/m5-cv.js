/* 기계5 유체역학 4단원: 검사체적의 질량 수지 — 채우며 빼는 탱크 (04-01) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-cvtank"); if (!S) return;
  const [cv] = S.$$("canvas"), [play] = S.$$(".play");
  const g = 9.81, A = 1, TEND = 2000;
  let t = 0;
  function sim(Q, a, h0) {
    const pts = []; let h = h0;
    for (let i = 0, dt = 1; i <= TEND; i++) { pts.push([i, h]); const k = (Q - a * Math.sqrt(2 * g * Math.max(h, 0))) / A; h = Math.max(0, h + k * dt); }
    return pts;
  }
  function draw() {
    const c = QSim.col(), Q = S.val("Q") / 1000, a = S.val("a") / 1e4, h0 = S.val("h0");
    const pts = sim(Q, a, h0), heq = (Q / a) ** 2 / (2 * g), i = Math.min(Math.floor(t), TEND), h = pts[i][1];
    const qout = a * Math.sqrt(2 * g * h), dhdt = (Q - qout) / A;
    const v = QSim.view(cv, 0.5), G = v.g, W = v.W, H = v.H;
    // 왼쪽: 탱크 그림
    const tx = 30, tw = W * 0.22, ty = 20, th = H - 50, hmax = Math.max(6, heq * 1.2, h0 * 1.2), Y = (z) => ty + th - (z / hmax) * th;
    G.fillStyle = "rgba(75,79,224,.25)"; G.fillRect(tx, Y(h), tw, Y(0) - Y(h));
    G.strokeStyle = c.ink2; G.lineWidth = 2; G.beginPath(); G.moveTo(tx, ty); G.lineTo(tx, Y(0)); G.lineTo(tx + tw, Y(0)); G.lineTo(tx + tw, ty); G.stroke();
    G.setLineDash([5, 4]); G.strokeStyle = c.warn; G.strokeRect(tx - 6, Y(h) - 6, tw + 12, Y(0) - Y(h) + 12); G.setLineDash([]);
    G.strokeStyle = c.acc; G.beginPath(); G.moveTo(tx, Y(heq)); G.lineTo(tx + tw, Y(heq)); G.stroke();
    G.fillStyle = c.ink2; G.font = "11px sans-serif"; G.fillText("검사체적 (점선)", tx, H - 6);
    // 오른쪽: h(t)
    const f = QSim.frame(v, { x0: -TEND * 0.55, x1: TEND, y0: 0, y1: hmax, xl: "t (s)", yl: "h (m)", pad: 30 });
    G.save(); G.beginPath(); G.rect(W * 0.32, 0, W, H); G.clip();
    f.axes(); f.path([[0, heq], [TEND, heq]], c.acc, 1.5, [5, 4]); f.path(pts, c.main, 2.5); f.dot(i, h, c.warn, 5);
    G.restore();
    S.out(`넓이 1 m² 탱크, 유입 ${(Q * 1000).toFixed(1)} L/s, 바닥 구멍 ${(a * 1e4).toFixed(0)} cm², 처음 수위 ${h0.toFixed(1)} m\nt = ${i} s: 수위 ${h.toFixed(3)} m, 유출 a√(2gh) = ${(qout * 1000).toFixed(2)} L/s\n질량 수지 A dh/dt = 유입 − 유출 = ${((Q - qout) * 1000).toFixed(2)} L/s → 수위 ${dhdt > 1e-6 ? "오름" : dhdt < -1e-6 ? "내림" : "일정"}\n평형 수위 (유입 = 유출) h = (Q/a)²/(2g) = ${heq.toFixed(2)} m (초록)`);
    return t < TEND;
  }
  const L = QSim.loop((dt) => { t += dt * 100; return draw(); }).watch(cv);
  QSim.playButton(play, L, () => { t = 0; });
  S.on(() => { t = 0; draw(); }); QSim.redrawOn(draw); draw();
})();
