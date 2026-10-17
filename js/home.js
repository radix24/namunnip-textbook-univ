/* 메인 화면: js/toc.js(window.UNIV)에서 학과 탭 · 학년·학기 배치도 · 과목 목록을 그린다 */
(() => {
  "use strict";
  const U = window.UNIV;
  if (!U || document.body.dataset.view !== "home") return;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const md = (s) => esc(s).replace(/\*([^*]+)\*/g, "<i>$1</i>");   // 설계 문서의 *책 제목*
  const nStd = (c) => c.units.reduce((a, u) => a + u.s.length, 0);
  const TYPES = ["개념", "계산", "증명", "모형", "적용", "실습"];
  const TAB_KEY = "namunnip-univ-dept";

  /* ───── 학과 탭 ───── */
  const tabs = document.getElementById("dom-tabs");
  tabs.innerHTML = U.map((d) => `<button type="button" role="tab" data-dept="${d.id}" aria-selected="false" aria-controls="tree courses-list">${esc(d.short)}</button>`).join("");

  /* ───── 배치도: 학년-학기 열마다 과목 상자 ───── */
  const slot = (c) => `${c.y}-${c.sem}`;
  const slotName = (s) => { const [y, m] = s.split("-"); return `${y}학년 ${m}학기`; };
  const box = (c) => {
    const flags = [c.closed ? "2026 미개설" : "", c.onlyU ? "수강편람만" : ""].filter(Boolean);
    return `<a class="tbox" href="#c-${esc(c.code)}" data-code="${esc(c.code)}">
      <span class="lv mono">${esc(c.kind)} · ${c.cr}학점</span><b>${esc(c.name)}</b>
      <span class="pg mono">대단원 ${c.units.length} · 성취기준 ${nStd(c)}</span>
      ${flags.length ? `<span class="pg mono u-flag">${flags.map(esc).join(" · ")}</span>` : ""}</a>`;
  };
  const tree = document.getElementById("tree");
  function drawTree(d) {
    const slots = [...new Set(d.courses.map(slot))].sort();
    const n = d.courses.reduce((a, c) => { a.u += c.units.length; a.s += nStd(c); return a; }, { u: 0, s: 0 });
    tree.innerHTML = `
      <div class="tree-head"><h2>${esc(d.name)} <span class="mono small dim">${esc(d.college)}</span></h2>
        <p class="mono small dim">과목 ${d.courses.length} · 대단원 ${n.u} · 성취기준 ${n.s}. 열은 요람의 학년·학기 순서입니다.</p></div>
      <div class="tree-band tree-math" data-track="${d.id}"><div>${slots.map((s) => `
        <div class="m-col"><h3 class="mono">${slotName(s)}</h3>${d.courses.filter((c) => slot(c) === s).map(box).join("")}</div>`).join("")}
      </div></div>`;
  }

  /* ───── 과목 목록 ───── */
  const host = document.getElementById("courses-list");
  const stdLi = (s) => `<li data-hay="${esc((s.c + " " + s.t + " " + s.ty).toLowerCase())}"><span class="mono">${esc(s.c.split("-").slice(1).join("-"))}</span><span class="t">${esc(s.t)}</span>${s.ty ? `<span class="ty mono" data-ty="${esc(s.ty)}">${esc(s.ty)}</span>` : ""}</li>`;
  function drawList(d) {
    host.innerHTML = d.courses.map((c) => {
      const tyCount = TYPES.map((t) => [t, c.units.reduce((a, u) => a + u.s.filter((s) => s.ty === t).length, 0)]).filter(([, k]) => k);
      const units = c.units.map((u) => `
        <div class="chapter" data-hay="${esc((u.t + " " + u.el).toLowerCase())}">
          <h3><span class="mono">${u.n}</span>${esc(u.t)}${u.src ? `<span class="u-src mono">${esc(u.src)}</span>` : ""}</h3>
          ${u.el ? `<p class="u-el small">${esc(u.el)}</p>` : ""}
          <ol class="u-stds">${u.s.map(stdLi).join("")}</ol>
        </div>`).join("");
      return `
      <section class="course" id="c-${esc(c.code)}" data-y="${c.y}" data-hay="${esc((c.name + " " + c.sub.join(" ") + " " + c.code).toLowerCase())}">
        <div class="course-head">
          <span class="mono">${esc(c.code)} · ${esc(c.sub.join(" / "))}</span>
          <h2>${esc(c.name)}</h2>
          <p class="count mono dim">${c.y}학년 ${esc(c.sem)}학기 · ${esc(c.kind)} · ${c.cr}학점</p>
          <p class="count mono dim">대단원 ${c.units.length} · 성취기준 ${nStd(c)}</p>
          ${c.open ? `<p class="small"><b>2026 개설</b> ${esc(c.open)}</p>` : ""}
          ${c.pre ? `<p class="small"><b>선수</b> ${esc(c.pre)}</p>` : ""}
          ${c.hours ? `<p class="small"><b>학습 시간</b> ${esc(c.hours)}</p>` : ""}
          ${c.books ? `<p class="small"><b>교재</b> ${md(c.books)}</p>` : ""}
          <p class="u-tys">${tyCount.map(([t, k]) => `<span class="ty mono" data-ty="${t}">${t} ${k}</span>`).join("")}</p>
          <p><button type="button" class="link u-open" aria-expanded="false">성취기준 펼치기</button></p>
        </div>
        <div class="u-body">
          ${c.yoram || c.handb ? `<div class="u-desc small">${c.yoram ? `<p><span class="mono">요람 개요</span>${esc(c.yoram)}</p>` : ""}${c.handb ? `<p><span class="mono">수강편람 개요</span>${esc(c.handb)}</p>` : ""}</div>` : ""}
          <div class="chapters">${units}</div>
        </div>
      </section>`;
    }).join("");
  }
  host.addEventListener("click", (e) => {
    const b = e.target.closest(".u-open"); if (!b) return;
    const sec = b.closest(".course"), open = !sec.classList.contains("open");
    sec.classList.toggle("open", open);
    b.setAttribute("aria-expanded", String(open));
    b.textContent = open ? "성취기준 접기" : "성취기준 펼치기";
  });

  /* ───── 학년 칩과 검색 ───── */
  const chips = document.getElementById("chips");
  chips.innerHTML = [["all", "전체"], ["1", "1학년"], ["2", "2학년"], ["3", "3학년"]]
    .map(([v, nm]) => `<button class="chip" data-y="${v}" aria-pressed="${v === "all"}">${nm}</button>`).join("");
  const q = document.getElementById("q"), empty = document.getElementById("empty");
  let year = "all", dept = U[0];
  function apply() {
    const term = q.value.trim().toLowerCase();
    document.body.classList.toggle("searching", !!term);
    let shown = 0;
    host.querySelectorAll("section.course").forEach((sec) => {
      const inYear = year === "all" || sec.dataset.y === year;
      const nameHit = !term || sec.dataset.hay.includes(term);
      let any = false;
      sec.querySelectorAll(".chapter").forEach((ch) => {
        const chHit = !term || nameHit || ch.dataset.hay.includes(term);
        let liAny = false;
        ch.querySelectorAll(".u-stds > li").forEach((li) => {
          const hit = chHit || li.dataset.hay.includes(term);
          li.hidden = !hit; if (hit) liAny = true;
        });
        ch.hidden = !liAny; if (liAny) any = true;
      });
      sec.hidden = !(inYear && any);
      sec.classList.toggle("hit", !!term && any);
      if (!sec.hidden) shown++;
    });
    tree.querySelectorAll(".tbox").forEach((b) => {
      const sec = document.getElementById("c-" + b.dataset.code);
      b.classList.toggle("dim-box", !!sec && sec.hidden);
    });
    empty.style.display = shown ? "none" : "block";
  }
  chips.addEventListener("click", (e) => {
    const b = e.target.closest(".chip"); if (!b) return;
    year = b.dataset.y;
    chips.querySelectorAll(".chip").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    apply();
  });
  q.addEventListener("input", apply);

  function setDept(id, save) {
    dept = U.find((d) => d.id === id) || U[0];
    document.body.dataset.dept = dept.id;
    tabs.querySelectorAll("[role=tab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.dept === dept.id)));
    const on = tabs.querySelector("[aria-selected=true]");   // 좁은 화면에서 고른 탭이 보이도록 탭 줄만 민다
    if (on) tabs.scrollLeft = Math.max(0, on.offsetLeft - tabs.offsetLeft - (tabs.clientWidth - on.offsetWidth) / 2);
    drawTree(dept); drawList(dept);
    if (save) try { localStorage.setItem(TAB_KEY, dept.id); } catch (e) { console.warn("학과 탭을 저장하지 못함", e); }
    apply();
  }
  tabs.addEventListener("click", (e) => { const b = e.target.closest("[role=tab]"); if (b) setDept(b.dataset.dept, true); });
  tabs.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const i = U.indexOf(dept), j = (i + (e.key === "ArrowRight" ? 1 : U.length - 1)) % U.length;
    setDept(U[j].id, true);
    tabs.querySelector("[aria-selected=true]").focus();
  });

  let saved = new URLSearchParams(location.search).get("dept");
  if (!saved) try { saved = localStorage.getItem(TAB_KEY); } catch (e) { saved = null; }
  setDept(saved || "common", false);

  const total = U.reduce((a, d) => { a.c += d.courses.length; d.courses.forEach((c) => { a.u += c.units.length; a.s += nStd(c); }); return a; }, { c: 0, u: 0, s: 0 });
  document.getElementById("stat").textContent = `학과 ${U.length - 1} + 공통 · 과목 ${total.c} · 대단원 ${total.u} · 성취기준 ${total.s}`;
})();
