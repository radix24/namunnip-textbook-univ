/* 화학과 물리화학 실습 카드 묶음 (화학6 물리화학1, 화학10 물리화학2, 화학15 물리화학실험)
   상자 속 입자와 공액 염료, HCl 진동-회전 스펙트럼, Hückel 분자 오비탈, 연속 반응, 효소 속도론,
   이성분 증기-액체 평형, Arrhenius 도시의 불확도 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const Q = window.QChem;
  const { sci, linfit, bisect, mean, tcrit } = Q;
  const h = 6.62607e-34, c0 = 2.99792e8, me = 9.10938e-31, kB = 1.380649e-23, NA = 6.02214e23, Rg = 8.314;
  const RED = "#b5562a", GRN = "#2f8f5b";
  const wl2rgb = (nm) => {   // 대략적인 스펙트럼 색 (보색이 아니라 빛 자체의 색)
    let r = 0, g = 0, b = 0;
    if (nm < 380 || nm > 750) return "rgb(128,128,128)";
    if (nm < 440) { r = (440 - nm) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; } else if (nm < 510) { g = 1; b = (510 - nm) / 20; }
    else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = (645 - nm) / 65; } else r = 1;
    return `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`;
  };

  /* 1. 상자 속 입자와 공액 염료 (화학6-02-01, 화학15-03-02) */
  (() => {
    const S = QSim.card("lab-ch6-box"); if (!S) return;
    const [cv1, cv2] = S.$$("canvas");
    const OBS = [[1, 523], [3, 604], [5, 706]];   // 가상 측정값 (p: 사슬 탄소 수, nm)
    const lam = (p, l, d) => { const N = p + 3, L = (N * l + 2 * d) * 1e-10; return 8 * me * c0 * L * L / (h * (N + 1)) * 1e9; };
    function draw() {
      const c = C(), p = S.val("p"), l = S.val("l"), d = S.val("d");
      const N = p + 3, L = N * l + 2 * d, nH = N / 2, E = (n) => n * n * h * h / (8 * me * (L * 1e-10) ** 2) / 1.602e-19;
      const lm = lam(p, l, d);
      const v = QSim.view(cv1, 0.55), top = E(nH + 2) * 1.1, f = QSim.frame(v, { x0: 0, x1: 10, y0: 0, y1: top, yl: "에너지 (eV)", pad: 40, noGrid: true }); f.axes({ noGrid: true });
      for (let n = 1; n <= nH + 2; n++) {
        const e = E(n), col = n <= nH ? c.main : c.ink3;
        f.path([[0.6, e], [5.4, e]], col, 2);
        f.text(`n = ${n}`, 5.6, e - top * 0.01, c.ink2);
        if (n <= nH) { f.dot(2.4, e, c.main, 4); f.dot(3.6, e, c.main, 4); }
      }
      f.arrow(3, E(nH), 0, E(nH + 1) - E(nH), c.warn);
      const g = v.g; g.fillStyle = wl2rgb(lm); g.fillRect(f.X(7.4), f.Y(top * 0.85), f.X(9.6) - f.X(7.4), f.Y(top * 0.55) - f.Y(top * 0.85));
      f.text("흡수하는 빛", 8.5, top * 0.9, c.ink2, "center");
      const w = QSim.view(cv2, 0.42), fr = QSim.frame(w, { x0: 0, x1: 7, y0: 300, y1: 900, xl: "사슬 탄소 수 p", yl: "λmax (nm)", pad: 40 }); fr.axes();
      fr.fn((x) => lam(x, l, d), c.main, 2);
      OBS.forEach(([pp, y]) => fr.dot(pp, y, RED, 5));
      fr.dot(p, lm, c.acc, 5);
      const res = OBS.map(([pp, y]) => lam(pp, l, d) - y), rms = Math.sqrt(mean(res.map((r) => r * r)));
      S.out(`p = ${p}: π 전자 ${N}개, 상자 길이 L = ${N}×${l.toFixed(2)} + 2×${d.toFixed(2)} = ${L.toFixed(2)} Å\nHOMO n = ${nH} → LUMO n = ${nH + 1}, ΔE = ${(E(nH + 1) - E(nH)).toFixed(3)} eV, λ = 8mcL²/(h(N+1)) = ${lm.toFixed(0)} nm\n가상 측정값과의 차이: ${OBS.map(([pp, y], i) => `p=${pp} ${res[i] >= 0 ? "+" : ""}${res[i].toFixed(0)} nm`).join(", ")} (제곱평균 ${rms.toFixed(0)} nm)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. HCl 진동-회전 스펙트럼 (화학6-05-01, 화학6-02-02, 화학15-03-01) */
  (() => {
    const S = QSim.card("lab-ch6-rovib"); if (!S) return;
    const cv = S.$("canvas");
    const Be = 10.593, ae = 0.3072, nu0 = 2885.98, mH = 1.007825, m35 = 34.968853, m37 = 36.965903;
    const mu = (m) => mH * m / (mH + m);
    function lines(iso, T, rigid) {
      const sc = Math.sqrt(mu(m35) / mu(iso)), B0 = (Be - ae / 2) * mu(m35) / mu(iso), B1 = rigid ? B0 : (Be - 1.5 * ae) * mu(m35) / mu(iso), v0 = nu0 * sc;
      const pop = (J) => (2 * J + 1) * Math.exp(-B0 * J * (J + 1) * 100 * h * c0 / (kB * T));
      const L = [];
      for (let J = 0; J <= 30; J++) L.push({ br: "R", J, x: v0 + B1 * (J + 1) * (J + 2) - B0 * J * (J + 1), I: pop(J) });
      for (let J = 1; J <= 30; J++) L.push({ br: "P", J, x: v0 + B1 * J * (J - 1) - B0 * J * (J + 1), I: pop(J) });
      return { L, B0, B1, v0 };
    }
    function draw() {
      const c = C(), T = S.val("T"), rigid = S.val("rigid"), iso37 = S.val("iso");
      const A = lines(m35, T, rigid), Bq = lines(m37, T, rigid);
      const Imax = Math.max(...A.L.map((q) => q.I));
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 2580, x1: 3140, y0: 0, y1: 1.12, xl: "파수 (cm⁻¹)", yl: "세기", pad: 36 }); f.axes();
      A.L.forEach((q) => { if (q.x > 2580 && q.x < 3140) f.path([[q.x, 0], [q.x, 0.76 * q.I / Imax]], c.main, 2); });
      if (iso37) Bq.L.forEach((q) => { if (q.x > 2580 && q.x < 3140) f.path([[q.x, 0], [q.x, 0.24 * q.I / Imax]], RED, 2); });
      f.path([[A.v0, 0], [A.v0, 1.05]], c.ink3, 1, [3, 4]);
      const R = (J) => A.L.find((q) => q.br === "R" && q.J === J).x, P = (J) => A.L.find((q) => q.br === "P" && q.J === J).x;
      const B0fit = (R(2) - P(4)) / (4 * 3 + 2), B1fit = (R(3) - P(3)) / (4 * 3 + 2);
      const r0 = Math.sqrt(h / (8 * Math.PI ** 2 * c0 * 100 * mu(m35) / 1000 / NA * B0fit)) * 1e10;
      const Jmax = Math.sqrt(kB * T / (2 * h * c0 * 100 * A.B0)) - 0.5;
      const strongR = A.L.filter((q) => q.br === "R").reduce((b, q) => (q.I > b.I ? q : b)).J;
      const kf = 4 * Math.PI ** 2 * (c0 * 100 * A.v0) ** 2 * mu(m35) / 1000 / NA;
      S.out(`H³⁵Cl, ${T} K${rigid ? ", 강체 회전자(B₁ = B₀)" : ""}: 띠 중심 ${A.v0.toFixed(1)} cm⁻¹ (여기에는 선이 없다)\n`
        + `R(0) ${R(0).toFixed(1)}, R(1) ${R(1).toFixed(1)}, P(1) ${P(1).toFixed(1)}, P(2) ${P(2).toFixed(1)} cm⁻¹ · 가운데 간격 R(0) − P(1) = ${(R(0) - P(1)).toFixed(1)} cm⁻¹ (≈ 4B)\n`
        + `조합 차이: B₀ = [R(2) − P(4)]/14 = ${B0fit.toFixed(3)}, B₁ = [R(3) − P(3)]/14 = ${B1fit.toFixed(3)} cm⁻¹ → 결합 길이 r₀ = ${r0.toFixed(3)} Å\n`
        + `가장 센 R선 J = ${strongR} (식 √(kT/2hcB) − ½ = ${Jmax.toFixed(1)}), 겉보기 힘 상수 k = ${kf.toFixed(0)} N/m`
        + (iso37 ? `\nH³⁷Cl 띠 중심 ${Bq.v0.toFixed(1)} cm⁻¹ (${(Bq.v0 - A.v0).toFixed(1)} cm⁻¹ 이동, 빨간 선)` : ""));
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. Hückel 분자 오비탈 (화학6-04-02, 화학5-02-03, 화학16-03-02) */
  (() => {
    const S = QSim.card("lab-ch6-huckel"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), N = S.val("N"), ring = S.val("shape") === "ring", q = S.val("q"), ne = N - q;
      const x = [];
      for (let k = 1; k <= N; k++) x.push(ring ? 2 * Math.cos(2 * Math.PI * (k - 1) / N) : 2 * Math.cos(k * Math.PI / (N + 1)));
      for (let k = 0; k < N; k++) if (Math.abs(x[k]) < 1e-9) x[k] = 0;   // −0.000 표시 막기
      x.sort((a, b) => b - a);
      const occ = x.map(() => 0); let left = ne;
      // 같은 에너지(축퇴) 준위에는 훈트 규칙으로 하나씩 먼저
      let i = 0;
      while (left > 0 && i < N) {
        let j = i; while (j + 1 < N && Math.abs(x[j + 1] - x[i]) < 1e-9) j++;
        const g = j - i + 1, put = Math.min(left, 2 * g);
        for (let k = 0; k < put; k++) occ[i + (k % g)] += 1;
        left -= put; i = j + 1;
      }
      const Epi = x.reduce((s, xx, k) => s + occ[k] * xx, 0);
      const nDB = Math.min(Math.floor(ne / 2), Math.floor(N / 2)), Eloc = 2 * nDB;
      const DE = Math.abs(Epi - Eloc) < 1e-9 ? 0 : Epi - Eloc;
      const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: 0, x1: 10, y0: -2.4, y1: 2.4, yl: "E = α + xβ 의 x", pad: 40, noGrid: true }); f.axes({ noGrid: true });
      f.path([[0, 0], [10, 0]], c.ink3, 1, [3, 3]); f.text("α", 0.2, 0.08, c.ink3);
      // 같은 x를 옆으로 늘어놓기
      const seen = {};
      x.forEach((xx, k) => {
        const key = xx.toFixed(6); seen[key] = (seen[key] || 0) + 1;
        const nSame = x.filter((y) => Math.abs(y - xx) < 1e-9).length, idx = seen[key] - 1, cx = 5 + (idx - (nSame - 1) / 2) * 1.8;
        f.path([[cx - 0.7, xx], [cx + 0.7, xx]], occ[k] ? c.main : c.ink3, 2.5);
        if (occ[k] >= 1) f.arrow(cx - 0.25, xx - 0.15, 0, 0.3, c.main);
        if (occ[k] === 2) f.arrow(cx + 0.25, xx + 0.15, 0, -0.3, c.main);
      });
      [...new Set(x.map((y) => y.toFixed(3)))].forEach((s) => f.text(s, 8.3, +s - 0.05, c.ink2));
      let verdict = "";
      if (ring) {
        const homoDeg = (() => { let k = 0; for (let j = 0; j < N; j++) if (occ[j] === 1) k++; return k; })();
        if (ne % 4 === 2 && homoDeg === 0) verdict = `고리, π 전자 ${ne}개 = 4n+2 (n = ${(ne - 2) / 4}), 모두 짝지음 → 방향족 (평면일 때)`;
        else if (ne % 4 === 0) verdict = `고리, π 전자 ${ne}개 = 4n → 반방향족: 같은 에너지 준위 두 개에 전자가 하나씩 (홀전자 ${homoDeg}개)`;
        else verdict = `고리, π 전자 ${ne}개 (홀수): 라디칼`;
      } else {
        let ho = -1; occ.forEach((o, k) => { if (o > 0) ho = k; });
        const lu = occ.findIndex((o) => o < 2);
        verdict = ho < 0 || lu < 0 ? "사슬" : lu === ho ? `사슬: HOMO에 홀전자가 있다 (라디칼). 방향족 판정은 고리에만 쓴다` : `사슬: HOMO-LUMO 간격 ${(x[ho] - x[lu]).toFixed(3)}|β|. 방향족 판정은 고리에만 쓴다`;
      }
      S.out(`${ring ? "고리" : "사슬"} 탄소 ${N}개, 전하 ${q > 0 ? "+" : ""}${q} → π 전자 ${ne}개\n궤도 에너지 x: ${x.map((y) => y.toFixed(3)).join(", ")}\nE_π = ${ne}α + ${Epi.toFixed(3)}β, 고립 에틸렌 ${nDB}개로 본 에너지 ${ne}α + ${Eloc}β\n비편재화 에너지 ${DE.toFixed(3)}β (β < 0이므로 양수면 안정화)\n${verdict}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 연속 반응 A → B → C와 정상 상태 근사 (화학10-07-01) */
  (() => {
    const S = QSim.card("lab-ch10-consec"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), k1 = 10 ** S.val("l1"), k2 = 10 ** S.val("l2");
      const A = (t) => Math.exp(-k1 * t);
      const B = (t) => Math.abs(k2 - k1) < 1e-9 ? k1 * t * Math.exp(-k1 * t) : k1 / (k2 - k1) * (Math.exp(-k1 * t) - Math.exp(-k2 * t));
      const Cc = (t) => 1 - A(t) - B(t), Bss = (t) => k1 / k2 * A(t);
      const tm = Math.abs(k2 - k1) < 1e-9 ? 1 / k1 : Math.log(k1 / k2) / (k1 - k2), tmax = Math.max(5 / Math.min(k1, k2), tm * 3);
      const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: 0, x1: tmax, y0: 0, y1: 1.05, xl: "t (s)", yl: "농도 / [A]₀" }); f.axes();
      f.fn(A, c.main, 2.5); f.fn(B, RED, 2.5); f.fn(Cc, GRN, 2.5);
      if (S.val("ss")) f.fn((t) => Math.min(1.05, Bss(t)), RED, 1.5, [5, 4]);
      f.dot(tm, B(tm), c.acc, 5);
      f.text("A", tmax * 0.02, 0.97, c.main); f.text("B", tmax * 0.1, 0.97, RED); f.text("C", tmax * 0.18, 0.97, GRN);
      const tt = tm * 2, err = (Bss(tt) - B(tt)) / B(tt) * 100;
      S.out(`k₁ = ${sci(k1, 2)} s⁻¹, k₂ = ${sci(k2, 2)} s⁻¹ (k₂/k₁ = ${sci(k2 / k1, 2)})\n[B]가 가장 클 때: t = ln(k₁/k₂)/(k₁ − k₂) = ${sci(tm, 3)} s, [B]max = ${(B(tm) * 100).toFixed(1)}% of [A]₀\n정상 상태 근사 [B] ≈ (k₁/k₂)[A]: t = ${sci(tt, 3)} s에서 오차 ${err.toFixed(1)}%${k2 / k1 >= 20 ? " → B가 반응성 큰 중간체라 근사가 잘 맞는다" : k2 / k1 < 1 ? " → B가 쌓이므로 근사를 쓸 수 없다" : ""}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 5. 효소 속도론과 저해 (화학10-07-02, 화학17-02-01, 02-02) */
  (() => {
    const S = QSim.card("lab-ch10-mm"); if (!S) return;
    const cv = S.$("canvas");
    const SS = [0.5, 1, 2, 4, 8, 16, 32];   // mM
    let seed;
    function draw() {
      const c = C(), r = Q.rng(seed() * 4421), Vm = 100, Km = S.val("Km"), typ = S.val("inh"), iK = S.val("iK"), nz = S.val("nz") / 100, lb = S.val("plot") === "lb";
      const a = typ === "comp" || typ === "non" ? 1 + iK : 1, ap = typ === "non" || typ === "unc" ? 1 + iK : 1;
      const Vapp = typ === "none" ? Vm : Vm / ap, Kapp = typ === "none" ? Km : Km * a / ap;
      const vt = (s) => Vapp * s / (Kapp + s);
      const data = SS.map((s) => [s, vt(s) * (1 + nz * Q.gauss(r))]);
      const L = linfit(data.map((d) => 1 / d[0]), data.map((d) => 1 / d[1]));
      const Vfit = 1 / L.b, Kfit = L.m / L.b;
      const v = QSim.view(cv, 0.55);
      if (!lb) {
        const f = QSim.frame(v, { x0: 0, x1: 35, y0: 0, y1: 110, xl: "[S] (mM)", yl: "v (µM/s)" }); f.axes();
        f.fn((s) => Vm * s / (Km + s), c.ink3, 1.5, [4, 4]); f.fn(vt, c.main, 2.5);
        data.forEach(([s, y]) => f.dot(s, y, RED, 4.5));
        f.path([[0, Vapp / 2], [Kapp, Vapp / 2], [Kapp, 0]], c.acc, 1.2, [3, 3]);
      } else {
        const xs = data.map((d) => 1 / d[0]), x0 = Math.min(-1 / Kapp * 1.3, -0.3), y1 = Math.max(...data.map((d) => 1 / d[1])) * 1.2;
        const f = QSim.frame(v, { x0, x1: 2.2, y0: Math.min(0, L.m * x0 + L.b), y1, xl: "1/[S] (1/mM)", yl: "1/v (s/µM)", pad: 46 }); f.axes();
        f.fn((x) => (Km / Vm) * x + 1 / Vm, c.ink3, 1.5, [4, 4]); f.fn((x) => L.m * x + L.b, c.main, 2);
        data.forEach(([s, y]) => f.dot(1 / s, 1 / y, RED, 4.5));
      }
      const name = { none: "저해제 없음", comp: "경쟁 저해", unc: "무경쟁 저해", non: "비경쟁 저해" }[typ];
      S.out(`가상 자료 ${seed()}번 · 참값 Vmax ${Vm} µM/s, Km ${Km.toFixed(1)} mM · ${name}${typ !== "none" ? `, [I]/Ki = ${iK.toFixed(1)}` : ""}\n겉보기 값(이론): Vmax ${Vapp.toFixed(1)}, Km ${Kapp.toFixed(2)} mM\n이중 역수 직선 맞춤: Vmax ${Vfit.toFixed(1)}, Km ${Kfit.toFixed(2)} mM (기울기 ${L.m.toFixed(4)}, 절편 ${L.b.toFixed(5)})`);
    }
    seed = Q.seedButton(S, draw);
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 6. 이성분 증기-액체 평형: 벤젠-톨루엔 T-x-y 도표 (화학10-04-03, 10-04-02) */
  (() => {
    const S = QSim.card("lab-ch10-binary"); if (!S) return;
    const cv = S.$("canvas");
    const ANT = { b: [6.90565, 1211.033, 220.79], t: [6.95464, 1344.8, 219.482] };   // log10 P(mmHg), T(°C)
    const Ps = (k, T) => 10 ** (ANT[k][0] - ANT[k][1] / (T + ANT[k][2]));
    function draw() {
      const c = C(), P = S.val("P"), Am = S.val("Am"), z = S.val("z"), T = S.val("T");
      const g1 = (x) => Math.exp(Am * (1 - x) ** 2), g2 = (x) => Math.exp(Am * x * x);
      const Tb = (x) => bisect((TT) => x * g1(x) * Ps("b", TT) + (1 - x) * g2(x) * Ps("t", TT) - P, 0, 200, 60);
      const pts = []; for (let i = 0; i <= 100; i++) { const x = i / 100, TT = Tb(x); pts.push([x, TT, x * g1(x) * Ps("b", TT) / P]); }
      const Tmin = Math.min(...pts.map((p) => p[1])) - 3, Tmax = Math.max(...pts.map((p) => p[1])) + 3;
      const v = QSim.view(cv, 0.6), f = QSim.frame(v, { x0: 0, x1: 1, y0: Tmin, y1: Tmax, xl: "벤젠 몰분율", yl: "T (°C)", pad: 40 }); f.axes();
      f.path(pts.map((p) => [p[0], p[1]]), c.main, 2.5); f.path(pts.map((p) => [p[2], p[1]]), RED, 2.5);
      // 지렛대 규칙: 온도 T에서 액체·기체 조성
      let xl = NaN, yv = NaN;
      for (let i = 0; i < 100; i++) if ((pts[i][1] - T) * (pts[i + 1][1] - T) <= 0) { const u = (T - pts[i][1]) / (pts[i + 1][1] - pts[i][1]); xl = pts[i][0] + u * 0.01; yv = pts[i][2] + u * (pts[i + 1][2] - pts[i][2]); break; }
      f.dot(z, T, c.warn, 6);
      let state;
      const Tbub = Tb(z);
      let Tdew;
      // 이슬점: 기체 조성 y = z가 되는 x를 찾은 뒤 그 x의 끓는점
      let best = 0, bd = 9; pts.forEach((p, i) => { if (Math.abs(p[2] - z) < bd) { bd = Math.abs(p[2] - z); best = i; } }); Tdew = pts[best][1];
      if (isFinite(xl) && ((z - xl) * (z - yv) <= 0)) {
        const fv = (z - xl) / (yv - xl);
        f.path([[xl, T], [yv, T]], c.acc, 1.5); f.dot(xl, T, c.main, 4); f.dot(yv, T, RED, 4);
        state = `두 상 공존: 액체 x = ${xl.toFixed(3)}, 기체 y = ${yv.toFixed(3)}, 지렛대 규칙으로 기체 ${(fv * 100).toFixed(1)}%, 액체 ${(100 - fv * 100).toFixed(1)}%`;
      } else state = T < Tbub ? "끓는점 아래: 모두 액체" : "이슬점 위: 모두 기체";
      const az = pts.reduce((b, p) => (Math.abs(p[2] - p[0]) < Math.abs(b[2] - b[0]) && p[0] > 0.02 && p[0] < 0.98 ? p : b), pts[50]);
      const hasAz = Math.abs(az[2] - az[0]) < 0.006 && Am !== 0;
      S.out(`압력 ${P} mmHg, Margules A = ${Am.toFixed(2)}${Am === 0 ? " (이상 용액, 라울 법칙)" : ""}\n순수 벤젠 끓는점 ${Tb(1).toFixed(1)} °C, 순수 톨루엔 ${Tb(0).toFixed(1)} °C\n전체 조성 z = ${z.toFixed(2)}: 끓기 시작 ${Tbub.toFixed(1)} °C, 다 증발 약 ${Tdew.toFixed(1)} °C\n${T.toFixed(1)} °C: ${state}${hasAz ? `\n공비점 근처: x = y ≈ ${az[0].toFixed(2)}, ${az[1].toFixed(1)} °C` : ""}\n상규칙(이성분, 압력 고정): 두 상 영역의 자유도 F = C − P + 1 = 1`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();


  /* 7. Arrhenius 도시와 활성화 에너지의 불확도 (화학15-04-01, 화학10-07-04) */
  (() => {
    const S = QSim.card("lab-ch15-arrhenius"); if (!S) return;
    const cv = S.$("canvas");
    let seed;
    function draw() {
      const c = C(), r = Q.rng(seed() * 6007), Ea = S.val("Ea") * 1000, lA = 13, nz = S.val("nz") / 100, T1 = S.val("T1"), span = S.val("span"), n = S.val("n");
      const Ts = []; for (let i = 0; i < n; i++) Ts.push(T1 + span * i / (n - 1));
      const ks = Ts.map((T) => 10 ** lA * Math.exp(-Ea / (Rg * T)) * (1 + nz * Q.gauss(r)));
      const X = Ts.map((T) => 1000 / T), Y = ks.map((k) => Math.log(k));
      const L = linfit(X, Y), EaF = -L.m * Rg * 1000, uEa = L.sm * Rg * 1000, U95 = tcrit(n - 2) * uEa;
      const Tm = mean(Ts), dHs = EaF - Rg * Tm, lnA = L.b, dSs = Rg * (lnA - Math.log(kB * Tm / h) - 1);
      const v = QSim.view(cv, 0.55), xp = (Math.max(...X) - Math.min(...X)) * 0.15 + 0.02, yp = (Math.max(...Y) - Math.min(...Y)) * 0.15 + 0.2;
      const f = QSim.frame(v, { x0: Math.min(...X) - xp, x1: Math.max(...X) + xp, y0: Math.min(...Y) - yp, y1: Math.max(...Y) + yp, xl: "1000/T (1/K)", yl: "ln k", pad: 46 }); f.axes();
      f.fn((x) => L.m * x + L.b, c.main, 2); X.forEach((x, i) => f.dot(x, Y[i], RED, 4.5));
      S.out(`가상 자료 ${seed()}번 · 참값 Ea = ${S.val("Ea")} kJ/mol, A = 10¹³ s⁻¹, 측정 잡음 ${S.val("nz")}%\n온도 ${Ts.map((T) => T.toFixed(0)).join(", ")} K\n기울기 ${(L.m).toFixed(3)} ± ${L.sm.toFixed(3)} kK → Ea = ${(EaF / 1000).toFixed(1)} ± ${(U95 / 1000).toFixed(1)} kJ/mol (95%, t = ${tcrit(n - 2).toFixed(2)}), R² ${L.r2.toFixed(4)}\nEyring 근사(평균 ${Tm.toFixed(0)} K): ΔH‡ = Ea − RT = ${(dHs / 1000).toFixed(1)} kJ/mol, ΔS‡ = ${dSs.toFixed(1)} J/(mol·K)`);
    }
    seed = Q.seedButton(S, draw);
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
