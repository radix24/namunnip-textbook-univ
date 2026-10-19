/* 메인 화면: js/toc.js(window.UNIV)에서 학과 탭 · 학년·학기 배치도 · 과목 목록을 그린다 */
(() => {
  "use strict";
  const U = window.UNIV;
  if (!U || document.body.dataset.view !== "home") return;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const md = (s) => esc(s).replace(/\*([^*]+)\*/g, "<i>$1</i>");   // 설계 문서의 *책 제목*
  const nStd = (c) => c.units.reduce((a, u) => a + u.s.length, 0);
  const TAB_KEY = "quri-dept";
  const P = window.QProgress;

  /* ───── 학교별 보기: 고른 대학의 커리큘럼에 있는 과목·대단원·성취기준만 남긴 학과 사본을 그린다 ─────
     과목은 c.unis, 성취기준은 s.u(build.py가 맞춘 값). 빈 목록은 '미표시'라 '전체'에서만 보인다 */
  const QU = window.QUni;
  const UNIS = QU ? QU.LIST.filter((x) => U.some((d) => d.courses.some((c) => (c.unis || []).includes(x)))) : [];
  let uni = QU ? QU.get() : "";
  if (!UNIS.includes(uni)) uni = "";
  const sIn = (s) => !uni || (s.u || []).includes(uni);
  const view = (d) => !uni ? d : {
    ...d,
    courses: d.courses.filter((c) => (c.unis || []).includes(uni)).map((c) => ({
      ...c,
      units: c.units.filter((u) => u.s.some(sIn)).map((u) => {
        const s = u.s.filter(sIn);
        return { ...u, s, cards: s.reduce((a, x) => a + (x.k || []).length, 0) + (u.r || []).length };
      }),
    })),
  };
  const uniPick = (d) => !UNIS.length || (QU && QU.FIXED) ? "" : `<label class="uni-pick"><span class="mono">학교</span><select aria-label="학교별 보기">
      <option value="">전체</option>${UNIS.map((x) => {
        const n = d.courses.filter((c) => (c.unis || []).includes(x)).length;
        return `<option value="${esc(x)}"${x === uni ? " selected" : ""}${n ? "" : " disabled"}>${esc(x)}${n ? ` · ${n}` : ""}</option>`;
      }).join("")}</select></label>`;

  /* ───── 학과 탭 ───── */
  const tabs = document.getElementById("dom-tabs");
  tabs.innerHTML = U.map((d) => `<button type="button" role="tab" data-dept="${d.id}" aria-selected="false" aria-controls="tree courses-list">${esc(d.short)}</button>`).join("");

  /* ───── 배치도: 학년-학기 열마다 과목 상자 ───── */
  const slot = (c) => `${c.y}-${c.sem}`;
  const slotName = (s) => { const [y, m] = s.split("-"); return `${y}학년 ${m}학기`; };
  const box = (c) => {
    const nc = c.units.reduce((a, u) => a + (u.cards || 0), 0), dn = P ? c.units.reduce((a, u) => a + u.s.filter((s) => P.done(s.c)).length, 0) : 0;
    return `<a class="tbox${nc ? "" : " soon"}" href="${esc(c.path)}" data-code="${esc(c.code)}"${c.onlyU ? " data-extra" : ""}>
      <span class="lv mono">${esc(c.kind)} · ${c.cr}학점${c.onlyU ? ` · <span class="u-extra">수강편람 개설</span>` : ""}</span><b>${esc(c.name)}</b>
      <span class="pg mono">${nc ? `카드 ${nc} · ` : ""}성취기준 ${dn ? `${dn}/` : ""}${nStd(c)}</span>
      ${dn ? `<span class="lp" aria-hidden="true"><i style="--p:${(dn / nStd(c)).toFixed(3)}"></i></span>` : ""}</a>`;
  };
  const tree = document.getElementById("tree");
  function drawTree(d0) {
    const d = view(d0);
    const slots = [...new Set(d.courses.map(slot))].sort();
    const n = d.courses.reduce((a, c) => { a.u += c.units.length; a.s += nStd(c); return a; }, { u: 0, s: 0 });
    const nx = d.courses.filter((c) => c.onlyU).length;
    tree.innerHTML = `
      <div class="tree-head"><h2>${esc(d.name)} <span class="mono small dim">${esc(d.college)}</span></h2>
        <div class="tree-ctl">${uniPick(d0)}
        ${nx ? `<div class="scope-seg" role="group" aria-label="보기 범위"><button type="button" data-scope="main">주요 과목만</button><button type="button" data-scope="all">모든 과목 <span class="dim">+${nx}</span></button></div>` : ""}</div>
        <p class="mono small dim">${uni ? `${esc(uni)} 커리큘럼에 있는 과목과 내용 요소만 보입니다. ` : ""}과목 ${d.courses.length} · 대단원 ${n.u} · 성취기준 ${n.s}. 행은 학년·학기 순서입니다. 점선 상자는 카드 준비 중입니다(학습 요소와 성취기준은 볼 수 있음).${nx ? " '모든 과목'을 고르면 교과과정 표에는 없고 수강편람에서 최근에 열린 과목도 보입니다." : ""}</p></div>
      ${uni && !d.courses.length ? `<p class="uni-none small">이 학과에는 ${esc(uni)} 표시가 붙은 과목이 아직 없습니다. 학교를 '전체'로 바꾸면 모든 과목이 보입니다.</p>` : ""}
      <div class="tree-band sem-rows" data-track="${d.id}"${d.courses.length ? "" : " hidden"}>${slots.map((s, i) => {
        const [y, m] = s.split("-"), newYear = i > 0 && slots[i - 1].split("-")[0] !== y;
        const cs = d.courses.filter((c) => slot(c) === s);
        return `
        <div class="sem-row${newYear ? " sem-year" : ""}"${cs.every((c) => c.onlyU) ? " data-extra" : ""}><h3 class="sem-lb"><b>${y}학년</b> ${m}학기</h3><div class="sem-boxes">${cs.map(box).join("")}</div></div>`;
      }).join("")}
      </div>`;
    paintScope();
  }
  /* 보기 범위: 기본은 주요 과목(교과과정 표에 있는 과목)만. '모든 과목'은 수강편람에만 있는 과목도 보인다 */
  const SCOPE_KEY = "quri-scope";
  let scope = "main";
  try { scope = localStorage.getItem(SCOPE_KEY) === "all" ? "all" : "main"; } catch (e) { scope = "main"; }
  function paintScope() {
    document.body.dataset.scope = scope;
    tree.querySelectorAll("[data-scope]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.scope === scope)));
  }
  tree.addEventListener("change", (e) => {
    const sel = e.target.closest(".uni-pick select"); if (!sel) return;
    uni = UNIS.includes(sel.value) ? sel.value : "";
    if (QU) QU.set(uni);
    drawTree(dept); drawList(dept); apply();
    tree.querySelector(".uni-pick select")?.focus({ preventScroll: true });
  });
  tree.addEventListener("click", (e) => {
    const b = e.target.closest("[data-scope]"); if (!b) return;
    scope = b.dataset.scope === "all" ? "all" : "main"; paintScope();
    try { localStorage.setItem(SCOPE_KEY, scope); } catch (err) { /* 저장 못 해도 동작은 한다 */ }
  });

  /* ───── 과목 목록 ───── */
  const host = document.getElementById("courses-list");
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
  /* 이어지는 과목은 로드맵의 바로 다음 학기만(없으면 그 뒤 가장 가까운 학기). 공통 기초 뒤에는 2학년 과목부터 (build.py next_courses와 같은 규칙) */
  const terms = (c) => { const s = String(c.sem).match(/[12]/g) || ["1"]; return Math.min(...s.map((x) => (c.y - 1) * 2 + +x - 1)); };
  NEXT.forEach((list, k) => {
    const c = ALL.get(k), base = terms(c);
    const later = list.filter((x) => (c.dept !== "common" || x.y >= 2) && terms(x) > base);
    const near = Math.min(...later.map(terms));
    if (later.length) NEXT.set(k, later.filter((x) => terms(x) === near)); else NEXT.delete(k);
  });
  function drawList(d0) {
    const d = view(d0);
    host.innerHTML = d.courses.map((c) => {
      /* 대단원은 한 줄: 번호 · 제목 · 진도(할 수 있게 된 성취기준 / 전체). 성취기준 문장은 검색에만 쓰고 과목 목차에서 본다 */
      const units = c.units.map((u) => {
        const dn = P ? u.s.filter((s) => P.done(s.c)).length : 0, n = u.s.length;
        const hay = [u.t, u.el, ...u.s.map((s) => s.t)].join(" ").toLowerCase();
        return `
          <li class="unit${n && dn === n ? " done" : ""}" data-hay="${esc(hay)}"><a href="${esc(c.path)}${u.n}.html"><span class="mono">${u.n}</span><span class="t">${esc(u.t)}</span>
            <span class="u-pg" title="성취기준 ${dn}/${n} 할 수 있음${u.cards ? ` · 카드 ${u.cards}` : ""}"><span class="lp" aria-hidden="true"><i style="--p:${n ? (dn / n).toFixed(3) : 0}"></i></span><span class="mono">${dn}/${n}</span></span></a></li>`;
      }).join("");
      return `
      <section class="course" id="c-${esc(c.code)}"${c.onlyU ? " data-extra" : ""} data-y="${c.y}" data-hay="${esc((c.name + " " + c.sub.join(" ") + " " + c.code).toLowerCase())}">
        <div class="course-head">
          <span class="mono">${esc(c.sub.join(" / "))}</span>
          <h2><a href="${esc(c.path)}">${esc(c.name)}</a></h2>
          <p class="count mono dim">${c.y}학년 ${esc(c.sem)}학기 · ${esc(c.kind)} · ${c.cr}학점</p>
          <p class="count mono dim">대단원 ${c.units.length} · 성취기준 ${nStd(c)}</p>
          ${c.pre ? `<p class="small u-path"><b>먼저 공부할 과목</b> ${preHtml(c.pre)}</p>` : ""}
          ${NEXT.has(c.code) ? `<p class="small u-path"><b>이어지는 과목</b> ${NEXT.get(c.code).map(cLink).join(", ")}</p>` : ""}
          ${c.hours ? `<p class="small"><b>학습 시간</b> ${esc(c.hours)}</p>` : ""}
          ${c.books ? `<p class="small"><b>교재</b> ${md(c.books)}</p>` : ""}
          <p><a class="link" href="${esc(c.path)}">과목 목차와 성취기준 →</a></p>
        </div>
        <ol class="u-units">${units}</ol>
      </section>`;
    }).join("");
  }

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
      sec.querySelectorAll(".unit").forEach((li) => {   // 대단원 제목·학습 요소·성취기준 문장으로 찾는다
        const hit = !term || nameHit || li.dataset.hay.includes(term);
        li.hidden = !hit; if (hit) any = true;
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
  if (P) P.onChange(() => { drawResume(); drawTree(dept); drawList(dept); apply(); });

  /* 소개 옆 숫자: 카드는 본문·예제·실습·연습 등 블록 전부(u.cards), 문항은 문제은행(c.bank) */
  const total = U.reduce((a, d) => {
    a.c += d.courses.length;
    d.courses.forEach((c) => {
      a.q += c.bank || 0;
      c.units.forEach((u) => { a.u++; a.s += u.s.length; a.b += u.cards || 0; });
    });
    return a;
  }, { c: 0, u: 0, s: 0, b: 0, q: 0 });
  const nf = (n) => n.toLocaleString("ko-KR");
  document.getElementById("figs").innerHTML = [["학과", `${U.length - 1}<small> + 공통</small>`], ["과목", nf(total.c)], ["대단원", nf(total.u)],
    ["성취기준", nf(total.s)], ["카드", nf(total.b)], ["문항", nf(total.q)]]
    .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
})();
