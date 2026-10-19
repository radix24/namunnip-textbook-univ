/* 학습 기록 (localStorage "quri-progress", 이 브라우저에만 저장. 서버·계정 없음)
   - std:    성취기준 코드 → 표시한 시각   ("할 수 있다" 점검)
   - seen:   카드 id → 표시한 시각        ("이 카드를 끝까지 공부했어요")
   - visits: 최근에 연 절 페이지 30개      (메인 화면의 "이어서 공부하기", 기록 페이지)
   페이지마다 있는 요소를 찾아 기록을 그리고 바꾼다. 다른 탭에서 바꾸면(storage 이벤트) 다시 그린다. */
window.QProgress = (() => {
  "use strict";
  const KEY = "quri-progress";
  const ROOT = new URL("../", document.currentScript.src);   // 사이트 맨 위
  const empty = () => ({ v: 2, std: {}, seen: {}, visits: [] });
  let data = empty();
  const load = () => {
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { raw = null; }
    if (!raw || typeof raw !== "object") { data = empty(); return; }
    if (raw.v !== 2) {   // 1판: { "공통1-02-01": 1, … }
      data = empty();
      Object.keys(raw).forEach((k) => { if (raw[k]) data.std[k] = Date.now(); });
      save();
      return;
    }
    data = { ...empty(), ...raw };
  };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { console.warn("학습 기록을 저장하지 못함", e); } };
  load();

  const api = {
    done: (code) => !!data.std[code],
    setDone(code, v) { if (v) data.std[code] = Date.now(); else delete data.std[code]; save(); paint(); },
    seen: (id) => !!data.seen[id],
    setSeen(id, v) { if (v) data.seen[id] = Date.now(); else delete data.seen[id]; save(); paint(); },
    visits: () => data.visits.slice(),
    last: () => data.visits[0] || null,
    root: ROOT,
    export: () => JSON.stringify({ ...data, exported: new Date().toISOString(), app: "QURI" }, null, 1),
    import(text) {
      const o = JSON.parse(text);
      if (!o || o.v !== 2 || typeof o.std !== "object" || typeof o.seen !== "object") throw new Error("QURI 학습 기록 파일이 아닙니다");
      data.std = { ...data.std, ...o.std };
      data.seen = { ...data.seen, ...o.seen };
      const all = [...(o.visits || []), ...data.visits].sort((a, b) => b.ts - a.ts);
      const seenHref = new Set();
      data.visits = all.filter((x) => (seenHref.has(x.href) ? false : seenHref.add(x.href))).slice(0, 30);
      save(); paint();
    },
    reset() { data = empty(); save(); paint(); },
    stats: () => ({ std: Object.keys(data.std).length, seen: Object.keys(data.seen).length }),
    onChange: (f) => listeners.push(f),
  };
  const listeners = [];

  /* 절 페이지를 열면 방문 기록 */
  const rec = document.body.dataset.rec;
  if (rec) {
    try {
      const r = JSON.parse(rec);
      const href = location.pathname.slice(new URL(ROOT).pathname.length);
      data.visits = [{ href, ts: Date.now(), ...r }, ...data.visits.filter((v) => v.href !== href)].slice(0, 30);
      save();
    } catch (e) { console.warn("방문 기록 실패", e); }
  }

  /* 카드 아래 "끝까지 공부했어요" 단추 */
  document.addEventListener("click", (e) => {
    const b = e.target.closest(".q-seen-btn"); if (!b) return;
    api.setSeen(b.dataset.card, !api.seen(b.dataset.card));
  });
  /* 성취기준 점검 칸 */
  document.addEventListener("change", (e) => {
    const b = e.target.closest("input[data-std]"); if (!b) return;
    api.setDone(b.dataset.std, b.checked);
  });

  const ids = (el) => (el.dataset.cards || "").split(" ").filter(Boolean);
  function paint() {
    document.querySelectorAll("input[data-std]").forEach((b) => { b.checked = api.done(b.dataset.std); b.closest("li")?.classList.toggle("done", b.checked); });
    document.querySelectorAll(".q-checklist").forEach((box) => {
      const all = box.querySelectorAll("li:not(.uni-off) input[data-std]"), k = [...all].filter((b) => b.checked).length;
      const out = box.querySelector(".q-count"); if (out) out.textContent = `${k}/${all.length} 할 수 있음`;
    });
    document.querySelectorAll(".q-seen-btn").forEach((b) => {
      const on = api.seen(b.dataset.card);
      b.setAttribute("aria-pressed", String(on));
      b.closest(".q-card")?.classList.toggle("is-seen", on);
      const text = b.dataset.kind === "본문";
      b.querySelector(".lb").textContent = on ? (text ? "읽기 완료 · 다시 누르면 취소" : "공부 완료 · 다시 누르면 취소")
        : (text ? "이 절의 본문을 끝까지 읽었어요" : "이 카드를 끝까지 공부했어요");
    });
    /* 절 페이지: 옆 목차 표시와 진도 */
    const toc = document.getElementById("toc-list");
    if (toc) {
      const links = [...toc.querySelectorAll("a[href^='#']")];
      links.forEach((a) => a.classList.toggle("seen", api.seen(a.getAttribute("href").slice(1))));
      const p = document.querySelector(".toc .progress");
      if (p) p.textContent = `카드 ${links.filter((a) => a.classList.contains("seen")).length}/${links.length} 공부함`;
    }
    /* 대단원 페이지: 절 목록 */
    const rows = document.querySelectorAll(".s-row:not(.uni-off)");   // 학교별 보기로 숨긴 것(.uni-off)은 세지 않는다
    if (rows.length) {
      let sd = 0, st = 0, cd = 0, ct = 0;
      rows.forEach((r) => {
        const c = ids(r), k = c.filter(api.seen).length, ok = r.dataset.std ? api.done(r.dataset.std) : k === c.length && c.length > 0;
        r.classList.toggle("done", ok);
        const m = r.querySelector(".s-cards"); if (m && c.length) m.textContent = `카드 ${k}/${c.length}`;
        if (r.dataset.std) { st++; if (api.done(r.dataset.std)) sd++; }
        ct += c.length; cd += k;
      });
      const up = document.querySelector(".u-prog");
      if (up) up.textContent = `성취기준 ${sd}/${st} 할 수 있음 · 카드 ${cd}/${ct} 공부함`;
    }
    /* 과목 목차: 대단원 막대와 절 표시 */
    const units = document.querySelectorAll(".c-unit:not(.uni-off)");
    if (units.length) {
      let SD = 0, ST = 0, CD = 0, CT = 0;
      units.forEach((u) => {
        let sd = 0, st = 0, cd = 0, ct = 0;
        u.querySelectorAll(".c-secs li:not(.uni-off)").forEach((li) => {
          const c = ids(li), k = c.filter(api.seen).length;
          const ok = li.dataset.std ? api.done(li.dataset.std) : c.length > 0 && k === c.length;
          li.classList.toggle("done", ok);
          if (li.dataset.std) { st++; if (api.done(li.dataset.std)) sd++; }
          ct += c.length; cd += k;
        });
        const i = u.querySelector(".lp-bar i"), t = u.querySelector(".lp-t");
        if (i) i.style.setProperty("--p", st ? (sd / st).toFixed(3) : 0);
        if (t) t.textContent = `성취기준 ${sd}/${st}` + (ct ? ` · 카드 ${cd}/${ct}` : "");
        SD += sd; ST += st; CD += cd; CT += ct;
      });
      const cp = document.querySelector(".c-prog");
      if (cp) cp.innerHTML = `<span class="lp-bar" aria-hidden="true"><i style="--p:${ST ? (SD / ST).toFixed(3) : 0}"></i></span>성취기준 ${SD}/${ST} 할 수 있음 · 카드 ${CD}/${CT} 공부함`;
      /* 책 목차형: 카드별 표시, 절의 카드 진도, '이어서 공부하기'는 아직 끝내지 않은 첫 절로 */
      document.querySelectorAll("[data-card]").forEach((li) => li.classList.toggle("done", api.seen(li.dataset.card)));
      let nextSec = null;
      document.querySelectorAll(".cx-sec:not(.uni-off)").forEach((li) => {
        const c = ids(li), k = c.filter(api.seen).length, b = li.querySelector(".cx-badge");
        /* 절 완료(✓)는 성취기준 체크로, 카드 진도와 '이어서'는 본 카드 수로 판단한다 */
        if (b && c.length) { b.textContent = k === c.length ? "카드 완료" : `카드 ${k}/${c.length}`; b.classList.toggle("ok", k === c.length); }
        if (!nextSec && c.length && k < c.length) nextSec = li;
      });
      const go = document.querySelector(".cx-go");
      if (go && nextSec) { go.href = nextSec.dataset.href; go.textContent = `${CD ? "이어서 공부하기" : "처음부터 공부하기"} · ${nextSec.dataset.title}`; }
      else if (go && CT) { go.textContent = "모든 절을 마쳤습니다 · 처음으로"; }
    }
    listeners.forEach((f) => { try { f(); } catch (e) { console.error(e); } });
  }
  window.addEventListener("storage", (e) => { if (e.key === KEY) { load(); paint(); } });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", paint); else paint();
  return api;
})();
