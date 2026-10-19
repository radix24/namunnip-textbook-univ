/* 수학12 탐구: 곱셈표를 잉여류별로 정렬하면 — 정규일 때만 칸 묶음이 한 색이 되어 상군 표가 보인다 */
(() => {
  "use strict";
  const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
  const sup = (k) => String(k).split("").map((d) => SUP[d]).join("");
  const mul = (n, [a, f], [b, g]) => [(((a + (f ? -b : b)) % n) + n) % n, f ^ g];
  const name = ([a, f]) => (a === 0 ? (f ? "s" : "e") : "r" + (a === 1 ? "" : sup(a)) + (f ? "s" : ""));
  const key = ([a, f]) => a + "," + f;
  const GENS = { rot: [[1, 0]], rot2: [[2, 0]], s: [[0, 1]], sr2: [[0, 1], [2, 0]] };
  function gen(n, gens) {
    const H = new Map([[key([0, 0]), [0, 0]]]);
    let grew = true;
    while (grew) { grew = false; for (const h of [...H.values()]) for (const g of gens) { const p = mul(n, h, g); if (!H.has(key(p))) { H.set(key(p), p); grew = true; } } }
    return [...H.values()];
  }
  const S = MKit.setup("card-m12-quotient", 1, draw);
  if (!S) return;
  const { k, v } = S;
  function draw() {
    const c = QSim.col(), n = k.val("n"), sel = k.val("sub"), H = gen(n, GENS[sel]);
    const G = []; for (let f = 0; f < 2; f++) for (let a = 0; a < n; a++) G.push([a, f]);
    // 왼쪽 잉여류별로 원소를 다시 줄 세운다
    const id = new Map(), order = []; let m = 0;
    for (const g of G) { if (id.has(key(g))) continue; for (const h of H) { const x = mul(n, g, h); id.set(key(x), m); order.push(x); } m++; }
    const N = order.length, h = H.length;
    const gg = v.g, W = v.W, Ht = v.H, s = Math.min((W - 8) / (N + 1.2), (Ht - 8) / (N + 1.2)), x0 = (W - s * (N + 1.2)) / 2 + s * 1.2, y0 = 4 + s * 1.2;
    const fam = getComputedStyle(document.body).getPropertyValue("--f-mono").trim() || "monospace";
    gg.save(); gg.textAlign = "center"; gg.textBaseline = "middle"; gg.font = `${Math.max(8, Math.min(14, s * 0.4))}px ${fam}`;
    const hue = (i) => `hsl(${(i * 360) / m + 200}, 60%, 55%)`;
    order.forEach((x, i) => {
      gg.fillStyle = hue(id.get(key(x))); gg.globalAlpha = 0.5;
      gg.fillRect(x0 + i * s, y0 - s * 1.15, s, s); gg.fillRect(x0 - s * 1.15, y0 + i * s, s, s); gg.globalAlpha = 1;
      gg.fillStyle = c.ink; gg.fillText(name(x), x0 + (i + 0.5) * s, y0 - s * 0.65); gg.fillText(name(x), x0 - s * 0.65, y0 + (i + 0.5) * s);
    });
    let mixed = 0;
    for (let bi = 0; bi < m; bi++) for (let bj = 0; bj < m; bj++) {
      const seen = new Set();
      for (let i = 0; i < h; i++) for (let j = 0; j < h; j++) seen.add(id.get(key(mul(n, order[bi * h + i], order[bj * h + j]))));
      if (seen.size > 1) mixed++;
    }
    order.forEach((x, i) => order.forEach((y, j) => {
      const p = mul(n, x, y), ci = id.get(key(p));
      gg.globalAlpha = 0.45; gg.fillStyle = hue(ci); gg.fillRect(x0 + j * s + 1, y0 + i * s + 1, s - 2, s - 2); gg.globalAlpha = 1;
      if (s > 22) { gg.fillStyle = c.ink2; gg.fillText(name(p), x0 + (j + 0.5) * s, y0 + (i + 0.5) * s); }
    }));
    gg.strokeStyle = c.ink; gg.lineWidth = 2;
    for (let b = 0; b <= m; b++) {
      gg.beginPath(); gg.moveTo(x0 + b * h * s, y0); gg.lineTo(x0 + b * h * s, y0 + N * s); gg.moveTo(x0, y0 + b * h * s); gg.lineTo(x0 + N * s, y0 + b * h * s); gg.stroke();
    }
    gg.restore();
    const reps = []; for (let b = 0; b < m; b++) reps.push(name(order[b * h]) + "H");
    k.out(`D_${n}, H = {${H.map(name).join(", ")}}, 잉여류 ${m}개: ${reps.join(", ")}\n`
      + (mixed === 0 ? `모든 묶음(잉여류 × 잉여류)이 한 색입니다: 곱 aH·bH가 대표원에 무관하게 정해지고, 묶음을 한 칸으로 줄이면 원소 ${m}개인 상군의 표가 됩니다.`
        : `${m * m}개 묶음 중 ${mixed}개에 여러 색이 섞여 있습니다: 같은 잉여류에서 대표원을 바꾸면 곱의 잉여류가 바뀌어, 잉여류의 곱을 정의할 수 없습니다.`));
  }
  S.redraw();
})();
