/* 수학10 탐구: 법 n의 기약 잉여마다 위수 — 위수별 개수와 φ(d) 비교, 원시근 */
(() => {
  "use strict";
  const S = MKit.setup("card-m10-ordertable", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };
  const phi = (n) => { let r = 0; for (let i = 1; i <= n; i++) if (gcd(i, n) === 1) r++; return r; };
  const ord = (a, n) => { let x = a % n, kk = 1; while (x !== 1 % n) { x = (x * a) % n; kk++; if (kk > n) return 0; } return kk; };
  function draw() {
    const c = QSim.col(), n = k.val("n"), g = v.g, W = v.W, H = v.H, ph = phi(n);
    const units = []; for (let a = 1; a < n; a++) if (gcd(a, n) === 1) units.push([a, ord(a, n)]);
    const divs = []; for (let d = 1; d <= ph; d++) if (ph % d === 0) divs.push(d);
    const cnt = Object.fromEntries(divs.map((d) => [d, 0])); units.forEach(([, o]) => cnt[o]++);
    const prim = units.filter(([, o]) => o === ph).map(([a]) => a);
    const F = QSim.frame({ g, W: W * 0.62, H }, { x0: 0, x1: n, y0: 0, y1: ph * 1.1, pad: 28, xl: "a", yl: "위수" });
    F.axes({ noGrid: true });
    divs.forEach((d) => F.path([[0, d], [n, d]], c.rule, 0.8, [2, 4]));
    units.forEach(([a, o]) => F.dot(a, o, o === ph ? c.warn : c.main, 4));
    g.save(); g.translate(W * 0.64, 0); g.font = "12px monospace"; g.fillStyle = c.ink2;
    g.fillText("위수 d  개수  φ(d)", 6, 20);
    divs.forEach((d, i) => { g.fillStyle = cnt[d] === phi(d) ? c.ink : c.warn; g.fillText(`${String(d).padStart(5)} ${String(cnt[d]).padStart(5)} ${String(phi(d)).padStart(5)}`, 6, 40 + i * 16); });
    g.restore();
    const isP = n > 1 && units.length === n - 1;
    k.out(`법 ${n}${isP ? " (소수)" : ""} · φ(${n}) = ${ph} · 원시근 ${prim.length ? prim.join(", ") + ` (${prim.length}개 = φ(${ph}) = ${phi(ph)}${prim.length === phi(ph) ? "" : "?"})` : "없음"}\n표: 위수가 d인 원소의 개수와 φ(d)${isP ? " — 소수 법에서는 모두 같다" : " — 다르면 빨강"}`);
  }
  S.redraw();
})();
