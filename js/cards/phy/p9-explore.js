/* 물리9 탐구 카드 묶음: 회전 고리의 유도 기전력, 도체 속 표피 깊이, 직사각형 도파관 모드 */
(() => {
  "use strict";
  const C = () => QSim.col();

  /* 1. 자기장 속에서 도는 고리: Φ와 ε = −dΦ/dt (03-01) */
  (() => {
    const S = QSim.card("lab-p9-faraday"); if (!S) return;
    const cv = S.$("canvas");
    let ph = 0;   // 고리 각 (rad)
    function draw() {
      const c = C(), B = S.val("B"), A = S.val("A") * 1e-4, N = S.val("N"), fq = S.val("f"), w = 2 * Math.PI * fq;
      const Phi0 = N * B * A, E0 = Phi0 * w, T = 1 / fq;
      const v = QSim.view(cv, 0.5), W = v.W, H = v.H, g = v.g;
      // 왼쪽: 고리를 옆에서 본 그림
      const cx = W * 0.15, cy = H * 0.5, r = Math.min(W * 0.11, H * 0.35);
      g.strokeStyle = c.ink3; g.lineWidth = 1; g.setLineDash([3, 4]);
      for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(cx - r * 1.4, cy + k * r * 0.4); g.lineTo(cx + r * 1.4, cy + k * r * 0.4); g.stroke(); }
      g.setLineDash([]); g.fillStyle = c.ink3; g.font = "12px sans-serif"; g.fillText("B →", cx + r * 1.0, cy - r * 1.0);
      g.strokeStyle = c.main; g.lineWidth = 4; g.beginPath(); g.moveTo(cx - r * Math.sin(ph), cy - r * Math.cos(ph)); g.lineTo(cx + r * Math.sin(ph), cy + r * Math.cos(ph)); g.stroke();
      g.fillStyle = c.ink2; g.fillText(`고리 면과 B의 각 ${(ph * 180 / Math.PI % 360).toFixed(0)}°`, cx - r * 1.2, H - 8);
      // 오른쪽: Φ(t)와 ε(t)
      const X0 = W * 0.32, sx = (W - X0 - 10) / (2.1 * T), X = (t) => X0 + (t + 0.1 * T) * sx, Y = (y) => H / 2 - y * H * 0.38;
      g.strokeStyle = c.rule; g.lineWidth = 1; g.beginPath(); g.moveTo(X0, H / 2); g.lineTo(W - 8, H / 2); g.moveTo(X(0), 8); g.lineTo(X(0), H - 8); g.stroke();
      const curve = (fn, col, dash) => { g.strokeStyle = col; g.lineWidth = 2.2; g.setLineDash(dash || []); g.beginPath(); for (let i = 0; i <= 300; i++) { const t = 2 * T * i / 300; i ? g.lineTo(X(t), Y(fn(t))) : g.moveTo(X(t), Y(fn(t))); } g.stroke(); g.setLineDash([]); };
      curve((t) => Math.cos(w * t), c.main); curve((t) => Math.sin(w * t), c.acc, [6, 4]);
      const tc = (ph / w) % (2 * T); g.fillStyle = c.warn; g.beginPath(); g.arc(X(tc), Y(Math.cos(w * tc)), 4, 0, 7); g.arc(X(tc), Y(Math.sin(w * tc)), 4, 0, 7); g.fill();
      g.fillStyle = c.ink2; g.fillText("파랑: Φ(t), 주황 점선: ε(t)", X0 + 6, 16);
      S.out(`최대 선속 결합 NΦ = NBA = ${Phi0.toPrecision(3)} Wb, 각진동수 ω = ${w.toFixed(1)} rad/s\n최대 기전력 ε₀ = NBAω = ${E0.toPrecision(4)} V, 실효값 ε₀/√2 = ${(E0 / Math.SQRT2).toPrecision(4)} V\n지금 NΦ = ${(Phi0 * Math.cos(ph)).toPrecision(3)} Wb, ε = ${(E0 * Math.sin(ph)).toPrecision(3)} V (Φ가 0일 때 ε가 가장 크다)`);
    }
    const L = QSim.loop((dt) => { ph += dt * 2 * Math.PI * 0.5; draw(); }).watch(cv);
    QSim.playButton(S.$(".play"), L);
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 도체 속 전자기파의 감쇠와 표피 깊이 (05-04) */
  (() => {
    const S = QSim.card("lab-p9-skin"); if (!S) return;
    const cv = S.$("canvas");
    const SIG = { cu: [5.96e7, "구리"], al: [3.77e7, "알루미늄"], ss: [1.4e6, "스테인리스강"], sea: [4.8, "바닷물"] };
    const fmt = (m) => m >= 1 ? m.toPrecision(3) + " m" : m >= 1e-3 ? (m * 1e3).toPrecision(3) + " mm" : m >= 1e-6 ? (m * 1e6).toPrecision(3) + " μm" : (m * 1e9).toPrecision(3) + " nm";
    function draw() {
      const c = C(), [sig, name] = SIG[S.val("mat")], fq = +S.val("f"), w = 2 * Math.PI * fq, mu0 = 4e-7 * Math.PI;
      const d = Math.sqrt(2 / (mu0 * sig * w));
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: 5, y0: -1.1, y1: 1.1, xl: "깊이 z/δ", yl: "E/E₀" }); f.axes();
      f.fn((z) => Math.exp(-z), c.ink3, 1.2, [5, 4]); f.fn((z) => -Math.exp(-z), c.ink3, 1.2, [5, 4]);
      f.fn((z) => Math.exp(-z) * Math.cos(z), c.main, 2.4, null, 600);
      f.dot(1, Math.exp(-1), c.acc, 5); f.text("1/e", 1.08, Math.exp(-1) + 0.05, c.acc);
      const lam0 = 3e8 / fq;
      S.out(`${name} (σ = ${sig.toExponential(2)} S/m), 진동수 ${fq >= 1e9 ? fq / 1e9 + " GHz" : fq >= 1e6 ? fq / 1e6 + " MHz" : fq >= 1e3 ? fq / 1e3 + " kHz" : fq + " Hz"}\n표피 깊이 δ = √(2/μ₀σω) = ${fmt(d)}\n깊이 δ에서 진폭 1/e = 37%, 세기 13.5%. 5δ = ${fmt(5 * d)}에서 세기 ${(Math.exp(-10) * 100).toExponential(1)}%\n도체 속 파장 2πδ = ${fmt(2 * Math.PI * d)} (진공 파장 ${fmt(lam0)})`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 직사각형 도파관의 TE 모드 (07-01) */
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

  /* 4. 충전하는 축전기의 변위 전류와 자기장 (04-01) */
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

  /* 5. 지연: 진동하는 근원의 신호가 거리 r까지 r/c 늦게 도착한다 (06-01) */
  (() => {
    const S = QSim.card("lab-p9-retard"); if (!S) return;
    const [cv1, cv2] = S.$$("canvas");
    let t = 0;
    function draw() {
      const c = C(), fq = S.val("f") * 1e6, r = S.val("r"), w = 2 * Math.PI * fq, lam = 3e8 / fq, T = 1 / fq, d = r / 3e8;
      const L = 10, v = QSim.view(cv1, 0.5), W = v.W, H = v.H, g = v.g, sc = Math.min(W, 2 * H) / (2 * L), cx = W / 2, cy = H / 2;
      const N = 4; for (let px = 0; px < W; px += N) for (let py = 0; py < H; py += N) {
        const x = (px - cx) / sc, y = (cy - py) / sc, s = Math.hypot(x, y); if (s < 0.3) continue;
        const u = Math.cos(w * (t - s / 3e8)) / Math.max(1, s);
        g.fillStyle = u >= 0 ? `rgba(75,79,224,${(0.6 * u).toFixed(3)})` : `rgba(242,179,61,${(-0.6 * u).toFixed(3)})`; g.fillRect(px, py, N, N);
      }
      g.fillStyle = c.warn; g.beginPath(); g.arc(cx, cy, 5, 0, 7); g.fill();
      g.fillStyle = c.ink; g.beginPath(); g.arc(cx + r * sc, cy, 5, 0, 7); g.fill();
      g.font = "12px sans-serif"; g.fillStyle = c.ink2; g.fillText("근원", cx - 14, cy - 10); g.fillText("관찰자", cx + r * sc - 18, cy - 10); g.fillText(`가로 ±${L} m`, 6, H - 6);
      const v2 = QSim.view(cv2, 0.34), h = QSim.frame(v2, { x0: 0, x1: 3 * T * 1e9, y0: -1.2, y1: 1.2, xl: "t (ns)", yl: "" }); h.axes();
      h.fn((s) => Math.cos(w * s * 1e-9), c.warn, 2, [6, 4]);
      h.fn((s) => s * 1e-9 < d ? 0 : Math.cos(w * (s * 1e-9 - d)), c.main, 2.4, null, 600);
      h.path([[d * 1e9, -1.2], [d * 1e9, 1.2]], c.ink3, 1, [3, 4]);
      const cyc = r / lam, lag = (cyc % 1) * 360;
      S.out(`진동수 ${S.val("f")} MHz, 파장 λ = c/f = ${lam.toFixed(2)} m, 관찰자 거리 ${r} m\n도착 지연 r/c = ${(d * 1e9).toFixed(2)} ns = 주기의 ${cyc.toFixed(2)}배\n한 주기 안으로 줄인 위상 차 ${lag.toFixed(0)}°${Math.abs(lag) < 1 || Math.abs(lag - 360) < 1 ? " (같은 위상)" : Math.abs(lag - 180) < 1 ? " (반대 위상)" : ""}\n아래: 빨간 점선이 근원의 신호, 파랑이 관찰자가 받는 신호(크기는 맞춰 그림)`);
    }
    const Lp = QSim.loop((dt) => { t += dt * 2e-9; draw(); }).watch(cv1);
    QSim.playButton(S.$(".play"), Lp);
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
