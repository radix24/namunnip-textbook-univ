/* 물리12 실습 카드 묶음: x⁴ 섭동, 변분법, WKB 준위, 라비 진동, 딱딱한 공의 부분파 */
(() => {
  "use strict";
  const C = () => QSim.col();
  // ħ = m = 1. 유한 차분 해밀토니언(대칭 삼중대각)의 k번째 고윳값을 스투름 수열 이분법으로 구한다
  function eig(V, x0, x1, N, k) {
    const h = (x1 - x0) / (N + 1), d = [], e = -0.5 / (h * h);
    for (let i = 1; i <= N; i++) d.push(1 / (h * h) + V(x0 + i * h));
    const count = (lam) => { let q = d[0] - lam, c = q < 0 ? 1 : 0; for (let i = 1; i < N; i++) { q = d[i] - lam - (e * e) / (Math.abs(q) < 1e-300 ? 1e-300 : q); if (q < 0) c++; } return c; };
    let lo = Math.min(...d) - 2 * Math.abs(e), hi = Math.max(...d) + 2 * Math.abs(e);
    hi = Math.min(hi, 400);
    for (let it = 0; it < 60; it++) { const m = (lo + hi) / 2; if (count(m) > k) hi = m; else lo = m; }
    return (lo + hi) / 2;
  }

  /* 1. 조화 진동자 + λx⁴: 섭동과 정확한 값 (02-01) */
  (() => {
    const S = QSim.card("lab-p12-perturb"); if (!S) return;
    const cv = S.$("canvas"); const cache = {};
    const exact = (lam, n) => { const key = lam.toFixed(4) + ":" + n; if (!(key in cache)) cache[key] = eig((x) => 0.5 * x * x + lam * x ** 4, -7, 7, 700, n); return cache[key]; };
    function draw() {
      const c = C(), lam = S.val("lam"), n = S.val("n");
      const e1 = (6 * n * n + 6 * n + 3) / 4, e2 = n === 0 ? -21 / 8 : -(34 * n ** 3 + 51 * n * n + 59 * n + 21) / 8;
      const yTop = exact(0.5, n) * 1.12 + 0.1, v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: 0.5, y0: n + 0.4, y1: yTop, xl: "λ", yl: `E_${n}` }); f.axes();
      const pts = []; for (let i = 0; i <= 20; i++) { const l = 0.5 * i / 20; pts.push([l, exact(l, n)]); } f.path(pts, c.main, 2.5);
      const clip = (y) => (y > yTop || y < n + 0.4 ? NaN : y);
      f.fn((l) => clip(n + 0.5 + e1 * l), c.acc, 1.5, [5, 3]); f.fn((l) => clip(n + 0.5 + e1 * l + e2 * l * l), c.warn, 1.5, [2, 3]);
      const E = exact(lam, n), p1 = n + 0.5 + e1 * lam, p2 = p1 + e2 * lam * lam; f.dot(lam, E, c.main, 5);
      S.out(`ħ = m = ω = 1, H = p²/2 + x²/2 + λx⁴, n = ${n}, λ = ${lam.toFixed(3)}\n정확한 값(수치) E = ${E.toFixed(5)}, 1차 섭동 ${p1.toFixed(5)} (오차 ${(p1 - E).toFixed(5)}), 2차 섭동 ${p2.toFixed(5)} (오차 ${(p2 - E).toFixed(5)})\n1차 계수 ${e1.toFixed(3)}, 2차 계수 ${e2.toFixed(3)}. 파랑: 정확, 주황 점선: 1차, 빨간 점선: 2차`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 변분법: 가우스 시험 함수 (03-01) */
  (() => {
    const S = QSim.card("lab-p12-variation"); if (!S) return;
    const cv = S.$("canvas");
    const P = {
      ho: { name: "조화 진동자 x²/2", H: (b) => b / 2 + 1 / (8 * b), ex: () => 0.5 },
      x4: { name: "V = x⁴", H: (b) => b / 2 + 3 / (16 * b * b), ex: () => eig((x) => x ** 4, -5, 5, 800, 0) },
      abs: { name: "V = |x|", H: (b) => b / 2 + 1 / Math.sqrt(2 * Math.PI * b), ex: () => eig((x) => Math.abs(x), -9, 9, 900, 0) },
      h: { name: "수소 원자 (원자 단위, 3차원 가우스)", H: (b) => 1.5 * b - 2 * Math.sqrt(2 * b / Math.PI), ex: () => -0.5 }
    };
    const exCache = {};
    function draw() {
      const c = C(), key = S.val("pot"), p = P[key], b = 10 ** S.val("lb");
      if (!(key in exCache)) exCache[key] = p.ex();
      const ex = exCache[key];
      let bm = 1, Hm = Infinity; for (let i = 0; i <= 2000; i++) { const bb = 10 ** (-2 + 3 * i / 2000), hh = p.H(bb); if (hh < Hm) { Hm = hh; bm = bb; } }
      const y0 = Math.min(ex, Hm) - 0.3 * Math.abs(ex) - 0.1, y1 = Math.max(ex, Hm) + Math.abs(ex) + 0.5;
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: -2, x1: 1, y0, y1, xl: "log₁₀ b (시험 함수 폭 매개변수)", yl: "⟨H⟩" }); f.axes();
      f.fn((x) => p.H(10 ** x), c.main, 2.5, null, 500); f.path([[-2, ex], [1, ex]], c.warn, 1.5, [5, 3]);
      f.dot(Math.log10(bm), Hm, c.acc, 5); f.dot(Math.log10(b), p.H(b), c.ink, 4);
      const unit = key === "h" ? ` (= ${(p.H(b) * 27.211).toFixed(2)} eV)` : "";
      S.out(`${p.name}, 시험 함수 ∝ e^(−b x²)${key === "h" ? " (r²)" : ""}\n지금 b = ${b.toFixed(3)}: ⟨H⟩ = ${p.H(b).toFixed(4)}${unit}\n최소 b = ${bm.toFixed(3)}: 상한 ${Hm.toFixed(4)}, 정확한 바닥 에너지 ${ex.toFixed(4)} (빨간 점선), 상대 차이 ${(100 * (Hm - ex) / Math.abs(ex)).toFixed(2)}%`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. WKB 준위와 정확한 준위 (03-02) */
  (() => {
    const S = QSim.card("lab-p12-wkb"); if (!S) return;
    const cv = S.$("canvas");
    const P = { ho: { V: (x) => 0.5 * x * x, L: 9 }, x4: { V: (x) => x ** 4, L: 4.5 }, abs: { V: (x) => Math.abs(x), L: 13 } };
    const cache = {};
    const action = (V, E) => { let lo = 0, hi = 1; while (V(hi) < E) hi *= 2; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (V(m) < E) lo = m; else hi = m; } const xt = lo, M = 400; let s = 0; for (let i = 0; i < M; i++) { const u = (i + 0.5) / M, x = xt * Math.sin(u * Math.PI / 2); s += Math.sqrt(Math.max(0, 2 * (E - V(x)))) * xt * Math.cos(u * Math.PI / 2) * Math.PI / 2 / M; } return 2 * s; };   // ∫ p dx (되돌이점 사이), 대칭 퍼텐셜
    const wkbE = (V, n) => { let lo = 0, hi = 1; while (action(V, hi) < (n + 0.5) * Math.PI) hi *= 2; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (action(V, m) < (n + 0.5) * Math.PI) lo = m; else hi = m; } return (lo + hi) / 2; };
    function draw() {
      const c = C(), key = S.val("pot"), p = P[key], nsel = S.val("n");
      if (!cache[key]) { cache[key] = []; for (let n = 0; n <= 8; n++) cache[key].push({ ex: eig(p.V, -p.L, p.L, 2000, n), wk: wkbE(p.V, n) }); }
      const rows = cache[key], errs = rows.map((r) => 100 * (r.wk - r.ex) / r.ex);
      const ymax = Math.max(1, ...errs.map(Math.abs)) * 1.2;
      const v = QSim.view(cv, 0.45), f = QSim.frame(v, { x0: -0.5, x1: 8.5, y0: -ymax, y1: ymax, xl: "n", yl: "WKB 상대 오차 (%)" }); f.axes();
      const g = v.g; errs.forEach((e, n) => { g.fillStyle = n === nsel ? c.warn : c.main; const x0 = f.X(n - 0.3), x1 = f.X(n + 0.3); g.fillRect(x0, Math.min(f.Y(0), f.Y(e)), x1 - x0, Math.abs(f.Y(e) - f.Y(0))); });
      const r = rows[nsel];
      S.out(`${key === "ho" ? "조화 진동자 x²/2" : key === "x4" ? "V = x⁴" : "V = |x|"} (ħ = m = 1), n = ${nsel}\n정확한 값(수치) ${r.ex.toFixed(5)}, WKB ${r.wk.toFixed(5)}, 상대 오차 ${errs[nsel].toFixed(3)}%\n막대: n마다 WKB 오차. n이 커질수록 0에 다가간다`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 라비 진동 (04-01) */
  (() => {
    const S = QSim.card("lab-p12-rabi"); if (!S) return;
    const [cvT, cvD] = S.$$("canvas");
    function draw() {
      const c = C(), W = S.val("om"), D = S.val("det"), Wp = Math.sqrt(W * W + D * D), T = 20;
      const P = (t) => (W * W / (Wp * Wp)) * Math.sin(Wp * t / 2) ** 2;
      const P1 = (t) => (Math.abs(D) < 1e-9 ? (W * t / 2) ** 2 : (W * W / (D * D)) * Math.sin(D * t / 2) ** 2);
      const vt = QSim.view(cvT, 0.38), ft = QSim.frame(vt, { x0: 0, x1: T, y0: 0, y1: 1.1, xl: "시간 t", yl: "P(a → b)" }); ft.axes();
      ft.fn((t) => Math.min(1.1, P1(t)), c.ink3, 1.2, [4, 3], 600); ft.fn(P, c.main, 2.5, null, 600);
      const vd = QSim.view(cvD, 0.32), fd = QSim.frame(vd, { x0: -3, x1: 3, y0: 0, y1: 1.1, xl: "벗어남 ω − ω₀", yl: "최대 확률" }); fd.axes();
      fd.fn((d) => W * W / (W * W + d * d), c.acc, 2.2, null, 400); fd.dot(D, W * W / (Wp * Wp), c.warn, 5);
      S.out(`라비 진동수 Ω = ${W.toFixed(2)}, 벗어남 Δ = ${D.toFixed(2)} → 실제 진동수 Ω' = √(Ω² + Δ²) = ${Wp.toFixed(3)}\n최대 확률 Ω²/Ω'² = ${(W * W / (Wp * Wp)).toFixed(3)}, 주기 2π/Ω' = ${(2 * Math.PI / Wp).toFixed(2)}, 공명에서 π 펄스 길이 π/Ω = ${(Math.PI / W).toFixed(2)}\n위: 라비 공식(파랑)과 1차 섭동(회색 점선, P ≪ 1에서만 맞음). 아래: 공명 곡선(반치폭 2Ω)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 5. 딱딱한 공의 부분파 산란 (05-02) */
  (() => {
    const S = QSim.card("lab-p12-partial"); if (!S) return;
    const [cvS, cvA] = S.$$("canvas");
    const sphj = (L, x) => {   // 밀러 하향 재귀로 j_0..j_L
      const top = L + 20 + Math.ceil(x); let jp = 0, j = 1e-30; const out = Array(L + 1).fill(0);
      for (let l = top; l > 0; l--) { const jm = (2 * l + 1) / x * j - jp; jp = j; j = jm; if (l - 1 <= L) out[l - 1] = j; if (Math.abs(j) > 1e250) { jp *= 1e-250; j *= 1e-250; for (let k = 0; k <= L; k++) out[k] *= 1e-250; } }
      const j0 = Math.sin(x) / x, s = j0 / out[0]; return out.map((v) => v * s);
    };
    const sphn = (L, x) => { const out = [-Math.cos(x) / x, -Math.cos(x) / (x * x) - Math.sin(x) / x]; for (let l = 1; l < L; l++) out.push((2 * l + 1) / x * out[l] - out[l - 1]); return out.slice(0, L + 1); };
    const phases = (ka) => { const L = Math.ceil(ka) + 6, j = sphj(L, ka), n = sphn(L, ka); return j.map((jj, l) => Math.atan(jj / n[l])); };
    const sigma = (ka) => phases(ka).reduce((s, d, l) => s + (2 * l + 1) * Math.sin(d) ** 2, 0) * 4 / (ka * ka);   // σ/πa²
    const leg = (L, x) => { const P = [1, x]; for (let l = 1; l < L; l++) P.push(((2 * l + 1) * x * P[l] - l * P[l - 1]) / (l + 1)); return P; };
    function draw() {
      const c = C(), ka = S.val("ka"), d = phases(ka);
      const vs = QSim.view(cvS, 0.4), fs = QSim.frame(vs, { x0: 0, x1: 8, y0: 0, y1: 4.4, xl: "ka", yl: "σ / πa²" }); fs.axes();
      fs.fn((x) => (x < 0.02 ? NaN : sigma(x)), c.main, 2.2, null, 400); fs.path([[0, 4], [8, 4]], c.ink3, 1, [4, 3]); fs.path([[0, 2], [8, 2]], c.ink3, 1, [4, 3]); fs.path([[0, 1], [8, 1]], c.soft, 1, [2, 3]);
      const sg = sigma(ka); fs.dot(ka, sg, c.warn, 5);
      // 각분포 |f|²
      const amp = (th) => { const P = leg(d.length, Math.cos(th)); let re = 0, im = 0; d.forEach((dl, l) => { const s = (2 * l + 1) * Math.sin(dl); re += s * Math.cos(dl) * P[l]; im += s * Math.sin(dl) * P[l]; }); return (re * re + im * im) / (ka * ka); };
      let mx = 0; const pts = []; for (let i = 0; i <= 360; i++) { const th = Math.PI * i / 360, a = amp(th); pts.push([th, a]); mx = Math.max(mx, a); }
      const va = QSim.view(cvA, 0.5), fa = QSim.frame(va, { x0: -1.15, x1: 1.15, y0: -1.05, y1: 1.05, equal: true });
      fa.path([[-1.15, 0], [1.15, 0]], c.ink3, 1, [4, 3]); fa.arrow(-1.1, 0, 0.4, 0, c.ink3); fa.text("입사", -1.1, 0.06, c.ink3);
      const poly = pts.map(([th, a]) => [a / mx * Math.cos(th), a / mx * Math.sin(th)]); fa.path(poly, c.main, 2.5); fa.path(poly.map(([x, y]) => [x, -y]), c.main, 2.5);
      const fwd = amp(0), back = amp(Math.PI);
      S.out(`ka = ${ka.toFixed(2)}: 위상 이동(π의 정수배는 같은 값) δ₀ = ${d[0].toFixed(3)} (s파 이론값 −ka = ${(-ka).toFixed(3)}), δ₁ = ${d[1].toFixed(3)}, δ₂ = ${d[2].toFixed(3)}, δ₃ = ${d[3].toFixed(3)}\n전체 단면적 σ = ${sg.toFixed(3)} πa² (점선: 4, 2, 연한 점선: 기하 단면 1)\n아래: dσ/dΩ 극좌표 (최댓값으로 규격화). 앞/뒤 비 ${(fwd / back).toFixed(2)}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
