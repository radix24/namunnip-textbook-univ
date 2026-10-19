/* 수학3 탐구: 튜링 기계를 한 걸음씩 — 이진수 +1, 0ⁿ1ⁿ 판정 */
(() => {
  "use strict";
  const B = "□";
  const MACH = {
    inc: { name: "이진수에 1 더하기", start: "c", headAt: "right",
      rules: { "c,1": ["c", "0", -1], "c,0": ["H", "1", 0], ["c," + B]: ["H", "1", 0] } },
    anbn: { name: "0ⁿ1ⁿ 판정", start: "q0", headAt: "left",
      rules: { "q0,0": ["q1", "X", 1], "q0,Y": ["q3", "Y", 1], ["q0," + B]: ["A", B, 1], "q1,0": ["q1", "0", 1], "q1,Y": ["q1", "Y", 1], "q1,1": ["q2", "Y", -1], "q2,0": ["q2", "0", -1], "q2,Y": ["q2", "Y", -1], "q2,X": ["q0", "X", 1], "q3,Y": ["q3", "Y", 1], ["q3," + B]: ["A", B, 1] } },
  };
  const S = MKit.setup("card-m3-turing", 0.35, draw);
  if (!S) return;
  const { k, v } = S;
  function run(Mc, w, steps) {
    const tape = new Map([...w].map((ch, i) => [i, ch])), get = (i) => tape.get(i) ?? B;
    let head = Mc.headAt === "right" ? Math.max(0, w.length - 1) : 0, st = Mc.start, n = 0, last = "";
    while (n < steps && !["H", "A", "R"].includes(st)) {
      const r = Mc.rules[st + "," + get(head)];
      if (!r) { last = `(${st}, ${get(head)})에 규칙 없음 → 거부`; st = "R"; break; }
      last = `(${st}, ${get(head)}) → ${r[1]} 쓰고 ${r[2] < 0 ? "왼쪽" : r[2] > 0 ? "오른쪽" : "제자리"}, 상태 ${r[0]}`;
      tape.set(head, r[1]); head += r[2]; st = r[0]; n++;
    }
    return { tape, get, head, st, n, last };
  }
  function draw() {
    const c = QSim.col(), Mc = MACH[k.val("m")], w = k.$('[name="w"]').value.replace(/[^01]/g, ""), steps = k.val("s"), g = v.g, W = v.W, H = v.H;
    const { tape, get, head, st, n, last } = run(Mc, w, steps);
    const ks = [...tape.keys()], tstr = ks.length ? Array.from({ length: Math.max(...ks) - Math.min(...ks) + 1 }, (_, i) => get(Math.min(...ks) + i)).join("").replace(new RegExp("^" + B + "+|" + B + "+$", "g"), "") : "";
    const cells = 15, cw = Math.min(40, (W - 20) / cells), x0 = (W - cw * cells) / 2, lo = head - 7;
    g.save(); g.textAlign = "center"; g.textBaseline = "middle"; g.font = "18px monospace";
    for (let i = 0; i < cells; i++) {
      const pos = lo + i, X = x0 + i * cw, sym = get(pos);
      g.strokeStyle = c.ink3; g.lineWidth = 1; g.strokeRect(X, H * 0.35, cw, cw);
      g.fillStyle = sym === B ? c.ink3 : c.ink; g.fillText(sym, X + cw / 2, H * 0.35 + cw / 2);
      if (pos === head) { g.fillStyle = c.warn; g.beginPath(); g.moveTo(X + cw / 2, H * 0.35 - 4); g.lineTo(X + cw / 2 - 8, H * 0.35 - 18); g.lineTo(X + cw / 2 + 8, H * 0.35 - 18); g.fill(); g.font = "13px monospace"; g.fillText(`상태 ${st}`, X + cw / 2, H * 0.35 - 30); g.font = "18px monospace"; }
    }
    g.restore();
    const fin = st === "H" ? "정지" : st === "A" ? "정지: 받아들임" : st === "R" ? "정지: 거부" : "진행 중";
    k.out(`${Mc.name} · 입력 "${w}" · ${n}걸음 · ${fin} · 테이프 ${tstr || B}\n${last || "아직 시작 전"}`);
  }
  S.redraw();
})();
