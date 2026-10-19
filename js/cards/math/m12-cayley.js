/* 수학12 탐구: 곱셈표(케일리 표)로 군의 공리 확인 — Z_n의 덧셈·곱셈, 단원군, 뺄셈 */
(() => {
  "use strict";
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const md = (x, n) => ((x % n) + n) % n;
  const OPS = {
    add: { set: (n) => [...Array(n).keys()], op: (a, b, n) => md(a + b, n), tex: (n) => `(Z_${n}, +)`, sym: "+" },
    mul: { set: (n) => [...Array(n).keys()], op: (a, b, n) => md(a * b, n), tex: (n) => `(Z_${n}, ×)`, sym: "×" },
    nz: { set: (n) => [...Array(n).keys()].slice(1), op: (a, b, n) => md(a * b, n), tex: (n) => `(Z_${n} − {0}, ×)`, sym: "×" },
    units: { set: (n) => [...Array(n).keys()].filter((k) => k > 0 && gcd(k, n) === 1), op: (a, b, n) => md(a * b, n), tex: (n) => `(U(${n}), ×), U(${n}) = ${n}과 서로소인 수`, sym: "×" },
    sub: { set: (n) => [...Array(n).keys()], op: (a, b, n) => md(a - b, n), tex: (n) => `(Z_${n}, −)`, sym: "−" },
  };
  const S = MKit.setup("card-m12-cayley", 1, draw);
  if (!S) return;
  const { k, v } = S;
  function check(G, op) {
    const inG = new Set(G), m = G.length, r = {};
    r.bad = new Set();
    for (const a of G) for (const b of G) if (!inG.has(op(a, b))) r.bad.add(a + "," + b);
    r.closed = r.bad.size === 0;
    r.assoc = null;
    if (r.closed) outer: for (const a of G) for (const b of G) for (const c of G) if (op(op(a, b), c) !== op(a, op(b, c))) { r.assoc = [a, b, c]; break outer; }
    r.id = G.find((e) => G.every((a) => op(e, a) === a && op(a, e) === a));
    r.noInv = r.id === undefined ? [] : G.filter((a) => !G.some((b) => op(a, b) === r.id && op(b, a) === r.id));
    r.comm = G.every((a) => G.every((b) => op(a, b) === op(b, a)));
    r.latin = G.every((a) => new Set(G.map((b) => op(a, b))).size === m) && G.every((b) => new Set(G.map((a) => op(a, b))).size === m);
    return r;
  }
  function draw() {
    const c = QSim.col(), O = OPS[k.val("op")], n = k.val("n"), G = O.set(n), op = (a, b) => O.op(a, b, n), m = G.length;
    const g = v.g, W = v.W, H = v.H, s = Math.min((W - 10) / (m + 1), (H - 10) / (m + 1)), x0 = (W - s * (m + 1)) / 2, y0 = 4;
    const r = check(G, op);
    g.save();
    g.font = `${Math.max(9, Math.min(16, s * 0.42))}px ` + (getComputedStyle(document.body).getPropertyValue("--f-mono").trim() || "monospace");
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillStyle = c.ink3; g.fillText(O.sym, x0 + s / 2, y0 + s / 2);
    G.forEach((a, i) => { g.fillStyle = c.ink2; g.fillText(a, x0 + (i + 1.5) * s, y0 + s / 2); g.fillText(a, x0 + s / 2, y0 + (i + 1.5) * s); });
    G.forEach((a, i) => G.forEach((b, j) => {
      const val = op(a, b), x = x0 + (j + 1) * s, y = y0 + (i + 1) * s;
      g.globalAlpha = 0.35; g.fillStyle = `hsl(${(val * 360) / n}, 65%, 55%)`; g.fillRect(x + 1, y + 1, s - 2, s - 2); g.globalAlpha = 1;
      if (r.bad.has(a + "," + b)) { g.strokeStyle = c.warn; g.lineWidth = 2.5; g.strokeRect(x + 2, y + 2, s - 4, s - 4); }
      g.fillStyle = val === r.id ? c.main : c.ink; g.fillText(val, x + s / 2, y + s / 2);
    }));
    g.strokeStyle = c.rule; g.lineWidth = 1;
    g.beginPath(); g.moveTo(x0 + s, y0); g.lineTo(x0 + s, y0 + s * (m + 1)); g.moveTo(x0, y0 + s); g.lineTo(x0 + s * (m + 1), y0 + s); g.stroke();
    g.restore();
    const yes = (b) => (b ? "예" : "아니오");
    const lines = [
      `${O.tex(n)}: 원소 ${m}개`,
      `닫힘: ${r.closed ? "예" : `아니오 (빨간 테 칸 ${r.bad.size}개가 집합 밖)`} · 결합법칙: ${!r.closed ? "판정 안 함" : r.assoc ? `아니오, 예: (${r.assoc[0]}${O.sym}${r.assoc[1]})${O.sym}${r.assoc[2]} ≠ ${r.assoc[0]}${O.sym}(${r.assoc[1]}${O.sym}${r.assoc[2]})` : "예"}`,
      `항등원: ${r.id === undefined ? "없음" : r.id} · 역원 없는 원소: ${r.id === undefined ? "판정 안 함" : r.noInv.length ? r.noInv.join(", ") : "없음"} · 가환: ${yes(r.comm)}`,
      `모든 행·열에 각 원소가 한 번씩: ${yes(r.latin)} → ${r.closed && !r.assoc && r.id !== undefined && !r.noInv.length ? "군입니다" : "군이 아닙니다"}`,
    ];
    k.out(lines.join("\n"));
  }
  S.redraw();
})();
