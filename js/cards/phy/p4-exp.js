/* 물리4 체험 카드 묶음: 경로를 바꾸며 작용 재기, 무거운 대칭 팽이 */
(() => {
  "use strict";
  const C = () => QSim.col();

  /* 1. 작용 S[q]를 경로마다 재기 (01-03) */
  (() => {
    const S = QSim.card("lab-p4-action"); if (!S) return;
    const [cvQ, cvS] = S.$$("canvas"), T = 1, N = 400;
    const SYS = {
      fall: { n: "자유 낙하 (g = 9.8, 0초와 1초에 높이 0)", q: (t) => 4.9 * t * (T - t), qd: (t) => 4.9 * (T - 2 * t), L: (q, qd) => 0.5 * qd * qd - 9.8 * q, w: 0 },
      osc1: { n: "조화 진동자 ω = 1 (q(0) = 0, q(1) = 0.5)", w: 1 },
      osc2: { n: "조화 진동자 ω = 2 (q(0) = 0, q(1) = 0.5)", w: 2 },
      osc4: { n: "조화 진동자 ω = 4.5 (q(0) = 0, q(1) = 0.5)", w: 4.5 }
    };
    const sys = (k) => {
      const s = SYS[k]; if (!s.w) return s;
      const w = s.w, A = 0.5 / Math.sin(w * T);
      return { n: s.n, w, q: (t) => A * Math.sin(w * t), qd: (t) => A * w * Math.cos(w * t), L: (q, qd) => 0.5 * qd * qd - 0.5 * w * w * q * q };
    };
    function action(s, eps, n) {
      let sum = 0;
      for (let i = 0; i <= N; i++) {
        const t = T * i / N, k = n * Math.PI / T;
        const q = s.q(t) + eps * Math.sin(k * t), qd = s.qd(t) + eps * k * Math.cos(k * t);
        sum += (i === 0 || i === N ? 1 : i % 2 ? 4 : 2) * s.L(q, qd);
      }
      return sum * T / N / 3;
    }
    function draw() {
      const c = C(), s = sys(S.val("sys")), eps = S.val("eps"), n = +S.val("n");
      const qs = [], ts = [], tr = [];
      for (let i = 0; i <= 200; i++) { const t = T * i / 200; ts.push([t, s.q(t)]); tr.push([t, s.q(t) + eps * Math.sin(n * Math.PI * t / T)]); qs.push(s.q(t)); }
      const lo = Math.min(...qs, ...tr.map((p) => p[1])) - 0.2, hi = Math.max(...qs, ...tr.map((p) => p[1])) + 0.2;
      const v1 = QSim.view(cvQ, 0.45), f1 = QSim.frame(v1, { x0: 0, x1: T, y0: Math.min(lo, -0.3), y1: Math.max(hi, 0.8), xl: "t (s)", yl: "q" }); f1.axes();
      f1.path(ts, c.ink3, 2, [6, 4]); f1.path(tr, c.main, 2.5); f1.dot(0, s.q(0), c.ink, 4); f1.dot(T, s.q(T), c.ink, 4);
      const S0 = action(s, 0, n), Se = action(s, eps, n), pts = [];
      for (let i = 0; i <= 80; i++) { const e = -1 + 2 * i / 80; pts.push([e, action(s, e, n) - S0]); }
      const ys = pts.map((p) => p[1]), y0 = Math.min(0, ...ys), y1 = Math.max(0, ...ys), pad = (y1 - y0) * 0.1 + 0.05;
      const v2 = QSim.view(cvS, 0.4), f2 = QSim.frame(v2, { x0: -1, x1: 1, y0: y0 - pad, y1: y1 + pad, xl: "ε", yl: "S(ε) − S(0)" }); f2.axes();
      f2.path(pts, c.acc, 2.5); f2.dot(eps, Se - S0, c.main, 6);
      const k2 = (n * Math.PI / T) ** 2, coef = s.w ? (T / 4) * (k2 - s.w * s.w) : (T / 4) * k2;
      S.out(`${s.n}, 바꾼 경로 q(t) + ε sin(${n}πt)\n실제 경로의 작용 S(0) = ${S0.toFixed(4)}, 바꾼 경로 S(ε = ${eps.toFixed(2)}) = ${Se.toFixed(4)}, 차이 ${(Se - S0).toFixed(4)}\n이론: S(ε) − S(0) = ε²·(T/4)((nπ/T)² − ω²) = ${coef.toFixed(3)}·ε²  → ${coef > 0 ? "이 방향으로는 최소" : coef < 0 ? "이 방향으로는 최대" : "평평함"}\nε = 0에서 기울기는 늘 0 (정상값)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 무거운 대칭 팽이의 세차와 장동 (05-03) */
  (() => {
    const S = QSim.card("lab-p4-top"); if (!S) return;
    const cv = S.$("canvas"), l1 = 1, MgR = 1, h = 0.002;
    let st = null, trail = [], th = { lo: 9, hi: -9 }, simT = 0;
    function init() {
      const pp = S.val("spin"), th0 = S.val("th0") * Math.PI / 180, mode = S.val("mode");
      const cs = Math.cos(th0), slow = Math.abs(cs) < 1e-9 ? MgR / pp : (pp - Math.sqrt(Math.max(0, pp * pp - 4 * l1 * MgR * cs))) / (2 * l1 * cs);
      const pd0 = mode === "rest" ? 0 : mode === "steady" ? slow : 2 * slow;
      st = { y: [th0, 0, 0], pp, pf: l1 * pd0 * Math.sin(th0) ** 2 + pp * cs, slow, pd0 };
      trail = []; th = { lo: th0, hi: th0 }; simT = 0;
    }
    const rhs = (_, y) => {
      const [t, td] = y, s = Math.sin(t), c = Math.cos(t), pd = (st.pf - st.pp * c) / (l1 * s * s);
      return [td, (l1 * pd * pd * s * c - st.pp * pd * s + MgR * s) / l1, pd];
    };
    function step(dt) {
      const k = Math.round(dt * S.val("speed") / h);
      for (let i = 0; i < k; i++) {
        st.y = QSim.rk4(rhs, 0, st.y, h); simT += h;
        th.lo = Math.min(th.lo, st.y[0]); th.hi = Math.max(th.hi, st.y[0]);
        if (i % 10 === 0) { trail.push([Math.sin(st.y[0]) * Math.cos(st.y[2]), Math.sin(st.y[0]) * Math.sin(st.y[2])]); if (trail.length > 6000) trail.shift(); }
      }
      draw();
    }
    function draw() {
      const c = C(), [t, , ph] = st.y;
      const v = QSim.view(cv, 0.62), f = QSim.frame(v, { x0: -1.1, x1: 1.1, y0: -1.1, y1: 1.1, equal: true }); f.axes({ noGrid: true });
      const g = v.g; g.strokeStyle = c.rule; g.beginPath(); g.arc(f.X(0), f.Y(0), f.sx, 0, 7); g.stroke();
      f.path(trail, c.main, 1.5);
      const x = Math.sin(t) * Math.cos(ph), y = Math.sin(t) * Math.sin(ph);
      f.path([[0, 0], [x, y]], c.ink3, 1.5); f.dot(x, y, c.acc, 6);
      const avg = simT > 0.5 ? st.y[2] / simT : NaN;
      S.out(`위에서 본 대칭축 끝의 자취 (원 = 수평으로 누운 축). λ₁ = 1, MgR = 1, λ₃ω₃ = ${st.pp}\n처음 기울기 ${S.val("th0")}°, 처음 세차 각속도 φ̇₀ = ${st.pd0.toFixed(3)} rad/s\n기울기 범위 ${(th.lo * 180 / Math.PI).toFixed(1)}° ~ ${(th.hi * 180 / Math.PI).toFixed(1)}° (장동 폭 ${((th.hi - th.lo) * 180 / Math.PI).toFixed(1)}°)\n평균 세차 각속도 ${isFinite(avg) ? avg.toFixed(3) : "…"} rad/s, 정상 세차(느린 근) ${st.slow.toFixed(3)}, 근사식 MgR/(λ₃ω₃) = ${(MgR / st.pp).toFixed(3)}\n흐른 시간 ${simT.toFixed(1)} s`);
    }
    const L = QSim.loop((dt) => step(dt)).watch(S.root);
    QSim.playButton(S.$(".play"), L);
    S.$(".reset").addEventListener("click", () => { init(); draw(); });
    S.on(() => { init(); draw(); }); QSim.redrawOn(draw);
    init(); draw();
  })();
})();
