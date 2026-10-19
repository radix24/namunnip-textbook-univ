/* 수학2 탐구: 데데킨트 절단 — 분모를 키워 가며 √2 근처 유리수를 왼쪽(A)과 오른쪽으로 가른다 */
(() => {
  "use strict";
  const S = MKit.setup("card-m2-cut", 0.4, draw);
  if (!S) return;
  const { k, v } = S;
  const CUT = {
    s2: { inA: (p, q) => p < 0 || p * p < 2 * q * q, val: Math.SQRT2, tex: "√2: A = {q < 0 또는 q² < 2}" },
    s3: { inA: (p, q) => p < 0 || p * p < 3 * q * q, val: Math.sqrt(3), tex: "√3: A = {q < 0 또는 q² < 3}" },
    half: { inA: (p, q) => 2 * p < 3 * q, val: 1.5, tex: "3/2 (유리수): A = {q < 3/2}" },
  };
  function draw() {
    const c = QSim.col(), C = CUT[k.val("cut")], N = k.val("N"), w = 0.25;
    const f = QSim.frame(v, { x0: C.val - w, x1: C.val + w, y0: 0, y1: 1, pad: 20 });
    let maxA = null, minB = null;
    const pts = [];
    for (let q = 1; q <= N; q++) for (let p = Math.ceil((C.val - w) * q); p <= Math.floor((C.val + w) * q); p++) {
      const x = p / q, a = C.inA(p, q);
      pts.push([x, a, q]);
      if (a && (!maxA || x > maxA[0])) maxA = [x, p, q];
      if (!a && (!minB || x < minB[0])) minB = [x, p, q];
    }
    f.axes({ noGrid: true });
    for (const [x, a, q] of pts) f.path([[x, 0.5 - 0.35 / Math.sqrt(q)], [x, 0.5 + 0.35 / Math.sqrt(q)]], a ? c.main : c.warn, 1);
    f.path([[C.val, 0.05], [C.val, 0.95]], c.ink, 1.5, [3, 3]);
    const fmt = (m) => (m ? `${m[1]}/${m[2]} ≈ ${m[0].toFixed(6)}` : "없음");
    k.out(`${C.tex} · 분모 ${N} 이하의 유리수 (파랑 = A, 빨강 = 나머지)\n`
      + `A의 가장 큰 원소(분모 ≤ ${N}): ${fmt(maxA)} · 나머지의 가장 작은 원소: ${fmt(minB)} · 틈 ${maxA && minB ? (minB[0] - maxA[0]).toExponential(2) : "-"}`
      + (k.val("cut") === "half" ? "\n유리수 절단: 나머지 쪽에는 최솟값 3/2가 있지만 A에는 최댓값이 없다" : "\n무리수 절단: 분모를 키우면 양쪽 끝이 계속 바뀐다. A에 최댓값도, 나머지에 최솟값도 없다"));
  }
  S.redraw();
})();
