/* 기계1 기계공학창의설계: 평가 행렬 (03-02), 일정과 주경로 (05-01) */
(() => {
  "use strict";

  /* ── 가중 평가 행렬과 민감도 (03-02) ── */
  (() => {
    const S = QSim.card("lab-me-matrix"); if (!S) return;
    const [cv] = S.$$("canvas");
    const CRIT = ["고정력", "한 손 조작", "호환성", "비용", "무게"];
    const CON = [
      { n: "A 지렛대 집게", s: [4, 3, 4, 3, 3] },
      { n: "B 고무 밴드", s: [2, 4, 5, 5, 5] },
      { n: "C 자석 + 케이스", s: [4, 5, 2, 2, 4] },
      { n: "D 중력 잠금 집게", s: [5, 4, 4, 3, 3] }
    ];
    function draw() {
      const c = QSim.col(), w = CRIT.map((_, i) => S.val(`w${i}`)), max = 5 * w.reduce((p, q) => p + q, 0);
      const tot = CON.map((k) => k.s.reduce((p, s, i) => p + s * w[i], 0));
      const order = tot.map((t, i) => [t, i]).sort((a, b) => b[0] - a[0]);
      const v = QSim.view(cv, 0.45), f = QSim.frame(v, { x0: 0, x1: Math.max(max, 1), y0: -0.5, y1: CON.length - 0.5, pad: 4 }), G = v.g;
      CON.forEach((k, i) => {
        const y = CON.length - 1 - i, best = order[0][1] === i;
        G.fillStyle = best ? "rgba(52,160,110,.6)" : "rgba(75,79,224,.35)";
        G.fillRect(f.X(0) + 120, f.Y(y + 0.3), (f.X(tot[i]) - f.X(0)) * (1 - 130 / v.W), f.Y(y - 0.3) - f.Y(y + 0.3));
        f.text(k.n, 0.01 * max, y - 0.08, c.ink2);
        G.fillStyle = c.ink; G.font = "12px monospace"; G.fillText(String(tot[i]), f.X(0) + 124 + (f.X(tot[i]) - f.X(0)) * (1 - 130 / v.W), f.Y(y) + 4);
      });
      const gap = order[0][0] - order[1][0];
      S.out(`가중치 ${CRIT.map((n, i) => `${n} ${w[i]}`).join(", ")} → 만점 ${max}\n순위: ${order.map(([t, i]) => `${CON[i].n} ${t}`).join(" > ")}\n1위와 2위 차이 ${gap}점 (만점의 ${max ? ((100 * gap) / max).toFixed(1) : 0}%)${gap <= 0.05 * max ? " → 차이가 작다: 가중치 판단과 점수 근거를 확인하고 간이 시험으로 확정하세요" : ""}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* ── 일정: 작업 기간과 주경로 (05-01) ── */
  (() => {
    const S = QSim.card("lab-me-cpm"); if (!S) return;
    const [cv] = S.$$("canvas");
    const T = [
      { id: "A", n: "사용자 조사", pre: [] }, { id: "B", n: "요구 사항 표", pre: ["A"] }, { id: "C", n: "개념 발상·선정", pre: ["B"] },
      { id: "D", n: "재료 주문(배송)", pre: ["B"] }, { id: "E", n: "간이 시제품 시험", pre: ["C"] }, { id: "F", n: "최종 시제품 제작", pre: ["D", "E"] },
      { id: "G", n: "시험과 개선", pre: ["F"] }, { id: "H", n: "발표·보고서", pre: ["G"] }
    ];
    function draw() {
      const c = QSim.col(), d = {}; T.forEach((t) => (d[t.id] = S.val(t.id)));
      const es = {}, ef = {}; T.forEach((t) => { es[t.id] = Math.max(0, ...t.pre.map((p) => ef[p])); ef[t.id] = es[t.id] + d[t.id]; });
      const end = Math.max(...T.map((t) => ef[t.id])), lf = {}, ls = {};
      [...T].reverse().forEach((t) => { const succ = T.filter((u) => u.pre.includes(t.id)); lf[t.id] = succ.length ? Math.min(...succ.map((u) => ls[u.id])) : end; ls[t.id] = lf[t.id] - d[t.id]; });
      const crit = T.filter((t) => ls[t.id] - es[t.id] === 0).map((t) => t.id);
      const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: -8, x1: end + 1, y0: -0.5, y1: T.length - 0.5, pad: 4 }), G = v.g;
      T.forEach((t, i) => {
        const y = T.length - 1 - i, cr = crit.includes(t.id);
        G.fillStyle = cr ? "rgba(214,80,60,.7)" : "rgba(75,79,224,.45)";
        G.fillRect(f.X(es[t.id]), f.Y(y + 0.3), (f.X(ef[t.id]) - f.X(es[t.id])), f.Y(y - 0.3) - f.Y(y + 0.3));
        f.text(`${t.id} ${t.n}`, -7.8, y - 0.12, c.ink2);
        if (!cr) { G.strokeStyle = c.ink3; G.setLineDash([3, 3]); G.strokeRect(f.X(ef[t.id]), f.Y(y + 0.3), f.X(lf[t.id]) - f.X(ef[t.id]), f.Y(y - 0.3) - f.Y(y + 0.3)); G.setLineDash([]); }
      });
      for (let x = 0; x <= end; x += 5) f.text(String(x), x, -0.45, c.ink3, "center");
      S.out(`프로젝트 길이 ${end}일\n주경로(빨강, 여유 0): ${crit.join(" → ")}\n여유가 있는 작업(점선 상자가 여유): ${T.filter((t) => !crit.includes(t.id)).map((t) => `${t.id} ${ls[t.id] - es[t.id]}일`).join(", ") || "없음"}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
