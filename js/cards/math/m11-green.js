/* 수학11 탐구: 그린 정리 ∮_∂D ω = ∬_D dω 의 수치 확인 — 구멍(원점의 특이점)이 있으면 깨짐 */
(() => {
  "use strict";
  const S = MKit.setup("card-m11-green", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const FORMS = {
    poly: { name: "(x² − y) dx + (x + y²) dy", P: (x, y) => x * x - y, Q: (x, y) => x + y * y, curl: () => 2 },
    mix: { name: "−x²y dx + xy² dy", P: (x, y) => -x * x * y, Q: (x, y) => x * y * y, curl: (x, y) => x * x + y * y },
    ang: { name: "(−y dx + x dy)/(x² + y²)", P: (x, y) => -y / (x * x + y * y), Q: (x, y) => x / (x * x + y * y), curl: () => 0, sing: true },
  };
  function draw() {
    const c = QSim.col(), Fm = FORMS[k.val("w")], cx = k.val("cx"), a = k.val("ra"), b = k.val("rb");
    const P = QSim.frame(v, { x0: -3, x1: 3, y0: -1.5, y1: 1.5, pad: 16, equal: true });
    P.axes({ noGrid: true });
    const curve = (t) => [cx + a * Math.cos(t), b * Math.sin(t)];
    const pts = Array.from({ length: 241 }, (_, i) => curve((i / 240) * 2 * Math.PI));
    P.path(pts, c.main, 2);
    for (let i = 0; i < 4; i++) { const t = (i / 4) * 2 * Math.PI + 0.3, p = curve(t); P.arrow(p[0], p[1], -a * Math.sin(t) * 0.25, b * Math.cos(t) * 0.25, c.main); }
    if (Fm.sing) P.dot(0, 0, c.warn, 5);
    // 선적분: 사다리꼴(주기함수라 매우 정확)
    const N = 4000; let line = 0;
    for (let i = 0; i < N; i++) { const t = (i / N) * 2 * Math.PI, [x, y] = curve(t), dx = -a * Math.sin(t), dy = b * Math.cos(t); line += (Fm.P(x, y) * dx + Fm.Q(x, y) * dy) * (2 * Math.PI / N); }
    // 이중적분: 타원 극좌표 x = cx + a r cos θ, y = b r sin θ, |J| = a b r (중점 규칙)
    const nr = 200, nt = 200; let area = 0;
    for (let i = 0; i < nr; i++) for (let j = 0; j < nt; j++) { const r = (i + 0.5) / nr, t = ((j + 0.5) / nt) * 2 * Math.PI; area += Fm.curl(cx + a * r * Math.cos(t), b * r * Math.sin(t)) * a * b * r * (1 / nr) * (2 * Math.PI / nt); }
    const inside = (0 - cx) * (0 - cx) / (a * a) < 1;
    k.out(`ω = ${Fm.name}, 영역: 중심 (${fmt(cx, 2)}, 0), 반지름 ${fmt(a, 2)} × ${fmt(b, 2)}의 타원\n∮∂D ω = ${fmt(line, 6)} · ∬D dω = ${fmt(area, 6)}${Fm.sing ? ` · 원점이 영역 ${inside ? "안에 있음(ω가 정의되지 않는 점 포함)" : "밖에 있음"}` : ""}`);
  }
  S.redraw();
})();
