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
})();
