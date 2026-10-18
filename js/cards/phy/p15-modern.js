/* 물리15 실습 카드: 은하 회전 곡선, 큐비트 측정 */
(() => {
  "use strict";
  const C = () => QSim.col();

  /* 1. 은하 회전 곡선과 암흑물질 헤일로 (01-02) */
  (() => {
    const S = QSim.card("lab-p15-rotation"); if (!S) return;
    const cv = S.$("canvas");
    const G = 4.30e-6, Md = 6e10, Rd = 3;   // kpc (km/s)^2 / 태양질량
    const Mvis = (r) => Md * (1 - (1 + r / Rd) * Math.exp(-r / Rd));
    const Mhalo = (r, rho, rc) => 4 * Math.PI * rho * rc * rc * (r - rc * Math.atan(r / rc));
    const v = (M, r) => Math.sqrt(Math.max(0, G * M / r));
    let s = 11; const rnd = () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
    const data = []; for (let r = 2; r <= 30; r += 2) { const u = Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd()); data.push([r, v(Mvis(r) + Mhalo(r, 1.5e7, 5), r) + 5 * u]); }
    function draw() {
      const c = C(), rho = S.val("rho") * 1e7, rc = S.val("rc");
      const vv = QSim.view(cv, 0.55), f = QSim.frame(vv, { x0: 0, x1: 32, y0: 0, y1: 260, xl: "r (kpc)", yl: "v (km/s)" }); f.axes();
      f.fn((r) => v(Mvis(r), r), c.acc, 2, [6, 4]);
      f.fn((r) => v(Mhalo(r, rho, rc), r), c.ink3, 2, [3, 3]);
      f.fn((r) => v(Mvis(r) + Mhalo(r, rho, rc), r), c.main, 2.5);
      f.fn((r) => v(Md, r), c.warn, 1.2, [2, 4]);
      data.forEach(([r, y]) => f.dot(r, y, c.ink, 4));
      const chi = data.reduce((a, [r, y]) => a + ((y - v(Mvis(r) + Mhalo(r, rho, rc), r)) / 5) ** 2, 0) / data.length;
      const mt = Mvis(30) + Mhalo(30, rho, rc);
      S.out(`헤일로 중심 밀도 ${(rho / 1e7).toFixed(2)}×10⁷ 태양질량/kpc³, 핵 반지름 ${rc.toFixed(1)} kpc\n30 kpc 안의 질량: 보이는 물질 ${(Mvis(30) / 1e10).toFixed(1)}×10¹⁰, 헤일로 ${(Mhalo(30, rho, rc) / 1e10).toFixed(1)}×10¹⁰ 태양질량 (헤일로 ${(100 * Mhalo(30, rho, rc) / mt).toFixed(0)}%)\n관측점과의 어긋남(평균 제곱, 1이면 잡음 수준): ${chi.toFixed(2)}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 큐비트 측정 통계 (03-01) */
  (() => {
    const S = QSim.card("lab-p15-qubit"); if (!S) return;
    const cv = S.$("canvas");
    let n0 = 0, n1 = 0;
    const p1 = () => { const th = S.val("th") * Math.PI / 180, ph = S.val("ph") * Math.PI / 180; return S.val("basis") === "z" ? Math.sin(th / 2) ** 2 : (1 - Math.sin(th) * Math.cos(ph)) / 2; };
    function draw() {
      const c = C(), p = p1(), N = n0 + n1, th = S.val("th"), ph = S.val("ph"), z = S.val("basis") === "z";
      const vv = QSim.view(cv, 0.45), g = vv.g, W = vv.W, H = vv.H;
      const R = Math.min(H * 0.38, W * 0.18), cx = R + 20, cy = H / 2;
      g.strokeStyle = c.rule; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke(); g.beginPath(); g.ellipse(cx, cy, R, R * 0.3, 0, 0, 7); g.stroke();
      const t = th * Math.PI / 180, pp = ph * Math.PI / 180, x = Math.sin(t) * Math.cos(pp), y = Math.sin(t) * Math.sin(pp), zz = Math.cos(t);
      const sx = cx + R * (y), sy = cy - R * (zz) + R * 0.3 * (-x) * 0.6;
      g.strokeStyle = c.warn; g.lineWidth = 2.5; g.beginPath(); g.moveTo(cx, cy); g.lineTo(sx, sy); g.stroke(); g.fillStyle = c.warn; g.beginPath(); g.arc(sx, sy, 4, 0, 7); g.fill();
      g.fillStyle = c.ink2; g.font = "12px sans-serif"; g.fillText("|0⟩", cx - 8, cy - R - 6); g.fillText("|1⟩", cx - 8, cy + R + 14);
      const bx = W * 0.5, bw = W * 0.16, base = H - 24, top = H * 0.12, sc = base - top;
      const lab = z ? ["0", "1"] : ["+", "−"];
      [[1 - p, n0], [p, n1]].forEach(([q, k], i) => {
        const x0 = bx + i * (bw + 30), fr = N ? k / N : 0;
        g.fillStyle = c.soft; g.fillRect(x0, base - fr * sc, bw, fr * sc);
        g.strokeStyle = c.main; g.lineWidth = 2; g.beginPath(); g.moveTo(x0 - 4, base - q * sc); g.lineTo(x0 + bw + 4, base - q * sc); g.stroke();
        g.fillStyle = c.ink; g.fillText(`${lab[i]}: ${k}`, x0, base + 16);
      });
      const a = Math.cos(t / 2), b = Math.sin(t / 2);
      S.out(`|ψ⟩ = ${a.toFixed(3)}|0⟩ + ${b.toFixed(3)}e^(i·${ph}°)|1⟩\n${z ? "Z 측정" : "X 측정"}: 이론 확률 ${lab[0]} ${(1 - p).toFixed(3)}, ${lab[1]} ${p.toFixed(3)} (파란 가로선)\n측정 ${N}번: ${lab[0]} ${n0}, ${lab[1]} ${n1}${N ? `, 비율 ${(n1 / N).toFixed(3)} (표준오차 ${Math.sqrt(p * (1 - p) / N).toFixed(3)})` : ""}`);
    }
    const meas = (k) => () => { const p = p1(); for (let i = 0; i < k; i++) { if (Math.random() < p) n1++; else n0++; } draw(); };
    S.$(".m1").addEventListener("click", meas(1)); S.$(".m100").addEventListener("click", meas(100));
    S.$(".reset").addEventListener("click", () => { n0 = n1 = 0; draw(); });
    S.on(() => { n0 = n1 = 0; draw(); }); QSim.redrawOn(draw); draw();
  })();
})();
