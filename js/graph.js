/* QURI 개념 지도 (graph.html). 데이터는 빌드가 만든 data/graph.json:
   점 = 과목(c)·대단원(u)·고교 내용(h), 선 = [앞, 뒤, m(소속)|p(선수)]. 색은 학과(univ.css의 --dc와 같은 값). */
(function () {
  "use strict";
  const cv = document.getElementById("gv-canvas"), ctx = cv.getContext("2d");
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const COLORS = {
    light: { common: "#3b7c2a", math: "#c98a12", phy: "#4f7fd6", chem: "#c4553c", astro: "#6b5bc4", stat: "#2f9a8f", ee: "#b0468a", me: "#6f7a3a", hs: "#8a8c84" },
    dark: { common: "#8cc67a", math: "#e0aa3e", phy: "#7fa6ea", chem: "#e58a73", astro: "#a397ec", stat: "#5cc8bc", ee: "#e07fbd", me: "#aab86a", hs: "#7c7c85" },
  };
  const R = { c: 8, u: 3.4, h: 3.6 };
  let G, byId = new Map(), depts = [], show = {}, opt = { units: true, hs: true, member: true, cross: false };
  let view = { x: 0, y: 0, k: 0.35 }, W = 0, H = 0, dpr = 1;
  let hover = null, sel = null, alpha = 1, raf = 0;
  const theme = () => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  const col = (d) => COLORS[theme()][d] || COLORS[theme()].hs;
  const css = (v) => getComputedStyle(document.body).getPropertyValue(v).trim();

  function visible(n) {
    if (n.k === "u" && !opt.units) return false;
    if (n.k === "h") return opt.hs && n.out.some((m) => show[m.d]);
    return !!show[n.d];
  }

  /* ── 배치: 학과마다 원 둘레의 한 자리(공통은 가운데)에서 시작해 힘으로 퍼진다 ── */
  function seed() {
    const others = depts.filter((d) => d.id !== "common");
    const anchor = { common: [0, 0], hs: [-260, -60] };
    others.forEach((d, i) => {
      const a = (i / others.length) * Math.PI * 2 - Math.PI / 2;
      anchor[d.id] = [Math.cos(a) * 1100, Math.sin(a) * 1100];
    });
    const courses = G.nodes.filter((n) => n.k === "c");
    const per = {};
    for (const c of courses) (per[c.d] = per[c.d] || []).push(c);
    for (const [d, list] of Object.entries(per)) {
      list.sort((a, b) => a.y - b.y);
      list.forEach((c, i) => {
        const a = i * 2.399, r = 60 + 34 * Math.sqrt(i + 1) * (d === "common" ? 1.2 : 1);
        c.x = anchor[d][0] + Math.cos(a) * r; c.y = anchor[d][1] + Math.sin(a) * r;
      });
    }
    for (const n of G.nodes) {
      n.ax = (anchor[n.d] || anchor.hs)[0]; n.ay = (anchor[n.d] || anchor.hs)[1];
      if (n.k === "u") { const c = byId.get(n.c), a = n.n * 1.1; n.x = c.x + Math.cos(a) * 30; n.y = c.y + Math.sin(a) * 30; }
      if (n.k === "h") { n.x = n.ax + (Math.random() - 0.5) * 300; n.y = n.ay + (Math.random() - 0.5) * 300; }
      n.vx = 0; n.vy = 0;
    }
  }

  function tick() {
    const N = G.nodes, cell = 90, grid = new Map();
    for (const n of N) {
      const key = Math.floor(n.x / cell) + "," + Math.floor(n.y / cell);
      (grid.get(key) || grid.set(key, []).get(key)).push(n);
    }
    for (const n of N) {
      const gx = Math.floor(n.x / cell), gy = Math.floor(n.y / cell);
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
        const b = grid.get(gx + i + "," + (gy + j));
        if (!b) continue;
        for (const m of b) {
          if (m === n) continue;
          let dx = n.x - m.x, dy = n.y - m.y, d2 = dx * dx + dy * dy;
          if (d2 > cell * cell) continue;
          if (d2 < 1) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; d2 = 1; }
          const f = (n.k === "c" || m.k === "c" ? 1400 : 500) / d2 * alpha;
          n.vx += dx * f / Math.sqrt(d2) * 0.5; n.vy += dy * f / Math.sqrt(d2) * 0.5;
        }
      }
    }
    // 과목끼리는 더 멀리까지 밀어내 이름이 겹치지 않게 한다
    const C = G.courses;
    for (let i = 0; i < C.length; i++) for (let j = i + 1; j < C.length; j++) {
      const a = C[i], b = C[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
      if (d2 > 260 * 260) continue;
      const d = Math.sqrt(d2) || 1, f = 9000 / Math.max(d2, 100) * alpha / d;
      a.vx += dx * f; a.vy += dy * f; b.vx -= dx * f; b.vy -= dy * f;
    }
    for (const L of G.L) {
      const a = L.a, b = L.b, dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
      const len = L.t === "m" ? 42 : 160, s = (L.t === "m" ? 0.08 : 0.006) * alpha;
      const f = (d - len) / d * s;
      a.vx += dx * f; a.vy += dy * f; b.vx -= dx * f; b.vy -= dy * f;
    }
    for (const n of N) {
      const g = n.k === "c" ? 0.006 : 0.002;
      n.vx += (n.ax - n.x) * g * alpha; n.vy += (n.ay - n.y) * g * alpha;
      if (n === drag.node) { n.vx = n.vy = 0; continue; }
      n.vx *= 0.82; n.vy *= 0.82;
      const v = Math.hypot(n.vx, n.vy); if (v > 40) { n.vx *= 40 / v; n.vy *= 40 / v; }
      n.x += n.vx; n.y += n.vy;
    }
    alpha *= 0.985;
  }

  /* ── 그리기 ── */
  function focusSet() {
    const f = sel || hover;
    if (!f) return null;
    const s = new Set([f]);
    for (const L of f.links) s.add(L.a === f ? L.b : L.a);
    if (f.k === "c") for (const u of f.units) { s.add(u); for (const L of u.links) if (L.t === "p") s.add(L.a === u ? L.b : L.a); }
    return s;
  }
  function draw() {
    raf = 0;
    if (!G) return;
    if (alpha > 0.02) { tick(); tick(); schedule(); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.translate(W / 2 + view.x, H / 2 + view.y); ctx.scale(view.k, view.k);
    const F = focusSet(), dim = (n) => F && !F.has(n);
    const lw = 1 / view.k;
    for (const L of G.L) {
      if (!L.a.vis || !L.b.vis) continue;
      if (L.t === "m" && !opt.member) continue;
      if (L.t === "p" && opt.cross && (L.a.d === L.b.d || L.a.d === "hs")) continue;
      const on = F && F.has(L.a) && F.has(L.b) && (F.size < 2 || L.a === (sel || hover) || L.b === (sel || hover) || (sel || hover).k === "c");
      ctx.globalAlpha = F ? (on ? 0.9 : 0.04) : (L.t === "m" ? 0.28 : 0.22);
      ctx.strokeStyle = col(L.t === "m" ? L.a.d : L.b.d);
      ctx.lineWidth = (L.t === "m" ? 0.8 : on ? 1.6 : 1) * lw;
      ctx.beginPath(); ctx.moveTo(L.a.x, L.a.y); ctx.lineTo(L.b.x, L.b.y); ctx.stroke();
      if (L.t === "p" && (on || view.k > 1.4)) arrow(L.a, L.b, lw);
    }
    for (const n of G.nodes) {
      if (!n.vis) continue;
      ctx.globalAlpha = dim(n) ? 0.12 : 1;
      ctx.fillStyle = col(n.d);
      const r = R[n.k] * (view.k < 0.3 ? 0.3 / view.k : 1) ** 0.6;
      if (n.k === "h") { ctx.fillRect(n.x - r, n.y - r, r * 2, r * 2); }
      else {
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 7); ctx.fill();
        if (n.k === "c") { ctx.lineWidth = 2 * lw; ctx.strokeStyle = css("--gv-bg"); ctx.stroke(); }
      }
      if (n === sel) { ctx.lineWidth = 2.5 * lw; ctx.strokeStyle = css("--gv-ink-max"); ctx.beginPath(); ctx.arc(n.x, n.y, r + 4 * lw, 0, 7); ctx.stroke(); }
    }
    // 글자는 화면 좌표로 (확대해도 크기가 같다)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    // 겹치는 이름은 그리지 않는다: 고른 점 → 과목 → 대단원 순서로 자리를 차지한다
    const taken = [], f0 = sel || hover;
    const order = G.nodes.filter((n) => n.vis).sort((a, b) => (b === f0) - (a === f0) || (a.k === "c" ? 0 : 1) - (b.k === "c" ? 0 : 1));
    for (const n of order) {
      const hot = F && F.has(n);
      if (F && !hot) continue;
      if (!hot && !(n.k === "c" ? view.k > 0.15 : view.k > 1.4)) continue;
      const sx = W / 2 + view.x + n.x * view.k, sy = H / 2 + view.y + n.y * view.k;
      if (sx < -100 || sx > W + 100 || sy < -20 || sy > H + 20) continue;
      ctx.font = (n.k === "c" || n === f0 ? "600 12.5px " : "11.5px ") + "Pretendard, system-ui, sans-serif";
      const w = ctx.measureText(n.t).width, ty = sy + R[n.k] * Math.max(view.k, 0.5) + 4;
      const box = [sx - w / 2 - 2, ty - 1, sx + w / 2 + 2, ty + 15];
      if (n !== f0 && taken.some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) continue;
      taken.push(box);
      ctx.globalAlpha = n.k === "c" || hot ? 1 : 0.8;
      ctx.fillStyle = css(n.k === "c" || n === f0 ? "--gv-ink-strong" : "--gv-ink-2");
      ctx.fillText(n.t, sx, ty);
    }
    ctx.globalAlpha = 1;
  }
  function arrow(a, b, lw) {
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, r = R[b.k] + 2;
    const x = b.x - dx / d * r, y = b.y - dy / d * r, s = 6 * lw;
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.lineTo(x - dx / d * s - dy / d * s * 0.5, y - dy / d * s + dx / d * s * 0.5);
    ctx.lineTo(x - dx / d * s + dy / d * s * 0.5, y - dy / d * s - dx / d * s * 0.5);
    ctx.closePath(); ctx.fillStyle = ctx.strokeStyle; ctx.fill();
  }
  const schedule = () => { if (!raf) raf = requestAnimationFrame(draw); };

  function resize() {
    const r = cv.getBoundingClientRect(); dpr = window.devicePixelRatio || 1;
    W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; schedule();
  }
  function fit(nodes) {
    nodes = (nodes || G.nodes).filter((n) => n.vis);
    if (!nodes.length) return;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const n of nodes) { x0 = Math.min(x0, n.x); y0 = Math.min(y0, n.y); x1 = Math.max(x1, n.x); y1 = Math.max(y1, n.y); }
    view.k = Math.min(2.5, 0.9 * Math.min(W / (x1 - x0 + 80), H / (y1 - y0 + 80)));
    view.x = -(x0 + x1) / 2 * view.k; view.y = -(y0 + y1) / 2 * view.k; schedule();
  }
  function center(n, k) { view.k = Math.max(view.k, k || 1.4); view.x = -n.x * view.k; view.y = -n.y * view.k; schedule(); }

  /* ── 입력: 끌기·확대·누르기 ── */
  const toWorld = (sx, sy) => [(sx - W / 2 - view.x) / view.k, (sy - H / 2 - view.y) / view.k];
  function pick(sx, sy) {
    const [x, y] = toWorld(sx, sy);
    let best = null, bd = (10 / view.k) ** 2;
    for (const n of G.nodes) {
      if (!n.vis) continue;
      const d = (n.x - x) ** 2 + (n.y - y) ** 2, r = (R[n.k] + 6 / view.k) ** 2;
      if (d < Math.max(bd, r) && (!best || d < bd)) { best = n; bd = d; }
    }
    return best;
  }
  const pts = new Map(), drag = { node: null, moved: false, pinch: 0 };
  let lastTap = { t: 0, n: null };
  cv.addEventListener("pointerdown", (e) => {
    cv.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, [e.offsetX, e.offsetY]);
    drag.moved = false;
    if (pts.size === 2) { const [a, b] = [...pts.values()]; drag.pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); drag.node = null; }
    else drag.node = pick(e.offsetX, e.offsetY);
  });
  cv.addEventListener("pointermove", (e) => {
    const p = pts.get(e.pointerId);
    if (!p) { const h = pick(e.offsetX, e.offsetY); if (h !== hover) { hover = h; cv.style.cursor = h ? "pointer" : ""; schedule(); } return; }
    const dx = e.offsetX - p[0], dy = e.offsetY - p[1];
    if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
    pts.set(e.pointerId, [e.offsetX, e.offsetY]);
    if (pts.size === 2) {
      const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      zoomAt((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, d / (drag.pinch || d)); drag.pinch = d; return;
    }
    if (drag.node && drag.moved) { const [x, y] = toWorld(e.offsetX, e.offsetY); drag.node.x = x; drag.node.y = y; alpha = Math.max(alpha, 0.15); }
    else if (!drag.node) { view.x += dx; view.y += dy; }
    schedule();
  });
  const up = (e) => {
    pts.delete(e.pointerId);
    if (pts.size) return;
    if (!drag.moved) {
      const n = pick(e.offsetX, e.offsetY), now = Date.now();
      if (n && n.p && lastTap.n === n && now - lastTap.t < 400) { location.href = n.p; return; }
      lastTap = { t: now, n };
      select(n);
    }
    drag.node = null;
  };
  cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
  function zoomAt(sx, sy, f) {
    const k = Math.min(6, Math.max(0.05, view.k * f)); f = k / view.k;
    view.x = (view.x - (sx - W / 2)) * f + (sx - W / 2); view.y = (view.y - (sy - H / 2)) * f + (sy - H / 2); view.k = k; schedule();
  }
  cv.addEventListener("wheel", (e) => { e.preventDefault(); zoomAt(e.offsetX, e.offsetY, Math.exp(-e.deltaY * 0.0015)); }, { passive: false });

  /* ── 오른쪽 패널 ── */
  const dname = (d) => (depts.find((x) => x.id === d) || { name: "고등학교" }).name;
  const chip = (n) => `<button type="button" class="gv-chip" data-go="${esc(n.id)}"><i style="background:${col(n.d)}"></i>${esc(n.k === "u" ? byId.get(n.c).t + " · " + n.n + ". " + n.t : n.t)}</button>`;
  function list(title, arr, empty) {
    return `<h3>${title}</h3>` + (arr.length ? `<div class="gv-chips">${arr.map(chip).join("")}</div>` : `<p class="gv-none">${empty}</p>`);
  }
  function select(n) {
    sel = n; schedule();
    const panel = $("gv-panel");
    if (!n) { panel.hidden = true; history.replaceState(null, "", location.pathname + location.search.replace(/[?&]u=[^&]*/, "").replace(/^&/, "?")); return; }
    const pre = n.links.filter((L) => L.t === "p" && L.b === n).map((L) => L.a);
    const post = n.links.filter((L) => L.t === "p" && L.a === n).map((L) => L.b);
    let h = `<p class="gv-course mono"><span style="color:${col(n.d)}">●</span> ${esc(dname(n.d))}</p>`;
    if (n.k === "u") {
      const c = byId.get(n.c);
      h += `<p class="gv-course mono"><a href="${esc(c.p)}">${esc(c.t)}</a> · 대단원 ${n.n}</p><h2>${esc(n.t)}</h2>`
        + `<a class="gv-open" href="${esc(n.p)}">대단원 열기</a>`
        + list("먼저 볼 것", pre, "이 대단원에 표시된 선수 내용이 없습니다.")
        + list("이 대단원을 쓰는 곳", post, "아직 이 대단원을 선수로 쓰는 곳이 표시되지 않았습니다.");
    } else if (n.k === "c") {
      const units = n.units;
      const cin = new Set(), cout = new Set();
      for (const u of units) for (const L of u.links) if (L.t === "p") {
        if (L.b === u && L.a.k === "u" && L.a.c !== n.id) cin.add(byId.get(L.a.c));
        if (L.a === u && L.b.c !== n.id) cout.add(byId.get(L.b.c));
      }
      h += `<h2>${esc(n.t)}</h2><p class="gv-prog">${n.y}학년 · 대단원 ${units.length}개</p><a class="gv-open" href="${esc(n.p)}">과목 열기</a>`
        + `<h3>대단원</h3><ol class="gv-blocks gv-secs">${units.map((u) => `<li><a href="${esc(u.p)}">${u.n}. ${esc(u.t)}</a><button type="button" class="gv-chip" data-go="${esc(u.id)}" aria-label="지도에서 보기">보기</button></li>`).join("")}</ol>`
        + list("먼저 들으면 좋은 과목", [...cin], "다른 과목의 대단원에 기대는 곳이 표시되지 않았습니다.")
        + list("이 과목을 쓰는 과목", [...cout], "이 과목을 선수로 쓰는 과목이 표시되지 않았습니다.");
    } else {
      h += `<h2>${esc(n.t)}</h2><p class="gv-prog">고등학교에서 배우는 내용입니다. 기억이 흐리면 <a href="../namunnip-textbook/">나뭇잎 고등학교 교과서</a>에서 먼저 보세요.</p>`
        + list("이 내용을 쓰는 대단원", post, "없음");
    }
    $("gv-detail").innerHTML = h;
    panel.hidden = false;
    const q = new URLSearchParams(location.search); q.set("u", n.id);
    history.replaceState(null, "", "?" + q.toString());
    requestAnimationFrame(resize);
  }
  $("gv-detail").addEventListener("click", (e) => {
    const b = e.target.closest("[data-go]"); if (!b) return;
    const n = byId.get(b.dataset.go); if (!n) return;
    if (!n.vis) { show[n.d] = true; refresh(); }
    select(n); center(n);
  });
  document.querySelector(".gv-close").addEventListener("click", () => { select(null); requestAnimationFrame(resize); });

  /* ── 위쪽 막대와 설정 ── */
  function refresh() {
    for (const n of G.nodes) n.vis = visible(n);
    for (const b of document.querySelectorAll("#gv-depts button")) b.setAttribute("aria-pressed", String(!!show[b.dataset.d]));
    if (sel && !sel.vis) select(null);
    schedule();
  }
  function renderDepts() {
    $("gv-depts").innerHTML = depts.map((d) => `<button type="button" class="gv-course-chip" data-d="${d.id}" aria-pressed="true"><i style="background:${col(d.id)}"></i>${esc(d.short)}</button>`).join("");
  }
  $("gv-depts").addEventListener("click", (e) => {
    const b = e.target.closest("[data-d]"); if (!b) return;
    const d = b.dataset.d, solo = depts.every((x) => show[x.id]);
    if (solo) depts.forEach((x) => { show[x.id] = x.id === d || x.id === "common"; });   // 처음 누르면 그 학과(와 공통)만
    else show[d] = !show[d];
    refresh(); fit(G.nodes.filter((n) => n.vis && n.d === d));
  });
  $("gv-all").addEventListener("click", () => { depts.forEach((x) => { show[x.id] = true; }); refresh(); fit(); });
  for (const k of ["units", "hs", "member", "cross"]) $("gv-" + k).addEventListener("change", (e) => { opt[k] = e.target.checked; refresh(); });
  $("gv-gear").addEventListener("click", (e) => {
    const s = $("gv-settings"); s.hidden = !s.hidden; e.currentTarget.setAttribute("aria-expanded", String(!s.hidden));
  });
  $("gv-fit").addEventListener("click", () => fit());
  $("gv-search").addEventListener("change", (e) => {
    const q = e.target.value.trim().toLowerCase(); if (!q) return;
    const n = G.nodes.find((x) => x.label.toLowerCase() === q) || G.nodes.find((x) => x.t.toLowerCase().includes(q));
    if (!n) { e.target.setCustomValidity("찾는 과목이나 대단원이 없습니다"); e.target.reportValidity(); return; }
    e.target.setCustomValidity("");
    if (!n.vis) { show[n.d] = true; if (n.k === "u") opt.units = $("gv-units").checked = true; refresh(); }
    select(n); center(n); e.target.blur();
  });
  new MutationObserver(() => { renderDepts(); refresh(); if (sel) select(sel); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  addEventListener("resize", resize);
  setTimeout(() => $("gv-hint").classList.add("off"), 6000);

  fetch("data/graph.json").then((r) => r.json()).then((data) => {
    G = data; depts = data.depts;
    for (const n of G.nodes) { n.links = []; n.out = []; n.units = []; byId.set(n.id, n); }
    G.L = G.links.map(([a, b, t]) => ({ a: byId.get(a), b: byId.get(b), t }));
    G.courses = G.nodes.filter((n) => n.k === "c");
    for (const L of G.L) {
      L.a.links.push(L); L.b.links.push(L);
      if (L.t === "m") L.b.units.push(L.a);
      if (L.a.k === "h") L.a.out.push(L.b);
    }
    for (const n of G.nodes) {
      n.units.sort((a, b) => a.n - b.n);
      n.label = n.k === "u" ? byId.get(n.c).t + " · " + n.t : n.k === "c" ? n.t : "고교 · " + n.t;
    }
    $("gv-names").innerHTML = G.nodes.filter((n) => n.k !== "h").map((n) => `<option value="${esc(n.label)}">`).join("");
    const q = new URLSearchParams(location.search), qd = q.get("d");
    depts.forEach((d) => { show[d.id] = !qd || d.id === qd || d.id === "common"; });
    renderDepts(); seed(); resize();
    for (let i = 0; i < 260; i++) tick();
    refresh();
    const qn = byId.get(q.get("u") || "");
    if (qn) { if (!qn.vis) { show[qn.d] = true; refresh(); } fit(); select(qn); center(qn, 1.6); }
    else fit(qd ? G.nodes.filter((n) => n.vis && n.d === qd) : null);
  }).catch(() => {
    $("gv-hint").textContent = "개념 지도 데이터를 불러오지 못했습니다. 잠시 뒤 다시 열어 보세요.";
  });
})();
