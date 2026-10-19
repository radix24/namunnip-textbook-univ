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

/* 기계9 4단원: 두꺼운 실린더의 Lamé 응력 분포 (04-01) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-lame"); if (!S) return;
  const [cv] = S.$$("canvas");
  function draw() {
    const c = QSim.col(), pi = S.val("pi"), po = S.val("po"), k = S.val("k"), a = 50, b = a * k;
    const A = (pi * a * a - po * b * b) / (b * b - a * a), B = ((pi - po) * a * a * b * b) / (b * b - a * a);
    const st = (r) => A + B / (r * r), sr = (r) => A - B / (r * r);
    const thin = (pi * a) / (b - a); // 얇은 식 (안쪽 반지름 기준)
    const tr = (r) => Math.max(st(r), sr(r), 0) - Math.min(st(r), sr(r), 0); // Tresca (σz 무시, 0 포함)
    const ys = [st(a), sr(a), st(b), sr(b), thin, tr(a)], lo = Math.min(...ys, 0), hi = Math.max(...ys, 10);
    const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: a, x1: b, y0: lo - 0.08 * (hi - lo), y1: hi + 0.08 * (hi - lo), xl: "r (mm)", yl: "응력 (MPa)", pad: 36 });
    f.axes();
    f.fn(st, c.main, 2.5); f.fn(sr, c.acc, 2.5); f.fn(tr, c.warn, 1.5, [5, 4]);
    if (po === 0) f.path([[a, thin], [b, thin]], c.ink3, 1.5, [2, 3]);
    const Tin = tr(a);
    S.out(`안쪽 반지름 50 mm, 바깥 ${b.toFixed(0)} mm (b/a = ${k}), 내압 ${pi}, 외압 ${po} MPa\n안쪽: 원주 ${st(a).toFixed(1)} (파랑), 반지름 ${(sr(a) + 0).toFixed(1).replace("-0.0", "0.0")} (초록) MPa / 바깥: 원주 ${st(b).toFixed(1)}, 반지름 ${sr(b).toFixed(1)} MPa\n안쪽 Tresca 등가 응력 ${Tin.toFixed(1)} MPa (빨간 점선${pi > 0 ? `, 내압의 ${(Tin / pi).toFixed(2)}배` : ""})${po === 0 && pi > 0 ? `\n얇은 식 p·a/t = ${thin.toFixed(1)} MPa (회색 점선), 실제 최대 원주 응력보다 ${(((st(a) - thin) / st(a)) * 100).toFixed(0)}% 작음` : ""}`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();

/* 기계9 5단원: 최소 일의 원리, 반력을 바꾸며 에너지 보기 (05-01) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-leastwork"); if (!S) return;
  const [cv1, cv2] = S.$$("canvas");
  const L = 2, EI = 1.44e5; // m, N·m²
  function draw() {
    const c = QSim.col(), w = S.val("w") * 1000, R = S.val("R") * 1000;
    // 롤러에서 x인 곳 M = R x − w x²/2
    const U = (r) => (r * r * L ** 3 / 3 - (r * w * L ** 4) / 4 + (w * w * L ** 5) / 20) / (2 * EI);
    const dRoll = (w * L ** 4 / 8 - (R * L ** 3) / 3) / EI; // 롤러 점 처짐 (아래 +)
    const Rt = (3 * w * L) / 8;
    const Rmax = Math.max(8000, 2 * Rt), Umax = Math.max(U(0), U(Rmax)) * 1.1;
    const v1 = QSim.view(cv1, 0.45), f1 = QSim.frame(v1, { x0: 0, x1: Rmax / 1000, y0: 0, y1: Umax, xl: "R (kN)", yl: "U (J)", pad: 34 });
    f1.axes();
    f1.fn((r) => U(r * 1000), c.main, 2);
    f1.dot(R / 1000, U(R), c.warn, 6); f1.dot(Rt / 1000, U(Rt), c.acc, 5);
    // 기울기 (= 롤러 점 처짐) 접선
    const sl = -dRoll * 1000, dx = Rmax / 1000 / 8;
    f1.path([[R / 1000 - dx, U(R) - sl * dx], [R / 1000 + dx, U(R) + sl * dx]], c.warn, 1.5, [4, 3]);
    // 처짐 모양: 고정단(s = 0)에서 수치 적분, y'' = M/EI
    const N = 200, ys = [[0, 0]]; let y = 0, yp = 0;
    for (let i = 0; i < N; i++) { const s = ((i + 0.5) * L) / N, x = L - s, M = R * x - (w * x * x) / 2; yp += (M / EI) * (L / N); y += yp * (L / N); ys.push([((i + 1) * L) / N, y]); }
    const ym = Math.max(0.03, ...ys.map((p) => Math.abs(p[1]))) * 1.2;
    const v2 = QSim.view(cv2, 0.35), f2 = QSim.frame(v2, { x0: -0.1, x1: L + 0.1, y0: -ym * 1000, y1: ym * 1000, xl: "위치 (m)", yl: "처짐 (mm)", pad: 34 });
    f2.axes({ noGrid: true });
    f2.path([[0, 0], [L, 0]], c.ink3, 1, [3, 3]);
    f2.path(ys.map(([s, yy]) => [s, yy * 1000]), c.main, 2.5);
    f2.dot(L, 0, c.acc, 5); f2.path([[-0.04, -ym * 600], [-0.04, ym * 600]], c.ink, 4);
    S.out(`길이 2 m, EI = 1.44×10⁵ N·m², 균일 하중 ${S.val("w")} kN/m, 시험 반력 R = ${S.val("R").toFixed(2)} kN\n저장 에너지 U = ${U(R).toFixed(2)} J, 기울기 dU/dR에 해당하는 롤러 점 처짐 ${(dRoll * 1000).toFixed(2)} mm (아래 +)\n실제 반력 3wL/8 = ${(Rt / 1000).toFixed(2)} kN (초록 점, U 최소, 처짐 0)${Math.abs(R - Rt) < 30 ? "\n지금 R이 실제 반력과 같습니다" : ""}`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();

/* 기계9 6단원: 편심 하중 기둥의 시컨트 곡선 (06-01) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-secant"); if (!S) return;
  const [cv] = S.$$("canvas");
  const E = 200e3, Sy = 250, d = 50, A = (Math.PI * d * d) / 4, I = (Math.PI * d ** 4) / 64, r = Math.sqrt(I / A), c = 25; // mm, MPa
  function draw() {
    const col = QSim.col(), e = S.val("e"), L = S.val("L") * 1000, P = S.val("P") * 1000;
    const Pcr = (Math.PI ** 2 * E * I) / (L * L);
    const smax = (p) => (p / A) * (1 + ((e * c) / (r * r)) / Math.cos((L / (2 * r)) * Math.sqrt(p / (E * A))));
    // 항복 하중: σmax = Sy (이분법)
    let lo = 0, hi = Math.min(Pcr, Sy * A) * 0.999999;
    for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (smax(m) > Sy) hi = m; else lo = m; }
    const Py = lo, Pmax = Math.min(Pcr, Sy * A) * 1.05;
    const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: 0, x1: Pmax / 1000, y0: 0, y1: 400, xl: "P (kN)", yl: "σmax (MPa)", pad: 36 });
    f.axes();
    f.fn((p) => { const s = smax(p * 1000); return p * 1000 < Pcr && s > 0 ? Math.min(s, 450) : NaN; }, col.main, 2.5);
    f.fn((p) => (p * 1000 * (1 + (e * c) / (r * r))) / A, col.ink3, 1.5, [4, 3]);
    f.path([[0, Sy], [Pmax / 1000, Sy]], col.warn, 1, [5, 4]);
    if (Pcr < Pmax) f.path([[Pcr / 1000, 0], [Pcr / 1000, 400]], col.acc, 1.5, [6, 4]);
    const ok = P < Pcr, sP = ok ? smax(P) : Infinity;
    if (ok && sP < 450) f.dot(P / 1000, sP, sP > Sy ? col.warn : col.ink, 6);
    S.out(`지름 50 mm 강봉 (Sy = 250 MPa), 양끝 핀, 길이 ${S.val("L")} m (세장비 L/r = ${(L / r).toFixed(0)}), 편심 ${e} mm (편심비 ec/r² = ${((e * c) / (r * r)).toFixed(2)})\nEuler 하중 ${(Pcr / 1000).toFixed(1)} kN (초록 세로선), 압축 항복 하중 Sy·A = ${((Sy * A) / 1000).toFixed(0)} kN\n하중 ${S.val("P")} kN에서 최대 응력 ${ok ? sP.toFixed(0) + " MPa" : "Euler 하중 이상: 계산 불가"}, 휨을 무시하면 ${((P * (1 + (e * c) / (r * r))) / A).toFixed(0)} MPa (회색 점선)\n항복이 시작되는 하중 ${(Py / 1000).toFixed(1)} kN = Euler 하중의 ${((Py / Pcr) * 100).toFixed(0)}%`);
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
