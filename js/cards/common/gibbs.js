/* Gibbs 현상: 사각파의 Fourier 부분합을 항 수 N에 따라 그린다 */
(() => {
  "use strict";
  const root = document.getElementById("card-c9-gibbs");
  if (!root) return;
  const cv = root.querySelector("canvas");
  const $ = (s) => root.querySelector(s);
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || "#888";
  const S = (x, N) => { let s = 0; for (let k = 1; k <= N; k += 2) s += Math.sin(k * x) / k; return (4 / Math.PI) * s; };

  const render = () => {
    const N = 2 * (+$(".n").value) - 1; // 홀수 최고차
    $(".nv").textContent = N;
    const dpr = window.devicePixelRatio || 1;
    const W = cv.clientWidth, H = Math.round(W * 0.55);
    cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + "px";
    const g = cv.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    const x0 = -Math.PI, x1 = Math.PI, y0 = -1.45, y1 = 1.45;
    const X = (x) => 10 + ((x - x0) / (x1 - x0)) * (W - 20);
    const Y = (y) => 8 + ((y1 - y) / (y1 - y0)) * (H - 16);
    g.strokeStyle = css("--ink-3"); g.lineWidth = 1; g.beginPath();
    g.moveTo(X(x0), Y(0)); g.lineTo(X(x1), Y(0)); g.moveTo(X(0), Y(y0)); g.lineTo(X(0), Y(y1)); g.stroke();
    g.setLineDash([4, 4]); g.beginPath();
    g.moveTo(X(x0), Y(-1)); g.lineTo(X(0), Y(-1)); g.lineTo(X(0), Y(1)); g.lineTo(X(x1), Y(1)); g.stroke();
    g.setLineDash([]);
    g.strokeStyle = css("--forest"); g.lineWidth = 2; g.beginPath();
    let peak = 0;
    for (let i = 0; i <= 800; i++) { const x = x0 + (i / 800) * (x1 - x0); const y = S(x, N); if (x > 0) peak = Math.max(peak, y); i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)); }
    g.stroke();
    $(".out").textContent = `최고차 ${N}항까지 · 0 오른쪽의 최댓값 ${peak.toFixed(4)} (튀어나온 양 ${((peak - 1) / 2 * 100).toFixed(2)}% · 점프 2에 대한 비)`;
  };
  $(".n").addEventListener("input", render);
  window.addEventListener("resize", render);
  render();
})();
