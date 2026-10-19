/* 화학과 유기화학 탐구 카드 묶음 (화학2 유기화학1)
   Newman 투영과 회전 에너지, 입체 중심을 돌려 보며 R/S 정하기 */
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

  /* 2. 입체 중심을 돌려 보며 R/S 정하기 (화학2-04-01, 04-02) */
  (() => {
    const S = QSim.card("lab-ch2-rs"); if (!S) return;
    const cv = S.$("canvas");
    cv.style.touchAction = "none"; cv.style.cursor = "grab";
    const ATOM = { Br: "#9c4a2a", Cl: "#2f8f5b", F: "#7fb069", O: "#d0453b", N: "#3d6fd6", C: "#4a4d5a", H: "#c9cbd3" };
    // 치환기: [표시 이름, 결합한 원자, 순위를 정하는 근거]. 배열 순서가 CIP 순위 1 → 4
    const MOL = {
      brbut: { n: "2-브로모뷰테인", cfg: "R", sub: [["Br", "Br", "원자 번호 35"], ["CH₂CH₃", "C", "C에 (C, H, H)"], ["CH₃", "C", "C에 (H, H, H)"], ["H", "H", "원자 번호 1"]] },
      ala: { n: "L-알라닌", cfg: "S", sub: [["NH₂", "N", "원자 번호 7"], ["COOH", "C", "C에 (O, O, O): 이중 결합 O는 두 번 센다"], ["CH₃", "C", "C에 (H, H, H)"], ["H", "H", "원자 번호 1"]] },
      glyc: { n: "D-글리세르알데하이드", cfg: "R", sub: [["OH", "O", "원자 번호 8"], ["CHO", "C", "C에 (O, O, H)"], ["CH₂OH", "C", "C에 (O, H, H)"], ["H", "H", "원자 번호 1"]] },
      halo: { n: "브로모클로로플루오로메테인", cfg: "S", sub: [["Br", "Br", "원자 번호 35"], ["Cl", "Cl", "원자 번호 17"], ["F", "F", "원자 번호 9"], ["H", "H", "원자 번호 1"]] }
    };
    const k3 = 1 / Math.sqrt(3);
    const A = [k3, k3, k3], B = [k3, -k3, -k3], Cc = [-k3, k3, -k3], D = [-k3, -k3, k3];
    // 1 = A, 4 = D로 두면 2 = B, 3 = C일 때 S, 2 = C, 3 = B일 때 R이다 ((v1×v2)·v3 > 0이면 S)
    const place = (cfg, mirror) => {
      const P = cfg === "R" ? [A, Cc, B, D] : [A, B, Cc, D];
      return mirror ? P.map(([x, y, z]) => [-x, y, z]) : P;
    };
    const rot = (p, yaw, pitch) => {
      const a = yaw * Math.PI / 180, b = pitch * Math.PI / 180;
      const x1 = p[0] * Math.cos(a) + p[2] * Math.sin(a), z1 = -p[0] * Math.sin(a) + p[2] * Math.cos(a);
      return [x1, p[1] * Math.cos(b) - z1 * Math.sin(b), p[1] * Math.sin(b) + z1 * Math.cos(b)];
    };
    const setAng = (yaw, pitch) => {
      S.$('[name="yaw"]').value = Math.round(((yaw % 360) + 360) % 360);
      S.$('[name="pitch"]').value = Math.round(Math.max(-90, Math.min(90, pitch)));
      S.show();
    };
    function draw() {
      const c = C(), m = MOL[S.val("mol")], mirror = S.val("mirror"), yaw = S.val("yaw"), pitch = S.val("pitch");
      const cfg = mirror ? (m.cfg === "R" ? "S" : "R") : m.cfg;
      const P = place(m.cfg, mirror).map((p) => rot(p, yaw, pitch));
      const v = QSim.view(cv, 0.72), g = v.g, W = v.W, H = v.H, cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.34;
      const scr = (p) => { const s = 3 / (3 - p[2]); return [cx + R * p[0] * s, cy - R * p[1] * s, s]; };
      const font = getComputedStyle(document.documentElement).getPropertyValue("--f-mono");
      const items = P.map((p, i) => ({ i, z: p[2], p })).concat([{ i: -1, z: 0 }]).sort((a, b) => a.z - b.z);
      items.forEach((it) => {
        if (it.i < 0) { g.fillStyle = ATOM.C; g.beginPath(); g.arc(cx, cy, R * 0.13, 0, 7); g.fill(); g.fillStyle = "#fff"; g.font = "bold 12px " + font; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("C*", cx, cy); return; }
        const [x, y, s] = scr(it.p), [lab, at] = m.sub[it.i], fade = it.z < -0.2 ? 0.55 : 1;
        g.globalAlpha = fade;
        g.strokeStyle = c.ink3; g.lineWidth = 3 + 3 * Math.max(0, it.z); g.beginPath(); g.moveTo(cx, cy); g.lineTo(x, y); g.stroke();
        const r = R * (at === "H" ? 0.12 : 0.17) * s;
        g.fillStyle = ATOM[at]; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
        g.strokeStyle = c.card; g.lineWidth = 1.5; g.stroke();
        g.fillStyle = c.ink; g.font = "13px " + font; g.textAlign = "center"; g.textBaseline = "middle";
        const ox = (x - cx), oy = (y - cy), L = Math.hypot(ox, oy) || 1;
        g.fillText(lab, x + ox / L * (r + 22), y + oy / L * (r + 12));
        g.fillStyle = at === "H" ? "#222" : "#fff"; g.font = "bold 12px " + font; g.fillText(String(it.i + 1), x, y);
        g.globalAlpha = 1;
      });
      const Q = P.map(scr);
      // 화면에서 1 → 2 → 3이 도는 방향 (화면 y는 아래로 커지므로 부호를 뒤집는다)
      const area = (Q[1][0] - Q[0][0]) * (Q[2][1] - Q[0][1]) - (Q[1][1] - Q[0][1]) * (Q[2][0] - Q[0][0]);
      const cw = area > 0, z4 = P[3][2];
      if (S.val("arrow")) {
        // 입체 중심 둘레의 원호로 1 → 2, 2 → 3을 잇는다. 도는 방향(시계/반시계)을 따라가므로 다른 치환기를 지나지 않는다
        const th = Q.map(([x, y]) => Math.atan2(y - cy, x - cx)), rA = R * 0.62;
        g.strokeStyle = c.warn; g.fillStyle = c.warn; g.lineWidth = 2.2;
        for (let k2 = 0; k2 < 2; k2++) {
          const a0 = th[k2] + (cw ? 0.18 : -0.18), a1 = th[k2 + 1] - (cw ? 0.18 : -0.18);
          g.beginPath(); g.arc(cx, cy, rA, a0, a1, !cw); g.stroke();
          const ex = cx + rA * Math.cos(a1), ey = cy + rA * Math.sin(a1), ang = a1 + (cw ? Math.PI / 2 : -Math.PI / 2);
          g.beginPath(); g.moveTo(ex + 3 * Math.cos(ang), ey + 3 * Math.sin(ang)); g.lineTo(ex - 9 * Math.cos(ang - 0.45), ey - 9 * Math.sin(ang - 0.45)); g.lineTo(ex - 9 * Math.cos(ang + 0.45), ey - 9 * Math.sin(ang + 0.45)); g.closePath(); g.fill();
        }
      }
      const where = z4 < -0.5 ? "화면 안쪽(뒤)" : z4 > 0.5 ? "화면 바깥쪽(앞)" : "거의 옆";
      let read;
      if (z4 < -0.5) read = `4순위가 뒤에 있으므로 보이는 방향을 그대로 읽습니다: ${cw ? "시계 방향 → R" : "반시계 방향 → S"}`;
      else if (z4 > 0.5) read = `4순위가 앞에 있으므로 보이는 방향의 반대로 읽습니다: ${cw ? "시계 방향으로 보이니 S" : "반시계 방향으로 보이니 R"}`;
      else read = "4순위가 옆을 향해 이 각도에서는 읽기 어렵습니다. 분자를 돌리거나 \"4순위를 뒤로\"를 누르세요";
      S.out(`${m.n}${mirror ? "의 거울상" : ""}\n순위: ` + m.sub.map((sb, i) => `${i + 1} ${sb[0]} (${sb[2]})`).join(" > ")
        + `\n지금 화면: 4순위 ${m.sub[3][0]}이(가) ${where}, 1 → 2 → 3은 ${cw ? "시계" : "반시계"} 방향으로 보임\n${read}`
        + (S.val("ans") ? `\n정답: 이 분자는 ${cfg} 배열입니다. 어떤 각도에서 읽어도 같은 답이 나와야 합니다` : ""));
    }
    let drag = null;
    cv.addEventListener("pointerdown", (e) => { drag = [e.clientX, e.clientY, S.val("yaw"), S.val("pitch")]; cv.setPointerCapture(e.pointerId); cv.style.cursor = "grabbing"; });
    cv.addEventListener("pointermove", (e) => { if (!drag) return; setAng(drag[2] + (e.clientX - drag[0]) * 0.7, drag[3] + (e.clientY - drag[1]) * 0.7); draw(); });
    const end = () => { drag = null; cv.style.cursor = "grab"; };
    cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
    S.$(".back4").addEventListener("click", () => {
      const p4 = place(MOL[S.val("mol")].cfg, S.val("mirror"))[3];
      let best = [0, 0, 9];
      for (let a = 0; a < 360; a += 1) for (let b = -90; b <= 90; b += 1) { const q = rot(p4, a, b), d = q[0] ** 2 + q[1] ** 2 + (q[2] + 1) ** 2; if (d < best[2]) best = [a, b, d]; }
      setAng(best[0], best[1]); draw();
    });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
