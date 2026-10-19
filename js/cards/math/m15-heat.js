/* 수학15 탐구: 원 위의 열방정식 u = Σ f̂(n) e^(−n² t) e^(inθ) — 사각파가 매끄러워지며 평균으로 */
(() => {
  "use strict";
  const S = MKit.setup("card-m15-heat", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const PI = Math.PI;
  const fe = (x) => (x < 1e-3 ? x.toExponential(2) : fmt(x, 4));
  // 초기 온도: 사각파 0.5 + 0.5 sgn θ (평균 0.5), 또는 뾰족한 덩어리
  const INIT = {
    sq: { name: "반쪽만 뜨거움 (0 또는 1)", coef: (n) => (n === 0 ? [0.5, 0] : n % 2 ? [0, 2 / (PI * n)] : [0, 0]) },
    bump: { name: "한 곳만 뜨거움 (폭 0.4)", coef: (n) => { const w = 0.4; return n === 0 ? [w / (2 * PI), 0] : [(2 * Math.sin((n * w) / 2)) / (PI * n), 0]; } },
  };
  function draw() {
    const c = QSim.col(), I = INIT[k.val("f")], t = Math.pow(10, k.val("lt")), N = 400;
    // 실수 꼴: f = a0 + Σ (a_n cos nθ + b_n sin nθ)
    const u = (th, tt) => { const [a0] = I.coef(0); let s = a0; for (let n = 1; n <= N; n++) { const [a, b] = I.coef(n), e = Math.exp(-n * n * tt); if (e < 1e-14) break; s += e * (a * Math.cos(n * th) + b * Math.sin(n * th)); } return s; };
    const F = QSim.frame(v, { x0: -PI, x1: PI, y0: -0.2, y1: I === INIT.bump ? 1.3 : 1.2, pad: 26, xl: "θ", yl: "온도 u" });
    F.axes();
    F.fn((th) => u(th, 1e-5), c.rule, 1, [3, 3], 800);
    F.fn((th) => u(th, t), c.warn, 2.2, null, 800);
    const [a0] = I.coef(0);
    F.path([[-PI, a0], [PI, a0]], c.acc, 1.2, [5, 4]);
    let mx = -Infinity, mn = Infinity; for (let i = 0; i <= 400; i++) { const y = u(-PI + (2 * PI * i) / 400, t); mx = Math.max(mx, y); mn = Math.min(mn, y); }
    k.out(`${I.name} · t = ${t < 0.01 ? t.toExponential(1) : fmt(t, 3)} · 최고 ${fmt(mx, 4)}, 최저 ${fmt(mn, 4)}, 평균 ${fmt(a0, 4)} (보존)\nn번째 성분은 e^(−n²t)배: n = 1에서 ${fe(Math.exp(-t))}, n = 3에서 ${fe(Math.exp(-9 * t))}, n = 10에서 ${fe(Math.exp(-100 * t))}`);
  }
  S.redraw();
})();
