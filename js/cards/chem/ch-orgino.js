/* 화학과 유기·무기화학 실습 카드 묶음: ¹H NMR 갈라짐 (화학5), 결정장 분리와 CFSE (화학9) */
(() => {
  "use strict";
  const C = () => QSim.col();
  const RED = "#b5562a";

  /* 1. ¹H NMR 스펙트럼: 화학적 이동, 적분, n+1 갈라짐, 자기장 세기 (화학5-01-02) */
  (() => {
    const S = QSim.card("lab-ch5-nmr"); if (!S) return;
    const cv = S.$("canvas");
    // 신호: [이름, δ(ppm), H 수, [[J(Hz), 이웃 H 수], …]]  δ는 교재에 흔히 실린 대표값(용매, 농도에 따라 조금 다름)
    const MOL = {
      etoh: { n: "에탄올 CH₃CH₂OH", sig: [["CH₃", 1.22, 3, [[7.0, 2]]], ["CH₂", 3.69, 2, [[7.0, 3]]], ["OH", 2.61, 1, []]] },
      etac: { n: "아세트산 에틸 CH₃COOCH₂CH₃", sig: [["CH₃C=O", 2.05, 3, []], ["OCH₂", 4.12, 2, [[7.1, 3]]], ["CH₃", 1.26, 3, [[7.1, 2]]]] },
      mek: { n: "2-뷰탄온 CH₃COCH₂CH₃", sig: [["CH₃C=O", 2.14, 3, []], ["CH₂", 2.44, 2, [[7.3, 3]]], ["CH₃", 1.06, 3, [[7.3, 2]]]] },
      prbr: { n: "1-브로모프로페인 CH₃CH₂CH₂Br", sig: [["CH₃", 1.03, 3, [[7.3, 2]]], ["CH₂", 1.89, 2, [[7.3, 3], [6.8, 2]]], ["CH₂Br", 3.40, 2, [[6.8, 2]]]] },
      cum: { n: "큐멘 (아이소프로필벤젠)", sig: [["CH₃", 1.25, 6, [[6.9, 1]]], ["CH", 2.90, 1, [[6.9, 6]]], ["ArH", 7.25, 5, []]] },
      unk: { n: "미지 시료 X (C₄H₈O)", sig: [["a", 2.14, 3, []], ["b", 2.44, 2, [[7.3, 3]]], ["c", 1.06, 3, [[7.3, 2]]]] }
    };
    const pascal = (n) => { let r = [1]; for (let i = 0; i < n; i++) { const s = [1]; for (let j = 1; j < r.length; j++) s.push(r[j - 1] + r[j]); s.push(1); r = s; } return r; };
    const MULT = ["s (홑)", "d (두)", "t (세)", "q (네)", "오중", "육중", "칠중"];
    function lines(sig) {   // 1차 갈라짐: 이웃 무리마다 차례로 (n+1)갈래
      let L = [[0, 1]];
      sig[3].forEach(([J, n]) => { const p = pascal(n), t = p.reduce((a, b) => a + b, 0), M = []; L.forEach(([x, w]) => p.forEach((c, k) => M.push([x + (k - n / 2) * J, w * c / t]))); L = M; });
      return L;
    }
    function draw() {
      const c = C(), m = MOL[S.val("mol")], MHz = S.val("mhz"), lw = S.val("lw"), z = S.val("zoom") === "z";
      const all = m.sig.map((s) => ({ s, L: lines(s) }));
      let x0 = 8, x1 = 0;
      if (z) { const tgt = m.sig.reduce((b, s) => (s[3].length > b[3].length ? s : b), m.sig[0]); x0 = tgt[1] + 0.12; x1 = tgt[1] - 0.12; }
      const spec = (d) => { let y = 0; all.forEach(({ s, L }) => L.forEach(([hz, w]) => { const u = (d - s[1]) * MHz - hz; y += s[2] * w * (lw / 2) ** 2 / (u * u + (lw / 2) ** 2); })); return y; };
      const N = 1600, pts = []; let ymax = 0;
      for (let i = 0; i <= N; i++) { const d = x0 + (x1 - x0) * i / N, y = spec(d); pts.push([d, y]); if (y > ymax) ymax = y; }
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: 1, y0: 0, y1: 1.15, xl: "δ (ppm)", pad: 30, noGrid: true });
      const X = (d) => (x0 - d) / (x0 - x1);   // 왼쪽이 큰 δ
      const g = v.g; g.save(); g.strokeStyle = c.rule; g.fillStyle = c.ink3; g.font = "11px monospace";
      const st = z ? 0.02 : 1; for (let d = Math.ceil(x1 / st) * st; d <= x0 + 1e-9; d += st) { const X0 = f.X(X(d)); g.beginPath(); g.moveTo(X0, f.Y(0)); g.lineTo(X0, f.Y(0) + 4); g.stroke(); g.fillText(z ? d.toFixed(2) : d.toFixed(0), X0 - 8, f.Y(0) + 15); }
      g.beginPath(); g.moveTo(f.X(0), f.Y(0)); g.lineTo(f.X(1), f.Y(0)); g.stroke(); g.restore();
      f.path(pts.map(([d, y]) => [X(d), y / ymax]), c.main, 1.5);
      if (!z) {   // 적분 곡선
        let acc = 0; const tot = m.sig.reduce((a, s) => a + s[2], 0), ip = [];
        for (let i = 0; i <= N; i++) { acc += pts[i][1]; ip.push([X(pts[i][0]), 0.05 + acc]); }
        const top = acc; f.path(ip.map(([x, y]) => [x, 0.05 + (y - 0.05) / top * 1.0]), RED, 1.2);
        m.sig.forEach((s) => f.text(S.val("mol") === "unk" ? s[0] : s[0], X(s[1]), 1.08, c.ink2, "center"));
      }
      const tot = m.sig.reduce((a, s) => a + s[2], 0);
      const rows = m.sig.map((s) => {
        const ns = s[3].map((q) => q[1]), mult = s[3].length === 0 ? MULT[0] : s[3].length === 1 ? MULT[Math.min(6, ns[0])] : s[3].map((q) => MULT[q[1]].split(" ")[0]).join("·") + " (겹친 갈라짐)";
        const width = s[3].reduce((a, [J, n]) => a + J * n, 0);
        return `${S.val("mol") === "unk" ? "신호 " + s[0] : s[0]}: δ ${s[1].toFixed(2)}, ${s[2]}H, ${mult}${s[3].length ? `, J = ${s[3].map((q) => q[0].toFixed(1)).join("·")} Hz, 폭 ${width.toFixed(1)} Hz = ${(width / MHz).toFixed(3)} ppm` : ""}`;
      });
      S.out(`${m.n}, ${MHz} MHz, 선폭 ${lw.toFixed(1)} Hz\n${rows.join("\n")}\n적분 비 ${m.sig.map((s) => s[2]).join(" : ")} (전체 ${tot}H)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 결정장 분리, 고스핀·저스핀, CFSE, 자기 모멘트 (화학9-07-01, 07-02, 화학11-03-01, 03-02) */
  (() => {
    const S = QSim.card("lab-ch9-cfse"); if (!S) return;
    const cv = S.$("canvas");
    const PRE = {   // 대표값 (cm⁻¹). 교재마다 조금 다르다.
      ti: ["[Ti(H₂O)₆]³⁺", "oh", 1, 20300, 15000],
      feh: ["[Fe(H₂O)₆]²⁺", "oh", 6, 10400, 17600],
      fecn: ["[Fe(CN)₆]⁴⁻", "oh", 6, 32800, 17600],
      cof: ["[CoF₆]³⁻", "oh", 6, 13000, 21000],
      conh: ["[Co(NH₃)₆]³⁺", "oh", 6, 22900, 21000],
      cocl: ["[CoCl₄]²⁻", "td", 7, 3300, 22500]
    };
    let lock = false;
    const sel = S.$('[name="pre"]');
    sel.addEventListener("change", () => {
      const p = PRE[sel.value]; if (!p) return; lock = true;
      const set = (n, v) => { const e = S.$(`[name="${n}"]`); e.value = v; };
      set("geo", p[1]); set("d", p[2]); set("D", p[3]); set("P", p[4]); S.show(); lock = false; draw();
    });
    function config(geo, d, D, P, spin) {
      // 아래 준위 묶음(lo)과 위 준위 묶음(hi): 팔면체 t2g(3) 아래 −0.4Δ, eg(2) 위 +0.6Δ / 사면체 e(2) 아래 −0.6Δ, t2(3) 위 +0.4Δ
      const nLo = geo === "oh" ? 3 : 2, nHi = 5 - nLo, eLo = geo === "oh" ? -0.4 : -0.6, eHi = geo === "oh" ? 0.6 : 0.4;
      const occ = { lo: new Array(nLo).fill(0), hi: new Array(nHi).fill(0) };
      const order = spin === "high" ? [["lo", 1], ["hi", 1], ["lo", 2], ["hi", 2]] : [["lo", 1], ["lo", 2], ["hi", 1], ["hi", 2]];
      let left = d;
      for (const [k, lvl] of order) for (let i = 0; i < occ[k].length && left > 0; i++) if (occ[k][i] < lvl) { occ[k][i] += 1; left--; }
      const a = occ.lo.reduce((s, x) => s + x, 0), b = occ.hi.reduce((s, x) => s + x, 0);
      const pairs = occ.lo.filter((x) => x === 2).length + occ.hi.filter((x) => x === 2).length;
      const unp = occ.lo.filter((x) => x === 1).length + occ.hi.filter((x) => x === 1).length;
      const cf = a * eLo + b * eHi;   // Δ 단위
      return { occ, a, b, pairs, unp, cf, E: cf * D + pairs * P, nLo, nHi, eLo, eHi };
    }
    function draw() {
      if (lock) return;
      const c = C(), geo = S.val("geo"), d = S.val("d"), Do = S.val("D"), P = S.val("P");
      const hs = config(geo, d, Do, P, "high"), ls = config(geo, d, Do, P, "low");
      // 짝짓기 에너지는 구형장(Δ = 0)의 고스핀 배치와 비교한 "추가로 생긴 쌍"만 센다
      const base = config(geo, d, 0, P, "high").pairs;
      const Ehs = hs.cf * Do + (hs.pairs - base) * P, Els = ls.cf * Do + (ls.pairs - base) * P;
      const same = hs.unp === ls.unp, pick = same || Ehs <= Els ? hs : ls, spinName = same ? "구별 없음" : pick === hs ? "고스핀" : "저스핀";
      const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: 0, x1: 10, y0: -0.9, y1: 0.9, yl: "에너지 (Δ 단위)", pad: 44, noGrid: true }); f.axes({ noGrid: true });
      f.path([[0.3, 0], [2.3, 0]], c.ink3, 2, [4, 3]); f.text("구형장", 1.3, 0.06, c.ink3, "center");
      const draw1 = (lv, n, e, x0) => { for (let i = 0; i < n; i++) { const cx = x0 + i * 1.3; f.path([[cx - 0.5, e], [cx + 0.5, e]], c.main, 2.5); const o = pick.occ[lv][i]; if (o >= 1) f.arrow(cx - 0.15, e - 0.1, 0, 0.2, RED); if (o === 2) f.arrow(cx + 0.15, e + 0.1, 0, -0.2, RED); } };
      const xs = pick.nLo === 3 ? 4.4 : 5.05, xh = pick.nHi === 3 ? 4.4 : 5.05;
      draw1("lo", pick.nLo, pick.eLo, xs); draw1("hi", pick.nHi, pick.eHi, xh);
      f.text(geo === "oh" ? "t₂g" : "e", 8.6, pick.eLo - 0.03, c.ink2); f.text(geo === "oh" ? "eg" : "t₂", 8.6, pick.eHi - 0.03, c.ink2);
      f.path([[9.6, pick.eLo], [9.6, pick.eHi]], c.acc, 1.5); f.text("Δ", 9.75, (pick.eLo + pick.eHi) / 2, c.acc);
      const mu = Math.sqrt(pick.unp * (pick.unp + 2)), cfse = pick.cf * Do, kj = cfse * 0.011963;
      const lam = 1e7 / Do, lbl = geo === "oh" ? `t₂g^${pick.a} eg^${pick.b}` : `e^${pick.a} t₂^${pick.b}`;
      S.out(`${geo === "oh" ? "팔면체" : "사면체"} d${d}, Δ = ${Do} cm⁻¹, 짝짓기 에너지 P = ${P} cm⁻¹\n`
        + `${spinName}${same ? "" : ` (고스핀 ${Math.round(Ehs)} cm⁻¹, 저스핀 ${Math.round(Els)} cm⁻¹ 중 낮은 쪽)`}: ${lbl}, 홀전자 ${pick.unp}개\n`
        + `CFSE = ${pick.cf.toFixed(1)}Δ = ${Math.round(cfse)} cm⁻¹ = ${kj.toFixed(0)} kJ/mol (짝짓기 에너지 빼기 전)\n`
        + `스핀만의 자기 모멘트 √(n(n+2)) = ${mu.toFixed(2)} BM\n`
        + `Δ에 해당하는 빛의 파장 10⁷/Δ = ${lam.toFixed(0)} nm${d === 1 ? " (d¹은 이 파장에서 d-d 흡수띠 하나)" : " (d¹이 아니면 흡수띠가 여러 개라 Δ와 바로 같지 않다)"}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
