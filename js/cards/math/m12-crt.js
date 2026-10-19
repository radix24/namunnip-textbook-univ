/* 수학12 탐구: 중국인의 나머지 정리 — x를 (x mod m, x mod n) 칸에 놓으면 서로소일 때만 표가 꽉 찬다 */
(() => {
  "use strict";
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const S = MKit.setup("card-m12-crt", 0.8, draw);
  if (!S) return;
  const { k, v } = S;
  function clampSlider(name, max) { const e = k.$(`[name="${name}"]`); if (+e.max !== max) { e.max = max; MKit.setVal(k, name, Math.min(+e.value, max)); } }
  function draw() {
    const m = k.val("m"), n = k.val("n");
    clampSlider("r", m - 1); clampSlider("s", n - 1);
    const c = QSim.col(), r = k.val("r"), s = k.val("s"), g = gcd(m, n), L = (m * n) / g;
    const cell = Array.from({ length: n }, () => Array(m).fill(null));
    for (let x = 0; x < m * n; x++) { const q = cell[x % n][x % m]; if (q === null) cell[x % n][x % m] = x; }
    const gg = v.g, W = v.W, H = v.H, sz = Math.min((W - 40) / m, (H - 40) / n), x0 = (W - sz * m) / 2 + 10, y0 = 26;
    gg.save(); gg.textAlign = "center"; gg.textBaseline = "middle";
    gg.font = `${Math.max(8, Math.min(14, sz * 0.38))}px monospace`;
    for (let j = 0; j < n; j++) for (let i = 0; i < m; i++) {
      const X = x0 + i * sz, Y = y0 + j * sz, val = cell[j][i], hit = i === r && j === s;
      gg.fillStyle = hit ? c.acc : val === null ? c.rule : c.soft; gg.globalAlpha = val === null ? 0.35 : 0.6;
      gg.fillRect(X + 1, Y + 1, sz - 2, sz - 2); gg.globalAlpha = 1;
      if (val !== null) { gg.fillStyle = c.ink; gg.fillText(String(val), X + sz / 2, Y + sz / 2); }
    }
    gg.fillStyle = c.ink2; gg.font = "11px monospace";
    for (let i = 0; i < m; i++) gg.fillText(String(i), x0 + (i + 0.5) * sz, y0 - 9);
    for (let j = 0; j < n; j++) gg.fillText(String(j), x0 - 10, y0 + (j + 0.5) * sz);
    gg.textAlign = "left"; gg.fillText(`x mod ${m} →`, 4, 10);
    gg.restore();
    const sols = []; for (let x = 0; x < m * n; x++) if (x % m === r && x % n === s) sols.push(x);
    k.out(`m = ${m}, n = ${n}, gcd = ${g}: 0부터 ${m * n - 1}까지 놓으면 ${g === 1 ? `${m * n}칸이 모두 한 번씩 채워짐 → Z_${m * n} ≅ Z_${m} × Z_${n}` : `${L}칸만 채워지고 ${m * n - L}칸이 빔`}\n`
      + `x ≡ ${r} (mod ${m}), x ≡ ${s} (mod ${n}): ` + (sols.length ? `해 ${sols.join(", ")} (mod ${m * n})${sols.length > 1 ? `, mod ${L}로는 ${sols[0]} 하나` : ""}` : `해 없음 (${r} ≢ ${s} mod ${g})`));
  }
  S.redraw();
})();
