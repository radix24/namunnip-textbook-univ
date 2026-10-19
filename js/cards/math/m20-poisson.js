/* 수학20 탐구: 원판의 디리클레 문제 — 경계 온도 g(θ)에서 푸아송 적분으로 안의 온도 u를 색으로 */
(() => {
  "use strict";
  const S = MKit.setup("card-m20-poisson", 0.8, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const PI = Math.PI;
  const G = {
    half: { name: "위쪽 반원 1, 아래쪽 0", g: (t) => (Math.sin(t) > 0 ? 1 : 0), exact: (x, y) => 0.5 + Math.atan2(2 * y, 1 - x * x - y * y) / PI },
    cos: { name: "cos θ", g: (t) => Math.cos(t), exact: (x) => x },
    cos3: { name: "cos 3θ", g: (t) => Math.cos(3 * t), exact: (x, y) => x ** 3 - 3 * x * y * y },
    spot: { name: "θ = 0 근처 폭 0.4만 1", g: (t) => (Math.abs(Math.atan2(Math.sin(t), Math.cos(t))) < 0.2 ? 1 : 0), exact: null },
  };
  const M = 720;
  function poisson(B, x, y) {
    const r2 = x * x + y * y; let s = 0;
    for (let i = 0; i < M; i++) { const t = (2 * PI * (i + 0.5)) / M, dx = x - Math.cos(t), dy = y - Math.sin(t); s += ((1 - r2) / (dx * dx + dy * dy)) * B.g(t); }
    return s / M;
  }
  const color = (u, lo, hi) => { const s = Math.max(0, Math.min(1, (u - lo) / (hi - lo || 1))); return `hsl(${240 - 240 * s}, 70%, ${45 + 10 * Math.sin(PI * s)}%)`; };
  function draw() {
    const c = QSim.col(), B = G[k.val("g")], rr = k.val("r"), ph = (k.val("t") * PI) / 180;
    const F = QSim.frame(v, { x0: -1.25, x1: 1.25, y0: -1.15, y1: 1.15, pad: 6, equal: true, xl: "", yl: "" });
    const lo = B === G.cos || B === G.cos3 ? -1 : 0, hi = 1, N = 46, h = 2 / N;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const x = -1 + (i + 0.5) * h, y = -1 + (j + 0.5) * h; if (x * x + y * y >= 1) continue;
      const u = B.exact ? B.exact(x, y) : poisson(B, x, y);
      const X0 = F.X(x - h / 2), X1 = F.X(x + h / 2), Y0 = F.Y(y + h / 2), Y1 = F.Y(y - h / 2);
      v.g.fillStyle = color(u, lo, hi); v.g.fillRect(X0, Y0, X1 - X0 + 0.6, Y1 - Y0 + 0.6);
    }
    for (let i = 0; i < 180; i++) { const t0 = (2 * PI * i) / 180, t1 = (2 * PI * (i + 1)) / 180; F.path([[1.08 * Math.cos(t0), 1.08 * Math.sin(t0)], [1.08 * Math.cos(t1), 1.08 * Math.sin(t1)]], color(B.g((t0 + t1) / 2), lo, hi), 5); }
    const px = rr * Math.cos(ph), py = rr * Math.sin(ph);
    F.dot(px, py, c.ink, 5);
    const uq = poisson(B, px, py), ue = B.exact ? B.exact(px, py) : null;
    k.out(`경계 온도: ${B.name} (바깥 고리, 파랑 ${lo} ~ 빨강 1)\n점 z = ${fmt(rr, 2)}·e^(i·${k.val("t")}°)에서 푸아송 적분 u = ${fmt(uq, 4)}${ue === null ? "" : ` (식으로 계산한 값 ${fmt(ue, 4)})`} · 원점의 온도는 경계의 평균 ${fmt(poisson(B, 0, 0), 4)}`);
  }
  S.redraw();
})();
