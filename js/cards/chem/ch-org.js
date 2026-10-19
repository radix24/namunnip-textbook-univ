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

  /* 2. 치환과 제거의 경쟁: 기질 × 시약 × 온도 (화학2-05-03) */
  (() => {
    const S = QSim.card("lab-ch2-snse"); if (!S) return;
    const cv = S.$("canvas");
    const SUB = ["me", "p1", "p2", "p3"], SUBN = { me: "메틸", p1: "1차", p2: "2차", p3: "3차" };
    const REA = ["nuc", "base", "bulky", "weak"], REAN = { nuc: "친핵체만 강함 (I⁻, CN⁻, N₃⁻, RS⁻)", base: "강한 염기·친핵체 (OH⁻, EtO⁻)", bulky: "부피 큰 염기 (t-BuO⁻)", weak: "약한 친핵체·염기 (H₂O, EtOH)" };
    // [주경로 문자열, 이유] — 교재의 일반 규칙. 온도가 높으면 제거 쪽으로 기운다.
    function rule(s, r, hot) {
      if (s === "me") return r === "weak" ? ["거의 반응 없음", "메틸 양이온은 생기지 않고, 약한 친핵체로는 SN2도 매우 느리다"] : ["SN2", "β 수소가 없어 제거가 불가능하고, 입체 장애가 가장 작아 SN2가 빠르다"];
      if (s === "p1") {
        if (r === "bulky") return ["E2 (주) + SN2 (부)", "부피 큰 염기는 탄소 뒤쪽으로 다가가기 어려워 노출된 β 수소를 뗀다"];
        if (r === "weak") return ["거의 반응 없음", "1차 탄소 양이온은 너무 불안정해 SN1/E1이 일어나지 않는다"];
        if (r === "base") return [hot ? "SN2 (주) + E2 (늘어남)" : "SN2 (주)", "1차 탄소는 붐비지 않아 강한 염기라도 대부분 치환한다. 가열하면 E2가 늘어난다"];
        return ["SN2", "1차 탄소, 좋은 친핵체"];
      }
      if (s === "p2") {
        if (r === "nuc") return ["SN2", "약한 염기라 제거를 거의 하지 않고, 2차 탄소에서도 SN2가 가능하다 (비양성자성 용매가 유리)"];
        if (r === "base") return ["E2 (주) + SN2 (부)", "2차 탄소는 SN2가 느려지고 강한 염기는 β 수소를 떼기 쉽다" + (hot ? ". 가열로 E2가 더 늘어난다" : "")];
        if (r === "bulky") return ["E2", "부피 큰 염기, 덜 치환된 알켄(Hofmann)이 많아진다"];
        return [hot ? "E1 + SN1 (느림)" : "SN1 + E1 (느림)", "2차 탄소 양이온은 생기기는 하지만 느리다. 재배열에 주의"];
      }
      if (r === "nuc") return [hot ? "E1 + SN1" : "SN1 (주) + E1", "3차라 SN2는 불가능하다. 약한 염기이므로 탄소 양이온을 거치는 경로가 주가 된다"];
      if (r === "base" || r === "bulky") return ["E2", "3차 탄소는 SN2가 불가능하고 강한 염기는 β 수소를 뗀다" + (r === "bulky" ? " (Hofmann 생성물 증가)" : " (Zaitsev 생성물)")];
      return [hot ? "E1 (늘어남) + SN1" : "SN1 (주) + E1", "3차 탄소 양이온이 쉽게 생긴다. 온도가 높으면 엔트로피 때문에 제거가 늘어난다"];
    }
    function draw() {
      const c = C(), s = S.val("sub"), r = S.val("rea"), hot = S.val("hot");
      const v = QSim.view(cv, 0.62), g = v.g, W = v.W, H = v.H;
      const L = Math.min(110, W * 0.26), T = 30, cw = (W - L - 8) / 4, ch = (H - T - 8) / 4;
      g.font = "12px " + getComputedStyle(document.documentElement).getPropertyValue("--f-mono"); g.textAlign = "center"; g.textBaseline = "middle";
      const short = { nuc: "친핵체", base: "강염기", bulky: "부피 큰 염기", weak: "약한 친핵체" };
      REA.forEach((rr, j) => { g.fillStyle = c.ink2; g.fillText(short[rr], L + cw * (j + 0.5), T / 2); });
      SUB.forEach((ss, i) => {
        g.fillStyle = c.ink2; g.fillText(SUBN[ss], L / 2, T + ch * (i + 0.5));
        REA.forEach((rr, j) => {
          const [p] = rule(ss, rr, hot), x = L + cw * j, y = T + ch * i;
          const col = p.startsWith("SN2") ? "#4b4fe0" : p.startsWith("E2") ? RED : p.startsWith("SN1") ? GRN : p.startsWith("E1") ? "#9b59b6" : c.ink3;
          g.fillStyle = col; g.globalAlpha = (ss === s && rr === r) ? 0.9 : 0.25; g.fillRect(x + 2, y + 2, cw - 4, ch - 4); g.globalAlpha = 1;
          g.fillStyle = (ss === s && rr === r) ? "#fff" : c.ink; g.fillText(p.split(" ")[0], x + cw / 2, y + ch / 2);
        });
      });
      const [p, why] = rule(s, r, hot);
      S.out(`기질: ${SUBN[s]} 할로젠화 알킬 · 시약: ${REAN[r]} · ${hot ? "가열" : "실온"}\n예측되는 주경로: ${p}\n이유: ${why}\n(일반 규칙에 따른 예측이다. 실제 비율은 용매, 이탈기, 구체적 구조에 따라 달라진다.)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
