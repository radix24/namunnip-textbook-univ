/* 전전1 ECE101 탐구 카드 묶음
   1 이진 탐색(03-02)  2 사인파와 표본 수(04-01)  3 합성곱 필터(06-01)  4 해시 사슬(06-03)  5 스트리밍 비트율(06-02) */
(() => {
  "use strict";
  if (!window.QSim) return;
  const C = () => QSim.col();
  const f2 = (x, d = 2) => (Math.abs(x) < 5e-13 ? 0 : x).toFixed(d);

  /* 1. 이진 탐색과 선형 탐색 */
  (() => {
    const S = QSim.card("exp-e1-bsearch"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), k = S.val("k"), n = 2 ** k, ti = Math.min(n - 1, Math.round(S.val("t") * (n - 1))), step = S.val("s");
      const target = 2 * ti;   // 자료: 0, 2, 4, …, 2(n − 1)
      // 이진 탐색 기록
      const hist = []; let lo = 0, hi = n - 1;
      while (lo <= hi) { const mid = (lo + hi) >> 1; hist.push([lo, hi, mid]); if (mid === ti) break; if (mid < ti) lo = mid + 1; else hi = mid - 1; }
      const s = Math.min(step, hist.length), total = hist.length;
      const v = QSim.view(cv, 0.3), W = v.W, H = v.H, g = v.g, x0 = 10, x1 = W - 10, X = (i) => x0 + (x1 - x0) * i / n;
      // 전체 자료 막대
      g.fillStyle = c.rule; g.fillRect(x0, H * 0.25, x1 - x0, H * 0.2);
      g.fillStyle = c.rule; g.fillRect(x0, H * 0.62, x1 - x0, H * 0.2);
      if (s > 0) {
        const [l, h, m] = hist[s - 1];
        g.fillStyle = c.soft; g.fillRect(X(l), H * 0.25, X(h + 1) - X(l), H * 0.2);
        g.fillStyle = c.main; g.fillRect(X(m), H * 0.22, Math.max(2, X(m + 1) - X(m)), H * 0.26);
      }
      // 선형 탐색: 같은 횟수만큼 앞에서부터 본 칸
      g.fillStyle = c.acc; g.fillRect(x0, H * 0.62, X(Math.min(s, n)) - x0, H * 0.2);
      g.fillStyle = c.warn; g.fillRect(X(ti), H * 0.18, Math.max(2, X(ti + 1) - X(ti)), H * 0.7);
      g.fillStyle = c.ink2; g.font = "12px sans-serif";
      g.fillText("이진 탐색: 남은 구간(연보라)과 비교한 칸(파랑)", x0, H * 0.17);
      g.fillText("선형 탐색: 같은 횟수 동안 본 칸(주황)", x0, H * 0.58);
      let msg = `자료 ${n}개(0, 2, 4, …, ${2 * (n - 1)}), 찾는 값 ${target}(${ti}번째 칸, 빨간 선)\n`;
      if (s === 0) msg += "단계 0: 아직 비교하지 않았습니다.";
      else { const [l, h, m] = hist[s - 1]; msg += `${s}번째 비교: 구간 [${l}, ${h}]의 가운데 ${m}번 칸(값 ${2 * m}) ${m === ti ? "= 찾음" : 2 * m < target ? "< 목표 → 오른쪽 반만 남김" : "> 목표 → 왼쪽 반만 남김"}`; }
      msg += `\n찾기까지 이진 탐색 ${total}번, 선형 탐색 ${ti + 1}번. 자료가 2배가 되면 이진 탐색은 1번만 늘어납니다(최대 ${k + 1}번).`;
      S.out(msg);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 합성곱 필터(CNN의 한 층) */
  (() => {
    const S = QSim.card("exp-e1-conv"); if (!S) return;
    const cv = S.$("canvas");
    const img = [
      "00000000",
      "01111110",
      "01111110",
      "00011000",
      "00011000",
      "00011000",
      "00011000",
      "00000000"].map((r) => r.split("").map(Number));
    const K = {
      v: { n: "세로 경계", k: [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]] },
      h: { n: "가로 경계", k: [[-1, -1, -1], [0, 0, 0], [1, 1, 1]] },
      b: { n: "흐리게(평균)", k: [[1, 1, 1], [1, 1, 1], [1, 1, 1]].map((r) => r.map((x) => x / 9)) },
      s: { n: "선명하게", k: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]] }
    };
    let geo = null;
    function conv(k) {
      const out = [];
      for (let i = 0; i < 6; i++) { out.push([]); for (let j = 0; j < 6; j++) { let s = 0; for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) s += img[i + a][j + b] * k[a][b]; out[i].push(s); } }
      return out;
    }
    function draw() {
      const c = C(), key = S.val("ker"), k = K[key].k, r = S.val("r"), q = S.val("c"), out = conv(k);
      const v = QSim.view(cv, 0.42), g = v.g, W = v.W, cell = Math.min((W - 60) / 17, 26), top = 24;
      const gx = [10, 10 + 8 * cell + 20, 10 + 11 * cell + 40]; geo = { gx, top, cell };
      const shade = (val, mx) => { const t = Math.max(-1, Math.min(1, val / mx)); return t >= 0 ? `rgba(75,79,224,${t})` : `rgba(242,179,61,${-t})`; };
      g.font = "12px sans-serif"; g.fillStyle = c.ink2;
      g.fillText("입력 8×8 (칸을 눌러 바꾸기)", gx[0], 14); g.fillText("필터 3×3", gx[1], 14); g.fillText("출력 6×6", gx[2], 14);
      for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
        g.fillStyle = img[i][j] ? c.ink : c.card; g.fillRect(gx[0] + j * cell, top + i * cell, cell - 1, cell - 1);
        g.strokeStyle = c.rule; g.strokeRect(gx[0] + j * cell, top + i * cell, cell - 1, cell - 1);
      }
      g.strokeStyle = c.warn; g.lineWidth = 2; g.strokeRect(gx[0] + q * cell, top + r * cell, 3 * cell - 1, 3 * cell - 1); g.lineWidth = 1;
      for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
        g.fillStyle = shade(k[a][b], 5); g.fillRect(gx[1] + b * cell, top + a * cell, cell - 1, cell - 1);
        g.fillStyle = c.ink; g.textAlign = "center"; g.fillText(Math.abs(k[a][b] - Math.round(k[a][b])) > 1e-9 ? "1/9" : String(k[a][b]), gx[1] + b * cell + cell / 2, top + a * cell + cell / 2 + 4); g.textAlign = "left";
      }
      const mx = Math.max(1e-9, ...out.flat().map(Math.abs));
      for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) {
        g.fillStyle = shade(out[i][j], mx); g.fillRect(gx[2] + j * cell, top + i * cell, cell - 1, cell - 1);
        g.strokeStyle = c.rule; g.strokeRect(gx[2] + j * cell, top + i * cell, cell - 1, cell - 1);
      }
      g.strokeStyle = c.warn; g.lineWidth = 2; g.strokeRect(gx[2] + q * cell, top + r * cell, cell - 1, cell - 1); g.lineWidth = 1;
      const terms = []; for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) if (k[a][b] !== 0) terms.push(`${img[r + a][q + b]}×${key === "b" ? "1/9" : k[a][b]}`);
      S.out(`필터: ${K[key].n}. 출력 (${r}, ${q}) 칸 = 빨간 3×3 칸과 필터의 같은 자리끼리 곱해 더한 값\n= ${terms.join(" + ")} = ${f2(out[r][q], 2)}\n` +
        `출력 범위 ${f2(Math.min(...out.flat()), 2)} ~ ${f2(Math.max(...out.flat()), 2)}. 파랑은 양수, 주황은 음수, 진할수록 큽니다. 같은 필터를 모든 자리에 밀며 적용하는 것이 CNN의 한 층입니다.`);
    }
    cv.addEventListener("click", (e) => {
      if (!geo) return;
      const rc = cv.getBoundingClientRect(), x = e.clientX - rc.left, y = e.clientY - rc.top;
      const j = Math.floor((x - geo.gx[0]) / geo.cell), i = Math.floor((y - geo.top) / geo.cell);
      if (i >= 0 && i < 8 && j >= 0 && j < 8) { img[i][j] = 1 - img[i][j]; draw(); }
    });
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 해시 사슬과 작업 증명 (학습용 FNV-1a 32비트 해시) */
  (() => {
    const S = QSim.card("exp-e1-chain"); if (!S) return;
    const cv = S.$("canvas");
    const fnv = (s) => { let h = 0x811c9dc5; for (const ch of new TextEncoder().encode(s)) { h ^= ch; h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, "0"); };
    const N = 4, nonce = new Array(N).fill(0), prevStored = new Array(N).fill("00000000");
    let tries = 0;
    const data = (i) => S.$(`[name="d${i}"]`).value;
    const hashOf = (i) => fnv(prevStored[i] + "|" + data(i) + "|" + nonce[i]);
    function mine() {
      const z = "0".repeat(+S.val("diff")); tries = 0;
      for (let i = 0; i < N; i++) {
        prevStored[i] = i === 0 ? "00000000" : hashOf(i - 1);
        nonce[i] = 0; while (!hashOf(i).startsWith(z)) { nonce[i]++; tries++; }
        tries++;
      }
      draw();
    }
    function draw() {
      const c = C(), z = "0".repeat(+S.val("diff"));
      const v = QSim.view(cv, 0.36), g = v.g, W = v.W, H = v.H, bw = (W - 20 - 3 * 14) / N;
      let ok = true; const lines = [];
      for (let i = 0; i < N; i++) {
        const h = hashOf(i), linkOk = i === 0 || prevStored[i] === hashOf(i - 1), powOk = h.startsWith(z), good = ok && linkOk && powOk;
        ok = good;
        const x = 10 + i * (bw + 14);
        g.fillStyle = good ? "rgba(75,79,224,0.10)" : "rgba(217,83,79,0.15)"; g.fillRect(x, 10, bw, H - 20);
        g.strokeStyle = good ? c.main : c.warn; g.lineWidth = 2; g.strokeRect(x, 10, bw, H - 20); g.lineWidth = 1;
        g.fillStyle = c.ink; g.font = "12px monospace";
        g.fillText(`블록 ${i}`, x + 6, 28);
        g.fillText(`앞 ${prevStored[i]}`, x + 6, 48);
        g.fillText(`nonce ${nonce[i]}`, x + 6, 66);
        g.fillStyle = powOk ? c.ink : c.warn; g.fillText(`해시 ${h}`, x + 6, 84);
        if (i > 0) { g.strokeStyle = linkOk ? c.main : c.warn; g.beginPath(); g.moveTo(x - 14, H / 2); g.lineTo(x, H / 2); g.stroke(); }
        lines.push(`블록 ${i}: ${good ? "유효" : !linkOk ? "앞 블록 해시와 불일치" : !powOk ? `해시가 ${z}로 시작하지 않음` : "앞 블록이 무효"}`);
      }
      S.out(`${lines.join(" / ")}\n난이도: 해시가 16진수 ${z.length}자리의 0으로 시작해야 함(평균 ${16 ** z.length}번 시도). 마지막 채굴에서 시도 ${tries}번.\n` +
        `학습용 간단한 해시(FNV-1a 32비트)입니다. 실제 비트코인은 SHA-256을 두 번 쓰고 난이도가 비교할 수 없이 높습니다.`);
    }
    S.$(".mine").addEventListener("click", mine);
    S.$('[name="diff"]').addEventListener("input", mine);
    S.on(draw); QSim.redrawOn(draw); mine();
  })();

})();
