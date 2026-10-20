/* 공통5(일반화학 1) 본문 카드의 조작 그림 (js/lib/qfig.js의 NMQ를 쓴다). 그림마다 NMQ.def("이름", …). */
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

  // 1.1 정확도와 정밀도: 과녁에 찍힌 측정값
  Q.def("c5-target", (fig, svg) => {
    const F = Q.frame(-1.5, 3.8, -1.35, 1.35, 20, 500, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const base = [[0.31, -0.42], [-0.55, 0.12], [0.08, 0.63], [0.71, 0.2], [-0.2, -0.7], [-0.62, -0.31], [0.45, -0.05], [-0.1, 0.25]];
    const cases = [[0, 0, 0.12, "정확하고 정밀하다"], [0.62, 0.45, 0.12, "정밀하지만 정확하지 않다(계통 오차)"], [0, 0, 0.75, "정확하지만 정밀하지 않다(우연 오차)"], [-0.5, 0.55, 0.7, "정확하지도 정밀하지도 않다"]];
    Q.bind(fig, ({ k }) => {
      clear(g);
      [1.2, 0.8, 0.4].forEach((r, i) => el("circle", { cx: F.x(0), cy: F.y(0), r: F.x(r) - F.x(0), class: i === 2 ? "ld" : "lk" }, g));
      Q.dot(g, F.x(0), F.y(0), "fd", 3);
      const [cx, cy, s, msg] = cases[k];
      let mx = 0, my = 0;
      base.forEach(([x, y]) => { const px = cx + s * x, py = cy + s * y; mx += px / base.length; my += py / base.length; Q.dot(g, F.x(px), F.y(py), "fa", 5); });
      el("circle", { cx: F.x(mx), cy: F.y(my), r: 9, class: "b" }, g);
      txt(g, F.x(1.6), F.y(0.9), "가운데 빨간 점 = 참값", "td", "start");
      txt(g, F.x(1.6), F.y(0.5), "파란 점 = 측정값", "ta", "start");
      txt(g, F.x(1.6), F.y(0.1), "청록 원 = 측정값의 평균", "tb", "start");
      read.textContent = `${msg}. 평균이 참값에서 ${num(Math.hypot(mx, my), 2)}만큼, 측정값이 평균 둘레로 약 ${num(s * 0.5, 2)}만큼 흩어져 있다.`;
    });
  });

  // 2.1 동위원소의 존재 비율과 평균 원자량
  Q.def("c5-isotope", (fig, svg) => {
    const F = Q.frame(33.5, 38.5, -6, 110, 60, 490, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ p }) => {
      clear(g);
      Q.line(g, F.x(33.5), F.y(0), F.x(38.5), F.y(0), "ax");
      [34, 35, 36, 37, 38].forEach((v) => txt(g, F.x(v), F.y(0) + 14, v, "s", "middle")); txt(g, F.x(38.5), F.y(0) - 6, "질량 (u)", "i", "end");
      const m1 = 34.969, m2 = 36.966, q = 100 - p, M = (p * m1 + q * m2) / 100;
      rect(g, F, m1 - 0.12, 0, m1 + 0.12, p, "la"); txt(g, F.x(m1), F.y(p) - 5, `³⁵Cl ${num(p, 2)}%`, "s", "middle");
      rect(g, F, m2 - 0.12, 0, m2 + 0.12, q, "lb"); txt(g, F.x(m2), F.y(q) - 5, `³⁷Cl ${num(q, 2)}%`, "s", "middle");
      Q.line(g, F.x(M), F.y(0), F.x(M), F.y(105), "d dsh"); txt(g, F.x(M), F.y(106) + 2, `평균 ${num(M, 2)} u`, "td", "middle");
      read.textContent = `원자량 = ${num(p / 100, 4)} × 34.969 + ${num(q / 100, 4)} × 36.966 = ${num(M, 3)} u. 평균은 많은 쪽 동위원소에 가깝다.`;
    });
  });

  // 3.1 질량 → 몰 → 입자 수
  Q.def("c5-mole", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ m, s }) => {
      clear(g);
      const subs = [["물 H₂O", 18.02, 2, "H"], ["포도당 C₆H₁₂O₆", 180.16, 6, "C"], ["이산화 탄소 CO₂", 44.01, 1, "C"]], [nm, M, k, at] = subs[s];
      const n = m / M, N = n * 6.022e23;
      const box = (x, top, bot, cls) => { el("rect", { x, y: 70, width: 110, height: 70, class: cls }, g); txt(g, x + 55, 98, top, "s", "middle"); txt(g, x + 55, 120, bot, "s", "middle"); };
      box(10, "질량", `${num(m, 2)} g`, "lk"); box(140, "몰수", `${num(n, 4)} mol`, "la"); box(270, "분자 수", `${(N / 1e23).toFixed(2)}×10²³개`, "lb"); box(400, `${at} 원자 수`, `${((N * k) / 1e23).toFixed(2)}×10²³개`, "lc");
      [[120, 140, `÷ ${M}`], [250, 270, "× N_A"], [380, 400, `× ${k}`]].forEach(([a, b, l]) => { Q.arrow(g, a + 2, 105, b - 2, 105, "k", "fk"); txt(g, (a + b) / 2, 62, l, "s", "middle"); });
      txt(g, 10, 30, `${nm}, 몰질량 ${M} g/mol`, "s", "start");
      read.textContent = `${num(m, 2)} g ÷ ${M} g/mol = ${num(n, 4)} mol, × 6.022×10²³ = ${(N / 1e23).toFixed(2)}×10²³개`;
    });
  });

  // 3.2 한계 반응물: 2H₂ + O₂ → 2H₂O
  Q.def("c5-limit", (fig, svg) => {
    const F = Q.frame(0, 10, -0.6, 6.4, 20, 500, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ h, o }) => {
      clear(g);
      const nH = h / 2.016, nO = o / 32.0, ext = Math.min(nH / 2, nO), lim = nH / 2 < nO ? "H₂" : "O₂";
      Q.line(g, F.x(0.2), F.y(0), F.x(9.8), F.y(0), "ax");
      bar(g, F, 0.7, 1.4, nH, "la", "H₂ 있는 양", `${num(nH, 2)} mol`);
      bar(g, F, 2.4, 1.4, 2 * ext, "ld", "H₂ 쓰인 양", `${num(2 * ext, 2)}`);
      bar(g, F, 4.3, 1.4, nO, "la", "O₂ 있는 양", `${num(nO, 2)} mol`);
      bar(g, F, 6.0, 1.4, ext, "ld", "O₂ 쓰인 양", `${num(ext, 2)}`);
      bar(g, F, 7.9, 1.4, 2 * ext, "lb", "H₂O 생성", `${num(2 * ext, 2)}`);
      read.textContent = `H₂ ${num(nH, 2)} mol, O₂ ${num(nO, 2)} mol → 한계 반응물은 ${lim}. 물 ${num(2 * ext, 2)} mol = ${num(2 * ext * 18.02, 1)} g이 생기고 ` + (lim === "O₂" ? `H₂ ${num(nH - 2 * ext, 2)} mol이 남는다.` : `O₂ ${num(nO - ext, 2)} mol이 남는다.`);
    });
  });

  // 3.3 실험식: 몰수를 가장 작은 값으로 나눈다
  Q.def("c5-empirical", (fig, svg) => {
    const F = Q.frame(0, 10, -0.5, 9, 20, 500, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const cs = [["C 40.0%, H 6.7%, O 53.3%", [["C", 40.0, 12.01], ["H", 6.7, 1.008], ["O", 53.3, 16.0]], 180, "C₆H₁₂O₆"],
      ["C 92.3%, H 7.7%", [["C", 92.3, 12.01], ["H", 7.7, 1.008]], 78, "C₆H₆"],
      ["C 52.2%, H 13.1%, O 34.7%", [["C", 52.2, 12.01], ["H", 13.1, 1.008], ["O", 34.7, 16.0]], 46, "C₂H₆O"]];
    Q.bind(fig, ({ k }) => {
      clear(g);
      const [lab, el3, M, mf] = cs[k], ns = el3.map(([s, p, a]) => [s, p / a]), mn = Math.min(...ns.map((x) => x[1]));
      Q.line(g, F.x(0.2), F.y(0), F.x(9.8), F.y(0), "ax");
      ns.forEach(([s, n], i) => { const x = 0.8 + i * 3.1; bar(g, F, x, 1.1, n, "la", `${s} 몰수`, num(n, 2)); bar(g, F, x + 1.3, 1.1, n / mn, "lb", "÷ 최소", num(n / mn, 2)); });
      const ratio = ns.map(([s, n]) => [s, Math.round(n / mn)]), ef = ratio.map(([s, r]) => s + (r > 1 ? String(r).split("").map((d) => "₀₁₂₃₄₅₆₇₈₉"[d]).join("") : "")).join(""), efw = ratio.reduce((t, [s, r]) => t + r * el3.find((e) => e[0] === s)[2], 0);
      read.textContent = `${lab}: 100 g으로 잡아 몰수를 구하고 가장 작은 값으로 나누면 실험식 ${ef}(식량 ${num(efw, 2)}). 몰질량 ${M} ÷ ${num(efw, 2)} ≈ ${Math.round(M / efw)}이므로 분자식 ${mf}`;
    });
  });

  // 4.1 알짜 이온 반응식: 구경꾼 이온 지우기
  Q.def("c5-netionic", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const R = [
      [["Ag⁺", "NO₃⁻", "Na⁺", "Cl⁻"], ["AgCl(s)", "Na⁺", "NO₃⁻"], ["NO₃⁻", "Na⁺"], "Ag⁺ + Cl⁻ → AgCl(s)", "침전"],
      [["H⁺", "Cl⁻", "Na⁺", "OH⁻"], ["H₂O", "Na⁺", "Cl⁻"], ["Cl⁻", "Na⁺"], "H⁺ + OH⁻ → H₂O", "산-염기"],
      [["Zn(s)", "Cu²⁺", "SO₄²⁻"], ["Zn²⁺", "SO₄²⁻", "Cu(s)"], ["SO₄²⁻"], "Zn(s) + Cu²⁺ → Zn²⁺ + Cu(s)", "산화-환원"]];
    Q.bind(fig, ({ k }) => {
      clear(g);
      const [L, Rr, spec, net, nm] = R[k];
      txt(g, 20, 40, "전체 이온 반응식", "s", "start");
      let x = 30;
      L.forEach((s, i) => { const w = chip(g, x + 30, 80, s, spec.includes(s) ? "lk" : "la", spec.includes(s)); x += w + 18; if (i < L.length - 1) txt(g, x - 9, 84, "+", "s", "middle"); });
      txt(g, x + 6, 84, "→", "s", "middle"); x += 24;
      Rr.forEach((s, i) => { const w = chip(g, x + 30, 80, s, spec.includes(s) ? "lk" : "lb", spec.includes(s)); x += w + 18; if (i < Rr.length - 1) txt(g, x - 9, 84, "+", "s", "middle"); });
      txt(g, 20, 150, "구경꾼 이온(흐린 칸)을 지운 알짜 이온 반응식", "s", "start");
      txt(g, 30, 190, net, "ta", "start").setAttribute("style", "font-size:17px");
      read.textContent = `${nm} 반응: 양쪽에 똑같이 남는 ${spec.join(", ")}은(는) 구경꾼 이온이다. 실제로 변한 것만 쓰면 ${net}`;
    });
  });

  // 4.2 적정: 넣은 NaOH 부피에 따른 남은 HCl
  Q.def("c5-titr", (fig, svg) => {
    const F = Q.frame(-1, 52, -0.25, 3.4, 60, 490, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ v }) => {
      clear(g);
      const nA = 3.125, nB = 0.1 * v; // mmol
      axl(g, F, [10, 20, 30, 40, 50], [1, 2, 3], "넣은 NaOH (mL)", "mmol");
      Q.plot(g, F, (x) => Math.max(0, nA - 0.1 * x), "a", 0, 52); Q.plot(g, F, (x) => Math.max(0, 0.1 * x - nA), "d", 0, 52);
      Q.line(g, F.x(31.25), F.y(0), F.x(31.25), F.y(3.3), "gd dsh"); txt(g, F.x(31.25), F.y(3.3) - 4, "당량점", "s", "middle");
      Q.dot(g, F.x(v), F.y(Math.max(0, nA - nB)), "fa", 5); Q.dot(g, F.x(v), F.y(Math.max(0, nB - nA)), "fd", 5);
      txt(g, F.x(9), F.y(2.4), "남은 HCl", "ta", "start"); txt(g, F.x(40), F.y(1.4), "남는 NaOH", "td", "start");
      read.textContent = `NaOH ${num(v, 2)} mL = ${num(nB, 3)} mmol 넣음: ` + (nB < nA - 1e-9 ? `HCl ${num(nA - nB, 3)} mmol이 남아 산성` : nB > nA + 1e-9 ? `NaOH ${num(nB - nA, 3)} mmol이 남아 염기성(페놀프탈레인 분홍)` : "당량점: 산과 염기가 정확히 반응했다");
    });
  });

  // 5.1 커피컵 열량계: 섞는 부피와 온도 상승
  Q.def("c5-calor", (fig, svg) => {
    const F = Q.frame(0, 10, 0, 10, 20, 500, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ a, b }) => {
      clear(g);
      const n = Math.min(a, b) / 1000, m = a + b, q = n * 57000, dT = q / (m * 4.18);
      rect(g, F, 1, 1, 3.5, 7, "lk"); rect(g, F, 1.1, 1.1, 3.4, 1.1 + 5.8 * (m / 120), "lb");
      txt(g, F.x(2.25), F.y(0.5), `용액 ${m} g`, "s", "middle");
      rect(g, F, 5, 1, 5.5, 9, "lk"); rect(g, F, 5.05, 1, 5.45, 1 + 8 * Math.min(1, dT / 14), "ld");
      txt(g, F.x(5.25), F.y(9.4), `ΔT = ${num(dT, 1)} °C`, "td", "middle");
      txt(g, F.x(6.5), F.y(7), `반응한 H⁺ ${num(n * 1000, 1)} mmol`, "s", "start");
      txt(g, F.x(6.5), F.y(6), `방출한 열 ${num(q, 0)} J`, "s", "start");
      txt(g, F.x(6.5), F.y(5), `q = mcΔT = ${m} × 4.18 × ΔT`, "s", "start");
      read.textContent = `1.0 M HCl ${a} mL + 1.0 M NaOH ${b} mL: 적은 쪽 ${num(n * 1000, 0)} mmol만 반응해 열 ${num(q, 0)} J을 내고, 용액 ${m} g이 ${num(dT, 1)} °C 오른다(ΔH = −57 kJ/mol 기준)`;
    });
  });

  // 5.2 헤스 법칙: 엔탈피 준위
  Q.def("c5-hess", (fig, svg) => {
    const F = Q.frame(0, 10, -430, 30, 20, 500, 15, 265), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ k }) => {
      clear(g);
      const lv = [[0, "C(s) + O₂"], [-110.5, "CO + ½O₂"], [-393.5, "CO₂"]];
      lv.forEach(([h, s], i) => { const x0 = [0.6, 3.8, 0.6][i], x1 = x0 + 2.6; Q.line(g, F.x(x0), F.y(h), F.x(x1), F.y(h), "k").setAttribute("style", "stroke-width:2.5"); txt(g, F.x(x1) + 6, F.y(h) + 4, `${s}  (${h} kJ)`, "s", "start"); });
      const on = (i) => (k == 0 ? i === 0 : i > 0);
      vec(g, F, 1.6, 0, 1.6, -393.5, on(0) ? "d" : "gd", on(0) ? "fd" : "lk"); txt(g, F.x(1.6) - 6, F.y(-200), "−393.5", on(0) ? "td" : "s", "end");
      vec(g, F, 3.4, 0, 4.6, -110.5, on(1) ? "a" : "gd", on(1) ? "fa" : "lk"); txt(g, F.x(4.2) + 4, F.y(-50), "−110.5", on(1) ? "ta" : "s", "start");
      vec(g, F, 5, -110.5, 3, -393.5, on(2) ? "a" : "gd", on(2) ? "fa" : "lk"); txt(g, F.x(4.2) + 4, F.y(-260), "−283.0", on(2) ? "ta" : "s", "start");
      read.textContent = k == 0 ? "한 번에 태우면 ΔH = −393.5 kJ" : "CO를 거쳐 두 단계로 가면 −110.5 + (−283.0) = −393.5 kJ로 같다. 엔탈피는 상태 함수이기 때문이다.";
    });
  });

  // 6.1 수소의 에너지 준위와 선 스펙트럼
  Q.def("c5-hlevels", (fig, svg) => {
    const F = Q.frame(0, 10, -2.35, 0.25, 20, 500, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const col = (l) => (l < 380 ? "#7a4fd0" : l < 450 ? "#5a3fd8" : l < 495 ? "#2f6fe0" : l < 570 ? "#2a9a4a" : l < 590 ? "#c9b000" : l < 620 ? "#e07a10" : l <= 750 ? "#d0302a" : "#7a2a20");
    Q.bind(fig, ({ ni, nf }) => {
      clear(g);
      for (let n = 1; n <= 6; n++) { const E = -2.18 / (n * n); Q.line(g, F.x(0.6), F.y(E), F.x(5.4), F.y(E), "k"); if (n <= 4) { txt(g, F.x(0.5), F.y(E) + 4, `n = ${n}`, "s", "end"); txt(g, F.x(5.5), F.y(E) + 4, `${num(E, 3)}`, "s", "start"); } }
      txt(g, F.x(0.5), F.y(-0.02) - 2, "n = 5, 6 …", "s", "end");
      txt(g, F.x(5.5), F.y(0.12), "E (10⁻¹⁸ J)", "i", "start");
      if (ni > nf) {
        const Ei = -2.18 / (ni * ni), Ef = -2.18 / (nf * nf), dE = (Ei - Ef) * 1e-18, lam = (6.626e-34 * 2.998e8) / dE * 1e9;
        vec(g, F, 3, Ei, 3, Ef, "d", "fd");
        const series = nf === 1 ? "라이먼 계열(자외선)" : nf === 2 ? "발머 계열" : nf === 3 ? "파셴 계열(적외선)" : "적외선";
        el("rect", { x: F.x(7), y: F.y(-0.6), width: 60, height: F.y(-1.6) - F.y(-0.6), style: `fill:${col(lam)};opacity:${lam >= 380 && lam <= 750 ? 0.85 : 0.25}` }, g);
        txt(g, F.x(7) + 30, F.y(-1.75) + 4, `${num(lam, 0)} nm`, "s", "middle");
        read.textContent = `n = ${ni} → ${nf}: ΔE = ${num(dE * 1e19, 2)}×10⁻¹⁹ J, λ = hc/ΔE = ${num(lam, 0)} nm, ${series}`;
      } else read.textContent = "처음 준위가 나중 준위보다 높아야 빛을 낸다.";
    });
  });

  // 6.2 껍질 n에 든 오비탈과 전자 수
  Q.def("c5-qnum", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ n }) => {
      clear(g);
      const names = ["s", "p", "d", "f"];
      let y = 40, orb = 0;
      for (let l = 0; l < n; l++) {
        txt(g, 30, y + 22, `${n}${names[l]} (l = ${l})`, "s", "start");
        for (let m = -l; m <= l; m++) {
          const x = 140 + (m + 3) * 48;
          el("rect", { x, y: y + 4, width: 40, height: 28, class: "la" }, g);
          txt(g, x + 13, y + 25, "↑", "ta", "middle"); txt(g, x + 27, y + 25, "↓", "td", "middle");
          txt(g, x + 20, y + 46, `${m}`, "s", "middle");
          orb++;
        }
        y += 56;
      }
      txt(g, 470, 40, "m_l", "i", "middle");
      read.textContent = `n = ${n}: l = 0…${n - 1}, 버금껍질 ${n}개, 오비탈 ${orb}개(= n²), 전자 최대 ${2 * orb}개(= 2n²). 칸 하나에 스핀이 반대인 전자 둘(파울리)`;
    });
  });

  // 6.3 수소 원자 오비탈의 방사 분포
  Q.def("c5-radial", (fig, svg) => {
    const F = Q.frame(-0.5, 22, -0.06, 1.15, 50, 490, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const R = [["1s", 1, 0, (r) => 2 * Math.exp(-r)], ["2s", 2, 0, (r) => (2 - r) * Math.exp(-r / 2)], ["2p", 2, 1, (r) => r * Math.exp(-r / 2)],
      ["3s", 3, 0, (r) => (27 - 18 * r + 2 * r * r) * Math.exp(-r / 3)], ["3p", 3, 1, (r) => (6 * r - r * r) * Math.exp(-r / 3)], ["3d", 3, 2, (r) => r * r * Math.exp(-r / 3)]];
    Q.bind(fig, ({ k, c }) => {
      clear(g);
      axl(g, F, [5, 10, 15, 20], [], "r (보어 반지름 a₀)", "r²R² (최댓값 = 1)");
      const draw = (i, cls) => {
        const [nm, n, l, f] = R[i], P = (r) => r * r * f(r) ** 2; let mx = 0; for (let r = 0; r < 22; r += 0.02) mx = Math.max(mx, P(r));
        Q.plot(g, F, (r) => P(r) / mx, cls, 0, 22, 500);
        return [nm, n, l, f];
      };
      if (c == 1 && k !== 0) draw(0, "gd");
      const [nm, n, l, f] = draw(k, "a");
      const nodes = []; let prev = f(0.001);
      for (let r = 0.02; r < 22; r += 0.01) { const v = f(r); if (prev * v < 0) { nodes.push(r); Q.line(g, F.x(r), F.y(0), F.x(r), F.y(1.05), "d dsh"); } prev = v; }
      read.textContent = `${nm}: n = ${n}, l = ${l} → 방사 마디 n − l − 1 = ${n - l - 1}개` + (nodes.length ? ` (r ≈ ${nodes.map((r) => num(r, 1)).join(", ")} a₀, 빨간 점선)` : "") + `, 각 마디 ${l}개` + (c == 1 && k !== 0 ? ". 회색은 1s" : "");
    });
  });

  // 6.4 전자 배치: 쌓음 원리, 파울리, 훈트
  Q.def("c5-aufbau", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const order = [["1s", 1], ["2s", 1], ["2p", 3], ["3s", 1], ["3p", 3], ["4s", 1], ["3d", 5], ["4p", 3]];
    const sym = "H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr".split(" ");
    const sup = (n) => String(n).split("").map((d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[d]).join("");
    Q.bind(fig, ({ Z }) => {
      clear(g);
      const fill = {}; let left = Z;
      order.forEach(([nm, k]) => { const e = Math.min(left, 2 * k); fill[nm] = e; left -= e; });
      if (Z === 24) { fill["4s"] = 1; fill["3d"] = 5; } if (Z === 29) { fill["4s"] = 1; fill["3d"] = 10; }
      let unp = 0;
      // 칸 배치: 행은 에너지 순서대로 아래에서 위로
      const pos = { "1s": [40, 240], "2s": [40, 205], "2p": [120, 205], "3s": [40, 170], "3p": [120, 170], "4s": [40, 140], "3d": [270, 115], "4p": [120, 90] };
      order.forEach(([nm, k]) => {
        const [x0, y] = pos[nm], e = fill[nm];
        txt(g, x0 - 6, y + 4, nm, "s", "end");
        for (let i = 0; i < k; i++) {
          const x = x0 + i * 30, up = e > i ? 1 : 0, dn = e > k + i ? 1 : 0;
          el("rect", { x, y: y - 12, width: 26, height: 24, class: up ? "la" : "lk" }, g);
          if (up) txt(g, x + 8, y + 6, "↑", "ta", "middle");
          if (dn) txt(g, x + 18, y + 6, "↓", "td", "middle");
          if (up && !dn) unp++;
        }
      });
      txt(g, 470, 30, "에너지 ↑", "s", "end");
      const cfg = order.filter(([nm]) => fill[nm] > 0).map(([nm]) => nm + sup(fill[nm])).join(" ");
      txt(g, 20, 30, `${sym[Z - 1]} (Z = ${Z})`, "s", "start");
      read.textContent = `${sym[Z - 1]}: ${cfg}, 홀전자 ${unp}개` + (Z === 24 || Z === 29 ? " (예외: 반쯤 차거나 꽉 찬 d가 안정)" : "");
    });
  });

  // 6.5 상자 속 입자: 파동함수와 에너지 준위
  Q.def("c5-box", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const F = Q.frame(-0.08, 1.08, -1.6, 1.6, 30, 330, 20, 260), E = Q.frame(0, 1, 0, 26, 360, 510, 20, 250);
    Q.bind(fig, ({ n, w, L }) => {
      clear(g);
      rect(g, F, -0.08, -1.6, 0, 1.6, "lk"); rect(g, F, 1, -1.6, 1.08, 1.6, "lk");
      Q.line(g, F.x(0), F.y(0), F.x(1), F.y(0), "ax");
      const psi = (x) => Math.SQRT2 * Math.sin(n * PI * x);
      if (w == 0) Q.plot(g, F, (x) => psi(x) / Math.SQRT2 * 1.4, "a", 0, 1, 300);
      else { const pts = [[0, 0]]; for (let i = 0; i <= 200; i++) { const x = i / 200; pts.push([x, psi(x) ** 2 / 2 * 1.4]); } pts.push([1, 0]); poly(g, F, pts, "la"); Q.plot(g, F, (x) => (psi(x) ** 2 / 2) * 1.4, "a", 0, 1, 300); }
      for (let i = 1; i < n; i++) Q.dot(g, F.x(i / n), F.y(0), "fd", 4);
      txt(g, F.x(0.5), F.y(-1.5), `L = ${num(L, 2)} nm`, "s", "middle");
      const E1 = (6.626e-34 ** 2) / (8 * 9.109e-31 * (L * 1e-9) ** 2) / 1.602e-19;
      for (let k = 1; k <= 5; k++) { const y = k * k; Q.line(g, E.x(0.15), E.y(y), E.x(0.75), E.y(y), k === n ? "a" : "k"); txt(g, E.x(0.8), E.y(y) + 4, `n=${k}`, "s", "start"); }
      txt(g, E.x(0.15), E.y(26) + 10, "E / E₁", "i", "start");
      read.textContent = `n = ${n}: 마디 ${n - 1}개(빨간 점), E_n = n²E₁ = ${num(n * n * E1, 3)} eV (E₁ = h²/8mL² = ${num(E1, 3)} eV)`;
    });
  });

  // 7.1 등전자 계열: 전자 10개, 핵전하만 다르다
  Q.def("c5-isoel", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const ions = [["N³⁻", 7, 146], ["O²⁻", 8, 140], ["F⁻", 9, 133], ["Na⁺", 11, 102], ["Mg²⁺", 12, 72], ["Al³⁺", 13, 54]];
    Q.bind(fig, ({ i }) => {
      clear(g);
      ions.forEach(([s, Z, r], k) => {
        const cx = 52 + k * 86, cy = 120, R = r * 0.28;
        el("circle", { cx, cy, r: R, class: k === i ? "la" : "lk" }, g);
        if (k === i) el("circle", { cx, cy, r: R, class: "a" }, g);
        txt(g, cx, cy + 4, s, "s", "middle");
        txt(g, cx, 225, `${r} pm`, "s", "middle"); txt(g, cx, 245, `Z = ${Z}`, "s", "middle");
      });
      const [s, Z, r] = ions[i];
      read.textContent = `${s}: 전자 10개(네온과 같은 배치), 핵전하 +${Z}. 가려막기는 거의 같으므로 핵전하가 클수록 같은 전자를 세게 당겨 작아진다. 반지름 약 ${r} pm`;
    });
  });

  // 7.2 1차 이온화 에너지의 주기성과 순차 이온화 에너지
  Q.def("c5-ie", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const sym = "H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca".split(" ");
    const ie = [1312, 2372, 520, 899, 801, 1086, 1402, 1314, 1681, 2081, 496, 738, 578, 786, 1012, 1000, 1251, 1521, 419, 590];
    const succ = { Mg: [738, 1451, 7733, 10543], Al: [578, 1817, 2745, 11577] };
    Q.bind(fig, ({ Z, m }) => {
      clear(g);
      if (m == 0) {
        const F = Q.frame(0, 21, -100, 2550, 60, 500, 15, 255);
        Q.line(g, F.x(0), F.y(0), F.x(21), F.y(0), "ax"); Q.line(g, F.x(0.5), F.y(0), F.x(0.5), F.y(2500), "ax");
        [500, 1000, 1500, 2000, 2500].forEach((v) => txt(g, F.x(0.5) - 4, F.y(v) + 4, v, "s", "end")); txt(g, F.x(0.5) + 6, F.y(2500) + 10, "kJ/mol", "i");
        el("path", { d: ie.map((v, k) => (k ? "L" : "M") + F.x(k + 1).toFixed(1) + " " + F.y(v).toFixed(1)).join(""), class: "a" }, g);
        ie.forEach((v, k) => { Q.dot(g, F.x(k + 1), F.y(v), k + 1 === Z ? "fd" : [2, 10, 18].includes(k + 1) ? "fb" : "fa", k + 1 === Z ? 6 : 3); txt(g, F.x(k + 1), F.y(0) + 14, sym[k], "s", "middle"); });
        const note = Z === 5 ? " B < Be: 2p 전자가 2s보다 에너지가 높다." : Z === 8 ? " O < N: 짝지은 2p 전자가 반발을 받는다." : Z === 13 ? " Al < Mg: 3p 전자." : Z === 16 ? " S < P: 짝지은 3p 전자." : "";
        read.textContent = `${sym[Z - 1]}: 1차 이온화 에너지 ${ie[Z - 1]} kJ/mol. 주기마다 비활성 기체(청록)가 가장 크고 알칼리 금속이 가장 작다.` + note;
      } else {
        const key = m == 1 ? "Mg" : "Al", d = succ[key], F = Q.frame(0, 5, -500, 12500, 60, 500, 15, 255);
        Q.line(g, F.x(0), F.y(0), F.x(5), F.y(0), "ax"); Q.line(g, F.x(0.3), F.y(0), F.x(0.3), F.y(12000), "ax");
        [2000, 6000, 10000].forEach((v) => txt(g, F.x(0.3) - 4, F.y(v) + 4, v, "s", "end"));
        d.forEach((v, k) => { rect(g, F, k + 0.65, 0, k + 1.35, v, k >= (key === "Mg" ? 2 : 3) ? "ld" : "la"); txt(g, F.x(k + 1), F.y(v) - 5, v, "s", "middle"); txt(g, F.x(k + 1), F.y(0) + 14, `${k + 1}차`, "s", "middle"); });
        const nv = key === "Mg" ? 2 : 3;
        read.textContent = `${key}의 순차 이온화 에너지: ${nv}차에서 ${nv + 1}차로 크게 뛴다(빨강). 원자가 전자가 ${nv}개이므로 ${key === "Mg" ? "Mg²⁺" : "Al³⁺"}가 된다.`;
      }
    });
  });

  // 8.1 보른-하버 순환: 단계별 엔탈피
  Q.def("c5-bornhaber", (fig, svg) => {
    const F = Q.frame(0, 10, -480, 820, 30, 500, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const st = [["Na(s) + ½Cl₂", 0], ["Na(g) + ½Cl₂", 108], ["Na(g) + Cl(g)", 122], ["Na⁺(g) + Cl(g)", 496], ["Na⁺(g) + Cl⁻(g)", -349], ["NaCl(s)", -788]];
    Q.bind(fig, ({ s }) => {
      clear(g);
      Q.line(g, F.x(0.2), F.y(0), F.x(9.8), F.y(0), "gd dsh"); txt(g, F.x(9.8), F.y(0) - 4, "0", "s", "end");
      let h = 0, x = 0.4;
      for (let k = 0; k <= Math.min(s, 5); k++) {
        if (k > 0) { const h2 = h + st[k][1]; vec(g, F, x + 0.45, h, x + 0.45, h2, st[k][1] > 0 ? "d" : "a", st[k][1] > 0 ? "fd" : "fa"); txt(g, F.x(x + 0.55), F.y((h + h2) / 2) + 4, (st[k][1] > 0 ? "+" : "") + st[k][1], "s", "start"); h = h2; x += 1.55; }
        Q.line(g, F.x(x), F.y(h), F.x(x + 1.3), F.y(h), "k").setAttribute("style", "stroke-width:2.5");
        txt(g, F.x(x + 0.65), F.y(h) + (k % 2 ? 16 : -6), st[k][0], "s", "middle");
      }
      if (s >= 5) { Q.line(g, F.x(0.4), F.y(-411), F.x(9.6), F.y(-411), "b dsh"); txt(g, F.x(0.5), F.y(-411) - 5, "ΔH_f = −411", "tb", "start"); }
      const names = ["", "Na 승화", "Cl₂ 결합 절반 끊기", "Na 이온화", "Cl 전자 얻기", "이온이 모여 격자 형성(−U)"];
      read.textContent = s === 0 ? "원소 상태에서 출발한다. 단계를 하나씩 더해 보라." : `${s}단계 ${names[s]}: 누적 ${h > 0 ? "+" : ""}${h} kJ/mol` + (s === 4 ? " → 이온을 만드는 데까지는 오히려 에너지가 든다." : s === 5 ? " = 생성 엔탈피 −411이 되려면 격자 에너지 U = 788 kJ/mol" : "");
    });
  });

  // 8.2 형식 전하로 루이스 구조 고르기: OCN⁻
  Q.def("c5-formal", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const S = [[[2, 2], [4, 0, 4], [-1, 0, 0], "[N=C=O]⁻"], [[3, 1], [2, 0, 6], [0, 0, -1], "[N≡C–O]⁻"], [[1, 3], [6, 0, 2], [-2, 0, 1], "[N–C≡O]⁻"]];
    Q.bind(fig, ({ k }) => {
      clear(g);
      const [[b1, b2], lp, fc, nm] = S[k], X = [120, 260, 400], y = 130, at = ["N", "C", "O"];
      const bond = (x1, x2, n) => { for (let i = 0; i < n; i++) { const o = (i - (n - 1) / 2) * 8; Q.line(g, x1 + 18, y + o, x2 - 18, y + o, "k").setAttribute("style", "stroke-width:2"); } };
      bond(X[0], X[1], b1); bond(X[1], X[2], b2);
      at.forEach((a, i) => {
        txt(g, X[i], y + 7, a, "s", "middle").setAttribute("style", "font-size:22px");
        const pairs = lp[i] / 2, spots = i === 0 ? [[-26, 0], [0, -26], [0, 26]] : [[26, 0], [0, -26], [0, 26]];
        for (let p = 0; p < pairs; p++) { const [dx, dy] = spots[p]; const ox = dy ? 4 : 0, oy = dx ? 4 : 0; Q.dot(g, X[i] + dx - ox, y + dy - oy, "fk", 2.4); Q.dot(g, X[i] + dx + ox, y + dy + oy, "fk", 2.4); }
        const f = fc[i]; txt(g, X[i] + 16, y - 30, f === 0 ? "0" : (f > 0 ? "+" : "−") + Math.abs(f), f < 0 ? "ta" : f > 0 ? "td" : "s", "middle");
      });
      txt(g, 260, 230, "작은 숫자 = 형식 전하 (원자가 전자 − 비공유 전자 − 공유 전자/2)", "s", "middle");
      read.textContent = `${nm}: 형식 전하 N ${fc[0]}, C ${fc[1]}, O ${fc[2]}. ` + (k === 1 ? "형식 전하가 작고 음전하가 전기음성도가 가장 큰 O에 있어 가장 알맞다." : k === 2 ? "형식 전하가 커서(−2, +1) 알맞지 않다." : "음전하가 O보다 전기음성도가 작은 N에 있어 둘째 구조보다 덜 알맞다.");
    });
  });

  // 8.3 질산 이온의 공명 구조와 공명 혼성
  Q.def("c5-reso", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ k }) => {
      clear(g);
      const cx = 200, cy = 140, R = 80, ang = [90, 210, 330].map((d) => (d * PI) / 180);
      txt(g, cx, cy + 7, "N", "s", "middle").setAttribute("style", "font-size:22px");
      ang.forEach((a, i) => {
        const x = cx + R * Math.cos(a), y = cy - R * Math.sin(a), ux = Math.cos(a), uy = -Math.sin(a), nx = -uy, ny = ux;
        const x1 = cx + 18 * ux, y1 = cy + 18 * uy, x2 = x - 16 * ux, y2 = y - 16 * uy;
        Q.line(g, x1, y1, x2, y2, "k").setAttribute("style", "stroke-width:2");
        if (k == 3) Q.line(g, x1 + 6 * nx, y1 + 6 * ny, x2 + 6 * nx, y2 + 6 * ny, "k dsh");
        else if (i == k) Q.line(g, x1 + 6 * nx, y1 + 6 * ny, x2 + 6 * nx, y2 + 6 * ny, "k").setAttribute("style", "stroke-width:2");
        txt(g, x, y + 7, "O", "s", "middle").setAttribute("style", "font-size:22px");
        if (k != 3 && i != k) txt(g, x + 16 * ux, y + 16 * uy - 10, "−", "ta", "middle");
      });
      if (k != 3) txt(g, cx + 14, cy - 14, "+", "td", "middle");
      txt(g, 420, 90, k == 3 ? "공명 혼성" : `공명 구조 ${Number(k) + 1}`, "s", "middle");
      txt(g, 420, 130, k == 3 ? "결합 차수 4/3" : "이중 결합 1, 단일 결합 2", "s", "middle");
      txt(g, 420, 160, k == 3 ? "세 결합 모두 약 124 pm" : "136 pm과 115 pm이 섞인 그림", "s", "middle");
      read.textContent = k == 3 ? "실제 질산 이온은 세 구조를 섞은 하나의 상태이다. 각 N–O 결합 차수는 (2 + 1 + 1)/3 = 4/3이고 길이는 단일(136)과 이중(115) 사이인 약 124 pm로 모두 같다." : "공명 구조 사이에서는 전자(이중 결합의 위치)만 옮겨 그리고 원자는 움직이지 않는다.";
    });
  });

  // 9.1 VSEPR: 전자 영역 배치와 분자 모양 (돌려 보기)
  Q.def("c5-vsepr", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const s3 = Math.sqrt(3) / 2, t = 1 / Math.sqrt(3);
    const geo = {
      2: [[1, 0, 0], [-1, 0, 0]],
      3: [[0, 0, 1], [s3, 0, -0.5], [-s3, 0, -0.5]],
      4: [[t, t, t], [t, -t, -t], [-t, t, -t], [-t, -t, t]],
      5: [[0, 0, 1], [0, 0, -1], [1, 0, 0], [-0.5, s3, 0], [-0.5, -s3, 0]],
      6: [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]],
    };
    // [이름, 가운데, 바깥, 영역 수, 비공유쌍이 들어갈 자리 번호, 모양, 각]
    const M = [["CO₂", "C", "O", 2, [], "직선", "180°"], ["BF₃", "B", "F", 3, [], "평면 삼각형", "120°"], ["SO₂", "S", "O", 3, [0], "굽은형", "약 119°"],
      ["CH₄", "C", "H", 4, [], "사면체", "109.5°"], ["NH₃", "N", "H", 4, [0], "삼각뿔", "107°"], ["H₂O", "O", "H", 4, [0, 3], "굽은형", "104.5°"],
      ["PCl₅", "P", "Cl", 5, [], "삼각쌍뿔", "90°, 120°"], ["SF₄", "S", "F", 5, [2], "시소형", ""], ["ClF₃", "Cl", "F", 5, [3, 4], "T자형", ""],
      ["SF₆", "S", "F", 6, [], "팔면체", "90°"], ["XeF₄", "Xe", "F", 6, [4, 5], "평면 사각형", "90°"]];
    Q.bind(fig, ({ k, az }) => {
      clear(g);
      const [nm, c, o, n, lp, shape, ang] = M[k], a = (az * PI) / 180, ev = 0.35, S = 85, cx = 200, cy = 140;
      const P = ([x, y, z]) => { const u = x * Math.cos(a) - y * Math.sin(a), w = x * Math.sin(a) + y * Math.cos(a); return [cx + S * u, cy - S * (z * Math.cos(ev) + w * Math.sin(ev)), w * Math.cos(ev) - z * Math.sin(ev)]; };
      const items = geo[n].map((v, i) => ({ v, lp: lp.includes(i), p: P(v) })).sort((A, B) => B.p[2] - A.p[2]);
      const center = P([0, 0, 0]);
      items.forEach((it) => {
        if (it.lp) {
          const q = P(it.v.map((x) => x * 0.6));
          el("ellipse", { cx: q[0], cy: q[1], rx: 16, ry: 16, class: "lb", style: "opacity:.8" }, g);
          Q.dot(g, q[0] - 4, q[1], "fk", 2.2); Q.dot(g, q[0] + 4, q[1], "fk", 2.2);
        } else {
          Q.line(g, center[0], center[1], it.p[0], it.p[1], "k").setAttribute("style", "stroke-width:3");
          el("circle", { cx: it.p[0], cy: it.p[1], r: 15, class: "la" }, g); txt(g, it.p[0], it.p[1] + 4, o, "s", "middle");
        }
      });
      el("circle", { cx: center[0], cy: center[1], r: 17, class: "ld" }, g); txt(g, center[0], center[1] + 4, c, "s", "middle");
      txt(g, 380, 70, nm, "s", "start").setAttribute("style", "font-size:18px");
      txt(g, 380, 105, `전자 영역 ${n}개`, "s", "start"); txt(g, 380, 130, `비공유쌍 ${lp.length}개`, "s", "start");
      txt(g, 380, 155, `모양: ${shape}`, "ta", "start"); if (ang) txt(g, 380, 180, `결합각 ${ang}`, "s", "start");
      read.textContent = `${nm}: 전자 영역 ${n}개(${["", "", "직선", "평면 삼각형", "사면체", "삼각쌍뿔", "팔면체"][n]} 배치), 비공유쌍 ${lp.length}개(청록) → 원자 위치만 보면 ${shape}`;
    });
  });

  // 9.2 결합 쌍극자의 벡터 합: 물 분자의 결합각
  Q.def("c5-dipsum", (fig, svg) => {
    const F = Q.frame(-2.4, 2.4, -1.0, 2.2, 20, 380, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ th }) => {
      clear(g);
      const h = (th * PI) / 360, m = 1.5, L = 1.6;
      const H1 = [-L * Math.sin(h), -L * Math.cos(h) + 1.4], H2 = [L * Math.sin(h), -L * Math.cos(h) + 1.4], O = [0, 1.4];
      [H1, H2].forEach((Hh) => { Q.line(g, F.x(O[0]), F.y(O[1]), F.x(Hh[0]), F.y(Hh[1]), "k").setAttribute("style", "stroke-width:3"); el("circle", { cx: F.x(Hh[0]), cy: F.y(Hh[1]), r: 12, class: "lk" }, g); txt(g, F.x(Hh[0]), F.y(Hh[1]) + 4, "H", "s", "middle"); });
      el("circle", { cx: F.x(O[0]), cy: F.y(O[1]), r: 16, class: "ld" }, g); txt(g, F.x(0), F.y(1.4) + 4, "O", "s", "middle");
      const sc = 0.55;
      [H1, H2].forEach((Hh) => { const d = [O[0] - Hh[0], O[1] - Hh[1]], l = Math.hypot(...d); vec(g, F, Hh[0] + 0.2, Hh[1], Hh[0] + 0.2 + (d[0] / l) * m * sc, Hh[1] + (d[1] / l) * m * sc, "a", "fa"); });
      const mu = 2 * m * Math.cos(h);
      if (mu > 0.01) vec(g, F, 0, -0.6, 0, -0.6 + mu * sc, "d", "fd", "μ", "td");
      txt(g, 400, 80, `결합각 ${th}°`, "s", "start"); txt(g, 400, 110, `μ = 2(1.50)cos(${th / 2}°)`, "s", "start"); txt(g, 400, 140, `= ${num(mu, 2)} D`, "td", "start");
      read.textContent = `두 O–H 쌍극자(파랑)의 수평 성분은 지워지고 이등분선 방향 성분만 더해져 μ = ${num(mu, 2)} D` + (th >= 179 ? " (직선형이면 무극성)" : th === 104.5 ? " (실측 1.85 D)" : "");
    });
  });

  // 9.3 π 결합은 회전을 막는다: p 오비탈의 겹침
  Q.def("c5-pi", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ r }) => {
      clear(g);
      const phi = (r * PI) / 180, x1 = 170, x2 = 330, y = 140, H = 60, W = 22;
      Q.line(g, x1, y, x2, y, "k").setAttribute("style", "stroke-width:3"); txt(g, 250, y + 22, "σ 결합", "s", "middle");
      const lobe = (x, ang, sgn) => { const dx = Math.sin(ang) * H * 0.45, dy = Math.cos(ang) * H; el("ellipse", { cx: x + dx * sgn, cy: y - dy * sgn, rx: W * (0.4 + 0.6 * Math.abs(Math.cos(ang))), ry: H * 0.55, class: sgn > 0 ? "la" : "lb", style: "opacity:.75" }, g); };
      lobe(x1, 0, 1); lobe(x1, 0, -1); lobe(x2, phi, 1); lobe(x2, phi, -1);
      el("circle", { cx: x1, cy: y, r: 13, class: "ld" }, g); txt(g, x1, y + 4, "C", "s", "middle");
      el("circle", { cx: x2, cy: y, r: 13, class: "ld" }, g); txt(g, x2, y + 4, "C", "s", "middle");
      const ov = Math.abs(Math.cos(phi));
      el("rect", { x: 420, y: 230 - 150 * ov, width: 50, height: 150 * ov, class: "la" }, g); Q.line(g, 410, 230, 480, 230, "ax"); txt(g, 445, 250, "겹침", "s", "middle");
      read.textContent = `오른쪽 탄소를 결합 축 둘레로 ${r}° 돌리면 두 p 오비탈의 나란한 겹침이 cos ${r}° = ${num(ov, 2)}배로 줄어든다. 90°에서 π 결합이 끊어지므로 C=C는 자유롭게 돌지 못한다.`;
    });
  });

  // 9.4 분자 오비탈 에너지 그림: 2주기 이원자 분자
  Q.def("c5-mo", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const mol = [["B₂", 6], ["C₂", 8], ["N₂", 10], ["O₂", 12], ["F₂", 14], ["Ne₂", 16]];
    Q.bind(fig, ({ k }) => {
      clear(g);
      const [nm, ne] = mol[k], early = k <= 2;
      // [이름, 오비탈 수, 결합성?, y]
      const lv = [["σ2s", 1, 1, 240], ["σ*2s", 1, 0, 205], early ? ["π2p", 2, 1, 160] : ["σ2p", 1, 1, 160], early ? ["σ2p", 1, 1, 130] : ["π2p", 2, 1, 130], ["π*2p", 2, 0, 90], ["σ*2p", 1, 0, 50]];
      let left = ne, b = 0, a = 0, unp = 0;
      lv.forEach(([n, cnt, bond, y]) => {
        const cap = 2 * cnt, e = Math.min(left, cap); left -= e;
        if (bond) b += e; else a += e;
        txt(g, 150, y + 4, n, "s", "end");
        for (let i = 0; i < cnt; i++) {
          const x = 170 + i * 60; Q.line(g, x, y, x + 46, y, "k").setAttribute("style", "stroke-width:2.5");
          const up = e > i ? 1 : 0, dn = e > cnt + i ? 1 : 0; if (up) txt(g, x + 16, y - 3, "↑", "ta", "middle"); if (dn) txt(g, x + 30, y - 3, "↓", "td", "middle"); if (up && !dn) unp++;
        }
      });
      const bo = (b - a) / 2;
      txt(g, 330, 80, nm, "s", "start").setAttribute("style", "font-size:18px");
      txt(g, 330, 110, `원자가 전자 ${ne}개`, "s", "start"); txt(g, 330, 135, `결합성 ${b}, 반결합성 ${a}`, "s", "start");
      txt(g, 330, 160, `결합 차수 ${num(bo, 1)}`, "ta", "start"); txt(g, 330, 185, unp ? `홀전자 ${unp}개 → 상자성` : "홀전자 없음 → 반자성", "td", "start");
      read.textContent = `${nm}: 결합 차수 = (${b} − ${a})/2 = ${num(bo, 1)}` + (bo === 0 ? " → 분자가 생기지 않는다." : "") + (unp ? `, π*2p 등에 홀전자 ${unp}개(상자성)` : ", 반자성") + (early ? ". B₂~N₂는 π2p가 σ2p보다 낮다." : "");
    });
  });

  // 10.1 이상 기체 방정식: 상자 속 분자와 압력
  Q.def("c5-gas", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    let seed = 3; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const pts = []; for (let i = 0; i < 200; i++) pts.push([rnd(), rnd()]);
    Q.bind(fig, ({ n, T, V }) => {
      clear(g);
      const P = (n * 0.08206 * T) / V, w = 60 + V * 9, h = 150, x0 = 30, y0 = 240 - h;
      el("rect", { x: x0, y: y0, width: w, height: h, class: "lk" }, g);
      const cnt = Math.round(n * 40);
      for (let i = 0; i < cnt; i++) Q.dot(g, x0 + 6 + pts[i][0] * (w - 12), y0 + 6 + pts[i][1] * (h - 12), "fa", 3);
      txt(g, x0 + w / 2, 260, `V = ${num(V, 1)} L`, "s", "middle");
      const gx = 420, gy = 140, R = 60, ang = PI * (1 - Math.min(P, 6) / 6);
      el("path", { d: `M${gx - R} ${gy}A${R} ${R} 0 0 1 ${gx + R} ${gy}`, class: "k" }, g);
      Q.line(g, gx, gy, gx + 0.9 * R * Math.cos(ang), gy - 0.9 * R * Math.sin(ang), "d").setAttribute("style", "stroke-width:3");
      [0, 2, 4, 6].forEach((v) => { const a = PI * (1 - v / 6); txt(g, gx + (R + 12) * Math.cos(a), gy - (R + 12) * Math.sin(a) + 4, v, "s", "middle"); });
      txt(g, gx, gy + 24, `P = ${num(P, 2)} atm`, "td", "middle");
      read.textContent = `PV = nRT: n = ${num(n, 2)} mol, T = ${T} K, V = ${num(V, 1)} L → P = ${num(n, 2)} × 0.08206 × ${T} / ${num(V, 1)} = ${num(P, 2)} atm`;
    });
  });

  // 10.2 기체 분자의 속력과 분출 빠르기
  Q.def("c5-rms", (fig, svg) => {
    const F = Q.frame(0, 10, -60, 2100, 20, 500, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const gs = [["H₂", 2.016], ["He", 4.003], ["N₂", 28.02], ["O₂", 32.0], ["CO₂", 44.01], ["UF₆", 352]];
    Q.bind(fig, ({ T }) => {
      clear(g);
      Q.line(g, F.x(0.3), F.y(0), F.x(9.7), F.y(0), "ax");
      gs.forEach(([s, M], i) => { const u = Math.sqrt((3 * 8.314 * T) / (M / 1000)); bar(g, F, 0.6 + i * 1.55, 1, Math.min(u, 2080), i === 3 ? "ld" : "la", s, num(u, 0)); });
      const uO = Math.sqrt((3 * 8.314 * T) / 0.032), uH = Math.sqrt((3 * 8.314 * T) / 0.002016);
      read.textContent = `${T} K에서 u_rms = √(3RT/M) (m/s). O₂ ${num(uO, 0)} m/s, H₂ ${num(uH, 0)} m/s → 비 ${num(uH / uO, 2)} = √(32.00/2.016). 온도를 4배로 하면 속력은 2배`;
    });
  });

  // 10.3 실제 기체: CO₂ 1 mol의 이상 기체와 반데르발스 압력
  Q.def("c5-vdw", (fig, svg) => {
    const F = Q.frame(-0.05, 3.2, -4, 62, 60, 490, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const a = 3.59, b = 0.0427;
    Q.bind(fig, ({ T, V }) => {
      clear(g);
      axl(g, F, [1, 2, 3], [20, 40, 60], "V (L)", "P (atm)");
      const Pi = (v) => (0.08206 * T) / v, Pv = (v) => (0.08206 * T) / (v - b) - a / (v * v);
      Q.plot(g, F, (v) => (v > 0.35 ? Pi(v) : NaN), "gd dsh", 0.35, 3.2); Q.plot(g, F, (v) => (v > 0.12 ? Pv(v) : NaN), "a", 0.12, 3.2, 400);
      Q.dot(g, F.x(V), F.y(Pi(V)), "fk", 4); Q.dot(g, F.x(V), F.y(Pv(V)), "fa", 5);
      read.textContent = `CO₂ 1.00 mol, ${T} K, ${num(V, 2)} L: 이상 기체 ${num(Pi(V), 1)} atm, 반데르발스 ${num(Pv(V), 1)} atm (차이 ${num(((Pv(V) - Pi(V)) / Pi(V)) * 100, 1)}%). 부피가 클수록 두 값이 같아진다.`;
    });
  });

  // 11.1 수소 화합물의 끓는점: 수소 결합의 예외
  Q.def("c5-bp", (fig, svg) => {
    const F = Q.frame(1.6, 5.6, -180, 125, 60, 470, 10, 260), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const S = [["14족", ["CH₄", "SiH₄", "GeH₄", "SnH₄"], [-161, -112, -88, -52], "b"], ["15족", ["NH₃", "PH₃", "AsH₃", "SbH₃"], [-33, -88, -62, -17], "c"],
      ["16족", ["H₂O", "H₂S", "H₂Se", "H₂Te"], [100, -60, -41, -2], "d"], ["17족", ["HF", "HCl", "HBr", "HI"], [20, -85, -67, -35], "a"]];
    Q.bind(fig, ({ k }) => {
      clear(g);
      Q.line(g, F.x(1.7), F.y(0), F.x(5.5), F.y(0), "gd dsh"); txt(g, F.x(5.55), F.y(0) + 4, "0 °C", "s", "start");
      [2, 3, 4, 5].forEach((p) => txt(g, F.x(p), F.y(-180) + 2, `${p}주기`, "s", "middle"));
      [-150, -100, -50, 50, 100].forEach((v) => txt(g, F.x(1.6) - 4, F.y(v) + 4, v, "s", "end"));
      S.forEach(([nm, mol, bp, cls], i) => {
        const on = k == 4 || k == i;
        el("path", { d: bp.map((v, j) => (j ? "L" : "M") + F.x(j + 2).toFixed(1) + " " + F.y(v).toFixed(1)).join(""), class: on ? cls : "gd" }, g);
        bp.forEach((v, j) => { Q.dot(g, F.x(j + 2), F.y(v), on ? "f" + cls : "lk", on ? 4 : 2.5); if (on) txt(g, F.x(j + 2) + 6, F.y(v) - 6, mol[j], "s", "start"); });
      });
      read.textContent = k == 4 ? "아래 주기로 갈수록 분자가 커져 분산력으로 끓는점이 오르지만, 2주기의 H₂O, HF, NH₃만 수소 결합 때문에 예외적으로 높다. 14족의 CH₄는 수소 결합이 없어 예외가 없다." : `${S[k][0]} 수소 화합물: ` + S[k][1].map((m, j) => `${m} ${S[k][2][j]} °C`).join(", ");
    });
  });

  // 11.2 상평형 그림 (모양은 대략, 압력은 로그 눈금)
  Q.def("c5-phase", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const SUB = {
      0: { nm: "물", x0: -60, x1: 420, tp: [0.01, 0.006], cp: [374, 218], nbp: 100, fus: -0.0072 },
      1: { nm: "이산화 탄소", x0: -120, x1: 60, tp: [-56.6, 5.1], cp: [31.0, 72.8], nbp: null, fus: 0.02 },
    };
    Q.bind(fig, ({ s, u, lp }) => {
      clear(g);
      const T = SUB[s].x0 + u * (SUB[s].x1 - SUB[s].x0), d = SUB[s], F = Q.frame(d.x0, d.x1, -3, 3, 60, 500, 10, 255), P = 10 ** lp, K = (t) => t + 273.15;
      const [tT, tP] = d.tp, [cT, cP] = d.cp;
      // 증기 압력: 삼중점과 임계점 사이를 ln P 대 1/T 직선으로
      const Bv = Math.log(cP / tP) / (1 / K(tT) - 1 / K(cT)), vap = (t) => tP * Math.exp(-Bv * (1 / K(t) - 1 / K(tT)));
      const sub = (t) => tP * Math.exp(-Bv * 1.15 * (1 / K(t) - 1 / K(tT)));
      const fusT = (p) => tT + (d.fus * (p - tP)) / (s == 0 ? 1 : 10);
      const Y = (p) => Math.max(-3, Math.min(3, Math.log10(p)));
      const pl = (f, a, b) => { let dd = ""; for (let i = 0; i <= 120; i++) { const t = a + ((b - a) * i) / 120; dd += (i ? "L" : "M") + F.x(t).toFixed(1) + " " + F.y(Y(f(t))).toFixed(1); } el("path", { d: dd, class: "k" }, g); };
      pl(sub, d.x0, tT); pl(vap, tT, cT);
      let dd = ""; for (let i = 0; i <= 40; i++) { const lpp = Math.log10(tP) + ((3 - Math.log10(tP)) * i) / 40, p = 10 ** lpp; dd += (i ? "L" : "M") + F.x(fusT(p)).toFixed(1) + " " + F.y(lpp).toFixed(1); } el("path", { d: dd, class: "k" }, g);
      Q.line(g, F.x(d.x0), F.y(0), F.x(d.x1), F.y(0), "gd dsh"); txt(g, F.x(d.x1) - 4, F.y(0) - 4, "1 atm", "s", "end");
      Q.dot(g, F.x(tT), F.y(Y(tP)), "fb", 4); txt(g, F.x(tT) + 6, F.y(Y(tP)) + 14, "삼중점", "tb", "start");
      Q.dot(g, F.x(cT), F.y(Y(cP)), "fc", 4); txt(g, F.x(cT) + 6, F.y(Y(cP)) - 6, "임계점", "tc", "start");
      txt(g, F.x(d.x0) + 6, F.y(2.5), "고체", "s", "start"); txt(g, F.x(d.x1) - 6, F.y(-2.5), "기체", "s", "end");
      txt(g, F.x((tT + cT) / 2) + (s == 0 ? -30 : 0), F.y(1.8), "액체", "s", "middle");
      [-2, -1, 0, 1, 2].forEach((v) => txt(g, F.x(d.x0) - 4, F.y(v) + 4, `10${v < 0 ? "⁻" : ""}${"⁰¹²³"[Math.abs(v)]}`, "s", "end"));
      txt(g, F.x(d.x1), F.y(-3) - 6, "온도 (°C)", "i", "end"); txt(g, F.x(d.x0) + 6, F.y(3) + 12, "압력 (atm)", "i", "start");
      Q.dot(g, F.x(T), F.y(lp), "fd", 6);
      let ph;
      if (T > cT && P > cP) ph = "초임계 유체";
      else if (T < tT) ph = P < sub(T) ? "기체" : (s == 0 ? (T < fusT(P) ? "고체" : "액체") : (T < fusT(P) ? "고체" : "액체"));
      else ph = P < vap(T) ? "기체" : T < fusT(P) ? "고체" : "액체";
      read.textContent = `${d.nm}, ${num(T, 1)} °C, ${num(P, P < 1 ? 4 : 1)} atm: ${ph}` + (s == 1 ? ". 삼중점 압력이 5.1 atm이라 1 atm에서는 액체가 없다." : ". 삼중점 0.01 °C, 0.006 atm");
    });
  });

  // 12.1 입방 단위 세포
  Q.def("c5-cell", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const T = [["단순 입방", 1, 6, 52], ["체심 입방", 2, 8, 68], ["면심 입방", 4, 12, 74]];
    Q.bind(fig, ({ k, az }) => {
      clear(g);
      const a = (az * PI) / 180, ev = 0.4, S = 110, cx = 190, cy = 150;
      const P = (x, y, z) => { x -= 0.5; y -= 0.5; z -= 0.5; const u = x * Math.cos(a) - y * Math.sin(a), w = x * Math.sin(a) + y * Math.cos(a); return [cx + S * u, cy - S * (z * Math.cos(ev) + w * Math.sin(ev)), w * Math.cos(ev) - z * Math.sin(ev)]; };
      const E = [[0, 0, 0, 1, 0, 0], [0, 0, 0, 0, 1, 0], [0, 0, 0, 0, 0, 1], [1, 1, 1, 0, 1, 1], [1, 1, 1, 1, 0, 1], [1, 1, 1, 1, 1, 0], [1, 0, 0, 1, 1, 0], [1, 0, 0, 1, 0, 1], [0, 1, 0, 1, 1, 0], [0, 1, 0, 0, 1, 1], [0, 0, 1, 1, 0, 1], [0, 0, 1, 0, 1, 1]];
      E.forEach(([a1, b1, c1, a2, b2, c2]) => { const p = P(a1, b1, c1), q = P(a2, b2, c2); Q.line(g, p[0], p[1], q[0], q[1], "gd"); });
      const atoms = [];
      for (const x of [0, 1]) for (const y of [0, 1]) for (const z of [0, 1]) atoms.push([x, y, z, "fa", "꼭짓점 1/8"]);
      if (k == 1) atoms.push([0.5, 0.5, 0.5, "fd", "가운데 1"]);
      if (k == 2) [[0.5, 0.5, 0], [0.5, 0.5, 1], [0.5, 0, 0.5], [0.5, 1, 0.5], [0, 0.5, 0.5], [1, 0.5, 0.5]].forEach(([x, y, z]) => atoms.push([x, y, z, "fb", "면 1/2"]));
      atoms.map((t) => [...t, P(t[0], t[1], t[2])]).sort((A, B) => B[5][2] - A[5][2]).forEach(([x, y, z, cls, , p]) => { el("circle", { cx: p[0], cy: p[1], r: 13 - 3 * p[2], class: cls, style: "opacity:.9" }, g); });
      const [nm, n, cn, pf] = T[k];
      txt(g, 360, 70, nm, "s", "start").setAttribute("style", "font-size:17px");
      txt(g, 360, 105, k == 0 ? "꼭짓점 8 × 1/8 = 1" : k == 1 ? "8 × 1/8 + 1 = 2" : "8 × 1/8 + 6 × 1/2 = 4", "s", "start");
      txt(g, 360, 130, `배위수 ${cn}`, "s", "start"); txt(g, 360, 155, `채움률 ${pf}%`, "s", "start");
      read.textContent = `${nm}: 세포 하나의 몫은 원자 ${n}개(꼭짓점은 8개 세포가, 면 위는 2개 세포가 나눠 가짐), 배위수 ${cn}, 채움률 ${pf}%`;
    });
  });

  // 12.2 에너지 띠: 금속, 반도체, 절연체
  Q.def("c5-bands", (fig, svg) => {
    const F = Q.frame(0, 10, -1, 8.5, 20, 500, 10, 270), g = el("g", {}, svg), read = fig.querySelector(".q-read");
    const M = [["금속", 0, "Cu"], ["반도체", 1.1, "Si"], ["절연체", 5.5, "다이아몬드"]];
    let seed = 5; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const R = []; for (let i = 0; i < 60; i++) R.push([rnd(), rnd()]);
    Q.bind(fig, ({ k, T }) => {
      clear(g);
      const [nm, Eg, ex] = M[k], top = 3, sc = 0.7;
      rect(g, F, 1, 0, 6, top, "la"); txt(g, F.x(6.2), F.y(top / 2) + 4, "원자가 띠 (참)", "s", "start");
      const cb0 = k == 0 ? top - 0.5 : top + Eg * sc;
      rect(g, F, 1, cb0, 6, cb0 + 3, "lk"); txt(g, F.x(6.2), F.y(cb0 + 1.5) + 4, "전도 띠", "s", "start");
      if (k > 0) { vec(g, F, 0.6, top, 0.6, cb0, "d", "fd"); vec(g, F, 0.6, cb0, 0.6, top, "d", "fd"); txt(g, F.x(0.75), F.y((top + cb0) / 2) + 4, `${Eg} eV`, "td", "start"); }
      const kT = 8.617e-5 * T, frac = k == 0 ? 1 : Math.exp(-Eg / (2 * kT)), nE = k == 0 ? 25 : Math.min(25, Math.round(frac * 1e10));
      for (let i = 0; i < nE; i++) Q.dot(g, F.x(1.3 + R[i][0] * 4.4), F.y(cb0 + 0.2 + R[i][1] * (k == 0 ? 0.6 : 1.2)), "fa", 3.5);
      for (let i = 0; i < (k == 0 ? 0 : nE); i++) el("circle", { cx: F.x(1.3 + R[i + 30][0] * 4.4), cy: F.y(top - 0.2 - R[i + 30][1] * 1.0), r: 3.5, class: "a" }, g);
      read.textContent = `${nm}(${ex}), ${T} K: ` + (k == 0 ? "띠가 부분적으로 차 있어 전자가 바로 위 빈 상태로 옮겨 다닌다." : `띠 간격 ${Eg} eV를 넘어 올라간 전자의 비율 ~ e^(−E_g/2kT) = ${frac.toExponential(1)}` + (k == 1 ? " (온도가 오르면 크게 는다)" : " (사실상 0)"));
    });
  });

  // 13.1 눈금 읽기: 눈높이와 메니스커스
  Q.def("c5-menisc", (fig, svg) => {
    const g = el("g", {}, svg), read = fig.querySelector(".q-read");
    Q.bind(fig, ({ e }) => {
      clear(g);
      const x0 = 190, w = 70, y0 = 40, H = 200, true_ = 23.45, mmPx = H / 4, lvl = y0 + (true_ - 22) * mmPx;
      el("rect", { x: x0, y: y0, width: w, height: H + 20, class: "lk" }, g);
      for (let v = 22; v <= 26.001; v += 0.1) { const y = y0 + (v - 22) * mmPx, major = Math.abs(v - Math.round(v)) < 1e-6; Q.line(g, x0, y, x0 + (major ? 22 : 10), y, "k"); if (major) txt(g, x0 - 6, y + 4, Math.round(v), "s", "end"); }
      el("path", { d: `M${x0} ${lvl - 6}Q${x0 + w / 2} ${lvl + 8} ${x0 + w} ${lvl - 6}L${x0 + w} ${y0 + H + 20}L${x0} ${y0 + H + 20}Z`, class: "lb", style: "opacity:.7" }, g);
      const ey = lvl + e * 18, ex = 420;
      el("circle", { cx: ex, cy: ey, r: 10, class: "k" }, g); Q.dot(g, ex - 4, ey, "fk", 3);
      Q.line(g, ex - 12, ey, x0 + w / 2, lvl + 1, "d dsh");
      const slope = (lvl + 1 - ey) / (x0 + w / 2 - (ex - 12)), yAt = ey + slope * (x0 - (ex - 12)), reading = 22 + (yAt - y0) / mmPx;
      Q.dot(g, x0, yAt, "fd", 4);
      read.textContent = e == 0 ? `눈높이를 메니스커스 바닥에 맞추면 ${true_.toFixed(2)} mL로 바르게 읽는다(0.01 mL까지 어림).` : `눈이 액면보다 ${e > 0 ? "아래" : "위"}에 있으면 눈금이 ${num(reading, 2)} mL로 ${num(Math.abs(reading - true_), 2)} mL 어긋나 읽힌다(시차).`;
    });
  });

  // ── 새 그림은 이 위에 ──
})();
