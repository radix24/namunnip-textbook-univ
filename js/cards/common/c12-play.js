/* 공통12 체험 카드 묶음 2: 이항분포의 정규 근사와 연속성 수정. */
(() => {
  "use strict";
  const C = () => QSim.col();
  /* 표준정규 누적분포: erf의 다항식 근사 (오차 1.5×10⁻⁷ 이하) */
  const Phi = (z) => { const t = 1 / (1 + (0.3275911 * Math.abs(z)) / Math.SQRT2); const e = 1 - (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t) * Math.exp(-(z * z) / 2); return z >= 0 ? 0.5 * (1 + e) : 0.5 * (1 - e); };
  const lf = (k) => { let s = 0; for (let i = 2; i <= k; i++) s += Math.log(i); return s; };

  /* 1. 이항분포를 정규분포로 어림하기 (04-03) */
  (() => {
    const S = QSim.card("lab-c12-normapprox"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), n = S.val("n"), p = S.val("p"); let k = S.val("k"); if (k > n) k = n;
      const pm = []; for (let i = 0; i <= n; i++) pm.push(Math.exp(lf(n) - lf(i) - lf(n - i) + i * Math.log(p) + (n - i) * Math.log(1 - p)));
      const mu = n * p, sg = Math.sqrt(n * p * (1 - p)), top = Math.max(...pm, 1 / (sg * Math.sqrt(2 * Math.PI))) * 1.15;
      const v = QSim.view(cv, 0.58), F = QSim.frame(v, { x0: -0.5, x1: n + 0.5, y0: 0, y1: top, xl: "x", yl: "확률" }); F.axes({ noGrid: true });
      const g = v.g;
      pm.forEach((q, i) => { g.fillStyle = i <= k ? c.main : c.soft; g.globalAlpha = i <= k ? 0.75 : 0.6; g.fillRect(F.X(i - 0.45), F.Y(q), F.X(i + 0.45) - F.X(i - 0.45), F.Y(0) - F.Y(q)); });
      g.globalAlpha = 1;
      F.fn((x) => Math.exp(-((x - mu) ** 2) / (2 * sg * sg)) / (sg * Math.sqrt(2 * Math.PI)), c.acc, 2.5, null, 500);
      F.path([[k + 0.5, 0], [k + 0.5, top]], c.ink3, 1, [4, 4]);
      const ex = pm.slice(0, k + 1).reduce((s, q) => s + q, 0), a1 = Phi((k - mu) / sg), a2 = Phi((k + 0.5 - mu) / sg);
      S.out(`X ~ B(${n}, ${p.toFixed(2)}),  평균 ${mu.toFixed(2)},  표준편차 = ${sg.toFixed(3)},  np = ${mu.toFixed(1)}, n(1−p) = ${(n - mu).toFixed(1)}\n` +
        `정확한 P(X ≤ ${k}) = ${ex.toFixed(4)}\n정규 근사 Φ((${k} − ${mu.toFixed(2)})/${sg.toFixed(3)}) = ${a1.toFixed(4)}  (오차 ${(a1 - ex).toFixed(4)})\n` +
        `연속성 수정 Φ((${k} + 0.5 − ${mu.toFixed(2)})/${sg.toFixed(3)}) = ${a2.toFixed(4)}  (오차 ${(a2 - ex).toFixed(4)})`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
  /* 2. 베이즈 정리: 양성 판정을 받은 1000명 가운데 실제 환자는 몇 명인가 (01-02) */
  (() => {
    const S = QSim.card("lab-c12-bayes"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), p = S.val("p") / 100, se = S.val("se") / 100, sp = S.val("sp") / 100;
      const N = 1000, D = Math.round(N * p), TP = Math.round(D * se), FN = D - TP, H = N - D, FP = Math.round(H * (1 - sp)), TN = H - FP;
      const v = QSim.view(cv, 0.5), g = v.g, cols = 50, rows = 20, w = v.W / cols, h = (v.H - 4) / rows;
      g.clearRect(0, 0, v.W, v.H);
      /* 왼쪽 위부터: 참양성(진한 빨강), 거짓음성(옅은 빨강), 거짓양성(주황), 참음성(회색) */
      const kinds = [[TP, c.warn, 1], [FN, c.warn, 0.3], [FP, c.acc, 1], [TN, c.rule, 0.5]];
      let k = 0;
      kinds.forEach(([n, col, al]) => { g.fillStyle = col; g.globalAlpha = al; g.beginPath(); for (let i = 0; i < n; i++, k++) { const x = (k % cols) * w, y = Math.floor(k / cols) * h; g.rect(x + 1, y + 1, w - 2, h - 2); } g.fill(); });
      g.globalAlpha = 1;
      const pos = TP + FP, exact = (p * se) / (p * se + (1 - p) * (1 - sp));
      S.out(`1000명 가운데 실제 환자 ${D}명, 건강한 사람 ${H}명\n` +
        `양성 판정: 환자 중 ${TP}명(진한 빨강) + 건강한 사람 중 ${FP}명(주황) = ${pos}명.  놓친 환자 ${FN}명(옅은 빨강)\n` +
        `양성일 때 실제 환자일 확률 P(병|양성) = ${TP} / ${pos} ≈ ${pos ? (TP / pos).toFixed(3) : "-"}  (베이즈 정리로 정확히 ${exact.toFixed(4)})`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
  /* 3. 신뢰구간 50개를 한꺼번에: "95%"는 무엇의 확률인가 (07-01) */
  (() => {
    const S = QSim.card("lab-c12-ci"); if (!S) return;
    const cv = S.$("canvas"); let seed = 3;
    const rng = (sd) => () => { sd |= 0; sd = (sd + 0x6d2b79f5) | 0; let t = Math.imul(sd ^ (sd >>> 15), 1 | sd); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const Z = { 80: 1.2816, 90: 1.6449, 95: 1.96, 99: 2.5758 };
    function draw() {
      const c = C(), n = Math.round(S.val("n")), lv = S.val("lv"), mu = 50, sg = 10, u = rng(seed), z = Z[lv];
      const gauss = () => Math.sqrt(-2 * Math.log(u() + 1e-12)) * Math.cos(2 * Math.PI * u());
      const v = QSim.view(cv, 0.62), F = QSim.frame(v, { x0: 30, x1: 70, y0: 0, y1: 51, xl: "모평균의 구간", pad: 24 }); F.axes({ noGrid: true });
      F.path([[mu, 0], [mu, 51]], c.acc, 2, [5, 4]);
      let hit = 0, w = 0;
      for (let k = 0; k < 50; k++) {
        let s = 0; for (let i = 0; i < n; i++) s += mu + sg * gauss();
        const m = s / n, h = (z * sg) / Math.sqrt(n), ok = m - h <= mu && mu <= m + h; if (ok) hit++; w = 2 * h;
        F.path([[Math.max(30, m - h), k + 0.8], [Math.min(70, m + h), k + 0.8]], ok ? c.main : c.warn, 2); F.dot(m, k + 0.8, ok ? c.main : c.warn, 2.5);
      }
      S.out(`가상 모집단: 평균 50, 표준편차 10 (주황 점선이 참 평균).  ${seed}번째 실험 묶음\n` +
        `크기 ${n}인 표본을 50번 뽑아 각각 ${lv}% 신뢰구간 x̄ ± ${z}×10/√${n} (폭 ${w.toFixed(2)})을 그림\n` +
        `참 평균을 포함한 구간 ${hit}개 / 50개 = ${(hit * 2).toFixed(0)}%  (빨강은 놓친 구간)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
    S.$(".reroll").addEventListener("click", () => { seed++; draw(); });
  })();
})();
