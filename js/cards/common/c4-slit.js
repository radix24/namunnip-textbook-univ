/* 공통4 실습: 슬릿과 회절 격자의 무늬 (11-01). 슬릿 수 N을 늘리면 회절 격자의 무늬가 된다.
   세기 I(θ) = [sin β / β]² · [sin Nα / (N sin α)]², α = π d sinθ / λ, β = π a sinθ / λ */
(() => {
  "use strict";
  const rgb = (nm) => { let r = 0, g = 0, b = 0; if (nm < 440) { r = (440 - nm) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; } else if (nm < 510) { g = 1; b = (510 - nm) / 20; } else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = (645 - nm) / 65; } else r = 1; return [r, g, b].map((x) => Math.round(255 * Math.pow(x, 0.8))); };
  (() => {
    const S = QSim.card("lab-c4-slit"); if (!S) return;
    const [c1, c2] = S.$$("canvas");
    const I = (s, N, d, a, lam) => { const al = (Math.PI * d * s) / lam, be = (Math.PI * a * s) / lam; const env = Math.abs(be) < 1e-9 ? 1 : (Math.sin(be) / be) ** 2; const sa = Math.sin(al); const arr = N === 1 ? 1 : Math.abs(sa) < 1e-9 ? 1 : (Math.sin(N * al) / (N * sa)) ** 2; return env * arr; };
    function draw() {
      const C = QSim.col(), N = S.val("N"), d = S.val("d") * 1e-6, lam = S.val("lam") * 1e-9;
      const a = Math.min(S.val("a") * 1e-6, d * 0.98);
      const smax = Math.min(0.999, (2.6 * lam) / a);
      const thmax = (Math.asin(smax) * 180) / Math.PI;
      let v = QSim.view(c1, 0.45), f = QSim.frame(v, { x0: -thmax, x1: thmax, y0: 0, y1: 1.08, xl: "θ (°)", yl: "I / I₀" }); f.axes();
      const n = 2400, pts = [], env = [];
      for (let k = 0; k <= n; k++) { const th = -thmax + (2 * thmax * k) / n, s = Math.sin((th * Math.PI) / 180); pts.push([th, I(s, N, d, a, lam)]); const be = (Math.PI * a * s) / lam; env.push([th, Math.abs(be) < 1e-9 ? 1 : (Math.sin(be) / be) ** 2]); }
      if (N > 1) f.path(env, C.ink3, 1, [4, 3]);
      f.path(pts, C.main, 2);
      // 스크린의 색 띠
      v = QSim.view(c2, 0.12); const g = v.g, [r, gg, b] = rgb(S.val("lam"));
      g.fillStyle = "#000"; g.fillRect(0, 0, v.W, v.H);
      for (let px = 0; px < v.W; px++) { const th = -thmax + (2 * thmax * px) / v.W, val = I(Math.sin((th * Math.PI) / 180), N, d, a, lam); g.fillStyle = `rgba(${r},${gg},${b},${Math.min(1, Math.sqrt(val) * 1.1)})`; g.fillRect(px, 0, 1, v.H); }
      const m1 = lam / d <= 1 ? ((Math.asin(lam / d) * 180) / Math.PI).toFixed(2) + "°" : "없음";
      const orders = Math.floor(d / lam);
      S.out(`슬릿 ${N}개, 간격 d = ${S.val("d")} μm, 폭 a = ${(a * 1e6).toFixed(1)} μm, 파장 ${S.val("lam")} nm\n` +
        (N > 1 ? `밝은 무늬 d sinθ = mλ: 1차 ${m1}, 나타나는 최대 차수 ${orders}` + `, 스크린 1 m에서 간격 λL/d = ${((lam / d) * 1e3).toFixed(2)} mm` +"\n" : "") +
        `단일 슬릿 첫 어두운 무늬 a sinθ = λ: ${lam / a <= 1 ? ((Math.asin(lam / a) * 180) / Math.PI).toFixed(2) + "°" : "없음"}` + (N > 1 ? " (회색 점선: 단일 슬릿 회절 무늬)" : ""));
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
