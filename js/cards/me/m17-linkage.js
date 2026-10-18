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
