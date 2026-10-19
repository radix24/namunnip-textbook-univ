/* 천우16 카드: 우주론적 거리, Ia형 초신성 허블 도표(가상 자료), 빅뱅 핵합성의 헬륨 비율, 재결합(사하 식), 밀도 요동의 선형 성장 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const fx = (x, n = 2) => (+x).toFixed(n);
  const rng = (s) => () => { s = (s * 1664525 + 1013904223) % 4294967296; return (s + 0.5) / 4294967296; };
  const gauss = (r) => Math.sqrt(-2 * Math.log(r())) * Math.cos(2 * Math.PI * r());
  const CK = 299792.458;
  // 평탄하지 않아도 되는 FLRW 우주(복사 무시). 거리는 Mpc
  function cosmo(om, ol, h0) {
    const ok = 1 - om - ol, E = (z) => Math.sqrt(Math.max(om * (1 + z) ** 3 + ok * (1 + z) ** 2 + ol, 1e-12)), DH = CK / h0;
    const DC = (z) => { const n = 400, h = z / n; let s = 1 / E(0) + 1 / E(z); for (let k = 1; k < n; k++) s += (k % 2 ? 4 : 2) / E(k * h); return DH * s * h / 3; };
    const DM = (z) => { const d = DC(z); if (Math.abs(ok) < 1e-6) return d; const q = Math.sqrt(Math.abs(ok)); return ok > 0 ? DH / q * Math.sinh(q * d / DH) : DH / q * Math.sin(q * d / DH); };
    const age = () => { const n = 2000; let s = 0; for (let k = 1; k <= n; k++) { const a = (k - 0.5) / n; s += 1 / (a * Math.sqrt(Math.max(om / a ** 3 + ok / a ** 2 + ol, 1e-12))); } return s / n * 977.8 / h0; };   // Gyr
    return { E, DC, DM, DL: (z) => (1 + z) * DM(z), DA: (z) => DM(z) / (1 + z), age, ok };
  }

  /* 1. 우주론적 거리 (03-01) */
  (() => {
    const S = QSim.card("lab-a16-distance"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), om = S.val("om"), ol = S.val("ol"), h0 = S.val("h0"), zs = S.val("z"), M = cosmo(om, ol, h0);
      const zmax = 5, pts = { dl: [], dc: [], da: [] };
      for (let k = 0; k <= 100; k++) { const z = zmax * k / 100; pts.dl.push([z, M.DL(z) / 1000]); pts.dc.push([z, M.DC(z) / 1000]); pts.da.push([z, M.DA(z) / 1000]); }
      const ymax = Math.min(Math.max(...pts.dc.map((p) => p[1])) * 1.3, 60);
      const v = QSim.view(cv, 0.56), f = QSim.frame(v, { x0: 0, x1: zmax, y0: 0, y1: ymax, xl: "적색이동 z", yl: "거리 (Gpc)" }); f.axes();
      f.path(pts.dl.filter((p) => p[1] <= ymax), c.warn, 2); f.path(pts.dc, c.main, 2); f.path(pts.da, c.acc, 2);
      f.path([[zs, 0], [zs, ymax]], c.ink3, 1, [3, 3]);
      let zmaxA = 0, dmax = 0; for (let z = 0.05; z <= 5; z += 0.01) { const d = M.DA(z); if (d > dmax) { dmax = d; zmaxA = z; } }
      const dl = M.DL(zs), da = M.DA(zs), mu = 5 * Math.log10(dl * 1e6 / 10), sc = da * 1000 / 206264.8;
      S.out(`Ω_m = ${fx(om, 2)}, Ω_Λ = ${fx(ol, 2)}, 곡률 Ω_k = ${fx(M.ok, 2)}, H₀ = ${h0} km/s/Mpc, 우주 나이 ${fx(M.age(), 2)} Gyr\nz = ${fx(zs, 2)}: 공변 거리 ${fx(M.DC(zs), 0)} Mpc, 광도 거리 ${fx(dl, 0)} Mpc(거리 지수 ${fx(mu, 2)}), 각지름 거리 ${fx(da, 0)} Mpc (1″ = ${fx(sc, 2)} kpc)\n각지름 거리는 z = ${fx(zmaxA, 2)}에서 가장 크다(${fx(dmax, 0)} Mpc): 그보다 먼 천체는 오히려 더 크게 보인다\n빨강: 광도 거리, 파랑: 공변 거리, 주황: 각지름 거리, 회색 점선: 고른 적색이동`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. Ia형 초신성 허블 도표(가상 자료) (03-02) */
  (() => {
    const S = QSim.card("lab-a16-sn"); if (!S) return;
    const cv = S.$("canvas"), h0 = 70, TRUE = cosmo(0.3, 0.7, h0);
    const muE = (z) => 5 * Math.log10(CK / h0 * z * (1 + z / 2) * 1e6 / 10);   // 빈 우주(Ω = 0)
    const dat = (() => { const r = rng(16), d = []; for (let k = 0; k < 60; k++) { const z = 0.02 + 1.28 * r(); d.push([z, 5 * Math.log10(TRUE.DL(z) * 1e6 / 10) + 0.12 * gauss(r)]); } return d; })();
    function draw() {
      const c = C(), om = S.val("om"), ol = S.val("ol"), M = cosmo(om, ol, h0), mu = (z) => 5 * Math.log10(M.DL(z) * 1e6 / 10);
      const chi = dat.reduce((s, [z, m]) => s + ((m - mu(z)) / 0.12) ** 2, 0);
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: 1.5, y0: -0.8, y1: 0.6, xl: "적색이동 z", yl: "Δμ = μ − μ(빈 우주)" }); f.axes();
      dat.forEach(([z, m]) => { f.dot(z, m - muE(z), c.ink3, 3); f.path([[z, m - muE(z) - 0.12], [z, m - muE(z) + 0.12]], c.ink3, 1); });
      f.fn((z) => z > 0.005 ? mu(z) - muE(z) : NaN, c.main, 2.2);
      f.fn((z) => z > 0.005 ? 5 * Math.log10(cosmo(1, 0, h0).DL(z) * 1e6 / 10) - muE(z) : NaN, c.warn, 1.2, [4, 3], 120);
      const q0 = om / 2 - ol;
      S.out(`모형 Ω_m = ${fx(om, 2)}, Ω_Λ = ${fx(ol, 2)} (H₀ = 70으로 고정): 감속 매개변수 q₀ = Ω_m/2 − Ω_Λ = ${fx(q0, 2)} (${q0 < 0 ? "가속 팽창" : "감속 팽창"})\n가상 초신성 60개(오차 0.12등급)와의 χ² = ${fx(chi, 1)}\nz = 0.5에서 빈 우주보다 ${fx(Math.abs(mu(0.5) - muE(0.5)), 3)}등급 ${mu(0.5) > muE(0.5) ? "어둡다(더 멀다)" : "밝다(더 가깝다)"}\n회색 점: 가상 자료, 파란 선: 고른 모형, 빨간 점선: 물질만 있는 평탄 우주(Ω_m = 1), 가로축 0: 빈 우주`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 빅뱅 핵합성의 헬륨 질량비 (04-02) */
  (() => {
    const S = QSim.card("exp-a16-bbn"); if (!S) return;
    const cv = S.$("canvas"), Q = 1.293;
    const Y = (Tf, tau, tn) => 2 * (1 / (1 + Math.exp(Q / Tf))) * Math.exp(-tn / tau);
    function draw() {
      const c = C(), Tf = S.val("tf"), tau = S.val("tau"), tn = S.val("tn");
      const Xf = 1 / (1 + Math.exp(Q / Tf)), Xn = Xf * Math.exp(-tn / tau), y = 2 * Xn;
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0.5, x1: 1.2, y0: 0.1, y1: 0.4, xl: "중성자 동결 온도 kT_f (MeV)", yl: "헬륨 질량비 Y" }); f.axes();
      f.fn((x) => Y(x, tau, tn), c.main, 2); f.path([[0.5, 0.245], [1.2, 0.245]], c.acc, 1, [4, 3]); f.dot(Tf, y, c.warn, 5);
      S.out(`동결 온도 ${fx(Tf, 2)} MeV: 중성자/양성자 비 exp(−Q/kT) = ${fx(Math.exp(-Q / Tf), 4)} (Q = 1.293 MeV), 중성자 비율 ${fx(Xf, 4)}\n핵합성까지 ${tn} s 동안 중성자 수명 ${tau} s로 붕괴: 중성자 비율 ${fx(Xn, 4)}, n/p = ${fx(Xn / (1 - Xn), 4)}\n남은 중성자가 모두 헬륨에 들어가면 Y = 2 × (중성자 비율) = ${fx(y, 3)}. 관측값 약 0.245(주황 점선)\n파란 선: 다른 동결 온도에서의 Y, 빨간 점: 고른 값`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 재결합: 사하 식 (04-03) */
  (() => {
    const S = QSim.card("lab-a16-saha"); if (!S) return;
    const cv = S.$("canvas"), T0 = 2.7255, kB = 8.617e-5, Qh = 13.6, ME = 510998.95;
    const X = (z, eta) => { const T = T0 * (1 + z), kT = kB * T, Sv = 3.84 * eta * Math.pow(kT / ME, 1.5) * Math.exp(Qh / kT); return Sv < 1e-12 ? 1 : (-1 + Math.sqrt(1 + 4 * Sv)) / (2 * Sv); };
    function draw() {
      const c = C(), eta = S.val("eta") * 1e-10;
      const zAt = (x) => { let lo = 500, hi = 3000; for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (X(m, eta) > x) hi = m; else lo = m; } return (lo + hi) / 2; };
      const z5 = zAt(0.5), z9 = zAt(0.9), z1 = zAt(0.1);
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 600, x1: 2000, y0: 0, y1: 1.05, xl: "적색이동 z", yl: "전리 비율 X" }); f.axes();
      f.fn((z) => X(z, eta), c.main, 2); f.path([[z5, 0], [z5, 1.05]], c.warn, 1, [4, 3]);
      S.out(`바리온-광자 수 비 η = ${fx(eta * 1e10, 1)}×10⁻¹⁰, 오늘 배경 복사 온도 2.7255 K\n전리 비율 X = 0.9인 z = ${fx(z9, 0)}, X = 0.5(재결합) z = ${fx(z5, 0)} (온도 ${fx(T0 * (1 + z5), 0)} K, kT = ${fx(kB * T0 * (1 + z5), 3)} eV), X = 0.1인 z = ${fx(z1, 0)}\n수소 이온화 에너지 13.6 eV보다 kT가 40배쯤 작아야 재결합한다: 광자가 바리온보다 약 10억 배 많아 꼬리의 고에너지 광자가 계속 이온화하기 때문\n파란 선: 사하 식의 전리 비율, 빨간 점선: X = 0.5`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 5. 밀도 요동의 선형 성장 (06-02) */
  (() => {
    const S = QSim.card("lab-a16-growth"); if (!S) return;
    const cv = S.$("canvas");
    const growth = (om, ol, a) => { const ok = 1 - om - ol, Ea = (x) => Math.sqrt(Math.max(om / x ** 3 + ok / x ** 2 + ol, 1e-12)); const n = 1000; let s = 0; for (let k = 1; k <= n; k++) { const x = a * (k - 0.5) / n; s += 1 / Math.pow(x * Ea(x), 3); } return 2.5 * om * Ea(a) * s * a / n; };
    function draw() {
      const c = C(), om = S.val("om"), ol = S.val("ol");
      const D1 = growth(om, ol, 1), arec = 1 / 1101, Drec = growth(om, ol, arec), ratio = D1 / Drec;
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: -3.2, x1: 0, y0: -3.3, y1: 0.2, xl: "log₁₀ 척도 인자 a", yl: "log₁₀ D(a)" }); f.axes();
      f.fn((x) => Math.log10(growth(om, ol, Math.pow(10, x))), c.main, 2, null, 120); f.fn((x) => x, c.ink3, 1, [4, 3]);
      f.path([[Math.log10(arec), -3.3], [Math.log10(arec), 0.2]], c.warn, 1, [2, 3]);
      S.out(`Ω_m = ${fx(om, 2)}, Ω_Λ = ${fx(ol, 2)}: 오늘의 성장 인자 D(1) = ${fx(D1, 3)} (물질만 있는 평탄 우주면 1)\n재결합(z = 1100)부터 오늘까지 밀도 요동이 자란 배율 ${fx(ratio, 0)} (평탄 물질 우주는 1,101)\n바리온 요동 10⁻⁵가 이만큼만 자라면 ${(1e-5 * ratio).toExponential(1)}로 오늘의 은하(δ ≫ 1)에 이르지 못한다: 재결합 전에 미리 자란 암흑물질 요동이 필요하다\n파란 선: 성장 인자, 회색 점선: D ∝ a(물질만 있는 평탄 우주), 빨간 점선: 재결합`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
