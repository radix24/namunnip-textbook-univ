/* 내 학습 기록 페이지: QProgress(js/progress.js)의 기록을 과목별로 모아 보여 주고, 내보내기·가져오기·지우기를 한다.
   과목·대단원·성취기준·카드 목록은 빌드가 만든 data/univ.json(전 학과 합본)에서 읽는다 */
fetch("data/univ.json").then((r) => r.json()).then((U) => {
  "use strict";
  const P = window.QProgress;
  if (!P) return;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const $ = (id) => document.getElementById(id);
  let showAll = false;
  const ago = (ts) => {
    const m = Math.round((Date.now() - ts) / 60000);
    if (m < 1) return "방금"; if (m < 60) return `${m}분 전`;
    const h = Math.round(m / 60); if (h < 24) return `${h}시간 전`;
    const d = Math.round(h / 24); return d < 30 ? `${d}일 전` : new Date(ts).toLocaleDateString("ko-KR");
  };

  function draw() {
    /* 요약 */
    let sd = 0, cs = 0, active = 0, stdAll = 0, cardAll = 0;
    const rows = [];
    U.forEach((d) => d.courses.forEach((c) => {
      let s = 0, sT = 0, k = 0, kT = 0;
      const units = c.units.map((u) => {
        const us = u.s.filter((x) => P.done(x.c)).length;
        const ids = [...u.s.flatMap((x) => x.k || []), ...(u.r || [])];
        const uk = ids.filter(P.seen).length;
        s += us; sT += u.s.length; k += uk; kT += ids.length;
        return { u, us, ut: u.s.length, uk, ukt: ids.length };
      });
      sd += s; cs += k; stdAll += sT; cardAll += kT;
      if (s || k) active++;
      rows.push({ d, c, s, sT, k, kT, units });
    }));
    $("r-stats").innerHTML = [
      ["할 수 있는 성취기준", `${sd}`, `/ ${stdAll}`],
      ["공부한 카드", `${cs}`, `/ ${cardAll}`],
      ["공부 중인 과목", `${active}`, ""],
    ].map(([a, b, c]) => `<div><dt>${a}</dt><dd><b>${b}</b> <span class="dim">${c}</span></dd></div>`).join("");

    /* 최근 방문 */
    const vs = P.visits();
    $("r-visits").innerHTML = vs.length ? vs.slice(0, 12).map((v) => `<li><a href="${esc(v.href)}"><span class="t">${esc(v.title)}</span><span class="small dim">${esc(v.sub || "")}</span><span class="mono small dim">${ago(v.ts)}</span></a></li>`).join("")
      : `<li class="dim small">아직 연 절이 없습니다. <a href="./?pick">학과를 고르고</a> 1학년 과목부터 시작해 보세요.</li>`;

    /* 과목별 */
    const list = rows.filter((r) => showAll || r.s || r.k);
    $("r-courses").innerHTML = list.length ? list.map((r) => `
      <section class="r-course">
        <div class="r-head">
          <span class="mono small dim">${esc(r.d.short)}${(r.c.sub || []).length ? ` · ${esc(r.c.sub.join(" / "))}` : ""}</span>
          <h3><a href="${esc(r.c.path)}">${esc(r.c.name)}</a></h3>
          <p class="mono small"><span class="lp-bar" aria-hidden="true"><i style="--p:${r.sT ? (r.s / r.sT).toFixed(3) : 0}"></i></span>성취기준 ${r.s}/${r.sT}${r.kT ? ` · 카드 ${r.k}/${r.kT}` : ""}</p>
        </div>
        <ol class="r-units">${r.units.map((x) => `<li class="${x.us === x.ut ? "done" : ""}"><a href="${esc(r.c.path)}${x.u.n}.html"><span class="mono">${+x.u.n}</span><span class="t">${esc(x.u.t)}</span><span class="mono small dim">${x.us}/${x.ut}${x.ukt ? ` · 카드 ${x.uk}/${x.ukt}` : ""}</span></a></li>`).join("")}</ol>
      </section>`).join("")
      : `<p class="dim small">아직 기록이 없습니다. 카드를 공부한 뒤 "끝까지 공부했어요"를 누르거나 성취기준을 점검해 보세요.</p>`;
  }

  $("r-all").addEventListener("click", (e) => { showAll = !showAll; e.target.textContent = showAll ? "기록이 있는 과목만 보기" : "모든 과목 보기"; draw(); });
  $("r-export").addEventListener("click", () => {
    const blob = new Blob([P.export()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `quri-학습기록-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    $("r-msg").textContent = "내보냈습니다.";
  });
  $("r-import").addEventListener("change", async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { P.import(await f.text()); $("r-msg").textContent = "가져왔습니다. 지금 기록과 합쳤습니다."; }
    catch (err) { $("r-msg").textContent = `가져오지 못했습니다: ${err.message}`; }
    e.target.value = "";
  });
  $("r-reset").addEventListener("click", () => {
    if (!confirm("이 브라우저의 QURI 학습 기록을 모두 지울까요? 되돌릴 수 없습니다. 먼저 파일로 내보내 두기를 권합니다.")) return;
    P.reset(); $("r-msg").textContent = "지웠습니다.";
  });
  P.onChange(draw);
  draw();
}).catch((e) => { const el = document.getElementById("r-courses"); if (el) el.innerHTML = `<p class="dim small">과목 목록을 불러오지 못했습니다(${e.message}).</p>`; });
