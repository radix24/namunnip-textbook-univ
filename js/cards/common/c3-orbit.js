/* 공통3 실습: 위성 발사와 궤도 (08-02). 단위: GM = 1, 출발 반지름 1 → 원 궤도 속력 1, 주기 2π */
(() => {
  "use strict";
  const S = QSim.card("lab-c3-orbit"); if (!S) return;
  const cv = S.$("canvas"), RP = 0.35;
  let path = [], tt = 0, info = null;
  const f = (_, s) => { const r3 = Math.pow(s[0] * s[0] + s[1] * s[1], 1.5); return [s[2], s[3], -s[0] / r3, -s[1] / r3]; };
  function compute() {
    const vf = S.val("vf"), ph = (S.val("ph") * Math.PI) / 180;
    let s = [1, 0, vf * Math.sin(ph), vf * Math.cos(ph)]; // 접선(위쪽) 방향에서 바깥쪽으로 ph만큼
    const E = 0.5 * vf * vf - 1, h = 0.002;
    const a = E < 0 ? -1 / (2 * E) : Infinity, T = E < 0 ? 2 * Math.PI * Math.pow(a, 1.5) : Infinity;
    const tmax = E < 0 ? Math.min(T * 1.002, 400) : 40;
    path = [[1, 0, 0]]; let t = 0, crash = false, rmax = 1, rmin = 1;
    for (let i = 1; t < tmax; i++) {
      s = QSim.rk4(f, t, s, h); t += h; const r = Math.hypot(s[0], s[1]);
      rmax = Math.max(rmax, r); rmin = Math.min(rmin, r);
      if (r < RP) { crash = true; path.push([s[0], s[1], t]); break; }
      if (r > 30) break;
      if (i % 5 === 0) path.push([s[0], s[1], t]);
    }
    info = { E, a, T, crash, rmax, rmin, vf };
    tt = 0;
  }
  function draw() {
    const C = QSim.col(), v = QSim.view(cv, 0.75);
    let ext = info.E < 0 && !info.crash ? Math.max(1.6, info.rmax * 1.1) : 4;
    ext = Math.min(ext, 8);
    const fr = QSim.frame(v, { x0: -ext, x1: ext, y0: -ext * 0.75, y1: ext * 0.75, equal: true, pad: 6 });
    const g = v.g;
    g.fillStyle = C.soft; g.beginPath(); g.arc(fr.X(0), fr.Y(0), fr.X(RP) - fr.X(0), 0, 7); g.fill();
    const circ = []; for (let i = 0; i <= 120; i++) { const q = (i / 120) * 2 * Math.PI; circ.push([Math.cos(q), Math.sin(q)]); }
    fr.path(circ, C.rule, 1, [4, 4]);
    fr.path(path.map((p) => [p[0], p[1]]), C.main, 2);
    const span = path[path.length - 1][2];
    const time = info.E < 0 && !info.crash ? tt % span : Math.min(tt, span);
    let k = 0; while (k < path.length - 1 && path[k + 1][2] <= time) k++;
    fr.dot(path[k][0], path[k][1], C.acc, 6); fr.dot(1, 0, C.ink, 3);
    const kind = info.crash ? "행성에 충돌" : info.E < -1e-9 ? "타원 궤도 (E < 0, 묶여 있음)" : Math.abs(info.E) < 1e-9 ? "포물선 (탈출 경계, E = 0)" : "쌍곡선: 탈출 (E > 0)";
    let s = `v/v원 = ${info.vf.toFixed(2)}   역학적 에너지(단위 질량) E = v²/2 − GM/r = ${info.E.toFixed(3)}\n${kind}`;
    if (info.E < 0 && !info.crash) s += `\n긴반지름 a = ${info.a.toFixed(2)} (원 궤도 = 1), 주기 = 원 궤도의 ${(Math.pow(info.a, 1.5)).toFixed(2)}배 (= a^1.5, 케플러 제3법칙)\n가장 가까울 때 ${info.rmin.toFixed(2)}, 가장 멀 때 ${info.rmax.toFixed(2)}`;
    s += `\n탈출 조건: v ≥ √2·v원 = 1.414·v원`;
    S.out(s);
  }
  const L = QSim.loop((dt) => { tt += dt * 1.6; if (!(info.E < 0 && !info.crash) && tt >= path[path.length - 1][2]) { draw(); return false; } draw(); }).watch(S.root);
  const setBtn = QSim.playButton(S.$(".play"), L, () => { if (!(info.E < 0 && !info.crash) && tt >= path[path.length - 1][2]) tt = 0; });
  S.on(() => { compute(); draw(); });
  QSim.redrawOn(draw); compute(); draw();
})();
