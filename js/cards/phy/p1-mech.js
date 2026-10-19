/* 물리1 실습 카드 묶음: 공기 저항 궤적, 퍼텐셜 그림, 공명 곡선, 궤도와 유효 퍼텐셜 */
(() => {
  "use strict";
  const C = () => QSim.col();

  /* 1. 저항 없음, 선형, 이차 저항의 포물선 운동 (02-02) */
  (() => {
    const S = QSim.card("lab-p1-drag"); if (!S) return;
    const cv = S.$("canvas"), g = 9.8, beta = 1.6e-4, gam = 0.25;
    const BALL = { pp: ["탁구공", 0.0027, 0.040], bb: ["야구공", 0.145, 0.074], sp: ["포환", 4.0, 0.110], drop: ["기름방울 (지름 20 μm)", 4.2e-12, 2e-5] };
    function fly(v0, th, m, D, lin, quad) {
      const b = lin ? beta * D : 0, c = quad ? gam * D * D : 0;
      let s = [0, 0, v0 * Math.cos(th), v0 * Math.sin(th)], t = 0; const pts = [[0, 0]], h = Math.max(1e-4, Math.min(0.01, (2 * v0 * Math.sin(th) / g) / 400));
      const f = (_, y) => { const v = Math.hypot(y[2], y[3]), k = (b + c * v) / m; return [y[2], y[3], -k * y[2], -g - k * y[3]]; };
      let ymax = 0;
      while (t < 200) { const n = QSim.rk4(f, t, s, h); t += h; if (n[1] < 0) { const r = s[1] / (s[1] - n[1]); pts.push([s[0] + r * (n[0] - s[0]), 0]); return { pts, R: s[0] + r * (n[0] - s[0]), H: ymax, T: t - h + r * h }; } s = n; ymax = Math.max(ymax, s[1]); if (pts.length < 4000) pts.push([s[0], s[1]]); }
      return { pts, R: s[0], H: ymax, T: t };
    }
    function draw() {
      const c = C(), [nm, m, D] = BALL[S.val("ball")], v0 = S.val("v0"), th = S.val("th") * Math.PI / 180;
      const a = fly(v0, th, m, D, false, false), l = fly(v0, th, m, D, true, false), q = fly(v0, th, m, D, true, true);
      const X = Math.max(a.R, 1e-9) * 1.05, Y = Math.max(a.H, X * 0.2) * 1.15;
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: X, y0: 0, y1: Y, xl: "x (m)", yl: "y (m)" }); f.axes();
      f.path(a.pts, c.ink3, 1.5, [5, 4]); f.path(l.pts, c.acc, 2); f.path(q.pts, c.main, 2.5);
      const vtl = m * g / (beta * D), vtq = Math.sqrt(m * g / (gam * D * D)), ratio = 1.6e3 * D * v0;
      S.out(`${nm}: m = ${m < 0.01 ? m.toExponential(2) : m} kg, D = ${D} m, 처음 속력 ${v0} m/s\n이차/선형 저항 비 (처음 속력에서) ≈ ${ratio < 0.01 ? ratio.toExponential(1) : ratio.toFixed(1)}, 종단 속력: 선형만 ${vtl.toPrecision(3)}, 이차만 ${vtq.toPrecision(3)} m/s\n수평 거리: 진공 ${a.R.toPrecision(3)} (회색), 선형만 ${l.R.toPrecision(3)} (주황), 선형+이차 ${q.R.toPrecision(3)} m (파랑)\n최고 높이 진공 ${a.H.toPrecision(3)}, 실제 ${q.H.toPrecision(3)} m, 비행 시간 ${q.T.toPrecision(3)} s`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 1차원 퍼텐셜 그림과 되돌이점 (03-03) */
  (() => {
    const S = QSim.card("lab-p1-potential"); if (!S) return;
    const [cvU, cvX] = S.$$("canvas");
    const P = {
      dw: { n: "U = x⁴ − 2x²", U: (x) => x ** 4 - 2 * x * x, x0: -2, x1: 2, y0: -1.3, y1: 3, Emin: -1, Emax: 2.5, start: 1 },
      pend: { n: "진자 U = 1 − cos x", U: (x) => 1 - Math.cos(x), x0: -Math.PI * 1.2, x1: Math.PI * 1.2, y0: -0.2, y1: 2.6, Emin: 0, Emax: 2.4, start: 0 },
      lj: { n: "레너드-존스 U = 1/x¹² − 2/x⁶", U: (x) => x ** -12 - 2 * x ** -6, x0: 0.85, x1: 3, y0: -1.2, y1: 1, Emin: -1, Emax: 0.8, start: 1 }
    };
    let st = null;
    function turning(p, E) {
      const N = 4000, xs = []; let prev = p.U(p.x0) - E;
      for (let i = 1; i <= N; i++) { const x = p.x0 + (p.x1 - p.x0) * i / N, d = p.U(x) - E; if (prev * d < 0) xs.push(x - (p.x1 - p.x0) / N * d / (d - prev)); prev = d; }
      return xs;
    }
    function reset() {
      const p = P[S.val("pot")], E = p.Emin + (p.Emax - p.Emin) * S.val("e");
      let x = p.start; const tp = turning(p, E);
      const L = tp.filter((t) => t <= x).pop(), R = tp.filter((t) => t >= x)[0];
      if (L !== undefined && R !== undefined) x = (L + R) / 2; else if (L !== undefined) x = L + 1e-3; else if (R !== undefined) x = R - 1e-3;
      if (p.U(x) > E) { const xs = []; for (let i = 0; i <= 400; i++) xs.push(p.x0 + (p.x1 - p.x0) * i / 400); x = xs.reduce((a, b) => (p.U(b) < p.U(a) ? b : a)); }
      st = { x, v: Math.sqrt(Math.max(0, 2 * (E - p.U(x)))), t: 0, hist: [] };
      draw();
    }
    function step(dt) {
      const p = P[S.val("pot")], F = (x) => -(p.U(x + 1e-5) - p.U(x - 1e-5)) / 2e-5;
      for (let i = 0; i < 20; i++) { const h = dt / 20 * 1.5; [st.x, st.v] = QSim.rk4((_, y) => [y[1], F(y[0])], 0, [st.x, st.v], h); st.t += h; }
      st.hist.push([st.t, st.x]); if (st.hist.length > 1500) st.hist.shift();
      if (st.x > p.x1 + 1 || st.x < p.x0 - 1) return false;
      draw();
    }
    function draw() {
      const c = C(), p = P[S.val("pot")], E = p.Emin + (p.Emax - p.Emin) * S.val("e"), tp = turning(p, E);
      const v = QSim.view(cvU, 0.5), f = QSim.frame(v, { x0: p.x0, x1: p.x1, y0: p.y0, y1: p.y1, xl: "x", yl: "U" }); f.axes();
      const g = v.g; g.fillStyle = "rgba(90,100,230,0.12)";
      for (let i = 0; i < 300; i++) { const x = p.x0 + (p.x1 - p.x0) * i / 300; if (p.U(x) <= E) g.fillRect(f.X(x), f.Y(E), f.sx * (p.x1 - p.x0) / 300 + 1, f.Y(Math.max(p.U(x), p.y0)) - f.Y(E)); }
      f.fn((x) => Math.min(p.U(x), p.y1 + 1), c.main, 2.5);
      f.path([[p.x0, E], [p.x1, E]], c.warn, 1.5, [6, 4]);
      tp.forEach((x) => f.dot(x, E, c.acc, 5));
      if (st) f.dot(st.x, p.U(st.x), c.warn, 6);
      const vx = QSim.view(cvX, 0.3);
      if (st && st.hist.length > 1) { const t0 = st.hist[0][0], t1 = Math.max(t0 + 1, st.hist[st.hist.length - 1][0]); const fx = QSim.frame(vx, { x0: t0, x1: t1, y0: p.x0, y1: p.x1, xl: "t", yl: "x" }); fx.axes({ noGrid: true }); fx.path(st.hist, c.main, 2); }
      else { const fx = QSim.frame(vx, { x0: 0, x1: 1, y0: p.x0, y1: p.x1, xl: "t", yl: "x" }); fx.axes({ noGrid: true }); vx.g.fillStyle = c.ink3; vx.g.font = "12px sans-serif"; vx.g.fillText("재생을 누르면 위치 x(t)가 여기에 그려집니다", 40, vx.H / 2 - 6); }
      let per = "";
      if (st) { const L = tp.filter((t) => t <= st.x + 1e-9).pop(), R = tp.filter((t) => t >= st.x - 1e-9)[0];
        if (L !== undefined && R !== undefined && R - L > 1e-6) { let s = 0; const N = 2000; for (let i = 0; i < N; i++) { const th = Math.PI * (i + 0.5) / N, x = (L + R) / 2 - (R - L) / 2 * Math.cos(th), dx = (R - L) / 2 * Math.sin(th) * Math.PI / N; s += dx / Math.sqrt(Math.max(1e-12, 2 * (E - p.U(x)))); } per = `주기 2∫dx/v = ${(2 * s).toFixed(3)} (질량 1)`; }
        else per = "한쪽이 열려 있어 되돌아오지 않는다"; }
      S.out(`${p.n}, E = ${E.toFixed(3)}\n되돌이점: ${tp.length ? tp.map((x) => x.toFixed(3)).join(", ") : "없음"} (주황 점), 칠한 곳이 운동 가능 영역\n${per}`);
    }
    const L = QSim.loop(step).watch(S.root);
    QSim.playButton(S.$(".play"), L, () => { if (!st || st.x > P[S.val("pot")].x1 + 1 || st.x < P[S.val("pot")].x0 - 1) reset(); });
    S.on(() => { L.stop(); S.$(".play").textContent = "재생"; reset(); }); QSim.redrawOn(draw); reset();
  })();

  /* 3. 강제 진동의 진폭·위상 곡선과 과도 응답 (04-03, 04-04) */
  (() => {
    const S = QSim.card("lab-p1-resonance"); if (!S) return;
    const [cvA, cvT] = S.$$("canvas");
    const amp = (w, b) => 1 / Math.sqrt((1 - w * w) ** 2 + 4 * b * b * w * w), ph = (w, b) => Math.atan2(2 * b * w, 1 - w * w);
    function draw() {
      const c = C(), b = S.val("b"), w = S.val("w"), top = Math.min(30, amp(Math.sqrt(Math.max(0, 1 - 2 * b * b)), b) * 1.15);
      const va = QSim.view(cvA, 0.42), f = QSim.frame(va, { x0: 0, x1: 2.5, y0: 0, y1: Math.max(1.5, top), xl: "ω/ω₀", yl: "A·ω₀²/f₀" }); f.axes();
      f.fn((x) => amp(x, b), c.main, 2.5);
      f.fn((x) => ph(x, b) / Math.PI * Math.max(1.5, top), c.acc, 1.5, [5, 4]);
      f.dot(w, amp(w, b), c.warn, 6);
      if (b < 0.5) { const half = amp(1, b) / Math.SQRT2; f.path([[1 - b, half], [1 + b, half]], c.warn, 1.5); }
      const vt = QSim.view(cvT, 0.32); const T = 60;
      let s = [0, 0]; const pts = [[0, 0]], h = 0.02;
      for (let t = 0; t < T; t += h) { s = QSim.rk4((tt, y) => [y[1], Math.cos(w * tt) - 2 * b * y[1] - y[0]], t, s, h); pts.push([t + h, s[0]]); }
      const ym = Math.max(1, ...pts.map((p) => Math.abs(p[1]))) * 1.1;
      const ft = QSim.frame(vt, { x0: 0, x1: T, y0: -ym, y1: ym, xl: "ω₀t", yl: "x" }); ft.axes({ noGrid: true });
      ft.path(pts, c.main, 1.5); ft.fn((t) => amp(w, b) * Math.cos(w * t - ph(w, b)), c.warn, 1, [4, 4]);
      const Q = 1 / (2 * b);
      S.out(`β/ω₀ = ${b.toFixed(3)} → Q = ω₀/2β = ${Q.toFixed(1)}, 반치전폭 ≈ 2β = ${(2 * b).toFixed(3)} ω₀ (빨간 가로선)\nω/ω₀ = ${w.toFixed(3)}: 진폭 ${amp(w, b).toFixed(3)} × 정적 변위, 위상 지연 δ = ${(ph(w, b) * 180 / Math.PI).toFixed(1)}° (주황 점선 = δ/π)\n아래: 정지 상태에서 시작한 실제 운동(파랑)과 정상 상태 해(빨간 점선). 과도 응답은 약 1/β = ${(1 / b).toFixed(1)}/ω₀ 시간에 걸쳐 사라진다`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 궤도와 유효 퍼텐셜 (05-02, 05-03) */
  (() => {
    const S = QSim.card("lab-p1-orbit"); if (!S) return;
    const [cvU, cvO] = S.$$("canvas");
    const ueff = (l, n) => { const U = (r) => (n === 2 ? -1 / r : -1 / ((n - 1) * r ** (n - 1))); const Ue = (r) => U(r) + l * l / (2 * r * r); let best = 1e9, rc = 1; for (let i = 0; i < 4000; i++) { const r = 0.05 + i * 0.005, u = Ue(r); if (u < best) { best = u; rc = r; } } return { Ue, best, rc }; };
    function orbit(E, l, n) {
      const { Ue, best, rc } = ueff(l, n);
      if (E < best) E = best + 1e-6;
      let rmin = rc; while (rmin > 0.01 && Ue(rmin) < E) rmin *= 0.999;
      const vr2 = 2 * (E - Ue(rmin * 1.0001));
      let s = [rmin * 1.0001, 0, Math.sqrt(Math.max(0, vr2)), l / (rmin * 1.0001)];  // r, φ, ṙ, φ̇ 대신 x,y,vx,vy
      let x = s[0], y = 0, vx = s[2], vy = l / s[0];
      const pts = [[x, y]], F = (x, y) => { const rr = Math.hypot(x, y); return [-x / rr ** (n + 1), -y / rr ** (n + 1)]; };
      const h = 0.002; let t = 0;
      for (let i = 0; i < 60000; i++) { const st = QSim.rk4((_, q) => { const a = F(q[0], q[1]); return [q[2], q[3], a[0], a[1]]; }, t, [x, y, vx, vy], h); [x, y, vx, vy] = st; t += h; if (i % 10 === 0) pts.push([x, y]); if (Math.hypot(x, y) > 12) break; }
      return { pts, Ue, best, rc, E };
    }
    function draw() {
      const c = C(), l = S.val("l"), n = S.val("n"), ef = S.val("e");
      const Emin = ueff(l, n).best, E = Emin + (0.3 - Emin) * ef;
      const o = orbit(E, l, n);
      const vu = QSim.view(cvU, 0.4), fu = QSim.frame(vu, { x0: 0, x1: 6, y0: Math.min(-0.6, Emin * 1.3), y1: 0.6, xl: "r", yl: "U_eff" }); fu.axes();
      fu.fn((r) => (r > 0.05 ? Math.min(o.Ue(r), 1) : NaN), c.main, 2.5); fu.fn((r) => (n === 2 ? -1 / r : -1 / ((n - 1) * r ** (n - 1))), c.ink3, 1, [4, 3]);
      fu.path([[0, o.E], [6, o.E]], c.warn, 1.5, [6, 4]);
      const vo = QSim.view(cvO, 0.6), R = 6, fo = QSim.frame(vo, { x0: -R, x1: R, y0: -R * 0.62, y1: R * 0.62, equal: true }); fo.axes({ noGrid: true });
      fo.dot(0, 0, c.acc, 5); fo.path(o.pts, c.main, 1.5);
      let txt = `힘 F = −1/r^${n}${n === 2 ? " (역제곱)" : ""}, ℓ = ${l.toFixed(2)}, E = ${o.E.toFixed(3)} (U_eff 최소 ${Emin.toFixed(3)})`;
      if (n === 2) { const eps = Math.sqrt(Math.max(0, 1 + 2 * o.E * l * l)); txt += `\n이심률 ε = √(1 + 2Eℓ²) = ${eps.toFixed(3)} → ${eps < 1e-3 ? "원" : eps < 1 ? "타원" : Math.abs(eps - 1) < 1e-3 ? "포물선" : "쌍곡선"}${eps < 1 ? `, 긴반지름 a = ${(-1 / (2 * o.E)).toFixed(3)}, 주기 2πa^1.5 = ${(2 * Math.PI * (-1 / (2 * o.E)) ** 1.5).toFixed(2)}` : ""}`; }
      else txt += `\n역제곱이 아니면 궤도가 닫히지 않고 근일점이 돈다(세차)`;
      S.out(txt + "\n(질량 1, 힘의 세기 1인 단위)");
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
