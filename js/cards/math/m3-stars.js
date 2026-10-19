/* 수학3 탐구: 별과 막대 — 별 k개를 상자 n개에 나누는 방법을 하나씩 넘겨 보기 */
(() => {
  "use strict";
  const S = MKit.setup("card-m3-stars", 0.4, draw);
  if (!S) return;
  const { k, v } = S;
  const C = (a, b) => { if (b < 0 || b > a) return 0; let r = 1; for (let i = 1; i <= b; i++) r = (r * (a - b + i)) / i; return Math.round(r); };
  // idx번째 배치: 길이 n+k−1 문자열에서 막대 위치 조합을 사전순으로
  function nth(n, kk, idx) {
    const L = n + kk - 1, bars = n - 1, pos = []; let start = 0, rem = idx;
    for (let b = 0; b < bars; b++) {
      for (let p = start; p < L; p++) { const cnt = C(L - p - 1, bars - b - 1); if (rem < cnt) { pos.push(p); start = p + 1; break; } rem -= cnt; }
    }
    return pos;
  }
  function draw() {
    const c = QSim.col(), n = k.val("n"), kk = k.val("kk"), total = C(n + kk - 1, kk), is = k.$('[name="i"]');
    if (+is.max !== total) { is.max = total; MKit.setVal(k, "i", Math.min(+is.value, total)); }
    const idx = k.val("i") - 1, bars = nth(n, kk, idx), L = n + kk - 1, g = v.g, W = v.W, H = v.H;
    const cw = Math.min(40, (W - 20) / L), x0 = (W - cw * L) / 2, y = H * 0.4;
    g.save(); g.textAlign = "center"; g.textBaseline = "middle"; g.font = `${Math.min(28, cw * 0.8)}px sans-serif`;
    const xs = []; let cur = 0;
    for (let p = 0; p < L; p++) {
      const isBar = bars.includes(p), X = x0 + (p + 0.5) * cw;
      if (isBar) { g.strokeStyle = c.ink; g.lineWidth = 3; g.beginPath(); g.moveTo(X, y - cw * 0.6); g.lineTo(X, y + cw * 0.6); g.stroke(); xs.push(cur); cur = 0; }
      else { g.fillStyle = c.acc; g.fillText("★", X, y); cur++; }
    }
    xs.push(cur);
    g.font = "14px monospace"; g.fillStyle = c.ink2; g.fillText(`(${xs.join(", ")})`, W / 2, H * 0.82);
    g.restore();
    k.out(`상자 n = ${n}, 별 k = ${kk} · 별 ${kk}개와 막대 ${n - 1}개를 ${L}칸에 늘어놓는 방법 = C(${L}, ${kk}) = ${total}\n${idx + 1}번째 배치 → x = (${xs.join(", ")}), 합 ${xs.reduce((a, b) => a + b, 0)}`);
  }
  S.redraw();
})();
