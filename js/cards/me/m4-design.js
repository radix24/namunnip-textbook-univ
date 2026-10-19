/* 기계4 컴퓨터응용기계설계: 브래킷 파라미터 연구 (04-01), STL 해상도 (05-01) */
(() => {
  "use strict";

  /* ── 외팔보 브래킷: δ = 4FL³/(E b t³), 질량 = ρ b t L ── */
  (() => {
    const S = QSim.card("lab-me-param"); if (!S) return;
    const [cv] = S.$$("canvas");
    const MAT = { steel: { n: "강", E: 200000, rho: 7.85 }, al: { n: "알루미늄", E: 70000, rho: 2.7 }, abs: { n: "ABS 플라스틱", E: 2300, rho: 1.05 } };
    const F = 200, LIM = 1.0;
    function draw() {
      const c = QSim.col(), m = MAT[S.val("m")], t = S.val("t"), b = S.val("b"), L = S.val("L");
      const d = (tt) => (4 * F * L ** 3) / (m.E * b * tt ** 3), mass = (tt) => m.rho * (b * tt * L) / 1000; // g (mm³ × g/cm³ / 1000)
      const tmin = Math.cbrt((4 * F * L ** 3) / (m.E * b * LIM));
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 2, x1: 30, y0: 0, y1: 5, xl: "두께 t (mm)", yl: "끝 처짐 δ (mm)", pad: 34 });
      f.axes();
      f.path([[2, LIM], [30, LIM]], c.warn, 1.5, [5, 4]);
      f.fn((x) => Math.min(d(x), 6), c.main, 2.5);
      if (tmin <= 30) f.dot(tmin, LIM, c.acc, 5);
      f.dot(t, Math.min(d(t), 5), d(t) <= LIM ? c.main : c.warn, 6);
      const ok = d(t) <= LIM ? "요구 만족" : "요구 불만족";
      S.out(`${m.n} (E = ${m.E / 1000} GPa, 밀도 ${m.rho} g/cm³), 하중 200 N, 길이 ${L} mm, 폭 ${b} mm, 두께 ${t} mm\n끝 처짐 δ = 4FL³/(E b t³) = ${d(t).toFixed(3)} mm → ${ok} (요구 1.0 mm 이하, 빨간 점선)\n질량 ${mass(t).toFixed(1)} g\n요구를 만족하는 최소 두께 ${tmin.toFixed(2)} mm (초록 점), 그때 질량 ${mass(tmin).toFixed(1)} g`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* ── STL: 원을 정 n각형으로, 화살 높이 s = R(1 − cos(π/n)) ── */
  (() => {
    const S = QSim.card("lab-me-stl"); if (!S) return;
    const [cv] = S.$$("canvas");
    function draw() {
      const c = QSim.col(), R = S.val("R"), tol = Math.pow(10, S.val("lt"));
      const n = Math.max(3, Math.ceil(Math.PI / Math.acos(1 - tol / R))), s = R * (1 - Math.cos(Math.PI / n));
      const tri = 4 * n, kb = (tri * 50 + 84) / 1024; // 원기둥: 옆면 2n + 위아래 2n 삼각형, 이진 STL 50바이트/삼각형
      const v = QSim.view(cv, 0.55), G = v.g, f = QSim.frame(v, { x0: -1.25, x1: 1.25, y0: -1.15, y1: 1.15, equal: true, pad: 4 });
      G.strokeStyle = c.ink3; G.lineWidth = 1.5; G.beginPath(); G.arc(f.X(0), f.Y(0), f.sx, 0, 7); G.stroke();
      const pts = []; for (let i = 0; i <= n; i++) { const a = (2 * Math.PI * i) / n; pts.push([Math.cos(a), Math.sin(a)]); }
      f.path(pts, c.main, 2); if (n <= 64) pts.forEach(([x, y]) => f.dot(x, y, c.main, 2.5));
      // 확대창: 한 변 근처
      const ox = v.W * 0.72, oy = v.H * 0.12, w = v.W * 0.25, h = v.H * 0.3, a0 = Math.PI / n;
      G.save(); G.strokeStyle = c.rule; G.strokeRect(ox, oy, w, h); G.beginPath(); G.rect(ox, oy, w, h); G.clip();
      const zx = (x) => ox + w / 2 + x * (w / 2) / Math.sin(a0) * 0.9, zy = (y) => oy + h * 0.15 + (1 - y) * (h * 0.7) / Math.max(1 - Math.cos(a0), 1e-9);
      G.strokeStyle = c.ink3; G.beginPath(); for (let i = 0; i <= 40; i++) { const a = -a0 + (2 * a0 * i) / 40, X = zx(Math.sin(a)), Y = zy(Math.cos(a)); i ? G.lineTo(X, Y) : G.moveTo(X, Y); } G.stroke();
      G.strokeStyle = c.main; G.lineWidth = 2; G.beginPath(); G.moveTo(zx(-Math.sin(a0)), zy(Math.cos(a0))); G.lineTo(zx(Math.sin(a0)), zy(Math.cos(a0))); G.stroke();
      G.strokeStyle = c.warn; G.beginPath(); G.moveTo(zx(0), zy(1)); G.lineTo(zx(0), zy(Math.cos(a0))); G.stroke();
      G.restore(); G.fillStyle = c.ink2; G.font = "11px sans-serif"; G.fillText("한 변 확대 (빨강: 화살 높이)", ox, oy - 4);
      S.out(`반지름 ${R} mm 원, 허용 편차 ${tol.toPrecision(2)} mm → 정 ${n}각형, 실제 최대 편차 s = ${s.toPrecision(3)} mm\n원기둥 하나의 STL 삼각형 약 ${tri}개, 이진 STL 약 ${kb.toFixed(1)} kB`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
