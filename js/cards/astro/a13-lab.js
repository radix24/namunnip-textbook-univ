/* 천우13 실습 카드: 영상 표시(늘이기), 회선 필터, 영상 합성, 별 중심 구하기. 모든 영상은 가상(합성) 자료 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const fx = (x, n = 2) => (+x).toFixed(n);
  const rng = (s) => () => { s = (s * 1664525 + 1013904223) % 4294967296; return (s + 0.5) / 4294967296; };
  const gauss = (r) => Math.sqrt(-2 * Math.log(r())) * Math.cos(2 * Math.PI * r());
  const erf = (x) => { const t = 1 / (1 + 0.3275911 * Math.abs(x)), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; };
  const Phi = (x) => 0.5 * (1 + erf(x / Math.SQRT2));
  // 픽셀 적분한 가우스 별: 최고값(연속) A, 표준편차 s, 중심 (x0, y0)
  const star = (A, s, x0, y0, i, j) => A * 2 * Math.PI * s * s * (Phi((i + 0.5 - x0) / s) - Phi((i - 0.5 - x0) / s)) * (Phi((j + 0.5 - y0) / s) - Phi((j - 0.5 - y0) / s));
  // 영상(n×n, 행 우선)을 회색조로 그리기. map(v) → 0~1
  function paint(v, A, n, x, y, size, map) {
    const off = document.createElement("canvas"); off.width = n; off.height = n;
    const g = off.getContext("2d"), im = g.createImageData(n, n);
    for (let k = 0; k < n * n; k++) { const q = Math.max(0, Math.min(255, Math.round(255 * map(A[k])))); im.data[4 * k] = im.data[4 * k + 1] = im.data[4 * k + 2] = q; im.data[4 * k + 3] = 255; }
    g.putImageData(im, 0, 0); v.g.save(); v.g.imageSmoothingEnabled = false; v.g.drawImage(off, x, y, size, size); v.g.restore();
  }
  const rms = (a) => { const m = a.reduce((s, x) => s + x, 0) / a.length; return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };
  const pct = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(p / 100 * (sorted.length - 1))))];

  /* 1. 히스토그램과 명암 늘이기 (02-01) */
  (() => {
    const S = QSim.card("lab-a13-stretch"); if (!S) return;
    const cv = S.$("canvas"), n = 96, A = new Float64Array(n * n);
    (() => { const r = rng(13), stars = []; for (let k = 0; k < 25; k++) stars.push([r() * n, r() * n, Math.pow(10, 2 + 2.5 * r())]);
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
        const dx = i - 48, dy = j - 44, u = dx * 0.819 + dy * 0.574, w = (-dx * 0.574 + dy * 0.819) / 0.45;
        let v = 100 + 600 * Math.exp(-Math.hypot(u, w) / 9) + 3000 * Math.exp(-Math.hypot(dx, dy) / 1.5);
        stars.forEach(([sx, sy, p]) => { const d2 = (i - sx) ** 2 + (j - sy) ** 2; if (d2 < 64) v += p * Math.exp(-d2 / (2 * 1.2 * 1.2)); });
        A[j * n + i] = v + 5 * gauss(r);
      } })();
    const sorted = Array.from(A).sort((a, b) => a - b);
    function draw() {
      const c = C(), st = S.val("st"), plo = S.val("lo"), phi = S.val("hi");
      const lo = pct(sorted, plo), hi = pct(sorted, phi), a = 10;
      const tf = { lin: (t) => t, sqrt: (t) => Math.sqrt(t), log: (t) => Math.log10(1 + 1000 * t) / 3, asinh: (t) => Math.asinh(a * t) / Math.asinh(a) }[st];
      const map = (x) => tf(Math.max(0, Math.min(1, (x - lo) / (hi - lo))));
      const v = QSim.view(cv, 0.5), sz = v.H - 8;
      paint(v, A, n, 4, 4, sz, map);
      // 오른쪽: 히스토그램(로그 개수)과 변환 곡선
      const ox = sz + 12, hb = new Array(64).fill(0); sorted.forEach((x) => { const b = Math.floor((Math.log10(Math.max(x, 40)) - 1.6) / 3.2 * 64); if (b >= 0 && b < 64) hb[b]++; });
      const g = v.g, X0 = ox + 30, W = v.W - X0 - 6, H = v.H - 34;
      g.save(); g.strokeStyle = c.rule; g.strokeRect(X0, 6, W, H); g.fillStyle = c.main;
      hb.forEach((h, b) => { if (h > 0) { const hh = Math.log10(h + 1) / 4 * H; g.fillRect(X0 + b * W / 64, 6 + H - hh, W / 64 - 0.5, hh); } });
      const xl = (x) => X0 + (Math.log10(Math.max(x, 40)) - 1.6) / 3.2 * W;
      g.strokeStyle = c.warn; g.lineWidth = 1.5; g.beginPath(); g.moveTo(xl(lo), 6); g.lineTo(xl(lo), 6 + H); g.moveTo(xl(hi), 6); g.lineTo(xl(hi), 6 + H); g.stroke();
      g.strokeStyle = c.acc; g.beginPath(); for (let k = 0; k <= 100; k++) { const xv = Math.pow(10, 1.6 + 3.2 * k / 100), yy = 6 + H - map(xv) * H; k ? g.lineTo(X0 + k * W / 100, yy) : g.moveTo(X0, yy); } g.stroke();
      g.fillStyle = c.ink3; g.font = "11px monospace"; g.fillText("log 픽셀 값 1.6 ~ 4.8", X0 + 4, 6 + H + 14); g.restore();
      const sat = sorted.filter((x) => x >= hi).length / sorted.length;
      S.out(`변환 ${{ lin: "선형", sqrt: "제곱근", log: "로그", asinh: "asinh(a = 10)" }[st]}, 아래 자름 ${fx(plo, 1)} 백분위 = ${fx(lo, 1)}, 위 자름 ${fx(phi, 1)} 백분위 = ${fx(hi, 1)}\n위 자름보다 밝아 흰색으로 꽉 찬 픽셀 ${fx(100 * sat, 2)}%. 배경 중앙값 ${fx(pct(sorted, 50), 1)}, 가장 밝은 픽셀 ${fx(sorted[sorted.length - 1], 0)}\n왼쪽: 가상 영상(은하 하나 + 별 25개 + 잡음), 오른쪽: 픽셀 값 히스토그램(파랑), 자름(빨강), 변환 곡선(주황)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 회선 필터로 잡음 줄이기 (02-02) */
  (() => {
    const S = QSim.card("lab-a13-filter"); if (!S) return;
    const cv = S.$("canvas"), n = 64, sp = 1.5, A = new Float64Array(n * n);
    (() => { const r = rng(7); for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) A[j * n + i] = star(25, sp, 32, 32, i, j) + 10 * gauss(r); A[20 * n + 44] += 200; })();
    function conv(src, k, h) {
      const out = new Float64Array(n * n);
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { let s = 0, w = 0;
        for (let b = -h; b <= h; b++) for (let a = -h; a <= h; a++) { const ii = i + a, jj = j + b; if (ii < 0 || jj < 0 || ii >= n || jj >= n) continue; const kk = k[(b + h) * (2 * h + 1) + a + h]; s += kk * src[jj * n + ii]; w += kk; }
        out[j * n + i] = s / w; }
      return out;
    }
    function median3(src) {
      const out = new Float64Array(n * n);
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const q = []; for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) { const ii = Math.min(n - 1, Math.max(0, i + a)), jj = Math.min(n - 1, Math.max(0, j + b)); q.push(src[jj * n + ii]); } q.sort((x, y) => x - y); out[j * n + i] = q[4]; }
      return out;
    }
    function draw() {
      const c = C(), m = S.val("m"), sk = S.val("sk");
      let B = A;
      if (m === "box") B = conv(A, new Array(9).fill(1), 1);
      else if (m === "gau") { const h = Math.ceil(3 * sk), k = []; for (let b = -h; b <= h; b++) for (let a = -h; a <= h; a++) k.push(Math.exp(-(a * a + b * b) / (2 * sk * sk))); B = conv(A, k, h); }
      else if (m === "med") B = median3(A);
      const bg = []; for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) if (Math.hypot(i - 32, j - 32) > 10 && Math.hypot(i - 44, j - 20) > 6 && i > 6 && j > 6 && i < n - 7 && j < n - 7) bg.push(B[j * n + i]);
      const sb = rms(bg), pk = B[32 * n + 32], cr = B[20 * n + 44];
      const v = QSim.view(cv, 0.5), sz = v.H - 8;
      paint(v, A, n, 4, 4, sz, (x) => (x + 30) / 90); paint(v, B, n, sz + 16, 4, sz, (x) => (x + 3 * sb) / (12 * sb));
      const g = v.g; g.save(); g.fillStyle = c.ink3; g.font = "11px monospace"; g.fillText("원본", 8, 16); g.fillText("필터 뒤", sz + 20, 16); g.restore();
      const name = { none: "필터 없음", box: "3×3 상자 평균", gau: `가우스(σ = ${fx(sk, 1)} px)`, med: "3×3 중앙값" }[m];
      S.out(`${name}: 배경 잡음 rms ${fx(sb, 2)} (원본 10), 별 중심 값 ${fx(pk, 2)}, 검출 S/N(중심 값 ÷ 잡음) ${fx(pk / sb, 2)}\n우주선(원래 +200인 한 픽셀) 자리의 값 ${fx(cr, 1)}\n가상 영상: 희미한 별 하나(최고값 약 25, 표준편차 ${sp} px, 화면 가운데)와 우주선 한 점(오른쪽 위), 잡음 10. 오른쪽 그림은 배경 −3σ~+9σ로 표시`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 여러 장 합성: 평균, 중앙값, 시그마 자름 (04-02) */
  (() => {
    const S = QSim.card("lab-a13-stack"); if (!S) return;
    const cv = S.$("canvas"), n = 48, MAXN = 32;
    const frames = (() => { const r = rng(31), F = []; for (let f = 0; f < MAXN; f++) { const a = new Float64Array(n * n);
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { a[j * n + i] = star(8, 1.5, 24, 24, i, j) + 10 * gauss(r); if (r() < 0.005) a[j * n + i] += 300; }
      F.push(a); } return F; })();
    function draw() {
      const c = C(), N = S.val("nf"), m = S.val("m"), out = new Float64Array(n * n);
      for (let k = 0; k < n * n; k++) {
        const q = []; for (let f = 0; f < N; f++) q.push(frames[f][k]);
        if (m === "mean") out[k] = q.reduce((s, x) => s + x, 0) / N;
        else if (m === "med") { q.sort((a, b) => a - b); out[k] = N % 2 ? q[(N - 1) / 2] : (q[N / 2 - 1] + q[N / 2]) / 2; }
        else { // 중앙값과 MAD(중앙 절대 편차)를 기준으로 3σ 밖을 버린 뒤 평균
          q.sort((a, b) => a - b); const md = N % 2 ? q[(N - 1) / 2] : (q[N / 2 - 1] + q[N / 2]) / 2;
          const d = q.map((x) => Math.abs(x - md)).sort((a, b) => a - b), mad = N % 2 ? d[(N - 1) / 2] : (d[N / 2 - 1] + d[N / 2]) / 2, sd = Math.max(1.4826 * mad, 1e-9);
          const keep = N < 3 ? q : q.filter((x) => Math.abs(x - md) <= 3 * sd); out[k] = keep.reduce((s, x) => s + x, 0) / keep.length; }
      }
      const bg = []; for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) if (Math.hypot(i - 24, j - 24) > 8) bg.push(out[j * n + i]);
      const bs = bg.slice().sort((a, b) => a - b), sb = 1.4826 * pct(bs.map((x) => Math.abs(x - pct(bs, 50))).sort((a, b) => a - b), 50);
      const hot = bg.filter((x) => x > 5 * sb).length, pk = out[24 * n + 24];
      const v = QSim.view(cv, 0.5), sz = v.H - 8;
      paint(v, frames[0], n, 4, 4, sz, (x) => (x + 30) / 90); paint(v, out, n, sz + 16, 4, sz, (x) => (x + 3 * sb) / (12 * sb));
      const g = v.g; g.save(); g.fillStyle = c.ink3; g.font = "11px monospace"; g.fillText("한 장", 8, 16); g.fillText(`${N}장 합성`, sz + 20, 16); g.restore();
      S.out(`${{ mean: "평균", med: "중앙값", clip: "3σ 자름 평균(중앙값·MAD 기준)" }[m]}, ${N}장: 배경 잡음(MAD 추정) ${fx(sb, 2)} (한 장 10, 10/√N = ${fx(10 / Math.sqrt(N), 2)})\n별 중심 값 ${fx(pk, 2)}, S/N ${fx(pk / sb, 1)}. 배경에서 5σ를 넘는 픽셀(남은 우주선 등) ${hot}개 / ${bg.length}개\n가상 자료: 희미한 별(최고값 약 8) + 잡음 10 + 한 장에 픽셀 0.5%꼴로 우주선(+300)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 별 중심 구하기의 정밀도 (06-01) */
  (() => {
    const S = QSim.card("lab-a13-centroid"); if (!S) return;
    const cv = S.$("canvas"), W = 15, H = 7;
    function measure(m, I, s) {
      const sw2 = Math.max(s, 1) ** 2;   // 창의 너비: 별의 σ(1 px보다 작으면 1 px)
      if (m === "com" || m === "thr") { let sx = 0, sy = 0, sw = 0; for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) { const v = I[j * W + i]; if (m === "thr" && v < 3) continue; sx += v * i; sy += v * j; sw += v; } return sw > 0 ? [sx / sw, sy / sw] : [H, H]; }
      let mx = -1e9, x = H, y = H; for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) if (I[j * W + i] > mx) { mx = I[j * W + i]; x = i; y = j; }
      for (let it = 0; it < 20; it++) { let ax = 0, ay = 0, sw = 0; for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) { const w = Math.exp(-((i - x) ** 2 + (j - y) ** 2) / (2 * sw2)), wi = w * I[j * W + i]; ax += wi * (i - x); ay += wi * (j - y); sw += wi; } if (sw <= 0) break; const dx = 2 * ax / sw, dy = 2 * ay / sw; x += dx; y += dy; if (Math.abs(x - H) > 5 || Math.abs(y - H) > 5) { x = H; y = H; break; } if (Math.abs(dx) + Math.abs(dy) < 1e-5) break; }
      return [x, y];
    }
    function draw() {
      const c = C(), fw = S.val("fw"), F = S.val("flux"), m = S.val("m"), s = fw / 2.3548, A = F / (2 * Math.PI * s * s);   // 픽셀 잡음 σ = 1, 별의 총 신호 F
      const r = rng(99), errs = [], pts = [];
      for (let t = 0; t < 300; t++) {
        const x0 = H + r() - 0.5, y0 = H + r() - 0.5, I = new Float64Array(W * W);
        for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) I[j * W + i] = star(A, s, x0, y0, i, j) + gauss(r);
        const [x, y] = measure(m, I, s); errs.push([x - x0, y - y0]); pts.push([x0 - Math.floor(x0 + 0.5), x - x0]);
      }
      const ex = errs.map((e) => e[0]), mean = ex.reduce((a, b) => a + b, 0) / ex.length, rmsx = Math.sqrt(ex.reduce((a, b) => a + b * b, 0) / ex.length);
      const crlb = Math.sqrt(8 * Math.PI) * s * s / F;
      const v = QSim.view(cv, 0.5), ym = Math.max(0.05, 3.5 * rmsx), f = QSim.frame(v, { x0: -0.5, x1: 0.5, y0: -ym, y1: ym, xl: "참 중심의 픽셀 안 위치", yl: "x 오차 (px)" }); f.axes();
      pts.forEach(([p, e]) => f.dot(p, Math.max(-ym, Math.min(ym, e)), c.main, 2));
      f.path([[-0.5, crlb], [0.5, crlb]], c.acc, 1, [4, 3]); f.path([[-0.5, -crlb], [0.5, -crlb]], c.acc, 1, [4, 3]);
      S.out(`${{ com: "무게중심(15×15 창 전체)", thr: "무게중심(3σ 넘는 픽셀만)", win: "가우스 창 무게중심(반복)" }[m]}, FWHM ${fx(fw, 1)} px, 별의 총 신호 ${F}(픽셀 잡음 1, 최고 픽셀 약 ${fx(star(A, s, H, H, H, H), 1)}): 300번 모의 측정\nx 오차 rms ${fx(rmsx, 4)} px, 평균(치우침) ${fx(mean, 4)} px. 이론 하한(크라메르-라오, 표본이 충분할 때) √(8π)σ²/F = ${fx(crlb, 4)} px\n점: 참 중심의 픽셀 안 위치에 따른 오차, 주황 점선: 이론 하한 ±1σ. 배경은 0으로 뺀 상태, 잡음 σ = 1(가상 자료)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
