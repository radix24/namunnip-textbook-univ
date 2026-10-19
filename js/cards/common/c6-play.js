/* 공통6 체험 카드 묶음 2: 완충 용액, 자발성의 네 경우, 약산의 pH 근사. */
(() => {
  "use strict";
  const C = () => QSim.col();
  /* f(x) = 0의 근을 [lo, hi]에서 이분법으로 */
  const bisect = (f, lo, hi) => { let a = lo, b = hi, fa = f(a); for (let i = 0; i < 200; i++) { const m = (a + b) / 2, fm = f(m); if ((fm < 0) === (fa < 0)) { a = m; fa = fm; } else b = m; } return (a + b) / 2; };

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
  /* 3. ΔH와 ΔS의 부호로 나누는 자발성의 네 경우 (06-02). */
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
})();
