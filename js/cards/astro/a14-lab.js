/* 천우14 실습 카드: 주경 모양과 구면 수차(정확한 광선 추적), 시상과 적응광학, 검출기 잡음과 한계 등급 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const fx = (x, n = 2) => (+x).toFixed(n);
  const RAD = 206264.8;

  /* 1. 주경의 원뿔 상수와 구면 수차 (01-01, 01-02) */
  (() => {
    const S = QSim.card("lab-a14-mirror"); if (!S) return;
    const cv = S.$("canvas"), D = 1.0;   // 구경 1 m
    function trace(K, N) {
      const f = N * D, R = 2 * f, rays = [];
      for (let k = -10; k <= 10; k++) {
        if (k === 0) continue;
        const r0 = (k / 10) * D / 2, q = R * R - (1 + K) * r0 * r0;
        if (q <= 0) return null;
        const z0 = r0 * r0 / (R * (1 + Math.sqrt(q / (R * R)))), dzdr = r0 / Math.sqrt(q);
        let nr = -dzdr, nz = 1; const nl = Math.hypot(nr, nz); nr /= nl; nz /= nl;   // 거울면의 법선(+z 쪽)
        const dr = 0, dz = -1, dot = dr * nr + dz * nz, er = dr - 2 * dot * nr, ez = dz - 2 * dot * nz;   // 반사
        rays.push({ r0, z0, er, ez, zax: z0 - r0 * ez / er });
      }
      return { f, rays };
    }
    const at = (ray, z) => ray.r0 + ray.er * (z - ray.z0) / ray.ez;
    const rmsAt = (T, z) => Math.sqrt(T.rays.reduce((s, ry) => s + at(ry, z) ** 2, 0) / T.rays.length);
    function draw() {
      const c = C(), K = S.val("k"), N = S.val("n"), T = trace(K, N);
      if (!T) { S.out("이 원뿔 상수와 구경비에서는 거울면이 정의되지 않습니다"); return; }
      const f = T.f, zs = T.rays.map((r) => r.zax), zmin = Math.min(...zs), zmax = Math.max(...zs), lsa = zmax - zmin;
      let best = [f, rmsAt(T, f)]; for (let k = 0; k <= 400; k++) { const z = zmin - 0.1 * lsa + k / 400 * 1.2 * lsa, s = rmsAt(T, z); if (s < best[1]) best = [z, s]; }
      const half = Math.max(lsa * 1.6, 2e-4 * f), z0 = (zmin + zmax) / 2;
      const yr = Math.max(...T.rays.map((ry) => Math.max(Math.abs(at(ry, z0 - half)), Math.abs(at(ry, z0 + half))))) * 1.05;
      const v = QSim.view(cv, 0.56), fr = QSim.frame(v, { x0: (z0 - half - f) * 1000, x1: (z0 + half - f) * 1000, y0: -yr * 1000, y1: yr * 1000, xl: "초점 근처 z − f (mm)", yl: "광선 높이 (mm)" }); fr.axes();
      T.rays.forEach((ry) => fr.path([[(z0 - half - f) * 1000, at(ry, z0 - half) * 1000], [(z0 + half - f) * 1000, at(ry, z0 + half) * 1000]], Math.abs(ry.r0) > 0.4 * D ? c.warn : c.main, 1));
      fr.path([[0, -yr * 1000], [0, yr * 1000]], c.acc, 1, [4, 3]); fr.path([[(best[0] - f) * 1000, -yr * 1000], [(best[0] - f) * 1000, yr * 1000]], c.ink3, 1, [2, 3]);
      const asec = (x) => x / f * RAD, diff = 1.22 * 550e-9 / D * RAD;
      const shape = Math.abs(K + 1) < 1e-6 ? "포물면" : Math.abs(K) < 1e-6 ? "구면" : K < -1 ? "쌍곡면" : K > 0 ? "편구면(납작한 타원면)" : "타원면";
      S.out(`구경 1 m, f/${fx(N, 1)}(초점 거리 ${fx(f, 1)} m), 원뿔 상수 K = ${fx(K, 2)} (${shape})\n가장자리 광선과 중심 근처 광선의 초점 차(종 구면 수차) ${fx(lsa * 1000, 3)} mm\n근축 초점면에서 상의 rms 반지름 ${fx(rmsAt(T, f) * 1e6, 1)} μm = ${fx(asec(rmsAt(T, f)), 3)}″, 가장 좋은 초점면(근축 초점에서 ${fx((best[0] - f) * 1000, 3)} mm)에서 ${fx(best[1] * 1e6, 1)} μm = ${fx(asec(best[1]), 3)}″\n비교: 550 nm 회절 한계 1.22λ/D = ${fx(diff, 3)}″. 빨간 선: 바깥쪽 광선, 파란 선: 안쪽 광선, 주황 점선: 근축 초점, 회색 점선: 가장 좋은 초점`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 시상과 적응광학 (03-01, 03-02) */
  (() => {
    const S = QSim.card("lab-a14-seeing"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), r05 = S.val("r0") / 100, Dm = S.val("d"), nact = S.val("na"), lam = Math.pow(10, S.val("ll")) * 1e-6;
      const r0 = (l) => r05 * Math.pow(l / 0.5e-6, 1.2), see = (l) => 0.98 * l / r0(l) * RAD, dif = (l) => 1.03 * l / Dm * RAD;
      const strehl = (l) => nact > 0 ? Math.exp(-0.28 * Math.pow((Dm / nact) / r0(l), 5 / 3)) : Math.exp(-1.03 * Math.pow(Dm / r0(l), 5 / 3));
      const ymax = Math.max(1.2, see(0.35e-6) * 1.1);
      const v = QSim.view(cv, 0.56), f = QSim.frame(v, { x0: -0.5, x1: 0.7, y0: 0, y1: ymax, xl: "log₁₀ 파장 (μm)", yl: "FWHM (″) / Strehl 비" }); f.axes();
      f.fn((x) => see(Math.pow(10, x) * 1e-6), c.warn, 2); f.fn((x) => dif(Math.pow(10, x) * 1e-6), c.main, 2); f.fn((x) => strehl(Math.pow(10, x) * 1e-6), c.acc, 1.6, [5, 3]);
      f.path([[Math.log10(lam * 1e6), 0], [Math.log10(lam * 1e6), ymax]], c.ink3, 1, [2, 3]);
      const S_ = strehl(lam), cross = 0.5e-6 * Math.pow(Dm / r05, 1 / 1.2);
      S.out(`파장 ${fx(lam * 1e6, 2)} μm: Fried 매개변수 r₀ = ${fx(r0(lam) * 100, 1)} cm (500 nm에서 ${fx(r05 * 100, 0)} cm, r₀ ∝ λ^1.2)\n시상 FWHM 0.98λ/r₀ = ${fx(see(lam), 3)}″, 구경 ${fx(Dm, 1)} m의 회절 한계 FWHM 1.03λ/D = ${fx(dif(lam), 3)}″ (r₀가 D와 같아지는 파장 ${fx(cross * 1e6, 1)} μm)\n${nact > 0 ? `적응광학(지름에 구동기 ${nact}개, 간격 ${fx(Dm / nact * 100, 1)} cm)의 맞춤 오차만 고려한 Strehl 비 exp[−0.28(d/r₀)^(5/3)] = ${fx(S_, 3)}` : `적응광학 없음: 장노출 Strehl 비 ≈ exp[−1.03(D/r₀)^(5/3)] = ${S_.toExponential(1)}`}\n빨강: 시상, 파랑: 회절 한계, 주황 점선: Strehl 비, 회색 점선: 고른 파장`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 검출기 잡음과 한계 등급 (04-02) */
  (() => {
    const S = QSim.card("lab-a14-limmag"); if (!S) return;
    const cv = S.$("canvas");
    const BAND = { V: { F0: 8.9e5, sky: 21.5, qe: 0.5, rn: 5, dk: 0.001, name: "V 띠(CCD)" }, K: { F0: 1.77e5, sky: 13.0, qe: 0.5, rn: 15, dk: 0.05, name: "K 띠(HgCdTe 적외선 배열)" } };
    function draw() {
      const c = C(), b = BAND[S.val("band")], Dm = S.val("d"), t = Math.pow(10, S.val("lt")), fw = S.val("fw"), sky = b.sky + S.val("dsky");
      const area = Math.PI * (Dm * 100 / 2) ** 2 * (1 - 0.1), npix = Math.PI * fw * fw / 0.09, frac = 1 - Math.exp(-2.773);
      const sig = (m) => b.F0 * Math.pow(10, -0.4 * m) * area * b.qe * frac * t;
      const B = b.F0 * Math.pow(10, -0.4 * sky) * 0.09 * area * b.qe * t, Dk = b.dk * t, R2 = b.rn * b.rn;
      const snr = (m) => { const s = sig(m); return s / Math.sqrt(s + npix * (B + Dk + R2)); };
      let lo = 5, hi = 35; for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (snr(m) > 5) lo = m; else hi = m; }
      const ml = (lo + hi) / 2, s = sig(ml), parts = [["별 자신의 잡음이", s], ["하늘 배경이", npix * B], ["암전류가", npix * Dk], ["읽기 잡음이", npix * R2]], dom = parts.reduce((a, q) => q[1] > a[1] ? q : a);
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: ml - 8, x1: ml + 3, y0: -1, y1: 4, xl: "등급", yl: "log₁₀ S/N" }); f.axes();
      f.fn((m) => Math.log10(Math.max(snr(m), 0.1)), c.main, 2); f.path([[ml - 8, Math.log10(5)], [ml + 3, Math.log10(5)]], c.warn, 1, [4, 3]); f.dot(ml, Math.log10(5), c.acc, 5);
      S.out(`${b.name}, 구경 ${fx(Dm, 1)} m, 노출 ${t.toFixed(0)} s, 시상 ${fx(fw, 1)}″, 하늘 ${fx(sky, 1)} 등급/초², 픽셀 0.3″, 구경(반지름 = FWHM) 안 ${npix.toFixed(0)} 픽셀\nS/N = 5 한계 등급 ${fx(ml, 2)}. 그때 별 신호 ${s.toFixed(0)} 전자\n분산 기여: 별 ${parts[0][1].toFixed(0)}, 하늘 ${parts[1][1].toFixed(0)}, 암전류 ${parts[2][1].toFixed(1)}, 읽기 ${parts[3][1].toFixed(0)} (전자²) → ${dom[0]} 지배\n가정: 효율(검출기 × 광학) ${b.qe}, 부경 가림 10%, 읽기 잡음 ${b.rn} e⁻, 암전류 ${b.dk} e⁻/s/픽셀. 빨간 점선: S/N = 5`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
