/* 물리1 체험 카드 묶음: 극좌표 가속도의 네 항, 회전판 위의 공, 감쇠 진동 */
(() => {
  "use strict";
  const C = () => QSim.col();

  /* 1. 극좌표 가속도의 네 항 (01-01) */
  (() => {
    const S = QSim.card("lab-p1-polar"); if (!S) return;
    const cv = S.$("canvas");
    const P = {
      ant: { n: "회전판 위 개미 (r = 0.1t, φ = t)", T: 10, f: (t) => [0.1 * t, 0.1, 0, t, 1, 0] },
      spin: { n: "빨라지는 원운동 (r = 1, φ = 0.05t²)", T: 10, f: (t) => [1, 0, 0, 0.05 * t * t, 0.1 * t, 0.1] },
      spiral: { n: "안쪽으로 감기는 나선 (r = 1 − 0.08t, r²φ̇ = 0.5)", T: 10, f: (t) => { const r = 1 - 0.08 * t; return [r, -0.08, 0, 6.25 * (1 / r - 1), 0.5 / (r * r), 0.08 / (r * r * r)]; } }
    };
    let t = 0;
    const xy = (r, ph) => [r * Math.cos(ph), r * Math.sin(ph)];
    function draw() {
      const c = C(), p = P[S.val("path")];
      const [r, rd, rdd, ph, phd, phdd] = p.f(t);
      const v = QSim.view(cv, 0.62), f = QSim.frame(v, { x0: -1.25, x1: 1.25, y0: -1.25, y1: 1.25, equal: true }); f.axes({ noGrid: true });
      const pts = []; for (let i = 0; i <= 300; i++) { const q = p.f(p.T * i / 300); pts.push(xy(q[0], q[3])); }
      f.path(pts, c.rule, 1.5);
      const tr = []; for (let i = 0; i <= 200; i++) { const q = p.f(t * i / 200); tr.push(xy(q[0], q[3])); }
      f.path(tr, c.soft, 2.5);
      const [x, y] = xy(r, ph), er = [Math.cos(ph), Math.sin(ph)], ep = [-Math.sin(ph), Math.cos(ph)];
      const ar = rdd - r * phd * phd, ap = r * phdd + 2 * rd * phd, vr = rd, vp = r * phd;
      const sv = S.val("sv"), sa = S.val("sa");
      f.path([[0, 0], [x, y]], c.ink3, 1, [4, 4]);
      const cap = (dx, dy) => { const L = Math.hypot(dx, dy); return L > 1 ? [dx / L, dy / L] : [dx, dy]; };   // 화살표는 길이 1까지만
      f.arrow(x, y, ...cap(sv * (vr * er[0] + vp * ep[0]), sv * (vr * er[1] + vp * ep[1])), c.main, "v");
      f.arrow(x, y, ...cap(sa * ar * er[0], sa * ar * er[1]), c.warn, "a_r");
      f.arrow(x, y, ...cap(sa * ap * ep[0], sa * ap * ep[1]), c.acc, "a_φ");
      f.dot(x, y, c.ink, 5);
      const fx = (z) => (Math.abs(z) < 5e-4 ? "0.000" : z.toFixed(3)), pl = (z) => (z <= -5e-4 ? `(${fx(z)})` : fx(z));
      S.out(`${p.n}, t = ${t.toFixed(1)} s\nr = ${fx(r)}, ṙ = ${fx(rd)}, φ̇ = ${fx(phd)} rad/s, φ̈ = ${fx(phdd)}\n반지름 방향 a_r = r̈ − rφ̇² = ${fx(rdd)} − ${pl(r * phd * phd)} = ${fx(ar)}  (빨강)\n각 방향 a_φ = rφ̈ + 2ṙφ̇ = ${fx(r * phdd)} + ${pl(2 * rd * phd)} = ${fx(ap)}  (주황)\n속력 |v| = ${fx(Math.hypot(vr, vp))}, 각운동량/질량 r²φ̇ = ${fx(r * r * phd)}`);
    }
    const L = QSim.loop((dt) => { const p = P[S.val("path")]; t += dt; if (t >= p.T) { t = p.T; draw(); return false; } S.$('[name="t"]').value = t; S.show(); draw(); }).watch(S.root);
    QSim.playButton(S.$(".play"), L, () => { if (t >= P[S.val("path")].T - 1e-6) t = 0; });
    S.on(() => { t = S.val("t"); draw(); }); QSim.redrawOn(draw);
    t = S.val("t"); draw();
  })();

  /* 2. 회전판 위의 공: 관성계와 회전계 (06-01) */
  (() => {
    const S = QSim.card("lab-p1-coriolis"); if (!S) return;
    const cv = S.$("canvas"); let t = 0;
    const cx = [-1.3, 1.3];
    function state() {
      const Om = S.val("om"), v0 = S.val("v0"), r0 = S.val("r0");
      const vx = v0, vy = Om * r0;               // 판 위에서 바깥쪽으로 v0, 판과 함께 돌던 속도 Ωr0
      const a = vx * vx + vy * vy, b = 2 * r0 * vx, cc = r0 * r0 - 1;
      const tEnd = (-b + Math.sqrt(b * b - 4 * a * cc)) / (2 * a);
      return { Om, v0, r0, vx, vy, tEnd };
    }
    const inert = (s, tt) => [s.r0 + s.vx * tt, s.vy * tt];
    const rot = (s, tt) => { const [x, y] = inert(s, tt), a = -s.Om * tt; return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]; };
    function draw() {
      const c = C(), s = state(), te = Math.min(t, s.tEnd);
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: -2.65, x1: 2.65, y0: -1.25, y1: 1.25, equal: true, pad: 6 });
      const g = v.g;
      for (const k of [0, 1]) { g.strokeStyle = c.rule; g.lineWidth = 1.5; g.beginPath(); g.arc(f.X(cx[k]), f.Y(0), f.sx, 0, 7); g.stroke(); }
      const ang = s.Om * te;                      // 판에 그린 표시선
      f.path([[cx[0], 0], [cx[0] + Math.cos(ang), Math.sin(ang)]], c.ink3, 1.5, [4, 4]);
      f.path([[cx[1], 0], [cx[1] + 1, 0]], c.ink3, 1.5, [4, 4]);
      const A = [], B = []; for (let i = 0; i <= 200; i++) { const tt = te * i / 200, p = inert(s, tt), q = rot(s, tt); A.push([cx[0] + p[0], p[1]]); B.push([cx[1] + q[0], q[1]]); }
      f.path(A, c.main, 2.5); f.path(B, c.acc, 2.5);
      const pe = inert(s, te), qe = rot(s, te);
      f.dot(cx[0] + pe[0], pe[1], c.main, 5); f.dot(cx[1] + qe[0], qe[1], c.acc, 5);
      f.text("바깥에서 본 모습 (관성계)", cx[0], 1.12, c.ink2, "center"); f.text("판 위에서 본 모습 (회전계)", cx[1], 1.12, c.ink2, "center");
      const qf = rot(s, s.tEnd), defl = Math.atan2(qf[1], qf[0]) * 180 / Math.PI;
      S.out(`Ω = ${s.Om} rad/s (${s.Om >= 0 ? "시계 반대 방향" : "시계 방향"}), 판 위에서 본 처음 속력 ${s.v0} m/s, 출발 반지름 ${s.r0} m (판 반지름 1 m)\n가장자리 도착 시각 ${s.tEnd.toFixed(2)} s, 그동안 판이 돈 각 ${(s.Om * s.tEnd * 180 / Math.PI).toFixed(1)}°\n판 위에서 본 도착 방향: 겨눈 방향(점선)에서 ${Math.abs(defl).toFixed(1)}° ${defl < -0.05 ? "오른쪽(시계 방향)" : defl > 0.05 ? "왼쪽(시계 반대 방향)" : ""}으로 휨\n관성계에서는 직선(파랑), 회전계에서는 휘는 곡선(주황): 같은 운동을 다르게 본 것`);
    }
    const L = QSim.loop((dt) => { t += dt; draw(); if (t >= state().tEnd) return false; }).watch(S.root);
    QSim.playButton(S.$(".play"), L, () => { if (t >= state().tEnd) t = 0; });
    S.$(".reset").addEventListener("click", () => { L.stop(); t = 0; draw(); });
    S.on(() => { t = 1e9; draw(); }); QSim.redrawOn(draw);
    t = 1e9; draw();
  })();

  /* 3. 감쇠 진동의 세 경우 (04-02) */
  (() => {
    const S = QSim.card("lab-p1-damped"); if (!S) return;
    const cv = S.$("canvas"), w0 = 2 * Math.PI;   // 고유 주기 1 s
    const sol = (b, t) => {   // x(0) = 1, v(0) = 0
      if (Math.abs(b - w0) < 1e-6) return (1 + b * t) * Math.exp(-b * t);
      if (b < w0) { const w1 = Math.sqrt(w0 * w0 - b * b); return Math.exp(-b * t) * (Math.cos(w1 * t) + b / w1 * Math.sin(w1 * t)); }
      const s = Math.sqrt(b * b - w0 * w0), r1 = -b + s, r2 = -b - s; return (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1);
    };
    const settle = (b) => { let last = 0; for (let i = 0; i <= 20000; i++) { const t = i * 0.001; if (Math.abs(sol(b, t)) > 0.05) last = t; } return last; };
    function draw() {
      const c = C(), z = S.val("z"), b = z * w0;
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: 4, y0: -1, y1: 1.1, xl: "t (s)", yl: "x" }); f.axes();
      f.path([[0, 0.05], [4, 0.05]], c.rule, 1, [3, 3]); f.path([[0, -0.05], [4, -0.05]], c.rule, 1, [3, 3]);
      f.fn((t) => sol(w0, t), c.ink3, 1.5, [5, 4], 500); f.fn((t) => sol(b, t), c.main, 2.5, null, 800);
      const kind = Math.abs(z - 1) < 1e-6 ? "임계 감쇠" : z < 1 ? "미감쇠(진동하며 줄어듦)" : "과감쇠(진동 없이 천천히)";
      const ts = settle(b), tc = settle(w0);
      S.out(`감쇠비 β/ω₀ = ${z.toFixed(2)} → ${kind}. 고유 주기 1 s, 처음 x = 1에서 놓음\n${z < 1 ? `진동 주기 ${(2 * Math.PI / Math.sqrt(w0 * w0 - b * b)).toFixed(3)} s, ` : ""}|x|가 0.05 안에 머물기 시작하는 시각 ${ts.toFixed(2)} s (임계 감쇠, 회색 점선: ${tc.toFixed(2)} s)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
