/* 물리18 탐구 카드: 복소평면의 닫힌 경로 적분과 유수 정리 */
(() => {
  "use strict";
  const C = () => QSim.col();

  /* 1. 원 경로 적분을 수치로 계산해 2πi × (안쪽 유수의 합)과 비교 (04-02) */
  (() => {
    const S = QSim.card("lab-p18-residue"); if (!S) return;
    const cv = S.$("canvas");
    const cx = (re, im = 0) => ({ re, im });
    const add = (a, b) => cx(a.re + b.re, a.im + b.im), sub = (a, b) => cx(a.re - b.re, a.im - b.im);
    const mul = (a, b) => cx(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
    const div = (a, b) => { const d = b.re * b.re + b.im * b.im; return cx((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); };
    const exp = (a) => cx(Math.exp(a.re) * Math.cos(a.im), Math.exp(a.re) * Math.sin(a.im));
    const ONE = cx(1);
    const F = {   // 함수, 극점과 유수
      a: { f: (z) => div(ONE, add(mul(z, z), ONE)), poles: [[cx(0, 1), cx(0, -0.5)], [cx(0, -1), cx(0, 0.5)]], name: "1/(z²+1)" },
      b: { f: (z) => div(exp(z), z), poles: [[cx(0), cx(1)]], name: "eᶻ/z" },
      c: { f: (z) => div(ONE, mul(z, sub(z, cx(2)))), poles: [[cx(0), cx(-0.5)], [cx(2), cx(0.5)]], name: "1/(z(z−2))" },
      d: { f: (z) => { const w = add(mul(z, z), ONE); return div(ONE, mul(w, w)); }, poles: [[cx(0, 1), cx(0, -0.25)], [cx(0, -1), cx(0, 0.25)]], name: "1/(z²+1)²" },
    };
    function draw() {
      const c = C(), F0 = F[S.val("fn")], x0 = S.val("cx"), y0 = S.val("cy"), R = S.val("R");
      const v = QSim.view(cv, 0.62), f = QSim.frame(v, { x0: -3, x1: 3, y0: -2, y1: 2, equal: true, xl: "Re z", yl: "Im z" }); f.axes();
      const pts = []; for (let k = 0; k <= 200; k++) { const t = 2 * Math.PI * k / 200; pts.push([x0 + R * Math.cos(t), y0 + R * Math.sin(t)]); }
      f.path(pts, c.main, 2.2);
      for (let k = 0; k < 8; k++) { const t = 2 * Math.PI * k / 8, ax = x0 + R * Math.cos(t), ay = y0 + R * Math.sin(t); f.arrow(ax, ay, -0.18 * Math.sin(t), 0.18 * Math.cos(t), c.main); }
      let res = cx(0); const inside = [];
      F0.poles.forEach(([p, r]) => { const d = Math.hypot(p.re - x0, p.im - y0), inn = d < R - 1e-9; f.dot(p.re, p.im, inn ? c.warn : c.ink3, 6); if (inn) { res = add(res, r); inside.push(`z = ${p.re}${p.im >= 0 ? "+" : "−"}${Math.abs(p.im)}i (유수 ${r.re.toFixed(2)}${r.im >= 0 ? "+" : "−"}${Math.abs(r.im).toFixed(2)}i)`); } if (Math.abs(d - R) < 0.03) inside.push("경로가 극점을 지나 적분이 정의되지 않음"); });
      const M = 4000; let sum = cx(0);
      for (let k = 0; k < M; k++) { const t = 2 * Math.PI * (k + 0.5) / M, z = cx(x0 + R * Math.cos(t), y0 + R * Math.sin(t)), dz = cx(-R * Math.sin(t) * 2 * Math.PI / M, R * Math.cos(t) * 2 * Math.PI / M); sum = add(sum, mul(F0.f(z), dz)); }
      const pred = mul(cx(0, 2 * Math.PI), res);
      const z0 = (x) => Math.abs(x) < 5e-5 ? 0 : x;
      const fmt = (a) => `${z0(a.re).toFixed(4)} ${z0(a.im) >= 0 ? "+" : "−"} ${Math.abs(z0(a.im)).toFixed(4)}i`;
      S.out(`f(z) = ${F0.name}, 원의 중심 (${x0}, ${y0}), 반지름 ${R}\n경로 안의 극점: ${inside.length ? inside.join(", ") : "없음"}\n수치 적분 ∮f dz = ${fmt(sum)}\n2πi × (안쪽 유수의 합) = ${fmt(pred)}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 정사각형 상자의 Laplace 방정식: 변수 분리 급수해 (06-01) */
  (() => {
    const S = QSim.card("lab-p18-laplace"); if (!S) return;
    const [cv1, cv2] = S.$$("canvas");
    function V(x, y, N) {   // 윗변 V = 1, 나머지 세 변 0. 홀수 n만 N개
      let s = 0;
      for (let j = 0; j < N; j++) { const n = 2 * j + 1, a = n * Math.PI; s += 4 / a * Math.sin(a * x) * (Math.exp(a * (y - 1)) - Math.exp(-a * (y + 1))) / (1 - Math.exp(-2 * a)); }
      return s;
    }
    function draw() {
      const c = C(), N = S.val("N"), px = S.val("px"), py = S.val("py");
      const v = QSim.view(cv1, 0.62), W = v.W, H = v.H, g = v.g, sz = Math.min(W * 0.6, H - 30), x0 = 30, y0 = 10, M = 60;
      for (let i = 0; i < M; i++) for (let j = 0; j < M; j++) { const u = V((i + 0.5) / M, (j + 0.5) / M, N); g.fillStyle = u >= 0 ? `rgba(217,83,79,${Math.min(0.9, u).toFixed(3)})` : `rgba(75,79,224,${Math.min(0.9, -u * 3).toFixed(3)})`; g.fillRect(x0 + i * sz / M, y0 + sz - (j + 1) * sz / M, sz / M + 0.5, sz / M + 0.5); }
      g.strokeStyle = c.ink; g.lineWidth = 1.5; g.strokeRect(x0, y0, sz, sz);
      g.fillStyle = c.acc; g.beginPath(); g.arc(x0 + px * sz, y0 + sz - py * sz, 5, 0, 7); g.fill();
      g.fillStyle = c.ink2; g.font = "12px sans-serif"; g.fillText("윗변 V = 1, 나머지 V = 0", x0 + sz + 10, y0 + 14);
      const v2 = QSim.view(cv2, 0.34), f = QSim.frame(v2, { x0: 0, x1: 1, y0: -0.2, y1: 1.3, xl: "x (윗변 바로 아래 y = 0.98)", yl: "V" }); f.axes();
      f.fn((x) => V(x, 0.98, N), c.main, 2, null, 800); f.path([[0, 1], [1, 1]], c.ink3, 1, [4, 4]);
      const cen = V(0.5, 0.5, N);
      S.out(`항 수 ${N}개 (n = 1, 3, …, ${2 * N - 1})\n탐침 (${px}, ${py})의 전위 V = ${V(px, py, N).toFixed(5)}\n가운데 (0.5, 0.5): V = ${cen.toFixed(5)} (정확한 값 0.25, 오차 ${(Math.abs(cen - 0.25)).toExponential(2)})\n아래: 윗변 바로 아래의 V. 모서리 근처에서 넘치는 출렁임이 Gibbs 현상`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
