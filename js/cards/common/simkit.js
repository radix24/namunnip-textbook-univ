/* QSim: 실습·탐구 카드가 함께 쓰는 작은 도구 (외부 라이브러리 없음)
   - QSim.card(id): 카드 안의 조절기 값 읽기, 값 표시, 출력 줄
   - QSim.view(canvas, aspect): 고해상도 화면에 맞춘 그리기 판
   - QSim.frame(v, box): 좌표 변환과 축
   - QSim.loop(step): 화면에 보일 때만 도는 애니메이션
   - QSim.rk4(f, t, y, h): 연립 미분방정식 한 걸음 */
(() => {
  "use strict";
  if (window.QSim) return;
  const css = (n, d) => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || d;
  const col = () => ({
    main: css("--forest", "#4b4fe0"), acc: css("--qed", "#f2b33d"), ink: css("--ink", "#1a1d2e"),
    ink2: css("--ink-2", "#545869"), ink3: css("--ink-3", "#8a8d9b"), rule: css("--rule", "#dadbe0"),
    card: css("--card", "#fcfcfa"), soft: css("--sprout", "#c9cbf7"), warn: "#d9534f"
  });
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function card(id) {
    const root = document.getElementById(id);
    if (!root) return null;
    const $ = (s) => root.querySelector(s), $$ = (s) => [...root.querySelectorAll(s)];
    const val = (name) => { const e = $(`[name="${name}"]`); if (!e) return NaN; return e.type === "checkbox" ? e.checked : (e.tagName === "SELECT" ? e.value : +e.value); };
    const show = () => $$("[data-show]").forEach((s) => {
      const e = $(`[name="${s.dataset.show}"]`); if (!e) return;
      const d = s.dataset.fix; s.textContent = d !== undefined ? (+e.value).toFixed(+d) : e.value;
    });
    const on = (fn) => { $$("input, select").forEach((e) => e.addEventListener("input", () => { show(); fn(); })); show(); };
    const out = (t) => { const o = $(".out"); if (o) o.textContent = t; };
    return { root, $, $$, val, on, out, show };
  }

  function view(cv, aspect = 0.56) {
    const v = { cv, g: cv.getContext("2d"), W: 0, H: 0 };
    v.fit = () => {
      const dpr = window.devicePixelRatio || 1;
      v.W = cv.clientWidth || 320; v.H = Math.round(v.W * aspect);
      cv.width = v.W * dpr; cv.height = v.H * dpr; cv.style.height = v.H + "px";
      v.g.setTransform(dpr, 0, 0, dpr, 0, 0); v.g.clearRect(0, 0, v.W, v.H);
      return v;
    };
    return v.fit();
  }

  /* box = {x0, x1, y0, y1, pad, xl, yl, equal}. equal: 가로세로 같은 축척 */
  function frame(v, b) {
    const p = b.pad ?? 28, W = v.W, H = v.H;
    let sx = (W - p - 8) / (b.x1 - b.x0), sy = (H - p - 8) / (b.y1 - b.y0);
    if (b.equal) sx = sy = Math.min(sx, sy);
    const X = (x) => p + (x - b.x0) * sx, Y = (y) => H - p - (y - b.y0) * sy;
    const f = { X, Y, sx, sy, ...b };
    f.axes = (opt = {}) => {
      const g = v.g, c = col();
      g.save(); g.strokeStyle = c.rule; g.fillStyle = c.ink3; g.lineWidth = 1; g.font = "11px " + css("--f-mono", "monospace");
      const tick = (a0, a1) => { const r = a1 - a0, s = Math.pow(10, Math.floor(Math.log10(r / 4))); const m = r / s > 20 ? 5 : r / s > 8 ? 2 : 1; return s * m; };
      if (!opt.noGrid) {
        const dx = tick(b.x0, b.x1), dy = tick(b.y0, b.y1);
        g.beginPath();
        for (let x = Math.ceil(b.x0 / dx) * dx; x <= b.x1 + 1e-9; x += dx) { g.moveTo(X(x), Y(b.y0)); g.lineTo(X(x), Y(b.y1)); g.fillText(+x.toFixed(6) + "", X(x) - 6, H - p + 13); }
        for (let y = Math.ceil(b.y0 / dy) * dy; y <= b.y1 + 1e-9; y += dy) { g.moveTo(X(b.x0), Y(y)); g.lineTo(X(b.x1), Y(y)); g.fillText(+y.toFixed(6) + "", 2, Y(y) + 4); }
        g.globalAlpha = 0.5; g.stroke(); g.globalAlpha = 1;
      }
      g.strokeStyle = c.ink3; g.beginPath();
      const ay = Math.min(Math.max(0, b.y0), b.y1), ax = Math.min(Math.max(0, b.x0), b.x1);
      g.moveTo(X(b.x0), Y(ay)); g.lineTo(X(b.x1), Y(ay)); g.moveTo(X(ax), Y(b.y0)); g.lineTo(X(ax), Y(b.y1)); g.stroke();
      if (b.xl) g.fillText(b.xl, W - g.measureText(b.xl).width - 4, Y(ay) - 5);
      if (b.yl) g.fillText(b.yl, X(ax) + 5, 12);
      g.restore();
    };
    f.path = (pts, color, w = 2, dash) => {
      const g = v.g; g.save(); g.strokeStyle = color; g.lineWidth = w; if (dash) g.setLineDash(dash);
      g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)))); g.stroke(); g.restore();
    };
    f.fn = (fun, color, w, dash, n = 400) => {
      const pts = []; for (let i = 0; i <= n; i++) { const x = b.x0 + (i / n) * (b.x1 - b.x0); const y = fun(x); if (isFinite(y)) pts.push([x, y]); }
      f.path(pts, color, w, dash);
    };
    f.dot = (x, y, color, r = 5) => { const g = v.g; g.fillStyle = color; g.beginPath(); g.arc(X(x), Y(y), r, 0, 7); g.fill(); };
    f.arrow = (x, y, dx, dy, color, label) => {
      const g = v.g, x1 = X(x), y1 = Y(y), x2 = X(x + dx), y2 = Y(y + dy), a = Math.atan2(y2 - y1, x2 - x1), L = Math.hypot(x2 - x1, y2 - y1);
      if (L < 1) return;
      g.save(); g.strokeStyle = g.fillStyle = color; g.lineWidth = 2;
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
      const h = Math.min(9, L * 0.4); g.beginPath(); g.moveTo(x2, y2);
      g.lineTo(x2 - h * Math.cos(a - 0.4), y2 - h * Math.sin(a - 0.4)); g.lineTo(x2 - h * Math.cos(a + 0.4), y2 - h * Math.sin(a + 0.4)); g.fill();
      if (label) { g.font = "12px " + css("--f-mono", "monospace"); g.fillText(label, x2 + 4, y2 - 4); }
      g.restore();
    };
    f.text = (s, x, y, color, align = "left") => { const g = v.g; g.save(); g.fillStyle = color || col().ink2; g.font = "12px " + css("--f-mono", "monospace"); g.textAlign = align; g.fillText(s, X(x), Y(y)); g.restore(); };
    return f;
  }

  /* step(dt) 가 false를 돌려주면 멈춘다. 화면 밖이면 쉰다 */
  function loop(step) {
    let run = false, last = 0, vis = true, id = 0;
    const tick = (t) => {
      if (!run) return;
      const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
      if (vis && step(dt) === false) { run = false; L.onstop && L.onstop(); return; }
      id = requestAnimationFrame(tick);
    };
    const L = {
      start() { if (run) return; run = true; last = performance.now(); id = requestAnimationFrame(tick); },
      stop() { run = false; cancelAnimationFrame(id); },
      get running() { return run; }, reduce
    };
    L.watch = (el) => { if ("IntersectionObserver" in window) new IntersectionObserver((es) => { vis = es[0].isIntersecting; }).observe(el); return L; };
    return L;
  }

  function rk4(f, t, y, h) {
    const k1 = f(t, y), a = y.map((v, i) => v + (h / 2) * k1[i]);
    const k2 = f(t + h / 2, a), b = y.map((v, i) => v + (h / 2) * k2[i]);
    const k3 = f(t + h / 2, b), c = y.map((v, i) => v + h * k3[i]);
    const k4 = f(t + h, c);
    return y.map((v, i) => v + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
  }

  /* 재생 버튼 이름 바꾸기 */
  function playButton(btn, L, onStart) {
    const set = () => { btn.textContent = L.running ? "멈춤" : "재생"; };
    btn.addEventListener("click", () => { if (L.running) L.stop(); else { if (onStart) onStart(); L.start(); } set(); });
    L.onstop = set; set();
    return set;
  }

  const redrawOn = (fn) => { let w = 0; window.addEventListener("resize", () => { if (window.innerWidth !== w) { w = window.innerWidth; fn(); } }); new MutationObserver(fn).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] }); };

  window.QSim = { card, view, frame, loop, rk4, col, playButton, redrawOn, reduce };
})();
