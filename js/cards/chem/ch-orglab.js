/* 화학과 유기화학실험 탐구 카드 묶음 (화학7 유기화학실험)
   재결정 회수율, TLC */
(() => {
  "use strict";
  const C = () => QSim.col();
  const RED = "#b5562a";

  /* 1. 재결정: 용매량, 식히는 온도, 불순물 (화학7-01-02) */
  (() => {
    const S = QSim.card("lab-ch7-recryst"); if (!S) return;
    const cv = S.$("canvas");
    // 물에 대한 용해도 (g/100 mL): 0 °C와 100 °C 값을 지수 함수로 잇는 단순 모형
    const CMP = { bz: { n: "벤조산", s0: 0.17, s100: 5.9 }, ac: { n: "아세트아닐라이드", s0: 0.53, s100: 5.5 } };
    const sol = (s0, s100, T) => s0 * Math.exp(Math.log(s100 / s0) * T / 100);
    const imp = (T) => 0.5 * Math.exp(0.02 * T);   // 가상의 불순물 X: 0 °C에서 0.50 g/100 mL
    function draw() {
      const c = C(), k = CMP[S.val("cmp")], m = S.val("m"), mult = S.val("mult"), Tc = S.val("Tc"), mi = S.val("imp");
      const s = (T) => sol(k.s0, k.s100, T);
      const Vmin = m / k.s100 * 100, V = mult * Vmin;
      const dis = Math.min(m, k.s100 * V / 100), undis = m - dis;
      const left = Math.min(dis, s(Tc) * V / 100), rec = dis - left;
      const ix = Math.max(0, mi - imp(Tc) * V / 100), pur = rec + ix > 0 ? 100 * rec / (rec + ix) : 0;
      // 그래프: 이 용매 부피에 녹을 수 있는 양(g)과 온도
      const top = Math.max(m * 1.6, 1);
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: 100, y0: 0, y1: top, xl: "온도 (°C)", yl: `이 용매(${V.toFixed(1)} mL)에 녹는 양 (g)`, pad: 36 });
      f.axes();
      f.fn((T) => s(T) * V / 100, c.main, 2.5);
      f.fn((T) => imp(T) * V / 100, RED, 2);
      f.fn(() => m, c.main, 1, [5, 4]);
      f.fn(() => mi, RED, 1, [5, 4]);
      f.dot(Tc, s(Tc) * V / 100, c.warn, 6);
      f.text(k.n, 70, Math.min(top * 0.95, s(70) * V / 100 + top * 0.04), c.main);
      f.text("불순물 X (가상)", 70, Math.min(top * 0.9, imp(70) * V / 100 + top * 0.04), RED);
      let t = `${k.n} ${m.toFixed(2)} g, 물 ${V.toFixed(1)} mL (최소량 ${Vmin.toFixed(1)} mL의 ${mult.toFixed(1)}배), ${Tc} °C까지 식힘\n`;
      if (undis > 1e-9) t += `끓여도 ${undis.toFixed(3)} g이 녹지 않음 → 뜨거운 여과로 걸러 내면 그만큼 잃는다\n`;
      t += `모액에 녹아 남는 양 ${left.toFixed(3)} g → 결정 ${rec.toFixed(3)} g, 회수율 ${(100 * rec / m).toFixed(1)}%\n`;
      t += ix > 0 ? `불순물 X ${ix.toFixed(3)} g이 함께 석출 → 결정 순도 ${pur.toFixed(1)}%` : `불순물 X ${mi.toFixed(2)} g은 모두 모액에 남음 → 결정 순도 100%`;
      S.out(t);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. TLC: 전개 용매의 극성과 Rf (화학7-02-02) */
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
