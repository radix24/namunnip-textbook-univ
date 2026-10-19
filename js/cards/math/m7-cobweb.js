/* 수학7 탐구: 고정점 반복의 거미줄 그림 — 축소사상이면 어디서 시작해도 한 점으로 모인다 */
(() => {
  "use strict";
  let f;
  const X0 = [[0.1, 0]];
  const FN = {
    cos: { T: Math.cos, box: [-0.2, 1.6], tex: "T(x) = cos x", c: "약 0.84 (구간 [0, 1]에서 |sin x| ≤ sin 1)" },
    lin: { T: (x) => x / 3 + 1, box: [-0.5, 3], tex: "T(x) = x/3 + 1", c: "1/3" },
    newton: { T: (x) => 0.5 * (x + 2 / x), box: [0.8, 2.6], tex: "T(x) = (x + 2/x)/2", c: "구간 [1, 2]에서 1/2 이하" },
    log: { T: (x) => 3.3 * x * (1 - x), box: [0, 1], tex: "T(x) = 3.3x(1 − x)", c: "없음 (축소가 아님)" },
  };
  const S = MKit.setup("card-m7-cobweb", 0.75, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  function draw() {
    const c = QSim.col(), F = FN[k.val("fn")], N = k.val("n"), [a, b] = F.box;
    f = QSim.frame(v, { x0: a, x1: b, y0: a, y1: b, equal: true, pad: 26, xl: "x" });
    f.axes();
    f.path([[a, a], [b, b]], c.rule, 1.5);
    f.fn(F.T, c.ink2, 2, null, 400);
    let x = Math.max(a + 1e-6, Math.min(b, X0[0][0])); const xs = [x];
    const web = [[x, a]];
    for (let i = 0; i < N; i++) {
      const y = F.T(x);
      web.push([x, y]); web.push([y, y]);
      x = y; xs.push(x);
    }
    f.path(web.map(([p, q]) => [Math.max(a, Math.min(b, p)), Math.max(a, Math.min(b, q))]), c.main, 1.4);
    f.dot(xs[0], a, c.warn, 6);
    const last = xs.slice(-4).map((t) => fmt(t, 6)).join(", ");
    k.out(`${F.tex} · 축소 상수 c: ${F.c}\n${N}번 반복한 마지막 값들: ${last}`);
  }
  MKit.drag(S.cv, () => f, () => [[Math.max(f.x0, Math.min(f.x1, X0[0][0])), f.y0]], (i, x) => { X0[0] = [x, 0]; S.redraw(); });
  S.redraw();
})();
