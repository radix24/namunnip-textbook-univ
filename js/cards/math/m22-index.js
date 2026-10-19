/* 수학22 탐구: 평면 벡터장의 영점 지표 — 원을 따라 벡터가 도는 횟수 = 안에 든 영점 지표의 합 */
(() => {
  "use strict";
  const S = MKit.setup("card-m22-index", 0.8, draw);
  if (!S) return;
  const { k, v } = S;
  const { fmt } = MKit;
  const mul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
  const conj = (a) => [a[0], -a[1]];
  const FIELDS = {
    source: { name: "원천 (x, y)", f: (z) => z, zeros: [[0, 0, 1]] },
    vortex: { name: "소용돌이 (−y, x)", f: (z) => [-z[1], z[0]], zeros: [[0, 0, 1]] },
    saddle: { name: "안장 (x, −y)", f: (z) => conj(z), zeros: [[0, 0, -1]] },
    z2: { name: "z²", f: (z) => mul(z, z), zeros: [[0, 0, 2]] },
    zb2: { name: "z̄²", f: (z) => conj(mul(z, z)), zeros: [[0, 0, -2]] },
    z3: { name: "z³", f: (z) => mul(z, mul(z, z)), zeros: [[0, 0, 3]] },
    two: { name: "(z − 1)(z + 1)", f: (z) => mul([z[0] - 1, z[1]], [z[0] + 1, z[1]]), zeros: [[1, 0, 1], [-1, 0, 1]] },
    mixed: { name: "(z − 1)(z̄ + 1)", f: (z) => mul([z[0] - 1, z[1]], [z[0] + 1, -z[1]]), zeros: [[1, 0, 1], [-1, 0, -1]] },
  };
  function draw() {
    const c = QSim.col(), Fd = FIELDS[k.val("field")], cx = k.val("cx"), R = k.val("r");
    const F = QSim.frame(v, { x0: -2.5, x1: 2.5, y0: -2, y1: 2, pad: 6, equal: true, xl: "x", yl: "y" });
    F.axes({ noGrid: true });
    const hstep = 0.33;
    for (let x = -2.3; x <= 2.31; x += hstep) for (let y = -1.85; y <= 1.86; y += hstep) {
      const w = Fd.f([x, y]), m = Math.hypot(w[0], w[1]); if (m < 1e-9) continue;
      F.arrow(x, y, (0.24 * w[0]) / m, (0.24 * w[1]) / m, c.ink3);
    }
    const circ = []; for (let i = 0; i <= 160; i++) { const t = (2 * Math.PI * i) / 160; circ.push([cx + R * Math.cos(t), R * Math.sin(t)]); }
    F.path(circ, c.main, 2);
    let total = 0, prev = null, near = false;
    const N = 2000;
    for (let i = 0; i <= N; i++) {
      const t = (2 * Math.PI * i) / N, w = Fd.f([cx + R * Math.cos(t), R * Math.sin(t)]);
      if (Math.hypot(w[0], w[1]) < 1e-6) near = true;
      const ang = Math.atan2(w[1], w[0]);
      if (prev !== null) { let d = ang - prev; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; total += d; }
      prev = ang;
    }
    for (let i = 0; i < 12; i++) {
      const t = (2 * Math.PI * i) / 12, x = cx + R * Math.cos(t), y = R * Math.sin(t), w = Fd.f([x, y]), m = Math.hypot(w[0], w[1]);
      if (m > 1e-9) F.arrow(x, y, (0.32 * w[0]) / m, (0.32 * w[1]) / m, c.acc);
    }
    let inside = 0; const list = [];
    Fd.zeros.forEach(([zx, zy, ind]) => { const d = Math.hypot(zx - cx, zy); const inn = d < R; if (inn) inside += ind; list.push(`(${zx}, ${zy}) 지표 ${ind > 0 ? "+" : ""}${ind}${inn ? " · 원 안" : ""}`); F.dot(zx, zy, inn ? c.warn : c.ink2, 5); });
    const wind = total / (2 * Math.PI);
    k.out(`벡터장 ${Fd.name} · 원: 중심 (${fmt(cx, 2)}, 0), 반지름 ${fmt(R, 2)}\n` +
      (near ? "원이 영점을 지나서 감김수가 정의되지 않습니다.\n" : `원을 한 바퀴 돌 때 벡터가 도는 횟수 = ${fmt(wind, 3)}\n`) +
      `영점: ${list.join(", ")} · 원 안 지표의 합 = ${inside}`);
  }
  S.redraw();
})();
