/* 공통2(미적분2) 본문 카드의 조작 그림 (js/lib/qfig.js의 NMQ를 쓴다). 그림마다 NMQ.def("이름", …). */
(() => {
  "use strict";
  const Q = window.NMQ;
  if (!Q) return;
  const { el, clear, txt, num } = Q;
  const PI = Math.PI;
  // 직선 y = y0 + m(x − x0)을 틀 안에 그린다 (수직이면 세로선)
  const tangent = (g, F, x0, y0, m, cls) => {
    if (!isFinite(m) || Math.abs(m) > 1e4) Q.line(g, F.x(x0), F.Y0, F.x(x0), F.Y1, cls);
    else Q.plot(g, F, (x) => y0 + m * (x - x0), cls, null, null, 2);
  };

  /* 3차원 → 화면. az: z축 둘레로 돌린 각, ev: 내려다보는 각(라디안), s: 축척, (cx, cy): 원점의 화면 위치.
     돌려주는 P(x, y, z)는 [X, Y, 깊이]. 깊이가 클수록 화면 안쪽. */
  const view3 = (az, ev, s, cx, cy) => (x, y, z) => {
    const u = x * Math.cos(az) - y * Math.sin(az), w = x * Math.sin(az) + y * Math.cos(az);
    return [cx + s * u, cy - s * (z * Math.cos(ev) + w * Math.sin(ev)), w * Math.cos(ev) - z * Math.sin(ev)];
  };
  const L3 = (g, P, a, b, cls) => { const p = P(...a), q = P(...b); return Q.line(g, p[0], p[1], q[0], q[1], cls); };
  const A3 = (g, P, a, b, cls, fcls) => { const p = P(...a), q = P(...b); Q.arrow(g, p[0], p[1], q[0], q[1], cls, fcls); };
  const path3 = (g, P, pts, cls, close) => el("path", { d: pts.map((v, i) => { const p = P(...v); return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join("") + (close ? "Z" : ""), class: cls }, g);
  const T3 = (g, P, v, s, cls, anchor) => { const p = P(...v); return txt(g, p[0], p[1], s, cls, anchor); };
  const axes3 = (g, P, r, lab) => {
    [[[-r[0], 0, 0], [r[0], 0, 0], "x"], [[0, -r[1], 0], [0, r[1], 0], "y"], [[0, 0, -r[2]], [0, 0, r[2]], "z"]].forEach(([a, b, n]) => {
      L3(g, P, a, b, "ax"); if (lab !== false) T3(g, P, b.map((v) => v * 1.08), n, "i", "middle");
    });
  };
  // z = f(x, y)의 그물: x, y 범위를 n칸으로
  const mesh = (g, P, f, x0, x1, y0, y1, n, cls, clip) => {
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n, y = y0 + ((y1 - y0) * i) / n, A = [], B = [];
      for (let j = 0; j <= 40; j++) {
        const t = j / 40, yy = y0 + (y1 - y0) * t, xx = x0 + (x1 - x0) * t;
        const z1 = f(x, yy), z2 = f(xx, y);
        if (isFinite(z1) && (!clip || Math.abs(z1) <= clip)) A.push([x, yy, z1]); else if (A.length) { path3(g, P, A.splice(0), cls); }
        if (isFinite(z2) && (!clip || Math.abs(z2) <= clip)) B.push([xx, y, z2]); else if (B.length) { path3(g, P, B.splice(0), cls); }
      }
      if (A.length > 1) path3(g, P, A, cls); if (B.length > 1) path3(g, P, B, cls);
    }
  };
  // 매개곡면 r(u, v)의 그물
  const pmesh = (g, P, r, u0, u1, v0, v1, nu, nv, cls) => {
    for (let i = 0; i <= nu; i++) { const u = u0 + ((u1 - u0) * i) / nu, pts = []; for (let j = 0; j <= 40; j++) pts.push(r(u, v0 + ((v1 - v0) * j) / 40)); path3(g, P, pts, cls); }
    for (let j = 0; j <= nv; j++) { const v = v0 + ((v1 - v0) * j) / nv, pts = []; for (let i = 0; i <= 40; i++) pts.push(r(u0 + ((u1 - u0) * i) / 40, v)); path3(g, P, pts, cls); }
  };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const norm = (a) => Math.hypot(...a);

  // 1.1 외적: xy평면의 a, b와 a × b
  Q.def("c2-cross", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ t, az }) => {
      clear(g);
      const P = view3((az * PI) / 180, 0.45, 55, 260, 175), th = (t * PI) / 180;
      const a = [2.2, 0, 0], b = [1.8 * Math.cos(th), 1.8 * Math.sin(th), 0], c = cross(a, b), s = 0.55;
      axes3(g, P, [3, 3, 2.4]);
      path3(g, P, [[0, 0, 0], a, [a[0] + b[0], a[1] + b[1], 0], b], "lb", true);
      A3(g, P, [0, 0, 0], a, "a", "fa"); A3(g, P, [0, 0, 0], b, "b", "fb");
      if (norm(c) > 0.02) A3(g, P, [0, 0, 0], c.map((v) => v * s), "d", "fd");
      T3(g, P, a.map((v) => v * 1.08), "a", "ta"); T3(g, P, b.map((v) => v * 1.12), "b", "tb");
      if (norm(c) > 0.02) T3(g, P, [0.1, 0.1, c[2] * s + 0.2], "a × b", "td");
      read.textContent = `θ = ${t}°: 평행사변형 넓이 |a||b|sin θ = 2.2 × 1.8 × ${num(Math.sin(th), 3)} = ${num(norm(c), 3)} = |a × b|`;
    });
  });

  // 1.2 평면, 법선, 점까지의 거리: 평면 z = 0.3x + 0.2y + 0.5, 점 (1, 1, 2.6)
  Q.def("c2-plane", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const zf = (x, y) => 0.3 * x + 0.2 * y + 0.5, n = [-0.3, -0.2, 1], pt = [1, 1, 2.6];
    Q.bind(fig, ({ az }) => {
      clear(g);
      const P = view3((az * PI) / 180, 0.4, 50, 260, 190);
      axes3(g, P, [3, 3, 3]);
      path3(g, P, [[-2, -2, zf(-2, -2)], [2, -2, zf(2, -2)], [2, 2, zf(2, 2)], [-2, 2, zf(-2, 2)]], "lb", true);
      mesh(g, P, zf, -2, 2, -2, 2, 4, "gd");
      const nn = norm(n), d = (dot(n, pt) - dot(n, [0, 0, 0.5])) / nn, foot = pt.map((v, i) => v - (d * n[i]) / nn);
      A3(g, P, [0, 0, 0.5], n.map((v, i) => [0, 0, 0.5][i] + v * 1.1), "a", "fa"); T3(g, P, [-0.4, -0.3, 1.75], "n", "ta");
      L3(g, P, pt, foot, "d dsh");
      const p = P(...pt), f = P(...foot); Q.dot(g, p[0], p[1], "fd", 5); Q.dot(g, f[0], f[1], "fk", 3);
      T3(g, P, [pt[0] + 0.15, pt[1], pt[2]], "점", "td");
      read.textContent = `평면 0.3x + 0.2y − z = −0.5, 점 (1, 1, 2.6)까지의 거리 = |0.3 + 0.2 − 2.6 + 0.5| / √(0.09 + 0.04 + 1) = ${num(Math.abs(d), 3)}`;
    });
  });

  // 1.3 이차곡면
  Q.def("c2-quadric", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const N = ["쌍곡 포물면 z = y² − x²: 수평 단면 쌍곡선, 수직 단면 포물선", "타원 포물면 z = x² + y²: 수평 단면 원, 수직 단면 포물선", "타원면 x²/4 + y² + z²/2.25 = 1: 모든 단면이 타원", "원뿔 z² = x² + y²: 수평 단면 원, 수직 단면 두 직선", "일엽 쌍곡면 x² + y² − z² = 1: 수평 단면 원, 수직 단면 쌍곡선"];
    Q.bind(fig, ({ k, az }) => {
      clear(g);
      const P = view3((az * PI) / 180, 0.4, k === 2 ? 52 : 46, 260, 150);
      axes3(g, P, [2.6, 2.6, 2.4]);
      if (k === 0) mesh(g, P, (x, y) => y * y - x * x, -1.5, 1.5, -1.5, 1.5, 10, "a");
      else if (k === 1) pmesh(g, P, (r, t) => [r * Math.cos(t), r * Math.sin(t), r * r], 0, 1.5, 0, 2 * PI, 6, 16, "a");
      else if (k === 2) pmesh(g, P, (u, v) => [2 * Math.sin(u) * Math.cos(v), Math.sin(u) * Math.sin(v), 1.5 * Math.cos(u)], 0, PI, 0, 2 * PI, 8, 16, "a");
      else if (k === 3) pmesh(g, P, (z, t) => [Math.abs(z) * Math.cos(t), Math.abs(z) * Math.sin(t), z], -1.8, 1.8, 0, 2 * PI, 12, 16, "a");
      else pmesh(g, P, (z, t) => [Math.sqrt(1 + z * z) * Math.cos(t), Math.sqrt(1 + z * z) * Math.sin(t), z], -1.6, 1.6, 0, 2 * PI, 8, 16, "a");
      read.textContent = N[k];
    });
  });

  // 1.4 행렬식: 끌 수 있는 u, v
  Q.def("c2-det", (fig, svg) => {
    const F = Q.frame(-3.5, 5, -2.6, 4, 40, 480, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    let u = [3, 1], v = [1, 2];
    const draw = () => {
      clear(g);
      Q.axes(g, F, { step: 1 });
      const d = u[0] * v[1] - u[1] * v[0];
      el("path", { d: `M${F.x(0)} ${F.y(0)}L${F.x(u[0])} ${F.y(u[1])}L${F.x(u[0] + v[0])} ${F.y(u[1] + v[1])}L${F.x(v[0])} ${F.y(v[1])}Z`, class: d >= 0 ? "la" : "ld" }, g);
      Q.arrow(g, F.x(0), F.y(0), F.x(u[0]), F.y(u[1]), "a", "fa"); Q.arrow(g, F.x(0), F.y(0), F.x(v[0]), F.y(v[1]), "b", "fb");
      txt(g, F.x(u[0]) + 8, F.y(u[1]) + 4, "⟨a, b⟩", "ta"); txt(g, F.x(v[0]) + 8, F.y(v[1]) - 4, "⟨c, d⟩", "tb");
      const hu = Q.dot(g, F.x(u[0]), F.y(u[1]), "fa", 8), hv = Q.dot(g, F.x(v[0]), F.y(v[1]), "fb", 8);
      hu.setAttribute("fill-opacity", "0.35"); hv.setAttribute("fill-opacity", "0.35");
      const sn = (X, Y) => [Math.round(Math.max(-3, Math.min(4.5, F.ix(X))) * 2) / 2, Math.round(Math.max(-2.3, Math.min(3.7, F.iy(Y))) * 2) / 2];
      Q.drag(svg, hu, (X, Y) => { u = sn(X, Y); draw(); }); Q.drag(svg, hv, (X, Y) => { v = sn(X, Y); draw(); });
      read.textContent = `ad − bc = ${num(u[0])}·${num(v[1])} − ${num(u[1])}·${num(v[0])} = ${num(d)}, 넓이 ${num(Math.abs(d))}` + (Math.abs(d) < 1e-9 ? " (두 벡터가 한 직선 위)" : d < 0 ? " (음수: 둘째 벡터가 첫째의 오른쪽)" : "");
    };
    draw();
  });

  // 2.1 일차독립: u, v는 xy평면, w의 높이 h
  Q.def("c2-indep", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ h, az }) => {
      clear(g);
      const P = view3((az * PI) / 180, 0.45, 52, 250, 170), u = [2, 0.3, 0], v = [0.4, 1.8, 0], w = [1, 1, h];
      axes3(g, P, [3, 2.6, 2]);
      const V = dot(w, cross(u, v)), o = [0, 0, 0];
      const add = (...vs) => vs.reduce((s, x) => s.map((c, i) => c + x[i]), [0, 0, 0]);
      path3(g, P, [o, u, add(u, v), v], "lb", true);
      if (Math.abs(h) > 0.02) {
        path3(g, P, [w, add(w, u), add(w, u, v), add(w, v)], "gd", true);
        [o, u, add(u, v), v].forEach((p) => L3(g, P, p, add(p, w), "gd"));
      }
      A3(g, P, o, u, "a", "fa"); A3(g, P, o, v, "b", "fb"); A3(g, P, o, w, "d", "fd");
      T3(g, P, u.map((x) => x * 1.1), "u", "ta"); T3(g, P, v.map((x) => x * 1.12), "v", "tb"); T3(g, P, [w[0] + 0.1, w[1], w[2] + 0.15], "w", "td");
      read.textContent = `부피 |w · (u × v)| = ${num(Math.abs(V), 3)}` + (Math.abs(V) < 0.02 ? " → 세 벡터가 한 평면 위 (일차종속)" : " → 일차독립");
    });
  });

  // 2.2 기저 {⟨1, 1⟩, ⟨1, −1⟩}의 비스듬한 눈금
  Q.def("c2-basis", (fig, svg) => {
    const F = Q.frame(-1.5, 7, -3.2, 4.6, 40, 480, 10, 270), g = el("g", {}, svg), b1 = [1, 1], b2 = [1, -1];
    Q.axes(g, F, { step: 1, label: true });
    const cp = el("clipPath", { id: "c2-basis-clip" }, el("defs", {}, svg));
    el("rect", { x: F.X0, y: F.Y0, width: F.X1 - F.X0, height: F.Y1 - F.Y0 }, cp);
    const gl = el("g", { "clip-path": "url(#c2-basis-clip)", style: "opacity:.45" }, g);
    for (let k = -6; k <= 8; k++) {
      Q.line(gl, F.x(k * b1[0] - 8 * b2[0]), F.y(k * b1[1] - 8 * b2[1]), F.x(k * b1[0] + 8 * b2[0]), F.y(k * b1[1] + 8 * b2[1]), "b dsh");
      Q.line(gl, F.x(k * b2[0] - 8 * b1[0]), F.y(k * b2[1] - 8 * b1[1]), F.x(k * b2[0] + 8 * b1[0]), F.y(k * b2[1] + 8 * b1[1]), "c dsh");
    }
    Q.arrow(g, F.x(0), F.y(0), F.x(3), F.y(3), "b", "fb"); Q.arrow(g, F.x(3), F.y(3), F.x(5), F.y(1), "c", "fc");
    Q.arrow(g, F.x(0), F.y(0), F.x(1), F.y(1), "a", "fa"); Q.arrow(g, F.x(0), F.y(0), F.x(1), F.y(-1), "a", "fa");
    Q.dot(g, F.x(5), F.y(1), "fd", 5); txt(g, F.x(5) + 8, F.y(1) + 4, "⟨5, 1⟩", "td");
    txt(g, F.x(1.5), F.y(2.4), "3 × ⟨1, 1⟩", "tb"); txt(g, F.x(4.3), F.y(2.5), "2 × ⟨1, −1⟩", "tc");
  });

  // 2.3 일차변환과 글자 F
  Q.def("c2-linmap", (fig, svg) => {
    const F = Q.frame(-3, 3.6, -2.3, 2.6, 60, 460, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const Fpts = [[0.2, 0.15], [0.2, 0.85], [0.75, 0.85], [0.75, 0.72], [0.35, 0.72], [0.35, 0.55], [0.65, 0.55], [0.65, 0.42], [0.35, 0.42], [0.35, 0.15]];
    Q.bind(fig, ({ k, s }) => {
      clear(g);
      Q.axes(g, F, { step: 1 });
      let M, name;
      if (k === 0) { const t = s * PI / 2; M = [[Math.cos(t), -Math.sin(t)], [Math.sin(t), Math.cos(t)]]; name = `${num(s * 90)}° 회전`; }
      else if (k === 1) { M = [[1, 0], [0, -1]]; name = "x축 대칭 (값과 상관없음)"; }
      else if (k === 2) { M = [[s, 0], [0, s]]; name = `${num(s)}배 확대`; }
      else { M = [[1, s], [0, 1]]; name = `층밀림 k = ${num(s)}`; }
      const T = ([x, y]) => [M[0][0] * x + M[0][1] * y, M[1][0] * x + M[1][1] * y];
      const poly = (pts, cls) => el("path", { d: pts.map((p, i) => (i ? "L" : "M") + F.x(p[0]) + " " + F.y(p[1])).join("") + "Z", class: cls }, g);
      poly([[0, 0], [1, 0], [1, 1], [0, 1]], "lk"); poly(Fpts, "k");
      poly([[0, 0], [1, 0], [1, 1], [0, 1]].map(T), "la"); poly(Fpts.map(T), "d");
      Q.arrow(g, F.x(0), F.y(0), F.x(T([1, 0])[0]), F.y(T([1, 0])[1]), "a", "fa"); Q.arrow(g, F.x(0), F.y(0), F.x(T([0, 1])[0]), F.y(T([0, 1])[1]), "b", "fb");
      const det = M[0][0] * M[1][1] - M[0][1] * M[1][0];
      read.textContent = `${name}: 행렬 [[${num(M[0][0])}, ${num(M[0][1])}], [${num(M[1][0])}, ${num(M[1][1])}]], det = ${num(det)}` + (det < 0 ? " (뒤집힘)" : "");
    });
  });

  // 3.1 나선
  Q.def("c2-helix", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ t, az }) => {
      clear(g);
      const P = view3((az * PI) / 180, 0.35, 42, 260, 255), sc = 0.38;
      axes3(g, P, [2, 2, 5.4]);
      const pts = [], sh = [];
      for (let i = 0; i <= 200; i++) { const s = (12.5 * i) / 200; pts.push([1.6 * Math.cos(s), 1.6 * Math.sin(s), s * sc]); sh.push([1.6 * Math.cos(s), 1.6 * Math.sin(s), 0]); }
      path3(g, P, sh.slice(0, 64), "gd"); path3(g, P, pts, "k dsh");
      path3(g, P, pts.filter((_, i) => (12.5 * i) / 200 <= t), "a");
      const p = [1.6 * Math.cos(t), 1.6 * Math.sin(t), t * sc];
      A3(g, P, [0, 0, 0], p, "b", "fb"); L3(g, P, p, [p[0], p[1], 0], "ax dsh");
      const q = P(...p); Q.dot(g, q[0], q[1], "fd", 5);
      read.textContent = `t = ${num(t)}: r(t) = ⟨cos t, sin t, t⟩ = ⟨${num(Math.cos(t), 3)}, ${num(Math.sin(t), 3)}, ${num(t, 2)}⟩ (그림은 높이를 줄여 그렸다)`;
    });
  });

  // 3.2 포물선 운동
  Q.def("c2-proj", (fig, svg) => {
    const F = Q.frame(-1, 22, -0.6, 7.5, 40, 500, 10, 250), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ t }) => {
      clear(g);
      Q.axes(g, F, { step: 5, xs: "x", ys: "z" });
      let d = ""; for (let i = 0; i <= 80; i++) { const s = (2.04 * i) / 80; d += (i ? "L" : "M") + F.x(10 * s) + " " + F.y(10 * s - 4.9 * s * s); }
      el("path", { d, class: "k dsh" }, g);
      const x = 10 * t, z = 10 * t - 4.9 * t * t, vz = 10 - 9.8 * t, k = 0.25;
      Q.arrow(g, F.x(x), F.y(z), F.x(x + 10 * k), F.y(z + vz * k), "b", "fb");
      Q.arrow(g, F.x(x), F.y(z), F.x(x), F.y(z - 9.8 * k), "d", "fd");
      Q.dot(g, F.x(x), F.y(z), "fk", 5);
      txt(g, F.x(x + 10 * k) + 4, F.y(z + vz * k), "v", "tb"); txt(g, F.x(x) + 6, F.y(z - 9.8 * k) + 4, "a", "td");
      read.textContent = `t = ${num(t)} s: 위치 (${num(x, 2)}, ${num(z, 2)}), 속도 ⟨10, ${num(vz, 2)}⟩, 가속도 ⟨0, −9.8⟩`;
    });
  });

  // 3.3 곡률원: y = x²
  Q.def("c2-osc", (fig, svg) => {
    const F = Q.frame(-2.6, 2.6, -0.5, 3.4, 60, 460, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ x }) => {
      clear(g);
      Q.axes(g, F, { step: 1 });
      Q.plot(g, F, (s) => s * s, "k", -2.6, 2.6);
      const fp = 2 * x, k = 2 / Math.pow(1 + fp * fp, 1.5), R = 1 / k, nx = -fp / Math.hypot(1, fp), ny = 1 / Math.hypot(1, fp);
      const cx = x + R * nx, cy = x * x + R * ny;
      const cp = el("clipPath", { id: "c2-osc-clip" }, el("defs", {}, g)); el("rect", { x: F.X0, y: F.Y0, width: F.X1 - F.X0, height: F.Y1 - F.Y0 }, cp);
      el("circle", { cx: F.x(cx), cy: F.y(cy), r: F.x(R) - F.x(0), class: "a", "clip-path": "url(#c2-osc-clip)" }, g);
      Q.line(g, F.x(x), F.y(x * x), F.x(cx), F.y(cy), "a dsh");
      Q.dot(g, F.x(x), F.y(x * x), "fd", 5); Q.dot(g, F.x(cx), F.y(cy), "fa", 3);
      read.textContent = `x = ${num(x)}: 곡률 κ = 2/(1 + 4x²)^(3/2) = ${num(k, 3)}, 곡률원의 반지름 1/κ = ${num(R, 3)}`;
    });
  });

  // 4.1 경로에 따른 극한: xy/(x² + y²)
  Q.def("c2-paths", (fig, svg) => {
    const F = Q.frame(-2, 2, -2, 2, 120, 400, 5, 275), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const val = (th) => Math.sin(2 * th) / 2;
    Q.bind(fig, ({ a }) => {
      clear(g);
      const N = 72;
      for (let i = 0; i < N; i++) {
        const t0 = (2 * PI * i) / N, t1 = (2 * PI * (i + 1)) / N, v = val((t0 + t1) / 2), R = 1.95;
        el("path", { d: `M${F.x(0)} ${F.y(0)}L${F.x(R * Math.cos(t0))} ${F.y(R * Math.sin(t0))}L${F.x(R * Math.cos(t1))} ${F.y(R * Math.sin(t1))}Z`, class: v >= 0 ? "la" : "ld", style: `opacity:${(Math.abs(v) * 2).toFixed(2)}` }, g);
      }
      Q.line(g, F.X0, F.y(0), F.X1, F.y(0), "ax"); Q.line(g, F.x(0), F.Y0, F.x(0), F.Y1, "ax");
      const th = (a * PI) / 180, c = Math.cos(th), s = Math.sin(th);
      Q.line(g, F.x(-1.9 * c), F.y(-1.9 * s), F.x(1.9 * c), F.y(1.9 * s), "k");
      [1.5, 1, 0.5, 0.2].forEach((r) => Q.dot(g, F.x(r * c), F.y(r * s), "fk", 3));
      txt(g, F.X1 - 4, F.y(0) - 6, "x", "i", "end"); txt(g, F.x(0) + 6, F.Y0 + 12, "y", "i");
      read.textContent = `${a}° 방향의 직선을 따라 원점에 다가가면 값은 계속 ${num(val(th), 3)}이다 (m = tan ${a}°일 때 m/(1 + m²)).`;
    });
  });

  // 4.2 편도함수: 단면 곡선과 접선, f = 1.2 − 0.5x² − 0.3y² + 0.3xy
  Q.def("c2-partial", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const f = (x, y) => 1.2 - 0.5 * x * x - 0.3 * y * y + 0.3 * x * y, fx = (x, y) => -x + 0.3 * y, a = 0.5;
    Q.bind(fig, ({ b, az }) => {
      clear(g);
      const P = view3((az * PI) / 180, 0.45, 70, 260, 175);
      axes3(g, P, [2, 2, 1.8]);
      mesh(g, P, f, -1.4, 1.4, -1.4, 1.4, 8, "gd");
      path3(g, P, [[-1.5, b, -0.3], [1.5, b, -0.3], [1.5, b, 1.5], [-1.5, b, 1.5]], "lk", true);
      const cur = []; for (let i = 0; i <= 40; i++) { const x = -1.4 + (2.8 * i) / 40; cur.push([x, b, f(x, b)]); }
      path3(g, P, cur, "c");
      const m = fx(a, b), z0 = f(a, b);
      L3(g, P, [a - 0.8, b, z0 - 0.8 * m], [a + 0.8, b, z0 + 0.8 * m], "d");
      const p = P(a, b, z0); Q.dot(g, p[0], p[1], "fd", 5);
      read.textContent = `y = ${num(b)}로 자른 곡선의 x = ${a}에서 기울기 f_x(${a}, ${num(b)}) = −x + 0.3y = ${num(m, 3)}`;
    });
  });

  // 4.3 접평면 확대: z = 2x² + y², (1, 1, 3)
  Q.def("c2-tplane", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const f = (x, y) => 2 * x * x + y * y, T = (x, y) => 4 * x + 2 * y - 3;
    Q.bind(fig, ({ w, az }) => {
      clear(g);
      const s = 95 / w, zs = 1 / (5 * w);
      const P0 = view3((az * PI) / 180, 0.5, s, 260, 150), P = (x, y, z) => P0(x - 1, y - 1, (z - 3) * zs * w * 1.0);
      mesh(g, P, T, 1 - w, 1 + w, 1 - w, 1 + w, 6, "c");
      mesh(g, P, f, 1 - w, 1 + w, 1 - w, 1 + w, 6, "a");
      const p = P(1, 1, 3); Q.dot(g, p[0], p[1], "fd", 5);
      const x1 = 1 + 0.8 * w, y1 = 1 - 0.4 * w;
      read.textContent = `범위 ±${num(w)}: 끝점 (${num(x1, 3)}, ${num(y1, 3)})에서 곡면 ${num(f(x1, y1), 4)}, 접평면 ${num(T(x1, y1), 4)}, 차이 ${num(f(x1, y1) - T(x1, y1), 4)}`;
    });
  });

  // 칸마다 색을 칠한 높이 지도 (양수는 파랑, 음수는 주황 계열, 진할수록 큰 값)
  const heat = (g, F, f, x0, x1, y0, y1, n, scale) => {
    const dx = (x1 - x0) / n, dy = (y1 - y0) / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const v = f(x0 + (i + 0.5) * dx, y0 + (j + 0.5) * dy), a = Math.min(1, Math.abs(v) / scale);
      el("rect", { x: F.x(x0 + i * dx), y: F.y(y0 + (j + 1) * dy), width: F.x(dx) - F.x(0) + 0.5, height: F.y(0) - F.y(dy) + 0.5, class: v >= 0 ? "la" : "lc", style: `opacity:${(0.15 + 0.85 * a).toFixed(2)}` }, g);
    }
  };

  // 4.4 연쇄법칙: z = x²y + 3xy⁴, 경로 (sin 2t, cos t)
  Q.def("c2-chain", (fig, svg) => {
    const F = Q.frame(-1.3, 1.3, -1.3, 1.3, 120, 400, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const z = (x, y) => x * x * y + 3 * x * y ** 4, zx = (x, y) => 2 * x * y + 3 * y ** 4, zy = (x, y) => x * x + 12 * x * y ** 3;
    const bg = el("g", {}, g), fg = el("g", {}, g);
    heat(bg, F, z, -1.3, 1.3, -1.3, 1.3, 26, 3);
    let d = ""; for (let i = 0; i <= 160; i++) { const s = (2 * PI * i) / 160; d += (i ? "L" : "M") + F.x(Math.sin(2 * s)) + " " + F.y(Math.cos(s)); }
    el("path", { d, class: "k" }, bg);
    Q.line(bg, F.X0, F.y(0), F.X1, F.y(0), "ax"); Q.line(bg, F.x(0), F.Y0, F.x(0), F.Y1, "ax");
    Q.bind(fig, ({ t }) => {
      clear(fg);
      const x = Math.sin(2 * t), y = Math.cos(t), vx = 2 * Math.cos(2 * t), vy = -Math.sin(t), gx = zx(x, y), gy = zy(x, y), k = 0.12;
      Q.arrow(fg, F.x(x), F.y(y), F.x(x + k * gx), F.y(y + k * gy), "b", "fb");
      Q.arrow(fg, F.x(x), F.y(y), F.x(x + k * vx), F.y(y + k * vy), "c", "fc");
      Q.dot(fg, F.x(x), F.y(y), "fd", 5);
      read.textContent = `t = ${num(t)}: ∇z = ⟨${num(gx, 2)}, ${num(gy, 2)}⟩, 속도 ⟨${num(vx, 2)}, ${num(vy, 2)}⟩, dz/dt = ${num(gx * vx + gy * vy, 3)}`;
    });
  });

  // 4.5 기울기 벡터와 방향도함수: f = x² + 2y², 점 (1, 0.7)
  Q.def("c2-grad", (fig, svg) => {
    const F = Q.frame(-2.2, 2.2, -1.6, 1.6, 90, 430, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const p = [1, 0.7], gr = [2, 2.8], gl = Math.hypot(...gr);
    Q.bind(fig, ({ a }) => {
      clear(g);
      [0.5, 1, 1.98, 3, 4].forEach((c) => el("ellipse", { cx: F.x(0), cy: F.y(0), rx: F.x(Math.sqrt(c)) - F.x(0), ry: F.y(0) - F.y(Math.sqrt(c / 2)), class: Math.abs(c - 1.98) < 0.01 ? "k" : "gd" }, g));
      Q.line(g, F.X0, F.y(0), F.X1, F.y(0), "ax"); Q.line(g, F.x(0), F.Y0, F.x(0), F.Y1, "ax");
      const th = (a * PI) / 180, u = [Math.cos(th), Math.sin(th)], D = gr[0] * u[0] + gr[1] * u[1], k = 0.22;
      Q.arrow(g, F.x(p[0]), F.y(p[1]), F.x(p[0] + k * gr[0]), F.y(p[1] + k * gr[1]), "b", "fb");
      Q.arrow(g, F.x(p[0]), F.y(p[1]), F.x(p[0] + 0.6 * u[0]), F.y(p[1] + 0.6 * u[1]), "c", "fc");
      Q.dot(g, F.x(p[0]), F.y(p[1]), "fd", 5);
      txt(g, F.x(p[0] + k * gr[0]) + 4, F.y(p[1] + k * gr[1]), "∇f", "tb"); txt(g, F.x(p[0] + 0.62 * u[0]) + 4, F.y(p[1] + 0.62 * u[1]) + 12, "u", "tc");
      read.textContent = `∇f(1, 0.7) = ⟨2, 2.8⟩, |∇f| = ${num(gl, 3)}. u = ⟨${num(u[0], 2)}, ${num(u[1], 2)}⟩ 방향의 변화율 ∇f·u = ${num(D, 3)}`;
    });
  });

  // 5.1 극값과 안장점: f = x⁴ + y⁴ − 4xy + 1
  Q.def("c2-extrema", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const f = (x, y) => x ** 4 + y ** 4 - 4 * x * y + 1, zs = 0.35;
    Q.bind(fig, ({ az }) => {
      clear(g);
      const P0 = view3((az * PI) / 180, 0.5, 68, 260, 160), P = (x, y, z) => P0(x, y, z * zs);
      axes3(g, P, [2, 2, 4], false);
      mesh(g, P, f, -1.6, 1.6, -1.6, 1.6, 12, "a", 6);
      [[1, 1, "fb"], [-1, -1, "fb"], [0, 0, "fd"]].forEach(([x, y, c]) => { const p = P(x, y, f(x, y)); Q.dot(g, p[0], p[1], c, 5); });
      read.textContent = "임계점 (1, 1), (−1, −1): f = −1, D = 128 > 0, f_xx = 12 > 0이라 극소. (0, 0): f = 1, D = −16 < 0이라 안장점.";
    });
  });

  // 5.2 직사각형 위의 최대·최소: f = x² − 2xy + 2y
  Q.def("c2-absmax", (fig, svg) => {
    const F = Q.frame(-0.4, 3.4, -0.3, 2.3, 60, 460, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const f = (x, y) => x * x - 2 * x * y + 2 * y, bg = el("g", {}, g), fg = el("g", {}, g);
    heat(bg, F, f, 0, 3, 0, 2, 24, 9);
    el("rect", { x: F.x(0), y: F.y(2), width: F.x(3) - F.x(0), height: F.y(0) - F.y(2), class: "k" }, bg);
    [[3, 0, "9 (최대)", "td"], [0, 0, "0", "tb"], [2, 2, "0", "tb"], [1, 1, "1 (안장점)", "s"]].forEach(([x, y, s, c]) => { Q.dot(bg, F.x(x), F.y(y), c === "td" ? "fd" : c === "tb" ? "fb" : "fk", 4); txt(bg, F.x(x) + 6, F.y(y) - 6, s, c); });
    const at = (s) => (s <= 3 ? [s, 0] : s <= 5 ? [3, s - 3] : s <= 8 ? [8 - s, 2] : [0, 10 - s]);
    Q.bind(fig, ({ s }) => {
      clear(fg);
      const [x, y] = at(s);
      Q.dot(fg, F.x(x), F.y(y), "fc", 6);
      const side = s <= 3 ? "아랫변 f = x²" : s <= 5 ? "오른쪽 변 f = 9 − 4y" : s <= 8 ? "윗변 f = (x − 2)²" : "왼쪽 변 f = 2y";
      read.textContent = `점 (${num(x, 2)}, ${num(y, 2)}), ${side}, 값 ${num(f(x, y), 3)}`;
    });
  });

  // 5.3 라그랑주: 단위원과 x² + 2y² = c
  Q.def("c2-lagrange", (fig, svg) => {
    const F = Q.frame(-2.2, 2.2, -1.6, 1.6, 90, 430, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ c }) => {
      clear(g);
      Q.line(g, F.X0, F.y(0), F.X1, F.y(0), "ax"); Q.line(g, F.x(0), F.Y0, F.x(0), F.Y1, "ax");
      el("circle", { cx: F.x(0), cy: F.y(0), r: F.x(1) - F.x(0), class: "a" }, g);
      el("ellipse", { cx: F.x(0), cy: F.y(0), rx: F.x(Math.sqrt(c)) - F.x(0), ry: F.y(0) - F.y(Math.sqrt(c / 2)), class: "c" }, g);
      let msg;
      if (c < 1 - 1e-6 || c > 2 + 1e-6) msg = "타원이 원과 만나지 않는다. 원 위에서 f가 이 값을 가질 수 없다.";
      else if (Math.abs(c - 1) < 0.011) { msg = "c = 1: 타원이 원에 (±1, 0)에서 접한다 → 최솟값 1"; [[1, 0], [-1, 0]].forEach(([x, y]) => Q.dot(g, F.x(x), F.y(y), "fd", 5)); }
      else if (Math.abs(c - 2) < 0.011) { msg = "c = 2: 타원이 원에 (0, ±1)에서 접한다 → 최댓값 2"; [[0, 1], [0, -1]].forEach(([x, y]) => Q.dot(g, F.x(x), F.y(y), "fd", 5)); }
      else { const y = Math.sqrt(c - 1), x = Math.sqrt(1 - y * y); [[x, y], [-x, y], [x, -y], [-x, -y]].forEach(([a, b]) => Q.dot(g, F.x(a), F.y(b), "fk", 4)); msg = `c = ${num(c)}: 타원이 원을 네 점에서 가로지른다. 원 위에는 이보다 큰 값도 작은 값도 있다.`; }
      read.textContent = msg;
    });
  });

  // 6.1 이중적분을 기둥으로: f = sin x cos y on [0, π/2]²
  Q.def("c2-boxes", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read"), f = (x, y) => Math.sin(x) * Math.cos(y), L = PI / 2;
    Q.bind(fig, ({ n, az }) => {
      clear(g);
      const P0 = view3((az * PI) / 180, 0.5, 120, 250, 200), P = (x, y, z) => P0(x - L / 2, y - L / 2, z * 0.9);
      const h = L / n, boxes = [];
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) boxes.push([i, j]);
      const depth = (i, j) => P((i + 0.5) * h, (j + 0.5) * h, 0)[2];
      boxes.sort((a, b) => depth(b[0], b[1]) - depth(a[0], a[1]));
      let S = 0;
      boxes.forEach(([i, j]) => {
        const x0 = i * h, y0 = j * h, z = f(x0 + h / 2, y0 + h / 2); S += z * h * h;
        const top = [[x0, y0, z], [x0 + h, y0, z], [x0 + h, y0 + h, z], [x0, y0 + h, z]];
        [[[x0, y0, 0], [x0 + h, y0, 0], [x0 + h, y0, z], [x0, y0, z]], [[x0 + h, y0, 0], [x0 + h, y0 + h, 0], [x0 + h, y0 + h, z], [x0 + h, y0, z]], [[x0, y0 + h, 0], [x0 + h, y0 + h, 0], [x0 + h, y0 + h, z], [x0, y0 + h, z]], [[x0, y0, 0], [x0, y0 + h, 0], [x0, y0 + h, z], [x0, y0, z]]].forEach((side) => path3(g, P, side, "lk", true).setAttribute("style", "stroke:var(--fa);stroke-width:.6"));
        path3(g, P, top, "la", true).setAttribute("style", "stroke:var(--fa);stroke-width:.6");
      });
      mesh(g, P, f, 0, L, 0, L, 6, "d");
      read.textContent = `${n} × ${n}개 기둥의 부피 합 ${num(S, 4)}, 이중적분의 값 1`;
    });
  });

  // 6.2 세로 띠와 가로 띠: 삼각형 (0,0), (0,1), (1,1)
  Q.def("c2-order", (fig, svg) => {
    const F = Q.frame(-0.2, 1.3, -0.15, 1.2, 130, 390, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ m, t }) => {
      clear(g);
      Q.axes(g, F, { step: 0.5 });
      el("path", { d: `M${F.x(0)} ${F.y(0)}L${F.x(0)} ${F.y(1)}L${F.x(1)} ${F.y(1)}Z`, class: "lb" }, g);
      Q.plot(g, F, (x) => x, "ax dsh", -0.1, 1.2);
      const w = 0.03;
      if (!m) { el("rect", { x: F.x(t - w), y: F.y(1), width: F.x(2 * w) - F.x(0), height: F.y(t) - F.y(1), class: "lc", style: "stroke:var(--fc)" }, g); txt(g, F.x(t) + 8, F.y(t) + 14, "y = x", "tc"); txt(g, F.x(t) + 8, F.y(1) - 6, "y = 1", "tc"); }
      else { el("rect", { x: F.x(0), y: F.y(t + w), width: F.x(t) - F.x(0), height: F.y(0) - F.y(2 * w), class: "lc", style: "stroke:var(--fc)" }, g); txt(g, F.x(0) - 6, F.y(t) + 4, "x = 0", "tc", "end"); txt(g, F.x(t) + 6, F.y(t) + 4, "x = y", "tc"); }
      txt(g, F.x(1.05), F.y(1.05), "y = x", "s");
      read.textContent = m ? `y = ${num(t)}에서 가로 띠는 x = 0부터 x = ${num(t)}까지 → ∫₀¹ ∫₀^y sin(y²) dx dy` : `x = ${num(t)}에서 세로 띠는 y = ${num(t)}부터 y = 1까지 → ∫₀¹ ∫ₓ¹ sin(y²) dy dx`;
    });
  });

  // 6.3 극좌표 넓이 요소
  Q.def("c2-polar", (fig, svg) => {
    const F = Q.frame(-2.2, 2.2, -2, 2, 110, 410, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const dr = 0.2, dt = PI / 12;
    Q.bind(fig, ({ r }) => {
      clear(g);
      for (let k = 1; k <= 10; k++) el("circle", { cx: F.x(0), cy: F.y(0), r: F.x(k * dr) - F.x(0), class: "gd" }, g);
      for (let k = 0; k < 24; k++) Q.line(g, F.x(0), F.y(0), F.x(2 * Math.cos(k * dt)), F.y(2 * Math.sin(k * dt)), "gd");
      const r0 = Math.floor(r / dr) * dr, t0 = 2 * dt;
      const pt = (rr, tt) => `${F.x(rr * Math.cos(tt))} ${F.y(rr * Math.sin(tt))}`, R = (rr) => F.x(rr) - F.x(0);
      el("path", { d: `M${pt(r0, t0)}L${pt(r0 + dr, t0)}A${R(r0 + dr)} ${R(r0 + dr)} 0 0 0 ${pt(r0 + dr, t0 + dt)}L${pt(r0, t0 + dt)}A${R(r0)} ${R(r0)} 0 0 1 ${pt(r0, t0)}Z`, class: "la", style: "stroke:var(--fa);stroke-width:1.5" }, g);
      el("path", { d: `M${pt(dr, t0)}L${pt(2 * dr, t0)}A${R(2 * dr)} ${R(2 * dr)} 0 0 0 ${pt(2 * dr, t0 + dt)}L${pt(dr, t0 + dt)}A${R(dr)} ${R(dr)} 0 0 1 ${pt(dr, t0)}Z`, class: "lc" }, g);
      const area = 0.5 * ((r0 + dr) ** 2 - r0 ** 2) * dt;
      read.textContent = `dr = 0.2, dθ = π/12일 때 r = ${num(r0, 2)}~${num(r0 + dr, 2)} 조각의 넓이 ${num(area, 4)} ≈ r dr dθ = ${num((r0 + dr / 2) * dr * dt, 4)} (안쪽 조각의 ${num(area / (0.5 * (0.04 * 4 - 0.04) * dt), 2)}배)`;
    });
  });

  // 6.4 사면체의 단면
  Q.def("c2-tetra", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ x, az }) => {
      clear(g);
      const P = view3((az * PI) / 180, 0.4, 170, 250, 220);
      axes3(g, P, [1.3, 1.3, 1.25]);
      const O = [0, 0, 0], A = [1, 0, 0], B = [0, 1, 0], C = [0, 0, 1];
      path3(g, P, [A, B, C], "lb", true); [[O, A], [O, B], [O, C], [A, B], [B, C], [C, A]].forEach(([p, q]) => L3(g, P, p, q, "k"));
      const s = 1 - x;
      path3(g, P, [[x, 0, 0], [x, s, 0], [x, 0, s]], "lc", true).setAttribute("style", "stroke:var(--fc);stroke-width:2");
      read.textContent = `x = ${num(x)}: 단면은 직각을 낀 두 변이 ${num(s)}인 삼각형, 넓이 (1 − x)²/2 = ${num((s * s) / 2, 4)}`;
    });
  });

  // 6.5 구면좌표
  Q.def("c2-sph", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read"), R = 1.6;
    Q.bind(fig, ({ p, t, az }) => {
      clear(g);
      const P = view3((az * PI) / 180, 0.35, 70, 260, 155), ph = (p * PI) / 180, th = (t * PI) / 180;
      axes3(g, P, [2.1, 2.1, 2]);
      const ring = (r, z, cls) => { const pts = []; for (let i = 0; i <= 60; i++) { const a = (2 * PI * i) / 60; pts.push([r * Math.cos(a), r * Math.sin(a), z]); } path3(g, P, pts, cls); };
      ring(R, 0, "gd");
      const mer = []; for (let i = 0; i <= 40; i++) { const a = (PI * i) / 40; mer.push([R * Math.sin(a) * Math.cos(th), R * Math.sin(a) * Math.sin(th), R * Math.cos(a)]); } path3(g, P, mer, "gd");
      const pt = [R * Math.sin(ph) * Math.cos(th), R * Math.sin(ph) * Math.sin(th), R * Math.cos(ph)];
      ring(R * Math.sin(ph), pt[2], "c dsh");
      L3(g, P, [0, 0, 0], pt, "a"); L3(g, P, pt, [pt[0], pt[1], 0], "ax dsh"); L3(g, P, [0, 0, 0], [pt[0], pt[1], 0], "ax dsh");
      const arc = []; for (let i = 0; i <= 20; i++) { const a = (ph * i) / 20; arc.push([0.5 * Math.sin(a) * Math.cos(th), 0.5 * Math.sin(a) * Math.sin(th), 0.5 * Math.cos(a)]); } path3(g, P, arc, "d");
      const arc2 = []; for (let i = 0; i <= 20; i++) { const a = (th * i) / 20; arc2.push([0.45 * Math.cos(a), 0.45 * Math.sin(a), 0]); } path3(g, P, arc2, "b");
      const q = P(...pt); Q.dot(g, q[0], q[1], "fd", 5);
      T3(g, P, [0.35 * Math.sin(ph / 2) * Math.cos(th), 0.35 * Math.sin(ph / 2) * Math.sin(th), 0.75], "φ", "td"); T3(g, P, [0.6 * Math.cos(th / 2), 0.6 * Math.sin(th / 2), -0.1], "θ", "tb");
      read.textContent = `ρ = ${R}, φ = ${p}°, θ = ${t}°: (x, y, z) = (${num(pt[0], 2)}, ${num(pt[1], 2)}, ${num(pt[2], 2)}), 수평 원의 반지름 ρ sin φ = ${num(R * Math.sin(ph), 2)}`;
    });
  });

  // 6.6 야코비안: (u, v) → ((u + v)/2, (u − v)/2)
  Q.def("c2-jac", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const A = Q.frame(-0.3, 2.3, -0.3, 2.3, 20, 245, 15, 245), B = Q.frame(-0.3, 2.3, -1.3, 1.3, 275, 500, 15, 245);
    const T = (u, v) => [(u + v) / 2, (u - v) / 2], h = 0.25;
    Q.bind(fig, ({ u, v }) => {
      clear(g);
      for (let k = 0; k <= 8; k++) {
        const s = k * h;
        Q.line(g, A.x(s), A.y(0), A.x(s), A.y(2), "gd"); Q.line(g, A.x(0), A.y(s), A.x(2), A.y(s), "gd");
        const p1 = T(s, 0), p2 = T(s, 2), q1 = T(0, s), q2 = T(2, s);
        Q.line(g, B.x(p1[0]), B.y(p1[1]), B.x(p2[0]), B.y(p2[1]), "gd"); Q.line(g, B.x(q1[0]), B.y(q1[1]), B.x(q2[0]), B.y(q2[1]), "gd");
      }
      el("rect", { x: A.x(0), y: A.y(2), width: A.x(2) - A.x(0), height: A.y(0) - A.y(2), class: "k" }, g);
      el("path", { d: [T(0, 0), T(2, 0), T(2, 2), T(0, 2)].map((p, i) => (i ? "L" : "M") + B.x(p[0]) + " " + B.y(p[1])).join("") + "Z", class: "k" }, g);
      el("rect", { x: A.x(u), y: A.y(v + h), width: A.x(h) - A.x(0), height: A.y(0) - A.y(h), class: "la", style: "stroke:var(--fa)" }, g);
      el("path", { d: [T(u, v), T(u + h, v), T(u + h, v + h), T(u, v + h)].map((p, i) => (i ? "L" : "M") + B.x(p[0]) + " " + B.y(p[1])).join("") + "Z", class: "la", style: "stroke:var(--fa)" }, g);
      Q.line(g, B.X0, B.y(0), B.X1, B.y(0), "ax"); Q.line(g, B.x(0), B.Y0, B.x(0), B.Y1, "ax");
      txt(g, A.x(1), A.Y1 + 2, "uv평면", "s", "middle"); txt(g, B.x(1), B.Y1 + 2, "xy평면", "s", "middle");
      read.textContent = `uv평면의 칸 넓이 ${h * h} → xy평면의 칸 넓이 ${h * h / 2} (배율 |∂(x, y)/∂(u, v)| = 1/2)`;
    });
  });

  // 화살표 격자: F(x, y) → [P, Q], 길이를 k배로 줄여 그린다
  const arrows = (g, F, Fn, step, k, cls, fcls) => {
    for (let x = Math.ceil(F.x0 / step) * step; x <= F.x1 + 1e-9; x += step) for (let y = Math.ceil(F.y0 / step) * step; y <= F.y1 + 1e-9; y += step) {
      const [p, q] = Fn(x, y); if (!isFinite(p) || !isFinite(q) || Math.hypot(p, q) < 1e-9) continue;
      Q.arrow(g, F.x(x), F.y(y), F.x(x + k * p), F.y(y + k * q), cls, fcls);
    }
  };

  // 7.1 벡터장 보기
  Q.def("c2-field", (fig, svg) => {
    const F = Q.frame(-2.6, 2.6, -2, 2, 60, 460, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const fs = [(x, y) => [-y, x], (x, y) => [x, y], (x, y) => { const r = Math.hypot(x, y); return r < 0.3 ? [NaN, NaN] : [-x / r ** 3, -y / r ** 3]; }, (x, y) => [2 * x * y, x * x - 3 * y * y]];
    const ks = [0.16, 0.16, 0.3, 0.06], N = ["소용돌이: 원점 둘레를 시계 반대 방향으로 돈다", "퍼져 나감: 원점에서 바깥으로 뻗는다", "중력: 모든 점에서 원점을 향하고, 가까울수록 세다", "∇(x²y − y³): 화살표가 등위선에 수직이고 f가 커지는 쪽을 향한다"];
    Q.bind(fig, ({ k }) => {
      clear(g);
      // 등위선은 값이 c를 지나는 작은 칸에 점을 찍어 그린다
      if (k === 3) { const n = 90; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const x = -2.6 + (5.2 * (i + 0.5)) / n, y = -2 + (4 * (j + 0.5)) / n, v = x * x * y - y ** 3; for (const c of [-3, -1.5, -0.5, 0.5, 1.5, 3]) { const v2 = (x + 5.2 / n) ** 2 * y - y ** 3, v3 = x * x * (y + 4 / n) - (y + 4 / n) ** 3; if ((v - c) * (v2 - c) <= 0 || (v - c) * (v3 - c) <= 0) el("rect", { x: F.x(x), y: F.y(y), width: 1.4, height: 1.4, class: "fk", style: "opacity:.25" }, g); } } }
      Q.line(g, F.X0, F.y(0), F.X1, F.y(0), "ax"); Q.line(g, F.x(0), F.Y0, F.x(0), F.Y1, "ax");
      arrows(g, F, fs[k], 0.5, ks[k], k === 2 ? "d" : "a", k === 2 ? "fd" : "fa");
      read.textContent = N[k];
    });
  });

  // 7.2 일: F = ⟨x², −xy⟩, 사분원
  Q.def("c2-work", (fig, svg) => {
    const F = Q.frame(-0.6, 1.8, -0.4, 1.4, 60, 460, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const Fn = (x, y) => [x * x, -x * y];
    Q.bind(fig, ({ t }) => {
      clear(g);
      arrows(g, F, Fn, 0.4, 0.25, "gd", "lk");
      Q.line(g, F.X0, F.y(0), F.X1, F.y(0), "ax"); Q.line(g, F.x(0), F.Y0, F.x(0), F.Y1, "ax");
      let d = ""; for (let i = 0; i <= 60; i++) { const s = (PI / 2) * i / 60; d += (i ? "L" : "M") + F.x(Math.cos(s)) + " " + F.y(Math.sin(s)); } el("path", { d, class: "k dsh" }, g);
      let d2 = ""; for (let i = 0; i <= 60; i++) { const s = (t * i) / 60; d2 += (i ? "L" : "M") + F.x(Math.cos(s)) + " " + F.y(Math.sin(s)); } el("path", { d: d2, class: "k" }, g);
      const x = Math.cos(t), y = Math.sin(t), [p, q] = Fn(x, y), v = [-y, x];
      Q.arrow(g, F.x(x), F.y(y), F.x(x + 0.5 * p), F.y(y + 0.5 * q), "d", "fd"); Q.arrow(g, F.x(x), F.y(y), F.x(x + 0.4 * v[0]), F.y(y + 0.4 * v[1]), "b", "fb");
      Q.dot(g, F.x(x), F.y(y), "fk", 4);
      const W = (2 / 3) * (Math.cos(t) ** 3 - 1);
      read.textContent = `t = ${num(t)}: F·r′ = −2cos²t sin t = ${num(-2 * Math.cos(t) ** 2 * Math.sin(t), 3)}, 여기까지 쌓인 일 ${num(W, 4)} (끝까지 가면 −2/3)`;
    });
  });

  // 7.3 경로 무관: 보존장과 구멍 있는 소용돌이
  Q.def("c2-cons", (fig, svg) => {
    const F = Q.frame(-2, 2, -1.7, 1.7, 90, 430, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const fields = [(x, y) => [3 + 2 * x * y, x * x - 3 * y * y], (x, y) => { const r2 = x * x + y * y; return [-y / r2, x / r2]; }];
    const paths = [(s) => [Math.cos(PI * s), Math.sin(PI * s)], (s) => [Math.cos(PI * s), -1.4 * Math.sin(PI * s)]];
    Q.bind(fig, ({ f, p }) => {
      clear(g);
      arrows(g, F, fields[f], 0.5, f ? 0.25 : 0.04, "gd", "lk");
      Q.line(g, F.X0, F.y(0), F.X1, F.y(0), "ax"); Q.line(g, F.x(0), F.Y0, F.x(0), F.Y1, "ax");
      if (f) Q.dot(g, F.x(0), F.y(0), "fd", 4);
      const vals = [0, 1].map((k) => { let S = 0, N = 2000; for (let i = 0; i < N; i++) { const a = paths[k](i / N), b = paths[k]((i + 1) / N), m = paths[k]((i + 0.5) / N), [P, Qv] = fields[f](...m); S += P * (b[0] - a[0]) + Qv * (b[1] - a[1]); } return S; });
      [0, 1].forEach((k) => { let d = ""; for (let i = 0; i <= 60; i++) { const q = paths[k](i / 60); d += (i ? "L" : "M") + F.x(q[0]) + " " + F.y(q[1]); } el("path", { d, class: k === p ? "c" : "k dsh" }, g); });
      Q.dot(g, F.x(1), F.y(0), "fk", 4); Q.dot(g, F.x(-1), F.y(0), "fk", 4);
      txt(g, F.x(1) + 6, F.y(0) + 16, "(1, 0)", "s"); txt(g, F.x(-1) - 6, F.y(0) + 16, "(−1, 0)", "s", "end");
      read.textContent = `${p ? "아래로 가는 길" : "위로 가는 길"}의 선적분 ${num(vals[p], 4)} (다른 길 ${num(vals[1 - p], 4)})` + (f ? " → 원점의 구멍 때문에 경로에 따라 다르다" : " → 보존장이라 경로와 무관하다");
    });
  });

  // 7.4 그린 정리: 작은 정사각형의 돌기가 안쪽에서 지워짐
  Q.def("c2-green", (fig, svg) => {
    const F = Q.frame(-0.15, 3.15, -0.15, 3.15, 120, 400, 5, 275), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ n }) => {
      clear(g);
      const h = 3 / n, m = h * 0.18;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const x0 = i * h + m, y0 = j * h + m, x1 = (i + 1) * h - m, y1 = (j + 1) * h - m;
        const sides = [[[x0, y0], [x1, y0], j === 0], [[x1, y0], [x1, y1], i === n - 1], [[x1, y1], [x0, y1], j === n - 1], [[x0, y1], [x0, y0], i === 0]];
        sides.forEach(([a, b, outer]) => Q.arrow(g, F.x(a[0]), F.y(a[1]), F.x(b[0]), F.y(b[1]), outer ? "a" : "gd", outer ? "fa" : "lk"));
      }
      el("rect", { x: F.x(0), y: F.y(3), width: F.x(3) - F.x(0), height: F.y(0) - F.y(3), class: "k", style: "stroke-width:2.4" }, g);
      read.textContent = `${n * n}개 조각, 안쪽에서 서로 지워지는 변 ${2 * n * (n - 1)}쌍, 남는 것은 바깥 경계의 변 ${4 * n}개`;
    });
  });

  // 7.5 회전과 발산: 바람개비
  Q.def("c2-curl", (fig, svg) => {
    const F = Q.frame(-2.2, 2.2, -1.7, 1.7, 90, 430, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const fs = [(x, y) => [-y, x], (x, y) => [x, y], (x, y) => [y, 0]], cd = [[2, 0], [0, 2], [-1, 0]];
    Q.bind(fig, ({ k, x }) => {
      clear(g);
      arrows(g, F, fs[k], 0.5, 0.25, "ax", "lk");
      const y = 0.4, R = 0.35;
      el("circle", { cx: F.x(x), cy: F.y(y), r: F.x(R) - F.x(0), class: "c" }, g);
      for (let i = 0; i < 4; i++) { const a = (i * PI) / 2 + 0.3; Q.line(g, F.x(x), F.y(y), F.x(x + R * Math.cos(a)), F.y(y + R * Math.sin(a)), "c"); }
      for (let i = 0; i < 8; i++) { const a = (i * PI) / 4, px = x + R * Math.cos(a), py = y + R * Math.sin(a), [p, q] = fs[k](px, py); Q.arrow(g, F.x(px), F.y(py), F.x(px + 0.18 * p), F.y(py + 0.18 * q), "a", "fa"); }
      const [c, d] = cd[k];
      read.textContent = `점 (${num(x)}, ${y})에서 회전(z 성분) Q_x − P_y = ${c}` + (c > 0 ? " → 시계 반대로 돈다" : c < 0 ? " → 시계 방향으로 돈다" : " → 돌지 않는다") + `, 발산 P_x + Q_y = ${d}` + (d > 0 ? " → 솟아난다" : " → 들고 나는 양이 같다");
    });
  });

  // 8.1 곡면의 넓이: 구면 조각과 평행사변형
  Q.def("c2-patch", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read"), a = 1.6, dp = PI / 10, dt = PI / 7, t0 = 0.25;
    const r = (p, t) => [a * Math.sin(p) * Math.cos(t), a * Math.sin(p) * Math.sin(t), a * Math.cos(p)];
    const P = view3(-1.45, 0.35, 82, 260, 145);
    Q.bind(fig, ({ p }) => {
      clear(g);
      const p0 = (p * PI) / 180;
      pmesh(g, P, r, 0, PI, 0, 2 * PI, 12, 16, "gd");
      const c = r(p0, t0), ru = [a * Math.cos(p0) * Math.cos(t0), a * Math.cos(p0) * Math.sin(t0), -a * Math.sin(p0)], rv = [-a * Math.sin(p0) * Math.sin(t0), a * Math.sin(p0) * Math.cos(t0), 0];
      const u = ru.map((v) => v * dp), w = rv.map((v) => v * dt), add = (x, y) => x.map((v, i) => v + y[i]);
      path3(g, P, [c, add(c, u), add(add(c, u), w), add(c, w)], "la", true);
      const edge = []; for (let i = 0; i <= 10; i++) edge.push(r(p0 + (dp * i) / 10, t0)); for (let i = 0; i <= 10; i++) edge.push(r(p0 + dp, t0 + (dt * i) / 10));
      for (let i = 0; i <= 10; i++) edge.push(r(p0 + dp - (dp * i) / 10, t0 + dt)); for (let i = 0; i <= 10; i++) edge.push(r(p0, t0 + dt - (dt * i) / 10));
      path3(g, P, edge, "k", true);
      A3(g, P, c, add(c, u), "a", "fa"); A3(g, P, c, add(c, w), "b", "fb");
      const est = a * a * Math.sin(p0 + dp / 2) * dp * dt, exact = a * a * (Math.cos(p0) - Math.cos(p0 + dp)) * dt;
      read.textContent = `조각 가운데의 φ로 어림한 a² sin φ ΔφΔθ ≈ ${num(est, 4)}, 실제 조각의 넓이 ≈ ${num(exact, 4)}`;
    });
  });

  // 8.2 선속: 기울어진 그물을 지나는 흐름
  Q.def("c2-flux", (fig, svg) => {
    const F = Q.frame(-3, 3, -1.6, 1.6, 40, 480, 10, 250), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ a }) => {
      clear(g);
      for (let y = -1.4; y <= 1.41; y += 0.35) for (let x = -2.8; x < 2.8; x += 0.9) Q.arrow(g, F.x(x), F.y(y), F.x(x + 0.5), F.y(y), "gd", "lk");
      const al = (a * PI) / 180, n = [Math.cos(al), Math.sin(al)], d = [-n[1], n[0]], L = 1.2;
      el("path", { d: `M${F.x(-L * d[0])} ${F.y(-L * d[1])}L${F.x(L * d[0])} ${F.y(L * d[1])}`, class: "k", style: "stroke-width:4" }, g);
      Q.arrow(g, F.x(0), F.y(0), F.x(n[0]), F.y(n[1]), "d", "fd"); txt(g, F.x(1.15 * n[0]), F.y(1.15 * n[1]) + 4, "n", "td", "middle");
      Q.arrow(g, F.x(0), F.y(0), F.x(1), F.y(0), "a", "fa"); txt(g, F.x(1.1), F.y(0) + 4, "F", "ta", "start");
      const fl = 2 * L * Math.cos(al);
      read.textContent = `|F| = 1, 그물의 크기 A = ${num(2 * L)}, α = ${a}°에서 지나는 양 F·n A = ${num(fl, 3)}` + (Math.abs(fl) < 1e-9 ? " (흐름과 나란함)" : fl < 0 ? " (뒤쪽에서 앞쪽으로)" : "");
    });
  });

  // 8.3 스토크스: 경계가 같으면 곡면을 부풀려도 선속이 같음
  Q.def("c2-stokes", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read"), P = view3(-0.6, 0.4, 85, 260, 190);
    Q.bind(fig, ({ h }) => {
      clear(g);
      axes3(g, P, [1.5, 1.5, 1.9]);
      const r = (s, t) => [s * Math.cos(t), s * Math.sin(t), h * (1 - s * s)];
      pmesh(g, P, r, 0, 1, 0, 2 * PI, 6, 16, "b");
      const ring = []; for (let i = 0; i <= 64; i++) { const t = (2 * PI * i) / 64; ring.push([Math.cos(t), Math.sin(t), 0]); }
      path3(g, P, ring, "a", false).setAttribute("style", "stroke-width:2.6");
      for (let i = 0; i < 4; i++) { const t = (PI * i) / 2 + 0.6; A3(g, P, [Math.cos(t), Math.sin(t), 0], [Math.cos(t + 0.25), Math.sin(t + 0.25), 0], "a", "fa"); }
      const N = 60, M = 60; let fl = 0, ar = 0;
      for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) {
        const s = (i + 0.5) / N, t = (2 * PI * (j + 0.5)) / M, rs = [Math.cos(t), Math.sin(t), -2 * h * s], rt = [-s * Math.sin(t), s * Math.cos(t), 0], c = cross(rs, rt), dA = (1 / N) * (2 * PI / M);
        fl += dot([0, 0, 2], c) * dA; ar += norm(c) * dA;
      }
      read.textContent = `곡면의 넓이 ≈ ${num(ar, 3)}, 회전 ⟨0, 0, 2⟩의 선속 ≈ ${num(fl, 3)}, 경계를 도는 순환 2π ≈ ${num(2 * PI, 3)}`;
    });
  });

  // 8.4 발산 정리: 점 샘을 품는 원과 품지 않는 원
  Q.def("c2-gauss", (fig, svg) => {
    const F = Q.frame(-4, 4, -2.2, 2.2, 20, 500, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const Fn = (x, y) => { const q = x * x + y * y; return q < 0.05 ? [0, 0] : [x / q, y / q]; };
    Q.bind(fig, ({ c }) => {
      clear(g);
      arrows(g, F, Fn, 0.5, 0.35, "gd", "lk");
      Q.dot(g, F.x(0), F.y(0), "fd", 4);
      const R = 1.2;
      el("circle", { cx: F.x(c), cy: F.y(0), r: F.x(R) - F.x(0), class: "a", style: "stroke-width:2.2" }, g);
      let fl = 0; const n = 720;
      for (let i = 0; i < n; i++) { const t = (2 * PI * (i + 0.5)) / n, x = c + R * Math.cos(t), y = R * Math.sin(t), [p, q] = Fn(x, y); fl += (p * Math.cos(t) + q * Math.sin(t)) * R * (2 * PI / n); }
      for (let i = 0; i < 8; i++) { const t = (PI * i) / 4, x = c + R * Math.cos(t), y = R * Math.sin(t); Q.arrow(g, F.x(x), F.y(y), F.x(x + 0.35 * Math.cos(t)), F.y(y + 0.35 * Math.sin(t)), "b", "fb"); }
      const inside = Math.abs(c) < R;
      read.textContent = `원점이 원의 ${inside ? "안" : "밖"}에 있다. 원을 빠져나가는 선속 ≈ ${num(fl, 3)}` + (inside ? " (2π ≈ 6.283)" : "");
    });
  });

  // ── 새 그림은 이 위에 ──
})();
