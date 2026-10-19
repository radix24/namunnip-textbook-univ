/* 기계2 고체역학 3단원: 두 벽 사이의 봉 — 부정정 축하중과 열응력 (03-02, 03-03) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-wallbar"); if (!S) return;
  const [c1, c2] = S.$$("canvas");
  const MAT = { steel: { n: "강철", E: 200000, al: 12e-6 }, al: { n: "알루미늄", E: 70000, al: 23e-6 }, cu: { n: "구리", E: 110000, al: 17e-6 } };
  const L = 1000, d = 25, A = Math.PI * d * d / 4; // mm, mm²
  function solve() {
    const m1 = MAT[S.val("m1")], m2 = MAT[S.val("m2")], a = S.val("a"), b = L - a;
    const P = S.val("P") * 1000, g = S.val("gap"), dT = S.val("dT"), stuck = S.val("stuck");
    const f1 = a / (m1.E * A), f2 = b / (m2.E * A), dTh = m1.al * dT * a + m2.al * dT * b;
    const uFree = P * f1 + dTh; // B를 막지 않았을 때 오른쪽 끝의 변위
    let RB = 0, contact = false;
    if (stuck) { RB = (P * f1 + dTh) / (f1 + f2); contact = true; }
    else if (uFree > g) { RB = (P * f1 + dTh - g) / (f1 + f2); contact = true; }
    const N1 = P - RB, N2 = -RB, RA = P - RB;
    const uC = N1 * f1 + m1.al * dT * a, uB = uC + N2 * f2 + m2.al * dT * b;
    return { m1, m2, a, b, P, g, dT, stuck, RB, RA, N1, N2, uC, uB, uFree, contact };
  }
  function draw() {
    const c = QSim.col(), s = solve();
    let v = QSim.view(c1, 0.3), f = QSim.frame(v, { x0: -80, x1: L + 120, y0: -60, y1: 60, pad: 4 }), G = v.g;
    const wall = (x, w) => { G.fillStyle = c.ink3; G.fillRect(f.X(x), f.Y(50), f.X(x + w) - f.X(x), f.Y(-50) - f.Y(50)); };
    wall(-30, 30); wall(L + (s.stuck ? 0 : s.g * 40), 30);
    const col = (m) => (m === MAT.steel ? c.soft : m === MAT.al ? "#d8dde6" : "#f0cfa8");
    G.fillStyle = col(s.m1); G.fillRect(f.X(0), f.Y(18), f.X(s.a) - f.X(0), f.Y(-18) - f.Y(18));
    G.fillStyle = col(s.m2); G.fillRect(f.X(s.a), f.Y(18), f.X(L) - f.X(s.a), f.Y(-18) - f.Y(18));
    G.strokeStyle = c.ink2; G.strokeRect(f.X(0), f.Y(18), f.X(L) - f.X(0), f.Y(-18) - f.Y(18));
    if (s.P !== 0) f.arrow(s.a - Math.sign(s.P) * 120, 34, Math.sign(s.P) * 115, 0, c.acc, `P = ${(s.P / 1000).toFixed(0)} kN`);
    f.text(s.m1.n, s.a / 2, -40, c.ink2, "center"); f.text(s.m2.n, (s.a + L) / 2, -40, c.ink2, "center");
    f.text(s.stuck ? "B 붙음" : `틈 ${s.g.toFixed(2)} mm (40배 확대)`, L + 60, 54, c.ink3, "center");
    // 축력 선도
    const Nm = Math.max(10, Math.abs(s.N1), Math.abs(s.N2)) / 1000 * 1.25;
    v = QSim.view(c2, 0.32); f = QSim.frame(v, { x0: 0, x1: L, y0: -Nm, y1: Nm, xl: "x (mm)", yl: "N (kN)", pad: 34 }); f.axes();
    f.path([[0, s.N1 / 1000], [s.a, s.N1 / 1000], [s.a, s.N2 / 1000], [L, s.N2 / 1000]], c.main, 2.5);
    S.out(`${s.contact ? "B와 닿음" : "B와 닿지 않음(정정)"}: 반력 R_A = ${(s.RA / 1000).toFixed(2)} kN, R_B = ${(s.RB / 1000).toFixed(2)} kN (둘 다 하중과 반대 방향을 양으로)\n축력 N₁ = ${(s.N1 / 1000).toFixed(2)} kN (${s.m1.n}, 응력 ${(s.N1 / A).toFixed(1)} MPa), N₂ = ${(s.N2 / 1000).toFixed(2)} kN (${s.m2.n}, 응력 ${(s.N2 / A).toFixed(1)} MPa)\n하중점 C의 변위 ${s.uC.toFixed(3)} mm, 오른쪽 끝 B의 변위 ${s.uB.toFixed(3)} mm (B를 막지 않았다면 ${s.uFree.toFixed(3)} mm)`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();
