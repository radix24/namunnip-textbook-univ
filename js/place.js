/* 학교·학과 선택(localStorage "quri-place" = "yonsei/phy")과 학과별 틀.
   절·대단원·과목·시험 페이지는 풀 모듈 하나에 한 장(c/<모듈 id>/…)이라 학과와 무관하게 만들어진다.
   여기서 고른 학과의 요약(data/yonsei-<학과>.json, tools/place.py)을 읽어
   - 위쪽 경로의 학과 이름과 과목 이름을 그 학과에서 쓰는 이름으로 바꾸고(공통1 → 공학수학(1) 등)
   - 상단바에 '물리학과' 칩을 단다(누르면 메인의 학과 고르기). 학교 이름은 화면에 쓰지 않는다(자료의 키로만).
   주소의 ?d=<학과>는 그 학과로 보이되 저장값은 바꾸지 않는다(공유 주소). */
window.QPlace = (() => {
  "use strict";
  const KEY = "quri-place", SCHOOL = "yonsei", SCHOOL_NAME = "연세대";
  const ROOT = new URL("../", document.currentScript.src);
  const DEPTS = ["math", "phy", "chem", "astro", "stat", "ee", "me"];
  const saved = () => { try { const v = (localStorage.getItem(KEY) || "").split("/")[1]; return DEPTS.includes(v) ? v : ""; } catch (e) { return ""; } };
  const urlDept = () => { const v = new URLSearchParams(location.search).get("d"); return DEPTS.includes(v) ? v : ""; };
  const get = () => urlDept() || saved();
  const set = (d) => { try { if (d) localStorage.setItem(KEY, `${SCHOOL}/${d}`); else localStorage.removeItem(KEY); } catch (e) { /* 저장을 막은 브라우저: 이 화면에서만 동작 */ } };
  const cache = {};
  const load = (d) => cache[d] || (cache[d] = fetch(new URL(`data/${SCHOOL}-${d}.json`, ROOT)).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }));
  const index = () => cache._i || (cache._i = fetch(new URL(`data/${SCHOOL}.json`, ROOT)).then((r) => r.json()));
  const pool = () => cache._p || (cache._p = fetch(new URL("data/pool.json", ROOT)).then((r) => r.json()));
  const api = { KEY, SCHOOL, SCHOOL_NAME, DEPTS, ROOT, get, set, saved, load, index, pool };

  /* 풀 모듈 페이지: 학과 틀 채우기 */
  const mod = document.body.dataset.module, d = get();
  const chip = document.querySelector(".place-chip");
  if (!d) {
    if (chip) { chip.hidden = false; chip.textContent = "학과 고르기"; }
    return api;
  }
  load(d).then((dept) => {
    if (chip) { chip.hidden = false; chip.textContent = dept.name; chip.title = "학과 바꾸기"; }
    const deptHref = new URL(`./?d=${d}`, ROOT).href;
    const c = mod ? dept.courses.find((x) => x.id === mod) : null;
    if (!mod || c) document.querySelectorAll("[data-place=dept]").forEach((a) => { a.textContent = dept.name; a.href = deptHref; });
    if (!mod) return;
    if (!c) {   // 이 학과 배치에 없는 모듈: 경로는 교재의 분야 그대로 두고, 알림만 한다
      const meta = document.querySelector(".topic-hero .meta, .cx-side .meta");
      if (meta && !meta.querySelector(".place-off")) meta.insertAdjacentHTML("beforeend", `<span class="place-off mono">${dept.name} 교과과정 밖의 교재</span>`);
      return;
    }
    document.querySelectorAll("[data-place=course]").forEach((el) => {
      const pool = el.textContent;
      if (pool !== c.name) { el.textContent = c.name; el.title = `교재 이름: ${pool}`; document.title = document.title.replace(pool, c.name); }
    });
    /* 과목 목차: 학기·이수구분·학점, 학정번호, 선수·이어지는 과목을 이 학과의 배치로 */
    const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
    const term = document.querySelector("[data-place=term]");
    if (term) term.textContent = `${c.y}학년 ${c.sem}학기 · ${c.kind} · ${c.cr}학점`;
    const no = document.querySelector("[data-place=no]");
    if (no && c.no) no.textContent = `/ ${c.no}`;
    const box = document.querySelector("[data-place=path]");
    if (box) {
      const byId = new Map(dept.courses.map((x) => [x.id, x]));
      const link = (x) => `<a href="${new URL(`c/${x.id}/`, ROOT).href}">${esc(x.name)}</a>`;
      const t = (x) => Math.min(...(String(x.sem).match(/[12]/g) || ["1"]).map((s) => (x.y - 1) * 2 + +s - 1));
      const later = dept.courses.filter((x) => x.pre.includes(c.id) && t(x) > t(c)), near = Math.min(...later.map(t));
      const pre = c.pre.map((k) => byId.get(k)).filter(Boolean), nx = later.filter((x) => t(x) === near);
      const html = (pre.length ? `<p><span class="dim">먼저 공부할 과목</span>${pre.map(link).join(", ")}</p>` : "") +
        (nx.length ? `<p><span class="dim">이어지는 과목</span>${nx.map(link).join(" · ")}</p>` : "");
      if (html) { box.innerHTML = html; box.hidden = false; }
      else {   // 학과 배치 안에 선수·후속 과목이 없으면, 교재의 '먼저 공부할 내용'(고교 과정 등)만 남기고 다른 학과 과목 목록은 뺀다
        [...box.querySelectorAll("p")].filter((p) => p.textContent.includes("이어지는 과목")).forEach((p) => p.remove());
        box.hidden = !box.querySelector("p");
      }
    }
  }).catch((e) => console.warn("학과 요약을 읽지 못함", e));
  return api;
})();
