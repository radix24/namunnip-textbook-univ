/* 나뭇잎 디지털 교과서 — 공통 도구 (모든 페이지가 먼저 불러온다) */
window.NM = (() => {
  "use strict";

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const C = {
    ink: "#232326", ink2: "#5d5d61", ink3: "#8d8d92", rule: "#d9dad2",
    paper: "#f3f4ef", card: "#fbfbf8", leaf: "#74ab66", forest: "#3b7c2a", sprout: "#b5d7ac",
    warn: "#b5532f", night: "#1c1e1b", amber: "#e0a02a", apple: "#d4493a",
  };
  const F = {
    mono: '"IBM Plex Mono", ui-monospace, Menlo, monospace',
    sans: '"Pretendard Variable", Pretendard, -apple-system, "Apple SD Gothic Neo", sans-serif',
    serif: "Newsreader, Georgia, serif",
  };
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const ease = (t) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  /* 캔버스를 CSS 크기 × DPR로 맞춘다. 첫 그리기는 ResizeObserver 첫 콜백에서. */
  function fit(canvas, draw) {
    const ctx = canvas.getContext("2d");
    const size = { w: 0, h: 0 };
    const resize = (first) => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      size.w = canvas.clientWidth; size.h = canvas.clientHeight;
      canvas.width = Math.round(size.w * dpr); canvas.height = Math.round(size.h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (draw && first !== true) draw();
    };
    new ResizeObserver(() => resize()).observe(canvas);
    resize(true);
    return { ctx, size };
  }

  /* 화면에 보일 때만 도는 루프. frame(dt)가 false를 돌려주면 다음 프레임을 쉰다. */
  function loop(el, frame) {
    let on = false, raf = 0, last = 0;
    const tick = (now) => {
      const dt = clamp((now - last) / 1000, 0, 0.05); last = now;
      frame(dt);
      if (on) raf = requestAnimationFrame(tick);
    };
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !on) { on = true; last = performance.now(); raf = requestAnimationFrame(tick); }
      else if (!e.isIntersecting) { on = false; cancelAnimationFrame(raf); }
    }, { threshold: 0.05 }).observe(el);
  }

  /* 축 눈금 도우미 */
  function axes(ctx, o) {
    // o: {x0,y0,w,h, xt:[[v,label]], yt:[[v,label]], X, Y, xlabel, ylabel}
    ctx.save();
    ctx.font = `10.5px ${F.mono}`; ctx.strokeStyle = C.rule; ctx.fillStyle = C.ink3; ctx.lineWidth = 1;
    for (const [v, lab] of o.xt || []) {
      const x = Math.round(o.X(v)) + .5;
      ctx.beginPath(); ctx.moveTo(x, o.y0); ctx.lineTo(x, o.y0 + o.h); ctx.stroke();
      ctx.textAlign = "center"; ctx.fillText(lab, x, o.y0 + o.h + 14);
    }
    for (const [v, lab] of o.yt || []) {
      const y = Math.round(o.Y(v)) + .5;
      ctx.beginPath(); ctx.moveTo(o.x0, y); ctx.lineTo(o.x0 + o.w, y); ctx.stroke();
      ctx.textAlign = "right"; ctx.fillText(lab, o.x0 - 5, y + 3);
    }
    if (o.xlabel) { ctx.textAlign = "right"; ctx.fillText(o.xlabel, o.x0 + o.w, o.y0 + o.h + 28); }
    if (o.ylabel) { ctx.textAlign = "left"; ctx.fillText(o.ylabel, o.x0, o.y0 - 7); }
    ctx.restore();
  }

  /* 브랜드 심볼 스프라이트: QURI 마크(고리 = Q, 꼬리 네모 = 증명 끝 ∎). BRAND.md 3절 */
  const SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><symbol id="nm" viewBox="0 0 64 64"><circle cx="29" cy="29" r="19" fill="none" stroke="currentColor" stroke-width="9"/><rect x="40" y="40" width="16" height="16" rx="2" fill="#F2B33D"/></symbol></svg>`;
  document.body.insertAdjacentHTML("afterbegin", SPRITE);

  /* 다크 모드: <head>의 짧은 스크립트가 첫 그리기 전에 html[data-theme]를 정한다. 여기서는 상단바 버튼만 잇는다.
     저장 값(localStorage "quri-theme")이 없으면 운영체제 설정을 따른다. */
  const THEME_KEY = "quri-theme", html = document.documentElement;
  const setTheme = (t) => {
    html.dataset.theme = t;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = t === "dark" ? "#12131c" : "#f5f5f2";
    document.querySelectorAll(".theme-btn").forEach((b) => b.setAttribute("aria-pressed", String(t === "dark")));
  };
  const savedTheme = () => { try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; } };   // 저장소를 막은 브라우저
  setTheme(html.dataset.theme === "dark" ? "dark" : "light");
  document.querySelectorAll(".theme-btn").forEach((b) => b.addEventListener("click", () => {
    const t = html.dataset.theme === "dark" ? "light" : "dark";
    try { localStorage.setItem(THEME_KEY, t); } catch (e) { console.warn("테마를 저장하지 못함", e); }
    setTheme(t);
  }));
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    if (!savedTheme() && !/[?&]theme=/.test(location.search)) setTheme(e.matches ? "dark" : "light");
  });

  /* 학술 용어 표시: 영어(기본) ↔ 한글. 빌드가 용어마다 두 형태를 넣어 두고(tools/terms.py) html[data-terms]로 하나만 보인다.
     <head>의 짧은 스크립트가 첫 그리기 전에 저장 값(localStorage "quri-terms")을 읽는다. 버튼은 다크 모드 버튼 앞에 붙인다. */
  const TERMS_KEY = "quri-terms";
  const setTerms = (v) => {
    html.dataset.terms = v;
    document.querySelectorAll(".terms-btn").forEach((b) => {
      b.textContent = v === "ko" ? "용어 한글" : "용어 EN";
      b.setAttribute("aria-label", v === "ko" ? "학술 용어를 영어로 보기" : "학술 용어를 한글로 보기");
    });
  };
  if (document.querySelector(".tm") || document.body.dataset.view === "exam" || /exam\.html$/.test(location.pathname)) {
    document.querySelectorAll(".theme-btn").forEach((tb) => {
      if (tb.parentElement.querySelector(".terms-btn")) return;
      const b = document.createElement("button");
      b.type = "button"; b.className = "terms-btn mono"; b.title = "학술 용어를 영어·한글로 바꿔 보기";
      tb.before(b);
      b.addEventListener("click", () => {
        const v = html.dataset.terms === "ko" ? "en" : "ko";
        try { localStorage.setItem(TERMS_KEY, v); } catch (e) { console.warn("용어 표시를 저장하지 못함", e); }
        setTerms(v);
      });
    });
  }
  setTerms(html.dataset.terms === "ko" ? "ko" : "en");

  /* 확인 문제: 고르면 맞든 틀리든 '왜'를 보여 준다 */
  document.querySelectorAll(".quiz").forEach((q) => {
    const opts = [...q.querySelectorAll("button.opt")];
    opts.forEach((b) => b.addEventListener("click", () => {
      b.classList.add(b.dataset.ok === "1" ? "right" : "wrong");
      b.setAttribute("aria-pressed", "true");
      if (b.dataset.ok === "1") q.dataset.done = "1";
      q.dispatchEvent(new CustomEvent("answered", { bubbles: true, detail: { button: b, ok: b.dataset.ok === "1" } }));
    }));
  });

  /* 주제 페이지 목차: 보고 있는 카드 표시 + 푼 문제 수 */
  const toc = document.querySelector(".toc");
  if (toc) {
    const links = [...toc.querySelectorAll("a[href^='#']")];
    const cards = links.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id));
    }), { rootMargin: "-40% 0px -55% 0px" });
    cards.forEach((c) => io.observe(c));
    const prog = toc.querySelector(".progress");
    const upd = () => {
      const qs = [...document.querySelectorAll(".quiz")];
      if (prog) prog.textContent = `확인 문제 ${qs.filter((q) => q.dataset.done).length} / ${qs.length}`;
    };
    document.addEventListener("answered", upd); upd();
  }

  /* 절(section) 페이지: <body data-course="is1" data-sec="3-3"> 이면 toc.js로 위치 정보를 채운다 */
  const b = document.body.dataset;
  if (b.course && b.sec && window.TOC) {
    const course = TOC.find((c) => c.id === b.course);
    const flat = [];
    TOC.forEach((c) => c.chapters.forEach((ch) => ch.sections.forEach((s) => flat.push({ c, ch, s }))));
    const i = flat.findIndex((x) => x.c.id === b.course && `${x.ch.n}-${x.s.n}` === b.sec);
    if (course && i >= 0) {
      const { ch, s } = flat[i];
      const R = ["", "Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ"];
      const crumbs = document.querySelector(".crumbs");
      if (crumbs) crumbs.innerHTML = `<span aria-hidden="true">/</span><a href="./">${course.name}</a><span aria-hidden="true">/</span><span>${R[ch.n]}. ${ch.title}</span><span aria-hidden="true">/</span><b>${ch.n}.${s.n} ${s.title}</b>`;
      const meta = document.querySelector(".topic-hero .meta");
      if (meta) {
        const nc = document.querySelectorAll("article.card:not(.reading)").length, nt = document.querySelectorAll("article.reading").length, nv = document.querySelectorAll(".video-block").length;
        meta.innerHTML = `<span class="tag-pill live">${course.name}</span><span class="tag-pill">${R[ch.n]}. ${ch.title}</span>` +
          (/\d/.test(s.code) ? `<span class="tag-pill">[${s.code}]</span>` : "") +
          `<span class="tag-pill">${[nc && `카드 ${nc}장`, nt && `읽기 ${nt}편`, nv && `영상 ${nv}편`].filter(Boolean).join(" · ")}</span>`;
      }
      document.title = `${ch.n}.${s.n} ${s.title} — ${course.name} · 나뭇잎 디지털 교과서`;
      const nav = document.querySelector("nav.next");
      if (nav) {
        const link = (x, dir) => {
          if (!x || x.c.id !== b.course) return `<div><span class="mono">${dir === "prev" ? "이전 절" : "다음 절"}</span><b>${dir === "prev" ? "과목의 첫 절입니다" : "과목의 마지막 절입니다"}</b></div>`;
          const label = `${x.ch.n}.${x.s.n} ${x.s.title}`;
          if (!x.s.page) return `<div><span class="mono">${dir === "prev" ? "← 이전 절" : "다음 절 →"}</span><b>${label} (준비 중)</b></div>`;
          return `<a href="${x.ch.n}-${x.s.n}.html"><span class="mono">${dir === "prev" ? "← 이전 절" : "다음 절 →"}</span><b>${label}</b></a>`;
        };
        nav.innerHTML = link(flat[i - 1], "prev") + link(flat[i + 1], "next");
      }
    }
  }

  return { reduce, C, F, clamp, ease, fit, loop, axes };
})();

/* 앱으로 설치(PWA)·오프라인: 교과서 최상위의 sw.js를 등록한다. 시험 모드(?test)와 iframe 안에서는 건너뛴다. */
(() => {
  if (!("serviceWorker" in navigator) || !window.isSecureContext) return;
  if (!/^https?:$/.test(location.protocol)) return;   // 데스크톱 앱(tauri://) 안에서는 파일이 이미 내장되어 있다
  if (window !== window.top || /[?&]test\b/.test(location.search)) return;
  const sw = new URL("../sw.js", document.currentScript.src);
  addEventListener("load", () => {
    navigator.serviceWorker.register(sw.href, { scope: new URL("./", sw).href }).catch((e) => console.warn("서비스 워커 등록 실패", e));
    // 학습 기록(localStorage)이 저장 공간 정리로 지워지지 않게 요청한다. 브라우저가 거절할 수 있다.
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  });
})();

/* 카드 글을 한 단계씩: 본문이 아닌 카드에서 소제목이 있는 구역(먼저 읽는 법·전략·풀이·의미…)을 하나씩 펼친다.
   문제(q-prob)와 예측(q-predict)은 늘 보인다. '모두 보기'를 고르면 전부 펼치고, 고른 방식은 localStorage에 둔다. */
(() => {
  const KEY = "quri-steps";
  const cards = [...document.querySelectorAll('article.q-card:not([data-kind="본문"]) > .q-body')]
    .map((body) => ({ body, steps: [...body.children].filter((el) => el.matches("section.q-sec, section.q-meaning") && el.querySelector(":scope > h3")) }))
    .filter((x) => x.steps.length >= 2);
  if (!cards.length) return;
  let mode = "one";
  try { mode = localStorage.getItem(KEY) === "all" ? "all" : "one"; } catch (e) { mode = "one"; }
  const setOpen = (s, on) => {
    s.classList.toggle("open", on);
    const h = s.querySelector(":scope > h3"); h.setAttribute("aria-expanded", String(on));
    h.querySelector(".st-ic").textContent = on ? " ▾" : " ▸";
  };
  cards.forEach(({ body, steps }) => {
    steps.forEach((s, k) => {
      s.classList.add("q-step");
      const h = s.querySelector(":scope > h3");
      h.setAttribute("role", "button"); h.tabIndex = 0;
      const ic = document.createElement("span"); ic.className = "st-ic"; ic.setAttribute("aria-hidden", "true"); h.appendChild(ic);
      const nx = steps[k + 1];
      if (nx) {
        const b = document.createElement("button"); b.type = "button"; b.className = "step-next";
        b.textContent = `다음 · ${nx.querySelector(":scope > h3").firstChild.textContent.trim()} →`;
        b.addEventListener("click", (e) => { e.stopPropagation(); setOpen(s, false); setOpen(nx, true); nx.scrollIntoView({ block: "nearest" }); nx.querySelector(":scope > h3").focus({ preventScroll: true }); });
        s.appendChild(b);
      }
      const toggle = () => { if (mode === "one") setOpen(s, !s.classList.contains("open")); };
      h.addEventListener("click", (e) => { e.stopPropagation(); toggle(); });
      h.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
      s.addEventListener("click", () => { if (mode === "one" && !s.classList.contains("open")) setOpen(s, true); });
    });
    const bar = document.createElement("div"); bar.className = "steps-mode"; bar.setAttribute("role", "group"); bar.setAttribute("aria-label", "글 보기 방식");
    bar.innerHTML = '<button type="button" data-m="one">한 단계씩</button><button type="button" data-m="all">모두 보기</button>';
    body.insertBefore(bar, body.firstChild);
    bar.addEventListener("click", (e) => { const b = e.target.closest("[data-m]"); if (b) apply(b.dataset.m, true); });
  });
  function apply(m, save) {
    mode = m === "all" ? "all" : "one";
    document.querySelectorAll(".steps-mode [data-m]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.m === mode)));
    cards.forEach(({ body, steps }) => { body.classList.toggle("steps-fold", mode === "one"); steps.forEach((s, k) => setOpen(s, mode === "all" || k === 0)); });
    if (save) try { localStorage.setItem(KEY, mode); } catch (e) { /* 저장 못 해도 동작은 한다 */ }
  }
  apply(mode, false);
})();