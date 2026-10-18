/* 공통5 체험 카드 묶음 2: 상자 속 입자, 수소 원자의 선 스펙트럼. */
(() => {
  "use strict";
  const C = () => QSim.col();
  const h = 6.62607e-34, me = 9.10938e-31, eV = 1.602177e-19, hc = 1239.84; /* hc: eV·nm */
  const wl2rgb = (w) => {
    let r = 0, g = 0, b = 0;
    if (w >= 380 && w < 440) { r = (440 - w) / 60; b = 1; } else if (w < 490) { g = (w - 440) / 50; b = 1; } else if (w < 510) { g = 1; b = (510 - w) / 20; }
    else if (w < 580) { r = (w - 510) / 70; g = 1; } else if (w < 645) { r = 1; g = (645 - w) / 65; } else if (w <= 750) { r = 1; }
    return `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`;
  };

  /* 1. 상자 속 입자 (06-05) */
  (() => {
    const S = QSim.card("lab-c5-box"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), L = S.val("L"), n = S.val("n"), prob = S.val("p");
      const E = (k) => (k * k * h * h) / (8 * me * (L * 1e-9) ** 2) / eV;
      const top = Math.max(4, n + 1), Emax = E(top) * 1.08;
      const v = QSim.view(cv, 0.7), F = QSim.frame(v, { x0: -0.15, x1: 1.15, y0: 0, y1: Emax, yl: "에너지 (eV)" });
      const g = v.g;
      F.path([[0, 0], [0, Emax]], c.ink, 3); F.path([[1, 0], [1, Emax]], c.ink, 3);
      const amp = E(1) * 0.9;
      for (let k = 1; k <= top; k++) {
        const Ek = E(k), on = k === n;
        F.path([[0, Ek], [1, Ek]], on ? c.acc : c.rule, on ? 2 : 1, on ? null : [4, 3]);
        F.fn((x) => (x >= 0 && x <= 1 ? Ek + amp * (prob ? 2 * Math.sin(k * Math.PI * x) ** 2 : Math.SQRT2 * Math.sin(k * Math.PI * x)) * 0.5 : NaN), on ? c.main : c.ink3, on ? 2.5 : 1, null, 300);
        F.text(`n=${k}`, 1.03, Ek, on ? c.acc : c.ink3);
      }
      const En = E(n), d21 = E(2) - E(1), dn = n > 1 ? En - E(n - 1) : NaN;
      S.out(`전자 하나, 상자 길이 L = ${L.toFixed(2)} nm,  Eₙ = n²h²/(8mL²)\n` +
        `E₁ = ${E(1).toFixed(4)} eV,  E${n} = ${En.toFixed(4)} eV (= ${n * n} × E₁),  마디 수 ${n - 1}개\n` +
        `2 → 1로 내려올 때 내는 빛: ΔE = ${d21.toFixed(4)} eV, 파장 λ = hc/ΔE = ${(hc / d21).toFixed(1)} nm` +
        (n > 2 ? `\n${n} → ${n - 1}: ΔE = ${dn.toFixed(4)} eV, λ = ${(hc / dn).toFixed(1)} nm` : ""));
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 수소 원자의 선 스펙트럼 (06-01) */
  (() => {
    const S = QSim.card("lab-c5-hspec"); if (!S) return;
    const cv = S.$("canvas"), R = 13.606;
    const series = { 1: "라이먼 계열(자외선)", 2: "발머 계열(가시광선 근처)", 3: "파셴 계열(적외선)" };
    function draw() {
      const c = C(), lo = +S.val("lo"); let up = S.val("up"); if (up <= lo) up = lo + 1;
      const E = (n) => -R / (n * n), dE = E(up) - E(lo), lam = hc / dE;
      const v = QSim.view(cv, 0.62), F = QSim.frame(v, { x0: 0, x1: 10, y0: -15, y1: 1.5, yl: "E (eV)" }); F.axes({ noGrid: true });
      for (let n = 1; n <= 8; n++) { F.path([[0.4, E(n)], [4.2, E(n)]], n === up || n === lo ? c.ink : c.rule, n === up || n === lo ? 2 : 1); F.text(`n=${n}`, 4.3, E(n) - 0.15, c.ink3); }
      F.path([[0.4, 0], [4.2, 0]], c.ink3, 1, [3, 3]); F.text("0 (이온화)", 4.3, 0.2, c.ink3);
      F.arrow(2.3, E(up), 0, E(lo) - E(up) + 0.25, c.acc, "빛");
      /* 스펙트럼 띠: 80 ~ 2000 nm (로그 눈금) */
      const g = v.g, X = (w) => 5.6 + (4.2 * Math.log(w / 80)) / Math.log(2000 / 80);
      for (let w = 380; w <= 750; w += 2) { g.fillStyle = wl2rgb(w); g.fillRect(F.X(X(w)), F.Y(-3), F.X(X(w + 2)) - F.X(X(w)) + 1, F.Y(-9) - F.Y(-3)); }
      g.save(); g.strokeStyle = c.rule; g.strokeRect(F.X(X(80)), F.Y(-3), F.X(X(2000)) - F.X(X(80)), F.Y(-9) - F.Y(-3)); g.restore();
      [100, 400, 700, 1000, 2000].forEach((w) => F.text(String(w), X(w), -10, c.ink3, "center"));
      F.text("파장 (nm)", 7.7, -11.5, c.ink3, "center");
      for (let n = lo + 1; n <= 8; n++) { const w = hc / (E(n) - E(lo)); if (w >= 80 && w <= 2000) F.path([[X(w), -2.4], [X(w), -9.6]], n === up ? c.acc : c.ink3, n === up ? 3 : 1); }
      const vis = lam >= 380 && lam <= 750;
      S.out(`n = ${up} → n = ${lo}  (${series[lo]})\nΔE = 13.606 × (1/${lo}² − 1/${up}²) = ${dE.toFixed(4)} eV\n` +
        `λ = hc/ΔE = 1239.84 / ${dE.toFixed(4)} = ${lam.toFixed(1)} nm  ${vis ? "눈에 보이는 빛" : lam < 380 ? "자외선 (눈에 안 보임)" : "적외선 (눈에 안 보임)"}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
