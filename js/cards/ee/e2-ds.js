/* 전전2 데이터구조 탐구 카드 묶음
   1 증가율 비교(01-02)  2 동적 배열의 재할당(01-03)  3 배열과 연결 리스트의 삽입 비용(02-01)
   4 이진 트리 순회 따라가기(03-01)  5 이진 탐색 트리 만들기(03-02)  6 최소 힙의 push와 pop(03-03) */
(() => {
  "use strict";
  if (!window.QSim) return;
  const C = () => QSim.col();
  const f2 = (x, d = 3) => (Math.abs(x) < 5e-13 ? 0 : x).toFixed(d);
  const mono = () => getComputedStyle(document.documentElement).getPropertyValue("--f-mono") || "monospace";
  const fmtT = (s) => (s < 1e-6 ? `${f2(s * 1e9, 1)} ns` : s < 1e-3 ? `${f2(s * 1e6, 1)} μs` : s < 1 ? `${f2(s * 1e3, 1)} ms` : s < 3600 ? `${f2(s, 1)} 초` : s < 86400 * 365 ? `${f2(s / 3600, 1)} 시간` : `${(s / 86400 / 365).toExponential(1)} 년`);

  /* 1. 증가율 비교 (로그-로그) */
  (() => {
    const S = QSim.card("exp-e2-growth"); if (!S) return;
    const cv = S.$("canvas");
    const fs = [
      ["log n", (n) => Math.log2(n)], ["n", (n) => n], ["n log n", (n) => n * Math.log2(n)],
      ["n²", (n) => n * n], ["n³", (n) => n ** 3], ["2ⁿ", (n) => 2 ** n],
    ];
    function draw() {
      const c = C(), lg = S.val("lgn"), n = 10 ** lg, ka = S.val("ka");
      const v = QSim.view(cv, 0.5), fr = QSim.frame(v, { x0: 0, x1: 7, y0: 0, y1: 22, xl: "log₁₀ n", yl: "log₁₀ 연산 수" }); fr.axes();
      const cols = [c.ink3, c.main, c.acc, c.warn, c.ink2, c.rule];
      fs.forEach(([name, f], i) => fr.fn((u) => { const y = Math.log10(Math.max(1, f(10 ** u))); return y > 22 ? NaN : y; }, cols[i], 2, undefined, 400));
      fr.path([[lg, 0], [lg, 22]], c.rule, 1, [3, 3]);
      fs.forEach(([name, f], i) => { const y = Math.log10(Math.max(1, f(10 ** 0.9))); if (y < 21) fr.text(name, 0.95, y + 0.4, cols[i]); });
      const rows = fs.map(([name, f]) => { const ops = f(n); return `${name.padEnd(7)} ${ops > 1e300 || !isFinite(ops) ? "∞" : ops.toExponential(2)}회 → ${!isFinite(ops) || ops > 1e300 ? "계산 불가" : fmtT(ops / 1e9)}`; });
      const A = (m) => ka * m * Math.log2(m), B = (m) => m * m; let cross = 2; while (cross < 1e9 && A(cross) >= B(cross)) cross++;
      S.out(`n = 10^${f2(lg, 1)} (${n.toExponential(1)}), 초당 10⁹번 연산하는 컴퓨터 기준\n${rows.join("\n")}\n` +
        `상수 비교: ${ka}·n log n 과 n² → n ≥ ${cross}부터 n log n 쪽이 빠름`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

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

  /* 3. 배열과 연결 리스트의 위치 i 삽입 비용 */
  (() => {
    const S = QSim.card("exp-e2-insert"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), n = S.val("n"), i = Math.min(S.val("i"), n);
      const arrMove = n - i, listWalk = i;   // 배열: 뒤 n − i개 이동, 연결 리스트: i번 따라가기 + 참조 2개
      const v = QSim.view(cv, 0.42), g = v.g, W = v.W, H = v.H, m = Math.min(n, 24), cw = (W - 40) / m;
      g.font = "11px " + mono(); g.textAlign = "center";
      const shown = (j) => Math.round(j * (n - 1) / Math.max(1, m - 1));
      for (let j = 0; j < m; j++) {
        const idx = shown(j), x = 20 + j * cw;
        g.fillStyle = idx >= i ? c.warn : c.soft; g.globalAlpha = idx >= i ? 0.35 : 0.6; g.fillRect(x + 1, 20, cw - 2, 26); g.globalAlpha = 1;
        g.strokeStyle = c.rule; g.strokeRect(x + 1, 20, cw - 2, 26);
        g.fillStyle = c.ink2; if (m <= 24) g.fillText(String(idx), x + cw / 2, 37);
        g.fillStyle = idx < i ? c.main : c.soft; g.globalAlpha = idx < i ? 0.35 : 0.2; g.beginPath(); g.arc(x + cw / 2, H - 40, Math.min(10, cw / 2 - 2), 0, 7); g.fill(); g.globalAlpha = 1;
        if (j < m - 1) { g.strokeStyle = c.rule; g.beginPath(); g.moveTo(x + cw / 2 + 8, H - 40); g.lineTo(x + cw * 1.5 - 8, H - 40); g.stroke(); }
      }
      g.fillStyle = c.ink2; g.textAlign = "left"; g.fillText(`배열(주황 칸이 한 칸씩 밀림)`, 20, 14); g.fillText(`연결 리스트(파랑 노드를 따라감)`, 20, H - 16);
      S.out(`원소 ${n}개, 위치 i = ${i}에 삽입\n` +
        `배열: 뒤쪽 ${arrMove}개를 한 칸씩 이동 → 쓰기 ${arrMove + 1}번 (O(n − i))\n` +
        `연결 리스트: 머리에서 ${listWalk}번 따라간 뒤 참조 2개 변경 (O(i)). 위치를 이미 알면 참조 변경만, O(1)\n` +
        `i = 0이면 배열이 가장 비싸고(${n}번 이동) 연결 리스트가 가장 쌉니다. i = ${n}(끝)이면 반대입니다(배열은 이동 0, 꼬리 참조가 없는 리스트는 ${n}번 따라감).`);
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
})();
