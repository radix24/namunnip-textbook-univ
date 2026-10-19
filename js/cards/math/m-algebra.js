/* 수학과 대수·정수론·집합론 탐구 카드: 거듭제곱의 순환(원시근), 정다각형의 대칭군, 칸토어 대각선 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));

  /* ── 1. 법 n에서 g의 거듭제곱 ── */
  (() => {
    const S = MKit.setup("card-m10-roots", 0.75, draw);
    if (!S) return;
    const { k, v } = S;
    const order = (g, n) => { if (gcd(g, n) !== 1) return 0; let x = g % n, t = 1; while (x !== 1 % n) { x = (x * g) % n; t++; } return t; };
    const phi = (n) => { let c = 0; for (let a = 1; a <= n; a++) if (gcd(a, n) === 1) c++; return c; };
    function draw() {
      const c = C(), g = v.g, n = k.val("n");
      const ge = k.$('[name="g"]'); ge.max = n - 1; if (+ge.value > n - 1) ge.value = n - 1;
      k.show();
      const a = k.val("g");
      const W = v.W, H = v.H, cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.4;
      const P = (r) => [cx + R * Math.sin((2 * Math.PI * r) / n), cy - R * Math.cos((2 * Math.PI * r) / n)];
      // 거듭제곱 경로 1 → a → a² → … (처음 되풀이될 때까지)
      const seen = new Map(); let x = 1 % n, t = 0; const path = [];
      while (!seen.has(x)) { seen.set(x, t); path.push(x); x = (x * a) % n; t++; }
      g.save(); g.lineWidth = 2; g.strokeStyle = c.main; g.globalAlpha = 0.85; g.beginPath();
      path.concat([x]).forEach((r, i) => { const [px, py] = P(r); i ? g.lineTo(px, py) : g.moveTo(px, py); });
      g.stroke(); g.restore();
      g.font = "11px " + getComputedStyle(document.documentElement).getPropertyValue("--f-mono");
      for (let r = 0; r < n; r++) {
        const [px, py] = P(r), unit = gcd(r, n) === 1, hit = seen.has(r);
        g.fillStyle = hit ? c.acc : unit ? c.ink2 : c.rule;
        g.beginPath(); g.arc(px, py, hit ? 6 : 4, 0, 7); g.fill();
        if (n <= 36) { const [lx, ly] = [cx + (R + 16) * Math.sin((2 * Math.PI * r) / n), cy - (R + 16) * Math.cos((2 * Math.PI * r) / n)]; g.fillStyle = unit ? c.ink : c.ink3; g.textAlign = "center"; g.fillText(r, lx, ly + 4); }
      }
      const ph = phi(n), o = order(a, n);
      const prim = []; for (let b = 1; b < n; b++) if (order(b, n) === ph) prim.push(b);
      k.out(`법 n = ${n}, φ(n) = ${ph} · g = ${a}\n` +
        (o ? `g의 위수 ${o} (φ(n) = ${ph}의 약수) · ${o === ph ? "g는 원시근입니다" : "원시근이 아닙니다"}` : `gcd(${a}, ${n}) = ${gcd(a, n)} ≠ 1이라 g의 거듭제곱은 1로 돌아오지 않습니다`) +
        `\n원시근: ${prim.length ? prim.slice(0, 16).join(", ") + (prim.length > 16 ? " …" : "") + ` (${prim.length}개 = φ(φ(n)))` : "없음"}`);
    }
    S.redraw();
  })();

  /* ── 2. 정n각형의 대칭군 Dₙ ── */
  (() => {
    let st = { k: 0, f: 0 }, hist = [];
    const S = MKit.setup("card-m12-dihedral", 0.62, draw);
    if (!S) return;
    const { k, v } = S;
    /* rᵏsᶠ가 자리 i를 보내는 곳: s는 자리 0을 지나는 축의 반사(i → −i), r은 한 칸 회전 */
    const act = (s, n, i) => (((s.f ? -i : i) + s.k) % n + n) % n;
    const cycles = (n) => {
      const seen = new Array(n).fill(false), out = [];
      for (let i = 0; i < n; i++) {
        if (seen[i]) continue;
        const cyc = []; let j = i;
        while (!seen[j]) { seen[j] = true; cyc.push(j + 1); j = act(st, n, j); }
        if (cyc.length > 1) out.push("(" + cyc.join(" ") + ")");
      }
      return out;
    };
    const word = (n) => { const r = st.k ? (st.k === 1 ? "r" : `r${"⁰¹²³⁴⁵⁶⁷⁸⁹"[st.k]}`) : ""; return (r + (st.f ? "s" : "")) || "e"; };
    function draw() {
      const c = C(), g = v.g, n = k.val("n");
      st.k %= n;
      const W = v.W, H = v.H, cx = W * 0.32, cy = H / 2, R = Math.min(W * 0.28, H * 0.4);
      const P = (i) => [cx + R * Math.sin((2 * Math.PI * i) / n), cy - R * Math.cos((2 * Math.PI * i) / n)];
      // 반사 s의 축(자리 0을 지남)
      g.save(); g.setLineDash([5, 4]); g.strokeStyle = c.rule; g.beginPath(); g.moveTo(cx, cy - R - 14); g.lineTo(cx, cy + R + 14); g.stroke(); g.restore();
      // 꼭짓점 라벨: 처음 자리 i에 있던 라벨 i+1이 지금 act(i)에 있다
      const lab = new Array(n);
      for (let i = 0; i < n; i++) lab[act(st, n, i)] = i + 1;
      g.fillStyle = c.soft; g.strokeStyle = c.main; g.lineWidth = 2; g.beginPath();
      for (let i = 0; i < n; i++) { const [x, y] = P(i); i ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.closePath(); g.fill(); g.stroke();
      // 라벨 1에서 2로 가는 방향 표시(앞면·뒷면)
      const p1 = P(act(st, n, 0)), p2 = P(act(st, n, 1));
      g.strokeStyle = c.acc; g.lineWidth = 4; g.beginPath(); g.moveTo(...p1); g.lineTo(p1[0] + (p2[0] - p1[0]) * 0.5, p1[1] + (p2[1] - p1[1]) * 0.5); g.stroke();
      g.font = "bold 14px sans-serif"; g.textAlign = "center";
      for (let i = 0; i < n; i++) { const [x, y] = P(i); g.fillStyle = c.card; g.beginPath(); g.arc(x, y, 11, 0, 7); g.fill(); g.strokeStyle = c.ink3; g.lineWidth = 1; g.stroke(); g.fillStyle = c.ink; g.fillText(lab[i], x, y + 5); }
      // 오른쪽: 기록
      g.textAlign = "left"; g.font = "13px sans-serif"; g.fillStyle = c.ink2;
      const tx = W * 0.64;
      g.fillText("누른 순서 (오른쪽이 먼저)", tx, 26);
      g.font = "14px " + getComputedStyle(document.documentElement).getPropertyValue("--f-mono");
      g.fillStyle = c.ink; g.fillText(hist.length ? hist.slice(-14).reverse().join("") + (hist.length > 14 ? "…" : "") : "(없음)", tx, 48);
      g.fillStyle = c.ink2; g.font = "13px sans-serif"; g.fillText("간단히 쓰면", tx, 80);
      g.fillStyle = c.main; g.font = "bold 18px " + getComputedStyle(document.documentElement).getPropertyValue("--f-mono"); g.fillText(word(n), tx, 104);
      const cy1 = cycles(n), sign = cy1.reduce((s, t) => s * ((t.split(" ").length - 1) % 2 ? -1 : 1), 1);
      k.out(`군 D${n}의 원소 ${word(n)} (원소는 모두 ${2 * n}개: 회전 ${n}개, 반사 ${n}개)\n` +
        `꼭짓점 자리의 치환: ${cy1.length ? cy1.join("") : "항등"} · 부호 ${sign > 0 ? "+1 (짝치환)" : "−1 (홀치환)"}` +
        (st.f ? "\n반사입니다. 한 번 더 s를 누르거나 같은 반사를 다시 하면 제자리로 옵니다" : ""));
    }
    const n = () => k.val("n");
    k.$(".r").addEventListener("click", () => { st = { k: (st.k + 1) % n(), f: st.f }; hist.push("r"); S.redraw(); });
    k.$(".s").addEventListener("click", () => { st = { k: (n() - st.k) % n(), f: 1 - st.f }; hist.push("s"); S.redraw(); });
    k.$(".e").addEventListener("click", () => { st = { k: 0, f: 0 }; hist = []; S.redraw(); });
    k.$('[name="n"]').addEventListener("input", () => { st = { k: 0, f: 0 }; hist = []; });
    S.redraw();
  })();

  /* ── 3. 칸토어 대각선 ── */
  (() => {
    const root = document.getElementById("card-m2-diagonal");
    if (!root) return;
    const $ = (s) => root.querySelector(s);
    const L = 12;
    const rnd = () => Array.from({ length: L }, () => Math.floor(Math.random() * 10));
    let rows = Array.from({ length: 6 }, rnd);
    const diag = () => rows.map((r, i) => (i < L ? (r[i] === 5 ? 4 : 5) : null)).filter((d) => d !== null);
    function render() {
      const d = diag();
      const t = $(".dg-table");
      t.innerHTML = "";
      rows.forEach((r, i) => {
        const tr = document.createElement("tr");
        const th = document.createElement("th"); th.textContent = `x${i + 1}`; tr.appendChild(th);
        const z = document.createElement("td"); z.textContent = "0."; tr.appendChild(z);
        r.forEach((dg, j) => {
          const td = document.createElement("td");
          const b = document.createElement("button"); b.type = "button"; b.textContent = dg;
          b.className = "dg" + (i === j ? " on" : "");
          b.setAttribute("aria-label", `x${i + 1}의 소수 ${j + 1}째 자리 ${dg}, 누르면 1 커짐`);
          b.addEventListener("click", () => { rows[i][j] = (rows[i][j] + 1) % 10; render(); });
          td.appendChild(b); tr.appendChild(td);
        });
        t.appendChild(tr);
      });
      $(".dg-new").textContent = "0." + d.join("") + (rows.length < L ? "…" : "");
      $(".out").textContent = rows.length >= L
        ? `목록이 ${L}줄로 찼습니다. 줄이 무한히 이어져도 같은 규칙으로 대각선 수를 만들 수 있습니다.`
        : `만든 수 d는 x${1}과 1째 자리에서, x2와 2째 자리에서, …, x${rows.length}과 ${rows.length}째 자리에서 다릅니다. 그래서 목록 어디에도 없습니다.`;
      $(".dg-add").disabled = rows.length >= L;
    }
    $(".dg-add").addEventListener("click", () => { if (rows.length >= L) return; const d = diag(); const r = rnd(); d.forEach((x, j) => { r[j] = x; }); rows.push(r); render(); });
    $(".dg-reset").addEventListener("click", () => { rows = Array.from({ length: 6 }, rnd); render(); });
    render();
  })();
})();
