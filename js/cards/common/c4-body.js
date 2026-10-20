/* 공통4(일반물리학 2) 본문 카드의 조작 그림 (js/lib/qfig.js의 NMQ를 쓴다). 그림마다 NMQ.def("이름", …). */
(() => {
  "use strict";
  const Q = window.NMQ;
  if (!Q) return;
  const { el, clear, txt, num } = Q;
  const PI = Math.PI, K = 8.99e9;
  const rad = (d) => (d * PI) / 180;
  // 화살표 + 끝에 이름표
  const vec = (g, F, x0, y0, x1, y1, cls, fcls, lab, tcls) => {
    Q.arrow(g, F.x(x0), F.y(y0), F.x(x1), F.y(y1), cls, fcls);
    if (lab) { const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1; txt(g, F.x(x1) + (12 * dx) / L, F.y(y1) - (12 * dy) / L + 4, lab, tcls || "i", "middle"); }
  };
  const rect = (g, F, x0, y0, x1, y1, cls) => el("rect", { x: Math.min(F.x(x0), F.x(x1)), y: Math.min(F.y(y0), F.y(y1)), width: Math.abs(F.x(x1) - F.x(x0)), height: Math.abs(F.y(y1) - F.y(y0)), class: cls }, g);
  const poly = (g, F, pts, cls, open) => el("path", { d: pts.map((p, i) => (i ? "L" : "M") + F.x(p[0]).toFixed(1) + " " + F.y(p[1]).toFixed(1)).join("") + (open ? "" : "Z"), class: cls }, g);
  // 축과 눈금 글자: xt, yt는 눈금 값 목록
  const axl = (g, F, xt, yt, xs, ys) => {
    Q.axes(g, F, { grid: false, label: false });
    xt.forEach((v) => txt(g, F.x(v), F.y(0) + 14, num(v), "s", "middle"));
    yt.forEach((v) => txt(g, F.x(0) - 5, F.y(v) + 4, num(v), "s", "end"));
    txt(g, F.X1 - 4, F.y(0) - 6, xs, "i", "end"); txt(g, F.x(0) + 6, F.Y0 + 14, ys, "i");
  };
  // 전하 표시: 양은 a색, 음은 d색 원 안에 +/−
  const charge = (g, F, x, y, q, r) => {
    el("circle", { cx: F.x(x), cy: F.y(y), r: r || 10, class: q > 0 ? "fd" : "fa" }, g);
    txt(g, F.x(x), F.y(y) + 4, q > 0 ? "+" : "−", "s", "middle").setAttribute("style", "fill:#fff;font-weight:700");
  };
  // 벡터장의 방향만 보이는 짧은 화살표들 (길이는 고정, 세기는 진하기로)
  const dirField = (g, F, Ef, step, len, skip) => {
    for (let x = F.x0 + step / 2; x < F.x1; x += step) for (let y = F.y0 + step / 2; y < F.y1; y += step) {
      if (skip && skip(x, y)) continue;
      const [ex, ey] = Ef(x, y), m = Math.hypot(ex, ey); if (!isFinite(m) || m < 1e-12) continue;
      const ux = (ex / m) * len, uy = (ey / m) * len, a = Q.arrow(g, F.x(x - ux / 2), F.y(y - uy / 2), F.x(x + ux / 2), F.y(y + uy / 2), "ax", "lk");
    }
  };
  // 등고선: 격자 위 값으로 수준 lv의 선분들을 그린다 (마칭 스퀘어)
  const contour = (g, F, f, lv, n, cls) => {
    const nx = n, ny = Math.round((n * (F.y1 - F.y0)) / (F.x1 - F.x0)), hx = (F.x1 - F.x0) / nx, hy = (F.y1 - F.y0) / ny;
    const V = []; for (let i = 0; i <= nx; i++) { V.push([]); for (let j = 0; j <= ny; j++) V[i].push(f(F.x0 + i * hx, F.y0 + j * hy)); }
    let d = "";
    const ip = (x0, y0, v0, x1, y1, v1) => { const t = (lv - v0) / (v1 - v0); return [x0 + t * (x1 - x0), y0 + t * (y1 - y0)]; };
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
      const x0 = F.x0 + i * hx, y0 = F.y0 + j * hy, x1 = x0 + hx, y1 = y0 + hy;
      const a = V[i][j], b = V[i + 1][j], c = V[i + 1][j + 1], e = V[i][j + 1];
      if (![a, b, c, e].every(isFinite)) continue;
      const P = [];
      if ((a - lv) * (b - lv) < 0) P.push(ip(x0, y0, a, x1, y0, b));
      if ((b - lv) * (c - lv) < 0) P.push(ip(x1, y0, b, x1, y1, c));
      if ((c - lv) * (e - lv) < 0) P.push(ip(x1, y1, c, x0, y1, e));
      if ((e - lv) * (a - lv) < 0) P.push(ip(x0, y1, e, x0, y0, a));
      for (let k = 0; k + 1 < P.length; k += 2) d += `M${F.x(P[k][0]).toFixed(1)} ${F.y(P[k][1]).toFixed(1)}L${F.x(P[k + 1][0]).toFixed(1)} ${F.y(P[k + 1][1]).toFixed(1)}`;
    }
    if (d) el("path", { d, class: cls }, g);
  };

  // 1.1 두 점전하의 전기장과 힘
  Q.def("c4-coulomb", (fig, svg) => {
    const F = Q.frame(-0.25, 0.6, -0.22, 0.22, 20, 500, 20, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ q, d }) => {
      clear(g);
      const q1 = 2e-6, q2 = q * 1e-6;
      const Ef = (x, y) => { let ex = 0, ey = 0; [[0, q1], [d, q2]].forEach(([cx, qq]) => { const rx = x - cx, ry = y, r3 = Math.hypot(rx, ry) ** 3; ex += (K * qq * rx) / r3; ey += (K * qq * ry) / r3; }); return [ex, ey]; };
      dirField(g, F, Ef, 0.04, 0.026, (x, y) => Math.hypot(x, y) < 0.03 || Math.hypot(x - d, y) < 0.03);
      charge(g, F, 0, 0, 1); charge(g, F, d, 0, q);
      txt(g, F.x(0), F.y(0) + 26, "+2.0 μC", "s", "middle"); txt(g, F.x(d), F.y(0) + 26, `${q > 0 ? "+" : "−"}${num(Math.abs(q), 1)} μC`, "s", "middle");
      const Fm = (K * Math.abs(q1 * q2)) / (d * d), dir = q > 0 ? 1 : -1, L = Math.min(0.2, 0.05 + Fm * 0.12);
      vec(g, F, d, 0, d + dir * L, 0, "a", "fa", "F", "ta");
      read.textContent = `거리 ${num(d, 2)} m: F = k|q₁q₂|/r² = ${num(Fm, 2)} N, ` + (q > 0 ? "같은 부호라 밀어낸다(+x 방향)" : "다른 부호라 당긴다(−x 방향)");
    });
  });

  // 1.2 고리 축 위의 전기장
  Q.def("c4-ring", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const A = Q.frame(-0.4, 2.6, -1.4, 1.4, 10, 250, 20, 270), B = Q.frame(-0.2, 4.2, -0.05, 0.45, 280, 510, 20, 250);
    Q.bind(fig, ({ x }) => {
      clear(g);
      el("ellipse", { cx: A.x(0), cy: A.y(0), rx: 10, ry: A.y(-1) - A.y(0), class: "d" }, g);
      Q.line(g, A.x(-0.4), A.y(0), A.x(2.6), A.y(0), "ax");
      Q.dot(g, A.x(x), A.y(0), "fk", 4);
      [[0, 1], [0, -1]].forEach(([cx, cy], i) => {
        Q.line(g, A.x(cx), A.y(cy), A.x(x), A.y(0), "gd dsh");
        const rx = x - cx, ry = -cy, r = Math.hypot(rx, ry), s = 0.9 / (r * r), ex = (s * rx) / r, ey = (s * ry) / r;
        vec(g, A, x, 0, x + ex, ey, i ? "c" : "a", i ? "fc" : "fa");
        Q.dot(g, A.x(cx), A.y(cy), "fd", 4);
      });
      txt(g, A.x(0), A.y(1.2), "dq", "td", "middle"); txt(g, A.x(0), A.y(-1.2) + 10, "dq", "td", "middle");
      // 오른쪽: E_x / (kQ/a²) 그래프
      axl(g, B, [1, 2, 3, 4], [0.2, 0.4], "x / a", "E");
      Q.plot(g, B, (u) => u / (u * u + 1) ** 1.5, "a", 0, 4.2);
      Q.plot(g, B, (u) => (u > 0.6 ? 1 / (u * u) : NaN), "gd dsh", 0.6, 4.2);
      const Ex = x / (x * x + 1) ** 1.5; Q.dot(g, B.x(x), B.y(Ex), "fa", 5);
      read.textContent = `x = ${num(x, 2)}a: 수직 성분은 짝끼리 지워지고 E_x = kQx/(x² + a²)^(3/2) = ${num(Ex, 3)} kQ/a² (최대는 x = a/√2 ≈ 0.71a에서 0.385). 점선은 점전하 kQ/x²`;
    });
  });

  // 1.3 균일한 전기장 속 쌍극자
  Q.def("c4-dipole", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const A = Q.frame(-1.4, 1.4, -1.3, 1.3, 10, 260, 20, 270), B = Q.frame(-10, 370, -1.3, 1.3, 290, 510, 30, 250);
    Q.bind(fig, ({ p }) => {
      clear(g);
      for (let y = -1.1; y <= 1.11; y += 0.55) vec(g, A, -1.35, y, 1.3, y, "gd", "lk");
      txt(g, A.x(1.3), A.y(1.1) - 8, "E", "i", "end");
      const ph = rad(p), d = 0.7, u = [Math.cos(ph), Math.sin(ph)];
      Q.line(g, A.x(-d * u[0]), A.y(-d * u[1]), A.x(d * u[0]), A.y(d * u[1]), "k");
      charge(g, A, d * u[0], d * u[1], 1, 9); charge(g, A, -d * u[0], -d * u[1], -1, 9);
      vec(g, A, d * u[0], d * u[1], d * u[0] + 0.45, d * u[1], "d", "fd", "qE", "td");
      vec(g, A, -d * u[0], -d * u[1], -d * u[0] - 0.45, -d * u[1], "a", "fa", "−qE", "ta");
      // 오른쪽: U(φ) = −pE cos φ
      Q.line(g, B.x(0), B.y(0), B.x(360), B.y(0), "ax");
      [0, 90, 180, 270, 360].forEach((v) => txt(g, B.x(v), B.y(0) + 14, `${v}°`, "s", "middle"));
      txt(g, B.x(0) - 4, B.y(1) + 4, "pE", "s", "end"); txt(g, B.x(0) - 4, B.y(-1) + 4, "−pE", "s", "end");
      Q.plot(g, B, (t) => -Math.cos(rad(t)), "b", 0, 360); txt(g, B.x(360), B.y(1.25), "U(φ)", "tb", "end");
      Q.dot(g, B.x(((p % 360) + 360) % 360), B.y(-Math.cos(ph)), "fb", 5);
      read.textContent = `φ = ${p}°: 알짜힘 0, 돌림힘 τ = pE sin φ = ${num(Math.sin(ph), 2)} pE, U = −pE cos φ = ${num(-Math.cos(ph), 2)} pE` + (Math.abs(Math.sin(ph)) < 0.02 ? (Math.cos(ph) > 0 ? " (안정 평형)" : " (불안정 평형)") : "");
    });
  });

  // 2.1 고르게 대전된 공: 가우스 면과 E(r)
  Q.def("c4-gauss", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const A = Q.frame(-0.3, 0.3, -0.3, 0.3, 10, 250, 20, 260), B = Q.frame(-0.01, 0.3, -0.3e5, 9.8e5, 290, 510, 20, 250);
    const R = 0.1, Qc = 1e-6;
    Q.bind(fig, ({ r }) => {
      clear(g);
      el("circle", { cx: A.x(0), cy: A.y(0), r: A.x(R) - A.x(0), class: "ld" }, g);
      for (let i = 0; i < 40; i++) { const t = i * 2.4, s = R * Math.sqrt((i + 0.5) / 40); txt(g, A.x(s * Math.cos(t)), A.y(s * Math.sin(t)) + 3, "+", "td", "middle"); }
      el("circle", { cx: A.x(0), cy: A.y(0), r: A.x(r) - A.x(0), class: "a dsh" }, g);
      const qin = r < R ? Qc * (r / R) ** 3 : Qc, E = (K * qin) / (r * r);
      for (let i = 0; i < 8; i++) { const t = (i * PI) / 4, L = Math.min(0.07, 0.015 + E / 1.2e7); vec(g, A, r * Math.cos(t), r * Math.sin(t), (r + L) * Math.cos(t), (r + L) * Math.sin(t), "b", "fb"); }
      Q.line(g, B.x(0), B.y(0), B.x(0.3), B.y(0), "ax"); Q.line(g, B.x(0), B.y(-0.3e5), B.x(0), B.y(9.8e5), "ax");
      [0.1, 0.2, 0.3].forEach((v) => txt(g, B.x(v), B.y(0) + 14, num(v, 1), "s", "middle")); txt(g, B.x(0.3), B.y(0) - 6, "r (m)", "i", "end");
      [4e5, 8e5].forEach((v) => txt(g, B.x(0) - 4, B.y(v) + 4, `${v / 1e5}`, "s", "end")); txt(g, B.x(0) + 6, B.y(9.8e5) + 12, "E (10⁵ N/C)", "i");
      Q.plot(g, B, (s) => (s < R ? (K * Qc * s) / R ** 3 : (K * Qc) / (s * s)), "a", 0.001, 0.3);
      Q.line(g, B.x(R), B.y(0), B.x(R), B.y(9.8e5), "gd dsh");
      Q.dot(g, B.x(r), B.y(E), "fb", 5);
      read.textContent = `가우스 면 r = ${num(r, 3)} m: 안의 전하 ${num(qin * 1e6, 3)} μC, E·4πr² = Q_안/ε₀ → E = ${num(E / 1e5, 2)}×10⁵ N/C`;
    });
  });

  // 2.2 균일한 전기장 속 도체 공: 안은 0, 표면에 유도 전하
  Q.def("c4-conductor", (fig, svg) => {
    const F = Q.frame(-2.6, 2.6, -1.35, 1.35, 20, 500, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ c }) => {
      clear(g);
      const a = 0.8;
      const Ef = (x, y) => {
        if (!c) return [1, 0];
        const r2 = x * x + y * y; if (r2 < a * a) return [0, 0];
        const a3 = a ** 3, r5 = r2 ** 2.5;
        return [1 + a3 * (2 * x * x - y * y) / r5, a3 * 3 * x * y / r5];
      };
      dirField(g, F, Ef, 0.3, 0.2, (x, y) => c && x * x + y * y < (a + 0.08) ** 2);
      if (c) {
        el("circle", { cx: F.x(0), cy: F.y(0), r: F.x(a) - F.x(0), class: "lk" }, g);
        for (let i = 0; i < 16; i++) { const t = (i * PI) / 8, s = Math.cos(t); if (Math.abs(s) < 0.2) continue; txt(g, F.x((a - 0.12) * Math.cos(t)), F.y((a - 0.12) * Math.sin(t)) + 4, s > 0 ? "+" : "−", s > 0 ? "td" : "ta", "middle"); }
        txt(g, F.x(0), F.y(0) + 4, "E = 0", "s", "middle");
      }
      read.textContent = c ? "도체 공을 넣으면 왼쪽 표면에 음전하, 오른쪽 표면에 양전하가 유도되어 안의 전기장을 정확히 지운다. 바깥 전기력선은 표면에 수직으로 들어가고 나온다." : "도체가 없을 때: 왼쪽에서 오른쪽으로 향하는 균일한 전기장";
    });
  });

  // 3.1 두 전하의 등전위선과 전기장
  Q.def("c4-equip", (fig, svg) => {
    const F = Q.frame(-2.6, 2.6, -1.35, 1.35, 20, 500, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ s, x }) => {
      clear(g);
      const q2 = s == 1 ? 1 : -1, P = [[-1, 1], [1, q2]];
      const V = (px, py) => P.reduce((t, [cx, q]) => t + q / Math.hypot(px - cx, py), 0);
      const Ef = (px, py) => P.reduce(([ex, ey], [cx, q]) => { const rx = px - cx, ry = py, r3 = Math.hypot(rx, ry) ** 3; return [ex + (q * rx) / r3, ey + (q * ry) / r3]; }, [0, 0]);
      dirField(g, F, Ef, 0.26, 0.16, (px, py) => P.some(([cx]) => Math.hypot(px - cx, py) < 0.2));
      [-3, -2, -1.4, -1, -0.6, -0.3, 0, 0.3, 0.6, 1, 1.4, 2, 3].forEach((lv) => { if (s == 1 && lv <= 0) return; contour(g, F, V, lv, 120, lv === 0 ? "k" : "a"); });
      P.forEach(([cx, q]) => charge(g, F, cx, 0, q, 9));
      const y = 0.6; Q.dot(g, F.x(x), F.y(y), "fc", 5);
      const [ex, ey] = Ef(x, y), m = Math.hypot(ex, ey); vec(g, F, x, y, x + (0.45 * ex) / m, y + (0.45 * ey) / m, "c", "fc", "E", "tc");
      read.textContent = `점 (${num(x, 1)}, 0.6)의 전위 V = ${num(V(x, y), 2)} (kq/m 단위). 전기장은 등전위선(파랑)에 수직이고 전위가 낮아지는 쪽을 향한다.` + (s == 1 ? "" : " 가운데 검은 선은 V = 0.");
    });
  });

  // 4.1 평행판 축전기: 넓이와 간격
  Q.def("c4-cap", (fig, svg) => {
    const F = Q.frame(0, 10, 0, 10, 20, 500, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ A, d }) => {
      clear(g);
      const w = 1.2 + A * 30, gap = 0.6 + d * 1.5, cx = 3, y0 = 5 - gap / 2, y1 = 5 + gap / 2;
      rect(g, F, cx - w / 2, y1, cx + w / 2, y1 + 0.3, "ld"); rect(g, F, cx - w / 2, y0 - 0.3, cx + w / 2, y0, "la");
      txt(g, F.x(cx + w / 2) + 6, F.y(y1 + 0.15) + 4, "+Q", "td", "start"); txt(g, F.x(cx + w / 2) + 6, F.y(y0 - 0.15) + 4, "−Q", "ta", "start");
      const n = Math.max(2, Math.round(w / 0.45));
      for (let i = 0; i < n; i++) { const x = cx - w / 2 + (w * (i + 0.5)) / n; vec(g, F, x, y1 - 0.05, x, y0 + 0.08, "gd", "lk"); }
      const e0 = 8.85e-12, Am = A, dm = d * 1e-3, C = (e0 * Am) / dm, V = 12, Qc = C * V, U = 0.5 * C * V * V;
      txt(g, F.x(6.6), F.y(7.5), `C = ε₀A/d = ${num(C * 1e12, 1)} pF`, "s", "start");
      txt(g, F.x(6.6), F.y(6.4), `12 V에서 Q = ${num(Qc * 1e9, 2)} nC`, "s", "start");
      txt(g, F.x(6.6), F.y(5.3), `U = ½CV² = ${num(U * 1e9, 1)} nJ`, "s", "start");
      txt(g, F.x(6.6), F.y(4.2), `판 사이 E = V/d = ${num(V / dm / 1000, 1)} kV/m`, "s", "start");
      read.textContent = `넓이 ${num(A, 3)} m², 간격 ${num(d, 1)} mm: 판이 넓을수록, 가까울수록 C가 크다.`;
    });
  });

  // 4.2 유전체를 넣을 때: 전지 연결(V 일정)과 분리(Q 일정)
  Q.def("c4-diel", (fig, svg) => {
    const F = Q.frame(0, 10, 0, 10, 20, 500, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ Kd, b }) => {
      clear(g);
      const r = b == 1 ? { C: Kd, Q: Kd, V: 1, U: Kd, E: 1 } : { C: Kd, Q: 1, V: 1 / Kd, U: 1 / Kd, E: 1 / Kd };
      const names = [["C", "C"], ["Q", "Q"], ["V", "V"], ["E", "판 사이 E"], ["U", "U"]], sc = 7 / 10;
      Q.line(g, F.x(0.3), F.y(1), F.x(9.7), F.y(1), "ax");
      Q.line(g, F.x(0.3), F.y(1 + sc), F.x(9.7), F.y(1 + sc), "k dsh"); txt(g, F.x(9.7), F.y(1 + sc) - 4, "처음 값", "s", "end");
      names.forEach(([k, lab], i) => { const x = 0.8 + i * 1.85, v = r[k]; rect(g, F, x, 1, x + 1.1, 1 + v * sc, v > 1.001 ? "la" : v < 0.999 ? "lb" : "lk"); txt(g, F.x(x + 0.55), F.y(1 + v * sc) - 5, `${num(v, 2)}배`, "s", "middle"); txt(g, F.x(x + 0.55), F.y(0.4), lab, "s", "middle"); });
      read.textContent = (b == 1 ? "전지를 연결한 채(V 일정)" : "전지를 뗀 뒤(Q 일정)") + ` 유전 상수 K = ${num(Kd, 1)}인 유전체를 넣으면 C는 K배, ` + (b == 1 ? `Q와 U도 ${num(Kd, 1)}배가 된다.` : `V, E, U는 1/K = ${num(1 / Kd, 2)}배가 된다.`);
    });
  });

  // 5.1 내부 저항이 있는 전지: 부하 저항과 전력
  Q.def("c4-load", (fig, svg) => {
    const F = Q.frame(-0.3, 6.3, -2, 78, 60, 490, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const E = 12, r = 0.5;
    Q.bind(fig, ({ R }) => {
      clear(g);
      axl(g, F, [1, 2, 3, 4, 5, 6], [20, 40, 60], "부하 저항 R (Ω)", "전력 (W)");
      const P = (x) => (E * E * x) / (x + r) ** 2;
      Q.plot(g, F, P, "a", 0, 6.3);
      Q.line(g, F.x(r), F.y(0), F.x(r), F.y(P(r)), "gd dsh"); txt(g, F.x(r) + 4, F.y(P(r)) - 6, "R = r", "s", "start");
      const I = E / (R + r), V = E - I * r;
      Q.dot(g, F.x(R), F.y(P(R)), "fa", 5);
      read.textContent = `R = ${num(R, 1)} Ω: I = 12/(0.50 + R) = ${num(I, 2)} A, 단자 전압 ${num(V, 2)} V, 저항의 전력 ${num(I * I * R, 1)} W, 내부 저항의 열 ${num(I * I * r, 1)} W`;
    });
  });

  // 5.2 두 전지 회로: 키르히호프 법칙
  Q.def("c4-kirch", (fig, svg) => {
    const F = Q.frame(0, 10, 0, 6, 20, 500, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ e2 }) => {
      clear(g);
      const e1 = 12, D = 6 * 6 - 4 * 4, I1 = (e1 * 6 - e2 * 4) / D, I2 = (6 * e2 - 4 * e1) / D, I3 = I1 + I2;
      const xs = [1.5, 5, 8.5], yt = 5.2, yb = 0.8;
      Q.line(g, F.x(xs[0]), F.y(yt), F.x(xs[2]), F.y(yt), "k"); Q.line(g, F.x(xs[0]), F.y(yb), F.x(xs[2]), F.y(yb), "k");
      xs.forEach((x) => Q.line(g, F.x(x), F.y(yb), F.x(x), F.y(yt), "k"));
      const bat = (x, y, lab) => { Q.line(g, F.x(x - 0.45), F.y(y + 0.18), F.x(x + 0.45), F.y(y + 0.18), "k").setAttribute("style", "stroke-width:3"); rect(g, F, x - 0.5, y - 0.1, x + 0.5, y + 0.12, "lk"); Q.line(g, F.x(x - 0.25), F.y(y - 0.1), F.x(x + 0.25), F.y(y - 0.1), "k").setAttribute("style", "stroke-width:3"); txt(g, F.x(x) - 26, F.y(y) + 4, lab, "s", "end"); };
      const res = (x, y, lab) => { rect(g, F, x - 0.22, y - 0.55, x + 0.22, y + 0.55, "lk"); txt(g, F.x(x) + 16, F.y(y) + 4, lab, "s", "start"); };
      bat(xs[0], 3.9, "12 V"); res(xs[0], 2.1, "2 Ω"); bat(xs[2], 3.9, `${num(e2, 1)} V`); res(xs[2], 2.1, "2 Ω"); res(xs[1], 3, "4 Ω");
      const cur = (x, I, up, cls, fcls, lab) => { const s = (up ? 1 : -1) * Math.sign(I), L = Math.min(1.0, 0.25 + Math.abs(I) * 0.3); if (Math.abs(I) < 0.01) return; const y = 4.6; const ox = x > 7 ? -0.5 : 0.5; vec(g, F, x + ox, y - (s * L) / 2, x + ox, y + (s * L) / 2, cls, fcls); txt(g, F.x(x + ox * 1.9), F.y(y) + 4, `${lab} ${num(Math.abs(I), 2)} A`, "s", x > 7 ? "end" : "start"); };
      cur(xs[0], I1, true, "a", "fa", "I₁"); cur(xs[2], I2, true, "b", "fb", "I₂"); cur(xs[1], I3, false, "d", "fd", "I₃");
      read.textContent = `I₁ = ${num(I1, 2)} A, I₂ = ${num(I2, 2)} A, I₃ = I₁ + I₂ = ${num(I3, 2)} A (위로 정한 I₂가 음수이면 실제로는 아래로 흘러 오른쪽 전지를 충전한다)`;
    });
  });

  // 5.3 RC 회로의 충전
  Q.def("c4-rc", (fig, svg) => {
    const F = Q.frame(-0.2, 5.2, -0.06, 1.12, 60, 490, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ t, R }) => {
      clear(g);
      const tau = R * 1e3 * 100e-6;
      axl(g, F, [1, 2, 3, 4, 5], [0.5, 1], "t (s)", "비율");
      Q.plot(g, F, (s) => 1 - Math.exp(-s / tau), "a", 0, 5.2);
      Q.plot(g, F, (s) => Math.exp(-s / tau), "d", 0, 5.2);
      Q.line(g, F.x(tau), F.y(0), F.x(tau), F.y(1.05), "gd dsh"); txt(g, F.x(tau), F.y(1.08), "τ", "i", "middle");
      Q.line(g, F.x(0), F.y(0.632), F.x(tau), F.y(0.632), "gd dsh");
      const q = 1 - Math.exp(-t / tau), i = Math.exp(-t / tau);
      Q.dot(g, F.x(t), F.y(q), "fa", 5); Q.dot(g, F.x(t), F.y(i), "fd", 5);
      txt(g, F.x(5.1), F.y(1 - Math.exp(-5.1 / tau)) - 6, "q/Cε", "ta", "end"); txt(g, F.x(5.1), F.y(Math.exp(-5.1 / tau)) - 6, "i/(ε/R)", "td", "end");
      read.textContent = `R = ${R} kΩ, C = 100 μF: τ = RC = ${num(tau, 2)} s. t = ${num(t, 2)} s에서 축전기 전압 ${num(9 * q, 2)} V(${num(q * 100, 0)}% 충전), 전류 ${num((9 / (R * 1e3)) * i * 1000, 3)} mA`;
    });
  });

  // 6.1 자기장 속 전하의 원운동
  Q.def("c4-cyclo", (fig, svg) => {
    const F = Q.frame(-0.46, 0.46, -0.25, 0.25, 20, 500, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const parts = [["양성자", 1.67e-27, 1], ["중양성자", 3.34e-27, 1], ["알파 입자", 6.64e-27, 2]];
    Q.bind(fig, ({ v, s }) => {
      clear(g);
      const [nm, m, z] = parts[s], B = 0.1, q = z * 1.6e-19, V = v * 1e6, r = (m * V) / (q * B), T = (2 * PI * m) / (q * B);
      for (let x = -0.44; x <= 0.441; x += 0.08) for (let y = -0.22; y <= 0.221; y += 0.08) txt(g, F.x(x), F.y(y) + 4, "×", "s", "middle").setAttribute("style", "opacity:.35");
      const cx = 0, cy = 0;
      el("circle", { cx: F.x(cx), cy: F.y(cy), r: Math.min(400, F.x(r) - F.x(0)), class: "a" }, g);
      const P = [cx, cy - r];
      if (r < 0.25) {
        charge(g, F, P[0], P[1], 1, 7);
        vec(g, F, P[0], P[1], P[0] + 0.07, P[1], "b", "fb", "v", "tb");
        vec(g, F, P[0], P[1], P[0], P[1] + 0.05, "d", "fd", "F", "td");
      }
      txt(g, F.x(0.45), F.y(0.23), "B = 0.10 T (종이 안쪽으로)", "s", "end");
      read.textContent = `${nm}, v = ${num(v, 1)}×10⁶ m/s: 반지름 r = mv/|q|B = ${num(r * 100, 1)} cm, 주기 T = 2πm/|q|B = ${num(T * 1e9, 0)} ns (속력과 무관)`;
    });
  });

  // 6.2 평행한 두 도선: 같은 방향이면 당긴다
  Q.def("c4-wires", (fig, svg) => {
    const F = Q.frame(-2.6, 2.6, -1.35, 1.35, 20, 500, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ o, d }) => {
      clear(g);
      const I2 = o == 1 ? 1 : -1, W = [[-d / 2, 1], [d / 2, I2]];
      const Bf = (x, y) => W.reduce(([bx, by], [cx, I]) => { const rx = x - cx, ry = y, r2 = rx * rx + ry * ry; return [bx - (I * ry) / r2, by + (I * rx) / r2]; }, [0, 0]);
      dirField(g, F, Bf, 0.28, 0.17, (x, y) => W.some(([cx]) => Math.hypot(x - cx, y) < 0.22));
      W.forEach(([cx, I]) => { el("circle", { cx: F.x(cx), cy: F.y(0), r: 11, class: "lk" }, g); if (I > 0) Q.dot(g, F.x(cx), F.y(0), "fk", 3); else txt(g, F.x(cx), F.y(0) + 5, "×", "s", "middle"); });
      const s = o == 1 ? 1 : -1, L = 0.25 + 0.3 / d;
      vec(g, F, -d / 2, 0, -d / 2 + s * L, 0, "d", "fd", "F", "td"); vec(g, F, d / 2, 0, d / 2 - s * L, 0, "d", "fd", "F", "td");
      const dm = d * 0.05, f = (2e-7 * 10 * 10) / dm;
      read.textContent = (o == 1 ? "같은 방향(둘 다 종이에서 나옴): 당긴다." : "반대 방향: 밀어낸다.") + ` 10 A씩, 간격 ${num(dm * 100, 1)} cm이면 F/L = μ₀I₁I₂/2πd = ${num(f * 1000, 2)} mN/m`;
    });
  });

  // 6.3 굵은 도선의 자기장: 앙페르 고리
  Q.def("c4-ampere", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const A = Q.frame(-3, 3, -3, 3, 10, 250, 20, 260), B = Q.frame(-0.1, 3, -0.05, 0.6, 290, 510, 20, 250);
    Q.bind(fig, ({ r }) => {
      clear(g);
      el("circle", { cx: A.x(0), cy: A.y(0), r: A.x(1) - A.x(0), class: "lb" }, g);
      for (let i = 0; i < 14; i++) { const t = i * 2.4, s = Math.sqrt((i + 0.5) / 14) * 0.85; Q.dot(g, A.x(s * Math.cos(t)), A.y(s * Math.sin(t)), "fb", 2); }
      el("circle", { cx: A.x(0), cy: A.y(0), r: A.x(r) - A.x(0), class: "a dsh" }, g);
      const Bv = r < 1 ? r / 2 : 1 / (2 * r);
      for (let i = 0; i < 8; i++) { const t = (i * PI) / 4, L = 0.3 + Bv * 1.5, px = r * Math.cos(t), py = r * Math.sin(t); vec(g, A, px - (L / 2) * -Math.sin(t), py - (L / 2) * Math.cos(t), px + (L / 2) * -Math.sin(t), py + (L / 2) * Math.cos(t), "d", "fd"); }
      Q.line(g, B.x(0), B.y(0), B.x(3), B.y(0), "ax"); Q.line(g, B.x(0), B.y(-0.05), B.x(0), B.y(0.6), "ax");
      [1, 2, 3].forEach((v) => txt(g, B.x(v), B.y(0) + 14, `${v}R`, "s", "middle")); txt(g, B.x(0) + 6, B.y(0.6) + 12, "B", "i");
      Q.plot(g, B, (s) => (s < 1 ? s / 2 : 1 / (2 * s)), "a", 0, 3);
      Q.dot(g, B.x(r), B.y(Bv), "fd", 5);
      const Iin = r < 1 ? r * r : 1;
      read.textContent = `r = ${num(r, 2)}R: 고리가 감싼 전류 ${num(Iin * 100, 0)}% → B·2πr = μ₀I_안, B = ${num(Bv * 2, 3)} × μ₀I/(2πR)`;
    });
  });

  // 7.1 레일 위를 미끄러지는 막대: 운동 기전력
  Q.def("c4-rail", (fig, svg) => {
    const F = Q.frame(0, 10, 0, 6, 20, 500, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ v, B }) => {
      clear(g);
      for (let x = 0.8; x < 9.6; x += 0.8) for (let y = 0.9; y < 5.4; y += 0.8) txt(g, F.x(x), F.y(y) + 4, "×", "s", "middle").setAttribute("style", "opacity:.35");
      const xb = 3 + v * 1.4, L = 0.5, R = 0.2, e = B * L * v, I = e / R, Fm = I * L * B;
      poly(g, F, [[xb, 4.5], [1, 4.5], [1, 1.5], [xb, 1.5]], "k", true);
      rect(g, F, 1, 1.5, xb, 4.5, "la").setAttribute("style", "opacity:.35");
      rect(g, F, xb - 0.12, 1.2, xb + 0.12, 4.8, "lk");
      vec(g, F, xb + 0.3, 3, xb + 0.3 + 0.6 + v * 0.4, 3, "b", "fb", "v", "tb");
      vec(g, F, xb - 0.3, 2.2, xb - 0.3 - Math.min(2, 0.4 + Fm * 2), 2.2, "d", "fd", "F 자기", "td");
      if (I > 0) { vec(g, F, 1.8, 4.5, 1.2, 4.5, "c", "fc"); vec(g, F, 1, 3.4, 1, 2.6, "c", "fc"); txt(g, F.x(0.6), F.y(3) + 4, "I", "i", "end"); }
      txt(g, F.x(1.1), F.y(5.6), "B (종이 안쪽으로), 막대 길이 0.50 m, 회로 저항 0.20 Ω", "s", "start");
      read.textContent = `ε = BLv = ${num(e, 2)} V, I = ${num(I, 2)} A(시계 반대 방향), 막대가 받는 자기력 ${num(Fm, 2)} N(운동 반대). 끄는 일률 ${num(Fm * v, 2)} W = 저항의 전력 ${num(I * I * R, 2)} W`;
    });
  });

  // 7.2 RL 회로: 전류가 서서히 늘어난다
  Q.def("c4-rl", (fig, svg) => {
    const F = Q.frame(-0.004, 0.105, -0.08, 1.15, 60, 490, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ t, L }) => {
      clear(g);
      const R = 10, tau = L / R, I0 = 1.2;
      axl(g, F, [0.02, 0.04, 0.06, 0.08, 0.1], [0.5, 1], "t (s)", "i / (ε/R)");
      Q.plot(g, F, (s) => 1 - Math.exp(-s / tau), "a", 0, 0.105);
      Q.line(g, F.x(tau), F.y(0), F.x(tau), F.y(1.05), "gd dsh"); txt(g, F.x(tau) + 4, F.y(0.3), "τ = L/R", "i", "start");
      const i = 1 - Math.exp(-t / tau); Q.dot(g, F.x(t), F.y(i), "fa", 5);
      const E = 12, Ii = (E / R) * i;
      read.textContent = `L = ${num(L, 2)} H, R = 10 Ω, ε = 12 V: τ = ${num(tau * 1000, 0)} ms. t = ${num(t * 1000, 0)} ms에서 전류 ${num(Ii, 3)} A, 저장 에너지 ½Li² = ${num(0.5 * L * Ii * Ii * 1000, 1)} mJ`;
    });
  });

  // 7.3 LC 진동: 에너지가 전기장과 자기장 사이를 오간다
  Q.def("c4-lc", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(-0.05, 1.32, -1.25, 1.25, 50, 380, 20, 260), B = Q.frame(0, 10, 0, 10, 390, 510, 20, 260);
    Q.bind(fig, ({ t }) => {
      clear(g);
      const w = 2 * PI, q = Math.cos(w * t), i = -Math.sin(w * t);
      Q.line(g, F.x(0), F.y(0), F.x(1.3), F.y(0), "ax"); Q.line(g, F.x(0), F.y(-1.2), F.x(0), F.y(1.2), "ax");
      [0.25, 0.5, 0.75, 1].forEach((v) => txt(g, F.x(v), F.y(0) + 14, `${v}T`, "s", "middle"));
      Q.plot(g, F, (s) => Math.cos(w * s), "a", 0, 1.3); Q.plot(g, F, (s) => -Math.sin(w * s), "d dsh", 0, 1.3);
      Q.dot(g, F.x(t), F.y(q), "fa", 5); Q.dot(g, F.x(t), F.y(i), "fd", 5);
      txt(g, F.x(1.3), F.y(1.1), "q/Q", "ta", "end"); txt(g, F.x(1.3), F.y(-1.1) + 10, "i/(ωQ)", "td", "end");
      const Ue = q * q, Ub = i * i;
      rect(g, B, 1.5, 1, 4, 1 + 8 * Ue, "la"); rect(g, B, 6, 1, 8.5, 1 + 8 * Ub, "ld");
      txt(g, B.x(2.75), B.y(0.3), "전기", "s", "middle"); txt(g, B.x(7.25), B.y(0.3), "자기", "s", "middle");
      read.textContent = `t = ${num(t, 2)}T: 전기 에너지 q²/2C가 전체의 ${num(Ue * 100, 0)}%, 자기 에너지 ½Li²가 ${num(Ub * 100, 0)}% (합은 일정)`;
    });
  });

  // 8.1 RLC 공명 곡선
  Q.def("c4-reso", (fig, svg) => {
    const F = Q.frame(-5, 165, -0.08, 1.35, 60, 490, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const L = 0.5, C = 10e-6, V = 120;
    Q.bind(fig, ({ f, R }) => {
      clear(g);
      const Ir = (x) => { const w = 2 * PI * x; return V / Math.hypot(R, w * L - 1 / (w * C)); };
      axl(g, F, [40, 80, 120, 160], [0.4, 0.8, 1.2], "f (Hz)", "I_rms (A)");
      Q.plot(g, F, (x) => Math.min(Ir(x), 1.34), "a", 2, 165, 400);
      const f0 = 1 / (2 * PI * Math.sqrt(L * C)); Q.line(g, F.x(f0), F.y(0), F.x(f0), F.y(1.3), "gd dsh"); txt(g, F.x(f0), F.y(1.3) - 4, "f₀", "i", "middle");
      const w = 2 * PI * f, XL = w * L, XC = 1 / (w * C), Z = Math.hypot(R, XL - XC), ph = (Math.atan2(XL - XC, R) * 180) / PI;
      Q.dot(g, F.x(f), F.y(Math.min(V / Z, 1.34)), "fd", 5);
      read.textContent = `f = ${f} Hz: X_L = ${num(XL, 0)} Ω, X_C = ${num(XC, 0)} Ω, Z = ${num(Z, 0)} Ω, I = ${num(V / Z, 2)} A, 위상차 ${num(ph, 1)}° (${ph > 0 ? "전압이 앞섬" : ph < 0 ? "전류가 앞섬" : "같은 위상"}). 공명 f₀ = ${num(f0, 0)} Hz`;
    });
  });

  // 9.1 변위 전류: 충전 중인 축전기
  Q.def("c4-disp", (fig, svg) => {
    const F = Q.frame(0, 10, 0, 6, 20, 500, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ t, s }) => {
      clear(g);
      const q = 1 - Math.exp(-t), I = Math.exp(-t);
      Q.line(g, F.x(0.3), F.y(3), F.x(4.6), F.y(3), "k"); Q.line(g, F.x(5.4), F.y(3), F.x(9.7), F.y(3), "k");
      rect(g, F, 4.5, 1.2, 4.62, 4.8, "ld"); rect(g, F, 5.38, 1.2, 5.5, 4.8, "la");
      const n = Math.round(1 + q * 6);
      for (let i = 0; i < n; i++) { const y = 1.5 + (3 * (i + 0.5)) / n; vec(g, F, 4.68, y, 5.32, y, "gd", "lk"); }
      if (I > 0.02) vec(g, F, 1.2, 3, 1.2 + 0.5 + I, 3, "c", "fc", "I", "tc");
      el("ellipse", { cx: F.x(2.8), cy: F.y(3), rx: 9, ry: F.y(1.9) - F.y(3), class: "a" }, g); txt(g, F.x(2.8), F.y(4.35), "고리", "ta", "middle");
      if (s == 0) el("ellipse", { cx: F.x(2.8), cy: F.y(3), rx: 9, ry: F.y(1.9) - F.y(3), class: "lb" }, g);
      else el("path", { d: `M${F.x(2.8)} ${F.y(4.1)} C ${F.x(5.6)} ${F.y(5.4)}, ${F.x(5.6)} ${F.y(0.6)}, ${F.x(2.8)} ${F.y(1.9)}`, class: "lb b" }, g);
      read.textContent = s == 0
        ? `평평한 면: 도선의 전류 I = ${num(I, 2)} I₀가 지난다.`
        : `부풀린 면: 전류는 지나지 않지만 판 사이 전기 선속이 변해 변위 전류 ε₀dΦ_E/dt = ${num(I, 2)} I₀가 지난다. 두 면의 값이 같다.`;
    });
  });

  // 9.2 평면 전자기파: E와 B가 같은 위상으로 수직하게 진동
  Q.def("c4-emw", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const P = (x, y, z) => [40 + 42 * x - 22 * z, 150 - 50 * y + 14 * z];
    Q.bind(fig, ({ t }) => {
      clear(g);
      const k = (2 * PI) / 4, ph = 2 * PI * t;
      const ax = [[[0, 0, 0], [10.5, 0, 0], "x"], [[0, -1.6, 0], [0, 1.8, 0], "E (y)"], [[0, 0, -2.2], [0, 0, 2.6], "B (z)"]];
      ax.forEach(([a, b, nm]) => { const p = P(...a), q = P(...b); Q.line(g, p[0], p[1], q[0], q[1], "ax"); txt(g, q[0] + 4, q[1] - 4, nm, "i", "start"); });
      let dE = "", dB = "";
      for (let i = 0; i <= 200; i++) { const x = (10 * i) / 200, v = Math.sin(k * x - ph), a = P(x, v, 0), b = P(x, 0, v * 1.6); dE += (i ? "L" : "M") + a[0].toFixed(1) + " " + a[1].toFixed(1); dB += (i ? "L" : "M") + b[0].toFixed(1) + " " + b[1].toFixed(1); }
      for (let x = 0.25; x < 10; x += 0.5) { const v = Math.sin(k * x - ph), o = P(x, 0, 0), a = P(x, v, 0), b = P(x, 0, v * 1.6); Q.line(g, o[0], o[1], a[0], a[1], "d"); Q.line(g, o[0], o[1], b[0], b[1], "a"); }
      el("path", { d: dE, class: "d" }, g); el("path", { d: dB, class: "a" }, g);
      const o = P(10, 0, 0), e = P(10.8, 0, 0); Q.arrow(g, o[0], o[1], e[0] + 20, e[1], "k", "fk");
      read.textContent = `E(빨강, y 방향)와 B(파랑, z 방향)는 같은 위상으로 진동하고, 파동은 E × B 방향(+x)으로 c로 나아간다. 진공에서 E = cB.`;
    });
  });

  // 10.1 스넬 법칙과 전반사
  Q.def("c4-snell", (fig, svg) => {
    const F = Q.frame(-2.6, 2.6, -1.35, 1.35, 20, 500, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const pairs = [[1.0, 1.5, "공기 → 유리"], [1.5, 1.0, "유리 → 공기"], [1.33, 1.0, "물 → 공기"], [2.42, 1.0, "다이아몬드 → 공기"]];
    Q.bind(fig, ({ a, s }) => {
      clear(g);
      const [n1, n2, nm] = pairs[s], t1 = rad(a), sin2 = (n1 / n2) * Math.sin(t1), R = 1.25;
      rect(g, F, -2.6, -1.35, 2.6, 0, n2 > n1 ? "lb" : "lk"); rect(g, F, -2.6, 0, 2.6, 1.35, n1 > n2 ? "lb" : "lk");
      Q.line(g, F.x(-2.6), F.y(0), F.x(2.6), F.y(0), "k"); Q.line(g, F.x(0), F.y(-1.3), F.x(0), F.y(1.3), "gd dsh");
      txt(g, F.x(-2.5), F.y(1.15), `n₁ = ${n1}`, "s", "start"); txt(g, F.x(-2.5), F.y(-1.15) + 8, `n₂ = ${n2}`, "s", "start");
      vec(g, F, -R * Math.sin(t1), R * Math.cos(t1), 0, 0, "d", "fd");
      const tir = sin2 > 1, rr = tir ? 1 : 0.35;
      el("path", { d: `M${F.x(0)} ${F.y(0)}L${F.x(R * Math.sin(t1))} ${F.y(R * Math.cos(t1))}`, class: "d", style: `opacity:${rr}` }, g);
      if (!tir) { const t2 = Math.asin(sin2); vec(g, F, 0, 0, R * Math.sin(t2), -R * Math.cos(t2), "a", "fa"); }
      const tc = n1 > n2 ? (Math.asin(n2 / n1) * 180) / PI : null;
      read.textContent = `${nm}, 입사각 ${a}°: ` + (tir ? `sin θ₂ = ${num(sin2, 2)} > 1 이므로 굴절하지 못하고 모두 반사된다(전반사).` : `굴절각 ${num((Math.asin(sin2) * 180) / PI, 1)}°`) + (tc ? ` 임계각 ${num(tc, 1)}°` : "");
    });
  });

  // 11.1 이중 슬릿 무늬와 단일 슬릿 회절 포락선
  Q.def("c4-young", (fig, svg) => {
    const F = Q.frame(-16, 16, -0.08, 1.15, 40, 500, 60, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ d, a, lam }) => {
      clear(g);
      const L = 1, I = (y) => { const th = Math.atan(y / 1000 / L), b = (PI * a * 1e-3 * Math.sin(th)) / (lam * 1e-9), env = b === 0 ? 1 : (Math.sin(b) / b) ** 2; return env * Math.cos((PI * d * 1e-3 * Math.sin(th)) / (lam * 1e-9)) ** 2; };
      const env = (y) => { const th = Math.atan(y / 1000 / L), b = (PI * a * 1e-3 * Math.sin(th)) / (lam * 1e-9); return b === 0 ? 1 : (Math.sin(b) / b) ** 2; };
      for (let i = 0; i < 230; i++) { const y = -16 + (32 * i) / 230, v = I(y); el("rect", { x: F.x(y), y: 12, width: (F.x(32) - F.x(0)) / 230 + 0.6, height: 36, class: "fd", style: `opacity:${v.toFixed(3)}` }, g); }
      Q.line(g, F.x(-16), F.y(0), F.x(16), F.y(0), "ax");
      [-15, -10, -5, 0, 5, 10, 15].forEach((v) => txt(g, F.x(v), F.y(0) + 14, v, "s", "middle")); txt(g, F.x(16), F.y(0) - 6, "y (mm)", "i", "end");
      Q.plot(g, F, env, "gd dsh", -16, 16, 400); Q.plot(g, F, I, "a", -16, 16, 800);
      const dy = (lam * 1e-9 * L) / (d * 1e-3) * 1000, w = ((2 * lam * 1e-9 * L) / (a * 1e-3)) * 1000;
      read.textContent = `밝은 무늬 간격 λL/d = ${num(dy, 2)} mm, 가운데 회절 무늬 폭 2λL/a = ${num(w, 1)} mm (스크린 거리 1.0 m)`;
    });
  });

  // 11.2 회절 격자: 슬릿 수가 늘면 밝은 무늬가 가늘어진다
  Q.def("c4-grating", (fig, svg) => {
    const F = Q.frame(-1.05, 1.05, -0.06, 1.12, 40, 500, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ N, lam }) => {
      clear(g);
      const dmm = 1 / 600, r = (lam * 1e-6) / dmm;
      const I = (s) => { const be = (PI * s) / r; const sb = Math.sin(be); return Math.abs(sb) < 1e-6 ? 1 : (Math.sin(N * be) / (N * sb)) ** 2; };
      Q.line(g, F.x(-1.05), F.y(0), F.x(1.05), F.y(0), "ax");
      [-1, -0.5, 0, 0.5, 1].forEach((v) => txt(g, F.x(v), F.y(0) + 14, num(v, 1), "s", "middle")); txt(g, F.x(1.05), F.y(0) - 6, "sin θ", "i", "end");
      Q.plot(g, F, I, "a", -1, 1, 1500);
      const out = []; for (let m = -3; m <= 3; m++) { const s = m * r; if (Math.abs(s) <= 1) { Q.line(g, F.x(s), F.y(1.02), F.x(s), F.y(1.1), "d"); txt(g, F.x(s), F.y(1.1) - 2, m, "td", "middle"); if (m > 0) out.push(`${m}차 ${num((Math.asin(s) * 180) / PI, 1)}°`); } }
      read.textContent = `슬릿 ${N}개, 600개/mm, λ = ${lam} nm: 밝은 무늬 ` + out.join(", ") + ". 슬릿이 많을수록 무늬가 가늘고 날카롭다.";
    });
  });

  // 12.1 빛 시계와 γ
  Q.def("c4-clock", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const A = Q.frame(0, 10, 0, 6, 10, 290, 20, 260), B = Q.frame(-0.03, 1.02, 0.6, 7.5, 320, 510, 20, 250);
    Q.bind(fig, ({ b }) => {
      clear(g);
      const gam = 1 / Math.sqrt(1 - b * b), h = 4, half = (b / Math.sqrt(1 - b * b)) * h;
      const x0 = 1, x1 = x0 + Math.min(half, 3.8), x2 = x0 + 2 * Math.min(half, 3.8);
      Q.line(g, A.x(0.5), A.y(1), A.x(9.5), A.y(1), "k"); Q.line(g, A.x(0.5), A.y(1 + h), A.x(9.5), A.y(1 + h), "k");
      el("path", { d: `M${A.x(x0)} ${A.y(1)}L${A.x(x1)} ${A.y(1 + h)}L${A.x(x2)} ${A.y(1)}`, class: "c" }, g);
      Q.line(g, A.x(x0), A.y(1), A.x(x0), A.y(1 + h), "a dsh");
      txt(g, A.x(x0) - 4, A.y(3), "c Δt₀/2", "ta", "end"); txt(g, A.x((x0 + x1) / 2) + 6, A.y(3.6), "c Δt/2", "tc", "start");
      Q.line(g, B.x(0), B.y(1), B.x(1), B.y(1), "ax"); Q.line(g, B.x(0), B.y(0.6), B.x(0), B.y(7.5), "ax");
      [0.5, 1].forEach((v) => txt(g, B.x(v), B.y(1) + 14, num(v, 1), "s", "middle")); [3, 5, 7].forEach((v) => txt(g, B.x(0) - 4, B.y(v) + 4, v, "s", "end"));
      txt(g, B.x(1), B.y(1) - 6, "v/c", "i", "end"); txt(g, B.x(0) + 6, B.y(7.5) + 12, "γ", "i");
      Q.plot(g, B, (u) => 1 / Math.sqrt(1 - u * u), "a", 0, 0.99, 300); Q.dot(g, B.x(b), B.y(Math.min(gam, 7.5)), "fd", 5);
      read.textContent = `v = ${num(b, 3)}c: γ = ${num(gam, 3)}. 움직이는 시계의 1 s는 ${num(gam, 3)} s로 늘어나고, 1 m 막대는 ${num(1 / gam, 3)} m로 줄어든다.`;
    });
  });

  // 12.2 전자의 운동 에너지: 고전 공식과 상대론
  Q.def("c4-relke", (fig, svg) => {
    const F = Q.frame(-0.1, 3.1, -0.05, 2.1, 60, 490, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const mc2 = 0.511;
    Q.bind(fig, ({ K }) => {
      clear(g);
      axl(g, F, [1, 2, 3], [0.5, 1, 1.5, 2], "K (MeV)", "v / c");
      Q.line(g, F.x(0), F.y(1), F.x(3.1), F.y(1), "d dsh"); txt(g, F.x(3.1), F.y(1) - 6, "빛의 속력", "td", "end");
      Q.plot(g, F, (k) => Math.sqrt((2 * k) / mc2), "gd", 0, 3.1);
      Q.plot(g, F, (k) => Math.sqrt(1 - 1 / (1 + k / mc2) ** 2), "a", 0, 3.1);
      const vr = Math.sqrt(1 - 1 / (1 + K / mc2) ** 2), vc = Math.sqrt((2 * K) / mc2);
      Q.dot(g, F.x(K), F.y(vr), "fa", 5); if (vc < 2.1) Q.dot(g, F.x(K), F.y(vc), "fk", 4);
      read.textContent = `K = ${num(K, 2)} MeV: γ = ${num(1 + K / mc2, 2)}, 상대론 v = ${num(vr, 3)}c, 고전 공식 ½mv²로는 ${num(vc, 2)}c` + (vc > 1 ? " (불가능)" : "");
    });
  });

  // 12.3 광전 효과: K_max = hf − φ
  Q.def("c4-photo", (fig, svg) => {
    const F = Q.frame(-0.2, 12.5, -0.3, 4.3, 60, 490, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const metals = [["세슘", 2.1], ["나트륨", 2.28], ["아연", 4.3]];
    Q.bind(fig, ({ lam, s }) => {
      clear(g);
      axl(g, F, [2, 4, 6, 8, 10, 12], [1, 2, 3, 4], "f (10¹⁴ Hz)", "K_max (eV)");
      const h = 4.136e-15;
      metals.forEach(([nm, phi], i) => { const f0 = phi / h / 1e14; Q.plot(g, F, (f) => (f >= f0 ? h * f * 1e14 - phi : NaN), i == s ? "a" : "gd", f0, 12.5); Q.dot(g, F.x(f0), F.y(0), i == s ? "fa" : "fk", 3); txt(g, F.x(f0), F.y(0) - 8, nm, "s", "middle"); });
      const f = 3e8 / (lam * 1e-9) / 1e14, phi = metals[s][1], E = 1240 / lam, K = E - phi;
      Q.line(g, F.x(f), F.y(0), F.x(f), F.y(4.2), "d dsh");
      if (K > 0) Q.dot(g, F.x(f), F.y(K), "fd", 5);
      read.textContent = `${metals[s][0]}(일함수 ${phi} eV), λ = ${lam} nm: 광자 에너지 1240/λ = ${num(E, 2)} eV → ` + (K > 0 ? `K_max = ${num(K, 2)} eV, 저지 전압 ${num(K, 2)} V` : `일함수보다 작아 전자가 나오지 않는다(문턱 파장 ${num(1240 / phi, 0)} nm)`);
    });
  });

  // ── 새 그림은 이 위에 ──
})();
