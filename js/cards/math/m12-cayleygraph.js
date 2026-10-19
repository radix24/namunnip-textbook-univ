/* 수학12 탐구: 표시된 군의 케일리 그래프 — 관계는 그래프의 닫힌 길이다 (D_n, Z_n × Z_2, 사원수군) */
(() => {
  "use strict";
  const md = (x, n) => ((x % n) + n) % n;
  // 원소는 a^k b^f (0 ≤ k < m, f = 0, 1)로 쓴다
  const MODELS = {
    dih: (n) => ({ m: n, mul: ([k, f], [c, d]) => [md(k + (f ? -c : c), n), f ^ d], pres: `⟨a, b | a^${n}, b², baba⟩ = D_${n}`,
      rels: [`a^${n} = e: 파란 화살표 ${n}번이 닫힌 길`, "b² = e: 주황 선은 양방향(두 번 가면 제자리)", "baba = e: 파랑·주황을 번갈아 네 걸음이면 제자리, 곧 ba = a⁻¹b"] }),
    abel: (n) => ({ m: n, mul: ([k, f], [c, d]) => [md(k + c, n), f ^ d], pres: `⟨a, b | a^${n}, b², aba⁻¹b⁻¹⟩ = Z_${n} × Z₂`,
      rels: [`a^${n} = e: 파란 화살표 ${n}번이 닫힌 길`, "b² = e: 주황 선은 양방향", "ab = ba: 바깥 원과 안쪽 원의 파란 화살표가 같은 방향으로 돈다"] }),
    quat: () => ({ m: 4, mul: ([k, f], [c, d]) => { let a = k + (f ? -c : c), b = f + d; if (b === 2) { a += 2; b = 0; } return [md(a, 4), b]; }, pres: "⟨a, b | a⁴, a² = b², bab⁻¹ = a⁻¹⟩ = Q₈ (a = i, b = j)",
      rels: ["a⁴ = e: 파란 화살표 4번이 닫힌 길", "b² = a²: 주황 화살표 두 번은 제자리가 아니라 a² 자리로 간다(위수 4)", "bab⁻¹ = a⁻¹: 안쪽 원의 파란 화살표는 바깥과 반대 방향"] }),
  };
  const name = ([k, f]) => {
    const A = k === 0 ? "" : k === 1 ? "a" : "a" + "⁰¹²³⁴⁵⁶⁷⁸⁹"[k];
    return (A + (f ? "b" : "")) || "e";
  };
  const S = MKit.setup("card-m12-cayleygraph", 0.8, draw);
  if (!S) return;
  const { k, v } = S;
  function draw() {
    const c = QSim.col(), sel = k.val("g"), n = k.val("n"), M = MODELS[sel](n), m = M.m;
    const f = QSim.frame(v, { x0: -1.35, x1: 1.35, y0: -1.3, y1: 1.3, equal: true, pad: 4 });
    const pos = ([kk, ff]) => { const R = ff ? 0.55 : 1.05, t = Math.PI / 2 - (2 * Math.PI * kk) / m; return [R * Math.cos(t), R * Math.sin(t)]; };
    const B = "hsl(30, 85%, 50%)";
    const els = []; for (let ff = 0; ff < 2; ff++) for (let kk = 0; kk < m; kk++) els.push([kk, ff]);
    const shrink = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
    for (const g of els) {
      const p = pos(g);
      // 오른쪽에 a를 곱하기: 파란 화살표
      const qa = pos(M.mul(g, [1, 0])), s0 = shrink(p, qa, 0.12), s1 = shrink(p, qa, 0.86);
      f.arrow(s0[0], s0[1], s1[0] - s0[0], s1[1] - s0[1], c.main);
      // 오른쪽에 b를 곱하기: 주황
      const gb = M.mul(g, [0, 1]), qb = pos(gb);
      if (sel === "quat") { const t0 = shrink(p, qb, 0.12), t1 = shrink(p, qb, 0.86); f.arrow(t0[0], t0[1], t1[0] - t0[0], t1[1] - t0[1], B); }
      else if (g[1] === 0) f.path([p, qb], B, 2);
    }
    for (const g of els) { const [x, y] = pos(g); f.dot(x, y, g[0] === 0 && g[1] === 0 ? c.warn : c.ink2, 5); f.text(name(g), x * (g[1] ? 0.72 : 1.16), y * (g[1] ? 0.72 : 1.16) - 0.04, c.ink, "center"); }
    k.out(`${M.pres}, 원소 ${2 * m}개 · 파랑 = 오른쪽에 a 곱하기, 주황 = 오른쪽에 b 곱하기\n${M.rels.join("\n")}`);
  }
  S.redraw();
})();
