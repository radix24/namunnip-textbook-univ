/* 전전18 지능형시스템설계및응용 탐구 카드: roofline 모형(02-01) */
(() => {
  "use strict";
  if (!window.QSim) return;
  const f2 = (x, d = 2) => (Math.abs(x) < 5e-13 ? 0 : x).toFixed(d);
  const S = QSim.card("exp-e18-roofline"); if (!S) return;
  const cv = S.$("canvas");
  function draw() {
    const c = QSim.col(), peak = S.val("peak"), bw = S.val("bw"), n = 2 ** S.val("ln"), kind = S.val("kind");
    // 연산 강도 I(FLOP/byte): 행렬 곱 n×n(4바이트 원소, 캐시에 다 들어간다고 가정) 2n³/(3·4n²) = n/6, 벡터 덧셈 1/12, 행렬-벡터 2n²/(4n² + 8n) ≈ 1/2
    const I = kind === "mm" ? (2 * n ** 3) / (3 * 4 * n * n) : kind === "mv" ? (2 * n * n) / (4 * n * n + 8 * n) : 1 / 12;
    const ridge = peak / bw, att = Math.min(peak, bw * I);
    const v = QSim.view(cv, 0.5), fr = QSim.frame(v, { x0: -2, x1: 3, y0: -1, y1: 4, xl: "log₁₀ 연산 강도 (FLOP/byte)", yl: "log₁₀ GFLOP/s", pad: 34 }); fr.axes();
    fr.fn((li) => Math.log10(Math.min(peak, bw * 10 ** li)), c.main, 2.6);
    fr.path([[Math.log10(ridge), -1], [Math.log10(ridge), 4]], c.ink3, 1, [3, 3]);
    fr.dot(Math.log10(I), Math.log10(att), c.warn, 6);
    S.out(`최대 연산 ${peak} GFLOP/s, 메모리 대역 ${bw} GB/s → 꺾이는 점(ridge) ${f2(ridge, 2)} FLOP/byte\n` +
      `${kind === "mm" ? `행렬 곱 n = ${n}` : kind === "mv" ? `행렬-벡터 곱 n = ${n}` : "벡터 덧셈"}: 연산 강도 ${f2(I, 3)} FLOP/byte → 도달 가능 성능 min(최대, 대역 × 강도) = ${f2(att, 1)} GFLOP/s, ` +
      `${bw * I < peak ? "메모리 한계(대역을 늘리거나 재사용을 늘려야 함)" : "연산 한계(연산기를 늘려야 함)"}`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();
