/* 물리9 탐구 카드 묶음: 직사각형 도파관 모드, 변위 전류 */
(() => {
  "use strict";
  const C = () => QSim.col();

  /* 1. 직사각형 도파관의 TE 모드 (07-01) */
  (() => {
    const S = QSim.card("lab-p9-waveguide"); if (!S) return;
    const cv = S.$("canvas");
    const MODES = [[1, 0], [2, 0], [0, 1], [1, 1], [3, 0], [2, 1], [0, 2]];
    function draw() {
      const c = C(), a = S.val("a") * 1e-2, b = S.val("b") * 1e-2, fq = S.val("f") * 1e9, [m, n] = S.val("mode").split(",").map(Number);
      const fc = (m, n) => 1.5e8 * Math.sqrt((m / a) ** 2 + (n / b) ** 2);
      const v = QSim.view(cv, 0.5), W = v.W, H = v.H, g = v.g;
      const sc = Math.min((W * 0.55) / a, (H - 40) / b), x0 = 16, y0 = (H - b * sc) / 2;
      const kx = m * Math.PI / a, ky = n * Math.PI / b, NX = 36, NY = Math.max(6, Math.round(NX * b / a));
      let mx = 1e-12; const F = [];
      for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) {
        const x = (i + 0.5) * a / NX, y = (j + 0.5) * b / NY;
        const ex = (n / b) * Math.cos(kx * x) * Math.sin(ky * y), ey = -(m / a) * Math.sin(kx * x) * Math.cos(ky * y);
        F.push([x, y, ex, ey]); mx = Math.max(mx, Math.hypot(ex, ey));
      }
      F.forEach(([x, y, ex, ey]) => { g.fillStyle = `rgba(75,79,224,${(0.08 + 0.6 * Math.hypot(ex, ey) / mx).toFixed(3)})`; g.fillRect(x0 + (x - a / NX / 2) * sc, y0 + b * sc - (y + b / NY / 2) * sc, a / NX * sc + 0.5, b / NY * sc + 0.5); });
      g.strokeStyle = c.ink; g.lineWidth = 2; g.strokeRect(x0, y0, a * sc, b * sc);
      const step = Math.max(1, Math.round(NX / 9));
      F.forEach(([x, y, ex, ey], k) => { const i = Math.floor(k / NY), j = k % NY; if (i % step || j % step) return; const s = 0.85 * (a / NX * step) * sc / mx, px = x0 + x * sc, py = y0 + b * sc - y * sc; g.strokeStyle = c.acc; g.lineWidth = 2.5; g.beginPath(); g.moveTo(px - ex * s / 2, py + ey * s / 2); g.lineTo(px + ex * s / 2, py - ey * s / 2); g.stroke(); });
      g.fillStyle = c.ink2; g.font = "12px sans-serif"; g.fillText(`TE${m}${n} 단면의 전기장 (짙을수록 셈)`, x0, y0 - 8);
      const tx = x0 + a * sc + 20; let ty = 18;
      g.fillText("모드: 차단 진동수", tx, ty);
      MODES.forEach(([p, q]) => { ty += 17; const f0 = fc(p, q); g.fillStyle = f0 < fq ? c.main : c.ink3; g.fillText(`TE${p}${q}: ${(f0 / 1e9).toFixed(2)} GHz ${f0 < fq ? "전파" : "차단"}`, tx, ty); });
      const f0 = fc(m, n), ok = fq > f0, lam = 3e8 / fq;
      const prop = MODES.filter(([p, q]) => fc(p, q) < fq).map(([p, q]) => `TE${p}${q}`);
      S.out(`a = ${S.val("a")} cm, b = ${S.val("b")} cm, f = ${S.val("f")} GHz (진공 파장 ${(lam * 100).toFixed(2)} cm)\n고른 모드 TE${m}${n}: 차단 진동수 ${(f0 / 1e9).toFixed(3)} GHz → ${ok ? `전파함. 관내 파장 λg = ${(lam / Math.sqrt(1 - (f0 / fq) ** 2) * 100).toFixed(2)} cm, 군속도 ${(Math.sqrt(1 - (f0 / fq) ** 2)).toFixed(3)} c` : "차단됨 (지수적으로 감쇠)"}\n이 진동수에서 전파하는 모드: ${prop.length ? prop.join(", ") : "없음"}${prop.length === 1 ? " (단일 모드 영역)" : ""}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 충전하는 축전기의 변위 전류와 자기장 (04-01) */
  (() => {
    const S = QSim.card("lab-p9-displacement"); if (!S) return;
    const [cv1, cv2] = S.$$("canvas");
    const a = 0.05, mu0 = 4e-7 * Math.PI, e0 = 8.854e-12;   // 원판 반지름 5 cm
    function draw() {
      const c = C(), V0 = S.val("V0"), R = S.val("R") * 1e3, Cp = S.val("C") * 1e-6, t = S.val("t") * 1e-3, r = S.val("r") * 1e-2;
      const tau = R * Cp, I = (s) => V0 / R * Math.exp(-s / tau), It = I(t);
      const tm = Math.max(5 * tau, t * 1.1);
      const v = QSim.view(cv1, 0.36), f = QSim.frame(v, { x0: 0, x1: tm * 1e3, y0: 0, y1: V0 / R * 1e3 * 1.1, xl: "t (ms)", yl: "I (mA)" }); f.axes();
      f.fn((s) => I(s * 1e-3) * 1e3, c.main, 2.4); f.dot(t * 1e3, It * 1e3, c.acc, 5);
      const B = (s) => s < a ? mu0 * It * s / (2 * Math.PI * a * a) : mu0 * It / (2 * Math.PI * s);
      const Bmax = mu0 * (V0 / R) / (2 * Math.PI * a);
      const v2 = QSim.view(cv2, 0.36), g = QSim.frame(v2, { x0: 0, x1: 15, y0: 0, y1: Bmax * 1e9 * 1.1, xl: "r (cm)", yl: "B (nT)" }); g.axes();
      g.path([[a * 100, 0], [a * 100, Bmax * 1e9 * 1.1]], c.ink3, 1, [4, 4]);
      g.fn((s) => B(s / 100) * 1e9, c.main, 2.4, null, 600); g.dot(r * 100, B(r) * 1e9, c.acc, 5);
      const dEdt = It / (e0 * Math.PI * a * a);
      S.out(`시정수 RC = ${(tau * 1e3).toFixed(1)} ms, t = ${(t * 1e3).toFixed(0)} ms\n도선의 전류 I = ${(It * 1e3).toFixed(4)} mA, 극판 사이 변위 전류 ε₀ dΦ_E/dt = ${(e0 * dEdt * Math.PI * a * a * 1e3).toFixed(4)} mA (같다)\n극판 사이 전기장의 변화율 dE/dt = ${dEdt.toExponential(3)} V/(m·s)\n축에서 ${(r * 100).toFixed(1)} cm 떨어진 곳의 자기장 B = ${(B(r) * 1e9).toFixed(3)} nT (점선: 극판 가장자리 5 cm)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
