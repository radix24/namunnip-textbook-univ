/* 물리9 실습 카드 묶음: 헬름홀츠 코일, 이력 고리, 편광, 프레넬 반사, 복사 패턴 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const rng = (s) => () => { s = (s * 1664525 + 1013904223) % 4294967296; return (s + 0.5) / 4294967296; };
  const gauss = (r) => Math.sqrt(-2 * Math.log(r())) * Math.cos(2 * Math.PI * r());
  const deg = Math.PI / 180;

  /* 1. 헬름홀츠 코일의 축 위 자기장 (01-02) */
  (() => {
    const S = QSim.card("lab-p9-helmholtz"); if (!S) return;
    const cv = S.$("canvas");
    const loop = (z) => 0.5 / (1 + z * z) ** 1.5;   // 단위 μ₀I/R, z는 R 단위
    function draw() {
      const c = C(), d = S.val("d"), anti = S.val("anti");
      const B = (z) => loop(z - d / 2) + (anti ? -1 : 1) * loop(z + d / 2);
      const top = anti ? 0.6 : 1.05;
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: -2.5, x1: 2.5, y0: anti ? -0.6 : 0, y1: top, xl: "z/R", yl: "B_z (μ₀I/R)" }); f.axes();
      f.fn((z) => loop(z - d / 2), c.soft, 1.2, [4, 3]); f.fn((z) => (anti ? -1 : 1) * loop(z + d / 2), c.soft, 1.2, [4, 3]);
      f.fn(B, c.main, 2.5, null, 600);
      const yb = anti ? -0.6 : 0; f.path([[-d / 2, yb], [-d / 2, top]], c.ink3, 1, [2, 3]); f.path([[d / 2, yb], [d / 2, top]], c.ink3, 1, [2, 3]);
      f.path([[-0.2, anti ? -0.6 : 0], [-0.2, top]], c.acc, 1, [1, 3]); f.path([[0.2, anti ? -0.6 : 0], [0.2, top]], c.acc, 1, [1, 3]);
      const B0 = B(0), h = 1e-3, curv = (B(h) - 2 * B0 + B(-h)) / (h * h), grad = (B(h) - B(-h)) / (2 * h);
      let lo = Infinity, hi = -Infinity; for (let i = 0; i <= 200; i++) { const z = -0.2 + 0.4 * i / 200, b = B(z); lo = Math.min(lo, b); hi = Math.max(hi, b); }
      S.out(anti
        ? `반대 방향 전류 (반헬름홀츠), 간격 d = ${d.toFixed(2)}R\n가운데: B = ${B0.toFixed(4)} μ₀I/R, 기울기 dB/dz = ${grad.toFixed(4)} μ₀I/R² (d = √3 R ≈ 1.73R에서 기울기가 가장 고르다)\n가운데에서 장이 0이고 기울기가 일정해 자기 트랩·기울기 코일에 쓰인다`
        : `같은 방향 전류, 간격 d = ${d.toFixed(2)}R\n가운데: B = ${B0.toFixed(4)} μ₀I/R, d²B/dz² = ${curv.toFixed(4)} μ₀I/R³ ${Math.abs(curv) < 0.01 ? "(거의 0: 헬름홀츠 조건)" : curv > 0 ? "(가운데가 오목: 간격이 너무 넓음)" : "(가운데가 볼록: 간격이 너무 좁음)"}\n|z| < 0.2R (주황 점선 사이)의 변화: ${(100 * (hi - lo) / B0).toFixed(3)}%`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 강자성체의 이력 고리: 프라이자흐 모형 (02-02) */
  (() => {
    const S = QSim.card("lab-p9-hyst"); if (!S) return;
    const cv = S.$("canvas"); let seed = 11;
    function draw() {
      const c = C(), hmax = S.val("hmax"), spread = S.val("spread"), r = rng(seed), N = 600;
      // 히스테론: 위로 바뀌는 문턱 α, 아래로 바뀌는 문턱 β (α > β). 중심 ±1(보자력 단위) 둘레로 퍼짐
      const hys = []; for (let i = 0; i < N; i++) { const hc = Math.max(0.05, 1 + spread * gauss(r)), u = 0.4 * spread * gauss(r); hys.push({ a: u + hc, b: u - hc, s: -1 }); }
      hys.forEach((h) => (h.s = r() < 0.5 ? -1 : 1));   // 처음에는 자구 방향이 고르게 섞임
      const M = () => hys.reduce((s, h) => s + h.s, 0) / N;
      const pts = [], step = (H) => { hys.forEach((h) => { if (H >= h.a) h.s = 1; else if (H <= h.b) h.s = -1; }); pts.push([H, M()]); };
      const K = 300; for (let i = 0; i <= K; i++) step(hmax * i / K);
      const first = pts.length;
      for (let i = 1; i <= 2 * K; i++) step(hmax - hmax * i / K);
      for (let i = 1; i <= 2 * K; i++) step(-hmax + hmax * i / K);
      const loopPts = pts.slice(first - 1);
      // 잔류 자화와 보자력: 내려가는 가지에서 H = 0, M = 0을 지나는 곳
      let Mr = 0, Hc = NaN, area = 0;
      for (let i = first; i < first + 2 * K; i++) { const [h0, m0] = pts[i - 1], [h1, m1] = pts[i]; if (h0 >= 0 && h1 < 0) Mr = m0 + (m1 - m0) * (0 - h0) / (h1 - h0); if (m0 >= 0 && m1 < 0) Hc = -(h0 + (h1 - h0) * (0 - m0) / (m1 - m0)); }
      for (let i = 1; i < loopPts.length; i++) area += 0.5 * (loopPts[i][1] + loopPts[i - 1][1]) * (loopPts[i][0] - loopPts[i - 1][0]);
      const X = Math.max(4.2, hmax * 1.1);
      const v = QSim.view(cv, 0.6), f = QSim.frame(v, { x0: -X, x1: X, y0: -1.15, y1: 1.15, xl: "H (평균 보자력 단위)", yl: "M/M_s" }); f.axes();
      f.path(pts.slice(0, first), c.ink3, 1.5, [4, 3]); f.path(loopPts, c.main, 2.5);
      f.dot(0, Mr, c.warn, 5); if (!isNaN(Hc)) f.dot(-Hc, 0, c.acc, 5);
      S.out(`최대 장 H_max = ${hmax.toFixed(1)}, 문턱 퍼짐 ${spread.toFixed(2)} (히스테론 ${N}개). 회색 점선: 처음 자화 곡선\n최대 장에서 M/M_s = ${pts[first - 1][1].toFixed(3)}, 잔류 자화 M_r/M_s = ${Mr.toFixed(3)} (빨강), 보자력 H_c = ${isNaN(Hc) ? "없음 (M이 0을 지나지 않음)" : Hc.toFixed(2) + " (주황)"}\n고리 넓이 ∮M dH = ${Math.abs(area).toFixed(2)} (한 바퀴의 손실에 비례)`);
    }
    S.$(".new").addEventListener("click", () => { seed = (seed * 37 + 1) % 99991; draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 편광 타원 (05-02) */
  (() => {
    const S = QSim.card("lab-p9-polar"); if (!S) return;
    const [cvE, cvT] = S.$$("canvas"); let t = 0;
    function draw() {
      const c = C(), ex = S.val("ex"), ey = S.val("ey"), dl = S.val("delta") * deg;
      const Ex = (wt) => ex * Math.cos(wt), Ey = (wt) => ey * Math.cos(wt - dl);   // z = 0에서 cos(−ωt) = cos ωt, cos(−ωt + δ)
      const v = QSim.view(cvE, 1), f = QSim.frame(v, { x0: -1.2, x1: 1.2, y0: -1.2, y1: 1.2, xl: "E_x", yl: "E_y", equal: true }); f.axes();
      const tr = []; for (let i = 0; i <= 360; i++) { const w = 2 * Math.PI * i / 360; tr.push([Ex(w), Ey(w)]); } f.path(tr, c.main, 2.5);
      f.arrow(0, 0, Ex(t), Ey(t), c.warn);
      const vt = QSim.view(cvT, 0.32), ft = QSim.frame(vt, { x0: 0, x1: 4 * Math.PI, y0: -1.1, y1: 1.1, xl: "ωt", yl: "" }); ft.axes();
      ft.fn(Ex, c.main, 2); ft.fn(Ey, c.acc, 2); ft.path([[t % (4 * Math.PI), -1.1], [t % (4 * Math.PI), 1.1]], c.warn, 1, [3, 3]);
      const sd = Math.sin(dl), lin = Math.abs(sd) < 1e-6 || ex < 1e-6 || ey < 1e-6, circ = !lin && Math.abs(ex - ey) < 1e-6 && Math.abs(Math.abs(sd) - 1) < 1e-6;
      const psi = 0.5 * Math.atan2(2 * ex * ey * Math.cos(dl), ex * ex - ey * ey) / deg;
      const I = ex * ex + ey * ey, a2 = 0.5 * (I + Math.sqrt((ex * ex - ey * ey) ** 2 + (2 * ex * ey * Math.cos(dl)) ** 2)), b2 = Math.max(0, I - a2);
      const kind = lin ? "선편광" : circ ? "원편광" : "타원 편광";
      const rot = lin ? "" : `, 다가오는 파동을 마주 볼 때 ${sd > 0 ? "반시계" : "시계"} 방향으로 돈다`;
      S.out(`E_x 진폭 ${ex.toFixed(2)}, E_y 진폭 ${ey.toFixed(2)}, 위상차 δ = ${S.val("delta")}°: ${kind}${rot}\n장축 방향 ψ = ${circ ? "— (원)" : psi.toFixed(1) + "° (x축에서)"}, 단축/장축 = ${(Math.sqrt(b2 / a2) || 0).toFixed(3)}\n세기 ∝ E_x² + E_y² = ${I.toFixed(3)}. 아래: E_x(파랑), E_y(주황)의 시간 변화`);
    }
    const L = QSim.loop((dt) => { t += dt * 2; draw(); }).watch(S.root);
    QSim.playButton(S.$(".play"), L);
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 프레넬 반사율 (05-03) */
  (() => {
    const S = QSim.card("lab-p9-fresnel"); if (!S) return;
    const [cvR, cvG] = S.$$("canvas");
    const RsRp = (n1, n2, th) => {
      const s = n1 * Math.sin(th) / n2; if (s >= 1) return { Rs: 1, Rp: 1, tir: true, tt: NaN };
      const tt = Math.asin(s), ci = Math.cos(th), ct = Math.cos(tt);
      const rs = (n1 * ci - n2 * ct) / (n1 * ci + n2 * ct), rp = (n2 * ci - n1 * ct) / (n2 * ci + n1 * ct);
      return { Rs: rs * rs, Rp: rp * rp, tir: false, tt };
    };
    function draw() {
      const c = C(), n1 = S.val("n1"), n2 = S.val("n2"), thd = S.val("th"), th = thd * deg, q = RsRp(n1, n2, th);
      const v = QSim.view(cvR, 0.45), f = QSim.frame(v, { x0: 0, x1: 90, y0: 0, y1: 1.02, xl: "입사각 (°)", yl: "반사율" }); f.axes();
      f.fn((a) => RsRp(n1, n2, a * deg).Rs, c.main, 2.2, null, 500); f.fn((a) => RsRp(n1, n2, a * deg).Rp, c.acc, 2.2, null, 500);
      f.fn((a) => { const z = RsRp(n1, n2, a * deg); return (z.Rs + z.Rp) / 2; }, c.ink3, 1.2, [4, 3], 500);
      f.dot(thd, q.Rs, c.main, 5); f.dot(thd, q.Rp, c.acc, 5);
      const thB = Math.atan(n2 / n1) / deg, thC = n1 > n2 ? Math.asin(n2 / n1) / deg : NaN;
      f.path([[thB, 0], [thB, 1.02]], c.warn, 1, [3, 3]); if (!isNaN(thC)) f.path([[thC, 0], [thC, 1.02]], c.ink, 1, [2, 2]);
      const vg = QSim.view(cvG, 0.5), g = QSim.frame(vg, { x0: -1.2, x1: 1.2, y0: -1, y1: 1, equal: true }); 
      const gg = vg.g; gg.fillStyle = c.soft; gg.globalAlpha = 0.25; gg.fillRect(g.X(-1.2), g.Y(0), g.X(1.2) - g.X(-1.2), g.Y(-1) - g.Y(0)); gg.globalAlpha = 1;
      g.path([[-1.2, 0], [1.2, 0]], c.ink3, 1); g.path([[0, -1], [0, 1]], c.ink3, 1, [3, 3]);
      g.path([[-Math.sin(th), Math.cos(th)], [0, 0]], c.ink, 3); g.arrow(-Math.sin(th), Math.cos(th), 0.6 * Math.sin(th), -0.6 * Math.cos(th), c.ink);
      const Ru = (q.Rs + q.Rp) / 2; g.path([[0, 0], [Math.sin(th) * 0.9, Math.cos(th) * 0.9]], c.warn, Math.max(0.8, 6 * Ru)); g.arrow(0, 0, Math.sin(th) * 0.9, Math.cos(th) * 0.9, c.warn);
      if (!q.tir) { g.path([[0, 0], [Math.sin(q.tt) * 0.9, -Math.cos(q.tt) * 0.9]], c.main, Math.max(0.8, 6 * (1 - Ru))); g.arrow(0, 0, Math.sin(q.tt) * 0.9, -Math.cos(q.tt) * 0.9, c.main); }
      g.text(`n₁ = ${n1.toFixed(2)}`, -1.15, 0.85, c.ink); g.text(`n₂ = ${n2.toFixed(2)}`, -1.15, -0.85, c.ink);
      S.out(`n₁ = ${n1.toFixed(2)} → n₂ = ${n2.toFixed(2)}, 입사각 ${thd}°: ${q.tir ? "전반사 (투과파 없음, 경계 너머 소멸파)" : `굴절각 ${(q.tt / deg).toFixed(1)}°`}\nR_s = ${q.Rs.toFixed(4)} (파랑), R_p = ${q.Rp.toFixed(4)} (주황), 편광 안 된 빛 ${Ru.toFixed(4)} (회색 점선)\n브루스터 각 ${thB.toFixed(1)}° (빨간 점선)${isNaN(thC) ? "" : `, 임계각 ${thC.toFixed(1)}° (검은 점선)`}. 수직 입사 R = ${(((n1 - n2) / (n1 + n2)) ** 2).toFixed(4)}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 5. 복사 패턴: 짧은 쌍극자, 반파장 안테나, 직선 가속 전하 (06-02, 06-03) */
  (() => {
    const S = QSim.card("lab-p9-pattern"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), mode = S.val("mode"), b = S.val("beta");
      let P, axisLabel;
      if (mode === "dip") { P = (t) => Math.sin(t) ** 2; axisLabel = "쌍극자 축"; }
      else if (mode === "half") { P = (t) => { const s = Math.sin(t); return Math.abs(s) < 1e-6 ? 0 : Math.cos(Math.PI / 2 * Math.cos(t)) ** 2 / (s * s); }; axisLabel = "안테나 축"; }
      else { P = (t) => Math.sin(t) ** 2 / (1 - b * Math.cos(t)) ** 5; axisLabel = "속도·가속도 방향"; }
      let pmax = 0, tmax = 0; const N = 3600; for (let i = 0; i <= N; i++) { const t = Math.PI * i / N, p = P(t); if (p > pmax) { pmax = p; tmax = t; } }
      let lo = NaN, hi = NaN; for (let i = 0; i <= N; i++) { const t = Math.PI * i / N, p = P(t) / pmax; if (isNaN(lo) && p >= 0.5) lo = t; if (p >= 0.5) hi = t; }
      
      const v = QSim.view(cv, 0.62), f = QSim.frame(v, { x0: -1.25, x1: 1.25, y0: -1.05, y1: 1.05, equal: true });
      f.path([[-1.25, 0], [1.25, 0]], c.ink3, 1, [4, 3]); f.arrow(0.8, 0, 0.4, 0, c.ink3);
      const pts = []; for (let i = 0; i <= 720; i++) { const t = 2 * Math.PI * i / 720, rr = P(t) / pmax; pts.push([rr * Math.cos(t), rr * Math.sin(t)]); }
      if (mode === "acc") { const pts0 = []; for (let i = 0; i <= 720; i++) { const t = 2 * Math.PI * i / 720, rr = Math.sin(t) ** 2; pts0.push([rr * Math.cos(t), rr * Math.sin(t)]); } f.path(pts0, c.soft, 1.2, [4, 3]); }
      f.path(pts, c.main, 2.5);
      f.text(axisLabel + " →", 0.55, -0.05, c.ink3);
      const tm = (tmax / deg).toFixed(1), bw = ((hi - lo) / deg).toFixed(1);
      const theory = mode === "acc" ? `, 이론 cos θ_max = (√(1 + 15β²) − 1)/(3β) → ${b > 0 ? (Math.acos((Math.sqrt(1 + 15 * b * b) - 1) / (3 * b)) / deg).toFixed(1) : "90.0"}°` : "";
      const totRatio = mode === "acc" ? ` 전체 일률은 정지 때의 γ⁶ = ${(1 / (1 - b * b)) ** 3 > 1e4 ? ((1 / (1 - b * b)) ** 3).toExponential(2) : ((1 / (1 - b * b)) ** 3).toFixed(1)}배.` : "";
      S.out(`${mode === "dip" ? "짧은 쌍극자: dP/dΩ ∝ sin²θ" : mode === "half" ? "반파장 안테나: dP/dΩ ∝ cos²(π/2·cos θ)/sin²θ" : `직선 가속 전하 (β = ${b.toFixed(2)}): dP/dΩ ∝ sin²θ/(1 − β cos θ)⁵`}\n가장 센 방향 θ = ${tm}°${theory}\n세기가 절반 이상인 범위 ${(lo / deg).toFixed(1)}° ~ ${(hi / deg).toFixed(1)}° (폭 ${bw}°).${totRatio} 그림은 축을 포함한 단면(최댓값으로 규격화)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
