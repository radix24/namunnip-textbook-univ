/* 천우1 실습 카드 묶음: 하루 동안의 고도, 케플러 궤도, 별의 흑체 스펙트럼과 색지수, 성단 HR도와 나이, 은하 회전 곡선, 허블 법칙 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const rng = (s) => () => { s = (s * 1664525 + 1013904223) % 4294967296; return (s + 0.5) / 4294967296; };
  const gauss = (r) => Math.sqrt(-2 * Math.log(r())) * Math.cos(2 * Math.PI * r());
  const deg = Math.PI / 180;

  /* 1. 하루 동안 별의 고도 (01-01, 01-02) */
  (() => {
    const S = QSim.card("lab-a1-altaz"); if (!S) return;
    const cv = S.$("canvas");
    const alt = (H, dec, lat) => Math.asin(Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(H)) / deg;
    function draw() {
      const c = C(), lat = S.val("lat") * deg, dec = S.val("dec") * deg;
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: -12, x1: 12, y0: -90, y1: 90, xl: "시간각 (h, 0 = 남중)", yl: "고도 (°)" }); f.axes();
      f.path([[-12, 0], [12, 0]], c.ink, 1.5);
      f.fn((h) => alt(h * 15 * deg, dec, lat), c.main, 2.5, null, 400);
      f.fn((h) => alt(h * 15 * deg, 23.4 * deg, lat), c.warn, 1.2, [4, 3], 300); f.fn((h) => alt(h * 15 * deg, -23.4 * deg, lat), c.acc, 1.2, [4, 3], 300);
      const hmax = alt(0, dec, lat), hmin = alt(Math.PI, dec, lat);
      const cosH0 = -Math.tan(lat) * Math.tan(dec), up = cosH0 <= -1 ? 24 : cosH0 >= 1 ? 0 : 2 * Math.acos(cosH0) / deg / 15;
      const kind = cosH0 <= -1 ? "주극성(지지 않음)" : cosH0 >= 1 ? "떠오르지 않음" : `뜨고 짐, 지평선 위 ${up.toFixed(1)}시간`;
      S.out(`위도 ${S.val("lat")}°, 적위 ${S.val("dec")}°: 남중 고도 ${hmax.toFixed(1)}° (90° − 위도 + 적위 = ${(90 - S.val("lat") + S.val("dec")).toFixed(1)}°), 하중 고도 ${hmin.toFixed(1)}°\n${kind}. 천구 북극의 고도 = 위도 ${S.val("lat")}°\n빨간 점선: 하지 태양(적위 +23.4°), 주황 점선: 동지 태양(−23.4°)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 케플러 궤도와 면적 속도 (01-03) */
  (() => {
    const S = QSim.card("lab-a1-kepler"); if (!S) return;
    const cv = S.$("canvas");
    const solveE = (M, e) => { let E = M; for (let i = 0; i < 50; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); return E; };
    function draw() {
      const c = C(), a = S.val("a"), e = S.val("e"), P = Math.pow(a, 1.5), n = 12;
      const pos = (t) => { const E = solveE(2 * Math.PI * t, e); return [a * (Math.cos(E) - e), a * Math.sqrt(1 - e * e) * Math.sin(E)]; };
      const R = a * (1 + e) * 1.08;
      const v = QSim.view(cv, 0.62), f = QSim.frame(v, { x0: -R, x1: R * 0.7, y0: -R * 0.62, y1: R * 0.62, equal: true });
      const orbit = []; for (let i = 0; i <= 400; i++) orbit.push(pos(i / 400)); f.path(orbit, c.ink3, 1.5);
      const g = v.g;
      for (let k = 0; k < n; k++) {
        const pts = [[0, 0]]; for (let i = 0; i <= 20; i++) pts.push(pos((k + i / 20) / n));
        g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(f.X(x), f.Y(y)) : g.moveTo(f.X(x), f.Y(y)))); g.closePath(); g.fillStyle = k % 2 ? c.main : c.acc; g.globalAlpha = 0.25; g.fill(); g.globalAlpha = 1;
        const [x, y] = pos(k / n); f.dot(x, y, c.ink, 3);
      }
      f.dot(0, 0, c.warn, 7); f.text("태양", 0.05 * R, -0.08 * R, c.warn);
      const vp = Math.sqrt((1 + e) / (1 - e)), va = Math.sqrt((1 - e) / (1 + e));   // 평균 궤도 속력 단위
      S.out(`긴반지름 a = ${a.toFixed(2)} AU, 이심률 e = ${e.toFixed(2)}: 근일점 ${(a * (1 - e)).toFixed(2)} AU, 원일점 ${(a * (1 + e)).toFixed(2)} AU\n주기 P = a^1.5 = ${P.toFixed(2)}년. 색칠한 부채꼴 ${n}개는 모두 같은 시간(P/${n})에 쓸고 간 넓이로 넓이가 같다\n근일점 속력 / 원일점 속력 = (1 + e)/(1 − e) = ${(vp / va).toFixed(2)}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 별의 흑체 스펙트럼과 색지수 (03-02) */
  (() => {
    const S = QSim.card("lab-a1-planck"); if (!S) return;
    const cv = S.$("canvas");
    const h = 6.626e-34, c0 = 2.998e8, k = 1.381e-23, sig = 5.67e-8;
    const B = (lam, T) => 2 * h * c0 * c0 / lam ** 5 / (Math.exp(h * c0 / (lam * k * T)) - 1);
    const band = (T, l0, w) => { let s = 0; for (let i = -20; i <= 20; i++) { const l = (l0 + w * i / 40) * 1e-9; s += B(l, T) * Math.exp(-((i / 20) ** 2) * 2); } return s; };
    const bv = (T) => -2.5 * Math.log10(band(T, 440, 100) / band(T, 550, 90)) + 2.5 * Math.log10(band(9600, 440, 100) / band(9600, 550, 90));   // 9600 K에서 0이 되도록 맞춤
    function draw() {
      const c = C(), T = S.val("T"), R = 10 ** S.val("lr");
      const peak = B(2.898e-3 / T, T);
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 100, x1: 2000, y0: 0, y1: 1.15, xl: "파장 (nm)", yl: "세기 (봉우리 = 1)" }); f.axes();
      const g = v.g; [[380, 450, "#8a5cf5"], [450, 495, "#3b7dd8"], [495, 570, "#3fae5a"], [570, 590, "#e2c83a"], [590, 620, "#f08a2c"], [620, 750, "#d9483b"]].forEach(([a0, b0, col]) => { g.fillStyle = col; g.globalAlpha = 0.15; g.fillRect(f.X(a0), f.Y(1.15), f.X(b0) - f.X(a0), f.Y(0) - f.Y(1.15)); g.globalAlpha = 1; });
      f.fn((l) => B(l * 1e-9, 5772) / B(2.898e-3 / 5772, 5772) * (B(2.898e-3 / 5772, 5772) / peak), c.ink3, 1.2, [4, 3], 400);
      f.fn((l) => B(l * 1e-9, T) / peak, c.main, 2.5, null, 400);
      const L = R * R * Math.pow(T / 5772, 4);
      const spec = T > 30000 ? "O" : T > 10000 ? "B" : T > 7500 ? "A" : T > 6000 ? "F" : T > 5200 ? "G" : T > 3700 ? "K" : "M";
      S.out(`표면 온도 ${T} K (분광형 대략 ${spec}형): 봉우리 파장 λ_max = ${(2.898e6 / T).toFixed(0)} nm, 색지수 B − V ≈ ${bv(T).toFixed(2)} (흑체 어림, 9600 K에서 0으로 맞춤)\n반지름 ${R.toPrecision(3)} R☉ → 광도 L = (R/R☉)²(T/T☉)⁴ = ${L.toPrecision(3)} L☉\n회색 점선: 태양(5772 K, 같은 축척)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 성단 HR도와 전향점 (04-04, 03-03) */
  (() => {
    const S = QSim.card("lab-a1-hrd"); if (!S) return;
    const cv = S.$("canvas"); let seed = 3;
    // 주계열 어림: L ∝ M^3.5, T ≈ 5772 M^0.55 (대략), 수명 10^10 M^-2.5 년
    function draw() {
      const c = C(), lt = S.val("lt"), age = 10 ** lt, r = rng(seed), N = 500;
      const Mto = Math.pow(age / 1e10, -1 / 2.5);
      const v = QSim.view(cv, 0.62), f = QSim.frame(v, { x0: 4.75, x1: 3.45, y0: -3, y1: 6, xl: "log₁₀ T (K, 왼쪽이 뜨거움)", yl: "log₁₀ L/L☉" });
      // 가로축이 반대 방향이므로 직접 축을 그림
      f.axes({ noGrid: true });
      let ms = 0, giants = 0, wd = 0;
      for (let i = 0; i < N; i++) {
        const M = 0.3 * Math.pow(1 - r() * (1 - Math.pow(0.3 / 20, 1.35)), -1 / 1.35);   // 살피터 분포 0.3~20 M☉
        let lT, lL, col;
        if (M < Mto) { lT = Math.log10(5772 * Math.pow(M, 0.55)) + 0.01 * gauss(r); lL = 3.5 * Math.log10(M) + 0.05 * gauss(r); col = c.main; ms++; }
        else if (M < Mto * 1.15) { lT = Math.log10(4200 + 500 * r()); lL = 3.5 * Math.log10(Mto) + 0.8 + 1.5 * r(); col = c.warn; giants++; }
        else { if (M > 8) continue; lT = Math.log10(15000 + 20000 * r()); lL = -2 - 1.5 * r(); col = c.ink3; wd++; }
        if (lT > 4.75 || lT < 3.45) continue;
        f.dot(lT, lL, col, 2.5);
      }
      const lTto = Math.log10(5772 * Math.pow(Mto, 0.55)), lLto = 3.5 * Math.log10(Mto);
      f.path([[lTto + 0.05, lLto], [lTto - 0.05, lLto]], c.acc, 2);
      S.out(`성단 나이 ${age >= 1e8 ? (age / 1e8).toFixed(1) + "억 년" : (age / 1e6).toFixed(0) + "백만 년"} → 전향점 질량 M_to = (t/10¹⁰년)^(−1/2.5) = ${Mto.toFixed(2)} M☉, 전향점 광도 약 ${Math.pow(Mto, 3.5).toPrecision(3)} L☉ (주황 막대)\n별 ${N}개(질량 0.3~20 M☉) 중 주계열 ${ms}, 거성 ${giants}, 백색왜성 ${wd} (8 M☉ 넘는 별은 초신성으로 사라짐, 모두 단순 어림 모형)\n파랑: 주계열, 빨강: 거성, 회색: 백색왜성`);
    }
    S.$(".new").addEventListener("click", () => { seed = (seed * 29 + 7) % 99991; draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 5. 은하 회전 곡선과 암흑물질 (05-03) */
  (() => {
    const S = QSim.card("lab-a1-rotation"); if (!S) return;
    const cv = S.$("canvas"); const G = 4.30091e-6;   // kpc (km/s)² / M☉
    function draw() {
      const c = C(), Md = 10 ** S.val("lmd"), Rd = S.val("rd"), vh = S.val("vh"), rc = S.val("rc");
      const Mdisk = (r) => Md * (1 - (1 + r / Rd) * Math.exp(-r / Rd));   // 구형으로 어림한 지수 원반 질량
      const vd = (r) => Math.sqrt(G * Mdisk(r) / r), vH = (r) => vh * Math.sqrt(1 - (rc / r) * Math.atan(r / rc));   // 등온 헤일로
      const vt = (r) => Math.sqrt(vd(r) ** 2 + vH(r) ** 2);
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: 50, y0: 0, y1: 320, xl: "반지름 r (kpc)", yl: "회전 속도 (km/s)" }); f.axes();
      f.fn((r) => (r < 0.05 ? 0 : vd(r)), c.acc, 1.8, [5, 3], 400); f.fn((r) => (r < 0.05 ? 0 : vH(r)), c.ink3, 1.8, [2, 3], 400); f.fn((r) => (r < 0.05 ? 0 : vt(r)), c.main, 2.5, null, 400);
      const Mh = (r) => vH(r) ** 2 * r / G;
      S.out(`원반 질량 ${Md.toExponential(1)} M☉, 원반 척도 ${Rd} kpc, 헤일로 점근 속도 ${vh} km/s, 헤일로 중심핵 ${rc} kpc\nr = 8 kpc: 전체 ${vt(8).toFixed(0)} km/s (원반만 ${vd(8).toFixed(0)}), r = 40 kpc: 전체 ${vt(40).toFixed(0)} km/s (원반만 ${vd(40).toFixed(0)}, 케플러 감소)\n40 kpc 안 질량: 원반 ${Mdisk(40).toExponential(2)}, 헤일로 ${Mh(40).toExponential(2)} M☉ (헤일로/원반 ${(Mh(40) / Mdisk(40)).toFixed(1)}배). 주황: 원반, 회색: 헤일로, 파랑: 합`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 6. 허블 법칙 맞추기 (06-02) */
  (() => {
    const S = QSim.card("lab-a1-hubble"); if (!S) return;
    const cv = S.$("canvas"); let seed = 19;
    function draw() {
      const c = C(), H0 = S.val("h0"), sv = S.val("sv"), dr = S.val("dr") / 100, N = 30, r = rng(seed), dmax = S.val("dmax");
      const pts = []; for (let i = 0; i < N; i++) { const d = dmax * (0.05 + 0.95 * r()), dm = d * (1 + dr * gauss(r)), vel = H0 * d + sv * gauss(r); pts.push([dm, vel]); }
      let sxy = 0, sxx = 0; pts.forEach(([d, vv]) => { sxy += d * vv; sxx += d * d; }); const Hf = sxy / sxx;
      const res = Math.sqrt(pts.reduce((s, [d, vv]) => s + (vv - Hf * d) ** 2, 0) / (N - 1)), sH = res / Math.sqrt(sxx);
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: dmax * 1.15, y0: -500, y1: H0 * dmax * 1.3 + 500, xl: "거리 (Mpc)", yl: "후퇴 속도 (km/s)" }); f.axes();
      pts.forEach(([d, vv]) => f.dot(d, vv, c.main, 4)); f.fn((d) => Hf * d, c.warn, 2); f.fn((d) => H0 * d, c.ink3, 1, [4, 3]);
      const age = 977.8 / Hf;   // 1/H0 (Gyr), H0 in km/s/Mpc
      S.out(`모의 은하 ${N}개: 참 H₀ = ${H0} km/s/Mpc, 고유 운동 ±${sv} km/s, 거리 오차 ${(dr * 100).toFixed(0)}%\n원점 맞춤 H₀ = ${Hf.toFixed(1)} ± ${sH.toFixed(1)} km/s/Mpc (빨강), 참값(회색 점선)\n허블 시간 1/H₀ = ${age.toFixed(1)} Gyr (= ${(age * 10).toFixed(0)}억 년)`);
    }
    S.$(".new").addEventListener("click", () => { seed = (seed * 31 + 5) % 99991; draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
