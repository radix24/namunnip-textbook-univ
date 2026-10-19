/* 기계17 메카니즘설계: 4절 링크의 Grashof 조건과 위치 해석 (01-02, 02-01) */
(() => {
  "use strict";
  const S = QSim.card("card-me-fourbar"); if (!S) return;
  const [cv] = S.$$("canvas");
  let th = 0.3, dir = 1, trace = [], branch = 1;
  const len = () => ({ d: S.val("d"), a: S.val("a"), b: S.val("b"), c: S.val("c"), p: S.val("p") });
  // 크랭크 각 th에서 B점: 원(A, b)과 원(O4, c)의 교점. branch로 열린·교차 조립 선택
  function solve(th) {
    const L = len(), A = [L.a * Math.cos(th), L.a * Math.sin(th)], O4 = [L.d, 0];
    const dx = O4[0] - A[0], dy = O4[1] - A[1], e = Math.hypot(dx, dy);
    if (e > L.b + L.c || e < Math.abs(L.b - L.c) || e === 0) return null;
    const m = (L.b * L.b - L.c * L.c + e * e) / (2 * e), hh = Math.sqrt(Math.max(0, L.b * L.b - m * m));
    const mx = A[0] + (m * dx) / e, my = A[1] + (m * dy) / e;
    const B = [mx - (branch * hh * dy) / e, my + (branch * hh * dx) / e];
    const u = [(B[0] - A[0]) / L.b, (B[1] - A[1]) / L.b];
    const P = [A[0] + u[0] * L.b * 0.5 - u[1] * L.p, A[1] + u[1] * L.b * 0.5 + u[0] * L.p];
    return { A, B, O4, P };
  }
  function grashof() {
    const L = len(), arr = [["지면", L.d], ["크랭크", L.a], ["커플러", L.b], ["로커", L.c]].sort((x, y) => x[1] - y[1]);
    const s = arr[0][1], l = arr[3][1], pq = arr[1][1] + arr[2][1];
    let kind;
    if (s + l > pq) kind = "비Grashof: 어느 링크도 한 바퀴 돌 수 없음 (삼중 로커)";
    else if (Math.abs(s + l - pq) < 1e-9) kind = "변환점 기구 (s + l = p + q): 일직선으로 펴지는 자세에서 움직임이 정해지지 않음";
    else if (arr[0][0] === "크랭크") kind = "Grashof, 가장 짧은 링크가 입력 크랭크: 크랭크-로커";
    else if (arr[0][0] === "지면") kind = "Grashof, 가장 짧은 링크가 지면: 이중 크랭크";
    else if (arr[0][0] === "커플러") kind = "Grashof, 가장 짧은 링크가 커플러: 이중 로커(커플러는 한 바퀴 돎)";
    else kind = "Grashof, 가장 짧은 링크가 출력 로커: 로커-크랭크(입력은 왕복)";
    return { s, l, pq, kind, shortest: arr[0][0] };
  }
  function draw() {
    const c = QSim.col(), L = len(), g = grashof(), q = solve(th);
    const R = Math.max(L.d + L.c, L.a + L.b) + Math.abs(L.p) + 0.5;
    const v = QSim.view(cv, 0.68), f = QSim.frame(v, { x0: -R * 0.75, x1: R * 1.1, y0: -R * 0.75, y1: R * 0.85, equal: true, pad: 6 });
    if (trace.length > 1) f.path(trace, c.acc, 1.5);
    f.path([[0, 0], [L.d, 0]], c.ink3, 4);
    [[0, 0], [L.d, 0]].forEach(([x, y]) => { const G = v.g; G.fillStyle = c.ink3; G.beginPath(); G.moveTo(f.X(x), f.Y(y)); G.lineTo(f.X(x) - 8, f.Y(y) + 12); G.lineTo(f.X(x) + 8, f.Y(y) + 12); G.fill(); });
    if (q) {
      f.path([[0, 0], q.A], c.warn, 4); f.path([q.A, q.B], c.main, 4); f.path([q.O4, q.B], c.ink2, 4);
      f.path([q.A, q.P, q.B], c.main, 1, [3, 3]); f.dot(q.P[0], q.P[1], c.acc, 4);
      [[0, 0], q.A, q.B, q.O4].forEach(([x, y]) => f.dot(x, y, c.ink, 3));
      const th4 = Math.atan2(q.B[1], q.B[0] - L.d), ba = [q.B[0] - q.A[0], q.B[1] - q.A[1]], bo = [q.B[0] - L.d, q.B[1]];
      let mu = Math.acos(Math.max(-1, Math.min(1, (ba[0] * bo[0] + ba[1] * bo[1]) / (L.b * L.c)))) * 180 / Math.PI; if (mu > 90) mu = 180 - mu;
      S.out(`링크 길이: 지면 ${L.d}, 크랭크 ${L.a}, 커플러 ${L.b}, 로커 ${L.c}\n가장 짧은 s = ${g.s}, 가장 긴 l = ${g.l}, 나머지 합 p + q = ${g.pq}: s + l = ${(g.s + g.l).toFixed(1)} ${g.s + g.l > g.pq ? ">" : g.s + g.l < g.pq ? "<" : "="} p + q\n${g.kind}\n크랭크 θ₂ = ${Math.round(((th * 180) / Math.PI % 360 + 360) % 360)}°, 로커 θ₄ = ${((th4 * 180) / Math.PI).toFixed(1)}°, 전달각 μ = ${mu.toFixed(1)}° ${mu < 40 ? "(40° 미만: 힘 전달 나쁨)" : ""}`);
    } else S.out(`이 크랭크 각에서는 링크를 조립할 수 없습니다.\n${g.kind}`);
  }
  const Lp = QSim.loop((dt) => {
    let next = th + dir * dt * 1.5;
    if (!solve(next)) { dir = -dir; next = th + dir * dt * 1.5; if (!solve(next)) return false; }
    th = next; const q = solve(th); if (q) { trace.push(q.P); if (trace.length > 900) trace.shift(); }
    draw();
  }).watch(S.root);
  QSim.playButton(S.$(".play"), Lp);
  S.$(".flip").addEventListener("click", () => { branch = -branch; trace = []; draw(); });
  S.on(() => { trace = []; th = 0.3; dir = 1; if (!solve(th)) { for (let a = 0; a < 6.3; a += 0.01) if (solve(a)) { th = a; break; } } draw(); });
  QSim.redrawOn(draw); draw();
})();

