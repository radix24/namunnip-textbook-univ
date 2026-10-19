/* 화학과 무기화학실험 실습 카드 묶음 (화학11)
   양자점 크기와 색(Brus 식), 분말 X선 회절 무늬 맞추기(입방 격자, Scherrer 식) */
(() => {
  "use strict";
  const C = () => QSim.col();
  const h = 6.62607e-34, me = 9.10938e-31, qe = 1.602177e-19, e0 = 8.854188e-12;
  const RED = "#b5562a";
  const wl2rgb = (nm) => {   // 대략적인 스펙트럼 색 (빛 자체의 색)
    let r = 0, g = 0, b = 0;
    if (nm < 380 || nm > 750) return "rgb(128,128,128)";
    if (nm < 440) { r = (440 - nm) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; } else if (nm < 510) { g = 1; b = (510 - nm) / 20; }
    else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = (645 - nm) / 65; } else r = 1;
    return `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`;
  };

  /* 1. 양자점의 크기와 흡수 색 (화학11-02-03) */
  (() => {
    const S = QSim.card("lab-ch11-qdot"); if (!S) return;
    const cv = S.$("canvas");
    const Eg = 1.74, mE = 0.13, mH = 0.45, eps = 10.6;   // CdSe 덩어리 띠 간격(eV), 유효 질량(전자 질량 단위), 유전 상수
    const terms = (R) => {
      const r = R * 1e-9;
      const conf = h * h / (8 * r * r) * (1 / (mE * me) + 1 / (mH * me)) / qe;
      const coul = 1.8 * qe / (4 * Math.PI * eps * e0 * r);
      return { conf, coul };
    };
    function draw() {
      const c = C(), R = S.val("R"), useC = S.val("coul") === "on";
      const E = (x) => { const t = terms(x); return Eg + t.conf - (useC ? t.coul : 0); };
      const t = terms(R), Er = E(R), lam = 1239.84 / Er;
      const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: 1, x1: 5, y0: 1.5, y1: 3.6, xl: "양자점 반지름 R (nm)", yl: "띠 간격 E (eV)", pad: 44 }); f.axes();
      f.fn((x) => Eg, c.ink3, 1, [4, 4]); f.text("덩어리 CdSe 1.74 eV", 3.6, Eg + 0.06, c.ink2);
      f.fn(E, c.main, 2.5); f.dot(R, Er, RED, 5.5);
      const g = v.g; g.fillStyle = wl2rgb(lam);
      g.fillRect(f.X(3.7), f.Y(3.45), f.X(4.8) - f.X(3.7), f.Y(2.95) - f.Y(3.45));
      f.text("흡수 끝의 빛", 4.25, 3.52, c.ink2, "center");
      S.out(`R = ${R.toFixed(1)} nm (지름 ${(2 * R).toFixed(1)} nm)\n갇힘 항 h²/(8R²)·(1/mₑ + 1/m_h) = +${t.conf.toFixed(3)} eV, 쿨롱 항 = ${useC ? "−" + t.coul.toFixed(3) : "0 (끔)"} eV\nE = 1.74 + ${t.conf.toFixed(3)}${useC ? " − " + t.coul.toFixed(3) : ""} = ${Er.toFixed(3)} eV → 흡수 끝 λ = 1239.8/E = ${lam.toFixed(0)} nm\n이보다 짧은 파장의 빛을 흡수하므로, 용액은 흡수되지 않고 남은 빛의 색으로 보입니다.`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 분말 X선 회절 무늬 맞추기 (화학11-03-03) */
  (() => {
    const S = QSim.card("lab-ch11-pxrd"); if (!S) return;
    const cv = S.$("canvas");
    const LAM = 1.5406;   // Cu Kα (Å)
    const ok = { SC: () => true, BCC: (a, b, c) => (a + b + c) % 2 === 0, FCC: (a, b, c) => a % 2 === b % 2 && b % 2 === c % 2 };
    const NAME = { SC: "단순 입방", BCC: "체심 입방", FCC: "면심 입방" };
    function peaks(lat, a) {
      const seen = new Map();
      for (let H = 1; H <= 4; H++) for (let K = 0; K <= H; K++) for (let L = 0; L <= K; L++) {
        if (!ok[lat](H, K, L)) continue;
        const s = H * H + K * K + L * L; if (seen.has(s)) continue;
        const d = a / Math.sqrt(s), x = LAM / (2 * d); if (x >= 1) continue;
        const tt = 2 * Math.asin(x) * 180 / Math.PI;
        if (tt >= 20 && tt <= 80) seen.set(s, { hkl: `${H}${K}${L}`, s, d, tt });
      }
      return [...seen.values()].sort((p, q) => p.tt - q.tt);
    }
    const OBS = peaks("FCC", 5.64).map((p) => p.tt);   // 가상 측정 무늬: 미지 시료(봉우리 위치만)
    function draw() {
      const c = C(), lat = S.val("lat"), a = S.val("a"), w = S.val("w");
      const P = peaks(lat, a), sg = w / 2.3548;
      const prof = (x) => P.reduce((s, p) => s + Math.exp(-((x - p.tt) ** 2) / (2 * sg * sg)), 0);
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 20, x1: 80, y0: 0, y1: 1.6, xl: "2θ (도)", yl: "세기 (상대)", pad: 40 }); f.axes();
      OBS.forEach((x) => f.path([[x, 1.25], [x, 1.5]], RED, 3));
      f.text("측정 봉우리", 21, 1.53, RED);
      f.fn(prof, c.main, 2);
      const match = OBS.filter((x) => P.some((p) => Math.abs(p.tt - x) < 0.15)).length;
      const extra = P.filter((p) => !OBS.some((x) => Math.abs(p.tt - x) < 0.15)).length;
      const p0 = P[0], D = p0 ? 0.9 * LAM / 10 / (w * Math.PI / 180 * Math.cos(p0.tt / 2 * Math.PI / 180)) : NaN;
      const list = P.slice(0, 5).map((p) => `(${p.hkl}) d = ${p.d.toFixed(3)} Å, 2θ = ${p.tt.toFixed(2)}°`).join("\n");
      S.out(`${NAME[lat]}, a = ${a.toFixed(2)} Å, Cu Kα λ = 1.5406 Å · 계산 봉우리 ${P.length}개 (20~80°)\n${list}\n측정 봉우리 ${OBS.length}개 가운데 ${match}개가 ±0.15° 안에서 맞음, 측정에 없는 계산 봉우리 ${extra}개\nScherrer 결정 크기 (첫 봉우리, 반치폭 ${w.toFixed(2)}°): D = 0.9λ/(β cos θ) = ${D.toFixed(1)} nm`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
