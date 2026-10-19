/* 기계2 고체역학 5단원: 단면 모양에 따른 굽힘 응력·전단 응력 분포 (05-02, 05-03) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-section"); if (!S) return;
  const [cv] = S.$$("canvas"), H = 200, N = 400; // 단면 높이 200 mm를 400칸으로
  // 높이 y(아래 끝 0 ~ 위 끝 H)에서의 폭 b(y)
  function widthFn(shape) {
    const tf = 12, tw = 8, B = 100;
    if (shape === "rect") return () => 60;
    if (shape === "I") return (y) => (y < tf || y > H - tf ? B : tw);
    if (shape === "T") return (y) => (y > H - tf ? B : tw); // 플랜지 위
    return (y) => (y < tf ? B : tw); // 뒤집은 T: 플랜지 아래
  }
  function analyze() {
    const b = widthFn(S.val("shape")), dy = H / N, ys = [], bs = [];
    for (let i = 0; i < N; i++) { const y = (i + 0.5) * dy; ys.push(y); bs.push(b(y)); }
    const A = bs.reduce((s, w) => s + w * dy, 0), yc = ys.reduce((s, y, i) => s + y * bs[i] * dy, 0) / A;
    const I = ys.reduce((s, y, i) => s + (y - yc) ** 2 * bs[i] * dy, 0);
    // Q(y): y보다 위쪽 넓이의 중립축에 대한 1차 모멘트
    const Q = new Array(N + 1).fill(0);
    for (let i = N - 1; i >= 0; i--) Q[i] = Q[i + 1] + (ys[i] - yc) * bs[i] * dy;
    return { b, ys, bs, A, yc, I, Q, dy };
  }
  function draw() {
    const c = QSim.col(), r = analyze(), V = S.val("V") * 1000, M = S.val("M") * 1e6;
    const v = QSim.view(cv, 0.62), g = v.g, W = v.W, Hh = v.H, top = 18, bot = Hh - 26, Y = (y) => bot - (y / H) * (bot - top);
    // 단면 그림
    const x0 = 14, sc = (W * 0.24) / 100, cx = x0 + 50 * sc;
    g.fillStyle = c.soft; g.strokeStyle = c.ink2;
    for (let i = 0; i < N; i++) { const w = r.bs[i] * sc; g.fillRect(cx - w / 2, Y((i + 1) * r.dy), w, Y(i * r.dy) - Y((i + 1) * r.dy) + 0.5); }
    g.setLineDash([4, 3]); g.strokeStyle = c.ink3; g.beginPath(); g.moveTo(x0, Y(r.yc)); g.lineTo(W - 8, Y(r.yc)); g.stroke(); g.setLineDash([]);
    g.fillStyle = c.ink3; g.font = "11px " + getComputedStyle(document.documentElement).getPropertyValue("--f-mono"); g.fillText("중립축", x0, Y(r.yc) - 4);
    // 굽힘 응력 σ(y) = -M(y - yc)/I
    const sx0 = W * 0.36, sx1 = W * 0.64, scen = (sx0 + sx1) / 2;
    const sig = (y) => (-M * (y - r.yc)) / r.I, smax = Math.max(1, Math.abs(sig(0)), Math.abs(sig(H)));
    g.strokeStyle = c.ink3; g.beginPath(); g.moveTo(scen, top); g.lineTo(scen, bot); g.stroke();
    g.strokeStyle = c.main; g.lineWidth = 2; g.beginPath(); g.moveTo(scen + (sig(0) / smax) * (sx1 - sx0) / 2, Y(0)); g.lineTo(scen + (sig(H) / smax) * (sx1 - sx0) / 2, Y(H)); g.stroke(); g.lineWidth = 1;
    g.fillStyle = c.main; g.fillText("σ (굽힘)", sx0, Hh - 8);
    // 전단 응력 τ(y) = VQ/(Ib)
    const tx0 = W * 0.7, tx1 = W - 10, taus = r.Q.slice(0, N).map((q, i) => (V * q) / (r.I * r.bs[i]));
    const tmax = Math.max(1e-9, ...taus);
    g.strokeStyle = c.ink3; g.beginPath(); g.moveTo(tx0, top); g.lineTo(tx0, bot); g.stroke();
    g.strokeStyle = c.warn; g.lineWidth = 2; g.beginPath(); taus.forEach((t, i) => { const X = tx0 + (t / tmax) * (tx1 - tx0); i ? g.lineTo(X, Y(r.ys[i])) : g.moveTo(X, Y(r.ys[i])); }); g.stroke(); g.lineWidth = 1;
    g.fillStyle = c.warn; g.fillText("τ (전단)", tx0, Hh - 8);
    const webArea = r.bs.reduce((s, w, i) => s + (w <= 8 ? w * r.dy : 0), 0);
    // 최대/평균 비는 단면 모양만으로 정해지므로 V와 무관하게 계산(V = 0일 때 0/0 방지)
    const ratio = r.A * Math.max(...r.Q.slice(0, N).map((q, i) => q / (r.I * r.bs[i])));
    S.out(`넓이 A = ${r.A.toFixed(0)} mm², 중립축 높이 ${r.yc.toFixed(1)} mm (아래 끝에서), I = ${(r.I / 1e6).toFixed(2)}×10⁶ mm⁴\n굽힘: 위 끝 σ = ${sig(H).toFixed(1)} MPa, 아래 끝 σ = ${sig(0).toFixed(1)} MPa (M = ${S.val("M")} kN·m)\n전단: 최대 τ = ${tmax.toFixed(2)} MPa, 평균 V/A = ${(V / r.A).toFixed(2)} MPa, 비 ${ratio.toFixed(2)}${webArea > 0 ? `\n웨브 근사 V/(웨브 넓이) = ${(V / webArea).toFixed(2)} MPa` : ""}`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();
