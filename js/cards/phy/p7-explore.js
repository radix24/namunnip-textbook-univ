/* 물리7 탐구 카드 묶음: 기체 분자의 속력 분포, 방사성 붕괴 사슬 */
(() => {
  "use strict";
  const C = () => QSim.col();

  /* 1. Maxwell-Boltzmann 속력 분포 (02-01) */
  (() => {
    const S = QSim.card("lab-p7-mb"); if (!S) return;
    const cv = S.$("canvas");
    const GAS = { h2: [2.016, "수소 H₂"], he: [4.003, "헬륨 He"], n2: [28.01, "질소 N₂"], xe: [131.3, "제논 Xe"] };
    const k = 1.380649e-23, u = 1.66054e-27;
    function draw() {
      const c = C(), [A, name] = GAS[S.val("gas")], T = S.val("T"), m = A * u, a = Math.sqrt(k * T / m);
      const f = (v) => Math.sqrt(2 / Math.PI) * v * v / a ** 3 * Math.exp(-v * v / (2 * a * a));
      const f300 = (v) => { const b = Math.sqrt(k * 300 / m); return Math.sqrt(2 / Math.PI) * v * v / b ** 3 * Math.exp(-v * v / (2 * b * b)); };
      const vp = Math.sqrt(2) * a, vavg = Math.sqrt(8 / Math.PI) * a, vrms = Math.sqrt(3) * a;
      const vmax = Math.max(4.5 * a, 4.5 * Math.sqrt(k * 300 / m));
      const v = QSim.view(cv, 0.5), g = QSim.frame(v, { x0: 0, x1: vmax, y0: 0, y1: Math.max(f(vp), f300(Math.sqrt(2 * k * 300 / m))) * 1.15, xl: "v (m/s)", yl: "f(v)" }); g.axes();
      g.fn(f300, c.ink3, 1.4, [5, 4], 500); g.fn(f, c.main, 2.4, null, 500);
      [[vp, "vₚ"], [vavg, "⟨v⟩"], [vrms, "v_rms"]].forEach(([x, l], i) => { g.path([[x, 0], [x, f(x)]], [c.acc, c.warn, c.ink2][i], 1.5, [3, 3]); g.text(l, x + vmax * 0.01, f(x) * (1.02 + 0.08 * i), [c.acc, c.warn, c.ink2][i]); });
      const vesc = 11186; let frac = 0; for (let x = vesc; x < vesc + 40 * a; x += a / 50) frac += f(x) * a / 50;
      S.out(`${name}, T = ${T} K\n가장 그럴듯한 속력 vₚ = ${vp.toFixed(0)} m/s, 평균 ⟨v⟩ = ${vavg.toFixed(0)} m/s, 제곱 평균 제곱근 v_rms = ${vrms.toFixed(0)} m/s\n지구 탈출 속력(11.2 km/s)보다 빠른 분자의 비율 ${frac < 1e-300 ? "0 (10⁻³⁰⁰ 미만)" : frac.toExponential(2)}\n회색 점선: 같은 기체의 300 K 분포`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 방사성 붕괴 사슬 A → B → C (04-02) */
  (() => {
    const S = QSim.card("lab-p7-decay"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), TA = S.val("TA"), TB = S.val("TB"), tm = S.val("tm");
      const la = Math.LN2 / TA, lb = Math.LN2 / TB;
      const NA = (t) => Math.exp(-la * t);
      const NB = (t) => Math.abs(la - lb) < 1e-9 ? la * t * Math.exp(-la * t) : la / (lb - la) * (Math.exp(-la * t) - Math.exp(-lb * t));
      const NC = (t) => 1 - NA(t) - NB(t);
      const v = QSim.view(cv, 0.5), g = QSim.frame(v, { x0: 0, x1: tm, y0: 0, y1: 1.05, xl: "t (시간)", yl: "N/N₀" }); g.axes();
      g.fn(NA, c.main, 2.4, null, 600); g.fn(NB, c.acc, 2.4, null, 600); g.fn(NC, c.ink3, 1.8, [5, 4], 600);
      const tpk = Math.abs(la - lb) < 1e-9 ? 1 / la : Math.log(lb / la) / (lb - la);
      g.dot(tpk, NB(tpk), c.warn, 5);
      const ratio = (t) => lb * NB(t) / (la * NA(t));
      let regime = TA > 10 * TB ? "영년 평형 (A가 훨씬 오래 삶): 오래 지나면 두 방사능이 같아진다" : TA > TB ? "과도 평형: 방사능 비가 일정한 값으로 다가간다" : "평형 없음 (B가 더 오래 삶): A가 먼저 사라지고 B만 남는다";
      S.out(`반감기 A ${TA} 시간, B ${TB} 시간\nB가 가장 많을 때: t = ${tpk.toFixed(2)} 시간, N_B = ${NB(tpk).toFixed(4)} N₀ (빨간 점)\nt = ${tm} 시간에 방사능 비 A_B/A_A = ${ratio(tm).toFixed(4)}${TA > TB ? ` (이론 극한 ${(lb / (lb - la)).toFixed(4)})` : ""}\n${regime}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
