/* 수학21 탐구: 도박꾼 파산 — 0..N 위 랜덤워크 경로, 경험적 도달 확률·평균 시간과 선택 정지 정리의 공식 비교 */
(() => {
  "use strict";
  const S = MKit.setup("card-m21-ruin", 0.6, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const rng = (seed) => { let s = seed | 0; return () => { s = (s + 0x6d2b79f5) | 0; let r = Math.imul(s ^ (s >>> 15), 1 | s); r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r; return (((r ^ (r >>> 14)) >>> 0) + 0.5) / 4294967296; }; };
  const DRAWN = 20;
  function theory(p, i, N) {
    const q = 1 - p;
    if (Math.abs(p - 0.5) < 1e-9) return { h: i / N, T: i * (N - i) };
    const r = q / p, h = (1 - r ** i) / (1 - r ** N);
    return { h, T: (h * N - i) / (p - q) };
  }
  function draw() {
    const iEl = k.$('[name="i"]'), N = k.val("N"), old = Number(iEl.value);
    iEl.max = String(N - 1);
    if (old > N - 1) { iEl.value = N - 1; iEl.dispatchEvent(new Event("input", { bubbles: true })); return; }
    const c = QSim.col(), p = k.val("p"), i = k.val("i"), M = Number(k.val("m")), seed = k.val("seed");
    const u = rng(seed * 104729 + 7);
    let win = 0, tsum = 0, tmax = 0;
    const paths = [];
    for (let m = 0; m < M; m++) {
      let x = i, t = 0;
      const pts = m < DRAWN ? [[0, x]] : null;
      while (x > 0 && x < N) { x += u() < p ? 1 : -1; t++; if (pts) pts.push([t, x]); }
      if (x === N) win++;
      tsum += t; if (pts) { paths.push(pts); if (t > tmax) tmax = t; }
    }
    const th = theory(p, i, N);
    const X1 = Math.max(10, tmax);
    const F = QSim.frame(v, { x0: 0, x1: X1, y0: -0.5, y1: N + 0.5, pad: 34, xl: "판 수", yl: "재산" });
    F.axes({});
    F.path([[0, N], [X1, N]], c.acc, 1.5, [6, 4]);
    F.path([[0, 0], [X1, 0]], c.warn, 1.5, [6, 4]);
    paths.forEach((pts) => F.path(pts, pts[pts.length - 1][1] === N ? c.main : c.ink3, 1.1));
    k.out(`p = ${fmt(p, 2)}, 시작 ${i}, 목표 ${N} · 경로 ${M}개 (그림은 처음 ${Math.min(M, DRAWN)}개, 파랑은 목표 도달)\n` +
      `목표에 닿은 비율 ${fmt(win / M, 3)} · 공식 ${fmt(th.h, 4)}\n` +
      `평균 판 수 ${fmt(tsum / M, 2)} · 공식 ${fmt(th.T, 2)}`);
  }
  S.redraw();
})();
