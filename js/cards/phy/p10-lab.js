/* 물리10 실습 카드 묶음: e/m 가상 측정, 밀리컨 전하 양자화, 프랑크-헤르츠 곡선, 발머선과 뤼드베리 상수, 마이컬슨 간섭계 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const rng = (s) => () => { s = (s * 1664525 + 1013904223) % 4294967296; return (s + 0.5) / 4294967296; };
  const gauss = (r) => Math.sqrt(-2 * Math.log(r())) * Math.cos(2 * Math.PI * r());
  const deg = Math.PI / 180, MU0 = 4e-7 * Math.PI, EM = 1.75882e11, E0 = 1.602176634e-19;
  const fitLine = (xs, ys, ws) => {   // 가중 최소제곱 y = a + bx
    ws = ws || xs.map(() => 1);
    let S = 0, Sx = 0, Sy = 0, Sxx = 0, Sxy = 0; xs.forEach((x, i) => { const w = ws[i], y = ys[i]; S += w; Sx += w * x; Sy += w * y; Sxx += w * x * x; Sxy += w * x * y; });
    const D = S * Sxx - Sx * Sx; return { a: (Sxx * Sy - Sx * Sxy) / D, b: (S * Sxy - Sx * Sy) / D, sa: Math.sqrt(Sxx / D), sb: Math.sqrt(S / D) };
  };

  /* 1. e/m 가상 측정 (02-01, 02-02) */
  (() => {
    const S = QSim.card("lab-p10-em"); if (!S) return;
    const cv = S.$("canvas"), R = 0.15, N = 130, k = 0.7155 * MU0 * N / R; let seed = 5, rec = [];
    let last = null;
    function measure() {
      const V = S.val("V"), I = S.val("I"), BE = Number(S.val("earth")) * 1e-6, B = k * I, Bt = B + BE;
      const r = Math.sqrt(2 * V / EM) / Bt, rr = rng(seed + Math.round(V * 7 + I * 1000)), dRead = 2 * r + 0.0015 * gauss(rr);   // 지름 읽기 오차 1.5 mm
      return { V, I, B, Bt, r, dRead, em: 2 * V / (B * B * (dRead / 2) ** 2) };
    }
    function draw() {
      const c = C(), m = measure(); last = m;
      const v = QSim.view(cv, 0.62), f = QSim.frame(v, { x0: -0.13, x1: 0.13, y0: -0.11, y1: 0.11, equal: true });
      const g = v.g; g.save(); g.strokeStyle = c.rule; g.lineWidth = 1; g.beginPath(); g.arc(f.X(0), f.Y(0), 0.1 * f.sx, 0, 7); g.stroke(); g.restore();
      const pts = []; for (let i = 0; i <= 200; i++) { const t = 2 * Math.PI * i / 200; pts.push([m.r * Math.sin(t), -0.09 + m.r - m.r * Math.cos(t)]); }
      f.path(pts.filter(([x, y]) => Math.hypot(x, y) < 0.1), "#7fd6a0", 3);
      f.dot(0, -0.09, c.ink, 4); f.text("전자총", 0.005, -0.1, c.ink3);
      for (let i = 0; i <= 16; i++) { const y = -0.09 + i * 0.01; f.path([[-0.118, y], [i % 5 === 0 ? -0.108 : -0.112, y]], c.ink3, 1); if (i % 5 === 0) f.text(`${i}`, -0.13, y - 0.002, c.ink3); }
      f.text("cm", -0.13, 0.085, c.ink3);
      const list = rec.map((q) => q.em), mean = list.length ? list.reduce((s, x) => s + x, 0) / list.length : NaN;
      const sd = list.length > 1 ? Math.sqrt(list.reduce((s, x) => s + (x - mean) ** 2, 0) / (list.length - 1)) : NaN;
      S.out(`가상 장치: 헬름홀츠 코일 R = 15 cm, N = 130. V = ${m.V} V, I = ${m.I.toFixed(2)} A → 코일 장 B = ${(m.B * 1e3).toFixed(3)} mT${Number(S.val("earth")) ? `, 지구 장 축 성분 ${S.val("earth")} μT 포함 실제 ${(m.Bt * 1e3).toFixed(3)} mT` : ""}\n읽은 지름 ${(m.dRead * 100).toFixed(2)} cm (읽기 오차 약 0.15 cm) → e/m = 2V/(B²r²) = ${(m.em / 1e11).toFixed(3)} × 10¹¹ C/kg (기준 1.7588)\n기록 ${rec.length}개${rec.length ? `: 평균 ${(mean / 1e11).toFixed(3)}${rec.length > 1 ? ` ± ${(sd / Math.sqrt(rec.length) / 1e11).toFixed(3)} (표준오차)` : ""} × 10¹¹ C/kg` : " (\"측정 기록\"으로 추가)"}`);
    }
    S.$(".rec").addEventListener("click", () => { if (last) rec.push(last); seed = (seed * 13 + 7) % 99991; draw(); });
    S.$(".clear").addEventListener("click", () => { rec = []; draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 밀리컨 자료의 양자화 (03-02) */
  (() => {
    const S = QSim.card("lab-p10-millikan"); if (!S) return;
    const [cvH, cvD] = S.$$("canvas"); let seed = 21;
    function draw() {
      const c = C(), n = S.val("n"), noise = S.val("noise") / 100, nmax = S.val("nmax"), r = rng(seed);
      const q = Array.from({ length: n }, () => { const k = 1 + Math.floor(r() * nmax); return k * (1 + noise * gauss(r)); });   // 단위 e
      const qmax = Math.max(...q) * 1.1, bins = 80;
      const hist = Array(bins).fill(0); q.forEach((x) => { const b = Math.floor(x / qmax * bins); if (b >= 0 && b < bins) hist[b]++; });
      const vh = QSim.view(cvH, 0.38), fh = QSim.frame(vh, { x0: 0, x1: qmax * 1.602, y0: 0, y1: Math.max(...hist) + 1, xl: "q (10⁻¹⁹ C)", yl: "방울 수" }); fh.axes();
      const g = vh.g; hist.forEach((h, i) => { if (!h) return; g.fillStyle = c.main; g.fillRect(fh.X(i * qmax / bins * 1.602), fh.Y(h), fh.sx * qmax / bins * 1.602 - 1, fh.Y(0) - fh.Y(h)); });
      for (let k = 1; k <= nmax + 1; k++) fh.path([[k * 1.602, 0], [k * 1.602, Math.max(...hist) + 1]], c.ink3, 1, [2, 3]);
      const D = (e) => q.reduce((s, x) => { const t = x * 1.602 / e; return s + (t - Math.round(t)) ** 2; }, 0) / q.length;
      const scan = []; for (let i = 0; i <= 600; i++) { const e = 0.5 + 2.5 * i / 600; scan.push([e, D(e)]); }
      const vd = QSim.view(cvD, 0.32), fd = QSim.frame(vd, { x0: 0.5, x1: 3, y0: 0, y1: 0.1, xl: "후보 e' (10⁻¹⁹ C)", yl: "D(e')" }); fd.axes(); fd.path(scan, c.acc, 2);
      // 0.083(균일 분포의 기대값)보다 확실히 작은 극소 중 가장 큰 e'
      let best = null; for (let i = 1; i < scan.length - 1; i++) { const [e, d] = scan[i]; if (d < scan[i - 1][1] && d <= scan[i + 1][1] && d < 0.035) best = e; }
      let eFit = NaN, ns = []; if (best) { ns = q.map((x) => Math.max(1, Math.round(x * 1.602 / best))); eFit = q.reduce((s, x) => s + x * 1.602, 0) / ns.reduce((s, k) => s + k, 0); fd.dot(best, D(best), c.warn, 5); }
      S.out(`방울 ${n}개, 전하 1e~${nmax}e, 상대 측정 오차 ${(noise * 100).toFixed(0)}%. 점선: e의 정수배\n${best ? `D가 작은 극소 중 가장 큰 후보 e' = ${best.toFixed(3)}, 각 방울의 n을 정해 e = Σq/Σn = ${eFit.toFixed(3)} × 10⁻¹⁹ C (정의값 1.602)` : "뚜렷한 극소가 없음: 측정 오차가 커서 양자화를 확인할 수 없음"}\n아래: D(e') = 평균 (q/e' − 가까운 정수)². 무작위라면 약 0.083`);
    }
    S.$(".new").addEventListener("click", () => { seed = (seed * 41 + 3) % 99991; draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 프랑크-헤르츠 곡선 (04-01, 04-02) */
  (() => {
    const S = QSim.card("lab-p10-fh"); if (!S) return;
    const [cvI, cvF] = S.$$("canvas"); let seed = 9;
    function draw() {
      const c = C(), gas = S.val("gas"), T = S.val("T"), Uc = S.val("Uc"), r = rng(seed);
      const E1 = gas === "hg" ? 4.89 : 18.6, Umax = gas === "hg" ? 32 : 85, lam = 0.035 * Math.exp(-(T - 140) / 30);   // λ_m/L: 온도가 높으면 짧아짐 (모형)
      const valleys = []; let u = Uc; for (let n = 1; u < Umax; n++) { u += E1 * (1 + (2 * n - 1) * lam); if (u < Umax) valleys.push(u); }
      const w = gas === "hg" ? 0.35 : 1.4;
      const raw = (U) => {
        if (U <= Uc) return 0;
        let prev = Uc, next = valleys.find((x) => x > U); const before = valleys.filter((x) => x <= U); if (before.length) prev = before[before.length - 1];
        if (next === undefined) next = prev + E1 * (1 + (2 * (before.length + 1) - 1) * lam);
        const ph = (U - prev) / (next - prev), s = ph < 0.82 ? (ph / 0.82) ** 1.4 : 1 - (ph - 0.82) / 0.18 * 0.85;
        return Math.pow(U - Uc, 1.5) * (0.18 + 0.82 * s);
      };
      const M = 900, xs = [], ys = []; for (let i = 0; i <= M; i++) { const U = Umax * i / M; let s = 0, ws = 0; for (let j = -6; j <= 6; j++) { const wt = Math.exp(-((j * 0.5) ** 2) / 2); s += wt * raw(U + j * 0.5 * w); ws += wt; } xs.push(U); ys.push(s / ws); }
      const top = Math.max(...ys); const yn = ys.map((y) => y / top + 0.006 * gauss(r));
      const v = QSim.view(cvI, 0.42), f = QSim.frame(v, { x0: 0, x1: Umax, y0: 0, y1: 1.08, xl: "가속 전압 U (V)", yl: "수집 전류 (상대)" }); f.axes();
      f.path(xs.map((x, i) => [x, yn[i]]), c.main, 2);
      // 골 찾기: 이동 평균 뒤 극소
      const sm = yn.map((_, i) => { let s = 0, k = 0; for (let j = -4; j <= 4; j++) if (yn[i + j] !== undefined) { s += yn[i + j]; k++; } return s / k; });
      // 골: 주변 0.45E₁ 안에서 가장 낮고, 양쪽 봉우리보다 20% 이상 깊은 곳
      const K = Math.round(0.45 * E1 / (Umax / M)), found = [];
      for (let i = K; i < M - K; i++) {
        if (xs[i] < Uc + 0.8 * E1) continue;
        let isMin = true, lmax = 0, rmax = 0;
        for (let j = -K; j <= K; j++) { if (sm[i + j] < sm[i]) { isMin = false; break; } if (j < 0) lmax = Math.max(lmax, sm[i + j]); if (j > 0) rmax = Math.max(rmax, sm[i + j]); }
        if (isMin && lmax - sm[i] > 0.2 * lmax && rmax - sm[i] > 0.2 * rmax && (!found.length || xs[i] - found[found.length - 1] > 0.5 * E1)) found.push(xs[i]);
      }
      found.forEach((x) => f.dot(x, sm[xs.indexOf(x)], c.warn, 4));
      const idx = found.map((_, i) => i + 1), fit = found.length >= 3 ? fitLine(idx, found) : null;
      const sres = fit ? Math.sqrt(found.reduce((s, x, i) => s + (x - fit.a - fit.b * idx[i]) ** 2, 0) / (found.length - 2)) : NaN;
      const gaps = found.slice(1).map((x, i) => x - found[i]);
      const vf = QSim.view(cvF, 0.32), ff = QSim.frame(vf, { x0: 0, x1: Math.max(6, gaps.length + 2), y0: E1 * 0.9, y1: E1 * 1.35, xl: "n (n번째와 n−1번째 골 사이)", yl: "간격 (V)" }); ff.axes();
      gaps.forEach((gp, i) => ff.dot(i + 2, gp, c.acc, 5));
      let ext = NaN; if (gaps.length >= 2) { const gf = fitLine(gaps.map((_, i) => i + 2), gaps); ext = gf.a + gf.b * 0.5; ff.fn((x) => gf.a + gf.b * x, c.acc, 1.2, [4, 3]); ff.path([[0, E1], [20, E1]], c.ink3, 1, [2, 3]); }
      S.out(`${gas === "hg" ? "수은" : "네온"} 관, 관 온도 ${T} °C (평균 자유 거리/가속 거리 ≈ ${lam.toFixed(3)}, 모형), 접촉 전위 ${Uc.toFixed(1)} V. 모형의 들뜸 에너지 ${E1} eV\n찾은 골 ${found.length}개: ${found.map((x) => x.toFixed(1)).join(", ")} V\n${fit ? `골 위치-n 직선: 기울기 ${fit.b.toFixed(2)} ± ${(fit.sb * sres).toFixed(2)} V, 절편 ${fit.a.toFixed(2)} V. 간격을 n = ½로 외삽: ${isNaN(ext) ? "—" : ext.toFixed(2)} V` : "골이 부족함"}`);
    }
    S.$(".new").addEventListener("click", () => { seed = (seed * 23 + 5) % 99991; draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 발머선과 뤼드베리 상수 (05-01, 05-02) */
  (() => {
    const S = QSim.card("lab-p10-rydberg"); if (!S) return;
    const [cvS, cvF] = S.$$("canvas"); let seed = 4;
    const RH = 1.09678e7, lines = [3, 4, 5, 6].map((n) => ({ n, lam: 1 / (RH * (0.25 - 1 / (n * n))) / 1.00028 }));   // 공기 중 파장 (m)
    const cols = { 3: "#d9483b", 4: "#2bb3b1", 5: "#3b5bd8", 6: "#8a5cf5" };
    function draw() {
      const c = C(), N0 = Number(S.val("grating")), d = 1e-3 / N0, ua = S.val("ua") / 60 * deg, r = rng(seed);
      const meas = []; lines.forEach((L) => { for (let m = 1; m <= 3; m++) { const s = m * L.lam / d; if (s >= 0.98) break; const th = Math.asin(s), thR = th + ua * gauss(r); meas.push({ n: L.n, m, th, thR, lam: d * Math.sin(thR) / m }); } });
      const v = QSim.view(cvS, 0.28), f = QSim.frame(v, { x0: 0, x1: 80, y0: 0, y1: 1, xl: "회절각 θ (°)" }); f.axes({ noGrid: true });
      const g = v.g; meas.forEach((q) => { g.strokeStyle = cols[q.n]; g.lineWidth = q.m === 1 ? 3 : 2; g.globalAlpha = q.n === 6 ? 0.5 : 1; g.beginPath(); g.moveTo(f.X(q.th / deg), f.Y(0.1)); g.lineTo(f.X(q.th / deg), f.Y(0.9)); g.stroke(); g.globalAlpha = 1; f.text(`${q.m}`, q.th / deg + 0.4, 0.92, c.ink3); });
      const xs = meas.map((q) => 0.25 - 1 / (q.n * q.n)), ys = meas.map((q) => 1 / q.lam / 1e6), us = meas.map((q) => (d * Math.cos(q.thR) * ua / q.m) / q.lam ** 2 / 1e6);
      const fit0 = (() => { let Sxx = 0, Sxy = 0; xs.forEach((x, i) => { const w = 1 / us[i] ** 2; Sxx += w * x * x; Sxy += w * x * ys[i]; }); return { b: Sxy / Sxx, sb: 1 / Math.sqrt(Sxx) }; })();
      const fit = fitLine(xs, ys, us.map((u) => 1 / u ** 2));
      const chi = xs.reduce((s, x, i) => s + ((ys[i] - fit0.b * x) / us[i]) ** 2, 0);
      const vf = QSim.view(cvF, 0.4), ff = QSim.frame(vf, { x0: 0, x1: 0.25, y0: 0, y1: 2.8, xl: "1/4 − 1/n²", yl: "1/λ (10⁶ m⁻¹)" }); ff.axes();
      ff.fn((x) => fit0.b * x, c.ink3, 1.5, [4, 3]); meas.forEach((q, i) => { ff.path([[xs[i], ys[i] - us[i]], [xs[i], ys[i] + us[i]]], cols[q.n], 1); ff.dot(xs[i], ys[i], cols[q.n], 4); });
      const Rv = fit0.b * 1e6 / 1.00028, z = Math.abs(Rv - RH) / (fit0.sb * 1e6 / 1.00028);
      S.out(`격자 ${N0}선/mm, 각 읽기 불확도 ${S.val("ua")}′. 보이는 선 ${meas.length}개 (색: Hα 빨강, Hβ 청록, Hγ 파랑, Hδ 보라, 숫자는 차수)\n원점 맞춤 기울기 → R_H = ${(Rv / 1e7).toFixed(5)} ± ${(fit0.sb * 1e6 / 1.00028 / 1e7).toFixed(5)} × 10⁷ m⁻¹ (진공 보정 포함), χ²/ν = ${(chi / Math.max(1, meas.length - 1)).toFixed(2)}\n기준 1.09678 × 10⁷ m⁻¹와 차이/불확도 z = ${z.toFixed(1)}. 절편을 자유롭게 둔 맞춤의 절편 ${fit.a.toFixed(4)} ± ${fit.sa.toFixed(4)} (0이어야 함)`);
    }
    S.$(".new").addEventListener("click", () => { seed = (seed * 19 + 11) % 99991; draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 5. 마이컬슨 간섭계 (06-02) */
  (() => {
    const S = QSim.card("lab-p10-michelson"); if (!S) return;
    const [cvR, cvC] = S.$$("canvas");
    function draw() {
      const c = C(), lam = Number(S.val("lam")) * 1e-9, gasMode = S.val("mode") === "gas", L = 0.03;
      const d = S.val("d") * 1e-6, p = S.val("p"), dn = 2.8e-4 * p;
      const d0 = 0.2e-3;   // 기본 팔 길이 차 (고리 크기를 정함)
      const opd = gasMode ? 2 * d0 + 2 * L * (dn - 2.8e-4) : 2 * (d0 + d);   // 기체 모드: 1기압에서 시작해 빼는 경우
      const v = QSim.view(cvR, 1), g = v.g, W = v.W, H = v.H, sz = Math.min(W, H), img = g.createImageData(sz, sz), f0 = 0.05;   // 렌즈 초점 거리 (m)
      for (let y = 0; y < sz; y++) for (let x = 0; x < sz; x++) {
        const rr = Math.hypot(x - sz / 2, y - sz / 2) / sz * 0.012, th = Math.atan(rr / f0);   // 화면 반지름 → 각
        const ph = 2 * Math.PI * (opd * Math.cos(th)) / lam, I = 0.5 * (1 + Math.cos(ph));
        const k = 4 * (y * sz + x), base = lam > 600e-9 ? [235, 60, 50] : lam > 570e-9 ? [250, 190, 40] : [90, 220, 90];
        img.data[k] = base[0] * I; img.data[k + 1] = base[1] * I; img.data[k + 2] = base[2] * I; img.data[k + 3] = 255;
      }
      g.putImageData(img, (W - sz) / 2, 0);
      const vc = QSim.view(cvC, 0.3);
      const xmax = gasMode ? 1 : 30, ff = QSim.frame(vc, { x0: 0, x1: xmax, y0: 0, y1: 1.05, xl: gasMode ? "칸의 기압 p (atm)" : "거울 이동 d (μm)", yl: "가운데 세기" }); ff.axes();
      const Ic = (x) => { const o = gasMode ? 2 * d0 + 2 * L * (2.8e-4 * x - 2.8e-4) : 2 * (d0 + x * 1e-6); return 0.5 * (1 + Math.cos(2 * Math.PI * o / lam)); };
      ff.fn(Ic, c.main, 1.5, null, 1500); ff.dot(gasMode ? p : S.val("d"), Ic(gasMode ? p : S.val("d")), c.warn, 5);
      const Nf = gasMode ? 2 * L * 2.8e-4 * (1 - p) / lam : 2 * d / lam;
      S.out(gasMode
        ? `기체 칸 L = 3.0 cm, 1기압 공기 n − 1 = 2.8 × 10⁻⁴ (모형), 지금 기압 ${p.toFixed(2)} atm, λ = ${(lam * 1e9).toFixed(1)} nm\n1기압에서 지금까지 지나간 무늬 수 N = 2L·Δn/λ = ${Nf.toFixed(2)} (1기압→진공이면 ${(2 * L * 2.8e-4 / lam).toFixed(1)}개)\n무늬 수를 세어 n − 1 = Nλ/(2L(1 − p))로 되돌려 구할 수 있다`
        : `거울 이동 d = ${S.val("d").toFixed(2)} μm, λ = ${(lam * 1e9).toFixed(1)} nm\n가운데를 지나간 무늬 수 N = 2d/λ = ${Nf.toFixed(2)} (정수 부분 ${Math.floor(Nf + 1e-9)}개를 셈)\n세어 둔 N과 d로 λ = 2d/N을 구한다. 고리가 ${d >= 0 ? "가운데에서 생겨나 밖으로 퍼진다(경로차 증가)" : ""}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
