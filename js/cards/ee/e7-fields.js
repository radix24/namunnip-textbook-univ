/* 전전7 공학전자기학 탐구 카드 묶음
   1 좌표계 성분 변환(01-01)  2 2차원 선속과 순환(01-02)  3 유한 선전하(02-01)  4 Gauss 법칙의 E(r)(02-02)
   5 유전체 경계의 전계 굴절(03-01)  6 Laplace 방정식 이완법(03-03)
   7 원형·정사각형 고리의 자계(04-01)  8 동축선의 H(ρ)(04-02)  9 자기 회로와 공기 틈(05-02)  10 레일 위 막대의 운동 기전력(06-01) */
(() => {
  "use strict";
  if (!window.QSim) return;
  const C = () => QSim.col();
  const f2 = (x, d = 3) => (Math.abs(x) < 5e-13 ? 0 : x).toFixed(d);
  const deg = Math.PI / 180, e0 = 8.854e-12;

  /* 1. 좌표계 성분 변환: 고정 벡터 A = (2, −1, 3), 점의 위치를 φ, θ로 */
  (() => {
    const S = QSim.card("exp-e7-coords"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), ph = S.val("phi") * deg, th = S.val("theta") * deg, A = [S.val("ax"), S.val("ay"), S.val("az")];
      const ar = [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)], at = [Math.cos(th) * Math.cos(ph), Math.cos(th) * Math.sin(ph), -Math.sin(th)];
      const arho = [Math.cos(ph), Math.sin(ph), 0], aph = [-Math.sin(ph), Math.cos(ph), 0], dot = (u, w) => u[0] * w[0] + u[1] * w[1] + u[2] * w[2];
      const cyl = [dot(A, arho), dot(A, aph), A[2]], sph = [dot(A, ar), dot(A, at), dot(A, aph)];
      const v = QSim.view(cv, 0.62), fr = QSim.frame(v, { x0: -3.4, x1: 3.4, y0: -2.6, y1: 2.6, equal: true, pad: 10 }); fr.axes({ noGrid: true });
      const px = 1.6 * Math.cos(ph), py = 1.6 * Math.sin(ph);   // 점의 xy 투영(크기는 그림용)
      fr.path([[0, 0], [px, py]], c.rule, 1, [3, 3]); fr.dot(px, py, c.ink, 4);
      fr.arrow(px, py, arho[0], arho[1], c.main, "a_ρ"); fr.arrow(px, py, aph[0], aph[1], c.acc, "a_φ");
      fr.arrow(0, 0, A[0] * 0.5, A[1] * 0.5, c.warn, "A의 xy 성분 (×0.5)");
      fr.text("x", 3.2, 0.15, c.ink3); fr.text("y", 0.1, 2.4, c.ink3);
      const m = Math.hypot(...A);
      S.out(`점의 방향: φ = ${S.val("phi")}°, θ = ${S.val("theta")}°. 벡터 A = ${A[0]}a_x ${A[1] < 0 ? "−" : "+"} ${Math.abs(A[1])}a_y ${A[2] < 0 ? "−" : "+"} ${Math.abs(A[2])}a_z (|A| = ${f2(m)})\n` +
        `원통: A_ρ = ${f2(cyl[0])}, A_φ = ${f2(cyl[1])}, A_z = ${f2(cyl[2])} (크기 ${f2(Math.hypot(...cyl))})\n` +
        `구: A_r = ${f2(sph[0])}, A_θ = ${f2(sph[1])}, A_φ = ${f2(sph[2])} (크기 ${f2(Math.hypot(...sph))}). 그림: xy 평면에서 본 a_ρ(파랑), a_φ(주황)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 2차원 벡터장의 선속과 순환 (원 경로) */
  (() => {
    const S = QSim.card("exp-e7-flux2d"); if (!S) return;
    const cv = S.$("canvas");
    const fields = {
      src: { F: (x, y) => [x, y], name: "F = x a_x + y a_y (퍼지는 장)", div: () => 2, curl: () => 0 },
      rot: { F: (x, y) => [-y, x], name: "F = −y a_x + x a_y (도는 장)", div: () => 0, curl: () => 2 },
      line: { F: (x, y) => { const r2 = x * x + y * y + 1e-12; return [x / r2, y / r2]; }, name: "F = a_ρ/ρ (원점의 선전하 모양)", div: () => 0, curl: () => 0, point: true },
      shear: { F: (x, y) => [y, 0], name: "F = y a_x (층밀림)", div: () => 0, curl: () => -1 },
    };
    function draw() {
      const c = C(), f = fields[S.val("f")], cx = S.val("cx"), cy = S.val("cy"), R = S.val("r");
      const v = QSim.view(cv, 0.62), fr = QSim.frame(v, { x0: -3, x1: 3, y0: -2.2, y1: 2.2, equal: true, pad: 10 }); fr.axes({ noGrid: true });
      for (let x = -2.75; x <= 2.8; x += 0.5) for (let y = -2; y <= 2.05; y += 0.5) { const [u, w] = f.F(x, y), m = Math.hypot(u, w); if (m > 1e-9) { const s = 0.38 * Math.min(1, m) / m; fr.arrow(x, y, u * s, w * s, c.rule); } }
      fr.path(Array.from({ length: 121 }, (_, i) => [cx + R * Math.cos(2 * Math.PI * i / 120), cy + R * Math.sin(2 * Math.PI * i / 120)]), c.main, 2.5);
      let flux = 0, circ = 0; const N = 2000;
      for (let i = 0; i < N; i++) { const t = 2 * Math.PI * (i + 0.5) / N, x = cx + R * Math.cos(t), y = cy + R * Math.sin(t), [u, w] = f.F(x, y), dl = 2 * Math.PI * R / N; flux += (u * Math.cos(t) + w * Math.sin(t)) * dl; circ += (-u * Math.sin(t) + w * Math.cos(t)) * dl; }
      const area = Math.PI * R * R, inside = Math.hypot(cx, cy) < R;
      const divInt = f.point ? (inside ? 2 * Math.PI : 0) : f.div() * area, curlInt = f.curl() * area;
      S.out(`${f.name}, 원: 중심 (${f2(cx, 1)}, ${f2(cy, 1)}), 반지름 ${f2(R, 1)}\n` +
        `선속 ∮F·n dl = ${f2(flux)}  ↔  ∫(∇·F) dS = ${f2(divInt)}${f.point ? (inside ? " (원점의 원천 2π를 감쌈)" : " (원점이 밖: 0)") : ""}\n` +
        `순환 ∮F·dl = ${f2(circ)}  ↔  ∫(∇×F)_z dS = ${f2(curlInt)}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 유한 선전하와 무한 선전하 근사 */
  (() => {
    const S = QSim.card("exp-e7-line"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), L = S.val("L"), rho = S.val("rho"), rl = 1e-9;
      const Einf = (r) => rl / (2 * Math.PI * e0 * r), Efin = (r) => Einf(r) * L / Math.sqrt(L * L + r * r), Ept = (r) => 2 * L * rl / (4 * Math.PI * e0 * r * r);
      const v = QSim.view(cv, 0.45), fr = QSim.frame(v, { x0: -1.5, x1: 1, y0: -1, y1: 3, xl: "log₁₀ ρ (m)", yl: "log₁₀ E (V/m)" }); fr.axes();
      fr.fn((u) => Math.log10(Einf(10 ** u)), c.acc, 1.8, [6, 3]); fr.fn((u) => Math.log10(Ept(10 ** u)), c.ink3, 1.5, [2, 3]); fr.fn((u) => Math.log10(Efin(10 ** u)), c.main, 2.6);
      fr.dot(Math.log10(rho), Math.log10(Efin(rho)), c.warn, 6);
      S.out(`ρ_L = 1 nC/m, 길이 2L = ${f2(2 * L, 1)} m, 가운데 평면에서 ρ = ${f2(rho, 2)} m\n` +
        `유한(정확) ${f2(Efin(rho), 2)} V/m, 무한 선 근사 ${f2(Einf(rho), 2)} V/m (오차 ${f2((Einf(rho) / Efin(rho) - 1) * 100, 1)}%), 점전하 근사 ${f2(Ept(rho), 2)} V/m (오차 ${f2((Ept(rho) / Efin(rho) - 1) * 100, 1)}%)\n` +
        `파랑: 정확, 주황 점선: 무한 선(기울기 −1), 회색 점선: 점전하(기울기 −2). 꺾이는 곳이 ρ ≈ L`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. Gauss 법칙으로 얻는 E(r) */
  (() => {
    const S = QSim.card("exp-e7-gauss"); if (!S) return;
    const cv = S.$("canvas");
    const Q = 1e-9, a = 0.1;
    const dists = {
      uni: { name: "균일 대전 구 (반지름 a)", qenc: (r) => (r < a ? Q * (r / a) ** 3 : Q), sph: true },
      shell: { name: "얇은 구 껍질 (반지름 a)", qenc: (r) => (r < a ? 0 : Q), sph: true },
      lin: { name: "구, ρ_v ∝ r", qenc: (r) => (r < a ? Q * (r / a) ** 4 : Q), sph: true },
      coax: { name: "동축선 (a = 0.05, b = 0.15 m, ρ_L = 1 nC/m)", qenc: (r) => (r < 0.05 ? 0 : r < 0.15 ? 1e-9 : 0), sph: false },
    };
    function draw() {
      const c = C(), d = dists[S.val("d")], r0 = S.val("r");
      const E = (r) => (d.sph ? d.qenc(r) / (4 * Math.PI * e0 * r * r) : d.qenc(r) / (2 * Math.PI * e0 * r));
      const top = Math.max(...Array.from({ length: 300 }, (_, i) => E(0.001 + i * 0.3 / 300))) * 1.15;
      const v = QSim.view(cv, 0.45), fr = QSim.frame(v, { x0: 0, x1: 0.3, y0: 0, y1: top, xl: d.sph ? "r (m)" : "ρ (m)", yl: "E (V/m)" }); fr.axes();
      fr.fn((r) => E(Math.max(r, 1e-4)), c.main, 2.6, undefined, 900);
      fr.fn((r) => d.qenc(r) / (d.sph ? Q : 1e-9) * top * 0.9, c.acc, 1.5, [5, 3], 600);
      fr.dot(r0, E(r0), c.warn, 6);
      S.out(`${d.name}. ${d.sph ? "Q = 1 nC" : "단위 길이당"} \n` +
        `${d.sph ? "r" : "ρ"} = ${f2(r0, 3)} m: 감싼 전하 ${f2(d.qenc(r0) * 1e9, 3)} nC${d.sph ? "" : "/m"} → E = ${f2(E(r0), 1)} V/m (${d.sph ? "D·4πr² = Q_enc" : "D·2πρ = Q_enc/길이"})\n` +
        `파랑: E, 주황 점선: 감싼 전하의 비율(오른쪽 끝이 전체). 감싼 전하가 같으면 바깥 전계는 분포 모양과 무관합니다.`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 5. 유전체 경계의 전계 굴절 */
  (() => {
    const S = QSim.card("exp-e7-refract"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), e1 = S.val("e1"), e2 = S.val("e2"), t1 = S.val("t1") * deg, E1 = 1;
      const Et = E1 * Math.sin(t1), En1 = E1 * Math.cos(t1), En2 = En1 * e1 / e2, t2 = Math.atan2(Et, En2), E2 = Math.hypot(Et, En2);
      const v = QSim.view(cv, 0.62), fr = QSim.frame(v, { x0: -2, x1: 2, y0: -1.6, y1: 1.6, equal: true, pad: 8 });
      const g = v.g; g.save(); g.fillStyle = c.soft; g.globalAlpha = 0.5 + Math.min(0.4, (e2 - 1) / 20); g.fillRect(fr.X(-2), fr.Y(0), fr.X(2) - fr.X(-2), fr.Y(-1.6) - fr.Y(0)); g.restore();
      fr.path([[-2, 0], [2, 0]], c.ink3, 1.5);
      for (let k = -3; k <= 3; k++) {   // 전기력선: 위(영역 1)에서 내려와 경계에서 꺾임
        const x0 = k * 0.45; fr.path([[x0 - 1.5 * Math.tan(t1), 1.5], [x0, 0], [x0 + 1.5 * Math.tan(t2), -1.5]], c.main, 1.6);
      }
      fr.text(`ε_r1 = ${e1}`, -1.9, 1.35, c.ink2); fr.text(`ε_r2 = ${e2}`, -1.9, -1.45, c.ink2);
      S.out(`영역 1(위): E₁ = 1 V/m, 법선과 ${f2(t1 / deg, 1)}° → E_t = ${f2(Et)}, E_n1 = ${f2(En1)}\n` +
        `영역 2(아래): E_t = ${f2(Et)} (접선 연속), E_n2 = ε₁E_n1/ε₂ = ${f2(En2)} (법선 D 연속) → |E₂| = ${f2(E2)} V/m, 법선과 ${f2(t2 / deg, 1)}°\n` +
        `확인: tan θ₁/tan θ₂ = ${t1 > 1e-6 ? f2(Math.tan(t1) / Math.tan(t2)) : "−"}, ε₁/ε₂ = ${f2(e1 / e2)}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 6. Laplace 방정식의 이완법: 정사각형 홈, 윗변 V₀ = 100 V */
  (() => {
    const S = QSim.card("exp-e7-relax"); if (!S) return;
    const cv = S.$("canvas");
    let N = 0, V = null, it = 0;
    const reset = () => { N = S.val("n"); V = Array.from({ length: N + 1 }, () => new Float64Array(N + 1)); for (let i = 0; i <= N; i++) V[N][i] = 100; for (const r of [0, N]) { V[r][0] = V[r][N] = r === N ? 50 : 0; } it = 0; };
    const sweep = () => {   // 가우스-자이델 한 번
      for (let j = 1; j < N; j++) for (let i = 1; i < N; i++) V[j][i] = 0.25 * (V[j + 1][i] + V[j - 1][i] + V[j][i + 1] + V[j][i - 1]);
      it++;
    };
    function draw() {
      const c = C(), v = QSim.view(cv, 0.62), g = v.g, W = v.W, H = v.H, s = Math.min(W, H) - 20, x0 = (W - s) / 2, y0 = 10, cell = s / (N + 1);
      for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) {
        const t = Math.max(0, Math.min(1, V[j][i] / 100)); g.fillStyle = `rgb(${Math.round(40 + 200 * t)},${Math.round(70 + 60 * t)},${Math.round(200 - 160 * t)})`;
        g.fillRect(x0 + i * cell, y0 + (N - j) * cell, cell + 0.5, cell + 0.5);
      }
      g.strokeStyle = c.ink; g.lineWidth = 1; g.strokeRect(x0, y0, s, s);
      const mid = N / 2, center = N % 2 === 0 ? V[mid][mid] : 0.25 * (V[Math.floor(mid)][Math.floor(mid)] + V[Math.ceil(mid)][Math.floor(mid)] + V[Math.floor(mid)][Math.ceil(mid)] + V[Math.ceil(mid)][Math.ceil(mid)]);
      S.out(`격자 ${N} × ${N} 칸, 윗변 100 V, 나머지 세 변 0 V. 반복 ${it}회\n` +
        `가운데 전위 ${f2(center, 3)} V (정확한 값 25 V, 차이 ${f2(center - 25, 3)} V)\n` +
        `각 점을 이웃 넷의 평균으로 바꾸는 일을 되풀이합니다. 처음에는 윗변 근처만 데워지고, 반복할수록 안쪽으로 퍼집니다.`);
    }
    const L = QSim.loop(() => { for (let k = 0; k < 2; k++) sweep(); draw(); return it < 4000; }).watch(S.root);
    QSim.playButton(S.$(".play"), L);
    S.$(".reset").addEventListener("click", () => { reset(); draw(); });
    S.$(".step").addEventListener("click", () => { for (let k = 0; k < 50; k++) sweep(); draw(); });
    S.on(() => { reset(); draw(); }); QSim.redrawOn(draw); reset(); draw();
  })();
  const mu0 = 4e-7 * Math.PI;

  /* 7. 원형 고리 축 위 자계와 쌍극자 근사, 같은 크기 정사각형 고리 */
  (() => {
    const S = QSim.card("exp-e7-loop"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), I = S.val("i"), a = S.val("a") / 100, z0 = S.val("z") / 100;
      const Hc = (z) => I * a * a / (2 * Math.pow(a * a + z * z, 1.5));
      const Hd = (z) => I * a * a / (2 * Math.abs(z) ** 3);
      // 한 변 2a 정사각형 고리 축 위: 각 변의 유한 직선 자계의 축 성분 × 4
      const Hs = (z) => { const d = Math.hypot(a, z), sa = a / Math.hypot(a, d); return 4 * (I / (4 * Math.PI * d)) * 2 * sa * (a / d); };
      const Z = 4 * a, top = Hc(0) * 1.15;
      const v = QSim.view(cv, 0.45), fr = QSim.frame(v, { x0: 0, x1: Z, y0: 0, y1: top, xl: "z (m)", yl: "H (A/m)" }); fr.axes();
      fr.fn(Hc, c.main, 2.6); fr.fn(Hs, c.acc, 2, [6, 3]); fr.fn((z) => Math.min(top * 2, Hd(Math.max(z, 1e-6))), c.ink3, 1.2, [2, 3]);
      fr.dot(z0, Hc(z0), c.warn, 6);
      S.out(`원형 고리: 반지름 ${f2(a * 100, 1)} cm, I = ${I} A. 축 위 z = ${f2(z0 * 100, 1)} cm: H = ${f2(Hc(z0), 3)} A/m (B = ${f2(mu0 * Hc(z0) * 1e6, 3)} μT)\n` +
        `쌍극자 근사 Ia²/(2z³) = ${z0 > 0 ? f2(Hd(z0), 3) : "∞"} A/m${z0 > 0 ? ` (오차 ${f2((Hd(z0) / Hc(z0) - 1) * 100, 1)}%)` : ""}. 중심 I/(2a) = ${f2(Hc(0), 3)} A/m\n` +
        `한 변 2a 정사각형(주황 점선): 중심 ${f2(Hs(0), 3)} A/m, z에서 ${f2(Hs(z0), 3)} A/m. 회색 점선: 쌍극자 근사`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 8. 동축선의 H(ρ): 네 영역 */
  (() => {
    const S = QSim.card("exp-e7-coaxh"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), a = S.val("a"), b = S.val("b"), cc = b + S.val("t"), I = 1, ret = S.val("ret") / 100;   // mm
      const Ienc = (r) => (r < a ? I * r * r / (a * a) : r < b ? I : r < cc ? I - ret * I * (r * r - b * b) / (cc * cc - b * b) : I - ret * I);
      const H = (r) => Ienc(r) / (2 * Math.PI * r * 1e-3);
      const R = cc * 1.6, top = Math.max(...Array.from({ length: 400 }, (_, i) => H(0.01 + i * R / 400))) * 1.15;
      const v = QSim.view(cv, 0.45), fr = QSim.frame(v, { x0: 0, x1: R, y0: 0, y1: top, xl: "ρ (mm)", yl: "H (A/m)" }); fr.axes();
      [a, b, cc].forEach((x) => fr.path([[x, 0], [x, top]], c.rule, 1, [2, 3]));
      fr.fn((r) => H(Math.max(r, 1e-3)), c.main, 2.6, undefined, 800);
      const Hout = H(R * 0.95);
      S.out(`안 도체 a = ${f2(a, 1)} mm, 바깥 도체 ${f2(b, 1)}~${f2(cc, 1)} mm, 안 도체 1 A(+z), 바깥 도체로 ${S.val("ret")}% 되돌아옴(−z)\n` +
        `안 도체 표면 H = ${f2(H(a), 1)} A/m, 사이 가운데(${f2((a + b) / 2, 2)} mm) ${f2(H((a + b) / 2), 1)} A/m, 바깥(ρ = ${f2(R * 0.95, 1)} mm) ${f2(Hout, 2)} A/m\n` +
        `바깥 도체가 전류를 모두 되돌려야(100%) 케이블 밖 자계가 0이 됩니다. 점선: 도체 경계`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 9. 자기 회로: 철심 + 공기 틈 */
  (() => {
    const S = QSim.card("exp-e7-magcirc"); if (!S) return;
    const cv = S.$("canvas");
    const lc = 0.3, A = 4e-4, N = 500;
    function draw() {
      const c = C(), mur = S.val("mur"), g = S.val("g") / 1000, I = S.val("i");
      const Rc = lc / (mur * mu0 * A), Rg = g / (mu0 * A), R = Rc + Rg, phi = N * I / R, B = phi / A, L = N * N / R;
      const v = QSim.view(cv, 0.3), g2 = v.g, W = v.W, H = v.H, x0 = 20, w = W - 40, fc = Rc / R;
      g2.fillStyle = c.main; g2.fillRect(x0, H * 0.3, w * fc, H * 0.35); g2.fillStyle = c.acc; g2.fillRect(x0 + w * fc, H * 0.3, w * (1 - fc), H * 0.35);
      g2.fillStyle = c.ink2; g2.font = "12px " + (getComputedStyle(document.documentElement).getPropertyValue("--f-mono") || "monospace");
      g2.fillText(`철심 ${f2(fc * 100, 1)}%`, x0, H * 0.25); g2.textAlign = "right"; g2.fillText(`공기 틈 ${f2((1 - fc) * 100, 1)}%`, x0 + w, H * 0.25); g2.textAlign = "left";
      g2.fillText("기자력 NI가 두 구간에 나뉘는 비율(자기 저항 비)", x0, H * 0.88);
      S.out(`철심: 길이 30 cm, 단면 4 cm², μ_r = ${mur}. 공기 틈 ${f2(g * 1000, 2)} mm. 코일 500회, ${f2(I, 2)} A → NI = ${f2(N * I, 0)}\n` +
        `자기 저항: 철심 ${(Rc / 1e5).toFixed(2)}×10⁵, 공기 틈 ${(Rg / 1e5).toFixed(2)}×10⁵ A/Wb. 자속 ${f2(phi * 1e3, 4)} mWb, B = ${f2(B, 3)} T, L = N²/ℛ = ${f2(L * 1000, 1)} mH\n` +
        (B > 1.6 ? `B가 약 1.6 T를 넘었습니다. 실제 철심은 포화되어 이 선형 계산이 맞지 않습니다(가상 기준값).` : `포화 전(선형 모델 유효 범위로 봄)`));
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 10. 레일 위 막대: 처음 속도 v₀로 밀고 놓으면 */
  (() => {
    const S = QSim.card("exp-e7-rail"); if (!S) return;
    const cv = S.$("canvas");
    const l = 0.2, m = 0.05;   // m, kg
    function draw() {
      const c = C(), B = S.val("b"), R = S.val("r"), v0 = S.val("v0");
      const tau = m * R / (B * B * l * l), T = Math.min(5 * tau, 60);
      const v = QSim.view(cv, 0.42), fr = QSim.frame(v, { x0: 0, x1: T, y0: 0, y1: v0 * 1.1, xl: "t (s)", yl: "v (m/s)" }); fr.axes();
      fr.fn((t) => v0 * Math.exp(-t / tau), c.main, 2.6);
      fr.fn((t) => v0 * (1 - t / tau), c.ink3, 1, [4, 3]);
      const emf0 = B * l * v0, I0 = emf0 / R, F0 = I0 * l * B, E0 = 0.5 * m * v0 * v0, xstop = v0 * tau;
      S.out(`막대 질량 50 g, 레일 간격 20 cm, B = ${f2(B, 2)} T, R = ${f2(R, 2)} Ω, 처음 속도 ${f2(v0, 1)} m/s\n` +
        `처음 기전력 Blv = ${f2(emf0, 3)} V, 전류 ${f2(I0, 3)} A, 제동력 IlB = ${f2(F0, 4)} N (Lenz: 운동을 방해)\n` +
        `속도는 v₀e^(−t/τ)로 줄어듦, τ = mR/(B²l²) = ${f2(tau, 2)} s, 멈출 때까지 이동 거리 v₀τ = ${f2(xstop, 2)} m. 운동 에너지 ${f2(E0 * 1000, 1)} mJ가 모두 저항의 열이 됩니다.`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
/*__MORE__*/
})();
