/* 전전7 공학전자기학 탐구 카드 묶음
   1 좌표계 성분 변환(01-01)  2 2차원 선속과 순환(01-02)  3 유한 선전하(02-01)  4 Gauss 법칙의 E(r)(02-02)
   5 유전체 경계의 전계 굴절(03-01)  6 Laplace 방정식 이완법(03-03) */
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
})();
