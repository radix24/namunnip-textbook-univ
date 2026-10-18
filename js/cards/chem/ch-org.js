/* 화학과 유기화학 탐구 카드 묶음 (화학2 유기화학1)
   Newman 투영과 회전 에너지 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const RED = "#b5562a", GRN = "#2f8f5b";
  const R = 8.314e-3;   // kJ/(mol·K)

  /* 1. Newman 투영과 회전 에너지: 에테인, 프로페인, 뷰테인 (화학2-03-02) */
  (() => {
    const S = QSim.card("lab-ch2-newman"); if (!S) return;
    const [cv1, cv2] = S.$$("canvas");
    // 에너지 함수 (kJ/mol), φ = 앞 탄소의 기준 치환기와 뒤 탄소의 기준 치환기 사이 이면각
    // 가림 비용(Klein 교재 대표값): H/H 4, CH3/H 6, CH3/CH3 11, 뷰테인 gauche 3.8
    const MOL = {
      eth: { n: "에테인", front: ["H", "H", "H"], back: ["H", "H", "H"], V: (p) => 6 * (1 + Math.cos(3 * p)) },
      prop: { n: "프로페인", front: ["CH₃", "H", "H"], back: ["H", "H", "H"], V: (p) => 7 * (1 + Math.cos(3 * p)) },
      but: { n: "뷰테인 (C2−C3 결합)", front: ["CH₃", "H", "H"], back: ["CH₃", "H", "H"],
        V: (p) => 9.767 + 2.267 * Math.cos(p) - 0.267 * Math.cos(2 * p) + 7.233 * Math.cos(3 * p) }
    };
    const deg = (x) => x * Math.PI / 180;
    function name(m, d) {
      const a = ((d % 360) + 360) % 360, near = (t) => Math.abs(a - t) < 8 || Math.abs(a - t - 360) < 8;
      if (m !== "but") return [0, 120, 240].some(near) ? "가림형" : [60, 180, 300].some(near) ? "엇갈림형" : "중간";
      if (near(0)) return "완전 가림형 (CH₃/CH₃ 가림)";
      if (near(120) || near(240)) return "가림형 (CH₃/H 가림)";
      if (near(60) || near(300)) return "gauche 엇갈림형";
      if (near(180)) return "anti 엇갈림형";
      return "중간";
    }
    function draw() {
      const c = C(), key = S.val("mol"), m = MOL[key], d = S.val("phi"), T = S.val("T");
      // Newman 그림
      const v = QSim.view(cv1, 0.62), g = v.g, W = v.W, H = v.H, cx = W * 0.5, cy = H * 0.5, r = Math.min(W, H) * 0.22, L = r * 1.9;
      g.save(); g.lineWidth = 3; g.font = "14px " + getComputedStyle(document.documentElement).getPropertyValue("--f-mono");
      g.textAlign = "center"; g.textBaseline = "middle";
      const put = (ang, lab, col, start) => {
        const x1 = cx + Math.cos(ang) * start, y1 = cy - Math.sin(ang) * start, x2 = cx + Math.cos(ang) * L, y2 = cy - Math.sin(ang) * L;
        g.strokeStyle = col; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
        g.fillStyle = col; g.fillText(lab, cx + Math.cos(ang) * (L + 18), cy - Math.sin(ang) * (L + 14));
      };
      // 뒤 탄소: 원과 원 둘레에서 나오는 결합 (기준 치환기를 이면각 d만큼 돌림)
      m.back.forEach((lab, i) => put(deg(90 + d + 120 * i), lab, lab === "H" ? c.ink3 : RED, r));
      g.fillStyle = c.card; g.strokeStyle = c.ink2; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill(); g.stroke();
      // 앞 탄소: 가운데 점에서 나오는 결합
      g.lineWidth = 3;
      m.front.forEach((lab, i) => put(deg(90 + 120 * i), lab, lab === "H" ? c.ink2 : c.main, 0));
      g.fillStyle = c.ink; g.beginPath(); g.arc(cx, cy, 3, 0, 7); g.fill();
      g.restore();
      // 에너지 그래프
      const w = QSim.view(cv2, 0.42), top = key === "but" ? 22 : 16, f = QSim.frame(w, { x0: 0, x1: 360, y0: 0, y1: top, xl: "이면각 (°)", yl: "E (kJ/mol)", pad: 36 }); f.axes();
      f.fn((x) => m.V(deg(x)), c.main, 2.5, null, 360);
      f.dot(((d % 360) + 360) % 360, m.V(deg(d)), c.warn, 6);
      // 볼츠만 분포 (뷰테인: anti 1개, gauche 2개)
      let pop = "";
      if (key === "but") {
        const eg = 3.8, q = 1 + 2 * Math.exp(-eg / (R * T));
        pop = `\n${T} K에서 엇갈림형 분포(볼츠만): anti ${(100 / q).toFixed(1)}%, gauche 둘 합 ${(100 * (q - 1) / q).toFixed(1)}%`;
      }
      const barrier = key === "but" ? 19.0 : key === "prop" ? 14 : 12;
      const rt = R * T, rate = 6.2e12 * Math.exp(-barrier / rt);
      S.out(`${m.n}, 이면각 ${d}°: ${name(key, d)}\n에너지 ${m.V(deg(d)).toFixed(1)} kJ/mol (가장 안정한 형태 기준)\n가장 높은 회전 장벽 ${barrier} kJ/mol, 실온 열에너지 RT = ${rt.toFixed(2)} kJ/mol\n장벽을 넘는 빠르기 어림(아이링 식) 약 ${rate.toExponential(1)}번/초${pop}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
