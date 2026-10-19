/* 수학1 탐구: 평면의 부분집합이 부분공간인가 — 두 벡터를 끌어 합과 실수배가 집합 안에 남는지 본다 */
(() => {
  "use strict";
  let f;
  const P = [[1, 0.5], [-0.6, 1.4]];
  const SETS = {
    line: { has: (x, y) => Math.abs(y - 0.5 * x) < 0.06, snap: (x) => [x, 0.5 * x], tex: "직선 y = x/2 (원점을 지남)", ok: true },
    shift: { has: (x, y) => Math.abs(y - 0.5 * x - 1) < 0.06, snap: (x) => [x, 0.5 * x + 1], tex: "직선 y = x/2 + 1 (원점을 지나지 않음)" },
    axes: { has: (x, y) => Math.abs(x) < 0.06 || Math.abs(y) < 0.06, snap: (x, y) => (Math.abs(x) < Math.abs(y) ? [0, y] : [x, 0]), tex: "두 좌표축의 합집합" },
    quad: { has: (x, y) => x >= -0.03 && y >= -0.03, snap: (x, y) => [Math.max(0, x), Math.max(0, y)], tex: "제1사분면 (x ≥ 0, y ≥ 0)" },
    para: { has: (x, y) => Math.abs(y - x * x / 2) < 0.06, snap: (x) => [x, x * x / 2], tex: "포물선 y = x²/2" },
    plane: { has: () => true, snap: (x, y) => [x, y], tex: "평면 전체", ok: true },
  };
  const S = MKit.setup("card-m1-subspace", 0.8, draw);
  if (!S) return;
  const { k, v } = S;
  const cur = () => SETS[k.val("set")];
  function draw() {
    const c = QSim.col(), g = v.g, St = cur(), cc = k.val("c");
    P.forEach((p, i) => { P[i] = St.snap(p[0], p[1]); });
    f = QSim.frame(v, { x0: -3.2, x1: 3.2, y0: -3.2, y1: 3.2, equal: true, pad: 22 });
    f.axes();
    // 집합 칠하기
    const key = k.val("set");
    g.save(); g.fillStyle = c.soft; g.globalAlpha = 0.7;
    if (key === "quad") g.fillRect(f.X(0), f.Y(3.2), f.X(3.2) - f.X(0), f.Y(0) - f.Y(3.2));
    else if (key === "plane") g.fillRect(f.X(-3.2), f.Y(3.2), f.X(3.2) - f.X(-3.2), f.Y(-3.2) - f.Y(3.2));
    g.restore();
    if (key === "line") f.fn((x) => 0.5 * x, c.soft, 7);
    if (key === "shift") f.fn((x) => 0.5 * x + 1, c.soft, 7);
    if (key === "para") f.fn((x) => (x * x) / 2, c.soft, 7);
    if (key === "axes") { f.path([[-3.2, 0], [3.2, 0]], c.soft, 7); f.path([[0, -3.2], [0, 3.2]], c.soft, 7); }
    const [u, w] = P, s = [u[0] + w[0], u[1] + w[1]], m = [cc * u[0], cc * u[1]];
    const inS = St.has(s[0], s[1]), inM = St.has(m[0], m[1]), in0 = St.has(0, 0);
    f.arrow(0, 0, u[0], u[1], c.ink2, "u"); f.arrow(0, 0, w[0], w[1], c.ink2, "v");
    f.path([u, s, w], c.rule, 1, [3, 3]);
    f.arrow(0, 0, s[0], s[1], inS ? c.main : c.warn, "u+v");
    f.arrow(0, 0, m[0], m[1], inM ? c.acc : c.warn, "cu");
    f.dot(u[0], u[1], c.ink, 6); f.dot(w[0], w[1], c.ink, 6);
    f.dot(0, 0, in0 ? c.main : c.warn, 4);
    const yes = (b) => (b ? "예" : "아니오");
    k.out(`${St.tex}\n영벡터 포함: ${yes(in0)} · u+v가 집합 안: ${yes(inS)} · ${cc}·u가 집합 안: ${yes(inM)}` +
      (St.ok ? "\n이 집합은 부분공간입니다(어떻게 끌어도 세 답이 모두 예)" : "\n세 답이 모두 ‘예’가 아닌 경우를 하나라도 찾으면 부분공간이 아닙니다"));
  }
  MKit.drag(S.cv, () => f, () => P, (i, x, y) => { P[i] = cur().snap(x, y); S.redraw(); });
  S.redraw();
})();
