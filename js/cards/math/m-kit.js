/* 수학과 탐구 카드 공통 도구 (QSim 위에 얹음)
   - MKit.setup(id, aspect, draw): 카드·캔버스·다시 그리기 묶음
   - MKit.drag(cv, getFrame, getPts, onMove): 캔버스 위 점 끌기 (가장 가까운 점, 손가락도 됨)
   - MKit.posOf(cv, f, e): 화면 좌표 → 수학 좌표 */
(() => {
  "use strict";
  if (window.MKit) return;
  const posOf = (cv, f, e) => {
    const r = cv.getBoundingClientRect();
    return [f.x0 + (e.clientX - r.left - f.X(f.x0)) / f.sx, f.y0 + (f.Y(f.y0) - (e.clientY - r.top)) / f.sy];
  };

  function setup(id, aspect, draw, canvasIndex = 0) {
    const k = QSim.card(id);
    if (!k) return null;
    const cv = k.$$("canvas")[canvasIndex];
    const v = QSim.view(cv, aspect);
    const redraw = () => { v.fit(); draw(); };
    k.on(redraw);
    QSim.redrawOn(redraw);
    return { k, cv, v, redraw };
  }

  /* getPts()는 [[x, y], …]를 돌려준다. onMove(i, x, y)에서 값을 고친다 */
  function drag(cv, getFrame, getPts, onMove, radius = 18) {
    let idx = -1;
    cv.addEventListener("pointerdown", (e) => {
      const f = getFrame(); if (!f) return;
      const r = cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
      let best = radius;
      idx = -1;
      getPts().forEach(([x, y], i) => { const d = Math.hypot(f.X(x) - px, f.Y(y) - py); if (d < best) { best = d; idx = i; } });
      if (idx >= 0) { cv.setPointerCapture(e.pointerId); e.preventDefault(); }
    });
    cv.addEventListener("pointermove", (e) => {
      if (idx < 0) return;
      const f = getFrame(); const [x, y] = posOf(cv, f, e);
      onMove(idx, Math.max(f.x0, Math.min(f.x1, x)), Math.max(f.y0, Math.min(f.y1, y)));
    });
    const end = () => { idx = -1; };
    cv.addEventListener("pointerup", end);
    cv.addEventListener("pointercancel", end);
  }

  /* 슬라이더 값을 코드에서 바꾸고 표시도 맞춘다 */
  const setVal = (k, name, value) => { const e = k.$(`[name="${name}"]`); if (e) { e.value = value; k.show(); } };
  const fmt = (x, d = 3) => (Math.abs(x) < 1e-12 ? "0" : (+x.toFixed(d)).toString());

  window.MKit = { setup, drag, posOf, setVal, fmt };
})();
