/* 수학16 탐구: 이분법·뉴턴·할선법의 오차를 반복 횟수에 따라 비교 (로그 눈금) */
(() => {
  "use strict";
  const S = MKit.setup("card-m16-roots", 0.55, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const F = {
    sq: { name: "x² − 2", f: (x) => x * x - 2, d: (x) => 2 * x, r: Math.SQRT2, rs: [Math.SQRT2, -Math.SQRT2], br: [1, 2] },
    cos: { name: "cos x − x", f: (x) => Math.cos(x) - x, d: (x) => -Math.sin(x) - 1, r: 0.7390851332151607, br: [0, 1] },
    atan: { name: "arctan x", f: Math.atan, d: (x) => 1 / (1 + x * x), r: 0, br: [-1, 1.7] },
    dbl: { name: "(x − 1)²(x + 2) (중근 1, 단순근 −2)", f: (x) => (x - 1) ** 2 * (x + 2), d: (x) => 2 * (x - 1) * (x + 2) + (x - 1) ** 2, r: 1, rs: [1, -2], br: null },
  };
  const M = 45, FLOOR = 1e-16;
  const err = (x, P) => Math.max(Math.min(...(P.rs || [P.r]).map((r) => Math.abs(x - r))), FLOOR);
  function run(P, x0) {
    const out = { bis: [], nw: [], sec: [] };
    if (P.br) { let [a, b] = P.br; for (let i = 0; i < M; i++) { const m = (a + b) / 2; out.bis.push(err(m, P)); if (P.f(a) * P.f(m) <= 0) b = m; else a = m; } }
    let x = x0;
    for (let i = 0; i < M; i++) { const d = P.d(x); if (d === 0) { out.nw.fail = "f′ = 0"; break; } x = x - P.f(x) / d; if (!isFinite(x) || Math.abs(x) > 1e6) { out.nw.fail = "발산"; break; } out.nw.push(err(x, P)); }
    let a = x0, b = x0 + 0.1;
    for (let i = 0; i < M; i++) { const fa = P.f(a), fb = P.f(b); if (fb === fa) break; const c = b - (fb * (b - a)) / (fb - fa); if (!isFinite(c) || Math.abs(c) > 1e6) { out.sec.fail = "발산"; break; } a = b; b = c; out.sec.push(err(c, P)); }
    return out;
  }
  const first = (arr, tol) => { const i = arr.findIndex((e) => e <= tol); return i < 0 ? null : i + 1; };
  function draw() {
    const c = QSim.col(), P = F[k.val("f")], x0 = k.val("x0");
    const R = run(P, x0);
    const G = QSim.frame(v, { x0: 0, x1: M, y0: -16.5, y1: 1, pad: 28, xl: "반복 횟수 n", yl: "log₁₀|오차|" });
    G.axes();
    const line = (arr, col, dash) => { if (arr.length) G.path(arr.map((e, i) => [i + 1, Math.max(-16.5, Math.min(1, Math.log10(e)))]), col, 2, dash); };
    line(R.bis, c.rule, [5, 4]); line(R.nw, c.warn, null); line(R.sec, c.main, null);
    const tol = 1e-12, desc = (arr, nm) => (arr.fail ? `${nm}: ${arr.fail}` : `${nm}: ${first(arr, tol) ? first(arr, tol) + "번" : `${M}번 안에 못 미침`}`);
    k.out(`f(x) = ${P.name}, 근 ${P === F.sq ? "±" + fmt(P.r, 6) : (P.rs || [P.r]).map((r) => fmt(r, 6)).join(", ")} · 시작값 x₀ = ${fmt(x0, 2)} (할선법은 x₀, x₀ + 0.1)\n오차 10⁻¹² 이하까지: ${P.br ? desc(R.bis, `이분법(구간 [${P.br}])`) : "이분법: 중근 1 근처에서는 부호가 바뀌지 않아 쓸 수 없음"} · ${desc(R.nw, "뉴턴")} · ${desc(R.sec, "할선법")}`);
  }
  S.redraw();
})();
