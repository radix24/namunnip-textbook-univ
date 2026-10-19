/* 기계3 열역학 4단원: 밀폐계 제1법칙의 에너지 장부 (04-01) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-energy"); if (!S) return;
  const [cv] = S.$$("canvas");
  // 공기 0.01 kg, 처음 100 kPa, 300 K
  const m = 0.01, R = 0.287, cvv = 0.718, k = 1 + R / cvv, P1 = 100, T1 = 300, V1 = (m * R * T1) / P1;
  function state(proc, r) {
    // r: 등적이면 T2/T1, 나머지는 V2/V1. 경로 점들과 끝 상태, W(계가 한 일), ΔU, Q (kJ)
    const pts = []; let P2, V2, T2, W;
    for (let i = 0; i <= 60; i++) {
      const s = 1 + ((r - 1) * i) / 60;
      if (proc === "v") pts.push([V1, P1 * s]);
      else if (proc === "p") pts.push([V1 * s, P1]);
      else if (proc === "t") pts.push([V1 * s, P1 / s]);
      else pts.push([V1 * s, P1 * Math.pow(s, -k)]);
    }
    if (proc === "v") { V2 = V1; T2 = T1 * r; P2 = P1 * r; W = 0; }
    else if (proc === "p") { V2 = V1 * r; P2 = P1; T2 = T1 * r; W = P1 * (V2 - V1); }
    else if (proc === "t") { V2 = V1 * r; P2 = P1 / r; T2 = T1; W = P1 * V1 * Math.log(r); }
    else { V2 = V1 * r; P2 = P1 * Math.pow(r, -k); T2 = T1 * Math.pow(r, 1 - k); W = (P1 * V1 - P2 * V2) / (k - 1); }
    const dU = m * cvv * (T2 - T1), Q = dU + W;
    return { pts, P2, V2, T2, W, dU, Q };
  }
  function draw() {
    const c = QSim.col(), proc = S.val("proc"), r = S.val("r"), st = state(proc, r);
    const v = QSim.view(cv, 0.55), G = v.g, W0 = v.W;
    // 왼쪽: P-V 선도
    const f = QSim.frame(v, { x0: 0, x1: V1 * 3.2 * 1000, y0: 0, y1: 320, xl: "V (L)", yl: "P (kPa)", pad: 34 });
    G.save(); G.beginPath(); G.rect(0, 0, W0 * 0.6, v.H); G.clip();
    f.axes();
    const L = st.pts.map(([x, y]) => [x * 1000, y]);
    if (proc !== "v") { G.fillStyle = "rgba(75,79,224,.15)"; G.beginPath(); G.moveTo(f.X(L[0][0]), f.Y(0)); L.forEach(([x, y]) => G.lineTo(f.X(x), f.Y(y))); G.lineTo(f.X(L[L.length - 1][0]), f.Y(0)); G.closePath(); G.fill(); }
    f.path(L, c.main, 2.5); f.dot(L[0][0], L[0][1], c.ink, 4); f.dot(L[L.length - 1][0], L[L.length - 1][1], c.warn, 5);
    G.restore();
    // 오른쪽: Q, W, ΔU 막대 (kJ)
    const bx = W0 * 0.66, bw = W0 * 0.08, base = v.H * 0.55, sc = (v.H * 0.4) / 3.5;
    [["Q", st.Q, c.warn], ["W", st.W, c.main], ["ΔU", st.dU, c.acc]].forEach(([lb, val, col], i) => {
      const x = bx + i * bw * 1.4, h = Math.max(-3.5, Math.min(3.5, val)) * sc;
      G.fillStyle = col; G.fillRect(x, base - Math.max(h, 0), bw, Math.abs(h));
      G.fillStyle = c.ink2; G.font = "12px monospace"; G.textAlign = "center";
      G.fillText(lb, x + bw / 2, v.H - 6); G.fillText(val.toFixed(2), x + bw / 2, h >= 0 ? base - h - 4 : base - h + 14);
    });
    G.strokeStyle = c.ink3; G.beginPath(); G.moveTo(bx - 6, base); G.lineTo(bx + bw * 4.2, base); G.stroke(); G.textAlign = "left";
    const name = { v: "등적 가열", p: "등압 팽창", t: "등온 팽창", s: "단열(가역) 팽창" }[proc];
    S.out(`${name}: 공기 0.01 kg, 처음 100 kPa · 300 K · ${(V1 * 1000).toFixed(2)} L → 끝 ${st.P2.toFixed(1)} kPa · ${st.T2.toFixed(1)} K · ${(st.V2 * 1000).toFixed(2)} L\n계가 한 일 W = ${st.W.toFixed(3)} kJ (선도 아래 넓이), 내부 에너지 변화 ΔU = m c_v ΔT = ${st.dU.toFixed(3)} kJ\n들어온 열 Q = ΔU + W = ${st.Q.toFixed(3)} kJ`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();
