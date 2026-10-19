/* 수학7 탐구: 넓이 함수 F(x) = ∫ₐˣ f 의 기울기는 높이 f(x) — 폭 h의 띠의 넓이 ÷ h */
(() => {
  "use strict";
  const S = MKit.setup("card-m7-ftc", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const FN = {
    wave: { f: (t) => 1 + 0.6 * Math.sin(2 * t), tex: "1 + 0.6 sin 2t" },
    jump: { f: (t) => (t < 1.5 ? 0.5 : 1.5), tex: "계단 (t = 1.5에서 뜀)" },
    lin: { f: (t) => 0.5 * t, tex: "t/2" },
  };
  const integ = (f, a, b, n = 2000) => { let s = 0; const h = (b - a) / n; for (let i = 0; i < n; i++) s += f(a + (i + 0.5) * h); return s * h; };
  function draw() {
    const c = QSim.col(), g = v.g, F = FN[k.val("fn")], x = k.val("x"), h = Math.pow(10, -k.val("lh"));
    const half = v.W / 2;
    // 왼쪽: f와 넓이
    g.save();
    const fl = QSim.frame({ g, W: half, H: v.H }, { x0: 0, x1: 3, y0: 0, y1: 2, pad: 24, xl: "t" });
    fl.axes();
    g.fillStyle = c.soft; g.globalAlpha = 0.6; g.beginPath(); g.moveTo(fl.X(0), fl.Y(0));
    for (let i = 0; i <= 200; i++) { const t = (x * i) / 200; g.lineTo(fl.X(t), fl.Y(F.f(t))); }
    g.lineTo(fl.X(x), fl.Y(0)); g.closePath(); g.fill(); g.globalAlpha = 1;
    const hv = Math.max(h, 0.02);
    g.fillStyle = c.warn; g.globalAlpha = 0.5; g.fillRect(fl.X(x), fl.Y(F.f(x)), fl.X(x + hv) - fl.X(x), fl.Y(0) - fl.Y(F.f(x))); g.globalAlpha = 1;
    fl.fn(F.f, c.ink, 2, null, 600);
    g.restore();
    // 오른쪽: F와 접선
    g.save(); g.translate(half, 0);
    const Fx = (t) => integ(F.f, 0, t, 400);
    const fr = QSim.frame({ g, W: half, H: v.H }, { x0: 0, x1: 3, y0: 0, y1: 4, pad: 24, xl: "x", yl: "F(x)" });
    fr.axes();
    fr.fn(Fx, c.main, 2, null, 150);
    const q = (integ(F.f, x, x + h, 400)) / h, Fv = Fx(x);
    fr.path([[x - 1, Fv - q], [x + 1, Fv + q]], c.warn, 1.5);
    fr.dot(x, Fv, c.warn, 5);
    g.restore();
    g.strokeStyle = c.rule; g.beginPath(); g.moveTo(half, 6); g.lineTo(half, v.H - 6); g.stroke();
    k.out(`f(t) = ${F.tex}, x = ${fmt(x, 2)}, h = ${h.toExponential(0)}\n(F(x + h) − F(x))/h = ${fmt(q, 5)} · f(x) = ${fmt(F.f(x), 5)}` + (k.val("fn") === "jump" && Math.abs(x - 1.5) < 0.01 ? "\n뜀이 있는 점: 오른쪽과 왼쪽 차분몫이 다릅니다(F는 여기서 미분 불가능)" : ""));
  }
  S.redraw();
})();
