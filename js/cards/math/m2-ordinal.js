/* 수학2 탐구: 순서수 덧셈 α + β와 β + α를 성냥개비 그림으로 — 앞의 유한한 부분은 뒤의 ω에 흡수된다 */
(() => {
  "use strict";
  const S = MKit.setup("card-m2-ordinal", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const add = ([a1, b1], [a2, b2]) => (a2 > 0 ? [a1 + a2, b2] : [a1, b1 + b2]);
  const name = ([a, b]) => (a === 0 && b === 0 ? "0" : [a ? (a === 1 ? "ω" : `ω·${a}`) : "", b ? String(b) : ""].filter(Boolean).join(" + "));
  const cmp = ([a1, b1], [a2, b2]) => (a1 - a2) || (b1 - b2);
  function draw() {
    const c = QSim.col(), A = [k.val("a1"), k.val("b1")], B = [k.val("a2"), k.val("b2")], g = v.g, W = v.W, H = v.H;
    const colA = c.main, colB = c.acc;
    // 한 줄: [색, ω블록 수, 낱개 수] 조각들
    const row = (y, parts, label, res) => {
      const units = parts.reduce((s, [, a, b]) => s + a * 6 + b, 0) || 1, u = (W - 150) / Math.max(units, 8);
      let x = 140;
      g.fillStyle = c.ink; g.font = "13px monospace"; g.textAlign = "left"; g.fillText(label, 6, y - 14); g.fillStyle = c.ink2; g.fillText(`= ${name(res)}`, 6, y + 4);
      for (const [col, a, b] of parts) {
        g.strokeStyle = col; g.lineWidth = 2;
        for (let j = 0; j < a; j++) {
          const w = 6 * u;
          for (let i = 0; i < 22; i++) { const xx = x + w * 0.92 * (1 - Math.pow(0.8, i)), h = 26 * Math.pow(0.93, i); g.beginPath(); g.moveTo(xx, y); g.lineTo(xx, y - h); g.stroke(); }
          g.fillStyle = col; g.fillText("…", x + w * 0.86, y - 4); x += w;
        }
        for (let j = 0; j < b; j++) { g.beginPath(); g.moveTo(x + u * 0.4, y); g.lineTo(x + u * 0.4, y - 26); g.stroke(); x += u; }
      }
    };
    g.save();
    const AB = add(A, B), BA = add(B, A);
    row(H * 0.38, [[colA, ...A], [colB, ...B]], "α + β", AB);
    row(H * 0.82, [[colB, ...B], [colA, ...A]], "β + α", BA);
    g.restore();
    const d = cmp(AB, BA);
    k.out(`α = ${name(A)} (파랑), β = ${name(B)} (노랑)\nα + β = ${name(AB)}, β + α = ${name(BA)} → ${d === 0 ? "같음" : d < 0 ? "α + β < β + α" : "α + β > β + α"}`
      + (B[0] > 0 && A[1] > 0 ? ` · α의 끝 ${A[1]}개가 β의 ω에 흡수됨` : "") + (A[0] > 0 && B[1] > 0 ? ` · β의 끝 ${B[1]}개가 α의 ω에 흡수됨` : ""));
  }
  S.redraw();
})();
