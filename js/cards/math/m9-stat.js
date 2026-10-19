/* 수학9 공통: 통계 분포 함수 (t, χ², F, 정규)와 시드 난수 — window.M9 */
(() => {
  "use strict";
  if (window.M9) return;
  const LG = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  function lgamma(x) { let y = x, t = x + 5.5; t -= (x + 0.5) * Math.log(t); let s = 1.000000000190015; for (const c of LG) s += c / ++y; return -t + Math.log((2.5066282746310005 * s) / x); }
  function betacf(a, b, x) {
    const FP = 1e-300; let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - (qab * x) / qap;
    if (Math.abs(d) < FP) d = FP; d = 1 / d; let h = d;
    for (let m = 1; m <= 300; m++) {
      const m2 = 2 * m; let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FP) d = FP; c = 1 + aa / c; if (Math.abs(c) < FP) c = FP; d = 1 / d; h *= d * c;
      aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FP) d = FP; c = 1 + aa / c; if (Math.abs(c) < FP) c = FP; d = 1 / d; const de = d * c; h *= de;
      if (Math.abs(de - 1) < 3e-16) break;
    }
    return h;
  }
  function betainc(a, b, x) {
    if (x <= 0) return 0; if (x >= 1) return 1;
    const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? (bt * betacf(a, b, x)) / a : 1 - (bt * betacf(b, a, 1 - x)) / b;
  }
  function gammainc(s, x) {
    if (x <= 0) return 0;
    if (x < s + 1) { let ap = s, sum = 1 / s, de = 1 / s; for (let i = 0; i < 1000; i++) { ap++; de *= x / ap; sum += de; if (Math.abs(de) < Math.abs(sum) * 1e-16) break; } return sum * Math.exp(-x + s * Math.log(x) - lgamma(s)); }
    let b = x + 1 - s, c = 1e300, d = 1 / b, h = d;
    for (let i = 1; i < 1000; i++) { const an = -i * (i - s); b += 2; d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300; c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; const de = d * c; h *= de; if (Math.abs(de - 1) < 1e-16) break; }
    return 1 - Math.exp(-x + s * Math.log(x) - lgamma(s)) * h;
  }
  const erf = (x) => { // 정밀: 1 − 2·Q(√2 x)를 감마로
    const s = Math.sign(x), v = gammainc(0.5, x * x); return s * v;
  };
  const normCdf = (z) => 0.5 * (1 + erf(z / Math.SQRT2));
  const normPdf = (z) => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
  const tCdf = (t, k) => { const p = 0.5 * betainc(k / 2, 0.5, k / (k + t * t)); return t > 0 ? 1 - p : p; };
  const tPdf = (t, k) => Math.exp(lgamma((k + 1) / 2) - lgamma(k / 2) - 0.5 * Math.log(k * Math.PI) - ((k + 1) / 2) * Math.log(1 + (t * t) / k));
  const chi2Cdf = (x, k) => gammainc(k / 2, x / 2);
  const chi2Pdf = (x, k) => (x <= 0 ? 0 : Math.exp((k / 2 - 1) * Math.log(x) - x / 2 - (k / 2) * Math.log(2) - lgamma(k / 2)));
  const fCdf = (x, a, b) => (x <= 0 ? 0 : betainc(a / 2, b / 2, (a * x) / (a * x + b)));
  const fPdf = (x, a, b) => (x <= 0 ? 0 : Math.exp(0.5 * a * Math.log(a) + 0.5 * b * Math.log(b) + (a / 2 - 1) * Math.log(x) - ((a + b) / 2) * Math.log(b + a * x) - lgamma(a / 2) - lgamma(b / 2) + lgamma((a + b) / 2)));
  const quant = (cdf, p, lo, hi) => { for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (cdf(m) < p) lo = m; else hi = m; } return (lo + hi) / 2; };
  const rng = (seed) => { let s = seed | 0; const u = () => { s = (s + 0x6d2b79f5) | 0; let r = Math.imul(s ^ (s >>> 15), 1 | s); r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r; return (((r ^ (r >>> 14)) >>> 0) + 0.5) / 4294967296; }; const n = () => Math.sqrt(-2 * Math.log(u())) * Math.cos(2 * Math.PI * u()); return { u, n }; };
  window.M9 = { lgamma, betainc, gammainc, normCdf, normPdf, tCdf, tPdf, chi2Cdf, chi2Pdf, fCdf, fPdf, quant, rng };
})();
