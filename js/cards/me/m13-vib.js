/* 기계13 기계진동: 조화 가진 응답과 공진 (03-01) / 기계8 실험: 대수 감쇠율로 감쇠비 구하기 (02-01, 가상 측정) */
(() => {
  "use strict";
  const k = 1000, m = 1, wn = Math.sqrt(k / m), F0 = 10;
  const mag = (r, z) => 1 / Math.hypot(1 - r * r, 2 * z * r);
  const phase = (r, z) => Math.atan2(2 * z * r, 1 - r * r);

  /* ── 조화 가진과 공진 ── */
  (() => {
    const S = QSim.card("lab-me-resonance"); if (!S) return;
    const [c1, c2, c3] = S.$$("canvas");
    let y, t, hist;
    const reset = () => { y = [0, 0]; t = 0; hist = []; };
    function draw() {
      const c = QSim.col(), z = S.val("z"), r = S.val("r"), X0 = F0 / k;
      // 진폭비 곡선
      let v = QSim.view(c1, 0.5), f = QSim.frame(v, { x0: 0, x1: 3, y0: 0, y1: 6, xl: "r = ω/ωn", yl: "X/(F₀/k)", pad: 30 }); f.axes();
      [0.05, 0.1, 0.2, 0.5, 1].forEach((zz) => f.fn((x) => Math.min(6.2, mag(x, zz)), c.rule, 1));
      f.fn((x) => Math.min(6.2, mag(x, z)), c.main, 2.5); f.dot(r, Math.min(6, mag(r, z)), c.warn, 5);
      // 질량과 힘 (애니메이션)
      v = QSim.view(c2, 0.3); const G = v.g, W = v.W, H = v.H, s = 0.35 * W / Math.max(4 * X0, mag(r, z) * X0 * 1.1, Math.abs(y[0]) * 1.1);
      const xm = W * 0.55 + y[0] * s, Fx = Math.cos(r * wn * t);
      G.strokeStyle = c.ink3; G.beginPath(); G.moveTo(10, H / 2); for (let i = 0; i <= 16; i++) G.lineTo(10 + (xm - 30 - 10) * i / 16, H / 2 + (i % 2 ? -8 : 8) * (i > 0 && i < 16)); G.stroke();
      G.fillStyle = c.soft; G.fillRect(xm - 30, H / 2 - 22, 60, 44); G.strokeStyle = c.ink2; G.strokeRect(xm - 30, H / 2 - 22, 60, 44);
      G.fillStyle = c.ink3; G.fillRect(6, H / 2 - 30, 4, 60);
      const fa = 40 * Fx; G.strokeStyle = G.fillStyle = c.warn; G.lineWidth = 2; G.beginPath(); G.moveTo(xm, H / 2); G.lineTo(xm + fa, H / 2); G.stroke(); G.lineWidth = 1;
      G.fillStyle = c.ink3; G.font = "12px " + getComputedStyle(document.documentElement).getPropertyValue("--f-mono"); G.fillText("빨강: 가진력 F₀cos ωt", 14, H - 6);
      // 시간 응답
      const T0 = Math.max(0, t - 3);
      const A = Math.max(X0 * 1.5, ...hist.map((p) => Math.abs(p[1]))) * 1.15 * 1000;
      v = QSim.view(c3, 0.36); f = QSim.frame(v, { x0: T0, x1: T0 + 3, y0: -A, y1: A, xl: "t (s)", yl: "x (mm)", pad: 34 }); f.axes();
      f.path(hist.filter((p) => p[0] >= T0).map((p) => [p[0], p[1] * 1000]), c.main, 2);
      f.path(hist.filter((p) => p[0] >= T0).map((p) => [p[0], p[2] * X0 * 1000]), c.warn, 1, [4, 3]);
      // 최근 한 주기의 실제 최대 진폭 (가상 측정)
      const per = (2 * Math.PI) / (r * wn || 1), rec = hist.filter((p) => p[0] > t - per);
      const meas = rec.length > 5 && t > 2 * per ? Math.max(...rec.map((p) => Math.abs(p[1]))) * 1000 : NaN;
      S.out(`고유진동수 ωn = √(k/m) = ${wn.toFixed(1)} rad/s (${(wn / 2 / Math.PI).toFixed(2)} Hz), 가진 ω = ${(r * wn).toFixed(1)} rad/s\n이론 정상 진폭 X = (F₀/k)·${mag(r, z).toFixed(3)} = ${(X0 * mag(r, z) * 1000).toFixed(2)} mm, 위상 지연 ${(phase(r, z) * 180 / Math.PI).toFixed(1)}°\n시뮬레이션 최근 한 주기 최대 변위 ${isNaN(meas) ? "(재생 중 측정)" : meas.toFixed(2) + " mm (가상 측정, 과도 응답이 남아 있으면 이론값과 다름)"}  t = ${t.toFixed(1)} s`);
    }
    const L = QSim.loop((dt) => {
      const z = S.val("z"), w = S.val("r") * wn, n = 30, h = dt / n;
      for (let i = 0; i < n; i++) { y = QSim.rk4((tt, s) => [s[1], (F0 * Math.cos(w * tt) - 2 * z * wn * m * s[1] - k * s[0]) / m], t, y, h); t += h; }
      hist.push([t, y[0], Math.cos(w * t)]); if (hist.length > 2000) hist.shift();
      draw();
    }).watch(S.root);
    const setBtn = QSim.playButton(S.$(".play"), L);
    S.$(".reset").addEventListener("click", () => { L.stop(); setBtn(); reset(); draw(); });
    S.on(() => { reset(); draw(); });
    QSim.redrawOn(draw); reset(); draw();
  })();

  /* ── 대수 감쇠율 (가상 가속도계 자료) ── */
  (() => {
    const S = QSim.card("lab-me-logdec"); if (!S) return;
    const [cv] = S.$$("canvas");
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());
    let data = [];
    function make() {
      const z = S.val("z"), noise = S.val("noise") / 100, fn = 5, wn2 = 2 * Math.PI * fn, wd = wn2 * Math.sqrt(1 - z * z), x0 = 10;
      data = []; for (let i = 0; i <= 2000; i++) { const tt = i / 500; data.push([tt, x0 * Math.exp(-z * wn2 * tt) * Math.cos(wd * tt) + x0 * noise * gauss()]); }
    }
    function peaks() {
      // 앞뒤 0.05 s(주기의 1/4) 안에서 가장 높은 점만 봉우리로 친다. 잡음이 만든 작은 꼭대기는 버린다
      // 먼저 11점(22 ms) 이동 평균으로 잡음을 줄인다. 5 Hz 봉우리는 모두 약 2% 낮아지지만 같은 비율이라 봉우리의 비는 그대로다
      const sm = data.map((p, i) => { let s = 0, n = 0; for (let j = Math.max(0, i - 5); j <= Math.min(data.length - 1, i + 5); j++) { s += data[j][1]; n++; } return [p[0], s / n]; });
      const P = [], w = 25; for (let i = w; i < sm.length - w; i++) { const yv = sm[i][1]; if (yv > 0 && sm.slice(i - w, i + w + 1).every((q) => q[1] <= yv)) P.push(sm[i]); }
      return P;
    }
    function draw() {
      const c = QSim.col(), n = S.val("n"), z = S.val("z");
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: 4, y0: -12, y1: 12, xl: "t (s)", yl: "x (mm, 가상)", pad: 30 }); f.axes();
      f.path(data.map((p) => [p[0], p[1]]), c.main, 1.2);
      const P = peaks();
      P.forEach((p, i) => f.dot(p[0], p[1], i === 0 || i === n ? c.warn : c.ink3, i === 0 || i === n ? 5 : 3));
      if (P.length > n) {
        const d = Math.log(P[0][1] / P[n][1]) / n, zEst = d / Math.sqrt(4 * Math.PI * Math.PI + d * d);
        S.out(`첫 봉우리 x₀ = ${P[0][1].toFixed(2)} mm, ${n}번째 뒤 봉우리 x${n} = ${P[n][1].toFixed(2)} mm (가상 측정)\n대수 감쇠율 δ = (1/n) ln(x₀/xₙ) = ${d.toFixed(4)}\n추정 감쇠비 ζ = δ/√(4π² + δ²) = ${zEst.toFixed(4)}   (장치에 넣은 참값 ${z.toFixed(3)}, 오차 ${(((zEst - z) / z) * 100).toFixed(1)}%)`);
      } else S.out(`봉우리가 ${P.length}개뿐이라 ${n}주기 뒤 봉우리를 찾을 수 없습니다. 감쇠비를 줄이거나 n을 줄이세요.`);
    }
    S.$(".again").addEventListener("click", () => { seed = (seed * 48271) % 2147483647 || 11; make(); draw(); });
    S.on(() => { make(); draw(); });
    QSim.redrawOn(draw); make(); draw();
  })();
})();

