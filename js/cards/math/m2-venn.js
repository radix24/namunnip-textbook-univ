/* 수학2 탐구: 세 집합 식 두 개를 벤 다이어그램으로 비교 — 다른 영역이 곧 반례 */
(() => {
  "use strict";
  const EX = {
    a1: ["A ∩ (B ∪ C)", (a, b, c) => a && (b || c)],
    a2: ["(A ∩ B) ∪ (A ∩ C)", (a, b, c) => (a && b) || (a && c)],
    a3: ["(A ∩ B) ∪ C", (a, b, c) => (a && b) || c],
    d1: ["A \\ (B ∪ C)", (a, b, c) => a && !(b || c)],
    d2: ["(A \\ B) ∩ (A \\ C)", (a, b, c) => a && !b && a && !c],
    d3: ["(A \\ B) ∪ (A \\ C)", (a, b, c) => (a && !b) || (a && !c)],
    d4: ["A \\ (B ∩ C)", (a, b, c) => a && !(b && c)],
    u1: ["(A \\ B) ∪ B", (a, b) => (a && !b) || b],
    u2: ["A ∪ B", (a, b) => a || b],
    u3: ["A", (a) => a],
    s1: ["A △ B", (a, b) => a !== b],
    s2: ["(A ∪ B) \\ (A ∩ B)", (a, b) => (a || b) && !(a && b)],
    s3: ["A \\ (A \\ B)", (a, b) => a && !(a && !b)],
    s4: ["A ∩ B", (a, b) => a && b],
  };
  const S = MKit.setup("card-m2-venn", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const regionName = (a, b, c) => {
    const ins = [a && "A", b && "B", c && "C"].filter(Boolean), out = [!a && "A", !b && "B", !c && "C"].filter(Boolean);
    return ins.length ? `${ins.join(", ")}에는 속하고${out.length ? ` ${out.join(", ")}에는 속하지 않는` : " 모두에 속하는"} 원소` : "A, B, C 어디에도 속하지 않는 원소";
  };
  function draw() {
    const c = QSim.col(), L = EX[k.val("l")], R = EX[k.val("r")], g = v.g, W = v.W, H = v.H;
    const half = W / 2, rr = Math.min(half * 0.24, H * 0.26);
    const centers = (ox) => [[ox - rr * 0.55, H * 0.42], [ox + rr * 0.55, H * 0.42], [ox, H * 0.42 + rr * 0.9]];
    const diff = new Set();
    for (let m = 0; m < 8; m++) { const a = !!(m & 4), b = !!(m & 2), cc = !!(m & 1); if (!!L[1](a, b, cc) !== !!R[1](a, b, cc)) diff.add(m); }
    g.save();
    [[L, half * 0.5], [R, half * 1.5]].forEach(([E, ox]) => {
      const C = centers(ox), step = 3;
      for (let x = ox - half * 0.48; x < ox + half * 0.48; x += step) for (let y = 18; y < H - 4; y += step) {
        const inn = C.map(([cx, cy]) => (x - cx) ** 2 + (y - cy) ** 2 < rr * rr), m = (inn[0] ? 4 : 0) | (inn[1] ? 2 : 0) | (inn[2] ? 1 : 0);
        const on = E[1](inn[0], inn[1], inn[2]);
        if (on || diff.has(m)) { g.fillStyle = diff.has(m) ? c.warn : c.main; g.globalAlpha = diff.has(m) ? (on ? 0.7 : 0.18) : 0.45; g.fillRect(x, y, step, step); }
      }
      g.globalAlpha = 1; g.strokeStyle = c.ink2; g.lineWidth = 1.5;
      C.forEach(([cx, cy], i) => { g.beginPath(); g.arc(cx, cy, rr, 0, 7); g.stroke(); g.fillStyle = c.ink; g.font = "13px monospace"; g.fillText("ABC"[i], cx + (i === 0 ? -rr * 0.75 : i === 1 ? rr * 0.6 : -4), cy + (i === 2 ? rr * 0.75 : -rr * 0.6)); });
      g.strokeStyle = c.rule; g.strokeRect(ox - half * 0.48, 16, half * 0.96, H - 18);
      g.fillStyle = c.ink; g.font = "13px monospace"; g.textAlign = "center"; g.fillText(E[0], ox, 10); g.textAlign = "left";
    });
    g.restore();
    if (!diff.size) k.out(`${L[0]} = ${R[0]}: 여덟 영역이 모두 일치합니다. 원소 논법으로 증명할 수 있는 등식입니다.`);
    else {
      const m = [...diff][0], a = !!(m & 4), b = !!(m & 2), cc = !!(m & 1);
      k.out(`${L[0]} ≠ ${R[0]}: 빨간 영역 ${diff.size}곳이 다릅니다.\n반례: ${regionName(a, b, cc)} x는 ${L[1](a, b, cc) ? "왼쪽에만" : "오른쪽에만"} 속합니다.`);
    }
  }
  S.redraw();
})();
