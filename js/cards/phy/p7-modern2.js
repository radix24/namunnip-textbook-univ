/* 물리7 실습 카드 묶음: 회전-진동 스펙트럼, 세 통계 분포, 크로니히-페니 띠, 반경험 질량 공식, 입자 반응 판정 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const kB = 8.617e-5;   // eV/K

  /* 1. 이원자 분자의 회전-진동 흡수 스펙트럼 (01-02) */
  (() => {
    const S = QSim.card("lab-p7-rovib"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), B = S.val("B") / 1000, hw = S.val("hw"), T = S.val("T"), kT = kB * T, L = 30;
      const pop = (l) => (2 * l + 1) * Math.exp(-B * l * (l + 1) / kT);
      let Z = 0; for (let l = 0; l < 80; l++) Z += pop(l);
      const lines = []; for (let l = 0; l < L; l++) { lines.push([hw + 2 * B * (l + 1), pop(l) / Z, "R"]); if (l > 0) lines.push([hw - 2 * B * l, pop(l) / Z, "P"]); }
      const top = Math.max(...lines.map((x) => x[1])) * 1.15, span = 2 * B * 25;
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: hw - span, x1: hw + span, y0: 0, y1: top, xl: "광자 에너지 (eV)", yl: "세기" }); f.axes({ noGrid: true });
      lines.forEach(([e, I, br]) => f.path([[e, 0], [e, I]], br === "R" ? c.main : c.acc, 2));
      f.path([[hw, 0], [hw, top * 0.9]], c.ink3, 1, [3, 3]);
      const mu = 0.972 * 1.6605e-27, hbar = 1.0546e-34, I = hbar * hbar / (2 * B * 1.602e-19), r0 = Math.sqrt(I / mu) * 1e9;
      let lmax = 0, pm = 0; for (let l = 0; l < 60; l++) if (pop(l) > pm) { pm = pop(l); lmax = l; }
      S.out(`회전 상수 B = ħ²/2I = ${(B * 1000).toFixed(2)} meV, 진동 ħω = ${hw.toFixed(3)} eV, 온도 ${T} K (kT = ${(kT * 1000).toFixed(1)} meV)\n선 간격 2B = ${(2 * B * 1000).toFixed(2)} meV, 가운데(ħω, 점선)는 빠짐. 파랑: R 가지(Δℓ = +1), 주황: P 가지(Δℓ = −1)\n가장 많이 점유된 회전 준위 ℓ = ${lmax}. HCl 환산 질량(0.972 u)으로 본 결합 길이 r₀ = ${r0.toFixed(3)} nm`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. MB, BE, FD 분포 (02-02) */
  (() => {
    const S = QSim.card("lab-p7-dist"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), T = S.val("T"), mu = S.val("mu"), kT = kB * T, E0 = S.val("E");
      const x = (E) => (E - mu) / kT;
      const MB = (E) => Math.exp(-x(E)), BE = (E) => (E > mu ? 1 / (Math.exp(x(E)) - 1) : NaN), FD = (E) => 1 / (Math.exp(x(E)) + 1);
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: 1, y0: 0, y1: 2, xl: "E (eV)", yl: "평균 점유수" }); f.axes();
      f.fn((E) => Math.min(MB(E), 2.5), c.ink3, 2, [5, 4], 800); f.fn((E) => Math.min(BE(E), 2.5), c.acc, 2.2, null, 800); f.fn(FD, c.main, 2.5, null, 800);
      f.path([[mu, 0], [mu, 2]], c.warn, 1, [3, 3]);
      const fmt = (y) => (isFinite(y) ? (y < 1e-3 ? y.toExponential(2) : y.toFixed(4)) : "정의 안 됨 (E ≤ μ)");
      S.out(`T = ${T} K (kT = ${(kT * 1000).toFixed(1)} meV), 화학 퍼텐셜 μ = ${mu.toFixed(2)} eV (빨간 점선)\nE = ${E0.toFixed(2)} eV, (E − μ)/kT = ${x(E0).toFixed(2)}: MB ${fmt(MB(E0))} (회색 점선), BE ${fmt(BE(E0))} (주황), FD ${fmt(FD(E0))} (파랑)\n${x(E0) > 5 ? "E − μ ≫ kT: 세 분포가 거의 같다(고전 극한)" : "E − μ가 kT 정도면 양자 효과가 크다: FD는 1을 넘지 않고, BE는 μ 근처에서 커진다"}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 크로니히-페니 모형의 띠 (03-02) */
  (() => {
    const S = QSim.card("lab-p7-kp"); if (!S) return;
    const [cvF, cvE] = S.$$("canvas");
    function draw() {
      const c = C(), P = S.val("P"), X = 4 * Math.PI;
      const rhs = (q) => Math.cos(q) + P * Math.sin(q) / q;   // q = αa, E ∝ q²
      const vf = QSim.view(cvF, 0.36), f = QSim.frame(vf, { x0: 0, x1: X, y0: -3, y1: Math.max(3, P + 1.5), xl: "αa (√E에 비례)", yl: "오른쪽 변" }); f.axes();
      const g = vf.g; g.fillStyle = "rgba(90,100,230,0.15)";
      const N = 1200, bands = []; let inB = false, s = 0;
      for (let i = 1; i <= N; i++) { const q = X * i / N, ok = Math.abs(rhs(q)) <= 1; if (ok) g.fillRect(f.X(q), f.Y(Math.max(3, P + 1.5)), f.sx * X / N + 1, f.Y(-3) - f.Y(Math.max(3, P + 1.5))); if (ok && !inB) { inB = true; s = q; } if (!ok && inB) { inB = false; bands.push([s, q]); } }
      if (inB) bands.push([s, X]);
      f.fn(rhs, c.main, 2.2, null, 1200); f.path([[0, 1], [X, 1]], c.warn, 1, [4, 3]); f.path([[0, -1], [X, -1]], c.warn, 1, [4, 3]);
      const ve = QSim.view(cvE, 0.42), Emax = X * X, fe = QSim.frame(ve, { x0: -1, x1: 1, y0: 0, y1: Emax, xl: "ka/π", yl: "E (상대)" }); fe.axes({ noGrid: true });
      fe.fn((k) => (k * Math.PI) ** 2, c.ink3, 1, [4, 3]);
      bands.forEach(([a, b]) => { const pts = []; for (let i = 0; i <= 200; i++) { const q = a + (b - a) * i / 200, r = Math.max(-1, Math.min(1, rhs(q))); pts.push([Math.acos(r) / Math.PI, q * q]); } fe.path(pts, c.main, 2.2); fe.path(pts.map(([k, E]) => [-k, E]), c.main, 2.2); });
      const gaps = []; for (let i = 0; i + 1 < bands.length; i++) gaps.push((bands[i + 1][0] ** 2 - bands[i][1] ** 2).toFixed(2));
      S.out(`장벽 세기 P = ${P.toFixed(1)}: cos ka = cos αa + P sin(αa)/(αa)\n허용 띠(칠한 곳): 오른쪽 변이 −1과 1 사이일 때만 실수 k가 있다. 띠 ${bands.length}개, 띠 간격(E 단위) ${gaps.join(", ") || "없음"}\n아래: 띠 구조 E(k). 회색 점선은 자유 전자(P = 0). 간격은 ka = ±π, ±2π…(브래그 조건)에서 열린다`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 반경험 질량 공식 (04-01) */
  (() => {
    const S = QSim.card("lab-p7-semf"); if (!S) return;
    const cv = S.$("canvas");
    const aV = 15.8, aS = 18.3, aC = 0.714, aA = 23.2;
    const Zst = (A) => Math.round(A / (2 + 0.0154 * Math.pow(A, 2 / 3)));
    function parts(A, Z) { const N = A - Z, d = (Z % 2 === 0 && N % 2 === 0) ? 12 / Math.sqrt(A) : (Z % 2 === 1 && N % 2 === 1) ? -12 / Math.sqrt(A) : 0; return { V: aV * A, Sf: -aS * Math.pow(A, 2 / 3), Cc: -aC * Z * (Z - 1) / Math.pow(A, 1 / 3), As: -aA * (A - 2 * Z) ** 2 / A, P: d }; }
    function draw() {
      const c = C(), A0 = S.val("A"), on = { Sf: S.val("tS"), Cc: S.val("tC"), As: S.val("tA") };
      const BA = (A, all) => { const p = parts(A, Zst(A)); return (p.V + (all || on.Sf ? p.Sf : 0) + (all || on.Cc ? p.Cc : 0) + (all || on.As ? p.As : 0) + p.P) / A; };
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: 250, y0: 0, y1: 16, xl: "질량수 A", yl: "B/A (MeV)" }); f.axes();
      const pts = [], ptsAll = []; for (let A = 4; A <= 250; A++) { pts.push([A, BA(A, false)]); ptsAll.push([A, BA(A, true)]); }
      f.path(ptsAll, c.ink3, 1.2, [4, 3]); f.path(pts, c.main, 2.2);
      [[4, 7.07], [12, 7.68], [16, 7.98], [56, 8.79], [120, 8.50], [208, 7.87], [238, 7.57]].forEach(([A, b]) => f.dot(A, b, c.warn, 4));
      const Z = Zst(A0), p = parts(A0, Z), B = p.V + p.Sf + p.Cc + p.As + p.P;
      let best = 0, bA = 0; for (let A = 10; A <= 250; A++) { const y = BA(A, true); if (y > best) { best = y; bA = A; } }
      S.out(`A = ${A0}, 가장 안정한 Z ≈ ${Z} (N = ${A0 - Z})\n부피 ${p.V.toFixed(0)}, 표면 ${p.Sf.toFixed(0)}, 쿨롱 ${p.Cc.toFixed(0)}, 비대칭 ${p.As.toFixed(1)}, 짝짓기 ${p.P.toFixed(1)} MeV → B = ${B.toFixed(0)} MeV, B/A = ${(B / A0).toFixed(2)} MeV\n모든 항(회색 점선) 기준 B/A 최대는 A ≈ ${bA}에서 ${best.toFixed(2)} MeV. 빨간 점: 측정값(He-4, C-12, O-16, Fe-56, Sn-120, Pb-208, U-238)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 5. 입자 반응 판정기 (05-02) */
  (() => {
    const S = QSim.card("lab-p7-react"); if (!S) return;
    const cv = S.$("canvas");
    // 이름: [전하, 바리온 수, L_e, L_mu, 기묘도, 질량 MeV]
    const P = { "p": [1, 1, 0, 0, 0, 938.3], "p̄": [-1, -1, 0, 0, 0, 938.3], "n": [0, 1, 0, 0, 0, 939.6], "e⁻": [-1, 0, 1, 0, 0, 0.511], "e⁺": [1, 0, -1, 0, 0, 0.511], "μ⁻": [-1, 0, 0, 1, 0, 105.7], "μ⁺": [1, 0, 0, -1, 0, 105.7], "νₑ": [0, 0, 1, 0, 0, 0], "ν̄ₑ": [0, 0, -1, 0, 0, 0], "ν_μ": [0, 0, 0, 1, 0, 0], "ν̄_μ": [0, 0, 0, -1, 0, 0], "γ": [0, 0, 0, 0, 0, 0], "π⁺": [1, 0, 0, 0, 0, 139.6], "π⁻": [-1, 0, 0, 0, 0, 139.6], "π⁰": [0, 0, 0, 0, 0, 135.0], "K⁺": [1, 0, 0, 0, 1, 493.7], "K⁰": [0, 0, 0, 0, 1, 497.6], "K⁻": [-1, 0, 0, 0, -1, 493.7], "Λ⁰": [0, 1, 0, 0, -1, 1115.7], "Σ⁺": [1, 1, 0, 0, -1, 1189.4] };
    const R = {
      beta: [["n"], ["p", "e⁻", "ν̄ₑ"], true], pdec: [["p"], ["e⁺", "γ"], true], pion: [["π⁺"], ["μ⁺", "ν_μ"], true], mueg: [["μ⁻"], ["e⁻", "γ"], true],
      assoc: [["π⁻", "p"], ["K⁰", "Λ⁰"], false], lam: [["Λ⁰"], ["p", "π⁻"], true], wrong: [["π⁻", "p"], ["K⁻", "Σ⁺"], false], pp: [["p", "p"], ["p", "p", "p", "p̄"], false], mudec: [["μ⁻"], ["e⁻", "ν̄ₑ", "ν_μ"], true]
    };
    const sum = (list, k) => list.reduce((s, n) => s + P[n][k], 0);
    function draw() {
      const c = C(), [ini, fin, decay] = R[S.val("rx")];
      const names = ["전하", "바리온 수", "L_e", "L_μ", "기묘도"];
      const rows = names.map((nm, k) => [nm, sum(ini, k), sum(fin, k)]);
      const mI = sum(ini, 5), mF = sum(fin, 5);
      const v = QSim.view(cv, 0.32), g = v.g; g.font = "13px sans-serif";
      const cw = v.W / 4;
      ["", "전", "후", "보존"].forEach((h, i) => { g.fillStyle = c.ink2; g.fillText(h, 10 + i * cw, 18); });
      rows.forEach(([nm, a, b], j) => { const y = 40 + j * 20, ok = Math.abs(a - b) < 1e-9; g.fillStyle = c.ink; g.fillText(nm, 10, y); g.fillText(String(a), 10 + cw, y); g.fillText(String(b), 10 + 2 * cw, y); g.fillStyle = ok ? c.main : c.warn; g.fillText(ok ? "예" : "아니요", 10 + 3 * cw, y); });
      const bad = rows.filter(([, a, b]) => a !== b).map(([n]) => n);
      const dS = Math.abs(rows[4][1] - rows[4][2]);
      const strangeOnly = bad.length === 1 && bad[0] === "기묘도" && dS === 1;
      const energyOK = decay ? mF < mI : true;
      let verdict;
      if (bad.length === 1 && bad[0] === "기묘도" && dS >= 2) verdict = `금지: 기묘도가 ${dS}만큼 바뀐다 (약한 상호작용도 한 번에 1까지만 바꾼다)`;
      else if (bad.length && !strangeOnly) verdict = `금지: ${bad.join(", ")} 보존이 깨진다`;
      else if (!energyOK) verdict = `금지: 생성물 질량 합 ${mF.toFixed(1)} MeV가 처음 질량 ${mI.toFixed(1)} MeV보다 크다`;
      else if (strangeOnly) verdict = "약한 상호작용으로만 가능 (기묘도가 1만큼 바뀜, 느리다)";
      else verdict = fin.some((n) => n.startsWith("ν")) ? "가능: 중성미자가 나오므로 약한 상호작용" : fin.includes("γ") && !ini.some((n) => n.startsWith("π")) ? "가능 (전자기)" : "가능 (강한 상호작용으로 일어날 수 있음)";
      S.out(`${ini.join(" + ")} → ${fin.join(" + ")}\n${decay ? `붕괴: Q = ${(mI - mF).toFixed(1)} MeV` : `충돌: 정지 에너지 합 전 ${mI.toFixed(1)} MeV, 후 ${mF.toFixed(1)} MeV (모자라면 운동 에너지로 보충)`}\n판정: ${verdict}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
