/* 물리8 실습 카드 묶음: 무한 우물의 중첩, 유한 우물 그래프 풀이, 퍼텐셜 계단, 수소 지름 분포, 연속 슈테른-게를라흐 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const rng = (s) => () => { s = (s * 1664525 + 1013904223) % 4294967296; return (s + 0.5) / 4294967296; };
  const cx = (re, im = 0) => ({ re, im }), add = (a, b) => cx(a.re + b.re, a.im + b.im), mul = (a, b) => cx(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
  const div = (a, b) => { const d = b.re * b.re + b.im * b.im; return cx((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); };
  const cexp = (a) => { const m = Math.exp(a.re); return cx(m * Math.cos(a.im), m * Math.sin(a.im)); };
  const abs2 = (a) => a.re * a.re + a.im * a.im;
  const bisect = (f, a, b) => { let fa = f(a); for (let i = 0; i < 80; i++) { const m = (a + b) / 2, fm = f(m); if ((fm > 0) === (fa > 0)) { a = m; fa = fm; } else b = m; } return (a + b) / 2; };

  /* 1. 무한 우물 두 정상 상태의 중첩 (02-01) */
  (() => {
    const S = QSim.card("lab-p8-superpos"); if (!S) return;
    const [cvP, cvX] = S.$$("canvas"); let t = 0;
    const psi = (n, x) => Math.SQRT2 * Math.sin(n * Math.PI * x);
    const X = (m, n) => { let s = 0; const N = 2000; for (let i = 0; i < N; i++) { const x = (i + 0.5) / N; s += x * psi(m, x) * psi(n, x) / N; } return s; };
    function params() {
      let n1 = S.val("n1"), n2 = S.val("n2"); if (n2 === n1) n2 = n1 + 1;
      const w = S.val("w"), a = Math.sqrt(1 - w), b = Math.sqrt(w);
      return { n1, n2, a, b, w, dE: n2 * n2 - n1 * n1, X12: X(n1, n2), X11: X(n1, n1), X22: X(n2, n2) };
    }
    const xav = (P, tt) => P.a * P.a * P.X11 + P.b * P.b * P.X22 + 2 * P.a * P.b * P.X12 * Math.cos(P.dE * tt);
    function draw() {
      const c = C(), P = params(), T = 2 * Math.PI / P.dE;
      const v = QSim.view(cvP, 0.42), f = QSim.frame(v, { x0: 0, x1: 1, y0: 0, y1: 4.2, xl: "x/L", yl: "|Ψ|²·L" }); f.axes({ noGrid: true });
      const dens = (x, tt) => { const p1 = cexp(cx(0, -P.n1 * P.n1 * tt)), p2 = cexp(cx(0, -P.n2 * P.n2 * tt)); return abs2(add(mul(cx(P.a * psi(P.n1, x)), p1), mul(cx(P.b * psi(P.n2, x)), p2))); };
      f.fn((x) => dens(x, 0), c.soft, 1.2, [4, 3]); f.fn((x) => dens(x, t), c.main, 2.5);
      const xm = xav(P, t); f.path([[xm, 0], [xm, 4.2]], c.warn, 1.5, [3, 3]);
      const vx = QSim.view(cvX, 0.35), fx = QSim.frame(vx, { x0: 0, x1: 2 * T, y0: 0, y1: 1, xl: "t (ħ/E₁)", yl: "⟨x⟩/L" }); fx.axes();
      fx.fn((tt) => xav(P, tt), c.main, 2); fx.dot(t % (2 * T), xm, c.warn, 5);
      const amp = 2 * P.a * P.b * Math.abs(P.X12), vAv = -2 * P.a * P.b * P.X12 * P.dE * Math.sin(P.dE * t);   // d⟨x⟩/dt (단위 L·E₁/ħ)
      S.out(`Ψ = ${P.a.toFixed(2)}ψ${P.n1} + ${P.b.toFixed(2)}ψ${P.n2} (확률 ${(1 - P.w).toFixed(2)}, ${P.w.toFixed(2)}), t = ${t.toFixed(3)} ħ/E₁\n⟨x⟩ = ${xm.toFixed(3)}L, 진동 진폭 ${amp.toFixed(3)}L, 주기 2πħ/(E${P.n2} − E${P.n1}) = ${T.toFixed(3)} ħ/E₁ (E_n = n²E₁)\n⟨H⟩ = ${((1 - P.w) * P.n1 * P.n1 + P.w * P.n2 * P.n2).toFixed(2)}E₁. ⟨p⟩/m = d⟨x⟩/dt = ${vAv.toFixed(3)} L·E₁/ħ (에렌페스트)${Math.abs(P.X12) < 1e-6 ? ". n₁ + n₂가 짝수라 ⟨x⟩는 움직이지 않는다" : ""}`);
    }
    const L = QSim.loop((dt) => { t += dt * 0.15; draw(); }).watch(S.root);
    QSim.playButton(S.$(".play"), L);
    S.$(".reset").addEventListener("click", () => { t = 0; draw(); });
    S.on(() => { t = 0; draw(); }); QSim.redrawOn(draw); draw();
  })();

  /* 2. 유한 우물: 그래프 풀이와 속박 상태 (02-02) */
  (() => {
    const S = QSim.card("lab-p8-finite"); if (!S) return;
    const [cvG, cvW] = S.$$("canvas");
    function states(z0) {
      const r = (z) => Math.sqrt(Math.max(0, z0 * z0 / (z * z) - 1)), out = [], e = 1e-9;
      for (let k = 0; k * Math.PI < z0; k++) { const lo = k * Math.PI + e, hi = Math.min(k * Math.PI + Math.PI / 2 - e, z0); out.push({ z: bisect((z) => Math.tan(z) - r(z), lo, hi), even: true }); }
      for (let k = 0; k * Math.PI + Math.PI / 2 < z0; k++) { const lo = k * Math.PI + Math.PI / 2 + e, hi = Math.min((k + 1) * Math.PI - e, z0); out.push({ z: bisect((z) => -1 / Math.tan(z) - r(z), lo, hi), even: false }); }
      return out.sort((p, q) => p.z - q.z);
    }
    function draw() {
      const c = C(), z0 = S.val("z0"), sel = S.val("n"), st = states(z0), zmax = Math.max(z0 * 1.15, 2);
      const vg = QSim.view(cvG, 0.45), fg = QSim.frame(vg, { x0: 0, x1: zmax, y0: 0, y1: 8, xl: "z = la", yl: "" }); fg.axes({ noGrid: true });
      const branch = (fn, col) => { const N = 1500; let seg = []; for (let i = 1; i <= N; i++) { const z = zmax * i / N, y = fn(z); if (y >= 0 && y <= 8.5) seg.push([z, y]); else { if (seg.length > 1) fg.path(seg, col, 1.8); seg = []; } } if (seg.length > 1) fg.path(seg, col, 1.8); };
      branch(Math.tan, c.main); branch((z) => -1 / Math.tan(z), c.acc);
      fg.fn((z) => (z < z0 ? Math.sqrt(z0 * z0 / (z * z) - 1) : NaN), c.ink, 2, null, 800);
      st.forEach((s, i) => fg.dot(s.z, Math.sqrt(Math.max(0, z0 * z0 / (s.z * s.z) - 1)), i === sel - 1 ? c.warn : c.ink3, i === sel - 1 ? 6 : 4));
      const vw = QSim.view(cvW, 0.5), fw = QSim.frame(vw, { x0: -3, x1: 3, y0: -1.05, y1: 0.25, xl: "x/a", yl: "E/V₀" }); fw.axes({ noGrid: true });
      fw.path([[-3, 0], [-1, 0], [-1, -1], [1, -1], [1, 0], [3, 0]], c.ink, 2.5);
      const k = Math.min(sel, st.length) - 1;
      st.forEach((s, i) => { const E = -1 + (s.z / z0) ** 2; fw.path([[-1, E], [1, E]], i === k ? c.warn : c.rule, i === k ? 1.5 : 1); });
      const s = st[k], E = -1 + (s.z / z0) ** 2, ka = Math.sqrt(Math.max(0, z0 * z0 - s.z * s.z));
      const inside = (x) => (s.even ? Math.cos(s.z * x) : Math.sin(s.z * x)), edge = inside(1);
      const wf = (x) => (Math.abs(x) <= 1 ? inside(x) : Math.sign(x) ** (s.even ? 0 : 1) * edge * Math.exp(-ka * (Math.abs(x) - 1)));
      const A = Math.min(0.12, 0.45 / Math.max(1, st.length));
      fw.fn((x) => E + A * wf(x), c.main, 2.5, null, 900);
      let pout = 0, ptot = 0; for (let i = 0; i < 6000; i++) { const x = -6 + 12 * (i + 0.5) / 6000, p = wf(x) ** 2; ptot += p; if (Math.abs(x) > 1) pout += p; }
      S.out(`z₀ = a√(2mV₀)/ħ = ${z0.toFixed(2)}: 속박 상태 ${st.length}개 (공식 ⌊2z₀/π⌋ + 1 = ${Math.floor(2 * z0 / Math.PI) + 1})\n위: tan z(파랑, 짝), −cot z(주황, 홀), √(z₀²/z² − 1)(검정). 교점 하나가 상태 하나\n${k + 1}번째 상태 (${s.even ? "짝" : "홀"}, 마디 ${k}개): z = ${s.z.toFixed(3)}, E/V₀ = ${E.toFixed(3)}, 벽 밖에서 찾을 확률 ${(100 * pout / ptot).toFixed(1)}%${sel > st.length ? " (요청한 상태가 없어 가장 높은 상태를 그림)" : ""}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 퍼텐셜 계단의 반사와 투과 (02-03) */
  (() => {
    const S = QSim.card("lab-p8-step"); if (!S) return;
    const [cvW, cvR] = S.$$("canvas"); let t = 0;
    const RT = (e) => { if (e <= 1) return [1, 0]; const k = Math.sqrt(e), kp = Math.sqrt(e - 1); return [((k - kp) / (k + kp)) ** 2, 4 * k * kp / (k + kp) ** 2]; };
    function draw() {
      const c = C(), e = S.val("e"), k = Math.sqrt(e), below = e < 1;
      const kp = below ? cx(0, Math.sqrt(1 - e)) : cx(Math.sqrt(e - 1));   // 오른쪽 파수 (E < V₀이면 iκ)
      const r = div(add(cx(k), cx(-kp.re, -kp.im)), add(cx(k), kp)), tr = div(cx(2 * k), add(cx(k), kp));
      const ph = cexp(cx(0, -e * t));
      const psi = (x) => (x < 0 ? add(cexp(cx(0, k * x)), mul(r, cexp(cx(0, -k * x)))) : mul(tr, cexp(mul(cx(0, 1), mul(kp, cx(x))))));
      const v = QSim.view(cvW, 0.45), f = QSim.frame(v, { x0: -12, x1: 12, y0: -2.3, y1: 4.5, xl: "x (ħ/√(2mV₀) 단위)" }); f.axes({ noGrid: true });
      f.path([[-12, 0], [0, 0], [0, 1.5], [12, 1.5]], c.ink3, 2);
      f.text(`V₀`, 0.4, 1.75, c.ink3);
      f.fn((x) => mul(psi(x), ph).re, c.soft, 1.3, null, 900);
      f.fn((x) => abs2(psi(x)), c.main, 2.5, null, 900);
      const [R, T] = RT(e);
      const vr = QSim.view(cvR, 0.38), fr = QSim.frame(vr, { x0: 0, x1: 4, y0: 0, y1: 1.05, xl: "E/V₀", yl: "확률" }); fr.axes();
      fr.fn((x) => RT(x)[0], c.warn, 2, null, 600); fr.fn((x) => RT(x)[1], c.main, 2, null, 600);
      fr.dot(e, R, c.warn, 5); fr.dot(e, T, c.main, 5);
      const extra = below ? `E < V₀: 오른쪽은 e^(−κx), 침투 깊이 1/κ = ${(1 / Math.sqrt(1 - e)).toFixed(2)} (같은 단위). 흐름은 0이라 R = 1` : `k'/k = ${(Math.sqrt(e - 1) / k).toFixed(3)}, |F/A|² = ${abs2(tr).toFixed(3)} (T는 여기에 k'/k를 곱한 값)`;
      S.out(`E/V₀ = ${e.toFixed(2)}: 반사율 R = ${R.toFixed(4)}, 투과율 T = ${T.toFixed(4)}, R + T = ${(R + T).toFixed(4)}\n위: |ψ|²(파랑)와 Re ψ(연한 선). 왼쪽의 출렁임은 입사파와 반사파의 간섭\n${extra}`);
    }
    const L = QSim.loop((dt) => { t += dt * 2; draw(); }).watch(S.root);
    QSim.playButton(S.$(".play"), L);
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 수소 원자의 지름 확률 밀도 (04-02) */
  (() => {
    const S = QSim.card("lab-p8-hydrogen"); if (!S) return;
    const cv = S.$("canvas");
    const lag = (p, a, x) => { let L0 = 1, L1 = 1 + a - x; if (p === 0) return L0; for (let k = 1; k < p; k++) { const L2 = ((2 * k + 1 + a - x) * L1 - (k + a) * L0) / (k + 1); L0 = L1; L1 = L2; } return L1; };
    function draw() {
      const c = C(), n = S.val("n"); let l = S.val("l"); const clamp = l > n - 1; if (clamp) l = n - 1;
      const R = (r) => { const rho = 2 * r / n; return rho ** l * Math.exp(-rho / 2) * lag(n - l - 1, 2 * l + 1, rho); };
      const rmax = 2.2 * n * n + 6, N = 4000; let norm = 0, rav = 0, peak = 0, rp = 0; const P = [];
      for (let i = 0; i <= N; i++) { const r = rmax * i / N, p = r * r * R(r) ** 2; P.push([r, p]); norm += p * rmax / N; rav += r * p * rmax / N; if (p > peak) { peak = p; rp = r; } }
      const Pn = P.map(([r, p]) => [r, p / norm]); rav /= norm;
      const nodes = []; for (let i = 1; i < N; i++) { const r0 = rmax * i / N, r1 = rmax * (i + 1) / N; if (R(r0) * R(r1) < 0) nodes.push(bisect(R, r0, r1)); }
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: rmax, y0: 0, y1: 1.15 * peak / norm, xl: "r/a₀", yl: "P(r)·a₀" }); f.axes();
      f.path(Pn, c.main, 2.5);
      nodes.forEach((r) => f.dot(r, 0, c.warn, 5));
      f.path([[rav, 0], [rav, 1.15 * peak / norm]], c.acc, 1.5, [4, 3]);
      const lab = "spdfg"[l];
      S.out(`${n}${lab} 상태 (n = ${n}, l = ${l})${clamp ? " — l은 n − 1까지만 가능해 l = " + l + "로 맞춤" : ""}: E = −13.6/${n * n} = ${(-13.6 / n / n).toFixed(3)} eV\n지름 마디 ${nodes.length}개 (n − l − 1 = ${n - l - 1})${nodes.length ? ": r = " + nodes.map((r) => r.toFixed(2)).join(", ") + " a₀" : ""}\n가장 그럴듯한 r = ${rp.toFixed(2)}a₀, ⟨r⟩ = ${rav.toFixed(2)}a₀ (공식 (3n² − l(l+1))/2 = ${((3 * n * n - l * (l + 1)) / 2).toFixed(2)}a₀, 주황 점선)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 5. 연속 슈테른-게를라흐 장치 (05-02) */
  (() => {
    const S = QSim.card("lab-p8-sg"); if (!S) return;
    const cv = S.$("canvas"); let seed = 3;
    function draw() {
      const c = C(), a = S.val("a") * Math.PI / 180, b = S.val("b") * Math.PI / 180, mid = S.val("mid"), N = 1000, r = rng(seed);
      // 1단: z 장치에서 위만 통과(빔의 절반). 2단(선택): 각 a 장치에서 위만 통과. 3단: 각 b 장치로 측정
      let n1 = 0, n2 = 0, up = 0, dn = 0;
      for (let i = 0; i < N; i++) {
        if (r() >= 0.5) continue; n1++;
        let dir = 0;
        if (mid) { if (r() >= Math.cos(a / 2) ** 2) continue; dir = a; }
        n2++;
        if (r() < Math.cos((b - dir) / 2) ** 2) up++; else dn++;
      }
      const pUp = mid ? Math.cos(a / 2) ** 2 * Math.cos((b - a) / 2) ** 2 : Math.cos(b / 2) ** 2;
      const v = QSim.view(cv, 0.42), g = v.g, W = v.W, H = v.H, y = H * 0.45;
      const box = (x, label, on) => { g.globalAlpha = on ? 1 : 0.25; g.strokeStyle = c.ink; g.lineWidth = 1.5; g.strokeRect(x, y - 28, 70, 56); g.fillStyle = c.ink; g.font = "13px sans-serif"; g.textAlign = "center"; g.fillText(label, x + 35, y + 5); g.globalAlpha = 1; };
      const beam = (x0, x1, w, col) => { g.strokeStyle = col; g.lineWidth = Math.max(1, 14 * w); g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke(); };
      const x1 = W * 0.18, x2 = W * 0.45, x3 = W * 0.72;
      beam(10, x1, 1, c.soft); box(x1, "SG z", true);
      beam(x1 + 70, x2, n1 / N, c.main); box(x2, mid ? `SG ${S.val("a")}°` : "없음", mid);
      beam(x2 + 70, x3, n2 / N, c.main); box(x3, `SG ${S.val("b")}°`, true);
      const bw = W - x3 - 90, top = y - 50;
      g.fillStyle = c.main; g.fillRect(x3 + 80, top, bw * up / (N / 2), 16); g.fillStyle = c.warn; g.fillRect(x3 + 80, y + 34, bw * dn / (N / 2), 16);
      g.fillStyle = c.ink; g.font = "12px sans-serif"; g.textAlign = "left"; g.fillText(`위 ${up}`, x3 + 80, top - 4); g.fillText(`아래 ${dn}`, x3 + 80, y + 64);
      S.out(`원자 ${N}개 → z 장치에서 위만 통과 ${n1}개${mid ? ` → ${S.val("a")}° 장치에서 위만 통과 ${n2}개` : ""} → ${S.val("b")}° 장치: 위 ${up}, 아래 ${dn}\n처음 원자 하나가 마지막에 위로 나올 확률: 이론 ${(0.5 * pUp).toFixed(3)}, 시뮬레이션 ${(up / N).toFixed(3)}\n${mid ? `= ½ · cos²(${S.val("a")}°/2) · cos²((${S.val("b")}° − ${S.val("a")}°)/2)` : `= ½ · cos²(${S.val("b")}°/2)`}. 각은 z축에서 잰 xz 평면의 방향`);
    }
    S.$(".new").addEventListener("click", () => { seed = (seed * 29 + 7) % 99991; draw(); });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
