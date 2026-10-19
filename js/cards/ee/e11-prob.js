/* 전전11 확률과랜덤변수 탐구 카드 묶음
   1 BSC의 Bayes(01-01)  2 중심극한정리(03-02)  3 무작위 위상 정현파의 앙상블(04-01)
   4 RC 필터를 지난 백색 잡음(05-02)  5 정합 필터(06-01) */
(() => {
  "use strict";
  if (!window.QSim) return;
  const C = () => QSim.col();
  const f2 = (x, d = 3) => (Math.abs(x) < 5e-13 ? 0 : x).toFixed(d);
  /* 재현 가능한 난수(선형 합동, Python으로 같은 값을 재현할 수 있게 Math.imul 사용) */
  const rng = (seed) => () => { seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff; return seed / 2147483648; };
  const gauss = (r) => { let u = r(); if (u < 1e-12) u = 1e-12; return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); };

  /* 2. 중심극한정리: 균일 분포 n개의 합 */
  (() => {
    const S = QSim.card("exp-e11-clt"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), n = S.val("n"), M = 20000, r = rng(2024);
      // 합을 평균 0, 분산 1로 표준화: (Σ U − n/2)/sqrt(n/12)
      const sd = Math.sqrt(n / 12), bins = 40, lo = -4, hi = 4, w = (hi - lo) / bins, h = new Array(bins).fill(0);
      let tail = 0, m4 = 0;
      for (let k = 0; k < M; k++) {
        let s = 0; for (let i = 0; i < n; i++) s += r();
        const z = (s - n / 2) / sd; m4 += z ** 4;
        if (Math.abs(z) > 2) tail++;
        const b = Math.floor((z - lo) / w); if (b >= 0 && b < bins) h[b]++;
      }
      const v = QSim.view(cv, 0.45), fr = QSim.frame(v, { x0: lo, x1: hi, y0: 0, y1: 0.6, xl: "표준화한 합 z", yl: "확률 밀도" }); fr.axes();
      const g = v.g; g.fillStyle = c.soft;
      h.forEach((cnt, i) => { const d = cnt / (M * w), x = lo + i * w; g.fillRect(fr.X(x), fr.Y(d), fr.X(x + w) - fr.X(x) - 1, fr.Y(0) - fr.Y(d)); });
      fr.fn((z) => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI), c.warn, 2.2);
      S.out(`균일 분포 U(0,1) ${n}개의 합을 ${M}번 뽑아 평균 0, 분산 1로 표준화한 히스토그램(연보라)과 표준 정규 밀도(빨강)\n` +
        `|z| > 2인 비율 ${f2(tail / M, 4)} (정규 분포면 0.0455), 4차 모멘트 E[z⁴] = ${f2(m4 / M, 3)} (정규 분포면 3, n = 1이면 1.8)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 무작위 위상 정현파: 표본 경로, 앙상블 평균, 자기상관 */
  (() => {
    const S = QSim.card("exp-e11-process"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), mode = S.val("mode"), tau = S.val("tau"), K = 2000, r = rng(7), A = 1, f0 = 1;
      const paths = [];
      for (let k = 0; k < K; k++) { const th = mode === "uni" ? 2 * Math.PI * r() : (Math.PI / 2) * r(); paths.push(th); }
      const x = (t, th) => A * Math.cos(2 * Math.PI * f0 * t + th);
      const v = QSim.view(cv, 0.45), fr = QSim.frame(v, { x0: 0, x1: 2, y0: -1.3, y1: 1.3, xl: "t (s)", yl: "x(t)" }); fr.axes();
      for (let k = 0; k < 5; k++) fr.fn((t) => x(t, paths[k]), [c.rule, c.ink3, c.soft, c.acc, c.ink2][k], 1.2);
      const mean = (t) => paths.reduce((s, th) => s + x(t, th), 0) / K;
      fr.fn(mean, c.warn, 2.6, undefined, 120);
      const R = (t1, tt) => paths.reduce((s, th) => s + x(t1, th) * x(t1 + tt, th), 0) / K;
      S.out(`x(t) = cos(2πt + Θ), Θ ~ ${mode === "uni" ? "균일(0, 2π)" : "균일(0, π/2)"}, 표본 ${K}개로 앙상블 평균(빨강)과 자기상관을 계산\n` +
        `평균 E[x(0)] = ${f2(mean(0))}, E[x(0.25)] = ${f2(mean(0.25))}\n` +
        `R(t, t+τ), τ = ${f2(tau, 2)}: t = 0에서 ${f2(R(0, tau))}, t = 0.25에서 ${f2(R(0.25, tau))} (이론 (1/2)cos(2πτ) = ${f2(0.5 * Math.cos(2 * Math.PI * tau))}는 균일(0, 2π)일 때)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 5. 정합 필터: 잡음 속 펄스 */
  (() => {
    const S = QSim.card("exp-e11-matched"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), snrdb = S.val("snr"), kind = S.val("kind"), L = 20, N = 200, t0 = 80, r = rng(11);
      const pulse = Array.from({ length: L }, (_, i) => kind === "rect" ? 1 : Math.sin(Math.PI * (i + 0.5) / L));
      const E = pulse.reduce((s, p) => s + p * p, 0);
      // 표본당 잡음 분산 σ² = N0/2 이므로 2E/N0 = E/σ² 가 설정값이 되게 σ² = E/SNR
      const snr = 10 ** (snrdb / 10), sig2 = E / snr, sig = Math.sqrt(sig2);
      const x = Array.from({ length: N }, (_, n) => (n >= t0 && n < t0 + L ? pulse[n - t0] : 0) + sig * gauss(r));
      const y = Array.from({ length: N }, (_, n) => { let s = 0; for (let k = 0; k < L; k++) if (n - k >= 0) s += x[n - k] * pulse[L - 1 - k]; return s; });
      const peak = t0 + L - 1, ymax = Math.max(...y.map(Math.abs), 1);
      const v = QSim.view(cv, 0.5), fr = QSim.frame(v, { x0: 0, x1: N, y0: -1.2, y1: 1.2, xl: "표본 n" }); fr.axes({ noGrid: true });
      fr.path(x.map((val, n) => [n, Math.max(-1.2, Math.min(1.2, val / Math.max(2, 4 * sig + 1)))]), c.rule, 1.2);
      fr.path(y.map((val, n) => [n, val / ymax]), c.main, 2.2);
      fr.dot(peak, y[peak] / ymax, c.warn, 6);
      let other = 0; y.forEach((val, n) => { if (Math.abs(n - peak) > L && Math.abs(val) > other) other = Math.abs(val); });
      S.out(`펄스(${kind === "rect" ? "사각" : "반사인"}, ${L}표본, 에너지 E = ${f2(E, 2)}), 표본 잡음 표준편차 σ = ${f2(sig, 3)}: 회색은 받은 신호(크기 조정), 파랑은 정합 필터 출력\n` +
        `이론 최대 SNR = 2E/N₀ = ${f2(snrdb, 1)} dB. 출력: 펄스 끝 n = ${peak}에서 ${f2(y[peak], 2)}(잡음 없으면 E = ${f2(E, 2)}), 그 밖에서 가장 큰 크기 ${f2(other, 2)}\n` +
        `받은 신호 표본 하나의 SNR(첨두²/σ²)은 ${f2(Math.abs(Math.log10(sig2)) < 0.005 ? 0 : -10 * Math.log10(sig2), 1)} dB로, 정합 필터가 펄스 길이만큼 에너지를 모아 높입니다.`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
