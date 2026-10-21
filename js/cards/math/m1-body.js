/* 수학1(선형대수 1) 본문 카드의 조작 그림 (js/lib/qfig.js의 NMQ를 쓴다). 그림마다 NMQ.def("이름", …). */
(() => {
  "use strict";
  const Q = window.NMQ;
  if (!Q) return;
  const { el, clear, txt, num } = Q;
  const MONO = "font-family:var(--f-mono, monospace)";
  const poly = (g, F, pts, cls, open) => el("path", { d: pts.map((p, i) => (i ? "L" : "M") + F.x(p[0]).toFixed(1) + " " + F.y(p[1]).toFixed(1)).join("") + (open ? "" : "Z"), class: cls }, g);
  const line = (g, F, pts, cls) => { if (pts.length > 1) poly(g, F, pts, cls, true).setAttribute("style", "fill:none"); };
  // 틀 F 안으로만 그리는 묶음 (svg마다 clipPath 하나)
  let clipN = 0;
  const clipG = (g, svg, F) => {
    const key = `clip${Math.round(F.X0)}x${Math.round(F.Y0)}`;
    if (!svg.dataset[key]) {
      const id = "m1c" + (++clipN);
      const defs = el("defs", {}, svg);
      el("rect", { x: F.X0, y: F.Y0, width: F.X1 - F.X0, height: F.Y1 - F.Y0 }, el("clipPath", { id }, defs));
      svg.dataset[key] = id;
    }
    return el("g", { "clip-path": `url(#${svg.dataset[key]})` }, g);
  };
  // 분수로 보이기 (분모 12 이하)
  const frac = (x) => {
    if (Math.abs(x) < 1e-9) return "0";
    for (let d = 1; d <= 12; d++) { const n = Math.round(x * d); if (Math.abs(n / d - x) < 1e-9) return d === 1 ? num(n, 0) : `${n < 0 ? "−" : ""}${Math.abs(n)}/${d}`; }
    return num(x, 2);
  };
  // 행렬 하나를 칸으로 그린다. hot: 강조할 행 번호들, bar: 세로선을 둘 열 번호
  const mat = (g, x, y, M, o) => {
    o = o || {};
    const W = o.w || 52, H = o.h || 30;
    M.forEach((r, i) => r.forEach((v, j) => {
      el("rect", { x: x + j * W, y: y + i * H, width: W - 4, height: H - 4, class: (o.hot || []).includes(i) ? "lc" : o.cls ? o.cls(i, j, v) : "lk" }, g);
      txt(g, x + j * W + W / 2 - 2, y + i * H + H / 2 + 3, typeof v === "string" ? v : frac(v), "s", "middle").setAttribute("style", MONO + ";font-size:12px");
    }));
    if (o.bar != null) Q.line(g, x + o.bar * W - 2, y - 4, x + o.bar * W - 2, y + M.length * H, "k");
    if (o.name) txt(g, x + (M[0].length * W) / 2, y - 8, o.name, "s", "middle");
  };
  // 소거 기록: ops = [[설명, 함수(A)], …]
  const record = (A0, ops) => { let A = A0.map((r) => r.slice()); const S = [{ A: A.map((r) => r.slice()), say: "처음 첨가행렬.", hot: [] }]; ops.forEach(([say, f, hot]) => { A = f(A.map((r) => r.slice())); S.push({ A: A.map((r) => r.slice()), say, hot }); }); return S; };
  const addRow = (i, c, j) => (A) => { A[i] = A[i].map((v, k) => v + c * A[j][k]); return A; };
  const scale = (i, c) => (A) => { A[i] = A[i].map((v) => v * c); return A; };

  // 1.1 가우스-조르당 소거를 한 단계씩
  Q.def("m1-rref", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const S = record([[1, 2, 1, 4], [2, 5, 3, 9], [-1, 1, 4, 7]], [
      ["R₂ → R₂ − 2R₁: 첫 열 피벗 아래를 0으로.", addRow(1, -2, 0), [1]],
      ["R₃ → R₃ + R₁: 첫 열이 끝났다.", addRow(2, 1, 0), [2]],
      ["R₁ → R₁ − 2R₂: 둘째 열 피벗 위를 0으로.", addRow(0, -2, 1), [0]],
      ["R₃ → R₃ − 3R₂: 둘째 열 피벗 아래를 0으로.", addRow(2, -3, 1), [2]],
      ["R₃ → ½R₃: 셋째 피벗을 1로.", scale(2, 0.5), [2]],
      ["R₁ → R₁ + R₃: 셋째 열 위를 0으로.", addRow(0, 1, 2), [0]],
      ["R₂ → R₂ − R₃: 기약 행사다리꼴. x = 6, y = −3, z = 4를 바로 읽는다.", addRow(1, -1, 2), [1]],
    ]);
    Q.bind(fig, ({ s }) => {
      clear(g);
      const st = S[s], A = st.A;
      const piv = (i, j) => { const r = A[i]; const k = r.findIndex((v) => Math.abs(v) > 1e-9); return k === j && j < 3; };
      mat(g, 60, 40, A, { w: 62, h: 38, bar: 3, hot: st.hot, cls: (i, j) => (piv(i, j) ? "la" : "lk") });
      ["x", "y", "z", "b"].forEach((c, j) => txt(g, 60 + j * 62 + 29, 30, c, "i", "middle"));
      txt(g, 340, 70, "파랑 칸: 각 행의 선도 성분", "ta", "start");
      txt(g, 340, 92, "주황 행: 방금 바뀐 행", "tc", "start");
      read.textContent = `${s}단계: ${st.say}`;
    });
  });

  // 1.2 해집합 = 특수해 + 동차 해 (평면의 한 방정식 x + 2y = b)
  Q.def("m1-solset", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(-5, 5, -3.2, 3.2, 110, 410, 15, 215);
    Q.bind(fig, ({ b, t }) => {
      clear(g);
      for (let v = -4; v <= 4; v++) Q.line(g, F.x(v), F.Y0, F.x(v), F.Y1, "gd");
      for (let v = -3; v <= 3; v++) Q.line(g, F.X0, F.y(v), F.X1, F.y(v), "gd");
      Q.line(g, F.X0, F.y(0), F.X1, F.y(0), "ax"); Q.line(g, F.x(0), F.Y0, F.x(0), F.Y1, "ax");
      const L = (c) => [[-5, (c + 5) / 2], [5, (c - 5) / 2]];
      line(g, F, L(0), "b"); line(g, F, L(b), "a");
      const p = [b, 0], h = [-2 * t, t], x = [p[0] + h[0], p[1] + h[1]];
      Q.arrow(g, F.x(0), F.y(0), F.x(p[0]), F.y(p[1]), "c", "fc");
      if (Math.abs(t) > 0.01) { Q.arrow(g, F.x(0), F.y(0), F.x(h[0]), F.y(h[1]), "b", "fb"); Q.arrow(g, F.x(p[0]), F.y(p[1]), F.x(x[0]), F.y(x[1]), "b dsh", "fb"); }
      Q.dot(g, F.x(x[0]), F.y(x[1]), "fa", 5);
      txt(g, F.x(4.8), F.y((0 - 4.8) / 2) - 8, "동차 해 x + 2y = 0", "tb", "end");
      txt(g, F.x(-4.8), F.y((b + 4.8) / 2) - 8, `x + 2y = ${num(b, 1)}`, "ta", "start");
      read.textContent = `특수해 p = (${num(b, 1)}, 0)(주황)에 동차 해 h = t(−2, 1)(청록)을 더한 p + h = (${num(x[0], 1)}, ${num(x[1], 1)})(파랑 점)은 언제나 파랑 직선 위에 있다. 우변 b를 바꾸면 해집합은 동차 해 직선을 평행이동한 직선이 된다.`;
    });
  });

  // 1.3 A와 역행렬: 단위정사각형이 어떻게 바뀌나
  Q.def("m1-inverse", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(-4.5, 6.8, -5.4, 8.2, 60, 240, 12, 228);
    const A = [[2, 1], [5, 3]], B = [[3, -1], [-5, 2]];
    const mul = (M, v) => [M[0][0] * v[0] + M[0][1] * v[1], M[1][0] * v[0] + M[1][1] * v[1]];
    const sq = [[0, 0], [1, 0], [1, 1], [0, 1]];
    Q.bind(fig, ({ m }) => {
      clear(g);
      for (let v = -4; v <= 6; v++) Q.line(g, F.x(v), F.Y0, F.x(v), F.Y1, "gd");
      for (let v = -5; v <= 8; v++) Q.line(g, F.X0, F.y(v), F.X1, F.y(v), "gd");
      Q.line(g, F.X0, F.y(0), F.X1, F.y(0), "ax"); Q.line(g, F.x(0), F.Y0, F.x(0), F.Y1, "ax");
      poly(g, F, sq, "lk");
      const M = m == 0 ? A : m == 1 ? B : [[1, 0], [0, 1]];
      const img = sq.map((v) => mul(M, v));
      poly(g, F, img, m == 2 ? "lb" : "la");
      Q.arrow(g, F.x(0), F.y(0), F.x(img[1][0]), F.y(img[1][1]), "a", "fa"); Q.arrow(g, F.x(0), F.y(0), F.x(img[3][0]), F.y(img[3][1]), "c", "fc");
      const label = m == 0 ? "A" : m == 1 ? "A⁻¹" : "A⁻¹A = I";
      mat(g, 300, 60, m == 2 ? [[1, 0], [0, 1]] : M, { name: label });
      txt(g, 300, 160, `파랑 화살표: 첫째 열 (${M[0][0]}, ${M[1][0]})`, "ta", "start");
      txt(g, 300, 182, `주황 화살표: 둘째 열 (${M[0][1]}, ${M[1][1]})`, "tc", "start");
      read.textContent = m == 0 ? "A는 단위정사각형(회색)을 두 열 (2, 5), (1, 3)이 만드는 평행사변형으로 바꾼다. 넓이는 2·3 − 1·5 = 1배이다." : m == 1 ? "A⁻¹은 같은 정사각형을 (3, −5), (−1, 2)가 만드는 평행사변형으로 바꾼다. A가 한 일을 되돌리는 변환이다." : "A를 한 뒤 A⁻¹을 하면 정사각형이 제자리로 돌아온다. 곧 A⁻¹A = I이다.";
    });
  });

  // 1.4 LU 분해로 두 번 대입하기
  Q.def("m1-lu", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const L = [[1, 0, 0], [2, 1, 0], [4, 3, 1]], U = [[2, 1, 1], [0, 1, 1], [0, 0, 2]], b = [4, 10, 24], y = [4, 2, 2], x = [1, 1, 1];
    const say = [
      "A = LU로 나눠 두었다. 먼저 Ly = b를 위에서부터 푼다.",
      "첫 식 y₁ = 4. 미지수가 하나뿐이다.",
      "둘째 식 2y₁ + y₂ = 10에서 y₂ = 2.",
      "셋째 식 4y₁ + 3y₂ + y₃ = 24에서 y₃ = 2. 이제 Ux = y를 아래에서부터 푼다.",
      "마지막 식 2x₃ = 2에서 x₃ = 1.",
      "둘째 식 x₂ + x₃ = 2에서 x₂ = 1.",
      "첫 식 2x₁ + x₂ + x₃ = 4에서 x₁ = 1. 해는 x = (1, 1, 1)이다.",
    ];
    Q.bind(fig, ({ s }) => {
      clear(g);
      const fwd = s <= 3, row = fwd ? s - 1 : 2 - (s - 4);
      mat(g, 20, 40, L, { name: "L", w: 40, hot: fwd && s > 0 ? [row] : [] });
      mat(g, 150, 40, [0, 1, 2].map((i) => [s > i ? y[i] : "y" + "₁₂₃"[i]]), { name: "y", w: 44, hot: fwd && s > 0 ? [row] : [] });
      txt(g, 210, 85, "=", "s", "middle");
      mat(g, 225, 40, b.map((v) => [v]), { name: "b", w: 44 });
      mat(g, 300, 40, U, { name: "U", w: 40, hot: !fwd ? [row] : [] });
      mat(g, 430, 40, [0, 1, 2].map((i) => [s >= 4 && i >= 2 - (s - 4) ? x[i] : "x" + "₁₂₃"[i]]), { name: "x", w: 44, hot: !fwd ? [row] : [] });
      txt(g, 20, 175, fwd ? "전진 대입 Ly = b (위에서 아래로)" : "후진 대입 Ux = y (아래에서 위로)", fwd ? "ta" : "tc", "start");
      read.textContent = `${s}단계: ${say[s]}`;
    });
  });

  // 평면 좌표 틀과 화살표
  const plane = (g, F, step) => {
    const s = step || 1;
    for (let v = Math.ceil(F.x0 / s) * s; v <= F.x1; v += s) Q.line(g, F.x(v), F.Y0, F.x(v), F.Y1, "gd");
    for (let v = Math.ceil(F.y0 / s) * s; v <= F.y1; v += s) Q.line(g, F.X0, F.y(v), F.X1, F.y(v), "gd");
    Q.line(g, F.X0, F.y(0), F.X1, F.y(0), "ax"); Q.line(g, F.x(0), F.Y0, F.x(0), F.Y1, "ax");
  };
  const vec = (g, F, a, b, cls, label, from) => { const o = from || [0, 0]; Q.arrow(g, F.x(o[0]), F.y(o[1]), F.x(o[0] + a), F.y(o[1] + b), cls, "f" + cls.split(" ")[0]); if (label) txt(g, F.x(o[0] + a) + 6, F.y(o[1] + b) - 4, label, "t" + cls.split(" ")[0], "start"); };

  // 2.1 닫힘과 공리 5: 연산 결과가 집합 안에 남는가
  Q.def("m1-vspace", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(-4, 4, -3, 3, 100, 420, 15, 225);
    Q.bind(fig, ({ e, c }) => {
      clear(g);
      if (e == 1) el("rect", { x: F.x(0), y: F.Y0, width: F.X1 - F.x(0), height: F.Y1 - F.Y0, class: "lb" }, g);
      else el("rect", { x: F.X0, y: F.Y0, width: F.X1 - F.X0, height: F.Y1 - F.Y0, class: "lb" }, g);
      plane(g, F);
      const u = [1, 1.5], v = [1.5, -1], s = [u[0] + v[0], u[1] + v[1]], m = e == 2 ? [c * u[0], 0] : [c * u[0], c * u[1]];
      vec(g, F, u[0], u[1], "a", "u"); vec(g, F, v[0], v[1], "a", "v"); vec(g, F, s[0], s[1], "b", "u + v");
      const out = e == 1 && m[0] < 0;
      vec(g, F, m[0], m[1], out ? "d" : "c", `${num(c, 1)}u`);
      const S = ["ℝ²: 덧셈과 실수배가 보통 연산", "{(x, y) : x ≥ 0}", "실수배를 c(x, y) = (cx, 0)으로 바꾼 ℝ²"];
      txt(g, 10, 14, S[e], "s", "start");
      read.textContent = e == 0 ? `ℝ²에서는 u + v와 ${num(c, 1)}u가 늘 평면(청록) 안에 있다. 여덟 공리도 성분마다 실수의 성질로 성립한다.` : e == 1 ? (out ? `c = ${num(c, 1)} < 0이면 cu가 오른쪽 반평면 밖(빨강)으로 나간다. 실수배에 닫혀 있지 않고, u의 역원 −u도 없다.` : `c ≥ 0이면 cu가 반평면 안에 남지만, c를 음수로 바꾸면 밖으로 나간다.`) : `이 실수배로는 1·u = (${num(u[0], 1)}, 0)이 u와 다르다. 공리 5(1u = u)가 깨져 벡터공간이 아니다.`;
    });
  });

  // 2.2 합집합과 생성: 두 축의 합집합은 덧셈에 닫히지 않는다
  Q.def("m1-span", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(-4, 4, -3, 3, 100, 420, 15, 225);
    Q.bind(fig, ({ a, b }) => {
      clear(g);
      plane(g, F);
      Q.line(g, F.X0, F.y(0), F.X1, F.y(0), "a"); Q.line(g, F.x(0), F.Y0, F.x(0), F.Y1, "c");
      const p = [a, b], inU = Math.abs(a) < 1e-9 || Math.abs(b) < 1e-9;
      if (Math.abs(a) > 1e-9) vec(g, F, a, 0, "a", `${num(a, 1)}e₁`);
      if (Math.abs(b) > 1e-9) vec(g, F, 0, b, "c", `${num(b, 1)}e₂`, [a, 0]);
      Q.dot(g, F.x(p[0]), F.y(p[1]), inU ? "fb" : "fd", 5);
      txt(g, F.X1 - 4, F.y(0) - 6, "x축", "ta", "end"); txt(g, F.x(0) + 6, F.Y0 + 14, "y축", "tc", "start");
      read.textContent = `${num(a, 1)}e₁ + ${num(b, 1)}e₂ = (${num(a, 1)}, ${num(b, 1)}). ` + (inU ? "한 계수가 0이라 이 점은 두 축의 합집합 안에 있다." : "두 계수가 모두 0이 아니면 이 점(빨강)은 어느 축에도 없다. 합집합은 덧셈에 닫혀 있지 않지만, 두 축의 생성 span{e₁, e₂}는 평면 전체이다.");
    });
  });

  // 2.3 기저가 만드는 좌표 격자
  Q.def("m1-basis", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(-4, 4, -3, 3, 100, 420, 15, 225);
    Q.bind(fig, ({ t }) => {
      clear(g);
      const th = (t * Math.PI) / 180, v1 = [1.2, 0], v2 = [Math.cos(th) * 1.2, Math.sin(th) * 1.2], w = [2, 1.5];
      const det = v1[0] * v2[1] - v1[1] * v2[0];
      plane(g, F);
      const cg = clipG(g, svg, F);
      if (Math.abs(det) > 0.02) {
        for (let k = -8; k <= 8; k++) {
          Q.line(cg, F.x(k * v1[0] - 10 * v2[0]), F.y(k * v1[1] - 10 * v2[1]), F.x(k * v1[0] + 10 * v2[0]), F.y(k * v1[1] + 10 * v2[1]), "b gl");
          Q.line(cg, F.x(k * v2[0] - 10 * v1[0]), F.y(k * v2[1] - 10 * v1[1]), F.x(k * v2[0] + 10 * v1[0]), F.y(k * v2[1] + 10 * v1[1]), "b gl");
        }
      }
      g.querySelectorAll("line.gl").forEach((l) => l.setAttribute("style", "stroke-opacity:.3"));
      vec(g, F, v1[0], v1[1], "a", "v₁"); vec(g, F, v2[0], v2[1], "c", "v₂");
      Q.dot(g, F.x(w[0]), F.y(w[1]), "fk", 5); txt(g, F.x(w[0]) + 6, F.y(w[1]) - 6, "w", "s", "start");
      if (Math.abs(det) > 0.02) {
        const c1 = (w[0] * v2[1] - w[1] * v2[0]) / det, c2 = (v1[0] * w[1] - v1[1] * w[0]) / det;
        vec(g, F, c1 * v1[0], c1 * v1[1], "a dsh"); vec(g, F, c2 * v2[0], c2 * v2[1], "c dsh", null, [c1 * v1[0], c1 * v1[1]]);
        read.textContent = `{v₁, v₂}가 일차독립이라 기저이다. w = ${num(c1, 2)}v₁ + ${num(c2, 2)}v₂로 쓰는 방법이 하나뿐이고, 이 두 수가 w의 좌표이다(청록 격자).`;
      } else read.textContent = "v₂가 v₁과 같은 직선 위에 있어 일차종속이다. 둘의 생성은 직선 하나라 w를 만들 수 없고, 격자가 무너진다.";
    }, (k, v) => `${v}°`);
  });

  // 2.4 교환 정리: 생성 집합의 벡터를 일차독립 벡터로 하나씩 바꿔 넣는다
  Q.def("m1-exchange", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const S = [
      { set: ["e₁", "e₂", "e₃"], hot: -1, say: "G = {e₁, e₂, e₃}가 ℝ³을 생성한다. 일차독립 집합 L = {u₁, u₂}, u₁ = (1, 1, 0), u₂ = (0, 1, 1)을 하나씩 넣는다." },
      { set: ["u₁", "e₂", "e₃"], hot: 0, say: "u₁ = 1·e₁ + 1·e₂로 쓰고, 0이 아닌 계수가 붙은 e₁을 u₁으로 바꾼다. e₁ = u₁ − e₂이므로 생성은 그대로 ℝ³이다." },
      { set: ["u₁", "u₂", "e₃"], hot: 1, say: "u₂ = 0·u₁ + 1·e₂ + 1·e₃이다. G에서 온 벡터 e₂의 계수가 0이 아니므로 e₂를 u₂로 바꾼다. L을 다 넣었는데 G의 벡터 e₃이 하나 남았으므로 |L| = 2 ≤ |G| = 3이다." },
    ];
    Q.bind(fig, ({ s }) => {
      clear(g);
      const st = S[s];
      txt(g, 30, 40, "생성 집합", "s", "start");
      st.set.forEach((n, i) => { el("rect", { x: 30 + i * 100, y: 55, width: 86, height: 44, class: i === st.hot ? "lc" : n[0] === "u" ? "la" : "lk" }, g); txt(g, 73 + i * 100, 83, n, "s", "middle").setAttribute("style", MONO + ";font-size:16px"); });
      txt(g, 30, 140, "아직 넣지 않은 L의 벡터", "s", "start");
      ["u₁", "u₂"].slice(s).forEach((n, i) => { el("rect", { x: 30 + i * 100, y: 152, width: 86, height: 40, class: "la" }, g); txt(g, 73 + i * 100, 178, n, "s", "middle").setAttribute("style", MONO + ";font-size:16px"); });
      if (s === 2) txt(g, 30, 175, "없음", "s", "start");
      read.textContent = `${s}단계: ${st.say}`;
    });
  });

  // 2.5 직합: 두 직선으로 벡터를 하나뿐인 방법으로 나누기
  Q.def("m1-directsum", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(-4, 4, -3, 3, 100, 420, 15, 225);
    Q.bind(fig, ({ t }) => {
      clear(g);
      plane(g, F);
      const th = (t * Math.PI) / 180, d = [Math.cos(th), Math.sin(th)], v = [2.5, 1.5];
      Q.line(g, F.X0, F.y(0), F.X1, F.y(0), "a");
      Q.line(clipG(g, svg, F), F.x(-6 * d[0]), F.y(-6 * d[1]), F.x(6 * d[0]), F.y(6 * d[1]), "c");
      txt(g, F.X1 - 4, F.y(0) + 16, "W₁", "ta", "end"); txt(g, F.x(2.6 * d[0]) + 6, F.y(2.6 * d[1]) - 4, "W₂", "tc", "start");
      Q.dot(g, F.x(v[0]), F.y(v[1]), "fk", 5); txt(g, F.x(v[0]) + 6, F.y(v[1]) - 6, "v", "s", "start");
      if (Math.abs(d[1]) > 0.03) {
        const b = v[1] / d[1], a = v[0] - b * d[0];
        vec(g, F, a, 0, "a", "w₁"); vec(g, F, b * d[0], b * d[1], "c", "w₂", [a, 0]);
        read.textContent = `W₁ ∩ W₂ = {0}이라 W₁ ⊕ W₂ = ℝ²이다. v = w₁ + w₂로 나누는 방법이 하나뿐이며, w₁ = (${num(a, 2)}, 0), w₂ = ${num(b, 2)}·(${num(d[0], 2)}, ${num(d[1], 2)})이다.`;
      } else read.textContent = "W₂가 W₁과 같은 직선이 되면 W₁ + W₂는 직선 하나뿐이라 v를 만들 수 없다. 차원도 1 + 1 − 1 = 1이다.";
    }, (k, v) => `${v}°`);
  });

  // 3.1 핵과 상: 정의역의 직선 하나가 0으로 사라진다
  Q.def("m1-kernel", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(-3, 3, -3, 3, 20, 240, 15, 235), G = Q.frame(-3, 3, -3, 3, 280, 500, 15, 235);
    const M = [[[1, 0.5], [0.5, 1.5]], [[1, 2], [0.5, 1]], [[0, 0], [0, 0]]];
    Q.bind(fig, ({ m, t }) => {
      clear(g);
      const A = M[m], th = (t * Math.PI) / 180, v = [2 * Math.cos(th), 2 * Math.sin(th)], Av = [A[0][0] * v[0] + A[0][1] * v[1], A[1][0] * v[0] + A[1][1] * v[1]];
      plane(g, F); plane(g, G);
      txt(g, F.X0 + 4, F.Y0 + 12, "정의역 V", "s", "start"); txt(g, G.X0 + 4, G.Y0 + 12, "공역 W", "s", "start");
      const rank = m == 0 ? 2 : m == 1 ? 1 : 0;
      if (rank === 1) { const k = [-2, 1]; Q.line(clipG(g, svg, F), F.x(-3 * k[0]), F.y(-3 * k[1]), F.x(3 * k[0]), F.y(3 * k[1]), "d"); const r = [1, 0.5]; Q.line(clipG(g, svg, G), G.x(-6 * r[0]), G.y(-6 * r[1]), G.x(6 * r[0]), G.y(6 * r[1]), "b"); }
      if (rank === 2) el("rect", { x: G.X0, y: G.Y0, width: G.X1 - G.X0, height: G.Y1 - G.Y0, class: "lb" }, g).setAttribute("style", "fill-opacity:.35");
      if (rank === 0) el("rect", { x: F.X0, y: F.Y0, width: F.X1 - F.X0, height: F.Y1 - F.Y0, class: "ld" }, g).setAttribute("style", "fill-opacity:.35");
      vec(g, F, v[0], v[1], "a", "v");
      if (Math.hypot(Av[0], Av[1]) > 0.05) vec(g, G, Av[0], Av[1], "c", "Tv"); else Q.dot(g, G.x(0), G.y(0), "fd", 5);
      read.textContent = (rank === 2 ? "핵은 {0}(nullity 0), 상은 평면 전체(rank 2)이다." : rank === 1 ? "핵은 빨간 직선 x + 2y = 0(nullity 1), 상은 청록 직선(rank 1)이다." : "모든 벡터가 0으로 가므로 핵은 평면 전체(nullity 2), 상은 {0}(rank 0)이다.") + ` 어느 경우든 nullity + rank = 2 = dim V이다. 지금 Tv = (${num(Av[0], 2)}, ${num(Av[1], 2)}).`;
    }, (k, v) => (k === "t" ? `${v}°` : num(v)));
  });

  // 3.2 회전 두 번은 각을 더한 회전 한 번: 행렬의 곱
  Q.def("m1-rot", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(-1.4, 1.4, -1.4, 1.4, 40, 260, 15, 235);
    Q.bind(fig, ({ a, b }) => {
      clear(g);
      const A = (a * Math.PI) / 180, B = (b * Math.PI) / 180;
      plane(g, F, 0.5);
      Q.plot(g, F, (x) => Math.sqrt(Math.max(0, 1 - x * x)), "gd", -1, 1, 100); Q.plot(g, F, (x) => -Math.sqrt(Math.max(0, 1 - x * x)), "gd", -1, 1, 100);
      vec(g, F, 1, 0, "k", "e₁"); vec(g, F, Math.cos(B), Math.sin(B), "a", "R_β e₁"); vec(g, F, Math.cos(A + B), Math.sin(A + B), "c", "R_α R_β e₁");
      const C = Math.cos(A + B), S = Math.sin(A + B);
      mat(g, 300, 60, [[num(C, 3), num(-S, 3)], [num(S, 3), num(C, 3)]], { w: 70, name: "R_α R_β = R_(α+β)" });
      txt(g, 300, 150, `cos α cos β − sin α sin β = ${num(C, 3)}`, "s", "start");
      txt(g, 300, 172, `sin α cos β + cos α sin β = ${num(S, 3)}`, "s", "start");
      read.textContent = `β = ${b}°만큼 돌린 뒤 α = ${a}°만큼 더 돌리면 e₁은 각 ${a + b}° 자리로 간다. 두 회전 행렬의 곱의 첫째 열이 (cos ${a + b}°, sin ${a + b}°)가 되는 것이 삼각함수의 덧셈정리이다.`;
    }, (k, v) => `${v}°`);
  });

  // 3.3 기저를 바꾸면 행렬이 대각이 된다
  Q.def("m1-change", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(-4, 4, -3, 3, 20, 340, 15, 235);
    Q.bind(fig, ({ t, view }) => {
      clear(g);
      const th = (t * Math.PI) / 180, v = [1.2 * Math.cos(th), 1.2 * Math.sin(th)], Av = [2 * v[0] + v[1], v[0] + 2 * v[1]];
      const a = (v[0] + v[1]) / 2, b = (v[0] - v[1]) / 2;
      plane(g, F);
      if (view == 1) { const cg = clipG(g, svg, F); for (let k = -8; k <= 8; k++) { Q.line(cg, F.x(k - 8), F.y(k + 8), F.x(k + 8), F.y(k - 8), "b gl"); Q.line(cg, F.x(k - 8), F.y(-k - 8), F.x(k + 8), F.y(-k + 8), "b gl"); } g.querySelectorAll("line.gl").forEach((l) => l.setAttribute("style", "stroke-opacity:.3")); vec(g, F, 1, 1, "b", "(1, 1)"); vec(g, F, 1, -1, "b", "(1, −1)"); }
      vec(g, F, v[0], v[1], "a", "v"); vec(g, F, Av[0], Av[1], "c", "Av");
      if (view == 0) { txt(g, 360, 60, "표준좌표", "s", "start"); txt(g, 360, 85, `v = (${num(v[0], 2)}, ${num(v[1], 2)})`, "ta", "start"); txt(g, 360, 110, `Av = (${num(Av[0], 2)}, ${num(Av[1], 2)})`, "tc", "start"); }
      else { txt(g, 360, 60, "새 기저 β′ 좌표", "s", "start"); txt(g, 360, 85, `[v] = (${num(a, 2)}, ${num(b, 2)})`, "ta", "start"); txt(g, 360, 110, `[Av] = (${num(3 * a, 2)}, ${num(b, 2)})`, "tc", "start"); txt(g, 360, 140, "첫 좌표만 3배", "s", "start"); }
      read.textContent = view == 0 ? `표준좌표에서는 A = (2 1; 1 2)가 v의 두 좌표를 섞는다. Av = (${num(Av[0], 2)}, ${num(Av[1], 2)}).` : `기저 (1, 1), (1, −1)의 좌표로 보면 Q⁻¹AQ = (3 0; 0 1)이라 첫 좌표(${num(a, 2)})만 3배가 되고 둘째 좌표(${num(b, 2)})는 그대로이다.`;
    }, (k, v) => (k === "t" ? `${v}°` : num(v)));
  });

  // a + bx + cx²를 읽기 좋게
  const poly2 = (a, b, c) => { const t = [[a, ""], [b, "x"], [c, "x²"]].filter(([k]) => Math.abs(k) > 1e-9).map(([k, x], i) => { const m = Math.abs(k), s = k < 0 ? "−" : "+"; const body = x && m === 1 ? x : num(m, 1) + x; return i === 0 ? (k < 0 ? "−" : "") + body : ` ${s} ${body}`; }); return t.length ? t.join("") : "0"; };
  // 3.4 T p = p + p′: 다항식과 좌표 벡터가 똑같이 움직인다
  Q.def("m1-iso", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(-2, 2, -4, 6, 30, 280, 15, 235);
    Q.bind(fig, ({ a, b, c }) => {
      clear(g);
      plane(g, F, 1);
      const p = (x) => a + b * x + c * x * x, Tp = (x) => p(x) + b + 2 * c * x;
      Q.plot(g, F, p, "a", -2, 2, 200); Q.plot(g, F, Tp, "c", -2, 2, 200);
      txt(g, F.X0 + 4, F.Y0 + 12, "p", "ta", "start"); txt(g, F.X0 + 4, F.Y0 + 28, "Tp = p + p′", "tc", "start");
      mat(g, 310, 50, [[1, 1, 0], [0, 1, 2], [0, 0, 1]], { w: 36, name: "[T]" });
      mat(g, 430, 50, [[a], [b], [c]], { w: 36, name: "[p]", cls: () => "la" });
      txt(g, 412, 95, "·", "s", "middle");
      mat(g, 470, 50, [[a + b], [b + 2 * c], [c]], { w: 36, name: "[Tp]", cls: () => "lc" });
      txt(g, 310, 175, "좌표 사상 a + bx + cx² ↦ (a, b, c)", "s", "start");
      read.textContent = `p = ${poly2(a, b, c)}의 좌표 (${num(a, 1)}, ${num(b, 1)}, ${num(c, 1)})에 [T]를 곱하면 Tp의 좌표 (${num(a + b, 1)}, ${num(b + 2 * c, 1)}, ${num(c, 1)})가 나온다. 다항식에서 한 계산과 ℝ³에서 한 계산이 똑같다.`;
    });
  });

  // 4.1 잉여류: W = span{(1, 1)}에 평행한 직선들, 각 직선의 주소 y − x
  Q.def("m1-coset", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(-4, 6, -4, 4, 20, 330, 15, 235);
    Q.bind(fig, ({ x, y }) => {
      clear(g);
      plane(g, F);
      const cg = clipG(g, svg, F), k = y - x;
      for (let c = -8; c <= 8; c++) Q.line(cg, F.x(-10), F.y(-10 + c), F.x(10), F.y(10 + c), c === 0 ? "b" : "gd");
      Q.line(cg, F.x(-10), F.y(-10 + k), F.x(10), F.y(10 + k), "c").setAttribute("style", "stroke-width:2.5");
      const u = [3, 1];
      Q.dot(g, F.x(u[0]), F.y(u[1]), "fa", 5); txt(g, F.x(u[0]) + 6, F.y(u[1]) + 14, "(3, 1)", "ta", "start");
      Q.dot(g, F.x(x), F.y(y), "fc", 5); txt(g, F.x(x) + 6, F.y(y) - 6, `(${num(x, 1)}, ${num(y, 1)})`, "tc", "start");
      txt(g, F.x(3.6), F.y(3.6) - 6, "W", "tb", "start");
      const L = Q.frame(-6, 6, 0, 1, 360, 505, 100, 130);
      Q.line(g, L.X0, L.y(0), L.X1, L.y(0), "ax"); [-4, -2, 0, 2, 4].forEach((v) => txt(g, L.x(v), L.y(0) + 16, num(v), "s", "middle"));
      Q.dot(g, L.x(-2), L.y(0), "fa", 5); Q.dot(g, L.x(Math.max(-6, Math.min(6, k))), L.y(0), "fc", 5);
      txt(g, 432, 80, "V/W ≅ ℝ (주소 y − x)", "s", "middle");
      const same = Math.abs(k + 2) < 1e-9;
      read.textContent = `(${num(x, 1)}, ${num(y, 1)}) + W는 직선 y = x ${k < 0 ? "−" : "+"} ${num(Math.abs(k), 1)}(주황)이다. ` + (same ? "(3, 1) + W와 같은 잉여류이다. 두 점의 차가 W 안에 있기 때문이다." : `(3, 1) + W는 y = x − 2이므로 다른 잉여류이다. 차 (${num(x - 3, 1)}, ${num(y - 1, 1)})이 W 밖에 있다.`);
    });
  });

  // 4.2 쌍대기저는 좌표를 읽는 함수: 등고선으로 보기
  Q.def("m1-dual", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(-5, 7, -3, 4, 20, 360, 15, 235);
    Q.bind(fig, ({ a, b }) => {
      clear(g);
      plane(g, F);
      const v1 = [2, 1], v2 = [3, 1], v = [a * v1[0] + b * v2[0], a * v1[1] + b * v2[1]];
      const cg = clipG(g, svg, F);
      for (let c = -4; c <= 4; c++) {
        // f1 = −x + 3y = c 는 v2 방향, f2 = x − 2y = c 는 v1 방향
        const p1 = [c * v1[0], c * v1[1]], p2 = [c * v2[0], c * v2[1]];
        Q.line(cg, F.x(p1[0] - 10 * v2[0]), F.y(p1[1] - 10 * v2[1]), F.x(p1[0] + 10 * v2[0]), F.y(p1[1] + 10 * v2[1]), "a gl");
        Q.line(cg, F.x(p2[0] - 10 * v1[0]), F.y(p2[1] - 10 * v1[1]), F.x(p2[0] + 10 * v1[0]), F.y(p2[1] + 10 * v1[1]), "c gl");
      }
      g.querySelectorAll("line.gl").forEach((l) => l.setAttribute("style", "stroke-opacity:.35"));
      vec(g, F, v1[0], v1[1], "a", "v₁"); vec(g, F, v2[0], v2[1], "c", "v₂");
      Q.dot(g, F.x(v[0]), F.y(v[1]), "fk", 5); txt(g, F.x(v[0]) + 6, F.y(v[1]) - 6, "v", "s", "start");
      const f1 = -v[0] + 3 * v[1], f2 = v[0] - 2 * v[1];
      txt(g, 375, 60, `v = (${num(v[0], 2)}, ${num(v[1], 2)})`, "s", "start");
      txt(g, 375, 90, `f₁(v) = −x + 3y = ${num(f1, 2)}`, "ta", "start");
      txt(g, 375, 115, `f₂(v) = x − 2y = ${num(f2, 2)}`, "tc", "start");
      read.textContent = `v = ${num(a, 1)}v₁ + ${num(b, 1)}v₂이면 f₁(v) = ${num(f1, 2)}, f₂(v) = ${num(f2, 2)}로 두 계수를 그대로 읽는다. 파랑 선은 f₁의 등고선, 주황 선은 f₂의 등고선이다.`;
    });
  });

  const det2 = (u, v) => u[0] * v[1] - u[1] * v[0];
  const para = (g, F, u, v, cls) => poly(g, F, [[0, 0], u, [u[0] + v[0], u[1] + v[1]], v], cls);

  // 5.1 부호 있는 넓이: 배수 더하기는 넓이를 바꾸지 않는다
  Q.def("m1-det", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(-3, 4, -2.5, 3, 20, 330, 12, 238);
    Q.bind(fig, ({ t, c }) => {
      clear(g);
      plane(g, F);
      const th = (t * Math.PI) / 180, r1 = [2, 0.5], r2o = [1.5 * Math.cos(th), 1.5 * Math.sin(th)], r2 = [r2o[0] + c * r1[0], r2o[1] + c * r1[1]];
      const D = det2(r1, r2);
      para(g, F, r1, r2, D >= 0 ? "la" : "ld");
      vec(g, F, r1[0], r1[1], "a", "r₁"); vec(g, F, r2[0], r2[1], "c", "r₂");
      if (Math.abs(c) > 1e-9) vec(g, F, r2o[0], r2o[1], "c dsh");
      txt(g, 350, 60, `det = ${num(D, 3)}`, "s", "start").setAttribute("style", MONO + ";font-size:15px");
      txt(g, 350, 90, D > 1e-9 ? "양수: 방향 그대로" : D < -1e-9 ? "음수: 방향이 뒤집힘" : "0: 납작해짐", D >= 0 ? "ta" : "td", "start");
      txt(g, 350, 120, `r₂에 r₁의 ${num(c, 1)}배를 더함`, "s", "start");
      read.textContent = `두 행 r₁, r₂가 만드는 평행사변형의 부호 있는 넓이는 ${num(D, 3)}이다. r₂에 r₁의 배수를 더하면(층밀림) 밑변과 높이가 그대로라 값이 변하지 않고, r₂를 r₁ 반대쪽으로 돌리면 부호가 바뀐다.`;
    }, (k, v) => (k === "t" ? `${v}°` : num(v, 1)));
  });

  // 5.2 여인수 전개: 어느 줄로 전개해도 같다
  Q.def("m1-cofactor", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const A = [[2, 0, 1], [3, 0, 5], [1, 4, 2]];
    const minor = (i, j) => { const M = A.filter((_, r) => r !== i).map((r) => r.filter((_, c) => c !== j)); return M[0][0] * M[1][1] - M[0][1] * M[1][0]; };
    Q.bind(fig, ({ l }) => {
      clear(g);
      const isRow = l < 3, k = l % 3, W = 54, H = 40, X = 40, Y = 40;
      A.forEach((r, i) => r.forEach((v, j) => {
        const on = isRow ? i === k : j === k, sign = (i + j) % 2 === 0 ? "+" : "−";
        el("rect", { x: X + j * W, y: Y + i * H, width: W - 4, height: H - 4, class: on ? "lc" : "lk" }, g);
        txt(g, X + j * W + 25, Y + i * H + 24, frac(v), "s", "middle").setAttribute("style", MONO + ";font-size:14px");
        txt(g, X + j * W + 44, Y + i * H + 12, sign, on ? "tc" : "s", "middle").setAttribute("style", "font-size:10px");
      }));
      const terms = [0, 1, 2].map((m) => { const i = isRow ? k : m, j = isRow ? m : k, s = (i + j) % 2 === 0 ? 1 : -1; return { a: A[i][j], s, d: minor(i, j), i, j }; });
      let y = 60, sum = 0;
      terms.forEach((t) => { const val = t.a * t.s * t.d; sum += val; txt(g, 230, y, t.a === 0 ? `0 · det A${t.i + 1}${t.j + 1} = 0 (성분이 0)` : `${t.s > 0 ? "+" : "−"}${frac(t.a)} · det A${t.i + 1}${t.j + 1} = ${t.s > 0 ? "+" : "−"}${frac(t.a)}·(${frac(t.d)}) = ${frac(val)}`, t.a === 0 ? "s" : "tc", "start").setAttribute("style", MONO + ";font-size:12px"); y += 26; });
      txt(g, 230, y + 10, `합 = ${frac(sum)}`, "s", "start").setAttribute("style", MONO + ";font-size:14px");
      const zeros = terms.filter((t) => t.a === 0).length;
      read.textContent = `${["첫째", "둘째", "셋째"][k]} ${isRow ? "행" : "열"}로 전개하면 세 항의 합이 ${frac(sum)}이다. 어느 줄로 해도 같고, 0이 ${zeros}개인 이 줄에서는 계산할 소행렬식이 ${3 - zeros}개뿐이다.`;
    });
  });

  // 5.3 넓이의 배율: (1 − s)I + sA가 원과 정사각형을 바꾸는 모습
  Q.def("m1-detscale", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(-4, 4, -4, 4, 70, 290, 15, 235);
    Q.bind(fig, ({ s }) => {
      clear(g);
      plane(g, F);
      const M = [[1 - s + 2 * s, s], [s, 1 - s + 3 * s]], D = M[0][0] * M[1][1] - M[0][1] * M[1][0];
      const ap = (p) => [M[0][0] * p[0] + M[0][1] * p[1], M[1][0] * p[0] + M[1][1] * p[1]];
      const circ = Array.from({ length: 73 }, (_, i) => { const a = (i * Math.PI) / 36; return [Math.cos(a), Math.sin(a)]; });
      poly(g, F, circ, "lk"); poly(g, F, circ.map(ap), "lb");
      para(g, F, ap([1, 0]), ap([0, 1]), "la");
      txt(g, 320, 60, `det = ${num(D, 3)}`, "s", "start").setAttribute("style", MONO + ";font-size:15px");
      txt(g, 320, 90, `정사각형 넓이 1 → ${num(D, 3)}`, "ta", "start");
      txt(g, 320, 115, `원 넓이 π → ${num(D, 3)}π`, "tb", "start");
      read.textContent = `행렬 (${num(M[0][0], 2)} ${num(M[0][1], 2)}; ${num(M[1][0], 2)} ${num(M[1][1], 2)})은 모든 도형의 넓이를 ${num(D, 3)}배 한다. s = 1이면 A = (2 1; 1 3)이고, 단위원은 넓이 5π인 타원이 된다.`;
    }, (k, v) => num(v, 2));
  });

  // 5.4 크라머 공식: 해는 두 넓이의 비
  Q.def("m1-cramer", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(-1, 6, -1, 5, 20, 300, 12, 238);
    const a1 = [2, 1], a2 = [1, 3];
    Q.bind(fig, ({ b1, b2 }) => {
      clear(g);
      plane(g, F);
      const b = [b1, b2], D = det2(a1, a2), D1 = det2(b, a2), x1 = D1 / D, x2 = det2(a1, b) / D;
      para(g, F, a1, a2, "la"); para(g, F, b, a2, "lc");
      g.lastChild.setAttribute("style", "fill-opacity:.55");
      vec(g, F, a1[0], a1[1], "a", "a₁"); vec(g, F, a2[0], a2[1], "a", "a₂"); vec(g, F, b[0], b[1], "c", "b");
      txt(g, 320, 60, `det A = ${num(D, 2)}`, "ta", "start"); txt(g, 320, 85, `det A₁(b) = ${num(D1, 2)}`, "tc", "start");
      txt(g, 320, 115, `x₁ = ${num(D1, 2)} / ${num(D, 2)} = ${num(x1, 3)}`, "s", "start").setAttribute("style", MONO);
      txt(g, 320, 140, `x₂ = ${num(x2, 3)}`, "s", "start").setAttribute("style", MONO);
      read.textContent = `b = x₁a₁ + x₂a₂로 쓰면 x₁ = ${num(x1, 3)}이다. 평행사변형 (b, a₂)(주황)의 넓이는 (x₁a₁, a₂)의 넓이와 같으므로(a₂의 배수는 넓이를 바꾸지 않음) det A의 x₁배이다.`;
    });
  });

  // 5.5 대각합과 행렬식은 기저를 돌려도 그대로
  Q.def("m1-trace", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const A = [[2, 1], [0, 3]];
    Q.bind(fig, ({ p }) => {
      clear(g);
      const f = (p * Math.PI) / 180, c = Math.cos(f), s = Math.sin(f);
      const P = [[c, -s], [s, c]], Pi = [[c, s], [-s, c]];
      const mul = (X, Y) => [[X[0][0] * Y[0][0] + X[0][1] * Y[1][0], X[0][0] * Y[0][1] + X[0][1] * Y[1][1]], [X[1][0] * Y[0][0] + X[1][1] * Y[1][0], X[1][0] * Y[0][1] + X[1][1] * Y[1][1]]];
      const B = mul(Pi, mul(A, P)), tr = B[0][0] + B[1][1], D = B[0][0] * B[1][1] - B[0][1] * B[1][0];
      mat(g, 40, 50, A, { w: 60, name: "A" });
      mat(g, 220, 50, B.map((r) => r.map((v) => num(v, 3))), { w: 70, name: `P⁻¹AP (기저를 ${p}° 돌림)`, cls: (i, j) => (i === j ? "la" : "lk") });
      txt(g, 40, 160, "tr A = 2 + 3 = 5,  det A = 6", "s", "start").setAttribute("style", MONO);
      txt(g, 220, 160, `tr = ${num(B[0][0], 3)} + ${num(B[1][1], 3)} = ${num(tr, 3)}`, "ta", "start").setAttribute("style", MONO);
      txt(g, 220, 185, `det = ${num(D, 3)}`, "s", "start").setAttribute("style", MONO);
      read.textContent = `기저를 ${p}° 돌리면 행렬의 네 성분이 모두 바뀌지만, 대각성분의 합(파랑)은 늘 ${num(tr, 3)}, 행렬식은 늘 ${num(D, 3)}이다. 둘은 고유값 2와 3의 합과 곱이다.`;
    }, (k, v) => `${v}°`);
  });

  // 부호 붙은 계수: + 4, − 4
  const sg = (x, d) => `${x < 0 ? "−" : "+"} ${num(Math.abs(x), d == null ? 2 : d)}`;
  const apply = (M, v) => [M[0][0] * v[0] + M[0][1] * v[1], M[1][0] * v[0] + M[1][1] * v[1]];

  // 6.1 v를 돌리며 Av가 v와 같은 직선에 놓이는 순간 찾기
  Q.def("m1-eigen", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(-4.5, 4.5, -3.2, 3.2, 20, 360, 12, 238);
    const M = [[[4, -2], [1, 1]], [[0, -1], [1, 0]], [[1, 0], [0, -1]]], N = ["A = (4 −2; 1 1)", "90° 회전", "x축 대칭"];
    Q.bind(fig, ({ m, t }) => {
      clear(g);
      plane(g, F);
      const A = M[m], th = (t * Math.PI) / 180, v = [Math.cos(th), Math.sin(th)], Av = apply(A, v);
      const cross = v[0] * Av[1] - v[1] * Av[0], lam = v[0] * Av[0] + v[1] * Av[1], hit = Math.abs(cross) < 0.06;
      Q.plot(g, F, (x) => Math.sqrt(Math.max(0, 1 - x * x)), "gd", -1, 1, 100); Q.plot(g, F, (x) => -Math.sqrt(Math.max(0, 1 - x * x)), "gd", -1, 1, 100);
      if (hit) Q.line(clipG(g, svg, F), F.x(-6 * v[0]), F.y(-6 * v[1]), F.x(6 * v[0]), F.y(6 * v[1]), "d dsh");
      vec(g, F, v[0], v[1], "a", "v"); vec(g, F, Av[0], Av[1], "c", "Av");
      txt(g, 380, 40, N[m], "s", "start");
      txt(g, 380, 70, hit ? `고유벡터! λ ≈ ${num(lam, 2)}` : "v와 Av가 다른 직선", hit ? "td" : "s", "start");
      read.textContent = hit ? `θ = ${t}°에서 Av가 v와 같은 직선 위에 놓인다. v는 고유벡터이고 배율 λ ≈ ${num(lam, 2)}가 고유값이다.` : (m == 1 ? "회전은 어떤 v도 같은 직선에 남기지 않는다. 특성다항식 λ² + 1에 실근이 없다." : `θ = ${t}°: Av는 v와 다른 방향이다. v를 돌려 Av가 v와 겹치는 각을 찾아보라.`);
    }, (k, v) => (k === "t" ? `${v}°` : num(v)));
  });

  // 6.2 고유값이 다른 두 고유벡터를 섞으면 A가 배율을 따로 곱해 방향이 어긋난다
  Q.def("m1-indep", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(-3, 13, -2, 8, 20, 360, 12, 238), A = [[4, -2], [1, 1]];
    Q.bind(fig, ({ c1, c2 }) => {
      clear(g);
      plane(g, F);
      const v1 = [1, 1], v2 = [2, 1], w = [c1 * v1[0] + c2 * v2[0], c1 * v1[1] + c2 * v2[1]], Aw = apply(A, w);
      vec(g, F, c1 * v1[0], c1 * v1[1], "a dsh"); vec(g, F, c2 * v2[0], c2 * v2[1], "c dsh", null, [c1 * v1[0], c1 * v1[1]]);
      vec(g, F, w[0], w[1], "b", "w"); vec(g, F, Aw[0], Aw[1], "d", "Aw");
      const cross = w[0] * Aw[1] - w[1] * Aw[0];
      txt(g, 380, 40, "v₁ = (1, 1), λ = 2", "ta", "start"); txt(g, 380, 62, "v₂ = (2, 1), λ = 3", "tc", "start");
      txt(g, 380, 100, `w = ${num(c1, 1)}v₁ + ${num(c2, 1)}v₂`, "tb", "start"); txt(g, 380, 122, `Aw = ${num(2 * c1, 1)}v₁ + ${num(3 * c2, 1)}v₂`, "td", "start");
      read.textContent = Math.abs(cross) < 1e-6 ? "한 계수가 0이면 w는 한 고유벡터의 배수라 Aw도 같은 직선에 있다." : "두 계수가 모두 0이 아니면 A가 v₁ 성분은 2배, v₂ 성분은 3배 하므로 Aw는 w와 다른 방향이다. 그래서 v₂를 v₁의 배수로 흉내 낼 수 없다.";
    });
  });

  // 6.3 대수적 중복도와 기하적 중복도
  Q.def("m1-diag", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(-4, 4, -3, 3, 20, 330, 12, 238);
    const M = [[[3, 0], [0, 3]], [[3, 1], [0, 3]], [[3, 0], [0, 1]]];
    const S = [
      ["3I", "고유값 3 하나(대수적 중복도 2), 고유공간은 평면 전체(기하적 중복도 2). 이미 대각행렬이다."],
      ["(3 1; 0 3)", "고유값 3(대수적 중복도 2)인데 고유공간은 x축뿐(기하적 중복도 1). 고유벡터 기저를 만들 수 없어 대각화가 안 된다."],
      ["(3 0; 0 1)", "서로 다른 고유값 3, 1이 고유벡터를 하나씩 주어 기저가 생긴다. 대각화된다."],
    ];
    Q.bind(fig, ({ m, t }) => {
      clear(g);
      plane(g, F);
      const A = M[m], th = (t * Math.PI) / 180, v = [1.2 * Math.cos(th), 1.2 * Math.sin(th)], Av = apply(A, v), cg = clipG(g, svg, F);
      if (m == 0) el("rect", { x: F.X0, y: F.Y0, width: F.X1 - F.X0, height: F.Y1 - F.Y0, class: "lb" }, cg).setAttribute("style", "fill-opacity:.3");
      else { Q.line(cg, F.X0, F.y(0), F.X1, F.y(0), "b").setAttribute("style", "stroke-width:3"); if (m == 2) Q.line(cg, F.x(0), F.Y0, F.x(0), F.Y1, "b").setAttribute("style", "stroke-width:3"); }
      vec(g, F, v[0], v[1], "a", "v"); vec(g, F, Av[0], Av[1], "c", "Av");
      txt(g, 350, 40, S[m][0], "s", "start");
      txt(g, 350, 70, `m_a(3) = ${m == 2 ? 1 : 2}, m_g(3) = ${m == 1 ? 1 : m == 0 ? 2 : 1}`, "tb", "start");
      read.textContent = `${S[m][0]}: ${S[m][1]} 청록이 고유공간이다.`;
    }, (k, v) => (k === "t" ? `${v}°` : num(v)));
  });

  // 6.4 피보나치 벡터가 가장 큰 고유값의 고유벡터 방향으로 돌아선다
  Q.def("m1-fib", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(-0.3, 1.2, -0.3, 1.2, 40, 260, 12, 232), phi = (1 + Math.sqrt(5)) / 2;
    Q.bind(fig, ({ n }) => {
      clear(g);
      plane(g, F, 0.5);
      Q.plot(g, F, (x) => Math.sqrt(Math.max(0, 1 - x * x)), "gd", 0, 1, 100);
      const e = [phi, 1].map((c) => c / Math.hypot(phi, 1));
      Q.line(g, F.x(0), F.y(0), F.x(1.15 * e[0]), F.y(1.15 * e[1]), "d dsh"); txt(g, F.x(1.15 * e[0]), F.y(1.15 * e[1]) - 4, "(φ, 1)", "td", "start");
      let a = 1, b = 0; const pts = [];
      for (let k = 0; k <= n; k++) { const r = Math.hypot(a, b); pts.push([a / r, b / r]); [a, b] = [a + b, a]; }
      pts.forEach((p, k) => Q.dot(g, F.x(p[0]), F.y(p[1]), k === n ? "fc" : "fa", k === n ? 5 : 3));
      let F1 = 1, F0 = 0; for (let k = 0; k < n; k++) [F1, F0] = [F1 + F0, F1];
      txt(g, 290, 60, `n = ${n}`, "s", "start");
      txt(g, 290, 90, `(F${n + 1}, F${n}) = (${F1}, ${F0})`, "s", "start").setAttribute("style", MONO);
      txt(g, 290, 120, n > 0 ? `F${n + 1}/F${n} = ${num(F1 / F0, 6)}` : "", "tc", "start");
      txt(g, 290, 150, `φ = ${num(phi, 6)}`, "td", "start");
      read.textContent = `Aⁿ(1, 0) = (F${n + 1}, F${n})의 방향(점, 길이를 1로 맞춤)이 n을 늘릴수록 고유벡터 (φ, 1) 쪽으로 돌아선다. 다른 고유값 ψ의 성분이 (ψ/φ)ⁿ 비율로 사라지기 때문이다.`;
    });
  });

  // 7.1 코시-슈바르츠: ‖u − tv‖²는 0 아래로 내려가지 않는 포물선
  Q.def("m1-cs", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(-2.6, 2.6, -2.2, 2.6, 20, 230, 15, 225), G = Q.frame(-1, 3, -0.5, 6, 280, 505, 15, 225);
    Q.bind(fig, ({ t }) => {
      clear(g);
      plane(g, F);
      const th = (t * Math.PI) / 180, u = [2, 0.5], v = [1.2 * Math.cos(th), 1.2 * Math.sin(th)];
      const uv = u[0] * v[0] + u[1] * v[1], uu = u[0] * u[0] + u[1] * u[1], vv = v[0] * v[0] + v[1] * v[1], ts = uv / vv;
      vec(g, F, u[0], u[1], "a", "u"); vec(g, F, v[0], v[1], "c", "v");
      vec(g, F, ts * v[0], ts * v[1], "b dsh"); Q.line(g, F.x(u[0]), F.y(u[1]), F.x(ts * v[0]), F.y(ts * v[1]), "d dsh");
      Q.line(g, G.X0, G.y(0), G.X1, G.y(0), "ax"); Q.line(g, G.x(0), G.Y0, G.x(0), G.Y1, "ax");
      [-1, 1, 2, 3].forEach((x) => txt(g, G.x(x), G.y(0) + 14, num(x), "s", "middle")); txt(g, G.X1 - 4, G.y(0) - 6, "t", "i", "end");
      Q.plot(g, G, (s) => uu - 2 * s * uv + s * s * vv, "a", -1, 3, 200);
      const m = uu - uv * uv / vv;
      Q.dot(g, G.x(ts), G.y(m), "fd", 4);
      txt(g, G.X0 + 6, G.Y0 + 12, "‖u − tv‖²", "ta", "start");
      read.textContent = `⟨u, v⟩ = ${num(uv, 3)}, ‖u‖‖v‖ = ${num(Math.sqrt(uu * vv), 3)}. 포물선 ‖u − tv‖²의 최솟값 ${num(m, 3)}(빨강)은 u에서 v의 직선까지 거리의 제곱이라 0 이상이고, 그래서 판별식이 0 이하, 곧 |⟨u, v⟩| ≤ ‖u‖‖v‖이다. 두 벡터가 같은 직선에 놓이면 최솟값이 0이 된다.`;
    }, (k, v) => `${v}°`);
  });

  // 7.2 그람-슈미트: w₂에서 v₁ 방향 성분을 빼면 v₁과 수직
  Q.def("m1-gs", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(-3, 4, -1.5, 3.5, 30, 360, 15, 235);
    Q.bind(fig, ({ t }) => {
      clear(g);
      plane(g, F);
      const th = (t * Math.PI) / 180, w1 = [2.5, 0.8], w2 = [2.5 * Math.cos(th), 2.5 * Math.sin(th)];
      const c = (w2[0] * w1[0] + w2[1] * w1[1]) / (w1[0] * w1[0] + w1[1] * w1[1]), p = [c * w1[0], c * w1[1]], v2 = [w2[0] - p[0], w2[1] - p[1]];
      vec(g, F, w1[0], w1[1], "a", "v₁ = w₁"); vec(g, F, w2[0], w2[1], "k", "w₂");
      vec(g, F, p[0], p[1], "c dsh", "정사영"); vec(g, F, v2[0], v2[1], "b", "v₂", [0, 0]);
      Q.line(g, F.x(p[0]), F.y(p[1]), F.x(w2[0]), F.y(w2[1]), "b dsh");
      const dot = v2[0] * w1[0] + v2[1] * w1[1];
      txt(g, 380, 60, `⟨w₂, v₁⟩/‖v₁‖² = ${num(c, 3)}`, "tc", "start");
      txt(g, 380, 90, `⟨v₂, v₁⟩ = ${num(Math.abs(dot) < 1e-9 ? 0 : dot, 6)}`, "tb", "start");
      read.textContent = `w₂에서 v₁ 방향의 정사영 ${num(c, 3)}v₁(주황)을 빼면 v₂(청록)가 남고, v₂는 언제나 v₁과 수직이다. w₂를 돌려도 span{v₁, v₂} = span{w₁, w₂}는 그대로이다.`;
    }, (k, v) => `${v}°`);
  });

  // 7.3 최소제곱 직선: 잔차 제곱합이 가장 작은 직선
  Q.def("m1-lsq", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(-0.5, 3.5, -0.5, 5, 50, 330, 15, 230), P = [[0, 1], [1, 1], [2, 2], [3, 4]];
    Q.bind(fig, ({ a, b }) => {
      clear(g);
      plane(g, F);
      const res = (c0, c1) => P.reduce((s, [x, y]) => s + (y - c0 - c1 * x) ** 2, 0);
      Q.plot(g, F, (x) => 0.5 + x, "a dsh", -0.5, 3.5, 2);
      Q.plot(g, F, (x) => a + b * x, "c", -0.5, 3.5, 2);
      P.forEach(([x, y]) => { Q.line(g, F.x(x), F.y(y), F.x(x), F.y(a + b * x), "d"); Q.dot(g, F.x(x), F.y(y), "fk", 4); });
      txt(g, 350, 60, `y = ${num(a, 2)} + ${num(b, 2)}x`, "tc", "start");
      txt(g, 350, 85, `잔차 제곱합 ${num(res(a, b), 3)}`, "td", "start");
      txt(g, 350, 120, "최소제곱 y = 0.5 + x", "ta", "start");
      txt(g, 350, 145, "잔차 제곱합 1", "ta", "start");
      read.textContent = `직선 y = ${num(a, 2)} + ${num(b, 2)}x(주황)의 잔차(빨강) 제곱합은 ${num(res(a, b), 3)}이다. 어떻게 움직여도 최소제곱 직선 y = 0.5 + x(파랑 점선)의 1보다 작아지지 않는다.`;
    });
  });

  // 7.4 이차형식 x² + 4xy − y²의 등위선과 단위벡터에서의 값
  Q.def("m1-quad", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(-2.5, 2.5, -2, 2, 60, 340, 12, 236);
    Q.bind(fig, ({ t }) => {
      clear(g);
      plane(g, F);
      const cg = clipG(g, svg, F), q = (x, y) => x * x + 4 * x * y - y * y;
      // 등위선 q = ±1: 극좌표 r² = ±1 / q(cos, sin)
      [1, -1].forEach((lev) => {
        let seg = [];
        const flush = () => { if (seg.length > 1) poly(cg, F, seg, lev > 0 ? "a" : "c", true).setAttribute("style", "fill:none"); seg = []; };
        for (let i = 0; i <= 720; i++) { const a = (i * Math.PI) / 360, d = q(Math.cos(a), Math.sin(a)); if (d * lev > 0.02) { const r = Math.sqrt(lev / d); seg.push([r * Math.cos(a), r * Math.sin(a)]); } else flush(); }
        flush();
      });
      const th = (t * Math.PI) / 180, v = [Math.cos(th), Math.sin(th)], val = q(v[0], v[1]);
      vec(g, F, v[0], v[1], val >= 0 ? "a" : "c", "v");
      txt(g, 360, 50, "q(x, y) = x² + 4xy − y²", "s", "start");
      txt(g, 360, 80, `q(v) = ${num(val, 3)}`, val >= 0 ? "ta" : "tc", "start");
      txt(g, 360, 120, "파랑 q = 1, 주황 q = −1", "s", "start");
      read.textContent = `단위벡터 v의 방향에 따라 q(v)가 ${num(val, 3)}처럼 양수도 음수도 된다. 등위선 q = ±1은 쌍곡선이고, 교차항 4xy 때문에 축이 기울어 있다. 행렬은 대칭인 (1 2; 2 −1)로 쓴다.`;
    }, (k, v) => `${v}°`);
  });

  // 8.1 실계수 다항식 (x − 1)(x² + bx + 1)의 근은 실수축에 대칭
  Q.def("m1-roots", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(-3.2, 3.2, -1.8, 1.8, 30, 330, 15, 230);
    Q.bind(fig, ({ b }) => {
      clear(g);
      plane(g, F, 1);
      txt(g, F.X1 - 2, F.y(0) - 5, "Re", "i", "end"); txt(g, F.x(0) + 5, F.Y0 + 10, "Im", "i");
      const D = b * b - 4, R = [[1, 0]];
      if (D >= 0) R.push([(-b + Math.sqrt(D)) / 2, 0], [(-b - Math.sqrt(D)) / 2, 0]);
      else R.push([-b / 2, Math.sqrt(-D) / 2], [-b / 2, -Math.sqrt(-D) / 2]);
      if (D < 0) Q.line(g, F.x(-b / 2), F.y(Math.sqrt(-D) / 2), F.x(-b / 2), F.y(-Math.sqrt(-D) / 2), "c dsh");
      R.forEach(([x, y], i) => Q.dot(g, F.x(x), F.y(y), i === 0 || D >= 0 ? "fa" : "fc", 6));
      txt(g, 350, 50, "p(x) = (x − 1)(x² + bx + 1)", "s", "start");
      txt(g, 350, 80, D >= 0 ? "실근 셋: 일차식 셋의 곱" : "실근 하나 + 켤레 복소근 한 쌍", D >= 0 ? "ta" : "tc", "start");
      txt(g, 350, 105, D >= 0 ? "" : "→ 일차식 × 실계수 이차식", "tc", "start");
      read.textContent = D >= 0 ? `b = ${num(b, 2)}이면 x² + bx + 1의 판별식이 ${num(D, 2)} ≥ 0이라 근이 모두 실수이고, p는 실수 범위에서 일차식 셋의 곱이다.` : `b = ${num(b, 2)}이면 x² + bx + 1의 근이 ${num(-b / 2, 2)} ± ${num(Math.sqrt(-D) / 2, 2)}i로 켤레 짝을 이룬다. 짝 하나를 묶으면 실계수 이차식 x² ${sg(b)}x + 1이 되어 실수 범위에서는 더 쪼개지지 않는다.`;
    }, (k, v) => num(v, 2));
  });

  // 8.2 v, Tv, T²v는 2차원에서 종속: 그 관계식이 고유값을 준다
  Q.def("m1-krylov", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(-4.5, 4.5, -3.2, 3.2, 20, 330, 12, 238);
    const M = [[[2, 1], [1, 2]], [[0, -1], [1, 1]]];
    Q.bind(fig, ({ m, t }) => {
      clear(g);
      plane(g, F);
      const T = M[m], th = (t * Math.PI) / 180, v = [Math.cos(th), Math.sin(th)], Tv = apply(T, v), T2v = apply(T, Tv);
      vec(g, F, v[0], v[1], "a", "v"); vec(g, F, Tv[0], Tv[1], "c", "Tv"); vec(g, F, T2v[0], T2v[1], "b", "T²v");
      // T²v = −a₀v − a₁Tv 를 푼다
      const det = v[0] * Tv[1] - v[1] * Tv[0];
      if (Math.abs(det) > 1e-6) {
        const a0 = -(T2v[0] * Tv[1] - T2v[1] * Tv[0]) / det, a1 = -(v[0] * T2v[1] - v[1] * T2v[0]) / det;
        const disc = a1 * a1 - 4 * a0;
        const rs = disc >= 0 ? `${num((-a1 + Math.sqrt(disc)) / 2, 2)}, ${num((-a1 - Math.sqrt(disc)) / 2, 2)}` : `${num(-a1 / 2, 2)} ± ${num(Math.sqrt(-disc) / 2, 2)}i`;
        txt(g, 345, 50, `T²v ${sg(a1)}Tv ${sg(a0)}v = 0`, "s", "start").setAttribute("style", MONO + ";font-size:12px");
        txt(g, 345, 80, `다항식 z² ${sg(a1)}z ${sg(a0)}`, "s", "start");
        txt(g, 345, 105, `근: ${rs}`, "td", "start");
        read.textContent = `2차원에서 세 벡터 v, Tv, T²v는 반드시 종속이라 T²v ${sg(a1)}Tv ${sg(a0)}v = 0이 된다. 다항식 z² ${sg(a1)}z ${sg(a0)}의 근은 ${rs}이고, 이것이 T의 고유값이다. ` + (m == 1 ? "실근이 없으면 복소수에서 고유값을 얻는다." : "");
      } else read.textContent = "v가 고유벡터라 Tv가 v와 같은 직선에 놓였다. 이때는 v, Tv 두 벡터에서 이미 종속 관계가 나와 고유값이 바로 보인다.";
    }, (k, v) => (k === "t" ? `${v}°` : num(v)));
  });

  // 8.3 불변 직선: 상삼각행렬의 첫 기저 벡터의 생성
  Q.def("m1-uppertri", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(-4.5, 4.5, -3.2, 3.2, 20, 330, 12, 238), T = [[2, 1], [0, 3]];
    Q.bind(fig, ({ t }) => {
      clear(g);
      plane(g, F);
      Q.line(g, F.X0, F.y(0), F.X1, F.y(0), "b").setAttribute("style", "stroke-width:3");
      const th = (t * Math.PI) / 180, v = [Math.cos(th), Math.sin(th)], Tv = apply(T, v), inV1 = Math.abs(v[1]) < 1e-6;
      vec(g, F, v[0], v[1], "a", "v"); vec(g, F, Tv[0], Tv[1], "c", "Tv");
      mat(g, 360, 50, T, { w: 46, name: "[T]", cls: (i, j) => (i === j ? "la" : "lk") });
      txt(g, 345, 150, "청록: V₁ = span{e₁}", "tb", "start");
      read.textContent = inV1 ? "v가 V₁ 위에 있으면 Tv = 2v도 V₁ 위에 있다. 첫째 열이 (2, 0)인 것이 이것이며, 대각성분 2가 고유값이다." : `v가 V₁ 밖에 있으면 Tv는 V₁에 갇히지 않지만, V₁ 위의 벡터는 언제나 V₁으로 간다(불변). 그래서 [T]의 첫째 열 아래가 0이고 대각성분 2, 3이 고유값이다.`;
    }, (k, v) => `${v}°`);
  });

  // 9.1 복소 고유벡터의 실수부와 허수부가 만드는 불변 평면에서의 궤도
  Q.def("m1-complexify", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(-3, 3, -2.2, 2.2, 20, 330, 12, 238), T = [[1, -2], [1, -1]];
    Q.bind(fig, ({ k }) => {
      clear(g);
      plane(g, F);
      // T의 고유값 ±i, 고유벡터 (1 + i, 1) = u + iw, u = (1, 1), w = (1, 0)
      vec(g, F, 1, 1, "a", "u"); vec(g, F, 1, 0, "c", "w");
      let p = [1.5, 0.5]; const pts = [p];
      for (let i = 0; i < k; i++) { p = apply(T, p); pts.push(p); }
      line(g, F, pts, "b");
      pts.forEach((q, i) => Q.dot(g, F.x(q[0]), F.y(q[1]), i === k ? "fd" : "fb", i === k ? 5 : 3));
      read.textContent = `T = (1 −2; 1 −1)은 실고유값이 없고 복소 고유값 ±i, 고유벡터 u + iw = (1, 1) + i(1, 0)을 가진다. 점에 T를 ${k}번 곱하면 u, w가 만드는 평면 안에서 돌기만 하며, T⁴ = I라 네 번에 제자리로 온다.`;
    });
  });

  // 9.2 정규인 2×2 블록은 원을 원으로, 아닌 블록은 타원으로
  Q.def("m1-normal", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(-2.6, 2.6, -2, 2, 20, 330, 12, 238);
    Q.bind(fig, ({ n, t }) => {
      clear(g);
      plane(g, F);
      const th = (t * Math.PI) / 180, r = 1.3, a = r * Math.cos(th), b = r * Math.sin(th);
      const M = n == 0 ? [[a, -b], [b, a]] : [[a, -b + 1], [b, a]];
      const circ = Array.from({ length: 73 }, (_, i) => { const s = (i * Math.PI) / 36; return [Math.cos(s), Math.sin(s)]; });
      poly(g, F, circ, "lk"); poly(g, F, circ.map((q) => apply(M, q)), n == 0 ? "la" : "lc");
      const e1 = apply(M, [1, 0]); vec(g, F, e1[0], e1[1], "k", "Te₁");
      const MtM = [[M[0][0] * M[0][0] + M[1][0] * M[1][0], M[0][0] * M[0][1] + M[1][0] * M[1][1]], [0, M[0][1] * M[0][1] + M[1][1] * M[1][1]]];
      const MMt = [[M[0][0] * M[0][0] + M[0][1] * M[0][1], M[0][0] * M[1][0] + M[0][1] * M[1][1]], [0, M[1][0] * M[1][0] + M[1][1] * M[1][1]]];
      const normal = Math.abs(MtM[0][0] - MMt[0][0]) < 1e-9 && Math.abs(MtM[0][1] - MMt[0][1]) < 1e-9;
      mat(g, 350, 50, M.map((row) => row.map((x) => num(x, 2))), { w: 62, name: "[T]" });
      txt(g, 345, 150, normal ? "TᵀT = TTᵀ (정규)" : "TᵀT ≠ TTᵀ", normal ? "ta" : "td", "start");
      read.textContent = normal ? `(a −b; b a) 꼴은 각 ${t}°만큼 돌리고 ${num(r, 1)}배 늘인다. 단위원이 원으로 가며, 이것이 실정규작용소의 2×2 블록이다.` : "오른쪽 위 성분에 1을 더하면 정규가 아니게 되어 단위원이 찌그러진 타원이 된다. 이런 행렬은 정규직교기저로 블록 대각화되지 않는다.";
    }, (k, v) => (k === "t" ? `${v}°` : num(v)));
  });

  // ── 새 그림은 이 위에 ──
})();
