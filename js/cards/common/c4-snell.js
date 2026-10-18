/* 공통4 실습: 굴절과 전반사 (10-01) */
(() => {
  "use strict";
  const S = QSim.card("lab-c4-snell"); if (!S) return;
  const cv = S.$("canvas");
  const fres = (n1, n2, i) => { const st = (n1 / n2) * Math.sin(i); if (st >= 1) return 1; const t = Math.asin(st), ci = Math.cos(i), ct = Math.cos(t); const rs = (n1 * ci - n2 * ct) / (n1 * ci + n2 * ct), rp = (n2 * ci - n1 * ct) / (n2 * ci + n1 * ct); return (rs * rs + rp * rp) / 2; };
  function draw() {
    const C = QSim.col(), v = QSim.view(cv, 0.7), n1 = S.val("n1"), n2 = S.val("n2"), i = (S.val("th") * Math.PI) / 180;
    const f = QSim.frame(v, { x0: -1.4, x1: 1.4, y0: -1, y1: 1, equal: true, pad: 2 }), g = v.g;
    g.fillStyle = C.soft; g.globalAlpha = Math.min(0.6, (n1 - 1) * 0.35); g.fillRect(f.X(-1.4), f.Y(1), f.X(1.4) - f.X(-1.4), f.Y(0) - f.Y(1));
    g.globalAlpha = Math.min(0.6, (n2 - 1) * 0.35); g.fillRect(f.X(-1.4), f.Y(0), f.X(1.4) - f.X(-1.4), f.Y(-1) - f.Y(0)); g.globalAlpha = 1;
    f.path([[-1.4, 0], [1.4, 0]], C.ink2, 1.5); f.path([[0, -1], [0, 1]], C.ink3, 1, [4, 4]);
    f.text(`n₁ = ${n1.toFixed(2)}`, -1.35, 0.88, C.ink2); f.text(`n₂ = ${n2.toFixed(2)}`, -1.35, -0.92, C.ink2);
    const R = fres(n1, n2, i), st = (n1 / n2) * Math.sin(i), tir = st >= 1;
    const ray = (x1, y1, x2, y2, a, col) => { g.save(); g.globalAlpha = Math.max(0.08, a); f.path([[x1, y1], [x2, y2]], col, 3); g.restore(); };
    ray(-Math.sin(i), Math.cos(i), 0, 0, 1, C.acc);
    ray(0, 0, Math.sin(i), Math.cos(i), R, C.acc);
    let s = "";
    if (!tir) { const t = Math.asin(st); ray(0, 0, Math.sin(t), -Math.cos(t), 1 - R, C.main); s = `굴절각 θ₂ = ${(t * 180 / Math.PI).toFixed(1)}°   (n₁ sinθ₁ = ${(n1 * Math.sin(i)).toFixed(3)} = n₂ sinθ₂)`; }
    else s = "전반사: 굴절하는 빛이 없고 모두 반사된다";
    const crit = n1 > n2 ? `임계각 θc = sin⁻¹(n₂/n₁) = ${(Math.asin(n2 / n1) * 180 / Math.PI).toFixed(1)}°` : "n₁ ≤ n₂이므로 전반사는 일어나지 않는다";
    S.out(`입사각 θ₁ = ${S.val("th")}°   ${s}\n반사되는 비율 약 ${(100 * R).toFixed(1)}% (선의 진하기)   ${crit}\n브루스터 각 tan⁻¹(n₂/n₁) = ${(Math.atan(n2 / n1) * 180 / Math.PI).toFixed(1)}°`);
  }
  S.$$(".preset").forEach((b) => b.addEventListener("click", () => { const [a, c] = b.dataset.n.split(","); S.$("[name=n1]").value = a; S.$("[name=n2]").value = c; S.show(); draw(); }));
  S.on(draw); QSim.redrawOn(draw); draw();
})();
