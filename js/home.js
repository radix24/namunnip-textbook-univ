/* 메인 화면: 학과 고르기(연세대 고정) → 그 학과의 학년·학기 배치도와 과목 목록.
   자료는 tools/place.py가 만든 data/yonsei.json(학과 목록), data/yonsei-<학과>.json(학과 요약), data/pool.json(교재 전체).
   학과는 js/place.js(QPlace)가 기억한다. ?pick = 학과 다시 고르기, ?all = 교재 전체 보기, ?d=<학과> = 그 학과로 보기(저장 안 함) */
(() => {
  "use strict";
  const Q = window.QPlace;
  if (!Q || document.body.dataset.view !== "home") return;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const md = (s) => esc(s).replace(/\*([^*]+)\*/g, "<i>$1</i>");   // 설계 문서의 *책 제목*
  const nStd = (c) => c.units.reduce((a, u) => a + u.s.length, 0);
  const path = (c) => `c/${c.id}/`;
  const P = window.QProgress;
  const params = new URLSearchParams(location.search);

  const pick = document.getElementById("pick"), tree = document.getElementById("tree"), host = document.getElementById("courses-list");
  const bar = document.getElementById("courses"), empty = document.getElementById("empty");
  let dept = null;   // 지금 보이는 학과 요약

  /* ───── 학과 고르기 ───── */
  function drawPick(list, cur, open) {
    if (!open && cur) {
      pick.innerHTML = `<div class="pick-line"><span class="mono">${esc(Q.SCHOOL_NAME)}</span><b>${esc(list.find((x) => x.id === cur).name)}</b>
        <button type="button" class="pick-change">학과 바꾸기</button><a class="pick-all" href="?all">교재 전체 보기</a></div>`;
      return;
    }
    pick.innerHTML = `
      <div class="pick-box">
        <h2>${esc(Q.SCHOOL_NAME)} 학과를 고르세요</h2>
        <p class="small dim">학과마다 듣는 과목, 과목 이름, 학기 배치가 다릅니다. 고른 학과는 이 브라우저에 기억되고, 어느 페이지에서든 위쪽의 학과 이름을 눌러 바꿀 수 있습니다.</p>
        <div class="pick-grid" role="list">${list.map((x) => `
          <button type="button" role="listitem" class="pick-dept" data-d="${x.id}" aria-pressed="${x.id === cur}"><b>${esc(x.name)}</b><span class="mono small">${esc(x.college)} · ${x.courses}과목</span></button>`).join("")}
        </div>
        <p class="pick-foot small"><a href="?all">교재 전체 보기</a> — 학과와 관계없이 모든 교재(과목)를 분야별로 봅니다.</p>
      </div>`;
  }
  pick.addEventListener("click", (e) => {
    const b = e.target.closest(".pick-dept");
    if (b) { Q.set(b.dataset.d); history.replaceState(null, "", location.pathname); show(b.dataset.d); return; }
    if (e.target.closest(".pick-change")) Q.index().then((ix) => { drawPick(ix.depts, dept && dept.id, true); pick.scrollIntoView({ block: "start" }); });
  });

  /* ───── 배치도: 학년-학기 행마다 과목 상자 ───── */
  const slot = (c) => `${c.y}-${c.sem}`;
  const box = (c) => {
    const nc = c.units.reduce((a, u) => a + (u.cards || 0), 0), dn = P ? c.units.reduce((a, u) => a + u.s.filter((s) => P.done(s)).length, 0) : 0;
    return `<a class="tbox${nc ? "" : " soon"}" href="${esc(path(c))}" data-code="${esc(c.id)}"${c.extra ? " data-extra" : ""}>
      <span class="lv mono">${esc(c.kind)} · ${c.cr}학점${c.extra ? ` · <span class="u-extra">수강편람 개설</span>` : ""}</span><b>${esc(c.name)}</b>
      <span class="pg mono">${nc ? `카드 ${nc} · ` : ""}성취기준 ${dn ? `${dn}/` : ""}${nStd(c)}</span>
      ${dn ? `<span class="lp" aria-hidden="true"><i style="--p:${(dn / nStd(c)).toFixed(3)}"></i></span>` : ""}</a>`;
  };
  function drawTree(d) {
    const slots = [...new Set(d.courses.map(slot))].sort();
    const n = d.courses.reduce((a, c) => { a.u += c.units.length; a.s += nStd(c); return a; }, { u: 0, s: 0 });
    const nx = d.courses.filter((c) => c.extra).length;
    tree.innerHTML = `
      <div class="tree-head"><h2>${esc(d.name)} <span class="mono small dim">${esc(d.school)} ${esc(d.college)}</span></h2>
        <div class="tree-ctl">
        ${nx ? `<div class="scope-seg" role="group" aria-label="보기 범위"><button type="button" data-scope="main">주요 과목만</button><button type="button" data-scope="all">모든 과목 <span class="dim">+${nx}</span></button></div>` : ""}</div>
        <p class="mono small dim">과목 ${d.courses.length} · 대단원 ${n.u} · 성취기준 ${n.s}. 행은 학년·학기 순서이고, 1학년 공통 과목도 ${esc(d.name)}에서 쓰는 이름으로 보입니다. 점선 상자는 카드 준비 중입니다.${nx ? " '모든 과목'을 고르면 교과과정 표에는 없고 수강편람에서 최근에 열린 과목도 보입니다." : ""}</p></div>
      <div class="tree-band sem-rows" data-track="${d.id}">${slots.map((s, i) => {
        const [y, m] = s.split("-"), newYear = i > 0 && slots[i - 1].split("-")[0] !== y;
        const cs = d.courses.filter((c) => slot(c) === s);
        return `
        <div class="sem-row${newYear ? " sem-year" : ""}"${cs.every((c) => c.extra) ? " data-extra" : ""}><h3 class="sem-lb"><b>${y}학년</b> ${m}학기</h3><div class="sem-boxes">${cs.map(box).join("")}</div></div>`;
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
  tree.addEventListener("click", (e) => {
    const b = e.target.closest("[data-scope]"); if (!b) return;
    scope = b.dataset.scope === "all" ? "all" : "main"; paintScope();
    try { localStorage.setItem(SCOPE_KEY, scope); } catch (err) { /* 저장 못 해도 동작은 한다 */ }
  });

  /* ───── 과목 목록 ───── */
  function drawList(d) {
    const byId = new Map(d.courses.map((c) => [c.id, c]));
    const cLink = (c) => `<a href="${esc(path(c))}">${esc(c.name)}</a>`;
    /* 이어지는 과목: 그 학과 배치에서 이 과목을 선수로 둔 과목 가운데 가장 가까운 다음 학기 (build.py next_courses와 같은 규칙) */
    const term = (c) => { const s = String(c.sem).match(/[12]/g) || ["1"]; return Math.min(...s.map((x) => (c.y - 1) * 2 + +x - 1)); };
    const next = (c) => {
      const later = d.courses.filter((x) => x.pre.includes(c.id) && term(x) > term(c));
      const near = Math.min(...later.map(term));
      return later.filter((x) => term(x) === near);
    };
    host.innerHTML = d.courses.map((c) => {
      const units = c.units.map((u) => {
        const dn = P ? u.s.filter((s) => P.done(s)).length : 0, n = u.s.length;
        const hay = [u.t, u.el, ...u.st].join(" ").toLowerCase();
        return `
          <li class="unit${n && dn === n ? " done" : ""}" data-hay="${esc(hay)}"><a href="${esc(path(c))}${u.n}.html"><span class="mono">${u.n}</span><span class="t">${esc(u.t)}</span>
            <span class="u-pg" title="성취기준 ${dn}/${n} 할 수 있음${u.cards ? ` · 카드 ${u.cards}` : ""}"><span class="lp" aria-hidden="true"><i style="--p:${n ? (dn / n).toFixed(3) : 0}"></i></span><span class="mono">${dn}/${n}</span></span></a></li>`;
      }).join("");
      const pre = c.pre.map((k) => byId.get(k)).filter(Boolean), nx = next(c);
      return `
      <section class="course" id="c-${esc(c.id)}"${c.extra ? " data-extra" : ""} data-y="${c.y}" data-hay="${esc((c.name + " " + c.no + " " + c.id).toLowerCase())}">
        <div class="course-head">
          <span class="mono">${esc(c.no)}</span>
          <h2><a href="${esc(path(c))}">${esc(c.name)}</a></h2>
          <p class="count mono dim">${c.y}학년 ${esc(c.sem)}학기 · ${esc(c.kind)} · ${c.cr}학점${c.exam === "none" ? " · 시험 없음" : c.exam === "fin" ? " · 기말만" : ""}</p>
          <p class="count mono dim">대단원 ${c.units.length} · 성취기준 ${nStd(c)}</p>
          ${pre.length ? `<p class="small u-path"><b>먼저 공부할 과목</b> ${pre.map(cLink).join(", ")}</p>` : c.preT ? `<p class="small u-path"><b>먼저 공부할 내용</b> ${esc(c.preT)}</p>` : ""}
          ${nx.length ? `<p class="small u-path"><b>이어지는 과목</b> ${nx.map(cLink).join(", ")}</p>` : ""}
          ${c.hours ? `<p class="small"><b>학습 시간</b> ${esc(c.hours)}</p>` : ""}
          ${c.books ? `<p class="small"><b>교재</b> ${md(c.books)}</p>` : ""}
          <p><a class="link" href="${esc(path(c))}">과목 목차와 성취기준 →</a></p>
        </div>
        <ol class="u-units">${units}</ol>
      </section>`;
    }).join("");
  }

  /* ───── 교재 전체 보기: 학과와 무관하게 풀 모듈을 분야별로 ───── */
  function drawPool(p) {
    tree.innerHTML = `<div class="tree-head"><h2>교재 전체 보기</h2><p class="mono small dim">학과 배치와 관계없는 교재(과목) ${p.modules.length}개입니다. 과목 이름은 교재 이름이며, 학과를 고르면 그 학과에서 쓰는 이름으로 보입니다.</p></div>
      ${p.fields.map((f) => {
        const ms = p.modules.filter((m) => m.field === f.id).sort((a, b) => a.y - b.y || a.code.localeCompare(b.code, "ko", { numeric: true }));
        return ms.length ? `<section class="pool-field"><h3>${esc(f.name)} <span class="mono small dim">${ms.length}</span></h3><div class="sem-boxes">${ms.map((m) => `
          <a class="tbox${m.cards ? "" : " soon"}" href="c/${esc(m.id)}/"><span class="lv mono">${m.y}학년${m.no && m.no.length ? ` · ${esc(m.no.join(" / "))}` : ""}</span><b>${esc(m.title)}</b><span class="pg mono">${m.cards ? `카드 ${m.cards} · ` : ""}절 ${m.secs}</span></a>`).join("")}</div></section>` : "";
      }).join("")}`;
    host.innerHTML = "";
    bar.hidden = true; empty.style.display = "none";
  }

  /* ───── 학년 칩과 검색 ───── */
  const chips = document.getElementById("chips");
  chips.innerHTML = [["all", "전체"], ["1", "1학년"], ["2", "2학년"], ["3", "3학년"]]
    .map(([v, nm]) => `<button class="chip" data-y="${v}" aria-pressed="${v === "all"}">${nm}</button>`).join("");
  const q = document.getElementById("q");
  let year = "all";
  function apply() {
    if (!dept) return;
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

  /* ───── 보이기 ───── */
  function show(d) {
    Q.index().then((ix) => drawPick(ix.depts, d, false));
    Q.load(d).then((data) => {
      dept = data;
      document.body.dataset.dept = d;
      bar.hidden = false;
      drawTree(data); drawList(data); apply();
      const chip = document.querySelector(".place-chip");
      if (chip) { chip.hidden = false; chip.textContent = `${Q.SCHOOL_NAME} · ${data.name}`; }
    }).catch((e) => { tree.innerHTML = `<p class="u-empty">학과 자료를 불러오지 못했습니다(${esc(e.message)}).</p>`; });
  }
  const cur = Q.get();
  if (params.has("all")) {
    Q.index().then((ix) => drawPick(ix.depts, cur, !cur));
    Q.pool().then(drawPool);
  } else if (!cur || params.has("pick")) {
    Q.index().then((ix) => drawPick(ix.depts, cur, true));
    tree.innerHTML = ""; host.innerHTML = ""; bar.hidden = true; empty.style.display = "none";
    if (cur && params.has("pick")) Q.load(cur).then((data) => { dept = data; });
  } else {
    show(cur);
  }

  /* 소개 아래 한 줄: 마지막으로 연 절(이어서 공부하기). 기록이 없으면 비워 둔다 */
  const go = document.getElementById("dash-go");
  const drawResume = () => {
    if (!go) return;
    const v = P && P.last();
    go.innerHTML = v ? `<a class="dash-next" href="${esc(v.href)}"><span class="mono">이어서 공부하기</span><b>${esc(v.title)}</b><span class="small dim">${esc(v.sub || "")}</span></a>` : "";
  };
  drawResume();
  if (P) P.onChange(() => { drawResume(); if (dept && !params.has("all")) { drawTree(dept); drawList(dept); apply(); } });

  /* 소개 옆 숫자: 교재 전체(풀) 기준 */
  Q.pool().then((p) => {
    const t = p.modules.reduce((a, m) => ({ u: a.u + m.units, s: a.s + m.secs, b: a.b + m.cards, q: a.q + (m.q || 0) }), { u: 0, s: 0, b: 0, q: 0 });
    const nf = (n) => n.toLocaleString("ko-KR");
    document.getElementById("figs").innerHTML = [["학과", `${Q.DEPTS.length}<small> · ${esc(Q.SCHOOL_NAME)}</small>`], ["교재", nf(p.modules.length)], ["대단원", nf(t.u)],
      ["성취기준", nf(t.s)], ["카드", nf(t.b)], ["문항", nf(t.q)]]
      .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
  }).catch(() => {});
})();
