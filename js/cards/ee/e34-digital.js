/* 전전34 디지털실험 카드 묶음 (가상 회로)
   1 리플 캐리 가산기의 전파 지연  2 7세그먼트 디코더와 카르노 맵  3 카운터·시프트 레지스터
   4 셋업·홀드와 최대 클록  5 신호등 FSM  6 순서 검출기(무어·밀리)  7 스위치 바운스와 디바운서  8 UART 프레임 */
(() => {
  "use strict";
  if (!window.QSim) return;
  const C = () => QSim.col();
  const mono = () => getComputedStyle(document.documentElement).getPropertyValue("--f-mono") || "monospace";
  const rng = (s) => () => { s = (s * 1664525 + 1013904223) % 4294967296; return (s + 0.5) / 4294967296; };
  const bin = (x, n) => x.toString(2).padStart(n, "0");

  /* 타이밍도: rows = [{name, v: [값…], bus?}] 칸 n개. mark = [{at, color, label}] 세로선 */
  function timing(v, rows, n, opt = {}) {
    const c = C(), g = v.g, L = opt.left ?? 54, W = v.W - L - 6, rh = (v.H - 18) / rows.length, dx = W / n;
    g.save(); g.font = "11px " + mono(); g.lineWidth = 1;
    g.strokeStyle = c.rule; g.globalAlpha = 0.5;
    for (let i = 0; i <= n; i += opt.grid || 1) { g.beginPath(); g.moveTo(L + i * dx, 0); g.lineTo(L + i * dx, v.H - 16); g.stroke(); }
    g.globalAlpha = 1;
    rows.forEach((r, k) => {
      const y0 = k * rh + 4, hi = y0 + 3, lo = y0 + rh - 6;
      g.fillStyle = c.ink2; g.fillText(r.name, 2, (hi + lo) / 2 + 4);
      g.strokeStyle = r.color || c.main; g.lineWidth = 2;
      if (r.bus) {
        let s = 0;
        for (let i = 1; i <= n; i++) {
          if (i === n || r.v[i] !== r.v[s]) {
            const x0 = L + s * dx, x1 = L + i * dx, m = Math.min(4, (x1 - x0) / 3);
            g.beginPath(); g.moveTo(x0, (hi + lo) / 2); g.lineTo(x0 + m, hi); g.lineTo(x1 - m, hi); g.lineTo(x1, (hi + lo) / 2); g.lineTo(x1 - m, lo); g.lineTo(x0 + m, lo); g.closePath(); g.stroke();
            if (x1 - x0 > 14 && r.v[s] !== undefined && r.v[s] !== null) { g.fillStyle = c.ink; g.textAlign = "center"; g.fillText(String(r.v[s]), (x0 + x1) / 2, (hi + lo) / 2 + 4); g.textAlign = "left"; }
            s = i;
          }
        }
      } else {
        g.beginPath();
        for (let i = 0; i < n; i++) {
          const val = r.v[i], y = val === null || val === undefined ? (hi + lo) / 2 : val ? hi : lo, x0 = L + i * dx, x1 = x0 + dx;
          if (i === 0) g.moveTo(x0, y); else g.lineTo(x0, y);
          g.lineTo(x1, y);
        }
        g.stroke();
      }
    });
    (opt.mark || []).forEach((m) => { g.strokeStyle = m.color || c.warn; g.setLineDash([3, 3]); g.lineWidth = 1.2; g.beginPath(); g.moveTo(L + m.at * dx, 0); g.lineTo(L + m.at * dx, v.H - 14); g.stroke(); g.setLineDash([]); if (m.label) { g.fillStyle = m.color || c.warn; g.fillText(m.label, L + m.at * dx + 3, v.H - 3); } });
    if (opt.xl) { g.fillStyle = c.ink3; g.textAlign = "right"; g.fillText(opt.xl, v.W - 4, v.H - 3); g.textAlign = "left"; }
    g.restore();
    return { L, dx, rh };
  }

  /* 1. 4비트 리플 캐리 가산기: 게이트마다 지연 1단위인 모형 (01-01, 01-02) */
  (() => {
    const S = QSim.card("lab-e34-adder"); if (!S) return;
    const cv = S.$("canvas"), N = 4, STEPS = 14;
    // 비트 i: P=A^B, G=A&B, T=P&C, Cout=G|T, S=P^C. 모든 게이트가 한 단위 늦게 반응
    function run(A0, B0, A1, B1, cin) {
      const settle = (A, B) => { let st = { P: [], G: [], T: [], Co: [], S: [] }; for (let k = 0; k < 20; k++) st = step(st, A, B); return st; };
      const step = (s, A, B) => {
        const n = { P: [], G: [], T: [], Co: [], S: [] };
        for (let i = 0; i < N; i++) {
          const a = (A >> i) & 1, b = (B >> i) & 1, c = i ? s.Co[i - 1] | 0 : cin;
          n.P[i] = a ^ b; n.G[i] = a & b; n.T[i] = (s.P[i] | 0) & c; n.Co[i] = (s.G[i] | 0) | (s.T[i] | 0); n.S[i] = (s.P[i] | 0) ^ c;
        }
        return n;
      };
      let st = settle(A0, B0); const hist = [st];
      for (let k = 0; k < STEPS; k++) { st = step(st, A1, B1); hist.push(st); }
      return hist;
    }
    function draw() {
      const c = C(), A0 = S.val("a0"), B0 = S.val("b0"), A1 = S.val("a1"), B1 = S.val("b1"), cin = S.val("cin") ? 1 : 0, tpd = S.val("tpd");
      const h = run(A0, B0, A1, B1, cin), n = h.length;
      const rows = [{ name: "A,B", bus: true, v: h.map((_, k) => (k ? `${A1},${B1}` : `${A0},${B0}`)), color: c.ink3 }];
      for (let i = 0; i < N; i++) rows.push({ name: "S" + i, v: h.map((s) => s.S[i]) });
      rows.push({ name: "C4", v: h.map((s) => s.Co[N - 1]), color: c.acc });
      rows.push({ name: "합", bus: true, v: h.map((s) => s.S.reduce((a, b, i) => a + (b << i), 0) + (s.Co[N - 1] << N)), color: c.ink2 });
      const val = (s) => s.S.reduce((a, b, i) => a + (b << i), 0) + (s.Co[N - 1] << N);
      let last = 0; for (let k = 1; k < n; k++) if (val(h[k]) !== val(h[k - 1]) || h[k].S.some((b, i) => b !== h[k - 1].S[i])) last = k;
      const shown = new Set(h.slice(1, last + 1).map(val)); shown.delete(A1 + B1 + cin); shown.delete(A0 + B0 + cin);   // 처음 값과 최종 값은 글리치가 아님
      const v = QSim.view(cv, 0.55); timing(v, rows, n, { mark: [{ at: 1, label: "입력 바뀜" }, { at: last + 1, color: c.main, label: "안정" }], xl: `한 칸 = 게이트 지연 ${tpd} ns` });
      S.out(`입력이 A=${A0}, B=${B0} 에서 A=${A1}(${bin(A1, 4)}), B=${B1}(${bin(B1, 4)}), C_in=${cin} 으로 바뀜\n` +
        `최종 합 ${val(h[n - 1])} (${bin(val(h[n - 1]), 5)}), 기대값 ${A1 + B1 + cin}${val(h[n - 1]) === A1 + B1 + cin ? " ✔" : ""}\n` +
        `출력이 마지막으로 바뀐 때: 게이트 지연 ${last}단 = ${last * tpd} ns. 4비트 리플 캐리의 최악 경로는 C4까지 2·4+1 = 9단 = ${9 * tpd} ns\n` +
        (shown.size ? `중간에 잠깐 나타난 틀린 합(글리치): ${[...shown].join(", ")}` : "중간에 틀린 합이 나타나지 않았습니다."));
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 7세그먼트 디코더와 카르노 맵 (01-03) */
  const SEG = ["1111110", "0110000", "1101101", "1111001", "0110011", "1011011", "1011111", "1110000", "1111111", "1111011", "1110111", "0011111", "1001110", "0111101", "1001111", "1000111"];
  function qm(ones, dcs) {   // 4변수 최소 곱의 합: 주항 찾기 → 가장 적은 항, 그다음 가장 적은 리터럴로 덮기
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
    const covers = (p, x) => (x & ~p.m) === p.v;
    const P = primes.filter((p) => ones.some((x) => covers(p, x)));
    let best = null;
    for (let s = 1; s < 1 << P.length; s++) {
      const pick = P.filter((_, i) => (s >> i) & 1);
      if (!ones.every((x) => pick.some((p) => covers(p, x)))) continue;
      const lit = pick.reduce((a, p) => a + 4 - bitc(p.m), 0);
      if (!best || pick.length < best.pick.length || (pick.length === best.pick.length && lit < best.lit)) best = { pick, lit };
    }
    return best ? best.pick : [];
  }
  const bitc = (x) => { let k = 0; while (x) { k += x & 1; x >>= 1; } return k; };
  const VN = ["A", "B", "C", "D"];   // A가 최하위 비트
  const termStr = (p) => { if (p.m === 15) return "1"; let s = ""; for (let i = 3; i >= 0; i--) if (!((p.m >> i) & 1)) s += VN[i] + ((p.v >> i) & 1 ? "" : "′"); return s; };
  (() => {
    const S = QSim.card("lab-e34-7seg"); if (!S) return;
    const [cvD, cvK] = S.$$("canvas");
    function draw() {
      const c = C(), x = S.val("x"), seg = "abcdefg".indexOf(S.val("seg")), hex = S.val("hex");
      const on = SEG[x], v = QSim.view(cvD, 0.42), g = v.g, H = v.H, s = H / 6.2, ox = v.W / 2 - 1.8 * s, oy = 0.5 * s;
      const SEGXY = [[0.3, 0, 2.4, 0.42], [2.75, 0.3, 0.42, 2.0], [2.75, 2.6, 0.42, 2.0], [0.3, 4.6, 2.4, 0.42], [-0.12, 2.6, 0.42, 2.0], [-0.12, 0.3, 0.42, 2.0], [0.3, 2.3, 2.4, 0.42]];
      SEGXY.forEach(([a, b, w, h], i) => { g.fillStyle = on[i] === "1" ? (i === seg ? c.warn : c.main) : c.rule; g.globalAlpha = on[i] === "1" ? 1 : 0.35; g.fillRect(ox + a * s, oy + b * s, w * s, h * s); g.globalAlpha = 1; g.fillStyle = c.ink3; g.font = "11px " + mono(); g.fillText("abcdefg"[i], ox + (a + w / 2) * s - 3, oy + (b + h / 2) * s + 4); });
      g.fillStyle = c.ink2; g.font = "12px " + mono(); g.fillText(`입력 DCBA = ${bin(x, 4)} (${x.toString(16).toUpperCase()})`, 8, 16);
      // 카르노 맵: 행 DC, 열 BA, 그레이 순서
      const ones = [], dcs = []; for (let m = 0; m < 16; m++) { if (!hex && m > 9) dcs.push(m); else if (SEG[m][seg] === "1") ones.push(m); }
      const best = qm(ones, dcs), gray = [0, 1, 3, 2];
      const vk = QSim.view(cvK, 0.62), gk = vk.g, cs = Math.min(vk.W / 7, vk.H / 5.6), kx = vk.W / 2 - 2 * cs, ky = 1.2 * cs;
      gk.font = "12px " + mono(); gk.fillStyle = c.ink2; gk.fillText("BA →", kx - 6, ky - 0.65 * cs); gk.fillText("DC", kx - 1.1 * cs, ky - 0.2 * cs);
      const cols = ["#4b4fe0", "#d9534f", "#2e9e6a", "#e08a1e", "#8e44ad", "#16a2b8"];
      for (let r = 0; r < 4; r++) for (let q = 0; q < 4; q++) {
        const m = (gray[r] << 2) | gray[q], X = kx + q * cs, Y = ky + r * cs;
        gk.strokeStyle = c.rule; gk.lineWidth = 1; gk.strokeRect(X, Y, cs, cs);
        if (m === x) { gk.fillStyle = c.soft; gk.fillRect(X + 1, Y + 1, cs - 2, cs - 2); }
        gk.fillStyle = c.ink; gk.textAlign = "center"; gk.font = "14px " + mono();
        gk.fillText(dcs.includes(m) ? "X" : ones.includes(m) ? "1" : "0", X + cs / 2, Y + cs / 2 + 5);
        gk.font = "9px " + mono(); gk.fillStyle = c.ink3; gk.fillText(String(m), X + cs - 8, Y + 10); gk.textAlign = "left";
        best.forEach((p, k) => { if ((m & ~p.m) === p.v) { gk.strokeStyle = cols[k % cols.length]; gk.lineWidth = 2; const d = 3 + 3 * k; gk.strokeRect(X + d, Y + d, cs - 2 * d, cs - 2 * d); } });
      }
      gk.font = "11px " + mono(); gk.fillStyle = c.ink2;
      for (let q = 0; q < 4; q++) gk.fillText(bin(gray[q], 2), kx + q * cs + cs / 2 - 7, ky - 0.15 * cs);
      for (let r = 0; r < 4; r++) gk.fillText(bin(gray[r], 2), kx - 0.75 * cs, ky + r * cs + cs / 2 + 4);
      const expr = best.length ? best.map(termStr).join(" + ") : "0";
      const nAnd = best.filter((p) => 4 - bitc(p.m) > 1).length, lits = best.reduce((a, p) => a + 4 - bitc(p.m), 0);
      S.out(`세그먼트 ${"abcdefg"[seg]}: 켜지는 입력 ${ones.join(", ") || "없음"}${dcs.length ? `, 무관(X) ${dcs.join(", ")}` : ""}\n` +
        `최소 곱의 합: ${seg >= 0 ? "abcdefg"[seg] : ""} = ${expr}\n항 ${best.length}개, 리터럴 ${lits}개 → 2단 AND-OR로 AND ${nAnd}개 + OR 1개 (NOT은 입력 쪽에서 공유)\n카르노 맵의 색 테두리가 고른 묶음. ′는 NOT`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 카운터와 시프트 레지스터 (02-01) */
  (() => {
    const S = QSim.card("lab-e34-counter"); if (!S) return;
    const cv = S.$("canvas"); let st = 0, hist = [0], serial = [], tick = 0;
    const NEXT = {
      up: (q) => (q + 1) & 15,
      down: (q) => (q + 15) & 15,
      shift: (q, d) => ((q << 1) | d) & 15,
      ring: (q) => (q === 0 ? 1 : ((q << 1) | (q >> 3)) & 15),
      johnson: (q) => (((q << 1) | (~q >> 3 & 1)) & 15),
      lfsr: (q) => { const f = ((q >> 3) ^ (q >> 2)) & 1; return q === 0 ? 1 : ((q << 1) | f) & 15; }   // x⁴ + x³ + 1
    };
    const NAME = { up: "4비트 동기식 상향 카운터", down: "4비트 동기식 하향 카운터", shift: "4비트 직렬 입력 시프트 레지스터", ring: "링 카운터 (0001에서 출발)", johnson: "존슨 카운터", lfsr: "4비트 LFSR (x⁴ + x³ + 1)" };
    function period(kind) { if (kind === "shift") return "입력에 따라 다름"; const f = NEXT[kind]; let q = f(kind === "ring" || kind === "lfsr" ? 1 : 0), seen = new Map(); for (let k = 0; k < 40; k++) { if (seen.has(q)) return `${k - seen.get(q)}개 상태를 돌고 반복`; seen.set(q, k); q = f(q, 0); } return "-"; }
    function draw() {
      const c = C(), kind = S.val("kind"), n = 16, h = hist.slice(-n);
      while (h.length < n) h.push(null);
      const v = QSim.view(cv, 0.52), r2 = [];
      if (kind === "shift") r2.push({ name: "D", v: serial.slice(-n).concat(Array(n).fill(null)).slice(0, n), color: c.acc });
      for (let b = 0; b < 4; b++) r2.push({ name: "Q" + b, v: h.map((q) => (q === null ? null : (q >> b) & 1)) });
      r2.push({ name: "상태", bus: true, v: h.map((q) => (q === null ? null : kind === "up" || kind === "down" ? q : bin(q, 4))), color: c.ink2 });
      timing(v, r2, n, { xl: "한 칸 = 클록 한 주기" });
      const ripple = kind === "up" && (st & 15) === 8 && hist.length > 1 ? "\n(리플 카운터였다면 0111 → 1000 사이에 0110, 0100, 0000이 차례로 잠깐 나타납니다. 동기식은 모든 비트가 같은 클록 끝에서 함께 바뀝니다.)" : "";
      S.out(`${NAME[kind]}, 클록 ${tick}번. 지금 상태 Q3Q2Q1Q0 = ${bin(st, 4)}${kind === "up" || kind === "down" ? ` (${st})` : ""}\n순환: ${period(kind)}${kind === "shift" ? `\n직렬 입력 D = ${S.val("d") ? 1 : 0}. 클록마다 Q0에 들어가 한 칸씩 Q3 쪽으로 밀립니다.` : ""}${ripple}`);
    }
    const clock = () => { const kind = S.val("kind"), d = S.val("d") ? 1 : 0; serial.push(d); st = NEXT[kind](st, d); hist.push(st); tick++; draw(); };
    const reset = () => { const kind = S.val("kind"); st = kind === "ring" || kind === "lfsr" ? 1 : 0; hist = [st]; serial = []; tick = 0; draw(); };
    S.$(".step").addEventListener("click", clock);
    const L = QSim.loop((() => { let acc = 0; return (dt) => { acc += dt; if (acc > 0.5) { acc = 0; clock(); } }; })()).watch(S.root);
    QSim.playButton(S.$(".play"), L);
    S.$(".reset").addEventListener("click", reset);
    let kind0 = S.val("kind"); S.on(() => { if (S.val("kind") !== kind0) { kind0 = S.val("kind"); reset(); } else draw(); });
    QSim.redrawOn(draw); reset();
  })();

  /* 4. 셋업·홀드 시간과 최대 클록 주파수 (02-02) */
  (() => {
    const S = QSim.card("lab-e34-timing"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), T = S.val("T"), tcq = S.val("tcq"), ng = S.val("ng"), tg = S.val("tg"), tsu = S.val("tsu"), th = S.val("th"), sk = S.val("skew"), tcdmin = S.val("tcd");
      const arrive = tcq + ng * tg, need = T + sk - tsu, slackS = need - arrive, slackH = tcq + tcdmin - (th + sk), fmax = 1e3 / (tcq + ng * tg + tsu - sk);
      const v = QSim.view(cv, 0.5), g = v.g, span = Math.max(T * 1.6, arrive + tsu + 2), X = (t) => 60 + (t / span) * (v.W - 70);
      const row = (k) => 18 + k * (v.H - 30) / 4;
      g.save(); g.font = "11px " + mono(); g.lineWidth = 2;
      const lab = (k, s) => { g.fillStyle = c.ink2; g.fillText(s, 2, row(k) + 14); };
      // 발사 클록, 받는 클록, 데이터
      const clkRow = (k, off) => { g.strokeStyle = c.ink3; g.beginPath(); let y = row(k) + 20; g.moveTo(X(0), y); for (let t = off; t < span; t += T) { g.lineTo(X(t), y); g.lineTo(X(t), row(k) + 4); g.lineTo(X(Math.min(span, t + T / 2)), row(k) + 4); g.lineTo(X(Math.min(span, t + T / 2)), row(k) + 20); } g.lineTo(X(span), row(k) + 20); g.stroke(); };
      lab(0, "CLK 발사"); clkRow(0, 0); lab(1, "CLK 받기"); clkRow(1, sk);
      lab(2, "D 도착"); g.strokeStyle = c.main; g.fillStyle = c.soft;
      g.fillRect(X(tcq + tcdmin), row(2) + 4, X(arrive) - X(tcq + tcdmin), 16); g.beginPath(); g.moveTo(X(0), row(2) + 12); g.lineTo(X(tcq + tcdmin), row(2) + 12); g.moveTo(X(arrive), row(2) + 4); g.lineTo(X(span), row(2) + 4); g.stroke();
      g.fillStyle = c.ink2; g.fillText("바뀌는 중", X(tcq + tcdmin) + 2, row(2) + 16);
      lab(3, "금지 구간");
      g.fillStyle = slackS >= 0 ? "rgba(46,158,106,0.35)" : "rgba(217,83,79,0.45)"; g.fillRect(X(T + sk - tsu), row(3) + 4, X(T + sk) - X(T + sk - tsu), 16);
      g.fillStyle = slackH >= 0 ? "rgba(46,158,106,0.35)" : "rgba(217,83,79,0.45)"; g.fillRect(X(sk), row(3) + 4, X(sk + th) - X(sk), 16);
      g.fillStyle = c.ink3; g.fillText("홀드", X(sk) + 1, row(3) + 32); g.fillText("셋업", X(T + sk - tsu) + 1, row(3) + 32);
      g.strokeStyle = c.warn; g.setLineDash([3, 3]); g.lineWidth = 1; [0, T + sk].forEach((t) => { g.beginPath(); g.moveTo(X(t), 0); g.lineTo(X(t), v.H - 12); g.stroke(); }); g.setLineDash([]);
      g.fillStyle = c.ink3; g.textAlign = "right"; g.fillText(`가로 0 ~ ${span.toFixed(1)} ns`, v.W - 4, v.H - 2); g.restore();
      S.out(`데이터 경로: 플립플롭 t_cq ${tcq} ns + 게이트 ${ng}단 × ${tg} ns = 늦은 도착 ${arrive.toFixed(2)} ns, 빠른 도착(가장 짧은 경로) ${(tcq + tcdmin).toFixed(2)} ns\n` +
        `셋업 여유 = (T + 스큐 − t_su) − 늦은 도착 = ${slackS.toFixed(2)} ns ${slackS >= 0 ? "✔" : "✘ 셋업 위반: 다음 클록에 틀린 값이 저장될 수 있음"}\n` +
        `홀드 여유 = 빠른 도착 − (t_h + 스큐) = ${slackH.toFixed(2)} ns ${slackH >= 0 ? "✔" : "✘ 홀드 위반: 클록을 느리게 해도 고쳐지지 않음"}\n` +
        `최대 클록 주파수 f_max = 1/(t_cq + t_logic + t_su − 스큐) = ${fmax.toFixed(1)} MHz (지금 ${(1e3 / T).toFixed(1)} MHz)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 5. 신호등 제어기 FSM (03-01) */
  (() => {
    const S = QSim.card("lab-e34-traffic"); if (!S) return;
    const [cvX, cvT] = S.$$("canvas");
    const ST = [{ n: "주G", main: "G", side: "R" }, { n: "주Y", main: "Y", side: "R" }, { n: "부G", main: "R", side: "G" }, { n: "부Y", main: "R", side: "Y" }];
    const ENC = { bin: ["00", "01", "11", "10"], onehot: ["0001", "0010", "0100", "1000"] };
    let s = 0, t = 0, hist = [], car = [];
    function next() {
      const sensor = S.val("car") ? 1 : 0, Tg = S.val("tg"), Ty = S.val("ty"), Ts = S.val("ts");
      let ns = s, nt = t + 1;
      if (s === 0 && t + 1 >= Tg && sensor) { ns = 1; nt = 0; }
      else if (s === 1 && t + 1 >= Ty) { ns = 2; nt = 0; }
      else if (s === 2 && (t + 1 >= Ts || !sensor)) { ns = 3; nt = 0; }
      else if (s === 3 && t + 1 >= Ty) { ns = 0; nt = 0; }
      hist.push(s); car.push(sensor); s = ns; t = nt; if (hist.length > 40) { hist.shift(); car.shift(); }
      draw();
    }
    function draw() {
      const c = C(), v = QSim.view(cvX, 0.45), g = v.g, W = v.W, H = v.H, enc = ENC[S.val("enc")];
      // 상태도: 네 원을 사각형으로 배치
      const P = [[0.2, 0.3], [0.45, 0.3], [0.45, 0.78], [0.2, 0.78]].map(([x, y]) => [x * W, y * H]), R = Math.min(W, H) * 0.11;
      g.save(); g.lineWidth = 1.6; g.font = "12px " + mono(); g.textAlign = "center";
      const arrow = (a, b, label) => { const [x1, y1] = P[a], [x2, y2] = P[b], d = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / d, uy = (y2 - y1) / d, sx = x1 + ux * R, sy = y1 + uy * R, ex = x2 - ux * R, ey = y2 - uy * R;
        g.strokeStyle = c.ink3; g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.stroke(); g.beginPath(); g.moveTo(ex, ey); g.lineTo(ex - 8 * ux - 4 * uy, ey - 8 * uy + 4 * ux); g.lineTo(ex - 8 * ux + 4 * uy, ey - 8 * uy - 4 * ux); g.fillStyle = c.ink3; g.fill();
        g.fillStyle = c.ink2; g.fillText(label, (sx + ex) / 2 + uy * 14, (sy + ey) / 2 - ux * 14 + 4); };
      arrow(0, 1, "T≥Tg·차"); arrow(1, 2, "T≥Ty"); arrow(2, 3, "T≥Ts+차없음"); arrow(3, 0, "T≥Ty");
      ST.forEach((q, i) => { const [x, y] = P[i]; g.beginPath(); g.arc(x, y, R, 0, 7); g.fillStyle = i === s ? c.soft : c.card; g.fill(); g.strokeStyle = i === s ? c.main : c.ink3; g.lineWidth = i === s ? 3 : 1.4; g.stroke(); g.fillStyle = c.ink; g.fillText(q.n, x, y); g.fillStyle = c.ink3; g.fillText(enc[i], x, y + 15); });
      // 교차로 신호
      const lamp = (x, y, on) => ["R", "Y", "G"].forEach((k, j) => { g.beginPath(); g.arc(x, y + j * 18, 7, 0, 7); g.fillStyle = on === k ? { R: "#d9534f", Y: "#f2b33d", G: "#2e9e6a" }[k] : c.rule; g.fill(); });
      g.fillStyle = c.ink2; g.fillText("주도로", 0.72 * W, 0.18 * H); g.fillText("부도로", 0.88 * W, 0.18 * H);
      lamp(0.72 * W, 0.26 * H, ST[s].main); lamp(0.88 * W, 0.26 * H, ST[s].side);
      g.fillStyle = S.val("car") ? c.acc : c.rule; g.fillRect(0.82 * W, 0.72 * H, 0.12 * W, 0.12 * H); g.fillStyle = c.ink2; g.fillText(S.val("car") ? "부도로에 차 있음" : "부도로 비어 있음", 0.88 * W, 0.92 * H);
      g.restore();
      const n = 40, vt = QSim.view(cvT, 0.28), hh = hist.concat(Array(n).fill(null)).slice(0, n), cc = car.concat(Array(n).fill(null)).slice(0, n);
      timing(vt, [{ name: "차", v: cc, color: c.acc }, { name: "상태", bus: true, v: hh.map((q) => (q === null ? null : ST[q].n)), color: c.main }], n, { grid: 5, xl: "한 칸 = 1초 (클록 1 Hz)" });
      S.out(`지금 상태 ${ST[s].n} (상태 레지스터 ${enc[s]}, ${S.val("enc") === "bin" ? "2진 부호화: 플립플롭 2개" : "원-핫 부호화: 플립플롭 4개"}), 상태 안 타이머 T = ${t}\n` +
        `주도로 ${{ G: "초록", Y: "노랑", R: "빨강" }[ST[s].main]}, 부도로 ${{ G: "초록", Y: "노랑", R: "빨강" }[ST[s].side]}\n` +
        `규칙: 주G는 최소 Tg = ${S.val("tg")}초, 그 뒤 차가 있으면 주Y(Ty = ${S.val("ty")}초) → 부G(차가 없어지거나 Ts = ${S.val("ts")}초가 되면 끝) → 부Y → 주G`);
    }
    S.$(".step").addEventListener("click", next);
    const L = QSim.loop((() => { let acc = 0; return (dt) => { acc += dt; if (acc > 0.35) { acc = 0; next(); } }; })()).watch(S.root);
    QSim.playButton(S.$(".play"), L);
    S.$(".reset").addEventListener("click", () => { s = 0; t = 0; hist = []; car = []; draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 6. 순서 검출기: 무어 기계와 밀리 기계 (03-02) */
  (() => {
    const S = QSim.card("lab-e34-seqdet"); if (!S) return;
    const cv = S.$("canvas");
    function machines(pat, bits, overlap) {
      const k = pat.length;
      // KMP 방식으로 "지금까지 맞은 길이" j 를 상태로 쓴다. 무어는 j = k 인 상태를 하나 더 둔다
      const nextJ = (j, b) => { let s = pat.slice(0, j) + b; while (s.length && !pat.startsWith(s)) s = s.slice(1); return s.length; };
      const longestBorder = (p) => { for (let L = p.length - 1; L > 0; L--) if (p.slice(0, L) === p.slice(p.length - L)) return L; return 0; };
      let jM = 0, jo = 0; const mealy = [], moore = [], mstate = [], ostate = [];
      for (const b of bits) {
        // 밀리: 이번 입력과 지금 상태로 바로 출력
        const hit = nextJ(jM, b) === k; mealy.push(hit ? 1 : 0); mstate.push(jM); jM = hit ? (overlap ? longestBorder(pat) : 0) : nextJ(jM, b);
        // 무어: 출력은 상태(= 다 맞은 상태 k)로만 결정 → 한 클록 늦게 보인다
        moore.push(jo === k ? 1 : 0); ostate.push(jo);
        const from = jo === k ? (overlap ? longestBorder(pat) : 0) : jo; jo = nextJ(from, b);
      }
      moore.push(jo === k ? 1 : 0); ostate.push(jo);   // 입력이 끝난 다음 칸: 무어 출력은 여기서야 보일 수 있다
      return { mealy, moore, mstate, ostate, nM: k, nO: k + 1 };
    }
    function bits() { const s = (S.$('[name="bits"]').value || "").replace(/[^01]/g, ""); return s.slice(0, 32); }
    function draw() {
      const c = C(), pat = S.val("pat"), b = bits(), ov = S.val("ov"), m = machines(pat, b, ov), n = Math.max(b.length + 1, 8);
      const v = QSim.view(cv, 0.5), pad = (a) => a.concat(Array(n).fill(null)).slice(0, n);
      timing(v, [
        { name: "입력", v: pad([...b].map(Number)), color: c.acc },
        { name: "밀리 상태", bus: true, v: pad(m.mstate), color: c.ink3 },
        { name: "밀리 출력", v: pad(m.mealy), color: c.warn },
        { name: "무어 상태", bus: true, v: pad(m.ostate), color: c.ink3 },
        { name: "무어 출력", v: pad(m.moore), color: c.main }], n, { xl: "한 칸 = 클록 한 주기", left: 66 });
      const at = (a) => a.map((x, i) => (x ? i : -1)).filter((i) => i >= 0);
      S.out(`찾는 순서 ${pat}, ${ov ? "겹침 허용" : "겹침 없음"}. 입력 ${b.length}비트: ${b}\n` +
        `밀리 기계(상태 ${m.nM}개): 출력 1인 칸 ${at(m.mealy).join(", ") || "없음"} — 마지막 비트가 들어오는 그 칸\n` +
        `무어 기계(상태 ${m.nO}개): 출력 1인 칸 ${at(m.moore).join(", ") || "없음"} — 한 칸 늦게, 한 클록 동안 꼬박\n상태 번호 = 지금까지 맞은 앞부분의 길이 (무어의 ${pat.length}는 "다 맞음" 상태)`);
    }
    S.$(".rand").addEventListener("click", () => { const r = rng(Date.now() % 100000); S.$('[name="bits"]').value = Array.from({ length: 24 }, () => (r() < 0.5 ? 0 : 1)).join(""); draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 7. 스위치 바운스와 디바운서 (04-02) */
  (() => {
    const S = QSim.card("lab-e34-debounce"); if (!S) return;
    const cv = S.$("canvas"); let seed = 7;
    function sig() {   // 0에서 눌러 1로, 60 ms에 떼어 0으로. 바뀔 때마다 bounce ms 동안 무작위로 튄다
      const r = rng(seed), B = S.val("bounce"), dt = 0.02, T = 100, out = [];
      const ev = []; [[5, 1], [60, 0]].forEach(([t0, to]) => { let t = t0; const end = t0 + B; while (t < end) { ev.push([t, to]); t += 0.05 + r() * B / 6; ev.push([t, 1 - to]); t += 0.03 + r() * B / 10; } ev.push([Math.max(t, end), to]); });
      ev.sort((a, b) => a[0] - b[0]); let k = 0, v = 0;
      for (let t = 0; t <= T; t += dt) { while (k < ev.length && ev[k][0] <= t) v = ev[k++][1]; out.push([t, v]); }
      return out;
    }
    function draw() {
      const c = C(), raw = sig(), Ts = S.val("ts"), N = S.val("n");
      // 디바운서: Ts ms마다 표본을 뜨고, N번 연속 같은 값이면 출력을 바꾼다
      let out = 0, cnt = 0, last = 0; const deb = []; let nextT = 0, rawEdges = 0, debEdges = 0, prev = 0, delay = NaN;
      raw.forEach(([t, v]) => {
        if (v && !prev) rawEdges++; prev = v;
        if (t >= nextT) { nextT += Ts; if (v === last) cnt++; else { cnt = 1; last = v; } if (cnt >= N && out !== v) { if (v && !out) { debEdges++; if (isNaN(delay)) delay = t - 5; } out = v; } }
        deb.push([t, out]);
      });
      const v = QSim.view(cv, 0.45), f = QSim.frame(v, { x0: 0, x1: 100, y0: -1.6, y1: 1.4, xl: "t (ms)", yl: "" }); f.axes({ noGrid: true });
      f.path(raw.map(([t, y]) => [t, y * 0.9 + 0.3]), c.warn, 1.5); f.path(deb.map(([t, y]) => [t, y * 0.9 - 1.4]), c.main, 2.5);
      f.text("스위치 원신호", 70, 1.25, c.warn); f.text("디바운서 출력", 70, -0.35, c.main);
      S.out(`가상 스위치: 5 ms에 누르고 60 ms에 뗌. 접점이 ${S.val("bounce")} ms 동안 튐\n` +
        `원신호의 상승 모서리 ${rawEdges}개 → 카운터에 바로 물리면 한 번 누른 것을 ${rawEdges}번으로 셉니다.\n` +
        `디바운서(표본 간격 ${Ts} ms, ${N}번 연속 같으면 인정): 상승 모서리 ${debEdges}개, 누른 뒤 출력까지 ${isNaN(delay) ? "-" : delay.toFixed(1) + " ms"}. 인정 시간 ≈ ${(Ts * N).toFixed(1)} ms`);
    }
    S.$(".again").addEventListener("click", () => { seed = (seed * 48271) % 2147483647; draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 8. UART 프레임과 보율 오차 (04-03) */
  (() => {
    const S = QSim.card("lab-e34-uart"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), ch = (S.$('[name="ch"]').value || "A")[0], code = ch.charCodeAt(0) & 255, err = S.val("err") / 100, baud = +S.val("baud");
      const bits = [0, ...Array.from({ length: 8 }, (_, i) => (code >> i) & 1), 1];   // 시작 비트, LSB부터 8비트, 정지 비트
      const Tb = 1 / baud, Tr = Tb * (1 + err);          // 받는 쪽이 생각하는 비트 길이
      const level = (t) => { const k = Math.floor(t / Tb); return t < 0 ? 1 : k >= 10 ? 1 : bits[k]; };
      const samp = Array.from({ length: 10 }, (_, k) => (k + 0.5) * Tr);   // 시작 모서리에서 반 비트, 이후 한 비트마다
      const got = samp.map(level), byte = got.slice(1, 9).reduce((a, b, i) => a + (b << i), 0), frameOK = got[9] === 1 && got[0] === 0;
      const v = QSim.view(cv, 0.4), f = QSim.frame(v, { x0: -0.5, x1: 11, y0: -0.6, y1: 1.6, xl: "t (비트 시간)", yl: "" }); f.axes({ noGrid: true });
      const pts = []; for (let i = 0; i <= 1150; i++) { const t = -0.5 + i / 100; pts.push([t, level(t * Tb)]); } f.path(pts, c.main, 2.5);
      for (let k = 0; k <= 10; k++) f.path([[k, -0.3], [k, 1.3]], c.rule, 1, [2, 3]);
      ["시작", "b0", "b1", "b2", "b3", "b4", "b5", "b6", "b7", "정지"].forEach((s, k) => f.text(s, k + 0.2, 1.42, c.ink3));
      samp.forEach((t, k) => { const x = t / Tb, ok = got[k] === bits[k]; f.dot(x, got[k], ok ? c.acc : c.warn, 5); });
      const off = (samp[9] / Tb - 9.5);
      S.out(`보낸 글자 '${ch}' = 0x${code.toString(16).toUpperCase().padStart(2, "0")} = ${bin(code, 8)} (선 위에는 LSB부터 b0…b7), ${baud} bps, 8N1 프레임\n` +
        `받는 쪽 보율 오차 ${(err * 100).toFixed(1)}% → 마지막(정지) 비트 표본이 비트 가운데에서 ${(off * 100).toFixed(0)}% 비트만큼 벗어남\n` +
        `받은 바이트 ${bin(byte, 8)} = 0x${byte.toString(16).toUpperCase().padStart(2, "0")} '${byte >= 32 && byte < 127 ? String.fromCharCode(byte) : "?"}' ${byte === code && frameOK ? "✔ 맞음" : frameOK ? "✘ 값이 틀림" : "✘ 프레임 오류(정지 비트가 0)"}\n` +
        `주황 점: 받는 쪽 표본 시점(빨강이면 틀린 비트). 표본이 반 비트 넘게 밀리면 틀림: |오차| < 0.5/9.5 ≈ 5.3%`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
