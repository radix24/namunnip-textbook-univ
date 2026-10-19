/* 수학12 탐구: Z_n 안에서 k를 되풀이해 더하면 — ⟨k⟩ = ⟨gcd(n, k)⟩, 별 모양 */
(() => {
  "use strict";
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const S = MKit.setup("card-m12-cyclic", 0.8, draw);
  if (!S) return;
  const { k, v } = S;
  function draw() {
    const n = k.val("n"), ks = k.$('[name="k"]');
    if (+ks.max !== n - 1) { ks.max = n - 1; MKit.setVal(k, "k", Math.min(+ks.value, n - 1)); }
    const c = QSim.col(), kk = k.val("k") % n, g = gcd(n, kk) || n, ord = n / g;
    const f = QSim.frame(v, { x0: -1.3, x1: 1.3, y0: -1.25, y1: 1.25, equal: true, pad: 4 });
    const P = (i) => { const t = Math.PI / 2 - (2 * Math.PI * i) / n; return [Math.cos(t), Math.sin(t)]; };
    const circ = []; for (let i = 0; i <= 200; i++) { const t = (i / 200) * 2 * Math.PI; circ.push([Math.cos(t), Math.sin(t)]); }
    f.path(circ, c.rule, 1);
    // 0에서 k씩 더하며 걷는 길
    const walk = [P(0)]; let x = 0;
    for (let i = 0; i < ord; i++) { x = (x + kk) % n; walk.push(P(x)); }
    f.path(walk, c.main, 2);
    const sub = new Set(); for (let i = 0; i < ord; i++) sub.add((i * kk) % n);
    for (let i = 0; i < n; i++) {
      const [px, py] = P(i), on = sub.has(i);
      f.dot(px, py, on ? c.main : c.ink3, on ? 6 : 3.5);
      f.text(String(i), px * 1.15, py * 1.15 - 0.04, on ? c.ink : c.ink3, "center");
    }
    f.dot(...P(0), c.warn, 7);
    const list = [...sub].sort((a, b) => a - b);
    const divs = []; for (let d = 1; d <= n; d++) if (n % d === 0) divs.push(d);
    let phi = 0; for (let i = 1; i <= n; i++) if (gcd(i, n) === 1) phi++;
    k.out(`⟨${kk}⟩ = {${list.length > 16 ? list.slice(0, 16).join(", ") + ", …" : list.join(", ")}}, 원소 ${ord}개 = ${n}/gcd(${n}, ${kk})\n`
      + `gcd(${n}, ${kk}) = ${g}이므로 ⟨${kk}⟩ = ⟨${g % n}⟩${ord === n ? " · 생성자입니다" : ""} · Z_${n}의 생성자 ${phi}개\n`
      + `Z_${n}의 부분군: ${divs.length}개 (약수 ${divs.join(", ")}마다 하나씩, 위수 d인 것은 ⟨${n}/d⟩)`);
  }
  S.redraw();
})();
