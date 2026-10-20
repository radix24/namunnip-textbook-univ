/* 공통3(일반물리학 1) 본문 카드의 조작 그림 (js/lib/qfig.js의 NMQ를 쓴다). 그림마다 NMQ.def("이름", …). */
(() => {
  "use strict";
  const Q = window.NMQ;
  if (!Q) return;
  const { el, clear, txt, num } = Q;
  const PI = Math.PI, G = 9.8;
  const rad = (d) => (d * PI) / 180;
  // 화살표 + 끝에 이름표
  const vec = (g, F, x0, y0, x1, y1, cls, fcls, lab, tcls) => {
    Q.arrow(g, F.x(x0), F.y(y0), F.x(x1), F.y(y1), cls, fcls);
    if (lab) { const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1; txt(g, F.x(x1) + (12 * dx) / L, F.y(y1) - (12 * dy) / L + 4, lab, tcls || "i", "middle"); }
  };
  const rect = (g, F, x0, y0, x1, y1, cls) => el("rect", { x: Math.min(F.x(x0), F.x(x1)), y: Math.min(F.y(y0), F.y(y1)), width: Math.abs(F.x(x1) - F.x(x0)), height: Math.abs(F.y(y1) - F.y(y0)), class: cls }, g);
  // 축과 눈금 글자: xt, yt는 눈금 값 목록
  const axl = (g, F, xt, yt, xs, ys) => {
    Q.axes(g, F, { grid: false, label: false });
    xt.forEach((v) => txt(g, F.x(v), F.y(0) + 14, num(v), "s", "middle"));
    yt.forEach((v) => txt(g, F.x(0) - 5, F.y(v) + 4, num(v), "s", "end"));
    txt(g, F.X1 - 4, F.y(0) - 6, xs, "i", "end"); txt(g, F.x(0) + 6, F.Y0 + 14, ys, "i");
  };
  const poly = (g, F, pts, cls) => el("path", { d: pts.map((p, i) => (i ? "L" : "M") + F.x(p[0]).toFixed(1) + " " + F.y(p[1]).toFixed(1)).join("") + "Z", class: cls }, g);

  // 1.1 유효숫자: 잰 값의 범위가 넓이의 범위를 정한다
  Q.def("c3-sigfig", (fig, svg) => {
    const F = Q.frame(9.1, 9.9, 0, 10, 40, 500, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ d }) => {
      clear(g);
      const a = 2.3, b = 4.12, ea = d == 1 ? 0.005 : 0.05, eb = 0.005;
      const lo = (a - ea) * (b - eb), hi = (a + ea) * (b + eb);
      Q.line(g, F.x(9.1), F.y(3), F.x(9.9), F.y(3), "ax");
      for (let v = 9.1; v <= 9.901; v += 0.1) { Q.line(g, F.x(v), F.y(3), F.x(v), F.y(2.6), "ax"); txt(g, F.x(v), F.y(3) + 26, num(v, 1), "s", "middle"); }
      for (let v = 9.1; v <= 9.901; v += 0.01) Q.line(g, F.x(v), F.y(3), F.x(v), F.y(2.8), "gd");
      rect(g, F, lo, 3.6, hi, 5.2, "la");
      txt(g, F.x(lo), F.y(5.9), num(lo, 3), "ta", "middle"); txt(g, F.x(hi), F.y(5.9), num(hi, 3), "ta", "middle");
      Q.line(g, F.x(9.476), F.y(2.4), F.x(9.476), F.y(6.6), "d dsh"); txt(g, F.x(9.476), F.y(7.3), "계산기 9.476", "td", "middle");
      txt(g, F.x((lo + hi) / 2), F.y(4.4) + 4, "넓이가 있을 수 있는 범위", "s", "middle");
      txt(g, F.x(9.12), F.y(9), d == 1 ? "세로 2.30 m (2.295~2.305), 가로 4.12 m" : "세로 2.3 m (2.25~2.35), 가로 4.12 m", "s", "start");
      read.textContent = d == 1
        ? `범위가 ${lo.toFixed(2)}~${hi.toFixed(2)} m²로 좁아져 소수 둘째 자리 9.48까지 쓸 수 있다.`
        : `범위가 ${lo.toFixed(2)}~${hi.toFixed(2)} m²로 넓어 소수 첫째 자리 9.5까지만 믿을 수 있다.`;
    });
  });

  // 1.2 벡터의 합: 성분끼리 더한다
  Q.def("c3-vecsum", (fig, svg) => {
    const F = Q.frame(-7, 13, -2, 13, 40, 480, 10, 285), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ t }) => {
      clear(g);
      Q.axes(g, F, { step: 2, every: 2 });
      const A = [10 * Math.cos(rad(30)), 10 * Math.sin(rad(30))], B = [6 * Math.cos(rad(t)), 6 * Math.sin(rad(t))], S = [A[0] + B[0], A[1] + B[1]];
      Q.line(g, F.x(S[0]), F.y(0), F.x(S[0]), F.y(S[1]), "c dsh"); Q.line(g, F.x(0), F.y(S[1]), F.x(S[0]), F.y(S[1]), "c dsh");
      vec(g, F, 0, 0, A[0], A[1], "a", "fa", "A", "ta");
      vec(g, F, A[0], A[1], S[0], S[1], "b", "fb", "B", "tb");
      vec(g, F, 0, 0, S[0], S[1], "d", "fd", "A+B", "td");
      const m = Math.hypot(...S), ang = (Math.atan2(S[1], S[0]) * 180) / PI;
      read.textContent = `A = (${num(A[0], 2)}, ${num(A[1], 2)}), B = (${num(B[0], 2)}, ${num(B[1], 2)}), 합 = (${num(S[0], 2)}, ${num(S[1], 2)}), 크기 ${num(m, 1)} m, 방향 ${num(ang, 0)}°`;
    });
  });

  // 2.1 평균 속도 → 순간 속도: x = 20 + 5t²
  Q.def("c3-xt", (fig, svg) => {
    const F = Q.frame(-0.3, 4, -8, 105, 50, 490, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const x = (t) => 20 + 5 * t * t;
    Q.bind(fig, ({ h }) => {
      clear(g);
      axl(g, F, [1, 2, 3, 4], [20, 40, 60, 80, 100], "t (s)", "x (m)");
      Q.plot(g, F, x, "a", 0, 4);
      const t0 = 2, t1 = 2 + h, m = (x(t1) - x(t0)) / h;
      Q.plot(g, F, (t) => x(t0) + m * (t - t0), "d", 0, 4);
      Q.plot(g, F, (t) => x(t0) + 20 * (t - t0), "b dsh", 0, 4);
      Q.dot(g, F.x(t0), F.y(x(t0)), "fa", 4); Q.dot(g, F.x(t1), F.y(x(t1)), "fd", 4);
      read.textContent = `t = 2 s에서 2 + ${num(h, 2)} s까지 평균 속도 = ${num(m, 2)} m/s, 순간 속도 dx/dt = 10t = 20 m/s (점선)`;
    });
  });

  // 2.2 제동 거리: v-t 그래프 아래 넓이
  Q.def("c3-brake", (fig, svg) => {
    const F = Q.frame(-0.4, 7, -3, 33, 50, 490, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ v }) => {
      clear(g);
      axl(g, F, [1, 2, 3, 4, 5, 6], [10, 20, 30], "t (s)", "v (m/s)");
      const T = v / 5, d = (v * v) / 10;
      poly(g, F, [[0, 0], [0, v], [T, 0]], "la");
      Q.line(g, F.x(0), F.y(v), F.x(T), F.y(0), "a");
      txt(g, F.x(T / 3), F.y(v / 3) + 4, `${num(d, 1)} m`, "ta", "middle");
      poly(g, F, [[0, 0], [0, 15], [3, 0]], "k dsh");
      read.textContent = `처음 속력 ${v} m/s, 가속도 −5.0 m/s²: 멈추는 시간 ${num(T, 1)} s, 제동 거리(삼각형 넓이) ${num(d, 1)} m` + (v == 30 ? ", 15 m/s일 때(점선)의 네 배" : "");
    });
  });

  // 2.3 포물선 운동
  Q.def("c3-proj", (fig, svg) => {
    const F = Q.frame(-2, 45, -2, 22, 40, 490, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ v, a }) => {
      clear(g);
      Q.axes(g, F, { step: 5, grid: false, xs: "x (m)", ys: "y (m)" });
      for (let u = 10; u <= 40; u += 10) txt(g, F.x(u), F.y(0) + 14, u, "s", "middle");
      const th = rad(a), vx = v * Math.cos(th), vy = v * Math.sin(th), T = (2 * vy) / G, R = vx * T, H = (vy * vy) / (2 * G);
      const c = rad(90 - a), Rc = (v * v * Math.sin(2 * c)) / G;
      Q.plot(g, F, (x) => x * Math.tan(c) - (G * x * x) / (2 * v * v * Math.cos(c) ** 2), "c dsh", 0, Rc);
      Q.plot(g, F, (x) => x * Math.tan(th) - (G * x * x) / (2 * vx * vx), "a", 0, R);
      for (let i = 0; i <= 8; i++) { const t = (T * i) / 8; Q.dot(g, F.x(vx * t), F.y(vy * t - (G * t * t) / 2), "fa", 3); }
      Q.line(g, F.x(R / 2), F.y(0), F.x(R / 2), F.y(H), "gd dsh");
      vec(g, F, 0, 0, vx * 0.35, vy * 0.35, "d", "fd", "v₀", "td");
      read.textContent = `비행 시간 ${num(T, 2)} s, 최고 높이 ${num(H, 1)} m, 수평 거리 ${num(R, 1)} m (점선은 ${90 - a}°로 던졌을 때, 거리 ${num(Rc, 1)} m)`;
    });
  });

  // 2.4 구심 가속도: 속도 벡터가 도는 만큼 Δv
  Q.def("c3-circ", (fig, svg) => {
    const F = Q.frame(-1.6, 3.6, -1.35, 1.35, 20, 500, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ d }) => {
      clear(g);
      const R = 1.1, dt = rad(d), t0 = rad(60), t1 = t0 + dt, vl = 0.8;
      el("circle", { cx: F.x(0), cy: F.y(0), r: F.x(R) - F.x(0), class: "gd" }, g);
      Q.dot(g, F.x(0), F.y(0), "fk", 3);
      const P0 = [R * Math.cos(t0), R * Math.sin(t0)], P1 = [R * Math.cos(t1), R * Math.sin(t1)];
      const V0 = [-vl * Math.sin(t0), vl * Math.cos(t0)], V1 = [-vl * Math.sin(t1), vl * Math.cos(t1)];
      Q.line(g, F.x(0), F.y(0), F.x(P0[0]), F.y(P0[1]), "gd"); Q.line(g, F.x(0), F.y(0), F.x(P1[0]), F.y(P1[1]), "gd");
      vec(g, F, P0[0], P0[1], P0[0] + V0[0], P0[1] + V0[1], "a", "fa", "v₁", "ta");
      vec(g, F, P1[0], P1[1], P1[0] + V1[0], P1[1] + V1[1], "b", "fb", "v₂", "tb");
      // 오른쪽: 두 속도 벡터를 꼬리끼리 모은 그림
      const O = [2.4, -0.6];
      vec(g, F, O[0], O[1], O[0] + V0[0], O[1] + V0[1], "a", "fa");
      vec(g, F, O[0], O[1], O[0] + V1[0], O[1] + V1[1], "b", "fb");
      vec(g, F, O[0] + V0[0], O[1] + V0[1], O[0] + V1[0], O[1] + V1[1], "d", "fd", "Δv", "td");
      const dv = Math.hypot(V1[0] - V0[0], V1[1] - V0[1]);
      read.textContent = `Δθ = ${d}°일 때 |Δv| = ${num(dv / vl, 3)}v, v·Δθ = ${num(dt, 3)}v. Δθ가 작을수록 두 값이 같아지고 Δv는 중심을 향한다.`;
    });
  });

  // 3.1 엘리베이터 안의 저울: n = m(g + a)
  Q.def("c3-elev", (fig, svg) => {
    const F = Q.frame(0, 10, 0, 10, 20, 500, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ a }) => {
      clear(g);
      const m = 60, n = m * (G + a), s = 1 / 220;
      rect(g, F, 1, 0.8, 4.4, 9.4, "gd");
      rect(g, F, 1.9, 1.2, 3.5, 1.6, "lk");
      el("circle", { cx: F.x(2.7), cy: F.y(5.3), r: 18, class: "lb" }, g);
      txt(g, F.x(2.7), F.y(5.3) + 4, "60 kg", "s", "middle");
      if (n > 1) vec(g, F, 2.7, 6.1, 2.7, 6.1 + n * s, "b", "fb", "n", "tb");
      vec(g, F, 2.7, 4.5, 2.7, 4.5 - m * G * s, "d", "fd", "mg", "td");
      if (Math.abs(a) > 0.05) vec(g, F, 4.9, 5, 4.9, 5 + Math.sign(a) * Math.min(2.2, 0.3 + Math.abs(a) * 0.25), "a", "fa", "a", "ta");
      txt(g, F.x(6), F.y(7.5), `저울 눈금 n = ${num(n, 0)} N`, "tb", "start");
      txt(g, F.x(6), F.y(6.4), `무게 mg = ${num(m * G, 0)} N`, "td", "start");
      txt(g, F.x(6), F.y(5.3), a > 0.05 ? "무겁게 느낀다" : a < -9.7 ? "무중력 (자유 낙하)" : a < -0.05 ? "가볍게 느낀다" : "가만히 있을 때와 같다", "s", "start");
      read.textContent = `위를 양으로 n − mg = ma, a = ${num(a, 1)} m/s²이면 n = m(g + a) = ${num(n, 0)} N`;
    });
  });

  // 3.2 경사면: 무게를 면에 나란한 성분과 수직인 성분으로 나눈다
  Q.def("c3-incline", (fig, svg) => {
    const F = Q.frame(0, 10, 0, 5.2, 20, 500, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const ms = Math.tan(rad(25)), mk = 0.2;
    Q.bind(fig, ({ t }) => {
      clear(g);
      const th = rad(t), c = Math.cos(th), s = Math.sin(th), L = 6.5 / c > 9 ? 9 : 6.5 / c;
      poly(g, F, [[0.5, 0.4], [0.5 + L * c, 0.4], [0.5 + L * c, 0.4 + L * s]], "lk");
      const u = [c, s], nv = [-s, c], P = [0.5 + 0.55 * L * c, 0.4 + 0.55 * L * s], hb = 0.45;
      const corner = (a, b) => [P[0] + a * u[0] + b * nv[0], P[1] + a * u[1] + b * nv[1]];
      poly(g, F, [corner(-hb, 0), corner(hb, 0), corner(hb, 2 * hb), corner(-hb, 2 * hb)], "lb");
      const C = corner(0, hb), k = 1.6;
      vec(g, F, C[0], C[1], C[0], C[1] - k, "d", "fd", "mg", "td");
      vec(g, F, C[0], C[1], C[0] - k * s * u[0], C[1] - k * s * u[1], "a", "fa", "mg sinθ", "ta");
      vec(g, F, C[0], C[1], C[0] - k * c * nv[0], C[1] - k * c * nv[1], "c", "fc");
      vec(g, F, C[0], C[1], C[0] + k * c * nv[0], C[1] + k * c * nv[1], "b", "fb", "n", "tb");
      const slide = Math.tan(th) > ms + 1e-9, f = slide ? mk * c : s;
      const B = corner(0, 0);
      vec(g, F, B[0], B[1], B[0] + k * f * u[0], B[1] + k * f * u[1], "k", "fk", "f", "i");
      const acc = slide ? G * (s - mk * c) : 0;
      read.textContent = slide
        ? `tan θ = ${num(Math.tan(th), 2)} > μs = 0.47 이므로 미끄러진다. 운동 마찰(μk = 0.20)을 빼면 가속도 ${num(acc, 2)} m/s²`
        : `tan θ = ${num(Math.tan(th), 2)} ≤ μs = 0.47 이므로 정지 마찰력이 mg sinθ = ${num(s, 3)}mg만큼 버텨 정지해 있다.`;
    });
  });

  // 3.3 애트우드 기계
  Q.def("c3-atwood", (fig, svg) => {
    const F = Q.frame(0, 10, 0, 10, 20, 500, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ m1, m2 }) => {
      clear(g);
      const a = ((m2 - m1) * G) / (m1 + m2), T = (2 * m1 * m2 * G) / (m1 + m2);
      const cx = 3, cy = 8.6, r = 0.8, d = Math.max(-2, Math.min(2, a * 0.5));
      Q.line(g, F.x(cx), F.y(9.8), F.x(cx), F.y(cy), "k");
      el("circle", { cx: F.x(cx), cy: F.y(cy), r: F.x(r) - F.x(0), class: "lk" }, g);
      const y1 = 4.5 + d, y2 = 4.5 - d;
      Q.line(g, F.x(cx - r), F.y(cy), F.x(cx - r), F.y(y1 + 0.5), "k"); Q.line(g, F.x(cx + r), F.y(cy), F.x(cx + r), F.y(y2 + 0.5), "k");
      const box = (x, y, m, cls) => { const w = 0.35 + 0.08 * m; rect(g, F, x - w, y - w, x + w, y + w, cls); txt(g, F.x(x), F.y(y) + 4, `${m} kg`, "s", "middle"); };
      box(cx - r, y1, m1, "la"); box(cx + r, y2, m2, "lb");
      if (Math.abs(a) > 0.01) { vec(g, F, cx - r - 1.3, y1, cx - r - 1.3, y1 + Math.sign(a) * 1.2, "a", "fa", "a", "ta"); vec(g, F, cx + r + 1.3, y2, cx + r + 1.3, y2 - Math.sign(a) * 1.2, "b", "fb", "a", "tb"); }
      txt(g, F.x(6), F.y(7), `가속도 a = ${num(Math.abs(a), 2)} m/s²`, "s", "start");
      txt(g, F.x(6), F.y(5.8), `장력 T = ${num(T, 1)} N`, "s", "start");
      txt(g, F.x(6), F.y(4.6), `두 무게 ${num(m1 * G, 1)} N, ${num(m2 * G, 1)} N`, "s", "start");
      read.textContent = `두 식을 더하면 (m₂ − m₁)g = (m₁ + m₂)a, 장력은 두 무게 사이의 값`;
    });
  });

  // 3.4 평평한 커브: 필요한 구심력과 최대 정지 마찰력
  Q.def("c3-curve", (fig, svg) => {
    const F = Q.frame(0, 10, 0, 10, 20, 500, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ v, mu }) => {
      clear(g);
      const R = 50, need = (v * v) / R, max = mu * G, ok = need <= max + 1e-9;
      const arc = []; for (let i = 0; i <= 40; i++) { const a = rad(200 + (140 * i) / 40); arc.push([2.6 + 2.2 * Math.cos(a), 6.6 + 2.2 * Math.sin(a)]); }
      el("path", { d: arc.map((p, i) => (i ? "L" : "M") + F.x(p[0]).toFixed(1) + " " + F.y(p[1]).toFixed(1)).join(""), class: "gd", style: "stroke-width:14" }, g);
      const car = [2.6, 4.4];
      rect(g, F, car[0] - 0.3, car[1] - 0.2, car[0] + 0.3, car[1] + 0.2, ok ? "lb" : "ld");
      vec(g, F, car[0], car[1], car[0], car[1] + Math.min(2, need / 5), "a", "fa", "필요", "ta");
      if (!ok) vec(g, F, car[0], car[1], car[0] + 1.8, car[1], "d", "fd", "", "td");
      const bx = 6, bw = 0.8, sc = 7.5 / 10;
      rect(g, F, bx, 1, bx + bw, 1 + need * sc, "la"); rect(g, F, bx + 1.5, 1, bx + 1.5 + bw, 1 + max * sc, "lb");
      txt(g, F.x(bx + bw / 2), F.y(0.4), "v²/R", "s", "middle"); txt(g, F.x(bx + 1.5 + bw / 2), F.y(0.4), "μs g", "s", "middle");
      txt(g, F.x(bx + bw / 2), F.y(1 + need * sc) - 5, num(need, 1), "ta", "middle"); txt(g, F.x(bx + 1.5 + bw / 2), F.y(1 + max * sc) - 5, num(max, 1), "tb", "middle");
      read.textContent = `반지름 50 m, v = ${v} m/s: 필요한 가속도 ${num(need, 2)} m/s², 마찰이 줄 수 있는 최대 ${num(max, 2)} m/s² → ` + (ok ? "돌 수 있다" : "미끄러져 바깥으로 곧게 나간다") + ` (최대 속력 ${num(Math.sqrt(mu * G * R), 1)} m/s)`;
    });
  });

  // 4.1 용수철을 늘이는 일 = F-x 그래프 아래 넓이
  Q.def("c3-springw", (fig, svg) => {
    const F = Q.frame(-0.02, 0.27, -5, 55, 60, 490, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read"), k = 200;
    Q.bind(fig, ({ a, b }) => {
      clear(g);
      const x1 = Math.min(a, b), x2 = Math.max(a, b);
      poly(g, F, [[x1, 0], [x2, 0], [x2, k * x2], [x1, k * x1]], "la");
      Q.axes(g, F, { step: 0.05, grid: false, label: false, xs: "x (m)", ys: "F (N)" });
      for (let v = 0.05; v <= 0.251; v += 0.05) txt(g, F.x(v), F.y(0) + 14, num(v, 2), "s", "middle");
      for (let v = 10; v <= 50; v += 10) txt(g, F.x(0) - 5, F.y(v) + 4, v, "s", "end");
      Q.plot(g, F, (x) => k * x, "a", 0, 0.25);
      const W = 0.5 * k * (x2 * x2 - x1 * x1);
      txt(g, F.x(x1 + (x2 - x1) * 0.6), F.y((k * (x1 + x2)) / 4) + 4, `${num(W, 2)} J`, "ta", "middle");
      read.textContent = `F = kx (k = 200 N/m), ${num(x1, 2)} m에서 ${num(x2, 2)} m까지 늘이는 일 = ½k(x₂² − x₁²) = ${num(W, 2)} J`;
    });
  });

  // 4.2 일-에너지 정리: 미는 힘의 일과 마찰력의 일
  Q.def("c3-wke", (fig, svg) => {
    const F = Q.frame(0, 10, -40, 60, 20, 500, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ mu }) => {
      clear(g);
      const m = 2, d = 5, Wp = 10 * d, Wf = -mu * m * G * d, K = Wp + Wf, v = Math.sqrt(Math.max(0, (2 * K) / m));
      Q.line(g, F.x(0.3), F.y(0), F.x(9.7), F.y(0), "ax");
      const bar = (x, val, cls, lab) => { rect(g, F, x, 0, x + 1.4, val, cls); txt(g, F.x(x + 0.7), F.y(val) + (val >= 0 ? -6 : 16), `${num(val, 1)} J`, "s", "middle"); txt(g, F.x(x + 0.7), F.y(-36), lab, "s", "middle"); };
      bar(0.8, Wp, "la", "미는 힘의 일");
      bar(3.3, Wf, "ld", "마찰력의 일");
      bar(5.8, K, "lb", "알짜 일 = K₂");
      txt(g, F.x(8.1), F.y(40), `v = ${num(v, 2)} m/s`, "tb", "start");
      read.textContent = `2.0 kg을 10 N으로 5.0 m 밀 때, μk = ${num(mu, 2)}이면 마찰력 ${num(mu * m * G, 2)} N이 ${num(Wf, 1)} J의 일을 하고 나중 운동 에너지는 ${num(K, 1)} J`;
    });
  });

  // 4.3 롤러코스터: K + U가 일정
  Q.def("c3-coaster", (fig, svg) => {
    const F = Q.frame(0, 10, -2, 24, 20, 360, 10, 270), B = Q.frame(0, 4, -2, 24, 370, 510, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const y = (x) => 10 + 10 * Math.cos((x * PI) / 10) * (1 - x / 25) + 2.5 * Math.sin((x * PI) / 2.5) * (x / 10);
    Q.bind(fig, ({ s, w }) => {
      clear(g);
      Q.plot(g, F, y, "k", 0, 10);
      const h0 = y(0), h = y(s), m = 500, loss = w ? 1700 * s : 0, E = m * G * h0, U = m * G * h, K = Math.max(0, E - U - loss), v = Math.sqrt((2 * K) / m);
      Q.dot(g, F.x(s), F.y(h), "fd", 6);
      const sc = 22 / E;
      rect(g, B, 0.4, 0, 1.4, U * sc, "lb"); rect(g, B, 0.4, U * sc, 1.4, (U + K) * sc, "la");
      if (loss > 0) rect(g, B, 0.4, (U + K) * sc, 1.4, (U + K + loss) * sc, "ld");
      Q.line(g, B.x(0.2), B.y(E * sc), B.x(3.8), B.y(E * sc), "k dsh");
      txt(g, B.x(1.7), B.y((U * sc) / 2) + 4, "U", "tb", "start"); txt(g, B.x(1.7), B.y(U * sc + (K * sc) / 2) + 4, "K", "ta", "start");
      if (loss > 0) txt(g, B.x(1.7), B.y((U + K + loss / 2) * sc) + 4, "열", "td", "start");
      read.textContent = `높이 ${num(h, 1)} m, U = ${num(U / 1000, 1)} kJ, K = ${num(K / 1000, 1)} kJ, 속력 ${num(v, 1)} m/s` + (loss > 0 ? `, 잃은 에너지 ${num(loss / 1000, 1)} kJ` : " (K + U 일정)");
    });
  });

  // 4.4 퍼텐셜 그래프: U = x⁴ − 2x², 에너지 E로 운동 범위가 정해진다
  Q.def("c3-udiag", (fig, svg) => {
    const F = Q.frame(-1.8, 1.8, -1.3, 1.6, 50, 490, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const U = (x) => x ** 4 - 2 * x * x;
    Q.bind(fig, ({ e }) => {
      clear(g);
      Q.axes(g, F, { step: 0.5, grid: false, xs: "x (m)", ys: "U (J)" });
      const segs = []; let cur = null;
      for (let i = 0; i <= 720; i++) { const x = -1.8 + (3.6 * i) / 720; if (U(x) <= e) { if (!cur) { cur = [x, x]; segs.push(cur); } cur[1] = x; } else cur = null; }
      segs.forEach(([a, b]) => { const pts = [[a, e]]; for (let i = 0; i <= 60; i++) { const x = a + ((b - a) * i) / 60; pts.push([x, U(x)]); } pts.push([b, e]); poly(g, F, pts, "la"); });
      Q.plot(g, F, U, "k", -1.8, 1.8);
      Q.line(g, F.x(-1.8), F.y(e), F.x(1.8), F.y(e), "a dsh"); txt(g, F.x(1.75), F.y(e) - 6, "E", "ta", "end");
      Q.dot(g, F.x(0), F.y(0), "fd", 4); Q.dot(g, F.x(1), F.y(-1), "fb", 4); Q.dot(g, F.x(-1), F.y(-1), "fb", 4);
      segs.forEach(([a, b]) => { if (a > -1.79) Q.dot(g, F.x(a), F.y(e), "fa", 3); if (b < 1.79) Q.dot(g, F.x(b), F.y(e), "fa", 3); });
      // 반환점: x² = 1 ± √(1 + E)
      const q = Math.sqrt(Math.max(0, 1 + e)), xo = Math.sqrt(1 + q), xi = Math.sqrt(Math.max(0, 1 - q));
      read.textContent = e < -1 ? "E가 바닥(−1 J)보다 낮으면 움직일 수 있는 곳이 없다." : e < 0
        ? `E = ${num(e, 2)} J: 오른쪽 골짜기에서 ${num(xi, 2)} ≤ x ≤ ${num(xo, 2)} m를 왕복한다. 가운데 언덕(U = 0)을 넘지 못한다.`
        : `E = ${num(e, 2)} J: 가운데 언덕을 넘어 −${num(xo, 2)} ≤ x ≤ ${num(xo, 2)} m 전체를 오간다.`;
    });
  });

  // 5.1 충격량: 같은 넓이(운동량 변화)라도 시간이 길면 힘이 작다
  Q.def("c3-impulse", (fig, svg) => {
    const F = Q.frame(-0.02, 0.34, -2, 32, 60, 490, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ T }) => {
      clear(g);
      Q.axes(g, F, { step: 0.05, grid: false, label: false, xs: "t (s)", ys: "F (kN)" });
      for (let v = 0.1; v <= 0.31; v += 0.1) txt(g, F.x(v), F.y(0) + 14, num(v, 1), "s", "middle");
      for (let v = 10; v <= 30; v += 10) txt(g, F.x(0) - 5, F.y(v) + 4, v, "s", "end");
      const dp = 600, avg = dp / T / 1000, pk = 2 * avg;
      const f = (t) => (t >= 0 && t <= T ? pk * Math.sin((PI * t) / T) ** 2 : 0);
      const pts = [[0, 0]]; for (let i = 0; i <= 80; i++) { const t = (T * i) / 80; pts.push([t, Math.min(f(t), 40)]); } pts.push([T, 0]);
      poly(g, F, pts, "la");
      Q.plot(g, F, (t) => Math.min(f(t), 40), "a", 0, Math.min(T, 0.34), 200);
      if (avg < 32) { Q.line(g, F.x(0), F.y(avg), F.x(T), F.y(avg), "d dsh"); txt(g, F.x(T) + 4, F.y(avg) + 4, "평균", "td", "start"); }
      read.textContent = `넓이(충격량) = Δp = 600 kg·m/s로 같다. 멈추는 시간 ${num(T, 2)} s → 평균 힘 ${num(dp / T, 0)} N`;
    });
  });

  // 5.2 2차원 충돌: 운동량 벡터의 합
  Q.def("c3-cross", (fig, svg) => {
    const F = Q.frame(-6, 44, -4, 44, 40, 480, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ a, b }) => {
      clear(g);
      const sc = 1 / 1000, p1 = 1000 * a, p2 = 2000 * b, vx = p1 / 3000, vy = p2 / 3000;
      Q.line(g, F.x(-6), F.y(0), F.x(44), F.y(0), "gd"); Q.line(g, F.x(0), F.y(-4), F.x(0), F.y(44), "gd");
      vec(g, F, 0, 0, p1 * sc, 0, "a", "fa", "p₁", "ta");
      vec(g, F, p1 * sc, 0, p1 * sc, p2 * sc, "b", "fb", "p₂", "tb");
      vec(g, F, 0, 0, p1 * sc, p2 * sc, "d", "fd"); txt(g, F.x(p1 * sc / 2) - 10, F.y(p2 * sc / 2), "P = p₁ + p₂", "td", "end");
      const ang = (Math.atan2(vy, vx) * 180) / PI;
      read.textContent = `자동차 ${num(p1, 0)}, 트럭 ${num(p2, 0)} kg·m/s → 붙은 뒤 v = (${num(vx, 2)}, ${num(vy, 2)}) m/s, 속력 ${num(Math.hypot(vx, vy), 1)} m/s, 동쪽에서 북쪽으로 ${num(ang, 0)}°`;
    });
  });

  // 5.3 1차원 충돌: 탄성과 완전 비탄성
  Q.def("c3-collide", (fig, svg) => {
    const F = Q.frame(0, 10, 0, 10, 20, 500, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ m2, e }) => {
      clear(g);
      const m1 = 2, v1 = 3;
      let a, b;
      if (e == 1) { a = ((m1 - m2) / (m1 + m2)) * v1; b = ((2 * m1) / (m1 + m2)) * v1; } else { a = b = (m1 * v1) / (m1 + m2); }
      const K0 = 0.5 * m1 * v1 * v1, K1 = 0.5 * m1 * a * a + 0.5 * m2 * b * b;
      const cart = (x, y, m, cls) => { const w = 0.35 + 0.18 * m; rect(g, F, x - w, y, x + w, y + 0.9, cls); txt(g, F.x(x), F.y(y + 0.45) + 4, `${m} kg`, "s", "middle"); return w; };
      txt(g, F.x(0.3), F.y(9.2), "충돌 전", "s", "start"); txt(g, F.x(0.3), F.y(4.7), "충돌 후", "s", "start");
      Q.line(g, F.x(0.2), F.y(6.2), F.x(6.8), F.y(6.2), "ax"); Q.line(g, F.x(0.2), F.y(1.7), F.x(6.8), F.y(1.7), "ax");
      cart(2, 6.2, m1, "la"); cart(4.6, 6.2, m2, "lb");
      vec(g, F, 2, 7.6, 2 + v1 * 0.5, 7.6, "a", "fa", "3.0", "ta");
      cart(2, 1.7, m1, "la"); cart(4.6, 1.7, m2, "lb");
      if (Math.abs(a) > 0.01) vec(g, F, 2, 3.1, 2 + a * 0.5, 3.1, "a", "fa", num(a, 2), "ta");
      if (Math.abs(b) > 0.01) vec(g, F, 4.6, 3.1, 4.6 + b * 0.5, 3.1, "b", "fb", num(b, 2), "tb");
      const sc = 7 / 10;
      rect(g, F, 7.6, 1, 8.3, 1 + K0 * sc, "lk"); rect(g, F, 8.7, 1, 9.4, 1 + K1 * sc, "lb");
      txt(g, F.x(7.95), F.y(0.4), "K 전", "s", "middle"); txt(g, F.x(9.05), F.y(0.4), "K 후", "s", "middle");
      txt(g, F.x(7.95), F.y(1 + K0 * sc) - 5, num(K0, 1), "s", "middle"); txt(g, F.x(9.05), F.y(1 + K1 * sc) - 5, num(K1, 1), "s", "middle");
      read.textContent = `운동량 전 ${num(m1 * v1, 1)}, 후 ${num(m1 * a + m2 * b, 1)} kg·m/s (보존). 운동 에너지 전 ${num(K0, 1)} J, 후 ${num(K1, 1)} J` + (e == 1 ? " (보존)" : ` (${num(K0 - K1, 1)} J 잃음)`);
    });
  });

  // 5.4 보트 위를 걷는 사람: 질량 중심은 그대로
  Q.def("c3-boat", (fig, svg) => {
    const F = Q.frame(-1, 5, -1, 3, 20, 500, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ s }) => {
      clear(g);
      const M = 120, m = 60, L = 3, d = (m * s) / (M + m), b0 = 0.5 - d, xp = b0 + s, cm = (M * (b0 + L / 2) + m * xp) / (M + m);
      Q.line(g, F.x(-1), F.y(0.3), F.x(5), F.y(0.3), "b dsh");
      poly(g, F, [[b0, 0.6], [b0 + L, 0.6], [b0 + L - 0.25, 0.1], [b0 + 0.25, 0.1]], "lk");
      Q.line(g, F.x(xp), F.y(0.6), F.x(xp), F.y(1.4), "k"); el("circle", { cx: F.x(xp), cy: F.y(1.6), r: 8, class: "la" }, g);
      Q.line(g, F.x(cm), F.y(-0.6), F.x(cm), F.y(2.6), "d dsh"); txt(g, F.x(cm), F.y(2.7), "질량 중심", "td", "middle");
      Q.line(g, F.x(0.5), F.y(-0.3), F.x(0.5), F.y(0.1), "gd");
      if (d > 0.01) vec(g, F, 0.5, -0.45, b0, -0.45, "b", "fb", `${num(d, 2)} m`, "tb");
      read.textContent = `사람이 보트 위에서 ${num(s, 1)} m 걸으면 보트는 뒤로 ${num(d, 2)} m, 사람은 땅에 대해 앞으로 ${num(s - d, 2)} m 간다. 질량 중심 x = ${num(cm, 2)} m는 그대로이다.`;
    });
  });

  // 6.1 관성 모멘트: 축을 어디에 두느냐
  Q.def("c3-inertia", (fig, svg) => {
    const F = Q.frame(-0.3, 2.3, -0.8, 0.9, 20, 500, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ d }) => {
      clear(g);
      Q.line(g, F.x(0), F.y(0), F.x(1), F.y(0), "k");
      el("circle", { cx: F.x(0), cy: F.y(0), r: 13, class: "la" }, g); el("circle", { cx: F.x(1), cy: F.y(0), r: 13, class: "la" }, g);
      Q.line(g, F.x(d), F.y(-0.6), F.x(d), F.y(0.6), "d dsh"); txt(g, F.x(d), F.y(0.68), "축", "td", "middle");
      if (d > 0.02) vec(g, F, d, -0.3, 0, -0.3, "b", "fb", `${num(d, 2)} m`, "tb");
      if (d < 0.98) vec(g, F, d, -0.45, 1, -0.45, "b", "fb", `${num(1 - d, 2)} m`, "tb");
      const I = d * d + (1 - d) * (1 - d), sc = 0.9;
      rect(g, F, 1.5, -0.6, 1.75, -0.6 + I * sc, "la"); txt(g, F.x(1.625), F.y(-0.6 + I * sc) - 5, num(I, 2), "s", "middle"); txt(g, F.x(1.625), F.y(-0.72), "I", "i", "middle");
      Q.line(g, F.x(1.45), F.y(-0.6 + 0.5 * sc), F.x(1.8), F.y(-0.6 + 0.5 * sc), "k dsh");
      read.textContent = `I = 1.0 × ${num(d, 2)}² + 1.0 × ${num(1 - d, 2)}² = ${num(I, 3)} kg·m² (가운데 축이면 0.50으로 가장 작다)`;
    });
  });

  // 6.2 돌림힘: 문을 미는 위치와 방향
  Q.def("c3-door", (fig, svg) => {
    const F = Q.frame(-0.2, 1.4, -0.6, 0.9, 40, 480, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ r, p }) => {
      clear(g);
      rect(g, F, 0, -0.03, 1.0, 0.03, "lk");
      Q.dot(g, F.x(0), F.y(0), "fk", 5); txt(g, F.x(0), F.y(-0.12), "경첩", "s", "middle");
      const ph = rad(p), Fm = 0.5, dir = [Math.cos(ph), Math.sin(ph)], P = [r, 0];
      vec(g, F, P[0], P[1], P[0] + Fm * dir[0], P[1] + Fm * dir[1], "a", "fa", "F", "ta");
      Q.line(g, F.x(P[0] - 1.5 * dir[0]), F.y(P[1] - 1.5 * dir[1]), F.x(P[0] + 1.5 * dir[0]), F.y(P[1] + 1.5 * dir[1]), "a dsh");
      const t = -(0 - P[0]) * dir[0] - (0 - P[1]) * dir[1], foot = [P[0] - t * dir[0], P[1] - t * dir[1]];
      Q.line(g, F.x(0), F.y(0), F.x(foot[0]), F.y(foot[1]), "d");
      const arm = r * Math.sin(ph), tau = r * 20 * Math.sin(ph);
      txt(g, F.x(foot[0] / 2) - 6, F.y(foot[1] / 2) - 6, "지레팔", "td", "end");
      read.textContent = `F = 20 N, r = ${num(r, 2)} m, φ = ${p}°: 지레팔 r sin φ = ${num(arm, 2)} m, 돌림힘 τ = ${num(tau, 1)} N·m`;
    });
  });

  // 6.3 경사면 경주: 구, 원판, 고리, 미끄러지는 상자 (경사면을 따라 간 거리를 나란한 줄로)
  Q.def("c3-race", (fig, svg) => {
    const F = Q.frame(-2.2, 10.4, 0, 5, 20, 500, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const th = rad(20), Lr = 9 / Math.cos(th), list = [["미끄러짐", 0, "fd"], ["구", 0.4, "fa"], ["원판", 0.5, "fb"], ["고리", 1, "fc"]];
    Q.bind(fig, ({ t }) => {
      clear(g);
      txt(g, F.x(0), F.y(4.7), "20° 경사면을 따라 간 거리 (m)", "s", "start");
      for (let v = 0; v <= 9.5; v += 1) { Q.line(g, F.x(v), F.y(0.35), F.x(v), F.y(4.2), "gd"); txt(g, F.x(v), F.y(0.05), v, "s", "middle"); }
      Q.line(g, F.x(Lr), F.y(0.35), F.x(Lr), F.y(4.2), "k dsh"); txt(g, F.x(Lr), F.y(4.4), "바닥", "s", "middle");
      const out = [];
      list.forEach(([n, c, cls], i) => {
        const a = (G * Math.sin(th)) / (1 + c), s2 = Math.min(Lr, 0.5 * a * t * t), y = 3.6 - 0.9 * i;
        Q.line(g, F.x(0), F.y(y), F.x(Lr), F.y(y), "ax");
        Q.line(g, F.x(0), F.y(y), F.x(s2), F.y(y), cls.replace("f", ""));
        Q.dot(g, F.x(s2), F.y(y), cls, 6); txt(g, F.x(-0.3), F.y(y) + 4, n, "s", "end");
        out.push(`${n} ${num(s2, 2)} m`);
      });
      read.textContent = `출발 후 ${num(t, 2)} s: ` + out.join(", ") + ". 가속도 g sin θ/(1 + c)가 클수록 앞선다.";
    });
  });

  // 6.4 피겨 스케이터: Iω가 일정
  Q.def("c3-skater", (fig, svg) => {
    const F = Q.frame(-2.6, 2.6, -1.4, 1.4, 20, 500, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ I }) => {
      clear(g);
      const L = 4.0, w = L / I, arm = 0.35 + (I - 1.6) * 0.4;
      const cx = -0.9;
      el("circle", { cx: F.x(cx), cy: F.y(0), r: F.x(0.3) - F.x(0), class: "lb" }, g);
      Q.line(g, F.x(cx - arm), F.y(0), F.x(cx + arm), F.y(0), "k"); Q.dot(g, F.x(cx - arm), F.y(0), "fk", 5); Q.dot(g, F.x(cx + arm), F.y(0), "fk", 5);
      const sweep = Math.min(2 * PI - 0.3, w * 1.4), R0 = 1.25, pts = [];
      for (let i = 0; i <= 40; i++) { const a = PI / 2 + (sweep * i) / 40; pts.push([cx + R0 * Math.cos(a), R0 * Math.sin(a)]); }
      el("path", { d: pts.map((p, i) => (i ? "L" : "M") + F.x(p[0]).toFixed(1) + " " + F.y(p[1]).toFixed(1)).join(""), class: "a" }, g);
      const e = pts[pts.length - 1], pr = pts[pts.length - 3]; Q.arrow(g, F.x(pr[0]), F.y(pr[1]), F.x(e[0]), F.y(e[1]), "a", "fa");
      txt(g, F.x(1.0), F.y(0.7), `I = ${num(I, 1)} kg·m²`, "s", "start");
      txt(g, F.x(1.0), F.y(0.25), `ω = ${num(w, 2)} 바퀴/초`, "ta", "start");
      txt(g, F.x(1.0), F.y(-0.2), `L = Iω = ${num(L, 1)} (일정)`, "s", "start");
      txt(g, F.x(1.0), F.y(-0.65), `운동 에너지 ${num(4 / I, 2)}배`, "td", "start");
      read.textContent = I > 3.95 ? "팔을 벌린 처음 상태: I = 4.0 kg·m², 초당 1.0바퀴. 막대를 줄여 팔을 모아 보라." : `팔을 모아 I를 4.0에서 ${num(I, 1)} kg·m²로 줄이면 ω = 4.0/${num(I, 1)} = ${num(w, 2)} 바퀴/초, 운동 에너지 L²/2I는 처음의 ${num(4 / I, 2)}배`;
    });
  });

  // 7.1 널빤지 위의 사람: 두 받침이 나누어 받는 힘
  Q.def("c3-plank", (fig, svg) => {
    const F = Q.frame(-0.6, 4.6, -1.2, 4.2, 20, 500, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ x }) => {
      clear(g);
      const W = 20 * G, P = 60 * G, FR = (W * 2 + P * x) / 4, FL = W + P - FR, s = 1 / 260;
      rect(g, F, 0, 0, 4, 0.18, "lk");
      poly(g, F, [[0, 0], [-0.2, -0.5], [0.2, -0.5]], "lk"); poly(g, F, [[4, 0], [3.8, -0.5], [4.2, -0.5]], "lk");
      Q.line(g, F.x(x), F.y(0.18), F.x(x), F.y(1.0), "k"); el("circle", { cx: F.x(x), cy: F.y(1.2), r: 9, class: "la" }, g);
      vec(g, F, x + 0.18, 1.2, x + 0.18, 1.2 - P * s, "d", "fd"); txt(g, F.x(x + 0.18) + 6, F.y(1.2 - P * s / 2), "588 N", "td", "start");
      vec(g, F, 2, 0.1, 2, 0.1 - W * s, "d", "fd"); txt(g, F.x(2) + 6, F.y(-0.5), "196 N", "td", "start");
      vec(g, F, 0, -0.5, 0, -0.5 + FL * s * 1.6, "b", "fb", `${num(FL, 0)} N`, "tb");
      vec(g, F, 4, -0.5, 4, -0.5 + FR * s * 1.6, "b", "fb", `${num(FR, 0)} N`, "tb");
      read.textContent = `왼쪽 받침을 축으로 F_R(4.0) − 196(2.0) − 588(${num(x, 1)}) = 0 → F_R = ${num(FR, 0)} N, F_L = 784 − F_R = ${num(FL, 0)} N`;
    });
  });

  // 7.2 응력-변형 곡선
  Q.def("c3-stress", (fig, svg) => {
    const F = Q.frame(-0.4, 10.5, -30, 560, 50, 490, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const curve = (e) => (e <= 1.25 ? 200 * e : e <= 8 ? 250 + 220 * (1 - Math.exp(-(e - 1.25) * 0.7)) - 25 * Math.max(0, e - 6.5) ** 2 : NaN);
    Q.bind(fig, ({ e }) => {
      clear(g);
      axl(g, F, [2, 4, 6, 8, 10], [100, 200, 300, 400, 500], "변형 (×10⁻³)", "응력 (MPa)");
      Q.plot(g, F, curve, "a", 0, 8, 300);
      Q.dot(g, F.x(1.25), F.y(250), "fb", 4); txt(g, F.x(1.25) - 4, F.y(250) - 8, "탄성 한계", "tb", "end");
      Q.dot(g, F.x(8), F.y(curve(8)), "fd", 4); txt(g, F.x(8) + 6, F.y(curve(8)), "끊어짐", "td", "start");
      const y = curve(Math.min(e, 8));
      if (e <= 8) { Q.dot(g, F.x(e), F.y(y), "fa", 6); if (e > 1.25) Q.line(g, F.x(e), F.y(y), F.x(e - y / 200), F.y(0), "c dsh"); }
      read.textContent = e <= 1.25 ? `탄성 영역: 응력 ${num(y, 0)} MPa = 영률 200 GPa × 변형. 힘을 없애면 원래 길이로 돌아온다.`
        : e <= 8 ? `소성 영역: 힘을 없애면 점선을 따라 돌아와 변형 ${num(e - y / 200, 2)}×10⁻³이 남는다.` : "끊어졌다.";
    });
  });

  // 7.3 떠 있는 물체: 잠긴 비율 = 물체 밀도 / 유체 밀도
  Q.def("c3-float", (fig, svg) => {
    const F = Q.frame(0, 10, 0, 10, 20, 500, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ r }) => {
      clear(g);
      const rw = 1025, f = r / rw, sink = f >= 1, H = 3, top = sink ? 0.8 + H : 6 + H * (1 - f);
      rect(g, F, 0.5, 0.5, 9.5, 6, "lb");
      rect(g, F, 3.5, top - H, 6.5, top, r < 1000 ? "lk" : "lc");
      Q.line(g, F.x(0.5), F.y(6), F.x(9.5), F.y(6), "b");
      if (!sink) {
        vec(g, F, 5, top - H / 2, 5, top - H / 2 - Math.min(2.5, f * 2.5), "d", "fd", "무게", "td");
        vec(g, F, 5.9, top - H, 5.9, top - H + Math.min(2.5, f * 2.5), "a", "fa", "부력", "ta");
      }
      txt(g, F.x(7.2), F.y(8.6), `물체 ${r} kg/m³`, "s", "start"); txt(g, F.x(7.2), F.y(7.8), "바닷물 1025 kg/m³", "tb", "start");
      read.textContent = sink ? "물체가 바닷물보다 밀도가 커서 다 잠겨도 부력이 무게보다 작다. 가라앉는다."
        : `떠 있으면 부력 = 무게: 잠긴 비율 = ${r}/1025 = ${num(f * 100, 1)}%, 물 위로 ${num((1 - f) * 100, 1)}%`;
    });
  });

  // 7.4 벤투리 관: 좁은 곳은 빠르고 압력이 낮다
  Q.def("c3-venturi", (fig, svg) => {
    const F = Q.frame(0, 10, 0, 10, 20, 500, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ d }) => {
      clear(g);
      const D1 = 4, v1 = 1, v2 = v1 * (D1 / d) ** 2, dp = 0.5 * 1000 * (v2 * v2 - v1 * v1), h1 = 1.6, sc = 0.9;
      const r1 = 0.55 * D1 / 2, r2 = 0.55 * d / 2, c = 2.6;
      const top = [[0.5, c + r1], [3.5, c + r1], [4.6, c + r2], [6.0, c + r2], [7.1, c + r1], [9.5, c + r1]];
      const bot = top.map(([x, y]) => [x, 2 * c - y]).reverse();
      poly(g, F, top.concat(bot), "lb");
      for (let i = 0; i < 3; i++) { const yy = c + (i - 1) * r1 * 0.6; vec(g, F, 1.2, yy, 1.2 + 0.9 * v1, yy, "b", "fb"); }
      for (let i = 0; i < 3; i++) { const yy = c + (i - 1) * r2 * 0.6; vec(g, F, 4.8, yy, 4.8 + Math.min(1.1, 0.25 * v2), yy, "a", "fa"); }
      const hp1 = 3.5 + h1 + 1.5, hp2 = Math.max(c + r2 + 0.1, hp1 - dp / 2500 * sc);
      rect(g, F, 2.2, c + r1, 2.6, 9.5, "gd"); rect(g, F, 2.2, c + r1, 2.6, hp1, "lb");
      rect(g, F, 5.1, c + r2, 5.5, 9.5, "gd"); rect(g, F, 5.1, c + r2, 5.5, hp2, "lb");
      Q.line(g, F.x(2), F.y(hp1), F.x(5.7), F.y(hp1), "k dsh");
      txt(g, F.x(2.4), F.y(9.7), "p₁", "s", "middle"); txt(g, F.x(5.3), F.y(9.7), "p₂", "s", "middle");
      read.textContent = `지름 4.0 cm → ${num(d, 1)} cm: 넓이 비 ${num((d / D1) ** 2, 3)}, 속력 1.0 → ${num(v2, 2)} m/s, 압력 차 p₁ − p₂ = ½ρ(v₂² − v₁²) = ${num(dp, 0)} Pa`;
    });
  });

  // 8.1 탈출 속력: U = −GMm/r 우물과 에너지 E
  Q.def("c3-escape", (fig, svg) => {
    const F = Q.frame(0, 8.5, -1.15, 0.45, 50, 490, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ v }) => {
      clear(g);
      const ve = 11.2, e = (v / ve) ** 2 - 1; // E를 GMm/R 단위로
      axl(g, F, [1, 2, 4, 6, 8], [-1, -0.5], "r / R", "U, E");
      Q.plot(g, F, (r) => (r >= 1 ? -1 / r : NaN), "k", 1, 8.5);
      rect(g, F, 0, -1.15, 1, 0.45, "lk");
      Q.line(g, F.x(1), F.y(e), F.x(8.5), F.y(e), "a dsh"); txt(g, F.x(8.4), F.y(e) - 6, "E", "ta", "end");
      const rmax = e < 0 ? -1 / e : Infinity;
      if (e < 0 && rmax <= 8.5) { Q.dot(g, F.x(rmax), F.y(e), "fd", 5); txt(g, F.x(rmax), F.y(e) + 16, "되돌아옴", "td", "middle"); }
      read.textContent = e < 0
        ? `처음 속력 ${num(v, 1)} km/s: E < 0 이라 r = ${num(rmax, 2)}R(고도 ${num((rmax - 1) * 6370, 0)} km)에서 멈추고 되돌아온다.`
        : `처음 속력 ${num(v, 1)} km/s ≥ 11.2 km/s: E ≥ 0 이라 우물을 빠져나가 돌아오지 않는다.`;
    });
  });

  // 8.2 케플러 제2법칙: 같은 시간에 같은 넓이
  Q.def("c3-kepler", (fig, svg) => {
    const F = Q.frame(-2.6, 2.6, -1.35, 1.35, 20, 500, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ e }) => {
      clear(g);
      const a = 1.3, b = a * Math.sqrt(1 - e * e), c = a * e;
      const pos = (M) => { let E = M; for (let i = 0; i < 30; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); return [a * Math.cos(E) - c, b * Math.sin(E)]; };
      const orbit = []; for (let i = 0; i <= 120; i++) { const t = (2 * PI * i) / 120; orbit.push([a * Math.cos(t) - c, b * Math.sin(t)]); }
      el("path", { d: orbit.map((p, i) => (i ? "L" : "M") + F.x(p[0]).toFixed(1) + " " + F.y(p[1]).toFixed(1)).join("") + "Z", class: "k" }, g);
      const dM = (2 * PI) / 12;
      [[-dM / 2, "la"], [PI - dM / 2, "lb"]].forEach(([M0, cls]) => { const pts = [[0, 0]]; for (let i = 0; i <= 20; i++) pts.push(pos(M0 + (dM * i) / 20)); poly(g, F, pts, cls); });
      el("circle", { cx: F.x(0), cy: F.y(0), r: 8, class: "fc" }, g); txt(g, F.x(0), F.y(0) + 22, "태양", "s", "middle");
      for (let k = 0; k < 12; k++) { const p = pos((2 * PI * k) / 12); Q.dot(g, F.x(p[0]), F.y(p[1]), "fk", 2.5); }
      const vr = (1 + e) / (1 - e);
      read.textContent = `이심률 ${num(e, 2)}: 점은 같은 시간 간격(공전 주기의 1/12)의 위치. 두 부채꼴의 넓이가 같고, 가까운 곳의 속력이 먼 곳의 ${num(vr, 2)}배`;
    });
  });

  // 9.1 단순 조화 운동 = 등속 원운동의 그림자
  Q.def("c3-shm", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const C = Q.frame(-1.3, 1.3, -1.3, 1.3, 20, 190, 20, 270), P = Q.frame(0, 0.65, -1.3, 1.3, 220, 500, 20, 270);
    Q.bind(fig, ({ t, m }) => {
      clear(g);
      const k = 200, A = 0.05, w = Math.sqrt(k / m), T = (2 * PI) / w, th = w * t, x = Math.cos(th), v = -w * A * Math.sin(th);
      el("circle", { cx: C.x(0), cy: C.y(0), r: C.x(1) - C.x(0), class: "gd" }, g);
      Q.line(g, C.x(-1.3), C.y(0), C.x(1.3), C.y(0), "ax");
      Q.line(g, C.x(0), C.y(0), C.x(x), C.y(Math.sin(th)), "gd");
      Q.dot(g, C.x(x), C.y(Math.sin(th)), "fb", 5);
      Q.line(g, C.x(x), C.y(Math.sin(th)), C.x(x), C.y(0), "b dsh");
      Q.dot(g, C.x(x), C.y(0), "fa", 6);
      txt(g, C.x(0), C.y(-1.3) + 14, "원운동의 그림자", "s", "middle");
      // x-t 그래프 (세로가 x가 되도록 돌려 그린다)
      Q.line(g, P.x(0), P.y(0), P.x(0.65), P.y(0), "ax"); Q.line(g, P.x(0), P.y(-1.3), P.x(0), P.y(1.3), "ax");
      txt(g, P.x(0.64), P.y(0) - 6, "t (s)", "i", "end"); txt(g, P.x(0) + 6, P.y(1.3) + 12, "x", "i");
      for (let u = 0.2; u <= 0.61; u += 0.2) txt(g, P.x(u), P.y(0) + 14, num(u, 1), "s", "middle");
      Q.plot(g, P, (s) => Math.cos(w * s), "gd", 0, 0.65);
      Q.plot(g, P, (s) => Math.cos(w * s), "a", 0, Math.min(t, 0.65));
      if (t <= 0.65) Q.dot(g, P.x(t), P.y(x), "fa", 4);
      Q.line(g, P.x(T), P.y(-1.25), P.x(T), P.y(1.25), "d dsh"); txt(g, P.x(T), P.y(-1.25) + 14, "T", "td", "middle");
      const K = 0.5 * m * v * v, U = 0.5 * k * (A * x) ** 2;
      read.textContent = `m = ${num(m, 2)} kg, k = 200 N/m: ω = ${num(w, 1)} rad/s, T = ${num(T, 3)} s. 지금 x = ${num(A * x * 100, 2)} cm, K = ${num(K, 3)} J, U = ${num(U, 3)} J (합 0.25 J 일정)`;
    });
  });

  // 9.2 진행파: 모양은 나아가고 매질은 제자리에서 진동
  Q.def("c3-wave", (fig, svg) => {
    const F = Q.frame(0, 10, -1.6, 1.6, 30, 500, 20, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ t, lam }) => {
      clear(g);
      const v = 2, k = (2 * PI) / lam, w = k * v, A = 1;
      Q.line(g, F.x(0), F.y(0), F.x(10), F.y(0), "ax");
      Q.plot(g, F, (x) => A * Math.sin(k * x), "gd", 0, 10);
      Q.plot(g, F, (x) => A * Math.sin(k * x - w * t), "a", 0, 10);
      const x0 = 3.0; Q.dot(g, F.x(x0), F.y(A * Math.sin(k * x0 - w * t)), "fd", 6); Q.line(g, F.x(x0), F.y(-1.1), F.x(x0), F.y(1.1), "d dsh");
      const crest = (PI / 2 + w * t) / k; const cx = ((crest % lam) + lam) % lam;
      for (let c = cx; c <= 10; c += lam) Q.dot(g, F.x(c), F.y(A), "fb", 4);
      Q.line(g, F.x(lam / 4), F.y(1.35), F.x(lam / 4 + lam), F.y(1.35), "k"); txt(g, F.x(lam / 4 + lam / 2), F.y(1.35) - 5, "λ", "i", "middle");
      read.textContent = `λ = ${num(lam, 1)} m, v = 2.0 m/s이므로 f = v/λ = ${num(v / lam, 2)} Hz. ${num(t, 2)} s 동안 마루는 ${num(v * t, 2)} m 나아갔고, 빨간 점은 x = 3 m에서 위아래로만 움직인다.`;
    });
  });

  // 9.3 정상파: 양 끝 고정 줄의 n번째 모드
  Q.def("c3-stand", (fig, svg) => {
    const F = Q.frame(-0.05, 1.05, -1.5, 1.5, 30, 500, 20, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ n, t }) => {
      clear(g);
      const k = n * PI, ph = 2 * PI * t;
      Q.plot(g, F, (x) => Math.sin(k * x), "gd", 0, 1); Q.plot(g, F, (x) => -Math.sin(k * x), "gd", 0, 1);
      Q.plot(g, F, (x) => 0.5 * Math.sin(k * x - ph), "b dsh", 0, 1); Q.plot(g, F, (x) => 0.5 * Math.sin(k * x + ph), "c dsh", 0, 1);
      Q.plot(g, F, (x) => Math.sin(k * x) * Math.cos(ph), "a", 0, 1);
      for (let i = 0; i <= n; i++) Q.dot(g, F.x(i / n), F.y(0), "fd", 4);
      rect(g, F, -0.05, -0.3, 0, 0.3, "lk"); rect(g, F, 1, -0.3, 1.05, 0.3, "lk");
      const f1 = 572 / (2 * 0.65);
      read.textContent = `n = ${n}: 마디 ${n + 1}개(빨간 점), 배 ${n}개, L = ${n}·λ/2. 기타 줄(0.65 m, v = 572 m/s)이면 f = ${n} × 440 = ${num(n * f1, 0)} Hz`;
    });
  });

  // 10.1 가열 곡선: 얼음 1 kg을 −20 °C부터 데우기
  Q.def("c3-heatcurve", (fig, svg) => {
    const F = Q.frame(-0.1, 3.3, -35, 135, 50, 490, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const ci = 2100, cw = 4190, cs = 2010, Lf = 3.34e5, Lv = 2.26e6;
    const q1 = ci * 20, q2 = q1 + Lf, q3 = q2 + cw * 100, q4 = q3 + Lv, q5 = q4 + cs * 20;
    const T = (q) => (q < q1 ? -20 + q / ci : q < q2 ? 0 : q < q3 ? (q - q2) / cw : q < q4 ? 100 : 100 + (q - q4) / cs);
    Q.bind(fig, ({ q }) => {
      clear(g);
      const Q6 = q * 1e6;
      axl(g, F, [1, 2, 3], [-20, 50, 100], "열 Q (MJ)", "온도 (°C)");
      Q.plot(g, F, (x) => T(x * 1e6), "gd", 0, q5 / 1e6, 400);
      Q.plot(g, F, (x) => T(x * 1e6), "a", 0, Math.min(Q6, q5) / 1e6, 400);
      const tt = T(Math.min(Q6, q5)); Q.dot(g, F.x(Math.min(Q6, q5) / 1e6), F.y(tt), "fd", 5);
      txt(g, F.x(q1 / 2e6 + 0.17), F.y(6), "녹음", "tb", "middle"); txt(g, F.x((q3 + q4) / 2e6), F.y(106), "끓음", "tb", "middle");
      const st = Q6 < q1 ? "얼음이 데워지는 중" : Q6 < q2 ? `얼음이 녹는 중 (${num(((Q6 - q1) / Lf) * 100, 0)}% 녹음)` : Q6 < q3 ? "물이 데워지는 중" : Q6 < q4 ? `물이 끓는 중 (${num(((Q6 - q3) / Lv) * 100, 0)}% 기화)` : "수증기가 데워지는 중";
      read.textContent = `준 열 ${num(q, 2)} MJ: ${num(tt, 1)} °C, ${st}`;
    });
  });

  // 10.2 맥스웰 속력 분포와 v_rms
  Q.def("c3-maxwell", (fig, svg) => {
    const F = Q.frame(-60, 2600, -0.00025, 0.003, 50, 490, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const gases = [["O₂", 0.032], ["N₂", 0.028], ["H₂", 0.002]];
    Q.bind(fig, ({ T, s }) => {
      clear(g);
      const [nm, M] = gases[s], a = M / (2 * 8.314 * T), f = (v) => 4 * PI * (a / PI) ** 1.5 * v * v * Math.exp(-a * v * v);
      axl(g, F, [500, 1000, 1500, 2000, 2500], [], "속력 v (m/s)", "분자 비율");
      const pts = [[0, 0]]; for (let i = 0; i <= 200; i++) { const v = (2600 * i) / 200; pts.push([v, Math.min(f(v), 0.003)]); } pts.push([2600, 0]);
      poly(g, F, pts, "la");
      Q.plot(g, F, (v) => Math.min(f(v), 0.003), "a", 0, 2600);
      const vr = Math.sqrt((3 * 8.314 * T) / M);
      if (vr < 2600) { Q.line(g, F.x(vr), F.y(0), F.x(vr), F.y(0.0028), "d dsh"); txt(g, F.x(vr) + 4, F.y(0.0027), "v_rms", "td", "start"); }
      read.textContent = `${nm}, ${T} K: v_rms = √(3RT/M) = ${num(vr, 0)} m/s, 분자 하나의 평균 운동 에너지 (3/2)kT = ${num(1.5 * 1.38e-23 * T * 1e21, 2)}×10⁻²¹ J`;
    });
  });

  // 10.3 p-V 그래프: 같은 처음·나중 상태, 다른 경로, 다른 일
  Q.def("c3-pv", (fig, svg) => {
    const F = Q.frame(-1, 52, -0.15, 2.8, 60, 490, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const n = 1, R = 8.314, T = 300, V1 = 0.0224 * (300 / 273.15) * 1000 / 1.1, V2 = 2 * V1;
    const p = (V) => (n * R * T) / (V / 1000) / 1e5; // V는 L, p는 bar(10⁵ Pa)
    Q.bind(fig, ({ k }) => {
      clear(g);
      axl(g, F, [10, 20, 30, 40, 50], [0.5, 1, 1.5, 2, 2.5], "V (L)", "p (10⁵ Pa)");
      const p1 = p(V1), p2 = p(V2);
      let pts, W;
      if (k == 0) { pts = []; for (let i = 0; i <= 60; i++) { const V = V1 + ((V2 - V1) * i) / 60; pts.push([V, p(V)]); } W = n * R * T * Math.log(2); }
      else if (k == 1) { pts = [[V1, p1], [V2, p1], [V2, p2]]; W = p1 * 1e5 * (V2 - V1) / 1000; }
      else { pts = [[V1, p1], [V1, p2], [V2, p2]]; W = p2 * 1e5 * (V2 - V1) / 1000; }
      const area = [[V1, 0]].concat(pts.filter((q, i) => !(k == 2 && i === 0))).concat([[V2, 0]]);
      poly(g, F, area, "la");
      Q.plot(g, F, p, "gd dsh", 10, 50);
      el("path", { d: pts.map((q, i) => (i ? "L" : "M") + F.x(q[0]).toFixed(1) + " " + F.y(q[1]).toFixed(1)).join(""), class: "a", style: "stroke-width:2.4" }, g);
      Q.dot(g, F.x(V1), F.y(p1), "fb", 5); Q.dot(g, F.x(V2), F.y(p2), "fd", 5);
      txt(g, F.x(V1) + 6, F.y(p1) - 6, "처음", "tb", "start"); txt(g, F.x(V2) + 6, F.y(p2) - 6, "나중", "td", "start");
      read.textContent = `1몰, 처음 300 K에서 부피를 두 배로: 기체가 한 일 W = 그래프 아래 넓이 = ${num(W, 0)} J` + (k == 0 ? " (등온, nRT ln 2)" : "");
    });
  });

  // 10.4 열기관의 에너지 흐름과 카르노 효율
  Q.def("c3-carnot", (fig, svg) => {
    const F = Q.frame(0, 10, 0, 10, 20, 500, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ th, tc }) => {
      clear(g);
      const e = Math.max(0, 1 - tc / th), QH = 1000, W = e * QH, QC = QH - W;
      rect(g, F, 0.5, 8, 4.5, 9.6, "ld"); txt(g, F.x(2.5), F.y(8.8) + 4, `뜨거운 곳 ${th} K`, "s", "middle");
      rect(g, F, 0.5, 0.4, 4.5, 2, "lb"); txt(g, F.x(2.5), F.y(1.2) + 4, `차가운 곳 ${tc} K`, "s", "middle");
      el("circle", { cx: F.x(2.5), cy: F.y(5), r: 26, class: "lk" }, g); txt(g, F.x(2.5), F.y(5) + 4, "기관", "s", "middle");
      const wid = (q) => 2 + (q / QH) * 16;
      el("line", { x1: F.x(2.5), y1: F.y(8), x2: F.x(2.5), y2: F.y(5) - 26, class: "d", style: `stroke-width:${wid(QH)}` }, g);
      el("line", { x1: F.x(2.5), y1: F.y(5) + 26, x2: F.x(2.5), y2: F.y(2), class: "b", style: `stroke-width:${wid(QC)}` }, g);
      if (W > 1) el("line", { x1: F.x(2.5) + 26, y1: F.y(5), x2: F.x(4.8), y2: F.y(5), class: "a", style: `stroke-width:${wid(W)}` }, g);
      txt(g, F.x(2.5) + 14, F.y(6.8), `Q_H = 1000 J`, "td", "start"); txt(g, F.x(2.5) + 14, F.y(3.1), `Q_C = ${num(QC, 0)} J`, "tb", "start"); txt(g, F.x(5), F.y(5) + 4, `W = ${num(W, 0)} J`, "ta", "start");
      read.textContent = `카르노 효율 e = 1 − T_C/T_H = 1 − ${tc}/${th} = ${num(e * 100, 1)}%. 열 1000 J 가운데 최대 ${num(W, 0)} J만 일이 되고 나머지는 차가운 곳으로 버려진다.`;
    });
  });

  // 11.1 측정 횟수와 평균의 불확도
  Q.def("c3-meas", (fig, svg) => {
    const F = Q.frame(1.9, 2.1, 0, 10, 40, 500, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const data = []; for (let i = 0; i < 100; i++) { const u = rnd(), v = rnd(); data.push(2.0 + 0.02 * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * PI * v)); }
    Q.bind(fig, ({ N }) => {
      clear(g);
      const d = data.slice(0, N), m = d.reduce((a, b) => a + b, 0) / N, s = Math.sqrt(d.reduce((a, b) => a + (b - m) ** 2, 0) / (N - 1)), se = s / Math.sqrt(N);
      Q.line(g, F.x(1.9), F.y(1), F.x(2.1), F.y(1), "ax");
      for (let v = 1.9; v <= 2.101; v += 0.05) txt(g, F.x(v), F.y(1) + 16, num(v, 2), "s", "middle");
      const bins = {}; d.forEach((x) => { const b = Math.round(x / 0.004); bins[b] = (bins[b] || 0) + 1; Q.dot(g, F.x(b * 0.004), F.y(1.3 + 0.33 * (bins[b] - 1)), "fk", 3); });
      rect(g, F, m - s, 8.2, m + s, 8.8, "lb"); txt(g, F.x(m + s) + 4, F.y(8.5) + 4, "±s (한 번의 흩어짐)", "tb", "start");
      rect(g, F, m - se, 9.0, m + se, 9.6, "la"); txt(g, F.x(m + se) + 4, F.y(9.3) + 4, "±s/√N (평균의 불확도)", "ta", "start");
      Q.line(g, F.x(m), F.y(1), F.x(m), F.y(9.7), "d dsh");
      read.textContent = `N = ${N}: 평균 ${num(m, 4)} s, 표준편차 s = ${num(s, 4)} s, 표준오차 s/√N = ${num(se, 4)} s → T = ${num(m, 3)} ± ${num(se, 3)} s`;
    });
  });

  // 11.2 최소제곱: 기울기를 바꾸며 제곱합을 본다
  Q.def("c3-fit", (fig, svg) => {
    const F = Q.frame(-0.05, 1.12, -0.3, 4.6, 60, 490, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const L = [0.2, 0.4, 0.6, 0.8, 1.0], T2 = [0.81, 1.61, 2.42, 3.22, 4.03];
    const mL = 0.6, mT = T2.reduce((a, b) => a + b, 0) / 5;
    Q.bind(fig, ({ a }) => {
      clear(g);
      axl(g, F, [0.2, 0.4, 0.6, 0.8, 1], [1, 2, 3, 4], "L (m)", "T² (s²)");
      const b = mT - a * mL, f = (x) => a * x + b;
      let S = 0;
      L.forEach((x, i) => { const r = T2[i] - f(x); S += r * r; Q.line(g, F.x(x), F.y(T2[i]), F.x(x), F.y(f(x)), "d"); });
      Q.plot(g, F, f, "a", 0, 1.1);
      L.forEach((x, i) => Q.dot(g, F.x(x), F.y(T2[i]), "fk", 4));
      read.textContent = `기울기 ${num(a, 3)} s²/m: 세로 거리 제곱의 합 ${num(S, 4)} (최소는 기울기 4.025에서). g = 4π²/기울기 = ${num((4 * PI * PI) / a, 2)} m/s²`;
    });
  });

  // 11.3 진폭이 크면 주기가 길어진다
  Q.def("c3-amp", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const P = Q.frame(-1.2, 1.2, -1.15, 0.15, 10, 200, 20, 260), F = Q.frame(-3, 62, 0.995, 1.08, 250, 500, 20, 250);
    const exact = (t0) => { const k = Math.sin(t0 / 2); let s = 1, c = 1; for (let n = 1; n < 40; n++) { c *= ((2 * n - 1) / (2 * n)) ** 2; s += c * k ** (2 * n); } return s; };
    Q.bind(fig, ({ d }) => {
      clear(g);
      const t0 = rad(d);
      Q.line(g, P.x(-0.4), P.y(0), P.x(0.4), P.y(0), "k");
      Q.line(g, P.x(0), P.y(0), P.x(0), P.y(-1), "gd dsh");
      Q.line(g, P.x(0), P.y(0), P.x(Math.sin(t0)), P.y(-Math.cos(t0)), "k"); el("circle", { cx: P.x(Math.sin(t0)), cy: P.y(-Math.cos(t0)), r: 9, class: "la" }, g);
      Q.line(g, F.x(0), F.y(1), F.x(60), F.y(1), "ax"); Q.line(g, F.x(0), F.y(0.995), F.x(0), F.y(1.08), "ax");
      [15, 30, 45, 60].forEach((v) => txt(g, F.x(v), F.y(1) + 14, `${v}°`, "s", "middle"));
      [1.02, 1.04, 1.06].forEach((v) => txt(g, F.x(0) - 4, F.y(v) + 4, num(v, 2), "s", "end"));
      txt(g, F.x(60), F.y(1.08) + 12, "T / T₀", "i", "end");
      Q.plot(g, F, (x) => exact(rad(x)), "a", 0, 60); Q.plot(g, F, (x) => 1 + rad(x) ** 2 / 16, "c dsh", 0, 60);
      Q.dot(g, F.x(d), F.y(exact(t0)), "fa", 5);
      read.textContent = `진폭 ${d}°: 주기가 작은 진폭일 때보다 ${num((exact(t0) - 1) * 100, 2)}% 길다 (근사식 1 + θ₀²/16로는 ${num((rad(d) ** 2 / 16) * 100, 2)}%). 이 차이로 g는 약 ${num((1 - 1 / exact(t0) ** 2) * 100, 1)}% 작게 나온다.`;
    });
  });

  // ── 새 그림은 이 위에 ──
})();
