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

  /* 7. 연주시차 타원과 측정 오차 (03-01) */
  (() => {
    const S = QSim.card("exp-a1-parallax"); if (!S) return;
    const cv = S.$("canvas");
    const fmt = (x) => (x >= 100 ? x.toFixed(0) : x >= 1 ? x.toFixed(2) : x.toPrecision(2));
    function draw() {
      const c = C(), d = 10 ** S.val("ld"), b = S.val("beta") * deg, day = S.val("day"), sp = +S.val("sp");
      const p = 1000 / d;                       // 시차 (mas)
      const L = 2 * Math.PI * day / 365.25;     // 태양에서 본 지구의 방향 (별의 황경 방향에서 잰 각)
      const at = (u) => [-p * Math.sin(u), -p * Math.sin(b) * Math.cos(u)];   // 하늘에서 본 겉보기 위치 (황경, 황위 방향)
      const v = QSim.view(cv, 0.5), g = v.g, W = v.W, H = v.H, half = W / 2;
      // 왼쪽: 위에서 본 지구 궤도 (거리 비율은 실제와 다름)
      const ox = half * 0.5, oy = H * 0.62, R = Math.min(half * 0.32, H * 0.3);
      g.strokeStyle = c.rule; g.lineWidth = 1; g.beginPath(); g.arc(ox, oy, R, 0, 7); g.stroke();
      g.fillStyle = c.acc; g.beginPath(); g.arc(ox, oy, 7, 0, 7); g.fill();
      const ex = ox + R * Math.sin(L), ey = oy + R * Math.cos(L), sx = ox, sy = H * 0.1;
      g.strokeStyle = c.main; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(ex, ey); g.lineTo(sx, sy); g.stroke(); g.setLineDash([]);
      g.fillStyle = c.main; g.beginPath(); g.arc(ex, ey, 5, 0, 7); g.fill();
      g.fillStyle = c.warn; g.beginPath(); g.arc(sx, sy, 4, 0, 7); g.fill();
      g.font = "11px " + getComputedStyle(document.documentElement).getPropertyValue("--f-mono"); g.fillStyle = c.ink2;
      g.fillText("별", sx + 7, sy + 4); g.fillText("태양", ox + 9, oy + 4); g.fillText("지구", ex + 7, ey + 12);
      g.fillStyle = c.ink3; g.fillText("위에서 본 공전 궤도", 6, H - 20); g.fillText("(거리 비율은 실제와 다름)", 6, H - 6);
      // 오른쪽: 하늘에서 본 별의 1년 경로 (mas)
      const s = Math.max(p, sp) * 1.15, k = Math.min((half - 16) / (2 * s), (H - 40) / (2 * s));
      const X = (x) => half * 1.5 + x * k, Y = (y) => H / 2 - y * k;
      g.strokeStyle = c.rule; g.beginPath(); g.moveTo(half, 0); g.lineTo(half, H); g.moveTo(X(-s), Y(0)); g.lineTo(X(s), Y(0)); g.moveTo(X(0), Y(-s)); g.lineTo(X(0), Y(s)); g.stroke();
      g.strokeStyle = c.main; g.lineWidth = 2; g.beginPath();
      for (let i = 0; i <= 120; i++) { const [x, y] = at(2 * Math.PI * i / 120); i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)); }
      g.stroke(); g.lineWidth = 1;
      const [cx, cy] = at(L), rr = (X(sp) - X(0));
      g.fillStyle = c.ink3; g.globalAlpha = 0.25; g.beginPath(); g.arc(X(cx), Y(cy), Math.max(rr, 1), 0, 7); g.fill(); g.globalAlpha = 1;
      g.fillStyle = c.warn; g.beginPath(); g.arc(X(cx), Y(cy), 4, 0, 7); g.fill();
      g.fillStyle = c.ink3; g.fillText("황경 →", X(s) - 46, Y(0) - 5); g.fillText("황위", X(0) + 4, 12);
      const bar = 10 ** Math.floor(Math.log10(s)); g.strokeStyle = c.ink; g.lineWidth = 2; g.beginPath(); g.moveTo(X(s) - 8 - (X(bar) - X(0)), H - 10); g.lineTo(X(s) - 8, H - 10); g.stroke(); g.lineWidth = 1;
      g.fillStyle = c.ink2; g.textAlign = "right"; g.fillText(fmt(bar) + " mas", X(s) - 8, H - 16); g.textAlign = "left";
      const rel = sp / p, ok = rel <= 0.1 + 1e-9, pc = rel * 100, pcs = pc < 1 ? pc.toPrecision(2) : pc < 10 ? pc.toFixed(1) : pc.toFixed(0);
      S.out(`거리 ${fmt(d)} pc (${fmt(d * 3.26)}광년) → 시차 p = 1/d = ${fmt(p)} mas = ${(p / 1000).toPrecision(3)}″\n하늘에서 그리는 타원: 긴반지름 ${fmt(p)} mas(황경 방향), 짧은반지름 p sin β = ${fmt(p * Math.sin(b))} mas\n측정 오차 ${sp} mas → 거리 상대 오차 δd/d = δp/p = ${pcs}% (${ok ? "10% 안: 믿을 만한 거리" : rel < 1 ? "10%보다 큼: 거리 불확실" : "오차가 시차보다 큼: 거리를 잴 수 없음"})\n파랑: 1년 동안의 겉보기 경로, 빨간 점: 지금 위치, 회색 원: 측정 오차 범위`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 8. 회절 한계와 시상: 두 별을 가를 수 있는가 (02-02) */
  (() => {
    const S = QSim.card("exp-a1-resolve"); if (!S) return;
    const cv = S.$("canvas");
    // 에어리 무늬 [2 J1(x)/x]² 표 (x = 0~40)
    const J1 = (x) => { let s = 0; const n = 64; for (let i = 0; i < n; i++) { const t = Math.PI * (i + 0.5) / n; s += Math.cos(t - x * Math.sin(t)); } return s / n; };
    const tab = []; for (let i = 0; i <= 4000; i++) { const x = i / 100; tab.push(x === 0 ? 1 : (2 * J1(x) / x) ** 2); }
    const airy = (x) => { x = Math.abs(x); if (x >= 40) return 0; const i = Math.floor(x * 100), r = x * 100 - i; return tab[i] * (1 - r) + tab[i + 1] * r; };
    const RAD = 206264.8;
    function draw() {
      const c = C(), D = 10 ** S.val("lD"), lam = S.val("lam") * 1e-9, sep = 10 ** S.val("lsep"), see = S.val("see");
      const thR = 1.22 * lam / D * RAD, fwD = 1.03 * lam / D * RAD;       // 레일리 각, 에어리 반치폭 (″)
      const fw = see > 0 ? Math.hypot(see, fwD) : 0;                      // 장노출 상의 반치폭 (가우스 어림)
      const psf = fw > 0 ? (t) => Math.exp(-4 * Math.LN2 * (t / fw) ** 2) : (t) => airy(Math.PI * D * (t / RAD) / lam);
      const I = (t) => psf(t + sep / 2) + psf(t - sep / 2);
      const span = Math.max(sep * 1.6, (fw || thR) * 2.6);
      const v = QSim.view(cv, 0.62), g = v.g, W = v.W, H = v.H, hImg = Math.round(H * 0.42);
      // 위: 검출기에 맺힌 상 (회색조)
      const pw = Math.max(2, Math.round(W / 160)), nx = Math.ceil(W / pw), ny = Math.ceil(hImg / pw);
      let mx = 0; const vals = [];
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const tx = ((i + 0.5) / nx - 0.5) * 2 * span, ty = ((j + 0.5) / ny - 0.5) * 2 * span * hImg / W;
        const r1 = Math.hypot(tx + sep / 2, ty), r2 = Math.hypot(tx - sep / 2, ty), val = psf(r1) + psf(r2); vals.push(val); if (val > mx) mx = val;
      }
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const q = Math.round(255 * Math.sqrt(vals[j * nx + i] / mx)); g.fillStyle = `rgb(${q},${q},${q})`; g.fillRect(i * pw, j * pw, pw, pw);
      }
      // 아래: 두 별을 잇는 선 위의 밝기
      const f = QSim.frame(v, { x0: -span, x1: span, y0: 0, y1: 1.15 });
      const Y = (y) => H - 22 - y * (H - hImg - 34), X = f.X;
      const peak = Math.max(I(sep / 2), I(0), 1e-9);
      g.strokeStyle = c.rule; g.beginPath(); g.moveTo(X(-span), Y(0)); g.lineTo(X(span), Y(0)); g.stroke();
      [[(t) => psf(t + sep / 2) / peak, c.ink3, [4, 3]], [(t) => psf(t - sep / 2) / peak, c.ink3, [4, 3]], [(t) => I(t) / peak, c.main, null]].forEach(([fn, col, dash]) => {
        g.save(); g.strokeStyle = col; g.lineWidth = dash ? 1.2 : 2.2; if (dash) g.setLineDash(dash); g.beginPath();
        for (let i = 0; i <= 400; i++) { const t = -span + 2 * span * i / 400; i ? g.lineTo(X(t), Y(fn(t))) : g.moveTo(X(t), Y(fn(t))); } g.stroke(); g.restore();
      });
      g.font = "11px " + getComputedStyle(document.documentElement).getPropertyValue("--f-mono"); g.fillStyle = c.ink3;
      const tick = 10 ** Math.floor(Math.log10(span)); g.fillText(`눈금 한 칸 = ${tick >= 1 ? tick : tick.toPrecision(1)}″`, 6, H - 6);
      g.strokeStyle = c.ink3; g.beginPath(); for (let t = Math.ceil(-span / tick) * tick; t <= span; t += tick) { g.moveTo(X(t), Y(0)); g.lineTo(X(t), Y(0) + 4); } g.stroke();
      const dip = I(0) / Math.max(I(sep / 2), I(0));
      const res = dip < 0.01 ? "둘로 뚜렷이 떨어져 보임(두 상 사이가 거의 깜깜함)" : dip < 0.95 ? `둘로 보임(가운데가 봉우리보다 ${((1 - dip) * 100).toFixed(0)}% 어두움)` : "하나로 보임(가운데 골이 없음)";
      const lim = see > 0 && see > thR ? `시상 ${see}″이 회절 한계보다 커서 시상이 분해능을 정합니다` : see > 0 ? "회절 한계가 시상보다 커서 회절이 분해능을 정합니다" : "대기가 없는 경우(우주망원경)";
      S.out(`구경 ${D >= 1 ? D.toPrecision(3) + " m" : (D * 100).toPrecision(3) + " cm"}, 파장 ${S.val("lam")} nm → 레일리 한계 1.22λ/D = ${thR < 0.1 ? thR.toPrecision(2) : thR.toFixed(2)}″\n두 별 간격 ${sep < 0.1 ? sep.toPrecision(2) : sep.toFixed(2)}″ = 레일리 한계의 ${(sep / thR).toFixed(2)}배${fw > 0 ? `, 상의 반치폭 약 ${fw.toFixed(2)}″` : ""}\n${res}. ${lim}\n위: 검출기에 맺힌 상(밝기의 제곱근으로 표시), 아래: 두 별을 잇는 선 위의 밝기(회색 점선은 별 하나씩)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
