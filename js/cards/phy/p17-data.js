/* 물리17 실습 카드 묶음: 카이제곱 지형, 몬테카를로, 과적합, k-최근접 이웃 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const rng = (s) => () => { s = (s * 1664525 + 1013904223) % 4294967296; return (s + 0.5) / 4294967296; };
  const gauss = (r) => Math.sqrt(-2 * Math.log(r())) * Math.cos(2 * Math.PI * r());
  function solve(A, b) {   // 부분 피벗 가우스 소거
    const n = b.length, M = A.map((r, i) => r.concat([b[i]]));
    for (let k = 0; k < n; k++) { let p = k; for (let i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i; [M[k], M[p]] = [M[p], M[k]]; for (let i = k + 1; i < n; i++) { const m = M[i][k] / M[k][k]; for (let j = k; j <= n; j++) M[i][j] -= m * M[k][j]; } }
    const x = Array(n).fill(0); for (let i = n - 1; i >= 0; i--) { let s = M[i][n]; for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j]; x[i] = s / M[i][i]; } return x;
  }

  /* 1. 지수 붕괴 맞춤의 카이제곱 지형 (02-01, 02-02) */
  (() => {
    const S = QSim.card("lab-p17-chi2"); if (!S) return;
    const [cvD, cvL] = S.$$("canvas"); let seed = 7;
    function draw() {
      const c = C(), tmax = S.val("tmax"), rel = S.val("noise") / 100, n = 15, N0 = 100, tau = 1, r = rng(seed);
      const t = Array.from({ length: n }, (_, i) => tmax * (i + 0.5) / n), sig = t.map((ti) => Math.max(1, rel * N0 * Math.exp(-ti / tau)));
      const y = t.map((ti, i) => N0 * Math.exp(-ti / tau) + sig[i] * gauss(r));
      const chi = (a, b) => t.reduce((s, ti, i) => s + ((y[i] - a * Math.exp(-ti / b)) / sig[i]) ** 2, 0);
      let best = [N0, tau], bc = chi(N0, tau);
      for (let it = 0; it < 4; it++) { const sa = best[0] * 0.3 / (it + 1) ** 2, sb = best[1] * 0.5 / (it + 1) ** 2; for (let i = -20; i <= 20; i++) for (let j = -20; j <= 20; j++) { const a = best[0] + sa * i / 20, b = best[1] + sb * j / 20; if (b <= 0.01) continue; const v = chi(a, b); if (v < bc) { bc = v; best = [a, b]; } } }
      const [A, B] = best, h1 = A * 1e-3, h2 = B * 1e-3;
      const Haa = (chi(A + h1, B) - 2 * bc + chi(A - h1, B)) / h1 ** 2, Hbb = (chi(A, B + h2) - 2 * bc + chi(A, B - h2)) / h2 ** 2;
      const Hab = (chi(A + h1, B + h2) - chi(A + h1, B - h2) - chi(A - h1, B + h2) + chi(A - h1, B - h2)) / (4 * h1 * h2);
      const det = Haa * Hbb - Hab * Hab, Vaa = 2 * Hbb / det, Vbb = 2 * Haa / det, Vab = -2 * Hab / det;
      const sA = Math.sqrt(Vaa), sB = Math.sqrt(Vbb), rho = Vab / (sA * sB);
      const vd = QSim.view(cvD, 0.4), fd = QSim.frame(vd, { x0: 0, x1: Math.max(tmax, 3), y0: 0, y1: 130, xl: "t/τ", yl: "N" }); fd.axes();
      fd.fn((x) => A * Math.exp(-x / B), c.main, 2); fd.fn((x) => N0 * Math.exp(-x / tau), c.ink3, 1, [4, 3]);
      t.forEach((ti, i) => { fd.path([[ti, y[i] - sig[i]], [ti, y[i] + sig[i]]], c.warn, 1); fd.dot(ti, y[i], c.warn, 3); });
      const vl = QSim.view(cvL, 0.5), g = vl.g, a0 = A - 4 * sA, a1 = A + 4 * sA, b0 = Math.max(0.05, B - 4 * sB), b1 = B + 4 * sB;
      const fl = QSim.frame(vl, { x0: a0, x1: a1, y0: b0, y1: b1, xl: "N₀", yl: "τ" }); fl.axes({ noGrid: true });
      const R = 70; for (let i = 0; i < R; i++) for (let j = 0; j < R; j++) { const a = a0 + (a1 - a0) * (i + 0.5) / R, b = b0 + (b1 - b0) * (j + 0.5) / R, d = chi(a, b) - bc; const u = Math.min(1, d / 12); g.fillStyle = `rgba(90,100,230,${(0.7 * (1 - u)).toFixed(3)})`; if (Math.abs(d - 1) < 0.25 || Math.abs(d - 4) < 0.4) g.fillStyle = "rgba(217,83,79,0.9)"; g.fillRect(fl.X(a0 + (a1 - a0) * i / R), fl.Y(b0 + (b1 - b0) * (j + 1) / R), fl.sx * (a1 - a0) / R + 1, fl.Y(b0) - fl.Y(b0 + (b1 - b0) / R) + 1); }
      fl.dot(A, B, c.ink, 4); fl.dot(N0, tau, c.acc, 4);
      const nu = n - 2;
      S.out(`참값 N₀ = 100, τ = 1 (주황 점). 측정 구간 0 ~ ${tmax.toFixed(1)}τ, 상대 잡음 ${S.val("noise")}%\n맞춤: N₀ = ${A.toFixed(1)} ± ${sA.toFixed(1)}, τ = ${B.toFixed(3)} ± ${sB.toFixed(3)}, 상관 ρ = ${rho.toFixed(2)}\nχ²_min = ${bc.toFixed(1)}, ν = ${nu}, χ²/ν = ${(bc / nu).toFixed(2)}. 아래: χ² 지형, 빨간 고리는 Δχ² = 1, 4 (1σ, 2σ 영역)`);
    }
    S.$(".new").addEventListener("click", () => { seed = (seed * 31 + 3) % 99991; draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 몬테카를로로 π 구하기 (03-02) */
  (() => {
    const S = QSim.card("lab-p17-mc"); if (!S) return;
    const [cvP, cvC] = S.$$("canvas"); let seed = 1;
    function draw() {
      const c = C(), N = Math.round(10 ** S.val("ln")), r = rng(seed);
      const vp = QSim.view(cvP, 1), g = vp.g, side = Math.min(vp.W, vp.H) - 10;
      g.strokeStyle = c.ink3; g.strokeRect(5, 5, side, side); g.beginPath(); g.arc(5, 5 + side, side, -Math.PI / 2, 0); g.stroke();
      let inside = 0; const conv = [];
      for (let i = 1; i <= N; i++) { const x = r(), y = r(), ins = x * x + y * y < 1; if (ins) inside++; if (i <= 4000) { g.fillStyle = ins ? c.main : c.warn; g.fillRect(5 + x * side - 1, 5 + (1 - y) * side - 1, 2, 2); } if (Math.abs(Math.log10(i) * 20 - Math.round(Math.log10(i) * 20)) < 1e-9 || i === N || (i & (i - 1)) === 0) conv.push([Math.log10(i), 4 * inside / i]); }
      const est = 4 * inside / N, p = inside / N, se = 4 * Math.sqrt(p * (1 - p) / N);
      const vc = QSim.view(cvC, 0.45), f = QSim.frame(vc, { x0: 0, x1: Math.max(2, Math.log10(N)), y0: 2.4, y1: 3.9, xl: "log₁₀ N", yl: "추정값" }); f.axes();
      f.fn((x) => Math.PI + 4 * Math.sqrt(0.785 * 0.215 / 10 ** x), c.soft, 1.5); f.fn((x) => Math.PI - 4 * Math.sqrt(0.785 * 0.215 / 10 ** x), c.soft, 1.5);
      f.path([[0, Math.PI], [10, Math.PI]], c.ink3, 1, [4, 3]); f.path(conv, c.main, 2);
      S.out(`점 ${N.toLocaleString()}개 (위 그림은 처음 4000개까지): 원 안 ${inside.toLocaleString()}개\nπ 추정 = ${est.toFixed(5)} ± ${se.toFixed(5)} (표준오차), 참값과의 차이 ${(est - Math.PI).toFixed(5)}\n아래: N에 따른 추정값(파랑)과 ±1/√N 띠. 정확도 한 자리 = 표본 100배`);
    }
    S.$(".new").addEventListener("click", () => { seed = (seed * 17 + 5) % 99991; draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 다항식 차수와 과적합 (04-02) */
  (() => {
    const S = QSim.card("lab-p17-overfit"); if (!S) return;
    const [cvF, cvE] = S.$$("canvas"); let seed = 11;
    const truth = (x) => Math.sin(2.5 * x) + 0.3 * x;
    function fit(xs, ys, d) { const A = Array.from({ length: d + 1 }, (_, i) => Array.from({ length: d + 1 }, (_, j) => xs.reduce((s, x) => s + x ** (i + j), 0))); const b = Array.from({ length: d + 1 }, (_, i) => xs.reduce((s, x, k) => s + ys[k] * x ** i, 0)); return solve(A, b); }
    const ev = (cf, x) => cf.reduce((s, a, i) => s + a * x ** i, 0);
    function draw() {
      const c = C(), d = S.val("deg"), sd = S.val("noise"), n = S.val("n"), r = rng(seed);
      const xs = Array.from({ length: n }, (_, i) => -1 + 2 * (i + 0.5) / n + 0.04 * gauss(r)), ys = xs.map((x) => truth(x) + sd * gauss(r));
      const xt = Array.from({ length: 200 }, () => -1 + 2 * r()), yt = xt.map((x) => truth(x) + sd * gauss(r));
      const rmse = (cf, X, Y) => Math.sqrt(X.reduce((s, x, i) => s + (Y[i] - ev(cf, x)) ** 2, 0) / X.length);
      const cf = fit(xs, ys, Math.min(d, n - 1));
      const vf = QSim.view(cvF, 0.45), f = QSim.frame(vf, { x0: -1.05, x1: 1.05, y0: -2.5, y1: 2.5, xl: "x" }); f.axes();
      xt.forEach((x, i) => f.dot(x, yt[i], c.soft, 2)); f.fn(truth, c.ink3, 1.2, [4, 3]); f.fn((x) => Math.max(-3, Math.min(3, ev(cf, x))), c.main, 2.2, null, 600); xs.forEach((x, i) => f.dot(x, ys[i], c.warn, 4));
      const tr = [], te = []; for (let k = 0; k < Math.min(12, n); k++) { const q = fit(xs, ys, k); tr.push([k, Math.log10(rmse(q, xs, ys) + 1e-6)]); te.push([k, Math.log10(rmse(q, xt, yt) + 1e-6)]); }
      const ve = QSim.view(cvE, 0.38), fe = QSim.frame(ve, { x0: 0, x1: 11, y0: -3, y1: 1.5, xl: "차수", yl: "log₁₀ RMSE" }); fe.axes();
      fe.path(tr, c.warn, 2); fe.path(te, c.main, 2); fe.dot(d, tr[Math.min(d, tr.length - 1)][1], c.warn, 5); fe.dot(d, te[Math.min(d, te.length - 1)][1], c.main, 5);
      const bestK = te.reduce((b, p) => (p[1] < b[1] ? p : b))[0];
      S.out(`훈련 점 ${n}개(빨강), 시험 점 200개(연한 점), 잡음 표준편차 ${sd.toFixed(2)}, 참 함수(회색 점선)\n${d}차 다항식: 훈련 RMSE ${rmse(cf, xs, ys).toFixed(3)}, 시험 RMSE ${rmse(cf, xt, yt).toFixed(3)}\n아래: 차수에 따른 훈련(빨강)과 시험(파랑) 오차. 시험 오차가 가장 작은 차수 ≈ ${bestK}`);
    }
    S.$(".new").addEventListener("click", () => { seed = (seed * 13 + 7) % 99991; draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. k-최근접 이웃 분류 (04-01) */
  (() => {
    const S = QSim.card("lab-p17-knn"); if (!S) return;
    const cv = S.$("canvas"); let seed = 5, train, test;
    function gen() { const r = rng(seed), mk = (n) => Array.from({ length: n }, (_, i) => { const cl = i % 2, s = S.val("sep"); return [cl ? s / 2 + 0.8 * gauss(r) : -s / 2 + 0.8 * gauss(r), 0.9 * gauss(r) + (cl ? 0.3 : -0.3), cl]; }); train = mk(80); test = mk(200); }
    const predict = (x, y, k) => { const d = train.map((p) => [(p[0] - x) ** 2 + (p[1] - y) ** 2, p[2]]).sort((a, b) => a[0] - b[0]).slice(0, k); return d.reduce((s, q) => s + q[1], 0) / k > 0.5 ? 1 : 0; };
    function draw() {
      const c = C(), k = S.val("k");
      const v = QSim.view(cv, 0.62), g = v.g, f = QSim.frame(v, { x0: -4, x1: 4, y0: -3, y1: 3, equal: true }); f.axes({ noGrid: true });
      const R = 60; for (let i = 0; i < R; i++) for (let j = 0; j < R * 0.75; j++) { const x = -4 + 8 * (i + 0.5) / R, y = -3 + 6 * (j + 0.5) / (R * 0.75); g.fillStyle = predict(x, y, k) ? "rgba(217,83,79,0.18)" : "rgba(90,100,230,0.18)"; g.fillRect(f.X(-4 + 8 * i / R), f.Y(-3 + 6 * (j + 1) / (R * 0.75)), f.sx * 8 / R + 1, f.sy * 6 / (R * 0.75) + 1); }
      train.forEach(([x, y, cl]) => f.dot(x, y, cl ? c.warn : c.main, 3.5));
      const acc = (set) => set.reduce((s, [x, y, cl]) => s + (predict(x, y, k) === cl ? 1 : 0), 0) / set.length;
      S.out(`k = ${k}: 훈련 정확도 ${(100 * acc(train)).toFixed(1)}%, 시험 정확도 ${(100 * acc(test)).toFixed(1)}% (훈련 80점, 시험 200점)\n색 영역: 그 자리의 새 점을 어느 쪽으로 분류하는지(가장 가까운 k개 훈련 점의 다수결)\n${k === 1 ? "k = 1은 훈련 점을 모두 맞히지만 경계가 들쭉날쭉하다(과적합)" : k > 40 ? "k가 너무 크면 경계가 지나치게 매끈해 구조를 놓친다(과소적합)" : "적당한 k에서 시험 정확도가 가장 높다"}`);
    }
    S.$(".new").addEventListener("click", () => { seed = (seed * 19 + 3) % 99991; gen(); draw(); });
    S.$('[name="sep"]').addEventListener("input", () => { gen(); });
    S.on(draw); QSim.redrawOn(draw); gen(); draw();
  })();
})();
