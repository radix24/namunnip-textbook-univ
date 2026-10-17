/* 중심극한정리 모의실험: 치우친 모집단(지수분포)에서 크기 n인 표본을 여러 번 뽑아 표본평균의 히스토그램을 그린다 */
(() => {
  "use strict";
  const root = document.getElementById("card-c7-clt");
  if (!root) return;
  const cv = root.querySelector("canvas");
  const $ = (s) => root.querySelector(s);
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || "#888";
  const MU = 1; // 지수분포 평균 1, 표준편차 1
  const draw1 = () => -Math.log(1 - Math.random()) * MU;
  let means = [];

  const run = (reps) => {
    const n = +$(".n").value;
    for (let r = 0; r < reps; r++) {
      let s = 0;
      for (let i = 0; i < n; i++) s += draw1();
      means.push(s / n);
    }
    render();
  };

  const render = () => {
    const n = +$(".n").value;
    $(".nv").textContent = n;
    const dpr = window.devicePixelRatio || 1;
    const W = cv.clientWidth, H = Math.round(W * 0.62);
    cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + "px";
    const g = cv.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    const x0 = 0, x1 = n === 1 ? 5 : 3, bins = 40, bw = (x1 - x0) / bins;
    const cnt = new Array(bins).fill(0);
    for (const m of means) { const k = Math.floor((m - x0) / bw); if (k >= 0 && k < bins) cnt[k]++; }
    const N = means.length || 1;
    const se = 1 / Math.sqrt(n);
    const pdf = (x) => Math.exp(-((x - MU) ** 2) / (2 * se * se)) / (se * Math.sqrt(2 * Math.PI));
    const ymax = Math.max(pdf(MU) * 1.15, ...cnt.map((c) => c / (N * bw)), 0.5);
    const L = 30, B = H - 24, T = 10, R = W - 10;
    const X = (x) => L + ((x - x0) / (x1 - x0)) * (R - L);
    const Y = (y) => B - (y / ymax) * (B - T);
    g.fillStyle = css("--forest");
    g.globalAlpha = 0.55;
    cnt.forEach((c, k) => { const h = c / (N * bw); g.fillRect(X(x0 + k * bw) + 0.5, Y(h), X(x0 + (k + 1) * bw) - X(x0 + k * bw) - 1, B - Y(h)); });
    g.globalAlpha = 1;
    if (n >= 2) {
      g.strokeStyle = css("--warn"); g.lineWidth = 2; g.beginPath();
      for (let i = 0; i <= 200; i++) { const x = x0 + (i / 200) * (x1 - x0); const px = X(x), py = Y(pdf(x)); i ? g.lineTo(px, py) : g.moveTo(px, py); }
      g.stroke();
    }
    g.strokeStyle = css("--ink-3"); g.lineWidth = 1; g.beginPath(); g.moveTo(L, B); g.lineTo(R, B); g.stroke();
    g.fillStyle = css("--ink-2"); g.font = "12px " + (css("--f-mono") || "monospace"); g.textAlign = "center";
    for (let x = 0; x <= x1; x += 0.5) g.fillText(x.toFixed(1), X(x), B + 16);
    let mean = 0, sd = 0;
    if (means.length) { mean = means.reduce((a, b) => a + b, 0) / means.length; sd = Math.sqrt(means.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, means.length - 1)); }
    $(".out").textContent = `표본 ${means.length}개 · 표본평균들의 평균 ${mean.toFixed(3)} · 표준편차 ${sd.toFixed(3)} (이론 σ/√n = ${se.toFixed(3)})`;
  };

  $(".n").addEventListener("input", () => { means = []; render(); });
  $(".go1").addEventListener("click", () => run(1));
  $(".go").addEventListener("click", () => run(500));
  $(".reset").addEventListener("click", () => { means = []; render(); });
  window.addEventListener("resize", render);
  render();
})();
