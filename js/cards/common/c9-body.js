/* 공통9(고등미적분학 2) 본문 카드의 조작 그림 (js/lib/qfig.js의 NMQ를 쓴다). 그림마다 NMQ.def("이름", …). */
(() => {
  "use strict";
  const Q = window.NMQ;
  if (!Q) return;
  const { el, clear, txt, num } = Q;
  const PI = Math.PI;
  const rect = (g, F, x0, y0, x1, y1, cls) => el("rect", { x: Math.min(F.x(x0), F.x(x1)), y: Math.min(F.y(y0), F.y(y1)), width: Math.abs(F.x(x1) - F.x(x0)), height: Math.abs(F.y(y1) - F.y(y0)), class: cls }, g);
  const poly = (g, F, pts, cls, open) => el("path", { d: pts.map((p, i) => (i ? "L" : "M") + F.x(p[0]).toFixed(1) + " " + F.y(p[1]).toFixed(1)).join("") + (open ? "" : "Z"), class: cls }, g);
  const line = (g, F, pts, cls) => { if (pts.length > 1) poly(g, F, pts, cls, true).setAttribute("style", "fill:none"); };
  // 축과 눈금 글자: xt, yt는 눈금 값 목록 (축은 x = 0, y = 0을 지난다)
  const axl = (g, F, xt, yt, xs, ys) => {
    const ox = Math.min(Math.max(0, F.x0), F.x1), oy = Math.min(Math.max(0, F.y0), F.y1);
    Q.line(g, F.X0, F.y(oy), F.X1, F.y(oy), "ax"); Q.line(g, F.x(ox), F.Y0, F.x(ox), F.Y1, "ax");
    xt.forEach((v) => txt(g, F.x(v), F.y(oy) + 14, typeof v === "number" ? num(v) : v, "s", "middle"));
    yt.forEach((v) => txt(g, F.x(ox) - 5, F.y(v) + 4, num(v), "s", "end"));
    if (xs) txt(g, F.X1 - 4, F.y(oy) - 6, xs, "i", "end");
    if (ys) txt(g, F.x(ox) + 6, F.Y0 + 14, ys, "i");
  };
  // 그림 틀 밖을 잘라 내는 clipPath (같은 틀이면 한 번만 만든다)
  const clip = (g, svg, F) => {
    svg.__cid = svg.__cid || Math.random().toString(36).slice(2, 7);
    const id = `c${svg.__cid}_${Math.round(F.X0)}_${Math.round(F.Y0)}_${Math.round(F.X1)}_${Math.round(F.Y1)}`;
    if (!svg.querySelector("#" + id)) { const d = el("defs", {}, svg); const cp = el("clipPath", { id }, d); el("rect", { x: F.X0, y: F.Y0, width: F.X1 - F.X0, height: F.Y1 - F.Y0 }, cp); }
    g.setAttribute("clip-path", `url(#${id})`);
  };
  const erf = (x) => { const s = Math.sign(x), a = Math.abs(x), t = 1 / (1 + 0.3275911 * a); return s * (1 - t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429)))) * Math.exp(-a * a)); };
  const piLab = (v) => (v === 0 ? "0" : v === 1 ? "π" : v === -1 ? "−π" : `${v}π`);

  // 1.1 사각 펄스의 푸리에 적분 계수: 좁을수록 넓게 퍼진다
  Q.def("c9-fint", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ a }) => {
      clear(g);
      const F = Q.frame(-3, 3, -0.2, 1.3, 30, 200, 20, 230), G = Q.frame(0, 15, -0.3, 1.4, 240, 505, 20, 230);
      axl(g, F, [-2, -1, 1, 2], [1], "x", "f");
      line(g, F, [[-3, 0], [-a, 0], [-a, 1], [a, 1], [a, 0], [3, 0]], "c");
      axl(g, G, [5, 10, 15], [0.5, 1], "w", "A(w)");
      Q.plot(g, G, (w) => (w === 0 ? (2 * a) / PI : (2 * Math.sin(a * w)) / (PI * w)), "a", 0.0001, 15, 500);
      const z = PI / a; Q.dot(g, G.x(z), G.y(0), "fd", 4);
      read.textContent = `폭 2a = ${num(2 * a, 2)}: A(w) = 2 sin(${a}w)/(πw), A(0) = ${num((2 * a) / PI, 3)}, 첫 0점 w = π/${a} = ${num(z, 2)}(빨간 점). 펄스가 좁을수록 봉우리가 넓게 퍼진다.`;
    });
  });

  // 1.2 e^{−ax} (x > 0)의 푸리에 변환의 크기
  Q.def("c9-ftrans", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ a }) => {
      clear(g);
      const F = Q.frame(-1, 5, -0.1, 1.15, 30, 230, 20, 230), G = Q.frame(-8, 8, 0, 0.45, 270, 505, 20, 230);
      axl(g, F, [1, 2, 3, 4], [1], "x", "f");
      Q.plot(g, F, (x) => (x < 0 ? 0 : Math.exp(-a * x)), "c", -1, 5, 300);
      axl(g, G, [-6, -3, 3, 6], [0.2, 0.4], "w", "|f̂(w)|");
      const M = (w) => 1 / (Math.sqrt(2 * PI) * Math.sqrt(a * a + w * w));
      Q.plot(g, G, (w) => Math.min(M(w), 0.45), "a", -8, 8, 400);
      read.textContent = `a = ${a}: |f̂(w)| = 1/(√(2π)·√(${a}² + w²)), |f̂(0)| = ${num(M(0), 3)}, |f̂(${a})| = ${num(M(a), 3)}. a가 클수록(빨리 꺼질수록) 높은 진동수 성분이 상대적으로 커진다.`;
    });
  });

  // 2.1 같은 처음 모양에서 파동방정식과 열방정식의 서로 다른 거동
  Q.def("c9-pdecmp", (fig, svg) => {
    const F = Q.frame(0, PI, -1.25, 1.25, 50, 490, 15, 235), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ e, t }) => {
      clear(g);
      axl(g, F, [], [-1, 1], "x", "u");
      txt(g, F.x(PI), F.y(0) + 14, "π", "s", "middle");
      const f0 = (x) => Math.sin(x) + 0.5 * Math.sin(3 * x);
      const u = e == 0 ? (x) => Math.cos(t) * Math.sin(x) + 0.5 * Math.cos(3 * t) * Math.sin(3 * x) : (x) => Math.exp(-t) * Math.sin(x) + 0.5 * Math.exp(-9 * t) * Math.sin(3 * x);
      Q.plot(g, F, f0, "gd dsh", 0, PI, 200);
      Q.plot(g, F, u, "a", 0, PI, 300);
      read.textContent = (e == 0 ? `파동방정식 u_tt = u_xx, t = ${t}: 모양이 진동하며 처음 모양으로 되돌아온다(주기 2π).` : `열방정식 u_t = u_xx, t = ${t}: 꼬불꼬불한 부분부터 사라지며 0으로 가라앉는다.`) + " 회색 점선은 처음 모양이다.";
    });
  });

  // 2.2 휘어진 정도가 가속도: 줄의 각 점에 u_tt = c²u_xx 화살표
  Q.def("c9-string", (fig, svg) => {
    const F = Q.frame(0, PI, -1.6, 1.6, 50, 490, 15, 235), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const S = [["sin x + 0.5 sin 3x", (x) => Math.sin(x) + 0.5 * Math.sin(3 * x), (x) => -Math.sin(x) - 4.5 * Math.sin(3 * x)], ["sin x", (x) => Math.sin(x), (x) => -Math.sin(x)], ["삼각형(가운데를 당김)", (x) => (x < PI / 2 ? x : PI - x) / (PI / 2), null]];
    Q.bind(fig, ({ k }) => {
      clear(g);
      axl(g, F, [], [-1, 1], "x", "u");
      const [nm, f, f2] = S[k];
      Q.plot(g, F, f, "a", 0, PI, 300);
      for (let i = 1; i < 12; i++) {
        const x = (PI * i) / 12, acc = f2 ? f2(x) : Math.abs(x - PI / 2) < 0.01 ? -3 : 0, y = f(x);
        if (Math.abs(acc) > 1e-6) Q.arrow(g, F.x(x), F.y(y), F.x(x), F.y(y + Math.max(-1.5, Math.min(1.5, acc * 0.25))), "c", "fc");
        Q.dot(g, F.x(x), F.y(y), "fa", 3);
      }
      if (!f2) { Q.arrow(g, F.x(PI / 2), F.y(1), F.x(PI / 2), F.y(0.4), "c", "fc"); }
      read.textContent = `처음 모양 ${nm}: 주황 화살표가 각 점의 가속도 u_tt = c²u_xx(줄여 그림)이다. 위로 볼록한 곳은 아래로, 아래로 볼록한 곳은 위로 당겨져 줄이 펴지려 한다.` + (k == 2 ? " 삼각형은 꺾인 꼭짓점에만 가속도가 몰려 있다." : "");
    });
  });

  // 2.3 고유 진동의 중첩: B₁ sin x cos t + B₃ sin 3x cos 3t
  Q.def("c9-sepmodes", (fig, svg) => {
    const F = Q.frame(0, PI, -1.7, 1.7, 50, 490, 15, 235), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ b3, t }) => {
      clear(g);
      axl(g, F, [], [-1, 1], "x", "u");
      Q.plot(g, F, (x) => Math.cos(t) * Math.sin(x), "b dsh", 0, PI, 200);
      Q.plot(g, F, (x) => b3 * Math.cos(3 * t) * Math.sin(3 * x), "c dsh", 0, PI, 200);
      Q.plot(g, F, (x) => Math.cos(t) * Math.sin(x) + b3 * Math.cos(3 * t) * Math.sin(3 * x), "a", 0, PI, 300);
      [PI / 3, (2 * PI) / 3].forEach((x) => Q.dot(g, F.x(x), F.y(0), "fd", 3));
      read.textContent = `t = ${t}: 기본음 cos t·sin x(청록)와 셋째 배음 ${b3}·cos 3t·sin 3x(주황)의 합(파랑). 셋째 배음은 세 배 빠르게 진동하고, 빨간 점(마디)에서는 움직이지 않는다.`;
    });
  });

  // 2.4 달랑베르: 봉우리가 둘로 갈라져 양쪽으로
  Q.def("c9-dal", (fig, svg) => {
    const F = Q.frame(-10, 10, -0.1, 1.1, 40, 500, 15, 235), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const f = (x) => 1 / (1 + x * x);
    Q.bind(fig, ({ t }) => {
      clear(g);
      axl(g, F, [-8, -4, 4, 8], [0.5, 1], "x", "u");
      Q.plot(g, F, (x) => 0.5 * f(x + t), "b dsh", -10, 10, 300); Q.plot(g, F, (x) => 0.5 * f(x - t), "c dsh", -10, 10, 300);
      Q.plot(g, F, (x) => 0.5 * (f(x + t) + f(x - t)), "a", -10, 10, 400);
      read.textContent = `t = ${t}: u = ½[f(x + t) + f(x − t)]. 왼쪽으로 가는 ½f(x + t)(청록)와 오른쪽으로 가는 ½f(x − t)(주황)가 x = ±${t}에 있고, 그 자리의 높이는 ½(1 + f(2t)) = ${num(0.5 * (1 + f(2 * t)), 3)}이다.`;
    });
  });

  // 2.5 열방정식: 높은 모드가 먼저 사라진다
  Q.def("c9-heatbar", (fig, svg) => {
    const F = Q.frame(0, PI, -60, 160, 50, 490, 15, 235), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ t }) => {
      clear(g);
      axl(g, F, [], [-50, 50, 100, 150], "x", "u (°C)");
      const a = 100 * Math.exp(-t), b = 50 * Math.exp(-9 * t);
      Q.plot(g, F, (x) => 100 * Math.sin(x) + 50 * Math.sin(3 * x), "gd dsh", 0, PI, 200);
      Q.plot(g, F, (x) => a * Math.sin(x), "b dsh", 0, PI, 200); Q.plot(g, F, (x) => b * Math.sin(3 * x), "c dsh", 0, PI, 200);
      Q.plot(g, F, (x) => a * Math.sin(x) + b * Math.sin(3 * x), "a", 0, PI, 300);
      read.textContent = `t = ${t}: 첫째 항 계수 100e^{−t} = ${num(a, 2)}(청록), 셋째 항 계수 50e^{−9t} = ${num(b, b < 0.1 ? 4 : 2)}(주황). 셋째 항이 9배 빨리 줄어 곧 매끈한 사인 곡선만 남는다.`;
    });
  });

  // 2.6 무한히 긴 막대: 확산하는 온도
  Q.def("c9-heatinf", (fig, svg) => {
    const F = Q.frame(-8, 8, -5, 110, 40, 500, 15, 235), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ t }) => {
      clear(g);
      axl(g, F, [-6, -3, 3, 6], [50, 100], "x", "u (°C)");
      Q.plot(g, F, (x) => (Math.abs(x) < 1 ? 100 : 0), "gd dsh", -8, 8, 801);
      const u = (x) => 50 * (erf((x + 1) / (2 * Math.sqrt(t))) - erf((x - 1) / (2 * Math.sqrt(t))));
      const pts = [[-8, 0]]; for (let x = -8; x <= 8; x += 0.05) pts.push([x, u(x)]); pts.push([8, 0]);
      poly(g, F, pts, "la"); Q.plot(g, F, u, "a", -8, 8, 400);
      let A = 0; for (let x = -30; x < 30; x += 0.01) A += u(x) * 0.01;
      read.textContent = `c = 1, t = ${t}: 가운데 온도 ${num(u(0), 1)} °C, 넓이(총 열량) ${num(A, 1)}. 종이 낮아지고 넓어지지만 넓이는 200 그대로이다.`;
    });
  });

  // 2.7 직사각형 막의 (m, n) 고유 진동과 마디선
  Q.def("c9-membrane", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ m, n, ph }) => {
      clear(g);
      const X0 = 60, Y0 = 20, W = 220, H = 220, N = 44, amp = Math.cos((ph * PI) / 180);
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const x = (i + 0.5) / N, y = (j + 0.5) / N, v = amp * Math.sin(m * PI * x) * Math.sin(n * PI * y);
        el("rect", { x: X0 + (i * W) / N, y: Y0 + H - ((j + 1) * H) / N, width: W / N + 0.5, height: H / N + 0.5, class: v >= 0 ? "fa" : "fc", style: `opacity:${(Math.abs(v) * 0.85 + 0.03).toFixed(2)}` }, g);
      }
      el("rect", { x: X0, y: Y0, width: W, height: H, class: "k", style: "fill:none" }, g);
      for (let i = 1; i < m; i++) Q.line(g, X0 + (i * W) / m, Y0, X0 + (i * W) / m, Y0 + H, "k dsh");
      for (let j = 1; j < n; j++) Q.line(g, X0, Y0 + (j * H) / n, X0 + W, Y0 + (j * H) / n, "k dsh");
      const lam = PI * Math.sqrt(m * m + n * n);
      txt(g, 310, 70, `(m, n) = (${m}, ${n})`, "s", "start").setAttribute("style", "font-size:15px");
      txt(g, 310, 100, `λ = π√(${m}² + ${n}²) = ${num(lam, 3)}`, "s", "start");
      txt(g, 310, 125, `기본 진동의 ${num(lam / (PI * Math.SQRT2), 3)}배`, "s", "start");
      txt(g, 310, 160, "파랑: 위로, 주황: 아래로", "s", "start"); txt(g, 310, 182, "점선: 마디선", "s", "start");
      read.textContent = `a = b = 1, c = 1인 정사각형 막의 (${m}, ${n}) 진동: ${m * n}개 칸이 번갈아 반대로 움직인다. 진동수 비 ${num(lam / (PI * Math.SQRT2), 3)}는 대개 정수가 아니다.` + (m !== n ? ` (${n}, ${m}) 진동도 같은 진동수를 가진다.` : "");
    });
  });

  // 복소평면 틀: 정사각 격자, 실수축·허수축
  const cplane = (g, F, ticks) => {
    Q.line(g, F.X0, F.y(0), F.X1, F.y(0), "ax"); Q.line(g, F.x(0), F.Y0, F.x(0), F.Y1, "ax");
    (ticks || []).forEach((v) => { if (v) { txt(g, F.x(v), F.y(0) + 13, num(v), "s", "middle"); txt(g, F.x(0) - 4, F.y(v) + 4, `${num(v)}i`, "s", "end"); } });
    txt(g, F.X1 - 2, F.y(0) - 5, "Re", "i", "end"); txt(g, F.x(0) + 4, F.Y0 + 11, "Im", "i", "start");
  };
  const vec = (g, F, a, b, c, d, cls, lab, tcls) => { Q.arrow(g, F.x(a), F.y(b), F.x(c), F.y(d), cls, "f" + cls); if (lab) txt(g, F.x(c) + 5, F.y(d) - 5, lab, tcls || "t" + cls, "start"); };

  // 3.1 복소평면: 덧셈은 벡터 합, 켤레는 대칭
  Q.def("c9-cplane", (fig, svg) => {
    const F = Q.frame(-4, 5, -3.5, 4, 110, 410, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ x2, y2 }) => {
      clear(g);
      cplane(g, F, [-2, 2, 4]);
      const z1 = [2, 1], z2 = [x2, y2], s = [2 + x2, 1 + y2];
      line(g, F, [z1, s, z2], "gd dsh");
      vec(g, F, 0, 0, ...z1, "a", "z₁"); vec(g, F, 0, 0, ...z2, "c", "z₂"); vec(g, F, 0, 0, ...s, "d", "z₁ + z₂");
      Q.dot(g, F.x(2), F.y(-1), "fb", 4); txt(g, F.x(2) + 6, F.y(-1) + 4, "z̄₁", "tb", "start");
      const p = [2 * x2 - 1 * y2, 2 * y2 + 1 * x2];
      read.textContent = `z₁ = 2 + i, z₂ = ${x2} ${y2 < 0 ? "−" : "+"} ${Math.abs(y2)}i: z₁ + z₂ = ${num(s[0], 2)} + (${num(s[1], 2)})i, z₁z₂ = ${num(p[0], 2)} + (${num(p[1], 2)})i, |z₁ − z₂| = ${num(Math.hypot(2 - x2, 1 - y2), 3)}`;
    });
  });

  // 3.2 n제곱근은 정n각형의 꼭짓점
  Q.def("c9-roots", (fig, svg) => {
    const F = Q.frame(-1.6, 1.6, -1.35, 1.35, 120, 420, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ n, th }) => {
      clear(g);
      cplane(g, F, [-1, 1]);
      const c = []; for (let t = 0; t <= 2 * PI + 0.01; t += 0.05) c.push([Math.cos(t), Math.sin(t)]); line(g, F, c, "gd");
      const r = (th * PI) / 180, R = [];
      for (let k = 0; k < n; k++) { const a = (r + 2 * k * PI) / n; R.push([Math.cos(a), Math.sin(a)]); }
      poly(g, F, R, "lb");
      R.forEach((p, k) => { Q.dot(g, F.x(p[0]), F.y(p[1]), k === 0 ? "fa" : "fb", 5); });
      vec(g, F, 0, 0, Math.cos(r), Math.sin(r), "c", "z");
      read.textContent = `z = e^{i·${th}°}의 ${n}제곱근: 편각 (${th}° + 360°k)/${n}, k = 0, …, ${n - 1}. 첫째 근 ${num(th / n, 1)}°(파랑)부터 ${num(360 / n, 1)}°씩 돌아 정${n}각형을 이룬다.`;
    });
  });

  // 3.3 차분몫이 방향에 따라 달라지는가: z² 대 z̄
  Q.def("c9-dq", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ k, ph }) => {
      clear(g);
      const L = Q.frame(-1.4, 1.4, -1.4, 1.4, 30, 230, 20, 220), R = Q.frame(-1.6, 3.6, -2.6, 2.6, 270, 505, 20, 230);
      cplane(g, L, []); txt(g, L.x(0), L.Y1 + 14, "Δz의 방향", "s", "middle");
      const c = []; for (let t = 0; t <= 2 * PI + 0.01; t += 0.05) c.push([Math.cos(t), Math.sin(t)]); line(g, L, c, "gd");
      const a = (ph * PI) / 180; vec(g, L, 0, 0, Math.cos(a), Math.sin(a), "a", "Δz");
      cplane(g, R, [2]); txt(g, (R.X0 + R.X1) / 2, R.Y1 + 14, "차분몫 [f(z₀ + Δz) − f(z₀)]/Δz", "s", "middle");
      const z0 = [1, 0.5], h = 0.15, dz = [h * Math.cos(a), h * Math.sin(a)];
      const q = (b) => (k == 0 ? [2 * z0[0] + h * Math.cos(b), 2 * z0[1] + h * Math.sin(b)] : [Math.cos(-2 * b), Math.sin(-2 * b)]);
      const trace = []; for (let b = 0; b <= 2 * PI + 0.01; b += 0.05) trace.push(q(b)); line(g, R, trace, "gd");
      const v = q(a); Q.dot(g, R.x(v[0]), R.y(v[1]), "fd", 5);
      void dz;
      read.textContent = k == 0 ? `f = z², z₀ = 1 + 0.5i, |Δz| = 0.15: 차분몫 = 2z₀ + Δz = ${num(v[0], 2)} + ${num(v[1], 2)}i. 방향을 바꿔도 2z₀ = 2 + i 둘레의 작은 원에 머물고, Δz → 0이면 한 점으로 모인다.` : `f = z̄: 차분몫 = Δz̄/Δz = ${num(v[0], 2)} + (${num(v[1], 2)})i. 방향을 바꾸면 단위원 전체를 돌아, 가로(1)와 세로(−1)에서 값이 다르다. 극한이 없다.`;
    });
  });

  // 3.4 해석함수의 u, v 등고선은 직각으로 만난다
  Q.def("c9-uv", (fig, svg) => {
    const F = Q.frame(-2, 2, -2, 2, 130, 390, 5, 265), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    clip(g, svg, F); const g0 = el("g", {}, svg);
    const fs = [["z²", (x, y) => [x * x - y * y, 2 * x * y]], ["z² + iz", (x, y) => [x * x - y * y - y, 2 * x * y + x]], ["z̄ (해석적 아님)", (x, y) => [x, -y]]];
    Q.bind(fig, ({ k }) => {
      clear(g); clear(g0);
      cplane(g0, F, [-1, 1]);
      const [nm, f] = fs[k], N = 80, step = 4 / N;
      // 행진 사각형으로 등고선
      const iso = (comp, lv, cls) => {
        for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
          const x = -2 + i * step, y = -2 + j * step, P = [[x, y], [x + step, y], [x + step, y + step], [x, y + step]], V = P.map(([a, b]) => f(a, b)[comp] - lv), seg = [];
          for (let e = 0; e < 4; e++) { const a = V[e], b = V[(e + 1) % 4]; if ((a < 0) !== (b < 0)) { const t = a / (a - b), p = P[e], q = P[(e + 1) % 4]; seg.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]); } }
          if (seg.length >= 2) Q.line(g, F.x(seg[0][0]), F.y(seg[0][1]), F.x(seg[1][0]), F.y(seg[1][1]), cls);
        }
      };
      [-3, -2, -1, -0.5, 0.5, 1, 2, 3].forEach((lv) => { iso(0, lv, "a"); iso(1, lv, "c"); });
      const x0 = 1, y0 = 0.5, h = 1e-4, ux = (f(x0 + h, y0)[0] - f(x0 - h, y0)[0]) / (2 * h), uy = (f(x0, y0 + h)[0] - f(x0, y0 - h)[0]) / (2 * h), vx = (f(x0 + h, y0)[1] - f(x0 - h, y0)[1]) / (2 * h), vy = (f(x0, y0 + h)[1] - f(x0, y0 - h)[1]) / (2 * h);
      Q.dot(g, F.x(x0), F.y(y0), "fd", 4);
      read.textContent = `f = ${nm}: 점 1 + 0.5i(빨강)에서 u_x = ${num(ux, 2)}, v_y = ${num(vy, 2)}, u_y = ${num(uy, 2)}, −v_x = ${num(-vx, 2)}. ` + (k == 2 ? "u_x ≠ v_y이므로 코시-리만 방정식이 깨진다." : "코시-리만 방정식이 성립하고, u(파랑)와 v(주황)의 등고선이 직각으로 만난다.");
    });
  });

  // 3.5 e^z: 세로선은 원으로, 가로선은 반직선으로
  Q.def("c9-expmap", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ x, y }) => {
      clear(g);
      const L = Q.frame(-1.5, 1.5, -3.6, 3.6, 30, 200, 15, 245), R = Q.frame(-4.6, 4.6, -4.6, 4.6, 260, 505, 15, 260);
      cplane(g, L, [-1, 1]); cplane(g, R, [-2, 2, 4]);
      [-1, -0.5, 0, 0.5, 1].forEach((c) => { Q.line(g, L.x(c), L.Y0, L.x(c), L.Y1, "gd"); const pts = []; for (let t = 0; t <= 2 * PI + 0.01; t += 0.05) pts.push([Math.exp(c) * Math.cos(t), Math.exp(c) * Math.sin(t)]); line(g, R, pts, "gd"); });
      Q.line(g, L.x(x), L.Y0, L.x(x), L.Y1, "a"); const cp = []; for (let t = 0; t <= 2 * PI + 0.01; t += 0.03) cp.push([Math.exp(x) * Math.cos(t), Math.exp(x) * Math.sin(t)]); line(g, R, cp, "a");
      Q.line(g, L.x(-1.5), L.y(y), L.x(1.5), L.y(y), "c"); Q.line(g, R.x(Math.exp(-1.5) * Math.cos(y)), R.y(Math.exp(-1.5) * Math.sin(y)), R.x(Math.exp(1.5) * Math.cos(y)), R.y(Math.exp(1.5) * Math.sin(y)), "c");
      const w = [Math.exp(x) * Math.cos(y), Math.exp(x) * Math.sin(y)];
      Q.dot(g, L.x(x), L.y(y), "fd", 5); Q.dot(g, R.x(w[0]), R.y(w[1]), "fd", 5);
      txt(g, L.x(0), L.Y1 + 13, "z평면", "s", "middle"); txt(g, (R.X0 + R.X1) / 2, R.Y1 - 2, "w = e^z 평면", "s", "middle");
      read.textContent = `z = ${x} + ${y}i → e^z = e^{${x}}(cos ${y} + i sin ${y}) = ${num(w[0], 3)} + (${num(w[1], 3)})i, |e^z| = ${num(Math.exp(x), 3)}. 세로선(파랑)은 반지름 eˣ인 원으로, 가로선(주황)은 각 y의 반직선으로 간다.`;
    });
  });

  // 3.6 원점을 한 바퀴 돌 때 주값 Arg가 π에서 뛴다
  Q.def("c9-logcut", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ th }) => {
      clear(g);
      const L = Q.frame(-1.5, 1.5, -1.5, 1.5, 30, 230, 20, 230), R = Q.frame(0, 720, -4, 13.5, 280, 505, 20, 230);
      cplane(g, L, [-1, 1]);
      Q.line(g, L.x(-1.5), L.y(0), L.x(0), L.y(0), "d").setAttribute("style", "stroke-width:3"); txt(g, L.x(-0.8), L.y(0) - 6, "자른 선", "td", "middle");
      const pts = []; for (let t = 0; t <= (th * PI) / 180; t += 0.03) pts.push([Math.cos(t), Math.sin(t)]); line(g, L, pts, "a");
      const a = (th * PI) / 180; Q.dot(g, L.x(Math.cos(a)), L.y(Math.sin(a)), "fd", 5);
      Q.line(g, R.x(0), R.y(0), R.x(720), R.y(0), "ax"); Q.line(g, R.x(0), R.y(-4), R.x(0), R.y(13.5), "ax");
      [180, 360, 540, 720].forEach((v) => txt(g, R.x(v), R.y(0) + 13, `${v}°`, "s", "middle")); [[PI, "π"], [-PI, "−π"], [2 * PI, "2π"], [4 * PI, "4π"]].forEach(([v, s]) => txt(g, R.x(0) - 4, R.y(v) + 4, s, "s", "end"));
      Q.plot(g, R, (t) => (t * PI) / 180, "gd dsh", 0, 720, 100);
      const Arg = (t) => { let v = ((t * PI) / 180) % (2 * PI); if (v > PI) v -= 2 * PI; return v; };
      [[0, 180], [180.001, 540], [540.001, 720]].forEach(([s, e]) => Q.plot(g, R, Arg, "c", s, e, 200));
      Q.dot(g, R.x(th), R.y(Arg(th)), "fd", 5);
      read.textContent = `${th}° 돌았을 때: 이어지는 편각 ${num(a, 3)}(회색 점선), 주값 Arg z = ${num(Arg(th), 3)}(주황). 자른 선(음의 실수축)을 지날 때마다 주값이 2π만큼 뛴다. 그래서 Ln z는 그 선에서 연속이 아니다.`;
    });
  });

  // 복소수 산술 (배열 [re, im])
  const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
  const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
  const cexp = (a) => [Math.exp(a[0]) * Math.cos(a[1]), Math.exp(a[0]) * Math.sin(a[1])];
  const ccos = (a) => [Math.cos(a[0]) * Math.cosh(a[1]), -Math.sin(a[0]) * Math.sinh(a[1])];
  // 매개변수 경로 z(t) (0 ≤ t ≤ 2π)를 따라 ∮ f(z) dz를 수치적분
  const cint = (f, zt, n) => { let s = [0, 0]; const N = n || 2000; for (let k = 0; k < N; k++) { const t0 = (2 * PI * k) / N, t1 = (2 * PI * (k + 1)) / N, a = zt(t0), b = zt(t1), m = zt((t0 + t1) / 2), v = f(m); const p = cmul(v, [b[0] - a[0], b[1] - a[1]]); s = [s[0] + p[0], s[1] + p[1]]; } return s; };
  const cfmt = (z, d) => `${num(Math.abs(z[0]) < 1e-9 ? 0 : z[0], d)} ${z[1] < -1e-9 ? "−" : "+"} ${num(Math.abs(z[1]) < 1e-9 ? 0 : Math.abs(z[1]), d)}i`;

  // 4.1 단위원을 따라 쌓이는 ∫ dz / z^m
  Q.def("c9-lint", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ m, th }) => {
      clear(g);
      const L = Q.frame(-1.5, 1.5, -1.5, 1.5, 30, 230, 20, 230), R = Q.frame(-3.5, 3.5, -1, 7, 280, 505, 20, 250);
      cplane(g, L, [-1, 1]); cplane(g, R, [-2, 2]);
      const a = (th * PI) / 180, pts = []; for (let t = 0; t <= a + 1e-9; t += 0.03) pts.push([Math.cos(t), Math.sin(t)]); line(g, L, pts, "a");
      Q.dot(g, L.x(Math.cos(a)), L.y(Math.sin(a)), "fd", 5); Q.dot(g, L.x(0), L.y(0), "fc", 4);
      // 누적값: ∫₀^θ i e^{i(1−m)t} dt
      const acc = (s) => (m === 1 ? [0, s] : (() => { const k = 1 - m; return [(Math.cos(k * s) - 1) / k, Math.sin(k * s) / k]; })());
      const tr = []; for (let s = 0; s <= a + 1e-9; s += 0.02) tr.push(acc(s)); line(g, R, tr, "c");
      const v = acc(a); Q.dot(g, R.x(v[0]), R.y(v[1]), "fd", 5);
      if (m === 1) { Q.dot(g, R.x(0), R.y(2 * PI), "fb", 4); txt(g, R.x(0) + 6, R.y(2 * PI) + 4, "2πi", "tb", "start"); }
      read.textContent = `f = 1/z${m === 1 ? "" : "^" + m}, ${th}°까지 쌓인 적분 = ${cfmt(v, 3)}. ` + (m === 1 ? "한 바퀴를 다 돌면 2πi ≈ 6.283i가 된다." : "한 바퀴를 다 돌면 처음 자리 0으로 돌아온다.");
    });
  });

  // 4.2 경로를 옮기고 비틀어도 특이점을 감은 횟수만 중요하다
  Q.def("c9-deform", (fig, svg) => {
    const F = Q.frame(-3, 3, -2.2, 2.2, 90, 430, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ cx, w }) => {
      clear(g);
      cplane(g, F, [-2, 2]);
      const zt = (t) => { const r = 1 + w * Math.cos(5 * t); return [cx + r * Math.cos(t), r * Math.sin(t)]; };
      const pts = []; for (let t = 0; t <= 2 * PI + 0.01; t += 0.01) pts.push(zt(t)); line(g, F, pts, "a");
      Q.dot(g, F.x(0), F.y(0), "fd", 5); txt(g, F.x(0) + 6, F.y(0) - 6, "z = 0", "td", "start");
      const I = cint((z) => cdiv([1, 0], z), zt, 4000);
      read.textContent = `∮ dz/z = ${cfmt(I, 3)}. ` + (Math.abs(I[1]) > 1 ? "경로가 z = 0을 감고 있으므로 모양에 상관없이 2πi이다." : "경로가 z = 0을 감지 않으므로 코시 정리에 따라 0이다.");
    });
  });

  // 4.3 코시 적분 공식: 원 |z − i| = r 안의 특이점
  Q.def("c9-cform", (fig, svg) => {
    const F = Q.frame(-3.5, 3.5, -3.2, 4.5, 110, 410, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ r }) => {
      clear(g);
      cplane(g, F, [-2, 2]);
      const zt = (t) => [r * Math.cos(t), 1 + r * Math.sin(t)];
      const pts = []; for (let t = 0; t <= 2 * PI + 0.01; t += 0.02) pts.push(zt(t)); line(g, F, pts, "a");
      [[0, 1, "i"], [0, -1, "−i"]].forEach(([x, y, s]) => { const inside = Math.hypot(x, y - 1) < r; Q.dot(g, F.x(x), F.y(y), inside ? "fd" : "fc", 5); txt(g, F.x(x) + 7, F.y(y) + 4, s, inside ? "td" : "tc", "start"); });
      const I = cint((z) => cdiv([1, 0], [z[0] * z[0] - z[1] * z[1] + 1, 2 * z[0] * z[1]]), zt, 4000);
      read.textContent = `원 |z − i| = ${r}: ∮ dz/(z² + 1) = ${cfmt(I, 4)}. ` + (r < 2 ? "안에 있는 특이점은 i뿐이라 2πi·1/(2i) = π이다." : "i와 −i가 모두 안에 있어 두 기여 π와 −π가 상쇄된다.");
    });
  });

  // 4.4 ∮ cos z / z^{n+1} dz = 2πi f^{(n)}(0)/n!
  Q.def("c9-cderiv", (fig, svg) => {
    const F = Q.frame(-0.6, 4.6, -4, 7, 60, 480, 15, 235), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const fac = [1, 1, 2, 6, 24], d = [1, 0, -1, 0, 1];
    Q.bind(fig, ({ r }) => {
      clear(g);
      Q.line(g, F.x(-0.6), F.y(0), F.x(4.6), F.y(0), "ax"); Q.line(g, F.x(-0.6), F.y(-4), F.x(-0.6), F.y(7), "ax");
      [-3, 3, 6].forEach((v) => txt(g, F.x(-0.6) - 4, F.y(v) + 4, v, "s", "end"));
      txt(g, F.x(-0.6) + 6, F.y(7) + 12, "Im ∮", "i", "start");
      const vals = [];
      for (let n = 0; n <= 4; n++) {
        const I = cint((z) => { let p = [1, 0]; for (let k = 0; k <= n; k++) p = cmul(p, z); return cdiv(ccos(z), p); }, (t) => [r * Math.cos(t), r * Math.sin(t)], 3000);
        const ex = (2 * PI * d[n]) / fac[n]; vals.push([I, ex]);
        rect(g, F, n - 0.3, 0, n + 0.3, I[1], "la"); Q.dot(g, F.x(n), F.y(ex), "fd", 5);
        txt(g, F.x(n), F.y(-4) + 2, `n = ${n}`, "s", "middle");
      }
      read.textContent = `반지름 ${r}인 원: 막대(수치 적분의 허수부) ${vals.map((v) => num(v[0][1], 3)).join(", ")}, 빨간 점 2π·f⁽ⁿ⁾(0)/n! ${vals.map((v) => num(v[1], 3)).join(", ")}. 반지름을 바꿔도 값은 그대로이다.`;
    });
  });

  // 5.1 1/(1 + x²)의 테일러 부분합은 |x| < 1에서만 맞는다
  Q.def("c9-taylor", (fig, svg) => {
    const F = Q.frame(-2, 2, -1, 2, 30, 330, 15, 245), C = Q.frame(-1.6, 1.6, -1.6, 1.6, 360, 505, 60, 205);
    const g = el("g", {}, svg), g2 = el("g", {}, svg), read = fig.querySelector(".q-read");
    clip(g, svg, F);
    Q.bind(fig, ({ N }) => {
      clear(g); clear(g2);
      axl(g2, F, [-1, 1], [1], "x", "");
      Q.line(g2, F.x(-1), F.Y0, F.x(-1), F.Y1, "gd dsh"); Q.line(g2, F.x(1), F.Y0, F.x(1), F.Y1, "gd dsh");
      Q.plot(g, F, (x) => 1 / (1 + x * x), "c", -2, 2, 300);
      Q.plot(g, F, (x) => { let s = 0; for (let k = 0; k <= N; k++) s += (k % 2 ? -1 : 1) * x ** (2 * k); return s; }, "a", -2, 2, 400);
      cplane(g2, C, []);
      el("circle", { cx: C.x(0), cy: C.y(0), r: C.x(1) - C.x(0), class: "lb" }, g2);
      Q.line(g2, C.x(-1.6), C.y(0), C.x(1.6), C.y(0), "ax");
      [[0, 1], [0, -1]].forEach(([x, y]) => Q.dot(g2, C.x(x), C.y(y), "fd", 5)); txt(g2, C.x(0) + 7, C.y(1) - 4, "i", "td", "start"); txt(g2, C.x(0) + 7, C.y(-1) + 12, "−i", "td", "start");
      txt(g2, (C.X0 + C.X1) / 2, C.Y1 + 16, "수렴 원판", "s", "middle");
      read.textContent = `1 − x² + x⁴ − ⋯를 x^${2 * N}까지 더한 부분합(파랑)과 1/(1 + x²)(주황). 항을 늘려도 |x| > 1에서는 크게 벗어난다. 복소평면의 특이점 ±i(빨강)까지의 거리 1이 수렴 반지름이다.`;
    });
  });

  // 5.2 1/(1 − z)의 두 전개: 안쪽 원판과 바깥 고리
  Q.def("c9-laurent", (fig, svg) => {
    const F = Q.frame(0, 3, -0.5, 4.5, 60, 300, 15, 235), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ r, N }) => {
      clear(g);
      const z = [r * Math.cos(2), r * Math.sin(2)], ex = cdiv([1, 0], [1 - z[0], -z[1]]);
      let a = [0, 0], p = [1, 0]; for (let k = 0; k <= N; k++) { a = [a[0] + p[0], a[1] + p[1]]; p = cmul(p, z); }
      let b = [0, 0], q = cdiv([1, 0], z); for (let k = 1; k <= N + 1; k++) { b = [b[0] - q[0], b[1] - q[1]]; q = cdiv(q, z); }
      const ea = Math.hypot(a[0] - ex[0], a[1] - ex[1]), eb = Math.hypot(b[0] - ex[0], b[1] - ex[1]);
      axl(g, F, [1, 2, 3], [1, 2, 3, 4], "|z|", "오차");
      Q.line(g, F.x(1), F.Y0, F.x(1), F.Y1, "gd dsh");
      const err = (rr, which) => { const zz = [rr * Math.cos(2), rr * Math.sin(2)], e2 = cdiv([1, 0], [1 - zz[0], -zz[1]]); let s = [0, 0], t = which ? cdiv([1, 0], zz) : [1, 0]; for (let k = 0; k <= N; k++) { s = which ? [s[0] - t[0], s[1] - t[1]] : [s[0] + t[0], s[1] + t[1]]; t = which ? cdiv(t, zz) : cmul(t, zz); } return Math.min(4.6, Math.hypot(s[0] - e2[0], s[1] - e2[1])); };
      Q.plot(g, F, (rr) => err(rr, 0), "a", 0.05, 3, 300); Q.plot(g, F, (rr) => err(rr, 1), "c", 0.05, 3, 300);
      Q.line(g, F.x(r), F.Y0, F.x(r), F.Y1, "d dsh");
      txt(g, 330, 70, "파랑: Σ zⁿ (|z| < 1)", "ta", "start"); txt(g, 330, 95, "주황: −Σ 1/zⁿ (|z| > 1)", "tc", "start");
      txt(g, 330, 135, `|z| = ${r}에서 오차`, "s", "start"); txt(g, 330, 160, `파랑 ${num(ea, 4)}`, "ta", "start"); txt(g, 330, 182, `주황 ${num(eb, 4)}`, "tc", "start");
      read.textContent = `|z| = ${r}, 항 ${N + 1}개: ` + (r < 1 ? "안쪽 원판이라 파랑 급수가 맞고 주황 급수는 발산한다." : r > 1 ? "바깥 고리라 주황 급수가 맞고 파랑 급수는 발산한다." : "경계 |z| = 1에서는 둘 다 수렴하지 않는다.");
    });
  });

  // 5.3 특이점으로 다가갈 때 |f|의 크기 (로그 눈금)
  Q.def("c9-sing", (fig, svg) => {
    const F = Q.frame(-1.3, 0, -4, 8, 70, 480, 15, 235), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const fs = [["sin z / z", (z) => cdiv([Math.sin(z[0]) * Math.cosh(z[1]), Math.cos(z[0]) * Math.sinh(z[1])], z)], ["eᶻ / z²", (z) => cdiv(cexp(z), cmul(z, z))], ["e^{1/z}", (z) => cexp(cdiv([1, 0], z))]];
    Q.bind(fig, ({ k, ph }) => {
      clear(g);
      const [nm, f] = fs[k], a = (ph * PI) / 180;
      Q.line(g, F.X0, F.y(0), F.X1, F.y(0), "ax"); Q.line(g, F.X0, F.Y0, F.X0, F.Y1, "ax");
      [-1, -0.5].forEach((v) => txt(g, F.x(v), F.y(-4) + 14, `${num(10 ** v, 2)}`, "s", "middle")); txt(g, F.x(0), F.y(-4) + 14, "1", "s", "middle");
      [-4, 0, 4, 8].forEach((v) => txt(g, F.X0 - 4, F.y(v) + 4, `10^${v}`, "s", "end"));
      txt(g, F.X1 - 4, F.y(-4) - 4, "|z| (로그 눈금)", "i", "end"); txt(g, F.X0 + 6, F.Y0 + 12, "|f(z)|", "i", "start");
      [0, 90, 180].forEach((pp) => { if (pp === ph) return; const b = (pp * PI) / 180; Q.plot(g, F, (lr) => { const r = 10 ** lr, v = f([r * Math.cos(b), r * Math.sin(b)]); return Math.max(-4.2, Math.min(8.2, Math.log10(Math.hypot(...v) + 1e-300))); }, "gd", -1.3, 0, 200); });
      Q.plot(g, F, (lr) => { const r = 10 ** lr, v = f([r * Math.cos(a), r * Math.sin(a)]); return Math.max(-4.2, Math.min(8.2, Math.log10(Math.hypot(...v) + 1e-300))); }, "a", -1.3, 0, 300);
      const v = f([0.05 * Math.cos(a), 0.05 * Math.sin(a)]);
      read.textContent = `${nm}, 각 ${ph}° 방향으로 다가갈 때 |z| = 0.05에서 |f| = ${Math.hypot(...v).toExponential(2)}. ` + (k == 0 ? "어느 방향이든 1에 다가간다(제거 가능)." : k == 1 ? "어느 방향이든 1/|z|²처럼 커진다(2위 극)." : "방향에 따라 무한대로도, 0으로도, 크기 1로도 간다(본질적 특이점).");
    });
  });

  // 5.4 유수 정리: |z| = ρ 안에 든 극만 기여
  Q.def("c9-resid", (fig, svg) => {
    const F = Q.frame(-2.6, 2.6, -2.2, 2.2, 110, 410, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ rho }) => {
      clear(g);
      cplane(g, F, [-2, -1, 1, 2]);
      const pts = []; for (let t = 0; t <= 2 * PI + 0.01; t += 0.02) pts.push([rho * Math.cos(t), rho * Math.sin(t)]); line(g, F, pts, "a");
      [[0, -4], [1, 1]].forEach(([x, res]) => { const ins = Math.abs(x) < rho; Q.dot(g, F.x(x), F.y(0), ins ? "fd" : "fc", 5); txt(g, F.x(x) + 4, F.y(0) - 8, `Res ${res}`, ins ? "td" : "tc", "start"); });
      const I = cint((z) => cdiv([4 - 3 * z[0], -3 * z[1]], [z[0] * z[0] - z[1] * z[1] - z[0], 2 * z[0] * z[1] - z[1]]), (t) => [rho * Math.cos(t), rho * Math.sin(t)], 4000);
      const s = (rho > 0 ? -4 : 0) + (rho > 1 ? 1 : 0);
      read.textContent = `|z| = ${rho}: 수치 적분 ${cfmt(I, 3)}, 2πi × (안쪽 유수의 합 ${s}) = ${num(2 * PI * s, 3)}i. 경로 안에 든 극(빨강)만 기여한다.`;
    });
  });

  // 5.5 반원 경로: 실수축 부분과 반원 부분
  Q.def("c9-semi", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ R }) => {
      clear(g);
      const F = Q.frame(-6.5, 6.5, -1, 6.5, 30, 300, 20, 240);
      cplane(g, F, [-4, 4]);
      const pts = [[-R, 0], [R, 0]]; for (let t = 0; t <= PI + 1e-9; t += 0.02) pts.push([R * Math.cos(t), R * Math.sin(t)]); line(g, F, pts, "a");
      [[0, 1, "i"], [0, -1, "−i"]].forEach(([x, y, s]) => { const ins = y > 0 && R > 1; Q.dot(g, F.x(x), F.y(y), ins ? "fd" : "fc", 4); txt(g, F.x(x) + 6, F.y(y) + 4, s, ins ? "td" : "tc", "start"); });
      const line1 = 2 * Math.atan(R);
      const arc = cint((z) => cdiv([1, 0], [1 + z[0] * z[0] - z[1] * z[1], 2 * z[0] * z[1]]), (t) => [R * Math.cos(t / 2), R * Math.sin(t / 2)], 3000);
      txt(g, 330, 60, `실수축 [−R, R]: ${num(line1, 4)}`, "s", "start"); txt(g, 330, 85, `반원 부분: ${cfmt(arc, 4)}`, "s", "start");
      txt(g, 330, 115, `합: ${num(line1 + arc[0], 4)}`, "s", "start").setAttribute("style", "font-size:15px"); txt(g, 330, 140, `π = ${num(PI, 4)}`, "td", "start");
      read.textContent = `R = ${R}: 반원 위 적분의 크기는 πR/(R² − 1) 이하로 줄고, R → ∞이면 실수축 부분이 ∫ dx/(1 + x²) = π에 다가간다. 닫힌 경로 전체의 값은 R > 1이면 늘 2πi·Res_i = π이다.`;
    });
  });

  // 곡선을 사상 f로 옮겨 그린다 (pts는 z평면 점들)
  const mapLine = (g, F, f, pts, cls) => { let seg = []; pts.forEach((p) => { const w = f(p); if (isFinite(w[0]) && isFinite(w[1]) && Math.abs(w[0]) < 1e3 && Math.abs(w[1]) < 1e3) seg.push(w); else { line(g, F, seg, cls); seg = []; } }); line(g, F, seg, cls); };
  const sq = (z) => [z[0] * z[0] - z[1] * z[1], 2 * z[0] * z[1]];

  // 6.1 w = z²: 직선 x = a, y = b의 상과 교점의 각
  Q.def("c9-conf", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ a, b }) => {
      clear(g);
      const L = Q.frame(-0.5, 2.5, -0.5, 2.5, 20, 220, 20, 220), R = Q.frame(-5, 5, -1, 7, 255, 505, 15, 245);
      const gl = el("g", {}, g), gr = el("g", {}, g); clip(gl, svg, L); clip(gr, svg, R);
      cplane(g, L, [1, 2]); cplane(g, R, [-4, 4]);
      const vx = [], hy = []; for (let t = -0.5; t <= 2.5; t += 0.02) { vx.push([a, t]); hy.push([t, b]); }
      line(gl, L, vx, "a"); line(gl, L, hy, "c");
      mapLine(gr, R, sq, vx, "a"); mapLine(gr, R, sq, hy, "c");
      const w = sq([a, b]); Q.dot(g, L.x(a), L.y(b), "fd", 4); Q.dot(g, R.x(w[0]), R.y(w[1]), "fd", 4);
      // 교점에서의 접선: x = a 위 (−2b, 2a)·…, y = b 위 (2a, 2b)
      const t1 = [-2 * b, 2 * a], t2 = [2 * a, 2 * b], ang = (Math.acos((t1[0] * t2[0] + t1[1] * t2[1]) / (Math.hypot(...t1) * Math.hypot(...t2))) * 180) / PI;
      txt(g, L.x(1.25), L.Y1 + 14, "z평면", "s", "middle"); txt(g, (R.X0 + R.X1) / 2, R.Y1 + 13, "w = z²", "s", "middle");
      read.textContent = `x = ${a}(파랑)과 y = ${b}(주황)의 상은 두 포물선이고, 교점 w = ${cfmt(w, 2)}에서 이루는 각은 ${num(ang, 1)}°이다. f′(z₀) = 2z₀ ≠ 0이면 원래의 직각이 그대로 남는다.`;
    });
  });

  // 6.2 w = (z − i)/(z + i): 위쪽 반평면 → 단위원판
  Q.def("c9-mob", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const f = (z) => cdiv([z[0], z[1] - 1], [z[0], z[1] + 1]);
    Q.bind(fig, ({ x, y }) => {
      clear(g);
      const L = Q.frame(-3, 3, -0.6, 4, 20, 240, 20, 230), R = Q.frame(-1.3, 1.3, -1.3, 1.3, 290, 500, 20, 230);
      const gl = el("g", {}, g); clip(gl, svg, L);
      cplane(g, L, [-2, 2]); cplane(g, R, [-1, 1]);
      el("circle", { cx: R.x(0), cy: R.y(0), r: R.x(1) - R.x(0), class: "lb" }, g);
      [0.5, 1, 2, 3].forEach((c) => { const pts = []; for (let t = -40; t <= 40; t += 0.05) pts.push([t, c]); line(gl, L, pts.filter((p) => Math.abs(p[0]) < 3.2), "c"); mapLine(g, R, f, pts, "c"); });
      [-2, -1, 0, 1, 2].forEach((c) => { const pts = []; for (let t = 0.001; t <= 60; t *= 1.05) pts.push([c, t]); line(gl, L, pts.filter((p) => p[1] < 4.2), "a"); mapLine(g, R, f, pts, "a"); });
      const w = f([x, y]); Q.dot(g, L.x(x), L.y(y), "fd", 5); Q.dot(g, R.x(w[0]), R.y(w[1]), "fd", 5);
      txt(g, L.x(0), L.Y1 + 14, "위쪽 반평면", "s", "middle"); txt(g, R.x(0), R.Y1 + 14, "단위원판", "s", "middle");
      read.textContent = `z = ${x} + ${y}i → w = ${cfmt(w, 3)}, |w| = ${num(Math.hypot(...w), 3)} < 1. 가로선(주황)과 세로선(파랑)이 원판 안의 원호로 옮겨지고, z = i는 중심 0으로 간다.`;
    });
  });

  // 6.3 e^z와 sin z의 사상
  Q.def("c9-maps", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const csin = (z) => [Math.sin(z[0]) * Math.cosh(z[1]), Math.cos(z[0]) * Math.sinh(z[1])];
    Q.bind(fig, ({ k, c }) => {
      clear(g);
      const L = Q.frame(-2, 2, -0.4, 3.6, 20, 230, 20, 230), R = Q.frame(-4, 4, -0.8, 5, 270, 505, 15, 245);
      const gl = el("g", {}, g), gr = el("g", {}, g); clip(gl, svg, L); clip(gr, svg, R);
      cplane(g, L, [-1, 1]); cplane(g, R, [-2, 2]);
      if (k == 0) {
        rect(gl, L, -2, 0, 2, PI, "lb");
        [-1.5, -1, -0.5, 0, 0.5, 1].forEach((x0) => { const p = []; for (let t = 0; t <= PI; t += 0.02) p.push([x0, t]); line(gl, L, p, x0 === c ? "a" : "gd"); mapLine(gr, R, cexp, p, x0 === c ? "a" : "gd"); });
        [0.5, 1, 1.5, 2, 2.5].forEach((y0) => { const p = []; for (let t = -2; t <= 1.6; t += 0.02) p.push([t, y0]); line(gl, L, p, "c"); mapLine(gr, R, cexp, p, "c"); });
        read.textContent = `w = e^z: 띠 0 < y < π(청록)가 위쪽 반평면으로 간다. 세로선 x = ${c}(파랑)는 반지름 e^${c} = ${num(Math.exp(c), 3)}인 반원으로, 가로선(주황)은 원점에서 나가는 반직선으로 간다.`;
      } else {
        rect(gl, L, -PI / 2, 0, PI / 2, 3.6, "lb");
        [-1.2, -0.6, 0, 0.6, 1.2].forEach((x0) => { const p = []; for (let t = 0; t <= 3.6; t += 0.02) p.push([x0, t]); line(gl, L, p, "gd"); mapLine(gr, R, csin, p, "gd"); });
        const ys = [0.3, 0.8, 1.3, 1.8]; ys.forEach((y0) => { const p = []; for (let t = -PI / 2; t <= PI / 2; t += 0.02) p.push([t, y0]); const cl = y0 === 0.8 ? "a" : "c"; line(gl, L, p, cl); mapLine(gr, R, csin, p, cl); });
        Q.dot(g, L.x(-PI / 2), L.y(0), "fd", 4); Q.dot(g, L.x(PI / 2), L.y(0), "fd", 4); Q.dot(g, R.x(-1), R.y(0), "fd", 4); Q.dot(g, R.x(1), R.y(0), "fd", 4);
        read.textContent = "w = sin z: 반무한 띠 −π/2 < x < π/2, y > 0(청록)이 위쪽 반평면으로 간다. 가로선(주황, y = 0.8은 파랑)은 타원 반쪽으로, 세로선(회색)은 쌍곡선 가지로 가며, 모서리 ±π/2(빨강)에서는 cos z = 0이라 직각이 평각으로 펴진다.";
      }
    });
  });

  // 6.4 1사분면의 정상 상태 온도 T = (200/π) Arg z
  Q.def("c9-pot", (fig, svg) => {
    const F = Q.frame(-0.1, 3, -0.1, 3, 120, 380, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const gt = el("g", {}, svg);
    clip(g, svg, F);
    Q.bind(fig, ({ th, r }) => {
      clear(g); clear(gt);
      const N = 30;
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const x = ((i + 0.5) * 3) / N, y = ((j + 0.5) * 3) / N, T = (200 / PI) * Math.atan2(y, x);
        el("rect", { x: F.x((i * 3) / N), y: F.y(((j + 1) * 3) / N), width: (F.x(3) - F.x(0)) / N + 0.5, height: (F.y(0) - F.y(3)) / N + 0.5, class: T > 50 ? "fd" : "fa", style: `opacity:${(0.08 + (Math.abs(T - 50) / 50) * 0.5).toFixed(2)}` }, g);
      }
      [10, 20, 30, 40, 50, 60, 70, 80, 90].forEach((T) => { const a = (T * PI) / 200; Q.line(g, F.x(0), F.y(0), F.x(3 * Math.cos(a) * 1.4), F.y(3 * Math.sin(a) * 1.4), "k dsh"); });
      [0.8, 1.6, 2.4].forEach((rr) => { const p = []; for (let t = 0; t <= PI / 2 + 1e-9; t += 0.02) p.push([rr * Math.cos(t), rr * Math.sin(t)]); line(g, F, p, "b"); });
      Q.line(g, F.x(0), F.y(0), F.x(3), F.y(0), "a").setAttribute("style", "stroke-width:4"); Q.line(g, F.x(0), F.y(0), F.x(0), F.y(3), "d").setAttribute("style", "stroke-width:4");
      txt(gt, F.x(2.6), F.y(0) + 16, "T = 0", "ta", "middle"); txt(gt, F.x(0) - 6, F.y(2.7), "T = 100", "td", "end");
      const a = (th * PI) / 180, P = [r * Math.cos(a), r * Math.sin(a)], T = (200 / PI) * a;
      Q.dot(g, F.x(P[0]), F.y(P[1]), "fk", 5);
      read.textContent = `z = ${num(r, 1)}e^{i${th}°}: T = (200/π)·Arg z = ${num(T, 1)}. 거리 r을 바꿔도 온도는 그대로이다. 점선(등온선)은 원점에서 나가는 반직선이고, 청록 원호(열의 흐름선)는 등온선과 직각으로 만난다.`;
    });
  });

  // 6.5 원판의 디리클레 문제: 경계값 cos²θ
  Q.def("c9-pois", (fig, svg) => {
    const F = Q.frame(-1.15, 1.15, -1.15, 1.15, 130, 390, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const u = (r, t) => 0.5 + 0.5 * r * r * Math.cos(2 * t);
    Q.bind(fig, ({ r, th }) => {
      clear(g);
      const N = 36;
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const x = -1 + ((i + 0.5) * 2) / N, y = -1 + ((j + 0.5) * 2) / N, rr = Math.hypot(x, y); if (rr > 1) continue;
        const v = u(rr, Math.atan2(y, x));
        el("rect", { x: F.x(-1 + (i * 2) / N), y: F.y(-1 + ((j + 1) * 2) / N), width: (F.x(1) - F.x(-1)) / N + 0.5, height: (F.y(-1) - F.y(1)) / N + 0.5, class: v > 0.5 ? "fd" : "fa", style: `opacity:${(0.06 + Math.abs(v - 0.5) * 1.1).toFixed(2)}` }, g);
      }
      const c = []; for (let t = 0; t <= 2 * PI + 0.01; t += 0.03) c.push([Math.cos(t), Math.sin(t)]); line(g, F, c, "k");
      const cr = []; for (let t = 0; t <= 2 * PI + 0.01; t += 0.03) cr.push([r * Math.cos(t), r * Math.sin(t)]); line(g, F, cr, "c dsh");
      const a = (th * PI) / 180; Q.dot(g, F.x(r * Math.cos(a)), F.y(r * Math.sin(a)), "fk", 5); Q.dot(g, F.x(0), F.y(0), "fb", 4);
      let avg = 0; for (let k = 0; k < 360; k++) avg += u(r, (k * PI) / 180) / 360;
      read.textContent = `u(${r}, ${th}°) = ½ + ½·${r}²·cos ${2 * th}° = ${num(u(r, a), 3)}. 반지름 ${r}인 원(주황 점선) 위의 평균은 ${num(avg, 3)}로 중심값 ½(청록 점)과 같다. 가장 높고 낮은 값은 테두리에 있다.`;
    });
  });

  // 유효숫자 d자리로 반올림
  const rnd = (v, d) => (v === 0 ? 0 : Number(v.toPrecision(d)));
  // 평면의 직선 ax + by = c를 틀 안에 그린다
  const lineEq = (g, F, a, b, c, cls) => { const p = []; if (Math.abs(b) > 1e-12) { for (let x = F.x0; x <= F.x1; x += (F.x1 - F.x0) / 200) p.push([x, (c - a * x) / b]); } else { p.push([c / a, F.y0], [c / a, F.y1]); } let seg = []; p.forEach((q) => { if (q[1] >= F.y0 - 1 && q[1] <= F.y1 + 1) seg.push(q); }); line(g, F, seg, cls); };

  // 7.1 작은 피벗과 부분 피벗팅 (유효숫자 3자리)
  Q.def("c9-pivot", (fig, svg) => {
    const F = Q.frame(-0.5, 2.5, -0.5, 2, 60, 300, 15, 245), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const gc = el("g", {}, svg); clip(gc, svg, F);
    Q.bind(fig, ({ e, d }) => {
      clear(g); clear(gc);
      const eps = 10 ** -e;
      cplane(g, F, []); [1, 2].forEach((v) => { txt(g, F.x(v), F.y(0) + 13, v, "s", "middle"); txt(g, F.x(0) - 4, F.y(v) + 4, v, "s", "end"); });
      lineEq(gc, F, eps, 1, 1, "b"); lineEq(gc, F, 1, 1, 2, "c");
      // 정확한 해
      const x2 = (2 - 1 / eps) / (1 - 1 / eps), x1 = (1 - x2) / eps;
      // 피벗팅 없이
      const m = rnd(1 / eps, d), a22 = rnd(1 - m, d), b2 = rnd(2 - m, d), y = rnd(b2 / a22, d), xn = rnd(rnd(1 - y, d) / eps, d);
      // 부분 피벗팅
      const m2 = rnd(eps, d), c22 = rnd(1 - m2, d), c2 = rnd(1 - rnd(2 * m2, d), d), yp = rnd(c2 / c22, d), xp = rnd(2 - yp, d);
      Q.dot(gc, F.x(x1), F.y(x2), "fk", 5); Q.dot(gc, F.x(xn), F.y(y), "fd", 5); Q.dot(gc, F.x(xp), F.y(yp), "fa", 4);
      txt(g, 320, 40, "정확한 해", "s", "start"); txt(g, 320, 58, `(${num(x1, 5)}, ${num(x2, 5)})`, "s", "start");
      txt(g, 320, 92, "피벗팅 없이", "td", "start"); txt(g, 320, 110, `(${num(xn, 4)}, ${num(y, 4)}), 배수 ${m.toExponential(1)}`, "td", "start");
      txt(g, 320, 144, "부분 피벗팅", "ta", "start"); txt(g, 320, 162, `(${num(xp, 4)}, ${num(yp, 4)}), 배수 ${m2.toExponential(1)}`, "ta", "start");
      read.textContent = `ε = 10^−${e}, 유효숫자 ${d}자리: 작은 피벗 ε로 소거하면 배수가 ${m.toExponential(1)}로 커져 x₁이 ${num(xn, 4)}로 틀어진다(빨강). 행을 바꿔 1을 피벗으로 쓰면 정확한 해(검정)에 붙는다(파랑).`;
    });
  });

  // 7.2 가우스-자이델의 지그재그
  Q.def("c9-gs", (fig, svg) => {
    const F = Q.frame(-0.5, 2.5, -0.5, 2.5, 120, 380, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const gc = el("g", {}, svg); clip(gc, svg, F);
    Q.bind(fig, ({ o, n }) => {
      clear(g); clear(gc);
      cplane(g, F, []); [1, 2].forEach((v) => { txt(g, F.x(v), F.y(0) + 13, v, "s", "middle"); txt(g, F.x(0) - 4, F.y(v) + 4, v, "s", "end"); });
      lineEq(gc, F, 10, 1, 12, "b"); lineEq(gc, F, 1, 10, 21, "c");
      let x = 0, y = 0; const pts = [[0, 0]]; let blow = false;
      for (let k = 0; k < n; k++) {
        if (o == 0) { x = (12 - y) / 10; pts.push([x, y]); y = (21 - x) / 10; pts.push([x, y]); }
        else { x = 21 - 10 * y; pts.push([x, y]); y = 12 - 10 * x; pts.push([x, y]); }
        if (Math.abs(x) > 1e6) { blow = true; break; }
      }
      line(gc, F, pts, "a"); pts.forEach((p) => Q.dot(gc, F.x(p[0]), F.y(p[1]), "fa", 3));
      Q.dot(gc, F.x(1), F.y(2), "fd", 5);
      read.textContent = (o == 0 ? `x = (12 − y)/10, y = (21 − x)/10로 ${n}번: (${num(x, 6)}, ${num(y, 6)}). 대각 우세라 해 (1, 2)(빨강)로 빠르게 모인다.` : `순서를 바꿔 x = 21 − 10y, y = 12 − 10x로 ${n}번: (${num(x, 1)}, ${num(y, 1)}). 대각 우세가 아니라 발산한다${blow ? "(값이 폭발)" : ""}.`);
    });
  });

  // 7.3 거의 평행한 두 직선과 조건수
  Q.def("c9-cond", (fig, svg) => {
    const F = Q.frame(-1.5, 3.5, -0.5, 3.5, 60, 320, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const gc = el("g", {}, svg); clip(gc, svg, F);
    Q.bind(fig, ({ p, e }) => {
      clear(g); clear(gc);
      const dl = 10 ** -p, pert = e * dl;
      cplane(g, F, []); [1, 2, 3].forEach((v) => { txt(g, F.x(v), F.y(0) + 13, v, "s", "middle"); txt(g, F.x(0) - 4, F.y(v) + 4, v, "s", "end"); });
      lineEq(gc, F, 1, 1, 2, "b"); lineEq(gc, F, 1, 1 + dl, 2 + dl + pert, "c");
      const y = (dl + pert) / dl, x = 2 - y;
      Q.dot(gc, F.x(1), F.y(1), "fk", 4); Q.dot(gc, F.x(x), F.y(y), "fd", 5);
      const nA = 2 + dl, nAi = (2 * (1 + dl) + 0) / dl, kap = nA * (Math.max(2 + dl, 2) / dl);
      txt(g, 350, 60, `δ = 10^−${p}`, "s", "start"); txt(g, 350, 85, `우변 변화 ${e}δ`, "s", "start");
      txt(g, 350, 115, `해 (${num(x, 3)}, ${num(y, 3)})`, "td", "start"); txt(g, 350, 145, `조건수 κ ≈ ${kap.toExponential(2)}`, "s", "start");
      void nAi;
      read.textContent = `x + y = 2(청록)와 x + (1 + δ)y = 2 + δ + ${e}δ(주황): 우변이 ${e}δ = ${(e * dl).toExponential(1)}만 바뀌어도 교점이 (1, 1)에서 (${num(x, 3)}, ${num(y, 3)})로 미끄러진다. δ가 작을수록 두 직선이 평행에 가깝고 κ가 커진다.`;
    });
  });

  // 그래프 그리기: V = {이름: [x, y]}, E = [[u, v, w]], 강조 함수
  const drawGraph = (g, V, E, eCls, vCls, lab) => {
    E.forEach(([u, v, w], i) => {
      const [x1, y1] = V[u], [x2, y2] = V[v], cl = eCls ? eCls(i, u, v) : "gd";
      Q.line(g, x1, y1, x2, y2, cl).setAttribute("style", cl === "gd" ? "stroke-width:2" : "stroke-width:4");
      if (w != null) { const mx = (x1 + x2) / 2, my = (y1 + y2) / 2; el("rect", { x: mx - 12, y: my - 10, width: 24, height: 18, class: "lk" }, g); txt(g, mx, my + 4, w, "s", "middle"); }
    });
    Object.entries(V).forEach(([n, [x, y]]) => { el("circle", { cx: x, cy: y, r: 15, class: vCls ? vCls(n) : "la" }, g); txt(g, x, y + 5, n, "s", "middle"); if (lab) { const s = lab(n); if (s !== "") txt(g, x, y - 21, s, "td", "middle"); } });
  };

  // 8.1 가중 그래프와 인접 행렬
  Q.def("c9-graph", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const V = { A: [60, 60], B: [200, 50], C: [150, 170], D: [270, 200] }, E = [["A", "B", 3], ["A", "C", 5], ["B", "C", 1], ["C", "D", 4]], names = ["A", "B", "C", "D"];
    Q.bind(fig, ({ k }) => {
      clear(g);
      const s = names[k];
      drawGraph(g, V, E, (i, u, v) => (u === s || v === s ? "c" : "gd"), (n) => (n === s ? "lc" : "la"));
      const M = names.map((r) => names.map((c) => { const e = E.find(([u, v]) => (u === r && v === c) || (u === c && v === r)); return e ? e[2] : 0; }));
      const X0 = 340, Y0 = 60, h = 30;
      names.forEach((n, i) => { txt(g, X0 + 30 + i * h, Y0 - 8, n, "s", "middle"); txt(g, X0, Y0 + 20 + i * h, n, "s", "middle"); });
      M.forEach((row, i) => row.forEach((v, j) => { el("rect", { x: X0 + 15 + j * h, y: Y0 + i * h, width: h, height: h, class: names[i] === s ? "lc" : "lk" }, g); txt(g, X0 + 30 + j * h, Y0 + 20 + i * h, v, "s", "middle"); }));
      const deg = M[k].filter((v) => v > 0).length;
      read.textContent = `${s}의 행: ${M[k].join(", ")}. ${s}에 붙은 변(주황)이 ${deg}개이므로 차수는 ${deg}이다. 방향이 없으므로 행렬은 대각선에 대해 대칭이다.`;
    });
  });

  // 8.2 다익스트라와 크러스컬을 단계별로
  Q.def("c9-dijk", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const V = { A: [50, 130], B: [170, 50], C: [170, 210], D: [320, 60], E: [430, 170] };
    const E = [["A", "B", 4], ["A", "C", 2], ["B", "C", 1], ["B", "D", 5], ["C", "D", 8], ["C", "E", 10], ["D", "E", 2]];
    // 다익스트라 단계 기록
    const dsteps = (() => { const d = { A: 0, B: Infinity, C: Infinity, D: Infinity, E: Infinity }, pr = {}, done = [], out = [{ d: { ...d }, done: [], pr: {} }]; while (done.length < 5) { const u = Object.keys(d).filter((n) => !done.includes(n)).sort((a, b) => d[a] - d[b])[0]; done.push(u); E.forEach(([a, b, w]) => { const v = a === u ? b : b === u ? a : null; if (v && !done.includes(v) && d[u] + w < d[v]) { d[v] = d[u] + w; pr[v] = u; } }); out.push({ d: { ...d }, done: [...done], pr: { ...pr } }); } return out; })();
    const ksteps = (() => { const order = [...E].map((e, i) => [e, i]).sort((a, b) => a[0][2] - b[0][2]), par = {}, f = (x) => (par[x] === undefined || par[x] === x ? x : f(par[x])), chosen = [], out = [{ chosen: [], seen: -1, rej: [] }], rej = []; order.forEach(([[u, v], i], j) => { if (chosen.length >= 4) return; const a = f(u), b = f(v); if (a !== b) { par[a] = b; chosen.push(i); } else rej.push(i); out.push({ chosen: [...chosen], seen: i, rej: [...rej] }); }); return out; })();
    Q.bind(fig, ({ m, s }) => {
      clear(g);
      if (m == 0) {
        const st = dsteps[Math.min(s, dsteps.length - 1)];
        const tree = (i, u, v) => (st.pr[v] === u && st.done.includes(v)) || (st.pr[u] === v && st.done.includes(u)) ? "a" : "gd";
        drawGraph(g, V, E, tree, (n) => (st.done.includes(n) ? "la" : "lk"), (n) => (st.d[n] === Infinity ? "∞" : String(st.d[n])));
        read.textContent = s === 0 ? "다익스트라: 출발점 A의 거리 0, 나머지는 ∞에서 시작한다(빨간 숫자가 임시 거리)." : `${s}단계: ${st.done.join(", ")} 확정(파랑). 임시 거리 B ${st.d.B}, C ${st.d.C}, D ${st.d.D === Infinity ? "∞" : st.d.D}, E ${st.d.E === Infinity ? "∞" : st.d.E}. 파란 변은 최단 경로 트리이다.`;
      } else {
        const st = ksteps[Math.min(s, ksteps.length - 1)];
        drawGraph(g, V, E, (i) => (st.chosen.includes(i) ? "a" : st.rej.includes(i) ? "d dsh" : i === st.seen ? "c" : "gd"), () => "la");
        const tot = st.chosen.reduce((t, i) => t + E[i][2], 0);
        read.textContent = s === 0 ? "크러스컬: 변을 가중치가 작은 것부터 본다." : `${s}번째로 본 변 ${E[st.seen][0]}–${E[st.seen][1]} ${E[st.seen][2]}: ` + (st.rej.includes(st.seen) ? "회로가 생겨 버린다(빨간 점선)." : "고른다(파랑).") + ` 고른 변 ${st.chosen.length}개, 합 ${tot}.`;
      }
    });
  });

  // 8.3 증가 경로로 흐름을 늘린다
  Q.def("c9-flow", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const V = { s: [50, 130], a: [200, 50], b: [200, 210], t: [360, 130] };
    const E = [["s", "a", 3], ["s", "b", 2], ["a", "b", 1], ["a", "t", 2], ["b", "t", 3]];
    const P = [[], [[0, 3]], [[1, 4]], [[0, 2, 4]]], amt = [0, 2, 2, 1];
    Q.bind(fig, ({ k }) => {
      clear(g);
      const f = [0, 0, 0, 0, 0]; for (let i = 1; i <= k; i++) P[i][0].forEach((e) => (f[e] += amt[i]));
      const cur = k > 0 ? P[k][0] : [];
      E.forEach(([u, v, c], i) => {
        const [x1, y1] = V[u], [x2, y2] = V[v], L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L;
        Q.arrow(g, x1 + ux * 16, y1 + uy * 16, x2 - ux * 18, y2 - uy * 18, cur.includes(i) ? "c" : f[i] === c ? "a" : "k", cur.includes(i) ? "fc" : f[i] === c ? "fa" : "fk");
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2; el("rect", { x: mx - 17, y: my - 10, width: 34, height: 18, class: "lk" }, g); txt(g, mx, my + 4, `${f[i]}/${c}`, "s", "middle");
      });
      Object.entries(V).forEach(([n, [x, y]]) => { el("circle", { cx: x, cy: y, r: 15, class: "la" }, g); txt(g, x, y + 5, n, "s", "middle"); });
      if (k === 3) { Q.line(g, 110, 20, 110, 240, "d dsh"); txt(g, 116, 236, "최소 절단 {s} | {a, b, t}: 3 + 2 = 5", "td", "start"); }
      const val = f[0] + f[1];
      read.textContent = k === 0 ? "흐름 0에서 시작한다. 각 변의 숫자는 흐름/용량이다." : `${k}번째 증가 경로(주황) ${["", "s→a→t", "s→b→t", "s→a→b→t"][k]}로 ${amt[k]}만큼 더 보내 흐름의 값 ${val}. ` + (k === 3 ? "s에서 나가는 변이 모두 꽉 차(파랑) 더 늘릴 수 없고, 최소 절단 용량 5와 같다." : "");
    });
  });

  // 9.1 곡선좌표의 발산: 작은 원을 지나는 선속 ÷ 넓이
  Q.def("c9-div", (fig, svg) => {
    const F = Q.frame(-3, 3, -3, 3, 100, 360, 5, 265), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const fs = [["r e_r", (r) => r, (r) => 2], ["e_r", () => 1, (r) => 1 / r], ["e_r / r", (r) => 1 / r, () => 0]];
    Q.bind(fig, ({ k, r0 }) => {
      clear(g);
      const [nm, Fr, dv] = fs[k];
      Q.line(g, F.X0, F.y(0), F.X1, F.y(0), "ax"); Q.line(g, F.x(0), F.Y0, F.x(0), F.Y1, "ax");
      for (let i = -2.5; i <= 2.51; i += 0.83) for (let j = -2.5; j <= 2.51; j += 0.83) { const r = Math.hypot(i, j); if (r < 0.3) continue; const m = Math.min(0.7, 0.35 * Fr(r)); Q.arrow(g, F.x(i), F.y(j), F.x(i + (m * i) / r), F.y(j + (m * j) / r), "gd", "fk"); }
      const c = [r0, 0.0], h = 0.3; const pts = []; for (let t = 0; t <= 2 * PI + 0.01; t += 0.05) pts.push([c[0] + h * Math.cos(t), c[1] + h * Math.sin(t)]); line(g, F, pts, "c");
      let flux = 0; const N = 400; for (let q = 0; q < N; q++) { const t = (2 * PI * (q + 0.5)) / N, x = c[0] + h * Math.cos(t), y = c[1] + h * Math.sin(t), r = Math.hypot(x, y), fr = Fr(r); flux += ((fr * x) / r * Math.cos(t) + (fr * y) / r * Math.sin(t)) * h * ((2 * PI) / N); }
      read.textContent = `F = ${nm}, 점 (${r0}, 0)을 둘러싼 반지름 0.3인 원(주황): 선속/넓이 = ${num(flux / (PI * h * h), 3)}, 공식 (1/r)(rF_r)_r = ${num(dv(r0), 3)}. 화살표가 퍼지는 정도가 발산이다.`;
    });
  });

  // 9.2 그린 정리: ∮(−y dx + x dy)는 넓이의 2배
  Q.def("c9-green", (fig, svg) => {
    const F = Q.frame(-2.4, 2.4, -2.4, 2.4, 120, 380, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ a, th }) => {
      clear(g);
      Q.line(g, F.X0, F.y(0), F.X1, F.y(0), "ax"); Q.line(g, F.x(0), F.Y0, F.x(0), F.Y1, "ax");
      for (let i = -2; i <= 2.01; i += 1) for (let j = -2; j <= 2.01; j += 1) { if (!i && !j) continue; Q.arrow(g, F.x(i), F.y(j), F.x(i - 0.3 * j), F.y(j + 0.3 * i), "gd", "fk"); }
      const T = (th * PI) / 180, sec = [[0, 0]]; for (let t = 0; t <= T + 1e-9; t += 0.03) sec.push([a * Math.cos(t), a * Math.sin(t)]);
      poly(g, F, sec, "lb");
      const c = []; for (let t = 0; t <= 2 * PI + 0.01; t += 0.03) c.push([a * Math.cos(t), a * Math.sin(t)]); line(g, F, c, "a");
      Q.dot(g, F.x(a * Math.cos(T)), F.y(a * Math.sin(T)), "fd", 5);
      const acc = a * a * T;
      read.textContent = `반지름 ${a}, ${th}°까지: 선적분 ∫(−y dx + x dy) = a²θ = ${num(acc, 3)}, 청록 부채꼴 넓이의 2배(${num(acc, 3)})와 같다. 한 바퀴면 2πa² = ${num(2 * PI * a * a, 3)}이다.`;
    });
  });

  // ── 새 그림은 이 위에 ──
})();
