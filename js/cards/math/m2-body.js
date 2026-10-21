/* 수학2(집합론) 본문 카드의 조작 그림 (js/lib/qfig.js의 NMQ를 쓴다). 그림마다 NMQ.def("이름", …). */
(() => {
  "use strict";
  const Q = window.NMQ;
  if (!Q) return;
  const { el, clear, txt, num } = Q;
  const MONO = "font-family:var(--f-mono, monospace)";
  const poly = (g, F, pts, cls, open) => el("path", { d: pts.map((p, i) => (i ? "L" : "M") + F.x(p[0]).toFixed(1) + " " + F.y(p[1]).toFixed(1)).join("") + (open ? "" : "Z"), class: cls }, g);
  const line = (g, F, pts, cls) => { if (pts.length > 1) poly(g, F, pts, cls, true).setAttribute("style", "fill:none"); };
  const box = (g, x, y, w, h, s, cls, size) => { el("rect", { x, y, width: w, height: h, class: cls || "lk" }, g); if (s !== "" && s != null) txt(g, x + w / 2, y + h / 2 + 4, String(s), "s", "middle").setAttribute("style", MONO + (size ? `;font-size:${size}px` : "")); };
  const isPrime = (n) => { if (n < 2) return false; for (let d = 2; d * d <= n; d++) if (n % d === 0) return false; return true; };

  // 1.1 한정기호의 순서: ∀x∃y와 ∃y∀x
  Q.def("m2-quant", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const P = [[(x, y) => x + y === 0, "x + y = 0"], [(x, y) => x <= y, "x ≤ y"], [(x, y) => y === x * x, "y = x²"]];
    const xs = [-2, -1, 0, 1, 2], ys = [-2, -1, 0, 1, 2, 3, 4];
    Q.bind(fig, ({ p, o }) => {
      clear(g);
      const [f, name] = P[p], W = 34, X = 70, Y = 30;
      xs.forEach((x, j) => txt(g, X + j * W + 15, Y - 8, x, "s", "middle"));
      ys.forEach((y, i) => txt(g, X - 10, Y + i * 26 + 18, y, "s", "end"));
      txt(g, X + 5 * W + 6, Y - 8, "x", "i", "start"); txt(g, 30, Y + 3 * 26 + 18, "y", "i", "middle");
      const colOK = xs.map((x) => ys.some((y) => f(x, y))), rowOK = ys.map((y) => xs.every((x) => f(x, y)));
      ys.forEach((y, i) => xs.forEach((x, j) => {
        const on = f(x, y), hot = o == 0 ? on : rowOK[i] && on;
        el("rect", { x: X + j * W, y: Y + i * 26, width: W - 3, height: 23, class: hot ? "la" : on ? "lb" : "lk" }, g);
        if (on) txt(g, X + j * W + 15, Y + i * 26 + 16, "✓", "s", "middle");
      }));
      const ok = o == 0 ? colOK.every(Boolean) : rowOK.some(Boolean);
      const label = o == 0 ? `∀x ∃y, ${name}` : `∃y ∀x, ${name}`;
      txt(g, 270, 50, label, "s", "start").setAttribute("style", MONO + ";font-size:14px");
      txt(g, 270, 80, ok ? "참" : "거짓", ok ? "ta" : "td", "start");
      txt(g, 270, 110, o == 0 ? "열마다 ✓가 하나 있으면 참" : "✓로 꽉 찬 행이 하나 있으면 참", "s", "start");
      read.textContent = `${label} (x는 −2…2, y는 −2…4): ` + (o == 0 ? (ok ? "모든 열(x)에 ✓가 있어 참이다. 각 x에 맞춰 y를 고를 수 있다." : "✓가 없는 열이 있어 거짓이다.") : (ok ? "모든 x에 통하는 행(y)이 있어 참이다." : "어느 행도 ✓로 꽉 차지 않아 거짓이다. 하나의 y가 모든 x에 통해야 하기 때문이다."));
    });
  });

  // 1.2 예 몇 개로는 "모든"을 증명할 수 없다: n² + n + 41
  Q.def("m2-euler41", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ n }) => {
      clear(g);
      const W = 46, H = 26;
      for (let k = 0; k <= 44; k++) {
        const v = k * k + k + 41, pr = isPrime(v), r = Math.floor(k / 10), c = k % 10;
        el("rect", { x: 20 + c * W, y: 20 + r * (H + 4), width: W - 3, height: H, class: k > n ? "lk" : pr ? "la" : "ld" }, g);
        txt(g, 20 + c * W + 21, 20 + r * (H + 4) + 17, k, "s", "middle").setAttribute("style", MONO + ";font-size:11px");
      }
      const v = n * n + n + 41, pr = isPrime(v);
      let fac = ""; if (!pr) { for (let d = 2; d * d <= v; d++) if (v % d === 0) { fac = `${d} × ${v / d}`; break; } }
      txt(g, 20, 190, `n = ${n}: n² + n + 41 = ${v}${pr ? " (소수)" : ` = ${fac}`}`, pr ? "ta" : "td", "start").setAttribute("style", MONO + ";font-size:13px");
      read.textContent = pr ? `n = ${n}까지는 모두 소수(파랑)이다. 그러나 이것만으로 "모든 n"을 증명할 수는 없다.` : `n = ${n}에서 ${v}(= ${fac})이 합성수(빨강)로 나온다. 반례 하나로 "모든 n에서 소수"가 거짓이 된다.`;
    });
  });

  // 1.3 강한 귀납법: 인수분해 나무
  Q.def("m2-factor", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ n }) => {
      clear(g);
      const node = (m, x, y, w, depth) => {
        const pr = isPrime(m);
        box(g, x - 22, y - 13, 44, 24, m, pr ? "la" : "lc", 12);
        if (pr || depth > 5) return;
        let a = Math.floor(Math.sqrt(m)); while (m % a !== 0) a--;
        const b = m / a, dy = 46;
        Q.line(g, x, y + 11, x - w / 2, y + dy - 13, "k"); Q.line(g, x, y + 11, x + w / 2, y + dy - 13, "k");
        node(a, x - w / 2, y + dy, w / 2, depth + 1); node(b, x + w / 2, y + dy, w / 2, depth + 1);
      };
      node(n, 260, 30, 220, 0);
      const fs = []; let m = n; for (let d = 2; m > 1; d++) while (m % d === 0) { fs.push(d); m /= d; }
      let a0 = Math.floor(Math.sqrt(n)); while (n % a0 !== 0) a0--;
      read.textContent = isPrime(n) ? `n = ${n}: 소수라서 인수 하나짜리 곱이다.` : `n = ${n} = ${fs.join(" × ")}. 처음에 ${n} = ${a0} × ${n / a0}로 쪼개면 두 인수가 n − 1 = ${n - 1}보다 훨씬 작으므로, 바로 앞 경우만 쓰는 보통 귀납법이 아니라 앞의 모든 경우를 쓰는 강한 귀납법이 필요하다.`;
    });
  });

  // 세 원의 벤 다이어그램에서 영역 하나(bits: A, B, C 안팎)를 칠한다
  let vennN = 0;
  const venn = (svg, g, cx, cy, r) => {
    const id = "vn" + (vennN++), defs = el("defs", {}, svg);
    const C = [[cx - r * 0.55, cy - r * 0.35], [cx + r * 0.55, cy - r * 0.35], [cx, cy + r * 0.55]];
    C.forEach(([x, y], i) => {
      el("circle", { cx: x, cy: y, r }, el("clipPath", { id: `${id}c${i}` }, defs));
      const m = el("mask", { id: `${id}m${i}`, maskUnits: "userSpaceOnUse", x: cx - 3 * r, y: cy - 3 * r, width: 6 * r, height: 6 * r }, defs);
      el("rect", { x: cx - 3 * r, y: cy - 3 * r, width: 6 * r, height: 6 * r, fill: "#fff" }, m);
      el("circle", { cx: x, cy: y, r, fill: "#000" }, m);
    });
    const fillRegion = (bits, cls) => {
      let p = g;
      for (let i = 0; i < 3; i++) p = el("g", bits >> (2 - i) & 1 ? { "clip-path": `url(#${id}c${i})` } : { mask: `url(#${id}m${i})` }, p);
      el("rect", { x: cx - 2.2 * r, y: cy - 2.2 * r, width: 4.4 * r, height: 4.4 * r, class: cls }, p);
    };
    const outline = (names) => C.forEach(([x, y], i) => {
      el("circle", { cx: x, cy: y, r, class: "k" }, g);
      const dx = [-1, 1, 0][i], dy = [-1, -1, 1][i];
      txt(g, x + dx * r * 0.62, y + dy * r * 0.62 + 4, names[i], "i", "middle");
    });
    return { fillRegion, outline };
  };

  // 2.1 집합 등식의 양변을 벤 다이어그램으로 비교한다
  Q.def("m2-venn", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    // 영역 비트: 4 = A, 2 = B, 1 = C
    const inA = (b) => b & 4, inB = (b) => b & 2, inC = (b) => b & 1;
    const E = [
      ["A ∩ (B ∪ C)", (b) => inA(b) && (inB(b) || inC(b)), "(A ∩ B) ∪ (A ∩ C)", (b) => (inA(b) && inB(b)) || (inA(b) && inC(b))],
      ["A ∖ (B ∪ C)", (b) => inA(b) && !(inB(b) || inC(b)), "(A ∖ B) ∩ (A ∖ C)", (b) => inA(b) && !inB(b) && !inC(b)],
      ["(A ∖ B) ∪ B", (b) => (inA(b) && !inB(b)) || inB(b), "A", (b) => inA(b)],
      ["A ∖ (A ∖ B)", (b) => inA(b) && !(inA(b) && !inB(b)), "A ∩ B", (b) => inA(b) && inB(b)],
    ];
    const name = (b) => ["A", "B", "C"].map((s, i) => (b >> (2 - i) & 1 ? `${s} 안` : `${s} 밖`)).join(", ");
    Q.bind(fig, ({ e }) => {
      clear(g); svg.querySelectorAll("defs").forEach((d) => d.remove());
      const [ln, lf, rn, rf] = E[e], V = [venn(svg, g, 135, 110, 58), venn(svg, g, 385, 110, 58)];
      const diff = [];
      for (let b = 1; b < 8; b++) {
        const l = !!lf(b), r = !!rf(b);
        if (l) V[0].fillRegion(b, "la");
        if (r) V[1].fillRegion(b, "lb");
        if (l !== r) diff.push(b);
      }
      V[0].outline(["A", "B", "C"]); V[1].outline(["A", "B", "C"]);
      txt(g, 135, 228, ln, "s", "middle").setAttribute("style", MONO + ";font-size:13px");
      txt(g, 385, 228, rn, "s", "middle").setAttribute("style", MONO + ";font-size:13px");
      txt(g, 260, 114, diff.length ? "≠" : "=", diff.length ? "td" : "ta", "middle").setAttribute("style", "font-size:22px");
      read.textContent = diff.length
        ? `두 영역이 다르다. ${diff.map(name).map((s) => `(${s})`).join(", ")}인 영역이 한쪽에만 칠해져 있으므로, 이 영역에 원소 하나를 두면 반례가 된다.`
        : "칠한 영역이 일곱 영역 모두에서 일치한다. 그림은 증명이 아니지만, 원소 논법으로 증명할 만한 등식임을 알려 준다.";
    });
  });

  // 2.2 첨자 집합족: 처음 N개의 합·교와 무한히 많은 것의 합·교
  Q.def("m2-family", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    // [이름, 합(true)/교(false), n번째 구간 [a, b, 왼쪽 닫힘, 오른쪽 닫힘], 처음 N개의 결과, 무한 결과]
    const FAM = [
      ["⋃ [1/n, 1]", true, (n) => [1 / n, 1, true, true], (N) => `[1/${N}, 1]`, "(0, 1]"],
      ["⋂ (−1/n, 1/n)", false, (n) => [-1 / n, 1 / n, false, false], (N) => `(−1/${N}, 1/${N})`, "{0}"],
      ["⋂ (0, 1/n)", false, (n) => [0, 1 / n, false, false], (N) => `(0, 1/${N})`, "∅"],
      ["⋃ [−n, n]", true, (n) => [-n, n, true, true], (N) => `[−${N}, ${N}]`, "ℝ"],
    ];
    Q.bind(fig, ({ f, N }) => {
      clear(g);
      const [nm, uni, I, part, lim] = FAM[f], R = f == 3 ? 9 : 1.2;
      const F = Q.frame(-R, R, 0, 1, 40, 480, 0, 1);
      el("line", { x1: 40, y1: 196, x2: 480, y2: 196, class: "ax" }, g);
      const ticks = f == 3 ? [-8, -4, 0, 4, 8] : [-1, -0.5, 0, 0.5, 1];
      ticks.forEach((v) => { el("line", { x1: F.x(v), y1: 192, x2: F.x(v), y2: 200, class: "ax" }, g); txt(g, F.x(v), 212, num(v), "s", "middle"); });
      const bar = (a, b, lc, rc, y, cls, dc) => {
        el("line", { x1: F.x(a), y1: y, x2: F.x(b), y2: y, class: cls }, g);
        Q.dot(g, F.x(a), y, lc ? dc : "lk", 3.5).setAttribute("style", "stroke:currentColor");
        Q.dot(g, F.x(b), y, rc ? dc : "lk", 3.5).setAttribute("style", "stroke:currentColor");
      };
      for (let n = 1; n <= N; n++) { const [a, b, lc, rc] = I(n); bar(a, b, lc, rc, 14 + n * 16, "b", "fb"); txt(g, 30, 18 + n * 16, `n=${n}`, "s", "end"); }
      const [a, b, lc, rc] = uni ? [I(N)[0], I(N)[1], I(N)[2], I(N)[3]] : I(N);
      bar(a, b, lc, rc, 176, "d", "fd");
      txt(g, 488, 180, uni ? "합" : "교", "td", "start");
      read.textContent = `${nm} (n = 1…${N}) = ${part(N)}. N을 키우면 ${uni ? "합이 넓어지지만" : "교가 줄어들지만"}, n = 1, 2, 3, …을 모두 모은 ${uni ? "합은" : "교는"} ${lim}이다.`;
    });
  });

  // 3.1 동치관계와 분할: 0…23을 m으로 나눈 나머지로 묶는다
  Q.def("m2-equiv", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const CL = ["la", "lb", "lc", "ld"];
    Q.bind(fig, ({ m, r }) => {
      clear(g);
      if (r == 0) {
        const W = 470 / m;
        for (let c = 0; c < m; c++) {
          el("rect", { x: 25 + c * W + 2, y: 18, width: W - 4, height: 172, class: CL[c % 4] }, g);
          txt(g, 25 + c * W + W / 2, 206, `[${c}]`, "s", "middle").setAttribute("style", MONO);
          for (let k = 0; c + k * m < 24; k++) { const v = c + k * m; Q.dot(g, 25 + c * W + W / 2, 34 + k * (150 / Math.ceil(24 / m)), "fk", 2.5); txt(g, 25 + c * W + W / 2 + 7, 38 + k * (150 / Math.ceil(24 / m)), v, "s", "start").setAttribute("style", "font-size:10px"); }
        }
        read.textContent = `a ~ b ⇔ m | a − b (m = ${m}). 0…23이 동치류 ${m}개로 겹치지 않게 나뉜다. 예를 들어 [1] = {1, ${1 + m}, ${1 + 2 * m}, …}이고, 같은 칸의 두 수는 늘 차가 ${m}의 배수이다.`;
      } else {
        // |a − b| ≤ 1: 사슬처럼 이어져 추이가 깨진다
        for (let v = 0; v < 12; v++) { Q.dot(g, 40 + v * 40, 110, "fk", 4); txt(g, 40 + v * 40, 132, v, "s", "middle"); if (v < 11) { const p = el("path", { d: `M${40 + v * 40} 104 Q${60 + v * 40} 80 ${80 + v * 40} 104`, class: "b" }, g); p.setAttribute("style", "fill:none"); } }
        const a = m - 1, b = m + 1;
        if (b < 12) { const p = el("path", { d: `M${40 + a * 40} 116 Q${40 + m * 40} 170 ${40 + b * 40} 116`, class: "d dsh" }, g); p.setAttribute("style", "fill:none"); }
        read.textContent = `a ~ b ⇔ |a − b| ≤ 1. ${a} ~ ${m}이고 ${m} ~ ${b}이지만 |${a} − ${b}| = 2라 ${a} ≁ ${b}이다(빨간 점선). 추이가 아니어서 "같은 칸"으로 나눌 수 없다.`;
      }
    });
  });

  // 3.2 상과 역상: f(x) = x²
  Q.def("m2-image", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(-2.6, 2.6, -1.5, 5, 30, 330, 10, 230), f = (x) => x * x;
    const iv = (a, b) => `[${num(a, 2)}, ${num(b, 2)}]`;
    Q.bind(fig, ({ mode, a, b }) => {
      clear(g);
      if (a > b) [a, b] = [b, a];
      Q.axes(g, F, { step: 1 });
      Q.plot(g, F, f, "k");
      const xbar = (lo, hi, cls, dy) => el("line", { x1: F.x(lo), y1: F.y(0) + dy, x2: F.x(hi), y2: F.y(0) + dy, class: cls }, g).setAttribute("style", "stroke-width:5");
      const ybar = (lo, hi, cls, dx) => el("line", { x1: F.x(0) + dx, y1: F.y(lo), x2: F.x(0) + dx, y2: F.y(hi), class: cls }, g).setAttribute("style", "stroke-width:5");
      let msg;
      if (mode == 0) {
        // S = [a, b] ⊆ ℝ, f(S), f⁻¹(f(S))
        const lo = a <= 0 && b >= 0 ? 0 : Math.min(f(a), f(b)), hi = Math.max(f(a), f(b));
        xbar(a, b, "a", -4); ybar(lo, Math.min(hi, 5), "b", -5);
        const r = Math.sqrt(hi), q = Math.sqrt(lo);
        xbar(-r, -q, "d", 6); xbar(q, r, "d", 6);
        const back = q === 0 ? iv(-r, r) : `${iv(-r, -q)} ∪ ${iv(q, r)}`;
        txt(g, 350, 40, `S = ${iv(a, b)}`, "ta", "start"); txt(g, 350, 64, `f(S) = ${iv(lo, hi)}`, "tb", "start"); txt(g, 350, 88, "f⁻¹(f(S)) =", "td", "start"); txt(g, 360, 110, back, "td", "start");
        msg = `S = ${iv(a, b)}(파랑)의 상은 f(S) = ${iv(lo, hi)}(청록)이고, 그 역상은 ${back}(빨강)이다. ` + (back === iv(a, b) ? "S와 같다." : "x와 −x가 같은 곳으로 가므로 S보다 커진다.");
      } else {
        // T = [a, b] ⊆ ℝ (세로축), f⁻¹(T), f(f⁻¹(T))
        ybar(a, Math.min(b, 5), "a", -5);
        const hi = Math.max(b, 0), lo = Math.max(a, 0), r = Math.sqrt(hi), q = Math.sqrt(lo);
        let pre = "∅", img = "∅";
        if (b >= 0) { pre = q === 0 ? iv(-r, r) : `${iv(-r, -q)} ∪ ${iv(q, r)}`; img = iv(lo, hi); xbar(-r, -q, "b", 6); xbar(q, r, "b", 6); ybar(lo, Math.min(hi, 5), "d", 6); }
        txt(g, 350, 40, `T = ${iv(a, b)}`, "ta", "start"); txt(g, 350, 64, "f⁻¹(T) =", "tb", "start"); txt(g, 360, 86, pre, "tb", "start"); txt(g, 350, 110, `f(f⁻¹(T)) = ${img}`, "td", "start");
        msg = `T = ${iv(a, b)}(세로축 파랑)의 역상은 ${pre}(청록)이고, 그것을 다시 보내면 ${img}(빨강)이다. ` + (a < 0 ? "음수 부분은 f의 값으로 나오지 않아 사라지므로 T보다 작아진다." : "T가 f의 값 범위 안에 있어 T와 같다.");
      }
      read.textContent = msg;
    });
  });

  // 3.3 단사와 전사: X = {1, 2, 3}에서 Y로 가는 화살표
  Q.def("m2-injsurj", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const Yn = ["a", "b", "c", "d"];
    Q.bind(fig, ({ n, t1, t2, t3 }) => {
      clear(g);
      const T = [t1, t2, t3].map((t) => Math.min(t, n - 1));
      T.forEach((t, i) => { const o = fig.querySelector(`output[data-k=t${i + 1}]`); if (o) o.textContent = Yn[t]; });
      const xy = (i) => [120, 50 + i * 60], yy = (j) => [380, 120 - (n - 1) * 30 + j * 60];
      el("rect", { x: 85, y: 20, width: 70, height: 180, class: "lk" }, g); el("rect", { x: 345, y: 120 - (n - 1) * 30 - 30, width: 70, height: n * 60, class: "lk" }, g);
      txt(g, 120, 14, "X", "i", "middle"); txt(g, 380, 120 - (n - 1) * 30 - 36, "Y", "i", "middle");
      const hit = Array(n).fill(0); T.forEach((t) => hit[t]++);
      T.forEach((t, i) => { const [x1, y1] = xy(i), [x2, y2] = yy(t); Q.arrow(g, x1 + 10, y1, x2 - 12, y2, hit[t] > 1 ? "d" : "b"); });
      [0, 1, 2].forEach((i) => { const [x, y] = xy(i); Q.dot(g, x, y, "fk", 4); txt(g, x - 14, y + 4, i + 1, "s", "end"); });
      for (let j = 0; j < n; j++) { const [x, y] = yy(j); Q.dot(g, x, y, hit[j] ? "fk" : "fd", 4); txt(g, x + 14, y + 4, Yn[j], hit[j] ? "s" : "td", "start"); }
      const inj = hit.every((h) => h <= 1), sur = hit.every((h) => h >= 1);
      const two = hit.findIndex((h) => h > 1), none = hit.findIndex((h) => h === 0);
      const kind = inj && sur ? "전단사이다" : inj ? "단사이지만 전사가 아니다" : sur ? "전사이지만 단사가 아니다" : "단사도 전사도 아니다";
      txt(g, 450, 110, inj ? "단사" : "단사 아님", inj ? "ta" : "td", "start"); txt(g, 450, 134, sur ? "전사" : "전사 아님", sur ? "ta" : "td", "start");
      read.textContent = (`f는 ${kind}. ` + (two >= 0 ? `${Yn[two]}로 화살표가 둘 이상 모인다(빨강). ` : "") + (none >= 0 ? `${Yn[none]}에는 오는 화살표가 없다. ` : "") + (n > 3 ? "Y의 원소가 X보다 많으면 전사일 수 없다." : n < 3 ? "Y의 원소가 X보다 적으면 단사일 수 없다." : "")).trim();
    }, (k, v) => (k[0] === "t" ? Yn[v] : num(v)));
  });

  // 4.1 N×N을 대각선으로 세기 (칸토어 짝짓기 함수)
  Q.def("m2-pairing", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const S = 7, W = 28, X = 60, Y = 20;
    const diag = [], row = [];
    for (let s = 0; diag.length < 40; s++) for (let a = 0; a <= s; a++) diag.push([a, s - a]);
    for (let b = 0; row.length < 40; b++) row.push([0, b]);
    Q.bind(fig, ({ k, m }) => {
      clear(g);
      const L = m == 0 ? diag : row;
      for (let a = 0; a < S; a++) { txt(g, X - 10, Y + a * W + 18, a, "s", "end"); txt(g, X + a * W + 13, Y - 4, a, "s", "middle"); }
      txt(g, X - 30, Y + 3.5 * W, "a", "i", "middle"); txt(g, X + S * W + 8, Y - 4, "b", "i", "start");
      for (let a = 0; a < S; a++) for (let b = 0; b < S; b++) el("rect", { x: X + b * W, y: Y + a * W, width: W - 3, height: W - 3, class: "lk" }, g);
      const pts = [];
      for (let i = 0; i <= k; i++) {
        const [a, b] = L[i]; if (a >= S || b >= S) continue;
        el("rect", { x: X + b * W, y: Y + a * W, width: W - 3, height: W - 3, class: i === k ? "lc" : "la" }, g);
        txt(g, X + b * W + 12, Y + a * W + 17, i, "s", "middle").setAttribute("style", "font-size:10px");
        pts.push([X + b * W + 12, Y + a * W + 12]);
      }
      if (pts.length > 1) { const p = el("path", { d: pts.map((q, i) => (i ? "L" : "M") + q[0] + " " + q[1]).join(""), class: "a" }, g); p.setAttribute("style", "fill:none;opacity:.5"); }
      const [a, b] = L[k];
      txt(g, 290, 60, `번호 ${k} → (${a}, ${b})`, "s", "start").setAttribute("style", MONO + ";font-size:14px");
      if (m == 0) { txt(g, 290, 90, "π(a, b) = (a+b)(a+b+1)/2 + a", "ta", "start").setAttribute("style", MONO + ";font-size:11px"); txt(g, 290, 110, `π(${a}, ${b}) = ${(a + b) * (a + b + 1) / 2 + a}`, "ta", "start").setAttribute("style", MONO + ";font-size:12px"); }
      read.textContent = m == 0
        ? `대각선 a + b = 0, 1, 2, …의 칸을 차례로 지나며, (${a}, ${b})의 번호는 ${k}이다. 어느 칸 (a, b)도 유한 번 만에 번호를 받는다.`
        : `첫 행 (0, 0), (0, 1), (0, 2), …만 끝없이 센다. 번호 ${k}인 칸도 아직 (0, ${b})이어서 (1, 0)에는 영영 닿지 못한다.`;
    });
  });

  // 4.2 대각선 논법: 목록의 n번째 수와 n째 자리에서 다르게 만든다
  Q.def("m2-diagonal", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const R = (seed) => { let x = seed * 9301 + 49297; return () => (x = (x * 9301 + 49297) % 233280) / 233280; };
    Q.bind(fig, ({ s, n }) => {
      clear(g);
      const rnd = R(s + 1), L = [];
      for (let i = 0; i < 6; i++) L.push(Array.from({ length: 6 }, () => Math.floor(rnd() * 10)));
      L[1][1] = 5;
      const e = L.map((d, i) => (d[i] === 5 ? 4 : 5));
      const W = 30, X = 90, Y = 22;
      for (let i = 0; i < 6; i++) {
        txt(g, X - 12, Y + i * W + 19, `x${"₁₂₃₄₅₆"[i]} = 0.`, "s", "end").setAttribute("style", MONO);
        for (let j = 0; j < 6; j++) {
          const on = i === j, dim = i >= n && on;
          el("rect", { x: X + j * W, y: Y + i * W, width: W - 3, height: W - 3, class: on ? (i < n ? "lc" : "lk") : "lk" }, g);
          txt(g, X + j * W + 13, Y + i * W + 19, L[i][j], on && !dim ? "tc" : "s", "middle").setAttribute("style", MONO);
        }
        txt(g, X + 6 * W + 4, Y + i * W + 19, "…", "s", "start");
      }
      const yy = Y + 6 * W + 16;
      txt(g, X - 12, yy + 19, "y = 0.", "td", "end").setAttribute("style", MONO);
      for (let j = 0; j < 6; j++) {
        el("rect", { x: X + j * W, y: yy, width: W - 3, height: W - 3, class: j < n ? "ld" : "lk" }, g);
        if (j < n) txt(g, X + j * W + 13, yy + 19, e[j], "td", "middle").setAttribute("style", MONO);
      }
      txt(g, 400, 60, "규칙", "s", "start"); txt(g, 400, 82, "대각선이 5가 아니면 5", "s", "start"); txt(g, 400, 102, "대각선이 5이면 4", "s", "start");
      const i = n - 1, ord = ["첫째", "둘째", "셋째", "넷째", "다섯째", "여섯째"][i], wa = (d) => `${d}${[0, 1, 3, 6, 7, 8].includes(d) ? "과" : "와"}`;
      read.textContent = `y의 ${ord} 자리는 x${"₁₂₃₄₅₆"[i]}의 ${ord} 자리 ${wa(L[i][i])} 다른 ${e[i]}이다. 그래서 y와 x${"₁₂₃₄₅₆"[i]}는 같을 수 없고, 같은 이유로 목록의 어떤 수와도 다르다.`;
    }, (k, v) => num(v));
  });

  // 4.3 칸토어-베른슈타인: 사슬 C에서는 f, 나머지에서는 g⁻¹
  Q.def("m2-cb", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const P = [
      ["f(n) = n + 1, g(n) = n + 1", (n) => n + 1, (n) => n + 1],
      ["f(n) = 2n, g(n) = 2n", (n) => 2 * n, (n) => 2 * n],
      ["f(n) = n + 1, g(n) = 2n", (n) => n + 1, (n) => 2 * n],
    ];
    Q.bind(fig, ({ p }) => {
      clear(g);
      const [nm, f, gg] = P[p], M = 400, K = 10;
      const gimg = new Map(); for (let b = 0; b < M; b++) gimg.set(gg(b), b);
      const C = new Set(); let cur = []; for (let a = 0; a < M; a++) if (!gimg.has(a)) cur.push(a);
      while (cur.length) { cur.forEach((a) => C.add(a)); cur = cur.map((a) => gg(f(a))).filter((a) => a < M && !C.has(a)); }
      const h = (a) => (C.has(a) ? f(a) : gimg.get(a));
      const ax = 90, bx = 330, yy = (i) => 22 + i * 19;
      txt(g, ax, 14, "A", "i", "middle"); txt(g, bx, 14, "B", "i", "middle");
      const hit = Array(K).fill(0);
      for (let a = 0; a < K; a++) { const t = h(a); if (t < K) { hit[t]++; Q.arrow(g, ax + 8, yy(a), bx - 10, yy(t), C.has(a) ? "a" : "c"); } }
      const from = new Map(); for (let a = 0; a < M; a++) { const t = h(a); if (t < K && !from.has(t)) from.set(t, a); }
      for (let i = 0; i < K; i++) {
        if (from.has(i) && from.get(i) >= K) txt(g, bx + 30, yy(i) + 4, `← ${from.get(i)}`, "s", "start");
        Q.dot(g, ax, yy(i), C.has(i) ? "fa" : "fc", 4); txt(g, ax - 12, yy(i) + 4, i, C.has(i) ? "ta" : "tc", "end");
        Q.dot(g, bx, yy(i), "fk", 3.5); txt(g, bx + 12, yy(i) + 4, i, "s", "start");
      }
      const cs = [...C].filter((a) => a < K).sort((x, y) => x - y);
      txt(g, 400, 40, nm.split(", ")[0], "s", "start").setAttribute("style", MONO); txt(g, 400, 60, nm.split(", ")[1], "s", "start").setAttribute("style", MONO);
      txt(g, 400, 92, "C 안: h = f", "ta", "start"); txt(g, 400, 112, "C 밖: h = g⁻¹", "tc", "start");
      const pairs = []; for (let a = 0; a < 6; a++) pairs.push(`h(${a}) = ${h(a)}`);
      read.textContent = `C의 원소(파랑)는 0…9 가운데 ${cs.length ? cs.join(", ") : "없음"}이다. ${pairs.join(", ")}, …. B의 각 점은 정확히 한 원소에서 오며(9보다 큰 원소에서 오는 것은 ← 옆에 적었다), 그래서 h는 전단사이다.`;
    });
  });

  // 4.4 칸토어 정리: D = {a | a ∉ f(a)}는 어떤 f(a)와도 다르다
  Q.def("m2-cantor", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const set = (m) => { const s = [1, 2, 3].filter((x, i) => m >> i & 1); return s.length ? `{${s.join(", ")}}` : "∅"; };
    Q.bind(fig, ({ s1, s2, s3 }) => {
      clear(g);
      const F = [s1, s2, s3], W = 40, X = 120, Y = 40;
      [1, 2, 3].forEach((x, j) => txt(g, X + j * W + 18, Y - 10, x, "s", "middle"));
      txt(g, X + 1.5 * W, 14, "원소 x가 들어 있는가", "s", "middle");
      let D = 0;
      F.forEach((m, i) => {
        txt(g, X - 10, Y + i * W + 25, `f(${i + 1}) = ${set(m)}`, "s", "end").setAttribute("style", MONO);
        [0, 1, 2].forEach((j) => {
          const on = m >> j & 1, dg = i === j;
          el("rect", { x: X + j * W, y: Y + i * W, width: W - 4, height: W - 4, class: dg ? "lc" : "lk" }, g);
          txt(g, X + j * W + 18, Y + i * W + 24, on ? "○" : "×", dg ? "tc" : "s", "middle");
        });
        if (!(m >> i & 1)) D |= 1 << i;
      });
      txt(g, X - 10, Y + 3 * W + 30, `D = ${set(D)}`, "td", "end").setAttribute("style", MONO);
      [0, 1, 2].forEach((j) => { el("rect", { x: X + j * W, y: Y + 3 * W + 6, width: W - 4, height: W - 4, class: "ld" }, g); txt(g, X + j * W + 18, Y + 3 * W + 30, D >> j & 1 ? "○" : "×", "td", "middle"); });
      const why = F.map((m, i) => `${i + 1}${m >> i & 1 ? "∈" : "∉"}f(${i + 1})이므로 ${i + 1}${D >> i & 1 ? "∈" : "∉"}D`);
      txt(g, 330, 70, "대각선(주황)을 뒤집으면 D", "s", "start");
      read.textContent = `D = ${set(D)}. ${why.join(", ")}이므로 D는 각 f(a)와 원소 a에서 어긋난다. 그래서 D는 f의 상에 없고, f는 전사가 아니다.`;
    }, (k, v) => set(v));
  });

  // ω 모양의 줄: x0에서 시작해 폭 w 안으로 점점 촘촘해지는 점 n개. 점마다 cls(i)로 색을 정한다.
  const omegaRow = (g, x0, w, y, cls, n) => {
    const pts = [];
    for (let k = 0; k < (n || 16); k++) { const x = x0 + w * (1 - Math.pow(0.8, k)); pts.push(x); Q.dot(g, x, y, cls(k), Math.max(1.6, 4 * Math.pow(0.9, k))); }
    return pts;
  };
  // 순서형 ω·a + b를 줄 하나로 그린다. 반환값은 각 원소의 x좌표 목록(블록별)
  const ordRow = (g, a, b, x0, y, W, cls) => {
    const blocks = [];
    for (let i = 0; i < a; i++) { blocks.push(omegaRow(g, x0 + i * W, W - 14, y, (k) => cls(i, k))); el("line", { x1: x0 + (i + 1) * W - 10, y1: y - 9, x2: x0 + (i + 1) * W - 10, y2: y + 9, class: "ax" }, g); }
    const tail = [];
    for (let j = 0; j < b; j++) { const x = x0 + a * W + j * 18; tail.push(x); Q.dot(g, x, y, cls(a, j), 4); }
    blocks.push(tail);
    return blocks;
  };
  const ordName = (a, b) => (a === 0 ? `${b}` : `ω${a > 1 ? "·" + a : ""}${b ? " + " + b : ""}`);

  // 5.1 정렬순서와 귀납법: 보통 귀납법은 극한 원소에 닿지 못한다
  Q.def("m2-wellorder", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    // [이름, ω 블록 수, 꼬리 수, 블록 i의 k번째 원소 이름]
    const O = [
      ["0, 1, 2, …", 1, 0, (i, k) => k],
      ["짝수 다음 홀수", 2, 0, (i, k) => 2 * k + i],
      ["1, 2, 3, …, 0", 1, 1, (i, k) => (i === 0 ? k + 1 : 0)],
    ];
    Q.bind(fig, ({ o, t, m }) => {
      clear(g);
      const [nm, a, b, lab] = O[o], W = a === 2 ? 220 : 300, y = 80;
      // 보통 귀납법: 처음 원소에서 다음 원소로 t번. 초한귀납법: 블록의 첫 원소(극한)도 넘어간다
      const reached = (i, k) => m == 1 || (i === 0 && k <= t);
      const blocks = ordRow(g, a, b, 30, y, W, (i, k) => (reached(i, k) ? "fa" : i > 0 && k === 0 ? "fd" : "fk"));
      blocks.forEach((xs, i) => xs.slice(0, i < a ? 4 : 2).forEach((x, k) => txt(g, x, y + 24, lab(i, k), "s", "middle")));
      txt(g, 30, 30, `순서 ${nm}`, "s", "start");
      const lim = a > 1 || b > 0;
      txt(g, 30, 150, m == 1 ? "초한귀납법: 앞의 모든 원소에서 참이면 참" : `보통 귀납법: P(첫 원소), P(x) ⇒ P(다음) (${t}걸음)`, m == 1 ? "ta" : "s", "start");
      const first = a > 1 ? 1 : b ? 0 : null;
      read.textContent = !lim
        ? `ω 모양이라 모든 원소가 첫 원소에서 유한 걸음 안에 닿는다. 보통 귀납법으로 충분하다.`
        : m == 1
          ? `초한귀납법은 극한 원소 ${first}에서도 "앞의 모든 원소에서 참"을 쓸 수 있어 모든 원소(파랑)에 닿는다.`
          : `${t}걸음을 가도 파란 점은 첫 블록 안에 머문다. 원소 ${first}(빨강)에는 바로 앞 원소가 없어서, 보통 귀납법의 걸음으로는 영영 닿지 않는다.`;
    });
  });

  // 5.2 폰 노이만 순서수: α는 α보다 작은 순서수 전체의 집합
  Q.def("m2-ordinal", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const L = [[0, 0], [0, 1], [0, 2], [0, 3], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1]];
    const SET = ["∅", "{0}", "{0, 1}", "{0, 1, 2}"];
    Q.bind(fig, ({ k }) => {
      clear(g);
      const [a, b] = L[k], W = 210, y = 70;
      // 순서수 ω·2 + 2까지의 줄을 그리고 α보다 작은 것을 칠한다
      const lt = (i, j) => i < a || (i === a && j < b);
      ordRow(g, 2, 2, 30, y, W, (i, j) => (i === a && j === b ? "fd" : lt(i, j) ? "fa" : "fk"));
      [0, 1, 2, 3].forEach((j) => txt(g, 30 + W * (1 - Math.pow(0.8, j)), y + 24, j, "s", "middle"));
      txt(g, 30 + W, y + 24, "ω", "s", "middle"); txt(g, 30 + 2 * W, y + 24, "ω·2", "s", "middle");
      const nm = ordName(a, b);
      const body = a === 0 ? SET[b] : `{0, 1, 2, …${a >= 1 && (a > 1 || b > 0) ? ", ω" : ""}${a === 1 && b > 1 ? ", ω + 1" : ""}${a === 2 ? ", ω + 1, …" : ""}${a === 2 && b > 0 ? ", ω·2" : ""}}`;
      txt(g, 30, 140, `α = ${nm} = ${body}`, "s", "start").setAttribute("style", MONO + ";font-size:13px");
      const kind = a === 0 && b === 0 ? "가장 작은 순서수" : b > 0 ? `${ordName(a, b - 1)}의 후속 순서수` : "극한 순서수(바로 앞이 없다)";
      read.textContent = `α(= ${nm})는 ${kind}이다. 빨간 점이 α이고, α보다 앞에 오는 파란 점들을 모은 집합이 바로 α이다.`;
    }, (key, v) => ordName(...L[v]));
  });

  // 5.3 순서수 덧셈과 곱셈: 이어 붙이기와 늘어놓기
  Q.def("m2-ordarith", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    // [식, 그리기, 결과 (a, b), 설명]
    const E = [
      ["1 + ω", "1 + ω", [1, 0], "앞에 붙은 점 하나는 뒤의 ω에 흡수되어 맨 뒤 원소가 생기지 않는다."],
      ["ω + 1", "ω + 1", [1, 1], "ω 뒤에 붙은 점은 무한히 많은 원소 뒤에 오는 마지막 원소가 된다."],
      ["2·ω", "2·ω", [1, 0], "두 점짜리 묶음을 ω번 늘어놓으면 다시 ω 모양이다."],
      ["ω·2", "ω·2", [2, 0], "ω 줄을 두 번 늘어놓으면 둘째 줄의 첫 원소가 극한 원소가 된다."],
      ["(ω + 2) + ω", "(ω + 2) + ω", [2, 0], "가운데의 2가 뒤의 ω에 흡수된다."],
      ["ω + 2 + 3", "ω + 2 + 3", [1, 5], "유한한 것끼리는 보통처럼 더해진다."],
    ];
    Q.bind(fig, ({ e }) => {
      clear(g);
      const [nm, , [ra, rb], why] = E[e], y1 = 60, y2 = 150;
      txt(g, 20, 30, nm, "s", "start").setAttribute("style", MONO);
      if (e == 0) { Q.dot(g, 30, y1, "fc", 4); omegaRow(g, 52, 260, y1, () => "fa"); }
      if (e == 1) { omegaRow(g, 30, 260, y1, () => "fa"); el("line", { x1: 296, y1: y1 - 9, x2: 296, y2: y1 + 9, class: "ax" }, g); Q.dot(g, 310, y1, "fc", 4); }
      if (e == 2) omegaRow(g, 30, 280, y1, (k) => (k % 2 ? "fc" : "fa"));
      if (e == 3) { omegaRow(g, 30, 200, y1, () => "fa"); el("line", { x1: 236, y1: y1 - 9, x2: 236, y2: y1 + 9, class: "ax" }, g); omegaRow(g, 250, 200, y1, () => "fc"); }
      if (e == 4) { omegaRow(g, 30, 180, y1, () => "fa"); el("line", { x1: 216, y1: y1 - 9, x2: 216, y2: y1 + 9, class: "ax" }, g); Q.dot(g, 228, y1, "fb", 4); Q.dot(g, 246, y1, "fb", 4); omegaRow(g, 266, 190, y1, () => "fc"); }
      if (e == 5) { omegaRow(g, 30, 200, y1, () => "fa"); el("line", { x1: 236, y1: y1 - 9, x2: 236, y2: y1 + 9, class: "ax" }, g); [0, 1].forEach((j) => Q.dot(g, 250 + j * 18, y1, "fb", 4)); [0, 1, 2].forEach((j) => Q.dot(g, 286 + j * 18, y1, "fc", 4)); }
      txt(g, 20, y2 - 30, `결과의 모양 ${ordName(ra, rb)}`, "ta", "start").setAttribute("style", MONO);
      ordRow(g, ra, rb, 30, y2, ra === 2 ? 210 : 300, () => "fk");
      read.textContent = `${nm} = ${ordName(ra, rb)}. ${why}`;
    });
  });

  // 6.1 부분 순서 집합의 하세 그림: 사슬, 상계, 극대 원소
  Q.def("m2-hasse", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    // [원소 이름, 위치, le(i, j), 고를 부분집합 목록]
    const P = [
      {
        nm: ["∅", "{1}", "{2}", "{3}", "{1,2}", "{1,3}", "{2,3}"],
        xy: [[200, 190], [110, 125], [200, 125], [290, 125], [110, 50], [200, 50], [290, 50]],
        bits: [0, 1, 2, 4, 3, 5, 6],
        le(i, j) { return (this.bits[i] & this.bits[j]) === this.bits[i]; },
        S: [[0, 1, 4], [0, 2], [1, 2], [3, 5], [0], [1, 2, 4]],
      },
      {
        nm: ["2", "3", "4", "6", "8", "12"],
        xy: [[130, 190], [270, 190], [100, 120], [230, 120], [70, 50], [200, 50]],
        v: [2, 3, 4, 6, 8, 12],
        le(i, j) { return this.v[j] % this.v[i] === 0; },
        S: [[0, 2, 4], [1, 3, 5], [0, 1], [0, 3], [2, 3], [0, 2, 5]],
      },
    ];
    Q.bind(fig, ({ p, s }) => {
      clear(g);
      const Pp = P[p], n = Pp.nm.length, S = Pp.S[Math.min(s, Pp.S.length - 1)];
      const le = (i, j) => Pp.le(i, j), lt = (i, j) => i !== j && le(i, j);
      // 덮개 관계만 선으로
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (lt(i, j) && ![...Array(n).keys()].some((k) => lt(i, k) && lt(k, j))) Q.line(g, Pp.xy[i][0], Pp.xy[i][1], Pp.xy[j][0], Pp.xy[j][1], "ax");
      const chain = S.every((i) => S.every((j) => le(i, j) || le(j, i)));
      const ub = [...Array(n).keys()].filter((u) => S.every((c) => le(c, u)));
      const maxl = [...Array(n).keys()].filter((m) => ![...Array(n).keys()].some((x) => lt(m, x)));
      for (let i = 0; i < n; i++) {
        const [x, y] = Pp.xy[i], inS = S.includes(i);
        el("rect", { x: x - 26, y: y - 13, width: 52, height: 24, class: inS ? (chain ? "la" : "ld") : ub.includes(i) ? "lb" : "lk" }, g);
        if (maxl.includes(i)) el("rect", { x: x - 28, y: y - 15, width: 56, height: 28, class: "c" }, g);
        txt(g, x, y + 4, Pp.nm[i], "s", "middle").setAttribute("style", MONO + ";font-size:12px");
      }
      txt(g, 350, 60, "고른 집합 C", chain ? "ta" : "td", "start"); txt(g, 350, 84, "C의 상계", "tb", "start"); txt(g, 350, 108, "극대 원소(테두리)", "tc", "start");
      const nmS = `{${S.map((i) => Pp.nm[i]).join(", ")}}`, nmU = ub.length ? ub.map((i) => Pp.nm[i]).join(", ") : "없음";
      read.textContent = (chain ? `C = ${nmS}에서는 모든 두 원소가 비교되므로 C는 사슬이다.` : `C = ${nmS}에는 비교되지 않는 두 원소가 있어 C는 사슬이 아니다.`) + ` C의 상계(청록)는 ${nmU}이고, 극대 원소는 ${maxl.length}개(${maxl.map((i) => Pp.nm[i]).join(", ")})이다.`;
    }, (k, v) => (k === "s" ? `${v + 1}번` : num(v)));
  });

  // 6.2 초른 절차의 마지막 단계: 극대 일차독립 집합은 공간을 생성한다
  Q.def("m2-zorn", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(-3, 3, -2.2, 2.2, 30, 330, 10, 230);
    Q.bind(fig, ({ a, b, add }) => {
      clear(g);
      const u = [2 * Math.cos(a * Math.PI / 180), 2 * Math.sin(a * Math.PI / 180)], v = [1.6 * Math.cos(b * Math.PI / 180), 1.6 * Math.sin(b * Math.PI / 180)];
      const dep = Math.abs(u[0] * v[1] - u[1] * v[0]) < 1e-6 || Math.abs(Math.sin((a - b) * Math.PI / 180)) < 0.02;
      if (add && !dep) el("rect", { x: 30, y: 10, width: 300, height: 220, class: "la" }, g);
      Q.axes(g, F, { step: 1, label: false });
      const L = 6; el("line", { x1: F.x(-L * u[0]), y1: F.y(-L * u[1]), x2: F.x(L * u[0]), y2: F.y(L * u[1]), class: "a" }, g).setAttribute("style", "opacity:.45");
      Q.arrow(g, F.x(0), F.y(0), F.x(u[0]), F.y(u[1]), "a"); txt(g, F.x(u[0] * 1.12), F.y(u[1] * 1.12) + 4, "u", "ta", "middle");
      Q.arrow(g, F.x(0), F.y(0), F.x(v[0]), F.y(v[1]), add ? (dep ? "d" : "b") : "k dsh"); txt(g, F.x(v[0] * 1.18), F.y(v[1] * 1.18) + 4, "v", add ? (dep ? "td" : "tb") : "s", "middle");
      const S = add ? "{u, v}" : "{u}";
      txt(g, 350, 50, `S = ${S}`, "s", "start").setAttribute("style", MONO);
      txt(g, 350, 76, add ? (dep ? "일차종속" : "일차독립") : "일차독립", add && dep ? "td" : "ta", "start");
      txt(g, 350, 102, add && !dep ? "span S = 평면" : "span S = 직선", "s", "start");
      read.textContent = !add
        ? `S = {u}의 생성 공간은 파란 직선뿐이다. 그 밖의 v를 더해도 일차독립이므로 S는 극대가 아니다. 증명의 4단계가 바로 이 논리이다.`
        : dep
          ? `v가 u와 평행해 {u, v}는 일차종속이다. 이런 집합은 모임 𝒫에 들어가지 않는다.`
          : `{u, v}는 일차독립이고 평면 전체를 생성한다. 어떤 벡터 w를 더해도 종속이 되므로 극대 원소이고, 곧 기저이다.`;
    }, (k, v) => (k === "add" ? (v ? "더함" : "안 더함") : `${num(v)}°`));
  });

  // ── 새 그림은 이 위에 ──
})();
