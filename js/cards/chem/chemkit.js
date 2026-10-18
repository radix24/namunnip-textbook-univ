/* QChem: 화학과 실습 카드가 함께 쓰는 계산 도구 (simkit.js 다음에 싣는다)
   - rng(seed): 같은 seed면 같은 가상 측정값을 내는 난수
   - gauss(r): 표준정규 난수
   - tcrit(df): 양측 95% t 값
   - linfit(x, y): 최소제곱 직선과 표준 불확도
   - bisect(f, a, b): f(a), f(b)의 부호가 다를 때 근
   - sci(x, d): 짧은 과학 표기
   - seedButton(S, fn): "새 가상 자료" 버튼 */
(() => {
  "use strict";
  if (window.QChem) return;
  function rng(seed) {
    let a = (seed >>> 0) || 1;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const gauss = (r) => { let u = 0, v = 0; while (u === 0) u = r(); v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const T95 = [12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201, 2.179, 2.160, 2.145, 2.131, 2.120, 2.110, 2.101, 2.093, 2.086, 2.080, 2.074, 2.069, 2.064, 2.060, 2.056, 2.052, 2.048, 2.045, 2.042];
  const tcrit = (df) => df < 1 ? Infinity : df <= 30 ? T95[df - 1] : 1.96 + 2.4 / df;
  function linfit(x, y) {
    const n = x.length, mx = x.reduce((a, b) => a + b, 0) / n, my = y.reduce((a, b) => a + b, 0) / n;
    let sxx = 0, sxy = 0, syy = 0;
    for (let i = 0; i < n; i++) { sxx += (x[i] - mx) ** 2; sxy += (x[i] - mx) * (y[i] - my); syy += (y[i] - my) ** 2; }
    const m = sxy / sxx, b = my - m * mx;
    let ss = 0; for (let i = 0; i < n; i++) ss += (y[i] - m * x[i] - b) ** 2;
    const sy = n > 2 ? Math.sqrt(ss / (n - 2)) : 0;
    return { m, b, sy, sm: sy / Math.sqrt(sxx), sb: sy * Math.sqrt(1 / n + mx * mx / sxx), r2: syy > 0 ? 1 - ss / syy : 1, n, mx, my, sxx };
  }
  function bisect(f, a, b, it = 100) {
    let fa = f(a);
    for (let i = 0; i < it; i++) { const m = (a + b) / 2, fm = f(m); if ((fm > 0) === (fa > 0)) { a = m; fa = fm; } else b = m; }
    return (a + b) / 2;
  }
  const sci = (x, d = 2) => {
    if (!isFinite(x)) return "∞"; if (x === 0) return "0";
    const e = Math.floor(Math.log10(Math.abs(x)));
    return e >= -2 && e < 4 ? x.toFixed(Math.max(0, d - e)) : (x / 10 ** e).toFixed(d) + "×10^" + e;
  };
  const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
  const sd = (a) => { const m = mean(a); return a.length > 1 ? Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1)) : 0; };
  function seedButton(S, fn) {
    let seed = 1;
    const b = S.$(".seed");
    const label = () => { const o = S.$("[data-seed]"); if (o) o.textContent = seed; };
    if (b) b.addEventListener("click", () => { seed += 1; label(); fn(); });
    const r = S.$(".seed0"); if (r) r.addEventListener("click", () => { seed = 1; label(); fn(); });
    label();
    return () => seed;
  }
  window.QChem = { rng, gauss, tcrit, linfit, bisect, sci, mean, sd, seedButton };
})();
