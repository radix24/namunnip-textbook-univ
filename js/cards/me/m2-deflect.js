/* 기계2 고체역학 7단원: 보의 처짐 곡선 — 외팔보, 단순보, 받침 외팔보 (07-01, 07-02) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-deflect"); if (!S) return;
  const [c1, c2] = S.$$("canvas");
  const N = 400;
  // 수치 적분: M(x)를 구하고 v'' = M/EI를 두 번 적분해 경계 조건을 맞춘다 (단위 N, mm)
  function solve() {
    const type = S.val("type"), L = S.val("L") * 1000, P = S.val("P") * 1000, w = S.val("w"), a = S.val("a") / 100 * L;
    const E = S.val("E") * 1000, h = S.val("h"), b = 50, I = (b * h ** 3) / 12, EI = E * I, dx = L / N;
    // 하중 정보로 정정 보의 M(x)을 만든다
    const Mcant = (x, Pp, ww, aa, Rb) => { // 외팔보(왼쪽 고정): 오른쪽 조각으로 계산. Rb는 끝의 위 방향 반력
      let m = -ww * (L - x) ** 2 / 2 + Rb * (L - x); if (x < aa) m -= Pp * (aa - x); return m; };
    const Mss = (x, Pp, ww, aa) => { const RA = Pp * (L - aa) / L + ww * L / 2; let m = RA * x - ww * x * x / 2; if (x > aa) m -= Pp * (x - aa); return m; };
    const integ = (Mf) => { // 왼쪽 끝 v = 0, v' = θ0에서 시작하는 처짐 (θ0은 나중에 맞춤)
      const vp = [0], v = [0];
      for (let i = 1; i <= N; i++) { const x0 = (i - 1) * dx, x1 = i * dx; vp.push(vp[i - 1] + (Mf(x0) + Mf(x1)) / 2 / EI * dx); v.push(v[i - 1] + (vp[i - 1] + vp[i]) / 2 * dx); }
      return { vp, v };
    };
    let v, Mf, R = {};
    if (type === "cant") { Mf = (x) => Mcant(x, P, w, a, 0); v = integ(Mf).v; }
    else if (type === "ss") { Mf = (x) => Mss(x, P, w, a); const r = integ(Mf); const th = -r.v[N] / L; v = r.v.map((y, i) => y + th * i * dx); }
    else { // 받침 외팔보: 끝 반력 Rb를 처짐 0 조건으로 (선형이므로 두 번 풀어 맞춤)
      const v0 = integ((x) => Mcant(x, P, w, a, 0)).v[N], v1 = integ((x) => Mcant(x, 0, 0, a, 1)).v[N];
      const Rb = -v0 / v1; R.Rb = Rb; Mf = (x) => Mcant(x, P, w, a, Rb); v = integ(Mf).v;
    }
    let vmax = 0, xmax = 0, Mmax = 0; for (let i = 0; i <= N; i++) { if (Math.abs(v[i]) > Math.abs(vmax)) { vmax = v[i]; xmax = i * dx; } const m = Mf(i * dx); if (Math.abs(m) > Math.abs(Mmax)) Mmax = m; }
    return { type, L, P, w, a, EI, I, h, b, v, dx, vmax, xmax, Mmax, R, Mf };
  }
  function draw() {
    const c = QSim.col(), s = solve(), Lm = s.L / 1000;
    const vm = Math.max(1, Math.abs(s.vmax)) * 1.3;
    let v = QSim.view(c1, 0.42), f = QSim.frame(v, { x0: -0.05 * Lm, x1: Lm * 1.05, y0: -vm, y1: vm * 0.45, xl: "x (m)", yl: "v (mm)", pad: 34 }); f.axes();
    f.path(s.v.map((y, i) => [(i * s.dx) / 1000, y]), c.main, 3);
    f.dot(s.xmax / 1000, s.vmax, c.warn, 5);
    const G = v.g; G.fillStyle = c.ink3;
    if (s.type !== "ss") G.fillRect(f.X(0) - 8, f.Y(vm * 0.4), 8, f.Y(-vm) - f.Y(vm * 0.4));
    else { G.beginPath(); G.moveTo(f.X(0), f.Y(0)); G.lineTo(f.X(0) - 7, f.Y(0) + 12); G.lineTo(f.X(0) + 7, f.Y(0) + 12); G.fill(); }
    if (s.type !== "cant") { G.beginPath(); G.arc(f.X(Lm), f.Y(0) + 7, 6, 0, 7); G.stroke(); }
    if (s.P > 0) f.arrow(s.a / 1000, vm * 0.4, 0, -vm * 0.3, c.acc, "P");
    // 굽힘 모멘트 선도
    const Ms = []; let Mm = 1; for (let i = 0; i <= N; i++) { const m = s.Mf(i * s.dx) / 1e6; Ms.push([(i * s.dx) / 1000, m]); Mm = Math.max(Mm, Math.abs(m)); }
    v = QSim.view(c2, 0.3); f = QSim.frame(v, { x0: 0, x1: Lm, y0: -Mm * 1.2, y1: Mm * 1.2, xl: "x (m)", yl: "M (kN·m)", pad: 34 }); f.axes(); f.path(Ms, c.acc, 2);
    // 공식과 비교 (하중 하나일 때만)
    let formula = "";
    const L = s.L, EI = s.EI;
    if (s.type === "cant" && s.w === 0 && Math.abs(s.a - L) < 1) formula = `공식 PL³/(3EI) = ${(s.P * L ** 3 / (3 * EI)).toFixed(2)} mm`;
    if (s.type === "cant" && s.P === 0) formula = `공식 wL⁴/(8EI) = ${(s.w * L ** 4 / (8 * EI)).toFixed(2)} mm`;
    if (s.type === "ss" && s.w === 0 && Math.abs(s.a - L / 2) < 1) formula = `공식 PL³/(48EI) = ${(s.P * L ** 3 / (48 * EI)).toFixed(2)} mm`;
    if (s.type === "ss" && s.P === 0) formula = `공식 5wL⁴/(384EI) = ${(5 * s.w * L ** 4 / (384 * EI)).toFixed(2)} mm`;
    if (s.type === "prop" && s.P === 0) formula = `공식 R_B = 3wL/8 = ${(3 * s.w * L / 8 / 1000).toFixed(2)} kN, 최대 처짐 wL⁴/(185EI) = ${(s.w * L ** 4 / (185 * EI)).toFixed(2)} mm`;
    const sig = Math.abs(s.Mmax) * (s.h / 2) / s.I;
    S.out(`단면 폭 50 mm × 높이 ${s.h} mm, I = ${(s.I / 1e6).toFixed(3)}×10⁶ mm⁴, EI = ${(s.EI / 1e12).toFixed(3)}×10¹² N·mm²\n최대 처짐 ${Math.abs(s.vmax).toFixed(2)} mm (x = ${(s.xmax / 1000).toFixed(2)} m), 길이의 1/${(s.L / Math.max(1e-9, Math.abs(s.vmax))).toFixed(0)}${formula ? "   " + formula : ""}\n최대 |M| = ${(Math.abs(s.Mmax) / 1e6).toFixed(2)} kN·m, 최대 굽힘 응력 ${sig.toFixed(1)} MPa${s.R.Rb !== undefined ? `, 롤러 반력 R_B = ${(s.R.Rb / 1000).toFixed(2)} kN` : ""}`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();
