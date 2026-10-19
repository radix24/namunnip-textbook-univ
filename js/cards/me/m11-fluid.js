/* 기계11 2단원: 균일 흐름 + 더블릿 + 와류 = 회전 원기둥 주위 흐름 (02-01) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-potential"); if (!S) return;
  const [cv1, cv2] = S.$$("canvas");
  const R = 1, U = 1;
  function draw() {
    const c = QSim.col(), g = S.val("g"), G = g * 4 * Math.PI * U * R; // 시계 방향 순환, 4πUR 단위
    // 복소 속도 u − iv = U(1 − R²/z²) + iΓ/(2πz)
    const vel = (x, y) => {
      const r2 = x * x + y * y, re = (x * x - y * y) / (r2 * r2), im = (-2 * x * y) / (r2 * r2); // 1/z² = (x² − y² − 2ixy)/r⁴
      let wr = U * (1 - R * R * re), wi = -U * R * R * im;
      wr += (G / (2 * Math.PI)) * (y / r2); wi += (G / (2 * Math.PI)) * (x / r2); // i/z = (y + ix)/r²
      return [wr, -wi];
    };
    const v1 = QSim.view(cv1, 0.62), f = QSim.frame(v1, { x0: -3, x1: 3, y0: -2.2, y1: 2.2, xl: "", yl: "", pad: 10, equal: true });
    for (let k = -10; k <= 10; k++) {
      const y0 = k * 0.2; let x = -3, y = y0; const pts = [[x, y]];
      for (let i = 0; i < 900; i++) {
        const step = (px, py) => { const [u, v] = vel(px, py), s = Math.hypot(u, v) || 1; return [u / s, v / s]; };
        const [a1, b1] = step(x, y), [a2, b2] = step(x + 0.01 * a1, y + 0.01 * b1), [a3, b3] = step(x + 0.01 * a2, y + 0.01 * b2), [a4, b4] = step(x + 0.02 * a3, y + 0.02 * b3);
        x += (0.02 / 6) * (a1 + 2 * a2 + 2 * a3 + a4); y += (0.02 / 6) * (b1 + 2 * b2 + 2 * b3 + b4);
        if (x * x + y * y < R * R * 1.0004 || x > 3 || Math.abs(y) > 2.3) break;
        if (Math.hypot(...vel(x, y)) < 0.01) break;
        pts.push([x, y]);
      }
      f.path(pts, k === 0 ? c.acc : c.main, k === 0 ? 1.8 : 1.1);
    }
    const circ = []; for (let i = 0; i <= 90; i++) circ.push([R * Math.cos((i / 90) * 2 * Math.PI), R * Math.sin((i / 90) * 2 * Math.PI)]);
    f.path(circ, c.ink, 2.5);
    // 정체점: 표면 sinθ = −Γ/(4πUR) = −g
    const st = [];
    if (g <= 1) { const th = Math.asin(-g); st.push([R * Math.cos(th), R * Math.sin(th)], [-R * Math.cos(th), R * Math.sin(th)]); }
    else { const r = (R * (g + Math.sqrt(g * g - 1))); st.push([0, -r]); } // 표면 밖 아래쪽 정체점 (θ = −90°)
    st.forEach(([sx, sy]) => f.dot(sx, sy, c.warn, 5));
    // 표면 압력 계수
    const Cp = (th) => 1 - Math.pow(-2 * Math.sin(th) - 2 * g, 2);
    const v2 = QSim.view(cv2, 0.4), f2 = QSim.frame(v2, { x0: 0, x1: 360, y0: -Math.max(3, Math.pow(2 + 2 * g, 2) - 1) - 0.5, y1: 1.5, xl: "θ (°)", yl: "Cp", pad: 34 });
    f2.axes();
    f2.fn((d) => Cp((d * Math.PI) / 180), c.main, 2);
    const cpmin = 1 - Math.pow(2 + 2 * g, 2);
    S.out(`균일 흐름 U = 1, 원기둥 반지름 R = 1, 시계 방향 순환 Γ = ${g.toFixed(2)} × 4πUR = ${G.toFixed(2)}\n${g <= 1 ? `표면 정체점 θ = ${((Math.asin(-g) * 180) / Math.PI).toFixed(1)}°, ${(180 - (Math.asin(-g) * 180) / Math.PI).toFixed(1)}° (빨간 점)` : "정체점이 표면을 떠나 원기둥 아래 흐름 속에 있음"}\n표면 최대 속도 ${(2 + 2 * g).toFixed(2)}U (맨 위), 최소 Cp ${cpmin.toFixed(2)}\n단위 길이당 양력 ρUΓ = ${G.toFixed(2)} (ρ = 1, U = 1 단위), 항력 0 (앞뒤 압력 대칭)`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();

/* 기계11 응용유체역학: 펌프 곡선과 시스템 곡선의 운전점 (01-02) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-pumpop"); if (!S) return;
  const [cv] = S.$$("canvas");
  const D = 0.05, L = 100, A = (Math.PI * D * D) / 4, rr = 0.045 / 50, nu = 1e-6, K0 = 5.3, eta = 0.7;
  const cb = (Re) => { if (Re < 2300) return 64 / Math.max(Re, 1); let f = 0.02; for (let i = 0; i < 40; i++) f = Math.pow(-2 * Math.log10(rr / 3.7 + 2.51 / (Re * Math.sqrt(f))), -2); return f; };
  const Hsys = (Q, dz, Kv) => { const V = Q / A; return dz + ((cb((V * D) / nu) * L) / D + K0 + Kv) * (V * V) / 19.62; };
  const Hp = (Q, n) => 45 * n * n - 6.0e5 * Q * Q; // 상사 법칙: 체절 수두 ∝ N²
  const op = (dz, Kv, n) => { if (Hp(0, n) <= dz) return 0; let lo = 0, hi = 0.02; for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (Hp(m, n) > Hsys(m, dz, Kv)) lo = m; else hi = m; } return lo; };
  const pw = (Q, H) => (998 * 9.81 * Q * H) / eta / 1000;
  function draw() {
    const c = QSim.col(), dz = S.val("dz"), Kv = S.val("Kv"), n = S.val("n") / 100;
    const Q = op(dz, Kv, n), H = Hp(Q, n);
    const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: 0, x1: 9, y0: 0, y1: 50, xl: "Q (L/s)", yl: "H (m)", pad: 34 });
    f.axes();
    f.fn((q) => Hp(q / 1000, 1), c.ink3, 1.5, [4, 3]);
    f.fn((q) => Hp(q / 1000, n), c.main, 2.5);
    f.fn((q) => Hsys(q / 1000, dz, 0), c.ink3, 1.5, [2, 3]);
    f.fn((q) => Hsys(q / 1000, dz, Kv), c.acc, 2.5);
    if (Q > 0) f.dot(Q * 1000, H, c.warn, 6);
    // 같은 유량을 다른 방법으로: 회전수만 조절(밸브 전개)했을 때 필요한 회전수와 동력
    let msg = "";
    if (Q > 0) {
      const Hneed = Hsys(Q, dz, 0), nReq = Math.sqrt((Hneed + 6.0e5 * Q * Q) / 45);
      msg = `\n같은 유량을 밸브를 활짝 연 채 회전수로만 맞추면: 회전수 ${(nReq * 100).toFixed(0)}%, 수두 ${Hneed.toFixed(1)} m, 축 동력 약 ${pw(Q, Hneed).toFixed(2)} kW (효율 일정 가정)`;
    }
    S.out(`정수두 ${dz} m, 추가 밸브 손실 계수 ${Kv}, 회전수 ${(n * 100).toFixed(0)}% (지름 50 mm, 길이 100 m, ΣK 5.3 배관, 펌프 효율 70%)\n운전점 ${Q > 0 ? `Q = ${(Q * 1000).toFixed(2)} L/s, H = ${H.toFixed(1)} m, 축 동력 ${pw(Q, H).toFixed(2)} kW` : "없음: 펌프 체절 수두가 정수두보다 낮아 물이 올라가지 않음"}${Kv > 0 && Q > 0 ? `, 밸브에서 버리는 수두 ${(H - Hsys(Q, dz, 0)).toFixed(1)} m` : ""}${msg}`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();
