/* 물리16 실습 카드 묶음: 문턱 에너지, 비행 시간 입자 식별, 불변 질량 봉우리와 유의성 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const rng = (s) => () => { s = (s * 1664525 + 1013904223) % 4294967296; return (s + 0.5) / 4294967296; };
  const gauss = (r) => Math.sqrt(-2 * Math.log(r())) * Math.cos(2 * Math.PI * r());
  const poisson = (lam, r) => { if (lam > 50) return Math.max(0, Math.round(lam + Math.sqrt(lam) * gauss(r))); const L = Math.exp(-lam); let k = 0, p = 1; do { k++; p *= r(); } while (p > L); return k - 1; };
  const M = { p: 0.93827, pi0: 0.13498, e: 0.000511, Z: 91.1876, H: 125.2, pic: 0.13957, K: 0.49368 };   // GeV

  /* 1. 문턱 에너지: 고정 표적과 충돌형 (01-01) */
  (() => {
    const S = QSim.card("lab-p16-threshold"); if (!S) return;
    const cv = S.$("canvas");
    const R = {
      pbar: { name: "p + p → p + p + p + p̄", ma: M.p, mb: M.p, sum: 4 * M.p },
      pi0: { name: "p + p → p + p + π⁰", ma: M.p, mb: M.p, sum: 2 * M.p + M.pi0 },
      photo: { name: "γ + p → π⁰ + p", ma: 0, mb: M.p, sum: M.pi0 + M.p },
      z: { name: "e⁺ + e⁻ → Z", ma: M.e, mb: M.e, sum: M.Z },
      zh: { name: "e⁺ + e⁻ → Z + H", ma: M.e, mb: M.e, sum: M.Z + M.H }
    };
    const sFixed = (E, r) => Math.sqrt(r.ma * r.ma + r.mb * r.mb + 2 * Math.max(E, r.ma) * r.mb);   // E: 빔 전체 에너지
    const sColl = (E, r) => 2 * Math.max(E, r.ma);   // 같은 에너지 정면 충돌 (질량이 같을 때)
    function draw() {
      const c = C(), r = R[S.val("rx")], lE = S.val("le"), E = 10 ** lE;
      const Ethf = (r.sum * r.sum - r.ma * r.ma - r.mb * r.mb) / (2 * r.mb), Ethc = r.ma === 0 ? NaN : r.sum / 2;
      const coll = r.ma > 0 && Math.abs(r.ma - r.mb) < 1e-9;
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: -2, x1: 6, y0: -2, y1: 4, xl: "log₁₀(빔 에너지 / GeV)", yl: "log₁₀(√s / GeV)" }); f.axes();
      f.fn((x) => Math.log10(sFixed(10 ** x, r)), c.main, 2.2, null, 400);
      if (coll) f.fn((x) => Math.log10(sColl(10 ** x, r)), c.acc, 2.2, null, 400);
      f.path([[-2, Math.log10(r.sum)], [6, Math.log10(r.sum)]], c.warn, 1.2, [5, 3]);
      const sf = sFixed(E, r), sc = coll ? sColl(E, r) : NaN;
      f.dot(lE, Math.log10(sf), c.main, 5); if (coll) f.dot(lE, Math.log10(sc), c.acc, 5);
      const ok = (x) => (x >= r.sum ? "가능" : "불가능");
      S.out(`${r.name}: 나중 입자 질량 합 ${r.sum.toFixed(4)} GeV (빨간 점선)\n빔 에너지 ${E < 1 ? (E * 1000).toFixed(1) + " MeV" : E.toFixed(2) + " GeV"}: 고정 표적 √s = ${sf.toFixed(3)} GeV (${ok(sf)})${coll ? `, 충돌형 √s = ${sc.toFixed(3)} GeV (${ok(sc)})` : " (광자 빔은 고정 표적만 표시)"}\n문턱 빔 에너지: 고정 표적 ${Ethf < 1 ? (Ethf * 1000).toFixed(1) + " MeV" : Ethf >= 1e5 ? Ethf.toExponential(3) + " GeV" : Ethf.toFixed(3) + " GeV"}${coll ? `, 충돌형 ${Ethc.toFixed(3)} GeV (빔당)` : ""}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 비행 시간으로 π, K, p 구별 (04-01) */
  (() => {
    const S = QSim.card("lab-p16-tof"); if (!S) return;
    const cv = S.$("canvas"), cl = 0.299792458;   // m/ns
    const t = (p, m, L) => L / cl * Math.sqrt(1 + (m / p) ** 2);   // ns
    function draw() {
      const c = C(), L = S.val("L"), st = S.val("st") / 1000, p = S.val("p");
      const sep = (a, b, pp) => Math.abs(t(pp, a, L) - t(pp, b, L)) / (Math.SQRT2 * st);   // 두 입자 각각 σt
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0.2, x1: 6, y0: 0, y1: 12, xl: "운동량 p (GeV)", yl: "분리 (σ 단위)" }); f.axes();
      f.fn((x) => sep(M.pic, M.K, x), c.main, 2.2, null, 400); f.fn((x) => sep(M.K, M.p, x), c.acc, 2.2, null, 400);
      f.path([[0.2, 3], [6, 3]], c.warn, 1.2, [5, 3]); f.path([[p, 0], [p, 12]], c.ink3, 1, [2, 3]);
      const lim = (a, b) => { let lo = 0.05, hi = 50; if (sep(a, b, lo) < 3) return 0; for (let i = 0; i < 80; i++) { const m = Math.sqrt(lo * hi); if (sep(a, b, m) > 3) lo = m; else hi = m; } return lo; };
      const tp = t(p, M.pic, L), tk = t(p, M.K, L), tpr = t(p, M.p, L);
      S.out(`비행 거리 ${L.toFixed(1)} m, 시간 분해능 ${(st * 1000).toFixed(0)} ps, 운동량 ${p.toFixed(2)} GeV\n비행 시간: π ${tp.toFixed(3)} ns, K ${tk.toFixed(3)} ns, p ${tpr.toFixed(3)} ns → π/K 분리 ${sep(M.pic, M.K, p).toFixed(1)}σ, K/p 분리 ${sep(M.K, M.p, p).toFixed(1)}σ\n3σ로 구별되는 최대 운동량: π/K ${lim(M.pic, M.K).toFixed(2)} GeV, K/p ${lim(M.K, M.p).toFixed(2)} GeV (파랑: π/K, 주황: K/p)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 불변 질량 봉우리와 유의성 (04-02) */
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
