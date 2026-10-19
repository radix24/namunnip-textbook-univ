/* 응용통계 실습 카드 묶음 3: 어려운 단원의 체험 카드 (모든 자료는 가상)
   이차형식과 안장점, 좌표 변환의 넓이 배율, 검정력 함수, 도박꾼의 파산, 능형·라쏘 계수 경로, 심슨의 역설 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const rng = (seed) => () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return (seed + 0.5) / 4294967296; };
  const gauss = (r) => Math.sqrt(-2 * Math.log(r())) * Math.cos(2 * Math.PI * r());
  const erf = (x) => { const s = Math.sign(x); x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x); const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return s * y; };
  const Phi = (z) => 0.5 * (1 + erf(z / Math.SQRT2));
  const qnorm = (p) => {
    const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
    const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
    const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
    const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
    const pl = 0.02425;
    if (p < pl) { const q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    if (p > 1 - pl) return -qnorm(1 - p);
    const q = p - 0.5, r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  };
  const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  const pct = (x) => (100 * x).toFixed(1) + "%";
  const vline = (f, x, y0, y1, col, w = 1.5, dash = [5, 4]) => f.path([[x, y0], [x, y1]], col, w, dash);

  /* 1. 이차식 Ah² + 2Bhk + Ck²의 모양과 판정식 (응통1-05-02) */
  (() => {
    const S = QSim.card("lab-s1-saddle"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), A = S.val("A"), B = S.val("B"), Cc = S.val("C"), q = (h, k) => A * h * h + 2 * B * h * k + Cc * k * k;
      const v = QSim.view(cv, 0.8), f = QSim.frame(v, { x0: -2, x1: 2, y0: -2, y1: 2, equal: true, xl: "h (x 방향)", yl: "k (y 방향)" });
      const g = v.g, N = 64, M = Math.max(1e-9, Math.abs(A) + 2 * Math.abs(B) + Math.abs(Cc)) * 4;
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const h = -2 + 4 * (i + 0.5) / N, k = -2 + 4 * (j + 0.5) / N, z = q(h, k) / M, a = Math.min(1, Math.abs(z)) * 0.85 + 0.05;
        g.fillStyle = z >= 0 ? `rgba(217,83,79,${a})` : `rgba(75,79,224,${a})`;
        g.fillRect(f.X(h - 2 / N), f.Y(k + 2 / N), f.X(h + 2 / N) - f.X(h - 2 / N) + 1, f.Y(k - 2 / N) - f.Y(k + 2 / N) + 1);
      }
      f.axes({ noGrid: true });
      for (let lv = 1; lv <= 4; lv++) [lv, -lv].forEach((L) => { /* 등고선 q = L·M/8 을 각도별 반지름으로 */
        const pts = []; for (let t = 0; t <= 360; t++) { const th = t * Math.PI / 180, u = q(Math.cos(th), Math.sin(th)); const r = u * L > 0 ? Math.sqrt(L * M / 8 / u) : NaN; pts.push(isFinite(r) && r < 3 ? [r * Math.cos(th), r * Math.sin(th)] : null); }
        let seg = []; pts.forEach((p) => { if (p) seg.push(p); else { if (seg.length > 1) f.path(seg, c.ink, 1); seg = []; } }); if (seg.length > 1) f.path(seg, c.ink, 1);
      });
      const D = A * Cc - B * B;
      let kind;
      if (Math.abs(D) < 1e-9) kind = "D = 0: 판정할 수 없음 (어떤 방향으로는 평평)";
      else if (D > 0) kind = A > 0 ? "D > 0, A > 0: 극소 (모든 방향으로 오름, 빨강 그릇)" : "D > 0, A < 0: 극대 (모든 방향으로 내림, 파랑 산)";
      else kind = "D < 0: 안장점 (빨강과 파랑이 섞임)";
      let extra = "";
      if (D < 0 && Math.abs(A) > 1e-9) { const k = 1, h = -B / A * k; f.arrow(0, 0, h / Math.hypot(h, k) * 1.6, k / Math.hypot(h, k) * 1.6, c.acc, "A와 반대 부호 방향"); extra = `\n방향 (h, k) = (${(-B / A).toFixed(2)}, 1)에서 q = (D/A)k² = ${(D / A).toFixed(2)} (A와 부호가 반대)`; }
      S.out(`q(h, k) = ${A.toFixed(1)}h² + ${(2 * B).toFixed(1)}hk + ${Cc.toFixed(1)}k²   (빨강 q > 0, 파랑 q < 0, 검은 선은 등고선)\n판정식 D = AC − B² = ${A.toFixed(1)}×${Cc.toFixed(1)} − ${B.toFixed(1)}² = ${D.toFixed(2)}  → ${kind}${extra}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 좌표 변환과 넓이 배율 (응통1-06-02) */
  (() => {
    const S = QSim.card("lab-s1-jac"); if (!S) return;
    const [cvU, cvX] = S.$$("canvas");
    function draw() {
      const c = C(), mode = S.val("mode"), u0 = S.val("u0"), v0 = S.val("v0");
      let T, U0, U1, V0, V1, du, dv, J, name;
      if (mode === "lin") {
        const a = S.val("a"), b = S.val("b"), cc = S.val("c"), d = S.val("d");
        T = (u, v) => [a * u + b * v, cc * u + d * v]; U0 = 0; U1 = 2; V0 = 0; V1 = 2; du = 0.25; dv = 0.25; J = () => a * d - b * cc;
        name = `x = ${a.toFixed(1)}u + ${b.toFixed(1)}v,  y = ${cc.toFixed(1)}u + ${d.toFixed(1)}v`;
      } else {
        T = (r, th) => [r * Math.cos(th), r * Math.sin(th)]; U0 = 0; U1 = 2; V0 = 0; V1 = 2 * Math.PI; du = 0.25; dv = Math.PI / 8; J = (r) => r;
        name = "극좌표 x = r cos θ, y = r sin θ  (u = r, v = θ)";
      }
      const uc = U0 + (U1 - U0) * u0, vc = V0 + (V1 - V0) * v0, ui = Math.min(U1 - du, Math.floor((uc - U0) / du) * du + U0), vi = Math.min(V1 - dv, Math.floor((vc - V0) / dv) * dv + V0);
      const v1 = QSim.view(cvU, 0.6), f1 = QSim.frame(v1, { x0: U0, x1: U1, y0: V0, y1: V1, xl: "u", yl: "v" }); f1.axes({ noGrid: true });
      for (let u = U0; u <= U1 + 1e-9; u += du) f1.path([[u, V0], [u, V1]], c.rule, 1);
      for (let w = V0; w <= V1 + 1e-9; w += dv) f1.path([[U0, w], [U1, w]], c.rule, 1);
      v1.g.fillStyle = "rgba(242,179,61,0.6)"; v1.g.fillRect(f1.X(ui), f1.Y(vi + dv), f1.X(ui + du) - f1.X(ui), f1.Y(vi) - f1.Y(vi + dv));
      const pts = []; for (let u = U0; u <= U1 + 1e-9; u += du) for (let w = V0; w <= V1 + 1e-9; w += dv) pts.push(T(u, w));
      const R = Math.max(2.2, ...pts.map((p) => Math.max(Math.abs(p[0]), Math.abs(p[1])))) * 1.1;
      const v2 = QSim.view(cvX, 0.75), f2 = QSim.frame(v2, { x0: -R, x1: R, y0: -R, y1: R, equal: true, xl: "x", yl: "y" }); f2.axes({ noGrid: true });
      const line = (pf) => { const p = []; for (let s = 0; s <= 40; s++) p.push(pf(s / 40)); f2.path(p, c.rule, 1); };
      for (let u = U0; u <= U1 + 1e-9; u += du) line((s) => T(u, V0 + (V1 - V0) * s));
      for (let w = V0; w <= V1 + 1e-9; w += dv) line((s) => T(U0 + (U1 - U0) * s, w));
      const quad = []; for (let s = 0; s <= 10; s++) quad.push(T(ui + du * s / 10, vi)); for (let s = 0; s <= 10; s++) quad.push(T(ui + du, vi + dv * s / 10)); for (let s = 10; s >= 0; s--) quad.push(T(ui + du * s / 10, vi + dv)); for (let s = 10; s >= 0; s--) quad.push(T(ui, vi + dv * s / 10));
      const g = v2.g; g.fillStyle = "rgba(242,179,61,0.7)"; g.beginPath(); quad.forEach(([x, y], i) => (i ? g.lineTo(f2.X(x), f2.Y(y)) : g.moveTo(f2.X(x), f2.Y(y)))); g.closePath(); g.fill();
      let area = 0; for (let i = 0; i < quad.length; i++) { const [x1, y1] = quad[i], [x2, y2] = quad[(i + 1) % quad.length]; area += x1 * y2 - x2 * y1; } area = Math.abs(area) / 2;
      const Jm = Math.abs(J(ui + du / 2));
      S.out(`${name}\n색칠한 작은 칸: u ∈ [${ui.toFixed(2)}, ${(ui + du).toFixed(2)}], v ∈ [${vi.toFixed(2)}, ${(vi + dv).toFixed(2)}],  (u, v) 넓이 du·dv = ${(du * dv).toFixed(4)}\n옮긴 뒤 (x, y) 넓이 ${area.toFixed(4)}  →  배율 ${(area / (du * dv)).toFixed(3)},   |J| (칸 가운데) = ${Jm.toFixed(3)}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 검정력 함수: 단측과 양측, 표본 크기 (응통7-05-01) */
  (() => {
    const S = QSim.card("lab-s7-powerfn"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), n = S.val("n"), a = S.val("a"), mu1 = S.val("mu1"), sn = Math.sqrt(n);
      const z1 = qnorm(1 - a), z2 = qnorm(1 - a / 2);
      const one = (m) => 1 - Phi(z1 - m * sn), two = (m) => 1 - Phi(z2 - m * sn) + Phi(-z2 - m * sn);
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: -1, x1: 1.5, y0: 0, y1: 1.02, xl: "참 평균 μ", yl: "기각 확률" }); f.axes();
      f.path([[-1, a], [1.5, a]], c.ink3, 1, [3, 3]);
      f.fn(one, c.main, 2.5); f.fn(two, c.warn, 2.2, [6, 4]);
      vline(f, 0, 0, 1.02, c.ink3, 1, null); vline(f, mu1, 0, 1.02, c.acc, 1.2);
      f.dot(mu1, one(mu1), c.main, 4); f.dot(mu1, two(mu1), c.warn, 4);
      let n80 = 1; while (n80 < 100000 && 1 - Phi(z1 - mu1 * Math.sqrt(n80)) < 0.8) n80++;
      S.out(`X₁, …, Xₙ ~ N(μ, 1), n = ${n}, 유의수준 α = ${a}.  파랑: 단측 H₀: μ ≤ 0 대 H₁: μ > 0 (X̄ > ${(z1 / sn).toFixed(3)}이면 기각),  빨강 점선: 양측 H₀: μ = 0\nμ = 0에서 기각 확률: 단측 ${one(0).toFixed(3)}, 양측 ${two(0).toFixed(3)} (= α, 회색 점선)\nμ = ${mu1.toFixed(2)}에서 검정력: 단측 ${one(mu1).toFixed(3)}, 양측 ${two(mu1).toFixed(3)}${mu1 > 0 ? `,  단측 검정력 0.8에 필요한 n = ${n80}` : "  (μ < 0이면 단측 검정은 거의 기각하지 않음)"}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 도박꾼의 파산: 도달 확률과 평균 판 수 (응통9-02-01, 응통9-04-02) */
  (() => {
    const S = QSim.card("lab-s9-ruin"); if (!S) return;
    const cv = S.$("canvas"); let seed = 19;
    function draw() {
      const c = C(), N = S.val("N"), k = Math.min(S.val("k"), N - 1), p = S.val("p"), q = 1 - p, u = rng(seed), R = 3000;
      let win = 0, tsum = 0; const paths = [];
      for (let r = 0; r < R; r++) { let x = k, t = 0; const path = r < 15 ? [[0, x]] : null; while (x > 0 && x < N && t < 100000) { x += u() < p ? 1 : -1; t++; if (path && t <= 400) path.push([t, x]); } if (x === N) win++; tsum += t; if (path) paths.push(path); }
      const ratio = q / p, P = Math.abs(p - 0.5) < 1e-9 ? k / N : (1 - ratio ** k) / (1 - ratio ** N);
      const ET = Math.abs(p - 0.5) < 1e-9 ? k * (N - k) : k / (q - p) - (N / (q - p)) * (1 - ratio ** k) / (1 - ratio ** N);
      const Tmax = Math.min(400, Math.max(30, Math.ceil(ET * 2.5)));
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: Tmax, y0: 0, y1: N, xl: "판", yl: "재산" }); f.axes({ noGrid: true });
      f.path([[0, N], [Tmax, N]], c.main, 1.5, [4, 3]); f.path([[0, 0], [Tmax, 0]], c.warn, 1.5, [4, 3]);
      paths.forEach((pth) => { const last = pth[pth.length - 1][1]; f.path(pth.filter(([t]) => t <= Tmax), last >= N ? c.main : last <= 0 ? c.warn : c.ink3, 1.1); });
      S.out(`처음 재산 ${k}, 목표 ${N}, 한 판에 이길 확률 p = ${p.toFixed(2)}, 모의실험 ${R}번 (가상, 선 15개는 그중 일부: 파랑 목표 도달, 빨강 파산)\n목표 도달 비율 ${pct(win / R)}  (이론 ${pct(P)}${Math.abs(p - 0.5) < 1e-9 ? " = k/N" : " = (1 − (q/p)^k)/(1 − (q/p)^N)"})\n끝날 때까지 평균 판 수 ${(tsum / R).toFixed(1)}  (이론 ${ET.toFixed(1)}${Math.abs(p - 0.5) < 1e-9 ? " = k(N − k)" : ""})`);
    }
    S.$(".new").addEventListener("click", () => { seed = (seed * 31 + 7) % 99991; draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 5. 능형 회귀와 라쏘의 계수 경로 (응통10-06-03) */
  (() => {
    const S = QSim.card("lab-s10-ridge"); if (!S) return;
    const cv = S.$("canvas"), u = rng(2718), n = 40, p = 4, X = [], y = [];
    for (let i = 0; i < n; i++) { const z = gauss(u), x1 = z, x2 = 0.95 * z + Math.sqrt(1 - 0.95 ** 2) * gauss(u), x3 = gauss(u), x4 = gauss(u); X.push([x1, x2, x3, x4]); y.push(2 * x1 + 0 * x2 + 1 * x3 + 0 * x4 + gauss(u)); }
    for (let j = 0; j < p; j++) { const m = mean(X.map((r) => r[j])), s = Math.sqrt(X.reduce((a, r) => a + (r[j] - m) ** 2, 0) / n); X.forEach((r) => { r[j] = (r[j] - m) / s; }); } /* 표준화 */
    const my = mean(y); const yc = y.map((t) => t - my);
    const XtX = Array.from({ length: p }, (_, a) => Array.from({ length: p }, (_, b) => X.reduce((s, r) => s + r[a] * r[b], 0)));
    const Xty = Array.from({ length: p }, (_, a) => X.reduce((s, r, i) => s + r[a] * yc[i], 0));
    const solve = (M, b) => { const m = M.map((r, i) => [...r, b[i]]), k = b.length; for (let i = 0; i < k; i++) { let piv = i; for (let r = i + 1; r < k; r++) if (Math.abs(m[r][i]) > Math.abs(m[piv][i])) piv = r; [m[i], m[piv]] = [m[piv], m[i]]; for (let r = i + 1; r < k; r++) { const f = m[r][i] / m[i][i]; for (let c2 = i; c2 <= k; c2++) m[r][c2] -= f * m[i][c2]; } } const x = Array(k).fill(0); for (let i = k - 1; i >= 0; i--) { let s = m[i][k]; for (let c2 = i + 1; c2 < k; c2++) s -= m[i][c2] * x[c2]; x[i] = s / m[i][i]; } return x; };
    const ridge = (lam) => solve(XtX.map((r, i) => r.map((v, j) => v + (i === j ? lam : 0))), Xty);
    const lasso = (lam) => { const b = Array(p).fill(0); for (let it = 0; it < 500; it++) { let ch = 0; for (let j = 0; j < p; j++) { let rho = Xty[j]; for (let k2 = 0; k2 < p; k2++) if (k2 !== j) rho -= XtX[j][k2] * b[k2]; const nb = Math.sign(rho) * Math.max(Math.abs(rho) - lam / 2, 0) / XtX[j][j]; ch = Math.max(ch, Math.abs(nb - b[j])); b[j] = nb; } if (ch < 1e-10) break; } return b; };
    const sse = (b) => yc.reduce((s, t, i) => s + (t - X[i].reduce((a, x, j) => a + x * b[j], 0)) ** 2, 0);
    function draw() {
      const c = C(), meth = S.val("meth"), L = S.val("L"), lam = 10 ** L, fit = meth === "ridge" ? ridge : lasso;
      const grid = []; for (let t = -2; t <= 3.0001; t += 0.05) grid.push([t, fit(10 ** t)]);
      const ols = ridge(0), top = Math.max(...ols.map(Math.abs)) * 1.15;
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: -2, x1: 3, y0: -top, y1: top, xl: "log₁₀ λ", yl: "계수" }); f.axes();
      const cols = [c.main, c.acc, c.warn, c.ink3];
      for (let j = 0; j < p; j++) f.path(grid.map(([t, b]) => [t, b[j]]), cols[j], 2);
      vline(f, L, -top, top, c.ink, 1.2);
      const b = fit(lam);
      S.out(`가상 자료 n = ${n}: 참 계수 (x₁ 2, x₂ 0, x₃ 1, x₄ 0), x₁과 x₂는 상관 0.95.  설명변수 표준화 후 ${meth === "ridge" ? "능형 회귀 (벌점 λΣβ²)" : "라쏘 (벌점 λΣ|β|)"}\nλ = 0 (최소제곱): (${ols.map((t) => t.toFixed(2)).join(", ")})\nλ = ${lam < 1 ? lam.toFixed(3) : lam.toFixed(1)}: (${b.map((t) => t.toFixed(2)).join(", ")}),  0이 된 계수 ${b.filter((t) => Math.abs(t) < 1e-8).length}개,  잔차제곱합 ${sse(b).toFixed(1)} (최소제곱 ${sse(ols).toFixed(1)})\n색: 파랑 x₁, 노랑 x₂, 빨강 x₃, 회색 x₄`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 6. 심슨의 역설: 중증 환자 비율에 따라 뒤집히는 전체 성공률 (응통18-04-02) */
  (() => {
    const S = QSim.card("lab-s18-simpson"); if (!S) return;
    const cv = S.$("canvas");
    const RATE = { A: [0.93, 0.73], B: [0.87, 0.69] }; /* [경증, 중증] 성공률 (신장 결석 자료와 비슷한 가상 값) */
    function draw() {
      const c = C(), sA = S.val("sA") / 100, sB = S.val("sB") / 100;
      const oA = (1 - sA) * RATE.A[0] + sA * RATE.A[1], oB = (1 - sB) * RATE.B[0] + sB * RATE.B[1];
      const v = QSim.view(cv, 0.45), f = QSim.frame(v, { x0: 0, x1: 3, y0: 0.5, y1: 1.0, xl: "", yl: "성공률" }); f.axes();
      const g = v.g, bar = (x, h, col) => { g.fillStyle = col; g.fillRect(f.X(x), f.Y(h), f.X(x + 0.32) - f.X(x), f.Y(0.5) - f.Y(h)); f.text((100 * h).toFixed(1) + "%", x + 0.16, h + 0.012, c.ink, "center"); };
      [["경증", 0, RATE.A[0], RATE.B[0]], ["중증", 1, RATE.A[1], RATE.B[1]], ["전체", 2, oA, oB]].forEach(([nm, i, a, b]) => { bar(i + 0.15, a, c.main); bar(i + 0.53, b, c.warn); f.text(nm, i + 0.5, 0.52, c.ink2, "center"); });
      const flip = (oA < oB) ? "→ 전체로는 B가 높아 보임: 심슨의 역설" : "→ 전체로도 A가 높음";
      S.out(`치료 A(파랑)는 경증 93.0%, 중증 73.0%;  치료 B(빨강)는 경증 87.0%, 중증 69.0%  (층마다 A가 높음, 가상 값)\nA 환자 중 중증 ${pct(sA)}, B 환자 중 중증 ${pct(sB)}\n전체 성공률: A ${pct(oA)}, B ${pct(oB)}  ${flip}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
