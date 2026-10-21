/* 공통8(고등미적분학 1) 본문 카드의 조작 그림 (js/lib/qfig.js의 NMQ를 쓴다). 그림마다 NMQ.def("이름", …). */
(() => {
  "use strict";
  const Q = window.NMQ;
  if (!Q) return;
  const { el, clear, txt, num } = Q;
  const PI = Math.PI;
  const rect = (g, F, x0, y0, x1, y1, cls) => el("rect", { x: Math.min(F.x(x0), F.x(x1)), y: Math.min(F.y(y0), F.y(y1)), width: Math.abs(F.x(x1) - F.x(x0)), height: Math.abs(F.y(y1) - F.y(y0)), class: cls }, g);
  const poly = (g, F, pts, cls, open) => el("path", { d: pts.map((p, i) => (i ? "L" : "M") + F.x(p[0]).toFixed(1) + " " + F.y(p[1]).toFixed(1)).join("") + (open ? "" : "Z"), class: cls }, g);
  // 축과 눈금 글자: xt, yt는 눈금 값 목록 (축은 x = 0, y = 0을 지난다)
  const axl = (g, F, xt, yt, xs, ys) => {
    Q.axes(g, F, { grid: false, label: false });
    const ox = Math.min(Math.max(0, F.x0), F.x1), oy = Math.min(Math.max(0, F.y0), F.y1);
    xt.forEach((v) => txt(g, F.x(v), F.y(oy) + 14, num(v), "s", "middle"));
    yt.forEach((v) => txt(g, F.x(ox) - 5, F.y(v) + 4, num(v), "s", "end"));
    if (xs) txt(g, F.X1 - 4, F.y(oy) - 6, xs, "i", "end");
    if (ys) txt(g, F.x(ox) + 6, F.Y0 + 14, ys, "i");
  };
  // 방향장: 격자점마다 기울기 f(x, y)의 짧은 선분
  const field = (g, F, f, nx, ny, cls) => {
    for (let i = 0; i <= nx; i++) for (let j = 0; j <= ny; j++) {
      const x = F.x0 + ((F.x1 - F.x0) * (i + 0.5)) / (nx + 1), y = F.y0 + ((F.y1 - F.y0) * (j + 0.5)) / (ny + 1), s = f(x, y);
      if (!isFinite(s)) continue;
      const dx = 1, dy = s, px = (F.X1 - F.X0) / (F.x1 - F.x0), py = (F.Y1 - F.Y0) / (F.y1 - F.y0), L = Math.hypot(dx * px, dy * py) || 1, h = 7;
      Q.line(g, F.x(x) - (h * dx * px) / L, F.y(y) + (h * dy * py) / L, F.x(x) + (h * dx * px) / L, F.y(y) - (h * dy * py) / L, cls || "gd");
    }
  };
  // RK4로 x0에서 x1까지 y' = f(x, y)를 따라간다 (화면을 크게 벗어나면 멈춤)
  const rk = (f, x0, y0, x1, n, ylim) => {
    const h = (x1 - x0) / n, pts = [[x0, y0]]; let x = x0, y = y0;
    for (let i = 0; i < n; i++) {
      const k1 = f(x, y), k2 = f(x + h / 2, y + (h * k1) / 2), k3 = f(x + h / 2, y + (h * k2) / 2), k4 = f(x + h, y + h * k3);
      y += (h * (k1 + 2 * k2 + 2 * k3 + k4)) / 6; x += h;
      if (!isFinite(y) || (ylim && Math.abs(y) > ylim)) break;
      pts.push([x, y]);
    }
    return pts;
  };
  // 화면 안으로 자른 곡선 (y가 범위를 벗어나는 구간은 끊는다)
  const curve = (g, F, pts, cls) => {
    let seg = [];
    const flush = () => { if (seg.length > 1) poly(g, F, seg, cls, true).setAttribute("style", "fill:none"); seg = []; };
    const inR = (y) => y >= F.y0 && y <= F.y1, cl = (y) => Math.max(F.y0, Math.min(F.y1, y));
    let prev = null;
    pts.forEach(([x, y]) => {
      if (!isFinite(y)) { flush(); prev = null; return; }
      if (inR(y)) { if (prev && !inR(prev[1]) && !seg.length) seg.push([prev[0], cl(prev[1])]); seg.push([x, y]); }
      else if (seg.length) { seg.push([x, cl(y)]); flush(); }
      prev = [x, y];
    });
    flush();
  };
  const clip = (g, svg, F) => { const id = "c" + Math.random().toString(36).slice(2, 8); const d = el("defs", {}, svg); const cp = el("clipPath", { id }, d); el("rect", { x: F.X0, y: F.Y0, width: F.X1 - F.X0, height: F.Y1 - F.Y0 }, cp); g.setAttribute("clip-path", `url(#${id})`); };

  // 1.1 방향장과 해 곡선
  Q.def("c8-slope", (fig, svg) => {
    const F = Q.frame(-3, 3, -2, 2.5, 40, 500, 10, 250), g0 = el("g", {}, svg), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    clip(g, svg, F);
    const E = [[(x, y) => y * (1 - y), "y′ = y(1 − y)"], [(x, y) => -2 * x * y, "y′ = −2xy"], [(x, y) => x - y, "y′ = x − y"]];
    Q.bind(fig, ({ e, y0 }) => {
      clear(g0); clear(g);
      const [f, nm] = E[e];
      axl(g0, F, [-2, -1, 1, 2], [-1, 1, 2], "x", "y");
      field(g0, F, f, 20, 14);
      if (e == 0) { [0, 1].forEach((v) => Q.line(g, F.x(-3), F.y(v), F.x(3), F.y(v), "b dsh")); }
      const pts = [...rk(f, 0, y0, -3, 300, 50).reverse(), ...rk(f, 0, y0, 3, 300, 50).slice(1)];
      curve(g, F, pts, "a");
      Q.dot(g, F.x(0), F.y(y0), "fd", 5);
      read.textContent = `${nm}, y(0) = ${y0}: 해 곡선(파랑)은 짧은 선분들의 방향을 따라 흐른다.` + (e == 0 ? (y0 > 0 && y0 < 1 ? " 0과 1 사이에서 출발하면 S자를 그리며 1에 다가간다." : y0 > 1 ? " 1보다 위에서 출발하면 내려오며 1에 다가간다." : y0 < 0 ? " 0보다 아래에서 출발하면 점점 더 내려간다." : " 평형해이다.") : "");
    });
  });

  // 1.2 뉴턴의 냉각 법칙: 90 °C 커피, 20 °C 방
  Q.def("c8-cool", (fig, svg) => {
    const F = Q.frame(0, 60, 0, 100, 50, 490, 15, 235), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const k = Math.log(7 / 4) / 10, T = (t) => 20 + 70 * Math.exp(-k * t);
    Q.bind(fig, ({ t }) => {
      clear(g);
      axl(g, F, [10, 20, 30, 40, 50, 60], [20, 40, 60, 80, 100], "시간 t (분)", "온도 T (°C)");
      Q.line(g, F.x(0), F.y(20), F.x(60), F.y(20), "c dsh"); txt(g, F.x(60) - 4, F.y(20) - 5, "방 20 °C", "tc", "end");
      Q.plot(g, F, T, "a", 0, 60, 200);
      [[0, 90], [10, 60]].forEach(([a, b]) => Q.dot(g, F.x(a), F.y(b), "fb", 4));
      const t30 = (10 * Math.log(7)) / Math.log(7 / 4);
      Q.line(g, F.x(t30), F.y(0), F.x(t30), F.y(30), "gd dsh"); txt(g, F.x(t30), F.y(30) - 6, "30 °C", "s", "middle");
      Q.dot(g, F.x(t), F.y(T(t)), "fd", 5);
      read.textContent = `T(${t}) = 20 + 70·(4/7)^(${t}/10) = ${num(T(t), 1)} °C. 방과의 차이 ${num(T(t) - 20, 1)} °C가 10분마다 4/7배로 준다.`;
    });
  });

  // 1.3 완전 미분방정식의 해는 u(x, y) = c의 등고선
  Q.def("c8-exact", (fig, svg) => {
    const F = Q.frame(-3, 3, -4, 4, 40, 500, 10, 250), g0 = el("g", {}, svg), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    clip(g, svg, F);
    const yc = (x, c) => (c - 3 * x) / (x * x - 1);
    Q.bind(fig, ({ c }) => {
      clear(g0); clear(g);
      axl(g0, F, [-2, -1, 1, 2], [-2, 2], "x", "y");
      [-1, 1].forEach((v) => Q.line(g0, F.x(v), F.Y0, F.x(v), F.Y1, "gd dsh"));
      [-6, -4, -2, 0, 2, 4, 6].forEach((cc) => { if (cc === c) return; [[-3, -1.002], [-0.998, 0.998], [1.002, 3]].forEach(([a, b]) => { const pts = []; for (let x = a; x <= b; x += 0.01) pts.push([x, yc(x, cc)]); curve(g, F, pts, "gd"); }); });
      [[-3, -1.002], [-0.998, 0.998], [1.002, 3]].forEach(([a, b]) => { const pts = []; for (let x = a; x <= b; x += 0.005) pts.push([x, yc(x, c)]); curve(g, F, pts, "a"); });
      read.textContent = `u(x, y) = x²y + 3x − y = ${c}의 등고선(파랑): y = (${c} − 3x)/(x² − 1). 회색은 다른 c의 등고선이며, 모두 (2xy + 3)dx + (x² − 1)dy = 0의 해이다.`;
    });
  });

  // 1.4 일반해 = 비동차 특수해 + 동차 일반해: y = e^{2x} + c e^x
  Q.def("c8-linfam", (fig, svg) => {
    const F = Q.frame(-3, 1.5, -6, 12, 50, 490, 10, 250), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    clip(g, svg, F);
    const g0 = el("g", {}, svg);
    Q.bind(fig, ({ c }) => {
      clear(g); clear(g0);
      axl(g0, F, [-3, -2, -1, 1], [-4, 4, 8], "x", "y");
      for (let cc = -4; cc <= 4; cc++) if (cc !== c) Q.plot(g, F, (x) => Math.exp(2 * x) + cc * Math.exp(x), "gd", -3, 1.5, 150);
      Q.plot(g, F, (x) => Math.exp(2 * x), "c dsh", -3, 1.5, 150);
      Q.plot(g, F, (x) => Math.exp(2 * x) + c * Math.exp(x), "a", -3, 1.5, 200);
      Q.dot(g, F.x(0), F.y(1 + c), c === 2 ? "fd" : "fa", 5);
      read.textContent = `c = ${c}: y = e^{2x} + (${c})eˣ, y(0) = ${1 + c}. 주황 점선은 특수해 e^{2x}이고, 회색 곡선들은 동차해 ceˣ만큼씩 위아래로 옮긴 것이다.` + (c === 2 ? " 초기 조건 y(0) = 3을 만족한다." : "");
    });
  });

  // 1.5 유일성이 깨지는 예: y′ = 3y^{2/3}, y(0) = 0
  Q.def("c8-nonuniq", (fig, svg) => {
    const F = Q.frame(-1, 3, -0.5, 4, 50, 490, 10, 245), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    clip(g, svg, F);
    const g0 = el("g", {}, svg);
    Q.bind(fig, ({ a }) => {
      clear(g); clear(g0);
      axl(g0, F, [1, 2, 3], [1, 2, 3, 4], "x", "y");
      field(g0, F, (x, y) => 3 * Math.cbrt(y * y), 16, 12);
      [0, 0.5, 1, 1.5, 2].forEach((b) => { if (b !== a) Q.plot(g, F, (x) => (x < b ? 0 : (x - b) ** 3), "gd", -1, 3, 200); });
      Q.plot(g, F, (x) => (x < a ? 0 : (x - a) ** 3), "a", -1, 3, 300);
      Q.dot(g, F.x(0), F.y(0), "fd", 5);
      read.textContent = a == 0 ? "a = 0: 해 y = x³ (x ≥ 0). y = 0도 해이므로 초기점 (0, 0)을 지나는 해가 둘 이상이다." : `a = ${a}: x = ${a}까지 y = 0에 머물다가 y = (x − ${a})³으로 떠나는 함수도 해이다. 그래서 해가 무수히 많다.`;
    });
  });

  // y″ + a y′ + b y = 0, y(0) = y0, y′(0) = v0의 해 (특성근으로 바로 쓴다)
  const ode2 = (a, b, y0, v0) => {
    const D = a * a - 4 * b;
    if (Math.abs(D) < 1e-9) { const l = -a / 2; return (t) => (y0 + (v0 - l * y0) * t) * Math.exp(l * t); }
    if (D > 0) { const l1 = (-a + Math.sqrt(D)) / 2, l2 = (-a - Math.sqrt(D)) / 2, c2 = (v0 - l1 * y0) / (l2 - l1), c1 = y0 - c2; return (t) => c1 * Math.exp(l1 * t) + c2 * Math.exp(l2 * t); }
    const al = -a / 2, w = Math.sqrt(-D) / 2, B = (v0 - al * y0) / w; return (t) => Math.exp(al * t) * (y0 * Math.cos(w * t) + B * Math.sin(w * t));
  };

  // 2.1 중첩 원리: c₁cos x + c₂sin x
  Q.def("c8-superpos", (fig, svg) => {
    const F = Q.frame(0, 4 * PI, -4, 4, 40, 500, 10, 250), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ c1, c2 }) => {
      clear(g);
      axl(g, F, [], [-3, 3], "x", "y");
      [PI, 2 * PI, 3 * PI, 4 * PI].forEach((v, i) => txt(g, F.x(v), F.y(0) + 14, `${i + 1 === 1 ? "" : i + 1}π`, "s", "middle"));
      Q.plot(g, F, (x) => c1 * Math.cos(x), "c dsh", 0, 4 * PI, 200); Q.plot(g, F, (x) => c2 * Math.sin(x), "b dsh", 0, 4 * PI, 200);
      Q.plot(g, F, (x) => c1 * Math.cos(x) + c2 * Math.sin(x), "a", 0, 4 * PI, 300);
      Q.dot(g, F.x(0), F.y(c1), "fd", 5);
      read.textContent = `y = ${c1}cos x + (${c2})sin x: y(0) = ${c1}, y′(0) = ${c2}. 주황 점선 c₁cos x와 청록 점선 c₂sin x를 더하면 파란 해가 된다.`;
    });
  });

  // 2.2 특성근의 자리와 해의 모양
  Q.def("c8-roots", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ a, b }) => {
      clear(g);
      const C = Q.frame(-4, 2, -4, 4, 20, 170, 20, 220), F = Q.frame(0, 10, -1.2, 1.2, 210, 505, 20, 220);
      Q.line(g, C.x(-4), C.y(0), C.x(2), C.y(0), "ax"); Q.line(g, C.x(0), C.y(-4), C.x(0), C.y(4), "ax");
      txt(g, C.x(2) - 2, C.y(0) - 5, "Re", "i", "end"); txt(g, C.x(0) + 4, C.y(4) + 10, "Im", "i", "start"); txt(g, C.x(-1), C.y(-4) + 16, "특성근", "s", "middle");
      const D = a * a - 4 * b, roots = Math.abs(D) < 1e-9 ? [[-a / 2, 0], [-a / 2, 0]] : D > 0 ? [[(-a + Math.sqrt(D)) / 2, 0], [(-a - Math.sqrt(D)) / 2, 0]] : [[-a / 2, Math.sqrt(-D) / 2], [-a / 2, -Math.sqrt(-D) / 2]];
      roots.forEach(([x, y]) => Q.dot(g, C.x(Math.max(-4, Math.min(2, x))), C.y(Math.max(-4, Math.min(4, y))), "fd", 5));
      Q.line(g, F.x(0), F.y(0), F.x(10), F.y(0), "ax"); Q.line(g, F.x(0), F.y(-1.2), F.x(0), F.y(1.2), "ax");
      [2, 4, 6, 8, 10].forEach((v) => txt(g, F.x(v), F.y(0) + 14, v, "s", "middle")); txt(g, F.x(10) - 2, F.y(0) - 5, "x", "i", "end");
      const y = ode2(a, b, 1, 0), pts = []; for (let t = 0; t <= 10; t += 0.02) pts.push([t, y(t)]);
      curve(g, F, pts, "a");
      const kind = Math.abs(D) < 1e-9 ? "중근" : D > 0 ? "서로 다른 두 실근" : "복소근";
      read.textContent = `λ² + ${a}λ + ${b} = 0: 판별식 ${num(D, 2)} → ${kind} ` + (D < -1e-9 ? `${num(-a / 2, 2)} ± ${num(Math.sqrt(-D) / 2, 2)}i. 실수부가 감쇠를, 허수부가 진동을 정한다.` : `${num(roots[0][0], 2)}, ${num(roots[1][0], 2)}. 진동하지 않는다.`) + " (오른쪽은 y(0) = 1, y′(0) = 0인 해)";
    });
  });

  // 2.3 감쇠 진동: m = 10, k = 90
  Q.def("c8-damp", (fig, svg) => {
    const F = Q.frame(0, 8, -1.1, 1.1, 50, 490, 15, 235), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ c }) => {
      clear(g);
      axl(g, F, [2, 4, 6, 8], [-1, 1], "t (초)", "y");
      Q.plot(g, F, (t) => Math.cos(3 * t), "gd", 0, 8, 300);
      const y = ode2(c / 10, 9, 1, 0), env = Math.exp((-c / 20) * 0);
      if (c * c < 3600) { Q.plot(g, F, (t) => Math.exp((-c / 20) * t) * Math.sqrt(1 + (c / 20) ** 2 / (9 - (c / 20) ** 2)), "c dsh", 0, 8, 100); Q.plot(g, F, (t) => -Math.exp((-c / 20) * t) * Math.sqrt(1 + (c / 20) ** 2 / (9 - (c / 20) ** 2)), "c dsh", 0, 8, 100); }
      Q.plot(g, F, y, "a", 0, 8, 400);
      const D = c * c - 3600, kind = Math.abs(D) < 1e-6 ? "임계감쇠" : D > 0 ? "과감쇠" : c === 0 ? "감쇠 없음(조화 진동)" : "미감쇠";
      read.textContent = `c = ${c} kg/s: c² = ${c * c}, 4mk = 3600 → ${kind}` + (D < 0 ? `, ω* = √(9 − ${num((c / 20) ** 2, 2)}) = ${num(Math.sqrt(9 - (c / 20) ** 2), 3)} rad/s` : "") + ". 회색은 감쇠가 없을 때이다.";
      void env;
    });
  });

  // 2.4 오일러-코시: x = e^t로 바꾸면 상수계수
  Q.def("c8-euler", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ e, c2 }) => {
      clear(g);
      const F = Q.frame(0, 3, -3, 6, 40, 260, 15, 235), G = Q.frame(-2.5, 1.1, -3, 6, 290, 505, 15, 235);
      const f = e == 0 ? (x) => x ** 3 + c2 / Math.sqrt(x) : (x) => (1 + c2 * Math.log(x)) * x * x;
      axl(g, F, [1, 2, 3], [-2, 2, 4], "x", "y");
      Q.line(g, G.x(-2.5), G.y(0), G.x(1.1), G.y(0), "ax"); Q.line(g, G.x(0), G.y(-3), G.x(0), G.y(6), "ax");
      [-2, -1, 1].forEach((v) => txt(g, G.x(v), G.y(0) + 14, v, "s", "middle")); txt(g, G.x(1.1) - 2, G.y(0) - 5, "t = ln x", "i", "end");
      const p1 = [], p2 = []; for (let x = 0.02; x <= 3; x += 0.01) p1.push([x, f(x)]); for (let t = -2.5; t <= 1.1; t += 0.01) p2.push([t, f(Math.exp(t))]);
      curve(g, F, p1, "a"); curve(g, G, p2, "c");
      read.textContent = (e == 0 ? `y = x³ + (${c2})/√x = e^{3t} + (${c2})e^{−t/2}` : `y = (1 + (${c2})ln x)x² = (1 + (${c2})t)e^{2t}`) + ": 왼쪽은 x에 대해, 오른쪽은 t = ln x에 대해 그린 같은 해이다. 오른쪽은 상수계수 방정식의 해 모양이다.";
    });
  });

  // 2.5 론스키안: 두 해가 독립인지
  Q.def("c8-wronsk", (fig, svg) => {
    const F = Q.frame(-1, 3, -3, 3, 50, 490, 15, 235), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const P = [
      ["cos x, sin x", (x) => Math.cos(x), (x) => Math.sin(x), (x) => -Math.sin(x), (x) => Math.cos(x)],
      ["eˣ, e^{−2x}", (x) => Math.exp(x), (x) => Math.exp(-2 * x), (x) => Math.exp(x), (x) => -2 * Math.exp(-2 * x)],
      ["e^{−x}, xe^{−x}", (x) => Math.exp(-x), (x) => x * Math.exp(-x), (x) => -Math.exp(-x), (x) => (1 - x) * Math.exp(-x)],
      ["eˣ, 3eˣ", (x) => Math.exp(x), (x) => 3 * Math.exp(x), (x) => Math.exp(x), (x) => 3 * Math.exp(x)],
    ];
    Q.bind(fig, ({ k }) => {
      clear(g);
      const [nm, y1, y2, d1, d2] = P[k], W = (x) => y1(x) * d2(x) - y2(x) * d1(x);
      axl(g, F, [-1, 1, 2, 3], [-2, 2], "x", "");
      const cl = (f) => (x) => Math.max(-3.2, Math.min(3.2, f(x)));
      Q.plot(g, F, cl(y1), "b", -1, 3, 200); Q.plot(g, F, cl(y2), "c", -1, 3, 200); Q.plot(g, F, cl(W), "d", -1, 3, 200);
      txt(g, 60, 30, "y₁ 청록, y₂ 주황, W 빨강", "s", "start");
      read.textContent = `${nm}: W(0) = ${num(W(0), 3)} → ` + (Math.abs(W(0)) < 1e-9 ? "W가 늘 0이라 비례한다(일차종속, 기저가 아님)." : "0이 아니므로 일차독립(기저). W는 어디서도 0이 되지 않는다.");
    });
  });

  // 2.6 y = y_h + y_p: y″ + y = 0.001x²
  Q.def("c8-undet", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ X }) => {
      clear(g);
      const yp = (x) => 0.001 * x * x - 0.002, yh = (x) => 0.002 * Math.cos(x) + 1.5 * Math.sin(x), top = Math.max(2, yp(X) + 2);
      const F = Q.frame(0, X, -2, top, 50, 490, 15, 235);
      axl(g, F, [X / 4, X / 2, (3 * X) / 4, X].map((v) => Math.round(v)), [Math.round(top / 2)], "x", "y");
      Q.plot(g, F, yp, "c dsh", 0, X, 200);
      Q.plot(g, F, (x) => yh(x) + yp(x), "a", 0, X, 800);
      read.textContent = `x = ${X}: y_p = 0.001x² − 0.002 = ${num(yp(X), 2)}(주황 점선). 해는 y_h(진폭 1.5의 진동)가 y_p 둘레에서 흔들리는 모양이다.`;
    });
  });

  // 2.7 강제 진동의 진폭 곡선: m = 1, k = 4
  Q.def("c8-reson", (fig, svg) => {
    const F = Q.frame(0, 4, 0, 5.5, 50, 490, 15, 235), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const A = (w, c) => 1 / Math.sqrt((4 - w * w) ** 2 + w * w * c * c);
    Q.bind(fig, ({ c, w }) => {
      clear(g);
      axl(g, F, [1, 2, 3, 4], [1, 2, 3, 4, 5], "외력 진동수 ω", "정상 상태 진폭 C*");
      [1, 0.5].forEach((cc) => { if (cc !== c) Q.plot(g, F, (x) => Math.min(A(x, cc), 5.6), "gd", 0, 4, 300); });
      Q.plot(g, F, (x) => Math.min(A(x, c), 5.6), "a", 0, 4, 400);
      Q.line(g, F.x(2), F.y(0), F.x(2), F.y(5.5), "d dsh"); txt(g, F.x(2) + 4, F.y(5.3), "ω₀ = 2", "td", "start");
      const a = A(w, c); Q.dot(g, F.x(w), F.y(Math.min(a, 5.5)), "fd", 5);
      read.textContent = `c = ${c}, ω = ${w}: C* = 1/√((4 − ${num(w * w, 2)})² + ${num(w * w * c * c, 3)}) = ${num(a, 3)}. 감쇠가 작을수록 ω₀ 근처의 봉우리가 높다.`;
    });
  });

  // 2.8 매개변수변환법으로 얻은 y_p가 y″ + y = sec x를 만족하는지
  Q.def("c8-varp", (fig, svg) => {
    const F = Q.frame(-1.5, 1.5, -1, 8, 50, 490, 15, 235), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const yp = (x) => Math.cos(x) * Math.log(Math.abs(Math.cos(x))) + x * Math.sin(x);
    Q.bind(fig, ({ x }) => {
      clear(g);
      axl(g, F, [-1, 1], [2, 4, 6], "x", "");
      Q.line(g, F.x(-PI / 2), F.Y0, F.x(-PI / 2), F.Y1, "gd dsh"); Q.line(g, F.x(PI / 2), F.Y0, F.x(PI / 2), F.Y1, "gd dsh");
      Q.plot(g, F, (t) => Math.min(1 / Math.cos(t), 8.2), "c", -1.5, 1.5, 300);
      Q.plot(g, F, yp, "a", -1.5, 1.5, 300);
      const h = 1e-3, lhs = (yp(x + h) - 2 * yp(x) + yp(x - h)) / (h * h) + yp(x);
      Q.dot(g, F.x(x), F.y(yp(x)), "fa", 5); Q.dot(g, F.x(x), F.y(Math.min(1 / Math.cos(x), 8)), "fc", 5);
      txt(g, 60, 30, "파랑 y_p, 주황 sec x", "s", "start");
      read.textContent = `x = ${x}: y_p″ + y_p ≈ ${num(lhs, 4)}, sec x = ${num(1 / Math.cos(x), 4)}. 미정계수법으로는 짐작할 수 없는 꼴의 특수해이다.`;
    });
  });

  // 평면 연립방정식 y′ = f(y)를 RK4로 따라간 궤적
  const rk2 = (f, p0, h, n, lim) => {
    const pts = [p0]; let [a, b] = p0;
    for (let i = 0; i < n; i++) {
      const k1 = f(a, b), k2 = f(a + (h * k1[0]) / 2, b + (h * k1[1]) / 2), k3 = f(a + (h * k2[0]) / 2, b + (h * k2[1]) / 2), k4 = f(a + h * k3[0], b + h * k3[1]);
      a += (h * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0])) / 6; b += (h * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])) / 6;
      if (!isFinite(a) || !isFinite(b) || Math.abs(a) > lim || Math.abs(b) > lim) break;
      pts.push([a, b]);
    }
    return pts;
  };
  const traj = (g, F, pts, cls) => { if (pts.length > 1) poly(g, F, pts, cls, true).setAttribute("style", "fill:none"); };

  // 3.1 고유벡터: 곱해도 방향이 그대로인 벡터
  Q.def("c8-eig", (fig, svg) => {
    const F = Q.frame(-4.6, 4.6, -4, 4, 120, 400, 10, 250), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ th }) => {
      clear(g);
      Q.line(g, F.x(-4.6), F.y(0), F.x(4.6), F.y(0), "ax"); Q.line(g, F.x(0), F.y(-4), F.x(0), F.y(4), "ax");
      [[1, 2], [2, -1]].forEach(([a, b]) => { const s = 6; Q.line(g, F.x(-a * s), F.y(-b * s), F.x(a * s), F.y(b * s), "gd dsh"); });
      const pts = []; for (let t = 0; t <= 2 * PI + 0.01; t += 0.05) pts.push([2 * Math.cos(t), 2 * Math.sin(t)]); traj(g, F, pts, "gd");
      const r = (th * PI) / 180, x = [Math.cos(r), Math.sin(r)], Ax = [-5 * x[0] + 2 * x[1], 2 * x[0] - 2 * x[1]];
      Q.arrow(g, F.x(0), F.y(0), F.x((2 * Ax[0]) / 3), F.y((2 * Ax[1]) / 3), "c", "fc"); Q.arrow(g, F.x(0), F.y(0), F.x(2 * x[0]), F.y(2 * x[1]), "a", "fa");
      txt(g, F.x(2 * x[0]) + 6, F.y(2 * x[1]) - 6, "x", "ta", "start"); txt(g, F.x((2 * Ax[0]) / 3) + 6, F.y((2 * Ax[1]) / 3) - 6, "Ax", "tc", "start");
      const cr = x[0] * Ax[1] - x[1] * Ax[0], lam = (x[0] * Ax[0] + x[1] * Ax[1]);
      read.textContent = Math.abs(cr) < 0.15 ? `θ = ${th}°: Ax가 x와 같은 직선 위에 있다. Ax ≈ ${num(lam, 2)}x, 곧 고유값 ${num(Math.round(lam), 0)}의 고유벡터 방향이다.` : `θ = ${th}°: x = (${num(x[0], 2)}, ${num(x[1], 2)}), Ax = (${num(Ax[0], 2)}, ${num(Ax[1], 2)}). 방향이 바뀌었다. 점선 두 방향에서만 방향이 그대로이다.`;
    });
  });

  // 3.2 두 탱크의 혼합
  Q.def("c8-tanks", (fig, svg) => {
    const F = Q.frame(0, 120, 0, 160, 50, 330, 15, 235), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ t }) => {
      clear(g);
      axl(g, F, [30, 60, 90, 120], [50, 100, 150], "t (분)", "비료 (kg)");
      const y1 = (s) => 75 + 75 * Math.exp(-0.04 * s), y2 = (s) => 75 - 75 * Math.exp(-0.04 * s);
      Q.plot(g, F, y1, "a", 0, 120, 200); Q.plot(g, F, y2, "c", 0, 120, 200);
      Q.line(g, F.x(t), F.y(0), F.x(t), F.y(160), "gd dsh"); Q.dot(g, F.x(t), F.y(y1(t)), "fa", 4); Q.dot(g, F.x(t), F.y(y2(t)), "fc", 4);
      [[380, y1(t), "la", "T1"], [450, y2(t), "lc", "T2"]].forEach(([x, v, cl, nm]) => { el("rect", { x, y: 60, width: 50, height: 150, class: "lk" }, g); el("rect", { x, y: 210 - v, width: 50, height: v, class: cl }, g); txt(g, x + 25, 228, nm, "s", "middle"); txt(g, x + 25, 54, `${num(v, 1)} kg`, "s", "middle"); });
      Q.arrow(g, 432, 90, 448, 90, "k", "fk"); Q.arrow(g, 448, 110, 432, 110, "k", "fk");
      read.textContent = `t = ${t}분: T1 ${num(y1(t), 1)} kg(파랑), T2 ${num(y2(t), 1)} kg(주황). 합은 늘 150 kg이고, 차이가 줄며 둘 다 75 kg에 다가간다.`;
    });
  });

  // 3.3 상평면에서 본 두 탱크: 고유벡터 방향으로 움직인다
  Q.def("c8-modes", (fig, svg) => {
    const F = Q.frame(-10, 160, -10, 160, 140, 380, 10, 250), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ t }) => {
      clear(g);
      axl(g, F, [50, 100, 150], [50, 100, 150], "y₁", "y₂");
      Q.line(g, F.x(-10), F.y(-10), F.x(160), F.y(160), "b dsh"); txt(g, F.x(150), F.y(150) - 8, "(1, 1) 방향: λ = 0", "tb", "end");
      Q.line(g, F.x(0), F.y(150), F.x(150), F.y(0), "c dsh"); txt(g, F.x(150) + 4, F.y(0) - 6, "(1, −1) 방향: λ = −0.04", "tc", "start");
      [[150, 0], [0, 150], [120, 0], [40, 0], [140, 60]].forEach(([a, b], i) => {
        const c1 = (a + b) / 2, c2 = (a - b) / 2, pts = []; for (let s = 0; s <= 150; s += 1) pts.push([c1 + c2 * Math.exp(-0.04 * s), c1 - c2 * Math.exp(-0.04 * s)]);
        traj(g, F, pts, i === 0 ? "a" : "gd");
      });
      const e = Math.exp(-0.04 * t), P = [75 + 75 * e, 75 - 75 * e]; Q.dot(g, F.x(P[0]), F.y(P[1]), "fd", 5); Q.dot(g, F.x(75), F.y(75), "fb", 4);
      read.textContent = `t = ${t}분: (y₁, y₂) = (${num(P[0], 1)}, ${num(P[1], 1)}). 점은 (1, −1) 방향으로만 움직여 (1, 1) 방향 위의 균형점 (75, 75)로 다가가며, 남은 거리는 e^(−0.04t) = ${num(e, 3)}배이다.`;
    });
  });

  // 3.4 상그림: 대각합 p와 행렬식 q로 정해지는 임계점의 종류
  Q.def("c8-phase", (fig, svg) => {
    const F = Q.frame(-3, 3, -3, 3, 130, 390, 10, 250), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ p, q }) => {
      clear(g);
      Q.line(g, F.x(-3), F.y(0), F.x(3), F.y(0), "ax"); Q.line(g, F.x(0), F.y(-3), F.x(0), F.y(3), "ax");
      txt(g, F.x(3) - 2, F.y(0) - 5, "y₁", "i", "end"); txt(g, F.x(0) + 5, F.y(3) + 12, "y₂", "i", "start");
      const f = (a, b) => [b, -q * a + p * b];
      field(g, F, (a, b) => (b === 0 ? 1e9 : (-q * a + p * b) / b), 12, 12, "gd");
      for (let k = 0; k < 12; k++) { const r = (2 * PI * k) / 12, p0 = [2.6 * Math.cos(r), 2.6 * Math.sin(r)]; traj(g, F, rk2(f, p0, 0.02, 600, 6), k === 0 ? "a" : "b"); traj(g, F, rk2(f, p0, -0.02, 300, 6), "b"); }
      const D = p * p - 4 * q;
      const kind = q < 0 ? "안장점 (불안정)" : q === 0 ? "판정 경계 (det A = 0)" : D >= 0 ? (p < 0 ? "마디 (점근 안정)" : p > 0 ? "마디 (불안정)" : "") : p === 0 ? "중심 (안정)" : p < 0 ? "나선점 (점근 안정)" : "나선점 (불안정)";
      read.textContent = `A = [[0, 1], [${-q}, ${p}]]: 대각합 p = ${p}, det A = q = ${q}, Δ = ${num(D, 2)} → ${kind}`;
    });
  });

  // 3.5 진자의 상그림: 에너지 등고선
  Q.def("c8-pend", (fig, svg) => {
    const F = Q.frame(-2 * PI, 2 * PI, -3.2, 3.2, 40, 500, 10, 250), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ E }) => {
      clear(g);
      Q.line(g, F.x(-2 * PI), F.y(0), F.x(2 * PI), F.y(0), "ax"); Q.line(g, F.x(0), F.y(-3.2), F.x(0), F.y(3.2), "ax");
      [[-PI, "−π"], [PI, "π"], [-2 * PI, "−2π"], [2 * PI, "2π"]].forEach(([v, s]) => txt(g, F.x(v), F.y(0) + 14, s, "s", "middle"));
      txt(g, F.x(2 * PI) - 4, F.y(0) - 6, "θ", "i", "end"); txt(g, F.x(0) + 6, F.y(3.2) + 12, "θ′", "i", "start");
      const lev = (e, cls) => [1, -1].forEach((sg) => { let seg = []; const fl = () => { if (seg.length > 1) traj(g, F, seg, cls); seg = []; }; for (let x = -2 * PI; x <= 2 * PI + 1e-9; x += 0.02) { const v = 2 * (e + Math.cos(x)); if (v >= 0) seg.push([x, sg * Math.sqrt(v)]); else fl(); } fl(); });
      [-0.6, 0, 0.5, 1.6, 2.4].forEach((e) => lev(e, "gd")); lev(1, "c dsh");
      lev(E, "a");
      [-2 * PI, 0, 2 * PI].forEach((v) => Q.dot(g, F.x(v), F.y(0), "fb", 4)); [-PI, PI].forEach((v) => Q.dot(g, F.x(v), F.y(0), "fd", 4));
      read.textContent = `에너지 E = ${E} (k = 1): ` + (E < 1 ? "닫힌 곡선이다. 진자가 아래(청록 점, 중심) 둘레에서 앞뒤로 흔들린다." : E > 1 ? "열린 곡선이다. 진자가 꼭대기를 넘어 한 방향으로 계속 돈다." : "분리선(주황 점선)이다. 거꾸로 선 상태(빨간 점, 안장점)에 한없이 다가간다.");
    });
  });

  // 3.6 비동차 연립방정식: 모든 궤적이 새 평형 (2, 1)로
  Q.def("c8-equil", (fig, svg) => {
    const F = Q.frame(-0.5, 4.5, -0.5, 3, 120, 400, 10, 250), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const f = (a, b) => [-a + 2, a - 2 * b];
    Q.bind(fig, ({ s }) => {
      clear(g);
      axl(g, F, [1, 2, 3, 4], [1, 2, 3], "y₁", "y₂");
      const starts = [[0, 0], [4, 0], [4, 3], [0, 3], [0.5, 2.5], [3.5, 0.2]];
      starts.forEach((p0, i) => traj(g, F, rk2(f, p0, 0.02, 500, 10), i === s ? "a" : "gd"));
      Q.dot(g, F.x(2), F.y(1), "fd", 5); txt(g, F.x(2) + 8, F.y(1) - 6, "평형 (2, 1)", "td", "start");
      Q.dot(g, F.x(starts[s][0]), F.y(starts[s][1]), "fa", 5);
      read.textContent = `출발점 (${starts[s].join(", ")}): 고유값 −1, −2가 모두 음수라 어디서 출발해도 평형 (2, 1)로 다가간다.`;
    });
  });

  // 점화식으로 계수 a_0..a_{N}을 만든다 (rec(s, a)가 a_{s+2}를 돌려준다)
  const coefs = (a0, a1, N, rec) => { const a = [a0, a1]; for (let s = 0; s + 2 <= N; s++) a[s + 2] = rec(s, a); return a; };
  const psum = (a, x, n) => { let s = 0; for (let m = 0; m <= n && m < a.length; m++) s += a[m] * x ** m; return s; };
  const besselJ = (n, x) => { let s = 0, f = 1; for (let k = 1; k <= n; k++) f *= k; let t = (x / 2) ** n / f; for (let m = 0; m < 60; m++) { s += t; t *= -((x / 2) ** 2) / ((m + 1) * (m + 1 + n)); } return s; };
  const legP = (n, x) => { let p0 = 1, p1 = x; if (n === 0) return 1; for (let k = 1; k < n; k++) { const p2 = ((2 * k + 1) * x * p1 - k * p0) / (k + 1); p0 = p1; p1 = p2; } return p1; };

  // 4.1 급수해의 부분합이 해에 다가간다
  Q.def("c8-series", (fig, svg) => {
    const F = Q.frame(-6, 6, -3, 3, 40, 500, 10, 250), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    clip(g, svg, F); const g0 = el("g", {}, svg);
    Q.bind(fig, ({ e, N }) => {
      clear(g); clear(g0);
      axl(g0, F, [-4, -2, 2, 4], [-2, 2], "x", "y");
      const rec = e == 0 ? (s, a) => -a[s] / ((s + 2) * (s + 1)) : (s, a) => (s === 0 ? 0 : a[s - 1] / ((s + 2) * (s + 1)));
      const a = coefs(1, 0, 80, rec);
      Q.plot(g, F, (x) => psum(a, x, 80), "c", -6, e == 0 ? 6 : 2.2, 300);
      Q.plot(g, F, (x) => psum(a, x, N), "a", -6, 6, 300);
      const show = a.slice(0, N + 1).map((v, m) => [v, m]).filter(([v]) => Math.abs(v) > 1e-12).slice(0, 4).map(([v, m]) => `${num(v, 4)}x^${m}`).join(" + ");
      read.textContent = (e == 0 ? "y″ + y = 0, a₀ = 1, a₁ = 0: " : "y″ = xy (에어리), a₀ = 1, a₁ = 0: ") + `x^${N}까지의 부분합(파랑) = ${show} + ⋯. 주황은 항을 아주 많이 더한 해` + (e == 0 ? "(cos x)이다." : "이다.");
    });
  });

  // 4.2 르장드르 다항식의 직교성
  Q.def("c8-leg", (fig, svg) => {
    const F = Q.frame(-1.05, 1.05, -1.1, 1.1, 60, 480, 10, 250), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ m, n }) => {
      clear(g);
      axl(g, F, [-1, -0.5, 0.5, 1], [-1, 1], "x", "");
      const pts = [[-1, 0]]; for (let x = -1; x <= 1.0001; x += 0.01) pts.push([x, legP(m, x) * legP(n, x)]); pts.push([1, 0]);
      poly(g, F, pts, "lb");
      [0, 1, 2, 3, 4].forEach((k) => { if (k !== m && k !== n) Q.plot(g, F, (x) => legP(k, x), "gd", -1, 1, 150); });
      Q.plot(g, F, (x) => legP(m, x), "a", -1, 1, 200); Q.plot(g, F, (x) => legP(n, x), "c", -1, 1, 200);
      let I = 0; const h = 0.0005; for (let x = -1 + h / 2; x < 1; x += h) I += legP(m, x) * legP(n, x) * h;
      read.textContent = `P_${m}(파랑)과 P_${n}(주황)의 곱(청록 넓이)을 [−1, 1]에서 적분하면 ${num(Math.abs(I) < 1e-9 ? 0 : I, 4)}` + (m === n ? ` = 2/(2·${n} + 1)이다.` : "이다. 서로 다른 르장드르 다항식은 직교한다.");
    });
  });

  // 4.3 프로베니우스 해: √x × 급수
  Q.def("c8-frob", (fig, svg) => {
    const F = Q.frame(0, 12, -1.2, 1.6, 50, 490, 10, 250), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    clip(g, svg, F); const g0 = el("g", {}, svg);
    const a = [1]; for (let m = 1; m <= 60; m++) a[m] = -a[m - 1] / ((2 * m + 1) * m);
    const y = (x, n) => Math.sqrt(x) * psum(a, x, n);
    Q.bind(fig, ({ N }) => {
      clear(g); clear(g0);
      axl(g0, F, [2, 4, 6, 8, 10, 12], [-1, 1], "x", "y");
      Q.plot(g, F, (x) => y(x, 60), "c", 0, 12, 400);
      Q.plot(g, F, (x) => y(x, N), "a", 0, 12, 400);
      Q.plot(g, F, (x) => Math.sqrt(x), "gd", 0, 2, 100);
      read.textContent = `y₁ = √x(1 − x/3 + x²/30 − ⋯)의 x^${N}까지 부분합(파랑)과 많은 항을 더한 해(주황). 원점 근처는 √x(회색)처럼 시작해 기울기가 무한히 커진다.`;
    });
  });

  // 4.4 베셀 함수와 0점
  Q.def("c8-bessel", (fig, svg) => {
    const F = Q.frame(0, 20, -0.7, 1.05, 50, 490, 10, 250), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ n }) => {
      clear(g);
      axl(g, F, [5, 10, 15, 20], [-0.5, 0.5, 1], "x", "");
      Q.plot(g, F, (x) => Math.sqrt(2 / (PI * x)), "c dsh", 0.6, 20, 200); Q.plot(g, F, (x) => -Math.sqrt(2 / (PI * x)), "c dsh", 0.6, 20, 200);
      [0, 1, 2].forEach((k) => { if (k !== n) Q.plot(g, F, (x) => besselJ(k, x), "gd", 0, 20, 400); });
      Q.plot(g, F, (x) => besselJ(n, x), "a", 0, 20, 500);
      const zs = []; let prev = besselJ(n, 0.05);
      for (let x = 0.1; x <= 20; x += 0.05) { const v = besselJ(n, x); if (prev * v < 0) { let lo = x - 0.05, hi = x; for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (besselJ(n, lo) * besselJ(n, mid) <= 0) hi = mid; else lo = mid; } zs.push((lo + hi) / 2); } prev = v; }
      zs.forEach((z) => Q.dot(g, F.x(z), F.y(0), "fd", 4));
      const gaps = zs.slice(1).map((z, i) => num(z - zs[i], 3));
      read.textContent = `J_${n}의 0점: ${zs.slice(0, 4).map((z) => num(z, 3)).join(", ")}, … 간격 ${gaps.slice(0, 3).join(", ")}로 일정하지 않고 π ≈ 3.142에 다가간다. 주황 점선은 ±√(2/(πx))이다.`;
    });
  });

  // 5.1 라플라스 변환 = e^{−st}f(t) 아래 넓이
  Q.def("c8-lt", (fig, svg) => {
    const F = Q.frame(0, 8, -1.1, 1.6, 50, 490, 10, 250), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const L = [["1", () => 1, (s) => 1 / s, "1/s"], ["e^{0.5t}", (t) => Math.exp(0.5 * t), (s) => 1 / (s - 0.5), "1/(s − 0.5)"], ["cos 3t", (t) => Math.cos(3 * t), (s) => s / (s * s + 9), "s/(s² + 9)"]];
    Q.bind(fig, ({ k, s }) => {
      clear(g);
      const [nm, f, Fs, fs] = L[k], h = (t) => Math.exp(-s * t) * f(t);
      axl(g, F, [2, 4, 6, 8], [-1, 1], "t", "");
      const pts = [[0, 0]]; for (let t = 0; t <= 8; t += 0.02) pts.push([t, Math.max(-1.1, Math.min(1.6, h(t)))]); pts.push([8, 0]);
      poly(g, F, pts, "lb");
      Q.plot(g, F, (t) => Math.max(-1.2, Math.min(1.7, f(t))), "gd", 0, 8, 300);
      Q.plot(g, F, (t) => Math.exp(-s * t), "c dsh", 0, 8, 200);
      Q.plot(g, F, h, "a", 0, 8, 400);
      let I = 0; const d = 0.002; for (let t = d / 2; t < 120; t += d) I += h(t) * d;
      read.textContent = `f(t) = ${nm}, s = ${s}: ∫₀^∞ e^{−st}f(t)dt ≈ ${num(I, 4)}, 표의 ${fs} = ${num(Fs(s), 4)}. 회색은 f, 주황 점선은 e^{−st}, 파랑은 그 곱이다.`;
    });
  });

  // 5.2 초기값이 처음부터 들어간다: y″ + y′ + 9y = 0
  Q.def("c8-ivp", (fig, svg) => {
    const F = Q.frame(0, 10, -0.5, 0.5, 50, 490, 15, 235), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ y0, v0 }) => {
      clear(g);
      axl(g, F, [2, 4, 6, 8, 10], [-0.4, -0.2, 0.2, 0.4], "t", "y");
      const y = ode2(1, 9, y0, v0);
      Q.plot(g, F, y, "a", 0, 10, 500);
      Q.dot(g, F.x(0), F.y(y0), "fd", 5);
      read.textContent = `Y(s) = (${y0}s + ${num(y0 + v0, 2)}) / (s² + s + 9): 분자에 y(0) = ${y0}, y(0) + y′(0) = ${num(y0 + v0, 2)}이 그대로 들어가므로, 상수를 따로 맞출 필요가 없다.`;
    });
  });

  // 5.3 계단 함수 펄스에 대한 RC 응답
  Q.def("c8-step", (fig, svg) => {
    const F = Q.frame(0, 8, -0.1, 1.15, 50, 490, 15, 235), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ a, b }) => {
      clear(g);
      const lo = Math.min(a, b), hi = Math.max(a, b), u = (t, c) => (t > c ? 1 : 0);
      const y = (t) => (1 - Math.exp(-(t - lo))) * u(t, lo) - (1 - Math.exp(-(t - hi))) * u(t, hi);
      axl(g, F, [1, 2, 3, 4, 5, 6, 7, 8], [0.5, 1], "t", "");
      poly(g, F, [[0, 0], [lo, 0], [lo, 1], [hi, 1], [hi, 0], [8, 0]], "c", true).setAttribute("style", "fill:none;stroke-width:2");
      Q.plot(g, F, y, "a", 0, 8, 400);
      read.textContent = `입력 u(t − ${lo}) − u(t − ${hi})(주황), Y = (e^{−${lo === 1 ? "" : lo}s} − e^{−${hi === 1 ? "" : hi}s}) / (s(s + 1)). 응답(파랑)은 t = ${hi}에서 ${num(y(hi), 3)}까지 오른 뒤 다시 0으로 내려온다.`;
    });
  });

  // 5.4 폭이 줄어드는 펄스의 응답이 충격 응답에 다가간다
  Q.def("c8-delta", (fig, svg) => {
    const F = Q.frame(0, 6, -0.05, 0.3, 50, 490, 15, 235), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ k }) => {
      clear(g);
      axl(g, F, [1, 2, 3, 4, 5, 6], [0.1, 0.2], "t", "y");
      const inp = (t) => (t >= 1 && t < 1 + k ? 1 / k : 0);
      let yv = 0, vv = 0; const h = 0.0025, pts = [[0, 0]];
      for (let t = 0; t < 6; t += h) { const a = inp(t) - 3 * vv - 2 * yv; vv += h * a; yv += h * vv; pts.push([t + h, yv]); }
      const ex = (t) => (t > 1 ? Math.exp(-(t - 1)) - Math.exp(-2 * (t - 1)) : 0);
      Q.plot(g, F, ex, "c dsh", 0, 6, 400);
      curve(g, F, pts, "a");
      rect(g, F, 1, 0, 1 + k, Math.min(0.28, 0.28 * Math.min(1, 0.2 / k)), "lk");
      txt(g, F.x(1 + k) + 4, F.y(0.27), `폭 ${k}, 높이 ${num(1 / k, 1)}`, "s", "start");
      let mx = 0; pts.forEach(([, v]) => { if (v > mx) mx = v; });
      read.textContent = `넓이 1인 펄스(폭 ${k})에 대한 응답의 최댓값 ${num(mx, 4)}. 폭을 줄이면 δ(t − 1)에 대한 응답 e^{−(t−1)} − e^{−2(t−1)}(주황 점선, 최댓값 0.25)에 다가간다.`;
    });
  });

  // 5.5 합성곱: f(τ)g(t − τ) 아래 넓이
  Q.def("c8-conv", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ t }) => {
      clear(g);
      const F = Q.frame(0, 5, -0.05, 1.15, 50, 300, 15, 235), G = Q.frame(0, 5, -0.05, 1.15, 330, 505, 15, 235);
      axl(g, F, [1, 2, 3, 4, 5], [0.5, 1], "τ", "");
      const gg = (u) => Math.exp(-u);
      const pts = [[0, 0]]; for (let s = 0; s <= t; s += 0.02) pts.push([s, gg(t - s)]); pts.push([t, 0]);
      poly(g, F, pts, "lb");
      Q.plot(g, F, () => 1, "c", 0, 5, 10);
      Q.plot(g, F, (u) => (u <= t ? gg(t - u) : NaN), "a", 0, t, 200);
      Q.line(g, F.x(t), F.y(0), F.x(t), F.y(1.1), "gd dsh"); txt(g, F.x(t), F.y(1.1) - 4, "τ = t", "s", "middle");
      Q.line(g, G.x(0), G.y(0), G.x(5), G.y(0), "ax"); Q.line(g, G.x(0), G.y(0), G.x(0), G.y(1.15), "ax");
      [1, 2, 3, 4, 5].forEach((v) => txt(g, G.x(v), G.y(0) + 14, v, "s", "middle")); txt(g, G.x(5) - 2, G.y(0) - 5, "t", "i", "end");
      Q.plot(g, G, (u) => 1 - Math.exp(-u), "b", 0, 5, 200);
      const val = 1 - Math.exp(-t); Q.dot(g, G.x(t), G.y(val), "fd", 5);
      read.textContent = `t = ${t}: (1 * e^{−t})(t) = ∫₀^t 1·e^{−(t−τ)}dτ = ${num(val, 3)}(왼쪽 청록 넓이). 오른쪽은 t를 바꿔 가며 그 넓이를 모은 1 − e^{−t}이다.`;
    });
  });

  // 5.6 t를 곱하면 s쪽에서 미분: F와 −F′
  Q.def("c8-tmul", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ w }) => {
      clear(g);
      const F = Q.frame(0, 12, -12, 12, 50, 260, 15, 235), G = Q.frame(0, 5, 0, 1.2, 300, 505, 15, 235);
      axl(g, F, [4, 8, 12], [-8, 8], "t", "");
      Q.plot(g, F, (t) => t * Math.sin(w * t), "a", 0, 12, 400); Q.plot(g, F, (t) => t, "gd dsh", 0, 12, 50); Q.plot(g, F, (t) => -t, "gd dsh", 0, 12, 50);
      Q.line(g, G.x(0), G.y(0), G.x(5), G.y(0), "ax"); Q.line(g, G.x(0), G.y(0), G.x(0), G.y(1.2), "ax");
      [1, 2, 3, 4, 5].forEach((v) => txt(g, G.x(v), G.y(0) + 14, v, "s", "middle")); txt(g, G.x(5) - 2, G.y(0) - 5, "s", "i", "end");
      Q.plot(g, G, (s) => Math.min(1.25, w / (s * s + w * w)), "c", 0, 5, 200);
      Q.plot(g, G, (s) => Math.min(1.25, (2 * w * s) / (s * s + w * w) ** 2), "a", 0, 5, 300);
      read.textContent = `ω = ${w}: 왼쪽 t·sin ${w}t(파랑)의 변환은 오른쪽 파랑 2ωs/(s² + ω²)²이고, 이것은 sin ${w}t의 변환 ω/(s² + ω²)(주황)를 s로 미분해 부호를 바꾼 것이다.`;
    });
  });

  // 5.7 변환으로 푼 연립방정식의 궤적
  Q.def("c8-lsys", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ t }) => {
      clear(g);
      const P = Q.frame(-0.4, 1.1, -0.6, 0.35, 40, 250, 20, 230), T = Q.frame(0, 6, -0.5, 1.05, 290, 505, 20, 230);
      Q.line(g, P.x(-0.4), P.y(0), P.x(1.1), P.y(0), "ax"); Q.line(g, P.x(0), P.y(-0.6), P.x(0), P.y(0.35), "ax");
      txt(g, P.x(1.1) - 2, P.y(0) - 5, "y₁", "i", "end"); txt(g, P.x(0) + 4, P.y(0.35) + 12, "y₂", "i", "start");
      const y1 = (s) => Math.exp(-s) * Math.cos(s), y2 = (s) => -Math.exp(-s) * Math.sin(s);
      const pts = []; for (let s = 0; s <= 8; s += 0.02) pts.push([y1(s), y2(s)]); traj(g, P, pts, "a");
      Q.dot(g, P.x(y1(t)), P.y(y2(t)), "fd", 5);
      Q.line(g, T.x(0), T.y(0), T.x(6), T.y(0), "ax"); Q.line(g, T.x(0), T.y(-0.5), T.x(0), T.y(1.05), "ax");
      [2, 4, 6].forEach((v) => txt(g, T.x(v), T.y(0) + 14, v, "s", "middle")); txt(g, T.x(6) - 2, T.y(0) - 5, "t", "i", "end");
      Q.plot(g, T, y1, "b", 0, 6, 200); Q.plot(g, T, y2, "c", 0, 6, 200); Q.line(g, T.x(t), T.y(-0.5), T.x(t), T.y(1.05), "gd dsh");
      read.textContent = `t = ${t}: y₁ = e^{−t}cos t = ${num(y1(t), 3)}(청록), y₂ = −e^{−t}sin t = ${num(y2(t), 3)}(주황). 상평면의 궤적은 돌면서 원점으로 감겨 드는 나선이다.`;
    });
  });

  // 6.1 사각파의 푸리에 부분합과 기브스 현상
  Q.def("c8-fourier", (fig, svg) => {
    const F = Q.frame(-2 * PI, 2 * PI, -1.5, 1.5, 40, 500, 10, 250), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ N }) => {
      clear(g);
      Q.line(g, F.x(-2 * PI), F.y(0), F.x(2 * PI), F.y(0), "ax"); Q.line(g, F.x(0), F.y(-1.5), F.x(0), F.y(1.5), "ax");
      [[-PI, "−π"], [PI, "π"], [-2 * PI, "−2π"], [2 * PI, "2π"]].forEach(([v, s]) => txt(g, F.x(v), F.y(0) + 14, s, "s", "middle"));
      [-1, 1].forEach((v) => txt(g, F.x(0) - 5, F.y(v) + 4, v, "s", "end"));
      [[-2 * PI, -PI, -1], [-PI, 0, 1], [0, PI, -1], [PI, 2 * PI, 1]].forEach(([a, b, v]) => Q.line(g, F.x(a), F.y(-v), F.x(b), F.y(-v), "c"));
      const S = (x) => { let s = 0; for (let n = 1; n <= N; n += 2) s += Math.sin(n * x) / n; return (4 / PI) * s; };
      Q.plot(g, F, S, "a", -2 * PI, 2 * PI, 1200);
      let mx = 0; for (let x = 0.0005; x < 1; x += 0.0005) mx = Math.max(mx, S(x));
      read.textContent = `${N}차까지(홀수 항 ${Math.ceil(N / 2)}개): 뛰어오르는 점 근처의 최댓값 ${num(mx, 4)}. 항을 늘려도 약 1.18(9% 넘침)에서 줄지 않는다(기브스 현상).`;
    });
  });

  // 6.2 f(x) = x (0 < x < 1)의 반구간 전개: 기함수로 넓히면 사인, 우함수로 넓히면 코사인
  Q.def("c8-halfr", (fig, svg) => {
    const F = Q.frame(-2, 2, -1.3, 1.3, 40, 500, 10, 250), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ e, N }) => {
      clear(g);
      axl(g, F, [-2, -1, 1, 2], [-1, 1], "x", "");
      rect(g, F, 0, -1.3, 1, 1.3, "lk").setAttribute("style", "opacity:.4");
      const ext = (x) => { const r = ((x % 2) + 2) % 2, u = r > 1 ? r - 2 : r; return e == 0 ? u : Math.abs(u); };
      Q.plot(g, F, ext, "c dsh", -2, 2, 800);
      const S = e == 0 ? (x) => { let s = 0; for (let n = 1; n <= N; n++) s += ((2 * (n % 2 ? 1 : -1)) / (n * PI)) * Math.sin(n * PI * x); return s; } : (x) => { let s = 0.5; for (let n = 1; n <= N; n++) s += ((2 * ((n % 2 ? -1 : 1) - 1)) / (n * n * PI * PI)) * Math.cos(n * PI * x); return s; };
      Q.plot(g, F, S, "a", -2, 2, 800);
      let err = 0; for (let x = 0.005; x < 1; x += 0.01) err = Math.max(err, Math.abs(S(x) - x));
      read.textContent = (e == 0 ? "기함수로 넓힘 → 사인 급수" : "우함수로 넓힘 → 코사인 급수") + `, ${N}항: 0 < x < 1에서 최대 오차 ${num(err, 3)}. ` + (e == 0 ? "넓힌 함수가 x = ±1에서 뛰어 수렴이 느리다." : "넓힌 함수가 연속이라 계수가 1/n²로 줄어 빨리 수렴한다.");
    });
  });

  // 6.3 경계값 문제: y(π) = 0이 되는 λ만 고유값
  Q.def("c8-sturm", (fig, svg) => {
    const F = Q.frame(0, PI + 0.3, -1.5, 1.5, 50, 490, 10, 250), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ l }) => {
      clear(g);
      Q.line(g, F.x(0), F.y(0), F.x(PI + 0.3), F.y(0), "ax"); Q.line(g, F.x(0), F.y(-1.5), F.x(0), F.y(1.5), "ax");
      txt(g, F.x(PI), F.y(0) + 14, "π", "s", "middle"); txt(g, F.x(PI / 2), F.y(0) + 14, "π/2", "s", "middle");
      Q.line(g, F.x(PI), F.y(-1.5), F.x(PI), F.y(1.5), "d dsh");
      const k = Math.sqrt(l), y = (x) => Math.sin(k * x);
      [1, 4, 9].forEach((m) => { if (Math.abs(m - l) > 1e-6) Q.plot(g, F, (x) => Math.sin(Math.sqrt(m) * x), "gd", 0, PI, 200); });
      Q.plot(g, F, y, "a", 0, PI + 0.3, 300);
      Q.dot(g, F.x(PI), F.y(y(PI)), Math.abs(y(PI)) < 0.02 ? "fb" : "fd", 5);
      read.textContent = `λ = ${l}: y = sin(√λ·x), y(π) = sin(${num(k, 3)}π) = ${num(y(PI), 3)}. ` + (Math.abs(y(PI)) < 0.02 ? "경계 조건을 만족하므로 고유값이다." : "0이 아니므로 고유값이 아니다. λ = 1, 4, 9, …에서만 양 끝이 0이 된다.");
    });
  });

  // 6.4 르장드르 다항식으로 전개한 부분합
  Q.def("c8-legexp", (fig, svg) => {
    const F = Q.frame(-1.05, 1.05, -0.3, 2.9, 60, 480, 10, 250), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const fs = [["|x|", (x) => Math.abs(x)], ["x²", (x) => x * x], ["eˣ", (x) => Math.exp(x)]];
    Q.bind(fig, ({ k, N }) => {
      clear(g);
      const [nm, f] = fs[k];
      axl(g, F, [-1, -0.5, 0.5, 1], [1, 2], "x", "");
      const h = 0.001, a = [];
      for (let m = 0; m <= N; m++) { let I = 0; for (let x = -1 + h / 2; x < 1; x += h) I += f(x) * legP(m, x) * h; a[m] = ((2 * m + 1) / 2) * I; }
      const S = (x) => a.reduce((s, c, m) => s + c * legP(m, x), 0);
      Q.plot(g, F, f, "c", -1, 1, 300); Q.plot(g, F, S, "a", -1, 1, 300);
      let E = 0; for (let x = -1 + h / 2; x < 1; x += h) E += (f(x) - S(x)) ** 2 * h;
      read.textContent = `f = ${nm}, P₀부터 P_${N}까지: 계수 ${a.slice(0, 4).map((c) => num(Math.abs(c) < 1e-10 ? 0 : c, 4)).join(", ")}${N > 3 ? ", …" : ""}, 오차 제곱 적분 ${num(E, 6)}`;
    });
  });

  // 7.1 오일러 방법과 4차 룽게-쿠타: y′ = x + y
  Q.def("c8-euler1", (fig, svg) => {
    const F = Q.frame(0, 1, -0.05, 0.75, 60, 480, 10, 245), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const f = (x, y) => x + y, ex = (x) => Math.exp(x) - x - 1;
    Q.bind(fig, ({ m, h }) => {
      clear(g);
      axl(g, F, [0.2, 0.4, 0.6, 0.8, 1], [0.2, 0.4, 0.6], "x", "y");
      field(g, F, f, 12, 8, "gd");
      Q.plot(g, F, ex, "c", 0, 1, 200);
      const pts = [[0, 0]]; let x = 0, y = 0; const n = Math.round(1 / h);
      for (let i = 0; i < n; i++) {
        if (m == 0) y += h * f(x, y);
        else { const k1 = h * f(x, y), k2 = h * f(x + h / 2, y + k1 / 2), k3 = h * f(x + h / 2, y + k2 / 2), k4 = h * f(x + h, y + k3); y += (k1 + 2 * k2 + 2 * k3 + k4) / 6; }
        x += h; pts.push([x, y]);
      }
      traj(g, F, pts, "a"); pts.forEach(([a, b]) => Q.dot(g, F.x(a), F.y(b), "fa", 3));
      const at = pts.reduce((b, p) => (Math.abs(p[0] - 0.6) < Math.abs(b[0] - 0.6) ? p : b));
      read.textContent = `${m == 0 ? "오일러" : "4차 룽게-쿠타"}, h = ${h}: x = ${num(at[0], 2)}에서 ${num(at[1], 5)}, 정확한 값 ${num(ex(at[0]), 5)}, 오차 ${num(Math.abs(at[1] - ex(at[0])), 5)}`;
    });
  });

  // 7.2 오차의 차수: 로그 눈금에서 기울기
  Q.def("c8-order", (fig, svg) => {
    const F = Q.frame(-3, -0.5, -12, 0, 70, 480, 10, 240), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const err = (m, h0) => { let y = 1; const n = Math.max(1, Math.round(1 / h0)), h = 1 / n; for (let i = 0; i < n; i++) { if (m === 0) y += h * y; else if (m === 1) { const k1 = y, k2 = y + h * k1; y += (h * (k1 + k2)) / 2; } else { const k1 = h * y, k2 = h * (y + k1 / 2), k3 = h * (y + k2 / 2), k4 = h * (y + k3); y += (k1 + 2 * k2 + 2 * k3 + k4) / 6; } } return Math.abs(y - Math.E); };
    Q.bind(fig, ({ p }) => {
      clear(g);
      Q.line(g, F.x(-3), F.y(-12), F.x(-0.5), F.y(-12), "ax"); Q.line(g, F.x(-3), F.y(-12), F.x(-3), F.y(0), "ax");
      [-3, -2, -1].forEach((v) => txt(g, F.x(v), F.y(-12) + 14, `10^${v}`, "s", "middle")); [-12, -9, -6, -3, 0].forEach((v) => txt(g, F.x(-3) - 5, F.y(v) + 4, `10^${v}`, "s", "end"));
      txt(g, F.x(-0.5) - 4, F.y(-12) - 6, "간격 h", "i", "end"); txt(g, F.x(-3) + 6, F.y(0) + 12, "y(1)의 오차", "i");
      const hs = []; for (let e = -3; e <= -0.7; e += 0.1) hs.push(10 ** e);
      [[0, "c", "오일러"], [1, "b", "개선된 오일러"], [2, "a", "4차 룽게-쿠타"]].forEach(([m, cl]) => { const pts = hs.map((h) => [Math.log10(h), Math.max(-12, Math.log10(err(m, h) + 1e-16))]); traj(g, F, pts, cl); });
      const h = 10 ** p, E = [0, 1, 2].map((m) => err(m, h));
      Q.line(g, F.x(p), F.y(-12), F.x(p), F.y(0), "gd dsh");
      E.forEach((v, m) => Q.dot(g, F.x(p), F.y(Math.max(-12, Math.log10(v + 1e-16))), ["fc", "fb", "fa"][m], 4));
      read.textContent = `h = ${num(h, 4)}: 오일러 ${num(E[0], 4)}(주황), 개선된 오일러 ${E[1].toExponential(2)}(청록), 4차 룽게-쿠타 ${E[2].toExponential(2)}(파랑). 직선의 기울기가 각각 1, 2, 4이다.`;
    });
  });

  // 8.1 고계 상수계수 방정식: 특성근(복소평면)과 기저 함수
  Q.def("c8-higher", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const E = [
      { eq: "y‴ − y″ − y′ + y = 0", ch: "(λ − 1)²(λ + 1)", roots: [[1, 0, 2], [-1, 0, 1]], basis: [["eˣ", (x) => Math.exp(x)], ["x eˣ", (x) => x * Math.exp(x)], ["e⁻ˣ", (x) => Math.exp(-x)]], sol: (x) => (2 - x) * Math.exp(x), say: "중근 1에서 eˣ와 x eˣ, 단순근 −1에서 e⁻ˣ를 얻는다. 굵은 곡선은 예제 8.1.1의 해 (2 − x)eˣ이다." },
      { eq: "y‴ − y′ = 0", ch: "λ(λ − 1)(λ + 1)", roots: [[0, 0, 1], [1, 0, 1], [-1, 0, 1]], basis: [["1", () => 1], ["eˣ", (x) => Math.exp(x)], ["e⁻ˣ", (x) => Math.exp(-x)]], say: "서로 다른 실근 0, 1, −1이 기저 1, eˣ, e⁻ˣ를 하나씩 준다." },
      { eq: "y‴ + y′ = 0", ch: "λ(λ² + 1)", roots: [[0, 0, 1], [0, 1, 1], [0, -1, 1]], basis: [["1", () => 1], ["cos x", Math.cos], ["sin x", Math.sin]], say: "복소근 ±i 한 쌍이 cos x와 sin x 두 기저를 주고, 실근 0이 상수 1을 준다." },
      { eq: "y⁗ = 0", ch: "λ⁴", roots: [[0, 0, 4]], basis: [["1", () => 1], ["x", (x) => x], ["x²", (x) => x * x], ["x³", (x) => x * x * x]], say: "4중근 0이므로 e⁰ˣ에 x의 거듭제곱 1, x, x², x³을 곱한 넷이 기저이다. 보의 처짐 방정식 EIy⁗ = w의 동차해가 이것이다." },
    ];
    const C = Q.frame(-1.8, 1.8, -1.8, 1.8, 20, 180, 30, 190), F = Q.frame(-1.5, 1.5, -2.5, 4, 230, 505, 15, 215);
    const cls = ["a", "c", "b", "d"];
    Q.bind(fig, ({ e }) => {
      clear(g);
      const P = E[e];
      Q.line(g, C.X0, C.y(0), C.X1, C.y(0), "ax"); Q.line(g, C.x(0), C.Y0, C.x(0), C.Y1, "ax");
      txt(g, C.X1 - 2, C.y(0) + 16, "Re", "i", "end"); txt(g, C.x(0) + 5, C.Y0 + 10, "Im", "i");
      [-1, 1].forEach((v) => { txt(g, C.x(v), C.y(0) + 14, num(v), "s", "middle"); txt(g, C.x(0) - 5, C.y(v) + 4, v > 0 ? "i" : "−i", "s", "end"); });
      P.roots.forEach(([re, im, m]) => { Q.dot(g, C.x(re), C.y(im), "fc", 6); if (m > 1) txt(g, C.x(re) + 9, C.y(im) - 9, `×${m}`, "tc", "start"); });
      txt(g, 100, 18, `특성다항식 ${P.ch}`, "s", "middle");
      Q.line(g, F.X0, F.y(0), F.X1, F.y(0), "ax"); Q.line(g, F.x(0), F.Y0, F.x(0), F.Y1, "ax");
      [-1, 1].forEach((v) => txt(g, F.x(v), F.y(0) + 14, num(v), "s", "middle")); [2, 4].forEach((v) => txt(g, F.x(0) - 5, F.y(v) + 4, num(v), "s", "end"));
      P.basis.forEach(([name, f], i) => { Q.plot(g, F, f, cls[i], -1.5, 1.5, 200); txt(g, F.X1 - 4, F.Y0 + 14 + i * 16, name, "t" + cls[i], "end"); });
      if (P.sol) Q.plot(g, F, P.sol, "k", -1.5, 1.5, 200).setAttribute("style", "stroke-width:2.5");
      read.textContent = `${P.eq}: 특성다항식 ${P.ch}. ${P.say} 근의 중복도의 합은 방정식의 계와 같은 ${P.basis.length}이다.`;
    });
  });

  // ── 새 그림은 이 위에 ──
})();
