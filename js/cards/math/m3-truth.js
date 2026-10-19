/* 수학3 탐구: 식을 입력하면 진리표·항진 판정·DNF, 두 식의 동치 판정 */
(() => {
  "use strict";
  // 토큰: 변수 p q r s, 상수 T F, ¬ ~ !, ∧ &, ∨ |, ⊕ ^, → ->, ↔ <->, 괄호
  function tokenize(s) {
    const t = []; let i = 0;
    while (i < s.length) {
      const ch = s[i];
      if (/\s/.test(ch)) { i++; continue; }
      if (s.startsWith("<->", i)) { t.push("↔"); i += 3; continue; }
      if (s.startsWith("->", i)) { t.push("→"); i += 2; continue; }
      const map = { "~": "¬", "!": "¬", "¬": "¬", "&": "∧", "∧": "∧", "|": "∨", "∨": "∨", "^": "⊕", "⊕": "⊕", "→": "→", "↔": "↔", "(": "(", ")": ")" };
      if (map[ch]) { t.push(map[ch]); i++; continue; }
      if (/[pqrsTF]/.test(ch)) { t.push(ch); i++; continue; }
      throw new Error(`알 수 없는 글자 '${ch}'`);
    }
    return t;
  }
  function parse(src) {
    const t = tokenize(src); let i = 0;
    const peek = () => t[i], eat = (x) => { if (t[i] !== x) throw new Error(`'${x}'가 필요합니다`); i++; };
    const prim = () => {
      const x = t[i++];
      if (x === "¬") { const a = prim(); return (e) => !a(e); }
      if (x === "(") { const a = iff(); eat(")"); return a; }
      if (x === "T") return () => true;
      if (x === "F") return () => false;
      if (/[pqrs]/.test(x || "")) return (e) => e[x];
      throw new Error("식이 끝나지 않았습니다");
    };
    const bin = (sub, op, f) => () => { let a = sub(); while (peek() === op) { i++; const b = sub(), aa = a; a = (e) => f(aa(e), b(e)); } return a; };
    const and = bin(prim, "∧", (x, y) => x && y), xor = bin(and, "⊕", (x, y) => x !== y), or = bin(xor, "∨", (x, y) => x || y);
    const imp = () => { const a = or(); if (peek() === "→") { i++; const b = imp(); return (e) => !a(e) || b(e); } return a; };
    const iff = () => { let a = imp(); while (peek() === "↔") { i++; const b = imp(), aa = a; a = (e) => aa(e) === b(e); } return a; };
    const fn = iff(); if (i < t.length) throw new Error(`'${t[i]}' 앞에서 식이 끝나야 합니다`);
    const vars = [...new Set(t.filter((x) => /[pqrs]/.test(x)))].sort();
    return { fn, vars };
  }
  const S = MKit.setup("card-m3-truth", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  function draw() {
    const c = QSim.col(), s1 = k.$('[name="e1"]').value, s2 = k.$('[name="e2"]').value.trim(), g = v.g, W = v.W, H = v.H;
    let A, B;
    try { A = parse(s1); B = s2 ? parse(s2) : null; } catch (err) { k.out(`식을 읽을 수 없습니다: ${err.message}`); g.clearRect(0, 0, W, H); return; }
    const vars = [...new Set([...A.vars, ...(B ? B.vars : [])])].sort(), n = vars.length, rows = 1 << n;
    const cols = n + (B ? 2 : 1), cw = Math.min(80, (W - 10) / cols), rh = Math.min(24, (H - 30) / (rows + 1)), x0 = (W - cw * cols) / 2;
    g.save(); g.font = `${Math.max(10, Math.min(14, rh * 0.6))}px monospace`; g.textAlign = "center"; g.textBaseline = "middle";
    const heads = [...vars, "식 1", ...(B ? ["식 2"] : [])];
    heads.forEach((h, j) => { g.fillStyle = c.ink; g.fillText(h, x0 + (j + 0.5) * cw, 14); });
    let trueRows = [], same = true;
    for (let r = 0; r < rows; r++) {
      const env = {}; vars.forEach((x, j) => { env[x] = !((r >> (n - 1 - j)) & 1); });
      const a = A.fn(env), b = B ? B.fn(env) : null;
      if (a) trueRows.push(env); if (B && a !== b) same = false;
      const vals = [...vars.map((x) => env[x]), a, ...(B ? [b] : [])], y = 28 + r * rh;
      vals.forEach((val, j) => {
        const res = j >= n; g.globalAlpha = res ? 0.7 : 0.25; g.fillStyle = val ? c.main : c.rule;
        if (B && j >= n && a !== b) g.fillStyle = c.warn;
        g.fillRect(x0 + j * cw + 1, y, cw - 2, rh - 2); g.globalAlpha = 1;
        g.fillStyle = c.ink; g.fillText(val ? "T" : "F", x0 + (j + 0.5) * cw, y + rh / 2);
      });
    }
    g.restore();
    const kind = trueRows.length === rows ? "항진명제" : trueRows.length === 0 ? "모순명제" : `참인 행 ${trueRows.length}/${rows}`;
    const dnf = trueRows.length && trueRows.length < rows ? trueRows.map((e) => "(" + vars.map((x) => (e[x] ? x : "¬" + x)).join("∧") + ")").join(" ∨ ") : kind === "항진명제" ? "T" : "F";
    k.out(`식 1: ${kind} · DNF: ${dnf.length > 160 ? dnf.slice(0, 160) + " …" : dnf}` + (B ? `\n식 1과 식 2는 ${same ? "논리 동치입니다 (모든 행이 같음)" : "동치가 아닙니다 (빨간 행에서 다름)"}` : ""));
  }
  S.redraw();
})();
