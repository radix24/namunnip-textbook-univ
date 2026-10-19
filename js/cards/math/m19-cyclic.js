/* 수학19 탐구: Z_p^× 에서 g의 거듭제곱 1, g, g², … 이 원 위를 도는 모습 — 원시근이면 모든 원소를 한 번씩 */
(() => {
  "use strict";
  const S = MKit.setup("card-m19-cyclic", 0.75, draw);
  if (!S) return;
  const { k, v } = S;
  const order = (g, p) => { let x = g % p, n = 1; while (x !== 1) { x = (x * g) % p; n++; if (n > p) return 0; } return n; };
  const phi = (n) => { let r = n, m = n; for (let q = 2; q * q <= m; q++) if (m % q === 0) { while (m % q === 0) m /= q; r -= r / q; } if (m > 1) r -= r / m; return r; };
  function draw() {
    const p = Number(k.val("p")), gi = k.$('[name="g"]');
    if (gi) { const was = Number(gi.value); gi.max = p - 1; if (was > p - 1) { gi.value = p - 1; gi.dispatchEvent(new Event("input", { bubbles: true })); return; } }
    const c = QSim.col(), g = Math.min(k.val("g"), p - 1);
    const F = QSim.frame(v, { x0: -1.3, x1: 1.3, y0: -1.2, y1: 1.2, pad: 10, equal: true, xl: "", yl: "" });
    const pos = (a) => { const t = Math.PI / 2 - (2 * Math.PI * (a - 1)) / (p - 1); return [Math.cos(t), Math.sin(t)]; };
    const ord = order(g, p);
    const orbit = []; let x = 1; for (let i = 0; i < ord; i++) { orbit.push(x); x = (x * g) % p; }
    const inOrb = new Set(orbit);
    for (let a = 1; a < p; a++) { const [px, py] = pos(a); F.dot(px, py, inOrb.has(a) ? c.main : c.rule, inOrb.has(a) ? 6 : 4); F.text(String(a), 1.13 * px, 1.13 * py - 0.03, inOrb.has(a) ? c.ink : c.ink3, "center"); }
    for (let i = 0; i < orbit.length; i++) { const [x0, y0] = pos(orbit[i]), [x1, y1] = pos(orbit[(i + 1) % orbit.length]); F.arrow(x0, y0, 0.92 * (x1 - x0), 0.92 * (y1 - y0), c.warn); }
    const prim = ord === p - 1;
    k.out(`p = ${p}, g = ${g} · 거듭제곱 1 → ${orbit.slice(1, 13).join(" → ")}${orbit.length > 13 ? " → …" : ""} → 1\ng의 위수 ${ord} (p − 1 = ${p - 1}의 약수) · ${prim ? "원시근: 0 아닌 모든 원소를 한 번씩 지남" : `원시근 아님: ${ord}개 원소만 지남`} · 원시근은 모두 φ(${p - 1}) = ${phi(p - 1)}개`);
  }
  S.redraw();
})();
