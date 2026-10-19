/* 수학2 탐구: F₂ⁿ에서 일차독립 집합을 하나씩 키우기 — 더 이상 못 키우는(극대) 집합이 기저 */
(() => {
  "use strict";
  const S = MKit.setup("card-m2-basis", 0.5, draw);
  if (!S) return;
  const { k, v, cv } = S;
  let chosen = [], msg = "", boxes = [], lastN = 0;
  const bits = (x, n) => x.toString(2).padStart(n, "0");
  // XOR 기저로 생성 공간 계산
  function span(vs) { const sp = new Set([0]); for (const x of vs) for (const y of [...sp]) sp.add(x ^ y); return sp; }
  function draw() {
    const c = QSim.col(), n = k.val("n"), g = v.g, W = v.W, H = v.H;
    if (n !== lastN) { chosen = []; msg = ""; lastN = n; }
    const sp = span(chosen), all = [...Array(2 ** n).keys()].slice(1);
    const cols = Math.min(all.length, n === 4 ? 8 : 7), bw = Math.min(70, (W - 20) / cols), bh = 30;
    boxes = [];
    g.save(); g.textAlign = "center"; g.textBaseline = "middle"; g.font = "13px monospace";
    all.forEach((x, i) => {
      const bx = 10 + (i % cols) * bw, by = 14 + Math.floor(i / cols) * (bh + 10);
      boxes.push({ x, bx, by, bw, bh });
      const inS = chosen.includes(x), inSpan = sp.has(x);
      g.fillStyle = inS ? c.main : inSpan ? c.soft : c.card; g.globalAlpha = inS ? 0.85 : 0.6; g.fillRect(bx + 2, by, bw - 4, bh); g.globalAlpha = 1;
      g.strokeStyle = inSpan && !inS ? c.ink3 : c.ink2; g.strokeRect(bx + 2, by, bw - 4, bh);
      g.fillStyle = inS ? c.card : c.ink; g.fillText(`(${bits(x, n).split("").join(",")})`, bx + bw / 2, by + bh / 2);
    });
    const yb = 14 + Math.ceil(all.length / cols) * (bh + 10) + 20;
    g.textAlign = "left"; g.fillStyle = c.ink2;
    g.fillText(`고른 집합 S의 크기 ${chosen.length} · 생성하는 벡터 ${sp.size}개 (= 2^${chosen.length}) / 전체 ${2 ** n}개`, 10, yb);
    g.restore();
    const maximal = sp.size === 2 ** n;
    k.out((msg ? msg + "\n" : "") + (maximal ? `더 넣을 수 있는 벡터가 없습니다: S는 극대 일차독립 집합, 곧 기저입니다 (크기 ${n}).` : `연보라 칸은 이미 S의 일차결합이라 넣으면 일차종속이 됩니다. 흰 칸을 눌러 S를 키우세요.`) + " 파란 칸을 다시 누르면 뺍니다.");
  }
  cv.addEventListener("pointerdown", (e) => {
    const r = cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
    const b = boxes.find((b) => px >= b.bx && px <= b.bx + b.bw && py >= b.by && py <= b.by + b.bh);
    if (!b) return;
    const n = lastN;
    if (chosen.includes(b.x)) { chosen = chosen.filter((x) => x !== b.x); msg = `(${bits(b.x, n)})를 뺐습니다.`; }
    else if (span(chosen).has(b.x)) msg = `(${bits(b.x, n)})는 이미 S로 만들 수 있어(일차결합) 넣으면 일차독립이 깨집니다.`;
    else { chosen.push(b.x); msg = `(${bits(b.x, n)})를 넣었습니다. S는 여전히 일차독립입니다.`; }
    S.redraw();
  });
  S.redraw();
})();
