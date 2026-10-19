/* 화학과 생물유기화학 카드 묶음 (화학12)
   아미노산의 전하와 등전점, 효소의 pH-속도 곡선 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const RED = "#b5562a", GRN = "#2f8f5b";


  /* 1. 아미노산의 알짜 전하와 등전점 (화학12-02-01) */
  (() => {
    const S = QSim.card("lab-ch12-pi"); if (!S) return;
    const cv = S.$("canvas");
    // [이름, 산성기 pKa(중성 → 음전하), 염기성기 pKa(양전하 → 중성), 곁사슬 설명]
    const AA = {
      Gly: ["글라이신", [2.34], [9.60], "곁사슬 없음 (H)"], Ala: ["알라닌", [2.34], [9.69], "곁사슬 CH₃"],
      Asp: ["아스파트산", [1.88, 3.65], [9.60], "곁사슬 COOH (pKa 3.65)"], Glu: ["글루탐산", [2.19, 4.25], [9.67], "곁사슬 COOH (pKa 4.25)"],
      Lys: ["라이신", [2.18], [8.95, 10.53], "곁사슬 NH₃⁺ (pKa 10.53)"], Arg: ["아르지닌", [2.17], [9.04, 12.48], "곁사슬 구아니디늄 (pKa 12.48)"],
      His: ["히스티딘", [1.82], [6.00, 9.17], "곁사슬 이미다졸륨 (pKa 6.00)"], Cys: ["시스테인", [1.96, 8.18], [10.28], "곁사슬 SH (pKa 8.18)"]
    };
    const charge = (a, pH) => a[1].reduce((q, p) => q - 1 / (1 + 10 ** (p - pH)), 0) + a[2].reduce((q, p) => q + 1 / (1 + 10 ** (pH - p)), 0);
    function draw() {
      const c = C(), key = S.val("aa"), pH = S.val("pH"), a = AA[key];
      let lo = 0, hi = 14; for (let i = 0; i < 100; i++) { const m = (lo + hi) / 2; if (charge(a, m) > 0) lo = m; else hi = m; }
      const pI = (lo + hi) / 2;
      const all = [...a[1], ...a[2]].sort((x, y) => x - y);
      // 근사: 전하 0 형태를 사이에 둔 두 pKa의 평균
      // 가장 낮은 pH에서 전하는 +(염기성기 수)이고 pKa를 하나 지날 때마다 1씩 준다
      const nPos = a[2].length, approx = (all[nPos - 1] + all[nPos]) / 2;
      const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: 0, x1: 14, y0: -2.3, y1: 2.3, xl: "pH", yl: "알짜 전하", pad: 40 }); f.axes();
      f.fn(() => 0, c.ink3, 1);
      f.fn((x) => charge(a, x), c.main, 2.5);
      all.forEach((p) => f.dot(p, charge(a, p), c.ink3, 3.5));
      f.dot(pI, 0, GRN, 6);
      const q0 = charge(a, pH), q = Math.abs(q0) < 0.005 ? 0 : q0; f.dot(pH, q, RED, 5.5);
      const dir = Math.abs(q) < 0.05 ? "거의 움직이지 않음" : q > 0 ? "음극(−) 쪽으로 이동" : "양극(+) 쪽으로 이동";
      S.out(`${a[0]} (${key}) · pKa ${all.join(", ")} · ${a[3]}\n등전점 pI = ${pI.toFixed(2)} (근사식: 전하 0 형태를 사이에 둔 두 pKa의 평균 ${approx.toFixed(2)})\npH ${pH.toFixed(1)}에서 알짜 전하 ${q >= 0 ? "+" : ""}${q.toFixed(2)} → 전기 영동에서 ${dir}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 효소 활성의 pH 의존성: 일반 염기와 일반 산 (화학12-04-01) */
  (() => {
    const S = QSim.card("lab-ch12-phrate"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), p1 = S.val("p1"), p2 = S.val("p2"), pH = S.val("pH");
      const fB = (x) => 1 / (1 + 10 ** (p1 - x));   // 일반 염기: 양성자가 없어야 함
      const fA = (x) => 1 / (1 + 10 ** (x - p2));   // 일반 산: 양성자가 있어야 함
      const act = (x) => 1 / (1 + 10 ** (p1 - x) + 10 ** (x - p2));
      const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: 2, x1: 12, y0: 0, y1: 1.1, xl: "pH", yl: "상대 활성 (최대 = 1)", pad: 44 }); f.axes();
      f.fn(fB, c.ink3, 1.2, [4, 4]); f.fn(fA, c.ink3, 1.2, [2, 3]);
      f.fn(act, c.main, 2.5);
      const opt = (p1 + p2) / 2;
      f.dot(opt, act(opt), GRN, 6); f.dot(pH, act(pH), RED, 5.5);
      S.out(`일반 염기 pKa₁ = ${p1.toFixed(1)} (점선: 염기 형태 분율), 일반 산 pKa₂ = ${p2.toFixed(1)} (점점선: 산 형태 분율)\n최적 pH = (pKa₁ + pKa₂)/2 = ${opt.toFixed(2)}, 그때 활성 형태 비율 ${(100 * act(opt)).toFixed(1)}%\npH ${pH.toFixed(1)}: 염기 형태 ${(100 * fB(pH)).toFixed(1)}%, 산 형태 ${(100 * fA(pH)).toFixed(1)}% → 둘 다 맞는 활성 형태 ${(100 * act(pH)).toFixed(1)}%`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

})();
