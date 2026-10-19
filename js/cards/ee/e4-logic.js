/* 전전4 디지털논리회로 탐구 카드 묶음
   1 2의 보수 수레바퀴(01-01)  2 불 식 진리표·동치 검사(02-01)  3 클릭하는 카르노 맵(03-01)
   4 멀티플렉서로 함수 만들기(04-02)  5 리플 캐리 대 캐리 예측(04-03)  6 래치와 플립플롭(05-01)  7 FPGA 순람표(07-02) */
(() => {
  "use strict";
  if (!window.QSim) return;
  const C = () => QSim.col();
  const mono = () => getComputedStyle(document.documentElement).getPropertyValue("--f-mono") || "monospace";
  const bin = (x, n) => ((x >>> 0) & ((1 << n) - 1)).toString(2).padStart(n, "0");

  /* 1. 2의 보수 수레바퀴 */
  (() => {
    const S = QSim.card("exp-e4-twos"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), n = +S.val("n"), M = 1 << n, lo = -(M >> 1), hi = (M >> 1) - 1, sub = S.val("op") === "sub";
      const a = Math.max(lo, Math.min(hi, S.val("a"))), b = Math.max(lo, Math.min(hi, S.val("b")));
      const ua = a & (M - 1), ub0 = b & (M - 1), ub = sub ? (~b) & (M - 1) : ub0, cin = sub ? 1 : 0;
      const sum = ua + ub + cin, r = sum & (M - 1), cn = sum >> n & 1;
      const cn1 = (((ua & (M / 2 - 1)) + (ub & (M / 2 - 1)) + cin) >> (n - 1)) & 1, V = cn ^ cn1;
      const sr = r >= M / 2 ? r - M : r, truth = sub ? a - b : a + b;
      // 수레바퀴: 비트열을 원 위에 놓고 부호 있는 값을 적음
      const v = QSim.view(cv, 0.62), g = v.g, cx0 = v.W / 2, cy0 = v.H / 2, R = Math.min(v.W, v.H) * 0.4;
      const ang = (u) => -Math.PI / 2 + 2 * Math.PI * u / M;
      g.save(); g.strokeStyle = c.rule; g.lineWidth = 1.5; g.beginPath(); g.arc(cx0, cy0, R, 0, 7); g.stroke();
      g.font = (n === 4 ? "12px " : "9px ") + mono(); g.textAlign = "center";
      const step = n === 4 ? 1 : 16;
      for (let u = 0; u < M; u += step) { const t = ang(u), s = u >= M / 2 ? u - M : u; g.fillStyle = c.ink3; g.fillText(`${s}`, cx0 + (R + 16) * Math.cos(t), cy0 + (R + 16) * Math.sin(t) + 4); if (n === 4) { g.fillStyle = c.ink2; g.fillText(bin(u, 4), cx0 + (R - 22) * Math.cos(t), cy0 + (R - 22) * Math.sin(t) + 4); } }
      // 오버플로 경계 (hi와 lo 사이)
      const tb = ang(M / 2 - 0.5); g.strokeStyle = c.warn; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(cx0, cy0); g.lineTo(cx0 + (R + 6) * Math.cos(tb), cy0 + (R + 6) * Math.sin(tb)); g.stroke(); g.setLineDash([]);
      const dot = (u, col, lab) => { const t = ang(u); g.fillStyle = col; g.beginPath(); g.arc(cx0 + R * Math.cos(t), cy0 + R * Math.sin(t), 7, 0, 7); g.fill(); g.fillStyle = col; g.fillText(lab, cx0 + (R - 44) * Math.cos(t), cy0 + (R - 44) * Math.sin(t) + 4); };
      dot(ua, c.main, "a"); dot(r, c.acc, "결과");
      g.restore();
      S.out(`${n}비트 2의 보수, 범위 ${lo} ~ ${hi}. a = ${a} → ${bin(ua, n)}, b = ${b} → ${bin(ub0, n)}\n` +
        (sub ? `a − b = a + (b를 뒤집은 ${bin(ub, n)}) + 1\n` : "") +
        `덧셈기 결과 ${bin(r, n)} = ${sr} (참값 ${truth}). 나가는 올림 c_n = ${cn}, 맨 앞 자리로 들어간 올림 c_(n−1) = ${cn1}\n` +
        `오버플로 V = c_n ⊕ c_(n−1) = ${V}${V ? " → 결과가 틀림(범위 밖)" : " → 결과가 맞음"}. 바퀴: 한 바퀴 = 2^${n}, 빨간 점선을 넘으면 오버플로`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 불 식 진리표와 동치 검사 */
  function parseBool(src) {   // 변수 A–D, ' 는 NOT(뒤에 붙음), 이어 쓰기·* 는 AND, + 는 OR, ^ 는 XOR, 괄호
    const s = src.replace(/\s+/g, "").replace(/·/g, "*").replace(/’|′/g, "'"); let i = 0;
    const peek = () => s[i];
    function prim() {
      let node;
      if (peek() === "(") { i++; node = orE(); if (peek() !== ")") throw new Error("괄호가 닫히지 않았습니다"); i++; }
      else if (/[A-D]/.test(peek() || "")) { const v = s[i++]; node = (e) => e[v]; }
      else if (peek() === "0" || peek() === "1") { const k = +s[i++]; node = () => k; }
      else throw new Error(`${i + 1}번째 글자 '${peek() || "끝"}'를 읽을 수 없습니다`);
      while (peek() === "'") { i++; const f = node; node = (e) => 1 - f(e); }
      return node;
    }
    function andE() { let n = prim(); while (peek() && (peek() === "*" || /[A-D(01]/.test(peek()))) { if (peek() === "*") i++; const a = n, b = prim(); n = (e) => a(e) & b(e); } return n; }
    function xorE() { let n = andE(); while (peek() === "^") { i++; const a = n, b = andE(); n = (e) => a(e) ^ b(e); } return n; }
    function orE() { let n = xorE(); while (peek() === "+") { i++; const a = n, b = xorE(); n = (e) => a(e) | b(e); } return n; }
    const f = orE(); if (i < s.length) throw new Error(`${i + 1}번째 글자 '${s[i]}'를 읽을 수 없습니다`);
    const vars = [...new Set(s.match(/[A-D]/g) || [])]; return { f, vars };
  }
  /* 3. 클릭하는 카르노 맵 (4변수, 최소 곱의 합) */
  const bitc = (x) => { let k = 0; while (x) { k += x & 1; x >>= 1; } return k; };
  function qm(ones, dcs) {
    let terms = [...ones, ...dcs].map((m) => ({ v: m, m: 0 })); const primes = [];
    while (terms.length) {
      const used = new Set(), next = new Map();
      for (let i = 0; i < terms.length; i++) for (let j = i + 1; j < terms.length; j++) {
        const a = terms[i], b = terms[j], d = a.v ^ b.v;
        if (a.m === b.m && d && !(d & (d - 1))) { used.add(i); used.add(j); const t = { v: a.v & ~d, m: a.m | d }; next.set(t.v + "," + t.m, t); }
      }
      terms.forEach((t, i) => { if (!used.has(i) && !primes.some((p) => p.v === t.v && p.m === t.m)) primes.push(t); });
      terms = [...next.values()];
    }
    const covers = (p, x) => (x & ~p.m) === p.v, P = primes.filter((p) => ones.some((x) => covers(p, x)));
    let best = null;
    for (let s = 1; s < 1 << P.length; s++) {
      const pick = P.filter((_, i) => (s >> i) & 1); if (!ones.every((x) => pick.some((p) => covers(p, x)))) continue;
      const lit = pick.reduce((a, p) => a + 4 - bitc(p.m), 0);
      if (!best || pick.length < best.pick.length || (pick.length === best.pick.length && lit < best.lit)) best = { pick, lit };
    }
    return { best: best ? best.pick : [], primes: P };
  }
  // 입력 번호 m = 8A + 4B + 2C + D (A가 최상위 비트)
  const term =(p) => { if (p.m === 15) return "1"; let s = ""; ["A", "B", "C", "D"].forEach((nm, j) => { const bit = 3 - j; if (!((p.m >> bit) & 1)) s += nm + ((p.v >> bit) & 1 ? "" : "′"); }); return s; };
  (() => {
    const S = QSim.card("exp-e4-kmap"); if (!S) return;
    const cv = S.$("canvas"); const val = Array(16).fill(0); [0, 2, 5, 7, 8, 10, 13, 15].forEach((m) => (val[m] = 1));
    const gray = [0, 1, 3, 2]; let geo = null;
    function draw() {
      const c = C(), ones = [], dcs = []; val.forEach((x, m) => (x === 1 ? ones.push(m) : x === 2 ? dcs.push(m) : 0));
      const { best, primes } = qm(ones, dcs);
      const v = QSim.view(cv, 0.7), g = v.g, cs = Math.min(v.W / 6.5, v.H / 5.6), kx = v.W / 2 - 2 * cs, ky = 1.1 * cs; geo = { kx, ky, cs };
      g.save(); g.font = "12px " + mono(); g.fillStyle = c.ink2; g.fillText("CD →", kx, ky - 0.62 * cs); g.fillText("AB ↓", kx - 1.05 * cs, ky - 0.2 * cs);
      const cols = ["#4b4fe0", "#d9534f", "#2e9e6a", "#e08a1e", "#8e44ad", "#16a2b8", "#7f8c8d", "#c0392b"];
      for (let r = 0; r < 4; r++) for (let q = 0; q < 4; q++) {
        const m = (gray[r] << 2) | gray[q], X = kx + q * cs, Y = ky + r * cs;
        g.strokeStyle = c.rule; g.lineWidth = 1; g.strokeRect(X, Y, cs, cs);
        g.fillStyle = c.ink; g.textAlign = "center"; g.font = "16px " + mono(); g.fillText(val[m] === 2 ? "X" : String(val[m]), X + cs / 2, Y + cs / 2 + 6);
        g.font = "9px " + mono(); g.fillStyle = c.ink3; g.fillText(String(m), X + cs - 9, Y + 11);
        best.forEach((p, k) => { if ((m & ~p.m) === p.v) { g.strokeStyle = cols[k % cols.length]; g.lineWidth = 2.2; const d = 3 + 3.5 * k; g.strokeRect(X + d, Y + d, cs - 2 * d, cs - 2 * d); } });
      }
      g.font = "11px " + mono(); g.fillStyle = c.ink2; g.textAlign = "center";
      for (let q = 0; q < 4; q++) g.fillText(bin(gray[q], 2), kx + q * cs + cs / 2, ky - 0.12 * cs);
      for (let r = 0; r < 4; r++) g.fillText(bin(gray[r], 2), kx - 0.45 * cs, ky + r * cs + cs / 2 + 4);
      g.restore();
      S.out(`F(A,B,C,D) = Σm(${ones.join(", ") || "−"})${dcs.length ? ` + d(${dcs.join(", ")})` : ""}   (칸을 누르면 0 → 1 → X → 0)\n` +
        `주항(prime implicant) ${primes.length}개: ${primes.map(term).join(", ") || "−"}\n최소 곱의 합: F = ${best.length ? best.map(term).join(" + ") : "0"}  (색 테두리가 고른 묶음, 리터럴 ${best.reduce((a, p) => a + 4 - bitc(p.m), 0)}개)`);
    }
    cv.addEventListener("click", (e) => {
      if (!geo) return; const rc = cv.getBoundingClientRect(), x = e.clientX - rc.left, y = e.clientY - rc.top;
      const q = Math.floor((x - geo.kx) / geo.cs), r = Math.floor((y - geo.ky) / geo.cs); if (q < 0 || q > 3 || r < 0 || r > 3) return;
      const m = (gray[r] << 2) | gray[q]; val[m] = (val[m] + 1) % 3; draw();
    });
    S.$(".clear").addEventListener("click", () => { val.fill(0); draw(); });
    S.$$(".preset").forEach((b) => b.addEventListener("click", () => { val.fill(0); b.dataset.m.split(",").filter(Boolean).forEach((m) => (val[+m] = 1)); (b.dataset.d || "").split(",").filter(Boolean).forEach((m) => (val[+m] = 2)); draw(); }));
    QSim.redrawOn(draw); draw();
  })();

  /* 4. 4:1 멀티플렉서로 3변수 함수 만들기 */
  (() => {
    const S = QSim.card("exp-e4-mux"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), f = Array.from({ length: 8 }, (_, m) => (S.val("m" + m) ? 1 : 0));
      // 선택선 A,B (A가 상위), 데이터 입력 I_k = f(A,B,C=0), f(A,B,C=1) 로 정해지는 0, 1, C, C'
      const ins = []; for (let k = 0; k < 4; k++) { const f0 = f[2 * k], f1 = f[2 * k + 1]; ins.push(f0 === f1 ? String(f0) : f1 ? "C" : "C′"); }
      const v = QSim.view(cv, 0.5), g = v.g, W = v.W, H = v.H;
      g.save(); g.strokeStyle = c.ink2; g.lineWidth = 2; g.fillStyle = c.card;
      const x0 = W * 0.45, y0 = H * 0.12, w = W * 0.16, h = H * 0.72;
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + w, y0 + h * 0.15); g.lineTo(x0 + w, y0 + h * 0.85); g.lineTo(x0, y0 + h); g.closePath(); g.fill(); g.stroke();
      g.font = "13px " + mono(); g.fillStyle = c.ink; g.textAlign = "center"; g.fillText("4:1", x0 + w / 2, y0 + h / 2 + 4); g.fillText("MUX", x0 + w / 2, y0 + h / 2 + 20);
      ins.forEach((s, k) => { const y = y0 + h * (0.17 + 0.22 * k); g.strokeStyle = c.ink3; g.beginPath(); g.moveTo(x0 - W * 0.12, y); g.lineTo(x0, y); g.stroke(); g.fillStyle = s === "0" || s === "1" ? c.ink2 : c.main; g.textAlign = "right"; g.fillText(`I${k} = ${s}`, x0 - W * 0.13, y + 4); g.textAlign = "left"; g.fillStyle = c.ink3; g.fillText(bin(k, 2), x0 + 4, y + 4); });
      g.strokeStyle = c.ink3; g.beginPath(); g.moveTo(x0 + w, y0 + h / 2); g.lineTo(x0 + w + W * 0.12, y0 + h / 2); g.stroke(); g.fillStyle = c.warn; g.textAlign = "left"; g.fillText("F", x0 + w + W * 0.13, y0 + h / 2 + 4);
      g.fillStyle = c.ink2; g.textAlign = "center"; g.fillText("선택 A B", x0 + w / 2, y0 + h + 18);
      g.restore();
      const mins = f.map((x, m) => (x ? m : -1)).filter((m) => m >= 0);
      S.out(`F(A,B,C) = Σm(${mins.join(", ") || "−"}). 선택선 AB가 데이터 입력 하나를 고르고, 그 입력에 C만의 함수(0, 1, C, C′)를 넣으면 됩니다.\n` +
        ins.map((s, k) => `AB = ${bin(k, 2)}: F(C=0) = ${f[2 * k]}, F(C=1) = ${f[2 * k + 1]} → I${k} = ${s}`).join("\n"));
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 5. 리플 캐리와 캐리 예측의 지연 비교 */
  (() => {
    const S = QSim.card("exp-e4-cla"); if (!S) return;
    const cv = S.$("canvas");
    const ripple = (n) => 2 * n + 1;                                // 4.1절: P(1) → 비트마다 AND·OR 2단
    const cla4 = (n) => 1 + 2 + 2 * (Math.ceil(n / 4) - 1) + 1;     // 블록 안 P,G(1) + 블록 캐리 2단 + 블록 사이 리플 2단씩 + 합 XOR(1)
    const clalog = (n) => 1 + 2 * Math.ceil(Math.log2(n)) + 1;      // 트리형(병렬 접두): 단계마다 2단
    function draw() {
      const c = C(), n = S.val("n"), tg = S.val("tg");
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: 64, y0: 0, y1: 140, xl: "비트 수 n", yl: "게이트 지연 단수" }); f.axes();
      f.fn(ripple, c.warn, 2.2); f.fn((x) => cla4(Math.max(1, Math.round(x))), c.acc, 2.2, [6, 3]); f.fn((x) => clalog(Math.max(2, x)), c.main, 2.2);
      f.path([[n, 0], [n, 140]], c.rule, 1, [2, 3]);
      S.out(`${n}비트 덧셈의 최악 지연(게이트 한 단 ${tg} ns)\n` +
        `리플 캐리(빨강): ${ripple(n)}단 = ${(ripple(n) * tg).toFixed(2)} ns\n4비트 캐리 예측 블록을 리플로 이음(주황 점선): ${cla4(n)}단 = ${(cla4(n) * tg).toFixed(2)} ns\n` +
        `트리형 캐리 예측(파랑, 단계 log₂n): ${clalog(n)}단 = ${(clalog(n) * tg).toFixed(2)} ns. 대신 게이트 수와 배선이 많아집니다.`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 6. D 래치와 D 플립플롭 비교 */
  (() => {
    const S = QSim.card("exp-e4-latch"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), dsrc = (S.$('[name="d"]').value || "").replace(/[^01]/g, "").slice(0, 64) || "0", sub = 4, half = S.val("half");
      const n = dsrc.length * sub, D = [], CLK = [], QL = [], QF = []; let ql = 0, qf = 0, prev = 0;
      for (let i = 0; i < n; i++) {
        const d = +dsrc[Math.floor(i / sub)], clk = Math.floor(i / half) % 2 === 1 ? 1 : 0;   // half 칸마다 클록이 바뀜
        if (clk) ql = d;                     // 래치: 클록 1인 동안 투명
        if (clk && !prev) qf = d;            // 플립플롭: 상승 모서리에서만
        prev = clk; D.push(d); CLK.push(clk); QL.push(ql); QF.push(qf);
      }
      const v = QSim.view(cv, 0.45), g = v.g, L = 70, rh = (v.H - 16) / 4, dx = (v.W - L - 6) / n;
      g.save(); g.font = "11px " + mono(); g.lineWidth = 2;
      [["CLK", CLK, c.ink3], ["D", D, c.acc], ["Q 래치", QL, c.main], ["Q 플립플롭", QF, c.warn]].forEach(([nm, arr, col], k) => {
        const hi = k * rh + 6, lo = hi + rh - 10; g.fillStyle = c.ink2; g.fillText(nm, 2, (hi + lo) / 2 + 4); g.strokeStyle = col; g.beginPath();
        arr.forEach((x, i) => { const y = x ? hi : lo; if (i === 0) g.moveTo(L, y); else g.lineTo(L + i * dx, y); g.lineTo(L + (i + 1) * dx, y); }); g.stroke();
      });
      g.strokeStyle = c.rule; g.setLineDash([2, 3]); g.lineWidth = 1;
      for (let i = 1; i < n; i++) if (CLK[i] && !CLK[i - 1]) { g.beginPath(); g.moveTo(L + i * dx, 0); g.lineTo(L + i * dx, v.H - 6); g.stroke(); }
      g.restore();
      const ch = (a) => a.reduce((s, x, i) => s + (i && x !== a[i - 1] ? 1 : 0), 0);
      S.out(`D 입력 ${dsrc} (한 글자 = ${sub}칸), 클록 반주기 ${half}칸. 점선은 클록 상승 모서리\n` +
        `D 래치: 클록이 1인 동안 Q가 D를 그대로 따라감(투명). Q가 바뀐 횟수 ${ch(QL)}\nD 플립플롭: 상승 모서리 순간의 D만 저장. Q가 바뀐 횟수 ${ch(QF)}`);
    }
    S.$('[name="d"]').addEventListener("input", draw); S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 8. 임계 경로 찾기: 2비트 가산기 + 비교 회로 (05-03) */
  (() => {
    const S = QSim.card("exp-e4-critical"); if (!S) return;
    const cv = S.$("canvas");
    // 게이트: [이름, 종류, 입력들, x, y]. 입력 A0 B0 A1 B1은 레지스터 출력(시각 t_cq)
    const G = [
      ["x0", "XOR", ["A0", "B0"], 0.28, 0.12], ["g0", "AND", ["A0", "B0"], 0.28, 0.32],
      ["x1", "XOR", ["A1", "B1"], 0.28, 0.55], ["g1", "AND", ["A1", "B1"], 0.28, 0.78],
      ["t1", "AND", ["x1", "g0"], 0.48, 0.62], ["c2", "OR", ["g1", "t1"], 0.66, 0.72],
      ["s1", "XOR", ["x1", "g0"], 0.48, 0.42], ["z", "AND", ["s1", "c2"], 0.84, 0.55]
    ];
    function draw() {
      const c = C(), d = { XOR: S.val("dx"), AND: S.val("da"), OR: S.val("do") }, tcq = S.val("tcq"), tsu = S.val("tsu");
      const arr = { A0: tcq, B0: tcq, A1: tcq, B1: tcq }, from = {}, pos = { A0: [0.06, 0.12], B0: [0.06, 0.32], A1: [0.06, 0.55], B1: [0.06, 0.78] };
      G.forEach(([n, k, ins, x, y]) => { let best = -1, src = null; ins.forEach((i) => { if (arr[i] > best) { best = arr[i]; src = i; } }); arr[n] = best + d[k]; from[n] = src; pos[n] = [x, y]; });
      const outs = ["x0", "z"], end = outs.reduce((a, b) => (arr[a] > arr[b] ? a : b)), path = []; let p = end; while (p) { path.push(p); p = from[p]; }
      const v = QSim.view(cv, 0.55), g = v.g, W = v.W, H = v.H;
      g.save(); g.font = "11px " + mono();
      G.forEach(([n, , ins]) => ins.forEach((i) => { const on = path.includes(n) && path.includes(i) && from[n] === i; g.strokeStyle = on ? c.warn : c.rule; g.lineWidth = on ? 3 : 1.2; g.beginPath(); g.moveTo(pos[i][0] * W + 18, pos[i][1] * H); g.lineTo(pos[n][0] * W - 18, pos[n][1] * H); g.stroke(); }));
      Object.entries(pos).forEach(([n, [x, y]]) => {
        const gate = G.find((q) => q[0] === n); g.fillStyle = path.includes(n) ? c.soft : c.card; g.strokeStyle = c.ink2; g.lineWidth = 1.2;
        g.fillRect(x * W - 18, y * H - 12, 36, 24); g.strokeRect(x * W - 18, y * H - 12, 36, 24);
        g.fillStyle = c.ink; g.textAlign = "center"; g.fillText(gate ? gate[1] : n, x * W, y * H + 4);
        g.fillStyle = c.ink3; g.fillText(`${arr[n].toFixed(2)}`, x * W, y * H - 16);
      });
      g.textAlign = "left"; g.fillStyle = c.ink2; g.fillText("S0", 0.33 * W, 0.12 * H - 18 + 34); g.fillText("Z = S1·C2", 0.88 * W - 10, 0.55 * H + 28);
      g.restore();
      const tpd = arr[end] - tcq, fmax = 1e3 / (arr[end] + tsu);
      S.out(`각 상자 위 숫자: 그 출력이 마지막으로 안정되는 시각(ns, 레지스터 출력이 t_cq = ${tcq} ns에 바뀜)\n` +
        `임계 경로(빨강): ${path.reverse().join(" → ")}, 조합 지연 t_pd = ${tpd.toFixed(2)} ns\n` +
        `최대 클록 f_max = 1/(t_cq + t_pd + t_su) = 1/${(arr[end] + tsu).toFixed(2)} ns = ${fmax.toFixed(0)} MHz`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 7. FPGA의 4입력 순람표 */
  (() => {
    const S = QSim.card("exp-e4-lut"); if (!S) return;
    const cv = S.$("canvas");
    const FN = { and4: (a, b, c, d) => a & b & c & d, or4: (a, b, c, d) => a | b | c | d, xor4: (a, b, c, d) => a ^ b ^ c ^ d, maj: (a, b, c) => (a & b) | (b & c) | (a & c), mux: (a, b, c, d) => (a ? d : c), cmp: (a, b, c, d) => ((a << 1 | b) > (c << 1 | d) ? 1 : 0) };
    function draw() {
      const c = C(), fn = FN[S.val("fn")], inp = [S.val("a"), S.val("b"), S.val("c"), S.val("d")].map((x) => (x ? 1 : 0));
      const bits = Array.from({ length: 16 }, (_, k) => fn((k >> 3) & 1, (k >> 2) & 1, (k >> 1) & 1, k & 1)), addr = inp[0] * 8 + inp[1] * 4 + inp[2] * 2 + inp[3];
      const v = QSim.view(cv, 0.42), g = v.g, cw = (v.W - 120) / 16, y = v.H * 0.35, hgt = v.H * 0.25;
      g.save(); g.font = "12px " + mono(); g.textAlign = "center";
      bits.forEach((b, k) => { const x = 60 + k * cw; g.fillStyle = k === addr ? c.soft : c.card; g.fillRect(x, y, cw - 2, hgt); g.strokeStyle = k === addr ? c.warn : c.rule; g.lineWidth = k === addr ? 2.5 : 1; g.strokeRect(x, y, cw - 2, hgt); g.fillStyle = c.ink; g.fillText(String(b), x + cw / 2 - 1, y + hgt / 2 + 5); g.fillStyle = c.ink3; g.font = "9px " + mono(); g.fillText(k.toString(16).toUpperCase(), x + cw / 2 - 1, y - 6); g.font = "12px " + mono(); });
      g.fillStyle = c.ink2; g.textAlign = "left"; g.fillText("메모리 16비트 (주소 0~F)", 60, y - 22);
      g.fillText(`주소 = ABCD = ${inp.join("")} = ${addr}  →  출력 F = ${bits[addr]}`, 60, y + hgt + 26);
      g.restore();
      S.out(`4입력 순람표(LUT)는 16비트 메모리입니다. 입력 4개가 주소가 되고, 그 칸의 비트가 출력입니다.\n고른 함수의 진리표를 그대로 저장하므로 어떤 4변수 함수든 같은 지연으로 구현합니다. 저장된 비트열(F…0 순서): ${bits.slice().reverse().join("")} = 0x${parseInt(bits.slice().reverse().join(""), 2).toString(16).toUpperCase().padStart(4, "0")}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();

/* 전전4 6단원 추가: 패턴 검출기의 Moore·Mealy 타이밍 (04-06-02) */
(() => {
  "use strict";
  if (!window.QSim) return;
  const S = QSim.card("exp-e4-fsm"); if (!S) return;
  const cv = S.$("canvas"), box = S.$('[name="bits"]');
  // 상태 q = 지금까지 맞은 패턴 앞부분의 길이. 다음 상태 = (앞부분 + 새 비트)의 꼬리 중 패턴의 앞부분과 같은 가장 긴 것
  const delta = (pat, q, b) => { const s = pat.slice(0, q) + b; for (let k = Math.min(s.length, pat.length); k >= 0; k--) if (s.endsWith(pat.slice(0, k))) return k; return 0; };
  function draw() {
    const c = QSim.col(), pat = S.val("pat");
    const bits = (box.value || "").replace(/[^01]/g, "").slice(0, 24), m = pat.length, N = bits.length;
    // Moore: 상태 0..m, 상태 m이면 출력 1. 클록 k 동안의 출력은 그 클록 시작 상태로 정해짐
    const qm = [0]; for (const b of bits) qm.push(delta(pat, qm[qm.length - 1], b));
    // Mealy: 상태 0..m-1, 패턴이 완성되는 전이에서 출력 1
    let border = m - 1; while (border > 0 && !pat.endsWith(pat.slice(0, border))) border--;   // 완성 뒤 겹침으로 이어 쓸 길이
    const qy = [0], zy = []; for (const b of bits) { const n = delta(pat, qy[qy.length - 1], b); zy.push(n === m ? 1 : 0); qy.push(n === m ? border : n); }
    const zm = bits.split("").map((_, k) => (qm[k] === m ? 1 : 0));
    const V = QSim.view(cv, 0.42), fr = QSim.frame(V, { x0: -2.2, x1: Math.max(N, 8) + 0.5, y0: 0, y1: 6, pad: 6 });
    const rows = [["입력 x", bits.split("")], ["Mealy 상태", qy.slice(0, N)], ["Mealy z", zy], ["Moore 상태", qm.slice(0, N)], ["Moore z", zm]];
    rows.forEach(([name, arr], r) => {
      const y = 5.2 - r;
      fr.text(name, -2.1, y - 0.15, c.ink2);
      arr.forEach((val, k) => {
        if ((r === 2 || r === 4) && +val === 1) fr.dot(k + 0.5, y, c.acc, 9);
        fr.text(String(val), k + 0.5, y - 0.15, r === 0 ? c.ink : c.main, "center");
      });
    });
    for (let k = 0; k <= N; k++) fr.path([[k, 0.4], [k, 5.7]], c.rule, 1, [2, 3]);
    const hits = (z) => z.map((v, k) => (v ? k + 1 : 0)).filter((v) => v).join(", ") || "없음";
    S.out(`패턴 "${pat}"(겹침 허용), 입력 ${N}비트. 상태 번호 = 지금까지 맞은 패턴 앞부분의 길이\n` +
      `Mealy(상태 ${m}개): 출력 1인 클록 ${hits(zy)}. 마지막 비트가 들어오는 그 클록에 바로 1\n` +
      `Moore(상태 ${m + 1}개): 출력 1인 클록 ${hits(zm)}. 패턴을 다 본 상태 ${m}에 들어간 다음 클록에 1(한 클록 늦음)` +
      (N === 24 ? "\n입력은 앞 24비트만 씁니다." : ""));
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();
