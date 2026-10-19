/* 공통5·6 체험 카드 묶음 3: 열량계 혼합, 이온화 에너지 추세, 반데르발스 기체, 에너지 분포와 활성화 에너지, 공통 이온과 용해도, 온도에 따른 ΔG */
(() => {
  "use strict";
  const C = () => QSim.col();
  const sci = (x, d = 2) => { if (x === 0) return "0"; const e = Math.floor(Math.log10(Math.abs(x))); return e >= -2 && e < 4 ? x.toFixed(Math.max(0, d - e)) : (x / 10 ** e).toFixed(d) + "×10^" + e; };

  /* 1. 뜨거운 금속을 물에 넣기 (공통5 05-01) */
  (() => {
    const S = QSim.card("lab-c5-mix"); if (!S) return;
    const cv = S.$("canvas");
    const M = { Al: ["알루미늄", 0.897], Fe: ["철", 0.449], Cu: ["구리", 0.385], Pb: ["납", 0.129] };
    let t = 0;
    function state() {
      const [nm, c] = M[S.val("metal")], m = S.val("m"), T1 = S.val("T1"), mw = S.val("mw"), T2 = S.val("T2"), cw = 4.184;
      const Cm = m * c, Cw = mw * cw, Tf = (Cm * T1 + Cw * T2) / (Cm + Cw);
      return { nm, c, m, T1, mw, T2, Cm, Cw, Tf };
    }
    function draw() {
      const c = C(), s = state(), k = 0.6 * (1 / s.Cm + 1 / s.Cw) * Math.min(s.Cm, s.Cw), tmax = 12;
      const Tm = (u) => s.Tf + (s.T1 - s.Tf) * Math.exp(-k * u), Tw = (u) => s.Tf + (s.T2 - s.Tf) * Math.exp(-k * u);
      const lo = Math.min(s.T1, s.T2) - 5, hi = Math.max(s.T1, s.T2) + 5;
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: tmax, y0: lo, y1: hi, xl: "시간 (상대값)", yl: "온도 (°C)" }); f.axes();
      f.path([[0, s.Tf], [tmax, s.Tf]], c.ink3, 1, [4, 4]);
      const pts = (F) => { const a = []; for (let i = 0; i <= 200; i++) { const u = Math.min(t, tmax) * i / 200; a.push([u, F(u)]); } return a; };
      f.path(pts(Tm), c.warn, 2.5); f.path(pts(Tw), c.main, 2.5);
      const u = Math.min(t, tmax); f.dot(u, Tm(u), c.warn, 5); f.dot(u, Tw(u), c.main, 5);
      const q = s.Cw * (s.Tf - s.T2);
      S.out(`${s.nm} ${s.m} g (비열 ${s.c} J/(g·K), 열용량 ${s.Cm.toFixed(1)} J/K), ${s.T1} °C\n물 ${s.mw} g (비열 4.184, 열용량 ${s.Cw.toFixed(1)} J/K), ${s.T2} °C\n나중 온도 ${s.Tf.toFixed(2)} °C. 금속이 잃은 열 = 물이 얻은 열 = ${(q / 1000).toFixed(3)} kJ\n금속 온도 변화 ${(s.Tf - s.T1).toFixed(1)} K, 물 온도 변화 ${(s.Tf - s.T2).toFixed(2)} K`);
    }
    const L = QSim.loop((dt) => { t += dt * 2; draw(); return t < 12; }).watch(S.root);
    QSim.playButton(S.$(".play"), L, () => { if (t >= 12) t = 0; });
    S.on(() => { t = 12; draw(); }); QSim.redrawOn(draw); t = 12; draw();
  })();

  /* 2. 첫째 이온화 에너지의 주기적 추세 (공통5 07-02) */
  (() => {
    const S = QSim.card("lab-c5-ie"); if (!S) return;
    const cv = S.$("canvas");
    const SYM = "H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr".split(" ");
    const IE = [1312, 2372, 520, 899, 801, 1086, 1402, 1314, 1681, 2081, 496, 738, 578, 787, 1012, 1000, 1251, 1521, 419, 590, 633, 659, 651, 653, 717, 762, 760, 737, 745, 906, 579, 762, 947, 941, 1140, 1351];
    const NOBLE = [2, 10, 18, 36];
    function why(z) {
      if (z === 1) return "가장 간단한 원자";
      const d = IE[z - 1] - IE[z - 2];
      if (NOBLE.includes(z - 1)) return "새 껍질이 시작된다. 바깥 전자가 핵에서 멀고 안쪽 전자에 가려져 크게 떨어진다";
      if ([5, 13, 31].includes(z)) return "처음 들어간 p 전자는 s 전자보다 에너지가 높아(가려짐이 커서) 앞 원소보다 떼기 쉽다";
      if ([8, 16, 34].includes(z)) return "p 오비탈에서 처음 짝을 이룬 전자는 같은 오비탈 전자끼리 반발해 떼기 쉽다";
      if (z >= 21 && z <= 30) return "3d가 채워지는 전이 원소. 4s 전자를 떼므로 값이 비슷하게 천천히 오른다";
      return d > 0 ? "같은 주기에서 핵전하가 커져 바깥 전자를 더 세게 당긴다" : "앞 원소보다 조금 작다";
    }
    function draw() {
      const c = C(), z = S.val("z");
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0.3, x1: 36.7, y0: 0, y1: 2600, xl: "Z", yl: "kJ/mol" }); f.axes();
      const g = v.g, w = f.sx * 0.7;
      IE.forEach((e, i) => { g.fillStyle = i + 1 === z ? c.warn : NOBLE.includes(i + 1) ? c.acc : c.soft; g.fillRect(f.X(i + 1) - w / 2, f.Y(e), w, f.Y(0) - f.Y(e)); });
      f.path(IE.map((e, i) => [i + 1, e]), c.main, 1.2);
      f.text(SYM[z - 1], z, IE[z - 1] + 80, c.warn, "center");
      S.out(`Z = ${z} ${SYM[z - 1]}: 첫째 이온화 에너지 ${IE[z - 1]} kJ/mol${z > 1 ? " (앞 원소 " + SYM[z - 2] + "보다 " + (IE[z - 1] - IE[z - 2] > 0 ? "+" : "") + (IE[z - 1] - IE[z - 2]) + ")" : ""}\n${why(z)}\n주황 막대: 18족(비활성 기체)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 반데르발스 기체의 등온선 (공통5 10-03) */
  (() => {
    const S = QSim.card("lab-c5-vdw"); if (!S) return;
    const cv = S.$("canvas");
    const G = { CO2: ["CO₂", 3.640, 0.04267], N2: ["N₂", 1.370, 0.0387], He: ["He", 0.0346, 0.0238] }, R = 0.08314;
    function draw() {
      const c = C(), [nm, a, b] = G[S.val("gas")], T = S.val("T"), Vm = S.val("V");
      const Pv = (V) => R * T / (V - b) - a / (V * V), Pi = (V) => R * T / V;
      const Tc = 8 * a / (27 * R * b), Pc = a / (27 * b * b), Vc = 3 * b;
      const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: 0, x1: 1, y0: 0, y1: 200, xl: "Vm (L/mol)", yl: "P (bar)" }); f.axes();
      f.fn((V) => (V > 0.02 ? Pi(V) : NaN), c.ink3, 1.5, [5, 4], 400);
      f.fn((V) => (V > b * 1.02 ? Pv(V) : NaN), c.main, 2.5, null, 800);
      if (Vc < 1 && Pc < 200) f.dot(Vc, Pc, c.acc, 4);
      const P1 = Pv(Vm), P0 = Pi(Vm); if (P1 > 0 && P1 < 200) f.dot(Vm, P1, c.warn, 6);
      const Z = P1 * Vm / (R * T);
      S.out(`${nm}: a = ${a} L²·bar/mol², b = ${b} L/mol, 임계 온도 Tc = 8a/(27Rb) = ${Tc.toFixed(1)} K, Pc = ${Pc.toFixed(1)} bar\n${T} K, Vm = ${Vm.toFixed(3)} L/mol: 이상 기체 ${P0.toFixed(1)} bar, 반데르발스 ${P1.toFixed(1)} bar, 압축 인자 Z = PV/RT = ${Z.toFixed(3)}\n${Z < 0.995 ? "Z < 1: 분자 사이 끌림이 압력을 낮춘다" : Z > 1.005 ? "Z > 1: 분자 자체의 부피가 압력을 높인다" : "거의 이상 기체"}${T < Tc ? "\nT < Tc: 곡선이 오르내린다. 실제로는 이 구간에서 기체가 액화하며 압력이 일정한 수평선이 된다" : ""}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 에너지 분포와 활성화 에너지 (공통6 02-03) */
  (() => {
    const S = QSim.card("lab-c6-boltz"); if (!S) return;
    const cv = S.$("canvas");
    const erfc = (x) => { const t = 1 / (1 + 0.5 * x), y = t * Math.exp(-x * x - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277))))))))); return y; };
    const frac = (x) => 2 * Math.sqrt(x / Math.PI) * Math.exp(-x) + erfc(Math.sqrt(x));
    const R = 8.314e-3;
    function draw() {
      const c = C(), T = S.val("T"), Ea0 = S.val("Ea"), cat = S.val("cat"), Ea = Math.max(1, Ea0 - cat);
      const dens = (E, TT) => 2 * Math.sqrt(E / Math.PI) * Math.pow(1 / (R * TT), 1.5) * Math.exp(-E / (R * TT));
      const xmax = Math.max(Ea0, 20) * 1.25;
      const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: 0, x1: xmax, y0: -14, y1: 0, xl: "E (kJ/mol)", yl: "log₁₀ 분포" }); f.axes();
      const lg = (E, TT) => Math.log10(Math.max(1e-30, dens(E, TT)));
      const g = v.g; g.save(); g.fillStyle = c.soft; g.globalAlpha = 0.6; g.beginPath(); g.moveTo(f.X(Ea), f.Y(-14));
      for (let i = 0; i <= 100; i++) { const E = Ea + (xmax - Ea) * i / 100; g.lineTo(f.X(E), f.Y(Math.max(-14, lg(E, T)))); }
      g.lineTo(f.X(xmax), f.Y(-14)); g.fill(); g.restore();
      f.fn((E) => (E > 0.01 ? Math.max(-14, lg(E, T)) : NaN), c.main, 2.5, null, 400);
      f.fn((E) => (E > 0.01 ? Math.max(-14, lg(E, T + 10)) : NaN), c.warn, 1.8, [5, 4], 400);
      f.path([[Ea0, -14], [Ea0, 0]], c.ink3, 1.5, [3, 3]); if (cat) f.path([[Ea, -14], [Ea, 0]], c.acc, 2);
      const p1 = frac(Ea / (R * T)), p2 = frac(Ea / (R * (T + 10))), p0 = frac(Ea0 / (R * T));
      S.out(`T = ${T} K, RT = ${(R * T).toFixed(2)} kJ/mol, Ea = ${Ea.toFixed(0)} kJ/mol${cat ? " (촉매로 " + cat + " kJ/mol 낮춤)" : ""}\nEa보다 큰 에너지를 가진 분자 비율 ${sci(p1, 2)}  (색칠한 꼬리)\n${T + 10} K에서는 ${sci(p2, 2)} → ${(p2 / p1).toFixed(2)}배${cat ? "\n촉매 없을 때 " + sci(p0, 2) + " → 촉매가 " + sci(p1 / p0, 2) + "배로 늘림" : ""}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 5. 공통 이온 효과와 용해도 (공통6 05-03) */
  (() => {
    const S = QSim.card("lab-c6-ksp"); if (!S) return;
    const cv = S.$("canvas");
    const SALT = {
      agcl: { n: "AgCl", K: 1.8e-10, p: 1, q: 1, M: 143.32, ion: "Cl⁻", src: "NaCl" },
      ag2cro4: { n: "Ag₂CrO₄", K: 1.1e-12, p: 2, q: 1, M: 331.73, ion: "CrO₄²⁻", src: "Na₂CrO₄" },
      pbi2: { n: "PbI₂", K: 9.8e-9, p: 1, q: 2, M: 461.0, ion: "I⁻", src: "NaI" }
    };
    const solve = (s0, c) => { const { K, p, q } = s0; let lo = -20, hi = 0; for (let i = 0; i < 100; i++) { const m = (lo + hi) / 2, s = 10 ** m; if ((p * s) ** p * (c + q * s) ** q > K) hi = m; else lo = m; } return 10 ** ((lo + hi) / 2); };
    function draw() {
      const c = C(), s0 = SALT[S.val("salt")], lc = S.val("lc"), cc = 10 ** lc;
      const sp = solve(s0, 0), sc = solve(s0, cc);
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: -6, x1: 0, y0: -10, y1: -1, xl: "log [" + s0.src + "]", yl: "log 용해도 (M)" }); f.axes();
      f.fn((x) => Math.log10(solve(s0, 10 ** x)), c.main, 2.5, null, 200);
      f.path([[-6, Math.log10(sp)], [0, Math.log10(sp)]], c.ink3, 1, [4, 4]);
      f.dot(lc, Math.log10(sc), c.warn, 6);
      S.out(`${s0.n}: Ksp = ${sci(s0.K, 1)} (25 °C)\n순수한 물: 용해도 ${sci(sp, 2)} M = ${sci(sp * s0.M, 2)} g/L (점선)\n${s0.src} ${sci(cc, 2)} M 속: 용해도 ${sci(sc, 2)} M = ${sci(sc * s0.M, 2)} g/L → 순수한 물의 ${(sp / sc).toFixed(sp / sc < 10 ? 2 : 0)}분의 1`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 6. 온도에 따른 ΔG와 K (공통6 06-02) */
  (() => {
    const S = QSim.card("lab-c6-gibbs"); if (!S) return;
    const cv = S.$("canvas");
    const RX = {
      nh3: ["N₂ + 3H₂ → 2NH₃", -92.2, -198.7], caco3: ["CaCO₃ → CaO + CO₂", 178.3, 160.6],
      n2o4: ["N₂O₄ → 2NO₂", 57.2, 175.9], ice: ["H₂O(s) → H₂O(l)", 6.01, 22.0]
    };
    function draw() {
      const c = C(), [nm, H, Sv] = RX[S.val("rx")], T = S.val("T"), G = (TT) => H - TT * Sv / 1000;
      const ys = [G(0), G(1500)], lo = Math.min(...ys, 0), hi = Math.max(...ys, 0), pad = (hi - lo) * 0.1;
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: 1500, y0: lo - pad, y1: hi + pad, xl: "T (K)", yl: "ΔG° (kJ)" }); f.axes();
      f.fn(G, c.main, 2.5);
      const Tx = H / (Sv / 1000); if (Tx > 0 && Tx < 1500) f.dot(Tx, 0, c.acc, 5);
      f.dot(T, G(T), c.warn, 6);
      const lnK = -G(T) * 1000 / (8.314 * T), K = Math.exp(lnK);
      S.out(`${nm}: ΔH° = ${H} kJ, ΔS° = ${Sv} J/K (온도에 따라 변하지 않는다고 봄)\n${T} K: ΔG° = ${G(T).toFixed(1)} kJ → ${G(T) < 0 ? "자발적" : "비자발적"}, K = ${isFinite(K) ? sci(K, 2) : "매우 큼"}\n${Tx > 0 ? "ΔG° = 0이 되는 온도 ΔH°/ΔS° = " + Tx.toFixed(0) + " K (주황 점)" : "ΔH°와 ΔS°의 부호가 반대라 자발성이 온도에 따라 바뀌지 않는다"}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
