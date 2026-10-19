/* 화학과 유기신소재화학 카드 묶음 (화학14)
   단계 중합의 분자량 성장(Carothers 식, Flory 분포), 태양전지의 J-V 곡선과 효율 지표, 약물 방출 곡선 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const Q = window.QChem;
  const RED = "#b5562a", GRN = "#2f8f5b";

  /* 1. 단계 중합: 전환율과 중합도 (화학14-01-01, 01-02) */
  (() => {
    const S = QSim.card("lab-ch14-step"); if (!S) return;
    const cv = S.$("canvas");
    const M0 = 113.16;   // 나일론-6,6 반복 단위(226.32 g/mol)의 절반, 단량체 잔기 하나의 평균 질량
    function draw() {
      const c = C(), p = S.val("p") / 100, r = S.val("r");
      const Xn = (q, rr) => (1 + rr) / (1 + rr - 2 * rr * q);
      const xn = Xn(p, r), pdi = 1 + p;   // Flory 분포의 Mw/Mn (r = 1일 때)
      const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: 0.9, x1: 1.0, y0: 0, y1: 2.5, xl: "전환율 p", yl: "log₁₀(수평균 중합도 Xn)", pad: 46 }); f.axes();
      f.fn((q) => Math.log10(Xn(Math.min(q, 0.99999), 1)), c.ink3, 1.2, [4, 4]);
      f.fn((q) => Math.log10(Xn(q, r)), c.main, 2.5);
      f.dot(p, Math.log10(xn), RED, 5.5);
      const lim = (1 + r) / (1 - r);
      S.out(`전환율 p = ${p.toFixed(3)}, 당량비 r = ${r.toFixed(3)} · 점선: r = 1\nXn = (1 + r)/(1 + r − 2rp) = ${xn.toFixed(1)} → Mn ≈ Xn × ${M0} = ${Math.round(xn * M0).toLocaleString()} g/mol (나일론-6,6 기준)\n${r < 1 ? `p = 1에서도 Xn의 한계 = (1 + r)/(1 − r) = ${lim.toFixed(0)}` : "r = 1이면 p → 1에서 Xn → ∞"} · Flory 분포 Mw/Mn = 1 + p = ${pdi.toFixed(3)}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 태양전지의 J-V 곡선 (화학14-04-02) */
  (() => {
    const S = QSim.card("lab-ch14-jv"); if (!S) return;
    const cv = S.$("canvas");
    const Vt = 0.025852;   // kT/q at 300 K (V)
    function draw() {
      const c = C(), Jsc = S.val("jsc"), J0 = 10 ** S.val("lj0"), n = S.val("n"), Rs = S.val("rs"), Rsh = S.val("rsh");
      // J (mA/cm²) = Jsc − J0(exp((V + J Rs)/(n Vt)) − 1) − (V + J Rs)/Rsh, R는 Ω·cm² (J/1000 A/cm²)
      const Jof = (V) => Q.bisect((J) => Jsc - J0 * (Math.exp((V + J * Rs / 1000) / (n * Vt)) - 1) - (V + J * Rs / 1000) / Rsh * 1000 - J, -1e4, Jsc + 1);
      const Vid = n * Vt * Math.log(Jsc / J0 + 1);   // 저항이 없을 때의 V_oc: 이보다 조금 위까지만 찾아 지수 넘침을 피한다
      const Voc = Q.bisect((V) => Jof(V), 0, Vid + 0.05);
      let best = [0, 0, 0]; const N = 400;
      for (let i = 0; i <= N; i++) { const V = Voc * i / N, J = Jof(V), P = V * J; if (P > best[0]) best = [P, V, J]; }
      const Jsc0 = Jof(0), FF = best[0] / (Voc * Jsc0), PCE = best[0];   // 입사광 100 mW/cm²
      const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: 0, x1: 1.2, y0: 0, y1: 30, xl: "전압 V (V)", yl: "전류 밀도 J (mA/cm²)", pad: 44 }); f.axes();
      const g = v.g; g.fillStyle = "rgba(47,143,91,0.18)"; g.fillRect(f.X(0), f.Y(best[2]), f.X(best[1]) - f.X(0), f.Y(0) - f.Y(best[2]));
      f.fn((V) => (V <= Voc ? Jof(V) : NaN), c.main, 2.5);
      f.dot(best[1], best[2], RED, 5.5); f.dot(Voc, 0, c.ink2, 4); f.dot(0, Jsc0, c.ink2, 4);
      S.out(`Jsc = ${Jsc0.toFixed(2)} mA/cm², Voc = ${Voc.toFixed(3)} V (J₀ = ${Q.sci(J0, 1)} mA/cm², n = ${n.toFixed(1)}, Rs = ${Rs} Ω·cm², Rsh = ${Rsh} Ω·cm²)\n최대 출력점: V = ${best[1].toFixed(3)} V, J = ${best[2].toFixed(2)} mA/cm², P = ${best[0].toFixed(2)} mW/cm² (색칠한 사각형)\nFF = Pmax/(Voc·Jsc) = ${FF.toFixed(3)}, 효율 PCE = Pmax/(100 mW/cm²) = ${PCE.toFixed(2)}%`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 약물 방출 곡선 (화학14-05-02) */
  (() => {
    const S = QSim.card("lab-ch14-release"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), k0 = S.val("k0") / 100, k1 = S.val("k1"), kh = S.val("kh") / 100, t = S.val("t");
      const z = (x) => Math.min(1, k0 * x), fo = (x) => 1 - Math.exp(-k1 * x), hg = (x) => Math.min(1, kh * Math.sqrt(x));
      const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: 0, x1: 48, y0: 0, y1: 1.05, xl: "시간 (h)", yl: "방출된 비율 Mt/M∞", pad: 44 }); f.axes();
      f.fn(z, c.main, 2.2); f.fn(fo, RED, 2.2); f.fn(hg, GRN, 2.2);
      f.text("0차", 40, Math.min(z(40), 1) - 0.05, c.main); f.text("1차", 30, fo(30) + 0.04, RED); f.text("Higuchi", 36, hg(36) - 0.07, GRN);
      f.path([[t, 0], [t, 1.05]], c.ink3, 1.2, [4, 4]);
      const h0 = 0.5 / k0, h1 = Math.log(2) / k1, hh = (0.5 / kh) ** 2;   // 절반 방출 시간 (식으로 바로 계산)
      S.out(`${t} h에서 방출 비율: 0차 ${z(t).toFixed(3)}, 1차 ${fo(t).toFixed(3)}, Higuchi ${hg(t).toFixed(3)}\n절반 방출 시간: 0차 0.5/k₀ = ${h0.toFixed(2)} h, 1차 ln2/k₁ = ${h1.toFixed(2)} h, Higuchi (0.5/k_H)² = ${hh.toFixed(2)} h\n처음 1 h 방출(초기 폭발 정도): 0차 ${z(1).toFixed(3)}, 1차 ${fo(1).toFixed(3)}, Higuchi ${hg(1).toFixed(3)}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
