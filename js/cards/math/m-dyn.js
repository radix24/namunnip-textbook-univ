/* 수학과 미분방정식·확률·복소해석 탐구 카드: 대각합-행렬식 평면, 마르코프 연쇄, 꼬리 확률 부등식, 편각 원리 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const { fmt } = MKit;

  /* ── 1. 대각합-행렬식 평면과 상평면 ── */
  (() => {
    let fl;
    const TD = [[-1, 2]];
    const S = MKit.setup("card-m6-tracedet", 0.5, draw);
    if (!S) return;
    const { k, v } = S;
    const kind = (T, D) => {
      const disc = T * T - 4 * D, e = 1e-9;
      if (D < -e) return "안장점 (불안정)";
      if (Math.abs(D) <= e) return "고유값 0: 평형점이 직선 전체로 퍼집니다";
      if (Math.abs(T) <= 0.02) return disc < 0 ? "중심 (닫힌 궤도)" : "경계";
      const st = T < 0 ? "안정" : "불안정";
      if (Math.abs(disc) <= 0.02) return `겹친 고유값의 마디점 (${st})`;
      return disc > 0 ? `마디점 (${st})` : `나선점 (${st})`;
    };
    function draw() {
      const c = C(), g = v.g, half = v.W / 2;
      const [T, D] = TD[0];
      // 왼쪽: (T, D) 평면
      g.save();
      const vl = { g, W: half, H: v.H };
      fl = QSim.frame(vl, { x0: -3, x1: 3, y0: -2, y1: 3, pad: 22, xl: "T", yl: "D" });
      fl.axes({ noGrid: true });
      fl.fn((x) => (x * x) / 4, c.acc, 2, null, 200);
      fl.text("D = T²/4", 1.6, 2.6, c.acc);
      fl.text("안장점", -2.8, -1.5, c.ink3); fl.text("나선", -0.9, 2.4, c.ink3); fl.text("마디", -2.9, 1.2, c.ink3);
      fl.dot(T, D, c.warn, 7);
      g.restore();
      // 오른쪽: A = [[T/2, 1], [T²/4 − D, T/2]]의 상평면
      const a = T / 2, b = 1, cc = (T * T) / 4 - D, d = T / 2;
      g.save(); g.translate(half, 0);
      const vr = { g, W: half, H: v.H };
      const fr = QSim.frame(vr, { x0: -2, x1: 2, y0: -2, y1: 2, equal: true, pad: 14 });
      fr.axes({ noGrid: true });
      const F = (t, y) => [a * y[0] + b * y[1], cc * y[0] + d * y[1]];
      for (let i = -2; i <= 2; i += 0.5) for (let j = -2; j <= 2; j += 0.5) {
        const [u, w] = F(0, [i, j]), n = Math.hypot(u, w) || 1;
        fr.path([[i, j], [i + (0.18 * u) / n, j + (0.18 * w) / n]], c.rule, 1);
      }
      for (let m = 0; m < 16; m++) {
        const th = (m * Math.PI) / 8 + 0.1;
        [1, -1].forEach((dir) => {
          let y = [1.7 * Math.cos(th), 1.7 * Math.sin(th)]; const pts = [y];
          for (let s = 0; s < 500; s++) { y = QSim.rk4((t, z) => F(t, z).map((q) => dir * q), 0, y, 0.02); if (Math.abs(y[0]) > 2.2 || Math.abs(y[1]) > 2.2 || Math.hypot(y[0], y[1]) < 0.01) break; pts.push(y); }
          fr.path(pts, dir > 0 ? c.main : c.soft, dir > 0 ? 1.6 : 1);
        });
      }
      fr.dot(0, 0, c.warn, 4);
      g.restore();
      g.strokeStyle = c.rule; g.beginPath(); g.moveTo(half, 6); g.lineTo(half, v.H - 6); g.stroke();
      const disc = T * T - 4 * D;
      const ev = disc >= 0 ? `${fmt(T / 2 + Math.sqrt(disc) / 2)}, ${fmt(T / 2 - Math.sqrt(disc) / 2)}` : `${fmt(T / 2)} ± ${fmt(Math.sqrt(-disc) / 2)}i`;
      k.out(`T = ${fmt(T, 2)}, D = ${fmt(D, 2)}, T² − 4D = ${fmt(disc, 2)} · 고유값 ${ev}\n분류: ${kind(T, D)}\n행렬 A = [[${fmt(a, 2)}, 1], [${fmt(cc, 2)}, ${fmt(d, 2)}]] (진한 선은 시간이 흐르는 방향, 옅은 선은 거꾸로)`);
    }
    MKit.drag(S.cv, () => fl, () => TD, (i, x, y) => { TD[0] = [Math.round(x * 20) / 20, Math.round(y * 20) / 20]; S.redraw(); });
    S.redraw();
  })();

  /* ── 2. 상태 셋인 마르코프 연쇄 ── */
  (() => {
    const S = MKit.setup("card-m21-markov", 0.62, draw);
    if (!S) return;
    const { k, v } = S;
    const mat = () => {
      const r = [["p12", "p13"], ["p21", "p23"], ["p31", "p32"]].map(([x, y]) => [k.val(x), k.val(y)]);
      return r.map(([x, y], i) => {
        const s = x + y, sc = s > 1 ? 1 / s : 1, a = x * sc, b = y * sc, row = [0, 0, 0];
        const oth = [[1, 2], [0, 2], [0, 1]][i];
        row[oth[0]] = a; row[oth[1]] = b; row[i] = 1 - a - b; return row;
      });
    };
    const step = (p, M) => [0, 1, 2].map((j) => p[0] * M[0][j] + p[1] * M[1][j] + p[2] * M[2][j]);
    function draw() {
      const c = C(), g = v.g, M = mat(), K = k.val("k"), s0 = +k.val("start");
      let p = [0, 0, 0]; p[s0] = 1;
      const hist = [p];
      for (let t = 0; t < 40; t++) { p = step(p, M); hist.push(p); }
      // 긴 시간 평균(체사로 평균): 주기가 있어도 수렴한다
      let q = [0, 0, 0]; q[s0] = 1; const avg = [0, 0, 0];
      for (let t = 0; t < 5000; t++) { for (let j = 0; j < 3; j++) avg[j] += q[j] / 5000; q = step(q, M); }
      const W = v.W, H = v.H, cols = [c.main, c.acc, c.warn];
      // 왼쪽: 상태 그림
      const pos = [[W * 0.16, H * 0.25], [W * 0.32, H * 0.72], [W * 0.04 + 12, H * 0.72]];
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
        if (i === j || M[i][j] < 1e-9) continue;
        const [x1, y1] = pos[i], [x2, y2] = pos[j], mx = (x1 + x2) / 2 + (y2 - y1) * 0.18, my = (y1 + y2) / 2 - (x2 - x1) * 0.18;
        g.strokeStyle = c.ink3; g.lineWidth = 1 + 5 * M[i][j]; g.beginPath(); g.moveTo(x1, y1); g.quadraticCurveTo(mx, my, x2, y2); g.stroke();
        g.fillStyle = c.ink2; g.font = "11px sans-serif"; g.fillText(fmt(M[i][j], 2), mx - 10, my);
      }
      const pk = hist[K];
      pos.forEach(([x, y], i) => {
        g.fillStyle = c.card; g.strokeStyle = cols[i]; g.lineWidth = 2;
        g.beginPath(); g.arc(x, y, 16, 0, 7); g.fill(); g.stroke();
        g.fillStyle = cols[i]; g.globalAlpha = 0.25 + 0.75 * pk[i]; g.beginPath(); g.arc(x, y, 4 + 11 * Math.sqrt(pk[i]), 0, 7); g.fill(); g.globalAlpha = 1;
        g.fillStyle = c.ink; g.font = "bold 12px sans-serif"; g.fillText(i + 1, x - 4, y - 20);
      });
      // 오른쪽: 시간에 따른 확률
      g.save(); g.translate(W * 0.42, 0);
      const vr = { g, W: W * 0.58, H };
      const f = QSim.frame(vr, { x0: 0, x1: 40, y0: 0, y1: 1, pad: 26, xl: "단계" });
      f.axes();
      for (let i = 0; i < 3; i++) { f.path(hist.map((h, t) => [t, h[i]]), cols[i], 2); f.path([[0, avg[i]], [40, avg[i]]], cols[i], 1, [4, 4]); }
      f.path([[K, 0], [K, 1]], c.ink3, 1, [2, 3]);
      g.restore();
      const per = Math.max(...[0, 1, 2].map((i) => Math.abs(hist[40][i] - hist[39][i]))) > 1e-3;
      k.out(`${K}단계 뒤 분포 (${pk.map((x) => fmt(x, 3)).join(", ")})\n긴 시간 평균 (${avg.map((x) => fmt(x, 3)).join(", ")}) · 점선` +
        (per ? "\n40단계가 지나도 분포가 흔들립니다. 주기가 있는 연쇄입니다" : ""));
    }
    S.redraw();
  })();

  /* ── 3. 마르코프·체비쇼프 부등식 ── */
  (() => {
    const erf = (x) => { const t = 1 / (1 + 0.3275911 * Math.abs(x)); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; };
    const binom = (n, j) => { let r = 1; for (let i = 1; i <= j; i++) r = (r * (n - i + 1)) / i; return r; };
    const D = {
      norm: { mu: 0, sd: 1, pdf: (x) => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI), x0: -4.5, x1: 4.5, tail: (t) => 1 - erf(t / Math.SQRT2), tex: "정규분포 N(0, 1)" },
      exp: { mu: 1, sd: 1, pdf: (x) => (x < 0 ? 0 : Math.exp(-x)), x0: -0.5, x1: 6, tail: (t) => Math.exp(-(1 + t)) + (t < 1 ? 1 - Math.exp(-(1 - t)) : 0), tex: "지수분포 (평균 1)", nonneg: true },
      unif: { mu: 0, sd: 1, pdf: (x) => (Math.abs(x) <= Math.sqrt(3) ? 1 / (2 * Math.sqrt(3)) : 0), x0: -2.5, x1: 2.5, tail: (t) => Math.max(0, 1 - t / Math.sqrt(3)), tex: "균등분포 (−√3, √3)" },
      bin: { mu: 10, sd: Math.sqrt(5), pmf: (j) => binom(20, j) / 1048576, x0: -0.5, x1: 20.5, tex: "이항분포 B(20, 1/2)", nonneg: true },
      two: { mu: 0, sd: 1, x0: -3, x1: 3, tex: "±a 두 점 + 0 (체비쇼프가 등호)", pts: true },
    };
    const S = MKit.setup("card-m5-tail", 0.6, draw);
    if (!S) return;
    const { k, v } = S;
    function draw() {
      const c = C(), g = v.g, Dd = D[k.val("dist")], kk = k.val("k");
      const t = kk * Dd.sd;
      let tail, maxY;
      // 두 점 분포: P(X = ±k) = 1/(2k²), P(X = 0) = 1 − 1/k² (k ≥ 1). 분산 1, P(|X| ≥ k) = 1/k²
      if (Dd.pts) { tail = kk >= 1 ? 1 / (kk * kk) : 1; maxY = 1; }
      else if (Dd.pmf) { tail = 0; for (let j = 0; j <= 20; j++) if (Math.abs(j - Dd.mu) >= t - 1e-12) tail += Dd.pmf(j); maxY = 0.2; }
      else { tail = Dd.tail(t); maxY = Dd.pdf(Dd.mu) * 1.15 || 1.1; if (k.val("dist") === "exp") maxY = 1.1; }
      const f = QSim.frame(v, { x0: Dd.x0, x1: Dd.x1, y0: 0, y1: maxY, pad: 28, xl: "x" });
      f.axes();
      const inTail = (x) => Math.abs(x - Dd.mu) >= t;
      if (Dd.pts) {
        const a = Math.max(1, kk), pr = kk >= 1 ? [[-a, 1 / (2 * a * a)], [0, 1 - 1 / (a * a)], [a, 1 / (2 * a * a)]] : [[-1, 0.5], [1, 0.5]];
        pr.forEach(([x, p]) => f.path([[x, 0], [x, p]], inTail(x) ? c.warn : c.main, 6));
      } else if (Dd.pmf) {
        for (let j = 0; j <= 20; j++) f.path([[j, 0], [j, Dd.pmf(j)]], inTail(j) ? c.warn : c.main, Math.max(3, f.sx * 0.6));
      } else {
        const N = 600;
        for (let i = 0; i < N; i++) {
          const x = Dd.x0 + ((i + 0.5) / N) * (Dd.x1 - Dd.x0), y = Dd.pdf(x);
          if (y > 0) { g.fillStyle = inTail(x) ? c.warn : c.soft; g.fillRect(f.X(x), f.Y(y), f.sx * (Dd.x1 - Dd.x0) / N + 0.6, f.Y(0) - f.Y(y)); }
        }
        f.fn(Dd.pdf, c.main, 2, null, 600);
      }
      [Dd.mu - t, Dd.mu + t].forEach((x) => f.path([[x, 0], [x, maxY]], c.ink3, 1, [4, 4]));
      const cheb = Math.min(1, 1 / (kk * kk));
      const mk = Dd.nonneg ? Math.min(1, Dd.mu / (Dd.mu + t)) : null;
      k.out(`${Dd.tex}, 평균 μ = ${fmt(Dd.mu, 2)}, 표준편차 σ = ${fmt(Dd.sd, 3)}, k = ${kk}\n` +
        `실제 P(|X − μ| ≥ kσ) = ${fmt(tail, 4)} · 체비쇼프 한계 1/k² = ${fmt(cheb, 4)}` +
        (mk !== null ? `\n마르코프 한계 (X ≥ 0) P(X ≥ μ + kσ) ≤ μ/(μ + kσ) = ${fmt(mk, 4)}` : ""));
    }
    S.redraw();
  })();

  /* ── 4. 편각 원리: 원을 따라 f(z)가 원점을 몇 번 감는가 ── */
  (() => {
    let fz;
    const Z = [[0.6, 0.3], [-0.7, 0.5], [0.1, -0.8], [1.3, -0.6], [0, 0]]; // 영점 셋, 극 하나, 원의 중심
    const S = MKit.setup("card-m20-argument", 0.5, draw);
    if (!S) return;
    const { k, v } = S;
    const f = (x, y, pole) => {
      let re = 1, im = 0;
      for (let i = 0; i < 3; i++) { const a = x - Z[i][0], b = y - Z[i][1]; [re, im] = [re * a - im * b, re * b + im * a]; }
      if (pole) { const a = x - Z[3][0], b = y - Z[3][1], d = a * a + b * b; [re, im] = [(re * a + im * b) / d, (im * a - re * b) / d]; }
      return [re, im];
    };
    function draw() {
      const c = C(), g = v.g, half = v.W / 2, pole = k.val("pole"), R = k.val("r");
      const ctr = Z[4];
      g.save();
      fz = QSim.frame({ g, W: half, H: v.H }, { x0: -2, x1: 2, y0: -2, y1: 2, equal: true, pad: 14 });
      fz.axes({ noGrid: true });
      const M = 720, curve = [], img = [];
      for (let i = 0; i <= M; i++) { const t = (2 * Math.PI * i) / M, x = ctr[0] + R * Math.cos(t), y = ctr[1] + R * Math.sin(t); curve.push([x, y]); img.push(f(x, y, pole)); }
      fz.path(curve, c.main, 2);
      for (let i = 0; i < 3; i++) fz.dot(Z[i][0], Z[i][1], c.acc, 7);
      if (pole) { const [px, py] = Z[3]; g.strokeStyle = c.warn; g.lineWidth = 2.5; g.beginPath(); g.moveTo(fz.X(px) - 6, fz.Y(py) - 6); g.lineTo(fz.X(px) + 6, fz.Y(py) + 6); g.moveTo(fz.X(px) + 6, fz.Y(py) - 6); g.lineTo(fz.X(px) - 6, fz.Y(py) + 6); g.stroke(); }
      fz.dot(ctr[0], ctr[1], c.main, 4);
      g.fillStyle = c.ink2; g.font = "12px sans-serif"; g.fillText("z 평면", 18, 14);
      g.restore();
      // 오른쪽: w = f(z)의 상. 크기는 log(1+|w|)로 줄이고 방향은 그대로
      let wind = 0;
      for (let i = 1; i <= M; i++) { let d = Math.atan2(img[i][1], img[i][0]) - Math.atan2(img[i - 1][1], img[i - 1][0]); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; wind += d; }
      const nW = Math.round(wind / (2 * Math.PI));
      const sq = img.map(([a, b]) => { const r = Math.hypot(a, b), s = r > 0 ? Math.log1p(r) / r : 0; return [a * s, b * s]; });
      const m = Math.max(1, ...sq.map(([a, b]) => Math.hypot(a, b)));
      g.save(); g.translate(half, 0);
      const fw = QSim.frame({ g, W: half, H: v.H }, { x0: -m * 1.1, x1: m * 1.1, y0: -m * 1.1, y1: m * 1.1, equal: true, pad: 14 });
      fw.axes({ noGrid: true });
      fw.path(sq, c.main, 1.6);
      fw.dot(0, 0, c.warn, 5);
      g.fillStyle = c.ink2; g.font = "12px sans-serif"; g.fillText("w = f(z) 평면", 18, 14);
      g.restore();
      g.strokeStyle = c.rule; g.beginPath(); g.moveTo(half, 6); g.lineTo(half, v.H - 6); g.stroke();
      const inside = (p) => Math.hypot(p[0] - ctr[0], p[1] - ctr[1]) < R;
      const nz = [0, 1, 2].filter((i) => inside(Z[i])).length, np = pole && inside(Z[3]) ? 1 : 0;
      const near = [0, 1, 2, 3].some((i) => (i < 3 || pole) && Math.abs(Math.hypot(Z[i][0] - ctr[0], Z[i][1] - ctr[1]) - R) < 0.03);
      k.out(`원 안의 영점 ${nz}개, 극 ${np}개 → Z − P = ${nz - np}\n상 곡선이 원점을 감은 횟수 ${nW}` + (near ? " (영점이나 극이 원 위에 거의 닿아 셈이 불안정합니다)" : ""));
    }
    MKit.drag(S.cv, () => fz, () => Z, (i, x, y) => { Z[i] = [x, y]; S.redraw(); });
    S.redraw();
  })();
})();
