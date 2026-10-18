/* 기계15 기계시스템제어: 질량-스프링-감쇠기의 PID 위치 제어 (02-02, 04-01) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-pid"); if (!S) return;
  const [c1, c2] = S.$$("canvas"), m = 1, cc = 1, k = 10, Tend = 6;
  // 미분은 오차 대신 측정값에 걸어 계단 입력 순간의 충격을 피한다: u = Kp e + Ki ∫e − Kd ẋ
  function sim() {
    const Kp = S.val("kp"), Ki = S.val("ki"), Kd = S.val("kd"), h = 0.002;
    let y = [0, 0, 0], t = 0; const out = [[0, 0]];
    const f = (_, s) => { const e = 1 - s[0]; return [s[1], (Kp * e + Ki * s[2] - Kd * s[1] - cc * s[1] - k * s[0]) / m, e]; };
    while (t < Tend - 1e-9) { y = QSim.rk4(f, t, y, h); t += h; out.push([t, y[0]]); if (!isFinite(y[0]) || Math.abs(y[0]) > 1e6) break; }
    return out;
  }
  // 폐루프 특성방정식 s³ + (c+Kd)s² + (k+Kp)s + Ki = 0 (Ki = 0이면 2차)의 근
  function poles() {
    const Kp = S.val("kp"), Ki = S.val("ki"), Kd = S.val("kd"), a1 = (cc + Kd) / m, a2 = (k + Kp) / m, a3 = Ki / m;
    const cx = (re, im) => ({ re, im }), mul = (p, q) => cx(p.re * q.re - p.im * q.im, p.re * q.im + p.im * q.re), sub = (p, q) => cx(p.re - q.re, p.im - q.im), div = (p, q) => { const d = q.re * q.re + q.im * q.im; return cx((p.re * q.re + p.im * q.im) / d, (p.im * q.re - p.re * q.im) / d); };
    if (a3 === 0) { const D = a1 * a1 - 4 * a2; return D >= 0 ? [cx((-a1 + Math.sqrt(D)) / 2, 0), cx((-a1 - Math.sqrt(D)) / 2, 0)] : [cx(-a1 / 2, Math.sqrt(-D) / 2), cx(-a1 / 2, -Math.sqrt(-D) / 2)]; }
    const P = (z) => { let r = cx(1, 0); r = cx(r.re * z.re - r.im * z.im + a1, r.re * z.im + r.im * z.re); r = cx(r.re * z.re - r.im * z.im + a2, r.re * z.im + r.im * z.re); return cx(r.re * z.re - r.im * z.im + a3, r.re * z.im + r.im * z.re); };
    let z = [cx(0.4, 0.9), cx(-0.65, 0.72), cx(-0.9, -0.3)].map((q) => cx(q.re * (1 + a1), q.im * (1 + a1)));
    for (let it = 0; it < 200; it++) z = z.map((zi, i) => { let d = cx(1, 0); z.forEach((zj, j) => { if (j !== i) d = mul(d, sub(zi, zj)); }); return sub(zi, div(P(zi), d)); });
    return z;
  }
  function draw() {
    const c = QSim.col(), r = sim(), last = r[r.length - 1][1];
    const ymax = Math.max(1.6, Math.min(4, Math.max(...r.map((p) => p[1])) * 1.1)), ymin = Math.min(0, Math.max(-2, Math.min(...r.map((p) => p[1]))));
    let v = QSim.view(c1, 0.5), f = QSim.frame(v, { x0: 0, x1: Tend, y0: ymin, y1: ymax, xl: "t (s)", yl: "x (목표 1)", pad: 32 }); f.axes();
    
    // 지표는 최종값 기준: P·PD 제어는 정상값이 Kp/(k+Kp), 적분이 있으면 1
    const Kp0 = S.val("kp"), fin = S.val("ki") > 0 ? 1 : Kp0 / (k + Kp0);
    const peak = Math.max(...r.map((p) => p[1])), os = fin > 0 ? Math.max(0, (peak / fin - 1) * 100) : 0;
    const t10 = r.find((p) => p[1] >= 0.1 * fin), t90 = r.find((p) => p[1] >= 0.9 * fin);
    let ts = NaN; for (let i = r.length - 1; i >= 0; i--) if (Math.abs(r[i][1] - fin) > 0.02 * fin) { ts = i === r.length - 1 ? NaN : r[i + 1][0]; break; }
    if (r.every((p) => Math.abs(p[1] - fin) <= 0.02 * fin)) ts = 0;
    f.path([[0, fin * 1.02], [Tend, fin * 1.02]], c.rule, 1, [3, 3]); f.path([[0, fin * 0.98], [Tend, fin * 0.98]], c.rule, 1, [3, 3]);
    f.path([[0, 1], [Tend, 1]], c.ink3, 1.5, [6, 4]);
    f.path(r, c.main, 2.5);
    // 극점
    const ps = poles(), M = Math.max(4, ...ps.map((p) => Math.max(Math.abs(p.re), Math.abs(p.im)))) * 1.15;
    v = QSim.view(c2, 0.55); f = QSim.frame(v, { x0: -M, x1: M * 0.35, y0: -M, y1: M, equal: true, xl: "실수부", yl: "허수부", pad: 30 }); f.axes();
    ps.forEach((p) => { const G = v.g, X = f.X(p.re), Y = f.Y(p.im); G.strokeStyle = p.re < 0 ? c.main : c.warn; G.lineWidth = 2.5; G.beginPath(); G.moveTo(X - 6, Y - 6); G.lineTo(X + 6, Y + 6); G.moveTo(X + 6, Y - 6); G.lineTo(X - 6, Y + 6); G.stroke(); });
    const unstable = ps.some((p) => p.re > 1e-9);
    const Kp = S.val("kp"), Ki = S.val("ki");
    S.out(`${unstable ? "불안정: 오른쪽 반평면에 극점이 있습니다.\n" : ""}최종값 ${fin.toFixed(3)} 기준 최대 초과량 ${os.toFixed(1)}%, 상승 시간(10→90%) ${t10 && t90 ? (t90[0] - t10[0]).toFixed(2) + " s" : "-"}, 2% 정착 시간 ${isNaN(ts) ? "6 s 안에 정착 안 함" : ts.toFixed(2) + " s"}\n6 s에서 x = ${last.toFixed(3)}${Ki === 0 ? `   (이론 정상값 Kp/(k+Kp) = ${(Kp / (k + Kp)).toFixed(3)}, 정상상태 오차 ${(k / (k + Kp)).toFixed(3)})` : "   (적분 동작이 있으면 정상상태 오차 0)"}\n폐루프 극점: ${ps.map((p) => `${p.re.toFixed(2)}${Math.abs(p.im) > 1e-6 ? (p.im >= 0 ? " + " : " − ") + Math.abs(p.im).toFixed(2) + "j" : ""}`).join(",  ")}`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();
