/* 수학2 탐구: 순서쌍의 동치류 — 정수는 기울기 1인 직선, 유리수는 원점을 지나는 직선 */
(() => {
  "use strict";
  const S = MKit.setup("card-m2-pairs", 0.75, draw);
  if (!S) return;
  const { k, v } = S;
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  function draw() {
    const c = QSim.col(), mode = k.val("mode"), p = k.val("p"), q = k.val("q");
    let f, cls = [], msg;
    if (mode === "int") {
      f = QSim.frame(v, { x0: -0.5, x1: 10.5, y0: -0.5, y1: 10.5, equal: true, pad: 26, xl: "a", yl: "b" });
      f.axes();
      for (let a = 0; a <= 10; a++) for (let b = 0; b <= 10; b++) { const on = a - b === p; f.dot(a, b, on ? c.main : c.rule, on ? 5 : 2.5); if (on) cls.push(`(${a},${b})`); }
      f.path([[Math.max(0, p), Math.max(0, -p)], [Math.min(10, 10 + p), Math.min(10, 10 - p)]], c.main, 1.2, [4, 4]);
      msg = `정수 ${p}의 동치류: a − b = ${p}인 쌍 (그림 안 ${cls.length}개) ${cls.slice(0, 8).join(" ")}${cls.length > 8 ? " …" : ""}\n(a, b) ~ (c, d) ⇔ a + d = b + c: 같은 동치류는 기울기 1인 직선 위에 놓인다`;
    } else {
      f = QSim.frame(v, { x0: -0.5, x1: 8.5, y0: -8.5, y1: 8.5, equal: true, pad: 26, xl: "b (분모)", yl: "a (분자)" });
      f.axes();
      const g = gcd(p, q) || 1, P = p / g, Q = q / g;
      for (let b = 1; b <= 8; b++) for (let a = -8; a <= 8; a++) { const on = a * Q === b * P; f.dot(b, a, on ? c.main : c.rule, on ? 5 : 2.5); if (on) cls.push(`${a}/${b}`); }
      f.path([[0, 0], [8.4, (8.4 * P) / Q]], c.main, 1.2, [4, 4]);
      f.dot(0, 0, c.warn, 4);
      msg = `유리수 ${P}/${Q}의 동치류 (그림 안 ${cls.length}개): ${cls.join(", ")}\n(a, b) ~ (c, d) ⇔ ad = bc: 같은 동치류는 원점을 지나는 기울기 ${P}/${Q}인 직선 위에 놓인다 (원점 자체는 b = 0이라 제외)`;
    }
    k.out(msg);
  }
  S.redraw();
})();
