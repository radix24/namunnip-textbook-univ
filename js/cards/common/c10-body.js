/* 공통10(전자계산 1) 본문 카드의 조작 그림 (js/lib/qfig.js의 NMQ를 쓴다). 그림마다 NMQ.def("이름", …). */
(() => {
  "use strict";
  const Q = window.NMQ;
  if (!Q) return;
  const { el, clear, txt, num } = Q;
  const PI = Math.PI;
  const rect = (g, F, x0, y0, x1, y1, cls) => el("rect", { x: Math.min(F.x(x0), F.x(x1)), y: Math.min(F.y(y0), F.y(y1)), width: Math.abs(F.x(x1) - F.x(x0)), height: Math.abs(F.y(y1) - F.y(y0)), class: cls }, g);
  const poly = (g, F, pts, cls, open) => el("path", { d: pts.map((p, i) => (i ? "L" : "M") + F.x(p[0]).toFixed(1) + " " + F.y(p[1]).toFixed(1)).join("") + (open ? "" : "Z"), class: cls }, g);
  const line = (g, F, pts, cls) => { if (pts.length > 1) poly(g, F, pts, cls, true).setAttribute("style", "fill:none"); };
  const axl = (g, F, xt, yt, xs, ys) => {
    Q.line(g, F.X0, F.Y1, F.X1, F.Y1, "ax"); Q.line(g, F.X0, F.Y1, F.X0, F.Y0, "ax");
    xt.forEach((v) => txt(g, F.x(v), F.Y1 + 14, typeof v === "number" ? num(v) : v, "s", "middle"));
    yt.forEach((v) => txt(g, F.X0 - 5, F.y(v) + 4, num(v), "s", "end"));
    if (xs) txt(g, F.X1 - 4, F.Y1 - 6, xs, "i", "end");
    if (ys) txt(g, F.X0 + 6, F.Y0 + 12, ys, "i");
  };
  // 코드 한 줄(고정폭)을 그린다. on이면 실행 중인 줄로 칠한다
  const codeLines = (g, x, y, lines, cur, h) => {
    const H = h || 22;
    lines.forEach((s, i) => {
      if (i === cur) el("rect", { x: x - 6, y: y + i * H - 15, width: 250, height: H - 2, class: "lc" }, g);
      txt(g, x - 10, y + i * H, String(i + 1), "s", "end");
      txt(g, x, y + i * H, s, "s", "start").setAttribute("style", "font-family:var(--f-mono, monospace);font-size:12.5px;white-space:pre");
    });
  };
  // 이름표가 붙은 상자(변수)
  const box = (g, x, y, name, val, hot, w) => {
    const W = w || 90;
    el("rect", { x, y, width: W, height: 30, class: hot ? "la" : "lk" }, g);
    txt(g, x + W / 2, y + 20, val, "s", "middle").setAttribute("style", "font-family:var(--f-mono, monospace)");
    txt(g, x + W / 2, y - 5, name, "s", "middle");
  };

  // 1.1 대입은 상자에 값을 넣는 것: 한 줄씩 실행
  Q.def("c10-assign", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const L = ["g = 9.8", "t = 3", "h = 0.5 * g * t ** 2", "t = t + 1", "h = 0.5 * g * t ** 2"];
    const S = [{}, { g: 9.8 }, { g: 9.8, t: 3 }, { g: 9.8, t: 3, h: 44.1 }, { g: 9.8, t: 4, h: 44.1 }, { g: 9.8, t: 4, h: 78.4 }];
    const say = ["아직 아무것도 실행하지 않았다.", "이름 g에 9.8을 넣는다.", "이름 t에 3을 넣는다.", "오른쪽을 먼저 계산(t ** 2 → 9, 0.5 * 9.8 * 9 = 44.1)한 뒤 h에 넣는다.", "오른쪽 t + 1 = 4를 계산해 t에 다시 넣는다. '같다'가 아니라 '넣는다'이다.", "같은 식이지만 t가 4로 바뀌었으므로 h는 78.4가 된다."];
    Q.bind(fig, ({ s }) => {
      clear(g);
      codeLines(g, 50, 50, L, s - 1);
      const st = S[s], prev = S[Math.max(0, s - 1)];
      ["g", "t", "h"].forEach((k, i) => box(g, 330 + (i % 2) * 100, 50 + Math.floor(i / 2) * 70, k, st[k] === undefined ? "" : num(st[k], 2), st[k] !== prev[k] && s > 0));
      txt(g, 330, 200, "메모리(변수)", "s", "start");
      read.textContent = `${s}번째 줄까지 실행: ${say[s]}`;
    });
  });

  // 1.2 if / elif / else: 처음 참인 한 곳만
  Q.def("c10-ifflow", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ p }) => {
      clear(g);
      const c1 = p < 7, c2 = !c1 && p === 7;
      const node = (x, y, w, s, on, cls) => { el("rect", { x: x - w / 2, y: y - 15, width: w, height: 30, class: on ? cls || "la" : "lk" }, g); txt(g, x, y + 4, s, "s", "middle").setAttribute("style", "font-family:var(--f-mono, monospace)"); };
      node(110, 40, 110, `pH = ${p}`, true, "lb");
      node(110, 100, 110, "pH < 7 ?", true); node(110, 170, 110, "pH == 7 ?", !c1);
      node(300, 100, 100, '"산성"', c1, "lc"); node(300, 170, 100, '"중성"', c2, "lc"); node(110, 235, 110, '"염기성"', !c1 && !c2, "lc");
      node(450, 170, 80, '"끝"', true, "lb");
      Q.arrow(g, 110, 55, 110, 83, "k", "fk"); Q.arrow(g, 165, 100, 248, 100, c1 ? "d" : "gd", c1 ? "fd" : "fk"); txt(g, 205, 94, "참", "s", "middle");
      Q.arrow(g, 110, 115, 110, 153, !c1 ? "d" : "gd", !c1 ? "fd" : "fk"); txt(g, 120, 138, "거짓", "s", "start");
      Q.arrow(g, 165, 170, 248, 170, c2 ? "d" : "gd", c2 ? "fd" : "fk"); txt(g, 205, 164, "참", "s", "middle");
      Q.arrow(g, 110, 185, 110, 218, !c1 && !c2 ? "d" : "gd", !c1 && !c2 ? "fd" : "fk"); txt(g, 120, 205, "거짓", "s", "start");
      [[350, 100], [350, 170], [165, 235]].forEach(([x, y]) => Q.arrow(g, x, y, 408, 170, "gd", "fk"));
      read.textContent = `pH = ${p}: ` + (c1 ? "첫 조건 pH < 7이 참이라 \"산성\"만 실행하고, 나머지 조건은 보지도 않는다." : c2 ? "첫 조건은 거짓, 둘째 조건 pH == 7이 참이라 \"중성\"을 실행한다." : "두 조건이 모두 거짓이라 else의 \"염기성\"을 실행한다.") + " 들여쓰지 않은 print(\"끝\")은 늘 실행된다.";
    });
  });

  // 1.3 논리 오류 찾기: range(1, n)은 n을 빼먹는다
  Q.def("c10-range", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ n, fix }) => {
      clear(g);
      const end = fix == 1 ? n + 1 : n, xs = []; for (let i = 1; i < end; i++) xs.push(i);
      const W = Math.min(34, 440 / (n + 1));
      for (let i = 1; i <= n; i++) { const on = i < end; el("rect", { x: 40 + (i - 1) * W, y: 60, width: W - 4, height: 34, class: on ? "la" : "ld" }, g); txt(g, 40 + (i - 1) * W + (W - 4) / 2, 82, i, "s", "middle"); }
      txt(g, 40, 45, fix == 1 ? `range(1, n + 1)이 만드는 i` : `range(1, n)이 만드는 i`, "s", "start").setAttribute("style", "font-family:var(--f-mono, monospace)");
      const s = xs.reduce((a, b) => a + b, 0), want = (n * (n + 1)) / 2;
      txt(g, 40, 140, `print(i, s) 마지막 줄: ${xs.length ? xs[xs.length - 1] : "-"} ${s}`, "s", "start").setAttribute("style", "font-family:var(--f-mono, monospace)");
      txt(g, 40, 170, `기대한 답 ${want}, 얻은 답 ${s}, 차이 ${want - s}`, want === s ? "ta" : "td", "start");
      read.textContent = fix == 1 ? `range(1, ${n} + 1)은 1부터 ${n}까지를 만든다. 합 ${s}로 기대한 답과 같다.` : `range(1, ${n})은 끝값 ${n}을 포함하지 않는다(빨간 칸). 그래서 합이 ${s}로 ${want}보다 ${n}만큼 작다. 차이가 마지막 항 하나라는 것이 단서이다.`;
    });
  });

  // 2.1 슬라이스 a[시작:끝:간격]
  Q.def("c10-slice", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const a = [0, 10, 20, 30, 40, 50];
    Q.bind(fig, ({ s, e, k }) => {
      clear(g);
      const n = a.length, W = 60, X = 80, Y = 70;
      let idx = [];
      if (k > 0) { for (let i = s; i < e; i += k) idx.push(i); } else { const s2 = s === 0 ? n - 1 : s, e2 = e === n ? -1 : e; for (let i = s2; i > e2; i += k) idx.push(i); }
      idx = idx.filter((i) => i >= 0 && i < n);
      a.forEach((v, i) => { el("rect", { x: X + i * W, y: Y, width: W - 4, height: 40, class: idx.includes(i) ? "la" : "lk" }, g); txt(g, X + i * W + 28, Y + 25, v, "s", "middle"); txt(g, X + i * W + 28, Y - 8, i, "s", "middle"); txt(g, X + i * W + 28, Y + 58, i - n, "td", "middle"); });
      txt(g, X - 10, Y - 8, "인덱스", "s", "end"); txt(g, X - 10, Y + 58, "음수 인덱스", "td", "end");
      if (k > 0) { el("rect", { x: X + s * W - 3, y: Y - 22, width: 3, height: 90, class: "fc" }, g); el("rect", { x: X + e * W - 5, y: Y - 22, width: 3, height: 90, class: "fd" }, g); }
      const res = "[" + idx.map((i) => a[i]).join(", ") + "]";
      const code = k > 0 ? `a[${s}:${e}${k !== 1 ? ":" + k : ""}]` : "a[::-1]";
      txt(g, X, 190, `${code}  →  ${res}`, "s", "start").setAttribute("style", "font-family:var(--f-mono, monospace);font-size:14px");
      read.textContent = k > 0 ? `${code}: ${s}번(주황 막대)부터 ${e}번(빨간 막대) 바로 앞까지 ${k}칸 간격으로 골라 길이 ${idx.length}인 새 리스트 ${res}를 만든다.` : `a[::-1]: 간격 −1이면 끝에서부터 거꾸로 모두 고른다 → ${res}.`;
    });
  });

  // 2.2 딕셔너리: 키로 값을 찾는다
  Q.def("c10-dict", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const M = [["H", 1.008], ["C", 12.011], ["O", 15.999], ["N", 14.007]], keys = ["H", "C", "O", "N", "Na"];
    Q.bind(fig, ({ k }) => {
      clear(g);
      const key = keys[k], hit = M.findIndex((p) => p[0] === key);
      txt(g, 60, 30, "M", "s", "start").setAttribute("style", "font-family:var(--f-mono, monospace);font-size:14px");
      M.forEach(([kk, v], i) => { const y = 45 + i * 40, on = i === hit; el("rect", { x: 60, y, width: 60, height: 32, class: on ? "lc" : "lk" }, g); el("rect", { x: 124, y, width: 90, height: 32, class: on ? "la" : "lk" }, g); txt(g, 90, y + 21, `"${kk}"`, "s", "middle"); txt(g, 169, y + 21, v, "s", "middle"); });
      txt(g, 90, 222, "키", "s", "middle"); txt(g, 169, 222, "값", "s", "middle");
      const mono = "font-family:var(--f-mono, monospace)";
      txt(g, 280, 70, `M["${key}"]`, "s", "start").setAttribute("style", mono + ";font-size:15px");
      txt(g, 280, 100, hit >= 0 ? `→ ${M[hit][1]}` : "→ KeyError", hit >= 0 ? "ta" : "td", "start").setAttribute("style", mono);
      txt(g, 280, 140, `"${key}" in M → ${hit >= 0 ? "True" : "False"}`, "s", "start").setAttribute("style", mono);
      txt(g, 280, 170, `M.get("${key}", 0) → ${hit >= 0 ? M[hit][1] : 0}`, "s", "start").setAttribute("style", mono);
      if (hit >= 0) Q.arrow(g, 216, 61 + hit * 40, 272, 66, "c", "fc");
      read.textContent = hit >= 0 ? `키 "${key}"로 찾으면 번호를 몰라도 값 ${M[hit][1]}이 바로 나온다.` : `"Na"는 키가 아니므로 M["Na"]는 KeyError이다. 없을 수도 있는 키는 in으로 먼저 확인하거나 get으로 기본값을 준다.`;
    });
  });

  // 2.3 while 문: 200만 원이 될 때까지
  Q.def("c10-while", (fig, svg) => {
    const F = Q.frame(0.3, 16.7, 0, 230, 60, 490, 20, 220), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ y }) => {
      clear(g);
      axl(g, F, [1, 5, 10, 15], [100, 200], "year", "money");
      Q.line(g, F.x(0.3), F.y(200), F.x(16.7), F.y(200), "d dsh"); txt(g, F.x(16.6), F.y(200) - 5, "money < 200 조건의 경계", "td", "end");
      let m = 100, yr = 0;
      while (m < 200 && yr < y) { m *= 1.05; yr++; el("rect", { x: F.x(yr - 0.4), y: F.y(m), width: F.x(yr + 0.4) - F.x(yr - 0.4), height: F.y(0) - F.y(m), class: m >= 200 ? "lc" : "la" }, g); }
      const done = m >= 200;
      read.textContent = done ? `${yr}번 되풀이한 뒤 money = ${num(m, 1)}이 되어 조건 money < 200이 거짓이므로 while을 빠져나온다. 출력은 ${yr} ${num(m, 1)}이다.` : `${yr}번 되풀이: money = ${num(m, 1)}. 아직 200보다 작으므로 다음 차례를 실행한다.`;
    });
  });

  const MONO = "font-family:var(--f-mono, monospace)";

  // 3.1 재귀의 호출 스택: fact(n)
  Q.def("c10-stack", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ n, s }) => {
      clear(g);
      // 단계: 0..n-1 호출을 쌓고(push), n..2n-1 돌아온다(pop)
      const total = 2 * n, st = Math.min(s, total - 1);
      const depth = st < n ? st + 1 : 2 * n - st - 1 + 1;
      const returning = st >= n;
      const H = 30, X = 60, Y0 = 230;
      for (let d = 0; d < depth; d++) {
        const k = n - d, top = d === depth - 1;
        let lab = `fact(${k})  n = ${k}`;
        if (returning && top) { let v = 1; for (let j = 1; j <= k; j++) v *= j; lab += `  → ${v} 돌려줌`; }
        el("rect", { x: X, y: Y0 - (d + 1) * H, width: 230, height: H - 3, class: top ? (returning ? "lc" : "la") : "lk" }, g);
        txt(g, X + 10, Y0 - (d + 1) * H + 19, lab, "s", "start").setAttribute("style", MONO);
      }
      txt(g, X, Y0 + 18, "호출 스택 (아래가 먼저 부른 것)", "s", "start");
      let msg;
      if (!returning) msg = st === n - 1 ? `fact(1)은 기저 사례라 바로 1을 돌려준다.` : `fact(${n - st})이 n * fact(${n - st - 1})을 계산하려고 fact(${n - st - 1})을 부르고 기다린다.`;
      else { const k = n - (2 * n - st - 1); let v = 1; for (let j = 1; j <= k; j++) v *= j; msg = `fact(${k}) = ${k} × fact(${k - 1}) = ${v}을 돌려주고 스택에서 사라진다.`; }
      txt(g, 320, 60, `fact(${n}) = ${[1, 1, 2, 6, 24, 120, 720][n]}`, "s", "start").setAttribute("style", MONO + ";font-size:15px");
      txt(g, 320, 90, `쌓인 호출 ${depth}개`, "s", "start");
      read.textContent = `${st + 1}단계: ${msg}`;
    });
  });

  // 3.2 파일을 한 줄씩: 건너뛰기와 숫자로 바꾸기
  Q.def("c10-lines", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const L = ["# t  T", "0   20.1", "30  24.8", "60  29.2", "90  33.0"];
    Q.bind(fig, ({ s }) => {
      clear(g);
      const ts = [], Ts = [];
      L.forEach((ln, i) => {
        const y = 40 + i * 32, done = i < s, cur = i === s - 1, skip = ln.startsWith("#");
        el("rect", { x: 40, y: y - 18, width: 150, height: 26, class: cur ? "lc" : done ? (skip ? "lk" : "la") : "lk" }, g);
        txt(g, 50, y, ln, "s", "start").setAttribute("style", MONO);
        if (done) { if (skip) txt(g, 200, y, "continue (주석)", "s", "start"); else { const [a, b] = ln.split(/\s+/).map(Number); ts.push(a); Ts.push(b); txt(g, 200, y, `ts += ${a},  Ts += ${b}`, "ta", "start").setAttribute("style", MONO); } }
      });
      txt(g, 40, 215, `ts = [${ts.join(", ")}]`, "s", "start").setAttribute("style", MONO);
      txt(g, 40, 237, `Ts = [${Ts.join(", ")}]`, "s", "start").setAttribute("style", MONO);
      const rate = ts.length > 1 ? (Ts[Ts.length - 1] - Ts[0]) / (ts[ts.length - 1] - ts[0]) : null;
      txt(g, 380, 60, rate === null ? "rate = ?" : `rate = ${rate.toFixed(4)}`, "s", "start").setAttribute("style", MONO + ";font-size:14px");
      read.textContent = s === 0 ? "아직 아무 줄도 읽지 않았다." : s === 1 ? "첫 줄은 #으로 시작하는 주석이라 continue로 건너뛴다." : `${s}번째 줄 "${L[s - 1]}"을 strip, split한 뒤 float로 바꿔 두 리스트에 넣었다.` + (s === L.length ? ` 평균 가열 속도 (33.0 − 20.1)/(90 − 0) = ${rate.toFixed(4)} °C/s.` : "");
    });
  });

  // 3.3 같은 클래스, 다른 객체: self는 자기 자신
  Q.def("c10-obj", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ k }) => {
      clear(g);
      const p = { m: 2, x: 0, v: 3 }, q = { m: 1, x: 5, v: -2 };
      for (let i = 0; i < k; i++) { p.x += p.v * 0.5; q.x += q.v * 0.5; }
      [[p, "p", 40, "la"], [q, "q", 280, "lb"]].forEach(([o, nm, x, cl]) => {
        el("rect", { x, y: 30, width: 200, height: 120, class: cl }, g);
        txt(g, x + 10, 52, `${nm}: Particle 객체`, "s", "start");
        [["m", o.m], ["x", o.x], ["v", o.v]].forEach(([a, v], i) => txt(g, x + 20, 80 + i * 22, `self.${a} = ${num(v, 2)}`, "s", "start").setAttribute("style", MONO));
        txt(g, x + 10, 172, `${nm}.kinetic() → ${num(0.5 * o.m * o.v * o.v, 2)}`, "s", "start").setAttribute("style", MONO);
      });
      const F = Q.frame(-1, 7, 0, 1, 40, 480, 190, 240);
      Q.line(g, F.x(-1), F.y(0.5), F.x(7), F.y(0.5), "ax"); [0, 2, 4, 6].forEach((v) => txt(g, F.x(v), F.y(0.5) + 14, v, "s", "middle"));
      Q.dot(g, F.x(p.x), F.y(0.5), "fa", 6); Q.dot(g, F.x(q.x), F.y(0.5), "fb", 6);
      read.textContent = `move(0.5)를 ${k}번 부른 뒤: p.x = ${num(p.x, 2)}, q.x = ${num(q.x, 2)}. 같은 메서드를 불러도 self가 각자 자기 객체를 가리키므로, 두 입자는 각자의 x와 v로 움직인다.`;
    });
  });

  // 3.4 try / except로 잘못된 줄을 넘긴다
  Q.def("c10-try", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const L = ["1.2", "abc", "3.4", "", "5.0", "2,5"];
    Q.bind(fig, ({ s }) => {
      clear(g);
      let total = 0; const bad = [];
      L.forEach((ln, i) => {
        const y = 40 + i * 30, done = i < s, cur = i === s - 1, ok = ln !== "" && !isNaN(Number(ln)) && !ln.includes(",");
        if (done) { if (ok) total += Number(ln); else bad.push(i + 1); }
        el("rect", { x: 40, y: y - 18, width: 90, height: 24, class: cur ? "lc" : done ? (ok ? "la" : "ld") : "lk" }, g);
        txt(g, 30, y, i + 1, "s", "end"); txt(g, 50, y, `"${ln}"`, "s", "start").setAttribute("style", MONO);
        if (done) txt(g, 140, y, ok ? `try: total += ${ln}` : "except ValueError: bad.append", ok ? "ta" : "td", "start").setAttribute("style", MONO);
      });
      txt(g, 360, 80, `total = ${num(total, 2)}`, "s", "start").setAttribute("style", MONO + ";font-size:14px");
      txt(g, 360, 110, `bad = [${bad.join(", ")}]`, "s", "start").setAttribute("style", MONO + ";font-size:14px");
      const ln = L[s - 1];
      read.textContent = s === 0 ? "아직 아무 줄도 처리하지 않았다." : (bad.includes(s) ? `${s}번 줄 "${ln}"은 float로 바꿀 수 없어 ValueError가 난다. 멈추지 않고 except에서 줄 번호만 적고 다음 줄로 간다.` : `${s}번 줄 "${ln}"은 숫자로 바뀌어 total에 더해진다.`) + (s === L.length ? " 결과 9.6 [2, 4, 6]." : "");
    });
  });

  // 4.1 C의 식은 자료형을 따라 계산된다
  Q.def("c10-intdiv", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const X = [
      ["7 / 2", [["7 / 2", "int / int", "3", "int"]], "3", "정수끼리 나누면 몫만 남는다."],
      ["7 / 2.0", [["7 / 2.0", "int / double", "3.5", "double"]], "3.500000", "한쪽이 double이면 다른 쪽도 double로 바뀌어 실수 나눗셈을 한다."],
      ["(double)7 / 2", [["(double)7", "형 변환", "7.0", "double"], ["7.0 / 2", "double / int", "3.5", "double"]], "3.500000", "(double)이 먼저 7을 7.0으로 바꾼 뒤 나눈다."],
      ["1 / 2 * 9.8", [["1 / 2", "int / int", "0", "int"], ["0 * 9.8", "int * double", "0.0", "double"]], "0.000000", "왼쪽부터 계산하므로 1/2가 먼저 0이 되고, 그 뒤에 9.8을 곱해도 0이다."],
      ["1.0 / 2 * 9.8", [["1.0 / 2", "double / int", "0.5", "double"], ["0.5 * 9.8", "double * double", "4.9", "double"]], "4.900000", "1.0으로 쓰면 처음부터 실수 나눗셈이 되어 기대한 4.9가 나온다."],
    ];
    Q.bind(fig, ({ k }) => {
      clear(g);
      const [ex, steps, out, say] = X[k], M = "font-family:var(--f-mono, monospace)";
      txt(g, 40, 40, ex, "s", "start").setAttribute("style", M + ";font-size:16px");
      steps.forEach(([a, ty, v, rt], i) => {
        const y = 80 + i * 55;
        el("rect", { x: 40, y: y - 18, width: 150, height: 30, class: "lk" }, g); txt(g, 50, y + 2, a, "s", "start").setAttribute("style", M);
        txt(g, 200, y + 2, ty, "s", "start");
        Q.arrow(g, 300, y - 3, 340, y - 3, "k", "fk");
        el("rect", { x: 345, y: y - 18, width: 70, height: 30, class: rt === "int" ? "lc" : "la" }, g); txt(g, 380, y + 2, v, "s", "middle").setAttribute("style", M);
        txt(g, 425, y + 2, rt, rt === "int" ? "tc" : "ta", "start");
      });
      txt(g, 40, 215, `printf("%f") 결과: ${out}`, "s", "start").setAttribute("style", M);
      read.textContent = `${ex}: ${say}`;
    });
  });

  // 4.2 C의 for: 초기화 → 조건 → 몸체 → 증감
  Q.def("c10-cfor", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    // for (int i = 10; i > 0; i -= 2) { printf("%d ", i); }
    const ev = [["init", 10]]; let i = 10; while (true) { ev.push(["cond", i, i > 0]); if (!(i > 0)) break; ev.push(["body", i]); i -= 2; ev.push(["upd", i]); }
    Q.bind(fig, ({ s }) => {
      clear(g);
      const st = Math.min(s, ev.length - 1), e = ev[st], M = "font-family:var(--f-mono, monospace)";
      const parts = [["for (", ""], ["int i = 10", "init"], ["; ", ""], ["i > 0", "cond"], ["; ", ""], ["i -= 2", "upd"], [") {", ""]];
      let x = 30; parts.forEach(([p, kk]) => { const w = p.length * 8.2; if (kk === e[0]) el("rect", { x: x - 2, y: 32, width: w + 4, height: 24, class: kk === "cond" && e[2] === false ? "ld" : "lc" }, g); txt(g, x, 50, p, "s", "start").setAttribute("style", M + ";font-size:14px;white-space:pre"); x += w; });
      if (e[0] === "body") el("rect", { x: 46, y: 64, width: 200, height: 24, class: "lc" }, g);
      txt(g, 50, 82, 'printf("%d ", i);', "s", "start").setAttribute("style", M + ";font-size:14px"); txt(g, 30, 110, "}", "s", "start").setAttribute("style", M + ";font-size:14px");
      let printed = []; for (let j = 0; j <= st; j++) if (ev[j][0] === "body") printed.push(ev[j][1]);
      txt(g, 30, 160, `i = ${e[1]}`, "s", "start").setAttribute("style", M + ";font-size:15px");
      txt(g, 30, 195, `출력: ${printed.join(" ")}`, "s", "start").setAttribute("style", M + ";font-size:15px");
      const say = { init: "처음 한 번만 i를 10으로 초기화한다.", cond: e[2] ? `조건 i > 0이 참(i = ${e[1]})이라 몸체로 간다.` : `조건 i > 0이 거짓(i = ${e[1]})이라 반복을 끝낸다.`, body: `몸체에서 ${e[1]}을 출력한다.`, upd: `증감식으로 i를 2 줄여 ${e[1]}이 된다. 다시 조건으로 간다.` };
      read.textContent = `${st + 1}단계: ${say[e[0]]} 파이썬의 for i in range(10, 0, -2)와 같은 순서이다.`;
    });
  });

  // 4.3 값에 의한 전달: x는 a의 복사본
  Q.def("c10-byval", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const M = "font-family:var(--f-mono, monospace)";
    const code = ["int a = 5;", "twice(a);  /* x = a 복사 */", "  x = 2 * x;", "  /* twice 끝: x 사라짐 */", 'printf("%d", a);'];
    Q.bind(fig, ({ s }) => {
      clear(g);
      code.forEach((c, i) => { if (i === s) el("rect", { x: 26, y: 32 + i * 30, width: 230, height: 26, class: "lc" }, g); txt(g, 30, 50 + i * 30, c, "s", "start").setAttribute("style", M + ";white-space:pre"); });
      el("rect", { x: 300, y: 40, width: 190, height: 70, class: "lk" }, g); txt(g, 310, 58, "main의 칸", "s", "start");
      box(g, 340, 70, "", "5", s === 0, 70); txt(g, 330, 90, "a", "s", "end");
      if (s >= 1 && s <= 2) { el("rect", { x: 300, y: 130, width: 190, height: 70, class: "lk" }, g); txt(g, 310, 148, "twice의 칸", "s", "start"); box(g, 340, 160, "", s === 1 ? "5" : "10", s >= 1, 70); txt(g, 330, 180, "x", "s", "end"); if (s === 1) Q.arrow(g, 375, 102, 375, 158, "c", "fc"); }
      if (s === 4) txt(g, 300, 230, "출력: 5", "ta", "start").setAttribute("style", M + ";font-size:14px");
      const say = ["a에 5를 넣는다.", "twice(a)를 부르면 a의 값 5가 새 칸 x에 복사된다(주황 화살표).", "x를 10으로 바꾸지만, 바뀌는 것은 twice의 칸뿐이다.", "함수가 끝나면 x의 칸이 사라진다. a는 처음부터 건드린 적이 없다.", "그래서 a는 여전히 5이다. a를 바꾸게 하려면 주소를 넘겨야 한다(5.2절)."];
      read.textContent = say[s];
    });
  });

  // 메모리 칸 한 줄: cells = [[주소, 값, 이름, 강조]]
  const memRow = (g, x, y, cells, w) => cells.forEach(([ad, v, nm, cls], i) => {
    const W = w || 70;
    el("rect", { x: x + i * W, y, width: W - 3, height: 34, class: cls || "lk" }, g);
    txt(g, x + i * W + (W - 3) / 2, y + 22, v, "s", "middle").setAttribute("style", MONO);
    txt(g, x + i * W + (W - 3) / 2, y - 6, ad, "s", "middle").setAttribute("style", MONO + ";font-size:10px");
    if (nm) txt(g, x + i * W + (W - 3) / 2, y + 52, nm, "s", "middle").setAttribute("style", MONO + ";font-size:11px");
  });

  // 5.1 배열은 이어진 칸: 범위를 벗어나도 C는 막지 않는다
  Q.def("c10-arr", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const T = [20.1, 20.6, 21.3, 22.0, 22.8];
    Q.bind(fig, ({ i }) => {
      clear(g);
      const base = 0x1000, cells = [];
      cells.push([(base - 8).toString(16), "??", "(다른 변수)", i === -1 ? "ld" : "lk"]);
      T.forEach((v, k) => cells.push([(base + 8 * k).toString(16), v.toFixed(1), `T[${k}]`, k === i ? "la" : "lb"]));
      cells.push([(base + 40).toString(16), "??", "(다른 변수)", i === 5 ? "ld" : "lk"]);
      memRow(g, 15, 70, cells, 70);
      txt(g, 20, 40, "메모리 주소 (double은 8바이트)", "s", "start");
      const ok = i >= 0 && i < 5;
      txt(g, 20, 175, `T[${i}]`, "s", "start").setAttribute("style", MONO + ";font-size:15px");
      txt(g, 90, 175, ok ? `= ${T[i].toFixed(1)}   (주소 0x${(base + 8 * i).toString(16)})` : `→ 오류 없이 0x${(base + 8 * i).toString(16)}의 엉뚱한 값을 읽는다`, ok ? "ta" : "td", "start");
      read.textContent = ok ? `T[${i}]의 주소는 시작 주소 + ${i} × 8바이트이다. 계산 한 번으로 바로 찾는다.` : `T[${i}]는 배열 밖이다. 파이썬이라면 IndexError가 나지만, C는 범위를 검사하지 않고 그 자리의 메모리(빨강)를 그대로 읽거나 써 버린다.`;
    });
  });

  // 5.2 포인터 더하기는 자료형 크기 단위
  Q.def("c10-ptr", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ t, k }) => {
      clear(g);
      const sz = t == 0 ? 4 : 8, a = t == 0 ? [10, 20, 30, 40] : [1.5, 2.5, 3.5, 4.5], base = 0x2000;
      const cells = a.map((v, j) => [`0x${(base + sz * j).toString(16)}`, String(v), `a[${j}]`, j === k ? "la" : "lk"]);
      memRow(g, 60, 60, cells, 100);
      el("rect", { x: 60, y: 160, width: 97, height: 30, class: "lc" }, g); txt(g, 108, 180, `0x${(base + sz * k).toString(16)}`, "s", "middle").setAttribute("style", MONO);
      txt(g, 108, 205, "p + " + k, "s", "middle").setAttribute("style", MONO);
      Q.arrow(g, 108, 158, 60 + k * 100 + 48, 98, "c", "fc");
      txt(g, 300, 175, `*(p + ${k}) = p[${k}] = ${a[k]}`, "s", "start").setAttribute("style", MONO + ";font-size:14px");
      read.textContent = `${t == 0 ? "int" : "double"} 배열에서 p + ${k}로 가면 주소가 ${k} × ${sz} = ${k * sz}바이트 움직인다. 그래서 a[i]와 *(a + i)는 같은 칸을 가리킨다.`;
    });
  });

  // 5.3 구조체 배열과 ->
  Q.def("c10-struct", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const E = [["H", 1, 1.008], ["C", 6, 12.011], ["O", 8, 15.999]];
    Q.bind(fig, ({ k }) => {
      clear(g);
      E.forEach(([s, z, m], i) => {
        const x = 40 + i * 150, on = i === k;
        el("rect", { x, y: 40, width: 140, height: 110, class: on ? "la" : "lk" }, g);
        txt(g, x + 8, 58, `e[${i}]`, "s", "start").setAttribute("style", MONO);
        [["symbol", `"${s}"`], ["Z", z], ["mass", m]].forEach(([f, v], j) => { el("rect", { x: x + 8, y: 68 + j * 26, width: 124, height: 22, class: "lk" }, g); txt(g, x + 14, 84 + j * 26, `${f}: ${v}`, "s", "start").setAttribute("style", MONO + ";font-size:12px"); });
      });
      el("rect", { x: 40 + k * 150 + 40, y: 185, width: 60, height: 28, class: "lc" }, g); txt(g, 40 + k * 150 + 70, 204, "p", "s", "middle").setAttribute("style", MONO);
      Q.arrow(g, 40 + k * 150 + 70, 183, 40 + k * 150 + 70, 154, "c", "fc");
      read.textContent = `struct Element *p = &e[${k}]: p->symbol = "${E[k][0]}", p->Z = ${E[k][1]}, p->mass = ${E[k][2]}. p->mass는 (*p).mass를 줄여 쓴 것이고, 구조체 하나에 자료형이 다른 멤버들이 함께 들어 있다.`;
    });
  });

  // 5.4 연결 리스트: 앞에 넣기 세 단계
  Q.def("c10-linked", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const vals = [40, 30, 20, 10], pos = { 40: [400, 150], 30: [290, 70], 20: [180, 150], 10: [70, 70] };
    Q.bind(fig, ({ s, o }) => {
      clear(g);
      // 상태 재현: 넣기마다 1) 만들기 2) 연결 3) head 이동 (o == 1이면 2와 3의 순서를 바꾼다)
      let head = null; const next = {}; const made = []; let lost = false, msg = "빈 리스트에서 시작한다. head는 NULL이다.";
      for (let st = 0; st < s; st++) {
        const v = vals[Math.floor(st / 3)], ph = st % 3;
        if (ph === 0) { made.push(v); msg = `malloc으로 새 노드 ${v}을 만든다(힙).`; }
        else if ((ph === 1 && o == 0) || (ph === 2 && o == 1)) { next[v] = head; msg = `새 노드 ${v}의 next가 지금의 첫 노드(${head === null ? "NULL" : head})를 가리키게 한다.`; }
        else { const old = head; head = v; msg = `head가 새 노드 ${v}을 가리키게 한다.`; if (o == 1 && next[v] === undefined) { lost = old !== null; msg = `순서를 바꿔 head를 먼저 ${v}로 옮겼다.` + (old !== null ? ` 원래 첫 노드 ${old}의 주소를 잃었다.` : ""); } }
        if (o == 1 && ph === 2 && next[v] === v) { lost = true; }
      }
      made.forEach((v) => { const [x, y] = pos[v]; el("rect", { x, y, width: 80, height: 34, class: v === head ? "la" : "lk" }, g); txt(g, x + 22, y + 22, v, "s", "middle").setAttribute("style", MONO); Q.line(g, x + 44, y, x + 44, y + 34, "gd"); txt(g, x + 62, y + 22, next[v] === undefined ? "?" : next[v] === null ? "∅" : "→", "s", "middle"); });
      made.forEach((v) => { const nx = next[v]; if (nx != null && nx !== v) { const [x1, y1] = pos[v], [x2, y2] = pos[nx]; Q.arrow(g, x1 + 76, y1 + 17, x2 + 4, y2 + 17, "a", "fa"); } if (nx === v) txt(g, pos[v][0] + 40, pos[v][1] + 52, "자기 자신을 가리킴", "td", "middle"); });
      el("rect", { x: 20, y: 200, width: 60, height: 28, class: "lc" }, g); txt(g, 50, 219, "head", "s", "middle").setAttribute("style", MONO);
      if (head !== null) { const [x, y] = pos[head]; Q.arrow(g, 80, 210, x + 4, y + 30, "c", "fc"); } else txt(g, 90, 219, "NULL", "s", "start").setAttribute("style", MONO);
      let order = []; let p = head, guard = 0; while (p !== null && p !== undefined && guard++ < 6) { order.push(p); p = next[p]; }
      txt(g, 300, 225, `head부터 따라가기: ${order.join(" → ") || "(없음)"}`, lost ? "td" : "s", "start");
      read.textContent = `${s}단계: ${msg}` + (s === 12 && o == 0 ? " 결과 10 → 20 → 30 → 40." : "") + (lost && o == 1 ? " 이제 나머지 노드로 갈 길이 없다." : "");
    });
  });

  // 6.1 8비트 2의 보수
  Q.def("c10-bits", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ v }) => {
      clear(g);
      const u = (v + 256) % 256, bits = []; for (let i = 7; i >= 0; i--) bits.push((u >> i) & 1);
      bits.forEach((b, i) => { el("rect", { x: 60 + i * 50, y: 60, width: 46, height: 46, class: b ? "la" : "lk" }, g); txt(g, 83 + i * 50, 90, b, "s", "middle").setAttribute("style", MONO + ";font-size:18px"); txt(g, 83 + i * 50, 50, i === 0 ? "−128" : String(2 ** (7 - i)), i === 0 ? "td" : "s", "middle"); });
      txt(g, 60, 140, `${v} = ${bits.join("")}₂`, "s", "start").setAttribute("style", MONO + ";font-size:15px");
      const w = v === 127 ? -128 : v + 1;
      txt(g, 60, 175, `${v} + 1 → ${w}${v === 127 ? "  (오버플로)" : ""}`, v === 127 ? "td" : "s", "start").setAttribute("style", MONO);
      const parts = bits.map((b, i) => (b ? (i === 0 ? -128 : 2 ** (7 - i)) : 0)).filter((x) => x);
      read.textContent = `맨 왼쪽 비트의 자리값이 −128이다. ${v} = ${parts.length ? parts.join(" + ").replace(/\+ -/g, "− ") : "0"}. 음수는 절댓값의 비트를 모두 뒤집고 1을 더한 것과 같다.` + (v === 127 ? " 127에 1을 더하면 비트가 10000000이 되어 −128이 된다." : "");
    });
  });

  // 6.2 사다리꼴 공식과 이분법
  Q.def("c10-trap", (fig, svg) => {
    const F = Q.frame(-0.1, PI + 0.1, -0.15, 1.15, 50, 490, 15, 235), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ m, n }) => {
      clear(g);
      if (m == 0) {
        Q.line(g, F.x(-0.1), F.y(0), F.x(PI + 0.1), F.y(0), "ax");
        const h = PI / n; let s = 0;
        for (let i = 0; i < n; i++) { const a = i * h, b = a + h; poly(g, F, [[a, 0], [a, Math.sin(a)], [b, Math.sin(b)], [b, 0]], "la"); s += ((Math.sin(a) + Math.sin(b)) / 2) * h; }
        Q.plot(g, F, Math.sin, "c", 0, PI, 200);
        txt(g, F.x(PI), F.y(0) + 14, "π", "s", "middle");
        read.textContent = `n = ${n}: 사다리꼴 합 ${s.toFixed(6)}, 참값 2와의 오차 ${(2 - s).toFixed(5)}. n을 두 배로 하면 오차가 약 1/4이 된다.`;
      } else {
        const G = Q.frame(0.9, 2.1, -1.2, 2.2, 50, 490, 15, 235), f = (x) => x * x - 2;
        Q.line(g, G.x(0.9), G.y(0), G.x(2.1), G.y(0), "ax"); [1, 1.5, 2].forEach((v) => txt(g, G.x(v), G.y(0) + 14, v, "s", "middle"));
        Q.plot(g, G, f, "c", 0.9, 2.1, 200);
        let a2 = 1, b2 = 2; for (let k = 0; k <= n; k++) { const y = G.y(-0.3) + k * 8; Q.line(g, G.x(a2), y, G.x(b2), y, "a").setAttribute("style", "stroke-width:4"); const mid = (a2 + b2) / 2; if (k < n) { if (f(a2) * f(mid) <= 0) b2 = mid; else a2 = mid; } }
        Q.dot(g, G.x(Math.SQRT2), G.y(0), "fd", 4);
        read.textContent = `x² − 2 = 0의 이분법 ${n}번: 구간 [${a2.toFixed(6)}, ${b2.toFixed(6)}], 길이 ${(b2 - a2).toExponential(2)} = 2^−${n}. 길이 1을 10⁻⁶ 아래로 줄이려면 ⌈log₂ 10⁶⌉ = 20번이면 된다.`;
      }
    });
  });

  // 6.3 이진 탐색: 비교할 때마다 후보가 절반
  Q.def("c10-bsearch", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const n = 16, a = Array.from({ length: n }, (_, i) => 2 * i);
    Q.bind(fig, ({ x, s }) => {
      clear(g);
      let lo = 0, hi = n - 1, steps = 0, found = -1, mid = -1;
      while (lo <= hi && steps < s) { steps++; mid = Math.floor((lo + hi) / 2); if (a[mid] === x) { found = mid; break; } else if (a[mid] < x) lo = mid + 1; else hi = mid - 1; }
      const W = 28;
      a.forEach((v, i) => { const inR = i >= lo && i <= hi && found < 0; el("rect", { x: 34 + i * W, y: 70, width: W - 3, height: 32, class: i === found ? "lc" : i === mid ? "lc" : inR ? "la" : "lk" }, g); txt(g, 34 + i * W + 12, 91, v, "s", "middle").setAttribute("style", MONO + ";font-size:11px"); txt(g, 34 + i * W + 12, 62, i, "s", "middle").setAttribute("style", "font-size:9px"); });
      const lin = a.indexOf(x) >= 0 ? a.indexOf(x) + 1 : n;
      txt(g, 34, 140, `찾는 값 x = ${x}`, "s", "start").setAttribute("style", MONO);
      txt(g, 34, 170, `이진 탐색 비교 ${steps}번${found >= 0 ? `, 찾음 (인덱스 ${found})` : lo > hi ? ", 없음 → −1" : ""}`, "ta", "start");
      txt(g, 34, 195, `선형 탐색이라면 비교 ${lin}번`, "tc", "start");
      read.textContent = (found >= 0 ? `${steps}번 비교해 찾았다.` : lo > hi ? `${steps}번 비교 뒤 후보가 없어 −1을 돌려준다.` : `${steps}번 비교 뒤 남은 후보(파랑) ${hi - lo + 1}개.`) + ` 16개에서는 최대 log₂16 + 1 = 5번이면 끝난다.`;
    });
  });

  // ── 새 그림은 이 위에 ──
})();
