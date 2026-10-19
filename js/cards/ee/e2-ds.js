/* 전전2 데이터구조 탐구 카드 묶음
   1 증가율 비교(01-02)  2 동적 배열의 재할당(01-03)  3 배열과 연결 리스트의 삽입 비용(02-01)
   4 이진 트리 순회 따라가기(03-01)  5 이진 탐색 트리 만들기(03-02)  6 최소 힙의 push와 pop(03-03)
   7 AVL과 BST 비교(04-01)  8 정렬 비교 횟수(05-01)  9 해시 표의 군집(06-01)  10 격자 BFS·DFS(07-01)  11 Kruskal 따라가기(07-02) */
(() => {
  "use strict";
  if (!window.QSim) return;
  const C = () => QSim.col();
  const f2 = (x, d = 3) => (Math.abs(x) < 5e-13 ? 0 : x).toFixed(d);
  const mono = () => getComputedStyle(document.documentElement).getPropertyValue("--f-mono") || "monospace";
  const fmtT = (s) => (s < 1e-6 ? `${f2(s * 1e9, 1)} ns` : s < 1e-3 ? `${f2(s * 1e6, 1)} μs` : s < 1 ? `${f2(s * 1e3, 1)} ms` : s < 3600 ? `${f2(s, 1)} 초` : s < 86400 * 365 ? `${f2(s / 3600, 1)} 시간` : `${(s / 86400 / 365).toExponential(1)} 년`);

  /* 2. 동적 배열: 누적 복사 횟수 */
  (() => {
    const S = QSim.card("exp-e2-dynarray"); if (!S) return;
    const cv = S.$("canvas");
    const sim = (n, grow) => { let cap = 1, size = 0, copies = 0, worst = 0; const pts = [[0, 0]], realloc = []; for (let i = 1; i <= n; i++) { if (size === cap) { copies += size; worst = Math.max(worst, size); realloc.push(i); cap = grow(cap); } size++; pts.push([i, copies]); } return { pts, copies, worst, realloc, cap }; };
    function draw() {
      const c = C(), n = S.val("n"), mode = S.val("mode"), k = S.val("k");
      const g = mode === "double" ? (x) => 2 * x : mode === "x15" ? (x) => Math.max(x + 1, Math.floor(x * 1.5)) : (x) => x + k;
      const r = sim(n, g), d = sim(n, (x) => 2 * x);
      const top = Math.max(r.copies, d.copies, 1) * 1.1;
      const v = QSim.view(cv, 0.45), fr = QSim.frame(v, { x0: 0, x1: n, y0: 0, y1: top, xl: "append 횟수", yl: "누적 복사" }); fr.axes();
      fr.path(d.pts, c.ink3, 1.5, [5, 3]); fr.path(r.pts, c.main, 2.4);
      fr.fn((x) => 2 * x, c.rule, 1, [2, 3]);
      const name = mode === "double" ? "두 배" : mode === "x15" ? "1.5배" : `${k}칸씩`;
      S.out(`용량 늘리기: ${name}, 처음 용량 1, append ${n}번\n` +
        `재할당 ${r.realloc.length}번, 총 복사 ${r.copies}번 (append 한 번당 ${f2(r.copies / n, 3)}번), 한 번에 가장 많이 복사한 수 ${r.worst}, 마지막 용량 ${r.cap}\n` +
        `회색 점선: 두 배 전략(${d.copies}번), 연한 점선: 2n 직선. 일정 비율로 늘리면 2n 아래(또는 근처)의 직선, 일정량씩 늘리면 포물선이 됩니다.`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 트리 그리기 도우미: 중위 순서로 x, 깊이로 y */
  function layout(root) {
    const pos = new Map(); let x = 0, maxd = 0;
    (function walk(t, d) { if (!t) return; walk(t.l, d + 1); pos.set(t, [x++, d]); maxd = Math.max(maxd, d); walk(t.r, d + 1); })(root, 0);
    return { pos, n: x, maxd };
  }
  function drawTree(v, root, hl, c, labelOf) {
    const g = v.g, W = v.W, H = v.H, L = layout(root); if (!L.n) return;
    const X = (i) => 24 + (W - 48) * (L.n === 1 ? 0.5 : i / (L.n - 1)), Y = (d) => 24 + (H - 48) * (L.maxd === 0 ? 0 : d / Math.max(L.maxd, 1));
    g.strokeStyle = c.rule; g.lineWidth = 1.5;
    L.pos.forEach(([i, d], t) => { [t.l, t.r].forEach((ch) => { if (ch) { const [ci, cd] = L.pos.get(ch); g.beginPath(); g.moveTo(X(i), Y(d)); g.lineTo(X(ci), Y(cd)); g.stroke(); } }); });
    g.font = "12px " + mono(); g.textAlign = "center";
    L.pos.forEach(([i, d], t) => { const h = hl ? hl(t) : 0; g.fillStyle = h === 2 ? c.warn : h === 1 ? c.acc : c.soft; g.beginPath(); g.arc(X(i), Y(d), 13, 0, 7); g.fill(); g.strokeStyle = c.ink3; g.stroke(); g.fillStyle = c.ink; g.fillText(labelOf ? labelOf(t) : String(t.k), X(i), Y(d) + 4); });
  }
  const bstInsert = (t, k) => { if (!t) return { k, l: null, r: null }; if (k < t.k) t.l = bstInsert(t.l, k); else if (k > t.k) t.r = bstInsert(t.r, k); return t; };
  const height = (t) => (t ? 1 + Math.max(height(t.l), height(t.r)) : -1);
  const parseKeys = (s) => s.split(/[\s,]+/).map(Number).filter((x) => Number.isFinite(x));

  /* 4. 순회 따라가기 */
  (() => {
    const S = QSim.card("exp-e2-traverse"); if (!S) return;
    const cv = S.$("canvas");
    let root = null, seq = [], step = 0;
    const build = () => { root = null; parseKeys("50 30 70 20 40 60 80 35").forEach((k) => (root = bstInsert(root, k))); };
    const order = (kind) => {
      const out = [];
      if (kind === "level") { const q = [root]; while (q.length) { const t = q.shift(); if (!t) continue; out.push(t); q.push(t.l, t.r); } return out; }
      (function w(t) { if (!t) return; if (kind === "pre") out.push(t); w(t.l); if (kind === "in") out.push(t); w(t.r); if (kind === "post") out.push(t); })(root);
      return out;
    };
    function draw() {
      const c = C(), kind = S.val("ord"); seq = order(kind); step = Math.min(step, seq.length);
      const v = QSim.view(cv, 0.5), done = new Set(seq.slice(0, step));
      drawTree(v, root, (t) => (seq[step - 1] === t ? 2 : done.has(t) ? 1 : 0), c);
      const names = { pre: "전위(뿌리 → 왼쪽 → 오른쪽)", in: "중위(왼쪽 → 뿌리 → 오른쪽)", post: "후위(왼쪽 → 오른쪽 → 뿌리)", level: "레벨(큐 사용)" };
      S.out(`${names[kind]}, ${step}/${seq.length}단계\n방문한 순서: ${seq.slice(0, step).map((t) => t.k).join(", ") || "(아직 없음)"}\n` +
        (step === seq.length ? `완료: ${seq.map((t) => t.k).join(", ")}` : `다음에 방문할 노드: ${seq[step].k}. 빨강: 방금 방문, 주황: 이미 방문`));
    }
    build();
    S.$(".next").addEventListener("click", () => { step = Math.min(step + 1, seq.length); draw(); });
    S.$(".reset").addEventListener("click", () => { step = 0; draw(); });
    S.on(() => { step = 0; draw(); }); QSim.redrawOn(draw); draw();
  })();

  /* 5. 이진 탐색 트리 만들기 */
  (() => {
    const S = QSim.card("exp-e2-bst"); if (!S) return;
    const cv = S.$("canvas"), inp = S.$('[name="keys"]');
    function draw() {
      const c = C(), keys = parseKeys(inp.value), target = S.val("find");
      let root = null; keys.forEach((k) => (root = bstInsert(root, k)));
      const path = []; let t = root; while (t) { path.push(t); if (target === t.k) break; t = target < t.k ? t.l : t.r; }
      const found = path.length && path[path.length - 1].k === target;
      const v = QSim.view(cv, 0.55); drawTree(v, root, (n) => (found && n === path[path.length - 1] ? 2 : path.includes(n) ? 1 : 0), c);
      const ino = []; (function w(n) { if (!n) return; w(n.l); ino.push(n.k); w(n.r); })(root);
      const uniq = new Set(keys).size, h = height(root), best = uniq ? Math.floor(Math.log2(uniq)) : 0;
      S.out(`넣은 순서: ${keys.join(", ") || "(없음)"} → 노드 ${uniq}개, 높이 ${h} (가능한 최소 높이 ${best})\n` +
        `중위 순회: ${ino.join(", ")}\n` +
        `${target} 찾기: ${path.map((n) => n.k).join(" → ") || "(빈 트리)"} (비교 ${path.length}번) → ${found ? "찾음" : "없음"}`);
    }
    S.$$("button[data-keys]").forEach((b) => b.addEventListener("click", () => { inp.value = b.dataset.keys; draw(); }));
    S.$(".shuffle").addEventListener("click", () => { const a = Array.from({ length: 15 }, (_, i) => (i + 1) * 5); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } inp.value = a.join(" "); draw(); });
    inp.addEventListener("input", draw); S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 6. 최소 힙: 배열과 트리 */
  (() => {
    const S = QSim.card("exp-e2-heap"); if (!S) return;
    const [cvT, cvA] = S.$$("canvas");
    let a = [], log = "", moved = new Set();
    const toTree = (i) => (i < a.length ? { k: a[i], i, l: toTree(2 * i + 1), r: toTree(2 * i + 2) } : null);
    const push = (x) => { moved = new Set(); a.push(x); let i = a.length - 1, sw = 0; while (i > 0 && a[(i - 1) >> 1] > a[i]) { const p = (i - 1) >> 1; [a[i], a[p]] = [a[p], a[i]]; moved.add(i); moved.add(p); i = p; sw++; } moved.add(i); log = `push ${x}: 끝(인덱스 ${a.length - 1})에 붙이고 위로 ${sw}번 교환`; };
    const pop = () => { moved = new Set(); if (!a.length) { log = "비어 있음"; return; } const top = a[0], last = a.pop(); let sw = 0; if (a.length) { a[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < a.length && a[l] < a[m]) m = l; if (r < a.length && a[r] < a[m]) m = r; if (m === i) break; [a[i], a[m]] = [a[m], a[i]]; moved.add(i); moved.add(m); i = m; sw++; } moved.add(i); } log = `pop → ${top}: 마지막 원소 ${last}를 뿌리로 옮기고 아래로 ${sw}번 교환`; };
    function draw() {
      const c = C(), vt = QSim.view(cvT, 0.45);
      const root = toTree(0); if (root) drawTree(vt, root, (t) => (moved.has(t.i) ? 1 : 0), c);
      const va = QSim.view(cvA, 0.12), g = va.g, n = Math.max(a.length, 1), cw = Math.min(44, (va.W - 20) / n);
      g.font = "12px " + mono(); g.textAlign = "center";
      a.forEach((x, i) => { g.fillStyle = moved.has(i) ? c.acc : c.soft; g.fillRect(10 + i * cw, 4, cw - 2, va.H - 18); g.fillStyle = c.ink; g.fillText(String(x), 10 + i * cw + cw / 2, va.H / 2 + 2); g.fillStyle = c.ink3; g.font = "9px " + mono(); g.fillText(String(i), 10 + i * cw + cw / 2, va.H - 3); g.font = "12px " + mono(); });
      const ok = a.every((x, i) => i === 0 || a[(i - 1) >> 1] <= x);
      S.out(`${log || "값을 넣거나 빼 보세요."}\n배열: [${a.join(", ")}] (원소 ${a.length}개, 높이 ${a.length ? Math.floor(Math.log2(a.length)) : "-"})\n힙 성질(부모 ≤ 자식): ${ok ? "만족" : "깨짐"}. 주황: 이번 연산에서 자리를 바꾼 칸`);
    }
    S.$(".push").addEventListener("click", () => { push(S.val("x")); draw(); });
    S.$(".pop").addEventListener("click", () => { pop(); draw(); });
    S.$(".demo").addEventListener("click", () => { a = []; [5, 3, 8, 1, 9, 2].forEach(push); log = "예제 3.3.1: 5, 3, 8, 1, 9, 2를 차례로 push한 결과"; moved = new Set(); draw(); });
    S.$(".clear").addEventListener("click", () => { a = []; log = "비웠습니다"; moved = new Set(); draw(); });
    QSim.redrawOn(draw); [5, 3, 8, 1, 9, 2].forEach(push); log = "예제 3.3.1: 5, 3, 8, 1, 9, 2를 차례로 push한 결과"; moved = new Set(); draw();
  })();
  /* 7. AVL과 보통 BST */
  const avlInsert = (t, k, log) => {
    const h = (x) => (x ? x.h : -1), fix = (x) => { x.h = 1 + Math.max(h(x.l), h(x.r)); };
    const rr = (y) => { const x = y.l; y.l = x.r; x.r = y; fix(y); fix(x); return x; };
    const rl = (x) => { const y = x.r; x.r = y.l; y.l = x; fix(x); fix(y); return y; };
    const ins = (t) => {
      if (!t) return { k, l: null, r: null, h: 0 };
      if (k < t.k) t.l = ins(t.l); else if (k > t.k) t.r = ins(t.r); else return t;
      fix(t); const b = h(t.l) - h(t.r);
      if (b > 1 && k < t.l.k) { log.push(`${t.k}: LL`); return rr(t); }
      if (b < -1 && k > t.r.k) { log.push(`${t.k}: RR`); return rl(t); }
      if (b > 1) { log.push(`${t.k}: LR`); t.l = rl(t.l); return rr(t); }
      if (b < -1) { log.push(`${t.k}: RL`); t.r = rr(t.r); return rl(t); }
      return t;
    };
    return ins(t);
  };
  (() => {
    const S = QSim.card("exp-e2-avl"); if (!S) return;
    const [cvA, cvB] = S.$$("canvas"), inp = S.$('[name="keys"]');
    function draw() {
      const c = C(), keys = parseKeys(inp.value); let a = null, b = null; const log = [];
      keys.forEach((k) => { a = avlInsert(a, k, log); b = bstInsert(b, k); });
      drawTree(QSim.view(cvA, 0.42), a, null, c); drawTree(QSim.view(cvB, 0.42), b, null, c);
      const n = new Set(keys).size;
      S.out(`넣은 순서: ${keys.join(", ")} (${n}개)\nAVL(위): 높이 ${height(a)}, 회전 ${log.length}번 [${log.join(", ") || "없음"}]\n보통 BST(아래): 높이 ${height(b)}. 가능한 최소 높이 ${n ? Math.floor(Math.log2(n)) : 0}`);
    }
    S.$$("button[data-keys]").forEach((x) => x.addEventListener("click", () => { inp.value = x.dataset.keys; draw(); }));
    inp.addEventListener("input", draw); QSim.redrawOn(draw); draw();
  })();

  /* 8. 정렬 비교 횟수: 병합, 퀵(첫 원소), 퀵(무작위), 삽입 */
  (() => {
    const S = QSim.card("exp-e2-sort"); if (!S) return;
    const cv = S.$("canvas");
    let seed = 1; const rnd = () => { seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff; return seed / 2147483648; };
    const merge = (a, c) => { if (a.length <= 1) return a; const m = a.length >> 1, L = merge(a.slice(0, m), c), R = merge(a.slice(m), c), o = []; let i = 0, j = 0; while (i < L.length && j < R.length) { c.n++; o.push(L[i] <= R[j] ? L[i++] : R[j++]); } return o.concat(L.slice(i), R.slice(j)); };
    const quick = (a, c, rand) => { const st = [a], out = []; const res = new Map(); // 반복 구현(깊은 재귀 방지): 결과 길이만 필요하므로 비교 수만 셈
      while (st.length) { const x = st.pop(); if (x.length <= 1) continue; const p = rand ? x[Math.floor(rnd() * x.length)] : x[0]; c.n += x.length - 1; const L = [], E = [], G = []; for (const v of x) (v < p ? L : v > p ? G : E).push(v); if (!rand) { E.shift(); for (const v of E) G.push(v); } st.push(L, G); }
      return out; };
    const insertion = (a, c) => { a = a.slice(); for (let i = 1; i < a.length; i++) { const x = a[i]; let j = i - 1; while (j >= 0) { c.n++; if (a[j] > x) { a[j + 1] = a[j]; j--; } else break; } a[j + 1] = x; } return a; };
    function draw() {
      const c = C(), n = S.val("n"), kind = S.val("inp");
      seed = 2026; let a = Array.from({ length: n }, (_, i) => i);
      if (kind === "rand") for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
      if (kind === "rev") a.reverse();
      if (kind === "few") a = a.map(() => Math.floor(rnd() * 3));
      seed = 7;
      const res = [["병합", (x, k) => merge(x, k)], ["퀵(첫 원소)", (x, k) => quick(x, k, false)], ["퀵(무작위)", (x, k) => quick(x, k, true)], ["삽입", (x, k) => insertion(x, k)]].map(([nm, f]) => { const k = { n: 0 }; f(a.slice(), k); return [nm, k.n]; });
      const nlog = n * Math.log2(n), half = n * (n - 1) / 2, top = Math.max(...res.map((r) => r[1]), nlog) * 1.1;
      const v = QSim.view(cv, 0.4), g = v.g, bw = (v.W - 60) / res.length;
      g.font = "12px " + mono(); g.textAlign = "center";
      res.forEach(([nm, cnt], i) => { const hgt = (v.H - 50) * cnt / top, x = 40 + i * bw; g.fillStyle = [c.main, c.warn, c.acc, c.ink3][i]; g.fillRect(x + 6, v.H - 30 - hgt, bw - 12, hgt); g.fillStyle = c.ink2; g.fillText(nm, x + bw / 2, v.H - 14); g.fillText(String(cnt), x + bw / 2, v.H - 34 - hgt); });
      const yl = v.H - 30 - (v.H - 50) * nlog / top; g.strokeStyle = c.rule; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(30, yl); g.lineTo(v.W - 10, yl); g.stroke(); g.setLineDash([]);
      const names = { rand: "무작위", sorted: "정렬됨", rev: "역순", few: "값이 0, 1, 2뿐" };
      S.out(`n = ${n}, 입력: ${names[kind]}\n${res.map(([nm, cnt]) => `${nm} ${cnt}`).join(", ")}\n` +
        `참고: n log₂n = ${Math.round(nlog)} (점선), n(n − 1)/2 = ${half}. 비교 횟수는 정렬 코드가 원소끼리 비교한 수입니다(퀵 정렬은 분할마다 n − 1번으로 셈).`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 9. 해시 표의 군집: 체이닝과 선형 조사 */
  (() => {
    const S = QSim.card("exp-e2-hashviz"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), m = 101, alpha = S.val("alpha"), n = Math.round(alpha * m);
      let seed = 11; const rnd = () => { seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff; return seed; };
      const keys = []; const seen = new Set(); while (keys.length < n) { const k = rnd() % 100000; if (!seen.has(k)) { seen.add(k); keys.push(k); } }
      const chain = Array.from({ length: m }, () => 0), lin = new Array(m).fill(null);
      keys.forEach((k) => { chain[k % m]++; let i = k % m; while (lin[i] !== null) i = (i + 1) % m; lin[i] = k; });
      // 실패 탐색 평균(모든 칸에서 시작): 선형은 빈칸까지 거리 + 1, 체이닝은 그 칸 길이
      let missLin = 0; for (let s = 0; s < m; s++) { let i = s, p = 1; while (lin[i] !== null) { i = (i + 1) % m; p++; } missLin += p; } missLin /= m;
      const missChain = chain.reduce((a, b) => a + b, 0) / m;
      let run = 0, maxRun = 0; for (let t = 0; t < 2 * m; t++) { if (lin[t % m] !== null) { run++; maxRun = Math.max(maxRun, Math.min(run, m)); } else run = 0; }
      const v = QSim.view(cv, 0.35), g = v.g, cw = (v.W - 20) / m;
      for (let i = 0; i < m; i++) { g.fillStyle = lin[i] !== null ? c.warn : c.soft; g.globalAlpha = lin[i] !== null ? 0.8 : 0.4; g.fillRect(10 + i * cw, 12, cw - 0.5, 22); g.globalAlpha = 1; const hh = Math.min(chain[i], 6) * 10; g.fillStyle = c.main; g.fillRect(10 + i * cw, v.H - 10 - hh, cw - 0.5, hh); }
      g.fillStyle = c.ink2; g.font = "11px " + mono(); g.fillText("선형 조사: 칸이 찬 모습(주황)", 10, 48); g.fillText("체이닝: 칸마다 리스트 길이(파랑 막대)", 10, v.H - 74);
      const th = (a) => 0.5 * (1 + 1 / ((1 - a) ** 2));
      S.out(`칸 101개, 키 ${n}개 (α = ${f2(n / m, 2)})\n` +
        `실패 탐색 평균: 체이닝 ${f2(missChain, 2)}번(이론 α), 선형 조사 ${f2(missLin, 2)}번(이론 ${n < m ? f2(th(n / m), 2) : "∞"})\n` +
        `선형 조사의 가장 긴 연속 덩어리 ${maxRun}칸. 덩어리가 길수록 그 근처로 오는 키가 끝까지 가야 합니다(군집 현상).`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 10. 격자 미로의 BFS와 DFS */
  (() => {
    const S = QSim.card("exp-e2-grid"); if (!S) return;
    const cv = S.$("canvas");
    const R = 12, Cn = 18;
    const wall = new Set(); [[0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [2, 9], [3, 9], [4, 9], [5, 9], [6, 9], [7, 9], [8, 9], [9, 9], [10, 9], [11, 9], [0, 14], [1, 14], [2, 14], [3, 14], [4, 14], [5, 14], [6, 14], [7, 14], [8, 14], [9, 14]].forEach(([r, c]) => wall.add(r * Cn + c));
    const start = 0, goal = 11 * Cn + 17;
    let order = [], prev = new Map(), step = 0;
    const nb = (u) => { const r = Math.floor(u / Cn), c = u % Cn, out = []; [[0, 1], [1, 0], [0, -1], [-1, 0]].forEach(([dr, dc]) => { const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < R && cc >= 0 && cc < Cn && !wall.has(rr * Cn + cc)) out.push(rr * Cn + cc); }); return out; };
    const run = (kind) => {
      order = []; prev = new Map([[start, -1]]);
      if (kind === "bfs") { const q = [start]; while (q.length) { const u = q.shift(); order.push(u); if (u === goal) break; for (const v of nb(u)) if (!prev.has(v)) { prev.set(v, u); q.push(v); } } }
      else { const st = [[start, -1]], seen = new Set(); prev = new Map(); while (st.length) { const [u, par] = st.pop(); if (seen.has(u)) continue; seen.add(u); prev.set(u, par); order.push(u); if (u === goal) break; for (const v of nb(u).reverse()) if (!seen.has(v)) st.push([v, u]); } }
    };
    function draw() {
      const c = C(), kind = S.val("alg"); const done = new Set(order.slice(0, step));
      const v = QSim.view(cv, R / Cn * 0.95), g = v.g, cs = Math.min((v.W - 10) / Cn, (v.H - 10) / R);
      let path = new Set(); if (step >= order.length && order[order.length - 1] === goal) { let x = goal; while (x !== -1 && x !== undefined) { path.add(x); x = prev.get(x); } }
      for (let r = 0; r < R; r++) for (let q = 0; q < Cn; q++) { const id = r * Cn + q; g.fillStyle = wall.has(id) ? c.ink : path.has(id) ? c.warn : done.has(id) ? c.acc : c.soft; g.globalAlpha = wall.has(id) ? 0.8 : done.has(id) || path.has(id) ? 0.75 : 0.25; g.fillRect(5 + q * cs, 5 + r * cs, cs - 1, cs - 1); g.globalAlpha = 1; }
      g.fillStyle = c.main; g.fillRect(5, 5, cs - 1, cs - 1); g.fillRect(5 + 17 * cs, 5 + 11 * cs, cs - 1, cs - 1);
      const plen = path.size ? path.size - 1 : null;
      S.out(`${kind === "bfs" ? "BFS(큐)" : "DFS(스택)"}: 방문 ${Math.min(step, order.length)}/${order.length}칸` + (plen !== null ? `, 찾은 경로 길이 ${plen}칸` : "") + `\n` +
        `왼쪽 위(파랑)에서 오른쪽 아래(파랑)로. 주황: 방문한 칸, 빨강: 찾은 경로. BFS는 출발점에서 가까운 칸부터 물결처럼 넓혀 가므로 처음 찾은 경로가 최단입니다.`);
    }
    const L = QSim.loop(() => { step = Math.min(step + 2, order.length); draw(); return step < order.length; }).watch(S.root);
    QSim.playButton(S.$(".play"), L, () => { if (step >= order.length) step = 0; });
    S.$(".reset").addEventListener("click", () => { step = 0; draw(); });
    S.$(".end").addEventListener("click", () => { step = order.length; draw(); });
    S.on(() => { run(S.val("alg")); step = 0; draw(); }); QSim.redrawOn(draw); run("bfs"); draw();
  })();

  /* 11. Kruskal 따라가기 */
  (() => {
    const S = QSim.card("exp-e2-kruskal"); if (!S) return;
    const cv = S.$("canvas");
    const P = { A: [0.1, 0.5], B: [0.35, 0.15], C: [0.35, 0.85], D: [0.65, 0.5], E: [0.9, 0.5], F: [0.62, 0.9], G: [0.9, 0.9] };
    const E = [["A", "B", 4], ["A", "C", 1], ["B", "C", 2], ["B", "D", 5], ["C", "D", 8], ["D", "E", 3], ["F", "G", 6]].sort((x, y) => x[2] - y[2]);
    let step = 0;
    function draw() {
      const c = C(), v = QSim.view(cv, 0.5), g = v.g, X = (p) => 30 + p[0] * (v.W - 60), Y = (p) => 20 + p[1] * (v.H - 40);
      const parent = {}; Object.keys(P).forEach((k) => (parent[k] = k)); const find = (x) => { while (parent[x] !== x) x = parent[x]; return x; };
      const status = E.map(() => 0); let total = 0;
      for (let i = 0; i < step; i++) { const [u, w, wt] = E[i], ru = find(u), rw = find(w); if (ru !== rw) { parent[ru] = rw; status[i] = 1; total += wt; } else status[i] = 2; }
      E.forEach(([u, w, wt], i) => { g.strokeStyle = status[i] === 1 ? c.main : status[i] === 2 ? c.warn : c.rule; g.lineWidth = status[i] === 1 ? 4 : 1.5; g.setLineDash(status[i] === 2 ? [4, 4] : []); g.beginPath(); g.moveTo(X(P[u]), Y(P[u])); g.lineTo(X(P[w]), Y(P[w])); g.stroke(); g.setLineDash([]); g.fillStyle = c.ink2; g.font = "12px " + mono(); g.fillText(String(wt), (X(P[u]) + X(P[w])) / 2 + 4, (Y(P[u]) + Y(P[w])) / 2 - 4); });
      g.textAlign = "center"; Object.entries(P).forEach(([k, p]) => { g.fillStyle = c.soft; g.beginPath(); g.arc(X(p), Y(p), 13, 0, 7); g.fill(); g.strokeStyle = c.ink3; g.lineWidth = 1; g.stroke(); g.fillStyle = c.ink; g.fillText(k, X(p), Y(p) + 4); }); g.textAlign = "left";
      const last = step ? E[step - 1] : null;
      S.out(`${step}/${E.length}단계. ` + (last ? `간선 ${last[0]}–${last[1]}(${last[2]}): ${status[step - 1] === 1 ? "서로 다른 무리를 이어 채택" : "두 끝이 이미 같은 무리라 고리가 생기므로 버림"}` : "간선을 무게 순서로 봅니다: " + E.map((e) => `${e[0]}${e[1]}(${e[2]})`).join(", ")) +
        `\n채택(파랑 굵은 선) 합 ${total}. 버림(빨강 점선). 무리: ${[...new Set(Object.keys(P).map(find))].map((r) => Object.keys(P).filter((k) => find(k) === r).join("")).join(" | ")}`);
    }
    S.$(".next").addEventListener("click", () => { step = Math.min(step + 1, E.length); draw(); });
    S.$(".reset").addEventListener("click", () => { step = 0; draw(); });
    QSim.redrawOn(draw); draw();
  })();
/*__MORE__*/
})();
