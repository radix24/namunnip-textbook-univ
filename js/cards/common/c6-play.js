/* 공통6 체험 카드 묶음 2: 르샤틀리에 원리(평형 이동 계산), 완충 용액. */
(() => {
  "use strict";
  const C = () => QSim.col();
  /* f(x) = 0의 근을 [lo, hi]에서 이분법으로 */
  const bisect = (f, lo, hi) => { let a = lo, b = hi, fa = f(a); for (let i = 0; i < 200; i++) { const m = (a + b) / 2, fm = f(m); if ((fm < 0) === (fa < 0)) { a = m; fa = fm; } else b = m; } return (a + b) / 2; };

  /* 1. H2 + I2 ⇌ 2HI에 물질을 더하면 평형은 얼마나 움직일까 (03-03) */
  (() => {
    const S = QSim.card("lab-c6-shift"); if (!S) return;
    const cv = S.$("canvas");
    /* 처음 평형: K = 50.5에서 [H2] = [I2] = 0.22, [HI] = 1.56 (예제 3.3.1과 같음) */
    function draw() {
      const c = C(), aH = S.val("h2"), aI = S.val("i2"), aHI = S.val("hi"), K = S.val("K");
      const h0 = 0.22 + aH, i0 = 0.22 + aI, hi0 = 1.56 + aHI;
      const Q = (hi0 * hi0) / (h0 * i0);
      /* 정반응으로 x만큼(음수면 역반응): (hi0 + 2x)² = K(h0 − x)(i0 − x) */
      const g = (x) => (hi0 + 2 * x) ** 2 - K * (h0 - x) * (i0 - x);
      const x = Q < K ? bisect(g, 0, Math.min(h0, i0) - 1e-12) : bisect(g, -hi0 / 2 + 1e-12, 0);
      const after = [h0 - x, i0 - x, hi0 + 2 * x], before = [h0, i0, hi0], first = [0.22, 0.22, 1.56];
      const top = Math.max(2.4, ...before, ...after) * 1.1;
      const v = QSim.view(cv, 0.5), F = QSim.frame(v, { x0: 0, x1: 3, y0: 0, y1: top, yl: "M" }); F.axes({ noGrid: true });
      const gg = v.g, bw = F.sx * 0.22, names = ["H₂", "I₂", "HI"];
      names.forEach((nm, i) => {
        const xc = i + 0.5;
        [[first[i], c.rule, -1.5], [before[i], c.soft, -0.5], [after[i], c.main, 0.5]].forEach(([val, col, off]) => { gg.fillStyle = col; gg.fillRect(F.X(xc) + off * bw, F.Y(val), bw * 0.95, F.Y(0) - F.Y(val)); });
        F.text(nm, xc, top * 0.93, c.ink, "center");
        F.text(after[i].toFixed(3), xc + 0.12, after[i] + top * 0.02, c.ink, "center");
      });
      const dir = Math.abs(Q - K) < 1e-9 ? "평형 그대로" : Q < K ? "Q < K: 정반응 쪽(HI 생성)" : "Q > K: 역반응 쪽(HI 분해)";
      S.out(`넣은 양: H₂ +${aH.toFixed(2)}, I₂ +${aI.toFixed(2)}, HI +${aHI.toFixed(2)} M,  K = ${K.toFixed(1)}  (회색: 처음 평형, 연보라: 넣은 직후, 보라: 새 평형)\n` +
        `넣은 직후 Q = ${Q.toFixed(2)} → ${dir},  반응한 양 x = ${x.toFixed(4)} M\n` +
        `새 평형: [H₂] = ${after[0].toFixed(3)}, [I₂] = ${after[1].toFixed(3)}, [HI] = ${after[2].toFixed(3)} M,  확인 Q = ${((after[2] ** 2) / (after[0] * after[1])).toFixed(2)}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 완충 용액에 산이나 염기를 넣으면 (05-01) */
  (() => {
    const S = QSim.card("lab-c6-buffer"); if (!S) return;
    const cv = S.$("canvas"), pKa = 4.74, Ka = Math.pow(10, -pKa), Kw = 1e-14;
    /* 부피 1 L로 보고, 강산·강염기를 넣은 뒤 전하 균형 [H+] + [Na+] = [OH−] + [A−] + [Cl−]를 정확히 푼다 */
    const pH = (HA, A, add) => {
      const Ctot = HA + A, Na = A + Math.max(0, add), Cl = Math.max(0, -add);
      const f = (lh) => { const h = Math.pow(10, -lh); return h + Na - Kw / h - (Ctot * Ka) / (Ka + h) - Cl; };
      return bisect((lh) => -f(lh), 0, 14);
    };
    function draw() {
      const c = C(), HA = S.val("ha"), A = S.val("a");
      const add = S.val("add");
      const v = QSim.view(cv, 0.55), F = QSim.frame(v, { x0: -0.1, x1: 0.1, y0: 0, y1: 14, xl: "넣은 강염기(+) / 강산(−) (mol)", yl: "pH" }); F.axes();
      const buf = [], water = [];
      for (let k = 0; k <= 200; k++) { const d = -0.1 + (0.2 * k) / 200; buf.push([d, pH(HA, A, d)]); water.push([d, pH(0, 0, d)]); }
      F.path(water, c.ink3, 1.5, [5, 4]); F.path(buf, c.main, 2.5);
      const p0 = pH(HA, A, 0), p1 = pH(HA, A, add), w1 = pH(0, 0, add);
      F.dot(add, p1, c.acc, 6);
      F.path([[add, 0], [add, 14]], c.rule, 1, [3, 3]);
      const hh = HA > 0 && A > 0 ? (pKa + Math.log10(A / HA)).toFixed(2) : "-";
      S.out(`아세트산 ${HA.toFixed(2)} mol + 아세트산 나트륨 ${A.toFixed(2)} mol, 물을 더해 1 L (pKa = 4.74)\n` +
        `처음 pH = ${p0.toFixed(2)}  (헨더슨-하셀바흐 어림 ${hh})\n` +
        `${add >= 0 ? "NaOH" : "HCl"} ${Math.abs(add).toFixed(3)} mol을 넣은 뒤 pH = ${p1.toFixed(2)} (변화 ${(p1 - p0 >= 0 ? "+" : "") + (p1 - p0).toFixed(2)}),  같은 양을 순수한 물 1 L에 넣으면 pH = ${w1.toFixed(2)}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
  /* 3. ΔH와 ΔS의 부호로 나누는 자발성의 네 경우 (06-02). 같은 절의 lab-c6-gibbs(c56-exp.js)는 특정 반응의 경계 온도를 다룬다 */
  (() => {
    const S = QSim.card("lab-c6-gibbs-play"); if (!S) return;
    const cv = S.$("canvas"), R = 8.314;
    /* 미리 정한 반응: [ΔH (kJ/mol), ΔS (J/(mol·K)), 이름] */
    const PRE = { h2o2: [-196.0, 125.8, "2H₂O₂ → 2H₂O + O₂ (ΔH < 0, ΔS > 0)"], o3: [285.4, -137.8, "3O₂ → 2O₃ (ΔH > 0, ΔS < 0)"], nh3: [-92.2, -198.7, "N₂ + 3H₂ → 2NH₃ (ΔH < 0, ΔS < 0)"], ice: [6.01, 22.0, "얼음 → 물 (ΔH > 0, ΔS > 0)"], free: [null, null, "직접 정하기"] };
    function draw() {
      const c = C(), pre = PRE[S.val("m")];
      const dH = pre[0] ?? S.val("dH"), dS = pre[1] ?? S.val("dS"), T = S.val("T");
      const G = (t) => dH - (t * dS) / 1000;
      const v = QSim.view(cv, 0.55);
      const lo = Math.min(G(0), G(1500), 0), hi = Math.max(G(0), G(1500), 0), pad = (hi - lo) * 0.12 + 1;
      const F = QSim.frame(v, { x0: 0, x1: 1500, y0: lo - pad, y1: hi + pad, xl: "T (K)", yl: "ΔG (kJ/mol)", pad: 40 }); F.axes();
      F.path([[0, 0], [1500, 0]], c.ink3, 1);
      F.fn(G, c.main, 2.5);
      F.path([[T, lo - pad], [T, hi + pad]], c.rule, 1, [3, 3]);
      F.dot(T, G(T), c.acc, 6);
      const g = G(T), K = Math.exp((-g * 1000) / (R * T));
      const Tx = dS !== 0 ? (dH * 1000) / dS : NaN;
      if (Tx > 0 && Tx < 1500) { F.dot(Tx, 0, c.warn, 5); F.text(`${Tx.toFixed(0)} K`, Tx, pad * 0.4, c.warn, "center"); }
      const kind = Math.abs(g) < 0.05 ? "평형 (ΔG ≈ 0)" : g < 0 ? "자발적 (ΔG < 0, 정반응 쪽)" : "비자발적 (ΔG > 0, 역반응 쪽)";
      const cross = Tx > 0 ? `ΔG = 0이 되는 온도 T = ΔH/ΔS = ${Tx.toFixed(0)} K` : (dH < 0 && dS > 0 ? "모든 온도에서 자발적 (ΔH < 0, ΔS > 0)" : dH > 0 && dS < 0 ? "어느 온도에서도 비자발적 (ΔH > 0, ΔS < 0)" : "");
      S.out(`${pre[2]}: ΔH = ${dH.toFixed(1)} kJ/mol, ΔS = ${dS.toFixed(1)} J/(mol·K)\n` +
        `T = ${T.toFixed(0)} K에서 ΔG = ${dH.toFixed(1)} − ${T.toFixed(0)} × ${dS < 0 ? "(" + (dS / 1000).toFixed(4) + ")" : (dS / 1000).toFixed(4)} = ${g.toFixed(1)} kJ/mol → ${kind}\n` +
        `${cross},  K = e^(−ΔG/RT) = ${K < 1e-3 || K > 1e4 ? K.toExponential(2) : K.toFixed(3)}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
  /* 4. 약산의 pH: 근사식 √(KaC)는 언제 맞고 언제 틀릴까 (04-01) */
  (() => {
    const S = QSim.card("lab-c6-weak"); if (!S) return;
    const cv = S.$("canvas"), Kw = 1e-14;
    const PRE = { ac: [4.74, "아세트산"], hf: [3.17, "플루오린화 수소산"], hcn: [9.21, "사이안화 수소산"], free: [null, "직접 정하기"] };
    /* 정확한 pH: 전하 균형 [H+] = [A-] + [OH-], [A-] = KaC/(Ka + [H+]) */
    const exact = (Ka, C) => bisect((lh) => { const h = Math.pow(10, -lh); return h - (Ka * C) / (Ka + h) - Kw / h; }, 0, 14);
    const approx = (Ka, C) => -0.5 * Math.log10(Ka * C);
    function draw() {
      const c = C(), pre = PRE[S.val("m")], pKa = pre[0] ?? S.val("pka"), Ka = Math.pow(10, -pKa);
      const lc = S.val("lc"), Cc = Math.pow(10, lc);
      const v = QSim.view(cv, 0.55), F = QSim.frame(v, { x0: -6, x1: 0, y0: 0, y1: 8, xl: "log C (C는 몰농도, M)", yl: "pH", pad: 36 }); F.axes();
      F.fn((x) => approx(Ka, Math.pow(10, x)), c.acc, 2, [6, 4]);
      F.fn((x) => exact(Ka, Math.pow(10, x)), c.main, 2.5);
      F.path([[lc, 0], [lc, 8]], c.rule, 1, [3, 3]);
      const pe = exact(Ka, Cc), pa = approx(Ka, Cc), h = Math.pow(10, -pe), alpha = (Ka / (Ka + h)) * 100;
      F.dot(lc, pe, c.main, 6); F.dot(lc, pa, c.acc, 5);
      const err = Math.abs(pa - pe);
      S.out(`${pre[1]} (pKa = ${pKa.toFixed(2)}, Ka = ${Ka.toExponential(2)}),  C = ${Cc.toExponential(2)} M\n` +
        `정확한 pH = ${pe.toFixed(3)}  (보라 실선),  근사식 pH = −½log(KaC) = ${pa.toFixed(3)}  (주황 점선),  차이 ${err.toFixed(3)}\n` +
        `이온화한 비율 = ${alpha.toFixed(2)}%  → ${alpha >= 5 ? "5%를 넘어 근사(C − x ≈ C)가 틀리기 시작함" : err > 0.05 ? "이온화 비율은 작지만 산이 너무 묽어 물이 내놓는 H⁺를 무시할 수 없음(근사가 틀림)" : "5% 미만이고 물의 H⁺도 무시할 만해 근사가 잘 맞음"}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 5. 어는점 내림과 끓는점 오름, 그리고 몰질량 거꾸로 구하기 (01-02) */
  (() => {
    const S = QSim.card("lab-c6-colli"); if (!S) return;
    const cv = S.$("canvas"), Kf = 1.86, Kb = 0.512;
    /* [몰질량 g/mol, 반트호프 인자 i, 이름] */
    const PRE = { glu: [180.16, 1, "포도당"], suc: [342.30, 1, "설탕"], urea: [60.06, 1, "요소"], nacl: [58.44, 2, "염화 나트륨"], cacl2: [110.98, 3, "염화 칼슘"] };
    function draw() {
      const c = C(), [M, i, nm] = PRE[S.val("m")], g = S.val("g"), w = S.val("w");
      const mol = g / M, m = mol / (w / 1000), dTf = i * Kf * m, dTb = i * Kb * m;
      const v = QSim.view(cv, 0.45), F = QSim.frame(v, { x0: 0, x1: 4, y0: -12, y1: 108, yl: "°C", pad: 36 }); F.axes({ noGrid: true });
      const gg = v.g, bw = F.sx * 0.5;
      const bar = (xc, top, col) => { gg.fillStyle = col; gg.fillRect(F.X(xc) - bw / 2, F.Y(top), bw, F.Y(-12) - F.Y(top)); };
      bar(1, 0, c.rule); bar(1.8, -dTf, c.main); bar(2.6, 100, c.rule); bar(3.4, 100 + dTb, c.warn);
      F.text("물 어는점", 1, -10, c.ink, "center"); F.text("용액", 1.8, -10, c.ink, "center");
      F.text("물 끓는점", 2.6, 104, c.ink, "center"); F.text("용액", 3.4, 104, c.ink, "center");
      F.text(`−${dTf.toFixed(2)}`, 1.8, -dTf + 4, c.ink, "center");
      /* 같은 용액의 어는점 내림을 측정했다고 보고 몰질량을 거꾸로 구한다(i를 1로 잘못 두면 어떻게 되는지도) */
      const Mback = (i * Kf * g) / (dTf * (w / 1000)), Mwrong = (Kf * g) / (dTf * (w / 1000));
      const pi = i * m * 0.08206 * 298;
      S.out(`${nm} ${g.toFixed(1)} g (몰질량 ${M} g/mol) → ${mol.toFixed(4)} mol을 물 ${w.toFixed(0)} g에 녹임: 몰랄 농도 ${m.toFixed(3)} mol/kg, 입자 수 배율 i = ${i}\n` +
        `어는점 내림 ΔTf = i·Kf·m = ${i} × 1.86 × ${m.toFixed(3)} = ${dTf.toFixed(2)} °C → 어는점 −${dTf.toFixed(2)} °C,  끓는점 오름 ΔTb = ${dTb.toFixed(3)} °C\n` +
        `삼투압(묽어서 몰농도 ≈ 몰랄 농도로 봄, 25 °C) π = iMRT ≈ ${pi.toFixed(2)} atm\n` +
        `거꾸로: ΔTf ${dTf.toFixed(2)} °C를 측정했다면 몰질량 = i·Kf·(질량)/(ΔTf·kg) = ${Mback.toFixed(1)} g/mol` + (i > 1 ? ` (i를 1로 잘못 두면 ${Mwrong.toFixed(1)} g/mol로 틀림)` : ""));
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
