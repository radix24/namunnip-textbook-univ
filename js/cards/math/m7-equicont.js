/* 수학7 탐구: 동등연속 — 함수족 전체에 통하는 δ가 있는가 (sin nx 와 sin(nx)/n, 기울기 제한 함수) */
(() => {
  "use strict";
  const S = MKit.setup("card-m7-equicont", 0.6, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const FAM = {
    sinn: { f: (n, x) => Math.sin(n * x), tex: "sin(nx)", L: (n) => n },
    sinnn: { f: (n, x) => Math.sin(n * x) / Math.sqrt(n), tex: "sin(nx)/√n", L: (n) => Math.sqrt(n) },
    pow: { f: (n, x) => Math.pow(x, n), tex: "xⁿ", L: (n) => n },
    lip: { f: (n, x) => Math.sin(n * x) / n + 0.5 * Math.cos(x + n), tex: "sin(nx)/n + ½cos(x + n)", L: () => 1.5 },
  };
  function draw() {
    const c = QSim.col(), F = FAM[k.val("fam")], N = k.val("N"), eps = 0.3;
    const f = QSim.frame(v, { x0: 0, x1: 1, y0: -1.2, y1: 1.2, pad: 28, xl: "x" });
    f.axes();
    for (let n = 1; n <= N; n++) {
      const pts = []; for (let i = 0; i <= 400; i++) { const x = i / 400; pts.push([x, F.f(n, x)]); }
      f.path(pts, n === N ? c.warn : c.main, n === N ? 2 : 1);
    }
    // 처음 N개 함수 모두에 통하는 가장 큰 δ (ε = 0.3)를 격자로 어림
    const ok = (d) => { for (let n = 1; n <= N; n++) for (let i = 0; i <= 200; i++) { const x = i / 200, y = Math.min(1, x + d); if (Math.abs(F.f(n, x) - F.f(n, y)) >= eps) return false; } return true; };
    let lo = 0, hi = 1; if (ok(hi)) lo = hi; else for (let j = 0; j < 25; j++) { const m = (lo + hi) / 2; if (ok(m)) lo = m; else hi = m; }
    k.out(`함수족 ${F.tex}, n = 1, …, ${N} (빨강이 n = ${N})\nε = ${eps}에 대해 처음 ${N}개 모두에 통하는 δ ≈ ${fmt(lo, 4)} · n = ${N}의 기울기 상한 ≈ ${fmt(F.L(N), 2)}`);
  }
  S.redraw();
})();
