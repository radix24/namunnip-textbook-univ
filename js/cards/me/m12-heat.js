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
