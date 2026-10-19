/* 화학과 분석화학실험 탐구 카드 묶음 (화학3)
   검량선법과 표준물 첨가법, 매트릭스 효과 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const RED = "#b5562a";

  /* 1. 검량선법 대 표준물 첨가법 (화학3-04-01, 화학3-04-02) */
  (() => {
    const S = QSim.card("lab-ch3-stdadd"); if (!S) return;
    const [cv1, cv2] = S.$$("canvas");
    // Fe-페난트롤린(510 nm) 가상 실험: 순수한 물 속 감도 k = 0.199 AU/(mg/L), 시료 참 농도 2.50 mg/L
    // 시료 10.00 mL + 10.0 mg/L 표준 0, 1, 2, 3 mL → 25.00 mL로 묽힘
    const K = 0.199, CX = 2.50, VS = [0, 1, 2, 3];
    function fitLine(xs, ys) {
      const n = xs.length, mx = xs.reduce((a, b) => a + b) / n, my = ys.reduce((a, b) => a + b) / n;
      const sl = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / xs.reduce((s, x) => s + (x - mx) ** 2, 0);
      return [sl, my - sl * mx];
    }
    function draw() {
      const c = C(), f = S.val("f"), b = S.val("b"), bc = S.val("bc");
      const bg = b * 10 / 25, sub = bc ? bg : 0;
      const A = VS.map((v) => f * K * (CX * 10 / 25 + 10.0 * v / 25) + bg - sub);
      const cal = A[0] / K * 25 / 10;
      const [sl, ic] = fitLine(VS, A), vx = ic / sl, sa = vx * 10.0 / 10.0;
      // 표준물 첨가 그림
      const v = QSim.view(cv1, 0.5), fr = QSim.frame(v, { x0: -3.5, x1: 3.5, y0: 0, y1: 0.6, xl: "첨가한 표준 (mL)", yl: "흡광도", pad: 36 });
      fr.axes();
      fr.path([[-vx, 0], [3.3, sl * 3.3 + ic]], c.main, 2, [5, 4]);
      VS.forEach((x, i) => fr.dot(x, A[i], c.main, 5));
      fr.dot(-vx, 0, RED, 6);
      fr.text(`x 절편 −${vx.toFixed(2)} mL`, -3.3, 0.05, RED);
      // 검량선(순수한 물 속 표준)
      const w = QSim.view(cv2, 0.42), f2 = QSim.frame(w, { x0: 0, x1: 5, y0: 0, y1: 1.1, xl: "농도 (mg/L)", yl: "흡광도", pad: 36 });
      f2.axes();
      f2.fn((x) => K * x, c.ink3, 2);
      [0, 1, 2, 3, 4, 5].forEach((x) => f2.dot(x, K * x, c.ink3, 4));
      f2.dot(A[0] / K, A[0], RED, 6);
      S.out(`매트릭스 감도 인자 ${f.toFixed(2)}, 매트릭스 바탕 흡광도 ${b.toFixed(3)}${bc ? " (바탕 시료로 뺌)" : ""}\n표준물 첨가 흡광도 ${A.map((a) => a.toFixed(4)).join(", ")}\n검량선법 결과 ${cal.toFixed(3)} mg/L, 표준물 첨가법 결과 ${sa.toFixed(3)} mg/L (참값 2.500)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
