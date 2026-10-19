/* 전전14 컴퓨터구조 탐구 카드 묶음
   1 Amdahl 법칙(01-02)  2 IEEE 754 덧셈(03-02)  3 파이프라인 해저드(05-01)  4 캐시 시뮬레이터(06-02) */
(() => {
  "use strict";
  if (!window.QSim) return;
  const C = () => QSim.col();
  const f2 = (x, d = 3) => (Math.abs(x) < 5e-13 ? 0 : x).toFixed(d);

  /* 2. IEEE 754 단정밀도 덧셈 */
  (() => {
    const S = QSim.card("exp-e14-float"); if (!S) return;
    const cv = S.$("canvas");
    const fb = new Float32Array(1), ub = new Uint32Array(fb.buffer);
    const bits = (x) => { fb[0] = x; return ub[0] >>> 0; };
    const fromBits = (u) => { ub[0] = u >>> 0; return fb[0]; };
    const fmt = (u) => { const s = (u >>> 31) & 1, e = (u >>> 23) & 255, m = u & 0x7fffff; return { s, e, m, str: `${s} ${e.toString(2).padStart(8, "0")} ${m.toString(2).padStart(23, "0")}` }; };
    function draw() {
      const c = C();
      const a = parseFloat(S.$('[name="a"]').value), b = parseFloat(S.$('[name="b"]').value);
      if (!isFinite(a) || !isFinite(b)) { S.out("두 칸에 수를 넣으세요(예: 0.1, 0.2)."); return; }
      const ua = bits(a), ub2 = bits(b), A = fromBits(ua), B = fromBits(ub2), sum = Math.fround(A + B), us = bits(sum);
      const fa = fmt(ua), fbb = fmt(ub2), fs = fmt(us);
      const ea = fa.e - 127, eb = fbb.e - 127, shift = Math.abs(ea - eb);
      const v = QSim.view(cv, 0.3), g = v.g, W = v.W; const cw = Math.min(14, (W - 80) / 32);
      [[fa, "a"], [fbb, "b"], [fs, "a+b"]].forEach(([f, nm], r) => {
        const u = r === 0 ? ua : r === 1 ? ub2 : us;
        g.fillStyle = c.ink2; g.font = "12px monospace"; g.fillText(nm, 4, 20 + r * 24);
        for (let i = 0; i < 32; i++) { const bit = (u >>> (31 - i)) & 1; g.fillStyle = i === 0 ? c.warn : i < 9 ? c.acc : c.main; g.globalAlpha = bit ? 1 : 0.15; g.fillRect(48 + i * cw, 8 + r * 24, cw - 1, 16); }
        g.globalAlpha = 1;
      });
      S.out(`a = ${a} → 저장값 ${A.toPrecision(9)}, 비트 ${fa.str} (지수 ${ea})\n` +
        `b = ${b} → 저장값 ${B.toPrecision(9)}, 비트 ${fbb.str} (지수 ${eb})\n` +
        `덧셈: 지수가 작은 쪽 가수를 ${shift}자리 오른쪽으로 밀어 맞춘 뒤 더하고, 정규화·반올림 → ${sum.toPrecision(9)} (비트 ${fs.str}, 지수 ${fs.e - 127})\n` +
        `배정밀도로 직접 더한 a + b = ${a + b}. 빨강: 부호, 주황: 지수(바이어스 127), 파랑: 가수 23비트`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 5단계 파이프라인과 데이터 해저드 */
  (() => {
    const S = QSim.card("exp-e14-pipe"); if (!S) return;
    const cv = S.$("canvas");
    // 명령: [텍스트, 쓰는 레지스터, 읽는 레지스터들, load인가]
    const PROGS = {
      alu: [["add x1, x2, x3", 1, [2, 3], false], ["sub x4, x1, x5", 4, [1, 5], false], ["and x6, x1, x7", 6, [1, 7], false], ["or x8, x4, x6", 8, [4, 6], false]],
      load: [["lw x1, 0(x2)", 1, [2], true], ["add x3, x1, x4", 3, [1, 4], false], ["sw x3, 4(x2)", -1, [3, 2], false], ["addi x5, x5, 1", 5, [5], false]],
      sched: [["lw x1, 0(x2)", 1, [2], true], ["addi x5, x5, 1", 5, [5], false], ["add x3, x1, x4", 3, [1, 4], false], ["sw x3, 4(x2)", -1, [3, 2], false]]
    };
    function draw() {
      const c = C(), prog = PROGS[S.val("prog")], fwd = S.val("fwd");
      // 각 명령의 ID 시작 사이클(0부터). 레지스터 파일은 앞 반주기 쓰기, 뒤 반주기 읽기
      const idc = [], wbc = [], exc = [], memc = [];
      prog.forEach(([t, wr, rd, isLoad], i) => {
        let id = i === 0 ? 1 : idc[i - 1] + 1;
        rd.forEach((r) => {
          for (let j = 0; j < i; j++) {
            const [, wj, , lj] = prog[j]; if (wj !== r || wj <= 0) continue;
            let need;
            if (!fwd) need = wbc[j];                // WB 사이클에 ID(같은 사이클 읽기 허용)
            else need = lj ? memc[j] + 1 : exc[j] + 1 - 1;   // 전달: ALU 결과는 다음 명령 EX로, load는 MEM 뒤
            if (fwd) { const exNeed = lj ? memc[j] + 1 : exc[j] + 1; id = Math.max(id, exNeed - 1); }
            else id = Math.max(id, need);
          }
        });
        idc.push(id); exc.push(id + 1); memc.push(id + 2); wbc.push(id + 3);
      });
      const total = wbc[wbc.length - 1] + 1, n = prog.length, stalls = total - (n + 4);
      const v = QSim.view(cv, 0.42), g = v.g, W = v.W, H = v.H, lw = 120, cw = Math.min(40, (W - lw - 10) / total), rh = Math.min(26, (H - 20) / n);
      g.font = "11px monospace";
      prog.forEach(([t], i) => {
        g.fillStyle = c.ink2; g.fillText(t, 4, 18 + i * rh + rh / 2);
        const st = [["IF", idc[i] - 1], ["ID", idc[i]], ["EX", exc[i]], ["MEM", memc[i]], ["WB", wbc[i]]];
        for (let k = (i === 0 ? 0 : idc[i - 1]); k < idc[i] - 1; k++) { g.fillStyle = c.rule; g.fillRect(lw + k * cw, 6 + i * rh, cw - 2, rh - 4); g.fillStyle = c.ink3; g.fillText("--", lw + k * cw + 4, 18 + i * rh + rh / 2 - 4); }
        st.forEach(([nm, k], j) => { g.fillStyle = [c.soft, c.acc, c.main, c.warn, c.ink3][j]; g.globalAlpha = 0.85; g.fillRect(lw + k * cw, 6 + i * rh, cw - 2, rh - 4); g.globalAlpha = 1; g.fillStyle = c.card; g.fillText(nm, lw + k * cw + 3, 18 + i * rh + rh / 2 - 4); });
      });
      S.out(`${fwd ? "전달(forwarding) 있음" : "전달 없음(레지스터 파일: 앞 반주기 쓰기, 뒤 반주기 읽기)"}. 명령 ${n}개, 전체 ${total}사이클, 멈춤 ${stalls}사이클(이상적 ${n + 4}사이클)\n` +
        `CPI(시작·끝 제외 근사) = ${f2((n + stalls) / n, 2)}. 회색 '--' 칸은 앞 명령의 결과를 기다리며 멈춘 사이클(거품)입니다.`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 캐시 시뮬레이터 */
  (() => {
    const S = QSim.card("exp-e14-cache"); if (!S) return;
    const cv = S.$("canvas");
    function trace(kind) {
      const t = [];
      if (kind === "seq") for (let i = 0; i < 1024; i++) t.push(4 * i);                         // int 배열 1024개 차례로
      if (kind === "stride") for (let r = 0; r < 4; r++) for (let i = 0; i < 256; i++) t.push(64 * i);   // 64바이트 간격 256개를 4번
      if (kind === "conflict") for (let i = 0; i < 512; i++) { t.push(4 * i); t.push(4096 + 4 * i); }  // 4 KB 떨어진 두 배열을 번갈아
      return t;
    }
    function draw() {
      const c = C(), size = 2 ** S.val("lsz"), block = 2 ** S.val("lbl"), ways = +S.val("ways"), kind = S.val("kind");
      const sets = size / (block * ways), ob = Math.log2(block), ib = Math.log2(sets), tb = 32 - ob - ib;
      const cache = Array.from({ length: sets }, () => []);   // 각 집합: 태그 목록(앞이 최근)
      let hit = 0, miss = 0; const tr = trace(kind), hist = [];
      tr.forEach((a) => {
        const blk = Math.floor(a / block), set = blk % sets, tag = Math.floor(blk / sets), line = cache[set], k = line.indexOf(tag);
        if (k >= 0) { hit++; line.splice(k, 1); line.unshift(tag); hist.push(1); }
        else { miss++; line.unshift(tag); if (line.length > ways) line.pop(); hist.push(0); }
      });
      const hr = hit / tr.length, amat = 1 + (1 - hr) * 100;
      const v = QSim.view(cv, 0.3), g = v.g, W = v.W, H = v.H, w = (W - 20) / hist.length;
      hist.forEach((h, i) => { g.fillStyle = h ? c.main : c.warn; g.fillRect(10 + i * w, h ? H * 0.3 : H * 0.15, Math.max(1, w), h ? H * 0.4 : H * 0.7); });
      S.out(`캐시 ${size} B, 블록 ${block} B, ${ways}-way → 집합 ${sets}개. 32비트 주소 = 태그 ${tb} | 인덱스 ${ib} | 오프셋 ${ob}비트\n` +
        `접근 ${tr.length}번: 적중 ${hit}, 실패 ${miss}, 적중률 ${f2(hr * 100, 2)}%. AMAT = 1 + 실패율 × 100 = ${f2(amat, 2)} 사이클(적중 1, 실패 벌점 100 가정)\n` +
        `막대: 파랑 = 적중, 빨강 = 실패(접근 순서대로)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
