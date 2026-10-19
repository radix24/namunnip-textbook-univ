/* 수학21 탐구: 랜덤워크를 시간 1/n, 공간 1/√n로 줄여 브라운 운동으로 — 경로, 분산, 반사 원리 확률 */
(() => {
  "use strict";
  const S = MKit.setup("card-m21-brownian", 0.6, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const rng = (seed) => { let s = seed | 0; return () => { s = (s + 0x6d2b79f5) | 0; let r = Math.imul(s ^ (s >>> 15), 1 | s); r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r; return (((r ^ (r >>> 14)) >>> 0) + 0.5) / 4294967296; }; };
  function draw() {
    const c = QSim.col(), n = Number(k.val("n")), P = Number(k.val("paths")), seed = k.val("seed"), sc = k.val("scale");
    const u = rng(seed * 2654435 + 1);
    let bits = 0, left = 0;
    const step = () => { if (!left) { bits = (u() * 4294967296) >>> 0; left = 32; } left--; return (bits >>> left) & 1 ? 1 : -1; };
    const div = sc === "sqrt" ? Math.sqrt(n) : sc === "n" ? n : 1;
    const ymax = sc === "none" ? Math.max(4, 3 * Math.sqrt(n)) : sc === "n" ? 1 : 3;
    const F = QSim.frame(v, { x0: 0, x1: 1, y0: -ymax, y1: ymax, pad: 34, xl: "t", yl: "W(t)" });
    F.axes({});
    if (sc === "sqrt") {
      F.fn((t) => Math.sqrt(t), c.ink3, 1, [4, 4]); F.fn((t) => -Math.sqrt(t), c.ink3, 1, [4, 4]);
      F.fn((t) => 2 * Math.sqrt(t), c.rule, 1, [2, 4]); F.fn((t) => -2 * Math.sqrt(t), c.rule, 1, [2, 4]);
    }
    const cols = [c.main, c.acc, c.warn, c.ink2, c.ink3];
    for (let m = 0; m < P; m++) {
      let x = 0; const pts = [[0, 0]], stride = Math.max(1, Math.floor(n / 1500));
      for (let j = 1; j <= n; j++) { x += step(); if (j % stride === 0 || j === n) pts.push([j / n, x / div]); }
      F.path(pts, cols[m % cols.length], 1.2);
    }
    const STAT = Math.min(2000, Math.round(4e6 / n));
    let s2 = 0, end1 = 0, max1 = 0;
    const thr = Math.sqrt(n);
    for (let m = 0; m < STAT; m++) {
      let x = 0, hit = false;
      for (let j = 0; j < n; j++) { x += step(); if (x >= thr) hit = true; }
      s2 += (x / Math.sqrt(n)) ** 2; if (x >= thr) end1++; if (hit) max1++;
    }
    const scaleName = sc === "sqrt" ? "S/√n (브라운 운동 크기)" : sc === "n" ? "S/n (너무 많이 줄임)" : "S (줄이지 않음)";
    k.out(`걸음 수 n = ${n} · 세로축: ${scaleName}\n` +
      `경로 ${STAT}개로 잰 값: Var(S_n/√n) = ${fmt(s2 / STAT, 3)} (브라운 운동 1)\n` +
      `끝 값 S_n/√n ≥ 1의 비율 ${fmt(end1 / STAT, 3)} (B(1): 0.159) · 중간 최댓값 ≥ 1의 비율 ${fmt(max1 / STAT, 3)} (반사 원리: 0.317)`);
  }
  S.redraw();
})();
