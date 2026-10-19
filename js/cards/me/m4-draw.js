/* 기계4 컴퓨터응용기계설계 1단원: 쌓기나무 입체의 겨냥도와 제3각법 세 투상도 (01-01) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-ortho"); if (!S) return;
  const [cv] = S.$$("canvas");
  // 단위 정육면체 목록 [x, y, z] (x 오른쪽, y 뒤쪽, z 위쪽), 한 칸 10 mm
  const box = (x0, x1, y0, y1, z0, z1) => { const a = []; for (let x = x0; x < x1; x++) for (let y = y0; y < y1; y++) for (let z = z0; z < z1; z++) a.push([x, y, z]); return a; };
  const SHAPES = {
    L: { name: "L자 브래킷 (예제 1.1.1)", c: [...box(0, 6, 0, 4, 0, 1), ...box(0, 1, 0, 4, 1, 5)] },
    step: { name: "계단 블록", c: [...box(0, 6, 0, 3, 0, 1), ...box(0, 4, 0, 3, 1, 2), ...box(0, 2, 0, 3, 2, 3)] },
    notch: { name: "홈 파인 블록", c: box(0, 6, 0, 4, 0, 3).filter(([x, , z]) => !(z === 2 && x >= 2 && x < 4)) },
    tee: { name: "뒤가 높은 T 블록", c: [...box(0, 6, 0, 2, 0, 1), ...box(2, 4, 0, 2, 1, 2), ...box(0, 6, 2, 4, 0, 3)] }
  };
  function draw() {
    const c = QSim.col(), sh = SHAPES[S.val("s")], cubes = sh.c, v = QSim.view(cv, 0.62), G = v.g, W = v.W, H = v.H;
    const set = new Set(cubes.map((p) => p.join(","))), has = (x, y, z) => set.has(`${x},${y},${z}`);
    const nx = 6, ny = 4, nz = 5, u = Math.min(W / 30, H / 17);
    // ── 세 투상도 (제3각법 배치): 정면도 왼쪽 아래, 평면도 그 위, 우측면도 그 오른쪽
    const ox = u * 1.5, oyF = H - u * 1.5; // 정면도 왼쪽 아래 모서리
    const oyT = oyF - nz * u - u * 1.2; // 평면도 아래 모서리
    const oxR = ox + nx * u + u * 1.2; // 우측면도 왼쪽 모서리
    const view = (W2, H2, depth, X0, Y0, title) => {
      // depth(i, j): 그 칸에서 보이는 면의 깊이 (없으면 null). i: 가로, j: 세로(위로)
      G.save(); G.strokeStyle = c.ink; G.lineWidth = 2;
      for (let i = 0; i < W2; i++) for (let j = 0; j < H2; j++) {
        const d = depth(i, j); if (d === null) continue;
        G.fillStyle = "rgba(75,79,224,.10)"; G.fillRect(X0 + i * u, Y0 - (j + 1) * u, u, u);
        const nb = [[i - 1, j, "L"], [i + 1, j, "R"], [i, j - 1, "D"], [i, j + 1, "U"]];
        for (const [a, b, s] of nb) {
          const e = a < 0 || b < 0 || a >= W2 || b >= H2 ? null : depth(a, b);
          if (e === d) continue; // 같은 깊이의 면이 이어짐: 선 없음
          G.beginPath();
          const x = X0 + i * u, y = Y0 - j * u;
          if (s === "L") { G.moveTo(x, y); G.lineTo(x, y - u); } else if (s === "R") { G.moveTo(x + u, y); G.lineTo(x + u, y - u); }
          else if (s === "D") { G.moveTo(x, y); G.lineTo(x + u, y); } else { G.moveTo(x, y - u); G.lineTo(x + u, y - u); }
          G.stroke();
        }
      }
      G.fillStyle = c.ink2; G.font = "11px sans-serif"; G.fillText(title, X0, Y0 + 13);
      G.restore();
    };
    const minOf = (arr) => (arr.length ? Math.min(...arr) : null), maxOf = (arr) => (arr.length ? Math.max(...arr) : null);
    const rng = (n) => [...Array(n).keys()];
    view(nx, nz, (i, j) => minOf(rng(ny).filter((y) => has(i, y, j))), ox, oyF, "정면도");
    view(nx, ny, (i, j) => maxOf(rng(nz).filter((z) => has(i, j, z))), ox, oyT, "평면도");
    view(ny, nz, (i, j) => maxOf(rng(nx).filter((x) => has(x, i, j))), oxR, oyF, "우측면도");
    // ── 겨냥도 (오른쪽): 앞-오른쪽-위에서 본 등각 그림
    const s = u * 0.95, cx = W * 0.62, cy = H * 0.72, k = Math.cos(Math.PI / 6);
    const P = (x, y, z) => [cx + (x + y) * k * s, cy - (z + (y - x) * 0.5) * s];
    const sorted = [...cubes].sort((a, b) => (a[0] - a[1] + a[2]) - (b[0] - b[1] + b[2]));
    const face = (pts, fill) => { G.fillStyle = fill; G.strokeStyle = c.ink; G.lineWidth = 1; G.beginPath(); pts.forEach(([x, y, z], i) => { const [px, py] = P(x, y, z); i ? G.lineTo(px, py) : G.moveTo(px, py); }); G.closePath(); G.fill(); G.stroke(); };
    sorted.forEach(([x, y, z]) => {
      if (!has(x, y, z + 1)) face([[x, y, z + 1], [x + 1, y, z + 1], [x + 1, y + 1, z + 1], [x, y + 1, z + 1]], "rgba(200,205,240,1)");
      if (!has(x, y - 1, z)) face([[x, y, z], [x + 1, y, z], [x + 1, y, z + 1], [x, y, z + 1]], "rgba(150,160,225,1)");
      if (!has(x + 1, y, z)) face([[x + 1, y, z], [x + 1, y + 1, z], [x + 1, y + 1, z + 1], [x + 1, y, z + 1]], "rgba(110,120,200,1)");
    });
    G.fillStyle = c.ink2; G.font = "11px sans-serif"; G.fillText("겨냥도 (앞·오른쪽·위에서)", W * 0.55, 14);
    S.out(`${sh.name}: 정육면체 ${cubes.length}개 (한 칸 10 mm)\n정면도는 앞(아래쪽 화살표 방향)에서, 평면도는 위에서, 우측면도는 오른쪽에서 본 모습이며 제3각법대로 평면도는 정면도 위, 우측면도는 정면도 오른쪽에 둔다\n굵은 선: 보이는 모서리 (깊이가 달라지는 곳). 숨은선은 생략했다`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();

/* 기계4 1단원: 직렬 치수와 기준 치수의 오차 누적 (01-03, 03-03) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-chain"); if (!S) return;
  const [cv] = S.$$("canvas");
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  let seed = 5;
  function draw() {
    const c = QSim.col(), n = S.val("n"), tol = S.val("t"), mode = S.val("mode"), pitch = 20;
    // 한 부품: 각 치수의 가공 오차는 ±tol 안에서 고르게 (가상)
    const make = (r) => { const pos = []; let p = 0; for (let i = 1; i <= n; i++) { const e = (2 * r() - 1) * tol; if (mode === "chain") { p += pitch + e; pos.push(p); } else pos.push(i * pitch + e); } return pos; };
    const r = rng(seed * 977), part = make(r);
    // 1000개 부품에서 마지막 구멍 위치 오차의 분포
    const r2 = rng(seed * 31 + 7), errs = [];
    for (let k = 0; k < 1000; k++) { const q = make(r2); errs.push(q[n - 1] - n * pitch); }
    const mean = errs.reduce((a, b) => a + b, 0) / errs.length, sd = Math.sqrt(errs.reduce((a, b) => a + (b - mean) ** 2, 0) / (errs.length - 1));
    const worst = mode === "chain" ? n * tol : tol, maxSeen = Math.max(...errs.map(Math.abs));
    const v = QSim.view(cv, 0.42), G = v.g, f = QSim.frame(v, { x0: -10, x1: (n + 1) * pitch, y0: -1.6, y1: 1.6, pad: 6 });
    G.fillStyle = "rgba(201,140,70,.35)"; G.fillRect(f.X(-5), f.Y(0.8), f.X((n + 0.5) * pitch) - f.X(-5), f.Y(-0.8) - f.Y(0.8));
    for (let i = 1; i <= n; i++) {
      const x = part[i - 1], ideal = i * pitch, amp = 15; // 오차를 15배 키워 그림
      f.path([[ideal, -1.2], [ideal, 1.2]], c.ink3, 1, [3, 3]);
      const xd = ideal + (x - ideal) * amp; G.strokeStyle = c.main; G.lineWidth = 2; G.beginPath(); G.arc(f.X(xd), f.Y(0), 6, 0, 7); G.stroke();
    }
    f.text(mode === "chain" ? "직렬 치수: 앞 구멍에서 다음 구멍까지" : "기준 치수: 왼쪽 끝에서 각 구멍까지", -8, 1.35, c.ink2);
    S.out(`구멍 ${n}개, 간격 20 mm, 각 치수 공차 ±${tol.toFixed(2)} mm, ${mode === "chain" ? "직렬 치수" : "기준 치수"} (그림은 오차를 15배 키움)\n이 부품의 마지막 구멍 위치 오차 ${(part[n - 1] - n * pitch).toFixed(3)} mm, 최악의 경우 ±${worst.toFixed(2)} mm\n가상 부품 1000개에서 마지막 구멍 오차: 표준편차 ${sd.toFixed(3)} mm, 실제로 나온 최대 ${maxSeen.toFixed(3)} mm`);
  }
  S.$(".reset").addEventListener("click", () => { seed++; draw(); });
  S.on(draw); QSim.redrawOn(draw); draw();
})();
