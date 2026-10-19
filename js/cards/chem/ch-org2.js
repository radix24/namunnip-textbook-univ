/* 화학과 유기화학 탐구 카드 묶음 (화학5 유기화학2)
   1,3-뷰타다이엔 + HBr: 속도론적 조절과 열역학적 조절 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const RED = "#b5562a";
  const R = 8.314462618e-3, kB = 1.380649e-23, h = 6.62607015e-34;   // kJ/(mol·K), J/K, J·s

  /* 1. 속도론적 조절 대 열역학적 조절 (화학5-02-01) */
  (() => {
    const S = QSim.card("lab-ch5-control"); if (!S) return;
    const [cv1, cv2] = S.$$("canvas");
    // 알릴 양이온 I(에너지 0) → 1,2-생성물(P12) 또는 1,4-생성물(P14)
    // 교재 대표값에 맞춘 모형: 1,4로 가는 전이 상태가 2.0 높고, P14가 P12보다 4.5 안정, P12에서 I로 돌아가는 장벽 92 kJ/mol
    const dTS = 2.0, dG = 4.5, Eb = 92.0;
    function model(TC, t) {
      const T = TC + 273.15, A = kB * T / h;
      const fk = 1 / (1 + Math.exp(dTS / (R * T)));              // I에서 1,4로 가는 비율
      const K = Math.exp(dG / (R * T)), fe = K / (1 + K);         // 평형에서 1,4 비율
      const k12 = A * Math.exp(-Eb / (R * T));                    // P12 → I
      const k14 = A * Math.exp(-(Eb + dG + dTS) / (R * T));       // P14 → I
      const lam = k12 * fk + k14 * (1 - fk);                      // 두 생성물 사이 이완 속도
      const x = (tt) => fe + (fk - fe) * Math.exp(-lam * tt);
      return { fk, fe, x, now: x(t), half: Math.LN2 / lam };
    }
    const human = (s) => s < 120 ? s.toFixed(0) + "초" : s < 7200 ? (s / 60).toFixed(0) + "분" : s < 172800 ? (s / 3600).toFixed(1) + "시간" : s < 3.15e7 * 3 ? (s / 86400).toFixed(0) + "일" : (s / 3.15e7).toExponential(1) + "년";
    function draw() {
      const c = C(), TC = S.val("T"), lt = S.val("lt"), t = Math.pow(10, lt), m = model(TC, t);
      // 에너지 도표 (그림용 높이, 단위 kJ/mol): P12 ← TS12 ← I → TS14 → P14
      const v = QSim.view(cv1, 0.46), f = QSim.frame(v, { x0: 0, x1: 6, y0: -100, y1: 25, yl: "E (kJ/mol, 알릴 양이온 기준)", pad: 34 });
      f.axes({ noGrid: true });
      const pts = [[0.4, -(Eb - 10)], [2.0, 10], [3.0, 0], [4.0, 10 + dTS], [5.6, -(Eb - 10) - dG]];
      const seg = (a, b) => { const p = []; for (let i = 0; i <= 40; i++) { const s = i / 40, w = (1 - Math.cos(Math.PI * s)) / 2; p.push([a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * w]); } return p; };
      let path = []; for (let i = 0; i < 4; i++) path = path.concat(seg(pts[i], pts[i + 1]));
      f.path(path, c.main, 2.5);
      f.text("1,2-생성물", 0.15, pts[0][1] - 8, c.ink2);
      f.text("1,4-생성물", 4.9, pts[4][1] - 8, RED);
      f.text("알릴 양이온 + Br⁻", 3.0, -9, c.ink2, "center");
      f.text("TS 1,2", 2.0, 15, c.ink3, "center"); f.text("TS 1,4 (+2.0)", 4.0, 17, c.ink3, "center");
      // 시간에 따른 1,4 비율
      const w = QSim.view(cv2, 0.46), g2 = QSim.frame(w, { x0: 0, x1: 7, y0: 0, y1: 100, xl: "log₁₀(t / s)", yl: "1,4-생성물 (%)", pad: 34 });
      g2.axes();
      g2.fn((x) => 100 * m.fk, c.ink3, 1.5, [5, 4]);
      g2.fn((x) => 100 * m.fe, RED, 1.5, [5, 4]);
      g2.fn((x) => 100 * m.x(Math.pow(10, x)), c.main, 2.5);
      g2.dot(lt, 100 * m.now, c.warn, 6);
      const p14 = 100 * m.now;
      S.out(`온도 ${TC} °C, 반응 시간 ${human(t)}\n지금 생성물 비 1,2 : 1,4 = ${(100 - p14).toFixed(1)} : ${p14.toFixed(1)}\n처음(속도론적) 비 = ${(100 - 100 * m.fk).toFixed(1)} : ${(100 * m.fk).toFixed(1)}   평형(열역학적) 비 = ${(100 - 100 * m.fe).toFixed(1)} : ${(100 * m.fe).toFixed(1)}\n두 생성물이 서로 바뀌어 평형에 반쯤 가는 시간 ≈ ${human(m.half)}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();



})();
