/* 전전15 물리전자 탐구 카드 묶음
   1 유한 우물의 준위(02-01)  2 Kronig-Penney 띠(03-01)  3 상태 밀도 × Fermi 분포(04-02)  4 이종 접합 띠 정렬(05-02) */
(() => {
  "use strict";
  if (!window.QSim) return;
  const C = () => QSim.col();
  const f2 = (x, d = 3) => (Math.abs(x) < 5e-13 ? 0 : x).toFixed(d);
  const hb = 1.0546e-34, m0 = 9.109e-31, q = 1.602e-19, kB = 8.617e-5;

  /* 1. 유한 사각 우물: 짝·홀 상태의 초월 방정식 */
  (() => {
    const S = QSim.card("exp-e15-finitewell"); if (!S) return;
    const cv = S.$("canvas");
    function levels(V0, a, ms) {
      const R = (a / 2) * Math.sqrt(2 * ms * m0 * V0 * q) / hb, N = 40000, xs = [];
      const fe = (x) => x * Math.tan(x) - Math.sqrt(Math.max(R * R - x * x, 0));
      const fo = (x) => -x / Math.tan(x) - Math.sqrt(Math.max(R * R - x * x, 0));
      [fe, fo].forEach((f) => { let p = null; for (let i = 1; i < N; i++) { const x = i / N * R, v = f(x); if (p !== null && p * v < 0 && Math.abs(v) < 10 && Math.abs(p) < 10) xs.push(x); p = v; } });
      xs.sort((u, w) => u - w);
      return { R, E: xs.map((x) => (2 * x / a) ** 2 * hb * hb / (2 * ms * m0) / q) };
    }
    function draw() {
      const c = C(), V0 = S.val("v0"), a = S.val("a") * 1e-9, ms = +S.val("ms");
      const { R, E } = levels(V0, a, ms);
      const Einf = [1, 2, 3].map((n) => (n * Math.PI / a) ** 2 * hb * hb / (2 * ms * m0) / q);
      const v = QSim.view(cv, 0.5), A = a * 1e9, fr = QSim.frame(v, { x0: -A, x1: A, y0: 0, y1: V0 * 1.25, xl: "x (nm)", yl: "E (eV)" }); fr.axes({ noGrid: true });
      fr.path([[-A, V0], [-A / 2, V0], [-A / 2, 0], [A / 2, 0], [A / 2, V0], [A, V0]], c.ink, 2.4);
      E.forEach((En, i) => { fr.path([[-A * 0.75, En], [A * 0.75, En]], [c.main, c.acc, c.warn, c.ink2][i % 4], 2.2); });
      Einf.forEach((En) => { if (En < V0 * 1.25) fr.path([[-A / 2, En], [A / 2, En]], c.ink3, 1, [3, 3]); });
      S.out(`장벽 V₀ = ${f2(V0, 2)} eV, 폭 ${f2(a * 1e9, 1)} nm, m* = ${ms} m₀ → R = (a/2)√(2m*V₀)/ħ = ${f2(R, 3)}, 속박 상태 ${E.length}개 (대략 ⌈2R/π⌉)\n` +
        `유한 우물 준위: ${E.map((x) => f2(x * 1000, 1) + " meV").join(", ")} (색 선)\n` +
        `같은 폭의 무한 우물: ${Einf.map((x) => f2(x * 1000, 1) + " meV").join(", ")} (회색 점선). 파동이 장벽으로 스며들어 실효 폭이 넓어지므로 유한 우물 준위가 더 낮습니다.`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. Kronig-Penney (델타 장벽 극한) */
  (() => {
    const S = QSim.card("exp-e15-kp"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), P = S.val("p");
      const f = (z) => P * Math.sin(z) / z + Math.cos(z);
      const zmax = 4 * Math.PI, v = QSim.view(cv, 0.45), fr = QSim.frame(v, { x0: 0, x1: 4, y0: -4, y1: Math.max(4, P + 1.5), xl: "αa / π (√E에 비례)", yl: "f(αa)" }); fr.axes();
      const g = v.g;
      // 허용 대역(|f| ≤ 1) 칠하기와 가장자리 찾기
      const edges = []; let prev = null; const M = 40000;
      for (let i = 1; i <= M; i++) { const z = i / M * zmax, ok = Math.abs(f(z)) <= 1; if (ok) { g.fillStyle = c.soft; g.fillRect(fr.X(z / Math.PI), fr.Y(Math.max(4, P + 1.5)), Math.max(1, fr.X(4 / M) - fr.X(0)), fr.Y(-4) - fr.Y(Math.max(4, P + 1.5))); } if (prev !== null && ok !== prev) edges.push(z / Math.PI); prev = ok; }
      fr.path([[0, 1], [4, 1]], c.warn, 1, [4, 3]); fr.path([[0, -1], [4, -1]], c.warn, 1, [4, 3]);
      fr.fn((u) => f(u * Math.PI), c.main, 2.4, undefined, 1200);
      const bands = []; for (let i = 0; i + 1 < edges.length; i += 2) bands.push([edges[i], edges[i + 1]]);
      S.out(`P = ${f2(P, 2)} (장벽 세기). cos(ka) = P sin(αa)/(αa) + cos(αa)는 |우변| ≤ 1일 때만 실수 k를 가집니다(연보라 = 허용 띠)\n` +
        `허용 띠(αa/π 범위) ${bands.slice(0, 3).map(([u, w]) => `${f2(u, 3)}~${f2(w, 3)}`).join(", ")} → 에너지(E₁ = ħ²π²/2ma² 단위) ${bands.slice(0, 3).map(([u, w]) => `${f2(u * u, 3)}~${f2(w * w, 3)}`).join(", ")}\n` +
        `P → 0이면 띠 간격이 사라져 자유 전자, P → ∞이면 띠가 n²E₁의 준위(고립 우물)로 좁아집니다.`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 전도대 전자 분포: g(E)·f(E) */
  (() => {
    const S = QSim.card("exp-e15-dos"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), T = S.val("T"), dEF = S.val("ef"), md = 1.08, kT = kB * T;   // dEF = E_c − E_F (eV)
      const Nc = 2 * Math.pow(2 * Math.PI * md * m0 * 1.381e-23 * T / (6.626e-34) ** 2, 1.5) / 1e6;   // cm⁻³
      // g(E) = (1/2π²)(2m/ħ²)^{3/2}√(E − Ec), cm⁻³/eV
      const gc = (x) => (1 / (2 * Math.PI ** 2)) * Math.pow(2 * md * m0 / hb ** 2, 1.5) * Math.sqrt(x * q) * q / 1e6;
      const fd = (x) => 1 / (1 + Math.exp((x + dEF) / kT));   // x = E − Ec
      const emax = 10 * kT;
      let n = 0; const N = 4000; for (let i = 1; i <= N; i++) { const x = (i - 0.5) / N * Math.max(emax, 0.3); n += gc(x) * fd(x) * Math.max(emax, 0.3) / N; }
      const nMB = Nc * Math.exp(-dEF / kT);
      const v = QSim.view(cv, 0.45);
      let ymax = 0; for (let i = 1; i <= 200; i++) { const x = i / 200 * emax; ymax = Math.max(ymax, gc(x) * fd(x)); }
      const fr = QSim.frame(v, { x0: 0, x1: emax * 1000, y0: 0, y1: ymax * 1.15, xl: "E − E_c (meV)", yl: "n(E)" }); fr.axes({ noGrid: true });
      fr.fn((m) => gc(m / 1000) * fd(m / 1000), c.main, 2.4, undefined, 400);
      let peak = 0, pv = 0; for (let i = 1; i <= 400; i++) { const x = i / 400 * emax, y = gc(x) * fd(x); if (y > pv) { pv = y; peak = x; } }
      S.out(`Si 전도대(상태 밀도 유효 질량 1.08m₀), T = ${T} K, E_c − E_F = ${f2(dEF, 3)} eV(${f2(dEF / kT, 2)} kT)\n` +
        `N_c = ${Nc.toExponential(3)} cm⁻³. 적분한 전자 농도 n = ∫g(E)f(E)dE = ${n.toExponential(3)} cm⁻³, Boltzmann 근사 N_c e^(−(E_c−E_F)/kT) = ${nMB.toExponential(3)} (비 ${f2(n / nMB, 3)})\n` +
        `분포의 봉우리 E − E_c = ${f2(peak * 1000, 1)} meV(Boltzmann이면 kT/2 = ${f2(kT / 2 * 1000, 1)} meV). 전자는 띠 바닥 몇 kT 안에 몰려 있습니다.`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 이종 접합의 띠 정렬(Anderson 규칙) */
  (() => {
    const S = QSim.card("exp-e15-hetero"); if (!S) return;
    const cv = S.$("canvas");
    // [이름, 전자 친화도 χ, 띠 간격 Eg] (eV, 대표값)
    const PAIRS = {
      gaas: [["Al0.3Ga0.7As", 3.74, 1.80], ["GaAs", 4.07, 1.42]],
      inp: [["InP", 4.38, 1.344], ["In0.53Ga0.47As", 4.50, 0.75]],
      sige: [["Si", 4.05, 1.12], ["Ge", 4.00, 0.66]],
      broken: [["GaSb", 4.06, 0.726], ["InAs", 4.90, 0.354]]
    };
    function draw() {
      const c = C(), [[n1, x1, g1], [n2, x2, g2]] = PAIRS[S.val("pair")];
      const Ec1 = -x1, Ev1 = -x1 - g1, Ec2 = -x2, Ev2 = -x2 - g2;
      const dEc = Ec1 - Ec2, dEv = Ev2 - Ev1;   // 양수: 재료 2의 전도대가 낮고, 가전자대가 높음
      let kind;
      if (Ec2 < Ev1 || Ec1 < Ev2) kind = "III형(어긋난 틈, broken gap): 한쪽 전도대가 다른 쪽 가전자대보다 낮음";
      else if ((dEc >= 0 && dEv >= 0) || (dEc <= 0 && dEv <= 0)) kind = "I형(포개진 정렬): 한 재료의 띠 간격이 다른 쪽 안에 들어감 → 전자와 정공이 같은 쪽에 갇힘";
      else kind = "II형(엇갈린 정렬): 전자와 정공이 서로 다른 재료에 갇힘";
      const lo = Math.min(Ev1, Ev2) - 0.3, hi = Math.max(Ec1, Ec2) + 0.3;
      const v = QSim.view(cv, 0.45), fr = QSim.frame(v, { x0: 0, x1: 2, y0: lo, y1: hi, yl: "E (진공 준위 0 기준, eV)", pad: 44 }); fr.axes({ noGrid: true });
      fr.path([[0.05, Ec1], [1, Ec1]], c.main, 2.6); fr.path([[0.05, Ev1], [1, Ev1]], c.warn, 2.6);
      fr.path([[1, Ec2], [1.95, Ec2]], c.main, 2.6); fr.path([[1, Ev2], [1.95, Ev2]], c.warn, 2.6);
      fr.path([[1, lo], [1, hi]], c.rule, 1, [3, 3]);
      fr.text(n1, 0.5, hi - 0.15, c.ink2, "center"); fr.text(n2, 1.5, hi - 0.15, c.ink2, "center");
      S.out(`${n1}(χ ${x1}, E_g ${g1} eV) | ${n2}(χ ${x2}, E_g ${g2} eV). Anderson 규칙: 진공 준위를 맞추고 χ로 전도대를 놓음(대표값, 확인 필요)\n` +
        `ΔE_c = χ₂ − χ₁ = ${f2(-dEc * -1, 3)} eV(${dEc >= 0 ? n2 + " 전도대가 낮음" : n1 + " 전도대가 낮음"}), ΔE_v = ${f2(dEv, 3)} eV(${dEv >= 0 ? n2 + " 가전자대가 높음" : n1 + " 가전자대가 높음"})\n` +
        `${kind}. Anderson 규칙은 실제 측정값과 0.1 eV 이상 다를 수 있습니다(예: AlGaAs/GaAs의 ΔE_c 비율은 측정상 약 60~65%).`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
