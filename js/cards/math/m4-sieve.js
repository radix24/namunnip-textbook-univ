/* 수학4 탐구: 에라토스테네스의 체 — 단계마다 소수 p의 배수를 p²부터 지우기 */
(() => {
  "use strict";
  const S = MKit.setup("card-m4-sieve", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  const COLS = 15;
  function draw() {
    const c = QSim.col(), N = k.val("N"), step = k.val("s"), g = v.g, W = v.W, H = v.H;
    const lim = Math.floor(Math.sqrt(N)), small = []; for (let p = 2; p <= lim; p++) { let ok = true; for (let d = 2; d * d <= p; d++) if (p % d === 0) ok = false; if (ok) small.push(p); }
    const ss = k.$('[name="s"]'); if (+ss.max !== small.length) { ss.max = small.length; MKit.setVal(k, "s", Math.min(+ss.value, small.length)); }
    const st = Math.min(step, small.length);
    const by = new Array(N + 1).fill(0); let crossed = 0;
    for (let i = 0; i < st; i++) { const p = small[i]; for (let m = p * p; m <= N; m += p) if (!by[m]) { by[m] = p; crossed++; } }
    const rows = Math.ceil(N / COLS), cw = (W - 10) / COLS, ch = Math.min(26, (H - 10) / rows);
    const pal = [c.main, c.acc, c.warn, c.ink3, c.ink2, c.soft];
    g.save(); g.font = `${Math.min(12, ch * 0.5)}px monospace`; g.textAlign = "center"; g.textBaseline = "middle";
    const cur = st > 0 ? small[st - 1] : 0;
    for (let n = 1; n <= N; n++) {
      const X = 5 + ((n - 1) % COLS) * cw, Y = 5 + Math.floor((n - 1) / COLS) * ch;
      const isSmallDone = small.slice(0, st).includes(n), surely = st === small.length && n > 1 && !by[n];
      if (by[n]) { g.fillStyle = pal[small.indexOf(by[n]) % pal.length]; g.globalAlpha = by[n] === cur ? 0.55 : 0.2; g.fillRect(X + 1, Y + 1, cw - 2, ch - 2); g.globalAlpha = 1; }
      else if (isSmallDone || surely) { g.strokeStyle = c.main; g.lineWidth = 2; g.strokeRect(X + 2, Y + 2, cw - 4, ch - 4); }
      g.fillStyle = by[n] ? c.ink3 : n === 1 ? c.ink3 : c.ink; g.fillText(String(n), X + cw / 2, Y + ch / 2);
    }
    g.restore();
    const remain = []; for (let n = 2; n <= N; n++) if (!by[n]) remain.push(n);
    k.out(`N = ${N}, √N ≈ ${Math.sqrt(N).toFixed(2)} → 지울 소수 ${small.join(", ")} · ${st}단계${cur ? `: ${cur}의 배수를 ${cur * cur}부터 지움` : " (시작 전)"} · 지운 수 ${crossed}개\n남은 수 ${remain.length}개${st === small.length ? " = 모두 소수 (테두리)" : ""}`);
  }
  S.redraw();
})();
