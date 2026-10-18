/* 공통3 실습: 1차원 충돌과 반발 계수 (05-03) */
(() => {
  "use strict";
  const S = QSim.card("lab-c3-collision"); if (!S) return;
  const cv = S.$("canvas"), W = 0.8, TR = 12;
  let x = [2, 7], u = [0, 0], hit = false, before = null, after = null;
  const params = () => ({ m: [S.val("m1"), S.val("m2")], v: [S.val("v1"), S.val("v2")], e: S.val("e") });
  const reset = () => { const p = params(); x = [2, 7]; u = p.v.slice(); hit = false; before = p; after = null; };
  const P = (m, v) => m[0] * v[0] + m[1] * v[1], K = (m, v) => 0.5 * m[0] * v[0] ** 2 + 0.5 * m[1] * v[1] ** 2;
  function draw() {
    const C = QSim.col(), v = QSim.view(cv, 0.3), p = params();
    const f = QSim.frame(v, { x0: 0, x1: TR, y0: -0.6, y1: 1.6, pad: 10 });
    f.path([[0, 0], [TR, 0]], C.ink3, 2);
    const g = v.g;
    [0, 1].forEach((i) => {
      const h = 0.35 + 0.25 * Math.cbrt(p.m[i]);
      g.fillStyle = i ? C.acc : C.main; g.fillRect(f.X(x[i]), f.Y(h), f.X(x[i] + W) - f.X(x[i]), f.Y(0) - f.Y(h));
      f.text(`${p.m[i]} kg`, x[i] + W / 2, h + 0.12, C.ink2, "center");
      f.arrow(x[i] + W / 2, -0.3, u[i] * 0.35, 0, i ? C.acc : C.main);
    });
    const m = p.m, v0 = before ? before.v : p.v;
    let s = `충돌 전: 운동량 ${P(m, v0).toFixed(2)} kg·m/s, 운동 에너지 ${K(m, v0).toFixed(2)} J`;
    if (after) {
      const lost = K(m, v0) - K(m, after);
      s += `\n충돌 후: v₁' = ${after[0].toFixed(2)}, v₂' = ${after[1].toFixed(2)} m/s\n         운동량 ${P(m, after).toFixed(2)} kg·m/s, 운동 에너지 ${K(m, after).toFixed(2)} J (잃은 양 ${lost.toFixed(2)} J, ${(100 * lost / Math.max(1e-9, K(m, v0))).toFixed(0)}%)`;
    } else if (v0[0] <= v0[1]) s += "\n왼쪽 수레가 오른쪽 수레보다 빠르지 않아 만나지 않습니다.";
    S.out(s);
  }
  const L = QSim.loop((dt) => {
    const p = params();
    for (let k = 0; k < 4; k++) {
      const h = dt / 4; x[0] += u[0] * h; x[1] += u[1] * h;
      if (!hit && x[1] - x[0] <= W && u[0] > u[1]) {
        const m = p.m, e = p.e, Pt = P(m, u), d = u[0] - u[1];
        const a = [(Pt - m[1] * e * d) / (m[0] + m[1]), (Pt + m[0] * e * d) / (m[0] + m[1])];
        u = a; after = a.slice(); hit = true; x[0] = x[1] - W;
      }
    }
    draw();
    if (x[0] < -1 || x[1] > TR + 1 || (x[0] + W < 0 && x[1] + W < 0) || (x[0] > TR && x[1] > TR)) return false;
    if (Math.abs(u[0]) < 1e-9 && Math.abs(u[1]) < 1e-9) return false;
  }).watch(S.root);
  const setBtn = QSim.playButton(S.$(".play"), L, () => { if (hit || x[1] > TR || x[0] < 0) reset(); });
  S.on(() => { L.stop(); setBtn(); reset(); draw(); });
  QSim.redrawOn(draw); reset(); draw();
})();
