/* 천문우주 체험형 탐구 카드 묶음: 천구 좌표, 활력 방정식과 궤도 모양, 쌍성 시선속도, Saha-Boltzmann, 성간 소광, 측광 신호 대 잡음비,
   회절격자 분해능, 하룻밤 관측 계획, Hohmann 전이, 제한 3체 문제의 영속도 곡선, 프리드만 우주 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const deg = Math.PI / 180;
  const fx = (x, n = 2) => (+x).toFixed(n);
  const ring = (g, cx, cy, r, color, w = 1, dash) => { g.save(); g.strokeStyle = color; g.lineWidth = w; if (dash) g.setLineDash(dash); g.beginPath(); g.arc(cx, cy, r, 0, 2 * Math.PI); g.stroke(); g.restore(); };
  const label = (g, s, x, y, color, align = "center") => { g.save(); g.fillStyle = color; g.font = "12px " + (getComputedStyle(document.documentElement).getPropertyValue("--f-mono") || "monospace"); g.textAlign = align; g.fillText(s, x, y); g.restore(); };
  /* 적도좌표 → 지평좌표. H 시간각(rad), dec 적위, lat 위도. 방위각은 북 0°, 동 90° */
  const altaz = (H, dec, lat) => {
    const sa = Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(H);
    const alt = Math.asin(Math.max(-1, Math.min(1, sa)));
    const az = Math.atan2(-Math.cos(dec) * Math.sin(H), Math.sin(dec) * Math.cos(lat) - Math.cos(dec) * Math.sin(lat) * Math.cos(H));
    return [alt, (az + 2 * Math.PI) % (2 * Math.PI)];
  };
  const airmass = (alt) => (alt <= 0 ? Infinity : 1 / Math.sin(alt));

  /* 1. 천구 좌표에서 지평 좌표로 (천우7-01-02) */
  (() => {
    const S = QSim.card("exp-a7-sky"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), lat = S.val("lat") * deg, ra = S.val("ra"), dec = S.val("dec") * deg, lst = S.val("lst");
      const v = QSim.view(cv, 0.78), g = v.g, W = v.W, H0 = v.H;
      const R = Math.min(W, H0) * 0.44, cx = W / 2, cy = H0 / 2 + 4;
      const P = (alt, az) => { const r = R * (90 - alt / deg) / 90; return [cx - r * Math.sin(az), cy - r * Math.cos(az)]; };   // 위가 북, 왼쪽이 동(하늘을 올려다본 그림)
      g.save(); g.fillStyle = c.soft; g.globalAlpha = 0.25; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill(); g.restore();
      [30, 60].forEach((a) => ring(g, cx, cy, R * (90 - a) / 90, c.ink3, 1, [3, 3]));
      ring(g, cx, cy, R, c.ink, 1.5);
      label(g, "북", cx, cy - R - 6, c.ink); label(g, "남", cx, cy + R + 15, c.ink); label(g, "동", cx - R - 12, cy + 4, c.ink); label(g, "서", cx + R + 12, cy + 4, c.ink);
      label(g, "천정", cx, cy - 6, c.ink3); label(g, "고도 30°", cx + 4, cy + R * 2 / 3 - 4, c.ink3, "left");
      // 천구 적도 (적위 0°)와 천구 북극
      const eq = []; for (let h = -180; h <= 180; h += 2) { const [a, z] = altaz(h * deg, 0, lat); if (a > 0) eq.push(P(a, z)); else eq.push(null); }
      g.save(); g.strokeStyle = c.acc; g.lineWidth = 1.5; g.setLineDash([6, 4]); g.beginPath(); let pen = false;
      eq.forEach((p) => { if (!p) { pen = false; return; } if (pen) g.lineTo(p[0], p[1]); else { g.moveTo(p[0], p[1]); pen = true; } }); g.stroke(); g.restore();
      if (lat > 0) { const [px, py] = P(lat, 0); g.fillStyle = c.acc; g.beginPath(); g.arc(px, py, 4, 0, 7); g.fill(); label(g, "천구 북극", px + 6, py - 6, c.acc, "left"); }
      // 별의 하루 경로
      g.save(); g.strokeStyle = c.main; g.lineWidth = 2; g.beginPath(); pen = false;
      for (let h = -180; h <= 180; h += 1) { const [a, z] = altaz(h * deg, dec, lat); if (a < 0) { pen = false; continue; } const [x, y] = P(a, z); if (pen) g.lineTo(x, y); else { g.moveTo(x, y); pen = true; } }
      g.stroke(); g.restore();
      const Hh = ((lst - ra) % 24 + 36) % 24 - 12, [alt, az] = altaz(Hh * 15 * deg, dec, lat);
      if (alt > 0) { const [x, y] = P(alt, az); g.fillStyle = c.warn; g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); }
      const cosH0 = -Math.tan(lat) * Math.tan(dec);
      const kind = cosH0 <= -1 ? "주극성: 하루 종일 지평선 위" : cosH0 >= 1 ? "이 위도에서는 떠오르지 않음" : `지평선 위에 ${fx(2 * Math.acos(cosH0) / deg / 15, 1)}시간 머묾`;
      const up = 90 - S.val("lat") + S.val("dec"), upTxt = up > 90 ? ` (90°를 넘으므로 천정 북쪽 고도 ${fx(180 - up, 1)}°에서 남중)` : "";
      const side = Math.abs(Hh) < 0.005 ? "지금 남중, 자오선 위" : Hh < 0 ? "아직 남중 전, 동쪽 하늘" : "남중 후, 서쪽 하늘";
      S.out(`시간각 H = 항성시 − 적경 = ${fx(lst, 2)}h − ${fx(ra, 2)}h = ${Hh >= 0 ? "+" : ""}${fx(Hh, 2)}h (${side})\n고도 ${fx(alt / deg, 1)}°, 방위각 ${fx(az / deg, 1)}° (북 0°, 동 90°)${alt > 0 ? `, 대기 질량 ${fx(airmass(alt), 2)}` : ", 지평선 아래"}\n남중 고도 = 90° − 위도 + 적위 = ${fx(up, 1)}°${upTxt}. ${kind}\n주황 점선: 천구 적도. 파란 선: 이 별의 하루 경로. 빨간 점: 지금 위치`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 활력 방정식과 궤도 모양 (천우3-03-02) */
  (() => {
    const S = QSim.card("exp-a3-visviva"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), k = S.val("k"), r0 = 1;   // 길이 단위 r0, 속력 단위 원 궤도 속력 √(GM/r0)
      const eps = k * k / 2 - 1, e = Math.abs(k * k - 1), p = k * k;   // 근점에서 접선 방향 발사: h = k, p = h²/GM
      const v = QSim.view(cv, 0.62), span = Math.min(6, e < 1 ? p / (1 - e) * 1.15 + 0.6 : 6);
      const f = QSim.frame(v, { x0: -span * 1.3, x1: span * 0.9, y0: -span * 0.7, y1: span * 0.7, equal: true }); f.axes({ noGrid: true });
      const g = v.g;
      // 근점이 +x 축에 오도록: r(θ) = p / (1 + e cos θ). 원 궤도(k=1) 기준선
      const circ = []; for (let i = 0; i <= 200; i++) { const t = 2 * Math.PI * i / 200; circ.push([Math.cos(t), Math.sin(t)]); } f.path(circ, c.ink3, 1, [4, 3]);
      const esc = []; for (let i = 0; i <= 400; i++) { const t = -Math.PI + 2 * Math.PI * i / 400, r = 2 / (1 + Math.cos(t)); if (r < 40) esc.push([r * Math.cos(t), r * Math.sin(t)]); } f.path(esc, c.acc, 1, [2, 3]);
      const tmax = e < 1 ? Math.PI : Math.acos(-1 / e) - 1e-3, pts = [];
      for (let i = 0; i <= 600; i++) { const t = -tmax + 2 * tmax * i / 600, r = p / (1 + e * Math.cos(t)); if (r > 0 && r < 60) pts.push([r * Math.cos(t), r * Math.sin(t)]); }
      if (k < 1) { // 근점이 아니라 원점: 발사점이 원지점이 된다 → 그림을 뒤집는다
        pts.forEach((q) => { q[0] = -q[0]; });
      }
      f.path(pts, c.main, 2.5);
      f.dot(0, 0, c.warn, 7); f.dot(1, 0, c.ink, 4); f.arrow(1, 0, 0, 0.6 * k, c.main, "v");
      const a = -1 / (2 * eps), kind = Math.abs(eps) < 1e-9 ? "포물선(탈출 속도와 같음)" : eps < 0 ? (e < 1e-9 ? "원" : "타원") : "쌍곡선";
      const rp = k >= 1 ? 1 : p / (1 + e), ra = eps < 0 ? (k >= 1 ? p / (1 - e) : 1) : Infinity;
      const T = eps < 0 ? Math.pow(a, 1.5) : Infinity;
      S.out(`발사 속력 v = ${fx(k, 3)} × 원 궤도 속력 (탈출 속력은 √2 = 1.414배)\n궤도 에너지 ε = v²/2 − GM/r = ${fx(eps, 3)} (GM/r₀ 단위) → ${kind}, 이심률 e = ${fx(e, 3)}\n${eps < 0 ? `긴반지름 a = −GM/(2ε) = ${fx(a, 3)} r₀, 근점 ${fx(rp, 3)} r₀, 원점 ${fx(ra, 3)} r₀, 주기 = 원 궤도의 ${fx(T, 3)}배` : "닫히지 않는 궤도: 무한히 먼 곳에서 남는 속력² = 2ε = " + fx(2 * eps, 3)}\n회색 점선: 원 궤도(v = 1). 주황 점선: 포물선 궤도(v = √2)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 쌍성의 시선속도 곡선 (천우3-03-03) */
  (() => {
    const S = QSim.card("exp-a3-binary"); if (!S) return;
    const cv = S.$("canvas");
    const G = 6.674e-11, Msun = 1.989e30, day = 86400;
    const solveE = (M, e) => { let E = e < 0.8 ? M : Math.PI; for (let i = 0; i < 60; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); return E; };
    function draw() {
      const c = C(), m1 = S.val("m1"), m2 = S.val("m2"), P = S.val("P"), e = S.val("e"), inc = S.val("i") * deg, w = S.val("w") * deg;
      const Ps = P * day, M = (m1 + m2) * Msun;
      const a = Math.cbrt(G * M * Ps * Ps / (4 * Math.PI * Math.PI));
      const K = (2 * Math.PI * a * Math.sin(inc)) / (Ps * Math.sqrt(1 - e * e)) / 1000;   // 상대 궤도 진폭 km/s
      const K1 = K * m2 / (m1 + m2), K2 = K * m1 / (m1 + m2);
      const vr = (ph, Kx, sgn) => { const E = solveE(2 * Math.PI * ph, e), nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2)); return sgn * Kx * (Math.cos(nu + w) + e * Math.cos(w)); };
      const vmax = Math.max(K1, K2) * (1 + e) * 1.15 + 5;
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: 2, y0: -vmax, y1: vmax, xl: "위상 (주기 단위)", yl: "시선속도 (km/s)" }); f.axes();
      f.fn((x) => vr(x % 1, K1, 1), c.main, 2.5, null, 500);
      f.fn((x) => vr(x % 1, K2, -1), c.warn, 2, [6, 3], 500);
      const fm = (Ps * Math.pow(K2 * 1000, 3) * Math.pow(1 - e * e, 1.5)) / (2 * Math.PI * G) / Msun;   // 별 2의 곡선에서 구한 질량 함수 = m1³ sin³i/(m1+m2)²
      const msin = (Ps * Math.pow((K1 + K2) * 1000, 3) * Math.pow(1 - e * e, 1.5)) / (2 * Math.PI * G) / Msun;
      S.out(`파란 실선: 별 1 (${fx(m1, 1)} M☉), 진폭 K₁ = ${fx(K1, 1)} km/s. 빨간 점선: 별 2 (${fx(m2, 1)} M☉), 진폭 K₂ = ${fx(K2, 1)} km/s\n질량비 m₁/m₂ = K₂/K₁ = ${fx(K2 / K1, 3)} (설정값 ${fx(m1 / m2, 3)}). 상대 궤도 긴반지름 a = ${fx(a / 1.496e11, 3)} AU\n두 곡선에서 얻는 (m₁ + m₂) sin³i = P(K₁ + K₂)³(1 − e²)^1.5 / (2πG) = ${fx(msin, 3)} M☉ (참 질량 합 ${fx(m1 + m2, 2)} M☉ × sin³i = ${fx((m1 + m2) * Math.pow(Math.sin(inc), 3), 3)})\n별 2만 보일 때의 질량 함수 f = m₁³sin³i/(m₁+m₂)² = ${fx(fm, 4)} M☉`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. Saha-Boltzmann: 수소 Balmer 선의 세기와 온도 (천우4-01-01) */
  (() => {
    const S = QSim.card("exp-a4-saha"); if (!S) return;
    const cv = S.$("canvas");
    const k = 1.380649e-23, me = 9.109e-31, h = 6.626e-34, eV = 1.602e-19;
    const frac = (T, Pe) => {   // 전체 수소 가운데 n = 2 준위에 있는 중성 수소 비율
      const ne = Pe / (k * T), Z1 = 2, Z2 = 1, chi = 13.6 * eV;
      const r = (2 * Z2 / (ne * Z1)) * Math.pow(2 * Math.PI * me * k * T / (h * h), 1.5) * Math.exp(-chi / (k * T));   // N_II / N_I
      const b = 4 * Math.exp(-10.2 * eV / (k * T));   // N₂ / N₁
      return { n2: (b / (1 + b)) * (1 / (1 + r)), ion: r / (1 + r), b };
    };
    function draw() {
      const c = C(), T = S.val("T"), Pe = Math.pow(10, S.val("lp"));
      let best = 0, Tb = 0; const arr = [];
      for (let t = 4000; t <= 25000; t += 20) { const q = frac(t, Pe).n2; arr.push([t, q]); if (q > best) { best = q; Tb = t; } }
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 4000, x1: 25000, y0: 0, y1: 1.1, xl: "표면 온도 (K)", yl: "n=2 비율 (봉우리 = 1)" }); f.axes();
      f.path(arr.map(([t, q]) => [t, q / best]), c.main, 2.5);
      f.fn((t) => frac(t, Pe).ion, c.acc, 1.4, [5, 3], 300);
      const q = frac(T, Pe); f.dot(T, q.n2 / best, c.warn, 6);
      [["O", 30000], ["B", 10000], ["A", 7500], ["F", 6000], ["G", 5200], ["K", 3700]].forEach(([s, t], i, A) => { const t1 = i ? A[i - 1][1] : 25000; if (t < 25000) f.text(s, (Math.min(t1, 25000) + t) / 2, 1.04, c.ink3, "center"); });
      S.out(`온도 ${T} K, 전자 압력 P_e = ${fx(Pe, 1)} N/m²\n들뜬 비율 N₂/N₁ = 4 e^(−10.2 eV/kT) = ${q.b.toExponential(2)}, 이온화 비율 N_II/N = ${fx(q.ion, 4)}\n전체 수소 중 n = 2 준위의 중성 수소 = ${q.n2.toExponential(2)}\nBalmer 흡수선이 가장 강한 온도: ${Tb} K (이 전자 압력에서). 주황 점선은 이온화된 비율`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 5. 성간 소광과 적색화 (천우4-03-01) */
  (() => {
    const S = QSim.card("exp-a4-extinction"); if (!S) return;
    const cv = S.$("canvas");
    // 주계열 어림 (B−V)₀ → M_V (Allen 표에 가까운 값을 잇는 선)
    const MS = [[-0.30, -4.0], [-0.20, -1.6], [0.0, 0.6], [0.15, 1.9], [0.30, 2.7], [0.44, 3.5], [0.58, 4.4], [0.65, 4.8], [0.81, 5.9], [1.15, 7.4], [1.40, 8.8], [1.60, 12.0]];
    function draw() {
      const c = C(), d = Math.pow(10, S.val("ld")), Av = S.val("av"), Rv = S.val("rv"), Ebv = Av / Rv, mu = 5 * Math.log10(d / 10);
      const v = QSim.view(cv, 0.62), f = QSim.frame(v, { x0: -0.5, x1: 2.6, y0: -(mu + Av + 13.5), y1: -(mu - 5.5), xl: "색지수 B − V", yl: "겉보기 등급 V (위가 밝음)" }); f.axes();
      f.path(MS.map(([bv, M]) => [bv, -(M + mu)]), c.ink3, 1.5, [5, 3]);
      f.path(MS.map(([bv, M]) => [bv + Ebv, -(M + mu + Av)]), c.main, 2.5);
      const bv0 = S.val("bv"), Ms = MS.reduce((acc, [x, y], i, A) => (i && x >= bv0 && A[i - 1][0] <= bv0 ? A[i - 1][1] + (y - A[i - 1][1]) * (bv0 - A[i - 1][0]) / (x - A[i - 1][0]) : acc), 0);
      f.dot(bv0, -(Ms + mu), c.ink3, 5); f.dot(bv0 + Ebv, -(Ms + mu + Av), c.warn, 6);
      if (Av > 0.05) f.arrow(bv0, -(Ms + mu), Ebv, -Av, c.warn, "소광");
      const m = Ms + mu + Av, dwrong = d * Math.pow(10, Av / 5);
      S.out(`거리 ${fx(d, 0)} pc → 거리 지수 m − M = 5 log(d/10) = ${fx(mu, 2)}\n소광 A_V = ${fx(Av, 2)}, R_V = ${fx(Rv, 1)} → 색초과 E(B − V) = A_V / R_V = ${fx(Ebv, 3)}\n고른 별: (B − V)₀ = ${fx(bv0, 2)}, M_V = ${fx(Ms, 2)} → 관측 V = ${fx(m, 2)}, 관측 B − V = ${fx(bv0 + Ebv, 2)}\n소광을 모르고 거리 지수만 쓰면 거리 ${fx(dwrong, 0)} pc로 ${fx(dwrong / d, 2)}배 멀게 잡는다\n회색 점선: 소광이 없을 때의 주계열, 파란 선: 소광된 주계열`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 6. 측광의 신호 대 잡음비 (천우7-04-03) */
  (() => {
    const S = QSim.card("exp-a7-snr"); if (!S) return;
    const cv = S.$("canvas");
    const F0 = 1.0e6;   // V = 0 별의 검출 광자 수 (광자/s/cm²), 대역폭과 효율 0.4를 넣은 어림값
    function draw() {
      const c = C(), V = S.val("V"), sky = S.val("sky"), D = S.val("D"), t = S.val("t"), RN = S.val("rn"), see = S.val("see");
      const A = Math.PI * Math.pow(D * 100 / 2, 2) * 0.85;   // 구경(m) → cm², 부경 가림 15%
      const Ns = F0 * Math.pow(10, -0.4 * V) * A, Nsky = F0 * Math.pow(10, -0.4 * sky) * A;   // 별 (e⁻/s), 하늘 (e⁻/s/arcsec²)
      const rap = see, pix = 0.5, npix = Math.PI * rap * rap / (pix * pix), skyPix = Nsky * pix * pix, dark = 0.01;
      const snr = (tt) => Ns * tt / Math.sqrt(Ns * tt + npix * (skyPix * tt + dark * tt + RN * RN));
      const v = QSim.view(cv, 0.52), f = QSim.frame(v, { x0: -1, x1: 4, y0: -1, y1: 4, xl: "log 노출 시간 (s)", yl: "log S/N" }); f.axes();
      f.fn((x) => Math.log10(snr(Math.pow(10, x))), c.main, 2.5);
      f.fn((x) => Math.log10(Math.sqrt(Ns * Math.pow(10, x))), c.ink3, 1, [4, 3]);
      f.path([[-1, Math.log10(5)], [4, Math.log10(5)]], c.acc, 1, [2, 3]); f.text("S/N = 5", 3.2, Math.log10(5) + 0.08, c.acc);
      f.dot(Math.log10(t), Math.log10(snr(t)), c.warn, 6);
      const star = Ns * t, bg = npix * skyPix * t, rd = npix * RN * RN;
      const big = star > bg && star > rd ? "별빛 잡음이 지배: S/N ∝ √t" : bg > rd ? "하늘 배경 잡음이 지배: S/N ∝ √t" : "읽기 잡음이 지배: S/N ∝ t";
      const sig = 1.0857 / snr(t);
      S.out(`별 ${fx(Ns, 0)} e⁻/s, 하늘 ${fx(skyPix, 1)} e⁻/s/화소, 구경 반지름 ${fx(rap, 1)}″ 안의 화소 ${fx(npix, 0)}개\n노출 ${t} s: 별 ${fx(star, 0)} e⁻, 하늘 ${fx(bg, 0)} e⁻, 읽기 잡음² 합 ${fx(rd, 0)} e⁻ → S/N = ${fx(snr(t), 1)}, 등급 오차 ≈ 1.0857/(S/N) = ${fx(sig, 3)} 등급\n${big}. 노출을 4배로 늘리면 S/N은 ${fx(snr(4 * t) / snr(t), 2)}배\n회색 점선: 잡음이 별빛뿐일 때의 한계`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 7. 회절격자의 분해능: 나트륨 D선 가르기 (천우7-05-01) */
  (() => {
    const S = QSim.card("exp-a7-grating"); if (!S) return;
    const cv = S.$("canvas");
    const L1 = 588.995, L2 = 589.592;   // nm
    function draw() {
      const c = C(), lpm = S.val("lpm"), wmm = S.val("w"), m = S.val("m");
      const d = 1e6 / lpm, N = lpm * wmm, R = m * N, dl = 589.3 / R;   // d (nm)
      const s = (m * 589.3) / d, exists = s < 1;
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 588.0, x1: 590.6, y0: 0, y1: 1.25, xl: "파장 (nm)", yl: "세기" }); f.axes();
      const sinc2 = (x) => (Math.abs(x) < 1e-9 ? 1 : Math.pow(Math.sin(Math.PI * x) / (Math.PI * x), 2));
      if (exists) {
        f.fn((l) => sinc2((l - L1) / dl) + sinc2((l - L2) / dl), c.main, 2.5, null, 1200);
        f.fn((l) => sinc2((l - L1) / dl), c.ink3, 1, [3, 3], 800); f.fn((l) => sinc2((l - L2) / dl), c.ink3, 1, [3, 3], 800);
      }
      const ok = dl <= L2 - L1, beta = exists ? Math.asin(s) : NaN, disp = exists ? m / (d * Math.cos(beta)) / deg : NaN;   // °/nm
      S.out(exists ? `격자 간격 d = ${fx(d, 0)} nm, 비춘 홈 수 N = ${fx(N, 0)}, 차수 m = ${m}\n분해능 R = mN = ${fx(R, 0)} → 가를 수 있는 가장 작은 파장 차 Δλ = λ/R = ${fx(dl, 3)} nm (D선 간격 0.597 nm, R ≥ 987 필요)\n${ok ? "두 선이 갈라진다(Rayleigh 기준 만족)" : "두 선이 하나로 보인다"}. 회절각 β = ${fx(beta / deg, 2)}°, 각분산 dβ/dλ = ${fx(disp * 60, 2)}′/nm` : `차수 ${m}: mλ/d = ${fx(s, 2)} > 1이라 이 차수의 빛은 나오지 않는다. 차수를 낮추거나 홈 밀도를 줄이세요.`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 8. 하룻밤 관측 계획 (천우7-07-01) */
  (() => {
    const S = QSim.card("exp-a7-plan"); if (!S) return;
    const cv = S.$("canvas"), eps = 23.44 * deg;
    const eqOf = (lam) => [Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam)), Math.asin(Math.sin(eps) * Math.sin(lam))];   // 황경 → (적경, 적위), 황위 0
    function draw() {
      const c = C(), lat = S.val("lat") * deg, N = S.val("day"), ra = S.val("ra"), dec = S.val("dec") * deg, age = S.val("age");
      const lamS = (360 * (N - 80) / 365.25) * deg, [raS, decS] = eqOf(lamS);
      const lamM = lamS + (360 * age / 29.53) * deg, [raM, decM] = eqOf(lamM);
      const lst0 = (6.6 + 0.06571 * N) % 24;   // 지방시 자정(표준 자오선에 있다고 가정)의 지방 항성시
      const at = (tl, raH, d) => { const lst = lst0 + tl * 1.00274; return altaz(((lst - raH) * 15) * deg, d, lat)[0] / deg; };   // tl: 자정에서 잰 시간(h)
      const raSh = ((raS / deg / 15) + 24) % 24, raMh = ((raM / deg / 15) + 24) % 24;
      const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: -7, x1: 7, y0: -30, y1: 90, xl: "지방시 (자정 = 0)", yl: "고도 (°)" });
      const g = v.g; let dark = 0, good = 0, best = -99, tb = 0;
      for (let tl = -7; tl < 7; tl += 0.05) {
        const sa = at(tl, raSh, decS), ta = at(tl, ra, dec);
        g.fillStyle = sa > 0 ? "#f2d27a" : sa > -18 ? "#9aa6c8" : "#2b3150"; g.globalAlpha = sa > 0 ? 0.25 : sa > -18 ? 0.25 : 0.18;
        g.fillRect(f.X(tl), f.Y(90), f.X(tl + 0.05) - f.X(tl) + 0.5, f.Y(-30) - f.Y(90)); g.globalAlpha = 1;
        if (sa < -18) { dark += 0.05; if (ta > 30) good += 0.05; if (ta > best) { best = ta; tb = tl; } }
      }
      f.axes();
      f.path([[-7, 30], [7, 30]], c.acc, 1, [3, 3]); f.text("고도 30° (대기 질량 2)", -6.8, 32, c.acc);
      f.fn((tl) => at(tl, ra, dec), c.main, 2.5);
      f.fn((tl) => at(tl, raMh, decM), c.ink3, 1.5, [6, 3]);
      f.fn((tl) => at(tl, raSh, decS), c.warn, 1.2);
      const Hm = ((raMh - ra) * 15) * deg, sep = Math.acos(Math.sin(decM) * Math.sin(dec) + Math.cos(decM) * Math.cos(dec) * Math.cos(Hm)) / deg;
      const phase = (1 - Math.cos(2 * Math.PI * age / 29.53)) / 2;
      const hh = (x) => { const m = ((Math.round(x * 60) % 1440) + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; };
      S.out(`1월 1일부터 ${N}일째: 태양 적경 ${fx(raSh, 2)}h, 적위 ${fx(decS / deg, 1)}°. 자정의 지방 항성시 ${fx(lst0, 2)}h\n천문 박명이 끝난 어두운 시간 ${fx(dark, 1)}시간, 그중 대상이 고도 30° 위에 있는 시간 ${fx(good, 1)}시간\n${best > -90 ? `어두운 시간 중 가장 높을 때 ${hh(tb)} (고도 ${fx(best, 1)}°, 대기 질량 ${fx(airmass(best * deg), 2)})` : "어두운 시간이 없음"}\n달: 월령 ${age}일, 밝은 부분 ${fx(phase * 100, 0)}%, 대상과의 각거리 ${fx(sep, 0)}°${phase > 0.5 && sep < 40 ? " (밝은 달이 가까워 배경이 밝음)" : ""}\n파란 선: 대상, 빨간 선: 태양, 회색 점선: 달. 짙은 띠: 천문 박명 뒤의 밤`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 9. Hohmann 전이 (천우11-01-01) */
  (() => {
    const S = QSim.card("exp-a11-hohmann"); if (!S) return;
    const cv = S.$("canvas"), mu = 398600.4418, Re = 6378.137;
    function draw() {
      const c = C(), h1 = S.val("h1"), h2 = Math.pow(10, S.val("lh2")), ph = S.val("ph");
      const r1 = Re + h1, r2 = Re + h2, at = (r1 + r2) / 2;
      const v1 = Math.sqrt(mu / r1), v2 = Math.sqrt(mu / r2), vp = Math.sqrt(mu * (2 / r1 - 1 / at)), va = Math.sqrt(mu * (2 / r2 - 1 / at));
      const dv1 = vp - v1, dv2 = v2 - va, tof = Math.PI * Math.sqrt(at * at * at / mu);
      const sc = r2 * 1.12, v = QSim.view(cv, 0.62), f = QSim.frame(v, { x0: -sc, x1: sc, y0: -sc * 0.62, y1: sc * 0.62, equal: true });
      const circle = (r) => { const p = []; for (let i = 0; i <= 240; i++) { const t = 2 * Math.PI * i / 240; p.push([r * Math.cos(t), r * Math.sin(t)]); } return p; };
      f.path(circle(Re), c.ink3, 1); f.path(circle(r1), c.main, 2); f.path(circle(r2), c.acc, 2);
      const e = (r2 - r1) / (r2 + r1), ell = []; for (let i = 0; i <= 200; i++) { const nu = Math.PI * i / 200, r = at * (1 - e * e) / (1 + e * Math.cos(nu)); ell.push([r * Math.cos(nu), r * Math.sin(nu)]); }
      f.path(ell, c.warn, 2.5, [6, 3]);
      // 전이 궤도 위 위치: 시간 비율 ph → 평균 근점 이각 M = π ph
      const M = Math.PI * ph; let E = M; for (let i = 0; i < 40; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
      f.dot(at * (Math.cos(E) - e), at * Math.sqrt(1 - e * e) * Math.sin(E), c.warn, 6);
      f.dot(0, 0, c.ink3, 4);
      const rocket = (dv, isp) => 1 - Math.exp(-dv * 1000 / (isp * 9.80665));
      S.out(`출발 원 궤도 고도 ${fx(h1, 0)} km (속력 ${fx(v1, 3)} km/s) → 도착 원 궤도 고도 ${fx(h2, 0)} km (속력 ${fx(v2, 3)} km/s)\n전이 궤도: 긴반지름 ${fx(at, 0)} km, 이심률 ${fx(e, 3)}, 근지점 속력 ${fx(vp, 3)}, 원지점 속력 ${fx(va, 3)} km/s\nΔv₁ = ${fx(dv1, 3)} km/s, Δv₂ = ${fx(dv2, 3)} km/s, 합 ${fx(dv1 + dv2, 3)} km/s. 비행 시간 ${fx(tof / 3600, 2)}시간\n비추력 300 s 엔진이면 처음 질량의 ${fx(rocket(dv1 + dv2, 300) * 100, 1)}%가 추진제 (로켓 방정식)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 10. 원형 제한 3체 문제의 영속도 곡선 (천우8-04-02) */
  (() => {
    const S = QSim.card("exp-a8-zvc"); if (!S) return;
    const cv = S.$("canvas");
    const Om2 = (x, y, mu) => { const r1 = Math.hypot(x + mu, y), r2 = Math.hypot(x - 1 + mu, y); return x * x + y * y + 2 * (1 - mu) / r1 + 2 * mu / r2; };   // 2Ω
    const dOm = (x, mu) => { const r1 = Math.abs(x + mu), r2 = Math.abs(x - 1 + mu); return x - (1 - mu) * (x + mu) / (r1 * r1 * r1) - mu * (x - 1 + mu) / (r2 * r2 * r2); };
    const root = (a, b, mu) => { for (let i = 0; i < 100; i++) { const m = (a + b) / 2; if (dOm(a, mu) * dOm(m, mu) <= 0) b = m; else a = m; } return (a + b) / 2; };
    function draw() {
      const c = C(), mu = Math.pow(10, S.val("lmu")), C0 = S.val("cj");
      const L1 = root(-mu + 1e-6, 1 - mu - 1e-6, mu), L2 = root(1 - mu + 1e-6, 2, mu), L3 = root(-2, -mu - 1e-6, mu);
      const L4 = [0.5 - mu, Math.sqrt(3) / 2];
      const CL = [Om2(L1, 0, mu), Om2(L2, 0, mu), Om2(L3, 0, mu), Om2(L4[0], L4[1], mu)];
      const v = QSim.view(cv, 0.8), f = QSim.frame(v, { x0: -1.6, x1: 1.6, y0: -1.3, y1: 1.3, equal: true, pad: 6 });
      const g = v.g, n = Math.round(v.W / 3);
      g.fillStyle = c.ink3; g.globalAlpha = 0.35;
      for (let i = 0; i < n; i++) for (let j = 0; j < n * 0.8; j++) {
        const x = -1.6 + 3.2 * (i + 0.5) / n, y = -1.3 + 2.6 * (j + 0.5) / (n * 0.8);
        if (Om2(x, y, mu) < C0) g.fillRect(f.X(x) - 1.6, f.Y(y) - 1.6, 3.4, 3.4);
      }
      g.globalAlpha = 1;
      f.dot(-mu, 0, c.acc, 8); f.dot(1 - mu, 0, c.main, 5);
      [[L1, 0, "L1"], [L2, 0, "L2"], [L3, 0, "L3"], [L4[0], L4[1], "L4"], [L4[0], -L4[1], "L5"]].forEach(([x, y, s]) => { f.dot(x, y, c.warn, 3.5); f.text(s, x + 0.04, y + 0.05, c.warn); });
      const open = C0 > CL[0] ? "L1 목이 닫혀 있다: 작은 천체 근처에 있던 물체는 그 영역을 벗어날 수 없다" : C0 > CL[1] ? "L1 목이 열렸다: 두 천체 사이를 오갈 수 있지만 바깥으로는 못 나간다" : C0 > CL[2] ? "L2 쪽이 열렸다: 작은 천체 뒤쪽으로 계 밖으로 나갈 수 있다" : C0 > CL[3] ? "L3 쪽도 열렸다: 금지 구역은 L4·L5 주변에만 남는다" : "금지 구역이 사라졌다: 어디든 갈 수 있다";
      S.out(`질량비 μ = ${mu.toPrecision(3)} (지구-달 0.0121, 태양-목성 0.000954)\nL1 x = ${fx(L1, 4)}, L2 x = ${fx(L2, 4)}, L3 x = ${fx(L3, 4)} (두 천체 거리 = 1)\n각 점의 Jacobi 상수 C: L1 ${fx(CL[0], 4)}, L2 ${fx(CL[1], 4)}, L3 ${fx(CL[2], 4)}, L4·L5 ${fx(CL[3], 4)}\n지금 C = ${fx(C0, 3)}: ${open}\n회색: 물체가 들어갈 수 없는 구역(2Ω < C)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 11. 프리드만 우주: 척도 인자의 역사 (천우4-06-01) */
  (() => {
    const S = QSim.card("exp-a4-friedmann"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), Om = S.val("om"), OL = S.val("ol"), H0 = S.val("h0"), Or = 9e-5, Ok = 1 - Om - OL - Or;
      const tH = 977.8 / H0;   // Gyr
      const E2 = (a) => Or / (a * a * a * a) + Om / (a * a * a) + Ok / (a * a) + OL;
      // 오늘(a=1)에서 과거와 미래로 da/dt = H0 a √E 를 적분 (시간 단위 Gyr)
      // 팽창률이 0이 되는 곳(E² ≤ 0)에서 멈춘다. 미래 쪽은 그 뒤 대칭으로 되돌아오는 수축을 붙인다
      const run = (dir) => { const pts = []; let a = 1, t = 0; const h = 0.005 * tH * dir; for (let i = 0; i < 6000; i++) { const e2 = E2(a); if (e2 <= 0) break; pts.push([t, a]); a += a * Math.sqrt(e2) / tH * h; t += h; if (a <= 1e-3 || a > 6 || Math.abs(t) > 60) break; } return pts; };
      const past = run(-1), fut = run(1);
      if (fut.length && E2(fut[fut.length - 1][1] * 1.0005) <= 0) { const [tm] = fut[fut.length - 1]; for (let i = fut.length - 1; i >= 0 && 2 * tm - fut[i][0] < 60; i--) fut.push([2 * tm - fut[i][0], fut[i][1]]); }
      // 나이: ∫₀¹ da / (a H(a))
      let age = 0; const n = 4000; for (let i = 1; i <= n; i++) { const a = i / n; const e2 = E2(a); if (e2 <= 0) { age = NaN; break; } age += (1 / n) / (a * Math.sqrt(e2)); } age *= tH;
      const q0 = Or + Om / 2 - OL;
      const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: -20, x1: 30, y0: 0, y1: 3, xl: "오늘부터의 시간 (Gyr)", yl: "척도 인자 a" }); f.axes();
      f.path([[-tH, 0], [0, 1], [30, 1 + 30 / tH]], c.ink3, 1, [4, 3]);
      f.path(past, c.main, 2.5); f.path(fut, c.main, 2.5); f.dot(0, 1, c.warn, 6);
      const geo = Math.abs(Ok) < 0.005 ? "평탄" : Ok > 0 ? "열린(음의 곡률)" : "닫힌(양의 곡률)";
      S.out(`Ω_m = ${fx(Om, 2)}, Ω_Λ = ${fx(OL, 2)}, Ω_k = 1 − Ω_m − Ω_Λ = ${fx(Math.abs(Ok) < 0.005 ? 0 : Ok, 2)} → ${geo} 우주\n허블 시간 1/H₀ = ${fx(tH, 2)} Gyr, 우주의 나이 = ${isNaN(age) ? "빅뱅 없이 과거에 수축했다 다시 팽창(되튐)" : fx(age, 2) + " Gyr"}\n감속 매개변수 q₀ = Ω_m/2 − Ω_Λ = ${fx(q0, 3)} → 지금 팽창이 ${q0 < 0 ? "가속" : "감속"}되고 있다\n회색 점선: 팽창 속도가 일정할 때(빈 우주). 빨간 점: 오늘`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 12. 은하의 차등 회전과 Oort 상수 (천우4-04-01) */
  (() => {
    const S = QSim.card("exp-a4-oort"); if (!S) return;
    const cv = S.$("canvas"), R0 = 8.2, T0 = 223, W0 = T0 / R0;
    const law = { flat: (R) => T0, solid: (R) => T0 * R / R0, kep: (R) => T0 * Math.sqrt(R0 / R) };
    const AB = { flat: [W0 / 2, -W0 / 2], solid: [0, -W0], kep: [0.75 * W0, -0.25 * W0] };
    const NAME = { flat: "평평한 회전 곡선 (Θ 일정)", solid: "강체 회전 (Θ ∝ R)", kep: "케플러 회전 (Θ ∝ R^−1/2)" };
    function vrel(key, d, l) {   // 은경 l(rad), 거리 d(kpc)인 별의 태양 기준 상대 속도와 시선 성분
      const ux = -Math.cos(l), uy = Math.sin(l), x = R0 + d * ux, y = d * uy, R = Math.hypot(x, y), th = law[key](R);
      const vx = -y / R * th, vy = x / R * th - T0; return [vx, vy, vx * ux + vy * uy];
    }
    function draw() {
      const c = C(), key = S.val("law"), d = S.val("d"), v = QSim.view(cv, 0.55), g = v.g, half = v.W * 0.45;
      const f1 = QSim.frame({ g, W: half, H: v.H, cv }, { x0: R0 - 5, x1: R0 + 5, y0: -5, y1: 5, equal: true, pad: 6 });
      const ring = (r) => { const pts = []; for (let i = 0; i <= 120; i++) { const t = 2 * Math.PI * i / 120; pts.push([R0 + r * Math.cos(t), r * Math.sin(t)]); } return pts; };
      f1.path(ring(d), c.ink3, 1, [3, 3]);
      const arc = []; for (let i = -40; i <= 40; i++) { const t = i / 40 * 0.6; arc.push([R0 * Math.cos(t), R0 * Math.sin(t)]); } f1.path(arc, c.acc, 1, [5, 3]);
      f1.dot(R0, 0, c.warn, 5); f1.text("태양", R0 + 0.2, -0.5, c.warn); f1.text("← 은하 중심", R0 - 4.9, 0.3, c.ink3);
      const sc = 0.04;   // km/s → kpc (그림용 화살표 길이)
      for (let k = 0; k < 16; k++) { const l = 2 * Math.PI * k / 16, [vx, vy] = vrel(key, d, l); const x = R0 - d * Math.cos(l), y = d * Math.sin(l); f1.dot(x, y, c.main, 3); f1.arrow(x, y, vx * sc, vy * sc, c.main); }
      g.save(); g.translate(half, 0);
      const ymax = Math.max(10, ...Array.from({ length: 73 }, (_, i) => Math.abs(vrel(key, d, i * 5 * Math.PI / 180)[2]))) * 1.15;
      const f2 = QSim.frame({ g, W: v.W - half, H: v.H, cv }, { x0: 0, x1: 360, y0: -ymax, y1: ymax, xl: "은경 l (°)", yl: "시선속도 (km/s)" }); f2.axes();
      f2.fn((L) => vrel(key, d, L * Math.PI / 180)[2], c.main, 2.5, null, 360);
      f2.fn((L) => AB[key][0] * d * Math.sin(2 * L * Math.PI / 180), c.warn, 1.5, [5, 3], 360);
      g.restore();
      const [A, B] = AB[key], ex45 = vrel(key, d, Math.PI / 4)[2];
      S.out(`${NAME[key]}, 태양 R₀ = 8.2 kpc, Θ₀ = 223 km/s → Ω₀ = ${fx(W0, 1)} km/s/kpc\nOort 상수 A = ${fx(A, 1)}, B = ${fx(B, 1)} km/s/kpc (관측값 A ≈ 15.3, B ≈ −11.9)\n은경 45°, 거리 ${fx(d, 1)} kpc 별의 시선속도: 정확한 값 ${fx(ex45, 1)} km/s, Oort 근사 A d sin 2l = ${fx(A * d, 1)} km/s\n파란 화살표: 태양에서 본 이웃 별의 상대 속도(왼쪽 그림). 오른쪽 파란 선: 정확한 시선속도, 빨간 점선: Oort 근사`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 13. HII 영역의 Strömgren 구 (천우4-03-02) */
  (() => {
    const S = QSim.card("exp-a4-strom"); if (!S) return;
    const cv = S.$("canvas"), aB = 2.6e-19, pc = 3.086e16, mH = 1.673e-27, Ms = 1.989e30, yr = 3.156e7;
    function draw() {
      const c = C(), Q = Math.pow(10, S.val("lq")), n = Math.pow(10, S.val("ln")), R = Math.cbrt(3 * Q / (4 * Math.PI * aB * n * n)), Rpc = R / pc;
      const span = Math.pow(10, Math.ceil(Math.log10(Rpc * 1.2))), v = QSim.view(cv, 0.6);
      const f = QSim.frame(v, { x0: -span, x1: span, y0: -span * 0.6, y1: span * 0.6, equal: true, xl: "pc", pad: 22 }); f.axes();
      const g = v.g; g.save(); g.fillStyle = "#d9483b"; g.globalAlpha = 0.25; g.beginPath(); g.arc(f.X(0), f.Y(0), Rpc * f.sx, 0, 7); g.fill(); g.restore();
      const circ = []; for (let i = 0; i <= 120; i++) { const t = 2 * Math.PI * i / 120; circ.push([Rpc * Math.cos(t), Rpc * Math.sin(t)]); } f.path(circ, c.warn, 2);
      f.dot(0, 0, c.main, 5);
      const M = 4 / 3 * Math.PI * R * R * R * n * mH / Ms, trec = 1 / (n * aB) / yr;
      S.out(`전리 광자 Q = ${Q.toExponential(1)} s⁻¹ (O7 V 별 약 10⁴⁹, B0 V 약 10⁴⁸), 수소 수 밀도 n = ${n.toExponential(1)} m⁻³ (${(n / 1e6).toPrecision(2)} cm⁻³)\nStrömgren 반지름 R_S = (3Q / 4π α_B n²)^1/3 = ${Rpc.toPrecision(3)} pc\n전리된 수소의 질량 ${M.toPrecision(3)} 태양 질량, 재결합 시간 1/(n α_B) = ${trec.toPrecision(3)} 년\n빨간 원: 전리된 영역(HII), 바깥: 중성 수소. 축 눈금 단위 pc`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
