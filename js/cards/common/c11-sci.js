/* 공통11 실습 카드 묶음: 배열 저장 순서, 가우스 소거 단계, 미분방정식 수치해, 자료 맞추기 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const mono = () => getComputedStyle(document.documentElement).getPropertyValue("--f-mono") || "monospace";

  /* 1. 행 우선과 열 우선 (01-03) */
  (() => {
    const S = QSim.card("lab-c11-order"); if (!S) return;
    const cv = S.$("canvas");
    let k = 0;
    const seq = () => {
      const m = S.val("m"), n = S.val("n"), inner = S.val("inner"), out = [];
      if (inner === "i") { for (let j = 0; j < n; j++) for (let i = 0; i < m; i++) out.push([i, j]); }
      else { for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) out.push([i, j]); }
      return out;
    };
    const addr = (i, j) => { const m = S.val("m"), n = S.val("n"); return S.val("lang") === "f" ? i + j * m : i * n + j; };
    function draw() {
      const c = C(), m = S.val("m"), n = S.val("n"), f = S.val("lang") === "f", q = seq(), N = m * n; k = Math.min(k, N);
      const v = QSim.view(cv, 0.62), g = v.g, gw = Math.min(v.W * 0.45, n * 44), cw = gw / n, ch = Math.min(34, (v.H * 0.55) / m);
      const done = new Map(); q.slice(0, k).forEach(([i, j], t) => done.set(i + "," + j, t));
      g.font = "11px " + mono(); g.textAlign = "center";
      for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) {
        const x = 10 + j * cw, y = 22 + i * ch, t = done.get(i + "," + j);
        g.fillStyle = t === undefined ? c.card : t === k - 1 ? c.acc : c.soft; g.fillRect(x, y, cw - 2, ch - 2); g.strokeStyle = c.rule; g.strokeRect(x, y, cw - 2, ch - 2);
        g.fillStyle = c.ink; g.fillText(f ? `${i + 1},${j + 1}` : `${i},${j}`, x + cw / 2 - 1, y + ch / 2 + 4);
      }
      g.textAlign = "left"; g.fillStyle = c.ink2; g.fillText(f ? "A(i, j), 포트란 (1부터)" : "A[i][j], C (0부터)", 10, 14);
      const my = 22 + m * ch + 26, sw = (v.W - 20) / N, sh = Math.min(30, v.H - my - 30);
      g.fillText("메모리 (주소 순서)", 10, my - 8);
      const order = Array(N); for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) order[addr(i, j)] = [i, j];
      g.textAlign = "center";
      order.forEach(([i, j], a) => {
        const x = 10 + a * sw, t = done.get(i + "," + j);
        g.fillStyle = t === undefined ? c.card : t === k - 1 ? c.acc : c.soft; g.fillRect(x, my, sw - 1, sh); g.strokeStyle = c.rule; g.strokeRect(x, my, sw - 1, sh);
        if (sw > 22) { g.fillStyle = c.ink; g.fillText(f ? `${i + 1},${j + 1}` : `${i},${j}`, x + sw / 2, my + sh / 2 + 4); }
      });
      g.textAlign = "left";
      let jumps = 0; for (let t = 1; t < k; t++) if (Math.abs(addr(...q[t]) - addr(...q[t - 1])) !== 1) jumps++;
      const ok = (f && S.val("inner") === "i") || (!f && S.val("inner") === "j");
      const stride = f ? (S.val("inner") === "i" ? 1 : m) : (S.val("inner") === "j" ? 1 : n);
      S.out(`${f ? "포트란: 열 우선" : "C: 행 우선"}, 안쪽 반복 = ${S.val("inner") === "i" ? "행 번호 i" : "열 번호 j"}\n${k} / ${N}번째 원소, 한 걸음마다 주소가 ${stride}칸씩 움직임, 건너뛴 횟수 ${jumps}\n${ok ? "메모리를 차례로 읽는다 (빠름)" : "메모리를 건너뛰며 읽는다 (큰 배열에서 느림)"}`);
    }
    let acc = 0;
    const L = QSim.loop((dt) => { acc += dt; if (acc > 0.35) { acc = 0; if (k >= S.val("m") * S.val("n")) return false; k++; draw(); } return true; }).watch(S.root);
    QSim.playButton(S.$(".play"), L, () => { if (k >= S.val("m") * S.val("n")) k = 0; });
    S.on(() => { k = 0; draw(); }); QSim.redrawOn(draw); k = 0; draw();
  })();

  /* 2. 가우스 소거 단계 (05-01) */
  (() => {
    const S = QSim.card("lab-c11-gauss"); if (!S) return;
    const cv = S.$("canvas");
    const SYS = {
      ex: [[[2, 1, -1], [-3, -1, 2], [-2, 1, 2]], [8, -11, -3]],
      tiny: [[[1e-20, 1], [1, 1]], [1, 2]],
      four: [[[4, -2, 1, 3], [3, 6, -4, 2], [2, 1, 8, -5], [1, -3, 2, 7]], [15, 11, 8, 29]]
    };
    let steps = [], k = 0;
    function build() {
      const [A0, b0] = SYS[S.val("sys")], piv = S.val("piv"), n = b0.length;
      const A = A0.map((r) => r.slice()), b = b0.slice(); steps = [[A.map((r) => r.slice()), b.slice(), "처음 첨가 행렬", -1, -1]];
      for (let c = 0; c < n - 1; c++) {
        if (piv) {
          let p = c; for (let i = c + 1; i < n; i++) if (Math.abs(A[i][c]) > Math.abs(A[p][c])) p = i;
          if (p !== c) { [A[c], A[p]] = [A[p], A[c]]; [b[c], b[p]] = [b[p], b[c]]; steps.push([A.map((r) => r.slice()), b.slice(), `피벗팅: ${c + 1}행과 ${p + 1}행 맞바꿈 (|a|가 가장 큰 행을 위로)`, c, c]); }
        }
        for (let i = c + 1; i < n; i++) {
          const m = A[i][c] / A[c][c];
          for (let j = c; j < n; j++) A[i][j] -= m * A[c][j];
          b[i] -= m * b[c];
          steps.push([A.map((r) => r.slice()), b.slice(), `${i + 1}행 ← ${i + 1}행 − (${fmt(m)}) × ${c + 1}행`, i, c]);
        }
      }
      const x = Array(n).fill(0);
      for (let i = n - 1; i >= 0; i--) { let s = b[i]; for (let j = i + 1; j < n; j++) s -= A[i][j] * x[j]; x[i] = s / A[i][i]; }
      steps.push([A.map((r) => r.slice()), b.slice(), "후진 대입: x = [" + x.map((t) => fmt(t)).join(", ") + "]", -1, -1, x]);
      k = 0;
    }
    function fmt(t) { if (t === 0) return "0"; const a = Math.abs(t); return a >= 1e5 || a < 1e-3 ? t.toExponential(2) : String(+t.toFixed(4)); }
    function draw() {
      const c = C(), [A, b, msg, ri, ci, x] = steps[k], n = b.length;
      const v = QSim.view(cv, 0.12 + 0.09 * n), g = v.g, cw = Math.min(90, (v.W - 30) / (n + 1.4)), rh = Math.min(30, (v.H - 20) / n);
      g.font = "12px " + mono(); g.textAlign = "right";
      for (let i = 0; i < n; i++) {
        const y = 14 + i * rh;
        if (i === ri) { g.fillStyle = c.soft; g.fillRect(4, y - 2, cw * (n + 1.4), rh - 2); }
        for (let j = 0; j <= n; j++) {
          const val = j < n ? A[i][j] : b[i], x0 = 10 + (j + (j === n ? 0.4 : 0)) * cw + cw - 8;
          g.fillStyle = j < n && j < i && Math.abs(val) < 1e-12 ? c.ink3 : j === ci && i === ci ? c.warn : c.ink;
          g.fillText(fmt(Math.abs(val) < 1e-14 && j < i ? 0 : val), x0, y + rh / 2 + 4);
        }
      }
      g.strokeStyle = c.ink3; g.beginPath(); const sx = 10 + n * cw + cw * 0.2; g.moveTo(sx, 10); g.lineTo(sx, 10 + n * rh); g.stroke();
      g.textAlign = "left";
      let extra = "";
      if (x && S.val("sys") === "tiny") extra = S.val("piv") ? "\n피벗팅으로 x ≈ 1, y ≈ 1 (올바름)" : "\n피벗팅 없이 x = 0: 1e20배한 행을 빼며 정보가 사라졌다";
      S.out(`${k + 1} / ${steps.length}단계: ${msg}${extra}`);
    }
    S.$(".next").addEventListener("click", () => { if (k < steps.length - 1) { k++; draw(); } });
    S.$(".reset").addEventListener("click", () => { k = 0; draw(); });
    S.on(() => { build(); draw(); }); QSim.redrawOn(draw); build(); draw();
  })();

  /* 3. 진동자: 오일러, 오일러-크로머, RK4 (05-02) */
  (() => {
    const S = QSim.card("lab-c11-ode"); if (!S) return;
    const [cvT, cvP] = S.$$("canvas");
    function solve(method, h, T) {
      let x = 1, v = 0; const pts = [[0, x, v]];
      const f = (s) => [s[1], -s[0]];
      for (let t = 0; t < T - 1e-9; t += h) {
        if (method === "euler") { const nx = x + h * v, nv = v - h * x; x = nx; v = nv; }
        else if (method === "ec") { v -= h * x; x += h * v; }
        else { [x, v] = QSim.rk4((_, s) => f(s), t, [x, v], h); }
        pts.push([t + h, x, v]);
      }
      return pts;
    }
    function draw() {
      const c = C(), h = S.val("h"), T = 20, M = { euler: ["오일러", c.warn], ec: ["오일러-크로머", c.acc], rk4: ["RK4", c.main] };
      const use = Object.keys(M).filter((k) => S.val(k));
      const res = {}; use.forEach((k) => (res[k] = solve(k, h, T)));
      const amp = Math.max(1.2, ...use.map((k) => Math.max(...res[k].map((p) => Math.abs(p[1]))))) * 1.05;
      const vt = QSim.view(cvT, 0.42), ft = QSim.frame(vt, { x0: 0, x1: T, y0: -amp, y1: amp, xl: "t", yl: "x" }); ft.axes();
      ft.fn(Math.cos, c.ink3, 1.5, [5, 4]);
      use.forEach((k) => ft.path(res[k].map((p) => [p[0], p[1]]), M[k][1], 2));
      const vp = QSim.view(cvP, 0.5), R = Math.min(amp, 3), fp = QSim.frame(vp, { x0: -R, x1: R, y0: -R, y1: R, xl: "x", yl: "v", equal: true }); fp.axes({ noGrid: true });
      fp.fn((u) => Math.sqrt(Math.max(0, 1 - u * u)), c.ink3, 1, [4, 3]); fp.fn((u) => -Math.sqrt(Math.max(0, 1 - u * u)), c.ink3, 1, [4, 3]);
      use.forEach((k) => fp.path(res[k].map((p) => [p[1], p[2]]), M[k][1], 1.5));
      const lines = use.map((k) => { const p = res[k][res[k].length - 1], E = 0.5 * (p[1] ** 2 + p[2] ** 2); return `${M[k][0]}: x(20) = ${p[1].toFixed(5)}, 에너지 ${E.toFixed(5)} (처음 0.5의 ${(E / 0.5).toFixed(3)}배)`; });
      S.out(`x'' = −x, x(0) = 1, v(0) = 0, h = ${h}, 걸음 ${Math.round(T / h)}번\n참값 x(20) = cos 20 = ${Math.cos(20).toFixed(5)}\n${lines.join("\n") || "방법을 하나 이상 고르세요"}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 지수 자료 맞추기 (05-03) */
  (() => {
    const S = QSim.card("lab-c11-fit"); if (!S) return;
    const cv = S.$("canvas");
    let seed = 3;
    const rng = (s) => () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
    const gauss = (r) => { let u = 0; while (!u) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); };
    const lin = (x, y) => { const n = x.length, xm = x.reduce((a, b) => a + b) / n, ym = y.reduce((a, b) => a + b) / n; let sxy = 0, sxx = 0, syy = 0; x.forEach((xi, i) => { sxy += (xi - xm) * (y[i] - ym); sxx += (xi - xm) ** 2; syy += (y[i] - ym) ** 2; }); const b = sxy / sxx, a = ym - b * xm; let ss = 0; x.forEach((xi, i) => (ss += (y[i] - a - b * xi) ** 2)); return [a, b, 1 - ss / syy]; };
    function draw() {
      const c = C(), A0 = 10, k0 = 0.5, noise = S.val("noise") / 100, npt = S.val("npt"), logy = S.val("logy"), r = rng(seed);
      const t = [], y = []; for (let i = 0; i < npt; i++) { const ti = 6 * i / (npt - 1); t.push(ti); y.push(Math.max(0.02, A0 * Math.exp(-k0 * ti) * (1 + noise * gauss(r)))); }
      const [a, b, r2] = lin(t, y.map(Math.log)), A = Math.exp(a), k = -b;
      const [la, lb, lr2] = lin(t, y);
      const v = QSim.view(cv, 0.5);
      const f = logy ? QSim.frame(v, { x0: 0, x1: 6.5, y0: Math.log10(0.02), y1: Math.log10(20), xl: "t", yl: "log₁₀ y" }) : QSim.frame(v, { x0: 0, x1: 6.5, y0: -3, y1: 12, xl: "t", yl: "y" });
      f.axes();
      const Y = (u) => (logy ? (u > 0 ? Math.log10(u) : NaN) : u);
      if (S.val("showlin")) f.fn((u) => Y(la + lb * u), c.ink3, 2, [6, 4]);
      f.fn((u) => Y(A * Math.exp(-k * u)), c.main, 2.5);
      t.forEach((ti, i) => f.dot(ti, Y(y[i]), c.warn, 4));
      S.out(`참 모형 y = 10 e^(−0.5 t), 잡음 ${S.val("noise")}%, 점 ${npt}개\nln y를 직선으로 맞춤: A = ${A.toFixed(3)}, k = ${k.toFixed(4)}, 반감기 ${(Math.LN2 / k).toFixed(3)} (참 1.386), R² = ${r2.toFixed(4)}${S.val("showlin") ? `\n그냥 직선 (회색 점선): y = ${la.toFixed(2)} + (${lb.toFixed(3)}) t, R² = ${lr2.toFixed(4)}, t = 6에서 ${(la + lb * 6).toFixed(2)}` : ""}`);
    }
    S.$(".new").addEventListener("click", () => { seed = (seed * 7 + 11) % 100000; draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
