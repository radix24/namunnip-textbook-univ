/* 수학7 탐구: 평균값 정리 — 끝점 a, b를 끌면 할선과 평행한 접선의 점 c들을 찾아 표시한다 */
(() => {
  "use strict";
  let f;
  const P = [[-1.5, 0], [2, 0]];
  const FN = {
    cubic: { f: (x) => x * x * x / 3 - x, d: (x) => x * x - 1, tex: "x³/3 − x" },
    sin: { f: (x) => Math.sin(2 * x) + 0.3 * x, d: (x) => 2 * Math.cos(2 * x) + 0.3, tex: "sin 2x + 0.3x" },
    abs: { f: (x) => Math.abs(x), d: (x) => (x > 0 ? 1 : x < 0 ? -1 : NaN), tex: "|x| (0에서 미분 불가능)" },
  };
  const S = MKit.setup("card-m7-mvt", 0.6, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  function draw() {
    const c = QSim.col(), F = FN[k.val("fn")];
    const a = Math.min(P[0][0], P[1][0]), b = Math.max(P[0][0], P[1][0]);
    P[0][1] = F.f(P[0][0]); P[1][1] = F.f(P[1][0]);
    f = QSim.frame(v, { x0: -3, x1: 3, y0: -2.5, y1: 2.5, pad: 24 });
    f.axes();
    f.fn(F.f, c.ink2, 2);
    const m = (F.f(b) - F.f(a)) / (b - a || 1e-9);
    f.path([[a, F.f(a)], [b, F.f(b)]], c.warn, 2);
    // f'(x) = m인 점을 (a, b)에서 찾기: 부호 변화
    const cs = []; const N = 2000;
    let allEq = true;
    for (let i = 1; i < N; i++) { const t = F.d(a + ((b - a) * i) / N) - m; if (!(Math.abs(t) < 1e-9)) { allEq = false; break; } }
    if (allEq) { f.path([[a, F.f(a)], [b, F.f(b)]], c.main, 3); P.forEach(([x, y]) => f.dot(x, y, c.ink, 6)); k.out(`f = ${F.tex} · 구간에서 그래프가 직선이라 모든 점 c에서 f′(c) = ${fmt(m, 4)}입니다`); return; }
    let prev = F.d(a + (b - a) / N) - m;
    for (let i = 2; i < N; i++) {
      const x = a + ((b - a) * i) / N, cur = F.d(x) - m;
      if (isFinite(prev) && isFinite(cur) && (prev === 0 || prev * cur < 0)) cs.push(x);
      prev = cur;
    }
    cs.forEach((x) => { const y = F.f(x); f.path([[x - 1, y - m], [x + 1, y + m]], c.main, 1.8); f.dot(x, y, c.main, 5); });
    P.forEach(([x, y]) => f.dot(x, y, c.ink, 6));
    k.out(`f = ${F.tex} · 할선 기울기 (f(b) − f(a))/(b − a) = ${fmt(m, 4)}\n` +
      (cs.length ? `f′(c) = ${fmt(m, 4)}인 c: ${cs.map((x) => fmt(x, 3)).join(", ")} (${cs.length}개)` : "기울기가 할선과 같은 점이 없습니다. 미분 가능하지 않은 점이 구간 안에 있는지 보세요."));
  }
  MKit.drag(S.cv, () => f, () => P, (i, x) => { P[i] = [x, 0]; S.redraw(); });
  S.redraw();
})();
