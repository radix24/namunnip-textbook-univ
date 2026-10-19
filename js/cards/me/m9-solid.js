/* 기계9 응용고체역학: 3차원 응력의 주응력과 세 모어 원 (01-01) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-stress3d"); if (!S) return;
  const [cv1, cv2] = S.$$("canvas");
  // 대칭 응력 텐서의 주응력: 특성 방정식 σ³ − I1σ² + I2σ − I3 = 0의 세 실근 (삼각함수 해법)
  const roots = (I1, I2, I3) => {
    const p = I1 / 3, q = (I1 * I1 - 3 * I2) / 9, r = (2 * I1 ** 3 - 9 * I1 * I2 + 27 * I3) / 54;
    if (q < 1e-12) return [p, p, p];
    const th = Math.acos(Math.max(-1, Math.min(1, r / q ** 1.5)));
    return [0, 1, 2].map((k) => p + 2 * Math.sqrt(q) * Math.cos((th + 2 * k * Math.PI) / 3)).sort((a, b) => b - a);
  };
  function draw() {
    const c = QSim.col(), [sx, sy, sz, txy, tyz, tzx] = ["sx", "sy", "sz", "txy", "tyz", "tzx"].map((k) => S.val(k));
    const I1 = sx + sy + sz, I2 = sx * sy + sy * sz + sz * sx - txy * txy - tyz * tyz - tzx * tzx;
    const I3 = sx * sy * sz + 2 * txy * tyz * tzx - sx * tyz * tyz - sy * tzx * tzx - sz * txy * txy;
    const [s1, s2, s3] = roots(I1, I2, I3).map((s) => (Math.abs(s) < 1e-6 ? 0 : s)), tmax = (s1 - s3) / 2;
    // 1) 특성 방정식의 그래프
    const P = (s) => s ** 3 - I1 * s * s + I2 * s - I3;
    const lo = Math.min(-150, s3 - 20), hi = Math.max(150, s1 + 20);
    let ym = 1; for (let i = 0; i <= 200; i++) ym = Math.max(ym, Math.abs(P(lo + ((hi - lo) * i) / 200)));
    ym = Math.min(ym, Math.max(Math.abs(P(s1 + 30)), Math.abs(P(s3 - 30)), 1e4));
    const v1 = QSim.view(cv1, 0.45), f1 = QSim.frame(v1, { x0: lo, x1: hi, y0: -ym, y1: ym, xl: "σ (MPa)", yl: "σ³ − I₁σ² + I₂σ − I₃", pad: 34 });
    f1.axes({ noGrid: true });
    f1.fn(P, c.main, 2);
    [s1, s2, s3].forEach((s, i) => { f1.dot(s, 0, c.warn, 5); f1.text(`σ${i + 1}`, s, ym * 0.12, c.warn, "center"); });
    // 2) 세 모어 원
    const R = Math.max(Math.abs(s1), Math.abs(s3), 20) * 1.15;
    const v2 = QSim.view(cv2, 0.55), f2 = QSim.frame(v2, { x0: -R, x1: R, y0: -0.6 * R, y1: 0.6 * R, xl: "σ", yl: "τ", pad: 30, equal: true });
    f2.axes({ noGrid: true });
    const circ = (a, b, col, w) => { const m = (a + b) / 2, r = Math.abs(a - b) / 2, pts = []; for (let i = 0; i <= 120; i++) { const t = (i / 120) * 2 * Math.PI; pts.push([m + r * Math.cos(t), r * Math.sin(t)]); } f2.path(pts, col, w); };
    circ(s1, s3, c.main, 2); circ(s1, s2, c.acc, 1.5); circ(s2, s3, c.acc, 1.5);
    [s1, s2, s3].forEach((s) => f2.dot(s, 0, c.warn, 4));
    f2.dot((s1 + s3) / 2, tmax, c.ink2, 4); f2.text(`τmax ${tmax.toFixed(1)}`, (s1 + s3) / 2, tmax + 0.06 * R, c.ink2, "center");
    S.out(`불변량 I₁ = ${I1.toFixed(0)}, I₂ = ${I2.toFixed(0)}, I₃ = ${I3.toFixed(0)}\n주응력 σ₁ = ${s1.toFixed(1)}, σ₂ = ${s2.toFixed(1)}, σ₃ = ${s3.toFixed(1)} MPa (합 ${(s1 + s2 + s3 + 0).toFixed(1).replace("-0.0", "0.0")} = I₁)\n최대 전단 응력 τmax = (σ₁ − σ₃)/2 = ${tmax.toFixed(1)} MPa${Math.abs(sz) < 1e-9 && Math.abs(tyz) < 1e-9 && Math.abs(tzx) < 1e-9 ? "\n평면 응력 상태: 주응력 하나가 0" : ""}`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();
