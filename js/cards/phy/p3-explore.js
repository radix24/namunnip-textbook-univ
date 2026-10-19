/* 물리3 탐구 카드: Bohr 모형의 에너지 준위와 선 스펙트럼 */
(() => {
  "use strict";
  const C = () => QSim.col();

  /* 1. 수소꼴 원자의 전이와 파장 (05-01) */
  (() => {
    const S = QSim.card("lab-p3-bohr"); if (!S) return;
    const cv = S.$("canvas");
    const RH = 1.09678e7;   // 수소의 Rydberg 상수 (m⁻¹, 환산 질량 포함)
    const SERIES = { 1: "Lyman 계열 (자외선)", 2: "Balmer 계열", 3: "Paschen 계열 (적외선)", 4: "Brackett 계열 (적외선)" };
    const color = (nm) => nm < 380 || nm > 750 ? null : nm < 450 ? "#7a4dff" : nm < 495 ? "#3d7cff" : nm < 570 ? "#2fbf5a" : nm < 590 ? "#e6c619" : nm < 620 ? "#ff8c1a" : "#e8322b";
    function draw() {
      const c = C(), Z = +S.val("Z"), nu = S.val("nu"), nl = S.val("nl");
      const v = QSim.view(cv, 0.55), W = v.W, H = v.H, g = v.g;
      const E = (n) => -13.6057 * Z * Z / (n * n), Emin = E(1), yE = (e) => 14 + (H - 70) * (e / Emin);
      g.font = "12px sans-serif";
      for (let n = 1; n <= 7; n++) { g.strokeStyle = c.ink3; g.lineWidth = 1; g.beginPath(); g.moveTo(20, yE(E(n))); g.lineTo(W * 0.42, yE(E(n))); g.stroke(); g.fillStyle = c.ink2; g.fillText(`n=${n}  ${E(n).toFixed(2)} eV`, W * 0.43, yE(E(n)) + 4); }
      const ok = nu > nl;
      if (ok) { const x = W * 0.25; g.strokeStyle = c.acc; g.lineWidth = 3; g.beginPath(); g.moveTo(x, yE(E(nu))); g.lineTo(x, yE(E(nl)) - 8); g.stroke(); g.fillStyle = c.acc; g.beginPath(); g.moveTo(x, yE(E(nl))); g.lineTo(x - 6, yE(E(nl)) - 10); g.lineTo(x + 6, yE(E(nl)) - 10); g.fill(); }
      // 아래: 파장 축 (로그, 50 nm ~ 5000 nm)
      const y0 = H - 26, X = (nm) => 20 + (W - 40) * Math.log(nm / 50) / Math.log(100);
      for (let nm = 380; nm <= 750; nm += 5) { g.fillStyle = color(nm); g.globalAlpha = 0.25; g.fillRect(X(nm), y0 - 12, X(nm + 5) - X(nm) + 1, 12); }
      g.globalAlpha = 1; g.strokeStyle = c.ink3; g.beginPath(); g.moveTo(20, y0); g.lineTo(W - 20, y0); g.stroke();
      [50, 100, 200, 500, 1000, 2000, 5000].forEach((nm) => { g.fillStyle = c.ink3; g.fillText(`${nm}`, X(nm) - 10, y0 + 14); });
      g.fillText("파장 (nm)", W - 70, y0 - 16);
      for (let n = nl + 1; n <= 12; n++) { const lam = 1e9 / (RH * Z * Z * (1 / (nl * nl) - 1 / (n * n))); if (lam < 50 || lam > 5000) continue; g.strokeStyle = n === nu ? (color(lam) || c.acc) : c.ink3; g.lineWidth = n === nu ? 3 : 1; g.beginPath(); g.moveTo(X(lam), y0 - 14); g.lineTo(X(lam), y0); g.stroke(); }
      if (!ok) { S.out("위 준위 nᵤ가 아래 준위 nₗ보다 커야 빛을 냅니다."); return; }
      const lam = 1e9 / (RH * Z * Z * (1 / (nl * nl) - 1 / (nu * nu))), dE = 1239.84 / lam;   // 광자 에너지 hc/λ (eV)
      S.out(`Z = ${Z}, ${nu} → ${nl} 전이: 광자 에너지 ${dE.toFixed(3)} eV\n파장 λ = ${lam.toFixed(1)} nm ${color(lam) ? "(가시광)" : lam < 380 ? "(자외선)" : "(적외선)"}${Z === 1 && SERIES[nl] ? `, ${SERIES[nl]}` : ""}\n아래 띠: 같은 아래 준위로 떨어지는 계열의 선들, 굵은 선이 고른 전이. 계열 한계 ${(1e9 / (RH * Z * Z / (nl * nl))).toFixed(1)} nm`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