/* 기계13 4단원: 합성곱으로 구한 펄스 응답 (04-01) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-conv"); if (!S) return;
  const [cv1, cv2] = S.$$("canvas");
  const m = 10, k = 4000, wn = Math.sqrt(k / m), Tn = (2 * Math.PI) / wn, F0 = 100;
  function draw() {
    const c = QSim.col(), t0 = S.val("t0"), z = S.val("z"), shape = S.val("shape");
    const wd = wn * Math.sqrt(1 - z * z), h = (t) => (t < 0 ? 0 : (Math.exp(-z * wn * t) * Math.sin(wd * t)) / (m * wd));
    const F = (t) => (t < 0 || t > t0 ? 0 : shape === "rect" ? F0 : shape === "sine" ? F0 * Math.sin((Math.PI * t) / t0) : F0 * (1 - t / t0));
    const T = 1.2, dt = 0.0005, N = Math.round(T / dt), xs = [];
    for (let i = 0; i <= N; i++) { const t = i * dt; let s = 0; for (let j = 0; j < i; j++) { const tj = (j + 0.5) * dt; s += F(tj) * h(t - tj) * dt; } xs.push([t, s * 1000]); }
    const xmax = Math.max(...xs.map((p) => Math.abs(p[1]))), st = (F0 / k) * 1000;
    const v1 = QSim.view(cv1, 0.3), f1 = QSim.frame(v1, { x0: 0, x1: T, y0: 0, y1: 110, xl: "t (s)", yl: "F (N)", pad: 34 });
    f1.axes(); f1.fn(F, c.acc, 2, null, 800);
    const v2 = QSim.view(cv2, 0.45), f2 = QSim.frame(v2, { x0: 0, x1: T, y0: -60, y1: 60, xl: "t (s)", yl: "x (mm)", pad: 34 });
    f2.axes(); f2.path(xs, c.main, 2); f2.path([[0, st], [T, st]], c.ink3, 1, [4, 3]);
    const name = { rect: "사각", sine: "반 사인", tri: "삼각(줄어듦)" }[shape];
    S.out(`${name} 펄스, 최대 힘 ${F0} N, 길이 ${t0.toFixed(3)} s (고유 주기 ${Tn.toFixed(3)} s의 ${(t0 / Tn).toFixed(2)}배), 감쇠비 ${z}\n최대 변위 ${xmax.toFixed(1)} mm, 정적 처짐 ${st.toFixed(1)} mm (회색 점선)의 ${(xmax / st).toFixed(2)}배\n충격량 ${(xs.length ? (shape === "rect" ? F0 * t0 : shape === "sine" ? (2 * F0 * t0) / Math.PI : (F0 * t0) / 2) : 0).toFixed(2)} N·s`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();

/* 기계13 5단원: 동흡진기 달린 2자유도계의 주파수 응답 (05-03) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-absorber"); if (!S) return;
  const [cv] = S.$$("canvas");
  const m1 = 100, k1 = 1.0e5, w1 = Math.sqrt(k1 / m1); // 주 계: 고유진동수 31.6 rad/s
  function resp(w, mu, f, za) {
    // 복소수 연산으로 주 질량 진폭 |X1| / (F0/k1)
    const m2 = mu * m1, wa = f * w1, k2 = m2 * wa * wa, c2 = 2 * za * m2 * wa;
    // [k1+k2 − m1w² + i c2 w,  −k2 − i c2 w; −k2 − i c2 w, k2 − m2 w² + i c2 w] X = [F0, 0]
    const a = [k1 + k2 - m1 * w * w, c2 * w], b = [-k2, -c2 * w], d = [k2 - m2 * w * w, c2 * w];
    const mul = (p, q) => [p[0] * q[0] - p[1] * q[1], p[0] * q[1] + p[1] * q[0]];
    const det = [mul(a, d)[0] - mul(b, b)[0], mul(a, d)[1] - mul(b, b)[1]];
    const num = d, mag = Math.hypot(...num) / Math.hypot(...det);
    return mag * k1;
  }
  function draw() {
    const c = QSim.col(), mu = S.val("mu"), f = S.val("f"), za = S.val("za");
    const v = QSim.view(cv, 0.55), fr = QSim.frame(v, { x0: 0.5, x1: 1.5, y0: 0, y1: 20, xl: "가진 진동수 / 주 계 고유진동수", yl: "|X₁| / (F₀/k₁)", pad: 34 });
    fr.axes();
    fr.fn((r) => Math.min(1 / Math.sqrt((1 - r * r) ** 2 + (2 * 0.02 * r) ** 2), 25), c.ink3, 1.5, [4, 3], 600);
    fr.fn((r) => Math.min(resp(r * w1, mu, f, za), 25), c.main, 2.5, null, 800);
    let peak = 0; for (let i = 0; i <= 2000; i++) peak = Math.max(peak, resp((0.5 + i / 2000) * w1, mu, f, za));
    const at1 = resp(w1, mu, f, za);
    S.out(`주 계 m₁ = 100 kg (감쇠 무시), 흡진기 질량비 μ = ${mu}, 동조비 f = ω_a/ω₁ = ${f}, 흡진기 감쇠비 ${za}\n원래 공진 진동수(r = 1)에서 주 질량 진폭 배율 ${at1.toFixed(2)} (흡진기 없을 때 감쇠비 0.02 가정 25)\n0.5 < r < 1.5에서 최대 배율 ${peak.toFixed(1)}`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();