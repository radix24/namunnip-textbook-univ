/* 물리5 실습 카드 묶음: 영상 전하, 완화법, 다중극 전개, 유전체 경계 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const heat = (g, W, H, f, lo, hi, levels) => {   // 등전위 색 띠와 등고선
    const img = g.createImageData(W, H), d = img.data, cs = getComputedStyle(document.documentElement);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const v = f(i, j), k = 4 * (j * W + i);
      if (!isFinite(v)) { d[k + 3] = 0; continue; }
      const u = Math.max(0, Math.min(1, (v - lo) / (hi - lo))), band = Math.floor(u * levels), edge = Math.abs(u * levels - Math.round(u * levels)) < 0.06;
      const r = 70 + 185 * u, b = 255 - 185 * u, gg = 120 + 60 * (1 - Math.abs(2 * u - 1));
      d[k] = edge ? 30 : r; d[k + 1] = edge ? 30 : gg; d[k + 2] = edge ? 30 : b; d[k + 3] = edge ? 200 : 70 + (band % 2) * 15;
    }
    void cs; return img;
  };

  /* 1. 영상 전하 (04-02) */
  (() => {
    const S = QSim.card("lab-p5-image"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), mode = S.val("mode"), d = mode === "sphere" ? Math.max(1.1, S.val("d")) : S.val("d");
      const v = QSim.view(cv, 0.62), g = v.g, W = Math.floor(v.W), H = Math.floor(v.H);
      const X0 = -3, X1 = 3, sc = W / (X1 - X0), Y1 = H / sc / 2, Y0 = -Y1;
      const toX = (x) => (x - X0) * sc, toY = (y) => (Y1 - y) * sc;
      let qs;
      if (mode === "plane") qs = [[0, d, 1], [0, -d, -1]];
      else qs = [[d, 0, 1], [1 / d, 0, -1 / d]];
      const V = (x, y) => { if (mode === "plane" && y < 0) return NaN; if (mode === "sphere" && x * x + y * y < 1) return NaN; let s = 0; qs.forEach(([a, b, q]) => (s += q / Math.hypot(x - a, y - b))); return s; };
      const res = 2, w = Math.ceil(W / res), h = Math.ceil(H / res);
      const img = heat(g, w, h, (i, j) => V(X0 + i * res / sc, Y1 - j * res / sc), -1, 1, 14);
      const off = document.createElement("canvas"); off.width = w; off.height = h; off.getContext("2d").putImageData(img, 0, 0);
      g.imageSmoothingEnabled = true; g.drawImage(off, 0, 0, W, H);
      g.fillStyle = c.ink3;
      if (mode === "plane") { g.globalAlpha = 0.5; g.fillRect(0, toY(0), W, H - toY(0)); g.globalAlpha = 1; }
      else { g.globalAlpha = 0.5; g.beginPath(); g.arc(toX(0), toY(0), sc, 0, 7); g.fill(); g.globalAlpha = 1; }
      const [a, b] = qs[0], [ia, ib, iq] = qs[1];
      g.fillStyle = c.warn; g.beginPath(); g.arc(toX(a), toY(b), 6, 0, 7); g.fill();
      g.strokeStyle = c.main; g.setLineDash([3, 3]); g.beginPath(); g.arc(toX(ia), toY(ib), 6, 0, 7); g.stroke(); g.setLineDash([]);
      let F, txt;
      if (mode === "plane") { F = -1 / (4 * d * d); txt = `접지 평면 위 높이 d = ${d.toFixed(2)}에 +q. 영상 전하 −q는 평면 아래 같은 거리 (점선 원)\n전하가 받는 힘 F = −q²/(4πε₀(2d)²) = ${F.toFixed(4)} (단위 q²/4πε₀, 평면 쪽)`; }
      else { F = -(1 * d) / Math.pow(d * d - 1, 2); txt = `접지 도체 구 (R = 1) 중심에서 a = ${d.toFixed(2)}에 +q. 영상 전하 q' = −q/a = ${(-1 / d).toFixed(3)}q, 위치 b = R²/a = ${(1 / d).toFixed(3)}\n힘 F = −q²Ra/(4πε₀(a²−R²)²) = ${F.toFixed(4)} (단위 q²/4πε₀, 구 쪽)`; }
      S.out(txt + "\n색: 전위 (빨강 +, 파랑 −), 어두운 선: 등전위선. 도체 면이 등전위선(V = 0)과 겹친다");
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 라플라스 방정식의 완화법 (04-03) */
  (() => {
    const S = QSim.card("lab-p5-relax"); if (!S) return;
    const cv = S.$("canvas"); let N, U, it;
    const exact = (x, y) => { let s = 0; for (let n = 1; n < 200; n += 2) { const k = n * Math.PI; s += 4 / k * Math.sin(k * x) * (Math.exp(k * (y - 1)) - Math.exp(-k * (y + 1))) / (1 - Math.exp(-2 * k)); } return s; };
    function reset() { N = S.val("n"); U = Array.from({ length: N + 1 }, (_, j) => Array(N + 1).fill(0)); for (let i = 0; i <= N; i++) U[N][i] = 1; U[N][0] = U[N][N] = 0.5; it = 0; draw(); }
    function sweep(k) { for (let r = 0; r < k; r++) { for (let j = 1; j < N; j++) for (let i = 1; i < N; i++) U[j][i] = 0.25 * (U[j][i - 1] + U[j][i + 1] + U[j - 1][i] + U[j + 1][i]); it++; } }
    function draw() {
      const c = C(), v = QSim.view(cv, 0.62), g = v.g, side = Math.min(v.W * 0.55, v.H - 10), x0 = 6, y0 = 4, cell = side / N;
      for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) { const u = U[j][i]; g.fillStyle = `rgb(${Math.round(70 + 185 * u)},${Math.round(120 + 40 * u)},${Math.round(255 - 185 * u)})`; g.fillRect(x0 + i * cell, y0 + (N - j) * cell, cell + 0.5, cell + 0.5); }
      const fx = v.W * 0.6, fw = v.W * 0.38;
      g.fillStyle = c.ink2; g.font = "12px sans-serif"; g.fillText("가운데 세로줄 x = 1/2의 V(y)", fx, 16);
      const px = (y) => fx + y * fw, py = (u) => v.H - 20 - u * (v.H - 50);
      g.strokeStyle = c.rule; g.strokeRect(fx, py(1), fw, py(0) - py(1));
      g.strokeStyle = c.ink3; g.setLineDash([4, 3]); g.beginPath(); for (let k = 0; k <= 100; k++) { const y = k / 100, u = k === 100 ? 1 : exact(0.5, y); k ? g.lineTo(px(y), py(u)) : g.moveTo(px(y), py(u)); } g.stroke(); g.setLineDash([]);
      g.strokeStyle = c.main; g.lineWidth = 2; g.beginPath(); const mi = Math.round(N / 2); for (let j = 0; j <= N; j++) { const y = j / N; j ? g.lineTo(px(y), py(U[j][mi])) : g.moveTo(px(y), py(U[j][mi])); } g.stroke(); g.lineWidth = 1;
      let err = 0; for (let j = 1; j < N; j++) for (let i = 1; i < N; i++) err = Math.max(err, Math.abs(U[j][i] - exact(i / N, j / N)));
      S.out(`정사각형 상자: 윗변 V = 1, 나머지 세 변 0. 격자 ${N}×${N}, 반복 ${it}번 (각 점 ← 이웃 넷의 평균)\n가운데 점 V = ${U[mi][mi].toFixed(4)} (정확한 값 0.25: 네 변을 돌려 겹치면 V = 1이 되므로), 급수해와의 최대 차이 ${err.toFixed(4)}\n오른쪽: 수치해(파랑)와 푸리에 급수해(회색 점선)`);
    }
    const L = QSim.loop(() => { sweep(S.val("n") > 40 ? 4 : 2); draw(); return it < 4000; }).watch(S.root);
    QSim.playButton(S.$(".play"), L, () => { if (it >= 4000) reset(); });
    S.$(".reset").addEventListener("click", () => { L.stop(); S.$(".play").textContent = "재생"; reset(); });
    S.on(() => { L.stop(); S.$(".play").textContent = "재생"; reset(); }); QSim.redrawOn(draw); reset();
  })();

  /* 3. 다중극 전개 (04-04) */
  (() => {
    const S = QSim.card("lab-p5-multi"); if (!S) return;
    const cv = S.$("canvas");
    const CFG = { dip: [[0.5, 1], [-0.5, -1]], quad: [[1, 1], [0, -2], [-1, 1]], off: [[0.5, 1]], mix: [[0.8, 2], [-0.4, -1]] };
    const P = [(x) => 1, (x) => x, (x) => 0.5 * (3 * x * x - 1), (x) => 0.5 * (5 * x ** 3 - 3 * x)];
    function draw() {
      const c = C(), q = CFG[S.val("cfg")], th = S.val("th") * Math.PI / 180, ct = Math.cos(th);
      const exact = (r) => q.reduce((s, [z, qq]) => s + qq / Math.sqrt(r * r + z * z - 2 * r * z * ct), 0);
      // z축 위 전하는 r'^n P_n(cos α) = z^n P_n(cos θ) (P_n의 홀짝성)
      const mom = (n) => q.reduce((s, [z, qq]) => s + qq * Math.pow(z, n), 0);
      const tn = (n, r) => mom(n) * P[n](ct) / Math.pow(r, n + 1);
      const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: 0, x1: 2, y0: -6, y1: 1, xl: "log₁₀ r", yl: "log₁₀ |V|" }); f.axes();
      const L = (fn) => (x) => { const y = Math.abs(fn(10 ** x)); return y > 0 ? Math.log10(y) : NaN; };
      f.fn(L(exact), c.ink, 2.5);
      const cols = [c.ink3, c.acc, c.main, c.warn];
      for (let n = 0; n < 4; n++) f.fn(L((r) => { let s = 0; for (let k = 0; k <= n; k++) s += tn(k, r); return s; }), cols[n], 1.4, [5, 3]);
      const r0 = 10 ** S.val("lr"), ex = exact(r0); let acc = 0; const parts = [];
      for (let n = 0; n < 4; n++) { acc += tn(n, r0); parts.push(`${n}차까지 ${acc.toPrecision(4)}`); }
      S.out(`전하 배치 (z축 위, 단위 q, 4πε₀ = 1): ${q.map(([z, qq]) => `${qq > 0 ? "+" : ""}${qq} @ z=${z}`).join(", ")}\n전하 모멘트: Q = ${mom(0)}, p_z = ${mom(1).toFixed(2)}, 사중극 Σqz² = ${mom(2).toFixed(2)}\nr = ${r0.toFixed(2)}, θ = ${S.val("th")}°: 정확 ${ex.toPrecision(4)} / ${parts.join(", ")}\n검정: 정확한 값, 점선: 0차(회색)·1차(주황)·2차(파랑)·3차(빨강)까지 더한 근사`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 유전체 경계에서 전기력선의 꺾임 (05-03) */
  (() => {
    const S = QSim.card("lab-p5-refract"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), e1 = S.val("e1"), e2 = S.val("e2"), t1 = S.val("t1") * Math.PI / 180;
      const t2 = Math.atan(Math.tan(t1) * e2 / e1), E1 = 1, Ep = E1 * Math.sin(t1), En1 = E1 * Math.cos(t1), En2 = En1 * e1 / e2, E2 = Math.hypot(Ep, En2);
      const v = QSim.view(cv, 0.6), g = v.g, f = QSim.frame(v, { x0: -2, x1: 2, y0: -1.2, y1: 1.2, equal: true }); f.axes({ noGrid: true });
      g.fillStyle = `rgba(90,100,230,${Math.min(0.5, 0.05 * e1)})`; g.fillRect(f.X(-2), f.Y(1.2), f.X(2) - f.X(-2), f.Y(0) - f.Y(1.2));
      g.fillStyle = `rgba(90,100,230,${Math.min(0.5, 0.05 * e2)})`; g.fillRect(f.X(-2), f.Y(0), f.X(2) - f.X(-2), f.Y(-1.2) - f.Y(0));
      for (let k = -4; k <= 4; k++) {
        const x0 = k * 0.45, xs = x0 - 1.2 * Math.tan(t1), xe = x0 + 1.2 * Math.tan(t2);
        f.path([[xs, 1.2], [x0, 0], [xe, -1.2]], c.main, 1.6);
      }
      f.arrow(-0.6 * Math.tan(t1), 0.6, 0.5 * Math.sin(t1), -0.5 * Math.cos(t1), c.warn);
      f.arrow(0, 0, 0.5 * (E2 / E1) * Math.sin(t2), -0.5 * (E2 / E1) * Math.cos(t2), c.warn);
      f.path([[0, 1.1], [0, -1.1]], c.ink3, 1, [3, 3]);
      f.text(`ε₁ = ${e1}`, -1.9, 1.0, c.ink2); f.text(`ε₂ = ${e2}`, -1.9, -1.05, c.ink2);
      S.out(`위 매질 비유전율 ${e1}, 아래 ${e2}, 경계에 자유 전하 없음\n법선과의 각: θ₁ = ${S.val("t1")}° → θ₂ = ${(t2 * 180 / Math.PI).toFixed(1)}° (tanθ₂/tanθ₁ = ε₂/ε₁ = ${(e2 / e1).toFixed(2)})\n세기: E₂/E₁ = ${(E2 / E1).toFixed(3)}, 수직 성분 D는 연속 (ε₁E₁⊥ = ε₂E₂⊥), 평행 성분 E는 연속 (빨간 화살표: E)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
