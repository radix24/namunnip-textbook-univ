/* 기계6 동역학 1단원: 곡선 경로 위의 법선-접선 가속도 (01-01) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-ntpath"); if (!S) return;
  const [cv] = S.$$("canvas");
  // 매개변수 곡선 p(u), u ∈ [0, 1]
  const PATH = {
    para: { name: "포물선 도로 y = x²/200", p: (u) => { const x = -80 + 160 * u; return [x, (x * x) / 200]; }, box: [-90, 90, -10, 40] },
    ell: { name: "타원 트랙 (반지름 60 m, 30 m)", p: (u) => [60 * Math.cos(2 * Math.PI * u), 30 * Math.sin(2 * Math.PI * u)], box: [-75, 75, -45, 45] },
    sine: { name: "물결 도로 y = 10 sin(x/20)", p: (u) => { const x = -100 + 200 * u; return [x, 10 * Math.sin(x / 20)]; }, box: [-105, 105, -40, 40] }
  };
  const h = 1e-4;
  const d1 = (P, u) => { const a = P(u - h), b = P(u + h); return [(b[0] - a[0]) / (2 * h), (b[1] - a[1]) / (2 * h)]; };
  const d2 = (P, u) => { const a = P(u - h), b = P(u), c = P(u + h); return [(a[0] - 2 * b[0] + c[0]) / (h * h), (a[1] - 2 * b[1] + c[1]) / (h * h)]; };
  function draw() {
    const c = QSim.col(), path = PATH[S.val("f")], u = S.val("u"), v = S.val("v"), at = S.val("at");
    const P = path.p, [x, y] = P(u), [xp, yp] = d1(P, u), [xpp, ypp] = d2(P, u), sp = Math.hypot(xp, yp);
    const kap = (xp * ypp - yp * xpp) / sp ** 3, rho = 1 / Math.abs(kap);
    const et = [xp / sp, yp / sp], en = kap >= 0 ? [-et[1], et[0]] : [et[1], -et[0]];
    const an = (v * v) / rho, a = Math.hypot(an, at);
    const [X0, X1, Y0, Y1] = path.box, vw = QSim.view(cv, 0.55), f = QSim.frame(vw, { x0: X0, x1: X1, y0: Y0, y1: Y1, equal: true, pad: 6 }), G = vw.g;
    const pts = []; for (let i = 0; i <= 400; i++) pts.push(P(i / 400)); f.path(pts, c.ink3, 3);
    // 접촉원(곡률원)
    if (rho <= 1e4) { const cx = x + en[0] * rho, cy = y + en[1] * rho; G.save(); G.strokeStyle = c.acc; G.setLineDash([4, 4]); G.beginPath(); G.arc(f.X(cx), f.Y(cy), rho * f.sx, 0, 7); G.stroke(); G.restore(); f.dot(cx, cy, c.acc, 3); }
    const sv = 1.5, sa = 6; // 화살표 축척: 속도 1 m/s → 1.5 m, 가속도 1 m/s² → 6 m
    f.arrow(x, y, et[0] * v * sv, et[1] * v * sv, c.main, "v");
    f.arrow(x, y, et[0] * at * sa, et[1] * at * sa, c.ink2, "a_t");
    f.arrow(x, y, en[0] * an * sa, en[1] * an * sa, c.ink2, "a_n");
    f.arrow(x, y, (et[0] * at + en[0] * an) * sa, (et[1] * at + en[1] * an) * sa, c.warn, "a");
    f.dot(x, y, c.ink, 5);
    const slip = a > 0.8 * 9.81 ? "\n가속도가 0.8g를 넘어 마른 노면에서도 미끄러진다 (마찰 한계 약 7.8 m/s²)" : "";
    S.out(`${path.name}, 위치 (${x.toFixed(1)}, ${y.toFixed(1)}) m\n곡률 반지름 ρ = ${rho > 1e4 ? "∞ (변곡점, 곡률원 없음)" : rho.toFixed(1) + " m (점선 원)"}\n속력 ${v} m/s, a_t = ${at.toFixed(1)} m/s², a_n = v²/ρ = ${an.toFixed(2)} m/s² → |a| = ${a.toFixed(2)} m/s² (${(a / 9.81).toFixed(2)} g)${slip}`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();
