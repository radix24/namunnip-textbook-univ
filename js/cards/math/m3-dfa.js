/* 수학3 탐구: DFA 실행기 — 문자열을 한 기호씩 읽으며 상태 이동을 그린다 */
(() => {
  "use strict";
  const M = {
    mod3: { name: "3의 배수(이진수)", Q: ["0", "1", "2"], start: 0, acc: [0], d: (q, a) => (2 * q + +a) % 3, pos: [[0.2, 0.5], [0.55, 0.8], [0.85, 0.5]] },
    even1: { name: "1이 짝수 개", Q: ["E", "O"], start: 0, acc: [0], d: (q, a) => (a === "1" ? 1 - q : q), pos: [[0.3, 0.5], [0.75, 0.5]] },
    end01: { name: "01로 끝남", Q: ["A", "B", "C"], start: 0, acc: [2], d: (q, a) => (a === "0" ? 1 : q === 1 ? 2 : 0), pos: [[0.2, 0.5], [0.55, 0.75], [0.85, 0.35]] },
  };
  const S = MKit.setup("card-m3-dfa", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  function draw() {
    const c = QSim.col(), D = M[k.val("m")], w = k.$('[name="w"]').value.replace(/[^01]/g, ""), g = v.g, W = v.W, H = v.H;
    const ss = k.$('[name="s"]'); if (+ss.max !== w.length) { ss.max = w.length; MKit.setVal(k, "s", Math.min(+ss.value, w.length)); }
    const step = Math.min(k.val("s"), w.length);
    const trace = [D.start]; for (const a of w) trace.push(D.d(trace[trace.length - 1], a));
    const cur = trace[step], P = ([x, y]) => [x * W, H - y * H * 0.85 - 10];
    g.save(); g.font = "12px monospace"; g.textAlign = "center"; g.textBaseline = "middle";
    // 전이 화살표
    D.Q.forEach((_, q) => ["0", "1"].forEach((a, ai) => {
      const t = D.d(q, a), [x1, y1] = P(D.pos[q]), [x2, y2] = P(D.pos[t]);
      g.strokeStyle = c.ink3; g.fillStyle = c.ink2; g.lineWidth = 1.2;
      if (t === q) { g.beginPath(); g.arc(x1 + (ai ? 22 : -22), y1 - 26, 12, 0, 7); g.stroke(); g.fillText(a, x1 + (ai ? 22 : -22), y1 - 44); return; }
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, nx = -(y2 - y1), ny = x2 - x1, L = Math.hypot(nx, ny), cx = mx + (nx / L) * 18, cy = my + (ny / L) * 18;
      g.beginPath(); g.moveTo(x1, y1); g.quadraticCurveTo(cx, cy, x2, y2); g.stroke();
      const ex = 0.85 * x2 + 0.15 * cx, ey = 0.85 * y2 + 0.15 * cy; g.beginPath(); g.arc(ex, ey, 3, 0, 7); g.fill();
      g.fillText(a, cx + (nx / L) * 8, cy + (ny / L) * 8);
    }));
    D.Q.forEach((name, q) => {
      const [x, y] = P(D.pos[q]); g.fillStyle = q === cur ? c.main : c.card; g.strokeStyle = c.ink2; g.lineWidth = 1.5;
      g.beginPath(); g.arc(x, y, 18, 0, 7); g.fill(); g.stroke(); if (D.acc.includes(q)) { g.beginPath(); g.arc(x, y, 14, 0, 7); g.stroke(); }
      g.fillStyle = q === cur ? c.card : c.ink; g.font = "14px monospace"; g.fillText(name, x, y);
      if (q === D.start) { g.strokeStyle = c.ink; g.beginPath(); g.moveTo(x - 40, y); g.lineTo(x - 20, y); g.stroke(); }
    });
    // 입력 띠
    g.font = "16px monospace";
    [...w].forEach((a, i) => { const x = 20 + i * 18; g.fillStyle = i < step ? c.ink3 : i === step ? c.warn : c.ink; g.fillText(a, x, 14); });
    g.restore();
    const done = step === w.length, acc = D.acc.includes(cur);
    k.out(`${D.name} · 입력 "${w}" · ${step}글자 읽음, 현재 상태 ${D.Q[cur]} · 상태 순서 ${trace.slice(0, step + 1).map((q) => D.Q[q]).join(" → ")}`
      + (done ? `\n다 읽음: ${acc ? "받아들임 (이중 원)" : "거부"}${k.val("m") === "mod3" && w ? ` · 값 ${parseInt(w, 2)}` : ""}` : ""));
  }
  S.redraw();
})();
