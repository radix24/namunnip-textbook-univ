/* 수학14 탐구: 힐베르트 곡선의 n단계 꺾은선 f_n — 단계가 오를수록 정사각형을 채우고 균등 코시 */
(() => {
  "use strict";
  const S = MKit.setup("card-m14-hilbert", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  // d (0 … 4^n − 1) 번째 칸의 좌표 (표준 d2xy 알고리즘)
  function d2xy(n, d) {
    let x = 0, y = 0, t = d;
    for (let s = 1; s < 1 << n; s *= 2) {
      const rx = 1 & (t / 2), ry = 1 & (t ^ rx);
      if (ry === 0) { if (rx === 1) { x = s - 1 - x; y = s - 1 - y; } const tmp = x; x = y; y = tmp; }
      x += s * rx; y += s * ry; t = Math.floor(t / 4);
    }
    return [x, y];
  }
  const fAt = (n, t) => { const N = 1 << n, M = N * N, pos = Math.min(Math.max(t * M - 0.5, 0), M - 1), i = Math.min(M - 2, Math.floor(pos)), f = pos - i; const a = d2xy(n, i), b = d2xy(n, i + 1); return [((a[0] + f * (b[0] - a[0])) + 0.5) / N, ((a[1] + f * (b[1] - a[1])) + 0.5) / N]; };
  function draw() {
    const c = QSim.col(), n = k.val("n"), tt = k.val("t") / 1000;
    const W = v.W, H = v.H, g = v.g, half = W / 2;
    const L = QSim.frame({ g, W: half, H }, { x0: -0.05, x1: 1.05, y0: -0.05, y1: 1.05, pad: 8, equal: true });
    L.path([[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]], c.rule, 1);
    const N = 1 << n, M = N * N, pts = [];
    for (let d = 0; d < M; d++) { const [x, y] = d2xy(n, d); pts.push([(x + 0.5) / N, (y + 0.5) / N]); }
    L.path(pts, c.main, n >= 6 ? 0.8 : 1.6);
    const p = fAt(n, tt); L.dot(p[0], p[1], c.warn, 5);
    // 오른쪽: 이전 단계와 비교
    g.save(); g.translate(half, 0);
    const R = QSim.frame({ g, W: half, H }, { x0: -0.05, x1: 1.05, y0: -0.05, y1: 1.05, pad: 8, equal: true });
    R.path([[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]], c.rule, 1);
    if (n >= 2) { const m = n - 1, Nm = 1 << m, q = []; for (let d = 0; d < Nm * Nm; d++) { const [x, y] = d2xy(m, d); q.push([(x + 0.5) / Nm, (y + 0.5) / Nm]); } R.path(q, c.ink3, 1.2); }
    const sq = 1 / (1 << Math.max(0, n - 1));
    R.path(pts, c.main, 0.8);
    g.restore();
    let maxd = 0;
    if (n >= 2) for (let i = 0; i <= 2000; i++) { const t = i / 2000, a = fAt(n, t), b = fAt(n - 1, t); maxd = Math.max(maxd, Math.hypot(a[0] - b[0], a[1] - b[1])); }
    const len = (M - 1) / N;
    k.out(`${n}단계: 칸 ${M}개, 꺾은선 길이 ${fmt(len, 2)} · t = ${fmt(tt, 3)}에서 f_${n}(t) = (${fmt(p[0], 4)}, ${fmt(p[1], 4)})\n${n >= 2 ? `오른쪽: ${n - 1}단계(회색)와 ${n}단계(파랑) · 최대 거리 sup|f_${n} − f_${n - 1}| ≈ ${fmt(maxd, 4)} (상한 √2·2^−${n - 1} ≈ ${fmt(Math.SQRT2 * sq, 4)})` : "단계를 2 이상으로 올리면 이전 단계와 비교합니다"}`);
  }
  S.redraw();
})();
