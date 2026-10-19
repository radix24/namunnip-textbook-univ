/* 수학17 탐구: 정칙사상 F의 원상 F⁻¹(w) — w가 분지점에 다가가면 원상들이 한 점으로 모인다 */
(() => {
  "use strict";
  const S = MKit.setup("card-m17-branch", 0.62, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  // 복소수 연산
  const C = (re, im) => ({ re, im });
  const add = (a, b) => C(a.re + b.re, a.im + b.im), sub = (a, b) => C(a.re - b.re, a.im - b.im);
  const mul = (a, b) => C(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
  const div = (a, b) => { const d = b.re * b.re + b.im * b.im; return C((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); };
  const abs = (a) => Math.hypot(a.re, a.im);
  const csqrt = (a) => { const r = abs(a), t = Math.atan2(a.im, a.re) / 2; return C(Math.sqrt(r) * Math.cos(t), Math.sqrt(r) * Math.sin(t)); };
  const croot = (a, m, j) => { const r = Math.pow(abs(a), 1 / m), t = (Math.atan2(a.im, a.re) + 2 * Math.PI * j) / m; return C(r * Math.cos(t), r * Math.sin(t)); };
  // 다항식 근: 뒤랑-케르너 반복
  function polyRoots(coef) { // coef: 최고차부터, 최고차 계수 1
    const n = coef.length - 1, P = (z) => coef.reduce((s, c) => add(mul(s, z), c), C(0, 0));
    let z = []; for (let i = 0; i < n; i++) z.push(C(0.4 * Math.cos(2.1 * i + 0.3) + 0.9 * Math.cos(i), 0.9 * Math.sin(i) + 0.2));
    for (let it = 0; it < 200; it++) z = z.map((zi, i) => { let d = C(1, 0); z.forEach((zj, j) => { if (j !== i) d = mul(d, sub(zi, zj)); }); return sub(zi, div(P(zi), d)); });
    return z;
  }
  const cfmt = (z) => { const re = Math.abs(z.re) < 5e-4 ? 0 : z.re, im = Math.abs(z.im) < 5e-4 ? 0 : z.im; return im === 0 ? fmt(re, 3) : re === 0 ? `${fmt(im, 3)}i` : `${fmt(re, 3)}${im < 0 ? " − " : " + "}${fmt(Math.abs(im), 3)}i`; };
  const MAPS = {
    z2: { name: "F(z) = z²", deg: 2, br: [[0, 0]], pre: (w) => [croot(w, 2, 0), croot(w, 2, 1)] },
    z3: { name: "F(z) = z³", deg: 3, br: [[0, 0]], pre: (w) => [0, 1, 2].map((j) => croot(w, 3, j)) },
    jk: { name: "F(z) = z + 1/z", deg: 2, br: [[2, 0], [-2, 0]], pre: (w) => { const s = csqrt(sub(mul(w, w), C(4, 0))); return [div(add(w, s), C(2, 0)), div(sub(w, s), C(2, 0))]; } },
    cb: { name: "F(z) = z³ − 3z", deg: 3, br: [[2, 0], [-2, 0]], pre: (w) => polyRoots([C(1, 0), C(0, 0), C(-3, 0), C(-w.re, -w.im)]) },
  };
  function draw() {
    const c = QSim.col(), M = MAPS[k.val("f")], w = C(k.val("wr"), k.val("wi"));
    const zs = M.pre(w);
    const F = QSim.frame(v, { x0: -2.6, x1: 2.6, y0: -1.6, y1: 1.6, pad: 22, equal: true, xl: "Re z", yl: "Im z" });
    F.axes();
    // 분기점 표시
    const crit = { z2: [[0, 0]], z3: [[0, 0]], jk: [[1, 0], [-1, 0]], cb: [[1, 0], [-1, 0]] }[k.val("f")];
    crit.forEach(([x, y]) => F.dot(x, y, c.acc, 6));
    zs.forEach((z) => { if (Math.abs(z.re) < 2.6 && Math.abs(z.im) < 1.6) F.dot(z.re, z.im, c.warn, 5); });
    let dmin = Infinity; for (let i = 0; i < zs.length; i++) for (let j = i + 1; j < zs.length; j++) dmin = Math.min(dmin, abs(sub(zs[i], zs[j])));
    const bd = Math.min(...M.br.map(([a, b]) => Math.hypot(w.re - a, w.im - b)));
    k.out(`${M.name} (차수 ${M.deg}) · w = ${cfmt(w)}, 가장 가까운 분지점까지 ${fmt(bd, 3)}\n원상 ${zs.length}개: ${zs.map(cfmt).join(", ")} · 가장 가까운 두 원상의 거리 ${fmt(dmin, 4)}`);
  }
  S.redraw();
})();
