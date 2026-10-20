/* 공통6(일반화학 2) 본문 카드의 조작 그림 (js/lib/qfig.js의 NMQ를 쓴다). 그림마다 NMQ.def("이름", …). */
(() => {
  "use strict";
  const Q = window.NMQ;
  if (!Q) return;
  const { el, clear, txt, num } = Q;
  const PI = Math.PI;
  const rad = (d) => (d * PI) / 180;
  // 화살표 + 끝에 이름표
  const vec = (g, F, x0, y0, x1, y1, cls, fcls, lab, tcls) => {
    Q.arrow(g, F.x(x0), F.y(y0), F.x(x1), F.y(y1), cls, fcls);
    if (lab) { const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1; txt(g, F.x(x1) + (12 * dx) / L, F.y(y1) - (12 * dy) / L + 4, lab, tcls || "i", "middle"); }
  };
  const rect = (g, F, x0, y0, x1, y1, cls) => el("rect", { x: Math.min(F.x(x0), F.x(x1)), y: Math.min(F.y(y0), F.y(y1)), width: Math.abs(F.x(x1) - F.x(x0)), height: Math.abs(F.y(y1) - F.y(y0)), class: cls }, g);
  const poly = (g, F, pts, cls, open) => el("path", { d: pts.map((p, i) => (i ? "L" : "M") + F.x(p[0]).toFixed(1) + " " + F.y(p[1]).toFixed(1)).join("") + (open ? "" : "Z"), class: cls }, g);
  // 축과 눈금 글자: xt, yt는 눈금 값 목록
  const axl = (g, F, xt, yt, xs, ys) => {
    Q.axes(g, F, { grid: false, label: false });
    xt.forEach((v) => txt(g, F.x(v), F.y(0) + 14, num(v), "s", "middle"));
    yt.forEach((v) => txt(g, F.x(0) - 5, F.y(v) + 4, num(v), "s", "end"));
    txt(g, F.X1 - 4, F.y(0) - 6, xs, "i", "end"); txt(g, F.x(0) + 6, F.Y0 + 14, ys, "i");
  };
  // 막대 하나: 바닥 y0에서 값 v만큼, 위에 값, 아래에 이름
  const bar = (g, F, x, w, v, cls, lab, val) => {
    rect(g, F, x, 0, x + w, v, cls);
    if (val != null) txt(g, F.x(x + w / 2), F.y(Math.max(v, 0)) - 5, val, "s", "middle");
    if (lab) txt(g, F.x(x + w / 2), F.y(0) + 14, lab, "s", "middle");
  };
  // 이온·분자 알약: 둥근 모서리 없이 네모 칸에 화학식
  const chip = (g, x, y, s, cls, faded) => {
    const w = 10 + s.length * 7.2;
    el("rect", { x: x - w / 2, y: y - 11, width: w, height: 22, class: cls, style: faded ? "opacity:.35" : "" }, g);
    const t = txt(g, x, y + 4, s, "s", "middle"); if (faded) t.setAttribute("style", "opacity:.45");
    return w;
  };

  // 1.1 농도 표시 세 가지: NaCl을 물 100 g에 녹일 때
  Q.def("c6-conc", (fig, svg) => {
    const F = Q.frame(0, 10, -0.3, 6.5, 20, 500, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ w }) => {
      clear(g);
      const n = w / 58.44, nw = 100 / 18.02, wp = (w / (100 + w)) * 100, rho = 1 + 0.0077 * wp, Vml = (100 + w) / rho;
      const m = n / 0.1, X = n / (n + nw), M = n / (Vml / 1000);
      Q.line(g, F.x(0.3), F.y(0), F.x(9.7), F.y(0), "ax");
      bar(g, F, 1, 1.6, m, "la", "몰랄농도 (m)", num(m, 2));
      bar(g, F, 4, 1.6, M, "lb", "몰농도 (M)", num(M, 2));
      bar(g, F, 7, 1.6, X * 50, "lc", "몰분율 (×50)", num(X, 4));
      read.textContent = `NaCl ${w} g = ${num(n, 3)} mol, 물 100 g: 몰랄농도 ${num(m, 2)} m, 용액 ${num(Vml, 1)} mL(밀도 약 ${num(rho, 2)})로 몰농도 ${num(M, 2)} M, 몰분율 ${num(X, 4)}`;
    });
  });

  // 1.2 총괄성: 용액의 증기 압력 곡선이 내려가 끓는점은 오르고 어는점은 내려간다
  Q.def("c6-colli", (fig, svg) => {
    const F = Q.frame(-12, 112, -0.05, 1.25, 50, 490, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ m, i }) => {
      clear(g);
      const dTb = i * 0.512 * m, dTf = i * 1.86 * m, sc = 4;
      const vp = (t) => Math.exp(4.6 * (t - 100) / 100);
      Q.line(g, F.x(-12), F.y(1), F.x(112), F.y(1), "gd dsh"); txt(g, F.x(-11), F.y(1) - 4, "1 atm", "s", "start");
      Q.plot(g, F, (t) => (t >= 0 ? vp(t) : NaN), "k", 0, 110);
      Q.plot(g, F, (t) => (t >= -dTf * sc ? vp(t - dTb * sc) : NaN), "a", -dTf * sc, 112);
      Q.line(g, F.x(0), F.y(0), F.x(0), F.y(0.02), "k"); Q.line(g, F.x(-dTf * sc), F.y(0), F.x(-dTf * sc), F.y(0.02), "a");
      Q.line(g, F.x(100), F.y(0), F.x(100), F.y(1), "k dsh"); Q.line(g, F.x(100 + dTb * sc), F.y(0), F.x(100 + dTb * sc), F.y(1), "a dsh");
      Q.line(g, F.x(-12), F.y(0), F.x(112), F.y(0), "ax");
      txt(g, F.x(0), F.y(0) + 14, "0 °C", "s", "middle"); txt(g, F.x(100), F.y(0) + 14, "100 °C", "s", "middle");
      txt(g, F.x(60), F.y(0.5), "물", "s", "end"); txt(g, F.x(70), F.y(0.25) + 14, "용액", "ta", "start");
      read.textContent = `${m} m, i = ${i}: 끓는점 오름 ΔT_b = iK_bm = ${num(dTb, 2)} °C, 어는점 내림 ΔT_f = iK_fm = ${num(dTf, 2)} °C (그림은 차이를 ${sc}배로 키움)`;
    });
  });

  // 2.1 초기 속도법: 차수를 맞혀 보기
  Q.def("c6-order", (fig, svg) => {
    const F = Q.frame(0, 10, -0.2, 11, 20, 500, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const R = [2.5, 10, 5];
    Q.bind(fig, ({ m, n }) => {
      clear(g);
      const pred = [1, 2 ** m, 2 ** n].map((r) => 2.5 * r);
      Q.line(g, F.x(0.3), F.y(0), F.x(9.7), F.y(0), "ax");
      ["실험 1", "실험 2 ([NO] 2배)", "실험 3 ([O₂] 2배)"].forEach((s, k) => {
        const x = 0.8 + k * 3.1; rect(g, F, x, 0, x + 1.1, R[k], "la"); rect(g, F, x + 1.2, 0, x + 2.3, pred[k], Math.abs(pred[k] - R[k]) < 1e-9 ? "lb" : "ld");
        txt(g, F.x(x + 0.55), F.y(R[k]) - 5, num(R[k], 1), "s", "middle"); txt(g, F.x(x + 1.75), F.y(pred[k]) - 5, num(pred[k], 1), "s", "middle");
        txt(g, F.x(x + 1.15), F.y(0) + 14, s, "s", "middle");
      });
      const ok = m === 2 && n === 1;
      read.textContent = `파랑 = 실험 속도(×10⁻⁵ M/s), 옆 막대 = 속도 = k[NO]^${m}[O₂]^${n}의 예측. ` + (ok ? "세 실험이 모두 맞는다: NO에 2차, O₂에 1차." : "맞지 않는 실험(빨강)이 있다. 차수를 바꿔 보라.");
    });
  });

  // 2.2 적분 속도식: 어느 그래프가 직선인가
  Q.def("c6-intlaw", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ o }) => {
      clear(g);
      const A0 = 1, k = [0.05, 0.2, 0.5][o], A = (t) => (o == 0 ? Math.max(A0 - k * t, 0.001) : o == 1 ? A0 * Math.exp(-k * t) : A0 / (1 + k * A0 * t));
      const ts = []; for (let t = 0; t <= 15; t += 1.5) ts.push(t);
      const panels = [["[A]", (t) => A(t)], ["ln[A]", (t) => Math.log(A(t))], ["1/[A]", (t) => 1 / A(t)]];
      panels.forEach(([nm, f], p) => {
        const ys = ts.map(f), lo = Math.min(...ys), hi = Math.max(...ys), F = Q.frame(-1, 16, lo - 0.1 * (hi - lo + 1e-9), hi + 0.15 * (hi - lo + 1e-9), 15 + p * 170, 160 + p * 170, 30, 230);
        Q.line(g, F.x(0), F.Y1, F.x(15.5), F.Y1, "ax"); Q.line(g, F.X0 + 6, F.Y0, F.X0 + 6, F.Y1, "ax");
        const d2 = ys.slice(2).map((y, i) => Math.abs(y - 2 * ys[i + 1] + ys[i])), lin = Math.max(...d2) < 1e-6 * (1 + Math.abs(hi - lo));
        Q.line(g, F.x(ts[0]), F.y(ys[0]), F.x(ts[ts.length - 1]), F.y(ys[ys.length - 1]), "gd dsh");
        ts.forEach((t, i) => Q.dot(g, F.x(t), F.y(ys[i]), lin ? "fb" : "fa", 3.5));
        txt(g, (F.X0 + F.X1) / 2, 20, `${nm} 대 t`, lin ? "tb" : "s", "middle");
        txt(g, (F.X0 + F.X1) / 2, 250, lin ? "직선" : "휘어짐", lin ? "tb" : "s", "middle");
      });
      read.textContent = `${o}차 반응의 자료: ${["[A]", "ln[A]", "1/[A]"][o]}를 시간에 대해 그린 것만 직선(청록)이다. 그래서 직선이 되는 그래프로 차수를 찾는다.`;
    });
  });

  // 2.3 아레니우스: Ea를 넘는 분자의 비율
  Q.def("c6-arr", (fig, svg) => {
    const F = Q.frame(0, 60, -0.004, 0.11, 50, 490, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ T }) => {
      clear(g);
      const RT = (8.314 * T) / 1000, f = (E) => (2 / Math.sqrt(PI)) * Math.sqrt(E) * RT ** -1.5 * Math.exp(-E / RT), Ea = 25;
      axl(g, F, [10, 20, 30, 40, 50], [], "에너지 (kJ/mol)", "분자 비율");
      const pts = [[Ea, 0]]; for (let E = Ea; E <= 60; E += 0.5) pts.push([E, f(E)]); pts.push([60, 0]); poly(g, F, pts, "ld");
      Q.plot(g, F, (E) => (E > 0 ? f(E) : 0), "a", 0.01, 60, 400);
      Q.plot(g, F, (E) => { const r = (8.314 * 300) / 1000; return E > 0 ? (2 / Math.sqrt(PI)) * Math.sqrt(E) * r ** -1.5 * Math.exp(-E / r) : 0; }, "gd dsh", 0.01, 60, 400);
      Q.line(g, F.x(Ea), F.y(0), F.x(Ea), F.y(0.1), "d dsh"); txt(g, F.x(Ea) + 4, F.y(0.1), "Eₐ", "td", "start");
      let frac = 0; for (let E = Ea; E < 200; E += 0.05) frac += f(E) * 0.05;
      let frac300 = 0; const r3 = (8.314 * 300) / 1000; for (let E = Ea; E < 200; E += 0.05) frac300 += (2 / Math.sqrt(PI)) * Math.sqrt(E) * r3 ** -1.5 * Math.exp(-E / r3) * 0.05;
      read.textContent = `${T} K: Eₐ(${Ea} kJ/mol 예시)보다 큰 에너지를 가진 분자(빨강)의 비율 ${num(frac * 100, 2)}%, 300 K(점선)의 ${num(frac / frac300, 2)}배`;
    });
  });

  // 2.4 촉매: 활성화 에너지가 낮은 경로
  Q.def("c6-cat", (fig, svg) => {
    const F = Q.frame(0, 10, -40, 130, 50, 490, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ c }) => {
      clear(g);
      const hump = (x, H, x0, w) => H * Math.exp(-((x - x0) ** 2) / (2 * w * w));
      const base = (x) => (x < 3 ? 40 : x > 7 ? 0 : 40 - 40 * ((x - 3) / 4) ** 2 * (3 - 2 * (x - 3) / 4));
      const un = (x) => base(x) + hump(x, 75, 5, 1.0);
      const ca = (x) => base(x) + hump(x, 32, 4, 0.6) + hump(x, 28, 6, 0.6);
      txt(g, F.x(0) + 4, F.Y0 + 14, "에너지", "i", "start"); txt(g, F.X1 - 4, F.Y1 - 6, "반응 진행", "i", "end");
      Q.plot(g, F, un, c == 1 ? "gd" : "d", 0.2, 9.8, 300); if (c == 1) Q.plot(g, F, ca, "a", 0.2, 9.8, 300);
      Q.line(g, F.x(0.2), F.y(40), F.x(9.8), F.y(40), "gd dsh"); Q.line(g, F.x(5), F.y(0), F.x(9.8), F.y(0), "gd dsh");
      txt(g, F.x(0.5), F.y(40) - 6, "반응물", "s", "start"); txt(g, F.x(9.5), F.y(0) + 14, "생성물", "s", "end");
      const top = c == 1 ? Math.max(...Array.from({ length: 100 }, (_, i) => ca(i / 10))) : un(5);
      vec(g, F, 1.5, 40, 1.5, top, "c", "fc", "", ""); txt(g, F.x(1.5) - 4, F.y((40 + top) / 2), `Eₐ ≈ ${num(top - 40, 0)}`, "tc", "end");
      vec(g, F, 9, 40, 9, 0, "b", "fb"); txt(g, F.x(9) + 4, F.y(20), "ΔH", "tb", "start");
      read.textContent = c == 1 ? "촉매가 있으면 두 단계로 가는 낮은 경로(파랑)가 생겨 활성화 에너지가 줄어든다. 반응물과 생성물의 높이, 곧 ΔH는 그대로이다." : "촉매가 없을 때의 에너지 언덕(빨강). 언덕이 높을수록 넘는 분자가 적어 느리다.";
    });
  });

  // H₂ + I₂ ⇌ 2HI, K = 50.5의 평형 풀이: 처음 농도 (h, i, p)에서 x만큼 정반응
  const hiEq = (h, i, p) => {
    const K = 50.5, f = (x) => (p + 2 * x) ** 2 - K * (h - x) * (i - x);
    let lo = -p / 2 + 1e-12, hi = Math.min(h, i) - 1e-12;
    for (let k = 0; k < 200; k++) { const m = (lo + hi) / 2; if (f(m) > 0) hi = m; else lo = m; }
    return (lo + hi) / 2;
  };

  // 3.1 동적 평형에 다가가기: H₂ + I₂ ⇌ 2HI
  Q.def("c6-approach", (fig, svg) => {
    const F = Q.frame(-0.2, 5.2, -0.06, 1.75, 50, 490, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const kf = 1, kr = 1 / 50.5, dt = 0.002, T = 5, H = [], P = [];
    let h = 1, p = 0; for (let t = 0; t <= T + 1e-9; t += dt) { H.push(h); P.push(p); const r = kf * h * h - kr * p * p; h -= r * dt; p += 2 * r * dt; }
    Q.bind(fig, ({ t }) => {
      clear(g);
      axl(g, F, [1, 2, 3, 4, 5], [0.5, 1, 1.5], "시간", "농도 (M)");
      const at = (arr, s) => arr[Math.min(arr.length - 1, Math.round(s / dt))];
      Q.plot(g, F, (s) => at(H, s), "a", 0, 5, 300); Q.plot(g, F, (s) => at(P, s), "d", 0, 5, 300);
      Q.line(g, F.x(0), F.y(0.22), F.x(5.2), F.y(0.22), "gd dsh"); Q.line(g, F.x(0), F.y(1.56), F.x(5.2), F.y(1.56), "gd dsh");
      const hh = at(H, t), pp = at(P, t), Qv = pp * pp / (hh * hh), rf = kf * hh * hh, rr = kr * pp * pp;
      Q.dot(g, F.x(t), F.y(hh), "fa", 5); Q.dot(g, F.x(t), F.y(pp), "fd", 5);
      txt(g, F.x(5.1), F.y(0.22) - 6, "H₂, I₂ 0.22", "ta", "end"); txt(g, F.x(5.1), F.y(1.56) - 6, "HI 1.56", "td", "end");
      read.textContent = `정반응 속도 ${num(rf, 3)}, 역반응 속도 ${num(rr, 3)} (임의 단위), Q = ${num(Qv, 1)}` + (Math.abs(Qv - 50.5) < 1 ? " → 두 속도가 같아진 동적 평형(Q = K)" : " → 아직 평형이 아니다");
    });
  });

  // 3.2 Q와 K: 지금 혼합물은 어디로 가는가
  Q.def("c6-qk", (fig, svg) => {
    const F = Q.frame(-0.5, 3.5, 0, 10, 30, 490, 10, 250), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ a, b }) => {
      clear(g);
      const Qv = (b * b) / (a * a), K = 50.5, lq = Math.log10(Qv), lk = Math.log10(K);
      Q.line(g, F.x(-0.5), F.y(5), F.x(3.5), F.y(5), "k");
      [0, 1, 2, 3].forEach((v) => { Q.line(g, F.x(v), F.y(4.7), F.x(v), F.y(5.3), "k"); txt(g, F.x(v), F.y(4.2) + 4, `10${"⁰¹²³"[v]}`, "s", "middle"); });
      Q.line(g, F.x(lk), F.y(3.5), F.x(lk), F.y(6.5), "b").setAttribute("style", "stroke-width:2.5"); txt(g, F.x(lk), F.y(7) , "K = 50.5", "tb", "middle");
      const x = Math.max(-0.45, Math.min(3.45, lq)); Q.dot(g, F.x(x), F.y(5), "fd", 6); txt(g, F.x(x), F.y(3.2), `Q = ${num(Qv, 1)}`, "td", "middle");
      if (Math.abs(lq - lk) > 0.01) vec(g, F, x, 6, x + Math.sign(lk - lq) * Math.min(0.8, Math.abs(lk - lq)), 6, "d", "fd");
      txt(g, F.x(0.3), F.y(8.6), "← 반응물 쪽이 많음", "s", "middle"); txt(g, F.x(2.9), F.y(8.6), "생성물 쪽이 많음 →", "s", "middle");
      read.textContent = `[H₂] = [I₂] = ${num(a, 2)} M, [HI] = ${num(b, 2)} M: Q = ${num(b, 2)}²/${num(a, 2)}² = ${num(Qv, 1)} ` + (Qv < K - 0.5 ? "< K → 정반응 쪽(HI 생성)으로 진행" : Qv > K + 0.5 ? "> K → 역반응 쪽(HI 분해)으로 진행" : "≈ K → 평형");
    });
  });

  // 3.3 르샤틀리에: H₂를 더 넣은 뒤 새 평형
  Q.def("c6-lechat", (fig, svg) => {
    const F = Q.frame(0, 10, -0.08, 2.2, 20, 500, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ d }) => {
      clear(g);
      const h0 = 0.22 + d, i0 = 0.22, p0 = 1.56, x = d > 0 ? hiEq(h0, i0, p0) : 0, h1 = h0 - x, i1 = i0 - x, p1 = p0 + 2 * x;
      Q.line(g, F.x(0.3), F.y(0), F.x(9.7), F.y(0), "ax");
      const grp = (x0, lab, vals, cls) => { vals.forEach((v, k) => { rect(g, F, x0 + k * 0.9, 0, x0 + k * 0.9 + 0.75, v, cls[k]); txt(g, F.x(x0 + k * 0.9 + 0.37), F.y(v) - 5, num(v, 2), "s", "middle"); }); txt(g, F.x(x0 + 1.3), F.y(0) + 14, lab, "s", "middle"); };
      grp(0.6, "처음 평형", [0.22, 0.22, 1.56], ["la", "lc", "ld"]);
      grp(3.7, "H₂를 넣은 직후", [h0, i0, p0], ["la", "lc", "ld"]);
      grp(6.8, "새 평형", [h1, i1, p1], ["la", "lc", "ld"]);
      txt(g, F.x(9.6), F.y(2.1), "H₂ · I₂ · HI", "s", "end");
      const Qv = (p0 * p0) / (h0 * i0);
      read.textContent = d > 0 ? `H₂ ${num(d, 2)} M를 넣으면 Q = ${num(Qv, 1)} < 50.5 → 정반응. x = ${num(x, 3)} M가 더 반응해 [H₂] ${num(h1, 3)}, [I₂] ${num(i1, 3)}, [HI] ${num(p1, 2)} M. 넣은 H₂의 일부만 줄었다.` : "평형 상태. H₂를 넣어 보라.";
    });
  });

  // 4.1 약산의 pH와 이온화 백분율
  Q.def("c6-weak", (fig, svg) => {
    const F = Q.frame(-6.2, 0.2, -0.5, 102, 60, 490, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ lc, pka }) => {
      clear(g);
      const Ka = 10 ** -pka, frac = (C) => { const x = (-Ka + Math.sqrt(Ka * Ka + 4 * Ka * C)) / 2; return (x / C) * 100; };
      Q.line(g, F.x(-6.2), F.y(0), F.x(0.2), F.y(0), "ax"); Q.line(g, F.x(-6.2), F.y(-0.5), F.x(-6.2), F.y(100), "ax");
      [-6, -5, -4, -3, -2, -1, 0].forEach((v) => txt(g, F.x(v), F.y(0) + 14, `10${v < 0 ? "⁻" + "⁰¹²³⁴⁵⁶"[-v] : "⁰"}`, "s", "middle"));
      [25, 50, 75, 100].forEach((v) => txt(g, F.x(-6.2) - 4, F.y(v) + 4, v, "s", "end"));
      txt(g, F.x(0.2), F.y(0) - 6, "처음 농도 C (M)", "i", "end"); txt(g, F.x(-6.2) + 6, F.y(100) + 12, "이온화 백분율 (%)", "i", "start");
      Q.plot(g, F, (l) => frac(10 ** l), "a", -6.2, 0.2, 300); Q.line(g, F.x(-6.2), F.y(5), F.x(0.2), F.y(5), "d dsh"); txt(g, F.x(0.1), F.y(5) - 4, "5%", "td", "end");
      const C = 10 ** lc, x = (-Ka + Math.sqrt(Ka * Ka + 4 * Ka * C)) / 2, xa = Math.sqrt(Ka * C), pf = (x / C) * 100;
      Q.dot(g, F.x(lc), F.y(pf), "fd", 5);
      read.textContent = `C = ${C.toExponential(1)} M, pKa = ${num(pka, 2)}: [H₃O⁺] = ${x.toExponential(2)} M, pH = ${num(-Math.log10(x), 2)}, 이온화 ${num(pf, 1)}%. 근사 √(KaC)로는 pH ${num(-Math.log10(xa), 2)}` + (pf > 5 ? " (5%를 넘어 근사가 부정확)" : " (근사가 타당)");
    });
  });

  // 5.1 완충 용액: 산을 넣을 때 pH
  Q.def("c6-buffer", (fig, svg) => {
    const F = Q.frame(-0.002, 0.105, -0.3, 7.6, 60, 490, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ n }) => {
      clear(g);
      const pKa = 4.74, buf = (a) => (a < 0.1 ? pKa + Math.log10((0.1 - a) / (0.1 + a)) : NaN), water = (a) => (a > 1e-7 ? -Math.log10(a) : 7);
      axl(g, F, [0.02, 0.04, 0.06, 0.08, 0.1], [2, 4, 6], "넣은 HCl (mol)", "pH");
      Q.plot(g, F, water, "d", 0, 0.105, 400); Q.plot(g, F, buf, "a", 0, 0.0995, 300);
      txt(g, F.x(0.06), F.y(1.3) + 14, "물 1 L", "td", "start"); txt(g, F.x(0.06), F.y(4.2) - 6, "완충 용액 1 L", "ta", "start");
      if (n < 0.1) Q.dot(g, F.x(n), F.y(buf(n)), "fa", 5); Q.dot(g, F.x(n), F.y(water(n)), "fd", 5);
      read.textContent = `HCl ${num(n, 3)} mol: 완충 용액(0.10 M 아세트산 + 0.10 M 아세트산 이온)은 pH ${num(buf(n), 2)}, 순수한 물은 pH ${num(water(n), 2)}`;
    });
  });

  // 산 25.0 mL(0.10 M)에 0.10 M NaOH v mL를 넣었을 때 pH (전하 균형을 이분법으로 푼다)
  const titrPH = (v, Ka) => {
    const Va = 25, C = 0.1, Vt = (Va + v) / 1000, Ca = (C * Va) / 1000 / Vt, Na = (C * v) / 1000 / Vt;
    const f = (h) => h + Na - 1e-14 / h - (Ka == null ? Ca : (Ca * Ka) / (Ka + h));
    let lo = -15, hi = 1; for (let k = 0; k < 80; k++) { const m = (lo + hi) / 2; if (f(10 ** m) > 0) hi = m; else lo = m; }
    return -(lo + hi) / 2;
  };

  // 5.2 적정 곡선과 지시약
  Q.def("c6-tcurve", (fig, svg) => {
    const F = Q.frame(-1, 52, -0.3, 14.3, 50, 490, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ s, v }) => {
      clear(g);
      const Ka = s == 1 ? 1.82e-5 : null;
      rect(g, F, -1, 8.2, 52, 10, "ld").setAttribute("style", "opacity:.35"); txt(g, F.x(51), F.y(10) - 3, "페놀프탈레인", "td", "end");
      rect(g, F, -1, 3.1, 52, 4.4, "lc").setAttribute("style", "opacity:.4"); txt(g, F.x(51), F.y(4.4) - 3, "메틸 오렌지", "tc", "end");
      axl(g, F, [10, 20, 30, 40, 50], [2, 4, 6, 8, 10, 12, 14], "넣은 NaOH (mL)", "pH");
      Q.plot(g, F, (x) => titrPH(x, Ka), "a", 0, 50, 500);
      Q.line(g, F.x(25), F.y(0), F.x(25), F.y(14), "gd dsh"); if (s == 1) { Q.dot(g, F.x(12.5), F.y(4.74), "fb", 4); txt(g, F.x(12.5), F.y(4.74) - 8, "반당량점", "tb", "middle"); }
      const p = titrPH(v, Ka); Q.dot(g, F.x(v), F.y(p), "fd", 5);
      read.textContent = `${s == 1 ? "0.10 M 아세트산" : "0.10 M HCl"} 25.0 mL, NaOH ${num(v, 2)} mL: pH ${num(p, 2)}. 당량점(25.0 mL) pH ${num(titrPH(25, Ka), 2)}`;
    });
  });

  // 5.3 용해도곱과 공통 이온
  Q.def("c6-ksp", (fig, svg) => {
    const F = Q.frame(-6.3, 0.2, -10.3, -3.7, 60, 490, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const Ksp = 1.8e-10, sol = (c) => (-c + Math.sqrt(c * c + 4 * Ksp)) / 2;
    Q.bind(fig, ({ lc }) => {
      clear(g);
      Q.line(g, F.x(-6.3), F.y(-10.3), F.x(0.2), F.y(-10.3), "ax"); Q.line(g, F.x(-6.3), F.y(-10.3), F.x(-6.3), F.y(-3.7), "ax");
      [-6, -5, -4, -3, -2, -1, 0].forEach((v) => txt(g, F.x(v), F.y(-10.3) + 14, `10${v < 0 ? "⁻" + "⁰¹²³⁴⁵⁶"[-v] : "⁰"}`, "s", "middle"));
      [-10, -8, -6, -4].forEach((v) => txt(g, F.x(-6.3) - 4, F.y(v) + 4, `10⁻${v === -10 ? "¹⁰" : "⁰¹²³⁴⁵⁶⁷⁸⁹"[-v]}`, "s", "end"));
      txt(g, F.x(0.2), F.y(-10.3) - 6, "넣은 [Cl⁻] (M)", "i", "end"); txt(g, F.x(-6.3) + 6, F.y(-3.7) + 12, "AgCl 몰 용해도 s (M)", "i", "start");
      Q.plot(g, F, (l) => Math.log10(sol(10 ** l)), "a", -6.3, 0.2, 300);
      Q.line(g, F.x(-6.3), F.y(Math.log10(Math.sqrt(Ksp))), F.x(0.2), F.y(Math.log10(Math.sqrt(Ksp))), "gd dsh");
      const c = 10 ** lc, s = sol(c); Q.dot(g, F.x(lc), F.y(Math.log10(s)), "fd", 5);
      read.textContent = `[Cl⁻] = ${c.toExponential(1)} M가 이미 있으면 s(s + [Cl⁻]) = Ksp에서 s = ${s.toExponential(2)} M (순수한 물에서는 1.3×10⁻⁵ M, 점선). 공통 이온이 많을수록 덜 녹는다.`;
    });
  });

  // 6.1 엔트로피: 상자 두 칸에 분자를 나누는 방법의 수
  Q.def("c6-micro", (fig, svg) => {
    const F = Q.frame(-1, 21, 0, 1.08, 40, 490, 20, 250), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const C = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return r; };
    Q.bind(fig, ({ N }) => {
      clear(g);
      const W = []; for (let k = 0; k <= N; k++) W.push(C(N, k)); const mx = Math.max(...W), tot = 2 ** N, w = 20 / (N + 1);
      W.forEach((v, k) => { const x = (k / N) * 20; rect(g, F, x - w * 0.4, 0, x + w * 0.4, v / mx, k === N ? "ld" : "la"); });
      Q.line(g, F.x(-0.5), F.y(0), F.x(20.5), F.y(0), "ax");
      txt(g, F.x(0), F.y(0) + 14, "모두 왼쪽", "s", "middle"); txt(g, F.x(10), F.y(0) + 14, "반반", "s", "middle"); txt(g, F.x(20), F.y(0) + 14, "모두 오른쪽", "s", "middle");
      read.textContent = `분자 ${N}개를 두 칸에 나누는 배열 ${tot.toLocaleString()}가지 가운데 반반에 가까운 배열이 가장 많다(W 최대 ${mx.toLocaleString()}). 모두 한쪽에 몰릴 확률은 ${(1 / tot).toExponential(1)}로, 분자가 많을수록 사실상 0이다.`;
    });
  });

  // 6.2 ΔG = ΔH − TΔS: 온도에 따른 자발성
  Q.def("c6-dg", (fig, svg) => {
    const F = Q.frame(-20, 1020, -180, 130, 60, 490, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const cs = [["암모니아 합성 (ΔH −92.2, ΔS −198.7)", -92.2, -0.1987], ["연소 (ΔH −, ΔS +)", -100, 0.1], ["얼음 녹기·분해 (ΔH +, ΔS +)", 60, 0.16], ["(ΔH +, ΔS −)", 50, -0.08]];
    Q.bind(fig, ({ k, T }) => {
      clear(g);
      const [nm, H, S] = cs[k], G = (t) => H - t * S;
      axl(g, F, [200, 400, 600, 800, 1000], [-150, -100, -50, 50, 100], "T (K)", "ΔG (kJ)");
      rect(g, F, -20, -180, 1020, 0, "lb").setAttribute("style", "opacity:.25"); txt(g, F.x(1000), F.y(-170), "자발 (ΔG &lt; 0)".replace("&lt;", "<"), "tb", "end");
      Q.plot(g, F, G, "a", 0, 1000);
      if (Math.abs(S) > 1e-9) { const Tb = H / S; if (Tb > 0 && Tb < 1000) { Q.dot(g, F.x(Tb), F.y(0), "fc", 4); txt(g, F.x(Tb), F.y(0) - 8, `${num(Tb, 0)} K`, "tc", "middle"); } }
      Q.dot(g, F.x(T), F.y(G(T)), "fd", 5);
      read.textContent = `${nm}: ${T} K에서 ΔG = ${H} − ${T}(${S}) = ${num(G(T), 1)} kJ → ${G(T) < 0 ? "자발적" : "비자발적"}` + (H * S > 0 ? `, 경계 온도 ΔH/ΔS = ${num(H / S, 0)} K` : "");
    });
  });

  // 6.3 ΔG = ΔG° + RT ln Q와 K
  Q.def("c6-gk", (fig, svg) => {
    const F = Q.frame(-12.5, 12.5, -80, 80, 60, 490, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ dg, lq }) => {
      clear(g);
      const RT = (8.314 * 298) / 1000, G = (l) => dg + RT * Math.log(10) * l, lK = -dg / (RT * Math.log(10));
      Q.line(g, F.x(-12.5), F.y(0), F.x(12.5), F.y(0), "ax"); Q.line(g, F.x(0), F.y(-80), F.x(0), F.y(80), "ax");
      [-10, -5, 5, 10].forEach((v) => txt(g, F.x(v), F.y(0) + 14, `10${v < 0 ? "⁻" : ""}${v === 10 || v === -10 ? "¹⁰" : "⁵"}`, "s", "middle"));
      [-60, -30, 30, 60].forEach((v) => txt(g, F.x(0) - 4, F.y(v) + 4, v, "s", "end"));
      txt(g, F.x(12.5), F.y(0) - 6, "Q", "i", "end"); txt(g, F.x(0) + 6, F.y(80) + 12, "ΔG (kJ)", "i", "start");
      Q.plot(g, F, G, "a", -12.5, 12.5);
      if (Math.abs(lK) < 12.5) { Q.dot(g, F.x(lK), F.y(0), "fb", 5); txt(g, F.x(lK), F.y(0) - 10, "Q = K", "tb", "middle"); }
      Q.dot(g, F.x(0), F.y(dg), "fc", 4); txt(g, F.x(0) + 6, F.y(dg) - 6, "ΔG°", "tc", "start");
      Q.dot(g, F.x(lq), F.y(G(lq)), "fd", 5);
      read.textContent = `298 K, ΔG° = ${dg} kJ: K = e^(−ΔG°/RT) = ${(10 ** lK).toExponential(1)}. Q = 10^${num(lq, 1)}에서 ΔG = ${num(G(lq), 1)} kJ → ` + (G(lq) < -0.05 ? "정반응 쪽으로 진행" : G(lq) > 0.05 ? "역반응 쪽으로 진행" : "평형");
    });
  });

  // 7.1 반쪽 반응법을 단계별로
  Q.def("c6-redox", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const S = [
      ["반응", "MnO₄⁻ + Fe²⁺ → Mn²⁺ + Fe³⁺", "", "산화수: Mn +7 → +2(환원), Fe +2 → +3(산화)"],
      ["1. 반쪽으로 나누기", "MnO₄⁻ → Mn²⁺", "Fe²⁺ → Fe³⁺", "환원 반쪽과 산화 반쪽"],
      ["2·3. O는 H₂O, H는 H⁺로", "MnO₄⁻ + 8H⁺ → Mn²⁺ + 4H₂O", "Fe²⁺ → Fe³⁺", "O 4개를 물 4개로, 그 H 8개를 H⁺로 맞춤"],
      ["4. 전하를 전자로", "MnO₄⁻ + 8H⁺ + 5e⁻ → Mn²⁺ + 4H₂O", "Fe²⁺ → Fe³⁺ + e⁻", "왼쪽 전하 +7을 +2로 맞추려 전자 5개"],
      ["5. 전자 수를 맞춰 더하기", "MnO₄⁻ + 8H⁺ + 5e⁻ → Mn²⁺ + 4H₂O", "5Fe²⁺ → 5Fe³⁺ + 5e⁻", "산화 반쪽을 5배"],
      ["완성", "MnO₄⁻ + 8H⁺ + 5Fe²⁺ → Mn²⁺ + 5Fe³⁺ + 4H₂O", "", "양쪽 전하가 모두 +17"]];
    Q.bind(fig, ({ s }) => {
      clear(g);
      const [h, a, b, note] = S[s];
      txt(g, 20, 40, h, "s", "start").setAttribute("style", "font-size:15px");
      if (b) { txt(g, 20, 95, "환원", "td", "start"); txt(g, 80, 95, a, "s", "start").setAttribute("style", "font-size:16px"); txt(g, 20, 145, "산화", "ta", "start"); txt(g, 80, 145, b, "s", "start").setAttribute("style", "font-size:16px"); }
      else txt(g, 20, 120, a, s === 5 ? "tb" : "s", "start").setAttribute("style", "font-size:16px");
      txt(g, 20, 210, note, "s", "start");
      read.textContent = `${h}: ${note}`;
    });
  });

  // 7.2 표준 환원 전위로 전지 만들기
  Q.def("c6-ecell", (fig, svg) => {
    const F = Q.frame(0, 10, -1.0, 1.0, 20, 500, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const E = [["Ag⁺/Ag", 0.80, 1], ["Cu²⁺/Cu", 0.34, 2], ["2H⁺/H₂", 0.0, 2], ["Fe²⁺/Fe", -0.44, 2], ["Zn²⁺/Zn", -0.76, 2]];
    Q.bind(fig, ({ a, b }) => {
      clear(g);
      Q.line(g, F.x(3), F.y(-0.95), F.x(3), F.y(0.95), "ax"); txt(g, F.x(3) - 6, F.y(0.95) + 10, "E° (V)", "i", "end");
      E.forEach(([nm, e], k) => { const on = k == a || k == b; Q.line(g, F.x(2.6), F.y(e), F.x(3.4), F.y(e), on ? "k" : "gd").setAttribute("style", "stroke-width:2"); txt(g, F.x(3.6), F.y(e) + 4, `${nm} ${e >= 0 ? "+" : ""}${e.toFixed(2)}`, on ? "s" : "s", "start"); });
      const [na, ea, nA] = E[a], [nb, eb, nB] = E[b], cat = ea >= eb ? a : b, an = ea >= eb ? b : a, Ec = E[cat][1] - E[an][1], n = Math.max(E[cat][2], E[an][2]) === 1 && Math.min(E[cat][2], E[an][2]) === 2 ? 2 : Math.max(E[cat][2], E[an][2]);
      if (a != b) { vec(g, F, 2.2, E[an][1], 2.2, E[cat][1], "d", "fd"); txt(g, F.x(2.1), F.y((E[an][1] + E[cat][1]) / 2) + 4, `${Ec.toFixed(2)} V`, "td", "end"); }
      txt(g, F.x(7.4), F.y(0.7), a != b ? `환원 전극: ${E[cat][0]}` : "", "s", "start"); txt(g, F.x(7.4), F.y(0.5), a != b ? `산화 전극: ${E[an][0]}` : "", "s", "start");
      read.textContent = a == b ? "서로 다른 두 반쪽 전지를 고르라." : `E° 큰 ${E[cat][0]}이 환원 전극, 작은 ${E[an][0]}이 산화 전극: E°전지 = ${E[cat][1].toFixed(2)} − (${E[an][1].toFixed(2)}) = ${Ec.toFixed(2)} V, ΔG° = −nFE° = ${num((-n * 96485 * Ec) / 1000, 0)} kJ (n = ${n})`;
    });
  });

  // 7.3 네른스트 식: Q에 따른 전지 전위
  Q.def("c6-nernst", (fig, svg) => {
    const F = Q.frame(-5, 40, -0.12, 1.4, 50, 490, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ lq }) => {
      clear(g);
      const Ef = (l) => 1.1 - (0.0592 / 2) * l;
      axl(g, F, [10, 20, 30], [0.5, 1], "log Q", "E (V)");
      Q.plot(g, F, Ef, "a", -5, 40);
      const lK = 1.1 / (0.0592 / 2); Q.dot(g, F.x(lK), F.y(0), "fb", 5); txt(g, F.x(lK), F.y(0) - 8, "Q = K (다 닳음)", "tb", "middle");
      Q.dot(g, F.x(0), F.y(1.1), "fc", 4); txt(g, F.x(0) + 6, F.y(1.1) - 6, "E° = 1.10 V", "tc", "start");
      Q.dot(g, F.x(lq), F.y(Ef(lq)), "fd", 5);
      read.textContent = `다니엘 전지, Q = [Zn²⁺]/[Cu²⁺] = 10^${num(lq, 1)}: E = 1.10 − (0.0592/2)·log Q = ${num(Ef(lq), 3)} V. 쓰는 동안 Q가 커져 전위가 떨어지고, log K = ${num(lK, 1)}에서 0이 된다.`;
    });
  });

  // 7.4 패러데이 법칙: 흘린 전하량과 석출량
  Q.def("c6-faraday", (fig, svg) => {
    const F = Q.frame(0, 10, -2, 46, 20, 500, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const M = [["은 Ag⁺", 107.87, 1], ["구리 Cu²⁺", 63.55, 2], ["알루미늄 Al³⁺", 26.98, 3]];
    Q.bind(fig, ({ I, t }) => {
      clear(g);
      const q = I * t * 60, ne = q / 96485;
      Q.line(g, F.x(0.3), F.y(0), F.x(9.7), F.y(0), "ax");
      M.forEach(([nm, mm, z], k) => { const m = (ne / z) * mm; bar(g, F, 1 + k * 3, 1.8, Math.min(m, 45), ["la", "lc", "lb"][k], nm, `${num(m, 2)} g`); });
      read.textContent = `${I} A × ${t}분 = ${num(q, 0)} C → 전자 ${num(ne, 4)} mol. 이온 전하가 1, 2, 3이면 석출 몰수는 그 1, 1/2, 1/3배이다.`;
    });
  });

  // 8.1 방사성 붕괴의 반감기
  Q.def("c6-halflife", (fig, svg) => {
    const F = Q.frame(-0.1, 5.2, -0.05, 1.1, 50, 490, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const iso = [["아이오딘-131", 8.0, "일"], ["탄소-14", 5730, "년"]];
    Q.bind(fig, ({ s, h }) => {
      clear(g);
      const [nm, T, u] = iso[s];
      Q.line(g, F.x(0), F.y(0), F.x(5.2), F.y(0), "ax"); Q.line(g, F.x(0), F.y(0), F.x(0), F.y(1.05), "ax");
      [1, 2, 3, 4, 5].forEach((k) => { txt(g, F.x(k), F.y(0) + 14, `${num(k * T, 0)}`, "s", "middle"); Q.line(g, F.x(k), F.y(0), F.x(k), F.y(0.5 ** k), "gd dsh"); Q.line(g, F.x(0), F.y(0.5 ** k), F.x(k), F.y(0.5 ** k), "gd dsh"); });
      [0.25, 0.5, 1].forEach((v) => txt(g, F.x(0) - 4, F.y(v) + 4, v, "s", "end"));
      txt(g, F.x(5.2), F.y(0) - 6, `시간 (${u})`, "i", "end"); txt(g, F.x(0) + 6, F.y(1.05) + 10, "남은 비율 N/N₀", "i", "start");
      Q.plot(g, F, (x) => 0.5 ** x, "a", 0, 5.2);
      Q.dot(g, F.x(h), F.y(0.5 ** h), "fd", 5);
      read.textContent = `${nm} (반감기 ${T} ${u}): ${num(h * T, 0)} ${u} = 반감기 ${num(h, 2)}번 → 남은 비율 (1/2)^${num(h, 2)} = ${num(0.5 ** h * 100, 1)}%`;
    });
  });

  // 8.2 핵자당 결합 에너지 (반경험식으로 어림)
  Q.def("c6-bea", (fig, svg) => {
    const F = Q.frame(-5, 250, 0, 10.6, 50, 490, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const BA = (A) => { const Z = A / (1.98 + 0.0155 * A ** (2 / 3)), N = A - Z; const B = 15.75 * A - 17.8 * A ** (2 / 3) - 0.711 * Z * (Z - 1) / A ** (1 / 3) - 23.7 * (N - Z) ** 2 / A; return B / A; };
    Q.bind(fig, ({ A }) => {
      clear(g);
      axl(g, F, [50, 100, 150, 200, 250], [2, 4, 6, 8], "질량수 A", "핵자당 결합 에너지 (MeV)");
      Q.plot(g, F, (a) => (a >= 6 ? BA(a) : NaN), "a", 6, 250, 300);
      [["⁴He", 4, 7.07], ["⁵⁶Fe", 56, 8.79], ["²³⁵U", 235, 7.59]].forEach(([s, a, b]) => { Q.dot(g, F.x(a), F.y(b), "fb", 4); txt(g, F.x(a) + 6, F.y(b) - 6, s, "tb", "start"); });
      const b = BA(A); Q.dot(g, F.x(A), F.y(b), "fd", 5);
      read.textContent = `A = ${A}: 핵자당 약 ${num(b, 2)} MeV(어림). 철 근처가 가장 높아, 무거운 핵은 쪼개지면(분열), 가벼운 핵은 합쳐지면(융합) 핵자당 결합 에너지가 커지며 에너지가 나온다.`;
    });
  });

  // 9.1 시스와 트랜스: [Pt(NH₃)₂Cl₂]
  Q.def("c6-cistrans", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ k }) => {
      clear(g);
      const cx = 200, cy = 130, R = 70, pos = [[cx + R, cy], [cx, cy - R], [cx - R, cy], [cx, cy + R]];
      const lig = k == 0 ? ["Cl", "Cl", "NH₃", "NH₃"] : ["Cl", "NH₃", "Cl", "NH₃"];
      pos.forEach(([x, y], i) => { Q.line(g, cx, cy, x, y, "k").setAttribute("style", "stroke-width:2.5"); el("circle", { cx: x, cy: y, r: 20, class: lig[i] === "Cl" ? "lb" : "la" }, g); txt(g, x, y + 4, lig[i], "s", "middle"); });
      el("circle", { cx, cy, r: 18, class: "lk" }, g); txt(g, cx, cy + 4, "Pt", "s", "middle");
      txt(g, 360, 90, k == 0 ? "시스형 (시스플라틴)" : "트랜스형", "s", "start").setAttribute("style", "font-size:16px");
      txt(g, 360, 120, k == 0 ? "같은 리간드가 이웃함" : "같은 리간드가 마주 봄", "s", "start");
      txt(g, 360, 145, k == 0 ? "극성 분자, 항암 효과" : "대칭이라 무극성, 효과 없음", "s", "start");
      read.textContent = k == 0 ? "시스형: 두 Cl이 90° 이웃해 있다. 원자의 연결은 트랜스형과 같지만 공간 배치가 달라 성질이 다르다." : "트랜스형: 두 Cl이 180° 마주 보고 있다. 같은 분자식, 같은 연결이지만 다른 기하 이성질체이다.";
    });
  });

  // 9.2 결정장 분리: 고스핀과 저스핀
  Q.def("c6-cfse", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ d, r }) => {
      clear(g);
      const low = r > 1, yT = 200, yE = 200 - 40 - r * 50;
      const t = [0, 0, 0], e = [0, 0];
      if (low) { for (let i = 0; i < d; i++) { if (i < 6) t[i % 3]++; else e[(i - 6) % 2]++; } }
      else { for (let i = 0; i < d; i++) { if (i < 5) (i < 3 ? t : e)[i < 3 ? i : i - 3]++; else (i - 5 < 3 ? t : e)[i - 5 < 3 ? i - 5 : i - 8]++; } }
      const draw = (arr, x0, y, lab) => { arr.forEach((n, i) => { const x = x0 + i * 60; Q.line(g, x, y, x + 46, y, "k").setAttribute("style", "stroke-width:2.5"); if (n >= 1) txt(g, x + 16, y - 4, "↑", "ta", "middle"); if (n >= 2) txt(g, x + 30, y - 4, "↓", "td", "middle"); }); txt(g, x0 - 10, y + 4, "", "s", "end").innerHTML = lab; };
      draw(t, 120, yT, 't<tspan dy="4" font-size="10">2g</tspan>'); draw(e, 150, yE, 'e<tspan dy="4" font-size="10">g</tspan>');
      vec(g, { x: (v) => v, y: (v) => v }, 330, yT, 330, yE, "c", "fc"); txt(g, 340, (yT + yE) / 2 + 4, "Δₒ", "tc", "start");
      const unp = t.filter((n) => n === 1).length + e.filter((n) => n === 1).length;
      txt(g, 400, 80, `d${"⁰¹²³⁴⁵⁶⁷⁸⁹"[d]}`, "s", "start").setAttribute("style", "font-size:16px");
      txt(g, 400, 110, low ? "저스핀" : "고스핀", low ? "tb" : "td", "start"); txt(g, 400, 135, `홀전자 ${unp}개`, "s", "start");
      read.textContent = `d${d}, Δₒ/짝짓기 에너지 = ${num(r, 1)}: ` + (low ? "Δₒ가 커서 아래 준위 t₂g를 먼저 짝지어 채운다(저스핀)" : "Δₒ가 작아 위 준위 eg에도 하나씩 먼저 넣는다(고스핀)") + `, 홀전자 ${unp}개`;
    });
  });

  // 9.3 흡수한 빛과 보이는 색 (색상환)
  Q.def("c6-wheel", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const C = [["빨강", 700, "#d23a2a"], ["주황", 610, "#e8841a"], ["노랑", 580, "#e0c21a"], ["초록", 530, "#3aa04a"], ["파랑", 470, "#2f6fe0"], ["보라", 410, "#7a4fd0"]];
    Q.bind(fig, ({ l }) => {
      clear(g);
      const cx = 160, cy = 135, R = 95;
      C.forEach(([nm, , col], i) => {
        const a0 = (i * 60 - 90 - 30) * PI / 180, a1 = (i * 60 - 90 + 30) * PI / 180;
        el("path", { d: `M${cx} ${cy}L${cx + R * Math.cos(a0)} ${cy + R * Math.sin(a0)}A${R} ${R} 0 0 1 ${cx + R * Math.cos(a1)} ${cy + R * Math.sin(a1)}Z`, style: `fill:${col};opacity:.85` }, g);
        const am = (i * 60 - 90) * PI / 180; txt(g, cx + (R + 16) * Math.cos(am), cy + (R + 16) * Math.sin(am) + 4, nm, "s", "middle");
      });
      let k = 0, best = 1e9; C.forEach(([, w], i) => { if (Math.abs(w - l) < best) { best = Math.abs(w - l); k = i; } });
      const comp = (k + 3) % 6, am = (k * 60 - 90) * PI / 180, ac = (comp * 60 - 90) * PI / 180;
      Q.arrow(g, cx + R * 1.35 * Math.cos(am), cy + R * 1.35 * Math.sin(am), cx + R * 0.55 * Math.cos(am), cy + R * 0.55 * Math.sin(am), "k", "fk");
      el("circle", { cx: cx + R * 0.6 * Math.cos(ac), cy: cy + R * 0.6 * Math.sin(ac), r: 12, class: "k" }, g);
      const E = (6.626e-34 * 2.998e8) / (l * 1e-9) * 6.022e23 / 1000;
      el("rect", { x: 330, y: 70, width: 150, height: 90, style: `fill:${C[comp][2]}` }, g); txt(g, 405, 180, `보이는 색: ${C[comp][0]}`, "s", "middle");
      read.textContent = `${l} nm(${C[k][0]} 근처)를 흡수 → Δ = hc/λ × N_A = ${num(E, 0)} kJ/mol, 남은 빛인 보색 ${C[comp][0]}으로 보인다.`;
    });
  });

  // 10.1 C₅H₁₂의 세 구조 이성질체
  Q.def("c6-pentane", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const S = [["펜테인", [[0, 0], [1, 0.5], [2, 0], [3, 0.5], [4, 0]], [[0, 1], [1, 2], [2, 3], [3, 4]], 36],
      ["2-메틸뷰테인", [[0, 0], [1, 0.5], [2, 0], [3, 0.5], [1, 1.5]], [[0, 1], [1, 2], [2, 3], [1, 4]], 28],
      ["2,2-다이메틸프로페인", [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]], [[0, 2], [1, 2], [2, 3], [2, 4]], 9.5]];
    Q.bind(fig, ({ k }) => {
      clear(g);
      const [nm, P, B, bp] = S[k], X = (p) => 60 + p[0] * 60, Y = (p) => 200 - p[1] * 60;
      B.forEach(([a, b]) => Q.line(g, X(P[a]), Y(P[a]), X(P[b]), Y(P[b]), "k").setAttribute("style", "stroke-width:3"));
      P.forEach((p) => { el("circle", { cx: X(p), cy: Y(p), r: 13, class: "lk" }, g); txt(g, X(p), Y(p) + 4, "C", "s", "middle"); });
      txt(g, 340, 90, nm, "s", "start").setAttribute("style", "font-size:16px"); txt(g, 340, 120, "C₅H₁₂ (탄소 뼈대만)", "s", "start"); txt(g, 340, 150, `끓는점 ${bp} °C`, "td", "start");
      el("rect", { x: 340, y: 170, width: 140, height: 14, class: "lk" }, g); el("rect", { x: 340, y: 170, width: (140 * bp) / 40, height: 14, class: "ld" }, g);
      read.textContent = `${nm}: 끓는점 ${bp} °C. 가지가 많을수록 분자가 공처럼 뭉쳐 이웃과 닿는 면이 줄고 분산력이 약해져 끓는점이 낮다.`;
    });
  });

  // 10.2 키랄성: 거울상은 돌려도 포개지지 않는다
  Q.def("c6-chiral", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const t = 1 / Math.sqrt(3), V = [[t, t, t], [t, -t, -t], [-t, t, -t], [-t, -t, t]], cols = ["la", "lb", "lc", "ld"], labs = ["H", "CH₃", "NH₂", "COOH"];
    Q.bind(fig, ({ a }) => {
      clear(g);
      const draw = (cx, vs, az, mir) => {
        const ang = (az * PI) / 180, ev = 0.35, S = 88;
        const P = ([x, y, z]) => { if (mir) x = -x; const u = x * Math.cos(ang) - y * Math.sin(ang), w = x * Math.sin(ang) + y * Math.cos(ang); return [cx + S * u, 140 - S * (z * Math.cos(ev) + w * Math.sin(ev)), w * Math.cos(ev) - z * Math.sin(ev)]; };
        const items = vs.map((v, i) => ({ i, p: P(v) })).sort((A, B) => B.p[2] - A.p[2]);
        items.forEach(({ i, p }) => { Q.line(g, cx, 140, p[0], p[1], "k").setAttribute("style", "stroke-width:2.5"); el("circle", { cx: p[0], cy: p[1], r: 19, class: cols[i] }, g); txt(g, p[0], p[1] + 4, labs[i], "s", "middle").setAttribute("style", "font-size:11px"); });
        el("circle", { cx, cy: 140, r: 11, class: "lk" }, g); txt(g, cx, 144, "C", "s", "middle");
      };
      draw(120, V, 20, false); draw(400, V, 20 + a, true);
      Q.line(g, 260, 40, 260, 240, "gd dsh"); txt(g, 260, 30, "거울", "s", "middle");
      read.textContent = `오른쪽은 왼쪽의 거울상이다. ${a}° 돌려 보아도 네 원자단의 배치가 모두 겹치는 각은 없다. 서로 다른 네 원자단이 붙은 탄소는 키랄 중심이다.`;
    });
  });

  // ── 새 그림은 이 위에 ──
})();
