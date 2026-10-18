/* 공통4 실습: 광전 효과 (12-03). hc = 1239.8 eV·nm */
(() => {
  "use strict";
  const S = QSim.card("lab-c4-photo"); if (!S) return;
  const [c1, c2] = S.$$("canvas"), HC = 1239.8;
  const WF = { cs: [2.1, "세슘"], na: [2.28, "나트륨"], zn: [4.3, "아연"], cu: [4.7, "구리"] };
  let ph = [], el = [], acc = 0;
  const rgb = (nm) => nm < 380 ? "#9b59ff" : nm < 450 ? "#7a5cff" : nm < 495 ? "#3b8cff" : nm < 570 ? "#27b04a" : nm < 590 ? "#e1c400" : nm < 620 ? "#ff8c1a" : "#e8402a";
  function draw() {
    const C = QSim.col(), lam = S.val("lam"), [phi, name] = WF[S.val("metal")], E = HC / lam, K = E - phi;
    let v = QSim.view(c1, 0.45), f = QSim.frame(v, { x0: 0, x1: 10, y0: 0, y1: 4.5, pad: 4 }), g = v.g;
    g.fillStyle = C.ink3; g.fillRect(f.X(7), f.Y(4), f.X(7.5) - f.X(7), f.Y(0.5) - f.Y(4)); f.text(name, 6.4, 0.15, C.ink2);
    ph.forEach((p) => { g.strokeStyle = rgb(lam); g.lineWidth = 2; g.beginPath(); for (let k = 0; k < 12; k++) { const x = p.x - k * 0.06, y = p.y + 0.08 * Math.sin((x * 2 * Math.PI) / (lam / 250)); k ? g.lineTo(f.X(x), f.Y(y)) : g.moveTo(f.X(x), f.Y(y)); } g.stroke(); });
    el.forEach((e) => f.dot(e.x, e.y, C.main, 4));
    // K_max 대 진동수
    v = QSim.view(c2, 0.45);
    const fx = (l) => (HC / l) / 4.1357; // 진동수(10^15 Hz) = E(eV)/h, h = 4.1357e-15 eV·s
    f = QSim.frame(v, { x0: 0, x1: 2, y0: -1, y1: 4.5, xl: "f (×10¹⁵ Hz)", yl: "K_max (eV)" }); f.axes();
    Object.values(WF).forEach(([w, n2]) => f.fn((x) => 4.1357 * x - w, w === phi ? C.main : C.rule, w === phi ? 2.5 : 1));
    f.dot(fx(lam), Math.max(K, 0), C.acc, 6);
    S.out(`광자 에너지 E = hc/λ = ${E.toFixed(2)} eV, 진동수 ${fx(lam).toFixed(3)}×10¹⁵ Hz   ${name}의 일함수 φ = ${phi} eV (대표값, 확인 필요)\n` +
      (K > 0 ? `전자가 튀어나온다: K_max = hf − φ = ${K.toFixed(2)} eV, 저지 전압 ${K.toFixed(2)} V` : `전자가 나오지 않는다: 광자 에너지가 일함수보다 작다`) +
      `\n문턱 파장 hc/φ = ${(HC / phi).toFixed(0)} nm   빛의 세기 ${S.val("I")}%는 1초에 오는 광자 수를 바꾼다\n그래프: 금속마다 기울기 h가 같은 직선, 굵은 선이 고른 금속`);
  }
  const L = QSim.loop((dt) => {
    const lam = S.val("lam"), [phi] = WF[S.val("metal")], K = HC / lam - phi;
    acc += dt * S.val("I") * 0.12; while (acc > 1) { acc -= 1; ph.push({ x: 0, y: 0.8 + Math.random() * 2.8 }); }
    ph.forEach((p) => { p.x += dt * 4; });
    ph = ph.filter((p) => { if (p.x >= 7) { if (K > 0) { const sp = Math.sqrt(K) * 1.6, a = Math.PI * (0.6 + 0.8 * Math.random()); el.push({ x: 7, y: p.y, vx: sp * Math.cos(a), vy: sp * Math.sin(a) * 0.5 }); } return false; } return true; });
    el.forEach((e) => { e.x += e.vx * dt; e.y += e.vy * dt; }); el = el.filter((e) => e.x > 0 && e.x < 10 && e.y > 0 && e.y < 4.5);
    draw();
  }).watch(S.root);
  QSim.playButton(S.$(".play"), L);
  S.on(() => { if (!L.running) draw(); });
  QSim.redrawOn(draw); draw();
  if (!QSim.reduce) { L.start(); S.$(".play").textContent = "멈춤"; }
})();
