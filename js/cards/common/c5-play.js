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
  /* 3. 결합 쌍극자를 더해 분자의 극성 구하기 (09-02) */
  (() => {
    const S = QSim.card("lab-c5-dipole"); if (!S) return;
    const cv = S.$("canvas");
    const PRE = { h2o: [1.5, 104.5, "H₂O (굽은형)", 1], co2: [2.3, 180, "CO₂ (직선형)", -1], so2: [1.6, 119, "SO₂ (굽은형)", -1], free: [null, null, "직접 정하기", 1] };
    function draw() {
      const c = C(), pre = PRE[S.val("m")];
      const mu = pre[0] ?? S.val("mu"), ang = pre[1] ?? S.val("ang");
      const v = QSim.view(cv, 0.62), F = QSim.frame(v, { x0: -3, x1: 3, y0: -2.6, y1: 2.6, equal: true }); F.axes({ noGrid: true });
      const h = ((ang / 2) * Math.PI) / 180, L = 1.6;
      /* 가운데 원자는 원점, 바깥 원자 두 개는 아래쪽으로 벌어짐. 결합 쌍극자는 전기음성도가 큰 쪽을 향한다:
         H₂O는 바깥 → 가운데(O), CO₂·SO₂는 가운데 → 바깥(O) */
      const A = [-L * Math.sin(h), -L * Math.cos(h)], B = [L * Math.sin(h), -L * Math.cos(h)];
      F.path([A, [0, 0], B], c.ink3, 3);
      F.dot(0, 0, c.warn, 14); F.dot(A[0], A[1], c.soft, 10); F.dot(B[0], B[1], c.soft, 10);
      const s = 0.55;
      const sg = pre[3], dA = [(-A[0] / L) * mu * s * sg, (-A[1] / L) * mu * s * sg], dB = [(-B[0] / L) * mu * s * sg, (-B[1] / L) * mu * s * sg];
      const st = (P, d) => (sg > 0 ? P : [P[0] * 0.25, P[1] * 0.25]);
      F.arrow(...st(A, dA), dA[0], dA[1], c.main); F.arrow(...st(B, dB), dB[0], dB[1], c.main);
      const R = [dA[0] + dB[0], dA[1] + dB[1]], tot = (2 * mu * Math.cos(h));
      if (Math.abs(tot) > 1e-6) F.arrow(0, 0.2, R[0], R[1], c.acc, "합");
      S.out(`${pre[2]}: 결합 쌍극자 ${mu.toFixed(2)} D 두 개, 결합각 ${ang.toFixed(1)}°\n` +
        `이등분선 방향 성분 ${mu.toFixed(2)} × cos(${(ang / 2).toFixed(2)}°) = ${(mu * Math.cos(h)).toFixed(3)} D씩 더해지고, 옆 성분은 서로 지워짐\n` +
        `분자의 쌍극자 모멘트 = 2μ cos(θ/2) = ${Math.abs(tot) < 5e-4 ? "0 (무극성)" : Math.abs(tot).toFixed(2) + " D (극성)"}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
  /* 4. 상평형 그림 읽기: 온도와 압력을 정하면 어떤 상인가 (11-02) */
  (() => {
    const S = QSim.card("lab-c5-phase"); if (!S) return;
    const cv = S.$("canvas");
    /* 간단한 모형: 승화·증발 곡선은 클라우지우스-클라페이롱 식 ln P = ln Pt − a(1/T − 1/Tt),
       녹는 곡선은 직선 P = Pt + s(T − Tt). 물은 기울기가 음수(얼음이 물보다 부피가 큼).
       a값은 물은 1 atm 끓는점(373 K)·승화 곡선, CO₂는 1 atm 승화점(195 K)과 임계점을 지나도록 정했다. 단위: K, atm */
    const SUB = {
      h2o: { nm: "물", Tt: 273.16, Pt: 0.00604, Tc: 647.1, Pc: 217.7, aS: 6134, aV: 5214, s: -134, T0: 150, T1: 700 },
      co2: { nm: "이산화 탄소", Tt: 216.6, Pt: 5.11, Tc: 304.1, Pc: 72.8, aS: 3142, aV: 2000, s: 35, T0: 150, T1: 350 },
    };
    const curve = (d, a) => (T) => d.Pt * Math.exp(-a * (1 / T - 1 / d.Tt));
    function phase(d, T, P) {
      if (T > d.Tc && P > d.Pc) return "초임계 유체";
      const Pm = d.Pt + d.s * (T - d.Tt);
      if (T <= d.Tt) {
        if (P < curve(d, d.aS)(T)) return "기체";
        return d.s < 0 && P > Pm ? "액체" : "고체";
      }
      if (P < curve(d, d.aV)(T) || T > d.Tc) return "기체";
      return d.s > 0 && P > Pm ? "고체" : "액체";
    }
    function draw() {
      const c = C(), d = SUB[S.val("m")], T = d.T0 + (S.val("tt") / 100) * (d.T1 - d.T0), lp = S.val("lp"), P = Math.pow(10, lp);
      const v = QSim.view(cv, 0.6), F = QSim.frame(v, { x0: d.T0, x1: d.T1, y0: -4, y1: 3, xl: "T (K)", yl: "log P (atm)", pad: 36 }); F.axes();
      const sub = [], vap = [], mel = [];
      for (let k = 0; k <= 120; k++) { const t = d.T0 + (k / 120) * (d.Tt - d.T0); sub.push([t, Math.log10(curve(d, d.aS)(t))]); }
      for (let k = 0; k <= 120; k++) { const t = d.Tt + (k / 120) * (d.Tc - d.Tt); vap.push([t, Math.log10(curve(d, d.aV)(t))]); }
      for (let k = 0; k <= 120; k++) { const Pm = d.Pt * Math.pow(10, (k / 120) * Math.log10(1000 / d.Pt)); mel.push([d.Tt + (Pm - d.Pt) / d.s, Math.log10(Pm)]); }
      F.path(sub, c.ink, 2); F.path(vap, c.ink, 2); F.path(mel, c.ink, 2);
      F.path([[d.T0, 0], [d.T1, 0]], c.rule, 1, [4, 4]); F.text("1 atm", d.T1, 0.12, c.ink3, "right");
      const Pcm = curve(d, d.aV)(d.Tc);
      F.dot(d.Tt, Math.log10(d.Pt), c.acc, 6); F.text("삼중점", d.Tt + (d.T1 - d.T0) * 0.015, Math.log10(d.Pt) - 0.3, c.ink, "left");
      F.dot(d.Tc, Math.log10(Pcm), c.warn, 6); F.text("임계점", d.Tc, Math.log10(Pcm) + 0.25, c.ink, "center");
      F.dot(T, lp, c.main, 7);
      const ph = phase(d, T, P);
      const bpHere = P > d.Pt && P < Math.min(Pcm, d.Pc) ? 1 / (1 / d.Tt - Math.log(P / d.Pt) / d.aV) : NaN;
      S.out(`${d.nm}: T = ${T.toFixed(0)} K (${(T - 273.15).toFixed(0)} °C), P = ${P < 0.01 ? P.toExponential(2) : P.toFixed(P < 10 ? 3 : 1)} atm → ${ph}\n` +
        `삼중점 ${d.Tt} K, ${d.Pt} atm.  실제 임계점 ${d.Tc} K, ${d.Pc} atm (그림의 증발 곡선은 단순 모형이라 끝점 압력이 조금 다름)\n` +
        (isNaN(bpHere) ? (P <= d.Pt ? `삼중점 압력보다 낮아 액체 상태가 없습니다. 가열하면 고체가 곧바로 기체가 됩니다(승화).` : `임계 압력보다 높아 끓는 일이 없습니다. 가열하면 액체가 끓지 않고 초임계 유체로 이어집니다.`) : `이 압력에서 끓는점(모형) ≈ ${bpHere.toFixed(0)} K (${(bpHere - 273.15).toFixed(0)} °C)`));
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
