/* 공통8 실습 카드 묶음: 방향장, 자유 진동, 강제 진동, 선형 상평면, 비선형 상평면, 수치해법 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const posOf = (cv, f, e) => { const r = cv.getBoundingClientRect(); return [f.x0 + (e.clientX - r.left - f.X(f.x0)) / f.sx, f.y0 + (f.Y(f.y0) - (e.clientY - r.top)) / f.sy]; };
  /* 2차원 자율계의 궤적: 앞뒤로 RK4 */
  const traj = (F, p, box, h = 0.01, n = 3000) => {
    const out = [];
    [1, -1].forEach((sg) => {
      let s = p.slice(); const seg = [s.slice()];
      for (let i = 0; i < n; i++) { s = QSim.rk4((_, y) => F(y).map((v) => sg * v), 0, s, h); if (!isFinite(s[0]) || Math.abs(s[0]) > box * 3 || Math.abs(s[1]) > box * 3) break; seg.push(s.slice()); }
      out.push(sg > 0 ? seg : seg.reverse());
    });
    return out[1].concat(out[0]);
  };

  /* 1. 방향장 (01-01) */
  (() => {
    const S = QSim.card("lab-c8-field"); if (!S) return;
    const cv = S.$("canvas"); let sols = [], fr = null;
    const EQ = {
      exp: { n: "y' = y", f: (t, y) => y },
      lin: { n: "y' = t − y", f: (t, y) => t - y },
      log: { n: "y' = y(1 − y/2)", f: (t, y) => y * (1 - y / 2) },
      cool: { n: "y' = −0.8(y − 1)", f: (t, y) => -0.8 * (y - 1) },
      blow: { n: "y' = y²", f: (t, y) => y * y },
      sin: { n: "y' = sin t − y/2", f: (t, y) => Math.sin(t) - y / 2 }
    };
    const solve = (fn, t0, y0) => { const out = []; [1, -1].forEach((sg) => { let t = t0, y = y0; const seg = [[t, y]]; for (let i = 0; i < 2000; i++) { const h = 0.01 * sg; const k1 = fn(t, y), k2 = fn(t + h / 2, y + (h / 2) * k1), k3 = fn(t + h / 2, y + (h / 2) * k2), k4 = fn(t + h, y + h * k3); y += (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4); t += h; if (!isFinite(y) || Math.abs(y) > 20 || t < -1 || t > 7) break; seg.push([t, y]); } out.push(sg > 0 ? seg : seg.reverse()); }); return out[1].concat(out[0]); };
    function draw() {
      const c = C(), E = EQ[S.val("eq")];
      const v = QSim.view(cv, 0.65); fr = QSim.frame(v, { x0: -0.5, x1: 6.5, y0: -3, y1: 4, xl: "t", yl: "y" }); fr.axes();
      for (let t = -0.25; t <= 6.5; t += 0.35) for (let y = -2.8; y <= 3.9; y += 0.35) { const m = E.f(t, y), L = 0.13 / Math.sqrt(1 + m * m); fr.path([[t - L, y - m * L], [t + L, y + m * L]], c.ink3, 1.2); }
      sols.forEach((s) => fr.path(s.pts, c.main, 2.2)); sols.forEach((s) => fr.dot(s.t0, s.y0, c.acc, 4));
      S.out(`${E.n}: 짧은 선분은 각 점 (t, y)에서의 기울기 y'. 그림을 누르면 그 점을 지나는 해 곡선을 그린다 (${sols.length}개)\n` +
        ({ exp: "y = 0은 평형해. 위아래로 조금만 벗어나도 멀어진다(불안정).", lin: "모든 해가 직선 y = t − 1에 가까워진다.", log: "y = 0(불안정)과 y = 2(안정) 두 평형해. 양수에서 출발하면 모두 2로.", cool: "뉴턴 냉각: 모든 해가 주변 온도 1로 지수적으로 다가간다.", blow: "y(0) > 0이면 유한한 시간에 무한대로 터진다(해의 존재 구간이 짧다).", sin: "처음 값과 상관없이 같은 주기적 움직임으로 수렴한다(정상 상태)." })[S.val("eq")]);
    }
    cv.addEventListener("pointerdown", (e) => { const [t, y] = posOf(cv, fr, e); sols.push({ t0: t, y0: y, pts: solve(EQ[S.val("eq")].f, t, y) }); if (sols.length > 12) sols.shift(); draw(); });
    S.$(".clear").addEventListener("click", () => { sols = []; draw(); });
    S.on(() => { sols = [-1.5, -0.5, 0.3, 1, 2.5].map((y0) => ({ t0: 0, y0, pts: solve(EQ[S.val("eq")].f, 0, y0) })); draw(); });
    QSim.redrawOn(draw); sols = [-1.5, -0.5, 0.3, 1, 2.5].map((y0) => ({ t0: 0, y0, pts: solve(EQ.exp.f, 0, y0) })); draw();
  })();

  /* 2. 감쇠 자유 진동 (02-03) */
  (() => {
    const S = QSim.card("lab-c8-damped"); if (!S) return;
    const [c1, c2] = S.$$("canvas");
    function draw() {
      const c = C(), m = S.val("m"), k = S.val("k"), cc = S.val("c"), x0 = 1, v0 = 0;
      const F = (_, s) => [s[1], (-cc * s[1] - k * s[0]) / m]; let s = [x0, v0]; const pts = [[0, x0]], ph = [[x0, v0]], h = 0.01;
      for (let i = 1; i <= 2000; i++) { s = QSim.rk4(F, 0, s, h); if (i % 2 === 0) { pts.push([i * h, s[0]]); ph.push([s[0], s[1]]); } }
      let v = QSim.view(c1, 0.45), f = QSim.frame(v, { x0: 0, x1: 20, y0: -1.15, y1: 1.15, xl: "t", yl: "x" }); f.axes();
      const disc = cc * cc - 4 * m * k, w0 = Math.sqrt(k / m), zeta = cc / (2 * Math.sqrt(m * k));
      if (disc < 0) { const a = cc / (2 * m); f.fn((t) => Math.exp(-a * t), c.rule, 1, [4, 3]); f.fn((t) => -Math.exp(-a * t), c.rule, 1, [4, 3]); }
      f.path(pts, c.main, 2.2);
      const vm = Math.max(1, ...ph.map((p) => Math.abs(p[1]))) * 1.1;
      v = QSim.view(c2, 0.45); f = QSim.frame(v, { x0: -1.2, x1: 1.2, y0: -vm, y1: vm, xl: "x", yl: "x'" }); f.axes(); f.path(ph, c.acc, 2); f.dot(x0, v0, c.ink, 4);
      const roots = disc >= 0 ? `λ = ${((-cc + Math.sqrt(disc)) / (2 * m)).toFixed(3)}, ${((-cc - Math.sqrt(disc)) / (2 * m)).toFixed(3)}` : `λ = ${(-cc / (2 * m)).toFixed(3)} ± ${(Math.sqrt(-disc) / (2 * m)).toFixed(3)}i`;
      S.out(`m x'' + c x' + k x = 0, x(0) = 1, x'(0) = 0\n특성방정식 m λ² + c λ + k = 0의 근: ${roots}\n` +
        (disc > 1e-9 ? "과감쇠 (c² > 4mk): 진동 없이 천천히 돌아온다" : Math.abs(disc) <= 1e-9 ? "임계감쇠 (c² = 4mk): 진동 없이 가장 빨리 돌아온다" : `미급감쇠 (c² < 4mk): 진동하며 줄어든다. 진동수 ${(Math.sqrt(-disc) / (2 * m)).toFixed(3)} rad/s < ω₀ = ${w0.toFixed(3)}`) +
        `\n감쇠비 ζ = c/(2√(mk)) = ${zeta.toFixed(3)}, 임계 감쇠 c = 2√(mk) = ${(2 * Math.sqrt(m * k)).toFixed(3)}`);
    }
    S.$(".crit").addEventListener("click", () => { const m = S.val("m"), k = S.val("k"); S.$("[name=c]").value = (2 * Math.sqrt(m * k)).toFixed(2); S.show(); draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 강제 진동과 공명 (02-07) */
  (() => {
    const S = QSim.card("lab-c8-forced"); if (!S) return;
    const [c1, c2] = S.$$("canvas");
    function draw() {
      const c = C(), k = S.val("k"), cc = S.val("c"), w = S.val("w"), F0 = 1, w0 = Math.sqrt(k);
      const amp = (ww) => F0 / Math.sqrt((k - ww * ww) ** 2 + (cc * ww) ** 2);
      let s = [0, 0]; const pts = [[0, 0]], h = 0.01; let mx = 0.1;
      for (let i = 1; i <= 6000; i++) { s = QSim.rk4((t, y) => [y[1], F0 * Math.cos(w * t) - cc * y[1] - k * y[0]], (i - 1) * h, s, h); if (i % 4 === 0) { pts.push([i * h, s[0]]); mx = Math.max(mx, Math.abs(s[0])); } }
      let v = QSim.view(c1, 0.45), f = QSim.frame(v, { x0: 0, x1: 60, y0: -mx * 1.1, y1: mx * 1.1, xl: "t", yl: "x" }); f.axes(); f.path(pts, c.main, 1.8);
      if (cc > 0) { const A = amp(w); f.path([[0, A], [60, A]], c.acc, 1, [4, 3]); f.path([[0, -A], [60, -A]], c.acc, 1, [4, 3]); }
      const top = cc > 0 ? Math.min(amp(Math.sqrt(Math.max(k - cc * cc / 2, 0.01))) * 1.15, 30) : 10;
      v = QSim.view(c2, 0.4); f = QSim.frame(v, { x0: 0, x1: 3, y0: 0, y1: top, xl: "구동 진동수 ω", yl: "정상 진폭" }); f.axes();
      f.fn((ww) => Math.min(amp(ww), top * 1.5), c.acc, 2.2, null, 600); f.path([[w0, 0], [w0, top]], c.ink3, 1, [3, 3]); f.dot(w, Math.min(amp(w), top), c.main, 5);
      S.out(`x'' + c x' + k x = cos ωt, x(0) = x'(0) = 0. 고유 진동수 ω₀ = √k = ${w0.toFixed(3)}\n` +
        (cc > 0 ? `정상 상태 진폭 1/√((k − ω²)² + (cω)²) = ${amp(w).toFixed(3)} (주황 점선). 처음의 들쭉날쭉함은 줄어드는 과도 응답` : (Math.abs(w - w0) < 0.02 ? "c = 0이고 ω = ω₀: 진폭이 시간에 비례해 끝없이 커진다 (t sin ω₀t 꼴, 공명)" : `c = 0: 두 진동수가 겹친 맥놀이. 맥놀이 주기 2π/|ω − ω₀| = ${(2 * Math.PI / Math.abs(w - w0)).toFixed(1)}`)));
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 선형 연립방정식의 상평면 (03-04) */
  (() => {
    const S = QSim.card("lab-c8-phase"); if (!S) return;
    const cv = S.$("canvas"); let extra = [], fr = null;
    const M = () => [S.val("a"), S.val("b"), S.val("c"), S.val("d")];
    function draw() {
      const c = C(), [a, b, cc, d] = M(), F = (y) => [a * y[0] + b * y[1], cc * y[0] + d * y[1]];
      const v = QSim.view(cv, 0.8); fr = QSim.frame(v, { x0: -3, x1: 3, y0: -2.4, y1: 2.4, equal: true, pad: 4 }); fr.axes({ noGrid: true });
      for (let x = -2.8; x <= 2.81; x += 0.4) for (let y = -2.2; y <= 2.21; y += 0.4) { const [p, q] = F([x, y]), m = Math.hypot(p, q); if (m > 1e-6) fr.arrow(x, y, (0.15 * p) / m, (0.15 * q) / m, c.rule); }
      const tr = a + d, det = a * d - b * cc, disc = tr * tr - 4 * det;
      if (disc >= 0) { [(tr + Math.sqrt(disc)) / 2, (tr - Math.sqrt(disc)) / 2].forEach((l) => { const e = Math.abs(b) > 1e-9 ? [b, l - a] : Math.abs(cc) > 1e-9 ? [l - d, cc] : Math.abs(l - a) < 1e-9 ? [1, 0] : [0, 1]; const n = Math.hypot(...e) || 1; fr.path([[-4 * e[0] / n, -4 * e[1] / n], [4 * e[0] / n, 4 * e[1] / n]], c.warn, 1.3, [5, 4]); }); }
      const starts = []; for (let k = 0; k < 12; k++) { const q = (2 * Math.PI * k) / 12; starts.push([2 * Math.cos(q), 2 * Math.sin(q)]); }
      starts.concat(extra).forEach((p, i) => fr.path(traj(F, p, 3, 0.01, 1500), i >= starts.length ? c.acc : c.main, i >= starts.length ? 2.4 : 1.6));
      let kind;
      if (Math.abs(det) < 1e-9) kind = "퇴화 (det = 0): 평형점이 직선 전체";
      else if (det < 0) kind = "안장점: 실수 고유값의 부호가 다름 (불안정)";
      else if (disc < 0) kind = Math.abs(tr) < 1e-9 ? "중심: 순허수 고유값, 닫힌 궤도 (안정하지만 점근 안정 아님)" : `나선점: 복소 고유값, ${tr < 0 ? "안으로 감김 (점근 안정)" : "밖으로 풀림 (불안정)"}`;
      else kind = `마디점: 같은 부호의 실수 고유값, ${tr < 0 ? "안정" : "불안정"}`;
      S.out(`y' = A y, A = [[${a}, ${b}], [${cc}, ${d}]]   대각합 p = ${tr.toFixed(2)}, 행렬식 q = ${det.toFixed(2)}, 판별식 p² − 4q = ${disc.toFixed(2)}\n${kind}\n${disc >= 0 ? "빨간 점선: 고유벡터 방향(그 위의 궤적은 직선)" : "실수 고유벡터 없음"} · 그림을 누르면 그 점에서 궤적을 그린다`);
    }
    cv.addEventListener("pointerdown", (e) => { extra.push(posOf(cv, fr, e)); if (extra.length > 6) extra.shift(); draw(); });
    S.$$(".preset").forEach((bt) => bt.addEventListener("click", () => { bt.dataset.m.split(",").forEach((x, i) => { S.$(`[name=${"abcd"[i]}]`).value = x; }); extra = []; S.show(); draw(); }));
    S.on(() => { extra = []; draw(); }); QSim.redrawOn(draw); draw();
  })();

  /* 5. 비선형계의 상평면 (03-05) */
  (() => {
    const S = QSim.card("lab-c8-nonlin"); if (!S) return;
    const cv = S.$("canvas"); let extra = [], fr = null;
    const SYS = {
      pend: { n: "진자 θ'' = −sin θ − c θ'", F: (y, c) => [y[1], -Math.sin(y[0]) - c * y[1]], box: { x0: -8, x1: 8, y0: -3.2, y1: 3.2 }, starts: () => { const s = []; for (let v = -2.8; v <= 2.81; v += 0.4) s.push([-7.5, v]); for (let x = -6; x <= 6; x += 1.5) s.push([x, 0.3]); return s; }, crit: "임계점 (2nπ, 0): 중심(c = 0) 또는 안정 나선, ((2n+1)π, 0): 안장점" },
      lv: { n: "포식자-피식자 x' = x − xy, y' = −y + xy", F: (y) => [y[0] - y[0] * y[1], -y[1] + y[0] * y[1]], box: { x0: -0.2, x1: 4, y0: -0.2, y1: 3 }, starts: () => [[1.5, 1], [2, 1], [2.5, 1], [3, 1], [0.5, 1]], crit: "임계점 (0, 0): 안장점, (1, 1): 중심 (닫힌 궤도, 개체 수가 주기적으로 오르내림)" }
    };
    function draw() {
      const c = C(), sy = SYS[S.val("sys")], cc = S.val("c"), F = (y) => sy.F(y, cc), b = sy.box;
      const v = QSim.view(cv, 0.6); fr = QSim.frame(v, { ...b, xl: S.val("sys") === "pend" ? "θ" : "x (피식자)", yl: S.val("sys") === "pend" ? "θ'" : "y (포식자)" }); fr.axes();
      const dx = (b.x1 - b.x0) / 22, dy = (b.y1 - b.y0) / 14;
      for (let x = b.x0 + dx / 2; x < b.x1; x += dx) for (let y = b.y0 + dy / 2; y < b.y1; y += dy) { const [p, q] = F([x, y]), m = Math.hypot(p, q); if (m > 1e-6) fr.arrow(x, y, (0.35 * dx * p) / m, (0.35 * dy * q) / m, c.rule); }
      const box = Math.max(b.x1 - b.x0, b.y1 - b.y0);
      sy.starts().forEach((p) => { const pts = []; let s = p.slice(); for (let i = 0; i < 2500; i++) { s = QSim.rk4((_, y) => F(y), 0, s, 0.01); if (Math.abs(s[0]) > box * 2 || Math.abs(s[1]) > box * 2) break; pts.push(s.slice()); } fr.path([p].concat(pts), c.main, 1.4); });
      extra.forEach((p) => fr.path(traj(F, p, box, 0.01, 2500), c.acc, 2.4));
      S.out(`${sy.n}${S.val("sys") === "pend" ? `, c = ${cc}` : ""}\n${sy.crit}\n그림을 누르면 그 점에서 궤적을 그린다` + (S.val("sys") === "pend" ? `\n${cc === 0 ? "c = 0: 닫힌 곡선은 앞뒤 흔들림, 위아래 물결 곡선은 계속 도는 회전" : "c > 0: 에너지를 잃어 결국 아래 평형점(2nπ, 0) 중 하나로 감겨 들어간다"}` : ""));
    }
    cv.addEventListener("pointerdown", (e) => { extra.push(posOf(cv, fr, e)); if (extra.length > 6) extra.shift(); draw(); });
    S.on(() => { extra = []; draw(); }); QSim.redrawOn(draw); draw();
  })();

  /* 6. 오일러, 호인, RK4 비교 (07-02) */
  (() => {
    const S = QSim.card("lab-c8-numeric"); if (!S) return;
    const [c1, c2] = S.$$("canvas");
    const P = { exp: { n: "y' = y, y(0) = 1", f: (t, y) => y, ex: (t) => Math.exp(t), T: 2 }, gau: { n: "y' = −2ty, y(0) = 1", f: (t, y) => -2 * t * y, ex: (t) => Math.exp(-t * t), T: 2 }, osc: { n: "y' = cos t, y(0) = 0", f: (t) => Math.cos(t), ex: (t) => Math.sin(t), T: 6 } };
    const step = { euler: (f, t, y, h) => y + h * f(t, y), heun: (f, t, y, h) => { const k1 = f(t, y), k2 = f(t + h, y + h * k1); return y + (h / 2) * (k1 + k2); }, rk4: (f, t, y, h) => { const k1 = f(t, y), k2 = f(t + h / 2, y + (h / 2) * k1), k3 = f(t + h / 2, y + (h / 2) * k2), k4 = f(t + h, y + h * k3); return y + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4); } };
    const run = (pr, m, h) => { let y = pr.ex(0), t = 0; const pts = [[0, y]]; const n = Math.round(pr.T / h); for (let i = 0; i < n; i++) { y = step[m](pr.f, t, y, h); t += h; pts.push([t, y]); } return pts; };
    function draw() {
      const c = C(), pr = P[S.val("pr")], h = Math.pow(2, -S.val("k")) * (pr.T / 2);
      const cols = { euler: c.warn, heun: c.acc, rk4: c.main };
      let lo = Infinity, hi = -Infinity; for (let i = 0; i <= 100; i++) { const y = pr.ex((pr.T * i) / 100); lo = Math.min(lo, y); hi = Math.max(hi, y); }
      let v = QSim.view(c1, 0.5), f = QSim.frame(v, { x0: 0, x1: pr.T, y0: lo - 0.2 * (hi - lo), y1: hi + 0.2 * (hi - lo), xl: "t", yl: "y" }); f.axes();
      f.fn(pr.ex, c.ink, 2, [4, 3]);
      Object.keys(step).forEach((m) => { const p = run(pr, m, h); f.path(p, cols[m], 2); p.forEach(([t, y]) => f.dot(t, y, cols[m], 2.5)); });
      // 오차-간격 로그 그래프
      v = QSim.view(c2, 0.45); f = QSim.frame(v, { x0: 0, x1: 8, y0: -14, y1: 1, xl: "k (h = h₀/2ᵏ)", yl: "log₁₀ 오차" }); f.axes();
      const lines = [];
      Object.keys(step).forEach((m) => { const pts = []; for (let k = 0; k <= 8; k++) { const hh = Math.pow(2, -k) * (pr.T / 2), p = run(pr, m, hh), e = Math.abs(p[p.length - 1][1] - pr.ex(pr.T)); pts.push([k, Math.log10(Math.max(e, 1e-16))]); } f.path(pts, cols[m], 2); pts.forEach(([k, e]) => f.dot(k, e, cols[m], 3)); lines.push([m, pts]); });
      f.path([[S.val("k"), -14], [S.val("k"), 1]], c.ink3, 1, [3, 3]);
      const err = (m) => { const p = run(pr, m, h); return Math.abs(p[p.length - 1][1] - pr.ex(pr.T)); }, err2 = (m) => { const p = run(pr, m, h / 2); return Math.abs(p[p.length - 1][1] - pr.ex(pr.T)); };
      S.out(`${pr.n}, t = ${pr.T}까지, 간격 h = ${h.toPrecision(3)} (${Math.round(pr.T / h)}걸음)\n` +
        ["euler", "heun", "rk4"].map((m) => `${{ euler: "오일러", heun: "호인", rk4: "RK4" }[m]}: 끝 오차 ${err(m).toExponential(2)}, h를 절반으로 하면 ${(err(m) / Math.max(err2(m), 1e-16)).toFixed(1)}분의 1`).join("\n"));
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
