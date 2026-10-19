/* 수학7 탐구: 열린 덮개에서 유한 개 고르기 — [0,1]은 유한 개로 덮이고, (0,1]에 주는 어떤 덮개는 유한 개로 끝나지 않는다 */
(() => {
  "use strict";
  const S = MKit.setup("card-m7-cover", 0.45, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  /* 각 덮개에서 N개를 고르는 방법(가장 유리하게 고른다) */
  const COV = {
    lip: { closed0: true, tex: "[0, 1]에 점마다 (x − r, x + r), r = 0.05 + 0.2x",
      pick: (N) => { const out = []; let x = 0; for (let i = 0; i < N && x <= 1; i++) { const r = 0.05 + 0.2 * x; out.push([x - r, x + r]); x = x + r; } return out; } },
    half: { closed0: false, tex: "(0, 1]에 (1/n, 2), n = 1, 2, 3, …",
      pick: (N) => Array.from({ length: N }, (_, i) => [1 / (i + 1), 2]) },
    shrink: { closed0: false, tex: "(0, 1]에 점마다 (x/2, 2x)",
      pick: (N) => { const out = []; let x = 1; for (let i = 0; i < N; i++) { out.push([x / 2, 2 * x]); x = x / 2; } return out; } },
  };
  function draw() {
    const c = QSim.col(), g = v.g, C = COV[k.val("cov")], N = k.val("N");
    const f = QSim.frame(v, { x0: -0.1, x1: 1.15, y0: -0.3, y1: 1.2, pad: 18 });
    const Y = f.Y(0);
    g.strokeStyle = c.ink; g.lineWidth = 4; g.beginPath(); g.moveTo(f.X(0), Y); g.lineTo(f.X(1), Y); g.stroke();
    const end = (x, closed) => { g.beginPath(); g.arc(f.X(x), Y, 5, 0, 7); g.fillStyle = closed ? c.ink : c.card; g.fill(); g.strokeStyle = c.ink; g.lineWidth = 1.5; g.stroke(); };
    end(0, C.closed0); end(1, true);
    const picks = C.pick(N);
    picks.forEach(([p, q], i) => {
      const y = 0.12 + (i % 12) * 0.085;
      g.strokeStyle = c.main; g.lineWidth = 3;
      g.beginPath(); g.moveTo(f.X(Math.max(-0.1, p)), f.Y(y)); g.lineTo(f.X(Math.min(1.15, q)), f.Y(y)); g.stroke();
    });
    const covered = (x) => picks.some(([p, q]) => p < x && x < q);
    // 덮이지 않은 점 찾기: 격자 + 0 바로 옆
    const probes = [C.closed0 ? 0 : 1e-12];
    for (let i = 1; i <= 4000; i++) probes.push(i / 4000);
    const bad = probes.filter((x) => !covered(x));
    if (bad.length) {
      const hi = bad.filter((x) => x > 1e-9).reduce((m, x) => Math.max(m, x), 0);
      g.strokeStyle = c.warn; g.lineWidth = 6; g.beginPath(); g.moveTo(f.X(bad[0]), Y); g.lineTo(f.X(Math.max(hi, bad[0] + 0.006)), Y); g.stroke();
    }
    const gapTxt = bad.length ? `덮이지 않은 점이 남았습니다: 예를 들어 x = ${fmt(bad[0] > 1e-9 ? bad[0] : Math.min(...picks.map((p) => p[0])) / 2, 8)} (빨강)` : "집합 전체를 덮었습니다";
    k.out(`${C.tex}\n고른 구간 ${picks.length}개 · ${gapTxt}`);
  }
  S.redraw();
})();
