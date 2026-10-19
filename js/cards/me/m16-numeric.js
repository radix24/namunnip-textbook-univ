/* 기계16 공학수치해석: 이분법·Newton·할선법 비교 (02-01) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-roots"); if (!S) return;
  const [cv] = S.$$("canvas");
  const FN = {
    cole: { n: "Colebrook (x = 1/√f, Re = 10⁵, ε/D = 0.001)", f: (x) => x + 2 * Math.log10(0.001 / 3.7 + (2.51 * x) / 1e5), d: (x) => 1 + (2 / Math.LN10) * (2.51e-5 / (0.001 / 3.7 + 2.51e-5 * x)), a: 1, b: 20, x0: 5, x1: 6, view: [0, 20, -10, 15] },
    sqrt2: { n: "x² − 2", f: (x) => x * x - 2, d: (x) => 2 * x, a: 0, b: 2, x0: 1, x1: 2, view: [-0.5, 2.5, -3, 4] },
    cyc: { n: "x³ − 2x + 2", f: (x) => x ** 3 - 2 * x + 2, d: (x) => 3 * x * x - 2, a: -3, b: 0, x0: 0, x1: 0.5, view: [-3, 2, -10, 10] },
  };
  function run(F, m) {
    const it = []; let a = F.a, b = F.b, x = F.x0, xp = F.x1;
    for (let k = 1; k <= 40; k++) {
      let xn;
      if (m === "bis") { const c = (a + b) / 2; if (F.f(a) * F.f(c) <= 0) b = c; else a = c; xn = (a + b) / 2; }
      else if (m === "newton") { const d = F.d(x); if (Math.abs(d) < 1e-14) break; xn = x - F.f(x) / d; }
      else { const fx = F.f(x), fp = F.f(xp); if (Math.abs(fx - fp) < 1e-300) break; xn = x - (fx * (x - xp)) / (fx - fp); xp = x; }
      it.push(xn);
      if (!isFinite(xn)) break;
      if (Math.abs(xn - x) < 1e-12 * Math.max(1, Math.abs(xn)) && m !== "bis") { x = xn; break; }
      if (m === "bis" && b - a < 1e-12) break;
      x = xn;
    }
    return it;
  }
  function draw() {
    const c = QSim.col(), F = FN[S.val("fn")], m = S.val("m");
    const it = run(F, m), xs = it[it.length - 1];
    const [x0, x1, y0, y1] = F.view, v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0, x1, y0, y1, xl: "x", yl: "f(x)", pad: 32 });
    f.axes(); f.path([[x0, 0], [x1, 0]], c.ink3, 1);
    f.fn(F.f, c.main, 2);
    it.slice(0, 8).forEach((x, i) => { if (x >= x0 && x <= x1) f.dot(x, 0, i === it.length - 1 ? c.warn : c.acc, 4); });
    const errs = it.slice(0, 8).map((x, i) => `${i + 1}: ${x.toPrecision(9)}`).join(", ");
    const conv = it.length && isFinite(xs) && Math.abs(F.f(xs)) < 1e-8;
    const name = { bis: "이분법", newton: "Newton 방법", sec: "할선법" }[m];
    S.out(`${F.n}, ${name}${m === "bis" ? ` (구간 [${F.a}, ${F.b}])` : m === "newton" ? ` (x₀ = ${F.x0})` : ` (x₀ = ${F.x0}, x₁ = ${F.x1})`}\n반복 ${it.length}회 → ${conv ? `근 x = ${xs.toPrecision(10)}${F === FN.cole ? `, f = 1/x² = ${(1 / (xs * xs)).toPrecision(6)}` : ""}` : "수렴하지 않음"}\n처음 반복값: ${errs}`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();
