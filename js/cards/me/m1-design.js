/* 기계1 기계공학창의설계: 요구 사항 고르기 (01-02) */
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
})();
