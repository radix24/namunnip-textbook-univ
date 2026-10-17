/* 학습 기록: 성취기준마다 "할 수 있다" 표시를 이 브라우저(localStorage "quri-progress")에 둔다.
   단원 페이지 점검표를 잇고, 과목 목차와 메인 화면의 진도 막대를 채운다. 서버나 계정은 없다. */
window.QProgress = (() => {
  "use strict";
  const KEY = "quri-progress";
  let data = {};
  try { data = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { data = {}; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { console.warn("학습 기록을 저장하지 못함", e); } };
  const done = (code) => !!data[code];
  const set = (code, v) => { if (v) data[code] = 1; else delete data[code]; save(); };
  const countPrefix = (prefix, list) => list.filter((c) => c.startsWith(prefix) && done(c)).length;

  /* 단원 페이지: 점검표 */
  document.querySelectorAll(".q-checklist").forEach((box) => {
    const boxes = [...box.querySelectorAll("input[data-std]")];
    const out = box.querySelector(".q-count");
    const paint = () => {
      let k = 0;
      boxes.forEach((b) => { b.checked = done(b.dataset.std); b.closest("li").classList.toggle("done", b.checked); if (b.checked) k++; });
      if (out) out.textContent = `${k}/${boxes.length} 할 수 있음`;
    };
    boxes.forEach((b) => b.addEventListener("change", () => { set(b.dataset.std, b.checked); paint(); }));
    paint();
  });

  /* 과목 목차: 단원별 막대 (성취기준 목록은 toc.js에서) */
  const U = window.UNIV;
  if (U) {
    const units = {};
    U.forEach((d) => d.courses.forEach((c) => c.units.forEach((u) => { units[`${c.code}-${u.n}`] = u.s.map((s) => s.c); })));
    document.querySelectorAll(".c-unit[data-unit]").forEach((el) => {
      const list = units[el.dataset.unit] || [];
      const k = list.filter(done).length;
      const i = el.querySelector(".lp-bar i"), t = el.querySelector(".lp-t");
      if (i) i.style.setProperty("--p", list.length ? (k / list.length).toFixed(3) : 0);
      if (t) t.textContent = `성취기준 ${k}/${list.length}`;
    });
  }
  return { done, set, countPrefix, all: () => ({ ...data }) };
})();
