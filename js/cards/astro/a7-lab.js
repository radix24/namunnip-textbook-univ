/* 천우7 실습 카드: 구경 측광, Bouguer 소광 보정, 비교 광원 파장 보정, 등가 폭 측정 (모두 가상 자료) */
(() => {
  "use strict";
  const C = () => QSim.col();
  const fx = (x, n = 2) => (+x).toFixed(n);
  const rng = (s) => () => { s = (s * 1664525 + 1013904223) % 4294967296; return (s + 0.5) / 4294967296; };
  const gauss = (r) => Math.sqrt(-2 * Math.log(r())) * Math.cos(2 * Math.PI * r());
  const lsq = (xs, ys) => { const n = xs.length, sx = xs.reduce((a, b) => a + b, 0), sy = ys.reduce((a, b) => a + b, 0), sxx = xs.reduce((a, x) => a + x * x, 0), sxy = xs.reduce((a, x, i) => a + x * ys[i], 0), D = n * sxx - sx * sx, b = (n * sxy - sx * sy) / D, a = (sy - b * sx) / n, res = xs.map((x, i) => ys[i] - a - b * x), s = Math.sqrt(res.reduce((q, z) => q + z * z, 0) / Math.max(1, n - 2)); return { a, b, sa: s * Math.sqrt(sxx / D), sb: s * Math.sqrt(n / D), s, res }; };

  /* 1. 구경 측광과 성장 곡선 (04-01) */
  (() => {
    const S = QSim.card("lab-a7-aperture"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), F = Math.pow(10, S.val("lf")), fw = S.val("fw"), B = S.val("sky"), RN = 8, r = S.val("r"), sig = fw / 2.3548;
      const frac = (rr) => 1 - Math.exp(-rr * rr / (2 * sig * sig));
      const snr = (rr) => { const n = Math.PI * rr * rr; return F * frac(rr) / Math.sqrt(F * frac(rr) + n * (B + RN * RN)); };
      let best = 0, rb = 0; for (let t = 0.2; t <= 15; t += 0.05) { const q = snr(t); if (q > best) { best = q; rb = t; } }
      const v = QSim.view(cv, 0.55), g = v.g, half = Math.min(v.H, v.W * 0.45), N = 31, px = half / N, rr0 = rng(3);
      const img = []; let mx = 0;
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const x = i - 15, y = j - 15, pk = F / (2 * Math.PI * sig * sig) * Math.exp(-(x * x + y * y) / (2 * sig * sig)), val = pk + B + Math.sqrt(pk + B + RN * RN) * gauss(rr0); img.push(val); mx = Math.max(mx, val); }
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const t = Math.max(0, Math.min(1, Math.sqrt(Math.max(0, img[j * N + i] - B * 0.8) / (mx - B * 0.8)))); const q = Math.round(255 * t); g.fillStyle = `rgb(${q},${q},${q})`; g.fillRect(i * px, j * px, px + 0.5, px + 0.5); }
      g.save(); g.strokeStyle = c.warn; g.lineWidth = 2; g.beginPath(); g.arc(15.5 * px, 15.5 * px, r * px, 0, 7); g.stroke();
      g.strokeStyle = c.acc; g.setLineDash([4, 3]); g.beginPath(); g.arc(15.5 * px, 15.5 * px, Math.min(15, r + 4) * px, 0, 7); g.stroke(); g.restore();
      g.save(); g.translate(half + 10, 0);
      const f2 = QSim.frame({ g, W: v.W - half - 10, H: v.H, cv }, { x0: 0, x1: 15, y0: 0, y1: 1.1, xl: "구경 반지름 (화소)", yl: "비율" }); f2.axes();
      f2.fn(frac, c.main, 2); f2.fn((t) => snr(t) / best, c.warn, 2); f2.path([[r, 0], [r, 1.1]], c.ink3, 1, [3, 3]); g.restore();
      const n = Math.PI * r * r, Fa = F * frac(r), m = -2.5 * Math.log10(Fa) + 25;
      S.out(`가상 별: 전체 ${F.toExponential(2)} e⁻, 시상 반치폭 ${fx(fw, 1)}화소, 하늘 ${B} e⁻/화소, 읽기 잡음 ${RN} e⁻\n구경 반지름 ${fx(r, 1)}화소(화소 ${fx(n, 0)}개): 담긴 별빛 ${fx(frac(r) * 100, 1)}%, S/N = ${fx(snr(r), 1)}, 기기 등급 −2.5 log F + 25 = ${fx(m, 3)}\nS/N이 가장 큰 반지름 ${fx(rb, 2)}화소 = 반치폭의 ${fx(rb / fw, 2)}배 (S/N ${fx(best, 1)})\n파란 선: 성장 곡선(담긴 비율), 빨간 선: S/N(최댓값 = 1). 주황 점선 원: 하늘 고리`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. Bouguer 그림으로 대기 소광 보정 (04-02) */
  (() => {
    const S = QSim.card("lab-a7-bouguer"); if (!S) return;
    const cv = S.$("canvas"); let seed = 21;
    function draw() {
      const c = C(), k = S.val("k"), sig = S.val("sig"), N = S.val("n"), m0 = 10.00, r = rng(seed);
      const X = [], m = []; for (let i = 0; i < N; i++) { const x = 1 + 1.5 * r(); X.push(x); m.push(m0 + k * x + sig * gauss(r)); }
      const L = lsq(X, m);
      const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: 0, x1: 2.7, y0: m0 - 0.2, y1: m0 + 0.6 * 2.7 + 0.3, xl: "대기 질량 X", yl: "기기 등급 m" }); f.axes();
      f.path([[0, L.a], [2.7, L.a + 2.7 * L.b]], c.warn, 2); f.path([[0, m0], [2.7, m0 + 2.7 * k]], c.ink3, 1, [4, 3]);
      X.forEach((x, i) => f.dot(x, m[i], c.main, 4)); f.dot(0, L.a, c.warn, 5);
      S.out(`가상 표준성 관측 ${N}회 (대기 질량 1.0~2.5), 참 소광 계수 k = ${fx(k, 3)} 등급/대기 질량, 측광 오차 σ = ${fx(sig, 3)}\n직선 맞춤: k = ${fx(L.b, 3)} ± ${fx(L.sb, 3)}, 대기 밖 등급 m₀ = ${fx(L.a, 3)} ± ${fx(L.sa, 3)} (참값 10.000)\nX = 0으로 늘인 빨간 점이 대기 밖의 등급이다. 회색 점선: 참 관계`);
    }
    S.$(".btns .new").addEventListener("click", () => { seed += 1; draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 비교 광원으로 파장 보정 (05-02) */
  (() => {
    const S = QSim.card("lab-a7-wavecal"); if (!S) return;
    const cv = S.$("canvas");
    const LAMP = [585.25, 588.19, 594.48, 597.55, 603.00, 607.43, 609.62, 614.31, 616.36, 621.73, 626.65, 630.48, 633.44, 638.30, 640.22, 650.65, 653.29, 659.90, 667.83, 671.70, 692.95, 703.24];   // 네온 선 (nm)
    const L0 = 580, D1 = 0.06;   // 화소 0의 파장, 화소당 nm
    function draw() {
      const c = C(), d2 = S.val("d2") * 1e-8, order = +S.val("ord"), sig = S.val("sig"), r = rng(9);
      const lam = (p) => L0 + D1 * p + d2 * p * p;
      const pix = (l) => { let p = (l - L0) / D1; for (let i = 0; i < 20; i++) p -= (lam(p) - l) / (D1 + 2 * d2 * p); return p; };
      const pts = LAMP.filter((l) => pix(l) >= 0 && pix(l) <= 2048).map((l) => [pix(l) + sig * gauss(r), l]);
      // 1차 또는 2차 다항식 최소제곱 (정규 방정식)
      const fit = (ord) => { const n = ord + 1, A = Array.from({ length: n }, () => new Array(n + 1).fill(0)); pts.forEach(([p, l]) => { const s = p / 1000; for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) A[i][j] += Math.pow(s, i + j); A[i][n] += l * Math.pow(s, i); } });
        for (let i = 0; i < n; i++) { for (let k2 = i + 1; k2 < n; k2++) { const q = A[k2][i] / A[i][i]; for (let j = i; j <= n; j++) A[k2][j] -= q * A[i][j]; } }
        const co = new Array(n).fill(0); for (let i = n - 1; i >= 0; i--) { let s = A[i][n]; for (let j = i + 1; j < n; j++) s -= A[i][j] * co[j]; co[i] = s / A[i][i]; }
        return (p) => co.reduce((s, cc, i) => s + cc * Math.pow(p / 1000, i), 0); };
      const F = fit(order), res = pts.map(([p, l]) => l - F(p)), rms = Math.sqrt(res.reduce((s, z) => s + z * z, 0) / Math.max(1, res.length - order - 1));
      const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: 0, x1: 2048, y0: -0.03, y1: 0.03, xl: "화소", yl: "잔차 (nm)" }); f.axes();
      pts.forEach(([p], i) => f.dot(p, Math.max(-0.03, Math.min(0.03, res[i])), c.main, 4));
      f.path([[0, 0], [2048, 0]], c.ink3, 1);
      const dv = rms / 630 * 299792;
      S.out(`가상 네온 비교 광원 선 ${pts.length}개, 참 분산 λ = ${L0} + ${D1} p + ${fx(d2 * 1e8, 1)}×10⁻⁸ p² (nm), 선 중심 측정 오차 ${fx(sig, 2)}화소\n${order}차 다항식 맞춤의 잔차 표준편차 ${fx(rms * 1000, 1)} pm = 630 nm에서 시선속도 ${fx(dv, 1)} km/s에 해당\n점: 각 비교 선의 잔차(참 파장 − 맞춤 파장). 잔차에 휘는 무늬가 남으면 차수가 모자란 것이다`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 등가 폭 측정과 연속광 위치 (05-03) */
  (() => {
    const S = QSim.card("lab-a7-ew"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), d = S.val("d"), w = S.val("w"), cerr = S.val("ce") / 100, sn = S.val("sn"), r = rng(17), l0 = 500;
      const xs = [], ys = []; for (let l = 497; l <= 503; l += 0.01) { xs.push(l); ys.push(1 - d * Math.exp(-0.5 * ((l - l0) / w) ** 2) + gauss(r) / sn); }
      const cont = 1 + cerr, win = 4 * w + 0.05;
      let ew = 0; xs.forEach((l, i) => { if (Math.abs(l - l0) <= win) ew += (1 - ys[i] / cont) * 0.01; });
      const ewTrue = d * w * Math.sqrt(2 * Math.PI);
      const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: 497, x1: 503, y0: 0, y1: 1.25, xl: "파장 (nm)", yl: "세기" }); f.axes();
      const g = v.g; g.save(); g.fillStyle = c.soft; g.globalAlpha = 0.5; g.fillRect(f.X(l0 - ewTrue / 2), f.Y(cont), f.X(l0 + ewTrue / 2) - f.X(l0 - ewTrue / 2), f.Y(0) - f.Y(cont)); g.restore();
      f.path(xs.map((l, i) => [l, ys[i]]), c.main, 1.2); f.path([[497, cont], [503, cont]], c.warn, 1.5, [5, 3]);
      f.path([[l0 - win, 0], [l0 - win, 1.25]], c.ink3, 1, [2, 3]); f.path([[l0 + win, 0], [l0 + win, 1.25]], c.ink3, 1, [2, 3]);
      S.out(`가상 흡수선: 깊이 ${fx(d, 2)}, 폭 σ = ${fx(w, 3)} nm → 참 등가 폭 W = d σ √(2π) = ${fx(ewTrue * 1000, 1)} pm\n연속광을 ${fx(cerr * 100, 1)}% ${cerr >= 0 ? "높게" : "낮게"} 잡고, 점선 사이(±${fx(win, 2)} nm)를 더해 잰 등가 폭 ${fx(ew * 1000, 1)} pm (오차 ${fx((ew / ewTrue - 1) * 100, 1)}%)\n파란 선: 가상 스펙트럼(S/N ${sn}), 빨간 점선: 연속광 위치, 옅은 사각형: 넓이가 등가 폭과 같은 직사각형`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
