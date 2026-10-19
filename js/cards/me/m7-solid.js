/* 기계7 기계공학실험(1) 2단원: 인장 자료의 탄성계수·오프셋 항복 (02-01), Wheatstone 브리지 (02-02) */
(() => {
  "use strict";
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const gauss = (r) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());

  /* ── 인장 시험 자료: 최소제곱 탄성계수, 오프셋 항복 ── */
  (() => {
    const S = QSim.card("lab-me-offset"); if (!S) return;
    const [cv] = S.$$("canvas");
    // 가상 재료: Ramberg-Osgood ε = σ/E + 0.002(σ/σy)^n
    const MAT = { steel: { name: "구조용 강 (가상)", E: 200000, sy: 300, n: 15, smax: 360 }, al: { name: "알루미늄 합금 (가상)", E: 70000, sy: 250, n: 12, smax: 300 } };
    function draw() {
      const c = QSim.col(), M = MAT[S.val("m")], fitTop = S.val("fit"), off = S.val("off") / 100, noise = S.val("ns");
      const eps = (s) => s / M.E + 0.002 * Math.pow(s / M.sy, M.n);
      const r = rng(17), data = [];
      for (let s = 0; s <= M.smax; s += M.smax / 60) { const e = eps(s) + noise * 1e-6 * gauss(r); data.push([e, s]); }
      // 최소제곱: 응력이 fitTop% × σy 이하인 점 (0 제외)
      const pts = data.filter(([e, s]) => s > 0 && s <= (fitTop / 100) * M.sy);
      const n = pts.length; let Sx = 0, Sy = 0, Sxy = 0, Sxx = 0; pts.forEach(([x, y]) => { Sx += x; Sy += y; Sxy += x * y; Sxx += x * x; });
      const Ef = (n * Sxy - Sx * Sy) / (n * Sxx - Sx * Sx), b = (Sy - Ef * Sx) / n;
      // 오프셋 선 σ = Ef(ε − off) + b 와 자료 곡선의 교점 (선형 보간)
      let ys = null;
      for (let i = 1; i < data.length; i++) { const g0 = data[i - 1][1] - (Ef * (data[i - 1][0] - off) + b), g1 = data[i][1] - (Ef * (data[i][0] - off) + b); if (g0 > 0 && g1 <= 0) { const t = g0 / (g0 - g1); ys = data[i - 1][1] + t * (data[i][1] - data[i - 1][1]); break; } }
      const xmax = eps(M.smax) * 1.05, v = QSim.view(cv, 0.55);
      const f = QSim.frame(v, { x0: 0, x1: xmax * 1000, y0: 0, y1: M.smax * 1.1, xl: "변형률 (×10⁻³)", yl: "응력 (MPa)", pad: 36 });
      f.axes();
      data.forEach(([e, s]) => f.dot(e * 1000, s, pts.some((p) => p[1] === s) ? c.main : c.ink3, 2.5));
      f.fn((x) => Ef * x / 1000 + b, c.acc, 1.5, [5, 4]);
      f.fn((x) => Ef * (x / 1000 - off) + b, c.warn, 1.5, [5, 4]);
      if (ys) f.dot(eps(ys) * 1000, ys, c.warn, 6);
      S.out(`${M.name}: 참 E = ${(M.E / 1000).toFixed(0)} GPa, 참 0.2% 항복강도 ${M.sy} MPa\n맞춤 구간 σ ≤ ${((fitTop / 100) * M.sy).toFixed(0)} MPa (${n}점, 파랑) → 최소제곱 E = ${(Ef / 1000).toFixed(1)} GPa (${(((Ef - M.E) / M.E) * 100).toFixed(1)}%)\n오프셋 ${(off * 100).toFixed(2)}% 선과의 교점 → 항복강도 ${ys ? ys.toFixed(1) : "-"} MPa\n측정 잡음 σ_ε = ${noise} με`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* ── Wheatstone 브리지: 배치에 따른 출력, 온도 보상, 하중 분리 ── */
  (() => {
    const S = QSim.card("lab-me-bridge"); if (!S) return;
    const [cv] = S.$$("canvas");
    const GF = 2.1, Vex = 5;
    // 각 배치: 팔 1~4에 들어가는 게이지 (b: 굽힘 부호, a: 축하중 여부, t: 온도 영향), 없으면 고정 저항
    const CFG = {
      q: { name: "1/4 브리지 (윗면 게이지 1개)", arms: [{ b: 1, a: 1, t: 1 }, null, null, null], k: 1 },
      qd: { name: "1/4 브리지 + 더미 게이지 (이웃 팔)", arms: [{ b: 1, a: 1, t: 1 }, { b: 0, a: 0, t: 1 }, null, null], k: 1 },
      hb: { name: "1/2 브리지: 윗면·아랫면 (이웃 팔)", arms: [{ b: 1, a: 1, t: 1 }, { b: -1, a: 1, t: 1 }, null, null], k: 2 },
      ha: { name: "1/2 브리지: 윗면·아랫면 (마주 보는 팔)", arms: [{ b: 1, a: 1, t: 1 }, null, { b: -1, a: 1, t: 1 }, null], k: 2, axial: true },
      fb: { name: "전 브리지 (굽힘용)", arms: [{ b: 1, a: 1, t: 1 }, { b: -1, a: 1, t: 1 }, { b: 1, a: 1, t: 1 }, { b: -1, a: 1, t: 1 }], k: 4 }
    };
    function draw() {
      const c = QSim.col(), cfg = CFG[S.val("cfg")], eb = S.val("eb") * 1e-6, ea = S.val("ea") * 1e-6, et = S.val("dT") * 1e-6; // 온도 → 겉보기 변형률 1 με/°C
      const x = cfg.arms.map((g) => (g ? GF * (g.b * eb + g.a * ea + g.t * et) : 0));
      // 정확한 브리지: R1 위, R2 아래 (왼쪽 갈래), R4 위, R3 아래 (오른쪽 갈래)
      const R = x.map((d) => 120 * (1 + d));
      const Vo = Vex * (R[2] / (R[2] + R[3]) - R[1] / (R[0] + R[1]));
      const ind = (4 * Vo) / (Vex * GF) / cfg.k; // 이 배치의 감도(k배)로 나누어 읽은 변형률
      const tgt = cfg.axial ? S.val("ea") : S.val("eb"), what = cfg.axial ? "축 변형률" : "굽힘 변형률";
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: -1.6, x1: 1.6, y0: -1.1, y1: 1.1, equal: true, pad: 4 });
      const N = [0, 1], E = [1, 0], Sx = [0, -1], W = [-1, 0];
      const arm = (p, q, g, lb) => { f.path([p, q], g ? c.main : c.ink3, g ? 4 : 2); const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]; f.text(lb + (g ? (g.b > 0 ? " (+ε)" : g.b < 0 ? " (−ε)" : " (더미)") : ""), m[0] + (m[0] > 0 ? 0.05 : -0.05), m[1] + 0.05, g ? c.main : c.ink3, m[0] > 0 ? "left" : "right"); };
      arm(N, W, cfg.arms[0], "R1"); arm(W, Sx, cfg.arms[1], "R2"); arm(Sx, E, cfg.arms[2], "R3"); arm(E, N, cfg.arms[3], "R4");
      f.text("+V_ex", 0, 1.02, c.ink2, "center"); f.text("0", 0, -1.08, c.ink2, "center"); f.text("V_o", 0, 0.05, c.warn, "center");
      f.path([W, E], c.warn, 1, [3, 3]);
      S.out(`${cfg.name}, GF = 2.1, 여기 5 V\n실제: 굽힘 변형률 ±${S.val("eb")} με, 축 변형률 ${S.val("ea")} με, 온도 변화 ${S.val("dT")} °C (겉보기 ${S.val("dT")} με)\n출력 V_o = ${(Vo * 1000).toFixed(4)} mV → 이 배치가 재는 ${what}로 환산 ${(ind * 1e6).toFixed(1)} με (실제 ${tgt} με, 오차 ${(ind * 1e6 - tgt).toFixed(1)} με)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
