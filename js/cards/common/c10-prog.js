/* 공통10 실습 카드 묶음: 재귀 호출 나무, 포인터와 메모리, 수의 저장, 사다리꼴과 이분법 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const mono = () => getComputedStyle(document.documentElement).getPropertyValue("--f-mono") || "monospace";

  /* 3. 피보나치 재귀 호출 나무 (03-01) */
  (() => {
    const S = QSim.card("lab-c10-recur"); if (!S) return;
    const cv = S.$("canvas");
    let nodes = [], ev = [], k = 0;
    function build() {
      const n = S.val("n"), memo = S.val("memo"), seen = new Map(); nodes = []; ev = [];
      const call = (m, parent, depth) => {
        const id = nodes.length, nd = { m, parent, depth, kids: [], val: null, cached: false }; nodes.push(nd);
        if (parent >= 0) nodes[parent].kids.push(id);
        ev.push(["in", id]);
        if (memo && seen.has(m)) { nd.cached = true; nd.val = seen.get(m); }
        else if (m <= 1) nd.val = m;
        else { const a = call(m - 1, id, depth + 1), b = call(m - 2, id, depth + 1); nd.val = a + b; }
        if (memo) seen.set(m, nd.val);
        ev.push(["out", id]); return nd.val;
      };
      call(n, -1, 0);
      let leaf = 0; const place = (id) => { const nd = nodes[id]; if (!nd.kids.length) nd.x = leaf++; else { nd.kids.forEach(place); nd.x = (nodes[nd.kids[0]].x + nodes[nd.kids[nd.kids.length - 1]].x) / 2; } };
      place(0); nodes.leaves = leaf; k = 0;
    }
    function state() { const vis = new Set(), done = new Set(), stack = []; for (let i = 0; i < k; i++) { const [t, id] = ev[i]; if (t === "in") { vis.add(id); stack.push(id); } else { done.add(id); stack.pop(); } } return { vis, done, stack }; }
    function draw() {
      const c = C(), { vis, done, stack } = state(), D = Math.max(...nodes.map((d) => d.depth)) + 1;
      const v = QSim.view(cv, 0.55), g = v.g, sx = (v.W - 30) / Math.max(1, nodes.leaves - 1 || 1), sy = (v.H - 30) / Math.max(1, D - 1 || 1);
      const P = (nd) => [15 + (nodes.leaves > 1 ? nd.x * sx : (v.W - 30) / 2), 15 + nd.depth * sy];
      g.strokeStyle = c.rule; g.lineWidth = 1;
      nodes.forEach((nd, id) => { if (nd.parent >= 0 && vis.has(id)) { const [x1, y1] = P(nodes[nd.parent]), [x2, y2] = P(nd); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); } });
      const r = Math.max(6, Math.min(13, sx * 0.42));
      g.textAlign = "center"; g.font = Math.round(r * 0.95) + "px " + mono();
      nodes.forEach((nd, id) => {
        if (!vis.has(id)) return; const [x, y] = P(nd), top = stack[stack.length - 1] === id;
        g.fillStyle = nd.cached ? c.acc : done.has(id) ? c.soft : c.card; g.strokeStyle = top ? c.warn : c.main; g.lineWidth = top ? 3 : 1.5;
        g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.stroke();
        g.fillStyle = c.ink; g.fillText(String(nd.m), x, y + r * 0.35);
        if (done.has(id) && r > 8) { g.fillStyle = c.ink2; g.fillText("=" + nd.val, x, y + r + 11); }
      });
      g.textAlign = "left";
      const calls = vis.size, total = nodes.length;
      S.out(`fib(${S.val("n")}) = ${nodes[0].val}${S.val("memo") ? " (메모이제이션: 주황은 저장된 값을 바로 꺼낸 호출)" : ""}\n호출 ${calls} / 전체 ${total}번\n호출 스택: ${stack.map((id) => "fib(" + nodes[id].m + ")").join(" → ") || "(비어 있음)"}`);
    }
    let acc = 0;
    const L = QSim.loop((dt) => { acc += dt; const sp = 0.35 / Math.max(1, nodes.length / 20); if (acc > sp) { acc = 0; if (k >= ev.length) return false; k++; draw(); } return true; }).watch(S.root);
    QSim.playButton(S.$(".play"), L, () => { if (k >= ev.length) k = 0; });
    S.$(".all").addEventListener("click", () => { L.stop(); S.$(".play").textContent = "재생"; k = ev.length; draw(); });
    S.on(() => { L.stop(); S.$(".play").textContent = "재생"; build(); k = ev.length; draw(); });
    QSim.redrawOn(draw); build(); k = ev.length; draw();
  })();

  /* 4. 포인터와 메모리 (05-02) */
  (() => {
    const S = QSim.card("lab-c10-pointer"); if (!S) return;
    const cv = S.$("canvas");
    const T = { int: [4, "int", [10, 20, 30, 40, 50]], double: [8, "double", [1.5, 2.5, 3.5, 4.5, 5.5]], char: [1, "char", ["'H'", "'e'", "'l'", "'l'", "'o'"]] };
    const BASE = 0x7ffc1000;
    let pi = 0, vals = null, msg = "";
    const hex = (x) => "0x" + x.toString(16);
    function reset() { pi = 0; vals = T[S.val("ty")][2].slice(); msg = ""; draw(); }
    function draw() {
      const c = C(), [sz, nm] = T[S.val("ty")], v = QSim.view(cv, 0.42), g = v.g, n = 7, w = (v.W - 20) / n, h = Math.min(46, v.H * 0.3), y = v.H * 0.52;
      g.font = "11px " + mono(); g.textAlign = "center";
      for (let j = -1; j <= 5; j++) {
        const x = 10 + (j + 1) * w, inside = j >= 0 && j < 5;
        g.fillStyle = inside ? c.card : c.rule; g.fillRect(x + 2, y, w - 4, h); g.strokeStyle = c.ink3; g.lineWidth = 1; g.strokeRect(x + 2, y, w - 4, h);
        g.fillStyle = c.ink; g.font = "bold 13px " + mono(); g.fillText(inside ? String(vals[j]) : "?", x + w / 2, y + h / 2 + 5);
        g.font = "10px " + mono(); g.fillStyle = c.ink3; g.fillText(hex(BASE + j * sz), x + w / 2, y + h + 13);
        g.fillStyle = c.ink2; g.fillText(inside ? `a[${j}]` : "(남의 자리)", x + w / 2, y - 6);
      }
      const px = 10 + (pi + 1.5) * w, inR = pi >= -1 && pi <= 5;
      g.fillStyle = c.main; g.font = "bold 12px " + mono(); g.fillText("p", inR ? px : v.W / 2, 16);
      if (inR) { g.strokeStyle = c.warn; g.fillStyle = c.warn; g.lineWidth = 2; g.beginPath(); g.moveTo(px, 22); g.lineTo(px, y - 18); g.stroke(); g.beginPath(); g.moveTo(px, y - 14); g.lineTo(px - 5, y - 22); g.lineTo(px + 5, y - 22); g.fill(); }
      g.textAlign = "left";
      const ok = pi >= 0 && pi < 5;
      S.out(`${nm} a[5]; ${nm} *p = a + ${pi};   (${nm} 하나 = ${sz}바이트)\np = ${hex(BASE + pi * sz)}, p - a = ${pi}, *p = ${ok ? vals[pi] : "알 수 없음"}\n${ok ? "a[" + pi + "], *(a + " + pi + "), *p는 모두 같은 자리" : "배열 범위 밖! C는 막지 않으며, 읽거나 쓰면 정의되지 않은 동작이다"}${msg ? "\n" + msg : ""}`);
    }
    const mv = (d) => () => { pi = Math.max(-1, Math.min(6, pi + d)); msg = d > 0 ? `p++ : 주소가 ${T[S.val("ty")][0]}바이트 늘었다` : `p-- : 주소가 ${T[S.val("ty")][0]}바이트 줄었다`; draw(); };
    S.$(".inc").addEventListener("click", mv(1)); S.$(".dec").addEventListener("click", mv(-1));
    S.$(".write").addEventListener("click", () => {
      if (pi < 0 || pi > 4) { msg = "*p에 쓰기: 범위 밖이라 다른 변수를 망가뜨릴 수 있다 (여기서는 막아 둠)"; draw(); return; }
      const ty = S.val("ty"); vals[pi] = ty === "char" ? "'X'" : ty === "double" ? +(vals[pi] * 2).toFixed(2) : vals[pi] * 2; msg = ty === "char" ? "*p = 'X'" : "*p *= 2"; draw();
    });
    S.$(".reset").addEventListener("click", reset);
    S.on(reset); QSim.redrawOn(draw); reset();
  })();

  /* 5. 수가 저장되는 모습 (06-01) */
  (() => {
    const S = QSim.card("lab-c10-bits"); if (!S) return;
    const cv = S.$("canvas"), inp = S.$('[name="x"]');
    function bitsOf(x, ty) {
      const dv = new DataView(new ArrayBuffer(8));
      if (ty === "f32") { dv.setFloat32(0, x); return [...Array(32)].map((_, i) => (dv.getUint8(i >> 3) >> (7 - (i & 7))) & 1); }
      if (ty === "f64") { dv.setFloat64(0, x); return [...Array(64)].map((_, i) => (dv.getUint8(i >> 3) >> (7 - (i & 7))) & 1); }
      const nb = ty === "i8" ? 8 : 32, m = BigInt.asUintN(nb, BigInt(Math.trunc(x)));
      return [...Array(nb)].map((_, i) => Number((m >> BigInt(nb - 1 - i)) & 1n));
    }
    function draw() {
      const c = C(), ty = S.val("ty"), raw = inp.value.trim(), x = Number(raw);
      if (raw !== "" && (x === Infinity || x === -Infinity)) { QSim.view(cv, 0.14); S.out(`${raw}: double로 나타낼 수 있는 가장 큰 수(약 1.8×10^308)를 넘어 무한대(Infinity)가 된다`); return; }
      if (raw === "" || !isFinite(x)) { S.out("수를 넣으세요 (예: 0.1, 100000001, -13)"); return; }
      const b = bitsOf(x, ty), nb = b.length, v = QSim.view(cv, nb > 32 ? 0.2 : 0.14), g = v.g;
      const per = nb > 32 ? 32 : nb, rows = Math.ceil(nb / per), w = (v.W - 10) / per, h = Math.min(26, (v.H - 10) / rows - 4);
      const sec = ty === "f32" ? [1, 9] : ty === "f64" ? [1, 12] : [1, 1];
      g.font = "bold 11px " + mono(); g.textAlign = "center";
      b.forEach((bit, i) => {
        const r = Math.floor(i / per), x0 = 5 + (i % per) * w, y0 = 5 + r * (h + 6);
        g.fillStyle = i < sec[0] ? "#e8b4b2" : i < sec[1] ? c.acc : c.soft; if (ty[0] === "i") g.fillStyle = i === 0 ? "#e8b4b2" : c.soft;
        g.fillRect(x0 + 0.5, y0, w - 1, h); g.fillStyle = c.ink; g.fillText(String(bit), x0 + w / 2, y0 + h * 0.7);
      });
      g.textAlign = "left";
      let txt;
      if (ty[0] === "f") {
        const st = ty === "f32" ? Math.fround(x) : x, eb = ty === "f32" ? 8 : 11, bias = ty === "f32" ? 127 : 1023;
        const e = parseInt(b.slice(1, 1 + eb).join(""), 2), err = Math.abs(st - x);
        const exact = st === 0 ? "0" : st.toPrecision(ty === "f32" ? 12 : 20);
        txt = `${ty === "f32" ? "단정도 float (부호 1 / 지수 8 / 가수 23)" : "배정도 double (부호 1 / 지수 11 / 가수 52)"}\n지수 비트 ${e} → 2^${e - bias}${e === 0 ? " (0 또는 비정규수)" : ""}\n입력 ${raw}\n실제로 저장된 값 ${exact}${ty === "f32" ? "\n입력(배정도)과의 차이 " + err.toExponential(3) + (x ? ", 상대 오차 " + (err / Math.abs(x)).toExponential(2) : "") : ""}`;
      } else {
        const nbits = ty === "i8" ? 8 : 32, t = Math.trunc(x), w2 = Number(BigInt.asIntN(nbits, BigInt(t))), lo = -(2 ** (nbits - 1)), hi = 2 ** (nbits - 1) - 1;
        txt = `${nbits}비트 부호 있는 정수, 범위 ${lo} ~ ${hi} (맨 앞 비트가 1이면 음수)\n입력 ${t}${t !== x ? " (소수점 아래 버림)" : ""} → 저장 ${w2}${w2 !== t ? "  오버플로: 2^" + nbits + "의 배수만큼 감겨 돌아갔다" : ""}`;
      }
      S.out(txt);
    }
    inp.addEventListener("input", draw); S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 6. 사다리꼴 공식과 이분법 (06-02) */
  (() => {
    const S = QSim.card("lab-c10-numint"); if (!S) return;
    const cv = S.$("canvas");
    const F = {
      sin: { f: Math.sin, s: "sin x", ta: 0, tb: Math.PI, I: 2, ba: 3, bb: 4, root: Math.PI },
      sq: { f: (x) => x * x - 2, s: "x² − 2", ta: 0, tb: 2, I: 8 / 3 - 4, ba: 1, bb: 2, root: Math.SQRT2 },
      cos: { f: (x) => Math.cos(x) - x, s: "cos x − x", ta: 0, tb: 1, I: Math.sin(1) - 0.5, ba: 0, bb: 1, root: 0.7390851332151607 }
    };
    function draw() {
      const c = C(), q = F[S.val("fn")], n = S.val("n"), mode = S.val("mode");
      if (mode === "trap") {
        const a = q.ta, b = q.tb, h = (b - a) / n; let s = (q.f(a) + q.f(b)) / 2; for (let i = 1; i < n; i++) s += q.f(a + i * h); const T = h * s;
        const ys = []; for (let i = 0; i <= 100; i++) ys.push(q.f(a + (b - a) * i / 100));
        const y0 = Math.min(0, ...ys), y1 = Math.max(0, ...ys), pd = (y1 - y0) * 0.1;
        const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: a, x1: b, y0: y0 - pd, y1: y1 + pd, xl: "x" }); f.axes();
        const g = v.g;
        for (let i = 0; i < n; i++) {
          const x1 = a + i * h, x2 = x1 + h; g.fillStyle = c.soft; g.globalAlpha = 0.8; g.beginPath(); g.moveTo(f.X(x1), f.Y(0)); g.lineTo(f.X(x1), f.Y(q.f(x1))); g.lineTo(f.X(x2), f.Y(q.f(x2))); g.lineTo(f.X(x2), f.Y(0)); g.closePath(); g.fill(); g.globalAlpha = 1;
          g.strokeStyle = c.main; g.lineWidth = 1; g.stroke();
        }
        f.fn(q.f, c.warn, 2);
        const e = q.I - T;
        S.out(`∫ ${q.s} dx, [${a}, ${b === Math.PI ? "π" : b}], n = ${n}, h = ${h.toFixed(4)}\n사다리꼴 ${T.toFixed(6)}, 참값 ${q.I.toFixed(6)}, 오차 ${e.toExponential(3)}\n오차 × n² = ${(e * n * n).toFixed(4)} (n을 바꿔도 거의 일정 → 오차 ∝ 1/n²)`);
      } else {
        let a = q.ba, b = q.bb; const hist = [];
        for (let i = 0; i < n; i++) { const m = (a + b) / 2; hist.push([a, b, m]); if (q.f(a) * q.f(m) <= 0) b = m; else a = m; }
        const lo = q.ba - 0.1 * (q.bb - q.ba), hi = q.bb + 0.1 * (q.bb - q.ba);
        const ys = []; for (let i = 0; i <= 100; i++) ys.push(q.f(lo + (hi - lo) * i / 100));
        const y0 = Math.min(0, ...ys), y1 = Math.max(0, ...ys), pd = (y1 - y0) * 0.1;
        const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: lo, x1: hi, y0: y0 - pd, y1: y1 + pd, xl: "x" }); f.axes();
        const g = v.g; g.fillStyle = c.soft; g.globalAlpha = 0.7; g.fillRect(f.X(a), f.Y(y1 + pd), Math.max(2, f.X(b) - f.X(a)), f.Y(y0 - pd) - f.Y(y1 + pd)); g.globalAlpha = 1;
        f.fn(q.f, c.warn, 2);
        hist.forEach(([, , m], i) => f.dot(m, 0, i === hist.length - 1 ? c.main : c.ink3, i === hist.length - 1 ? 5 : 3));
        const m = (a + b) / 2;
        S.out(`${q.s} = 0, 처음 구간 [${q.ba}, ${q.bb}], ${n}번 반복\n남은 구간 [${a.toFixed(8)}, ${b.toFixed(8)}], 길이 ${(b - a).toExponential(2)} = ${(q.bb - q.ba)}/2^${n}\n가운데 ${m.toFixed(8)}, 실제 근 ${q.root.toFixed(8)}, 오차 ${Math.abs(m - q.root).toExponential(2)}`);
      }
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
