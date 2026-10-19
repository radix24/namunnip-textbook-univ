/* 수학12 탐구: 위수 n인 가환군 전체 목록과, 고른 군의 원소 위수 분포 */
(() => {
  "use strict";
  const factor = (n) => { const f = []; for (let p = 2; p * p <= n; p++) { let e = 0; while (n % p === 0) { n /= p; e++; } if (e) f.push([p, e]); } if (n > 1) f.push([n, 1]); return f; };
  const parts = (e, max = e) => { if (e === 0) return [[]]; const out = []; for (let a = Math.min(e, max); a >= 1; a--) for (const r of parts(e - a, a)) out.push([a, ...r]); return out; };
  const SUB = "₀₁₂₃₄₅₆₇₈₉";
  const zz = (m) => "Z" + String(m).split("").map((d) => SUB[d]).join("");
  function groups(n) {
    let gs = [[]];
    for (const [p, e] of factor(n)) { const ps = parts(e); gs = gs.flatMap((g) => ps.map((a) => [...g, [p, a]])); }
    return gs;
  }
  const elem = (g) => g.flatMap(([p, a]) => a.map((x) => p ** x));
  function invariant(g) {
    const L = Math.max(...g.map(([, a]) => a.length)), d = Array(L).fill(1);
    for (const [p, a] of g) a.forEach((x, i) => { d[i] *= p ** x; });
    return d.reverse();
  }
  const show = (list) => list.map(zz).join(" × ");
  const S = MKit.setup("card-m12-abelian", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  function draw() {
    const c = QSim.col(), n = k.val("n"), G = groups(n), is = k.$('[name="i"]');
    if (+is.max !== G.length) { is.max = G.length; MKit.setVal(k, "i", Math.min(+is.value, G.length)); }
    const g = G[k.val("i") - 1];
    // p쪽에서 위수가 p^j의 약수인 원소 수
    const Np = (a, p, j) => (j < 0 ? 0 : a.reduce((s, x) => s * p ** Math.min(x, j), 1));
    const divs = []; for (let d = 1; d <= n; d++) if (n % d === 0) divs.push(d);
    const vp = (d, p) => { let j = 0; while (d % p === 0) { d /= p; j++; } return j; };
    const cnt = divs.map((d) => g.reduce((s, [p, a]) => { const j = vp(d, p); return s * (Np(a, p, j) - Np(a, p, j - 1)); }, 1));
    const top = Math.max(...cnt);
    const f = QSim.frame(v, { x0: -0.6, x1: divs.length - 0.4, y0: -top * 0.12, y1: top * 1.15, pad: 26 });
    f.axes({ noGrid: true });
    divs.forEach((d, i) => {
      if (cnt[i]) f.path([[i, 0], [i, cnt[i]]], c.main, Math.max(3, Math.min(22, f.sx * 0.6)));
      f.text(String(d), i, -top * 0.08, c.ink2, "center");
      if (cnt[i]) f.text(String(cnt[i]), i, cnt[i] + top * 0.03, c.ink, "center");
    });
    const list = G.map((h, idx) => `${idx + 1 === k.val("i") ? "▶ " : "  "}${show(elem(h))}${invariant(h).length > 1 || elem(h).length > 1 ? "  ≅  " + show(invariant(h)) : ""}`);
    const fac = factor(n).map(([p, e]) => (e > 1 ? `${p}^${e}` : `${p}`)).join("·");
    k.out(`n = ${n} = ${fac}: 가환군 ${G.length}개 (기본 약수 ≅ 불변 인자)\n${list.join("\n")}\n막대: 고른 군에서 위수가 d인 원소의 수 (d = n의 약수)${cnt[cnt.length - 1] ? " · 위수 n인 원소가 있어 순환군" : ""}`);
  }
  S.redraw();
})();
