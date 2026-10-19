/* 화학과 유기화학실험 탐구 카드 묶음 (화학7 유기화학실험)
   TLC 전개 용매와 Rf */
(() => {
  "use strict";
  const C = () => QSim.col();
  const RED = "#b5562a";


  /* 1. TLC: 전개 용매의 극성과 Rf (화학7-02-02) */
  (() => {
    const S = QSim.card("lab-ch7-tlc"); if (!S) return;
    const cv = S.$("canvas");
    // 가상 매개변수: 헥세인-아세트산 에틸 혼합물에서 log k = log k1 − n·log φ (φ = 아세트산 에틸 부피 분율), Rf = 1/(1 + k)
    const CMP = [
      { n: "나프탈렌", k1: 0.02, s: 1.0 }, { n: "아세토페논", k1: 0.1, s: 1.5 },
      { n: "벤질 알코올", k1: 0.2, s: 1.8 }, { n: "벤조산", k1: 0.5, s: 2.0 }
    ];
    const rf = (c, p) => 1 / (1 + c.k1 * Math.pow(p, -c.s));
    function draw() {
      const c = C(), p = S.val("ea") / 100, R = CMP.map((m) => rf(m, p));
      const v = QSim.view(cv, 0.62), g = v.g, W = v.W, H = v.H;
      const x0 = W * 0.08, x1 = W * 0.92, yb = H * 0.88, yt = H * 0.1, lanes = 5, dx = (x1 - x0) / lanes;
      g.fillStyle = c.card; g.strokeStyle = c.ink3; g.lineWidth = 1.5; g.fillRect(x0, yt - 10, x1 - x0, yb - yt + 22); g.strokeRect(x0, yt - 10, x1 - x0, yb - yt + 22);
      g.setLineDash([4, 4]); g.beginPath(); g.moveTo(x0, yb); g.lineTo(x1, yb); g.moveTo(x0, yt); g.lineTo(x1, yt); g.stroke(); g.setLineDash([]);
      g.font = "11px " + getComputedStyle(document.documentElement).getPropertyValue("--f-mono"); g.textAlign = "center"; g.fillStyle = c.ink3;
      g.fillText("출발선", x0 + 26, yb + 14); g.fillText("용매 전선", x0 + 34, yt - 14);
      const cols = [c.main, RED, "#2f8f5b", "#9b59b6"];
      const spot = (lane, r, col) => {
        const x = x0 + dx * (lane + 0.5), y = yb - r * (yb - yt), rr = 5 + 6 * r;
        g.fillStyle = col; g.globalAlpha = 0.75; g.beginPath(); g.ellipse(x, y, rr * 1.3, rr, 0, 0, 7); g.fill(); g.globalAlpha = 1;
      };
      R.forEach((r, i) => { spot(i, r, cols[i]); g.fillStyle = c.ink2; g.fillText(CMP[i].n, x0 + dx * (i + 0.5), H - 4); });
      R.forEach((r, i) => spot(4, r, cols[i])); g.fillStyle = c.ink2; g.fillText("혼합물", x0 + dx * 4.5, H - 4);
      const lines = R.map((r, i) => `${CMP[i].n}: Rf ${r.toFixed(2)}, 관에서 나오는 부피 ≈ ${(1 / r).toFixed(1)} CV`);
      const gaps = []; for (let i = 0; i < 3; i++) gaps.push(R[i] - R[i + 1]);
      const best = R.map((r, i) => (r >= 0.2 && r <= 0.4 ? CMP[i].n : null)).filter(Boolean);
      S.out(`헥세인 : 아세트산 에틸 = ${100 - S.val("ea")} : ${S.val("ea")}\n${lines.join("\n")}\n이웃한 점 사이 ΔRf: ${gaps.map((d) => d.toFixed(2)).join(", ")}\nRf 0.2~0.4 (관 크로마토그래피에 알맞음): ${best.length ? best.join(", ") : "없음"}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
