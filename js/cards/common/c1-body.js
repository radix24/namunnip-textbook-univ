/* 공통1(미적분1) 본문 카드의 조작 그림 (js/lib/qfig.js의 NMQ를 쓴다). 그림마다 NMQ.def("이름", …). */
(() => {
  "use strict";
  const Q = window.NMQ;
  if (!Q) return;
  const { el, clear, txt, num } = Q;
  const PI = Math.PI;
  const hole = (g, F, x, y) => el("circle", { cx: F.x(x), cy: F.y(y), r: 4.5, class: "a", style: "fill:var(--card)" }, g);
  // 직선 y = y0 + m(x − x0)을 틀 안에 그린다 (수직이면 세로선)
  const tangent = (g, F, x0, y0, m, cls) => {
    if (!isFinite(m) || Math.abs(m) > 1e4) Q.line(g, F.x(x0), F.Y0, F.x(x0), F.Y1, cls);
    else Q.plot(g, F, (x) => y0 + m * (x - x0), cls, null, null, 2);
  };
  // 위·아래 세모 표시
  const tri = (g, X, Y, up, cls) => el("path", { d: up ? `M${X} ${Y - 14}l-6 -10h12z` : `M${X} ${Y + 14}l-6 10h12z`, class: cls }, g);
  // π 눈금 글자
  const piLab = (k) => ({ "-4": "−2π", "-3": "−3π/2", "-2": "−π", "-1": "−π/2", "0": "0", "1": "π/2", "2": "π", "3": "3π/2", "4": "2π" })[k];
  const piTicks = (g, F, y, a, b) => { for (let k = a; k <= b; k++) if (k) { Q.line(g, F.x(k * PI / 2), y - 3, F.x(k * PI / 2), y + 3, "ax"); txt(g, F.x(k * PI / 2), y + 15, piLab(k), "s", "middle"); } };

  // 1.2 절댓값: 중심 a, 반폭 r인 구간과 끌 수 있는 점 x
  Q.def("c1-absdist", (fig, svg) => {
    const F = Q.frame(-6, 6, 0, 1, 30, 490, 40, 140), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    let x = 2.6, v = { a: 2, r: 1 };
    const draw = () => {
      clear(g);
      const y0 = 100;
      el("line", { x1: F.X0, y1: y0, x2: F.X1, y2: y0, class: "ax" }, g);
      for (let t = -6; t <= 6; t++) { Q.line(g, F.x(t), y0 - 4, F.x(t), y0 + 4, "ax"); txt(g, F.x(t), y0 + 18, num(t), "s", "middle"); }
      const L = F.x(v.a - v.r), R = F.x(v.a + v.r);
      el("rect", { x: L, y: y0 - 12, width: R - L, height: 24, class: "la" }, g);
      el("circle", { cx: L, cy: y0, r: 5, class: "a", style: "fill:var(--card)" }, g);
      el("circle", { cx: R, cy: y0, r: 5, class: "a", style: "fill:var(--card)" }, g);
      Q.dot(g, F.x(v.a), y0, "fa", 4);
      txt(g, F.x(v.a), y0 - 18, "a", "i", "middle");
      const inside = Math.abs(x - v.a) < v.r;
      Q.line(g, F.x(v.a), 58, F.x(x), 58, inside ? "a" : "d");
      Q.line(g, F.x(v.a), 52, F.x(v.a), 64, "ax");
      Q.line(g, F.x(x), 52, F.x(x), 64, "ax");
      txt(g, (F.x(v.a) + F.x(x)) / 2, 48, "|x − a| = " + num(Math.abs(x - v.a)), inside ? "ta" : "td", "middle");
      const p = Q.dot(g, F.x(x), y0, inside ? "fa" : "fd", 8);
      txt(g, F.x(x), y0 + 36, "x = " + num(x), "s", "middle");
      Q.drag(svg, p, (px) => { x = Math.max(-6, Math.min(6, Math.round(F.ix(px) * 10) / 10)); draw(); });
      read.textContent = `구간 (${num(v.a - v.r)}, ${num(v.a + v.r)}). x = ${num(x)}이면 |x − a| = ${num(Math.abs(x - v.a))}${inside ? " < " : " ≥ "}${num(v.r)}이므로 ${inside ? "구간 안" : "구간 밖"}이다.`;
    };
    Q.bind(fig, (w) => { v = w; draw(); });
  });

  // 1.1 상한: 1 − 1/n의 점들, 상한 1, 띠 (1 − ε, 1]에 처음 들어오는 원소
  Q.def("c1-supeps", (fig, svg) => {
    const F = Q.frame(-0.1, 1.25, 0, 1, 30, 490, 30, 140), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ e }) => {
      clear(g);
      const y0 = 95;
      el("rect", { x: F.x(1), y: y0 - 30, width: F.X1 - F.x(1), height: 60, class: "lk" }, g);
      txt(g, (F.x(1) + F.X1) / 2, y0 - 38, "상계들", "s", "middle");
      el("rect", { x: F.x(1 - e), y: y0 - 14, width: F.x(1) - F.x(1 - e), height: 28, class: "la" }, g);
      el("line", { x1: F.X0, y1: y0, x2: F.X1, y2: y0, class: "ax" }, g);
      [0, 0.5, 1].forEach((t) => { Q.line(g, F.x(t), y0 - 4, F.x(t), y0 + 4, "ax"); txt(g, F.x(t), y0 + 34, num(t), "s", "middle"); });
      const n0 = Math.floor(1 / e) + 1;
      for (let n = 1; n <= 80; n++) Q.dot(g, F.x(1 - 1 / n), y0, n === n0 ? "fd" : "fk", n === n0 ? 5 : 2.2);
      Q.line(g, F.x(1), y0 - 22, F.x(1), y0 + 22, "a");
      txt(g, F.x(1), y0 - 26, "sup = 1", "ta", "middle");
      Q.line(g, F.x(1 - e), y0 - 16, F.x(1 - e), y0 + 16, "ax");
      txt(g, F.x(1 - e), y0 + 48, "1 − ε = " + num(1 - e), "s", "middle");
      read.textContent = `ε = ${num(e)}이면 n = ${n0}일 때 1 − 1/${n0} = ${num(1 - 1 / n0, 3)} > ${num(1 - e)}이다. 띠 안에 원소가 있으므로 ${num(1 - e)}는 상계가 아니다.`;
    });
  });

  // 2.1 ε-δ: y = x², a = 3, L = 9
  Q.def("c1-epsdelta", (fig, svg) => {
    const F = Q.frame(1, 5, 0, 20, 40, 500, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const f = (x) => x * x, a = 3, L = 9;
    Q.bind(fig, ({ e, d }) => {
      clear(g);
      Q.axes(g, F, { grid: false, label: false });
      [1, 2, 3, 4, 5].forEach((t) => { Q.line(g, F.x(t), F.Y1 - 3, F.x(t), F.Y1 + 3, "ax"); txt(g, F.x(t), F.Y1 + 15, num(t), "s", "middle"); });
      [0, 5, 10, 15, 20].forEach((t) => txt(g, F.X0 - 5, F.y(t) + 4, num(t), "s", "end"));
      el("rect", { x: F.X0, y: F.y(L + e), width: F.X1 - F.X0, height: F.y(L - e) - F.y(L + e), class: "lb" }, g);
      el("rect", { x: F.x(a - d), y: F.Y0, width: F.x(a + d) - F.x(a - d), height: F.Y1 - F.Y0, class: "la" }, g);
      Q.plot(g, F, f, "k");
      // 세로 띠 안에서 가로 띠를 벗어나는 부분
      let bad = false, d1 = "", pen = false;
      for (let i = 0; i <= 200; i++) {
        const x = a - d + (2 * d * i) / 200, y = f(x), out = Math.abs(y - L) >= e && Math.abs(x - a) > 1e-9;
        if (out) { bad = true; d1 += (pen ? "L" : "M") + F.x(x).toFixed(1) + " " + F.y(y).toFixed(1); pen = true; } else pen = false;
      }
      if (d1) el("path", { d: d1, class: "d", style: "stroke-width:4" }, g);
      Q.line(g, F.X0, F.y(L), F.x(a), F.y(L), "ax dsh"); Q.line(g, F.x(a), F.y(L), F.x(a), F.Y1, "ax dsh");
      el("circle", { cx: F.x(a), cy: F.y(L), r: 4, class: "k", style: "fill:var(--card)" }, g);
      txt(g, F.X0 + 6, F.y(L + e) - 5, "9 + ε", "tb"); txt(g, F.X0 + 6, F.y(L - e) + 14, "9 − ε", "tb");
      txt(g, F.x(a - d), F.Y0 + 14, "3 − δ", "ta", "end"); txt(g, F.x(a + d), F.Y0 + 14, "3 + δ", "ta");
      const best = Math.min(Math.sqrt(L + e) - a, a - Math.sqrt(L - e));
      read.textContent = bad
        ? `δ = ${num(d)}이면 띠를 벗어나는 x가 있다. 이 ε에는 δ < ${num(best, 3)}이어야 한다.`
        : `δ = ${num(d)}이면 세로 띠 안의 그래프가 모두 가로 띠 안에 있다. 증명에서 고른 δ = min(1, ε/7) = ${num(Math.min(1, e / 7), 3)}도 통한다.`;
    });
  });

  // 2.2 압축 정리: x² sin(1/x)와 ±x², 보는 폭 w
  Q.def("c1-squeeze", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ w }) => {
      clear(g);
      const F = Q.frame(-w, w, -w * w * 1.15, w * w * 1.15, 30, 500, 10, 250);
      Q.axes(g, F, { grid: false, label: false });
      txt(g, F.X1 - 2, F.y(0) + 14, num(w, 2), "s", "end"); txt(g, F.X0 + 2, F.y(0) + 14, "−" + num(w, 2), "s");
      txt(g, F.x(0) + 4, F.Y0 + 12, num(w * w * 1.15, 4), "s");
      Q.plot(g, F, (x) => x * x, "b"); Q.plot(g, F, (x) => -x * x, "b");
      Q.plot(g, F, (x) => (x ? x * x * Math.sin(1 / x) : 0), "a", null, null, 1600);
      txt(g, F.x(w * 0.85), F.y(w * w * 0.72) - 6, "y = x²", "tb", "end");
      txt(g, F.x(w * 0.85), F.y(-w * w * 0.72) + 16, "y = −x²", "tb", "end");
      read.textContent = `|x| ≤ ${num(w, 2)}인 구간에서 곡선은 ±x² 사이, 곧 높이 ${num(w * w, 4)} 안에 갇혀 있다.`;
    });
  });

  // 2.2 sin x / x: 단위원의 세 도형
  Q.def("c1-sinx", (fig, svg) => {
    const F = Q.frame(-0.2, 1.3, -0.15, 1.6, 40, 290, 15, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ x }) => {
      clear(g);
      const P = [Math.cos(x), Math.sin(x)], T = [1, Math.min(Math.tan(x), 1.6)];
      el("path", { d: `M${F.x(0)} ${F.y(0)}L${F.x(1)} ${F.y(0)}L${F.x(1)} ${F.y(T[1])}Z`, class: "lc" }, g);
      let arc = `M${F.x(0)} ${F.y(0)}L${F.x(1)} ${F.y(0)}`;
      for (let i = 1; i <= 40; i++) { const t = (x * i) / 40; arc += `L${F.x(Math.cos(t))} ${F.y(Math.sin(t))}`; }
      el("path", { d: arc + "Z", class: "lb" }, g);
      el("path", { d: `M${F.x(0)} ${F.y(0)}L${F.x(1)} ${F.y(0)}L${F.x(P[0])} ${F.y(P[1])}Z`, class: "la" }, g);
      let circ = ""; for (let i = 0; i <= 60; i++) { const t = (Math.PI / 2) * i / 60; circ += (i ? "L" : "M") + F.x(Math.cos(t)) + " " + F.y(Math.sin(t)); }
      el("path", { d: circ, class: "ax" }, g);
      Q.line(g, F.x(0), F.y(0), F.x(1.25), F.y(0), "ax"); Q.line(g, F.x(0), F.y(0), F.x(0), F.y(1.15), "ax");
      Q.line(g, F.x(1), F.y(-0.1), F.x(1), F.y(1.6), "ax dsh");
      Q.line(g, F.x(0), F.y(0), F.x(1), F.y(T[1]), "k");
      Q.line(g, F.x(P[0]), F.y(P[1]), F.x(1), F.y(0), "k");
      Q.line(g, F.x(P[0]), F.y(P[1]), F.x(P[0]), F.y(0), "a dsh");
      txt(g, F.x(0) - 6, F.y(0) + 14, "O", "", "end"); txt(g, F.x(1) + 4, F.y(0) + 14, "A"); txt(g, F.x(P[0]) - 6, F.y(P[1]) - 4, "P", "", "end");
      if (Math.tan(x) <= 1.6) txt(g, F.x(1) + 6, F.y(T[1]) + 4, "T");
      const s = Math.sin(x) / 2, a = x / 2, t = Math.tan(x) / 2, X = 310;
      txt(g, X, 60, "삼각형 OAP  " + num(s, 4), "ta"); txt(g, X, 84, "부채꼴 OAP  " + num(a, 4), "tb"); txt(g, X, 108, "삼각형 OAT  " + num(t, 4), "tc");
      txt(g, X, 150, "sin x / x = " + num(Math.sin(x) / x, 5), ""); txt(g, X, 174, "cos x = " + num(Math.cos(x), 5), "s");
      read.textContent = `x = ${num(x)}일 때 cos x = ${num(Math.cos(x), 4)} < sin x / x = ${num(Math.sin(x) / x, 4)} < 1이다.`;
    });
  });


  // 2.3 불연속의 종류
  Q.def("c1-disc", (fig, svg) => {
    const F = Q.frame(-2, 2, -2.2, 3.2, 40, 480, 15, 285), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const C = [
      ["연속", "f(0) 있음 · 극한 있음 · 둘이 같음", () => { Q.plot(g, F, (x) => 0.5 * x * x + 1, "a"); Q.dot(g, F.x(0), F.y(1), "fa"); }],
      ["제거 가능", "f(0) 있음 · 극한 1 있음 · 그런데 f(0) = 2.5라서 다름", () => { Q.plot(g, F, (x) => 0.5 * x * x + 1, "a"); hole(g, F, 0, 1); Q.dot(g, F.x(0), F.y(2.5), "fa"); }],
      ["도약", "오른쪽 극한 2, 왼쪽 극한 0 · 서로 달라 극한 없음", () => { Q.plot(g, F, (x) => 0.4 * x, "a", -2, -0.001); Q.plot(g, F, (x) => 2 + 0.3 * x, "a", 0, 2); hole(g, F, 0, 0); Q.dot(g, F.x(0), F.y(2), "fa"); }],
      ["무한", "x → 0일 때 f(x) → +∞ · 극한 없음", () => { Q.plot(g, F, (x) => 0.15 / (x * x), "a", -2, -0.01); Q.plot(g, F, (x) => 0.15 / (x * x), "a", 0.01, 2); }],
      ["진동", "0 근처에서 −1과 1 사이를 끝없이 오감 · 극한 없음", () => { Q.plot(g, F, (x) => Math.sin(1 / x), "a", -2, -0.002, 3000); Q.plot(g, F, (x) => Math.sin(1 / x), "a", 0.002, 2, 3000); Q.dot(g, F.x(0), F.y(0), "fa"); }],
    ];
    Q.bind(fig, ({ k }) => {
      clear(g);
      Q.axes(g, F, { step: 1 });
      C[k][2]();
      read.textContent = `${C[k][0]}: ${C[k][1]}`;
    });
  });

  // 2.4 이분법: f(x) = x⁵ − 3x + 1
  Q.def("c1-bisect", (fig, svg) => {
    const f = (x) => x ** 5 - 3 * x + 1, F = Q.frame(-0.1, 1.1, -1.3, 1.3, 40, 500, 15, 235), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ n }) => {
      clear(g);
      let a = 0, b = 1;
      for (let i = 0; i < n; i++) { const m = (a + b) / 2; if (f(a) * f(m) <= 0) b = m; else a = m; }
      el("rect", { x: F.x(a), y: F.Y0, width: Math.max(1, F.x(b) - F.x(a)), height: F.Y1 - F.Y0, class: "la" }, g);
      Q.axes(g, F, { step: 0.5 });
      Q.plot(g, F, f, "k");
      Q.dot(g, F.x(a), F.y(f(a)), f(a) > 0 ? "fb" : "fd"); Q.dot(g, F.x(b), F.y(f(b)), f(b) > 0 ? "fb" : "fd");
      const m = (a + b) / 2;
      if (n < 7) { Q.line(g, F.x(m), F.y(0), F.x(m), F.y(f(m)), "c dsh"); Q.dot(g, F.x(m), F.y(f(m)), "fc", 3.5); }
      read.textContent = `${n}단계 뒤 근은 [${num(a, 5)}, ${num(b, 5)}] 안에 있다. 폭 ${num(b - a, 5)} = 1/${2 ** n}.` + (n < 7 ? ` 다음 중점 ${num(m, 5)}에서 f = ${num(f(m), 3)}.` : "");
    });
  });

  // 2.4 최대·최소 정리의 반례 세 개
  Q.def("c1-evt", (fig, svg) => {
    const g = el("g", {}, svg);
    const P = [Q.frame(-0.2, 1.2, -0.2, 1.3, 15, 165, 20, 160), Q.frame(-0.2, 3, -0.2, 3, 185, 335, 20, 160), Q.frame(-1.2, 1.2, -4, 4, 355, 505, 20, 160)];
    P.forEach((F) => Q.axes(g, F, { grid: false, label: false }));
    Q.plot(g, P[0], (x) => x, "a", 0, 1); hole(g, P[0], 0, 0); hole(g, P[0], 1, 1);
    txt(g, 90, 180, "(0, 1)에서 y = x", "s", "middle");
    Q.plot(g, P[1], (x) => x, "a", 0, 3); Q.dot(g, P[1].x(0), P[1].y(0), "fa", 4); Q.arrow(g, P[1].x(2.6), P[1].y(2.6), P[1].x(2.95), P[1].y(2.95), "a", "fa");
    txt(g, 260, 180, "[0, ∞)에서 y = x", "s", "middle");
    Q.plot(g, P[2], (x) => 1 / x, "a", -1, -0.25); Q.plot(g, P[2], (x) => 1 / x, "a", 0.25, 1); Q.dot(g, P[2].x(0), P[2].y(0), "fa", 4);
    txt(g, 430, 180, "[−1, 1]에서 1/x, f(0) = 0", "s", "middle");
  });

  // 3.1 할선에서 접선으로: s = 4.9t², t = 2
  Q.def("c1-secant", (fig, svg) => {
    const s = (t) => 4.9 * t * t, F = Q.frame(0, 3.7, -2, 62, 40, 500, 12, 245), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ h }) => {
      clear(g);
      Q.axes(g, F, { grid: false, label: false, xs: "t", ys: "s" });
      [1, 2, 3].forEach((t) => { Q.line(g, F.x(t), F.y(0) - 3, F.x(t), F.y(0) + 3, "ax"); txt(g, F.x(t), F.y(0) + 15, num(t), "s", "middle"); });
      [20, 40, 60].forEach((v) => txt(g, F.x(0) - 5, F.y(v) + 4, num(v), "s", "end"));
      Q.plot(g, F, s, "k", 0, 3.6);
      Q.plot(g, F, (t) => 19.6 + 19.6 * (t - 2), "a dsh");
      const m = h ? (s(2 + h) - s(2)) / h : 19.6;
      if (Math.abs(h) > 1e-9) {
        Q.plot(g, F, (t) => s(2) + m * (t - 2), "c");
        Q.dot(g, F.x(2 + h), F.y(s(2 + h)), "fc");
        txt(g, F.x(2 + h) + 6, F.y(s(2 + h)) + 14, "t = 2 + h", "tc");
      }
      Q.dot(g, F.x(2), F.y(s(2)), "fk");
      txt(g, F.x(0.15), F.y(56), "점선: 접선 (기울기 19.6)", "ta");
      read.textContent = Math.abs(h) > 1e-9
        ? `h = ${num(h)}: 평균 속도 (s(2 + h) − s(2)) / h = 19.6 + 4.9h = ${num(m, 3)} m/s`
        : "h = 0에서는 나눗셈을 할 수 없다. 대신 h를 0에 가깝게 보내면 평균 속도가 19.6에 다가간다.";
    });
  });

  // 3.1 미분 불가능한 두 전형: |x|와 √x
  Q.def("c1-nondiff", (fig, svg) => {
    const g = el("g", {}, svg), A = Q.frame(-1.5, 1.5, -0.3, 1.6, 20, 245, 15, 185), B = Q.frame(-0.4, 2.2, -0.3, 1.6, 275, 500, 15, 185);
    Q.axes(g, A, { grid: false, label: false }); Q.axes(g, B, { grid: false, label: false });
    Q.plot(g, A, Math.abs, "a");
    Q.plot(g, A, (x) => x, "b dsh", 0, 1.5); Q.plot(g, A, (x) => -x, "c dsh", -1.5, 0);
    txt(g, A.x(1.45), A.y(1.0), "기울기 1", "tb", "end"); txt(g, A.x(-1.45), A.y(1.0), "기울기 −1", "tc");
    txt(g, A.x(0), A.Y1 + 2, "y = |x|", "s", "middle");
    Q.plot(g, B, Math.sqrt, "a", 0, 2.2);
    Q.line(g, B.x(0), B.y(-0.3), B.x(0), B.y(1.6), "d dsh");
    txt(g, B.x(0.08), B.y(1.45), "수직 접선", "td");
    txt(g, B.x(1.1), B.Y1 + 2, "y = √x", "s", "middle");
    Q.dot(g, A.x(0), A.y(0), "fk"); Q.dot(g, B.x(0), B.y(0), "fk");
  });

  // 2.2 연쇄법칙: x → u = x² → y = sin u, 세 수직선
  Q.def("c1-chain", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const rows = [{ y: 50, n: "x", a: 0, b: 2.5 }, { y: 125, n: "u = x²", a: 0, b: 6.5 }, { y: 200, n: "y = sin u", a: -1.1, b: 1.1 }];
    Q.bind(fig, ({ x, d }) => {
      clear(g);
      const u0 = x * x, u1 = (x + d) * (x + d), y0 = Math.sin(u0), y1 = Math.sin(u1);
      const vals = [[x, x + d], [u0, u1], [y0, y1]];
      const X = (r, v) => 90 + ((v - r.a) / (r.b - r.a)) * 400;
      rows.forEach((r, i) => {
        Q.line(g, 90, r.y, 490, r.y, "ax");
        txt(g, 80, r.y + 4, r.n, "s", "end");
        const [p, q] = vals[i], lo = Math.min(p, q), hi = Math.max(p, q);
        el("rect", { x: X(r, lo), y: r.y - 7, width: Math.max(1.5, X(r, hi) - X(r, lo)), height: 14, class: ["la", "lb", "lc"][i] }, g);
        Q.dot(g, X(r, p), r.y, ["fa", "fb", "fc"][i], 3.5);
        if (i < 2) {
          const r2 = rows[i + 1], [p2, q2] = vals[i + 1];
          Q.line(g, X(r, p), r.y + 8, X(r2, p2), r2.y - 8, "gd"); Q.line(g, X(r, q), r.y + 8, X(r2, q2), r2.y - 8, "gd");
        }
      });
      const k1 = (u1 - u0) / d, k2 = (y1 - y0) / (u1 - u0);
      txt(g, 490, 100, `Δu/Δx = ${num(k1, 3)}  (2x = ${num(2 * x, 3)})`, "tb", "end");
      txt(g, 490, 175, `Δy/Δu = ${num(k2, 3)}  (cos u = ${num(Math.cos(u0), 3)})`, "tc", "end");
      read.textContent = `Δy/Δx = ${num((y1 - y0) / d, 3)} = ${num(k1, 3)} × ${num(k2, 3)}. Δx → 0이면 2x·cos(x²) = ${num(2 * x * Math.cos(u0), 3)}에 다가간다.`;
    });
  });


  // 2.3 원 위의 점과 접선
  Q.def("c1-circle", (fig, svg) => {
    const F = Q.frame(-8.5, 8.5, -6.6, 6.6, 50, 470, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ t }) => {
      clear(g);
      Q.axes(g, F, { step: 1, every: 5, lstep: 5 });
      let c = ""; for (let i = 0; i <= 120; i++) { const a = (2 * PI * i) / 120; c += (i ? "L" : "M") + F.x(5 * Math.cos(a)) + " " + F.y(5 * Math.sin(a)); }
      el("path", { d: c, class: "k" }, g);
      const a = (t * PI) / 180, x = 5 * Math.cos(a), y = 5 * Math.sin(a), m = -x / y;
      Q.line(g, F.x(0), F.y(0), F.x(x), F.y(y), "b dsh");
      tangent(g, F, x, y, m, "a");
      Q.dot(g, F.x(x), F.y(y), "fd", 5);
      read.textContent = `점 (${num(x)}, ${num(y)})에서 dy/dx = −x/y = ` + (Math.abs(y) < 1e-6 ? "정의되지 않음(접선이 수직)" : num(m, 3));
    });
  });

  // 2.3 데카르트의 엽선과 (3, 3)에서의 접선
  Q.def("c1-folium", (fig, svg) => {
    const F = Q.frame(-4, 5, -4, 5, 115, 405, 10, 275), g = el("g", {}, svg);
    Q.axes(g, F, { step: 1 });
    let d = "", pen = false;
    for (let i = 0; i <= 600; i++) {
      const t = -0.9 + (i / 600) * 30, k = 1 + t ** 3; if (Math.abs(k) < 0.02) { pen = false; continue; }
      const x = (6 * t) / k, y = (6 * t * t) / k;
      if (x < -4 || x > 5 || y < -4 || y > 5) { pen = false; continue; }
      d += (pen ? "L" : "M") + F.x(x).toFixed(1) + " " + F.y(y).toFixed(1); pen = true;
    }
    for (let i = 0; i <= 300; i++) {
      const t = -1.1 - (i / 300) * 30, k = 1 + t ** 3, x = (6 * t) / k, y = (6 * t * t) / k;
      if (x < -4 || x > 5 || y < -4 || y > 5) { pen = false; continue; }
      d += (pen ? "L" : "M") + F.x(x).toFixed(1) + " " + F.y(y).toFixed(1); pen = true;
    }
    el("path", { d, class: "k" }, g);
    tangent(g, F, 3, 3, -1, "a");
    Q.dot(g, F.x(3), F.y(3), "fd", 5);
    txt(g, F.x(3) + 8, F.y(3) - 8, "(3, 3)", "s");
    txt(g, F.x(4.9), F.y(4.4), "x³ + y³ = 6xy", "s", "end");
  });

  // 2.4 ln x의 접선 기울기 1/x
  Q.def("c1-lnslope", (fig, svg) => {
    const F = Q.frame(-0.3, 6.5, -2.2, 2.4, 40, 500, 10, 240), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ x }) => {
      clear(g);
      Q.axes(g, F, { step: 1 });
      Q.plot(g, F, Math.log, "k", 0.05, 6.5);
      tangent(g, F, x, Math.log(x), 1 / x, "a");
      Q.dot(g, F.x(x), F.y(Math.log(x)), "fd", 5);
      txt(g, F.x(6.3), F.y(Math.log(6.3)) + 18, "y = ln x", "s", "end");
      read.textContent = `x = ${num(x)}에서 접선의 기울기 1/x = ${num(1 / x, 3)}`;
    });
  });

  // 2.4 arctan x와 1/(1 + x²)
  Q.def("c1-arctan", (fig, svg) => {
    const F = Q.frame(-6, 6, -1.8, 1.8, 30, 500, 10, 210), g = el("g", {}, svg);
    Q.axes(g, F, { step: 1, every: 2, lstep: 2 });
    Q.line(g, F.X0, F.y(PI / 2), F.X1, F.y(PI / 2), "ax dsh"); Q.line(g, F.X0, F.y(-PI / 2), F.X1, F.y(-PI / 2), "ax dsh");
    txt(g, F.X0 + 4, F.y(PI / 2) - 5, "π/2", "s"); txt(g, F.X0 + 4, F.y(-PI / 2) + 14, "−π/2", "s");
    Q.plot(g, F, Math.atan, "a"); Q.plot(g, F, (x) => 1 / (1 + x * x), "b");
    txt(g, F.x(4.5), F.y(Math.atan(4.5)) + 18, "arctan x", "ta", "middle");
    txt(g, F.x(1.6), F.y(0.55), "1/(1 + x²)", "tb");
  });

  // 2.5 √x를 (4, 2) 근처에서 확대
  Q.def("c1-zoom", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ z }) => {
      clear(g);
      const w = 5 / Math.pow(10, z), F = Q.frame(4 - w, 4 + w, 2 - w * 0.55, 2 + w * 0.55, 40, 500, 10, 250);
      Q.axes(g, F, { grid: false, label: false });
      Q.plot(g, F, (x) => (x >= 0 ? Math.sqrt(x) : NaN), "k");
      Q.plot(g, F, (x) => 2 + (x - 4) / 4, "a dsh");
      Q.dot(g, F.x(4), F.y(2), "fd", 4);
      txt(g, F.X0 + 4, F.Y1 - 6, num(4 - w, 4), "s"); txt(g, F.X1 - 4, F.Y1 - 6, num(4 + w, 4), "s", "end");
      const x1 = 4 + w * 0.8, gap = 2 + (x1 - 4) / 4 - Math.sqrt(x1);
      read.textContent = `보이는 폭 ${num(2 * w, 4)}. x = ${num(x1, 4)}에서 접선과 곡선의 차이 ${gap.toExponential(1)} (화면 높이의 ${num((100 * gap) / (1.1 * w), 3)}%)`;
    });
  });

  // 2.6 점 (cosh t, sinh t)와 쌍곡선
  Q.def("c1-hyperpt", (fig, svg) => {
    const F = Q.frame(-1.5, 4.2, -3.8, 3.8, 50, 470, 10, 250), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ t }) => {
      clear(g);
      Q.axes(g, F, { step: 1 });
      let d = ""; for (let i = 0; i <= 100; i++) { const s = -2.1 + (4.2 * i) / 100; d += (i ? "L" : "M") + F.x(Math.cosh(s)) + " " + F.y(Math.sinh(s)); }
      el("path", { d, class: "k" }, g);
      let c = ""; for (let i = 0; i <= 80; i++) { const s = (2 * PI * i) / 80; c += (i ? "L" : "M") + F.x(Math.cos(s)) + " " + F.y(Math.sin(s)); }
      el("path", { d: c, class: "ax dsh" }, g);
      const x = Math.cosh(t), y = Math.sinh(t);
      Q.line(g, F.x(x), F.y(0), F.x(x), F.y(y), "b dsh");
      Q.dot(g, F.x(x), F.y(y), "fd", 5);
      txt(g, F.x(x) + 8, F.y(y) + (y > 0 ? -6 : 16), `(${num(x, 3)}, ${num(y, 3)})`, "s");
      txt(g, F.x(3.9), F.y(3.6), "x² − y² = 1", "s", "end");
      read.textContent = `t = ${num(t)}: cosh² t − sinh² t = ${num(x * x, 3)} − ${num(y * y, 3)} = ${num(x * x - y * y, 3)}`;
    });
  });


  // 3.1 닫힌구간 방법: f = x³ − 3x² + 1, [−1/2, b]
  Q.def("c1-maxmin", (fig, svg) => {
    const f = (x) => x ** 3 - 3 * x * x + 1, F = Q.frame(-1, 4.3, -5, 19, 40, 500, 10, 250), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ b }) => {
      clear(g);
      el("rect", { x: F.x(-0.5), y: F.Y0, width: F.x(b) - F.x(-0.5), height: F.Y1 - F.Y0, class: "lk" }, g);
      Q.axes(g, F, { step: 1, every: 5, lstep: 5, grid: false });
      [-1, 1, 2, 3, 4].forEach((t) => { Q.line(g, F.x(t), F.y(0) - 3, F.x(t), F.y(0) + 3, "ax"); txt(g, F.x(t), F.y(0) + 15, num(t), "s", "middle"); });
      Q.plot(g, F, f, "k dsh");
      Q.plot(g, F, f, "a", -0.5, b);
      const cand = [-0.5, b, ...[0, 2].filter((c) => c > -0.5 && c < b)];
      cand.forEach((c) => Q.dot(g, F.x(c), F.y(f(c)), "fk", 3.5));
      const vals = cand.map(f), mx = cand[vals.indexOf(Math.max(...vals))], mn = cand[vals.indexOf(Math.min(...vals))];
      tri(g, F.x(mx), F.y(f(mx)), true, "fd"); tri(g, F.x(mn), F.y(f(mn)), false, "fb");
      read.textContent = `후보 ${cand.map((c) => `f(${num(c)}) = ${num(f(c), 3)}`).join(", ")}. 최댓값 ${num(f(mx), 3)} (x = ${num(mx)}), 최솟값 ${num(f(mn), 3)} (x = ${num(mn)})`;
    });
  });

  // 3.2 평균값 정리: f = x³ − x, [0, b], c = b/√3
  Q.def("c1-mvt", (fig, svg) => {
    const f = (x) => x ** 3 - x, F = Q.frame(-0.4, 2.5, -1.2, 9, 40, 500, 10, 250), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ b }) => {
      clear(g);
      Q.axes(g, F, { step: 1, grid: false });
      Q.plot(g, F, f, "k");
      const m = (f(b) - f(0)) / b, c = b / Math.sqrt(3);
      Q.plot(g, F, (x) => m * x, "c", -0.4, 2.5);
      tangent(g, F, c, f(c), 3 * c * c - 1, "a");
      Q.line(g, F.x(c), F.y(f(c)), F.x(c), F.y(m * c), "b dsh");
      Q.dot(g, F.x(0), F.y(0), "fc"); Q.dot(g, F.x(b), F.y(f(b)), "fc"); Q.dot(g, F.x(c), F.y(f(c)), "fa", 5);
      txt(g, F.x(c), F.y(0) + 16, "c", "ta", "middle");
      read.textContent = `할선 기울기 (f(${num(b)}) − f(0)) / ${num(b)} = ${num(m, 3)}, c = ${num(c, 3)}에서 f′(c) = 3c² − 1 = ${num(3 * c * c - 1, 3)}`;
    });
  });

  // 3.3 로피탈: e^x − 1과 x
  Q.def("c1-lhop", (fig, svg) => {
    const F = Q.frame(-1.6, 1.6, -1.2, 3.8, 40, 500, 10, 240), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ x }) => {
      clear(g);
      Q.axes(g, F, { step: 1 });
      Q.plot(g, F, (t) => Math.exp(t) - 1, "a"); Q.plot(g, F, (t) => t, "c");
      Q.line(g, F.x(x), F.y(0), F.x(x), F.y(Math.exp(x) - 1), "a dsh");
      Q.dot(g, F.x(x), F.y(Math.exp(x) - 1), "fa"); Q.dot(g, F.x(x), F.y(x), "fc");
      txt(g, F.x(1.25), F.y(Math.exp(1.25) - 1) + 4, "eˣ − 1", "ta", "end"); txt(g, F.x(1.5), F.y(1.5) + 16, "x", "tc");
      read.textContent = Math.abs(x) < 1e-9 ? "x = 0에서는 0/0이라 값을 정할 수 없다." : `x = ${num(x)}: (eˣ − 1)/x = ${num((Math.exp(x) - 1) / x, 4)}`;
    });
  });

  // 3.3 보충 점근선: (x² + 1)/(x − 1)
  Q.def("c1-asym", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ r }) => {
      clear(g);
      const F = Q.frame(-r, r, -r * 0.9, r * 1.2, 40, 500, 10, 270);
      Q.axes(g, F, { grid: false, label: false });
      txt(g, F.X1 - 2, F.y(0) + 14, num(r), "s", "end");
      Q.line(g, F.x(1), F.Y0, F.x(1), F.Y1, "ax dsh"); Q.plot(g, F, (x) => x + 1, "c dsh");
      const f = (x) => (x * x + 1) / (x - 1);
      Q.plot(g, F, f, "a", -r, 0.999, 800); Q.plot(g, F, f, "a", 1.001, r, 800);
      txt(g, F.x(1) + 4, F.Y0 + 12, "x = 1", "s"); txt(g, F.x(r * 0.55), F.y(r * 0.55 + 1) + 16, "y = x + 1", "tc");
      read.textContent = `x = ${num(r)}에서 f(x) − (x + 1) = 2/(x − 1) = ${num(2 / (r - 1), 3)}`;
    });
  });

  // 3.3 보충 로지스틱 곡선
  Q.def("c1-logistic", (fig, svg) => {
    const F = Q.frame(-6, 6, -0.4, 2.5, 40, 500, 10, 190), g = el("g", {}, svg);
    Q.axes(g, F, { step: 1, every: 2, lstep: 2 });
    Q.line(g, F.X0, F.y(2), F.X1, F.y(2), "c dsh");
    Q.plot(g, F, (x) => (2 * Math.exp(x)) / (Math.exp(x) + 1), "a");
    txt(g, F.X1 - 4, F.y(2) - 6, "y = 2", "tc", "end"); txt(g, F.X0 + 4, F.y(0) - 6, "y = 0", "s");
  });

  // 4.1 리만 합: y = x² 위 [0, 1]
  Q.def("c1-riemann", (fig, svg) => {
    const f = (x) => x * x, F = Q.frame(-0.08, 1.1, -0.08, 1.1, 40, 500, 10, 250), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ n, p }) => {
      clear(g);
      let S = 0;
      for (let k = 0; k < n; k++) {
        const x0 = k / n, xs = x0 + p / n, h = f(xs); S += h / n;
        el("rect", { x: F.x(x0), y: F.y(h), width: F.x(1 / n) - F.x(0), height: F.y(0) - F.y(h), class: "la", style: "stroke:var(--fa);stroke-width:" + (n > 30 ? 0.3 : 0.8) }, g);
      }
      Q.axes(g, F, { step: 0.5 });
      Q.plot(g, F, f, "k", 0, 1.05);
      read.textContent = `n = ${n}: 리만 합 ${num(S, 5)}, 1/3과의 차이 ${num(S - 1 / 3, 5)}`;
    });
  });

  // 4.2 넓이 함수와 띠: f(t) = 1 + 0.5 sin(1.6t) + 0.3t
  Q.def("c1-ftc", (fig, svg) => {
    const f = (t) => 1 + 0.5 * Math.sin(1.6 * t) + 0.3 * t, G = (x) => x + (0.5 / 1.6) * (1 - Math.cos(1.6 * x)) + 0.15 * x * x;
    const F = Q.frame(-0.1, 3.8, -0.15, 2.6, 40, 500, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const area = (a, b, cls) => { let d = `M${F.x(a)} ${F.y(0)}`; for (let i = 0; i <= 60; i++) { const t = a + ((b - a) * i) / 60; d += `L${F.x(t)} ${F.y(f(t))}`; } el("path", { d: d + `L${F.x(b)} ${F.y(0)}Z`, class: cls }, g); };
    Q.bind(fig, ({ x, h }) => {
      clear(g);
      area(0, x, "la"); area(x, x + h, "lc");
      Q.axes(g, F, { step: 1, grid: false });
      Q.plot(g, F, f, "k", 0, 3.7);
      Q.line(g, F.x(x), F.y(0), F.x(x), F.y(f(x)), "a"); Q.line(g, F.x(x + h), F.y(0), F.x(x + h), F.y(f(x + h)), "c");
      txt(g, F.x(x / 2), F.y(0.4), "g(x)", "ta", "middle");
      read.textContent = `g(${num(x)}) = ${num(G(x), 3)}, (g(x + h) − g(x))/h = ${num((G(x + h) - G(x)) / h, 4)}, f(x) = ${num(f(x), 4)}`;
    });
  });

  // 4.3 치환: x e^{−x²} on [0, b]와 e^u/2 on [−b², 0]
  Q.def("c1-subst", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const A = Q.frame(-0.1, 2.1, -0.05, 0.55, 30, 250, 15, 200), B = Q.frame(-4.2, 0.2, -0.05, 0.55, 280, 500, 15, 200);
    const fill = (F, fn, a, b, cls) => { let d = `M${F.x(a)} ${F.y(0)}`; for (let i = 0; i <= 80; i++) { const t = a + ((b - a) * i) / 80; d += `L${F.x(t)} ${F.y(fn(t))}`; } el("path", { d: d + `L${F.x(b)} ${F.y(0)}Z`, class: cls }, g); };
    const f1 = (x) => x * Math.exp(-x * x), f2 = (u) => Math.exp(u) / 2;
    Q.bind(fig, ({ b }) => {
      clear(g);
      fill(A, f1, 0, b, "la"); fill(B, f2, -b * b, 0, "lb");
      Q.axes(g, A, { grid: false, label: false }); Q.axes(g, B, { grid: false, label: false });
      Q.plot(g, A, f1, "a", 0, 2.1); Q.plot(g, B, f2, "b", -4.2, 0.2);
      [1, 2].forEach((t) => txt(g, A.x(t), A.y(0) + 14, num(t), "s", "middle"));
      [-4, -2].forEach((t) => txt(g, B.x(t), B.y(0) + 14, num(t), "s", "middle"));
      txt(g, A.x(1.9), A.Y0 + 10, "y = x e^(−x²)", "ta", "end"); txt(g, B.x(-4), B.Y0 + 10, "y = eᵘ/2", "tb");
      txt(g, A.X1, A.Y1 + 4, "x", "i", "end"); txt(g, B.X1 - 6, B.Y1 + 4, "u", "i", "end");
      const v = (1 - Math.exp(-b * b)) / 2;
      read.textContent = `b = ${num(b)}: 두 넓이 모두 (1 − e^(−b²))/2 = ${num(v, 4)}. u의 구간은 [${num(-b * b, 3)}, 0]`;
    });
  });

  // 4.4 차분 오차의 V자 (로그 눈금)
  Q.def("c1-vshape", (fig, svg) => {
    const F = Q.frame(-16, -0.5, -12, 0.5, 50, 500, 10, 240), g = el("g", {}, svg), t = Math.cos(1);
    for (let e = -16; e <= -1; e += 3) { Q.line(g, F.x(e), F.Y0, F.x(e), F.Y1, "gd"); txt(g, F.x(e), F.Y1 + 15, "1e" + e, "s", "middle"); }
    for (let e = -12; e <= 0; e += 3) { Q.line(g, F.X0, F.y(e), F.X1, F.y(e), "gd"); txt(g, F.X0 - 4, F.y(e) + 4, "1e" + e, "s", "end"); }
    const fwd = [], cen = [];
    for (let i = 0; i <= 150; i++) {
      const e = -16 + (15.5 * i) / 150, h = Math.pow(10, e);
      const d1 = Math.abs((Math.sin(1 + h) - Math.sin(1)) / h - t), d2 = Math.abs((Math.sin(1 + h) - Math.sin(1 - h)) / (2 * h) - t);
      if (d1 > 0) fwd.push([e, Math.max(-12, Math.log10(d1))]); if (d2 > 0) cen.push([e, Math.max(-12, Math.log10(d2))]);
    }
    const P = (pts, cls) => el("path", { d: pts.map(([x, y], i) => (i ? "L" : "M") + F.x(x).toFixed(1) + " " + F.y(y).toFixed(1)).join(""), class: cls }, g);
    P(fwd, "c"); P(cen, "a");
    txt(g, F.x(-2), F.y(-1.6), "앞쪽 차분", "tc", "end"); txt(g, F.x(-2.2), F.y(-6.5), "가운데 차분", "ta", "end");
    txt(g, F.X1, F.Y1 - 6, "간격 h", "s", "end"); txt(g, F.X0 + 4, F.Y0 + 12, "오차", "s");
  });

  // 5.1 부분적분: u = ln v, v ∈ [1, b]
  Q.def("c1-byparts", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ b }) => {
      clear(g);
      const L = Math.log(b), F = Q.frame(-0.3, 6.4, -0.2, 2, 40, 500, 10, 250);
      let d1 = `M${F.x(1)} ${F.y(0)}`, d2 = `M${F.x(0)} ${F.y(0)}`;
      for (let i = 0; i <= 60; i++) { const v = 1 + ((b - 1) * i) / 60; d1 += `L${F.x(v)} ${F.y(Math.log(v))}`; d2 += `L${F.x(v)} ${F.y(Math.log(v))}`; }
      el("path", { d: d1 + `L${F.x(b)} ${F.y(0)}Z`, class: "la" }, g);
      el("path", { d: d2 + `L${F.x(0)} ${F.y(L)}Z`, class: "lc" }, g);
      Q.axes(g, F, { step: 1, xs: "v", ys: "u" });
      Q.plot(g, F, Math.log, "k", 0.6, 6.4);
      Q.line(g, F.x(0), F.y(L), F.x(b), F.y(L), "ax dsh"); Q.line(g, F.x(b), F.y(0), F.x(b), F.y(L), "ax dsh");
      txt(g, F.x((1 + b) / 2 + 0.3), F.y(L * 0.25), "∫u dv", "ta", "middle"); txt(g, F.x(Math.min(1, b / 3)), F.y(L * 0.6), "∫v du", "tc", "middle");
      const A = b * L - (b - 1);
      read.textContent = `b = ${num(b)}: 직사각형 bu = ${num(b * L, 3)}, ∫v du = e^u의 [0, ln b] 넓이 = ${num(b - 1, 3)}, 따라서 ∫ln x dx (1부터 b까지) = ${num(A, 3)}`;
    });
  });

  // 5.2 sin²x와 평균 1/2
  Q.def("c1-sin2", (fig, svg) => {
    const F = Q.frame(-0.2, 2 * PI + 0.2, -0.15, 1.2, 40, 500, 10, 200), g = el("g", {}, svg), f = (x) => Math.sin(x) ** 2;
    let d = `M${F.x(0)} ${F.y(0)}`; for (let i = 0; i <= 80; i++) { const x = (PI * i) / 80; d += `L${F.x(x)} ${F.y(f(x))}`; }
    el("path", { d: d + `L${F.x(PI)} ${F.y(0)}Z`, class: "la" }, g);
    Q.axes(g, F, { grid: false, label: false });
    piTicks(g, F, F.y(0), 1, 4);
    Q.plot(g, F, f, "a");
    Q.line(g, F.x(0), F.y(0.5), F.X1, F.y(0.5), "c dsh"); txt(g, F.x(0) - 5, F.y(0.5) + 4, "1/2", "s", "end"); txt(g, F.x(0) - 5, F.y(1) + 4, "1", "s", "end");
    txt(g, F.x(PI / 2), F.y(0.2), "넓이 π/2", "ta", "middle");
  });

  // 5.3 삼각치환: x = a sin θ
  Q.def("c1-trigsub", (fig, svg) => {
    const F = Q.frame(-1.3, 1.3, -0.15, 1.15, 120, 400, 10, 250), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ t }) => {
      clear(g);
      const th = (t * PI) / 180, x = Math.sin(th), y = Math.cos(th);
      let d = `M${F.x(-1)} ${F.y(0)}`; for (let i = 0; i <= 80; i++) { const a = PI - (PI * i) / 80; d += `L${F.x(Math.cos(a))} ${F.y(Math.sin(a))}`; }
      el("path", { d: d + "Z", class: "lk" }, g); el("path", { d, class: "k" }, g);
      Q.line(g, F.x(-1.25), F.y(0), F.x(1.25), F.y(0), "ax"); Q.line(g, F.x(0), F.y(0), F.x(0), F.y(1.12), "ax");
      el("path", { d: `M${F.x(0)} ${F.y(0)}L${F.x(x)} ${F.y(0)}L${F.x(x)} ${F.y(y)}Z`, class: "lb" }, g);
      Q.line(g, F.x(0), F.y(0), F.x(x), F.y(y), "k"); Q.line(g, F.x(x), F.y(0), F.x(x), F.y(y), "a");
      Q.line(g, F.x(0), F.y(0), F.x(x), F.y(0), "c");
      const r = 32; el("path", { d: `M${F.x(0)} ${F.y(0) - r}A${r} ${r} 0 0 ${x >= 0 ? 1 : 0} ${F.x(0) + r * Math.sin(th)} ${F.y(0) - r * Math.cos(th)}`, class: "ax" }, g);
      txt(g, F.x(0) + (x >= 0 ? 6 : -6), F.y(0) - r - 4, "θ", "i", x >= 0 ? "start" : "end");
      Q.dot(g, F.x(x), F.y(y), "fd", 5);
      txt(g, F.x(x / 2), F.y(0) + 16, "x = a sin θ", "tc", "middle");
      txt(g, F.x(x) + (x >= 0 ? 6 : -6), F.y(y / 2), "a cos θ", "ta", x >= 0 ? "start" : "end");
      txt(g, F.x(1), F.y(0) + 16, "a", "s", "middle"); txt(g, F.x(-1), F.y(0) + 16, "−a", "s", "middle");
      read.textContent = `a = 1일 때 θ = ${t}°: x = ${num(x, 3)}, √(1 − x²) = ${num(Math.sqrt(1 - x * x), 3)} = cos θ = ${num(y, 3)}`;
    });
  });


  // 1.3 역사인: 사인 그래프, 수평선 y = c, 굵은 구간 [−π/2, π/2] 안의 교점
  Q.def("c1-arcsin", (fig, svg) => {
    const F = Q.frame(-2 * PI - 0.3, 2 * PI + 0.3, -1.4, 1.4, 20, 500, 20, 220), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ c }) => {
      clear(g);
      Q.axes(g, F, { grid: false, label: false });
      piTicks(g, F, F.y(0), -4, 4);
      txt(g, F.x(0) - 5, F.y(1) + 4, "1", "s", "end"); txt(g, F.x(0) - 5, F.y(-1) + 4, "−1", "s", "end");
      Q.plot(g, F, Math.sin, "k").setAttribute("style", "opacity:.45");
      el("rect", { x: F.x(-PI / 2), y: F.Y0, width: F.x(PI / 2) - F.x(-PI / 2), height: F.Y1 - F.Y0, class: "lk" }, g).parentNode.insertBefore(g.lastChild, g.firstChild);
      Q.plot(g, F, Math.sin, "a", -PI / 2, PI / 2);
      Q.line(g, F.X0, F.y(c), F.X1, F.y(c), "c");
      txt(g, F.X1 - 4, F.y(c) - 6, "y = c", "tc", "end");
      const s = Math.asin(c), xs = [];
      for (let k = -2; k <= 2; k++) { xs.push(s + 2 * k * PI, PI - s + 2 * k * PI); }
      xs.filter((x) => x >= F.x0 && x <= F.x1).forEach((x) => Q.dot(g, F.x(x), F.y(c), "fk", 3));
      Q.line(g, F.x(s), F.y(c), F.x(s), F.y(0), "a dsh");
      Q.dot(g, F.x(s), F.y(c), "fd", 6);
      read.textContent = `c = ${num(c)}: 교점은 여러 개지만 [−π/2, π/2] 안의 것은 x = ${num(s, 3)} 하나이다. 따라서 arcsin ${num(c)} = ${num(s, 3)}.`;
    });
  });

  // 1.3 y = x² (x ≥ 0)와 y = √x
  Q.def("c1-sqrtinv", (fig, svg) => {
    const F = Q.frame(-0.3, 3.2, -0.3, 3.2, 140, 380, 10, 250), g = el("g", {}, svg);
    Q.axes(g, F, { step: 1 });
    Q.line(g, F.x(-0.3), F.y(-0.3), F.x(3.2), F.y(3.2), "k dsh");
    Q.plot(g, F, (x) => x * x, "a", 0, Math.sqrt(3.2));
    Q.plot(g, F, Math.sqrt, "b", 0, 3.2);
    Q.line(g, F.x(1.5), F.y(2.25), F.x(2.25), F.y(1.5), "ax dsh");
    Q.dot(g, F.x(1.5), F.y(2.25), "fa"); Q.dot(g, F.x(2.25), F.y(1.5), "fb");
    txt(g, F.x(1.5) - 8, F.y(2.25), "(1.5, 2.25)", "s", "end");
    txt(g, F.x(2.25) + 8, F.y(1.5) + 14, "(2.25, 1.5)", "s");
    txt(g, F.x(1.75) + 6, F.y(3.06), "y = x²", "ta"); txt(g, F.x(3.2), F.y(1.79) + 18, "y = √x", "tb", "end");
    txt(g, F.x(3.15), F.y(3.15) + 16, "y = x", "s", "end");
  });

  // 1.4 밑 a와 (0, 1)에서의 접선
  Q.def("c1-ebase", (fig, svg) => {
    const F = Q.frame(-2.2, 2.2, -0.6, 5, 30, 500, 10, 250), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ a }) => {
      clear(g);
      Q.axes(g, F, { step: 1 });
      Q.plot(g, F, (x) => x + 1, "k dsh");
      const m = Math.log(a);
      Q.plot(g, F, (x) => Math.pow(a, x), "a");
      Q.plot(g, F, (x) => 1 + m * x, Math.abs(m - 1) < 0.01 ? "d" : "b");
      Q.dot(g, F.x(0), F.y(1), "fk");
      txt(g, F.x(1.25), F.y(Math.min(4.7, Math.pow(a, 1.25))) - 8, "y = aˣ", "ta", "end");
      txt(g, F.x(-2.1), F.y(-0.1) + 14, "점선 y = x + 1 (기울기 1)", "s");
      read.textContent = `a = ${num(a)}이면 (0, 1)에서의 접선 기울기는 ${num(m, 3)}이다.` + (Math.abs(m - 1) < 0.01 ? " 기울기가 1이 되었다. 이 밑이 e ≈ 2.718이다." : m < 1 ? " 1보다 작으니 밑을 키워 보자." : " 1보다 크니 밑을 줄여 보자.");
    });
  });

  // 1.4 쌍곡선 함수
  Q.def("c1-hyper", (fig, svg) => {
    const F = Q.frame(-3, 3, -3.2, 4.2, 30, 500, 10, 250), g = el("g", {}, svg);
    Q.axes(g, F, { step: 1 });
    Q.plot(g, F, (x) => Math.exp(x) / 2, "k dsh");
    Q.plot(g, F, Math.cosh, "a"); Q.plot(g, F, Math.sinh, "b"); Q.plot(g, F, Math.tanh, "c");
    Q.line(g, F.X0, F.y(1), F.X1, F.y(1), "gd"); Q.line(g, F.X0, F.y(-1), F.X1, F.y(-1), "gd");
    txt(g, F.x(-2.2), F.y(Math.cosh(-2.2)) - 6, "cosh x", "ta", "middle");
    txt(g, F.x(-1.6), F.y(Math.sinh(-1.6)) + 18, "sinh x", "tb", "end");
    txt(g, F.x(2.9), F.y(1) + 16, "tanh x", "tc", "end");
    txt(g, F.x(1.25), F.y(Math.exp(1.25) / 2) - 12, "eˣ/2", "s", "end");
  });

  // 5.4 부분분수: (5x − 4)/(x² − x − 2) = 2/(x − 2) + 3/(x + 1)
  Q.def("c1-partfrac", (fig, svg) => {
    const F = Q.frame(-4, 5, -8, 8, 40, 500, 10, 250), g = el("g", {}, svg);
    Q.axes(g, F, { step: 1, every: 2, lstep: 2 });
    Q.line(g, F.x(2), F.Y0, F.x(2), F.Y1, "ax dsh"); Q.line(g, F.x(-1), F.Y0, F.x(-1), F.Y1, "ax dsh");
    const seg = (fn, cls) => { Q.plot(g, F, fn, cls, -4, -1.02, 300); Q.plot(g, F, fn, cls, -0.98, 1.98, 300); Q.plot(g, F, fn, cls, 2.02, 5, 300); };
    seg((x) => 2 / (x - 2), "b dsh"); seg((x) => 3 / (x + 1), "c dsh");
    seg((x) => (5 * x - 4) / (x * x - x - 2), "a");
    txt(g, F.x(4.9), F.y(2 / 2.9) - 8, "2/(x − 2)", "tb", "end"); txt(g, F.x(-3.9), F.y(3 / -2.9) + 18, "3/(x + 1)", "tc");
  });

  // 5.5 이상적분: 1/x²과 1/x, [1, t]
  Q.def("c1-improper", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ t }) => {
      clear(g);
      const F = Q.frame(0, t * 1.08 + 0.5, -0.05, 1.15, 40, 500, 10, 230);
      const fill = (fn, cls) => { let d = `M${F.x(1)} ${F.y(0)}`; for (let i = 0; i <= 120; i++) { const x = 1 + ((t - 1) * i) / 120; d += `L${F.x(x)} ${F.y(fn(x))}`; } el("path", { d: d + `L${F.x(t)} ${F.y(0)}Z`, class: cls }, g); };
      fill((x) => 1 / x, "lc"); fill((x) => 1 / (x * x), "la");
      Q.axes(g, F, { grid: false, label: false });
      Q.plot(g, F, (x) => 1 / x, "c", 0.87, F.x1); Q.plot(g, F, (x) => 1 / (x * x), "a", 0.93, F.x1);
      [1, t].forEach((v) => txt(g, F.x(v), F.y(0) + 15, num(v), "s", "middle"));
      txt(g, F.x(0) - 4, F.y(1) + 4, "1", "s", "end");
      read.textContent = `1부터 ${num(t)}까지: ∫1/x² dx = 1 − 1/t = ${num(1 - 1 / t, 4)}, ∫1/x dx = ln t = ${num(Math.log(t), 4)}`;
    });
  });

  // 5.6 사다리꼴과 심프슨: 1/x on [1, 2]
  Q.def("c1-simpson", (fig, svg) => {
    const f = (x) => 1 / x, F = Q.frame(0.85, 2.1, 0.35, 1.08, 40, 500, 10, 230), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ n, m }) => {
      clear(g);
      const h = 1 / n, X = (i) => 1 + i * h;
      let d = `M${F.x(1)} ${F.y(0.35)}`;
      if (m) {
        for (let k = 0; k < n; k += 2) {
          const x0 = X(k), x1 = X(k + 1), x2 = X(k + 2), y0 = f(x0), y1 = f(x1), y2 = f(x2);
          for (let j = 0; j <= 20; j++) { const x = x0 + (2 * h * j) / 20, L = ((x - x1) * (x - x2)) / ((x0 - x1) * (x0 - x2)) * y0 + ((x - x0) * (x - x2)) / ((x1 - x0) * (x1 - x2)) * y1 + ((x - x0) * (x - x1)) / ((x2 - x0) * (x2 - x1)) * y2; d += `L${F.x(x)} ${F.y(L)}`; }
        }
      } else for (let i = 0; i <= n; i++) d += `L${F.x(X(i))} ${F.y(f(X(i)))}`;
      el("path", { d: d + `L${F.x(2)} ${F.y(0.35)}Z`, class: m ? "lb" : "lc", style: "stroke:var(--" + (m ? "fb" : "fc") + ");stroke-width:1" }, g);
      for (let i = 0; i <= n; i++) { Q.line(g, F.x(X(i)), F.y(0.35), F.x(X(i)), F.y(f(X(i))), "gd"); Q.dot(g, F.x(X(i)), F.y(f(X(i))), "fk", 3); }
      Q.plot(g, F, f, "k", 0.9, 2.08);
      Q.line(g, F.X0, F.y(0.35), F.X1, F.y(0.35), "ax");
      [1, 1.5, 2].forEach((v) => txt(g, F.x(v), F.y(0.35) + 15, num(v), "s", "middle"));
      let S = 0;
      if (m) for (let i = 0; i <= n; i++) S += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * f(X(i)), S *= 1;
      else for (let i = 0; i <= n; i++) S += (i === 0 || i === n ? 1 : 2) * f(X(i));
      S *= m ? h / 3 : h / 2;
      read.textContent = `${m ? "심프슨" : "사다리꼴"} n = ${n}: ${num(S, 6)}, 참값 ln 2 = 0.693147과의 오차 ${(S - Math.LN2).toExponential(2)}`;
    });
  });

  // 비스듬히 본 원(타원): 중심 (X, Y), 가로 반지름 rx, 세로 반지름 ry
  const ellipse = (g, X, Y, rx, ry, cls) => el("ellipse", { cx: X, cy: Y, rx: Math.max(0.5, rx), ry: Math.max(0.5, ry), class: cls }, g);

  // 6.1 와셔: y = √x와 y = x 사이, x축 회전
  Q.def("c1-washer", (fig, svg) => {
    const F = Q.frame(-0.05, 1.1, -1.1, 1.1, 30, 270, 10, 240), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ x }) => {
      clear(g);
      let d = ""; for (let i = 0; i <= 50; i++) { const t = i / 50; d += (i ? "L" : "M") + F.x(t) + " " + F.y(Math.sqrt(t)); } for (let i = 50; i >= 0; i--) { const t = i / 50; d += "L" + F.x(t) + " " + F.y(t); }
      el("path", { d: d + "Z", class: "la" }, g);
      let m = ""; for (let i = 0; i <= 50; i++) { const t = i / 50; m += (i ? "L" : "M") + F.x(t) + " " + F.y(-Math.sqrt(t)); } for (let i = 50; i >= 0; i--) { const t = i / 50; m += "L" + F.x(t) + " " + F.y(-t); }
      el("path", { d: m + "Z", class: "lk" }, g);
      Q.axes(g, F, { grid: false, label: false });
      Q.plot(g, F, Math.sqrt, "a", 0, 1.05); Q.plot(g, F, (t) => t, "c", 0, 1.05);
      Q.line(g, F.x(x), F.y(-Math.sqrt(x)), F.x(x), F.y(Math.sqrt(x)), "d");
      txt(g, F.x(1.02), F.y(1) - 4, "y = √x", "ta", "end"); txt(g, F.x(1.05), F.y(0.86) + 14, "y = x", "tc", "end");
      const C = 395, Y0 = 125, s = 100;
      el("circle", { cx: C, cy: Y0, r: s * Math.sqrt(x), class: "la", style: "stroke:var(--fa);stroke-width:2" }, g);
      el("circle", { cx: C, cy: Y0, r: s * x, class: "k", style: "fill:var(--card)" }, g);
      Q.dot(g, C, Y0, "fk", 2.5);
      txt(g, C, Y0 + s * Math.sqrt(x) + 16, "단면 (와셔)", "s", "middle");
      read.textContent = `x = ${num(x)}: 바깥 반지름 √x = ${num(Math.sqrt(x), 3)}, 안쪽 반지름 x = ${num(x)}, 넓이 π(x − x²) = ${num(PI * (x - x * x), 3)}`;
    });
  });

  // 6.2 원통 껍질: y = 2x² − x³, y축 회전
  Q.def("c1-shell", (fig, svg) => {
    const f = (x) => 2 * x * x - x ** 3, F = Q.frame(-2.2, 2.2, -0.15, 1.45, 20, 290, 20, 240), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ x }) => {
      clear(g);
      const h = f(x), dx = 0.08;
      Q.plot(g, F, f, "k", 0, 2); Q.plot(g, F, (t) => f(-t), "k dsh", -2, 0);
      Q.line(g, F.x(-2.2), F.y(0), F.x(2.2), F.y(0), "ax"); Q.line(g, F.x(0), F.y(-0.1), F.x(0), F.y(1.4), "ax");
      ellipse(g, F.x(0), F.y(0), F.x(x) - F.x(0), 9, "b"); ellipse(g, F.x(0), F.y(h), F.x(x) - F.x(0), 9, "b");
      Q.line(g, F.x(-x), F.y(0), F.x(-x), F.y(h), "b"); Q.line(g, F.x(x), F.y(0), F.x(x), F.y(h), "b");
      el("rect", { x: F.x(x), y: F.y(h), width: F.x(x + dx) - F.x(x), height: F.y(0) - F.y(h), class: "lc", style: "stroke:var(--fc)" }, g);
      txt(g, F.x(0) + 4, F.Y0 + 6, "y", "i");
      const W = 2 * PI * x, X0 = 315, k = 18;
      el("rect", { x: X0, y: F.y(h), width: W * k, height: F.y(0) - F.y(h), class: "lb", style: "stroke:var(--fb)" }, g);
      txt(g, X0 + (W * k) / 2, F.y(0) + 16, "2πx = " + num(W, 2), "tb", "middle");
      txt(g, X0 - 4, (F.y(h) + F.y(0)) / 2, "f(x)", "s", "end");
      txt(g, X0, F.Y0 + 6, "펼친 껍질", "s");
      read.textContent = `x = ${num(x)}: 반지름 ${num(x)}, 높이 f(x) = ${num(h, 3)}, 껍질 부피 ≈ 2πx·f(x)·dx = ${num(W * h, 3)}·dx`;
    });
  });

  // 6.3 곡선의 길이: y = x^(3/2)를 n개 선분으로
  Q.def("c1-arclen", (fig, svg) => {
    const f = (x) => Math.pow(x, 1.5), F = Q.frame(-0.08, 1.1, -0.08, 1.1, 120, 400, 10, 250), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const L = (13 * Math.sqrt(13) - 8) / 27;
    Q.bind(fig, ({ n }) => {
      clear(g);
      Q.axes(g, F, { step: 0.5 });
      Q.plot(g, F, f, "k", 0, 1.05);
      let d = "", s = 0;
      for (let i = 0; i <= n; i++) { const x = i / n; d += (i ? "L" : "M") + F.x(x) + " " + F.y(f(x)); if (i) s += Math.hypot(1 / n, f(x) - f((i - 1) / n)); }
      el("path", { d, class: "c" }, g);
      for (let i = 0; i <= n; i++) Q.dot(g, F.x(i / n), F.y(f(i / n)), "fc", n > 15 ? 2 : 3.5);
      read.textContent = `선분 ${n}개: 꺾은선 길이 ${num(s, 4)}, 곡선 길이 ${num(L, 4)}, 차이 ${num(L - s, 4)}`;
    });
  });

  // 6.4 겉넓이의 띠: y = 0.4 + 0.25x², x축 회전
  Q.def("c1-band", (fig, svg) => {
    const f = (x) => 0.4 + 0.25 * x * x, fp = (x) => 0.5 * x, F = Q.frame(-0.2, 3, -2.6, 2.6, 30, 330, 10, 250), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ x }) => {
      clear(g);
      Q.line(g, F.X0, F.y(0), F.X1, F.y(0), "ax");
      Q.plot(g, F, f, "k", 0, 2.8); Q.plot(g, F, (t) => -f(t), "k dsh", 0, 2.8);
      [0, 0.7, 1.4, 2.1, 2.8].forEach((t) => ellipse(g, F.x(t), F.y(0), 4 + 6 * fp(t), F.y(0) - F.y(f(t)), "gd"));
      const dx = 0.18, x2 = x + dx;
      el("path", { d: `M${F.x(x)} ${F.y(f(x))}L${F.x(x2)} ${F.y(f(x2))}L${F.x(x2)} ${F.y(-f(x2))}L${F.x(x)} ${F.y(-f(x))}Z`, class: "lc" }, g);
      Q.line(g, F.x(x), F.y(f(x)), F.x(x2), F.y(f(x2)), "c");
      const y = f(x + dx / 2), ds = Math.sqrt(1 + fp(x + dx / 2) ** 2);
      const W = 2 * PI * y, X0 = 360, k = 9, H = 40 * ds;
      el("rect", { x: X0, y: 125 - H / 2, width: Math.min(150, W * k), height: H, class: "lc", style: "stroke:var(--fc)" }, g);
      txt(g, X0 + Math.min(150, W * k) / 2, 125 + H / 2 + 16, "2πy = " + num(W, 2), "tc", "middle");
      txt(g, X0 - 4, 129, "ds", "s", "end"); txt(g, X0, 30, "펼친 띠", "s");
      read.textContent = `x = ${num(x)}: 반지름 y = ${num(y, 3)}, ds/dx = √(1 + y′²) = ${num(ds, 3)}`;
    });
  });

  // 7.1 사이클로이드: 구르는 바퀴 (r = 1)
  Q.def("c1-cycloid", (fig, svg) => {
    const F = Q.frame(-0.5, 13.2, -0.3, 2.6, 15, 505, 10, 210), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const P = (t) => [t - Math.sin(t), 1 - Math.cos(t)];
    Q.bind(fig, ({ t }) => {
      clear(g);
      Q.line(g, F.X0, F.y(0), F.X1, F.y(0), "ax");
      let d = ""; for (let i = 0; i <= 200; i++) { const s = (4 * PI * i) / 200, [x, y] = P(s); d += (i ? "L" : "M") + F.x(x) + " " + F.y(y); }
      el("path", { d, class: "gd" }, g);
      let tr = ""; for (let i = 0; i <= 120; i++) { const s = (t * i) / 120, [x, y] = P(s); tr += (i ? "L" : "M") + F.x(x) + " " + F.y(y); }
      el("path", { d: tr, class: "a" }, g);
      const R = F.x(1) - F.x(0);
      el("circle", { cx: F.x(t), cy: F.y(1), r: R, class: "k" }, g);
      const [px, py] = P(t);
      Q.line(g, F.x(t), F.y(1), F.x(px), F.y(py), "ax"); Q.dot(g, F.x(t), F.y(1), "fk", 2.5);
      Q.dot(g, F.x(px), F.y(py), "fd", 5);
      const dx = 1 - Math.cos(t), dy = Math.sin(t);
      if (dx > 1e-3) { const m = dy / dx, L = 0.9 / Math.hypot(1, m); Q.line(g, F.x(px - L), F.y(py - m * L), F.x(px + L), F.y(py + m * L), "c"); }
      read.textContent = `θ = ${num(t)}: 점 (${num(px, 3)}, ${num(py, 3)}), dx/dθ = ${num(dx, 3)}, dy/dθ = ${num(dy, 3)}` + (dx > 1e-3 ? `, 기울기 ${num(dy / dx, 3)}` : ", 첨점");
    });
  });

  // 7.2 사이클로이드 아치 아래 넓이 = 바퀴 세 개
  Q.def("c1-cycarea", (fig, svg) => {
    const F = Q.frame(-0.3, 2 * PI + 0.3, -0.2, 2.3, 50, 470, 10, 190), g = el("g", {}, svg);
    let d = `M${F.x(0)} ${F.y(0)}`; for (let i = 0; i <= 120; i++) { const s = (2 * PI * i) / 120; d += `L${F.x(s - Math.sin(s))} ${F.y(1 - Math.cos(s))}`; }
    el("path", { d: d + "Z", class: "la" }, g); el("path", { d, class: "a" }, g);
    Q.line(g, F.X0, F.y(0), F.X1, F.y(0), "ax");
    const R = F.x(1) - F.x(0);
    [PI - 2, PI, PI + 2].forEach((cx, i) => el("circle", { cx: F.x(cx), cy: F.y(0.5) + (i === 1 ? -R * 0.4 : 0), r: R * 0.5, class: "lc", style: "stroke:var(--fc)" }, g));
    txt(g, F.x(PI), F.y(2) - 8, "넓이 3πr² · 길이 8r", "ta", "middle");
    txt(g, F.x(0), F.y(0) + 15, "0", "s", "middle"); txt(g, F.x(2 * PI), F.y(0) + 15, "2πr", "s", "middle");
  });

  // 7.3 극곡선 그리기
  Q.def("c1-polar", (fig, svg) => {
    const F = Q.frame(-2.3, 2.3, -1.7, 2.3, 120, 400, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const C = [(t) => 1 + Math.cos(t), (t) => Math.cos(2 * t), (t) => 2 * Math.sin(t)], N = ["r = 1 + cos θ", "r = cos 2θ", "r = 2 sin θ"];
    Q.bind(fig, ({ c, t }) => {
      clear(g);
      [0.5, 1, 1.5, 2].forEach((r) => el("circle", { cx: F.x(0), cy: F.y(0), r: F.x(r) - F.x(0), class: "gd" }, g));
      Q.line(g, F.X0, F.y(0), F.X1, F.y(0), "ax"); Q.line(g, F.x(0), F.Y0, F.x(0), F.Y1, "ax");
      const f = C[c];
      let full = "", tr = ""; for (let i = 0; i <= 300; i++) { const s = (2 * PI * i) / 300, r = f(s); full += (i ? "L" : "M") + F.x(r * Math.cos(s)) + " " + F.y(r * Math.sin(s)); }
      for (let i = 0; i <= 200; i++) { const s = (t * i) / 200, r = f(s); tr += (i ? "L" : "M") + F.x(r * Math.cos(s)) + " " + F.y(r * Math.sin(s)); }
      el("path", { d: full, class: "gd", style: "stroke-width:1.5" }, g); el("path", { d: tr, class: "a" }, g);
      const r = f(t), px = r * Math.cos(t), py = r * Math.sin(t);
      Q.line(g, F.x(0), F.y(0), F.x(2.2 * Math.cos(t)), F.y(2.2 * Math.sin(t)), "ax dsh");
      Q.line(g, F.x(0), F.y(0), F.x(px), F.y(py), r >= 0 ? "b" : "d");
      Q.dot(g, F.x(px), F.y(py), "fd", 5);
      read.textContent = `${N[c]}: θ = ${num(t)}에서 r = ${num(r, 3)}` + (r < 0 ? " (음수라서 반대 방향에 찍힌다)" : "");
    });
  });

  // 7.4 심장형을 부채꼴로
  Q.def("c1-sectors", (fig, svg) => {
    const F = Q.frame(-0.6, 2.2, -1.4, 1.4, 130, 390, 10, 250), g = el("g", {}, svg), read = fig.querySelector(".q-read"), f = (t) => 1 + Math.cos(t);
    Q.bind(fig, ({ n }) => {
      clear(g);
      let S = 0; const dt = (2 * PI) / n;
      for (let k = 0; k < n; k++) {
        const a = k * dt, r = f(a + dt / 2); S += 0.5 * r * r * dt;
        el("path", { d: `M${F.x(0)} ${F.y(0)}L${F.x(r * Math.cos(a))} ${F.y(r * Math.sin(a))}A${F.x(r) - F.x(0)} ${F.x(r) - F.x(0)} 0 0 0 ${F.x(r * Math.cos(a + dt))} ${F.y(r * Math.sin(a + dt))}Z`, class: "la", style: "stroke:var(--fa);stroke-width:0.6" }, g);
      }
      Q.line(g, F.X0, F.y(0), F.X1, F.y(0), "ax"); Q.line(g, F.x(0), F.Y0, F.x(0), F.Y1, "ax");
      let d = ""; for (let i = 0; i <= 300; i++) { const s = (2 * PI * i) / 300, r = f(s); d += (i ? "L" : "M") + F.x(r * Math.cos(s)) + " " + F.y(r * Math.sin(s)); }
      el("path", { d, class: "k" }, g);
      read.textContent = `부채꼴 ${n}개의 넓이 합 ${num(S, 4)}, 3π/2 = ${num(1.5 * PI, 4)}`;
    });
  });

  // 7.5 타원과 쌍곡선의 초점 거리
  Q.def("c1-conic", (fig, svg) => {
    const F = Q.frame(-5.2, 5.2, -3.1, 3.1, 30, 490, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ k, t }) => {
      clear(g);
      Q.axes(g, F, { step: 1, every: 2, lstep: 2 });
      let a, b, c, P, d = "";
      if (!k) {
        a = 3; b = 2; c = Math.sqrt(5);
        for (let i = 0; i <= 120; i++) { const s = (2 * PI * i) / 120; d += (i ? "L" : "M") + F.x(a * Math.cos(s)) + " " + F.y(b * Math.sin(s)); }
        P = [a * Math.cos(t), b * Math.sin(t)];
      } else {
        a = 2; b = 1.5; c = 2.5;
        for (const sg of [1, -1]) for (let i = 0; i <= 80; i++) { const s = -2 + (4 * i) / 80; d += (i ? "L" : "M") + F.x(sg * a * Math.cosh(s)) + " " + F.y(b * Math.sinh(s)); }
        Q.plot(g, F, (x) => (b / a) * x, "ax dsh"); Q.plot(g, F, (x) => (-b / a) * x, "ax dsh");
        const s = t * 0.65; P = [a * Math.cosh(s), b * Math.sinh(s)];
      }
      el("path", { d, class: "k" }, g);
      Q.line(g, F.x(-c), F.y(0), F.x(P[0]), F.y(P[1]), "b"); Q.line(g, F.x(c), F.y(0), F.x(P[0]), F.y(P[1]), "c");
      Q.dot(g, F.x(-c), F.y(0), "fb", 5); Q.dot(g, F.x(c), F.y(0), "fc", 5); Q.dot(g, F.x(P[0]), F.y(P[1]), "fd", 5);
      txt(g, F.x(-c), F.y(0) + 18, "F₁", "tb", "middle"); txt(g, F.x(c), F.y(0) + 18, "F₂", "tc", "middle");
      const d1 = Math.hypot(P[0] + c, P[1]), d2 = Math.hypot(P[0] - c, P[1]);
      read.textContent = k ? `PF₁ = ${num(d1, 3)}, PF₂ = ${num(d2, 3)}, 차 = ${num(d1 - d2, 3)} (= 2a = 4)` : `PF₁ = ${num(d1, 3)}, PF₂ = ${num(d2, 3)}, 합 = ${num(d1 + d2, 3)} (= 2a = 6)`;
    });
  });

  // 8.1 거미줄 그림: a(n+1) = √(2 + a(n))
  Q.def("c1-cobweb", (fig, svg) => {
    const f = (x) => Math.sqrt(2 + x), F = Q.frame(-0.1, 2.6, -0.1, 2.6, 130, 390, 10, 250), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ n }) => {
      clear(g);
      Q.axes(g, F, { step: 0.5 });
      Q.plot(g, F, (x) => x, "ax dsh"); Q.plot(g, F, f, "a", -0.1, 2.6);
      let a = Math.SQRT2, d = `M${F.x(a)} ${F.y(0)}L${F.x(a)} ${F.y(f(a))}`; const seq = [a];
      for (let i = 1; i < n; i++) { const b = f(a); d += `L${F.x(b)} ${F.y(b)}L${F.x(b)} ${F.y(f(b))}`; a = b; seq.push(a); }
      el("path", { d, class: "c" }, g);
      seq.forEach((v) => Q.dot(g, F.x(v), F.y(0), "fc", 3));
      Q.dot(g, F.x(2), F.y(2), "fd", 4);
      txt(g, F.x(2.55), F.y(f(2.55)) - 8, "y = √(2 + x)", "ta", "end"); txt(g, F.x(2.5), F.y(2.5) + 16, "y = x", "s", "end");
      read.textContent = seq.map((v, i) => `a${i + 1} = ${num(v, 4)}`).join(", ");
    });
  });

  // 8.2 등비급수의 부분합
  Q.def("c1-geom", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ r }) => {
      clear(g);
      const N = 20, S = []; let s = 0, t = 1;
      for (let i = 0; i < N; i++) { s += t; t *= r; S.push(s); }
      const lim = Math.abs(r) < 1 ? 1 / (1 - r) : null, top = Math.max(2.2, Math.min(25, Math.max(...S) * 1.1)), bot = Math.min(0, ...S);
      const F = Q.frame(0, N + 1, bot, top, 40, 500, 10, 220);
      Q.axes(g, F, { grid: false, label: false });
      [0, top / 2, top].forEach((v) => txt(g, F.x(0) - 4, F.y(v) + 4, num(v, 1), "s", "end"));
      S.forEach((v, i) => el("rect", { x: F.x(i + 0.6), y: F.y(Math.max(0, Math.min(v, top))), width: F.x(0.8) - F.x(0), height: Math.abs(F.y(Math.min(v, top)) - F.y(0)), class: "la", style: "stroke:var(--fa);stroke-width:0.6" }, g));
      if (lim !== null && lim <= top) { Q.line(g, F.X0, F.y(lim), F.X1, F.y(lim), "d dsh"); txt(g, F.X1 - 4, F.y(lim) - 6, "1/(1 − r) = " + num(lim, 3), "td", "end"); }
      read.textContent = lim !== null ? `r = ${num(r)}: s₂₀ = ${num(S[N - 1], 4)}, 합 1/(1 − r) = ${num(lim, 4)}` : `r = ${num(r)}: |r| ≥ 1이라 부분합이 한 값으로 모이지 않는다. s₂₀ = ${num(S[N - 1], 3)}`;
    });
  });

  // 8.3 적분 판정법: 1/n^p 직사각형과 곡선
  Q.def("c1-inttest", (fig, svg) => {
    const F = Q.frame(0.5, 11, -0.05, 1.1, 40, 500, 10, 230), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ p }) => {
      clear(g);
      // 직사각형 n은 [n−1, n]에 둔다: n ≥ 2이면 곡선 아래
      for (let n = 1; n <= 10; n++) { const h = Math.pow(n, -p); el("rect", { x: F.x(n - 1), y: F.y(h), width: F.x(1) - F.x(0), height: F.y(0) - F.y(h), class: n === 1 ? "lk" : "la", style: "stroke:var(--fa);stroke-width:0.7" }, g); }
      Q.axes(g, F, { grid: false, label: false });
      [1, 2, 5, 10].forEach((v) => txt(g, F.x(v), F.y(0) + 15, num(v), "s", "middle"));
      Q.plot(g, F, (x) => Math.pow(x, -p), "c", 0.95, 11);
      let s = 0; for (let n = 1; n <= 1000; n++) s += Math.pow(n, -p);
      const I = Math.abs(p - 1) < 1e-9 ? Math.log(1000) : (Math.pow(1000, 1 - p) - 1) / (1 - p);
      read.textContent = `p = ${num(p)}: 1000항까지의 합 ${num(s, 3)}, ∫₁^1000 x^(−p) dx = ${num(I, 3)}. ` + (p > 1 ? `p > 1이라 수렴 (적분 → ${num(1 / (p - 1), 3)})` : "p ≤ 1이라 발산");
    });
  });

  // 8.4 교대급수의 부분합
  Q.def("c1-alt", (fig, svg) => {
    const F = Q.frame(0, 41, 0.45, 1.05, 40, 500, 10, 230), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ n }) => {
      clear(g);
      Q.line(g, F.X0, F.y(Math.LN2), F.X1, F.y(Math.LN2), "d dsh"); txt(g, F.X1 - 4, F.y(Math.LN2) - 6, "ln 2", "td", "end");
      Q.line(g, F.X0, F.Y1, F.X1, F.Y1, "ax"); Q.line(g, F.X0, F.Y0, F.X0, F.Y1, "ax");
      [0.5, 0.75, 1].forEach((v) => txt(g, F.X0 - 4, F.y(v) + 4, num(v), "s", "end"));
      let s = 0, d = "";
      for (let k = 1; k <= n; k++) { s += (k % 2 ? 1 : -1) / k; d += (k > 1 ? "L" : "M") + F.x(k) + " " + F.y(s); }
      el("path", { d, class: "a" }, g);
      s = 0; for (let k = 1; k <= n; k++) { s += (k % 2 ? 1 : -1) / k; Q.dot(g, F.x(k), F.y(s), k % 2 ? "fa" : "fc", 3); }
      read.textContent = `s${n} = ${num(s, 4)}, ln 2와의 차이 ${num(Math.abs(s - Math.LN2), 4)} ≤ 다음 항 1/${n + 1} = ${num(1 / (n + 1), 4)}`;
    });
  });

  // 8.5 이웃한 항의 비
  Q.def("c1-ratio", (fig, svg) => {
    const F = Q.frame(0, 21, 0, 2.2, 40, 500, 10, 220), g = el("g", {}, svg);
    Q.axes(g, F, { grid: false, label: false });
    [5, 10, 15, 20].forEach((v) => txt(g, F.x(v), F.y(0) + 15, num(v), "s", "middle"));
    [0.5, 1, 1.5, 2].forEach((v) => txt(g, F.X0 - 4, F.y(v) + 4, num(v), "s", "end"));
    Q.line(g, F.X0, F.y(1), F.X1, F.y(1), "ax dsh"); Q.line(g, F.X0, F.y(1 / 3), F.X1, F.y(1 / 3), "gd");
    const S = [[(n) => Math.pow(1 + 1 / n, 3) / 3, "fa", "a"], [(n) => (n + 1) / 2, "fd", "d"], [(n) => (n / (n + 1)) ** 2, "fb", "b"]];
    S.forEach(([r, fc]) => { for (let n = 1; n <= 20; n++) { const v = r(n); if (v <= 2.2) Q.dot(g, F.x(n), F.y(v), fc, 3.2); } });
    txt(g, F.x(20), F.y(1 / 3) - 6, "n³/3ⁿ → 1/3", "ta", "end"); txt(g, F.x(4.2), F.y(2.05), "n!/2ⁿ → ∞", "td"); txt(g, F.x(20), F.y(0.95) - 2, "1/n² → 1", "tb", "end");
  });

  // 8.6 1 + x + … + x^N과 1/(1 − x)
  Q.def("c1-powser", (fig, svg) => {
    const F = Q.frame(-1.6, 1.15, -3, 10.5, 40, 500, 10, 240), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ n }) => {
      clear(g);
      el("rect", { x: F.x(-1), y: F.Y0, width: F.x(1) - F.x(-1), height: F.Y1 - F.Y0, class: "lk" }, g);
      Q.axes(g, F, { step: 1, every: 2, lstep: 2, grid: false });
      Q.plot(g, F, (x) => 1 / (1 - x), "k dsh", -1.6, 0.995);
      const S = (x) => { let s = 0, t = 1; for (let k = 0; k <= n; k++) { s += t; t *= x; } return s; };
      Q.plot(g, F, S, "a", -1.6, 1.15, 500);
      read.textContent = `N = ${n}: x = 0.5에서 ${num(S(0.5), 4)} (참값 2), x = 0.9에서 ${num(S(0.9), 3)} (참값 10), x = −1.2에서 ${num(S(-1.2), 2)} (1/(1 − x) = ${num(1 / 2.2, 3)})`;
    });
  });

  // 8.7 arctan x의 급수
  Q.def("c1-arctanser", (fig, svg) => {
    const F = Q.frame(-1.8, 1.8, -1.6, 1.6, 40, 500, 10, 240), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ n }) => {
      clear(g);
      el("rect", { x: F.x(-1), y: F.Y0, width: F.x(1) - F.x(-1), height: F.Y1 - F.Y0, class: "lk" }, g);
      Q.axes(g, F, { step: 0.5, grid: false });
      Q.plot(g, F, Math.atan, "k dsh");
      const T = (x) => { let s = 0; for (let k = 1; k <= n; k += 2) s += (((k - 1) / 2) % 2 ? -1 : 1) * Math.pow(x, k) / k; return s; };
      Q.plot(g, F, T, "a", -1.8, 1.8, 400);
      read.textContent = `${n}차까지: x = 1에서 ${num(T(1), 5)}, arctan 1 = π/4 = ${num(PI / 4, 5)}, 차이 ${num(Math.abs(T(1) - PI / 4), 5)}`;
    });
  });

  // 8.8 테일러 다항식
  Q.def("c1-taylor", (fig, svg) => {
    const F = Q.frame(-6.5, 6.5, -3, 3, 30, 500, 10, 250), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const fs = [Math.sin, Math.exp, (x) => (x > -1 ? Math.log(1 + x) : NaN)];
    const coef = [(k) => (k % 2 ? ((k - 1) / 2 % 2 ? -1 : 1) : 0), () => 1, (k) => (k === 0 ? 0 : (k % 2 ? 1 : -1) * 0)];
    const fact = (k) => { let p = 1; for (let i = 2; i <= k; i++) p *= i; return p; };
    Q.bind(fig, ({ f, n }) => {
      clear(g);
      Q.axes(g, F, { step: 1, every: 2, lstep: 2, grid: false });
      Q.plot(g, F, fs[f], "k dsh", f === 2 ? -0.99 : -6.5, 6.5, 400);
      const T = (x) => { let s = 0; for (let k = 0; k <= n; k++) { if (f === 2) { if (k) s += ((k % 2 ? 1 : -1) * Math.pow(x, k)) / k; } else s += (coef[f](k) * Math.pow(x, k)) / fact(k); } return s; };
      Q.plot(g, F, T, "a", -6.5, 6.5, 500);
      const x0 = f === 2 ? 0.5 : 1;
      read.textContent = `T${n}(${x0}) = ${num(T(x0), 6)}, 함숫값 ${num(fs[f](x0), 6)}, 차이 ${Math.abs(T(x0) - fs[f](x0)).toExponential(1)}`;
    });
  });

  // 8.8 오일러 공식: 단위원 위의 e^{iθ}
  Q.def("c1-euler", (fig, svg) => {
    const F = Q.frame(-1.6, 1.6, -1.25, 1.25, 120, 400, 10, 240), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ t }) => {
      clear(g);
      Q.line(g, F.X0, F.y(0), F.X1, F.y(0), "ax"); Q.line(g, F.x(0), F.Y0, F.x(0), F.Y1, "ax");
      el("circle", { cx: F.x(0), cy: F.y(0), r: F.x(1) - F.x(0), class: "k" }, g);
      const c = Math.cos(t), s = Math.sin(t);
      Q.line(g, F.x(0), F.y(0), F.x(c), F.y(s), "a"); Q.line(g, F.x(c), F.y(0), F.x(c), F.y(s), "b dsh"); Q.line(g, F.x(0), F.y(0), F.x(c), F.y(0), "c dsh");
      Q.dot(g, F.x(c), F.y(s), "fd", 5);
      txt(g, F.X1 - 4, F.y(0) - 6, "실수축", "s", "end"); txt(g, F.x(0) + 6, F.Y0 + 12, "허수축", "s");
      txt(g, F.x(1) + 4, F.y(0) + 14, "1", "s"); txt(g, F.x(-1) - 4, F.y(0) + 14, "−1", "s", "end");
      read.textContent = `θ = ${num(t)}: e^(iθ) = cos θ + i sin θ = ${num(c, 3)} ${s < 0 ? "−" : "+"} ${num(Math.abs(s), 3)}i`;
    });
  });

  // 9.1 직육면체 대각선 (비스듬한 투영)
  Q.def("c1-box", (fig, svg) => {
    const g = el("g", {}, svg), s = 46, P = (x, y, z) => [150 + s * x - 0.5 * s * y * 0.7, 220 - s * z + 0.5 * s * y * 0.5 - s * y * 0.55];
    const L = (a, b, cls) => { const p = P(...a), q = P(...b); Q.line(g, p[0], p[1], q[0], q[1], cls); };
    const A = 4, B = 3, C = 2.4;
    L([0, 0, 0], [A + 0.8, 0, 0], "ax"); L([0, 0, 0], [0, B + 0.8, 0], "ax"); L([0, 0, 0], [0, 0, C + 0.8], "ax");
    const pt = (x, y, z, s2, anchor) => { const p = P(x, y, z); txt(g, p[0], p[1], s2, "i", anchor || "start"); };
    pt(A + 0.9, 0, 0, "x"); pt(0, B + 0.9, 0, "y"); pt(0, 0, C + 0.9, "z");
    [[[0, 0, 0], [A, 0, 0]], [[A, 0, 0], [A, B, 0]], [[A, B, 0], [0, B, 0]], [[0, B, 0], [0, 0, 0]],
     [[0, 0, C], [A, 0, C]], [[A, 0, C], [A, B, C]], [[A, B, C], [0, B, C]], [[0, B, C], [0, 0, C]],
     [[A, 0, 0], [A, 0, C]], [[A, B, 0], [A, B, C]], [[0, B, 0], [0, B, C]], [[0, 0, 0], [0, 0, C]]].forEach(([a, b]) => L(a, b, "gd"));
    L([0, 0, 0], [A, B, 0], "b"); L([A, B, 0], [A, B, C], "c"); L([0, 0, 0], [A, B, C], "a");
    const m1 = P(A / 2, B / 2, 0), m2 = P(A, B, C / 2), m3 = P(A / 2, B / 2, C / 2);
    txt(g, m1[0] + 10, m1[1] + 16, "√(Δx² + Δy²) = 5", "tb"); txt(g, m2[0] + 8, m2[1], "Δz = 2.4", "tc"); txt(g, m3[0] - 10, m3[1] - 10, "√(25 + 5.76) ≈ 5.55", "ta", "end");
    const o = P(0, 0, 0), q = P(A, B, C); Q.dot(g, o[0], o[1], "fk", 3.5); Q.dot(g, q[0], q[1], "fd", 4);
  });

  // 9.2 벡터의 덧셈: 끝을 끌 수 있는 a, b
  Q.def("c1-vecadd", (fig, svg) => {
    const F = Q.frame(-1, 7, -1, 4.6, 40, 480, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    let a = [3, 1], b = [1, 2.5];
    const draw = () => {
      clear(g);
      Q.axes(g, F, { step: 1 });
      const s = [a[0] + b[0], a[1] + b[1]];
      el("path", { d: `M${F.x(0)} ${F.y(0)}L${F.x(a[0])} ${F.y(a[1])}L${F.x(s[0])} ${F.y(s[1])}L${F.x(b[0])} ${F.y(b[1])}Z`, class: "lk" }, g);
      Q.line(g, F.x(a[0]), F.y(a[1]), F.x(s[0]), F.y(s[1]), "b dsh"); Q.line(g, F.x(b[0]), F.y(b[1]), F.x(s[0]), F.y(s[1]), "a dsh");
      Q.arrow(g, F.x(0), F.y(0), F.x(s[0]), F.y(s[1]), "d", "fd");
      Q.arrow(g, F.x(0), F.y(0), F.x(a[0]), F.y(a[1]), "a", "fa"); Q.arrow(g, F.x(0), F.y(0), F.x(b[0]), F.y(b[1]), "b", "fb");
      txt(g, F.x(a[0]) + 8, F.y(a[1]) + 14, "a", "ta"); txt(g, F.x(b[0]) - 8, F.y(b[1]) - 4, "b", "tb", "end"); txt(g, F.x(s[0]) + 8, F.y(s[1]), "a + b", "td");
      const ha = Q.dot(g, F.x(a[0]), F.y(a[1]), "fa", 8), hb = Q.dot(g, F.x(b[0]), F.y(b[1]), "fb", 8);
      ha.setAttribute("fill-opacity", "0.35"); hb.setAttribute("fill-opacity", "0.35");
      const snap = (v) => Math.round(v * 2) / 2;
      Q.drag(svg, ha, (X, Y) => { a = [snap(Math.max(-0.5, Math.min(6.5, F.ix(X)))), snap(Math.max(-0.5, Math.min(4.2, F.iy(Y))))]; draw(); });
      Q.drag(svg, hb, (X, Y) => { b = [snap(Math.max(-0.5, Math.min(6.5, F.ix(X)))), snap(Math.max(-0.5, Math.min(4.2, F.iy(Y))))]; draw(); });
      read.textContent = `a = ⟨${num(a[0])}, ${num(a[1])}⟩, b = ⟨${num(b[0])}, ${num(b[1])}⟩, a + b = ⟨${num(s[0])}, ${num(s[1])}⟩, |a + b| = ${num(Math.hypot(...s), 3)}`;
    };
    draw();
  });

  // 9.3 내적과 정사영
  Q.def("c1-dot", (fig, svg) => {
    const F = Q.frame(-3.4, 4.6, -0.9, 3.4, 40, 480, 10, 250), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ t }) => {
      clear(g);
      const th = (t * PI) / 180, A = 4, B = 3, b = [B * Math.cos(th), B * Math.sin(th)], c = B * Math.cos(th);
      Q.line(g, F.X0, F.y(0), F.X1, F.y(0), "gd");
      Q.line(g, F.x(b[0]), F.y(b[1]), F.x(c), F.y(0), "ax dsh");
      if (Math.abs(c) > 0.02) Q.line(g, F.x(0), F.y(0) + 6, F.x(c), F.y(0) + 6, c > 0 ? "c" : "d");
      Q.arrow(g, F.x(0), F.y(0), F.x(A), F.y(0), "a", "fa"); Q.arrow(g, F.x(0), F.y(0), F.x(b[0]), F.y(b[1]), "b", "fb");
      el("path", { d: `M${F.x(0.7)} ${F.y(0)}A${F.x(0.7) - F.x(0)} ${F.x(0.7) - F.x(0)} 0 0 0 ${F.x(0.7 * Math.cos(th))} ${F.y(0.7 * Math.sin(th))}`, class: "ax" }, g);
      txt(g, F.x(A) - 4, F.y(0) - 8, "a (|a| = 4)", "ta", "end"); txt(g, F.x(b[0]) + 6, F.y(b[1]) - 4, "b (|b| = 3)", "tb");
      txt(g, F.x(c / 2), F.y(0) + 22, "그림자 " + num(c, 2), c >= 0 ? "tc" : "td", "middle");
      read.textContent = `θ = ${t}°: a·b = |a||b|cos θ = 4 × 3 × ${num(Math.cos(th), 3)} = ${num(A * c, 3)}` + (Math.abs(A * c) < 0.05 ? " → 수직" : A * c > 0 ? " → 예각" : " → 둔각");
    });
  });

  // 10.1 방향장과 오일러 방법: y′ = 0.5y(1 − y/6)
  Q.def("c1-dfield", (fig, svg) => {
    const f = (y) => 0.5 * y * (1 - y / 6), F = Q.frame(-0.3, 12.3, -0.4, 9.6, 40, 500, 10, 250), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ h, y }) => {
      clear(g);
      Q.axes(g, F, { step: 1, every: 2, lstep: 2, grid: false });
      for (let x = 0; x <= 12; x += 1) for (let yy = 0; yy <= 9; yy += 1) {
        const m = f(yy), k = (F.y(0) - F.y(1)) / (F.x(1) - F.x(0)), dx = 0.32 / Math.sqrt(1 + (m * k) ** 2);
        Q.line(g, F.x(x - dx), F.y(yy - m * dx), F.x(x + dx), F.y(yy + m * dx), "gd");
      }
      Q.line(g, F.X0, F.y(6), F.X1, F.y(6), "ax dsh");
      const exact = (t) => 6 / (1 + ((6 - y) / y) * Math.exp(-0.5 * t));
      Q.plot(g, F, exact, "a", 0, 12);
      let x = 0, v = y, d = `M${F.x(0)} ${F.y(y)}`;
      while (x < 12 - 1e-9) { v += h * f(v); x += h; d += `L${F.x(x)} ${F.y(v)}`; }
      el("path", { d, class: "c" }, g);
      for (let k = 0, xx = 0, vv = y; xx <= 12 + 1e-9; k++) { Q.dot(g, F.x(xx), F.y(vv), "fc", 2.5); vv += h * f(vv); xx += h; }
      read.textContent = `h = ${num(h)}: x = 12에서 오일러 ${num(v, 3)}, 참값 ${num(exact(12), 3)}`;
    });
  });

  // 10.2 지수 성장과 로지스틱 성장
  Q.def("c1-logist", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ K, r }) => {
      clear(g);
      const F = Q.frame(-0.4, 12.3, -8, 215, 40, 500, 10, 250), P0 = 5, A = (K - P0) / P0, P = (t) => K / (1 + A * Math.exp(-r * t));
      Q.axes(g, F, { step: 50, every: 1, grid: false, label: false });
      [50, 100, 150, 200].forEach((v) => txt(g, F.x(0) - 4, F.y(v) + 4, num(v), "s", "end"));
      [2, 4, 6, 8, 10, 12].forEach((v) => txt(g, F.x(v), F.y(0) + 15, num(v), "s", "middle"));
      Q.line(g, F.X0, F.y(K), F.X1, F.y(K), "ax dsh"); txt(g, F.X1 - 4, F.y(K) - 6, "K = " + K, "s", "end");
      Q.plot(g, F, (t) => P0 * Math.exp(r * t), "c dsh", 0, 12);
      Q.plot(g, F, P, "a", 0, 12);
      const tm = Math.log(A) / r;
      if (tm > 0 && tm < 12) { Q.dot(g, F.x(tm), F.y(K / 2), "fd", 5); txt(g, F.x(tm) + 8, F.y(K / 2) + 14, "P = K/2", "td"); }
      read.textContent = `P(5) = ${num(P(5), 1)} (지수 성장 ${num(P0 * Math.exp(5 * r), 1)}), 가장 빠른 때 t = ln(${num(A, 1)})/r ≈ ${num(tm, 2)}, 그때 증가 속도 rK/4 = ${num((r * K) / 4, 1)}`;
    });
  });

  // ── 새 그림은 이 위에 ──
})();
