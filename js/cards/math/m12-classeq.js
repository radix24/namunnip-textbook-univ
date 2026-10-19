/* 수학12 탐구: 류 방정식 — 켤레류 크기로 군을 쪼개고 중심을 본다 (S_n, D_n, Q_8, A_4, A_5) */
(() => {
  "use strict";
  const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
  const parts = (e, max = e) => { if (e === 0) return [[]]; const out = []; for (let a = Math.min(e, max); a >= 1; a--) for (const r of parts(e - a, a)) out.push([a, ...r]); return out; };
  function classes(type, n) {
    if (type === "S") {
      return parts(n).map((lam) => {
        const cnt = {}; lam.forEach((x) => { cnt[x] = (cnt[x] || 0) + 1; });
        const z = Object.entries(cnt).reduce((s, [len, m]) => s * len ** m * fact(m), 1);
        return { size: fact(n) / z, label: lam.filter((x) => x > 1).join("+") || "e" };
      }).sort((a, b) => a.size - b.size);
    }
    if (type === "D") {
      const out = [{ size: 1, label: "e" }];
      if (n % 2 === 0) out.push({ size: 1, label: `r${n / 2}` });
      for (let j = 1; j < n / 2; j++) out.push({ size: 2, label: `r±${j}` });
      if (n % 2) out.push({ size: n, label: "반사" }); else out.push({ size: n / 2, label: "반사(꼭짓점 축)" }, { size: n / 2, label: "반사(변 축)" });
      return out;
    }
    if (type === "Q") return [{ size: 1, label: "1" }, { size: 1, label: "−1" }, { size: 2, label: "±i" }, { size: 2, label: "±j" }, { size: 2, label: "±k" }];
    if (type === "A4") return [{ size: 1, label: "e" }, { size: 3, label: "2+2" }, { size: 4, label: "3-순환" }, { size: 4, label: "3-순환'" }];
    return [{ size: 1, label: "e" }, { size: 12, label: "5-순환" }, { size: 12, label: "5-순환'" }, { size: 15, label: "2+2" }, { size: 20, label: "3" }];
  }
  const NAME = { S: (n) => `S_${n}`, D: (n) => `D_${n}`, Q: () => "Q₈", A4: () => "A₄", A5: () => "A₅" };
  const S = MKit.setup("card-m12-classeq", 0.3, draw);
  if (!S) return;
  const { k, v } = S;
  function draw() {
    const c = QSim.col(), type = k.val("g"), n = k.val("n"), C = classes(type, n), N = C.reduce((s, x) => s + x.size, 0);
    const Z = C.filter((x) => x.size === 1).length, rest = C.filter((x) => x.size > 1);
    const g = v.g, W = v.W, H = v.H, x0 = 8, w = W - 16, y0 = H * 0.25, h = H * 0.4;
    g.save(); g.font = "11px monospace"; g.textAlign = "center"; g.textBaseline = "middle";
    let x = x0;
    [...C.filter((q) => q.size === 1), ...rest].forEach((q, i) => {
      const ww = (w * q.size) / N;
      g.globalAlpha = q.size === 1 ? 0.85 : 0.45; g.fillStyle = q.size === 1 ? c.warn : `hsl(${(i * 47) % 360}, 60%, 55%)`;
      g.fillRect(x + 0.5, y0, Math.max(1, ww - 1), h); g.globalAlpha = 1;
      if (ww > 22) { g.fillStyle = c.ink; g.fillText(String(q.size), x + ww / 2, y0 + h / 2); }
      if (ww > 38) { g.fillStyle = c.ink2; g.fillText(q.label, x + ww / 2, y0 + h + 12); }
      x += ww;
    });
    g.restore();
    const fac = []; let m = N; for (let p = 2; p <= m; p++) while (m % p === 0) { fac.push(p); m /= p; }
    const pgrp = new Set(fac).size === 1 ? fac[0] : 0;
    k.out(`${NAME[type](n)}: |G| = ${N} = ${Z} + ${rest.map((q) => q.size).join(" + ")}  (빨강: 중심 ${Z}개 원소, 켤레류 ${C.length}개)\n`
      + (pgrp ? `${pgrp}-군입니다: 중심 밖의 항이 모두 ${pgrp}의 배수라 |Z(G)| = ${Z}도 ${pgrp}의 배수입니다.` : `각 항은 |G| = ${N}의 약수입니다.`));
  }
  S.redraw();
})();
