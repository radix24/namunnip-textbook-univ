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
