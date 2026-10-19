/* 기계2 고체역학 4단원: 속이 찬 축과 속이 빈 축의 전단 응력 분포 (04-01) */
(() => {
  "use strict";
  const S = QSim.card("card-me-hollow"); if (!S) return;
  const [cv] = S.$$("canvas"), G = 80000; // MPa
  function draw() {
    // 단위: 토크 kN·m → N·mm, 길이 mm, 응력 MPa
    const c = QSim.col(), T = S.val("T") * 1e6, d = S.val("do"), k = S.val("k"), di = d * k, L = 1000;
    const J = (Math.PI * (d ** 4 - di ** 4)) / 32, A = (Math.PI * (d * d - di * di)) / 4;
    const tmax = (T * d / 2) / J, tin = (T * di / 2) / J, phi = (T * L) / (G * J);
    // 같은 넓이의 속이 찬 축
    const ds = Math.sqrt((4 * A) / Math.PI), Js = (Math.PI * ds ** 4) / 32, tsolid = (T * ds / 2) / Js;
    const v = QSim.view(cv, 0.6), g = v.g, W = v.W, H = v.H;
    // 왼쪽: 단면 그림
    const R = Math.min(W * 0.2, H * 0.38), cx = W * 0.24, cy = H * 0.5, sc = R / 60;
    g.fillStyle = c.soft; g.beginPath(); g.arc(cx, cy, (d / 2) * sc, 0, 7); g.arc(cx, cy, (di / 2) * sc, 0, 7, true); g.fill("evenodd");
    g.strokeStyle = c.ink2; g.beginPath(); g.arc(cx, cy, (d / 2) * sc, 0, 7); g.stroke();
    if (di > 0) { g.beginPath(); g.arc(cx, cy, (di / 2) * sc, 0, 7); g.stroke(); }
    // 전단 응력 화살표 (원주 방향, 반지름에 비례)
    const amax = R * 0.45;
    for (let a = 0; a < 8; a++) {
      const th = (a * Math.PI) / 4;
      for (const rr of [di / 2 + (d - di) * 0.15, (di + d) / 4, d / 2 * 0.97]) {
        if (rr <= di / 2) continue;
        const x = cx + rr * sc * Math.cos(th), y = cy - rr * sc * Math.sin(th), len = amax * (rr / (d / 2)) * 0.45;
        const ux = -Math.sin(th), uy = -Math.cos(th);
        g.strokeStyle = g.fillStyle = c.warn; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + ux * len, y + uy * len); g.stroke();
      }
    }
    g.lineWidth = 1;
    // 오른쪽: 반지름을 따른 τ 분포
    const x0 = W * 0.52, x1 = W - 16, y0 = H * 0.85, y1 = H * 0.12;
    const tScale = Math.max(tmax, tsolid) * 1.1, X = (r) => x0 + (r / 60) * (x1 - x0), Y = (t) => y0 - (t / tScale) * (y0 - y1);
    g.strokeStyle = c.ink3; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y0); g.moveTo(x0, y0); g.lineTo(x0, y1); g.stroke();
    g.fillStyle = c.ink3; g.font = "11px " + getComputedStyle(document.documentElement).getPropertyValue("--f-mono");
    g.fillText("ρ (mm)", x1 - 40, y0 + 14); g.fillText("τ (MPa)", x0 + 4, y1 - 2);
    [0, 20, 40, 60].forEach((r) => g.fillText(String(r), X(r) - 6, y0 + 14));
    // 같은 넓이 속이 찬 축 (점선)
    g.setLineDash([5, 4]); g.strokeStyle = c.ink3; g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(ds / 2), Y(tsolid)); g.stroke(); g.setLineDash([]);
    g.strokeStyle = c.warn; g.lineWidth = 2.5; g.beginPath(); g.moveTo(X(di / 2), Y(tin)); g.lineTo(X(d / 2), Y(tmax)); g.stroke(); g.lineWidth = 1;
    g.fillStyle = c.ink2; g.fillText(`${tmax.toFixed(1)}`, X(d / 2) - 10, Y(tmax) - 6);
    S.out(`J = ${J.toFixed(0)} mm⁴, 넓이 ${A.toFixed(0)} mm² (같은 넓이 속이 찬 축의 지름 ${ds.toFixed(1)} mm)\n최대 전단 응력 τmax = Tr/J = ${tmax.toFixed(1)} MPa${di > 0 ? `, 안쪽 면 τ = ${tin.toFixed(1)} MPa` : ""}\n같은 넓이(같은 무게) 속이 찬 축이면 τmax = ${tsolid.toFixed(1)} MPa → 관이 ${(tsolid / tmax).toFixed(2)}배 유리\n길이 1 m, G = 80 GPa일 때 비틀림각 φ = ${(phi * 180 / Math.PI).toFixed(2)}°`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();
