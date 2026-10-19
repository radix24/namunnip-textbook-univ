/* 수학6 탐구: −u'' = f, u(0) = u(1) = 0의 그린 함수 G(x, s) = x_<(1 − x_>) 와 u = ∫ G f ds */
(() => {
  "use strict";
  let f, s0 = 0.3;
  const S = MKit.setup("card-m6-green", 0.55, draw);
  if (!S) return;
  const { k, v, cv } = S;
  const { fmt } = MKit;
  const G = (x, s) => (x <= s ? x * (1 - s) : s * (1 - x));
  const FS = {
    one: { f: () => 1, tex: "f = 1", exact: (x) => (x * (1 - x)) / 2 },
    lin: { f: (x) => x, tex: "f = x", exact: (x) => (x * (1 - x * x)) / 6 },
    sin: { f: (x) => Math.sin(Math.PI * x), tex: "f = sin πx", exact: (x) => Math.sin(Math.PI * x) / (Math.PI * Math.PI) },
  };
  function draw() {
    const c = QSim.col(), F = FS[k.val("f")];
    f = QSim.frame(v, { x0: 0, x1: 1, y0: -0.02, y1: 0.3, pad: 28, xl: "x" });
    f.axes();
    // 점 하중 s의 반응 G(·, s)
    f.fn((x) => G(x, s0), c.ink3, 1.8, [5, 4]);
    f.dot(s0, 0, c.warn, 7);
    f.arrow(s0, 0.28, 0, -0.05, c.warn, "하중");
    // 하중 분포와 처짐
    f.fn((x) => 0.12 * F.f(x), c.acc, 1.2);
    const u = (x) => { const M = 400, d = 1 / M; let sum = G(x, 0) * F.f(0) + G(x, 1) * F.f(1); for (let i = 1; i < M; i++) sum += (i % 2 ? 4 : 2) * G(x, i * d) * F.f(i * d); return (sum * d) / 3; };
    f.fn(u, c.main, 2.4, null, 120);
    k.out(`${F.tex} (노랑, 0.12배로 그림) · 처짐 u = ∫ G(x, s) f(s) ds (파랑) · u(0.5) = ${fmt(u(0.5), 5)}, 정확한 값 ${fmt(F.exact(0.5), 5)}\n`
      + `회색 점선 = 점 s = ${fmt(s0, 2)}에 단위 하중을 걸 때의 처짐 G(x, s) · 최대 처짐 G(s, s) = s(1 − s) = ${fmt(s0 * (1 - s0), 4)} · 빨간 점을 끌어 s를 옮기세요`);
  }
  MKit.drag(cv, () => f, () => [[s0, 0]], (i, x) => { s0 = Math.max(0.01, Math.min(0.99, x)); S.redraw(); });
  S.redraw();
})();
