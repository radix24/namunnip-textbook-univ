/* 수학7 탐구: 리만 재배열 — 교대 조화급수의 항을 골라 더해 목표값 T로 가게 만든다 */
(() => {
  "use strict";
  const S = MKit.setup("card-m7-rearrange", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  function draw() {
    const c = QSim.col(), T = k.val("T"), N = k.val("N");
    // 양수 항 1, 1/3, 1/5, …  음수 항 −1/2, −1/4, …
    let ip = 0, iq = 0, s = 0; const pts = [[0, 0]], used = [];
    for (let n = 1; n <= N; n++) {
      if (s <= T) { s += 1 / (2 * ip + 1); used.push(`+1/${2 * ip + 1}`); ip++; }
      else { iq++; s -= 1 / (2 * iq); used.push(`−1/${2 * iq}`); }
      pts.push([n, s]);
    }
    const ys = pts.map((p) => p[1]), lo = Math.min(T, ...ys) - 0.2, hi = Math.max(T, ...ys) + 0.2;
    const f = QSim.frame(v, { x0: 0, x1: N + 1, y0: lo, y1: hi, pad: 30, xl: "더한 항의 수" });
    f.axes();
    f.path([[0, T], [N + 1, T]], c.acc, 2, [6, 4]);
    f.path([[0, Math.LN2], [N + 1, Math.LN2]], c.rule, 1, [2, 4]);
    f.path(pts, c.main, 1.5);
    if (N <= 300) pts.forEach(([x, y], i) => i && f.dot(x, y, c.main, 2));
    k.out(`목표 T = ${fmt(T, 2)} · ${N}항을 더한 부분합 ${fmt(s, 5)} (차 ${fmt(s - T, 5)})\n쓴 양수 항 ${ip}개, 음수 항 ${iq}개 · 처음 몇 항: ${used.slice(0, 12).join(" ")} …\n(옅은 점선은 원래 순서의 합 ln 2 ≈ 0.6931)`);
  }
  S.redraw();
})();
