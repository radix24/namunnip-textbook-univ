/* 기계2 고체역학 1단원: 트러스 부재력 (01-02), 미끄러짐과 넘어짐 (01-04) */
(() => {
  "use strict";
  const mono = () => "12px " + (getComputedStyle(document.documentElement).getPropertyValue("--f-mono") || "monospace");

  /* 가우스 소거 (부분 피벗). 해가 없으면 null */
  function solve(A, b) {
    const n = b.length, M = A.map((r, i) => [...r, b[i]]);
    for (let c = 0; c < n; c++) {
      let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      if (Math.abs(M[p][c]) < 1e-12) return null;
      [M[c], M[p]] = [M[p], M[c]];
      for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
    }
    return M.map((r, i) => r[n] / r[i]);
  }

  /* ── 트러스: 4칸 Pratt / Howe ── */
  (() => {
    const S = QSim.card("lab-me-truss"); if (!S) return;
    const [cv] = S.$$("canvas");
    const nodes = { L0: [0, 0], L1: [2, 0], L2: [4, 0], L3: [6, 0], L4: [8, 0], U1: [2, 2], U2: [4, 2], U3: [6, 2] };
    const names = Object.keys(nodes);
    const base = [["L0", "L1"], ["L1", "L2"], ["L2", "L3"], ["L3", "L4"], ["U1", "U2"], ["U2", "U3"], ["L0", "U1"], ["U3", "L4"], ["L1", "U1"], ["L2", "U2"], ["L3", "U3"]];
    const diag = { pratt: [["U1", "L2"], ["U3", "L2"]], howe: [["L1", "U2"], ["L3", "U2"]] };
    function analyze() {
      const mem = [...base, ...diag[S.val("type")]], P = S.val("P"), at = S.val("at"), Q = S.val("Q");
      // 미지수: 부재력 13개 + 반력 L0x, L0y, L4y
      const nU = mem.length + 3, A = [], b = [];
      names.forEach((nm) => {
        const rx = new Array(nU).fill(0), ry = new Array(nU).fill(0);
        mem.forEach(([p, q], k) => {
          if (p !== nm && q !== nm) return;
          const o = p === nm ? q : p, [x0, y0] = nodes[nm], [x1, y1] = nodes[o], L = Math.hypot(x1 - x0, y1 - y0);
          rx[k] = (x1 - x0) / L; ry[k] = (y1 - y0) / L; // 인장 = 절점을 부재 쪽으로 당김
        });
        if (nm === "L0") { rx[mem.length] = 1; ry[mem.length + 1] = 1; }
        if (nm === "L4") ry[mem.length + 2] = 1;
        let fx = 0, fy = 0;
        if (nm === at) fy -= P;
        if (nm === "U2") fy -= Q;
        A.push(rx); b.push(-fx); A.push(ry); b.push(-fy);
      });
      const x = solve(A, b);
      return { mem, x };
    }
    function draw() {
      const c = QSim.col(), { mem, x } = analyze();
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: -0.8, x1: 8.8, y0: -1.2, y1: 2.9, equal: true, pad: 6 }), G = v.g;
      if (!x) { S.out("해를 구할 수 없습니다."); return; }
      const Fmax = Math.max(1, ...x.slice(0, mem.length).map(Math.abs));
      mem.forEach(([p, q], k) => {
        const F = x[k], [x0, y0] = nodes[p], [x1, y1] = nodes[q];
        const col = Math.abs(F) < 1e-6 ? c.ink3 : F > 0 ? c.main : c.warn;
        f.path([[x0, y0], [x1, y1]], col, 1.5 + 6 * Math.abs(F) / Fmax, Math.abs(F) < 1e-6 ? [4, 4] : null);
        G.save(); G.font = mono(); G.fillStyle = c.ink; G.textAlign = "center";
        const mx = f.X((x0 + x1) / 2), my = f.Y((y0 + y1) / 2);
        const t = Math.abs(F) < 1e-6 ? "0" : F.toFixed(1); const w = G.measureText(t).width + 6;
        G.fillStyle = c.card; G.fillRect(mx - w / 2, my - 8, w, 15); G.fillStyle = col; G.fillText(t, mx, my + 4); G.restore();
      });
      names.forEach((nm) => { const [px, py] = nodes[nm]; f.dot(px, py, c.ink, 4); f.text(nm, px + 0.12, py + (py > 0 ? 0.22 : -0.45), c.ink3); });
      const P = S.val("P"), Q = S.val("Q"), at = S.val("at");
      if (P > 0) f.arrow(nodes[at][0], nodes[at][1] - 0.15 - 0.9 * P / 50 - 0.2, 0, 0.9 * P / 50 + 0.2, c.acc, P + " kN");
      if (Q > 0) f.arrow(nodes.U2[0], nodes.U2[1] + 0.85, 0, -0.65, c.acc, Q + " kN");
      const G2 = v.g; G2.fillStyle = c.ink3;
      G2.beginPath(); G2.moveTo(f.X(0), f.Y(0)); G2.lineTo(f.X(0) - 8, f.Y(0) + 13); G2.lineTo(f.X(0) + 8, f.Y(0) + 13); G2.fill();
      G2.beginPath(); G2.arc(f.X(8), f.Y(0) + 8, 6, 0, 7); G2.stroke();
      const n = mem.length, idx = [...x.slice(0, n).keys()];
      const kT = idx.reduce((a, i) => (x[i] > x[a] ? i : a), 0), kC = idx.reduce((a, i) => (x[i] < x[a] ? i : a), 0);
      const zeros = idx.filter((i) => Math.abs(x[i]) < 1e-6).map((i) => mem[i].join(""));
      S.out(`반력: L0 가로 ${x[n].toFixed(2)}, L0 세로 ${x[n + 1].toFixed(2)}, L4 세로 ${x[n + 2].toFixed(2)} kN\n최대 인장 ${mem[kT].join("")} = ${x[kT].toFixed(2)} kN, 최대 압축 ${mem[kC].join("")} = ${x[kC].toFixed(2)} kN\n영부재: ${zeros.length ? zeros.join(", ") : "없음"}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* ── 미끄러짐과 넘어짐 ── */
  (() => {
    const S = QSim.card("card-me-tip"); if (!S) return;
    const [cv] = S.$$("canvas"), m = 50, g = 9.81, W = m * g, b = 0.6, H = 1.2;
    function draw() {
      const c = QSim.col(), P = S.val("P"), h = S.val("h"), mu = S.val("mu");
      const Pslip = mu * W, Ptip = (W * b / 2) / h;
      // 정지 가정: N = W, F = P, N의 위치 e(가운데에서 앞쪽으로) : W·e = P·h
      const e = (P * h) / W, slip = P > Pslip + 1e-9, tip = e > b / 2 + 1e-9;
      const v = QSim.view(cv, 0.62), f = QSim.frame(v, { x0: -1.0, x1: 1.0, y0: -0.25, y1: 1.45, equal: true, pad: 6 }), G = v.g;
      f.path([[-1, 0], [1, 0]], c.ink3, 2);
      // 상자 (앞 = 오른쪽). 넘어지면 앞 모서리를 중심으로 조금 기울여 그림
      const ang = tip && !(slip && Pslip < Ptip) ? -0.18 : 0, ox = b / 2, cx = slip && Pslip <= Ptip ? 0.15 : 0;
      const rot = ([x, y]) => [ox + cx + (x - ox) * Math.cos(ang) - y * Math.sin(ang), (x - ox) * Math.sin(ang) + y * Math.cos(ang)];
      const box = [[-b / 2, 0], [b / 2, 0], [b / 2, H], [-b / 2, H]].map(rot);
      G.fillStyle = c.soft; G.strokeStyle = c.ink2; G.beginPath(); box.forEach(([x, y], i) => (i ? G.lineTo(f.X(x), f.Y(y)) : G.moveTo(f.X(x), f.Y(y)))); G.closePath(); G.fill(); G.stroke();
      const s = 0.45 / Math.max(W, Pslip, Ptip, P);
      const [px, py] = rot([-b / 2, h]);
      if (P > 0) f.arrow(px - P * s - 0.02, py, P * s, 0, c.acc, "P");
      const [gx, gy] = rot([0, H / 2]); f.arrow(gx, gy, 0, -W * s, c.ink2, "W");
      const eN = Math.min(e, b / 2), [nx, ny] = rot([eN, 0]);
      f.arrow(nx, ny - W * s - 0.02, 0, W * s, c.main, "N");
      const Fv = Math.min(P, Pslip); if (Fv > 0) f.arrow(nx, ny - 0.04, -Fv * s, 0, c.warn, "F");
      let state;
      if (!slip && !tip) state = `정지. 필요한 마찰력 ${P.toFixed(0)} N ≤ μsN = ${Pslip.toFixed(0)} N, 수직항력은 가운데에서 앞쪽으로 ${(e * 100).toFixed(1)} cm (모서리까지 ${(b / 2 * 100).toFixed(0)} cm)`;
      else if (Pslip <= Ptip) state = `미끄러짐: P가 ${Pslip.toFixed(0)} N을 넘는 순간 넘어지기 전에 미끄러집니다.`;
      else state = `넘어짐: P가 ${Ptip.toFixed(0)} N에서 수직항력이 앞 모서리에 닿아 상자가 들립니다(그때 필요한 마찰력 ${Ptip.toFixed(0)} N &lt; ${Pslip.toFixed(0)} N).`.replace("&lt;", "<");
      S.out(`무게 W = ${W.toFixed(1)} N, 폭 0.6 m, 높이 1.2 m\n미끄러짐 경계 P = μsW = ${Pslip.toFixed(1)} N,  넘어짐 경계 P = W(b/2)/h = ${Ptip.toFixed(1)} N → 먼저 일어나는 것: ${Pslip < Ptip ? "미끄러짐" : "넘어짐"}\n${state}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
