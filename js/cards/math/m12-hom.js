/* 수학12 탐구: Z_m → Z_n, k ↦ kb — 언제 준동형사상인가, 핵과 상, |G| = |핵|·|상| */
(() => {
  "use strict";
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const S = MKit.setup("card-m12-hom", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  function draw() {
    const m = k.val("m"), n = k.val("n"), bs = k.$('[name="b"]');
    if (+bs.max !== n - 1) { bs.max = n - 1; MKit.setVal(k, "b", Math.min(+bs.value, n - 1)); }
    const c = QSim.col(), b = k.val("b") % n, ok = (m * b) % n === 0;
    const f = QSim.frame(v, { x0: -3.3, x1: 3.3, y0: -1.55, y1: 1.55, equal: true, pad: 4 });
    const CL = -1.75, CR = 1.75, R = 1.2;
    const P = (cx, N, i) => { const t = Math.PI / 2 - (2 * Math.PI * i) / N; return [cx + R * Math.cos(t), R * Math.sin(t)]; };
    const img = new Set(), ker = [];
    for (let i = 0; i < m; i++) { const y = (i * b) % n; img.add(y); if (y === 0) ker.push(i); }
    const hue = (y) => `hsl(${(y * 360) / n + 200}, 65%, 50%)`;
    if (ok) for (let i = 0; i < m; i++) { const y = (i * b) % n; f.path([P(CL, m, i), P(CR, n, y)], hue(y), 1.2); }
    for (let i = 0; i < m; i++) { const [x, y] = P(CL, m, i); f.dot(x, y, ok ? hue((i * b) % n) : c.ink3, 5); f.text(String(i), CL + (x - CL) * 1.17, y * 1.17 - 0.05, c.ink2, "center"); }
    for (let j = 0; j < n; j++) { const [x, y] = P(CR, n, j); f.dot(x, y, ok && img.has(j) ? hue(j) : c.rule, img.has(j) && ok ? 6 : 4); f.text(String(j), CR + (x - CR) * 1.17, y * 1.17 - 0.05, c.ink2, "center"); }
    f.text(`Z_${m}`, CL, -1.5, c.ink, "center"); f.text(`Z_${n}`, CR, -1.5, c.ink, "center");
    const homs = []; for (let t = 0; t < n; t++) if ((m * t) % n === 0) homs.push(t);
    let msg;
    if (ok) {
      msg = `φ(k) = ${b}k mod ${n}: 준동형사상입니다 (${n} | ${m}·${b} = ${m * b})\n`
        + `핵 = {${ker.join(", ")}} (${ker.length}개) · 상 = {${[...img].sort((x, y) => x - y).join(", ")}} (${img.size}개) · ${ker.length} × ${img.size} = ${m}`;
    } else {
      msg = `φ(1) = ${b}이면 함수가 잘 정의되지 않습니다: Z_${m}에서 0 = ${m}인데 φ(0) = 0, ${m}·${b} = ${m * b} ≡ ${(m * b) % n} (mod ${n})`;
    }
    k.out(msg + `\nZ_${m} → Z_${n} 준동형사상은 φ(1) ∈ {${homs.join(", ")}}의 ${homs.length}개 = gcd(${m}, ${n})`);
  }
  S.redraw();
})();
