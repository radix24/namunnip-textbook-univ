/* 수학11 탐구: 2차 차분 몫 Δ(h,k)/(hk)의 방향 의존성 — 혼합 편도함수의 순서 */
(() => {
  "use strict";
  const S = MKit.setup("card-m11-mixed", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const FN = {
    bad: { name: "xy(x² − y²)/(x² + y²)", f: (x, y) => (x === 0 && y === 0 ? 0 : (x * y * (x * x - y * y)) / (x * x + y * y)) },
    good: { name: "x³y + xy²", f: (x, y) => x * x * x * y + x * y * y },
    sin: { name: "sin(x + 2y) + xy", f: (x, y) => Math.sin(x + 2 * y) + x * y },
  };
  const a = 0, b = 0;
  function draw() {
    const c = QSim.col(), F = FN[k.val("f")], th = (k.val("th") * Math.PI) / 180, s = Math.pow(10, k.val("ls"));
    const Q = (h, kk) => (F.f(a + h, b + kk) - F.f(a + h, b) - F.f(a, b + kk) + F.f(a, b)) / (h * kk);
    const P = QSim.frame(v, { x0: 0, x1: 360, y0: -1.5, y1: 3.5, pad: 28, xl: "(h, k)의 방향 θ (도)", yl: "Δ/(hk)" });
    P.axes();
    const pts = [];
    for (let d = 1; d < 360; d += 1) { if (d % 90 === 0) continue; const t = (d * Math.PI) / 180, val = Q(s * Math.cos(t), s * Math.sin(t)); pts.push([d, Math.max(-1.5, Math.min(3.5, val))]); }
    // 90도마다 끊어 그린다(h 또는 k가 0)
    let seg = [];
    pts.forEach((p, i) => { seg.push(p); if (i === pts.length - 1 || Math.floor(pts[i + 1][0] / 90) !== Math.floor(p[0] / 90)) { P.path(seg, c.main, 2); seg = []; } });
    const val = Math.abs(Math.cos(th)) < 1e-9 || Math.abs(Math.sin(th)) < 1e-9 ? NaN : Q(s * Math.cos(th), s * Math.sin(th));
    if (isFinite(val)) P.dot(k.val("th"), Math.max(-1.5, Math.min(3.5, val)), c.warn, 5);
    // 반복극한: h → 0 먼저면 D21, k → 0 먼저면 D12
    const e = 1e-4, tiny = 1e-7;
    const d21 = Q(tiny, e), d12 = Q(e, tiny);
    k.out(`${F.name}, |(h, k)| = ${s.toExponential(0)}, θ = ${k.val("th")}°: Δ/(hk) = ${isFinite(val) ? fmt(val, 4) : "정의 안 됨(h 또는 k가 0)"}\n먼저 h → 0 (D₂₁f 쪽): ${fmt(d21, 4)} · 먼저 k → 0 (D₁₂f 쪽): ${fmt(d12, 4)}`);
  }
  S.redraw();
})();
