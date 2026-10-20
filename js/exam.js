/* 시험 연습(문제은행): 과목의 bank.js(window.QBANK, tools/build.py가 만든다)에서 범위를 골라 한 세트를 뽑아 푼다.
   흐름: 범위·문항 수·시간 고르기 → 문제마다 힌트 1·2 → 풀이 → 맞힘/틀림 스스로 표시 → 점수와 대단원별 정답률.
   출처 x(시험 전용, exams/*.json)가 있으면 기본으로 그것만 쓰고, 복습 문항(R·ex·tb)은 '복습 문항 포함'을 고를 때 섞는다.
   객관식(q.ch, q.ans)은 보기를 고르고 '정답 확인'을 누르면 바로 채점한다.
   틀린 문제는 학습 기록(js/progress.js, "quri-progress"의 wrong)에 남겨 '틀린 문제만 다시 풀기'에 쓴다.
   풀던 세트는 sessionStorage에 두어 새로 고침해도 이어서 푼다. */
(() => {
  "use strict";
  const root = document.getElementById("exam");
  const conf = JSON.parse(document.getElementById("exam-conf")?.textContent || "null");
  if (!root || !conf) return;
  const BANK = window.QBANK || [];
  const byId = new Map(BANK.map((q) => [q.id, q]));
  const UNITS = conf.units;
  const uname = (n) => UNITS.find((u) => u.n === n)?.t || n;
  const half = Math.ceil(UNITS.length / 2);
  const SKEY = "quri-exam-run:" + conf.course;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const P = () => window.QProgress;
  const math = (el) => { try { window.NMMath?.render(el); window.NMMath?.fit(); } catch (e) { console.error(e); } };

  /* 시험 방식(conf.exam, 수강편람 강의계획서 기준): "fin"이면 전 범위 기말만, "mid"이면 전 범위 중간만 둔다.
     시험이 없는 과목은 이 페이지가 만들어지지 않는다 */
  const SCOPES = conf.exam === "fin" || conf.exam === "mid" ? {
    [conf.exam]: { t: conf.exam === "mid" ? "중간고사" : "기말고사", d: `전 범위 · 대단원 1–${UNITS.length}`, u: UNITS.map((u) => u.n) },
  } : {
    mid: { t: "중간고사", d: `대단원 1–${half}`, u: UNITS.slice(0, half).map((u) => u.n) },
    fin: { t: "기말고사", d: half < UNITS.length ? `대단원 ${half + 1}–${UNITS.length}` : "전 범위", u: (half < UNITS.length ? UNITS.slice(half) : UNITS).map((u) => u.n) },
    all: { t: "기말고사 · 전 범위", d: `대단원 1–${UNITS.length}`, u: UNITS.map((u) => u.n) },
  };
  const HASX = !!conf.cnt.x;
  const REVIEW = Object.keys(conf.src).filter((k) => k !== "x" && conf.cnt[k]);
  const nReview = REVIEW.reduce((a, k) => a + conf.cnt[k], 0);
  const first = Object.keys(SCOPES)[0];
  const opt = { scope: first, units: new Set(SCOPES[first].u), n: 12, time: 0, hard: false,
    src: new Set(HASX ? ["x"] : Object.keys(conf.src).filter((k) => conf.cnt[k])) };
  const NO = "①②③④⑤⑥";
  let run = null, timer = 0;

  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const okq = (q) => opt.src.has(q.src) && (!opt.hard || q.lv === "응용" || q.lv === "심화");
  const pool = () => BANK.filter((q) => opt.units.has(q.u) && okq(q));
  const uorder = (n) => UNITS.findIndex((u) => u.n === n);

  /* 난이도 층: 표시가 없는 복습 문항은 기본으로 센다. 세트마다 층 비율을 맞춰 평균 난이도가 크게 흔들리지 않게 한다
     (tools/check_exams.py의 MIX와 같은 값) */
  const LV = ["기본", "응용", "심화"];
  const tier = (q) => Math.max(0, LV.indexOf(q.lv));
  const MIX = opt0 => (opt0 ? [0, 0.64, 0.36] : [0.30, 0.45, 0.25]);
  function quotas(n, mix, have) {                // 가장 큰 나머지 방식으로 나눈 뒤, 모자란 층은 이웃 층에서 채운다
    const raw = mix.map((m) => m * n), q = raw.map(Math.floor);
    let left = n - q.reduce((a, b) => a + b, 0);
    raw.map((r, i) => [r - q[i], i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left > 0 && mix[i] > 0) { q[i]++; left--; } });
    const near = [[1, 2], [2, 0], [1, 0]];
    for (let i = 0; i < 3; i++) {
      let short = q[i] - have[i];
      if (short <= 0) continue;
      q[i] = have[i];
      for (const j of near[i]) { const t = Math.min(have[j] - q[j], short); if (t > 0) { q[j] += t; short -= t; } }
    }
    return q;
  }
  /* 한 층 안에서는 대단원마다 고르게: 대단원 순서를 섞어 한 문제씩 돌아가며 뽑는다 */
  function spread(list, k) {
    const by = new Map();
    shuffle(list.slice()).forEach((q) => { if (!by.has(q.u)) by.set(q.u, []); by.get(q.u).push(q); });
    const keys = shuffle([...by.keys()]), out = [];
    while (out.length < k && keys.some((u) => by.get(u).length)) keys.forEach((u) => { if (out.length < k && by.get(u).length) out.push(by.get(u).pop()); });
    return out;
  }
  function draw(list, n) {
    const by = LV.map((_, i) => list.filter((q) => tier(q) === i));
    const want = quotas(Math.min(n, list.length), MIX(opt.hard), by.map((l) => l.length));
    const out = by.flatMap((l, i) => spread(l, want[i]));
    const pos = new Map(BANK.map((q, i) => [q.id, i]));
    return out.sort((a, b) => uorder(a.u) - uorder(b.u) || pos.get(a.id) - pos.get(b.id));
  }
  const mixOf = (ids) => { const c = [0, 0, 0]; ids.forEach((id) => c[tier(byId.get(id))]++); return LV.map((l, i) => c[i] ? `${l} ${c[i]}` : "").filter(Boolean).join(" · "); };

  const save = () => { try { if (run) sessionStorage.setItem(SKEY, JSON.stringify(run)); else sessionStorage.removeItem(SKEY); } catch (e) { /* 사생활 보호 창 등 */ } };
  const restore = () => { try { const r = JSON.parse(sessionStorage.getItem(SKEY) || "null"); return r && r.ids?.every((id) => byId.has(id)) ? r : null; } catch (e) { return null; } };

  function start(ids, label, retry) {
    run = { ids, label, retry: !!retry, i: 0, st: ids.map(() => ({ h: 0, a: false, m: "", c: 0 })), t0: Date.now(), lim: retry ? 0 : opt.time * 60, done: false };
    save(); drawRun();
  }

  /* ───── 1) 고르기 ───── */
  function drawSetup() {
    clearInterval(timer);
    const wrong = (P()?.wrong(conf.course) || []).filter((id) => byId.has(id));
    const last = P()?.exams(conf.course)[0];
    const cnt = (u) => BANK.filter((q) => q.u === u && okq(q)).length;
    const avail = pool().length;
    root.innerHTML = `
      <div class="ex-setup">
        <section class="ex-box">
          <h2><span class="ex-step mono">1</span>범위</h2>
          <div class="ex-scopes" role="radiogroup" aria-label="시험 범위">
            ${Object.entries(SCOPES).map(([k, s]) => `<button type="button" class="ex-scope" role="radio" aria-checked="${opt.scope === k}" data-scope="${k}"><b>${s.t}</b><span class="mono">${s.d}</span></button>`).join("")}
            <button type="button" class="ex-scope" role="radio" aria-checked="${opt.scope === "pick"}" data-scope="pick"><b>직접 고르기</b><span class="mono">아래에서 대단원 선택</span></button>
          </div>
          <ol class="ex-units">
            ${UNITS.map((u) => { const k = cnt(u.n); return `<li><label class="${k ? "" : "off"}"><input type="checkbox" data-unit="${u.n}" ${opt.units.has(u.n) && k ? "checked" : ""} ${k ? "" : "disabled"}><span class="mono n">${+u.n}</span><span class="t">${esc(u.t)}</span><span class="mono k">${k ? k + "문제" : "준비 중"}</span></label></li>`; }).join("")}
          </ol>
        </section>
        <section class="ex-box">
          <h2><span class="ex-step mono">2</span>문항 수와 시간</h2>
          <div class="ex-row"><span class="lb">문항 수</span>${[8, 12, 16].map((n) => `<button type="button" class="chip" data-n="${n}" aria-pressed="${opt.n === n}">${n}문제</button>`).join("")}</div>
          <div class="ex-row"><span class="lb">시간 제한</span>${[[0, "없음"], [30, "30분"], [50, "50분"], [75, "75분"]].map(([t, l]) => `<button type="button" class="chip" data-time="${t}" aria-pressed="${opt.time === t}">${l}</button>`).join("")}</div>
          ${HASX ? `<div class="ex-row"><span class="lb">난이도</span><button type="button" class="chip" data-hard="0" aria-pressed="${!opt.hard}">기본·응용·심화 섞어서</button><button type="button" class="chip" data-hard="1" aria-pressed="${opt.hard}">응용·심화만</button></div>
          <div class="ex-row"><span class="lb">문제 출처</span><span class="ex-src"><b>시험 전용</b> <span class="mono dim">${conf.cnt.x}</span></span>${nReview ? `<label class="ex-src"><input type="checkbox" data-review ${REVIEW.some((k) => opt.src.has(k)) ? "checked" : ""}>복습 문항 포함 <span class="mono dim">${nReview}</span></label><span class="small dim ex-src-note">복습 문항은 단원 마무리 연습·예제·본문 연습문제로, 공부하며 이미 본 문제입니다.</span>` : ""}</div>`
          : `<div class="ex-row"><span class="lb">문제 출처</span>${Object.entries(conf.src).filter(([k]) => k !== "x").map(([k, l]) => `<label class="ex-src ${conf.cnt[k] ? "" : "off"}"><input type="checkbox" data-src="${k}" ${opt.src.has(k) ? "checked" : ""} ${conf.cnt[k] ? "" : "disabled"}>${l} <span class="mono dim">${conf.cnt[k]}</span></label>`).join("")}</div>`}
        </section>
        <div class="ex-go">
          <button type="button" class="btn ex-start" ${avail ? "" : "disabled"}>시험 시작 · ${Math.min(opt.n, avail)}문제</button>
          <span class="small dim">${avail ? `범위 안의 문제 ${avail}개에서 ${opt.hard ? "응용 64% · 심화 36%" : "기본 30% · 응용 45% · 심화 25%"} 비율로, 대단원별로 고르게 뽑습니다.${avail < opt.n ? " 범위의 문제가 모자라 모두 냅니다." : ""}` : "고른 범위에 문제가 없습니다. 대단원이나 출처를 더 고르세요."}</span>
        </div>
        <section class="ex-box ex-retry">
          <h2><span class="ex-step mono">↺</span>틀린 문제 다시 풀기</h2>
          ${wrong.length ? `<p>이 과목에서 틀린 문제가 <b>${wrong.length}개</b> 남아 있습니다. 다시 풀어 맞히면 기록에서 지워집니다.</p>
          <button type="button" class="btn ghost ex-wrong">틀린 문제만 다시 풀기 · ${Math.min(wrong.length, 16)}문제</button>` : `<p class="dim">틀린 문제가 없습니다. 시험을 풀고 '틀림'으로 표시한 문제가 여기에 모입니다.</p>`}
          ${last ? `<p class="small dim">지난 결과: ${esc(last.scope)} · ${last.ok}/${last.n} (${new Date(last.ts).toLocaleDateString("ko-KR")})</p>` : ""}
        </section>
      </div>`;
  }

  root.addEventListener("click", (e) => {
    const t = e.target.closest("button, [data-act]");
    if (!t) return;
    /* 고르기 */
    if (t.dataset.scope) {
      opt.scope = t.dataset.scope;
      if (SCOPES[opt.scope]) opt.units = new Set(SCOPES[opt.scope].u);
      drawSetup(); return;
    }
    if (t.dataset.n) { opt.n = +t.dataset.n; drawSetup(); return; }
    if (t.dataset.time) { opt.time = +t.dataset.time; drawSetup(); return; }
    if (t.dataset.hard) { opt.hard = t.dataset.hard === "1"; drawSetup(); return; }
    if (t.classList.contains("ex-start")) {
      const set = draw(pool(), opt.n);
      const label = opt.scope === "pick" ? `직접 고른 범위(대단원 ${[...opt.units].map(Number).sort((a, b) => a - b).join("·")})` : SCOPES[opt.scope].t;
      start(set.map((q) => q.id), label); return;
    }
    if (t.classList.contains("ex-wrong")) {
      const ids = shuffle(P().wrong(conf.course).filter((id) => byId.has(id))).slice(0, 16);
      const pos = new Map(BANK.map((q, i) => [q.id, i]));
      start(ids.sort((a, b) => pos.get(a) - pos.get(b)), "틀린 문제 다시 풀기", true); return;
    }
    if (!run) return;
    /* 풀기 */
    const s = run.st[run.i];
    const act = t.dataset.act;
    const cq = byId.get(run.ids[run.i]);
    if (act === "hint") { s.h = Math.max(s.h, +t.dataset.k); }
    else if (act === "pick") { if (!s.a) s.c = +t.dataset.c; }
    else if (act === "sol") { if (cq.ch && !s.c) return; s.a = true; if (cq.ch) s.m = s.c === cq.ans ? "ok" : "no"; }
    else if (act === "mark") { if (cq.ch) return; s.m = s.m === t.dataset.m ? "" : t.dataset.m; if (s.m) s.a = true; if (s.m && run.i < run.ids.length - 1 && !run.st[run.i + 1].m) { save(); drawRun(); setTimeout(() => go(run.i + 1), 260); return; } }
    else if (act === "go") { go(+t.dataset.i); return; }
    else if (act === "prev") { go(run.i - 1); return; }
    else if (act === "next") { go(run.i + 1); return; }
    else if (act === "finish") { finish(); return; }
    else if (act === "quit") { run = null; save(); drawSetup(); root.scrollIntoView({ block: "start" }); return; }
    else if (act === "print") { printSet(); return; }
    else if (act === "again") { run = null; save(); drawSetup(); root.scrollIntoView({ block: "start" }); return; }
    else if (act === "redo") { const ids = run.ids.filter((_, k) => run.st[k].m !== "ok"); start(ids, "이번 세트에서 틀린 문제", true); return; }
    else return;
    save(); drawRun();
  });
  root.addEventListener("change", (e) => {
    const t = e.target;
    if (t.dataset.unit) { t.checked ? opt.units.add(t.dataset.unit) : opt.units.delete(t.dataset.unit); opt.scope = Object.keys(SCOPES).find((k) => SCOPES[k].u.length === opt.units.size && SCOPES[k].u.every((u) => opt.units.has(u))) || "pick"; drawSetup(); }
    if (t.dataset.src) { t.checked ? opt.src.add(t.dataset.src) : opt.src.delete(t.dataset.src); drawSetup(); }
    if ("review" in t.dataset) { REVIEW.forEach((k) => (t.checked ? opt.src.add(k) : opt.src.delete(k))); drawSetup(); }
  });
  function go(i) { if (i < 0 || i >= run.ids.length) return; run.i = i; save(); drawRun(); root.querySelector(".ex-q")?.scrollIntoView({ block: "nearest" }); }

  /* ───── 2) 풀기 ───── */
  const left = () => (run.lim ? Math.max(0, run.lim - Math.floor((Date.now() - run.t0) / 1000)) : null);
  const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  function tick() {
    const el = root.querySelector(".ex-timer"); if (!el || !run) return;
    if (run.lim) {
      const l = left();
      el.textContent = l ? `남은 시간 ${mmss(l)}` : "시간 종료 · 풀이를 보며 채점하세요";
      el.classList.toggle("low", l < 300); el.classList.toggle("over", !l);
    } else el.textContent = `지난 시간 ${mmss(Math.floor((Date.now() - run.t0) / 1000))}`;
  }
  const meta = (q) => [conf.src[q.src], q.ty, q.lv].filter(Boolean).map((x, k) => `<span class="${k ? "ex-tag" : "ex-src-t"} mono">${esc(x)}</span>`).join("");

  function drawRun() {
    const q = byId.get(run.ids[run.i]), s = run.st[run.i], N = run.ids.length;
    const marked = run.st.filter((x) => x.m).length;
    root.innerHTML = `
      <div class="ex-run">
        <div class="ex-bar">
          <span class="ex-label"><b>${esc(run.label)}</b><span class="mono dim">${marked}/${N} 채점</span><span class="mono dim ex-mix">${mixOf(run.ids)}</span></span>
          <span class="ex-timer mono"></span>
          <button type="button" class="chip" data-act="print">인쇄용 보기</button>
        </div>
        <ol class="ex-dots" aria-label="문제 번호">${run.ids.map((_, k) => `<li><button type="button" data-act="go" data-i="${k}" class="${run.st[k].m}${k === run.i ? " on" : ""}" aria-current="${k === run.i}" aria-label="문제 ${k + 1}${run.st[k].m === "ok" ? " 맞힘" : run.st[k].m === "no" ? " 틀림" : ""}">${k + 1}</button></li>`).join("")}</ol>
        <article class="ex-q q-card">
          <header class="ex-qh"><span class="ex-num mono">문제 ${run.i + 1}<span class="dim"> / ${N}</span></span><span class="ex-where mono">${+q.u}. ${esc(uname(q.u))}${q.s ? ` · ${esc(q.s)}절` : ""}</span>${meta(q)}</header>
          <div class="q-body ex-body">
            <div class="ex-prob">${q.q}</div>
            ${q.ch ? `<ol class="ex-ch">${q.ch.map((c, k) => `<li><button type="button" data-act="pick" data-c="${k + 1}" aria-pressed="${s.c === k + 1}" class="${s.a ? (k + 1 === q.ans ? "right" : s.c === k + 1 ? "wrong" : "") : ""}" ${s.a ? "disabled" : ""}><span class="mono">${NO[k]}</span><span>${c}</span></button></li>`).join("")}</ol>` : ""}
            ${q.h.map((h, k) => s.h > k ? `<div class="ex-hint"><p class="ex-lb mono">힌트 ${k + 1}</p>${h}</div>` : "").join("")}
            ${s.a ? `<div class="ex-sol"><p class="ex-lb mono">풀이</p>${q.ch ? `<p class="ex-ans"><b>정답</b> ${NO[q.ans - 1]}${s.c === q.ans ? " · 맞혔습니다" : ` · 고른 답 ${NO[s.c - 1]}`}</p>` : ""}${q.a}${q.rb ? `<div class="ex-rubric"><p class="ex-lb mono">채점 기준 (스스로 체크)</p>${q.rb.map((r) => `<label><input type="checkbox"> <span class="mono">${r.pt}점</span> ${r.t}</label>`).join("")}</div>` : ""}<p class="ex-from small"><a href="${esc(q.href)}">${q.src === "x" ? "관련 단원 다시 보기" : "출처 카드"} · ${esc(q.ct)} →</a></p></div>` : ""}
            <div class="ex-acts">
              ${q.h.map((_, k) => s.h <= k && !s.a ? `<button type="button" class="chip" data-act="hint" data-k="${k + 1}" ${s.h < k ? "disabled" : ""}>힌트 ${k + 1}</button>` : "").join("")}
              ${s.a ? "" : q.ch ? `<button type="button" class="chip go" data-act="sol" ${s.c ? "" : "disabled"}>정답 확인</button>` : `<button type="button" class="chip go" data-act="sol">풀이 보기</button>`}
            </div>
            ${q.ch ? (s.a ? `<div class="ex-mark"><span class="small">객관식은 자동으로 채점했습니다.</span>${run.i < N - 1 ? `<button type="button" class="chip" data-act="next">다음 문제 →</button>` : ""}</div>` : `<div class="ex-mark wait"><span class="small">보기를 하나 고른 뒤 '정답 확인'을 누르세요.</span></div>`) : `<div class="ex-mark ${s.a ? "" : "wait"}">
              <span class="small">${s.a ? "풀이와 비교해 스스로 채점하세요." : "풀이를 본 뒤 채점합니다. 먼저 끝까지 풀어 보세요."}</span>
              <button type="button" class="ex-ok" data-act="mark" data-m="ok" aria-pressed="${s.m === "ok"}" ${s.a ? "" : "disabled"}>맞힘</button>
              <button type="button" class="ex-no" data-act="mark" data-m="no" aria-pressed="${s.m === "no"}" ${s.a ? "" : "disabled"}>틀림</button>
            </div>`}
          </div>
        </article>
        <nav class="ex-nav">
          <button type="button" class="chip" data-act="prev" ${run.i ? "" : "disabled"}>← 이전</button>
          <button type="button" class="chip" data-act="next" ${run.i < N - 1 ? "" : "disabled"}>다음 →</button>
          <span class="sp"></span>
          <button type="button" class="link small" data-act="quit">그만두고 범위 다시 고르기</button>
          <button type="button" class="btn" data-act="finish">채점 마치기</button>
        </nav>
        ${marked < N ? `<p class="small dim ex-note">표시하지 않은 ${N - marked}문제는 틀린 것으로 셉니다.</p>` : ""}
      </div>`;
    math(root);
    tick(); clearInterval(timer); timer = setInterval(tick, 1000);
  }

  /* ───── 3) 결과 ───── */
  function finish() {
    clearInterval(timer);
    const p = P();
    const N = run.ids.length, ok = run.st.filter((x) => x.m === "ok").length;
    if (!run.done) {
      run.ids.forEach((id, k) => p?.setWrong(id, conf.course, run.st[k].m !== "ok"));
      p?.logExam({ c: conf.course, n: N, ok, scope: run.label });
      run.done = true; run.sec = Math.floor((Date.now() - run.t0) / 1000);
      save();
    }
    const by = new Map();
    run.ids.forEach((id, k) => { const u = byId.get(id).u; if (!by.has(u)) by.set(u, [0, 0]); by.get(u)[1]++; if (run.st[k].m === "ok") by.get(u)[0]++; });
    const rows = [...by.entries()].sort((a, b) => uorder(a[0]) - uorder(b[0]));
    const pct = N ? Math.round((100 * ok) / N) : 0;
    root.innerHTML = `
      <div class="ex-result">
        <section class="ex-score">
          <p class="mono dim">${esc(run.label)} · ${mixOf(run.ids)} · ${Math.floor(run.sec / 60)}분 ${run.sec % 60}초</p>
          <p class="ex-big"><b>${ok}</b><span>/ ${N}</span><span class="mono">${pct}%</span></p>
          <span class="ex-meter" aria-hidden="true"><i style="--p:${N ? ok / N : 0}"></i></span>
          <p class="small dim">틀린 ${N - ok}문제는 학습 기록에 남았습니다. 맞힌 문제는 기록에서 지웠습니다.</p>
        </section>
        <section class="ex-box">
          <h2>대단원별 정답률</h2>
          <ol class="ex-byunit">${rows.map(([u, [a, n]]) => `<li><span class="mono n">${+u}</span><a class="t" href="${u}.html">${esc(uname(u))}</a><span class="ex-meter" aria-hidden="true"><i style="--p:${a / n}"></i></span><span class="mono k">${a}/${n}</span></li>`).join("")}</ol>
        </section>
        <section class="ex-box">
          <h2>문제별</h2>
          <ol class="ex-review">${run.ids.map((id, k) => { const q = byId.get(id), m = run.st[k].m; return `<li class="${m || "none"}"><span class="mono n">${k + 1}</span><span class="r mono">${m === "ok" ? "맞힘" : m === "no" ? "틀림" : "미채점"}</span><span class="t">${esc(q.ct)}<span class="mono dim">${q.s ? ` · ${esc(q.s)}절` : ""}${q.lv ? ` · ${esc(q.lv)}` : ""}${run.st[k].h ? ` · 힌트 ${run.st[k].h}` : ""}</span></span><a class="small" href="${esc(q.href)}">${q.src === "x" ? "단원 보기" : "카드 보기"}</a></li>`; }).join("")}</ol>
        </section>
        <div class="ex-go">
          ${ok < N ? `<button type="button" class="btn" data-act="redo">틀린 문제만 다시 풀기 · ${N - ok}문제</button>` : ""}
          <button type="button" class="btn ghost" data-act="again">새 세트 뽑기</button>
          <button type="button" class="chip" data-act="print">인쇄용 보기</button>
        </div>
      </div>`;
    root.scrollIntoView({ block: "start" });
  }

  /* ───── 인쇄: 문제만 앞에, 힌트·풀이는 뒤에 ───── */
  function printSet() {
    let box = document.getElementById("ex-print");
    if (!box) { box = document.createElement("div"); box.id = "ex-print"; document.body.appendChild(box); }
    const qs = run.ids.map((id) => byId.get(id));
    box.innerHTML = `
      <header><h1>${esc(conf.name)} · ${esc(run.label)}</h1><p>${qs.length}문제 (${mixOf(run.ids)})${run.lim ? ` · ${run.lim / 60}분` : ""} · QURI 시험 연습</p></header>
      <ol class="pr-qs">${qs.map((q, k) => `<li><p class="pr-n">문제 ${k + 1} <span>${+q.u}. ${esc(uname(q.u))}${q.ty ? " · " + esc(q.ty) : ""}</span></p>${q.q}${q.ch ? `<ol class="pr-ch">${q.ch.map((c, j) => `<li>${NO[j]} ${c}</li>`).join("")}</ol>` : `<div class="pr-space"></div>`}</li>`).join("")}</ol>
      <section class="pr-sols"><h2>힌트와 풀이</h2>
      <ol>${qs.map((q, k) => `<li><p class="pr-n">문제 ${k + 1}</p>${q.h.map((h, j) => `<div class="pr-h"><b>힌트 ${j + 1}</b>${h}</div>`).join("")}<div class="pr-a"><b>풀이</b>${q.ch ? `<p>정답 ${NO[q.ans - 1]}</p>` : ""}${q.a}</div></li>`).join("")}</ol></section>`;
    math(box);
    document.body.classList.add("ex-printing");
    const off = () => { document.body.classList.remove("ex-printing"); window.removeEventListener("afterprint", off); };
    window.addEventListener("afterprint", off);
    window.print();
  }

  /* progress.js·math.js가 이 스크립트 뒤에 실리므로 문서를 다 읽은 뒤 시작한다 */
  const init = () => { run = restore(); if (run && run.done) finish(); else if (run) drawRun(); else drawSetup(); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
