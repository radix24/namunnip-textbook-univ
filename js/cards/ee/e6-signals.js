/* 전전6 신호및시스템 탐구 카드 묶음
   1 시간 이동·반전·척도(01-01)  2 차분 방정식의 임펄스 응답과 특성근(02-03)
   3 Fourier 급수 부분합과 Gibbs(03-01)  4 사각파가 RC 저역 통과를 지나면(03-02) */
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

  /* 2. 2차 차분 방정식 y[n] = a1 y[n−1] + a2 y[n−2] + x[n] */
  (() => {
    const S = QSim.card("exp-e6-diffeq"); if (!S) return;
    const [cvH, cvZ] = S.$$("canvas");
    function draw() {
      const c = C(), a1 = S.val("a1"), a2 = S.val("a2"), N = 30;
      const h = []; for (let n = 0; n < 400; n++) h.push((n === 0 ? 1 : 0) + a1 * (n >= 1 ? h[n - 1] : 0) + a2 * (n >= 2 ? h[n - 2] : 0));
      // 특성근: r^2 − a1 r − a2 = 0
      const D = a1 * a1 + 4 * a2; let roots, rmax;
      if (D >= 0) { const s = Math.sqrt(D); roots = [[(a1 + s) / 2, 0], [(a1 - s) / 2, 0]]; }
      else { const s = Math.sqrt(-D) / 2; roots = [[a1 / 2, s], [a1 / 2, -s]]; }
      rmax = Math.max(...roots.map(([x, y]) => Math.hypot(x, y)));
      const stable = rmax < 1 - 1e-9, S1 = h.reduce((s, v) => s + Math.abs(v), 0);
      const shown = h.slice(0, N + 1), M = Math.max(1.2, ...shown.map(Math.abs).filter(isFinite)) * 1.1, lim = Math.min(M, 12);
      const vh = QSim.view(cvH, 0.38), fh = QSim.frame(vh, { x0: -1, x1: N + 0.5, y0: -lim, y1: lim, xl: "n", yl: "h[n]" }); fh.axes({ noGrid: true });
      stems(fh, vh.g, shown.map((v, n) => [n, Math.max(-lim, Math.min(lim, v))]), stable ? c.main : c.warn);
      // z 평면: 단위원과 특성근
      const vz = QSim.view(cvZ, 0.5), fz = QSim.frame(vz, { x0: -2.2, x1: 2.2, y0: -1.6, y1: 1.6, equal: true, pad: 12 }); fz.axes({ noGrid: true });
      fz.fn((x) => Math.sqrt(Math.max(0, 1 - x * x)), c.rule, 1.5, [4, 3]); fz.fn((x) => -Math.sqrt(Math.max(0, 1 - x * x)), c.rule, 1.5, [4, 3]);
      roots.forEach(([x, y]) => { const g = vz.g; g.save(); g.strokeStyle = stable ? c.main : c.warn; g.lineWidth = 2.5; const X = fz.X(x), Y = fz.Y(y); g.beginPath(); g.moveTo(X - 6, Y - 6); g.lineTo(X + 6, Y + 6); g.moveTo(X + 6, Y - 6); g.lineTo(X - 6, Y + 6); g.stroke(); g.restore(); });
      fz.text("단위원 |r| = 1", 0.75, 1.05, c.ink3);
      const rs = roots.map(([x, y]) => (y ? `${f2(x)} ${y > 0 ? "+" : "−"} ${f2(Math.abs(y))}j` : f2(x))).join(", ");
      const osc = D < 0 ? `복소 공액근: 각 ${f2(Math.atan2(roots[0][1], roots[0][0]) * 180 / Math.PI, 1)}°, 한 번 진동에 약 ${f2(360 / (Math.atan2(roots[0][1], roots[0][0]) * 180 / Math.PI), 1)}표본` : (roots.some(([x]) => x < 0) ? "음의 실근: 부호가 번갈아 바뀌는 성분" : "양의 실근: 진동 없이 변함");
      S.out(`y[n] = ${a1}·y[n−1] ${a2 >= 0 ? "+" : "−"} ${Math.abs(a2)}·y[n−2] + x[n]. 특성 방정식 r² − ${a1}r ${a2 > 0 ? "−" : "+"} ${Math.abs(a2)} = 0\n` +
        `특성근 ${rs}, 가장 큰 크기 ${f2(rmax)} → ${stable ? "안정" : "불안정"}. ${osc}\n` +
        `h[0..7] = ${h.slice(0, 8).map((v) => f2(v)).join(", ")}\n` +
        (stable ? `Σ|h[n]| (400항) ≈ ${f2(S1)} : 유한하므로 BIBO 안정` : `Σ|h[n]|가 커지기만 합니다(400항까지 ${S1 > 1e6 ? "10⁶ 초과" : f2(S1, 1)}). 위 그래프는 ±${f2(lim, 1)}에서 잘랐습니다.`));
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

  /* 4. 사각파(50%, 주기 2π)가 H = 1/(1 + jωτ)를 지나면 */
  (() => {
    const S = QSim.card("exp-e6-eigen"); if (!S) return;
    const [cvT, cvK] = S.$$("canvas");
    function draw() {
      const c = C(), tau = S.val("tau"), N = 199, W = waves.square(0.5);
      const H = (w) => { const d = 1 + w * w * tau * tau; return [1 / d, -w * tau / d]; };
      const B = []; for (let k = 1; k <= N; k += 2) { const [ar] = W.a(k), [hr, hi] = H(k); B.push([k, ar * hr, ar * hi]); }
      const y = (t) => B.reduce((s, [k, re, im]) => s + 2 * (re * Math.cos(k * t) - im * Math.sin(k * t)), 0.5);
      const vt = QSim.view(cvT, 0.42), ft = QSim.frame(vt, { x0: -2 * Math.PI, x1: 2 * Math.PI, y0: -0.25, y1: 1.25, xl: "t", yl: "" }); ft.axes({ noGrid: true });
      ft.fn(W.x, c.ink3, 1.5, [5, 3], 1600); ft.fn(y, c.acc, 2.5, undefined, 800);
      const vk = QSim.view(cvK, 0.3), fk = QSim.frame(vk, { x0: -0.5, x1: 15.5, y0: 0, y1: 0.7, xl: "k (고조파 번호)", yl: "진폭" }); fk.axes({ noGrid: true });
      const ins = [[0, 0.5]], outs = [[0, 0.5]];
      for (let k = 1; k <= 15; k += 2) { const am = 2 * Math.abs(W.a(k)[0]), [hr, hi] = H(k); ins.push([k - 0.15, am]); outs.push([k + 0.15, am * Math.hypot(hr, hi)]); }
      stems(fk, vk.g, ins, c.ink3); stems(fk, vk.g, outs, c.acc);
      const row = [1, 3, 5].map((k) => { const [hr, hi] = H(k); return `k=${k}: |H| = ${f2(Math.hypot(hr, hi))}, ∠H = ${f2(Math.atan2(hi, hr) * 180 / Math.PI, 1)}°, 출력 진폭 ${f2(2 / (k * Math.PI) * Math.hypot(hr, hi))}`; });
      S.out(`시정수 τ = ${tau} s, 차단 각주파수 1/τ = ${f2(1 / tau, 2)} rad/s, 사각파 기본 각주파수 1 rad/s\n${row.join("\n")}\n` +
        `직류 0.5는 |H(0)| = 1이라 그대로. 회색: 입력 고조파 진폭, 주황: 출력 고조파 진폭(각각 곱셈 한 번)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
