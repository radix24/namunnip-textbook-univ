/* 어려운 단원 보강 탐구 카드: 등급과 거리, 중력렌즈, 뉴턴의 대포, 조석과 Roche 한계, 광학적 깊이와 흡수선,
   세 근점 이각, 대류 조건, 나선팔 감김, 2차원 푸리에 변환, 급팽창과 평탄성 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const fx = (x, n = 2) => (+x).toFixed(n);
  const deg = Math.PI / 180;
  const circ = (cx, cy, r, n = 120) => { const p = []; for (let k = 0; k <= n; k++) p.push([cx + r * Math.cos(2 * Math.PI * k / n), cy + r * Math.sin(2 * Math.PI * k / n)]); return p; };

  /* 1. 등급과 거리 (천우1-02-03) */
  (() => {
    const S = QSim.card("exp-a1-mag"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), M = S.val("M"), ld = S.val("ld"), d = Math.pow(10, ld), m = M + 5 * ld - 5;
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: 4, y0: -20, y1: 5, xl: "log₁₀ 거리 (pc)", yl: "−(겉보기 등급) : 위로 갈수록 밝음" }); f.axes();
      f.fn((x) => -(M + 5 * x - 5), c.main, 2); f.path([[0, -6], [4, -6]], c.warn, 1, [4, 3]); f.dot(ld, -m, c.acc, 6);
      f.text("맨눈 한계 6등급", 0.05, -5.6, c.warn);
      const ratio = Math.pow(10, -0.4 * (m - 6));
      S.out(`절대 등급 ${fx(M, 1)}(10 pc에 두었을 때의 밝기), 거리 ${d < 100 ? fx(d, 1) : d.toFixed(0)} pc(${fx(d * 3.26, d < 30 ? 1 : 0)}광년)\n겉보기 등급 m = M + 5 log d − 5 = ${fx(m, 2)}, 거리 지수 m − M = ${fx(m - M, 2)}\n맨눈 한계(6등급)보다 ${m < 6 ? fx(ratio, 1) + "배 밝아 맨눈으로 보인다" : (1 / ratio < 1e5 ? fx(1 / ratio, 1) : (1 / ratio).toExponential(1)) + "배 어두워 맨눈으로는 안 보인다"}\n거리가 10배가 되면 밝기는 1/100, 등급은 5 커진다(파란 선의 기울기). 주황 점: 고른 별`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 중력렌즈 (천우1-06-04) */
  (() => {
    const S = QSim.card("exp-a1-lens"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), tE = S.val("te"), b = S.val("b"), u = b / tE;
      const tp = (b + Math.sqrt(b * b + 4 * tE * tE)) / 2, tm = (b - Math.sqrt(b * b + 4 * tE * tE)) / 2;
      const mu = u > 1e-6 ? (u * u + 2) / (u * Math.sqrt(u * u + 4)) : Infinity, mup = (mu + 1) / 2, mum = (mu - 1) / 2;
      const v = QSim.view(cv, 0.56), L = 3.2, f = QSim.frame(v, { x0: -L * 1.45, x1: L * 1.45, y0: -L, y1: L, xl: "하늘의 각 (″)", yl: "", equal: true }); f.axes({ noGrid: true });
      f.path(circ(0, 0, tE), c.ink3, 1, [4, 3]); f.dot(0, 0, c.ink2, 5); f.text("렌즈 은하", 0.1, -0.35, c.ink2);
      f.dot(b, 0, c.ink3, 4); f.text("원래 위치", b + 0.1, 0.25, c.ink3);
      if (isFinite(mu)) { f.dot(tp, 0, c.warn, 3 + 3 * Math.min(mup, 4)); f.dot(tm, 0, c.warn, 3 + 3 * Math.min(mum, 4)); }
      else f.path(circ(0, 0, tE), c.warn, 3);
      S.out(`아인슈타인 반지름 θ_E = ${fx(tE, 2)}″(렌즈의 질량이 클수록 커짐), 배경 은하의 원래 위치 β = ${fx(b, 2)}″\n${isFinite(mu) ? `상이 두 개 생긴다: θ₊ = ${fx(tp, 3)}″(같은 쪽), θ₋ = ${fx(tm, 3)}″(반대쪽)\n밝기 확대: ${fx(mup, 2)}배 + ${fx(mum, 2)}배 = 모두 ${fx(mu, 2)}배` : "렌즈와 배경 은하가 정확히 한 줄: 상이 고리(아인슈타인 고리)가 된다"}\n회색 점선: 아인슈타인 고리, 회색 점: 렌즈가 없을 때 보일 위치, 빨간 점: 실제로 보이는 상(크기 = 밝기)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 뉴턴의 대포 (천우2-04-01) */
  (() => {
    const S = QSim.card("exp-a2-cannon"); if (!S) return;
    const cv = S.$("canvas"), MU = 398600, R = 6378, r0 = R + 200;
    function draw() {
      const c = C(), v0 = S.val("v"), vc = Math.sqrt(MU / r0), ve = Math.sqrt(2 * MU / r0);
      const h = r0 * v0, en = v0 * v0 / 2 - MU / r0, e = Math.sqrt(Math.max(0, 1 + 2 * en * h * h / (MU * MU))), p = h * h / MU;
      // 발사점은 근지점(v ≥ vc) 또는 원지점(v &lt; vc). 발사점을 (r0, 0)에 두고 반시계로 움직인다
      const atPeri = v0 >= vc, pts = []; let hit = false;
      for (let k = 0; k <= 720; k++) {
        const t = k * deg * 0.5, nu = atPeri ? t : Math.PI + t, den = 1 + e * Math.cos(nu);
        if (den <= 1e-6) break;
        const r = p / den; if (r > 6 * R) break;
        if (r < R) { hit = true; break; }
        pts.push([r * Math.cos(t) / R, r * Math.sin(t) / R]);
        if (t >= 2 * Math.PI) break;
      }
      const L = 3.2, v = QSim.view(cv, 0.62), f = QSim.frame(v, { x0: -L * 1.45, x1: L * 1.45, y0: -L, y1: L, xl: "지구 반지름 단위", yl: "", equal: true }); f.axes({ noGrid: true });
      f.path(circ(0, 0, 1), c.acc, 2); f.path(pts, c.main, 2); f.dot(r0 / R, 0, c.warn, 5);
      const kind = v0 >= ve ? "탈출(지구로 돌아오지 않음)" : hit ? "지구로 떨어짐" : Math.abs(v0 - vc) < 0.01 ? "원 궤도" : "타원 궤도(지구를 계속 돎)";
      S.out(`고도 200 km 산꼭대기에서 수평으로 ${fx(v0, 2)} km/s로 쏨: ${kind}\n이 높이의 원 궤도 속도 √(GM/r) = ${fx(vc, 2)} km/s, 탈출 속도 √(2GM/r) = ${fx(ve, 2)} km/s\n궤도의 찌그러진 정도(이심률) ${fx(e, 3)}${en < 0 ? `, 가장 먼 거리 ${(p / (1 - e) - R).toFixed(0)} km 높이` : ""}\n주황 원: 지구, 파란 선: 포탄의 길, 빨간 점: 발사 위치(대기 저항은 무시)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 조석력과 Roche 한계 (천우3-04-01, 3-04-02) */
  (() => {
    const S = QSim.card("exp-a3-tide"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), rp = +S.val("pl"), rm = S.val("rm"), d = S.val("d");
      const ratio = 2 * (rp / rm) / (d * d * d), dR = 2.44 * Math.cbrt(rp / rm), dRr = 1.26 * Math.cbrt(rp / rm);
      const L = 6, v = QSim.view(cv, 0.45), f = QSim.frame(v, { x0: -1.5, x1: L + 0.5, y0: -1.5, y1: 1.5, xl: "행성 반지름 단위", yl: "", equal: true }); f.axes({ noGrid: true });
      f.path(circ(0, 0, 1), c.acc, 2); f.path([[dR, -1.4], [dR, 1.4]], c.warn, 1, [4, 3]); f.text("Roche 한계(유체)", dR + 0.05, 1.2, c.warn);
      const st = Math.min(ratio, 1.5), a = 0.25 * (1 + 0.6 * st), b = 0.25 / Math.sqrt(1 + 0.6 * st);
      const ell = []; for (let k = 0; k <= 80; k++) { const t = 2 * Math.PI * k / 80; ell.push([d + a * Math.cos(t), b * Math.sin(t)]); }
      f.path(ell, ratio > 1 ? c.warn : c.main, 2);
      S.out(`행성 밀도 ${rp} g/cm³, 위성 밀도 ${fx(rm, 1)} g/cm³, 거리 ${fx(d, 2)} 행성 반지름\n위성 양 끝을 잡아당기는 조석 가속도 ÷ 위성 자체 중력 ≈ 2(ρ행성/ρ위성)(R/d)³ = ${fx(ratio, 3)}\nRoche 한계: 유체 위성 ${fx(dR, 2)} R, 단단한 위성 ${fx(dRr, 2)} R. ${d < dR ? "유체 위성이라면 부서져 고리가 된다" : "위성은 버틴다"}\n거리가 2배면 조석력은 1/8(거리의 세제곱에 반비례). 위성 모양은 늘어나는 정도를 과장해 그렸다`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 5. 광학적 깊이와 흡수선 (천우4-01-02) */
  (() => {
    const S = QSim.card("exp-a4-tau"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), t0 = Math.pow(10, S.val("lt")), sr = S.val("s");
      const I = (x) => { const t = t0 * Math.exp(-x * x); return Math.exp(-t) + sr * (1 - Math.exp(-t)); };
      let ew = 0; const n = 800; for (let k = 0; k < n; k++) { const x = -5 + 10 * (k + 0.5) / n; ew += (1 - I(x)) * 10 / n; }
      const ymax = Math.max(1.2, sr * 1.1);
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: -4, x1: 4, y0: 0, y1: ymax, xl: "선 중심에서의 파장 차(선폭 단위)", yl: "세기 / 뒤쪽 빛" }); f.axes();
      f.fn(I, c.main, 2.2); f.path([[-4, 1], [4, 1]], c.ink3, 1, [4, 3]); f.path([[-4, sr], [4, sr]], c.warn, 1, [2, 3]);
      S.out(`선 중심의 광학적 깊이 τ₀ = ${t0 < 0.1 ? t0.toFixed(3) : fx(t0, 2)}, 기체층의 원천 함수 S = 뒤쪽 빛의 ${fx(sr, 2)}배\n선 중심 세기 I = I₀e^(−τ₀) + S(1 − e^(−τ₀)) = ${fx(I(0), 3)} I₀ → ${sr < 1 ? "흡수선" : sr > 1 ? "방출선" : "선이 사라짐"}\n등가 폭(선폭 단위) ${fx(ew, 3)}${ew < 0 ? "(음수 = 방출)" : ""}. τ₀가 크면 중심이 S로 포화되고 날개만 자란다\n회색 점선: 뒤쪽 빛 I₀, 빨간 점선: 원천 함수 S, 파란 선: 나오는 빛`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 6. 세 근점 이각 (천우8-02-01) */
  (() => {
    const S = QSim.card("exp-a8-anomaly"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), e = S.val("e"), Md = S.val("M"), M = Md * deg;
      let E = e < 0.8 ? M : Math.PI, it = 0; for (; it < 50; it++) { const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); E -= dE; if (Math.abs(dE) < 1e-12) break; }
      const nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2)), r = 1 - e * Math.cos(E);
      const b = Math.sqrt(1 - e * e), L = 1.25, v = QSim.view(cv, 0.6), f = QSim.frame(v, { x0: -L * 1.5, x1: L * 1.5, y0: -L, y1: L, xl: "", yl: "", equal: true }); f.axes({ noGrid: true });
      f.path(circ(0, 0, 1), c.ink3, 1, [4, 3]);
      const el = []; for (let k = 0; k <= 160; k++) { const t = 2 * Math.PI * k / 160; el.push([Math.cos(t), b * Math.sin(t)]); } f.path(el, c.main, 2);
      const Fx = e, px = Math.cos(E), py = b * Math.sin(E);
      f.dot(0, 0, c.ink3, 3); f.dot(Fx, 0, c.acc, 6); f.text("초점(행성)", Fx + 0.04, -0.12, c.acc);
      f.path([[0, 0], [Math.cos(E), Math.sin(E)]], c.ink3, 1); f.path([[Math.cos(E), Math.sin(E)], [px, py]], c.ink3, 1, [2, 3]);
      f.path([[Fx, 0], [px, py]], c.warn, 1.5); f.dot(px, py, c.warn, 5);
      f.path([[0, 0], [Math.cos(M), Math.sin(M)]], c.main, 1, [2, 3]); f.dot(Math.cos(M), Math.sin(M), c.main, 3);
      S.out(`이심률 ${fx(e, 2)}, 평균 근점 이각 M = ${fx(Md, 1)}°(시간에 비례하는 가상의 각)\n이심 근점 이각 E = ${fx(E / deg, 2)}°(보조원 위의 점의 각, Kepler 방정식 M = E − e sin E를 Newton 방법 ${it}번으로 풂)\n진근점 이각 ν = ${fx(((nu / deg) + 360) % 360, 2)}°(초점에서 실제 위성을 본 각), 거리 r = ${fx(r, 3)} a\n파란 점선·점: 평균 근점 이각 방향, 회색: 보조원과 E, 빨간 선·점: 실제 위성 위치와 ν`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 7. 대류 조건 (천우9-03-02) */
  (() => {
    const S = QSim.card("exp-a9-parcel"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), gr = S.val("gr"), ga = S.val("ga"), dp = 0.5;
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: 1, y0: -0.45, y1: 0.05, xl: "위로 올라간 정도 (−Δln P)", yl: "Δln T" }); f.axes();
      f.fn((x) => -gr * x, c.warn, 2.2); f.fn((x) => -ga * x, c.main, 2.2, [6, 3]);
      const dT = (gr - ga) * dp;
      f.dot(dp, -ga * dp, c.main, 6); f.dot(dp, -gr * dp, c.warn, 4);
      S.out(`주변의 실제 기울기 ∇ = ${fx(gr, 2)}(복사만으로 나를 때 필요한 기울기), 단열 기울기 ∇_ad = ${fx(ga, 2)}\n기체 덩어리를 압력이 e^0.5배 낮은 곳까지 올리면: 덩어리는 단열로 식어 Δln T = −${fx(ga * dp, 3)}, 주변은 −${fx(gr * dp, 3)}\n덩어리가 주변보다 ${dT > 0 ? "뜨겁다(가볍다) → 계속 떠오른다: 대류" : dT < 0 ? "차갑다(무겁다) → 제자리로 돌아온다: 복사층(안정)" : "같다 → 경계"} (Schwarzschild 조건 ∇ > ∇_ad이면 대류)\n빨간 선: 주변 온도, 파란 점선: 올라가는 덩어리의 온도`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 8. 나선팔 감김 문제 (천우12-01-03) */
  (() => {
    const S = QSim.card("exp-a12-winding"); if (!S) return;
    const cv = S.$("canvas"), K = 1.0227e-3;
    function draw() {
      const c = C(), t = S.val("t"), V = 220, Op = S.val("op");
      const L = 16, v = QSim.view(cv, 0.6), f = QSim.frame(v, { x0: -L * 1.45, x1: L * 1.45, y0: -L, y1: L, xl: "kpc", yl: "", equal: true }); f.axes({ noGrid: true });
      const arm = [], pat = [];
      for (let R = 2; R <= 15; R += 0.1) { const th = V * K * t / R; arm.push([R * Math.cos(th), R * Math.sin(th)]); const tp = Op * K * t + 0.0; pat.push([R * Math.cos(tp), R * Math.sin(tp)]); }
      f.path(arm, c.main, 2); f.path(pat, c.warn, 2, [5, 3]); f.dot(0, 0, c.acc, 5);
      const turns = V * K * t * (1 / 2 - 1 / 15) / (2 * Math.PI);
      S.out(`회전 속도 ${V} km/s로 일정(평평한 회전 곡선), 경과 시간 ${t.toFixed(0)}백만 년\n같은 별들로 된 팔(파란 선)은 안쪽이 더 빨리 돌아 2~15 kpc 사이가 ${fx(turns, 2)}바퀴 감겼다\n밀도파 무늬(빨간 점선)는 패턴 속도 ${Op} km/s/kpc로 모양을 유지한 채 함께 돈다\n태양 위치(8 kpc)의 공전 주기 약 ${(2 * Math.PI * 8 / (V * K)).toFixed(0)}백만 년. 100억 년이면 물질 팔은 수십 바퀴 감겨 알아볼 수 없다`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 9. 2차원 푸리에 변환 (천우13-03-01) */
  (() => {
    const S = QSim.card("exp-a13-fourier"); if (!S) return;
    const cv = S.$("canvas"), N = 32;
    function draw() {
      const c = C(), k1 = S.val("k"), th = S.val("th") * deg, add = S.val("add");
      const ux = k1 * Math.cos(th), uy = k1 * Math.sin(th), img = new Float64Array(N * N);
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) img[y * N + x] = Math.cos(2 * Math.PI * (ux * x + uy * y)) + (add === "yes" ? Math.cos(2 * Math.PI * (4 / N) * y) : 0);
      const P = new Float64Array(N * N); let pmax = 0, best = [0, 0];
      for (let v2 = 0; v2 < N; v2++) for (let u2 = 0; u2 < N; u2++) { let re = 0, im = 0; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const a = -2 * Math.PI * (u2 * x + v2 * y) / N, g = img[y * N + x]; re += g * Math.cos(a); im += g * Math.sin(a); } const p = re * re + im * im; P[v2 * N + u2] = p; if (p > pmax) { pmax = p; best = [u2, v2]; } }
      const v = QSim.view(cv, 0.5), sz = v.H - 8, g = v.g;
      const off = document.createElement("canvas"); off.width = N; off.height = N; const og = off.getContext("2d"), im1 = og.createImageData(N, N), im2 = og.createImageData(N, N);
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const q = Math.round(127 + 60 * img[y * N + x]); const k = 4 * (y * N + x); im1.data[k] = im1.data[k + 1] = im1.data[k + 2] = Math.max(0, Math.min(255, q)); im1.data[k + 3] = 255;
        const sx = (x + N / 2) % N, sy = (y + N / 2) % N, pp = Math.round(255 * Math.sqrt(P[sy * N + sx] / pmax)), k2 = 4 * (y * N + x); im2.data[k2] = im2.data[k2 + 1] = im2.data[k2 + 2] = pp; im2.data[k2 + 3] = 255; }
      g.save(); g.imageSmoothingEnabled = false; og.putImageData(im1, 0, 0); g.drawImage(off, 4, 4, sz, sz); og.putImageData(im2, 0, 0); g.drawImage(off, sz + 16, 4, sz, sz); g.restore();
      g.save(); g.fillStyle = c.ink3; g.font = "11px monospace"; g.fillText("영상", 8, 16); g.fillText("파워 스펙트럼(가운데 = 0)", sz + 20, 16); g.restore();
      const bu = best[0] > N / 2 ? best[0] - N : best[0], bv = best[1] > N / 2 ? best[1] - N : best[1];
      S.out(`줄무늬: 공간 주파수 ${fx(k1, 3)} 주기/픽셀(간격 ${fx(1 / k1, 1)}픽셀), 방향 ${fx(th / deg, 0)}°${add === "yes" ? " + 가로줄 무늬(4주기/32픽셀)" : ""}\n32×32 영상을 직접 2차원 DFT로 계산: 가장 센 성분(같은 세기가 여럿이면 그 가운데 하나) (u, v) = (${bu}, ${bv})/32 주기/픽셀, 원점에 대칭인 점이 짝으로 있다\n줄무늬가 촘촘할수록 점이 가운데에서 멀어지고, 줄무늬를 돌리면 점도 같은 각만큼 돈다(줄에 수직인 방향)\n왼쪽: 영상, 오른쪽: 파워 스펙트럼(밝을수록 셈, 제곱근으로 표시)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 10. 급팽창과 평탄성 문제 (천우16-06-03) */
  (() => {
    const S = QSim.card("exp-a16-flat"); if (!S) return;
    const cv = S.$("canvas"), lae = -28, laeq = Math.log10(3e-4);
    function draw() {
      const c = C(), N = S.val("n"), las = lae - N / Math.LN10;
      // |Ω − 1|: 급팽창 시작에 1. 급팽창 동안 ∝ a^−2, 복사 시대 ∝ a², 물질 시대 ∝ a
      const lo = (la) => la <= las ? 0 : la <= lae ? -2 * (la - las) : la <= laeq ? -2 * (lae - las) + 2 * (la - lae) : -2 * (lae - las) + 2 * (laeq - lae) + (la - laeq);
      const today = lo(0);
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: -60, x1: 0, y0: -60, y1: 60, xl: "log₁₀ 척도 인자 a", yl: "log₁₀ |Ω − 1|" }); f.axes();
      f.fn((x) => lo(x), c.main, 2.2); f.path([[-60, Math.log10(0.005)], [0, Math.log10(0.005)]], c.warn, 1, [4, 3]);
      const noInf = 2 * (laeq - lae) + (0 - laeq);
      S.out(`급팽창 e-배수 N = ${N}(크기가 e^${N} ≈ 10^${(N / Math.LN10).toFixed(1)}배 커짐), 급팽창은 a = 10⁻²⁸에서 끝남\n급팽창 시작에 |Ω − 1| = 1이었다면 오늘 |Ω − 1| ≈ 10^${today.toFixed(1)} ${today < Math.log10(0.005) ? "→ 관측 한계(0.005, 빨간 점선)보다 작아 평탄해 보인다" : "→ 오늘 우주가 크게 휘어 있어야 한다(관측과 어긋남)"}\n급팽창이 없으면 같은 시작점에서 오늘 10^${noInf.toFixed(1)}: 처음에 1과 ${(-Math.log10(0.005) + noInf).toFixed(0)}자리까지 같아야 했다(평탄성 문제)\n급팽창 동안 |Ω − 1| ∝ 1/a², 그 뒤 복사 시대 ∝ a², 물질 시대 ∝ a(암흑 에너지 무시)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
