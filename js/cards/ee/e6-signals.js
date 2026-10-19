/* 전전6 신호및시스템 탐구 카드 묶음
   1 시간 이동·반전·척도(01-01)  2 차분 방정식의 임펄스 응답과 특성근(02-03)
   3 Fourier 급수 부분합과 Gibbs(03-01)  4 사각파가 RC 저역 통과를 지나면(03-02)
   5 시간 폭과 주파수 폭(04-01)  6 AM 파형과 스펙트럼(04-03)  7 DTFT 주기성(05-01)  8 DFT와 영 채우기(05-02)
   9 s평면 극점과 임펄스 응답(07-01)  10 z평면 극점·영점과 주파수 응답(07-02)
   11 Butterworth 차수와 군지연(08-01)  12 창 함수와 누설(08-02) */
(() => {
  "use strict";
  if (!window.QSim) return;
  const C = () => QSim.col();
  const f2 = (x, d = 3) => (Math.abs(x) < 5e-13 ? 0 : x).toFixed(d);

  /* 막대(줄기) 그림: 정수 위치 n에 값 y */
  function stems(fr, g, pts, color) {
    g.save(); g.strokeStyle = color; g.lineWidth = 1.5;
    pts.forEach(([n, y]) => { g.beginPath(); g.moveTo(fr.X(n), fr.Y(0)); g.lineTo(fr.X(n), fr.Y(y)); g.stroke(); fr.dot(n, y, color, 3.5); });
    g.restore();
  }

  /* 1. 시간 이동, 반전, 척도 변환 */
  (() => {
    const S = QSim.card("exp-e6-shift"); if (!S) return;
    const [cvX, cvY] = S.$$("canvas");
    const shapes = {
      ramp: { f: (t) => (t >= 0 && t <= 2 ? t : 0), pts: [0, 2], name: "경사(0~2에서 x = t)" },
      stair: { f: (t) => (t >= 0 && t < 1 ? 1 : t >= 1 && t < 2 ? 0.5 : 0), pts: [0, 1, 2], name: "계단 두 칸(0~1에서 1, 1~2에서 0.5)" },
      exp: { f: (t) => (t >= 0 ? Math.exp(-t) : 0), pts: [0], name: "지수 e^(−t)u(t)" },
    };
    function draw() {
      const c = C(), sh = shapes[S.val("x")], a = S.val("a"), b = S.val("b");
      const box = { x0: -5, x1: 5, y0: -0.2, y1: 2.3 };
      const vx = QSim.view(cvX, 0.3), fx = QSim.frame(vx, { ...box, xl: "τ", yl: "x" }); fx.axes({ noGrid: true });
      fx.fn(sh.f, c.main, 2.5, undefined, 1200);
      sh.pts.forEach((p) => fx.text(`τ=${p}`, p, sh.f(p + 1e-9) + 0.15, c.main, "center"));
      const vy = QSim.view(cvY, 0.3), fy = QSim.frame(vy, { ...box, xl: "t", yl: "y" }); fy.axes({ noGrid: true });
      if (a === 0) { fy.fn(() => sh.f(b), c.acc, 2.5); S.out(`a = 0이면 y(t) = x(${b})로 상수입니다. 시간 변환이 아닙니다.`); return; }
      fy.fn((t) => sh.f(a * t + b), c.acc, 2.5, undefined, 1200);
      const map = sh.pts.map((p) => { const t = (p - b) / a; fy.dot(t, sh.f(p + 1e-9 * Math.sign(a)), c.warn, 4); return `τ = ${p} → t = (${p} − (${b}))/(${a}) = ${f2(t, 2)}`; });
      const desc = [];
      if (a < 0) desc.push("반전");
      if (Math.abs(a) > 1) desc.push(`${Math.abs(a)}배 압축`); else if (Math.abs(a) < 1) desc.push(`${f2(1 / Math.abs(a), 2)}배 늘이기`);
      const sft = -b / a; if (sft) desc.push(`${sft > 0 ? "오른쪽" : "왼쪽"}으로 ${f2(Math.abs(sft), 2)} 이동(최종 위치 기준)`);
      S.out(`y(t) = x(${a}t ${b >= 0 ? "+" : "−"} ${Math.abs(b)}) = x(${a}(t ${sft >= 0 ? "−" : "+"} ${f2(Math.abs(sft), 2)})), 입력: ${sh.name}\n` +
        `특징점 옮기기: ${map.join(", ")}\n` +
        `한 줄로: ${desc.join(", ") || "변화 없음"}. 위 x의 특징점(파랑 글씨)이 아래 y의 주황 점으로 옮겨 갑니다.`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* Fourier 계수 (주기 2π, ω0 = 1): 사각파(듀티 d), 톱니파, 삼각파 */
  const waves = {
    square: (d) => ({ x: (t) => { const u = ((t % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI; return Math.abs(u) < d * Math.PI ? 1 : 0; }, a: (k) => (k === 0 ? [d, 0] : [Math.sin(k * Math.PI * d) / (k * Math.PI), 0]), P: d, jump: 1, name: `사각파(듀티 ${Math.round(d * 100)}%)` }),
    saw: () => ({ x: (t) => (((t % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI) / Math.PI, a: (k) => (k === 0 ? [0, 0] : [0, (k % 2 ? -1 : 1) / (k * Math.PI)]), P: 1 / 3, jump: 2, name: "톱니파(−1~1)" }),
    tri: () => ({ x: (t) => { const u = ((t % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI; return 1 - 2 * Math.abs(u) / Math.PI; }, a: (k) => (k % 2 ? [4 / (Math.PI * Math.PI * k * k), 0] : [0, 0]), P: 1 / 3, jump: 0, name: "삼각파(−1~1)" }),
  };
  const partial = (W, N) => { const A = []; for (let k = 1; k <= N; k++) A.push([k, W.a(k)]); const a0 = W.a(0)[0]; return (t) => A.reduce((s, [k, [re, im]]) => s + 2 * (re * Math.cos(k * t) - im * Math.sin(k * t)), a0); };

  /* 3. Fourier 급수 부분합 */
  (() => {
    const S = QSim.card("exp-e6-fs"); if (!S) return;
    const [cvT, cvK] = S.$$("canvas");
    function draw() {
      const c = C(), N = S.val("n"), kind = S.val("w"), W = waves[kind](S.val("d") / 100);
      const xs = partial(W, N);
      const vt = QSim.view(cvT, 0.42), ft = QSim.frame(vt, { x0: -2 * Math.PI, x1: 2 * Math.PI, y0: -1.4, y1: 1.4, xl: "t (주기 2π)", yl: "" }); ft.axes({ noGrid: true });
      ft.fn(W.x, c.ink3, 1.5, [5, 3], 1600); ft.fn(xs, c.main, 2.2, undefined, 1600);
      const vk = QSim.view(cvK, 0.3), K = 15, fk = QSim.frame(vk, { x0: -K - 0.5, x1: K + 0.5, y0: 0, y1: Math.max(0.55, Math.hypot(...W.a(0)) * 1.1), xl: "k", yl: "|a_k|" }); fk.axes({ noGrid: true });
      const pts = []; for (let k = -K; k <= K; k++) { const [re, im] = W.a(Math.abs(k)); pts.push([k, Math.hypot(re, im)]); }
      stems(fk, vk.g, pts.filter(([k]) => Math.abs(k) <= N), c.main); stems(fk, vk.g, pts.filter(([k]) => Math.abs(k) > N), c.rule);
      // 부분합의 최댓값(넘침)과 포함된 전력
      let mx = -9; for (let i = 0; i <= 4000; i++) { const t = -Math.PI + 2 * Math.PI * i / 4000; mx = Math.max(mx, xs(t)); }
      let Pin = W.a(0)[0] ** 2; for (let k = 1; k <= N; k++) { const [re, im] = W.a(k); Pin += 2 * (re * re + im * im); }
      const a = [0, 1, 2, 3].map((k) => { const [re, im] = W.a(k); return im ? `${f2(im)}j` : f2(re); });
      S.out(`${W.name}, 항 |k| ≤ ${N}. a₀ = ${a[0]}, a₁ = ${a[1]}, a₂ = ${a[2]}, a₃ = ${a[3]}\n` +
        `부분합의 최댓값 ${f2(mx)}` + (W.jump ? ` (원래 최댓값 1, 넘침 ${f2(mx - 1)} = 뛰는 크기 ${W.jump}의 ${f2((mx - 1) / W.jump * 100, 1)}%)` : " (불연속이 없어 넘침이 거의 없음)") + `\n` +
        `평균 전력 ${f2(W.P)} 중 부분합에 담긴 몫 ${f2(Pin)} (${f2(Pin / W.P * 100, 1)}%, Parseval)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 5. 시간 폭과 주파수 폭 (04-01) */
  (() => {
    const S = QSim.card("exp-e6-ftpair"); if (!S) return;
    const [cvT, cvF] = S.$$("canvas");
    function draw() {
      const c = C(), kind = S.val("x"), p = S.val("p");
      let x, X, info;
      if (kind === "rect") {
        x = (t) => (Math.abs(t) < p ? 1 : 0); X = (w) => (Math.abs(w) < 1e-9 ? 2 * p : 2 * Math.sin(w * p) / w);
        info = `직사각 펄스 폭 2T₁ = ${f2(2 * p, 2)} s. X(0) = 2T₁ = ${f2(2 * p)}, 첫 영점 ω = π/T₁ = ${f2(Math.PI / p)} rad/s\n시간 폭 × 첫 영점 = 2T₁ · π/T₁ = 2π ≈ 6.283 (T₁과 무관)`;
      } else if (kind === "exp") {
        const a = 1 / p; x = (t) => (t >= 0 ? Math.exp(-a * t) : 0); X = (w) => 1 / Math.hypot(a, w);
        info = `지수 e^(−at)u(t), a = ${f2(a)} (시정수 ${f2(p, 2)} s). |X(0)| = 1/a = ${f2(1 / a)}, 크기가 1/√2배인 ω = a = ${f2(a)} rad/s\n시정수 × 반전력 주파수 = 1 (a와 무관). 위상은 ω = a에서 −45°`;
      } else {
        x = (t) => Math.exp(-t * t / (2 * p * p)); X = (w) => p * Math.sqrt(2 * Math.PI) * Math.exp(-p * p * w * w / 2);
        info = `가우스 e^(−t²/2σ²), σ = ${f2(p, 2)} s. X(0) = σ√(2π) = ${f2(p * Math.sqrt(2 * Math.PI))}, 스펙트럼도 가우스이고 폭은 1/σ = ${f2(1 / p)} rad/s\n시간 폭 σ × 주파수 폭 1/σ = 1. 가우스는 이 곱이 가장 작은 모양입니다.`;
      }
      const vt = QSim.view(cvT, 0.3), ft = QSim.frame(vt, { x0: -4, x1: 4, y0: -0.15, y1: 1.2, xl: "t (s)", yl: "x" }); ft.axes({ noGrid: true });
      ft.fn(x, c.main, 2.5, undefined, 1600);
      const top = Math.max(1.1, 2 * 2 * 1.05), vf = QSim.view(cvF, 0.36), ff = QSim.frame(vf, { x0: -20, x1: 20, y0: kind === "rect" ? -0.3 * top : -0.05 * top, y1: top, xl: "ω (rad/s)", yl: kind === "rect" ? "X" : "|X|" }); ff.axes({ noGrid: true });
      ff.fn(X, c.acc, 2.5, undefined, 1600);
      S.out(info + `\n아래 그래프의 세로축은 고정(0~4.2)이라 폭을 넓히면 봉우리가 높고 좁아집니다.`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 6. 진폭 변조의 파형과 스펙트럼 (04-03) */
  (() => {
    const S = QSim.card("exp-e6-am"); if (!S) return;
    const [cvT, cvF] = S.$$("canvas");
    function draw() {
      const c = C(), dsb = S.val("mode") === "dsb", mu = S.val("mu"), fm = S.val("fm"), fc = 20, Ac = 1;
      const m = (t) => Math.cos(2 * Math.PI * fm * t);
      const y = dsb ? (t) => Ac * m(t) * Math.cos(2 * Math.PI * fc * t) : (t) => Ac * (1 + mu * m(t)) * Math.cos(2 * Math.PI * fc * t);
      const env = dsb ? (t) => Ac * m(t) : (t) => Ac * (1 + mu * m(t));
      const Y = Math.max(2.6, dsb ? 1.3 : (1 + mu) * 1.15), vt = QSim.view(cvT, 0.38), ft = QSim.frame(vt, { x0: 0, x1: 1, y0: -Y, y1: Y, xl: "t (ms)", yl: "" }); ft.axes({ noGrid: true });
      ft.fn(y, c.main, 1.2, undefined, 2400); ft.fn(env, c.acc, 2, [6, 3], 400); ft.fn((t) => -env(t), c.acc, 1, [2, 3], 400);
      const vf = QSim.view(cvF, 0.3), ff = QSim.frame(vf, { x0: -30, x1: 30, y0: 0, y1: 1.15, xl: "f (kHz)", yl: "크기" }); ff.axes({ noGrid: true });
      const lines = [];
      [fc, -fc].forEach((f0) => { if (!dsb) lines.push([f0, Ac / 2]); lines.push([f0 - fm, (dsb ? 1 : mu) * Ac / 4]); lines.push([f0 + fm, (dsb ? 1 : mu) * Ac / 4]); });
      stems(ff, vf.g, lines, c.main);
      const minEnv = dsb ? -1 : 1 - mu;
      const Pc = dsb ? 0 : Ac * Ac / 2, Ps = (dsb ? 1 : mu * mu) * Ac * Ac / 4;
      S.out(`${dsb ? "DSB-SC: y = m(t)cos(2πf_c t)" : `일반 AM: y = [1 + ${mu}·m(t)]cos(2πf_c t)`}, f_c = ${fc} kHz, 메시지 ${fm} kHz 코사인\n` +
        `스펙트럼(양쪽 표시, 지수 성분의 크기): ${dsb ? "" : `반송파 ±${fc} kHz에 ${f2(Ac / 2, 2)}, `}측파대 ${fc - fm}·${fc + fm} kHz에 각 ${f2((dsb ? 1 : mu) * Ac / 4)}. 대역폭 ${2 * fm} kHz, 메시지 주파수 ${fm} kHz 자체에는 성분이 없음\n` +
        (dsb ? `포락선(주황 점선)이 음수로 내려가 부호가 바뀌므로 포락선 검파로는 m을 되살릴 수 없고 동기 복조가 필요합니다.` :
          `측파대 전력 비율 ${f2(Ps / (Pc + Ps) * 100, 1)}%. 포락선 최솟값 ${f2(minEnv, 2)}` + (mu > 1 ? ` → 과변조: 포락선이 0 아래로 내려가 찌그러집니다.` : ` → 포락선 검파 가능`)));
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 8. DFT는 DTFT의 표본: 영 채우기 (05-02) */
  (() => {
    const S = QSim.card("exp-e6-dft"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), L = S.val("L"); let N = S.val("N"); if (N < L) N = L;
      const D = (w) => { const s = Math.sin(w / 2); return Math.abs(s) < 1e-9 ? L : Math.abs(Math.sin(w * L / 2) / s); };
      const v = QSim.view(cv, 0.42), fr = QSim.frame(v, { x0: 0, x1: 2 * Math.PI, y0: 0, y1: L * 1.12, xl: "ω (0 ~ 2π)", yl: "|X|" }); fr.axes({ noGrid: true });
      fr.fn(D, c.ink3, 1.5, [5, 3], 1200);
      const pts = []; for (let k = 0; k < N; k++) { const w = 2 * Math.PI * k / N; let re = 0, im = 0; for (let n = 0; n < L; n++) { re += Math.cos(w * n); im -= Math.sin(w * n); } pts.push([w, Math.hypot(re, im)]); }
      stems(fr, v.g, pts, c.main);
      const first = pts.slice(0, Math.min(N, 6)).map(([, m]) => f2(m)).join(", ");
      S.out(`x = 1이 ${L}개(나머지 0), ${N}점 DFT${N > L ? ` (뒤에 0을 ${N - L}개 채움)` : ""}. 점 간격 2π/${N}\n` +
        `|X[0..${Math.min(N, 6) - 1}]| = ${first}${N > 6 ? ", …" : ""}\n` +
        `회색 점선(DTFT)은 N과 관계없이 그대로이고, 파랑 점(DFT)만 촘촘해집니다. 주봉우리 폭(첫 영점 2π/${L} = ${f2(2 * Math.PI / L)})은 L로만 정해집니다.`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 극점·영점 표시: × 와 ○ */
  function marks(fr, g, pts, color, zero) {
    g.save(); g.strokeStyle = color; g.lineWidth = 2.2;
    pts.forEach(([x, y]) => { const X = fr.X(x), Y = fr.Y(y); g.beginPath(); if (zero) g.arc(X, Y, 6, 0, 7); else { g.moveTo(X - 6, Y - 6); g.lineTo(X + 6, Y + 6); g.moveTo(X + 6, Y - 6); g.lineTo(X - 6, Y + 6); } g.stroke(); });
    g.restore();
  }

  /* 9. s평면 극점과 임펄스 응답 (07-01) */
  (() => {
    const S = QSim.card("exp-e6-splane"); if (!S) return;
    const [cvS, cvH] = S.$$("canvas");
    function draw() {
      const c = C(), sg = S.val("sigma"), wd = S.val("wd");
      const poles = wd > 0 ? [[sg, wd], [sg, -wd]] : [[sg, 0]];
      const vs = QSim.view(cvS, 0.6), fs = QSim.frame(vs, { x0: -4, x1: 2, y0: -7, y1: 7, xl: "σ", yl: "jω" }); fs.axes({ noGrid: true });
      const g = vs.g; g.save(); g.fillStyle = sg < 0 ? c.soft : "rgba(217,83,79,.15)"; g.globalAlpha = 0.6; g.fillRect(fs.X(sg), fs.Y(7), fs.X(2) - fs.X(sg), fs.Y(-7) - fs.Y(7)); g.restore();
      fs.path([[0, -7], [0, 7]], c.ink, 1.5);
      marks(fs, g, poles, sg < 0 ? c.main : c.warn, false);
      fs.text("ROC(인과)", Math.min(1.9, sg + 0.1), 6, c.ink3);
      const h = wd > 0 ? (t) => (t >= 0 ? Math.exp(sg * t) * Math.cos(wd * t) : 0) : (t) => (t >= 0 ? Math.exp(sg * t) : 0);
      const T = 6, top = Math.min(6, Math.max(1.1, Math.exp(Math.max(0, sg) * T) * 1.05));
      const vh = QSim.view(cvH, 0.32), fh = QSim.frame(vh, { x0: -0.5, x1: T, y0: -top, y1: top, xl: "t (s)", yl: "h(t)" }); fh.axes({ noGrid: true });
      fh.fn((t) => Math.max(-top, Math.min(top, h(t))), sg < 0 ? c.main : c.warn, 2.2, undefined, 1200);
      if (wd > 0) { fh.fn((t) => (t >= 0 ? Math.min(top, Math.exp(sg * t)) : 0), c.rule, 1, [4, 3]); }
      const stable = sg < 0;
      S.out(`극점 ${wd > 0 ? `${sg} ± ${wd}j` : `${sg}`}, h(t) = e^(${sg}t)${wd > 0 ? `cos(${wd}t)` : ""}u(t) (인과로 정한 경우)\n` +
        `ROC: Re(s) > ${sg} → 허수축(σ = 0)을 ${stable ? "포함 → 안정" : "포함하지 않음 → 불안정"}` +
        (sg === 0 ? " (극점이 허수축 위: 줄지도 커지지도 않는 진동, BIBO 안정 아님)" : "") + `\n` +
        (wd > 0 ? `진동 주기 2π/${wd} = ${f2(2 * Math.PI / wd, 2)} s, ` : "") + (sg < 0 ? `포락선이 1/e가 되는 시간 ${f2(-1 / sg, 2)} s` : sg > 0 ? `포락선이 e배가 되는 시간 ${f2(1 / sg, 2)} s` : `포락선 일정`));
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 10. z평면 극점·영점과 주파수 응답 (07-02) */
  (() => {
    const S = QSim.card("exp-e6-zplane"); if (!S) return;
    const [cvZ, cvH] = S.$$("canvas");
    function draw() {
      const c = C(), r = S.val("r"), th = S.val("th") * Math.PI / 180, zk = S.val("zero");
      const poles = [[r * Math.cos(th), r * Math.sin(th)], [r * Math.cos(th), -r * Math.sin(th)]];   // θ = 0, 180°이면 같은 실수 극점 두 개
      const zeros = zk === "none" ? [] : zk === "pm1" ? [[1, 0], [-1, 0]] : [[0, 1], [0, -1]];
      const dist = (w, [x, y]) => Math.hypot(Math.cos(w) - x, Math.sin(w) - y);
      const Hm = (w) => zeros.reduce((s, z) => s * dist(w, z), 1) / poles.reduce((s, p) => s * dist(w, p), 1);
      const vz = QSim.view(cvZ, 0.55), fz = QSim.frame(vz, { x0: -1.6, x1: 1.6, y0: -1.3, y1: 1.3, equal: true, pad: 12 }); fz.axes({ noGrid: true });
      fz.fn((x) => Math.sqrt(Math.max(0, 1 - x * x)), c.rule, 1.5, [4, 3]); fz.fn((x) => -Math.sqrt(Math.max(0, 1 - x * x)), c.rule, 1.5, [4, 3]);
      const stable = r < 1 - 1e-9;
      marks(fz, vz.g, poles, stable ? c.main : c.warn, false); marks(fz, vz.g, zeros, c.acc, true);
      let mx = 0, wmx = 0; for (let i = 0; i <= 2000; i++) { const w = Math.PI * i / 2000, v = Hm(w); if (v > mx) { mx = v; wmx = w; } }
      const top = Math.min(40, mx * 1.1 || 1), vh = QSim.view(cvH, 0.32), fh = QSim.frame(vh, { x0: 0, x1: Math.PI, y0: 0, y1: top, xl: "ω (0 ~ π)", yl: "|H|" }); fh.axes({ noGrid: true });
      fh.fn((w) => Math.min(top, Hm(w)), stable ? c.main : c.warn, 2.2, undefined, 1200);
      const zs = { none: "없음", pm1: "z = ±1 (ω = 0, π에서 0)", pmj: "z = ±j (ω = π/2에서 0)" }[zk];
      S.out(`극점 ${f2(r, 2)}·e^(±j${S.val("th")}°), 영점 ${zs}. H(z) = (영점 인수) / (1 − ${f2(2 * r * Math.cos(th))}z⁻¹ + ${f2(r * r)}z⁻²)\n` +
        `|H| 최대 ${mx > 1e6 ? "매우 큼" : f2(mx)} (ω = ${f2(wmx / Math.PI, 3)}π), ω = 0, π/2, π에서 ${[0, Math.PI / 2, Math.PI].map((w) => f2(Hm(w))).join(", ")}\n` +
        (stable ? `모든 극점이 단위원 안 → 인과 시스템으로 안정. 극점이 단위원에 가까울수록 봉우리가 높고 좁아집니다.` : `극점이 단위원 위나 밖 → 인과 시스템으로 불안정. 위 곡선은 의미가 없습니다(DTFT가 존재하지 않음).`));
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 11. Butterworth 차수와 군지연 (08-01) */
  (() => {
    const S = QSim.card("exp-e6-butter"); if (!S) return;
    const [cvM, cvG] = S.$$("canvas");
    function draw() {
      const c = C(), n = S.val("n");
      const P = []; for (let k = 0; k < n; k++) { const a = Math.PI * (2 * k + n + 1) / (2 * n); P.push([Math.cos(a), Math.sin(a)]); }   // ωc = 1, 왼쪽 반평면 극점
      const mag = (w) => 1 / Math.sqrt(1 + Math.pow(w, 2 * n));
      const phase = (w) => -P.reduce((s, [x, y]) => s + Math.atan2(w - y, -x), 0);   // ∠H = −Σ∠(jω − p)
      const gd = (w) => P.reduce((s, [x, y]) => s + (-x) / (x * x + (w - y) * (w - y)), 0);   // −d∠H/dω
      const vm = QSim.view(cvM, 0.4), fm = QSim.frame(vm, { x0: -1, x1: 1, y0: -80, y1: 5, xl: "log₁₀(ω/ω_c)", yl: "dB" }); fm.axes();
      fm.fn((u) => Math.max(-80, 20 * Math.log10(mag(10 ** u))), c.main, 2.5);
      fm.path([[-1, -3], [1, -3]], c.rule, 1, [3, 3]);
      const vg = QSim.view(cvG, 0.32), G = Math.max(...Array.from({ length: 301 }, (_, i) => gd(i / 100))) * 1.15, fg = QSim.frame(vg, { x0: 0, x1: 3, y0: 0, y1: G, xl: "ω/ω_c", yl: "군지연 (1/ω_c)" }); fg.axes({ noGrid: true });
      fg.fn(gd, c.acc, 2.2);
      const db = (w) => f2(20 * Math.log10(mag(w)), 1);
      S.out(`${n}차 Butterworth(ω_c = 1). ω = 0.5, 1, 2, 3에서 ${db(0.5)}, ${db(1)}, ${db(2)}, ${db(3)} dB. 저지 대역 기울기 −${20 * n} dB/decade\n` +
        `극점: 단위원 위 ${P.map(([x, y]) => `${f2(x, 2)}${y >= 0 ? "+" : "−"}${f2(Math.abs(y), 2)}j`).join(", ")}\n` +
        `군지연: ω = 0에서 ${f2(gd(0), 2)}, ω = 1에서 ${f2(gd(1), 2)} (단위 1/ω_c). ω = 1에서의 위상 ${f2(phase(1) * 180 / Math.PI, 1)}° (= −45°·n)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 12. 창 함수와 스펙트럼 누설 (08-02) */
  (() => {
    const S = QSim.card("exp-e6-window"); if (!S) return;
    const cv = S.$("canvas");
    const wins = {
      rect: () => 1,
      hann: (n, N) => 0.5 - 0.5 * Math.cos(2 * Math.PI * n / (N - 1)),
      hamming: (n, N) => 0.54 - 0.46 * Math.cos(2 * Math.PI * n / (N - 1)),
      blackman: (n, N) => 0.42 - 0.5 * Math.cos(2 * Math.PI * n / (N - 1)) + 0.08 * Math.cos(4 * Math.PI * n / (N - 1)),
    };
    function draw() {
      const c = C(), N = 64, wn = S.val("win"), k1 = 16 + S.val("off"), dk = S.val("dk"), lev = S.val("lev"), a2 = 10 ** (lev / 20);
      const w = Array.from({ length: N }, (_, n) => wins[wn](n, N)), sw = w.reduce((s, v) => s + v, 0);
      const spec = (amp2) => { const K = 8 * N, out = []; for (let k = 0; k <= K / 2; k++) { let re = 0, im = 0; for (let n = 0; n < N; n++) { const x = Math.cos(2 * Math.PI * k1 * n / N) + amp2 * Math.cos(2 * Math.PI * (k1 + dk) * n / N), a = -2 * Math.PI * k * n / K; re += w[n] * x * Math.cos(a); im += w[n] * x * Math.sin(a); } out.push([k / 8, 20 * Math.log10(Math.max(1e-9, 2 * Math.hypot(re, im) / sw))]); } return out; };
      const both = spec(a2), big = spec(0);
      const v = QSim.view(cv, 0.45), fr = QSim.frame(v, { x0: 0, x1: 32, y0: -100, y1: 5, xl: "주파수 (빈 번호, N = 64)", yl: "dB" }); fr.axes();
      fr.path(big, c.rule, 1.2, [4, 3]); fr.path(both, c.main, 2);
      fr.path([[k1 + dk, -100], [k1 + dk, 5]], c.acc, 1, [2, 3]);
      const at = (arr, f) => arr.reduce((b, p) => (Math.abs(p[0] - f) < Math.abs(b[0] - f) ? p : b))[1];
      const leak = at(big, k1 + dk), seen = lev > leak + 3;
      // 주엽의 영점 사이 폭: 큰 성분만의 스펙트럼에서 봉우리 양옆 첫 극소
      let i0 = big.findIndex((p) => p[0] >= k1), L = i0, R = i0; while (L > 0 && big[L - 1][1] < big[L][1]) L--; while (R < big.length - 1 && big[R + 1][1] < big[R][1]) R++;
      const scal = at(big, Math.round(k1));
      S.out(`${{ rect: "직사각", hann: "Hann", hamming: "Hamming", blackman: "Blackman" }[wn]} 창, 큰 성분(진폭 1)은 빈 ${k1}, 작은 성분(${lev} dB)은 빈 ${k1 + dk}\n` +
        `큰 성분만 있을 때 빈 ${k1 + dk}에 새어 든 크기 ${f2(leak, 1)} dB → 작은 성분이 ${seen ? "보입니다" : "누설에 묻힙니다"}\n` +
        `보통 FFT(정수 빈)로 읽은 큰 성분: 빈 ${Math.round(k1)}에서 ${f2(scal, 2)} dB (빈 사이에 놓이면 작게 읽힘)
` +
        `주엽 폭(양옆 첫 극소 사이) 약 ${f2(big[R][0] - big[L][0], 2)}빈. 회색 점선: 큰 성분만, 파랑: 두 성분, 주황 세로선: 작은 성분 위치`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
