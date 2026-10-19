/* 공통5 실습 카드 묶음: 전자 배치, VSEPR 모양, 기체 분자 운동 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
  const sup = (n) => String(n).split("").map((d) => SUP[+d]).join("");
  const SUB = "₀₁₂₃₄₅₆₇₈₉";
  const sub = (s) => s.replace(/([A-Za-z)])(\d+)/g, (_, a, n) => a + n.split("").map((d) => SUB[+d]).join(""));

  /* 2. 전자 배치와 오비탈 채우기 (06-04) */
  (() => {
    const S = QSim.card("lab-c5-config"); if (!S) return;
    const cv = S.$("canvas");
    const SYM = "H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr".split(" ");
    const ORD = [["1s", 1], ["2s", 1], ["2p", 3], ["3s", 1], ["3p", 3], ["4s", 1], ["3d", 5], ["4p", 3]];
    const COLX = { s: 0, p: 1, d: 2 };
    function fill(Z) {
      let left = Z; const e = ORD.map(([, m]) => { const k = Math.min(left, 2 * m); left -= k; return k; });
      if (Z === 24) { e[5] = 1; e[6] = 5; }
      if (Z === 29) { e[5] = 1; e[6] = 10; }
      return e;
    }
    function draw() {
      const c = C(), Z = S.val("z"), e = fill(Z);
      const v = QSim.view(cv, 0.62), g = v.g, bx = Math.min(30, v.W / 22), gap = v.H / (ORD.length + 1);
      g.font = "12px " + getComputedStyle(document.documentElement).getPropertyValue("--f-mono");
      let unp = 0;
      ORD.forEach(([n, m], i) => {
        const x0 = 46 + COLX[n[1]] * (v.W - 60) / 3, y = v.H - gap * (i + 0.8);
        g.fillStyle = c.ink2; g.fillText(n, x0 - 30, y + bx * 0.6);
        const k = e[i];
        for (let j = 0; j < m; j++) {
          const x = x0 + j * (bx + 3);
          g.strokeStyle = k ? c.main : c.rule; g.lineWidth = 1.5; g.strokeRect(x, y, bx, bx);
          const up = k > j, dn = k > m + j;
          g.strokeStyle = c.ink; g.lineWidth = 2;
          if (up) { g.beginPath(); g.moveTo(x + bx * 0.35, y + bx * 0.85); g.lineTo(x + bx * 0.35, y + bx * 0.15); g.lineTo(x + bx * 0.22, y + bx * 0.32); g.stroke(); }
          if (dn) { g.beginPath(); g.moveTo(x + bx * 0.65, y + bx * 0.15); g.lineTo(x + bx * 0.65, y + bx * 0.85); g.lineTo(x + bx * 0.78, y + bx * 0.68); g.stroke(); }
          if (up && !dn) unp++;
        }
      });
      g.fillStyle = c.ink3; g.fillText("에너지 ↑ (채우는 순서)", 4, 14);
      const cfg = ORD.map(([n], i) => (e[i] ? n + sup(e[i]) : "")).filter(Boolean).join(" ");
      const core = Z > 18 ? 18 : Z > 10 ? 10 : Z > 2 ? 2 : 0, cs = { 18: "[Ar]", 10: "[Ne]", 2: "[He]" }[core];
      let k = core; const short = ORD.map(([n], i) => { const t = e[i]; const take = Math.min(t, k); k -= take; return t - take ? n + sup(t - take) : ""; }).filter(Boolean).join(" ");
      const note = Z === 24 || Z === 29 ? "\n예외: 반만 찬 3d⁵, 꽉 찬 3d¹⁰이 특별히 안정해서 4s 전자 하나가 3d로 간다" : "";
      S.out(`Z = ${Z} ${SYM[Z - 1]}\n${cfg}${cs && Z !== core ? "\n= " + cs + " " + short : ""}\n홀전자 ${unp}개 → ${unp ? "상자성" : "반자성"}${note}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. VSEPR 모양 (09-01) */
  (() => {
    const S = QSim.card("lab-c5-vsepr"); if (!S) return;
    const cv = S.$("canvas");
    const r3 = Math.sqrt(8 / 9), c120 = -0.5, s120 = Math.sqrt(3) / 2;
    // 전자 영역 자리. 앞쪽부터 비공유 전자쌍이 차지한다
    const POS = {
      2: [[1, 0, 0], [-1, 0, 0]],
      3: [[0, 1, 0], [s120, c120, 0], [-s120, c120, 0]],
      4: [[0, 1, 0], [r3, -1 / 3, 0], [r3 * c120, -1 / 3, r3 * s120], [r3 * c120, -1 / 3, -r3 * s120]],
      5: [[1, 0, 0], [c120, 0, s120], [c120, 0, -s120], [0, 1, 0], [0, -1, 0]],
      6: [[0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]]
    };
    const T = {
      "2,0": ["직선형", "직선형", "180°", "CO2"], "3,0": ["평면 삼각형", "평면 삼각형", "120°", "BF3"], "2,1": ["평면 삼각형", "굽은형", "120°보다 조금 작음", "SO2"],
      "4,0": ["사면체", "사면체", "109.5°", "CH4"], "3,1": ["사면체", "삼각뿔", "약 107°", "NH3"], "2,2": ["사면체", "굽은형", "약 104.5°", "H2O"],
      "5,0": ["삼각쌍뿔", "삼각쌍뿔", "90°, 120°", "PCl5"], "4,1": ["삼각쌍뿔", "시소형", "90°, 120°보다 조금 작음", "SF4"], "3,2": ["삼각쌍뿔", "T자형", "90°보다 조금 작음", "ClF3"], "2,3": ["삼각쌍뿔", "직선형", "180°", "XeF2"],
      "6,0": ["팔면체", "팔면체", "90°", "SF6"], "5,1": ["팔면체", "사각뿔", "90°보다 조금 작음", "BrF5"], "4,2": ["팔면체", "평면 사각형", "90°", "XeF4"]
    };
    let th = 0.6;
    function draw() {
      const c = C(), b = S.val("bp"), l = S.val("lp"), key = b + "," + l, row = T[key];
      const v = QSim.view(cv, 0.6), g = v.g, cx = v.W / 2, cy = v.H / 2, R = Math.min(v.W, v.H) * 0.36;
      if (!row) { S.out(`결합 전자쌍 ${b}, 비공유 전자쌍 ${l}: 이 조합(전자 영역 ${b + l}개)은 이 카드에서 다루지 않습니다. 전자 영역 2~6개만 고르세요.`); return; }
      const tilt = 0.35, ct = Math.cos(th), st = Math.sin(th), ca = Math.cos(tilt), sa = Math.sin(tilt);
      const P = (p) => { const x = p[0] * ct - p[2] * st, z = p[0] * st + p[2] * ct, y = p[1] * ca - z * sa, zz = p[1] * sa + z * ca; return [cx + R * x, cy - R * y, zz]; };
      const items = POS[b + l].map((p, i) => ({ p, lone: i < l, s: P(p) }));
      items.sort((u, w) => u.s[2] - w.s[2]);
      const center = () => { g.fillStyle = c.ink; g.beginPath(); g.arc(cx, cy, 13, 0, 7); g.fill(); g.fillStyle = c.card; g.font = "bold 12px sans-serif"; g.textAlign = "center"; g.fillText("A", cx, cy + 4); g.textAlign = "left"; };
      let drawn = false;
      items.forEach((it) => {
        if (!drawn && it.s[2] > 0) { center(); drawn = true; }
        const [x, y, z] = it.s, sh = 0.75 + 0.25 * z;
        if (it.lone) {
          const lx = cx + (x - cx) * 0.62, ly = cy + (y - cy) * 0.62, a = Math.atan2(ly - cy, lx - cx);
          g.save(); g.globalAlpha = 0.55; g.fillStyle = c.acc; g.beginPath(); g.ellipse(lx, ly, R * 0.3, R * 0.17, a, 0, 7); g.fill(); g.restore();
          g.fillStyle = c.ink; [-1, 1].forEach((k) => { g.beginPath(); g.arc(lx + k * 4 * Math.sin(a), ly - k * 4 * Math.cos(a), 2.5, 0, 7); g.fill(); });
        } else {
          g.strokeStyle = c.ink2; g.lineWidth = 4; g.beginPath(); g.moveTo(cx, cy); g.lineTo(x, y); g.stroke();
          g.fillStyle = c.main; g.globalAlpha = sh; g.beginPath(); g.arc(x, y, 10 * sh + 2, 0, 7); g.fill(); g.globalAlpha = 1;
        }
      });
      if (!drawn) center();
      S.out(`전자 영역 ${b + l}개 (결합 ${b}, 비공유 ${l})\n전자 영역 배치: ${row[0]} → 분자 모양: ${row[1]}\n결합각: ${row[2]}   예: ${sub(row[3])}${l ? "\n주황: 비공유 전자쌍. 결합 전자쌍보다 넓게 퍼져 다른 쌍을 밀어낸다" : ""}`);
    }
    const L = QSim.loop((dt) => { th += dt * 0.8; draw(); }).watch(S.root);
    QSim.playButton(S.$(".play"), L);
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 기체 분자 운동과 맥스웰 분포 (10-02) */
  (() => {
    const S = QSim.card("lab-c5-gas"); if (!S) return;
    const [cvB, cvH] = S.$$("canvas");
    const M = { He: 0.004003, N2: 0.02802, CO2: 0.04401 }, Rg = 8.314, N = 120, AR = 0.55, FW = 1 / AR, VS = 1 / 1000;
    let pts = [], cur = null, hits = [], t = 0;
    const gauss = () => { let u = 0; while (!u) u = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random()); };
    const width = () => FW * S.val("V") / 50;
    function reset() {
      const T = S.val("T"), m = M[S.val("gas")], s = Math.sqrt(Rg * T / m), w = width();
      pts = Array.from({ length: N }, () => { const sp = s * Math.hypot(gauss(), gauss(), gauss()), a = 2 * Math.PI * Math.random(); return { x: Math.random() * w, y: Math.random(), vx: sp * Math.cos(a), vy: sp * Math.sin(a) }; });
      cur = T / m; hits = []; t = 0;
    }
    function rescale() {
      const k = S.val("T") / M[S.val("gas")], f = Math.sqrt(k / cur), w = width();
      pts.forEach((p) => { p.vx *= f; p.vy *= f; if (p.x > w) p.x = Math.random() * w; });
      cur = k; hits = []; t = 0;
    }
    function step(dt) {
      const w = width(); t += dt; let h = 0;
      pts.forEach((p) => {
        p.x += p.vx * VS * dt; p.y += p.vy * VS * dt;
        if (p.x < 0) { p.x = -p.x; p.vx = -p.vx; h++; } if (p.x > w) { p.x = 2 * w - p.x; p.vx = -p.vx; h++; }
        if (p.y < 0) { p.y = -p.y; p.vy = -p.vy; h++; } if (p.y > 1) { p.y = 2 - p.y; p.vy = -p.vy; h++; }
      });
      hits.push([t, h]); while (hits.length && hits[0][0] < t - 2) hits.shift();
      draw();
    }
    function draw() {
      const c = C(), T = S.val("T"), gas = S.val("gas"), m = M[gas], V = S.val("V"), w = width();
      const vb = QSim.view(cvB, AR), g = vb.g, sc = vb.H;
      g.fillStyle = c.rule; g.fillRect(w * sc, 0, vb.W - w * sc, vb.H);
      g.strokeStyle = c.ink2; g.lineWidth = 2; g.strokeRect(1, 1, w * sc - 2, vb.H - 2);
      g.fillStyle = c.main; pts.forEach((p) => { g.beginPath(); g.arc(p.x * sc, p.y * sc, gas === "He" ? 2.5 : gas === "N2" ? 3.5 : 4.2, 0, 7); g.fill(); });
      const vh = QSim.view(cvH, 0.42), vmax = 2500, bw = 100, a = m / (2 * Rg * T);
      const MB = (u) => 4 * Math.PI * Math.pow(a / Math.PI, 1.5) * u * u * Math.exp(-a * u * u);
      const peak = MB(Math.sqrt(1 / a)), cnt = Array(vmax / bw).fill(0);
      pts.forEach((p) => { const i = Math.floor(Math.hypot(p.vx, p.vy) / bw); if (i < cnt.length) cnt[i]++; });
      const top = Math.max(peak * 1.5, ...cnt.map((k) => k / (N * bw)) ) * 1.05;
      const f = QSim.frame(vh, { x0: 0, x1: vmax, y0: 0, y1: top * 1e3, xl: "속력 (m/s)", yl: "비율" }); f.axes({ noGrid: true });
      const gh = vh.g; cnt.forEach((k, i) => { const y = k / (N * bw) * 1e3; gh.fillStyle = c.soft; gh.fillRect(f.X(i * bw), f.Y(y), f.sx * bw - 1, f.Y(0) - f.Y(y)); });
      f.fn((u) => MB(u) * 1e3, c.warn, 2);
      const vrms = Math.sqrt(3 * Rg * T / m), vmean = Math.sqrt(8 * Rg * T / (Math.PI * m)), vp = Math.sqrt(2 * Rg * T / m);
      const rate = hits.length > 1 ? hits.reduce((s, x) => s + x[1], 0) / Math.max(0.1, hits[hits.length - 1][0] - hits[0][0]) : 0;
      S.out(`${sub(gas)} 1 mol, ${T} K, ${V} L → P = nRT/V = ${(0.08206 * T / V).toFixed(2)} atm\n최빈 속력 ${vp.toFixed(0)}, 평균 속력 ${vmean.toFixed(0)}, 제곱 평균 제곱근 속력 ${vrms.toFixed(0)} m/s\n평균 운동 에너지 (3/2)RT = ${(1.5 * Rg * T / 1000).toFixed(2)} kJ/mol (기체 종류와 무관)${rate ? "\n벽 충돌 " + rate.toFixed(0) + "회/초 (화면 속 상대값)" : ""}`);
    }
    reset();
    const L = QSim.loop(step).watch(S.root);
    QSim.playButton(S.$(".play"), L);
    S.$$("input, select").forEach((e) => e.addEventListener("input", () => { S.show(); rescale(); draw(); }));
    S.show(); QSim.redrawOn(draw); draw();
  })();
})();
