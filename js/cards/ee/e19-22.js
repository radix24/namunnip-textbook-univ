/* 전전19~22 탐구 카드: Smith 도표(19-01-01), 경사하강과 Newton(20-04-01), 2차 계단 응답(22-02-01), 상승 코사인 눈 모양(21-02-02) */
(() => {
  "use strict";
  if (!window.QSim) return;
  const C = () => QSim.col();
  const f2 = (x, d = 3) => (Math.abs(x) < 5e-13 ? 0 : x).toFixed(d);

  /* 1. Smith 도표: 부하에서 전원 쪽으로 이동 */
  (() => {
    const S = QSim.card("exp-e19-smith"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), r = S.val("r"), x = S.val("x"), l = S.val("l");
      const G = (zr, zi) => { const nr = zr - 1, ni = zi, dr = zr + 1, di = zi, d = dr * dr + di * di; return [(nr * dr + ni * di) / d, (ni * dr - nr * di) / d]; };
      const v = QSim.view(cv, 0.9), fr = QSim.frame(v, { x0: -1.15, x1: 1.15, y0: -1.15, y1: 1.15, equal: true, pad: 8 });
      // 격자: 저항 원과 리액턴스 호
      [0, 0.5, 1, 2, 5].forEach((rr) => { const pts = []; for (let i = -200; i <= 200; i++) { const xx = Math.tan(i / 201 * Math.PI / 2) * 3; pts.push(G(rr, xx)); } fr.path(pts, c.rule, rr === 1 ? 1.6 : 1); });
      [-5, -2, -1, -0.5, 0.5, 1, 2, 5].forEach((xx) => { const pts = []; for (let i = 0; i <= 200; i++) { const rr = Math.tan(i / 201 * Math.PI / 2) * 5; pts.push(G(rr, xx)); } fr.path(pts, c.rule, 1); });
      fr.path([[-1, 0], [1, 0]], c.rule, 1);
      const [gr, gi] = G(r, x), mag = Math.hypot(gr, gi), ang = Math.atan2(gi, gr);
      const circ = []; for (let i = 0; i <= 200; i++) { const t = 2 * Math.PI * i / 200; circ.push([mag * Math.cos(t), mag * Math.sin(t)]); }
      fr.path(circ, c.acc, 1.4, [5, 3]);
      const a2 = ang - 4 * Math.PI * l, g2r = mag * Math.cos(a2), g2i = mag * Math.sin(a2);
      const arc = []; for (let i = 0; i <= 60; i++) { const t = ang - 4 * Math.PI * l * i / 60; arc.push([mag * Math.cos(t), mag * Math.sin(t)]); }
      fr.path(arc, c.warn, 2.4);
      fr.dot(gr, gi, c.main, 6); fr.dot(g2r, g2i, c.warn, 6);
      // z_in = (1 + Γ)/(1 − Γ)
      const nr = 1 + g2r, ni = g2i, dr = 1 - g2r, di = -g2i, dd = dr * dr + di * di, zr = (nr * dr + ni * di) / dd, zi = (ni * dr - nr * di) / dd;
      S.out(`Z₀ = 50 Ω, 부하 z_L = ${f2(r, 2)} + j${f2(x, 2)} (Z_L = ${f2(50 * r, 1)} + j${f2(50 * x, 1)} Ω)\n` +
        `Γ_L = ${f2(mag, 4)}∠${f2(ang * 180 / Math.PI, 1)}°, SWR = ${mag < 1 ? f2((1 + mag) / (1 - mag), 3) : "∞"}. 파란 점: 부하, 주황 점선: |Γ| 일정 원\n` +
        `전원 쪽으로 ${f2(l, 3)}λ 이동(시계 방향 ${f2(720 * l, 1)}°): Γ = ${f2(mag, 4)}∠${f2(((a2 * 180 / Math.PI) % 360 + 540) % 360 - 180, 1)}°, z_in = ${f2(zr, 3)} + j${f2(zi, 3)} (Z_in = ${f2(50 * zr, 1)} + j${f2(50 * zi, 1)} Ω, 빨간 점)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 경사하강법과 Newton 방법: f(x, y) = x² + κy² */
  (() => {
    const S = QSim.card("exp-e20-gd"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), kap = S.val("k"), step = S.val("a"), method = S.val("m");
      const f = (x, y) => x * x + kap * y * y;
      const v = QSim.view(cv, 0.6), fr = QSim.frame(v, { x0: -11, x1: 11, y0: -3, y1: 3, equal: false }); fr.axes({ noGrid: true });
      [1, 4, 16, 36, 64, 100].forEach((lv) => { const pts = []; for (let i = 0; i <= 200; i++) { const t = 2 * Math.PI * i / 200; pts.push([Math.sqrt(lv) * Math.cos(t), Math.sqrt(lv / kap) * Math.sin(t)]); } fr.path(pts, c.rule, 1); });
      let x = 10, y = 1; const path = [[x, y]]; let k = 0;
      while (Math.hypot(x, y) > 1e-6 && k < 2000 && isFinite(x) && Math.abs(y) < 1e6) {
        if (method === "newton") { x = 0; y = 0; } else { x -= step * 2 * x; y -= step * 2 * kap * y; }
        k++; if (path.length < 300) path.push([x, y]);
      }
      fr.path(path.map(([a, b]) => [Math.max(-11, Math.min(11, a)), Math.max(-3, Math.min(3, b))]), c.main, 2);
      path.slice(0, 40).forEach(([a, b]) => fr.dot(Math.max(-11, Math.min(11, a)), Math.max(-3, Math.min(3, b)), c.warn, 2.5));
      const conv = Math.hypot(x, y) <= 1e-6, rx = Math.abs(1 - 2 * step), ry = Math.abs(1 - 2 * kap * step);
      S.out(`f = x² + ${kap}y², 시작 (10, 1), ${method === "newton" ? "Newton 방법(이차 함수라 한 번에 최소점)" : `경사하강 보폭 α = ${f2(step, 3)}`}\n` +
        (method === "newton" ? `반복 ${k}번에 수렴. 헤세 행렬로 곡률을 보정하기 때문입니다.` :
          `방향별 수축 비 |1 − 2α| = ${f2(rx, 3)}, |1 − 2κα| = ${f2(ry, 3)} → ${conv ? `${k}번 반복에 |x| < 10⁻⁶` : ry >= 1 ? "y 방향이 수렴하지 않음(보폭 ≥ 1/κ)" : "2000번 안에 수렴하지 못함"}`) +
        `\n조건수 κ = ${kap}: 등고선이 길쭉할수록 경사하강은 지그재그로 느려집니다(최적 보폭에서 수축 비 (κ − 1)/(κ + 1) = ${f2((kap - 1) / (kap + 1), 3)}).`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 2차 시스템의 계단 응답 */
  (() => {
    const S = QSim.card("exp-e22-step2"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), z = S.val("z"), wn = S.val("wn");
      const y = (t) => {
        if (z < 1) { const wd = wn * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * wn * t) * (Math.cos(wd * t) + z / Math.sqrt(1 - z * z) * Math.sin(wd * t)); }
        if (Math.abs(z - 1) < 1e-6) return 1 - Math.exp(-wn * t) * (1 + wn * t);
        const s1 = -wn * (z - Math.sqrt(z * z - 1)), s2 = -wn * (z + Math.sqrt(z * z - 1));
        return 1 + (s2 * Math.exp(s1 * t) - s1 * Math.exp(s2 * t)) / (s1 - s2);
      };
      const tmax = 12 / wn, v = QSim.view(cv, 0.45), fr = QSim.frame(v, { x0: 0, x1: tmax, y0: 0, y1: 1.8, xl: "t (s)", yl: "y(t)" }); fr.axes();
      fr.path([[0, 1], [tmax, 1]], c.ink3, 1, [4, 3]); fr.path([[0, 1.02], [tmax, 1.02]], c.rule, 1, [2, 3]); fr.path([[0, 0.98], [tmax, 0.98]], c.rule, 1, [2, 3]);
      fr.fn(y, c.main, 2.4, undefined, 800);
      // 수치로 지표 측정
      let peak = 0, tp = 0, tr10 = null, tr90 = null, ts = 0; const N = 6000;
      for (let i = 0; i <= N; i++) { const t = i / N * tmax, v2 = y(t); if (v2 > peak) { peak = v2; tp = t; } if (tr10 === null && v2 >= 0.1) tr10 = t; if (tr90 === null && v2 >= 0.9) tr90 = t; if (Math.abs(v2 - 1) > 0.02) ts = t; }
      const os = Math.max(0, peak - 1) * 100;
      S.out(`ζ = ${f2(z, 2)}, ω_n = ${f2(wn, 1)} rad/s → 극점 ${z < 1 ? `${f2(-z * wn, 3)} ± j${f2(wn * Math.sqrt(1 - z * z), 3)}` : `실수 ${f2(-wn * (z - Math.sqrt(z * z - 1)), 3)}, ${f2(-wn * (z + Math.sqrt(z * z - 1)), 3)}`}\n` +
        `측정: 넘침 ${f2(os, 1)}%${z < 1 ? `(공식 e^(−πζ/√(1−ζ²)) = ${f2(100 * Math.exp(-Math.PI * z / Math.sqrt(1 - z * z)), 1)}%)` : ""}, 첨두 시간 ${z < 1 ? f2(tp, 3) + " s" : "-"}, 상승 시간(10~90%) ${tr90 && tr10 !== null ? f2(tr90 - tr10, 3) : "-"} s, 2% 정착 시간 ${ts >= tmax * 0.999 ? `${f2(tmax, 1)} s 창 안에 정착하지 않음` : f2(ts, 3) + " s"}(근사 4/(ζω_n) = ${f2(4 / (z * wn), 3)} s)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 상승 코사인 펄스와 눈 모양 그림 */
  (() => {
    const S = QSim.card("exp-e21-eye"); if (!S) return;
    const cv = S.$("canvas");
    let seed = 2024; const bits = [];
    for (let i = 0; i < 64; i++) { seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff; bits.push(seed & 0x10000 ? 1 : -1); }
    const sinc = (x) => (Math.abs(x) < 1e-9 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x));
    const p = (t, a) => { const d = 1 - (2 * a * t) ** 2; if (a > 0 && Math.abs(d) < 1e-8) return (Math.PI / 4) * sinc(1 / (2 * a)); return sinc(t) * Math.cos(Math.PI * a * t) / d; };
    const y = (t, a) => { let s = 0; const k0 = Math.max(0, Math.floor(t) - 10), k1 = Math.min(63, Math.ceil(t) + 10); for (let k = k0; k <= k1; k++) s += bits[k] * p(t - k, a); return s; };
    function draw() {
      const c = C(), a = S.val("a"), tau = S.val("tau");
      const v = QSim.view(cv, 0.55), fr = QSim.frame(v, { x0: -1, x1: 1, y0: -1.8, y1: 1.8, xl: "t / T", yl: "y" }); fr.axes();
      for (let k = 12; k <= 51; k++) { const pts = []; for (let i = 0; i <= 80; i++) { const u = -1 + i / 40; pts.push([u, y(k + u, a)]); } fr.path(pts, c.main, 1, undefined); }
      fr.path([[tau, -1.8], [tau, 1.8]], c.warn, 1.6, [4, 3]);
      let open = Infinity, worst = 0;
      for (let k = 12; k <= 51; k++) { const s = bits[k] * y(k + tau, a); open = Math.min(open, s); worst = Math.max(worst, Math.abs(y(k + tau, a) - bits[k])); }
      S.out(`롤오프 α = ${f2(a, 2)} (대역폭 (1 + α)/(2T) = 기호율의 ${f2((1 + a) / 2, 3)}배), 표본 시점 τ = ${f2(tau, 2)}T (빨간 점선)\n` +
        `무작위 ±1 기호 40개를 겹친 눈 모양: 그 시점의 최소 눈 높이(한쪽) ${f2(open, 3)}, 최대 ISI ${f2(worst, 3)}\n` +
        (Math.abs(tau) < 1e-9 ? "τ = 0에서는 Nyquist 조건으로 다른 펄스가 모두 0이라 ISI가 0입니다." : "표본 시점이 어긋나면 이웃 펄스 꼬리가 섞입니다. α가 클수록 꼬리가 빨리 줄어 덜 섞입니다."));
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

})();
