/* 공통7 체험 카드 묶음 2: 짝지은 자료와 독립인 두 표본의 비교 (가상 자료). */
(() => {
  "use strict";
  const C = () => QSim.col();
  /* 정해진 씨앗으로 같은 가상 자료를 다시 만들 수 있게 한다 */
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const normal = (u) => () => Math.sqrt(-2 * Math.log(1 - u())) * Math.cos(2 * Math.PI * u());
  /* t 분포의 양쪽 p값: 정규화된 불완전 베타 함수 (연분수) */
  function betacf(a, b, x) {
    let c = 1, d = 1 - ((a + b) * x) / (a + 1); d = 1 / (Math.abs(d) < 1e-30 ? 1e-30 : d); let h = d;
    for (let m = 1; m <= 200; m++) {
      const m2 = 2 * m; let aa = (m * (b - m) * x) / ((a + m2 - 1) * (a + m2));
      d = 1 + aa * d; d = 1 / (Math.abs(d) < 1e-30 ? 1e-30 : d); c = 1 + aa / c; c = Math.abs(c) < 1e-30 ? 1e-30 : c; h *= d * c;
      aa = (-(a + m) * (a + b + m) * x) / ((a + m2) * (a + m2 + 1));
      d = 1 + aa * d; d = 1 / (Math.abs(d) < 1e-30 ? 1e-30 : d); c = 1 + aa / c; c = Math.abs(c) < 1e-30 ? 1e-30 : c; const del = d * c; h *= del;
      if (Math.abs(del - 1) < 1e-12) break;
    }
    return h;
  }
  const lgam = (x) => { const g = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5]; let y = x, t = x + 5.5; t -= (x + 0.5) * Math.log(t); let s = 1.000000000190015; g.forEach((q) => (s += q / ++y)); return -t + Math.log((2.5066282746310005 * s) / x); };
  const ibeta = (a, b, x) => { if (x <= 0) return 0; if (x >= 1) return 1; const bt = Math.exp(lgam(a + b) - lgam(a) - lgam(b) + a * Math.log(x) + b * Math.log(1 - x)); return x < (a + 1) / (a + b + 2) ? (bt * betacf(a, b, x)) / a : 1 - (bt * betacf(b, a, 1 - x)) / b; };
  const pT = (t, df) => ibeta(df / 2, 0.5, df / (df + t * t));
  const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  const sd = (a) => { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };

  /* 1. 같은 사람을 두 번 잰 자료 (09-03) */
  (() => {
    const S = QSim.card("lab-c7-paired"); if (!S) return;
    const cv = S.$("canvas"); let seed = 28;  /* 처음 화면은 전형적인 결과가 나오는 자료 */
    function draw() {
      const c = C(), n = 10, dlt = S.val("d"), sb = S.val("sb");
      const u = rng(seed), z = normal(u);
      const B = [], A = [];
      for (let i = 0; i < n; i++) { const p = 70 + sb * z(); B.push(+(p + 2 * z()).toFixed(1)); A.push(+(p + dlt + 2 * z()).toFixed(1)); }
      const D = A.map((a, i) => a - B[i]);
      const v = QSim.view(cv, 0.6), F = QSim.frame(v, { x0: -0.6, x1: 1.6, y0: 30, y1: 115, yl: "점수" }); F.axes({ noGrid: true });
      F.text("전", 0, 32, c.ink2, "center"); F.text("후", 1, 32, c.ink2, "center");
      B.forEach((b, i) => { F.path([[0, b], [1, A[i]]], D[i] > 0 ? c.main : c.warn, 1.2); F.dot(0, b, c.ink3, 4); F.dot(1, A[i], c.ink, 4); });
      const mB = mean(B), mA = mean(A), sB = sd(B), sA = sd(A), mD = mean(D), sD = sd(D);
      const sp = Math.sqrt((sA * sA + sB * sB) / 2), t2 = (mA - mB) / (sp * Math.sqrt(2 / n)), p2 = pT(t2, 2 * n - 2);
      const t1 = mD / (sD / Math.sqrt(n)), p1 = pT(t1, n - 1);
      S.out(`가상 자료 ${seed}번: 학생 10명의 시험 점수, 개인차 크기 ${sb}, 실제 향상 ${dlt}점\n` +
        `전 평균 ${mB.toFixed(2)} (표준편차 ${sB.toFixed(2)}),  후 평균 ${mA.toFixed(2)} (표준편차 ${sA.toFixed(2)})\n` +
        `독립인 두 표본으로 보면:  t = ${t2.toFixed(2)} (자유도 18),  p = ${p2.toFixed(4)}\n` +
        `짝지은 차이 d = 후 − 전:  평균 ${mD.toFixed(2)}, 표준편차 ${sD.toFixed(2)},  t = ${t1.toFixed(2)} (자유도 9),  p = ${p1.toFixed(4)}`);
    }
    S.$(".reroll").addEventListener("click", () => { seed++; draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
  /* 2. 내 자료로 기술통계와 그래프 만들기 (02-03) */
  (() => {
    const S = QSim.card("lab-c7-desc"); if (!S) return;
    const cv = S.$("canvas"), ta = S.$("textarea");
    /* 사분위수: R의 기본(type 7)과 엑셀의 QUARTILE.INC와 같은 선형 보간 */
    const q = (a, p) => { const h = (a.length - 1) * p, lo = Math.floor(h); return a[lo] + (h - lo) * ((a[lo + 1] ?? a[lo]) - a[lo]); };
    function draw() {
      const c = C(), bins = S.val("bins");
      const xs = (ta.value.match(/-?\d+(\.\d+)?/g) || []).map(Number);
      const v = QSim.view(cv, 0.6);
      if (xs.length < 2) { S.out("수를 두 개 이상 넣으세요 (쉼표, 띄어쓰기, 줄바꿈 아무거나로 나눔)"); return; }
      const a = [...xs].sort((p, r) => p - r), n = a.length, mean = a.reduce((s, x) => s + x, 0) / n;
      const sd = Math.sqrt(a.reduce((s, x) => s + (x - mean) ** 2, 0) / (n - 1));
      const Q1 = q(a, 0.25), Q2 = q(a, 0.5), Q3 = q(a, 0.75), iqr = Q3 - Q1, lo = a[0], hi = a[n - 1];
      const w = (hi - lo) / bins || 1, cnt = new Array(bins).fill(0);
      a.forEach((x) => cnt[Math.min(bins - 1, Math.floor((x - lo) / w))]++);
      const top = Math.max(...cnt) * 1.35;
      const F = QSim.frame(v, { x0: lo - w * 0.5, x1: hi + w * 0.5, y0: -top * 0.35, y1: top, xl: "값", yl: "도수" }); F.axes({ noGrid: true });
      const g = v.g;
      cnt.forEach((k, i) => { const x = lo + i * w; g.fillStyle = c.soft; g.fillRect(F.X(x), F.Y(k), F.X(x + w) - F.X(x) - 1, F.Y(0) - F.Y(k)); g.strokeStyle = c.main; g.strokeRect(F.X(x), F.Y(k), F.X(x + w) - F.X(x) - 1, F.Y(0) - F.Y(k)); });
      /* 상자 그림: 수염은 1.5×IQR 안의 가장 먼 값까지, 그 밖은 이상값 점 */
      const yb = -top * 0.18, hb = top * 0.08, inF = a.filter((x) => x >= Q1 - 1.5 * iqr && x <= Q3 + 1.5 * iqr), out = a.filter((x) => !inF.includes(x));
      F.path([[inF[0], yb], [Q1, yb]], c.ink, 1.5); F.path([[Q3, yb], [inF[inF.length - 1], yb]], c.ink, 1.5);
      g.strokeStyle = c.ink; g.lineWidth = 1.5; g.strokeRect(F.X(Q1), F.Y(yb + hb), F.X(Q3) - F.X(Q1), F.Y(yb - hb) - F.Y(yb + hb));
      F.path([[Q2, yb - hb], [Q2, yb + hb]], c.acc, 2.5);
      out.forEach((x) => F.dot(x, yb, c.warn, 4));
      F.path([[mean, 0], [mean, top * 0.95]], c.acc, 1.2, [4, 3]);
      S.out(`n = ${n},  평균 ${mean.toFixed(3)},  표준편차(n − 1로 나눔) ${sd.toFixed(3)}\n최솟값 ${lo},  Q1 ${Q1.toFixed(2)},  중앙값 ${Q2.toFixed(2)},  Q3 ${Q3.toFixed(2)},  최댓값 ${hi},  IQR ${iqr.toFixed(2)}\n` +
        (out.length ? `이상값(1.5×IQR 밖): ${out.join(", ")}` : "1.5×IQR 밖의 이상값 없음"));
    }
    ta.addEventListener("input", draw);
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
