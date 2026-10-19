/* 천우9 카드: Lane-Emden 폴리트로프, Gamow 봉우리, 가상 성단의 등연령곡선 맞추기 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const fx = (x, n = 2) => (+x).toFixed(n);
  const rng = (s) => () => { s = (s * 1664525 + 1013904223) % 4294967296; return (s + 0.5) / 4294967296; };
  const gauss = (r) => Math.sqrt(-2 * Math.log(r())) * Math.cos(2 * Math.PI * r());

  /* 1. Lane-Emden 방정식 (01-03) */
  (() => {
    const S = QSim.card("lab-a9-polytrope"); if (!S) return;
    const cv = S.$("canvas");
    function solve(n) {
      const h = 2e-3; let xi = 1e-6, th = 1 - xi * xi / 6, dth = -xi / 3; const pts = [[0, 1]];
      const f = (x, t, d) => [d, -Math.pow(Math.max(t, 0), n) - 2 * d / x];
      while (th > 0 && xi < 40) {
        const k1 = f(xi, th, dth), k2 = f(xi + h / 2, th + h / 2 * k1[0], dth + h / 2 * k1[1]), k3 = f(xi + h / 2, th + h / 2 * k2[0], dth + h / 2 * k2[1]), k4 = f(xi + h, th + h * k3[0], dth + h * k3[1]);
        const tn = th + h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), dn = dth + h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
        if (tn <= 0) { const q = th / (th - tn); return { pts, xi1: xi + q * h, d1: dth + q * (dn - dth) }; }
        xi += h; th = tn; dth = dn; if (pts.length < 4000) pts.push([xi, th]);
      }
      return { pts, xi1: NaN, d1: NaN };
    }
    function draw() {
      const c = C(), n = S.val("n"), R = solve(n), xmax = isFinite(R.xi1) ? Math.min(16, R.xi1 * 1.1) : 16;
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: xmax, y0: 0, y1: 1.05, xl: "ξ (무차원 반지름)", yl: "θ" }); f.axes();
      f.path(R.pts.filter((p) => p[0] <= xmax), c.main, 2.2);
      f.path(R.pts.filter((p) => p[0] <= xmax).map(([x, t]) => [x, Math.pow(Math.max(t, 0), n)]), c.warn, 1.6, [5, 3]);
      const ratio = -R.xi1 / (3 * R.d1);
      S.out(isFinite(R.xi1) ? `폴리트로프 지수 n = ${fx(n, 2)}: 표면 ξ₁ = ${fx(R.xi1, 4)}, θ′(ξ₁) = ${fx(R.d1, 4)}\n중심 밀도 / 평균 밀도 = −ξ₁/(3θ′(ξ₁)) = ${fx(ratio, 2)}\n파란 선: θ(ξ) (온도에 비례), 빨간 점선: θⁿ (밀도에 비례)` : `n = ${fx(n, 2)}: ξ = 40까지 표면(θ = 0)에 닿지 않는다. n ≥ 5이면 반지름이 무한대이다`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. Gamow 봉우리 (04-01) */
  (() => {
    const S = QSim.card("exp-a9-gamow"); if (!S) return;
    const cv = S.$("canvas"), k = 8.617e-5;
    const RX = { pp: [1, 1, 1, 1, "p + p (pp 연쇄 첫 단계)"], cno: [1, 7, 1, 14, "p + ¹⁴N (CNO 순환의 가장 느린 단계)"], aa: [2, 2, 4, 4, "⁴He + ⁴He (삼중 알파의 첫 단계)"] };
    function draw() {
      const c = C(), [Z1, Z2, A1, A2, name] = RX[S.val("rx")], T = Math.pow(10, S.val("lt")), mu = A1 * A2 / (A1 + A2);
      const EG = Math.pow(Math.PI * Z1 * Z2 / 137.036, 2) * 2 * mu * 931.494e6, kT = k * T;      // eV
      const E0 = Math.pow(EG * kT * kT / 4, 1 / 3), tau = 3 * E0 / kT, w = 4 / Math.sqrt(3) * Math.sqrt(E0 * kT), nu = (tau - 2) / 3;
      const xmax = E0 * 3 / 1e3;
      const mb = (E) => Math.exp(-E / kT), tn = (E) => Math.exp(-Math.sqrt(EG / E)), peak = mb(E0) * tn(E0);
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: xmax, y0: 0, y1: 1.15, xl: "에너지 (keV)", yl: "상대 크기" }); f.axes();
      f.fn((x) => mb(x * 1e3) / mb(E0 * 0.2), c.main, 1.5, [5, 3]);
      f.fn((x) => tn(x * 1e3) / tn(E0 * 2.5), c.acc, 1.5, [5, 3]);
      f.fn((x) => mb(x * 1e3) * tn(x * 1e3) / peak, c.warn, 2.5);
      S.out(`${name}, 온도 ${(T / 1e6).toFixed(1)}백만 K (kT = ${fx(kT / 1e3, 2)} keV)\nGamow 에너지 E_G = ${fx(EG / 1e3, 0)} keV → 봉우리 E₀ = ${fx(E0 / 1e3, 1)} keV (kT의 ${fx(E0 / kT, 1)}배), 폭 ${fx(w / 1e3, 1)} keV\n반응률의 온도 의존성 ε ∝ T^ν, ν = (τ − 2)/3 = ${fx(nu, 1)} (τ = 3E₀/kT)\n파란 점선: 맥스웰 분포 꼬리 e^(−E/kT), 주황 점선: 터널 확률 e^(−√(E_G/E)), 빨간 선: 둘의 곱(봉우리 = 1)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 가상 성단의 등연령곡선 맞추기 (06-01, 07-01) */
  (() => {
    const S = QSim.card("lab-a9-iso"); if (!S) return;
    const cv = S.$("canvas");
    // 어림 등연령곡선: 질량 M의 주계열 별 L = M^3.5 (M > 0.5), R = M^0.8 → T, 나이 t에서 수명 t_MS = 10^10 M^-2.5년을 넘은 별은 거성가지로 옮김(단순화)
    const MV = (L) => 4.83 - 2.5 * Math.log10(L);
    const bv = (T) => 7090 / T - 0.58;                        // 교육용 어림: 10000 K → 0.13, 5772 K → 0.65, 4000 K → 1.19
    function iso(lt) {
      const t = Math.pow(10, lt), Mto = Math.pow(t / 1e10, -1 / 2.5), pts = [];
      for (let M = 0.6; M <= Mto * 0.999; M *= 1.02) { const L = Math.pow(M, 3.5), R = Math.pow(M, 0.8), T = 5772 * Math.pow(L / (R * R), 0.25); pts.push([bv(T), MV(L)]); }
      // 전향점 이후: 준거성 → 적색거성가지 (어림: 광도 1.5배씩, 온도 4,500 K → 4,000 K)
      const Lto = Math.pow(Mto, 3.5), Tto = 5772 * Math.pow(Lto / Math.pow(Mto, 1.6), 0.25);
      for (let s = 0; s <= 1; s += 0.05) { const T = Tto + (4600 - Tto) * Math.min(1, s * 2), L = Lto * (1 + 2 * s) * Math.pow(10, Math.max(0, s - 0.5) * 4); pts.push([bv(T), MV(L)]); }
      return { pts, Mto };
    }
    const TRUE = { lt: 9.4, dm: 9.5 }, cl = (() => { const r = rng(4), I = iso(TRUE.lt), out = []; for (let i = 0; i < 160; i++) { const p = I.pts[Math.floor(r() * I.pts.length)]; out.push([p[0] + 0.02 * gauss(r), p[1] + TRUE.dm + 0.05 * gauss(r)]); } return out; })();
    function draw() {
      const c = C(), lt = S.val("lt"), dm = S.val("dm"), I = iso(lt);
      const v = QSim.view(cv, 0.62), f = QSim.frame(v, { x0: -0.3, x1: 1.4, y0: -(dm + 9), y1: -(dm - 4), xl: "색지수 (어림 B − V)", yl: "겉보기 등급 (위가 밝음)" }); f.axes();
      cl.forEach(([x, y]) => f.dot(x, -y, c.ink3, 2.6));
      f.path(I.pts.map(([x, M]) => [x, -(M + dm)]), c.warn, 2);
      let ss = 0; cl.forEach(([x, y]) => { let best = 1e9; I.pts.forEach(([px, pM]) => { const d = (x - px) ** 2 / 0.02 ** 2 + (y - pM - dm) ** 2 / 0.05 ** 2; if (d < best) best = d; }); ss += Math.min(best, 400); });
      S.out(`어림 등연령곡선: 나이 10^${fx(lt, 2)} = ${(Math.pow(10, lt) / 1e9).toFixed(2)} Gyr, 전향점 질량 ${fx(I.Mto, 2)} M☉, 거리 지수 ${fx(dm, 2)} (${(Math.pow(10, dm / 5 + 1)).toFixed(0)} pc)\n가상 성단 별 160개와의 어긋남(χ² 어림, 작을수록 좋음): ${ss.toFixed(0)}\n회색 점: 가상 성단, 빨간 선: 고른 나이·거리의 등연령곡선. 색과 진화 단계는 교육용 단순 모형이다`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
