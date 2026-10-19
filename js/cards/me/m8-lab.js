/* 기계8 기계공학실험(2): 가상 관로 마찰 실험 (01-01) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-piperig"); if (!S) return;
  const [cv] = S.$$("canvas");
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const gauss = (r) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const colebrook = (Re, rr) => { let f = 0.02; for (let i = 0; i < 40; i++) f = Math.pow(-2 * Math.log10(rr / 3.7 + 2.51 / (Re * Math.sqrt(f))), -2); return f; };
  const D = 0.01, L = 1.0, rho = 998, nu = 1.0e-6, A = (Math.PI * D * D) / 4;
  let seed = 2;
  function draw() {
    const c = QSim.col(), rr = S.val("e") / 1000 / D, ns = S.val("ns") / 100, n = S.val("n");
    const r = rng(seed * 101);
    // 유량 0.005~0.25 L/s를 로그 간격으로 n점 측정 (가상)
    const pts = [];
    for (let i = 0; i < n; i++) {
      const Q = 0.005 * Math.pow(50, i / (n - 1)) / 1000, V = Q / A, Re = (V * D) / nu;
      let ftrue = Re < 2000 ? 64 / Re : Re > 4000 ? colebrook(Re, rr) : (r() < (Re - 2000) / 2000 ? colebrook(Re, rr) : 64 / Re);
      const dp = ftrue * (L / D) * 0.5 * rho * V * V, dpm = dp * (1 + ns * gauss(r)) + 2 * gauss(r); // 차압계: 상대 오차 + 2 Pa 잡음
      pts.push([Re, (dpm * D) / (L * 0.5 * rho * V * V), dp]);
    }
    const lg = Math.log10, v = QSim.view(cv, 0.55);
    const f = QSim.frame(v, { x0: lg(400), x1: lg(1.5e5), y0: lg(0.01), y1: lg(0.2), xl: "log Re", yl: "log f", pad: 34 });
    f.axes();
    f.fn((x) => (10 ** x < 2300 ? lg(64 / 10 ** x) : NaN), c.ink3, 1.5, [5, 4]);
    f.fn((x) => (10 ** x > 3000 ? lg(colebrook(10 ** x, 0)) : NaN), c.ink3, 1.5, [2, 3]);
    if (rr > 0) f.fn((x) => (10 ** x > 3000 ? lg(colebrook(10 ** x, rr)) : NaN), c.acc, 2);
    pts.forEach(([Re, fm]) => { if (fm > 0) f.dot(lg(Re), lg(fm), c.warn, 4); });
    const hi = pts[pts.length - 1];
    S.out(`안지름 10 mm, 탭 간격 1 m, 물 20 °C, 거칠기 ε = ${S.val("e").toFixed(3)} mm (ε/D = ${rr.toFixed(4)}), 차압계 오차 ${S.val("ns")}% + 2 Pa (가상)\n측정 ${n}점 (빨강): Re ${Math.round(pts[0][0])} ~ ${Math.round(hi[0])}, 가장 큰 유량에서 f = ${hi[1].toFixed(4)} (Colebrook ${colebrook(hi[0], rr).toFixed(4)})\n점선: 층류 64/Re, 매끈한 관 Colebrook${rr > 0 ? ", 초록: 이 거칠기의 Colebrook" : ""}`);
  }
  S.$(".reset").addEventListener("click", () => { seed++; draw(); });
  S.on(draw); QSim.redrawOn(draw); draw();
})();

/* 기계8 2단원: 주파수 쓸기와 반출력점 (02-02) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-sweep"); if (!S) return;
  const [cv] = S.$$("canvas");
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const gauss = (r) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const fn = 20; // 고유진동수 20 Hz (가상 구조물)
  // 바닥 가진의 진폭 비 |X/Y| = sqrt(1 + (2ζr)²) / sqrt((1 − r²)² + (2ζr)²)
  const H = (f, z) => { const r = f / fn; return Math.sqrt(1 + (2 * z * r) ** 2) / Math.sqrt((1 - r * r) ** 2 + (2 * z * r) ** 2); };
  function draw() {
    const c = QSim.col(), z = S.val("z"), df = S.val("df"), ns = S.val("ns") / 100;
    const r = rng(7), pts = [];
    for (let f = 10; f <= 30 + 1e-9; f += df) pts.push([f, H(f, z) * (1 + ns * gauss(r))]);
    // 측정점에서 최대값과 반출력점(선형 보간)
    let im = 0; pts.forEach((p, i) => { if (p[1] > pts[im][1]) im = i; });
    const pk = pts[im][1], half = pk / Math.SQRT2;
    let f1 = null, f2 = null;
    for (let i = im; i > 0; i--) if (pts[i - 1][1] < half) { const [a, ya] = pts[i - 1], [b, yb] = pts[i]; f1 = a + ((half - ya) * (b - a)) / (yb - ya); break; }
    for (let i = im; i < pts.length - 1; i++) if (pts[i + 1][1] < half) { const [a, ya] = pts[i], [b, yb] = pts[i + 1]; f2 = a + ((ya - half) * (b - a)) / (ya - yb); break; }
    const zest = f1 && f2 ? (f2 - f1) / (2 * pts[im][0]) : null;
    const ymax = Math.max(H(fn, z), pk) * 1.15, v = QSim.view(cv, 0.5);
    const f = QSim.frame(v, { x0: 10, x1: 30, y0: 0, y1: ymax, xl: "가진 진동수 (Hz)", yl: "진폭 비 |X/Y|", pad: 34 });
    f.axes();
    f.fn((x) => H(x, z), c.ink3, 1.5, [4, 3], 600);
    f.path(pts, c.main, 1.5); pts.forEach(([x, y]) => f.dot(x, y, c.main, 3));
    f.path([[10, half], [30, half]], c.acc, 1, [5, 4]);
    if (f1 && f2) { f.dot(f1, half, c.warn, 5); f.dot(f2, half, c.warn, 5); }
    S.out(`가상 구조물: 고유진동수 20 Hz, 참 감쇠비 ${z.toFixed(3)}, 측정 간격 ${df} Hz, 진폭 잡음 ${S.val("ns")}%\n측정 최대 진폭 비 ${pk.toFixed(2)} @ ${pts[im][0].toFixed(2)} Hz (참값 약 ${H(fn, z).toFixed(2)})\n반출력점 ${f1 ? f1.toFixed(2) : "?"} Hz, ${f2 ? f2.toFixed(2) : "?"} Hz → 추정 감쇠비 ${zest ? zest.toFixed(4) : "구할 수 없음 (측정점 부족)"}${zest ? ` (오차 ${(((zest - z) / z) * 100).toFixed(0)}%)` : ""}`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();

/* 기계8 3단원: 냉각 곡선으로 대류 열전달 계수 추정 (03-01) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-cooling"); if (!S) return;
  const [cv] = S.$$("canvas");
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const gauss = (r) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const MAT = { al: { n: "알루미늄", rho: 2700, c: 900, k: 237 }, cu: { n: "구리", rho: 8930, c: 385, k: 400 }, st: { n: "강", rho: 7850, c: 470, k: 50 } };
  function draw() {
    const col = QSim.col(), m = MAT[S.val("m")], h = S.val("h"), D = S.val("D") / 1000, eps = S.val("eps"), dTi = S.val("dTi"), ns = S.val("ns");
    const Tinf = 25, T0 = 100, Lc = D / 6, sig = 5.67e-8;
    // 참 냉각: 대류 + 복사, 1 s 간격 적분, 10 s마다 기록 (열전대 잡음 포함)
    const r = rng(9), rec = []; let T = T0;
    for (let t = 0; t <= 1500; t++) {
      if (t % 10 === 0) rec.push([t, T + ns * gauss(r)]);
      const q = h * (T - Tinf) + eps * sig * ((T + 273.15) ** 4 - (Tinf + 273.15) ** 4);
      T -= (q / (m.rho * m.c * Lc)) * 1;
    }
    // 학생이 쓰는 주위 온도 (오차 포함), 온도 차가 처음의 15% 이상인 점만 맞춤
    const Ti = Tinf + dTi, use = rec.filter(([, y]) => y - Ti > 0.15 * (T0 - Ti)).map(([t, y]) => [t, Math.log((y - Ti) / (T0 - Ti))]);
    const n = use.length, sx = use.reduce((a, p) => a + p[0], 0), sy = use.reduce((a, p) => a + p[1], 0), sxx = use.reduce((a, p) => a + p[0] * p[0], 0), sxy = use.reduce((a, p) => a + p[0] * p[1], 0);
    const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx), tau = -1 / slope, hfit = (m.rho * m.c * Lc) / tau;
    const hr = eps * sig * 4 * ((T0 + Tinf) / 2 + 273.15) ** 3, Bi = (hfit * Lc) / m.k;
    const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: 1500, y0: Tinf - 5, y1: 105, xl: "t (s)", yl: "T (°C)", pad: 34 });
    f.axes();
    rec.forEach(([t, y]) => f.dot(t, y, use.some((u) => u[0] === t) ? col.main : col.ink3, 2.5));
    f.fn((t) => Ti + (T0 - Ti) * Math.exp(-t / tau), col.acc, 2);
    f.path([[0, Ti], [1500, Ti]], col.warn, 1, [5, 4]);
    S.out(`${m.n} 구 지름 ${(D * 1000).toFixed(0)} mm, 참 대류 h = ${h} W/(m²·K), 방사율 ${eps.toFixed(2)} (복사 몫 약 ${hr.toFixed(1)} W/(m²·K)), 열전대 잡음 ±${ns} °C (가상)\n로그 직선 맞춤 (파란 점 ${n}개, 온도 차가 15% 이상인 구간): 시간 상수 ${tau.toFixed(0)} s → h 추정 ${hfit.toFixed(1)} W/(m²·K)\n대류 h와의 차이 ${(((hfit - h) / h) * 100).toFixed(0)}%, Biot 수 ${Bi.toExponential(1)}${Bi > 0.1 ? " (0.1 초과: 집중 열용량 근사가 맞지 않음)" : ""}${dTi ? `\n주위 온도를 ${dTi > 0 ? "+" : ""}${dTi} °C 틀리게 넣음 (빨간 점선)` : ""}`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();

/* 기계8 4단원: 잔차 경향으로 계통 오차 찾기 (04-02) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-agree"); if (!S) return;
  const [cv] = S.$$("canvas");
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const gauss = (r) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const colebrook = (Re) => { let f = 0.02; for (let i = 0; i < 40; i++) f = Math.pow(-2 * Math.log10(2.51 / (Re * Math.sqrt(f))), -2); return f; };
  const D = 0.01, L = 1.0, rho = 998, nu = 1.0e-6, UT = 5; // Colebrook 식 불확도 ±5% (95%)
  let seed = 3;
  function draw() {
    const c = QSim.col(), dd = S.val("dd") / 100, off = S.val("off"), ns = S.val("ns");
    const r = rng(seed * 37), Um = 2 * Math.sqrt(ns * ns + 2.5 * 2.5); // 측정 95% 불확도 (%): 우연 + 안지름 0.5% 몫 2.5%
    const pts = [];
    for (let i = 0; i < 8; i++) {
      const Re = 3000 * Math.pow(50000 / 3000, i / 7), Vt = (Re * nu) / (D * (1 - dd)); // 실제 관 속 속도
      const ft = colebrook(Re), dp = ft * (L / (D * (1 - dd))) * 0.5 * rho * Vt * Vt;
      const dpm = dp * (1 + (ns / 100) * gauss(r)) + off, Q = Vt * Math.PI * (D * (1 - dd)) ** 2 / 4;
      const V = Q / ((Math.PI * D * D) / 4), Rem = (V * D) / nu, fm = (dpm * D) / (L * 0.5 * rho * V * V); // 표시 안지름으로 계산
      const fc = colebrook(Rem), res = ((fm - fc) / fc) * 100;
      pts.push({ Re: Rem, res, En: res / Math.sqrt(Um * Um + UT * UT), dp });
    }
    const lg = Math.log10, v = QSim.view(cv, 0.5);
    const f = QSim.frame(v, { x0: lg(2500), x1: lg(60000), y0: -20, y1: 20, xl: "log Re", yl: "잔차 (%)", pad: 34 });
    f.axes();
    for (let k = -1; k <= 1; k += 2) f.path([[lg(2500), k * UT], [lg(60000), k * UT]], c.ink3, 1, [4, 3]);
    f.path([[lg(2500), 0], [lg(60000), 0]], c.ink3, 1);
    pts.forEach((p) => {
      const x = lg(p.Re), bad = Math.abs(p.En) > 1;
      f.path([[x, p.res - Um], [x, p.res + Um]], bad ? c.warn : c.main, 1.5);
      f.dot(x, p.res, bad ? c.warn : c.main, 4);
    });
    const nbad = pts.filter((p) => Math.abs(p.En) > 1).length, npos = pts.filter((p) => p.res > 0).length, mean = pts.reduce((a, p) => a + p.res, 0) / 8;
    const k = Math.max(npos, 8 - npos), pr = (2 * [0, 0, 0, 0, 70, 56, 28, 8, 1].slice(k).reduce((a, b) => a + b, 0)) / 256; // 같은 부호가 k개 이상일 확률 (이항)
    S.out(`측정 95% 불확도 ±${Um.toFixed(1)}% (막대), Colebrook ±${UT}% (회색 점선), 가상 자료\n|E_n| > 1인 점 ${nbad}/8, 잔차가 양수인 점 ${npos}/8, 평균 잔차 ${mean >= 0 ? "+" : ""}${mean.toFixed(1)}%\n가장 낮은 Re ${Math.round(pts[0].Re)}: 잔차 ${pts[0].res.toFixed(1)}%, 가장 높은 Re ${Math.round(pts[7].Re)}: 잔차 ${pts[7].res.toFixed(1)}%\n우연 오차만 있을 때 부호가 ${k}개 이상 한쪽으로 몰릴 확률 ${(Math.min(pr, 1) * 100).toFixed(0)}%${pr < 0.1 ? " → 계통 오차를 의심" : ""}`);
  }
  S.$(".reset").addEventListener("click", () => { seed++; draw(); });
  S.on(draw); QSim.redrawOn(draw); draw();
})();