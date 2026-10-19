/* 수학3 탐구: 삽입 정렬과 병합 정렬의 비교 횟수를 실제로 세기 (무작위·정렬됨·역순 입력) */
(() => {
  "use strict";
  const S = MKit.setup("card-m3-sortcount", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  let seed = 7;
  const rng = (s) => () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  function makeArr(n, kind, r) { const a = [...Array(n).keys()]; if (kind === "rev") return a.reverse(); if (kind === "sorted") return a; for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function insertion(a) { a = a.slice(); let c = 0; for (let i = 1; i < a.length; i++) { const x = a[i]; let j = i - 1; while (j >= 0) { c++; if (a[j] > x) { a[j + 1] = a[j]; j--; } else break; } a[j + 1] = x; } return c; }
  function merge(a) { let c = 0; const rec = (b) => { if (b.length < 2) return b; const m = b.length >> 1, L = rec(b.slice(0, m)), R = rec(b.slice(m)), out = []; let i = 0, j = 0; while (i < L.length && j < R.length) { c++; out.push(L[i] <= R[j] ? L[i++] : R[j++]); } return out.concat(L.slice(i), R.slice(j)); }; rec(a); return c; }
  function draw() {
    const c = QSim.col(), N = k.val("n"), kind = k.val("kind");
    const ns = []; for (let n = 8; n <= 512; n += 8) ns.push(n);
    const r = rng(seed), ins = [], mer = [];
    for (const n of ns) { const a = makeArr(n, kind, r); ins.push(insertion(a)); mer.push(merge(a)); }
    const top = Math.max(...ins, ...mer, 100) * 1.05;
    const f = QSim.frame(v, { x0: 0, x1: 512, y0: 0, y1: top, pad: 40, xl: "n", yl: "비교" });
    f.axes();
    f.fn((n) => (kind === "rand" ? (n * n) / 4 : kind === "rev" ? (n * (n - 1)) / 2 : n - 1), c.ink3, 1, [4, 4]);
    f.fn((n) => (n > 1 ? n * Math.log2(n) : 0), c.ink3, 1, [2, 3]);
    f.path(ns.map((n, i) => [n, ins[i]]), c.warn, 2); f.path(ns.map((n, i) => [n, mer[i]]), c.main, 2);
    const a = makeArr(N, kind, rng(seed + N)), ci = insertion(a), cm = merge(a);
    f.dot(N, ci, c.warn, 5); f.dot(N, cm, c.main, 5);
    k.out(`입력: ${{ rand: "무작위", sorted: "이미 정렬됨", rev: "역순" }[kind]}, n = ${N} · 삽입 정렬(빨강) ${ci}번, 병합 정렬(파랑) ${cm}번 · 비 ${fmt(ci / Math.max(1, cm), 2)}\n`
      + `참고선: ${kind === "rand" ? "n²/4" : kind === "rev" ? "n(n−1)/2" : "n − 1"}(점선), n log₂ n(점점선) · 비교 정렬 하한 log₂ n! ≈ ${fmt(lgf(N), 0)}`);
  }
  function lgf(n) { let s = 0; for (let i = 2; i <= n; i++) s += Math.log2(i); return s; }
  k.$(".reseed").addEventListener("click", () => { seed = (seed * 31 + 17) % 100003; S.redraw(); });
  S.redraw();
})();
