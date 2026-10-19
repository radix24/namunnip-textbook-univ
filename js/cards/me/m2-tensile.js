/* 기계2 고체역학 2단원: 가상 인장 시험 (02-01) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-tensile"); if (!S) return;
  const [cv] = S.$$("canvas");
  // 재료 모형 (가상 값): E MPa, 항복 σY, 극한 σU, 극한 변형률 εU, 파단 변형률 εF, 항복 계단 여부
  const MAT = {
    steel: { name: "연강", E: 200000, sy: 250, su: 410, eu: 0.20, ef: 0.32, plateau: 0.02 },
    al: { name: "알루미늄 합금 6061-T6", E: 69000, sy: 276, su: 310, eu: 0.10, ef: 0.15, plateau: 0 },
    ci: { name: "회주철", E: 100000, sy: NaN, su: 200, eu: 0.006, ef: 0.006, plateau: 0 },
  };
  // 공칭 응력 σ(ε)
  function curve(m, e) {
    const ey = m.sy / m.E;
    if (isNaN(m.sy)) { // 취성: 처음부터 조금씩 휘는 곡선, 파단까지
      if (e > m.ef) return NaN;
      return m.su * (1 - Math.exp(-(m.E * e) / m.su * 1.15)) / (1 - Math.exp(-(m.E * m.ef) / m.su * 1.15));
    }
    if (m.plateau > 0) {
      if (e <= ey) return m.E * e;
      if (e <= ey + m.plateau) return m.sy;
      const e0 = ey + m.plateau;
      if (e <= m.eu) { const x = (e - e0) / (m.eu - e0); return m.sy + (m.su - m.sy) * (1 - (1 - x) * (1 - x)); }
    } else {
      // Ramberg-Osgood 곡선 ε = σ/E + 0.002(σ/σY)^n (n = 30): σ = σY에서 소성 변형률이 정확히 0.2%
      const ro = (s) => s / m.E + 0.002 * Math.pow(s / m.sy, 30);
      if (e <= ro(m.su)) { let lo = 0, hi = m.su; for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (ro(mid) < e) lo = mid; else hi = mid; } return lo; }
      const eu = ro(m.su);
      if (e <= m.ef) { const x = (e - eu) / (m.ef - eu); return m.su * (1 - 0.22 * x * x); }
      return NaN;
    }
    if (e <= m.ef) { const x = (e - m.eu) / (m.ef - m.eu); return m.su * (1 - 0.22 * x * x); }
    return NaN;
  }
  let seed = 3;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 - 0.5; };
  function draw() {
    const c = QSim.col(), m = MAT[S.val("mat")], zoom = S.val("zoom");
    const emax = zoom ? Math.max(0.006, (m.sy || m.su) / m.E * 4) : m.ef * 1.1, smax = m.su * 1.15;
    const v = QSim.view(cv, 0.62), f = QSim.frame(v, { x0: 0, x1: emax * 100, y0: 0, y1: smax, xl: "ε (%)", yl: "σ (MPa)", pad: 38 }); f.axes();
    // 가상 측정점 (잡음 0.5%)
    seed = 3; const pts = [];
    for (let i = 0; i <= 400; i++) { const e = (m.ef * i) / 400; const s = curve(m, e); if (isFinite(s)) pts.push([e * 100, s * (1 + 0.005 * rnd())]); }
    f.path(pts.filter((p) => p[0] <= emax * 100), c.main, 2);
    // 탄성 직선과 0.2% 오프셋 직선
    f.path([[0, 0], [(smax / m.E) * 100, smax]], c.ink3, 1, [4, 3]);
    let yOff = NaN;
    if (!isNaN(m.sy)) {
      f.path([[0.2, 0], [0.2 + (smax / m.E) * 100, smax]], c.acc, 1.5, [6, 4]);
      for (let i = 1; i <= 4000; i++) { const e = (m.ef * i) / 4000, s = curve(m, e), sl = m.E * (e - 0.002); if (sl >= s) { yOff = s; f.dot(e * 100, s, c.acc, 5); break; } }
    }
    const top = pts.reduce((a, p) => (p[1] > a[1] ? p : a), [0, 0]);
    f.dot(top[0], top[1], c.warn, 5);
    S.out(`${m.name} (가상 시험 자료, 잡음 ±0.25%)\n처음 직선의 기울기 E = ${(m.E / 1000).toFixed(0)} GPa\n${isNaN(yOff) ? "뚜렷한 항복 없음: 취성 재료는 항복강도를 정하지 않습니다." : `0.2% 오프셋 항복강도 ≈ ${yOff.toFixed(0)} MPa`}\n극한강도(최고점) ≈ ${top[1].toFixed(0)} MPa, 그때 변형률 ${top[0].toFixed(1)}%, 파단 변형률 ${(m.ef * 100).toFixed(1)}%`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();
