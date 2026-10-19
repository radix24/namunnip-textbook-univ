/* 물리6 실습 카드 묶음: 논리 간소화, PLL, 표본화와 양자화 */
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

  /* 2. PLL 고정 과정 (03-02) */
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

  /* 3. 표본화와 양자화 (04-01) */
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

})();
