/* QURI 커리큘럼 안내와 졸업 로드맵 (roadmap.html)
   - 과목: js/toc.js의 window.UNIV (tools/build.py가 만든다)
   - 졸업 요건: curricula/univ-requirements.json (연세대 2026 요람을 옮긴 것)
   - 연세대 개설 이력: curricula/univ-offered.json */
(() => {
  "use strict";

  const UNIV = window.UNIV || [];
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
  const KEY = "quri-roadmap-v1";
  const SEMS = 8;
  const OFFER_FROM = 2024;   // 이 해부터의 개설 이력으로 1·2학기를 판단한다
  const PREFIX = "공통|수학|물리|화학|천우|응통|전전|기계";
  const SCHOOLS = ["연세대", "서울대", "고려대", "KAIST", "POSTECH", "서강대", "성균관대", "한양대", "경희대"];
  const semName = (s) => `${Math.floor(s / 2) + 1}학년 ${s % 2 + 1}학기`;
  const semShort = (s) => `${Math.floor(s / 2) + 1}-${s % 2 + 1}`;

  const store = {
    get() { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* 저장소를 막은 브라우저: 이번 방문 동안만 유지 */ } },
  };

  /* ---------- 과목 색인 ---------- */
  const COURSE = new Map();
  const DEPT = new Map();
  UNIV.forEach((d) => { DEPT.set(d.id, d); d.courses.forEach((c) => COURSE.set(c.code, c)); });
  const codeNum = (code) => parseInt(String(code).replace(/\D+/g, ""), 10) || 0;
  /* 화면에 보이는 과목 번호는 연세대 학정번호(c.sub의 첫 번호). 학정번호가 없는 과목만 QURI 코드로 둔다 */
  const hak = (c) => (c.sub && c.sub[0]) || c.code;
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
  COURSE.forEach((c) => PRE.set(c.code, parsePre(c)));
  const NEXT = new Map();   // 이 과목을 선수로 두는 과목
  PRE.forEach((p, code) => {
    const all = new Set([...p.hard.flat(), ...p.co, ...p.soft]);
    all.forEach((k) => { if (!NEXT.has(k)) NEXT.set(k, new Set()); NEXT.get(k).add(code); });
  });

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
    const m = MAJOR.get(G.dept);
    if (m && REQ && G.school === "연세대") {
      (REQ.colleges[m.college].lib || []).forEach((k) => want.add(k));
      (m.basicList || []).forEach((k) => k.startsWith("공통") && want.add(k));
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
    const m = MAJOR.get(G.dept);

    /* 시작 안내 */
    const first = items.filter((c) => LV.get(c.code) === 1).sort((a, b) => a.y - b.y || String(a.sem).localeCompare(String(b.sem)) || codeNum(a.code) - codeNum(b.code));
    const minY = first.length ? first[0].y : 1;
    const starts = first.filter((c) => c.y === minY);
    let sum = "";
    if (m && G.school === "연세대") {
      const t = m.tracks.single, col = REQ.colleges[m.college];
      sum = `<p class="rm-sum">연세대 ${esc(m.name)} 단일전공은 전공 <b>${t.major}학점</b>(${[t.basic ? `전공기초 ${t.basic}` : "", t.req ? `전공필수 ${t.req}` : "", `전공선택 ${t.elec}`].filter(Boolean).join(" · ")}), 졸업 총 <b>${col.total}학점</b>입니다. <span class="rm-cite">${esc(t.src)}</span></p>`;
    }
    $("#g-start").innerHTML = items.length ? `<div class="rm-start-box"><h2 class="rm-h2">여기서 시작하세요</h2>
      <p>${esc(d.name)} 과목 ${items.length}개 가운데 선수 과목 없이 시작할 수 있는 ${minY}학년 과목입니다.</p>
      <div class="rm-chips">${starts.map((c) => chip(c, true)).join("")}</div>${sum}</div>` : "";

    /* 학년·학기 배치 */
    const years = [...new Set(items.map((c) => c.y))].sort();
    const cell = (y, t) => items.filter((c) => c.y === y && (String(c.sem).includes("1·2") ? t === 1 : String(c.sem) === String(t)))
      .sort((a, b) => (a.dept === "common") - (b.dept === "common") || LV.get(a.code) - LV.get(b.code) || codeNum(a.code) - codeNum(b.code));
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
    return `<button type="button" class="rm-chip${req ? " is-req" : ""}${c.dept === "common" ? " is-common" : ""}" data-code="${c.code}">
      <span class="mono">${esc(hak(c))}</span> ${esc(alt || c.name)}${withSem ? ` <small>${c.y}-${esc(String(c.sem))}</small>` : ""}<small class="k">${kindShort(c.kind)}</small></button>`;
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
    box.innerHTML = `<h3><span class="mono">${esc(hak(c))}</span> ${esc(c.name)}</h3>
      <p class="small dim">${c.y}학년 ${esc(String(c.sem))}학기 · ${esc(c.kind)} · ${c.cr}학점${c.sub && c.sub.length > 1 ? ` · 학정번호 ${c.sub.join(", ")}` : ""}${offTxt ? ` · ${esc(offTxt)}` : ""}</p>
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
  const P = { majors: [{ id: "math", track: "single" }], cap: 18, rsv: 3, pins: {}, removed: [] };
  let PLAN = null;

  function trackOf(i) {
    const sel = P.majors[i], m = MAJOR.get(sel.id);
    const choices = i === 0 ? (P.majors.length > 1 ? ["first"] : ["single", "deep"]) : ["double", "minor"];
    let t = choices.includes(sel.track) && m.tracks[sel.track] ? sel.track : choices.find((k) => m.tracks[k]);
    sel.track = t;
    const spec = m.tracks[t];
    return {
      m, key: t, spec, choices: choices.filter((k) => m.tracks[k]),
      basicList: spec.basicList || m.basicList || [],
      reqList: spec.reqList || m.reqList || [],
      pick: spec.pick || m.pick || [],
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
      if (!off.known) terms = semTerms(String(c.sem) + " " + (c.open || ""));
      const P0 = PRE.get(id);
      const extra = ctx.extraPre[id] || [];
      it = { id, c, name: c.name, cr: c.cr, y: c.y, terms, known: off.known, kind: c.kind, dept: c.dept,
        hard: [...P0.hard, ...extra.map((k) => [k])], co: P0.co, soft: P0.soft };
    } else {
      const o = ctx.outsideById.get(id);
      if (!o) return null;
      it = { id, out: o, name: o.name, cr: o.cr, y: o.y, terms: semTerms(o.sem || "1·2"), known: false, kind: o.kind || "", dept: "", hard: [], co: [], soft: [] };
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
    Ts.forEach((T, i) => {
      (T.spec.libExtra || []).forEach((k) => want(k, 0));
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
    Ts.forEach((T, i) => {
      let guard = 0;
      while (credit(T, "elec") < T.spec.elec && guard++ < 60) {
        const cand = pool(T).filter((k) => !prio.has(k) && !removed.has(k) && itemOf(k, ctx).terms.size)
          .filter((k) => !T.accept.includes(k) || acceptUsed(T) + COURSE.get(k).cr <= T.acceptMax)
          .sort((a, b) => Ts.filter((U) => catOf(U, b)).length - Ts.filter((U) => catOf(U, a)).length
            || COURSE.get(a).y - COURSE.get(b).y || preDepth(a) - preDepth(b) || codeNum(a) - codeNum(b));
        if (!cand.length) break;
        want(cand[0], 3 + i); closure();
      }
    });
    function acceptUsed(T) { return need.filter((k) => T.accept.includes(k) && catOf(T, k) === "elec").reduce((s, k) => s + ctx.items.get(k).cr, 0); }
    function preDepth(k) { return PRE.get(k).hard.length; }

    /* 3) 학기 배치: 고정한 과목 먼저, 나머지는 선수·개설 학기·학점 상한을 지키며 앞에서부터 */
    const at = new Map();
    const budget = Math.max(3, P.cap - P.rsv);
    const used = Array(SEMS).fill(0);
    Object.entries(P.pins).forEach(([id, s]) => { if (prio.has(id) && s >= 0 && s < SEMS) { at.set(id, s); used[s] += ctx.items.get(id).cr; } });
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
    const order = need.filter((k) => !at.has(k)).sort((a, b) => band(a) - band(b) || tailOf(b) - tailOf(a) || prio.get(a) - prio.get(b)
      || ctx.items.get(a).y - ctx.items.get(b).y || codeNum(a) - codeNum(b));
    let early = 0;   // 넣지 못한 과목이 생기면 요람 학년보다 한 학기 일찍 듣는 것까지 허용해 다시 배치한다
    const ok = (it, s) => {
      if (!it.terms.has(s % 2 + 1)) return false;
      if (s < (it.y - 1) * 2 - early) return false;
      for (const g of it.hard) {
        const inPlan = g.filter((k) => prio.has(k));
        if (inPlan.length && !inPlan.some((k) => at.has(k) && at.get(k) < s)) return false;
      }
      for (const k of it.co) if (prio.has(k) && !(at.has(k) && at.get(k) <= s)) return false;
      return true;
    };
    const pinned = new Map(at), pinnedUsed = used.slice();
    const run = () => {
      at.clear(); pinned.forEach((v, k) => at.set(k, v));
      used.splice(0, SEMS, ...pinnedUsed);
      for (let s = 0; s < SEMS; s++) {
        let moved = true;
        while (moved) {
          moved = false;
          for (const id of order) {
            if (at.has(id)) continue;
            const it = ctx.items.get(id);
            if (used[s] + it.cr <= budget && ok(it, s)) { at.set(id, s); used[s] += it.cr; moved = true; }
          }
        }
      }
    };
    run();
    if (need.some((k) => !at.has(k))) { early = 1; run(); }
    const unplaced = need.filter((k) => !at.has(k));
    PLAN = { Ts, col, ctx, need, prio, at, used, budget, unplaced, removed };
    return PLAN;
  }

  /* 배치된 과목마다 지켜지지 않은 조건 */
  function issues(id) {
    const { ctx, at, prio } = PLAN;
    const it = ctx.items.get(id), s = at.get(id), out = [];
    if (s == null) return out;
    if (!it.terms.size) out.push(`${OFFER_FROM}년 이후 연세대 개설 기록이 없습니다`);
    else if (!it.terms.has(s % 2 + 1)) out.push(`연세대에서 주로 ${[...it.terms].join("·")}학기에 열립니다`);
    it.hard.forEach((g) => {
      const inPlan = g.filter((k) => prio.has(k));
      if (!inPlan.length) { if (g.every((k) => PLAN.removed.has(k))) out.push(`선수 ${g.map(nm).join(" 또는 ")}을(를) 계획에서 뺐습니다`); return; }
      if (!inPlan.some((k) => at.has(k) && at.get(k) < s)) out.push(`선수 ${inPlan.map(nm).join(" 또는 ")}이(가) 이보다 앞 학기에 있어야 합니다`);
    });
    it.co.forEach((k) => { if (prio.has(k) && !(at.has(k) && at.get(k) <= s)) out.push(`${nm(k)}을(를) 같은 학기나 그 전에 들어야 합니다`); });
    if (s < (it.y - 1) * 2) out.push(`요람 배치는 ${it.y}학년입니다. 일찍 듣는다면 학과에 확인하세요`);
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
    return `<button type="button" class="rm-card${it.out ? " is-out" : ""}${iss.length ? " is-warn" : ""}${tags.length > 1 ? " is-multi" : ""}" draggable="true" data-id="${esc(id)}"
      aria-label="${esc(it.name)} ${it.cr}학점${iss.length ? ", 확인할 점 " + iss.length + "개" : ""}">
      <span class="t">${esc(it.name)}</span>
      <span class="m"><span class="mono">${it.c ? esc(hak(it.c)) : esc((it.out && it.out.code) || "요람")}</span> ${it.cr}학점${pinned ? ' <span class="pin" title="직접 옮긴 과목">고정</span>' : ""}${it.out ? ' <span class="pin">QURI 밖</span>' : ""}</span>
      ${tags.length ? `<span class="tags">${tags.map((t) => `<span class="tag${t.i === 0 ? " is-first" : ""}">${esc(t.short)} ${CAT[t.cat]}</span>`).join("")}</span>` : (it.out && it.out.lib) || (it.c && it.c.kind === "대학교양") ? '<span class="tags"><span class="tag">교양</span></span>' : ""}
      ${iss.length ? `<span class="warn">${iss.map(esc).join("<br>")}</span>` : ""}</button>`;
  }

  function renderPlan() {
    buildPlan();
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
    $("#p-cap").value = P.cap; $("#p-rsv").value = P.rsv;

    /* 요건 충족 */
    const placed = [...at.keys()];
    const planCr = placed.reduce((s, k) => s + PLAN.ctx.items.get(k).cr, 0);
    const total = col.total, est = planCr + P.rsv * SEMS;
    let html = `<div class="rm-rq rm-total"><h3>졸업 총학점 <small>${esc(col.name)} 기준 ${total}학점</small></h3>
      ${bar(planCr, total, P.rsv * SEMS)}
      <p class="small">계획한 과목 ${planCr}학점 + 학기마다 남긴 교양·일반선택 ${P.rsv}학점 × 8 = 약 <b>${est}</b>학점${est < total ? `. ${total - est}학점이 더 필요합니다` : ""}. ${esc(col.libNote)} <span class="rm-cite">${esc(col.libSrc)}</span></p></div>`;
    html += Ts.map((T, i) => reqBox(T, i, placed)).join("");
    $("#p-req").innerHTML = html;

    /* 겹치는 과목 */
    const multi = placed.filter((k) => tagsOf(k).length > 1);
    let ov = "";
    if (Ts.length > 1) {
      const rules = [...new Set(Ts.map((T) => T.m.college))].map((c) => REQ.colleges[c].overlap);
      const lim = Ts.filter((T) => T.m.overlapMax).map((T) => ({ T, max: T.m.overlapMax, got: multi.filter((k) => catOf(T, k)).reduce((s, k) => s + PLAN.ctx.items.get(k).cr, 0) }));
      ov = `<h2 class="rm-h2">여러 전공에 겹치는 과목</h2>
        ${multi.length ? `<table class="rm-tbl"><thead><tr><th>과목</th><th>학점</th>${Ts.map((T) => `<th>${esc(T.m.name)}</th>`).join("")}</tr></thead><tbody>
        ${multi.map((k) => `<tr><td>${esc(nm(k))}</td><td>${PLAN.ctx.items.get(k).cr}</td>${Ts.map((T) => { const c = catOf(T, k, placedPicks(T)); return `<td>${c ? CAT[c] : ""}</td>`; }).join("")}</tr>`).join("")}</tbody></table>`
        : '<p class="small dim">지금 계획에는 두 전공 이상에 함께 인정되는 과목이 없습니다.</p>'}
        ${lim.filter((x) => x.got > x.max).map((x) => `<p class="rm-alert">${esc(x.T.m.name)}: 다른 전공과 겹쳐 인정되는 학점이 ${x.got}학점입니다. 요람은 ${x.max}학점까지만 인정하므로 ${x.got - x.max}학점을 다른 과목으로 더 들어야 합니다.</p>`).join("")}
        <ul class="rm-notes">${rules.map((r) => `<li${r.check ? ' class="is-check"' : ""}>${esc(r.t)} <span class="rm-cite">${esc(r.src)}</span></li>`).join("")}</ul>`;
    }
    $("#p-overlap").innerHTML = ov;

    /* 8학기 계획표 */
    const lost = unplaced.reduce((s, k) => s + PLAN.ctx.items.get(k).cr, 0);
    $("#p-board").innerHTML = (unplaced.length ? `<p class="rm-alert rm-lost">${unplaced.length}과목(${lost}학점)을 8학기 안에 넣지 못했습니다. 학기당 학점 상한을 올리거나, 남길 교양 학점을 줄이거나, 전공 수를 줄여 보세요. 아래 '넣지 못한 과목'에서 직접 학기를 골라 넣을 수도 있습니다.</p>` : "") + Array.from({ length: SEMS }, (_, s) => {
      const ids = placed.filter((k) => at.get(k) === s).sort((a, b) => (PLAN.prio.get(a) - PLAN.prio.get(b)) || codeNum(a) - codeNum(b));
      const over = used[s] > budget;
      return `<section class="rm-sem${over ? " is-over" : ""}" data-s="${s}" style="--col:${Math.floor(s / 2) + 1};--row:${s % 2 + 1 + (unplaced.length ? 1 : 0)}" aria-label="${semName(s)}">
        <h3>${semName(s)} <span class="mono">${used[s]}<small>/${budget}</small></span></h3>
        <div class="rm-drop">${ids.map((k) => card(k, "board")).join("") || '<p class="rm-hint">여기로 끌어 놓기</p>'}</div>
        ${over ? `<p class="rm-alert small">학기 상한 ${P.cap}학점 − 교양 ${P.rsv}학점을 넘었습니다</p>` : ""}</section>`;
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

    /* 출처 */
    $("#p-src").innerHTML = `<h2 class="rm-h2">출처</h2><ul class="rm-notes">
      ${Object.entries(REQ.sources).map(([k, s]) => `<li><span class="mono">${k}</span> <a href="${esc(s.url)}" rel="noopener">${esc(s.title)}</a></li>`).join("")}
      ${REQ.general.map((g) => `<li>${esc(g.t)} <span class="rm-cite">${esc(g.src)}</span></li>`).join("")}
      <li>개설 학기는 ${OFFER_FROM}년 이후 연세대 수강편람 개설 이력으로 판단했습니다(1·2학기만, 계절학기 제외). 확인일 ${esc(REQ.checked)}.</li></ul>`;
    save();
  }

  function bar(v, max, extra) {
    const pct = (x) => Math.max(0, Math.min(100, (x / Math.max(1, max)) * 100));
    return `<div class="rm-bar" role="img" aria-label="${v}/${max}학점"><span class="f" style="width:${pct(v)}%"></span>${extra ? `<span class="x" style="left:${pct(v)}%;width:${pct(Math.min(extra, max - v))}%"></span>` : ""}</div>`;
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
      ${sum < sp.major ? `<p class="small">${sp.major - sum}학점이 모자랍니다. QURI는 1~3학년 과목만 다루므로 4학년 전공과목으로 채우세요.</p>` : ""}
      ${missing.length ? `<p class="small rm-alert">아직 계획에 없는 필수 과목: ${missing.map((k) => esc(nm(k))).join(", ")}</p>` : ""}
      ${picks ? `<ul class="rm-notes">${picks}</ul>` : ""}
      <details><summary>요건 메모와 출처</summary><ul class="rm-notes">
        <li${sp.check ? ' class="is-check"' : ""}>${esc(sp.src)}</li>
        ${(T.m.notes || []).map((n) => `<li${n.check ? ' class="is-check"' : ""}>${esc(n.t)} <span class="rm-cite">${esc(n.src)}</span></li>`).join("")}</ul></details></div>`;
  }

  /* ---------- 옮기기 (끌기와 누르기) ---------- */
  function moveTo(id, s) {
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
      <div class="rm-menu-g">${Array.from({ length: SEMS }, (_, s) => `<button type="button" class="rm-btn sm" data-to="${s}"${s === cur ? ' aria-current="true"' : ""}>${semShort(s)}${it.terms.has(s % 2 + 1) ? "" : " ·미개설"}</button>`).join("")}</div>
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
  $("#p-cap").addEventListener("change", (e) => { P.cap = Math.max(9, Math.min(24, +e.target.value || 18)); renderPlan(); });
  $("#p-rsv").addEventListener("change", (e) => { P.rsv = Math.max(0, Math.min(12, +e.target.value || 0)); renderPlan(); });
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
  function save() { store.set({ v: 1, guide: { school: G.school, dept: G.dept, common: G.common }, plan: P, tab: TAB }); }
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
  $("#g-dept").addEventListener("change", (e) => { G.dept = e.target.value; G.sel = null; renderGuide(); save(); });
  $("#g-common").addEventListener("change", (e) => { G.common = e.target.checked; renderGuide(); save(); });
  $("#guide").addEventListener("click", (e) => {
    const b = e.target.closest("[data-code]"); if (!b) return;
    G.sel = G.sel === b.dataset.code && b.classList.contains("rm-chip") ? null : b.dataset.code;
    renderDetail();
    if (G.sel && innerWidth < 900) $("#g-detail").scrollIntoView({ block: "nearest", behavior: "smooth" });
  });

  /* ---------- 시작 ---------- */
  Promise.all([
    fetch("curricula/univ-requirements.json").then((r) => r.json()),
    fetch("curricula/univ-offered.json").then((r) => r.json()).catch(() => ({ codes: {} })),
  ]).then(([req, off]) => {
    REQ = req; OFFER = off.codes || {};
    REQ.majors.forEach((m) => MAJOR.set(m.id, m));
    const saved = store.get();
    if (saved && saved.v === 1) {
      Object.assign(G, saved.guide || {});
      if (saved.plan) Object.assign(P, saved.plan);
      P.majors = (P.majors || []).filter((x) => MAJOR.has(x.id)).slice(0, 5);
      if (!P.majors.length) P.majors = [{ id: "math", track: "single" }];
      TAB = saved.tab === "plan" ? "plan" : "guide";
    }
    const q = new URLSearchParams(location.search);
    if (q.get("dept") && DEPT.has(q.get("dept"))) G.dept = q.get("dept");
    if (q.get("school")) G.school = normSchool(q.get("school"));
    if (q.get("tab") === "plan" || q.get("tab") === "guide") TAB = q.get("tab");
    if (!DEPT.has(G.dept)) G.dept = "math";
    setTab(TAB);
  }).catch((err) => {
    console.error(err);
    $("#tab-plan").disabled = true;
    $("#guide").insertAdjacentHTML("afterbegin", '<p class="rm-alert">졸업 요건 자료(curricula/univ-requirements.json)를 읽지 못해 졸업 로드맵을 열 수 없습니다. 이 폴더를 웹 서버(python -m http.server)로 열었는지 확인하세요.</p>');
    TAB = "guide"; renderGuide();
  });
})();