/* 기계17 4단원: 캠 변위 함수의 SVAJ 선도 (04-01) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-cam"); if (!S) return;
  const [cv] = S.$$("canvas");
  const PI = Math.PI;
  // 상승 구간 x = θ/β ∈ [0, 1]에서 s/h와 β·ds/dθ/h, β²·s''/h, β³·s'''/h
  const FN = {
    cv: { n: "등속도", f: (x) => [x, 1, 0, 0] },
    shm: { n: "단현(SHM)", f: (x) => [(1 - Math.cos(PI * x)) / 2, (PI / 2) * Math.sin(PI * x), (PI * PI / 2) * Math.cos(PI * x), -(PI ** 3 / 2) * Math.sin(PI * x)] },
    cyc: { n: "사이클로이드", f: (x) => [x - Math.sin(2 * PI * x) / (2 * PI), 1 - Math.cos(2 * PI * x), 2 * PI * Math.sin(2 * PI * x), 4 * PI * PI * Math.cos(2 * PI * x)] },
    p345: { n: "3-4-5 다항식", f: (x) => [10 * x ** 3 - 15 * x ** 4 + 6 * x ** 5, 30 * x * x - 60 * x ** 3 + 30 * x ** 4, 60 * x - 180 * x * x + 120 * x ** 3, 60 - 360 * x + 360 * x * x] },
  };
  function draw() {
    const c = QSim.col(), F = FN[S.val("fn")], h = S.val("h") / 1000, bdeg = S.val("b"), rpm = S.val("rpm");
    const be = (bdeg * PI) / 180, w = (rpm * 2 * PI) / 60;
    const scale = [h, (h * w) / be, (h * w * w) / (be * be), (h * w ** 3) / be ** 3];
    // 한 바퀴: 0~β 상승, β~180 위 정지, 180~180+β 하강, 나머지 아래 정지
    const at = (deg) => {
      if (deg < bdeg) return F.f(deg / bdeg);
      if (deg < 180) return [1, 0, 0, 0];
      if (deg < 180 + bdeg) { const r = F.f((deg - 180) / bdeg); return [1 - r[0], -r[1], -r[2], -r[3]]; }
      return [0, 0, 0, 0];
    };
    const N = 1440, rows = [[], [], [], []];
    for (let k = 0; k <= N; k++) { const d = (360 * k) / N, r = at(d); for (let j = 0; j < 4; j++) rows[j].push([d, r[j]]); }
    const mx = rows.map((r) => Math.max(1e-9, ...r.map((p) => Math.abs(p[1]))));
    const v = QSim.view(cv, 0.62), f = QSim.frame(v, { x0: 0, x1: 360, y0: 0, y1: 4, pad: 30 });
    f.axes({ noGrid: true });
    const lab = ["s 변위", "v 속도", "a 가속도", "j 저크"], colr = [c.main, c.acc, c.warn, c.ink2];
    for (let j = 0; j < 4; j++) {
      const y0 = 3.5 - j;
      f.path([[0, y0], [360, y0]], c.rule, 1);
      const sc = 0.42 / mx[j];
      f.path(rows[j].map(([d, y]) => [d, y0 + (j === 0 ? (y - 0.5) * 0.84 : y * sc)]), colr[j], 2);
      f.text(lab[j], 4, y0 + 0.36, colr[j]);
    }
    // 경계에서의 불연속: 등속도는 가속도 무한, SHM·등속도는 저크 무한
    const edges = [0, bdeg, 180, 180 + bdeg];
    const accJump = F === FN.shm ? (PI * PI) / 2 : 0, infAcc = F === FN.cv, infJerk = F === FN.cv || F === FN.shm;
    edges.forEach((d) => {
      if (infAcc) f.path([[d, 1.5 - 0.48], [d, 1.5 + 0.48]], c.warn, 2, [3, 2]);
      if (infJerk) f.path([[d, 0.5 - 0.48], [d, 0.5 + 0.48]], c.ink2, 2, [3, 2]);
    });
    const pk = (j) => mx[j] * scale[j];
    const lines = [`${F.n}, 상승 h = ${S.val("h")} mm, 상승각 β = ${bdeg}°, ${rpm} rpm (ω = ${w.toFixed(1)} rad/s)`];
    lines.push(`최대 속도 ${pk(1).toFixed(2)} m/s, 최대 가속도 ${infAcc ? "무한대 (경계에서 속도가 순간적으로 바뀜)" : `${pk(2).toFixed(0)} m/s²`}, 최대 저크 ${infJerk ? "무한대 (가속도가 경계에서 끊김)" : `${(pk(3) / 1000).toFixed(1)} km/s³`}`);
    lines.push(infAcc ? "캠 설계 기본 법칙 위반: 가속도가 연속이 아님 (충격)" : accJump ? `캠 설계 기본 법칙 위반: 경계에서 가속도가 0 ↔ ${(accJump * scale[2]).toFixed(0)} m/s²로 끊김` : "가속도가 연속: 캠 설계 기본 법칙 만족");
    S.out(lines.join("\n"));
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();
