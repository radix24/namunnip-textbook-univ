/* 수학12 탐구: 실로우 수 계산기 — n_p ≡ 1 (mod p), n_p | m 으로 정규 실로우 부분군을 찾는다 */
(() => {
  "use strict";
  const factor = (n) => { const f = []; for (let p = 2; p * p <= n; p++) { let e = 0; while (n % p === 0) { n /= p; e++; } if (e) f.push([p, e]); } if (n > 1) f.push([n, 1]); return f; };
  const S = MKit.setup("card-m12-sylow", 0.42, draw);
  if (!S) return;
  const { k, v } = S;
  function draw() {
    const c = QSim.col(), N = k.val("N"), F = factor(N);
    const rows = F.map(([p, a]) => {
      const pa = p ** a, m = N / pa, cand = [];
      for (let d = 1; d <= m; d++) if (m % d === 0 && d % p === 1 % p) cand.push(d);
      return { p, a, pa, m, cand };
    });
    // 원소 세기: 모든 n_p > 1이라 가정하고 e가 아닌 원소의 최소 개수를 어림한다.
    // 지수 1: 위수 p인 부분군 n_p개는 e만 공유 → 위수 p 원소 n_p(p − 1)개.
    // 지수 2 이상: 서로 다른 실로우 부분군 둘의 합집합은 2p^a − p^(a−1)개 이상 → e 아닌 p-원소 그 − 1개 이상.
    let forced = rows.some((r) => r.cand.length === 1);
    let countArg = "";
    if (!forced && rows.length >= 2) {
      const terms = rows.map((r) => (r.a === 1 ? Math.min(...r.cand.filter((x) => x > 1)) * (r.p - 1) : 2 * r.pa - r.pa / r.p - 1));
      const total = 1 + terms.reduce((s, t) => s + t, 0);
      if (total > N) { forced = true; countArg = `원소 세기: 모든 n_p > 1이면 원소가 1 + ${terms.join(" + ")} = ${total}개 이상이라 ${N}을 넘음 → 어떤 n_p는 1, 정규 실로우 부분군이 있음`; }
    }
    const g = v.g, W = v.W, H = v.H, lh = Math.min(26, (H - 10) / Math.max(1, rows.length));
    g.save(); g.font = "13px monospace"; g.textBaseline = "middle";
    rows.forEach((r, i) => {
      const y = 14 + i * lh;
      g.fillStyle = c.ink; g.textAlign = "left"; g.fillText(`p = ${r.p}: |P| = ${r.pa}, m = ${r.m}`, 6, y);
      let x = W * 0.45;
      for (let d = 1; d <= r.m; d++) if (r.m % d === 0) {
        const ok = r.cand.includes(d), one = ok && r.cand.length === 1;
        g.fillStyle = one ? c.main : ok ? c.acc : c.rule; g.globalAlpha = ok ? 0.9 : 0.6;
        const t = String(d), tw = g.measureText(t).width + 10;
        if (x + tw > W - 4) break;
        g.fillRect(x, y - 9, tw, 18); g.globalAlpha = 1; g.fillStyle = ok ? c.card : c.ink3; g.textAlign = "center"; g.fillText(t, x + tw / 2, y); x += tw + 4;
      }
    });
    g.restore();
    const lines = rows.map((r) => `n_${r.p} ∈ {${r.cand.join(", ")}}${r.cand.length === 1 ? " → 실로우 " + r.p + "-부분군은 정규" : ""}`);
    let verdict;
    if (F.length === 1) verdict = `${N}은 소수 거듭제곱: G 자신이 ${F[0][0]}-군이고 중심이 자명하지 않음 (단순군이면 위수 ${F[0][0]})`;
    else if (rows.every((r) => r.cand.length === 1)) verdict = `모든 실로우 부분군이 정규 → G는 실로우 부분군들의 직적${rows.every((r) => r.a === 1) ? ", 각 인수가 위수 p인 순환군이라 G ≅ Z_" + N + " (순환군)" : rows.every((r) => r.a <= 2) ? ", 각 인수가 가환(위수 p 또는 p²)이라 G는 가환군" : ""}`;
    else if (forced) verdict = countArg || "정규 실로우 부분군이 있어 위수 " + N + "인 단순군은 없음";
    else verdict = "개수 조건만으로는 정규 실로우 부분군을 보장할 수 없음 (더 정교한 논법 필요)";
    k.out(`|G| = ${N} = ${F.map(([p, a]) => (a > 1 ? `${p}^${a}` : p)).join("·")}\n${lines.join("\n")}\n${verdict}`);
  }
  S.redraw();
})();
