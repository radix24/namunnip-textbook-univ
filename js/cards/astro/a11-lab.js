/* 천우11 카드: 경사각 변경 나누기, Lambert 문제(지구→화성), Cowell 적분으로 J2 승교점 이동, CW 방정식의 오차 전파 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const fx = (x, n = 2) => (+x).toFixed(n);
  const deg = Math.PI / 180, MU = 398600.4418, RE = 6378.137, J2 = 1.08263e-3;

  /* 1. 경사각 변경을 근지점과 원지점에 나누기 (01-02) */
  (() => {
    const S = QSim.card("exp-a11-plane"); if (!S) return;
    const cv = S.$("canvas"), r1 = RE + 200, r2 = 42164.17;
    const vc1 = Math.sqrt(MU / r1), vc2 = Math.sqrt(MU / r2), at = (r1 + r2) / 2;
    const vp = Math.sqrt(MU * (2 / r1 - 1 / at)), va = Math.sqrt(MU * (2 / r2 - 1 / at));
    const burn = (v1, v2, di) => Math.sqrt(v1 * v1 + v2 * v2 - 2 * v1 * v2 * Math.cos(di));
    const tot = (i0, f) => { const d1 = burn(vc1, vp, f * i0 * deg), d2 = burn(va, vc2, (1 - f) * i0 * deg); return [d1, d2, d1 + d2]; };
    function draw() {
      const c = C(), i0 = S.val("i0"), f = S.val("f"), [d1, d2, dt] = tot(i0, f);
      let best = [0, 1e9]; for (let k = 0; k <= 1000; k++) { const t = tot(i0, k / 1000)[2]; if (t < best[1]) best = [k / 1000, t]; }
      const sep = burn(vc1, vp, 0) + burn(va, vc2, 0) + 2 * vc2 * Math.sin(i0 * deg / 2);
      const t0 = tot(i0, 0)[2], t1 = tot(i0, 1)[2], ym = Math.max(t0, t1, sep) * 1.08, yl = Math.min(best[1], burn(vc1, vp, 0) + burn(va, vc2, 0)) * 0.95;
      const v = QSim.view(cv, 0.5), fr = QSim.frame(v, { x0: 0, x1: 1, y0: yl, y1: ym, xl: "근지점에서 바꾸는 경사각의 비율", yl: "전체 Δv (km/s)" }); fr.axes();
      fr.fn((x) => tot(i0, x)[2], c.main, 2); fr.path([[0, sep], [1, sep]], c.ink3, 1, [4, 3]);
      fr.dot(f, dt, c.warn, 5); fr.dot(best[0], best[1], c.acc, 4);
      S.out(`고도 200 km 주차 궤도(경사각 ${fx(i0, 1)}°) → 정지 궤도(경사각 0°), Hohmann 전이에 경사각 변경을 결합\n근지점에서 ${fx(f * i0, 2)}°(비율 ${fx(f, 3)}): Δv₁ = ${fx(d1, 3)} km/s, 원지점에서 ${fx((1 - f) * i0, 2)}°: Δv₂ = ${fx(d2, 3)} km/s, 합 ${fx(dt, 3)} km/s\n가장 싼 나누기: 근지점 비율 ${fx(best[0], 3)} (${fx(best[0] * i0, 2)}°), 합 ${fx(best[1], 3)} km/s. 경사각 0°이면 ${fx(burn(vc1, vp, 0) + burn(va, vc2, 0), 3)} km/s\n회색 점선: 원 궤도가 된 뒤 따로 경사각을 바꿀 때 ${fx(sep, 3)} km/s. 빨간 점: 고른 나누기, 주황 점: 가장 싼 나누기`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. Lambert 문제: 지구에서 화성으로 (02-02) */
  (() => {
    const S = QSim.card("lab-a11-lambert"); if (!S) return;
    const cv = S.$("canvas"), MS = 1.32712440018e11, AU = 1.495978707e8, R1 = 1.0 * AU, R2 = 1.524 * AU;
    const Sf = (z) => z > 1e-8 ? (Math.sqrt(z) - Math.sin(Math.sqrt(z))) / Math.pow(z, 1.5) : z < -1e-8 ? (Math.sinh(Math.sqrt(-z)) - Math.sqrt(-z)) / Math.pow(-z, 1.5) : 1 / 6;
    const Cf = (z) => z > 1e-8 ? (1 - Math.cos(Math.sqrt(z))) / z : z < -1e-8 ? (Math.cosh(Math.sqrt(-z)) - 1) / -z : 0.5;
    function lambert(r1v, r2v, dth, tof) {
      const r1 = Math.hypot(...r1v), r2 = Math.hypot(...r2v), A = Math.sin(dth) * Math.sqrt(r1 * r2 / (1 - Math.cos(dth)));
      const y = (z) => r1 + r2 + A * (z * Sf(z) - 1) / Math.sqrt(Cf(z));
      const F = (z) => { const yy = y(z); if (yy < 0) return -Infinity; return Math.pow(yy / Cf(z), 1.5) * Sf(z) + A * Math.sqrt(yy) - Math.sqrt(MS) * tof; };
      let lo = -40, hi = 4 * Math.PI * Math.PI - 1e-6;
      if (F(hi) < 0) return null;
      for (let k = 0; k < 200; k++) { const m = (lo + hi) / 2; if (F(m) > 0) hi = m; else lo = m; }
      const z = (lo + hi) / 2, yy = y(z), f = 1 - yy / r1, g = A * Math.sqrt(yy / MS), gd = 1 - yy / r2;
      return { v1: [(r2v[0] - f * r1v[0]) / g, (r2v[1] - f * r1v[1]) / g], v2: [(gd * r2v[0] - r1v[0]) / g, (gd * r2v[1] - r1v[1]) / g], z };
    }
    function draw() {
      const c = C(), dthD = S.val("dth"), tofd = S.val("tof"), dth = dthD * deg, tof = tofd * 86400;
      const v = QSim.view(cv, 0.62), L = 1.75, f = QSim.frame(v, { x0: -L * 1.45, x1: L * 1.45, y0: -L, y1: L, xl: "x (AU)", yl: "y (AU)" }); f.axes();
      const circ = (r) => { const p = []; for (let k = 0; k <= 200; k++) p.push([r * Math.cos(k * Math.PI / 100), r * Math.sin(k * Math.PI / 100)]); return p; };
      f.path(circ(1), c.ink3, 1, [3, 3]); f.path(circ(1.524), c.ink3, 1, [3, 3]); f.dot(0, 0, c.acc, 5);
      const r1v = [R1, 0], r2v = [R2 * Math.cos(dth), R2 * Math.sin(dth)];
      f.dot(1, 0, c.main, 4); f.dot(1.524 * Math.cos(dth), 1.524 * Math.sin(dth), c.warn, 4);
      if (Math.abs(Math.sin(dth)) < 1e-3) { S.out(`전이각 ${dthD}°: 정확히 180°에서는 두 위치와 태양이 한 줄이라 궤도면이 정해지지 않아 이 방법(보편 변수, Curtis 알고리즘 5.2)이 풀리지 않는다. 179° 또는 181°로 바꿔 보세요`); return; }
      const R = lambert(r1v, r2v, dth, tof);
      if (!R) { S.out(`전이각 ${dthD}°, 비행 시간 ${tofd}일: 한 바퀴 안의 해가 없다(비행 시간이 너무 길다)`); return; }
      // 전이 궤도 그리기: 2체 전파 (작은 간격 RK4)
      let s = [r1v[0], r1v[1], R.v1[0], R.v1[1]]; const pts = [[1, 0]], n = 400, h = tof / n;
      const fn = (t, y) => { const r3 = Math.pow(y[0] * y[0] + y[1] * y[1], 1.5); return [y[2], y[3], -MS * y[0] / r3, -MS * y[1] / r3]; };
      for (let k = 0; k < n; k++) { s = QSim.rk4(fn, 0, s, h); pts.push([s[0] / AU, s[1] / AU]); }
      f.path(pts, c.main, 2);
      const vE = Math.sqrt(MS / R1), vM = Math.sqrt(MS / R2);
      const dv1 = Math.hypot(R.v1[0] - 0, R.v1[1] - vE), dv2 = Math.hypot(R.v2[0] + vM * Math.sin(dth), R.v2[1] - vM * Math.cos(dth));
      const rv = Math.hypot(...R.v1), en = rv * rv / 2 - MS / R1, a = -MS / (2 * en), hh = R1 * R.v1[1], e = Math.sqrt(Math.max(0, 1 + 2 * en * hh * hh / (MS * MS)));
      S.out(`전이각 ${dthD}°, 비행 시간 ${tofd}일: 전이 궤도 긴반지름 ${fx(a / AU, 3)} AU, 이심률 ${fx(e, 3)}\n출발 속도 ${fx(rv, 2)} km/s (지구 공전 ${fx(vE, 2)}), 지구에 대한 초과 속도 v∞ = ${fx(dv1, 2)} km/s\n도착 시 화성에 대한 초과 속도 v∞ = ${fx(dv2, 2)} km/s, 합 ${fx(dv1 + dv2, 2)} km/s\n파란 점: 출발 때 지구, 빨간 점: 도착 때 화성 위치. 원 궤도·한 평면으로 단순화했다`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. Cowell 적분으로 J2 승교점 이동 확인 (03-01, 04-02) */
  (() => {
    const S = QSim.card("lab-a11-j2"); if (!S) return;
    const cv = S.$("canvas");
    const fn = (t, y) => {
      const [x, yy, z] = y, r2 = x * x + yy * yy + z * z, r = Math.sqrt(r2), r3 = r2 * r, k = 1.5 * J2 * MU * RE * RE / (r2 * r3), q = 5 * z * z / r2;
      return [y[3], y[4], y[5], -MU * x / r3 + k * x * (q - 1), -MU * yy / r3 + k * yy * (q - 1), -MU * z / r3 + k * z * (q - 3)];
    };
    function draw() {
      const c = C(), alt = S.val("alt"), inc = S.val("inc") * deg, days = 5, a = RE + alt, v0 = Math.sqrt(MU / a), h = 20;
      let y = [a, 0, 0, 0, v0 * Math.cos(inc), v0 * Math.sin(inc)];
      const nodes = []; let t = 0, zp = 0;
      while (t < days * 86400) {
        const yn = QSim.rk4(fn, t, y, h); t += h;
        if (zp < 0 && yn[2] >= 0) { // 승교점 통과: 각운동량 벡터로 접촉 승교점 경도
          const hx = yn[1] * yn[5] - yn[2] * yn[4], hy = yn[2] * yn[3] - yn[0] * yn[5];
          nodes.push([t / 86400, Math.atan2(hx, -hy) / deg]);
        }
        zp = yn[2]; y = yn;
      }
      for (let k = 1; k < nodes.length; k++) { while (nodes[k][1] - nodes[k - 1][1] > 180) nodes[k][1] -= 360; while (nodes[k][1] - nodes[k - 1][1] < -180) nodes[k][1] += 360; }
      const N = nodes.length, mx = nodes.reduce((s, p) => s + p[0], 0) / N, my = nodes.reduce((s, p) => s + p[1], 0) / N;
      const slope = nodes.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0) / nodes.reduce((s, p) => s + (p[0] - mx) ** 2, 0);
      const n = Math.sqrt(MU / a ** 3), an = -1.5 * n * J2 * (RE / a) ** 2 * Math.cos(inc) / deg * 86400;
      const y0 = Math.min(0, an * days) - 1, y1 = Math.max(0, an * days) + 1;
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: days, y0, y1, xl: "시간 (일)", yl: "승교점 경도 변화 (°)" }); f.axes();
      f.path([[0, 0], [days, an * days]], c.acc, 1.5, [4, 3]);
      nodes.forEach((p) => f.dot(p[0], p[1] - nodes[0][1] + slope * nodes[0][0], c.main, 2.4));
      S.out(`고도 ${alt} km 원 궤도, 경사각 ${fx(inc / deg, 1)}°: Cowell 방법(RK4, 간격 ${h} s)으로 ${days}일 적분, 승교점 통과 ${N}번\n수치 적분의 승교점 이동 ${fx(slope, 3)}°/일, 평균화 이론 −(3/2)nJ₂(R/a)²cos i = ${fx(an, 3)}°/일\n태양동기 조건(+0.986°/일)과의 차 ${fx(slope - 0.9856, 3)}°/일\n파란 점: 승교점을 지날 때마다의 접촉 승교점 경도, 주황 점선: 평균화 이론`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. Clohessy-Wiltshire 방정식으로 궤도 오차 전파 (05-02) */
  (() => {
    const S = QSim.card("lab-a11-cw"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), alt = S.val("alt"), x0 = S.val("dx"), vy0 = S.val("dvy") / 1000, norb = S.val("norb");
      const a = RE + alt, n = Math.sqrt(MU / (a * a * a)) , T = 2 * Math.PI / n, tmax = norb * T;
      const X = (t) => (4 - 3 * Math.cos(n * t)) * x0 + 2 / n * (1 - Math.cos(n * t)) * vy0;
      const Y = (t) => 6 * (Math.sin(n * t) - n * t) * x0 + (4 * Math.sin(n * t) - 3 * n * t) / n * vy0;
      const ys = [], xs = []; let ym = 1;
      for (let k = 0; k <= 600; k++) { const t = tmax * k / 600; ys.push([t / T, Y(t) / 1000]); xs.push([t / T, X(t) / 1000]); ym = Math.max(ym, Math.abs(Y(t) / 1000), Math.abs(X(t) / 1000)); }
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: norb, y0: -ym * 1.1, y1: ym * 1.1, xl: "궤도 수", yl: "위치 오차 (km)" }); f.axes();
      f.path(ys, c.main, 2); f.path(xs, c.warn, 1.6, [5, 3]);
      const drift = -(6 * n * x0 + 3 * vy0) * T;
      S.out(`고도 ${alt} km(주기 ${fx(T / 60, 1)}분): 처음 반지름 방향 오차 ${x0} m, 진행 방향 속도 오차 ${fx(vy0 * 1000, 0)} mm/s\n${norb}바퀴 뒤 진행 방향 오차 ${fx(Y(tmax), 0)} m, 반지름 방향 ${fx(X(tmax), 1)} m\n한 바퀴마다 쌓이는 진행 방향 표류 −(6n·δx₀ + 3δẏ₀)T = ${fx(drift, 1)} m (δẏ₀ = −2n·δx₀ = ${fx(-2 * n * x0 * 1000, 1)} mm/s이면 표류가 없다)\n파란 선: 진행 방향 오차, 빨간 점선: 반지름 방향 오차`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
