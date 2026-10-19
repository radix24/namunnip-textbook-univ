/* 기계14 기계요소설계: Goodman 선도와 피로 안전계수 (02-01) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-goodman"); if (!S) return;
  const [cv] = S.$$("canvas");
  function draw() {
    const c = QSim.col(), Sut = S.val("Sut"), Sy = 0.8 * Sut, ka = 4.51 * Math.pow(Sut, -0.265), kb = S.val("polish") === "1" ? 1 : 1.24 * Math.pow(S.val("d"), -0.107);
    const kaU = S.val("polish") === "1" ? 1 : ka, Se = kaU * kb * 0.5 * Sut, sa = S.val("sa"), sm = S.val("sm");
    const n = 1 / (sa / Se + sm / Sut), ny = Sy / (sa + sm);
    const nG = (() => { const A = (sm / Sut) ** 2, B = sa / Se; return (-B + Math.sqrt(B * B + 4 * A)) / (2 * A || 1e-12); })(); // Gerber: A n² + B n = 1
    const v = QSim.view(cv, 0.6), f = QSim.frame(v, { x0: 0, x1: Sut * 1.05, y0: 0, y1: Math.max(Se, Sy) * 1.1, xl: "평균 응력 σm (MPa)", yl: "응력 진폭 σa (MPa)", pad: 38 });
    f.axes();
    f.path([[0, Se], [Sut, 0]], c.main, 2.5);
    f.fn((x) => Se * (1 - (x / Sut) ** 2), c.acc, 1.5, [5, 4]);
    f.path([[0, Sy], [Sy, 0]], c.warn, 1.5, [2, 3]);
    f.path([[0, 0], [sm * n, sa * n]], c.ink3, 1, [3, 3]);
    f.dot(sm, sa, n < 1 ? c.warn : c.ink, 6);
    S.out(`S_ut = ${Sut} MPa, S_y = ${Sy.toFixed(0)} MPa(가정 0.8 S_ut), 표면 계수 ${kaU.toFixed(3)}, 크기 계수 ${kb.toFixed(3)} → 수정 내구 한도 S_e = ${Se.toFixed(0)} MPa\n작용 응력 σa = ${sa}, σm = ${sm} MPa (검정 점, 응력 집중 포함)\nGoodman(파란 선) 안전계수 ${n.toFixed(2)}, Gerber(초록 점선) ${sm > 0 ? nG.toFixed(2) : (Se / sa).toFixed(2)}, 첫 사이클 항복(빨간 점선) ${ny.toFixed(2)}${n < 1 ? "\nGoodman 선 밖: 무한 수명을 보장하지 못함" : ""}`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();

/* 기계14 3단원: 예압 볼트 이음의 하중 분담 선도 (03-02) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-bolt"); if (!S) return;
  const [cv] = S.$$("canvas");
  const At = 84.3; // M12 인장 응력 면적 (mm²)
  function draw() {
    const c = QSim.col(), Fi = S.val("Fi"), kb = 800, km = S.val("km"), P = S.val("P");
    const C = kb / (kb + km), P0 = Fi / (1 - C), sep = P >= P0;
    const Fb = sep ? P : Fi + C * P, Fm = sep ? 0 : Fi - (1 - C) * P;
    const db0 = Fi / kb, dm0 = Fi / km, dP = sep ? P / kb - db0 : (C * P) / kb; // 추가 늘음 (mm)
    const xmax = (Fi / kb + Fi / km) * 1.6, ymax = Math.max(Fi, Fb) * 1.3;
    const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: 0, x1: xmax * 1000, y0: 0, y1: ymax, xl: "변형 (μm)", yl: "힘 (kN)", pad: 36 });
    f.axes();
    // 볼트 선 (원점에서 기울기 kb), 부재 선 (db0 + dm0 에서 0, 기울기 −km)
    f.path([[0, 0], [xmax * 1000, kb * xmax]], c.main, 2.5);
    f.path([[(db0 + dm0) * 1000, 0], [Math.max(0, db0 + dm0 - ymax / km) * 1000, Math.min(ymax, (db0 + dm0) * km)]], c.acc, 2.5);
    f.dot(db0 * 1000, Fi, c.ink, 5);
    const x1 = (db0 + dP) * 1000;
    f.path([[x1, Fm], [x1, Fb]], c.warn, 3);
    f.dot(x1, Fb, c.warn, 5); f.dot(x1, Fm, c.acc, 5);
    S.out(`M12 볼트(k_b = 800 kN/mm), 부재 k_m = ${km} kN/mm → 이음 상수 C = ${C.toFixed(3)}, 예압 ${Fi} kN, 분리 하중 ${P0.toFixed(1)} kN\n외부 하중 ${P} kN (빨간 막대 = 볼트 힘 − 부재 힘 = 외부 하중)\n볼트 힘 ${Fb.toFixed(1)} kN (응력 ${((Fb * 1000) / At).toFixed(0)} MPa), 부재 압축 ${Fm.toFixed(1)} kN${sep ? "\n이음이 벌어짐: 볼트가 외부 하중 전체를 받음" : `\n외부 하중 중 볼트 몫 ${(C * P).toFixed(1)} kN, 부재 압축 감소 ${((1 - C) * P).toFixed(1)} kN`}`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();