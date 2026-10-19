/* 수학5 탐구: 진단 검사와 베이즈 정리 — 10000명 격자로 본 진양성·위양성 */
(() => {
  "use strict";
  const S = MKit.setup("card-m5-bayes", 0.42, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  function draw() {
    const c = QSim.col(), g = v.g, W = v.W, H = v.H;
    const prev = k.val("p") / 100, se = k.val("se") / 100, sp = k.val("sp") / 100, tests = +k.val("t");
    let prior = prev;
    for (let i = 1; i < tests; i++) prior = (prior * se) / (prior * se + (1 - prior) * (1 - sp));
    const N = 10000, sick = Math.round(N * prior), tp = Math.round(sick * se), fp = Math.round((N - sick) * (1 - sp));
    const post = (prior * se) / (prior * se + (1 - prior) * (1 - sp));
    const cols = 200, rows = 50, cs = Math.min((W - 10) / cols, (H - 30) / rows), x0 = (W - cs * cols) / 2, y0 = 4;
    const kind = (i) => (i < tp ? 0 : i < sick ? 1 : i < sick + fp ? 2 : 3);
    const fill = [c.main, c.ink3, c.warn, c.soft];
    for (let i = 0; i < N; i++) {
      const col = Math.floor(i / rows), row = i % rows;
      g.fillStyle = fill[kind(i)]; g.fillRect(x0 + col * cs, y0 + row * cs, Math.max(1, cs - 0.4), Math.max(1, cs - 0.4));
    }
    g.save(); g.font = "12px monospace"; g.textBaseline = "top";
    const lab = [["진양성", c.main], ["위음성", c.ink3], ["위양성", c.warn], ["진음성", c.soft]];
    lab.forEach(([t, cc], i) => { const X = x0 + i * 110; g.fillStyle = cc; g.fillRect(X, y0 + rows * cs + 8, 12, 12); g.fillStyle = c.ink2; g.fillText(t, X + 16, y0 + rows * cs + 8); });
    g.restore();
    k.out(`${tests === 1 ? "" : `앞선 ${tests - 1}번 양성 뒤의 사전확률 ${fmt(prior, 4)} · `}10000명 중 환자 ${sick}명 → 진양성 ${tp}명, 건강 ${N - sick}명 → 위양성 ${fp}명\n양성일 때 환자일 확률 P(D|T) = ${fmt(post, 4)} (양성 ${tp + fp}명 중 ${tp}명)`);
  }
  S.redraw();
})();
