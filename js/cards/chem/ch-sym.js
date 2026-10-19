/* 화학과 무기화학 탐구 카드 묶음 (화학9)
   지표표와 환원 공식: 진동 모드의 대칭과 IR·라만 활성 */
(() => {
  "use strict";
  const C = () => QSim.col();

  /* 1. 환원 공식 계산기 (화학9-02-02) */
  (() => {
    const S = QSim.card("lab-ch9-reduce"); if (!S) return;
    const cv = S.$("canvas");
    // 점군: 류(class) 이름, 류의 크기, 기약 표현의 지표, 병진·회전, IR·라만 활성, 축 위 원자 하나의 기여(3N 표현)
    const G = {
      C2v: { cls: ["E", "C₂", "σᵥ(xz)", "σᵥ′(yz)"], g: [1, 1, 1, 1],
        irr: { A1: [1, 1, 1, 1], A2: [1, 1, -1, -1], B1: [1, -1, 1, -1], B2: [1, -1, -1, 1] },
        trans: ["A1", "B1", "B2"], rot: ["A2", "B1", "B2"], ir: ["A1", "B1", "B2"], raman: ["A1", "A2", "B1", "B2"], contrib: [3, -1, 1, 1] },
      C3v: { cls: ["E", "2C₃", "3σᵥ"], g: [1, 2, 3],
        irr: { A1: [1, 1, 1], A2: [1, 1, -1], E: [2, -1, 0] },
        trans: ["A1", "E"], rot: ["A2", "E"], ir: ["A1", "E"], raman: ["A1", "E"], contrib: [3, 0, 1] },
      D3h: { cls: ["E", "2C₃", "3C₂", "σₕ", "2S₃", "3σᵥ"], g: [1, 2, 3, 1, 2, 3],
        irr: { "A1′": [1, 1, 1, 1, 1, 1], "A2′": [1, 1, -1, 1, 1, -1], "E′": [2, -1, 0, 2, -1, 0], "A1″": [1, 1, 1, -1, -1, -1], "A2″": [1, 1, -1, -1, -1, 1], "E″": [2, -1, 0, -2, 1, 0] },
        trans: ["E′", "A2″"], rot: ["A2′", "E″"], ir: ["E′", "A2″"], raman: ["A1′", "E′", "E″"], contrib: [3, 0, -1, 1, -2, 1] },
      Td: { cls: ["E", "8C₃", "3C₂", "6S₄", "6σd"], g: [1, 8, 3, 6, 6],
        irr: { A1: [1, 1, 1, 1, 1], A2: [1, 1, 1, -1, -1], E: [2, -1, 2, 0, 0], T1: [3, 0, -1, 1, -1], T2: [3, 0, -1, -1, 1] },
        trans: ["T2"], rot: ["T1"], ir: ["T2"], raman: ["A1", "E", "T2"], contrib: [3, 0, -1, -1, 1] }
    };
    // 예시 분자: 점군, 각 조작에서 움직이지 않는 원자 수 (H₂O는 분자 평면을 xz로 둠)
    const MOL = {
      h2o: { n: "H₂O", grp: "C2v", unm: [3, 1, 3, 1] },
      nh3: { n: "NH₃", grp: "C3v", unm: [4, 1, 2] },
      bf3: { n: "BF₃", grp: "D3h", unm: [4, 1, 2, 4, 1, 2] },
      ch4: { n: "CH₄", grp: "Td", unm: [5, 2, 1, 1, 3] }
    };
    function reduce(grp, chi) {
      const t = G[grp], h = t.g.reduce((a, b) => a + b, 0), out = {};
      for (const [k, row] of Object.entries(t.irr)) out[k] = Math.round(t.g.reduce((s, gi, i) => s + gi * row[i] * chi[i], 0) / h * 1000) / 1000;
      return out;
    }
    const fmt = (o) => Object.entries(o).filter(([, v]) => v > 1e-9).map(([k, v]) => (v === 1 ? "" : v) + k).join(" + ") || "없음";
    function draw() {
      const c = C(), m = MOL[S.val("mol")], t = G[m.grp];
      const chi = m.unm.map((u, i) => u * t.contrib[i]);
      const tot = reduce(m.grp, chi), vib = { ...tot };
      t.trans.forEach((k) => { vib[k] -= 1; }); t.rot.forEach((k) => { vib[k] -= 1; });
      const ir = Object.entries(vib).filter(([k, v]) => v > 0 && t.ir.includes(k)).map(([k, v]) => (v === 1 ? "" : v) + k);
      const ra = Object.entries(vib).filter(([k, v]) => v > 0 && t.raman.includes(k)).map(([k, v]) => (v === 1 ? "" : v) + k);
      const nvib = Object.entries(vib).reduce((s, [k, v]) => s + v * t.irr[k][0], 0);
      // 막대: 진동 모드의 기약 표현별 개수(축퇴 포함)
      const keys = Object.keys(t.irr), top = Math.max(4, ...keys.map((k) => Math.max(0, vib[k]) * t.irr[k][0])) + 1;
      const v = QSim.view(cv, 0.36), f = QSim.frame(v, { x0: 0, x1: keys.length + 1, y0: -top * 0.15, y1: top, yl: "진동 모드 수", pad: 30 });
      f.axes({ noGrid: true });
      keys.forEach((k, i) => {
        const n = Math.max(0, vib[k]) * t.irr[k][0], g = v.g, x0 = f.X(i + 0.65), x1 = f.X(i + 1.35);
        g.fillStyle = t.ir.includes(k) ? "#b5562a" : c.main; g.globalAlpha = 0.8; g.fillRect(x0, f.Y(n), x1 - x0, f.Y(0) - f.Y(n)); g.globalAlpha = 1;
        f.text(k, i + 1, -top * 0.1, c.ink2, "center");
      });
      S.out(`${m.n} (점군 ${m.grp}) · 조작: ${t.cls.join(", ")}\n움직이지 않는 원자 수: ${m.unm.join(", ")} → Γ₃N 지표: ${chi.join(", ")}\nΓ₃N = ${fmt(tot)}\nΓ진동 = Γ₃N − Γ병진 − Γ회전 = ${fmt(vib)} (진동 모드 ${nvib}개)\nIR 활성: ${ir.join(" + ") || "없음"} · 라만 활성: ${ra.join(" + ") || "없음"}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 프로스트 도표와 불균등화 (화학9-06-01) */
  (() => {
    const S = QSim.card("lab-ch9-frost"); if (!S) return;
    const cv = S.$("canvas");
    // 산성 용액(pH 0), 25 °C. [산화수 N, 화학종, N·E°(X(N)/X(0)) in V] — 표준 전위표에서 계산
    const EL = {
      mn: { n: "망가니즈", d: [[0, "Mn", 0], [2, "Mn²⁺", -2.36], [3, "Mn³⁺", -0.85], [4, "MnO₂", 0.10], [6, "MnO₄²⁻", 4.62], [7, "MnO₄⁻", 5.18]] },
      fe: { n: "철", d: [[0, "Fe", 0], [2, "Fe²⁺", -0.88], [3, "Fe³⁺", -0.11], [6, "FeO₄²⁻", 6.49]] },
      cu: { n: "구리", d: [[0, "Cu", 0], [1, "Cu⁺", 0.521], [2, "Cu²⁺", 0.674]] },
      o: { n: "산소", d: [[-2, "H₂O", -2.458], [-1, "H₂O₂", -0.695], [0, "O₂", 0]] }
    };
    function draw() {
      const c = C(), e = EL[S.val("el")], d = e.d;
      const xs = d.map((p) => p[0]), ys = d.map((p) => p[2]);
      const x0 = Math.min(...xs) - 0.5, x1 = Math.max(...xs) + 0.5, y0 = Math.min(0, ...ys) - 0.8, y1 = Math.max(0, ...ys) + 0.8;
      const v = QSim.view(cv, 0.56), f = QSim.frame(v, { x0, x1, y0, y1, xl: "산화수 N", yl: "N·E° (V)", pad: 36 });
      f.axes();
      f.path(d.map((p) => [p[0], p[2]]), c.main, 2.5);
      const lines = [];
      let iMin = 0; ys.forEach((y, i) => { if (y < ys[iMin]) iMin = i; });
      d.forEach((p, i) => {
        let col = c.main;
        if (i > 0 && i < d.length - 1) {
          const [na, , ya] = d[i - 1], [nb, , yb] = d[i + 1], [nm, sp, ym] = p;
          const yl = ya + (yb - ya) * (nm - na) / (nb - na);
          const dG = (nb - nm) * ya + (nm - na) * yb - (nb - na) * ym;   // ΔG°/F of 불균등화
          if (ym > yl) {
            col = "#d9534f";
            f.path([[na, ya], [nb, yb]], "#d9534f", 1.2, [5, 4]);
            lines.push(`${sp}: 이웃(${d[i - 1][1]}, ${d[i + 1][1]})을 잇는 선보다 ${(ym - yl).toFixed(2)} V 위 → 불균등화, K = 10^${(-dG / 0.05916).toFixed(1)}`);
          } else lines.push(`${sp}: 이웃을 잇는 선보다 ${(yl - ym).toFixed(2)} V 아래 → 불균등화하지 않음`);
        }
        f.dot(p[0], p[2], col, 6);
        f.text(p[1], p[0] + 0.12, p[2] + (y1 - y0) * 0.04, c.ink2);
      });
      S.out(`${e.n}의 프로스트 도표 (산성, 25 °C)\n가장 낮은 점(가장 안정한 상태): ${d[iMin][1]}\n${lines.join("\n")}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
