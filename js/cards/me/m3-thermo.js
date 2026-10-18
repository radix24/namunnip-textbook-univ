/* 기계3 열역학: 공기 표준 사이클 Otto · Diesel · Brayton의 P-v, T-s 선도 (08-01, 08-02) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-cycle"); if (!S) return;
  const [c1, c2] = S.$$("canvas");
  const k = 1.4, R = 0.287, cv = 0.718, cp = 1.005, T1 = 300, P1 = 100, v1 = (R * T1) / P1;
  // 상태량: {P kPa, v m³/kg, T K}. s는 상태 1 기준 cv ln(T/T1) + R ln(v/v1)
  const st = (P, v) => ({ P, v, T: (P * v) / R });
  const sOf = (p) => cv * Math.log(p.T / T1) + R * Math.log(p.v / v1);

  function cycle() {
    const kind = S.val("kind"), T3in = S.val("T3");
    const s1 = st(P1, v1);
    let s2, s3, s4, legs, warn = "";
    if (kind === "brayton") {
      const rp = S.val("rp"), P2 = P1 * rp, T2 = T1 * Math.pow(rp, (k - 1) / k);
      s2 = st(P2, (R * T2) / P2);
      const T3 = Math.max(T3in, T2 + 1); if (T3in <= T2) warn = "최고 온도가 압축 끝 온도보다 낮습니다. T3를 올리세요.";
      s3 = st(P2, (R * T3) / P2);
      const T4 = T3 / Math.pow(rp, (k - 1) / k); s4 = st(P1, (R * T4) / P1);
      legs = ["s", "p", "s", "p"];
    } else {
      const r = S.val("r"), v2 = v1 / r, T2 = T1 * Math.pow(r, k - 1);
      s2 = st((R * T2) / v2, v2);
      if (kind === "otto") {
        const T3 = Math.max(T3in, T2 + 1); if (T3in <= T2) warn = "최고 온도가 압축 끝 온도보다 낮습니다. T3를 올리세요.";
        s3 = st((R * T3) / v2, v2);
        legs = ["s", "v", "s", "v"];
      } else {
        const rc = S.val("rc"); s3 = st(s2.P, v2 * rc);
        legs = ["s", "p", "s", "v"];
      }
      const T4 = s3.T * Math.pow(s3.v / v1, k - 1); s4 = st((R * T4) / v1, v1);
    }
    return { kind, pts: [s1, s2, s3, s4], legs, warn };
  }
  // 두 상태 사이 경로: 등엔트로피(Pv^k 일정), 정압, 정적
  function leg(a, b, type, n = 60) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      if (type === "s") { const v = a.v * Math.pow(b.v / a.v, t); out.push(st(a.P * Math.pow(a.v / v, k), v)); }
      else if (type === "p") out.push(st(a.P, a.v + (b.v - a.v) * t));
      else out.push(st(a.P + (b.P - a.P) * t, a.v));
    }
    return out;
  }
  function draw() {
    const c = QSim.col(), cy = cycle(), [s1, s2, s3, s4] = cy.pts;
    const path = []; cy.pts.forEach((p, i) => path.push(...leg(p, cy.pts[(i + 1) % 4], cy.legs[i])));
    // P-v
    const Pm = Math.max(...path.map((p) => p.P)) * 1.08, vm = Math.max(...path.map((p) => p.v)) * 1.08;
    let v = QSim.view(c1, 0.6), f = QSim.frame(v, { x0: 0, x1: vm, y0: 0, y1: Pm / 1000, xl: "v (m³/kg)", yl: "P (MPa)", pad: 34 }); f.axes();
    f.path(path.map((p) => [p.v, p.P / 1000]), c.main, 2.5);
    cy.pts.forEach((p, i) => { f.dot(p.v, p.P / 1000, c.warn, 4); f.text(String(i + 1), p.v + vm * 0.015, p.P / 1000 + Pm / 1000 * 0.03, c.ink); });
    // T-s
    const ss = path.map(sOf), Tm = Math.max(...path.map((p) => p.T)) * 1.08, smin = Math.min(...ss), smax = Math.max(...ss), pad = (smax - smin) * 0.15 + 0.02;
    v = QSim.view(c2, 0.6); f = QSim.frame(v, { x0: smin - pad, x1: smax + pad, y0: 0, y1: Tm, xl: "s (kJ/kg·K)", yl: "T (K)", pad: 34 }); f.axes();
    f.path(path.map((p, i) => [ss[i], p.T]), c.acc, 2.5);
    cy.pts.forEach((p, i) => { f.dot(sOf(p), p.T, c.warn, 4); f.text(String(i + 1), sOf(p) + (smax - smin) * 0.03, p.T + Tm * 0.03, c.ink); });
    // 열과 일
    let qin, qout;
    if (cy.kind === "otto") { qin = cv * (s3.T - s2.T); qout = cv * (s4.T - s1.T); }
    else if (cy.kind === "diesel") { qin = cp * (s3.T - s2.T); qout = cv * (s4.T - s1.T); }
    else { qin = cp * (s3.T - s2.T); qout = cp * (s4.T - s1.T); }
    const eta = 1 - qout / qin, w = qin - qout, Tmax = Math.max(s3.T, s2.T), carnot = 1 - T1 / Tmax;
    let theory = "";
    if (cy.kind === "otto") theory = `이론식 1 − 1/r^(k−1) = ${((1 - Math.pow(S.val("r"), 1 - k)) * 100).toFixed(1)}%`;
    else if (cy.kind === "diesel") { const r = S.val("r"), rc = S.val("rc"); theory = `이론식 1 − (rc^k − 1)/(k(rc − 1) r^(k−1)) = ${((1 - (Math.pow(rc, k) - 1) / (k * (rc - 1) * Math.pow(r, k - 1))) * 100).toFixed(1)}%`; }
    else theory = `이론식 1 − 1/rp^((k−1)/k) = ${((1 - Math.pow(S.val("rp"), -(k - 1) / k)) * 100).toFixed(1)}%`;
    S.out(`${cy.warn ? cy.warn + "\n" : ""}상태 2: T = ${s2.T.toFixed(0)} K, P = ${(s2.P / 1000).toFixed(2)} MPa   상태 3: T = ${s3.T.toFixed(0)} K   상태 4: T = ${s4.T.toFixed(0)} K\n공급 열 q_in = ${qin.toFixed(0)} kJ/kg, 방출 열 q_out = ${qout.toFixed(0)} kJ/kg, 순일 w = ${w.toFixed(0)} kJ/kg\n열효율 1 − q_out/q_in = ${(eta * 100).toFixed(1)}%   ${theory}\n같은 최저·최고 온도(${T1} K, ${Tmax.toFixed(0)} K)의 Carnot 효율 ${(carnot * 100).toFixed(1)}%`);
    S.$$("[data-for]").forEach((e) => { e.hidden = !e.dataset.for.split(" ").includes(cy.kind); });
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();
