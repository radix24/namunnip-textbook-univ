/* 수학3 탐구: 4비트 덧셈기 — 전가산기 4개의 올림이 오른쪽에서 왼쪽으로 전달된다 */
(() => {
  "use strict";
  const S = MKit.setup("card-m3-adder", 0.5, draw);
  if (!S) return;
  const { k, v, cv } = S;
  let A = [0, 1, 1, 0], B = [0, 1, 1, 1], boxes = [];
  function draw() {
    const c = QSim.col(), g = v.g, W = v.W, H = v.H, cw = W / 5.2;
    let carry = 0; const sum = [0, 0, 0, 0], cin = [0, 0, 0, 0];
    for (let i = 3; i >= 0; i--) { cin[i] = carry; const s = A[i] ^ B[i] ^ carry; carry = (A[i] & B[i]) | (carry & (A[i] ^ B[i])); sum[i] = s; }
    boxes = [];
    g.save(); g.textAlign = "center"; g.textBaseline = "middle";
    const rowY = [H * 0.14, H * 0.32, H * 0.58, H * 0.85];
    for (let i = 0; i < 4; i++) {
      const x = cw * (i + 1.2);
      [[A, 0], [B, 1]].forEach(([arr, r]) => {
        const y = rowY[r]; g.fillStyle = arr[i] ? c.main : c.card; g.strokeStyle = c.ink2; g.lineWidth = 1.5; g.fillRect(x - 18, y - 16, 36, 32); g.strokeRect(x - 18, y - 16, 36, 32);
        g.fillStyle = arr[i] ? c.card : c.ink; g.font = "18px monospace"; g.fillText(String(arr[i]), x, y); boxes.push({ x, y, arr, i });
      });
      // 전가산기 상자
      g.strokeStyle = c.ink3; g.strokeRect(x - 30, rowY[2] - 22, 60, 44); g.fillStyle = c.ink2; g.font = "11px monospace"; g.fillText("전가산기", x, rowY[2] - 8); g.fillText(`올림입력 ${cin[i]}`, x, rowY[2] + 10);
      g.fillStyle = sum[i] ? c.acc : c.card; g.fillRect(x - 18, rowY[3] - 16, 36, 32); g.strokeStyle = c.ink2; g.strokeRect(x - 18, rowY[3] - 16, 36, 32); g.fillStyle = c.ink; g.font = "18px monospace"; g.fillText(String(sum[i]), x, rowY[3]);
      if (i > 0 && cin[i - 1]) { g.strokeStyle = c.warn; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x - 30, rowY[2]); g.lineTo(x - cw + 30, rowY[2]); g.stroke(); }
    }
    g.fillStyle = carry ? c.warn : c.ink3; g.font = "18px monospace"; g.fillText(String(carry), cw * 0.25, rowY[3]); g.font = "11px monospace"; g.fillText("올림", cw * 0.25, rowY[3] - 24);
    g.fillStyle = c.ink2; g.font = "12px monospace"; g.textAlign = "left"; g.fillText("A", 4, rowY[0]); g.fillText("B", 4, rowY[1]); g.fillText("A+B", 4, rowY[3] + 22);
    g.restore();
    const val = (arr) => arr.reduce((s, b) => s * 2 + b, 0);
    k.out(`A = ${A.join("")}₂ = ${val(A)}, B = ${B.join("")}₂ = ${val(B)} → 합 ${carry}${sum.join("")}₂ = ${carry * 16 + val(sum)} · 올림이 넘어간 자리 ${cin.filter(Boolean).length + carry}곳 (빨간 선과 왼쪽 끝)\n위쪽 비트를 누르면 0과 1이 바뀝니다. 자리 i의 합 = a ⊕ b ⊕ 올림, 다음 올림 = 다수결(a, b, 올림)`);
  }
  cv.addEventListener("pointerdown", (e) => {
    const r = cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
    const b = boxes.find((b) => Math.abs(px - b.x) < 20 && Math.abs(py - b.y) < 18);
    if (b) { b.arr[b.i] ^= 1; S.redraw(); }
  });
  S.redraw();
})();
