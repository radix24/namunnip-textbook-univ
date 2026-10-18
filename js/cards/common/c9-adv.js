/* 공통9 실습 카드 묶음: 푸리에 변환, 파동방정식, 열방정식, 유수 정리, 등각사상, 가우스-자이델, 다익스트라·크러스컬 */
(() => {
  "use strict";
  const C = () => QSim.col();
  /* 복소수 */
  const cx = (re, im = 0) => ({ re, im });
  const add = (a, b) => cx(a.re + b.re, a.im + b.im), sub = (a, b) => cx(a.re - b.re, a.im - b.im);
  const mul = (a, b) => cx(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
  const div = (a, b) => { const d = b.re * b.re + b.im * b.im; return cx((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); };
  const cexp = (a) => cx(Math.exp(a.re) * Math.cos(a.im), Math.exp(a.re) * Math.sin(a.im));
  const csin = (a) => cx(Math.sin(a.re) * Math.cosh(a.im), Math.cos(a.re) * Math.sinh(a.im));
  const fmtc = (z) => `${z.re.toFixed(4)} ${z.im < 0 ? "−" : "+"} ${Math.abs(z.im).toFixed(4)}i`;

  /* 1. 푸리에 변환: 폭과 스펙트럼 (01-02) */
  (() => {
    const S = QSim.card("lab-c9-transform"); if (!S) return;
    const [c1, c2] = S.$$("canvas");
    function draw() {
      const c = C(), a = S.val("a"), kind = S.val("kind"), k = Math.sqrt(2 / Math.PI);
      const f = kind === "rect" ? (x) => (Math.abs(x) < a ? 1 : 0) : (x) => Math.exp(-(x * x) / (2 * a * a));
      const F = kind === "rect" ? (w) => (Math.abs(w) < 1e-9 ? k * a : (k * Math.sin(a * w)) / w) : (w) => a * Math.exp(-(a * a * w * w) / 2);
      let v = QSim.view(c1, 0.4), fr = QSim.frame(v, { x0: -6, x1: 6, y0: -0.2, y1: 1.2, xl: "x", yl: "f(x)" }); fr.axes(); fr.fn(f, c.main, 2.5, null, 1200);
      const top = kind === "rect" ? k * 3 : 3;
      v = QSim.view(c2, 0.4); fr = QSim.frame(v, { x0: -10, x1: 10, y0: -0.4 * top / 2, y1: top * 1.05, xl: "w", yl: "f̂(w)" }); fr.axes(); fr.fn(F, c.acc, 2.5, null, 1200);
      const wt = kind === "rect" ? Math.PI / a : 1 / a;
      fr.path([[wt, -0.2], [wt, top]], c.ink3, 1, [3, 3]); fr.path([[-wt, -0.2], [-wt, top]], c.ink3, 1, [3, 3]);
      S.out(kind === "rect" ? `사각 펄스, 폭 2a = ${(2 * a).toFixed(2)}: f̂(w) = √(2/π) sin(aw)/w\n첫 0점 w = π/a = ${wt.toFixed(3)} (회색 점선). 폭 × 스펙트럼 폭 = 2a·π/a = 2π로 일정`
        : `가우스 함수, 표준편차 a = ${a.toFixed(2)}: f̂(w) = a e^(−a²w²/2), 즉 스펙트럼도 가우스, 폭 1/a = ${wt.toFixed(3)}\n폭의 곱 a·(1/a) = 1로 일정. 좁은 신호일수록 넓은 진동수가 필요하다`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 달랑베르 해: 줄을 퉁기면 (02-04) */
  (() => {
    const S = QSim.card("lab-c9-wave"); if (!S) return;
    const cv = S.$("canvas"); let t = 0;
    const f0 = (x) => { const p = S.val("p"), kind = S.val("kind"); if (kind === "tri") return x < p ? (0.6 * x) / p : (0.6 * (1 - x)) / (1 - p); return 0.6 * Math.exp(-((x - p) ** 2) / 0.004); };
    const ext = (x) => { let y = ((x % 2) + 2) % 2; return y <= 1 ? f0(y) : -f0(2 - y); }; // 홀함수·주기 2 확장
    function draw() {
      const c = C(), v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: -0.02, x1: 1.02, y0: -0.75, y1: 0.75, pad: 6, xl: "x" }); f.axes({ noGrid: true });
      if (S.val("halves")) { f.fn((x) => 0.5 * ext(x - t), c.acc, 1.5, [5, 3], 500); f.fn((x) => 0.5 * ext(x + t), c.ink3, 1.5, [5, 3], 500); }
      f.fn((x) => 0.5 * (ext(x - t) + ext(x + t)), c.main, 3, null, 500);
      f.dot(0, 0, c.ink, 4); f.dot(1, 0, c.ink, 4);
      S.out(`u(x, t) = ½[f(x − ct) + f(x + ct)], c = 1, 줄 길이 L = 1 (양 끝 고정)\nt = ${t.toFixed(2)} (주기 2L/c = 2)\n주황·회색 점선: 오른쪽·왼쪽으로 가는 두 반쪽 파동. 끝에서 뒤집혀 반사된다`);
    }
    const L = QSim.loop((dt) => { t += dt * 0.4; draw(); }).watch(S.root);
    QSim.playButton(S.$(".play"), L);
    S.$(".reset").addEventListener("click", () => { t = 0; draw(); });
    S.on(() => { t = 0; if (!L.running) draw(); }); QSim.redrawOn(draw); draw();
  })();

  /* 3. 열방정식의 푸리에 급수 해 (02-05) */
  (() => {
    const S = QSim.card("lab-c9-heat"); if (!S) return;
    const [c1, c2] = S.$$("canvas"); let t = 0, b = [];
    const N = 60;
    const init = () => {
      const kind = S.val("kind"), f = kind === "tri" ? (x) => 1 - Math.abs(2 * x - 1) : kind === "box" ? (x) => (x > 0.3 && x < 0.6 ? 1 : 0) : (x) => Math.sin(Math.PI * x) + 0.5 * Math.sin(3 * Math.PI * x);
      b = []; const M = 800;
      for (let n = 1; n <= N; n++) { let s = 0; for (let i = 0; i < M; i++) { const x = (i + 0.5) / M; s += f(x) * Math.sin(n * Math.PI * x); } b.push((2 * s) / M); }
      return f;
    };
    let f0 = init();
    function draw() {
      const c = C(), k = S.val("k"), u = (x) => { let s = 0; for (let n = 1; n <= N; n++) s += b[n - 1] * Math.exp(-k * n * n * Math.PI * Math.PI * t) * Math.sin(n * Math.PI * x); return s; };
      let v = QSim.view(c1, 0.45), f = QSim.frame(v, { x0: 0, x1: 1, y0: -0.6, y1: 1.3, xl: "x", yl: "u" }); f.axes();
      f.fn(f0, c.rule, 1.2, [4, 3], 400); f.fn(u, c.warn, 2.8, null, 300);
      v = QSim.view(c2, 0.32); f = QSim.frame(v, { x0: 0, x1: 13, y0: 0, y1: Math.max(...b.slice(0, 12).map(Math.abs)) * 1.1 + 0.01, xl: "n", yl: "|bₙ e^(−kn²π²t)|" }); f.axes({ noGrid: true });
      const g = v.g; for (let n = 1; n <= 12; n++) { const h = Math.abs(b[n - 1]) * Math.exp(-k * n * n * Math.PI * Math.PI * t); g.fillStyle = c.main; g.fillRect(f.X(n) - 6, f.Y(h), 12, f.Y(0) - f.Y(h)); }
      S.out(`u_t = k u_xx, 양 끝 0도, k = ${k}\nu(x, t) = Σ bₙ e^(−k n²π² t) sin nπx, t = ${t.toFixed(3)}\n가장 높은 온도 ${Math.max(...[...Array(41)].map((_, i) => u(i / 40))).toFixed(3)} · 아래 막대: n이 클수록(울퉁불퉁한 성분일수록) n²에 비례해 빨리 사라진다`);
    }
    const L = QSim.loop((dt) => { t += dt * 0.02 / Math.max(S.val("k"), 0.1); draw(); }).watch(S.root);
    QSim.playButton(S.$(".play"), L);
    S.$(".reset").addEventListener("click", () => { t = 0; draw(); });
    S.on(() => { f0 = init(); t = 0; if (!L.running) draw(); }); QSim.redrawOn(draw); draw();
  })();

  /* 4. 유수 정리 (05-04) */
  (() => {
    const S = QSim.card("lab-c9-residue"); if (!S) return;
    const cv = S.$("canvas"); const cen = { x: 0, y: 0.5 }; let fr = null;
    const I = cx(0, 1);
    const FN = {
      a: { n: "1/(z² + 1)", f: (z) => div(cx(1), add(mul(z, z), cx(1))), poles: [[cx(0, 1), cx(0, -0.5)], [cx(0, -1), cx(0, 0.5)]] },
      b: { n: "(4 − 3z)/(z² − z)", f: (z) => div(sub(cx(4), mul(cx(3), z)), sub(mul(z, z), z)), poles: [[cx(0), cx(-4)], [cx(1), cx(1)]] },
      c: { n: "eᶻ/z²", f: (z) => div(cexp(z), mul(z, z)), poles: [[cx(0), cx(1)]] },
      d: { n: "1/(z⁴ + 1)", f: (z) => div(cx(1), add(mul(mul(z, z), mul(z, z)), cx(1))), poles: [0, 1, 2, 3].map((k) => { const a = Math.PI / 4 + (k * Math.PI) / 2, p = cx(Math.cos(a), Math.sin(a)); return [p, div(cx(1), mul(cx(4), mul(p, mul(p, p))))]; }) }
    };
    function draw() {
      const c = C(), F = FN[S.val("fn")], r = S.val("r");
      const v = QSim.view(cv, 0.75); fr = QSim.frame(v, { x0: -2.2, x1: 2.2, y0: -1.65, y1: 1.65, equal: true, pad: 4, xl: "Re", yl: "Im" }); fr.axes();
      const g = v.g;
      for (let px = 0; px < v.W; px += 6) for (let py = 0; py < v.H; py += 6) { const z = cx(-2.2 + (px - fr.X(-2.2)) / fr.sx, -1.65 + (fr.Y(-1.65) - py) / fr.sy), w = F.f(z), m = Math.hypot(w.re, w.im); g.fillStyle = c.main; g.globalAlpha = Math.min(0.45, Math.log10(1 + m) * 0.3); g.fillRect(px, py, 6, 6); }
      g.globalAlpha = 1;
      const pts = []; for (let i = 0; i <= 200; i++) { const q = (2 * Math.PI * i) / 200; pts.push([cen.x + r * Math.cos(q), cen.y + r * Math.sin(q)]); } fr.path(pts, c.acc, 2.5);
      let inside = cx(0); const ins = [];
      F.poles.forEach(([p, res]) => { const inn = Math.hypot(p.re - cen.x, p.im - cen.y) < r; fr.dot(p.re, p.im, inn ? c.warn : c.ink3, 6); if (inn) { inside = add(inside, res); ins.push(`${fmtc(p)} (유수 ${fmtc(res)})`); } });
      let I0 = cx(0); const n = 4000;
      for (let i = 0; i < n; i++) { const q = (2 * Math.PI * (i + 0.5)) / n, z = cx(cen.x + r * Math.cos(q), cen.y + r * Math.sin(q)), dz = cx((-r * Math.sin(q) * 2 * Math.PI) / n, (r * Math.cos(q) * 2 * Math.PI) / n); I0 = add(I0, mul(F.f(z), dz)); }
      const pred = mul(cx(0, 2 * Math.PI), inside);
      S.out(`f(z) = ${F.n}, 원: 중심 ${cen.x.toFixed(2)} ${cen.y < 0 ? "−" : "+"} ${Math.abs(cen.y).toFixed(2)}i, 반지름 ${r}\n원 안의 극: ${ins.length ? ins.join(", ") : "없음"}\n수치 적분 ∮f dz = ${fmtc(I0)}\n2πi × (유수의 합) = ${fmtc(pred)}   (원의 중심은 끌어 옮길 수 있다. 원이 극 위를 지나면 적분이 정의되지 않는다)`);
    }
    const pos = (e) => { const rr = cv.getBoundingClientRect(); return { x: -2.2 + (e.clientX - rr.left - fr.X(-2.2)) / fr.sx, y: -1.65 + (fr.Y(-1.65) - (e.clientY - rr.top)) / fr.sy }; };
    let dragging = false;
    cv.addEventListener("pointerdown", (e) => { dragging = true; Object.assign(cen, pos(e)); cv.setPointerCapture(e.pointerId); draw(); });
    cv.addEventListener("pointermove", (e) => { if (dragging) { Object.assign(cen, pos(e)); draw(); } });
    cv.addEventListener("pointerup", () => { dragging = false; });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 5. 등각사상 (06-03) */
  (() => {
    const S = QSim.card("lab-c9-mapping"); if (!S) return;
    const [c1, c2] = S.$$("canvas");
    const MAP = {
      sq: { n: "w = z²", f: (z) => mul(z, z), view: 4 },
      exp: { n: "w = eᶻ", f: cexp, view: 5 },
      inv: { n: "w = 1/z", f: (z) => div(cx(1), z), view: 4 },
      mob: { n: "w = (z − i)/(z + i)", f: (z) => div(sub(z, cx(0, 1)), add(z, cx(0, 1))), view: 2.2 },
      sin: { n: "w = sin z", f: csin, view: 4 },
      jou: { n: "w = z + 1/z", f: (z) => add(z, div(cx(1), z)), view: 4 }
    };
    function draw() {
      const c = C(), M = MAP[S.val("map")], x0 = S.val("x0"), x1 = Math.max(S.val("x1"), x0 + 0.2), y0 = S.val("y0"), y1 = Math.max(S.val("y1"), y0 + 0.2), nL = 10;
      let v = QSim.view(c1, 0.7), f = QSim.frame(v, { x0: -3, x1: 3, y0: -2.2, y1: 2.2, equal: true, pad: 4, xl: "x", yl: "y" }); f.axes({ noGrid: true });
      const lines = [];
      for (let i = 0; i <= nL; i++) { const y = y0 + ((y1 - y0) * i) / nL, seg = []; for (let k = 0; k <= 120; k++) seg.push(cx(x0 + ((x1 - x0) * k) / 120, y)); lines.push([seg, c.main]); }
      for (let i = 0; i <= nL; i++) { const x = x0 + ((x1 - x0) * i) / nL, seg = []; for (let k = 0; k <= 120; k++) seg.push(cx(x, y0 + ((y1 - y0) * k) / 120)); lines.push([seg, c.acc]); }
      lines.forEach(([seg, col]) => f.path(seg.map((z) => [z.re, z.im]), col, 1.3));
      const V = M.view; v = QSim.view(c2, 0.7); f = QSim.frame(v, { x0: -V, x1: V, y0: -V * 0.75, y1: V * 0.75, equal: true, pad: 4, xl: "u", yl: "v" }); f.axes({ noGrid: true });
      lines.forEach(([seg, col]) => { let run = []; seg.forEach((z) => { const w = M.f(z); if (isFinite(w.re) && isFinite(w.im) && Math.abs(w.re) < V * 4 && Math.abs(w.im) < V * 4) run.push([w.re, w.im]); else { if (run.length > 1) f.path(run, col, 1.3); run = []; } }); if (run.length > 1) f.path(run, col, 1.3); });
      S.out(`${M.n}: 왼쪽 z평면의 직사각형 격자(가로선 파랑, 세로선 주황)가 오른쪽 w평면으로 옮겨진 모습\n해석적이고 f'(z) ≠ 0인 곳에서는 파란 선과 주황 선이 여전히 직각으로 만난다(등각)` +
        ({ sq: "\nz = 0에서 f' = 0: 원점에서 각이 두 배로 벌어진다", exp: "\n가로선 → 반직선, 세로선 → 원", inv: "\n직선과 원이 원과 직선으로 바뀐다", mob: "\n위쪽 반평면(y > 0)이 단위원판 안으로", sin: "\n반무한 띠 −π/2 < x < π/2, y > 0이 위쪽 반평면으로", jou: "\n원 |z| = 1이 선분 [−2, 2]로 눌린다. 비행기 날개 단면을 만드는 사상" })[S.val("map")]);
    }
    S.$$(".preset").forEach((b) => b.addEventListener("click", () => { b.dataset.r.split(",").forEach((x, i) => { S.$(`[name=${["x0", "x1", "y0", "y1"][i]}]`).value = x; }); S.show(); draw(); }));
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 6. 가우스-자이델 반복 (07-02) */
  (() => {
    const S = QSim.card("lab-c9-gseidel"); if (!S) return;
    const cv = S.$("canvas"); let path = [];
    const SYS = { dom: { n: "10x + y = 12, x + 10y = 21", A: [[10, 1], [1, 10]], b: [12, 21] }, mild: { n: "3x + 2y = 7, x + 2y = 5", A: [[3, 2], [1, 2]], b: [7, 5] }, swap: { n: "x + 10y = 21, 10x + y = 12 (순서를 바꿈)", A: [[1, 10], [10, 1]], b: [21, 12] } };
    const reset = () => { path = [[S.val("x0"), S.val("y0")]]; };
    const step = () => { const s = SYS[S.val("sys")], [x, y] = path[path.length - 1]; const nx = (s.b[0] - s.A[0][1] * y) / s.A[0][0]; path.push([nx, y]); const ny = (s.b[1] - s.A[1][0] * nx) / s.A[1][1]; path.push([nx, ny]); };
    function draw() {
      const c = C(), s = SYS[S.val("sys")], v = QSim.view(cv, 0.7), f = QSim.frame(v, { x0: -1, x1: 4, y0: -1, y1: 4, equal: true, xl: "x", yl: "y" }); f.axes();
      [0, 1].forEach((i) => { const [a, bb] = s.A[i]; f.fn((x) => (s.b[i] - a * x) / bb, i ? c.acc : c.main, 2, null, 50); });
      f.path(path.filter((p) => Math.abs(p[0]) < 1e4 && Math.abs(p[1]) < 1e4), c.warn, 1.5); path.forEach(([x, y]) => f.dot(x, y, c.warn, 3));
      const det = s.A[0][0] * s.A[1][1] - s.A[0][1] * s.A[1][0], ex = [(s.b[0] * s.A[1][1] - s.A[0][1] * s.b[1]) / det, (s.A[0][0] * s.b[1] - s.b[0] * s.A[1][0]) / det];
      const last = path[path.length - 1], dd = s.A.every((r, i) => Math.abs(r[i]) > Math.abs(r[1 - i]));
      S.out(`${s.n}: 정확한 해 (${ex[0].toFixed(4)}, ${ex[1].toFixed(4)}), 대각 우세 ${dd ? "예" : "아니오"}\n반복 ${(path.length - 1) / 2}회: (${last[0].toPrecision(6)}, ${last[1].toPrecision(6)}), 오차 ${Math.hypot(last[0] - ex[0], last[1] - ex[1]).toExponential(2)}\n빨간 지그재그: 첫 식으로 x를, 둘째 식으로 y를 차례로 고치는 경로`);
    }
    S.$(".step").addEventListener("click", () => { step(); draw(); });
    S.$(".reset").addEventListener("click", () => { reset(); draw(); });
    S.on(() => { reset(); draw(); }); QSim.redrawOn(draw); reset(); draw();
  })();

  /* 7. 다익스트라와 크러스컬 (08-02) */
  (() => {
    const S = QSim.card("lab-c9-graph"); if (!S) return;
    const cv = S.$("canvas");
    const V = { A: [0.5, 2.2], B: [2.2, 3.4], C: [2.2, 1.0], D: [4.2, 3.0], E: [4.6, 0.8] };
    const E = [["A", "B", 4], ["A", "C", 2], ["B", "C", 1], ["B", "D", 5], ["C", "D", 8], ["C", "E", 10], ["D", "E", 2]];
    let st;
    const reset = () => {
      const mode = S.val("mode");
      if (mode === "dij") st = { mode, dist: { A: 0, B: Infinity, C: Infinity, D: Infinity, E: Infinity }, prev: {}, done: [], log: ["출발점 A의 거리를 0으로 둔다"] };
      else st = { mode, order: E.slice().sort((a, b) => a[2] - b[2]), i: 0, tree: [], par: { A: "A", B: "B", C: "C", D: "D", E: "E" }, log: ["변을 가중치 순으로 늘어놓는다"] };
    };
    const find = (x) => { while (st.par[x] !== x) x = st.par[x]; return x; };
    const step = () => {
      if (st.mode === "dij") {
        const cand = Object.keys(V).filter((v) => !st.done.includes(v)); if (!cand.length) return;
        const u = cand.reduce((a, b) => (st.dist[a] <= st.dist[b] ? a : b)); st.done.push(u);
        const upd = [];
        E.forEach(([a, b, w]) => { const o = a === u ? b : b === u ? a : null; if (o && !st.done.includes(o) && st.dist[u] + w < st.dist[o]) { st.dist[o] = st.dist[u] + w; st.prev[o] = u; upd.push(`${o}→${st.dist[o]}`); } });
        st.log.push(`${u} 확정 (거리 ${st.dist[u]})${upd.length ? ", 갱신: " + upd.join(", ") : ""}`);
      } else {
        if (st.i >= st.order.length || st.tree.length === 4) return;
        const [a, b, w] = st.order[st.i++];
        if (find(a) !== find(b)) { st.par[find(a)] = find(b); st.tree.push([a, b, w]); st.log.push(`${a}–${b} (${w}) 고름`); } else st.log.push(`${a}–${b} (${w}) 버림: 회로가 생김`);
      }
    };
    function draw() {
      const c = C(), v = QSim.view(cv, 0.62), f = QSim.frame(v, { x0: 0, x1: 5.2, y0: 0.2, y1: 4, equal: true, pad: 6 }), g = v.g;
      E.forEach(([a, b, w]) => {
        let col = c.rule, wd = 2;
        if (st.mode === "dij" && (st.prev[b] === a || st.prev[a] === b) && (st.done.includes(a) || st.done.includes(b))) { col = c.main; wd = 4; }
        if (st.mode === "kru" && st.tree.some((t) => (t[0] === a && t[1] === b))) { col = c.main; wd = 4; }
        f.path([V[a], V[b]], col, wd); f.text(String(w), (V[a][0] + V[b][0]) / 2 + 0.08, (V[a][1] + V[b][1]) / 2 + 0.08, c.ink2);
      });
      Object.entries(V).forEach(([k, [x, y]]) => {
        const done = st.mode === "dij" ? st.done.includes(k) : st.tree.some((t) => t[0] === k || t[1] === k);
        g.fillStyle = done ? c.main : c.card; g.strokeStyle = c.main; g.lineWidth = 2; g.beginPath(); g.arc(f.X(x), f.Y(y), 15, 0, 7); g.fill(); g.stroke();
        g.fillStyle = done ? c.card : c.ink; g.font = "bold 13px sans-serif"; g.textAlign = "center"; g.fillText(k, f.X(x), f.Y(y) + 4.5);
        if (st.mode === "dij") f.text(st.dist[k] === Infinity ? "∞" : String(st.dist[k]), x, y + 0.38, c.acc, "center");
      });
      const tot = st.mode === "kru" ? st.tree.reduce((s, t) => s + t[2], 0) : null;
      S.out(st.log.slice(-6).join("\n") + (st.mode === "kru" ? `\n고른 변 ${st.tree.length}개, 합 ${tot}${st.tree.length === 4 ? " (완성: 꼭짓점 5개 → 변 4개)" : ""}` : (st.done.length === 5 ? `\n완료: 굵은 선이 A에서 각 점까지의 최단 경로 트리` : "")));
    }
    S.$(".step").addEventListener("click", () => { step(); draw(); });
    S.$(".reset").addEventListener("click", () => { reset(); draw(); });
    S.on(() => { reset(); draw(); }); QSim.redrawOn(draw); reset(); draw();
  })();
})();
