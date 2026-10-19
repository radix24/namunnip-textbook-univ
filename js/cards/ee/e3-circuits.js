/* 전전3 기초회로이론 탐구 카드 묶음
   1 부하가 걸린 분압기(02-01)  2 테브난 등가와 부하선(03-02)  3 최대 전력 전달(03-03) */
(() => {
  "use strict";
  if (!window.QSim) return;
  const C = () => QSim.col();
  const par = (a, b) => (a * b) / (a + b);
  const fmtR = (r) => (r >= 1e6 ? `${+(r / 1e6).toPrecision(3)} MΩ` : r >= 1e3 ? `${+(r / 1e3).toPrecision(3)} kΩ` : `${+r.toPrecision(3)} Ω`);

  /* 1. 부하가 걸린 분압기 */
  (() => {
    const S = QSim.card("exp-e3-divider"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), V = S.val("V"), R1 = S.val("r1") * 1e3, R2 = S.val("r2") * 1e3, lRL = S.val("lrl"), RL = 10 ** lRL;
      const ideal = V * R2 / (R1 + R2), out = (rl) => V * par(R2, rl) / (R1 + par(R2, rl));
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 2, x1: 7, y0: 0, y1: V * 1.05, xl: "log₁₀ R_L (Ω)", yl: "출력 (V)" }); f.axes();
      f.path([[2, ideal], [7, ideal]], c.ink3, 1.2, [5, 4]);
      f.fn((x) => out(10 ** x), c.main, 2.5);
      f.path([[Math.log10(R2), 0], [Math.log10(R2), V]], c.rule, 1, [2, 3]); f.text("R_L = R₂", Math.log10(R2) + 0.05, V * 0.95, c.ink3);
      const vo = out(RL); f.dot(lRL, vo, c.warn, 6);
      const Ith = ideal / par(R1, R2);
      S.out(`부하 없음: V × R₂/(R₁ + R₂) = ${ideal.toFixed(3)} V (회색 점선)\n` +
        `부하 R_L = ${fmtR(RL)}: R₂ ∥ R_L = ${fmtR(par(R2, RL))} → 출력 ${vo.toFixed(3)} V (부하 없을 때의 ${(100 * vo / ideal).toFixed(1)}%)\n` +
        `출력 마디의 테브난 등가: ${ideal.toFixed(3)} V, R₁ ∥ R₂ = ${fmtR(par(R1, R2))} (단락 전류 ${(Ith * 1e3).toFixed(3)} mA). 부하가 이 저항의 100배 이상이면 1% 안으로 맞습니다.\n` +
        `분압기가 쓰는 전력(부하 없음) ${(V * V / (R1 + R2) * 1e3).toFixed(3)} mW`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 휘트스톤 다리를 마디 해석으로 (02-02) */
  (() => {
    const S = QSim.card("exp-e3-bridge"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), V = S.val("V"), R1 = S.val("r1"), R2 = S.val("r2"), R3 = S.val("r3"), Rx = S.val("rx"), R5 = S.val("r5");   // kΩ, mA
      // 마디 b, c (a = V, 아래 = 0). 나가는 전류 합 = 0
      const g11 = 1 / R1 + 1 / R3 + 1 / R5, g12 = -1 / R5, g22 = 1 / R2 + 1 / Rx + 1 / R5, b1 = V / R1, b2 = V / R2;
      const D = g11 * g22 - g12 * g12, vb = (b1 * g22 - g12 * b2) / D, vc = (g11 * b2 - g12 * b1) / D, i5 = (vb - vc) / R5;
      const v = QSim.view(cv, 0.6), g = v.g, W = v.W, H = v.H, P = { a: [W * 0.5, H * 0.1], b: [W * 0.27, H * 0.5], c: [W * 0.73, H * 0.5], d: [W * 0.5, H * 0.9] };
      g.save(); g.font = "12px " + (getComputedStyle(document.documentElement).getPropertyValue("--f-mono") || "monospace");
      const edge = (p, q, label, cur) => {
        const [x1, y1] = P[p], [x2, y2] = P[q]; g.strokeStyle = c.ink3; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2; g.fillStyle = c.card; g.fillRect(mx - 26, my - 9, 52, 18); g.strokeStyle = c.ink2; g.strokeRect(mx - 26, my - 9, 52, 18);
        g.fillStyle = c.ink; g.textAlign = "center"; g.fillText(label, mx, my + 4);
        g.fillStyle = Math.abs(cur) < 1e-6 ? c.ink3 : c.main; g.fillText(`${Math.abs(cur).toFixed(3)} mA${cur >= 0 ? "" : " (반대)"}`, mx + (q === "c" || p === "c" ? 72 : -72) * (p === "b" && q === "c" ? 0 : 1), my + (p === "b" && q === "c" ? 24 : 4));
      };
      edge("a", "b", `R1 ${R1}k`, (V - vb) / R1); edge("a", "c", `R2 ${R2}k`, (V - vc) / R2); edge("b", "d", `R3 ${R3}k`, vb / R3); edge("c", "d", `Rx ${Rx}k`, vc / Rx); edge("b", "c", `R5 ${R5}k`, i5);
      Object.entries({ a: V, b: vb, c: vc, d: 0 }).forEach(([k, val]) => { const [x, y] = P[k]; g.beginPath(); g.arc(x, y, 5, 0, 7); g.fillStyle = c.warn; g.fill(); g.fillStyle = c.ink; g.textAlign = "left"; g.fillText(`${k}: ${val.toFixed(3)} V`, x + 8, y - 6); });
      g.restore();
      const bal = R1 / R3 === R2 / Rx;
      S.out(`위 마디 a = ${V} V(전압원으로 정해짐), 아래 마디 d = 기준 0 V. 미지수는 v_b, v_c 두 개\n` +
        `마디 식 G·v = b (mS, V, mA): [${g11.toFixed(3)}, ${g12.toFixed(3)}; ${g12.toFixed(3)}, ${g22.toFixed(3)}]·[v_b; v_c] = [${b1.toFixed(3)}; ${b2.toFixed(3)}], det G = ${D.toFixed(4)}\n` +
        `v_b = ${vb.toFixed(4)} V, v_c = ${vc.toFixed(4)} V → R5(b→c) 전류 ${(i5 * 1000).toFixed(2)} μA\n` +
        `균형 조건 R1/R3 = R2/Rx: ${(R1 / R3).toFixed(3)} 와 ${(R2 / Rx).toFixed(3)}${bal ? " → 균형, R5 전류 0" : ""}. 균형이 되는 Rx = R2·R3/R1 = ${(R2 * R3 / R1).toFixed(3)} kΩ\n` +
        `전력 균형: 전원 ${(V * ((V - vb) / R1 + (V - vc) / R2)).toFixed(3)} mW 공급 = 저항 합 ${((V - vb) ** 2 / R1 + (V - vc) ** 2 / R2 + vb * vb / R3 + vc * vc / Rx + (vb - vc) ** 2 / R5).toFixed(3)} mW`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 중첩: 전원을 하나씩 켜고 더하기 (03-01) */
  (() => {
    const S = QSim.card("exp-e3-superpos"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), Vs = S.val("vs"), Is = S.val("is"), R1 = S.val("r1"), R2 = S.val("r2"), onV = S.val("onv"), onI = S.val("oni");
      const iV = onV ? Vs / (R1 + R2) : 0, iI = onI ? Is * R1 / (R1 + R2) : 0, iT = iV + iI;   // R2 전류(아래로)
      const v = QSim.view(cv, 0.42), g = v.g, W = v.W, H = v.H, bw = W / 9, base = H * 0.82, top = H * 0.1;
      const all = [Vs / (R1 + R2), Is * R1 / (R1 + R2), Vs / (R1 + R2) + Is * R1 / (R1 + R2)], m = Math.max(...all.map(Math.abs), 1e-9);
      const sc = (base - top) / m;
      const bar = (k, val, col, lab) => { const x = W * 0.12 + k * bw * 1.6; g.fillStyle = col; g.fillRect(x, val >= 0 ? base - val * sc : base, bw, Math.abs(val) * sc); g.fillStyle = c.ink2; g.font = "12px " + (getComputedStyle(document.documentElement).getPropertyValue("--f-mono") || "monospace"); g.textAlign = "center"; g.fillText(lab, x + bw / 2, H - 4); g.fillText(`${val.toFixed(3)} A`, x + bw / 2, (val >= 0 ? base - val * sc : base) - 4); };
      g.strokeStyle = c.ink3; g.beginPath(); g.moveTo(W * 0.05, base); g.lineTo(W * 0.98, base); g.stroke();
      bar(0, iV, c.main, "전압원만"); bar(1, iI, c.acc, "전류원만"); bar(2, iT, c.warn, "합(실제)");
      const pT = R2 * iT * iT, pS = R2 * (iV * iV + iI * iI);
      S.out(`회로: V_s — R₁ — 마디 A — R₂ — 기준, 마디 A로 I_s가 들어감. 막대는 R₂ 전류(아래 방향)\n` +
        `전압원만(전류원 개방): V_s/(R₁ + R₂) = ${iV.toFixed(3)} A${onV ? "" : " (꺼 둠)"}\n전류원만(전압원 단락): I_s·R₁/(R₁ + R₂) = ${iI.toFixed(3)} A${onI ? "" : " (꺼 둠)"}\n` +
        `합 ${iT.toFixed(3)} A → R₂ 전압 ${(iT * R2).toFixed(3)} V. R₂ 전력: 실제 ${pT.toFixed(3)} W, 따로 구한 전력의 합 ${pS.toFixed(3)} W${onV && onI && Math.abs(pT - pS) > 1e-9 ? " (다름: 전력은 중첩되지 않음)" : ""}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 블랙박스의 테브난 등가를 측정으로 찾기 (03-02) */
  (() => {
    const S = QSim.card("exp-e3-blackbox"); if (!S) return;
    const cv = S.$("canvas");
    const rng = (s) => () => { s = (s * 1664525 + 1013904223) % 4294967296; return (s + 0.5) / 4294967296; };
    const gauss = (r) => Math.sqrt(-2 * Math.log(r())) * Math.cos(2 * Math.PI * r());
    // 상자 안: V1 — Ra — 마디 — Rb — 기준, 마디 — Rc — 단자. 종속 전원 VCCS g·v_단자 가 단자에서 기준으로
    let seed = 11, box = null, rec = [];
    function newBox() { const r = rng(seed); r(); box = { V1: 5 + Math.round(r() * 20), Ra: 1 + Math.round(r() * 9), Rb: 1 + Math.round(r() * 9), Rc: Math.round(r() * 5), g: Math.round(r() * 4) / 10 }; rec = []; }   // kΩ, mS
    function thev() {   // 정확한 등가 (kΩ, mA)
      const { V1, Ra, Rb, Rc, g } = box, Rp = par(Ra, Rb), Vp = V1 * Rb / (Ra + Rb);
      // 단자 KCL: 부하로 나가는 i, 단자 전압 v: (v - Vp)/(Rp + Rc) + g·v + i = 0 → v = (Vp/(Rp+Rc) − i)/(1/(Rp+Rc) + g)
      const Gs = 1 / (Rp + Rc) + g; return { Voc: Vp / (Rp + Rc) / Gs, Rth: 1 / Gs };
    }
    function measure(RL) { const t = thev(), i = t.Voc / (t.Rth + RL), r = rng(seed * 31 + Math.round(RL * 100)); return { RL, v: i * RL * (1 + 0.003 * gauss(r)), i: i * (1 + 0.003 * gauss(r)) }; }
    function fit() { if (rec.length < 2) return null; const n = rec.length, mx = rec.reduce((s, p) => s + p.i, 0) / n, my = rec.reduce((s, p) => s + p.v, 0) / n; let sxy = 0, sxx = 0; rec.forEach((p) => { sxy += (p.i - mx) * (p.v - my); sxx += (p.i - mx) ** 2; }); if (!sxx) return null; const b = sxy / sxx; return { Voc: my - b * mx, Rth: -b }; }
    function draw() {
      const c = C(), t = thev(), RL = 10 ** S.val("lrl"), now = measure(RL);
      const v = QSim.view(cv, 0.5), Imax = t.Voc / t.Rth * 1.1, f = QSim.frame(v, { x0: 0, x1: Imax, y0: 0, y1: t.Voc * 1.15, xl: "i (mA)", yl: "v (V)" }); f.axes();
      rec.forEach((p) => f.dot(p.i, p.v, c.main, 4)); f.dot(now.i, now.v, c.warn, 5);
      const F = fit(); if (F) f.fn((i) => F.Voc - F.Rth * i, c.acc, 1.8, [6, 3]);
      if (S.val("ans")) f.fn((i) => t.Voc - t.Rth * i, c.ink3, 1, [2, 3]);
      S.out(`부하 R_L = ${fmtR(RL * 1e3)} → 가상 측정 v = ${now.v.toFixed(3)} V, i = ${now.i.toFixed(3)} mA (측정 잡음 약 0.3%)\n기록 ${rec.length}점` +
        (F ? `. 직선 맞춤 v = ${F.Voc.toFixed(3)} − ${F.Rth.toFixed(3)}·i → 추정 V_Th ≈ ${F.Voc.toFixed(3)} V, R_Th ≈ ${F.Rth.toFixed(3)} kΩ` : ". 서로 다른 부하로 두 점 이상 기록하세요.") +
        (S.val("ans") ? `\n상자 안: V1 = ${box.V1} V, Ra = ${box.Ra} kΩ, Rb = ${box.Rb} kΩ, Rc = ${box.Rc} kΩ, VCCS ${box.g} mS → 정확한 V_Th = ${t.Voc.toFixed(3)} V, R_Th = ${t.Rth.toFixed(3)} kΩ` : ""));
    }
    S.$(".rec").addEventListener("click", () => { rec.push(measure(10 ** S.val("lrl"))); draw(); });
    S.$(".clear").addEventListener("click", () => { rec = []; draw(); });
    S.$(".new").addEventListener("click", () => { seed = (seed * 48271) % 2147483647; newBox(); draw(); });
    newBox(); S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 6. 연산증폭기 기본 회로: 이상 이득, 유한 이득, 포화 (04-01) */
  (() => {
    const S = QSim.card("exp-e3-opamp"); if (!S) return;
    const cv = S.$("canvas");
    function solve(cfg, R1, Rf, v1, v2, A) {   // 유한 이득 VCVS 모형으로 정확히 푼다. 포화 전
      if (cfg === "inv") return { ideal: -Rf / R1 * v1, real: (-Rf / R1 * v1) / (1 + (1 + Rf / R1) / A) };
      if (cfg === "non") { const b = R1 / (R1 + Rf); return { ideal: v1 / b, real: (A / (1 + A * b)) * v1 }; }
      if (cfg === "fol") return { ideal: v1, real: A / (1 + A) * v1 };
      // 차동: R1 = 입력 저항, Rf = 되먹임·접지 저항. v+ = Rf/(R1+Rf)·v2, 반전 쪽은 반전 증폭기와 같은 되먹임 β = R1/(R1+Rf)
      const vp = Rf / (R1 + Rf) * v2, b = R1 / (R1 + Rf), ideal = Rf / R1 * (v2 - v1);
      const real = A * (vp - (Rf / (R1 + Rf)) * v1) / (1 + A * b);
      return { ideal, real };
    }
    function draw() {
      const c = C(), cfg = S.val("cfg"), R1 = S.val("r1"), Rf = S.val("rf"), v1 = S.val("v1"), v2 = S.val("v2"), A = 10 ** S.val("la"), Vsat = S.val("vs") - 1.5;
      const now = solve(cfg, R1, Rf, v1, v2, A), clip = (x) => Math.max(-Vsat, Math.min(Vsat, x));
      // 가로축: v1 을 −2 ~ 2 V로 훑은 전달 특성
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: -2, x1: 2, y0: -15, y1: 15, xl: "v₁ (V)", yl: "v_o (V)" }); f.axes();
      f.fn((x) => solve(cfg, R1, Rf, x, v2, A).ideal, c.ink3, 1.2, [5, 4]);
      f.fn((x) => clip(solve(cfg, R1, Rf, x, v2, A).real), c.main, 2.5);
      f.path([[-2, Vsat], [2, Vsat]], c.warn, 1, [2, 3]); f.path([[-2, -Vsat], [2, -Vsat]], c.warn, 1, [2, 3]);
      f.dot(v1, clip(now.real), c.warn, 6);
      const name = { inv: "반전 증폭기 −R_f/R₁", non: "비반전 증폭기 1 + R_f/R₁", fol: "전압 폴로어 1", dif: "차동 증폭기 (R_f/R₁)(v₂ − v₁)" }[cfg];
      const sat = Math.abs(now.real) > Vsat;
      S.out(`${name}. 열린 루프 이득 A = ${A.toExponential(0)}, 출력 한계 ±${Vsat.toFixed(1)} V (전원 ±${S.val("vs")} V)\n` +
        `v₁ = ${v1.toFixed(2)} V${cfg === "dif" ? `, v₂ = ${v2.toFixed(2)} V` : ""} → 이상 출력 ${now.ideal.toFixed(4)} V, 유한 이득 출력 ${now.real.toFixed(4)} V (오차 ${now.ideal ? (100 * (now.real / now.ideal - 1)).toFixed(3) : "0"}%)` +
        (sat ? `\n포화: 실제 출력은 ${clip(now.real).toFixed(2)} V에서 막힙니다. 이때는 가상 단락이 성립하지 않습니다.` : `\n두 입력 단자 사이 전압 v₊ − v₋ = v_o/A = ${(now.real / A * 1e6).toFixed(2)} μV (가상 단락이 거의 맞음)`));
    }
    const sync = () => { const d = S.val("cfg") === "dif"; S.$$(".only-dif").forEach((e) => (e.style.display = d ? "" : "none")); S.$$(".no-fol").forEach((e) => (e.style.display = S.val("cfg") === "fol" ? "none" : "")); };
    S.on(() => { sync(); draw(); }); sync(); QSim.redrawOn(draw); draw();
  })();

  /* 7. 테브난 등가로 보는 1차 회로 (05-02) */
  (() => {
    const S = QSim.card("exp-e3-rcrl"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), kind = S.val("kind"), Vs = S.val("vs"), R1 = S.val("r1") * 1e3, R2 = S.val("r2") * 1e3, X = S.val("x");
      const Vth = Vs * R2 / (R1 + R2), Rth = par(R1, R2), rc = kind === "rc";
      const tau = rc ? Rth * X * 1e-6 : X * 1e-3 / Rth;          // C in μF, L in mH
      const fin = rc ? Vth : Vth / Rth;                            // 최종: 축전기 전압 또는 인덕터 전류
      const T = 6 * tau, v = QSim.view(cv, 0.5), sc = T < 1e-2 ? 1e6 : 1e3, un = sc === 1e6 ? "μs" : "ms";
      const yl = rc ? "v_C (V)" : "i_L (mA)", fy = rc ? 1 : 1e3;
      const f = QSim.frame(v, { x0: 0, x1: T * sc, y0: 0, y1: Math.max(fin * fy, 1e-9) * 1.15, xl: `t (${un})`, yl }); f.axes();
      f.fn((t) => fin * fy * (1 - Math.exp(-t / sc / tau)), c.main, 2.5);
      f.path([[0, fin * fy], [T * sc, fin * fy]], c.ink3, 1, [5, 4]);
      f.path([[0, 0], [tau * sc, fin * fy]], c.acc, 1.2, [3, 3]);   // 처음 접선
      f.path([[tau * sc, 0], [tau * sc, fin * fy * 1.1]], c.rule, 1, [2, 3]); f.dot(tau * sc, fin * fy * (1 - Math.exp(-1)), c.warn, 5);
      S.out(`${rc ? "축전기" : "인덕터"}에서 본 테브난 등가: V_Th = V_s·R₂/(R₁ + R₂) = ${Vth.toFixed(3)} V, R_Th = R₁ ∥ R₂ = ${fmtR(Rth)}\n` +
        `τ = ${rc ? "R_Th·C" : "L/R_Th"} = ${(tau * sc).toPrecision(4)} ${un}. 최종값 ${rc ? `v_C = ${fin.toFixed(3)} V` : `i_L = V_Th/R_Th = ${(fin * 1e3).toFixed(3)} mA`} (점선)\n` +
        `빨간 점: t = τ에서 63.2%. 주황 점선: t = 0의 접선(τ에서 최종값에 닿음). 처음 값은 0으로 둠`);
    }
    const sync = () => { const rc = S.val("kind") === "rc"; S.$('[data-unit]').textContent = rc ? "μF" : "mH"; S.$('[data-lab]').textContent = rc ? "C" : "L"; };
    S.on(() => { sync(); draw(); }); sync(); QSim.redrawOn(draw); draw();
  })();

  /* 8. 스위치를 켰다 끄는 1차 회로 (05-03) */
  (() => {
    const S = QSim.card("exp-e3-switch"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), Vs = S.val("vs"), Rc = S.val("rc") * 1e3, Rd = S.val("rd") * 1e3, Cc = S.val("cap") * 1e-6, t1 = S.val("t1") * 1e-3;
      // 0 ≤ t < t1: 충전(V_s, R_c). t ≥ t1: 방전(R_d)
      const tc = Rc * Cc, td = Rd * Cc, v1 = Vs * (1 - Math.exp(-t1 / tc)), T = t1 + 5 * td;
      const vt = (t) => (t < 0 ? 0 : t < t1 ? Vs * (1 - Math.exp(-t / tc)) : v1 * Math.exp(-(t - t1) / td));
      const it = (t) => (t < 0 ? 0 : t < t1 ? (Vs - vt(t)) / Rc : -vt(t) / Rd);
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: -0.05 * T * 1e3, x1: T * 1e3, y0: -Vs * 0.6, y1: Vs * 1.1, xl: "t (ms)", yl: "V" }); f.axes();
      f.fn((x) => vt(x / 1e3), c.main, 2.5, null, 800);
      const Imax = Math.max(Vs / Rc, v1 / Rd); f.fn((x) => it(x / 1e3) / Imax * Vs * 0.5, c.acc, 1.5, [5, 3], 800);
      f.path([[t1 * 1e3, -Vs * 0.6], [t1 * 1e3, Vs * 1.1]], c.warn, 1, [2, 3]); f.text("스위치 전환", t1 * 1e3 + 1, Vs * 1.02, c.warn);
      S.out(`0 ≤ t &lt; t₁: v_C = ${Vs}(1 − e^(−t/τ₁)), τ₁ = R_c·C = ${(tc * 1e3).toPrecision(3)} ms\n`.replace("&lt;", "<") +
        `t₁ = ${(t1 * 1e3).toFixed(1)} ms에서 v_C = ${v1.toFixed(3)} V (최종값 ${Vs} V의 ${(100 * v1 / Vs).toFixed(1)}%: t₁/τ₁ = ${(t1 / tc).toFixed(2)})\n` +
        `t ≥ t₁: v_C = ${v1.toFixed(3)}·e^(−(t − t₁)/τ₂), τ₂ = R_d·C = ${(td * 1e3).toPrecision(3)} ms. 파랑 v_C, 주황 점선 축전기 전류(크기 맞춤, 방전 때 음수)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 9. RLC 자연 응답과 특성근 (06-01) */
  (() => {
    const S = QSim.card("exp-e3-roots"); if (!S) return;
    const [cvS, cvT] = S.$$("canvas");
    function draw() {
      const c = C(), R = 10 ** S.val("lr"), L = S.val("L") * 1e-3, Cc = S.val("C") * 1e-6, V0 = 10;
      const a = R / (2 * L), w0 = 1 / Math.sqrt(L * Cc), z = a / w0, disc = a * a - w0 * w0;
      let roots, kind;
      if (Math.abs(z - 1) < 0.01) { roots = [[-a, 0], [-a, 0]]; kind = "임계감쇠(근처)"; }
      else if (disc > 0) { const d = Math.sqrt(disc); roots = [[-a + d, 0], [-a - d, 0]]; kind = "과감쇠"; }
      else { const wd = Math.sqrt(-disc); roots = [[-a, wd], [-a, -wd]]; kind = "부족감쇠"; }
      // s 평면 (ω₀로 나눈 값)
      const vs = QSim.view(cvS, 0.6), f = QSim.frame(vs, { x0: -3.2, x1: 0.4, y0: -1.3, y1: 1.3, equal: true, xl: "실수부/ω₀", yl: "허수부/ω₀", pad: 22 }); f.axes();
      const g = vs.g; g.save(); g.strokeStyle = c.rule; g.setLineDash([3, 3]); g.beginPath(); g.arc(f.X(0), f.Y(0), f.sx, Math.PI / 2, 3 * Math.PI / 2); g.stroke(); g.restore();
      roots.forEach(([x, y]) => { const X = f.X(x / w0), Y = f.Y(y / w0); g.strokeStyle = c.warn; g.lineWidth = 2.5; g.beginPath(); g.moveTo(X - 6, Y - 6); g.lineTo(X + 6, Y + 6); g.moveTo(X + 6, Y - 6); g.lineTo(X - 6, Y + 6); g.stroke(); });
      // 자연 응답 v_C(0)=10, i(0)=0 (직렬 RLC) → v'(0)=0
      const vt = (t) => {
        if (kind === "부족감쇠") { const wd = roots[0][1]; return Math.exp(-a * t) * (V0 * Math.cos(wd * t) + (a * V0 / wd) * Math.sin(wd * t)); }
        if (kind === "과감쇠") { const [s1, s2] = [roots[0][0], roots[1][0]], A2 = V0 * s1 / (s1 - s2), A1 = V0 - A2; return A1 * Math.exp(s1 * t) + A2 * Math.exp(s2 * t); }
        return V0 * (1 + a * t) * Math.exp(-a * t);
      };
      const slow = Math.min(...roots.map((r) => Math.abs(r[0]))), T = Math.min(12 / w0 * 2 * Math.PI / 2, 6 / slow);
      const vt2 = QSim.view(cvT, 0.32), ft = QSim.frame(vt2, { x0: 0, x1: T * 1e3, y0: -10, y1: 10.5, xl: "t (ms)", yl: "v_C (V)" }); ft.axes({ noGrid: true });
      ft.fn((x) => vt(x / 1e3), c.main, 2.2, null, 800);
      if (kind === "부족감쇠") { ft.fn((x) => Math.hypot(V0, a * V0 / roots[0][1]) * Math.exp(-a * x / 1e3), c.acc, 1, [4, 3]); }
      S.out(`직렬 RLC: R = ${R.toPrecision(3)} Ω, L = ${S.val("L")} mH, C = ${S.val("C")} μF → α = R/(2L) = ${a.toPrecision(4)} s⁻¹, ω₀ = ${w0.toPrecision(4)} rad/s, ζ = ${z.toFixed(3)} → ${kind}\n` +
        `특성근 s = ${roots.map(([x, y]) => `${x.toPrecision(4)}${y ? (y > 0 ? " + j" : " − j") + Math.abs(y).toPrecision(4) : ""}`).join(", ")} (위: s 평면, 점선 원은 반지름 ω₀)\n` +
        `아래: v_C(0) = 10 V, i(0) = 0의 자연 응답. 임계 저항 2√(L/C) = ${(2 * Math.sqrt(L / Cc)).toFixed(1)} Ω`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 10. 교류 테브난 등가는 주파수마다 다르다 (07-02) */
  (() => {
    const S = QSim.card("exp-e3-acthev"); if (!S) return;
    const [cvZ, cvV] = S.$$("canvas");
    const cx = (re, im = 0) => ({ re, im }), add = (a, b) => cx(a.re + b.re, a.im + b.im), mul = (a, b) => cx(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
    const div = (a, b) => { const d = b.re * b.re + b.im * b.im; return cx((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); }, abs = (a) => Math.hypot(a.re, a.im), arg = (a) => Math.atan2(a.im, a.re) * 180 / Math.PI;
    function th(w, R, C, L) {   // v_s(10∠0) — R — 마디1 — (C 접지) — L — 단자
      const ZC = cx(0, -1 / (w * C)), ZL = cx(0, w * L), Zp = div(mul(cx(R), ZC), add(cx(R), ZC));
      return { Vth: mul(cx(10), div(ZC, add(cx(R), ZC))), Zth: add(ZL, Zp) };
    }
    function draw() {
      const c = C(), R = S.val("R"), Cc = S.val("C") * 1e-6, L = S.val("L") * 1e-3, lw = S.val("lw"), w = 10 ** lw, RL = S.val("RL");
      const now = th(w, R, Cc, L);
      const v = QSim.view(cvZ, 0.45), f = QSim.frame(v, { x0: 2, x1: 5, y0: -30, y1: 30, xl: "log₁₀ ω (rad/s)", yl: "Ω" }); f.axes();
      f.fn((x) => th(10 ** x, R, Cc, L).Zth.re, c.main, 2.2); f.fn((x) => th(10 ** x, R, Cc, L).Zth.im, c.acc, 2.2, [6, 3]);
      f.path([[lw, -30], [lw, 30]], c.warn, 1, [2, 3]);
      const vv = QSim.view(cvV, 0.3), g = QSim.frame(vv, { x0: 2, x1: 5, y0: 0, y1: 10.5, xl: "log₁₀ ω (rad/s)", yl: "|부하 전압| (V)" }); g.axes();
      const VL = (x) => { const t = th(10 ** x, R, Cc, L); return abs(mul(t.Vth, div(cx(RL), add(t.Zth, cx(RL))))); };
      g.fn(VL, c.main, 2.2); g.dot(lw, VL(lw), c.warn, 5);
      const vl = mul(now.Vth, div(cx(RL), add(now.Zth, cx(RL))));
      S.out(`ω = ${w.toPrecision(4)} rad/s: V_Th = ${abs(now.Vth).toFixed(3)}∠${arg(now.Vth).toFixed(1)}° V, Z_Th = ${now.Zth.re.toFixed(2)} ${now.Zth.im >= 0 ? "+" : "−"} j${Math.abs(now.Zth.im).toFixed(2)} Ω\n` +
        `부하 ${RL} Ω 전압 = ${abs(vl).toFixed(3)}∠${arg(vl).toFixed(1)}° V. 위: Z_Th의 실수부(파랑), 허수부(주황 점선). 아래: 부하 전압의 크기`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 11. 역률 개선 (08-01) */
  (() => {
    const S = QSim.card("exp-e3-pf"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), V = 220, w = 2 * Math.PI * 60, P = S.val("P") * 1e3, pf = S.val("pf"), Cc = S.val("C") * 1e-6, Rline = 0.1;
      const Q1 = P * Math.tan(Math.acos(pf)), QC = V * V * w * Cc, Q = Q1 - QC, Sa = Math.hypot(P, Q), I = Sa / V, I0 = P / pf / V;
      const M = Math.max(P, Q1, Sa, P / pf) * 1.1;
      const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: -0.05 * M, x1: M, y0: -0.35 * M, y1: M * 0.75, equal: true, xl: "P (W)", yl: "Q (var)", pad: 26 }); f.axes({ noGrid: true });
      f.arrow(0, 0, P, Q1, c.ink3, "개선 전 S"); f.arrow(0, 0, P, 0, c.main, "P"); f.arrow(P, Q1, 0, -QC, c.acc, "축전기 −Q_C"); f.arrow(0, 0, P, Q, c.warn, "개선 후 S");
      const pf2 = P / Sa;
      S.out(`부하: P = ${(P / 1e3).toFixed(1)} kW, 역률 ${pf.toFixed(2)} (늦음) → Q = ${(Q1 / 1e3).toFixed(2)} kvar, 전류 ${I0.toFixed(1)} A (220 V, 60 Hz)\n` +
        `병렬 축전기 ${(Cc * 1e6).toFixed(0)} μF → Q_C = V²ωC = ${(QC / 1e3).toFixed(2)} kvar. 전원에서 본 Q = ${(Q / 1e3).toFixed(2)} kvar, 역률 ${pf2.toFixed(3)} ${Q >= 0 ? "(늦음)" : "(앞섬: 과보상)"}\n` +
        `전원 전류 ${I.toFixed(1)} A (${(100 * I / I0).toFixed(1)}%). 선로 저항 0.1 Ω의 손실 ${(I * I * Rline).toFixed(0)} W (개선 전 ${(I0 * I0 * Rline).toFixed(0)} W)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 12. 결합 코일: 무선 전력 전달 (09-01) */
  (() => {
    const S = QSim.card("exp-e3-coupled"); if (!S) return;
    const cv = S.$("canvas");
    const cx = (re, im = 0) => ({ re, im }), add = (a, b) => cx(a.re + b.re, a.im + b.im), mul = (a, b) => cx(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
    const div = (a, b) => { const d = b.re * b.re + b.im * b.im; return cx((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); }, abs = (a) => Math.hypot(a.re, a.im);
    function solve(k, RL, w, p) {   // 1차: V — R1 — L1, 2차: L2 — RL (공진 축전기 선택)
      const M = k * Math.sqrt(p.L1 * p.L2), Z11 = cx(p.R1, w * p.L1 - (p.res ? 1 / (w * p.C1) : 0)), Z22 = cx(RL + p.R2, w * p.L2 - (p.res ? 1 / (w * p.C2) : 0));
      const Zr = div(cx((w * M) ** 2), Z22), I1 = div(cx(p.V), add(Z11, Zr)), I2 = mul(div(cx(0, w * M), Z22), I1);
      const Pin = 0.5 * p.V * I1.re, PL = 0.5 * abs(I2) ** 2 * RL;
      return { M, Zr, I1, I2, Pin, PL };
    }
    function draw() {
      const c = C(), k = S.val("k"), RL = S.val("rl"), res = S.val("res"), f = 100e3, w = 2 * Math.PI * f;
      const p = { V: 10, R1: 0.5, R2: 0.5, L1: 24e-6, L2: 24e-6, res, C1: 1 / (w * w * 24e-6), C2: 1 / (w * w * 24e-6) };
      const now = solve(k, RL, w, p);
      const v = QSim.view(cv, 0.45), fr = QSim.frame(v, { x0: 0, x1: 1, y0: 0, y1: 1.05, xl: "결합 계수 k", yl: "효율 P_L/P_in" }); fr.axes();
      fr.fn((x) => { const s = solve(Math.max(x, 1e-3), RL, w, p); return s.PL / s.Pin; }, c.main, 2.5);
      const Pm = Math.max(...Array.from({ length: 101 }, (_, i) => solve(Math.max(i / 100, 1e-3), RL, w, p).PL));
      fr.fn((x) => solve(Math.max(x, 1e-3), RL, w, p).PL / Pm, c.acc, 1.8, [6, 3]);
      fr.dot(k, now.PL / now.Pin, c.warn, 6);
      S.out(`f = 100 kHz, 두 코일 24 μH(코일 저항 0.5 Ω씩), 전원 10 V 진폭. ${res ? "양쪽에 공진 축전기(직렬)를 달아 리액턴스를 지움" : "공진 축전기 없음"}\n` +
        `k = ${k.toFixed(2)} → M = ${(now.M * 1e6).toFixed(2)} μH, 1차에 반사된 임피던스 ${now.Zr.re.toFixed(2)} ${now.Zr.im >= 0 ? "+" : "−"} j${Math.abs(now.Zr.im).toFixed(2)} Ω\n` +
        `입력 전력 ${now.Pin.toFixed(2)} W, 부하(${RL} Ω) 전력 ${now.PL.toFixed(2)} W, 효율 ${(100 * now.PL / now.Pin).toFixed(1)}%. 파랑: 효율, 주황 점선: 부하 전력(최대 대비)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 13. 비정현 주기 입력과 Fourier 급수 (09-03) */
  (() => {
    const S = QSim.card("exp-e3-fourier"); if (!S) return;
    const [cvT, cvS] = S.$$("canvas");
    function draw() {
      const c = C(), N = S.val("n"), fc = 10 ** S.val("lfc"), f0 = 1000, V = 1;   // 0/1 V가 아니라 ±1 V 구형파, 기본 1 kHz
      // 구형파 ±V: b_n = 4V/(nπ) (n 홀수). RC 저역 통과 H = 1/(1 + j f/fc)
      const harm = []; for (let n = 1; n <= N; n += 2) { const b = 4 * V / (n * Math.PI), x = n * f0 / fc, g = 1 / Math.hypot(1, x), ph = -Math.atan(x); harm.push({ n, b, g, ph }); }
      const sIn = (t) => harm.reduce((s, h) => s + h.b * Math.sin(2 * Math.PI * h.n * f0 * t), 0);
      const sOut = (t) => harm.reduce((s, h) => s + h.b * h.g * Math.sin(2 * Math.PI * h.n * f0 * t + h.ph), 0);
      const v = QSim.view(cvT, 0.45), f = QSim.frame(v, { x0: 0, x1: 2, y0: -1.5, y1: 1.5, xl: "t (ms)", yl: "V" }); f.axes({ noGrid: true });
      f.fn((x) => ((x % 1) < 0.5 ? 1 : -1), c.rule, 1, [3, 3]); f.fn((x) => sIn(x / 1e3), c.ink3, 1.5, null, 800); f.fn((x) => sOut(x / 1e3), c.main, 2.5, null, 800);
      const vs = QSim.view(cvS, 0.3), g = QSim.frame(vs, { x0: 0, x1: Math.max(N, 9) + 1, y0: 0, y1: 1.35, xl: "고조파 번호 n", yl: "진폭" }); g.axes({ noGrid: true });
      harm.forEach((h) => { g.path([[h.n - 0.15, 0], [h.n - 0.15, h.b]], c.ink3, 4); g.path([[h.n + 0.15, 0], [h.n + 0.15, h.b * h.g]], c.main, 4); });
      const Pin = harm.reduce((s, h) => s + h.b * h.b / 2, 0), Pout = harm.reduce((s, h) => s + (h.b * h.g) ** 2 / 2, 0);
      S.out(`±1 V, 1 kHz 구형파를 ${N}차 고조파까지 더함(회색): 진폭 4/(nπ), 홀수 n만\n` +
        `RC 저역 통과(차단 ${fc.toFixed(0)} Hz)를 거친 출력(파랑) = 고조파마다 |H(nf₀)|배, 위상 ∠H(nf₀)만큼 바뀐 사인파들의 합\n` +
        `1 Ω 기준 평균 전력: 입력 ${Pin.toFixed(3)} W (완전한 구형파는 1 W), 출력 ${Pout.toFixed(3)} W. 아래 막대: 회색 입력, 파랑 출력 고조파 진폭`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 5. 최대 전력 전달과 효율 (03-03) */
  (() => {
    const S = QSim.card("exp-e3-maxpower"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), V = S.val("V"), Rt = S.val("rt"), x = 10 ** S.val("lx"), RL = x * Rt;
      const P = (r) => (V * V * r) / ((Rt + r) ** 2), Pm = V * V / (4 * Rt);
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: -2, x1: 2, y0: 0, y1: 1.08, xl: "log₁₀(R_L / R_Th)", yl: "P/P_max, 효율" }); f.axes();
      f.fn((lx) => P(10 ** lx * Rt) / Pm, c.main, 2.5);
      f.fn((lx) => 10 ** lx / (1 + 10 ** lx), c.acc, 2, [6, 3]);
      f.path([[-2, 0.5], [2, 0.5]], c.rule, 1, [2, 3]);
      f.dot(Math.log10(x), P(RL) / Pm, c.warn, 6); f.dot(Math.log10(x), x / (1 + x), c.warn, 4);
      S.out(`V_Th = ${V} V, R_Th = ${Rt} Ω, R_L = ${RL.toPrecision(3)} Ω (R_Th의 ${x.toPrecision(3)}배)\n` +
        `부하 전력 ${P(RL).toFixed(3)} W = 최대 ${Pm.toFixed(3)} W의 ${(100 * P(RL) / Pm).toFixed(1)}%. 효율 R_L/(R_Th + R_L) = ${(100 * x / (1 + x)).toFixed(1)}%\n파랑: 부하 전력/최대, 주황 점선: 효율`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();

/* 전전3 1단원 추가: 수동 부호 규약 (03-01-01) */
(() => {
  "use strict";
  if (!window.QSim) return;
  const S = QSim.card("exp-e3-sign"); if (!S) return;
  const cv = S.$("canvas");
  const f2 = (x, d = 2) => (Math.abs(x) < 5e-13 ? 0 : x).toFixed(d);
  function draw() {
    const c = QSim.col(), v = S.val("v"), i = S.val("i"), dir = S.val("dir");
    const into = dir === "in", p = into ? v * i : -v * i;
    const V = QSim.view(cv, 0.5), fr = QSim.frame(V, { x0: 0, x1: 10, y0: 0, y1: 5, pad: 4 });
    const g = V.g;
    // 소자 상자와 단자
    fr.path([[3, 4.6], [3, 3.6]], c.ink, 2); fr.path([[3, 1.4], [3, 0.4]], c.ink, 2);
    g.save(); g.strokeStyle = c.ink; g.lineWidth = 2; g.strokeRect(fr.X(2.3), fr.Y(3.6), fr.X(3.7) - fr.X(2.3), fr.Y(1.4) - fr.Y(3.6)); g.restore();
    fr.text("+", 1.8, 3.3, c.ink, "center"); fr.text("−", 1.8, 1.5, c.ink, "center");
    fr.text(`v = ${f2(v, 1)} V`, 0.9, 2.4, c.ink2, "center");
    // 전류 화살표: 위 단자 옆
    if (into) fr.arrow(3.5, 4.6, 0, -0.9, c.main, `i = ${f2(i, 1)} A`); else fr.arrow(3.5, 3.7, 0, 0.9, c.main, `i = ${f2(i, 1)} A`);
    // 전력 막대
    const P = 50, w = Math.max(-P, Math.min(P, p));
    fr.path([[6, 2.5], [9.6, 2.5]], c.rule, 1);
    g.save(); g.fillStyle = p >= 0 ? c.acc : c.main;
    const x0 = fr.X(7.8), x1 = fr.X(7.8 + 1.8 * w / P);
    g.fillRect(Math.min(x0, x1), fr.Y(2.9), Math.abs(x1 - x0), fr.Y(2.1) - fr.Y(2.9)); g.restore();
    fr.path([[7.8, 3.2], [7.8, 1.8]], c.ink3, 1);
    fr.text("공급", 6.6, 3.5, c.ink3, "center"); fr.text("흡수", 9.0, 3.5, c.ink3, "center");
    fr.text(`p = ${f2(p, 1)} W`, 7.8, 1.2, c.ink, "center");
    S.out(`화살표가 + 단자로 ${into ? "들어감" : "나옴"} → 흡수 전력 p = ${into ? "+" : "−"}vi = ${into ? "" : "−"}(${f2(v, 1)})(${f2(i, 1)}) = ${f2(p, 1)} W\n` +
      (Math.abs(p) < 1e-9 ? "전력 0: 전압이나 전류가 0입니다." : p > 0 ? `p > 0: 이 소자는 ${f2(p, 1)} W를 흡수합니다(저항, 충전되는 전지처럼).` : `p < 0: 이 소자는 ${f2(-p, 1)} W를 공급합니다(회로에 에너지를 내놓는 전원처럼).`) +
      `\n같은 실제 상황을 화살표 방향만 바꿔 그리면 i의 부호가 바뀌고 규약의 부호도 바뀌어, 흡수·공급 판정은 그대로입니다.`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();
