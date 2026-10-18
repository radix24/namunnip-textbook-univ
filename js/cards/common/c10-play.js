/* 공통10 체험 카드 묶음 2: 연결 리스트와 배열에 넣고 빼기. */
(() => {
  "use strict";
  const C = () => QSim.col();

  /* 1. 연결 리스트 (05-04) */
  (() => {
    const S = QSim.card("lab-c10-linked"); if (!S) return;
    const cv = S.$("canvas");
    let list, next, log;
    const reset = () => { list = [10, 20, 30, 40]; next = 50; log = "처음 상태: 10 → 20 → 30 → 40"; };
    reset();
    /* 연산마다 연결 리스트(머리 포인터만 있음)와 배열의 일을 센다 */
    const ops = {
      front: () => { const v = next; next += 10; list.unshift(v); return [`앞에 ${v} 넣기`, `새 노드 1개, 포인터 2개 바꿈 (새 노드의 next, head)`, `원소 ${list.length - 1}개를 한 칸씩 뒤로 옮김`]; },
      back: () => { const v = next; next += 10; list.push(v); return [`뒤에 ${v} 넣기`, `head부터 링크 ${list.length - 2}번 따라가 끝을 찾고, 포인터 1개 바꿈`, `옮길 원소 없음 (빈칸이 있으면 바로 씀)`]; },
      mid: () => { const v = next; next += 10; const i = Math.floor(list.length / 2); list.splice(i, 0, v); return [`${i}번 자리에 ${v} 넣기`, `링크 ${i - 1}번 따라가고, 포인터 2개 바꿈`, `원소 ${list.length - 1 - i}개를 한 칸씩 뒤로 옮김`]; },
      pop: () => { if (!list.length) return ["비어 있어 뺄 것이 없음", "-", "-"]; const v = list.shift(); return [`앞의 ${v} 빼기`, `head를 다음 노드로 바꿈 (포인터 1개), 노드 메모리 해제`, `원소 ${list.length}개를 한 칸씩 앞으로 옮김`]; }
    };
    function draw() {
      const c = C(), v = QSim.view(cv, 0.42), g = v.g, W = v.W, n = list.length;
      const per = Math.max(3, Math.floor((W - 20) / 92)), bw = 58, bh = 30, gap = 92;
      g.font = "13px " + (getComputedStyle(document.documentElement).getPropertyValue("--f-mono") || "monospace");
      g.fillStyle = c.ink2; g.fillText("head", 6, 20);
      const pos = (i) => [14 + (i % per) * gap, 34 + Math.floor(i / per) * 52];
      if (n) { const [x, y] = pos(0); g.strokeStyle = c.acc; g.lineWidth = 2; g.beginPath(); g.moveTo(22, 24); g.lineTo(x + 10, y); g.stroke(); }
      list.forEach((val, i) => {
        const [x, y] = pos(i);
        g.fillStyle = c.soft; g.fillRect(x, y, bw, bh); g.strokeStyle = c.main; g.lineWidth = 1.5; g.strokeRect(x, y, bw, bh);
        g.beginPath(); g.moveTo(x + 38, y); g.lineTo(x + 38, y + bh); g.stroke();
        g.fillStyle = c.ink; g.fillText(String(val), x + 8, y + 20);
        g.fillStyle = c.ink3; g.fillText(i === n - 1 ? "∅" : "•", x + 44, y + 20);
        if (i < n - 1) {
          const [x2, y2] = pos(i + 1); g.strokeStyle = c.ink3; g.beginPath(); g.moveTo(x + 48, y + 15);
          if (y2 === y) g.lineTo(x2 - 2, y2 + 15); else { g.lineTo(x + 48, y + bh + 10); g.lineTo(x2 + 10, y + bh + 10); g.lineTo(x2 + 10, y2 - 2); }
          g.stroke();
        }
      });
      const ay = 34 + Math.ceil(Math.max(1, n) / per) * 52 + 4;
      g.fillStyle = c.ink2; g.fillText("배열:", 6, ay + 18);
      list.forEach((val, i) => { const x = 52 + i * 40; if (x + 38 > W) return; g.strokeStyle = c.rule; g.strokeRect(x, ay, 38, 26); g.fillStyle = c.ink; g.fillText(String(val), x + 6, ay + 18); });
      S.out(log + `\n현재 ${n}개: ${list.join(" → ") || "(비어 있음)"}`);
    }
    S.$$("[data-op]").forEach((b) => b.addEventListener("click", () => {
      if (b.dataset.op === "reset") reset();
      else if (b.dataset.op !== "pop" && list.length >= 12) log = "이 그림에는 12개까지만 넣습니다. 빼거나 처음으로 돌리세요.";
      else { const [what, L, A] = ops[b.dataset.op](); log = `${what}\n연결 리스트: ${L}\n배열: ${A}`; }
      draw();
    }));
    QSim.redrawOn(draw); draw();
  })();
})();
