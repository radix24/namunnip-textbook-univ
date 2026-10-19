/* 기계1 기계공학창의설계: 요구 사항 고르기 (01-02), 형태 분석표 (02-01), 평가 행렬 (03-02) */
(() => {
  "use strict";

  /* ── 사용자 요구 → 측정 가능한 요구 사항 고르기 ── */
  (() => {
    const S = QSim.card("lab-me-spec"); if (!S) return;
    // 각 요구: 후보 [문장, 종류] — good: 측정 가능, vague: 모호함, sol: 해결책
    const Q = [
      { need: "길에서 휴대폰이 빠지지 않았으면", c: [["아주 튼튼하게 고정한다", "vague"], ["3g, 10~50 Hz 진동 30분에 이탈 없음", "good"], ["스프링 집게 두 개로 잡는다", "sol"]] },
      { need: "한 손으로 끼우고 빼고 싶다", c: [["자석으로 붙인다", "sol"], ["쓰기 편하다", "vague"], ["한 손 장착·분리 3초 이하, 손힘 20 N 이하", "good"]] },
      { need: "내 자전거에도 맞았으면", c: [["핸들 지름 22~32 mm에 장착", "good"], ["대부분의 자전거에 맞는다", "vague"], ["고무 밴드로 감는다", "sol"]] },
      { need: "싸면 좋겠다", c: [["저렴한 재료를 쓴다", "vague"], ["사출 성형으로 만든다", "sol"], ["재료·제조비 개당 5000원 이하", "good"]] },
      { need: "비 올 때도 쓰고 싶다", c: [["방수 케이스를 붙인다", "sol"], ["물을 뿌린 상태에서 화면 터치 가능, 휴대폰에 물 고임 없음 (분무 10분)", "good"], ["비에 강하다", "vague"]] }
    ];
    const box = S.$(".spec-list");
    box.innerHTML = Q.map((q, i) => `<label style="display:block;margin:8px 0"><span><b>요구 ${i + 1}</b>: "${q.need}"</span><select name="q${i}" aria-label="요구 ${i + 1}의 요구 사항"><option value="-1">— 고르세요 —</option>${q.c.map((c, j) => `<option value="${j}">${c[0]}</option>`).join("")}</select></label>`).join("");
    const WHY = { good: "측정 가능: 지표·목표값·시험 방법이 있다", vague: "모호함: 시험으로 만족 여부를 판단할 수 없다", sol: "해결책: 요구가 아니라 개념을 미리 정했다" };
    function draw() {
      let ok = 0, done = 0; const lines = [];
      Q.forEach((q, i) => { const v = +S.val(`q${i}`); if (v < 0) { lines.push(`요구 ${i + 1}: 아직 고르지 않음`); return; } done++; const k = q.c[v][1]; if (k === "good") ok++; lines.push(`요구 ${i + 1}: ${k === "good" ? "맞음" : "다시 생각"} — ${WHY[k]}`); });
      S.out(`${done}/5 고름, 측정 가능한 요구 사항 ${ok}개\n${lines.join("\n")}`);
    }
    S.on(draw); draw();
  })();

  /* ── 형태 분석표: 하위 기능별 해법 조합 (02-01) ── */
  (() => {
    const S = QSim.card("lab-me-morph"); if (!S) return;
    const ROWS = [
      { f: "휴대폰 잡기", o: ["집게", "고무 밴드", "자석 (휴대폰에 철판)", "케이스 결합", "흡착판"] },
      { f: "핸들에 고정", o: ["고무 밴드", "나사 클램프", "퀵릴리즈 레버", "케이블 타이"] },
      { f: "방향 조절", o: ["볼 조인트", "회전판", "고정"] },
      { f: "충격 흡수", o: ["없음", "고무 패드", "스프링"] }
    ];
    // 맞지 않는 조합 (설명)
    const BAD = [
      [(c) => c[0] === 4 && c[3] === 0, "흡착판 + 충격 흡수 없음: 진동에 흡착이 쉽게 풀린다"],
      [(c) => c[1] === 3 && c[2] !== 2, "케이블 타이 고정 + 방향 조절: 한 번 묶으면 다시 조절하려 할 때 잘라야 한다 (방향 조절의 뜻이 약함)"],
      [(c) => c[0] === 2 && c[3] === 2, "자석 + 스프링 충격 흡수: 흔들림이 커지면 자석이 옆으로 미끄러질 수 있어 시험 필요"]
    ];
    const box = S.$(".morph-list");
    box.innerHTML = ROWS.map((r, i) => `<label><span>${r.f}</span><select name="m${i}" aria-label="${r.f}">${r.o.map((o, j) => `<option value="${j}">${o}</option>`).join("")}</select></label>`).join("");
    const rng = () => Math.random();
    function draw() {
      const c = ROWS.map((_, i) => +S.val(`m${i}`)), total = ROWS.reduce((p, r) => p * r.o.length, 1);
      let bad = 0; const cs = []; const rec = (i, cur) => { if (i === ROWS.length) { cs.push(cur.slice()); return; } for (let j = 0; j < ROWS[i].o.length; j++) { cur.push(j); rec(i + 1, cur); cur.pop(); } }; rec(0, []);
      cs.forEach((x) => { if (BAD.some(([t]) => t(x))) bad++; });
      const warn = BAD.filter(([t]) => t(c)).map(([, w]) => w);
      S.out(`전체 조합 ${ROWS.map((r) => r.o.length).join(" × ")} = ${total}가지, 그중 표의 세 규칙에 걸리는 조합 ${bad}가지 → 남는 개념안 ${total - bad}가지\n고른 개념안: ${ROWS.map((r, i) => r.o[c[i]]).join(" + ")}\n${warn.length ? "주의: " + warn.join(" / ") : "규칙에 걸리지 않음 → 3.2절 평가 행렬로 비교할 후보"}`);
    }
    S.$(".reset").addEventListener("click", () => { ROWS.forEach((r, i) => { const e = S.$(`[name=m${i}]`); e.value = String(Math.floor(rng() * r.o.length)); }); draw(); });
    S.on(draw); draw();
  })();

  /* ── 가중 평가 행렬과 민감도 (03-02) ── */
  (() => {
    const S = QSim.card("lab-me-matrix"); if (!S) return;
    const [cv] = S.$$("canvas");
    const CRIT = ["고정력", "한 손 조작", "호환성", "비용", "무게"];
    const CON = [
      { n: "A 지렛대 집게", s: [4, 3, 4, 3, 3] },
      { n: "B 고무 밴드", s: [2, 4, 5, 5, 5] },
      { n: "C 자석 + 케이스", s: [4, 5, 2, 2, 4] },
      { n: "D 중력 잠금 집게", s: [5, 4, 4, 3, 3] }
    ];
    function draw() {
      const c = QSim.col(), w = CRIT.map((_, i) => S.val(`w${i}`)), max = 5 * w.reduce((p, q) => p + q, 0);
      const tot = CON.map((k) => k.s.reduce((p, s, i) => p + s * w[i], 0));
      const order = tot.map((t, i) => [t, i]).sort((a, b) => b[0] - a[0]);
      const v = QSim.view(cv, 0.45), f = QSim.frame(v, { x0: 0, x1: Math.max(max, 1), y0: -0.5, y1: CON.length - 0.5, pad: 4 }), G = v.g;
      CON.forEach((k, i) => {
        const y = CON.length - 1 - i, best = order[0][1] === i;
        G.fillStyle = best ? "rgba(52,160,110,.6)" : "rgba(75,79,224,.35)";
        G.fillRect(f.X(0) + 120, f.Y(y + 0.3), (f.X(tot[i]) - f.X(0)) * (1 - 130 / v.W), f.Y(y - 0.3) - f.Y(y + 0.3));
        f.text(k.n, 0.01 * max, y - 0.08, c.ink2);
        G.fillStyle = c.ink; G.font = "12px monospace"; G.fillText(String(tot[i]), f.X(0) + 124 + (f.X(tot[i]) - f.X(0)) * (1 - 130 / v.W), f.Y(y) + 4);
      });
      const gap = order[0][0] - order[1][0];
      S.out(`가중치 ${CRIT.map((n, i) => `${n} ${w[i]}`).join(", ")} → 만점 ${max}\n순위: ${order.map(([t, i]) => `${CON[i].n} ${t}`).join(" > ")}\n1위와 2위 차이 ${gap}점 (만점의 ${max ? ((100 * gap) / max).toFixed(1) : 0}%)${gap <= 0.05 * max ? " → 차이가 작다: 가중치 판단과 점수 근거를 확인하고 간이 시험으로 확정하세요" : ""}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* ── 개선 기록: 판별 지표 비교 (04-02, 가상 자료) ── */
  (() => {
    const S = QSim.card("lab-me-iter"); if (!S) return;
    const [cv] = S.$$("canvas");
    const VER = ["판 1", "판 2", "판 3", "판 4", "판 5"];
    const CHG = ["처음 시제품 (매끈한 고무 패드)", "패드를 무늬 고무로", "높이 조절 받침 추가", "손잡이 40 → 50 mm", "중력 잠금 걸쇠 추가"];
    const M = {
      drop: { name: "이탈률 (%)", v: [67, 33, 0, 20, 0], goal: 0, lower: true },
      force: { name: "여는 힘 (N)", v: [12, 12, 18, 14, 15], goal: 20, lower: true },
      mass: { name: "무게 (g)", v: [62, 64, 85, 88, 96], goal: 120, lower: true },
      cost: { name: "재료·제조비 (원)", v: [2100, 2300, 3200, 3300, 4100], goal: 5000, lower: true }
    };
    function draw() {
      const c = QSim.col(), key = S.val("m"), m = M[key], upto = S.val("k");
      const ymax = Math.max(...m.v, m.goal) * 1.15, v = QSim.view(cv, 0.5);
      const f = QSim.frame(v, { x0: 0.5, x1: 5.5, y0: 0, y1: ymax, xl: "판", yl: m.name, pad: 40 });
      f.axes({ noGrid: true });
      f.path([[0.5, m.goal], [5.5, m.goal]], c.acc, 1.5, [5, 4]);
      const pts = m.v.slice(0, upto).map((y, i) => [i + 1, y]);
      f.path(pts, c.main, 2); pts.forEach(([x, y]) => f.dot(x, y, y <= m.goal ? c.main : c.warn, 5));
      const rows = VER.slice(0, upto).map((n, i) => `${n}: ${CHG[i]} → ${Object.values(M).map((q) => `${q.name.split(" (")[0]} ${q.v[i]}`).join(", ")}`);
      const ok = VER.slice(0, upto).map((_, i) => Object.values(M).every((q) => q.v[i] <= q.goal));
      const best = ok.lastIndexOf(true);
      S.out(`${m.name}의 목표: ${m.goal} 이하 (초록 점선)\n${rows.join("\n")}\n모든 목표를 만족한 판: ${ok.map((b, i) => (b ? VER[i] : null)).filter(Boolean).join(", ") || "없음"}${best >= 0 ? ` (가장 최근 ${VER[best]})` : ""}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* ── 일정: 작업 기간과 주경로 (05-01) ── */
  (() => {
    const S = QSim.card("lab-me-cpm"); if (!S) return;
    const [cv] = S.$$("canvas");
    const T = [
      { id: "A", n: "사용자 조사", pre: [] }, { id: "B", n: "요구 사항 표", pre: ["A"] }, { id: "C", n: "개념 발상·선정", pre: ["B"] },
      { id: "D", n: "재료 주문(배송)", pre: ["B"] }, { id: "E", n: "간이 시제품 시험", pre: ["C"] }, { id: "F", n: "최종 시제품 제작", pre: ["D", "E"] },
      { id: "G", n: "시험과 개선", pre: ["F"] }, { id: "H", n: "발표·보고서", pre: ["G"] }
    ];
    function draw() {
      const c = QSim.col(), d = {}; T.forEach((t) => (d[t.id] = S.val(t.id)));
      const es = {}, ef = {}; T.forEach((t) => { es[t.id] = Math.max(0, ...t.pre.map((p) => ef[p])); ef[t.id] = es[t.id] + d[t.id]; });
      const end = Math.max(...T.map((t) => ef[t.id])), lf = {}, ls = {};
      [...T].reverse().forEach((t) => { const succ = T.filter((u) => u.pre.includes(t.id)); lf[t.id] = succ.length ? Math.min(...succ.map((u) => ls[u.id])) : end; ls[t.id] = lf[t.id] - d[t.id]; });
      const crit = T.filter((t) => ls[t.id] - es[t.id] === 0).map((t) => t.id);
      const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: -8, x1: end + 1, y0: -0.5, y1: T.length - 0.5, pad: 4 }), G = v.g;
      T.forEach((t, i) => {
        const y = T.length - 1 - i, cr = crit.includes(t.id);
        G.fillStyle = cr ? "rgba(214,80,60,.7)" : "rgba(75,79,224,.45)";
        G.fillRect(f.X(es[t.id]), f.Y(y + 0.3), (f.X(ef[t.id]) - f.X(es[t.id])), f.Y(y - 0.3) - f.Y(y + 0.3));
        f.text(`${t.id} ${t.n}`, -7.8, y - 0.12, c.ink2);
        if (!cr) { G.strokeStyle = c.ink3; G.setLineDash([3, 3]); G.strokeRect(f.X(ef[t.id]), f.Y(y + 0.3), f.X(lf[t.id]) - f.X(ef[t.id]), f.Y(y - 0.3) - f.Y(y + 0.3)); G.setLineDash([]); }
      });
      for (let x = 0; x <= end; x += 5) f.text(String(x), x, -0.45, c.ink3, "center");
      S.out(`프로젝트 길이 ${end}일\n주경로(빨강, 여유 0): ${crit.join(" → ")}\n여유가 있는 작업(점선 상자가 여유): ${T.filter((t) => !crit.includes(t.id)).map((t) => `${t.id} ${ls[t.id] - es[t.id]}일`).join(", ") || "없음"}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
