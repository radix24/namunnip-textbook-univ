/* 물리19 실습 카드 묶음: 편광자 사슬, Fabry-Perot 투과, 슬릿·격자 회절, Lorentz 분산 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const D2R = Math.PI / 180;

  /* 1. 편광자 사슬과 λ/4판 (02-01) */
  (() => {
    const S = QSim.card("lab-p19-polar"); if (!S) return;
    const cv = S.$("canvas");
    const mul = (M, v) => [M[0][0].mul(v[0]).add(M[0][1].mul(v[1])), M[1][0].mul(v[0]).add(M[1][1].mul(v[1]))];
    const Cx = (re, im = 0) => ({ re, im, mul(o) { return Cx(this.re * o.re - this.im * o.im, this.re * o.im + this.im * o.re); }, add(o) { return Cx(this.re + o.re, this.im + o.im); }, abs2() { return this.re * this.re + this.im * this.im; } });
    const pol = (a) => { const c = Math.cos(a), s = Math.sin(a); return [[Cx(c * c), Cx(c * s)], [Cx(c * s), Cx(s * s)]]; };
    const qwp = (a) => { const c = Math.cos(a), s = Math.sin(a); return [[Cx(c * c).add(Cx(0, s * s)), Cx(c * s).add(Cx(0, -c * s))], [Cx(c * s).add(Cx(0, -c * s)), Cx(s * s).add(Cx(0, c * c))]]; };
    function draw() {
      const c = C(), a1 = S.val("a1") * D2R, a2 = S.val("a2") * D2R, mid = S.val("mid");
      let E = [Cx(1), Cx(0)];   // 수평 선편광, 세기 1
      const steps = [["처음 (수평)", E]];
      if (mid === "pol") { E = mul(pol(a1), E); steps.push([`편광자 ${S.val("a1")}°`, E]); }
      if (mid === "qwp") { E = mul(qwp(a1), E); steps.push([`λ/4판 빠른 축 ${S.val("a1")}°`, E]); }
      E = mul(pol(a2), E); steps.push([`마지막 편광자 ${S.val("a2")}°`, E]);
      const v = QSim.view(cv, 0.36), W = v.W, H = v.H, g = v.g, n = steps.length, r = Math.min(H * 0.32, W / (2.6 * n));
      steps.forEach(([lab, e], i) => {
        const cx = W * (i + 0.5) / n, cy = H * 0.45;
        g.strokeStyle = c.rule; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke();
        g.strokeStyle = c.main; g.lineWidth = 2.5; g.beginPath();
        for (let k = 0; k <= 80; k++) { const t = 2 * Math.PI * k / 80, x = e[0].re * Math.cos(t) + e[0].im * Math.sin(t), y = e[1].re * Math.cos(t) + e[1].im * Math.sin(t); k ? g.lineTo(cx + r * x, cy - r * y) : g.moveTo(cx + r * x, cy - r * y); }
        g.stroke();
        g.fillStyle = c.ink2; g.font = "12px sans-serif"; g.textAlign = "center";
        g.fillText(lab, cx, H - 18); g.fillText(`세기 ${(e[0].abs2() + e[1].abs2()).toFixed(3)}`, cx, H - 4);
      });
      const I = E[0].abs2() + E[1].abs2();
      S.out(`나오는 세기 ${I.toFixed(3)} (처음 1)\n각 원 안의 파란 곡선: 그 단계에서 전기장 끝이 그리는 모양(선이면 선편광, 원이면 원편광)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. Fabry-Perot 투과 스펙트럼 (03-02) */
  (() => {
    const S = QSim.card("lab-p19-fp"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), R = S.val("R"), d = S.val("d") * 1e-3, sep = S.val("sep");
      const F = 4 * R / (1 - R) ** 2, fin = Math.PI * Math.sqrt(R) / (1 - R), fsr = 3e8 / (2 * d) / 1e9;
      const T = (nu) => 1 / (1 + F * Math.sin(Math.PI * nu / fsr) ** 2);   // nu: 기준 봉우리에서 잰 진동수 (GHz)
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: -0.6 * fsr, x1: 1.6 * fsr, y0: 0, y1: 1.1, xl: "Δν (GHz)", yl: "투과율" }); f.axes();
      f.fn(T, c.main, 2.2, null, 1500);
      f.fn((nu) => T(nu - sep), c.acc, 1.8, [5, 4], 1500);
      const w = fsr / fin, sum = (nu) => T(nu) + T(nu - sep), dip = sum(sep / 2), pk = Math.max(sum(0), sum(sep));
      S.out(`간격 ${S.val("d")} mm, 반사율 R = ${R}\nFSR = ${fsr.toFixed(2)} GHz, 날카로움 𝓕 = ${fin.toFixed(1)}, 봉우리 폭 ${(w * 1000).toFixed(1)} MHz, 최소 투과율 ${(1 / (1 + F)).toExponential(2)}\n두 번째 빛(주황 점선)과의 진동수 차 ${sep} GHz: 두 봉우리 사이 골이 봉우리의 ${(dip / pk * 100).toFixed(0)}% → ${Math.min(((sep % fsr) + fsr) % fsr, fsr - ((sep % fsr) + fsr) % fsr) < w ? "봉우리가 겹쳐 구별 안 됨 (차이가 FSR의 정수배에 가까움)" : dip / pk < 0.81 ? "구별됨" : "구별 어려움"}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 단일 슬릿, 이중 슬릿, 격자의 Fraunhofer 무늬 (04-01) */
  (() => {
    const S = QSim.card("lab-p19-slit"); if (!S) return;
    const cv = S.$("canvas"), lam = 633e-9;
    function draw() {
      const c = C(), a = S.val("a") * 1e-6, d = S.val("d") * 1e-6, N = +S.val("N");
      const I = (s) => { const b = Math.PI * a * s / lam, p = Math.PI * d * s / lam; const env = Math.abs(b) < 1e-9 ? 1 : (Math.sin(b) / b) ** 2; const arr = N === 1 ? 1 : Math.abs(Math.sin(p)) < 1e-9 ? 1 : (Math.sin(N * p) / (N * Math.sin(p))) ** 2; return env * arr; };
      const smax = Math.min(1, 3 * lam / a);
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: -smax, x1: smax, y0: 0, y1: 1.1, xl: "sin θ", yl: "I/I₀" }); f.axes();
      f.fn((s) => { const b = Math.PI * a * s / lam; return Math.abs(b) < 1e-9 ? 1 : (Math.sin(b) / b) ** 2; }, c.ink3, 1.2, [5, 4], 800);
      f.fn(I, c.main, 2, null, 3000);
      const first = lam / a, n0 = N > 1 ? Math.floor(d / a - 1e-9) : 0;
      S.out(`파장 633 nm, 슬릿 폭 ${S.val("a")} μm${N > 1 ? `, 간격 ${S.val("d")} μm, 슬릿 ${N}개` : ", 단일 슬릿"}\n단일 슬릿 봉투(회색 점선)의 첫 0: sin θ = λ/a = ${first.toFixed(4)}${N > 1 ? `\n주 극대 간격 sin θ = λ/d = ${(lam / d).toFixed(4)}, 봉투 가운데 무늬 안의 주 극대 ${2 * n0 + 1}개, 주 극대 사이 작은 봉우리 ${N - 2}개` : ""}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. Lorentz 진동자의 굴절률과 흡수 (05-01) */
  (() => {
    const S = QSim.card("lab-p19-lorentz"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), gam = S.val("g"), wp = S.val("wp"), w = S.val("w");
      const chi = (x) => { const re = 1 - x * x, im = gam * x, den = re * re + im * im; return [wp * wp * re / den, wp * wp * im / den]; };   // ω₀ = 1
      const nk = (x) => { const [a, b] = chi(x), e1 = 1 + a, e2 = b, m = Math.hypot(e1, e2); return [Math.sqrt((m + e1) / 2), Math.sqrt((m - e1) / 2)]; };
      let hi = 1.5; for (let i = 0; i <= 400; i++) { const [n, k] = nk(3 * i / 400); hi = Math.max(hi, n, k); }
      const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: 0, x1: 3, y0: 0, y1: Math.min(hi * 1.1, 6), xl: "ω / ω₀", yl: "n, κ" }); f.axes();
      f.path([[0, 1], [3, 1]], c.ink3, 1, [4, 4]);
      f.fn((x) => nk(x)[0], c.main, 2.5, null, 800); f.fn((x) => nk(x)[1], c.warn, 2, null, 800);
      const [n, k] = nk(w); f.dot(w, n, c.main, 5); f.dot(w, k, c.warn, 5);
      const dn = (nk(w + 1e-3)[0] - nk(w - 1e-3)[0]) / 2e-3;
      S.out(`ω₀ = 1로 맞춤, 감쇠 γ = ${gam}, 플라스마 진동수 ω_p = ${wp}\nω = ${w}: 굴절률 n = ${n.toFixed(3)} (파랑), 흡수 κ = ${k.toFixed(3)} (빨강)\ndn/dω = ${dn.toFixed(3)} → ${dn > 0 ? "정상 분산" : "이상 분산"}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
