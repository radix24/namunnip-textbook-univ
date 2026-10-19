/* 수학12 탐구: 이면체군 D_n에서 왼쪽 잉여류 gH와 오른쪽 잉여류 Hg를 색으로 비교 — 정규부분군 판정 */
(() => {
  "use strict";
  const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
  const sup = (k) => String(k).split("").map((d) => SUP[d]).join("");
  // 원소 (a, f) = r^a s^f, 곱: (a, f)(b, g) = (a ± b, f + g)
  const mul = (n, [a, f], [b, g]) => [(((a + (f ? -b : b)) % n) + n) % n, f ^ g];
  const name = ([a, f]) => (a === 0 ? (f ? "s" : "e") : "r" + (a === 1 ? "" : sup(a)) + (f ? "s" : ""));
  const key = ([a, f]) => a + "," + f;
  const SUBS = {
    rot: { gens: [[1, 0]], tex: "⟨r⟩ (회전 전체)" },
    rot2: { gens: [[2, 0]], tex: "⟨r²⟩" },
    s: { gens: [[0, 1]], tex: "⟨s⟩ (반사 하나)" },
    sr2: { gens: [[0, 1], [2, 0]], tex: "⟨s, r²⟩" },
    rs: { gens: [[1, 1]], tex: "⟨rs⟩ (다른 반사 하나)" },
    center: { gens: [], tex: "중심 Z(Dₙ)" },
  };
  function gen(n, gens) {
    const H = new Map([[key([0, 0]), [0, 0]]]);
    let grew = true;
    while (grew) { grew = false; for (const h of [...H.values()]) for (const g of gens) { const p = mul(n, h, g); if (!H.has(key(p))) { H.set(key(p), p); grew = true; } } }
    return [...H.values()];
  }
  const S = MKit.setup("card-m12-cosets", 0.42, draw);
  if (!S) return;
  const { k, v } = S;
  function draw() {
    const c = QSim.col(), n = k.val("n"), sel = k.val("sub");
    const G = []; for (let f = 0; f < 2; f++) for (let a = 0; a < n; a++) G.push([a, f]);
    const H = sel === "center" ? gen(n, n % 2 ? [] : [[n / 2, 0]]) : gen(n, SUBS[sel].gens);
    const coset = (side) => {
      const id = new Map(); let m = 0;
      for (const g of G) { if (id.has(key(g))) continue; for (const h of H) id.set(key(side ? mul(n, h, g) : mul(n, g, h)), m); m++; }
      return { id, m };
    };
    const L = coset(0), R = coset(1);
    let bad = null;
    for (const g of G) {
      const gH = new Set(H.map((h) => key(mul(n, g, h)))), Hg = H.map((h) => key(mul(n, h, g)));
      if (!Hg.every((x) => gH.has(x))) { bad = g; break; }
    }
    const g = v.g, W = v.W, Hh = v.H, half = W / 2, cw = Math.min((half - 24) / n, (Hh - 60) / 2.4), font = Math.max(10, Math.min(15, cw * 0.36));
    const fam = getComputedStyle(document.body).getPropertyValue("--f-mono").trim() || "monospace";
    g.save(); g.textAlign = "center"; g.textBaseline = "middle";
    [[L, "왼쪽 잉여류 gH"], [R, "오른쪽 잉여류 Hg"]].forEach(([P, title], side) => {
      const x0 = side * half + (half - cw * n) / 2, y0 = 30;
      g.fillStyle = c.ink2; g.font = `13px ${fam}`; g.fillText(title, side * half + half / 2, 14);
      g.font = `${font}px ${fam}`;
      G.forEach((el, i) => {
        const col = i % n, row = Math.floor(i / n), x = x0 + col * cw, y = y0 + row * cw * 1.15, idx = P.id.get(key(el));
        g.globalAlpha = 0.45; g.fillStyle = `hsl(${(idx * 360) / P.m + 200}, 60%, 55%)`; g.fillRect(x + 2, y + 2, cw - 4, cw - 4); g.globalAlpha = 1;
        if (idx === 0) { g.strokeStyle = c.ink; g.lineWidth = 2; g.strokeRect(x + 2, y + 2, cw - 4, cw - 4); }
        g.fillStyle = c.ink; g.fillText(name(el), x + cw / 2, y + cw / 2);
      });
    });
    g.restore();
    const Hn = H.map(name).join(", ");
    let msg = `D_${n} (원소 ${2 * n}개)의 부분군 H = ${sel === "center" ? "Z(D" + n + ")" : SUBS[sel].tex} = {${Hn}}, |H| = ${H.length}, 지수 ${L.m}\n`;
    if (!bad) msg += `모든 g에서 gH = Hg: 정규부분군입니다. 상군 D_${n}/H는 원소 ${L.m}개`;
    else {
      const gH = H.map((h) => name(mul(n, bad, h))).join(", "), Hg = H.map((h) => name(mul(n, h, bad))).join(", ");
      msg += `g = ${name(bad)}에서 gH = {${gH}}, Hg = {${Hg}}로 다름: 정규가 아닙니다`;
    }
    k.out(msg);
  }
  S.redraw();
})();
