/* 전전12 통신이론 탐구 카드 묶음
   1 Hilbert 변환과 포락선(01-02)  2 DSB와 SSB 스펙트럼(02-03)  3 FM의 Bessel 스펙트럼(04-01)
   4 Friis 잡음 지수(05-01)  5 PCM 양자화 잡음(06-01) */
(() => {
  "use strict";
  if (!window.QSim) return;
  const C = () => QSim.col();
  const f2 = (x, d = 3) => (Math.abs(x) < 5e-13 ? 0 : x).toFixed(d);
  const db = (x) => 10 * Math.log10(x);
  /* 1종 Bessel 함수: J_n(x) = (1/π)∫₀^π cos(nτ − x sin τ)dτ (심프슨) */
  const besselJ = (n, x) => { const N = 400, h = Math.PI / N; let s = 0; for (let i = 0; i <= N; i++) { const t = i * h, w = i === 0 || i === N ? 1 : i % 2 ? 4 : 2; s += w * Math.cos(n * t - x * Math.sin(t)); } return s * h / 3 / Math.PI; };

  /* 1. Hilbert 변환과 해석 신호의 포락선 */
  (() => {
    const S = QSim.card("exp-e12-hilbert"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), mu = S.val("mu"), fc = S.val("fc"), fm = 1;
      const m = (t) => 1 + mu * Math.cos(2 * Math.PI * fm * t);
      const x = (t) => m(t) * Math.cos(2 * Math.PI * fc * t);
      // m(t)의 대역(fm)이 반송파보다 낮으면 Hilbert 변환은 m(t)sin(2πfc t)
      const xh = (t) => m(t) * Math.sin(2 * Math.PI * fc * t);
      const env = (t) => Math.hypot(x(t), xh(t));
      const v = QSim.view(cv, 0.45), fr = QSim.frame(v, { x0: 0, x1: 2, y0: -2.2, y1: 2.2, xl: "t (s)" }); fr.axes();
      fr.fn(xh, c.acc, 1.2, [4, 3], 1500);
      fr.fn(x, c.main, 1.6, undefined, 1500);
      fr.fn(env, c.warn, 2.6, undefined, 400);
      const ok = fc > fm;
      S.out(`x(t) = (1 + ${f2(mu, 2)}cos 2πt)cos 2π·${fc}t (파랑), Hilbert 변환 x̂(t) (주황 점선), 해석 신호의 크기 |x + jx̂| (빨강)\n` +
        `포락선 = 1 + ${f2(mu, 2)}cos 2πt: 최대 ${f2(1 + mu, 2)}, 최소 ${f2(1 - mu, 2)}. ` +
        (mu > 1 ? "μ > 1이면 1 + μcos가 음수가 되는 구간이 있어 |x_a|는 포락선의 절댓값이 되고, 메시지와 달라집니다(과변조)." : ok ? "반송파 주파수가 메시지보다 높아 해석 신호의 크기가 정확히 메시지 모양의 포락선입니다." : ""));
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. DSB-SC, AM, SSB의 스펙트럼 */
  (() => {
    const S = QSim.card("exp-e12-ssb"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), mode = S.val("mode"), fc = 100, tones = [[1, 1], [3, 0.6], [4, 0.3]];   // kHz, 진폭
      const lines = [];   // [f, 진폭]
      if (mode === "am") lines.push([fc, 1]);
      tones.forEach(([f, a]) => {
        if (mode !== "lsb") lines.push([fc + f, a / 2]);
        if (mode !== "usb") lines.push([fc - f, a / 2]);
      });
      if (mode === "usb" || mode === "lsb") lines.forEach((l) => (l[1] *= 2));   // SSB: 같은 전력이 되게 한쪽 측파대를 2배로 그림
      const v = QSim.view(cv, 0.42), fr = QSim.frame(v, { x0: 94, x1: 106, y0: 0, y1: 1.2, xl: "f (kHz)", yl: "진폭" }); fr.axes();
      lines.forEach(([f, a]) => { fr.path([[f, 0], [f, a]], f === fc ? c.ink3 : c.main, 3); fr.dot(f, a, f === fc ? c.ink3 : c.main, 3); });
      const fs = lines.map((l) => l[0]), bw = Math.max(...fs) - Math.min(...fs);
      const names = { am: "AM(반송파 포함 DSB)", dsb: "DSB-SC", usb: "SSB 상측파대(USB)", lsb: "SSB 하측파대(LSB)" };
      S.out(`메시지: 1, 3, 4 kHz 세 음(대역 W = 4 kHz), 반송파 100 kHz. ${names[mode]}\n` +
        `점유 대역폭 ${f2(bw, 0)} kHz` + (mode === "am" || mode === "dsb" ? " = 2W (양쪽 측파대가 같은 정보를 담음)" : " = W (한쪽 측파대만 보냄)") +
        (mode === "am" ? `. 반송파(회색)는 정보 없이 전력만 차지합니다.` : ""));
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. FM 스펙트럼: Bessel 계수 */
  (() => {
    const S = QSim.card("exp-e12-fm"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), beta = S.val("beta"), fm = S.val("fm"), N = 16;
      const J = []; for (let n = 0; n <= N; n++) J.push(besselJ(n, beta));
      const v = QSim.view(cv, 0.45), fr = QSim.frame(v, { x0: -N - 0.5, x1: N + 0.5, y0: 0, y1: 1.05, xl: "(f − f_c)/f_m", yl: "|J_n(β)|" }); fr.axes();
      for (let n = -N; n <= N; n++) { const a = Math.abs(J[Math.abs(n)]); fr.path([[n, 0], [n, a]], n === 0 ? c.ink3 : c.main, 3); }
      const carson = 2 * (beta + 1);
      fr.path([[-carson / 2, 1.0], [carson / 2, 1.0]], c.acc, 2);
      let p = J[0] ** 2, k = 0; while (p < 0.98 && k < N) { k++; p += 2 * J[k] ** 2; }
      S.out(`β = Δf/f_m = ${f2(beta, 2)}, f_m = ${fm} kHz → 최대 주파수 편이 Δf = ${f2(beta * fm, 1)} kHz\n` +
        `반송파 성분 J₀ = ${f2(J[0], 4)}, J₁ = ${f2(J[1], 4)}, J₂ = ${f2(J[2], 4)}, J₃ = ${f2(J[3], 4)}. 전체 전력 J₀² + 2ΣJₙ² = ${f2(J[0] ** 2 + 2 * J.slice(1).reduce((s, x) => s + x * x, 0), 4)}\n` +
        `Carson 대역폭 2(β + 1)f_m = ${f2(carson * fm, 1)} kHz (주황 선 폭). 전력 98%를 담는 대역 ±${k}개 측파 → ${f2(2 * k * fm, 1)} kHz`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 연쇄 증폭기의 잡음 지수(Friis) */
  (() => {
    const S = QSim.card("exp-e12-friis"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), swap = S.val("swap");
      let st = [["LNA", S.val("g1"), S.val("n1")], ["혼합기", -6, 8], ["IF 증폭기", 30, 4]];
      if (swap) st = [st[1], st[0], st[2]];
      let F = 0, G = 1; const contrib = [];
      st.forEach(([nm, gdb, nf], i) => { const Fi = 10 ** (nf / 10), add = i === 0 ? Fi : (Fi - 1) / G; contrib.push([nm, add]); F += add; G *= 10 ** (gdb / 10); });
      const v = QSim.view(cv, 0.4), fr = QSim.frame(v, { x0: 0, x1: 3, y0: 0, y1: Math.max(2, F * 1.15), yl: "F에 더해지는 몫(선형)" }); fr.axes({ noGrid: true });
      const g = v.g;
      contrib.forEach(([nm, a], i) => { g.fillStyle = [c.main, c.acc, c.warn][i]; g.fillRect(fr.X(i + 0.2), fr.Y(a), fr.X(i + 0.8) - fr.X(i + 0.2), fr.Y(0) - fr.Y(a)); fr.text(nm, i + 0.5, -0.0 + Math.max(2, F * 1.15) * 0.02, c.ink2, "center"); });
      S.out(`순서: ${st.map((s) => `${s[0]}(G ${s[1]} dB, NF ${s[2]} dB)`).join(" → ")}\n` +
        `Friis: F = F₁ + (F₂ − 1)/G₁ + (F₃ − 1)/(G₁G₂) = ${contrib.map((x) => f2(x[1], 3)).join(" + ")} = ${f2(F, 3)} → 전체 잡음 지수 ${f2(db(F), 2)} dB, 전체 이득 ${f2(db(G), 1)} dB\n` +
        `첫 단의 잡음 지수가 거의 그대로 전체가 되고, 뒤 단의 잡음은 앞 단 이득으로 나뉘어 작아집니다.`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 5. PCM: 양자화 잡음과 비트 수 */
  (() => {
    const S = QSim.card("exp-e12-pcm"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), n = S.val("n"), fs = S.val("fs"), L = 2 ** n, D = 2 / L;   // 범위 −1~1
      const q = (x) => Math.max(-1 + D / 2, Math.min(1 - D / 2, (Math.floor(x / D) + 0.5) * D));
      // 진폭 1(최대)인 사인파를 고르게 많은 점으로 양자화해 SQNR 측정
      let ps = 0, pn = 0; const M = 20000;
      for (let i = 0; i < M; i++) { const x = 0.999 * Math.sin(2 * Math.PI * (i + 0.37) / M); ps += x * x; pn += (x - q(x)) ** 2; }
      const sqnr = db(ps / pn);
      const v = QSim.view(cv, 0.45), fr = QSim.frame(v, { x0: 0, x1: 1, y0: -1.1, y1: 1.1, xl: "t (주기)" }); fr.axes();
      fr.fn((t) => Math.sin(2 * Math.PI * t), c.ink3, 1.2);
      const pts = []; for (let i = 0; i <= 400; i++) { const t = i / 400; pts.push([t, q(0.999 * Math.sin(2 * Math.PI * t))]); }
      fr.path(pts, c.main, 2);
      S.out(`${n}비트(${L}단계), 표본화 ${fs} kHz → 비트율 ${f2(n * fs, 0)} kbps\n` +
        `최대 진폭 사인파의 측정 SQNR ${f2(sqnr, 2)} dB, 공식 6.02n + 1.76 = ${f2(6.02 * n + 1.76, 2)} dB. 파랑: 양자화한 값, 회색: 원래 사인파`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
