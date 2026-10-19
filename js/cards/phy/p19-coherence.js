/* 물리19 체험 카드: 스펙트럼 모양과 간섭무늬 선명도(결맞음 길이) */
(() => {
  "use strict";
  const C = () => QSim.col();

  /* 1. 경로 차에 따른 간섭무늬와 선명도 (03-01) */
  (() => {
    const S = QSim.card("lab-p19-coherence"); if (!S) return;
    const [cvS, cvI] = S.$$("canvas");
    const L2 = Math.log(2);
    // 파수 σ = 1/λ (nm⁻¹). 세기 I(x) = 1 + env(x)·cos(2πσ₀x), x는 경로 차(nm). env의 절댓값이 선명도.
    function model() {
      const kind = S.val("kind"), lam = S.val("lam"), dl = Math.pow(10, S.val("lw")), dd = S.val("dd");
      if (kind === "white") {
        const s1 = 1 / 700, s2 = 1 / 400, s0 = (s1 + s2) / 2, ds = s2 - s1;
        return { kind, s0, lam0: 1 / s0, env: (x) => { const u = Math.PI * ds * x; return u === 0 ? 1 : Math.sin(u) / u; }, lc: 1 / ds,
          spec: (l) => (l >= 400 && l <= 700 ? 1 : 0), l0: 380, l1: 720 };
      }
      const g = (x, w) => Math.exp(-Math.pow(Math.PI * w * x, 2) / (4 * L2));   // FWHM w(파수)인 가우스 선의 envelope
      const ws = dl / (lam * lam);
      if (kind === "gauss") {
        return { kind, s0: 1 / lam, lam0: lam, env: (x) => g(x, ws), lc: lam * lam / dl,
          spec: (l) => Math.exp(-4 * L2 * Math.pow((l - lam) / dl, 2)), l0: lam - 3 * dl, l1: lam + 3 * dl };
      }
      const sa = 1 / lam, sb = 1 / (lam + dd), s0 = (sa + sb) / 2, dsig = sa - sb;
      return { kind, s0, lam0: 1 / s0, env: (x) => g(x, ws) * Math.cos(Math.PI * dsig * x), lc: lam * lam / dl, rev: dsig > 0 ? 1 / dsig : Infinity,
        spec: (l) => Math.exp(-4 * L2 * Math.pow((l - lam) / dl, 2)) + Math.exp(-4 * L2 * Math.pow((l - lam - dd) / dl, 2)),
        l0: lam - 3 * dl - 0.3 * Math.max(dd, dl), l1: lam + dd + 3 * dl + 0.3 * Math.max(dd, dl) };
    }
    const fmtLen = (nm) => (nm < 1e3 ? nm.toFixed(0) + " nm" : nm < 1e6 ? (nm / 1e3).toPrecision(3) + " μm" : nm < 1e9 ? (nm / 1e6).toPrecision(3) + " mm" : (nm / 1e9).toPrecision(3) + " m");
    function draw() {
      const c = C(), m = model(), xmax = Math.pow(10, S.val("lx")) * 1e3, xp = S.val("xp") * xmax;
      // 위: 스펙트럼
      const vs = QSim.view(cvS, 0.3), fs = QSim.frame(vs, { x0: m.l0, x1: m.l1, y0: 0, y1: 1.15, xl: "λ (nm)", yl: "S" }); fs.axes();
      let smax = 0; for (let i = 0; i <= 600; i++) smax = Math.max(smax, m.spec(m.l0 + (m.l1 - m.l0) * i / 600));
      fs.fn((l) => m.spec(l) / smax, c.main, 2, null, 600);
      // 아래: 경로 차에 따른 세기
      const vi = QSim.view(cvI, 0.45), fi = QSim.frame(vi, { x0: 0, x1: xmax / 1e3, y0: 0, y1: 2.15, xl: "경로 차 (μm)", yl: "I/(I₁+I₂)" }); fi.axes();
      const W = vi.W, perPx = (xmax / m.lam0) / W;    // 화소당 무늬 수
      const N = 900, up = [], dn = [];
      for (let i = 0; i <= N; i++) { const x = xmax * i / N, e = Math.abs(m.env(x)); up.push([x / 1e3, 1 + e]); dn.push([x / 1e3, 1 - e]); }
      if (perPx > 0.3) {   // 무늬가 화소보다 촘촘하면 띠로 칠한다
        const g = vi.g; g.save(); g.fillStyle = c.soft; g.beginPath();
        up.forEach(([x, y], i) => (i ? g.lineTo(fi.X(x), fi.Y(y)) : g.moveTo(fi.X(x), fi.Y(y))));
        dn.slice().reverse().forEach(([x, y]) => g.lineTo(fi.X(x), fi.Y(y))); g.closePath(); g.fill(); g.restore();
      } else {
        const n = Math.min(20000, Math.max(1200, Math.ceil(xmax / m.lam0 * 24)));
        fi.fn((u) => 1 + m.env(u * 1e3) * Math.cos(2 * Math.PI * m.s0 * u * 1e3), c.main, 1.5, null, n);
      }
      fi.path(up, c.warn, 1.5, [5, 4]); fi.path(dn, c.warn, 1.5, [5, 4]);
      fi.path([[xp / 1e3, 0], [xp / 1e3, 2.15]], c.ink2, 1, [3, 3]);
      const V = Math.abs(m.env(xp));
      fi.dot(xp / 1e3, 1 + V, c.acc, 4); fi.dot(xp / 1e3, 1 - V, c.acc, 4);
      let s = `중심 파장 ${m.lam0.toFixed(1)} nm, 무늬 하나의 경로 차 = ${m.lam0.toFixed(1)} nm (그림 폭에 무늬 약 ${Math.round(xmax / m.lam0)}개${perPx > 0.3 ? ", 너무 촘촘해 띠로 칠함" : ""})\n`;
      s += m.kind === "white" ? `백색광 400~700 nm: 무늬가 처음 사라지는 경로 차 = 1/(1/400 nm − 1/700 nm) = ${fmtLen(m.lc)} (λ²/Δλ로 어림하면 약 0.86 μm)\n` : `결맞음 길이 ℓc ≈ λ²/Δλ = ${fmtLen(m.lc)} (Δλ = ${(Math.pow(10, S.val("lw"))).toPrecision(2)} nm)\n`;
      if (m.kind === "doublet") s += `두 선의 맥놀이: 선명도가 다시 1에 가까워지는 경로 차 = λ²/δ = ${fmtLen(m.rev)}, 처음 0이 되는 곳 = ${fmtLen(m.rev / 2)}\n`;
      s += `탐침 경로 차 ${fmtLen(xp)}: 선명도 V = ${V.toFixed(3)} (빨간 점선이 V의 봉투, I_max = ${(1 + V).toFixed(3)}, I_min = ${(1 - V).toFixed(3)})`;
      S.out(s);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
