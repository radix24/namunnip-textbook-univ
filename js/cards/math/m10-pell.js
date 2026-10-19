/* 수학10 탐구: √d의 연분수 주기와 수렴분수 p/q — p² − dq² 의 값, 펠 방정식의 기본해 */
(() => {
  "use strict";
  const S = MKit.setup("card-m10-pell", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  function draw() {
    const c = QSim.col(), d = k.val("d"), g = v.g, W = v.W, H = v.H, a0 = Math.floor(Math.sqrt(d));
    g.save(); g.font = "12px monospace"; g.fillStyle = c.ink2; g.textBaseline = "top";
    if (a0 * a0 === d) { g.fillText(`${d}은 완전제곱수: x² − ${d}y² = 1은 자명한 해 (1, 0)뿐`, 10, 10); g.restore(); k.out(`d = ${d}는 완전제곱수입니다`); return; }
    let m = 0, dd = 1, a = a0; const per = [];
    do { m = dd * a - m; dd = (d - m * m) / dd; a = Math.floor((a0 + m) / dd); per.push(a); } while (a !== 2 * a0);
    const r = per.length, seq = [a0, ...per, ...per];
    const D = BigInt(d); let h0 = 1n, h1 = BigInt(a0), k0 = 0n, k1 = 1n; const rows = [[h1, k1, h1 * h1 - D * k1 * k1]];
    for (let i = 1; i < Math.min(seq.length, 2 * r + 1); i++) { const ai = BigInt(seq[i]); [h0, h1] = [h1, ai * h1 + h0]; [k0, k1] = [k1, ai * k1 + k0]; rows.push([h1, k1, h1 * h1 - D * k1 * k1]); }
    const fi = rows.findIndex(([, , n]) => n === 1n);
    g.fillText(`√${d} = [${a0}; ${per.join(", ")} (반복)]  주기 ${r}`, 10, 8);
    g.fillText("  n            p              q     p² − dq²", 10, 30);
    const show = rows.slice(0, Math.min(rows.length, Math.floor((H - 50) / 16)));
    show.forEach(([p, q, nn], i) => { g.fillStyle = i === fi ? c.warn : nn === -1n ? c.main : c.ink; g.fillText(`${String(i).padStart(3)} ${p.toString().padStart(12)} ${q.toString().padStart(14)} ${nn.toString().padStart(10)}`, 10, 48 + i * 16); });
    g.restore();
    const [x1, y1] = fi >= 0 ? rows[fi] : [0n, 0n], neg = rows.findIndex(([, , n]) => n === -1n);
    k.out(`d = ${d} · 주기 ${r}(${r % 2 ? "홀수" : "짝수"}) · 기본해 (x, y) = (${x1}, ${y1}) (n = ${fi}, 빨강)${neg >= 0 ? ` · x² − ${d}y² = −1의 해 (${rows[neg][0]}, ${rows[neg][1]}) (파랑)` : " · −1의 해는 없음"}\n두 번째 해: x = ${x1 * x1 + D * y1 * y1}, y = ${2n * x1 * y1}`);
  }
  S.redraw();
})();
