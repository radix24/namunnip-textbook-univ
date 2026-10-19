/* 화학과 체험형 보강 카드 묶음: 직관이 서기 어려운 단원을 값을 바꾸며 보는 카드
   의자 형태의 축·적도 비율(화학2), 볼츠만 분포와 분배함수(화학6),
   평형에서의 깁스 에너지 최소(화학10), 맥스웰-볼츠만 속력 분포(화학10) */
(() => {
  "use strict";
  const C = () => QSim.col();
  const Rg = 8.314, kB = 1.380649e-23, NA = 6.02214e23, c2 = 1.438777;   // c2 = hc/k (cm·K)
  const RED = "#b5562a", GRN = "#2f8f5b";
  const pct = (x) => (100 * x).toFixed(x > 0.9995 && x < 1 ? 3 : 2);

  /* 1. 의자 형태: 축과 적도의 비율 (화학2-03-03) */
  (() => {
    const S = QSim.card("lab-ch2-chair"); if (!S) return;
    const cv = S.$("canvas");
    const A = { Cl: ["Cl", 2.1], OH: ["OH", 3.9], CH3: ["CH₃", 7.1], iPr: ["아이소프로필", 9.2], tBu: ["tert-뷰틸", 21] };
    function draw() {
      const c = C(), T = S.val("T"), s1 = S.val("s1"), mode = S.val("mode"), s2 = S.val("s2");
      const a1 = A[s1][1], a2 = A[s2][1];
      // 형태 I: 치환기 1이 적도인 의자, 형태 II: 고리 뒤집은 의자. dE = E(II) − E(I)
      let dE, lab1, lab2;
      if (mode === "one") { dE = a1; lab1 = `${A[s1][0]} 적도`; lab2 = `${A[s1][0]} 축`; }
      else if (mode === "trans") { dE = a1 + a2; lab1 = "둘 다 적도"; lab2 = "둘 다 축"; }
      else { dE = a1 - a2; lab1 = `${A[s1][0]} 적도, ${A[s2][0]} 축`; lab2 = `${A[s1][0]} 축, ${A[s2][0]} 적도`; }
      const K = Math.exp(dE * 1000 / (Rg * T)), f1 = K / (1 + K);
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: 10, y0: -2, y1: 30, yl: "상대 에너지 (kJ/mol)", pad: 44, noGrid: true }); f.axes({ noGrid: true });
      const E1 = dE >= 0 ? 0 : -dE, E2 = dE >= 0 ? dE : 0;
      f.path([[0.6, E1], [3.2, E1]], c.main, 3); f.text(lab1, 1.9, E1 + 1.3, c.ink2, "center");
      f.path([[3.8, E2], [6.4, E2]], RED, 3); f.text(lab2, 5.1, E2 + 1.3, c.ink2, "center");
      const g = v.g, y0 = f.Y(0), yTop = f.Y(25), h = y0 - yTop;
      g.fillStyle = c.main; g.fillRect(f.X(7.2), y0 - h * f1, f.X(8.2) - f.X(7.2), h * f1);
      g.fillStyle = RED; g.fillRect(f.X(8.6), y0 - h * (1 - f1), f.X(9.6) - f.X(8.6), h * (1 - f1));
      f.text("비율", 8.4, 27, c.ink2, "center");
      S.out(`${T} K, RT = ${(Rg * T / 1000).toFixed(3)} kJ/mol\n두 의자 형태의 에너지 차 ΔE = ${dE.toFixed(1)} kJ/mol (축 자리의 불리함으로 계산)\nK = [${lab1}]/[${lab2}] = e^(ΔE/RT) = ${K >= 1000 ? K.toExponential(2) : K.toFixed(1)}\n${lab1} ${pct(f1)}%, ${lab2} ${pct(1 - f1)}%`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 볼츠만 분포와 분배함수 (화학6-06-01, 06-02) */
  (() => {
    const S = QSim.card("lab-ch6-boltz"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), sys = S.val("sys"), T = S.val("T"), e = S.val("e"), B = S.val("B");
      // 준위: 에너지(cm⁻¹, 바닥 = 0), 축퇴도
      let L = [];
      if (sys === "two") L = [[0, 1], [e, 1]];
      else if (sys === "osc") for (let n = 0; n < 200; n++) L.push([n * e, 1]);
      else for (let J = 0; J < 300; J++) L.push([B * J * (J + 1), 2 * J + 1]);
      const w = L.map(([E, gd]) => gd * Math.exp(-E * c2 / T)), q = w.reduce((s, x) => s + x, 0), p = w.map((x) => x / q);
      const Em = L.reduce((s, [E], i) => s + E * p[i], 0), kT = T / c2;
      const n = Math.min(sys === "two" ? 2 : 12, L.length), pm = Math.max(...p.slice(0, n));
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: -0.6, x1: n - 0.4, y0: 0, y1: Math.max(pm * 1.15, 0.1), xl: sys === "rot" ? "J" : "준위 번호 n", yl: "점유 비율", pad: 44 }); f.axes();
      const g = v.g, bw = (f.X(1) - f.X(0)) * 0.6;
      for (let i = 0; i < n; i++) { g.fillStyle = i === 0 ? c.main : c.acc; g.fillRect(f.X(i) - bw / 2, f.Y(p[i]), bw, f.Y(0) - f.Y(p[i])); }
      let imax = 0; p.forEach((x, i) => { if (x > p[imax]) imax = i; });
      const head = sys === "two" ? `두 준위, 간격 ${e} cm⁻¹` : sys === "osc" ? `조화 진동자, 간격 hν = ${e} cm⁻¹` : `강체 회전자, B = ${B.toFixed(2)} cm⁻¹, 축퇴도 2J+1`;
      S.out(`${head} · ${T} K, kT = ${kT.toFixed(0)} cm⁻¹\n분배함수 q = Σ g·e^(−ε/kT) = ${q.toFixed(3)} (열적으로 접근할 수 있는 상태 수의 어림)\n바닥 준위 ${pct(p[0])}%${sys === "two" ? `, 위 준위 ${pct(p[1])}%` : `, 가장 많이 찬 준위 ${sys === "rot" ? "J" : "n"} = ${imax} (${pct(p[imax])}%)`}\n평균 에너지 (바닥 기준) ⟨ε⟩ = ${Em.toFixed(1)} cm⁻¹ = ${(Em / kT).toFixed(3)} kT`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 평형은 깁스 에너지의 최소점 (화학10-05-01) */
  (() => {
    const S = QSim.card("lab-ch10-gmin"); if (!S) return;
    const cv = S.$("canvas");
    const dH = 57.2e3, dS = (57.2 - 4.73) / 298.15 * 1000;   // N₂O₄ ⇌ 2NO₂, ΔrG°(298.15 K) = 4.73 kJ/mol
    function draw() {
      const c = C(), T = S.val("T"), p = S.val("p"), a0 = S.val("al");
      const dG = dH - T * dS, K = Math.exp(-dG / (Rg * T)), aeq = Math.sqrt(K / (4 * p + K)), RT = Rg * T;
      const G = (al) => {   // N₂O₄ 1 mol에서 α만큼 해리했을 때의 G − G(α=0), kJ
        if (al <= 0) return 0;
        const x1 = (1 - al) / (1 + al), x2 = 2 * al / (1 + al);
        return ((1 - al) * RT * Math.log(p * x1) + 2 * al * (dG / 2 + RT * Math.log(p * x2)) - RT * Math.log(p)) / 1000;
      };
      const Glin = (al) => al * dG / 1000;   // 섞임이 없다면(각자 순수 상태로 따로 있다면)
      const N = 200, ys = []; for (let i = 0; i <= N; i++) ys.push(G(Math.min(i / N, 0.9999)));
      const lo = Math.min(...ys, Glin(1), 0), hi = Math.max(...ys, Glin(1), 0), pad = (hi - lo) * 0.12 + 0.2;
      const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: 0, x1: 1, y0: lo - pad, y1: hi + pad, xl: "해리도 α (반응 진행 정도)", yl: "G − G(α=0) (kJ)", pad: 46 }); f.axes();
      f.fn(Glin, c.ink3, 1.5, [5, 4]);
      f.fn((x) => G(Math.min(Math.max(x, 1e-6), 0.9999)), c.main, 2.5);
      f.dot(aeq, G(aeq), GRN, 6);
      const x1 = (1 - a0) / (1 + a0), x2 = 2 * a0 / (1 + a0), Q = (p * x2) ** 2 / (p * x1), slope = dG + RT * Math.log(Q);
      f.dot(a0, G(a0), RED, 5.5);
      const dx = 0.08; f.path([[a0 - dx, G(a0) - slope / 1000 * dx], [a0 + dx, G(a0) + slope / 1000 * dx]], RED, 2);
      const dir = Math.abs(slope) < 50 ? "평형 (기울기 ≈ 0)" : slope < 0 ? "정반응 쪽(α가 커지는 쪽)으로 내려감" : "역반응 쪽(α가 작아지는 쪽)으로 내려감";
      S.out(`N₂O₄ ⇌ 2NO₂ · ${T} K, 전체 압력 ${p} bar\nΔrG° = ΔrH° − TΔrS° = ${(dG / 1000).toFixed(2)} kJ/mol → K = e^(−ΔrG°/RT) = ${K < 0.01 ? K.toExponential(2) : K.toFixed(3)}\n최소점(초록): α = ${aeq.toFixed(3)}, G − G(0) = ${G(aeq).toFixed(3)} kJ\n빨간 점 α = ${a0.toFixed(2)}: Q = ${Q < 0.01 ? Q.toExponential(2) : Q.toFixed(3)}, 기울기 ΔrG = ΔrG° + RT ln Q = ${(slope / 1000).toFixed(2)} kJ/mol → ${dir}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 맥스웰-볼츠만 속력 분포 (화학10-06-01) */
  (() => {
    const S = QSim.card("lab-ch10-mb"); if (!S) return;
    const cv = S.$("canvas");
    const GAS = { H2: ["H₂", 2.016], He: ["He", 4.003], N2: ["N₂", 28.014], O2: ["O₂", 31.998], CO2: ["CO₂", 44.01], Xe: ["Xe", 131.29] };
    const dist = (M, T) => { const m = M / 1000 / NA, a = m / (2 * kB * T); return (v) => 4 * Math.PI * (a / Math.PI) ** 1.5 * v * v * Math.exp(-a * v * v); };
    function frac(fv, v0, top) {   // v0 이상의 비율 (심프슨 적분)
      if (v0 >= top) return 0;
      const N = 2000, h = (top - v0) / N; let s = fv(v0) + fv(top);
      for (let i = 1; i < N; i++) s += (i % 2 ? 4 : 2) * fv(v0 + i * h);
      return s * h / 3;
    }
    function draw() {
      const c = C(), gas = S.val("gas"), T = S.val("T"), vs = S.val("vs"), M = GAS[gas][1], m = M / 1000 / NA;
      const fv = dist(M, T), ref = dist(28.014, 298);
      const vmp = Math.sqrt(2 * kB * T / m), vm = Math.sqrt(8 * kB * T / (Math.PI * m)), vr = Math.sqrt(3 * kB * T / m);
      const xmax = 3000, ymax = Math.max(fv(Math.min(vmp, xmax)), ref(421)) * 1.15;
      const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: 0, x1: xmax, y0: 0, y1: ymax * 1000, xl: "속력 v (m/s)", yl: "f(v) (×10⁻³ s/m)", pad: 46 }); f.axes();
      const g = v.g; g.fillStyle = "rgba(181,86,42,0.25)"; g.beginPath(); g.moveTo(f.X(Math.min(vs, xmax)), f.Y(0));
      for (let x = Math.min(vs, xmax); x <= xmax; x += 10) g.lineTo(f.X(x), f.Y(fv(x) * 1000));
      g.lineTo(f.X(xmax), f.Y(0)); g.closePath(); g.fill();
      f.fn((x) => ref(x) * 1000, c.ink3, 1.2, [5, 4]);
      f.fn((x) => fv(x) * 1000, c.main, 2.5);
      [[vmp, "최빈"], [vm, "평균"], [vr, "rms"]].forEach(([x, t], i) => { if (x < xmax) { f.path([[x, 0], [x, fv(x) * 1000]], i === 0 ? GRN : c.ink2, 1.2); } });
      const fr = frac(fv, vs, vr * 8);
      S.out(`${GAS[gas][0]} (M = ${M} g/mol), ${T} K · 점선은 298 K의 N₂\n최빈 √(2RT/M) = ${vmp.toFixed(0)}, 평균 √(8RT/πM) = ${vm.toFixed(0)}, rms √(3RT/M) = ${vr.toFixed(0)} m/s\n${vs} m/s보다 빠른 분자의 비율(색칠한 넓이) = ${fr < 1e-4 ? fr.toExponential(2) : (100 * fr).toFixed(2) + "%"}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 5. 수소 원자의 지름 방향 확률 분포 (화학6-03-01) */
  (() => {
    const S = QSim.card("lab-ch6-radial"); if (!S) return;
    const cv = S.$("canvas");
    // R_nl(ρ) (ρ = Zr/a₀), 상수배는 수치 규격화로 맞춘다
    const ORB = {
      "1s": [1, 0, (r) => Math.exp(-r)], "2s": [2, 0, (r) => (2 - r) * Math.exp(-r / 2)], "2p": [2, 1, (r) => r * Math.exp(-r / 2)],
      "3s": [3, 0, (r) => (27 - 18 * r + 2 * r * r) * Math.exp(-r / 3)], "3p": [3, 1, (r) => (6 * r - r * r) * Math.exp(-r / 3)], "3d": [3, 2, (r) => r * r * Math.exp(-r / 3)]
    };
    const a0 = 52.918;   // pm
    function draw() {
      const c = C(), key = S.val("orb"), Z = S.val("Z"), rs = S.val("rs");
      const [n, l, Rf] = ORB[key];
      const top = 30 / Z, N = 3000, h = top / N;   // r (a₀ 단위)
      const P0 = (r) => { const R = Rf(Z * r); return r * r * R * R; };
      let s = 0; for (let i = 0; i <= N; i++) s += (i === 0 || i === N ? 1 : i % 2 ? 4 : 2) * P0(i * h);
      const norm = s * h / 3, P = (r) => P0(r) / norm;
      let imax = 1; for (let i = 1; i <= N; i++) if (P(i * h) > P(imax * h)) imax = i;
      const nodes = []; for (let i = 2; i < N; i++) { const r = i * h; if (r > 0.05 && (Rf(Z * r) > 0) !== (Rf(Z * (r - h)) > 0)) nodes.push(r); }
      let inside = 0; const M = 2000, hh = Math.min(rs, top) / M;
      for (let i = 0; i <= M; i++) inside += (i === 0 || i === M ? 1 : i % 2 ? 4 : 2) * P(i * hh);
      inside *= hh / 3;
      const rmean = (3 * n * n - l * (l + 1)) / (2 * Z);
      const xmax = Math.min(top, (n * n * 2.6 + 4) / Z), ymax = P(imax * h) * 1.2;
      const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: 0, x1: xmax, y0: 0, y1: ymax, xl: "r (a₀ = 52.9 pm 단위)", yl: "P(r) = r²R²", pad: 46 }); f.axes();
      const g = v.g; g.fillStyle = "rgba(47,143,91,0.22)"; g.beginPath(); g.moveTo(f.X(0), f.Y(0));
      for (let x = 0; x <= Math.min(rs, xmax); x += xmax / 400) g.lineTo(f.X(x), f.Y(P(x)));
      g.lineTo(f.X(Math.min(rs, xmax)), f.Y(0)); g.closePath(); g.fill();
      f.fn(P, c.main, 2.5);
      nodes.forEach((r) => f.dot(r, 0, RED, 5));
      f.path([[rmean, 0], [rmean, ymax * 0.9]], c.ink3, 1.2, [4, 4]);
      S.out(`${key} 오비탈 (n = ${n}, l = ${l}), 핵전하 Z = ${Z}${Z === 1 ? " (수소)" : Z === 2 ? " (He⁺)" : " (Li²⁺)"}\n가장 있을 법한 거리 = ${(imax * h).toFixed(2)} a₀ = ${(imax * h * a0).toFixed(0)} pm, 평균 거리 ⟨r⟩ = ${rmean.toFixed(2)} a₀ (점선)\n지름 방향 마디 ${n - l - 1}개${nodes.length ? ": " + nodes.map((r) => r.toFixed(2) + " a₀").join(", ") : ""} (빨간 점)\nr < ${rs.toFixed(1)} a₀ 안에서 발견할 확률(색칠한 넓이) = ${(100 * inside).toFixed(1)}%`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 6. 그래프 신경망의 메시지 전달 (화학4-04-02) */
  (() => {
    const S = QSim.card("lab-ch4-mp"); if (!S) return;
    const cv = S.$("canvas");
    // 무거운 원자: 원소, 그림 좌표(x, y), 결합 목록
    const MOL = {
      etoh: ["에탄올 CCO", [["C", 0, 0], ["C", 1, 0], ["O", 2, 0]], [[0, 1], [1, 2]]],
      dme: ["다이메틸 에터 COC", [["C", 0, 0], ["O", 1, 0], ["C", 2, 0]], [[0, 1], [1, 2]]],
      prop1: ["1-프로판올 CCCO", [["C", 0, 0], ["C", 1, 0], ["C", 2, 0], ["O", 3, 0]], [[0, 1], [1, 2], [2, 3]]],
      prop2: ["2-프로판올 CC(O)C", [["C", 0, 0], ["C", 1, 0], ["O", 1, 1], ["C", 2, 0]], [[0, 1], [1, 2], [1, 3]]],
      eme: ["에틸 메틸 에터 CCOC", [["C", 0, 0], ["C", 1, 0], ["O", 2, 0], ["C", 3, 0]], [[0, 1], [1, 2], [2, 3]]],
      acoh: ["아세트산 CC(=O)O", [["C", 0, 0], ["C", 1, 0], ["O", 1, 1], ["O", 2, 0]], [[0, 1], [1, 2], [1, 3]]]
    };
    function run(m, t) {
      const [, at, bd] = MOL[m];
      let H = at.map(([e]) => (e === "C" ? [1, 0] : [0, 1]));
      for (let s = 0; s < t; s++) {
        const Hn = H.map((h) => h.slice());
        bd.forEach(([i, j]) => { Hn[i][0] += H[j][0]; Hn[i][1] += H[j][1]; Hn[j][0] += H[i][0]; Hn[j][1] += H[i][1]; });
        H = Hn;
      }
      return { H, sum: H.reduce((s, h) => [s[0] + h[0], s[1] + h[1]], [0, 0]) };
    }
    function drawMol(f, c, m, H, dx) {
      const [, at, bd] = MOL[m];
      bd.forEach(([i, j]) => f.path([[at[i][1] + dx, at[i][2]], [at[j][1] + dx, at[j][2]]], c.ink3, 2));
      at.forEach(([e, x, y], i) => { f.dot(x + dx, y, e === "O" ? RED : c.main, 9); f.text(`${e}${i + 1} [${H[i].join(",")}]`, x + dx, y - 0.28, c.ink2, "center"); });
    }
    function draw() {
      const c = C(), m1 = S.val("m1"), m2 = S.val("m2"), t = S.val("t");
      const A = run(m1, t), B = run(m2, t);
      const v = QSim.view(cv, 0.42), f = QSim.frame(v, { x0: -0.6, x1: 8.6, y0: -0.7, y1: 1.5, pad: 10, noGrid: true });
      drawMol(f, c, m1, A.H, 0); drawMol(f, c, m2, B.H, 5);
      const same = A.sum[0] === B.sum[0] && A.sum[1] === B.sum[1];
      const fmt = (m, R) => `${MOL[m][0]}: ${MOL[m][1].map(([e], i) => `${e}${i + 1} [${R.H[i].join(",")}]`).join(", ")} → 읽어내기(합) [${R.sum.join(",")}]`;
      S.out(`원자 특성 [C인가, O인가], 한 단계: 자기 벡터 + 이웃 벡터의 합 (H′ = (I + A)H), 전달 ${t}번\n${fmt(m1, A)}\n${fmt(m2, B)}\n두 분자의 읽어내기 벡터가 ${same ? "같습니다 (이 단계에서는 구별 못 함)" : "다릅니다 (구별됨)"}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
