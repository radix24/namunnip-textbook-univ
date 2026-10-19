/* 기계21 전자기학및응용: Laplace 방정식의 반복 풀이 (06-01) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-laplace"); if (!S) return;
  const [cv] = S.$$("canvas");
  const N = 20, W = 2 / (1 + Math.sin(Math.PI / N)); // SOR 최적 가속 계수
  function solve(method, iters, geo) {
    const V = Array.from({ length: N + 1 }, (_, j) => new Array(N + 1).fill(j === N ? 100 : 0));
    const elec = (i, j) => geo === "elec" && Math.abs(i - N / 2) <= 2 && Math.abs(j - N / 2) <= 2;
    if (geo === "elec") for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) if (elec(i, j)) V[j][i] = 50;
    let last = 0;
    for (let k = 0; k < iters; k++) {
      let mx = 0;
      const src = method === "jacobi" ? V.map((r) => r.slice()) : V, w = method === "sor" ? W : 1;
      for (let j = 1; j < N; j++) for (let i = 1; i < N; i++) {
        if (elec(i, j)) continue;
        const nv = (src[j][i - 1] + src[j][i + 1] + src[j - 1][i] + src[j + 1][i]) / 4, d = w * (nv - V[j][i]);
        V[j][i] += d; mx = Math.max(mx, Math.abs(d));
      }
      last = mx;
    }
    return { V, last, elec };
  }
  function draw() {
    const c = QSim.col(), m = S.val("m"), it = S.val("it"), geo = S.val("geo");
    const { V, last, elec } = solve(m, it, geo);
    const v = QSim.view(cv, 0.62), f = QSim.frame(v, { x0: -0.5, x1: N + 0.5, y0: -0.5, y1: N + 0.5, equal: true, pad: 8 }), g = v.g;
    for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) {
      const t = Math.max(0, Math.min(1, V[j][i] / 100));
      g.fillStyle = `hsl(${240 - 240 * t}, 65%, ${45 + 10 * (1 - Math.abs(2 * t - 1))}%)`;
      const x = f.X(i - 0.5), y = f.Y(j + 0.5), s = f.X(i + 0.5) - x;
      g.fillRect(x, y, s + 0.5, s + 0.5);
    }
    if (geo === "elec") f.path([[N / 2 - 2.5, N / 2 - 2.5], [N / 2 + 2.5, N / 2 - 2.5], [N / 2 + 2.5, N / 2 + 2.5], [N / 2 - 2.5, N / 2 + 2.5], [N / 2 - 2.5, N / 2 - 2.5]], c.ink, 2);
    f.dot(N / 2, 15, c.ink, 4); f.text("P", N / 2 + 0.6, 15.3, c.ink);
    const name = { jacobi: "Jacobi", gs: "Gauss-Seidel", sor: `SOR (ω = ${W.toFixed(3)})` }[m];
    S.out(`${name}, 반복 ${it}회, 경계: 윗변 100 V, 나머지 0 V${geo === "elec" ? ", 가운데 전극 50 V" : ""}\n${geo === "elec" ? `점 P(가운데 위) 전위 ${V[15][N / 2].toFixed(2)} V` : `판 중심 전위 ${V[N / 2][N / 2].toFixed(2)} V (정확한 값 25 V), 점 P ${V[15][N / 2].toFixed(2)} V`}\n마지막 반복의 최대 변화 ${last.toExponential(2)} V${last < 1e-3 ? " (수렴)" : ""}`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();
