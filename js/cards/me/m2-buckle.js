/* 기계2 고체역학 8단원: 끝단 조건과 세장비에 따른 좌굴 (08-01) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-buckle"); if (!S) return;
  const [c1, c2] = S.$$("canvas");
  const K = { pp: 1, ff: 2, fp: 0.699, xx: 0.5 };
  const NAME = { pp: "양 끝 핀", ff: "고정-자유", fp: "고정-핀", xx: "양 끝 고정" };
  const MAT = { steel: { E: 200000, sy: 250, n: "구조용 강" }, al: { E: 70000, sy: 270, n: "알루미늄 합금" }, wood: { E: 11000, sy: 40, n: "나무(압축)" } };
  // 좌굴 모양 v(s), s = 0(아래) ~ 1(위)
  // 고정-핀은 아래 고정(s = 0), 위 핀(s = 1): v = sin ks − k cos ks + k − ks, tan k = k (k = 4.4934)
  const KFP = 4.4934;
  const shape = (e, s) => e === "pp" ? Math.sin(Math.PI * s) : e === "ff" ? 1 - Math.cos((Math.PI * s) / 2)
    : e === "xx" ? (1 - Math.cos(2 * Math.PI * s)) / 2
    : Math.sin(KFP * s) - KFP * Math.cos(KFP * s) + KFP - KFP * s;
  function draw() {
    const c = QSim.col(), e = S.val("end"), m = MAT[S.val("mat")], L = S.val("L") * 1000, d = S.val("d"), P = S.val("P") * 1000;
    const I = Math.PI * d ** 4 / 64, A = Math.PI * d * d / 4, r = d / 4, Le = K[e] * L, lam = Le / r;
    const Pcr = Math.PI ** 2 * m.E * I / Le ** 2, scr = Pcr / A, lamC = Math.PI * Math.sqrt(m.E / m.sy);
    const Pfail = Math.min(Pcr, m.sy * A), mode = Pcr < m.sy * A ? "좌굴(Euler)" : "항복(짧은 기둥)";
    // 기둥 그림
    let v = QSim.view(c1, 0.75), g = v.g, W = v.W, H = v.H, x0 = W * 0.3, top = 26, bot = H - 26;
    const amp = P >= Pfail ? Math.min(1, 0.25 + 0.5 * (P / Pfail - 1)) * W * 0.12 : 0;
    const pts = []; let mx = 1e-9; const raw = [];
    for (let i = 0; i <= 60; i++) { const y = shape(e, i / 60); raw.push(y); mx = Math.max(mx, Math.abs(y)); }
    raw.forEach((y, i) => pts.push([x0 + amp * (y / mx), bot - (i / 60) * (bot - top)]));
    g.strokeStyle = c.ink3; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(x0, top); g.lineTo(x0, bot); g.stroke(); g.setLineDash([]);
    g.strokeStyle = P >= Pfail ? c.warn : c.main; g.lineWidth = 5; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); g.lineWidth = 1;
    g.fillStyle = c.ink3;
    const fixedEnd = (y, up) => { g.fillRect(x0 - 22, up ? y - 8 : y, 44, 8); };
    const pin = (y, up) => { g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 - 9, y + (up ? -14 : 14)); g.lineTo(x0 + 9, y + (up ? -14 : 14)); g.fill(); };
    if (e === "pp") { pin(bot, false); pin(top, true); } else if (e === "ff") fixedEnd(bot, false); else if (e === "fp") { fixedEnd(bot, false); pin(top, true); } else { fixedEnd(bot, false); fixedEnd(top, true); }
    g.strokeStyle = g.fillStyle = c.acc; g.lineWidth = 2; g.beginPath(); g.moveTo(x0 + (e === "ff" ? amp : 0), 4); g.lineTo(x0 + (e === "ff" ? amp : 0), top - 4); g.stroke(); g.lineWidth = 1;
    g.font = "12px " + getComputedStyle(document.documentElement).getPropertyValue("--f-mono"); g.fillStyle = c.ink2;
    g.fillText(NAME[e] + `, K = ${K[e]}`, W * 0.5, top + 14); g.fillText(`P = ${(P / 1000).toFixed(1)} kN`, W * 0.5, top + 32);
    g.fillText(P >= Pfail ? `${mode}: 무너짐` : `견딤 (P/P_한계 = ${(P / Pfail).toFixed(2)})`, W * 0.5, top + 50);
    // σ_cr - 세장비 곡선
    v = QSim.view(c2, 0.5); const f = QSim.frame(v, { x0: 0, x1: 300, y0: 0, y1: m.sy * 1.6, xl: "KL/r", yl: "σ (MPa)", pad: 36 }); f.axes();
    f.fn((l) => Math.min(m.sy * 1.6, Math.PI ** 2 * m.E / (l * l)), c.ink3, 1.5, [5, 4]);
    f.path([[0, m.sy], [lamC, m.sy]], c.acc, 2); f.fn((l) => (l >= lamC ? Math.PI ** 2 * m.E / (l * l) : NaN), c.main, 2.5);
    f.dot(Math.min(lam, 300), Math.min(scr, m.sy), c.warn, 5);
    S.out(`${m.n}: E = ${m.E / 1000} GPa, σY = ${m.sy} MPa, 경계 세장비 π√(E/σY) = ${lamC.toFixed(0)}\n지름 ${d} mm: I = ${I.toFixed(0)} mm⁴, r = d/4 = ${r.toFixed(2)} mm, 유효 길이 KL = ${(Le / 1000).toFixed(2)} m, 세장비 ${lam.toFixed(0)}\nEuler 하중 P_cr = ${(Pcr / 1000).toFixed(2)} kN (σ_cr = ${scr.toFixed(1)} MPa), 항복 하중 σY·A = ${(m.sy * A / 1000).toFixed(1)} kN → 한계 ${(Pfail / 1000).toFixed(2)} kN, ${mode}`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();
