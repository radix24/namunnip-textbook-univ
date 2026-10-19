/* 물리12 체험 카드: 수소 2p 준위의 제이만 효과, 약한 장에서 강한 장(파셴-바크)까지 */
(() => {
  "use strict";
  const C = () => QSim.col();

  /* 1. 2p 여섯 상태의 정확한 에너지 (02-03) */
  (() => {
    const S = QSim.card("lab-p12-zeeman"); if (!S) return;
    const cv = S.$("canvas");
    const MUB = 57.88;                 // 보어 마그네톤, μeV/T
    // H = a L·S + b(Lz + 2Sz), a = 2Δ/3, b = μB·B. m_j가 보존되어 1×1 둘, 2×2 둘로 나뉜다.
    // 2×2 블록의 위 해는 B = 0에서 j = 3/2, 아래 해는 j = 1/2로 이어진다.
    // 강한 장 이름(m_l, m_s)은 B가 클 때 각 곡선이 다가가는 상태다.
    const NAMES = [
      { n: "3/2, +3/2", g: 4 / 3, mj: 1.5, ml: 1, ms: 0.5 },
      { n: "3/2, +1/2", g: 4 / 3, mj: 0.5, ml: 0, ms: 0.5 },
      { n: "3/2, −1/2", g: 4 / 3, mj: -0.5, ml: -1, ms: 0.5 },
      { n: "3/2, −3/2", g: 4 / 3, mj: -1.5, ml: -1, ms: -0.5 },
      { n: "1/2, +1/2", g: 2 / 3, mj: 0.5, ml: 1, ms: -0.5 },
      { n: "1/2, −1/2", g: 2 / 3, mj: -0.5, ml: 0, ms: -0.5 }
    ];
    function energies(D, B) {
      const a = 2 * D / 3, b = MUB * B, r = a / Math.SQRT2;
      const pair = (d1, d2) => { const m = (d1 + d2) / 2, h = Math.sqrt(((d1 - d2) / 2) ** 2 + r * r); return [m + h, m - h]; };
      const [p1, q1] = pair(-a / 2, b), [p2, q2] = pair(-a / 2, -b);
      return [a / 2 + 2 * b, p1, p2, a / 2 - 2 * b, q1, q2];
    }
    function draw() {
      const c = C(), D = S.val("fs"), B = S.val("b"), Bmax = S.val("bmax"), approx = S.val("approx");
      const a = 2 * D / 3, Emax = Math.max(a / 2 + 2 * MUB * Bmax, D) * 1.08;
      const v = QSim.view(cv, 0.7), f = QSim.frame(v, { x0: 0, x1: Bmax, y0: -Emax, y1: Emax, pad: 34, xl: "B (T)", yl: "E (μeV)" }); f.axes();
      const cl = [c.main, c.main, c.main, c.main, c.warn, c.warn], N = 240, E0 = energies(D, 0);
      if (approx) {
        NAMES.forEach((s, k) => f.fn((x) => E0[k] + s.g * s.mj * MUB * x, c.ink3, 1, [5, 4]));            // 약한 장 직선
        NAMES.forEach((s) => f.fn((x) => MUB * (s.ml + 2 * s.ms) * x + a * s.ml * s.ms, c.acc, 1.2, [2, 3])); // 강한 장 직선
      }
      for (let k = 0; k < 6; k++) {
        const pts = []; for (let i = 0; i <= N; i++) { const x = Bmax * i / N; pts.push([x, energies(D, x)[k]]); }
        f.path(pts, cl[k], 2.2);
      }
      f.path([[B, -Emax], [B, Emax]], c.ink2, 1, [3, 3]);
      const E = energies(D, B);
      E.forEach((e, k) => f.dot(B, e, cl[k], 4));
      const ratio = MUB * B / D, fx = (z) => (z < -0.05 ? "−" + (-z).toFixed(1) : z.toFixed(1)).padStart(6);
      const rows = NAMES.map((s, k) => ({ s, e: E[k], w: E0[k] + s.g * s.mj * MUB * B, st: MUB * (s.ml + 2 * s.ms) * B + a * s.ml * s.ms }))
        .sort((x, y) => y.e - x.e)
        .map(({ s, e, w, st }) => `(${s.n}) → (${s.ml > 0 ? "+1" : s.ml < 0 ? "−1" : "0"}, ${s.ms > 0 ? "+" : "−"}1/2)   ${fx(e)}   ${fx(w)}   ${fx(st)}`);
      const zone = ratio < 0.2 ? "약한 장: 회색 점선(g_J m_j μB B)이 잘 맞습니다" : ratio > 5 ? "강한 장(파셴-바크): 주황 점선(μB(m_l + 2m_s)B)이 잘 맞습니다" : "중간 영역: 두 근사가 모두 어긋나 정확한 대각화가 필요합니다";
      S.out(`B = ${B.toFixed(2)} T, μB·B = ${(MUB * B).toFixed(1)} μeV, 미세 구조 간격 Δ = ${D.toFixed(1)} μeV, μB·B/Δ = ${ratio.toFixed(2)}\n${zone}\n에너지 (μeV, 2p 무게중심 기준, 위에서부터)\n(j, m_j) → (m_l, m_s)   정확   약한 장   강한 장\n` + rows.join("\n"));
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
