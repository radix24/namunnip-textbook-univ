/* 천우15 카드: 하전 입자의 자이로 운동과 표류, 파커 나선, 코로나 질량 방출의 도착(항력 모형), 자기권계면 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const fx = (x, n = 2) => (+x).toFixed(n);

  /* 1. 자이로 운동과 E×B, 자기장 기울기 표류 (01-02) */
  (() => {
    const S = QSim.card("lab-a15-gyro"); if (!S) return;
    const cv = S.$("canvas");
    // 무차원 단위: B₀ = 1(z 방향), 처음 수직 속력 1. 양성자 q/m = +1, 전자 q/m = −4(질량비를 1:4로 줄인 교육용 모형)
    function run(qm, E, g) {
      let x = 0, y = 0, vx = 0, vy = 1; const dt = 0.01, T = 80, Tg = 2 * Math.PI / Math.abs(qm), pts = [], xs = [], ts = [];
      for (let t = 0; t <= T + 1e-9; t += dt) {
        pts.push([x, y]); xs.push(x); ts.push(t);
        // 보리스 방법: 반 전기 가속 → 자기 회전 → 반 전기 가속
        const Bz = 1 + g * y, h = qm * dt / 2;
        let ux = vx, uy = vy + h * E;
        const tz = h * Bz, sz = 2 * tz / (1 + tz * tz);
        const px = ux + uy * tz, py = uy - ux * tz;
        ux = ux + py * sz; uy = uy - px * sz;
        vx = ux; vy = uy + h * E; x += vx * dt; y += vy * dt;
      }
      const n1 = Math.round(Tg / dt), N = xs.length;
      const g0 = xs.slice(0, n1).reduce((a, b) => a + b, 0) / n1, g1 = xs.slice(N - n1).reduce((a, b) => a + b, 0) / n1;
      return { pts, drift: (g1 - g0) / (T - Tg + dt) };
    }
    function draw() {
      const c = C(), sp = S.val("sp"), E = S.val("e"), g = S.val("g"), qm = sp === "p" ? 1 : -4;
      const R = run(qm, E, g), xs = R.pts.map((p) => p[0]), ys = R.pts.map((p) => p[1]);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), w = Math.max(x1 - x0, 4), hgt = Math.max(y1 - y0, 2.5);
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: x0 - 0.5, x1: x0 + w + 0.5, y0: (y0 + y1) / 2 - hgt * 0.8, y1: (y0 + y1) / 2 + hgt * 0.8, xl: "x", yl: "y", equal: true }); f.axes();
      f.path(R.pts.filter((_, i) => i % 3 === 0), sp === "p" ? c.main : c.warn, 1.2); f.dot(0, 0, c.acc, 4);
      const m = 1 / Math.abs(qm), q = Math.sign(qm), thE = E, thG = -(m * 1 * 1) / (2 * q) * g;   // v_E = E/B, v_∇B = −(m v⊥²/2qB²)(∂B/∂y)
      S.out(`${sp === "p" ? "양성자(q/m = +1)" : "전자(q/m = −4, 교육용 질량비)"}, 전기장 E_y = ${fx(E, 2)}, 자기장 기울기 ∂B/∂y = ${fx(g, 2)} (B₀ = 1, 처음 수직 속력 1)\n안내 중심의 x 방향 표류 속도(수치) ${fx(R.drift, 4)}\n이론: E×B 표류 E/B = ${fx(thE, 4)} + 기울기 표류 −(mv⊥²/2qB²)∂B/∂y = ${fx(thG, 4)} → 합 ${fx(thE + thG, 4)}\n주황 점: 출발점. 전기장 표류는 전하·질량과 무관하고, 기울기 표류는 전하 부호에 따라 방향이 반대다`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 파커 나선 (03-02) */
  (() => {
    const S = QSim.card("exp-a15-parker"); if (!S) return;
    const cv = S.$("canvas"), OM = 2 * Math.PI / (25.38 * 86400), AU = 1.496e8;
    function draw() {
      const c = C(), vsw = S.val("v"), rmax = S.val("rm");
      const L = rmax * 1.08, v = QSim.view(cv, 0.62), f = QSim.frame(v, { x0: -L * 1.45, x1: L * 1.45, y0: -L, y1: L, xl: "x (AU)", yl: "y (AU)", equal: true }); f.axes({ noGrid: true });
      for (let k = 0; k < 8; k++) { const p0 = k * Math.PI / 4, pts = []; for (let r = 0.02; r <= rmax; r += rmax / 300) { const ph = p0 - OM * r * AU / vsw; pts.push([r * Math.cos(ph), r * Math.sin(ph)]); } f.path(pts, k % 2 ? c.main : c.warn, 1.3); }
      [1, 1.524, 5.2].forEach((r) => { if (r <= rmax) { const p = []; for (let k = 0; k <= 120; k++) p.push([r * Math.cos(k * Math.PI / 60), r * Math.sin(k * Math.PI / 60)]); f.path(p, c.ink3, 1, [3, 3]); } });
      f.dot(0, 0, c.acc, 6); f.dot(1, 0, c.main, 4); f.text("지구", 1.03, 0.05, c.ink2);
      const psi = (r) => Math.atan(OM * r * AU / vsw) * 180 / Math.PI;
      S.out(`태양풍 속력 ${vsw} km/s, 태양 자전 주기 25.38일(항성 주기): 나선 각 tan ψ = Ωr/v\n지구(1 AU)에서 ψ = ${fx(psi(1), 1)}°, 화성(1.52 AU) ${fx(psi(1.524), 1)}°, 목성(5.2 AU) ${fx(psi(5.2), 1)}°\n태양풍이 1 AU까지 오는 시간 ${fx(AU / vsw / 86400, 2)}일, 그동안 태양이 도는 각 ${fx(OM * AU / vsw * 180 / Math.PI, 1)}°\n선: 태양 표면 근처 8개 경도에서 나온 자기력선(태양은 그림에서 시계 반대 방향으로 자전), 점선: 행성 궤도`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 코로나 질량 방출의 도착 시간: 항력 모형 (03-03) */
  (() => {
    const S = QSim.card("lab-a15-cme"); if (!S) return;
    const cv = S.$("canvas"), AU = 1.496e8, R0 = 20 * 6.957e5;
    const dbm = (v0, w, gam, t) => { const d = v0 - w, s = d >= 0 ? 1 : -1, q = 1 + s * gam * d * t; return { r: s / gam * Math.log(q) + w * t + R0, v: d / q + w }; };
    function draw() {
      const c = C(), v0 = S.val("v0"), w = S.val("w"), gam = S.val("gam") * 1e-7;
      let lo = 0, hi = 30 * 86400; for (let k = 0; k < 80; k++) { const m = (lo + hi) / 2; if (dbm(v0, w, gam, m).r < AU) lo = m; else hi = m; }
      const ta = (lo + hi) / 2, va = dbm(v0, w, gam, ta).v, tc = (AU - R0) / v0;
      const tmax = Math.max(ta, tc) * 1.15 / 3600;
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: tmax, y0: 0, y1: Math.max(v0, w) * 1.1, xl: "시간 (h)", yl: "속력 (km/s)" }); f.axes();
      f.fn((h) => dbm(v0, w, gam, h * 3600).v, c.main, 2); f.path([[0, w], [tmax, w]], c.ink3, 1, [4, 3]);
      f.path([[ta / 3600, 0], [ta / 3600, Math.max(v0, w) * 1.1]], c.warn, 1.2, [4, 3]); f.path([[tc / 3600, 0], [tc / 3600, Math.max(v0, w) * 1.1]], c.acc, 1.2, [2, 3]);
      S.out(`출발 속력 ${v0} km/s(태양 반지름 20배 거리에서), 배경 태양풍 ${w} km/s, 항력 계수 γ = ${fx(gam * 1e7, 2)}×10⁻⁷ km⁻¹\n항력 모형 도착 시간 ${fx(ta / 3600, 1)}시간(${fx(ta / 86400, 2)}일), 도착 속력 ${fx(va, 0)} km/s\n출발 속력이 그대로라고 본 단순 추정 ${fx(tc / 3600, 1)}시간\n파란 선: 속력 변화, 회색 점선: 태양풍 속력, 빨간 점선: 항력 모형 도착, 주황 점선: 단순 추정 도착`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 자기권계면의 위치 (04-01) */
  (() => {
    const S = QSim.card("lab-a15-mp"); if (!S) return;
    const cv = S.$("canvas"), B0 = 3.1e-5, MU0 = 4e-7 * Math.PI, MP = 1.6726e-27;
    function draw() {
      const c = C(), n = S.val("n"), vsw = S.val("v");
      const P = n * 1e6 * MP * (vsw * 1e3) ** 2, r0 = Math.pow(2 * B0 * B0 / (MU0 * P), 1 / 6), al = 0.58;
      const L = 30, v = QSim.view(cv, 0.56), f = QSim.frame(v, { x0: -L * 1.1, x1: 16, y0: -L * 0.62, y1: L * 0.62, xl: "x (지구 반지름, 태양 쪽 +)", yl: "y", equal: true }); f.axes({ noGrid: true });
      const pts = []; for (let th = -2.6; th <= 2.6; th += 0.02) { const r = r0 * Math.pow(2 / (1 + Math.cos(th)), al); pts.push([r * Math.cos(th), r * Math.sin(th)]); } f.path(pts, c.main, 2);
      const geo = []; for (let k = 0; k <= 100; k++) geo.push([6.6 * Math.cos(k * Math.PI / 50), 6.6 * Math.sin(k * Math.PI / 50)]); f.path(geo, c.warn, 1, [4, 3]);
      f.dot(0, 0, c.acc, 5); f.arrow(14, 8, -4, 0, c.ink3, "태양풍");
      S.out(`태양풍 밀도 ${fx(n, 1)} cm⁻³, 속력 ${vsw} km/s: 동압 ρv² = ${fx(P * 1e9, 2)} nPa\n압력 균형 (2B₀)²/2μ₀·(R_E/r)⁶ = ρv²에서 낮 쪽 자기권계면 거리 r₀ = ${fx(r0, 1)} 지구 반지름\n${r0 < 6.6 ? "정지 궤도(6.6 R_E)가 자기권 밖으로 드러난다: 정지 위성이 태양풍에 직접 노출" : "정지 궤도(6.6 R_E)는 자기권 안에 있다"}\n파란 선: 자기권계면(낮 쪽 거리 r₀, Shue 외 1998 모양식 α = 0.58), 빨간 점선: 정지 궤도`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
