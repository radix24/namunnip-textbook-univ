/* 물리16 실습 카드: 불변 질량 봉우리와 유의성 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const rng = (s) => () => { s = (s * 1664525 + 1013904223) % 4294967296; return (s + 0.5) / 4294967296; };
  const gauss = (r) => Math.sqrt(-2 * Math.log(r())) * Math.cos(2 * Math.PI * r());
  const poisson = (lam, r) => { if (lam > 50) return Math.max(0, Math.round(lam + Math.sqrt(lam) * gauss(r))); const L = Math.exp(-lam); let k = 0, p = 1; do { k++; p *= r(); } while (p > L); return k - 1; };

  /* 1. 불변 질량 봉우리와 유의성 (04-02) */
  (() => {
    const S = QSim.card("lab-p16-invmass"); if (!S) return;
    const cv = S.$("canvas"); let seed = 17;
    function draw() {
      const c = C(), lumi = 10 ** S.val("ll"), sig = S.val("sig"), res = S.val("res") / 100, B0 = S.val("bkg"), r = rng(seed), Mh = 125;
      const sm = res * Mh, lo = 100, hi = 160, nb = 60;
      const bexp = (m) => B0 * lumi * Math.exp(-(m - Mh) / 30);   // GeV당
      const sexp = (m) => sig * lumi * Math.exp(-0.5 * ((m - Mh) / sm) ** 2) / (Math.sqrt(2 * Math.PI) * sm);
      const counts = []; for (let i = 0; i < nb; i++) { const m = lo + i + 0.5; counts.push(poisson(bexp(m) + sexp(m), r)); }
      const ymax = Math.max(...counts, bexp(lo + 0.5) + 1) * 1.15;
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: lo, x1: hi, y0: 0, y1: ymax, xl: "불변 질량 (GeV)", yl: "사건 수 / GeV" }); f.axes();
      counts.forEach((n, i) => { const m = lo + i + 0.5; f.path([[m, n - Math.sqrt(n)], [m, n + Math.sqrt(n)]], c.ink3, 1); f.dot(m, n, c.ink, 2.5); });
      f.fn(bexp, c.acc, 1.5, [5, 3], 300); f.fn((m) => bexp(m) + sexp(m), c.main, 2, null, 300);
      // ±2σ 창
      let Sw = 0, Bw = 0, Nw = 0; for (let i = 0; i < nb; i++) { const m = lo + i + 0.5; if (Math.abs(m - Mh) <= 2 * sm + 0.5) { Sw += sexp(m); Bw += bexp(m); Nw += counts[i]; } }
      const Sobs = Nw - Bw;
      S.out(`적분 광도 ${lumi < 10 ? lumi.toFixed(2) : lumi.toFixed(0)} fb⁻¹, 신호 σ·효율 ${sig} fb, 질량 분해능 ${(res * 100).toFixed(1)}% (σ = ${sm.toFixed(2)} GeV)\n125 GeV ±2σ 창: 기대 신호 ${Sw.toFixed(1)}, 기대 배경 ${Bw.toFixed(1)} → 기대 유의성 S/√B = ${(Sw / Math.sqrt(Bw)).toFixed(2)}\n이번 모의 자료: 창 안 사건 ${Nw}, 배경을 빼면 ${Sobs.toFixed(0)} (관측 유의성 ${(Sobs / Math.sqrt(Bw)).toFixed(2)})`);
    }
    S.$(".new").addEventListener("click", () => { seed = (seed * 31 + 9) % 99991; draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
