/* 공통9 체험 카드 묶음 2: 복소수의 극형식, 거듭제곱과 거듭제곱근. */
(() => {
  "use strict";
  const C = () => QSim.col();

  /* 1. 극형식으로 본 z^n과 n제곱근 (03-02) */
  (() => {
    const S = QSim.card("lab-c9-roots"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), r = S.val("r"), thd = S.val("th"), n = S.val("n"), th = (thd * Math.PI) / 180;
      const v = QSim.view(cv, 0.8), F = QSim.frame(v, { x0: -2.4, x1: 2.4, y0: -2.4, y1: 2.4, equal: true, xl: "Re", yl: "Im" }); F.axes();
      const g = v.g; g.save(); g.strokeStyle = c.rule; g.setLineDash([4, 4]); g.beginPath(); g.arc(F.X(0), F.Y(0), F.sx, 0, 7); g.stroke(); g.restore();
      const zr = r * Math.cos(th), zi = r * Math.sin(th), Rn = Math.pow(r, n), tn = n * th;
      F.arrow(0, 0, zr, zi, c.main, "z");
      const wr = Rn * Math.cos(tn), wi = Rn * Math.sin(tn), sc = Rn > 2.3 ? 2.3 / Rn : 1;
      F.arrow(0, 0, wr * sc, wi * sc, c.acc, `z^${n}` + (sc < 1 ? " (줄여 그림)" : ""));
      const rr = Math.pow(r, 1 / n), roots = [];
      for (let k = 0; k < n; k++) { const a = (th + 2 * Math.PI * k) / n; roots.push([rr * Math.cos(a), rr * Math.sin(a), a]); }
      F.path([...roots.map(([x, y]) => [x, y]), [roots[0][0], roots[0][1]]], c.ink3, 1, [3, 3]);
      roots.forEach(([x, y], k) => { F.dot(x, y, c.warn, 5); F.text(`w${k}`, x + 0.08, y + 0.08, c.warn); });
      const deg = (a) => ((((a * 180) / Math.PI) % 360) + 360) % 360;
      S.out(`z = ${r.toFixed(2)}(cos ${thd}° + i sin ${thd}°) = ${zr.toFixed(3)} ${zi < 0 ? "−" : "+"} ${Math.abs(zi).toFixed(3)}i\n` +
        `드무아브르: z^${n} = ${r.toFixed(2)}^${n}(cos ${(n * thd).toFixed(0)}° + i sin ${(n * thd).toFixed(0)}°),  크기 ${Rn.toFixed(3)}, 각 ${deg(tn).toFixed(1)}°\n` +
        `w^${n} = z인 w (빨간 점) ${n}개: 크기 ${rr.toFixed(4)}, 각 ${roots.map((q) => deg(q[2]).toFixed(1) + "°").join(", ")}  (원 위에 ${(360 / n).toFixed(1)}°씩 고르게 놓임)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
  const erf = (x) => { const s = Math.sign(x), a = Math.abs(x), t = 1 / (1 + 0.3275911 * a); return s * (1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a)); };
  /* 값 v(-1~1)를 보라(+)·주황(−) 색으로 칠하는 작은 그림을 만들어 늘려 그린다 */
  const heat = (v, F, box, N, val) => {
    const c = C(), off = document.createElement("canvas"); off.width = N; off.height = N;
    const og = off.getContext("2d"), img = og.createImageData(N, N);
    const hex = (s, d) => { const m = /^#?([0-9a-f]{6})$/i.exec(String(s).trim()); return m ? [0, 2, 4].map((k) => parseInt(m[1].slice(k, k + 2), 16)) : d; };
    const P = hex(c.main, [75, 79, 224]), M = hex(c.acc, [242, 179, 61]);
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const x = box.x0 + ((box.x1 - box.x0) * (i + 0.5)) / N, y = box.y0 + ((box.y1 - box.y0) * (j + 0.5)) / N, w = val(x, y), p = 4 * ((N - 1 - j) * N + i);
      if (!isFinite(w)) continue;
      const col = w >= 0 ? P : M; img.data[p] = col[0]; img.data[p + 1] = col[1]; img.data[p + 2] = col[2]; img.data[p + 3] = Math.round(230 * Math.min(1, Math.abs(w)));
    }
    og.putImageData(img, 0, 0);
    v.g.drawImage(off, F.X(box.x0), F.Y(box.y1), F.X(box.x1) - F.X(box.x0), F.Y(box.y0) - F.Y(box.y1));
  };

  /* 3. 직사각형 막의 진동 모드 (02-07) */
  (() => {
    const S = QSim.card("lab-c9-membrane"); if (!S) return;
    const cv = S.$("canvas");
    let ph = 0;
    function draw() {
      const c = C(), m = S.val("m"), n = S.val("n"), a = S.val("a"), b = 1;
      const v = QSim.view(cv, 0.62), F = QSim.frame(v, { x0: 0, x1: Math.max(a, 1.6), y0: 0, y1: 1, equal: true, xl: "x", yl: "y" });
      const amp = Math.cos(ph);
      heat(v, F, { x0: 0, x1: a, y0: 0, y1: b }, 96, (x, y) => amp * Math.sin((m * Math.PI * x) / a) * Math.sin((n * Math.PI * y) / b));
      const g = v.g; g.save(); g.strokeStyle = c.ink; g.lineWidth = 2; g.strokeRect(F.X(0), F.Y(b), F.X(a) - F.X(0), F.Y(0) - F.Y(b));
      g.setLineDash([4, 3]); g.lineWidth = 1;
      for (let i = 1; i < m; i++) { g.beginPath(); g.moveTo(F.X((i * a) / m), F.Y(0)); g.lineTo(F.X((i * a) / m), F.Y(b)); g.stroke(); }
      for (let j = 1; j < n; j++) { g.beginPath(); g.moveTo(F.X(0), F.Y((j * b) / n)); g.lineTo(F.X(a), F.Y((j * b) / n)); g.stroke(); }
      g.restore();
      const w = (p, q) => Math.PI * Math.sqrt((p * p) / (a * a) + (q * q) / (b * b));
      const list = []; for (let p = 1; p <= 3; p++) for (let q = 1; q <= 3; q++) list.push([w(p, q), p, q]);
      list.sort((x, y) => x[0] - y[0]);
      S.out(`가로 a = ${a.toFixed(2)}, 세로 b = 1, 파동 속력 c = 1.  모드 (m, n) = (${m}, ${n})\n` +
        `u = cos(λt) sin(mπx/a) sin(nπy/b),  λ = cπ√(m²/a² + n²/b²) = ${w(m, n).toFixed(4)},  기본 모드와의 비 ${(w(m, n) / w(1, 1)).toFixed(4)}\n` +
        `진동수가 낮은 순서: ${list.slice(0, 5).map(([x, p, q]) => `(${p},${q}) ${x.toFixed(3)}`).join(", ")}\n점선: 마디선 (움직이지 않는 선)`);
    }
    const L = QSim.loop((dt) => { ph += dt * 2; draw(); }).watch(cv);
    QSim.playButton(S.$(".play"), L);
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 복소평면에서 본 수렴 반지름 (05-01) */
  (() => {
    const S = QSim.card("lab-c9-cdisk"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), x = S.val("x"), y = S.val("y"), N = S.val("N");
      const v = QSim.view(cv, 0.8), F = QSim.frame(v, { x0: -2, x1: 2, y0: -2, y1: 2, equal: true, xl: "Re", yl: "Im" }); F.axes();
      const g = v.g; g.save(); g.strokeStyle = c.main; g.setLineDash([5, 4]); g.beginPath(); g.arc(F.X(0), F.Y(0), F.sx, 0, 7); g.stroke(); g.restore();
      F.dot(0, 1, c.warn, 6); F.dot(0, -1, c.warn, 6); F.text("i", 0.08, 1.1, c.warn); F.text("−i", 0.08, -1.25, c.warn);
      /* 1/(1 + z²) = Σ (−1)^k z^(2k).  부분합의 자취를 그린다 */
      const mul = (p, q) => [p[0] * q[0] - p[1] * q[1], p[0] * q[1] + p[1] * q[0]];
      const z = [x, y], z2 = mul(z, z); let term = [1, 0], s = [0, 0];
      const path = [[0, 0]];
      for (let k = 0; k < N; k++) { s = [s[0] + term[0], s[1] + term[1]]; path.push([...s]); term = mul(term, [-z2[0], -z2[1]]); }
      const den = [1 + z2[0], z2[1]], dd = den[0] * den[0] + den[1] * den[1], fz = [den[0] / dd, -den[1] / dd];
      const sc = Math.max(1, ...path.map((p) => Math.hypot(...p)) ) / 1.8;
      F.path(path.map(([a, b]) => [a / sc, b / sc]), c.acc, 1.5); F.dot(fz[0] / sc, fz[1] / sc, c.ink, 4);
      F.dot(x, y, c.ink, 6); F.text("z", x + 0.08, y + 0.08, c.ink);
      const r = Math.hypot(x, y);
      S.out(`z = ${x.toFixed(2)} ${y < 0 ? "−" : "+"} ${Math.abs(y).toFixed(2)}i,  |z| = ${r.toFixed(3)}  (수렴 반지름 1: 0에서 가장 가까운 특이점 ±i까지의 거리)\n` +
        `1/(1 + z²) = ${fz[0].toFixed(4)} ${fz[1] < 0 ? "−" : "+"} ${Math.abs(fz[1]).toFixed(4)}i\n` +
        `앞 ${N}항의 합 = ${s[0].toPrecision(6)} ${s[1] < 0 ? "−" : "+"} ${Math.abs(s[1]).toPrecision(6)}i,  차이 ${Math.hypot(s[0] - fz[0], s[1] - fz[1]).toExponential(2)}` + (sc > 1 ? `\n주황 자취는 1/${sc.toFixed(1)}로 줄여 그림` : ""));
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 5. 원판의 정상 온도: 포아송 적분 (06-05) */
  (() => {
    const S = QSim.card("lab-c9-poisson"); if (!S) return;
    const cv = S.$("canvas");
    /* 경계 온도: 위쪽 반원 +T, 아래쪽 반원 −T.  u(r, θ) = (2T/π) arctan(2r sinθ/(1 − r²)) */
    const U = (r, th, T) => (r >= 1 ? NaN : ((2 * T) / Math.PI) * Math.atan2(2 * r * Math.sin(th), 1 - r * r));
    function draw() {
      const c = C(), T = S.val("T"), r = S.val("r"), thd = S.val("th"), th = (thd * Math.PI) / 180;
      const v = QSim.view(cv, 0.8), F = QSim.frame(v, { x0: -1.15, x1: 1.15, y0: -1.15, y1: 1.15, equal: true });
      heat(v, F, { x0: -1, x1: 1, y0: -1, y1: 1 }, 120, (x, y) => U(Math.hypot(x, y), Math.atan2(y, x), 1));
      const g = v.g; g.save(); g.lineWidth = 4;
      g.strokeStyle = c.main; g.beginPath(); g.arc(F.X(0), F.Y(0), F.sx, Math.PI, 2 * Math.PI); g.stroke();
      g.strokeStyle = c.acc; g.beginPath(); g.arc(F.X(0), F.Y(0), F.sx, 0, Math.PI); g.stroke(); g.restore();
      const px = r * Math.cos(th), py = r * Math.sin(th); F.dot(px, py, c.ink, 6);
      let avg = 0; const N = 2000; for (let k = 0; k < N; k++) { const p = (2 * Math.PI * (k + 0.5)) / N, f = Math.sin(p) >= 0 ? T : -T; avg += f * (1 - r * r) / (1 - 2 * r * Math.cos(th - p) + r * r); }
      avg /= N;
      S.out(`경계 온도: 위 반원 +${T}, 아래 반원 −${T}.  점 (r, θ) = (${r.toFixed(2)}, ${thd}°)\n` +
        `포아송 적분 (1/2π)∫ f(φ)(1 − r²)/(1 − 2r cos(θ − φ) + r²) dφ = ${avg.toFixed(4)}\n` +
        `닫힌 꼴 (2T/π) arctan(2r sin θ/(1 − r²)) = ${U(r, th, T).toFixed(4)},  중심 온도 = 경계의 평균 = 0`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();})();
