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

})();
