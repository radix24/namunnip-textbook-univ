/* 수학2 탐구: 폰 노이만 자연수 — n = {0, 1, …, n−1}을 중괄호와 겹친 원으로 펼쳐 보기 */
(() => {
  "use strict";
  const S = MKit.setup("card-m2-vn", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  const memo = ["∅"];
  const str = (n) => { if (memo[n] !== undefined) return memo[n]; const s = n === 0 ? "∅" : "{" + [...Array(n).keys()].map(str).join(", ") + "}"; memo[n] = s; return s; };
  const countEmpty = (n) => (n === 0 ? 1 : [...Array(n).keys()].reduce((s, j) => s + countEmpty(j), 0));
  function draw() {
    const c = QSim.col(), n = k.val("n"), g = v.g, W = v.W, H = v.H;
    // 원 안에 원소 원들을 가로로 배치하는 재귀 그림
    const circ = (m, x, y, r, depth) => {
      g.strokeStyle = depth === 0 ? c.main : c.ink3; g.lineWidth = depth === 0 ? 2 : 1;
      g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke();
      if (m === 0 || r < 3) return;
      const rr = Math.min(r * 0.9 / m, r * 0.42);
      for (let j = 0; j < m; j++) { const cx = x - r * 0.9 + rr + (j * (2 * r * 0.9 - 2 * rr)) / Math.max(1, m - 1); circ(j, m === 1 ? x : cx, y, rr * 0.92, depth + 1); }
    };
    const R = Math.min(W * 0.45, H * 0.45);
    circ(n, W / 2, H / 2, R, 0);
    g.fillStyle = c.ink2; g.font = "12px monospace"; g.textAlign = "left"; g.fillText(`n = ${n}: 바깥 원 하나가 집합 n, 그 안의 원들이 원소 0, …, ${Math.max(0, n - 1)}`, 6, 14);
    const s = str(n);
    k.out(`${n} = ${s.length > 220 ? s.slice(0, 220) + " …" : s}\n원소 ${n}개 · 펼쳐 쓴 글자 수 ${s.length} · ∅의 개수 ${countEmpty(n)}${n ? ` (= 2^${n - 1})` : ""}`);
  }
  S.redraw();
})();
