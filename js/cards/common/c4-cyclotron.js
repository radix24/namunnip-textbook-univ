/* 공통4 실습: 자기장 속 대전 입자의 원운동 (06-01). 자기장은 화면 안쪽(×).
   v = +x, B = −z 이면 F = qv×B = +y 방향(양전하): 양전하는 시계 반대 방향, 음전하는 시계 방향으로 돈다 */
(() => {
  "use strict";
  const S = QSim.card("lab-c4-cyclotron"); if (!S) return;
  const cv = S.$("canvas");
  const PT = { p: { m: 1.673e-27, q: 1.602e-19, n: "양성자" }, e: { m: 9.109e-31, q: -1.602e-19, n: "전자" }, a: { m: 6.645e-27, q: 3.204e-19, n: "알파 입자" } };
  let ph = 0;
  const par = () => { const P = PT[S.val("pt")], v = S.val("v") * 1e5, B = S.val("B"); const r = (P.m * v) / (Math.abs(P.q) * B), T = (2 * Math.PI * P.m) / (Math.abs(P.q) * B); return { P, v, B, r, T }; };
  const fmt = (x, u) => { const p = [["n", 1e-9], ["μ", 1e-6], ["m", 1e-3], ["", 1]]; let s = p[0]; for (const q of p) if (Math.abs(x) >= q[1]) s = q; return (x / s[1]).toPrecision(3) + " " + s[0] + u; };
  function draw() {
    const C = QSim.col(), v = QSim.view(cv, 0.7), o = par(), two = S.val("two"), s = o.P.q > 0 ? 1 : -1;
    const D = 2 * o.r * (two ? 2 : 1);
    const y0 = s > 0 ? -0.12 * D : -1.12 * D, y1 = s > 0 ? 1.12 * D : 0.12 * D;
    const f = QSim.frame(v, { x0: -0.75 * D, x1: 0.75 * D, y0, y1, equal: true, pad: 4 });
    const g = v.g; g.fillStyle = C.ink3; g.font = "11px sans-serif"; g.textAlign = "center";
    for (let i = 0; i <= 12; i++) for (let j = 0; j <= 8; j++) g.fillText("×", f.X(-0.75 * D + (i * 1.5 * D) / 12), f.Y(y0 + (j * (y1 - y0)) / 8) + 4);
    const orbit = (r, col, dash) => {
      const pts = []; for (let k = 0; k <= 120; k++) { const a = (2 * Math.PI * k) / 120; pts.push([r * Math.sin(a), s * (r - r * Math.cos(a))]); }
      f.path(pts, col, 2, dash);
      const a = ph, px = r * Math.sin(a), py = s * (r - r * Math.cos(a));
      f.dot(px, py, col, 6);
      f.arrow(px, py, Math.cos(a) * r * 0.4, s * Math.sin(a) * r * 0.4, col);
      f.arrow(px, py, -px * 0.3, (s * r - py) * 0.3, C.warn);
    };
    orbit(o.r, C.main);
    if (two) orbit(2 * o.r, C.acc, [5, 4]);
    f.dot(0, 0, C.ink, 3);
    S.out(`${o.P.n}, 속력 ${S.val("v")}×10⁵ m/s, B = ${o.B.toFixed(2)} T (화면 안쪽)\n반지름 r = mv/|q|B = ${fmt(o.r, "m")}   주기 T = 2πm/|q|B = ${fmt(o.T, "s")}   진동수 ${(1 / o.T / 1e6).toPrecision(3)} MHz` +
      (two ? `\n주황(속력 2배): 반지름 ${fmt(2 * o.r, "m")}, 주기는 같아 두 입자가 한 바퀴를 동시에 돈다` : "") +
      `\n빨간 화살표: 자기력(중심 방향) · 파란/주황 화살표: 속도 · 화면의 회전 빠르기는 실제와 다름`);
  }
  const L = QSim.loop((dt) => { ph += dt * 2 * Math.PI * 0.4; draw(); }).watch(S.root);
  QSim.playButton(S.$(".play"), L);
  S.on(() => { if (!L.running) draw(); });
  QSim.redrawOn(draw); draw();
  if (!QSim.reduce) { L.start(); S.$(".play").textContent = "멈춤"; }
})();
