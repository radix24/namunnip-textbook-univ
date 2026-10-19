/* 수학5 탐구: 무작위 개수의 합 S = X_1 + … + X_N (X는 주사위) — 반복 기대값과 전분산 공식 */
(() => {
  "use strict";
  const S = MKit.setup("card-m5-randsum", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  function draw() {
    const c = QSim.col(), typ = k.val("t"), lam = k.val("l"), R = 5000, g = v.g;
    let s = 31337; const u = () => { s = (s + 0x6d2b79f5) | 0; let r = Math.imul(s ^ (s >>> 15), 1 | s); r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r; return (((r ^ (r >>> 14)) >>> 0) + 0.5) / 4294967296; };
    const pois = () => { const L = Math.exp(-lam); let p = 1, n = 0; do { n++; p *= u(); } while (p > L); return n - 1; };
    const q = lam / (1 + lam), geom = () => Math.floor(Math.log(u()) / Math.log(q));
    const drawN = typ === "fix" ? () => lam : typ === "pois" ? pois : geom;
    const varN = typ === "fix" ? 0 : typ === "pois" ? lam : lam * (1 + lam);
    const mu = 3.5, s2 = 35 / 12, ES = lam * mu, VS = lam * s2 + mu * mu * varN;
    const xs = []; let m1 = 0, m2 = 0;
    for (let r = 0; r < R; r++) { const n = drawN(); let t = 0; for (let i = 0; i < n; i++) t += 1 + Math.floor(u() * 6); xs.push(t); m1 += t; m2 += t * t; }
    m1 /= R; const sv = m2 / R - m1 * m1;
    const hi = Math.max(ES + 4 * Math.sqrt(VS), 10), B = 40, bw = hi / B, cnt = new Array(B).fill(0);
    xs.forEach((x) => { const j = Math.floor(x / bw); if (j < B) cnt[j]++; });
    const ymax = (Math.max(...cnt) / R) * 1.15;
    const F = QSim.frame(v, { x0: 0, x1: hi, y0: 0, y1: ymax, pad: 30, xl: "S", yl: "비율" });
    F.axes({ noGrid: true });
    g.fillStyle = c.soft; g.strokeStyle = c.main; g.lineWidth = 1;
    cnt.forEach((m, j) => { const X0 = F.X(j * bw), X1 = F.X((j + 1) * bw), h = m / R; g.fillRect(X0, F.Y(h), X1 - X0, F.Y(0) - F.Y(h)); g.strokeRect(X0, F.Y(h), X1 - X0, F.Y(0) - F.Y(h)); });
    F.path([[ES, 0], [ES, ymax]], c.warn, 2);
    const nm = typ === "fix" ? `고정 N = ${lam}` : typ === "pois" ? `N ~ Pois(${lam})` : `N ~ 기하(0부터, 평균 ${lam})`;
    k.out(`${nm}, X는 주사위 · E[S] = E[N]·3.5 = ${fmt(ES, 2)} (실험 ${fmt(m1, 2)})\nVar(S) = E[N]·35/12 + 3.5²·Var(N) = ${fmt(lam * s2, 2)} + ${fmt(mu * mu * varN, 2)} = ${fmt(VS, 2)} (실험 ${fmt(sv, 1)})`);
  }
  S.redraw();
})();
