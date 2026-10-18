/* 물리6 실습 카드 묶음: 논리 간소화, 카운터 타이밍, PLL, 표본화와 양자화, 축차 비교 ADC */
(() => {
  "use strict";
  const C = () => QSim.col();
  const mono = () => getComputedStyle(document.documentElement).getPropertyValue("--f-mono") || "monospace";

  /* 1. 진리표와 카르노 맵, 최소 곱의 합 (01-01) */
  (() => {
    const S = QSim.card("lab-p6-logic"); if (!S) return;
    const cv = S.$("canvas");
    const PRE = { maj: [3, 5, 6, 7], xor3: [1, 2, 4, 7], ex: [2, 3, 5, 6, 7], and: [7], none: [] };
    const boxes = () => S.$$('input[name^="m"]');
    function terms() {   // 3변수 곱항: 각 변수 0, 1, 무관(2)
      const T = []; for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) for (let c = 0; c < 3; c++) T.push([a, b, c]);
      return T;
    }
    const covers = (t, m) => [(m >> 2) & 1, (m >> 1) & 1, m & 1].every((v, i) => t[i] === 2 || t[i] === v);
    const lits = (t) => t.reduce((s, v) => s + (v !== 2 ? 1 : 0), 0);
    const str = (t) => { const s = ["A", "B", "C"].map((n, i) => (t[i] === 2 ? "" : t[i] ? n : n + "̄")).join(""); return s || "1"; };
    function minimize(ones) {
      if (!ones.length) return "0";
      const imp = terms().filter((t) => [...Array(8).keys()].every((m) => !covers(t, m) || ones.includes(m)));
      const prime = imp.filter((t) => !imp.some((u) => u !== t && lits(u) < lits(t) && [...Array(8).keys()].every((m) => !covers(t, m) || covers(u, m))));
      let best = null;
      for (let mask = 1; mask < 1 << prime.length; mask++) {
        const sel = prime.filter((_, i) => mask >> i & 1);
        if (!ones.every((m) => sel.some((t) => covers(t, m)))) continue;
        const cost = sel.length * 10 + sel.reduce((s, t) => s + lits(t), 0);
        if (!best || cost < best.cost) best = { sel, cost };
      }
      return best.sel.map(str).join(" + ");
    }
    function draw() {
      const c = C(), ones = boxes().filter((b) => b.checked).map((b) => +b.name.slice(1));
      const v = QSim.view(cv, 0.42), g = v.g; g.font = "13px " + mono();
      const x0 = 10, cw = Math.min(30, v.W / 16);
      g.fillStyle = c.ink2; ["A", "B", "C", "F"].forEach((s, i) => g.fillText(s, x0 + i * cw, 16));
      for (let m = 0; m < 8; m++) { const y = 34 + m * 17; [(m >> 2) & 1, (m >> 1) & 1, m & 1, ones.includes(m) ? 1 : 0].forEach((b, i) => { g.fillStyle = i === 3 ? (b ? c.warn : c.ink3) : c.ink; g.fillText(String(b), x0 + i * cw, y); }); }
      const kx = x0 + 5 * cw + 20, ky = 40, kw = Math.min(56, (v.W - kx - 10) / 4.5), kh = 40, order = [0, 1, 3, 2];
      g.fillStyle = c.ink2; g.fillText("BC →", kx, ky - 22); order.forEach((bc, j) => g.fillText(bc.toString(2).padStart(2, "0"), kx + (j + 0.35) * kw, ky - 6));
      [0, 1].forEach((a) => { g.fillStyle = c.ink2; g.fillText(`A=${a}`, kx - 38, ky + a * kh + kh * 0.6); order.forEach((bc, j) => { const m = a * 4 + bc, on = ones.includes(m); g.fillStyle = on ? c.soft : c.card; g.fillRect(kx + j * kw, ky + a * kh, kw - 2, kh - 2); g.strokeStyle = c.rule; g.strokeRect(kx + j * kw, ky + a * kh, kw - 2, kh - 2); g.fillStyle = on ? c.warn : c.ink3; g.fillText(on ? "1" : "0", kx + j * kw + kw * 0.42, ky + a * kh + kh * 0.62); }); });
      S.out(`출력이 1인 행(최소항): ${ones.length ? ones.map((m) => "m" + m).join(", ") : "없음"}\n최소항의 합: ${ones.length ? ones.map((m) => str([(m >> 2) & 1, (m >> 1) & 1, m & 1])).join(" + ") : "0"}\n간단히 한 식: F = ${minimize(ones)}\n카르노 맵의 칸 순서 00, 01, 11, 10 (이웃 칸은 한 비트만 다름. 맨 왼쪽과 오른쪽도 이웃)`);
    }
    S.$('[name="pre"]').addEventListener("input", () => { const p = PRE[S.val("pre")]; if (p) boxes().forEach((b) => (b.checked = p.includes(+b.name.slice(1)))); draw(); });
    boxes().forEach((b) => b.addEventListener("input", draw));
    QSim.redrawOn(draw); const p = PRE[S.val("pre")]; boxes().forEach((b) => (b.checked = p.includes(+b.name.slice(1)))); draw();
  })();

  /* 2. 리플 카운터와 동기 카운터의 타이밍 (02-02) */
  (() => {
    const S = QSim.card("lab-p6-counter"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), n = S.val("n"), sync = S.val("type") === "sync", dl = S.val("dl"), N = (1 << n) + 2, T = 1;
      const v = QSim.view(cv, 0.18 + 0.09 * (n + 1)), g = v.g, x0 = 40, W = v.W - x0 - 10, rows = n + 2, rh = (v.H - 10) / rows, sx = W / (N * T);
      const X = (t) => x0 + t * sx;
      g.font = "12px " + mono(); g.fillStyle = c.ink2;
      const wave = (row, edges, col, label) => {   // edges: [시각, 값]
        const yb = 8 + row * rh + rh * 0.8, yt = 8 + row * rh + rh * 0.25; g.fillStyle = c.ink2; g.fillText(label, 4, yb - 4);
        g.strokeStyle = col; g.lineWidth = 1.8; g.beginPath(); let val = edges[0][1]; g.moveTo(X(0), val ? yt : yb);
        edges.slice(1).forEach(([t, nv]) => { g.lineTo(X(t), val ? yt : yb); g.lineTo(X(t), nv ? yt : yb); val = nv; }); g.lineTo(X(N * T), val ? yt : yb); g.stroke(); g.lineWidth = 1;
      };
      const clk = [[0, 0]]; for (let k = 0; k < N; k++) { clk.push([k + 0.5, 1]); clk.push([k + 1, 0]); }
      wave(0, clk, c.ink3, "CLK");
      const Q = Array.from({ length: n }, () => [[0, 0]]);
      for (let k = 1; k <= N; k++) {   // k번째 상승 가장자리 = 시각 k - 0.5
        const cnt = k % (1 << n), prev = (k - 1) % (1 << n);
        for (let b = 0; b < n; b++) { const nb = (cnt >> b) & 1, pb = (prev >> b) & 1; if (nb !== pb) Q[b].push([k - 0.5 + (sync ? dl : dl * (b + 1)), nb]); }
      }
      Q.forEach((e, b) => wave(b + 1, e, c.main, "Q" + b));
      const yb = 8 + (n + 1) * rh + rh * 0.65; g.fillStyle = c.ink2; g.fillText("수", 4, yb);
      for (let k = 0; k < N; k++) { g.fillStyle = c.ink; g.fillText(String(k % (1 << n)), X(k + 0.5) + 4, yb); }
      const glitch = !sync && dl > 0.02;
      S.out(`${n}비트 ${sync ? "동기" : "리플(비동기)"} 카운터, 플립플롭 지연 ${dl.toFixed(2)} × 클록 주기\n0부터 ${(1 << n) - 1}까지 세고 되돌아간다. Q${n - 1}의 진동수 = 클록/${1 << n}\n${glitch ? `리플 카운터는 지연이 단마다 쌓여 Q${n - 1}이 ${(dl * n).toFixed(2)}주기 늦게 바뀐다. 그 사이에 잠깐 틀린 수가 나타난다(예: 3 → 4 사이에 2, 0을 거침)` : sync ? "모든 비트가 같은 순간에 바뀌어 틀린 중간값이 없다" : "지연이 작아 거의 동시에 바뀐다"}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. PLL 고정 과정 (03-02) */
  (() => {
    const S = QSim.card("lab-p6-pll"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), fin = S.val("fin"), f0 = 100, Kv = S.val("kv"), tau = S.val("tau"), Kd = 1, T = 2, h = 2e-4;
      let pi = 0, pv = 0, vc = 0; const ff = [], pe = [];
      for (let t = 0; t < T; t += h) {
        const vpd = Kd * Math.sin(pi - pv);
        vc += (vpd - vc) / tau * h;
        pi += 2 * Math.PI * fin * h; pv += 2 * Math.PI * (f0 + Kv * vc) * h;
        if (ff.length === 0 || t - ff[ff.length - 1][0] > 0.004) { ff.push([t, f0 + Kv * vc]); pe.push([t, Math.atan2(Math.sin(pi - pv), Math.cos(pi - pv))]); }
      }
      const v = QSim.view(cv, 0.55), lo = Math.min(f0, fin) - 15, hi = Math.max(f0, fin) + 15;
      const f = QSim.frame(v, { x0: 0, x1: T, y0: lo, y1: hi, xl: "t (s)", yl: "VCO 진동수 (Hz)" }); f.axes();
      f.path([[0, fin], [T, fin]], c.acc, 1.5, [5, 4]); f.path([[0, f0], [T, f0]], c.ink3, 1, [2, 4]);
      f.path(ff, c.main, 2.2);
      const last = ff.slice(-20), fend = last.reduce((s, p) => s + p[1], 0) / last.length, spread = Math.max(...last.map((p) => p[1])) - Math.min(...last.map((p) => p[1]));
      const locked = Math.abs(fend - fin) < 0.5 && spread < 2, perr = pe[pe.length - 1][1];
      S.out(`입력 ${fin} Hz, VCO 자유 진동수 ${f0} Hz, VCO 이득 K_v = ${Kv} Hz/V, 루프 필터 시간 상수 ${tau.toFixed(3)} s (위상 검출기 출력 sin(위상 차))\n${locked ? `고정됨: VCO가 ${fend.toFixed(2)} Hz로 입력을 따라감. 남은 위상 차 ${(perr * 180 / Math.PI).toFixed(1)}° (sin = (f_in − f₀)/K_v = ${((fin - f0) / Kv).toFixed(2)})` : `고정 안 됨: 진동수 차 ${Math.abs(fin - f0)} Hz가 고정 범위(약 K_v = ${Kv} Hz)를 넘거나 아직 끌려가는 중`}\n주황 점선: 입력 진동수, 회색 점선: VCO 자유 진동수`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 표본화와 양자화 (04-01) */
  (() => {
    const S = QSim.card("lab-p6-sample"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), f = S.val("f"), fs = S.val("fs"), n = S.val("bits"), T = 0.02, L = 2 ** n;
      const q = (y) => Math.round((y + 1) / 2 * (L - 1)) / (L - 1) * 2 - 1;
      const k = Math.round(f / fs), fa = Math.abs(f - k * fs), sgn = f - k * fs < 0 ? -1 : 1;
      const v = QSim.view(cv, 0.5), fr = QSim.frame(v, { x0: 0, x1: T * 1000, y0: -1.25, y1: 1.25, xl: "t (ms)" }); fr.axes({ noGrid: true });
      fr.fn((t) => Math.sin(2 * Math.PI * f * t / 1000), c.ink3, 1.2, null, 1500);
      if (fa > 0 && f > fs / 2) fr.fn((t) => sgn * Math.sin(2 * Math.PI * fa * t / 1000), c.acc, 2, [5, 4], 600);
      const pts = []; for (let t = 0; t <= T; t += 1 / fs) { const y = q(Math.sin(2 * Math.PI * f * t)); pts.push([t * 1000, y]); }
      const g = v.g; g.strokeStyle = c.main; g.lineWidth = 1.5; g.beginPath(); pts.forEach(([t, y], i) => { if (i) g.lineTo(fr.X(t), fr.Y(pts[i - 1][1])); i ? g.lineTo(fr.X(t), fr.Y(y)) : g.moveTo(fr.X(t), fr.Y(y)); }); g.stroke();
      pts.forEach(([t, y]) => fr.dot(t, y, c.warn, 3));
      S.out(`신호 ${f} Hz, 표본화 ${fs} Hz (나이퀴스트 ${fs / 2} Hz), ${n}비트 (단계 ${L}개)\n${f <= fs / 2 ? "나이퀴스트 이하: 표본으로 원래 신호를 되살릴 수 있다" : `앨리어싱: 표본이 ${fa.toFixed(0)} Hz 신호(주황 점선)와 구별되지 않는다`}\n양자화 SNR ≈ 6.02n + 1.76 = ${(6.02 * n + 1.76).toFixed(1)} dB (빨간 점: 표본, 파랑: 표본을 계단으로 이은 것)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 5. 축차 비교 ADC (04-02) */
  (() => {
    const S = QSim.card("lab-p6-sar"); if (!S) return;
    const cv = S.$("canvas"); let k = 0;
    function steps() {
      const n = S.val("bits"), Vref = 4.096, Vin = S.val("vin"), lsb = Vref / 2 ** n; let code = 0; const st = [];
      for (let b = n - 1; b >= 0; b--) { const tr = code | (1 << b), vd = tr * lsb, keep = vd <= Vin; st.push({ b, tr, vd, keep }); if (keep) code = tr; }
      return { st, code, lsb, n, Vin };
    }
    function draw() {
      const c = C(), { st, code, lsb, n, Vin } = steps(); k = Math.min(k, st.length);
      const v = QSim.view(cv, 0.45), f = QSim.frame(v, { x0: 0, x1: n + 1, y0: 0, y1: 4.2, xl: "비교 단계", yl: "V" }); f.axes();
      f.path([[0, Vin], [n + 1, Vin]], c.warn, 2, [6, 4]);
      st.slice(0, k).forEach((s, i) => { f.dot(i + 1, s.vd, s.keep ? c.main : c.ink3, 5); f.text(s.keep ? "1" : "0", i + 1 - 0.1, s.vd + 0.15, s.keep ? c.main : c.ink3); });
      let cur = 0; st.slice(0, k).forEach((s) => { if (s.keep) cur = s.tr; });
      const bin = (x) => x.toString(2).padStart(n, "0");
      S.out(`${n}비트, 기준 4.096 V → LSB ${(lsb * 1000).toFixed(2)} mV, 입력 ${Vin.toFixed(3)} V (빨간 점선)\n${k}/${n}단계: 지금 코드 ${bin(cur)} = ${cur} → ${(cur * lsb).toFixed(4)} V${k > 0 ? `\n방금 시도: 비트 ${st[k - 1].b}를 1로 → ${st[k - 1].vd.toFixed(4)} V ${st[k - 1].keep ? "≤ 입력이라 유지" : "> 입력이라 0으로 되돌림"}` : ""}${k === n ? `\n최종: ${bin(code)} = ${code}, 양자화 오차 ${((Vin - code * lsb) * 1000).toFixed(2)} mV` : ""}`);
    }
    S.$(".step").addEventListener("click", () => { k++; draw(); });
    S.$(".reset").addEventListener("click", () => { k = 0; draw(); });
    S.on(() => { k = 0; draw(); }); QSim.redrawOn(draw); draw();
  })();
})();
