/* 화학과 화학인공지능기초 탐구 카드 묶음 (화학4)
   경사 하강법, 과적합과 교차검증 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const RED = "#b5562a";

  /* 1. 경사 하강법: 학습률과 반복 횟수 (화학4-01-02) */
  (() => {
    const S = QSim.card("lab-ch4-gd"); if (!S) return;
    const [cv1, cv2] = S.$$("canvas");
    // 메테인~뷰테인의 탄소 수와 끓는점(°C), 모형 ŷ = b + a·n
    const X = [1, 2, 3, 4], Y = [-161.5, -88.6, -42.1, -0.5], N = 4;
    const loss = (b, a) => X.reduce((s, x, i) => s + (b + a * x - Y[i]) ** 2, 0) / N;
    const grad = (b, a) => [X.reduce((s, x, i) => s + 2 * (b + a * x - Y[i]), 0) / N, X.reduce((s, x, i) => s + 2 * (b + a * x - Y[i]) * x, 0) / N];
    const fmt = (v) => Math.abs(v) < 1e5 ? v.toFixed(2) : v.toExponential(2);
    function draw() {
      const c = C(), lr = S.val("lr"), steps = S.val("st");
      let b = 0, a = 0; const path = [[a, b]], Ls = [loss(0, 0)];
      for (let s = 0; s < steps; s++) { const [gb, ga] = grad(b, a); b -= lr * gb; a -= lr * ga; path.push([a, b]); Ls.push(loss(b, a)); }
      // 손실 지형 (a, b) 평면
      const v = QSim.view(cv1, 0.62), f = QSim.frame(v, { x0: -20, x1: 80, y0: -260, y1: 40, xl: "기울기 a", yl: "절편 b", pad: 36 });
      const g = v.g, nx = 60, ny = 40;
      for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
        const aa = -20 + (i + 0.5) * 100 / nx, bb = -260 + (j + 0.5) * 300 / ny, t = Math.min(1, Math.log10(loss(bb, aa)) / 5.5);
        g.fillStyle = c.main; g.globalAlpha = 0.05 + 0.5 * (1 - t);
        g.fillRect(f.X(aa - 50 / nx), f.Y(bb + 150 / ny), f.X(aa + 50 / nx) - f.X(aa - 50 / nx) + 1, f.Y(bb - 150 / ny) - f.Y(bb + 150 / ny) + 1);
      }
      g.globalAlpha = 1; f.axes({ noGrid: true });
      const inside = path.filter(([pa, pb]) => pa > -20 && pa < 80 && pb > -260 && pb < 40);
      if (inside.length > 1) f.path(inside, RED, 2);
      f.dot(52.95, -205.55, c.ink, 4);
      if (inside.length) f.dot(inside[inside.length - 1][0], inside[inside.length - 1][1], c.warn, 6);
      // 반복에 따른 손실
      const w = QSim.view(cv2, 0.4), top = Math.max(5, Math.min(12, Math.ceil(Math.log10(Math.max(...Ls)))));
      const f2 = QSim.frame(w, { x0: 0, x1: Math.max(steps, 10), y0: 1, y1: top, xl: "반복 횟수", yl: "log₁₀ 손실", pad: 34 });
      f2.axes();
      f2.path(Ls.map((L, i) => [i, Math.min(top, Math.log10(Math.max(L, 1e-9)))]), c.main, 2);
      const L = Ls[Ls.length - 1], div = !isFinite(L) || L > 1e6;
      S.out(`학습률 ${lr.toFixed(2)}, ${steps}번 반복 (출발 b = 0, a = 0)\n절편 b = ${fmt(b)}, 기울기 a = ${fmt(a)}, 손실 ${isFinite(L) ? L.toPrecision(4) : "∞"}\n최소제곱 해: b = −205.55, a = 52.95, 손실 67.01${div ? "\n→ 손실이 커지기만 한다: 발산" : ""}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 다항식 차수, 과적합, 한 개씩 빼기 교차검증 (화학4-03-02) */
  (() => {
    const S = QSim.card("lab-ch4-cv"); if (!S) return;
    const [cv1, cv2] = S.$$("canvas");
    // 메테인~데케인의 끓는점(°C)과 운데케인(C11) 실제값 196 °C
    const X = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], Y = [-161.5, -88.6, -42.1, -0.5, 36.1, 68.7, 98.4, 125.7, 150.8, 174.1];
    const z = (x) => (x - 5.5) / 3;
    function solve(A, b) {
      const n = A.length, M = A.map((r, i) => [...r, b[i]]);
      for (let i = 0; i < n; i++) {
        let p = i; for (let r = i + 1; r < n; r++) if (Math.abs(M[r][i]) > Math.abs(M[p][i])) p = r;
        [M[i], M[p]] = [M[p], M[i]];
        for (let r = 0; r < n; r++) if (r !== i) { const f = M[r][i] / M[i][i]; for (let c = i; c <= n; c++) M[r][c] -= f * M[i][c]; }
      }
      return M.map((r, i) => r[n] / r[i]);
    }
    function fit(xs, ys, d) {
      const F = xs.map((x) => Array.from({ length: d + 1 }, (_, k) => z(x) ** k));
      const A = [], b = [];
      for (let i = 0; i <= d; i++) { A.push([]); b.push(F.reduce((s, f, t) => s + f[i] * ys[t], 0)); for (let j = 0; j <= d; j++) A[i].push(F.reduce((s, f) => s + f[i] * f[j], 0)); }
      return solve(A, b);
    }
    const pred = (w, x) => w.reduce((s, c, k) => s + c * z(x) ** k, 0);
    function scores(d) {
      const w = fit(X, Y, d);
      const tr = Math.sqrt(X.reduce((s, x, i) => s + (pred(w, x) - Y[i]) ** 2, 0) / X.length);
      let se = 0;
      for (let i = 0; i < X.length; i++) {
        const xs = X.filter((_, j) => j !== i), ys = Y.filter((_, j) => j !== i);
        se += (pred(fit(xs, ys, d), X[i]) - Y[i]) ** 2;
      }
      return { w, tr, cv: Math.sqrt(se / X.length) };
    }
    const ALL = Array.from({ length: 8 }, (_, i) => scores(i + 1));
    function draw() {
      const c = C(), d = S.val("deg"), s = ALL[d - 1];
      const v = QSim.view(cv1, 0.56), f = QSim.frame(v, { x0: 0, x1: 12, y0: -250, y1: 300, xl: "탄소 수", yl: "끓는점 (°C)", pad: 36 });
      f.axes();
      f.fn((x) => pred(s.w, x), c.main, 2.5, null, 400);
      X.forEach((x, i) => f.dot(x, Y[i], c.ink, 4));
      f.dot(11, 196, RED, 5); f.text("운데케인 실제 196 °C", 8.2, 255, RED);
      const w = QSim.view(cv2, 0.36), f2 = QSim.frame(w, { x0: 0.5, x1: 8.5, y0: 0, y1: 26, xl: "차수", yl: "RMSE (°C)", pad: 34 });
      f2.axes();
      f2.path(ALL.map((q, i) => [i + 1, q.tr]), c.ink3, 2);
      f2.path(ALL.map((q, i) => [i + 1, q.cv]), RED, 2);
      f2.dot(d, s.tr, c.ink3, 5); f2.dot(d, s.cv, RED, 6);
      f2.text("훈련", 7.4, Math.max(2, ALL[6].tr + 2), c.ink3); f2.text("교차검증", 6.6, ALL[6].cv + 3, RED);
      S.out(`${d}차 다항식으로 C1~C10 끓는점 맞추기\n훈련 RMSE ${s.tr.toFixed(2)} °C, 한 개씩 빼기 교차검증 RMSE ${s.cv.toFixed(2)} °C\n운데케인(C11) 예측 ${pred(s.w, 11).toFixed(1)} °C (실제 196 °C)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
