/* 수학3 탐구: 크러스컬 알고리즘 — 가벼운 변부터 회로를 만들지 않으면 넣어 최소 신장 나무를 만든다 */
(() => {
  "use strict";
  const PTS = [[0.1, 0.5], [0.3, 0.9], [0.32, 0.15], [0.55, 0.55], [0.75, 0.9], [0.78, 0.15], [0.95, 0.5]];
  const E = [[0, 1, 4], [0, 2, 3], [1, 2, 6], [1, 3, 5], [2, 3, 2], [1, 4, 7], [3, 4, 4], [3, 5, 6], [2, 5, 8], [4, 6, 3], [5, 6, 2], [3, 6, 7], [4, 5, 5]];
  const S = MKit.setup("card-m3-kruskal", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  function draw() {
    const c = QSim.col(), step = k.val("s"), g = v.g, W = v.W, H = v.H;
    const sorted = E.map((e, i) => [...e, i]).sort((a, b) => a[2] - b[2] || a[3] - b[3]);
    const par = [...Array(PTS.length).keys()], find = (x) => (par[x] === x ? x : (par[x] = find(par[x])));
    const status = {}; let total = 0, taken = 0, lastMsg = "가벼운 변부터 차례로 살펴봅니다";
    sorted.slice(0, step).forEach(([a, b, w, i]) => {
      const ra = find(a), rb = find(b);
      if (ra !== rb) { par[ra] = rb; status[i] = "in"; total += w; taken++; lastMsg = `변 ${a + 1}–${b + 1} (무게 ${w}) 넣음`; }
      else { status[i] = "skip"; lastMsg = `변 ${a + 1}–${b + 1} (무게 ${w}) 건너뜀: 이미 이어져 있어 회로가 생김`; }
    });
    const P = ([x, y]) => [20 + x * (W - 40), H - 20 - y * (H - 40)];
    g.save(); g.font = "12px monospace"; g.textAlign = "center"; g.textBaseline = "middle";
    E.forEach(([a, b, w], i) => {
      const [x1, y1] = P(PTS[a]), [x2, y2] = P(PTS[b]), st = status[i];
      g.strokeStyle = st === "in" ? c.main : st === "skip" ? c.warn : c.rule; g.lineWidth = st === "in" ? 4 : 1.5; g.setLineDash(st === "skip" ? [4, 4] : []);
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.setLineDash([]);
      g.fillStyle = c.card; g.fillRect((x1 + x2) / 2 - 9, (y1 + y2) / 2 - 8, 18, 16); g.fillStyle = c.ink; g.fillText(String(w), (x1 + x2) / 2, (y1 + y2) / 2);
    });
    PTS.forEach((p, i) => { const [x, y] = P(p); g.fillStyle = c.card; g.strokeStyle = c.ink2; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, 12, 0, 7); g.fill(); g.stroke(); g.fillStyle = c.ink; g.fillText(String(i + 1), x, y); });
    g.restore();
    k.out(`${step}번째 변까지 살펴봄 · 넣은 변 ${taken}개 / 필요한 변 ${PTS.length - 1}개, 무게 합 ${total}\n${lastMsg}${taken === PTS.length - 1 ? " · 완성: 최소 신장 나무" : ""}`);
  }
  S.redraw();
})();
