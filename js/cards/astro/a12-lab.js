/* 천우12 카드: 회전 곡선 분해, 닫힌 상자와 유입 모형의 금속 함량 분포, 왜소 은하의 질량 대 광도비 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const fx = (x, n = 2) => (+x).toFixed(n);
  const rng = (s) => () => { s = (s * 1664525 + 1013904223) % 4294967296; return (s + 0.5) / 4294967296; };
  const gauss = (r) => Math.sqrt(-2 * Math.log(r())) * Math.cos(2 * Math.PI * r());
  const G = 4.30091e-6;   // kpc (km/s)² / M☉

  /* 1. 회전 곡선을 벌지, 원반, 헤일로로 나누기 (02-02) */
  (() => {
    const S = QSim.card("lab-a12-rotcurve"); if (!S) return;
    const cv = S.$("canvas");
    const comp = (R, Mb, Md, vh, rc) => [G * Mb * R / (R + 0.7) ** 2, G * Md * R * R / (R * R + 3.28 * 3.28) ** 1.5, vh * vh * (1 - rc / R * Math.atan(R / rc))];
    const TRUE = [1.2e10, 6e10, 230, 7];
    const dat = (() => { const r = rng(12), d = []; for (let R = 1; R <= 25; R++) { const v = Math.sqrt(comp(R, ...TRUE).reduce((a, b) => a + b, 0)); d.push([R, v + 8 * gauss(r)]); } return d; })();
    function draw() {
      const c = C(), Mb = S.val("mb") * 1e10, Md = S.val("md") * 1e10, vh = S.val("vh"), rc = S.val("rc");
      const vt = (R) => Math.sqrt(comp(R, Mb, Md, vh, rc).reduce((a, b) => a + b, 0));
      const v = QSim.view(cv, 0.56), f = QSim.frame(v, { x0: 0, x1: 26, y0: 0, y1: 320, xl: "은하 중심 거리 R (kpc)", yl: "회전 속도 (km/s)" }); f.axes();
      f.fn((R) => R > 0.05 ? Math.sqrt(comp(R, Mb, Md, vh, rc)[0]) : NaN, c.acc, 1.3, [4, 3]);
      f.fn((R) => R > 0.05 ? Math.sqrt(comp(R, Mb, Md, vh, rc)[1]) : NaN, c.warn, 1.3, [4, 3]);
      f.fn((R) => R > 0.05 ? Math.sqrt(comp(R, Mb, Md, vh, rc)[2]) : NaN, c.ink3, 1.3, [2, 3]);
      f.fn((R) => R > 0.05 ? vt(R) : NaN, c.main, 2.4);
      dat.forEach(([R, vv]) => { f.dot(R, vv, c.main, 3); f.path([[R, vv - 8], [R, vv + 8]], c.main, 1); });
      const chi = dat.reduce((s, [R, vv]) => s + ((vv - vt(R)) / 8) ** 2, 0);
      const k8 = comp(8.2, Mb, Md, vh, rc), v8 = Math.sqrt(k8[0] + k8[1] + k8[2]), M8 = v8 * v8 * 8.2 / G, M25 = vt(25) ** 2 * 25 / G;
      S.out(`벌지 ${fx(Mb / 1e10, 1)}×10¹⁰ M☉, 원반 ${fx(Md / 1e10, 1)}×10¹⁰ M☉, 헤일로 점근 속도 ${vh} km/s·핵 반지름 ${fx(rc, 1)} kpc\n태양 위치(8.2 kpc) 회전 속도 ${fx(v8, 1)} km/s, 그 안의 질량(구 근사 v²R/G) ${fx(M8 / 1e10, 1)}×10¹⁰ M☉, 헤일로 몫 ${fx(100 * k8[2] / (v8 * v8), 0)}%\n25 kpc 안의 질량 ${fx(M25 / 1e11, 2)}×10¹¹ M☉. 가상 자료 25점과의 χ² = ${fx(chi, 1)} (자유도 21)\n파란 선: 합, 주황 점선: 벌지, 빨간 점선: 원반, 회색 점선: 헤일로. 점: 가상 관측(오차 8 km/s)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 닫힌 상자와 유입 모형의 금속 함량 분포 (04-02, 04-03) */
  (() => {
    const S = QSim.card("lab-a12-closedbox"); if (!S) return;
    const cv = S.$("canvas");
    // 태양 근처 G 왜성의 가상 근사 분포: [Fe/H]가 평균 −0.1, 표준편차 0.2인 정규분포 (Z/Z☉ = 10^[Fe/H])
    const erf = (x) => { const t = 1 / (1 + 0.3275911 * Math.abs(x)), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; };
    const obs = (z) => z <= 0 ? 0 : 0.5 * (1 + erf((Math.log10(z) + 0.1) / (0.2 * Math.SQRT2)));
    function draw() {
      const c = C(), mu1 = S.val("mu"), model = S.val("model");
      let cum, p;
      if (model === "box") { const Z1 = 1; p = Z1 / Math.log(1 / mu1); cum = (z) => z >= Z1 ? 1 : (1 - Math.pow(mu1, z / Z1)) / (1 - mu1); }
      else { const s1 = (1 - mu1) / mu1; p = 1 / (1 - Math.exp(-s1)); cum = (z) => z >= 1 ? 1 : -Math.log(1 - z / p) / s1; }
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: 1.4, y0: 0, y1: 1.05, xl: "금속 함량 Z/Z☉", yl: "그보다 금속이 적은 별의 비율" }); f.axes();
      f.fn(cum, c.main, 2.2); f.fn(obs, c.warn, 1.8, [5, 3]);
      f.path([[0.25, 0], [0.25, 1.05]], c.ink3, 1, [2, 3]);
      S.out(`${model === "box" ? "단순 닫힌 상자" : "극단적 유입(기체 질량 일정)"} 모형, 지금의 기체 비율 μ₁ = ${fx(mu1, 2)}: 지금의 기체 금속 함량을 Z☉로 맞춘 수득률 p = ${fx(p, 3)} Z☉\nZ < 0.25 Z☉([Fe/H] < −0.6)인 별의 비율: 모형 ${fx(100 * cum(0.25), 1)}%, 가상 관측 근사 ${fx(100 * obs(0.25), 1)}%\nZ < 0.5 Z☉: 모형 ${fx(100 * cum(0.5), 1)}%, 가상 관측 근사 ${fx(100 * obs(0.5), 1)}%\n파란 선: 모형의 누적 분포, 빨간 점선: 태양 근처 G 왜성의 가상 근사 분포([Fe/H] 평균 −0.1, 표준편차 0.2)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 왜소 은하의 질량 대 광도비 (06-02) */
  (() => {
    const S = QSim.card("exp-a12-dwarf"); if (!S) return;
    const cv = S.$("canvas");
    // 대략값(문헌 정리표 수준): 시선 속도 분산 σ (km/s), 투영 반광 반지름 R_e (pc), V 광도 (L☉)
    const GAL = { fornax: ["화로자리 왜소 은하", 11.7, 710, 2.0e7], sculptor: ["조각가자리 왜소 은하", 9.2, 283, 2.3e6], leo1: ["사자자리 I", 9.2, 251, 5.5e6],
      draco: ["용자리 왜소 은하", 9.1, 221, 2.9e5], carina: ["용골자리 왜소 은하", 6.6, 250, 3.8e5], segue1: ["Segue 1 (초미광 왜소 은하)", 3.9, 29, 340], m3: ["구상성단 M3 (비교)", 5.5, 6.8, 3.0e5] };
    function draw() {
      const c = C(), k = S.val("gal"), [name, s0, Re, L] = GAL[k], fs = S.val("fs"), s = s0 * fs;
      const M = 4 * s * s * (Re / 1000) / G, ML = M / (L / 2);
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 2, x1: 8, y0: -0.5, y1: 4, xl: "log₁₀ 광도 (L☉)", yl: "log₁₀ 질량 대 광도비 (반광 반지름 안)" }); f.axes();
      Object.keys(GAL).forEach((q) => { const [, ss, rr, ll] = GAL[q], mm = 4 * ss * ss * (rr / 1000) / G; f.dot(Math.log10(ll), Math.log10(mm / (ll / 2)), q === k ? c.warn : c.ink3, q === k ? 5 : 3); });
      f.path([[2, Math.log10(2)], [8, Math.log10(2)]], c.acc, 1, [4, 3]);
      S.out(`${name}: σ = ${fx(s, 1)} km/s (표의 값 ${s0} × ${fx(fs, 2)}), 반광 반지름 ${Re} pc, 광도 ${L.toExponential(1)} L☉\n반광 반지름 안의 질량 M₁/₂ ≈ 4σ²R_e/G = ${M.toExponential(2)} M☉ (Wolf 외 2010의 추정식)\n질량 대 광도비 M/L = M₁/₂ ÷ (L/2) = ${ML < 100 ? fx(ML, 1) : ML.toFixed(0)} (별만 있으면 약 2, 주황 점선)\n회색 점: 다른 천체, 빨간 점: 고른 천체. 표의 값은 문헌 정리표 수준의 대략값(원 논문 확인 필요)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
