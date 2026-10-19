/* 물리18 실습 카드 묶음: 선속과 순환, 대칭 행렬의 고유벡터, Fourier 부분합, 확산 모드 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const f4 = (v) => (Math.abs(v) < 5e-5 ? 0 : v).toFixed(4);

  /* 1. 상자의 선속·순환과 발산·회전의 넓이 적분 (01-01) */
  (() => {
    const S = QSim.card("lab-p18-flux"); if (!S) return;
    const cv = S.$("canvas");
    const F = {
      src: { n: "F = (x, y) 퍼져 나감", f: (x, y) => [x, y], div: () => 2, curl: () => 0 },
      rot: { n: "F = (−y, x) 소용돌이", f: (x, y) => [-y, x], div: () => 0, curl: () => 2 },
      sad: { n: "F = (x, −y) 안장", f: (x, y) => [x, -y], div: () => 0, curl: () => 0 },
      sq: { n: "F = (x², xy)", f: (x, y) => [x * x, x * y], div: (x) => 3 * x, curl: (x, y) => y },
      shear: { n: "F = (y, 0) 층밀림", f: (x, y) => [y, 0], div: () => 0, curl: () => -1 }
    };
    function draw() {
      const c = C(), k = F[S.val("field")], cx = S.val("cx"), cy = S.val("cy"), a = S.val("a");
      const v = QSim.view(cv, 0.62), f = QSim.frame(v, { x0: -2.2, x1: 2.2, y0: -2.2, y1: 2.2, equal: true }); f.axes({ noGrid: true });
      let mx = 0; for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) { const [u, w] = k.f(i / 2, j / 2); mx = Math.max(mx, Math.hypot(u, w)); }
      const s = 0.4 / (mx || 1);
      for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) { const x = i / 2, y = j / 2, [u, w] = k.f(x, y); f.arrow(x, y, u * s, w * s, c.soft); }
      f.path([[cx - a, cy - a], [cx + a, cy - a], [cx + a, cy + a], [cx - a, cy + a], [cx - a, cy - a]], c.main, 2.5);
      // 경계 적분(시계 반대 방향): 선속 F·n, 순환 F·t
      const N = 400, h = 2 * a / N; let flux = 0, circ = 0;
      for (let i = 0; i < N; i++) {
        const t = -a + (i + 0.5) * h;
        let F1 = k.f(cx + t, cy - a); flux += -F1[1] * h; circ += F1[0] * h;   // 아래 변, n = (0,−1), t = (1,0)
        F1 = k.f(cx + a, cy + t); flux += F1[0] * h; circ += F1[1] * h;       // 오른쪽 변
        F1 = k.f(cx - t, cy + a); flux += F1[1] * h; circ += -F1[0] * h;      // 위 변
        F1 = k.f(cx - a, cy - t); flux += -F1[0] * h; circ += -F1[1] * h;     // 왼쪽 변
      }
      const M = 120, g = 2 * a / M; let D = 0, R = 0;
      for (let i = 0; i < M; i++) for (let j = 0; j < M; j++) { const x = cx - a + (i + 0.5) * g, y = cy - a + (j + 0.5) * g; D += k.div(x, y) * g * g; R += k.curl(x, y) * g * g; }
      S.out(`${k.n}, 정사각형 중심 (${cx}, ${cy}), 반폭 ${a}\n경계로 나가는 선속 ∮F·n ds = ${f4(flux)},  넓이 적분 ∬∇·F dA = ${f4(D)}\n경계를 도는 순환 ∮F·dr = ${f4(circ)},  넓이 적분 ∬(∇×F)_z dA = ${f4(R)}\n(2차원 발산 정리와 Green·Stokes 정리: 각 줄의 두 값이 같다)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 대칭 행렬이 원을 타원으로: 고유벡터 (02-01) */
  (() => {
    const S = QSim.card("lab-p18-eigen"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), a = S.val("a"), b = S.val("b"), d = S.val("d"), th = S.val("th") * Math.PI / 180;
      const tr = a + d, det = a * d - b * b, disc = Math.sqrt(Math.max(0, tr * tr / 4 - det));
      const l1 = tr / 2 + disc, l2 = tr / 2 - disc;
      const ev = (l) => { let x = b, y = l - a; if (Math.hypot(x, y) < 1e-9) { x = l - d; y = b; } if (Math.hypot(x, y) < 1e-9) { x = 1; y = 0; } const n = Math.hypot(x, y); return [x / n, y / n]; };
      let e1 = ev(l1), e2 = ev(l2); if (Math.abs(b) < 1e-12) { e1 = a >= d ? [1, 0] : [0, 1]; e2 = a >= d ? [0, 1] : [1, 0]; }
      const L = Math.max(1.2, Math.abs(l1), Math.abs(l2)) * 1.15;
      const v = QSim.view(cv, 0.62), f = QSim.frame(v, { x0: -L, x1: L, y0: -L, y1: L, equal: true }); f.axes({ noGrid: true });
      const circ = [], ell = [];
      for (let i = 0; i <= 120; i++) { const t = 2 * Math.PI * i / 120, x = Math.cos(t), y = Math.sin(t); circ.push([x, y]); ell.push([a * x + b * y, b * x + d * y]); }
      f.path(circ, c.rule, 1.5); f.path(ell, c.main, 2.5);
      f.path([[-L * e1[0], -L * e1[1]], [L * e1[0], L * e1[1]]], c.acc, 1.2, [6, 4]);
      f.path([[-L * e2[0], -L * e2[1]], [L * e2[0], L * e2[1]]], c.acc, 1.2, [6, 4]);
      const x = Math.cos(th), y = Math.sin(th), Ax = a * x + b * y, Ay = b * x + d * y;
      f.arrow(0, 0, x, y, c.ink3, "v"); f.arrow(0, 0, Ax, Ay, c.warn, "Av");
      const ang = Math.acos(Math.max(-1, Math.min(1, (x * Ax + y * Ay) / (Math.hypot(Ax, Ay) || 1)))) * 180 / Math.PI;
      S.out(`A = [[${a}, ${b}], [${b}, ${d}]]: 고유값 λ₁ = ${l1.toFixed(3)}, λ₂ = ${l2.toFixed(3)} (합 ${tr.toFixed(3)} = 대각합, 곱 ${det.toFixed(3)} = 행렬식)\n고유벡터 e₁ = (${e1[0].toFixed(3)}, ${e1[1].toFixed(3)}), e₂ = (${e2[0].toFixed(3)}, ${e2[1].toFixed(3)}), 내적 ${(e1[0] * e2[0] + e1[1] * e2[1]).toFixed(3)}\n시험 벡터 v의 각 ${S.val("th")}°: v와 Av 사이 각 ${ang.toFixed(1)}° ${ang < 0.5 || ang > 179.5 ? "(나란함: 고유벡터 방향)" : ""}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. Fourier 부분합, Gibbs 현상, Parseval (03-01) */
  (() => {
    const S = QSim.card("lab-p18-fourier"); if (!S) return;
    const cv = S.$("canvas");
    const W = {
      sq: { n: "사각파", f: (x) => (x > 0 ? 1 : -1), b: (n) => (n % 2 ? 4 / (n * Math.PI) : 0), E: 1 },
      saw: { n: "톱니파 f = x/π", f: (x) => x / Math.PI, b: (n) => 2 * (n % 2 ? 1 : -1) / (n * Math.PI), E: 1 / 3 },
      tri: { n: "삼각파", f: (x) => 1 - 2 * Math.abs(x) / Math.PI, a: (n) => (n % 2 ? 8 / (n * n * Math.PI * Math.PI) : 0), E: 1 / 3 }
    };
    function draw() {
      const c = C(), w = W[S.val("wave")], N = S.val("N");
      const sum = (x) => { let s = 0; for (let n = 1; n <= N; n++) s += (w.b ? w.b(n) * Math.sin(n * x) : 0) + (w.a ? w.a(n) * Math.cos(n * x) : 0); return s; };
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: -Math.PI, x1: Math.PI, y0: -1.4, y1: 1.4, xl: "x", yl: "f" }); f.axes();
      f.fn(w.f, c.ink3, 1.5, [5, 4], 600); f.fn(sum, c.main, 2.2, null, 1200);
      let E = 0; for (let n = 1; n <= N; n++) { const an = w.a ? w.a(n) : 0, bn = w.b ? w.b(n) : 0; E += (an * an + bn * bn) / 2; }
      let mx = -9; for (let i = 0; i <= 4000; i++) { const x = 1e-4 + (Math.PI - 2e-4) * i / 4000; mx = Math.max(mx, sum(x)); }
      const jump = S.val("wave") === "tri" ? null : (S.val("wave") === "sq" ? 2 : 2);
      const over = S.val("wave") === "sq" ? (mx - 1) / jump * 100 : S.val("wave") === "saw" ? (mx - 1) / jump * 100 : null;
      S.out(`${w.n}, 항 ${N}개(n = 1~${N})\n평균 세기 ⟨f²⟩ = ${w.E.toFixed(4)}, 부분합에 담긴 세기 ${E.toFixed(4)} (${(E / w.E * 100).toFixed(2)}%)\n부분합의 최댓값 ${mx.toFixed(4)}${over === null ? " (연속 함수라 넘침 없음)" : over > 0 ? `, 불연속 높이에 대한 넘침 ${over.toFixed(1)}%` : " (원래 함수보다 낮음)"}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 확산 방정식의 모드 감쇠 (06-02) */
  (() => {
    const S = QSim.card("lab-p18-heat"); if (!S) return;
    const [cvU, cvB] = S.$$("canvas"), N = 40; let t = 0;
    const PI = Math.PI, box = (a, b) => (n) => 2 / (n * PI) * (Math.cos(n * PI * a) - Math.cos(n * PI * b));   // 구간 [a, b]에서 1인 함수의 사인 계수
    const init = {
      box: { n: "가운데 절반만 뜨거움", f: (x) => (x > 0.25 && x < 0.75 ? 1 : 0), b: box(0.25, 0.75) },
      spike: { n: "x = 0.2 근처만 뜨거움", f: (x) => (Math.abs(x - 0.2) < 0.03 ? 1 : 0), b: box(0.17, 0.23) },
      tri: { n: "삼각형", f: (x) => 1 - Math.abs(2 * x - 1), b: (n) => 8 * Math.sin(n * PI / 2) / (n * n * PI * PI) }
    };
    let b = [], key = "";
    function coeffs() {
      const k = S.val("init"); if (k === key) return; key = k; b = [0];
      for (let n = 1; n <= N; n++) b.push(init[k].b(n));
    }
    function draw() {
      coeffs();
      const c = C(), D = S.val("D") * 1e-3, amp = (n) => b[n] * Math.exp(-D * (n * Math.PI) ** 2 * t);
      const u = (x) => { let s = 0; for (let n = 1; n <= N; n++) s += amp(n) * Math.sin(n * Math.PI * x); return s; };
      const v1 = QSim.view(cvU, 0.45), f1 = QSim.frame(v1, { x0: 0, x1: 1, y0: -0.15, y1: 1.15, xl: "x / L", yl: "u" }); f1.axes();
      f1.fn(init[S.val("init")].f, c.ink3, 1.2, [4, 4], 400); f1.fn(u, c.main, 2.5, null, 400);
      f1.fn((x) => amp(1) * Math.sin(Math.PI * x), c.acc, 1.5, [6, 4], 200);
      const v2 = QSim.view(cvB, 0.3), f2 = QSim.frame(v2, { x0: 0.5, x1: 15.5, y0: -0.7, y1: 1.4, xl: "n", yl: "b_n(t)" }); f2.axes({ noGrid: true });
      const g = v2.g; for (let n = 1; n <= 15; n++) { const a = amp(n); g.fillStyle = c.main; g.fillRect(f2.X(n - 0.35), Math.min(f2.Y(0), f2.Y(a)), f2.sx * 0.7, Math.abs(f2.Y(a) - f2.Y(0))); }
      const r3 = Math.abs(b[1]) > 1e-9 ? amp(3) / amp(1) : NaN;
      S.out(`${init[S.val("init")].n}, D = ${S.val("D")}×10⁻³ (L = 1, 단위 시간), t = ${t.toFixed(2)}\n첫 모드 크기 b₁(t) = ${amp(1).toFixed(4)} (주황 점선), 1/e 시간 τ₁ = 1/(Dπ²) = ${(1 / (D * Math.PI * Math.PI)).toFixed(1)}\n셋째/첫째 모드 비 ${isFinite(r3) ? r3.toFixed(4) : "—"}, 셋째 모드 1/e 시간 τ₃ = τ₁/9 = ${(1 / (9 * D * Math.PI * Math.PI)).toFixed(1)}`);
    }
    const L = QSim.loop((dt) => { t += dt * S.val("sp"); draw(); }).watch(S.root);
    QSim.playButton(S.$(".play"), L);
    S.$(".reset").addEventListener("click", () => { t = 0; draw(); });
    S.on(() => { t = 0; draw(); }); QSim.redrawOn(draw); draw();
  })();
})();
