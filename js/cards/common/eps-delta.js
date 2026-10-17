/* ε-δ 게임: 세로 띠(a ± δ) 안의 그래프가 가로 띠(L ± ε) 안에 드는지 그려서 보여 준다 */
(() => {
  "use strict";
  const root = document.getElementById("card-common-epsdelta-game");
  if (!root || !window.NM) return;
  const cv = root.querySelector("canvas");
  const $ = (s) => root.querySelector(s);
  const EPS = [2, 1, 0.5, 0.2, 0.1, 0.05, 0.02];
  const F = {
    sq: { f: (x) => x * x, a: 2, L: 4, x0: 0.6, x1: 3.4, y0: 0, y1: 11, rule: (e) => Math.min(1, e / 5), ruleTxt: "min{1, ε/5}" },
    lin: { f: (x) => 3 * x - 1, a: 2, L: 5, x0: 0.6, x1: 3.4, y0: 0.5, y1: 9.5, rule: (e) => e / 3, ruleTxt: "ε/3" },
    step: { f: (x) => (x >= 0 ? 1 : -1), a: 0, L: 0, x0: -1.4, x1: 1.4, y0: -2, y1: 2, rule: null, ruleTxt: "없음" },
  };
  let key = "sq";
  const fmt = (v) => (Math.abs(v) >= 0.1 ? v.toFixed(2) : v.toPrecision(2));
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || "#888";

  const st = () => {
    const P = F[key];
    const e = EPS[+$(".e").value];
    const span = (P.x1 - P.x0) / 2;
    const d = (+$(".d").value / 200) * span * 0.9;
    const L = P.L + (+$(".l").value) * (key === "step" ? 0.5 : 0.25);
    return { P, e, d, L };
  };
  /* 세로 띠 안에서 |f − L|의 최댓값 (x = a 제외) */
  const worst = (P, d, L) => {
    let m = 0;
    for (let i = 1; i <= 2000; i++) {
      const t = (i / 2000) * d;
      m = Math.max(m, Math.abs(P.f(P.a + t) - L), Math.abs(P.f(P.a - t) - L));
    }
    return m;
  };
  /* 통하는 가장 큰 δ (이분법). L이 극한이 아니면 0 */
  const dmax = (P, e, L) => {
    const span = (P.x1 - P.x0) / 2;
    if (worst(P, 1e-6, L) >= e) return 0;
    let lo = 1e-6, hi = span;
    if (worst(P, hi, L) < e) return hi;
    for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (worst(P, m, L) < e) lo = m; else hi = m; }
    return lo;
  };

  const { ctx, size } = NM.fit(cv, draw);
  function draw() {
    const { w, h } = size;
    if (!w) return;
    const { P, e, d, L } = st();
    const X = (x) => 34 + ((x - P.x0) / (P.x1 - P.x0)) * (w - 44);
    const Y = (y) => h - 26 - ((y - P.y0) / (P.y1 - P.y0)) * (h - 36);
    ctx.clearRect(0, 0, w, h);
    const ink = css("--ink"), ink3 = css("--ink-3"), rule = css("--rule"), acc = css("--forest"), warn = css("--warn"), qed = css("--qed");
    ctx.font = `11px ${NM.F.mono}`;
    // 축
    ctx.strokeStyle = rule; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(34, Y(Math.max(P.y0, Math.min(P.y1, 0)))); ctx.lineTo(w - 10, Y(Math.max(P.y0, Math.min(P.y1, 0)))); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(X(Math.max(P.x0, Math.min(P.x1, 0))), 10); ctx.lineTo(X(Math.max(P.x0, Math.min(P.x1, 0))), h - 26); ctx.stroke();
    // 가로 띠 L ± ε
    ctx.fillStyle = qed; ctx.globalAlpha = 0.18;
    ctx.fillRect(34, Y(L + e), w - 44, Y(L - e) - Y(L + e));
    // 세로 띠 a ± δ
    ctx.fillStyle = acc; ctx.globalAlpha = 0.12;
    ctx.fillRect(X(P.a - d), 10, X(P.a + d) - X(P.a - d), h - 36);
    ctx.globalAlpha = 1;
    ctx.setLineDash([4, 4]); ctx.strokeStyle = ink3;
    [L + e, L - e].forEach((y) => { ctx.beginPath(); ctx.moveTo(34, Y(y)); ctx.lineTo(w - 10, Y(y)); ctx.stroke(); });
    [P.a - d, P.a + d].forEach((x) => { ctx.beginPath(); ctx.moveTo(X(x), 10); ctx.lineTo(X(x), h - 26); ctx.stroke(); });
    ctx.setLineDash([]);
    // 그래프 (세로 띠 밖은 흐리게, 안은 판정 색)
    const N = 600;
    for (let i = 0; i < N; i++) {
      const xa = P.x0 + ((P.x1 - P.x0) * i) / N, xb = P.x0 + ((P.x1 - P.x0) * (i + 1)) / N;
      if (key === "step" && xa < 0 && xb >= 0) continue;
      const inside = Math.abs((xa + xb) / 2 - P.a) < d;
      const ok = Math.abs(P.f((xa + xb) / 2) - L) < e;
      ctx.strokeStyle = inside ? (ok ? acc : warn) : ink3;
      ctx.lineWidth = inside ? 3 : 1.5;
      ctx.beginPath(); ctx.moveTo(X(xa), Y(P.f(xa))); ctx.lineTo(X(xb), Y(P.f(xb))); ctx.stroke();
    }
    // 점 (a, L)
    ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(X(P.a), Y(L), 3.5, 0, 7); ctx.fill();
    ctx.fillStyle = ink3; ctx.textAlign = "left";
    ctx.fillText(`L=${fmt(L)}`, 38, Y(L) - 5);
    ctx.textAlign = "center"; ctx.fillText(`a=${P.a}`, X(P.a), h - 10);
    // 수치
    const bad = worst(P, d, L) >= e;
    const v = $(".verdict");
    v.textContent = bad ? "δ가 너무 큼 (붉은 부분)" : "통함";
    v.className = "verdict " + (bad ? "no" : "ok");
    const dm = dmax(P, e, L);
    $(".dmax").textContent = dm > 0 ? fmt(dm) : "없음 (이 L은 극한이 아님)";
    $(".drule").textContent = P.rule ? `${P.ruleTxt} = ${fmt(P.rule(e))}` : "없음";
    $(".e-out").textContent = e;
    $(".d-out").textContent = fmt(d);
    $(".l-out").textContent = fmt(L);
  }
  root.querySelectorAll("input").forEach((i) => i.addEventListener("input", draw));
  root.querySelectorAll(".presets .chip").forEach((b) => b.addEventListener("click", () => {
    key = b.dataset.f;
    root.querySelectorAll(".presets .chip").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    $(".l").value = 0;
    draw();
  }));
  new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
})();
