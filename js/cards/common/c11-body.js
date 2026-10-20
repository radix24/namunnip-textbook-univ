/* 공통11(전자계산 2) 본문 카드의 조작 그림 (js/lib/qfig.js의 NMQ를 쓴다). 그림마다 NMQ.def("이름", …). */
(() => {
  "use strict";
  const Q = window.NMQ;
  if (!Q) return;
  const { el, clear, txt, num } = Q;
  const PI = Math.PI;
  const MONO = "font-family:var(--f-mono, monospace)";
  const rect = (g, F, x0, y0, x1, y1, cls) => el("rect", { x: Math.min(F.x(x0), F.x(x1)), y: Math.min(F.y(y0), F.y(y1)), width: Math.abs(F.x(x1) - F.x(x0)), height: Math.abs(F.y(y1) - F.y(y0)), class: cls }, g);
  const poly = (g, F, pts, cls, open) => el("path", { d: pts.map((p, i) => (i ? "L" : "M") + F.x(p[0]).toFixed(1) + " " + F.y(p[1]).toFixed(1)).join("") + (open ? "" : "Z"), class: cls }, g);
  const line = (g, F, pts, cls) => { if (pts.length > 1) poly(g, F, pts, cls, true).setAttribute("style", "fill:none"); };
  const axl = (g, F, xt, yt, xs, ys, xf, yf) => {
    Q.line(g, F.X0, F.Y1, F.X1, F.Y1, "ax"); Q.line(g, F.X0, F.Y1, F.X0, F.Y0, "ax");
    xt.forEach((v) => txt(g, F.x(v), F.Y1 + 14, xf ? xf(v) : num(v), "s", "middle"));
    yt.forEach((v) => txt(g, F.X0 - 5, F.y(v) + 4, yf ? yf(v) : num(v), "s", "end"));
    if (xs) txt(g, F.X1 - 4, F.Y1 - 6, xs, "i", "end");
    if (ys) txt(g, F.X0 + 6, F.Y0 + 12, ys, "i");
  };
  const mono = (g, x, y, s, cls, anc, size) => { const t = txt(g, x, y, s, cls || "s", anc || "start"); t.setAttribute("style", MONO + (size ? `;font-size:${size}px` : "") + ";white-space:pre"); return t; };
  // 칸 하나(글자 하나 또는 값 하나)
  const cell = (g, x, y, w, h, s, cls, size) => { el("rect", { x, y, width: w, height: h, class: cls || "lk" }, g); if (s !== "" && s != null) mono(g, x + w / 2, y + h / 2 + 4, String(s), "s", "middle", size); };
  const pow10 = (k) => { const s = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"]; return "10" + (k < 0 ? "⁻" : "") + String(Math.abs(k)).split("").map((c) => s[+c]).join(""); };
  const sci = (x, d) => { if (x === 0) return "0"; const e = Math.floor(Math.log10(Math.abs(x))), m = x / 10 ** e; return `${m.toFixed(d == null ? 1 : d)}×${pow10(e)}`; };
  // 씨앗을 정한 의사 난수 (mulberry32)
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  // 1.1 단정도와 배정도: 0.1을 N번 더한 합의 상대 오차
  Q.def("c11-prec", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(0, 6, -17, 0, 60, 500, 15, 210);
    const NS = Array.from({ length: 25 }, (_, k) => Math.round(10 ** (k / 4)));
    const sing = [], dbl = [];
    { let s = 0, d = 0, i = 0; const t = Math.fround(0.1);
      NS.forEach((N) => { for (; i < N; i++) { s = Math.fround(s + t); d += 0.1; } sing.push(s); dbl.push(d); }); }
    const le = (v, N) => { const e = Math.abs(v - N / 10) / (N / 10); return e > 0 ? Math.max(-17, Math.log10(e)) : -17; };
    Q.bind(fig, ({ k }) => {
      clear(g);
      for (let v = -16; v <= 0; v += 4) Q.line(g, F.X0, F.y(v), F.X1, F.y(v), "gd");
      axl(g, F, [0, 2, 4, 6], [-16, -12, -8, -4, 0], "N", "상대 오차", (v) => pow10(v), (v) => pow10(v));
      line(g, F, NS.map((N, j) => [j / 4, le(sing[j], N)]), "c");
      line(g, F, NS.map((N, j) => [j / 4, le(dbl[j], N)]), "a");
      Q.line(g, F.x(k / 4), F.Y0, F.x(k / 4), F.Y1, "k dsh");
      Q.dot(g, F.x(k / 4), F.y(le(sing[k], NS[k])), "fc"); Q.dot(g, F.x(k / 4), F.y(le(dbl[k], NS[k])), "fa");
      txt(g, F.x(5.9), F.y(le(sing[24], NS[24])) - 8, "단정도 real", "tc", "end");
      txt(g, F.x(5.9), F.y(-15.2), "배정도 real(dp)", "ta", "end");
      const N = NS[k];
      read.textContent = `0.1을 N = ${N}번 더하면 참값은 ${num(N / 10, 1)}이다. 단정도 합은 ${sing[k].toPrecision(9)}, 배정도 합은 ${dbl[k].toPrecision(17)}이다. 단정도는 유효숫자가 약 7자리라 더할수록 오차가 쌓여 커진다.`;
    }, (k, v) => String(Math.round(10 ** (v / 4))));
  });

  // 1.2 고정점 반복 x(k+1) = cos x(k)의 거미줄 그림
  Q.def("c11-cobweb", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(0, 1.15, 0, 1.15, 150, 380, 10, 240);
    Q.bind(fig, ({ k }) => {
      clear(g);
      axl(g, F, [0, 0.5, 1], [0.5, 1], "x", "y");
      Q.plot(g, F, (x) => x, "gd", 0, 1.15); Q.plot(g, F, Math.cos, "a", 0, 1.15);
      txt(g, F.x(1.12), F.y(1.08), "y = x", "s", "end"); txt(g, F.x(1.12), F.y(Math.cos(1.12)) - 8, "y = cos x", "ta", "end");
      let x = 1; const pts = [[x, 0]];
      for (let j = 0; j < k; j++) { const y = Math.cos(x); pts.push([x, y], [y, y]); x = y; }
      line(g, F, pts, "c");
      Q.dot(g, F.x(x), F.y(0), "fc");
      txt(g, F.x(x), F.y(0) + 28, `x${k === 0 ? "₀" : ""}`, "tc", "middle");
      const prev = k > 0 ? (() => { let z = 1; for (let j = 0; j < k - 1; j++) z = Math.cos(z); return z; })() : null;
      read.textContent = k === 0 ? "시작값 x₀ = 1. 위로 올라가 곡선에서 cos x₀를 읽고, 옆으로 가 직선 y = x에서 그 값을 다음 x로 삼는다." : `${k}번 반복: x = ${x.toFixed(10)}, 고친 양 |xₖ − xₖ₋₁| = ${sci(Math.abs(x - prev), 1)}. 거미줄이 교점 0.7390851332… 둘레를 돌며 좁혀지고, 고친 양이 10⁻¹⁰ 아래가 되는 것은 58번째이다.`;
    });
  });

  // 1.3 열 우선과 행 우선: 메모리 순서
  Q.def("c11-order", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ o, p }) => {
      clear(g);
      const W = 62, H = 34, X = 40, Y = 30;
      const at = (q) => o == 0 ? [q % 3, Math.floor(q / 3)] : [Math.floor(q / 3), q % 3];
      const [pi, pj] = at(p);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
        const q = o == 0 ? j * 3 + i : i * 3 + j;
        cell(g, X + j * W, Y + i * H, W - 4, H - 4, `A(${i + 1},${j + 1})`, i === pi && j === pj ? "lc" : q < p ? "la" : "lk", 12);
      }
      const ctr = (q) => { const [i, j] = at(q); return [X + j * W + (W - 4) / 2, Y + i * H + (H - 4) / 2]; };
      for (let q = 0; q < p; q++) { const [a1, b1] = ctr(q), [a2, b2] = ctr(q + 1); Q.arrow(g, a1, b1 + 9, a2, b2 + 9, "c", "fc"); }
      txt(g, X + 3 * W + 30, Y + 20, o == 0 ? "포트란: 열 우선" : "C·NumPy: 행 우선", o == 0 ? "ta" : "tb", "start");
      txt(g, X + 3 * W + 30, Y + 44, o == 0 ? "첫째 인덱스 i가 가장 빨리 바뀐다" : "둘째 인덱스 j가 가장 빨리 바뀐다", "s", "start");
      txt(g, X, 158, "메모리 (주소가 커지는 쪽 →)", "s", "start");
      for (let q = 0; q < 9; q++) { const [i, j] = at(q); cell(g, X + q * 50, 168, 46, 30, `(${i + 1},${j + 1})`, q === p ? "lc" : q < p ? "la" : "lk", 11); }
      read.textContent = `메모리의 ${p + 1}번째 칸은 A(${pi + 1},${pj + 1})이다. ` + (o == 0 ? "포트란은 A(1,1), A(2,1), A(3,1), A(1,2) … 순서로 놓으므로, 안쪽 반복에 첫째 인덱스를 두면 메모리를 차례로 읽는다." : "C와 NumPy는 한 행을 먼저 다 놓으므로, 같은 반복문 순서를 그대로 옮기면 메모리를 건너뛰며 읽게 된다.");
    });
  });

  // 1.4 배열 범위 검사: a(11)에 쓰면?
  Q.def("c11-bounds", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ i, c }) => {
      clear(g);
      const W = 40, X = 20, Y = 70;
      for (let j = 1; j <= 10; j++) { cell(g, X + (j - 1) * W, Y, W - 3, 34, j <= i ? j * j : "", j === i ? "lc" : j <= i ? "la" : "lk", 12); txt(g, X + (j - 1) * W + 18, Y - 8, `a(${j})`, "s", "middle"); }
      const over = i === 11, stop = over && c == 1, hit = over && c == 0;
      cell(g, X + 10 * W + 8, Y, 52, 34, hit ? 121 : 7, hit ? "ld" : "lb", 12);
      txt(g, X + 10 * W + 34, Y - 8, "다른 변수", hit ? "td" : "tb", "middle");
      mono(g, X, 150, `do i = 1, 11    ! 지금 i = ${i}`, "s");
      mono(g, X, 172, `a(i) = i * i`, "s");
      if (stop) { el("rect", { x: X + 230, y: 135, width: 250, height: 52, class: "ld" }, g); txt(g, X + 240, 156, "실행 오류: 첨자 11이 상한 10을 넘음", "td", "start"); txt(g, X + 240, 177, "프로그램이 그 줄에서 멈춘다", "s", "start"); }
      read.textContent = !over ? `i = ${i}: a(${i})에 ${i * i}를 쓴다. 아직 배열 안이다.` : hit ? "검사 없이 컴파일하면 a(11) 자리, 곧 배열 바로 뒤의 메모리에 121을 써 버린다. 멈추지 않으므로 다른 변수가 망가진 것을 한참 뒤에야 알게 된다." : "-fcheck=bounds로 컴파일하면 a(11)에 쓰려는 순간 멈추고, 어느 줄의 어느 배열이 범위를 넘었는지 알려 준다.";
    });
  });

  // 2.1 참조에 의한 전달: 서브루틴의 인수 이름이 부른 쪽 변수를 가리킨다
  Q.def("c11-byref", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ s }) => {
      clear(g);
      const r = Math.SQRT2, th = PI / 4;
      el("rect", { x: 20, y: 30, width: 200, height: 150, class: "lk" }, g); txt(g, 30, 50, "program main", "s", "start");
      cell(g, 110, 70, 80, 32, s >= 2 ? r.toFixed(3) : "?", s === 2 ? "lc" : "la", 12); txt(g, 100, 91, "r", "s", "end");
      cell(g, 110, 125, 80, 32, s >= 3 ? th.toFixed(3) : "?", s === 3 ? "lc" : "la", 12); txt(g, 100, 146, "th", "s", "end");
      if (s >= 1 && s <= 3) {
        el("rect", { x: 300, y: 30, width: 200, height: 150, class: "lk" }, g); txt(g, 310, 50, "subroutine polar", "s", "start");
        mono(g, 330, 91, "r", "ta", "start"); mono(g, 330, 146, "theta", "ta", "start");
        Q.arrow(g, 324, 86, 194, 86, "a", "fa"); Q.arrow(g, 324, 141, 194, 141, "a", "fa");
        txt(g, 400, 172, s === 1 ? "intent(out): 쓸 자리를 받았다" : s === 2 ? "r = sqrt(x**2 + y**2)" : "theta = atan2(y, x)", "s", "middle");
      }
      mono(g, 20, 215, ["call 전", "call polar(1.0_dp, 1.0_dp, r, th)", "r에 쓰기", "theta에 쓰기", "돌아온 뒤 print *, r, th"][s], "s");
      read.textContent = ["서브루틴을 부르기 전에는 r과 th에 아직 값이 없다.", "부르면 값이 복사되지 않고, 서브루틴의 이름 r과 theta가 main의 r과 th 자리를 그대로 가리킨다.", "서브루틴이 r에 쓰면 main의 r 자리에 1.414가 들어간다.", "theta에 쓰면 main의 th 자리에 0.785가 들어간다. 이름은 달라도 같은 자리이다.", "서브루틴이 끝나도 main의 r과 th에는 1.414와 0.785가 남는다. C에서 포인터를 넘긴 것과 같은 효과이다."][s];
    });
  });

  // 2.2 형식 지정: 칸에 맞춰 찍기
  Q.def("c11-format", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const C = [
      ["I5", "42", "   42", "정수를 5칸에 오른쪽 맞춤으로 찍는다. 빈 칸은 앞에 공백으로 채운다."],
      ["F8.3", "3.14159", "   3.142", "8칸에 소수 셋째 자리까지 반올림해 찍는다. 소수점도 한 칸을 차지한다."],
      ["ES12.4", "0.000123", "  1.2300E-04", "과학적 표기로 가수의 소수 넷째 자리까지, 지수까지 모두 12칸에 찍는다."],
      ["F8.2", "300.15", "  300.15", "8칸이면 300.15(6칸)가 넉넉히 들어간다."],
      ["F4.1", "300.15", "****", "300.2는 5칸이 필요한데 4칸뿐이라 값 대신 별표를 찍는다. 출력에 별표가 보이면 칸을 늘린다."],
    ];
    Q.bind(fig, ({ f }) => {
      clear(g);
      const [fmt, val, out, say] = C[f];
      mono(g, 30, 45, `write(u, '(${fmt})')  ${val}`, "s", "start", 14);
      const W = 34;
      for (let i = 0; i < out.length; i++) { const ch = out[i]; cell(g, 30 + i * W, 80, W - 3, 40, ch === " " ? "" : ch, ch === "*" ? "ld" : ch === " " ? "lk" : "la", 15); txt(g, 30 + i * W + 15, 140, i + 1, "s", "middle"); }
      txt(g, 30, 175, `칸 ${out.length}개`, "s", "start");
      read.textContent = `${fmt}: ${say}`;
    });
  });

  // 3.1 근의 공식의 상쇄 오차: x² + bx + 1 = 0의 작은 근
  Q.def("c11-quadroot", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(0, 8, -17, 0.5, 60, 500, 15, 210);
    const naive = (b) => (-b + Math.sqrt(b * b - 4)) / 2, good = (b) => 1 / ((-b - Math.sqrt(b * b - 4)) / 2);
    const le = (b) => { const e = Math.abs(naive(b) - good(b)) / Math.abs(good(b)); return e > 0 ? Math.max(-17, Math.log10(e)) : -17; };
    Q.bind(fig, ({ k }) => {
      clear(g);
      for (let v = -16; v <= 0; v += 4) Q.line(g, F.X0, F.y(v), F.X1, F.y(v), "gd");
      axl(g, F, [0, 2, 4, 6, 8], [-16, -12, -8, -4, 0], "b", "상대 오차", (v) => pow10(v), (v) => pow10(v));
      const pts = []; for (let j = 0; j <= 160; j++) { const t = 0.4 + j * 7.6 / 160; pts.push([t, le(10 ** t)]); }
      line(g, F, pts, "c");
      Q.line(g, F.x(0.4), F.y(-16), F.X1, F.y(-16), "a");
      txt(g, F.x(7.9), F.y(-15.3), "근과 계수의 관계 x₁x₂ = c/a로 구한 작은 근", "ta", "end");
      txt(g, F.x(2.2), F.y(-6), "근의 공식 그대로", "tc", "start");
      const b = 10 ** k;
      Q.dot(g, F.x(k), F.y(le(b)), "fc");
      read.textContent = `b = ${pow10(k)}이면 작은 근은 약 −1/b이다. 근의 공식 그대로는 ${naive(b).toPrecision(10)}, 근과 계수의 관계로는 ${good(b).toPrecision(10)}이다. b가 클수록 −b와 √D가 거의 같아져 빼기에서 앞자리가 지워진다.`;
    }, (k, v) => pow10(v));
  });

  // 3.2 딕셔너리로 조별 모으기
  Q.def("c11-group", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const D = [["A", 9.71], ["B", 9.85], ["A", 9.78], ["B", 9.80], ["A", 9.83]];
    Q.bind(fig, ({ s }) => {
      clear(g);
      txt(g, 30, 30, "data", "s", "start");
      D.forEach(([t, v], i) => cell(g, 30, 40 + i * 36, 120, 30, `("${t}", ${v.toFixed(2)})`, i === s - 1 ? "lc" : i < s ? "la" : "lk", 12));
      const G = {}; D.slice(0, s).forEach(([t, v]) => (G[t] = G[t] || []).push(v));
      txt(g, 220, 30, "groups", "s", "start");
      Object.keys(G).sort().forEach((t, r) => {
        cell(g, 220, 40 + r * 70, 40, 30, `"${t}"`, "lb", 12);
        G[t].forEach((v, j) => cell(g, 270 + j * 60, 40 + r * 70, 56, 30, v.toFixed(2), D[s - 1][0] === t && j === G[t].length - 1 ? "lc" : "la", 12));
        if (s === 5) txt(g, 270, 92 + r * 70, `평균 ${num(G[t].reduce((a, b) => a + b, 0) / G[t].length, 3)} (${G[t].length}개)`, "ta", "start");
      });
      read.textContent = s === 0 ? "groups = {}로 빈 딕셔너리에서 시작한다." : s < 5 ? `${s}번째 ("${D[s - 1][0]}", ${D[s - 1][1]}): setdefault("${D[s - 1][0]}", [])가 그 조의 리스트를 꺼내고(없으면 새로 만들고) 값을 붙인다.` : "다 모았다. A는 3개 평균 9.773, B는 2개 평균 9.825이다.";
    });
  });

  // 3.3 브로드캐스팅: 크기 1인 축을 늘린다
  Q.def("c11-bcast", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ e, c }) => {
      clear(g);
      const W = 38, H = 28;
      const grid = (x0, y0, M, R, Cn, cls, hot, ghost) => { for (let i = 0; i < R; i++) for (let j = 0; j < Cn; j++) { const real = M[i] !== undefined && M[i][j] !== undefined; const v = real ? M[i][j] : ghost(i, j); cell(g, x0 + j * W, y0 + i * H, W - 3, H - 3, num(v, 1), hot(i, j) ? "lc" : real ? cls : "lk", 11); } };
      if (e == 0) {
        const x = [0, 1, 3], i0 = Math.floor(c / 3) % 3, j0 = c % 3;
        txt(g, 30, 30, "x[:, None]  (3,1)", "s", "start"); grid(30, 40, x.map((v) => [v]), 3, 3, "la", (i, j) => i === i0 && j === j0, (i) => x[i]);
        txt(g, 175, 107, "−", "s", "middle");
        txt(g, 200, 30, "x[None, :]  (1,3)", "s", "start"); grid(200, 40, [x], 3, 3, "lb", (i, j) => i === i0 && j === j0, (i, j) => x[j]);
        txt(g, 345, 107, "=", "s", "middle");
        txt(g, 370, 30, "결과 (3,3)", "s", "start"); grid(370, 40, x.map((a) => x.map((b) => Math.abs(a - b))), 3, 3, "lk", (i, j) => i === i0 && j === j0, () => 0);
        txt(g, 30, 160, "회색 칸은 크기 1인 축을 늘려 채운 것으로, 실제로 복사하지는 않는다.", "s", "start");
        read.textContent = `결과의 ${i0}행 ${j0}열 = |x[${i0}] − x[${j0}]| = |${x[i0]} − ${x[j0]}| = ${Math.abs(x[i0] - x[j0])}. 세로 배열은 옆으로, 가로 배열은 아래로 늘어나 둘 다 (3,3)이 된다.`;
      } else {
        const D = [[1, 10], [2, 20], [6, 60]], m = [3, 30], c2 = c % 6, i0 = Math.floor(c2 / 2), j0 = c2 % 2;
        txt(g, 30, 30, "D  (3,2)", "s", "start"); grid(30, 40, D, 3, 2, "la", (i, j) => i === i0 && j === j0);
        txt(g, 135, 83, "−", "s", "middle");
        txt(g, 160, 30, "m  (2,)", "s", "start"); grid(160, 40, [m], 3, 2, "lb", (i, j) => i === i0 && j === j0, (i, j) => m[j]);
        txt(g, 265, 83, "=", "s", "middle");
        txt(g, 290, 30, "D − m  (3,2)", "s", "start"); grid(290, 40, D.map((r) => r.map((v, j) => v - m[j])), 3, 2, "lk", (i, j) => i === i0 && j === j0);
        txt(g, 30, 160, "뒤쪽 축의 크기(2)가 같으므로 m을 세 행에 늘려 뺀다.", "s", "start");
        read.textContent = `${i0}행 ${j0}열: ${D[i0][j0]} − ${m[j0]} = ${D[i0][j0] - m[j0]}. 열마다 평균(3, 30)이 모든 행에서 빠진다.`;
      }
    });
  });

  // 4.1 수치 미분: h가 너무 크거나 작으면 오차가 커진다
  Q.def("c11-deriv", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(-14, 0, -12, 0, 60, 500, 15, 210), x = 1, tr = Math.cos(1);
    const fw = (h) => (Math.sin(x + h) - Math.sin(x)) / h, ce = (h) => (Math.sin(x + h) - Math.sin(x - h)) / (2 * h);
    const le = (v) => { const e = Math.abs(v - tr); return e > 0 ? Math.max(-12, Math.log10(e)) : -12; };
    Q.bind(fig, ({ k }) => {
      clear(g);
      for (let v = -12; v <= 0; v += 4) Q.line(g, F.X0, F.y(v), F.X1, F.y(v), "gd");
      axl(g, F, [-14, -10, -6, -2], [-12, -8, -4, 0], "h", "오차", (v) => pow10(v), (v) => pow10(v));
      const A = [], B = []; for (let j = 0; j <= 280; j++) { const t = -14 + j / 20, h = 10 ** t; A.push([t, le(fw(h))]); B.push([t, le(ce(h))]); }
      line(g, F, A, "c"); line(g, F, B, "a");
      txt(g, F.x(-1), F.y(-1.6), "전진 차분", "tc", "end"); txt(g, F.x(-3.5), F.y(-9.5), "중앙 차분", "ta", "end");
      const h = 10 ** -k;
      Q.line(g, F.x(-k), F.Y0, F.x(-k), F.Y1, "k dsh");
      Q.dot(g, F.x(-k), F.y(le(fw(h))), "fc"); Q.dot(g, F.x(-k), F.y(le(ce(h))), "fa");
      read.textContent = `h = ${pow10(-k)}: sin의 x = 1에서 도함수 cos 1 = 0.5403023059. 전진 차분 오차 ${sci(Math.abs(fw(h) - tr))}, 중앙 차분 오차 ${sci(Math.abs(ce(h) - tr))}. h를 줄이면 처음엔 좋아지다가, 너무 작으면 거의 같은 두 값의 빼기라 반올림 오차가 커진다.`;
    }, (k, v) => pow10(-v));
  });

  // 4.2 오일러-크로머와 오일러: 위상 공간의 궤적
  Q.def("c11-osc", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(-2.2, 2.2, -2.2, 2.2, 150, 370, 15, 235);
    Q.bind(fig, ({ m, d }) => {
      clear(g);
      const dt = d / 100;
      Q.line(g, F.X0, F.y(0), F.X1, F.y(0), "ax"); Q.line(g, F.x(0), F.Y0, F.x(0), F.Y1, "ax");
      txt(g, F.X1 - 2, F.y(0) - 6, "x", "i", "end"); txt(g, F.x(0) + 6, F.Y0 + 12, "v", "i");
      Q.plot(g, F, (x) => Math.sqrt(Math.max(0, 1 - x * x)), "gd", -1, 1, 120); Q.plot(g, F, (x) => -Math.sqrt(Math.max(0, 1 - x * x)), "gd", -1, 1, 120);
      let x = 1, v = 0; const pts = [[x, v]], n = Math.round(10 / dt);
      for (let i = 0; i < n; i++) { if (m == 0) { v += -x * dt; x += v * dt; } else { const nx = x + v * dt; v += -x * dt; x = nx; } pts.push([x, v]); }
      line(g, F, pts, m == 0 ? "a" : "c");
      Q.dot(g, F.x(1), F.y(0), "fk"); Q.dot(g, F.x(x), F.y(v), m == 0 ? "fa" : "fc");
      const E = 0.5 * v * v + 0.5 * x * x;
      read.textContent = `${m == 0 ? "오일러-크로머(속도 먼저)" : "오일러(위치 먼저)"}, dt = ${num(dt, 2)}, ${n}걸음 뒤 t = 10: x = ${num(x, 3)}, 에너지 ${num(E, 4)} (처음 0.5). ` + (m == 0 ? "궤적이 회색 원(참 궤적) 둘레에 머물고 에너지가 0.5 둘레에서 오르내린다." : "궤적이 바깥으로 소용돌이쳐 에너지가 매 걸음 (1 + dt²)배씩 늘어난다.");
    });
  });

  // 4.3 사다리꼴 공식과 quad: 오차를 로그 눈금으로
  Q.def("c11-quadtrap", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(0, 4, -16, 0, 60, 500, 15, 210);
    const trap = (n) => { const h = PI / n; let s = 0; for (let i = 1; i < n; i++) s += Math.sin(i * h); return h * s; };
    Q.bind(fig, ({ k }) => {
      clear(g);
      for (let v = -16; v <= 0; v += 4) Q.line(g, F.X0, F.y(v), F.X1, F.y(v), "gd");
      axl(g, F, [0, 1, 2, 3, 4], [-16, -12, -8, -4, 0], "n", "오차", (v) => pow10(v), (v) => pow10(v));
      const pts = []; for (let j = 3; j <= 40; j++) { const n = Math.round(10 ** (j / 10)); pts.push([Math.log10(n), Math.log10(Math.abs(2 - trap(n)))]); }
      line(g, F, pts, "c");
      Q.line(g, F.X0, F.y(-14), F.X1, F.y(-14), "a dsh");
      txt(g, F.x(3.95), F.y(-13.3), "quad의 오차 어림 수준 (약 10⁻¹⁴)", "ta", "end");
      txt(g, F.x(1.2), F.y(-3.5), "사다리꼴 공식 (기울기 −2)", "tc", "start");
      const n = Math.round(10 ** (k / 10)), T = trap(n);
      Q.dot(g, F.x(Math.log10(n)), F.y(Math.log10(Math.abs(2 - T))), "fc");
      read.textContent = `n = ${n}: 사다리꼴 값 ${T.toPrecision(10)}, 오차 ${sci(2 - T)}. n을 10배 하면 오차가 100분의 1로 줄어, quad의 정확도에 닿으려면 n이 수백만이어야 한다.`;
    }, (k, v) => String(Math.round(10 ** (v / 10))));
  });

  // 5.1 가우스 소거와 부분 피벗팅을 한 단계씩
  Q.def("c11-elim", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const S = [], say = [];
    { let A = [[2, 1, -1, 8], [-3, -1, 2, -11], [-2, 1, 2, -3]].map((r) => r.slice());
      const push = (s, hot) => { S.push({ A: A.map((r) => r.slice()), hot }); say.push(s); };
      push("처음 첨가 행렬 [A | b].", []);
      for (let k = 0; k < 2; k++) {
        let p = k; for (let i = k + 1; i < 3; i++) if (Math.abs(A[i][k]) > Math.abs(A[p][k])) p = i;
        if (p !== k) { [A[k], A[p]] = [A[p], A[k]]; push(`${k + 1}열에서 절댓값이 가장 큰 ${num(A[k][k], 3)}이 있는 ${p + 1}행을 ${k + 1}행과 맞바꾼다(부분 피벗팅).`, [k, p]); }
        for (let i = k + 1; i < 3; i++) { const m = A[i][k] / A[k][k]; A[i] = A[i].map((v, j) => v - m * A[k][j]); push(`${i + 1}행에서 ${k + 1}행의 ${num(m, 3)}배를 빼 ${k + 1}열을 0으로 만든다.`, [i]); }
      }
      const x = [0, 0, 0]; for (let i = 2; i >= 0; i--) { let s = A[i][3]; for (let j = i + 1; j < 3; j++) s -= A[i][j] * x[j]; x[i] = s / A[i][i]; }
      S.push({ A: A.map((r) => r.slice()), hot: [], x }); say.push(`위 삼각 행렬이 되었으니 마지막 행부터 후진 대입한다. z = ${num(x[2], 3)}, y = ${num(x[1], 3)}, x = ${num(x[0], 3)}.`);
    }
    Q.bind(fig, ({ s }) => {
      clear(g);
      const st = S[Math.min(s, S.length - 1)], W = 74, H = 36;
      ["x", "y", "z", "b"].forEach((c, j) => txt(g, 60 + j * W + 34, 30, c, "i", "middle"));
      st.A.forEach((r, i) => r.forEach((v, j) => cell(g, 60 + j * W, 40 + i * H, W - 4, H - 4, num(v, 3), st.hot.includes(i) ? "lc" : j === 3 ? "lb" : Math.abs(v) < 1e-12 && j < i ? "lk" : "la", 13)));
      Q.line(g, 60 + 3 * W - 2, 36, 60 + 3 * W - 2, 40 + 3 * H, "k");
      if (st.x) txt(g, 60, 190, `x = ${num(st.x[0], 3)},  y = ${num(st.x[1], 3)},  z = ${num(st.x[2], 3)}`, "ta", "start").setAttribute("style", MONO);
      read.textContent = `${s}단계: ${say[Math.min(s, say.length - 1)]}`;
    });
  });

  // 5.2 오일러와 RK4: y' = −y
  Q.def("c11-ode", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(0, 1.05, 0.25, 1.05, 60, 500, 15, 210), f = (t, y) => -y;
    Q.bind(fig, ({ h }) => {
      clear(g);
      const H = [0.5, 0.25, 0.2, 0.1, 0.05][h], n = Math.round(1 / H);
      axl(g, F, [0, 0.5, 1], [0.4, 0.6, 0.8, 1], "t", "y");
      Q.plot(g, F, (t) => Math.exp(-t), "gd", 0, 1.05);
      let ye = 1, yr = 1; const E = [[0, 1]], R = [[0, 1]];
      for (let i = 0; i < n; i++) {
        const t = i * H; ye += H * f(t, ye);
        const k1 = f(t, yr), k2 = f(t + H / 2, yr + H / 2 * k1), k3 = f(t + H / 2, yr + H / 2 * k2), k4 = f(t + H, yr + H * k3);
        yr += H / 6 * (k1 + 2 * k2 + 2 * k3 + k4); E.push([(i + 1) * H, ye]); R.push([(i + 1) * H, yr]);
      }
      line(g, F, E, "c"); E.forEach((p) => Q.dot(g, F.x(p[0]), F.y(p[1]), "fc", 3.5));
      R.forEach((p) => Q.dot(g, F.x(p[0]), F.y(p[1]), "fa", 3.5));
      txt(g, F.x(0.62), F.y(0.42) + 30, "오일러", "tc", "start"); txt(g, F.x(0.5), F.y(Math.exp(-0.5)) - 10, "RK4 (참값 곡선 위)", "ta", "start");
      const tr = Math.exp(-1);
      read.textContent = `h = ${H}, ${n}걸음: 오일러 ${ye.toFixed(6)} (오차 ${sci(Math.abs(ye - tr))}), RK4 ${yr.toFixed(9)} (오차 ${sci(Math.abs(yr - tr))}). 참값 e⁻¹ = 0.3678794. h를 절반으로 하면 오일러 오차는 약 1/2, RK4 오차는 약 1/16이 된다.`;
    }, (k, v) => String([0.5, 0.25, 0.2, 0.1, 0.05][v]));
  });

  // 5.3 지수 자료 맞추기: 보통 눈금과 로그 눈금
  Q.def("c11-fit", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const t = [0, 1, 2, 3, 4], y = [10.0, 6.1, 3.6, 2.3, 1.3];
    const fit = (X, Y) => { const xm = X.reduce((a, b) => a + b) / X.length, ym = Y.reduce((a, b) => a + b) / Y.length; let sxy = 0, sxx = 0; X.forEach((x, i) => { sxy += (x - xm) * (Y[i] - ym); sxx += (x - xm) ** 2; }); const b = sxy / sxx; return [ym - b * xm, b]; };
    const [a1, b1] = fit(t, y), [a2, b2] = fit(t, y.map(Math.log)), A = Math.exp(a2), k = -b2;
    Q.bind(fig, ({ v }) => {
      clear(g);
      if (v == 0) {
        const F = Q.frame(0, 5.2, -2.5, 11, 60, 500, 15, 210);
        axl(g, F, [0, 1, 2, 3, 4, 5], [0, 5, 10], "t (분)", "y");
        Q.line(g, F.X0, F.y(0), F.X1, F.y(0), "gd");
        Q.plot(g, F, (s) => a1 + b1 * s, "c", 0, 5.2); Q.plot(g, F, (s) => A * Math.exp(-k * s), "a", 0, 5.2);
        t.forEach((s, i) => Q.dot(g, F.x(s), F.y(y[i]), "fk"));
        txt(g, F.x(4.4), F.y(a1 + b1 * 4.4) - 8, "직선 맞춤", "tc", "start"); txt(g, F.x(1.6), F.y(A * Math.exp(-k * 1.6)) - 10, "지수 맞춤", "ta", "start");
        read.textContent = `직선 맞춤은 기울기 ${num(b1, 2)}이라 t = 5에서 ${num(a1 + 5 * b1, 2)}, 곧 음수 농도를 예측한다. 지수 맞춤 ${num(A, 2)}·e^(−${num(k, 3)}t)는 모든 점 가까이를 지난다.`;
      } else {
        const F = Q.frame(0, 5.2, -0.5, 2.6, 60, 500, 15, 210);
        axl(g, F, [0, 1, 2, 3, 4, 5], [0, 1, 2], "t (분)", "ln y");
        Q.plot(g, F, (s) => a2 + b2 * s, "a", 0, 5.2);
        t.forEach((s, i) => Q.dot(g, F.x(s), F.y(Math.log(y[i])), "fk"));
        read.textContent = `ln y를 그리면 점들이 거의 한 직선에 놓인다. 직선 ln y = ${num(a2, 3)} − ${num(k, 3)}t에서 A = e^${num(a2, 3)} = ${num(A, 2)}, k = ${num(k, 3)}/분, 반감기 ln 2/k = ${num(Math.log(2) / k, 2)}분이다.`;
      }
    });
  });

  // 5.4 더하기 한 번에 하는 일: 포트란, 순수 파이썬, NumPy
  Q.def("c11-speed", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const L = [
      ["포트란 (컴파일됨)", [["기계어: 나누기", "la"], ["기계어: 더하기", "la"]], "N번 되풀이", "번역은 실행 전에 끝났고 자료형도 정해져 있어, 반복 한 번이 기계어 몇 개뿐이다."],
      ["순수 파이썬", [["다음 줄 해석", "lc"], ["i의 자료형 확인", "lc"], ["i**2 객체 만들기", "lc"], ["1.0/… 객체 만들기", "lc"], ["s + … 객체 만들기", "lc"]], "N번 되풀이", "더하기 한 번마다 자료형을 확인하고 새 객체를 만드는 부담이 N = 10⁷번 되풀이된다."],
      ["NumPy", [["파이썬 명령 한 번", "lb"], ["C 반복: 나누기·더하기", "la"]], "C 안에서 N번", "파이썬은 '배열 전체를 계산하라'는 명령만 한 번 내리고, 반복은 미리 컴파일된 C 코드 안에서 돈다. 대신 10⁷개 배열(약 80 MB)을 메모리에 만든다."],
    ];
    Q.bind(fig, ({ l }) => {
      clear(g);
      const [name, steps, rep, say] = L[l];
      txt(g, 30, 35, `s = s + 1/i²  한 번에 하는 일: ${name}`, "s", "start");
      const W = Math.min(150, 440 / steps.length);
      steps.forEach(([s, c], i) => { el("rect", { x: 30 + i * W, y: 60, width: W - 12, height: 44, class: c }, g); txt(g, 30 + i * W + (W - 12) / 2, 87, s, "s", "middle").setAttribute("style", "font-size:11px"); if (i) Q.arrow(g, 30 + i * W - 12, 82, 30 + i * W - 1, 82, "k", "fk"); });
      const x0 = l == 2 ? 30 + W : 30, x1 = 30 + steps.length * W - 12;
      Q.line(g, x0, 120, x1, 120, "k"); Q.arrow(g, x1, 120, x1, 108, "k", "fk"); Q.line(g, x0, 120, x0, 108, "k");
      txt(g, (x0 + x1) / 2, 140, rep, "s", "middle");
      read.textContent = `${name}: ${say}`;
    });
  });

  // 5.5 뉴턴 방법: 접선이 x축과 만나는 곳으로
  Q.def("c11-newton", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const P = [
      { f: (x) => x * x - 2, d: (x) => 2 * x, x0: 1, F: Q.frame(0.9, 2.1, -1.2, 2.4, 60, 500, 15, 220), root: Math.SQRT2, name: "x² − 2", xt: [1, 1.5, 2] },
      { f: (x) => x - 0.5 * Math.sin(x) - 1, d: (x) => 1 - 0.5 * Math.cos(x), x0: 1, F: Q.frame(0.9, 1.7, -0.5, 0.25, 60, 500, 15, 220), root: (() => { let E = 1; for (let i = 0; i < 60; i++) E -= (E - 0.5 * Math.sin(E) - 1) / (1 - 0.5 * Math.cos(E)); return E; })(), name: "E − 0.5 sin E − 1", xt: [1, 1.2, 1.4, 1.6] },
    ];
    Q.bind(fig, ({ p, n }) => {
      clear(g);
      const { f, d, x0, F, root, name, xt } = P[p];
      Q.line(g, F.X0, F.y(0), F.X1, F.y(0), "ax"); xt.forEach((v) => txt(g, F.x(v), F.y(0) + 14, num(v, 1), "s", "middle"));
      Q.plot(g, F, f, "a", F.x0, F.x1, 200);
      let x = x0;
      for (let i = 0; i < n; i++) {
        const y = f(x), xn = x - y / d(x);
        Q.line(g, F.x(x), F.y(0), F.x(x), F.y(y), "gd");
        Q.plot(g, F, (s) => y + d(x) * (s - x), "c", Math.min(x, xn) - 0.05, Math.max(x, xn) + 0.05, 2);
        Q.dot(g, F.x(x), F.y(y), "fc", 3);
        x = xn;
      }
      Q.dot(g, F.x(x), F.y(0), "fc");
      Q.dot(g, F.x(root), F.y(0), "fd", 2.5);
      txt(g, F.X0 + 6, F.Y0 + 14, `f = ${name}`, "ta", "start");
      read.textContent = `${n}번 고친 값 ${p == 0 ? "x" : "E"}${n} = ${x.toFixed(10)}, 근과의 차이 ${sci(Math.abs(x - root))}. ` + (n >= 2 ? "근 가까이에서는 차이의 지수가 매번 약 두 배가 된다(2차 수렴)." : "접선이 x축과 만나는 점이 다음 추정값이다.");
    });
  });

  // 5.6 몬테카를로로 원주율 어림
  Q.def("c11-mc", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const NS = [10, 30, 100, 300, 1000, 3000], R = rng(0), P = Array.from({ length: 3000 }, () => [R(), R()]);
    const F = Q.frame(0, 1, 0, 1, 40, 250, 15, 225);
    Q.bind(fig, ({ k }) => {
      clear(g);
      const N = NS[k];
      el("rect", { x: F.X0, y: F.Y0, width: F.X1 - F.X0, height: F.Y1 - F.Y0, class: "lk" }, g);
      Q.plot(g, F, (x) => Math.sqrt(Math.max(0, 1 - x * x)), "k", 0, 1, 120);
      let hit = 0;
      for (let i = 0; i < N; i++) { const [x, y] = P[i], in1 = x * x + y * y <= 1; if (in1) hit++; Q.dot(g, F.x(x), F.y(y), in1 ? "fa" : "fc", N > 1000 ? 1.2 : 2); }
      const est = 4 * hit / N, se = 4 * Math.sqrt((PI / 4) * (1 - PI / 4) / N);
      txt(g, 280, 60, `N = ${N}`, "s", "start").setAttribute("style", MONO);
      txt(g, 280, 90, `안에 든 점 ${hit}개`, "ta", "start");
      txt(g, 280, 120, `4 × ${hit}/${N} = ${est.toFixed(4)}`, "s", "start").setAttribute("style", MONO);
      txt(g, 280, 150, `실제 오차 ${Math.abs(est - PI).toFixed(4)}`, "s", "start");
      txt(g, 280, 180, `표준오차 1.64/√N = ${se.toFixed(4)}`, "s", "start");
      read.textContent = `점 ${N}개 가운데 ${hit}개가 사분원 안(파랑)에 들어 π ≈ ${est.toFixed(4)}이다. N을 100배 하면 표준오차는 10분의 1로만 줄어든다.`;
    }, (k, v) => String([10, 30, 100, 300, 1000, 3000][v]));
  });

  // 5.7 룽게 현상: 같은 간격 점의 고차 다항식 보간
  Q.def("c11-runge", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(-1.05, 1.05, -0.6, 2.0, 60, 500, 15, 220), f = (x) => 1 / (1 + 25 * x * x);
    Q.bind(fig, ({ n, m }) => {
      clear(g);
      const xs = Array.from({ length: n }, (_, i) => -1 + 2 * i / (n - 1)), ys = xs.map(f);
      const lag = (x) => { let s = 0; xs.forEach((xi, i) => { let L = 1; xs.forEach((xj, j) => { if (j !== i) L *= (x - xj) / (xi - xj); }); s += ys[i] * L; }); return s; };
      const lin = (x) => { for (let i = 0; i < n - 1; i++) if (x <= xs[i + 1] + 1e-12) return ys[i] + (ys[i + 1] - ys[i]) * (x - xs[i]) / (xs[i + 1] - xs[i]); return ys[n - 1]; };
      const P = m == 0 ? lag : lin;
      Q.line(g, F.X0, F.y(0), F.X1, F.y(0), "ax"); [-1, -0.5, 0.5, 1].forEach((v) => txt(g, F.x(v), F.y(0) + 14, num(v), "s", "middle"));
      Q.plot(g, F, f, "gd", -1, 1, 300); Q.plot(g, F, P, "c", -1, 1, 600);
      xs.forEach((x, i) => Q.dot(g, F.x(x), F.y(ys[i]), "fa"));
      let mx = 0, at = 0; for (let i = 0; i <= 2000; i++) { const x = -1 + i / 1000, e = Math.abs(P(x) - f(x)); if (e > mx) { mx = e; at = x; } }
      read.textContent = `점 ${n}개, ${m == 0 ? `${n - 1}차 다항식 보간` : "선형 보간"}: 가장 큰 오차 ${mx.toFixed(3)} (x = ${num(at, 3)} 근처). ` + (m == 0 ? "점을 늘릴수록 양 끝의 출렁임이 커진다." : "점을 늘릴수록 오차가 꾸준히 줄어든다.");
    });
  });

  // 5.8 f2py: 파이썬 호출이 포트란 인수로 바뀌는 규칙
  Q.def("c11-f2py", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const D = [
      ["float64 1차원 배열", false, "자료형이 맞아 복사 없이 배열 메모리를 그대로 넘긴다."],
      ["int 배열 [1, 2, 3]", true, "double precision과 자료형이 달라 f2py가 실수로 바꾼 복사본을 만들어 넘긴다. intent(inout)이면 포트란이 바꾼 것은 복사본이라 원래 배열은 그대로이다."],
      ["행 우선 2차원 배열", true, "포트란은 열 우선이라 순서를 맞춘 복사본이 생긴다. np.asfortranarray(A)로 만들어 넘기면 복사를 피한다."],
    ];
    Q.bind(fig, ({ d }) => {
      clear(g);
      const [what, copy, say] = D[d];
      const bx = (x, y, s, cls) => cell(g, x, y, 60, 30, s, cls, 13);
      txt(g, 20, 45, "파이썬", "s", "start"); mono(g, 20, 65, "ftrapz.trapz(", "s", "start", 12);
      bx(130, 40, "y", "la"); bx(230, 40, "h", "la"); bx(390, 40, "s", "lb"); txt(g, 375, 61, "→", "s", "middle");
      txt(g, 20, 175, "포트란", "s", "start"); mono(g, 20, 195, "trapz(", "s", "start", 12);
      bx(130, 170, "y", "la"); bx(210, 170, "n", "lk"); bx(290, 170, "h", "la"); bx(390, 170, "s", "lb");
      if (copy) { el("rect", { x: 110, y: 104, width: 100, height: 28, class: "lc" }, g); txt(g, 160, 123, "복사본", "tc", "middle"); Q.arrow(g, 160, 70, 160, 104, "c", "fc"); Q.arrow(g, 160, 132, 160, 170, "c", "fc"); }
      else Q.arrow(g, 160, 70, 160, 170, "a", "fa");
      Q.arrow(g, 260, 70, 320, 170, "a", "fa");
      Q.arrow(g, 190, 185, 210, 185, "k dsh", "fk"); txt(g, 240, 160, "y의 크기", "s", "middle").setAttribute("style", "font-size:11px");
      Q.arrow(g, 420, 170, 420, 70, "b", "fb"); txt(g, 412, 115, "intent(out)", "tb", "end"); txt(g, 412, 132, "반환값", "tb", "end");
      txt(g, 20, 225, `넘긴 y: ${what}`, "s", "start");
      read.textContent = say;
    });
  });

  // ── 새 그림은 이 위에 ──
})();
