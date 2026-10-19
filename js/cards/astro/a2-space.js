/* 천우2 실습 카드 묶음: 행성의 평형 온도, 외계행성 신호, 원 궤도 속도와 주기, 지상 궤적, 반작용 휠 자세 제어 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const deg = Math.PI / 180, GM = 3.986004e14, RE = 6378.137e3;

  /* 1. 행성의 복사 평형 온도 (01-01) */
  (() => {
    const S = QSim.card("lab-a2-teq"); if (!S) return;
    const cv = S.$("canvas");
    const P = [["수성", 0.387, 0.12, 440], ["금성", 0.723, 0.76, 737], ["지구", 1.0, 0.30, 288], ["화성", 1.524, 0.25, 210], ["목성", 5.20, 0.50, 165], ["토성", 9.58, 0.50, 134], ["천왕성", 19.2, 0.30, 76], ["해왕성", 30.1, 0.29, 72]];   // 반사율과 실제 온도(대략, 기체 행성은 1기압 근처)
    const Teq = (d, A) => 278.6 * Math.pow(1 - A, 0.25) / Math.sqrt(d);
    function draw() {
      const c = C(), d = 10 ** S.val("ld"), A = S.val("A");
      const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: -0.6, x1: 1.6, y0: 0, y1: 800, xl: "log₁₀ 거리 (AU)", yl: "온도 (K)" }); f.axes();
      f.fn((x) => Teq(10 ** x, A), c.main, 2.5, null, 300); f.fn((x) => Teq(10 ** x, 0), c.soft, 1, [4, 3], 300);
      P.forEach(([n, dd, AA, Tr]) => { f.dot(Math.log10(dd), Teq(dd, AA), c.acc, 4); f.dot(Math.log10(dd), Tr, c.warn, 4); f.text(n, Math.log10(dd) + 0.02, Math.max(Tr, Teq(dd, AA)) + 25, c.ink3); });
      f.dot(Math.log10(d), Teq(d, A), c.ink, 6);
      S.out(`거리 ${d.toFixed(2)} AU, 반사율 ${A.toFixed(2)}: 평형 온도 T = 278.6 K·(1 − A)^(1/4)/√d = ${Teq(d, A).toFixed(0)} K\n주황 점: 각 행성의 반사율로 계산한 평형 온도, 빨간 점: 실제 평균 온도(대략값, 기체 행성은 1기압 근처)\n실제가 평형보다 높은 곳: 금성·지구(온실 효과), 목성·토성(내부 열)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 외계행성의 시선속도와 통과 (03-03) */
  (() => {
    const S = QSim.card("lab-a2-exo"); if (!S) return;
    const [cvV, cvL] = S.$$("canvas");
    const G = 6.674e-11, MS = 1.989e30, MJ = 1.898e27, RJ = 7.1492e7, RS = 6.957e8, ME = 5.972e24;
    function draw() {
      const c = C(), Mp = S.val("mp"), P = 10 ** S.val("lp"), Rp = S.val("rp"), Ms = S.val("ms"), inc = S.val("inc") * deg;
      const Pd = P * 86400, mp = Mp * ME, ms = Ms * MS, rs = Math.pow(Ms, 0.8) * RS;   // 주계열 R ∝ M^0.8 (어림)
      const K = Math.pow(2 * Math.PI * G / Pd, 1 / 3) * mp * Math.sin(inc) / Math.pow(ms, 2 / 3);
      const a = Math.pow(G * ms * Pd * Pd / (4 * Math.PI * Math.PI), 1 / 3), b = a * Math.cos(inc) / rs;
      const rpm = Rp * 6.371e6, depth = Math.pow(rpm / rs, 2), transit = b < 1;
      const dur = transit ? Pd / Math.PI * Math.asin(Math.sqrt((1 + rpm / rs) ** 2 - b * b) * rs / a) / 3600 : 0;
      const vv = QSim.view(cvV, 0.36), fv = QSim.frame(vv, { x0: 0, x1: 2, y0: -Math.max(K, 1) * 1.4, y1: Math.max(K, 1) * 1.4, xl: "위상(주기 단위)", yl: "시선 속도 (m/s)" }); fv.axes();
      fv.fn((ph) => -K * Math.sin(2 * Math.PI * ph), c.main, 2.5, null, 300);
      const vl = QSim.view(cvL, 0.36), dmax = Math.max(depth * 1.6, 1e-4), fl = QSim.frame(vl, { x0: -0.1, x1: 0.1, y0: 1 - dmax, y1: 1 + dmax * 0.3, xl: "위상(통과 중심 = 0)", yl: "상대 밝기" }); fl.axes({ noGrid: true });
      const half = dur / 24 / P / 2; fl.fn((ph) => (transit && Math.abs(ph) < half ? 1 - depth : 1), c.acc, 2.5, null, 600);
      S.out(`행성 질량 ${Mp} 지구 질량(목성 = 318), 반지름 ${Rp} 지구 반지름, 주기 ${P.toFixed(1)}일, 별 ${Ms} M☉(반지름 약 ${(rs / RS).toFixed(2)} R☉ 가정), 궤도 경사 ${S.val("inc")}°\n시선 속도 진폭 K = ${K < 1 ? K.toFixed(3) : K.toFixed(1)} m/s, 궤도 반지름 ${(a / 1.496e11).toFixed(3)} AU\n${transit ? `통과 깊이 (R_p/R_*)² = ${(depth * 100).toFixed(4)}% (${(depth * 1e6).toFixed(0)} ppm), 지속 약 ${dur.toFixed(1)}시간` : `통과 없음 (충돌 변수 b = ${b.toFixed(2)} > 1, 경사를 90° 가까이 하면 보임)`}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 원 궤도 속도, 주기, 탈출 속도 (04-01, 04-02) */
  (() => {
    const S = QSim.card("lab-a2-orbit"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), hkm = 10 ** S.val("lh"), r = RE + hkm * 1e3, vc = Math.sqrt(GM / r), P = 2 * Math.PI * r / vc, ve = Math.SQRT2 * vc;
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 2, x1: 5.7, y0: 0, y1: 12, xl: "log₁₀ 고도 (km)", yl: "속도 (km/s)" }); f.axes();
      f.fn((x) => Math.sqrt(GM / (RE + 10 ** x * 1e3)) / 1000, c.main, 2.5, null, 300); f.fn((x) => Math.SQRT2 * Math.sqrt(GM / (RE + 10 ** x * 1e3)) / 1000, c.acc, 2, [5, 3], 300);
      [[400, "ISS"], [20200, "GPS"], [35786, "GEO"], [384400 - 6378, "달"]].forEach(([h, n]) => { const x = Math.log10(h); f.path([[x, 0], [x, 12]], c.ink3, 1, [2, 3]); f.text(n, x + 0.02, 11.2, c.ink3); });
      f.dot(Math.log10(hkm), vc / 1000, c.warn, 6);
      const ps = P >= 172800 ? (P / 86400).toFixed(3) + "일" : P >= 10800 ? (P / 3600).toFixed(2) + "시간" : (P / 60).toFixed(1) + "분";
      S.out(`고도 ${hkm < 1e4 ? hkm.toFixed(0) : hkm.toExponential(3)} km (궤도 반지름 ${(r / 1e3).toFixed(0)} km)\n원 궤도 속도 ${(vc / 1000).toFixed(3)} km/s, 주기 ${ps}, 탈출 속도 ${(ve / 1000).toFixed(3)} km/s (주황 점선)\n단위 질량당 궤도 에너지 −GM/2r = ${(-GM / (2 * r) / 1e6).toFixed(2)} MJ/kg`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 원 궤도 위성의 지상 궤적 (04-03) */
  (() => {
    const S = QSim.card("lab-a2-track"); if (!S) return;
    const cv = S.$("canvas"); const we = 2 * Math.PI / 86164.1;
    function draw() {
      const c = C(), inc = S.val("inc") * deg, hkm = S.val("h"), nrev = S.val("n"), r = RE + hkm * 1e3, n = Math.sqrt(GM / r ** 3), P = 2 * Math.PI / n;
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: -180, x1: 180, y0: -90, y1: 90, xl: "경도 (°)", yl: "위도 (°)" }); f.axes();
      const g = v.g; let seg = [], prev = null, cols = [c.main, c.acc, c.warn, c.ink3];
      const N = 600 * nrev;
      for (let k = 0; k <= N; k++) {
        const t = P * nrev * k / N, u = n * t;   // 승교점에서 잰 궤도 각
        const lat = Math.asin(Math.sin(inc) * Math.sin(u)) / deg;
        let lon = (Math.atan2(Math.cos(inc) * Math.sin(u), Math.cos(u)) - we * t) / deg;
        lon = ((lon + 180) % 360 + 360) % 360 - 180;
        if (prev !== null && Math.abs(lon - prev) > 180) { f.path(seg, cols[Math.floor(t / P) % 4], 2); seg = []; }
        seg.push([lon, lat]); prev = lon;
      }
      f.path(seg, cols[Math.floor(nrev - 1e-9) % 4], 2);
      f.dot(127, 37.6, c.ink, 4); f.text("서울", 129, 40, c.ink);
      const shift = we * P / deg;
      S.out(`궤도 경사 ${S.val("inc")}°, 고도 ${hkm} km → 주기 ${(P / 60).toFixed(1)}분, ${nrev}바퀴 (색이 바퀴마다 바뀜)\n위성이 지나는 위도 범위 ±${Math.min(S.val("inc"), 180 - S.val("inc")).toFixed(1)}°, 한 바퀴마다 궤적이 서쪽으로 ${shift.toFixed(1)}° 옮겨 간다 (지구 자전)\n${S.val("inc") > 90 ? "역행 궤도(경사 > 90°)" : "순행 궤도"}${Math.abs(P - 86164) < 600 ? ". 주기가 항성일과 같아 궤적이 제자리로 돌아옴(정지·지구 동기 궤도)" : ""}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 5. 반작용 휠 PD 자세 제어 (05-03) */
  (() => {
    const S = QSim.card("lab-a2-wheel"); if (!S) return;
    const [cvA, cvW] = S.$$("canvas");
    function draw() {
      const c = C(), Is = 100, Iw = 0.05, kp = S.val("kp"), kd = S.val("kd"), target = S.val("tgt") * deg, dist = S.val("dist") * 1e-4, wmax = 6000 * 2 * Math.PI / 60;
      let th = 0, w = 0, W = 0; const dt = 0.05, T = 300, pa = [], pw = []; let sat = false, settle = null;
      for (let k = 0; k <= T / dt; k++) {
        const t = k * dt; let tau = -(kp * (th - target) + kd * w);   // 위성에 줄 제어 돌림힘
        let dW = -tau / Iw * dt; if (Math.abs(W + dW) > wmax) { dW = Math.sign(W + dW) * wmax - W; tau = -dW * Iw / dt; sat = true; }
        W += dW; w += (tau + dist) / Is * dt; th += w * dt;
        if (k % 10 === 0) { pa.push([t, th / deg]); pw.push([t, W * 60 / (2 * Math.PI)]); }
        if (settle === null && t > 1 && Math.abs(th - target) < 0.02 * Math.abs(target || 1) && Math.abs(w) < 1e-3) settle = t;
      }
      const va = QSim.view(cvA, 0.36), fa = QSim.frame(va, { x0: 0, x1: T, y0: Math.min(0, S.val("tgt")) - 5, y1: Math.max(0, S.val("tgt")) * 1.4 + 5, xl: "시간 (s)", yl: "자세각 (°)" }); fa.axes();
      fa.path(pa, c.main, 2.5); fa.path([[0, S.val("tgt")], [T, S.val("tgt")]], c.ink3, 1, [4, 3]);
      const wm = Math.max(...pw.map((p) => Math.abs(p[1])), 100);
      const vw = QSim.view(cvW, 0.3), fw = QSim.frame(vw, { x0: 0, x1: T, y0: -wm * 1.1, y1: wm * 1.1, xl: "시간 (s)", yl: "휠 회전수 (rpm)" }); fw.axes();
      fw.path(pw, c.acc, 2);
      const z = kd / (2 * Math.sqrt(kp * Is)), wn = Math.sqrt(kp / Is);
      S.out(`위성 관성 모멘트 100 kg·m², 휠 0.05 kg·m² (최대 6000 rpm), 목표 ${S.val("tgt")}°, 외란 돌림힘 ${(dist * 1e4).toFixed(1)}×10⁻⁴ N·m\nPD 이득 k_p = ${kp}, k_d = ${kd} → 고유 진동수 ${wn.toFixed(3)} rad/s, 감쇠비 ζ = ${z.toFixed(2)} ${z < 0.7 ? "(덜 감쇠: 넘침)" : z > 1.2 ? "(과감쇠: 느림)" : "(알맞음)"}\n${settle ? `목표 2% 안에 정착: ${settle.toFixed(0)} s` : "300 s 안에 정착하지 못함"}. 마지막 휠 회전수 ${Math.abs(pw[pw.length - 1][1]) < 0.5 ? "0" : pw[pw.length - 1][1].toFixed(0)} rpm${sat ? " — 휠 포화 발생" : ""}${dist ? " (외란을 흡수하느라 휠이 계속 빨라짐 → 운동량 덤핑 필요)" : ""}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
