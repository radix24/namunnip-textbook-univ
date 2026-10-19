/* 기계7 기계공학실험(1) 1단원: 표본화와 양자화 (01-01), 반복 측정과 신뢰 구간 (01-02) */
(() => {
  "use strict";

  /* ── 표본화: 에일리어싱과 양자화 ── */
  (() => {
    const S = QSim.card("lab-me-sampling"); if (!S) return;
    const [cv] = S.$$("canvas");
    function draw() {
      const c = QSim.col(), f0 = S.val("f"), fs = S.val("fs"), N = S.val("bits"), A = 4, Tw = 0.2;
      const q = 10 / 2 ** N, quant = (v) => Math.max(-5, Math.min(5 - q, Math.round(v / q) * q));
      const x = (t) => A * Math.sin(2 * Math.PI * f0 * t);
      // 겉보기 주파수: f0를 fs의 배수만큼 접어 0~fs/2로
      let fa = f0 % fs; if (fa > fs / 2) fa = fs - fa;
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: Tw, y0: -5.5, y1: 5.5, xl: "t (s)", yl: "전압 (V)", pad: 34 });
      f.axes();
      f.fn(x, c.ink3, 1.2, null, 1200);
      const pts = []; for (let k = 0; k * (1 / fs) <= Tw + 1e-9; k++) { const t = k / fs; pts.push([t, quant(x(t))]); }
      f.path(pts, c.warn, 1.8);
      pts.forEach(([t, y]) => f.dot(t, y, c.warn, 3));
      const alias = fa < f0 - 1e-9 ? `에일리어싱! 자료에는 ${fa.toFixed(1)} Hz로 보인다` : "표본화 정리를 만족 (겉보기 = 실제)";
      S.out(`신호 ${f0} Hz, 진폭 4 V / 표본화 ${fs} Hz → Nyquist 주파수 ${(fs / 2).toFixed(1)} Hz, 주기당 표본 ${(fs / f0).toFixed(2)}개\n${alias}\n${N}비트, 범위 ±5 V → 한 칸 ${(q * 1000).toFixed(N > 10 ? 2 : 1)} mV, 최대 양자화 오차 ${(q * 500).toFixed(N > 10 ? 2 : 1)} mV, RMS 양자화 오차 ${(q * 1000 / Math.sqrt(12)).toFixed(N > 10 ? 2 : 1)} mV`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* ── 반복 측정: 평균, t 신뢰 구간, 포함 확률 ── */
  (() => {
    const S = QSim.card("lab-me-repeat"); if (!S) return;
    const [cv] = S.$$("canvas");
    // 결정적 난수 (mulberry32) + 정규분포 (Box-Muller)
    const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const gauss = (r) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
    // 양측 95% t 값 (자유도 1~30), 그 이상은 근사
    const TT = [12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201, 2.179, 2.160, 2.145, 2.131, 2.120, 2.110, 2.101, 2.093, 2.086, 2.080, 2.074, 2.069, 2.064, 2.060, 2.056, 2.052, 2.048, 2.045, 2.042];
    const tval = (df) => (df <= 30 ? TT[df - 1] : 1.96 + 2.4 / df);
    let seed = 1;
    const TRUE = 50.0;
    function stats(xs) { const n = xs.length, m = xs.reduce((a, b) => a + b, 0) / n, s = Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (n - 1)); return { n, m, s, u: s / Math.sqrt(n) }; }
    function draw() {
      const c = QSim.col(), n = S.val("n"), sig = S.val("sig"), bias = S.val("b");
      const r = rng(seed * 7919), xs = Array.from({ length: n }, () => TRUE + bias + sig * gauss(r));
      const st = stats(xs), t = tval(n - 1), half = t * st.u, hit = Math.abs(st.m - TRUE) <= half;
      // 같은 조건의 가상 실험 1000번에서 구간이 참값을 품는 비율
      const r2 = rng(seed * 104729 + 3); let cover = 0;
      for (let k = 0; k < 1000; k++) { const ys = Array.from({ length: n }, () => TRUE + bias + sig * gauss(r2)); const q = stats(ys); if (Math.abs(q.m - TRUE) <= tval(n - 1) * q.u) cover++; }
      const lo = TRUE - 0.5, hi = TRUE + 0.5, nb = 25, bw = (hi - lo) / nb, hist = new Array(nb).fill(0);
      xs.forEach((x) => { const i = Math.floor((x - lo) / bw); if (i >= 0 && i < nb) hist[i]++; });
      const hmax = Math.max(...hist, 1);
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: lo, x1: hi, y0: -0.35 * hmax, y1: hmax * 1.1, xl: "길이 (mm)", pad: 30 }), G = v.g;
      f.axes({ noGrid: true });
      hist.forEach((h, i) => { if (!h) return; G.fillStyle = "rgba(75,79,224,.45)"; G.fillRect(f.X(lo + i * bw) + 1, f.Y(h), bw * f.sx - 2, f.Y(0) - f.Y(h)); });
      f.path([[TRUE, -0.35 * hmax], [TRUE, hmax * 1.1]], c.acc, 2, [5, 4]);
      const y0 = -0.18 * hmax; f.path([[st.m - half, y0], [st.m + half, y0]], hit ? c.main : c.warn, 4); f.dot(st.m, y0, hit ? c.main : c.warn, 6);
      S.out(`가상 측정 ${n}번 (참값 50.000 mm, 편향 ${bias.toFixed(3)} mm, 우연 오차 σ = ${sig.toFixed(3)} mm)\n평균 ${st.m.toFixed(4)} mm, 표본 표준편차 s = ${st.s.toFixed(4)}, 평균의 표준 불확도 s/√n = ${st.u.toFixed(4)} mm\n95% 신뢰 구간 ${st.m.toFixed(4)} ± ${half.toFixed(4)} mm (t = ${t.toFixed(3)}) → 참값을 ${hit ? "품음" : "놓침"}\n같은 조건 가상 실험 1000번 중 구간이 참값을 품은 비율 ${(cover / 10).toFixed(1)}%`);
    }
    S.$(".reset").addEventListener("click", () => { seed++; draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
