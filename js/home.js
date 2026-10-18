/* 메인 화면: js/toc.js(window.UNIV)에서 학과 탭 · 학년·학기 배치도 · 과목 목록을 그린다 */
(() => {
  "use strict";
  const U = window.UNIV;
  if (!U || document.body.dataset.view !== "home") return;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const md = (s) => esc(s).replace(/\*([^*]+)\*/g, "<i>$1</i>");   // 설계 문서의 *책 제목*
  const nStd = (c) => c.units.reduce((a, u) => a + u.s.length, 0);
  const TYPES = ["개념", "계산", "증명", "모형", "적용", "실습"];
  const TAB_KEY = "quri-dept";
  const P = window.QProgress;

  /* ───── 학과 탭 ───── */
  const tabs = document.getElementById("dom-tabs");
  tabs.innerHTML = U.map((d) => `<button type="button" role="tab" data-dept="${d.id}" aria-selected="false" aria-controls="tree courses-list">${esc(d.short)}</button>`).join("");

  /* ───── 배치도: 학년-학기 열마다 과목 상자 ───── */
  const slot = (c) => `${c.y}-${c.sem}`;
  const slotName = (s) => { const [y, m] = s.split("-"); return `${y}학년 ${m}학기`; };
  const box = (c) => {
    const flags = [c.closed ? "2026 미개설" : "", c.onlyU ? "수강편람만" : ""].filter(Boolean);
    const nc = c.units.reduce((a, u) => a + (u.cards || 0), 0), dn = P ? c.units.reduce((a, u) => a + u.s.filter((s) => P.done(s.c)).length, 0) : 0;
    return `<a class="tbox${nc ? "" : " soon"}" href="${esc(c.path)}" data-code="${esc(c.code)}">
      <span class="lv mono">${esc(c.kind)} · ${c.cr}학점</span><b>${esc(c.name)}</b>
      <span class="pg mono">${nc ? `카드 ${nc} · ` : ""}성취기준 ${dn ? `${dn}/` : ""}${nStd(c)}</span>
      ${flags.length ? `<span class="pg mono u-flag">${flags.map(esc).join(" · ")}</span>` : ""}
      ${dn ? `<span class="lp" aria-hidden="true"><i style="--p:${(dn / nStd(c)).toFixed(3)}"></i></span>` : ""}</a>`;
  };
  const tree = document.getElementById("tree");
  function drawTree(d) {
    const slots = [...new Set(d.courses.map(slot))].sort();
    const n = d.courses.reduce((a, c) => { a.u += c.units.length; a.s += nStd(c); return a; }, { u: 0, s: 0 });
    tree.innerHTML = `
      <div class="tree-head"><h2>${esc(d.name)} <span class="mono small dim">${esc(d.college)}</span></h2>
        <p class="mono small dim">과목 ${d.courses.length} · 대단원 ${n.u} · 성취기준 ${n.s}. 행은 요람의 학년·학기 순서입니다. 점선 상자는 카드 준비 중입니다(학습 요소와 성취기준은 볼 수 있음).</p></div>
      <div class="tree-band sem-rows" data-track="${d.id}">${slots.map((s, i) => {
        const [y, m] = s.split("-"), newYear = i > 0 && slots[i - 1].split("-")[0] !== y;
        return `
        <div class="sem-row${newYear ? " sem-year" : ""}"><h3 class="sem-lb"><b>${y}학년</b> ${m}학기</h3><div class="sem-boxes">${d.courses.filter((c) => slot(c) === s).map(box).join("")}</div></div>`;
      }).join("")}
      </div>`;
  }

  /* ───── 과목 목록 ───── */
  const host = document.getElementById("courses-list");
  const stdLi = (s, c) => `<li data-hay="${esc((s.c + " " + s.t + " " + s.ty).toLowerCase())}"${P && P.done(s.c) ? ` class="done"` : ""}><span class="mono">${esc(s.c.split("-").slice(1).join("-"))}</span><a class="t" href="${esc(c.path + s.f)}.html">${esc(s.t)}${s.k && s.k.length ? ` <span class="mono small dim">카드 ${s.k.length}</span>` : ""}</a>${s.ty ? `<span class="ty mono" data-ty="${esc(s.ty)}">${esc(s.ty)}</span>` : ""}</li>`;
  /* 선수 칸의 과목 코드(공통1, 수학7, 공통1·2)를 과목 이름 링크로. 이어지는 과목은 다른 과목의 선수 칸을 거꾸로 찾는다 */
  const ALL = new Map(U.flatMap((d) => d.courses.map((c) => [c.code, c])));
  const RX = /([가-힣]+?)(\d+(?:·\d+)*)(?!\d)/g;
  const preCodes = (text) => [...String(text || "").matchAll(RX)].flatMap((m) => m[2].split("·").map((k) => m[1] + k)).filter((k) => ALL.has(k));
  const cLink = (c) => `<a href="${esc(c.path)}">${esc(c.name)}</a>`;
  const preHtml = (text) => esc(text).replace(RX, (all, h, ns) => {
    const parts = ns.split("·").map((k) => h + k);
    return parts.every((p) => ALL.has(p)) ? parts.map((p) => cLink(ALL.get(p))).join(", ") : all;
  });
  const NEXT = new Map();
  ALL.forEach((c) => preCodes(c.pre).forEach((k) => { if (k !== c.code) (NEXT.get(k) || NEXT.set(k, []).get(k)).push(c); }));
  function drawList(d) {
    host.innerHTML = d.courses.map((c) => {
      const tyCount = TYPES.map((t) => [t, c.units.reduce((a, u) => a + u.s.filter((s) => s.ty === t).length, 0)]).filter(([, k]) => k);
      const units = c.units.map((u) => `
        <div class="chapter" data-hay="${esc((u.t + " " + u.el).toLowerCase())}">
          <h3><span class="mono">${u.n}</span><a href="${esc(c.path)}${u.n}.html">${esc(u.t)}</a>${u.cards ? `<span class="u-src mono">카드 ${u.cards}</span>` : ""}${u.src ? `<span class="u-src mono">${esc(u.src)}</span>` : ""}</h3>
          ${u.el ? `<p class="u-el small">${esc(u.el)}</p>` : ""}
          <ol class="u-stds">${u.s.map((s) => stdLi(s, c)).join("")}</ol>
        </div>`).join("");
      return `
      <section class="course" id="c-${esc(c.code)}" data-y="${c.y}" data-hay="${esc((c.name + " " + c.sub.join(" ") + " " + c.code).toLowerCase())}">
        <div class="course-head">
          <span class="mono">${esc(c.sub.join(" / "))}</span>
          <h2><a href="${esc(c.path)}">${esc(c.name)}</a></h2>
          <p class="count mono dim">${c.y}학년 ${esc(c.sem)}학기 · ${esc(c.kind)} · ${c.cr}학점</p>
          <p class="count mono dim">대단원 ${c.units.length} · 성취기준 ${nStd(c)}</p>
          ${c.open ? `<p class="small"><b>2026 개설</b> ${esc(c.open)}</p>` : ""}
          ${c.pre ? `<p class="small u-path"><b>먼저 공부할 과목</b> ${preHtml(c.pre)}</p>` : ""}
          ${NEXT.has(c.code) ? `<p class="small u-path"><b>이어지는 과목</b> ${NEXT.get(c.code).map(cLink).join(", ")}</p>` : ""}
          ${c.hours ? `<p class="small"><b>학습 시간</b> ${esc(c.hours)}</p>` : ""}
          ${c.books ? `<p class="small"><b>교재</b> ${md(c.books)}</p>` : ""}
          <p class="u-tys">${tyCount.map(([t, k]) => `<span class="ty mono" data-ty="${t}">${t} ${k}</span>`).join("")}</p>
          <p><a class="link" href="${esc(c.path)}">과목 목차 →</a> <button type="button" class="link u-open" aria-expanded="false">성취기준 펼치기</button></p>
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

  /* 소개 아래 한 줄: 마지막으로 연 절(이어서 공부하기). 기록이 없으면 비워 둔다 */
  const go = document.getElementById("dash-go");
  const drawResume = () => {
    if (!go) return;
    const v = P && P.last();
    go.innerHTML = v ? `<a class="dash-next" href="${esc(v.href)}"><span class="mono">이어서 공부하기</span><b>${esc(v.title)}</b><span class="small dim">${esc(v.sub || "")}</span></a>` : "";
  };
  drawResume();
  if (P) P.onChange(() => { drawResume(); drawTree(dept); });

  /* 소개 옆 숫자: 블록 수(u.cards)에서 본문(text-*)을 빼면 카드 수 */
  const total = U.reduce((a, d) => {
    a.c += d.courses.length;
    d.courses.forEach((c) => c.units.forEach((u) => {
      a.u++; a.s += u.s.length; a.b += u.cards || 0;
      u.s.forEach((s) => (s.k || []).forEach((id) => { if (id.startsWith("text-")) a.t++; }));
    }));
    return a;
  }, { c: 0, u: 0, s: 0, b: 0, t: 0 });
  const nf = (n) => n.toLocaleString("ko-KR");
  document.getElementById("figs").innerHTML = [["학과", `${U.length - 1}<small> + 공통</small>`], ["과목", nf(total.c)], ["대단원", nf(total.u)],
    ["성취기준", nf(total.s)], ["본문", nf(total.t)], ["카드", nf(total.b - total.t)]]
    .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
})();
