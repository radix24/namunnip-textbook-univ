/* 수학8 탐구: 2×2 실행렬의 고유벡터 사이 각과 정규성 ‖AᵀA − AAᵀ‖ */
(() => {
  "use strict";
  const S = MKit.setup("card-m8-normal", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  function draw() {
    const c = QSim.col(), a = k.val("a"), b = k.val("b"), cc = k.val("c"), d = k.val("d");
    const F = QSim.frame(v, { x0: -3.2, x1: 3.2, y0: -2.4, y1: 2.4, pad: 24, xl: "x", yl: "y" });
    F.axes({ noGrid: true });
    const circ = [], img = [];
    for (let i = 0; i <= 120; i++) { const t = (2 * Math.PI * i) / 120, x = Math.cos(t), y = Math.sin(t); circ.push([x, y]); img.push([a * x + b * y, cc * x + d * y]); }
    F.path(circ, c.ink3, 1, [3, 3]); F.path(img, c.main, 1.6);
    // 정규성: AᵀA − AAᵀ
    const n11 = a * a + cc * cc - (a * a + b * b), n12 = a * b + cc * d - (a * cc + b * d), n22 = b * b + d * d - (cc * cc + d * d);
    const comm = Math.sqrt(n11 * n11 + 2 * n12 * n12 + n22 * n22);
    const tr = a + d, det = a * d - b * cc, disc = tr * tr / 4 - det;
    let txt;
    if (disc < -1e-12) {
      txt = `고유값 ${fmt(tr / 2, 3)} ± ${fmt(Math.sqrt(-disc), 3)}i (복소수): 실평면에 고유 방향이 없음`;
    } else {
      const l1 = tr / 2 + Math.sqrt(Math.max(0, disc)), l2 = tr / 2 - Math.sqrt(Math.max(0, disc));
      const ev = (l) => { let x = b, y = l - a; if (Math.hypot(x, y) < 1e-9) { x = l - d; y = cc; } if (Math.hypot(x, y) < 1e-9) return null; const r = Math.hypot(x, y); return [x / r, y / r]; };
      const e1 = ev(l1), e2 = ev(l2);
      [[e1, c.acc], [e2, c.warn]].forEach(([e, col]) => { if (e) F.path([[-3 * e[0], -3 * e[1]], [3 * e[0], 3 * e[1]]], col, 2); });
      if (e1 && e2 && Math.abs(l1 - l2) > 1e-9) {
        const ang = (Math.acos(Math.min(1, Math.abs(e1[0] * e2[0] + e1[1] * e2[1]))) * 180) / Math.PI;
        txt = `고유값 ${fmt(l1, 3)}, ${fmt(l2, 3)} · 고유 방향 사이 각 ${fmt(ang, 1)}°`;
      } else txt = `고유값 ${fmt(l1, 3)} (중근)${e1 && Math.abs(b) + Math.abs(cc) > 1e-9 ? " · 고유 방향이 하나뿐: 대각화 불가" : ""}`;
    }
    k.out(`A = [[${fmt(a, 2)}, ${fmt(b, 2)}], [${fmt(cc, 2)}, ${fmt(d, 2)}]] · ‖AᵀA − AAᵀ‖ = ${fmt(comm, 3)} ${comm < 1e-9 ? "(정규)" : "(정규 아님)"}\n${txt}`);
  }
  S.redraw();
})();
