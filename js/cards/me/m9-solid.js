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

/* 기계9 3단원: ㄱ자 앵글의 비대칭 굽힘과 중립축 (03-01) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-angle"); if (!S) return;
  const [cv] = S.$$("canvas");
  function draw() {
    const c = QSim.col(), b = S.val("b"), H = 100, t = 10, phi = (S.val("phi") * Math.PI) / 180, M = 2e6; // N·mm
    // 세로 다리 (왼쪽) + 가로 다리 (아래), 바깥 모서리가 원점
    const rects = [[0, t, 0, H], [t, b, 0, t]];
    let A = 0, sx = 0, sy = 0;
    rects.forEach(([x0, x1, y0, y1]) => { const a = (x1 - x0) * (y1 - y0); A += a; sx += a * (x0 + x1) / 2; sy += a * (y0 + y1) / 2; });
    const cx = sx / A, cy = sy / A;
    let Ix = 0, Iy = 0, Ixy = 0;
    rects.forEach(([x0, x1, y0, y1]) => { const w = x1 - x0, h = y1 - y0, a = w * h, xc = (x0 + x1) / 2 - cx, yc = (y0 + y1) / 2 - cy; Ix += (w * h ** 3) / 12 + a * yc * yc; Iy += (h * w ** 3) / 12 + a * xc * xc; Ixy += a * xc * yc; });
    const Mx = M * Math.cos(phi), My = M * Math.sin(phi), D = Ix * Iy - Ixy * Ixy;
    const ka = (My * Ix + Mx * Ixy) / D, kb = -(Mx * Iy + My * Ixy) / D, sig = (x, y) => ka * x + kb * y;
    const V = [[0, 0], [b, 0], [b, t], [t, t], [t, H], [0, H]].map(([x, y]) => [x - cx, y - cy]);
    const vals = V.map(([x, y]) => sig(x, y));
    const iMax = vals.indexOf(Math.max(...vals)), iMin = vals.indexOf(Math.min(...vals));
    // 대칭 단면 공식을 잘못 쓴 값: −Mx·y/Ix + My·x/Iy
    const naive = V.map(([x, y]) => (-Mx * y) / Ix + (My * x) / Iy);
    const L = Math.max(b, H) * 0.85, v = QSim.view(cv, 0.75);
    const f = QSim.frame(v, { x0: -L, x1: L, y0: -L, y1: L, xl: "x (mm)", yl: "y (mm)", pad: 30, equal: true });
    f.axes({ noGrid: true });
    f.path([...V, V[0]], c.ink, 2);
    // 중립축 ka·x + kb·y = 0 과 잘못된 중립축
    const line = (p, q, col, dash) => { const n = Math.hypot(p, q) || 1, dx = -q / n, dy = p / n; f.path([[-2 * L * dx, -2 * L * dy], [2 * L * dx, 2 * L * dy]], col, 2, dash); };
    line(ka, kb, c.main);
    line(My / Iy, -Mx / Ix, c.ink3, [5, 4]);
    // 하중 방향 (단면 도심에서)
    f.arrow(0, 0, 0.45 * L * Math.sin(phi), -0.45 * L * Math.cos(phi), c.acc, "하중");
    f.dot(V[iMax][0], V[iMax][1], c.warn, 6); f.dot(V[iMin][0], V[iMin][1], c.main, 6);
    const na = (Math.atan2(-ka, kb) * 180) / Math.PI, naD = ((na + 270) % 180) - 90;
    S.out(`ㄱ자 앵글 세로 100 × 가로 ${b} × 두께 10 mm, 도심 (${cx.toFixed(1)}, ${cy.toFixed(1)}) mm, 굽힘 모멘트 2 kN·m\nIx = ${(Ix / 1e6).toFixed(3)}, Iy = ${(Iy / 1e6).toFixed(3)}, Ixy = ${(Ixy / 1e6).toFixed(3)} ×10⁶ mm⁴\n최대 인장 ${vals[iMax].toFixed(0)} MPa (빨강), 최대 압축 ${vals[iMin].toFixed(0)} MPa (파랑), 중립축 기울기 ${naD.toFixed(1)}° (파란 실선)\n대칭 공식을 잘못 쓰면 최대 인장 ${Math.max(...naive).toFixed(0)}, 최대 압축 ${Math.min(...naive).toFixed(0)} MPa (회색 점선이 그 중립축)`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();

/* 기계9 2단원: 평면 응력의 항복 곡면 (Tresca 육각형, von Mises 타원) (02-01) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-yield"); if (!S) return;
  const [cv] = S.$$("canvas");
  function draw() {
    const c = QSim.col(), sx = S.val("sx"), sy = S.val("sy"), t = S.val("txy"), Sy = S.val("Sy");
    const m = (sx + sy) / 2, R = Math.hypot((sx - sy) / 2, t), p1 = m + R, p2 = m - R; // 평면 안 두 주응력 (σ3 방향 0)
    const tr = Math.max(Math.abs(p1), Math.abs(p2), Math.abs(p1 - p2)); // σmax − σmin (0 포함)
    const vm = Math.sqrt(p1 * p1 - p1 * p2 + p2 * p2);
    const L = Math.max(Sy, Math.abs(p1), Math.abs(p2)) * 1.25;
    const v = QSim.view(cv, 0.8), f = QSim.frame(v, { x0: -L, x1: L, y0: -L, y1: L, xl: "σA (MPa)", yl: "σB (MPa)", pad: 30, equal: true });
    f.axes({ noGrid: true });
    // 방향 (cosθ, sinθ)으로 나아가 기준에 닿는 거리
    const ring = (k) => { const pts = []; for (let i = 0; i <= 360; i++) { const a = (i * Math.PI) / 180, x = Math.cos(a), y = Math.sin(a); pts.push([(Sy / k(x, y)) * x, (Sy / k(x, y)) * y]); } return pts; };
    f.path(ring((x, y) => Math.sqrt(x * x - x * y + y * y)), c.main, 2);
    f.path(ring((x, y) => Math.max(Math.abs(x), Math.abs(y), Math.abs(x - y))), c.acc, 2, [6, 4]);
    f.path([[0, 0], [p1, p2]], c.ink3, 1, [3, 3]);
    f.dot(p1, p2, tr > Sy ? c.warn : c.ink, 6);
    S.out(`평면 안 주응력 σA = ${p1.toFixed(1)}, σB = ${p2.toFixed(1)} MPa, 두께 방향 0 (주응력 점: 검정, 항복하면 빨강)\nTresca (초록 점선 육각형): σmax − σmin = ${tr.toFixed(1)} MPa → 안전 계수 ${(Sy / tr).toFixed(2)}\nvon Mises (파란 타원): σv = ${vm.toFixed(1)} MPa → 안전 계수 ${(Sy / vm).toFixed(2)}${tr > Sy && vm <= Sy ? "\nTresca로는 항복, von Mises로는 아직 탄성 (두 기준 사이 영역)" : vm > Sy ? "\n두 기준 모두 항복" : ""}`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();
