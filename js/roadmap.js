/* QURI 커리큘럼 안내와 졸업 로드맵 (roadmap.html)
   - 과목: data/univ.json (tools/build.py가 만드는 전 학과 합본, 예전 js/toc.js의 window.UNIV와 같은 꼴)
   - 졸업 요건: curricula/univ-requirements.json (연세대 2020~2026 요람을 옮긴 것. 2026학번이 기본이고 학번별 차이는 byCohort,
     QURI에 카드가 없는 4학년 과목은 fourth)
   - 연세대 개설 이력: curricula/univ-offered.json */
(() => {
  "use strict";

  let UNIV = [];
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
  const KEY = "quri-roadmap-v1";
  const SEMS = 8;
  /* 학기 위치: 정규학기 s(0~7)는 2s, 그 뒤 계절학기(1-1 뒤 여름, 1-2 뒤 겨울 …)는 2s+1. 4학년 2학기 뒤 겨울은 넣지 않는다 */
  const NP = 2 * SEMS - 1;
  const SEASON_CR = 6;   // 계절학기마다 들을 수 있는 학점
  const isSeason = (p) => p % 2 === 1;
  const termOf = (p) => (p / 2) % 2 + 1;   // 정규학기의 1·2학기
  const yearOfP = (p) => Math.floor(p / 4) + 1;
  const OFFER_FROM = 2024;   // 이 해부터의 개설 이력으로 1·2학기를 판단한다
  const PREFIX = "공통|수학|물리|화학|천우|응통|전전|기계";
  const SCHOOLS = ["연세대", "서울대", "고려대", "KAIST", "POSTECH", "서강대", "성균관대", "한양대", "경희대"];
  const semName = (p) => `${yearOfP(p)}학년 ${isSeason(p) ? seasonName(p) + "학기" : termOf(p) + "학기"}`;
  const semShort = (p) => `${yearOfP(p)}-${isSeason(p) ? seasonName(p) : termOf(p)}`;

  const store = {
    get() { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* 저장소를 막은 브라우저: 이번 방문 동안만 유지 */ } },
  };

  /* ---------- 과목 색인 ---------- */
  const COURSE = new Map();
  const DEPT = new Map();
  function loadUniv(U) {   // data/univ.json을 받은 뒤 색인을 만든다
    UNIV = U || [];
    COURSE.clear(); DEPT.clear();
    UNIV.forEach((d) => { DEPT.set(d.id, d); d.courses.forEach((c) => COURSE.set(c.code, c)); });
    indexPre();
  }
  const codeNum = (code) => parseInt(String(code).replace(/\D+/g, ""), 10) || 0;
  /* 화면에 보이는 과목 번호는 연세대 학정번호(c.sub의 첫 번호). 학정번호가 없는 과목만 QURI 코드로 둔다 */
  const hak = (c) => (c.sub && c.sub[0]) || c.code;
  /* 학과에서 실제로 쓰는 과목명·학정번호(data/yonsei-<학과>.json, 예: 공대의 공통1 = 공학수학(1) MAT1011). 보이는 곳에만 쓴다 */
  const DNAMES = new Map();
  let NAME_DEPT = "";
  const dn = (c) => { const m = DNAMES.get(NAME_DEPT); return (m && c && m.get(c.code)) || null; };
  const nameOf = (c) => (dn(c) || {}).name || c.name;
  const noOf = (c) => (dn(c) || {}).no || hak(c);
  function needNames(id, then) {
    if (!id || id === "common" || DNAMES.has(id)) return;
    DNAMES.set(id, null);
    fetch(`data/yonsei-${id}.json`).then((r) => r.json())
      .then((d) => { DNAMES.set(id, new Map((d.courses || []).map((x) => [x.code, { name: x.name, no: x.no }]))); then(); })
      .catch(() => { /* 학과 이름 파일이 없으면 교재 이름 그대로 */ });
  }
  /* 선수 과목 글 속의 QURI 코드(공통1, 수학3 …)를 "과목명(학정번호)"로 바꿔 보여 준다 */
  const preText = (s) => String(s || "").replace(new RegExp(`(?:${PREFIX})\\d+`, "g"),
    (k) => { const x = COURSE.get(k); return x ? `${x.name}(${hak(x)})` : k; });

  /* 선수 과목 글을 읽어 hard(먼저 끝낼 것: [[하나라도]] 묶음), co(같은 학기까지), soft(권장)로 나눈다 */
  function codesIn(s) {
    const out = [];
    const re = new RegExp(`(${PREFIX})(\\d+)((?:·\\d+)*)`, "g");
    let m;
    while ((m = re.exec(s))) {
      [m[2], ...m[3].split("·").filter(Boolean)].forEach((n) => { const k = m[1] + n; if (COURSE.has(k) && !out.includes(k)) out.push(k); });
    }
    return out;
  }
  function splitTop(txt) {
    const segs = []; let depth = 0, cur = "";
    for (const ch of txt) {
      if (ch === "(") depth++;
      if (ch === ")") depth = Math.max(0, depth - 1);
      if (ch === "," && depth === 0) { segs.push(cur); cur = ""; } else cur += ch;
    }
    segs.push(cur);
    return segs;
  }
  const SOFT_RE = /권장|좋음|있으면|않으면|미리/;
  const CO_RE = /함께|같은 학기/;
  function parsePre(c) {
    const P = { hard: [], co: [], soft: [] };
    const add = (codes, mode) => {
      codes = codes.filter((k) => k !== c.code);
      if (!codes.length) return;
      if (mode === "soft") codes.forEach((k) => P.soft.push(k));
      else if (mode === "co") codes.forEach((k) => P.co.push(k));
      else if (mode === "or") P.hard.push(codes);
      else codes.forEach((k) => P.hard.push([k]));
    };
    for (const seg of splitTop(c.pre || "")) {
      const parens = [...seg.matchAll(/\(([^)]*)\)/g)].map((m) => m[1]);
      const main = seg.replace(/\([^)]*\)/g, " ");
      const mainCodes = codesIn(main);
      let mode = CO_RE.test(main) ? "co" : SOFT_RE.test(main) ? "soft" : "hard";
      if (mode === "hard" && /또는/.test(main)) {
        const alts = main.split("또는");
        mode = alts.every((a) => codesIn(a).length) ? "or" : "soft";
      }
      for (const p of parens) {   // 괄호 안에 과목이 없으면 앞 과목을 꾸미는 말(권장, 같은 학기 …)
        const pc = codesIn(p);
        if (pc.length) add(pc, CO_RE.test(p) ? "co" : "soft");
        else if (CO_RE.test(p)) mode = "co";
        else if (SOFT_RE.test(p)) mode = "soft";
      }
      add(mainCodes, mode);
    }
    return P;
  }
  const PRE = new Map();
  const NEXT = new Map();   // 이 과목을 선수로 두는 과목
  function indexPre() {   // 요람 4학년 과목을 넣은 뒤 다시 부른다
    PRE.clear(); NEXT.clear();
    COURSE.forEach((c) => PRE.set(c.code, parsePre(c)));
    PRE.forEach((p, code) => {
      const all = new Set([...p.hard.flat(), ...p.co, ...p.soft]);
      all.forEach((k) => { if (!NEXT.has(k)) NEXT.set(k, new Set()); NEXT.get(k).add(code); });
    });
  }
  indexPre();

  /* ---------- 학교 정보 (학과 세션이 curricula에 붙이는 중: 과목 '개설 대학'과 성취기준 《…》) ---------- */
  const normSchool = (s) => String(s).trim().replace(/대학교$/, "대").replace(/학교$/, "").replace(/\s+/g, "");
  function courseSchools(c) {
    const out = new Map();   // 학교 → 그 학교 과목명(있으면)
    const add = (raw) => {
      const m = /^([^(（]+)[(（]([^)）]*)[)）]?$/.exec(String(raw).trim());
      const k = normSchool(m ? m[1] : raw);
      if (k) out.set(k, m ? m[2] : out.get(k) || "");
    };
    const v = c.univ || c.unis || c.univs;
    if (Array.isArray(v)) v.forEach(add);
    else if (v && typeof v === "object") Object.entries(v).forEach(([k, nm]) => out.set(normSchool(k), typeof nm === "string" ? nm : ""));
    else if (typeof v === "string") v.split(/[,，]/).forEach((x) => x.trim() && add(x));
    return out;
  }
  function stdSchools(c) {
    const s = new Set();
    (c.units || []).forEach((u) => (u.s || []).forEach((x) => (x.u || []).forEach((n) => s.add(normSchool(n)))));
    return s;
  }
  function inSchool(c, school) {
    const cs = courseSchools(c);
    if (school === "연세대") return !cs.size || cs.has("연세대");
    return cs.has(school) || stdSchools(c).has(school);
  }

  /* ---------- 데이터 읽기 ---------- */
  let REQ = null, OFFER = {};
  const MAJOR = new Map();
  const COHORT0 = 2026;
  const YEARS = [2020, 2021, 2022, 2023, 2024, 2025, 2026];

  /* 학번별 요건: 2026학번 값에 byCohort의 from~to 덮어쓰기를 차례로 합친다.
     tracks는 이수 형태별로 합치고, notes는 덧붙이고(출처가 없으면 덮어쓰기의 src), 나머지 값은 바꾼다 */
  const cohortCache = new Map();
  function majorFor(id, cohort) {
    const key = id + "@" + cohort;
    if (cohortCache.has(key)) return cohortCache.get(key);
    const base = MAJOR.get(id);
    if (!base) return null;
    const m = Object.assign({}, base, { tracks: {}, notes: [], cohortSrc: [] });
    Object.entries(base.tracks).forEach(([k, t]) => { m.tracks[k] = Object.assign({}, t); });
    const add = [];
    (base.byCohort || []).forEach((p) => {
      if (cohort < (p.from || 0) || cohort > (p.to || 9999)) return;
      Object.entries(p).forEach(([k, v]) => {
        if (k === "tracks") Object.entries(v).forEach(([tk, tv]) => { if (m.tracks[tk]) Object.assign(m.tracks[tk], tv); });
        else if (k === "notes") v.forEach((n) => add.push(Object.assign({ src: p.src }, n)));
        else if (!["from", "to", "src"].includes(k)) m[k] = v;
      });
      if (p.src) m.cohortSrc.push(p.src);
    });
    m.notes = [...add, ...(base.notes || []).map((n) => (m.cohortSrc.length ? Object.assign({}, n, { t: "(2026 요람) " + n.t }) : n))];
    cohortCache.set(key, m);
    return m;
  }

  /* 요람의 4학년 과목(QURI에 카드가 없는 것)을 과목 색인에 넣는다. 학정번호를 코드로 쓰고 out 표시를 단다 */
  function addFourth() {
    REQ.majors.forEach((m) => {
      const d = DEPT.get(m.id);
      if (!d) return;
      (m.fourth || []).forEach((o) => {
        if (COURSE.has(o.code)) return;
        const c = { code: o.code, name: o.name, sub: [o.code], dept: m.id, y: o.y, sem: o.sem, kind: o.kind, cr: o.cr,
          pre: o.pre || "", yr: o.yr || "", out: true, src: m.fourthSrc || "" };
        COURSE.set(c.code, c);
        d.courses.push(c);
      });
    });
    indexPre();
  }
  /* 계절학기: 최근 3년(curricula/univ-season.json) 여름·겨울학기에 열린 학정번호만 넣을 수 있다 */
  let SEASON = { codes: {}, lib: {}, terms: [] };
  const seasonOf = (codes) => new Set(codes.flatMap((k) => (SEASON.codes[k] || []).map((t) => t.split("-")[1])));   // {"여름","겨울"}
  const seasonLib = (k) => new Set((SEASON.lib[k] && SEASON.lib[k].ok && SEASON.lib[k].types) || []);
  const seasonOn = (p) => P.season && !(P.seasonOff || []).includes(p);   // 계절학기 칸마다 끄고 켤 수 있다
  const seasonName = (p) => (((p - 1) / 2) % 2 ? "겨울" : "여름");

  /* 교양 요건: 제1전공 대학의 libReq에 학번별 덮어쓰기(libByCohort)와 전공별 값(영어 지정과목 등)을 합친다 */
  function libFor(T) {
    const col = REQ.colleges[T.m.college];
    const L = Object.assign({ basic: 8, rc: 2, area: 0, info: false, english: false }, col.libReq || {}, { srcs: [(col.libReq || {}).src].filter(Boolean) });
    (col.libByCohort || []).forEach((p) => {
      if (P.cohort < (p.from || 0) || P.cohort > (p.to || 9999)) return;
      Object.entries(p).forEach(([k, v]) => { if (k === "src") L.srcs.push(v); else if (k !== "from" && k !== "to") L[k] = v; });
    });
    Object.assign(L, T.m.libReq || {});
    return L;
  }
  /* 교양 필수를 계획에 넣을 자리표시 카드(QURI 밖). 대학교양 영역 과목은 영역만 정해 둔다 */
  function libItems(L) {
    const out = [];
    const add = (id, name, cr, y, cat, extra) => out.push(Object.assign({ id: "@교양:" + id, name, cr, y, sem: "1·2", kind: "교양", lib: true, libCat: cat, cat: null }, extra));
    [1, 2, 3, 4].forEach((n) => add("채플" + n, `채플(${n})`, 0.5, n <= 2 ? 1 : 2, "basic", { season: seasonLib("채플"), hard: n > 1 ? ["@교양:채플" + (n - 1)] : [] }));
    add("글쓰기", "글쓰기", 3, 1, "basic", { season: seasonLib("글쓰기") });
    add("기독교", "기독교의이해", 3, 1, "basic", { season: seasonLib("기독교의이해") });
    add("RC101", "Yonsei RC101", 1, 1, "rc", { season: seasonLib("RC101") });
    if (L.rc >= 2) add("사회참여", "사회참여", 1, 1, "rc", { season: seasonLib("사회참여") });
    const names = [];
    if (L.info) names.push("대학교양: 정보와기술 영역");
    if (L.english) names.push("대학교양: 언어와표현(지정 영어)");
    for (let i = names.length, n = Math.ceil(L.area / 3); i < n; i++) names.push(`대학교양 영역 과목 ${i + 1}`);
    names.forEach((nm, i) => add("영역" + (i + 1), nm, 3, 1, "area", { season: seasonLib("대학교양") }));
    return out;
  }

  /* 학번 요람의 과목명이 지금과 다르면 그 이름 */
  function oldName(c, cohort) {
    const r = (REQ && REQ.renames || []).find((x) => x.code && x.old && x.new && !x.tableOnly && x.code === hak(c) && cohort < x.since);
    return r ? r.old : "";
  }

  function offeredTerms(codes) {
    const t = new Set(); let known = false;
    codes.forEach((k) => {
      const h = OFFER[k];
      if (!h) return;
      known = true;
      h.forEach((x) => { const [y, s] = x.split("-"); if (+y >= OFFER_FROM && (s === "1" || s === "2")) t.add(+s); });
    });
    return { t, known };
  }
  function semTerms(txt) {
    const t = new Set();
    if (/1·2|1,2|1, 2/.test(txt)) { t.add(1); t.add(2); } else { if (/(^|[^\d])1(학기|$)/.test(txt)) t.add(1); if (/(^|[^\d])2(학기|$)/.test(txt)) t.add(2); }
    return t;
  }

  /* ---------- 커리큘럼 안내 ---------- */
  const G = { school: "연세대", dept: "math", common: true, sel: null };

  function schoolList() {
    return SCHOOLS.map((s) => {
      let n = 0;
      COURSE.forEach((c) => { if (c.dept !== "common" && inSchool(c, s)) n++; });
      return { s, n };
    });
  }
  function guideSet() {
    const d = DEPT.get(G.dept);
    if (!d) return [];
    const own = d.courses.filter((c) => inSchool(c, G.school));
    if (G.dept === "common" || !G.common) return own;
    const set = new Set(own.map((c) => c.code));
    const want = new Set();
    const walk = (code) => {
      const p = PRE.get(code); if (!p) return;
      [...p.hard.flat(), ...p.co, ...p.soft].forEach((k) => {
        if (k.startsWith("공통") && !want.has(k)) { want.add(k); walk(k); }
      });
    };
    own.forEach((c) => walk(c.code));
    const m = REQ && majorFor(G.dept, P.cohort);
    if (m && G.school === "연세대") {
      (REQ.colleges[m.college].lib || []).forEach((k) => want.add(k));
      [...(m.basicList || []), ...(m.libExtra || [])].forEach((k) => k.startsWith("공통") && want.add(k));
    }
    return [...own, ...[...want].filter((k) => !set.has(k)).map((k) => COURSE.get(k))];
  }
  function levels(codes) {
    const inSet = new Set(codes), memo = new Map();
    const lv = (k, stack) => {
      if (memo.has(k)) return memo.get(k);
      if (stack.has(k)) return 1;
      stack.add(k);
      const p = PRE.get(k);
      let v = 1;
      p.hard.forEach((g) => { const ins = g.filter((x) => inSet.has(x)); if (ins.length) v = Math.max(v, Math.min(...ins.map((x) => lv(x, stack))) + 1); });
      p.co.forEach((x) => { if (inSet.has(x)) v = Math.max(v, lv(x, stack)); });
      stack.delete(k);
      memo.set(k, v);
      return v;
    };
    codes.forEach((k) => lv(k, new Set()));
    return memo;
  }
  const kindShort = (k) => ({ "전공기초": "기초", "전공필수": "필수", "전공선택": "선택", "대학교양": "교양" }[k] || k || "");

  function renderGuide() {
    NAME_DEPT = G.school === "연세대" ? G.dept : "";
    needNames(NAME_DEPT, () => { if (TAB === "guide") renderGuide(); });
    document.body.dataset.dept = G.dept;
    const list = schoolList();
    $("#g-school").innerHTML = list.map(({ s, n }) => `<option value="${esc(s)}"${s === G.school ? " selected" : ""}${n ? "" : " disabled"}>${esc(s)}${n ? "" : " (준비 중)"}</option>`).join("");
    $("#g-dept").innerHTML = UNIV.map((d) => `<option value="${d.id}"${d.id === G.dept ? " selected" : ""}>${esc(d.name)}</option>`).join("");
    $("#g-common").checked = G.common;
    $("#g-common").disabled = G.dept === "common";
    const note = $("#g-school-note");
    if (G.school !== "연세대") {
      note.hidden = false;
      note.textContent = `${G.school}에도 있는 내용의 과목만 보여 줍니다. 학년·학기와 선수 관계는 연세대 교과과정 기준이고, 다른 대학 정보는 학과별로 채우는 중입니다.`;
    } else note.hidden = true;

    const items = guideSet();
    const codes = items.map((c) => c.code);
    const LV = levels(codes);
    const d = DEPT.get(G.dept);
    const m = REQ && majorFor(G.dept, P.cohort);
    const nOut = items.filter((c) => c.out).length;

    /* 시작 안내 */
    const first = items.filter((c) => LV.get(c.code) === 1 && !c.out).sort((a, b) => a.y - b.y || String(a.sem).localeCompare(String(b.sem)) || codeNum(a.code) - codeNum(b.code));
    const minY = first.length ? first[0].y : 1;
    const starts = first.filter((c) => c.y === minY);
    let sum = "";
    if (m && G.school === "연세대") {
      const t = m.tracks.single, col = REQ.colleges[m.college];
      sum = `<p class="rm-sum">연세대 ${P.cohort}학번 ${esc(m.name)} 단일전공은 전공 <b>${t.major}학점</b>(${[t.basic ? `전공기초 ${t.basic}` : "", t.req ? `전공필수 ${t.req}` : "", `전공선택 ${t.elec}`].filter(Boolean).join(" · ")}), 졸업 총 <b>${m.total || col.total}학점</b>입니다. 학번은 졸업 로드맵 탭에서 바꿀 수 있습니다. <span class="rm-cite">${esc([t.src, ...m.cohortSrc].join(" · "))}</span></p>`;
    }
    $("#g-start").innerHTML = items.length ? `<div class="rm-start-box"><h2 class="rm-h2">여기서 시작하세요</h2>
      <p>${esc(d.name)} 과목 ${items.length}개${nOut ? `(요람의 4학년·3·4학년 공통 과목 중 QURI에 카드가 없는 ${nOut}개 포함)` : ""} 가운데 선수 과목 없이 시작할 수 있는 ${minY}학년 과목입니다.</p>
      <div class="rm-chips">${starts.map((c) => chip(c, true)).join("")}</div>${sum}</div>` : "";

    /* 학년·학기 배치 */
    const years = [...new Set(items.map((c) => c.y))].sort();
    const cell = (y, t) => items.filter((c) => c.y === y && (String(c.sem).includes("1·2") ? t === 1 : String(c.sem) === String(t)))
      .sort((a, b) => (a.dept === "common") - (b.dept === "common") || !!a.out - !!b.out || LV.get(a.code) - LV.get(b.code) || codeNum(a.code) - codeNum(b.code));
    $("#g-grid").innerHTML = items.length ? years.map((y) => `<div class="rm-yr"><h3>${y}학년</h3>
      ${[1, 2].map((t) => `<div class="rm-cell"><h4>${t}학기</h4><div class="rm-chips">${cell(y, t).map((c) => chip(c)).join("") || '<span class="dim small">—</span>'}</div></div>`).join("")}</div>`).join("")
      : `<p class="rm-empty">${esc(G.school)}의 ${esc(d.name)} 과목 정보가 아직 없습니다.</p>`;

    /* 공부 순서 */
    const maxL = Math.max(0, ...LV.values());
    let steps = "";
    for (let l = 1; l <= maxL; l++) {
      const cs = items.filter((c) => LV.get(c.code) === l).sort((a, b) => a.y - b.y || codeNum(a.code) - codeNum(b.code));
      if (cs.length) steps += `<li><span class="mono">${String(l).padStart(2, "0")}</span><div class="rm-chips">${cs.map((c) => chip(c, true)).join("")}</div></li>`;
    }
    $("#g-steps").innerHTML = steps;
    renderDetail();
  }
  function chip(c, withSem) {
    const req = /필수|기초/.test(c.kind) && c.dept !== "common";
    const alt = G.school !== "연세대" ? courseSchools(c).get(G.school) : "";
    return `<button type="button" class="rm-chip${req ? " is-req" : ""}${c.dept === "common" ? " is-common" : ""}${c.out ? " is-out" : ""}" data-code="${c.code}">
      <span class="mono">${esc(noOf(c))}</span> ${esc(alt || nameOf(c))}${withSem ? ` <small>${esc(c.yr || c.y)}-${esc(String(c.sem))}</small>` : ""}<small class="k">${kindShort(c.kind)}${c.out ? " · QURI 밖" : ""}</small></button>`;
  }
  function renderDetail() {
    const box = $("#g-detail");
    document.querySelectorAll(".rm-chip").forEach((b) => b.classList.remove("is-sel", "is-pre", "is-next", "is-soft"));
    const c = G.sel && COURSE.get(G.sel);
    if (!c) { box.innerHTML = '<p class="dim small">과목을 누르면 먼저 들을 과목과 다음에 열리는 과목을 보여 줍니다.</p>'; return; }
    const p = PRE.get(c.code);
    const hard = [...new Set(p.hard.flat())];
    /* 화면의 '다음에 열리는 과목'은 로드맵의 바로 다음 학기만(없으면 그 뒤 가장 가까운 학기). 공통 기초 뒤에는 2학년부터.
       build.py next_courses와 같은 규칙이고, 졸업 로드맵 배치 계산은 NEXT 전체를 그대로 쓴다 */
    const term0 = (x) => { const s = String(x.sem).match(/[12]/g) || ["1"]; return Math.min(...s.map((v) => (x.y - 1) * 2 + +v - 1)); };
    const later = [...(NEXT.get(c.code) || [])].map((k) => COURSE.get(k)).filter(Boolean)
      .filter((x) => (c.dept !== "common" || x.y >= 2) && term0(x) > term0(c));
    const near = Math.min(...later.map(term0));
    const nexts = later.filter((x) => term0(x) === near).map((x) => x.code);
    const mark = (codes, cls) => codes.forEach((k) => document.querySelectorAll(`.rm-chip[data-code="${k}"]`).forEach((b) => b.classList.add(cls)));
    mark([c.code], "is-sel"); mark(hard, "is-pre"); mark(p.co, "is-pre"); mark(p.soft, "is-soft"); mark(nexts, "is-next");
    const link = (k) => { const x = COURSE.get(k); return x ? `<button type="button" class="rm-link" data-code="${k}">${esc(x.name)}</button>` : esc(k); };
    const orText = p.hard.filter((g) => g.length > 1).map((g) => g.map(link).join(" 또는 "));
    const off = offeredTerms(c.sub || []);
    const offTxt = off.known ? (off.t.size ? `연세대 ${[...off.t].sort().join("·")}학기 (${OFFER_FROM}년 이후 개설 이력)` : `${OFFER_FROM}년 이후 연세대 개설 기록 없음`) : (c.open || "");
    const schools = [...courseSchools(c).entries()].map(([s, n]) => n ? `${s}(${n})` : s);
    const old = REQ ? oldName(c, P.cohort) : "";
    box.innerHTML = `<h3><span class="mono">${esc(noOf(c))}</span> ${esc(nameOf(c))}${nameOf(c) !== c.name ? ` <small class="dim">QURI 교재: ${esc(c.name)}</small>` : ""}</h3>
      <p class="small dim">${esc(c.yr || c.y)}학년 ${esc(String(c.sem))}학기 · ${esc(c.kind)} · ${c.cr}학점${c.sub && c.sub.length > 1 ? ` · 학정번호 ${c.sub.join(", ")}` : ""}${offTxt ? ` · ${esc(offTxt)}` : ""}</p>
      ${c.out ? `<p class="small">QURI에 아직 카드가 없는 과목입니다. 요람의 과목명·학정번호·학년만 옮겨 졸업 로드맵에 넣을 수 있게 했습니다. <span class="rm-cite">${esc(c.src)}</span></p>` : ""}
      ${old ? `<p class="small">${P.cohort}학번 요람에서는 '${esc(old)}'(으)로 적혀 있습니다.</p>` : ""}
      <dl>
        <dt>선수 (요람·설계)</dt><dd>${esc(preText(c.pre) || "없음")}</dd>
        ${hard.filter((k) => !p.hard.some((g) => g.length > 1 && g.includes(k))).length ? `<dt>먼저 끝낼 과목</dt><dd>${hard.filter((k) => !p.hard.some((g) => g.length > 1 && g.includes(k))).map(link).join(", ")}</dd>` : ""}
        ${orText.length ? `<dt>하나만 먼저</dt><dd>${orText.join("; ")}</dd>` : ""}
        ${p.co.length ? `<dt>같은 학기까지</dt><dd>${p.co.map(link).join(", ")}</dd>` : ""}
        ${p.soft.length ? `<dt>있으면 좋은 과목</dt><dd>${p.soft.map(link).join(", ")}</dd>` : ""}
        ${nexts.length ? `<dt>다음에 열리는 과목</dt><dd>${nexts.map(link).join(", ")}</dd>` : ""}
        ${schools.length ? `<dt>개설 대학</dt><dd>${esc(schools.join(", "))}</dd>` : ""}
      </dl>
      ${c.path ? `<p><a class="rm-go" href="${esc(c.path)}">과목 페이지로</a></p>` : ""}`;
  }

  /* ---------- 졸업 로드맵 ---------- */
  const P = { cohort: COHORT0, majors: [{ id: "math", track: "single" }], cap: 18, rsv: 0, season: true, seasonOff: [], pins: {}, removed: [], step: 1 };
  let PLAN = null;

  function trackOf(i) {
    const sel = P.majors[i], m = majorFor(sel.id, P.cohort);
    const choices = i === 0 ? (P.majors.length > 1 ? ["first"] : ["single", "deep"]) : ["double", "minor"];
    let t = choices.includes(sel.track) && m.tracks[sel.track] ? sel.track : choices.find((k) => m.tracks[k]);
    sel.track = t;
    const spec = m.tracks[t];
    return {
      m, key: t, spec, choices: choices.filter((k) => m.tracks[k]),
      basicList: spec.basicList || m.basicList || [],
      reqList: spec.reqList || m.reqList || [],
      pick: spec.pick || m.pick || [],
      libExtra: [...(m.libExtra || []), ...(spec.libExtra || [])],
      outside: (spec.outside || m.outside || []).map((o) => Object.assign({ id: o.id || "@" + o.name }, o)),
      accept: m.accept || [], acceptMax: m.acceptMax || Infinity,
      notAccept: m.notAccept || [], kindOverride: m.kindOverride || {},
    };
  }

  /* 계획에 들어갈 수 있는 것: QURI 과목과 QURI 밖 과목(4학년 필수 등)을 같은 꼴로 */
  function itemOf(id, ctx) {
    if (ctx.items.has(id)) return ctx.items.get(id);
    let it = null;
    if (COURSE.has(id)) {
      const c = COURSE.get(id);
      const pref = ctx.prefer[id];
      const off = offeredTerms(pref ? [pref] : c.sub || []);
      let terms = off.t;
      if (!off.known) terms = semTerms(String(c.sem) + (c.open ? " " + c.open : ""));
      const P0 = PRE.get(id);
      const extra = ctx.extraPre[id] || [];
      const subs = pref ? [pref] : c.sub || [];
      it = { id, c, out: c.out ? c : null, name: c.name, cr: c.cr, y: c.y, terms, known: off.known, kind: c.kind, dept: c.dept,
        season: seasonOf(subs), hard: [...P0.hard, ...extra.map((k) => [k])], co: P0.co, soft: P0.soft };
    } else {
      const o = ctx.outsideById.get(id);
      if (!o) return null;
      it = { id, out: o, name: o.name, cr: o.cr, y: o.y, terms: semTerms(o.sem || "1·2"), known: false, kind: o.kind || "", dept: "",
        season: o.season != null ? o.season : seasonOf(o.code ? [o.code] : []), hard: (o.hard || []).map((k) => [k]), co: [], soft: [] };
      if (!it.terms.size) { it.terms.add(1); it.terms.add(2); }
    }
    ctx.items.set(id, it);
    return it;
  }

  function catOf(T, id, placedPicks) {
    for (const [gi, g] of T.pick.entries()) if (g.of.includes(id)) return placedPicks && placedPicks[gi] && !placedPicks[gi].includes(id) ? "elec" : g.cat;
    if (T.basicList.includes(id)) return "basic";
    if (T.reqList.includes(id)) return "req";
    const o = T.outside.find((x) => x.id === id);
    if (o) return o.cat || "elec";
    if (T.notAccept.includes(id)) return null;
    const c = COURSE.get(id);
    if (c && c.dept === T.m.id) return T.kindOverride[id] || "elec";
    if (T.accept.includes(id)) return "elec";
    return null;
  }

  function buildPlan() {
    const Ts = P.majors.map((_, i) => trackOf(i));
    const col = REQ.colleges[Ts[0].m.college];
    const ctx = { items: new Map(), prefer: col.prefer || {}, extraPre: {}, outsideById: new Map() };
    Ts.forEach((T) => { Object.assign(ctx.extraPre, T.m.extraPre || {}); T.outside.forEach((o) => ctx.outsideById.set(o.id, o)); });
    (col.libOutside || []).forEach((o) => ctx.outsideById.set(o.id || "@" + o.name, Object.assign({ id: o.id || "@" + o.name, cat: null, lib: true }, o)));
    const LIB = libFor(Ts[0]);
    const libCards = libItems(LIB);
    libCards.forEach((o) => ctx.outsideById.set(o.id, o));
    const removed = new Set(P.removed);
    const need = [];               // [id, 우선순위]
    const prio = new Map();
    const want = (id, pr) => {
      if (removed.has(id) || !itemOf(id, ctx)) return;
      if (!prio.has(id)) { need.push(id); prio.set(id, pr); } else prio.set(id, Math.min(prio.get(id), pr));
    };
    /* 1) 교양 필수(과목 관련), 각 전공의 기초·필수, 골라 듣기 묶음, QURI 밖 필수 */
    (col.lib || []).forEach((k) => want(k, 0));
    (col.libOutside || []).forEach((o) => want(o.id || "@" + o.name, 0));
    libCards.forEach((o) => want(o.id, o.libCat === "area" ? 3 : 0));   // 영역 과목은 전공 필수 뒤에 빈자리로
    Ts.forEach((T, i) => {
      T.libExtra.forEach((k) => want(k, 0));
      [...T.basicList, ...T.reqList].forEach((k) => want(k, 1 + Math.min(i, 1)));
      T.outside.filter((o) => !o.optional).forEach((o) => want(o.id, 1 + Math.min(i, 1)));
    });
    Object.entries(P.pins).forEach(([id, s]) => { if (!removed.has(id) && itemOf(id, ctx)) want(id, 1); });
    const closure = () => {   // 선수(hard)를 계획에 넣는다
      for (let i = 0; i < need.length; i++) {
        const it = ctx.items.get(need[i]);
        it.hard.forEach((g) => { if (!g.some((k) => prio.has(k))) { const k = g.find((x) => !removed.has(x)); if (k) want(k, prio.get(it.id)); } });
      }
    };
    const pickFill = () => Ts.forEach((T, i) => T.pick.forEach((g) => {
      let have = g.of.filter((k) => prio.has(k)).length;
      const cand = g.of.filter((k) => !prio.has(k) && !removed.has(k) && COURSE.has(k))
        .sort((a, b) => Ts.filter((U) => catOf(U, b)).length - Ts.filter((U) => catOf(U, a)).length || COURSE.get(a).y - COURSE.get(b).y || codeNum(a) - codeNum(b));
      while (have < g.n && cand.length) { want(cand.shift(), 1 + Math.min(i, 1)); have++; }
    }));
    pickFill(); closure();
    /* 2) 전공선택을 학점이 찰 때까지: 여러 전공에 함께 인정되는 과목부터 */
    const credit = (T, cat) => {
      let s = 0, acc = 0;
      need.forEach((id) => {
        const c = catOf(T, id);
        if (!c || (cat && c !== cat)) return;
        const it = ctx.items.get(id);
        if (c === "elec" && T.accept.includes(id)) { if (acc + it.cr > T.acceptMax) return; acc += it.cr; }
        s += it.cr;
      });
      return s;
    };
    const pool = (T) => {
      const ids = [];
      DEPT.get(T.m.id).courses.forEach((c) => ids.push(c.code));
      T.accept.forEach((k) => ids.push(k));
      return ids.filter((k) => COURSE.has(k) && catOf(T, k) === "elec");
    };
    /* 학년·학기 칸마다 이미 넣은 학점. 전공선택은 학점이 적은 칸의 과목부터 골라 2~4학년에 고르게 퍼지게 한다
       (4학년 과목은 요람 4학년 과목뿐이라 그냥 두면 4학년 칸이 빈다) */
    const yearsOf = (it) => (it.slotY ? [it.slotY] : it.c && /4/.test(it.c.yr || "") ? [Math.min(4, it.y), 4] : [Math.min(4, it.y)]);   // 3·4학년 공통은 4학년 칸도
    const slots = (it) => [...new Set(yearsOf(it))].flatMap((y) => [...it.terms].map((t) => y * 10 + t));
    const slotLoad = () => {
      const L = new Map();
      need.forEach((k) => { const it = ctx.items.get(k), ss = slots(it); ss.forEach((s) => L.set(s, (L.get(s) || 0) + it.cr / ss.length)); });
      return L;
    };
    const skip = new Set(), autoElec = new Set();   // 배치하지 못해 바꾼 과목, 자동으로 고른 전공선택
    let placedOnce = false;
    const fits = (k) => {   // 한 번 배치한 뒤 바꿀 과목은 아직 자리가 남은 정규학기에 들어갈 수 있는 것만
      const it = itemOf(k, ctx);
      for (let p = Math.max(0, ((it.slotY || it.y) - 1) * 4); p < NP; p += 2) if (it.terms.has(termOf(p)) && used[p] + it.cr <= budget) return true;
      return false;
    };
    const fillElec = () => Ts.forEach((T, i) => {
      let guard = 0;
      while (credit(T, "elec") < T.spec.elec && guard++ < 80) {
        const L = slotLoad();
        const best = (k) => slots(itemOf(k, ctx)).reduce((a, s) => ((L.get(s) || 0) < (L.get(a) || 0) ? s : a));
        const load = (k) => L.get(best(k)) || 0;
        const cand = pool(T).filter((k) => !prio.has(k) && !removed.has(k) && !skip.has(k) && itemOf(k, ctx).terms.size && (!placedOnce || fits(k)))
          .filter((k) => !(COURSE.get(k).out && COURSE.get(k).cr < 3))   // 1~2학점 세미나·연구는 직접 고른다
          .filter((k) => !firstOf(k) || prio.has(firstOf(k)))   // '…(2)'는 '…(1)'을 고른 뒤에
          .filter((k) => !T.accept.includes(k) || acceptUsed(T) + COURSE.get(k).cr <= T.acceptMax)
          .sort((a, b) => Ts.filter((U) => catOf(U, b)).length - Ts.filter((U) => catOf(U, a)).length
            || load(a) - load(b) || !!COURSE.get(a).out - !!COURSE.get(b).out
            || COURSE.get(a).y - COURSE.get(b).y || preDepth(a) - preDepth(b) || codeNum(a) - codeNum(b));
        if (!cand.length) break;
        const pickIt = itemOf(cand[0], ctx), by = Math.floor(best(cand[0]) / 10);
        if (by > Math.min(4, pickIt.y)) pickIt.slotY = by;   // 4학년 칸을 채우려고 고른 3·4학년 공통 과목은 4학년에 놓는다
        want(cand[0], 3 + i); autoElec.add(cand[0]); closure();
      }
    });
    fillElec();
    function acceptUsed(T) { return need.filter((k) => T.accept.includes(k) && catOf(T, k) === "elec").reduce((s, k) => s + ctx.items.get(k).cr, 0); }
    function preDepth(k) { return PRE.get(k).hard.length; }
    function firstOf(k) {   // QURI 밖 과목 '이름(2)'의 짝 '이름(1)' (같은 학과에 있을 때)
      const c = COURSE.get(k);
      if (!c.out || !/\(2\)$/.test(c.name)) return null;
      const one = c.name.replace(/\(2\)$/, "(1)");
      const x = DEPT.get(c.dept).courses.find((d) => d.name === one);
      return x ? x.code : null;
    }

    /* 3) 학기 배치: 고정한 과목 먼저, 나머지는 선수·개설 학기·학점 상한을 지키며 앞에서부터 */
    const at = new Map();   // 과목 → 학기 위치(0~14, 홀수는 계절학기)
    const budget = Math.max(3, P.cap - P.rsv);
    const cap = (p) => (isSeason(p) ? SEASON_CR : budget);
    const used = Array(NP).fill(0);
    Object.entries(P.pins).forEach(([id, p]) => { if (prio.has(id) && p >= 0 && p < NP) { at.set(id, p); used[p] += ctx.items.get(id).cr; } });
    /* 뒤에 딸린 선수 사슬이 긴 과목부터(임계 경로): 양자역학처럼 3~4학기 사슬이 있는 과목이 밀리지 않게 */
    const tail = new Map();
    const tailOf = (k, stack = new Set()) => {
      if (tail.has(k)) return tail.get(k);
      if (stack.has(k)) return 0;
      stack.add(k);
      let v = 0;
      (NEXT.get(k) || []).forEach((n) => {
        if (!prio.has(n)) return;
        const it = ctx.items.get(n);
        if (it.hard.some((g) => g.includes(k))) v = Math.max(v, 1 + tailOf(n, stack));
      });
      stack.delete(k);
      tail.set(k, v);
      return v;
    };
    const band = (k) => { const p = prio.get(k); return p === 0 ? 0 : p <= 2 ? 1 : 2; };   // 교양, 어느 전공이든 기초·필수, 전공선택
    let order = [];
    const sortOrder = () => {
      tail.clear();
      order = need.filter((k) => !pinnedAt.has(k)).sort((a, b) => band(a) - band(b) || tailOf(b) - tailOf(a) || prio.get(a) - prio.get(b)
        || ctx.items.get(a).y - ctx.items.get(b).y || codeNum(a) - codeNum(b));
    };
    const pinnedAt = new Map(at);
    sortOrder();
    let early = 0;   // 넣지 못한 과목이 생기면 요람 학년보다 한 학기 일찍 듣는 것까지 허용해 다시 배치한다
    let useSeason = false;   // 계절학기는 정규학기에 다 넣지 못할 때만 자동으로 쓴다
    const ok = (it, p) => {
      if (isSeason(p)) { if (!useSeason || !seasonOn(p) || !it.season.has(seasonName(p))) return false; }
      else if (!it.terms.has(termOf(p))) return false;
      if (p < ((it.slotY || it.y) - 1) * 4 - early * 2) return false;
      for (const g of it.hard) {
        const inPlan = g.filter((k) => prio.has(k));
        if (inPlan.length && !inPlan.some((k) => at.has(k) && at.get(k) < p)) return false;
      }
      for (const k of it.co) if (prio.has(k) && !(at.has(k) && at.get(k) <= p)) return false;
      return true;
    };
    const pinned = new Map(at), pinnedUsed = used.slice();
    const run = () => {
      at.clear(); pinned.forEach((v, k) => at.set(k, v));
      used.splice(0, NP, ...pinnedUsed);
      for (let p = 0; p < NP; p++) {
        let moved = true;
        while (moved) {
          moved = false;
          for (const id of order) {
            if (at.has(id)) continue;
            const it = ctx.items.get(id);
            if (used[p] + it.cr <= cap(p) && ok(it, p)) { at.set(id, p); used[p] += it.cr; moved = true; }
          }
        }
      }
    };
    run();
    if (P.season && need.some((k) => !at.has(k))) { useSeason = true; run(); }
    placedOnce = true;
    /* 그래도 남는 과목이 있으면 두 길을 모두 해 보고 빠지는 학점이 적은 쪽을 쓴다:
       (가) 요람 학년보다 한 학기 일찍 듣기, (나) 자동으로 고른 전공선택을 자리가 남은 학기의 다른 과목으로 바꾸기 */
    if (need.some((k) => !at.has(k))) {
      const lack = () => need.filter((k) => !at.has(k)).reduce((s, k) => s + ctx.items.get(k).cr, 0)
        + Ts.reduce((s, T) => s + Math.max(0, T.spec.elec - need.filter((k) => at.has(k) && catOf(T, k) === "elec").reduce((x, k) => x + ctx.items.get(k).cr, 0)), 0);
      const snap = { need: need.slice(), prio: new Map(prio), auto: new Set(autoElec) };
      early = 1; run();
      const lackA = lack();
      early = 0;
      for (let round = 0; round < 6; round++) {
        const bad = need.filter((k) => !at.has(k) && autoElec.has(k));
        if (!bad.length) break;
        bad.forEach((k) => { skip.add(k); autoElec.delete(k); need.splice(need.indexOf(k), 1); prio.delete(k); });
        fillElec(); sortOrder(); run();
      }
      if (need.some((k) => !at.has(k))) { early = 1; run(); }
      if (lackA <= lack()) {   // (가)가 낫거나 같으면 되돌린다
        need.splice(0, need.length, ...snap.need);
        prio.clear(); snap.prio.forEach((v, k) => prio.set(k, v));
        autoElec.clear(); snap.auto.forEach((k) => autoElec.add(k));
        sortOrder(); early = 1; run();
      }
    }
    const unplaced = need.filter((k) => !at.has(k));
    PLAN = { Ts, col, ctx, need, prio, at, used, budget, cap, unplaced, removed, LIB };
    return PLAN;
  }

  /* 배치된 과목마다 지켜지지 않은 조건 */
  function issues(id) {
    const { ctx, at, prio } = PLAN;
    const it = ctx.items.get(id), s = at.get(id), out = [];
    if (s == null) return out;
    if (isSeason(s)) { if (!it.season.has(seasonName(s))) out.push(`최근 3년 ${seasonName(s)}학기 개설 기록이 없습니다`); }
    else if (!it.terms.size) out.push(`${OFFER_FROM}년 이후 연세대 개설 기록이 없습니다`);
    else if (!it.terms.has(termOf(s))) out.push(`연세대에서 주로 ${[...it.terms].join("·")}학기에 열립니다`);
    it.hard.forEach((g) => {
      const inPlan = g.filter((k) => prio.has(k));
      if (!inPlan.length) { if (g.every((k) => PLAN.removed.has(k))) out.push(`선수 ${g.map(nm).join(" 또는 ")}을(를) 계획에서 뺐습니다`); return; }
      if (!inPlan.some((k) => at.has(k) && at.get(k) < s)) out.push(`선수 ${inPlan.map(nm).join(" 또는 ")}이(가) 이보다 앞 학기에 있어야 합니다`);
    });
    it.co.forEach((k) => { if (prio.has(k) && !(at.has(k) && at.get(k) <= s)) out.push(`${nm(k)}을(를) 같은 학기나 그 전에 들어야 합니다`); });
    if (s < (it.y - 1) * 4) out.push(`요람 배치는 ${it.y}학년입니다. 일찍 듣는다면 학과에 확인하세요`);
    return out;
  }
  const nm = (k) => (COURSE.get(k) || {}).name || (PLAN.ctx.items.get(k) || {}).name || k;

  function tagsOf(id) {
    return PLAN.Ts.map((T, i) => { const c = catOf(T, id, placedPicks(T)); return c ? { i, short: T.m.name, cat: c } : null; }).filter(Boolean);
  }
  const CAT = { basic: "기초", req: "필수", elec: "선택" };
  function placedPicks(T) {
    const { at } = PLAN;
    return T.pick.map((g) => g.of.filter((k) => at.has(k)).sort((a, b) => at.get(a) - at.get(b) || codeNum(a) - codeNum(b)).slice(0, g.n));
  }

  function card(id, where) {
    const it = PLAN.ctx.items.get(id) || itemOf(id, PLAN.ctx);
    if (!it) return "";
    const tags = tagsOf(id);
    const iss = where === "board" ? issues(id) : [];
    const pinned = P.pins[id] != null;
    const old = it.c ? oldName(it.c, P.cohort) : "";
    const lib = (it.out && it.out.lib) || (it.c && it.c.kind === "대학교양") || PLAN.Ts.some((T) => T.libExtra.includes(id));
    return `<button type="button" class="rm-card${it.out ? " is-out" : ""}${iss.length ? " is-warn" : ""}${tags.length > 1 ? " is-multi" : ""}" draggable="true" data-id="${esc(id)}"
      aria-label="${esc(it.name)} ${it.cr}학점${it.out ? ", QURI 밖 과목" : ""}${iss.length ? ", 확인할 점 " + iss.length + "개" : ""}">
      <span class="t">${esc(it.c ? nameOf(it.c) : it.name)}${old ? ` <small class="old" title="${P.cohort}학번 요람의 과목명">(${esc(old)})</small>` : ""}</span>
      <span class="m"><span class="mono">${it.c ? esc(noOf(it.c)) : esc((it.out && it.out.code) || "요람")}</span> ${it.cr}학점${pinned ? ' <span class="pin" title="직접 옮긴 과목">고정</span>' : ""}${it.out ? ' <span class="pin">QURI 밖</span>' : ""}</span>
      ${tags.length ? `<span class="tags">${tags.map((t) => `<span class="tag${t.i === 0 ? " is-first" : ""}">${esc(t.short)} ${CAT[t.cat]}</span>`).join("")}</span>` : lib ? '<span class="tags"><span class="tag">교양</span></span>' : ""}
      ${iss.length ? `<span class="warn">${iss.map(esc).join("<br>")}</span>` : ""}</button>`;
  }

  function renderPlan() {
    buildPlan();
    NAME_DEPT = PLAN.Ts[0].m.id;   // 계획은 제1전공 학과의 과목명으로 보인다
    needNames(NAME_DEPT, () => { if (TAB === "plan") renderPlan(); });
        const { Ts, col, at, used, budget, unplaced } = PLAN;
    document.body.dataset.dept = Ts[0].m.id;

    /* 전공 목록 */
    $("#p-majors").innerHTML = Ts.map((T, i) => `<li>
      <span class="mono rm-ord">${i === 0 ? "제1전공" : `제${i + 1}전공`}</span>
      <b>${esc(T.m.name)}</b> <span class="dim small">${esc(REQ.colleges[T.m.college].name)}</span>
      <select data-i="${i}" class="p-track" aria-label="${esc(T.m.name)} 이수 형태">${T.choices.map((k) => `<option value="${k}"${k === T.key ? " selected" : ""}>${esc(T.m.tracks[k].label)} · ${T.m.tracks[k].major}학점</option>`).join("")}</select>
      <span class="rm-mbtn">
        <button type="button" class="rm-btn sm" data-up="${i}" ${i === 0 ? "disabled" : ""} aria-label="${esc(T.m.name)} 위로">위로</button>
        <button type="button" class="rm-btn sm" data-del="${i}" ${Ts.length === 1 ? "disabled" : ""} aria-label="${esc(T.m.name)} 빼기">빼기</button>
      </span></li>`).join("");
    const left = REQ.majors.filter((m) => !P.majors.some((x) => x.id === m.id));
    $("#p-add").innerHTML = left.map((m) => `<option value="${m.id}">${esc(m.name)}</option>`).join("");
    $("#p-add").disabled = $("#p-add-btn").disabled = P.majors.length >= 5 || !left.length;
    $("#p-cap").value = P.cap; $("#p-rsv").value = P.rsv; $("#p-season").checked = !!P.season;
    $("#p-cohort").innerHTML = YEARS.slice().reverse().map((y) => `<option value="${y}"${y === P.cohort ? " selected" : ""}>${y}학번</option>`).join("");

    /* 요건 충족 */
    const placed = [...at.keys()];
    const planCr = placed.reduce((s, k) => s + PLAN.ctx.items.get(k).cr, 0);
    const total = Ts[0].m.total || col.total, est = planCr + P.rsv * SEMS;
    let html = `<div class="rm-rq rm-total"><h3>졸업 총학점 <small>${P.cohort}학번 ${esc(Ts[0].m.name)}(${esc(col.name)}) 기준 ${total}학점</small></h3>
      ${bar(planCr, total, P.rsv * SEMS)}
      <p class="small">계획한 과목(교양 포함) ${planCr}학점 + 학기마다 남긴 일반선택 ${P.rsv}학점 × 8 = 약 <b>${est}</b>학점${est < total ? `. ${total - est}학점은 일반선택 등으로 더 채워야 합니다` : ""}.</p></div>`;
    html += libBox(placed);
    html += Ts.map((T, i) => reqBox(T, i, placed)).join("");
    $("#p-req").innerHTML = html;

    /* 겹치는 과목 */
    const multi = placed.filter((k) => tagsOf(k).length > 1);
    let ov = "";
    if (Ts.length > 1) {
      const rules = [...new Set(Ts.map((T) => T.m.college))].map((c) => REQ.colleges[c].overlap);
      const lim = Ts.filter((T) => T.m.overlapMax).map((T) => ({ T, max: T.m.overlapMax, got: multi.filter((k) => catOf(T, k)).reduce((s, k) => s + PLAN.ctx.items.get(k).cr, 0) }));
      ov = `<h3 class="rm-h3">여러 전공에 겹치는 과목</h3>
        ${multi.length ? `<table class="rm-tbl"><thead><tr><th>과목</th><th>학점</th>${Ts.map((T) => `<th>${esc(T.m.name)}</th>`).join("")}</tr></thead><tbody>
        ${multi.map((k) => `<tr><td>${esc(nm(k))}</td><td>${PLAN.ctx.items.get(k).cr}</td>${Ts.map((T) => { const c = catOf(T, k, placedPicks(T)); return `<td>${c ? CAT[c] : ""}</td>`; }).join("")}</tr>`).join("")}</tbody></table>`
        : '<p class="small dim">지금 계획에는 두 전공 이상에 함께 인정되는 과목이 없습니다.</p>'}
        ${lim.filter((x) => x.got > x.max).map((x) => `<p class="rm-alert">${esc(x.T.m.name)}: 다른 전공과 겹쳐 인정되는 학점이 ${x.got}학점입니다. 요람은 ${x.max}학점까지만 인정하므로 ${x.got - x.max}학점을 다른 과목으로 더 들어야 합니다.</p>`).join("")}
        <ul class="rm-notes">${rules.map((r) => `<li${r.check ? ' class="is-check"' : ""}>${esc(r.t)} <span class="rm-cite">${esc(r.src)}</span></li>`).join("")}</ul>`;
    }
    $("#p-overlap").innerHTML = ov;

    /* 8학기 계획표 */
    const lost = unplaced.reduce((s, k) => s + PLAN.ctx.items.get(k).cr, 0);
    const shown = Array.from({ length: NP }, (_, p) => p).filter((p) => !isSeason(p) || P.season || placed.some((k) => at.get(k) === p));
    const rowOf = (p) => { const r = p % 4; return P.season ? r + 1 : r === 0 ? 1 : 2; };   // 1학기, 여름, 2학기, 겨울
    $("#p-board").innerHTML = (unplaced.length ? `<p class="rm-alert rm-lost">${unplaced.length}과목(${lost}학점)을 8학기${P.season ? "와 계절학기" : ""} 안에 넣지 못했습니다. 학기당 학점 상한을 올리거나, 일반선택에 남길 학점을 줄이거나, 전공 수를 줄여 보세요. 아래 '넣지 못한 과목'에서 직접 학기를 골라 넣을 수도 있습니다.</p>` : "") + shown.map((p) => {
      const ids = placed.filter((k) => at.get(k) === p).sort((a, b) => (PLAN.prio.get(a) - PLAN.prio.get(b)) || codeNum(a) - codeNum(b));
      const lim = PLAN.cap(p), over = used[p] > lim, se = isSeason(p), off = se && !seasonOn(p);
      return `<section class="rm-sem${over ? " is-over" : ""}${se ? " is-season" : ""}${off ? " is-off" : ""}" data-s="${p}" style="--col:${yearOfP(p)};--row:${rowOf(p) + (unplaced.length ? 1 : 0)}" aria-label="${semName(p)}">
        <h3>${semName(p)} <span class="mono">${off ? "" : `${used[p]}<small>/${lim}</small>`}${se ? ` <button type="button" class="rm-btn sm rm-stog" data-stog="${p}" aria-pressed="${!off}" aria-label="${semName(p)} ${off ? "켜기" : "끄기"}">${off ? "켜기" : "끄기"}</button>` : ""}</span></h3>
        <div class="rm-drop">${ids.map((k) => card(k, "board")).join("") || `<p class="rm-hint">${off ? "꺼 둔 계절학기입니다" : se ? "최근 3년 계절학기에 열린 과목만" : "여기로 끌어 놓기"}</p>`}</div>
        ${over ? `<p class="rm-alert small">${se ? `계절학기 상한 ${SEASON_CR}학점` : `학기 상한 ${P.cap}학점 − 일반선택 ${P.rsv}학점`}을 넘었습니다</p>` : ""}</section>`;
    }).join("");

    /* 배치하지 않은 과목 */
    const reasons = (id) => {
      const it = PLAN.ctx.items.get(id);
      if (!it.terms.size) return `${OFFER_FROM}년 이후 개설 기록 없음`;
      return "학점 상한이나 선수 순서 때문에 8학기 안에 넣지 못했습니다";
    };
    const extra = [];
    Ts.forEach((T) => {
      const ids = [...new Set([...DEPT.get(T.m.id).courses.map((c) => c.code), ...T.accept, ...T.basicList, ...T.reqList, ...T.pick.flatMap((g) => g.of), ...T.outside.map((o) => o.id)])]
        .filter((k) => !at.has(k) && !unplaced.includes(k) && !P.removed.includes(k) && (COURSE.has(k) || PLAN.ctx.outsideById.has(k)) && catOf(T, k));
      ids.forEach((k) => itemOf(k, PLAN.ctx));
      if (ids.length) extra.push({ T, ids });
    });
    $("#p-pool").innerHTML = `<section class="rm-sem rm-poolzone" data-s="-1" aria-label="배치하지 않은 과목">
      <h3>배치하지 않은 과목 <small class="dim">여기로 끌어 놓으면 계획에서 빠집니다</small></h3>
      ${unplaced.length ? `<h4>넣지 못한 과목</h4><div class="rm-drop">${unplaced.map((k) => card(k) .replace("</button>", `<span class="warn">${esc(reasons(k))}</span></button>`)).join("")}</div>` : ""}
      ${P.removed.length ? `<h4>뺀 과목</h4><div class="rm-drop">${P.removed.filter((k) => itemOf(k, PLAN.ctx)).map((k) => card(k)).join("")}</div>` : ""}
      ${extra.map(({ T, ids }) => `<h4>${esc(T.m.name)}에서 더 고를 수 있는 과목</h4><div class="rm-drop">${ids.sort((a, b) => (PLAN.ctx.items.get(a).y - PLAN.ctx.items.get(b).y) || codeNum(a) - codeNum(b)).map((k) => card(k)).join("")}</div>`).join("")}
      </section>`;

    /* 학번 요람과 지금 교과과정의 과목 대응표: 이 학번 뒤에 바뀐 것만 */
    const depts = new Set(Ts.map((T) => T.m.id));
    const rn = (REQ.renames || []).filter((r) => depts.has(r.dept) && P.cohort < r.since);
    const rnTbl = `<h3 class="rm-h3">과목 대응표 <small>${P.cohort}학번 요람 → 지금(2026) 교과과정</small></h3>
      ${rn.length ? `<div class="rm-tblwrap"><table class="rm-tbl"><thead><tr><th>학정번호</th><th>${P.cohort}학번 요람</th><th>지금</th><th>바뀐 해</th><th>메모</th></tr></thead><tbody>
      ${rn.map((r) => `<tr><td class="mono">${esc(r.code || "—")}</td><td>${esc(r.old || "(없음)")}</td><td>${esc(r.new || "(폐지)")}</td><td>${r.since} 요람</td><td class="small">${esc(r.t || "")}</td></tr>`).join("")}</tbody></table></div>
      <p class="small dim">로드맵의 과목 카드는 지금 이름으로 보이고, 이름이 바뀐 과목은 괄호 안에 학번 요람의 이름을 함께 적었습니다. 폐지된 과목의 대체 인정은 학과에 확인하세요.</p>`
      : '<p class="small dim">고른 전공에서 이 학번 요람 뒤로 이름이나 학정번호가 바뀐 과목을 찾지 못했습니다.</p>'}`;

    /* 출처 */
    $("#p-rn").innerHTML = rnTbl;
    $("#p-src").innerHTML = `<h3 class="rm-h3">출처</h3><ul class="rm-notes">
      ${Object.entries(REQ.sources).map(([k, s]) => `<li><span class="mono">${k}</span> <a href="${esc(s.url)}" rel="noopener">${esc(s.title)}</a></li>`).join("")}
      ${REQ.general.map((g) => `<li>${esc(g.t)} <span class="rm-cite">${esc(g.src)}</span></li>`).join("")}
      <li>개설 학기는 ${OFFER_FROM}년 이후 연세대 수강편람 개설 이력으로 판단했습니다(1·2학기). 확인일 ${esc(REQ.checked)}.</li>
      <li>계절학기에는 학기마다 ${SEASON_CR}학점까지, 최근 3년(${esc(SEASON.terms[0] || "")}~${esc(SEASON.terms[SEASON.terms.length - 1] || "")}) 계절학기에 열린 과목만 넣습니다(curricula/univ-season.json, 확인일 ${esc(SEASON.checked || "")}). ${esc(Object.entries(SEASON.lib).map(([k, v]) => `${k}: ${v.t}`).join(" · "))}</li></ul>`;
    /* 단계 요약 */
    const boxes = Ts.map((T, i) => ({ T, sum: majorSum(T, placed) }));
    const met = boxes.filter((b) => b.sum.got >= b.sum.need).length;
    $("#p-req-sub").textContent = `${P.cohort}학번 대학요람의 졸업요건과 지금 계획을 나란히 봅니다. 막대가 모자라면 3단계에서 과목을 더하거나 학기 설정을 바꾸세요.`;
    $("#w-s1").textContent = `${P.cohort}학번 · ${Ts.map((T) => `${T.m.name} ${T.key === "single" ? "단일" : T.key === "deep" ? "심화" : T.key === "first" ? "제1" : T.key === "double" ? "복수" : "부"}`).join(" · ")}`;
    $("#w-s2").textContent = `졸업 ${planCr}/${total} · 전공 ${met}/${Ts.length} 충족`;
    $("#w-s3").textContent = `${placed.length}과목 배치${unplaced.length ? ` · ${unplaced.length}과목 못 넣음` : ""}`;
    $("#w-s4").textContent = "링크·인쇄";
    $("#p-mini").textContent = `졸업 ${planCr}/${total} · ${boxes.map((b) => `${b.T.m.name} ${b.sum.got}/${b.sum.need}`).join(" · ")}`;
    renderSteps();
    save();
  }
  function majorSum(T, placed) {
    const pp = placedPicks(T);
    let got = 0, acc = 0;
    placed.forEach((k) => {
      const c = catOf(T, k, pp); if (!c) return;
      const cr = PLAN.ctx.items.get(k).cr;
      if (c === "elec" && T.accept.includes(k)) { if (acc + cr > T.acceptMax) return; acc += cr; }
      got += cr;
    });
    return { got, need: T.spec.major };
  }
  /* 단계: 지금 단계만 펼치고, 나머지는 위쪽 단계 표시줄의 요약으로 */
  function renderSteps() {
    const st = [1, 2, 3, 4].includes(P.step) ? P.step : 1;
    [1, 2, 3, 4].forEach((n) => {
      $(`#step-${n}`).hidden = n !== st;
      const b = document.querySelector(`.rm-wiz [data-step="${n}"]`);
      if (b) { b.setAttribute("aria-current", n === st ? "step" : "false"); b.classList.toggle("is-done", n < st); }
    });
  }
  function goStep(n) {
    P.step = n; renderSteps(); save();
    const top = $(".rm-wiz"); if (top && top.scrollIntoView) top.scrollIntoView({ block: "nearest" });
    const h = $(`#h-step-${n}`); if (h && h.focus) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
  }
  /* 계획 링크: 계획을 주소 뒤(#plan=)에 담는다 */
  const PLAN_KEYS = ["cohort", "majors", "cap", "rsv", "season", "seasonOff", "pins", "removed"];
  function planLink() {
    const o = {}; PLAN_KEYS.forEach((k) => { o[k] = P[k]; });
    const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    return `${location.origin}${location.pathname}?tab=plan#plan=${b64}`;
  }
  function readLink() {
    const m = /#plan=([\w-]+)/.exec(location.hash || "");
    if (!m) return null;
    try {
      const o = JSON.parse(decodeURIComponent(escape(atob(m[1].replace(/-/g, "+").replace(/_/g, "/")))));
      const out = {}; PLAN_KEYS.forEach((k) => { if (k in o) out[k] = o[k]; });
      return out;
    } catch (e) { return null; }
  }

  function bar(v, max, extra) {
    const pct = (x) => Math.max(0, Math.min(100, (x / Math.max(1, max)) * 100));
    return `<div class="rm-bar" role="img" aria-label="${v}/${max}학점"><span class="f" style="width:${pct(v)}%"></span>${extra ? `<span class="x" style="left:${pct(v)}%;width:${pct(Math.min(extra, max - v))}%"></span>` : ""}</div>`;
  }
  /* 교양 요건: 교양기초(채플·글쓰기·기독교의이해), RC, 대학교양 필수 과목(이과 공통필수·공학수학 등), 대학교양 영역 */
  function libBox(placed) {
    const { LIB, col, ctx, Ts } = PLAN;
    const got = { basic: 0, rc: 0, area: 0, must: 0 };
    const mustIds = [...(col.lib || []), ...(col.libOutside || []).map((o) => o.id || "@" + o.name), ...Ts[0].libExtra];
    placed.forEach((k) => { const it = ctx.items.get(k); if (it.out && it.out.libCat) got[it.out.libCat] += it.cr; else if (mustIds.includes(k)) got.must += it.cr; });
    const mustCr = mustIds.reduce((s, k) => s + ((itemOf(k, ctx) || {}).cr || 0), 0);
    const row = (lab, v, max) => `<div class="rm-row"><span>${lab}</span>${bar(v, max)}<span class="mono">${v}/${max}</span></div>`;
    const area = Math.ceil(LIB.area / 3) * 3;
    return `<div class="rm-rq rm-lib"><h3>교양 <small>${P.cohort}학번 ${esc(Ts[0].m.name)} 기준 · 교양기초 ${LIB.basic} · RC ${LIB.rc} · 대학교양 필수 ${mustCr} · 영역 ${LIB.area}</small></h3>
      ${row("교양기초", got.basic, LIB.basic)}${row("RC", got.rc, LIB.rc)}${row("대학교양 필수", got.must, mustCr)}${row("대학교양 영역", got.area, area)}
      <p class="small">교양기초는 채플(4학기, 2학점)·글쓰기·기독교의이해입니다. 영역 과목은 QURI에 카드가 없어 자리만 잡아 두었습니다: ${esc(LIB.areaNote || "")}${LIB.info ? " 정보와기술 영역 1과목은 필수입니다." : ""}${LIB.english ? " 언어와표현 영역의 지정 영어 과목 1과목이 필수입니다." : ""}</p>
      <details><summary>요건 메모와 출처</summary><ul class="rm-notes">
        <li>${esc(col.libNote)} <span class="rm-cite">${esc(col.libSrc)}</span></li>
        <li>${esc(LIB.srcs.join(" · "))}${LIB.englishSrc ? " · " + esc(LIB.englishSrc) : ""}</li></ul></details></div>`;
  }
  function reqBox(T, i, placed) {
    const pp = placedPicks(T);
    const got = { basic: 0, req: 0, elec: 0 };
    let acc = 0;
    placed.forEach((k) => {
      const c = catOf(T, k, pp); if (!c) return;
      const cr = PLAN.ctx.items.get(k).cr;
      if (c === "elec" && T.accept.includes(k)) { if (acc + cr > T.acceptMax) return; acc += cr; }
      got[c] += cr;
    });
    const sp = T.spec;
    const row = (lab, cat) => sp[cat] || got[cat] ? `<div class="rm-row"><span>${lab}</span>${bar(got[cat], sp[cat] || got[cat])}<span class="mono">${got[cat]}/${sp[cat]}</span></div>` : "";
    const sum = got.basic + got.req + got.elec;
    const missing = [...T.basicList, ...T.reqList, ...T.outside.filter((o) => !o.optional).map((o) => o.id)].filter((k) => !PLAN.at.has(k));
    const picks = T.pick.map((g, gi) => `<li>${esc(g.label)}: ${pp[gi].length}/${g.n}과목${pp[gi].length < g.n ? " — 부족" : ""}</li>`).join("");
    return `<div class="rm-rq${i === 0 ? " is-first" : ""}">
      <h3><span class="mono">${i === 0 ? "제1전공" : `제${i + 1}전공`}</span> ${esc(T.m.name)} <small>${esc(sp.label)} · 전공 ${sp.major}학점</small></h3>
      ${row("전공기초", "basic")}${row("전공필수", "req")}${row("전공선택", "elec")}
      <div class="rm-row is-sum"><span>전공 소계</span>${bar(sum, sp.major)}<span class="mono">${sum}/${sp.major}</span></div>
      ${sum < sp.major ? `<p class="small">${sp.major - sum}학점이 모자랍니다. 아래 '더 고를 수 있는 과목'(4학년 요람 과목 포함)에서 골라 학기에 넣거나 학기당 학점 상한을 올려 보세요.</p>` : ""}
      ${missing.length ? `<p class="small rm-alert">아직 계획에 없는 필수 과목: ${missing.map((k) => esc(nm(k))).join(", ")}</p>` : ""}
      ${picks ? `<ul class="rm-notes">${picks}</ul>` : ""}
      <details><summary>요건 메모와 출처</summary><ul class="rm-notes">
        <li${sp.check ? ' class="is-check"' : ""}>${esc(sp.src)}${T.m.cohortSrc.length ? ` · ${P.cohort}학번: ${esc(T.m.cohortSrc.join(" · "))}` : ""}</li>
        ${(T.m.notes || []).map((n) => `<li${n.check ? ' class="is-check"' : ""}>${esc(n.t)} <span class="rm-cite">${esc(n.src)}</span></li>`).join("")}</ul></details></div>`;
  }

  /* ---------- 옮기기 (끌기와 누르기) ---------- */
  function moveTo(id, s) {
    const it = PLAN.ctx.items.get(id) || itemOf(id, PLAN.ctx);
    if (s >= 0 && isSeason(s) && !seasonOn(s)) return;   // 꺼 둔 계절학기
    if (s >= 0 && isSeason(s) && !(it && it.season.has(seasonName(s)))) {   // 최근 3년 계절학기에 열리지 않은 과목은 계절학기에 넣지 않는다
      const note = $("#p-board").querySelector(".rm-season-no") || $("#p-board").insertAdjacentElement("afterbegin", Object.assign(document.createElement("p"), { className: "rm-alert rm-lost rm-season-no" }));
      note.textContent = `${it ? it.name : id}은(는) 최근 3년 ${seasonName(s)}학기에 열린 기록이 없어 ${semName(s)}에 넣지 않았습니다.`;
      return;
    }
    if (s < 0) {
      delete P.pins[id];
      if (!P.removed.includes(id)) P.removed.push(id);
    } else {
      P.pins[id] = s;
      P.removed = P.removed.filter((k) => k !== id);
    }
    renderPlan();
  }
  const menu = $("#rm-menu");
  function openMenu(btn) {
    const id = btn.dataset.id;
    const it = PLAN.ctx.items.get(id);
    const cur = PLAN.at.get(id);
    menu.innerHTML = `<p><b>${esc(it.name)}</b> <span class="small dim">${it.cr}학점${it.terms.size ? ` · 연세대 ${[...it.terms].join("·")}학기` : ""}</span></p>
      <div class="rm-menu-g">${Array.from({ length: SEMS }, (_, s) => 2 * s).map((p) => `<button type="button" class="rm-btn sm" data-to="${p}"${p === cur ? ' aria-current="true"' : ""}>${semShort(p)}${it.terms.has(termOf(p)) ? "" : " ·미개설"}</button>`).join("")}</div>
      ${P.season ? `<p class="small dim">계절학기 ${it.season.size ? `(최근 3년 ${[...it.season].join("·")}학기 개설)` : "(최근 3년 개설 기록 없음)"}</p><div class="rm-menu-g">${Array.from({ length: SEMS - 1 }, (_, s) => 2 * s + 1).map((p) => `<button type="button" class="rm-btn sm" data-to="${p}"${p === cur ? ' aria-current="true"' : ""}${it.season.has(seasonName(p)) && seasonOn(p) ? "" : " disabled"}>${semShort(p)}${seasonOn(p) ? "" : " ·끔"}</button>`).join("")}</div>` : ""}
      <div class="rm-menu-a">
        ${cur != null || PLAN.unplaced.includes(id) ? '<button type="button" class="rm-btn sm" data-to="-1">계획에서 빼기</button>' : ""}
        ${P.pins[id] != null ? '<button type="button" class="rm-btn sm" data-unpin="1">자동 배치에 맡기기</button>' : ""}
        ${it.c && it.c.path ? `<a class="rm-btn sm" href="${esc(it.c.path)}">과목 페이지</a>` : ""}
        <button type="button" class="rm-btn sm" data-close="1">닫기</button></div>`;
    menu.dataset.id = id;
    menu.hidden = false;
    const r = btn.getBoundingClientRect();
    const w = Math.min(320, innerWidth - 24);
    menu.style.width = w + "px";
    menu.style.left = Math.max(12, Math.min(innerWidth - w - 12, r.left)) + scrollX + "px";
    menu.style.top = r.bottom + scrollY + 6 + "px";
    (menu.querySelector("[data-to]") || menu.querySelector("button")).focus();
    menu._from = btn;
  }
  function closeMenu() { if (!menu.hidden) { menu.hidden = true; const f = menu._from && document.querySelector(`.rm-card[data-id="${CSS.escape(menu.dataset.id)}"]`); if (f) f.focus(); } }
  menu.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const id = menu.dataset.id;
    if (b.dataset.to != null) { menu.hidden = true; moveTo(id, +b.dataset.to); }
    else if (b.dataset.unpin) { delete P.pins[id]; menu.hidden = true; renderPlan(); }
    else if (b.dataset.close) closeMenu();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
  document.addEventListener("click", (e) => { if (!menu.hidden && !menu.contains(e.target) && !e.target.closest(".rm-card")) menu.hidden = true; });

  const plan = $("#plan");
  plan.addEventListener("click", (e) => {
    const cardEl = e.target.closest(".rm-card");
    if (cardEl) { openMenu(cardEl); return; }
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.step != null || b.dataset.go != null) { goStep(+(b.dataset.step || b.dataset.go)); return; }
    if (b.dataset.stog != null) {   // 계절학기 칸 끄기·켜기. 끄면 그 칸에 고정한 과목은 자동 배치로 돌린다
      const p = +b.dataset.stog, off = new Set(P.seasonOff || []);
      if (off.has(p)) off.delete(p); else { off.add(p); Object.keys(P.pins).forEach((k) => { if (P.pins[k] === p) delete P.pins[k]; }); }
      P.seasonOff = [...off].sort((a, b) => a - b);
      renderPlan(); return;
    }
    if (b.dataset.up != null) { const i = +b.dataset.up; [P.majors[i - 1], P.majors[i]] = [P.majors[i], P.majors[i - 1]]; renderPlan(); }   // 이수 형태는 trackOf가 자리에 맞게 고친다
    else if (b.dataset.del != null) { P.majors.splice(+b.dataset.del, 1); renderPlan(); }
  });
  plan.addEventListener("change", (e) => {
    const t = e.target;
    if (t.classList.contains("p-track")) { P.majors[+t.dataset.i].track = t.value; renderPlan(); }
  });
  $("#p-add-btn").addEventListener("click", () => {
    const id = $("#p-add").value;
    if (!id || P.majors.length >= 5) return;
    P.majors.push({ id, track: "double" });
    if (P.majors.length === 2) P.majors[0].track = "first";
    renderPlan();
  });
  $("#p-link").addEventListener("click", () => {
    const url = planLink(), msg = $("#p-link-msg");
    const done = (ok) => { msg.textContent = ok ? "링크를 복사했습니다." : `복사하지 못했습니다. 이 주소를 직접 복사하세요: ${url}`; };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(() => done(true), () => done(false)); else done(false);
  });
  $("#p-print").addEventListener("click", () => window.print());
  $("#p-cohort").addEventListener("change", (e) => { P.cohort = YEARS.includes(+e.target.value) ? +e.target.value : COHORT0; renderPlan(); });
  $("#p-cap").addEventListener("change", (e) => { P.cap = Math.max(9, Math.min(24, +e.target.value || 18)); renderPlan(); });
  $("#p-rsv").addEventListener("change", (e) => { P.rsv = Math.max(0, Math.min(12, +e.target.value || 0)); renderPlan(); });
  $("#p-season").addEventListener("change", (e) => { P.season = e.target.checked; renderPlan(); });
  $("#p-auto").addEventListener("click", () => { P.pins = {}; renderPlan(); });
  $("#p-reset").addEventListener("click", () => { P.pins = {}; P.removed = []; renderPlan(); });

  let dragId = null;
  plan.addEventListener("dragstart", (e) => {
    const c = e.target.closest(".rm-card"); if (!c) return;
    dragId = c.dataset.id;
    e.dataTransfer.setData("text/plain", dragId);
    e.dataTransfer.effectAllowed = "move";
    c.classList.add("is-drag");
  });
  plan.addEventListener("dragend", () => { dragId = null; document.querySelectorAll(".is-drag,.is-over-drop").forEach((x) => x.classList.remove("is-drag", "is-over-drop")); });
  plan.addEventListener("dragover", (e) => {
    const z = e.target.closest("[data-s]"); if (!z || !dragId) return;
    e.preventDefault();
    document.querySelectorAll(".is-over-drop").forEach((x) => x !== z && x.classList.remove("is-over-drop"));
    z.classList.add("is-over-drop");
  });
  plan.addEventListener("drop", (e) => {
    const z = e.target.closest("[data-s]"); if (!z) return;
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || dragId;
    if (id) moveTo(id, +z.dataset.s);
  });

  /* ---------- 저장과 탭 ---------- */
  function save() { store.set({ v: 2, guide: { school: G.school, dept: G.dept, common: G.common }, plan: P, tab: TAB }); }
  let TAB = "guide";
  function setTab(t) {
    TAB = t;
    ["guide", "plan"].forEach((k) => {
      $(`#tab-${k}`).setAttribute("aria-selected", String(k === t));
      $(`#${k}`).hidden = k !== t;
    });
    if (t === "plan") renderPlan(); else { renderGuide(); save(); }
  }
  document.querySelector(".rm-tabs").addEventListener("click", (e) => { const b = e.target.closest("[role=tab]"); if (b) setTab(b.id.slice(4)); });
  document.querySelector(".rm-tabs").addEventListener("keydown", (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const n = TAB === "guide" ? "plan" : "guide"; setTab(n); $(`#tab-${n}`).focus();
  });

  $("#g-school").addEventListener("change", (e) => { G.school = e.target.value; G.sel = null; renderGuide(); save(); });
  $("#g-dept").addEventListener("change", (e) => { G.dept = e.target.value; G.sel = null; if (G.school === "연세대") setPlace(G.dept); renderGuide(); save(); });
  $("#g-common").addEventListener("change", (e) => { G.common = e.target.checked; renderGuide(); save(); });
  $("#guide").addEventListener("click", (e) => {
    const b = e.target.closest("[data-code]"); if (!b) return;
    G.sel = G.sel === b.dataset.code && b.classList.contains("rm-chip") ? null : b.dataset.code;
    renderDetail();
    if (G.sel && innerWidth < 900) $("#g-detail").scrollIntoView({ block: "nearest", behavior: "smooth" });
  });

  /* ---------- 시작 ---------- */
  /* 메인에서 고른 학과(localStorage "quri-place" = "yonsei/phy" 꼴). 'common'은 학과가 아니라 없다 */
  const placeDept = () => { try { const v = localStorage.getItem("quri-place") || ""; const m = /^yonsei\/(\w+)$/.exec(v); return m ? m[1] : ""; } catch (e) { return ""; } };
  const setPlace = (id) => { try { if (id && id !== "common") localStorage.setItem("quri-place", "yonsei/" + id); } catch (e) { /* 저장소를 막은 브라우저 */ } };
  Promise.all([
    fetch("data/univ.json").then((r) => { if (!r.ok) throw new Error("data/univ.json " + r.status); return r.json(); }),
    fetch("curricula/univ-requirements.json").then((r) => r.json()),
    fetch("curricula/univ-offered.json").then((r) => r.json()).catch(() => ({ codes: {} })),
    fetch("curricula/univ-season.json").then((r) => r.json()).catch(() => ({ codes: {}, lib: {}, terms: [] })),
  ]).then(([univ, req, off, sea]) => {
    loadUniv(univ);
    REQ = req; OFFER = off.codes || {}; SEASON = sea;
    REQ.majors.forEach((m) => MAJOR.set(m.id, m));
    addFourth();
    const saved = store.get();
    if (saved && (saved.v === 1 || saved.v === 2)) {
      Object.assign(G, saved.guide || {});
      if (saved.plan) Object.assign(P, saved.plan);
      if (saved.v === 1) {   // v1은 정규학기 번호(0~7)로 고정했고, 남길 학점에 교양을 넣었다
        Object.keys(P.pins).forEach((k) => { P.pins[k] *= 2; });
        if (P.rsv === 3) P.rsv = 0;
        P.season = true;
        P.seasonOff = [];
      }
      P.majors = (P.majors || []).filter((x) => MAJOR.has(x.id)).slice(0, 5);
      if (!P.majors.length) P.majors = [{ id: "math", track: "single" }];
      TAB = saved.tab === "plan" ? "plan" : "guide";
    }
    const pd = placeDept();   // 메인에서 고른 학과가 있으면 안내 탭은 그 학과로, 처음 만드는 계획은 그 학과 단일전공으로
    if (pd && DEPT.has(pd)) {
      G.dept = pd;
      if (!(saved && saved.plan) && MAJOR.has(pd)) P.majors = [{ id: pd, track: "single" }];
    }
    const q = new URLSearchParams(location.search);
    if (q.get("cohort")) P.cohort = +q.get("cohort");
    const linked = readLink();
    if (linked) {   // 링크로 받은 계획은 저장된 계획보다 앞선다
      Object.assign(P, linked, { step: 3 });
      P.majors = (P.majors || []).filter((x) => x && MAJOR.has(x.id)).slice(0, 5);
      if (!P.majors.length) P.majors = [{ id: "math", track: "single" }];
      TAB = "plan";
    }
    if (!YEARS.includes(P.cohort)) P.cohort = COHORT0;   // 학번을 저장하기 전의 계획은 2026학번으로
    if (q.get("dept") && DEPT.has(q.get("dept"))) G.dept = q.get("dept");
    if (q.get("school")) G.school = normSchool(q.get("school"));
    if (q.get("tab") === "plan" || q.get("tab") === "guide") TAB = q.get("tab");
    if (!DEPT.has(G.dept)) G.dept = "math";
    setTab(TAB);
  }).catch((err) => {
    console.error(err);
    $("#tab-plan").disabled = true;
    $("#guide").insertAdjacentHTML("afterbegin", '<p class="rm-alert">과목 자료(data/univ.json)나 졸업 요건 자료(curricula/univ-requirements.json)를 읽지 못했습니다. 이 폴더를 웹 서버(python -m http.server)로 열었는지, tools/build.py를 한 번 돌렸는지 확인하세요.</p>');
    TAB = "guide";
    if (UNIV.length) renderGuide();
  });
})();
