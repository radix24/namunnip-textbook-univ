/* 기계12 열전달: 평판의 비정상 열전도와 집중 용량법 (04-01, 04-02) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-biot"); if (!S) return;
  const [c1, c2] = S.$$("canvas"), N = 40, Ti = 200, Tinf = 20, rc = 3.6e6; // ρc (J/m³K), 강철 정도
  let T, t, hist, tEnd;
  const par = () => { const L = S.val("L") / 1000, k = S.val("k"), h = S.val("h"); return { L, k, h, Bi: (h * L) / k, tau: (rc * L) / h }; };
  function reset() {
    const p = par(); T = new Array(N + 1).fill(Ti); t = 0; hist = [[0, Ti, Ti, Ti]];
    tEnd = 4 * p.tau * (1 + p.Bi / 3);
  }
  // 음해법 한 걸음 (Thomas 알고리즘). 0번 마디는 대칭면, N번 마디는 대류면
  function step(dt) {
    const p = par(), dx = p.L / N, a = [], b = [], c = [], d = [];
    for (let i = 0; i <= N; i++) {
      const cap = (rc * dx * (i === 0 || i === N ? 0.5 : 1)) / dt, kw = p.k / dx;
      let lo = i > 0 ? -kw : 0, up = i < N ? -kw : 0, di = cap - lo - up, rhs = cap * T[i];
      if (i === N) { di += p.h; rhs += p.h * Tinf; }
      a.push(lo); b.push(di); c.push(up); d.push(rhs);
    }
    for (let i = 1; i <= N; i++) { const m = a[i] / b[i - 1]; b[i] -= m * c[i - 1]; d[i] -= m * d[i - 1]; }
    T[N] = d[N] / b[N];
    for (let i = N - 1; i >= 0; i--) T[i] = (d[i] - c[i] * T[i + 1]) / b[i];
    t += dt;
  }
  const lumped = (tt) => { const p = par(); return Tinf + (Ti - Tinf) * Math.exp(-tt / p.tau); };
  function draw() {
    const c = QSim.col(), p = par();
    let v = QSim.view(c1, 0.5), f = QSim.frame(v, { x0: 0, x1: p.L * 1000, y0: 0, y1: 220, xl: "x (mm, 0 = 가운데)", yl: "T (°C)", pad: 34 }); f.axes();
    f.path([[0, lumped(t)], [p.L * 1000, lumped(t)]], c.ink3, 2, [5, 4]);
    f.path(T.map((y, i) => [(i / N) * p.L * 1000, y]), c.warn, 2.5);
    f.path([[p.L * 1000, 0], [p.L * 1000, 220]], c.main, 1);
    f.text("유체 20 °C →", p.L * 1000 * 0.98, 75, c.main, "right");
    v = QSim.view(c2, 0.42); f = QSim.frame(v, { x0: 0, x1: tEnd / 60, y0: 0, y1: 220, xl: "t (분)", yl: "T (°C)", pad: 34 }); f.axes();
    f.fn((m) => lumped(m * 60), c.ink3, 2, [5, 4]);
    f.path(hist.map((q) => [q[0] / 60, q[1]]), c.warn, 2);
    f.path(hist.map((q) => [q[0] / 60, q[2]]), c.acc, 2);
    const spread = T[0] - T[N];
    S.out(`Biot 수 Bi = hL/k = ${p.Bi < 0.01 ? p.Bi.toExponential(2) : p.Bi.toFixed(3)} ${p.Bi < 0.1 ? "(< 0.1: 집중 용량법 사용 가능)" : "(≥ 0.1: 내부 온도 차를 무시할 수 없음)"}\n시간 상수 τ = ρcL/h = ${(p.tau / 60).toFixed(1)} 분,  t = ${(t / 60).toFixed(1)} 분\n가운데 ${T[0].toFixed(1)} °C, 표면 ${T[N].toFixed(1)} °C (차 ${spread.toFixed(1)} °C), 집중 용량법 예측 ${lumped(t).toFixed(1)} °C`);
  }
  const L = QSim.loop((dt) => {
    const dts = (tEnd / 10) * dt / 4;
    for (let i = 0; i < 4; i++) step(dts);
    hist.push([t, T[0], T[N]]);
    draw();
    return t < tEnd;
  }).watch(S.root);
  const setBtn = QSim.playButton(S.$(".play"), L, () => { if (t >= tEnd) reset(); });
  S.$(".reset").addEventListener("click", () => { L.stop(); setBtn(); reset(); draw(); });
  S.on(() => { L.stop(); setBtn(); reset(); draw(); });
  QSim.redrawOn(draw); reset(); draw();
})();

/* 기계12 6단원: 평행류와 대향류 열교환기의 온도 분포 (06-02) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-hx"); if (!S) return;
  const [cv] = S.$$("canvas");
  function draw() {
    const c = QSim.col(), Ch = S.val("mh") * 4.18, Cc = S.val("mc") * 4.18, UA = S.val("UA"), counter = S.val("type") === "counter";
    const Thi = 90, Tci = 20, Cmin = Math.min(Ch, Cc), Cr = Cmin / Math.max(Ch, Cc), N = UA / Cmin;
    const eps = counter ? (Math.abs(1 - Cr) < 1e-9 ? N / (1 + N) : (1 - Math.exp(-N * (1 - Cr))) / (1 - Cr * Math.exp(-N * (1 - Cr)))) : (1 - Math.exp(-N * (1 + Cr))) / (1 + Cr);
    const Q = eps * Cmin * (Thi - Tci), Tho = Thi - Q / Ch, Tco = Tci + Q / Cc;
    // 길이 방향 분포: 국소 dQ = (UA dx)(Th − Tc)를 작은 칸으로 적분 (대향류는 찬 유체 출구 온도를 이미 알므로 x = 0에서 함께 출발)
    const n = 200, ph = [], pc = []; let Th = Thi, Tc = counter ? Tco : Tci;
    for (let i = 0; i <= n; i++) {
      ph.push([i / n, Th]); pc.push([i / n, Tc]);
      const dq = (UA / n) * (Th - Tc);
      Th -= dq / Ch; Tc += counter ? -dq / Cc : dq / Cc;
    }
    const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: 0, x1: 1, y0: 10, y1: 100, xl: "길이 위치 (0 = 뜨거운 유체 입구)", yl: "T (°C)", pad: 34 });
    f.axes();
    f.path(ph, c.warn, 2.5); f.path(pc, c.main, 2.5);
    f.arrow(0.05, 95, 0.12, 0, c.warn, "뜨거운"); if (counter) f.arrow(0.95, 15, -0.12, 0, c.main, "찬"); else f.arrow(0.05, 15, 0.12, 0, c.main, "찬");
    const d1 = counter ? Thi - Tco : Thi - Tci, d2 = counter ? Tho - Tci : Tho - Tco, lm = Math.abs(d1 - d2) < 1e-6 ? d1 : (d1 - d2) / Math.log(d1 / d2);
    S.out(`${counter ? "대향류" : "평행류"}: C_h = ${Ch.toFixed(2)}, C_c = ${Cc.toFixed(2)} kW/K, UA = ${UA} kW/K → NTU = ${N.toFixed(2)}, C_r = ${Cr.toFixed(2)}\n유용도 ε = ${eps.toFixed(3)}, 열전달률 ${Q.toFixed(1)} kW\n뜨거운 유체 90 → ${Tho.toFixed(1)} °C (빨강), 찬 유체 20 → ${Tco.toFixed(1)} °C (파랑), LMTD ${lm.toFixed(1)} °C (UA × LMTD = ${(UA * lm).toFixed(1)} kW)`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();

/* 기계12 열전달: 2차원 정상 전도의 Gauss-Seidel 반복 (03-02) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-fdm"); if (!S) return;
  const [cv] = S.$$("canvas");
  function solve(N, top, left, right, bottom, iters) {
    const T = [...Array(N)].map(() => new Array(N).fill(0));
    for (let j = 0; j < N; j++) { T[0][j] = top; T[N - 1][j] = bottom; }
    for (let i = 0; i < N; i++) { T[i][0] = left; T[i][N - 1] = right; }
    T[0][0] = (top + left) / 2; T[0][N - 1] = (top + right) / 2; T[N - 1][0] = (bottom + left) / 2; T[N - 1][N - 1] = (bottom + right) / 2;
    let d = 0;
    for (let k = 0; k < iters; k++) {
      d = 0;
      for (let i = 1; i < N - 1; i++) for (let j = 1; j < N - 1; j++) { const nw = (T[i - 1][j] + T[i + 1][j] + T[i][j - 1] + T[i][j + 1]) / 4; d = Math.max(d, Math.abs(nw - T[i][j])); T[i][j] = nw; }
    }
    return { T, d };
  }
  function draw() {
    const c = QSim.col(), n = S.val("n"), N = n + 2, it = S.val("it"), top = S.val("top"), left = S.val("left");
    const { T, d } = solve(N, top, left, 0, 0, it);
    const v = QSim.view(cv, 1), g = v.g, W = v.W, H = v.H, s = Math.min(W, H) * 0.9, x0 = (W - s) / 2, y0 = (H - s) / 2, cs = s / N;
    const maxT = Math.max(top, left, 1);
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const t = Math.max(0, Math.min(1, T[i][j] / maxT));
      g.fillStyle = `rgb(${Math.round(40 + 215 * t)},${Math.round(70 + 60 * (1 - Math.abs(t - 0.5) * 2))},${Math.round(230 - 200 * t)})`;
      g.fillRect(x0 + j * cs, y0 + i * cs, cs + 0.5, cs + 0.5);
    }
    if (N <= 9) { g.fillStyle = "#fff"; g.font = `${Math.max(10, cs * 0.28)}px sans-serif`; g.textAlign = "center"; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) g.fillText(T[i][j].toFixed(1), x0 + (j + 0.5) * cs, y0 + (i + 0.6) * cs); }
    const mid = (N - 1) / 2, center = N % 2 === 1 ? T[mid][mid] : (T[Math.floor(mid)][Math.floor(mid)] + T[Math.ceil(mid)][Math.ceil(mid)] + T[Math.floor(mid)][Math.ceil(mid)] + T[Math.ceil(mid)][Math.floor(mid)]) / 4;
    const exact = top / 4 + left / 4; // 겹침: 한 변만 θ면 가운데 θ/4
    S.out(`안쪽 절점 ${n}×${n}, Gauss-Seidel ${it}회, 마지막 회의 최대 변화 ${d.toExponential(1)} °C\n윗변 ${top} °C, 왼쪽 변 ${left} °C, 나머지 0 °C\n가운데 온도 ${center.toFixed(2)} °C, 겹침으로 구한 참값 ${exact.toFixed(2)} °C (차이 ${(center - exact).toFixed(2)})`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();
