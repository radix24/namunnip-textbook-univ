/* 공통6 실습 카드 묶음: 반응 속도, 화학 평형, 적정 곡선, 방사성 붕괴, 결정장 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const Rg = 8.314;
  const SUB = "₀₁₂₃₄₅₆₇₈₉";
  const sub = (s) => s.replace(/([A-Za-z)])(\d+)/g, (_, a, n) => a + n.split("").map((d) => SUB[+d]).join(""));
  const sci = (x, d = 2) => { if (x === 0) return "0"; const e = Math.floor(Math.log10(Math.abs(x))); return e >= -2 && e < 4 ? x.toFixed(Math.max(0, d - e)) : (x / 10 ** e).toFixed(d) + "×10^" + e; };

  /* 1. 반응 차수와 아레니우스 (02-02, 02-03) */
  (() => {
    const S = QSim.card("lab-c6-kinetics"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), n = +S.val("ord"), A0 = S.val("A0"), k0 = S.val("k"), T = S.val("T"), Ea = S.val("Ea") * 1000;
      const k = k0 * Math.exp(-Ea / Rg * (1 / T - 1 / 298));
      const half = n === 0 ? A0 / (2 * k) : n === 1 ? Math.LN2 / k : 1 / (k * A0);
      const A = (t) => n === 0 ? Math.max(0, A0 - k * t) : n === 1 ? A0 * Math.exp(-k * t) : A0 / (1 + k * A0 * t);
      const mode = S.val("plot"), tmax = 4 * (n === 0 ? A0 / k / 4 * 1.2 : half);
      const Y = mode === "A" ? A : mode === "ln" ? (t) => Math.log(A(t)) : (t) => 1 / A(t);
      const ys = []; for (let i = 0; i <= 200; i++) { const y = Y(tmax * i / 200); if (isFinite(y)) ys.push(y); }
      let y0 = Math.min(...ys), y1 = Math.max(...ys); if (mode === "A") y0 = 0; const pad = (y1 - y0) * 0.08 || 1;
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: tmax, y0: y0 - (mode === "A" ? 0 : pad), y1: y1 + pad, xl: "t (s)", yl: { A: "[A] (M)", ln: "ln[A]", inv: "1/[A] (1/M)" }[mode] }); f.axes();
      f.fn(Y, c.main, 2.5);
      for (let j = 1; j <= 3 && n !== 0; j++) { const t = half * (n === 1 ? j : (2 ** j - 1)); if (t < tmax && isFinite(Y(t))) f.dot(t, Y(t), c.acc, 4); }
      const straight = { 0: "A", 1: "ln", 2: "inv" }[n];
      const unit = n === 0 ? "M/s" : n === 1 ? "1/s" : "1/(M·s)";
      S.out(`${n}차 반응, k(${T} K) = ${sci(k, 3)} ${unit}  (298 K에서 ${sci(k0, 3)}, Ea = ${S.val("Ea")} kJ/mol)\n첫 반감기 ${sci(half, 3)} s${n === 1 ? " (농도와 무관, 주황 점 간격이 일정)" : n === 2 ? " (농도가 줄수록 길어짐)" : " (농도가 줄수록 짧아짐)"}\n${mode === straight ? "이 그래프가 직선: 기울기로 k를 구할 수 있다" : "이 그래프는 직선이 아니다. " + { A: "[A]", ln: "ln[A]", inv: "1/[A]" }[straight] + " 그래프를 골라 보세요"}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. N2O4 ⇌ 2NO2 평형과 르샤틀리에 (03-03) */
  (() => {
    const S = QSim.card("lab-c6-equil"); if (!S) return;
    const cv = S.$("canvas");
    const K298 = 4.6e-3, dH = 57200, kf = 0.8;
    let x = 0.04, y = 0, t = 0, hist = [], msg = "";
    const K = () => K298 * Math.exp(-dH / Rg * (1 / S.val("T") - 1 / 298));
    const f = (_, s) => { const r = kf * s[0] - kf / K() * s[1] * s[1]; return [-r, 2 * r]; };
    function step(dt) {
      for (let i = 0; i < 4; i++) { [x, y] = QSim.rk4(f, t, [x, y], dt / 4); t += dt / 4; }
      hist.push([t, x, y]); while (hist.length && hist[0][0] < t - 20) hist.shift();
      draw();
    }
    function draw() {
      const c = C(), v = QSim.view(cv, 0.5), Kc = K(), Q = x > 0 ? y * y / x : Infinity;
      const top = Math.max(0.05, ...hist.map((h) => Math.max(h[1], h[2]))) * 1.15, t0 = Math.max(0, t - 20);
      const fr = QSim.frame(v, { x0: t0, x1: t0 + 20, y0: 0, y1: top, xl: "t", yl: "농도 (M)" }); fr.axes();
      fr.path(hist.map((h) => [h[0], h[1]]), c.main, 2.5); fr.path(hist.map((h) => [h[0], h[2]]), "#b5562a", 2.5);
      const g = v.g, sw = Math.min(70, v.W * 0.14), a = Math.min(1, y / 0.06);
      g.fillStyle = `rgba(160,70,30,${a.toFixed(3)})`; g.fillRect(v.W - sw - 10, 10, sw, sw); g.strokeStyle = c.ink3; g.strokeRect(v.W - sw - 10, 10, sw, sw);
      fr.text("N₂O₄", t0 + 0.5, top * 0.92, c.main); fr.text("NO₂", t0 + 4, top * 0.92, "#b5562a");
      const dir = Math.abs(Q - Kc) / Kc < 0.02 ? "평형 (Q ≈ K)" : Q < Kc ? "Q < K → 정반응 쪽(NO₂ 생성)으로 이동" : "Q > K → 역반응 쪽(N₂O₄ 생성)으로 이동";
      S.out(`${S.val("T")} K에서 Kc = ${sci(Kc, 3)} (정반응 흡열, ΔH = +57.2 kJ)\n[N₂O₄] = ${x.toFixed(4)} M, [NO₂] = ${y.toFixed(4)} M, Q = ${isFinite(Q) ? sci(Q, 3) : "∞"}\n${dir}${msg ? "\n" + msg : ""}`);
    }
    const L = QSim.loop(step).watch(S.root);
    QSim.playButton(S.$(".play"), L);
    const act = (fn, m) => () => { fn(); msg = m; hist.push([t, x, y]); draw(); if (!L.running) { L.start(); S.$(".play").textContent = "멈춤"; } };
    S.$(".add2").addEventListener("click", act(() => { y += 0.02; }, "NO₂ 0.02 M 추가: Q가 커진다"));
    S.$(".add1").addEventListener("click", act(() => { x += 0.02; }, "N₂O₄ 0.02 M 추가: Q가 작아진다"));
    S.$(".comp").addEventListener("click", act(() => { x *= 2; y *= 2; }, "부피 절반: 두 농도가 두 배, Q도 두 배 → 기체 몰수가 적은 쪽으로"));
    S.$(".reset").addEventListener("click", () => { x = 0.04; y = 0; t = 0; hist = []; msg = ""; draw(); });
    S.on(() => { msg = "온도 변경: K가 바뀌었다"; draw(); }); QSim.redrawOn(draw); draw();
  })();

  /* 3. 산-염기 적정 곡선과 지시약 (05-02) */
  (() => {
    const S = QSim.card("lab-c6-titration"); if (!S) return;
    const cv = S.$("canvas");
    const KA = { hcl: [1e8, "HCl (강산)"], hf: [6.8e-4, "HF"], ac: [1.8e-5, "CH3COOH"], hcn: [6.2e-10, "HCN"] };
    const IND = { pp: [8.2, 10.0, "페놀프탈레인", [255, 255, 255], [220, 60, 160]], mo: [3.1, 4.4, "메틸 오렌지", [220, 50, 40], [240, 200, 40]], bb: [6.0, 7.6, "브로모티몰 블루", [230, 210, 40], [40, 90, 200]] };
    const Va = 25.0, Kw = 1e-14;
    const pH = (Ka, Ca, Cb, Vb) => {
      const V = Va + Vb, CT = Ca * Va / V, Na = Cb * Vb / V;
      const F = (h) => h + Na - Kw / h - CT * Ka / (Ka + h);
      let lo = -14.5, hi = 1; for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (F(10 ** m) > 0) hi = m; else lo = m; }
      return -(lo + hi) / 2;
    };
    function draw() {
      const c = C(), [Ka, an] = KA[S.val("acid")], Ca = S.val("ca"), Cb = S.val("cb"), vb = S.val("vb"), ind = IND[S.val("ind")];
      const Veq = Ca * Va / Cb, vmax = Math.max(50, Veq * 2);
      const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: 0, x1: vmax, y0: 0, y1: 14, xl: "NaOH (mL)", yl: "pH" }); f.axes();
      const g = v.g; g.fillStyle = `rgba(${ind[4].join(",")},0.18)`; g.fillRect(f.X(0), f.Y(ind[1]), f.X(vmax) - f.X(0), f.Y(ind[0]) - f.Y(ind[1]));
      f.fn((u) => pH(Ka, Ca, Cb, u), c.main, 2.5, null, 300);
      f.path([[Veq, 0], [Veq, 14]], c.ink3, 1, [4, 4]);
      const p = pH(Ka, Ca, Cb, vb); f.dot(vb, p, c.warn, 6);
      const s = Math.min(1, Math.max(0, (p - ind[0]) / (ind[1] - ind[0]))), rgb = ind[3].map((q, i) => Math.round(q + (ind[4][i] - q) * s));
      const sw = Math.min(60, v.W * 0.12); g.fillStyle = `rgb(${rgb.join(",")})`; g.fillRect(f.X(0) + 8, 10, sw, sw * 0.8); g.strokeStyle = c.ink3; g.strokeRect(f.X(0) + 8, 10, sw, sw * 0.8);
      const peq = pH(Ka, Ca, Cb, Veq), weak = Ka < 1;
      const ok = peq >= ind[0] - 1 && peq <= ind[1] + 1 ? "변색 범위가 당량점의 급변 구간 안에 있어 쓸 만하다" : "변색 범위가 당량점과 떨어져 있어 오차가 크다";
      S.out(`${sub(an)} ${Ca.toFixed(3)} M 25.0 mL + NaOH ${Cb.toFixed(3)} M ${vb.toFixed(2)} mL → pH ${p.toFixed(2)}\n당량점 ${Veq.toFixed(2)} mL, pH ${peq.toFixed(2)}${weak ? ", 반당량점 pH = pKa = " + (-Math.log10(Ka)).toFixed(2) : ""}\n${ind[2]} (${ind[0]}~${ind[1]}): ${ok}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 5. 방사성 붕괴 (08-01) */
  (() => {
    const S = QSim.card("lab-c6-decay"); if (!S) return;
    const [cvA, cvN] = S.$$("canvas");
    const N0 = 400; let alive, t, hist;
    const reset = () => { alive = Array(N0).fill(true); t = 0; hist = [[0, N0]]; draw(); };
    function step(dt) {
      const h = S.val("half"), dtt = dt * 2, p = 1 - Math.pow(0.5, dtt / h);
      alive.forEach((a, i) => { if (a && Math.random() < p) alive[i] = false; });
      t += dtt; const n = alive.filter(Boolean).length; hist.push([t, n]);
      draw(); return t < 6 * h && n > 0;
    }
    function draw() {
      const c = C(), h = S.val("half"), n = alive.filter(Boolean).length;
      const va = QSim.view(cvA, 0.25), g = va.g, cols = 40, cw = va.W / cols, ch = va.H / 10;
      alive.forEach((a, i) => { g.fillStyle = a ? c.main : c.rule; g.beginPath(); g.arc((i % cols + 0.5) * cw, (Math.floor(i / cols) + 0.5) * ch, Math.min(cw, ch) * 0.35, 0, 7); g.fill(); });
      const vn = QSim.view(cvN, 0.45), f = QSim.frame(vn, { x0: 0, x1: 6 * h, y0: 0, y1: N0 * 1.05, xl: "t", yl: "남은 핵" }); f.axes();
      f.fn((u) => N0 * Math.pow(0.5, u / h), c.warn, 2, [5, 4]);
      f.path(hist, c.main, 2.5);
      for (let j = 1; j <= 5; j++) f.dot(j * h, N0 / 2 ** j, c.acc, 3.5);
      S.out(`반감기 ${h} (시간 단위), 지난 시간 ${t.toFixed(1)} = 반감기 ${(t / h).toFixed(2)}번\n남은 핵 ${n} / ${N0}, 이론값 N₀(1/2)^(t/t½) = ${(N0 * Math.pow(0.5, t / h)).toFixed(1)}\n파란 선: 이번 시행, 빨간 점선: 이론 곡선`);
    }
    const L = QSim.loop(step).watch(S.root);
    QSim.playButton(S.$(".play"), L, () => { if (t >= 6 * S.val("half") || !alive.some(Boolean)) reset(); });
    S.$(".reset").addEventListener("click", () => { L.stop(); S.$(".play").textContent = "재생"; reset(); });
    S.on(reset); QSim.redrawOn(draw); reset();
  })();

  /* 6. 결정장 분리와 색 (09-02, 09-03) */
  (() => {
    const S = QSim.card("lab-c6-crystal"); if (!S) return;
    const cv = S.$("canvas");
    const BAND = [[400, "보라", "연두"], [430, "파랑", "주황"], [480, "청록", "빨강"], [500, "초록", "보라(자주)"], [560, "연두", "보라"], [580, "주황", "파랑"], [620, "빨강", "청록"]];
    const wl2rgb = (w) => {
      let r = 0, g = 0, b = 0;
      if (w < 440) { r = (440 - w) / 60; b = 1; } else if (w < 490) { g = (w - 440) / 50; b = 1; } else if (w < 510) { g = 1; b = (510 - w) / 20; }
      else if (w < 580) { r = (w - 510) / 70; g = 1; } else if (w < 645) { r = 1; g = (645 - w) / 65; } else r = 1;
      return [r, g, b].map((q) => Math.round(255 * Math.max(0, Math.min(1, q))));
    };
    function fill(d, low) {
      const o = [0, 0, 0, 0, 0]; let k = d;
      const put = (idx) => { for (const i of idx) { if (k && o[i] < 2) { o[i]++; k--; } } };
      if (low) { while (k && o.slice(0, 3).some((q) => q < 2)) put([0, 1, 2]); while (k) put([3, 4]); }
      else { put([0, 1, 2, 3, 4]); while (k) put([0, 1, 2, 3, 4]); }
      return o;
    }
    function draw() {
      const c = C(), d = S.val("d"), D = S.val("D"), P = S.val("P"), low = D > P, o = fill(d, low);
      const v = QSim.view(cv, 0.5), g = v.g, bx = Math.min(34, v.W / 14), cx = v.W * 0.3;
      const yb = v.H * 0.5, gapPx = (D / 400) * v.H * 0.36, yT = yb + gapPx * 0.4, yE = yb - gapPx * 0.6;
      const box = (x, y, n) => {
        g.strokeStyle = n ? c.main : c.rule; g.lineWidth = 1.5; g.strokeRect(x, y, bx, bx); g.strokeStyle = c.ink; g.lineWidth = 2;
        if (n >= 1) { g.beginPath(); g.moveTo(x + bx * 0.35, y + bx * 0.85); g.lineTo(x + bx * 0.35, y + bx * 0.15); g.lineTo(x + bx * 0.22, y + bx * 0.32); g.stroke(); }
        if (n >= 2) { g.beginPath(); g.moveTo(x + bx * 0.65, y + bx * 0.15); g.lineTo(x + bx * 0.65, y + bx * 0.85); g.lineTo(x + bx * 0.78, y + bx * 0.68); g.stroke(); }
      };
      [0, 1, 2].forEach((i) => box(cx - 1.5 * bx - 3 + i * (bx + 3), yT, o[i]));
      [3, 4].forEach((i, j) => box(cx - bx - 1.5 + j * (bx + 3), yE - bx, o[i]));
      g.font = "12px " + getComputedStyle(document.documentElement).getPropertyValue("--f-mono"); g.fillStyle = c.ink2;
      g.fillText("t2g", cx + 1.6 * bx + 6, yT + bx * 0.65); g.fillText("eg", cx + 1.1 * bx + 6, yE - bx * 0.35);
      const ax = cx - 2 * bx - 18; g.strokeStyle = c.acc; g.lineWidth = 1.5; g.beginPath(); g.moveTo(ax, yT); g.lineTo(ax, yE); g.stroke(); g.fillStyle = c.acc; g.fillText("Δo", ax - 22, (yT + yE) / 2 + 4);
      const lam = 119627 / D, sw = Math.min(70, v.W * 0.14), sx = v.W * 0.62;
      const none = d === 0 || d === 10;
      const arg = wl2rgb(lam), obs = arg.map((q) => 255 - Math.round(q * 0.75));
      g.fillStyle = c.ink2; g.fillText("흡수", sx, 24); g.fillText("보이는 색", sx + sw + 12, 24);
      g.fillStyle = none || lam > 750 || lam < 380 ? c.card : `rgb(${arg.join(",")})`; g.fillRect(sx, 30, sw, sw); g.strokeStyle = c.ink3; g.strokeRect(sx, 30, sw, sw);
      g.fillStyle = none ? "#ffffff" : lam > 750 || lam < 380 ? "#ffffff" : `rgb(${obs.join(",")})`; g.fillRect(sx + sw + 12, 30, sw, sw); g.strokeRect(sx + sw + 12, 30, sw, sw);
      const unp = o.filter((q) => q === 1).length, nt = o[0] + o[1] + o[2], ne = o[3] + o[4];
      const cfse = (-0.4 * nt + 0.6 * ne) * D;
      let band = BAND[0]; BAND.forEach((b) => { if (lam >= b[0]) band = b; });
      const col = none ? "d-d 전이가 없어 무색" : lam > 750 ? "적외선 쪽을 흡수, 거의 무색" : lam < 380 ? "자외선 쪽을 흡수, 거의 무색" : `${band[1]} 빛을 흡수 → 보이는 색: ${band[2]}`;
      const spin = d >= 4 && d <= 7 ? (low ? "저스핀 (Δo > P)" : "고스핀 (Δo < P)") : "고스핀·저스핀 구분 없음";
      S.out(`d${d}, Δo = ${D} kJ/mol, 짝짓기 에너지 P = ${P} kJ/mol → ${spin}\nt2g${nt} eg${ne}, 홀전자 ${unp}개 (${unp ? "상자성" : "반자성"}), 결정장 안정화 에너지 ${cfse.toFixed(0)} kJ/mol (짝짓기 제외)\n흡수 파장 λ = hcN_A/Δo ≈ ${lam.toFixed(0)} nm: ${col}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
