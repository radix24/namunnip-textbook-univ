/* 수학6 탐구: 감쇠 진자 θ'' + cθ' + sin θ = 0의 상평면 — 평형점과 선형화, 눌러서 궤적 추가 */
(() => {
  "use strict";
  let f, seeds = [[0.5, 0], [2.5, 0], [-3, 2.4]];
  const S = MKit.setup("card-m6-pendulum", 0.55, draw);
  if (!S) return;
  const { k, v, cv } = S;
  const { fmt } = MKit;
  function draw() {
    const c = QSim.col(), cc = k.val("c"), F = (t, s) => [s[1], -Math.sin(s[0]) - cc * s[1]];
    f = QSim.frame(v, { x0: -2 * Math.PI, x1: 2 * Math.PI, y0: -3.2, y1: 3.2, pad: 26, xl: "θ", yl: "θ'" });
    f.axes({ noGrid: true });
    const g = v.g; g.save(); g.strokeStyle = c.rule; g.lineWidth = 1;
    for (let i = 0; i <= 26; i++) for (let j = 0; j <= 14; j++) {
      const x = -2 * Math.PI + (4 * Math.PI * i) / 26, y = -3.2 + (6.4 * j) / 14, [dx, dy] = F(0, [x, y]);
      const px = dx * f.sx, py = -dy * f.sy, L = Math.hypot(px, py) || 1, len = 6;
      g.beginPath(); g.moveTo(f.X(x) - (len * px) / L, f.Y(y) - (len * py) / L); g.lineTo(f.X(x) + (len * px) / L, f.Y(y) + (len * py) / L); g.stroke();
    }
    g.restore();
    seeds.forEach(([x0, y0], i) => {
      let s = [x0, y0], t = 0; const pts = [s];
      for (let n = 0; n < 3000; n++) { s = QSim.rk4(F, t, s, 0.01); t += 0.01; if (Math.abs(s[1]) > 4 || Math.abs(s[0]) > 8) break; pts.push(s); }
      f.path(pts, i === seeds.length - 1 ? c.warn : c.main, 1.8); f.dot(x0, y0, i === seeds.length - 1 ? c.warn : c.main, 4);
    });
    for (let kk = -2; kk <= 2; kk++) f.dot(kk * Math.PI, 0, kk % 2 ? c.acc : c.ink, 6);
    const down = cc === 0 ? "중심(선형화로는 판정 불가, 에너지 보존으로 실제 중심)" : cc < 2 ? "안정 나선점" : "안정 마디점";
    k.out(`c = ${fmt(cc, 2)} · 아래 평형점 (2kπ, 0): τ = ${fmt(-cc, 2)}, Δ = 1 → ${down} · 위 평형점 ((2k+1)π, 0): Δ = −1 → 안장점(노란 점)\n`
      + `그림을 누르면 그 점에서 출발한 궤적이 더해집니다 (빨강 = 최근)`);
  }
  cv.addEventListener("pointerdown", (e) => { if (!f) return; const p = MKit.posOf(cv, f, e); seeds.push(p); if (seeds.length > 8) seeds.shift(); S.redraw(); });
  S.redraw();
})();
