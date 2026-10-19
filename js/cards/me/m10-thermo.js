/* 기계10 응용열역학: Clausius-Clapeyron 직선으로 증발 잠열 추정 (02-02) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-clapeyron"); if (!S) return;
  const [cv] = S.$$("canvas");
  // 물의 포화 압력 (kPa)과 증발 잠열 (kJ/kg), 증기표 값
  const TAB = [[20, 2.339, 2453.5], [30, 4.247, 2429.8], [40, 7.385, 2406.0], [50, 12.35, 2382.0], [60, 19.95, 2357.7], [70, 31.20, 2333.0], [80, 47.42, 2308.0], [90, 70.18, 2282.5], [100, 101.42, 2256.4], [110, 143.38, 2229.7], [120, 198.67, 2202.1], [130, 270.28, 2173.7], [140, 361.53, 2144.3], [150, 476.16, 2113.8], [160, 618.23, 2082.0], [170, 792.18, 2048.8], [180, 1002.8, 2014.2], [190, 1255.2, 1977.9], [200, 1554.9, 1939.8]];
  const R = 0.4615, K = 273.15;
  const at = (T) => TAB.find((r) => r[0] === T);
  function draw() {
    const c = QSim.col(), T1 = S.val("T1"), T2 = S.val("T2"), Tq = S.val("Tq");
    const [a, b] = T1 < T2 ? [T1, T2] : [T2, T1];
    const v = QSim.view(cv, 0.55);
    const f = QSim.frame(v, { x0: 1000 / (200 + K) - 0.05, x1: 1000 / (20 + K) + 0.05, y0: 0, y1: 8, xl: "1000/T (1/K)", yl: "ln P (P: kPa)", pad: 34 });
    f.axes();
    TAB.forEach(([T, P]) => f.dot(1000 / (T + K), Math.log(P), T === a || T === b ? c.warn : c.ink3, T === a || T === b ? 6 : 4));
    if (a === b) { S.out("두 기준 온도를 다르게 고르세요."); return; }
    const p1 = at(a), p2 = at(b);
    const hfg = (R * Math.log(p2[1] / p1[1])) / (1 / (a + K) - 1 / (b + K));
    const lnP = (T) => Math.log(p1[1]) + (hfg / R) * (1 / (a + K) - 1 / (T + K));
    f.fn((x) => lnP(1000 / x - K), c.main, 2);
    const q = at(Tq), Pq = Math.exp(lnP(Tq)), href = (p1[2] + p2[2]) / 2;
    f.dot(1000 / (Tq + K), lnP(Tq), c.acc, 6);
    S.out(`기준 두 점 ${a} °C (${p1[1]} kPa), ${b} °C (${p2[1]} kPa)를 지나는 직선 (빨간 점, 파란 선)\n기울기로 구한 h_fg = ${hfg.toFixed(0)} kJ/kg, 두 온도의 증기표 h_fg 평균 ${href.toFixed(0)} kJ/kg (차이 ${(((hfg - href) / href) * 100).toFixed(1)}%)\n${Tq} °C 포화 압력 추정 ${Pq.toPrecision(4)} kPa, 증기표 ${q[1]} kPa (오차 ${(((Pq - q[1]) / q[1]) * 100).toFixed(1)}%) (초록 점)`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();

/* 기계10 4단원: 과잉 공기와 예열에 따른 단열 화염 온도 (04-02) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-flame"); if (!S) return;
  const [cv] = S.$$("canvas");
  // 연료: C, H 원자 수와 저위 발열량 (kJ/kmol, 생성 엔탈피 차)
  const FUEL = { ch4: { n: "메탄 CH₄", C: 1, H: 4, Q: 802310 }, c3h8: { n: "프로판 C₃H₈", C: 3, H: 8, Q: 2043990 }, h2: { n: "수소 H₂", C: 0, H: 2, Q: 241820 } };
  // 298~2000 K 평균 몰 비열 (kJ/(kmol·K)), 어림 모델
  const CP = { co2: 53.7, h2o: 42.7, n2: 33.0, o2: 34.8, air: 30.0 };
  const Tad = (fu, ex, Tp) => {
    const o2 = (fu.C + fu.H / 4) * (1 + ex), cpP = fu.C * CP.co2 + (fu.H / 2) * CP.h2o + o2 * 3.76 * CP.n2 + (o2 - (fu.C + fu.H / 4)) * CP.o2;
    return 298 + (fu.Q + o2 * 4.76 * CP.air * (Tp - 298)) / cpP;
  };
  function draw() {
    const c = QSim.col(), fu = FUEL[S.val("fuel")], ex = S.val("ex") / 100, Tp = S.val("Tp") + 273;
    const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: 300, y0: 600, y1: 3000, xl: "과잉 공기 (%)", yl: "단열 화염 온도 (K)", pad: 38 });
    f.axes();
    f.fn((x) => Tad(fu, x / 100, 298), c.ink3, 1.5, [4, 3]);
    f.fn((x) => Tad(fu, x / 100, Tp), c.main, 2.5);
    f.path([[0, 1800], [300, 1800]], c.warn, 1, [5, 4]);
    const T = Tad(fu, ex, Tp), o2 = (fu.C + fu.H / 4) * (1 + ex);
    f.dot(ex * 100, T, c.warn, 6);
    const M = fu.C * 12.011 + fu.H * 1.008, AF = (o2 * 4.76 * 28.97) / M;
    S.out(`${fu.n}, 과잉 공기 ${(ex * 100).toFixed(0)}% (공기연료비 ${AF.toFixed(1)}), 공기 예열 ${S.val("Tp")} °C\n단열 화염 온도 약 ${T.toFixed(0)} K (${(T - 273).toFixed(0)} °C), 예열 없으면 ${Tad(fu, ex, 298).toFixed(0)} K (회색 점선)\n평균 비열 어림 모델(해리 무시). 빨간 점선 1800 K: NOx가 빠르게 늘기 시작하는 대략의 온도`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();

/* 기계10 5단원: CO₂ 해리 평형과 Gibbs 함수 최소 (05-01) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-equil"); if (!S) return;
  const [cv1, cv2] = S.$$("canvas");
  // CO₂ ⇌ CO + ½O₂ : 표의 ln Kp (2000 K −6.635, 3000 K −1.111)를 A − B/T로 맞춘 근사
  const B = (-1.111 + 6.635) / (1 / 2000 - 1 / 3000), A = -1.111 + B / 3000;
  const lnK = (T) => A - B / T;
  const lhs = (a, P) => ((a * Math.sqrt(a / 2)) / (1 - a)) * Math.sqrt(P / (1 + a / 2));
  const solve = (T, P) => { const K = Math.exp(lnK(T)); let lo = 1e-12, hi = 1 - 1e-12; for (let i = 0; i < 100; i++) { const m = (lo + hi) / 2; if (lhs(m, P) > K) hi = m; else lo = m; } return lo; };
  // 반응 진행 a에 대한 무차원 Gibbs 함수 G/(RuT) (기준: CO₂ 1 kmol), ΔG°/(RuT) = −ln Kp
  const Gn = (a, T, P) => { const N = 1 + a / 2, y = [(1 - a) / N, a / N, a / 2 / N], n = [1 - a, a, a / 2]; let g = a * -lnK(T); n.forEach((ni, i) => { if (ni > 0) g += ni * Math.log(y[i] * P); }); return g; };
  function draw() {
    const c = QSim.col(), T = S.val("T"), P = S.val("P"), a = solve(T, P);
    const v1 = QSim.view(cv1, 0.45), f1 = QSim.frame(v1, { x0: 1500, x1: 3500, y0: 0, y1: 1, xl: "T (K)", yl: "해리 비율 a", pad: 34 });
    f1.axes();
    f1.fn((t) => solve(t, 1), c.ink3, 1.5, [4, 3]);
    f1.fn((t) => solve(t, P), c.main, 2.5);
    f1.dot(T, a, c.warn, 6);
    const gs = []; for (let i = 1; i < 200; i++) gs.push(Gn(i / 200, T, P));
    const gmin = Math.min(...gs), gmax = Math.max(Gn(0.005, T, P), Gn(0.995, T, P));
    const v2 = QSim.view(cv2, 0.4), f2 = QSim.frame(v2, { x0: 0, x1: 1, y0: gmin - 0.05 * (gmax - gmin), y1: gmax, xl: "반응 진행 a", yl: "G/(RuT)", pad: 34 });
    f2.axes({ noGrid: true });
    f2.fn((x) => Gn(x, T, P), c.acc, 2, null, 300);
    f2.dot(a, Gn(a, T, P), c.warn, 6);
    const N = 1 + a / 2;
    S.out(`CO₂ ⇌ CO + ½O₂, ${T} K, ${P} atm: ln Kp = ${lnK(T).toFixed(2)} (표 값을 직선으로 맞춘 근사)\n평형 해리 비율 a = ${a.toFixed(3)} (빨간 점), 1 atm이면 ${solve(T, 1).toFixed(3)} (회색 점선)\n몰분율 CO₂ ${((1 - a) / N).toFixed(3)}, CO ${(a / N).toFixed(3)}, O₂ ${(a / 2 / N).toFixed(3)}\n아래 그림: 반응 진행에 따른 Gibbs 함수, 바닥이 평형`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();

/* 기계10 6단원: 수렴-확대 노즐의 뒤쪽 압력과 흐름 상태 (06-02) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-nozzle"); if (!S) return;
  const [cv] = S.$$("canvas");
  const k = 1.4;
  const AR = (M) => (1 / M) * Math.pow((2 / (k + 1)) * (1 + ((k - 1) / 2) * M * M), (k + 1) / (2 * (k - 1)));
  const pr = (M) => Math.pow(1 + ((k - 1) / 2) * M * M, -k / (k - 1));
  const bis = (f, lo, hi) => { for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (f(m)) lo = m; else hi = m; } return (lo + hi) / 2; };
  const Msub = (a) => bis((m) => AR(m) > a, 1e-6, 1), Msup = (a) => bis((m) => AR(m) < a, 1, 20);
  const p0ratio = (M1) => Math.pow(((k + 1) * M1 * M1) / ((k - 1) * M1 * M1 + 2), k / (k - 1)) * Math.pow((k + 1) / (2 * k * M1 * M1 - (k - 1)), 1 / (k - 1));
  function draw() {
    const c = QSim.col(), Me = S.val("Md"), pb = S.val("pb"), Ae = AR(Me);
    const A = (x) => (x < 0.4 ? 1 + 1.5 * ((0.4 - x) / 0.4) ** 2 : 1 + (Ae - 1) * ((x - 0.4) / 0.6)); // 목 x = 0.4
    const pSub = pr(Msub(Ae)), pDes = pr(Me);
    const M1e = Me, pShockExit = pDes * (1 + ((2 * k) / (k + 1)) * (M1e * M1e - 1));
    const N = 240, xs = [...Array(N + 1)].map((_, i) => i / N);
    let state, curve, xs_shock = null;
    if (pb >= pSub) {
      // 아음속: 출구 압력 = pb가 되는 A* 찾기
      const MeS = bis((m) => pr(m) > pb, 1e-6, 1), Astar = Ae / AR(MeS);
      curve = xs.map((x) => [x, pr(Msub(Math.max(A(x) / Astar, 1.0000001)))]);
      state = pb > 0.999 ? "흐름 없음" : "아음속 (초킹 아님)";
    } else if (pb > pShockExit) {
      // 확대부 안 수직 충격파: 출구 압력이 pb가 되는 충격파 위치 As
      const pex = (As) => { const M1 = Msup(As), r = p0ratio(M1); return r * pr(Msub(Ae * r)); };
      const As = bis((a) => pex(a) > pb, 1.000001, Ae);
      const r = p0ratio(Msup(As));
      xs_shock = 0.4 + (0.6 * (As - 1)) / (Ae - 1);
      curve = xs.map((x) => [x, x < 0.4 ? pr(Msub(A(x))) : x < xs_shock ? pr(Msup(A(x))) : r * pr(Msub((A(x) * r)))]);
      state = "초킹, 확대부 안 수직 충격파";
    } else {
      curve = xs.map((x) => [x, x < 0.4 ? pr(Msub(A(x))) : pr(Msup(Math.max(A(x), 1.0000001)))]);
      state = Math.abs(pb - pDes) < 0.005 ? "설계 상태 (출구 압력 = 뒤쪽 압력)" : pb > pDes ? "과팽창 (출구 밖 경사 충격파)" : "부족팽창 (출구 밖 팽창파)";
    }
    const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: 0, x1: 1.05, y0: 0, y1: 1.05, xl: "노즐 위치", yl: "P/P₀", pad: 34 });
    f.axes({ noGrid: true });
    // 노즐 모양 (위쪽 윤곽을 작게)
    const sc = 0.12 / Math.sqrt(Ae);
    f.path(xs.map((x) => [x, 1.02 - sc * Math.sqrt(A(x)) * 0.5]), c.ink3, 1);
    f.path([[0.4, 0], [0.4, 1.05]], c.ink3, 1, [2, 3]);
    f.path(curve, c.main, 2.5);
    if (xs_shock !== null) f.path([[xs_shock, 0], [xs_shock, 1]], c.warn, 1.5, [5, 3]);
    f.path([[1, pb], [1.05, pb]], c.warn, 3);
    const choked = pb < pSub;
    S.out(`설계 마하수 ${Me.toFixed(1)} (면적비 Ae/A* = ${Ae.toFixed(3)}), 뒤쪽 압력 비 Pb/P₀ = ${pb.toFixed(3)} (오른쪽 빨간 막대)\n상태: ${state}${xs_shock !== null ? ` (충격파 위치 빨간 점선)` : ""}\n경계: 아음속 한계 ${pSub.toFixed(3)}, 출구 충격파 ${pShockExit.toFixed(3)}, 설계 ${pDes.toFixed(3)}\n유량: ${choked ? "초킹, 최대 유량 (더 낮춰도 그대로)" : "최대 유량보다 작음"}`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();

/* 기계10 7단원: 난방 방식의 제1·제2법칙 효율 (07-02) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-exergy"); if (!S) return;
  const [cv] = S.$$("canvas");
  function draw() {
    const c = QSim.col(), Td = S.val("Td") + 273.15, T0 = S.val("T0") + 273.15, fhp = S.val("fhp") / 100, eb = S.val("eb") / 100, ep = S.val("ep") / 100;
    const carnot = Td / (Td - T0), cop = Math.max(1, fhp * carnot), xq = 1 - T0 / Td; // 열 1 kJ의 엑서지
    // [이름, 제1법칙 효율(열/구입 에너지), 제2법칙 효율(열 엑서지/구입 엑서지), 1차 에너지당 열]
    const rows = [
      ["전기 히터", 1, xq, ep],
      ["가스 보일러", eb, xq * eb, eb],
      [`히트펌프 COP ${cop.toFixed(2)}`, cop, xq * cop, ep * cop],
    ];
    const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: 3, y0: 0, y1: 1, xl: "", yl: "제2법칙 효율", pad: 34 });
    f.axes({ noGrid: true });
    rows.forEach(([n, , e2], i) => { const x = i + 0.5; f.path([[x, 0], [x, Math.min(e2, 1)]], i === 2 ? c.main : c.ink3, 28); f.text(`${(e2 * 100).toFixed(0)}%`, x, Math.min(e2, 1) + 0.04, c.ink, "center"); f.text(n.split(" ")[0], x, -0.06 + 0.1, c.ink2, "center"); });
    S.out(`공급 온도 ${S.val("Td")} °C, 주위 ${S.val("T0")} °C: 열 1 kJ의 엑서지 ${xq.toFixed(3)} kJ, Carnot COP ${carnot.toFixed(1)}\n${rows.map(([n, e1, e2, pe]) => `${n}: 제1법칙 ${(e1 * 100).toFixed(0)}%, 제2법칙 ${(e2 * 100).toFixed(1)}%, 1차 에너지 1 kJ당 열 ${pe.toFixed(2)} kJ`).join("\n")}\n(전기는 발전 효율 ${(ep * 100).toFixed(0)}%로 1차 에너지에서 만든다고 봄)`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();

/* 기계10 3단원: 습공기 선도 위의 냉각 제습과 재열 (03-02) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-psychro"); if (!S) return;
  const [cv] = S.$$("canvas");
  const P = 101.325;
  const Pg = (T) => 0.61094 * Math.exp((17.625 * T) / (T + 243.04)); // kPa, Magnus 근사 (0~50 °C)
  const Tdp = (pv) => { const x = Math.log(pv / 0.61094); return (243.04 * x) / (17.625 - x); };
  const W = (pv) => (0.622 * pv) / (P - pv);
  const H = (T, w) => 1.005 * T + w * (2501 + 1.82 * T);
  const PvOf = (w) => (w * P) / (0.622 + w);
  function draw() {
    const c = QSim.col(), T1 = S.val("T1"), RH = S.val("RH") / 100, T2 = S.val("T2"), T3 = Math.max(S.val("T3"), T2);
    const pv1 = RH * Pg(T1), w1 = W(pv1), d1 = Tdp(pv1), h1 = H(T1, w1);
    const wet = T2 < d1, w2 = wet ? W(Pg(T2)) : w1, h2 = H(T2, w2), dw = w1 - w2;
    const q12 = h1 - h2 - dw * 4.186 * T2, h3 = H(T3, w2), q23 = h3 - h2, rh3 = PvOf(w2) / Pg(T3);
    const v = QSim.view(cv, 0.6), f = QSim.frame(v, { x0: 0, x1: 45, y0: 0, y1: 30, xl: "건구 온도 (°C)", yl: "ω (g/kg 건공기)", pad: 34 });
    f.axes();
    [0.2, 0.4, 0.6, 0.8, 1].forEach((r) => { f.fn((T) => { const w = W(r * Pg(T)) * 1000; return w <= 30 ? w : NaN; }, r === 1 ? c.ink : c.ink3, r === 1 ? 2 : 1, r === 1 ? null : [3, 3]); });
    // 과정 1 → (이슬점) → 2 → 3
    const path12 = [[T1, w1 * 1000]];
    if (wet) { path12.push([d1, w1 * 1000]); for (let T = d1; T >= T2; T -= 0.25) path12.push([T, W(Pg(T)) * 1000]); }
    path12.push([T2, w2 * 1000]);
    f.path(path12, c.main, 2.5); f.path([[T2, w2 * 1000], [T3, w2 * 1000]], c.warn, 2.5);
    f.dot(T1, w1 * 1000, c.main, 6); f.text("1", T1 + 0.6, w1 * 1000 + 0.6, c.main);
    f.dot(T2, w2 * 1000, c.acc, 6); f.text("2", T2 - 1.4, w2 * 1000 + 0.6, c.acc);
    f.dot(T3, w2 * 1000, c.warn, 6); f.text("3", T3 + 0.6, w2 * 1000 + 0.6, c.warn);
    if (wet) f.dot(d1, w1 * 1000, c.ink2, 4);
    S.out(`1: ${T1} °C, 상대습도 ${(RH * 100).toFixed(0)}%, ω = ${(w1 * 1000).toFixed(1)} g/kg, 이슬점 ${d1.toFixed(1)} °C, h = ${h1.toFixed(1)} kJ/kg 건공기\n2: 코일 출구 ${T2} °C ${wet ? `(이슬점 아래: 포화, 물 ${(dw * 1000).toFixed(1)} g/kg 응축)` : "(이슬점 위: 물이 빠지지 않음)"}, ω = ${(w2 * 1000).toFixed(1)} g/kg, 상대습도 ${((PvOf(w2) / Pg(T2)) * 100).toFixed(0)}%\n코일 냉각량 ${q12.toFixed(1)} kJ/kg ${wet ? `(현열 약 ${((1.005 + 1.82 * w1) * (T1 - T2)).toFixed(1)}, 나머지는 물을 응축시킨 잠열)` : "(모두 현열)"}\n3: 재열 ${T3} °C, 재열량 ${q23.toFixed(1)} kJ/kg, 공급 공기 상대습도 ${(rh3 * 100).toFixed(0)}%`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();
